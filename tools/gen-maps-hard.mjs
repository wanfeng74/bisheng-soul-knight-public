/*
 * 高难度地图生成器 —— 生成 3 张【面积 = 军用补给站 x2】的地图。
 *
 * 为什么用脚本生成: 每张 7200 格, 手写必然出错 (行宽不齐/非法字符/区域不连通)。
 * 这里结构化生成, 全套校验通过才写出 JS 字面量。
 *
 * 面积口径: 军用补给站 DEPOT = 120x30 = 3600 格。
 *   新图 = 7200 格 = DEPOT 的 2 倍, 且【三张都正好 7200】, 只是长宽比不同 (手感不同)。
 *
 * 内存口径 (重要): _bakeStaticLayer 会把整张图烘焙成一张 ImageData,
 *   占用 = W*24 * H*24 * 4 = W*H*2304 字节。
 *   engine.js 里有 16MB 保护 (超过就不烘焙, 退化成逐帧 fillRect, 大地图上会卡)。
 *   7200 * 2304 = 16,588,800 < 16,777,216 —— 正好卡在门槛内侧, 再大就不行了。
 *   所以三张图都严格取 7200 格, 不是随手定的。
 *
 * 用法: node tools/gen-maps-hard.mjs [--write]
 *   --write 时把结果写到 src/services/game/maps-hard.js
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..');
const OUT = path.join(REPO, 'ui/src/services/game/maps-hard.js');

const TILE = 24;
const BAKE_LIMIT = 16 * 1024 * 1024;

/* ---------------- 三张图的规格 ----------------
 * diff: 难度系数 (敌人 HP x sqrt(diff), 伤害 x (1 + (sqrt(diff)-1)*0.6))
 * luck: 每箱额外掉一件的概率 (0~1), 就是"爆率增高一点"
 * 敌人数量按难度递增, 物资也递增 (高风险高回报)。
 */
