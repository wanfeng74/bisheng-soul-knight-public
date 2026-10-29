/*
 * 精灵表索引：合并角色/敌人/Boss 与武器/道具/UI 两张表。
 * 美术队友分别写 entities.js / world.js，这里只做合并与兜底。
 */
import { ENTITY_SPRITES } from './entities.js'
import { PLAYER_SPRITES_EXTRA } from './player-sprites-extra.js'
import { PET_SPRITES } from './pets.js'
import { ENEMY_SPRITES_EXTRA } from './enemies-extra.js'
import { WEAPON_SPRITES, PICKUP_SPRITES, PROP_SPRITES, UI_SPRITES } from './world.js'
import { WEAPON_SPRITES_EXTRA } from './weapons-extra.js'

export var SPRITES = {}

function mergeInto(dst, src) {
  if (!src) return
  for (var k in src) {
    if (!Object.prototype.hasOwnProperty.call(src, k)) continue
    var s = src[k]
    if (!s) continue
    /* 兼容两种写法：{w,h,rows} / {w,h,frames} */
    if (!s.frames) {
      if (s.rows) s.frames = [s.rows]
      else continue
    }
    dst[k] = s
  }
}

mergeInto(SPRITES, ENTITY_SPRITES)
mergeInto(SPRITES, PLAYER_SPRITES_EXTRA)
mergeInto(SPRITES, PET_SPRITES)
mergeInto(SPRITES, ENEMY_SPRITES_EXTRA)
mergeInto(SPRITES, WEAPON_SPRITES)
mergeInto(SPRITES, WEAPON_SPRITES_EXTRA)
mergeInto(SPRITES, PICKUP_SPRITES)
mergeInto(SPRITES, PROP_SPRITES)
mergeInto(SPRITES, UI_SPRITES)

export function sprite(key) {
  return SPRITES[key] || null
}

export function spriteFrame(key, frameIndex) {
  var s = SPRITES[key]
  if (!s || !s.frames || !s.frames.length) return null
  var frames = s.frames
  var idx = frameIndex || 0
  if (idx < 0) idx = 0
  if (idx >= frames.length) idx = frames.length - 1
  return frames[idx]
}

export function spriteCount() {
  var n = 0
  for (var k in SPRITES) {
    if (Object.prototype.hasOwnProperty.call(SPRITES, k)) n++
  }
  return n
}
