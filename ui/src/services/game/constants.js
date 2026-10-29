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
  cave: { label: '冰面', speedMul: 0.88, hazardType: 'rocks', hazardCd: 7, hazardDmg: 1 },
  mud_island: { label: '泥油', speedMul: 0.84 },
  alien_base: { label: '低重力', speedMul: 1.06 },
  volcano: { label: '熔岩', hazardCd: 6, hazardDmg: 1, hazardElement: 'fire' },
  seabed: { label: '缺氧', oxygen: 60, hazardCd: 3, hazardDmg: 1 },
  swamp: { label: '毒雾', hazardType: 'fog', hazardCd: 6, hazardDmg: 1, hazardElement: 'poison' },
  tomb: { label: '落石', hazardType: 'rocks', hazardCd: 5, hazardDmg: 1 },
  castle: { label: '城防炮', hazardType: 'cannon', hazardCd: 5, hazardDmg: 1 },
  underground_castle: { label: '落石', hazardType: 'rocks', hazardCd: 5, hazardDmg: 1 },
  witch_forest: { label: '毒雾', hazardType: 'fog', hazardCd: 6, hazardDmg: 1, hazardElement: 'poison' },
  odd_city: { label: '激光陷阱', hazardType: 'cannon', hazardCd: 5, hazardDmg: 1, hazardElement: 'lightning' },
  stone_ruins: { label: '落石', hazardType: 'rocks', hazardCd: 6, hazardDmg: 1 },
  ancient_battlefield: { label: '箭雨', hazardType: 'rocks', hazardCd: 6, hazardDmg: 1 }
}
export var FLOOR_COUNT = 20

/* 维基 Boss 红武掉落（DB RedWeapon 精确匹配到现有武器） */
export var WIKI_BOSS_RED = {
  goblin_priest: 'meteor_staff',
  great_knight: 'knight_sword',
  great_slime: 'magic_glove'
}

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

/* 由 data/wiki/characters-full.json 生成：42 角色维基基础数据 */
export var WIKI_CHARACTERS = {
  "knight": {
    "hp": 6,
    "armor": 5,
    "energy": 180,
    "crit": 5,
    "hand": 4,
    "wikiSpeed": 6.5,
    "passive": "破甲保护",
    "starterName": "破旧的手枪",
    "skills": [
      "火力全开",
      "全力攻击",
      "混沌打击"
    ]
  },
  "rogue": {
    "hp": 5,
    "armor": 3,
    "energy": 180,
    "crit": 10,
    "hand": 5,
    "wikiSpeed": 6.5,
    "passive": "暴击穿透",
    "starterName": "小明小红",
    "skills": [
      "翻滚",
      "居合斩",
      "地堂刀"
    ]
  },
  "wizard": {
    "hp": 3,
    "armor": 5,
    "energy": 240,
    "crit": 0,
    "hand": 3,
    "wikiSpeed": 6.5,
    "passive": "元素精通",
    "starterName": "法典",
    "skills": [
      "奥术闪电",
      "寒冰穿刺",
      "火焰飓风"
    ]
  },
  "elf": {
    "hp": 5,
    "armor": 4,
    "energy": 180,
    "crit": 5,
    "hand": 4,
    "wikiSpeed": 6.5,
    "passive": "蓄力加快",
    "starterName": "古老的弓",
    "skills": [
      "专注射击",
      "箭雨",
      "守护精灵"
    ]
  },
  "engineer": {
    "hp": 5,
    "armor": 5,
    "energy": 180,
    "crit": 5,
    "hand": 3,
    "wikiSpeed": 6.5,
    "passive": "火盾",
    "starterName": "欠欠时代冲锋枪",
    "skills": [
      "工程炮台",
      "机甲武装",
      "迎击炮台"
    ]
  },
  "assassin": {
    "hp": 4,
    "armor": 4,
    "energy": 180,
    "crit": 10,
    "hand": 5,
    "wikiSpeed": 6.5,
    "passive": "近战反弹",
    "starterName": "血刃",
    "skills": [
      "暗影之刃",
      "分身术",
      "影遁"
    ]
  },
  "alchemist": {
    "hp": 5,
    "armor": 5,
    "energy": 180,
    "crit": 5,
    "hand": 4,
    "wikiSpeed": 6.5,
    "passive": "毒盾",
    "starterName": "休眠的毒泡泡泵",
    "skills": [
      "毒气炸弹",
      "元素药剂",
      "蜜汁饮剂"
    ]
  },
  "paladin": {
    "hp": 1,
    "armor": 8,
    "energy": 120,
    "crit": 0,
    "hand": 4,
    "wikiSpeed": 6.5,
    "passive": "破甲冲击",
    "starterName": "神圣连枷",
    "skills": [
      "能量护盾",
      "神化",
      "爆裂飞盾"
    ]
  },
  "vampire": {
    "hp": 3,
    "armor": 4,
    "energy": 120,
    "crit": 5,
    "hand": 3,
    "wikiSpeed": 6.5,
    "passive": "击败回血",
    "starterName": "鲜血酒杯",
    "skills": [
      "蝙蝠突袭",
      "异界旋涡",
      "不朽之躯"
    ]
  },
  "werewolf": {
    "hp": 11,
    "armor": 1,
    "energy": 120,
    "crit": 5,
    "hand": 5,
    "wikiSpeed": 6.5,
    "passive": "刺盾",
    "starterName": "灼热爪刃",
    "skills": [
      "狂化",
      "嗜血斩击",
      "吞噬"
    ]
  },
  "berserker": {
    "hp": 9,
    "armor": 3,
    "energy": 150,
    "crit": 5,
    "hand": 5,
    "wikiSpeed": 6.5,
    "passive": "攻速加快",
    "starterName": "拳套",
    "skills": [
      "狂暴",
      "散打",
      "跳跃"
    ]
  },
  "robot": {
    "hp": 3,
    "armor": 6,
    "energy": 180,
    "crit": 0,
    "hand": 3,
    "wikiSpeed": 6.5,
    "passive": "激光加粗",
    "starterName": "卫星浮游炮",
    "skills": [
      "电能过载",
      "无人机集群",
      "电磁脉冲"
    ]
  },
  "priest": {
    "hp": 3,
    "armor": 5,
    "energy": 200,
    "crit": 0,
    "hand": 3,
    "wikiSpeed": 6.5,
    "passive": "恢复强化",
    "starterName": "木制十字架",
    "skills": [
      "恢复法阵",
      "祈祷",
      "月影之息"
    ]
  },
  "druid": {
    "hp": 6,
    "armor": 3,
    "energy": 130,
    "crit": 5,
    "hand": 5,
    "wikiSpeed": 6.5,
    "passive": "随从强化",
    "starterName": "嘎嘣脆的骨头",
    "skills": [
      "霜烬狼袭",
      "剧毒藤蔓",
      "召唤巨熊"
    ]
  },
  "trapper": {
    "hp": 5,
    "armor": 5,
    "energy": 200,
    "crit": 0,
    "hand": 4,
    "wikiSpeed": 6,
    "passive": "尸爆",
    "starterName": "勾索枪",
    "skills": [
      "遥控炸弹",
      "大变活人",
      "帽子戏法"
    ]
  },
  "qizong": {
    "hp": 4,
    "armor": 6,
    "energy": 160,
    "crit": 15,
    "hand": 5,
    "wikiSpeed": 6.5,
    "passive": "内劲",
    "starterName": "天地通意拳",
    "skills": [
      "冲脉拳",
      "斗转星移",
      "六脉神剑"
    ]
  },
  "transcendent": {
    "hp": 1,
    "armor": 4,
    "energy": 30,
    "crit": 5,
    "hand": 4,
    "wikiSpeed": 6.5,
    "passive": "维度穿梭",
    "starterName": "次元之握",
    "skills": [
      "维度跃迁",
      "黑洞折射",
      null
    ]
  },
  "time_ninja": {
    "hp": 4,
    "armor": 4,
    "energy": 190,
    "crit": 5,
    "hand": 4,
    "wikiSpeed": 6.5,
    "passive": "天狗倒",
    "starterName": "分子一文字",
    "skills": [
      "时空间手里剑",
      "超时空猎杀",
      null
    ]
  },
  "swordmaster": {
    "hp": 5,
    "armor": 4,
    "energy": 160,
    "crit": 10,
    "hand": 4,
    "wikiSpeed": 6.5,
    "passive": "剑心",
    "starterName": "微风剑",
    "skills": [
      "疾风剑刃",
      "流云飞剑",
      "瞬步剑诀"
    ]
  },
  "gunner": {
    "hp": 5,
    "armor": 5,
    "energy": 180,
    "crit": 5,
    "hand": 5,
    "wikiSpeed": 6.5,
    "passive": "一身是胆",
    "starterName": "龙枪·牙",
    "skills": [
      "斗阵枪术",
      "龙枪圣临",
      "陷阵枪诀"
    ]
  },
  "lord": {
    "hp": 6,
    "armor": 5,
    "energy": 160,
    "crit": 10,
    "hand": 5,
    "wikiSpeed": 6.5,
    "passive": "战意涌动",
    "starterName": "刀盾",
    "skills": [
      "战意风暴",
      "决心猛冲",
      "黑暗领主"
    ]
  },
  "spellblade": {
    "hp": 4,
    "armor": 4,
    "energy": 200,
    "crit": 5,
    "hand": 3,
    "wikiSpeed": 6.5,
    "passive": "静能储蓄",
    "starterName": "驱逐法杖",
    "skills": [
      "能量迸涌",
      "庇护法阵",
      "奥术飞弹"
    ]
  },
  "captain": {
    "hp": 6,
    "armor": 5,
    "energy": 200,
    "crit": 5,
    "hand": 4,
    "wikiSpeed": 6.5,
    "passive": "爆炸狂欢",
    "starterName": "刀与火铳",
    "skills": [
      "炸桶派对",
      "冲啊！逐浪号！",
      null
    ]
  },
  "special_force": {
    "hp": 4,
    "armor": 7,
    "energy": 180,
    "crit": 5,
    "hand": 4,
    "wikiSpeed": 6.5,
    "passive": "特种精通",
    "starterName": "特种作战武器",
    "skills": [
      "特种作战配合",
      null,
      null
    ]
  },
  "doctor": {
    "hp": 4,
    "armor": 4,
    "energy": 180,
    "crit": 10,
    "hand": 4,
    "wikiSpeed": 6.5,
    "passive": "雷暴",
    "starterName": "离子激发枪",
    "skills": [
      "电磁场装置",
      "高能电球",
      "量子跃迁器"
    ]
  },
  "mecha_girl": {
    "hp": 3,
    "armor": 6,
    "energy": 200,
    "crit": 5,
    "hand": 4,
    "wikiSpeed": 6.5,
    "passive": "充能协议",
    "starterName": "极电双星",
    "skills": [
      "虹烬共鸣",
      null,
      null
    ]
  },
  "necromancer": {
    "hp": 3,
    "armor": 5,
    "energy": 240,
    "crit": 0,
    "hand": 4,
    "wikiSpeed": 6.5,
    "passive": "子弹减速",
    "starterName": "瘟疫之杖",
    "skills": [
      "噩梦印记",
      "灾祸之石",
      "亡灵复生"
    ]
  },
  "cook": {
    "hp": 5,
    "armor": 5,
    "energy": 180,
    "crit": 5,
    "hand": 4,
    "wikiSpeed": 6.5,
    "passive": "地牢美食家",
    "starterName": "锅铲",
    "skills": [
      "神秘炖锅",
      null,
      null
    ]
  },
  "sheriff": {
    "hp": 5,
    "armor": 5,
    "energy": 180,
    "crit": 5,
    "hand": 4,
    "wikiSpeed": 6.5,
    "passive": "连击强化",
    "starterName": "罪恶克星",
    "skills": [
      "转枪",
      "赏金标记",
      "空中支援"
    ]
  },
  "taoist": {
    "hp": 4,
    "armor": 4,
    "energy": 180,
    "crit": 5,
    "hand": 4,
    "wikiSpeed": 6.5,
    "passive": "武器浮游",
    "starterName": "道剑",
    "skills": [
      "万剑归宗",
      "乾坤大挪移",
      "御剑术"
    ]
  },
  "suit_prince": {
    "hp": 3,
    "armor": 4,
    "energy": 250,
    "crit": 3,
    "hand": 4,
    "wikiSpeed": 7,
    "passive": "元素扩散",
    "starterName": "塑料粘液枪",
    "skills": [
      "化身！史莱姆王！",
      "进击！水晶王蟹！",
      "降临！紫爵士！"
    ]
  },
  "martialist": {
    "hp": 4,
    "armor": 5,
    "energy": 160,
    "crit": 10,
    "hand": 5,
    "wikiSpeed": 6.5,
    "passive": "格斗之魂",
    "starterName": "斗气拳",
    "skills": [
      "猛虎拳",
      "旋风腿",
      null
    ]
  },
  "bard": {
    "hp": 5,
    "armor": 5,
    "energy": 200,
    "crit": 3,
    "hand": 5,
    "wikiSpeed": 6.5,
    "passive": "落音缤纷",
    "starterName": "森弦",
    "skills": [
      "音律节拍",
      "共振乐章",
      null
    ]
  },
  "marksman": {
    "hp": 5,
    "armor": 4,
    "energy": 200,
    "crit": 5,
    "hand": 4,
    "wikiSpeed": 6.5,
    "passive": "愈战愈勇",
    "starterName": "寒鸦",
    "skills": [
      "枪神降临",
      "狩猎领域",
      null
    ]
  },
  "gun_expert": {
    "hp": 4,
    "armor": 5,
    "energy": 200,
    "crit": 5,
    "hand": 3,
    "wikiSpeed": 6.5,
    "passive": "枪械回响",
    "starterName": "编号041",
    "skills": [
      "火力增援",
      null,
      null
    ]
  },
  "owl": {
    "hp": 6,
    "armor": 3,
    "energy": 180,
    "crit": 5,
    "hand": 4,
    "wikiSpeed": 6.5,
    "passive": "巨枭魔宠",
    "starterName": "平底锅",
    "skills": [
      "斯巴达飞踢",
      null,
      null
    ]
  },
  "elemental": {
    "hp": 3,
    "armor": 4,
    "energy": 300,
    "crit": 5,
    "hand": 4,
    "wikiSpeed": 6.5,
    "passive": "元能掌握",
    "starterName": "元能之相",
    "skills": [
      "元素亲和",
      null,
      null
    ]
  },
  "demon_warlock": {
    "hp": 4,
    "armor": 5,
    "energy": 213,
    "crit": 0,
    "hand": 4,
    "wikiSpeed": 6.5,
    "passive": "噩灵宿主",
    "starterName": "暗星之钥",
    "skills": [
      "阿米的燃烧之躯",
      "协力：艾利欧格",
      "阿蒙的庇护"
    ]
  },
  "miner": {
    "hp": 5,
    "armor": 4,
    "energy": 180,
    "crit": 5,
    "hand": 4,
    "wikiSpeed": 6.5,
    "passive": "金盾",
    "starterName": "铁镐",
    "skills": [
      "地底行动",
      "矿车速递",
      "沙虫来袭"
    ]
  },
  "astrologer": {
    "hp": 3,
    "armor": 5,
    "energy": 180,
    "crit": 0,
    "hand": 4,
    "wikiSpeed": 6.5,
    "passive": "星之咒",
    "starterName": "占星法杖",
    "skills": [
      "骤雨流星",
      "命运之轮",
      null
    ]
  },
  "illusionist": {
    "hp": 5,
    "armor": 5,
    "energy": 180,
    "crit": 5,
    "hand": 4,
    "wikiSpeed": 6.5,
    "passive": "森罗幻象",
    "starterName": "幻影之刃",
    "skills": [
      "戏影剑舞",
      "幻幕戏法",
      null
    ]
  },
  "yinyang": {
    "hp": 5,
    "armor": 5,
    "energy": 180,
    "crit": 5,
    "hand": 4,
    "wikiSpeed": 6.5,
    "passive": "阴阳流转",
    "starterName": "阴阳",
    "skills": [
      "明昼拳",
      null,
      null
    ]
  }
}

/* 由 data/wiki/weapons-full.json 生成：41 把精确匹配武器的维基名/介绍 */
export var WIKI_WEAPON_MATCH = {
  "old_pistol": {
    "name": "破旧的手枪",
    "desc": "常常穿梭于战场，但却从未留名"
  },
  "xiaoming_xiaohong": {
    "name": "小明小红",
    "desc": null
  },
  "codex": {
    "name": "法典",
    "desc": null
  },
  "bow": {
    "name": "弓",
    "desc": "一根弯木棍和一根绳子造就了这把弓"
  },
  "blood_blade": {
    "name": "血刃",
    "desc": null
  },
  "holy_flail": {
    "name": "神圣连枷",
    "desc": null
  },
  "pan": {
    "name": "平底锅",
    "desc": null
  },
  "shotgun_wiki": {
    "name": "霰弹枪",
    "desc": "你们一直说的“喷子”，就是我"
  },
  "rocket_wiki": {
    "name": "火箭炮",
    "desc": null
  },
  "laser_wiki": {
    "name": "激光枪",
    "desc": null
  },
  "ice_eagle": {
    "name": "冰霜之鹰",
    "desc": "感受物美价廉的冰冻"
  },
  "fire_eagle": {
    "name": "火焰之鹰",
    "desc": "燃烧吧！我的斗志"
  },
  "poison_smg": {
    "name": "毒气机枪",
    "desc": "风一般的射速和致命的毒气"
  },
  "big_sword": {
    "name": "大刀",
    "desc": null
  },
  "spear_wiki": {
    "name": "长枪",
    "desc": "你的幸运值会降低"
  },
  "frost_bow": {
    "name": "冰霜弓",
    "desc": "别动，让我给你加个冰buff！"
  },
  "flame_mg": {
    "name": "火焰机枪",
    "desc": "哒哒哒哒～我闻到了烤肉的香味"
  },
  "laser_fish": {
    "name": "激光鱼",
    "desc": "一条有梦想的鱼"
  },
  "magic_bow": {
    "name": "魔法弓",
    "desc": "魔法的力量，在觉醒！"
  },
  "frost_sword": {
    "name": "冰霜剑",
    "desc": null
  },
  "flame_sword": {
    "name": "火焰剑",
    "desc": null
  },
  "thunder_sword": {
    "name": "雷剑",
    "desc": "觉醒吧！雷霆之怒！"
  },
  "light_staff": {
    "name": "光之杖",
    "desc": "曾是卡拉巴克上的路灯"
  },
  "great_bow": {
    "name": "巨弓",
    "desc": null
  },
  "magic_glove": {
    "name": "魔法手套",
    "desc": null
  },
  "double_pistol": {
    "name": "双管手枪",
    "desc": "没中??中了"
  },
  "long_axe": {
    "name": "长柄斧",
    "desc": null
  },
  "double_blade": {
    "name": "双刃剑",
    "desc": null
  },
  "knuckle": {
    "name": "拳套",
    "desc": null
  },
  "boomerang_wiki": {
    "name": "回旋镖",
    "desc": "我一定会回来的！"
  },
  "thunder_hammer": {
    "name": "雷电战锤",
    "desc": "吾即是索尔"
  },
  "bubble_gun": {
    "name": "泡泡枪",
    "desc": "章鱼哥最讨厌的玩意儿"
  },
  "assault_rifle": {
    "name": "突击步枪",
    "desc": "现在，你也是特种部队的一员了"
  },
  "compound_bow": {
    "name": "复合弓",
    "desc": null
  },
  "desert_eagle": {
    "name": "沙漠之鹰",
    "desc": "金次!我要在你脑门上开洞!"
  },
  "boomerang": {
    "name": "回旋镖",
    "desc": "我一定会回来的！"
  },
  "railgun": {
    "name": "电磁狙击枪",
    "desc": "原本是一个普通的狙击枪后来却漏电了……"
  },
  "rocket_launcher": {
    "name": "火箭筒",
    "desc": "世界上没有什么是一发火箭筒解决不了的"
  },
  "great_axe": {
    "name": "巨斧",
    "desc": null
  },
  "minigun": {
    "name": "加特林",
    "desc": "感觉身体被掏空"
  },
  "laser_gun": {
    "name": "激光枪",
    "desc": null
  }
}

/* 由 data/wiki/weapon-aliases.json 生成：15 把高置信别名武器维基名/介绍 */
export var WIKI_WEAPON_ALIAS = {
  "sniper_wiki": {
    "name": "狙击步枪",
    "desc": "不服啊，来来来我们比比伤害"
  },
  "scatter_crossbow": {
    "name": "霰弹弩",
    "desc": null
  },
  "throwing_axe": {
    "name": "投斧",
    "desc": null
  },
  "grenade": {
    "name": "手榴弹",
    "desc": null
  },
  "molotov": {
    "name": "莫洛托夫鸡尾酒",
    "desc": "始于1940"
  },
  "dynamite": {
    "name": "炸药包",
    "desc": null
  },
  "revolver": {
    "name": "左轮手枪",
    "desc": "午时已到岂不美哉"
  },
  "crossbow": {
    "name": "弩",
    "desc": null
  },
  "fire_staff": {
    "name": "火之杖",
    "desc": "看到眼前的情侣，不知为何，手中出现了这把法杖"
  },
  "uzi": {
    "name": "乌兹枪",
    "desc": "哒哒哒的声音停不下来了"
  },
  "coin_gun": {
    "name": "撒币枪",
    "desc": "不好意思，有钱是真的可以为所欲为"
  },
  "ak47": {
    "name": "阿卡47",
    "desc": "不用压枪，稳如杜康"
  },
  "ice_staff": {
    "name": "冰之杖",
    "desc": "请不要舔"
  },
  "lightning_staff": {
    "name": "闪电法杖",
    "desc": "上帝之怒！"
  },
  "meteor_staff": {
    "name": "星陨杖",
    "desc": "不要在意地牢里哪来的陨石！"
  }
}

/* 由 data/wiki/weapons-full.json 生成：56 把已匹配武器的维基面板数值（钳制到引擎范围） */
export var WIKI_WEAPON_STATS = {
  "old_pistol": {
    "dmg": 3,
    "energy": 0,
    "critBonus": 0
  },
  "xiaoming_xiaohong": {
    "dmg": 4,
    "energy": 1,
    "critBonus": 0
  },
  "codex": {
    "dmg": 3,
    "energy": 1,
    "critBonus": 0
  },
  "bow": {
    "energy": 2
  },
  "blood_blade": {
    "dmg": 6,
    "energy": 0,
    "critBonus": 20
  },
  "holy_flail": {
    "energy": 0
  },
  "pan": {
    "dmg": 8,
    "energy": 1,
    "critBonus": 30
  },
  "shotgun_wiki": {
    "dmg": 3,
    "energy": 3,
    "critBonus": 0
  },
  "rocket_wiki": {
    "dmg": 15,
    "energy": 5,
    "critBonus": 0
  },
  "laser_wiki": {
    "dmg": 8,
    "energy": 2,
    "critBonus": 15
  },
  "ice_eagle": {
    "dmg": 4,
    "energy": 1,
    "critBonus": 15
  },
  "fire_eagle": {
    "dmg": 4,
    "energy": 1,
    "critBonus": 25
  },
  "poison_smg": {
    "dmg": 3,
    "energy": 1,
    "critBonus": 6
  },
  "big_sword": {
    "dmg": 12,
    "energy": 0,
    "critBonus": 0
  },
  "spear_wiki": {
    "dmg": 8,
    "energy": 0,
    "critBonus": 25
  },
  "frost_bow": {
    "energy": 3
  },
  "flame_mg": {
    "dmg": 3,
    "energy": 2,
    "critBonus": 6
  },
  "laser_fish": {
    "dmg": 3,
    "energy": 0,
    "critBonus": 0
  },
  "magic_bow": {
    "energy": 6
  },
  "frost_sword": {
    "dmg": 8,
    "energy": 4,
    "critBonus": 20
  },
  "flame_sword": {
    "dmg": 8,
    "energy": 4,
    "critBonus": 30
  },
  "thunder_sword": {
    "dmg": 8,
    "energy": 6,
    "critBonus": 15
  },
  "light_staff": {
    "dmg": 4,
    "energy": 2,
    "critBonus": 0
  },
  "great_bow": {
    "energy": 5
  },
  "magic_glove": {
    "dmg": 3,
    "energy": 4,
    "critBonus": 30
  },
  "double_pistol": {
    "dmg": 3,
    "energy": 2,
    "critBonus": 10
  },
  "long_axe": {
    "dmg": 8,
    "energy": 0,
    "critBonus": 10
  },
  "double_blade": {
    "dmg": 8,
    "energy": 0,
    "critBonus": 8
  },
  "knuckle": {
    "dmg": 5,
    "energy": 0,
    "critBonus": 0
  },
  "boomerang_wiki": {
    "dmg": 6,
    "energy": 3,
    "critBonus": 15
  },
  "thunder_hammer": {
    "dmg": 8,
    "energy": 3,
    "critBonus": 10
  },
  "bubble_gun": {
    "dmg": 2,
    "energy": 4,
    "critBonus": 5
  },
  "assault_rifle": {
    "dmg": 3,
    "energy": 1,
    "critBonus": 10
  },
  "compound_bow": {
    "energy": 2
  },
  "desert_eagle": {
    "dmg": 4,
    "energy": 1,
    "critBonus": 10
  },
  "boomerang": {
    "dmg": 6,
    "energy": 3,
    "critBonus": 15
  },
  "railgun": {
    "dmg": 6,
    "energy": 4,
    "critBonus": 30
  },
  "rocket_launcher": {
    "dmg": 8,
    "energy": 4,
    "critBonus": 0
  },
  "great_axe": {
    "energy": 0
  },
  "minigun": {
    "dmg": 2,
    "energy": 2,
    "critBonus": 0
  },
  "laser_gun": {
    "dmg": 8,
    "energy": 2,
    "critBonus": 15
  },
  "sniper_wiki": {
    "dmg": 10,
    "energy": 3,
    "critBonus": 30
  },
  "scatter_crossbow": {
    "dmg": 6,
    "energy": 3,
    "critBonus": 30
  },
  "throwing_axe": {
    "dmg": 6,
    "energy": 1,
    "critBonus": 14
  },
  "grenade": {
    "dmg": 14,
    "energy": 6,
    "critBonus": 5
  },
  "molotov": {
    "dmg": 2,
    "energy": 6,
    "critBonus": 5
  },
  "dynamite": {
    "dmg": 10,
    "energy": 3,
    "critBonus": 0
  },
  "revolver": {
    "dmg": 8,
    "energy": 3,
    "critBonus": 5
  },
  "crossbow": {
    "dmg": 8,
    "energy": 2,
    "critBonus": 30
  },
  "fire_staff": {
    "dmg": 4,
    "energy": 3,
    "critBonus": 30
  },
  "uzi": {
    "dmg": 2,
    "energy": 0,
    "critBonus": 5
  },
  "coin_gun": {
    "critBonus": 10
  },
  "ak47": {
    "dmg": 3,
    "energy": 1,
    "critBonus": 12
  },
  "ice_staff": {
    "dmg": 4,
    "energy": 4,
    "critBonus": 30
  },
  "lightning_staff": {
    "dmg": 4,
    "energy": 4,
    "critBonus": 10
  },
  "meteor_staff": {
    "dmg": 10,
    "energy": 6,
    "critBonus": 0
  }
}

/* 由 data/wiki/talents-full.json 生成：13 个已匹配天赋的维基名/效果描述 */
export var WIKI_TALENT_NAMES = {
  "max_armor": "坚若磐石",
  "bargain": "通通半价！",
  "bouncing_round": "子弹弹射",
  "gem_hunter": "宝石矿工",
  "quick_skill": "冷却缩减",
  "crit_pierce": "穿心膛线",
  "melee_reflect": "反击之刃",
  "charge_speed": "急速蓄力",
  "life_drain": "生命汲取"
}

/* 由 data/wiki/monsters-db.json 生成：228 条维基 HP/精英HP */
export var WIKI_MONSTER_HP = {
  "slime": {
    "hp": 12,
    "eliteHp": 50
  },
  "boar": {
    "hp": 8,
    "eliteHp": 26
  },
  "mummy": {
    "hp": 16,
    "eliteHp": 40
  },
  "goblin_guard": {
    "hp": 8,
    "eliteHp": 24
  },
  "goblin_shaman": {
    "hp": 15,
    "eliteHp": 45
  },
  "large_goblin": {
    "hp": 40,
    "eliteHp": 120
  },
  "boar_wiki": {
    "hp": 8,
    "eliteHp": 26
  },
  "liver_persimmon": {
    "eliteHp": 40
  },
  "blue_algae": {
    "hp": 8,
    "eliteHp": 44
  },
  "miner": {
    "hp": 8,
    "eliteHp": 32
  },
  "small_snow_ape": {
    "hp": 9,
    "eliteHp": 30
  },
  "big_snow_ape": {
    "hp": 28,
    "eliteHp": 80
  },
  "gold_worm": {
    "hp": 8,
    "eliteHp": 40
  },
  "crystal_bug": {
    "hp": 8,
    "eliteHp": 40
  },
  "snow_ape_thrower": {
    "hp": 18,
    "eliteHp": 60
  },
  "monkey": {
    "hp": 9,
    "eliteHp": 30
  },
  "rock_crab": {
    "hp": 22,
    "eliteHp": 66
  },
  "arrow_statue": {
    "hp": 30,
    "eliteHp": 130
  },
  "guard_statue": {
    "hp": 8,
    "eliteHp": 25
  },
  "laser_statue": {
    "hp": 13,
    "eliteHp": 45
  },
  "guard_crab": {
    "hp": 16,
    "eliteHp": 48
  },
  "ruin_guard": {
    "hp": 8,
    "eliteHp": 32
  },
  "ruin_seeker": {
    "hp": 12,
    "eliteHp": 50
  },
  "ruin_defender": {
    "hp": 25,
    "eliteHp": 32
  },
  "ancient_gear": {
    "hp": 20,
    "eliteHp": 40
  },
  "ruin_trap": {
    "hp": 10,
    "eliteHp": 30
  },
  "work_robot": {
    "hp": 12,
    "eliteHp": 32
  },
  "sentry_mech": {
    "hp": 20,
    "eliteHp": 40
  },
  "blaster_miner": {
    "hp": 12,
    "eliteHp": 32
  },
  "crystal_giant": {
    "hp": 60,
    "eliteHp": 60
  },
  "small_crystal_giant": {
    "hp": 20,
    "eliteHp": 50
  },
  "miner_boss_wiki": {
    "hp": 20,
    "eliteHp": 60
  },
  "ice_worm_larva": {
    "hp": 18,
    "eliteHp": 60
  },
  "mushroom_child": {
    "hp": 9,
    "eliteHp": 50
  },
  "mushroom_man": {
    "hp": 17,
    "eliteHp": 60
  },
  "old_god_touch": {
    "hp": 31,
    "eliteHp": 60
  },
  "painting_goblin": {
    "hp": 24
  },
  "goblin_kin": {
    "hp": 12,
    "eliteHp": 57
  },
  "deep_sea_knight": {
    "hp": 31,
    "eliteHp": 61
  },
  "sacred_beetle": {
    "hp": 17,
    "eliteHp": 41
  },
  "tomb_monkey": {
    "hp": 31,
    "eliteHp": 51
  },
  "tomb_monkey_leader": {
    "hp": 60,
    "eliteHp": 150
  },
  "tomb_skeleton": {
    "hp": 17,
    "eliteHp": 50
  },
  "elite_tomb_skeleton": {
    "hp": 21,
    "eliteHp": 60
  },
  "castle_knight": {
    "hp": 12,
    "eliteHp": 32
  },
  "elite_castle_knight": {
    "hp": 24,
    "eliteHp": 48
  },
  "castle_wizard": {
    "hp": 20,
    "eliteHp": 45
  },
  "large_soldier": {
    "hp": 60,
    "eliteHp": 150
  },
  "black_knight": {
    "hp": 48,
    "eliteHp": 96
  },
  "castle_turret": {
    "hp": 15,
    "eliteHp": 60
  },
  "skeleton_soldier": {
    "hp": 10,
    "eliteHp": 38
  },
  "elite_skeleton_soldier": {
    "hp": 20,
    "eliteHp": 60
  },
  "skeleton_shaman": {
    "hp": 20,
    "eliteHp": 40
  },
  "big_skeleton": {
    "hp": 50,
    "eliteHp": 140
  },
  "spider": {
    "hp": 12,
    "eliteHp": 40
  },
  "poison_spider": {
    "hp": 12,
    "eliteHp": 40
  },
  "pumpkin_man": {
    "hp": 9,
    "eliteHp": 32
  },
  "elite_pumpkin_man": {
    "hp": 22,
    "eliteHp": 50
  },
  "zombie": {
    "hp": 50,
    "eliteHp": 140
  },
  "frog": {
    "hp": 9,
    "eliteHp": 40
  },
  "ghost": {
    "hp": 9,
    "eliteHp": 32
  },
  "witch": {
    "hp": 18,
    "eliteHp": 52
  },
  "knight_p": {
    "hp": 24,
    "eliteHp": 55
  },
  "knight_b": {
    "hp": 20,
    "eliteHp": 45
  },
  "knight_s": {
    "hp": 50,
    "eliteHp": 120
  },
  "knight_x": {
    "hp": 16,
    "eliteHp": 40
  },
  "bishop": {
    "hp": 20,
    "eliteHp": 40
  },
  "soldier": {
    "hp": 12,
    "eliteHp": 35
  },
  "mummy_wiki": {
    "hp": 16,
    "eliteHp": 40
  },
  "elite_mummy": {
    "hp": 25,
    "eliteHp": 60
  },
  "flame_knight": {
    "hp": 36,
    "eliteHp": 80
  },
  "flame_great_knight": {
    "hp": 70,
    "eliteHp": 160
  },
  "heat_bug": {
    "hp": 18,
    "eliteHp": 40
  },
  "volcano_turtle": {
    "hp": 30,
    "eliteHp": 60
  },
  "alien": {
    "hp": 25,
    "eliteHp": 48
  },
  "ufo": {
    "hp": 24,
    "eliteHp": 40
  },
  "wacken_soldier": {
    "hp": 28,
    "eliteHp": 80
  },
  "tentacle_monster": {
    "hp": 40,
    "eliteHp": 80
  },
  "demon": {
    "hp": 20,
    "eliteHp": 32
  },
  "flying_demon": {
    "hp": 20,
    "eliteHp": 40
  },
  "pirate_a": {
    "hp": 24,
    "eliteHp": 52
  },
  "pirate_b": {
    "hp": 40,
    "eliteHp": 80
  },
  "dancer": {
    "hp": 20,
    "eliteHp": 40
  },
  "pirate_c": {
    "hp": 20,
    "eliteHp": 34
  },
  "pirate_d": {
    "hp": 60,
    "eliteHp": 150
  },
  "laser_crab": {
    "hp": 20,
    "eliteHp": 50
  },
  "source_stone": {
    "hp": 16,
    "eliteHp": 16
  },
  "stone_car": {
    "hp": 100,
    "eliteHp": 125
  },
  "stone_man": {
    "hp": 16,
    "eliteHp": 32
  },
  "stone_eagle": {
    "hp": 16,
    "eliteHp": 32
  },
  "stone_ox": {
    "hp": 150,
    "eliteHp": 175
  },
  "stone_horse": {
    "hp": 64,
    "eliteHp": 96
  },
  "spearman": {
    "hp": 14
  },
  "archer_soldier": {
    "hp": 14
  },
  "cavalry": {
    "hp": 40
  },
  "fan_soldier": {
    "hp": 24
  },
  "mine_soldier": {
    "hp": 20
  },
  "net_soldier": {
    "hp": 24
  },
  "parasite_crew": {
    "hp": 40,
    "eliteHp": 75
  },
  "kraken_servant": {
    "hp": 25,
    "eliteHp": 50
  },
  "test_subject_001": {
    "hp": 35,
    "eliteHp": 70
  },
  "test_subject_002": {
    "hp": 75,
    "eliteHp": 85
  },
  "test_subject_003": {
    "hp": 100,
    "eliteHp": 130
  },
  "test_subject_004": {
    "hp": 140,
    "eliteHp": 175
  },
  "goblin_priest": {
    "hp": 600
  },
  "snowman_king": {
    "hp": 600
  },
  "golden_monkey_king": {
    "hp": 795
  },
  "ruin_zulan": {
    "hp": 900
  },
  "cave_ice_worm": {
    "hp": 1035
  },
  "boundless_dark_lord": {
    "hp": 1200
  },
  "tomb_beetle_king": {
    "hp": 900
  },
  "great_wizard": {
    "hp": 750
  },
  "great_knight": {
    "hp": 900
  },
  "skeleton_king": {
    "hp": 900
  },
  "vc_mecha": {
    "hp": 900
  },
  "ghost_king": {
    "hp": 900
  },
  "headless_knight": {
    "hp": 675
  },
  "mechanical_queen": {
    "hp": 1500
  },
  "mechanical_emperor": {
    "hp": 1800
  },
  "volcano_sandworm": {
    "hp": 1200
  },
  "flying_dragon_cub": {
    "hp": 750
  },
  "anubis": {
    "hp": 1230
  },
  "wacken_leader": {
    "hp": 1200
  },
  "colossus_zulan": {
    "hp": 1200
  },
  "laser_ufo_boss": {
    "hp": 1500
  },
  "pirate_king": {
    "hp": 1500
  },
  "steel_wave_breaker": {
    "hp": 3000
  },
  "stone_fog_dragon": {
    "hp": 1800
  },
  "stone_ancestor": {
    "hp": 1800
  },
  "hua_xiong": {
    "hp": 1800
  },
  "li_jue": {
    "hp": 1800
  },
  "dong_zhuo": {
    "hp": 3000
  },
  "final_weapon_01": {
    "hp": 2250
  },
  "abyss_navigator": {
    "hp": 3450
  }
}

