/*
 * 新地图生成 + 校验。
 *
 * 为什么用脚本生成而不是手打: 120x30 = 3600 格, 手写极易出错 (行宽不齐、
 * 出现非法字符、区域不连通)。这里结构化生成后再做全套校验, 通过才输出 JS 字面量。
 *
 * 用法: node _tools/gen-map.mjs        (校验并打印)
 *       node _tools/gen-map.mjs --write (校验通过后直接改写 maps.js)
 */
import fs from 'node:fs';
import path from 'node:path';

const W = 120, H = 30;

/* 种子随机 (可复现) */
let seed = 20261016;
function rnd() { seed = (seed * 1103515245 + 12345) & 0x7FFFFFFF; return seed / 0x7FFFFFFF }
function ri(n) { return Math.floor(rnd() * n) }

/* 空网格 */
const g = [];
for (let y = 0; y < H; y++) g.push(new Array(W).fill('.'));

/* 外墙 */
for (let x = 0; x < W; x++) { g[0][x] = '#'; g[H - 1][x] = '#' }
for (let y = 0; y < H; y++) { g[y][0] = '#'; g[y][W - 1] = '#' }

/* 分隔墙: 竖向 x=30/60/90, 横向 y=10/20 —— 形成 4x3 的大房间 */
const VX = [30, 60, 90];
const HY = [10, 20];

function carveV(x, gaps) {
  for (let y = 1; y < H - 1; y++) g[y][x] = '#';
  for (const gy of gaps) { g[gy][x] = '.'; g[gy + 1][x] = '.'; }
}
function carveH(y, gaps) {
  for (let x = 1; x < W - 1; x++) g[y][x] = '#';
  for (const gx of gaps) { g[y][gx] = '.'; g[y][gx + 1] = '.'; }
}

/* 门的位置错开, 让路线有变化 (不是直线穿透) */
carveV(VX[0], [4, 16, 25]);
carveV(VX[1], [7, 15, 24]);
carveV(VX[2], [3, 13, 26]);
carveH(HY[0], [8, 22, 46, 74, 100]);
carveH(HY[1], [14, 36, 58, 68, 104]);

/* 房间内加隔断 (制造子房间与死胡同) */
function wallH(y, x0, x1, door) {
  for (let x = x0; x <= x1; x++) g[y][x] = '#';
  if (door != null) { g[y][door] = '.'; g[y][door + 1] = '.' }
}
function wallV(x, y0, y1, door) {
  for (let y = y0; y <= y1; y++) g[y][x] = '#';
  if (door != null) { g[door][x] = '.'; g[door + 1][x] = '.' }
}
/* 左上区: 再分两间 */
wallV(15, 1, 5, 3);
wallH(5, 16, 29, 27);
/* 右上区: 长走廊 */
wallH(6, 61, 80, 70);
wallV(95, 2, 8, 5);
/* 中区: 十字隔断 + 金库 */
wallH(15, 31, 45, 38);
wallV(45, 11, 19, 14);
wallV(75, 11, 19, 16);
/* 下区: 几处死胡同 */
wallH(25, 1, 12, 7);
wallV(20, 21, 28, 26);
wallH(25, 46, 58, 52);
wallV(70, 21, 28, 24);
wallH(24, 91, 105, 98);

/* 柱子 (掩体) */
for (let i = 0; i < 90; i++) {
  const x = 2 + ri(W - 4), y = 2 + ri(H - 4);
  if (g[y][x] !== '.') continue;
  /* 不要贴着门, 也不要把 1 格宽的通道堵死 */
  const neigh = [g[y - 1][x], g[y + 1][x], g[y][x - 1], g[y][x + 1]].filter((c) => c === '.').length;
  if (neigh < 3) continue;
  g[y][x] = '#';
}

/* ---- 连通性: 只保留最大连通区, 其余填回墙, 保证全图可达 ---- */
function largestRegion() {
  const seen = new Set();
  let best = [];
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      if (g[y][x] !== '.' || seen.has(y * W + x)) continue;
      const q = [[x, y]]; const reg = [];
      seen.add(y * W + x);
      while (q.length) {
        const [cx, cy] = q.shift(); reg.push([cx, cy]);
        for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
          const nx = cx + dx, ny = cy + dy;
          if (nx < 1 || nx >= W - 1 || ny < 1 || ny >= H - 1) continue;
          if (g[ny][nx] !== '.' || seen.has(ny * W + nx)) continue;
          seen.add(ny * W + nx); q.push([nx, ny]);
        }
      }
      if (reg.length > best.length) best = reg;
    }
  }
  return best;
}
const region = largestRegion();
const inRegion = new Set(region.map(([x, y]) => y * W + x));
let orphan = 0;
for (let y = 1; y < H - 1; y++) {
  for (let x = 1; x < W - 1; x++) {
    if (g[y][x] === '.' && !inRegion.has(y * W + x)) { g[y][x] = '#'; orphan++ }
  }
}

/* ---- 放置物资与敌人 (只放在连通区内, 且不互相重叠) ---- */
const open = region.slice();
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = ri(i + 1); const t = a[i]; a[i] = a[j]; a[j] = t } return a }
shuffle(open);

