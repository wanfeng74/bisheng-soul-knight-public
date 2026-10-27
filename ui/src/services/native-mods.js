/* 【自动生成，勿手改】由 scripts/build-amr.mjs 按构建目标写入。
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
import PanetModule from 'panet'
import EricModule from 'Eric'
import updaterModule from 'updater'
export const NATIVE_TARGET = 'rk'

/* 是否组合包（运行期按设备代号动态加载库）。单包恒为 false。 */
export const MERGE_MODE = false

export const panet = PanetModule || null
export const ericShell = (EricModule && EricModule.Shell) || null
export const twoFinger = (updaterModule && updaterModule.twofinger) || null
export const updater = updaterModule || null
/* 单包：库在构建期已打包进来，直接返回静态引用。 */
export function getPanet() { return panet }
export function getEricShell() { return ericShell }
export function getTwoFinger() { return twoFinger }

/* 四目标清单（供构建脚本与单元测试断言，不参与运行时逻辑）。 */
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
