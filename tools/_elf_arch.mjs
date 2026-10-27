/* 读 ELF 头判断架构与 libc, 不依赖 readelf/file 命令 */
import fs from 'node:fs';
import path from 'node:path';

const files = process.argv.slice(2);
const EM = { 0x03: 'i386', 0x28: 'ARM(32)', 0x3e: 'x86-64', 0xb7: 'AArch64(64)', 0x08: 'MIPS' };

for (const f of files) {
  if (!fs.existsSync(f)) { console.log(`${f}: 不存在`); continue }
  const b = fs.readFileSync(f);
  const st = fs.statSync(f);
  if (b.length < 20 || b[0] !== 0x7f || b[1] !== 0x45 || b[2] !== 0x4c || b[3] !== 0x46) {
    console.log(`${f}: 不是 ELF (大小 ${st.size})`);
    continue;
  }
  const cls = b[4];                       /* 1=32bit 2=64bit */
  const endian = b[5];                    /* 1=LE 2=BE */
  const machine = endian === 1 ? b.readUInt16LE(18) : b.readUInt16BE(18);
  /* 在动态段里找 libc 名字 */
  const buf = b.toString('latin1');
  const marks = [];
  if (buf.includes('ld-uClibc') || buf.includes('libc.so.0')) marks.push('uclibc');
  if (buf.includes('ld-linux') || buf.includes('libc.so.6')) marks.push('glibc');
  console.log(
    `${path.basename(path.dirname(f))}/${path.basename(f)}\n` +
    `    ${cls === 2 ? '64位' : '32位'}  ${EM[machine] || ('0x' + machine.toString(16))}` +
    `  ${endian === 1 ? '小端' : '大端'}  libc标记: ${marks.join('/') || '未识别'}  ${(st.size / 1024).toFixed(1)}KB`
  );
}
