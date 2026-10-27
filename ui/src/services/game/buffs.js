/*
 * 天赋（局内成长）数据，33 个，覆盖契约 4.3 列出的全部 effect 类型。
 *
 * 设计原则：
 *   - 数值克制：普通档多为 +12% 或 +1 点；史诗/传说档才给复合加成；
 *   - 每个天赋有 maxStack（1~4 层），三选一时按"已选数量"过滤，不会出现已满层项；
 *   - icon 只用契约 5.5 已确认的 ui_buff_hp / ui_buff_atk / ui_buff_spd 三个 key，
 *     保证美术资源不缺口（引擎缺 key 会画占位方块）。
 *   - 效果类型严格限定在引擎支持的 type 集合内（见下方 EFFECT_TYPES）。
 *
 * 只依赖同目录 constants.js / rng.js。代码风格：ES5。
 */

import { RARITY } from './constants.js'
import { weighted, makeRng } from './rng.js'

/* 引擎可结算的 effect type（与 docs/架构与接口.md 4.3 保持一致，只增不改） */
var EFFECT_TYPES = {
  maxHp: true,
  maxArmor: true,
  maxEnergy: true,
  crit: true,
  damagePct: true,
  fireRatePct: true,
  speedPct: true,
  rangePct: true,
  pierce: true,
  bounce: true,
  element: true,
  lifesteal: true,
  killHeal: true,
  killEnergy: true,
  coinBonusPct: true,
  gemBonusPct: true,
  shopDiscount: true,
  magnet: true,
  skillHastePct: true,
  armorRegenPct: true,
  reviveOnce: true,
  thorns: true
}

/* 稀有度 -> 抽取权重（普通天赋最常见，传说天赋罕见） */
var RARITY_WEIGHT = {
  good: 40,
  rare: 27,
  epic: 15,
  legend: 5
}

var FLOOR_MAX = 20

function effect(type, value) {
  return { type: type, value: value }
}

