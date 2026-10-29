/*
 * 角色数据（8 名可玩角色）。
 *
 * 数值设计对标《元气骑士》：
 *   - 基础生命 5~9 点，护甲 3~9 点，能量 120~220；
 *   - 暴击 3%~15%，移速 0.90~1.15 倍（PLAYER_SPEED 为基准）；
 *   - 角色定位靠"生命/护甲/能量/暴击/移速"五项差异体现，不做职业专属被动，
 *     差异化主要来自技能（引擎实现）与起始武器。
 *
 * 只依赖同目录常量模块；不 import 其他数据模块，避免循环依赖。
 * 代码风格：ES5（var / function），会被打进 QuickJS 包。
 */

import { WIKI_CHARACTERS, WIKI_SKILLS, WIKI_SKILL_FORMS, WIKI_SKILL_TUNING2, WIKI_PASSIVE_DESC, WIKI_SKILL_FORM_FIX, WIKI_SKILL_FORM_FIX2 } from './constants.js'

/*
 * 技能冷却为秒数，引擎乘 charStats().skillCdMul（升级减 CD）后使用。
 * 技能 id 与引擎约定固定，不要改。
 */
export var CHARACTERS = {
  knight: {
    id: 'knight',
    name: '骑士',
    title: '双持剑士',
    desc: '王国最后的守门人。板甲厚重，双持时能在一瞬间倾泻成倍火力，是最稳的开局选择。',
    hp: 7,
    armor: 6,
    energy: 140,
    crit: 5,
    speed: 1.0,
    color: '#c9c9d8',
    sprite: 'player_knight',
    starterWeapon: 'pistol',
    skill: {
      id: 'dual_wield',
      name: '双持',
      desc: '短时间内双持当前武器，射速大幅提升',
      cd: 12
    },
    unlockCost: 0
  },
  rogue: {
    id: 'rogue',
    name: '游侠',
    title: '疾风浪人',
    desc: '在遗迹间穿梭的影子。生命不高，但暴击与移速拔尖，翻滚可以躲开绝大多数弹幕。',
    hp: 6,
    armor: 4,
    energy: 180,
    crit: 10,
    speed: 1.12,
    color: '#7ee787',
    sprite: 'player_rogue',
    starterWeapon: 'dagger',
    skill: {
      id: 'roll',
      name: '翻滚',
      desc: '向移动方向翻滚，短暂无敌并提升移速',
      cd: 6
    },
    unlockCost: 500
  },
  wizard: {
    id: 'wizard',
    name: '法师',
    title: '元素学者',
    desc: '把地牢当实验室的元素学者。能量池最深，奥术飞弹会自动追猎视野内的敌人。',
    hp: 5,
    armor: 4,
    energy: 220,
    crit: 7,
    speed: 0.98,
    color: '#4a7dff',
    sprite: 'player_wizard',
    starterWeapon: 'apprentice_staff',
    skill: {
      id: 'arcane_bolt',
      name: '奥术飞弹',
      desc: '发射数枚追踪奥术飞弹，命中造成范围伤害',
      cd: 8
    },
    unlockCost: 800
  },
  elf: {
    id: 'elf',
    name: '精灵',
    title: '林间射手',
    desc: '森林遗迹的原住民。弓术精湛，箭雨可以覆盖整片房间，适合喜欢拉扯的玩家。',
    hp: 6,
    armor: 5,
    energy: 180,
    crit: 8,
    speed: 1.02,
    color: '#a5e887',
    sprite: 'player_elf',
    starterWeapon: 'short_bow',
    skill: {
      id: 'arrow_rain',
      name: '箭雨',
      desc: '向四周倾泻箭雨，持续数秒',
      cd: 12
    },
    unlockCost: 1200
  },
  engineer: {
    id: 'engineer',
    name: '工程师',
    title: '机械师',
    desc: '把废铁拼成战争机器的人。护甲最厚、能架起自动炮台，稳扎稳打的阵地流。',
    hp: 7,
    armor: 7,
    energy: 160,
    crit: 4,
    speed: 0.96,
    color: '#ff9f1c',
    sprite: 'player_engineer',
    starterWeapon: 'smg',
    skill: {
      id: 'turret',
      name: '炮台',
      desc: '放置自动炮台，持续射击附近敌人',
      cd: 18
    },
    unlockCost: 1500
  },
  assassin: {
    id: 'assassin',
    name: '刺客',
    title: '暗影行者',
    desc: '暗影里的刀锋。暴击率全场最高，影袭可瞬移到敌人背后打出必暴一击。',
    hp: 5,
    armor: 3,
    energy: 190,
    crit: 15,
    speed: 1.15,
    color: '#b06bff',
    sprite: 'player_assassin',
    starterWeapon: 'dagger',
    skill: {
      id: 'shadow_strike',
      name: '影袭',
      desc: '瞬移突刺最近敌人，背刺必定暴击',
      cd: 7
    },
    unlockCost: 2000
  },
  alchemist: {
    id: 'alchemist',
    name: '炼金术士',
    title: '药剂师',
    desc: '随身携带半座实验室的疯子。毒瓶会在原地留下毒雾，把整条走廊变成陷阱。',
    hp: 6,
    armor: 5,
    energy: 200,
    crit: 6,
    speed: 1.0,
    color: '#3fbf6f',
    sprite: 'player_alchemist',
    starterWeapon: 'apprentice_staff',
    skill: {
      id: 'poison_flask',
      name: '毒瓶',
      desc: '投掷毒瓶，落点形成持续伤害的毒雾',
      cd: 10
    },
    unlockCost: 2500
  },
  paladin: {
    id: 'paladin',
    name: '圣骑士',
    title: '圣光守卫',
    desc: '教会最后的圣光守卫。生命与护甲双高，圣盾可吸收伤害并反伤，冲脸最安心。',
    hp: 9,
    armor: 9,
    energy: 120,
    crit: 3,
    speed: 0.9,
    color: '#ffd93d',
    sprite: 'player_paladin',
    starterWeapon: 'rusty_blade',
    skill: {
      id: 'holy_shield',
      name: '圣盾',
      desc: '展开圣光护盾，吸收伤害并灼烧贴近的敌人',
      cd: 16
    },
    unlockCost: 3000
  },
  vampire: {
    id: 'vampire', name: '吸血鬼', title: '暗夜贵族',
    desc: '以鲜血为力量的暗夜猎手。',
    hp: 4, armor: 5, energy: 180, crit: 5, speed: 1.0,
    color: '#c86bff', sprite: 'player_assassin',
    starterWeapon: 'blood_blade',
    skill: { id: 'shadow_strike', name: '蝙蝠突袭', desc: '化身蝙蝠突进并吸取生命。', cd: 12 },
    unlockCost: 3500
  },
  werewolf: {
    id: 'werewolf', name: '狼人', title: '月下狂兽',
    desc: '月圆之夜化身狼人，以爪牙撕碎敌人。',
    hp: 5, armor: 4, energy: 180, crit: 5, speed: 1.08,
    color: '#b07a4a', sprite: 'player_knight',
    starterWeapon: 'blood_blade',
    skill: { id: 'roll', name: '狼扑', desc: '向前扑击，扑击期间短暂无敌。', cd: 8 },
    unlockCost: 4000
  },
  berserker: {
    id: 'berserker', name: '狂战士', title: '不灭战魂',
    desc: '越战越勇的狂战士。',
    hp: 6, armor: 4, energy: 180, crit: 5, speed: 1.0,
    color: '#ff6b4a', sprite: 'player_knight',
    starterWeapon: 'giant_hammer',
    skill: { id: 'dual_wield', name: '狂暴', desc: '短时间内双持武器并提升射速。', cd: 14 },
    unlockCost: 4500
  },
  robot: {
    id: 'robot', name: '机器人', title: '机械造物',
    desc: '来自遗迹的机械战士。',
    hp: 4, armor: 5, energy: 200, crit: 5, speed: 0.98,
    color: '#9adcff', sprite: 'player_engineer',
    starterWeapon: 'engineer_turret',
    skill: { id: 'turret', name: '无人机', desc: '部署自动攻击的无人机。', cd: 15 },
    unlockCost: 5000
  },
  priest: {
    id: 'priest', name: '牧师', title: '圣光信徒',
    desc: '以圣光守护同伴的治疗者。',
    hp: 4, armor: 4, energy: 200, crit: 5, speed: 0.98,
    color: '#ffe9a8', sprite: 'player_paladin',
    starterWeapon: 'holy_flail',
    skill: { id: 'holy_shield', name: '圣光', desc: '展开圣光护盾并灼烧敌人。', cd: 15 },
    unlockCost: 5500
  },
  druid: {
    id: 'druid', name: '德鲁伊', title: '自然之友',
    desc: '与自然共生的德鲁伊。',
    hp: 5, armor: 4, energy: 180, crit: 5, speed: 1.0,
    color: '#7ee787', sprite: 'player_elf',
    starterWeapon: 'magic_bow',
    skill: { id: 'arrow_rain', name: '自然之怒', desc: '召唤自然箭雨攻击区域。', cd: 14 },
    unlockCost: 6000
  },
  trapper: {
    id: 'trapper', name: '陷阱大师', title: '机关猎人',
    desc: '用陷阱和毒物狩猎敌人。',
    hp: 4, armor: 5, energy: 180, crit: 5, speed: 1.0,
    color: '#ffb86b', sprite: 'player_rogue',
    starterWeapon: 'poison_bottle',
    skill: { id: 'poison_flask', name: '陷阱布置', desc: '投掷毒气陷阱。', cd: 11 },
    unlockCost: 6500
  },
  qizong: {
    id: 'qizong', name: '气宗', title: '内劲修行者',
    desc: '以气御敌的修行者。',
    hp: 5, armor: 4, energy: 180, crit: 10, speed: 1.04,
    color: '#b3ecff', sprite: 'player_wizard',
    starterWeapon: 'energy_sword',
    skill: { id: 'arcane_bolt', name: '气功波', desc: '释放穿透气功波。', cd: 10 },
    unlockCost: 7000
  },
  transcendent: {
    id: 'transcendent', name: '超界者', title: '维度旅人',
    desc: '能够穿梭维度的神秘存在。',
    hp: 2, armor: 4, energy: 180, crit: 10, speed: 1.1,
    color: '#d8b4ff', sprite: 'player_assassin',
    starterWeapon: 'laser_fish',
    skill: { id: 'shadow_strike', name: '维度跃迁', desc: '瞬移并斩击路径上的敌人。', cd: 9 },
    unlockCost: 8000
  },
  time_ninja: {
    id: 'time_ninja', name: '超时空忍者', title: '时之刃',
    desc: '操纵时间缝隙的忍者。',
    hp: 4, armor: 4, energy: 180, crit: 10, speed: 1.12,
    color: '#4dd0e1', sprite: 'player_assassin',
    starterWeapon: 'light_sword',
    skill: { id: 'roll', name: '时之闪现', desc: '瞬移并进入短暂无敌。', cd: 8 },
    unlockCost: 9000
  },
  swordmaster: {
    id: 'swordmaster', name: '剑宗', title: '剑道宗师', desc: '以剑入道的宗师。',
    hp: 5, armor: 4, energy: 180, crit: 10, speed: 1.05, color: '#9adcff', sprite: 'player_knight',
    starterWeapon: 'rusty_blade', skill: { id: 'shadow_strike', name: '剑气斩', desc: '斩出剑气并突进。', cd: 10 }, unlockCost: 9500
  },
  gunner: {
    id: 'gunner', name: '枪客', title: '快枪手', desc: '以枪法压制敌人的枪客。',
    hp: 5, armor: 4, energy: 180, crit: 5, speed: 1.0, color: '#ffb86b', sprite: 'player_rogue',
    starterWeapon: 'pistol', skill: { id: 'dual_wield', name: '双枪速射', desc: '双持枪械快速射击。', cd: 12 }, unlockCost: 10000
  },
  lord: {
    id: 'lord', name: '领主', title: '王座之主', desc: '统御战场的领主。',
    hp: 6, armor: 5, energy: 180, crit: 5, speed: 0.98, color: '#d8b4ff', sprite: 'player_paladin',
    starterWeapon: 'war_hammer', skill: { id: 'holy_shield', name: '王者护盾', desc: '展开护盾并灼烧敌人。', cd: 15 }, unlockCost: 10500
  },
  spellblade: {
    id: 'spellblade', name: '咒法骑士', title: '魔剑士', desc: '剑与魔法并用的骑士。',
    hp: 5, armor: 5, energy: 200, crit: 5, speed: 1.0, color: '#c86bff', sprite: 'player_wizard',
    starterWeapon: 'energy_sword', skill: { id: 'arcane_bolt', name: '咒法冲击', desc: '释放咒法冲击波。', cd: 11 }, unlockCost: 11000
  },
  captain: {
    id: 'captain', name: '船长', title: '远洋舰长', desc: '指挥舰队作战的船长。',
    hp: 5, armor: 4, energy: 180, crit: 5, speed: 1.0, color: '#4dd0e1', sprite: 'player_engineer',
    starterWeapon: 'smg', skill: { id: 'turret', name: '舰炮支援', desc: '呼叫舰炮自动攻击。', cd: 15 }, unlockCost: 11500
  },
  special_force: {
    id: 'special_force', name: '特种骑士部队', title: '精英小队', desc: '协同作战的特种骑士。',
    hp: 5, armor: 5, energy: 180, crit: 5, speed: 1.02, color: '#7ee787', sprite: 'player_knight',
    starterWeapon: 'assault_rifle', skill: { id: 'turret', name: '小队支援', desc: '召唤小队火力支援。', cd: 16 }, unlockCost: 12000
  },
  doctor: {
    id: 'doctor', name: '博士', title: '疯狂科学家', desc: '用科技武器作战的博士。',
    hp: 4, armor: 4, energy: 220, crit: 5, speed: 0.98, color: '#b3ecff', sprite: 'player_engineer',
    starterWeapon: 'laser_gun', skill: { id: 'turret', name: '实验装置', desc: '部署实验炮台。', cd: 14 }, unlockCost: 12500
  },
  mecha_girl: {
    id: 'mecha_girl', name: '机械姬', title: '机械之心', desc: '机械与少女的结合体。',
    hp: 4, armor: 5, energy: 200, crit: 5, speed: 1.02, color: '#9adcff', sprite: 'player_engineer',
    starterWeapon: 'smg', skill: { id: 'turret', name: '机械伙伴', desc: '召唤机械伙伴作战。', cd: 14 }, unlockCost: 13000
  },
  necromancer: {
    id: 'necromancer', name: '死灵法师', title: '亡者低语', desc: '操纵死亡力量的法师。',
    hp: 4, armor: 4, energy: 220, crit: 5, speed: 0.98, color: '#a0a0c0', sprite: 'player_wizard',
    starterWeapon: 'void_staff', skill: { id: 'poison_flask', name: '亡者之触', desc: '释放腐蚀毒雾。', cd: 13 }, unlockCost: 13500
  },
  cook: {
    id: 'cook', name: '厨娘', title: '地狱厨房', desc: '用厨具战斗的厨娘。',
    hp: 5, armor: 5, energy: 180, crit: 5, speed: 1.0, color: '#ffd93d', sprite: 'player_knight',
    starterWeapon: 'pan', skill: { id: 'poison_flask', name: '秘制料理', desc: '投掷会爆炸的料理。', cd: 12 }, unlockCost: 14000
  },
  sheriff: {
    id: 'sheriff', name: '警官', title: '秩序维护者', desc: '以执法武器作战的警官。',
    hp: 5, armor: 4, energy: 180, crit: 5, speed: 1.0, color: '#ffb86b', sprite: 'player_rogue',
    starterWeapon: 'revolver', skill: { id: 'dual_wield', name: '双枪执法', desc: '双持手枪快速射击。', cd: 12 }, unlockCost: 14500
  },
  taoist: {
    id: 'taoist', name: '道士', title: '御剑仙人', desc: '御剑飞行的道士。',
    hp: 4, armor: 5, energy: 200, crit: 5, speed: 1.05, color: '#b3ecff', sprite: 'player_wizard',
    starterWeapon: 'sun_blade', skill: { id: 'roll', name: '御剑', desc: '御剑突进并短暂无敌。', cd: 9 }, unlockCost: 15000
  },
  suit_prince: {
    id: 'suit_prince', name: '皮套王子', title: '怪人王子', desc: '穿着皮套战斗的王子。',
    hp: 6, armor: 4, energy: 180, crit: 5, speed: 1.0, color: '#d8b4ff', sprite: 'player_knight',
    starterWeapon: 'giant_hammer', skill: { id: 'dual_wield', name: '皮套乱舞', desc: '双持武器疯狂攻击。', cd: 13 }, unlockCost: 15500
  },
  martialist: {
    id: 'martialist', name: '武斗家', title: '格斗之魂', desc: '以拳脚战斗的武斗家。',
    hp: 5, armor: 4, energy: 180, crit: 10, speed: 1.1, color: '#ff6b4a', sprite: 'player_knight',
    starterWeapon: 'blood_blade', skill: { id: 'roll', name: '疾风步', desc: '快速突进并短暂无敌。', cd: 8 }, unlockCost: 16000
  },
  bard: {
    id: 'bard', name: '吟游诗人', title: '战场歌者', desc: '用音乐鼓舞战斗的诗人。',
    hp: 4, armor: 5, energy: 220, crit: 5, speed: 1.0, color: '#ffd93d', sprite: 'player_elf',
    starterWeapon: 'magic_bow', skill: { id: 'arrow_rain', name: '音波箭雨', desc: '召唤音波箭雨。', cd: 14 }, unlockCost: 16500
  },
  marksman: {
    id: 'marksman', name: '枪手', title: '精准射手', desc: '百发百中的枪手。',
    hp: 4, armor: 4, energy: 180, crit: 15, speed: 1.0, color: '#ffb86b', sprite: 'player_rogue',
    starterWeapon: 'sniper', skill: { id: 'dual_wield', name: '速射', desc: '短时间内提升射速。', cd: 12 }, unlockCost: 17000
  },
  gun_expert: {
    id: 'gun_expert', name: '枪械专家', title: '军火大师', desc: '精通各种枪械的专家。',
    hp: 4, armor: 5, energy: 200, crit: 5, speed: 1.0, color: '#9adcff', sprite: 'player_engineer',
    starterWeapon: 'assault_rifle', skill: { id: 'turret', name: '火力支援', desc: '部署自动炮台。', cd: 14 }, unlockCost: 17500
  },
  owl: {
    id: 'owl', name: '枭首者', title: '夜幕猎手', desc: '在黑暗中猎杀的枭首者。',
    hp: 4, armor: 4, energy: 180, crit: 10, speed: 1.08, color: '#a0a0c0', sprite: 'player_assassin',
    starterWeapon: 'dagger', skill: { id: 'shadow_strike', name: '夜幕突袭', desc: '突进并斩击敌人。', cd: 10 }, unlockCost: 18000
  },
  elemental: {
    id: 'elemental', name: '古代元素使', title: '元素化身', desc: '掌控四大元素的使者。',
    hp: 4, armor: 5, energy: 220, crit: 5, speed: 1.0, color: '#c86bff', sprite: 'player_wizard',
    starterWeapon: 'meteor_staff', skill: { id: 'arcane_bolt', name: '元素爆发', desc: '释放元素冲击。', cd: 13 }, unlockCost: 18500
  },
  demon_warlock: {
    id: 'demon_warlock', name: '恶魔术士', title: '深渊契约', desc: '与恶魔签订契约的术士。',
    hp: 4, armor: 4, energy: 220, crit: 5, speed: 1.0, color: '#ff5a5a', sprite: 'player_wizard',
    starterWeapon: 'void_staff', skill: { id: 'poison_flask', name: '恶魔之火', desc: '投掷恶魔火焰。', cd: 13 }, unlockCost: 19000
  },
  miner: {
    id: 'miner', name: '矿工', title: '地下探索者', desc: '挖掘地下宝藏的矿工。',
    hp: 5, armor: 5, energy: 180, crit: 5, speed: 0.98, color: '#ffb86b', sprite: 'player_engineer',
    starterWeapon: 'war_hammer', skill: { id: 'turret', name: '矿井支援', desc: '部署采矿装置。', cd: 15 }, unlockCost: 19500
  },
  astrologer: {
    id: 'astrologer', name: '占星师', title: '星辰预言', desc: '以星辰之力作战的占星师。',
    hp: 3, armor: 4, energy: 240, crit: 5, speed: 1.0, color: '#d8b4ff', sprite: 'player_wizard',
    starterWeapon: 'meteor_staff', skill: { id: 'arrow_rain', name: '星辰坠落', desc: '召唤星辰箭雨。', cd: 14 }, unlockCost: 20000
  },
  illusionist: {
    id: 'illusionist', name: '戏法师', title: '幻术大师', desc: '制造幻象的戏法师。',
    hp: 4, armor: 4, energy: 200, crit: 10, speed: 1.04, color: '#c86bff', sprite: 'player_assassin',
    starterWeapon: 'boomerang', skill: { id: 'shadow_strike', name: '幻影突袭', desc: '幻影突进并斩击。', cd: 10 }, unlockCost: 20500
  },
  yinyang: {
    id: 'yinyang', name: '阴阳家', title: '阴阳平衡', desc: '调和阴阳之力的修行者。',
    hp: 4, armor: 5, energy: 200, crit: 5, speed: 1.0, color: '#b3ecff', sprite: 'player_paladin',
    starterWeapon: 'energy_sword', skill: { id: 'holy_shield', name: '阴阳护盾', desc: '展开阴阳护盾。', cd: 15 }, unlockCost: 21000
  }
}

