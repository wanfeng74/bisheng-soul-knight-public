/*
 * 应用更新客户端（自动检查 + 下载 + 安装 + 重启）。
 *
 * 服务端：GET /app-update?version=&platform=
 *   返回 { ok, hasUpdate, force, latest:{version,notes,url,size,md5,platform} }
 *
 * 版本比较说明：服务端 release.version 是更新通道版本（例如 1.1.367），
 * 新游戏自己的版本是 0.1.x。如果直接比 1.1.367 和 0.1.8，会永远提示更新。
 * 所以这里从 latest.url 的包名解析真实应用版本：
 *   8001865309001001.0_1_9-rk.amr -> 0.1.9
 * 只有包名 appid 是 8001865309001001 且平台匹配时才认作新游戏更新；
 * 服务端仍指向旧三角洲包时，新游戏不会误更新。
 *
 * 下载/安装必须走原生层：
 *   updater.download(url,path) -> int
 *   updater.install(path)      -> int
 *   updater.start(appid)       -> int
 * rk 包自带 updater；cvis/rka 也带 updater。缺失时退回 Eric.Shell 执行
 * miniapp_cli，再不行只提示用户去商店，绝不让页面崩。
 *
 * QuickJS 20200705：只用 var/function，不用箭头函数/模板字符串/let/const。
 */

import { nowVersion, updateDir, appid } from '../res/version.js'
import { platform } from '../res/version.js'
import { updater, getEricShell } from './native-mods.js'
import { fileExists } from './native.js'
import { logInfo } from './logger.js'

var BASES = ['http://<SERVER_IP>:16514', 'http://<SERVER_IP>:16513']
var BASE = BASES[0]
var NEW_APPID = '8001865309001001'
var REQUEST_TIMEOUT_MS = 15000
var DOWNLOAD_TIMEOUT_MS = 180000

function nowMs() {
  try { return Date.now() } catch (e) { return new Date().getTime() }
}

function log(msg) {
  try { logInfo('[update] ' + msg) } catch (e) {}
}

/* ---------------- 网络 ---------------- */

function falconHttp() {
  try {
    if (typeof $falcon !== 'undefined' && $falcon && $falcon.jsapi && $falcon.jsapi.http &&
        typeof $falcon.jsapi.http.request === 'function') {
      return { fn: $falcon.jsapi.http.request, owner: $falcon.jsapi.http }
    }
  } catch (e0) {}
  try {
    if (typeof jsapi !== 'undefined' && jsapi && jsapi.http && typeof jsapi.http.request === 'function') {
      return { fn: jsapi.http.request, owner: jsapi.http }
    }
  } catch (e1) {}
  return null
}

function bytesToStr(payload) {
  if (payload == null) return ''
  if (typeof payload === 'string') return payload
  var bytes = null
  try {
    if (typeof Uint8Array !== 'undefined' && payload instanceof Uint8Array) bytes = payload
    else if (typeof ArrayBuffer !== 'undefined' && payload instanceof ArrayBuffer) bytes = new Uint8Array(payload)
    else if (payload.buffer && typeof payload.byteLength === 'number') bytes = new Uint8Array(payload.buffer)
    else if (typeof payload.length === 'number') bytes = payload
  } catch (e) {}
  if (!bytes) {
    try { return JSON.stringify(payload) } catch (e2) { return '' }
  }
  var out = ''
  var i = 0
  while (i < bytes.length) {
    var c = bytes[i++] & 255
    if (c < 128) { out += String.fromCharCode(c); continue }
    if (c >= 192 && c < 224) {
      var c2 = bytes[i++] & 63
      out += String.fromCharCode(((c & 31) << 6) | c2)
    } else if (c >= 224 && c < 240) {
      var c3 = bytes[i++] & 63
      var c4 = bytes[i++] & 63
      out += String.fromCharCode(((c & 15) << 12) | (c3 << 6) | c4)
    } else {
      var c5 = bytes[i++] & 63
      var c6 = bytes[i++] & 63
      var c7 = bytes[i++] & 63
      var cp = ((c & 7) << 18) | (c5 << 12) | (c6 << 6) | c7
      cp -= 0x10000
      out += String.fromCharCode(0xD800 + (cp >> 10), 0xDC00 + (cp & 1023))
    }
  }
  return out
}

