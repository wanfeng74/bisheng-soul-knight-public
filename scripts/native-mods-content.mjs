/*
 * 生成 ui/src/services/native-mods.js 的内容 —— 按目标平台决定写哪些原生模块 import。
 *
 * 【为什么需要"按平台生成"】
 * ESM 的 import 在模块求值之前就要全部解析完。如果包里没有对应的 .so，
 * 整条 import 链会直接抛错，页面根本渲染不出来，而且 try/catch 拦不住。
 * 所以"要不要 import panet / Eric / updater"只能在打包时决定。
 *
 * 四个目标（契约 §5）：
 *   rk      = panet + Eric + updater（aarch64/glibc，RK 家族全量库）
 *   cvis    = updater（arm32/glibc；Eric 是 aarch64，不能用）
 *   rka     = updater（arm32/uClibc；Eric/panet 都不能用）
 *   merged  = updater + 运行期 tryRequire 懒加载 panet/Eric（组合包，按设备代号动态）
 *   unknown = 不 import，全部为 null（兜底：宁可没有自动更新，也绝不能白屏）
 *
 * 生成内容必须是 ES5 风格的 UI 代码（QuickJS 20200705）：var / function，
 * 不用箭头函数、模板字符串、可选链。抽成纯函数是为了能单测：
 * 见 ui/scripts/test-native-mods.mjs。
 */

/* 生成文件头注释（说明四目标，中文） */
export const NATIVE_MODS_HEADER = `/* 【自动生成，勿手改】由 scripts/build-amr.mjs 按构建目标写入。
 *
 * 原生模块的静态 import 只能出现在本文件：ESM 在求值前就要解析全部 import，
 * 包里缺哪个 .so 就会整页白屏，try/catch 也拦不住。
 *
 * 四目标：
 *   rk      = panet + Eric + updater（aarch64/glibc）
 *   cvis    = updater（arm32/glibc，Eric 是 aarch64 不能用）
 *   rka     = updater（arm32/uClibc）
 *   merged  = updater + 运行期 tryRequire 懒加载 panet/Eric（组合包）
 *   unknown = 全部 null（兜底，宁缺不白屏）
 */

/* eslint-disable */
`

/* 静态 import + 导出（rk：全量） */
const BODY_RK = `import PanetModule from 'panet'
import EricModule from 'Eric'
import updaterModule from 'updater'
import { TwoFinger as TwoFingerModule } from 'twofinger'
export const NATIVE_TARGET = 'rk'

/* 是否组合包（运行期按设备代号动态加载库）。单包恒为 false。 */
export const MERGE_MODE = false

export const panet = PanetModule || null
export const ericShell = (EricModule && EricModule.Shell) || null
export const twoFinger = TwoFingerModule || (updaterModule && updaterModule.twofinger) || null
export const updater = updaterModule || null
/* 单包：库在构建期已打包进来，直接返回静态引用。 */
export function getPanet() { return panet }
export function getEricShell() { return ericShell }
export function getTwoFinger() { return twoFinger }
`

/* cvis / rka：import updater；twofinger 尚未重新编译，保持运行期降级 */
function bodyUpdaterOnly(target) {
  return `import updaterModule from 'updater'

export const NATIVE_TARGET = '${target}'
export const MERGE_MODE = false

export const panet = null
export const ericShell = null
export const twoFinger = null
export const updater = updaterModule || null

/* 该平台没有 panet / Eric，twofinger 也未静态加载，永远返回 null（调用方降级）。 */
export function getPanet() { return null }
export function getEricShell() { return null }
export function getTwoFinger() { return null }
`
}

/* merged：静态 import updater + twofinger；panet/Eric 由 optional-native.js 在运行期懒加载 */
const BODY_MERGED = `import updaterModule from 'updater'
import { tryRequire } from './optional-native.js'

export const NATIVE_TARGET = 'merged'

/* 组合包：运行期按设备代号决定加载哪份库。 */
export const MERGE_MODE = true

export const panet = null
export const ericShell = null
export const twoFinger = null
export const updater = updaterModule || null

/* 懒加载缓存：首次调用才 tryRequire，失败也缓存（避免每次渲染都重试）。
   命名用 var + 布尔标记，保持 ES5 风格。 */
var _panetTried = false
var _panetCache = null
var _ericTried = false
var _ericCache = null

export function getPanet() {
  if (!_panetTried) {
    _panetTried = true
    _panetCache = tryRequire('panet')
  }
  return _panetCache || null
}

export function getEricShell() {
  if (!_ericTried) {
    _ericTried = true
    var mod = tryRequire('Eric')
    _ericCache = (mod && mod.Shell) || null
  }
  return _ericCache || null
}

/* 组合包暂不静态加载 twofinger（等三平台库全部重编后再启用）。 */
export function getTwoFinger() { return null }
`

