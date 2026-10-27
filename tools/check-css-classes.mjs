/*
 * 检查: 模板里用到的 class 必须在本文件（或全局样式）里有定义。
 *
 * 为什么需要: 「改枪」按钮的样式在重构时被误删, 模板还在引用 .gun-btn ——
 * 按钮于是完全没有尺寸, 在真机上等于消失。这类错误 vue-deep / 模板作用域 /
 * 未定义调用 全都查不出来 (它不是标识符问题, 是样式类缺失)。
 *
 * 只查静态 class="..." 里出现的名字; 动态绑定 (:class) 跳过 —— 那些是运行时拼的。
 * 允许 Vue 内置的过渡类 (v-enter 等) 和框架自带的容器类。
 */
import fs from 'node:fs';
import path from 'node:path';
import { UI } from './_paths.mjs';
const PAGES = path.join(UI, 'src/pages');

/* 框架/全局样式里已经定义好的类, 页面不必重复定义 */
const GLOBAL_OK = new Set([
  'page', 'bg', 'content',           /* 各页共用的骨架 */
  'fade-enter', 'fade-leave',
]);

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.vue')) out.push(p);
  }
  return out;
}

/* 收集整个项目定义过的类名 (跨文件也算定义: 有些类是共享的) */
const allDefined = new Set();
const files = walk(PAGES, []);
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  const style = src.slice(src.indexOf('<style'));
  for (const m of style.matchAll(/\.([A-Za-z][\w-]*)\s*(?=[,{:.\s])/g)) allDefined.add(m[1]);
}

let issues = 0;
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  const rel = path.relative(UI, f);
  const tEnd = src.indexOf('</template>');
  if (tEnd < 0) continue;
  const tpl = src.slice(0, tEnd);
  const style = src.slice(src.indexOf('<style'));
  const local = new Set();
  for (const m of style.matchAll(/\.([A-Za-z][\w-]*)\s*(?=[,{:.\s])/g)) local.add(m[1]);

  /* 静态 class="a b c" */
  const used = new Set();
  for (const m of tpl.matchAll(/\sclass="([^"]*)"/g)) {
    for (const c of m[1].split(/\s+/)) if (c && !c.includes('{')) used.add(c);
  }
  const missing = [...used].filter((c) => !local.has(c) && !allDefined.has(c) && !GLOBAL_OK.has(c));
  if (missing.length) {
    issues += missing.length;
    console.log(`  ${rel}: 模板用了但样式里没有 → ${missing.join(', ')}`);
  }
}

console.log('\n' + '='.repeat(62));
console.log(issues
  ? `${issues} 个样式类只在模板里出现, 没有对应样式 (元素会没有尺寸/位置, 真机上等于消失)`
  : `未发现缺失的样式类 (检查了 ${files.length} 个页面)`);
process.exit(issues ? 1 : 0);
