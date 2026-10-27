/*
 * 完整重名审计: import 的符号 vs methods / computed / data 的键。
 * 只要同名, 组件内的引用就会被 methods 版本遮蔽 —— 即使方法体正确,
 * 模板里的绑定也会拿到方法 (或拿到 data), 可能直接坏掉渲染。
 */
import fs from 'node:fs';
import { UI } from './_paths.mjs'
import path from 'node:path';

/* UI 来自 tools/_paths.mjs (不再写死绝对路径) */
const PAGES = fs.readdirSync(path.join(UI, 'src/pages')).filter((d) =>
  fs.existsSync(path.join(UI, 'src/pages', d, d + '.vue')));

/* 框架/插件注入的键不算冲突 */
const FRAMEWORK = new Set(['$page', '$falcon', 'name', 'components', 'props', 'mixins']);

let total = 0;
console.log('='.repeat(64));
console.log('import 符号 vs 组件选项键 —— 完整重名审计');
console.log('='.repeat(64));

for (const page of PAGES) {
  const file = path.join(UI, 'src/pages', page, page + '.vue');
  const src = fs.readFileSync(file, 'utf8');
  const sm = src.match(/<script>([\s\S]*?)<\/script>/);
  if (!sm) continue;
  const script = sm[1];

  /* import 本地名 -> 原名 */
  const imported = new Map();
  for (const m of script.matchAll(/import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]/g)) {
    const from = m[2];
    for (const part of m[1].split(',')) {
      const seg = part.trim();
      if (!seg) continue;
      const asM = seg.match(/^(\S+)\s+as\s+(\S+)$/);
      const local = asM ? asM[2] : seg;
      imported.set(local, { orig: asM ? asM[1] : seg, from });
    }
  }

  /* 组件选项键 */
  const keys = new Map();   /* name -> {block} */
  for (const block of ['data', 'computed', 'methods', 'watch']) {
    let body = null;
    if (block === 'data') {
      const dm = script.match(/data\s*\(\s*\)\s*\{[\s\S]*?return\s*\{([\s\S]*?)\n\s{4}\}\s*\n\s{2}\}/);
      body = dm ? dm[1] : null;
    } else {
      const bm = script.match(new RegExp(block + '\\s*:\\s*\\{([\\s\\S]*?)\\n\\s{2}\\},'));
      body = bm ? bm[1] : null;
    }
    if (!body) continue;
    const re = block === 'data'
      ? /^\s{6}([A-Za-z_$][\w$]*)\s*:/gm
      : /^\s{4}([A-Za-z_$][\w$]*)\s*[:(]/gm;
    let m;
    while ((m = re.exec(body))) {
      if (!keys.has(m[1])) keys.set(m[1], block);
    }
  }

  const collisions = [];
  for (const [local, info] of imported) {
    if (FRAMEWORK.has(local)) continue;
    if (keys.has(local)) collisions.push({ local, ...info, block: keys.get(local) });
  }

  if (collisions.length) {
    total += collisions.length;
    console.log(`\n  ${page}.vue:`);
    for (const c of collisions) {
      console.log(`      ${c.local}  (import 自 ${c.from} 的 "${c.orig}")  与 [${c.block}] 同名`);
    }
  } else {
    console.log(`  ${page.padEnd(9)} OK`);
  }
}

console.log('\n' + '='.repeat(64));
console.log(total ? `${total} 处重名 (同名会遮蔽 import)` : '无重名');
process.exit(0);
