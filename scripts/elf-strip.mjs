#!/usr/bin/env node
/*
 * ELF 库 strip 工具（官方约定：库产物 strip 后再放置）。
 *
 * 官方流程用交叉工具链的 <tuple>-strip；本机 Windows 上跑不了 Bootlin 的
 * GNU strip（Linux x86_64 可执行文件），所以借 zig 自带的 objcopy：
 *     _ref/zig/z/zig.exe objcopy --strip-all <src> <dst>
 * 契约 §7：组合包暂存阶段必须用 zig objcopy --strip-all 处理
 * libjsapi_bridge.so（源库不动，只 strip 副本）；找不到 zig 时抛错。
 *
 * 除了 strip，本文件还导出纯 JS 的 ELF 头解析 elfInfo()，供
 * stage-libs / build-amr 校验 strip 前后架构与 libc 类型不变。
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
export const PROJECT = resolve(HERE, '..')
/* 工作区根 = D:\PROJECT2，_ref 工具物料在这里 */
export const WORKSPACE = resolve(PROJECT, '..')
export const ZIG_RELATIVE = join('_ref', 'zig', 'z', 'zig.exe')

/* 查找 zig：
 *   1) 环境变量 ZIG_EXE
 *   2) 契约指定位置 _ref/zig/z/zig.exe
 *   3) _ref/zig 下递归找 zig.exe
 * 找不到返回 null（由调用方决定报错还是降级）。 */
export function findZig() {
  if (process.env.ZIG_EXE && existsSync(process.env.ZIG_EXE)) return process.env.ZIG_EXE
  const exact = join(WORKSPACE, ZIG_RELATIVE)
  if (existsSync(exact)) return exact
  const base = join(WORKSPACE, '_ref', 'zig')
  if (!existsSync(base)) return null
  const stack = [base]
  while (stack.length) {
    const d = stack.pop()
    let entries
    try { entries = readdirSync(d, { withFileTypes: true }) } catch (e) { continue }
    for (const e of entries) {
      const p = join(d, e.name)
      if (e.isDirectory()) stack.push(p)
      else if (e.name === 'zig.exe') return p
    }
  }
  return null
}

/* 纯 JS 读 ELF 头：不依赖 readelf/file，Windows 开发机上也能跑。
 * 返回 { cls, machine, arch, libc, size }；不是 ELF 返回 null。
 *   arch：'arm32'(0x28) / 'aarch64'(0xb7) / 'm<hex>'
 *   libc：'uclibc' / 'glibc' / 'unknown'（扫动态段字符串判断） */
export function elfInfo(file) {
  let b
  try { b = readFileSync(file) } catch (e) { return null }
  if (b.length < 64 || b[0] !== 0x7f || b[1] !== 0x45 || b[2] !== 0x4c || b[3] !== 0x46) return null
  const cls = b[4]
  const endian = b[5]
  const machine = endian === 1 ? b.readUInt16LE(18) : b.readUInt16BE(18)
  const s = b.toString('latin1')
  let libc = 'unknown'
  if (s.indexOf('ld-uClibc') >= 0 || s.indexOf('libc.so.0') >= 0) libc = 'uclibc'
  else if (s.indexOf('ld-linux') >= 0 || s.indexOf('libc.so.6') >= 0) libc = 'glibc'
  let arch
  if (machine === 0x28) arch = 'arm32'
  else if (machine === 0xb7) arch = 'aarch64'
  else arch = 'm' + machine.toString(16)
  return { cls: cls, machine: machine, arch: arch, libc: libc, size: b.length }
}

/*
 * strip 一个 ELF 库到目标路径（源文件不动）。
 * 返回 { src, dst, sizeBefore, sizeAfter, saved, arch, libc }。
 * 失败（找不到 zig / objcopy 报错 / 产物不是 ELF / 架构或 libc 变了）直接抛错。
 */
export function stripElf(src, dst) {
  if (!existsSync(src)) throw new Error('[elf-strip] 源文件不存在: ' + src)
  const zig = findZig()
  if (!zig) {
    throw new Error(
      '[elf-strip] 找不到 zig，无法执行 objcopy strip（组合包必需）\n' +
      '  期望位置: ' + join(WORKSPACE, ZIG_RELATIVE) + '\n' +
      '  也可用环境变量 ZIG_EXE 指定 zig.exe 路径。'
    )
  }
  const before = elfInfo(src)
  if (!before) throw new Error('[elf-strip] 不是 ELF 文件: ' + src)
  mkdirSync(dirname(dst), { recursive: true })
  try {
    /* zig objcopy 需要可写缓存目录；默认位置在沙箱/只读环境下可能 AccessDenied */
    const zigCache = join(WORKSPACE, '_load', 'zigcache')
    try { mkdirSync(zigCache, { recursive: true }) } catch (e) {}
    execFileSync(zig, ['objcopy', '--strip-all', src, dst], {
      stdio: ['ignore', 'pipe', 'pipe'], timeout: 120000,
      env: Object.assign({}, process.env, {
        ZIG_GLOBAL_CACHE_DIR: zigCache,
        ZIG_LOCAL_CACHE_DIR: zigCache,
      }),
    })
  } catch (e) {
    const msg = String((e && e.stderr) || (e && e.stdout) || (e && e.message) || '')
    throw new Error('[elf-strip] objcopy 失败: ' + src + '\n' + msg.trim())
  }
  const after = elfInfo(dst)
  if (!after) throw new Error('[elf-strip] strip 产物不是 ELF: ' + dst)
  if (after.arch !== before.arch) {
    throw new Error('[elf-strip] strip 后架构变化: ' + before.arch + ' -> ' + after.arch + ' (' + src + ')')
  }
  if (after.libc !== before.libc) {
    throw new Error('[elf-strip] strip 后 libc 类型变化: ' + before.libc + ' -> ' + after.libc + ' (' + src + ')')
  }
  return {
    src: src,
    dst: dst,
    sizeBefore: before.size,
    sizeAfter: after.size,
    saved: before.size - after.size,
    arch: after.arch,
    libc: after.libc,
    zig: zig,
  }
}

/* ============================ CLI（手动调试用） ============================ */
function usage() {
  console.log([
    'ELF 库 strip（zig objcopy --strip-all）',
    '',
    '用法:',
    '  node scripts/elf-strip.mjs <源.so> [目标.so]',
    '  省略目标时输出到 <源文件>.stripped.so',
    '',
    '说明: 构建流程中由 scripts/stage-libs.mjs 在组合包暂存时自动调用。',
  ].join('\n'))
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  const argv = process.argv.slice(2)
  try {
    if (!argv.length || argv[0] === '--help' || argv[0] === '-h') { usage(); process.exit(argv.length ? 0 : 1) }
    const src = resolve(argv[0])
    const dst = argv[1] ? resolve(argv[1]) : src.replace(/\.so$/, '') + '.stripped.so'
    const r = stripElf(src, dst)
    console.log('[elf-strip] ' + r.src)
    console.log('  ' + r.sizeBefore + ' B -> ' + r.sizeAfter + ' B（省 ' + r.saved + ' B）' +
      ' arch=' + r.arch + ' libc=' + r.libc)
    console.log('  -> ' + r.dst)
  } catch (e) {
    console.error((e && e.message) || String(e))
    process.exit(1)
  }
}
