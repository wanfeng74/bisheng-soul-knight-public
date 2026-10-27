/*
 * 检查「同一模块被 import 多次」与「同一名字被重复声明」。
 *
 * 打包器会把 import 提升为变量声明, 重复 import 同一个模块会直接报
 *   Identifier 'xxx' has already been declared
 * 构建失败 (实际发生过: admin.vue / rank.vue 都踩过)。
 */
import fs from 'node:fs';
import { UI } from './_paths.mjs'
import path from 'node:path';

/* UI 来自 tools/_paths.mjs (不再写死绝对路径) */

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
console.log('重复 import / 重复声明检查');
console.log('='.repeat(66));

for (const f of walk(path.join(UI, 'src'), [])) {
  const src = fs.readFileSync(f, 'utf8');
  const sm = src.match(/<script>([\s\S]*?)<\/script>/);
  const code = sm ? sm[1] : src;
  const problems = [];

  /* 1) 同一模块被 import 多次 */
  const byMod = new Map();
  for (const m of code.matchAll(/import\s*[\s\S]*?from\s*['"]([^'"]+)['"]/g)) {
    const mod = m[1];
    byMod.set(mod, (byMod.get(mod) || 0) + 1);
  }
  for (const [mod, n] of byMod) if (n > 1) problems.push(`模块被 import ${n} 次: ${mod}`);

  /* 2) import 进来的名字重复 */
  const importedNames = [];
  for (const m of code.matchAll(/import\s*\{([^}]+)\}\s*from/g)) {
    for (const part of m[1].split(',')) {
      const seg = part.trim(); if (!seg) continue;
      const as = seg.match(/^\S+\s+as\s+(\S+)$/);
      importedNames.push(as ? as[1] : seg);
    }
  }
  const seenNames = new Set();
  for (const n of importedNames) {
    if (seenNames.has(n)) problems.push(`导入名重复: ${n}`);
    seenNames.add(n);
  }

  /* 3) import 名与本地 function/var/let/const 同名 */
  const localDecls = new Set();
  for (const m of code.matchAll(/(?:^|\n)\s*(?:function|var|let|const)\s+([A-Za-z_$][\w$]*)/g)) localDecls.add(m[1]);
  for (const n of seenNames) if (localDecls.has(n)) problems.push(`import 名与本地声明同名: ${n}`);

  if (problems.length) {
    total += problems.length;
    console.log(`\n  ${path.relative(UI, f)}:`);
    for (const p of problems) console.log(`      ${p}`);
  }
}

console.log('\n' + '='.repeat(66));
console.log(total ? `${total} 处重复` : '未发现重复 import / 重复声明');
process.exit(total ? 1 : 0);