export var BUFFS = {
  max_hp: {
    id: 'max_hp', name: '生命上限', desc: '生命上限 +1',
    icon: 'ui_buff_hp', rarity: 'good', maxStack: 3,
    effects: [effect('maxHp', 1)]
  },
  max_armor: {
    id: 'max_armor', name: '护甲上限', desc: '护甲上限 +1',
    icon: 'ui_buff_hp', rarity: 'good', maxStack: 3,
    effects: [effect('maxArmor', 1)]
  },
  max_energy: {
    id: 'max_energy', name: '能量上限', desc: '能量上限 +20',
    icon: 'ui_buff_spd', rarity: 'good', maxStack: 3,
    effects: [effect('maxEnergy', 20)]
  },
  eagle_eye: {
    id: 'eagle_eye', name: '鹰眼', desc: '暴击率 +5%',
    icon: 'ui_buff_atk', rarity: 'good', maxStack: 4,
    effects: [effect('crit', 5)]
  },
  power_up: {
    id: 'power_up', name: '力量强化', desc: '造成伤害 +12%',
    icon: 'ui_buff_atk', rarity: 'good', maxStack: 4,
    effects: [effect('damagePct', 0.12)]
  },
  rapid_fire: {
    id: 'rapid_fire', name: '疾速射击', desc: '射速 +12%',
    icon: 'ui_buff_atk', rarity: 'good', maxStack: 4,
    effects: [effect('fireRatePct', 0.12)]
  },
  wind_step: {
    id: 'wind_step', name: '疾风步', desc: '移速 +8%',
    icon: 'ui_buff_spd', rarity: 'good', maxStack: 4,
    effects: [effect('speedPct', 0.08)]
  },
  long_shot: {
    id: 'long_shot', name: '远射', desc: '子弹射程 +15%',
    icon: 'ui_buff_atk', rarity: 'good', maxStack: 3,
    effects: [effect('rangePct', 0.15)]
  },
  piercing_round: {
    id: 'piercing_round', name: '穿透弹', desc: '子弹可多穿透 1 个敌人',
    icon: 'ui_buff_atk', rarity: 'rare', maxStack: 3,
    effects: [effect('pierce', 1)]
  },
  bouncing_round: {
    id: 'bouncing_round', name: '弹射弹', desc: '子弹可多弹射 1 次',
    icon: 'ui_buff_atk', rarity: 'rare', maxStack: 3,
    effects: [effect('bounce', 1)]
  },
  fire_ench: {
    id: 'fire_ench', name: '烈焰附魔', desc: '攻击附带火元素，命中点燃',
    icon: 'ui_buff_atk', rarity: 'rare', maxStack: 1,
    effects: [effect('element', 'fire')]
  },
  ice_ench: {
    id: 'ice_ench', name: '寒霜附魔', desc: '攻击附带冰元素，命中减速',
    icon: 'ui_buff_atk', rarity: 'rare', maxStack: 1,
    effects: [effect('element', 'ice')]
  },
  poison_ench: {
    id: 'poison_ench', name: '剧毒附魔', desc: '攻击附带毒元素，持续掉血',
    icon: 'ui_buff_atk', rarity: 'rare', maxStack: 1,
    effects: [effect('element', 'poison')]
  },
  lightning_ench: {
    id: 'lightning_ench', name: '雷霆附魔', desc: '攻击附带雷元素，可连锁跳跃',
    icon: 'ui_buff_atk', rarity: 'rare', maxStack: 1,
    effects: [effect('element', 'lightning')]
  },
  vampire: {
    id: 'vampire', name: '吸血', desc: '造成伤害时有几率回复 1 点生命',
    icon: 'ui_buff_hp', rarity: 'rare', maxStack: 2,
    effects: [effect('lifesteal', 1)]
  },
  reaper: {
    id: 'reaper', name: '收割', desc: '击杀敌人回复 1 点生命',
    icon: 'ui_buff_hp', rarity: 'good', maxStack: 3,
    effects: [effect('killHeal', 1)]
  },
  soul_energy: {
    id: 'soul_energy', name: '灵魂汲取', desc: '击杀敌人回复 3 点能量',
    icon: 'ui_buff_spd', rarity: 'good', maxStack: 3,
    effects: [effect('killEnergy', 3)]
  },
  greed: {
    id: 'greed', name: '贪婪', desc: '金币获取 +25%',
    icon: 'ui_buff_spd', rarity: 'good', maxStack: 4,
    effects: [effect('coinBonusPct', 0.25)]
  },
  gem_hunter: {
    id: 'gem_hunter', name: '宝石猎手', desc: '宝石获取 +20%',
    icon: 'ui_buff_spd', rarity: 'rare', maxStack: 3,
    effects: [effect('gemBonusPct', 0.2)]
  },
  bargain: {
    id: 'bargain', name: '讨价还价', desc: '商店价格 -15%',
    icon: 'ui_buff_spd', rarity: 'rare', maxStack: 3,
    effects: [effect('shopDiscount', 0.15)]
  },
  magnet: {
    id: 'magnet', name: '磁力吸附', desc: '拾取吸附范围 +40',
    icon: 'ui_buff_spd', rarity: 'good', maxStack: 3,
    effects: [effect('magnet', 40)]
  },
  quick_skill: {
    id: 'quick_skill', name: '技能急速', desc: '技能冷却 -12%',
    icon: 'ui_buff_spd', rarity: 'rare', maxStack: 3,
    effects: [effect('skillHastePct', 0.12)]
  },
  armor_regen: {
    id: 'armor_regen', name: '护甲再生', desc: '护甲回复速度 +25%',
    icon: 'ui_buff_hp', rarity: 'rare', maxStack: 3,
    effects: [effect('armorRegenPct', 0.25)]
  },
  second_life: {
    id: 'second_life', name: '不屈之魂', desc: '本局可免疫一次致命伤害',
    icon: 'ui_buff_hp', rarity: 'legend', maxStack: 1,
    effects: [effect('reviveOnce', true)]
  },
  thorns: {
    id: 'thorns', name: '荆棘之甲', desc: '受近身攻击时反弹 1 点伤害',
    icon: 'ui_buff_hp', rarity: 'rare', maxStack: 3,
    effects: [effect('thorns', 1)]
  },
  berserker: {
    id: 'berserker', name: '狂战士', desc: '伤害 +25%，移速 +6%',
    icon: 'ui_buff_atk', rarity: 'epic', maxStack: 1,
    effects: [effect('damagePct', 0.25), effect('speedPct', 0.06)]
  },
  sniper_instinct: {
    id: 'sniper_instinct', name: '狙击本能', desc: '暴击率 +8%，射程 +20%',
    icon: 'ui_buff_atk', rarity: 'epic', maxStack: 1,
    effects: [effect('crit', 8), effect('rangePct', 0.2)]
  },
  core_reactor: {
    id: 'core_reactor', name: '能量核心', desc: '能量上限 +40，技能冷却 -10%',
    icon: 'ui_buff_spd', rarity: 'epic', maxStack: 1,
    effects: [effect('maxEnergy', 40), effect('skillHastePct', 0.1)]
  },
  bullet_storm: {
    id: 'bullet_storm', name: '弹幕风暴', desc: '射速 +15%，子弹可穿透 1 个敌人',
    icon: 'ui_buff_atk', rarity: 'epic', maxStack: 1,
    effects: [effect('fireRatePct', 0.15), effect('pierce', 1)]
  },
  treasure_seeker: {
    id: 'treasure_seeker', name: '寻宝者', desc: '金币与宝石获取各 +15%',
    icon: 'ui_buff_spd', rarity: 'rare', maxStack: 2,
    effects: [effect('coinBonusPct', 0.15), effect('gemBonusPct', 0.15)]
  },
  survivor: {
    id: 'survivor', name: '幸存者', desc: '生命上限 +2，护甲上限 +1',
    icon: 'ui_buff_hp', rarity: 'legend', maxStack: 1,
    effects: [effect('maxHp', 2), effect('maxArmor', 1)]
  },
  fortress: {
    id: 'fortress', name: '堡垒', desc: '护甲上限 +2，护甲回复速度 +15%',
    icon: 'ui_buff_hp', rarity: 'epic', maxStack: 1,
    effects: [effect('maxArmor', 2), effect('armorRegenPct', 0.15)]
  },
  hunter: {
    id: 'hunter', name: '猎手', desc: '击杀敌人回复 2 点生命与 2 点能量',    icon: 'ui_buff_atk', rarity: 'epic', maxStack: 2,
    effects: [effect('killHeal', 2), effect('killEnergy', 2)]
  },
  crit_pierce: {
    id: 'crit_pierce', name: '暴击穿透', desc: '暴击率 +8%，子弹多穿透 1 个敌人',
    icon: 'ui_buff_atk', rarity: 'rare', maxStack: 2,
    effects: [effect('crit', 8), effect('pierce', 1)]
  },
  element_mastery: {
    id: 'element_mastery', name: '元素精通', desc: '伤害 +10%，攻击附带元素',
    icon: 'ui_buff_atk', rarity: 'epic', maxStack: 2,
    effects: [effect('damagePct', 0.10), effect('element', 'fire')]
  },
  frost_guard: {
    id: 'frost_guard', name: '冰霜护体', desc: '护甲上限 +1，移速 +5%',
    icon: 'ui_buff_spd', rarity: 'rare', maxStack: 2,
    effects: [effect('maxArmor', 1), effect('speedPct', 0.05)]
  },
  melee_reflect: {
    id: 'melee_reflect', name: '近战反弹', desc: '荆棘 +1，伤害 +8%',
    icon: 'ui_buff_atk', rarity: 'epic', maxStack: 2,
    effects: [effect('thorns', 1), effect('damagePct', 0.08)]
  },
  charge_speed: {
    id: 'charge_speed', name: '蓄力加快', desc: '射速 +15%，射程 +10%',
    icon: 'ui_buff_atk', rarity: 'rare', maxStack: 3,
    effects: [effect('fireRatePct', 0.15), effect('rangePct', 0.10)]
  },
  armor_break: {
    id: 'armor_break', name: '破甲冲击', desc: '伤害 +15%，移速 +5%',
    icon: 'ui_buff_atk', rarity: 'epic', maxStack: 2,
    effects: [effect('damagePct', 0.15), effect('speedPct', 0.05)]
  },
  soul_drain: {
    id: 'soul_drain', name: '灵魂汲取', desc: '击杀回复 2 生命与 4 能量',
    icon: 'ui_buff_atk', rarity: 'epic', maxStack: 2,
    effects: [effect('killHeal', 2), effect('killEnergy', 4)]
  },
  treasure_hunter: {
    id: 'treasure_hunter', name: '宝藏猎人', desc: '金币与宝石获取各 +20%',
    icon: 'ui_buff_spd', rarity: 'rare', maxStack: 2,
    effects: [effect('coinBonusPct', 0.20), effect('gemBonusPct', 0.20)]
  },
  absolute_defense: {
    id: 'absolute_defense', name: '绝对防御', desc: '护甲上限 +2，护甲回复 +20%',
    icon: 'ui_buff_hp', rarity: 'epic', maxStack: 2,
    effects: [effect('maxArmor', 2), effect('armorRegenPct', 0.20)]
  },
  bullet_master: {
    id: 'bullet_master', name: '弹幕大师', desc: '射速 +18%，子弹多穿透 1 个',
    icon: 'ui_buff_atk', rarity: 'legend', maxStack: 2,
    effects: [effect('fireRatePct', 0.18), effect('pierce', 1)]
  },
  divine_archer: {
    id: 'divine_archer', name: '神射手', desc: '暴击率 +10%，射程 +20%',
    icon: 'ui_buff_atk', rarity: 'epic', maxStack: 2,
    effects: [effect('crit', 10), effect('rangePct', 0.20)]
  },
  survival_expert: {
    id: 'survival_expert', name: '生存专家', desc: '生命上限 +2，护甲上限 +1',
    icon: 'ui_buff_hp', rarity: 'epic', maxStack: 2,
    effects: [effect('maxHp', 2), effect('maxArmor', 1)]
  },
  elemental_spread: {
    id: 'elemental_spread', name: '元素扩散', desc: '伤害 +8%，攻击附带冰元素',
    icon: 'ui_buff_atk', rarity: 'epic', maxStack: 2,
    effects: [effect('damagePct', 0.08), effect('element', 'ice')]
  },
  crit_energy: {
    id: 'crit_energy', name: '暴击回能', desc: '暴击率 +6%，击杀回复 3 能量',
    icon: 'ui_buff_atk', rarity: 'rare', maxStack: 2,
    effects: [effect('crit', 6), effect('killEnergy', 3)]
  },
  kill_haste: {
    id: 'kill_haste', name: '击杀加速', desc: '击杀回复 1 生命，移速 +6%',
    icon: 'ui_buff_spd', rarity: 'rare', maxStack: 2,
    effects: [effect('killHeal', 1), effect('speedPct', 0.06)]
  },
  shield_thorns: {
    id: 'shield_thorns', name: '护盾反伤', desc: '护甲上限 +1，荆棘 +2',
    icon: 'ui_buff_hp', rarity: 'epic', maxStack: 2,
    effects: [effect('maxArmor', 1), effect('thorns', 2)]
  },
  ammo_recycle: {
    id: 'ammo_recycle', name: '弹药回收', desc: '射速 +10%，子弹多弹射 1 次',
    icon: 'ui_buff_atk', rarity: 'rare', maxStack: 2,
    effects: [effect('fireRatePct', 0.10), effect('bounce', 1)]
  },
  frost_nova: {
    id: 'frost_nova', name: '冰霜新星', desc: '攻击附带冰元素，射程 +10%',
    icon: 'ui_buff_atk', rarity: 'epic', maxStack: 2,
    effects: [effect('element', 'ice'), effect('rangePct', 0.10)]
  },
  flame_storm: {
    id: 'flame_storm', name: '火焰风暴', desc: '伤害 +10%，攻击附带火元素',
    icon: 'ui_buff_atk', rarity: 'epic', maxStack: 2,
    effects: [effect('damagePct', 0.10), effect('element', 'fire')]
  },
  thunder_chain: {
    id: 'thunder_chain', name: '雷电链', desc: '射速 +8%，攻击附带雷元素',
    icon: 'ui_buff_atk', rarity: 'epic', maxStack: 2,
    effects: [effect('fireRatePct', 0.08), effect('element', 'lightning')]
  },
  poison_cloud: {
    id: 'poison_cloud', name: '毒雾', desc: '攻击附带毒元素，伤害 +6%',
    icon: 'ui_buff_atk', rarity: 'rare', maxStack: 2,
    effects: [effect('element', 'poison'), effect('damagePct', 0.06)]
  },
  life_drain: {
    id: 'life_drain', name: '生命汲取', desc: '吸血 +1，击杀回复 1 生命',
    icon: 'ui_buff_atk', rarity: 'epic', maxStack: 2,
    effects: [effect('lifesteal', 1), effect('killHeal', 1)]
  },
  energy_surge: {
    id: 'energy_surge', name: '能量涌动', desc: '能量上限 +30，技能冷却 -8%',
    icon: 'ui_buff_spd', rarity: 'rare', maxStack: 2,
    effects: [effect('maxEnergy', 30), effect('skillHastePct', 0.08)]
  },
  sprint: {
    id: 'sprint', name: '疾跑', desc: '移速 +12%',
    icon: 'ui_buff_spd', rarity: 'good', maxStack: 3,
    effects: [effect('speedPct', 0.12)]
  },
  giant_slayer: {
    id: 'giant_slayer', name: '巨人杀手', desc: '伤害 +15%，暴击率 +5%',
    icon: 'ui_buff_atk', rarity: 'legend', maxStack: 2,
    effects: [effect('damagePct', 0.15), effect('crit', 5)]
  },
  last_stand: {
    id: 'last_stand', name: '背水一战', desc: '生命上限 +1，护甲上限 +1',
    icon: 'ui_buff_hp', rarity: 'epic', maxStack: 2,
    effects: [effect('maxHp', 1), effect('maxArmor', 1)]
  },
  lucky_drop: {
    id: 'lucky_drop', name: '幸运掉落', desc: '金币与宝石获取各 +12%',
    icon: 'ui_buff_spd', rarity: 'rare', maxStack: 2,
    effects: [effect('coinBonusPct', 0.12), effect('gemBonusPct', 0.12)]
  },
  precise_shot: {
    id: 'precise_shot', name: '精准射击', desc: '暴击率 +7%，射程 +10%',
    icon: 'ui_buff_atk', rarity: 'rare', maxStack: 2,
    effects: [effect('crit', 7), effect('rangePct', 0.10)]
  },
  armor_mastery: {
    id: 'armor_mastery', name: '护甲专精', desc: '护甲上限 +1，护甲回复 +15%',
    icon: 'ui_buff_hp', rarity: 'epic', maxStack: 2,
    effects: [effect('maxArmor', 1), effect('armorRegenPct', 0.15)]
  },
  energy_cycle: {
    id: 'energy_cycle', name: '能量循环', desc: '能量上限 +20，技能冷却 -8%',
    icon: 'ui_buff_spd', rarity: 'rare', maxStack: 2,
    effects: [effect('maxEnergy', 20), effect('skillHastePct', 0.08)]
  },
  melee_master: {
    id: 'melee_master', name: '近战大师', desc: '伤害 +12%，移速 +5%',
    icon: 'ui_buff_atk', rarity: 'epic', maxStack: 2,
    effects: [effect('damagePct', 0.12), effect('speedPct', 0.05)]
  },
  gun_master: {
    id: 'gun_master', name: '枪械大师', desc: '射速 +12%，伤害 +6%',
    icon: 'ui_buff_atk', rarity: 'epic', maxStack: 2,
    effects: [effect('fireRatePct', 0.12), effect('damagePct', 0.06)]
  },
  survival_instinct: {
    id: 'survival_instinct', name: '生存本能', desc: '生命上限 +1，击杀回复 1 生命',
    icon: 'ui_buff_hp', rarity: 'rare', maxStack: 2,
    effects: [effect('maxHp', 1), effect('killHeal', 1)]
  },
  element_affinity: {
    id: 'element_affinity', name: '元素亲和', desc: '伤害 +8%，攻击附带火元素',
    icon: 'ui_buff_atk', rarity: 'epic', maxStack: 2,
    effects: [effect('damagePct', 0.08), effect('element', 'fire')]
  },
  cold_blood: {
    id: 'cold_blood', name: '冰冷血脉', desc: '护甲上限 +1，攻击附带冰元素',
    icon: 'ui_buff_hp', rarity: 'epic', maxStack: 2,
    effects: [effect('maxArmor', 1), effect('element', 'ice')]
  },
  toxic_body: {
    id: 'toxic_body', name: '剧毒体质', desc: '生命上限 +1，攻击附带毒元素',
    icon: 'ui_buff_hp', rarity: 'epic', maxStack: 2,
    effects: [effect('maxHp', 1), effect('element', 'poison')]
  },
  thunder_wrath: {
    id: 'thunder_wrath', name: '雷霆之怒', desc: '暴击率 +6%，攻击附带雷元素',
    icon: 'ui_buff_atk', rarity: 'epic', maxStack: 2,
    effects: [effect('crit', 6), effect('element', 'lightning')]
  },
  crit_boost: {
    id: 'crit_boost', name: '暴击强化', desc: '暴击率 +10%',
    icon: 'ui_buff_atk', rarity: 'good', maxStack: 3,
    effects: [effect('crit', 10)]
  },
  fire_rate_boost: {
    id: 'fire_rate_boost', name: '射速强化', desc: '射速 +15%',
    icon: 'ui_buff_atk', rarity: 'good', maxStack: 3,
    effects: [effect('fireRatePct', 0.15)]
  },
  hp_boost: {
    id: 'hp_boost', name: '生命强化', desc: '生命上限 +2',
    icon: 'ui_buff_hp', rarity: 'good', maxStack: 3,
    effects: [effect('maxHp', 2)]
  },
  armor_boost: {
    id: 'armor_boost', name: '护甲强化', desc: '护甲上限 +2',
    icon: 'ui_buff_hp', rarity: 'good', maxStack: 3,
    effects: [effect('maxArmor', 2)]
  },
  energy_boost: {
    id: 'energy_boost', name: '能量强化', desc: '能量上限 +40',
    icon: 'ui_buff_spd', rarity: 'good', maxStack: 3,
    effects: [effect('maxEnergy', 40)]
  },
  speed_boost: {
    id: 'speed_boost', name: '移速强化', desc: '移速 +10%',
    icon: 'ui_buff_spd', rarity: 'good', maxStack: 3,
    effects: [effect('speedPct', 0.10)]
  },
  damage_boost: {
    id: 'damage_boost', name: '伤害强化', desc: '伤害 +15%',
    icon: 'ui_buff_atk', rarity: 'rare', maxStack: 3,
    effects: [effect('damagePct', 0.15)]
  },
  range_boost: {
    id: 'range_boost', name: '范围强化', desc: '射程 +20%',
    icon: 'ui_buff_atk', rarity: 'good', maxStack: 3,
    effects: [effect('rangePct', 0.20)]
  },
  cd_boost: {
    id: 'cd_boost', name: '冷却强化', desc: '技能冷却 -10%',
    icon: 'ui_buff_spd', rarity: 'rare', maxStack: 3,
    effects: [effect('skillHastePct', 0.10)]
  },
  loot_boost: {
    id: 'loot_boost', name: '掉落强化', desc: '金币与宝石获取各 +15%',
    icon: 'ui_buff_spd', rarity: 'rare', maxStack: 2,
    effects: [effect('coinBonusPct', 0.15), effect('gemBonusPct', 0.15)]
  }
}

