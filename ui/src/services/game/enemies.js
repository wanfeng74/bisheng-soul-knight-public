/*
 * 敌人 / Boss 数据表（world-data 交付）。
 *
 * 设计约定：
 *  - 数值单位与引擎一致：hp/dmg 为整数点，speed 为逻辑像素/秒，radius 为碰撞半径。
 *  - 每章 6 种普通敌人，chapter 数组标明可出现的章节；强度随章节递增。
 *  - behavior 取契约允许值：chase/shoot/charge/bomb/summon/burst/strafe/burrow/flyer/tank。
 *  - attack.type 取契约允许值：contact/shoot/charge/bomb/summon/burst。
 *  - sprite 命名：普通敌人 enemy_<id>，Boss boss_<id>（与美术契约 5.5 节一致）。
 *  - 本文件只依赖同目录 constants.js / rng.js，保持 ES5 语法以适配 QuickJS。
 */
import { CHAPTERS, FLOOR_COUNT, FINAL_BOSS, WIKI_CHAPTER1, WIKI_CHAPTER2, WIKI_CHAPTER3, WIKI_CHAPTER4 } from './constants.js'
import { rint, weighted } from './rng.js'

/* ================= 普通敌人（18 种） ================= */

export var ENEMIES = {
  /* ---------- 第 1 章：森林遗迹 ---------- */
  slime: {
    id: 'slime', name: '史莱姆', chapter: [1], behavior: 'chase',
    hp: 14, speed: 42, dmg: 1, radius: 11, contactCd: 0.9, flying: false,
    sprite: 'enemy_slime',
    attack: { type: 'contact' },
    coins: [1, 3],
    desc: '森林里最常见的软泥怪，一蹦一蹦往人身上撞。'
  },
  goblin: {
    id: 'goblin', name: '哥布林', chapter: [1], behavior: 'chase',
    hp: 20, speed: 58, dmg: 1, radius: 11, contactCd: 0.8, flying: false,
    sprite: 'enemy_goblin',
    attack: { type: 'contact' },
    coins: [1, 3],
    desc: '成群结队的绿皮小怪，跑得比史莱姆快，怕范围武器。'
  },
  goblin_archer: {
    id: 'goblin_archer', name: '哥布林弓手', chapter: [1], behavior: 'shoot',
    hp: 16, speed: 44, dmg: 1, radius: 11, contactCd: 1.0, flying: false,
    sprite: 'enemy_goblin_archer',
    attack: { type: 'shoot', cd: 1.8, range: 300, speed: 210, dmg: 1, count: 1, spread: 0.12, telegraph: 0.35 },
    coins: [2, 4],
    desc: '站在远处放冷箭，开火前会拉弓蓄力，注意走位。'
  },
  boar: {
    id: 'boar', name: '野猪', chapter: [1], behavior: 'charge',
    hp: 30, speed: 48, dmg: 2, radius: 13, contactCd: 1.0, flying: false,
    sprite: 'enemy_boar',
    attack: { type: 'charge', cd: 2.8, telegraph: 0.6, speed: 260, dmg: 2, range: 220 },
    coins: [2, 4],
    desc: '蓄力后直线冲撞，撞墙会短暂眩晕，可以从侧面绕开。'
  },
  treant: {
    id: 'treant', name: '树精', chapter: [1], behavior: 'tank',
    hp: 52, speed: 26, dmg: 2, radius: 15, contactCd: 1.1, flying: false,
    sprite: 'enemy_treant',
    attack: { type: 'contact' },
    coins: [3, 6],
    desc: '又厚又慢的老树，靠血肉之躯堵路，用穿透武器对付它。'
  },
  mushroom_mage: {
    id: 'mushroom_mage', name: '蘑菇法师', chapter: [1], behavior: 'burst',
    hp: 24, speed: 36, dmg: 1, radius: 12, contactCd: 1.0, flying: false,
    sprite: 'enemy_mushroom_mage',
    attack: { type: 'burst', cd: 2.6, range: 260, speed: 150, dmg: 1, count: 5, spread: 1.4, telegraph: 0.5 },
    coins: [2, 5],
    desc: '会朝四周喷一圈孢子弹幕，蓄力时身体发亮，别贴脸。'
  },

  /* ---------- 第 2 章：沙海地宫 ---------- */
  scorpion: {
    id: 'scorpion', name: '沙蝎', chapter: [2], behavior: 'chase',
    hp: 26, speed: 62, dmg: 2, radius: 11, contactCd: 0.9, flying: false,
    sprite: 'enemy_scorpion',
    attack: { type: 'contact' },
    coins: [2, 4],
    desc: '沙地里窜出来的毒蝎，移动快、尾刺疼，别让它贴身。'
  },
  mummy: {
    id: 'mummy', name: '木乃伊', chapter: [2], behavior: 'chase',
    hp: 44, speed: 34, dmg: 2, radius: 12, contactCd: 1.1, flying: false,
    sprite: 'enemy_mummy',
    attack: { type: 'contact' },
    coins: [3, 5],
    desc: '从石棺里爬出的干尸，动作僵硬但很耐打。'
  },
  bandit: {
    id: 'bandit', name: '沙匪', chapter: [2], behavior: 'strafe',
    hp: 34, speed: 56, dmg: 2, radius: 12, contactCd: 0.9, flying: false,
    sprite: 'enemy_bandit',
    attack: { type: 'shoot', cd: 1.6, range: 320, speed: 230, dmg: 1, count: 2, spread: 0.22, telegraph: 0.3 },
    coins: [3, 6],
    desc: '端着旧枪的沙匪，会左右横移保持距离，双发点射。'
  },
  sand_worm: {
    id: 'sand_worm', name: '沙虫', chapter: [2], behavior: 'burrow',
    hp: 38, speed: 48, dmg: 2, radius: 14, contactCd: 1.0, flying: false,
    sprite: 'enemy_sand_worm',
    attack: { type: 'contact' },
    coins: [3, 6],
    desc: '钻进沙里再从脚底破土而出，听沙沙声提前走位。'
  },
  fire_imp: {
    id: 'fire_imp', name: '火魔', chapter: [2], behavior: 'flyer',
    hp: 28, speed: 66, dmg: 1, radius: 10, contactCd: 1.0, flying: true,
    sprite: 'enemy_fire_imp',
    attack: { type: 'shoot', cd: 2.0, range: 280, speed: 180, dmg: 1, count: 1, spread: 0.15, telegraph: 0.4 },
    coins: [3, 5],
    desc: '悬空飞行的火精灵，会隔着障碍抛火球，优先点掉。'
  },
  sand_golem: {
    id: 'sand_golem', name: '沙石魔像', chapter: [2], behavior: 'tank',
    hp: 72, speed: 28, dmg: 2, radius: 16, contactCd: 1.2, flying: false,
    sprite: 'enemy_sand_golem',
    attack: { type: 'contact' },
    coins: [4, 8],
    desc: '地宫守卫，血厚防高、移动缓慢，是精英房里最难缠的墙。'
  },

  /* ---------- 第 3 章：霜寒王座 ---------- */
  ice_slime: {
    id: 'ice_slime', name: '冰史莱姆', chapter: [3], behavior: 'chase',
    hp: 34, speed: 46, dmg: 2, radius: 11, contactCd: 0.9, flying: false,
    sprite: 'enemy_ice_slime',
    attack: { type: 'contact' },
    coins: [3, 5],
    desc: '冻硬的史莱姆，撞人更疼，碎裂时会溅出冰碴。'
  },
  ice_wolf: {
    id: 'ice_wolf', name: '冰狼', chapter: [3], behavior: 'charge',
    hp: 42, speed: 78, dmg: 2, radius: 12, contactCd: 0.85, flying: false,
    sprite: 'enemy_ice_wolf',
    attack: { type: 'charge', cd: 2.4, telegraph: 0.5, speed: 320, dmg: 2, range: 260 },
    coins: [3, 6],
    desc: '雪原上最危险的猎手，扑击又快又远，看到压低身位就准备翻滚。'
  },
  snowman: {
    id: 'snowman', name: '雪人', chapter: [3], behavior: 'bomb',
    hp: 46, speed: 40, dmg: 2, radius: 13, contactCd: 1.1, flying: false,
    sprite: 'enemy_snowman',
    attack: { type: 'bomb', cd: 2.8, range: 240, speed: 160, dmg: 2, count: 1, radius: 36, telegraph: 0.5 },
    coins: [3, 6],
    desc: '扔出会在脚下炸开的雪球，落点有阴影提示，别站原地。'
  },
  ice_mage: {
    id: 'ice_mage', name: '冰法师', chapter: [3], behavior: 'shoot',
    hp: 38, speed: 42, dmg: 2, radius: 12, contactCd: 1.0, flying: false,
    sprite: 'enemy_ice_mage',
    attack: { type: 'burst', cd: 2.4, range: 320, speed: 190, dmg: 1, count: 3, spread: 0.5, telegraph: 0.45 },
    coins: [4, 7],
    desc: '一次射出三枚冰锥，呈小扇形封锁走位。'
  },
  frost_spider: {
    id: 'frost_spider', name: '霜蛛', chapter: [3], behavior: 'chase',
    hp: 30, speed: 86, dmg: 2, radius: 10, contactCd: 0.8, flying: false,
    sprite: 'enemy_frost_spider',
    attack: { type: 'contact' },
    coins: [3, 5],
    desc: '全场最快的杂兵，靠数量围上来，优先用范围伤害清。'
  },
  crystal_golem: {
    id: 'crystal_golem', name: '水晶魔像', chapter: [3], behavior: 'tank',
    hp: 95, speed: 30, dmg: 3, radius: 17, contactCd: 1.2, flying: false,
    sprite: 'enemy_crystal_golem',
    attack: { type: 'contact' },
    coins: [5, 9],
    desc: '霜寒王座的看门石像，血量与伤害都是普通怪里的顶点。'
  }
}

