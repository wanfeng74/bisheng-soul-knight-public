/*
 * 掉落 / 商店 / 结算经济数据。
 *
 * 经济循环（对标《元气骑士》）：
 *   房间清怪 -> 金币（局内货币，买药/买枪）-> 宝箱/精英掉武器与天赋 ->
 *   商店用金币买武器/药水/天赋 -> 局末金币换算进结算统计，宝石是永久货币。
 *
 * 坐标约定：roomReward 的 x/y 是"相对掉落中心（房间中心/箱子位置）的像素偏移"，
 * 引擎直接加到中心坐标上即可；半径控制在 56×40 内，避免掉进墙里。
 *
 * 依赖同目录 constants / rng / weapons / buffs；无循环依赖。
 * 代码风格：ES5。
 */

import { rint, chance, pick, shuffle, makeRng } from './rng.js'
import { rollWeapon, rollShopWeapons, weaponPower } from './weapons.js'
import { rollBuffs } from './buffs.js'

var FLOOR_MAX = 9
var CHAPTER_MAX = 3

/* 可拾取物：sprite 一律 'pk_<id>'（契约 5.5） */
export var PICKUPS = {
  coin: {
    id: 'coin', name: '金币', sprite: 'pk_coin', color: '#ffd93d', value: 1,
    desc: '局内货币，可在商店购买装备。'
  },
  gem: {
    id: 'gem', name: '宝石', sprite: 'pk_gem', color: '#4fc3f7', value: 1,
    desc: '永久货币，用于解锁角色与升级。'
  },
  heart: {
    id: 'heart', name: '生命之心', sprite: 'pk_heart', color: '#ff5a5a', value: 1,
    desc: '立即回复 1 点生命。'
  },
  energy_orb: {
    id: 'energy_orb', name: '能量球', sprite: 'pk_energy_orb', color: '#4dd0e1', value: 20,
    desc: '立即回复 20 点能量。'
  },
  potion_hp: {
    id: 'potion_hp', name: '红药水', sprite: 'pk_potion_hp', color: '#e5484d', value: 2,
    desc: '回复 2 点生命。'
  },
  potion_energy: {
    id: 'potion_energy', name: '蓝药水', sprite: 'pk_potion_energy', color: '#4a7dff', value: 60,
    desc: '回复 60 点能量（与引擎拾取/商店结算一致）。'
  }
}

export var PICKUP_ORDER = ['coin', 'gem', 'heart', 'energy_orb', 'potion_hp', 'potion_energy']

/* 商店常驻药水货（价格随层数与章节略涨，见 rollShop）
 * 注意：id 必须能落到引擎 buyShop 的处理分支（potion_hp / potion_energy），
 * 否则会出现"扣了钱没效果"的坏体验。 */
export var SHOP_GOODS = [
  { kind: 'potion', id: 'potion_hp', price: 18, name: '红药水', desc: '回复 2 点生命' },
  { kind: 'potion', id: 'potion_energy', price: 15, name: '蓝药水', desc: '回复 60 点能量' }
]

function num(v, def) {
  if (typeof v === 'number' && isFinite(v)) return v
  return def
}

function clampFloor(floorIndex) {
  var n = Number(floorIndex)
  if (!isFinite(n)) n = 1
  n = Math.floor(n)
  if (n < 1) n = 1
  if (n > FLOOR_MAX) n = FLOOR_MAX
  return n
}

function clampChapter(chapter) {
  var n = Number(chapter)
  if (!isFinite(n)) n = 1
  n = Math.floor(n)
  if (n < 1) n = 1
  if (n > CHAPTER_MAX) n = CHAPTER_MAX
  return n
}

function safeRng(rng) {
  if (typeof rng === 'function') return rng
  return makeRng(20261028)
}

/* 契约 4.2：价格 = floor(8 + weaponPower * 3)；未知武器不出价（回收价兜底为 1） */
function weaponPrice(weapon) {
  var power = weaponPower(weapon)
  if (power <= 0) return 0
  var p = Math.floor(8 + power * 3)
  if (p < 1) p = 1
  return p
}

export function sellPriceOf(weapon) {
  var p = weaponPrice(weapon)
  var sell = Math.floor(p * 0.45)
  if (sell < 1) sell = 1
  return sell
}

function drop(rng, kind, id, count) {
  return {
    kind: kind,
    id: id,
    count: count,
    x: rint(rng, -56, 56),
    y: rint(rng, -40, 40)
  }
}

/*
 * 房间清怪奖励。返回 [{kind:'coin'|'gem'|'potion', id, count, x, y}]，
 * x/y 为相对掉落中心的像素偏移。入口/商店/雕像房不给奖励。
 */
