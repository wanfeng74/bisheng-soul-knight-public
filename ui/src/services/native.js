/* 原生模块统一从 native-mods.js 取 (该文件由构建脚本按目标平台生成)。
   官方规范: 原生模块的静态 import 【只能】出现在生成的 native-mods.js 里,
   业务代码不再直接 import 'panet' —— 组合包里 panet 是否存在只能运行时判断,
   由 native-mods.js 的 getPanet() 负责 (单包静态、组合包 tryRequire 懒加载)。
   详见下方 _panetInstance 的说明。 */
import { getPanet } from './native-mods.js'

/*
 * 原生能力层 —— 统一获取平台注入的全局 `Global` 实例。
 *
 * 实证来源 (同机型可用的官方/第三方 .amr 字节码):
 *   · 设置+ 3.6.6 的 deviceinfo.js.bin 原子表: Global → readFile → writeFile → exists
 *     → ... → startTextEdit → closeTextEdit, 以及 Shell / reboot
 *   · cloudbrowser 0.2.31 的 app.js.bin: 只有原子 `Global`, 没有原子 `global`
 * 结论: 运行时直接注入【全局类 Global】, 文件与输入法方法都挂在它的实例上,
 *      不是 require('global')。我们早期只试 require('global'), 真机因此报
 *      「本机输入法不可用」、且读不到设备配置文件。
 *
 * 平台实测: 词典笔文件路径形如 /userdata/cfg/sys_config.conf (key=value 文本)。
 */

var _inst = null
var _tried = false
var _source = ''
var _probe = []

function _log(m) {
  _probe.push(String(m))
  if (_probe.length > 40) _probe.shift()
  /* 同步写一份到设备日志 —— 平台只收 console.warn/error。
     这里不 import logger (会形成循环依赖), 直接调 console.warn。 */
  try { console.warn('[native] ' + m) } catch (e) {}
}
export function nativeProbeLog() { return _probe.slice(0) }
export function nativeSource() { return _source || '(未找到)' }

/* 判断一个对象是否就是我们要找的原生对象。
 * 【必须】用有辨识度的方法名判定:
 *   readFile / listFiles / writeFile / startTextEdit
 * 不能用裸 write —— 太宽泛, 任何带 write 方法的对象 (Node 的 process.stdout、
 * 各种 logger/stream) 都会被误认成原生实例 (实测踩过)。
 * 注意: write 仍是【写文件时】要试的名字 (指南 7.3), 只是不能拿它来【识别】对象。 */
function _hasNative(o) {
  if (!o) return false
  try {
    return typeof o.readFile === 'function'
        || typeof o.listFiles === 'function'
        || typeof o.writeFile === 'function'
        || typeof o.startTextEdit === 'function'
  } catch (e) { return false }
}

function _tryInstance(label, make) {
  try {
    var o = make()
    if (_hasNative(o)) {
      _source = label
      _log(label + ' -> 可用')
      return o
    }
    if (o != null) {
      var keys = ''
      try { keys = Object.keys(o).slice(0, 16).join(',') } catch (e) { keys = '?' }
      _log(label + ' -> 无 readFile/startTextEdit  keys=' + keys)
    }
  } catch (e) {
    _log(label + ' 异常: ' + (e && e.message))
  }
  return null
}