/* ================= Boss（4 个） =================
 * phaseAt：血量百分比阈值，从 1.0 开始逐个阶段；routine 的长度与 phaseAt 一致，
 *         每个阶段是一串按顺序循环施放的 patterns 键名。
 * patterns：cd 为冷却秒数；telegraph 为前摇（给玩家躲避窗口）。
 */
export var BOSSES = {
  goblin_chief: {
    id: 'goblin_chief', name: '哥布林酋长', chapter: 1,
    hp: 420, speed: 52, dmg: 2, contactCd: 1.0, radius: 26, flying: false,
    sprite: 'boss_goblin_chief',
    phaseAt: [1.0, 0.5],
    patterns: {
      charge: { cd: 4.2, telegraph: 0.7, speed: 280, dmg: 2 },
      radial: { cd: 3.0, count: 12, speed: 150, dmg: 1, radius: 7 },
      summon: { cd: 7.0, mob: 'goblin', count: 2 },
      aimed: { cd: 2.2, count: 3, speed: 220, dmg: 1, spread: 0.18 }
    },
    routine: [['charge', 'radial'], ['summon', 'aimed', 'charge']],
    coins: [40, 60], gems: 12,
    desc: '森林遗迹的统治者，会冲撞、环形弹幕并召唤哥布林小弟。'
  },
  sand_queen: {
    id: 'sand_queen', name: '沙海女王', chapter: 2,
    hp: 560, speed: 56, dmg: 2, contactCd: 1.0, radius: 28, flying: false,
    sprite: 'boss_sand_queen',
    phaseAt: [1.0, 0.5],
    patterns: {
      charge: { cd: 4.6, telegraph: 0.65, speed: 250, dmg: 2 },
      radial: { cd: 2.6, count: 16, speed: 130, dmg: 1, radius: 6 },
      summon: { cd: 6.5, mob: 'scorpion', count: 2 },
      aimed: { cd: 1.8, count: 5, speed: 200, dmg: 1, spread: 0.30 }
    },
    routine: [['radial', 'aimed'], ['summon', 'charge', 'aimed']],
    coins: [55, 80], gems: 16,
    desc: '沉睡在沙海地宫的女王，沙暴弹幕更密，还会唤醒沙蝎。'
  },
  ice_queen: {
    id: 'ice_queen', name: '冰霜女王', chapter: 3,
    hp: 700, speed: 58, dmg: 3, contactCd: 1.0, radius: 28, flying: false,
    sprite: 'boss_ice_queen',
    phaseAt: [1.0, 0.5],
    patterns: {
      charge: { cd: 4.0, telegraph: 0.6, speed: 270, dmg: 2 },
      radial: { cd: 2.4, count: 18, speed: 125, dmg: 1, radius: 6 },
      summon: { cd: 6.0, mob: 'ice_slime', count: 2 },
      aimed: { cd: 1.6, count: 5, speed: 210, dmg: 1, spread: 0.28 }
    },
    routine: [['radial', 'aimed'], ['summon', 'charge', 'radial']],
    coins: [70, 100], gems: 20,
    desc: '霜寒王座的守门人，冰锥扇形更大，半血后召唤冰史莱姆。'
  },
  dark_knight: {
    id: 'dark_knight', name: '暗黑骑士', chapter: 3,
    hp: 1100, speed: 64, dmg: 3, contactCd: 1.0, radius: 30, flying: false,
    sprite: 'boss_dark_knight',
    phaseAt: [1.0, 0.5],
    patterns: {
      charge: { cd: 3.6, telegraph: 0.55, speed: 300, dmg: 3 },
      radial: { cd: 2.2, count: 20, speed: 140, dmg: 1, radius: 6 },
      summon: { cd: 5.5, mob: 'crystal_golem', count: 1 },
      aimed: { cd: 1.4, count: 6, speed: 240, dmg: 2, spread: 0.25 }
    },
    routine: [['charge', 'aimed'], ['summon', 'radial', 'charge']],
    coins: [120, 180], gems: 40,
    desc: '第 9 层终局 Boss，冲刺更快、弹幕更密，还会召唤水晶魔像。'
  }
}