/* 由 data/wiki/weapons-full.json 生成：94 个自定义武器重映射到维基真实武器 */
export var WIKI_SKILLS = {
  "knight": [
    {
      "name": "火力全开",
      "desc": "短时间内双持当前武器进行攻击\n击败敌人增加技能持续时间",
      "cooldown": 10
    },
    {
      "name": "全力攻击",
      "desc": "短时间内同时使用身上所有的武器进行攻击\n击败敌人增加技能持续时间",
      "cooldown": 10
    },
    {
      "name": "混沌打击",
      "desc": "短时间内武器命中敌人会触发随机效果\n击败敌人增加技能持续时间",
      "cooldown": 8
    }
  ],
  "rogue": [
    {
      "name": "翻滚",
      "desc": "向前翻滚躲开敌人子弹\n翻滚后1秒内暴击率大幅上升",
      "cooldown": 2.5
    },
    {
      "name": "居合斩",
      "desc": "突进并斩击敌人\n突进期间不会受伤\n初始可使用3次\n可使用次数+1",
      "cooldown": 3
    },
    {
      "name": "地堂刀",
      "desc": "向前滚动冲撞敌人，并在结束时发动斩击\n滚动期间不会受伤\n斩击的范围与冷却时间随滚动时间增加\n斩击暴击时使敌人冻结",
      "cooldown": 12
    }
  ],
  "wizard": [
    {
      "name": "奥术闪电",
      "desc": "释放强力的闪电，对敌人造成伤害、眩晕和感电效果\n闪电会在目标间最多传导4次\n闪电的伤害增加",
      "cooldown": 6
    },
    {
      "name": "寒冰穿刺",
      "desc": "释放冰刺，伤害并冻结敌人\n冰刺可以阻挡子弹\n冰刺的数量增加，增加冰刺存留的时间",
      "cooldown": 6
    },
    {
      "name": "火焰飓风",
      "desc": "释放火焰飓风席卷战场\n火球有概率造成灼烧，可积累6个火球\n提升灼烧概率",
      "cooldown": 4.5
    }
  ],
  "assassin": [
    {
      "name": "暗影之刃",
      "desc": "瞬间加速并进行强力斩击，加速期间不会被击中，若在此期间击败敌人，会重置技能冷却最多4次。斩击命中首领敌人时技能的冷却时间减半。\n斩击伤害提升，每次释放暗影之刃会累计连击次数，根据连击次数提供额外的技能伤害、暴击几率和移动速度加成。",
      "cooldown": 10
    },
    {
      "name": "分身术",
      "desc": "创造一个分身协助战斗，分身会自动释放暗影之刃或者影遁\n增加分身数量上限，分身使用技能的冷却时间减少",
      "cooldown": 9
    },
    {
      "name": "影遁",
      "desc": "我方单位进入影遁状态，并增强一段时间内的攻击\n隐身期间提升移动速度",
      "cooldown": 6
    }
  ],
  "alchemist": [
    {
      "name": "毒气炸弹",
      "desc": "扔出毒气瓶，破碎后造成范围伤害与减速\n毒气会使敌人中毒，持续受到伤害，叠加3层后受到更高伤害并能感染附近敌人\n瓶子数量增加",
      "cooldown": 6
    },
    {
      "name": "元素药剂",
      "desc": "同时投掷毒、火、冰元素瓶。元素瓶命中敌人后爆炸，并生成对应的元素区域。若命中的敌人已处于异常状态，元素瓶会弹跳至范围内最近的另一名敌人。每个元素瓶最多额外弹跳2次。技能初始储存2次。初始储存次数+1。若额外弹跳均命中已处于异常状态的敌人，元素瓶将弹回炼金术士手中，短暂提升移动速度，并返还技能部分冷却时间。",
      "cooldown": 6
    },
    {
      "name": "蜜汁饮剂",
      "desc": "调制一瓶有迷之功效的饮品，饮用后获得短时间的强化效果\n每瓶最多可以添加4种材料\n\n调制时添加材料上限+1",
      "cooldown": 5
    }
  ],
  "engineer": [
    {
      "name": "工程炮台",
      "desc": "放置一座炮台提供火力支援\n最多同时存在3个工程炮台\n炮台会放出导弹，有概率造成灼烧",
      "cooldown": 9
    },
    {
      "name": "机甲武装",
      "desc": "装备一台限时的机甲进行战斗\n机甲的种类与工坊机甲台停放的机甲一致\n增加机甲存在时间",
      "cooldown": 14
    },
    {
      "name": "迎击炮台",
      "desc": "放置一个激光迎击炮台拦截敌方子弹，若范围内无敌方子弹则攻击敌人。\n攻击敌人时，敌人有几率掉落炮台零件。靠近迎击炮台后再次使用技能，可消耗零件为其升级。炮台设有不同升级路线，每升一级均会获得对应能力，并重置持续时间。炮台被摧毁时，将返还部分零件。\n扩大拦截范围，可获得的炮台零件上限提升。",
      "cooldown": 9
    }
  ],
  "vampire": [
    {
      "name": "蝙蝠突袭",
      "desc": "释放大量蝙蝠攻击敌人并吸取血量，若血量满则恢复能量和护甲\n蝙蝠数量提升",
      "cooldown": 8
    },
    {
      "name": "异界旋涡",
      "desc": "创造一个黑洞吸引附近的敌人与敌我双方的子弹，并吸取血量\n增加黑洞存在时间",
      "cooldown": 11
    },
    {
      "name": "不朽之躯",
      "desc": "进入不朽状态，将所受到的伤害转换为血量与能量\n溢出的血量将临时提升血量上限（最多+10）\n状态结束时释放出冲击波反弹伤害并消除子弹",
      "cooldown": 13
    }
  ],
  "paladin": [
    {
      "name": "能量护盾",
      "desc": "开启能量护盾，吸收所有伤害\n吸收的伤害将转化成能量",
      "cooldown": 12
    },
    {
      "name": "神化",
      "desc": "化身为一个具有神圣之力的武士，使用巨剑进行攻击，剑气可以斩灭子弹\n技能持续期间防御力+3",
      "cooldown": 14
    },
    {
      "name": "爆裂飞盾",
      "desc": "举起盾牌替换掉当前武器进行防御，攻击可投掷盾牌痛击敌人，在敌人和自己之间弹射，并发出圣光脉冲攻击敌人，盾牌返回后会恢复自己的护甲与能量\n举盾时，可恢复我方单位的护甲与能量。攻击后，盾牌每次击中敌人或反弹到自己时，下次冷却时间减少，并且圣光脉冲的扩散范围增大。",
      "cooldown": 9.5
    }
  ],
  "elf": [
    {
      "name": "专注射击",
      "desc": "进入瞄准状态并发射魔法箭，可进行手动瞄准射击\n初始可使用三支魔法箭\n瞄准状态下，击败敌人可恢复能量，每击败3个敌人还能恢复1支魔法箭\n每第3支魔法箭会获得强化，伤害更高范围更大\n生成藤蔓阻挡一次伤害\n瞄准状态下击败敌人可刷新藤蔓",
      "cooldown": 6
    },
    {
      "name": "箭雨",
      "desc": "蓄力释放一阵魔法箭雨，对指定区域造成范围伤害，范围随着蓄力程度而扩大\n增加箭雨的数量",
      "cooldown": 9
    },
    {
      "name": "守护精灵",
      "desc": "召唤一个守护精灵协助战斗\n火精灵:释放2个火球攻击敌人\n风精灵：使用风之弓攻击敌人。当角色自身使用弓箭完全蓄力后，射出的箭矢击中敌人附带能量波\n水精灵：每隔一段时间为我方单位恢复护甲和能量\n守护精灵增加出场效果\n火精灵：天降火球并生成火圈\n风精灵：角色自身的移动速度增加，并释放一个龙卷风\n水精灵：释放冲击波推开敌人并消除子弹，为我方恢复血量与能量",
      "cooldown": 6
    }
  ],
  "werewolf": [
    {
      "name": "狂化",
      "desc": "进入狂化状态并利用利爪攻击，血量越低伤害越高\n血量低时变身会恢复血量\n狂化攻击每命中3次将恢复1护甲\n狂化状态下所受伤害降至1/3",
      "cooldown": 12
    },
    {
      "name": "嗜血斩击",
      "desc": "使用利爪进行连续斩击，击中敌人会恢复血量\n初始可斩击4次\n斩击次数+2\n满斩击次数下的攻击能聚拢敌人",
      "cooldown": 2
    },
    {
      "name": "吞噬",
      "desc": "点按技能按钮可以尝试吃掉一个敌人，并恢复血量与能量，未命中时技能冷却更快。长按可以蓄力，吸引正前方的敌人和子弹。吃掉的敌人会储存在狼人的肚子里，点按第二技能按钮可以将其转换为“怪弹”发射。\n消化时获得增益，提升自身体型、血量上限与攻击速度，蓄力吞噬时的范围增加，可叠加。",
      "cooldown": 5.5
    }
  ],
  "priest": [
    {
      "name": "恢复法阵",
      "desc": "原地创造一个法阵，法阵范围内的友方单位将获得恢复光环。恢复光环可为友方单位持续恢复血量，临时提升2点护甲上限，并可在法阵范围外持续一段时间。\n在联机模式中，倒下的队友可在法阵范围内自动复活，复活效果存在一定的冷却时间。\n获得持续恢复护甲的增益",
      "cooldown": 14
    },
    {
      "name": "祈祷",
      "desc": "恢复我方单位的血量与护甲，并短时间内提高移动速度与攻击速度\n效果持续期间防御力+1",
      "cooldown": 14
    },
    {
      "name": "月影之息",
      "desc": "切换暗影或月光形态，持续生成对应法球。\n暗影球：追踪敌人并造成伤害，施加易伤。\n月光球：优先治疗危险友方，恢复生命与护甲；无目标时攻击敌人。\n形态切换：清除当前法球，并将已积累的能量转化为额外法球。\n暗影能量与月光能量兑换额外法球所需的层数降低。",
      "cooldown": 10
    }
  ],
  "druid": [
    {
      "name": "霜烬狼袭",
      "desc": "狼群会协助德鲁伊战斗。释放技能后德鲁伊和狼进入元素爆发状态，狼将恢复血量、体型变大、攻击速度增加，狼的攻击将转化为冰/火元素攻击；德鲁伊的攻击将额外附带冰/火元素伤害\n狼的冰/火攻击触发冻结/灼烧效果时，将额外附带冰圈/爆炸效果",
      "cooldown": 10
    },
    {
      "name": "剧毒藤蔓",
      "desc": "召唤一组藤蔓阻挡敌人子弹并对敌人进行攻击\n藤蔓的攻击将使敌人中毒",
      "cooldown": 12
    },
    {
      "name": "召唤巨熊",
      "desc": "召唤一只巨熊并进入骑乘状态，再次激活后巨熊会独立战斗，攻击造成范围伤害\n巨熊在骑乘状态下会优先承受伤害，血量归零后会自行恢复血量，待血量满后继续战斗\n巨熊在骑乘状态也会攻击",
      "cooldown": 10
    }
  ],
  "robot": [
    {
      "name": "电能过载",
      "desc": "对周围敌人进行持续的电击\n初始可电击2个目标，击败目标会增加技能持续时间\n最多增加20秒\n电击目标数量+2",
      "cooldown": 11
    },
    {
      "name": "无人机集群",
      "desc": "4个无人机会协助机器人进行战斗。\n点按技能键，不同类型的无人机将触发各自的专属效果。在效果释放结束后，将根据玩家点按技能键时持有的主武器类型召唤对应类型的无人机。\n无人机数量+2",
      "cooldown": 8
    },
    {
      "name": "电磁脉冲",
      "desc": "释放电磁脉冲干扰周边区域，造成伤害与眩晕效果，并消灭范围内的子弹\n脉冲共10道，每道单独造成伤害\n扩大干扰范围",
      "cooldown": 4
    }
  ],
  "berserker": [
    {
      "name": "狂暴",
      "desc": "使用当前武器进行一次快速攻击\n提高此次攻击的暴击率，且技能释放期间所受伤害降至1/3",
      "cooldown": 4
    },
    {
      "name": "散打",
      "desc": "短时间内当前武器的攻击会变得分散\n初始分散为3道\n分散数量+1",
      "cooldown": 10
    },
    {
      "name": "跳跃",
      "desc": "跳到空中，落下震击地面，造成范围伤害与眩晕\n跳跃期间不会被击中，可以穿越地形\n初始可跳跃2次\n增加跳跃距离",
      "cooldown": 4
    }
  ],
  "necromancer": [
    {
      "name": "噩梦印记",
      "desc": "标记敌人，击败或对目标造成一定伤害后，会生成一个鬼手协助战斗\n标记的目标防御力-2",
      "cooldown": 6
    },
    {
      "name": "灾祸之石",
      "desc": "召唤灾祸之石从天而降造成范围伤害，落地后留下瘟疫区域与瘟疫蜘蛛，区域内的敌人会染上瘟疫受到持续伤害\n瘟疫蜘蛛不会攻击，死后会产生一个瘟疫区域\n初始拥有3灾祸层数，根据消耗层数增加攻击范围与伤害\n瘟疫中倒下的敌人将转换为骷髅协助战斗",
      "cooldown": 3
    },
    {
      "name": "亡灵复生",
      "desc": "复活并强化敌人为你战斗。\n初始可操控1个敌人\n靠近敌人遗骸时才可以释放，部分特殊敌人无法复活\n怪物操控数量+1",
      "cooldown": 11
    }
  ],
  "sheriff": [
    {
      "name": "转枪",
      "desc": "点按技能键转动和平金鹰装填1枚子弹，至多6枚。点击普攻键发射所有已装填的子弹。\n和平金鹰击败一定数量的敌人时，其攻击力将提升。\n若使用和平金鹰连续击败3名敌人，则进入决斗状态，获得子弹大小、子弹速度和技能冷却时间的增益。\n强化子弹，可以穿透敌人",
      "cooldown": 2
    },
    {
      "name": "赏金标记",
      "desc": "标记敌人，你的攻击会锁定并追踪该目标。\n击败目标后可获得赏金并将标记刷新至新的目标。\n被标记的目标受到攻击的暴击几率翻倍",
      "cooldown": 4
    },
    {
      "name": "空中支援",
      "desc": "呼叫一次空中打击，对指定区域进行轰炸，落下7枚炸弹并造成范围伤害\n轰炸后留下火焰之径",
      "cooldown": 9
    }
  ],
  "taoist": [
    {
      "name": "万剑归宗",
      "desc": "召唤7把飞剑环绕周身，飞剑可以消除子弹\n技能持续期间，自身的攻击将标记敌人\n技能结束时，所有飞剑会飞向敌人造成伤害，并优先攻击被标记的敌人\n召唤的飞剑数量+3\n持有副武器时飞剑可获得其暴击率，暴击时召唤新的飞剑",
      "cooldown": 7
    },
    {
      "name": "乾坤大挪移",
      "desc": "召唤法阵，瞬间击退敌人至法阵外\n法阵会反弹敌方子弹，反弹后的子弹会伤害敌人\n友方单位经过法阵时获得一个随机增益，增益在法阵消失时失效\n友方子弹穿过法阵后，获得子弹大小和伤害的提升",
      "cooldown": 8.5
    },
    {
      "name": "御剑术",
      "desc": "在短时间内御剑飞行\n大幅度提升移动速度且可以穿越地形，飞行期间不会受伤\n会在移动轨迹落下闪电\n雷电有概率造成眩晕",
      "cooldown": 11
    }
  ],
  "transcendent": [
    {
      "name": "维度跃迁",
      "desc": "提升移动速度进入跃迁状态并标记触碰到的敌人，被标记的敌人将触发倒计时，倒计时结束时受到伤害。跃迁期间不会受伤，可以穿越地形。\n战斗期间持续产生维度裂隙，超界者穿越裂隙时回复自身能量，并产生维度裂隙冲击波。\n维度裂隙冲击波触碰敌人时，未被标记的敌人将触发倒计时，已被标记的敌人其倒计时将被缩短。\n若穿越裂隙时处于跃迁状态，则略微延长其持续时间，最多3次。\n对首领敌人造成伤害时将累计攻击次数，在倒计时结束时根据攻击次数结算额外伤害。\n标记效果的倒计时时长减少。技能标记击败怪物，可延长下一次被动免伤时间。",
      "cooldown": 8
    },
    {
      "name": "黑洞折射/黑洞爆裂",
      "desc": "黑洞折射：在原地放置一个黑洞并隐身，隐身期间有概率不受到任何伤害，该技能可储存3次。当自己武器的子弹、激光命中黑洞后，会在其他黑洞中复制并再次发射。场上最多存在3个黑洞，新放置的黑洞将替换最早放置的黑洞。\n黑洞爆裂：引爆场上所有黑洞，对黑洞周围的敌人造成伤害，并使自己进入持续3秒的无敌加速状态。根据引爆的黑洞个数为自己恢复能量。\n黑洞爆裂增强：引爆黑洞恢复的能量提高。",
      "cooldown": 5
    }
  ],
  "elemental": [
    {
      "name": "元素亲和",
      "desc": "拖动技能键可选择一种元素的主动效果释放，释放后进入技能持续期间。\n技能持续期间，对敌人造成不同元素类型的伤害会触发不同的效果：\n冰元素：概率向四周释放雪球，雪球可冰冻敌人。\n毒元素：释放毒雾附着在敌人身上，对敌人造成持续伤害并且可被传播。\n火元素：概率向周围敌人弹射火球，火球可使敌人灼烧。\n雷元素：产生闪电链扩散攻击附近敌人，并使敌人被附加电流效果。\n部分元素效果间会产生交互效果。\n若玩家所持武器无法造成元素类型的伤害，则为其随机附着一种元素。\n击败敌人增加技能持续时间",
      "cooldown": 8
    }
  ],
  "owl": [
    {
      "name": "斯巴达飞踢",
      "desc": "狠狠地把敌人踢飞！若击中墙体或其他敌人，会造成额外的伤害\n飞踢时不会受伤\n被踢飞的敌人碰撞后会被眩晕",
      "cooldown": 2.5
    }
  ],
  "time_ninja": [
    {
      "name": "时空间手里剑",
      "desc": "投掷一枚发射飞针的时空间手里剑，悬停后生成时空停滞区域。手里剑和飞针命中的目标，以及时空停滞区域内的敌人将被大幅降低攻速与移速。经过该区域的敌方子弹也会被减速。在技能结束前再次发动，可冲刺斩击敌人并闪现至手里剑位置。\n攻击敌人可积蓄时空能量，能量满后，强化下一次技能：手里剑和时空停滞区域变大；手里剑和飞针攻击的目标，以及时空停滞区域的敌人，将受到残影攻击；再次释放，冲刺斩击敌人后，留下一道时空裂缝，并在技能结束后引爆。",
      "cooldown": 6
    },
    {
      "name": "超时空猎杀",
      "desc": "超时空忍者遁入超空间，不受任何伤害，持续2.5秒。每次按下技能键，对当前自标发动斩击，最多0.25秒发动一次。\n从超空间脱出时释放分身，每个分身用武器攻击被斩击的目标。",
      "cooldown": 8
    }
  ],
  "special_force": [
    {
      "name": "特种作战配合",
      "desc": "特种骑士部队可以主动撤离并呼唤下一位特种骑士出战。每个特种骑士有各自的技能。红骑士进行冲刺并扔出数把战术飞刀，被战术飞刀标记的敌人受到伤害时，必定暴击并触发一次斩击。蓝骑士可以使接下来的一段时间内，每次攻击都会附带数颗的流星，击杀敌人可以略微延长持续时间，并且这个状态在蓝骑士撤离后可以保留给其他特种骑士。绿骑士跳上绳索扫射敌人，期间无视障碍物并获得攻击速度和移动速度加成。\n每次特种骑士出场时会释放各自的登场技能",
      "cooldown": 9
    }
  ],
  "qizong": [
    {
      "name": "冲脉拳",
      "desc": "蓄力后，沿移动方向进行冲刺拳击，并释放出气功弹攻击敌人。\n一气贯虹：凝气冲脉，化劲为虹。使用天地通意拳攻击2次后释放技能，再使用天地通意拳攻击6次后再次释放技能，可发出气功波，对路径上的敌人造成连续伤害。\n满蓄力下释放多个气功弹。",
      "cooldown": 6
    },
    {
      "name": "斗转星移",
      "desc": "使敌人子弹停留在自身周围环境，一段时间后，释放这些子弹攻击附近的敌人。\n有几率抬起地上的箱子在周身环绕。",
      "cooldown": 16
    },
    {
      "name": "六脉神剑",
      "desc": "气宗将内力注入自身和附近我方角色的武器中，短时间内武器攻击命中敌人将释放气功波。\n技能持续时间内击败敌人恢复护甲。",
      "cooldown": 11
    }
  ],
  "demon_warlock": [
    {
      "name": "阿米的燃烧之躯",
      "desc": "阿米召唤一个持续10秒的火焰光环，进入火焰光环内的敌人会被火焰持续灼烧。火焰光环存在期间内，再次点按技能可牺牲2个小鬼对火焰光环内的敌人造成一次火焰伤害。\n阿米召唤的火焰光环内敌人子弹速度降低，角色移动速度提高",
      "cooldown": 3
    },
    {
      "name": "协力：艾利欧格",
      "desc": "召唤艾利欧格，艾利欧格会附着在恶魔术士背后并协同作战，牺牲小鬼会强化技能效果。\n艾利欧格的协同攻击变为三连击",
      "cooldown": 10
    },
    {
      "name": "阿蒙的庇护",
      "desc": "阿蒙将标记恶魔术士攻击过的敌人，抽取灵魂使其持续受到伤害。释放技能时，阿蒙会消耗所有灵魂为恶魔术士和我方单位提供灵能护盾，免受伤害。牺牲小鬼会向阿蒙提供灵魂。\n阿蒙抽取的灵魂达到上限时，释放技能将恢复血量。",
      "cooldown": 10
    }
  ],
  "miner": [
    {
      "name": "地底行动",
      "desc": "矿工启动钻头潜入地底，在地底潜行一段时间后破土而出，产生震荡波攻击敌人，并留下洞口\n与洞口交互，可以快速移动到另一个洞口\n破土而出时有几率挖出地底的宝藏",
      "cooldown": 8
    },
    {
      "name": "矿车速递",
      "desc": "矿工跳上矿车开始逐渐加速，随着矿车的速度提高而提高护甲恢复速度和防御力。再次按下技能键可以提前跳下矿车。如果矿工在矿车加速到最大速度后才跳车，会立即恢复一半已损失护甲。矿工只能在跳上和跳下矿车时决定或改变矿车当前的移动方向。\n矿工跳上矿车时也会立即恢复一半已损失护甲值",
      "cooldown": 10
    },
    {
      "name": "沙虫来袭",
      "desc": "矿工引导矿石能量呼唤她的沙虫朋友，从矿工身边不断钻出并攻击敌人，沙虫的攻击频率和范围会逐渐提升。矿工可以持续消耗能量来维持技能，直到手动关闭或者能量不足。技能持续期间，沙虫攻击敌人可充能解锁“巨型沙虫来袭”，释放后可持续召唤巨型沙虫，每次释放都会提高巨型沙虫的伤害。巨型沙虫将在短暂延迟后破土而出。若矿工处于其范围内，可借助巨型沙虫的力量飞跃至其他位置，飞跃期间免疫伤害。\n沙虫从地底钻出时有概率带出能量球",
      "cooldown": 6
    }
  ],
  "trapper": [
    {
      "name": "遥控炸弹",
      "desc": "陷阱大师掏出多个炸弹环绕自身，在一定时间内碰到炸弹的敌人会被炸弹黏上。炸弹可以遥控爆炸，也可以等到时间后一起爆炸。\n掏出更多的炸弹",
      "cooldown": 10
    },
    {
      "name": "大变活人",
      "desc": "陷阱大师在当前位置制造一个幻影替身后进入隐身状态。\n幻影替身会用勾索牵引附近的敌人并恢复能量，一段时间后幻影替身会爆炸并消失。\n幻影替身勾索数量增加",
      "cooldown": 5
    },
    {
      "name": "帽子戏法",
      "desc": "陷阱大师丢出帽子，帽子中冲出鸽子，对上方区域内的敌人造成大量伤害。部分鸽子会环绕陷阱大师并攻击敌人，也可以挡住子弹。\n按住技能按键使鸽群进入攻击模式，松开后回到环绕模式。\n“大鸽鸽”到场！",
      "cooldown": 8
    }
  ],
  "suit_prince": [
    {
      "name": "化身！史莱姆王！",
      "desc": "皮套王子化身为史莱姆王！\n化身后体型会变大，在受击时也会触发爆炸并分裂出小史莱姆。\n可使用毒能释放，跃向天空，落地时释放毒圈和子弹。\n当普通攻击时，会使用魔法手套进行攻击。\n加强灼热分裂，会分裂出更多小史莱姆",
      "cooldown": 12
    },
    {
      "name": "进击！水晶王蟹！",
      "desc": "皮套王子化身为水晶王蟹！\n化身后体型会变大，身着寒冰刺盾，不会被冰冻，且受击后会使用晶刺攻击附近敌人，\n可使用零度防御，不动如山，此状态下不会受伤，受到攻击会回复王蟹血量，且逐渐积蓄晶能；防御结束时，根据积蓄的晶能释放晶刺震荡来攻击敌人。\n当普通攻击时，会使用王蟹巨钳进行攻击。\n寒冰刺盾的晶刺触发频率提升且攻击范围增加",
      "cooldown": 12
    },
    {
      "name": "降临！紫爵士！",
      "desc": "皮套王子化身为紫爵士！\n化身后拥有越战越勇状态，造成伤害时短暂提升移速并积累战勇值，但战勇值会持续降低。低战勇时，减免高额伤害。高战勇时提升攻速、伤害与暴击，加快爵士飞跃冷却并免疫控制。可使用爵士飞跃，落地时造成范围伤害，普攻短暂附带弹幕。普通攻击时，使用魂刃进行砍击，高战勇时长按普攻键将掷出魂刃，期间普攻变为铁拳。\n初始战勇值提升。加强爵士飞跃，落地时会附带元素圈，并扩大范围。加强爵士铁拳，对目标施加眩晕效果。",
      "cooldown": 12
    }
  ],
  "doctor": [
    {
      "name": "电磁场装置",
      "desc": "投射一个电磁场装置，生成电磁场持续电击敌人。我方子弹穿过电磁场时将能附带感电效果。\n电磁场能消除敌人子弹。",
      "cooldown": 9
    },
    {
      "name": "高能电球",
      "desc": "生成多个高能电球和电磁护盾协助战斗。高能电球会发动协同攻击，并在结束时投射出去攻击敌人。电磁护盾在受击时会被消耗，减少所受伤害。\n高能电球与电磁护盾数量增加。",
      "cooldown": 8
    },
    {
      "name": "量子跃迁器",
      "desc": "博士启动量子跃迁器，闪烁至指定位置，展开量子领域。领域生成时会时停敌人并消除子弹。领域内的友方获得移动速度、攻击速度提升，并可穿越障碍物。量子领域会周期性释放量子脉冲，重演友方在量子脉冲间隔时间内造成的伤害与异常效果。初始可使用2次。\n量子跃迁器使用次数+1，第一次进入量子领域时短暂免疫伤害。",
      "cooldown": 8
    }
  ],
  "swordmaster": [
    {
      "name": "疾风剑刃",
      "desc": "闪身向前，使用疾风剑刃迅速斩击敌人。斩击结束时后撤。\n斩击过程中不会受伤。\n若命中敌人达到3次及以上，则减少冷却时间，剑意+5。\n满剑意时，使用技能将消耗所有剑意，强化技能。",
      "cooldown": 8
    },
    {
      "name": "流云飞剑",
      "desc": "技能分为三个阶段，一二阶段相同。\n一/二阶段：挥砍并发射多个飞剑，飞剑飞出一段时间后停留。\n三阶段：向前突进，对经过区域进行多次斩击，同时召回所有飞剑。\n飞剑伤害增加。三阶段攻击发射飞剑。\n击杀敌人时，有概率发射飞剑。\n技能完整释放时，剑意值+5。满剑意时，使用技能将消耗所有剑意，强化技能。",
      "cooldown": 6
    },
    {
      "name": "瞬步剑诀",
      "desc": "分三个阶段，一二阶段相同。\n阶段一/二：向前突进挥砍，召唤飞剑落下；\n阶段三：原地召唤落下飞剑，向场上的所有飞剑位置快速冲刺一遍，最后回到原地，释放瞬剑斩击。\n暴击时，在目标位置附近落下飞剑。\n技能完整释放时，剑意值+5。满剑意时，使用技能将消耗所有剑意，强化技能。",
      "cooldown": 7
    }
  ],
  "gunner": [
    {
      "name": "斗阵枪术",
      "desc": "使用天龙坠/乱无双/飞枪决三种招式攻击敌人。\n天龙坠：高高跃起冲入敌阵；\n乱无双：飞速移动并旋转长枪斩击；\n飞枪决：挥动长枪释放龙枪飞斩，远距离攻击敌人。\n攻击敌人将积累斗志，斗志积累满层后将进入雷动状态，提升暴击率和攻击速度，且技能获得加强：\n天龙坠：能眩晕敌人；\n乱无双：能附加感电效果；\n飞枪决：增强攻击，并附加感电效果。",
      "cooldown": 6
    },
    {
      "name": "龙枪圣临",
      "desc": "投掷长枪攻击敌人，拾取长枪获得斗志，使下一次武器攻击造成额外感电伤害。斗志达到5时使用技能可以激发雷动状态，攻击附带连锁感电伤害，并且在拾取长枪时施展范围打击。\n技能储存上限+1。",
      "cooldown": 3
    },
    {
      "name": "陷阵枪诀",
      "desc": "枪客可以使用寒芒和摆尾两种基础招式，并根据招式的组合顺序来释放终结招式。\n基础招式\n寒芒：向移动方向短距离突进。\n摆尾：向移动方向释放扇形横扫。\n终结招式\n寒芒 接 寒芒 → 雷霆破影\n长距离冲刺，对途径敌人造成伤害并附加感电与眩晕。\n摆尾 接 摆尾 → 回旋飞枪\n扔出回旋的飞枪，对击中敌人造成伤害并附加感电与眩晕。\n寒芒 接 摆尾 → 随锋而行\n召唤协同作战的灵体长枪，可同时存在多个。\n摆尾 接 寒芒 → 骤雨枪阵\n朝移动方向持续快速出枪，并且提高穿过枪阵的己方子弹伤害并附加感电效果。\n回马枪：若本次技能与上次技能释放的方向相差一定角度，则获得强化，提升伤害和范围。",
      "cooldown": null
    }
  ],
  "lord": [
    {
      "name": "战意风暴",
      "desc": "领主释放战意风暴，对敌人造成持续伤害。\n战意风暴能吸引子弹环绕，并会被接触到的元素晕染，从而获得对应的元素效果。\n技能持续期间提升移动速度。",
      "cooldown": 12
    },
    {
      "name": "决心猛冲",
      "desc": "领主向指定方向猛冲，期间大幅提高防御力并呼唤决心巨人。决心巨人会使用武器进行强化攻击。决心巨人的武器取决于释放技能时领主的武器，技能结束后消失。如果在战意涌动期间，呼唤决心巨人会存在至战意涌动结束。\n决心猛冲时提高的防御力会延长一小段时间",
      "cooldown": 4.5
    },
    {
      "name": "黑暗领主",
      "desc": "领主召唤黑暗领主巨剑挥砍前方，每次使用会提高挥砍次数和伤害，第三次挥砍会释放范围更大的回旋斩击。当领主获取足够战意值后进入黑暗涌动状态。此状态下领主每次攻击都会召唤黑暗领主巨剑进行斩击。技能效果替换为朝着目标方向突进，第三次释放会跳跃斩击目标。突进和跳跃期间，黑暗领主巨剑的攻击会直接释放回旋斩击。\n黑暗领主巨剑每3次攻击会生成远程剑气",
      "cooldown": 2.5
    }
  ],
  "spellblade": [
    {
      "name": "能量迸涌",
      "desc": "积攒能量释放强力法术！法术形态会随携带武器的类型而有所变化；在使用蓄力武器蓄力和攻击时，法术将同步蓄力和攻击。\n同步蓄力的进程加快50%。",
      "cooldown": 5
    },
    {
      "name": "庇护法阵",
      "desc": "接下技能键标记一个位置，之后咒法骑士移动到标记位置并且创造一个法阵。法阵维持并对敌人造成伤害，直到咒法骑士离开。咒法骑士和队友在法阵内持续获得最多6临时护甲。\n法阵伤害+1，法阵在咒法骑士离开之后可以维持3.5秒。",
      "cooldown": 7
    },
    {
      "name": "奥术飞弹",
      "desc": "咒法骑士发射数枚奥术飞弹。收集不同类型的奥术徽章并进行组合，可以改变奥术飞弹的行为并强化其效果。最多可获得9种不同的奥术徽章，并从中选择最多5种按照任意顺序装配至徽章槽位\n强化奥术徽章的效果",
      "cooldown": 5
    }
  ],
  "astrologer": [
    {
      "name": "骤雨流星",
      "desc": "占星师进入漫游状态，免疫伤害并提升移速，生成流星攻击敌人。星能充盈时，占星师消耗全部星能创造占星领域，造成范围伤害并消除敌方弹幕。\n占星师每移动一定距离会在身旁坠落一颗飞星。触发占星术时，会在目标附近坠落一颗飞星。释放技能时，留存的飞星将转化为流星，并延长漫游状态的持续时间。",
      "cooldown": 6
    },
    {
      "name": "命运之轮",
      "desc": "占星师释放命运之轮对敌人造成伤害，再次使用技能可以收回命运之轮。解锁被动技能后，每次伤害都会附加星之咒，触发占星术时，命运之轮额外造成一次伤害并变大。星能充盈时使用技能会释放更大的命运之轮。\n收回命运之轮时进入漫游状态",
      "cooldown": 7
    }
  ],
  "martialist": [
    {
      "name": "猛虎拳",
      "desc": "猛虎拳有四式，可通过普攻和技能的不同组合来施展。\n威虎啸：点按技能，提升50%暴击伤害；\n虎振地：普攻+技能，振地一击，眩晕附近敌人；\n百裂拳：普攻+普攻+技能，一段时间内高速挥出大量拳头。\n气功波：普攻+普攻+普攻+技能：向前发出附带燃烧效果的气功波，蓄力可增加范围。",
      "cooldown": 10
    },
    {
      "name": "旋风腿",
      "desc": "旋风腿有三段：前两段快速向敌人突进踢击且第一段可造成眩晕；第三段大范围扫腿，并击飞敌人\n第二段旋风腿会对敌人施加减益效果：受到伤害+50%",
      "cooldown": 5
    }
  ],
  "illusionist": [
    {
      "name": "戏影剑舞",
      "desc": "向前突刺一段距离，突刺后挥砍造成范围伤害。使用技能时，幻象会同时使用。使用技能会累积爆发值，爆发值满后可以发动剑舞：创造3个临时幻象，并与所有幻象一起冲向前区域造成大范围伤害。\n技能存储上限+1",
      "cooldown": 4
    },
    {
      "name": "幻幕戏法",
      "desc": "戏法师掷出斗篷释放环形斩击，随后进入隐身状态，获得移动速度提升与伤害免疫。斗篷将在戏法师周围环绕飞行，对附近敌人造成持续伤害。在隐身期间再次施放技能或持续时间结束时，戏法师收回斗篷，解除隐身并再次释放强力环形斩击。使用该技能会积蓄爆发值。当爆发值达到上限时，可激活终结技：戏法师在敌人附近召唤3个临时幻象协同作战。再次施放终结技或临时幻象持续时间结束时，所有临时幻象化作斗篷飞向戏法师，造成范围伤害。\n如果戏法师释放环形斩击命中了敌人或敌方子弹，戏法师会增加攻击速度。",
      "cooldown": 5
    }
  ],
  "bard": [
    {
      "name": "音律节拍",
      "desc": "开启一个音乐法阵与节拍器，当击中对应节拍时，法阵立刻产生1次攻击并且法阵数果获得提升。1级法阵内所有友方单位攻击速度+20%；2级法阵内所有友方单位攻击力+2，暴击率+20%；3级法阵内所有友方单位武器能量消耗-1。\n法阵最高等级＋1。4级法阵内所有友方单位防御＋1。节拍器会持续出现，直到玩家击中节拍失败。",
      "cooldown": 8
    },
    {
      "name": "共振乐章",
      "desc": "吟游诗人召唤协奏乐器，用音乐链接周围敌人，使其在技能持续时间内共享部分伤害。并使用音波清除附近敌人的弹幕，同时为小范围内的友军提供短暂的增益效果。\n若被链接的敌人被击败，其余链接目标将额外承受3点伤害。",
      "cooldown": 8
    }
  ],
  "marksman": [
    {
      "name": "枪神降临",
      "desc": "武器攻击获得强化，根据正副武器的类型获得不同效果（副武器的效果只有50%）：\n手枪：子弹附带爆炸效果；\n机枪：根据附带标记，3层标记会造成额外伤害：\n狙击枪：子弹击中目标后会自动攻击下一名敌人，但伤害逐渐降低；\n散弹：伤害对近距离的敌人造成额外伤害，越近伤害越高；\n其他：攻速＋50%\n击败敌人增加技能持续时间",
      "cooldown": 10
    },
    {
      "name": "狩猎领域",
      "desc": "屏幕出现准心，进入隐身且无法移动，持续8秒，再次点击技能键可提前结束。期间通过摇杆移动准心，点击普攻键破除隐身并攻击准心内的敌人，每次攻击可触发转枪消除敌方弹幕；点击普攻键上不同图标所在区域，可切换至对应准心并同时执行开火：\n狙击枪：对同一个目标的伤害递增。造成击杀后可立即锁定附近敌人；\n霰弹枪：攻击并击晕准心范围内的敌人；\n机枪：可长按连续快速射击敌人，积蓄火力值，当达到满格攻击附带点燃效果，击杀目标时从其倒下的位置向周围发射子弹；\n火箭：轰炸准心区域并留下火圈。\n技能冷却缩短",
      "cooldown": 6
    }
  ],
  "mecha_girl": [
    {
      "name": "虹烬共鸣",
      "desc": "根据电量状态与操作模式触发不同效果。\n电量不足1格：点按技能键，发射战术飞弹。\n电量不低于1格：点按技能键时，消耗1格电量，发射战术飞弹+短波激光。\n长按技能键完成蓄力时，松开按键在区域内发射激光进行来回扫射。激光可吸收敌方子弹增加自身宽度，并同时发射战术飞弹。激光会持续消耗电量，当电量耗尽时停止。\n战术飞弹的数量提高。",
      "cooldown": 3.5
    }
  ],
  "captain": [
    {
      "name": "炸桶派对",
      "desc": "部署：点击进入放置模式。期间可点击地图任意位置放置炸药桶，连接在一起的炸药桶数量越多，爆炸威力与范围越大。\n引爆：引爆距离船长最近的炸药桶。\n提高放置模式可放置炸药桶的数量",
      "cooldown": 8
    },
    {
      "name": "冲啊！逐浪号！",
      "desc": "船长可召唤逐浪号并登船，操纵逐浪号进行移动，同时角色可独立进行攻击；技能持续期间，再次按下技能键可提前下船。\n逐浪号可通过击杀敌人发现逐浪号进阶模组，获得永久强化升级。\n模组槽位上限提升",
      "cooldown": 9
    }
  ],
  "yinyang": [
    {
      "name": "夜铃符/明昼拳",
      "desc": "夜铃符：飞出数枚符纸，造成伤害并附着符纸。 阴值高于50时，技能期间远程武器的攻击也会飞出额外的符纸。当阴值到达100时，下次技能会回收所有符纸，在自身汇聚成一阵符纸风暴。同时阴值快速减少到50。\n明昼拳：向指定方向冲刺，结束时对周围敌人造成范围伤害。命中带符纸的敌人会刷新冷却，并造成额外伤害。符纸会被明昼拳激活，存储部分敌人收到的伤害并在敌人死亡或达到上限时引爆，造成范围伤害。阳值高于50时，明昼拳可以强化下一次近战攻击。当阳值到达100时，下次技能连续施放多次明昼拳，同时阳值快速减少到50。\n夜铃符释放数量提高，明昼拳伤害提高",
      "cooldown": 6
    }
  ],
  "gun_expert": [
    {
      "name": "火力增援",
      "desc": "呼叫3个装备随机武器的机械随从协助作战。随从退场后，枪械专家会选择随机三把随从的武器进入枪械回响状态，她的攻击额外触发这些武器的攻击。\n呼叫更多的机械随从作战",
      "cooldown": 10
    }
  ],
  "cook": [
    {
      "name": "神秘炖锅",
      "desc": "向前丢出神秘炖锅，在敌人间弹跳并造成伤害，持续4秒。每次弹跳会生成“地牢炖菜”，拾取后攻击变得更“美味”，持续10秒。\n食用食材或战斗可积累“火候”，上限100点。满100点时释放技能，可将“地牢炖菜”升级为“梦幻炖菜”，使角色在5秒内免疫伤害。\n本局游戏中每收集一个珍稀的食材，“地牢炖菜”根据食材种类产生以下效果。\n肉类：命中敌人时产生冲击波，冲击波范围+10%。\n菌类：有几率魅惑附近敌人，几率提升+1%。\n矿物：产生石头在周围环绕，石头伤害+1。\n植物：命中敌人时发射尖刺，尖刺数量+1。",
      "cooldown": 10
    }
  ]
}