/* 获取原生实例 (带缓存; 找不到返回 null) */
export function nativeInstance() {
  if (_tried) return _inst
  _tried = true

  /* 1) 【主路径】运行时注入的全局类 Global */
  var G = null
  try { G = (typeof globalThis !== 'undefined') ? globalThis.Global : undefined } catch (e) {}
  if (G == null) { try { if (typeof Global !== 'undefined') G = Global } catch (e) {} }
  if (G != null) {
    _log('globalThis.Global 类型 = ' + (typeof G))
    var got = _tryInstance('new Global()', function () {
      return (typeof G === 'function') ? new G() : G
    })
    if (got) { _inst = got; return _inst }
  } else {
    _log('globalThis.Global -> 不存在')
  }

  /* 2) 全局裸函数 (有些机型直接挂全局) */
  try {
    if (typeof startTextEdit === 'function' || typeof readFile === 'function') {
      _source = 'global(bare)'
      _log('global(bare) -> 找到裸函数')
      _inst = {
        startTextEdit: (typeof startTextEdit === 'function') ? startTextEdit : null,
        closeTextEdit: (typeof closeTextEdit === 'function') ? closeTextEdit : null,
        textEditFinished: (typeof textEditFinished !== 'undefined') ? textEditFinished : null,
        readFile: (typeof readFile === 'function') ? readFile : null,
        writeFile: (typeof writeFile === 'function') ? writeFile : null,
        exists: (typeof exists === 'function') ? exists : null,
      }
      return _inst
    }
  } catch (e2) {}

  /* 3) require('global') —— 兜底 (文档写法, 本项目实测机型不适用) */
  try {
    if (typeof require === 'function') {
      var m = require('global')
      _log("require('global') -> " + (m ? 'ok' : 'null'))
      if (m) {
        var got3 = _tryInstance("require('global')", function () {
          var GG = m.Global || m.default || m
          return (typeof GG === 'function') ? new GG() : GG
        })
        if (got3) { _inst = got3; return _inst }
      }
    }
  } catch (e3) { _log("require('global') 失败: " + (e3 && e3.message)) }

  /* 4) 平台对象上 */
  var hosts = [
    ['$falcon.jsapi', (typeof $falcon !== 'undefined' && $falcon && $falcon.jsapi) ? $falcon.jsapi : null],
    ['$falcon', (typeof $falcon !== 'undefined') ? $falcon : null],
    ['jsapi', (typeof jsapi !== 'undefined') ? jsapi : null],
  ]
  for (var i = 0; i < hosts.length; i++) {
    var host = hosts[i][1]
    if (!host) { _log(hosts[i][0] + ' -> 不存在'); continue }
    var got4 = _tryInstance(hosts[i][0], function () { return host })
    if (got4) { _inst = got4; return _inst }
  }

  /* 5) 【暴力扫描】遍历全局变量, 找出带 readFile / startTextEdit 的对象。
   *    不依赖名字 —— 运行时把实例挂在猜不到的名字上也能找到。
   *
   *    ⚠️ 安全约束: 绝不对任意函数盲目 `new` —— 那可能触发平台未知副作用
   *    (在 Node 环境实测会把进程直接带崩)。只对【原型上明确声明了目标方法】
   *    的构造器实例化, 其余一律跳过。 */
  try {
    var names = []
    try { names = Object.getOwnPropertyNames(globalThis) } catch (eN) { names = [] }
    _log('暴力扫描 ' + names.length + ' 个全局变量')
    var hasTargetOnProto = function (fn) {
      var proto = null
      try { proto = fn.prototype } catch (e) { return false }
      if (!proto) return false
      try {
        return typeof proto.readFile === 'function' || typeof proto.startTextEdit === 'function'
      } catch (e2) { return false }
    }
    for (var k = 0; k < names.length; k++) {
      var nm = names[k]
      var val = null
      try { val = globalThis[nm] } catch (eV) { continue }
      if (val == null) continue
      var t = typeof val
      if (t !== 'object' && t !== 'function') continue

      /* 5a) 直接就是可用对象 */
      if (_hasNative(val)) {
        _source = 'global.' + nm
        _log('暴力扫描命中 global.' + nm)
        _inst = val
        return _inst
      }

      /* 5b) 构造器: 只有原型上声明了目标方法才实例化 */
      if (t === 'function') {
        if (hasTargetOnProto(val)) {
          var got5 = _tryInstance('new ' + nm + '()', function () { return new val() })
          if (got5) { _inst = got5; return _inst }
        }
        /* 也看看静态方法 (有的实现把 readFile 直接挂构造器上) */
        continue
      }

      /* 5c) 对象的一层属性 */
      var props = []
      try { props = Object.getOwnPropertyNames(val) } catch (eP) { props = [] }
      for (var q = 0; q < props.length && q < 40; q++) {
        var sub = null
        try { sub = val[props[q]] } catch (eS) { continue }
        if (sub == null) continue
        var st = typeof sub
        if (st !== 'object' && st !== 'function') continue
        if (_hasNative(sub)) {
          _source = 'global.' + nm + '.' + props[q]
          _log('暴力扫描命中 ' + _source)
          _inst = sub
          return _inst
        }
        if (st === 'function' && hasTargetOnProto(sub)) {
          var got6 = _tryInstance('new ' + nm + '.' + props[q] + '()', function () { return new sub() })
          if (got6) { _inst = got6; return _inst }
        }
      }
    }
  } catch (eScan) { _log('暴力扫描异常: ' + (eScan && eScan.message)) }

  _log('所有来源都没找到原生实例')
  return null
}

