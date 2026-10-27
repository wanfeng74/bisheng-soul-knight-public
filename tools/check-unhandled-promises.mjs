/*
 * 检查「调用平台异步原生方法却没接拒绝」—— 这类 bug 会让真机页面崩溃。
 *
 * 背景 (真机 + 测试均复现):
 *   panet.readFile / writeFile / appendFile / mkdirs 返回 Promise;
 *   $falcon.jsapi.storage.* 也返回 Promise。
 *   文件不存在或目录不可写时会 reject。若调用处不接拒绝, 就是
 *   「未处理的 Promise 拒绝」, 会冒泡到全局把页面带崩:
 *     Error: ENOENT /userdisk/wanfeng/delta_mojin.log  (未捕获)
 *
 * 规则: 出现这些调用时, 同一行必须体现「拒绝已被处理」——
 *   交给 _swallow / _swallowP / _settleVal 等包装器,
 *   或显式 .then(onOk, onErr) / .catch(...) / return 出去。
 */
import fs from 'node:fs';
import { UI } from './_paths.mjs'
import path from 'node:path';

/* UI 来自 tools/_paths.mjs (不再写死绝对路径) */

/* 平台异步原生方法名 */
const ASYNC_NAMES = [
  'readFile', 'writeFile', 'appendFile', 'mkdirs', 'mkdir',
  'getStorage', 'setStorage', 'getGlobalStorage', 'setGlobalStorage',
  'removeStorage', 'clearStorage', 'removeGlobalStorage', 'clearGlobalStorage',
  'getStorageInfo', 'getGlobalStorageInfo',
];

/* 判定「这一行已经处理了拒绝」 */
const HANDLED = [
  /_swallowP?\s*\(/,          /* 专用包装器 */
  /_settleVal\s*\(/,
  /_settle\s*\(/,
  /_callStorage\s*\(/,
  /_callPanet\s*\(/,
  /_panetRead\s*\(/,
  /readTextFileAsync\s*\(/,
  /\.then\s*\(/,              /* 显式 then (第 2 参或随后的 catch 都会被下面的 catch 规则兜住) */
  /\.catch\s*\(/,
  /\breturn\b/,               /* 把 Promise 交给调用方 */
  /\bawait\b/,
];

function walk(dir, acc) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (/\.(vue|js)$/.test(e.name)) acc.push(p);
  }
  return acc;
}

/* 去掉注释, 但【保留换行】—— 否则报出来的行号会整体错位, 根本没法定位。
   (旧实现把块注释连同换行一起吃掉, 行号全错, 等于白报) */
function stripComments(s) {
  let out = '', i = 0;
  const n = s.length;
  while (i < n) {
    const c = s[i], d = s[i + 1];
    if (c === '/' && d === '/') { while (i < n && s[i] !== '\n') { out += ' '; i++ } continue }
    if (c === '/' && d === '*') {
      i += 2; out += '  ';
      while (i < n && !(s[i] === '*' && s[i + 1] === '/')) { out += (s[i] === '\n' ? '\n' : ' '); i++ }
      i += 2; out += '  ';
      continue;
    }
    out += c; i++;
  }
  return out;
}

let problems = 0;
console.log('='.repeat(70));
console.log('平台异步原生调用的拒绝处理检查');
console.log('='.repeat(70));

/* 在「接下来三行」内出现也算已处理 (见下方用法的注释) */
const HANDLED_WINDOW = [
  /_swallowP?\s*\(/,
  /_settleVal\s*\(/,
  /_settle\s*\(/,
  /_callStorage\s*\(/,
  /_callPanet\s*\(/,
  /_panetRead\s*\(/,
  /readTextFileAsync\s*\(/,
  /\.then\s*\(/,
  /\.catch\s*\(/,
];

const callRe = new RegExp('\\.(' + ASYNC_NAMES.join('|') + ')\\s*\\(');

for (const f of walk(path.join(UI, 'src'), [])) {
  const code = stripComments(fs.readFileSync(f, 'utf8'));
  const lines = code.split('\n');
  const hits = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.indexOf('typeof ') >= 0) continue;          /* typeof x.readFile === 'function' */
    if (!callRe.test(line)) continue;
    /* 定义点 (形如 readFile(path) { ) 不算调用 */
    if (/^\s*(readFile|writeFile|appendFile|mkdirs)\s*\([^)]*\)\s*\{/.test(line)) continue;
    let handled = HANDLED.some((r) => r.test(line));
    /* 接下来三行内出现任何一种"已处理"写法也算 —— 常见形态是
       `var r = st.getStorage(...)` 然后下一行 `_settleVal(r, cb)`。 */
    if (!handled) {
      const win = lines.slice(i, i + 3).join('\n');
      /* 窗口内只认包装器 / then / catch。
         不能把裸 return / await 算进来, 否则
             var r = st.getGlobalStorage({key})
             return r
         这种真·未处理的写法会被误判成通过 (自查时发现的漏报)。 */
      handled = HANDLED_WINDOW.some((r) => r.test(win));
    }
    if (!handled) hits.push({ n: i + 1, t: line.trim().slice(0, 100) });
  }
  if (hits.length) {
    problems += hits.length;
    console.log('\n  ' + path.relative(UI, f) + ':');
    for (const h of hits) console.log('      L' + h.n + ':  ' + h.t);
  }
}

console.log('\n' + '='.repeat(70));
console.log(problems ? problems + ' 处调用未处理拒绝 (真机可能崩)' : '全部异步原生调用都处理了拒绝');
process.exit(problems ? 1 : 0);