const SPECS = [
  {
    key: 'PORT', id: 'port', name: '深水码头', theme: 'urban', W: 160, H: 45,
    seed: 20261101, time: 900, risk: 'extreme', diff: 4, luck: 0.25,
    tag: '超大面积 · 双撤离点',
    desc: '集装箱阵与栈桥交错, 两处撤离点分别在东西两端, 中间要横穿整片堆场',
    /* 布局: 竖墙 + 横墙构成大仓区, 再切出堆场与子间 */
    vx: [40, 80, 120], hy: [14, 30],
    vGaps: [[5, 20, 36], [9, 22, 38], [4, 18, 33]],
    hGaps: [[10, 30, 52, 76, 100, 128], [16, 44, 70, 96, 136]],
    subWalls: [
      ['V', 20, 1, 12, 7], ['H', 8, 21, 39, 30], ['V', 60, 1, 12, 6],
      ['H', 7, 61, 79, 70], ['V', 100, 2, 13, 9], ['H', 20, 101, 119, 110],
      ['V', 55, 16, 29, 23], ['H', 24, 41, 59, 50], ['V', 95, 16, 29, 22],
      ['H', 35, 81, 99, 90], ['V', 140, 31, 43, 37], ['H', 38, 121, 139, 130],
    ],
    pillars: 150,
    loot: { x: 14, a: 12, c: 20, m: 12, k: 6 },
    enemy: { g: 34, e: 14 },
  },
  {
    key: 'FORTRESS', id: 'fortress', name: '地下要塞', theme: 'base', W: 180, H: 40,
    seed: 20261102, time: 1020, risk: 'extreme', diff: 6, luck: 0.3,
    tag: '超大面积 · 极高风险',
    desc: '层层嵌套的坑道与指挥室, 两个撤离口都在最深处, 进来容易出去难',
    vx: [36, 72, 108, 144], hy: [13, 26],
    vGaps: [[4, 18, 31], [7, 16, 28], [5, 20, 33], [8, 14, 26]],
    hGaps: [[8, 26, 50, 74, 98, 122, 150], [14, 40, 62, 88, 116, 140, 164]],
    subWalls: [
      ['H', 7, 1, 17, 9], ['V', 18, 1, 6, 3], ['H', 6, 19, 35, 27],
      ['V', 54, 1, 12, 5], ['H', 9, 55, 71, 63], ['V', 90, 2, 12, 8],
      ['H', 5, 91, 107, 99], ['V', 126, 1, 12, 6], ['H', 8, 127, 143, 135],
      ['V', 162, 2, 12, 7], ['H', 20, 37, 53, 45], ['V', 45, 14, 25, 19],
      ['H', 22, 73, 89, 81], ['V', 81, 14, 25, 20], ['H', 19, 109, 125, 117],
      ['V', 117, 14, 25, 18], ['H', 23, 145, 161, 153], ['V', 153, 14, 25, 21],
      ['H', 33, 1, 20, 11], ['V', 30, 27, 38, 32], ['H', 34, 46, 70, 58],
      ['V', 60, 27, 38, 31], ['H', 32, 91, 115, 103], ['V', 100, 27, 38, 34],
      ['H', 35, 136, 160, 148],
    ],
    pillars: 200,
    loot: { x: 18, a: 16, c: 26, m: 16, k: 8 },
    enemy: { g: 46, e: 20 },
  },
  {
    key: 'BASECAMP', id: 'basecamp', name: '前线基地', theme: 'base', W: 200, H: 36,
    seed: 20261103, time: 1140, risk: 'extreme', diff: 9, luck: 0.35,
    tag: '超大面积 · 最高风险',
    desc: '最宽的一张图, 兵营/机库/油库依次排开, 两个撤离点分居两翼, 守卫最密',
    vx: [40, 80, 120, 160], hy: [12, 24],
    vGaps: [[4, 16, 28], [7, 18, 30], [5, 15, 27], [9, 20, 31]],
    hGaps: [[10, 30, 54, 78, 102, 126, 150, 174], [18, 44, 68, 92, 118, 142, 168]],
    subWalls: [
      ['H', 6, 1, 19, 11], ['V', 20, 1, 5, 3], ['H', 8, 21, 39, 31],
      ['V', 58, 1, 11, 6], ['H', 6, 59, 79, 69], ['V', 98, 1, 11, 5],
      ['H', 9, 99, 119, 109], ['V', 138, 1, 11, 7], ['H', 5, 139, 159, 149],
      ['V', 178, 1, 11, 6], ['H', 18, 41, 57, 49], ['V', 50, 13, 23, 18],
      ['H', 20, 81, 97, 89], ['V', 90, 13, 23, 17], ['H', 17, 121, 137, 129],
      ['V', 130, 13, 23, 19], ['H', 21, 161, 177, 169], ['V', 170, 13, 23, 16],
      ['H', 30, 1, 18, 9], ['V', 28, 25, 34, 29], ['H', 31, 42, 66, 54],
      ['V', 56, 25, 34, 30], ['H', 29, 82, 106, 94], ['V', 96, 25, 34, 28],
      ['H', 32, 122, 146, 134], ['V', 136, 25, 34, 31], ['H', 30, 162, 198, 180],
    ],
    pillars: 240,
    loot: { x: 22, a: 20, c: 32, m: 20, k: 10 },
    enemy: { g: 58, e: 26 },
  },
]

