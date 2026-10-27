/*
 * 局外成长数据：成就、角色升级、结算（applyRunResult）。
 *
 * 结算口径（与 docs/架构与接口.md 4.5 对齐）：
 *   1. 累加 stats（runs/wins/deaths/kills/bossKills/bestFloor/bestRoom/totalGems/playMs/revives）；
 *   2. 发放宝石：优先用引擎 result.gemsEarned，缺失时按 constants 的 GEM_PER_* 兜底；
 *   3. 金币计入 lifetimeCoins（永久统计，不等于宝石）；
 *   4. 跑一遍成就表，解锁新成就并写入 achievements；
 *   5. 更新最佳层数/最佳房间记录，返回 records 供结算页展示"新纪录"；
 *   6. 写 saveAt（真正落盘由调用方 save(db) 负责）。
 *
 * 只依赖同目录 constants.js。代码风格：ES5。
 */

import {
  GEM_PER_ROOM, GEM_PER_FLOOR, GEM_PER_BOSS, GEM_PER_WIN, FLOOR_COUNT
} from './constants.js'

/*
 * 成就表。kind 决定 progressOf 的取数方式：
 *   stat      -> db.stats[key]
 *   field     -> db[key]
 *   floor     -> db.stats.bestFloor（并与本局 result.floor 取大）
 *   chars     -> 已解锁角色数
 *   weapons   -> 已解锁武器数
 *   chapters  -> 已抵达章节数（按 bestFloor 换算）
 *   win_no_revive -> 本局胜利且未复活（完成后靠 achievements 标记回填）
 * target 为达成阈值，progressOf 返回 0..1 的比例。
 */
export var ACHIEVEMENTS = {
  first_run: {
    id: 'first_run', name: '初次踏入', desc: '完成第一次冒险',
    kind: 'stat', key: 'runs', target: 1
  },
  first_win: {
    id: 'first_win', name: '破晓之光', desc: '首次通关地牢',
    kind: 'stat', key: 'wins', target: 1
  },
  floor_3: {
    id: 'floor_3', name: '森林深处', desc: '抵达第 3 层',
    kind: 'floor', target: 3
  },
  floor_6: {
    id: 'floor_6', name: '沙海尽头', desc: '抵达第 6 层',
    kind: 'floor', target: 6
  },
  floor_9: {
    id: 'floor_9', name: '霜寒之巅', desc: '抵达第 9 层',
    kind: 'floor', target: 9
  },
  boss_slayer: {
    id: 'boss_slayer', name: '首领克星', desc: '击杀 1 个首领',
    kind: 'stat', key: 'bossKills', target: 1
  },
  boss_hunter: {
    id: 'boss_hunter', name: '猎首者', desc: '累计击杀 5 个首领',
    kind: 'stat', key: 'bossKills', target: 5
  },
  boss_legend: {
    id: 'boss_legend', name: '万军之首', desc: '累计击杀 20 个首领',
    kind: 'stat', key: 'bossKills', target: 20
  },
  kill_50: {
    id: 'kill_50', name: '初露锋芒', desc: '累计击杀 50 个敌人',
    kind: 'stat', key: 'kills', target: 50
  },
  kill_200: {
    id: 'kill_200', name: '百人斩', desc: '累计击杀 200 个敌人',
    kind: 'stat', key: 'kills', target: 200
  },
  kill_1000: {
    id: 'kill_1000', name: '千人斩', desc: '累计击杀 1000 个敌人',
    kind: 'stat', key: 'kills', target: 1000
  },
  room_10: {
    id: 'room_10', name: '探索者', desc: '单次冒险清理 10 个房间',
    kind: 'stat', key: 'bestRoom', target: 10
  },
  room_30: {
    id: 'room_30', name: '迷宫行者', desc: '单次冒险清理 30 个房间',
    kind: 'stat', key: 'bestRoom', target: 30
  },
  win_3: {
    id: 'win_3', name: '三度凯旋', desc: '累计通关 3 次',
    kind: 'stat', key: 'wins', target: 3
  },
  win_10: {
    id: 'win_10', name: '常胜将军', desc: '累计通关 10 次',
    kind: 'stat', key: 'wins', target: 10
  },
  no_revive_win: {
    id: 'no_revive_win', name: '不屈意志', desc: '不用复活通关一次',
    kind: 'win_no_revive', target: 1
  },
  rich_1000: {
    id: 'rich_1000', name: '宝石收藏家', desc: '累计获得 1000 宝石',
    kind: 'stat', key: 'totalGems', target: 1000
  },
  rich_5000: {
    id: 'rich_5000', name: '宝石大亨', desc: '累计获得 5000 宝石',
    kind: 'stat', key: 'totalGems', target: 5000
  },
  coin_500: {
    id: 'coin_500', name: '金币猎手', desc: '累计收集 500 金币',
    kind: 'field', key: 'lifetimeCoins', target: 500
  },
  play_1h: {
    id: 'play_1h', name: '老练冒险者', desc: '累计冒险 1 小时',
    kind: 'stat', key: 'playMs', target: 3600000
  },
  death_10: {
    id: 'death_10', name: '屡败屡战', desc: '累计阵亡 10 次',
    kind: 'stat', key: 'deaths', target: 10
  },
  revive_5: {
    id: 'revive_5', name: '向死而生', desc: '累计使用 5 次复活',
    kind: 'stat', key: 'revives', target: 5
  },
  all_chars: {
    id: 'all_chars', name: '八面玲珑', desc: '解锁全部 8 名角色',
    kind: 'chars', target: 8
  },
  weapon_15: {
    id: 'weapon_15', name: '武器收藏家', desc: '解锁 15 把武器',
    kind: 'weapons', target: 15
  },
  chapters_3: {
    id: 'chapters_3', name: '三界行者', desc: '踏足全部三个章节',
    kind: 'chapters', target: 3
  }
}

