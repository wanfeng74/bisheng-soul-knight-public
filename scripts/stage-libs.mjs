#!/usr/bin/env node
/*
 * ui/libs 构建暂存工具（官方 build_target / build_merge 的等价实现）。
 *
 * 官方约定（_ref/docs2/组合包打包规范.md）：
 *   - ui/libs/ 是打包器的暂存目录：打包器会把 ui/libs/ 下所有子目录打进同一个 amr；
 *   - 单包模式（build_target）：把库复制为平铺 ui/libs/libjsapi_bridge.so；
 *   - 组合包模式（build_merge）：清空并重建 ui/libs/，按
 *     ui/libs/<架构>-<代号>/ 放各代号库，且平铺 libjsapi_bridge.so 不得存在。
 *
 * 本项目的库物料源目录（契约 §3，源库不动）：
 *   native/libs/arm64-y02-1/  rk  全部库：panet / Eric / twofinger / updater
 *   native/libs/arm-coco/     cvis 全部库：bridge / updater
 *   native/libs/arm-y09/      rka  全部库：bridge(uClibc) / updater
 *
 * 暂存模式：
 *   1) 单包平铺（--target rk|cvis|rka）
 *   2) 家族组合包（--merge-family rk|cvis|rka）—— 推荐
 *      同一家族的多台设备共用同一份 JS（native-mods 与单包完全一致），
 *      只把库按官方代号目录打包：
 *        rk   -> arm64/ arm64-orange/ arm64-y02-1/      （panet/Eric/twofinger/updater）
 *        cvis -> arm/ arm-coco/ arm-plum/               （bridge strip + updater）
 *        rka  -> arm/ arm-y09/ arm-y09p/                （bridge strip + updater）
 *      bridge 用 `_ref/zig/z/zig.exe objcopy --strip-all` 后的副本（源库不动）。
 *   3) 跨家族实验（--merge-cross）—— 旧 --merge 行为，默认不跑
 *      真机验证结论（D:\PROJECT2\_load\device-verify-20261019.md）：
 *      跨家族组合包（rk+cvis 共用一份 tryRequire 版 JS）在 y02-1 上虽然能装能启动、
 *      PMS 能按代号选中 libs/arm64-y02-1/ 并整目录扁平化，但运行期
 *      tryRequire('panet'/'Eric') 取不到模块（已安装库名带数字后缀），
 *      控制台出现 `[device] 无文件读取能力`，device source 从 hardware:config-file
 *      降为 storage —— 原生能力降级，因此只保留为实验开关，不作正式产物。
 *
 * 用法：
 *   node scripts/stage-libs.mjs --target rk
 *   node scripts/stage-libs.mjs --merge-family cvis
 *   node scripts/stage-libs.mjs --merge-cross --merge-targets rk,cvis
 */
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { MERGE_DEFAULT, MERGE_FALLBACK_DIRS, PROFILES, getProfile, normalizeTarget } from './profiles.mjs'
import { stripElf } from './elf-strip.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
export const PROJECT = resolve(HERE, '..')
export const UI = join(PROJECT, 'ui')
/* 构建暂存目录（生成物，不是源码） */
export const UI_LIBS = join(UI, 'libs')
/* 库物料源目录（契约 §3） */
export const NATIVE_LIBS = join(PROJECT, 'native', 'libs')

/* 可以做"家族组合包"的家族：rk / cvis / rka。
 * 家族组合包 = 同家族多个官方代号目录 + 架构兜底目录，共用同一份 JS。 */
export const MERGE_FAMILIES = ['rk', 'cvis', 'rka']

/* 跨家族实验模式禁止合并的目标：A 系列不在官方 4 代号内，uClibc 未真机验证 */
const MERGE_FORBIDDEN = ['rka']

export function fmtSize(n) {
  if (n >= 1024 * 1024) return (n / 1024 / 1024).toFixed(2) + ' MB'
  if (n >= 1024) return (n / 1024).toFixed(1) + ' KB'
  return n + ' B'
}

