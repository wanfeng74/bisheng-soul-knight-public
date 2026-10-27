/*
 * 扫描「v-show / v-if 容器内部的插值会访问可能为 null 的对象属性」这类问题。
 *
 * v-show 只隐藏元素, 子节点仍会被渲染 -> 里面的 {{ obj.prop }} 会被求值。
 * 如果 obj 初始为 null, 首帧渲染就抛错 -> 整个组件不渲染 -> 整页黑屏。
 */
import fs from 'node:fs';
import { UI } from './_paths.mjs'
import path from 'node:path';

/* UI 来自 tools/_paths.mjs (不再写死绝对路径) */
const PAGES = fs.readdirSync(path.join(UI, 'src/pages')).filter((d) =>
  fs.existsSync(path.join(UI, 'src/pages', d, d + '.vue')));

let issues = 0;
console.log('='.repeat(66));
console.log('v-show / v-if 内嵌对象属性访问检查');
console.log('='.repeat(66));

for (const page of PAGES) {
  const file = path.join(UI, 'src/pages', page, page + '.vue');
  const src = fs.readFileSync(file, 'utf8');
  const tm = src.match(/<template>([\s\S]*)<\/template>/);
  if (!tm) continue;
  const lines = tm[1].split('\n');

  /* 找出 data() 里初始值为 null 的键 */
  const sm = src.match(/<script>([\s\S]*?)<\/script>/);
  const nullKeys = new Set();
  if (sm) {
    const dm = sm[1].match(/data\s*\(\s*\)\s*\{[\s\S]*?return\s*\{([\s\S]*?)\n\s{4}\}/);
    if (dm) {
      for (const m of dm[1].matchAll(/^\s{6}([A-Za-z_$][\w$]*)\s*:\s*null\s*,?\s*$/gm)) nullKeys.add(m[1]);
    }
  }
  if (!nullKeys.size) { console.log(`  ${page.padEnd(9)} 无初始为 null 的数据`); continue }

  /* 遍历每一行, 用缩进判断是否处于某个 v-show/v-if 容器内部 */
  const stack = [];   /* {indent, kind, cond, line} */
  const found = [];
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const indent = raw.search(/\S/);
    if (indent < 0) continue;
    /* 弹出已结束的容器 */
    while (stack.length && indent <= stack[stack.length - 1].indent) stack.pop();

    const openM = raw.match(/<div\b[^>]*\s(v-show|v-if)="([^"]*)"/);
    /* 本行里的插值是否访问了 null 键 */
    for (const m of raw.matchAll(/\{\{([^}]*)\}\}/g)) {
      for (const key of nullKeys) {
        const re = new RegExp('(^|[^\\w$.])' + key + '\\s*\\.');
        if (re.test(m[1])) {
          /* 判断是否被某个 v-if 保护 */
          const guard = stack.find((s) => s.kind === 'v-if' && new RegExp('(^|[^\\w$.])' + key + '(\\s|$)').test(s.cond));
          const showOnly = stack.filter((s) => s.kind === 'v-show' && new RegExp('(^|[^\\w$.])' + key + '(\\s|$)').test(s.cond));
          if (!guard && showOnly.length) {
            found.push({ line: i + 1, key, expr: m[1].trim(), via: `v-show="${showOnly[0].cond}" @L${showOnly[0].line}` });
          } else if (!guard && !showOnly.length && stack.length) {
            found.push({ line: i + 1, key, expr: m[1].trim(), via: '在容器内但无同键保护' });
          }
        }
      }
    }
    if (openM) stack.push({ indent, kind: openM[1], cond: openM[2], line: i + 1 });
  }

  if (found.length) {
    issues += found.length;
    console.log(`\n  ${page}.vue:`);
    for (const f of found) {
      console.log(`      L${f.line}  {{ ${f.expr} }}   —— ${f.key} 初始为 null, ${f.via}`);
    }
  } else {
    console.log(`  ${page.padEnd(9)} OK (null 键: ${[...nullKeys].join(', ')})`);
  }
}

console.log('\n' + '='.repeat(66));
console.log(issues ? `${issues} 处风险: v-show 内访问初始为 null 的对象` : '未发现同类风险');
process.exit(0);
