#!/usr/bin/env node
/**
 * 多平台整盒打包脚本（官方规范对齐版，契约 §7 + 2026-10-19 真机修正）。
 *
 * 官方约定（_ref/docs2/组合包打包规范.md）：
 *   - 单包模式（build_target）：把库复制为平铺 ui/libs/*.so 后打包；
 *   - 组合包模式（build_merge）：清空并重建 ui/libs/，把各设备代号的库按
 *     ui/libs/<架构>-<代号>/ 打进同一个 amr，且根目录不得有平铺 .so；
 *   - 版本信息由 tools/generate_ui_version.js 生成 ui/src/res/version.js；
 *   - --release 自动递增 patch（npm version patch 等价）。
 *
 * 本项目落地（契约 §1/§7/§8）：
 *   - 库物料源：native/libs/{arm64-y02-1,arm-coco,arm-y09}（不再写 ui/libs-*）；
 *   - 生成器：scripts/gen-ui-version.mjs（版本）、scripts/native-mods-content.mjs（原生模块 import）；
 *   - 暂存器：scripts/stage-libs.mjs（单包平铺 / 家族组合包按代号子目录 + bridge strip）；
 *   - 构建结束 finally 恢复 rk 单包默认（res/version.js、native-mods.js、ui/libs 平铺）。
 *
 * 组合包语义（2026-10-19 真机验证后修正）：
 *   --merge 默认 = **按家族出包**（默认家族 cvis + rka，用户重点），每个家族一个 .amr：
 *     同家族多设备共用同一份 JS（native-mods 与该家族单包完全一致），
 *     只把库按官方代号目录打包：
 *       cvis -> arm/ arm-coco/ arm-plum/            （bridge strip + updater）
 *       rka  -> arm/ arm-y09/ arm-y09p/             （bridge strip + updater）
 *       rk   -> arm64/ arm64-orange/ arm64-y02-1/   （panet/Eric/twofinger/updater，可选）
 *     产物：dist/miniapp-merged-<家族>-<版本>.amr
 *   为什么不再默认跨家族合并（rk+cvis 共用一份 JS）：
 *     真机（y02-1）验证结论见 D:\PROJECT2\_load\device-verify-20261019.md ——
 *     跨家族包虽然能装能启动、PMS 确实按代号选中 libs/arm64-y02-1/ 并整目录扁平化，
 *     但运行期 tryRequire('panet'/'Eric') 取不到模块（已安装库名带数字后缀），
 *     控制台出现 `[device] 无文件读取能力`、device source 从 hardware:config-file
 *     降为 storage —— rk 原生能力降级，不可作为正式产物。
 *     => 跨家族模式只保留为显式实验开关 --merge-cross（默认不跑）。
 *
 * 平台矩阵：
 *   rk   = RK 家族  （官方代号 y02-1/orange）aarch64 + glibc，panet/Eric/twofinger/updater
 *   cvis = CVI 家族 （官方代号 coco/plum）   armv7   + glibc，bridge/updater
 *   rka  = A 系列   （代号 y09/y09p）        armv7   + uClibc，bridge/updater
 *
 * 用法：
 *   node scripts/build-amr.mjs                               # 默认打 rk/cvis/rka 三个单包
 *   node scripts/build-amr.mjs --targets rk                  # 只打 rk 单包（最快自测）
 *   node scripts/build-amr.mjs --targets rk,cvis --verify    # 验证构建（VERIFY_BUILD=true）
 *   node scripts/build-amr.mjs --release --targets rk        # 先递增 patch 再打包
 *   node scripts/build-amr.mjs --merge                       # 家族组合包（默认 cvis + rka）
 *   node scripts/build-amr.mjs --merge --merge-targets cvis  # 只出 cvis 家族组合包
 *   node scripts/build-amr.mjs --merge --merge-targets rk    # 可选：rk 家族组合包
 *   node scripts/build-amr.mjs --merge-cross                 # 跨家族实验（rk 原生能力会降级）
 *   node scripts/build-amr.mjs --stage rk                    # 只暂存单包库（不打包）
 *   node scripts/build-amr.mjs --stage --merge               # 只暂存家族组合包目录（不打包）
 *
 * 产物：
 *   rk/<appid>.<版本>-rk.amr / cvis/... / rka/...           单包
 *   dist/miniapp-merged-cvis-<版本>.amr                     家族组合包（默认产物，<10MB）
 *   dist/miniapp-merged-rka-<版本>.amr
 *   dist/miniapp-merged-rk-<版本>.amr                       （--merge-targets 含 rk 时）
 *   dist/miniapp-merged-cross-<版本>.amr                    跨家族实验包（勿发布）
 *
 * 环境变量兼容（契约 §7）：
 *   TARGETS=rk,cvis          等价 --targets
 *   MERGE=1 / MERGE_TARGETS  等价 --merge / --merge-targets（家族组合包）
 *   MERGE_CROSS=1            等价 --merge-cross（跨家族实验）
 *   VERIFY_BUILD=1           等价 --verify
 *   SKIP_SO_CHECK=1          等价 --skip-so-check
 *   PNPM_CMD                 自定义打包命令（默认 pnpm -C ui package）
 */
