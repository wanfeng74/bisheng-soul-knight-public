/*
 * 触摸坐标换算: 物理像素 -> 逻辑坐标 (960 × pageH)。
 *
 * 背景 (2026-10-19 X6P 实测):
 *   框架 touch 事件给的 screenX/screenY 是**物理像素** (X6P 800×480)，
 *   而页面布局/触控命中矩形用的是**逻辑坐标** (setViewPort(960) 后为 960×576)。
 *   若不换算，点击位置会横向最多差 160px、纵向差 100px —— 即“触控偏移”。
 *
 * 换算: logicalX = rawX * 960 / 物理宽
 *       logicalY = rawY * pageH / 物理高
 *
 * 物理尺寸未知(0)时原样返回，避免把正常设备带偏。
 */

export var LOGICAL_W = 960

/* 单个坐标分量: raw 物理像素 -> 逻辑像素, 并夹在 [0, logicalMax] */
export function mapAxis(raw, logicalMax, physical) {
  var v = Number(raw)
  if (!(v === v)) v = 0 /* NaN */
  var p = Number(physical) || 0
  var max = Number(logicalMax) || 0
  if (p > 0 && max > 0 && p !== max) {
    v = v * max / p
  }
  if (v < 0) v = 0
  if (max > 0 && v > max) v = max
  return v
}

/* 整点换算: 返回 { x, y } (逻辑坐标) */
export function mapTouchToLogical(rawX, rawY, physW, physH, pageH) {
  return {
    x: mapAxis(rawX, LOGICAL_W, physW),
    y: mapAxis(rawY, pageH, physH),
  }
}
