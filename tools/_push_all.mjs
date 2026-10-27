process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const TOKEN = process.env.GH_TOKEN;
const OWNER = 'wanfeng74', REPO = 'delta-mojin-simulator', BRANCH = 'master';
/* 本地仓库目录。注意别和上面的 REPO (仓库【名】) 混用 —— 批量改名时踩过这个坑 */
const REPO_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const headers = {
  'User-Agent': 'dsh-agent', Accept: 'application/vnd.github+json',
  'Content-Type': 'application/json', ...(TOKEN ? { Authorization: 'Bearer ' + TOKEN } : {}),
};

async function api(url, opts = {}) {
  for (let i = 0; i < 4; i++) {
    try {
      const r = await fetch(url, { headers, ...opts });
      const t = await r.text();
      if (r.ok) return t ? JSON.parse(t) : null;
      if (r.status >= 500 || r.status === 429) { await new Promise((x) => setTimeout(x, 1500 * (i + 1))); continue }
      throw new Error(`${r.status} ${url}\n${t.slice(0, 400)}`);
    } catch (e) {
      if (i === 3) throw e;
      await new Promise((x) => setTimeout(x, 1200 * (i + 1)));
    }
  }
}

function gitBlobSha(buf) {
  const h = crypto.createHash('sha1');
  h.update(`blob ${buf.length}\0`, 'utf8');
  h.update(buf);
  return h.digest('hex');
}

/* ---- 遍历本地文件 (与 _plan_push.mjs 相同的排除规则) ---- */
const IGNORE_DIRS = new Set(['node_modules', '.falcon_', 'amr-inspect', 'dl', 'syncheck', 'out', 'build', '.temp', 'test', '.tmp-jsapi-glibc-build', '.archive-libs', 'data']);
function walk(dir, rel, acc) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const r = rel ? rel + '/' + ent.name : ent.name;
    if (ent.isDirectory()) { if (!IGNORE_DIRS.has(ent.name)) walk(path.join(dir, ent.name), r, acc) }
    else if (ent.isFile()) {
      if (ent.name.endsWith('.amr') && !/^(rk|cvis|cvia)\//.test(r)) continue;
      if (ent.name.endsWith('.log') || /\.bak|\.v2110bak/.test(ent.name)) continue;
      if (ent.name.endsWith('.png') && !/^(screenshots\/|ui\/assets\/|ui\/icon\.png)/.test(r)) continue;
      acc.push(r);
    }
  }
  return acc;
}

/* ---- 提交信息辅助 ---- */

/* 从 ui/src/services/version.js 读 APP_VERSION */
function _appVersion() {
  try {
    const s = fs.readFileSync(path.join(REPO_DIR, 'ui/src/services/version.js'), 'utf8');
    const m = s.match(/APP_VERSION\s*=\s*'([^']+)'/);
    if (m) return m[1];
  } catch (e) {}
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(REPO_DIR, 'ui/package.json'), 'utf8'));
    if (pkg.version) return pkg.version;
  } catch (e) {}
  return '0.0.0';
}

/* 组装本次推送的提交信息。
 * 旧实现把信息写死成 "v1.1.12: 局内背包丢弃/..." —— v1.1.13 之后每次推送
 * 都是同一句话, git 历史完全没法看。现在版本号自动读, 摘要可选:
 *   COMMIT_MSG=...        直接给摘要
 *   CHANGELOG_FILE=...    从更新公告里抓本版本那一节 */
