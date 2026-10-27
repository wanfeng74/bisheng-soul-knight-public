/*
 * 屏幕适配 —— 统一读取设备物理分辨率并换算逻辑尺寸。
 *
 * 官方约定（_ref/.../04-posc-docs/jsapi/env/global.md）：
 *   $falcon.env.deviceWidth / deviceHeight 就是「设备分辨率-宽度/高度」，
 *   是所有机型（rk / cvis / rka / 组合包）都能拿到的权威来源。
 *
 * 【2026-10-19 修复】原实现只在 cvis/rka 用 env，rk 分支用 window.innerWidth/Height；
 *   但真机诊断（y02-1 diag）显示 Falcon 页面里 `typeof window === 'undefined'`，
 *   于是所有 rk 设备（含 X6P / melon）都落到兜底 960x266，与真实逻辑视口不一致，
 *   导致：
 *     · 游戏页 pageH/触摸矩形/原生双指参数按 266 算，底部控件错位或点不到；
 *     · 引擎按 266 固定视口渲染，屏更矮时画面顶部被裁（"显示不全"）；
 *     · 弹窗/滚动区按 266 写死，短屏放不下。
 *   现在改为：所有平台统一 env 优先 → window → document → 兜底，并暴露 screenInfo()
 *   供启动日志与「关于」页展示，便于远程收集用户机型数据。
 */
import { isCvi } from '../res/version.js'
import { screenProfile } from './platform.js'

export const DESIGN_WIDTH = 960

/* 设计基准逻辑高（历史机型 936x280 换算约 287；X3s 类机型为 266）。
   只作为布局参考与兜底值，不再用它强行把真实逻辑高抬到 266。 */
export const MIN_LOGICAL_HEIGHT = 266

/* 合法物理尺寸范围（过滤 0 / 负数 / 明显异常值） */
var ENV_MIN = 100
var ENV_MAX = 5000

function _num(v) {
  var n = Number(v)
  return isFinite(n) ? n : 0
}

function _valid(w, h) {
  return w >= ENV_MIN && w <= ENV_MAX && h >= ENV_MIN && h <= ENV_MAX
}

/* 官方环境变量：设备物理分辨率（横屏时通常宽 > 高） */
function _envSize() {
  try {
    if (typeof $falcon !== 'undefined' && $falcon && $falcon.env) {
      var w = _num($falcon.env.deviceWidth)
      var h = _num($falcon.env.deviceHeight)
      if (_valid(w, h)) return { w: w, h: h }
    }
  } catch (e) {}
  return null
}

/* window 兜底（部分固件/H5 预览有 window；真机 Falcon 页面通常没有） */
function _winSize() {
  try {
    if (typeof window !== 'undefined' && window) {
      var w = _num(window.innerWidth)
      var h = _num(window.innerHeight)
      if (_valid(w, h)) return { w: w, h: h }
    }
  } catch (e) {}
  return null
}

/* document 兜底（H5 预览） */
function _docSize() {
  try {
    if (typeof document !== 'undefined' && document && document.documentElement) {
      var w = _num(document.documentElement.clientWidth)
      var h = _num(document.documentElement.clientHeight)
      if (_valid(w, h)) return { w: w, h: h }
    }
  } catch (e) {}
  return null
}

/* 逻辑高度：宽度基准 960，按物理短边/长边等比换算（竖屏/横屏都适用）。
   不向上钳到 266 —— 真实短屏（例如逻辑高 240）必须如实返回，布局才能按真实高度收缩；
   只保留一个极小值兜底（120），避免异常尺寸把页面算成 0。 */
export function logicalHeight(w, h) {
  var W = Number(w) || 0
  var H = Number(h) || 0
  if (!W || !H) return MIN_LOGICAL_HEIGHT
  var longSide = Math.max(W, H)
  var shortSide = Math.min(W, H)
  var lh = Math.round(DESIGN_WIDTH * shortSide / longSide)
  if (lh < 120) lh = 120
  return lh
}

/* 屏幕诊断信息（启动日志 / 关于页 / 接口诊断页共用）。
   返回：
     env / win / doc   各来源的原始读数（没有则为 null）
     physical          最终采用的物理尺寸 {w,h}
     source            采用来源：env / window / document / fallback
     logicalWidth      逻辑宽（固定 960）
     logicalHeight     逻辑高（= 页面实际虚拟高度）
     profile           { merged, isCvi }（组合包运行时判定结果，供排查用）
 */
export function screenInfo() {
  var env = _envSize()
  var win = _winSize()
  var doc = _docSize()
  var phys = env || win || doc || { w: DESIGN_WIDTH, h: MIN_LOGICAL_HEIGHT }
  var source = env ? 'env' : (win ? 'window' : (doc ? 'document' : 'fallback'))
  var prof = { merged: false, isCvi: !!isCvi }
  try { prof = screenProfile() } catch (e) {}
  return {
    env: env,
    win: win,
    doc: doc,
    physical: phys,
    source: source,
    logicalWidth: DESIGN_WIDTH,
    logicalHeight: logicalHeight(phys.w, phys.h),
    profile: prof,
  }
}

/* 读取物理分辨率（兼容旧调用） */
export function readPhysical() {
  var info = screenInfo()
  return { w: info.physical.w, h: info.physical.h }
}

/* 页面根层尺寸：宽固定 960（setViewPort 铺满），高为真实逻辑高度 */
export function pageSize() {
  var info = screenInfo()
  return { w: DESIGN_WIDTH, h: info.logicalHeight }
}

/* 诊断文本：一行字符串，写日志/页面都方便 */
export function screenText() {
  var i = screenInfo()
  var f = function (p) { return p ? (p.w + 'x' + p.h) : '-' }
  return 'env=' + f(i.env) + ' win=' + f(i.win) + ' doc=' + f(i.doc) +
         ' physical=' + f(i.physical) + ' logical=' + DESIGN_WIDTH + 'x' + i.logicalHeight +
         ' source=' + i.source
}
