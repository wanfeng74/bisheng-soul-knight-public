/*
 * 构建目标 profile 表（官方设备代号 codename 约定）。
 *
 * 依据：_ref/docs2/组合包打包规范.md
 *   - 官方支持的设备代号只有 orange / y02-1 / coco / plum；
 *   - 库物料放在 ui/libs/<架构>-<代号>/libjsapi_bridge.so，靠上层目录区分；
 *   - 构建期环境变量：CROSS_TOOLCHAIN_PREFIX / LOLIAPP_CLIB / ISCVI / TARGET_SKU；
 *   - ISCVI：aarch64 = false，armv7 = true；TARGET_SKU 不进 C++ 代码，只区分目录。
 *
 * 本项目映射（契约 §2）：
 *   rk    = RK 家族   → 官方代号 y02-1（主）/ orange，aarch64 + glibc
 *   cvis  = CVI 家族  → 官方代号 coco（主）/ plum，armv7 + glibc
 *   rka   = A 系列    → 代号 y09 / y09p，armv7 + uClibc（官方 4 代号之外，单独发布）
 *
 * 本文件只描述"目标是什么"，不负责工具链与打包。消费者：
 *   scripts/gen-ui-version.mjs / scripts/stage-libs.mjs / scripts/build-amr.mjs /
 *   native/build.mjs / ui/scripts/test-profiles.mjs
 */

/* 三平台 profile（字段即契约 §2，勿随意改名） */
export const PROFILES = {
  rk: {
    key: 'rk', family: 'RK', code: 'y02-1', codes: ['y02-1', 'orange'],
    arch: 'arm64', clib: 'glibc', isCvi: false, libsDir: 'arm64-y02-1', platform: 'rk',
  },
  cvis: {
    key: 'cvis', family: 'CVI', code: 'coco', codes: ['coco', 'plum'],
    arch: 'arm', clib: 'glibc', isCvi: true, libsDir: 'arm-coco', platform: 'cvis',
  },
  rka: {
    key: 'rka', family: 'A', code: 'y09', codes: ['y09', 'y09p'],
    arch: 'arm', clib: 'uclibc', isCvi: true, libsDir: 'arm-y09', platform: 'rka',
  },
}

/* 组合包默认合并 rk + cvis：官方 4 个代号（orange/y02-1/coco/plum）全覆盖。
 * rka 不并入：A 系列不在官方 4 代号内，uClibc 尚未真机验证（契约 §8）。 */
export const MERGE_DEFAULT = ['rk', 'cvis']

/* 是否额外生成架构兜底目录（官方 arch.md：找不到 <架构>-<代号> 目录时才用 libs/<架构>） */
export const MERGE_FALLBACK_DIRS = true

/* 构建目标总表（merged 是组合包专用目标，不是单包 profile） */
export const TARGETS = Object.keys(PROFILES)
export const MERGED_TARGET = 'merged'
export const BUILD_TARGETS = TARGETS.concat([MERGED_TARGET])

/* 历史别名：cvia 是 rka 的旧名（老版本客户端/发布脚本里写过 cvia）；merge 是 merged 的简写 */
const ALIAS = { cvia: 'rka', merge: 'merged' }

/* 归一化构建目标：去空白、转小写、别名转换。未知值原样返回（由调用方决定是否报错）。 */
export function normalizeTarget(t) {
  const v = String(t == null ? '' : t).trim().toLowerCase()
  return ALIAS[v] || v
}

/* 取 profile（未知目标直接抛错，错误信息列出合法取值）。 */
export function getProfile(key) {
  const t = normalizeTarget(key)
  if (!Object.prototype.hasOwnProperty.call(PROFILES, t)) {
    throw new Error(
      '[profiles] 未知构建目标: ' + String(key) + '\n' +
      '  可选: ' + TARGETS.join(' / ') + '（历史别名 cvia -> rka）'
    )
  }
  return PROFILES[t]
}

/* 平台名 / 设备代号 / 家族名 -> profile；未知返回 null。
 * 例：'cvia' -> rka，'rk' -> rk，'coco' -> cvis，'orange' -> rk，'y09' -> rka。 */
const NAME_TO_KEY = (function () {
  const map = {}
  for (const key of TARGETS) {
    const p = PROFILES[key]
    map[key] = key
    map[p.family.toLowerCase()] = key
    map[p.platform] = key
    for (const c of p.codes) map[c] = key
  }
  return map
})()

export function profileForPlatformName(name) {
  const n = String(name == null ? '' : name).trim().toLowerCase()
  if (!n) return null
  const key = NAME_TO_KEY[n] || ALIAS[n]
  if (key && Object.prototype.hasOwnProperty.call(PROFILES, key)) return PROFILES[key]
  return null
}
