/*
 * 静态检查 Vue 模板: 模板里用到的每个标识符, 是否在 data/computed/methods/props 里定义,
 * 或者来自 <script> 的 import。
 *
 * 「模板引用了不存在的属性」会在运行时抛渲染错误 -> 真机表现就是整页黑屏。
 */
import fs from 'node:fs';
import { UI } from './_paths.mjs'
import path from 'node:path';

/* UI 来自 tools/_paths.mjs (不再写死绝对路径) */
const PAGES = fs.readdirSync(path.join(UI, 'src/pages')).filter((d) =>
  fs.existsSync(path.join(UI, 'src/pages', d, d + '.vue')));

/* Vue 内置 / 模板全局 */
const BUILTIN = new Set(['$event', '$index', '$key', 'true', 'false', 'null', 'undefined', 'NaN',
  'Math', 'Date', 'JSON', 'Number', 'String', 'Array', 'Object', 'Boolean', 'parseInt', 'parseFloat',
  'isNaN', 'item', 'index', 'in', 'of', 'typeof', 'new', 'void', 'delete', 'if', 'else', 'return']);

/* JS 关键字与字面量, 出现在表达式里不是标识符 */
const KEYWORDS = new Set(['true', 'false', 'null', 'undefined', 'this', 'new', 'typeof', 'instanceof',
  'in', 'of', 'return', 'void', 'delete', 'function', 'var', 'let', 'const', 'if', 'else', 'for', 'while']);

let totalIssues = 0;

for (const page of PAGES) {
  const file = path.join(UI, 'src/pages', page, page + '.vue');
  const src = fs.readFileSync(file, 'utf8');
  const tm = src.match(/<template>([\s\S]*)<\/template>/);
  const sm = src.match(/<script>([\s\S]*?)<\/script>/);
  if (!tm || !sm) continue;
  const template = tm[1];
  const script = sm[1];

  /* --- 收集 script 里定义的标识符 --- */
  const defined = new Set();
  /* import 的符号 */
  for (const m of script.matchAll(/import\s*\{([^}]+)\}\s*from/g)) {
    for (const s of m[1].split(',')) {
      const n = s.trim().split(/\s+as\s+/).pop().trim();
      if (n) defined.add(n);
    }
  }
  for (const m of script.matchAll(/import\s+(\w+)\s+from/g)) defined.add(m[1]);
  /* data() 返回的键 */
  const dataM = script.match(/data\s*\(\s*\)\s*\{[\s\S]*?return\s*\{([\s\S]*?)\n\s*\}\s*\n\s*\}/);
  if (dataM) {
    /* 顶层键: 行首 "key:" (缩进 6 空格左右) */
    for (const m of dataM[1].matchAll(/^\s{4,8}([A-Za-z_$][\w$]*)\s*:/gm)) defined.add(m[1]);
  }
  /* computed / methods 的键 */
  for (const block of ['computed', 'methods', 'watch']) {
    const bm = script.match(new RegExp(block + '\\s*:\\s*\\{([\\s\\S]*?)\\n\\s{2}\\},'));
    if (bm) {
      for (const m of bm[1].matchAll(/^\s{4}([A-Za-z_$][\w$]*)\s*[:(]/gm)) defined.add(m[1]);
    }
  }
  /* 兜底: 整个 script 里所有 4 空格缩进的 key/方法名 (防止非贪婪块匹配提前截断) */
  for (const m of script.matchAll(/^\s{4}([A-Za-z_$][\w$]*)\s*[:(]/gm)) defined.add(m[1]);
  /* props */
  for (const m of script.matchAll(/props\s*:\s*\[([^\]]*)\]/g)) {
    for (const s of m[1].split(',')) { const n = s.trim().replace(/['"]/g, ''); if (n) defined.add(n) }
  }
  /* 整个 script 里出现的 function/var/const/let 名 (宽松兜底) */
  for (const m of script.matchAll(/(?:function|var|let|const)\s+([A-Za-z_$][\w$]*)/g)) defined.add(m[1]);

  /* --- 提取模板里所有表达式中的标识符 --- */
  const exprs = [];
  /* {{ ... }} */
  for (const m of template.matchAll(/\{\{([\s\S]*?)\}\}/g)) exprs.push(m[1]);
  /* v-if/v-show/v-for/v-bind(:x="...")/@touchstart="..." 等属性值 */
  for (const m of template.matchAll(/\s(?:v-[\w:.-]+|[:@][\w.-]+)\s*=\s*"([^"]*)"/g)) exprs.push(m[1]);
  /* v-for 里声明的局部变量要排除 */
  const locals = new Set();
  for (const m of template.matchAll(/v-for\s*=\s*"\s*\(?([^)"]*?)\)?\s+in\s+/g)) {
    for (const s of m[1].split(',')) { const n = s.trim(); if (n) locals.add(n) }
  }
  for (const m of template.matchAll(/v-for\s*=\s*"\s*([A-Za-z_$][\w$]*)\s+in\s+/g)) locals.add(m[1]);

  const missing = new Map();
  for (const e of exprs) {
    /* 去掉字符串字面量、数字、属性访问的后半段 */
    const cleaned = e
      .replace(/'[^']*'/g, ' ')
      .replace(/"[^"]*"/g, ' ')
      .replace(/`[^`]*`/g, ' ');
    for (const m of cleaned.matchAll(/(^|[^\w$.])([A-Za-z_$][\w$]*)/g)) {
      const name = m[2];
      /* 跳过紧跟在 . 后面的 (属性名) */
      const idx = m.index + m[1].length;
      if (idx > 0 && cleaned[idx - 1] === '.') continue;
      if (KEYWORDS.has(name) || BUILTIN.has(name) || locals.has(name) || defined.has(name)) continue;
      /* 跳过对象字面量的键名  key: */
      const after = cleaned.slice(idx + name.length).match(/^\s*:/);
      if (after) continue;
      missing.set(name, (missing.get(name) || 0) + 1);
    }
  }

  if (missing.size) {
    totalIssues++;
    console.log(`\n  ${page}.vue  模板引用了未定义的标识符:`);
    for (const [n, c] of missing) console.log(`      ${n}  (出现 ${c} 次)`);
  } else {
    console.log(`  ${page}.vue  OK (定义了 ${defined.size} 个标识符)`);
  }
}

console.log('\n' + '='.repeat(62));
console.log(totalIssues ? `${totalIssues} 个页面存在未定义标识符` : '全部页面模板引用的标识符都有定义');
process.exit(totalIssues ? 1 : 0);