/* ---------------- panet: 平台自带的文件模块 ----------------
 * 实证 (从 ui/libs/libjsapi_panet.so, aarch64, 已在 rk 包内):
 *   符号 Panet::readFile(JQAsyncInfo&)
 *   usage 串给出的 API 清单:
 *     readFile(path) / writeFile(path, text) / appendFile(path, text) / mkdirs(path)
 *     request(url, method='GET', timeoutSec=8)
 *   另有 mkdir / remove / copy / move / stat / size / wifiSsid / exec / getProperty / setProperty
 * 注意: 这里没有 startTextEdit —— 本平台不提供系统输入法。
 *
 * 【加载方式: 静态 import 已集中到生成的 native-mods.js】
 * 本项目是 ESM 源码, rollup 不会把函数体里的裸 require() 变成模块依赖,
 * 于是运行时根本没有 require 这个全局函数 —— 真机日志实测:
 *     [INFO] === logger start === path=(未定) native=false
 * 也就是说 panet 从未被加载过。
 * 构建器 (aiot-vue-cli / falcon-module 插件) 的规则:
 *   - $jsapi/xxx 形式的 id -> 编译成 $falcon.jsapi['xxx']
 *   - 其它非本地 id        -> 标记为 external, 写进 app.js.bin 的模块依赖头
 * 参考应用「设置+」的 deviceinfo.js.bin 依赖头里有个 `Eric`
 * (同一套 SDK 改名后的 panet), 证明这条路是通的。
 * 【官方规范对齐重构后】原生模块的静态 import 只允许出现在构建生成的
 * native-mods.js 里, 业务代码统一调 getPanet():
 *   - 单包 (rk/cvis/rka): 生成文件按目标平台静态 import, getPanet() 返回静态模块;
 *   - 组合包 (merged): 生成文件用 optional-native.js 的 tryRequire 懒加载,
 *     getPanet() 首次调用时尝试 require('panet'), 失败返回 null —— 由下面的
 *     兜底路径继续降级, 绝不让某个家族缺 .so 时整页崩溃。
 * 另: app.json 原先把 panet alias 到 mock-panet.js, alias 插件会抢先解析成本地文件,
 * 永远轮不到 falcon-module 标成外部模块 —— 该 alias 已删除。
 */
var _panet = null
var _panetTried = false
var _panetErr = ''