/* 某个单包/家族目标的库物料源目录：native/libs/<架构>-<代号>/ */
export function libsSourceDir(target) {
  return join(NATIVE_LIBS, getProfile(target).libsDir)
}

/* 列目录下的 .so 文件（按文件名排序，保证暂存结果稳定） */
export function listSoFiles(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter(function (f) { return /\.so$/.test(f) })
    .sort()
    .map(function (f) {
      const p = join(dir, f)
      return { name: f, size: statSync(p).size, path: p }
    })
}

/* 清空并重建目录（对应官方 build_merge 第 1 步"清空并重建 ui/libs/"） */
export function clearDir(dir) {
  rmSync(dir, { recursive: true, force: true })
  mkdirSync(dir, { recursive: true })
}

/* 校验单包库物料齐全，返回文件清单（缺失即抛错） */
export function requiredLibs(target) {
  const t = normalizeTarget(target)
  const dir = libsSourceDir(t)
  const files = listSoFiles(dir)
  if (!files.length) {
    throw new Error(
      '[stage-libs] 缺少库物料: ' + dir + '（目标 ' + t + '）\n' +
      '  该目录应为 native/libs/<架构>-<代号>/，详见契约 §3。'
    )
  }
  return { target: t, dir: dir, files: files }
}

/* 架构 -> 官方目录前缀：arm64 / arm */
function archPrefixOf(profile) {
  return profile.arch === 'arm64' ? 'arm64' : 'arm'
}

/* ============================ 单包：平铺暂存 ============================ */
/* 把该目标全部库平铺复制到 ui/libs/（官方 build_target 语义）。
 * opts.libsDir 可改用别的暂存目录（单元测试用，避免写仓库）；
 * opts.quiet=true 时不打印逐文件日志（收尾还原用）。 */
export function stageFlat(target, opts) {
  const o = opts || {}
  const libsDir = o.libsDir || UI_LIBS
  const r = requiredLibs(target)
  clearDir(libsDir)
  for (const f of r.files) copyFileSync(f.path, join(libsDir, f.name))
  if (!o.quiet) {
    console.log('[stage-libs] 单包平铺暂存: ' + r.target + '（' + r.files.length + ' 个库）')
    for (const f of r.files) console.log('  ' + r.target + '  ' + f.name + '  ' + fmtSize(f.size))
  }
  return { mode: 'flat', target: r.target, dir: libsDir, sourceDir: r.dir, files: r.files }
}

/* ============================ 组合包：按代号子目录暂存 ============================ */
/*
 * 家族组合包暂存计划（不落盘，便于测试与预检）：
 *   一个家族 -> 架构兜底目录 libs/<arch>/ + 官方代号目录 libs/<arch>-<code>/
 * 返回 { mode:'family', family, profile, targets:[family], dirs:[{ dir, target, files, fallback? }] }
 */
export function familyMergePlan(family) {
  const t = normalizeTarget(family)
  if (MERGE_FAMILIES.indexOf(t) < 0) {
    throw new Error(
      '[stage-libs] 家族组合包只支持 ' + MERGE_FAMILIES.join(' / ') + '，收到: ' + String(family) + '\n' +
      '  家族组合包 = 同家族多代号共用一份 JS；跨家族实验请用 --merge-cross。'
    )
  }
  const p = PROFILES[t]
  const r = requiredLibs(t)
  const archPrefix = archPrefixOf(p)
  const dirs = []
  /* 兜底目录：官方 arch.md"找不到 <架构>-<代号> 才用 libs/<架构>" */
  if (MERGE_FALLBACK_DIRS) {
    dirs.push({ dir: archPrefix, target: t, files: r.files, sourceDir: r.dir, fallback: true })
  }
  /* 官方代号目录（按代号字典序，保证输出顺序稳定） */
  for (const code of p.codes.slice().sort()) {
    dirs.push({ dir: archPrefix + '-' + code, target: t, files: r.files, sourceDir: r.dir, fallback: false, code: code })
  }
  return { mode: 'family', family: t, profile: p, targets: [t], dirs: dirs }
}