/* 由 data/wiki/skills-full.json 生成：42角色三技能形态（V2修正一技能） */
export var WIKI_SKILL_FORMS = {
  "knight": [
    "dual_wield",
    "shadow_strike",
    "shadow_strike"
  ],
  "rogue": [
    "roll",
    "roll",
    "shadow_strike"
  ],
  "wizard": [
    "arcane_bolt",
    "dual_wield",
    "poison_flask"
  ],
  "assassin": [
    "shadow_strike",
    "turret",
    "nova"
  ],
  "alchemist": [
    "poison_flask",
    "arrow_rain",
    "nova"
  ],
  "engineer": [
    "turret",
    "shadow_strike",
    "holy_shield"
  ],
  "vampire": [
    "holy_shield",
    "dual_wield",
    "dual_wield"
  ],
  "paladin": [
    "holy_shield",
    "shadow_strike",
    "holy_shield"
  ],
  "elf": [
    "arrow_rain",
    "arrow_rain",
    "holy_shield"
  ],
  "werewolf": [
    "holy_shield",
    "holy_shield",
    "holy_shield"
  ],
  "priest": [
    "holy_shield",
    "holy_shield",
    "holy_shield"
  ],
  "druid": [
    "holy_shield",
    "turret",
    "holy_shield"
  ],
  "robot": [
    "beam",
    "turret",
    "dual_wield"
  ],
  "berserker": [
    "shadow_strike",
    "shadow_strike",
    "nova"
  ],
  "necromancer": [
    "nova",
    "turret",
    "nova"
  ],
  "sheriff": [
    "dual_wield",
    "nova",
    "poison_flask"
  ],
  "taoist": [
    "turret",
    "holy_shield",
    "beam"
  ],
  "transcendent": [
    "nova",
    "holy_shield",
    null
  ],
  "elemental": [
    "beam",
    null,
    null
  ],
  "owl": [
    "shadow_strike",
    null,
    null
  ],
  "time_ninja": [
    "arrow_rain",
    "turret",
    null
  ],
  "special_force": [
    "arrow_rain",
    null,
    null
  ],
  "qizong": [
    "roll",
    "dual_wield",
    "holy_shield"
  ],
  "demon_warlock": [
    "holy_shield",
    "turret",
    "holy_shield"
  ],
  "miner": [
    "nova",
    "holy_shield",
    "turret"
  ],
  "trapper": [
    "poison_flask",
    "holy_shield",
    "dual_wield"
  ],
  "suit_prince": [
    "poison_flask",
    "nova",
    "arrow_rain"
  ],
  "doctor": [
    "beam",
    "holy_shield",
    "dual_wield"
  ],
  "swordmaster": [
    "roll",
    "roll",
    "turret"
  ],
  "gunner": [
    "beam",
    "arrow_rain",
    "turret"
  ],
  "lord": [
    "dual_wield",
    "shadow_strike",
    "turret"
  ],
  "spellblade": [
    "shadow_strike",
    "holy_shield",
    "nova"
  ],
  "astrologer": [
    "arrow_rain",
    "nova",
    null
  ],
  "martialist": [
    "poison_flask",
    "roll",
    null
  ],
  "illusionist": [
    "shadow_strike",
    "turret",
    null
  ],
  "bard": [
    "holy_shield",
    "turret",
    null
  ],
  "marksman": [
    "poison_flask",
    "arrow_rain",
    null
  ],
  "mecha_girl": [
    "beam",
    null,
    null
  ],
  "captain": [
    "poison_flask",
    "turret",
    null
  ],
  "yinyang": [
    "roll",
    null,
    null
  ],
  "gun_expert": [
    "turret",
    null,
    null
  ],
  "cook": [
    "nova",
    null,
    null
  ]
}

/* 由 data/wiki/skills-full.json 解析：104技能持续时间/半径/数量/元素 */
export var WIKI_SKILL_TUNING2 = {
  "knight": [
    {},
    {},
    {}
  ],
  "rogue": [
    {
      "duration": 1.0
    },
    {},
    {
      "element": "ice"
    }
  ],
  "wizard": [
    {
      "element": "lightning"
    },
    {
      "element": "ice"
    },
    {
      "arrows": 6,
      "element": "fire"
    }
  ],
  "assassin": [
    {
      "chains": 4
    },
    {},
    {}
  ],
  "alchemist": [
    {
      "element": "poison"
    },
    {
      "element": "fire"
    },
    {}
  ],
  "engineer": [
    {
      "arrows": 3,
      "element": "fire"
    },
    {},
    {}
  ],
  "vampire": [
    {},
    {},
    {}
  ],
  "paladin": [
    {},
    {},
    {}
  ],
  "elf": [
    {
      "arrows": 3
    },
    {},
    {
      "arrows": 2,
      "element": "fire"
    }
  ],
  "werewolf": [
    {},
    {},
    {}
  ],
  "priest": [
    {},
    {},
    {}
  ],
  "druid": [
    {
      "element": "fire"
    },
    {
      "element": "poison"
    },
    {}
  ],
  "robot": [
    {
      "duration": 20.0,
      "arrows": 2,
      "element": "lightning"
    },
    {
      "arrows": 4
    },
    {
      "arrows": 10,
      "element": "lightning"
    }
  ],
  "berserker": [
    {},
    {
      "arrows": 3
    },
    {}
  ],
  "necromancer": [
    {},
    {
      "element": "poison"
    },
    {
      "arrows": 1
    }
  ],
  "sheriff": [
    {
      "arrows": 1
    },
    {},
    {
      "arrows": 7,
      "element": "fire"
    }
  ],
  "taoist": [
    {},
    {},
    {
      "element": "lightning"
    }
  ],
  "transcendent": [
    {
      "chains": 3
    },
    {
      "duration": 3.0,
      "arrows": 3
    },
    {}
  ],
  "elemental": [
    {
      "element": "fire"
    },
    {},
    {}
  ],
  "owl": [
    {},
    {},
    {}
  ],
  "time_ninja": [
    {},
    {
      "duration": 2.5
    },
    {}
  ],
  "special_force": [
    {},
    {},
    {}
  ],
  "qizong": [
    {},
    {},
    {}
  ],
  "demon_warlock": [
    {
      "duration": 10.0,
      "arrows": 2,
      "element": "fire"
    },
    {},
    {}
  ],
  "miner": [
    {},
    {},
    {}
  ],
  "trapper": [
    {},
    {},
    {}
  ],
  "suit_prince": [
    {
      "element": "poison"
    },
    {
      "element": "ice"
    },
    {}
  ],
  "doctor": [
    {
      "element": "lightning"
    },
    {
      "element": "lightning"
    },
    {}
  ],
  "swordmaster": [
    {},
    {},
    {}
  ],
  "gunner": [
    {
      "element": "lightning"
    },
    {
      "element": "lightning"
    },
    {
      "element": "lightning"
    }
  ],
  "lord": [
    {},
    {},
    {}
  ],
  "spellblade": [
    {},
    {
      "duration": 3.5
    },
    {}
  ],
  "astrologer": [
    {},
    {},
    {}
  ],
  "martialist": [
    {
      "element": "fire"
    },
    {},
    {}
  ],
  "illusionist": [
    {
      "arrows": 3
    },
    {
      "arrows": 3
    },
    {}
  ],
  "bard": [
    {},
    {},
    {}
  ],
  "marksman": [
    {},
    {
      "duration": 8.0,
      "element": "fire"
    },
    {}
  ],
  "mecha_girl": [
    {
      "element": "lightning"
    },
    {},
    {}
  ],
  "captain": [
    {},
    {},
    {}
  ],
  "yinyang": [
    {},
    {},
    {}
  ],
  "gun_expert": [
    {
      "arrows": 3
    },
    {},
    {}
  ],
  "cook": [
    {
      "duration": 4.0,
      "element": "fire"
    },
    {},
    {}
  ]
}

/* 由 data/wiki/talents-full.json 生成：17个维基天赋补充 */
export var WIKI_TALENT_EXTRA = {
  "wiki_t1": {
    "id": "wiki_t1",
    "name": "护甲+1",
    "desc": "护甲+1",
    "icon": "ui_buff_hp",
    "rarity": "good",
    "maxStack": 3,
    "effects": [
      {
        "type": "maxArmor",
        "value": 1
      }
    ]
  },
  "wiki_t2": {
    "id": "wiki_t2",
    "name": "破甲修复",
    "desc": "护甲破碎时立即恢复50%的护甲值，60秒可触发一次",
    "icon": "ui_buff_hp",
    "rarity": "rare",
    "maxStack": 1,
    "effects": [
      {
        "type": "armorRegenPct",
        "value": 0.5
      }
    ]
  },
  "wiki_t3": {
    "id": "wiki_t3",
    "name": "元素生甲",
    "desc": "对敌人施加负面状态时，25%几率恢复1点护甲。",
    "icon": "ui_buff_hp",
    "rarity": "rare",
    "maxStack": 3,
    "effects": [
      {
        "type": "maxArmor",
        "value": 1
      }
    ]
  },
  "wiki_t4": {
    "id": "wiki_t4",
    "name": "生命+4",
    "desc": "提升生命值上限",
    "icon": "ui_buff_hp",
    "rarity": "epic",
    "maxStack": 1,
    "effects": [
      {
        "type": "maxHp",
        "value": 4
      }
    ]
  },
  "wiki_t5": {
    "id": "wiki_t5",
    "name": "恢复强化",
    "desc": "获得100%的恢复强度",
    "icon": "ui_buff_hp",
    "rarity": "rare",
    "maxStack": 2,
    "effects": [
      {
        "type": "lifesteal",
        "value": 0.08
      }
    ]
  },
  "wiki_t6": {
    "id": "wiki_t6",
    "name": "击败回血",
    "desc": "击败敌人将有概率掉落生命球",
    "icon": "ui_buff_hp",
    "rarity": "good",
    "maxStack": 3,
    "effects": [
      {
        "type": "killHeal",
        "value": 2
      }
    ]
  },
  "wiki_t7": {
    "id": "wiki_t7",
    "name": "击败回蓝",
    "desc": "击败敌人将有概率掉落能量球",
    "icon": "ui_buff_spd",
    "rarity": "good",
    "maxStack": 3,
    "effects": [
      {
        "type": "killEnergy",
        "value": 12
      }
    ]
  },
  "wiki_t8": {
    "id": "wiki_t8",
    "name": "能量+100",
    "desc": "能量上限+100",
    "icon": "ui_buff_spd",
    "rarity": "epic",
    "maxStack": 1,
    "effects": [
      {
        "type": "maxEnergy",
        "value": 100
      }
    ]
  },
  "wiki_t9": {
    "id": "wiki_t9",
    "name": "金盾",
    "desc": "每100金币增加1点护甲上限，最多增加3点",
    "icon": "ui_buff_hp",
    "rarity": "epic",
    "maxStack": 1,
    "effects": [
      {
        "type": "maxArmor",
        "value": 3
      }
    ]
  },
  "wiki_t10": {
    "id": "wiki_t10",
    "name": "毒盾",
    "desc": "免疫毒气及减速，对敌人中毒伤害提升",
    "icon": "ui_buff_atk",
    "rarity": "rare",
    "maxStack": 2,
    "effects": [
      {
        "type": "damagePct",
        "value": 0.12
      }
    ]
  },
  "wiki_t11": {
    "id": "wiki_t11",
    "name": "火盾",
    "desc": "降低爆炸伤害并免疫火焰，对敌人火焰伤害提升",
    "icon": "ui_buff_atk",
    "rarity": "rare",
    "maxStack": 2,
    "effects": [
      {
        "type": "damagePct",
        "value": 0.12
      }
    ]
  },
  "wiki_t12": {
    "id": "wiki_t12",
    "name": "冰盾",
    "desc": "免疫冰冻，对敌人的冰冻时间增加",
    "icon": "ui_buff_atk",
    "rarity": "rare",
    "maxStack": 2,
    "effects": [
      {
        "type": "crit",
        "value": 6
      }
    ]
  },
  "wiki_t13": {
    "id": "wiki_t13",
    "name": "刺盾",
    "desc": "免疫陷阱，免疫碰撞伤害",
    "icon": "ui_buff_atk",
    "rarity": "rare",
    "maxStack": 3,
    "effects": [
      {
        "type": "thorns",
        "value": 1
      }
    ]
  },
  "wiki_t14": {
    "id": "wiki_t14",
    "name": "雷暴",
    "desc": "暴击提升10%。释放技能或暴击时，在目标处落下雷电。",
    "icon": "ui_buff_atk",
    "rarity": "epic",
    "maxStack": 1,
    "effects": [
      {
        "type": "crit",
        "value": 10
      }
    ]
  },
  "wiki_t15": {
    "id": "wiki_t15",
    "name": "子弹分裂",
    "desc": "远程子弹命中时，有50%几率释放一枚额外子弹。",
    "icon": "ui_buff_atk",
    "rarity": "epic",
    "maxStack": 1,
    "effects": [
      {
        "type": "bounce",
        "value": 1
      }
    ]
  },
  "wiki_t16": {
    "id": "wiki_t16",
    "name": "武器多持",
    "desc": "能额外携带一把武器",
    "icon": "ui_buff_atk",
    "rarity": "rare",
    "maxStack": 2,
    "effects": [
      {
        "type": "fireRatePct",
        "value": 0.1
      }
    ]
  },
  "wiki_t17": {
    "id": "wiki_t17",
    "name": "散弹增加",
    "desc": "增加散弹枪的子弹数量",
    "icon": "ui_buff_atk",
    "rarity": "rare",
    "maxStack": 2,
    "effects": [
      {
        "type": "rangePct",
        "value": 0.15
      }
    ]
  }
}

/* 由 data/wiki/weapon-aliases.json 生成：中等置信度别名武器名/介绍 */
export var WIKI_WEAPON_MEDIUM = {
  "poison_bottle": {
    "name": "休眠的毒泡泡泵",
    "desc": null
  },
  "wok": {
    "name": "锅铲",
    "desc": null
  },
  "smg_wiki": {
    "name": "冲锋枪一代",
    "desc": null
  },
  "shadow_staff": {
    "name": "幻影法杖",
    "desc": "通宵赶作业神器"
  },
  "throwing_knife": {
    "name": "削你飞刀",
    "desc": null
  },
  "great_sword": {
    "name": "玄铁重剑",
    "desc": null
  },
  "apprentice_staff": {
    "name": "传奇学徒法杖",
    "desc": null
  },
  "poison_staff": {
    "name": "瘟疫之杖",
    "desc": null
  },
  "knight_sword": {
    "name": "大骑士的剑",
    "desc": "大骑士的单手阔剑，堵塞的血槽是岁月的痕迹"
  },
  "war_hammer": {
    "name": "爆炸战锤",
    "desc": "艺术就是，等等，快跑！"
  },
  "double_barrel": {
    "name": "双管步枪",
    "desc": null
  }
}

/* 由 data/wiki 生成：36把Boss红武 + Boss红武映射 */
export var WIKI_RED_WEAPONS = [
  {
    "id": "red_w1",
    "name": "雪人之鹰",
    "desc": "召唤！跳跳娃",
    "category": "gun",
    "rarity": "mythic",
    "dmg": 4,
    "energy": 2,
    "critBonus": 0,
    "sprite": "wp_red_w1"
  },
  {
    "id": "red_w2",
    "name": "大猿长弓",
    "desc": "猿之哀啼，雪之狂舞",
    "category": "bow",
    "rarity": "mythic",
    "dmg": 2,
    "energy": 4,
    "critBonus": 0,
    "sprite": "wp_red_w2"
  },
  {
    "id": "red_w3",
    "name": "晶蟹钛刀",
    "desc": "一斩断骨，二斩屠军！三斩灭世！！",
    "category": "melee",
    "rarity": "mythic",
    "dmg": 8,
    "energy": 0,
    "critBonus": 0,
    "sprite": "wp_red_w3"
  },
  {
    "id": "red_w4",
    "name": "金蟹战锤",
    "desc": "金蟹战锤",
    "category": "melee",
    "rarity": "mythic",
    "dmg": 8,
    "energy": 5,
    "critBonus": 0,
    "sprite": "wp_red_w4"
  },
  {
    "id": "red_w5",
    "name": "重生十字章",
    "desc": "重生十字章",
    "category": "special",
    "rarity": "mythic",
    "dmg": 2,
    "energy": 0,
    "critBonus": 0,
    "sprite": "wp_red_w5"
  },
  {
    "id": "red_w6",
    "name": "食人花",
    "desc": "我还在咀嚼……",
    "category": "shotgun",
    "rarity": "mythic",
    "dmg": 6,
    "energy": 3,
    "critBonus": 0,
    "sprite": "wp_red_w6"
  },
  {
    "id": "red_w7",
    "name": "躁动的树干",
    "desc": "啊可恶，停不下来",
    "category": "melee",
    "rarity": "mythic",
    "dmg": 5,
    "energy": 1,
    "critBonus": 0,
    "sprite": "wp_red_w7"
  },
  {
    "id": "red_w8",
    "name": "定海神针",
    "desc": "重一万三千五百斤",
    "category": "melee",
    "rarity": "mythic",
    "dmg": 6,
    "energy": 0,
    "critBonus": 0,
    "sprite": "wp_red_w8"
  },
  {
    "id": "red_w9",
    "name": "重拳出击！",
    "desc": "头目面前唯唯诺诺，在小怪面前重拳出击",
    "category": "special",
    "rarity": "mythic",
    "dmg": 2,
    "energy": 0,
    "critBonus": 0,
    "sprite": "wp_red_w9"
  },
  {
    "id": "red_w10",
    "name": "备用王冠",
    "desc": "看不见我/(///ω///)/",
    "category": "special",
    "rarity": "mythic",
    "dmg": 2,
    "energy": 5,
    "critBonus": 0,
    "sprite": "wp_red_w10"
  },
  {
    "id": "red_w11",
    "name": "国王的新枪",
    "desc": "据说只有放在地上才能看得到",
    "category": "special",
    "rarity": "mythic",
    "dmg": 6,
    "energy": 5,
    "critBonus": 0,
    "sprite": "wp_red_w11"
  },
  {
    "id": "red_w12",
    "name": "大巫师之杖",
    "desc": "告诉你，其实我是彩虹的哥哥",
    "category": "staff",
    "rarity": "mythic",
    "dmg": 3,
    "energy": 3,
    "critBonus": 0,
    "sprite": "wp_red_w12"
  },
  {
    "id": "red_w13",
    "name": "黑暗大骑士的剑",
    "desc": "黑暗大骑士的剑",
    "category": "melee",
    "rarity": "mythic",
    "dmg": 6,
    "energy": 1,
    "critBonus": 0,
    "sprite": "wp_red_w13"
  },
  {
    "id": "red_w14",
    "name": "超级火箭礼花",
    "desc": "超级火箭礼花",
    "category": "special",
    "rarity": "mythic",
    "dmg": 12,
    "energy": 5,
    "critBonus": 0,
    "sprite": "wp_red_w14"
  },
  {
    "id": "red_w15",
    "name": "死灵法杖",
    "desc": "一个法杖召唤一只军队",
    "category": "staff",
    "rarity": "mythic",
    "dmg": 2,
    "energy": 5,
    "critBonus": 0,
    "sprite": "wp_red_w15"
  },
  {
    "id": "red_w16",
    "name": "轰炸机",
    "desc": "想看烟花吗",
    "category": "launcher",
    "rarity": "mythic",
    "dmg": 4,
    "energy": 2,
    "critBonus": 0,
    "sprite": "wp_red_w16"
  },
  {
    "id": "red_w17",
    "name": "女皇之触",
    "desc": "女皇之触",
    "category": "special",
    "rarity": "mythic",
    "dmg": 2,
    "energy": 3,
    "critBonus": 0,
    "sprite": "wp_red_w17"
  },
  {
    "id": "red_w18",
    "name": "至尊权杖",
    "desc": "至尊权杖",
    "category": "staff",
    "rarity": "mythic",
    "dmg": 2,
    "energy": 3,
    "critBonus": 0,
    "sprite": "wp_red_w18"
  },
  {
    "id": "red_w19",
    "name": "痛苦面具",
    "desc": "痛苦面具",
    "category": "special",
    "rarity": "mythic",
    "dmg": 6,
    "energy": 4,
    "critBonus": 0,
    "sprite": "wp_red_w19"
  },
  {
    "id": "red_w20",
    "name": "黑暗残影",
    "desc": "黑暗残影",
    "category": "special",
    "rarity": "mythic",
    "dmg": 14,
    "energy": 5,
    "critBonus": 0,
    "sprite": "wp_red_w20"
  },
  {
    "id": "red_w21",
    "name": "守灵人短斧",
    "desc": "我即是虫群",
    "category": "melee",
    "rarity": "mythic",
    "dmg": 8,
    "energy": 3,
    "critBonus": 0,
    "sprite": "wp_red_w21"
  },
  {
    "id": "red_w22",
    "name": "沙虫",
    "desc": "上得了年夜饭餐桌，下得了15层地牢",
    "category": "shotgun",
    "rarity": "mythic",
    "dmg": 6,
    "energy": 6,
    "critBonus": 0,
    "sprite": "wp_red_w22"
  },
  {
    "id": "red_w23",
    "name": "火龙步枪",
    "desc": "燃烧吧！巨龙吐息！",
    "category": "rifle",
    "rarity": "mythic",
    "dmg": 3,
    "energy": 0,
    "critBonus": 0,
    "sprite": "wp_red_w23"
  },
  {
    "id": "red_w24",
    "name": "阿努比斯的权杖",
    "desc": "阿努比斯的权杖",
    "category": "staff",
    "rarity": "mythic",
    "dmg": 2,
    "energy": 5,
    "critBonus": 0,
    "sprite": "wp_red_w24"
  },
  {
    "id": "red_w25",
    "name": "瓦克恩冲锋枪",
    "desc": "瓦克恩头目正版授权周边，欲购从速",
    "category": "smg",
    "rarity": "mythic",
    "dmg": 3,
    "energy": 0,
    "critBonus": 0,
    "sprite": "wp_red_w25"
  },
  {
    "id": "red_w26",
    "name": "浮游炮",
    "desc": "我可以跟在你身后，像影子追着光梦游",
    "category": "special",
    "rarity": "mythic",
    "dmg": 4,
    "energy": 1,
    "critBonus": 0,
    "sprite": "wp_red_w26"
  },
  {
    "id": "red_w27",
    "name": "死星镭射",
    "desc": "死星镭射",
    "category": "special",
    "rarity": "mythic",
    "dmg": 6,
    "energy": 2,
    "critBonus": 0,
    "sprite": "wp_red_w27"
  },
  {
    "id": "red_w28",
    "name": "未完成的鲨鱼火炮",
    "desc": "未完成的鲨鱼火炮",
    "category": "melee",
    "rarity": "mythic",
    "dmg": 9,
    "energy": 3,
    "critBonus": 0,
    "sprite": "wp_red_w28"
  },
  {
    "id": "red_w29",
    "name": "舰长勋章",
    "desc": "舰长勋章",
    "category": "special",
    "rarity": "mythic",
    "dmg": 2,
    "energy": 0,
    "critBonus": 0,
    "sprite": "wp_red_w29"
  },
  {
    "id": "red_w30",
    "name": "岩祖大哥大",
    "desc": "岩祖大哥大",
    "category": "special",
    "rarity": "mythic",
    "dmg": 16,
    "energy": 6,
    "critBonus": 0,
    "sprite": "wp_red_w30"
  },
  {
    "id": "red_w31",
    "name": "神牛槌",
    "desc": "神牛槌",
    "category": "melee",
    "rarity": "mythic",
    "dmg": 15,
    "energy": 5,
    "critBonus": 0,
    "sprite": "wp_red_w31"
  },
  {
    "id": "red_w32",
    "name": "咒术之杖",
    "desc": "咒术之杖",
    "category": "staff",
    "rarity": "mythic",
    "dmg": 3,
    "energy": 3,
    "critBonus": 0,
    "sprite": "wp_red_w32"
  },
  {
    "id": "red_w33",
    "name": "诅咒圣杯",
    "desc": "诅咒圣杯",
    "category": "special",
    "rarity": "mythic",
    "dmg": 2,
    "energy": 3,
    "critBonus": 0,
    "sprite": "wp_red_w33"
  },
  {
    "id": "red_w34",
    "name": "声呐探测器",
    "desc": "声呐探测器",
    "category": "staff",
    "rarity": "mythic",
    "dmg": 2,
    "energy": 3,
    "critBonus": 0,
    "sprite": "wp_red_w34"
  },
  {
    "id": "red_w35",
    "name": "长夜",
    "desc": "长夜",
    "category": "melee",
    "rarity": "mythic",
    "dmg": 3,
    "energy": 3,
    "critBonus": 0,
    "sprite": "wp_red_w35"
  },
  {
    "id": "red_w36",
    "name": "冥灯",
    "desc": "冥灯",
    "category": "staff",
    "rarity": "mythic",
    "dmg": 2,
    "energy": 1,
    "critBonus": 0,
    "sprite": "wp_red_w36"
  }
]
export var WIKI_BOSS_RED_FULL = {
  "snowman_king": "red_w1",
  "golden_monkey_king": "red_w8",
  "cave_ice_worm": "red_w19",
  "boundless_dark_lord": "red_w20",
  "tomb_beetle_king": "red_w21",
  "great_wizard": "red_w12",
  "skeleton_king": "red_w15",
  "vc_mecha": "red_w16",
  "ghost_king": "red_w10",
  "headless_knight": "red_w11",
  "mechanical_queen": "red_w17",
  "mechanical_emperor": "red_w18",
  "volcano_sandworm": "red_w22",
  "flying_dragon_cub": "red_w23",
  "anubis": "red_w24",
  "wacken_leader": "red_w25",
  "colossus_zulan": "red_w26",
  "laser_ufo_boss": "red_w27",
  "pirate_king": "red_w28",
  "steel_wave_breaker": "red_w29",
  "stone_fog_dragon": "red_w32",
  "dong_zhuo": "red_w33",
  "abyss_navigator": "red_w34"
}

