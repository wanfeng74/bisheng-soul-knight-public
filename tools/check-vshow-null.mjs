/*
 * 检查「v-show 子节点里解引用了一个可能为 null 的对象」。
 *
 * 为什么危险:
 *   v-if="cond"   为假 -> 子树【不渲染】, 内部插值不求值
 *   v-show="cond" 为假 -> 子树【仍渲染】(只是隐藏), 内部插值【照样求值】
 * 所以 v-show="obj" 里若写 {{ obj.name }} 而 obj 初始为 null,
 * 首帧渲染就抛 TypeError -> 整个组件不渲染 -> 真机整页黑屏。
 * (game.vue 的丢弃面板踩过这个坑)
 *
 * 判定方式很直接, 不做复杂解析:
 *   1. 找出模板里每个 v-show 指令所在的行与缩进
 *   2. 取该 v-show 条件里出现的标识符 (如 "showBag && dropPanel" -> [showBag, dropPanel])
 *   3. 若其中某个标识符在 data() 里初始值为 null,
 *      且它在该 v-show 块内被以 `.属性` 形式解引用, 就报错
 */
import fs from 'node:fs';
import { UI } from './_paths.mjs'
import path from 'node:path';

/* UI 来自 tools/_paths.mjs (不再写死绝对路径) */

export function checkFile(file) {
  const src = fs.readFileSync(file, 'utf8');
  const tm = src.match(/<template>([\s\S]*)<\/template>/);
  const sm = src.match(/<script>([\s\S]*?)<\/script>/);
  if (!tm) return [];
  const lines = tm[1].split('\n');

  /* data() 里初始为 null 的键 */
  const nullKeys = new Set();
  if (sm) {
    const dm = sm[1].match(/data\s*\(\s*\)\s*\{[\s\S]*?return\s*\{([\s\S]*?)\n\s{4}\}/);
    if (dm) for (const m of dm[1].matchAll(/^\s{4,8}([A-Za-z_$][\w$]*)\s*:\s*null\s*,?\s*$/gm)) nullKeys.add(m[1]);
  }
  if (!nullKeys.size) return [];

  const problems = [];
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const code = raw.replace(/<!--[\s\S]*?-->/g, '');
    const showM = code.match(/\sv-show\s*=\s*"([^"]*)"/);
    if (!showM) continue;

    /* 该 v-show 条件里被引用的标识符 */
    const condIds = new Set();
    for (const m of showM[1].matchAll(/(^|[^\w$.])([A-Za-z_$][\w$]*)/g)) {
      const idx = m.index + m[1].length;
      if (idx > 0 && showM[1][idx - 1] === '.') continue;
      condIds.add(m[2]);
    }
    const baseIndent = raw.search(/\S/);

    /* 往下扫描该块, 直到缩进回到 <= baseIndent */
    for (let j = i + 1; j < lines.length; j++) {
      const l = lines[j];
      if (!l.trim()) continue;
      const ind = l.search(/\S/);
      if (ind <= baseIndent) break;

      const lc = l.replace(/<!--[\s\S]*?-->/g, '');
      /* 本行被解引用的标识符 */
      for (const m of lc.matchAll(/(^|[^\w$.])([A-Za-z_$][\w$]*)\s*\./g)) {
        const name = m[2];
        if (name === 'item' || name === 'Math' || name === 'Date' || name === 'JSON') continue;
        if (!condIds.has(name)) continue;
        if (!nullKeys.has(name)) continue;
        problems.push({
          line: j + 1,
          key: name,
          cond: showM[1],
          showLine: i + 1,
          text: l.trim().slice(0, 96),
        });
      }
    }
  }
  return problems;
}

/* ---------------- CLI ---------------- */
const isMain = process.argv[1] && process.argv[1].endsWith('check-vshow-null.mjs');
if (isMain) {
  const PAGES = fs.readdirSync(path.join(UI, 'src/pages')).filter((d) =>
    fs.existsSync(path.join(UI, 'src/pages', d, d + '.vue')));
  let total = 0;
  console.log('='.repeat(68));
  console.log('v-show 内 null 解引用检查 (会导致整页黑屏)');
  console.log('='.repeat(68));
  for (const page of PAGES) {
    const file = path.join(UI, 'src/pages', page, page + '.vue');
    const probs = checkFile(file);
    if (probs.length) {
      total += probs.length;
      console.log(`\n  ${page}.vue:`);
      for (const p of probs) {
        console.log(`      L${p.line}  在 L${p.showLine} 的 v-show="${p.cond}" 块内解引用 ${p.key}`);
        console.log(`          ${p.text}`);
      }
    } else console.log(`  ${page.padEnd(9)} OK`);
  }
  console.log('\n' + '='.repeat(68));
  console.log(total ? `${total} 处风险 (v-show 子节点解引用了初始为 null 的对象)` : '未发现风险');
  process.exit(total ? 1 : 0);
}