function _panetInstance() {
  if (_panetTried) return _panet
  _panetTried = true

  /* 1) native-mods.js 提供的 panet (正常路径; 静态 import 只在该生成文件里)。
     单包返回静态模块, 组合包返回首次 tryRequire 的缓存结果 (缺失为 null)。
     用 try/catch 包住, 免得生成物形态异常时把文件能力层整个带崩。 */
  var P0 = null
  try { P0 = getPanet() } catch (eImp) { P0 = null }
  if (P0 != null) {
    var P1 = P0
    if (P1 && typeof P1 === 'object' && (P1.Panet || P1.default)) P1 = P1.Panet || P1.default
    if (typeof P1 === 'function') {
      try { _panet = new P1() } catch (e0) { _panet = P1 }
    } else {
      _panet = P1
    }
    _log('panet(native-mods) -> ' + (_panet ? 'ok' : 'null'))
    return _panet
  }

  /* 2) 兜底: 运行时 require (真机上通常没有 require, 这只是保险) */
  var m = null
  try {
    if (typeof require !== 'function') {
      _panetErr = '无 require 且 native-mods 未提供 panet'
      _log('panet 不可用: ' + _panetErr)
      return null
    }
    try { m = require('panet') } catch (e1) {
      _panetErr = "require('panet') 失败: " + (e1 && e1.message)
      try { m = require('Eric') } catch (e1b) {}
    }
  } catch (e) { _panetErr = String(e && e.message); _log('panet 不可用: ' + _panetErr); return null }
  if (!m) { _panetErr = '模块为空'; _log('panet 不可用: ' + _panetErr); return null }
  var P = m.Panet || m.default || m
  if (typeof P === 'function') {
    try { _panet = new P() } catch (e2) { _panet = P }
  } else {
    _panet = P
  }
  _log("require('panet') -> " + (_panet ? 'ok' : 'null'))
  return _panet
}

export function panetStatus() {
  var p = _panetInstance()
  return {
    ok: !!(p && (typeof p.readFile === 'function' || typeof p.writeFile === 'function')),
    err: _panetErr,
    methods: (function () {
      try { return Object.keys(p || {}).slice(0, 30).join(' ') } catch (e) { return '' }
    })(),
  }
}

/* 把 panet 方法返回的 Promise 的【拒绝】吃掉。
 *
 * 为什么必须有这一步: panet 的 readFile/writeFile/appendFile/mkdirs 都返回
 * Promise (JQAsyncInfo)。文件不存在 / 目录不可写时它们会 reject。
 * 如果我们发起调用却不挂拒绝处理, 就是一个「未处理的 Promise 拒绝」——
 * 会冒泡到全局, 真机上直接让页面崩掉 (测试里已复现:
 *   Error: ENOENT /userdisk/wanfeng/delta_mojin.log 未捕获)。
 * 项目里大部分调用是"发出去就不管结果"的, 所以统一在这里吃掉拒绝。 */
function _swallow(r) {
  try {
    if (r && typeof r.then === 'function') r.then(function () {}, function () {})
  } catch (e) {}
  return r
}

/* 调 panet 方法: 必须带接收者直接调用 (摘出方法会丢 this), 兼容 Promise 与同步返回 */
function _callPanet(name, a1, a2) {
  var p = _panetInstance()
  if (!p) return null
  try {
    if (typeof p[name] !== 'function') return null
    return _swallow((a2 === undefined) ? p[name](a1) : p[name](a1, a2))
  } catch (e) {
    _log('panet.' + name + ' 异常: ' + (e && e.message))
    return null
  }
}

/* 把 panet 的返回值收敛成字符串 (同步或 Promise) */
function _panetRead(path, cb) {
  var r = _callPanet('readFile', path)
  if (r == null) { cb(''); return }
  try {
    if (r && typeof r.then === 'function') {
      r.then(function (v) { cb(v == null ? '' : String(v)) }, function () { cb('') })
    } else {
      cb(String(r))
    }
  } catch (e) { cb('') }
}

export function nativeAvailable() { return !!nativeInstance() }

/* 是否有文件读写能力 (实例上或裸全局, 按开发指南 7.3 的名字)。
 * 同样不拿裸 write 当判据 —— 太宽泛。 */
export function hasFileApi() {
  /* panet 是最可靠的判据: 它就是平台自带的文件模块 */
  var p = _panetInstance()
  if (p && (typeof p.readFile === 'function' || typeof p.writeFile === 'function')) return true
  var g = nativeInstance()
  if (g) {
    try {
      if (typeof g.readFile === 'function') return true
      if (typeof g.listFiles === 'function') return true
      if (typeof g.writeFile === 'function') return true
      if (typeof g.write === 'function') return true
    } catch (e) {}
  }
  try {
    if (typeof readFile === 'function') return true
    if (typeof listFiles === 'function') return true
    if (typeof writeFile === 'function') return true
  } catch (e2) {}
  return !!_nodeFs()
}