/* 维基「角色/基本信息汇总」面板基础属性覆盖（初始武器/技能后续继续接） */
var WIKI_CHAR_STATS = {
  knight:   { hp: 6, armor: 5, energy: 180, crit: 5 },
  rogue:    { hp: 5, armor: 3, energy: 180, crit: 10 },
  wizard:   { hp: 3, armor: 5, energy: 240, crit: 0 },
  elf:      { hp: 5, armor: 4, energy: 180, crit: 5 },
  engineer: { hp: 5, armor: 5, energy: 180, crit: 5 },
  assassin: { hp: 4, armor: 4, energy: 180, crit: 10 },
  alchemist:{ hp: 5, armor: 5, energy: 180, crit: 5 },
  paladin:  { hp: 1, armor: 8, energy: 120, crit: 0 }
}
for (var _wid in WIKI_CHAR_STATS) {
  if (!Object.prototype.hasOwnProperty.call(WIKI_CHAR_STATS, _wid)) continue
  var _wst = WIKI_CHAR_STATS[_wid]
  if (CHARACTERS[_wid]) {
    CHARACTERS[_wid].hp = _wst.hp
    CHARACTERS[_wid].armor = _wst.armor
    CHARACTERS[_wid].energy = _wst.energy
    CHARACTERS[_wid].crit = _wst.crit
  }
}

