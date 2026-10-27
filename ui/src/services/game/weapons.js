/*
 * 武器数据（43 把，覆盖 6 档品质 / 10 个分类）。
 *
 * 数值设计对标《元气骑士》：
 *   - 伤害 2~16；射速 0.12~1.10 秒/发；每发能量 0~6；
 *   - 品质越高伤害/特效越强，但射速更慢或耗能更高，避免上位完全替代；
 *   - 近战统一 pattern='arc'（引擎按扇形判伤），远程用 single/spread/burst/beam；
 *   - sprite 一律 'wp_<id>'，与美术契约 5.5 对应；id 与 art-world 的精灵表约定一致。
 *
 * 只依赖同目录 constants.js / rng.js。weapons 不 import characters（避免循环），
 * 角色 starterWeapon 由 characters.js 引用本表的 id。
 * 代码风格：ES5（var / function），会被打进 QuickJS 包。
 */

import { RARITY, RARITY_ORDER, ELEMENT } from './constants.js'
import { weighted, makeRng } from './rng.js'

var PATTERNS = {
  single: true,
  spread: true,
  burst: true,
  arc: true,
  beam: true
}

/* 各品质的"基础权重"和"每层增量"：层数越深，高品质越容易出 */
var RARITY_BASE = [36, 28, 14, 6, 1.6, 0.2]
var RARITY_FLOOR_STEP = [-3.5, -1.5, 2, 2, 0.7, 0.28]

var FLOOR_MAX = 9

function num(v, def) {
  if (typeof v === 'number' && isFinite(v)) return v
  return def
}

function makeWeapon(c) {
  var rarity = RARITY[c.rarity] ? c.rarity : 'common'
  var element = (c.element && ELEMENT[c.element]) ? c.element : ''
  var pattern = PATTERNS[c.pattern] ? c.pattern : 'single'
  var isArc = pattern === 'arc'
  var color = c.color
  if (!color) color = element ? ELEMENT[element].color : RARITY[rarity].color

  return {
    id: c.id,
    name: c.name,
    category: c.category,
    rarity: rarity,
    dmg: num(c.dmg, 1),
    fireRate: num(c.fireRate, 0.5),
    energy: num(c.energy, 0),
    projectiles: num(c.projectiles, isArc ? 0 : 1),
    spread: num(c.spread, 0),
    speed: num(c.speed, isArc ? 0 : 520),
    life: num(c.life, isArc ? 0.25 : 0.9),
    size: num(c.size, 4),
    pierce: num(c.pierce, 0),
    bounce: num(c.bounce, 0),
    knockback: num(c.knockback, 30),
    element: element,
    color: color,
    sprite: 'wp_' + c.id,
    pattern: pattern,
    burst: num(c.burst, 1),
    burstGap: num(c.burstGap, 0.06),
    critBonus: num(c.critBonus, 0),
    explodeRadius: num(c.explodeRadius, 0),
    chain: num(c.chain, 0),
    arc: num(c.arc, 0),
    meleeRange: num(c.meleeRange, 0),
    desc: c.desc || '',
    starter: !!c.starter
  }
}

/*
 * 武器配置表。未写的字段走 makeWeapon 的默认值（见上），
 * 因此每项只写"有辨识度"的数值，便于核对与调整。
 */