/* 重新探测 (诊断页与测试用): 清掉缓存的实例与探测日志 */
export function resetNative() {
  _inst = null
  _tried = false
  _source = ''
  _probe.length = 0
  /* panet 缓存也要清 —— 否则换了环境仍用旧结果 (测试里踩过) */
  _panet = null
  _panetTried = false
  _panetErr = ''
}

/* ---------------- 文件读写 (对齐开发指南 7.3) ----------------
 * 指南里的全局函数: readFile / write / listFiles / rename / copy / move / delete / mkdir
 * 写是 write, 不是 writeFile —— 两种都试, 机型实现不一。
 * 红线: 原生函数禁止 .call()/.apply(), 一律直接调用。
 */

/* 读文本; 失败返回 '' */
export function readTextFile(path) {
  /* 1) panet (平台自带文件模块, 最可靠) */
  var p = _panetInstance()
  if (p && typeof p.readFile === 'function') {
    try {
      var r = _swallow(p.readFile(path))
      if (r && typeof r.then === 'function') {
        /* panet.readFile 是异步的, 同步路径拿不到结果 (由 readTextFileAsync 负责);
           但【必须】已经吃掉拒绝, 否则未处理的拒绝会把页面搞崩 */
        _log('panet.readFile 返回 Promise (同步路径改用 readTextFileAsync)')
      } else if (r != null && String(r) !== '') {
        return String(r)
      }
    } catch (e0) {}
  }
  var g = nativeInstance()
  if (g && typeof g.readFile === 'function') {
    try {
      var v = _swallow(g.readFile(path))
      /* 返回 Promise 就直接放弃: 既不能当内容 (否则 String(v) 会得到
         "[object Promise]" 被当成文件内容返回), 也不会留下未处理的拒绝 */
      if (!(v && typeof v.then === 'function') && v != null && String(v) !== '') return String(v)
    } catch (e) {}
  }
  try {
    if (typeof readFile === 'function') {
      var v2 = _swallow(readFile(path))
      if (!(v2 && typeof v2.then === 'function') && v2 != null && String(v2) !== '') return String(v2)
    }
  } catch (e2) {}
  try {
    var fs = _nodeFs()
    if (fs && typeof fs.readFileSync === 'function') {
      var b = fs.readFileSync(path)
      if (b != null) return String(b)
    }
  } catch (e3) {}
  return ''
}

/* 异步读 (panet 的 readFile 是异步的): 优先 panet, 回退同步实现 */
export function readTextFileAsync(path, cb) {
  var p = _panetInstance()
  if (p && typeof p.readFile === 'function') {
    try {
      var r = _swallow(p.readFile(path))
      if (r && typeof r.then === 'function') {
        r.then(function (v) { cb(v == null ? '' : String(v)) }, function () { cb('') })
        return
      }
      cb(r == null ? '' : String(r))
      return
    } catch (e) {}
  }
  cb(readTextFile(path))
}

/* 写文本 (整体覆盖); 返回是否成功 */
export function writeTextFile(path, data) {
  var d = String(data)
  /* 1) panet */
  var p = _panetInstance()
  if (p && typeof p.writeFile === 'function') {
    try { _swallow(p.writeFile(path, d)); return true } catch (e0) { _log('panet.writeFile 异常: ' + (e0 && e0.message)) }
  }
  var g = nativeInstance()
  if (g) {
    if (typeof g.write === 'function') { try { g.write(path, d); return true } catch (e1) {} }
    if (typeof g.writeFile === 'function') { try { g.writeFile(path, d); return true } catch (e2) {} }
  }
  try { if (typeof write === 'function') { write(path, d); return true } } catch (e3) {}
  try { if (typeof writeFile === 'function') { writeFile(path, d); return true } } catch (e4) {}
  try {
    var fs = _nodeFs()
    if (fs && typeof fs.writeFileSync === 'function') { fs.writeFileSync(path, d); return true }
  } catch (e5) {}
  return false
}