/* 维基被动与一技能名称覆盖：技能 id/效果暂沿用现有实现 */
var WIKI_CHAR_PASSIVE = {
  knight: '破甲保护', rogue: '暴击穿透', wizard: '元素精通', elf: '蓄力加快',
  engineer: '火盾', assassin: '近战反弹', alchemist: '毒盾', paladin: '破甲冲击'
}
var WIKI_SKILL_NAME = {
  knight: '火力全开', rogue: '翻滚', wizard: '奥术闪电', elf: '专注射击',
  engineer: '工程炮台', assassin: '暗影之刃', alchemist: '毒气炸弹', paladin: '能量护盾'
}
var WIKI_STARTER_NAME = {
  knight: '破旧的手枪', rogue: '小明小红', wizard: '法典', elf: '弓',
  engineer: '工程炮台', assassin: '血刃', alchemist: '毒瓶', paladin: '神圣连枷'
}
for (var _sid in WIKI_STARTER_NAME) {
  if (!Object.prototype.hasOwnProperty.call(WIKI_STARTER_NAME, _sid)) continue
  if (CHARACTERS[_sid]) CHARACTERS[_sid].starterWeaponName = WIKI_STARTER_NAME[_sid]
}
var WIKI_SKILL_DESC = {
  knight: '短时间内双持当前武器，射速大幅提升。',
  rogue: '向移动方向翻滚，翻滚期间短暂无敌。',
  wizard: '释放奥术闪电，对命中的敌人造成元素伤害。',
  elf: '进入专注射击状态，射出强力箭矢。',
  engineer: '放置工程炮台，自动攻击附近敌人。',
  assassin: '暗影突进并斩击路径上的敌人。',
  alchemist: '投掷毒气炸弹，在落点生成毒雾。',
  paladin: '展开能量护盾，吸收伤害并灼烧贴近的敌人。'
}
for (var _did in WIKI_SKILL_DESC) {
  if (!Object.prototype.hasOwnProperty.call(WIKI_SKILL_DESC, _did)) continue
  if (CHARACTERS[_did] && CHARACTERS[_did].skill) CHARACTERS[_did].skill.desc = WIKI_SKILL_DESC[_did]
}
var WIKI_SKILL_POWER = {
  swordmaster: 1.15, gunner: 1.08, lord: 1.12, spellblade: 1.12, captain: 1.10,
  special_force: 1.10, doctor: 1.12, mecha_girl: 1.10, necromancer: 1.12, cook: 1.08,
  sheriff: 1.06, taoist: 1.14, suit_prince: 1.10, martialist: 1.16, bard: 1.08,
  marksman: 1.18, gun_expert: 1.10, owl: 1.16, elemental: 1.18, demon_warlock: 1.16,
  miner: 1.08, astrologer: 1.14, illusionist: 1.12, yinyang: 1.12
}
for (var _spid in WIKI_SKILL_POWER) {
  if (!Object.prototype.hasOwnProperty.call(WIKI_SKILL_POWER, _spid)) continue
  if (CHARACTERS[_spid] && CHARACTERS[_spid].skill) CHARACTERS[_spid].skill.power = WIKI_SKILL_POWER[_spid]
}
/* 新增角色的职业向占位被动：名称/数值待维基角色页逐页校准 */
var EXTRA_PASSIVE = {
  swordmaster: ['剑意', 'melee'], gunner: ['快枪', 'gun'], lord: ['王威', 'armor'],
  spellblade: ['咒刃', 'melee'], captain: ['舰令', 'skill'], special_force: ['协同', 'hp'],
  doctor: ['药剂', 'hp'], mecha_girl: ['机核', 'armor'], necromancer: ['亡语', 'skill'],
  cook: ['饱食', 'hp'], sheriff: ['执法', 'gun'], taoist: ['御剑', 'move'],
  suit_prince: ['皮套', 'armor'], martialist: ['拳意', 'melee'], bard: ['战歌', 'skill'],
  marksman: ['精准', 'gun'], gun_expert: ['枪械', 'gun'], owl: ['夜袭', 'crit'],
  elemental: ['元素', 'skill'], demon_warlock: ['契约', 'skill'], miner: ['采矿', 'energy'],
  astrologer: ['星象', 'crit'], illusionist: ['幻术', 'move'], yinyang: ['阴阳', 'hp']
}
for (var _epid in EXTRA_PASSIVE) {
  if (!Object.prototype.hasOwnProperty.call(EXTRA_PASSIVE, _epid)) continue
  if (CHARACTERS[_epid]) {
    CHARACTERS[_epid].passive = EXTRA_PASSIVE[_epid][0]
    CHARACTERS[_epid].passiveType = EXTRA_PASSIVE[_epid][1]
  }
}
var WIKI_SKILL_ELEMENT = {
  swordmaster: 'lightning', gunner: 'fire', lord: 'lightning', spellblade: 'ice',
  captain: 'lightning', special_force: 'fire', doctor: 'lightning', mecha_girl: 'lightning',
  necromancer: 'poison', cook: 'fire', sheriff: 'fire', taoist: 'lightning',
  suit_prince: 'fire', martialist: 'lightning', bard: 'lightning', marksman: 'fire',
  gun_expert: 'fire', owl: 'poison', elemental: 'fire', demon_warlock: 'fire',
  miner: 'fire', astrologer: 'lightning', illusionist: 'poison', yinyang: 'ice'
}
for (var _elid in WIKI_SKILL_ELEMENT) {
  if (!Object.prototype.hasOwnProperty.call(WIKI_SKILL_ELEMENT, _elid)) continue
  if (CHARACTERS[_elid] && CHARACTERS[_elid].skill) CHARACTERS[_elid].skill.element = WIKI_SKILL_ELEMENT[_elid]
}
var WIKI_SKILL_TUNING = {
  swordmaster: { range: 520 }, gunner: { duration: 7 }, lord: { duration: 2.6, heal: 3 },
  spellblade: { chains: 4 }, captain: { duration: 12 }, special_force: { duration: 11 },
  doctor: { duration: 12 }, mecha_girl: { duration: 13 }, necromancer: { radius: 90 },
  cook: { radius: 85 }, sheriff: { duration: 7 }, taoist: { distance: 860 },
  suit_prince: { duration: 7 }, martialist: { distance: 880 }, bard: { arrows: 10, radius: 160 },
  marksman: { duration: 7 }, gun_expert: { duration: 12 }, owl: { range: 500 },
  elemental: { chains: 5 }, demon_warlock: { radius: 95 }, miner: { duration: 12 },
  astrologer: { arrows: 12, radius: 170 }, illusionist: { range: 520 },
  yinyang: { duration: 2.6, heal: 3 }
}
for (var _tid in WIKI_SKILL_TUNING) {
  if (!Object.prototype.hasOwnProperty.call(WIKI_SKILL_TUNING, _tid)) continue
  if (!CHARACTERS[_tid] || !CHARACTERS[_tid].skill) continue
  var _tune = WIKI_SKILL_TUNING[_tid]
  for (var _tk in _tune) {
    if (Object.prototype.hasOwnProperty.call(_tune, _tk)) CHARACTERS[_tid].skill[_tk] = _tune[_tk]
  }
}
var _newPlayerIds = ['vampire', 'werewolf', 'berserker', 'robot', 'priest', 'druid', 'trapper',
  'qizong', 'transcendent', 'time_ninja', 'swordmaster', 'gunner', 'lord', 'spellblade',
  'captain', 'special_force', 'doctor', 'mecha_girl', 'necromancer', 'cook', 'sheriff',
  'taoist', 'suit_prince', 'martialist', 'bard', 'marksman', 'gun_expert', 'owl',
  'elemental', 'demon_warlock', 'miner', 'astrologer', 'illusionist', 'yinyang']
