/*
 * 按【文件顺序】列出 app.js.bin 里的 ASCII 字符串, 并在命中关键词处给出上下文。
 * QuickJS 的 atom 表里相邻字符串往往语义相关, 顺序视图比排序视图有用得多。
 *
 * 用法: node _ctx_bin.mjs <bin> <关键词> [前后条数]
 */
import fs from 'node:fs';

const [bin, kw, ctxRaw] = process.argv.slice(2);
const CTX = Number(ctxRaw || 12);
const raw = fs.readFileSync(bin);

/* 抽取 ASCII 串 (>=4 字符) 及其偏移 */
const found = [];
let cur = '', start = 0;
for (let i = 0; i < raw.length; i++) {
  const c = raw[i];
  if (c >= 0x20 && c < 0x7f) { if (!cur) start = i; cur += String.fromCharCode(c) }
  else { if (cur.length >= 4) found.push({ s: cur, o: start }); cur = '' }
}
if (cur.length >= 4) found.push({ s: cur, o: start });

const hits = found.map((f, i) => ({ ...f, i })).filter((f) => f.s.includes(kw));
console.log(`文件 ${raw.length} 字节, 抽出 ${found.length} 条 ASCII 串, 命中 "${kw}" ${hits.length} 处\n`);

for (const h of hits.slice(0, 6)) {
  console.log('='.repeat(70));
  console.log(`命中 @${h.o}  "${h.s}"`);
  console.log('-'.repeat(70));
  for (let k = Math.max(0, h.i - CTX); k <= Math.min(found.length - 1, h.i + CTX); k++) {
    const mark = k === h.i ? '>>' : '  ';
    console.log(`${mark} @${String(found[k].o).padStart(6)}  ${found[k].s.slice(0, 100)}`);
  }
  console.log('');
}