/* ================= 维基第一大关占位数据 =================
 * 名称/行为按维基；HP/速度/伤害暂用同类原型占位，后续逐页替换。
 * 单独放在 WIKI_ENEMIES / WIKI_BOSSES，不影响旧数据表数量与测试契约。
 */
function cloneWikiDef(base, id, name, desc) {
  var d = {}
  for (var k in base) if (Object.prototype.hasOwnProperty.call(base, k)) d[k] = base[k]
  d.id = id
  d.name = name
  d.chapter = [1]
  d.sprite = 'enemy_' + id
  d.desc = desc
  return d
}

export var WIKI_ENEMIES = {}
;(function () {
  var specs = [
    ['goblin_guard', '哥布林小兵', 'goblin', '森林常见小兵，持手枪、长枪或弓箭。'],
    ['goblin_shaman', '哥布林萨满', 'mushroom_mage', '森林法师，发射会分裂的漩涡弹。'],
    ['large_goblin', '大型哥布林', 'treant', '体型更大的哥布林，血厚。'],
    ['boar_wiki', '野猪', 'boar', '横冲直撞的野猪。'],
    ['liver_persimmon', '肝柿', 'slime', '森林里游荡的柿子怪。'],
    ['blue_algae', '蓝藻花', 'goblin_archer', '会远程攻击的蓝藻花。'],
    ['miner', '矿工', 'slime', '冰原矿工。'],
    ['small_snow_ape', '小雪猿', 'goblin', '冰原小雪猿。'],
    ['big_snow_ape', '大雪猿', 'treant', '会捶地发射雪球的大雪猿。'],
    ['gold_worm', '金矿虫', 'boar', '冰原矿虫。'],
    ['crystal_bug', '水晶虫', 'frost_spider', '冰原水晶虫。'],
    ['snow_ape_thrower', '雪猿投手', 'ice_mage', '投掷雪球的雪猿。'],
    ['monkey', '猴子', 'goblin', '遗迹猴子。'],
    ['rock_crab', '岩蟹', 'treant', '遗迹岩蟹。'],
    ['arrow_statue', '箭台守卫石像', 'goblin_archer', '会射箭的守卫石像。'],
    ['guard_statue', '守卫石像', 'treant', '遗迹守卫石像。'],
    ['laser_statue', '激光守卫石像', 'mushroom_mage', '发射激光的守卫石像。'],
    ['guard_crab', '守卫蟹', 'boar', '遗迹守卫蟹。'],
    ['ruin_guard', '遗迹卫兵', 'treant', '机械遗迹卫兵。'],
    ['ruin_seeker', '遗迹搜寻者', 'goblin', '机械遗迹搜寻者。'],
    ['ruin_defender', '遗迹守卫', 'sand_golem', '机械遗迹重装守卫。'],
    ['ancient_gear', '远古齿轮组', 'slime', '会滚动的远古齿轮。'],
    ['ruin_trap', '遗迹机关', 'goblin_archer', '固定式遗迹机关。'],
    ['ruin_portal', '传送门', 'mushroom_mage', '机械遗迹中的召唤型敌人。'],
    ['work_robot', '工作型开采机器人', 'sand_golem', '溶洞中的开采机器人。'],
    ['sentry_mech', '哨卫型载人机甲', 'goblin_archer', '溶洞哨卫机甲。'],
    ['blaster_miner', '爆破矿工', 'fire_imp', '溶洞爆破矿工。'],
    ['crystal_giant', '水晶巨人', 'treant', '溶洞水晶巨人。'],
    ['small_crystal_giant', '小水晶巨人', 'slime', '溶洞小水晶巨人。'],
    ['miner_boss_wiki', '矿工头目', 'goblin_chief', '溶洞矿工头目。'],
    ['ice_worm_larva', '冰虫幼崽', 'frost_spider', '溶洞冰虫幼崽。'],
    ['mushroom_child', '蘑菇人幼崽', 'slime', '沼泽蘑菇人幼崽。'],
    ['mushroom_man', '蘑菇人', 'goblin', '沼泽蘑菇人。'],
    ['old_god_touch', '旧日之触', 'treant', '沼泽旧日之触。'],
    ['painting_goblin', '画画哥布林', 'goblin_archer', '沼泽画画哥布林。'],
    ['goblin_kin', '哥布林眷属', 'goblin', '沼泽哥布林眷属。'],
    ['deep_sea_knight', '深渊骑士', 'sand_golem', '沼泽深渊骑士。'],
    ['sacred_beetle', '圣甲虫', 'slime', '墓穴圣甲虫。'],
    ['tomb_monkey', '盗墓猴', 'goblin', '墓穴盗墓猴。'],
    ['tomb_monkey_leader', '盗墓猴头领', 'treant', '墓穴盗墓猴头领。'],
    ['tomb_skeleton', '守墓骷髅', 'goblin_archer', '墓穴守墓骷髅。'],
    ['elite_tomb_skeleton', '精英守墓骷髅', 'sand_golem', '墓穴精英守墓骷髅。'],
    ['castle_knight', '骑士', 'goblin', '城堡骑士。'],
    ['elite_castle_knight', '精英骑士', 'sand_golem', '城堡精英骑士。'],
    ['castle_wizard', '巫师小怪', 'mushroom_mage', '城堡巫师小怪。'],
    ['large_soldier', '大型士兵', 'treant', '城堡大型士兵。'],
    ['black_knight', '黑骑士', 'boar', '城堡黑骑士。'],
    ['castle_turret', '炮台', 'goblin_archer', '城堡固定炮台。'],
    ['skeleton_soldier', '骷髅小兵', 'goblin', '地下城堡骷髅小兵。'],
    ['elite_skeleton_soldier', '精英骷髅小兵', 'sand_golem', '地下城堡精英骷髅小兵。'],
    ['skeleton_shaman', '骷髅萨满', 'mushroom_mage', '地下城堡骷髅萨满。'],
    ['big_skeleton', '大号骷髅', 'treant', '地下城堡大号骷髅。'],
    ['spider', '蜘蛛', 'frost_spider', '地下城堡蜘蛛。'],
    ['poison_spider', '毒蜘蛛', 'boar', '地下城堡毒蜘蛛。'],
    ['pumpkin_man', '南瓜人', 'goblin', '女巫森林南瓜人。'],
    ['elite_pumpkin_man', '精英南瓜人', 'sand_golem', '女巫森林精英南瓜人。'],
    ['zombie', '僵尸', 'slime', '女巫森林僵尸。'],
    ['frog', '青蛙', 'boar', '女巫森林青蛙。'],
    ['ghost', '幽灵', 'mushroom_mage', '女巫森林幽灵。'],
    ['witch', '巫婆', 'ice_mage', '女巫森林巫婆。'],
    ['knight_p', '骑士-P', 'goblin', '奇械城骑士-P。'],
    ['knight_b', '骑士-B', 'sand_golem', '奇械城骑士-B。'],
    ['knight_s', '骑士-S', 'goblin_archer', '奇械城骑士-S。'],
    ['knight_x', '骑士-X', 'boar', '奇械城骑士-X。'],
    ['bishop', '主教', 'mushroom_mage', '奇械城主教。'],
    ['soldier', '士兵', 'treant', '奇械城士兵。'],
    ['mummy_wiki', '木乃伊', 'goblin', '火山木乃伊。'],
    ['elite_mummy', '精英木乃伊', 'sand_golem', '火山精英木乃伊。'],
    ['flame_knight', '火焰骑士', 'goblin_archer', '火山火焰骑士。'],
    ['flame_great_knight', '火焰大骑士', 'treant', '火山火焰大骑士。'],
    ['heat_bug', '热能飞虫', 'frost_spider', '火山热能飞虫。'],
    ['volcano_turtle', '火山龟', 'boar', '火山火山龟。'],
    ['alien', '外星人', 'goblin', '外星基地外星人。'],
    ['ufo', '飞碟', 'frost_spider', '外星基地飞碟。'],
    ['wacken_soldier', '瓦克恩士兵', 'sand_golem', '外星基地瓦克恩士兵。'],
    ['tentacle_monster', '触手怪', 'treant', '外星基地触手怪。'],
    ['demon', '魔物', 'goblin_archer', '外星基地魔物。'],
    ['flying_demon', '飞行魔物', 'ice_mage', '外星基地飞行魔物。'],
    ['pirate_a', '甲型步战海盗', 'goblin', '泥油海岛甲型步战海盗。'],
    ['pirate_b', '乙型步战海盗·搏击款', 'sand_golem', '泥油海岛乙型步战海盗。'],
    ['dancer', '代号“舞者”', 'goblin_archer', '泥油海岛代号“舞者”。'],
    ['pirate_c', '丙型两栖海盗', 'boar', '泥油海岛丙型两栖海盗。'],
    ['pirate_d', '丁型特种步战海盗', 'treant', '泥油海岛丁型特种步战海盗。'],
    ['laser_crab', '量产型激光浮游蟹', 'mushroom_mage', '泥油海岛量产型激光浮游蟹。'],
    ['source_stone', '源石', 'slime', '巨石山脉遗迹源石。'],
    ['stone_car', '石械·车', 'boar', '巨石山脉遗迹石械·车。'],
    ['stone_man', '石械·人', 'goblin', '巨石山脉遗迹石械·人。'],
    ['stone_eagle', '石械·鹰', 'frost_spider', '巨石山脉遗迹石械·鹰。'],
    ['stone_ox', '石械·牛', 'treant', '巨石山脉遗迹石械·牛。'],
    ['stone_horse', '石械·马', 'sand_golem', '巨石山脉遗迹石械·马。'],
    ['spearman', '长矛兵', 'goblin', '古战场长矛兵。'],
    ['archer_soldier', '弓箭兵', 'goblin_archer', '古战场弓箭兵。'],
    ['cavalry', '骑兵', 'boar', '古战场骑兵。'],
    ['fan_soldier', '羽扇兵', 'mushroom_mage', '古战场羽扇兵。'],
    ['mine_soldier', '地雷兵', 'slime', '古战场地雷兵。'],
    ['net_soldier', '捕网兵', 'sand_golem', '古战场捕网兵。'],
    ['parasite_crew', '寄生船员', 'goblin', '海底寄生船员。'],
    ['kraken_servant', '克拉肯仆从', 'treant', '海底克拉肯仆从。'],
    ['test_subject_001', '试验体-001', 'sand_golem', '海底试验体-001。'],
    ['test_subject_002', '试验体-002', 'goblin_archer', '海底试验体-002。'],
    ['test_subject_003', '试验体-003', 'boar', '海底试验体-003。'],
    ['test_subject_004', '试验体-004', 'mushroom_mage', '海底试验体-004。']
  ]
  for (var i = 0; i < specs.length; i++) {
    var s = specs[i]
    WIKI_ENEMIES[s[0]] = cloneWikiDef(ENEMIES[s[2]], s[0], s[1], s[3])
  }
})()