import { execFileSync, execSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, statSync, unlinkSync, writeFileSync } from 'node:fs'
import { basename, delimiter, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  MERGE_DEFAULT, MERGED_TARGET, TARGETS, getProfile, normalizeTarget,
} from './profiles.mjs'
import { nativeModsFor } from './native-mods-content.mjs'
import { generateUiVersion, readPkg, parseVersion } from './gen-ui-version.mjs'
import { findZig } from './elf-strip.mjs'
import {
  libsSourceDir, stageFlat, stageMerge, stageMergeFamily, verifyMergeStaged, libsTree, fmtSize,
} from './stage-libs.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
/* 项目根 = delta-mojin-simulator/ */
const PROJECT = resolve(HERE, '..')
const UI = join(PROJECT, 'ui')
const PKG_JSON = join(UI, 'package.json')
const NATIVE_MODS_FILE = join(UI, 'src', 'services', 'native-mods.js')
const DIST = join(PROJECT, 'dist')
/* 平台包大小上限（官方：单包/组合包均 < 10MB） */
const MAX_AMR_BYTES = 10 * 1024 * 1024
/* 当前进程 node 所在目录：pnpm / aiot-cli 的子进程 shim 需要 PATH 里有 node */
const NODE_BIN_DIR = dirname(process.execPath)
/* 家族组合包默认出包家族：cvis + rka（用户重点；rk 可按需 --merge-targets rk 追加）。
 * 真机验证：跨家族包在 rk 上原生能力会降级（见 header 注释），故默认按家族出包、不混合家族。 */
const MERGE_FAMILY_DEFAULT = ['cvis', 'rka']

/* =====================================================================
 * 一、so 平台预检（保留旧规则，源路径改到 native/libs/...；新增组合包校验）
 *
 * 背景：固件/商店按包内 .so 的 libc 类型识别机型系列（实测：cvis 包曾
 * 误用 uClibc/rka 编译的 bridge.so，提交后被识别为 A 系列）。
 * 规则：
 *   rk   = glibc aarch64（panet 必需；Eric/twofinger/updater 存在则校验）
 *   cvis = glibc arm32  （bridge 必需；updater 存在则校验）
 *   rka  = uclibc arm32 （bridge 必需；updater 存在则校验）
 * 任一必需库类型不匹配即拒绝整包打包；确知库正确时可 --skip-so-check /
 * SKIP_SO_CHECK=1 绕过。
 * ===================================================================== */

/* 纯 JS 读 ELF 头：不依赖 readelf/file，Windows 开发机上也能跑 */
function elfInfo(path) {
  try {
    const b = readFileSync(path)
    if (b.length < 64 || b[0] !== 0x7f || b[1] !== 0x45 || b[2] !== 0x4c || b[3] !== 0x46) return null
    const endian = b[5]
    const machine = endian === 1 ? b.readUInt16LE(18) : b.readUInt16BE(18)
    const s = b.toString('latin1')
    let libc = 'unknown'
    if (s.indexOf('ld-uClibc') >= 0 || s.indexOf('libc.so.0') >= 0) libc = 'uclibc'
    else if (s.indexOf('ld-linux') >= 0 || s.indexOf('libc.so.6') >= 0) libc = 'glibc'
    const arch = machine === 0x28 ? 'arm32' : (machine === 0xb7 ? 'aarch64' : ('m' + machine.toString(16)))
    return { libc: libc, arch: arch, size: b.length }
  } catch (e) { return null }
}

/* readelf 是否可用（Windows 上没有；Linux/WSL 才有）。
 * 缓存结果，避免每个库都跑一次失败的命令。 */
let READELF_OK = null
function hasReadelf() {
  if (READELF_OK != null) return READELF_OK
  try {
    execSync('readelf --version', { stdio: ['ignore', 'ignore', 'ignore'] })
    READELF_OK = true
  } catch (e) {
    READELF_OK = false
  }
  return READELF_OK
}

/* libc 判断：优先 readelf -d（Linux/WSL），Windows 上回落纯 JS 解析 */
function soLibc(path) {
  if (!existsSync(path)) return 'missing'
  if (!hasReadelf()) {
    const info = elfInfo(path)
    return info ? info.libc : 'readelf-error'
  }
  try {
    const out = execSync('readelf -d "' + path + '" | grep -oE "Shared library: \\[[^]]+\\]"',
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
    const tags = (out.match(/\[[^\]]+\]/g) || []).map(function (s) { return s.slice(1, -1) })
    if (tags.some(function (t) { return t.indexOf('ld-uClibc') >= 0 || t === 'libc.so.0' })) return 'uclibc'
    if (tags.some(function (t) { return t.indexOf('ld-linux') >= 0 || t === 'libc.so.6' })) return 'glibc'
    return 'unknown'
  } catch (e) {
    const info = elfInfo(path)
    return info ? info.libc : 'readelf-error'
  }
}

/* CPU 架构：rk 必须是 aarch64，cvi/A 系列必须是 arm32。
   只查 libc 不够 —— rk 与 cvis 都是 glibc，必须再看 64/32 位。 */
function soArch(path) {
  if (!existsSync(path)) return 'missing'
  const info = elfInfo(path)
  return info ? info.arch : 'unknown'
}

function fileOf(target, name) {
  return join(libsSourceDir(target), name)
}