for (var _npi = 0; _npi < _newPlayerIds.length; _npi++) {
  var _npid = _newPlayerIds[_npi]
  if (CHARACTERS[_npid]) CHARACTERS[_npid].sprite = 'player_' + _npid
}
var WIKI_STARTER_ID = {
  knight: 'old_pistol', rogue: 'xiaoming_xiaohong', wizard: 'codex', elf: 'bow',
  engineer: 'engineer_turret', assassin: 'blood_blade', alchemist: 'poison_bottle', paladin: 'holy_flail'
}
for (var _wid2 in WIKI_STARTER_ID) {
  if (!Object.prototype.hasOwnProperty.call(WIKI_STARTER_ID, _wid2)) continue
  if (CHARACTERS[_wid2]) CHARACTERS[_wid2].starterWeapon = WIKI_STARTER_ID[_wid2]
}
for (var _pid in WIKI_CHAR_PASSIVE) {
  if (!Object.prototype.hasOwnProperty.call(WIKI_CHAR_PASSIVE, _pid)) continue
  if (CHARACTERS[_pid]) {
    CHARACTERS[_pid].passive = WIKI_CHAR_PASSIVE[_pid]
    if (CHARACTERS[_pid].skill) CHARACTERS[_pid].skill.name = WIKI_SKILL_NAME[_pid]
  }
}