export var WIKI_BOSSES = {}
;(function () {
  var specs = [
    ['goblin_priest', '哥布林祭师', 'goblin_chief', '森林首领，哥布林祭师。'],
    ['snowman_king', '雪人王', 'ice_queen', '冰原首领，雪人王。'],
    ['golden_monkey_king', '金面猴王', 'goblin_chief', '遗迹首领，金面猴王。'],
    ['ruin_zulan', '遗迹 祖兰', 'ice_queen', '机械遗迹首领，遗迹 祖兰。'],
    ['cave_ice_worm', '溶洞冰虫', 'ice_queen', '溶洞首领，溶洞冰虫。'],
    ['boundless_dark_lord', '无垠黑暗之主', 'dark_knight', '沼泽首领，无垠黑暗之主。'],
    ['tomb_beetle_king', '守墓甲虫王', 'ice_queen', '墓穴首领，守墓甲虫王。'],
    ['great_wizard', '大巫师', 'sand_queen', '城堡首领，大巫师。'],
    ['great_knight', '大骑士', 'goblin_chief', '城堡首领，大骑士。'],
    ['skeleton_king', '骷髅王', 'sand_queen', '地下城堡首领，骷髅王。'],
    ['vc_mecha', '维C机甲', 'dark_knight', '地下城堡首领，维C机甲。'],
    ['ghost_king', '幽灵王', 'sand_queen', '女巫森林首领，幽灵王。'],
    ['headless_knight', '无头骑士和他的马', 'goblin_chief', '女巫森林首领，无头骑士和他的马。'],
    ['mechanical_queen', '机械皇后', 'ice_queen', '奇械城首领，机械皇后。'],
    ['mechanical_emperor', '机械皇帝', 'dark_knight', '奇械城首领，机械皇帝。'],
    ['volcano_sandworm', '火山沙虫', 'sand_queen', '火山首领，火山沙虫。'],
    ['flying_dragon_cub', '飞龙幼崽', 'ice_queen', '火山首领，飞龙幼崽。'],
    ['anubis', '阿努比斯', 'goblin_chief', '火山首领，阿努比斯。'],
    ['wacken_leader', '瓦克恩头目', 'sand_queen', '外星基地首领，瓦克恩头目。'],
    ['colossus_zulan', '巨像 祖兰', 'dark_knight', '外星基地首领，巨像 祖兰。'],
    ['laser_ufo_boss', '镭射幽浮', 'ice_queen', '外星基地首领，镭射幽浮。'],
    ['pirate_king', '“大王级”钢铁海盗', 'sand_queen', '泥油海岛首领，“大王级”钢铁海盗。'],
    ['steel_wave_breaker', '钢铁破浪者号', 'dark_knight', '泥油海岛首领，钢铁破浪者号。'],
    ['stone_ancestor_arm', '岩祖之肱', 'sand_queen', '巨石山脉遗迹首领，岩祖之肱。'],
    ['stone_fog_dragon', '石械·雾影龙', 'ice_queen', '巨石山脉遗迹首领，石械·雾影龙。'],
    ['stone_ancestor', '石械·岩祖', 'dark_knight', '巨石山脉遗迹首领，石械·岩祖。'],
    ['hua_xiong', '华雄', 'sand_queen', '古战场首领，华雄。'],
    ['li_jue', '李傕', 'goblin_chief', '古战场首领，李傕。'],
    ['dong_zhuo', '董卓', 'dark_knight', '古战场首领，董卓。'],
    ['final_weapon_01', '最终兵器·〇一号机', 'ice_queen', '古战场首领，最终兵器·〇一号机。'],
    ['abyss_navigator', '深渊潜航者', 'dark_knight', '海底首领，深渊潜航者。']
  ]
  for (var i = 0; i < specs.length; i++) {
    var s = specs[i]
    var d = cloneWikiDef(BOSSES[s[2]], s[0], s[1], s[3])
    d.chapter = 1
    WIKI_BOSSES[s[0]] = d
  }
})()