/* ---------------- 生成一张图 ---------------- */
function genMap(spec) {
  const { W, H } = spec;
  let seed = spec.seed;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7FFFFFFF; return seed / 0x7FFFFFFF };
  const ri = (n) => Math.floor(rnd() * n);

  const g = [];
  for (let y = 0; y < H; y++) g.push(new Array(W).fill('.'));

  /* 外墙 */
  for (let x = 0; x < W; x++) { g[0][x] = '#'; g[H - 1][x] = '#' }
  for (let y = 0; y < H; y++) { g[y][0] = '#'; g[y][W - 1] = '#' }

  const carveV = (x, gaps) => {
    for (let y = 1; y < H - 1; y++) g[y][x] = '#';
    for (const gy of gaps) { if (gy + 1 < H - 1) { g[gy][x] = '.'; g[gy + 1][x] = '.' } }
  };
  const carveH = (y, gaps) => {
    for (let x = 1; x < W - 1; x++) g[y][x] = '#';
    for (const gx of gaps) { if (gx + 1 < W - 1) { g[y][gx] = '.'; g[y][gx + 1] = '.' } }
  };

  spec.vx.forEach((x, i) => carveV(x, spec.vGaps[i] || []));
  spec.hy.forEach((y, i) => carveH(y, spec.hGaps[i] || []));

  /* 房间内隔断 (制造子房间与死胡同) */
  for (const [dir, a, b0, b1, door] of spec.subWalls) {
    if (dir === 'H') {
      for (let x = b0; x <= b1 && x < W - 1; x++) g[a][x] = '#';
      if (door != null && door + 1 < W - 1) { g[a][door] = '.'; g[a][door + 1] = '.' }
    } else {
      for (let y = b0; y <= b1 && y < H - 1; y++) g[y][a] = '#';
      if (door != null && door + 1 < H - 1) { g[door][a] = '.'; g[door + 1][a] = '.' }
    }
  }

  /* 柱子 (掩体): 只加在四周都是空地的格, 不堵 1 格宽通道 */
  for (let i = 0; i < spec.pillars; i++) {
    const x = 2 + ri(W - 4), y = 2 + ri(H - 4);
    if (g[y][x] !== '.') continue;
    const n = [g[y - 1][x], g[y + 1][x], g[y][x - 1], g[y][x + 1]].filter((c) => c === '.').length;
    if (n < 3) continue;
    g[y][x] = '#';
  }

  /* ---- 连通性: 只保留最大连通区 ---- */
  const seen = new Set();
  let region = [];
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      if (g[y][x] !== '.' || seen.has(y * W + x)) continue;
      const q = [[x, y]]; const reg = []; seen.add(y * W + x);
      for (let qi = 0; qi < q.length; qi++) {
        const [cx, cy] = q[qi]; reg.push([cx, cy]);
        for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
          const nx = cx + dx, ny = cy + dy;
          if (nx < 1 || nx >= W - 1 || ny < 1 || ny >= H - 1) continue;
          if (g[ny][nx] !== '.' || seen.has(ny * W + nx)) continue;
          seen.add(ny * W + nx); q.push([nx, ny]);
        }
      }
      if (reg.length > region.length) region = reg;
    }
  }
  const inRegion = new Set(region.map(([x, y]) => y * W + x));
  let orphan = 0;
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      if (g[y][x] === '.' && !inRegion.has(y * W + x)) { g[y][x] = '#'; orphan++ }
    }
  }

  /* ---- 放置物资与敌人 ---- */
  const open = region.slice();
  for (let i = open.length - 1; i > 0; i--) { const j = ri(i + 1); const t = open[i]; open[i] = open[j]; open[j] = t }
  const placed = new Set();
  const takeCell = () => {
    while (open.length) {
      const [x, y] = open.pop();
      const k = y * W + x;
      if (placed.has(k) || g[y][x] !== '.') continue;
      placed.add(k);
      return [x, y];
    }
    return null;
  };
  const counts = {};
  for (const group of [spec.loot, spec.enemy]) {
    for (const [ch, n] of Object.entries(group)) {
      counts[ch] = 0;
      for (let i = 0; i < n; i++) { const c = takeCell(); if (!c) break; g[c[1]][c[0]] = ch; counts[ch]++ }
    }
  }

  /* ---- 出生点 + 【两个】撤离点 ----
   * 出生点: 连通区里随一处。
   * 撤离点 A: 离出生点最远的格。
   * 撤离点 B: 离 A 最远、且离出生点也不近的格 —— 两个撤离口分居两端,
   *           玩家可以按局势选就近的那个, 而不是只能原路折返。
   */
  const dist2 = (a, b) => { const dx = a[0] - b[0], dy = a[1] - b[1]; return dx * dx + dy * dy };
  const spawnCell = region[Math.floor(region.length / 2)];
  let extA = region[0], bestA = -1;
  for (const c of region) { const d = dist2(c, spawnCell); if (d > bestA) { bestA = d; extA = c } }
  let extB = region[0], bestB = -1;
  const minSpawnD = Math.floor(bestA * 0.25);   /* B 不能离出生点太近 */
  for (const c of region) {
    if (dist2(c, spawnCell) < minSpawnD) continue;
    const d = dist2(c, extA);
    if (d > bestB) { bestB = d; extB = c }
  }
  g[spawnCell[1]][spawnCell[0]] = 'S';
  g[extA[1]][extA[0]] = 'E';
  g[extB[1]][extB[0]] = 'E';

  /* ---- 校验 ---- */
  const rows = g.map((r) => r.join(''));
  const errors = [];
  if (rows.length !== H) errors.push(`行数 ${rows.length} != ${H}`);
  rows.forEach((r, i) => { if (r.length !== W) errors.push(`第 ${i} 行宽度 ${r.length} != ${W}`) });
  const legal = new Set(['#', '.', 'S', 'E', 'c', 'm', 'a', 'x', 'k', 'g', 'e']);
  const bad = new Set();
  rows.forEach((r) => { for (const ch of r) if (!legal.has(ch)) bad.add(ch) });
  if (bad.size) errors.push('非法字符: ' + [...bad].join(','));
  for (let x = 0; x < W; x++) if (rows[0][x] !== '#' || rows[H - 1][x] !== '#') { errors.push('上下边界有缺口'); break }
  for (let y = 0; y < H; y++) if (rows[y][0] !== '#' || rows[y][W - 1] !== '#') { errors.push('左右边界有缺口'); break }
  const flat = rows.join('');
  if (!flat.includes('S')) errors.push('缺出生点 S');
  if ((flat.match(/E/g) || []).length !== 2) errors.push('撤离点 E 不是 2 个');

  /* 从 S 出发 BFS: 所有非墙格都必须可达, 两个撤离点也必须可达 */
  const reach = new Set([spawnCell[1] * W + spawnCell[0]]);
  const q = [[spawnCell[0], spawnCell[1]]];
  for (let qi = 0; qi < q.length; qi++) {
    const [cx, cy] = q[qi];
    for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue;
      if (rows[ny][nx] === '#' || reach.has(ny * W + nx)) continue;
      reach.add(ny * W + nx); q.push([nx, ny]);
    }
  }
  let totalOpen = 0, unreachable = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (rows[y][x] === '#') continue;
    totalOpen++;
    if (!reach.has(y * W + x)) unreachable++;
  }
  if (unreachable) errors.push(`有 ${unreachable} 格从出生点不可达`);
  if (!reach.has(extA[1] * W + extA[0])) errors.push('撤离点 A 不可达');
  if (!reach.has(extB[1] * W + extB[0])) errors.push('撤离点 B 不可达');
  if (extA[0] === extB[0] && extA[1] === extB[1]) errors.push('两个撤离点重合');

  /* 内存: 烘焙上限 */
  const bakeBytes = W * TILE * H * TILE * 4;
  if (bakeBytes > BAKE_LIMIT) errors.push(`烘焙 ${(bakeBytes / 1048576).toFixed(2)}MB 超过 16MB 保护`);

  return { rows, errors, counts, totalOpen, orphan, bakeBytes, spawnCell, extA, extB, bestA, bestB };
}