/* 图鉴/结算展示顺序：按稀有度从低到高 */
export var BUFF_ORDER = [
  'max_hp', 'max_armor', 'max_energy', 'eagle_eye', 'power_up', 'rapid_fire', 'wind_step',
  'long_shot', 'reaper', 'soul_energy', 'greed', 'magnet',
  'piercing_round', 'bouncing_round', 'fire_ench', 'ice_ench', 'poison_ench', 'lightning_ench',
  'vampire', 'gem_hunter', 'bargain', 'quick_skill', 'armor_regen', 'thorns', 'treasure_seeker',
  'berserker', 'sniper_instinct', 'core_reactor', 'bullet_storm', 'fortress', 'hunter',
  'second_life', 'survivor',
  'crit_pierce', 'element_mastery', 'frost_guard', 'melee_reflect', 'charge_speed',
  'armor_break', 'soul_drain', 'treasure_hunter', 'absolute_defense', 'bullet_master',
  'divine_archer', 'survival_expert',
  'elemental_spread', 'crit_energy', 'kill_haste', 'shield_thorns', 'ammo_recycle',
  'frost_nova', 'flame_storm', 'thunder_chain', 'poison_cloud', 'life_drain',
  'energy_surge', 'sprint', 'giant_slayer', 'last_stand', 'lucky_drop',
  'precise_shot', 'armor_mastery', 'energy_cycle', 'melee_master', 'gun_master',
  'survival_instinct', 'element_affinity', 'cold_blood', 'toxic_body', 'thunder_wrath',
  'crit_boost', 'fire_rate_boost', 'hp_boost', 'armor_boost', 'energy_boost',
  'speed_boost', 'damage_boost', 'range_boost', 'cd_boost', 'loot_boost'
]

