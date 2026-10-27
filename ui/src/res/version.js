/* 【自动生成，勿手改】scripts/gen-ui-version.mjs
 *
 * 字段对齐官方 tools/generate_ui_version.js 的约定：
 *   clib / isCvi / nowVersion / buildCode / appid / updateDir；
 * 本文件另含本项目扩展字段 platform（构建目标）与 VERIFY_BUILD（真机自检开关）。
 * 构建脚本会在打包前按目标重写本文件，结束后恢复为 rk 单包默认值。
 */

export const clib = 'glibc'
export const isCvi = false
export const nowVersion = '1.4.2'
export const buildCode = 10402
export const appid = '8001865309001001'
export const updateDir = '/userdisk/BiShangSoulKnightUpdate'
export const platform = 'rk'

/* 真机自检开关（--verify / VERIFY_BUILD=1 打包时为 true）。发布产物恒为 false。 */
export const VERIFY_BUILD = false

/* —— 兼容字段（旧代码与旧测试仍可能引用）—— */
export const APP_VERSION = nowVersion
export const APP_ID = appid
export const BUILD_TARGET = platform
