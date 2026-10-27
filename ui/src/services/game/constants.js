/*
 * 全局常量与数值边界。
 * 所有数值单位：逻辑像素 / 秒（dt 用 ms，内部换算）。
 */

export var TILE = 32
export var DESIGN_W = 960
export var DESIGN_H = 266

export var PLAYER_RADIUS = 11
export var PLAYER_SPEED = 158          /* px/s */
export var PLAYER_IFRAME = 0.6         /* 受击无敌 */
export var ARMOR_REGEN_DELAY = 4.0
export var ARMOR_REGEN_TIME = 2.2
export var ENERGY_REGEN = 2.0          /* 每秒自动回能 */
export var MAGNET_RANGE = 92
export var INTERACT_RANGE = 54

export var RARITY = {
  common:  { id: 'common',  name: '普通', color: '#c8ccd4', rank: 0 },
  good:    { id: 'good',    name: '精良', color: '#7ee787', rank: 1 },
  rare:    { id: 'rare',    name: '稀有', color: '#4fc3f7', rank: 2 },
  epic:    { id: 'epic',    name: '史诗', color: '#d580ff', rank: 3 },
  legend:  { id: 'legend',  name: '传说', color: '#ffd93d', rank: 4 },
  mythic:  { id: 'mythic',  name: '神话', color: '#ff6b35', rank: 5 }
}
export var RARITY_ORDER = ['common', 'good', 'rare', 'epic', 'legend', 'mythic']

export var ELEMENT = {
  fire:     { id: 'fire',     name: '火', color: '#ff6b35' },
  ice:      { id: 'ice',      name: '冰', color: '#b3ecff' },
  poison:   { id: 'poison',   name: '毒', color: '#7ee787' },
  lightning:{ id: 'lightning',name: '雷', color: '#ffe066' }
}