/*
 * 跨家族实验暂存计划（旧 --merge 行为，只给 --merge-cross 用）：
 *   每个家族 -> 兜底目录 + 官方代号目录，全部进同一个 ui/libs/
 * 返回 { mode:'cross', targets, dirs }
 */
export function mergePlan(mergeTargets) {
  const raw = Array.isArray(mergeTargets) && mergeTargets.length ? mergeTargets : MERGE_DEFAULT
  const targets = []
  for (const t0 of raw) {
    const t = normalizeTarget(t0)
    if (MERGE_FORBIDDEN.indexOf(t) >= 0) {
      throw new Error(
        '[stage-libs] 跨家族实验组合包不允许合并 ' + t + '（A 系列不在官方 4 代号内，uClibc 未真机验证）\n' +
        '  跨家族实验默认只合并: ' + MERGE_DEFAULT.join(' + ') + '；rka 请用 --merge-family rka 单独出家族包。'
      )
    }
    getProfile(t) /* 未知目标在这里抛错 */
    if (targets.indexOf(t) < 0) targets.push(t)
  }
  if (!targets.length) throw new Error('[stage-libs] --merge-targets 为空')

  const dirs = []
  for (const t of targets) {
    const p = PROFILES[t]
    const r = requiredLibs(t)
    const archPrefix = archPrefixOf(p)
    if (MERGE_FALLBACK_DIRS) {
      dirs.push({ dir: archPrefix, target: t, files: r.files, sourceDir: r.dir, fallback: true })
    }
    for (const code of p.codes.slice().sort()) {
      dirs.push({ dir: archPrefix + '-' + code, target: t, files: r.files, sourceDir: r.dir, fallback: false, code: code })
    }
  }
  return { mode: 'cross', targets: targets, dirs: dirs }
}

/* 执行暂存计划：清空暂存目录，按计划建子目录复制库；bridge 用 strip 后的副本 */
function stagePlan(plan, opts) {
  const o = opts || {}
  const quiet = !!o.quiet
  const libsDir = o.libsDir || UI_LIBS
  const label = libsDir === UI_LIBS ? 'ui/libs' : libsDir
  if (!MERGE_FALLBACK_DIRS) {
    console.warn('[stage-libs] 注意: MERGE_FALLBACK_DIRS=false，未生成架构兜底目录')
  }
  clearDir(libsDir)

  /* bridge 需要 strip：每个含 bridge 的家族只 strip 一次，再分发给各代号目录 */
  const stripped = []
  const tempDirs = []
  const bridgeReplacement = {}
  try {
    for (const t of plan.targets) {
      const bridgeFile = plan.dirs.filter(function (d) { return d.target === t })
        .map(function (d) { return d.files })
        .reduce(function (a, b) { return a.concat(b) }, [])
        .filter(function (f) { return f.name === 'libjsapi_bridge.so' })[0]
      if (!bridgeFile) continue
      const stripTmpBase = join(PROJECT, '..', '_load', 'tmp')
      mkdirSync(stripTmpBase, { recursive: true })
      const tmp = mkdtempSync(join(stripTmpBase, 'dm-strip-'))
      tempDirs.push(tmp)
      const dst = join(tmp, 'libjsapi_bridge.so')
      const r = stripElf(bridgeFile.path, dst)
      bridgeReplacement[t] = dst
      stripped.push({
        target: t, name: basename(bridgeFile.path),
        sizeBefore: r.sizeBefore, sizeAfter: r.sizeAfter, saved: r.saved,
        arch: r.arch, libc: r.libc,
      })
    }
  } catch (e) {
    for (const d of tempDirs) { try { rmSync(d, { recursive: true, force: true }) } catch (x) {} }
    throw e
  }

  const out = []
  try {
    for (const d of plan.dirs) {
      const targetDir = join(libsDir, d.dir)
      mkdirSync(targetDir, { recursive: true })
      const copied = []
      for (const f of d.files) {
        const src = (f.name === 'libjsapi_bridge.so' && bridgeReplacement[d.target]) || f.path
        const dstName = join(targetDir, f.name)
        copyFileSync(src, dstName)
        copied.push({ name: f.name, size: statSync(dstName).size })
      }
      out.push({ dir: d.dir, target: d.target, files: copied })
      if (!quiet) console.log('  ' + label + '/' + (d.dir + '/').padEnd(18) + copied.length + ' 个库')
    }
  } finally {
    for (const d of tempDirs) { try { rmSync(d, { recursive: true, force: true }) } catch (x) {} }
  }

  if (!quiet) {
    if (plan.mode === 'family') {
      console.log('[stage-libs] ' + plan.family + ' 家族组合包暂存: 官方代号 ' +
        PROFILES[plan.family].codes.join('、') + '（' + plan.dirs.length + ' 个目录，JS 同单包）')
    } else {
      console.log('[stage-libs] 跨家族组合包暂存（实验，rk 原生能力会降级）: ' +
        plan.targets.join(' + ') + '（' + plan.dirs.length + ' 个目录）')
    }
    for (const s of stripped) {
      console.log('[stage-libs] bridge strip: ' + s.name + ' ' + fmtSize(s.sizeBefore) + ' -> ' +
        fmtSize(s.sizeAfter) + '（zig objcopy --strip-all, arch=' + s.arch + ' libc=' + s.libc + '）')
    }
  }
  return {
    mode: plan.mode, family: plan.family, targets: plan.targets,
    dirs: out, stripped: stripped, dir: libsDir,
  }
}