/* 由 data/wiki/weapons-full.json 生成：571武器补齐（余下385） */
export var WIKI_WEAPONS_REMAIN = [
  {
    "id": "wiki_w1",
    "name": "40厘米直尺",
    "desc": "40厘米直尺",
    "category": "special",
    "rarity": "rare",
    "dmg": 4,
    "energy": 0,
    "critBonus": 30,
    "sprite": "wp_wiki_w1"
  },
  {
    "id": "wiki_w2",
    "name": "40米长刀",
    "desc": "你逃不掉的！",
    "category": "melee",
    "rarity": "common",
    "dmg": 12,
    "energy": 0,
    "critBonus": 0,
    "sprite": "wp_wiki_w2"
  },
  {
    "id": "wiki_w3",
    "name": "40米长刀40米长刀",
    "desc": "40米长刀40米长刀",
    "category": "melee",
    "rarity": "rare",
    "dmg": 16,
    "energy": 0,
    "critBonus": 0,
    "sprite": "wp_wiki_w3"
  },
  {
    "id": "wiki_w4",
    "name": "Bug发射器",
    "desc": "Bug发射器",
    "category": "gun",
    "rarity": "rare",
    "dmg": 5,
    "energy": 1,
    "critBonus": 30,
    "sprite": "wp_wiki_w4"
  },
  {
    "id": "wiki_w5",
    "name": "P250手枪",
    "desc": "没有生锈的手枪，效果要比旧手枪好很多",
    "category": "gun",
    "rarity": "common",
    "dmg": 3,
    "energy": 0,
    "critBonus": 10,
    "sprite": "wp_wiki_w5"
  },
  {
    "id": "wiki_w6",
    "name": "“棒棒糖”",
    "desc": "现在它的外表和内在一样美了",
    "category": "special",
    "rarity": "epic",
    "dmg": 16,
    "energy": 6,
    "critBonus": 20,
    "sprite": "wp_wiki_w6"
  },
  {
    "id": "wiki_w7",
    "name": "一拳",
    "desc": "今天是！超市特价日啊！",
    "category": "special",
    "rarity": "mythic",
    "dmg": 16,
    "energy": 6,
    "critBonus": 0,
    "sprite": "wp_wiki_w7"
  },
  {
    "id": "wiki_w8",
    "name": "一拳（白）",
    "desc": "一拳（白）",
    "category": "special",
    "rarity": "common",
    "dmg": 9,
    "energy": 1,
    "critBonus": 30,
    "sprite": "wp_wiki_w8"
  },
  {
    "id": "wiki_w9",
    "name": "一拳（紫）",
    "desc": "一拳（紫）",
    "category": "special",
    "rarity": "epic",
    "dmg": 6,
    "energy": 5,
    "critBonus": 10,
    "sprite": "wp_wiki_w9"
  },
  {
    "id": "wiki_w10",
    "name": "三叉戟",
    "desc": "传说中海神的武器，虽尘封千年仍光芒夺目",
    "category": "melee",
    "rarity": "rare",
    "dmg": 8,
    "energy": 3,
    "critBonus": 15,
    "sprite": "wp_wiki_w10"
  },
  {
    "id": "wiki_w11",
    "name": "三尖两刃刀",
    "desc": "三尖两刃刀",
    "category": "special",
    "rarity": "mythic",
    "dmg": 3,
    "energy": 0,
    "critBonus": 0,
    "sprite": "wp_wiki_w11"
  },
  {
    "id": "wiki_w12",
    "name": "三昧真火",
    "desc": "三昧真火",
    "category": "special",
    "rarity": "mythic",
    "dmg": 2,
    "energy": 1,
    "critBonus": 0,
    "sprite": "wp_wiki_w12"
  },
  {
    "id": "wiki_w13",
    "name": "不稳定的机枪",
    "desc": "这把枪的枪口多了两个洞，不知道是干什么用的",
    "category": "shotgun",
    "rarity": "common",
    "dmg": 2,
    "energy": 1,
    "critBonus": 0,
    "sprite": "wp_wiki_w13"
  },
  {
    "id": "wiki_w14",
    "name": "中级鱼竿",
    "desc": "中级鱼竿",
    "category": "special",
    "rarity": "legend",
    "dmg": 2,
    "energy": 3,
    "critBonus": 0,
    "sprite": "wp_wiki_w14"
  },
  {
    "id": "wiki_w15",
    "name": "乌贼",
    "desc": "乌贼",
    "category": "special",
    "rarity": "rare",
    "dmg": 2,
    "energy": 2,
    "critBonus": 15,
    "sprite": "wp_wiki_w15"
  },
  {
    "id": "wiki_w16",
    "name": "乾坤弓",
    "desc": "乾坤弓",
    "category": "special",
    "rarity": "mythic",
    "dmg": 2,
    "energy": 3,
    "critBonus": 0,
    "sprite": "wp_wiki_w16"
  },
  {
    "id": "wiki_w17",
    "name": "二五仔之锤",
    "desc": "二五仔之锤",
    "category": "melee",
    "rarity": "good",
    "dmg": 12,
    "energy": 5,
    "critBonus": 30,
    "sprite": "wp_wiki_w17"
  },
  {
    "id": "wiki_w18",
    "name": "五子棋盘",
    "desc": "五子棋盘",
    "category": "special",
    "rarity": "rare",
    "dmg": 6,
    "energy": 2,
    "critBonus": 20,
    "sprite": "wp_wiki_w18"
  },
  {
    "id": "wiki_w19",
    "name": "五色笔",
    "desc": "五色笔",
    "category": "special",
    "rarity": "mythic",
    "dmg": 2,
    "energy": 1,
    "critBonus": 30,
    "sprite": "wp_wiki_w19"
  },
  {
    "id": "wiki_w20",
    "name": "人民冲锋枪",
    "desc": "人民冲锋枪",
    "category": "smg",
    "rarity": "good",
    "dmg": 3,
    "energy": 1,
    "critBonus": 0,
    "sprite": "wp_wiki_w20"
  },
  {
    "id": "wiki_w21",
    "name": "仲裁者",
    "desc": "仲裁者",
    "category": "special",
    "rarity": "good",
    "dmg": 7,
    "energy": 2,
    "critBonus": 25,
    "sprite": "wp_wiki_w21"
  },
  {
    "id": "wiki_w22",
    "name": "伏羲盾",
    "desc": "伏羲盾",
    "category": "special",
    "rarity": "mythic",
    "dmg": 7,
    "energy": 3,
    "critBonus": 0,
    "sprite": "wp_wiki_w22"
  },
  {
    "id": "wiki_w23",
    "name": "休眠的毒泡泡泵（升级版）",
    "desc": "休眠的毒泡泡泵（升级版）",
    "category": "shotgun",
    "rarity": "good",
    "dmg": 2,
    "energy": 2,
    "critBonus": 15,
    "sprite": "wp_wiki_w23"
  },
  {
    "id": "wiki_w24",
    "name": "传奇焊枪",
    "desc": "传奇焊枪",
    "category": "special",
    "rarity": "rare",
    "dmg": 3,
    "energy": 0,
    "critBonus": 10,
    "sprite": "wp_wiki_w24"
  },
  {
    "id": "wiki_w25",
    "name": "传奇的刀盾",
    "desc": "传奇的刀盾",
    "category": "melee",
    "rarity": "good",
    "dmg": 8,
    "energy": 0,
    "critBonus": 0,
    "sprite": "wp_wiki_w25"
  },
  {
    "id": "wiki_w26",
    "name": "传说锅铲",
    "desc": "传说锅铲",
    "category": "special",
    "rarity": "good",
    "dmg": 9,
    "energy": 2,
    "critBonus": 20,
    "sprite": "wp_wiki_w26"
  },
  {
    "id": "wiki_w27",
    "name": "作文纸条",
    "desc": "书到用时方恨少",
    "category": "special",
    "rarity": "common",
    "dmg": 2,
    "energy": 2,
    "critBonus": 10,
    "sprite": "wp_wiki_w27"
  },
  {
    "id": "wiki_w28",
    "name": "便携炸弹工厂",
    "desc": "便携炸弹工厂",
    "category": "special",
    "rarity": "epic",
    "dmg": 2,
    "energy": 6,
    "critBonus": 0,
    "sprite": "wp_wiki_w28"
  },
  {
    "id": "wiki_w29",
    "name": "修罗",
    "desc": "修罗",
    "category": "melee",
    "rarity": "mythic",
    "dmg": 15,
    "energy": 3,
    "critBonus": 0,
    "sprite": "wp_wiki_w29"
  },
  {
    "id": "wiki_w30",
    "name": "倚天剑",
    "desc": "倚天剑",
    "category": "special",
    "rarity": "mythic",
    "dmg": 10,
    "energy": 5,
    "critBonus": 20,
    "sprite": "wp_wiki_w30"
  },
  {
    "id": "wiki_w31",
    "name": "偃月青龙·改",
    "desc": "偃月青龙·改",
    "category": "special",
    "rarity": "mythic",
    "dmg": 12,
    "energy": 0,
    "critBonus": 0,
    "sprite": "wp_wiki_w31"
  },
  {
    "id": "wiki_w32",
    "name": "假发",
    "desc": "假发",
    "category": "special",
    "rarity": "rare",
    "dmg": 2,
    "energy": 0,
    "critBonus": 0,
    "sprite": "wp_wiki_w32"
  },
  {
    "id": "wiki_w33",
    "name": "元气弹发射器",
    "desc": "元气弹发射器",
    "category": "special",
    "rarity": "epic",
    "dmg": 5,
    "energy": 2,
    "critBonus": 10,
    "sprite": "wp_wiki_w33"
  },
  {
    "id": "wiki_w34",
    "name": "元碎牙",
    "desc": "元碎牙",
    "category": "melee",
    "rarity": "legend",
    "dmg": 5,
    "energy": 3,
    "critBonus": 30,
    "sprite": "wp_wiki_w34"
  },
  {
    "id": "wiki_w35",
    "name": "元素石双刀",
    "desc": "元素石双刀",
    "category": "melee",
    "rarity": "epic",
    "dmg": 8,
    "energy": 0,
    "critBonus": 0,
    "sprite": "wp_wiki_w35"
  },
  {
    "id": "wiki_w36",
    "name": "元能之相",
    "desc": "元能之相",
    "category": "staff",
    "rarity": "common",
    "dmg": 8,
    "energy": 4,
    "critBonus": 10,
    "sprite": "wp_wiki_w36"
  },
  {
    "id": "wiki_w37",
    "name": "元能之相（升级版）",
    "desc": "元能之相（升级版）",
    "category": "staff",
    "rarity": "good",
    "dmg": 8,
    "energy": 3,
    "critBonus": 10,
    "sprite": "wp_wiki_w37"
  },
  {
    "id": "wiki_w38",
    "name": "先驱者",
    "desc": "纪念死去的灵魂",
    "category": "gun",
    "rarity": "common",
    "dmg": 4,
    "energy": 1,
    "critBonus": 15,
    "sprite": "wp_wiki_w38"
  },
  {
    "id": "wiki_w39",
    "name": "光之书",
    "desc": "光之书",
    "category": "staff",
    "rarity": "legend",
    "dmg": 3,
    "energy": 2,
    "critBonus": 10,
    "sprite": "wp_wiki_w39"
  },
  {
    "id": "wiki_w40",
    "name": "光剑 土豪金",
    "desc": "光剑 土豪金",
    "category": "melee",
    "rarity": "legend",
    "dmg": 8,
    "energy": 0,
    "critBonus": 8,
    "sprite": "wp_wiki_w40"
  },
  {
    "id": "wiki_w41",
    "name": "光剑 紫",
    "desc": "光剑 紫",
    "category": "melee",
    "rarity": "epic",
    "dmg": 2,
    "energy": 6,
    "critBonus": 30,
    "sprite": "wp_wiki_w41"
  },
  {
    "id": "wiki_w42",
    "name": "光剑 红",
    "desc": "你对原力一无所知",
    "category": "melee",
    "rarity": "rare",
    "dmg": 12,
    "energy": 0,
    "critBonus": 0,
    "sprite": "wp_wiki_w42"
  },
  {
    "id": "wiki_w43",
    "name": "光剑 绿",
    "desc": "光剑 绿",
    "category": "melee",
    "rarity": "rare",
    "dmg": 10,
    "energy": 0,
    "critBonus": 10,
    "sprite": "wp_wiki_w43"
  },
  {
    "id": "wiki_w44",
    "name": "光剑 蓝",
    "desc": "愿原力与你同在",
    "category": "melee",
    "rarity": "rare",
    "dmg": 8,
    "energy": 0,
    "critBonus": 30,
    "sprite": "wp_wiki_w44"
  },
  {
    "id": "wiki_w45",
    "name": "全恢复药水",
    "desc": "全恢复药水",
    "category": "special",
    "rarity": "mythic",
    "dmg": 2,
    "energy": 3,
    "critBonus": 0,
    "sprite": "wp_wiki_w45"
  },
  {
    "id": "wiki_w46",
    "name": "全能发球器",
    "desc": "全能发球器",
    "category": "special",
    "rarity": "rare",
    "dmg": 2,
    "energy": 1,
    "critBonus": 0,
    "sprite": "wp_wiki_w46"
  },
  {
    "id": "wiki_w47",
    "name": "八分饱加特林",
    "desc": "八分饱加特林",
    "category": "shotgun",
    "rarity": "epic",
    "dmg": 3,
    "energy": 2,
    "critBonus": 0,
    "sprite": "wp_wiki_w47"
  },
  {
    "id": "wiki_w48",
    "name": "八卦炉",
    "desc": "八卦炉",
    "category": "special",
    "rarity": "mythic",
    "dmg": 3,
    "energy": 6,
    "critBonus": 0,
    "sprite": "wp_wiki_w48"
  },
  {
    "id": "wiki_w49",
    "name": "养剑葫",
    "desc": "江湖没什么好的，就是酒还行",
    "category": "melee",
    "rarity": "epic",
    "dmg": 4,
    "energy": 6,
    "critBonus": 0,
    "sprite": "wp_wiki_w49"
  },
  {
    "id": "wiki_w50",
    "name": "冥王长刃",
    "desc": "冥王长刃",
    "category": "special",
    "rarity": "mythic",
    "dmg": 12,
    "energy": 0,
    "critBonus": 0,
    "sprite": "wp_wiki_w50"
  },
  {
    "id": "wiki_w51",
    "name": "冰与火之鹰",
    "desc": "燃烧心火，击溃四方。永冻坚冰，镇守八荒",
    "category": "gun",
    "rarity": "rare",
    "dmg": 4,
    "energy": 2,
    "critBonus": 15,
    "sprite": "wp_wiki_w51"
  },
  {
    "id": "wiki_w52",
    "name": "冰川",
    "desc": "一把装载了冰冻弹的狙击步枪",
    "category": "sniper",
    "rarity": "rare",
    "dmg": 10,
    "energy": 4,
    "critBonus": 30,
    "sprite": "wp_wiki_w52"
  },
  {
    "id": "wiki_w53",
    "name": "冰枪",
    "desc": "冰枪",
    "category": "special",
    "rarity": "rare",
    "dmg": 11,
    "energy": 2,
    "critBonus": 26,
    "sprite": "wp_wiki_w53"
  },
  {
    "id": "wiki_w54",
    "name": "冰爆",
    "desc": "冰爆",
    "category": "launcher",
    "rarity": "epic",
    "dmg": 15,
    "energy": 5,
    "critBonus": 0,
    "sprite": "wp_wiki_w54"
  },
  {
    "id": "wiki_w55",
    "name": "冰锥",
    "desc": "快丢快丢，要化了要化了要化了！",
    "category": "special",
    "rarity": "rare",
    "dmg": 8,
    "energy": 5,
    "critBonus": 25,
    "sprite": "wp_wiki_w55"
  },
  {
    "id": "wiki_w56",
    "name": "冰霜战斧",
    "desc": "冰霜战斧",
    "category": "melee",
    "rarity": "epic",
    "dmg": 8,
    "energy": 3,
    "critBonus": 8,
    "sprite": "wp_wiki_w56"
  },
  {
    "id": "wiki_w57",
    "name": "冲锋枪三代",
    "desc": "冲锋枪三代",
    "category": "smg",
    "rarity": "rare",
    "dmg": 4,
    "energy": 1,
    "critBonus": 0,
    "sprite": "wp_wiki_w57"
  },
  {
    "id": "wiki_w58",
    "name": "冲锋枪二代",
    "desc": "冲锋枪二代",
    "category": "smg",
    "rarity": "good",
    "dmg": 2,
    "energy": 1,
    "critBonus": 30,
    "sprite": "wp_wiki_w58"
  },
  {
    "id": "wiki_w59",
    "name": "冲锋枪四代",
    "desc": "冲锋枪四代",
    "category": "rifle",
    "rarity": "epic",
    "dmg": 2,
    "energy": 2,
    "critBonus": 0,
    "sprite": "wp_wiki_w59"
  },
  {
    "id": "wiki_w60",
    "name": "刀与火铳",
    "desc": "刀与火铳",
    "category": "special",
    "rarity": "common",
    "dmg": 6,
    "energy": 2,
    "critBonus": 10,
    "sprite": "wp_wiki_w60"
  },
  {
    "id": "wiki_w61",
    "name": "刀与火铳（升级版）",
    "desc": "刀与火铳（升级版）",
    "category": "special",
    "rarity": "good",
    "dmg": 8,
    "energy": 2,
    "critBonus": 20,
    "sprite": "wp_wiki_w61"
  },
  {
    "id": "wiki_w62",
    "name": "刀刀烈火",
    "desc": "刀刀烈火",
    "category": "melee",
    "rarity": "epic",
    "dmg": 12,
    "energy": 0,
    "critBonus": 10,
    "sprite": "wp_wiki_w62"
  },
  {
    "id": "wiki_w63",
    "name": "刀盾",
    "desc": "刀盾",
    "category": "melee",
    "rarity": "common",
    "dmg": 6,
    "energy": 0,
    "critBonus": 0,
    "sprite": "wp_wiki_w63"
  },
  {
    "id": "wiki_w64",
    "name": "刀鱼",
    "desc": "刀鱼",
    "category": "melee",
    "rarity": "epic",
    "dmg": 12,
    "energy": 0,
    "critBonus": 5,
    "sprite": "wp_wiki_w64"
  },
  {
    "id": "wiki_w65",
    "name": "分子一文字",
    "desc": "分子一文字",
    "category": "melee",
    "rarity": "common",
    "dmg": 3,
    "energy": 1,
    "critBonus": 20,
    "sprite": "wp_wiki_w65"
  },
  {
    "id": "wiki_w66",
    "name": "分子一文字（升级版）",
    "desc": "分子一文字（升级版）",
    "category": "melee",
    "rarity": "good",
    "dmg": 4,
    "energy": 1,
    "critBonus": 30,
    "sprite": "wp_wiki_w66"
  },
  {
    "id": "wiki_w67",
    "name": "分裂者",
    "desc": "分手吧！",
    "category": "smg",
    "rarity": "common",
    "dmg": 5,
    "energy": 2,
    "critBonus": 5,
    "sprite": "wp_wiki_w67"
  },
  {
    "id": "wiki_w68",
    "name": "刮刮乐",
    "desc": "刮刮乐",
    "category": "special",
    "rarity": "common",
    "dmg": 2,
    "energy": 0,
    "critBonus": 30,
    "sprite": "wp_wiki_w68"
  },
  {
    "id": "wiki_w69",
    "name": "刺剑",
    "desc": "我会闪现……撞枪口上",
    "category": "melee",
    "rarity": "common",
    "dmg": 6,
    "energy": 0,
    "critBonus": 30,
    "sprite": "wp_wiki_w69"
  },
  {
    "id": "wiki_w70",
    "name": "刺枪",
    "desc": "二战片场怎么走?",
    "category": "sniper",
    "rarity": "good",
    "dmg": 2,
    "energy": 3,
    "critBonus": 15,
    "sprite": "wp_wiki_w70"
  },
  {
    "id": "wiki_w71",
    "name": "剑鱼",
    "desc": "剑鱼",
    "category": "melee",
    "rarity": "epic",
    "dmg": 8,
    "energy": 0,
    "critBonus": 30,
    "sprite": "wp_wiki_w71"
  },
  {
    "id": "wiki_w72",
    "name": "剧毒之鹰",
    "desc": "剧毒之鹰",
    "category": "gun",
    "rarity": "good",
    "dmg": 4,
    "energy": 1,
    "critBonus": 25,
    "sprite": "wp_wiki_w72"
  },
  {
    "id": "wiki_w73",
    "name": "剧毒织网者",
    "desc": "剧毒织网者",
    "category": "special",
    "rarity": "epic",
    "dmg": 3,
    "energy": 3,
    "critBonus": 20,
    "sprite": "wp_wiki_w73"
  },
  {
    "id": "wiki_w74",
    "name": "勾索枪",
    "desc": "勾索枪",
    "category": "smg",
    "rarity": "common",
    "dmg": 2,
    "energy": 3,
    "critBonus": 0,
    "sprite": "wp_wiki_w74"
  },
  {
    "id": "wiki_w75",
    "name": "千年笋",
    "desc": "这么好的竹子，不用来晒衣服可惜了",
    "category": "special",
    "rarity": "epic",
    "dmg": 8,
    "energy": 1,
    "critBonus": 8,
    "sprite": "wp_wiki_w75"
  },
  {
    "id": "wiki_w76",
    "name": "千本",
    "desc": "千本",
    "category": "special",
    "rarity": "good",
    "dmg": 2,
    "energy": 6,
    "critBonus": 30,
    "sprite": "wp_wiki_w76"
  },
  {
    "id": "wiki_w77",
    "name": "千本嘤",
    "desc": "千本嘤",
    "category": "special",
    "rarity": "epic",
    "dmg": 3,
    "energy": 5,
    "critBonus": 30,
    "sprite": "wp_wiki_w77"
  },
  {
    "id": "wiki_w78",
    "name": "千束",
    "desc": "千束",
    "category": "special",
    "rarity": "epic",
    "dmg": 2,
    "energy": 6,
    "critBonus": 0,
    "sprite": "wp_wiki_w78"
  },
  {
    "id": "wiki_w79",
    "name": "占星法杖",
    "desc": "占星法杖",
    "category": "staff",
    "rarity": "common",
    "dmg": 3,
    "energy": 1,
    "critBonus": 10,
    "sprite": "wp_wiki_w79"
  },
  {
    "id": "wiki_w80",
    "name": "占星魔杖",
    "desc": "占星魔杖",
    "category": "staff",
    "rarity": "good",
    "dmg": 4,
    "energy": 1,
    "critBonus": 10,
    "sprite": "wp_wiki_w80"
  },
  {
    "id": "wiki_w81",
    "name": "卡顿激光枪",
    "desc": "卡顿激光枪",
    "category": "special",
    "rarity": "epic",
    "dmg": 8,
    "energy": 2,
    "critBonus": 0,
    "sprite": "wp_wiki_w81"
  },
  {
    "id": "wiki_w82",
    "name": "卫星浮游炮",
    "desc": "卫星浮游炮",
    "category": "special",
    "rarity": "common",
    "dmg": 3,
    "energy": 1,
    "critBonus": 0,
    "sprite": "wp_wiki_w82"
  },
  {
    "id": "wiki_w83",
    "name": "卫星浮游炮（升级版）",
    "desc": "卫星浮游炮（升级版）",
    "category": "special",
    "rarity": "good",
    "dmg": 6,
    "energy": 2,
    "critBonus": 0,
    "sprite": "wp_wiki_w83"
  },
  {
    "id": "wiki_w84",
    "name": "原型轨道枪",
    "desc": "原型轨道枪",
    "category": "special",
    "rarity": "rare",
    "dmg": 2,
    "energy": 5,
    "critBonus": 0,
    "sprite": "wp_wiki_w84"
  },
  {
    "id": "wiki_w85",
    "name": "双刃战斧",
    "desc": "大风车转呀转悠悠",
    "category": "melee",
    "rarity": "epic",
    "dmg": 10,
    "energy": 0,
    "critBonus": 0,
    "sprite": "wp_wiki_w85"
  },
  {
    "id": "wiki_w86",
    "name": "双节棍",
    "desc": "啊打！啊打！！啊打！！！",
    "category": "melee",
    "rarity": "rare",
    "dmg": 4,
    "energy": 0,
    "critBonus": 30,
    "sprite": "wp_wiki_w86"
  },
  {
    "id": "wiki_w87",
    "name": "古旧的近卫大剑",
    "desc": "古旧的近卫大剑",
    "category": "melee",
    "rarity": "good",
    "dmg": 7,
    "energy": 1,
    "critBonus": 10,
    "sprite": "wp_wiki_w87"
  },
  {
    "id": "wiki_w88",
    "name": "古老的弓",
    "desc": "古老的弓",
    "category": "bow",
    "rarity": "common",
    "dmg": 2,
    "energy": 2,
    "critBonus": 0,
    "sprite": "wp_wiki_w88"
  },
  {
    "id": "wiki_w89",
    "name": "古老的弓（升级版）",
    "desc": "古老的弓（升级版）",
    "category": "bow",
    "rarity": "good",
    "dmg": 2,
    "energy": 2,
    "critBonus": 0,
    "sprite": "wp_wiki_w89"
  },
  {
    "id": "wiki_w90",
    "name": "可恶激光枪",
    "desc": "不客观的说，我是把“好枪”",
    "category": "special",
    "rarity": "rare",
    "dmg": 5,
    "energy": 1,
    "critBonus": 10,
    "sprite": "wp_wiki_w90"
  },
  {
    "id": "wiki_w91",
    "name": "台球杆",
    "desc": "台球杆",
    "category": "special",
    "rarity": "epic",
    "dmg": 10,
    "energy": 2,
    "critBonus": 0,
    "sprite": "wp_wiki_w91"
  },
  {
    "id": "wiki_w92",
    "name": "咖喱棒",
    "desc": "这是主角用过的剑",
    "category": "melee",
    "rarity": "mythic",
    "dmg": 2,
    "energy": 6,
    "critBonus": 30,
    "sprite": "wp_wiki_w92"
  },
  {
    "id": "wiki_w93",
    "name": "哥布林长枪",
    "desc": "不得不夸一下哥布林工匠的手艺",
    "category": "melee",
    "rarity": "common",
    "dmg": 5,
    "energy": 0,
    "critBonus": 20,
    "sprite": "wp_wiki_w93"
  },
  {
    "id": "wiki_w94",
    "name": "喇叭",
    "desc": "没错，输出全靠吼",
    "category": "special",
    "rarity": "good",
    "dmg": 2,
    "energy": 2,
    "critBonus": 0,
    "sprite": "wp_wiki_w94"
  },
  {
    "id": "wiki_w95",
    "name": "喷气河豚",
    "desc": "喷气河豚",
    "category": "special",
    "rarity": "rare",
    "dmg": 8,
    "energy": 3,
    "critBonus": 15,
    "sprite": "wp_wiki_w95"
  },
  {
    "id": "wiki_w96",
    "name": "嘎嘣脆的骨头",
    "desc": "嘎嘣脆的骨头",
    "category": "special",
    "rarity": "common",
    "dmg": 6,
    "energy": 1,
    "critBonus": 14,
    "sprite": "wp_wiki_w96"
  },
  {
    "id": "wiki_w97",
    "name": "嘎嘣脆的骨头（升级版）",
    "desc": "嘎嘣脆的骨头（升级版）",
    "category": "special",
    "rarity": "good",
    "dmg": 8,
    "energy": 1,
    "critBonus": 14,
    "sprite": "wp_wiki_w97"
  },
  {
    "id": "wiki_w98",
    "name": "嘤嘤鹰",
    "desc": "嘤嘤鹰",
    "category": "special",
    "rarity": "epic",
    "dmg": 2,
    "energy": 3,
    "critBonus": 1,
    "sprite": "wp_wiki_w98"
  },
  {
    "id": "wiki_w99",
    "name": "嘴炮",
    "desc": "嘴炮",
    "category": "special",
    "rarity": "epic",
    "dmg": 2,
    "energy": 4,
    "critBonus": 0,
    "sprite": "wp_wiki_w99"
  },
  {
    "id": "wiki_w100",
    "name": "图标之笔",
    "desc": "图标之笔",
    "category": "smg",
    "rarity": "rare",
    "dmg": 3,
    "energy": 1,
    "critBonus": 20,
    "sprite": "wp_wiki_w100"
  },
  {
    "id": "wiki_w101",
    "name": "圆盾",
    "desc": "我可以像这样打上一整天！",
    "category": "special",
    "rarity": "rare",
    "dmg": 8,
    "energy": 3,
    "critBonus": 15,
    "sprite": "wp_wiki_w101"
  },
  {
    "id": "wiki_w102",
    "name": "圣诞礼物",
    "desc": "圣诞礼物",
    "category": "special",
    "rarity": "common",
    "dmg": 2,
    "energy": 3,
    "critBonus": 10,
    "sprite": "wp_wiki_w102"
  },
  {
    "id": "wiki_w103",
    "name": "地下水（崭新出厂）",
    "desc": "两秒十七发，轻松二十九杀～",
    "category": "gun",
    "rarity": "common",
    "dmg": 3,
    "energy": 0,
    "critBonus": 0,
    "sprite": "wp_wiki_w103"
  },
  {
    "id": "wiki_w104",
    "name": "塑料粘液枪",
    "desc": "塑料粘液枪",
    "category": "smg",
    "rarity": "common",
    "dmg": 2,
    "energy": 0,
    "critBonus": 18,
    "sprite": "wp_wiki_w104"
  },
  {
    "id": "wiki_w105",
    "name": "塞子",
    "desc": "别打我，我投翔",
    "category": "special",
    "rarity": "rare",
    "dmg": 5,
    "energy": 2,
    "critBonus": 20,
    "sprite": "wp_wiki_w105"
  },
  {
    "id": "wiki_w106",
    "name": "复古骑枪",
    "desc": "复古骑枪",
    "category": "melee",
    "rarity": "common",
    "dmg": 10,
    "energy": 0,
    "critBonus": 20,
    "sprite": "wp_wiki_w106"
  },
  {
    "id": "wiki_w107",
    "name": "外星之鹰",
    "desc": "我是来自外星的。连我自己都差点信了",
    "category": "gun",
    "rarity": "good",
    "dmg": 4,
    "energy": 0,
    "critBonus": 5,
    "sprite": "wp_wiki_w107"
  },
  {
    "id": "wiki_w108",
    "name": "多弹头导弹",
    "desc": "多弹头导弹",
    "category": "launcher",
    "rarity": "rare",
    "dmg": 9,
    "energy": 4,
    "critBonus": 0,
    "sprite": "wp_wiki_w108"
  },
  {
    "id": "wiki_w109",
    "name": "大容量粘液枪",
    "desc": "大容量粘液枪",
    "category": "smg",
    "rarity": "good",
    "dmg": 3,
    "energy": 0,
    "critBonus": 18,
    "sprite": "wp_wiki_w109"
  },
  {
    "id": "wiki_w110",
    "name": "大巫师的旧法杖",
    "desc": "大巫师的旧法杖",
    "category": "staff",
    "rarity": "good",
    "dmg": 3,
    "energy": 3,
    "critBonus": 30,
    "sprite": "wp_wiki_w110"
  },
  {
    "id": "wiki_w111",
    "name": "大菠萝",
    "desc": "大菠萝",
    "category": "smg",
    "rarity": "common",
    "dmg": 2,
    "energy": 1,
    "critBonus": 5,
    "sprite": "wp_wiki_w111"
  },
  {
    "id": "wiki_w112",
    "name": "大葱",
    "desc": "哒哒哒~啊~滴答滴~啊~滴答滴答滴答滴。。",
    "category": "special",
    "rarity": "good",
    "dmg": 4,
    "energy": 1,
    "critBonus": 12,
    "sprite": "wp_wiki_w112"
  },
  {
    "id": "wiki_w113",
    "name": "大雪狐",
    "desc": "每逢佳节……",
    "category": "smg",
    "rarity": "good",
    "dmg": 2,
    "energy": 1,
    "critBonus": 5,
    "sprite": "wp_wiki_w113"
  },
  {
    "id": "wiki_w114",
    "name": "天地通意拳",
    "desc": "天地通意拳",
    "category": "special",
    "rarity": "common",
    "dmg": 2,
    "energy": 0,
    "critBonus": 0,
    "sprite": "wp_wiki_w114"
  },
  {
    "id": "wiki_w115",
    "name": "天地通意拳（升级版）",
    "desc": "天地通意拳（升级版）",
    "category": "special",
    "rarity": "good",
    "dmg": 2,
    "energy": 0,
    "critBonus": 0,
    "sprite": "wp_wiki_w115"
  },
  {
    "id": "wiki_w116",
    "name": "天堂之拳",
    "desc": "黑蚊子胖次!",
    "category": "special",
    "rarity": "legend",
    "dmg": 2,
    "energy": 6,
    "critBonus": 0,
    "sprite": "wp_wiki_w116"
  },
  {
    "id": "wiki_w117",
    "name": "太乙拂尘·风",
    "desc": "太乙拂尘·风",
    "category": "special",
    "rarity": "mythic",
    "dmg": 2,
    "energy": 1,
    "critBonus": 0,
    "sprite": "wp_wiki_w117"
  },
  {
    "id": "wiki_w118",
    "name": "头套英雄机枪",
    "desc": "头套英雄机枪",
    "category": "smg",
    "rarity": "common",
    "dmg": 3,
    "energy": 1,
    "critBonus": 0,
    "sprite": "wp_wiki_w118"
  },
  {
    "id": "wiki_w119",
    "name": "女皇之抚",
    "desc": "女皇之抚",
    "category": "special",
    "rarity": "good",
    "dmg": 4,
    "energy": 0,
    "critBonus": 0,
    "sprite": "wp_wiki_w119"
  },
  {
    "id": "wiki_w120",
    "name": "女神锡杖",
    "desc": "女神锡杖",
    "category": "staff",
    "rarity": "rare",
    "dmg": 4,
    "energy": 2,
    "critBonus": 0,
    "sprite": "wp_wiki_w120"
  },
  {
    "id": "wiki_w121",
    "name": "如来神掌",
    "desc": "如来神掌",
    "category": "special",
    "rarity": "mythic",
    "dmg": 2,
    "energy": 3,
    "critBonus": 0,
    "sprite": "wp_wiki_w121"
  },
  {
    "id": "wiki_w122",
    "name": "妙妙枪",
    "desc": "妙妙枪",
    "category": "gun",
    "rarity": "mythic",
    "dmg": 2,
    "energy": 2,
    "critBonus": 0,
    "sprite": "wp_wiki_w122"
  },
  {
    "id": "wiki_w123",
    "name": "宁神",
    "desc": "宁神",
    "category": "sniper",
    "rarity": "legend",
    "dmg": 10,
    "energy": 6,
    "critBonus": 0,
    "sprite": "wp_wiki_w123"
  },
  {
    "id": "wiki_w124",
    "name": "守卫者",
    "desc": "守卫者",
    "category": "smg",
    "rarity": "good",
    "dmg": 3,
    "energy": 1,
    "critBonus": 12,
    "sprite": "wp_wiki_w124"
  },
  {
    "id": "wiki_w125",
    "name": "守卫者轨道炮",
    "desc": "守卫者轨道炮",
    "category": "special",
    "rarity": "common",
    "dmg": 2,
    "energy": 3,
    "critBonus": 0,
    "sprite": "wp_wiki_w125"
  },
  {
    "id": "wiki_w126",
    "name": "宙斯之矛",
    "desc": "宙斯之矛",
    "category": "special",
    "rarity": "legend",
    "dmg": 8,
    "energy": 4,
    "critBonus": 0,
    "sprite": "wp_wiki_w126"
  },
  {
    "id": "wiki_w127",
    "name": "审判者",
    "desc": "审判者",
    "category": "special",
    "rarity": "good",
    "dmg": 8,
    "energy": 3,
    "critBonus": 30,
    "sprite": "wp_wiki_w127"
  },
  {
    "id": "wiki_w128",
    "name": "密集火箭发射器",
    "desc": "尝试着将它的敌人炸成蜂窝",
    "category": "launcher",
    "rarity": "common",
    "dmg": 4,
    "energy": 4,
    "critBonus": 0,
    "sprite": "wp_wiki_w128"
  },
  {
    "id": "wiki_w129",
    "name": "寒光月华剑",
    "desc": "寒光月华剑",
    "category": "special",
    "rarity": "mythic",
    "dmg": 2,
    "energy": 3,
    "critBonus": 0,
    "sprite": "wp_wiki_w129"
  },
  {
    "id": "wiki_w130",
    "name": "寒鸦",
    "desc": "寒鸦",
    "category": "sniper",
    "rarity": "common",
    "dmg": 6,
    "energy": 2,
    "critBonus": 30,
    "sprite": "wp_wiki_w130"
  },
  {
    "id": "wiki_w131",
    "name": "寒鸦（升级版）",
    "desc": "寒鸦（升级版）",
    "category": "sniper",
    "rarity": "good",
    "dmg": 7,
    "energy": 2,
    "critBonus": 30,
    "sprite": "wp_wiki_w131"
  },
  {
    "id": "wiki_w132",
    "name": "导弹发射器",
    "desc": "自动追踪的炮弹，敌人绝望的呐喊",
    "category": "launcher",
    "rarity": "legend",
    "dmg": 2,
    "energy": 2,
    "critBonus": 0,
    "sprite": "wp_wiki_w132"
  },
  {
    "id": "wiki_w133",
    "name": "封灵战锤",
    "desc": "封灵战锤",
    "category": "melee",
    "rarity": "mythic",
    "dmg": 2,
    "energy": 4,
    "critBonus": 10,
    "sprite": "wp_wiki_w133"
  },
  {
    "id": "wiki_w134",
    "name": "小明小红（升级版）",
    "desc": "小明小红（升级版）",
    "category": "special",
    "rarity": "good",
    "dmg": 5,
    "energy": 1,
    "critBonus": 0,
    "sprite": "wp_wiki_w134"
  },
  {
    "id": "wiki_w135",
    "name": "小木筒",
    "desc": "小木筒",
    "category": "bow",
    "rarity": "epic",
    "dmg": 5,
    "energy": 0,
    "critBonus": 10,
    "sprite": "wp_wiki_w135"
  },
  {
    "id": "wiki_w136",
    "name": "少女的乌兹冲锋枪",
    "desc": "少女的乌兹冲锋枪",
    "category": "smg",
    "rarity": "epic",
    "dmg": 6,
    "energy": 3,
    "critBonus": 0,
    "sprite": "wp_wiki_w136"
  },
  {
    "id": "wiki_w137",
    "name": "少年勇者魔杖",
    "desc": "少年勇者魔杖",
    "category": "staff",
    "rarity": "epic",
    "dmg": 4,
    "energy": 2,
    "critBonus": 4,
    "sprite": "wp_wiki_w137"
  },
  {
    "id": "wiki_w138",
    "name": "尘封近卫法师之杖",
    "desc": "尘封近卫法师之杖",
    "category": "staff",
    "rarity": "good",
    "dmg": 2,
    "energy": 2,
    "critBonus": 0,
    "sprite": "wp_wiki_w138"
  },
  {
    "id": "wiki_w139",
    "name": "尚方宝剑",
    "desc": "来自上个朝代的剑……",
    "category": "special",
    "rarity": "good",
    "dmg": 8,
    "energy": 0,
    "critBonus": 19,
    "sprite": "wp_wiki_w139"
  },
  {
    "id": "wiki_w140",
    "name": "屠龙宝刀",
    "desc": "屠龙宝刀",
    "category": "special",
    "rarity": "mythic",
    "dmg": 10,
    "energy": 5,
    "critBonus": 20,
    "sprite": "wp_wiki_w140"
  },
  {
    "id": "wiki_w141",
    "name": "岩浆机枪",
    "desc": "我来自火山",
    "category": "smg",
    "rarity": "common",
    "dmg": 4,
    "energy": 1,
    "critBonus": 0,
    "sprite": "wp_wiki_w141"
  },
  {
    "id": "wiki_w142",
    "name": "崭新的手枪",
    "desc": "崭新的手枪",
    "category": "gun",
    "rarity": "good",
    "dmg": 4,
    "energy": 0,
    "critBonus": 0,
    "sprite": "wp_wiki_w142"
  },
  {
    "id": "wiki_w143",
    "name": "巨型枫叶",
    "desc": "巨型枫叶",
    "category": "staff",
    "rarity": "epic",
    "dmg": 12,
    "energy": 0,
    "critBonus": 10,
    "sprite": "wp_wiki_w143"
  },
  {
    "id": "wiki_w144",
    "name": "巨巨雪狐",
    "desc": "巨巨雪狐",
    "category": "smg",
    "rarity": "epic",
    "dmg": 2,
    "energy": 2,
    "critBonus": 5,
    "sprite": "wp_wiki_w144"
  },
  {
    "id": "wiki_w145",
    "name": "巨雪狐",
    "desc": "暑假后的雪狐",
    "category": "smg",
    "rarity": "rare",
    "dmg": 2,
    "energy": 2,
    "critBonus": 5,
    "sprite": "wp_wiki_w145"
  },
  {
    "id": "wiki_w146",
    "name": "巫师法杖",
    "desc": "巫师法杖",
    "category": "staff",
    "rarity": "rare",
    "dmg": 3,
    "energy": 3,
    "critBonus": 10,
    "sprite": "wp_wiki_w146"
  },
  {
    "id": "wiki_w147",
    "name": "巴巴六的斧子",
    "desc": "巴巴六的斧子",
    "category": "melee",
    "rarity": "common",
    "dmg": 4,
    "energy": 0,
    "critBonus": 10,
    "sprite": "wp_wiki_w147"
  },
  {
    "id": "wiki_w148",
    "name": "布朗线圈炮",
    "desc": "子弹做布朗运动",
    "category": "shotgun",
    "rarity": "rare",
    "dmg": 3,
    "energy": 5,
    "critBonus": 20,
    "sprite": "wp_wiki_w148"
  },
  {
    "id": "wiki_w149",
    "name": "希望",
    "desc": "希望",
    "category": "special",
    "rarity": "common",
    "dmg": 2,
    "energy": 6,
    "critBonus": 0,
    "sprite": "wp_wiki_w149"
  },
  {
    "id": "wiki_w150",
    "name": "干草叉",
    "desc": "工农武装割据",
    "category": "melee",
    "rarity": "common",
    "dmg": 8,
    "energy": 0,
    "critBonus": 0,
    "sprite": "wp_wiki_w150"
  },
  {
    "id": "wiki_w151",
    "name": "平底锅（升级版）",
    "desc": "平底锅（升级版）",
    "category": "melee",
    "rarity": "good",
    "dmg": 10,
    "energy": 1,
    "critBonus": 30,
    "sprite": "wp_wiki_w151"
  },
  {
    "id": "wiki_w152",
    "name": "幻影之刃",
    "desc": "幻影之刃",
    "category": "melee",
    "rarity": "common",
    "dmg": 6,
    "energy": 0,
    "critBonus": 20,
    "sprite": "wp_wiki_w152"
  },
  {
    "id": "wiki_w153",
    "name": "幻影魔刃",
    "desc": "幻影魔刃",
    "category": "melee",
    "rarity": "good",
    "dmg": 6,
    "energy": 0,
    "critBonus": 20,
    "sprite": "wp_wiki_w153"
  },
  {
    "id": "wiki_w154",
    "name": "床子弩",
    "desc": "今有纹车弩，中七百步，攻城拔垒用之",
    "category": "bow",
    "rarity": "epic",
    "dmg": 2,
    "energy": 3,
    "critBonus": 0,
    "sprite": "wp_wiki_w154"
  },
  {
    "id": "wiki_w155",
    "name": "开采者",
    "desc": "开采者",
    "category": "melee",
    "rarity": "good",
    "dmg": 7,
    "energy": 0,
    "critBonus": 25,
    "sprite": "wp_wiki_w155"
  },
  {
    "id": "wiki_w156",
    "name": "弹射冲锋枪",
    "desc": "弹射冲锋枪",
    "category": "smg",
    "rarity": "good",
    "dmg": 3,
    "energy": 1,
    "critBonus": 20,
    "sprite": "wp_wiki_w156"
  },
  {
    "id": "wiki_w157",
    "name": "弹射狙击枪",
    "desc": "弹射狙击枪",
    "category": "sniper",
    "rarity": "epic",
    "dmg": 10,
    "energy": 4,
    "critBonus": 30,
    "sprite": "wp_wiki_w157"
  },
  {
    "id": "wiki_w158",
    "name": "弹射轨道炮",
    "desc": "弹射轨道炮",
    "category": "special",
    "rarity": "rare",
    "dmg": 2,
    "energy": 4,
    "critBonus": 0,
    "sprite": "wp_wiki_w158"
  },
  {
    "id": "wiki_w159",
    "name": "弹弓",
    "desc": "弹弓",
    "category": "bow",
    "rarity": "common",
    "dmg": 2,
    "energy": 1,
    "critBonus": 0,
    "sprite": "wp_wiki_w159"
  },
  {
    "id": "wiki_w160",
    "name": "强力分裂者",
    "desc": "精神分裂?我和我和我可没有这种毛病",
    "category": "smg",
    "rarity": "good",
    "dmg": 6,
    "energy": 3,
    "critBonus": 10,
    "sprite": "wp_wiki_w160"
  },
  {
    "id": "wiki_w161",
    "name": "强化突击步枪",
    "desc": "我已经进化成pro了，来见识见识我新技能",
    "category": "rifle",
    "rarity": "rare",
    "dmg": 2,
    "energy": 1,
    "critBonus": 5,
    "sprite": "wp_wiki_w161"
  },
  {
    "id": "wiki_w162",
    "name": "强化突击步枪 +",
    "desc": "强化突击步枪 +",
    "category": "rifle",
    "rarity": "epic",
    "dmg": 3,
    "energy": 1,
    "critBonus": 5,
    "sprite": "wp_wiki_w162"
  },
  {
    "id": "wiki_w163",
    "name": "强化霰弹枪",
    "desc": "强化霰弹枪",
    "category": "shotgun",
    "rarity": "common",
    "dmg": 4,
    "energy": 3,
    "critBonus": 8,
    "sprite": "wp_wiki_w163"
  },
  {
    "id": "wiki_w164",
    "name": "强弓",
    "desc": "比弓更强，更柔韧",
    "category": "bow",
    "rarity": "common",
    "dmg": 2,
    "energy": 2,
    "critBonus": 0,
    "sprite": "wp_wiki_w164"
  },
  {
    "id": "wiki_w165",
    "name": "彩虹",
    "desc": "给你点颜色瞧瞧",
    "category": "shotgun",
    "rarity": "epic",
    "dmg": 4,
    "energy": 4,
    "critBonus": 20,
    "sprite": "wp_wiki_w165"
  },
  {
    "id": "wiki_w166",
    "name": "彩虹加特林",
    "desc": "彩虹加特林",
    "category": "shotgun",
    "rarity": "epic",
    "dmg": 2,
    "energy": 2,
    "critBonus": 0,
    "sprite": "wp_wiki_w166"
  },
  {
    "id": "wiki_w167",
    "name": "微风剑",
    "desc": "微风剑",
    "category": "melee",
    "rarity": "common",
    "dmg": 6,
    "energy": 0,
    "critBonus": 0,
    "sprite": "wp_wiki_w167"
  },
  {
    "id": "wiki_w168",
    "name": "怪物压缩器",
    "desc": "怪物压缩器",
    "category": "special",
    "rarity": "epic",
    "dmg": 4,
    "energy": 3,
    "critBonus": 10,
    "sprite": "wp_wiki_w168"
  },
  {
    "id": "wiki_w169",
    "name": "怪蟹巨螯",
    "desc": "怪蟹巨螯",
    "category": "melee",
    "rarity": "epic",
    "dmg": 8,
    "energy": 0,
    "critBonus": 30,
    "sprite": "wp_wiki_w169"
  },
  {
    "id": "wiki_w170",
    "name": "惊雷",
    "desc": "惊雷",
    "category": "bow",
    "rarity": "legend",
    "dmg": 2,
    "energy": 5,
    "critBonus": 0,
    "sprite": "wp_wiki_w170"
  },
  {
    "id": "wiki_w171",
    "name": "战斧",
    "desc": "For the Horde!",
    "category": "melee",
    "rarity": "common",
    "dmg": 10,
    "energy": 0,
    "critBonus": 10,
    "sprite": "wp_wiki_w171"
  },
  {
    "id": "wiki_w172",
    "name": "手刀",
    "desc": "手刀",
    "category": "melee",
    "rarity": "common",
    "dmg": 2,
    "energy": 0,
    "critBonus": 0,
    "sprite": "wp_wiki_w172"
  },
  {
    "id": "wiki_w173",
    "name": "手工鱼竿",
    "desc": "手工鱼竿",
    "category": "special",
    "rarity": "rare",
    "dmg": 2,
    "energy": 3,
    "critBonus": 0,
    "sprite": "wp_wiki_w173"
  },
  {
    "id": "wiki_w174",
    "name": "手里剑",
    "desc": "手里剑",
    "category": "special",
    "rarity": "common",
    "dmg": 3,
    "energy": 4,
    "critBonus": 10,
    "sprite": "wp_wiki_w174"
  },
  {
    "id": "wiki_w175",
    "name": "手骨回旋镖",
    "desc": "手骨回旋镖",
    "category": "special",
    "rarity": "good",
    "dmg": 6,
    "energy": 3,
    "critBonus": 0,
    "sprite": "wp_wiki_w175"
  },
  {
    "id": "wiki_w176",
    "name": "扑克牌",
    "desc": "扑克牌",
    "category": "special",
    "rarity": "rare",
    "dmg": 4,
    "energy": 3,
    "critBonus": 10,
    "sprite": "wp_wiki_w176"
  },
  {
    "id": "wiki_w177",
    "name": "扩散轨道炮",
    "desc": "扩散轨道炮",
    "category": "special",
    "rarity": "rare",
    "dmg": 2,
    "energy": 6,
    "critBonus": 0,
    "sprite": "wp_wiki_w177"
  },
  {
    "id": "wiki_w178",
    "name": "扫帚",
    "desc": "就算麻瓜也能很简单的使用它",
    "category": "special",
    "rarity": "good",
    "dmg": 3,
    "energy": 1,
    "critBonus": 5,
    "sprite": "wp_wiki_w178"
  },
  {
    "id": "wiki_w179",
    "name": "扳手",
    "desc": "工程师又把它落在地牢里了……",
    "category": "special",
    "rarity": "good",
    "dmg": 8,
    "energy": 4,
    "critBonus": 20,
    "sprite": "wp_wiki_w179"
  },
  {
    "id": "wiki_w180",
    "name": "拔粪宝",
    "desc": "拔粪宝",
    "category": "special",
    "rarity": "epic",
    "dmg": 6,
    "energy": 3,
    "critBonus": 20,
    "sprite": "wp_wiki_w180"
  },
  {
    "id": "wiki_w181",
    "name": "拳套（升级版）",
    "desc": "拳套（升级版）",
    "category": "special",
    "rarity": "good",
    "dmg": 6,
    "energy": 0,
    "critBonus": 5,
    "sprite": "wp_wiki_w181"
  },
  {
    "id": "wiki_w182",
    "name": "捆仙绳",
    "desc": "捆仙绳",
    "category": "special",
    "rarity": "mythic",
    "dmg": 4,
    "energy": 6,
    "critBonus": 0,
    "sprite": "wp_wiki_w182"
  },
  {
    "id": "wiki_w183",
    "name": "改良冲锋枪",
    "desc": "蝙蝠侠同款哦~",
    "category": "smg",
    "rarity": "good",
    "dmg": 4,
    "energy": 2,
    "critBonus": 15,
    "sprite": "wp_wiki_w183"
  },
  {
    "id": "wiki_w184",
    "name": "攻城弩",
    "desc": "无论什么，我只用Plus的！",
    "category": "bow",
    "rarity": "rare",
    "dmg": 15,
    "energy": 3,
    "critBonus": 30,
    "sprite": "wp_wiki_w184"
  },
  {
    "id": "wiki_w185",
    "name": "散射激光枪",
    "desc": "它本是一把普通的激光枪，直到有一天它得了散光",
    "category": "special",
    "rarity": "epic",
    "dmg": 4,
    "energy": 4,
    "critBonus": 10,
    "sprite": "wp_wiki_w185"
  },
  {
    "id": "wiki_w186",
    "name": "斗气拳",
    "desc": "斗气拳",
    "category": "special",
    "rarity": "common",
    "dmg": 5,
    "energy": 0,
    "critBonus": 0,
    "sprite": "wp_wiki_w186"
  },
  {
    "id": "wiki_w187",
    "name": "斧子",
    "desc": "斧子",
    "category": "melee",
    "rarity": "common",
    "dmg": 6,
    "energy": 0,
    "critBonus": 0,
    "sprite": "wp_wiki_w187"
  },
  {
    "id": "wiki_w188",
    "name": "斩首者",
    "desc": "斩首者",
    "category": "melee",
    "rarity": "good",
    "dmg": 13,
    "energy": 0,
    "critBonus": 30,
    "sprite": "wp_wiki_w188"
  },
  {
    "id": "wiki_w189",
    "name": "新年礼物",
    "desc": "新年礼物",
    "category": "special",
    "rarity": "common",
    "dmg": 2,
    "energy": 3,
    "critBonus": 10,
    "sprite": "wp_wiki_w189"
  },
  {
    "id": "wiki_w190",
    "name": "方天画戟",
    "desc": "谓之武者，扫六合，灭八方。",
    "category": "melee",
    "rarity": "good",
    "dmg": 10,
    "energy": 0,
    "critBonus": 15,
    "sprite": "wp_wiki_w190"
  },
  {
    "id": "wiki_w191",
    "name": "无尽恢复药水",
    "desc": "自古红蓝出cp，紫色不就是对基？",
    "category": "special",
    "rarity": "rare",
    "dmg": 4,
    "energy": 3,
    "critBonus": 0,
    "sprite": "wp_wiki_w191"
  },
  {
    "id": "wiki_w192",
    "name": "无尽生命药水",
    "desc": "小瓶装不老泉",
    "category": "special",
    "rarity": "good",
    "dmg": 4,
    "energy": 3,
    "critBonus": 0,
    "sprite": "wp_wiki_w192"
  },
  {
    "id": "wiki_w193",
    "name": "无尽能量药水",
    "desc": "有能量，无限量",
    "category": "special",
    "rarity": "good",
    "dmg": 4,
    "energy": 3,
    "critBonus": 0,
    "sprite": "wp_wiki_w193"
  },
  {
    "id": "wiki_w194",
    "name": "星云铳",
    "desc": "星云铳",
    "category": "special",
    "rarity": "mythic",
    "dmg": 4,
    "energy": 2,
    "critBonus": 0,
    "sprite": "wp_wiki_w194"
  },
  {
    "id": "wiki_w195",
    "name": "普拉萨莫尼克",
    "desc": "普拉萨莫尼克",
    "category": "special",
    "rarity": "epic",
    "dmg": 4,
    "energy": 3,
    "critBonus": 30,
    "sprite": "wp_wiki_w195"
  },
  {
    "id": "wiki_w196",
    "name": "普通鱼竿",
    "desc": "普通鱼竿",
    "category": "special",
    "rarity": "epic",
    "dmg": 2,
    "energy": 3,
    "critBonus": 0,
    "sprite": "wp_wiki_w196"
  },
  {
    "id": "wiki_w197",
    "name": "晶核之弓",
    "desc": "晶核之弓",
    "category": "special",
    "rarity": "mythic",
    "dmg": 2,
    "energy": 1,
    "critBonus": 0,
    "sprite": "wp_wiki_w197"
  },
  {
    "id": "wiki_w198",
    "name": "暗之书",
    "desc": "暗之书",
    "category": "staff",
    "rarity": "legend",
    "dmg": 2,
    "energy": 2,
    "critBonus": 10,
    "sprite": "wp_wiki_w198"
  },
  {
    "id": "wiki_w199",
    "name": "暗夜之镰",
    "desc": "开始收割！",
    "category": "melee",
    "rarity": "good",
    "dmg": 9,
    "energy": 0,
    "critBonus": 30,
    "sprite": "wp_wiki_w199"
  },
  {
    "id": "wiki_w200",
    "name": "暗星之钥",
    "desc": "暗星之钥",
    "category": "staff",
    "rarity": "common",
    "dmg": 8,
    "energy": 1,
    "critBonus": 10,
    "sprite": "wp_wiki_w200"
  },
  {
    "id": "wiki_w201",
    "name": "暗星之钥（升级版）",
    "desc": "暗星之钥（升级版）",
    "category": "staff",
    "rarity": "good",
    "dmg": 10,
    "energy": 1,
    "critBonus": 10,
    "sprite": "wp_wiki_w201"
  },
  {
    "id": "wiki_w202",
    "name": "暗红小鬼",
    "desc": "暗红小鬼",
    "category": "launcher",
    "rarity": "epic",
    "dmg": 5,
    "energy": 2,
    "critBonus": 10,
    "sprite": "wp_wiki_w202"
  },
  {
    "id": "wiki_w203",
    "name": "暗黑低语匕首",
    "desc": "深邃黑暗幻想",
    "category": "special",
    "rarity": "mythic",
    "dmg": 12,
    "energy": 4,
    "critBonus": 0,
    "sprite": "wp_wiki_w203"
  },
  {
    "id": "wiki_w204",
    "name": "有机后浪",
    "desc": "有机后浪",
    "category": "staff",
    "rarity": "rare",
    "dmg": 3,
    "energy": 3,
    "critBonus": 3,
    "sprite": "wp_wiki_w204"
  },
  {
    "id": "wiki_w205",
    "name": "木制十字架",
    "desc": "木制十字架",
    "category": "staff",
    "rarity": "common",
    "dmg": 2,
    "energy": 2,
    "critBonus": 0,
    "sprite": "wp_wiki_w205"
  },
  {
    "id": "wiki_w206",
    "name": "木制十字架（升级版）",
    "desc": "木制十字架（升级版）",
    "category": "staff",
    "rarity": "good",
    "dmg": 2,
    "energy": 2,
    "critBonus": 10,
    "sprite": "wp_wiki_w206"
  },
  {
    "id": "wiki_w207",
    "name": "木棍",
    "desc": "木棍",
    "category": "melee",
    "rarity": "common",
    "dmg": 7,
    "energy": 0,
    "critBonus": 8,
    "sprite": "wp_wiki_w207"
  },
  {
    "id": "wiki_w208",
    "name": "木锤",
    "desc": "木锤",
    "category": "melee",
    "rarity": "common",
    "dmg": 12,
    "energy": 0,
    "critBonus": 8,
    "sprite": "wp_wiki_w208"
  },
  {
    "id": "wiki_w209",
    "name": "机枪",
    "desc": "机枪",
    "category": "smg",
    "rarity": "common",
    "dmg": 3,
    "energy": 1,
    "critBonus": 5,
    "sprite": "wp_wiki_w209"
  },
  {
    "id": "wiki_w210",
    "name": "杀猪刀",
    "desc": "岁月是我的别称",
    "category": "melee",
    "rarity": "common",
    "dmg": 5,
    "energy": 0,
    "critBonus": 0,
    "sprite": "wp_wiki_w210"
  },
  {
    "id": "wiki_w211",
    "name": "极光",
    "desc": "被它瞄准的敌人只能看见眼前一亮",
    "category": "sniper",
    "rarity": "epic",
    "dmg": 16,
    "energy": 6,
    "critBonus": 30,
    "sprite": "wp_wiki_w211"
  },
  {
    "id": "wiki_w212",
    "name": "极电双星",
    "desc": "极电双星",
    "category": "special",
    "rarity": "common",
    "dmg": 3,
    "energy": 2,
    "critBonus": 15,
    "sprite": "wp_wiki_w212"
  },
  {
    "id": "wiki_w213",
    "name": "极电双星（升级版）",
    "desc": "极电双星（升级版）",
    "category": "special",
    "rarity": "good",
    "dmg": 4,
    "energy": 2,
    "critBonus": 30,
    "sprite": "wp_wiki_w213"
  },
  {
    "id": "wiki_w214",
    "name": "柳叶刀",
    "desc": "任务失败了就把我刺入你的胸口",
    "category": "melee",
    "rarity": "epic",
    "dmg": 8,
    "energy": 0,
    "critBonus": 15,
    "sprite": "wp_wiki_w214"
  },
  {
    "id": "wiki_w215",
    "name": "标枪",
    "desc": "标枪",
    "category": "special",
    "rarity": "common",
    "dmg": 8,
    "energy": 2,
    "critBonus": 5,
    "sprite": "wp_wiki_w215"
  },
  {
    "id": "wiki_w216",
    "name": "梦幻",
    "desc": "地图炮在此",
    "category": "special",
    "rarity": "legend",
    "dmg": 6,
    "energy": 2,
    "critBonus": 0,
    "sprite": "wp_wiki_w216"
  },
  {
    "id": "wiki_w217",
    "name": "棒球棍",
    "desc": "全！垒！打！",
    "category": "special",
    "rarity": "rare",
    "dmg": 8,
    "energy": 2,
    "critBonus": 30,
    "sprite": "wp_wiki_w217"
  },
  {
    "id": "wiki_w218",
    "name": "森弦",
    "desc": "森弦",
    "category": "shotgun",
    "rarity": "common",
    "dmg": 3,
    "energy": 3,
    "critBonus": 0,
    "sprite": "wp_wiki_w218"
  },
  {
    "id": "wiki_w219",
    "name": "森弦（升级版）",
    "desc": "森弦（升级版）",
    "category": "shotgun",
    "rarity": "good",
    "dmg": 4,
    "energy": 2,
    "critBonus": 10,
    "sprite": "wp_wiki_w219"
  },
  {
    "id": "wiki_w220",
    "name": "榴弹手枪",
    "desc": "榴弹手枪",
    "category": "gun",
    "rarity": "good",
    "dmg": 4,
    "energy": 1,
    "critBonus": 0,
    "sprite": "wp_wiki_w220"
  },
  {
    "id": "wiki_w221",
    "name": "榴弹机枪",
    "desc": "拥有它你一个人就是一支军队",
    "category": "smg",
    "rarity": "legend",
    "dmg": 2,
    "energy": 1,
    "critBonus": 18,
    "sprite": "wp_wiki_w221"
  },
  {
    "id": "wiki_w222",
    "name": "樱花霰弹枪",
    "desc": "优雅的绽放，墨染的樱花",
    "category": "shotgun",
    "rarity": "rare",
    "dmg": 8,
    "energy": 3,
    "critBonus": 25,
    "sprite": "wp_wiki_w222"
  },
  {
    "id": "wiki_w223",
    "name": "欠时代冲锋枪",
    "desc": "欠时代冲锋枪",
    "category": "smg",
    "rarity": "good",
    "dmg": 2,
    "energy": 0,
    "critBonus": 0,
    "sprite": "wp_wiki_w223"
  },
  {
    "id": "wiki_w224",
    "name": "欠欠时代冲锋枪",
    "desc": "欠欠时代冲锋枪",
    "category": "smg",
    "rarity": "common",
    "dmg": 2,
    "energy": 0,
    "critBonus": 0,
    "sprite": "wp_wiki_w224"
  },
  {
    "id": "wiki_w225",
    "name": "次元之握",
    "desc": "次元之握",
    "category": "special",
    "rarity": "common",
    "dmg": 3,
    "energy": 0,
    "critBonus": 10,
    "sprite": "wp_wiki_w225"
  },
  {
    "id": "wiki_w226",
    "name": "次元之握（升级版）",
    "desc": "次元之握（升级版）",
    "category": "special",
    "rarity": "good",
    "dmg": 4,
    "energy": 0,
    "critBonus": 10,
    "sprite": "wp_wiki_w226"
  },
  {
    "id": "wiki_w227",
    "name": "次时代冲锋枪",
    "desc": "时代！在召唤！",
    "category": "smg",
    "rarity": "good",
    "dmg": 3,
    "energy": 1,
    "critBonus": 0,
    "sprite": "wp_wiki_w227"
  },
  {
    "id": "wiki_w228",
    "name": "次次时代冲锋枪",
    "desc": "采用的等离子压缩机能极大节省能耗以增加弹数",
    "category": "smg",
    "rarity": "rare",
    "dmg": 2,
    "energy": 2,
    "critBonus": 25,
    "sprite": "wp_wiki_w228"
  },
  {
    "id": "wiki_w229",
    "name": "次次次时代冲锋枪",
    "desc": "来自未来的未来，装载着暗物质能源核心",
    "category": "smg",
    "rarity": "epic",
    "dmg": 2,
    "energy": 4,
    "critBonus": 10,
    "sprite": "wp_wiki_w229"
  },
  {
    "id": "wiki_w230",
    "name": "次次次次时代冲锋枪",
    "desc": "次次次次时代冲锋枪",
    "category": "special",
    "rarity": "legend",
    "dmg": 2,
    "energy": 5,
    "critBonus": 10,
    "sprite": "wp_wiki_w230"
  },
  {
    "id": "wiki_w231",
    "name": "死亡之轮",
    "desc": "死亡之轮",
    "category": "special",
    "rarity": "common",
    "dmg": 3,
    "energy": 2,
    "critBonus": 30,
    "sprite": "wp_wiki_w231"
  },
  {
    "id": "wiki_w232",
    "name": "死亡笔记",
    "desc": "猜猜我下一个要写谁的名字",
    "category": "special",
    "rarity": "mythic",
    "dmg": 2,
    "energy": 6,
    "critBonus": 0,
    "sprite": "wp_wiki_w232"
  },
  {
    "id": "wiki_w233",
    "name": "死神之息",
    "desc": "死神之息",
    "category": "melee",
    "rarity": "legend",
    "dmg": 9,
    "energy": 3,
    "critBonus": 30,
    "sprite": "wp_wiki_w233"
  },
  {
    "id": "wiki_w234",
    "name": "残破的近卫战弓",
    "desc": "残破的近卫战弓",
    "category": "bow",
    "rarity": "good",
    "dmg": 2,
    "energy": 3,
    "critBonus": 0,
    "sprite": "wp_wiki_w234"
  },
  {
    "id": "wiki_w235",
    "name": "毒飞镖",
    "desc": "注意点，别吸回去了…",
    "category": "special",
    "rarity": "rare",
    "dmg": 6,
    "energy": 3,
    "critBonus": 30,
    "sprite": "wp_wiki_w235"
  },
  {
    "id": "wiki_w236",
    "name": "水壶",
    "desc": "做一个快乐的园丁",
    "category": "special",
    "rarity": "common",
    "dmg": 2,
    "energy": 0,
    "critBonus": 0,
    "sprite": "wp_wiki_w236"
  },
  {
    "id": "wiki_w237",
    "name": "水晶弓",
    "desc": "天下武功，唯快不破",
    "category": "bow",
    "rarity": "rare",
    "dmg": 2,
    "energy": 3,
    "critBonus": 0,
    "sprite": "wp_wiki_w237"
  },
  {
    "id": "wiki_w238",
    "name": "沙罗曼蛇",
    "desc": "沙罗曼蛇",
    "category": "shotgun",
    "rarity": "epic",
    "dmg": 4,
    "energy": 4,
    "critBonus": 30,
    "sprite": "wp_wiki_w238"
  },
  {
    "id": "wiki_w239",
    "name": "法典（升级版）",
    "desc": "法典（升级版）",
    "category": "staff",
    "rarity": "good",
    "dmg": 3,
    "energy": 1,
    "critBonus": 10,
    "sprite": "wp_wiki_w239"
  },
  {
    "id": "wiki_w240",
    "name": "法晶之杖",
    "desc": "法晶之杖",
    "category": "special",
    "rarity": "mythic",
    "dmg": 16,
    "energy": 2,
    "critBonus": 0,
    "sprite": "wp_wiki_w240"
  },
  {
    "id": "wiki_w241",
    "name": "法杖",
    "desc": "很像一根烂木头，也许在你下次使用的时候就会断掉",
    "category": "staff",
    "rarity": "common",
    "dmg": 4,
    "energy": 3,
    "critBonus": 4,
    "sprite": "wp_wiki_w241"
  },
  {
    "id": "wiki_w242",
    "name": "法老之刃",
    "desc": "法老之刃",
    "category": "melee",
    "rarity": "mythic",
    "dmg": 8,
    "energy": 0,
    "critBonus": 0,
    "sprite": "wp_wiki_w242"
  },
  {
    "id": "wiki_w243",
    "name": "流星",
    "desc": "流星",
    "category": "smg",
    "rarity": "epic",
    "dmg": 2,
    "energy": 1,
    "critBonus": 22,
    "sprite": "wp_wiki_w243"
  },
  {
    "id": "wiki_w244",
    "name": "浪潮法杖",
    "desc": "浪潮法杖",
    "category": "staff",
    "rarity": "common",
    "dmg": 3,
    "energy": 3,
    "critBonus": 3,
    "sprite": "wp_wiki_w244"
  },
  {
    "id": "wiki_w245",
    "name": "海盗弯刀",
    "desc": "在海洋深处的沉船里打捞上来，将在骑士手中重见天日",
    "category": "melee",
    "rarity": "common",
    "dmg": 7,
    "energy": 0,
    "critBonus": 15,
    "sprite": "wp_wiki_w245"
  },
  {
    "id": "wiki_w246",
    "name": "海盗王舰炮",
    "desc": "海盗王舰炮",
    "category": "smg",
    "rarity": "legend",
    "dmg": 10,
    "energy": 5,
    "critBonus": 10,
    "sprite": "wp_wiki_w246"
  },
  {
    "id": "wiki_w247",
    "name": "深水激光鱼",
    "desc": "深水激光鱼",
    "category": "special",
    "rarity": "legend",
    "dmg": 3,
    "energy": 1,
    "critBonus": 22,
    "sprite": "wp_wiki_w247"
  },
  {
    "id": "wiki_w248",
    "name": "清风剑",
    "desc": "清风剑",
    "category": "melee",
    "rarity": "good",
    "dmg": 6,
    "energy": 0,
    "critBonus": 0,
    "sprite": "wp_wiki_w248"
  },
  {
    "id": "wiki_w249",
    "name": "湮灭化身",
    "desc": "湮灭化身",
    "category": "special",
    "rarity": "mythic",
    "dmg": 8,
    "energy": 3,
    "critBonus": 10,
    "sprite": "wp_wiki_w249"
  },
  {
    "id": "wiki_w250",
    "name": "漫游左轮",
    "desc": "漫游左轮",
    "category": "gun",
    "rarity": "legend",
    "dmg": 2,
    "energy": 3,
    "critBonus": 30,
    "sprite": "wp_wiki_w250"
  },
  {
    "id": "wiki_w251",
    "name": "激光雨",
    "desc": "激光雨",
    "category": "bow",
    "rarity": "epic",
    "dmg": 2,
    "energy": 4,
    "critBonus": 0,
    "sprite": "wp_wiki_w251"
  },
  {
    "id": "wiki_w252",
    "name": "激光鱼幼崽",
    "desc": "激光鱼幼崽",
    "category": "melee",
    "rarity": "rare",
    "dmg": 6,
    "energy": 0,
    "critBonus": 15,
    "sprite": "wp_wiki_w252"
  },
  {
    "id": "wiki_w253",
    "name": "激裂",
    "desc": "激裂",
    "category": "bow",
    "rarity": "legend",
    "dmg": 2,
    "energy": 4,
    "critBonus": 0,
    "sprite": "wp_wiki_w253"
  },
  {
    "id": "wiki_w254",
    "name": "火焰弓",
    "desc": "射出的箭会自动燃烧起来，曾经被当做烤肉架使",
    "category": "bow",
    "rarity": "rare",
    "dmg": 2,
    "energy": 3,
    "critBonus": 0,
    "sprite": "wp_wiki_w254"
  },
  {
    "id": "wiki_w255",
    "name": "火焰战斧",
    "desc": "火焰，净化万物生灵",
    "category": "melee",
    "rarity": "epic",
    "dmg": 8,
    "energy": 3,
    "critBonus": 30,
    "sprite": "wp_wiki_w255"
  },
  {
    "id": "wiki_w256",
    "name": "火箭炮一代",
    "desc": "没错我就是便携式二营长的意大利炮",
    "category": "launcher",
    "rarity": "legend",
    "dmg": 16,
    "energy": 5,
    "critBonus": 0,
    "sprite": "wp_wiki_w256"
  },
  {
    "id": "wiki_w257",
    "name": "火箭礼花",
    "desc": "火箭礼花",
    "category": "launcher",
    "rarity": "epic",
    "dmg": 15,
    "energy": 5,
    "critBonus": 0,
    "sprite": "wp_wiki_w257"
  },
  {
    "id": "wiki_w258",
    "name": "灰狐",
    "desc": "灰狐",
    "category": "bow",
    "rarity": "good",
    "dmg": 8,
    "energy": 3,
    "critBonus": 30,
    "sprite": "wp_wiki_w258"
  },
  {
    "id": "wiki_w259",
    "name": "灼热爪刃",
    "desc": "灼热爪刃",
    "category": "special",
    "rarity": "common",
    "dmg": 5,
    "energy": 0,
    "critBonus": 25,
    "sprite": "wp_wiki_w259"
  },
  {
    "id": "wiki_w260",
    "name": "灼热爪刃（升级版）",
    "desc": "灼热爪刃（升级版）",
    "category": "special",
    "rarity": "good",
    "dmg": 7,
    "energy": 0,
    "critBonus": 25,
    "sprite": "wp_wiki_w260"
  },
  {
    "id": "wiki_w261",
    "name": "烤尚方宝剑",
    "desc": "烤尚方宝剑",
    "category": "special",
    "rarity": "rare",
    "dmg": 10,
    "energy": 0,
    "critBonus": 20,
    "sprite": "wp_wiki_w261"
  },
  {
    "id": "wiki_w262",
    "name": "烤激光鱼",
    "desc": "烤激光鱼",
    "category": "special",
    "rarity": "legend",
    "dmg": 3,
    "energy": 0,
    "critBonus": 0,
    "sprite": "wp_wiki_w262"
  },
  {
    "id": "wiki_w263",
    "name": "烤肉",
    "desc": "烤肉",
    "category": "special",
    "rarity": "good",
    "dmg": 6,
    "energy": 0,
    "critBonus": 0,
    "sprite": "wp_wiki_w263"
  },
  {
    "id": "wiki_w264",
    "name": "烤萝卜",
    "desc": "烤萝卜",
    "category": "special",
    "rarity": "good",
    "dmg": 5,
    "energy": 1,
    "critBonus": 0,
    "sprite": "wp_wiki_w264"
  },
  {
    "id": "wiki_w265",
    "name": "烤葱",
    "desc": "烤葱",
    "category": "special",
    "rarity": "good",
    "dmg": 5,
    "energy": 1,
    "critBonus": 12,
    "sprite": "wp_wiki_w265"
  },
  {
    "id": "wiki_w266",
    "name": "烤鱼",
    "desc": "烤鱼",
    "category": "special",
    "rarity": "rare",
    "dmg": 2,
    "energy": 3,
    "critBonus": 0,
    "sprite": "wp_wiki_w266"
  },
  {
    "id": "wiki_w267",
    "name": "熔核之弓",
    "desc": "熔核之弓",
    "category": "bow",
    "rarity": "epic",
    "dmg": 2,
    "energy": 3,
    "critBonus": 0,
    "sprite": "wp_wiki_w267"
  },
  {
    "id": "wiki_w268",
    "name": "熔炉",
    "desc": "射出来自山下之王熔炉里的火焰",
    "category": "smg",
    "rarity": "rare",
    "dmg": 5,
    "energy": 2,
    "critBonus": 30,
    "sprite": "wp_wiki_w268"
  },
  {
    "id": "wiki_w269",
    "name": "爆气拳",
    "desc": "爆气拳",
    "category": "special",
    "rarity": "good",
    "dmg": 7,
    "energy": 0,
    "critBonus": 0,
    "sprite": "wp_wiki_w269"
  },
  {
    "id": "wiki_w270",
    "name": "爆炸弩",
    "desc": "使用优质二踢脚作为箭矢",
    "category": "bow",
    "rarity": "legend",
    "dmg": 12,
    "energy": 4,
    "critBonus": 25,
    "sprite": "wp_wiki_w270"
  },
  {
    "id": "wiki_w271",
    "name": "爪子",
    "desc": "爪子",
    "category": "special",
    "rarity": "common",
    "dmg": 2,
    "energy": 0,
    "critBonus": 0,
    "sprite": "wp_wiki_w271"
  },
  {
    "id": "wiki_w272",
    "name": "物理学圣剑",
    "desc": "物理学圣剑",
    "category": "special",
    "rarity": "common",
    "dmg": 8,
    "energy": 0,
    "critBonus": 5,
    "sprite": "wp_wiki_w272"
  },
  {
    "id": "wiki_w273",
    "name": "特别支援呼叫器",
    "desc": "特别支援呼叫器",
    "category": "special",
    "rarity": "mythic",
    "dmg": 2,
    "energy": 0,
    "critBonus": 0,
    "sprite": "wp_wiki_w273"
  },
  {
    "id": "wiki_w274",
    "name": "特种作战武器",
    "desc": "特种作战武器",
    "category": "special",
    "rarity": "common",
    "dmg": 3,
    "energy": 1,
    "critBonus": 10,
    "sprite": "wp_wiki_w274"
  },
  {
    "id": "wiki_w275",
    "name": "特种作战武器（升级版）",
    "desc": "特种作战武器（升级版）",
    "category": "special",
    "rarity": "good",
    "dmg": 4,
    "energy": 1,
    "critBonus": 10,
    "sprite": "wp_wiki_w275"
  },
  {
    "id": "wiki_w276",
    "name": "狼牙棒",
    "desc": "我的好兄弟，平底锅上哪儿去了？",
    "category": "melee",
    "rarity": "good",
    "dmg": 13,
    "energy": 0,
    "critBonus": 30,
    "sprite": "wp_wiki_w276"
  },
  {
    "id": "wiki_w277",
    "name": "猎人弓",
    "desc": "嘘～准备狩猎",
    "category": "bow",
    "rarity": "rare",
    "dmg": 8,
    "energy": 2,
    "critBonus": 0,
    "sprite": "wp_wiki_w277"
  },
  {
    "id": "wiki_w278",
    "name": "玄冥",
    "desc": "玄冥",
    "category": "smg",
    "rarity": "legend",
    "dmg": 6,
    "energy": 2,
    "critBonus": 10,
    "sprite": "wp_wiki_w278"
  },
  {
    "id": "wiki_w279",
    "name": "玉净瓶",
    "desc": "玉净瓶",
    "category": "special",
    "rarity": "mythic",
    "dmg": 2,
    "energy": 6,
    "critBonus": 0,
    "sprite": "wp_wiki_w279"
  },
  {
    "id": "wiki_w280",
    "name": "珺之弓",
    "desc": "珺之弓",
    "category": "bow",
    "rarity": "rare",
    "dmg": 2,
    "energy": 3,
    "critBonus": 0,
    "sprite": "wp_wiki_w280"
  },
  {
    "id": "wiki_w281",
    "name": "甜蜜蜜奶茶",
    "desc": "甜蜜蜜奶茶",
    "category": "special",
    "rarity": "rare",
    "dmg": 6,
    "energy": 2,
    "critBonus": 0,
    "sprite": "wp_wiki_w281"
  },
  {
    "id": "wiki_w282",
    "name": "电弧手里剑",
    "desc": "仙法·电解电容爆炸之术！",
    "category": "special",
    "rarity": "epic",
    "dmg": 3,
    "energy": 3,
    "critBonus": 0,
    "sprite": "wp_wiki_w282"
  },
  {
    "id": "wiki_w283",
    "name": "电磁轨道炮",
    "desc": "电磁轨道炮",
    "category": "special",
    "rarity": "epic",
    "dmg": 2,
    "energy": 3,
    "critBonus": 0,
    "sprite": "wp_wiki_w283"
  },
  {
    "id": "wiki_w284",
    "name": "电钻",
    "desc": "电钻",
    "category": "melee",
    "rarity": "epic",
    "dmg": 6,
    "energy": 1,
    "critBonus": 0,
    "sprite": "wp_wiki_w284"
  },
  {
    "id": "wiki_w285",
    "name": "瘟疫之杖（升级版）",
    "desc": "瘟疫之杖（升级版）",
    "category": "staff",
    "rarity": "good",
    "dmg": 2,
    "energy": 2,
    "critBonus": 10,
    "sprite": "wp_wiki_w285"
  },
  {
    "id": "wiki_w286",
    "name": "登山杖",
    "desc": "一起去爬山吗",
    "category": "special",
    "rarity": "common",
    "dmg": 2,
    "energy": 0,
    "critBonus": 0,
    "sprite": "wp_wiki_w286"
  },
  {
    "id": "wiki_w287",
    "name": "白隐机枪",
    "desc": "极其不稳定的高速机枪",
    "category": "smg",
    "rarity": "common",
    "dmg": 2,
    "energy": 3,
    "critBonus": 0,
    "sprite": "wp_wiki_w287"
  },
  {
    "id": "wiki_w288",
    "name": "百年萝卜",
    "desc": "无添加，不含防腐剂",
    "category": "special",
    "rarity": "rare",
    "dmg": 6,
    "energy": 1,
    "critBonus": 0,
    "sprite": "wp_wiki_w288"
  },
  {
    "id": "wiki_w289",
    "name": "皇家骑士短剑",
    "desc": "皇家骑士短剑",
    "category": "melee",
    "rarity": "common",
    "dmg": 4,
    "energy": 0,
    "critBonus": 0,
    "sprite": "wp_wiki_w289"
  },
  {
    "id": "wiki_w290",
    "name": "盾牌",
    "desc": "圣骑士同款盾牌",
    "category": "special",
    "rarity": "mythic",
    "dmg": 2,
    "energy": 2,
    "critBonus": 0,
    "sprite": "wp_wiki_w290"
  },
  {
    "id": "wiki_w291",
    "name": "真·火尖枪",
    "desc": "真·火尖枪",
    "category": "special",
    "rarity": "mythic",
    "dmg": 3,
    "energy": 0,
    "critBonus": 0,
    "sprite": "wp_wiki_w291"
  },
  {
    "id": "wiki_w292",
    "name": "真·芭蕉扇",
    "desc": "真·芭蕉扇",
    "category": "special",
    "rarity": "mythic",
    "dmg": 6,
    "energy": 6,
    "critBonus": 0,
    "sprite": "wp_wiki_w292"
  },
  {
    "id": "wiki_w293",
    "name": "短截散弹枪",
    "desc": "我不做散弹枪啦！乔乔！",
    "category": "shotgun",
    "rarity": "common",
    "dmg": 8,
    "energy": 3,
    "critBonus": 5,
    "sprite": "wp_wiki_w293"
  },
  {
    "id": "wiki_w294",
    "name": "石锤",
    "desc": "我没有开挂",
    "category": "melee",
    "rarity": "rare",
    "dmg": 16,
    "energy": 0,
    "critBonus": 30,
    "sprite": "wp_wiki_w294"
  },
  {
    "id": "wiki_w295",
    "name": "石龙炮",
    "desc": "石龙炮",
    "category": "special",
    "rarity": "common",
    "dmg": 10,
    "energy": 5,
    "critBonus": 0,
    "sprite": "wp_wiki_w295"
  },
  {
    "id": "wiki_w296",
    "name": "砍刀",
    "desc": "打打打打劫",
    "category": "melee",
    "rarity": "common",
    "dmg": 6,
    "energy": 0,
    "critBonus": 0,
    "sprite": "wp_wiki_w296"
  },
  {
    "id": "wiki_w297",
    "name": "破碎的剑刃",
    "desc": "破碎的剑刃",
    "category": "special",
    "rarity": "common",
    "dmg": 5,
    "energy": 3,
    "critBonus": 20,
    "sprite": "wp_wiki_w297"
  },
  {
    "id": "wiki_w298",
    "name": "破碎的剑柄",
    "desc": "破碎的剑柄",
    "category": "melee",
    "rarity": "common",
    "dmg": 8,
    "energy": 0,
    "critBonus": 0,
    "sprite": "wp_wiki_w298"
  },
  {
    "id": "wiki_w299",
    "name": "碎冰者",
    "desc": "极芒以至，碎裂成阴",
    "category": "special",
    "rarity": "rare",
    "dmg": 8,
    "energy": 3,
    "critBonus": 30,
    "sprite": "wp_wiki_w299"
  },
  {
    "id": "wiki_w300",
    "name": "神圣连枷（升级版）",
    "desc": "神圣连枷（升级版）",
    "category": "melee",
    "rarity": "good",
    "dmg": 2,
    "energy": 0,
    "critBonus": 0,
    "sprite": "wp_wiki_w300"
  },
  {
    "id": "wiki_w301",
    "name": "神祭之剑",
    "desc": "神祭之剑",
    "category": "special",
    "rarity": "mythic",
    "dmg": 16,
    "energy": 0,
    "critBonus": 10,
    "sprite": "wp_wiki_w301"
  },
  {
    "id": "wiki_w302",
    "name": "神秘商贩之枪",
    "desc": "神秘商贩之枪",
    "category": "smg",
    "rarity": "epic",
    "dmg": 3,
    "energy": 2,
    "critBonus": 10,
    "sprite": "wp_wiki_w302"
  },
  {
    "id": "wiki_w303",
    "name": "离子激光枪",
    "desc": "离子激光枪",
    "category": "special",
    "rarity": "epic",
    "dmg": 4,
    "energy": 1,
    "critBonus": 0,
    "sprite": "wp_wiki_w303"
  },
  {
    "id": "wiki_w304",
    "name": "离子激发枪",
    "desc": "离子激发枪",
    "category": "gun",
    "rarity": "common",
    "dmg": 2,
    "energy": 1,
    "critBonus": 10,
    "sprite": "wp_wiki_w304"
  },
  {
    "id": "wiki_w305",
    "name": "离子线圈炮",
    "desc": "正还是负？往哪边偏呢？",
    "category": "special",
    "rarity": "good",
    "dmg": 8,
    "energy": 4,
    "critBonus": 30,
    "sprite": "wp_wiki_w305"
  },
  {
    "id": "wiki_w306",
    "name": "离子聚变枪",
    "desc": "离子聚变枪",
    "category": "gun",
    "rarity": "good",
    "dmg": 3,
    "energy": 1,
    "critBonus": 10,
    "sprite": "wp_wiki_w306"
  },
  {
    "id": "wiki_w307",
    "name": "离子轨道炮",
    "desc": "离子轨道炮",
    "category": "special",
    "rarity": "good",
    "dmg": 2,
    "energy": 4,
    "critBonus": 0,
    "sprite": "wp_wiki_w307"
  },
  {
    "id": "wiki_w308",
    "name": "离子轨道炮第二代",
    "desc": "离子轨道炮第二代",
    "category": "special",
    "rarity": "rare",
    "dmg": 2,
    "energy": 4,
    "critBonus": 0,
    "sprite": "wp_wiki_w308"
  },
  {
    "id": "wiki_w309",
    "name": "种子枪",
    "desc": "歪比歪比？歪比巴伯",
    "category": "smg",
    "rarity": "epic",
    "dmg": 4,
    "energy": 1,
    "critBonus": 10,
    "sprite": "wp_wiki_w309"
  },
  {
    "id": "wiki_w310",
    "name": "突击步枪-战术精英版",
    "desc": "突击步枪-战术精英版",
    "category": "rifle",
    "rarity": "epic",
    "dmg": 2,
    "energy": 1,
    "critBonus": 5,
    "sprite": "wp_wiki_w310"
  },
  {
    "id": "wiki_w311",
    "name": "突击火箭",
    "desc": "疾风骤雨，天降正义",
    "category": "rifle",
    "rarity": "rare",
    "dmg": 3,
    "energy": 1,
    "critBonus": 0,
    "sprite": "wp_wiki_w311"
  },
  {
    "id": "wiki_w312",
    "name": "窜天猴",
    "desc": "窜天猴",
    "category": "launcher",
    "rarity": "good",
    "dmg": 4,
    "energy": 3,
    "critBonus": 0,
    "sprite": "wp_wiki_w312"
  },
  {
    "id": "wiki_w313",
    "name": "竹子",
    "desc": "竹子",
    "category": "special",
    "rarity": "good",
    "dmg": 5,
    "energy": 1,
    "critBonus": 4,
    "sprite": "wp_wiki_w313"
  },
  {
    "id": "wiki_w314",
    "name": "等离子之鹰",
    "desc": "等离子之鹰",
    "category": "gun",
    "rarity": "rare",
    "dmg": 4,
    "energy": 1,
    "critBonus": 30,
    "sprite": "wp_wiki_w314"
  },
  {
    "id": "wiki_w315",
    "name": "箱子",
    "desc": "箱子",
    "category": "special",
    "rarity": "common",
    "dmg": 2,
    "energy": 2,
    "critBonus": 0,
    "sprite": "wp_wiki_w315"
  },
  {
    "id": "wiki_w316",
    "name": "篮球",
    "desc": "为何不来一场紧张而又刺激的球赛呢",
    "category": "special",
    "rarity": "common",
    "dmg": 5,
    "energy": 1,
    "critBonus": 0,
    "sprite": "wp_wiki_w316"
  },
  {
    "id": "wiki_w317",
    "name": "粒子之鹰",
    "desc": "弹弹弹，弹走鱼尾纹",
    "category": "gun",
    "rarity": "good",
    "dmg": 3,
    "energy": 1,
    "critBonus": 0,
    "sprite": "wp_wiki_w317"
  },
  {
    "id": "wiki_w318",
    "name": "粽叶枪",
    "desc": "粽叶枪",
    "category": "smg",
    "rarity": "rare",
    "dmg": 3,
    "energy": 1,
    "critBonus": 0,
    "sprite": "wp_wiki_w318"
  },
  {
    "id": "wiki_w319",
    "name": "精准机关枪",
    "desc": "300%的精准",
    "category": "smg",
    "rarity": "common",
    "dmg": 2,
    "energy": 2,
    "critBonus": 10,
    "sprite": "wp_wiki_w319"
  },
  {
    "id": "wiki_w320",
    "name": "精密勾索枪",
    "desc": "精密勾索枪",
    "category": "smg",
    "rarity": "good",
    "dmg": 4,
    "energy": 3,
    "critBonus": 0,
    "sprite": "wp_wiki_w320"
  },
  {
    "id": "wiki_w321",
    "name": "精致法杖",
    "desc": "这是法杖，它很精致，童叟无欺",
    "category": "staff",
    "rarity": "legend",
    "dmg": 4,
    "energy": 6,
    "critBonus": 4,
    "sprite": "wp_wiki_w321"
  },
  {
    "id": "wiki_w322",
    "name": "糖葫芦",
    "desc": "糖葫芦",
    "category": "special",
    "rarity": "common",
    "dmg": 6,
    "energy": 0,
    "critBonus": 30,
    "sprite": "wp_wiki_w322"
  },
  {
    "id": "wiki_w323",
    "name": "素颜相机",
    "desc": "素颜相机",
    "category": "special",
    "rarity": "common",
    "dmg": 2,
    "energy": 2,
    "critBonus": 0,
    "sprite": "wp_wiki_w323"
  },
  {
    "id": "wiki_w324",
    "name": "红色响尾蛇",
    "desc": "知道什么叫火蛇狂舞吗",
    "category": "shotgun",
    "rarity": "good",
    "dmg": 3,
    "energy": 4,
    "critBonus": 0,
    "sprite": "wp_wiki_w324"
  },
  {
    "id": "wiki_w325",
    "name": "红色恶魔角",
    "desc": "红色恶魔角",
    "category": "staff",
    "rarity": "epic",
    "dmg": 3,
    "energy": 3,
    "critBonus": 25,
    "sprite": "wp_wiki_w325"
  },
  {
    "id": "wiki_w326",
    "name": "红黄蓝冲锋枪",
    "desc": "红黄蓝冲锋枪",
    "category": "smg",
    "rarity": "good",
    "dmg": 3,
    "energy": 1,
    "critBonus": 20,
    "sprite": "wp_wiki_w326"
  },
  {
    "id": "wiki_w327",
    "name": "红龙机枪",
    "desc": "龙的咆哮是由远至近的",
    "category": "smg",
    "rarity": "common",
    "dmg": 3,
    "energy": 1,
    "critBonus": 0,
    "sprite": "wp_wiki_w327"
  },
  {
    "id": "wiki_w328",
    "name": "线圈炮",
    "desc": "I=U/R",
    "category": "special",
    "rarity": "common",
    "dmg": 6,
    "energy": 3,
    "critBonus": 20,
    "sprite": "wp_wiki_w328"
  },
  {
    "id": "wiki_w329",
    "name": "细胞凝液",
    "desc": "细胞凝液",
    "category": "special",
    "rarity": "mythic",
    "dmg": 2,
    "energy": 0,
    "critBonus": 0,
    "sprite": "wp_wiki_w329"
  },
  {
    "id": "wiki_w330",
    "name": "织网者",
    "desc": "织网者",
    "category": "special",
    "rarity": "rare",
    "dmg": 2,
    "energy": 3,
    "critBonus": 22,
    "sprite": "wp_wiki_w330"
  },
  {
    "id": "wiki_w331",
    "name": "绳索枪",
    "desc": "你不会真以为你可以变成兵长吧",
    "category": "melee",
    "rarity": "good",
    "dmg": 2,
    "energy": 2,
    "critBonus": 0,
    "sprite": "wp_wiki_w331"
  },
  {
    "id": "wiki_w332",
    "name": "绿色响尾蛇",
    "desc": "对，就像毒蛇一样迅猛",
    "category": "shotgun",
    "rarity": "good",
    "dmg": 3,
    "energy": 4,
    "critBonus": 30,
    "sprite": "wp_wiki_w332"
  },
  {
    "id": "wiki_w333",
    "name": "绿色的盆",
    "desc": "你必将加冕为王",
    "category": "special",
    "rarity": "good",
    "dmg": 2,
    "energy": 1,
    "critBonus": 30,
    "sprite": "wp_wiki_w333"
  },
  {
    "id": "wiki_w334",
    "name": "编号041",
    "desc": "编号041",
    "category": "special",
    "rarity": "common",
    "dmg": 3,
    "energy": 3,
    "critBonus": 10,
    "sprite": "wp_wiki_w334"
  },
  {
    "id": "wiki_w335",
    "name": "编号041（升级版）",
    "desc": "编号041（升级版）",
    "category": "special",
    "rarity": "good",
    "dmg": 3,
    "energy": 3,
    "critBonus": 10,
    "sprite": "wp_wiki_w335"
  },
  {
    "id": "wiki_w336",
    "name": "网球拍",
    "desc": "网球拍",
    "category": "special",
    "rarity": "good",
    "dmg": 8,
    "energy": 0,
    "critBonus": 30,
    "sprite": "wp_wiki_w336"
  },
  {
    "id": "wiki_w337",
    "name": "网瘾少女",
    "desc": "我蓝朋友呢？",
    "category": "special",
    "rarity": "rare",
    "dmg": 2,
    "energy": 0,
    "critBonus": 0,
    "sprite": "wp_wiki_w337"
  },
  {
    "id": "wiki_w338",
    "name": "网瘾少年",
    "desc": "知道自己错在哪里了吗？",
    "category": "special",
    "rarity": "rare",
    "dmg": 2,
    "energy": 0,
    "critBonus": 0,
    "sprite": "wp_wiki_w338"
  },
  {
    "id": "wiki_w339",
    "name": "罪恶克星",
    "desc": "罪恶克星",
    "category": "gun",
    "rarity": "common",
    "dmg": 8,
    "energy": 2,
    "critBonus": 5,
    "sprite": "wp_wiki_w339"
  },
  {
    "id": "wiki_w340",
    "name": "罪恶克星（升级版）",
    "desc": "罪恶克星（升级版）",
    "category": "gun",
    "rarity": "good",
    "dmg": 8,
    "energy": 2,
    "critBonus": 20,
    "sprite": "wp_wiki_w340"
  },
  {
    "id": "wiki_w341",
    "name": "羊叫兽",
    "desc": "羊叫兽",
    "category": "special",
    "rarity": "legend",
    "dmg": 2,
    "energy": 0,
    "critBonus": 30,
    "sprite": "wp_wiki_w341"
  },
  {
    "id": "wiki_w342",
    "name": "美国卡宾枪",
    "desc": "一道光，穿破长夜",
    "category": "rifle",
    "rarity": "common",
    "dmg": 4,
    "energy": 1,
    "critBonus": 0,
    "sprite": "wp_wiki_w342"
  },
  {
    "id": "wiki_w343",
    "name": "美杜莎之瞳",
    "desc": "美杜莎之瞳",
    "category": "special",
    "rarity": "rare",
    "dmg": 12,
    "energy": 2,
    "critBonus": 30,
    "sprite": "wp_wiki_w343"
  },
  {
    "id": "wiki_w344",
    "name": "群星之弓",
    "desc": "群星之弓",
    "category": "bow",
    "rarity": "legend",
    "dmg": 2,
    "energy": 5,
    "critBonus": 0,
    "sprite": "wp_wiki_w344"
  },
  {
    "id": "wiki_w345",
    "name": "羽毛弩",
    "desc": "简单来说就是一个发射的箭会掉羽毛的弩",
    "category": "bow",
    "rarity": "good",
    "dmg": 8,
    "energy": 3,
    "critBonus": 30,
    "sprite": "wp_wiki_w345"
  },
  {
    "id": "wiki_w346",
    "name": "羽毛球拍",
    "desc": "这个游戏不是回合制的吗",
    "category": "special",
    "rarity": "rare",
    "dmg": 6,
    "energy": 2,
    "critBonus": 25,
    "sprite": "wp_wiki_w346"
  },
  {
    "id": "wiki_w347",
    "name": "老旧的卡宾枪",
    "desc": "极光般的特效，梦幻般的蓝耗",
    "category": "rifle",
    "rarity": "common",
    "dmg": 4,
    "energy": 2,
    "critBonus": 0,
    "sprite": "wp_wiki_w347"
  },
  {
    "id": "wiki_w348",
    "name": "老旧的火箭筒",
    "desc": "求求你別锈了",
    "category": "launcher",
    "rarity": "common",
    "dmg": 8,
    "energy": 6,
    "critBonus": 0,
    "sprite": "wp_wiki_w348"
  },
  {
    "id": "wiki_w349",
    "name": "老旧的狙击枪",
    "desc": "膛线老化但还能勉强使用",
    "category": "sniper",
    "rarity": "common",
    "dmg": 10,
    "energy": 6,
    "critBonus": 30,
    "sprite": "wp_wiki_w349"
  },
  {
    "id": "wiki_w350",
    "name": "老铁的锤子",
    "desc": "老铁的锤子",
    "category": "melee",
    "rarity": "rare",
    "dmg": 8,
    "energy": 0,
    "critBonus": 25,
    "sprite": "wp_wiki_w350"
  },
  {
    "id": "wiki_w351",
    "name": "联携指环 红",
    "desc": "传说是一个狂战士的结婚戒指",
    "category": "special",
    "rarity": "common",
    "dmg": 2,
    "energy": 6,
    "critBonus": 0,
    "sprite": "wp_wiki_w351"
  },
  {
    "id": "wiki_w352",
    "name": "联携指环 绿",
    "desc": "要想生活过得去……",
    "category": "special",
    "rarity": "common",
    "dmg": 2,
    "energy": 6,
    "critBonus": 0,
    "sprite": "wp_wiki_w352"
  },
  {
    "id": "wiki_w353",
    "name": "联携指环 蓝",
    "desc": "利用队友之间的摩擦产生静电",
    "category": "special",
    "rarity": "common",
    "dmg": 2,
    "energy": 6,
    "critBonus": 0,
    "sprite": "wp_wiki_w353"
  },
  {
    "id": "wiki_w354",
    "name": "联携指环 黄",
    "desc": "信仰圣光吧！",
    "category": "special",
    "rarity": "common",
    "dmg": 2,
    "energy": 6,
    "critBonus": 0,
    "sprite": "wp_wiki_w354"
  },
  {
    "id": "wiki_w355",
    "name": "聚爆",
    "desc": "E=mc²",
    "category": "launcher",
    "rarity": "legend",
    "dmg": 16,
    "energy": 6,
    "critBonus": 0,
    "sprite": "wp_wiki_w355"
  },
  {
    "id": "wiki_w356",
    "name": "聚爆极冰",
    "desc": "聚爆极冰",
    "category": "launcher",
    "rarity": "legend",
    "dmg": 12,
    "energy": 6,
    "critBonus": 0,
    "sprite": "wp_wiki_w356"
  },
  {
    "id": "wiki_w357",
    "name": "肃清者",
    "desc": "肃清者",
    "category": "special",
    "rarity": "epic",
    "dmg": 6,
    "energy": 5,
    "critBonus": 20,
    "sprite": "wp_wiki_w357"
  },
  {
    "id": "wiki_w358",
    "name": "肉",
    "desc": "哥布林烤肉架上的一块鸡腿肉",
    "category": "special",
    "rarity": "good",
    "dmg": 5,
    "energy": 0,
    "critBonus": 0,
    "sprite": "wp_wiki_w358"
  },
  {
    "id": "wiki_w359",
    "name": "肥料",
    "desc": "细嗅，农家肥的清香（雾）",
    "category": "special",
    "rarity": "common",
    "dmg": 2,
    "energy": 3,
    "critBonus": 20,
    "sprite": "wp_wiki_w359"
  },
  {
    "id": "wiki_w360",
    "name": "脉冲",
    "desc": "脉冲",
    "category": "special",
    "rarity": "rare",
    "dmg": 2,
    "energy": 4,
    "critBonus": 30,
    "sprite": "wp_wiki_w360"
  },
  {
    "id": "wiki_w361",
    "name": "脏脏的调色盘",
    "desc": "脏脏的调色盘",
    "category": "shotgun",
    "rarity": "rare",
    "dmg": 2,
    "energy": 3,
    "critBonus": 0,
    "sprite": "wp_wiki_w361"
  },
  {
    "id": "wiki_w362",
    "name": "自然法杖",
    "desc": "可以闻到淡淡的草木芬芳",
    "category": "staff",
    "rarity": "common",
    "dmg": 4,
    "energy": 2,
    "critBonus": 10,
    "sprite": "wp_wiki_w362"
  },
  {
    "id": "wiki_w363",
    "name": "花言巧语",
    "desc": "男人就该干男人该干的事",
    "category": "smg",
    "rarity": "rare",
    "dmg": 2,
    "energy": 1,
    "critBonus": 0,
    "sprite": "wp_wiki_w363"
  },
  {
    "id": "wiki_w364",
    "name": "苍龙魔杖",
    "desc": "苍龙魔杖",
    "category": "staff",
    "rarity": "mythic",
    "dmg": 2,
    "energy": 6,
    "critBonus": 0,
    "sprite": "wp_wiki_w364"
  },
  {
    "id": "wiki_w365",
    "name": "英雄弓",
    "desc": "人是英雄，弓是传奇",
    "category": "bow",
    "rarity": "epic",
    "dmg": 2,
    "energy": 5,
    "critBonus": 0,
    "sprite": "wp_wiki_w365"
  },
  {
    "id": "wiki_w366",
    "name": "英雄王剑",
    "desc": "英雄王剑",
    "category": "melee",
    "rarity": "epic",
    "dmg": 2,
    "energy": 4,
    "critBonus": 10,
    "sprite": "wp_wiki_w366"
  },
  {
    "id": "wiki_w367",
    "name": "药丸",
    "desc": "药丸",
    "category": "special",
    "rarity": "rare",
    "dmg": 3,
    "energy": 3,
    "critBonus": 10,
    "sprite": "wp_wiki_w367"
  },
  {
    "id": "wiki_w368",
    "name": "萝卜",
    "desc": "萝卜",
    "category": "special",
    "rarity": "good",
    "dmg": 4,
    "energy": 1,
    "critBonus": 0,
    "sprite": "wp_wiki_w368"
  },
  {
    "id": "wiki_w369",
    "name": "蓝火加特林",
    "desc": "王哥！哒哒哒哒哒哒",
    "category": "shotgun",
    "rarity": "epic",
    "dmg": 2,
    "energy": 1,
    "critBonus": 0,
    "sprite": "wp_wiki_w369"
  },
  {
    "id": "wiki_w370",
    "name": "藤蔓",
    "desc": "背着它，所有人都会原谅你",
    "category": "special",
    "rarity": "good",
    "dmg": 8,
    "energy": 0,
    "critBonus": 30,
    "sprite": "wp_wiki_w370"
  },
  {
    "id": "wiki_w371",
    "name": "虚空剑",
    "desc": "是虚空剑不是空虚剑啦！",
    "category": "melee",
    "rarity": "rare",
    "dmg": 12,
    "energy": 2,
    "critBonus": 20,
    "sprite": "wp_wiki_w371"
  },
  {
    "id": "wiki_w372",
    "name": "蝰蛇",
    "desc": "蝰蛇",
    "category": "smg",
    "rarity": "epic",
    "dmg": 5,
    "energy": 5,
    "critBonus": 25,
    "sprite": "wp_wiki_w372"
  },
  {
    "id": "wiki_w373",
    "name": "蝶舞婆娑",
    "desc": "蝶舞婆娑",
    "category": "special",
    "rarity": "mythic",
    "dmg": 4,
    "energy": 2,
    "critBonus": 15,
    "sprite": "wp_wiki_w373"
  },
  {
    "id": "wiki_w374",
    "name": "螺旋冲锋枪",
    "desc": "我这是双螺旋结构！",
    "category": "smg",
    "rarity": "good",
    "dmg": 2,
    "energy": 1,
    "critBonus": 30,
    "sprite": "wp_wiki_w374"
  },
  {
    "id": "wiki_w375",
    "name": "血刃（升级版）",
    "desc": "血刃（升级版）",
    "category": "melee",
    "rarity": "good",
    "dmg": 8,
    "energy": 0,
    "critBonus": 20,
    "sprite": "wp_wiki_w375"
  },
  {
    "id": "wiki_w376",
    "name": "见习佣兵霰弹枪",
    "desc": "见习佣兵霰弹枪",
    "category": "shotgun",
    "rarity": "common",
    "dmg": 3,
    "energy": 1,
    "critBonus": 0,
    "sprite": "wp_wiki_w376"
  },
  {
    "id": "wiki_w377",
    "name": "诸葛连弩",
    "desc": "诸葛连弩",
    "category": "bow",
    "rarity": "good",
    "dmg": 5,
    "energy": 2,
    "critBonus": 30,
    "sprite": "wp_wiki_w377"
  },
  {
    "id": "wiki_w378",
    "name": "豪华鱼竿",
    "desc": "豪华鱼竿",
    "category": "special",
    "rarity": "mythic",
    "dmg": 2,
    "energy": 3,
    "critBonus": 0,
    "sprite": "wp_wiki_w378"
  },
  {
    "id": "wiki_w379",
    "name": "走音麦克风",
    "desc": "走音麦克风",
    "category": "special",
    "rarity": "rare",
    "dmg": 3,
    "energy": 1,
    "critBonus": 10,
    "sprite": "wp_wiki_w379"
  },
  {
    "id": "wiki_w380",
    "name": "起爆苦无",
    "desc": "起爆苦无",
    "category": "special",
    "rarity": "rare",
    "dmg": 6,
    "energy": 6,
    "critBonus": 0,
    "sprite": "wp_wiki_w380"
  },
  {
    "id": "wiki_w381",
    "name": "超厚辞典",
    "desc": "超厚辞典",
    "category": "staff",
    "rarity": "rare",
    "dmg": 2,
    "energy": 3,
    "critBonus": 0,
    "sprite": "wp_wiki_w381"
  },
  {
    "id": "wiki_w382",
    "name": "超空间牵引装置",
    "desc": "海的那边是什么",
    "category": "melee",
    "rarity": "legend",
    "dmg": 4,
    "energy": 2,
    "critBonus": 15,
    "sprite": "wp_wiki_w382"
  },
  {
    "id": "wiki_w383",
    "name": "超级大宝贝儿",
    "desc": "侦测到在途的聚变打击...",
    "category": "launcher",
    "rarity": "mythic",
    "dmg": 16,
    "energy": 6,
    "critBonus": 0,
    "sprite": "wp_wiki_w383"
  },
  {
    "id": "wiki_w384",
    "name": "超级大药丸",
    "desc": "超级大药丸",
    "category": "special",
    "rarity": "rare",
    "dmg": 6,
    "energy": 3,
    "critBonus": 10,
    "sprite": "wp_wiki_w384"
  },
  {
    "id": "wiki_w385",
    "name": "超级怪兽卡牌",
    "desc": "超级怪兽卡牌",
    "category": "special",
    "rarity": "epic",
    "dmg": 2,
    "energy": 3,
    "critBonus": 0,
    "sprite": "wp_wiki_w385"
  },
  {
    "id": "wiki_w386",
    "name": "超级散弹枪",
    "desc": "超级散弹枪",
    "category": "shotgun",
    "rarity": "epic",
    "dmg": 12,
    "energy": 3,
    "critBonus": 5,
    "sprite": "wp_wiki_w386"
  },
  {
    "id": "wiki_w387",
    "name": "超级科学计算器",
    "desc": "超级科学计算器",
    "category": "special",
    "rarity": "common",
    "dmg": 2,
    "energy": 2,
    "critBonus": 0,
    "sprite": "wp_wiki_w387"
  },
  {
    "id": "wiki_w388",
    "name": "足球",
    "desc": "留给国足的时间不多了",
    "category": "special",
    "rarity": "common",
    "dmg": 4,
    "energy": 1,
    "critBonus": 0,
    "sprite": "wp_wiki_w388"
  },
  {
    "id": "wiki_w389",
    "name": "跃迁者",
    "desc": "跃迁者",
    "category": "special",
    "rarity": "rare",
    "dmg": 3,
    "energy": 2,
    "critBonus": 0,
    "sprite": "wp_wiki_w389"
  },
  {
    "id": "wiki_w390",
    "name": "边塞重弩",
    "desc": "边塞重弩",
    "category": "bow",
    "rarity": "legend",
    "dmg": 8,
    "energy": 4,
    "critBonus": 30,
    "sprite": "wp_wiki_w390"
  },
  {
    "id": "wiki_w391",
    "name": "近卫大剑",
    "desc": "近卫大剑",
    "category": "melee",
    "rarity": "rare",
    "dmg": 11,
    "energy": 3,
    "critBonus": 15,
    "sprite": "wp_wiki_w391"
  },
  {
    "id": "wiki_w392",
    "name": "近卫战弓",
    "desc": "近卫战弓",
    "category": "bow",
    "rarity": "rare",
    "dmg": 2,
    "energy": 3,
    "critBonus": 0,
    "sprite": "wp_wiki_w392"
  },
  {
    "id": "wiki_w393",
    "name": "近卫法师之杖",
    "desc": "近卫法师之杖",
    "category": "staff",
    "rarity": "rare",
    "dmg": 2,
    "energy": 3,
    "critBonus": 0,
    "sprite": "wp_wiki_w393"
  },
  {
    "id": "wiki_w394",
    "name": "进击的号角",
    "desc": "这是来自洛汗的马克号角",
    "category": "special",
    "rarity": "common",
    "dmg": 2,
    "energy": 6,
    "critBonus": 0,
    "sprite": "wp_wiki_w394"
  },
  {
    "id": "wiki_w395",
    "name": "连射狙击枪",
    "desc": "我可是要变成次世代狙击枪的",
    "category": "sniper",
    "rarity": "good",
    "dmg": 8,
    "energy": 3,
    "critBonus": 25,
    "sprite": "wp_wiki_w395"
  },
  {
    "id": "wiki_w396",
    "name": "连射霰弹枪",
    "desc": "连射霰弹枪",
    "category": "shotgun",
    "rarity": "common",
    "dmg": 3,
    "energy": 3,
    "critBonus": 0,
    "sprite": "wp_wiki_w396"
  },
  {
    "id": "wiki_w397",
    "name": "连续轨道炮",
    "desc": "连续轨道炮",
    "category": "special",
    "rarity": "epic",
    "dmg": 2,
    "energy": 6,
    "critBonus": 0,
    "sprite": "wp_wiki_w397"
  },
  {
    "id": "wiki_w398",
    "name": "迷你乌兹",
    "desc": "迷你乌兹",
    "category": "smg",
    "rarity": "common",
    "dmg": 2,
    "energy": 0,
    "critBonus": 5,
    "sprite": "wp_wiki_w398"
  },
  {
    "id": "wiki_w399",
    "name": "迷你骑士手办",
    "desc": "迷你骑士手办",
    "category": "special",
    "rarity": "common",
    "dmg": 3,
    "energy": 0,
    "critBonus": 0,
    "sprite": "wp_wiki_w399"
  },
  {
    "id": "wiki_w400",
    "name": "道剑",
    "desc": "道剑",
    "category": "melee",
    "rarity": "common",
    "dmg": 2,
    "energy": 3,
    "critBonus": 0,
    "sprite": "wp_wiki_w400"
  },
  {
    "id": "wiki_w401",
    "name": "道剑（升级版）",
    "desc": "道剑（升级版）",
    "category": "melee",
    "rarity": "good",
    "dmg": 2,
    "energy": 3,
    "critBonus": 0,
    "sprite": "wp_wiki_w401"
  },
  {
    "id": "wiki_w402",
    "name": "遗迹火焰法杖",
    "desc": "遗迹火焰法杖",
    "category": "special",
    "rarity": "good",
    "dmg": 2,
    "energy": 0,
    "critBonus": 30,
    "sprite": "wp_wiki_w402"
  },
  {
    "id": "wiki_w403",
    "name": "邪能披风碎屑",
    "desc": "邪能披风碎屑",
    "category": "special",
    "rarity": "mythic",
    "dmg": 2,
    "energy": 6,
    "critBonus": 5,
    "sprite": "wp_wiki_w403"
  },
  {
    "id": "wiki_w404",
    "name": "重型猎斧",
    "desc": "重型猎斧",
    "category": "special",
    "rarity": "rare",
    "dmg": 16,
    "energy": 3,
    "critBonus": 20,
    "sprite": "wp_wiki_w404"
  },
  {
    "id": "wiki_w405",
    "name": "重铸的圣剑",
    "desc": "你是我的亚瑟王吗",
    "category": "melee",
    "rarity": "epic",
    "dmg": 8,
    "energy": 0,
    "critBonus": 10,
    "sprite": "wp_wiki_w405"
  },
  {
    "id": "wiki_w406",
    "name": "量子手里剑",
    "desc": "量子手里剑",
    "category": "special",
    "rarity": "legend",
    "dmg": 8,
    "energy": 6,
    "critBonus": 30,
    "sprite": "wp_wiki_w406"
  },
  {
    "id": "wiki_w407",
    "name": "金刚琢",
    "desc": "金刚琢",
    "category": "special",
    "rarity": "mythic",
    "dmg": 10,
    "energy": 0,
    "critBonus": 15,
    "sprite": "wp_wiki_w407"
  },
  {
    "id": "wiki_w408",
    "name": "金箍棒",
    "desc": "金箍棒",
    "category": "melee",
    "rarity": "mythic",
    "dmg": 7,
    "energy": 2,
    "critBonus": 20,
    "sprite": "wp_wiki_w408"
  },
  {
    "id": "wiki_w409",
    "name": "金蛟剪",
    "desc": "金蛟剪",
    "category": "special",
    "rarity": "mythic",
    "dmg": 13,
    "energy": 0,
    "critBonus": 0,
    "sprite": "wp_wiki_w409"
  },
  {
    "id": "wiki_w410",
    "name": "铁镐",
    "desc": "铁镐",
    "category": "melee",
    "rarity": "common",
    "dmg": 7,
    "energy": 0,
    "critBonus": 25,
    "sprite": "wp_wiki_w410"
  },
  {
    "id": "wiki_w411",
    "name": "铲子",
    "desc": "理论上来说你可以用它直接铲掉曼陀罗花",
    "category": "melee",
    "rarity": "common",
    "dmg": 4,
    "energy": 0,
    "critBonus": 0,
    "sprite": "wp_wiki_w411"
  },
  {
    "id": "wiki_w412",
    "name": "银河霰弹枪",
    "desc": "来自艾姆7046星系的6号星球",
    "category": "shotgun",
    "rarity": "good",
    "dmg": 3,
    "energy": 2,
    "critBonus": 0,
    "sprite": "wp_wiki_w412"
  },
  {
    "id": "wiki_w413",
    "name": "锤头鲨",
    "desc": "锤头鲨",
    "category": "melee",
    "rarity": "epic",
    "dmg": 16,
    "energy": 0,
    "critBonus": 30,
    "sprite": "wp_wiki_w413"
  },
  {
    "id": "wiki_w414",
    "name": "锤子",
    "desc": "锤子",
    "category": "melee",
    "rarity": "common",
    "dmg": 8,
    "energy": 0,
    "critBonus": 20,
    "sprite": "wp_wiki_w414"
  },
  {
    "id": "wiki_w415",
    "name": "键盘侠",
    "desc": "键盘侠",
    "category": "special",
    "rarity": "epic",
    "dmg": 3,
    "energy": 3,
    "critBonus": 20,
    "sprite": "wp_wiki_w415"
  },
  {
    "id": "wiki_w416",
    "name": "镭射浮游炮",
    "desc": "不是一般的浮游炮",
    "category": "special",
    "rarity": "mythic",
    "dmg": 4,
    "energy": 1,
    "critBonus": 30,
    "sprite": "wp_wiki_w416"
  },
  {
    "id": "wiki_w417",
    "name": "闪电五连鞭",
    "desc": "闪电五连鞭",
    "category": "special",
    "rarity": "epic",
    "dmg": 5,
    "energy": 1,
    "critBonus": 0,
    "sprite": "wp_wiki_w417"
  },
  {
    "id": "wiki_w418",
    "name": "闹肚子的彩虹马",
    "desc": "喵喵喵喵喵喵喵喵喵喵喵喵喵喵喵...",
    "category": "special",
    "rarity": "legend",
    "dmg": 6,
    "energy": 1,
    "critBonus": 0,
    "sprite": "wp_wiki_w418"
  },
  {
    "id": "wiki_w419",
    "name": "阴阳",
    "desc": "阴阳",
    "category": "special",
    "rarity": "common",
    "dmg": 8,
    "energy": 0,
    "critBonus": 10,
    "sprite": "wp_wiki_w419"
  },
  {
    "id": "wiki_w420",
    "name": "阴阳（升级版）",
    "desc": "阴阳（升级版）",
    "category": "special",
    "rarity": "good",
    "dmg": 8,
    "energy": 0,
    "critBonus": 10,
    "sprite": "wp_wiki_w420"
  },
  {
    "id": "wiki_w421",
    "name": "陌刀",
    "desc": "陌刀",
    "category": "melee",
    "rarity": "epic",
    "dmg": 5,
    "energy": 0,
    "critBonus": 10,
    "sprite": "wp_wiki_w421"
  },
  {
    "id": "wiki_w422",
    "name": "陨星炮",
    "desc": "陨星炮",
    "category": "special",
    "rarity": "legend",
    "dmg": 2,
    "energy": 6,
    "critBonus": 0,
    "sprite": "wp_wiki_w422"
  },
  {
    "id": "wiki_w423",
    "name": "陷阵营动能枪",
    "desc": "陷阵营动能枪",
    "category": "smg",
    "rarity": "rare",
    "dmg": 6,
    "energy": 2,
    "critBonus": 5,
    "sprite": "wp_wiki_w423"
  },
  {
    "id": "wiki_w424",
    "name": "雨伞",
    "desc": "我能送你回家吗可能外面要下雨了",
    "category": "special",
    "rarity": "common",
    "dmg": 4,
    "energy": 1,
    "critBonus": 0,
    "sprite": "wp_wiki_w424"
  },
  {
    "id": "wiki_w425",
    "name": "雪狐",
    "desc": "对于这个显眼的L，雪狐下定决心减肥。",
    "category": "smg",
    "rarity": "common",
    "dmg": 2,
    "energy": 0,
    "critBonus": 5,
    "sprite": "wp_wiki_w425"
  },
  {
    "id": "wiki_w426",
    "name": "雪狐 土豪金",
    "desc": "我想我可能是最有钱的雪狐了",
    "category": "smg",
    "rarity": "legend",
    "dmg": 4,
    "energy": 3,
    "critBonus": 25,
    "sprite": "wp_wiki_w426"
  },
  {
    "id": "wiki_w427",
    "name": "雪狐 玫瑰金",
    "desc": "雪狐 玫瑰金",
    "category": "shotgun",
    "rarity": "legend",
    "dmg": 4,
    "energy": 3,
    "critBonus": 25,
    "sprite": "wp_wiki_w427"
  },
  {
    "id": "wiki_w428",
    "name": "雷暴战锤",
    "desc": "雷暴战锤",
    "category": "melee",
    "rarity": "legend",
    "dmg": 10,
    "energy": 6,
    "critBonus": 0,
    "sprite": "wp_wiki_w428"
  },
  {
    "id": "wiki_w429",
    "name": "雷电大剑",
    "desc": "雷电大剑",
    "category": "special",
    "rarity": "mythic",
    "dmg": 10,
    "energy": 0,
    "critBonus": 5,
    "sprite": "wp_wiki_w429"
  },
  {
    "id": "wiki_w430",
    "name": "霰弹枪一代",
    "desc": "霰弹枪一代",
    "category": "shotgun",
    "rarity": "common",
    "dmg": 3,
    "energy": 3,
    "critBonus": 0,
    "sprite": "wp_wiki_w430"
  },
  {
    "id": "wiki_w431",
    "name": "霰弹枪三代",
    "desc": "霰弹枪三代",
    "category": "shotgun",
    "rarity": "rare",
    "dmg": 2,
    "energy": 3,
    "critBonus": 5,
    "sprite": "wp_wiki_w431"
  },
  {
    "id": "wiki_w432",
    "name": "霰弹枪二代",
    "desc": "霰弹枪二代",
    "category": "shotgun",
    "rarity": "good",
    "dmg": 2,
    "energy": 1,
    "critBonus": 5,
    "sprite": "wp_wiki_w432"
  },
  {
    "id": "wiki_w433",
    "name": "青釭光剑",
    "desc": "青釭光剑",
    "category": "melee",
    "rarity": "epic",
    "dmg": 8,
    "energy": 3,
    "critBonus": 10,
    "sprite": "wp_wiki_w433"
  },
  {
    "id": "wiki_w434",
    "name": "鞭炮",
    "desc": "鞭炮",
    "category": "special",
    "rarity": "rare",
    "dmg": 5,
    "energy": 3,
    "critBonus": 0,
    "sprite": "wp_wiki_w434"
  },
  {
    "id": "wiki_w435",
    "name": "风之弓",
    "desc": "其疾，如风！",
    "category": "bow",
    "rarity": "rare",
    "dmg": 2,
    "energy": 4,
    "critBonus": 0,
    "sprite": "wp_wiki_w435"
  },
  {
    "id": "wiki_w436",
    "name": "风之手里剑",
    "desc": "风之手里剑",
    "category": "special",
    "rarity": "epic",
    "dmg": 3,
    "energy": 6,
    "critBonus": 10,
    "sprite": "wp_wiki_w436"
  },
  {
    "id": "wiki_w437",
    "name": "风暴战斧",
    "desc": "风暴战斧",
    "category": "melee",
    "rarity": "legend",
    "dmg": 4,
    "energy": 3,
    "critBonus": 30,
    "sprite": "wp_wiki_w437"
  },
  {
    "id": "wiki_w438",
    "name": "风眼",
    "desc": "风眼",
    "category": "bow",
    "rarity": "legend",
    "dmg": 2,
    "energy": 3,
    "critBonus": 0,
    "sprite": "wp_wiki_w438"
  },
  {
    "id": "wiki_w439",
    "name": "风魔手里剑",
    "desc": "风魔手里剑",
    "category": "special",
    "rarity": "rare",
    "dmg": 10,
    "energy": 6,
    "critBonus": 10,
    "sprite": "wp_wiki_w439"
  },
  {
    "id": "wiki_w440",
    "name": "飓风拳套",
    "desc": "飓风拳套",
    "category": "special",
    "rarity": "epic",
    "dmg": 6,
    "energy": 1,
    "critBonus": 15,
    "sprite": "wp_wiki_w440"
  },
  {
    "id": "wiki_w441",
    "name": "飞熊军激光炮",
    "desc": "飞熊军激光炮",
    "category": "smg",
    "rarity": "legend",
    "dmg": 10,
    "energy": 3,
    "critBonus": 20,
    "sprite": "wp_wiki_w441"
  },
  {
    "id": "wiki_w442",
    "name": "飞电",
    "desc": "飞电",
    "category": "special",
    "rarity": "mythic",
    "dmg": 7,
    "energy": 1,
    "critBonus": 7,
    "sprite": "wp_wiki_w442"
  },
  {
    "id": "wiki_w443",
    "name": "饥饿素",
    "desc": "饥饿素",
    "category": "special",
    "rarity": "common",
    "dmg": 2,
    "energy": 6,
    "critBonus": 0,
    "sprite": "wp_wiki_w443"
  },
  {
    "id": "wiki_w444",
    "name": "饱经风霜的火箭筒",
    "desc": "饱经风霜的火箭筒",
    "category": "launcher",
    "rarity": "common",
    "dmg": 8,
    "energy": 6,
    "critBonus": 0,
    "sprite": "wp_wiki_w444"
  },
  {
    "id": "wiki_w445",
    "name": "香蕉",
    "desc": "香蕉",
    "category": "special",
    "rarity": "good",
    "dmg": 6,
    "energy": 0,
    "critBonus": 0,
    "sprite": "wp_wiki_w445"
  },
  {
    "id": "wiki_w446",
    "name": "驱逐法杖",
    "desc": "驱逐法杖",
    "category": "staff",
    "rarity": "common",
    "dmg": 2,
    "energy": 3,
    "critBonus": 10,
    "sprite": "wp_wiki_w446"
  },
  {
    "id": "wiki_w447",
    "name": "骑士之拳",
    "desc": "小拳拳锤你胸口！",
    "category": "shotgun",
    "rarity": "rare",
    "dmg": 4,
    "energy": 3,
    "critBonus": 10,
    "sprite": "wp_wiki_w447"
  },
  {
    "id": "wiki_w448",
    "name": "骑士长枪",
    "desc": "骑士长枪",
    "category": "melee",
    "rarity": "good",
    "dmg": 12,
    "energy": 0,
    "critBonus": 30,
    "sprite": "wp_wiki_w448"
  },
  {
    "id": "wiki_w449",
    "name": "高能钻头",
    "desc": "这不是要钻地，这是要钻破天际！",
    "category": "special",
    "rarity": "epic",
    "dmg": 3,
    "energy": 1,
    "critBonus": 0,
    "sprite": "wp_wiki_w449"
  },
  {
    "id": "wiki_w450",
    "name": "高阶驱逐法杖",
    "desc": "高阶驱逐法杖",
    "category": "staff",
    "rarity": "good",
    "dmg": 2,
    "energy": 3,
    "critBonus": 10,
    "sprite": "wp_wiki_w450"
  },
  {
    "id": "wiki_w451",
    "name": "魂刃：英魂",
    "desc": "魂刃：英魂",
    "category": "melee",
    "rarity": "mythic",
    "dmg": 12,
    "energy": 0,
    "critBonus": 20,
    "sprite": "wp_wiki_w451"
  },
  {
    "id": "wiki_w452",
    "name": "魂刃：魔魂",
    "desc": "魂刃：魔魂",
    "category": "melee",
    "rarity": "mythic",
    "dmg": 12,
    "energy": 0,
    "critBonus": 20,
    "sprite": "wp_wiki_w452"
  },
  {
    "id": "wiki_w453",
    "name": "魅影",
    "desc": "我为杀戮而行动",
    "category": "sniper",
    "rarity": "legend",
    "dmg": 16,
    "energy": 6,
    "critBonus": 30,
    "sprite": "wp_wiki_w453"
  },
  {
    "id": "wiki_w454",
    "name": "魔导师之杖",
    "desc": "魔导师之杖",
    "category": "staff",
    "rarity": "legend",
    "dmg": 10,
    "energy": 5,
    "critBonus": 30,
    "sprite": "wp_wiki_w454"
  },
  {
    "id": "wiki_w455",
    "name": "鱼",
    "desc": "我差不多也是一条咸鱼了",
    "category": "special",
    "rarity": "rare",
    "dmg": 2,
    "energy": 3,
    "critBonus": 0,
    "sprite": "wp_wiki_w455"
  },
  {
    "id": "wiki_w456",
    "name": "鲜血酒杯",
    "desc": "鲜血酒杯",
    "category": "special",
    "rarity": "common",
    "dmg": 4,
    "energy": 1,
    "critBonus": 15,
    "sprite": "wp_wiki_w456"
  },
  {
    "id": "wiki_w457",
    "name": "鲜血酒杯（升级版）",
    "desc": "鲜血酒杯（升级版）",
    "category": "special",
    "rarity": "good",
    "dmg": 5,
    "energy": 2,
    "critBonus": 25,
    "sprite": "wp_wiki_w457"
  },
  {
    "id": "wiki_w458",
    "name": "黄巾军步枪",
    "desc": "黄巾军步枪",
    "category": "rifle",
    "rarity": "good",
    "dmg": 3,
    "energy": 1,
    "critBonus": 4,
    "sprite": "wp_wiki_w458"
  },
  {
    "id": "wiki_w459",
    "name": "黄金左轮",
    "desc": "黄金左轮",
    "category": "gun",
    "rarity": "rare",
    "dmg": 4,
    "energy": 3,
    "critBonus": 5,
    "sprite": "wp_wiki_w459"
  },
  {
    "id": "wiki_w460",
    "name": "黄金沙漠之鹰",
    "desc": "黄金沙漠之鹰",
    "category": "gun",
    "rarity": "common",
    "dmg": 6,
    "energy": 1,
    "critBonus": 10,
    "sprite": "wp_wiki_w460"
  },
  {
    "id": "wiki_w461",
    "name": "黄金法杖",
    "desc": "黄金法杖",
    "category": "staff",
    "rarity": "rare",
    "dmg": 4,
    "energy": 3,
    "critBonus": 4,
    "sprite": "wp_wiki_w461"
  },
  {
    "id": "wiki_w462",
    "name": "黄金狙击枪专业版",
    "desc": "黄金狙击枪专业版",
    "category": "sniper",
    "rarity": "epic",
    "dmg": 16,
    "energy": 4,
    "critBonus": 30,
    "sprite": "wp_wiki_w462"
  },
  {
    "id": "wiki_w463",
    "name": "黄金狙击步枪",
    "desc": "黄金狙击步枪",
    "category": "sniper",
    "rarity": "good",
    "dmg": 14,
    "energy": 3,
    "critBonus": 30,
    "sprite": "wp_wiki_w463"
  },
  {
    "id": "wiki_w464",
    "name": "黄金精致法杖",
    "desc": "黄金精致法杖",
    "category": "staff",
    "rarity": "mythic",
    "dmg": 4,
    "energy": 6,
    "critBonus": 4,
    "sprite": "wp_wiki_w464"
  },
  {
    "id": "wiki_w465",
    "name": "黄金阿卡47",
    "desc": "黄金阿卡47",
    "category": "rifle",
    "rarity": "common",
    "dmg": 2,
    "energy": 1,
    "critBonus": 12,
    "sprite": "wp_wiki_w465"
  },
  {
    "id": "wiki_w466",
    "name": "黑克勒科赫冲锋枪",
    "desc": "由H-K公司生产，军警通用的世界名枪",
    "category": "smg",
    "rarity": "common",
    "dmg": 3,
    "energy": 1,
    "critBonus": 5,
    "sprite": "wp_wiki_w466"
  },
  {
    "id": "wiki_w467",
    "name": "黑暗料理",
    "desc": "黑暗料理",
    "category": "special",
    "rarity": "common",
    "dmg": 7,
    "energy": 2,
    "critBonus": 30,
    "sprite": "wp_wiki_w467"
  },
  {
    "id": "wiki_w468",
    "name": "黑洞导弹",
    "desc": "这感觉熟悉么？是早晨在被窝里挣扎的你哦",
    "category": "launcher",
    "rarity": "epic",
    "dmg": 2,
    "energy": 1,
    "critBonus": 0,
    "sprite": "wp_wiki_w468"
  },
  {
    "id": "wiki_w469",
    "name": "龙枪·牙",
    "desc": "龙枪·牙",
    "category": "melee",
    "rarity": "common",
    "dmg": 4,
    "energy": 0,
    "critBonus": 15,
    "sprite": "wp_wiki_w469"
  },
  {
    "id": "wiki_w470",
    "name": "龙枪·牙（升级版）",
    "desc": "龙枪·牙（升级版）",
    "category": "melee",
    "rarity": "good",
    "dmg": 6,
    "energy": 0,
    "critBonus": 15,
    "sprite": "wp_wiki_w470"
  }
]

