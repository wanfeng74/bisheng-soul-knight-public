/*
 * 宠物数据（原创占位）：跟随玩家并自动攻击最近的敌人。
 * 名称/数值后续按维基宠物页校准。
 */
export var PETS = {
  lava_beast: { id: 'lava_beast', name: '熔岩兽', color: '#ff6b4a', dmg: 2, cd: 1.6, range: 300 },
  frost_beast: { id: 'frost_beast', name: '冰霜兽', color: '#9adcff', dmg: 2, cd: 1.5, range: 320 },
  mandrake: { id: 'mandrake', name: '曼陀罗花', color: '#7ee787', dmg: 1, cd: 1.3, range: 280 },
  bat: { id: 'bat', name: '小蝙蝠', color: '#c86bff', dmg: 2, cd: 1.4, range: 260 },
  panda: { id: 'panda', name: '熊猫', color: '#d8d8d8', dmg: 3, cd: 2.0, range: 300 },
  imp: { id: 'imp', name: '小恶魔', color: '#ff5a5a', dmg: 2, cd: 1.5, range: 320 },
  mini_knight: { id: 'mini_knight', name: '小骑士', color: '#9adcff', dmg: 3, cd: 1.8, range: 300 },
  ice_sprite: { id: 'ice_sprite', name: '冰霜精灵', color: '#b3ecff', dmg: 2, cd: 1.4, range: 330 },
  flame_sprite: { id: 'flame_sprite', name: '火焰精灵', color: '#ff9a6b', dmg: 2, cd: 1.4, range: 320 },
  thunder_sprite: { id: 'thunder_sprite', name: '雷电精灵', color: '#ffe066', dmg: 2, cd: 1.3, range: 340 },
  poison_shroom: { id: 'poison_shroom', name: '毒菇', color: '#7ee787', dmg: 2, cd: 1.7, range: 280 },
  star_beast: { id: 'star_beast', name: '星光兽', color: '#d8b4ff', dmg: 3, cd: 1.9, range: 310 },
  fire_wolf: { id: 'fire_wolf', name: '火狼', color: '#ff6b4a', dmg: 3, cd: 1.7, range: 300 },
  ice_fox: { id: 'ice_fox', name: '冰狐', color: '#9adcff', dmg: 3, cd: 1.7, range: 300 },
  thunder_bird: { id: 'thunder_bird', name: '雷鸟', color: '#ffe066', dmg: 3, cd: 1.6, range: 330 },
  poison_toad: { id: 'poison_toad', name: '毒蛙', color: '#7ee787', dmg: 2, cd: 1.8, range: 280 },
  shadow_cat: { id: 'shadow_cat', name: '暗影猫', color: '#a0a0c0', dmg: 3, cd: 1.8, range: 300 },
  holy_dove: { id: 'holy_dove', name: '圣光鸽', color: '#fff2b3', dmg: 3, cd: 1.9, range: 320 }
}

export var PET_ORDER = ['lava_beast', 'frost_beast', 'mandrake', 'bat', 'panda', 'imp',
  'mini_knight', 'ice_sprite', 'flame_sprite', 'thunder_sprite', 'poison_shroom', 'star_beast',
  'fire_wolf', 'ice_fox', 'thunder_bird', 'poison_toad', 'shadow_cat', 'holy_dove']

export function petById(id) {
  if (typeof id !== 'string' || !Object.prototype.hasOwnProperty.call(PETS, id)) return null
  return PETS[id]
}