/* 第一大关维基行为覆盖：名称/攻击方式按维基，HP 仍待补 */
;(function () {
  function setAtk(id, behavior, speed, dmg, atk) {
    var d = WIKI_ENEMIES[id]
    if (!d) return
    d.behavior = behavior
    d.speed = speed
    d.dmg = dmg
    d.attack = atk || { type: 'contact' }
  }
  setAtk('goblin_guard', 'shoot', 46, 2, { type: 'shoot', cd: 1.7, range: 280, speed: 190, dmg: 2, count: 1, spread: 0.12, telegraph: 0.35 })
  setAtk('goblin_shaman', 'burst', 38, 3, { type: 'burst', cd: 2.3, range: 280, speed: 160, dmg: 3, count: 3, spread: 1.2, telegraph: 0.45 })
  setAtk('large_goblin', 'tank', 28, 3, { type: 'contact' })
  setAtk('boar_wiki', 'charge', 52, 2, { type: 'charge', cd: 2.6, telegraph: 0.55, speed: 260, dmg: 2, range: 230 })
  setAtk('liver_persimmon', 'chase', 40, 2, { type: 'contact' })
  setAtk('blue_algae', 'shoot', 34, 2, { type: 'shoot', cd: 2.0, range: 260, speed: 180, dmg: 2, count: 1, spread: 0.1, telegraph: 0.4 })
  setAtk('miner', 'chase', 44, 2, { type: 'contact' })
  setAtk('small_snow_ape', 'chase', 52, 2, { type: 'contact' })
  setAtk('big_snow_ape', 'burst', 34, 2, { type: 'burst', cd: 2.6, range: 300, speed: 150, dmg: 2, count: 12, spread: 6.283, telegraph: 0.6 })
  setAtk('gold_worm', 'charge', 50, 2, { type: 'charge', cd: 2.4, telegraph: 0.5, speed: 240, dmg: 2, range: 240 })
  setAtk('crystal_bug', 'chase', 58, 2, { type: 'contact' })
  setAtk('snow_ape_thrower', 'burst', 40, 2, { type: 'burst', cd: 2.2, range: 300, speed: 170, dmg: 2, count: 3, spread: 0.6, telegraph: 0.45 })
  setAtk('monkey', 'chase', 56, 2, { type: 'contact' })
  setAtk('rock_crab', 'tank', 30, 2, { type: 'contact' })
  setAtk('arrow_statue', 'shoot', 28, 2, { type: 'shoot', cd: 1.9, range: 320, speed: 220, dmg: 2, count: 1, spread: 0.08, telegraph: 0.4 })
  setAtk('guard_statue', 'tank', 26, 3, { type: 'contact' })
  setAtk('laser_statue', 'shoot', 26, 2, { type: 'shoot', cd: 2.1, range: 340, speed: 240, dmg: 2, count: 1, spread: 0, telegraph: 0.5 })
  setAtk('guard_crab', 'charge', 46, 2, { type: 'charge', cd: 2.5, telegraph: 0.5, speed: 250, dmg: 2, range: 230 })
  setAtk('ruin_guard', 'tank', 32, 3, { type: 'contact' })
  setAtk('ruin_seeker', 'chase', 58, 2, { type: 'contact' })
  setAtk('ruin_defender', 'tank', 28, 3, { type: 'contact' })
  setAtk('ancient_gear', 'chase', 44, 2, { type: 'contact' })
  setAtk('ruin_trap', 'shoot', 24, 2, { type: 'shoot', cd: 1.8, range: 320, speed: 210, dmg: 2, count: 1, spread: 0.1, telegraph: 0.35 })
  setAtk('ruin_portal', 'summon', 20, 1, { type: 'summon', cd: 4.5, range: 300, mob: 'ruin_seeker' })
})()