/* 由 data/wiki/passives-full.json 生成：42角色被动详解 */
export var WIKI_PASSIVE_DESC = {
  "knight": "角色受到的单次伤害大于当前护甲值，且护甲 不为0时，仅扣除剩余护甲而不会损失生命值。\n湮灭虚空中，额外获得：每隔 8 秒，若未受到攻击，获得1个可抵消一次伤害的护盾。该护盾不可叠加。",
  "rogue": "子弹每次暴击时，穿透次数＋1并立即消耗本次穿透。\n* 子弹击中可被摧毁的障碍物时不会暴击，因此该天赋无法令子弹穿透障碍物。\n* 对某些子弹不生效，如：火箭筒的火箭弹，请以具体页面为准。",
  "wizard": "该天赋享有以下两个独立而互不干涉的效果：\n元素效果子弹暴击也造成双倍伤害。加强法杖武器",
  "assassin": "近战攻击会反弹敌方的子弹，使其原速折返，并将其转变为我方的金色子弹，伤害不变。\n* 反弹的子弹通常无法暴击，不受子弹弹射和子弹分裂天赋影响，可受增幅器的增幅。\n**若角色持有满血暴击天赋，反弹的子弹可以造成暴击，且受暴击穿透影响。\n* 反弹效果对导弹、弹射子弹、子母弹、拖尾箭头弹等特殊子弹不生效。\n* 部分分裂弹可以被反弹，且反弹后分裂的子弹隶属我方。\n* 敌方子弹附带的派生效果，在反弹后通常也会被正常继承，并转变为我方的效果，但也有特例：\n**反弹附带元素圈的子弹产生的元素圈仍属于敌方（无头骑士和他的马的毒火圈除外）。\n**反弹敌方的能量弹所产生的能量波属于我方，且攻击力×3。\n* 虽然名为近战武器反弹子弹，但实际上绝大多数可以清除子弹的效果，在拥有该天赋时都能够反弹子弹。包括破甲冲击产生的冲击波、精致法杖的法球、能量护盾、剑气等一系列可以清除子弹的非近战武器和技能。\n** 部分攻击虽能消除敌方子弹，但无法反弹。包括但不限于：\n封灵战锤和千束的激光、寒冰穿刺的冰刺、遥控炸弹和大变活人的爆炸、神圣新星、水猴子挂饰、进击！水晶王蟹！的冰圈以及各种障碍物、进化后黑暗大骑士的剑的突进斩、黑暗领主进入黑暗涌动状态后的突进、冲啊！逐浪号！的船体经 船体掩护 模组加成后、导师强化后黑洞折射的子技能黑洞爆裂。",
  "alchemist": "该天赋有以下效果：\n免疫毒气及减速，对敌人中毒伤害提升",
  "engineer": "该天赋有以下效果：\n降低爆炸伤害并免疫火焰，对敌人火焰伤害提升",
  "vampire": "角色击败敌人时有 9% 概率掉落一个 生命球 生命球，角色吸取后回复1点生命值。\n* 此生命球会自动飞向击败此敌人的角色，无需靠近吸取。\n* 该天赋对吸血鬼的技能回复效果有直接的加强，详见其页面。",
  "paladin": "角色的护甲 不为0时受到攻击后（即使实际所受伤害为0），会以自身为中心产生一个圆形冲击波。\n* 冲击波的半径会在 0.3 秒内从0扩散至 5 格，然后消失，存在期间消除敌方子弹并击退敌人。\n* 使用守灵人短斧扣除护甲 时也可触发该天赋。\n* 骑乘坐骑、驾驶机甲和免疫伤害状态下的角色受击，或伤害被圣骑士雕像的护盾抵挡时无法触发该天赋。\n* 恶魔术士和气宗与该天赋具有特殊联动效果，详见阿米的燃烧之躯与内劲页面。",
  "elf": "该天赋会使蓄力武器蓄力速度加快 100% 。\n这里的蓄力武器不仅仅包括攻击时角色头顶会出现蓄力条的武器，很多没有蓄力条的武器、技能效果同样会受到影响，例如：\n* 投掷类的装填速度。\n* 松发式榴弹武器的最小榴弹发射间隔。\n* 持续激光类武器的蓄能增伤速度。\n* 异界旋涡的黑洞伤害频率。",
  "werewolf": "免疫 20px\n* 角色骑乘26px\n免疫陷阱，免疫碰撞伤害",
  "priest": "该天赋效果如下：\n* 使角色几乎所有的生命值、护甲、能量回复效果提升 100% 。\n**特别地，生命恢复术、无限能量不受影响。\n* 除药丸外，可食用武器的生命上限增量＋1。\n湮灭虚空中，",
  "druid": "宠物和随从体积和生命值增幅50%，造成的伤害增幅100%",
  "robot": "该天赋具有以下效果：\n增加光电类武器宽度，并免疫感电伤害",
  "berserker": "持有此天赋时，屏幕下方的特殊状态栏会出现本天赋的 图标，右上角数字代表其叠加层数。",
  "necromancer": "该天赋拥有以下两个独立而互不干涉的效果：\n* 敌方子弹的速度降低 20% 。\n* 角色吸收金币、能量球、灵魂打击、落音缤纷音符 等物品的半径由 5 格扩大为 13 格。",
  "sheriff": "该天赋能影响到大部分具有连续攻击特征的武器，使其连续攻击的次数＋1。\n* 此类武器在每轮会多次开火，且只消耗一次能量，包括但不限于：连射霰弹枪、诸葛连弩、次次时代冲锋枪、连续轨道炮、雪狐 土豪金等。\n**部分武器，如连射狙击枪和冰与火之鹰虽然具有连续攻击特征，但不会受到此天赋影响。\n* 斧类武器的 蓄力回旋 和血刃（升级版）的 连斩攻击 也属于连续攻击，持有此天赋时发动旋斩或连斩，可令每轮旋斩或连斩次数＋1。\n* 具有连续攻击特征的技能也受此天赋加成，包括但不限于：寒冰穿刺、协力：艾利欧格、地底行动、能量迸涌、黑暗领主等等。\n* 该天赋对斗阵枪术、猛虎拳、戏影剑舞、枪神降临和狩猎领域有特殊适配，详见该技能页面介绍。\n* 该天赋能使 存储类技能 的最大存储层数＋1，包括但不限于：转枪、居合斩、跳跃。\n** 极为特殊地，炸桶派对的最大存储层数＋2。\n** 龙枪圣临除该加成外，还额外附带 每次拾取长枪后回复的技能冷却时间提升至75% 的效果。\n** 部分表现各不相同的 多段非存储类技能 的层数不受该天赋影响，包括但不限于：流云飞剑、斗阵枪术、旋风腿。\n** 具体表现请以技能页面的介绍为准。",
  "taoist": "本角色所有的副手武器进入浮游状态，保持其在主手中的攻击模式。\n* 不同武器在浮游状态下的攻击机制基本可参考佣兵，但有以下不同：\n**根据武器品质不同，浮游武器的攻击冷却时间为 3.2 / 3.5 / 3.8 / 4.1 / 4.4 / 4.7/ 5 秒。（待验证）\n***但处于浮游状态的勾索枪 和精密勾索枪会以很高的频率攻击。\n**蓄力至多蓄力1秒；除线圈炮等连续攻击3次的武器外，一轮攻击至多持续1秒。\n**处于浮游状态的至尊权杖只能发动杖柄震地、产生电容球的攻击。\n**处于浮游状态的超空间牵引装置发出的绳索不会牵引武器自身，但也不会自动回复层数，因此层数耗尽后无法发动任何攻击。切换回主手后才可回复层数。\n** 处于浮游状态的声呐探测器会不间断发射声呐波，且在触发攻击后会正常进入待机状态。\n* 国王的新枪、非蓄力刀剑类武器、和部分具有近战属性的杂项类武器，在攻击后进入浮游状态，会取消本次攻击后摇，因此经常被用于切枪操作。\n* 邪能披风碎屑产生的大火球与毒火圈的攻击力不再受角色面板影响，详见其页面。\n* 浮游武器可受热狗天赋加成，且不受孤勇者影响。\n* 角色乘坐自带武器的机甲时，浮游的武器会全部消失。\n* 多数武器在浮游状态下攻击仍属于本角色，但也有少数不符，这可能是bug。",
  "transcendent": "该天赋享有以下两个独立而互不干涉的效果：\n超界者会在多个维度穿梭，这会让他有一定概率不会受到任何伤害。每5次手刀攻击后会释放1次强化手刀【角色限定】",
  "elemental": "该天赋分为两个独立的效果：\n* 本角色直接获得冰盾和火盾的效果。\n** 角色依旧可以选择上述两个天赋，但效果不会叠加。\n** 这两种效果可被冻伤、精神错乱因子失效。\n* 瞄准范围内存在敌人时，每隔2秒，本角色周围半径6格以内的区域会随机生成一座冰圣碑毒圣碑火圣碑雷圣碑 元素圣碑，场上同时存在 2 座圣碑时停止生成。圣碑属性如下：\n** 生命值为 99，生命值耗尽或存在 8 秒后消失。\n** 索敌范围为底座半径22格，会锁定范围内不被障碍物阻挡的最近的敌人；存在多个圣碑时，则会由距敌人最近且不被阻挡的圣碑进行索敌。\n** 锁定目标释放光链，攻击间隔为 2.5 秒，攻击力为 3 （无法暴击），每一道光链都会对目标和沿途所有敌人造成电元素伤害，并根据圣碑的类型50%概率附加异常状态：冰圣碑 为冰冻，毒圣碑 为中毒，火圣碑 为灼烧，雷圣碑 为眩晕。\n*** 攻击力受攻速强化术肌肉强化术因子影响，通常攻击频率不受影响，但圣碑的每轮攻击在攻速强化术下会连续攻击两次。\n*** 该中毒和灼烧均为无源伤害。\n** 当存在多个圣碑时，所有圣碑会发动联携攻击：光链会依次传导向距离最近的圣碑，并最终以索敌的圣碑为终点将所有圣碑的光链合成为一个光链释放，其攻击力和异常状态均会累加。\n*** 以这种方式产生的光链在每次攻击时有概率会额外造成一段不会累加的伤害，这疑似是一个bug。\n** 碑之间产生的传导光链不会被任何障碍物阻挡。\n** 如果在联携攻击发生前，其中一个圣碑被摧毁了，则与之联携的所有碑都会取消本次攻击。",
  "owl": "一只巨枭动图巨枭魔宠 会跟随本角色战斗，以 2 次/秒的频率发射一个可穿透 1 次，攻击力为 3 的 箭矢 攻击敌人，暴击率为 5% 。\n* 箭矢的攻击力受攻速强化术和肌肉强化术影响，但攻击频率不受其影响。\n* 箭矢的伤害归属于本角色。\n* 箭矢贴图无法滞留。\n* 本角色损失生命值 时，巨枭会立即停止攻击并消失，3 秒后再次出现。\n**若本角色死亡，直至复活才会出现。\n**死神之息发动攻击与药丸导致的血量上限降低都会使巨枭消失。\n* 巨枭不受孤勇者影响。\n* 宠物巨大化使箭矢的攻击力+200%，不影响其攻击频率。\n* 联机模式中，不同玩家可独立召唤巨枭。",
  "time_ninja": "每隔一段时间自动对近身的敌人发动快速踢击",
  "special_force": "每次切换形态时，获得持续一段时间额外的攻速加成，期间近战武器攻击会附带剑气，法杖的攻击加强",
  "qizong": "气宗的手刀为三段击打，攻击力 分别为 9 / 9 / 15，基础子弹大小均为 100% ，范围均为长 2.25 格、宽 1.75 格的矩形。\n* 虽然游戏内气宗的被动描述中提及了其“手刀变为三段击打”，但实际上该效果为气宗的 角色特性，无论是否具有被动，其手刀都是三段击打。\n* 三段击打相比常规的手刀 具有以下显著不同：\n**有攻速限制，第一、二段击打后的攻击间隔最小为 0.18 秒，第三段击打后的攻击间隔最小为 0.25 秒；且空放和近身触发的攻速完全相同。\n***若 3 秒内没有进行击打，连击数会被重置。\n**近身触发的距离为0.5格，而非普通手刀的1格。\n**击打的攻击力与攻速均受攻速因子影响。\n**其攻击力不受巨大化和缩小隧道因子影响。\n**发动击打时，本角色会向瞄准方向位移 1.5 格。\n***若角色与瞄准的目标相距 5 格以内，手刀时会突进至目标处。\n***位移期间角色不再响应方向摇杆，且无法改变瞄准方向。\n***如果角色在刚被选择或刚进入关卡，没有瞄准敌人，也没有进行任何方向移动时，则不会产生任何位移。\n* 持有天地通意拳（升级版）时，手刀每一段击打的攻击力＋1。此数值不受攻速因子影响。\n* 拥有被动天赋内劲时，进行第三段击打时若能量充足，则会消耗2点能量，在拳头处额外释放一个大型气功波；该气功波攻击力 为 8。\n**该效果发动时，会覆盖练气要诀提供的释放小型气功波效果。\n* 手刀和气功波均受增幅器增幅；但气功波不受20px增幅。\n* 手刀和气功波均受 技能伤害 加成。",
  "demon_warlock": "本角色击败敌人或对首领单位累计造成 32 伤害时，会召唤一只 火焰小鬼跟随并协助战斗。\n* 每名角色最多同时拥有 6 只小鬼，数量达到上限时不会进行召唤。\n* 每只小鬼承受两次任意伤害的攻击后死亡；存在 13 秒后也会自动死亡。\n* 小鬼持有一把特殊的武器 ： 2 0 10 0，属于 机枪类，发射火焰子弹攻击敌人。\n** 该武器正常受 攻速因子影响。\n** 该武器的攻击归属于本角色，并且可受角色暴击率加成。\n* 孤勇者因子对小鬼没有影响。",
  "miner": "角色每拥有100金币，护甲上限＋1，最多增加 3 点。\n* 该天赋提供的加成效果生效时，玩家的护甲上限会以 金色 数字显示。\n湮灭虚空中，每有100金币，额外提供1层虚空护盾上限，上限3层。",
  "trapper": "敌人死亡时有 50% 概率产生一次普通爆炸；其半径为 3.5 格、伤害为 10，50%概率为目标附加灼烧。\n* 该爆炸属于无源伤害，造成的伤害和击败不计入关卡结算统计，也无法触发那些以角色击败敌人为条件的效果；但会纳入 怪物图鉴 和任务栏的统计。\n* 以下情况可使本天赋触发爆炸的概率变为 100%，且多人游戏中全队共享：\n**陷阱大师选择 遥控炸弹 大变活人 一二技能，且拥有导师强化时。\n**在多重人格因子下，随机到过符合上一条条件的角色。",
  "suit_prince": "角色位于 元素圈 范围内时，会产生以下影响：\n* 元素圈的伤害会在2秒内匀速增长100%（期间四舍六入）。\n**该伤害增长先于火盾、毒盾、冰盾计算。\n* 元素圈每0.5秒增加一次半径和持续时间，至多可增加3次。三次增加量分别为0.6，0.2，0.2格；1.2，0.4，0.4秒。\n**多人游戏中，每名角色分别计算加成并叠加。但范围加成可能会有一定程度的衰减，第二、三、四个触发加成的角色增幅分别为正常的70%、100%、90%。\n*** 特殊地：\n**** 空中支援的火圈范围增幅比正常多60%，但增加持续时间仅首次生效，且仅增加0.5秒。\n**** 脏脏的调色盘、仅增加颜料堆存在时间和伤害，范围加成不生效。\n**** 熔核之弓的火圈、聚爆极冰的冰圈仅增加范围，不加成伤害和持续时间。\n**** 神祭之剑的腐蚀区域与元素亲和的冰圈仅增加范围和持续时间，不加成伤害。\n**** 冲啊！逐浪号！的火圈仅增加伤害，不加成范围和持续时间。\n**元素药剂受加成情况较为复杂：\n***正常情况下，三种元素圈均无法受到伤害加成，火圈无法受到范围和持续时间加成，毒圈和冰圈的范围增幅比正常大10%。\n***受导师强化后，仅冰圈无法受到伤害加成，火圈可受范围和持续时间加成，且范围增幅比正常大100%。\n***三种元素圈增加持续时间仅首次生效，且仅增加0.5秒。\n**沙虫来袭的小型火圈在接触到角色时会先立即扩大至3格半径，再接受以上加成。\n**对庇护法阵具有特殊的适配效果，详见其页面。\n不受加成的元素圈包括：\n* 通常不影响敌方的元素圈。\n**但敌方附带元素圈的子弹，在被近战反弹等手段反弹后，产生的元素圈可被影响，尽管该元素圈仍属于敌方。\n* 部分我方元素圈不受加成，包括但不限于：\n**剧毒宝石、剧毒藤蔓、超级大宝贝儿的毒圈。\n**灾祸之石的 瘟疫圈。\n**粽叶枪、进化后的玄冥、寒霜冰环的冰圈。\n** 瓦克恩冲锋枪进化后的紫色毒圈。",
  "doctor": "该天赋有以下两种效果：\n* 角色的暴击率＋10%。\n* 角色的攻击造成暴击或释放技能时，在目标处降下36px\n**即使同时命中多个敌人，也仅产生一道落雷。\n**暴击触发该效果的冷却时间为 0.25 秒，释放技能触发无冷却。\n***多人游戏中，每名玩家触发落雷的冷却时间独立计算。\n**被落雷击中的敌人会同时生成电弧攻击半径15格内不被阻挡的另一个敌人。\n***电弧的攻击力也为 4 ，击中后可再传导至另一个敌人1次。\n***每道落雷发动该效果后需要冷却 0.2 秒才可再次发动。\n**少数攻击归属于角色的随从可以触发，详见随从页面。",
  "swordmaster": "本角色在释放技能后的 2.8 秒内30，完整释放技能后会额外获得 5 点剑意剑意。\n* 该移速增加效果属于C类加速，发动时角色会出现残影特效。",
  "gunner": "获得本天赋增益效果时，屏幕下方的特殊状态栏会出现本天赋的 图标，图标右上角的数字代表天赋层数。每层增益提升 10% 伤害，持续 5 秒，可叠加 5 层。\n* 本角色进入下一关或死亡时，该增益立即消失。",
  "lord": "领主获得 战意 属性，将显示于角色状态栏。\n战意的上限为 100% ，且积攒的战意进入下一小关后会清零。",
  "spellblade": "持有此天赋时，屏幕下方的特殊状态栏会出现本天赋的图标；本角色的攻击获得暴击率增益，图标右上角的数字代表增益数值。",
  "astrologer": "占星师获得 星能 属性，将显示于角色状态栏。\n星能的上限为 100 ，且积攒的星能进入下一小关后不会清除。\n* 处于战斗状态的敌人每次被本角色的技能击中时，会被附加一层 星之咒 标记，标记最多可叠加三层，贴图会随层数发生变化。\n**星之咒持续时间为 6 秒，且受到愤怒的首领、邪王的迷阵世界中敌人的抗性的影响；叠加时会重置时间。\n* 星之咒叠加至三层时触发 占星术，其效果视技能而定，同时此标记消失，本角色获得 3 点 星能 。\n**本角色死亡时，触发占星术无法获得星能，但仍正常可产生技能效果。\n**金矿隐藏房中的金矿 和 金币小人 触发占星术时无法获得星能。\n* 满星能时，本角色使用技能时会消耗所有星能强化本次技能。\n* 多个占星师在场时，若各自附加的星之咒拥有相同的贴图，则可以互相叠层，仅完成附加第三层的一方会触发占星术；若因皮肤不同拥有不同的星之咒贴图，则互不干扰。",
  "martialist": "持有此天赋时，屏幕下方的特殊状态栏会出现 气斗之魂 图标，图标右上角的数字代表所积攒的气斗之魂层数。",
  "illusionist": "每隔 5 秒，本角色会自动召唤一个 幻象 跟随战斗，幻象不能随角色一起进入下一小关。\n* 每位戏法师最多可同时携带 2 个幻象；若进行召唤时幻象数量已经达到上限，则什么也不会发生。",
  "bard": "拥有本天赋时，屏幕下方的特殊状态栏会出现本天赋的 图标，图标右上角会显示本角色累计击中敌人的次数，进入下一关不会清除。\n* 本角色累计击中敌人 10 次、或击败敌人时会清空计数，该敌人处掉落一个 音符，距离角色5格内时，音符会飞向角色并被吸取，使角色获得一层增益。\n**爆炸类子弹本体和爆炸击中敌人均可计数。\n**部分特殊攻击类型不会计数，包括但不限于：电钻\n* 增益持续3秒，最多可叠加3层，每次拾取音符都会重置持续时间。\n**获得增益后，特殊状态栏会出现第二个本天赋图标，图标右上角的数字代表层数，下方的数字代表剩余持续时间。\n**每层增益包括：\n***角色×(100＋5n)%，n为层数。\n***吸取音符时的主手武器 基础子弹大小+10%。\n***音律节拍的音波半径+16.7%。\n***共振乐章的音乐法阵和音波半径+？%。",
  "marksman": "本天赋效果发动时，屏幕下方的特殊状态栏会出现本天赋的 图标，同时角色身边会环绕 图标。图标右上角的数字和 的个数代表天赋层数。\n本角色每次击败敌人会获得一层增益，持续 10 秒，可叠加 4 层。\n* 每层增益令本角色攻速 ＋5%，暴击率＋5%，武器攻击偏移 - 2 。\n* 增益持续期间再度触发该效果，即可刷新持续时间并叠加一层增益；若层数已到最高，则只刷新持续时间。\n* 本角色死亡或进入下一关时，该增益立即消失。\n* 降临！紫爵士！技能期间击败敌人不会叠加增益，但可以刷新持续时间。",
  "mecha_girl": "机械姬的电量 电量上限从2格提升至4格。\n* 虽然官方对此天赋的描述中讲到“消耗能量可转化为对应的电量”，但实际上即使未解锁此天赋也同样拥有该效果。",
  "captain": "角色不会受到来自任何爆炸（包括普通爆炸、核爆）的伤害，也不会被上述爆炸击退和附加灼烧。",
  "yinyang": "阴阳家获得 阴阳值 属性，将显示于角色状态栏。\n使用技能会获取阴值或阳值，并强化技能效果【角色限定】",
  "gun_expert": "角色使用武器或手刀发动攻击后，将会随机召唤出一把武器发动攻击，并持续攻击 1 秒，随后该武器消失，同时该天赋进入 1 秒的冷却时间。\n* 每次召唤武器/武器消失过程中，都会有一个持续时间为0.15秒的前/后摇动画，即该武器实际发动持续攻击的时间为 1.3 秒。\n** 注：虽然该天赋的介绍为“触发时间会随着拾取武器数量的增加而缩减”，但实际无任何变化，且在某些情况下反而会出现冷却时间延长的情况，疑似为bug。\n* 该天赋召唤的武器一般不会装配配件，可正常受到各种属性与天赋加成，其面板攻击力为原武器初始面板攻击力的 $\\frac{1}{2}$（向上取整）。\n** 便携炸弹工厂进化后：召唤的地雷炸弹人的攻击力不受影响。\n* 召唤武器的范围最多为本角色拾取过的最后 10 把武器（后文用“（已）记录武器”简称），若再次拾取新的武器，将移除最先记录的武器。\n** 通过武器重铸获得的武器也会被一并记录。\n** 存在与记录武器相同的武器时，不会因多次拾取额外计入记录武器数，所有已记录武器产生的概率相同。\n** 由火力增援召唤出的机械随从使用过的武器也会被记录至该天赋内。\n** 角色在骑士之家拾取武器时不会立刻计入该天赋所记录武器数，需要在进入关卡后才能正常触发，原因不明。\n* 召唤出来的武器都相当于一把全新的武器，因而包括法杖、精致法杖等在内的武器在释放时会独立计算赋予角色的法球个数而不是延长其持续时间。\n* 通常情况下，该天赋召唤的武器不会消耗角色能量，但在召唤红龙机枪、白隐机枪和大菠萝时仍会根据射击次数消耗对应能量。\n* 该天赋召唤的武器的的攻击均属于本角色，可像常规武器一样受各项角色属性影响，也能受到混沌打击、六脉神剑、赏金标记、音律节拍、战意涌动与影遁加成。\n* 召唤出的神话武器的词条均可正常生效。",
  "cook": "击败敌人有概率掉落食材，食用后获得对应效果：\n击败敌人有概率掉落食材，食用后获得食材效果。"
}

