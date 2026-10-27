/*
 * 检查「import 的符号」与「methods / computed 里的键」重名。
 *
 * 重名后果:
 *   import { rarityColor }  +  methods: { rarityColor(r) { return rarityColor(r) } }
 *   -> 方法体里的 rarityColor 指向方法自己 -> 无限递归 -> RangeError
 *
 * 页面里已有的其它重名如果确实是「同名转发到 import」, 那一定有一个是别名,
 * 所以这里只报「方法体里引用了与 import 同名的裸标识符」这种真危险的情况。
 */
import fs from 'node:fs';
import { UI } from './_paths.mjs'
import path from 'node:path';

/* UI 来自 tools/_paths.mjs (不再写死绝对路径) */
const PAGES = fs.readdirSync(path.join(UI, 'src/pages')).filter((d) =>
  fs.existsSync(path.join(UI, 'src/pages', d, d + '.vue')));

let issues = 0;
console.log('='.repeat(62));
console.log('import 与 methods/computed 重名检查');
console.log('='.repeat(62));

for (const page of PAGES) {
  const file = path.join(UI, 'src/pages', page, page + '.vue');
  const src = fs.readFileSync(file, 'utf8');
  const sm = src.match(/<script>([\s\S]*?)<\/script>/);
  if (!sm) continue;
  const script = sm[1];

  /* import 的本地名 -> 原名 */
  const imported = new Map();
  for (const m of script.matchAll(/import\s*\{([^}]+)\}\s*from/g)) {
    for (const part of m[1].split(',')) {
      const seg = part.trim();
      if (!seg) continue;
      const asM = seg.match(/^(\S+)\s+as\s+(\S+)$/);
      if (asM) imported.set(asM[2], asM[1]);
      else imported.set(seg, seg);
    }
  }
  if (!imported.size) { console.log(`  ${page.padEnd(9)} 无 import`); continue }

  /* methods / computed 段 */
  const bad = [];
  for (const block of ['methods', 'computed']) {
    const bm = script.match(new RegExp(block + '\\s*:\\s*\\{([\\s\\S]*?)\\n\\s{2}\\},'));
    if (!bm) continue;
    const body = bm[1];
    /* 找出该段里每个方法/计算属性的定义与其函数体 */
    const defRe = /^\s{4}([A-Za-z_$][\w$]*)\s*\(([^)]*)\)\s*\{([\s\S]*?)^\s{4}\},/gm;
    let dm;
    while ((dm = defRe.exec(body))) {
      const name = dm[1], fnBody = dm[3];
      if (!imported.has(name)) continue;
      /* 函数体里是否裸引用了同名标识符 (排除 obj.name 这种属性访问) */
      const re = new RegExp('(^|[^\\w$.])' + name + '\\s*\\(', 'g');
      if (re.test(fnBody)) {
        bad.push({ block, name, importedFrom: imported.get(name), snippet: fnBody.trim().slice(0, 90) });
      }
    }
  }

  if (bad.length) {
    issues += bad.length;
    console.log(`\n  ${page}.vue  发现危险重名:`);
    for (const b of bad) {
      console.log(`      [${b.block}] ${b.name}()  --- 同名来自 import "${b.importedFrom}"`);
      console.log(`          方法体: ${b.snippet}`);
      console.log(`          -> 方法体里的 ${b.name} 会指向方法自己, 无限递归!`);
    }
  } else {
    console.log(`  ${page.padEnd(9)} OK (${imported.size} 个 import, 无危险重名)`);
  }
}

console.log('\n' + '='.repeat(62));
console.log(issues ? `${issues} 处危险重名` : '全部通过');
process.exit(issues ? 1 : 0);
