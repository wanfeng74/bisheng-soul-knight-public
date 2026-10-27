/*
 * 内容数据自测（content-data 交付物）。
 *
 * 覆盖：
 *   1. 五个数据模块可加载 + ES5 风格红线（无箭头/模板串/let/const/includes/Object.assign/解构/for-of）；
 *   2. 角色：id/数量/固定顺序/技能 id/解锁费/起始武器存在/charStats 升级生效/边界输入；
 *   3. 武器：43 把/6 档品质/10 分类/5 种 pattern/字段完整/数值区间/sprite 命名/掉落必出/确定性/边界；
 *   4. 天赋：24+ 个/effect 类型全覆盖/图标 key 合法/rollBuffs 不重复不超层/边界；
 *   5. 掉落：拾取物 sprite/房间奖励/开箱/商店/回收价/边界；
 *   6. 成长：成就表/进度/升级费用/applyRunResult 统计、宝石、成就、记录/边界。
 *
 * 运行（项目根目录，DSH 自带 Node）：
 *   C:\Users\wangh\.dsh\dsh-runtimes\dsh-next-primary-runtime\dependencies\node\bin\node.exe ui/scripts/test-content.mjs
 * 输出最后一行固定为：结果: N 通过, M 失败；有失败时 exit 1。
 */
import { readFileSync } from 'node:fs'

import { RARITY_ORDER, ELEMENT, FLOOR_COUNT, GEM_PER_ROOM, GEM_PER_FLOOR, GEM_PER_BOSS, GEM_PER_WIN } from '../src/services/game/constants.js'
import { makeRng } from '../src/services/game/rng.js'
import { CHARACTERS, CHARACTER_ORDER, characterById, charStats } from '../src/services/game/characters.js'
import { WEAPONS, WEAPON_ORDER, weaponById, rollWeapon, weaponPower, rollShopWeapons } from '../src/services/game/weapons.js'
import { BUFFS, BUFF_ORDER, buffById, rollBuffs } from '../src/services/game/buffs.js'
import { PICKUPS, PICKUP_ORDER, SHOP_GOODS, roomReward, chestLoot, rollShop, sellPriceOf } from '../src/services/game/loot.js'
import { ACHIEVEMENTS, ACHIEVEMENT_ORDER, UPGRADE_DEFS, UPGRADE_ORDER, upgradeCost, progressOf, applyRunResult } from '../src/services/game/meta.js'

const GAME_DIR = new URL('../src/services/game/', import.meta.url)

let pass = 0
let fail = 0
const FAILS = []

function ok(cond, msg) {
  if (cond) {
    pass++
  } else {
    fail++
    FAILS.push(msg)
    console.log('  FAIL ' + msg)
  }
}

function eq(actual, expected, msg) {
  ok(actual === expected, msg + '（期望 ' + expected + '，实际 ' + actual + '）')
}

function near(actual, expected, eps, msg) {
  const good = Math.abs(actual - expected) <= eps
  ok(good, msg + '（期望 ' + expected + '±' + eps + '，实际 ' + actual + '）')
}

function noThrow(fn, msg) {
  try {
    fn()
    pass++
  } catch (e) {
    fail++
    FAILS.push(msg + ' 抛错: ' + ((e && e.message) || e))
    console.log('  FAIL ' + msg + ' 抛错: ' + ((e && e.message) || e))
  }
}

function section(title) {
  console.log('\n== ' + title + ' ==')
}

const CATEGORIES = ['gun', 'shotgun', 'smg', 'rifle', 'sniper', 'launcher', 'staff', 'bow', 'melee', 'special']
const PATTERNS = ['single', 'spread', 'burst', 'arc', 'beam']
const ELEMENTS = ['', 'fire', 'ice', 'poison', 'lightning']
const PLAYER_SPRITES = ['player_knight', 'player_rogue', 'player_wizard', 'player_elf', 'player_engineer', 'player_assassin', 'player_alchemist', 'player_paladin']
const PICKUP_SPRITES = ['pk_coin', 'pk_gem', 'pk_heart', 'pk_energy_orb', 'pk_potion_hp', 'pk_potion_energy']
const SKILL_IDS = ['dual_wield', 'roll', 'arcane_bolt', 'arrow_rain', 'turret', 'shadow_strike', 'poison_flask', 'holy_shield']
const BUFF_ICONS = ['ui_buff_hp', 'ui_buff_atk', 'ui_buff_spd']
const EFFECT_TYPES = [
  'maxHp', 'maxArmor', 'maxEnergy', 'crit',
  'damagePct', 'fireRatePct', 'speedPct', 'rangePct',
  'pierce', 'bounce', 'element', 'lifesteal', 'killHeal', 'killEnergy',
  'coinBonusPct', 'gemBonusPct', 'shopDiscount',
  'magnet', 'skillHastePct', 'armorRegenPct', 'reviveOnce', 'thorns'
]
const HEX = /^#[0-9a-fA-F]{6}$/

function isNonEmptyStr(v) { return typeof v === 'string' && v.length > 0 }
function isInt(v) { return typeof v === 'number' && isFinite(v) && Math.floor(v) === v }

/* ============================================================
 * 1. 模块加载 / ES5 风格 / import 白名单
 * ============================================================ */
section('模块加载 · ES5 风格 · import 白名单')

