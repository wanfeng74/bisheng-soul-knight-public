/*
 * 运行日志服务 —— 必须真正落到设备磁盘上。
 *
 * 历史问题: 旧实现只走 require('panet') 写 /userdisk/wanfeng/, 而真机 (X7Pro)
 * 上没有 panet 模块, 于是静默退回内存 + jsapi.storage —— 盘上根本看不到日志。
 *
 * 现在按实证顺序尝试:
 *   1. 原生实例 (全局类 Global 的实例) 的 writeFile —— 同机型「设置+」就是用它
 *      读写 /userdata/cfg/sys_config.conf, 该目录确认可写。
 *      注意原生 writeFile 多为【整体覆盖】, 追加 = 读旧文 + 拼接 + 写回。
 *   2. panet.appendFile (若该机型提供)
 *   3. jsapi.storage (应用私有, 卸载即失)
 *   4. 内存 (仅本次运行可见)
 *
 * 红线: QuickJS 原生函数禁止 .apply()/.call(), 一律直接调用。
 */

import { writeTextFile, readTextFile, readTextFileAsync, fileExists, nativeInstance, makeDir, deletePath, appendTextFile, panetStatus } from './native.js'

/* 依次尝试的日志路径; 第一个写得进去的会被记住 */
var LOG_PATHS = [
  '/userdisk/wanfeng/bishang_soulknight.log',  /* 实测: 真机已有该目录且可写, 首选 */
  '/userdisk/bishang_soulknight.log',
  '/userdata/cfg/bishang_soulknight.log',
  '/userdata/bishang_soulknight.log',
  '/tmp/bishang_soulknight.log',
]
var LOG_DIRS = ['/userdisk/wanfeng', '/userdisk', '/userdata/cfg', '/userdata', '/tmp']

var LOG_KEY = 'bishang_soulknight_logs'
var MAX_CHARS = 40000

var _panet = null
var _panetTried = false
var _path = ''            /* 命中的日志路径 */
var _triedPaths = false
var _writeCount = 0
var _failCount = 0
var _memLines = []
var _storageOk = false
var _lastErr = ''
var _dirTried = false

function _client() {
  if (_panetTried) return _panet
  _panetTried = true
  var P = null
  try {
    if (typeof require === 'function') {
      var m = require('panet')
      if (m) P = m.Panet || m.default || m
    }
  } catch (e) {}
  try {
    if (!P && typeof Panet !== 'undefined') P = Panet
  } catch (e) {}
  if (P) {
    if (typeof P === 'function') {
      try { _panet = new P() } catch (e) { _panet = P }
    } else {
      _panet = P
    }
  }
  return _panet
}

function _storage() {
  try {
    if ($falcon && $falcon.jsapi && $falcon.jsapi.storage) return $falcon.jsapi.storage
  } catch (e) {}
  return null
}

function _mkdirs() {
  if (_dirTried) return
  _dirTried = true
  /* 先用 native.js 的 makeDir (指南 7.3 的 mkdir/mkdirs), 再试 panet */
  for (var i = 0; i < LOG_DIRS.length; i++) {
    try { makeDir(LOG_DIRS[i]) } catch (e) {}
  }
  try {
    var p = _client()
    if (p && typeof p.mkdirs === 'function') {
      for (var k = 0; k < LOG_DIRS.length; k++) {
        try { var r3 = p.mkdirs(LOG_DIRS[k]); if (r3 && r3.catch) r3.catch(function () {}) } catch (e3) {}
      }
    }
  } catch (e4) {}
}

/* 选定一个能写的日志路径 (只做一次)。
 *
 * 【重要】不能用 writeTextFile(p, '') 探测可写性 ——
 * panet 的 writeFile 是"整体覆盖"语义, 而 fileExists 又判断不出这种
 * "只能异步读"的文件是否已存在 (真机自检抓到: fileExists 返回 false 但异步读有内容),
 * 两者叠加的结果是【每次启动都把已有日志清空】。
 * 改用 appendTextFile(p, '') 探测: 追加空串是 no-op, 不会破坏已有内容。 */