/* 校验一个库；required=true 时缺失直接抛错，否则只告警。返回是否通过 */
function checkLib(target, name, expectLibc, label, expectArch, required) {
  const p = fileOf(target, name)
  if (!existsSync(p)) {
    if (required) {
      throw new Error(
        '[so平台预检失败] 缺少必需库: ' + p + '\n' +
        '  目标 ' + target + ' 的库物料目录: ' + libsSourceDir(target) + '\n' +
        '  请先执行 node native/build.mjs（编译 updater）或补齐库物料（契约 §3）。'
      )
    }
    console.warn('[so平台预检] [警告] 缺少 ' + p + '（' + label + '）—— 该能力将降级')
    return false
  }
  const gotLibc = soLibc(p)
  const gotArch = soArch(p)
  if (expectArch && gotArch !== expectArch) {
    throw new Error(
      '[so平台预检失败] ' + label + ': ' + p + '\n' +
      '  当前 CPU 架构 = ' + gotArch + ', 期望 = ' + expectArch + '\n' +
      '  rk 是 aarch64，cvi/A 系列是 arm32 —— 架构错了固件会拒绝加载。\n' +
      '  请替换为正确编译目标后再打包；若确知库正确，可加 --skip-so-check 强制跳过。'
    )
  }
  if (expectLibc && gotLibc !== expectLibc) {
    throw new Error(
      '[so平台预检失败] ' + label + ': ' + p + '\n' +
      '  当前 libc 类型 = ' + gotLibc + ', 期望 = ' + expectLibc + '\n' +
      '  固件按 .so 的 libc 识别机型系列，混用会导致包被识别成错误系列\n' +
      '  (v2.2.6 cvis 曾误用 uClibc/rka 库被识别为 A 系列)。\n' +
      '  请替换为正确编译目标后再打包；若确知库正确，可加 --skip-so-check 强制跳过。'
    )
  }
  console.log('  [预检通过] ' + label + ': ' + name + ' -> ' + gotLibc + ' / ' + gotArch)
  return true
}

/* 单个目标的 so 预检 */
function precheckTarget(t) {
  const p = getProfile(t)
  const dir = libsSourceDir(t)
  if (!existsSync(dir)) {
    throw new Error(
      '[so平台预检失败] 库物料目录不存在: ' + dir + '\n' +
      '  native/libs/ 下的目录布局见 native/libs/README.md 与契约 §3。'
    )
  }
  console.log('\n[so 平台预检] ' + t + '（' + p.family + ' 家族 / 代号 ' + p.code + ' / ' + p.arch + ' + ' + p.clib + '）')
  console.log('  库物料目录: ' + dir)
  if (t === 'rk') {
    checkLib(t, 'libjsapi_panet.so', 'glibc', 'rk panet（必需）', 'aarch64', true)
    checkLib(t, 'libjsapi_Eric.so', 'glibc', 'rk Eric（仅 aarch64 可用）', 'aarch64', false)
    checkLib(t, 'libjsapi_twofinger.so', null, 'rk twofinger（evdev 双指）', 'aarch64', false)
    checkLib(t, 'libjsapi_updater.so', 'glibc', 'rk updater（自动更新）', 'aarch64', false)
  } else if (t === 'cvis') {
    checkLib(t, 'libjsapi_bridge.so', 'glibc', 'cvis bridge（S/X5 系列需 glibc arm32）', 'arm32', true)
    checkLib(t, 'libjsapi_updater.so', 'glibc', 'cvis updater（arm32 glibc）', 'arm32', false)
  } else if (t === 'rka') {
    checkLib(t, 'libjsapi_bridge.so', 'uclibc', 'rka bridge（A 系列需 uClibc arm32）', 'arm32', true)
    checkLib(t, 'libjsapi_updater.so', 'uclibc', 'rka updater（arm32 uClibc）', 'arm32', false)
  }
}

/* so 预检入口。
 * req = { mode:'single'|'family'|'cross', targets:[...], strip:bool }
 *   - single：只查单包目标；
 *   - family：查每个家族，并列出该家族要生成的官方代号目录；
 *   - cross ：查合并家族，并提示 rk 原生能力降级（实验模式）。 */
function precheckSo(req) {
  console.log('\n=== so 平台预检 ===')
  const targets = req.targets || []
  for (const t of targets) precheckTarget(normalizeTarget(t))
  if (req.strip) {
    /* 组合包（家族/跨家族）需要 zig 做 bridge strip；提前检查，避免打到一半才失败 */
    const zig = findZig()
    if (!zig) {
      throw new Error(
        '[so平台预检失败] 组合包需要 zig 执行 objcopy --strip-all，但找不到 zig.exe\n' +
        '  期望位置: _ref/zig/z/zig.exe（或环境变量 ZIG_EXE 指定）'
      )
    }
    console.log('\n[组合包预检] zig: ' + zig)
  }
  if (req.mode === 'family') {
    for (const t of targets) {
      const p = getProfile(normalizeTarget(t))
      const pre = p.arch === 'arm64' ? 'arm64' : 'arm'
      const dirs = [pre].concat(p.codes.slice().sort().map(function (c) { return pre + '-' + c }))
      console.log('[家族组合包预检] ' + p.key + ': ' + dirs.join('/') +
        '/（JS 与 ' + p.key + ' 单包完全一致）')
    }
  } else if (req.mode === 'cross') {
    const hasRk = targets.indexOf('rk') >= 0
    const hasCvis = targets.indexOf('cvis') >= 0
    if (hasRk && hasCvis) {
      console.log('[跨家族预检] 含 rk+cvis（官方 4 代号全覆盖）—— 但真机验证 rk 原生能力会降级，仅供实验')
    } else {
      console.warn('[跨家族预检] [警告] 只合并了 ' + targets.join('+') + '，官方代号未全覆盖')
    }
  }
  console.log('=== so 平台预检全部通过 ===\n')
}