/* ---------------- 跑全部 ---------------- */
console.log('='.repeat(74));
let out = `/*
 * 高难度地图 (面积 = 军用补给站 x2 = 7200 格)。
 *
 * 【本文件由 tools/gen-maps-hard.mjs 生成, 不要手改】
 * 改动请改生成器的 SPECS 再重跑:
 *     node tools/gen-maps-hard.mjs --write
 * 生成时会做全套校验 (宽高/边界/字符集/连通性/两个撤离点/烘焙内存上限)。
 *
 * 面积口径: 军用补给站 DEPOT = 120x30 = 3600 格。这里三张都是 7200 格 (2 倍),
 *   只是长宽比不同: 深水码头 160x45 / 地下要塞 180x40 / 前线基地 200x36。
 * 烘焙内存: W*24*H*24*4 = W*H*2304 字节。7200 格 = 16,588,800 字节,
 *   刚好卡在 engine.js 的 16MB 保护内侧 —— 再大就退化成逐帧重绘, 大地图上会卡。
 *
 * 每张图有【两个撤离点】: 引擎会读地图里所有的 E, 到达任意一个即可撤离。
 */

`;
const metas = [];
let failed = 0;

for (const spec of SPECS) {
  const r = genMap(spec);
  console.log(`\n[${spec.name}] ${spec.W} x ${spec.H} = ${spec.W * spec.H} 格 (DEPOT 的 ${(spec.W * spec.H / 3600).toFixed(2)} 倍)`);
  console.log(`  可走 ${r.totalOpen} 格   实体 ${JSON.stringify(r.counts)}`);
  console.log(`  出生 (${r.spawnCell})  撤离A (${r.extA}) 距离² ${r.bestA}  撤离B (${r.extB}) 距离² ${r.bestB}`);
  console.log(`  烘焙 ${(r.bakeBytes / 1048576).toFixed(2)} MB (上限 16.00)   清理不连通格 ${r.orphan}`);
  console.log(`  难度系数 ${spec.diff} (敌人 HP x${Math.sqrt(spec.diff).toFixed(2)}, 伤害 x${(1 + (Math.sqrt(spec.diff) - 1) * 0.6).toFixed(2)})   爆率 +${(spec.luck * 100).toFixed(0)}%`);
  if (r.errors.length) {
    failed++;
    console.log('  !! 校验失败:');
    r.errors.forEach((e) => console.log('     - ' + e));
    continue;
  }
  console.log('  校验通过 (宽高/边界/字符集/连通性/2 个撤离点/烘焙内存)');

  const lit = r.rows.map((row) => "  '" + row + "',").join('\n');
  out += `/* ---- ${spec.name} (${spec.W}x${spec.H} = ${spec.W * spec.H} 格) ----\n * ${spec.desc}\n * 难度 ${spec.diff} / 时间 ${spec.time}s / 爆率 +${(spec.luck * 100).toFixed(0)}%\n */\nvar ${spec.key} = [\n${lit}\n]\n\n`;
  metas.push(spec);
}