/* 由 data/wiki/passives-full.json 解析：42角色被动简单数值 */
export var WIKI_PASSIVE_MODS = {
  "miner": {
    "maxArmor": 1.0
  },
  "doctor": {
    "crit": 10.0
  },
  "marksman": {
    "crit": 5.0,
    "fireRatePct": 5.0
  }
}

/* 维基角色被动 → 现有天赋效果（仅新角色，基础8角色已有硬编码被动） */
export var WIKI_PASSIVE_BUFF = {
  vampire: 'life_drain',
  paladin: 'armor_break',
  elf: 'charge_speed',
  priest: 'vampire',
  berserker: 'rapid_fire',
  trapper: 'poison_cloud',
  suit_prince: 'elemental_spread',
  doctor: 'thunder_wrath',
  gunner: 'rapid_fire',
  elemental: 'element_mastery',
  illusionist: 'crit_pierce',
  taoist: 'melee_reflect',
  martialist: 'thorns',
  necromancer: 'life_drain',
  cook: 'max_hp',
  miner: 'max_armor'
}

export var WIKI_PASSIVE_BUFF2 = {
  werewolf: 'thorns',
  druid: 'rapid_fire',
  robot: 'power_up',
  owl: 'crit_boost',
  time_ninja: 'crit_boost',
  special_force: 'damage_boost',
  qizong: 'crit_boost',
  demon_warlock: 'life_drain',
  swordmaster: 'damage_boost',
  marksman: 'fire_rate_boost',
  lord: 'damage_boost',
  spellblade: 'max_energy',
  astrologer: 'crit_boost',
  bard: 'fire_rate_boost',
  mecha_girl: 'max_energy',
  captain: 'damage_boost',
  yinyang: 'crit_boost',
  gun_expert: 'fire_rate_boost',
  transcendent: 'speed_boost',
  suit_prince: 'elemental_spread',
  doctor: 'thunder_wrath'
}