const LOOT = { x: 6, a: 5, c: 8, m: 5 };
const ENEMY = { g: 16, e: 6 };
const placed = new Set();
function takeCell() {
  while (open.length) {
    const [x, y] = open.pop();
    const k = y * W + x;
    if (placed.has(k) || g[y][x] !== '.') continue;
    placed.add(k);
    return [x, y];
  }
  return null;
}
const counts = {};
for (const [ch, n] of Object.entries(LOOT)) {
  counts[ch] = 0;
  for (let i = 0; i < n; i++) { const c = takeCell(); if (!c) break; g[c[1]][c[0]] = ch; counts[ch]++ }
}
for (const [ch, n] of Object.entries(ENEMY)) {
  counts[ch] = 0;
  for (let i = 0; i < n; i++) { const c = takeCell(); if (!c) break; g[c[1]][c[0]] = ch; counts[ch]++ }
}

/* 出生点与撤离点: 取连通区两端, 保证相距足够远 */
let spawnCell = region[0], extractCell = region[0], bestD = -1;
for (let i = 0; i < region.length; i += 7) {
  for (let j = 0; j < region.length; j += 11) {
    const dx = region[i][0] - region[j][0], dy = region[i][1] - region[j][1];
    const d = dx * dx + dy * dy;
    if (d > bestD) { bestD = d; spawnCell = region[i]; extractCell = region[j] }
  }
}
g[spawnCell[1]][spawnCell[0]] = 'S';
g[extractCell[1]][extractCell[0]] = 'E';

/* ---- 校验 ---- */
const rows = g.map((r) => r.join(''));
const errors = [];
if (rows.length !== H) errors.push('行数 ' + rows.length + ' != ' + H);
rows.forEach((r, i) => { if (r.length !== W) errors.push(`第 ${i} 行宽度 ${r.length} != ${W}`) });
const legal = new Set(['#', '.', 'S', 'E', 'c', 'm', 'a', 'x', 'g', 'e']);
const bad = new Set();
rows.forEach((r) => { for (const ch of r) if (!legal.has(ch)) bad.add(ch) });
if (bad.size) errors.push('非法字符: ' + [...bad].join(','));
for (let x = 0; x < W; x++) if (rows[0][x] !== '#' || rows[H - 1][x] !== '#') errors.push('上下边界有缺口')
for (let y = 0; y < H; y++) if (rows[y][0] !== '#' || rows[y][W - 1] !== '#') errors.push('左右边界有缺口')
if (!rows.join('').includes('S')) errors.push('缺出生点 S')
if (!rows.join('').includes('E')) errors.push('缺撤离点 E')

/* 从 S 出发 BFS, 确认所有非墙格都可达 */
function bfsFrom(sx, sy) {
  const seen = new Set([sy * W + sx]); const q = [[sx, sy]];
  while (q.length) {
    const [cx, cy] = q.shift();
    for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue;
      if (rows[ny][nx] === '#' || seen.has(ny * W + nx)) continue;
      seen.add(ny * W + nx); q.push([nx, ny]);
    }
  }
  return seen;
}
const reach = bfsFrom(spawnCell[0], spawnCell[1]);
let totalOpen = 0, unreachable = 0;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  if (rows[y][x] === '#') continue;
  totalOpen++;
  if (!reach.has(y * W + x)) unreachable++;
}
if (unreachable) errors.push(`有 ${unreachable} 格从出生点不可达`)
if (!reach.has(extractCell[1] * W + extractCell[0])) errors.push('撤离点不可达')

const openCount = totalOpen;
console.log('='.repeat(64));
console.log(`新地图: ${W} x ${H} = ${W * H} 格, 可走 ${openCount} 格`);
console.log(`对比: 雷达站 72x16=1152, 地下金库 72x18=1296`);
console.log(`面积比 (对雷达站): ${(W * H / 1152).toFixed(2)}x   (对金库): ${(W * H / 1296).toFixed(2)}x`);
console.log(`实体: ${JSON.stringify(counts)}  合计 ${Object.values(counts).reduce((a, b) => a + b, 0)}`);
console.log(`世界像素: ${W * 24} x ${H * 24} = ${(W * 24 * H * 24 / 1024 / 1024).toFixed(2)} MPx  ` +
            `烘焙内存 ${(W * 24 * H * 24 * 4 / 1024 / 1024).toFixed(1)} MB (阈值 16MB)`);
console.log(`清理掉的不连通格: ${orphan}`);
console.log('='.repeat(64));
if (errors.length) {
  console.log('校验失败:'); errors.forEach((e) => console.log('  - ' + e));
  process.exit(1);
}
console.log('校验通过 (宽高/边界/字符/连通性)');
console.log('');

/* 输出 JS 字面量 */
const lit = rows.map((r) => "  '" + r + "',").join('\n');
const out = `var DEPOT = [\n${lit}\n]\n`;
if (process.argv.includes('--write')) {
  fs.writeFileSync(path.join(REPO, 'tools', '_map_out.txt'), out, 'utf8');
  console.log('已写出 tools/_map_out.txt');
} else {
  console.log(out.slice(0, 400) + '\n...(完整内容见 --write)');
}