if (failed) {
  console.log('\n' + '='.repeat(74));
  console.log(`${failed} 张图校验失败, 未写出文件`);
  process.exit(1);
}

/* 地图元数据 (时间/难度/爆率/尺寸/描述) */
const metaSrc = metas.map((s) => `  ${s.id}: {
    id: '${s.id}',
    name: '${s.name}',
    theme: '${s.theme}',
    grid: ${s.key},
    time: ${s.time},
    risk: '${s.risk}',
    tag: '${s.tag}',
    size: '${s.W}x${s.H}',
    diff: ${s.diff},
    luck: ${s.luck},
    extracts: 2,
    desc: '${s.desc}',
  },`).join('\n');

out += `var HARD_MAPS = {\n${metaSrc}\n}\n\nexport { HARD_MAPS }\n`;

const totalCells = metas.reduce((a, s) => a + s.W * s.H, 0);
console.log('\n' + '='.repeat(74));
console.log(`三张图合计 ${totalCells} 格, 每张 ${(totalCells / 3)} 格 = DEPOT(3600) 的 ${(totalCells / 3 / 3600).toFixed(2)} 倍`);

if (process.argv.includes('--write')) {
  fs.writeFileSync(OUT, out, 'utf8');
  console.log('已写出 ' + path.relative(REPO, OUT));
} else {
  console.log('(加 --write 才会写出文件)');
}