/* 大厅/角色页展示顺序：按解锁费用从低到高 */
/* 覆盖为维基 42 角色基础面板/被动/技能名 */
for (var _cwid in WIKI_CHARACTERS) {
  if (!Object.prototype.hasOwnProperty.call(WIKI_CHARACTERS, _cwid)) continue
  var _cw = CHARACTERS[_cwid]
  var _wd = WIKI_CHARACTERS[_cwid]
  if (!_cw || !_wd) continue
  if (typeof _wd.hp === 'number') _cw.hp = _wd.hp
  if (typeof _wd.armor === 'number') _cw.armor = _wd.armor
  if (typeof _wd.energy === 'number') _cw.energy = _wd.energy
  if (typeof _wd.crit === 'number') _cw.crit = _wd.crit
  if (typeof _wd.hand === 'number') _cw.hand = _wd.hand
  if (typeof _wd.wikiSpeed === 'number') _cw.wikiSpeed = _wd.wikiSpeed
  if (_wd.passive) _cw.passive = _wd.passive
  if (WIKI_PASSIVE_DESC[_cwid]) _cw.passiveDesc = WIKI_PASSIVE_DESC[_cwid]
  if (_wd.starterName) _cw.starterWeaponName = _wd.starterName
  if (_wd.skills && _wd.skills.length) _cw.wikiSkills = _wd.skills.slice()
  if (_cw.skill && _wd.skills && _wd.skills[0]) _cw.skill.name = _wd.skills[0]
  var _skl = WIKI_SKILLS[_cwid]
  if (_skl && _skl.length) {
    _cw.wikiSkillData = _skl.slice()
    _cw.wikiSkillForms = (WIKI_SKILL_FORM_FIX2[_cwid] || WIKI_SKILL_FORM_FIX[_cwid] || WIKI_SKILL_FORMS[_cwid] || []).slice()
    _cw.wikiSkillTuning = (WIKI_SKILL_TUNING2[_cwid] || []).slice()
    if (_cw.skill && _skl[0]) {
      _cw.skill.name = _skl[0].name || _cw.skill.name
      if (_skl[0].desc) _cw.skill.desc = _skl[0].desc
      if (typeof _skl[0].cooldown === 'number') _cw.skill.cd = _skl[0].cooldown
    }
  }
}