/* 维基首领招式占位：用现有 boss 招式框架表达，具体弹速/前摇后续逐页校准 */
;(function () {
  var gp = WIKI_BOSSES.goblin_priest
  if (gp) {
    gp.patterns = {
      radial: { cd: 3.0, count: 6, speed: 150, dmg: 3, radius: 7 },
      aimed: { cd: 2.2, count: 3, speed: 210, dmg: 3, spread: 0.22 },
      summon: { cd: 6.0, mob: 'goblin_guard', count: 2 },
      charge: { cd: 4.0, telegraph: 0.6, speed: 260, dmg: 3 }
    }
    gp.routine = [['radial', 'aimed'], ['summon', 'charge', 'radial']]
  }
  var sk = WIKI_BOSSES.snowman_king
  if (sk) {
    sk.patterns = {
      radial: { cd: 2.8, count: 10, speed: 130, dmg: 2, radius: 6, element: 'ice' },
      aimed: { cd: 1.8, count: 4, speed: 210, dmg: 3, spread: 0.3, element: 'ice' },
      summon: { cd: 6.0, mob: 'small_snow_ape', count: 1 },
      charge: { cd: 4.2, telegraph: 0.65, speed: 260, dmg: 3 }
    }
    sk.routine = [['radial', 'aimed'], ['summon', 'radial', 'aimed']]
  }
  var gmk = WIKI_BOSSES.golden_monkey_king
  if (gmk) {
    gmk.patterns = {
      radial: { cd: 2.6, count: 12, speed: 150, dmg: 2, radius: 7 },
      aimed: { cd: 1.8, count: 4, speed: 220, dmg: 2, spread: 0.25 },
      summon: { cd: 6.0, mob: 'monkey', count: 2 },
      charge: { cd: 3.8, telegraph: 0.55, speed: 280, dmg: 3 }
    }
    gmk.routine = [['charge', 'aimed'], ['summon', 'radial', 'charge']]
  }
  var rz = WIKI_BOSSES.ruin_zulan
  if (rz) {
    rz.patterns = {
      radial: { cd: 2.2, count: 16, speed: 140, dmg: 2, radius: 6 },
      aimed: { cd: 1.5, count: 5, speed: 230, dmg: 2, spread: 0.26 },
      summon: { cd: 5.5, mob: 'ruin_seeker', count: 2 },
      charge: { cd: 3.6, telegraph: 0.55, speed: 300, dmg: 3 }
    }
    rz.routine = [['radial', 'aimed'], ['summon', 'charge', 'radial']]
  }
})()