/* 家族组合包暂存（推荐）：同一家族多代号共用一份 JS */
export function stageMergeFamily(family, opts) {
  return stagePlan(familyMergePlan(family), opts)
}

/* 跨家族实验暂存（旧行为，只给 --merge-cross 用） */
export function stageMerge(mergeTargets, opts) {
  return stagePlan(mergePlan(mergeTargets), opts)
}

/* ============================ 组合包暂存校验 ============================ */
/* 校验（家族/跨家族通用）：
 *   1) 暂存根目录不得有任何 .so；
 *   2) 目录名必须符合官方命名：<架构> 兜底 或 <架构>-<官方代号>；
 *   3) 子目录集合/文件清单与计划完全一致（多/少都算失败）。
 * 传入 stageMergeFamily / stageMerge 的返回值；不合规直接抛错。
 * 返回 { ok, rootSo, dirs, totalSize, totalFiles, family? }。 */
export function verifyMergeStaged(result) {
  const r = result
  if (!r || ['family', 'cross', 'merge'].indexOf(r.mode) < 0 || !r.dirs) {
    throw new Error('[stage-libs] verifyMergeStaged 需要 stageMergeFamily / stageMerge 的结果')
  }
  const libsDir = r.dir || UI_LIBS
  const label = libsDir === UI_LIBS ? 'ui/libs/' : libsDir
  const rootEntries = readdirSync(libsDir, { withFileTypes: true })
  const rootSo = []
  const strayFiles = []
  const rootDirs = []
  for (const e of rootEntries) {
    if (e.isDirectory()) { rootDirs.push(e.name); continue }
    if (/\.so$/.test(e.name)) rootSo.push(e.name)
    else strayFiles.push(e.name)
  }
  if (rootSo.length) {
    throw new Error(
      '[stage-libs] 组合包暂存校验失败: ' + label + ' 根目录出现平铺 .so（官方禁止）\n' +
      '  ' + rootSo.join(', ') + '\n' +
      '  组合包模式下库只能放在 <架构>-<代号>/ 子目录内。'
    )
  }
  if (strayFiles.length && libsDir === UI_LIBS) {
    console.warn('[stage-libs] [警告] ui/libs/ 根目录有非 .so 文件（会被打进包）: ' + strayFiles.join(', '))
  }

  /* 目录命名必须符合官方约定：<arch>（兜底）或 <arch>-<代号>（代号必须在官方代号集内） */
  for (const d of r.dirs) {
    const p = PROFILES[d.target]
    if (!p) throw new Error('[stage-libs] 组合包暂存校验失败: 未知来源家族 ' + d.target + '（目录 ' + d.dir + '）')
    const archPrefix = archPrefixOf(p)
    const m = /^(arm64|arm)(?:-([a-z0-9][a-z0-9-]*))?$/.exec(d.dir)
    if (!m) {
      throw new Error('[stage-libs] 组合包暂存校验失败: 非官方目录命名 "' + d.dir + '"\n' +
        '  合法形式: ' + archPrefix + '（架构兜底）或 ' + archPrefix + '-<代号>（如 ' +
        p.codes.slice().sort().map(function (c) { return archPrefix + '-' + c }).join('、') + '）')
    }
    if (!m[2]) {
      if (d.dir !== archPrefix) {
        throw new Error('[stage-libs] 组合包暂存校验失败: ' + d.target + ' 的架构兜底目录应为 "' +
          archPrefix + '"，实际 "' + d.dir + '"')
      }
    } else if (p.codes.indexOf(m[2]) < 0) {
      throw new Error('[stage-libs] 组合包暂存校验失败: 代号 "' + m[2] + '" 不在 ' + d.target +
        ' 的官方代号集 [' + p.codes.join(', ') + '] 内（目录 ' + d.dir + '）')
    }
  }

  /* 目录集合与计划完全一致 */
  const expected = r.dirs.map(function (d) { return d.dir })
  for (const d of expected) {
    if (rootDirs.indexOf(d) < 0) {
      throw new Error('[stage-libs] 组合包暂存校验失败: 缺少期望目录 ' + label + d + '/')
    }
  }
  for (const d of rootDirs) {
    if (expected.indexOf(d) < 0) {
      throw new Error('[stage-libs] 组合包暂存校验失败: 出现未在计划内的目录 ' + label + d + '/')
    }
  }
  /* 每个目录内文件与计划一致（多/少都算失败，避免脏暂存混进包） */
  for (const d of r.dirs) {
    const got = readdirSync(join(libsDir, d.dir)).sort()
    const want = d.files.map(function (f) { return f.name }).sort()
    if (got.join(',') !== want.join(',')) {
      throw new Error('[stage-libs] 组合包暂存校验失败: ' + label + d.dir +
        '/ 内文件不符\n  期望: ' + want.join(', ') + '\n  实际: ' + got.join(', '))
    }
  }
  let totalSize = 0
  let totalFiles = 0
  for (const d of r.dirs) {
    for (const f of d.files) { totalSize += f.size; totalFiles++ }
  }
  if (libsDir === UI_LIBS) {
    console.log('[stage-libs] 组合包暂存校验通过: 根目录无平铺 .so，' + rootDirs.length +
      ' 个子目录（' + rootDirs.join('、') + '），' + totalFiles + ' 个库文件，原始体积 ' + fmtSize(totalSize))
  }
  return {
    ok: true, mode: r.mode, family: r.family, rootSo: rootSo,
    dirs: rootDirs, totalSize: totalSize, totalFiles: totalFiles,
  }
}