/* 技能形态人工修正：Wiki 机制更接近专属形态的角色 */
export var WIKI_SKILL_FORM_FIX = {
  werewolf: ['transform', 'shadow_strike', 'shadow_strike'],
  berserker: ['transform', 'shadow_strike', 'nova'],
  priest: ['heal', 'heal', 'holy_shield'],
  paladin: ['holy_shield', 'transform', 'holy_shield'],
  vampire: ['dash_strike', 'shadow_strike', 'nova'],
  mecha_girl: ['transform', 'beam', 'turret'],
  suit_prince: ['transform', 'turret', 'nova'],
  swordmaster: ['dash_strike', 'beam', 'shadow_strike']
}

/* 由各章 wiki boss phases 生成：Boss 阶段阈值 */
export var WIKI_BOSS_PHASE = {
  "goblin_priest": [
    1.0,
    0.5
  ],
  "snowman_king": [
    1.0,
    0.5
  ],
  "golden_monkey_king": [
    1.0,
    0.5
  ],
  "ruin_zulan": [
    1.0,
    0.5
  ],
  "cave_ice_worm": [
    1.0,
    0.5
  ],
  "boundless_dark_lord": [
    1.0,
    0.5
  ],
  "tomb_beetle_king": [
    1.0,
    0.5
  ],
  "great_wizard": [
    1.0,
    0.5
  ],
  "great_knight": [
    1.0,
    0.5
  ],
  "skeleton_king": [
    1.0,
    0.5
  ],
  "vc_mecha": [
    1.0,
    0.5
  ],
  "ghost_king": [
    1.0,
    0.5
  ],
  "headless_knight": [
    1.0,
    0.5
  ],
  "mechanical_queen": [
    1.0,
    0.5
  ],
  "mechanical_emperor": [
    1.0,
    0.5
  ],
  "volcano_sandworm": [
    1.0,
    0.5
  ],
  "anubis": [
    1.0,
    0.5
  ],
  "flying_dragon_cub": [
    1.0,
    0.5
  ],
  "wacken_leader": [
    1.0,
    0.5
  ],
  "colossus_zulan": [
    1.0,
    0.5
  ],
  "laser_ufo_boss": [
    1.0,
    0.5
  ],
  "pirate_king": [
    1.0,
    0.5
  ],
  "steel_wave_breaker": [
    1.0,
    0.5
  ],
  "stone_fog_dragon": [
    1.0,
    0.5
  ],
  "stone_ancestor": [
    1.0,
    0.5
  ],
  "hua_xiong": [
    1.0,
    0.5
  ],
  "li_jue": [
    1.0,
    0.5
  ],
  "dong_zhuo": [
    1.0,
    0.5
  ],
  "final_weapon_01": [
    1.0,
    0.5
  ],
  "abyss_navigator": [
    1.0,
    0.5
  ],
  "stone_ancestor_arm": [
    1.0,
    0.5
  ]
}

