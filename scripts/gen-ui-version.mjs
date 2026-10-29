#!/usr/bin/env node
/*
 * 生成 ui/src/res/version.js（官方 tools/generate_ui_version.js 的等价实现）。
 *
 * 官方约定（_ref/docs2/组合包打包规范.md §3.3）：
 *   - 版本号来源：ui/package.json 的 version 字段；
 *   - 打包时生成 ui/src/res/version.js，含 clib / isCvi / nowVersion /
 *     buildCode / appid / updateDir 等字段。
 *
 * 本项目扩展（契约 §4）：
 *   - platform：构建目标（rk / cvis / rka / merged）；
 *   - VERIFY_BUILD：真机自检开关（--verify 或 VERIFY_BUILD=1 时为 true）；
 *   - 兼容字段 APP_VERSION / APP_ID / BUILD_TARGET（旧代码与旧测试仍可引用）。
 *
 * 用法：
 *   node scripts/gen-ui-version.mjs --target rk
 *   node scripts/gen-ui-version.mjs --target merged --out ui/src/res/version.js --verify
 *   （--out 主要给单元测试写临时文件用；相对路径按项目根解析）
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PROFILES, MERGED_TARGET, TARGETS, normalizeTarget } from './profiles.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
/* 项目根 = delta-mojin-simulator/ */
export const PROJECT = resolve(HERE, '..')
export const PKG_JSON = join(PROJECT, 'ui', 'package.json')
export const DEFAULT_OUT = join(PROJECT, 'ui', 'src', 'res', 'version.js')

/* 官方 updateDir 约定（ASCII 目录名，避免设置-存储里中文乱码） */
export const UPDATE_DIR = '/userdisk/wanfeng'
/* 下载目录的 appid（与 ui/package.json 的 appid 一致；package.json 缺失才用兜底） */
export const APPID_FALLBACK = '8001865309001001'

/* 合法目标：三平台 + 组合包 */
export const VERSION_TARGETS = TARGETS.concat([MERGED_TARGET])

/* 解析 主.次.修 版本号（允许 -beta / +build 后缀，只取数字段） */
export function parseVersion(version) {
  const m = String(version == null ? '' : version).trim().match(/^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/)
  if (!m) {
    throw new Error('[gen-ui-version] 无法解析版本号: ' + String(version) +
      '（ui/package.json 的 version 应为 主.次.修，如 1.1.52）')
  }
  return { major: Number(m[1]), minor: Number(m[2]), patch: Number(m[3]) }
}

/* buildCode = 主 * 10000 + 次 * 100 + 修（1.1.52 -> 10152，契约 §4） */
export function computeBuildCode(version) {
  const v = parseVersion(version)
  return v.major * 10000 + v.minor * 100 + v.patch
}

/* 目标 -> 版本文件里的 clib / isCvi / platform 三字段 */
export function versionFieldsFor(target) {
  const t = normalizeTarget(target)
  if (t === MERGED_TARGET) {
    /* 组合包固定 glibc + isCvi=false：运行时由 services/platform.js 按设备代号判定 */
    return { clib: 'glibc', isCvi: false, platform: MERGED_TARGET }
  }
  if (!Object.prototype.hasOwnProperty.call(PROFILES, t)) {
    throw new Error('[gen-ui-version] 未知目标: ' + String(target) +
      '\n  可选: ' + VERSION_TARGETS.join(' / ') + '（历史别名 cvia -> rka）')
  }
  const p = PROFILES[t]
  return { clib: p.clib, isCvi: p.isCvi, platform: p.platform }
}

/* 读 ui/package.json（version / appid） */
export function readPkg(pkgPath) {
  const file = pkgPath || PKG_JSON
  let raw
  try {
    raw = readFileSync(file, 'utf8')
  } catch (e) {
    throw new Error('[gen-ui-version] 读不到 ' + file + ': ' + (e && e.message))
  }
  const pkg = JSON.parse(raw)
  if (!pkg.version) throw new Error('[gen-ui-version] ' + file + ' 缺少 version 字段')
  return pkg
}

