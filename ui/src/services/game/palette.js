/*
 * 像素调色板（全局唯一）。
 * 所有 char-art 精灵只用这里的单字符取色；'.' 为透明。
 * 新增颜色时只在这里加，不要在美术文件里写死 #rrggbb（生成 PNG 工具也读这张表）。
 */
export var PAL = {
  '.': null,
  K: '#14121c', /* 近黑描边 */
  k: '#2a2838',
  G: '#4a4a5e',
  g: '#7a7a92',
  W: '#f2f2f7',
  w: '#c9c9d8',
  D: '#3b2220',
  d: '#6b4a2f',
  T: '#a8794e',
  S: '#f0c090',
  s: '#c98a5e',
  R: '#e5484d',
  r: '#a02030',
  H: '#ff8a8a',
  O: '#ff9f1c',
  o: '#c46a00',
  Y: '#ffe066',
  y: '#fff3b0',
  E: '#4caf50',
  e: '#2e7d32',
  L: '#a5e887',
  N: '#234d2e',
  C: '#4dd0e1',
  c: '#1f8a99',
  B: '#4a7dff',
  b: '#2a3f9e',
  U: '#ffd93d',
  u: '#b8860b',
  P: '#b06bff',
  p: '#6a35b8',
  V: '#e0a0ff',
  M: '#c0c8d8',
  m: '#7d8798',
  X: '#000000',
  Z: '#d8d0b8',
  z: '#9a927e',
  I: '#b3ecff',
  F: '#ff6b35',
  Q: '#3fa9f5',
  q: '#d9b382',
  J: '#7ee787',
  j: '#3fbf6f',
  A: '#ffb3c1'
}

export function colorOf(ch) {
  return PAL[ch] || null
}