var RAW = [
  /* 维基初始武器（美术/弹道先用同类占位） */
  { id: 'old_pistol', name: '破旧的手枪', category: 'gun', rarity: 'common',
    dmg: 3, fireRate: 0.30, energy: 1, spread: 0.03, speed: 520, life: 0.85, size: 5, knockback: 40,
    desc: '骑士的初始手枪。', starter: true },
  { id: 'xiaoming_xiaohong', name: '小明小红', category: 'gun', rarity: 'common',
    dmg: 3, fireRate: 0.34, energy: 1, spread: 0.08, speed: 510, life: 0.85, size: 5, knockback: 35,
    desc: '游侠的双枪。', starter: true },
  { id: 'codex', name: '法典', category: 'staff', rarity: 'common',
    dmg: 4, fireRate: 0.42, energy: 1, spread: 0.04, speed: 480, life: 1.0, size: 6, knockback: 30,
    desc: '法师的初始法典。', starter: true },
  { id: 'bow', name: '弓', category: 'bow', rarity: 'common',
    dmg: 5, fireRate: 0.55, energy: 0, spread: 0.02, speed: 620, life: 0.9, size: 5, knockback: 35,
    desc: '精灵的初始弓。', starter: true },
  { id: 'engineer_turret', name: '工程炮台', category: 'smg', rarity: 'common',
    dmg: 3, fireRate: 0.26, energy: 1, spread: 0.12, speed: 500, life: 0.8, size: 5, knockback: 25,
    desc: '工程师的初始武器。', starter: true },
  { id: 'blood_blade', name: '血刃', category: 'melee', rarity: 'common',
    dmg: 5, fireRate: 0.38, energy: 0, pattern: 'arc', arc: 1.2, meleeRange: 34, knockback: 45,
    desc: '刺客的初始血刃。', starter: true },
  { id: 'poison_bottle', name: '毒瓶', category: 'special', rarity: 'common',
    dmg: 4, fireRate: 0.60, energy: 2, spread: 0.15, speed: 380, life: 1.1, size: 8, knockback: 20,
    desc: '炼金术士的毒瓶。', starter: true },
  { id: 'holy_flail', name: '神圣连枷', category: 'melee', rarity: 'common',
    dmg: 6, fireRate: 0.48, energy: 0, pattern: 'arc', arc: 1.5, meleeRange: 38, knockback: 60,
    desc: '圣骑士的初始连枷。', starter: true },
  /* 维基常见武器（弹道/数值占位） */
  { id: 'pan', name: '平底锅', category: 'melee', rarity: 'common',
    dmg: 5, fireRate: 0.46, energy: 0, pattern: 'arc', arc: 1.6, meleeRange: 34, knockback: 55, desc: '厨房神器。' },
  { id: 'wok', name: '炒勺', category: 'melee', rarity: 'common',
    dmg: 4, fireRate: 0.40, energy: 0, pattern: 'arc', arc: 1.4, meleeRange: 32, knockback: 40, desc: '厨师的长勺。' },
  { id: 'smg_wiki', name: '冲锋枪', category: 'smg', rarity: 'good',
    dmg: 3, fireRate: 0.18, energy: 1, spread: 0.12, speed: 520, life: 0.8, size: 5, knockback: 20, desc: '高射速冲锋枪。' },
  { id: 'shotgun_wiki', name: '霰弹枪', category: 'shotgun', rarity: 'good',
    dmg: 4, fireRate: 0.55, energy: 2, spread: 0.35, speed: 480, life: 0.7, size: 5, count: 5, knockback: 50, desc: '近距离霰弹。' },
  { id: 'sniper_wiki', name: '狙击枪', category: 'sniper', rarity: 'rare',
    dmg: 12, fireRate: 0.85, energy: 3, spread: 0.01, speed: 900, life: 1.2, size: 5, knockback: 60, desc: '远程狙击。' },
  { id: 'rocket_wiki', name: '火箭炮', category: 'launcher', rarity: 'epic',
    dmg: 14, fireRate: 0.9, energy: 4, spread: 0.03, speed: 380, life: 1.2, size: 7, explodeRadius: 50, knockback: 80, desc: '范围爆炸。' },
  { id: 'laser_wiki', name: '激光枪', category: 'special', rarity: 'rare',
    dmg: 5, fireRate: 0.25, energy: 2, spread: 0.0, speed: 800, life: 0.8, size: 5, knockback: 10, desc: '高速激光。' },
  { id: 'ice_eagle', name: '冰霜之鹰', category: 'gun', rarity: 'epic',
    dmg: 6, fireRate: 0.35, energy: 2, spread: 0.03, speed: 650, life: 0.9, size: 5, element: 'ice', knockback: 30, desc: '冰属性手枪。' },
  { id: 'fire_eagle', name: '火焰之鹰', category: 'gun', rarity: 'epic',
    dmg: 6, fireRate: 0.35, energy: 2, spread: 0.03, speed: 650, life: 0.9, size: 5, element: 'fire', knockback: 30, desc: '火属性手枪。' },
  { id: 'poison_smg', name: '毒气机枪', category: 'smg', rarity: 'rare',
    dmg: 3, fireRate: 0.20, energy: 1, spread: 0.15, speed: 500, life: 0.8, size: 5, element: 'poison', knockback: 20, desc: '毒属性机枪。' },
  { id: 'big_sword', name: '大刀', category: 'melee', rarity: 'epic',
    dmg: 10, fireRate: 0.55, energy: 0, pattern: 'arc', arc: 1.7, meleeRange: 44, knockback: 70, desc: '沉重的大刀。' },
  { id: 'spear_wiki', name: '长枪', category: 'melee', rarity: 'rare',
    dmg: 7, fireRate: 0.42, energy: 0, pattern: 'arc', arc: 0.9, meleeRange: 52, knockback: 55, desc: '突刺长枪。' },
  { id: 'energy_sword', name: '能量剑', category: 'melee', rarity: 'epic',
    dmg: 9, fireRate: 0.38, energy: 1, pattern: 'arc', arc: 1.4, meleeRange: 40, element: 'lightning', knockback: 50, desc: '充能光刃。', starter: true },
  { id: 'frost_bow', name: '冰霜弓', category: 'bow', rarity: 'epic',
    dmg: 8, fireRate: 0.65, energy: 1, spread: 0.02, speed: 680, life: 1.0, size: 6, element: 'ice', knockback: 35, desc: '冰属性长弓。' },
  { id: 'flame_mg', name: '火焰机枪', category: 'smg', rarity: 'rare',
    dmg: 3, fireRate: 0.16, energy: 1, spread: 0.18, speed: 510, life: 0.8, size: 5, element: 'fire', knockback: 15, desc: '喷火机枪。' },
  { id: 'scatter_gun', name: '散弹枪', category: 'shotgun', rarity: 'rare',
    dmg: 4, fireRate: 0.6, energy: 2, spread: 0.4, speed: 470, life: 0.7, size: 5, count: 6, knockback: 55, desc: '大范围散弹。' },
  { id: 'laser_fish', name: '激光鱼', category: 'special', rarity: 'epic',
    dmg: 6, fireRate: 0.30, energy: 2, spread: 0.0, speed: 850, life: 0.9, size: 5, element: 'lightning', knockback: 20, desc: '会发射激光的鱼。', starter: true },
  { id: 'magic_bow', name: '魔法弓', category: 'bow', rarity: 'rare',
    dmg: 7, fireRate: 0.6, energy: 1, spread: 0.05, speed: 700, life: 1.0, size: 5, element: 'lightning', knockback: 30, desc: '魔法箭矢。', starter: true },
  { id: 'light_sword', name: '光剑', category: 'melee', rarity: 'legend',
    dmg: 12, fireRate: 0.34, energy: 1, pattern: 'arc', arc: 1.5, meleeRange: 44, element: 'lightning', knockback: 65, desc: '传说光剑。', starter: true },
  { id: 'giant_hammer', name: '巨锤', category: 'melee', rarity: 'epic',
    dmg: 13, fireRate: 0.8, energy: 0, pattern: 'arc', arc: 1.9, meleeRange: 46, knockback: 90, desc: '范围巨锤。', starter: true },
  { id: 'frost_sword', name: '冰霜剑', category: 'melee', rarity: 'rare',
    dmg: 7, fireRate: 0.4, energy: 1, pattern: 'arc', arc: 1.4, meleeRange: 38, element: 'ice', knockback: 45, desc: '冰属性长剑。' },
  { id: 'flame_sword', name: '火焰剑', category: 'melee', rarity: 'rare',
    dmg: 8, fireRate: 0.42, energy: 1, pattern: 'arc', arc: 1.4, meleeRange: 38, element: 'fire', knockback: 45, desc: '火属性长剑。' },
  { id: 'poison_fang', name: '毒牙', category: 'melee', rarity: 'rare',
    dmg: 6, fireRate: 0.34, energy: 0, pattern: 'arc', arc: 1.1, meleeRange: 32, element: 'poison', knockback: 30, desc: '淬毒匕首。' },
  { id: 'thunder_sword', name: '雷剑', category: 'melee', rarity: 'epic',
    dmg: 9, fireRate: 0.36, energy: 1, pattern: 'arc', arc: 1.3, meleeRange: 40, element: 'lightning', knockback: 50, desc: '雷属性长剑。' },
  { id: 'light_staff', name: '光之杖', category: 'staff', rarity: 'epic',
    dmg: 8, fireRate: 0.5, energy: 2, spread: 0.02, speed: 600, life: 1.0, size: 6, element: 'lightning', knockback: 25, desc: '圣光法杖。' },
  { id: 'shadow_blade', name: '暗影之刃', category: 'melee', rarity: 'epic',
    dmg: 10, fireRate: 0.32, energy: 1, pattern: 'arc', arc: 1.5, meleeRange: 42, element: 'poison', knockback: 55, desc: '暗影利刃。' },
  { id: 'great_bow', name: '巨弓', category: 'bow', rarity: 'epic',
    dmg: 12, fireRate: 0.9, energy: 1, spread: 0.01, speed: 760, life: 1.2, size: 6, knockback: 60, desc: '强力巨弓。' },
  { id: 'scatter_crossbow', name: '散弹弩', category: 'bow', rarity: 'rare',
    dmg: 4, fireRate: 0.7, energy: 2, spread: 0.35, speed: 560, life: 0.8, size: 5, count: 5, knockback: 40, desc: '散射弩箭。' },
  { id: 'energy_cannon', name: '能量炮', category: 'launcher', rarity: 'epic',
    dmg: 16, fireRate: 1.0, energy: 4, spread: 0.02, speed: 420, life: 1.2, size: 8, explodeRadius: 55, element: 'lightning', knockback: 85, desc: '能量爆炸炮。' },
  { id: 'magic_glove', name: '魔法手套', category: 'special', rarity: 'rare',
    dmg: 5, fireRate: 0.30, energy: 1, spread: 0.1, speed: 520, life: 0.8, size: 6, element: 'fire', knockback: 20, desc: '发射魔法弹。' },
  { id: 'frost_staff', name: '冰霜法杖', category: 'staff', rarity: 'rare',
    dmg: 5, fireRate: 0.5, energy: 1, spread: 0.02, speed: 520, life: 1.0, size: 6, element: 'ice', knockback: 25, desc: '冰霜法杖。' },
  { id: 'poison_staff_wiki', name: '毒液法杖', category: 'staff', rarity: 'rare',
    dmg: 5, fireRate: 0.55, energy: 1, spread: 0.04, speed: 500, life: 1.0, size: 6, element: 'poison', knockback: 20, desc: '毒液法杖。' },
  { id: 'thunder_staff', name: '雷电法杖', category: 'staff', rarity: 'epic',
    dmg: 7, fireRate: 0.5, energy: 2, spread: 0.02, speed: 600, life: 1.0, size: 6, element: 'lightning', knockback: 25, desc: '雷电法杖。' },
  { id: 'light_staff_wiki', name: '光明法杖', category: 'staff', rarity: 'epic',
    dmg: 7, fireRate: 0.48, energy: 2, spread: 0.02, speed: 620, life: 1.0, size: 6, element: 'lightning', knockback: 20, desc: '光明法杖。' },
  { id: 'shadow_staff', name: '暗影法杖', category: 'staff', rarity: 'epic',
    dmg: 8, fireRate: 0.52, energy: 2, spread: 0.03, speed: 560, life: 1.0, size: 6, element: 'poison', knockback: 25, desc: '暗影法杖。' },
  { id: 'double_pistol', name: '双管手枪', category: 'gun', rarity: 'good',
    dmg: 3, fireRate: 0.24, energy: 1, spread: 0.05, speed: 540, life: 0.8, size: 5, count: 2, knockback: 25, desc: '双管齐射。' },
  { id: 'triple_shot', name: '三连发', category: 'gun', rarity: 'rare',
    dmg: 3, fireRate: 0.28, energy: 1, spread: 0.12, speed: 540, life: 0.8, size: 5, count: 3, knockback: 20, desc: '三连发手枪。' },
  { id: 'scatter_mg', name: '散弹机枪', category: 'smg', rarity: 'epic',
    dmg: 3, fireRate: 0.16, energy: 1, spread: 0.26, speed: 510, life: 0.8, size: 5, count: 3, knockback: 20, desc: '散射机枪。' },
  { id: 'laser_sniper', name: '激光狙击', category: 'sniper', rarity: 'epic',
    dmg: 14, fireRate: 0.9, energy: 3, spread: 0.0, speed: 950, life: 1.2, size: 5, element: 'lightning', knockback: 50, desc: '激光狙击枪。' },
  { id: 'frost_rocket', name: '冰霜火箭', category: 'launcher', rarity: 'epic',
    dmg: 14, fireRate: 0.95, energy: 3, spread: 0.02, speed: 400, life: 1.2, size: 7, explodeRadius: 48, element: 'ice', knockback: 70, desc: '冰霜火箭弹。' },
  { id: 'poison_flamer', name: '毒气喷射', category: 'special', rarity: 'rare',
    dmg: 2, fireRate: 0.12, energy: 1, spread: 0.3, speed: 380, life: 0.7, size: 5, element: 'poison', knockback: 10, desc: '毒气喷射器。' },
  { id: 'throwing_knife', name: '飞刀', category: 'special', rarity: 'good',
    dmg: 5, fireRate: 0.32, energy: 0, spread: 0.02, speed: 680, life: 0.8, size: 4, knockback: 20, desc: '投掷飞刀。' },
  { id: 'throwing_axe', name: '飞斧', category: 'special', rarity: 'good',
    dmg: 7, fireRate: 0.5, energy: 0, spread: 0.03, speed: 600, life: 0.9, size: 6, knockback: 35, desc: '投掷飞斧。' },
  { id: 'long_axe', name: '长柄斧', category: 'melee', rarity: 'rare',
    dmg: 9, fireRate: 0.6, energy: 0, pattern: 'arc', arc: 1.8, meleeRange: 42, knockback: 70, desc: '长柄战斧。' },
  { id: 'double_blade', name: '双刃剑', category: 'melee', rarity: 'epic',
    dmg: 8, fireRate: 0.3, energy: 0, pattern: 'arc', arc: 1.6, meleeRange: 38, knockback: 45, desc: '双刃快剑。' },
  { id: 'great_sword', name: '巨剑', category: 'melee', rarity: 'epic',
    dmg: 14, fireRate: 0.75, energy: 0, pattern: 'arc', arc: 1.9, meleeRange: 48, knockback: 85, desc: '重型巨剑。' },
  { id: 'knuckle', name: '拳套', category: 'melee', rarity: 'good',
    dmg: 4, fireRate: 0.22, energy: 0, pattern: 'arc', arc: 1.0, meleeRange: 24, knockback: 25, desc: '近身拳套。' },
  { id: 'boomerang_wiki', name: '回旋镖', category: 'special', rarity: 'rare',
    dmg: 5, fireRate: 0.45, energy: 0, spread: 0.0, speed: 560, life: 1.0, size: 5, bounce: 2, knockback: 20, desc: '回旋镖。' },
  { id: 'magic_sword', name: '魔剑', category: 'melee', rarity: 'epic',
    dmg: 9, fireRate: 0.36, energy: 1, pattern: 'arc', arc: 1.5, meleeRange: 40, element: 'lightning', knockback: 50, desc: '附魔长剑。' },
  { id: 'frost_pistol', name: '冰霜手枪', category: 'gun', rarity: 'rare',
    dmg: 4, fireRate: 0.28, energy: 1, spread: 0.03, speed: 540, life: 0.85, size: 5, element: 'ice', knockback: 25, desc: '冰属性手枪。' },
  { id: 'flame_pistol', name: '火焰手枪', category: 'gun', rarity: 'rare',
    dmg: 4, fireRate: 0.28, energy: 1, spread: 0.03, speed: 540, life: 0.85, size: 5, element: 'fire', knockback: 25, desc: '火属性手枪。' },
  { id: 'poison_pistol', name: '毒液手枪', category: 'gun', rarity: 'rare',
    dmg: 4, fireRate: 0.28, energy: 1, spread: 0.03, speed: 540, life: 0.85, size: 5, element: 'poison', knockback: 25, desc: '毒属性手枪。' },
  { id: 'thunder_pistol', name: '雷电手枪', category: 'gun', rarity: 'rare',
    dmg: 4, fireRate: 0.28, energy: 1, spread: 0.03, speed: 540, life: 0.85, size: 5, element: 'lightning', knockback: 25, desc: '雷属性手枪。' },
  { id: 'holy_pistol', name: '圣光手枪', category: 'gun', rarity: 'epic',
    dmg: 5, fireRate: 0.26, energy: 2, spread: 0.02, speed: 560, life: 0.9, size: 5, element: 'lightning', knockback: 30, desc: '圣光手枪。' },
  { id: 'shadow_pistol', name: '暗影手枪', category: 'gun', rarity: 'epic',
    dmg: 5, fireRate: 0.26, energy: 2, spread: 0.02, speed: 560, life: 0.9, size: 5, element: 'poison', knockback: 30, desc: '暗影手枪。' },
  { id: 'frost_smg', name: '冰霜冲锋枪', category: 'smg', rarity: 'epic',
    dmg: 3, fireRate: 0.16, energy: 1, spread: 0.15, speed: 520, life: 0.8, size: 5, element: 'ice', knockback: 15, desc: '冰霜冲锋枪。' },
  { id: 'flame_shotgun', name: '火焰霰弹枪', category: 'shotgun', rarity: 'epic',
    dmg: 4, fireRate: 0.65, energy: 2, spread: 0.38, speed: 480, life: 0.7, size: 5, count: 6, element: 'fire', knockback: 50, desc: '火焰霰弹。' },
  { id: 'poison_sniper', name: '毒液狙击枪', category: 'sniper', rarity: 'epic',
    dmg: 13, fireRate: 0.9, energy: 3, spread: 0.01, speed: 900, life: 1.2, size: 5, element: 'poison', knockback: 55, desc: '毒液狙击。' },
  { id: 'thunder_launcher', name: '雷电火箭筒', category: 'launcher', rarity: 'legend',
    dmg: 16, fireRate: 1.0, energy: 4, spread: 0.02, speed: 420, life: 1.2, size: 7, explodeRadius: 55, element: 'lightning', knockback: 80, desc: '雷电火箭。' },
  { id: 'frost_longbow', name: '冰霜长弓', category: 'bow', rarity: 'epic',
    dmg: 10, fireRate: 0.8, energy: 1, spread: 0.01, speed: 760, life: 1.1, size: 6, element: 'ice', knockback: 45, desc: '冰霜长弓。' },
  { id: 'flame_longbow', name: '火焰长弓', category: 'bow', rarity: 'epic',
    dmg: 10, fireRate: 0.8, energy: 1, spread: 0.01, speed: 760, life: 1.1, size: 6, element: 'fire', knockback: 45, desc: '火焰长弓。' },
  { id: 'poison_longbow', name: '毒液长弓', category: 'bow', rarity: 'epic',
    dmg: 10, fireRate: 0.8, energy: 1, spread: 0.01, speed: 760, life: 1.1, size: 6, element: 'poison', knockback: 45, desc: '毒液长弓。' },
  { id: 'thunder_longbow', name: '雷电长弓', category: 'bow', rarity: 'epic',
    dmg: 10, fireRate: 0.8, energy: 1, spread: 0.01, speed: 760, life: 1.1, size: 6, element: 'lightning', knockback: 45, desc: '雷电长弓。' },
  { id: 'holy_longbow', name: '圣光长弓', category: 'bow', rarity: 'legend',
    dmg: 12, fireRate: 0.78, energy: 2, spread: 0.01, speed: 780, life: 1.2, size: 6, element: 'lightning', knockback: 50, desc: '圣光长弓。' },
  { id: 'shadow_longbow', name: '暗影长弓', category: 'bow', rarity: 'legend',
    dmg: 12, fireRate: 0.78, energy: 2, spread: 0.01, speed: 780, life: 1.2, size: 6, element: 'poison', knockback: 50, desc: '暗影长弓。' },
  { id: 'frost_cannon', name: '冰霜重炮', category: 'launcher', rarity: 'epic',
    dmg: 15, fireRate: 0.95, energy: 4, spread: 0.02, speed: 400, life: 1.2, size: 8, explodeRadius: 55, element: 'ice', knockback: 80, desc: '冰霜重炮。' },
  { id: 'flame_cannon', name: '火焰重炮', category: 'launcher', rarity: 'epic',
    dmg: 15, fireRate: 0.95, energy: 4, spread: 0.02, speed: 400, life: 1.2, size: 8, explodeRadius: 55, element: 'fire', knockback: 80, desc: '火焰重炮。' },
  { id: 'poison_cannon', name: '毒液重炮', category: 'launcher', rarity: 'epic',
    dmg: 15, fireRate: 0.95, energy: 4, spread: 0.02, speed: 400, life: 1.2, size: 8, explodeRadius: 55, element: 'poison', knockback: 80, desc: '毒液重炮。' },
  { id: 'thunder_cannon', name: '雷电重炮', category: 'launcher', rarity: 'legend',
    dmg: 16, fireRate: 1.0, energy: 5, spread: 0.02, speed: 420, life: 1.2, size: 8, explodeRadius: 60, element: 'lightning', knockback: 90, desc: '雷电重炮。' },
  { id: 'frost_spear', name: '冰霜长矛', category: 'melee', rarity: 'epic',
    dmg: 10, fireRate: 0.45, energy: 1, pattern: 'arc', arc: 1.0, meleeRange: 52, element: 'ice', knockback: 55, desc: '冰霜长矛。' },
  { id: 'flame_spear', name: '火焰长矛', category: 'melee', rarity: 'epic',
    dmg: 10, fireRate: 0.45, energy: 1, pattern: 'arc', arc: 1.0, meleeRange: 52, element: 'fire', knockback: 55, desc: '火焰长矛。' },
  { id: 'poison_spear', name: '毒液长矛', category: 'melee', rarity: 'epic',
    dmg: 10, fireRate: 0.45, energy: 1, pattern: 'arc', arc: 1.0, meleeRange: 52, element: 'poison', knockback: 55, desc: '毒液长矛。' },
  { id: 'thunder_spear', name: '雷电长矛', category: 'melee', rarity: 'epic',
    dmg: 10, fireRate: 0.45, energy: 1, pattern: 'arc', arc: 1.0, meleeRange: 52, element: 'lightning', knockback: 55, desc: '雷电长矛。' },
  { id: 'holy_spear', name: '圣光长矛', category: 'melee', rarity: 'legend',
    dmg: 12, fireRate: 0.42, energy: 2, pattern: 'arc', arc: 1.1, meleeRange: 56, element: 'lightning', knockback: 60, desc: '圣光长矛。' },
  { id: 'shadow_spear', name: '暗影长矛', category: 'melee', rarity: 'legend',
    dmg: 12, fireRate: 0.42, energy: 2, pattern: 'arc', arc: 1.1, meleeRange: 56, element: 'poison', knockback: 60, desc: '暗影长矛。' },
  { id: 'frost_hammer', name: '冰霜战锤', category: 'melee', rarity: 'epic',
    dmg: 13, fireRate: 0.85, energy: 0, pattern: 'arc', arc: 1.9, meleeRange: 46, element: 'ice', knockback: 90, desc: '冰霜战锤。' },
  { id: 'flame_hammer', name: '火焰战锤', category: 'melee', rarity: 'epic',
    dmg: 13, fireRate: 0.85, energy: 0, pattern: 'arc', arc: 1.9, meleeRange: 46, element: 'fire', knockback: 90, desc: '火焰战锤。' },
  { id: 'poison_hammer', name: '毒液战锤', category: 'melee', rarity: 'epic',
    dmg: 13, fireRate: 0.85, energy: 0, pattern: 'arc', arc: 1.9, meleeRange: 46, element: 'poison', knockback: 90, desc: '毒液战锤。' },
  { id: 'thunder_hammer', name: '雷电战锤', category: 'melee', rarity: 'legend',
    dmg: 15, fireRate: 0.9, energy: 1, pattern: 'arc', arc: 2.0, meleeRange: 48, element: 'lightning', knockback: 95, desc: '雷电战锤。' },
  { id: 'frost_dagger', name: '冰霜匕首', category: 'melee', rarity: 'epic',
    dmg: 6, fireRate: 0.3, energy: 0, pattern: 'arc', arc: 1.1, meleeRange: 30, element: 'ice', knockback: 30, desc: '冰霜匕首。' },
  { id: 'flame_dagger', name: '火焰匕首', category: 'melee', rarity: 'epic',
    dmg: 6, fireRate: 0.3, energy: 0, pattern: 'arc', arc: 1.1, meleeRange: 30, element: 'fire', knockback: 30, desc: '火焰匕首。' },
  { id: 'poison_dagger', name: '毒液匕首', category: 'melee', rarity: 'epic',
    dmg: 6, fireRate: 0.3, energy: 0, pattern: 'arc', arc: 1.1, meleeRange: 30, element: 'poison', knockback: 30, desc: '毒液匕首。' },
  { id: 'thunder_dagger', name: '雷电匕首', category: 'melee', rarity: 'epic',
    dmg: 6, fireRate: 0.3, energy: 0, pattern: 'arc', arc: 1.1, meleeRange: 30, element: 'lightning', knockback: 30, desc: '雷电匕首。' },
  { id: 'frost_staff_wiki', name: '冰霜权杖', category: 'staff', rarity: 'epic',
    dmg: 9, fireRate: 0.6, energy: 2, spread: 0.02, speed: 620, life: 1.0, size: 6, element: 'ice', knockback: 30, desc: '冰霜权杖。' },
  { id: 'flame_staff_wiki', name: '火焰权杖', category: 'staff', rarity: 'epic',
    dmg: 9, fireRate: 0.6, energy: 2, spread: 0.02, speed: 620, life: 1.0, size: 6, element: 'fire', knockback: 30, desc: '火焰权杖。' },
  { id: 'poison_staff_wiki2', name: '毒液权杖', category: 'staff', rarity: 'epic',
    dmg: 9, fireRate: 0.6, energy: 2, spread: 0.02, speed: 620, life: 1.0, size: 6, element: 'poison', knockback: 30, desc: '毒液权杖。' },
  { id: 'thunder_staff_wiki', name: '雷电权杖', category: 'staff', rarity: 'epic',
    dmg: 9, fireRate: 0.6, energy: 2, spread: 0.02, speed: 620, life: 1.0, size: 6, element: 'lightning', knockback: 30, desc: '雷电权杖。' },
  { id: 'holy_staff_wiki', name: '圣光权杖', category: 'staff', rarity: 'legend',
    dmg: 11, fireRate: 0.58, energy: 3, spread: 0.02, speed: 640, life: 1.1, size: 6, element: 'lightning', knockback: 35, desc: '圣光权杖。' },
  { id: 'shadow_staff_wiki', name: '暗影权杖', category: 'staff', rarity: 'legend',
    dmg: 11, fireRate: 0.58, energy: 3, spread: 0.02, speed: 640, life: 1.1, size: 6, element: 'poison', knockback: 35, desc: '暗影权杖。' },
  { id: 'grenade', name: '手雷', category: 'special', rarity: 'good',
    dmg: 8, fireRate: 0.8, energy: 2, spread: 0.02, speed: 360, life: 0.9, size: 7, explodeRadius: 52, knockback: 60, desc: '投掷手雷。' },
  { id: 'molotov', name: '燃烧瓶', category: 'special', rarity: 'rare',
    dmg: 6, fireRate: 0.7, energy: 2, spread: 0.03, speed: 380, life: 1.0, size: 7, explodeRadius: 58, element: 'fire', knockback: 40, desc: '燃烧瓶。' },
  { id: 'ice_flask', name: '冰冻瓶', category: 'special', rarity: 'rare',
    dmg: 6, fireRate: 0.7, energy: 2, spread: 0.03, speed: 380, life: 1.0, size: 7, explodeRadius: 58, element: 'ice', knockback: 40, desc: '冰冻瓶。' },
  { id: 'flashbang', name: '闪光弹', category: 'special', rarity: 'rare',
    dmg: 4, fireRate: 0.9, energy: 2, spread: 0.02, speed: 420, life: 0.8, size: 6, explodeRadius: 64, element: 'lightning', knockback: 50, desc: '闪光弹。' },
  { id: 'smoke_bomb', name: '烟雾弹', category: 'special', rarity: 'good',
    dmg: 3, fireRate: 1.0, energy: 1, spread: 0.02, speed: 360, life: 0.9, size: 7, explodeRadius: 70, element: 'poison', knockback: 20, desc: '烟雾弹。' },
  { id: 'landmine', name: '地雷', category: 'special', rarity: 'rare',
    dmg: 10, fireRate: 1.2, energy: 2, spread: 0.02, speed: 300, life: 1.0, size: 8, explodeRadius: 56, knockback: 70, desc: '地雷。' },
  { id: 'dynamite', name: '炸药', category: 'special', rarity: 'epic',
    dmg: 12, fireRate: 1.1, energy: 3, spread: 0.02, speed: 340, life: 1.0, size: 8, explodeRadius: 64, element: 'fire', knockback: 80, desc: '炸药。' },
  { id: 'cluster_bomb', name: '集束炸弹', category: 'special', rarity: 'epic',
    dmg: 8, fireRate: 1.0, energy: 3, spread: 0.02, speed: 360, life: 1.0, size: 7, explodeRadius: 60, knockback: 60, desc: '集束炸弹。' },
  { id: 'acid_bomb', name: '酸液炸弹', category: 'special', rarity: 'rare',
    dmg: 7, fireRate: 0.8, energy: 2, spread: 0.03, speed: 380, life: 1.0, size: 7, explodeRadius: 60, element: 'poison', knockback: 45, desc: '酸液炸弹。' },
  { id: 'holy_grenade', name: '圣光手雷', category: 'special', rarity: 'legend',
    dmg: 12, fireRate: 0.9, energy: 3, spread: 0.02, speed: 400, life: 1.0, size: 7, explodeRadius: 62, element: 'lightning', knockback: 65, desc: '圣光手雷。' },
  /* ---------------- 普通（新手武器，前半层就能捡到） ---------------- */
  {
    id: 'pistol', name: '旧式手枪', category: 'gun', rarity: 'common',
    dmg: 3, fireRate: 0.30, energy: 1, spread: 0.03, speed: 520, life: 0.85, size: 5, knockback: 40,
    desc: '冒险者的第一把枪。伤害不高，胜在稳定、省能量。', starter: true
  },
  {
    id: 'rusty_blade', name: '锈蚀短剑', category: 'melee', rarity: 'common',
    dmg: 4, fireRate: 0.42, energy: 0, pattern: 'arc', arc: 1.3, meleeRange: 36, knockback: 55,
    desc: '缺口比刃口还多的旧剑，至少不会卡壳。', starter: true
  },
  {
    id: 'short_bow', name: '短弓', category: 'bow', rarity: 'common',
    dmg: 4, fireRate: 0.55, energy: 1, spread: 0.02, speed: 480, life: 1.0, size: 4, knockback: 35,
    desc: '林间猎户的短弓，安静而可靠。', starter: true
  },
  {
    id: 'apprentice_staff', name: '学徒法杖', category: 'staff', rarity: 'common',
    dmg: 3, fireRate: 0.48, energy: 2, spread: 0.04, speed: 420, life: 1.0, size: 6, knockback: 30,
    desc: '法师学院发给新生的练习杖，法阵还是歪的。', starter: true
  },
  {
    id: 'smg', name: '旧式冲锋枪', category: 'smg', rarity: 'common',
    dmg: 2, fireRate: 0.15, energy: 1, pattern: 'spread', spread: 0.16, speed: 540, life: 0.7, size: 4, knockback: 20,
    desc: '枪管松得能塞下一枚铜板，靠泼弹雨取胜。', starter: true
  },
  {
    id: 'dagger', name: '匕首', category: 'melee', rarity: 'common',
    dmg: 5, fireRate: 0.38, energy: 0, pattern: 'arc', arc: 1.1, meleeRange: 32, knockback: 40,
    desc: '短小、轻快，刺客最熟悉的重量。', starter: true
  },
  {
    id: 'bubble_gun', name: '泡泡枪', category: 'special', rarity: 'common',
    dmg: 2, fireRate: 0.40, energy: 1, spread: 0.10, speed: 300, life: 1.1, size: 6, bounce: 1, knockback: 15,
    desc: '地牢里的玩具。泡泡会在墙上弹一次，伤害低但很烦人。'
  },
  {
    id: 'snowball_gun', name: '雪球枪', category: 'special', rarity: 'common',
    dmg: 3, fireRate: 0.50, energy: 1, spread: 0.05, speed: 360, life: 1.0, size: 5, knockback: 30, element: 'ice',
    desc: '把冰原的雪球塞进枪管，命中会减速。'
  },

  /* ---------------- 精良 ---------------- */
  {
    id: 'revolver', name: '六发左轮', category: 'gun', rarity: 'good',
    dmg: 5, fireRate: 0.42, energy: 1, spread: 0.02, speed: 560, life: 0.9, size: 4, critBonus: 0.05, knockback: 45,
    desc: '牛仔的浪漫。弹仓只有六发，但每一发都很实。'
  },
  {
    id: 'shotgun', name: '铁砂霰弹枪', category: 'shotgun', rarity: 'good',
    dmg: 3, fireRate: 0.66, energy: 2, pattern: 'spread', projectiles: 5, spread: 0.46, speed: 460, life: 0.5, size: 4, knockback: 70,
    desc: '贴身一枪，铁砂糊脸。距离一远就只剩响声。'
  },
  {
    id: 'crossbow', name: '十字弩', category: 'bow', rarity: 'good',
    dmg: 7, fireRate: 0.62, energy: 1, speed: 620, life: 1.0, size: 4, pierce: 1, knockback: 40,
    desc: '弩箭能穿透第一个目标，适合排成一列的敌人。'
  },
  {
    id: 'fire_staff', name: '火焰法杖', category: 'staff', rarity: 'good',
    dmg: 4, fireRate: 0.55, energy: 2, spread: 0.05, speed: 430, life: 1.0, size: 6, element: 'fire',
    desc: '杖顶的余烬永不熄灭，命中会点燃敌人。'
  },
  {
    id: 'uzi', name: '微型冲锋枪', category: 'smg', rarity: 'good',
    dmg: 2, fireRate: 0.12, energy: 1, spread: 0.10, speed: 620, life: 0.7, size: 4,
    desc: '射速快得像缝纫机，代价是能量掉得也快。'
  },
  {
    id: 'rifle', name: '猎枪', category: 'rifle', rarity: 'good',
    dmg: 6, fireRate: 0.70, energy: 2, spread: 0.01, speed: 720, life: 1.1, size: 4, critBonus: 0.05, knockback: 50,
    desc: '打野猪用的长枪，准头比霰弹枪好得多。'
  },
  {
    id: 'coin_gun', name: '金币枪', category: 'special', rarity: 'good',
    dmg: 2, fireRate: 0.35, energy: 1, pattern: 'spread', projectiles: 3, spread: 0.35, speed: 500, life: 0.7, size: 4, bounce: 1, knockback: 10,
    desc: '把金币当子弹打出去。老板说这叫"投资"。'
  },
  {
    id: 'spear', name: '长矛', category: 'melee', rarity: 'good',
    dmg: 6, fireRate: 0.40, energy: 0, pattern: 'arc', arc: 1.5, meleeRange: 44, knockback: 60,
    desc: '一扫一大片，是应付成群史莱姆的利器。'
  },

  /* ---------------- 稀有 ---------------- */
  {
    id: 'assault_rifle', name: '突击步枪', category: 'rifle', rarity: 'rare',
    dmg: 5, fireRate: 0.22, energy: 1, spread: 0.06, speed: 700, life: 0.9, size: 4,
    desc: '标准的制式步枪，射速与伤害的平衡点。'
  },
  {
    id: 'ak47', name: 'AK 步枪', category: 'rifle', rarity: 'rare',
    dmg: 6, fireRate: 0.24, energy: 1, pattern: 'burst', burst: 3, burstGap: 0.08, spread: 0.05, speed: 690, life: 0.95, size: 4,
    desc: '三连点射，压枪压得好就是一条直线。'
  },
  {
    id: 'ice_staff', name: '寒冰法杖', category: 'staff', rarity: 'rare',
    dmg: 5, fireRate: 0.58, energy: 2, spread: 0.04, speed: 430, life: 1.1, size: 6, element: 'ice',
    desc: '命中的敌人会被冻住脚步。'
  },
  {
    id: 'poison_staff', name: '剧毒法杖', category: 'staff', rarity: 'rare',
    dmg: 4, fireRate: 0.50, energy: 2, spread: 0.06, speed: 400, life: 1.2, size: 6, element: 'poison',
    desc: '毒液会在地面留下痕迹，专治抱团的敌人。'
  },
  {
    id: 'compound_bow', name: '复合弓', category: 'bow', rarity: 'rare',
    dmg: 8, fireRate: 0.68, energy: 2, speed: 660, life: 1.05, size: 4, pierce: 1, knockback: 45,
    desc: '滑轮组让拉弓更省力，穿透力也更足。'
  },
  {
    id: 'katana', name: '武士刀', category: 'melee', rarity: 'rare',
    dmg: 8, fireRate: 0.34, energy: 0, pattern: 'arc', arc: 1.7, meleeRange: 40, critBonus: 0.08, knockback: 45,
    desc: '快得只看得见一道白光。'
  },
  {
    id: 'desert_eagle', name: '沙漠之鹰', category: 'gun', rarity: 'rare',
    dmg: 7, fireRate: 0.50, energy: 2, spread: 0.02, speed: 600, life: 0.95, size: 4, critBonus: 0.10, knockback: 60,
    desc: '后坐力大得能震碎手腕，一发顶别人三发。'
  },
  {
    id: 'boomerang', name: '回旋镖', category: 'special', rarity: 'rare',
    dmg: 6, fireRate: 0.55, energy: 1, speed: 420, life: 1.4, size: 5, bounce: 2, knockback: 30,
    desc: '扔出去还会飞回来，能把走廊来回犁两遍。'
  },

  /* ---------------- 史诗 ---------------- */
  {
    id: 'railgun', name: '电磁狙击枪', category: 'sniper', rarity: 'epic',
    dmg: 12, fireRate: 0.95, energy: 4, spread: 0, speed: 950, life: 1.2, size: 5, pierce: 2, critBonus: 0.15, knockback: 70,
    desc: '一枪穿透三个敌人，枪身会发出嗡鸣。'
  },
  {
    id: 'rocket_launcher', name: '火箭筒', category: 'launcher', rarity: 'epic',
    dmg: 8, fireRate: 1.0, energy: 3, spread: 0.02, speed: 420, life: 1.4, size: 7, explodeRadius: 58, knockback: 90,
    desc: '命中后爆炸，请勿在狭小房间内贴脸使用。'
  },
  {
    id: 'knight_sword', name: '骑士长剑', category: 'melee', rarity: 'epic',
    dmg: 10, fireRate: 0.38, energy: 0, pattern: 'arc', arc: 1.9, meleeRange: 44, critBonus: 0.10, knockback: 60,
    desc: '王国骑士团的制式长剑，剑格上刻着誓言。'
  },
  {
    id: 'war_hammer', name: '战锤', category: 'melee', rarity: 'epic',
    dmg: 12, fireRate: 0.62, energy: 0, pattern: 'arc', arc: 1.6, meleeRange: 46, knockback: 110,
    desc: '慢，但砸下去连地板都会裂。'
  },
  {
    id: 'lightning_staff', name: '雷霆法杖', category: 'staff', rarity: 'epic',
    dmg: 6, fireRate: 0.62, energy: 3, spread: 0.05, speed: 460, life: 1.0, size: 6, element: 'lightning', chain: 2,
    desc: '雷电会在敌人之间跳跃，雨天威力更盛。'
  },
  {
    id: 'flamethrower', name: '火焰喷射器', category: 'special', rarity: 'epic',
    dmg: 2, fireRate: 0.12, energy: 1, pattern: 'spread', spread: 0.55, speed: 260, life: 0.35, size: 4, element: 'fire', knockback: 10,
    desc: '短射程、宽扇面，走廊战无解，开阔地要小心。'
  },
  {
    id: 'great_axe', name: '巨斧', category: 'melee', rarity: 'epic',
    dmg: 13, fireRate: 0.68, energy: 0, pattern: 'arc', arc: 2.0, meleeRange: 50, critBonus: 0.05, knockback: 120,
    desc: '斧刃比人还宽，抡起来像一堵移动的墙。'
  },
  {
    id: 'plasma_cannon', name: '等离子炮', category: 'special', rarity: 'epic',
    dmg: 7, fireRate: 0.28, energy: 2, spread: 0.03, speed: 780, life: 0.9, size: 5, pierce: 1,
    desc: '把能量压缩成球发射，能穿透一层薄墙似的敌群。'
  },

  /* ---------------- 传说 ---------------- */
  {
    id: 'minigun', name: '加特林', category: 'smg', rarity: 'legend',
    dmg: 4, fireRate: 0.12, energy: 1, pattern: 'spread', spread: 0.20, speed: 700, life: 0.6, size: 4, knockback: 15,
    desc: '转管一开，整条走廊都是弹壳。'
  },
  {
    id: 'lightsaber', name: '光剑', category: 'melee', rarity: 'legend',
    dmg: 14, fireRate: 0.40, energy: 0, pattern: 'arc', arc: 2.1, meleeRange: 48, element: 'lightning', critBonus: 0.12, knockback: 50,
    desc: '剑刃由纯粹的能量构成，挥舞时有嗡鸣。'
  },
  {
    id: 'sniper', name: '苍穹狙击枪', category: 'sniper', rarity: 'legend',
    dmg: 16, fireRate: 1.05, energy: 4, spread: 0, speed: 1000, life: 1.3, size: 5, pierce: 3, critBonus: 0.20, knockback: 80,
    desc: '一枪贯穿整排敌人，枪声过后才听到回声。'
  },
  {
    id: 'grenade_launcher', name: '榴弹发射器', category: 'launcher', rarity: 'legend',
    dmg: 10, fireRate: 0.90, energy: 3, spread: 0.08, speed: 400, life: 1.5, size: 7, explodeRadius: 64, knockback: 80,
    desc: '抛物线榴弹，落点开花，专治躲在掩体后的家伙。'
  },
  {
    id: 'laser_gun', name: '激光枪', category: 'special', rarity: 'legend',
    dmg: 5, fireRate: 0.45, energy: 3, pattern: 'beam', speed: 900, life: 0.2, size: 4, pierce: 2, knockback: 10,
    desc: '瞬时光束，看到即命中，代价是较高的能量消耗。'
  },
  {
    id: 'long_bow', name: '长弓', category: 'bow', rarity: 'legend',
    dmg: 12, fireRate: 0.72, energy: 3, speed: 760, life: 1.2, size: 4, pierce: 2, critBonus: 0.10, knockback: 55,
    desc: '一人高的硬木长弓，拉满时箭矢能穿透两名敌人。'
  },
  {
    id: 'double_barrel', name: '双管猎枪', category: 'shotgun', rarity: 'legend',
    dmg: 6, fireRate: 0.75, energy: 3, pattern: 'spread', projectiles: 7, spread: 0.52, speed: 480, life: 0.55, size: 4, critBonus: 0.05, knockback: 100,
    desc: '两根枪管一起响，近身几乎没人受得了。'
  },

  /* ---------------- 神话（终局掉落，全层最稀有） ---------------- */
  {
    id: 'sun_blade', name: '太阳神剑', category: 'melee', rarity: 'mythic',
    dmg: 16, fireRate: 0.45, energy: 0, pattern: 'arc', arc: 2.2, meleeRange: 52, element: 'fire', critBonus: 0.15, knockback: 70,
    desc: '剑身如正午烈日，挥砍会点燃整片区域。'
  },
  {
    id: 'void_staff', name: '虚空法杖', category: 'staff', rarity: 'mythic',
    dmg: 10, fireRate: 0.70, energy: 5, spread: 0.06, speed: 480, life: 1.2, size: 7, pierce: 3, element: 'poison', chain: 1, knockback: 40,
    desc: '杖中囚着一小块虚空，命中后毒蚀会继续蔓延。'
  },
  {
    id: 'dragon_launcher', name: '龙息火箭筒', category: 'launcher', rarity: 'mythic',
    dmg: 12, fireRate: 1.10, energy: 5, spread: 0.03, speed: 400, life: 1.5, size: 8, explodeRadius: 74, element: 'fire', knockback: 100,
    desc: '装填的是龙息。爆炸范围内的敌人都会被点燃。'
  },
  {
    id: 'meteor_staff', name: '陨星法杖', category: 'staff', rarity: 'mythic',
    dmg: 9, fireRate: 0.80, energy: 4, pattern: 'spread', projectiles: 3, spread: 0.18, speed: 430, life: 1.1, size: 6, explodeRadius: 42, element: 'fire', knockback: 40,
    desc: '一次召下三颗小陨石，落地即炸。'
  }
]