/* =====================================================================
 * 二、打包命令（pnpm -C ui package）
 * 本机 node 不在 PATH：给子进程补上 node 目录，并自动定位 pnpm。
 * ===================================================================== */
function pkgEnv() {
  const env = Object.assign({}, process.env)
  env.PATH = NODE_BIN_DIR + delimiter + (process.env.PATH || '')
  return env
}

function runPackage() {
  if (process.env.PNPM_CMD) {
    console.log('$ ' + process.env.PNPM_CMD + '  (PNPM_CMD)')
    execSync(process.env.PNPM_CMD, { stdio: 'inherit', cwd: PROJECT, env: pkgEnv(), timeout: 600000 })
    return
  }
  try {
    execSync('pnpm --version', { stdio: 'ignore', env: pkgEnv() })
    console.log('$ pnpm -C ui package')
    execSync('pnpm -C ui package', { stdio: 'inherit', cwd: PROJECT, env: pkgEnv(), timeout: 600000 })
    return
  } catch (e) {
    /* pnpm 不在 PATH：找 node 安装目录旁的 pnpm.mjs（DSH 运行时就是这样分发） */
  }
  const pnpmJs = resolve(NODE_BIN_DIR, '..', '..', 'pnpm', 'bin', 'pnpm.mjs')
  if (existsSync(pnpmJs)) {
    console.log('$ node <pnpm.mjs> -C ui package')
    execFileSync(process.execPath, [pnpmJs, '-C', 'ui', 'package'], {
      stdio: 'inherit', cwd: PROJECT, env: pkgEnv(), timeout: 600000,
    })
    return
  }
  /* 最后兜底：直接调本地 aiot-cli（等价 pnpm -C ui package，非首选） */
  const aiot = join(UI, 'node_modules', '.bin', 'aiot-cli.cmd')
  if (existsSync(aiot)) {
    console.warn('[打包] [警告] 找不到 pnpm，回落直接调用 aiot-cli（等价于 pnpm -C ui package）')
    console.log('$ "' + aiot + '" -c -q -p')
    execSync('"' + aiot + '" -c -q -p', { stdio: 'inherit', cwd: UI, env: pkgEnv(), timeout: 600000 })
    return
  }
  throw new Error('[打包] 找不到 pnpm / aiot-cli，无法执行 pnpm -C ui package\n' +
    '  可设置环境变量 PNPM_CMD 指定打包命令。')
}

/* =====================================================================
 * 三、生成物写入 / 清理 / 收尾还原
 * ===================================================================== */
function genVersion(target, verify) {
  generateUiVersion({ target: target, verify: verify })
}

const NATIVE_DESC = {
  rk: 'panet + Eric + updater（静态 import，aarch64）',
  cvis: 'updater only（arm32 glibc，无 Eric）',
  rka: 'updater only（arm32 uClibc，无 Eric）',
  merged: 'updater + 运行期 tryRequire(panet/Eric)（组合包懒加载）',
  unknown: '无（兜底降级）',
}

function writeNativeMods(target) {
  const t = normalizeTarget(target)
  writeFileSync(NATIVE_MODS_FILE, nativeModsFor(t))
  console.log('[native-mods] ' + t + ': ' + (NATIVE_DESC[t] || NATIVE_DESC.unknown))
}

function cleanAmr() {
  for (const f of readdirSync(UI).filter(function (f) { return f.endsWith('.amr') })) {
    try { unlinkSync(join(UI, f)) } catch (e) {}
  }
}

function expectedAmrName(appid, version) {
  /* aiot-cli 产物名：<appid>.<版本点换下划线>.amr，如 8001865309000007.1_1_52.amr */
  return appid + '.' + String(version).replace(/\./g, '_') + '.amr'
}

function findAmr(expectedName) {
  const files = readdirSync(UI).filter(function (f) { return f.endsWith('.amr') })
  if (expectedName && files.indexOf(expectedName) >= 0) return join(UI, expectedName)
  if (!files.length) throw new Error('[打包] 未找到打包产物 .amr（pnpm -C ui package 可能失败）')
  if (expectedName) console.warn('[打包] [警告] 未找到期望产物 ' + expectedName + '，改用 ' + files[0])
  return join(UI, files[0])
}

function moveAmrTo(amr, out) {
  mkdirSync(dirname(out), { recursive: true })
  if (existsSync(out)) {
    try { unlinkSync(out) } catch (e) {
      throw new Error('[打包] 无法覆盖旧产物: ' + out + '（可能被占用）')
    }
  }
  renameSync(amr, out)
  return out
}

/* 收尾还原：res/version.js + native-mods.js = rk 默认，ui/libs = rk 平铺。
 * 无论成功失败都必须执行（契约 §7：finally 恢复 rk 默认）。 */
function restoreDefaults() {
  try {
    generateUiVersion({ target: 'rk', verify: false, quiet: true })
  } catch (e) {
    console.warn('[还原] [警告] res/version.js 还原失败: ' + ((e && e.message) || e))
  }
  try {
    writeFileSync(NATIVE_MODS_FILE, nativeModsFor('rk'))
  } catch (e) {
    console.warn('[还原] [警告] native-mods.js 还原失败: ' + ((e && e.message) || e))
  }
  try {
    stageFlat('rk', { quiet: true })
  } catch (e) {
    console.warn('[还原] [警告] ui/libs 还原失败: ' + ((e && e.message) || e))
  }
  console.log('[还原] res/version.js / native-mods.js -> rk 默认，ui/libs -> rk 单包平铺')
}

