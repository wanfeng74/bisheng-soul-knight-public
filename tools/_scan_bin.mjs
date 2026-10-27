/*
 * 在 QuickJS 字节码 (app.js.bin) 里做【字节级】字符串搜索。
 *
 * 关键: 中文字符串以 UTF-16LE 存储, ASCII 以 UTF-8 存储。
 * 用 raw.toString('utf16le').includes(...) 会漏掉奇数偏移处的字符串,
 * 必须直接在 Buffer 上 indexOf。
 *
 * 用法: node _tools/_scan_bin.mjs <bin路径> <关键词1> <关键词2> ...
 */
import fs from 'node:fs';

const [binPath, ...needles] = process.argv.slice(2);
if (!binPath) { console.log('用法: node _scan_bin.mjs <app.js.bin> 关键词...'); process.exit(1) }

const raw = fs.readFileSync(binPath);
console.log(`文件: ${binPath}  (${raw.length} 字节)\n`);

function countByte(buf, needle) {
  const b = Buffer.from(needle, 'utf8');
  let n = 0, i = 0;
  while ((i = buf.indexOf(b, i)) >= 0) { n++; i++; }
  return n;
}
function countWide(buf, needle) {
  const b = Buffer.from(needle, 'utf16le');
  let n = 0, i = 0;
  while ((i = buf.indexOf(b, i)) >= 0) { n++; i += 2; }
  return n;
}

console.log('关键词'.padEnd(34) + 'UTF8'.padStart(6) + 'UTF16LE'.padStart(9));
console.log('-'.repeat(52));
for (const n of needles) {
  const a = countByte(raw, n);
  const b = countWide(raw, n);
  const flag = (a || b) ? '' : '   <-- 未找到';
  console.log(String(n).padEnd(34) + String(a).padStart(6) + String(b).padStart(9) + flag);
}

/* 额外: 把所有可打印的 ASCII 字符串抽出来, 便于发现 API 名 */
if (process.env.DUMP_ASCII) {
  const strs = [];
  let cur = '';
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (c >= 0x20 && c < 0x7f) cur += String.fromCharCode(c);
    else { if (cur.length >= 6) strs.push(cur); cur = ''; }
  }
  const uniq = [...new Set(strs)].sort();
  fs.writeFileSync(binPath + '.ascii.txt', uniq.join('\n'), 'utf8');
  console.log(`\n已导出 ${uniq.length} 条 ASCII 字符串 -> ${binPath}.ascii.txt`);
}
