/*
 * 扫描所有页面里「漏出到界面上的 Markdown 语法」与「空按键」类问题。
 *
 * 之前两次事故:
 *   1) 说明文字里写了 **加粗** —— 引擎不支持 Markdown, 星号会原样显示
 *   2) 键盘行直接 concat 裸字符串数组 -> 绑 k.label 得到 undefined -> 空按键
 */
import fs from 'node:fs';
import { UI } from './_paths.mjs'
import path from 'node:path';

/* UI 来自 tools/_paths.mjs (不再写死绝对路径) */
const SRC = path.join(UI, 'src');

function walk(dir, acc) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (/\.(vue|js)$/.test(e.name)) acc.push(p);
  }
  return acc;
}

const files = walk(SRC, []);
let issues = 0;

console.log('='.repeat(62));
console.log('界面文案与键盘渲染检查');
console.log('='.repeat(62));

/* ---- 1) Markdown 语法漏出 ---- */
console.log('\n[1] Markdown 语法漏出到界面');
const MD_PATTERNS = [
  [/\*\*[^*\n]+\*\*/, '**加粗**'],
  [/__[^_\n]+__/, '__加粗__'],
  [/\[[^\]\n]+\]\([^)\n]+\)/, '[链接](url)'],
];
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  /* 只检查 .vue 的 template 段 (script/style 里的符号属于代码) */
  if (!f.endsWith('.vue')) continue;
  const tm = src.match(/<template>([\s\S]*?)<\/template>/);
  if (!tm) continue;
  const lines = tm[1].split('\n');
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/<!--/.test(l)) continue;                    /* 跳过注释 */
    for (const [re, name] of MD_PATTERNS) {
      if (re.test(l)) {
        console.log(`  ${path.relative(SRC, f)}  [${name}]  ${l.trim().slice(0, 80)}`);
        issues++;
      }
    }
    /* 行首 "- " 列表项 / "# " 标题: 必须是文本节点 (有 > 开头才是标签) */
    if (/^\s*[-*]\s+\S/.test(l) && !/^\s*</.test(l)) {
      console.log(`  ${path.relative(SRC, f)}  [列表项]  ${l.trim().slice(0, 80)}`);
      issues++;
    }
    if (/#{1,6}\s+\S/.test(l) && !/^\s*</.test(l)) {
      console.log(`  ${path.relative(SRC, f)}  [标题]  ${l.trim().slice(0, 80)}`);
      issues++;
    }
  }
}
if (!issues) console.log('  (未发现)');

/* ---- 2) 输入面板必须走系统级输入法 ---- */
console.log('\n[2] 输入面板统一使用系统级输入法');
{
  const admin = fs.readFileSync(path.join(SRC, 'pages/admin/admin.vue'), 'utf8');
  const rank = fs.readFileSync(path.join(SRC, 'pages/rank/rank.vue'), 'utf8');
  const checks = [
    ['管理页密码走 openTextEdit', /openTextEdit/.test(admin)],
    ['管理页检查输入法可用性', /isKeyboardAvailable/.test(admin)],
    ['管理页确认后 closeTextEdit', /closeTextEdit/.test(admin)],
    ['管理页保留内置键盘兜底', /kbRows/.test(admin) && /openFallbackKb/.test(admin)],
    ['排行榜昵称走 openTextEdit', /openTextEdit/.test(rank)],
    ['排行榜检查输入法可用性', /isKeyboardAvailable/.test(rank)],
    ['排行榜无字符选择器', !/CHARS|charPage|char-cell|appendChar|clearDraft/.test(rank)],
    ['排行榜无残留状态字段', !/editing|draft|pageIndex/.test(rank)],
  ];
  for (const [label, okFlag] of checks) {
    if (okFlag) console.log('  OK   ' + label);
    else { console.log('  FAIL ' + label); issues++ }
  }
}
console.log('\n' + '='.repeat(62));
console.log(issues ? `发现 ${issues} 个问题` : '全部通过');
console.log('='.repeat(62));
process.exit(issues ? 1 : 0);
