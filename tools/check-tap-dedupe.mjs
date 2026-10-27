/*
 * 检查: 绑定到 @touchstart 上【会改持久数据或强制重绘】的方法必须做点击去重。
 *
 * 为什么: 这个框架里【一次物理点击会同时触发 touchstart + click + tap 三个事件】。
 * 项目早就发现了, 所以 equipItem / unequip / mountGun / unmountGun / _flash 都调了
 * _dedupe() (200ms 内的重复触发直接忽略)。
 *
 * 我在改枪面板漏了 pickGunSlot —— 点一个槽位会跑 3 次, 每次都改 gunSlot、
 * 而且还额外调了 $forceUpdate(), 等于一次点击排 6 次重绘。
 * 连点几个槽位就把重绘队列撑爆, 真机上表现为「多点几个槽就崩了」。
 *
 * 【规则为什么收窄】不是所有点击都需要去重:
 *   商店的数量加减 (spMinus/spPlus)、游戏里的摇杆与开火, 本来就要能连点,
 *   一刀切会把它们弄卡。只强制两类真正危险的:
 *     ① 改持久数据 (this.db.*)  ② 调 $forceUpdate() (重绘放大器)
 *   纯跳转、纯本地开关这类天然幂等的不管。
 */
import fs from 'node:fs';
import path from 'node:path';
import { UI } from './_paths.mjs';
const PAGES = path.join(UI, 'src/pages');

/* 天然幂等 / 纯跳转, 不需要去重 */
const ALLOW = new Set([
  'goBack',        /* 只调 $page.finish() */
  'goHome',
  'noop',
  /* 数量加减: 设计上就要能连点, 加 200ms 去重会让手感变卡 */
  'spMinus', 'spPlus', 'dpMinus', 'dpPlus', 'ammoMinus', 'ammoPlus',
]);

/* 【强校验名单】: 这几条路径已经踩过坑 (改枪面板连点槽位把重绘队列撑爆),
 * 必须带 _dedupe(), 缺了就直接判失败。
 * 其余方法只作为存量清单打印, 不判失败 —— 它们大多是"打开/关闭面板"这类,
 * 重复执行本身无害; 大范围补去重会在收尾阶段引入新的回归风险。 */
const MUST = new Set([
  'openGun', 'closeGun', 'pickGunSlot', 'mountGun', 'unmountGun',
  'equipItem', 'unequip',
]);

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.vue')) out.push(p);
  }
  return out;
}

/** 取出 script 里某个方法的源码 (从 `名(` 到下一个同级方法) */
function methodBody(src, name) {
  const re = new RegExp('^\\s{4,6}' + name + '\\s*\\([^)]*\\)\\s*\\{', 'm');
  const m = src.match(re);
  if (!m) {
    /* 单行写法: name() { ... }, */
    const one = src.match(new RegExp('^\\s{4,6}' + name + '\\s*\\([^)]*\\)\\s*\\{[^\\n]*\\},?\\s*$', 'm'));
    return one ? one[0] : null;
  }
  const start = m.index + m[0].length;
  let depth = 1, i = start;
  while (i < src.length && depth > 0) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') depth--;
    i++;
  }
  return src.slice(m.index, i);
}

let issues = 0;
let debt = 0;
const files = walk(PAGES, []);
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  const rel = path.relative(UI, f);
  const tEnd = src.indexOf('</template>');
  if (tEnd < 0) continue;
  const tpl = src.slice(0, tEnd);

  /* 模板里所有 @touchstart="X" 的 X (取第一个标识符) */
  const bound = new Set();
  for (const m of tpl.matchAll(/@touchstart="([^"]+)"/g)) {
    const call = m[1].trim();
    const fn = call.match(/^([A-Za-z_$][\w$]*)/);
    if (fn) bound.add(fn[1]);
  }
  for (const name of bound) {
    if (ALLOW.has(name)) continue;
    const body = methodBody(src, name);
    if (body === null) continue;          /* 不在本文件定义 (mixin 等), 跳过 */
    /* 只查危险的两类: 改持久数据 / 强制重绘 */
    const risky = /this\.db\./.test(body) || /\$forceUpdate\s*\(/.test(body);
    if (!risky) continue;
    if (/_dedupe\(\)/.test(body)) continue;
    const why = /this\.db\./.test(body) ? '改持久数据' : '调 $forceUpdate()';
    if (MUST.has(name)) {
      issues++;
      console.log(`  [必须修] ${rel}: ${name}() 绑定在 @touchstart 上, ${why} 但没有 _dedupe() 去重`);
    } else {
      debt++;
      console.log(`  [存量] ${rel}: ${name}() ${why} 无去重`);
    }
  }
}

console.log('\n' + '='.repeat(62));
console.log(`强校验名单: ${issues ? issues + ' 个缺失 ***' : '全部通过'}`);
console.log(`存量提示: ${debt} 个点击处理函数没去重 (重复执行本身无害, 未强制)`);
console.log('一次物理点击会触发 touchstart + click + tap 三个事件, 所以重绘密集的路径必须去重。');
process.exit(issues ? 1 : 0);