function _pickPath() {
  if (_path) return _path
  if (_triedPaths) return ''
  _triedPaths = true
  _mkdirs()
  for (var i = 0; i < LOG_PATHS.length; i++) {
    var p = LOG_PATHS[i]
    if (fileExists(p)) { _path = p; return _path }
    try {
      if (appendTextFile(p, '')) { _path = p; return _path }
    } catch (e) {}
  }
  _lastErr = '所有候选路径都写不进去'
  return ''
}

function _pad2(n) { return (n < 10 ? '0' : '') + n }

function _ts() {
  try {
    var d = new Date()
    return d.getFullYear() + '-' + _pad2(d.getMonth() + 1) + '-' + _pad2(d.getDate()) + ' ' +
           _pad2(d.getHours()) + ':' + _pad2(d.getMinutes()) + ':' + _pad2(d.getSeconds())
  } catch (e) { return '' }
}

/* 追加写。
 * 优先用原生 appendFile (panet 自带, 真机上就有) —— 它是真正的追加, 不读改写;
 * 没有 appendFile 时才退化为「读旧 + 拼 + 写回」(writeFile 是整体覆盖语义)。 */
function _appendNative(line) {
  var path = _pickPath()
  if (!path) return false
  /* 1) 真正的追加 */
  try { if (appendTextFile(path, line)) return true } catch (e0) {}
  /* 2) 退化: 读改写 (仍要截断, 避免文件无限膨胀) */
  var next = line
  try { var old = readTextFile(path) || ''; next = old + line } catch (e) {}
  if (next.length > MAX_CHARS) {
    var cut = next.length - MAX_CHARS
    var idx = next.indexOf('\n', cut)
    if (idx < 0) idx = cut
    next = next.slice(idx + 1)
  }
  if (writeTextFile(path, next)) return true
  return false
}

function _appendPanet(line) {
  var p = _client()
  if (!p || typeof p.appendFile !== 'function') return false
  try {
    var r = p.appendFile(LOG_PATHS[2], line)
    if (r && typeof r.catch === 'function') r.catch(function () {})
    return true
  } catch (e) { return false }
}

/* 平台 storage 的正确用法:
 *   - 参数是对象: getStorage({key}) / setStorage({key, data})
 *   - 返回 Promise, 失败会 reject
 * 旧实现用 getStorage(LOG_KEY) 且不接拒绝 —— 就是一个未处理的 Promise 拒绝,
 * 真机上会直接崩 (测试已复现 Error: nf)。 */
function _swallowP(r) {
  try { if (r && typeof r.then === 'function') r.then(function () {}, function () {}) } catch (e) {}
  return r
}
function _valOf(res) {
  try {
    if (res == null) return ''
    if (typeof res === 'string') return res
    if (res.data != null) return String(res.data)
    if (res.value != null) return String(res.value)
  } catch (e) {}
  return ''
}

/* 【主持久化通道】整段覆盖写 storage ——
 * 真机上 panet 的文件接口（writeFile/appendFile）调用无效，storage 却可用，
 * 所以日志用 storage 存：内存里维护完整尾巴，每隔几行整段覆盖一次，
 * 不依赖 getStorage 的读（读接口在这台固件上返回空）。
 */
var _storageFlushAt = 0
function _flushStorage() {
  try {
    var s = _storage()
    if (!s || typeof s.setStorage !== 'function') return false
    var text = _memLines.join('')
    if (text.length > 20000) text = text.slice(text.length - 20000)
    _swallowP(s.setStorage({ key: LOG_KEY, data: text }))
    _storageOk = true
    return true
  } catch (e) {}
  return false
}

/* 追加到 storage 兜底 (异步, 失败静默) */
function _appendStorage(line) {
  try {
    var s = _storage()
    if (!s || typeof s.getStorage !== 'function') return false
    var w = function (text) {
      try {
        if (typeof s.setStorage === 'function') _swallowP(s.setStorage({ key: LOG_KEY, data: text }))
      } catch (e) {}
    }
    var r = _swallowP(s.getStorage({ key: LOG_KEY }))
    if (r && typeof r.then === 'function') {
      r.then(function (res) {
        var old = _valOf(res)
        var next = old + line
        if (next.length > 20000) {
          var cut = next.length - 20000
          var idx = next.indexOf('\n', cut)
          if (idx < 0) idx = cut
          next = next.slice(idx + 1)
        }
        w(next)
      }, function () { w(line) })
      _storageOk = true
      return true
    }
    /* 同步返回形态 */
    w(_valOf(r) + line)
    _storageOk = true
    return true
  } catch (e) {}
  return false
}