/* 对外只读数据：id -> 武器对象；顺序表用于图鉴/商店遍历 */
export var WEAPONS = {}
export var WEAPON_ORDER = []

var i
for (i = 0; i < RAW.length; i++) {
  var built = makeWeapon(RAW[i])
  WEAPONS[built.id] = built
  WEAPON_ORDER.push(built.id)
}

export function weaponById(id) {
  if (typeof id !== 'string' || !id) return null
  if (Object.prototype.hasOwnProperty.call(WEAPONS, id)) return WEAPONS[id]
  return null
}

/* 层数钳制到 1..9，非法输入按第 1 层处理 */
function clampFloor(floorIndex) {
  var n = Number(floorIndex)
  if (!isFinite(n)) n = 1
  n = Math.floor(n)
  if (n < 1) n = 1
  if (n > FLOOR_MAX) n = FLOOR_MAX
  return n
}

/* 没有传 rng 时用固定种子兜底，保证"必出"而不是抛错 */
function safeRng(rng) {
  if (typeof rng === 'function') return rng
  return makeRng(20261026)
}

function rarityWeight(rank, floorIndex, boost) {
  var w = RARITY_BASE[rank] + RARITY_FLOOR_STEP[rank] * floorIndex
  if (w < 0.05) w = 0.05
  if (boost > 0) w = w * (1 + boost * rank * 0.4)
  return w
}