/* 用维基第一关页攻击力覆盖（HP 维基未给出，仍用占位） */
;(function () {
  var ids = WIKI_CHAPTER1.enemies || {}
  for (var id in ids) {
    if (!Object.prototype.hasOwnProperty.call(ids, id)) continue
    var d = WIKI_ENEMIES[id]
    if (d) {
      d.dmg = ids[id]
      if (d.attack) d.attack.dmg = ids[id]
    }
  }
  var bids = WIKI_CHAPTER1.bosses || {}
  for (var bid in bids) {
    if (!Object.prototype.hasOwnProperty.call(bids, bid)) continue
    if (WIKI_BOSSES[bid]) WIKI_BOSSES[bid].dmg = bids[bid]
  }
  var ids2 = WIKI_CHAPTER2.enemies || {}
  for (var id2 in ids2) {
    if (!Object.prototype.hasOwnProperty.call(ids2, id2)) continue
    var d2 = WIKI_ENEMIES[id2]
    if (d2) {
      d2.dmg = ids2[id2]
      if (d2.attack) d2.attack.dmg = ids2[id2]
    }
  }
  var bids2 = WIKI_CHAPTER2.bosses || {}
  for (var bid2 in bids2) {
    if (!Object.prototype.hasOwnProperty.call(bids2, bid2)) continue
    if (WIKI_BOSSES[bid2]) WIKI_BOSSES[bid2].dmg = bids2[bid2]
  }
  var ids3 = WIKI_CHAPTER3.enemies || {}
  for (var id3 in ids3) {
    if (!Object.prototype.hasOwnProperty.call(ids3, id3)) continue
    if (ids3[id3] > 15) continue
    var d3 = WIKI_ENEMIES[id3]
    if (d3) {
      d3.dmg = ids3[id3]
      if (d3.attack) d3.attack.dmg = ids3[id3]
    }
  }
  var bids3 = WIKI_CHAPTER3.bosses || {}
  for (var bid3 in bids3) {
    if (!Object.prototype.hasOwnProperty.call(bids3, bid3)) continue
    if (bids3[bid3] > 15) continue
    if (WIKI_BOSSES[bid3]) WIKI_BOSSES[bid3].dmg = bids3[bid3]
  }
  var ids4 = WIKI_CHAPTER4.enemies || {}
  for (var id4 in ids4) {
    if (!Object.prototype.hasOwnProperty.call(ids4, id4)) continue
    if (ids4[id4] > 15) continue
    var d4 = WIKI_ENEMIES[id4]
    if (d4) {
      d4.dmg = ids4[id4]
      if (d4.attack) d4.attack.dmg = ids4[id4]
    }
  }
  var bids4 = WIKI_CHAPTER4.bosses || {}
  for (var bid4 in bids4) {
    if (!Object.prototype.hasOwnProperty.call(bids4, bid4)) continue
    if (bids4[bid4] > 15) continue
    if (WIKI_BOSSES[bid4]) WIKI_BOSSES[bid4].dmg = bids4[bid4]
  }
  /* 维基正文明确给出的少数 HP */
  if (WIKI_ENEMIES.old_god_touch) WIKI_ENEMIES.old_god_touch.hp = 35
  if (WIKI_ENEMIES.tentacle_monster) WIKI_ENEMIES.tentacle_monster.hp = 22
})()