/* =====================================================================
 * 四、单包 / 组合包构建
 * ===================================================================== */
function buildSingle(target, version, appid, verify) {
  const t = normalizeTarget(target)
  const p = getProfile(t)
  console.log('\n=== 打包 ' + t + ' 单包 ===')
  console.log('  平台: ' + p.family + ' 家族 / 官方代号 ' + p.code + '（' +
    p.codes.join('/') + '）/ ' + p.arch + ' + ' + p.clib)
  console.log('  库目录: native/libs/' + p.libsDir)

  genVersion(t, verify)
  writeNativeMods(t)
  const staged = stageFlat(t)
  console.log('  暂存 ui/libs: ' + staged.files.map(function (f) { return f.name }).join(', '))

  cleanAmr()
  runPackage()
  const amr = findAmr(expectedAmrName(appid, version))
  const out = join(PROJECT, t, basename(amr).replace(/\.amr$/, '-' + t + '.amr'))
  moveAmrTo(amr, out)
  const size = statSync(out).size
  console.log('  产物: ' + out + '（' + fmtSize(size) + '）')
  if (size >= MAX_AMR_BYTES) {
    throw new Error('[校验] ' + t + ' 包体积 ' + fmtSize(size) + ' 超过平台上限 10MB')
  }
  return { mode: 'single', target: t, out: out, size: size }
}

/* ---------------------------------------------------------------------
 * 家族组合包（推荐，--merge 默认）：同一家族多代号共用同一份 JS。
 * 例 cvis：ui/libs/arm/ + arm-coco/ + arm-plum/，
 *         JS = cvis 单包配置（native-mods 只 import updater，module 头只有 updater）。
 * 真机依据：PMS 会按设备代号选中 libs/<架构>-<代号>/ 并整目录扁平化（y02-1 已验证）。
 * ------------------------------------------------------------------- */
function buildMergeFamily(family, version, appid, verify) {
  const t = normalizeTarget(family)
  const p = getProfile(t)
  console.log('\n=== 打包 ' + t + ' 家族组合包（官方代号目录，同一份 JS）===')
  console.log('  家族: ' + p.family + ' / 官方代号: ' + p.codes.join('、') + ' / ' + p.arch + ' + ' + p.clib)
  console.log('  JS: 与原 ' + t + ' 单包完全一致（native-mods = ' + t + '，module 头只有该家族原生模块）')

  genVersion(t, verify)
  writeNativeMods(t)

  /* 清空并重建 ui/libs/ -> 按官方代号子目录暂存 -> 校验根目录无平铺 so */
  const staged = stageMergeFamily(t)
  const checked = verifyMergeStaged(staged)
  console.log('\n[暂存目录树]\n' + libsTree(staged))

  cleanAmr()
  runPackage()
  const amr = findAmr(expectedAmrName(appid, version))
  const out = join(DIST, 'miniapp-merged-' + t + '-' + version + '.amr')
  moveAmrTo(amr, out)
  const size = statSync(out).size
  console.log('  产物: ' + out + '（' + fmtSize(size) + '）')
  console.log('  暂存摘要: ' + checked.dirs.length + ' 个子目录（' + checked.dirs.join('、') + '）/ ' +
    checked.totalFiles + ' 个库文件 / 原始体积 ' + fmtSize(checked.totalSize))
  console.log('  校验: ui/libs 根目录无平铺 .so；目录名均为官方 <架构>[-<代号>] 形式')
  const stripped = staged.stripped.map(function (s) {
    return s.name + ' ' + fmtSize(s.sizeBefore) + ' -> ' + fmtSize(s.sizeAfter)
  })
  if (stripped.length) console.log('  校验: bridge 已 strip（' + stripped.join('；') + '）')
  if (size >= MAX_AMR_BYTES) {
    throw new Error('[校验] ' + t + ' 家族组合包体积 ' + fmtSize(size) + ' 超过平台上限 10MB')
  }
  console.log('  校验: 体积 ' + fmtSize(size) + ' < 10MB 上限')
  return { mode: 'merge-family', family: t, out: out, size: size, dirs: checked.dirs }
}

/* ---------------------------------------------------------------------
 * 跨家族实验组合包（--merge-cross，旧 --merge 行为）：默认不跑。
 * 真机验证（y02-1）：跨家族包中 tryRequire('panet'/'Eric') 取不到模块，
 * 控制台报 `[device] 无文件读取能力`、device source 降为 storage。
 * 仅用于对比实验/临时验证，不得作为正式产物。
 * ------------------------------------------------------------------- */