function isMeleeWeapon(w) {
  return w.category === 'melee' || w.pattern === 'arc'
}

/*
 * 候选池：按品质 + 排除列表 + 近战过滤。
 * 故意返回数组而不是 null，调用方负责空池回退。
 */
function poolOf(rarity, exclude, meleeOnly) {
  var out = []
  var j
  for (j = 0; j < WEAPON_ORDER.length; j++) {
    var id = WEAPON_ORDER[j]
    var w = WEAPONS[id]
    if (w.rarity !== rarity) continue
    if (meleeOnly && !isMeleeWeapon(w)) continue
    if (exclude.length && exclude.indexOf(id) >= 0) continue
    out.push(id)
  }
  return out
}

/* 放宽品质：任意品质的合法候选 */
function poolAnyWeapon(exclude, meleeOnly) {
  var out = []
  var j
  for (j = 0; j < WEAPON_ORDER.length; j++) {
    var id = WEAPON_ORDER[j]
    var w = WEAPONS[id]
    if (meleeOnly && !isMeleeWeapon(w)) continue
    if (exclude.length && exclude.indexOf(id) >= 0) continue
    out.push(id)
  }
  return out
}

/*
 * 随机武器 id。
 * opts = { rarityBoost?:number, exclude?:string[], meleeOnly?:boolean }
 * 保证一定返回一个存在的武器 id（池子被 exclude 清空时逐步放宽条件）。
 */