function buildUrl(base, path, params) {
  var u = String(base || '').replace(/\/+$/, '') + path
  var parts = []
  if (params) {
    for (var k in params) {
      if (!Object.prototype.hasOwnProperty.call(params, k)) continue
      if (params[k] == null) continue
      parts.push(encodeURIComponent(k) + '=' + encodeURIComponent(String(params[k])))
    }
  }
  if (parts.length) u += (u.indexOf('?') >= 0 ? '&' : '?') + parts.join('&')
  return u
}

/* 单实例请求；失败由外层换下一个 base */
function requestBase(base, path, params) {
  return new Promise(function (resolve) {
    var api = falconHttp()
    if (!api) { resolve({ ok: false, error: 'no-network-api' }); return }
    var done = false
    var watchdog = setTimeout(function () {
      if (done) return
      done = true
      resolve({ ok: false, error: 'timeout' })
    }, REQUEST_TIMEOUT_MS)
    function finish(r) {
      if (done) return
      done = true
      try { clearTimeout(watchdog) } catch (e) {}
      resolve(r)
    }
    var arg = {
      url: buildUrl(base, path, params),
      method: 'GET',
      headers: ['Accept:application/json'],
      timeout: 10
    }
    try {
      var ret = api.fn.call(api.owner, arg)
      if (!ret || typeof ret.then !== 'function') { finish({ ok: false, error: 'not-a-promise' }); return }
      ret.then(function (payload) {
        var v = payload
        try {
          if (v && typeof v === 'object' && (v.result !== undefined || v.error !== undefined)) v = v.result
        } catch (e0) {}
        var text = bytesToStr(v)
        var data = null
        try { data = JSON.parse(text) } catch (e1) { data = null }
        if (data && data.ok === true) finish({ ok: true, data: data })
        else finish({ ok: false, error: (data && data.err) || 'bad-response' })
      }, function (err) {
        finish({ ok: false, error: 'rejected:' + ((err && err.message) || err) })
      })
    } catch (e) {
      finish({ ok: false, error: 'throw:' + ((e && e.message) || e) })
    }
  })
}

/* 优先新服务端（16514），不可用时回退旧服务端（16513）。
 * 旧服务端仍指向三角洲包，新游戏解析到 appid 不同会忽略，不会误更新。 */
function getJson(path, params) {
  var idx = 0
  function next() {
    if (idx >= BASES.length) return Promise.resolve({ ok: false, error: 'all-bases-failed' })
    var base = BASES[idx++]
    return requestBase(base, path, params).then(function (r) {
      if (r && r.ok) return r
      return next()
    })
  }
  return next()
}

/* ---------------- 版本 ---------------- */

export function parseVer(v) {
  var parts = String(v == null ? '' : v).split('.')
  var out = []
  for (var i = 0; i < 3; i++) {
    var n = parseInt(parts[i], 10)
    out.push(isNaN(n) ? 0 : n)
  }
  return out
}

export function compareVer(a, b) {
  var x = parseVer(a)
  var y = parseVer(b)
  for (var i = 0; i < 3; i++) {
    if (x[i] !== y[i]) return x[i] - y[i]
  }
  return 0
}