function buildMergeCross(version, appid, verify, mergeTargets) {
  console.log('\n=== 打包跨家族组合包（实验，--merge-cross）===')
  console.warn('[警告] 真机验证（y02-1）：跨家族包中 tryRequire(\'panet\'/\'Eric\') 取不到模块，')
  console.warn('[警告] 控制台报 [device] 无文件读取能力、device source 降为 storage —— 原生能力降级。')
  console.warn('[警告] 仅供实验，勿作为正式产物；正式产物请用 --merge（按家族出包）。')
  console.log('  合并家族: ' + mergeTargets.join(' + ') + '（每个家族含官方代号目录 + 架构兜底目录）')

  genVersion(MERGED_TARGET, verify)
  writeNativeMods(MERGED_TARGET)

  /* 清空并重建 ui/libs/ -> 按代号子目录暂存 -> 校验根目录无平铺 so */
  const staged = stageMerge(mergeTargets)
  const checked = verifyMergeStaged(staged)
  console.log('\n[暂存目录树]\n' + libsTree(staged))

  cleanAmr()
  runPackage()
  const amr = findAmr(expectedAmrName(appid, version))
  const out = join(DIST, 'miniapp-merged-cross-' + version + '.amr')
  moveAmrTo(amr, out)
  const size = statSync(out).size
  console.log('  产物: ' + out + '（' + fmtSize(size) + '）[实验产物，勿发布]')
  console.log('  暂存摘要: ' + checked.dirs.length + ' 个子目录 / ' + checked.totalFiles +
    ' 个库文件 / 原始体积 ' + fmtSize(checked.totalSize))
  console.log('  校验: ui/libs 根目录无平铺 .so，共 ' + checked.dirs.join('、'))
  const stripped = staged.stripped.map(function (s) {
    return s.name + ' ' + fmtSize(s.sizeBefore) + ' -> ' + fmtSize(s.sizeAfter)
  })
  if (stripped.length) console.log('  校验: bridge 已 strip（' + stripped.join('；') + '）')
  if (size >= MAX_AMR_BYTES) {
    throw new Error('[校验] 跨家族组合包体积 ' + fmtSize(size) + ' 超过平台上限 10MB')
  }
  console.log('  校验: 体积 ' + fmtSize(size) + ' < 10MB 上限')
  return { mode: 'merge-cross', out: out, size: size, dirs: checked.dirs }
}

/* 只暂存不打包（--stage）：生成版本/原生模块 + 暂存库，然后退出（不还原，供本地调试）。
 *   mode='single' -> 平铺暂存该单包目标
 *   mode='family' -> 逐个家族暂存（ui/libs 最终保留最后一个家族的结构）
 *   mode='cross'  -> 跨家族实验暂存（旧行为） */
function stageOnly(mode, singleTargets, mergeTargets, verify) {
  if (mode === 'cross') {
    console.warn('[stage] [警告] 跨家族组合包为实验模式：真机验证 rk 原生能力会降级，勿作正式产物')
    genVersion(MERGED_TARGET, verify)
    writeNativeMods(MERGED_TARGET)
    const staged = stageMerge(mergeTargets)
    const checked = verifyMergeStaged(staged)
    console.log('\n[暂存目录树]\n' + libsTree(staged))
    console.log('[stage] 跨家族实验暂存完成（未打包）：' + checked.dirs.length + ' 个子目录 / ' +
      checked.totalFiles + ' 个库文件 / 原始体积 ' + fmtSize(checked.totalSize))
    console.log('[stage] 可直接执行 pnpm -C ui package 打一个实验包自测（勿发布）')
    return
  }
  if (mode === 'family') {
    for (const fam of mergeTargets) {
      const t = normalizeTarget(fam)
      genVersion(t, verify)
      writeNativeMods(t)
      const staged = stageMergeFamily(t)
      const checked = verifyMergeStaged(staged)
      console.log('\n[' + t + ' 家族暂存目录树]\n' + libsTree(staged))
      console.log('[stage] ' + t + ' 家族组合包暂存完成（未打包）：' + checked.dirs.length +
        ' 个子目录（' + checked.dirs.join('、') + '）/ ' + checked.totalFiles + ' 个库文件')
    }
    const last = normalizeTarget(mergeTargets[mergeTargets.length - 1])
    console.log('[stage] 注意：ui/libs 当前保留最后一个家族（' + last + '）的暂存结构；' +
      '可直接 pnpm -C ui package 自测')
    return
  }
  const t = singleTargets[0]
  genVersion(t, verify)
  writeNativeMods(t)
  const staged = stageFlat(t)
  console.log('\n[暂存目录树]\n' + libsTree(staged))
  console.log('[stage] 单包暂存完成（未打包）：' + t + ' / ' +
    staged.files.length + ' 个库。可直接执行 pnpm -C ui package 自测。')
}

/* =====================================================================
 * 五、--release：patch 位 +1（官方 npm version patch --no-git-tag-version 等价）
 * ===================================================================== */
function bumpPatch() {
  const pkg = readPkg()
  const v = parseVersion(pkg.version)
  const next = v.major + '.' + v.minor + '.' + (v.patch + 1)
  const old = String(pkg.version)
  pkg.version = next
  writeFileSync(PKG_JSON, JSON.stringify(pkg, null, 2) + '\n')
  console.log('[release] ui/package.json 版本 ' + old + ' -> ' + next)
  return next
}

/* =====================================================================
 * 六、CLI
 * ===================================================================== */