/* 追加文本 —— panet 有原生 appendFile, 优先用它 (无需读改写)。
 *
 * 【兜底分支的已知局限】下面的 readTextFile(path) 是同步读, 对【异步后端】
 * (panet/Eric 的 readFile 都返回 Promise) 永远拿到空串 —— 也就是会把文件
 * 覆盖成"空串 + 新内容"。真机上以 Eric 为后端时实测到过这个后果 (日志只剩
 * 91 字节)。当前 backend 是 panet, appendFile 存在, 这条分支不会走到, 故保持原样;
 * 若将来换用没有 appendFile 的后端 (如 Eric.FS), 必须改成异步读再写回。 */
export function appendTextFile(path, data) {
  var d = String(data)
  var p = _panetInstance()
  if (p && typeof p.appendFile === 'function') {
    try { _swallow(p.appendFile(path, d)); return true } catch (e0) { _log('panet.appendFile 异常: ' + (e0 && e0.message)) }
  }
  var old = ''
  try { old = readTextFile(path) || '' } catch (e) {}
  return writeTextFile(path, old + d)
}

/* 文件/目录是否存在。
 * 【已知局限】panet 的 readFile 是异步的, 所以同步版【判断不出 panet 上存在的文件】——
 * 真机自检就抓到过: fileExists('/userdata/cfg/sys_config.conf') 返回 false,
 * 而同一路径的异步读有完整内容。
 * 想要准确结果请用 fileExistsAsync。同步版只作为尽力而为的兜底。 */