export var ACHIEVEMENT_ORDER = [
  'first_run', 'first_win', 'floor_3', 'floor_6', 'floor_9',
  'boss_slayer', 'boss_hunter', 'boss_legend',
  'kill_50', 'kill_200', 'kill_1000',
  'room_10', 'room_30', 'win_3', 'win_10', 'no_revive_win',
  'rich_1000', 'rich_5000', 'coin_500', 'play_1h',
  'death_10', 'revive_5', 'all_chars', 'weapon_15', 'chapters_3'
]

/* 升级项定义（与 characters.charStats 的加成一一对应） */
export var UPGRADE_DEFS = {
  hp: { id: 'hp', name: '生命', max: 5, step: 1, fmt: '+1', desc: '生命上限 +1/级' },
  armor: { id: 'armor', name: '护甲', max: 5, step: 1, fmt: '+1', desc: '护甲上限 +1/级' },
  energy: { id: 'energy', name: '能量', max: 5, step: 20, fmt: '+20', desc: '能量上限 +20/级' },
  crit: { id: 'crit', name: '暴击', max: 5, step: 3, fmt: '+3%', desc: '暴击率 +3%/级' },
  speed: { id: 'speed', name: '移速', max: 5, step: 3, fmt: '+3%', desc: '移动速度 +3%/级' },
  skill: { id: 'skill', name: '冷却', max: 5, step: 8, fmt: '-8%', desc: '技能冷却 -8%/级' }
}

export var UPGRADE_ORDER = ['hp', 'armor', 'energy', 'crit', 'speed', 'skill']

/* 升级基础费用（0 级价格），等级越高越贵 */
var UPGRADE_BASE_COST = {
  hp: 45,
  armor: 50,
  energy: 35,
  crit: 60,
  speed: 55,
  skill: 75
}

function num(v, def) {
  var n = Number(v)
  if (typeof v === 'undefined' || v === null || v === '') return def
  if (!isFinite(n)) return def
  return n
}

function nonNegInt(v, def) {
  var n = num(v, def)
  n = Math.floor(n)
  if (!isFinite(n) || n < 0) n = 0
  return n
}

function countKeys(obj) {
  var n = 0
  var k
  if (!obj || typeof obj !== 'object') return 0
  for (k in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, k)) continue
    if (obj[k]) n++
  }
  return n
}

/* 补齐 / 修复存档骨架，避免旧档缺字段时结算报错 */
function ensureDb(d) {
  if (!d.stats || typeof d.stats !== 'object') d.stats = {}
  var keys = ['runs', 'wins', 'deaths', 'kills', 'bossKills', 'bestFloor', 'bestRoom', 'totalGems', 'playMs', 'revives']
  var i
  for (i = 0; i < keys.length; i++) {
    d.stats[keys[i]] = nonNegInt(d.stats[keys[i]], 0)
  }
  if (!d.achievements || typeof d.achievements !== 'object') d.achievements = {}
  if (!d.unlockedChars || typeof d.unlockedChars.length !== 'number') d.unlockedChars = ['knight']
  if (!d.unlockedWeapons || typeof d.unlockedWeapons !== 'object') d.unlockedWeapons = {}
  d.gems = nonNegInt(d.gems, 0)
  d.lifetimeCoins = nonNegInt(d.lifetimeCoins, 0)
  return d
}

/*
 * 升级费用：基础价 × (1 + 0.55 × 当前等级)，取整到 5 的倍数。
 * level 为当前等级（0 表示还没升过），达到上限返回 0（UI 显示"已满"）。
 * charId 预留给后续"角色专属折扣"，目前不影响价格（保持所有角色同价）。
 */
export function upgradeCost(charId, stat, level) {
  var def = UPGRADE_DEFS[stat]
  if (!def) return 0
  var lv = Math.floor(num(level, 0))
  if (!isFinite(lv) || lv < 0) lv = 0
  if (lv >= def.max) return 0
  var base = num(UPGRADE_BASE_COST[stat], 50)
  var cost = base * (1 + lv * 0.55)
  cost = Math.round(cost / 5) * 5
  if (cost < 5) cost = 5
  return cost
}