/* ================= 查询接口 ================= */

function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key)
}

export function enemyById(id) {
  if (typeof id !== 'string') return null
  if (hasOwn(ENEMIES, id)) return ENEMIES[id]
  if (hasOwn(WIKI_ENEMIES, id)) return WIKI_ENEMIES[id]
  return null
}

export function bossById(id) {
  if (typeof id !== 'string') return null
  if (hasOwn(BOSSES, id)) return BOSSES[id]
  if (hasOwn(WIKI_BOSSES, id)) return WIKI_BOSSES[id]
  return null
}

/* 按章节与楼层给敌人加权：越深的层越容易刷出池子里靠后的强怪 */
function rollEnemyId(rng, pool, floorIndex) {
  var items = []
  var i
  for (i = 0; i < pool.length; i++) {
    items.push([pool[i], 1 + i * (0.25 + 0.05 * floorIndex)])
  }
  return weighted(rng, items)
}

/*
 * 生成一波敌人：spawnWave(rng, chapter, floorIndex, roomType) -> [{ id, elite }]
 * - 入口/商店/宝箱/雕像/首领房不刷普通小怪（首领由引擎单独生成）
 * - 战斗房数量随层数从 2~3 涨到 4~5；精英房 1~2 个精英
 * - 同一 rng 种子输出完全一致
 */
export function spawnWave(rng, chapter, floorIndex, roomType) {
  var ch = Number(chapter)
  if (!(ch >= 1 && ch <= CHAPTERS.length)) ch = 1
  ch = Math.floor(ch)
  var fi = Number(floorIndex)
  if (!(fi >= 1)) fi = 1
  fi = Math.floor(fi)
  if (fi > FLOOR_COUNT) fi = FLOOR_COUNT
  var type = roomType || 'battle'
  var out = []
  var i, count, base
  var pool = CHAPTERS[ch - 1].enemyPool

  if (type === 'start' || type === 'shop' || type === 'treasure' || type === 'statue' || type === 'boss') {
    return out
  }

  if (type === 'elite') {
    count = 1
    if (fi >= 5 && rint(rng, 0, 1) === 1) count = 2
    for (i = 0; i < count; i++) {
      out.push({ id: rollEnemyId(rng, pool, fi), elite: true })
    }
    return out
  }

  /* 普通战斗房：2~3 -> 3~4 -> 4~5 */
  base = 2 + Math.floor((fi - 1) / 3)
  if (base > 4) base = 4
  count = rint(rng, base, base + 1)
  for (i = 0; i < count; i++) {
    out.push({ id: rollEnemyId(rng, pool, fi), elite: false })
  }
  return out
}

/* 精英怪的数值倍率，由引擎在生成实体时乘到基础值上 */
export function eliteScale() {
  return { hp: 1.8, dmg: 1.25, speed: 1.05, coins: 2.2 }
}

/*
 * 楼层 Boss 选择：floorBoss(chapter, floorIndex) -> bossId
 * - 第 9 层（FLOOR_COUNT）固定为终局 Boss dark_knight
 * - 其余楼层取该章配置的 Boss（第 1 章哥布林酋长 / 第 2 章沙海女王 / 第 3 章冰霜女王）
 * 注意：引擎请同时传入 floorIndex；只传 chapter 时第 9 层会按章节 Boss 返回。
 * generateFloor 产出的 floor.bossId 已经是同一套规则算好的正确值。
 */
export function floorBoss(chapter, floorIndex) {
  var ch = Number(chapter)
  if (!(ch >= 1 && ch <= CHAPTERS.length)) ch = 1
  ch = Math.floor(ch)
  var fi = Number(floorIndex)
  if (!(fi >= 1)) fi = 0
  if (fi >= FLOOR_COUNT) return FINAL_BOSS
  return CHAPTERS[ch - 1].boss
}
