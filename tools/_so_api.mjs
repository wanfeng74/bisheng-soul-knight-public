/*
 * 抽取 .so 里所有 "usage: xxx(...)" 形式的串 —— 原生模块自己校验参数时留下的,
 * 等于一份现成的 API 清单。
 */
import fs from 'node:fs';

const file = process.argv[2];
const raw = fs.readFileSync(file);
const txt = raw.toString('latin1');

const usages = new Set();
const re = /usage:\s*([A-Za-z_][A-Za-z0-9_]*)\s*\(([^)]*)\)/g;
let m;
while ((m = re.exec(txt)) !== null) usages.add(`${m[1]}(${m[2]})`);

console.log(`文件 ${file}`);
console.log(`\n=== usage 里声明的 API (${usages.size} 个) ===`);
for (const u of [...usages].sort()) console.log('  ' + u);

/* 再按「疑似方法名」列表扫一遍: 短小、驼峰、常见动词开头 */
const KNOWN = ['readFile', 'writeFile', 'appendFile', 'mkdirs', 'mkdir', 'readDir', 'listDir', 'listFiles',
               'exists', 'remove', 'unlink', 'deleteFile', 'rename', 'copy', 'move', 'stat', 'size',
               'request', 'wifiSsid', 'wifiStatus', 'getWlan0Address', 'wifiScan', 'wifiScanResults',
               'exec', 'shell', 'system', 'reboot', 'getProperty', 'setProperty', 'log',
               'startTextEdit', 'closeTextEdit', 'textEditFinished', 'Global', 'Panet'];
console.log(`\n=== 已知名逐个确认 ===`);
const hits = [];
for (const k of KNOWN) if (txt.includes(k)) hits.push(k);
console.log('  存在: ' + (hits.join(' ') || '(无)'));
const miss = KNOWN.filter((k) => !txt.includes(k));
console.log('  不存在: ' + (miss.join(' ') || '(无)'));