export function rollWeapon(rng, floorIndex, opts) {
  var f = clampFloor(floorIndex)
  var o = (opts && typeof opts === 'object') ? opts : {}
  var r = safeRng(rng)
  var exclude = (o.exclude && typeof o.exclude.length === 'number') ? o.exclude : []
  var meleeOnly = !!o.meleeOnly
  var boost = num(o.rarityBoost, 0)
  if (!isFinite(boost) || boost < 0) boost = 0
  if (boost > 3) boost = 3

  var items = []
  var k
  for (k = 0; k < RARITY_ORDER.length; k++) {
    items.push([RARITY_ORDER[k], rarityWeight(k, f, boost)])
  }
  var wanted = weighted(r, items)
  var pool = poolOf(wanted, exclude, meleeOnly)
  if (!pool.length) pool = poolAnyWeapon(exclude, meleeOnly)
  if (!pool.length) pool = poolAnyWeapon([], meleeOnly)
  if (!pool.length) pool = WEAPON_ORDER.slice(0)
  if (!pool.length) return 'pistol'
  var pickIndex = Math.floor(r() * pool.length)
  if (pickIndex < 0) pickIndex = 0
  if (pickIndex >= pool.length) pickIndex = pool.length - 1
  return pool[pickIndex]
}

/*
 * 武器综合强度：用于商店定价 / 图鉴评分 / 掉落价值比较。
 * 只依赖武器自身字段，输入 id 字符串、武器对象或未知值都安全。
 */