/* 生成版本文件内容（纯函数，便于单测） */
export function versionContent(target, pkg, verify) {
  const f = versionFieldsFor(target)
  const version = String(pkg.version)
  const appid = String(pkg.appid || APPID_FALLBACK)
  const buildCode = computeBuildCode(version)
  const verifyFlag = !!verify
  return [
    '/* 【自动生成，勿手改】scripts/gen-ui-version.mjs',
    ' *',
    ' * 字段对齐官方 tools/generate_ui_version.js 的约定：',
    ' *   clib / isCvi / nowVersion / buildCode / appid / updateDir；',
    ' * 本文件另含本项目扩展字段 platform（构建目标）与 VERIFY_BUILD（真机自检开关）。',
    ' * 构建脚本会在打包前按目标重写本文件，结束后恢复为 rk 单包默认值。',
    ' */',
    '',
    "export const clib = '" + f.clib + "'",
    'export const isCvi = ' + (f.isCvi ? 'true' : 'false'),
    "export const nowVersion = '" + version + "'",
    'export const buildCode = ' + buildCode,
    "export const appid = '" + appid + "'",
    "export const updateDir = '" + UPDATE_DIR + "'",
    "export const platform = '" + f.platform + "'",
    '',
    '/* 真机自检开关（--verify / VERIFY_BUILD=1 打包时为 true）。发布产物恒为 false。 */',
    'export const VERIFY_BUILD = ' + (verifyFlag ? 'true' : 'false'),
    '',
    '/* —— 兼容字段（旧代码与旧测试仍可能引用）—— */',
    'export const APP_VERSION = nowVersion',
    'export const APP_ID = appid',
    'export const BUILD_TARGET = platform',
    '',
  ].join('\n')
}

/*
 * 生成并写入版本文件。参数：
 *   target   rk / cvis / rka / merged（默认 rk）
 *   out      输出路径（默认 ui/src/res/version.js；相对路径按项目根解析）
 *   verify   是否 VERIFY_BUILD=true（默认 false）
 *   pkgPath  自定义 package.json（单测用；默认 ui/package.json）
 *   quiet    不打印日志（收尾还原时由调用方统一打印）
 * 返回生成结果摘要（供调用方打日志/断言）。
 */
export function generateUiVersion(opts) {
  const o = opts || {}
  const target = normalizeTarget(o.target || 'rk')
  const out = o.out
    ? (isAbsolute(o.out) ? o.out : resolve(PROJECT, o.out))
    : DEFAULT_OUT
  const verify = o.verify != null ? !!o.verify : process.env.VERIFY_BUILD === '1'
  const pkg = readPkg(o.pkgPath)
  const content = versionContent(target, pkg, verify)
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, content)
  const info = {
    target,
    out,
    version: String(pkg.version),
    appid: String(pkg.appid || APPID_FALLBACK),
    buildCode: computeBuildCode(pkg.version),
    clib: versionFieldsFor(target).clib,
    isCvi: versionFieldsFor(target).isCvi,
    verify,
  }
  if (!o.quiet) {
    console.log('[gen-ui-version] 目标=' + info.target +
      ' 版本=' + info.version + ' buildCode=' + info.buildCode +
      ' clib=' + info.clib + ' isCvi=' + info.isCvi +
      (info.verify ? ' [验证构建]' : '') + ' -> ' + info.out)
  }
  return info
}

/* ============================ CLI ============================ */
function usage() {
  console.log([
    '生成 ui/src/res/version.js（官方 tools/generate_ui_version.js 等价实现）',
    '',
    '用法:',
    '  node scripts/gen-ui-version.mjs [选项]',
    '',
    '选项:',
    '  --target <rk|cvis|rka|merged>  构建目标（默认 rk）',
    '  --out <文件>                  输出路径（默认 ui/src/res/version.js）',
    '  --verify                      生成真机自检构建（VERIFY_BUILD=true）',
    '  --help, -h                    显示本帮助',
    '',
    '示例:',
    '  node scripts/gen-ui-version.mjs --target rk',
    '  node scripts/gen-ui-version.mjs --target merged --verify',
  ].join('\n'))
}

function parseCli(argv) {
  const opts = { target: 'rk', out: null, verify: false, help: false }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    const val = function (name) {
      const next = argv[++i]
      if (next == null || next.indexOf('--') === 0) throw new Error('参数 ' + name + ' 缺少取值')
      return next
    }
    if (a === '--help' || a === '-h') opts.help = true
    else if (a === '--verify') opts.verify = true
    else if (a === '--target' || a === '-t') opts.target = val(a)
    else if (a.indexOf('--target=') === 0) opts.target = a.slice('--target='.length)
    else if (a === '--out' || a === '-o') opts.out = val(a)
    else if (a.indexOf('--out=') === 0) opts.out = a.slice('--out='.length)
    else throw new Error('未知参数: ' + a)
  }
  return opts
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  try {
    const opts = parseCli(process.argv.slice(2))
    if (opts.help) { usage(); process.exit(0) }
    generateUiVersion(opts)
  } catch (e) {
    console.error((e && e.message) || String(e))
    process.exit(1)
  }
}