export function initLog() {
  _mkdirs()
  _pickPath()
}

export function log(level, msg) {
  var body = '[' + _ts() + '][' + level + '] ' +
             String(msg == null ? '' : msg).replace(/[\r\n]+/g, ' ')
  var line = body + '\n'
  /* 【实测, 真机 ADB 核实】平台只把 console.warn / console.error 收进
     /userdata/applog/YD_PEN_APP.log, console.log 完全不落盘 ——
     所以这里必须用 warn, 否则应用在设备日志里"隐身", 完全没法排查。
     注意发给 console 的字符串不能带尾部换行, 否则设备日志里每行多一个空行。 */
  try { console.warn(body) } catch (e0) {
    try { console.log(body) } catch (e1) {}
  }

  /* 【内存兜底】panet.appendFile 是异步的，"报成功"并不代表真的落盘 ——
     实测真机上 appendFile 调了之后日志文件仍是空，管理页日志页/反馈日志全为空。
     所以无论原生写结果如何都留一份在内存，readLog() 读不到盘上内容时回退到这里。 */
  _memLines.push(line)
  if (_memLines.length > 400) _memLines.splice(0, _memLines.length - 400)
  _storageFlushAt++
  if ((_storageFlushAt % 3) === 0) _flushStorage()
  /* 文件通道偶发不可用：每 60 行重试一次挑路径（否则一次失败就永久放弃） */
  if (_failCount > 0 && (_failCount % 60) === 0) { _triedPaths = false; _path = '' }
  if (_appendNative(line)) { _writeCount++; return }
  _failCount++
  if (_appendPanet(line)) { _writeCount++; return }
  _appendStorage(line)
}

export function logInfo(msg) { log('INFO', msg) }
export function logWarn(msg) { log('WARN', msg) }
export function logError(msg) { log('ERROR', msg) }

export function startLogger() {
  initLog()
  /* 预热：把 storage 里上次的日志读进内存，管理页/反馈能带上下文 */
  try {
    var sp = _storage()
    if (sp && typeof sp.getStorage === 'function') {
      var r0 = _swallowP(sp.getStorage({ key: LOG_KEY }))
      if (r0 && typeof r0.then === 'function') {
        r0.then(function (res) {
          var v = _valOf(res)
          if (v) {
            var arr = String(v).split('\n')
            for (var i = 0; i < arr.length; i++) { if (arr[i]) _memLines.push(arr[i] + '\n') }
            if (_memLines.length > 400) _memLines.splice(0, _memLines.length - 400)
          }
        }, function () {})
      }
    }
  } catch (eW) {}
  /* 报告 panet 状态而不是 nativeInstance —— 文件能力来自 panet,
     nativeInstance 找不到不代表文件不能用 (之前这行一直显示 native=false, 误导排查) */
  var pn = null
  try { pn = panetStatus() } catch (e) {}
  logInfo('=== logger start === path=' + (_path || '(未定)') +
          ' panet=' + (pn && pn.ok ? 'ok' : 'no') +
          (pn && pn.err ? (' err=' + pn.err) : ''))
}

export function stopLogger() {}
export function flushLogger() {}

export function clearLog() {
  var path = _pickPath()
  if (path) { try { writeTextFile(path, '') } catch (e) {} }
  try {
    var p = _client()
    if (p && typeof p.writeFile === 'function') {
      _swallowP(p.writeFile(LOG_PATHS[0], ''))
    }
  } catch (e2) {}
  _memLines = []
  try {
    var s = _storage()
    /* 参数必须是对象; 且要吃掉拒绝 */
    if (s && typeof s.setStorage === 'function') _swallowP(s.setStorage({ key: LOG_KEY, data: '' }))
  } catch (e3) {}
  return true
}

/*
 * 读取日志全文。
 * 【重要】panet.readFile 返回的是 Promise —— 用同步的 readTextFile 只会拿到空串,
 * 于是日志页永远显示"暂无日志", 哪怕文件里写满了。
 * 所以这里统一返回 Promise, 走异步读; 读不到再退回 storage / 内存。
 * 调用方 (日志页/诊断页) 已同时兼容 Promise 与同步返回值。
 */