function _commitMessage(changedCount, deletedCount) {
  const ver = _appVersion();
  let body = process.env.COMMIT_MSG || '';
  if (!body && process.env.CHANGELOG_FILE) {
    try {
      const txt = fs.readFileSync(process.env.CHANGELOG_FILE, 'utf8');
      /* 标题里只要【含有】该版本号即可 —— 实际标题可能是 ## v1.1.21 – v1.1.44 (日期) — 摘要 */
      const re = new RegExp('##[^\\n]*' + ver.replace(/\\./g, '\\\\.') + '[\\s\\S]*?(?=\\n##\\s|$)');
      const m = txt.match(re);
      if (m) body = m[0].replace(/^##\s*/, '').trim();
    } catch (e) {}
  }
  const lines = [`v${ver}`];
  if (body) lines.push('', body, '');
  lines.push(`本次变更 ${changedCount} 个文件` + (deletedCount ? `, 删除 ${deletedCount} 个` : ''));
  return lines.join('\n');
}

console.log('== 1) 读取远端状态 ==');
const ref = await api(`https://api.github.com/repos/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`);
const headSha = ref.object.sha;
const commit = await api(`https://api.github.com/repos/${OWNER}/${REPO}/git/commits/${headSha}`);
const tree = await api(`https://api.github.com/repos/${OWNER}/${REPO}/git/trees/${commit.tree.sha}?recursive=1`);
const remote = new Map(tree.tree.filter((n) => n.type === 'blob').map((n) => [n.path, n]));
console.log(`  远端 ${headSha.slice(0, 8)}  blob ${remote.size}`);

console.log('== 2) 计算差异 ==');
const localFiles = walk(REPO_DIR, '', []);
const changed = [], deletions = [], skippedZero = [];
const localSet = new Set();
for (const rel of localFiles) {
  localSet.add(rel);
  const buf = fs.readFileSync(path.join(REPO_DIR, ...rel.split('/')));
  if (buf.length === 0) { skippedZero.push(rel); continue }   /* 0 字节下载残留, 不动远端 */
  const sha = gitBlobSha(buf);
  const r = remote.get(rel);
  if (!r || r.sha !== sha) changed.push({ rel, sha, size: buf.length });
}
for (const rel of remote.keys()) {
  if (!localSet.has(rel)) deletions.push(rel);
}
console.log(`  新增/修改 ${changed.length}`);
console.log(`  远端多余(将删除) ${deletions.length}`);
console.log(`  跳过 0 字节残留 ${skippedZero.length}`);

/* ---- 分批: 所有文件 + 最后一批带删除 ---- */
const BATCH = Number(process.env.BATCH || 60);
const batches = [];
for (let i = 0; i < changed.length; i += BATCH) batches.push(changed.slice(i, i + BATCH));
if (!batches.length) batches.push([]);

let curCommit = commit;
for (let b = 0; b < batches.length; b++) {
  const items = batches[b];
  const isLast = b === batches.length - 1;
  console.log(`\n== 批次 ${b + 1}/${batches.length}: ${items.length} 个文件${isLast ? ' (+删除 ' + deletions.length + ')' : ''} ==`);

  const treeItems = [];
  let n = 0;
  for (const c of items) {
    const buf = fs.readFileSync(path.join(REPO_DIR, ...c.rel.split('/')));
    const blob = await api(`https://api.github.com/repos/${OWNER}/${REPO}/git/blobs`, {
      method: 'POST', body: JSON.stringify({ content: buf.toString('base64'), encoding: 'base64' }),
    });
    treeItems.push({ path: c.rel, mode: '100644', type: 'blob', sha: blob.sha });
    if (++n % 20 === 0) console.log(`  已上传 ${n}/${items.length}`);
    if (c.size > 500 * 1024) console.log(`    (大文件 ${(c.size / 1024).toFixed(0)}KB: ${c.rel})`);
  }
  /* 最后一批带上删除 (sha=null) */
  if (isLast) for (const d of deletions) treeItems.push({ path: d, mode: '100644', type: 'blob', sha: null });

  console.log(`  已上传 ${treeItems.length} 个 tree 条目, 创建 tree/commit`);
  const newTree = await api(`https://api.github.com/repos/${OWNER}/${REPO}/git/trees`, {
    method: 'POST', body: JSON.stringify({ base_tree: curCommit.tree.sha, tree: treeItems }),
  });
  /* 提交信息不能写死 —— 原来这里固定是 "v1.1.12: 局内背包丢弃/...",
     结果 v1.1.13 之后每次推送都用同一句话, git 历史完全没有信息量。
     现在: 版本号从 version.js 读, 摘要优先用环境变量 COMMIT_MSG, 
     其次用 CHANGELOG_FILE 指定的文件首行, 都没有就生成一条中性的。 */
  const msg = isLast
    ? _commitMessage(items.length, deletions.length)
    : `v${_appVersion()} 分批推送 (${b + 1}/${batches.length}): ${items.length} 个文件\n`;
  curCommit = await api(`https://api.github.com/repos/${OWNER}/${REPO}/git/commits`, {
    method: 'POST', body: JSON.stringify({ message: msg, tree: newTree.sha, parents: [curCommit.sha] }),
  });
  console.log(`  提交 ${curCommit.sha.slice(0, 8)}`);
  await api(`https://api.github.com/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`, {
    method: 'PATCH', body: JSON.stringify({ sha: curCommit.sha, force: false }),
  });
  console.log(`  已更新 ${BRANCH}`);
}
console.log(`\n完成. 最终提交 ${curCommit.sha}`);
fs.writeFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '_push_result.json'), JSON.stringify({
  head: curCommit.sha, changed: changed.length, deletions: deletions.length,
}, null, 2));
