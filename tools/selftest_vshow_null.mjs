/*
 * 自检: check-vshow-null.mjs 能否区分 v-if 与 v-show。
 * 用一个最小样本 (含 data 里为 null 的 obj) 分别测两种写法。
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { UI } from './_paths.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));

const CHECKER = path.join(HERE, 'check-vshow-null.mjs');
const tmp = path.join(os.tmpdir(), 'vshow-null-selftest');
fs.mkdirSync(path.join(tmp, 'src', 'pages', 'demo'), { recursive: true });

/* 关键: 检查器按 UI 目录结构找页面, 所以这里直接调用它的 checkFile 逻辑做等价验证:
   改用一个独立的最小脚本, 复制判定函数不方便, 改为直接对真实页面做 A/B。 */
const PAGE = path.join(UI, 'src/pages/game/game.vue');
const bak = fs.readFileSync(PAGE, 'utf8');

function runChecker() {
  try { return { code: 0, out: execFileSync(process.execPath, [CHECKER], { encoding: 'utf8', maxBuffer: 1 << 24 }) } }
  catch (e) { return { code: e.status || 1, out: String(e.stdout || '') + String(e.stderr || '') } }
}

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  PASS ' + m) } else { fail++; console.log('  FAIL ' + m) } };

console.log('='.repeat(66));
console.log('check-vshow-null 自检 (v-if 应通过 / v-show 应报错)');
console.log('='.repeat(66));

console.log('\n[A] 当前源码 (v-if)');
let r = runChecker();
ok(r.code === 0, `退出码 0 (实际 ${r.code})`);
ok(/未发现风险/.test(r.out), '输出「未发现风险」');

console.log('\n[B] 换成 v-show');
const broken = bak.replace('v-if="showBag && dropPanel"', 'v-show="showBag && dropPanel"');
ok(broken !== bak, '成功构造故障样本');
fs.writeFileSync(PAGE, broken);
r = runChecker();
ok(r.code !== 0, `退出码非 0 (实际 ${r.code})`);
ok(/dropPanel/.test(r.out), '报错点名 dropPanel');
ok(/v-show="showBag && dropPanel"/.test(r.out), '指出是哪个 v-show');
console.log('    输出节选: ' + (r.out.split('\n').filter((l) => /game|dropPanel|风险/.test(l)).slice(0, 4).map((s) => s.trim()).join(' || ') || '(无)'));

console.log('\n[C] 恢复');
fs.writeFileSync(PAGE, bak);
r = runChecker();
ok(r.code === 0, `恢复后退出码 0 (实际 ${r.code})`);

console.log('\n' + '='.repeat(66));
console.log(`结果: ${pass} 通过, ${fail} 失败`);
console.log('='.repeat(66));
process.exit(fail ? 1 : 0);