export function fileExists(path) {
  var g = nativeInstance()
  if (g && typeof g.exists === 'function') {
    try { return !!g.exists(path) } catch (e) {}
  }
  try { if (typeof exists === 'function') return !!exists(path) } catch (e2) {}
  /* panet 有 stat / size —— 同步能返回就用 */
  var p = _panetInstance()
  if (p) {
    try {
      if (typeof p.stat === 'function') {
        var st = _swallow(p.stat(path))
        if (st && typeof st.then !== 'function') return !!st
      }
    } catch (e3) {}
    try {
      if (typeof p.size === 'function') {
        var sz = _swallow(p.size(path))
        if (sz != null && typeof sz.then !== 'function') return Number(sz) >= 0
      }
    } catch (e4) {}
  }
  if (readTextFile(path) !== '') return true
  /* 目录: 看能否列出来 */
  var arr = listDir(path)
  if (arr && arr.length != null) return true
  /* 空文件: 用父目录列表找名字 */
  try {
    var s = String(path)
    var i = s.lastIndexOf('/')
    var dir = i > 0 ? s.slice(0, i) : '/'
    var base = s.slice(i + 1)
    var list = listDir(dir)
    if (list && list.length != null) {
      for (var k = 0; k < list.length; k++) {
        var n = (typeof list[k] === 'string') ? list[k] : (list[k] && (list[k].name || list[k].path)) || ''
        if (String(n).replace(/^.*\//, '') === base) return true
      }
    }
  } catch (e5) {}
  return false
}

/* 准确版: 用异步读判断存在性 (panet 是异步的, 只有它能给出可靠答案) */
export function fileExistsAsync(path, cb) {
  var g = nativeInstance()
  if (g && typeof g.exists === 'function') {
    try { cb(!!g.exists(path)); return } catch (e) {}
  }
  readTextFileAsync(path, function (txt) {
    if (txt) { cb(true); return }
    cb(fileExists(path))   /* 空文件/目录等, 退回同步兜底 */
  })
}

/* 列目录; 不可用返回 null */
export function listDir(path) {
  var g = nativeInstance()
  try { if (g && typeof g.listFiles === 'function') return g.listFiles(path) } catch (e) {}
  try { if (typeof listFiles === 'function') return listFiles(path) } catch (e2) {}
  return null
}

/* 删除文件/目录 (指南 7.3) */
export function deletePath(path) {
  var g = nativeInstance()
  try { if (g && typeof g.delete === 'function') { g.delete(path); return true } } catch (e) {}
  try { if (typeof del === 'function') { del(path); return true } } catch (e2) {}
  return false
}

/* 建目录 (指南 7.3: mkdir; 有的实现是 mkdirs 递归建) */
export function makeDir(path) {
  var g = nativeInstance()
  var ok = false
  try { if (g && typeof g.mkdirs === 'function') { var r = g.mkdirs(path); if (r && r.catch) r.catch(function () {}); ok = true } } catch (e) {}
  if (!ok) { try { if (g && typeof g.mkdir === 'function') { var r2 = g.mkdir(path); if (r2 && r2.catch) r2.catch(function () {}); ok = true } } catch (e2) {} }
  if (!ok) { try { if (typeof mkdirs === 'function') { mkdirs(path); ok = true } } catch (e3) {} }
  if (!ok) { try { if (typeof mkdir === 'function') { mkdir(path); ok = true } } catch (e4) {} }
  return ok
}

/* 重命名 / 复制 / 移动 (指南 7.3) */
export function renamePath(from, to) {
  var g = nativeInstance()
  try { if (g && typeof g.rename === 'function') { g.rename(from, to); return true } } catch (e) {}
  try { if (typeof rename === 'function') { rename(from, to); return true } } catch (e2) {}
  return false
}
export function copyPath(from, to) {
  var g = nativeInstance()
  try { if (g && typeof g.copy === 'function') { g.copy(from, to); return true } } catch (e) {}
  try { if (typeof copy === 'function') { copy(from, to); return true } } catch (e2) {}
  return false
}

/* 惰性取 Node 的 fs —— 只用于本地测试; 真机走平台全局, 这里通常拿不到。
 * 全项目只保留这一处 fs 引用 (单文件打包时每个静态引用都会生成同名变量)。 */
var _fsMod = null
var _fsTried = false
function _nodeFs() {
  if (_fsTried) return _fsMod
  _fsTried = true
  try { _fsMod = (typeof require === 'function') ? require('fs') : null } catch (e) { _fsMod = null }
  return _fsMod
}

/* 诊断页用: 报告开发指南 7.3 里每个 API 是否可用。
 * 【注意】要报告 panet 的方法 —— 文件能力全部来自 panet;
 * 最早这里报的是 nativeInstance() (全局类 Global), 那东西在本平台根本不存在,
 * 于是整列都是"-", 看着像"没有文件能力", 实际 panet 好好的 (真机自检抓到)。 */
export function nativeApiReport() {
  var pn = _panetInstance()
  var g = nativeInstance()
  var names = ['readFile', 'writeFile', 'appendFile', 'write', 'listFiles', 'rename', 'copy', 'move',
               'delete', 'mkdir', 'mkdirs', 'exists', 'stat', 'size', 'request',
               'startTextEdit', 'closeTextEdit']
  var out = []
  for (var i = 0; i < names.length; i++) {
    var onPanet = false, onObj = false, onGlobal = false
    try { onPanet = !!(pn && typeof pn[names[i]] === 'function') } catch (e) {}
    try { onObj = !!(g && typeof g[names[i]] === 'function') } catch (e2) {}
    try { onGlobal = (typeof globalThis[names[i]] === 'function') } catch (e3) {}
    out.push(names[i] + '  panet=' + (onPanet ? '有' : '-') +
             '  实例=' + (onObj ? '有' : '-') + '  全局=' + (onGlobal ? '有' : '-'))
  }
  return out
}

/* ---------------- 彻底枚举 (诊断用) ----------------
 * 我们包里自带 libjsapi_panet.so (文件模块) 与 libjsapi_twofinger.so,
 * 平台还提供 libjsapi_bridge.so ($falcon 的来源)。到底哪个模块提供
 * readFile / startTextEdit, 只有把每个模块的方法名列出来才知道。 */
function _keysOf(o, max) {
  try {
    if (!o) return '(空)'
    var ks = Object.keys(o)
    if (!ks.length) {
      var ps = Object.getOwnPropertyNames(o)
      return ps.length ? ps.slice(0, max || 40).join(' ') : '(无属性)'
    }
    return ks.slice(0, max || 40).join(' ')
  } catch (e) { return '(取不到: ' + (e && e.message) + ')' }
}

export function nativeDeepReport() {
  var out = []

  /* 1) 每个模块名都 require 一次, 列出方法 —— panet 是文件模块, 重点看它 */
  var mods = ['panet', 'twofinger', 'global', 'Global', 'Eric', 'fs', 'file', 'device', 'system', 'shell', 'ui', 'input', 'keyboard', 'textedit']
  if (typeof require !== 'function') {
    out.push("typeof require = " + (typeof require) + "  (没有 require, 无法加载原生模块)")
  } else {
    for (var i = 0; i < mods.length; i++) {
      var nm = mods[i]
      var res = ''
      try {
        var m = require(nm)
        if (m == null) res = '返回空'
        else {
          res = '类型=' + (typeof m) + '  方法: ' + _keysOf(m, 30)
          /* 构造器形态: 再看原型 */
          if (typeof m === 'function') {
            try { res += '  | 原型: ' + _keysOf(m.prototype, 20) } catch (e2) {}
            try { var inst = new m(); res += '  | 实例: ' + _keysOf(inst, 20) } catch (e3) { res += '  | new 失败: ' + (e3 && e3.message) } 
          }
          /* 常见包装: .default / .Panet / .Global */
          try {
            if (m.default) res += '  | .default: ' + _keysOf(m.default, 20)
            if (m.Panet) res += '  | .Panet: ' + _keysOf(m.Panet, 20)
            if (m.Global) res += '  | .Global: ' + _keysOf(m.Global, 20)
          } catch (e4) {}
        }
      } catch (e) {
        res = '加载失败: ' + (e && e.message ? e.message : String(e))
      }
      out.push("require('" + nm + "') -> " + res)
    }
  }

  /* 2) $falcon 与 jsapi 全量键 */
  try {
    var f = (typeof $falcon !== 'undefined') ? $falcon : null
    out.push('$falcon      = ' + (f ? ('有  键: ' + _keysOf(f, 30)) : '不存在'))
    if (f) {
      out.push('$falcon.env  = ' + _keysOf(f.env, 30))
      var j = f.jsapi
      out.push('$falcon.jsapi= ' + _keysOf(j, 40))
      /* jsapi 下每个对象的键也列一层 —— 文件/输入法可能藏在子对象里 */
      if (j) {
        var jk = []
        try { jk = Object.keys(j) } catch (e5) {}
        for (var q = 0; q < jk.length && q < 30; q++) {
          var sub = null
          try { sub = j[jk[q]] } catch (e6) { continue }
          if (sub && typeof sub === 'object') out.push('  jsapi.' + jk[q] + ' -> ' + _keysOf(sub, 25))
        }
      }
    }
  } catch (e7) { out.push('$falcon 枚举异常: ' + (e7 && e7.message)) }

  /* 3) 全局里名字沾边的 */
  try {
    var ks = Object.getOwnPropertyNames(globalThis)
    var hit = []
    for (var k = 0; k < ks.length; k++) {
      if (/read|write|file|fs|text|edit|input|keyboard|sn|serial|device|global|shell|native|panet|bridge/i.test(ks[k])) hit.push(ks[k])
    }
    out.push('全局相关名   = ' + (hit.length ? hit.join(' ') : '(无)'))
    out.push('全局总数     = ' + ks.length)
  } catch (e8) {}

  return out
}
