/*
 * 抽取 app.js.bin 里的 ASCII 串 (可设最小长度), 并可按正则筛选。
 * QuickJS 字节码里短字段名 (SN / sn / MAC) 很关键, 不能按 6 字符门槛过滤掉。
 *
 * 用法: node _strings_bin.mjs <bin> [最小长度=2] [筛选正则]
 */
import fs from 'node:fs';

const [bin, minRaw, filterRaw] = process.argv.slice(2);
const MIN = Number(minRaw || 2);
const filter = filterRaw ? new RegExp(filterRaw, 'i') : null;
const raw = fs.readFileSync(bin);

const out = [];
let cur = '', start = 0;
for (let i = 0; i < raw.length; i++) {
  const c = raw[i];
  if (c >= 0x20 && c < 0x7f) { if (!cur) start = i; cur += String.fromCharCode(c) }
  else { if (cur.length >= MIN) out.push({ s: cur, o: start }); cur = '' }
}
if (cur.length >= MIN) out.push({ s: cur, o: start });

console.log(`文件 ${bin}  (${raw.length} 字节), 抽出 ${out.length} 条 (最小长度 ${MIN})\n`);
let n = 0;
for (const it of out) {
  if (filter && !filter.test(it.s)) continue;
  console.log(`@${String(it.o).padStart(6)}  ${it.s.slice(0, 160)}`);
  if (++n >= 200) { console.log('...(截断)'); break }
}
if (!n) console.log('(无匹配)');