function usage() {
  console.log([
    '多平台整盒打包（官方规范对齐版；组合包按家族出包）',
    '',
    '用法:',
    '  node scripts/build-amr.mjs [选项]',
    '',
    '选项:',
    '  --targets rk,cvis,rka     要打的单包平台（默认三平台全打）',
    '  --merge                   打家族组合包（默认家族 cvis,rka；每个家族一个 amr）',
    '                            每个家族：同家族多代号共用一份 JS，库按官方代号目录打包：',
    '                              cvis -> arm/ arm-coco/ arm-plum/',
    '                              rka  -> arm/ arm-y09/ arm-y09p/',
    '                              rk   -> arm64/ arm64-orange/ arm64-y02-1/（可选）',
    '  --merge-targets cvis,rka  家族组合包出包家族列表（可含 rk）',
    '  --merge-cross             跨家族实验组合包（旧 --merge 行为，默认不跑）',
    '                            真机验证 rk 原生能力会降级（tryRequire 取不到 panet/Eric、',
    '                            [device] 无文件读取能力），仅供实验，勿作正式产物',
    '  --release                 打包前把 ui/package.json 的 patch 位 +1',
    '  --stage <rk|cvis|rka>     只做库暂存，不打包（组合包暂存写 --stage --merge）',
    '  --verify                  验证构建（res/version.js 的 VERIFY_BUILD=true）',
    '  --skip-so-check           跳过 so 平台预检（确知库正确时使用）',
    '  --help, -h                显示本帮助',
    '',
    '产物:',
    '  rk/ cvis/ rka/<appid>.<版本>-<平台>.amr                 单包',
    '  dist/miniapp-merged-cvis-<版本>.amr                     家族组合包（默认）',
    '  dist/miniapp-merged-rka-<版本>.amr                      家族组合包（默认）',
    '  dist/miniapp-merged-rk-<版本>.amr                       （--merge-targets 含 rk 时）',
    '  dist/miniapp-merged-cross-<版本>.amr                    跨家族实验包（勿发布）',
    '',
    '环境变量:',
    '  TARGETS / MERGE / MERGE_TARGETS / MERGE_CROSS / VERIFY_BUILD / SKIP_SO_CHECK / PNPM_CMD',
    '',
    '示例:',
    '  node scripts/build-amr.mjs --targets rk',
    '  node scripts/build-amr.mjs --merge                       # 出 cvis + rka 两个家族组合包',
    '  node scripts/build-amr.mjs --merge --merge-targets cvis',
    '  node scripts/build-amr.mjs --merge --merge-targets rk',
    '  node scripts/build-amr.mjs --merge-cross                 # 跨家族实验（勿发布）',
    '  node scripts/build-amr.mjs --stage rk',
    '  node scripts/build-amr.mjs --stage --merge',
  ].join('\n'))
}

function splitList(v) {
  return String(v || '').split(',').map(function (s) { return s.trim() }).filter(Boolean)
}

function parseCli(argv) {
  const o = {
    targets: [], merge: false, mergeCross: false, mergeTargets: null, release: false,
    stage: null, verify: false, skipSoCheck: false, help: false,
  }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    const val = function (name) {
      const next = argv[++i]
      if (next == null) throw new Error('参数 ' + name + ' 缺少取值')
      return next
    }
    if (a === '--help' || a === '-h') o.help = true
    else if (a === '--merge') o.merge = true
    else if (a === '--merge-cross') o.mergeCross = true
    else if (a === '--release') o.release = true
    else if (a === '--verify') o.verify = true
    else if (a === '--skip-so-check') o.skipSoCheck = true
    else if (a === '--targets') o.targets = splitList(val(a))
    else if (a.indexOf('--targets=') === 0) o.targets = splitList(a.slice('--targets='.length))
    else if (a === '--merge-targets') o.mergeTargets = splitList(val(a))
    else if (a.indexOf('--merge-targets=') === 0) o.mergeTargets = splitList(a.slice('--merge-targets='.length))
    else if (a === '--stage') {
      const next = argv[i + 1]
      if (next != null && next.indexOf('--') !== 0) { o.stage = next; i++ } else o.stage = ''
    } else if (a.indexOf('--stage=') === 0) o.stage = a.slice('--stage='.length)
    else throw new Error('未知参数: ' + a + '（用 --help 查看用法）')
  }
  return o
}

/* =====================================================================
 * 七、主流程
 * ===================================================================== */
