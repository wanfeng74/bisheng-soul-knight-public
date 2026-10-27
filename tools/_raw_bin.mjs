/*
 * 原样转储 app.js.bin 的某个字节区间。
 * QuickJS 的 atom 串带长度前缀 (非打印字节), 会把可打印串切断,
 * 所以按字节看原文比只抽 ASCII 串更可靠。
 *
 * 用法: node _raw_bin.mjs <bin> <起> <止>
 */
import fs from 'node:fs';
const [bin, a, b] = process.argv.slice(2);
const raw = fs.readFileSync(bin);
const from = Number(a), to = Number(b);
const seg = raw.slice(from, to);

let out = '';
for (const c of seg) {
  if (c >= 0x20 && c < 0x7f) out += String.fromCharCode(c);
  else if (c === 0) out += '␀';
  else if (c < 0x20) out += '␟' + c.toString(16).padStart(2, '0');
  else out += '·';
}
console.log(`区间 ${from}..${to}  (${seg.length} 字节)\n`);
/* 每 96 字符一行, 同时给出偏移 */
for (let i = 0; i < out.length; i += 96) {
  console.log(String(from + i).padStart(7) + ' | ' + out.slice(i, i + 96));
}
