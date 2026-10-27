/*
 * 检查「import 用了别名, 但脚本里还在用原名」。
 *
 * 这是很容易犯且后果严重的错误:
 *   import { rarityColor as rarityColorOf } from './items.js'
 *   ...
 *   rarityColor(it.rarity)     // ReferenceError: rarityColor is not defined
 * 因为原来那个名字已经不再被引入, 页面一跑到这行就抛错 (曾导致开箱报错)。
 *
 * 判定: 对每个 `import { X as Y }`, 在去掉 import 语句与注释/字符串之后,
 *       脚本里若仍出现裸的标识符 X (不是属性访问 foo.X, 也不是对象键 X:),
 *       就报错。
 */
import fs from 'node:fs';
import { UI } from './_paths.mjs'
import path from 'node:path';

/* UI 来自 tools/_paths.mjs (不再写死绝对路径) */

function stripStringsAndComments(s) {
  let out = '';
  let i = 0;
  while (i < s.length) {
    const c = s[i], n = s[i + 1];
    if (c === '/' && n === '/') { while (i < s.length && s[i] !== '\n') i++; continue }
    if (c === '/' && n === '*') { i += 2; while (i < s.length && !(s[i] === '*' && s[i + 1] === '/')) i++; i += 2; continue }
    if (c === "'" || c === '"' || c === '`') {
      const q = c; i++;
      while (i < s.length && s[i] !== q) { if (s[i] === '\\') i++; i++ }
      i++; out += ' '; continue;
    }
    out += c; i++;
  }
  return out;
}

export function checkFile(file) {
  const src = fs.readFileSync(file, 'utf8');
  const sm = src.match(/<script>([\s\S]*?)<\/script>/);
  if (!sm) return [];
  const raw = sm[1];

  /* 收集别名: 原名 -> 别名 */
  const aliases = [];
  for (const m of raw.matchAll(/import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]/g)) {
    for (const part of m[1].split(',')) {
      const seg = part.trim();
      if (!seg) continue;
      const am = seg.match(/^(\S+)\s+as\s+(\S+)$/);
      if (am) aliases.push({ orig: am[1], alias: am[2], from: m[2] });
    }
  }
  if (!aliases.length) return [];

  /* 去掉 import 语句本身, 再清字符串与注释 */
  const bodyNoImport = raw.replace(/import\s*\{[^}]+\}\s*from\s*['"][^'"]+['"];?/g, '')
    .replace(/import\s+\w+\s+from\s*['"][^'"]+['"];?/g, '')
    .replace(/import\s*['"][^'"]+['"];?/g, '');
  const code = stripStringsAndComments(bodyNoImport);
  const lines = code.split('\n');

  const problems = [];
  for (const a of aliases) {
    const re = new RegExp('(^|[^\\w$.])' + a.orig + '\\b', 'g');
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      let m;
      while ((m = re.exec(l))) {
        const start = m.index + m[1].length;
        const after = l.slice(start + a.orig.length);
        /* 对象字面量的键 (X: ) 不算引用 */
        if (/^\s*:/.test(after)) continue;
        /* 方法/函数定义 (X(args) { ... }) 是合法的: 定义了一个和 import 同名的成员,
           这正是「模板调用 X() 走方法、方法体转发到别名」的写法, 不算残留 */
        if (/^\s*\([^)]*\)\s*\{/.test(after)) continue;
        if (new RegExp('(var|let|const|function)\\s+$').test(l.slice(0, start))) continue;
        problems.push({ line: i + 1, orig: a.orig, alias: a.alias, from: a.from, text: l.trim().slice(0, 100) });
      }
    }
  }
  return problems;
}

/* ---------------- CLI ---------------- */
const isMain = process.argv[1] && process.argv[1].endsWith('check-alias-refs.mjs');
if (isMain) {
  const walk = (dir, acc) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p, acc);
      else if (/\.(vue|js)$/.test(e.name)) acc.push(p);
    }
    return acc;
  };
  const files = walk(path.join(UI, 'src'), []);
  let total = 0;
  console.log('='.repeat(68));
  console.log('import 别名残留检查 (改用别名后, 脚本里不能再引用原名)');
  console.log('='.repeat(68));
  for (const f of files) {
    const probs = checkFile(f);
    if (probs.length) {
      total += probs.length;
      console.log(`\n  ${path.relative(UI, f)}:`);
      for (const p of probs) {
        console.log(`      L${p.line}  用了「${p.orig}」, 但它已别名为「${p.alias}」 (来自 ${p.from})`);
        console.log(`          ${p.text}`);
      }
    }
  }
  console.log('\n' + '='.repeat(68));
  console.log(total ? `${total} 处别名残留 (会抛 ReferenceError)` : `未发现别名残留 (检查了 ${files.length} 个文件)`);
  process.exit(total ? 1 : 0);
}
