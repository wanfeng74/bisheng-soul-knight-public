/*
 * 平台判定 —— 单包 / 组合包、设备代号、更新平台、屏幕档案。
 *
 * 官方约定: 设备用「代号」(codename) 标识, 主题名形如 theme-y02-1 / theme-coco。
 * 单包构建时 res/version.js 的 platform 字段直接给出构建目标 (rk/cvis/rka);
 * 组合包 (merged) 一个包里带多家族的原生库, 必须运行时按设备代号推断家族。
 *
 * 依赖约束: 本模块只依赖 res/version.js 与运行时全局 $falcon,
 * 不 import 任何业务模块 —— 这样任何页面 / 服务都能安全引用, 不形成循环依赖。
 * ES5 兼容 (QuickJS 20200705): 只用 var / function。
 */
import { platform, isCvi } from '../res/version.js'

/* 代号 -> 家族映射 (官方支持的代号集合)。
 * rk 家族用 window 取屏幕尺寸; cvis / rka 家族用 $falcon.env。
 * 【2026-10-19 修正】melon 从 cvis 移到 rk：
 *   melon = YDPX6-1/-2（X6 / X6 Pro）。硬件实测（52audio 拆解）X6 Pro 为 RK3562
 *   （aarch64），且官方《组合包打包规范》的 CVI 家族代号只有 coco / plum；
 *   hal_pedestal_config.json 里虽有 CV1826_Melon，但当前在售 X6 Pro 是 RK3562。
 *   合并包按代号选库时若把 melon 判成 cvis，会装错架构库，故归入 rk。 */
var FAMILY_CODES = {
  rk: ['y02-1', 'orange', 'popcorn', 'y03', 'y07', 'y11', 'y08', 'y06', 'hermes-plus', 'x3s', 'd2', 'd3', 'melon'],
  cvis: ['coco', 'plum', 'olive'],
  /* A 系列: YDPA7-1/-2 -> y09/y09p; A6pro YDPA6-1 -> pear */
  rka: ['y09', 'y09p', 'pear'],
}

/* 反查表: 代号 -> 家族 */
var CODE_FAMILY = {}
function _buildCodeFamily() {
  for (var fam in FAMILY_CODES) {
    if (!Object.prototype.hasOwnProperty.call(FAMILY_CODES, fam)) continue
    var list = FAMILY_CODES[fam]
    for (var i = 0; i < list.length; i++) CODE_FAMILY[list[i]] = fam
  }
}
_buildCodeFamily()

/* 平台历史别名: cvia 是 rka 的旧叫法 (已装出去的包 / 旧配置里可能出现) */
var PLATFORM_ALIAS = { cvia: 'rka' }

/* 探测日志 (诊断页 / 排查用): 最近 20 条 */
var _probe = []
function _log(m) {
  _probe.push(String(m))
  if (_probe.length > 20) _probe.shift()
  /* 平台只把 console.warn / console.error 收进设备日志 (见 logger.js 的实测结论),
     这里不 import logger, 避免业务模块之间形成依赖环。 */
  try { console.warn('[platform] ' + m) } catch (e) {}
}
export function platformProbeLog() { return _probe.slice(0) }

/* 已记录过日志的未知代号 —— 避免每次调用都刷屏 */
var _warnedCodes = {}

/* 组合包判定。p 省略时用构建注入的 platform。
 * 单包构建 (rk/cvis/rka) 返回 false; 组合包 (merged) 返回 true。 */
export function isMergedBuild(p) {
  var t = (p === undefined) ? platform : p
  return String(t == null ? '' : t).trim().toLowerCase() === 'merged'
}

/* 解析设备代号。
 * 默认从 $falcon.env.custom.theme 取 (形如 theme-y02-1), 去掉 theme- 前缀后
 * 返回小写代号 y02-1; 也容忍带路径 / 带 -theme 后缀的写法。
 * theme 参数可选, 供单元测试直接传值。 */
export function clientCode(theme) {
  var raw = theme
  if (raw === undefined) {
    raw = ''
    try {
      if (typeof $falcon !== 'undefined' && $falcon && $falcon.env && $falcon.env.custom) {
        raw = $falcon.env.custom.theme || ''
      }
    } catch (e) { raw = '' }
  }
  var s = String(raw == null ? '' : raw)
  s = s.replace(/^.*\//, '')          /* 带路径时取最后一段 */
  s = s.replace(/^theme[-_]/i, '')    /* theme-y02-1 -> y02-1 */
  s = s.replace(/[-_]theme$/i, '')    /* 也容忍 y02-1-theme 这种写法 */
  return s.trim().toLowerCase()
}

/* 代号 -> 家族; 未知返回 '' */
function familyOfCode(code) {
  var c = String(code == null ? '' : code).trim().toLowerCase()
  if (!c) return ''
  if (!Object.prototype.hasOwnProperty.call(CODE_FAMILY, c)) return ''
  return CODE_FAMILY[c] || ''
}

/* 平台名归一 (历史别名 cvia -> rka) */
function normalizePlatform(p) {
  var t = String(p == null ? '' : p).trim().toLowerCase()
  if (Object.prototype.hasOwnProperty.call(PLATFORM_ALIAS, t)) return PLATFORM_ALIAS[t]
  return t
}

/* 设备类型 (上报服务端做设备绑定/面板展示):
 *   优先用运行时设备代号 (theme-y02-1 -> y02-1), 附带家族; 取不到则用平台名。
 *   例: y02-1/rk、melon/rk、coco/cvis。 */
export function deviceTypeName() {
  var c = ''
  try { c = clientCode() } catch (e) { c = '' }
  var fam = ''
  try { fam = updatePlatform() } catch (e2) { fam = '' }
  if (c) return fam ? (c + '/' + fam) : c
  return fam || 'unknown'
}

/* 更新平台 (服务器 /app-update 的 platform 参数, 也用于日志自报)。
 *  - 单包构建: 直接返回构建注入的 platform;
 *  - 组合包: 用设备代号映射家族; 未知代号保守回退 'rk' 并记日志。
 * 参数 p / code 可选, 便于单元测试; 正常运行不传参。 */
export function updatePlatform(p, code) {
  var t = normalizePlatform(p === undefined ? platform : p)
  if (t !== 'merged') return t || 'rk'
  /* 代号走与 clientCode() 相同的解析 (容忍 theme-y02-1 / 大写 / 带路径) */
  var c = (code === undefined) ? clientCode() : clientCode(code)
  var fam = familyOfCode(c)
  if (fam) return fam
  if (!_warnedCodes[c]) {
    _warnedCodes[c] = true
    _log('组合包运行时未识别设备代号 "' + c + '", 更新平台保守回退 rk')
  }
  return 'rk'
}

/* 屏幕档案: screen.js 用来决定取屏幕尺寸的方式。
 *  - 单包: merged=false, isCvi 来自 res/version.js (rk=false, cvis/rka=true);
 *  - 组合包: 按运行时家族判定 —— rk 家族用 window, 其余 ($falcon.env 平台) 视为 isCvi。
 * 参数 p / code 可选, 便于单元测试。 */
export function screenProfile(p, code) {
  if (!isMergedBuild(p)) return { merged: false, isCvi: !!isCvi }
  var fam = updatePlatform('merged', code)
  return { merged: true, isCvi: fam !== 'rk' }
}