function num(v, def) {
  if (typeof v === 'number' && isFinite(v)) return v
  return def
}

export function buffById(id) {
  if (typeof id !== 'string' || !id) return null
  if (Object.prototype.hasOwnProperty.call(BUFFS, id)) return BUFFS[id]
  return null
}

function clampFloor(floorIndex) {
  var n = Number(floorIndex)
  if (!isFinite(n)) n = 1
  n = Math.floor(n)
  if (n < 1) n = 1
  if (n > FLOOR_MAX) n = FLOOR_MAX
  return n
}

function safeRng(rng) {
  if (typeof rng === 'function') return rng
  return makeRng(20261027)
}

/* owned 里同一个 id 出现几次就算叠了几层 */
function ownedCount(owned, id) {
  var n = 0
  var k
  for (k = 0; k < owned.length; k++) {
    if (owned[k] === id) n++
  }
  return n
}

/* 深层掉落的史诗/传说天赋权重更高；普通档逐渐变少 */
function buffWeight(buff, floorIndex) {
  var w = num(RARITY_WEIGHT[buff.rarity], 1)
  var rank = RARITY[buff.rarity] ? RARITY[buff.rarity].rank : 1
  var t = (floorIndex - 1) / (FLOOR_MAX - 1)
  w = w * (1 + t * (rank - 1) * 0.35)
  return w
}

