/*
 * native 双指触控加载器 (evdev 直读方案)。
 *
 * 当前处于「探针验证」阶段（1.1.215 测试包）：
 *   先用纯 C 的最小探针库（只注册 twofinger 模块 + TwoFinger 构造占位）
 *   验证 Falcon 运行时能否静态加载并注册自定义 C 模块。
 *   - 探针能加载（不白屏）→ 模块机制没问题，问题在完整库（依赖/符号），
 *     再按此方向重写完整库。
 *   - 探针也白屏 → 模块加载机制本身有问题，需要改加载方式。
 *
 * rk 平台由构建器静态 import 'twofinger'（native-mods.js 的 getTwoFinger）；
 * cvis / rka 的 getTwoFinger() 返回 null，自动降级 DOM 单指，不会白屏。
 */
import { getTwoFinger } from './native-mods.js'

var _tf = null
var _tfTried = false

function loadTwoFingerNative() {
  if (_tfTried) return _tf
  _tfTried = true
  var T = null
  try { T = getTwoFinger() } catch (e) {}
  if (!T) {
    try {
      if (typeof require === 'function') {
        var m = require('twofinger')
        if (m) T = m.TwoFinger || m.default || m
      }
    } catch (e) {}
  }
  if (!T) {
    try { if (typeof TwoFinger !== 'undefined') T = TwoFinger } catch (e) {}
  }
  /* 原生模块导出层级在不同构建里可能是 {TwoFinger:{default:ctor}}；
     逐层拆到构造器或已实例对象，避免把命名空间对象直接交给 createTwoFinger。 */
  var guard = 0
  while (T && guard < 4) {
    guard++
    if (typeof T === 'function') break
    if (T.start && T.stop && T.poll && T.status && T.listDevices) break
    if (T.TwoFinger && T.TwoFinger !== T) { T = T.TwoFinger; continue }
    if (T.default && T.default !== T) { T = T.default; continue }
    break
  }
  if (T && T.TwoFinger) T = T.TwoFinger
  else if (T && T.default) T = T.default
  _tf = T || null
  return _tf
}

export { loadTwoFingerNative }