function main() {
  const opts = parseCli(process.argv.slice(2))
  if (opts.help) { usage(); return 0 }

  const T0 = Date.now()
  const verify = opts.verify || process.env.VERIFY_BUILD === '1'
  const skipSoCheck = opts.skipSoCheck || process.env.SKIP_SO_CHECK === '1'

  /* 组合包模式：
   *   family = 按家族出包（--merge，默认 cvis+rka；每个家族一个 amr）
   *   cross  = 跨家族实验（--merge-cross，旧 --merge 行为，默认不跑）
   * 兼容环境变量 MERGE=1 / MERGE_CROSS=1 与旧写法 --stage --merge。 */
  const stageMergeReq = opts.stage === 'merged' || opts.stage === 'merge'
  const wantCross = opts.mergeCross || process.env.MERGE_CROSS === '1'
  const wantFamily = opts.merge || process.env.MERGE === '1' || stageMergeReq
  if (wantCross && wantFamily) {
    throw new Error('--merge（按家族出包）与 --merge-cross（跨家族实验）不能同时使用')
  }
  const mode = wantCross ? 'cross' : (wantFamily ? 'family' : 'single')

  /* 组合包家族列表：CLI > MERGE_TARGETS > 默认（家族 cvis,rka；跨家族 rk,cvis） */
  let mergeTargets = opts.mergeTargets || (process.env.MERGE_TARGETS ? splitList(process.env.MERGE_TARGETS) : null)
  if (!mergeTargets) mergeTargets = (mode === 'cross' ? MERGE_DEFAULT.slice() : MERGE_FAMILY_DEFAULT.slice())
  mergeTargets = mergeTargets.map(normalizeTarget)

  /* 单包目标：CLI > TARGETS 环境变量 > 默认三平台 */
  let singleTargets = opts.targets.slice()
  if (!singleTargets.length && process.env.TARGETS) singleTargets = splitList(process.env.TARGETS)
  singleTargets = singleTargets.map(normalizeTarget)

  /* --stage <单包目标>：只在单包模式合法；组合包暂存写 --stage --merge（可配 --merge-targets） */
  const stageVal = (opts.stage != null && opts.stage !== '') ? normalizeTarget(opts.stage) : null
  if (stageVal && !stageMergeReq) {
    if (mode !== 'single') {
      throw new Error('--stage <单包目标> 与组合包模式不能同时使用；组合包暂存请写 --stage --merge（可配 --merge-targets）')
    }
    singleTargets = [stageVal]
  } else if (opts.stage != null && !stageMergeReq && mode === 'single') {
    throw new Error('--stage 需要一个单包目标（如 --stage rk），或配合 --merge / --merge-cross 做组合包暂存')
  }

  /* 参数组合校验 */
  if (mode !== 'single' && opts.targets.length) {
    throw new Error('组合包模式不能与 --targets 混用；请用 --merge-targets 指定家族')
  }
  if (mode === 'cross') {
    /* 跨家族实验：禁止 rka（A 系列不在官方 4 代号内，uClibc 未真机验证） */
    for (const t of mergeTargets) {
      if (t === 'rka') {
        throw new Error('[跨家族实验] 不允许合并 rka（A 系列不在官方 4 代号内，uClibc 未真机验证）\n' +
          '  rka 请用 --merge --merge-targets rka 单独出家族包。')
      }
      getProfile(t)
    }
  } else if (mode === 'family') {
    /* 按家族出包：rk / cvis / rka 都合法（rk 可选） */
    const uniq = []
    for (const t of mergeTargets) {
      getProfile(t)
      if (uniq.indexOf(t) < 0) uniq.push(t)
    }
    mergeTargets = uniq
    if (!mergeTargets.length) throw new Error('--merge-targets 为空')
  } else {
    if (opts.stage == null) {
      if (!singleTargets.length) singleTargets = TARGETS.slice()
      /* 去重 + 校验未知目标 */
      const uniq = []
      for (const t of singleTargets) {
        getProfile(t)
        if (uniq.indexOf(t) < 0) uniq.push(t)
      }
      singleTargets = uniq
    } else {
      getProfile(singleTargets[0])
    }
  }

  /* --release 先递增 patch，再读版本 */
  if (opts.release) bumpPatch()
  const pkg = readPkg()
  const version = String(pkg.version)
  const appid = String(pkg.appid || '8001865309000007')

  let keepStaged = false
  let result = null
  try {
    /* 预检：把真正要用的库都查一遍（单包查目标平台，组合包查家族） */
    try {
      precheckSo({
        mode: mode,
        targets: mode === 'single' ? singleTargets : mergeTargets,
        strip: mode !== 'single',
      })
    } catch (e) {
      if (skipSoCheck) {
        console.warn('\n[警告] 已跳过 so 平台预检（--skip-so-check），请自行确认库匹配！')
        console.warn('[警告] 原始预检错误: ' + ((e && e.message) || e).split('\n')[0])
      } else {
        throw e
      }
    }

    if (opts.stage != null) {
      /* 只暂存模式：保持暂存状态，不打包、不还原 */
      stageOnly(mode, singleTargets, mergeTargets, verify)
      keepStaged = true
      result = { mode: 'stage', buildMode: mode }
    } else if (mode === 'family') {
      /* 按家族逐个出包：cvis -> dist/miniapp-merged-cvis-<ver>.amr，rka -> ... */
      const built = []
      for (const fam of mergeTargets) built.push(buildMergeFamily(fam, version, appid, verify))
      result = { mode: 'merge-family', built: built }
    } else if (mode === 'cross') {
      result = buildMergeCross(version, appid, verify, mergeTargets)
    } else {
      const built = []
      for (const t of singleTargets) built.push(buildSingle(t, version, appid, verify))
      result = { mode: 'single', built: built }
    }
  } catch (e) {
    console.error('\n[失败] ' + ((e && e.message) || e))
    throw e
  } finally {
    if (!keepStaged) {
      try { restoreDefaults() } catch (e) {
        console.warn('[还原] [警告] 收尾还原出错: ' + ((e && e.message) || e))
      }
    }
  }

  /* 汇总日志 */
  const secs = ((Date.now() - T0) / 1000).toFixed(1)
  console.log('\n' + '='.repeat(66))
  if (result && result.mode === 'merge-family') {
    console.log('完成: 家族组合包 ' + result.built.map(function (b) {
      return b.family + ' -> ' + b.out + '（' + fmtSize(b.size) + '）'
    }).join('  |  ') + '  用时 ' + secs + 's')
  } else if (result && result.mode === 'merge-cross') {
    console.log('完成: 跨家族实验包（勿发布） -> ' + result.out + '（' + fmtSize(result.size) + '）  用时 ' + secs + 's')
  } else if (result && result.mode === 'single') {
    console.log('完成: ' + result.built.map(function (b) {
      return b.target + '/（' + fmtSize(b.size) + '）'
    }).join('  ') + '  用时 ' + secs + 's')
  } else {
    console.log('完成: 仅暂存（未打包）  用时 ' + secs + 's')
  }
  console.log('='.repeat(66))
  return 0
}

try {
  process.exit(main())
} catch (e) {
  console.error((e && e.message) || e)
  process.exit(1)
}
