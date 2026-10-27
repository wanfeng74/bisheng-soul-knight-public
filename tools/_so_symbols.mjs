/*
 * 在 .so 里搜符号名 (纯字符串扫描, 不依赖 nm/readelf)。
 * 目的: 确认 readFile / startTextEdit / Global 这些名字到底由哪个库提供。
 */
import fs from 'node:fs';
import path from 'node:path';

const files = process.argv.slice(2);
const NEEDLES = ['readFile', 'writeFile', 'write', 'listFiles', 'rename', 'copy', 'move', 'delete', 'mkdir',
                 'startTextEdit', 'closeTextEdit', 'textEditFinished', 'editConfirmed',
                 'getSystemInfo', 'getWlan0Address', 'Global', 'Panet', 'TwoFinger', 'bridge', 'jsapi'];

for (const f of files) {
  if (!fs.existsSync(f)) { console.log(`${f}: 不存在\n`); continue }
  const raw = fs.readFileSync(f);
  const txt = raw.toString('latin1');
  console.log('='.repeat(70));
  console.log(`${path.basename(path.dirname(f))}/${path.basename(f)}  (${(raw.length / 1024).toFixed(1)}KB)`);
  console.log('-'.repeat(70));
  const hits = [];
  for (const n of NEEDLES) {
    let c = 0, i = 0;
    while ((i = txt.indexOf(n, i)) >= 0) { c++; i += n.length }
    if (c) hits.push(`${n}×${c}`);
  }
  console.log('  命中: ' + (hits.join('  ') || '(全无)'));
  console.log('');
}
