/*
 * 检查器: 不要对 data 里以 _ 开头的字段做 ++ / -- / += (即"先读后写")。
 *
 * 原因: Vue 2 不会把 data 中 _ / $ 开头的键代理到实例上 ——
 *   data() { return { _n: 0 } }  ->  this._n === undefined
 * 于是 this._n++ 得到 NaN, 而 this._n < 5 恒为 false。
 * 真机上踩到两处:
 *   game.vue  this._interactTaps++ -> 日志永远打 tap#NaN
 *   game.vue  this._initTries      -> undefined < 5 为假, canvas 未就绪时不再重试, 直接报错
 *
 * 纯赋值 (this._x = v) 不受影响 —— 那会创建一个普通实例属性, 后续读写一致,
 * 只是不具备响应式。所以只禁"先读后写"这几种写法。
 *
 * 修法二选一: ① 去掉下划线前缀 (变成被代理的响应式字段); ② 写成 (this._x || 0) + 1。
 */
import fs from 'node:fs';
import path from 'node:path';
import { UI } from './_paths.mjs';
const SRC = path.join(UI, 'src');

const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(js|vue)$/.test(e.name)) files.push(p);
  }
})(SRC);

let issues = 0;
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  const rel = path.relative(UI, f);

  /* 找出 data() 里声明的 _ 开头字段 */
  const declared = new Set();
  for (const m of src.matchAll(/^\s{4,8}(_[A-Za-z]\w*)\s*:/gm)) declared.add(m[1]);
  if (!declared.size) continue;

  const lines = src.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const name of declared) {
      /* 先读后写: ++ / -- / += / -= 都会先读当前值 */
      const re = new RegExp('this\\.' + name + '\\s*(\\+\\+|--|\\+=|-=)');
      if (re.test(line)) {
        issues++;
        console.log(`  ${rel}:${i + 1}  this.${name} 先读后写 (Vue 不代理 _ 开头的 data 字段, 读到的永远是 undefined)`);
        console.log(`      ${line.trim()}`);
      }
      /* 直接与数字比较也会因 undefined 得到非预期结果 */
      const reCmp = new RegExp('this\\.' + name + '\\s*[<>]=?\\s*\\d');
      if (reCmp.test(line)) {
        issues++;
        console.log(`  ${rel}:${i + 1}  this.${name} 与数字比较 (undefined < n 恒为 false)`);
        console.log(`      ${line.trim()}`);
      }
    }
  }
}

console.log('\n' + '='.repeat(62));
console.log(issues
  ? `${issues} 处对 _ 开头 data 字段的"先读后写" —— 这些读到的都是 undefined`
  : '未发现对 _ 开头 data 字段的先读后写');
process.exit(issues ? 1 : 0);