export function weaponPower(w) {
  var x = null
  if (typeof w === 'string') {
    x = weaponById(w)
  } else if (w && typeof w === 'object') {
    if (w.id) x = weaponById(w.id)
    if (!x && typeof w.dmg === 'number') x = w
  }
  if (!x) return 0

  var proj = num(x.projectiles, 1)
  if (proj < 1) proj = 1
  var burst = num(x.burst, 1)
  if (burst < 1) burst = 1
  var rate = num(x.fireRate, 0.5)
  if (rate < 0.06) rate = 0.06
  if (rate > 1.5) rate = 1.5

  var dps = num(x.dmg, 0) * proj * burst / rate
  var rank = RARITY[x.rarity] ? RARITY[x.rarity].rank : 0
  var extras = num(x.pierce, 0) * 1.5 +
    num(x.bounce, 0) * 1.2 +
    num(x.chain, 0) * 2 +
    num(x.explodeRadius, 0) * 0.1 +
    num(x.critBonus, 0) * 18 +
    (num(x.arc, 0) > 0 ? 2.5 : 0)
  var penalty = num(x.energy, 0) * 1.2 + (x.pattern === 'beam' ? 3 : 0)
  var p = dps * 0.55 + rank * 2 + extras - penalty
  p = Math.round(p * 10) / 10
  if (p < 1) p = 1
  return p
}

/*
 * 商店武器货架：count 把不重复的武器 id。
 * count 缺省 3，负数/非法按 3，上限 6（货架放不下更多）。
 */
export function rollShopWeapons(rng, floorIndex, count) {
  var n = Math.floor(Number(count))
  if (!isFinite(n)) n = 3
  if (n < 0) n = 0
  if (n > 6) n = 6
  var out = []
  var r = safeRng(rng)
  var i
  for (i = 0; i < n; i++) {
    var got = ''
    var tries
    for (tries = 0; tries < 8; tries++) {
      var cand = rollWeapon(r, floorIndex, { exclude: out })
      if (cand && out.indexOf(cand) < 0) {
        got = cand
        break
      }
      if (!got) got = cand
    }
    if (!got) got = rollWeapon(r, floorIndex, null)
    out.push(got)
  }
  return out
}