export var CHARACTER_ORDER = [
  'knight', 'rogue', 'wizard', 'elf',
  'engineer', 'assassin', 'alchemist', 'paladin',
  'vampire', 'werewolf', 'berserker', 'robot', 'priest',
  'druid', 'trapper', 'qizong', 'transcendent', 'time_ninja',
  'swordmaster', 'gunner', 'lord', 'spellblade', 'captain', 'special_force',
  'doctor', 'mecha_girl', 'necromancer', 'cook', 'sheriff', 'taoist',
  'suit_prince', 'martialist', 'bard', 'marksman', 'gun_expert', 'owl',
  'elemental', 'demon_warlock', 'miner', 'astrologer', 'illusionist', 'yinyang'
]

/* 升级项上限（与 meta.UPGRADE_DEFS 保持一致；这里只用于 charStats 钳制） */
var UPGRADE_MAX = 5
var ENERGY_PER_LV = 20
var CRIT_PER_LV = 3
var SPEED_PER_LV = 0.03
var CD_PER_LV = 0.08
var CD_MUL_MIN = 0.6

export function characterById(id) {
  if (typeof id !== 'string' || !id) return null
  if (Object.prototype.hasOwnProperty.call(CHARACTERS, id)) return CHARACTERS[id]
  return null
}