/* 从包 URL 解析应用版本：.../pkg/8001865309001001.0_1_9-rk.amr -> 0.1.9 */
function gameVersionFromUrl(url, plat) {
  var s = String(url || '')
  var m = /\/([0-9]{6,20})\.([0-9]+)[_]([0-9]+)[_]([0-9]+)-([A-Za-z0-9]+)\.amr(?:[?#].*)?$/.exec(s)
  if (!m) {
    m = /([0-9]{6,20})\.([0-9]+)[_]([0-9]+)[_]([0-9]+)-([A-Za-z0-9]+)\.amr/.exec(s)
  }
  if (!m) return null
  if (m[1] !== NEW_APPID) return null
  if (plat && m[5] && String(m[5]).toLowerCase() !== String(plat).toLowerCase()) return null
  return m[2] + '.' + m[3] + '.' + m[4]
}

export function currentVersion() {
  return nowVersion
}

/* 检查更新。返回 Promise<{ok, hasUpdate, forced, latest, current, error}>，永不 reject。 */
export function checkUpdate() {
  var plat = platform || 'rk'
  return getJson('/app-update', { version: nowVersion, platform: plat }).then(function (r) {
    if (!r || !r.ok || !r.data || !r.data.latest) {
      return { ok: false, hasUpdate: false, forced: false, current: nowVersion, error: (r && r.error) || 'bad-response' }
    }
    var latest = r.data.latest
    var gv = gameVersionFromUrl(latest.url, plat)
    if (!gv) {
      /* 服务端当前指向旧三角洲包，新游戏不认 */
      return { ok: true, hasUpdate: false, forced: false, current: nowVersion, error: 'not-new-app-package' }
    }
    var cmp = compareVer(gv, nowVersion)
    var has = cmp > 0
    var forced = has && Number(r.data.force) === 1
    return {
      ok: true,
      hasUpdate: has,
      forced: forced,
      current: nowVersion,
      latest: {
        version: gv,
        releaseVersion: latest.version || '',
        notes: latest.notes || '',
        url: latest.url || '',
        size: Number(latest.size) || 0,
        md5: latest.md5 || '',
        platform: latest.platform || plat
      }
    }
  }, function (e) {
    return { ok: false, hasUpdate: false, forced: false, current: nowVersion, error: 'exception' }
  })
}

/* ---------------- 下载 / 安装 ---------------- */

export function autoInstallCapable() {
  var mod = updater
  if (mod && typeof mod.download === 'function' && typeof mod.install === 'function') return true
  var eric = null
  try { eric = getEricShell() } catch (e) {}
  return !!(eric && typeof eric.exec === 'function')
}

function destPath(ver) {
  var dir = String(updateDir || '/userdisk/BiShangSoulKnightUpdate').replace(/\/+$/, '')
  return dir + '/update-' + String(ver || 'latest').replace(/[^0-9A-Za-z._-]/g, '_') + '.amr'
}

function runShell(cmd) {
  return new Promise(function (resolve) {
    var eric = null
    try { eric = getEricShell() } catch (e0) {}
    if (!eric || typeof eric.exec !== 'function') { resolve({ ok: false, code: -1, err: 'no-shell' }); return }
    try {
      var r = eric.exec(cmd)
      if (r && typeof r.then === 'function') {
        r.then(function (v) {
          var code = (v && typeof v.exitCode === 'number') ? v.exitCode : (v && v.success === false ? -1 : 0)
          resolve({ ok: code === 0, code: code, err: String(v && v.stderr || '') })
        }, function (e) { resolve({ ok: false, code: -1, err: String(e && e.message || e) }) })
      } else {
        var code = (r && typeof r.exitCode === 'number') ? r.exitCode : 0
        resolve({ ok: code === 0, code: code, err: '' })
      }
    } catch (e) { resolve({ ok: false, code: -2, err: String(e && e.message || e) }) }
  })
}

function shellQuote(s) {
  return "'" + String(s == null ? '' : s).replace(/'/g, "'\\''") + "'"
}

/* 下载更新包。Promise<{ok,path,error}>，永不 reject。 */
export function downloadUpdate(info) {
  return new Promise(function (resolve) {
    if (!info || !info.url || !/^https?:\/\//i.test(info.url)) {
      resolve({ ok: false, error: 'bad-url' }); return
    }
    var path = destPath(info.version)
    var mod = updater
    var done = false
    var timer = setTimeout(function () {
      if (done) return
      done = true
      resolve({ ok: false, error: 'timeout', path: path })
    }, DOWNLOAD_TIMEOUT_MS)
    function finish(r) {
      if (done) return
      done = true
      try { clearTimeout(timer) } catch (e) {}
      resolve(r)
    }
    function after(code, err) {
      var ok = (code === 0)
      var exists = false
      try { exists = fileExists(path) } catch (e0) {}
      if (!ok) { finish({ ok: false, error: err || ('download-code-' + code), path: path }); return }
      /* 以原生退出码为准；fileExists 在部分固件不可用，不能因此误判下载失败 */
      finish({ ok: true, path: path, exists: exists })
    }
    function tryNative() {
      if (mod && typeof mod.download === 'function') {
        try {
          var r = mod.download(info.url, path)
          if (r && typeof r.then === 'function') {
            r.then(function (v) { after(Number(v), 'download-failed') }, function (e) { finish({ ok: false, error: 'reject:' + ((e && e.message) || e), path: path }) })
          } else {
            after(Number(r), 'download-failed')
          }
          return
        } catch (e) { finish({ ok: false, error: 'throw:' + ((e && e.message) || e), path: path }); return }
      }
      finish({ ok: false, error: 'no-download-api', path: path })
    }
    /* 首选 Eric.Shell + curl：rk 上实测可用；updater.download 作为后备。
     * 旧项目下载成功路径也是 Eric.Shell，先走它成功率最高。 */
    var eric = null
    try { eric = getEricShell() } catch (eE) {}
    if (eric && typeof eric.exec === 'function') {
      var dir = path.replace(/\/[^/]+$/, '')
      runShell('/usr/bin/mkdir -p ' + shellQuote(dir)).then(function (m) {
        if (!m.ok) { tryNative(); return }
        runShell('/usr/bin/curl -L -f -s --max-time 120 -o ' + shellQuote(path) + ' ' + shellQuote(info.url)).then(function (c) {
          if (c.ok) { after(0, ''); return }
          tryNative()
        }, function () { tryNative() })
      }, function () { tryNative() })
      return
    }
    tryNative()
  })
}

/* 安装并重启。Promise<{ok,stage,error}>，永不 reject。 */
export function installUpdate(info, path) {
  return new Promise(function (resolve) {
    var mod = updater
    function restart(installOk) {
      if (!installOk) { resolve({ ok: false, stage: 'install' }); return }
      if (mod && typeof mod.start === 'function') {
        try {
          var c = Number(mod.start(appid))
          resolve({ ok: c === 0, stage: 'restart', error: c === 0 ? '' : ('start-code-' + c) })
          return
        } catch (e0) { resolve({ ok: false, stage: 'restart', error: 'start-throw' }); return }
      }
      runShell('/usr/bin/miniapp_cli start ' + shellQuote(appid)).then(function (r) {
        resolve({ ok: r.ok, stage: 'restart', error: r.ok ? '' : (r.err || 'start-failed') })
      }, function () { resolve({ ok: false, stage: 'restart', error: 'start-failed' }) })
    }
    if (mod && typeof mod.install === 'function') {
      var code = -1
      try { code = Number(mod.install(path)) } catch (e1) { resolve({ ok: false, stage: 'install', error: 'install-throw' }); return }
      restart(code === 0)
      return
    }
    runShell('/usr/bin/miniapp_cli install ' + shellQuote(path)).then(function (r) {
      restart(r.ok)
    }, function () { resolve({ ok: false, stage: 'install', error: 'shell-failed' }) })
  })
}

export function fmtSize(n) {
  n = Number(n) || 0
  if (n <= 0) return ''
  if (n < 1024) return n + ' B'
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB'
  return (n / 1024 / 1024).toFixed(2) + ' MB'
}

export function updateBase() { return BASE }
