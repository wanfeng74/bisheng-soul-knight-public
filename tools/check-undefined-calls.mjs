/*
 * 检查「脚本里调用了未定义/未导入的函数」。
 *
 * 这类错误静态看不出来, 真机一跑到就 ReferenceError。已经发生过三次:
 *   - rarityColor 改成别名后漏改引用
 *   - updateNick 里用到未定义的 c
 *   - admin.vue 调用 hardwareReport() 但没加进 import
 *
 * 做法: 收集每个 .vue / .js 的
 *   - import 进来的名字
 *   - 本地 function / var / let / const 声明的名字
 *   - 函数参数名、catch 参数、v-for 局部变量
 * 然后把「形如 name( 的调用」里对不上的挑出来 (排除内建与全局)。
 */
import fs from 'node:fs';
import { UI } from './_paths.mjs'
import path from 'node:path';

/* UI 来自 tools/_paths.mjs (不再写死绝对路径) */

/* 平台/语言提供的东西, 不算未定义 */
const KNOWN = new Set([
  /* 平台全局 */
  '$falcon', 'jsapi', 'require', 'createCanvasContext', 'logInfo', 'logWarn', 'logError',
  'flushLogger', 'loggerStatus', 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval',
  'requestAnimationFrame', 'cancelAnimationFrame', 'fetch', 'console', 'window', 'globalThis',
  /* 平台 bridge 提供的全局函数 (见官方开发指南第 7 节) */
  'readFile', 'write', 'writeFile', 'listFiles', 'rename', 'copy', 'move', 'delete', 'mkdir', 'mkdirs', 'del', 'exists', 'readFileSync', 'writeFileSync', 'appendFile',
  'getSystemInfo', 'getSystemStatus', 'getShmInfo', 'getWlan0Address', 'getScreenSize',
  'getDeviceInfo', 'getDeviceBaseInfo', 'getDeviceClientInfo', 'getDeviceIdentifier',
  'initBridge', 'bridge', 'system', 'playAudio', 'stopAudio', 'setAudioVolume', 'getAudioInfo',
  'startRecord', 'stopRecord', 'getRecordInfo', 'wifiScan', 'wifiScanResults', 'wifiStatus',
  'fetchStream', 'downloadFile', 'openSystemVideo', 'setBtQuality',
  /* 内建 */
  'Math', 'Date', 'JSON', 'Object', 'Array', 'String', 'Number', 'Boolean', 'RegExp', 'Error',
  'Promise', 'Map', 'Set', 'WeakMap', 'WeakSet', 'Symbol', 'Proxy', 'Reflect',
  'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'encodeURIComponent', 'decodeURIComponent',
  'encodeURI', 'decodeURI', 'escape', 'unescape',
  'Uint8Array', 'Uint8ClampedArray', 'Int8Array', 'Uint16Array', 'Int16Array',
  'Uint32Array', 'Int32Array', 'Float32Array', 'Float64Array', 'ArrayBuffer', 'DataView',
  'Function', 'eval', 'NaN', 'Infinity', 'undefined',
  /* 关键字 */
  'if', 'for', 'while', 'switch', 'catch', 'return', 'typeof', 'new', 'delete', 'void',
  'in', 'of', 'do', 'else', 'try', 'finally', 'throw', 'case', 'break', 'continue',
  'function', 'var', 'let', 'const', 'class', 'super', 'this', 'async', 'await', 'yield',
]);

/* 单遍扫描去掉注释与字符串。
   注意: 不能先删 // 注释 —— 字符串里的 URL (http://...) 会被误当成注释开头,
   导致后续引号配对错乱, 把字符串内容当成代码 (实际踩过这个坑)。 */
function stripCommentsAndStrings(s) {
  let out = '';
  let i = 0;
  const n = s.length;
  while (i < n) {
    const c = s[i], d = s[i + 1];
    if (c === '/' && d === '/') { while (i < n && s[i] !== '\n') i++; continue }
    if (c === '/' && d === '*') { i += 2; while (i < n && !(s[i] === '*' && s[i + 1] === '/')) i++; i += 2; continue }
    if (c === "'" || c === '"' || c === '`') {
      const q = c; i++;
      while (i < n && s[i] !== q) { if (s[i] === '\\') i++; i++ }
      i++; out += ' '; continue;
    }
    out += c; i++;
  }
  return out;
}