/* 由 data/wiki/talents-full.json 生成：97条天赋图鉴 */
export var WIKI_TALENT_LIST = [
  {
    "name": "破甲保护",
    "desc": "护甲被破坏时不受到额外伤害",
    "group": "可选天赋"
  },
  {
    "name": "毒盾",
    "desc": "免疫毒气及减速，对敌人中毒伤害提升",
    "group": "可选天赋"
  },
  {
    "name": "火盾",
    "desc": "降低爆炸伤害并免疫火焰，对敌人火焰伤害提升",
    "group": "可选天赋"
  },
  {
    "name": "冰盾",
    "desc": "免疫冰冻，对敌人的冰冻时间增加",
    "group": "可选天赋"
  },
  {
    "name": "刺盾",
    "desc": "免疫陷阱，免疫碰撞伤害",
    "group": "可选天赋"
  },
  {
    "name": "破甲冲击",
    "desc": "受到攻击时释放冲击随从强化波",
    "group": "可选天赋"
  },
  {
    "name": "金盾",
    "desc": "每100金币增加1点护甲上限，最多增加3点",
    "group": "可选天赋"
  },
  {
    "name": "护甲+1",
    "desc": "护甲+1",
    "group": "可选天赋"
  },
  {
    "name": "破甲修复",
    "desc": "护甲破碎时立即恢复50%的护甲值，60秒可触发一次",
    "group": "可选天赋"
  },
  {
    "name": "元素生甲",
    "desc": "对敌人施加负面状态时，25%几率恢复1点护甲。",
    "group": "可选天赋"
  },
  {
    "name": "生命+4",
    "desc": "提升生命值上限",
    "group": "可选天赋"
  },
  {
    "name": "药水箱子",
    "desc": "打破箱子可能掉落生命药水，箱子掉落能量球的概率提升",
    "group": "可选天赋"
  },
  {
    "name": "恢复强化",
    "desc": "获得100%的恢复强度",
    "group": "可选天赋"
  },
  {
    "name": "击败回血",
    "desc": "击败敌人将有概率掉落生命球",
    "group": "可选天赋"
  },
  {
    "name": "击败回蓝",
    "desc": "击败敌人将有概率掉落能量球",
    "group": "可选天赋"
  },
  {
    "name": "能量+100",
    "desc": "能量上限+100",
    "group": "可选天赋"
  },
  {
    "name": "疾步生甲",
    "desc": "造成暴击会短暂提升角色移动速度。角色移动时会缓慢恢复护甲",
    "group": "可选天赋"
  },
  {
    "name": "雷暴",
    "desc": "暴击提升10%。释放技能或暴击时，在目标处落下雷电。",
    "group": "可选天赋"
  },
  {
    "name": "暴击穿透",
    "desc": "子弹暴击会穿透敌人",
    "group": "可选天赋"
  },
  {
    "name": "子弹弹射",
    "desc": "子弹拥有弹射效果",
    "group": "可选天赋"
  },
  {
    "name": "散弹增加",
    "desc": "增加散弹枪的子弹数量",
    "group": "可选天赋"
  },
  {
    "name": "连击强化",
    "desc": "连续攻击武器的连击次数增加",
    "group": "可选天赋"
  },
  {
    "name": "子弹分裂",
    "desc": "远程子弹命中时，有50%几率释放一枚额外子弹。",
    "group": "可选天赋"
  },
  {
    "name": "武器多持",
    "desc": "能额外携带一把武器",
    "group": "可选天赋"
  },
  {
    "name": "蓄力加快",
    "desc": "蓄力武器蓄力加快",
    "group": "可选天赋"
  },
  {
    "name": "元素精通",
    "desc": "元素效果子弹暴击也造成双倍伤害。加强法杖武器",
    "group": "可选天赋"
  },
  {
    "name": "激光加粗",
    "desc": "增加光电类武器宽度，并免疫感电伤害",
    "group": "可选天赋"
  },
  {
    "name": "近战扩大",
    "desc": "增加近战武器攻击距离",
    "group": "可选天赋"
  },
  {
    "name": "近战反弹",
    "desc": "近战武器反弹子弹",
    "group": "可选天赋"
  },
  {
    "name": "旋风斩",
    "desc": "近战击败敌人时，释放一次旋风斩，冷却时间4秒。",
    "group": "可选天赋"
  },
  {
    "name": "练气要诀",
    "desc": "手刀攻击时，消耗能量，释放气功波",
    "group": "可选天赋"
  },
  {
    "name": "冷却加快",
    "desc": "减少技能冷却时间",
    "group": "可选天赋"
  },
  {
    "name": "雕像精通",
    "desc": "雕像能触发两次，能够同时使用两个雕像",
    "group": "可选天赋"
  },
  {
    "name": "攻速加快",
    "desc": "每次攻击获得1层持续3秒的攻速提升，每层+2%，最多5层；叠满后额外+10%攻速。",
    "group": "可选天赋"
  },
  {
    "name": "精准暴击",
    "desc": "子弹更准更容易暴击",
    "group": "可选天赋"
  },
  {
    "name": "动能打击",
    "desc": "移动时积攒动能，下一次攻击命中时消耗全部动能造成最多3额外伤害，动能攒满时必定暴击并眩晕目标。",
    "group": "可选天赋"
  },
  {
    "name": "满血暴击",
    "desc": "攻击满血敌人时必定暴击。",
    "group": "可选天赋"
  },
  {
    "name": "血怒",
    "desc": "生命与护甲越低，暴击率和攻速提升越高。",
    "group": "可选天赋"
  },
  {
    "name": "格斗之魂",
    "desc": "攻击命中叠加「斗志」，持续5秒，最多10层；满层时触发「格斗之魂」，持续5秒，近战子弹体积和暴击率大幅提升。",
    "group": "可选天赋"
  },
  {
    "name": "元素轮转",
    "desc": "玩家每3秒在燃烧、冰冻、中毒、感电状态间循环切换。处于对应状态时，攻击命中敌人有50%概率触发对应元素效果，并使该元素伤害提升50%",
    "group": "可选天赋"
  },
  {
    "name": "一身是胆",
    "desc": "每次使用技能都会提升10%伤害，可叠加5层，角色血量降至1时触发满层效果。",
    "group": "可选天赋"
  },
  {
    "name": "随从强化",
    "desc": "宠物和随从体积和生命值增幅50%，造成的伤害增幅100%",
    "group": "可选天赋"
  },
  {
    "name": "热狗",
    "desc": "战斗状态下，宠物和随从的攻击频率增幅70%，移动速度增幅60%",
    "group": "可选天赋"
  },
  {
    "name": "子弹减速",
    "desc": "降低敌人子弹速度，拾起金币能量球范围提升",
    "group": "可选天赋"
  },
  {
    "name": "尸爆",
    "desc": "敌人死亡时有概率产生爆炸",
    "group": "可选天赋"
  },
  {
    "name": "愈战愈勇",
    "desc": "每击败1名敌人后攻速提升5%，暴击率提升5%，偏移减少2，最多叠加4层，持续时间为10秒（每击败敌人会重置持续时间）。",
    "group": "可选天赋"
  },
  {
    "name": "商店半价",
    "desc": "商店打五折",
    "group": "可选天赋"
  },
  {
    "name": "宝石增加",
    "desc": "游戏结束时获得更多宝石奖励",
    "group": "可选天赋"
  },
  {
    "name": "枪械回响",
    "desc": "每隔一段时间，攻击会额外触发这局游戏内随机一把已拾取过的武器的攻击，持续一小段时间。这个效果的触发间隔会随着拾取过的武器数量提高而缩减。",
    "group": "可选天赋"
  },
  {
    "name": "地牢美食家",
    "desc": "击败敌人有概率掉落食材，食用后获得食材效果。",
    "group": "可选天赋"
  },
  {
    "name": "武器浮游",
    "desc": "使你的副武器进入浮游状态【角色限定】",
    "group": "角色限定天赋"
  },
  {
    "name": "内劲",
    "desc": "手刀因气宗修行的功夫而转变为三段击打，第三段击打会释放气功波，造成范围伤害【角色限定】",
    "group": "角色限定天赋"
  },
  {
    "name": "噩灵宿主",
    "desc": "击杀敌人时，会召唤出一个火焰小鬼。火焰小鬼跟随玩家移动，并且可以阻挡子弹【角色限定】",
    "group": "角色限定天赋"
  },
  {
    "name": "元能掌握",
    "desc": "降低爆炸伤害并免疫火焰，对敌人火焰伤害提升，免疫冰冻，对敌人的冰冻时间增加。战斗期间随机升起元素碑攻击敌人【角色限定】",
    "group": "角色限定天赋"
  },
  {
    "name": "维度穿梭",
    "desc": "超界者会在多个维度穿梭，这会让他有一定概率不会受到任何伤害。每5次手刀攻击后会释放1次强化手刀【角色限定】",
    "group": "角色限定天赋"
  },
  {
    "name": "天狗倒",
    "desc": "每隔一段时间自动对近身的敌人发动快速踢击",
    "group": "角色限定天赋"
  },
  {
    "name": "特种精通",
    "desc": "每次切换形态时，获得持续一段时间额外的攻速加成，期间近战武器攻击会附带剑气，法杖的攻击加强",
    "group": "角色限定天赋"
  },
  {
    "name": "剑心",
    "desc": "释放技能提升移动速度，完整释放技能后剑意+5【角色限定】",
    "group": "角色限定天赋"
  },
  {
    "name": "战意涌动",
    "desc": "攻击敌人或者承受伤害可获取战意。战意叠加至满层后获得增益，提升自身体型、攻击速度、移动速度，并增强自己的攻击。【角色限定】",
    "group": "角色限定天赋"
  },
  {
    "name": "星之咒",
    "desc": "技能施加星之咒，叠至3层时触发占星术，效果视技能而定并提供星能。积累足够星能可以强化技能。【角色限定】",
    "group": "角色限定天赋"
  },
  {
    "name": "森罗幻象",
    "desc": "每隔5秒，会创造一个幻象，幻象会自动攻击敌人",
    "group": "角色限定天赋"
  },
  {
    "name": "充能协议",
    "desc": "电量上限增加，消耗能量可转化为对应的电量【角色限定】",
    "group": "角色限定天赋"
  },
  {
    "name": "爆炸狂欢",
    "desc": "免疫任何爆炸桶造成的伤害。",
    "group": "角色限定天赋"
  },
  {
    "name": "阴阳流转",
    "desc": "使用技能会获取阴值或阳值，并强化技能效果【角色限定】",
    "group": "角色限定天赋"
  },
  {
    "name": "井水增益",
    "desc": "能量恢复+1",
    "group": "特殊天赋"
  },
  {
    "name": "导师强化",
    "desc": "角色技能变得更强大了",
    "group": "特殊天赋"
  },
  {
    "name": "神圣新星",
    "desc": "受到致命伤害时，释放神圣新星，免疫这次伤害，冷却时间300秒。\n神圣新星：清除弹幕，消灭非领主敌人，对领主造成大量伤害，治疗所有友军。",
    "group": "特殊天赋"
  },
  {
    "name": "冰霜之环",
    "desc": "每10秒获得一层屏障，最多存储1层，每层屏障可抵挡一次伤害并释放冰霜之环。\n冰霜之环：使周围的敌人进入寒冷状态，降低移动速度，若敌人处在寒冷状态下，会将其冻结。",
    "group": "特殊天赋"
  },
  {
    "name": "疾步生风",
    "desc": "移动一定距离后，释放一道龙卷风，持续吸附并伤害敌人，可消除弹幕。",
    "group": "特殊天赋"
  },
  {
    "name": "灵魂打击",
    "desc": "敌人死亡时掉落灵魂，收集足够的灵魂后，下一次攻击命中时释放灵魂打击。\n灵魂打击：对目标造成大量伤害，对目标附近造成范围伤害，每次释放后伤害永久增加0.5%",
    "group": "特殊天赋"
  },
  {
    "name": "元素爆发",
    "desc": "释放技能后，下次攻击获得增强，并附带随机元素效果。",
    "group": "特殊天赋"
  },
  {
    "name": "烈焰吐息",
    "desc": "每3秒释放一次锥形的烈焰吐息。\n烈焰吐息：灼烧命中的敌人，若敌人处在灼烧状态下，将造成一次爆炸。",
    "group": "特殊天赋"
  },
  {
    "name": "墨镜支援",
    "desc": "戴上【墨镜】，呼叫好朋友火力支援，冷却时间20秒。",
    "group": "特殊天赋"
  },
  {
    "name": "十万伏特",
    "desc": "与宠物、随从、召唤物接近时持续对附近敌人降下闪电。",
    "group": "特殊天赋"
  },
  {
    "name": "无尽能源",
    "desc": "战斗时攻击有几率使伤害+4，并恢复20%已消耗的能量。",
    "group": "特殊天赋"
  },
  {
    "name": "黑玫诅咒",
    "desc": "标记击中的敌人，武器击中标记时对周围产生50%伤害。",
    "group": "特殊天赋"
  },
  {
    "name": "蓄势",
    "desc": "击中敌人后1秒内造成的伤害会被吸收，之后16秒内击中敌人时造成被吸收伤害总量20%的额外伤害。",
    "group": "特殊天赋"
  },
  {
    "name": "武器模仿",
    "desc": "主武器模仿备用武器的攻击形态，持续1秒，冷却8秒。",
    "group": "特殊天赋"
  },
  {
    "name": "猴群召唤",
    "desc": "召唤一群猴子。",
    "group": "特殊天赋"
  },
  {
    "name": "元素扩散",
    "desc": "站在元素范围内时，其半径和伤害逐渐增加，持续时间延长。",
    "group": "特殊天赋"
  },
  {
    "name": "静能储蓄",
    "desc": "原地蓄力时间越长，暴击率越高。",
    "group": "特殊天赋"
  },
  {
    "name": "落音缤纷",
    "desc": "连续攻击敌人时或敌人死亡时掉落音符，拾取后子弹大小+10%、移动速度+5%，持续3秒，效果可叠加至多3层。",
    "group": "特殊天赋"
  },
  {
    "name": "爆竹召唤",
    "desc": "释放技能时候会丢出一些爆竹，爆竹触碰到敌人便会爆炸，或一段时间后自行爆炸。",
    "group": "特殊天赋"
  },
  {
    "name": "毒素精通",
    "desc": "中毒效果可以叠加至多3层",
    "group": "特殊天赋"
  },
  {
    "name": "破冰",
    "desc": "对冰冻状态下的敌人，造成的伤害增加50%。",
    "group": "特殊天赋"
  },
  {
    "name": "冰冻延长",
    "desc": "冰冻效果时间延长0.5秒。",
    "group": "特殊天赋"
  },
  {
    "name": "宠物召唤",
    "desc": "当前每有100点蓝量，召唤1只随机宠物。",
    "group": "特殊天赋"
  },
  {
    "name": "宠物模仿",
    "desc": "宠物会模仿你的攻击，冷却时间3秒。",
    "group": "特殊天赋"
  },
  {
    "name": "吸血虫",
    "desc": "防御-1，每6秒汲取周围敌人的血量。",
    "group": "特殊天赋"
  },
  {
    "name": "熟能生巧",
    "desc": "同一房间内，每次使用技能后，技能伤害提升10%。",
    "group": "特殊天赋"
  },
  {
    "name": "激光折射",
    "desc": "光电类武器命中时有30%几率折射3道激光。",
    "group": "特殊天赋"
  },
  {
    "name": "尖刺外壳",
    "desc": "受到伤害时，释放一圈尖刺，最大生命值越高，尖刺伤害越高。",
    "group": "特殊天赋"
  },
  {
    "name": "元素抵挡",
    "desc": "每8秒抵挡一次元素效果",
    "group": "特殊天赋"
  },
  {
    "name": "冰锥飞刺",
    "desc": "冰元素伤害暴击时会向周围发射3冰锥。",
    "group": "特殊天赋"
  },
  {
    "name": "冰雕爆破",
    "desc": "敌人被冰元素伤害击杀时50%概率变成冰雕，会追着敌人爆炸，产生半径2的冰属性爆炸，给予敌人12冰元素伤害。",
    "group": "特殊天赋"
  },
  {
    "name": "寒霜冰环",
    "desc": "敌人被冰元素伤害击杀时有40%概率触发一个冰圈。",
    "group": "特殊天赋"
  },
  {
    "name": "巨枭魔宠",
    "desc": "拥有一只巨枭魔宠，自身受到伤害会使巨枭消失一段时间【角色限定】",
    "group": "特殊天赋"
  }
]

/* 技能形态修正 v2：黑洞/陨石 */
export var WIKI_SKILL_FORM_FIX2 = {
  transcendent: ['blackhole', 'shadow_strike', 'beam'],
  astrologer: ['meteor', 'beam', 'nova'],
  elemental: ['meteor', 'beam', 'nova'],
  spellblade: ['meteor', 'dash_strike', 'nova']
}

/* 由 data/wiki/monsters-db.json 生成：敌人刷怪权重 */
export var WIKI_ENEMY_WEIGHT = {
  "slime": 1,
  "boar": 1,
  "mummy": 1,
  "goblin_guard": 1,
  "goblin_shaman": 3,
  "large_goblin": 4,
  "boar_wiki": 1,
  "liver_persimmon": 1,
  "blue_algae": 3,
  "miner": 1,
  "small_snow_ape": 1,
  "big_snow_ape": 3,
  "gold_worm": 1,
  "crystal_bug": 1,
  "snow_ape_thrower": 1,
  "monkey": 2,
  "rock_crab": 1,
  "arrow_statue": 1,
  "guard_statue": 1,
  "laser_statue": 1,
  "guard_crab": 1,
  "ruin_guard": 1,
  "ruin_seeker": 1,
  "ruin_defender": 4,
  "ancient_gear": 2,
  "ruin_trap": 3,
  "work_robot": 1,
  "sentry_mech": 1,
  "blaster_miner": 1,
  "crystal_giant": 2,
  "small_crystal_giant": 1,
  "miner_boss_wiki": 2,
  "ice_worm_larva": 1,
  "mushroom_child": 1,
  "mushroom_man": 1,
  "old_god_touch": 3,
  "painting_goblin": 2,
  "goblin_kin": 1,
  "deep_sea_knight": 1,
  "sacred_beetle": 1,
  "tomb_monkey": 1,
  "tomb_monkey_leader": 1,
  "tomb_skeleton": 3,
  "elite_tomb_skeleton": 1,
  "castle_knight": 1,
  "elite_castle_knight": 2,
  "castle_wizard": 3,
  "large_soldier": 4,
  "black_knight": 1,
  "castle_turret": 4,
  "skeleton_soldier": 1,
  "elite_skeleton_soldier": 2,
  "skeleton_shaman": 3,
  "big_skeleton": 4,
  "spider": 1,
  "poison_spider": 1,
  "pumpkin_man": 1,
  "elite_pumpkin_man": 1,
  "zombie": 1,
  "frog": 1,
  "ghost": 1,
  "witch": 1,
  "knight_p": 2,
  "knight_b": 2,
  "knight_s": 3,
  "knight_x": 3,
  "bishop": 2,
  "soldier": 1,
  "mummy_wiki": 1,
  "elite_mummy": 3,
  "flame_knight": 1,
  "flame_great_knight": 1,
  "heat_bug": 1,
  "volcano_turtle": 2,
  "alien": 1,
  "ufo": 2,
  "wacken_soldier": 2,
  "tentacle_monster": 3,
  "demon": 2,
  "flying_demon": 2,
  "pirate_a": 1,
  "pirate_b": 2,
  "dancer": 1,
  "pirate_c": 1,
  "pirate_d": 8,
  "laser_crab": 3,
  "source_stone": 1,
  "stone_car": 4,
  "stone_man": 1,
  "stone_eagle": 2,
  "stone_ox": 4,
  "stone_horse": 4
}

/* 由 data/wiki/monsters-db.json 生成：精英刷怪权重 */
export var WIKI_ELITE_WEIGHT = {
  "heat_bug": 2
}

/* 维基 DB 红武字段缺失的 Boss，按页面主题补一把红武 */
export var WIKI_BOSS_RED_EXTRA = {
  ruin_zulan: 'red_w26',
  colossus_zulan: 'red_w26',
  stone_ancestor_arm: 'red_w31',
  stone_ancestor: 'red_w30',
  hua_xiong: 'red_w31',
  li_jue: 'red_w35',
  final_weapon_01: 'red_w27'
}