const MODULES = ['characters.js', 'weapons.js', 'buffs.js', 'loot.js', 'meta.js']
const ALLOWED_IMPORTS = {
  'characters.js': ['./constants.js', './rng.js', './palette.js'],
  'weapons.js': ['./constants.js', './rng.js', './palette.js'],
  'buffs.js': ['./constants.js', './rng.js', './palette.js'],
  'loot.js': ['./constants.js', './rng.js', './palette.js', './weapons.js', './buffs.js'],
  'meta.js': ['./constants.js', './rng.js', './palette.js', './characters.js']
}
for (const name of MODULES) {
  let src = ''
  let readable = false
  try {
    src = readFileSync(new URL(name, GAME_DIR), 'utf8')
    readable = true
  } catch (e) {}
  ok(readable, name + ' 文件存在且可读')
  if (!readable) continue

  ok(!/=>/.test(src), name + ' 不含箭头函数')
  ok(!/`/.test(src), name + ' 不含模板字符串')
  ok(!/(^|[^\w$])(let|const)\s+[A-Za-z_$]/.test(src), name + ' 不含 let/const 声明')
  ok(!/\.includes\s*\(/.test(src), name + ' 不含 String/Array.includes')
  ok(!/Object\.assign\s*\(/.test(src), name + ' 不含 Object.assign')
  ok(!/(?:var|let|const)\s*[\[{]/.test(src), name + ' 不含变量解构')
  ok(!/function\s*\([^)]*[\[{]/.test(src), name + ' 不含参数解构')
  ok(!/for\s*\([^)]*\bof\b/.test(src), name + ' 不含 for...of')
  ok(!/\.\.\./.test(src), name + ' 不含展开/剩余运算符')
  ok(!/\bclass\s+[A-Za-z_$]/.test(src), name + ' 不含 class')

  const allowed = ALLOWED_IMPORTS[name] || ['./constants.js']
  const imports = []
  const re = /from\s+'([^']+)'/g
  let m
  while ((m = re.exec(src)) !== null) imports.push(m[1])
  for (const imp of imports) {
    ok(allowed.indexOf(imp) >= 0, name + ' 的 import ' + imp + ' 在允许清单内')
  }
}

/* ============================================================
 * 2. 角色
 * ============================================================ */
section('角色数据（42 名）')

const charIds = Object.keys(CHARACTERS)
eq(charIds.length, 42, '角色数量为 42')
eq(CHARACTER_ORDER.length, 42, 'CHARACTER_ORDER 长度为 42')
eq(new Set(CHARACTER_ORDER).size, 42, 'CHARACTER_ORDER 无重复')
const UNLOCK_EXPECT = { knight: 0, rogue: 500, wizard: 800, elf: 1200, engineer: 1500, assassin: 2000, alchemist: 2500, paladin: 3000, vampire: 3500, werewolf: 4000, berserker: 4500, robot: 5000, priest: 5500, druid: 6000, trapper: 6500, qizong: 7000, transcendent: 8000, time_ninja: 9000, swordmaster: 9500, gunner: 10000, lord: 10500, spellblade: 11000, captain: 11500, special_force: 12000, doctor: 12500, mecha_girl: 13000, necromancer: 13500, cook: 14000, sheriff: 14500, taoist: 15000, suit_prince: 15500, martialist: 16000, bard: 16500, marksman: 17000, gun_expert: 17500, owl: 18000, elemental: 18500, demon_warlock: 19000, miner: 19500, astrologer: 20000, illusionist: 20500, yinyang: 21000 }
const lastCost = []
for (const id of CHARACTER_ORDER) {
  const c = CHARACTERS[id]
  ok(!!c, '角色 ' + id + ' 存在于 CHARACTERS')
  if (!c) continue
  eq(c.id, id, '角色 ' + id + ' 的 id 与 key 一致')
  ok(isNonEmptyStr(c.name), '角色 ' + id + ' 有 name')
  ok(isNonEmptyStr(c.title), '角色 ' + id + ' 有 title')
  ok(isNonEmptyStr(c.desc), '角色 ' + id + ' 有 desc（中文说明）')
  if (PLAYER_SPRITES.indexOf('player_' + id) >= 0) eq(c.sprite, 'player_' + id, '角色 ' + id + ' sprite 为 player_' + id)
  else ok(isNonEmptyStr(c.sprite), '角色 ' + id + ' 有占位 sprite')
  if (PLAYER_SPRITES.indexOf(c.sprite) >= 0) ok(true, '角色 ' + id + ' sprite 在契约 5.5 清单内')
  else ok(c.sprite === 'player_' + id, '角色 ' + id + ' 使用程序化原创外观')
  ok(HEX.test(c.color), '角色 ' + id + ' color 是 #rrggbb')
  ok(c.hp >= 1 && c.hp <= 9, '角色 ' + id + ' 生命在 1~9（' + c.hp + '）')
  ok(c.armor >= 3 && c.armor <= 9, '角色 ' + id + ' 护甲在 3~9（' + c.armor + '）')
  ok(c.energy >= 100 && c.energy <= 260, '角色 ' + id + ' 能量在 100~260（' + c.energy + '）')
  ok(c.crit >= 0 && c.crit <= 16, '角色 ' + id + ' 暴击在 0~16（' + c.crit + '）')
  ok(c.speed >= 0.85 && c.speed <= 1.2, '角色 ' + id + ' 移速在 0.85~1.2（' + c.speed + '）')
  ok(!!WEAPONS[c.starterWeapon], '角色 ' + id + ' 的 starterWeapon「' + c.starterWeapon + '」能在 WEAPONS 查到')
  ok(!!c.skill && SKILL_IDS.indexOf(c.skill.id) >= 0, '角色 ' + id + ' 技能 id 合法（' + (c.skill && c.skill.id) + '）')
  ok(!!c.skill && isNonEmptyStr(c.skill.name) && isNonEmptyStr(c.skill.desc), '角色 ' + id + ' 技能有名称/描述')
  ok(!!c.skill && c.skill.cd >= 4 && c.skill.cd <= 20, '角色 ' + id + ' 技能 CD 在 4~20 秒（' + (c.skill && c.skill.cd) + '）')
  eq(c.unlockCost, UNLOCK_EXPECT[id], '角色 ' + id + ' 解锁费用')
  lastCost.push(c.unlockCost)
}
let unlockAscending = true
for (let i = 1; i < lastCost.length; i++) if (lastCost[i] <= lastCost[i - 1]) unlockAscending = false
ok(unlockAscending, '角色解锁费用按 CHARACTER_ORDER 递增')

eq(characterById('knight').id, 'knight', 'characterById(knight) 正常')
eq(characterById('not_a_char'), null, 'characterById(未知) 返回 null')
eq(characterById(null), null, 'characterById(null) 返回 null')
eq(characterById(''), null, 'characterById(空串) 返回 null')

const knightBase = CHARACTERS.knight
const st0 = charStats('knight', null)
eq(st0.maxHp, knightBase.hp, 'charStats 基础生命')
eq(st0.maxArmor, knightBase.armor, 'charStats 基础护甲')
eq(st0.maxEnergy, knightBase.energy, 'charStats 基础能量')
eq(st0.crit, knightBase.crit, 'charStats 基础暴击')
near(st0.speed, knightBase.speed, 1e-9, 'charStats 基础移速')
eq(st0.skillCdMul, 1, 'charStats 0 级技能冷却倍率为 1')

const maxed = charStats('knight', { hp: 5, armor: 5, energy: 5, crit: 5, speed: 5, skill: 5 })
eq(maxed.maxHp, knightBase.hp + 5, '生命 +1/级 生效')
eq(maxed.maxArmor, knightBase.armor + 5, '护甲 +1/级 生效')
eq(maxed.maxEnergy, knightBase.energy + 100, '能量 +20/级 生效')
eq(maxed.crit, knightBase.crit + 15, '暴击 +3%/级 生效')
near(maxed.speed, knightBase.speed + 0.15, 1e-9, '移速 +3%/级 生效')
near(maxed.skillCdMul, 0.6, 1e-9, '技能冷却 -8%/级 生效（5 级 = 0.6）')

const clamped = charStats('rogue', { hp: 99, armor: -3, energy: 'x', crit: 2.7, speed: undefined, skill: 100 })
eq(clamped.maxHp, CHARACTERS.rogue.hp + 5, '升级等级 >5 被钳制到 5')
eq(clamped.maxArmor, CHARACTERS.rogue.armor, '负数升级等级按 0 处理')
eq(clamped.maxEnergy, CHARACTERS.rogue.energy, '非法升级值按 0 处理')
eq(clamped.crit, CHARACTERS.rogue.crit + 6, '小数升级等级向下取整（2.7 -> 2）')
near(clamped.speed, CHARACTERS.rogue.speed, 1e-9, 'undefined 升级值按 0 处理')
near(clamped.skillCdMul, 0.6, 1e-9, '技能冷却倍率下限 0.6')
noThrow(() => charStats('not_a_char', { hp: 5 }), 'charStats(未知角色) 不崩')
const fallback = charStats('not_a_char', null)
ok(isFinite(fallback.maxHp) && fallback.maxHp > 0, 'charStats(未知角色) 返回可用的兜底数值')
noThrow(() => charStats(null, 'garbage'), 'charStats(null, 非法 upgrades) 不崩')

/* ============================================================
 * 3. 武器
 * ============================================================ */
section('武器数据（30+ 把 / 6 档品质 / 10 分类 / 5 种 pattern）')

const weaponIds = Object.keys(WEAPONS)
ok(weaponIds.length >= 30, '武器数量 >= 30（实际 ' + weaponIds.length + '）')
eq(WEAPON_ORDER.length, weaponIds.length, 'WEAPON_ORDER 覆盖全部武器')
eq(new Set(WEAPON_ORDER).size, weaponIds.length, 'WEAPON_ORDER 无重复')
for (const id of WEAPON_ORDER) ok(!!WEAPONS[id], 'WEAPON_ORDER 中的 ' + id + ' 存在于 WEAPONS')

const raritySeen = new Set()
const patternSeen = new Set()
const categorySeen = new Set()
const starterIds = []
const FIELD_TYPES = {
  id: 'string', name: 'string', category: 'string', rarity: 'string',
  dmg: 'number', fireRate: 'number', energy: 'number', projectiles: 'number',
  spread: 'number', speed: 'number', life: 'number', size: 'number',
  pierce: 'number', bounce: 'number', knockback: 'number',
  element: 'string', color: 'string', sprite: 'string', pattern: 'string',
  burst: 'number', burstGap: 'number', critBonus: 'number',
  explodeRadius: 'number', chain: 'number', arc: 'number', meleeRange: 'number',
  desc: 'string', starter: 'boolean'
}
for (const id of WEAPON_ORDER) {
  const w = WEAPONS[id]
  eq(w.id, id, '武器 ' + id + ' 的 id 与 key 一致')
  ok(isNonEmptyStr(w.name), '武器 ' + id + ' 有 name')
  ok(isNonEmptyStr(w.desc), '武器 ' + id + ' 有中文 desc')
  eq(w.sprite, 'wp_' + id, '武器 ' + id + ' sprite 为 wp_' + id)
  ok(CATEGORIES.indexOf(w.category) >= 0, '武器 ' + id + ' category 合法（' + w.category + '）')
  ok(RARITY_ORDER.indexOf(w.rarity) >= 0, '武器 ' + id + ' rarity 合法（' + w.rarity + '）')
  ok(PATTERNS.indexOf(w.pattern) >= 0, '武器 ' + id + ' pattern 合法（' + w.pattern + '）')
  ok(ELEMENTS.indexOf(w.element) >= 0, '武器 ' + id + ' element 合法（' + w.element + '）')
  ok(HEX.test(w.color), '武器 ' + id + ' color 是 #rrggbb')
  for (const f of Object.keys(FIELD_TYPES)) {
    ok(typeof w[f] === FIELD_TYPES[f], '武器 ' + id + ' 字段 ' + f + ' 类型为 ' + FIELD_TYPES[f])
  }
  ok(w.dmg >= 2 && w.dmg <= 16, '武器 ' + id + ' 伤害在 2~16（' + w.dmg + '）')
  ok(w.fireRate >= 0.12 && w.fireRate <= 1.2, '武器 ' + id + ' 射速在 0.12~1.2 秒/发（' + w.fireRate + '）')
  ok(w.energy >= 0 && w.energy <= 6, '武器 ' + id + ' 耗能在 0~6（' + w.energy + '）')
  ok(isInt(w.projectiles) && w.projectiles >= 0, '武器 ' + id + ' projectiles 为非负整数')
  ok(w.life > 0, '武器 ' + id + ' life > 0')
  ok(w.size > 0, '武器 ' + id + ' size > 0')
  ok(w.knockback >= 0, '武器 ' + id + ' knockback >= 0')
  ok(w.pierce >= 0 && isInt(w.pierce), '武器 ' + id + ' pierce 为非负整数')
  ok(w.bounce >= 0 && isInt(w.bounce), '武器 ' + id + ' bounce 为非负整数')
  ok(w.burst >= 1 && isInt(w.burst), '武器 ' + id + ' burst >= 1')
  if (w.pattern === 'arc') {
    eq(w.projectiles, 0, '近战武器 ' + id + ' 不发射子弹')
    ok(w.arc > 0, '近战武器 ' + id + ' 有扇形角度 arc')
    ok(w.meleeRange > 0, '近战武器 ' + id + ' 有近战距离 meleeRange')
    eq(w.speed, 0, '近战武器 ' + id + ' 弹速为 0')
  } else {
    ok(w.projectiles >= 1, '远程武器 ' + id + ' projectiles >= 1')
    ok(w.speed > 0, '远程武器 ' + id + ' speed > 0')
  }
  if (w.pattern === 'burst') ok(w.burst > 1, '连发武器 ' + id + ' burst > 1')
  if (w.pattern === 'beam') ok(w.pierce >= 1, '光束武器 ' + id + ' 至少穿透 1 个')
  if (w.pattern === 'spread') ok(w.spread > 0, '散射武器 ' + id + ' spread > 0')
  if (w.starter) {
    starterIds.push(id)
    ok(!!w.rarity, '起始武器 ' + id + ' 有品质')
  }
  raritySeen.add(w.rarity)
  patternSeen.add(w.pattern)
  categorySeen.add(w.category)
}

eq(raritySeen.size, 6, '6 档品质全部有武器')
for (const r of RARITY_ORDER) ok(raritySeen.has(r), '品质 ' + r + ' 至少有一把武器')
for (const p of PATTERNS) ok(patternSeen.has(p), 'pattern ' + p + ' 至少有一把武器')
for (const c of CATEGORIES) ok(categorySeen.has(c), '分类 ' + c + ' 至少有一把武器')
for (const id of ['pistol', 'short_bow', 'apprentice_staff', 'rusty_blade']) {
  ok(!!WEAPONS[id], '必含新手武器 ' + id)
}
ok(starterIds.length >= 4, '起始武器至少有 4 把（实际 ' + starterIds.length + '）')
for (const id of CHARACTER_ORDER) {
  const c = CHARACTERS[id]
  const base8 = ['knight', 'rogue', 'wizard', 'elf', 'engineer', 'assassin', 'alchemist', 'paladin']
  if (base8.indexOf(id) >= 0) ok(starterIds.indexOf(c.starterWeapon) >= 0, '角色 ' + id + ' 的起始武器 ' + c.starterWeapon + ' 标记了 starter:true')
  else ok(!!WEAPONS[c.starterWeapon], '角色 ' + id + ' 的占位起始武器存在')
}

eq(weaponById('pistol').id, 'pistol', 'weaponById(pistol) 正常')
eq(weaponById('not_a_weapon'), null, 'weaponById(未知) 返回 null')
eq(weaponById(123), null, 'weaponById(非字符串) 返回 null')

const powers = []
for (const id of WEAPON_ORDER) {
  const w = WEAPONS[id]
  const p = weaponPower(w)
  ok(p > 0 && p < 200, 'weaponPower(' + id + ') 为正有限值（' + p + '）')
  eq(weaponPower(id), p, 'weaponPower 接受 id 字符串且结果一致（' + id + '）')
  eq(weaponPower(w), p, 'weaponPower 结果确定性（' + id + '）')
  powers.push(p)
}
eq(weaponPower('not_a_weapon'), 0, 'weaponPower(未知) 为 0')
eq(weaponPower(null), 0, 'weaponPower(null) 为 0')
eq(weaponPower(undefined), 0, 'weaponPower(undefined) 为 0')
eq(weaponPower({ dmg: 5, fireRate: 0.5, projectiles: 1, rarity: 'rare' }) > 0, true, 'weaponPower 支持裸武器对象')
const highestPower = Math.max.apply(null, powers)
ok(weaponPower('sun_blade') > weaponPower('pistol'), '神话武器强度高于起始手枪')

/* rollWeapon：全部合法、确定性、必出 */
let rollCount = 0
for (let seed = 1; seed <= 12; seed++) {
  for (const floor of [1, 3, 5, 7, 9]) {
    const id = rollWeapon(makeRng(seed), floor, null)
    ok(!!WEAPONS[id], 'rollWeapon(seed=' + seed + ', floor=' + floor + ') 返回合法武器（' + id + '）')
    rollCount++
    const id2 = rollWeapon(makeRng(seed), floor, null)
    eq(id2, id, 'rollWeapon 同种子同层结果可复现（seed=' + seed + ', floor=' + floor + '）')
  }
}
ok(rollCount === 60, 'rollWeapon 覆盖 12 个种子 × 5 层')

const excludeHalf = WEAPON_ORDER.filter((id, idx) => idx % 2 === 0)
for (let seed = 1; seed <= 8; seed++) {
  for (const floor of [1, 5, 9]) {
    const id = rollWeapon(makeRng(seed), floor, { exclude: excludeHalf })
    ok(!!WEAPONS[id], 'rollWeapon(exclude) 返回合法武器')
    ok(excludeHalf.indexOf(id) < 0, 'rollWeapon(exclude) 不返回被排除的武器（seed=' + seed + '）')
  }
}
for (let seed = 1; seed <= 8; seed++) {
  const id = rollWeapon(makeRng(seed), 5, { meleeOnly: true })
  ok(!!WEAPONS[id], 'rollWeapon(meleeOnly) 返回合法武器')
  eq(WEAPONS[id].category, 'melee', 'rollWeapon(meleeOnly) 只出近战（' + id + '）')
}
for (const boost of [0, 1, 2, 3]) {
  const id = rollWeapon(makeRng(7), 5, { rarityBoost: boost })
  ok(!!WEAPONS[id], 'rollWeapon(rarityBoost=' + boost + ') 返回合法武器')
}
noThrow(() => rollWeapon(makeRng(1), -3, null), 'rollWeapon(floor=-3) 不崩')
noThrow(() => rollWeapon(makeRng(1), 0, null), 'rollWeapon(floor=0) 不崩')
noThrow(() => rollWeapon(makeRng(1), 999, null), 'rollWeapon(floor=999) 不崩')
noThrow(() => rollWeapon(makeRng(1), 'abc', null), 'rollWeapon(floor=非数字) 不崩')
noThrow(() => rollWeapon(makeRng(1), undefined, undefined), 'rollWeapon(floor/opts 均 undefined) 不崩')
noThrow(() => rollWeapon(undefined, 3, null), 'rollWeapon(rng=undefined) 不崩')
ok(!!WEAPONS[rollWeapon(undefined, 3, null)], 'rollWeapon(rng=undefined) 仍必出武器')
ok(!!WEAPONS[rollWeapon(makeRng(1), 3, { exclude: WEAPON_ORDER.slice(0) })], 'exclude 清空时仍必出（放宽条件）')
ok(!!WEAPONS[rollWeapon(makeRng(1), 3, { exclude: 'not-an-array' })], 'exclude 非法类型不崩')
ok(!!WEAPONS[rollWeapon(makeRng(1), 3, { rarityBoost: 'x', meleeOnly: true })], 'opts 字段类型非法不崩')

/* rollShopWeapons */
const shelfDefault = rollShopWeapons(makeRng(3), 3)
eq(shelfDefault.length, 3, 'rollShopWeapons 默认 3 把')
eq(new Set(shelfDefault).size, 3, 'rollShopWeapons 默认不重复')
for (const id of shelfDefault) ok(!!WEAPONS[id], 'rollShopWeapons 返回合法武器（' + id + '）')
eq(rollShopWeapons(makeRng(3), 3, 0).length, 0, 'rollShopWeapons(count=0) 返回空数组')
eq(rollShopWeapons(makeRng(3), 3, -2).length, 0, 'rollShopWeapons(count=-2) 返回空数组')
const shelf6 = rollShopWeapons(makeRng(5), 9, 6)
eq(shelf6.length, 6, 'rollShopWeapons(count=6) 返回 6 把')
eq(new Set(shelf6).size, 6, 'rollShopWeapons(count=6) 不重复')
noThrow(() => rollShopWeapons(undefined, 999, 3), 'rollShopWeapons(rng=undefined, floor=999) 不崩')
const shelfA = rollShopWeapons(makeRng(11), 4, 3)
const shelfB = rollShopWeapons(makeRng(11), 4, 3)
eq(JSON.stringify(shelfA), JSON.stringify(shelfB), 'rollShopWeapons 同种子结果可复现')

/* ============================================================
 * 4. 天赋
 * ============================================================ */
section('天赋数据（24+ 个 / 22 种 effect 全覆盖 / rollBuffs）')

const buffIds = Object.keys(BUFFS)
ok(buffIds.length >= 24, '天赋数量 >= 24（实际 ' + buffIds.length + '）')
eq(BUFF_ORDER.length, buffIds.length, 'BUFF_ORDER 覆盖全部天赋')
eq(new Set(BUFF_ORDER).size, buffIds.length, 'BUFF_ORDER 无重复')
for (const id of BUFF_ORDER) ok(!!BUFFS[id], 'BUFF_ORDER 中的 ' + id + ' 存在于 BUFFS')

const NUMERIC_EFFECTS = [
  'maxHp', 'maxArmor', 'maxEnergy', 'crit',
  'damagePct', 'fireRatePct', 'speedPct', 'rangePct',
  'pierce', 'bounce', 'lifesteal', 'killHeal', 'killEnergy',
  'coinBonusPct', 'gemBonusPct', 'shopDiscount',
  'magnet', 'skillHastePct', 'armorRegenPct', 'thorns'
]
const effectSeen = new Set()
const buffRaritySeen = new Set()
for (const id of BUFF_ORDER) {
  const b = BUFFS[id]
  eq(b.id, id, '天赋 ' + id + ' 的 id 与 key 一致')
  ok(isNonEmptyStr(b.name), '天赋 ' + id + ' 有 name')
  ok(isNonEmptyStr(b.desc), '天赋 ' + id + ' 有中文 desc')
  ok(BUFF_ICONS.indexOf(b.icon) >= 0, '天赋 ' + id + ' icon 在契约 5.5 的 ui_buff_* 清单内（' + b.icon + '）')
  ok(['good', 'rare', 'epic', 'legend'].indexOf(b.rarity) >= 0, '天赋 ' + id + ' rarity 合法（' + b.rarity + '）')
  ok(isInt(b.maxStack) && b.maxStack >= 1 && b.maxStack <= 4, '天赋 ' + id + ' maxStack 在 1~4（' + b.maxStack + '）')
  ok(Array.isArray(b.effects) && b.effects.length >= 1, '天赋 ' + id + ' 有 effects')
  if (!Array.isArray(b.effects)) continue
  for (const eff of b.effects) {
    ok(EFFECT_TYPES.indexOf(eff.type) >= 0, '天赋 ' + id + ' 的 effect type 合法（' + eff.type + '）')
    effectSeen.add(eff.type)
    if (eff.type === 'element') {
      ok(Object.prototype.hasOwnProperty.call(ELEMENT, eff.value), '天赋 ' + id + ' 的 element 值合法（' + eff.value + '）')
    } else if (eff.type === 'reviveOnce') {
      eq(eff.value, true, '天赋 ' + id + ' 的 reviveOnce 值为 true')
    } else {
      ok(typeof eff.value === 'number' && isFinite(eff.value), '天赋 ' + id + ' 的 ' + eff.type + ' 为有限数值')
    }
  }
  buffRaritySeen.add(b.rarity)
}
for (const t of EFFECT_TYPES) ok(effectSeen.has(t), 'effect 类型 ' + t + ' 至少被一个天赋覆盖')
eq(effectSeen.size, EFFECT_TYPES.length, 'effect 类型无越界项')
for (const r of ['good', 'rare', 'epic', 'legend']) ok(buffRaritySeen.has(r), '天赋稀有度 ' + r + ' 至少有一个')
const elementValues = new Set()
for (const id of BUFF_ORDER) for (const eff of BUFFS[id].effects) if (eff.type === 'element') elementValues.add(eff.value)
for (const e of ['fire', 'ice', 'poison', 'lightning']) ok(elementValues.has(e), '元素附魔覆盖 ' + e)
eq(buffById('max_hp').id, 'max_hp', 'buffById(max_hp) 正常')
eq(buffById('not_a_buff'), null, 'buffById(未知) 返回 null')
eq(buffById(null), null, 'buffById(null) 返回 null')

for (let seed = 1; seed <= 10; seed++) {
  for (const floor of [1, 5, 9]) {
    const got = rollBuffs(makeRng(seed), floor, [], 3)
    eq(got.length, 3, 'rollBuffs 返回 3 个（seed=' + seed + ', floor=' + floor + '）')
    eq(new Set(got).size, 3, 'rollBuffs 三个不重复（seed=' + seed + '）')
    for (const id of got) ok(!!BUFFS[id], 'rollBuffs 返回合法 id（' + id + '）')
  }
}
const many = rollBuffs(makeRng(2), 5, [], 6)
eq(many.length, 6, 'rollBuffs(count=6) 返回 6 个')
eq(new Set(many).size, 6, 'rollBuffs(count=6) 不重复')
eq(rollBuffs(makeRng(2), 5, [], 0).length, 0, 'rollBuffs(count=0) 返回空数组')
eq(rollBuffs(makeRng(2), 5, [], -1).length, 0, 'rollBuffs(count=-1) 返回空数组')
const huge = rollBuffs(makeRng(2), 9, [], 99)
ok(huge.length <= buffIds.length, 'rollBuffs(count=99) 不超过天赋总数')
eq(new Set(huge).size, huge.length, 'rollBuffs(count=99) 不重复')
const maxedHpOwned = ['max_hp', 'max_hp', 'max_hp']
for (let i = 0; i < 20; i++) {
  const got = rollBuffs(makeRng(100 + i), 5, maxedHpOwned, 3)
  ok(got.indexOf('max_hp') < 0, 'rollBuffs 不返回已满层的 max_hp（种子 ' + (100 + i) + '）')
}
const allMaxed = []
for (const id of BUFF_ORDER) {
  for (let k = 0; k < BUFFS[id].maxStack; k++) allMaxed.push(id)
}
eq(rollBuffs(makeRng(9), 5, allMaxed, 3).length, 0, '全部天赋满层时 rollBuffs 返回空数组（不崩）')
noThrow(() => rollBuffs(undefined, 3, null, 3), 'rollBuffs(rng=undefined, owned=null) 不崩')
const fallbackRoll = rollBuffs(undefined, 3, null, 3)
eq(fallbackRoll.length, 3, 'rollBuffs(rng=undefined) 仍必出 3 个')
noThrow(() => rollBuffs(makeRng(1), 999, 'garbage', 3), 'rollBuffs(owned 非法类型) 不崩')
noThrow(() => rollBuffs(makeRng(1), -5, ['not_a_buff', 'not_a_buff'], 2), 'rollBuffs(owned 含未知 id) 不崩')

/* ============================================================
 * 5. 掉落 / 商店
 * ============================================================ */
section('掉落 · 商店 · 回收价')

eq(Object.keys(PICKUPS).length, 6, '拾取物数量为 6')
eq(PICKUP_ORDER.length, 6, 'PICKUP_ORDER 长度为 6')
for (const id of PICKUP_ORDER) {
  const p = PICKUPS[id]
  ok(!!p, '拾取物 ' + id + ' 存在')
  if (!p) continue
  eq(p.id, id, '拾取物 ' + id + ' 的 id 与 key 一致')
  eq(p.sprite, 'pk_' + id, '拾取物 ' + id + ' sprite 为 pk_' + id)
  ok(PICKUP_SPRITES.indexOf(p.sprite) >= 0, '拾取物 ' + id + ' sprite 在契约 5.5 清单内')
  ok(isNonEmptyStr(p.name), '拾取物 ' + id + ' 有 name')
  ok(HEX.test(p.color), '拾取物 ' + id + ' color 是 #rrggbb')
  ok(typeof p.value === 'number' && p.value > 0, '拾取物 ' + id + ' value > 0')
}
ok(Array.isArray(SHOP_GOODS) && SHOP_GOODS.length >= 2, 'SHOP_GOODS 至少 2 件')
for (const good of SHOP_GOODS) {
  eq(good.kind, 'potion', '商店常驻商品 kind 为 potion（' + good.id + '）')
  ok(!!PICKUPS[good.id], '商店商品 id 是合法拾取物（' + good.id + '）')
  ok(isInt(good.price) && good.price > 0, '商店商品价格为正整数（' + good.id + '）')
}

const REWARD_KINDS = ['coin', 'gem', 'potion']
for (let seed = 1; seed <= 6; seed++) {
  for (const floor of [1, 3, 5, 7, 9]) {
    for (const roomType of ['battle', 'elite', 'treasure', 'boss']) {
      let drops = null
      noThrow(() => { drops = roomReward(makeRng(seed * 31 + floor), floor, roomType) }, 'roomReward(' + roomType + ', floor=' + floor + ') 不崩')
      if (!drops) continue
      ok(Array.isArray(drops) && drops.length >= 1, 'roomReward(' + roomType + ', floor=' + floor + ') 至少掉 1 件')
      for (const d of drops) {
        ok(REWARD_KINDS.indexOf(d.kind) >= 0, '房间奖励 kind 合法（' + d.kind + '）')
        ok(!!PICKUPS[d.id], '房间奖励 id 是合法拾取物（' + d.id + '）')
        ok(isInt(d.count) && d.count >= 1, '房间奖励 count >= 1')
        ok(typeof d.x === 'number' && isFinite(d.x) && Math.abs(d.x) <= 56, '房间奖励 x 为 ±56 内偏移')
        ok(typeof d.y === 'number' && isFinite(d.y) && Math.abs(d.y) <= 40, '房间奖励 y 为 ±40 内偏移')
      }
    }
  }
}
for (const roomType of ['start', 'shop', 'statue']) {
  const drops = roomReward(makeRng(1), 3, roomType)
  eq(drops.length, 0, roomType + ' 房不给掉落')
}
noThrow(() => roomReward(makeRng(1), 3, 'not_a_room'), 'roomReward(未知房间类型) 不崩')
ok(Array.isArray(roomReward(makeRng(1), 3, 'not_a_room')), 'roomReward(未知房间类型) 返回数组')
noThrow(() => roomReward(makeRng(1), -5, 'battle'), 'roomReward(floor=-5) 不崩')
noThrow(() => roomReward(makeRng(1), 999, 'boss'), 'roomReward(floor=999) 不崩')
noThrow(() => roomReward(undefined, 3, 'battle'), 'roomReward(rng=undefined) 不崩')
const bossDrops = roomReward(makeRng(1), 3, 'boss')
ok(bossDrops.length >= 2, 'Boss 房至少掉 2 件')

const chestKinds = new Set()
for (let seed = 1; seed <= 200; seed++) {
  const floor = (seed % 9) + 1
  const isGold = seed % 2 === 0
  let loot = null
  noThrow(() => { loot = chestLoot(makeRng(seed), floor, isGold) }, 'chestLoot(seed=' + seed + ') 不崩')
  if (!loot) continue
  ok(['weapon', 'coins', 'potion', 'buff'].indexOf(loot.kind) >= 0, '开箱 kind 合法（' + loot.kind + '）')
  chestKinds.add(loot.kind)
  if (loot.kind === 'weapon') ok(!!WEAPONS[loot.weaponId], '开箱武器 id 合法（' + loot.weaponId + '）')
  if (loot.kind === 'potion') ok(!!PICKUPS[loot.id], '开箱药水 id 合法（' + loot.id + '）')
  if (loot.kind === 'coins') ok(isInt(loot.count) && loot.count >= 1, '开箱金币数量 >= 1')
  if (loot.kind === 'buff') ok(!!BUFFS[loot.buffId], '开箱天赋 buffId 合法（' + loot.buffId + '）')
}
for (const kind of ['weapon', 'coins', 'potion', 'buff']) ok(chestKinds.has(kind), '开箱结果覆盖 kind=' + kind)
noThrow(() => chestLoot(undefined, 3, true), 'chestLoot(rng=undefined) 不崩')
noThrow(() => chestLoot(makeRng(1), 999, 1), 'chestLoot(floor=999, gold=1) 不崩')

for (let seed = 1; seed <= 20; seed++) {
  const floor = (seed % 9) + 1
  const chapter = (seed % 3) + 1
  const shop = rollShop(makeRng(seed), floor, chapter)
  ok(!!shop && Array.isArray(shop.offers), 'rollShop 返回 offers 数组（seed=' + seed + '）')
  if (!shop || !Array.isArray(shop.offers)) continue
  ok(shop.offers.length >= 5, '商店至少 5 个商品（seed=' + seed + '，实际 ' + shop.offers.length + '）')
  ok(isInt(shop.healPrice) && shop.healPrice > 0, 'healPrice 为正整数')
  let weaponOffers = 0
  let healOffers = 0
  for (const offer of shop.offers) {
    ok(['weapon', 'potion', 'buff', 'heal'].indexOf(offer.kind) >= 0, '商品 kind 合法（' + offer.kind + '）')
    eq(offer.sold, false, '商品初始 sold=false')
    if (offer.kind === 'weapon') {
      weaponOffers++
      ok(!!WEAPONS[offer.weaponId], '武器商品 id 合法（' + offer.weaponId + '）')
      eq(offer.price, Math.floor(8 + weaponPower(offer.weaponId) * 3), '武器价格 = floor(8 + weaponPower*3)（' + offer.weaponId + '）')
      ok(offer.price > 0, '武器价格 > 0')
    } else if (offer.kind === 'potion') {
      ok(!!PICKUPS[offer.id], '药水商品 id 合法（' + offer.id + '）')
      ok(isInt(offer.price) && offer.price > 0, '药水价格为正整数')
    } else if (offer.kind === 'buff') {
      ok(!!BUFFS[offer.buffId], '天赋商品 id 合法（' + offer.buffId + '）')
      ok(isInt(offer.price) && offer.price > 0, '天赋价格为正整数')
    } else if (offer.kind === 'heal') {
      healOffers++
      eq(offer.price, shop.healPrice, '治疗商品价格与 healPrice 一致')
    }
  }
  eq(weaponOffers, floor >= 4 ? 3 : 2, '武器货位数量随层数增加（floor=' + floor + '）')
  eq(healOffers, 1, '商店恰好 1 个治疗位')
  /* 武器货位不重复 */
  const wids = shop.offers.filter((o) => o.kind === 'weapon').map((o) => o.weaponId)
  eq(new Set(wids).size, wids.length, '武器货位不重复（seed=' + seed + '）')
}
noThrow(() => rollShop(makeRng(1), -1, 0), 'rollShop(floor=-1, chapter=0) 不崩')
noThrow(() => rollShop(makeRng(1), 999, 99), 'rollShop(floor=999, chapter=99) 不崩')
noThrow(() => rollShop(undefined, 3, 1), 'rollShop(rng=undefined) 不崩')
ok(Array.isArray(rollShop(undefined, 3, 1).offers), 'rollShop(rng=undefined) 仍返回货架')
const shopA = rollShop(makeRng(42), 5, 2)
const shopB = rollShop(makeRng(42), 5, 2)
eq(JSON.stringify(shopA), JSON.stringify(shopB), 'rollShop 同种子结果可复现')

for (const id of WEAPON_ORDER) {
  const sell = sellPriceOf(WEAPONS[id])
  const buy = Math.floor(8 + weaponPower(id) * 3)
  ok(isInt(sell) && sell >= 1, 'sellPriceOf(' + id + ') 为正整数')
  ok(sell < buy, '回收价低于购买价（' + id + '：' + sell + ' < ' + buy + '）')
  eq(sellPriceOf(id), sell, 'sellPriceOf 接受 id 字符串（' + id + '）')
}
eq(sellPriceOf('not_a_weapon'), 1, 'sellPriceOf(未知) 至少为 1')
eq(sellPriceOf(null), 1, 'sellPriceOf(null) 至少为 1')

/* ============================================================
 * 6. 成长 / 结算
 * ============================================================ */
section('成长 · 成就 · 结算')

const achIds = Object.keys(ACHIEVEMENTS)
ok(achIds.length >= 20, '成就数量 >= 20（实际 ' + achIds.length + '）')
eq(ACHIEVEMENT_ORDER.length, achIds.length, 'ACHIEVEMENT_ORDER 覆盖全部成就')
eq(new Set(ACHIEVEMENT_ORDER).size, achIds.length, 'ACHIEVEMENT_ORDER 无重复')
const ACH_KINDS = ['stat', 'field', 'floor', 'chars', 'weapons', 'chapters', 'win_no_revive']
for (const id of ACHIEVEMENT_ORDER) {
  const a = ACHIEVEMENTS[id]
  ok(!!a, '成就 ' + id + ' 存在')
  if (!a) continue
  eq(a.id, id, '成就 ' + id + ' 的 id 与 key 一致')
  ok(isNonEmptyStr(a.name), '成就 ' + id + ' 有 name')
  ok(isNonEmptyStr(a.desc), '成就 ' + id + ' 有中文 desc')
  ok(ACH_KINDS.indexOf(a.kind) >= 0, '成就 ' + id + ' kind 合法（' + a.kind + '）')
  ok(typeof a.target === 'number' && a.target > 0, '成就 ' + id + ' target > 0')
}
ok(!!ACHIEVEMENTS.first_run, '必含成就 first_run')

const upgradeKeys = Object.keys(UPGRADE_DEFS)
eq(upgradeKeys.length, 6, '升级项数量为 6')
eq(UPGRADE_ORDER.length, 6, 'UPGRADE_ORDER 长度 6')
for (const stat of UPGRADE_ORDER) {
  const def = UPGRADE_DEFS[stat]
  ok(!!def, '升级项 ' + stat + ' 存在')
  if (!def) continue
  eq(def.id, stat, '升级项 ' + stat + ' 的 id 与 key 一致')
  ok(isNonEmptyStr(def.name), '升级项 ' + stat + ' 有 name')
  eq(def.max, 5, '升级项 ' + stat + ' 上限为 5')
  ok(isNonEmptyStr(def.fmt), '升级项 ' + stat + ' 有 fmt')
}
eq(UPGRADE_DEFS.energy.step, 20, '能量每级 +20')
eq(UPGRADE_DEFS.crit.step, 3, '暴击每级 +3')
eq(UPGRADE_DEFS.skill.step, 8, '冷却每级 -8')

for (const stat of UPGRADE_ORDER) {
  const costs = []
  for (let lv = 0; lv < 5; lv++) {
    const c = upgradeCost('knight', stat, lv)
    ok(isInt(c) && c > 0 && c % 5 === 0, 'upgradeCost(' + stat + ', lv=' + lv + ') 为 5 的倍数且 >0（' + c + '）')
    costs.push(c)
  }
  let increasing = true
  for (let i = 1; i < costs.length; i++) if (costs[i] <= costs[i - 1]) increasing = false
  ok(increasing, 'upgradeCost(' + stat + ') 随等级递增（' + costs.join('/') + '）')
  eq(upgradeCost('knight', stat, 5), 0, 'upgradeCost(' + stat + ', 满级) 返回 0')
  eq(upgradeCost('knight', stat, 99), 0, 'upgradeCost(' + stat + ', 越界等级) 返回 0')
  eq(upgradeCost('knight', stat, -3), costs[0], 'upgradeCost(' + stat + ', 负数等级) 按 0 级处理')
}
eq(upgradeCost('knight', 'not_a_stat', 0), 0, 'upgradeCost(未知升级项) 返回 0')
eq(upgradeCost('knight', 'hp', 2), upgradeCost('paladin', 'hp', 2), '升级费用与角色无关（当前设计）')

function makeDb() {
  return {
    v: 1,
    gems: 100,
    lifetimeCoins: 0,
    unlockedChars: ['knight'],
    charUpgrades: {},
    unlockedWeapons: {},
    achievements: {},
    stats: {
      runs: 0, wins: 0, deaths: 0, kills: 0, bossKills: 0,
      bestFloor: 0, bestRoom: 0, totalGems: 0, playMs: 0, revives: 0
    },
    settings: { soundOn: true, autoAim: true, shake: true, showFps: false },
    lastChar: 'knight',
    seenIntro: false,
    saveAt: 0
  }
}

const dbFresh = makeDb()
eq(progressOf(dbFresh, 'first_run'), 0, '未冒险时 first_run 进度为 0')
eq(progressOf(dbFresh, 'not_an_ach'), 0, 'progressOf(未知成就) 为 0')
eq(progressOf(null, 'first_run'), 0, 'progressOf(null db) 为 0 且不崩')

const dbProg = makeDb()
dbProg.stats.totalGems = 500
eq(progressOf(dbProg, 'rich_1000'), 500, '总宝石 500 时 rich_1000 进度为 500/1000（绝对值）')
dbProg.stats.bestFloor = 10
eq(progressOf(dbProg, 'chapters_3'), 2, 'bestFloor=10 时章节进度为 2/3（绝对值）')
dbProg.unlockedChars = ['knight', 'rogue', 'wizard', 'elf', 'engineer', 'assassin', 'alchemist', 'paladin']
eq(progressOf(dbProg, 'all_chars'), 8, '解锁 8 角色后 all_chars 进度为 8/8')
const dbWeap = makeDb()
for (let i = 0; i < 15; i++) dbWeap.unlockedWeapons[WEAPON_ORDER[i]] = true
eq(progressOf(dbWeap, 'weapon_15'), 15, '解锁 15 把武器后 weapon_15 进度为 15/15')
const dbKill = makeDb()
dbKill.stats.kills = 25
eq(progressOf(dbKill, 'kill_50'), 25, '击杀 25 时 kill_50 进度为 25/50（绝对值）')
dbKill.achievements.kill_200 = true
eq(progressOf(dbKill, 'kill_200'), 200, '已解锁成就的进度返回 target 本身')
eq(progressOf(makeDb(), 'no_revive_win', { outcome: 'victory', revives: 0 }), 1, '无复活通关时 no_revive_win 进度为 1/1')
eq(progressOf(makeDb(), 'no_revive_win', { outcome: 'victory', revives: 1 }), 0, '用过复活时 no_revive_win 进度为 0')
for (const id of ACHIEVEMENT_ORDER) {
  const p = progressOf(dbProg, id)
  const target = ACHIEVEMENTS[id].target
  ok(p >= 0 && p <= target, '成就 ' + id + ' 进度在 0~target 之间（' + p + '/' + target + '）')
}

/* --- 通关结算 --- */
const victoryResult = {
  outcome: 'victory', characterId: 'knight', characterName: '骑士',
  chapter: 3, chapterName: '霜寒王座', floor: 20, floorInChapter: 5,
  roomsCleared: 20, kills: 60, bossKills: 3, coins: 120,
  gemsCollected: 5, gemsEarned: 47, durationMs: 600000,
  damageDealt: 1000, damageTaken: 120, revives: 0,
  weapons: ['pistol'], buffs: ['max_hp']
}
const db1 = makeDb()
const res1 = applyRunResult(db1, victoryResult)
eq(res1.db, db1, 'applyRunResult 原地更新并返回同一个 db')
eq(db1.stats.runs, 1, '结算后 runs +1')
eq(db1.stats.wins, 1, '通关后 wins +1')
eq(db1.stats.deaths, 0, '通关不计死亡')
eq(db1.stats.kills, 60, '结算累加击杀数')
eq(db1.stats.bossKills, 3, '结算累加 Boss 击杀')
eq(db1.stats.revives, 0, '结算累加复活次数')
eq(db1.stats.playMs, 600000, '结算累加游戏时长')
eq(db1.stats.totalGems, 47, '结算累加累计宝石')
eq(db1.stats.bestFloor, 20, '结算更新最佳层数')
eq(db1.stats.bestRoom, 20, '结算更新最佳房间数')
eq(db1.lifetimeCoins, 120, '结算把本局金币计入累计金币')
eq(db1.gems, 147, '结算发放宝石到存档（100 + 47）')
ok(db1.saveAt > 0, '结算写入 saveAt 时间戳')
eq(db1.achievements.first_run, true, '解锁成就 first_run')
eq(db1.achievements.first_win, true, '解锁成就 first_win')
eq(res1.records.newBestFloor, true, 'records.newBestFloor = true')
eq(res1.records.newBestRoom, true, 'records.newBestRoom = true')
eq(res1.records.bestFloor, 20, 'records.bestFloor = 9')
eq(res1.records.bestRoom, 20, 'records.bestRoom = 20')
eq(res1.records.gemsEarned, 47, 'records.gemsEarned 与本局一致')
eq(res1.records.coins, 120, 'records.coins 与本局一致')
const expectAch = ['first_run', 'first_win', 'floor_3', 'floor_6', 'floor_9', 'boss_slayer', 'kill_50', 'room_10', 'no_revive_win', 'chapters_3'].sort()
const gotAch = res1.newAchievements.slice().sort()
eq(gotAch.length, expectAch.length, '通关解锁成就数量正确（' + gotAch.join(',') + '）')
ok(gotAch.every((id, i) => id === expectAch[i]), '通关解锁成就集合精确匹配')
ok(gotAch.indexOf('win_3') < 0, '未解锁 win_3（只赢了 1 次）')
ok(gotAch.indexOf('boss_hunter') < 0, '未解锁 boss_hunter（只杀了 3 个 Boss）')

/* --- 第二局：失败且成绩更差，不应刷新记录、不应重复解锁 --- */
const deadResult = {
  outcome: 'dead', characterId: 'knight', floor: 4, roomsCleared: 8,
  kills: 10, bossKills: 0, coins: 20, gemsCollected: 2, gemsEarned: 12,
  durationMs: 120000, revives: 1
}
const res2 = applyRunResult(db1, deadResult)
eq(db1.stats.runs, 2, '第二局 runs = 2')
eq(db1.stats.wins, 1, '第二局失败后 wins 不变')
eq(db1.stats.deaths, 1, '阵亡后 deaths +1')
eq(db1.stats.bestFloor, 20, '更差成绩不覆盖最佳层数')
eq(db1.stats.bestRoom, 20, '更差成绩不覆盖最佳房间数')
eq(res2.records.newBestFloor, false, '第二局 newBestFloor = false')
eq(db1.gems, 159, '两局宝石累计（147 + 12）')
eq(res2.newAchievements.length, 0, '第二局没有新成就（不重复解锁）')

/* --- 放弃：不计死亡、不计胜利 --- */
const dbAbandon = makeDb()
const res3 = applyRunResult(dbAbandon, { outcome: 'abandon', floor: 2, roomsCleared: 3, kills: 4, coins: 5, gemsEarned: 3, durationMs: 30000 })
eq(dbAbandon.stats.runs, 1, '放弃局也计入 runs')
eq(dbAbandon.stats.deaths, 0, '放弃局不计死亡')
eq(dbAbandon.stats.wins, 0, '放弃局不计胜利')
eq(dbAbandon.stats.bestFloor, 2, '放弃局仍记录最佳层数')
eq(dbAbandon.gems, 103, '放弃局也发放宝石')

/* --- 宝石兜底：result 没给 gemsEarned 时按 constants 计算 --- */
const dbFallback = makeDb()
const fallbackResult = {
  outcome: 'victory', floor: 2, roomsCleared: 4, bossKills: 1,
  coins: 0, gemsCollected: 2, durationMs: 1000, revives: 0
}
applyRunResult(dbFallback, fallbackResult)
const expectedGems = 4 * GEM_PER_ROOM + 2 * GEM_PER_FLOOR + 1 * GEM_PER_BOSS + GEM_PER_WIN + 2
eq(dbFallback.stats.totalGems, expectedGems, '缺少 gemsEarned 时按 constants 兜底计算（' + expectedGems + '）')
eq(dbFallback.gems, 100 + expectedGems, '兜底宝石同样入账')

/* --- 预解锁成就不会重复发放 --- */
const dbPre = makeDb()
dbPre.achievements.first_run = true
const resPre = applyRunResult(dbPre, { outcome: 'dead', floor: 1, roomsCleared: 1, kills: 1, durationMs: 1000 })
ok(resPre.newAchievements.indexOf('first_run') < 0, '已解锁成就不再重复加入 newAchievements')

/* --- 边界输入 --- */
noThrow(() => applyRunResult(null, null), 'applyRunResult(null, null) 不崩')
const resNull = applyRunResult(null, null)
ok(!!resNull.db && !!resNull.db.stats, 'applyRunResult(null, null) 返回可用的 db 骨架')
eq(resNull.db.stats.runs, 1, 'applyRunResult(null, null) 仍累加 runs')
ok(resNull.db.gems >= 0, 'applyRunResult(null, null) 宝石非负')
noThrow(() => applyRunResult({}, 'garbage'), 'applyRunResult({}, 非法 result) 不崩')
const dbBad = makeDb()
noThrow(() => applyRunResult(dbBad, {
  outcome: 'dead', floor: -3, roomsCleared: -2, kills: 'abc', bossKills: null,
  coins: -5, gemsCollected: -1, gemsEarned: NaN, durationMs: -100, revives: -2
}), 'applyRunResult(非法数值) 不崩')
eq(dbBad.stats.runs, 1, '非法数值局仍累加 runs')
eq(dbBad.stats.bestFloor, 0, '负数层数钳制为 0')
eq(dbBad.stats.bestRoom, 0, '负数房间钳制为 0')
eq(dbBad.stats.kills, 0, '非数字击杀按 0')
eq(dbBad.stats.deaths, 1, 'dead 仍计死亡')
ok(dbBad.gems >= 100, '非法宝石值不扣宝石')
ok(dbBad.lifetimeCoins >= 0, '非法金币不产生负数累计')
const dbPartial = { gems: 5 }
noThrow(() => applyRunResult(dbPartial, { outcome: 'victory', floor: 3, roomsCleared: 5, kills: 20, bossKills: 1, coins: 10, gemsEarned: 21, durationMs: 5000 }), 'applyRunResult(残缺存档) 不崩')
eq(dbPartial.stats.runs, 1, '残缺存档被补齐后正常结算')
eq(dbPartial.stats.wins, 1, '残缺存档结算 wins 正常')
eq(dbPartial.gems, 26, '残缺存档宝石累加正常')
ok(Array.isArray(dbPartial.unlockedChars), '残缺存档补齐 unlockedChars')

/* ============================================================
 * 汇总
 * ============================================================ */
console.log('')
if (FAILS.length) {
  console.log('失败清单（' + FAILS.length + '）：')
  for (const f of FAILS) console.log('  - ' + f)
  console.log('')
}
console.log('结果: ' + pass + ' 通过, ' + fail + ' 失败')
process.exit(fail > 0 ? 1 : 0)
