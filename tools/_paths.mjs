/*
 * 共享路径。所有工具都从这里取路径 —— 早期每个脚本各自写死
 * `D:\PROJECT2\delta-mojin-simulator\ui`，别人 clone 下来根本跑不了。
 *
 * 约定: 本文件位于 <repo>/tools/ 下。
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))

/** 仓库根目录 */
export const REPO = path.resolve(HERE, '..')
/** 前端工程目录 (<repo>/ui) */
export const UI = path.join(REPO, 'ui')
/** src 目录 */
export const SRC = path.join(UI, 'src')