/*
 * 三选一天赋：返回 buffId 数组（不重复、不超 maxStack）。
 * owned 为引擎记录的"本局已选天赋 id 列表"（可含重复项）。
 * 池子抽干（全部满层）时返回空数组，不报错。
 */
export function rollBuffs(rng, floorIndex, owned, count) {
  var f = clampFloor(floorIndex)
  var r = safeRng(rng)
  var have = (owned && typeof owned.length === 'number') ? owned : []
  var n = Math.floor(Number(count))
  if (!isFinite(n)) n = 3
  if (n < 0) n = 0
  if (n > 6) n = 6

  var pool = []
  var id
  for (id in BUFFS) {
    if (!Object.prototype.hasOwnProperty.call(BUFFS, id)) continue
    var buff = BUFFS[id]
    var maxStack = num(buff.maxStack, 1)
    if (ownedCount(have, id) >= maxStack) continue
    pool.push([id, buffWeight(buff, f)])
  }

  var out = []
  var k
  for (k = 0; k < n; k++) {
    if (!pool.length) break
    var picked = weighted(r, pool)
    if (!picked) picked = pool[0][0]
    out.push(picked)
    /* 从池中移除已选项，保证一次三选一不重复 */
    var rest = []
    var m
    for (m = 0; m < pool.length; m++) {
      if (pool[m][0] !== picked) rest.push(pool[m])
    }
    pool = rest
  }
  return out
}