/* 章节：4 大关，每大关 5 小关；第 5/10/15/20 层为章节首领 */
export var CHAPTERS = [
  { id: 1, name: '森林遗迹', short: '森林', floors: 5, theme: 'forest',
    enemyPool: ['slime', 'goblin', 'goblin_archer', 'boar', 'treant', 'mushroom_mage'],
    boss: 'goblin_chief', tint: '#1d2b1d',
    scenes: [
      { id: 'forest', name: '森林', theme: 'forest', boss: 'goblin_priest',
        enemyPool: ['goblin_guard', 'goblin_shaman', 'large_goblin', 'boar_wiki', 'liver_persimmon', 'blue_algae'] },
      { id: 'ice', name: '冰原', theme: 'ice', boss: 'snowman_king',
        enemyPool: ['miner', 'small_snow_ape', 'big_snow_ape', 'gold_worm', 'crystal_bug', 'snow_ape_thrower'] },
      { id: 'ruins', name: '遗迹', theme: 'forest', boss: 'golden_monkey_king',
        enemyPool: ['monkey', 'rock_crab', 'arrow_statue', 'guard_statue', 'laser_statue', 'guard_crab'] },
      { id: 'mech_ruins', name: '机械遗迹', theme: 'ice', boss: 'ruin_zulan',
        enemyPool: ['ruin_guard', 'ruin_seeker', 'ruin_defender', 'ancient_gear', 'ruin_trap', 'ruin_portal'] }
    ] },
  { id: 2, name: '沙海地宫', short: '沙漠', floors: 5, theme: 'desert',
    enemyPool: ['scorpion', 'mummy', 'bandit', 'sand_worm', 'fire_imp', 'sand_golem'],
    boss: 'sand_queen', tint: '#2b2418',
    scenes: [
      { id: 'cave', name: '溶洞', theme: 'desert', boss: 'cave_ice_worm', enemyPool: ['work_robot', 'sentry_mech', 'blaster_miner', 'crystal_giant', 'small_crystal_giant', 'ice_worm_larva'] },
      { id: 'swamp', name: '沼泽', theme: 'desert', boss: 'boundless_dark_lord', enemyPool: ['mushroom_child', 'mushroom_man', 'old_god_touch', 'painting_goblin', 'goblin_kin', 'deep_sea_knight'] },
      { id: 'tomb', name: '墓穴', theme: 'desert', boss: 'tomb_beetle_king', enemyPool: ['sacred_beetle', 'tomb_monkey', 'tomb_monkey_leader', 'tomb_skeleton', 'elite_tomb_skeleton'] },
      { id: 'castle', name: '城堡', theme: 'desert', boss: 'great_wizard', enemyPool: ['castle_knight', 'elite_castle_knight', 'castle_wizard', 'large_soldier', 'black_knight', 'castle_turret'] },
      { id: 'underground_castle', name: '地下城堡', theme: 'desert', boss: 'skeleton_king', enemyPool: ['skeleton_soldier', 'elite_skeleton_soldier', 'skeleton_shaman', 'big_skeleton', 'spider', 'poison_spider'] },
      { id: 'witch_forest', name: '女巫森林', theme: 'desert', boss: 'ghost_king', enemyPool: ['pumpkin_man', 'elite_pumpkin_man', 'zombie', 'frog', 'ghost', 'witch'] },
      { id: 'odd_city', name: '奇械城', theme: 'desert', boss: 'mechanical_queen', enemyPool: ['knight_p', 'knight_b', 'knight_s', 'knight_x', 'bishop', 'soldier'] }
    ] },
  { id: 3, name: '霜寒王座', short: '冰原', floors: 5, theme: 'ice',
    enemyPool: ['ice_slime', 'ice_wolf', 'snowman', 'ice_mage', 'frost_spider', 'crystal_golem'],
    boss: 'ice_queen', tint: '#181f2b',
    scenes: [
      { id: 'volcano', name: '火山', theme: 'ice', boss: 'volcano_sandworm', enemyPool: ['mummy_wiki', 'elite_mummy', 'flame_knight', 'flame_great_knight', 'heat_bug', 'volcano_turtle'] },
      { id: 'alien_base', name: '外星基地', theme: 'ice', boss: 'wacken_leader', enemyPool: ['alien', 'ufo', 'wacken_soldier', 'tentacle_monster', 'demon', 'flying_demon'] },
      { id: 'mud_island', name: '泥油海岛', theme: 'ice', boss: 'pirate_king', enemyPool: ['pirate_a', 'pirate_b', 'dancer', 'pirate_c', 'pirate_d', 'laser_crab'] }
    ] },
  { id: 4, name: '暗黑王座', short: '暗黑', floors: 5, theme: 'ice',
    enemyPool: ['ice_slime', 'ice_wolf', 'snowman', 'ice_mage', 'frost_spider', 'crystal_golem'],
    boss: 'dark_knight', tint: '#12101c',
    scenes: [
      { id: 'stone_ruins', name: '巨石山脉遗迹', theme: 'ice', boss: 'stone_ancestor_arm', enemyPool: ['source_stone', 'stone_car', 'stone_man', 'stone_eagle', 'stone_ox', 'stone_horse'] },
      { id: 'ancient_battlefield', name: '古战场', theme: 'ice', boss: 'hua_xiong', enemyPool: ['spearman', 'archer_soldier', 'cavalry', 'fan_soldier', 'mine_soldier', 'net_soldier'] },
      { id: 'seabed', name: '海底', theme: 'ice', boss: 'abyss_navigator', enemyPool: ['parasite_crew', 'kraken_servant', 'test_subject_001', 'test_subject_002', 'test_subject_003', 'test_subject_004'] }
    ] }
]
export var FINAL_BOSS = 'dark_knight'
/* 场景机制（首版）：速度倍率 + 周期性环境伤害 */
export var SCENE_MODS = {
  cave: { label: '冰面', speedMul: 0.88 },
  mud_island: { label: '泥油', speedMul: 0.84 },
  alien_base: { label: '低重力', speedMul: 1.06 },
  volcano: { label: '熔岩', hazardCd: 6, hazardDmg: 1, hazardElement: 'fire' },
  seabed: { label: '缺氧', oxygen: 60, hazardCd: 3, hazardDmg: 1 }
}
export var FLOOR_COUNT = 20