function collectDeclared(code) {
  const names = new Set();
  /* import { a, b as c } / import d */
  for (const m of code.matchAll(/import\s*\{([^}]+)\}\s*from/g)) {
    for (const s of m[1].split(',')) {
      const seg = s.trim(); if (!seg) continue;
      const as = seg.match(/^(\S+)\s+as\s+(\S+)$/);
      names.add(as ? as[2] : seg);
    }
  }
  for (const m of code.matchAll(/import\s+([A-Za-z_$][\w$]*)\s+from/g)) names.add(m[1]);
  /* 声明 */
  for (const m of code.matchAll(/(?:function|var|let|const)\s+([A-Za-z_$][\w$]*)/g)) names.add(m[1]);
  /* 函数参数 */
  for (const m of code.matchAll(/function\s*[A-Za-z_$\w]*\s*\(([^)]*)\)/g)) addParams(names, m[1]);
  /* 方法简写 (含 async / get / set) 的【名字与参数】。
   * 必须排除「调用点 + 函数实参」这种误判, 例如:
   *     readTextFileAsync(p, function (txt) { ... })
   * 它外形是 `名字(参数) {`, 但其实是调用, 不是定义。
   * 判据: 参数里出现 function / => / 嵌套括号 就按调用处理。
   * (这个误判曾让 readTextFileAsync 漏报 -> 真机 ReferenceError -> SN 读不到) */
  for (const m of code.matchAll(/^\s*(?:async\s+)?(?:get\s+|set\s+)?([A-Za-z_$][\w$]*)\s*\(([^)]*)\)\s*\{/gm)) {
    const params = m[2];
    if (/function|=>|\(/.test(params)) continue;   /* 是调用点, 不是方法定义 */
    names.add(m[1]);
    addParams(names, params);
  }
  /* 箭头函数参数 (用 [^()] 避免 "((resolve) =>" 这种嵌套把内层吃掉) */
  for (const m of code.matchAll(/\(([^()]*)\)\s*=>/g)) addParams(names, m[1]);
  for (const m of code.matchAll(/([A-Za-z_$][\w$]*)\s*=>/g)) names.add(m[1]);
  /* 对象字面量的键 */
  for (const m of code.matchAll(/([A-Za-z_$][\w$]*)\s*:/g)) names.add(m[1]);
  return names;
}

function addParams(set, raw) {
  for (const s of String(raw).split(',')) {
    const n = s.trim().split(/[=\s]/)[0];
    if (/^[A-Za-z_$][\w$]*$/.test(n)) set.add(n);
  }
}

function walk(dir, acc) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (/\.(vue|js)$/.test(e.name)) acc.push(p);
  }
  return acc;
}

let total = 0;
console.log('='.repeat(66));
console.log('未定义函数调用检查 (ReferenceError 隐患)');
console.log('='.repeat(66));

for (const f of walk(path.join(UI, 'src'), [])) {
  const src = fs.readFileSync(f, 'utf8');
  const sm = src.match(/<script>([\s\S]*?)<\/script>/);
  const code = sm ? sm[1] : src;
  const declared = collectDeclared(code);

  /* 去掉字符串与注释, 避免误报 */
  const cleaned = stripCommentsAndStrings(code);

  const missing = new Map();
  for (const m of cleaned.matchAll(/(^|[^\w$.])([A-Za-z_$][\w$]*)\s*\(/g)) {
    const name = m[2];
    if (KNOWN.has(name) || declared.has(name)) continue;
    missing.set(name, (missing.get(name) || 0) + 1);
  }
  /* 也检查「裸标识符」形式的引用 (不带括号), 但只报那些看起来像本模块函数的 */
  if (missing.size) {
    total += missing.size;
    console.log(`\n  ${path.relative(UI, f)}:`);
    for (const [n, c] of missing) console.log(`      ${n}(...)  出现 ${c} 次  ->  未导入/未定义`);
  }
}

console.log('\n' + '='.repeat(66));
console.log(total ? `${total} 处可疑调用` : '未发现未定义调用');
process.exit(total ? 1 : 0);