/* 未知平台兜底：一个 import 都不写 */
const BODY_UNKNOWN = `export const NATIVE_TARGET = 'unknown'
export const MERGE_MODE = false

export const panet = null
export const ericShell = null
export const twoFinger = null
export const updater = null

export function getPanet() { return null }
export function getEricShell() { return null }
export function getTwoFinger() { return null }
`

/* 所有目标共用的尾部：四目标清单 + 历史别名 + 库清单（供测试/校验） */
const FOOTER = `/* 四目标清单（供构建脚本与单元测试断言，不参与运行时逻辑）。 */
export const NATIVE_TARGETS = ['rk', 'cvis', 'rka', 'merged']

/* 历史别名：cvia 是 rka 的旧名（早期版本发布过 cvia 平台名）。 */
export var PLATFORM_ALIAS = { cvia: 'rka' }

export function normalizeTarget(target) {
  var t = String(target == null ? '' : target).trim().toLowerCase()
  return PLATFORM_ALIAS[t] || t
}

/* 该目标打进包里的原生库（对应 native/libs/<架构>-<代号>/ 目录）。 */
export function nativeLibsFor(target) {
  var t = normalizeTarget(target)
  if (t === 'rk') {
    return ['libjsapi_panet.so', 'libjsapi_Eric.so', 'libjsapi_twofinger.so', 'libjsapi_updater.so',
      ]
  }
  if (t === 'cvis' || t === 'rka') return ['libjsapi_bridge.so', 'libjsapi_twofinger.so', 'libjsapi_updater.so']
  if (t === 'merged') {
    return ['libjsapi_panet.so', 'libjsapi_Eric.so', 'libjsapi_twofinger.so',
      'libjsapi_bridge.so', 'libjsapi_updater.so']
  }
  return []
}
`

const BODIES = {
  rk: BODY_RK,
  cvis: bodyUpdaterOnly('cvis'),
  rka: bodyUpdaterOnly('rka'),
  merged: BODY_MERGED,
}

/* 四目标（生成器视角；unknown 不在清单里，只做兜底） */
export const NATIVE_TARGETS = Object.keys(BODIES)

/* 历史名兼容：早期把这个平台错叫成 cvia，已经装出去的包里写死了这个名字。
   现在正式名是 rka（A 系列 / y09/y09p），但旧值仍然要能识别。 */
export const PLATFORM_ALIAS = { cvia: 'rka' }

export function normalizeTarget(target) {
  const t = String(target == null ? '' : target).trim().toLowerCase()
  return PLATFORM_ALIAS[t] || t
}

/* 返回该目标的 native-mods.js 完整内容。
 * 未知目标按最保守的 unknown 处理：一个 import 都不写。 */
export function nativeModsFor(target) {
  const tgt = normalizeTarget(target)
  const body = Object.prototype.hasOwnProperty.call(BODIES, tgt) ? BODIES[tgt] : BODY_UNKNOWN
  return NATIVE_MODS_HEADER + body + '\n' + FOOTER
}

/* 该目标会带哪些原生库（给日志/校验用）。未知目标返回空清单。 */
export function nativeLibsFor(target) {
  const tgt = normalizeTarget(target)
  if (tgt === 'rk') {
    return ['libjsapi_panet.so', 'libjsapi_Eric.so', 'libjsapi_twofinger.so', 'libjsapi_updater.so']
  }
  if (tgt === 'cvis' || tgt === 'rka') return ['libjsapi_bridge.so', 'libjsapi_twofinger.so', 'libjsapi_updater.so']
  if (tgt === 'merged') {
    return ['libjsapi_panet.so', 'libjsapi_Eric.so', 'libjsapi_twofinger.so',
      'libjsapi_bridge.so', 'libjsapi_updater.so']
  }
  return []
}