/* 房间类型 */
export var ROOM = {
  start:    { id: 'start',    name: '入口' },
  battle:   { id: 'battle',   name: '战斗' },
  elite:    { id: 'elite',    name: '精英' },
  treasure: { id: 'treasure', name: '宝箱' },
  shop:     { id: 'shop',     name: '商店' },
  statue:   { id: 'statue',   name: '雕像' },
  boss:     { id: 'boss',     name: '首领' }
}

/* 房间瓦片字符。生成器输出字符网格，引擎转成运行时数值网格。 */
export var T = {
  WALL: '#',
  FLOOR: '.',
  PILLAR: 'O',
  CRATE: 'c',
  BARREL: 'b',
  DOOR: 'D',
  SPAWN: 'P',
  ENEMY: 'e',
  ELITE: 'E',
  BOSS: 'B',
  CHEST: 'C',
  GOLD_CHEST: 'G',
  SHOP: 'S',
  STATUE: 'T',
  PORTAL: 'X',
  TORCH: 't'
}

/* 引擎内部瓦片值（0 可走，其余阻挡；>=10 为可交互/装饰标记） */
export var SOLID = {
  0: false,
  1: true,   /* 墙 */
  2: true,   /* 柱子 */
  3: true,   /* 木箱 */
  4: true,   /* 木桶 */
  5: false,  /* 关着的门（动态切换） */
  6: false   /* 装饰 */
}

export var DAMAGE_NUMBER_COLORS = {
  normal: '#ffffff',
  crit: '#ffd93d',
  player: '#ff5a5a',
  heal: '#7ee787',
  energy: '#4dd0e1',
  poison: '#7ee787',
  fire: '#ff9f1c',
  ice: '#b3ecff'
}

/* 结算 */
export var GEM_PER_ROOM = 2
export var GEM_PER_FLOOR = 8
export var GEM_PER_BOSS = 30
export var GEM_PER_WIN = 80
export var START_GEMS = 300

/* 复活费用：5 + 当前层 × 2 */
export function reviveCost(floorIndex) {
  return 5 + Math.max(1, floorIndex || 1) * 2
}

/* 由 data/wiki/chapter1-full.json 生成：第一关维基攻击力（HP 维基未给出） */
export var WIKI_CHAPTER1 = {
  "enemies": {
    "goblin_guard": 4,
    "goblin_shaman": 3,
    "large_goblin": 3,
    "boar_wiki": 2,
    "liver_persimmon": 4,
    "blue_algae": 3,
    "miner": 3,
    "small_snow_ape": 3,
    "big_snow_ape": 3,
    "gold_worm": 2,
    "crystal_bug": 2,
    "snow_ape_thrower": 4,
    "monkey": 3,
    "rock_crab": 2,
    "arrow_statue": 2,
    "guard_statue": 3,
    "laser_statue": 2,
    "guard_crab": 2,
    "ruin_guard": 4,
    "ruin_seeker": 4,
    "ruin_defender": 5,
    "ancient_gear": 2,
    "ruin_trap": 3
  },
  "bosses": {
    "goblin_priest": 5,
    "snowman_king": 3,
    "golden_monkey_king": 3,
    "ruin_zulan": 3
  }
}