/* 暂存结果 -> 便于日志打印的目录树文本 */
export function libsTree(result) {
  if (!result) return ''
  const rootLabel = (result.dir === UI_LIBS || !result.dir) ? 'ui/libs/' : result.dir
  const lines = []
  if (result.mode === 'flat') {
    lines.push(rootLabel)
    for (const f of result.files) lines.push('  ' + f.name + '  ' + fmtSize(f.size))
  } else {
    lines.push(rootLabel)
    for (const d of result.dirs) {
      lines.push('  ' + d.dir + '/')
      for (const f of d.files) lines.push('    ' + f.name + '  ' + fmtSize(f.size))
    }
  }
  return lines.join('\n')
}

/* 恢复"单包 rk 平铺"默认暂存（构建结束 finally 用） */
export function restoreRkFlat(opts) {
  return stageFlat('rk', opts)
}

/* ============================ CLI ============================ */
function usage() {
  console.log([
    'ui/libs 构建暂存（官方 build_target / build_merge 等价实现）',
    '',
    '用法:',
    '  node scripts/stage-libs.mjs --target <rk|cvis|rka>      单包平铺暂存',
    '  node scripts/stage-libs.mjs --merge-family <家族>      家族组合包暂存（推荐）',
    '     家族 = rk / cvis / rka：生成 <架构>/ 兜底目录 + 全部官方代号目录，',
    '     同家族多设备共用一份 JS；bridge 用 zig objcopy --strip-all 后的副本。',
    '  node scripts/stage-libs.mjs --merge <家族>             同 --merge-family（简短别名）',
    '  node scripts/stage-libs.mjs --merge-cross [--merge-targets rk,cvis]',
    '     跨家族实验暂存（旧行为，默认不跑）。真机验证 rk 原生能力会降级',
    '     （tryRequire 取不到 panet/Eric，[device] 无文件读取能力），仅供实验。',
    '',
    '选项:',
    '  --target <target>          单包目标（平铺到 ui/libs/）',
    '  --merge-family <家族>      家族组合包模式（rk / cvis / rka）',
    '  --merge <家族>             --merge-family 的简短别名',
    '  --merge-cross              跨家族实验模式（默认合并 rk+cvis；不允许 rka）',
    '  --merge-targets <a,b>      配合 --merge-cross 指定合并家族',
    '  --help, -h                 显示本帮助',
  ].join('\n'))
}

