/*
 * 真正 import 每一个服务/引擎模块, 抓 ESM 语法错误。
 *
 * 为什么需要: `node --check foo.js` 对 ESM 文件的检查不可靠 ——
 * 它可能按 CommonJS 解析而放过错误 (实际发生过: leaderboard.js 有语法错误,
 * --check 说 OK, 但真机/测试一 import 就 SyntaxError)。
 */
import fs from 'node:fs';
import { UI } from './_paths.mjs'
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/* UI 来自 tools/_paths.mjs (不再写死绝对路径) */

/* 需要的最小全局桩 (模块顶层可能会访问) */
globalThis.$falcon = { navTo() {}, env: {}, jsapi: {}, __deltaCfg: {}, __deltaDb: null };
globalThis.jsapi = {};
globalThis.window = globalThis;
globalThis.require = () => { throw new Error('no native module') };
globalThis.logInfo = () => {};
globalThis.logWarn = () => {};
globalThis.logError = () => {};

function walk(dir, acc) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.name.endsWith('.js')) acc.push(p);
  }
  return acc;
}

const files = walk(path.join(UI, 'src/services'), []).sort();
let pass = 0, fail = 0;
const bad = [];

console.log('='.repeat(62));
console.log('模块可加载性检查 (抓 ESM 语法错误)');
console.log('='.repeat(62));

for (const f of files) {
  const rel = path.relative(UI, f);
  try {
    await import(pathToFileURL(f).href);
    pass++;
  } catch (e) {
    const msg = String((e && e.message) || e);
    /* 平台原生模块 (panet / Eric / twofinger) 在 Node 里本来就找不到 ——
       这属于"缺运行环境", 不算问题。
       其余的加载失败一律算失败: 旧实现把一切非 SyntaxError 都当通过,
       结果 native.js 用裸模块名 import 时它照样报"可加载" —— 假通过,
       等于没检查。(native.js 现在正是 import PanetModule from 'panet') */
    const nativeMissing = (e && e.code === 'ERR_MODULE_NOT_FOUND') &&
                          /'(panet|Eric|twofinger)'/.test(msg);
    const syntaxErr = /SyntaxError|Unexpected token|Invalid or unexpected|Cannot use import|already been declared/.test(msg);
    if (syntaxErr || !nativeMissing) {
      fail++; bad.push(rel + '  ->  ' + msg);
      console.log(`  FAIL ${rel}`);
      console.log(`       ${msg}`);
    } else {
      pass++;
    }
  }
}

console.log('\n' + '='.repeat(62));
console.log(`检查 ${files.length} 个模块:  ${pass} 可加载,  ${fail} 语法错误`);
if (bad.length) { console.log('\n语法错误清单:'); for (const b of bad) console.log('  - ' + b) }
console.log('='.repeat(62));
process.exit(fail ? 1 : 0);