/* 由 data/wiki/chapter2-full.json 生成：第二关维基攻击力 */
export var WIKI_CHAPTER2 = {
  "enemies": {
    "work_robot": 3,
    "sentry_mech": 3,
    "blaster_miner": 3,
    "crystal_giant": 3,
    "small_crystal_giant": 3,
    "miner_boss_wiki": 3,
    "ice_worm_larva": 3,
    "mushroom_child": 2,
    "mushroom_man": 2,
    "old_god_touch": 3,
    "painting_goblin": 3,
    "goblin_kin": 4,
    "high_goblin_kin": 3,
    "giant_kin": 3,
    "deep_sea_knight": 3,
    "sacred_beetle": 3,
    "tomb_monkey": 4,
    "tomb_monkey_leader": 3,
    "tomb_skeleton": 5,
    "elite_tomb_skeleton": 4,
    "castle_knight": 4,
    "elite_castle_knight": 4,
    "castle_wizard": 4,
    "large_soldier": 3,
    "slime": 3,
    "black_knight": 4,
    "castle_turret": 5,
    "skeleton_soldier": 5,
    "elite_skeleton_soldier": 5,
    "skeleton_shaman": 3,
    "big_skeleton": 5,
    "spider": 5,
    "poison_spider": 3,
    "skeleton_dog": 3,
    "pumpkin_man": 3,
    "elite_pumpkin_man": 4,
    "zombie": 4,
    "frog": 3,
    "ghost": 3,
    "witch": 3,
    "knight_p": 3,
    "knight_b": 3,
    "knight_s": 4,
    "knight_x": 5,
    "bishop": 2,
    "soldier": 1,
    "castle_enemy": 4
  },
  "bosses": {
    "cave_ice_worm": 5,
    "boundless_dark_lord": 5,
    "tomb_beetle_king": 3,
    "great_wizard": 5,
    "great_knight": 5,
    "dark_great_knight": 5,
    "great_slime": 3,
    "year_beast": 5,
    "mutant_year_beast": 4,
    "skeleton_king": 5,
    "vc_mecha": 5,
    "ghost_king": 5,
    "headless_knight": 5,
    "mechanical_queen": 5,
    "mechanical_emperor": 4
  }
}

/* 由 data/wiki/chapter3/4-full.json 生成：第三/四关维基攻击力 */
export var WIKI_CHAPTER3 = {
  "enemies": {
    "mummy_wiki": 5,
    "elite_mummy": 3,
    "volcano_turtle": 5,
    "flame_great_knight": 4,
    "flame_knight": 4,
    "heat_bug": 3,
    "alien": 5,
    "ufo": 3,
    "wacken_soldier": 4,
    "tentacle_monster": 3,
    "demon": 3,
    "flying_demon": 3,
    "castle_turret": 5,
    "pirate_a": 5,
    "pirate_b": 5,
    "pirate_c": 3,
    "pirate_d": 3,
    "dancer": 2,
    "laser_crab": 4
  },
  "bosses": {
    "volcano_sandworm": 5,
    "anubis": 4,
    "flying_dragon_cub": 4,
    "wacken_leader": 6,
    "colossus_zulan": 5,
    "laser_ufo_boss": 4,
    "pirate_king": 5,
    "steel_wave_breaker": 50
  }
}
export var WIKI_CHAPTER4 = {
  "enemies": {
    "stone_car": 6,
    "stone_man": 4,
    "stone_eagle": 2,
    "stone_ox": 6,
    "stone_horse": 6,
    "spearman": 2,
    "archer_soldier": 3,
    "cavalry": 3,
    "fan_soldier": 3,
    "mine_soldier": 5,
    "net_soldier": 3,
    "kraken_servant": 10,
    "parasite_crew": 3,
    "test_subject_001": 3,
    "test_subject_002": 3,
    "test_subject_003": 4,
    "test_subject_004": 6
  },
  "bosses": {
    "stone_ancestor_arm": 5,
    "stone_fog_dragon": 4,
    "stone_ancestor": 12,
    "hua_xiong": 6,
    "li_jue": 5,
    "dong_zhuo": 10,
    "final_weapon_01": 8,
    "abyss_navigator": 6
  }
}