export function roomReward(rng, floorIndex, roomType) {
  var f = clampFloor(floorIndex)
  var r = safeRng(rng)
  var type = (typeof roomType === 'string') ? roomType : 'battle'
  var out = []

  if (type === 'start' || type === 'shop' || type === 'statue') return out

  if (type === 'battle') {
    /* 1 层 2~4 金币，之后每 2 层 +1，9 层约 6~8 */
    out.push(drop(r, 'coin', 'coin', rint(r, 2, 4) + Math.floor(f / 2)))
    if (chance(r, 0.18)) out.push(drop(r, 'potion', 'potion_hp', 1))
  } else if (type === 'elite') {
    out.push(drop(r, 'coin', 'coin', rint(r, 6, 10) + f))
    if (chance(r, 0.55)) out.push(drop(r, 'gem', 'gem', rint(r, 1, 2)))
    if (chance(r, 0.35)) out.push(drop(r, 'potion', pick(r, ['potion_hp', 'potion_energy']), 1))
  } else if (type === 'treasure') {
    out.push(drop(r, 'coin', 'coin', rint(r, 4, 8) + f))
    out.push(drop(r, 'gem', 'gem', rint(r, 1, 2)))
  } else if (type === 'boss') {
    /* Boss 房的宝石另有 constants.GEM_PER_BOSS 结算，这里只给场内掉落 */
    out.push(drop(r, 'gem', 'gem', rint(r, 2, 3)))
    out.push(drop(r, 'coin', 'coin', rint(r, 10, 16) + f * 2))
    if (chance(r, 0.6)) out.push(drop(r, 'potion', 'potion_hp', 1))
  } else {
    /* 未知房间类型：按普通战斗房给少量金币，保证不会返回异常 */
    out.push(drop(r, 'coin', 'coin', rint(r, 1, 3)))
  }
  return out
}

/*
 * 开箱结果。
 * 返回 { kind:'weapon', weaponId, count } / { kind:'coins', count } /
 *      { kind:'potion', id, count } / { kind:'buff', buffId }
 * kind='buff' 会带一个合法 buffId：引擎据此把该天赋作为三选一的第一项，
 * 再补 roll 两个候选（见 engine._openChest）。
 * gold 为真时走金箱权重：武器/天赋概率更高、金币更多。
 */
export function chestLoot(rng, floorIndex, gold) {
  var f = clampFloor(floorIndex)
  var r = safeRng(rng)
  var isGold = !!gold

  var weaponChance = isGold ? 0.45 : 0.32
  var buffChance = isGold ? 0.25 : 0.15
  var potionChance = isGold ? 0.15 : 0.25
  var roll = r()

  if (roll < weaponChance) {
    return {
      kind: 'weapon',
      weaponId: rollWeapon(r, f, { rarityBoost: isGold ? 1 : 0 }),
      count: 1
    }
  }
  if (roll < weaponChance + buffChance) {
    /* 引擎开箱分支会先读 buffId 放进三选一，再补 roll 两个；这里必须给出合法 id */
    var buffIds = rollBuffs(r, f, [], 1)
    var firstBuff = buffIds.length ? buffIds[0] : 'max_hp'
    return { kind: 'buff', buffId: firstBuff }
  }
  if (roll < weaponChance + buffChance + potionChance) {
    return {
      kind: 'potion',
      id: chance(r, 0.55) ? 'potion_hp' : 'potion_energy',
      count: 1
    }
  }
  var coins = rint(r, 8, 14) + f * 2
  if (isGold) coins = coins * 2
  return { kind: 'coins', count: coins }
}

/*
 * 商店货架。
 * 返回 { offers: 商品数组, healPrice }：
 *   weapon 商品价格严格按契约 floor(8 + weaponPower*3)；
 *   药水/天赋/治疗价格随层数与章节上涨。
 * chapter 用于控制章节难度带来的溢价（1~3 章）。
 */
export function rollShop(rng, floorIndex, chapter) {
  var f = clampFloor(floorIndex)
  var c = clampChapter(chapter)
  var r = safeRng(rng)
  var offers = []
  var i

  /* 后半层多摆一把枪（4 层起 3 把），给玩家更多选择 */
  var weaponCount = f >= 4 ? 3 : 2
  var weaponIds = rollShopWeapons(r, f, weaponCount)
  for (i = 0; i < weaponIds.length; i++) {
    var wid = weaponIds[i]
    offers.push({
      kind: 'weapon',
      weaponId: wid,
      price: weaponPrice(wid),
      sold: false
    })
  }

  /* 药水：从常驻货里随机 2 件，价格 = 基础价 + 章节/层数溢价 */
  var goods = shuffle(r, SHOP_GOODS.slice(0))
  var potionCount = 2
  for (i = 0; i < goods.length && i < potionCount; i++) {
    var g = goods[i]
    offers.push({
      kind: 'potion',
      id: g.id,
      name: g.name,
      desc: g.desc,
      price: g.price + (c - 1) * 3 + f * 2,
      sold: false
    })
  }

  /* 每店 1 个天赋商品（买下后直接获得该天赋） */
  var buffIds = rollBuffs(r, f, [], 1)
  if (buffIds.length) {
    offers.push({
      kind: 'buff',
      buffId: buffIds[0],
      price: 40 + f * 6 + (c - 1) * 10,
      sold: false
    })
  }

  /* 治疗：价格随层数/章节上涨，引擎按"回满生命与护甲"处理 */
  var healPrice = 6 + f * 2 + (c - 1) * 4
  offers.push({ kind: 'heal', name: '恢复', desc: '回满生命与护甲', price: healPrice, sold: false })

  return { offers: offers, healPrice: healPrice }
}
