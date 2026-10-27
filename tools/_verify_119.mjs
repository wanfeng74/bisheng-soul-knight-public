import fs from 'node:fs';
import { REPO } from './_paths.mjs'
import path from 'node:path';
import zlib from 'node:zlib';

/* REPO 来自 tools/_paths.mjs (不再写死绝对路径) */
const VER = process.argv[2] || '1_1_9';

function parseZip(buf) {
  const out = []; let eocd = -1;
  for (let i = buf.length - 22; i >= 0 && i > buf.length - 66000; i--) if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) return out;
  const count = buf.readUInt16LE(eocd + 10); let off = buf.readUInt32LE(eocd + 16);
  for (let n = 0; n < count; n++) {
    const nameLen = buf.readUInt16LE(off + 28), extraLen = buf.readUInt16LE(off + 30), cmtLen = buf.readUInt16LE(off + 32);
    const lho = buf.readUInt32LE(off + 42);
    out.push({
      name: buf.toString('utf8', off + 46, off + 46 + nameLen),
      method: buf.readUInt16LE(off + 10), csize: buf.readUInt32LE(off + 20), usize: buf.readUInt32LE(off + 24),
      dataOffset: lho + 30 + buf.readUInt16LE(lho + 26) + buf.readUInt16LE(lho + 28),
    });
    off += 46 + nameLen + extraLen + cmtLen;
  }
  return out;
}
const rd = (buf, e) => { const r = buf.subarray(e.dataOffset, e.dataOffset + e.csize); return e.method === 0 ? r : zlib.inflateRawSync(r); };

let allOk = true;
for (const plat of ['rk', 'cvis', 'cvia']) {
  const p = path.join(REPO, plat, `8001865309000007.${VER}-${plat}.amr`);
  if (!fs.existsSync(p)) { console.log('缺产物: ' + p); allOk = false; continue }
  const buf = fs.readFileSync(p);
  const ents = parseZip(buf);
  const names = ents.map((e) => e.name);
  const js = names.filter((n) => n.endsWith('.js.bin'));
  const png = names.filter((n) => n.endsWith('.png'));
  const sos = names.filter((n) => n.endsWith('.so'));
  const mf = ents.find((e) => e.name === 'manifest.json');
  const mfj = mf ? JSON.parse(rd(buf, mf).toString('utf8')) : {};
  console.log(`\n===== ${plat}  ${(buf.length / 1024).toFixed(1)} KB =====`);
  console.log(`  JS: ${js.join(', ')}   (${js.length} 个)`);
  console.log(`  PNG: ${png.length}   .so: ${sos.map((s) => s.split('/').pop()).join('+')}`);
  console.log(`  manifest version=${mfj.version}`);
  if (js.length !== 1 || js[0] !== 'app.js.bin') { console.log('  !! 不是单文件'); allOk = false }
  if (mfj.version !== VER.replace(/_/g, '.')) { console.log('  !! manifest 版本不符'); allOk = false }

  const app = ents.find((e) => e.name === 'app.js.bin');
  if (app) {
    /* 注意: QuickJS 字节码里中文是 UTF-16LE, ASCII 是 UTF-8, 不能统一当 latin1 搜 */
    const raw = rd(buf, app);
    const cnt = (s) => {
      const n = Buffer.from(s, /[\u4e00-\u9fff]/.test(s) ? 'utf16le' : 'utf8');
      let c = 0, i = 0;
      while (true) { i = raw.indexOf(n, i); if (i < 0) break; c++; i++ }
      return c;
    };
    const marks = [
      ['管理密码', '<ADMIN_PASSWORD>'],
      ['关于页-玩法', '玩法'],
      ['关于页-品质', '品质'],
      ['admin 页名', 'admin'],
      ['日志空态', '暂无日志'],
      ['日志状态文案', '新日志在上'],
      ['诊断标题', '接口诊断'],
      ['诊断能力探测', 'putImageData'],
      ['调试模式文案', '调试模式'],
      ['锁定按钮', '锁定'],
      ['管理入口文案', '管理入口'],
      ['排行榜地址', '<SERVER_IP>:16513'],
      ['海洋之泪', '海洋之泪'],
      ['非洲之心', '非洲之心'],
      ['物品总数标记', 'OCEAN_TEAR'],
      /* 局内背包丢弃面板 (v1.1.19 重做: 按钮必须横排) */
      ['丢弃面板容器', 'drop-panel'],
      ['丢弃按钮横排', 'drop-actions'],
      ['丢弃步进框', 'drop-num-box'],
      ['丢弃面板图标', 'drop-icon'],
      ['丢弃提示-将丢弃', '将丢弃'],
      ['丢弃提示-不返还', '不返还'],
      /* 管理页输出区 (v1.1.20 改为 flex 自适应) */
      ['诊断输出区', 'diagscroll'],
      ['分节标题样式', 'logline-sec'],
      /* v1.1.28: 输入面板统一走系统级输入法, 自绘键盘已移除 */
      ['密码输入按钮', 'pw-btn-main'],
      ['输入法拉起', 'startTextEdit'],
      ['原生实例', 'readFile'],
      ['设备配置文件', 'sys_config.conf'],
      ['昵称唯一提示', 'name_taken'],
    ];
    const miss = [];
    const detail = [];
    for (const [label, m] of marks) {
      const c = cnt(m);
      detail.push(`${label}×${c}`);
      if (!c) miss.push(label);
    }
    console.log(`  app.js.bin ${raw.length} B  标记: ${miss.length ? '缺失 ' + miss.join(',') : '全部命中'}`);
    console.log(`    ${detail.join('  ')}`);
    if (miss.length) allOk = false;
  }
}
console.log(`\n综合: ${allOk ? 'PASS' : '存在异常'}`);
process.exit(allOk ? 0 : 1);