export function readLog() {
  return new Promise(function (resolve) {
    var settled = false
    var finish = function (txt) {
      if (settled) return
      settled = true
      resolve(typeof txt === 'string' ? txt : '')
    }
    /* 【关键】真机上 panet/Global 都可能不可用，读盘会一直没有结果 →
       400ms 内没读到内容就用内存日志兜底，保证管理页/反馈永远有东西。 */
    var _memFallbackTimer = setTimeout(function () {
      finish(_memLines.join(''))
    }, 400)
    try { if (_memFallbackTimer && _memFallbackTimer.unref) _memFallbackTimer.unref() } catch (eU) {}
    var fallbackStorage = function () {
      try {
        var p = _client()
        if (p && typeof p.readFile === 'function') {
          var r = p.readFile(LOG_PATHS[0])
          if (r && typeof r.then === 'function') {
            r.then(function (v) { finish(v ? String(v) : storageOrMem()) },
                   function () { finish(storageOrMem()) })
            return
          }
          if (typeof r === 'string' && r) { finish(r); return }
        }
      } catch (e2) {}
      finish(storageOrMem())
    }
    var storageOrMem = function () {
      try {
        var s = _storage()
        if (s && typeof s.getStorage === 'function') {
          var r = _swallowP(s.getStorage({ key: LOG_KEY }))
          if (r && typeof r.then === 'function') {
            r.then(function (res) {
              var v = _valOf(res)
              finish(v || _memLines.join(''))
            }, function () { finish(_memLines.join('')) })
            return
          }
          var v2 = _valOf(r)
          if (v2) { finish(v2); return }
        }
      } catch (e3) {}
      finish(_memLines.join(''))
    }
    var path = _pickPath()
    if (!path) {
      /* 文件路径不可用：先试 storage 里持久化的日志，再退内存 */
      try {
        var s0 = _storage()
        if (s0 && typeof s0.getStorage === 'function') {
          var rr = _swallowP(s0.getStorage({ key: LOG_KEY }))
          if (rr && typeof rr.then === 'function') {
            rr.then(function (res) {
              var v = _valOf(res)
              if (v) { try { clearTimeout(_memFallbackTimer) } catch (eC2) {} finish(v) }
              else fallbackStorage()
            }, function () { fallbackStorage() })
            return
          }
          var v3 = _valOf(rr)
          if (v3) { finish(v3); return }
        }
      } catch (eS0) {}
      fallbackStorage(); return
    }
    readTextFileAsync(path, function (txt) {
      if (txt) { try { clearTimeout(_memFallbackTimer) } catch (eC) {} ; finish(txt) }
      else fallbackStorage()
    })
  })
}

/* 内存里的日志（本次运行，最多 400 行）——文件落盘不可用时用于上报 */
export function memoryText() {
  return _memLines.join('')
}

/* 调试: 获取日志状态 */
export function loggerStatus() {
  return {
    path: _path || '(未定)',
    candidates: LOG_PATHS,
    writes: _writeCount,
    fails: _failCount,
    err: _lastErr,
    storage: _storageOk,
    mem: _memLines.length,
    panet: !!_panet,
    native: (function () { try { return !!nativeInstance() } catch (e) { return false } })(),
  }
}

/* 诊断页用: 强制重新挑一次路径并报告结果 */
export function reprobeLogPath() {
  _path = ''
  _triedPaths = false
  _dirTried = false
  var lines = []
  for (var i = 0; i < LOG_PATHS.length; i++) {
    var p = LOG_PATHS[i]
    var ex = fileExists(p)
    var okWrite = false
    /* 用追加空串探测，不能用 writeTextFile(p,'') —— 那会把已有日志清空 */
    try { okWrite = appendTextFile(p, '') } catch (e) { okWrite = false }
    var back = okWrite ? readTextFile(p) : null
    lines.push(p + '  已存在=' + (ex ? '是' : '否') + '  可写=' + (okWrite ? '是' : '否') +
               '  可回读=' + (back !== null ? '是' : '否'))
  }
  var picked = _pickPath()
  lines.push('最终选用: ' + (picked || '(无可用路径)'))
  return lines
}