/* 把输入的游戏数值转成安全的非负整数（存档可能被改坏） */
function safeInt(v, def) {
  var n = Number(v)
  if (!isFinite(n)) return def
  n = Math.floor(n)
  return n
}

/* 升级等级 0..5，越界钳制；非数字视为 0 */
function upgradeLevel(upgrades, key) {
  if (!upgrades || typeof upgrades !== 'object') return 0
  var lv = safeInt(upgrades[key], 0)
  if (lv < 0) lv = 0
  if (lv > UPGRADE_MAX) lv = UPGRADE_MAX
  return lv
}

export function charStats(id, upgrades) {
  var c = characterById(id)
  if (!c) c = CHARACTERS.knight

  var hpLv = upgradeLevel(upgrades, 'hp')
  var armorLv = upgradeLevel(upgrades, 'armor')
  var energyLv = upgradeLevel(upgrades, 'energy')
  var critLv = upgradeLevel(upgrades, 'crit')
  var speedLv = upgradeLevel(upgrades, 'speed')
  var skillLv = upgradeLevel(upgrades, 'skill')

  /* 移速/冷却倍率做定点舍入，避免 0.03*3 这类浮点尾巴影响 HUD 显示 */
  var speed = c.speed + SPEED_PER_LV * speedLv
  speed = Math.round(speed * 1000) / 1000
  var cdMul = 1 - CD_PER_LV * skillLv
  if (cdMul < CD_MUL_MIN) cdMul = CD_MUL_MIN
  cdMul = Math.round(cdMul * 1000) / 1000

  return {
    maxHp: c.hp + hpLv,
    maxArmor: c.armor + armorLv,
    maxEnergy: c.energy + ENERGY_PER_LV * energyLv,
    crit: c.crit + CRIT_PER_LV * critLv,
    speed: speed,
    skillCdMul: cdMul
  }
}
