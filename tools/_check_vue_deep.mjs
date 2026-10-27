import fs from 'node:fs';
import { UI } from './_paths.mjs'
import vm from 'node:vm';

/* UI 来自 tools/_paths.mjs (不再写死绝对路径) */
let ok = 0, bad = 0;
for (const f of ['about', 'admin', 'game', 'stash', 'index', 'rank', 'shop']) {
  const p = `${UI}\\src\\pages\\${f}\\${f}.vue`;
  if (!fs.existsSync(p)) { console.log(`  跳过 ${f} (不存在)`); continue }
  const s = fs.readFileSync(p, 'utf8');
  const m = s.match(/<script>([\s\S]*?)<\/script>/);
  if (!m) { console.log(`  ${f}: 无 script`); bad++; continue }

  /* 去掉 import 与 export 关键字, 只做语法编译 */
  const js = m[1]
    .replace(/^\s*import[\s\S]*?from\s+'[^']+'\s*$/gm, '')
    .replace(/^\s*import\s+'[^']+'\s*$/gm, '')
    .replace(/export\s+default/, 'var __component =');

  let scriptOk = true, err = '';
  try { new vm.Script(js, { filename: f + '.js' }) } catch (e) { scriptOk = false; err = e.message }

  /* 标签配平: 直接统计「非自闭合开标签」与「闭标签」的数量。
     注意: 不要用属性感知的复杂正则去「解析」, 那种写法在不同段落上结果不一致;
     计数法简单且可靠 (自闭合标签单独扣除)。 */
  const tmpl = (s.match(/<template>([\s\S]*)<\/template>/) || [, ''])[1];
  const stat = (tag) => {
    const openAll = (tmpl.match(new RegExp('<' + tag + '[\\s>]', 'g')) || []).length;
    const self = (tmpl.match(new RegExp('<' + tag + '[^>]*?/>', 'g')) || []).length;
    const close = (tmpl.match(new RegExp('</' + tag + '>', 'g')) || []).length;
    return { open: openAll - self, close };
  };
  const d = stat('div'), t = stat('text'), sc = stat('scroller');
  const balOk = d.open === d.close && t.open === t.close && sc.open === sc.close;
  const detail = `div ${d.open}/${d.close} text ${t.open}/${t.close} scroller ${sc.open}/${sc.close}`;

  const line = `  ${f.padEnd(8)} script:${scriptOk ? 'OK' : 'FAIL'}  标签:${balOk ? '平衡' : '不平衡!'}  (${detail})`;
  console.log(line);
  if (!scriptOk) { console.log('      ' + err); bad++ } else if (!balOk) bad++; else ok++;
}
console.log(`\n通过 ${ok}, 异常 ${bad}`);
process.exit(bad ? 1 : 0);
