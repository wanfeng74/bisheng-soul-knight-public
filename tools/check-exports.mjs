/*
 * 检查「import 了某个名字, 但目标模块根本没有导出它」。
 *
 * 这类错误不会在打包时报错, 运行时该名字是 undefined, 一调用就 TypeError。
 * 实际发生过: admin.vue 从 device-info.js 导入 asyncProbeLog / asyncHardware /
 * asyncProbeDone, 但那三个函数当时只定义、没 export。
 *
 * 做法: 解析每个源文件的 export 列表, 再逐个核对 import 的来源模块。
 */
import fs from 'node:fs';
import { UI } from './_paths.mjs'
import path from 'node:path';

/* UI 来自 tools/_paths.mjs (不再写死绝对路径) */

/* 收集一个文件导出的名字 */
function exportsOf(file) {
  const set = new Set();
  if (!fs.existsSync(file)) return set;
  const src = fs.readFileSync(file, 'utf8');
  for (const m of src.matchAll(/export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g)) set.add(m[1]);
  for (const m of src.matchAll(/export\s+(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g)) set.add(m[1]);
  for (const m of src.matchAll(/export\s+class\s+([A-Za-z_$][\w$]*)/g)) set.add(m[1]);
  /* export { a, b as c } */
  for (const m of src.matchAll(/export\s*\{([^}]+)\}/g)) {
    for (const part of m[1].split(',')) {
      const seg = part.trim(); if (!seg) continue;
      const as = seg.match(/^\S+\s+as\s+(\S+)$/);
      set.add(as ? as[1] : seg.replace(/\s+as\s+\S+$/, '').trim());
    }
  }
  /* export default */
  if (/export\s+default/.test(src)) set.add('default');
  return set;
}

function walk(dir, acc) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (/\.(vue|js)$/.test(e.name)) acc.push(p);
  }
  return acc;
}

let total = 0;
console.log('='.repeat(66));
console.log('import 名与目标模块导出名的一致性检查');
console.log('='.repeat(66));

for (const f of walk(path.join(UI, 'src'), [])) {
  const src = fs.readFileSync(f, 'utf8');
  const sm = src.match(/<script>([\s\S]*?)<\/script>/);
  const code = sm ? sm[1] : src;

  const problems = [];
  for (const m of code.matchAll(/import\s*\{([^}]+)\}\s*from\s*['"](\.[^'"]+)['"]/g)) {
    const from = m[2];
    const target = path.resolve(path.dirname(f), from);
    if (!fs.existsSync(target)) continue;      /* 平台模块等, 跳过 */
    const ex = exportsOf(target);
    for (const part of m[1].split(',')) {
      const seg = part.trim(); if (!seg) continue;
      const as = seg.match(/^(\S+)\s+as\s+(\S+)$/);
      const orig = as ? as[1] : seg;
      if (!ex.has(orig)) {
        problems.push({ name: orig, from: path.relative(UI, target) });
      }
    }
  }

  if (problems.length) {
    total += problems.length;
    console.log(`\n  ${path.relative(UI, f)}:`);
    for (const p of problems) console.log(`      import { ${p.name} }  <-  ${p.from}  但该模块没有导出 ${p.name}`);
  }
}

console.log('\n' + '='.repeat(66));
console.log(total ? `${total} 处导入名不存在` : '全部 import 都能在目标模块找到对应导出');
process.exit(total ? 1 : 0);
