/*
 * 从 .so 里抽取「像方法名」的字符串, 并给出 readFile/writeFile/appendFile 的上下文。
 * 用于确认原生模块的真实接口名与调用形态。
 */
import fs from 'node:fs';

const file = process.argv[2];
const KWS = (process.argv[3] || 'readFile,writeFile,appendFile,Global,Panet').split(',');
const raw = fs.readFileSync(file);
const txt = raw.toString('latin1');

/* 抽取所有 >=3 字符的可打印 ASCII 串 */
const strs = [];
let cur = '', start = 0;
for (let i = 0; i < raw.length; i++) {
  const c = raw[i];
  if (c >= 0x20 && c < 0x7f) { if (!cur) start = i; cur += String.fromCharCode(c) }
  else { if (cur.length >= 3) strs.push({ s: cur, o: start }); cur = '' }
}
if (cur.length >= 3) strs.push({ s: cur, o: start });

console.log(`文件 ${file} (${(raw.length / 1024).toFixed(1)}KB)  抽出 ${strs.length} 条串\n`);

for (const kw of KWS) {
  const hits = strs.map((x, i) => ({ ...x, i })).filter((x) => x.s.includes(kw));
  console.log('='.repeat(66));
  console.log(`关键词 "${kw}"  命中 ${hits.length} 处`);
  console.log('-'.repeat(66));
  for (const h of hits.slice(0, 4)) {
    for (let k = Math.max(0, h.i - 6); k <= Math.min(strs.length - 1, h.i + 6); k++) {
      const mark = k === h.i ? '>>' : '  ';
      console.log(`${mark} ${strs[k].s.slice(0, 90)}`);
    }
    console.log('  ' + '-'.repeat(50));
  }
  console.log('');
}