/*
 * 成就进度，返回"绝对值"（0..target），未解锁时与 ACHIEVEMENTS[id].target 相除即得百分比。
 * 已解锁的直接返回 target；未知成就返回 0。
 * 注意：codex 页按 p / target 算百分比、按 "p / target" 显示进度文本，
 * 这里必须返回绝对值而不是 0..1 比例。
 */
export function progressOf(db, achId, result) {
  var a = ACHIEVEMENTS[achId]
  if (!a) return 0
  var target = num(a.target, 1)
  if (target <= 0) target = 1
  var d = (db && typeof db === 'object') ? db : {}
  if (d.achievements && d.achievements[achId]) return target

  var r = (result && typeof result === 'object') ? result : {}
  var st = (d.stats && typeof d.stats === 'object') ? d.stats : {}
  var kind = a.kind || 'stat'
  var val = 0

  if (kind === 'stat') {
    val = num(st[a.key], 0)
  } else if (kind === 'field') {
    val = num(d[a.key], 0)
  } else if (kind === 'floor') {
    val = num(st.bestFloor, 0)
    var runFloor = num(r.floor, 0)
    if (runFloor > val) val = runFloor
  } else if (kind === 'chars') {
    val = (d.unlockedChars && typeof d.unlockedChars.length === 'number') ? d.unlockedChars.length : 0
  } else if (kind === 'weapons') {
    val = countKeys(d.unlockedWeapons)
  } else if (kind === 'chapters') {
    var best = num(st.bestFloor, 0)
    if (best > 0) val = Math.floor((best - 1) / 5) + 1
    if (val > 3) val = 3
  } else if (kind === 'win_no_revive') {
    if (r.outcome === 'victory' && num(r.revives, 0) === 0) val = 1
  }

  if (val < 0) val = 0
  if (val > target) val = target
  return Math.floor(val)
}

/*
 * 本局结算。返回 { db, newAchievements, records }，db 为原地更新后的同一对象。
 * 通过调用方 save(db) 持久化；这里只写 saveAt 时间戳。
 */
export function applyRunResult(db, result) {
  var d = ensureDb((db && typeof db === 'object') ? db : {})
  var r = (result && typeof result === 'object') ? result : {}
  var outcome = typeof r.outcome === 'string' ? r.outcome : 'abandon'
  var victory = outcome === 'victory'
  var dead = outcome === 'dead'

  var floor = nonNegInt(r.floor, 0)
  if (floor > FLOOR_COUNT) floor = FLOOR_COUNT
  var rooms = nonNegInt(r.roomsCleared, 0)
  var kills = nonNegInt(r.kills, 0)
  var bossKills = nonNegInt(r.bossKills, 0)
  var coins = nonNegInt(r.coins, 0)
  var gemsCollected = nonNegInt(r.gemsCollected, 0)
  var durationMs = nonNegInt(r.durationMs, 0)
  var revives = nonNegInt(r.revives, 0)

  /* 宝石结算：引擎给了 gemsEarned 就尊重它，否则按契约常量自行推算 */
  var gemsEarned = num(r.gemsEarned, -1)
  if (gemsEarned < 0) {
    gemsEarned = rooms * GEM_PER_ROOM +
      floor * GEM_PER_FLOOR +
      bossKills * GEM_PER_BOSS +
      (victory ? GEM_PER_WIN : 0) +
      gemsCollected
  }
  gemsEarned = Math.floor(gemsEarned)
  if (gemsEarned < 0) gemsEarned = 0

  var prevBestFloor = d.stats.bestFloor
  var prevBestRoom = d.stats.bestRoom

  d.stats.runs += 1
  if (victory) d.stats.wins += 1
  if (dead) d.stats.deaths += 1
  d.stats.kills += kills
  d.stats.bossKills += bossKills
  d.stats.revives += revives
  d.stats.playMs += durationMs
  d.stats.totalGems += gemsEarned
  if (floor > d.stats.bestFloor) d.stats.bestFloor = floor
  if (rooms > d.stats.bestRoom) d.stats.bestRoom = rooms
  d.lifetimeCoins += coins
  d.gems += gemsEarned

  var newAchievements = []
  var i
  for (i = 0; i < ACHIEVEMENT_ORDER.length; i++) {
    var aid = ACHIEVEMENT_ORDER[i]
    if (d.achievements[aid]) continue
    var target = num(ACHIEVEMENTS[aid].target, 1)
    if (target <= 0) target = 1
    if (progressOf(d, aid, r) >= target) {
      d.achievements[aid] = true
      newAchievements.push(aid)
    }
  }

  var records = {
    newBestFloor: d.stats.bestFloor > prevBestFloor,
    newBestRoom: d.stats.bestRoom > prevBestRoom,
    prevBestFloor: prevBestFloor,
    prevBestRoom: prevBestRoom,
    bestFloor: d.stats.bestFloor,
    bestRoom: d.stats.bestRoom,
    gemsEarned: gemsEarned,
    coins: coins
  }

  d.saveAt = Date.now()
  return { db: d, newAchievements: newAchievements, records: records }
}