function splitList(v) {
  return String(v || '').split(',').map(function (s) { return s.trim() }).filter(Boolean)
}

function parseCli(argv) {
  const opts = { target: null, family: null, cross: false, mergeTargets: null, help: false }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    const val = function (name) {
      const next = argv[++i]
      if (next == null || next.indexOf('--') === 0) throw new Error('参数 ' + name + ' 缺少取值')
      return next
    }
    if (a === '--help' || a === '-h') opts.help = true
    else if (a === '--merge-cross') opts.cross = true
    else if (a === '--merge-family') opts.family = val(a)
    else if (a.indexOf('--merge-family=') === 0) opts.family = a.slice('--merge-family='.length)
    else if (a === '--merge') opts.family = val(a)
    else if (a.indexOf('--merge=') === 0) opts.family = a.slice('--merge='.length)
    else if (a === '--target' || a === '-t') opts.target = val(a)
    else if (a.indexOf('--target=') === 0) opts.target = a.slice('--target='.length)
    else if (a === '--merge-targets') opts.mergeTargets = splitList(val(a))
    else if (a.indexOf('--merge-targets=') === 0) opts.mergeTargets = splitList(a.slice('--merge-targets='.length))
    else throw new Error('未知参数: ' + a)
  }
  return opts
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  try {
    const opts = parseCli(process.argv.slice(2))
    if (opts.help) { usage(); process.exit(0) }
    const chosen = [opts.target ? 'target' : null, opts.family ? 'family' : null, opts.cross ? 'cross' : null]
      .filter(Boolean)
    if (chosen.length !== 1) throw new Error('需要且只能指定一种模式：--target / --merge-family / --merge-cross')
    if (opts.target) {
      const r = stageFlat(opts.target)
      console.log('\n' + libsTree(r))
    } else if (opts.family) {
      const r = stageMergeFamily(opts.family)
      verifyMergeStaged(r)
      console.log('\n' + libsTree(r))
    } else {
      console.warn('[stage-libs] [警告] 跨家族组合包为实验模式：真机验证 rk 原生能力会降级，勿作正式产物')
      const r = stageMerge(opts.mergeTargets)
      verifyMergeStaged(r)
      console.log('\n' + libsTree(r))
    }
  } catch (e) {
    console.error((e && e.message) || String(e))
    process.exit(1)
  }
}
