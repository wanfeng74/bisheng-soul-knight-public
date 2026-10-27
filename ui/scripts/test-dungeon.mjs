/*
 * 地牢生成 + 敌人/Boss 数据自测（world-data 交付）。
 *
 * 运行（DSH Node，不在 PATH，用绝对路径调用）：
 *   node ui/scripts/test-dungeon.mjs
 * 或在项目根目录：
 *   & 'C:\Users\wangh\.dsh\dsh-runtimes\dsh-next-primary-runtime\dependencies\node\bin\node.exe' ui/scripts/test-dungeon.mjs
 *
 * 断言覆盖：
 *  - 敌人 18 种（每章 6 种）、字段完整、behavior/attack 取契约值、sprite 命名、章节池一致
 *  - Boss 4 个：phaseAt/patterns/routine 自洽、金币/宝石、sprite 命名
 *  - spawnWave 同种子可复现、只出本章池、精英标记正确、非战斗房不刷怪
 *  - generateFloor：6~8 房间、5x5 网格、尺寸 28~40 / 9~13、字符集合法、门在墙中央且双向、
 *    房间图全连通、房内门/出生点/标记点 BFS 可达、同 seed 逐字节一致、不同 seed 有差异、
 *    3 章 x 3 层共 9 层全部可生成、每层必有 boss+shop+宝箱、精英房概率随层数上升
 *  - 两个游戏数据模块符合 ES5 红线（无箭头/模板串/let/const/includes/展开等）
 *
 * 任一条失败 → 进程 exit 1；全部通过 → exit 0。
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { T, CHAPTERS, FLOOR_COUNT, FINAL_BOSS } from '../src/services/game/constants.js'
import { makeRng } from '../src/services/game/rng.js'
import {
  ENEMIES, BOSSES, enemyById, bossById, spawnWave, eliteScale, floorBoss
} from '../src/services/game/enemies.js'
import { generateFloor } from '../src/services/game/dungeon.js'

var HERE = path.dirname(fileURLToPath(import.meta.url))
var GAME_DIR = path.join(HERE, '..', 'src', 'services', 'game')

var pass = 0
var fail = 0
var failMsgs = []

function ok(cond, msg) {
  if (cond) {
    pass = pass + 1
    return true
  }
  fail = fail + 1
  failMsgs.push(msg)
  if (failMsgs.length <= 25) console.log('  [FAIL] ' + msg)
  return false
}

function eq(actual, expected, msg) {
  return ok(actual === expected, msg + '（期望 ' + fmt(expected) + '，实际 ' + fmt(actual) + '）')
}

function fmt(v) {
  if (typeof v === 'string') return v
  try {
    return JSON.stringify(v)
  } catch (e) {
    return String(v)
  }
}

function section(title) {
  console.log('')
  console.log('--- ' + title + ' ---')
}

/* 由 constants.T 反推合法字符集 */
var T_CHARS = {}
var T_KEYS = Object.keys(T)
var ti
for (ti = 0; ti < T_KEYS.length; ti++) T_CHARS[T[T_KEYS[ti]]] = true

var DIRS = [
  { dx: 0, dy: -1, side: 'up', opp: 'down' },
  { dx: 1, dy: 0, side: 'right', opp: 'left' },
  { dx: 0, dy: 1, side: 'down', opp: 'up' },
  { dx: -1, dy: 0, side: 'left', opp: 'right' }
]

var ROOM_TYPES = { start: 1, battle: 1, elite: 1, treasure: 1, shop: 1, statue: 1, boss: 1 }
var BEHAVIORS = {
  chase: 1, shoot: 1, charge: 1, bomb: 1, summon: 1,
  burst: 1, strafe: 1, burrow: 1, flyer: 1, tank: 1
}
var ATTACK_TYPES = { contact: 1, shoot: 1, charge: 1, bomb: 1, summon: 1, burst: 1 }

/* ======================= 敌人 / Boss 数据 ======================= */

function testEnemies() {
  section('敌人 / Boss 数据')
  var ids = Object.keys(ENEMIES)
  eq(ids.length, 18, '普通敌人共 18 种')

  var i, j, id, e, ch, pool, key, patternKeys, phaseKeys
  var chapterCount = [0, 0, 0]
  var poolUnion = {}
  for (ch = 1; ch <= 3; ch++) {
    pool = CHAPTERS[ch - 1].enemyPool
    eq(pool.length, 6, '第 ' + ch + ' 章敌人池 6 种')
    for (j = 0; j < pool.length; j++) {
      id = pool[j]
      poolUnion[id] = true
      ok(enemyById(id) !== null, '敌人池 id 可查：' + id)
      e = ENEMIES[id]
      if (!e) continue
      ok(e.chapter.indexOf(ch) !== -1, id + ' 标记了第 ' + ch + ' 章')
    }
  }
  eq(Object.keys(poolUnion).length, 18, '三章敌人池合起来正好 18 种')

  for (i = 0; i < ids.length; i++) {
    id = ids[i]
    e = ENEMIES[id]
    ok(e && e.id === id, id + ' 的 id 字段自洽')
    if (!e) continue
    ok(typeof e.name === 'string' && e.name.length > 0, id + ' 有中文名')
    ok(typeof e.desc === 'string' && e.desc.length >= 6, id + ' 有描述')
    ok(Array.isArray(e.chapter) && e.chapter.length >= 1, id + ' chapter 是数组')
    for (j = 0; j < e.chapter.length; j++) {
      ok(e.chapter[j] >= 1 && e.chapter[j] <= 3, id + ' chapter 值合法')
      chapterCount[e.chapter[j] - 1] = chapterCount[e.chapter[j] - 1] + 1
    }
    ok(BEHAVIORS[e.behavior] === 1, id + ' behavior 取契约值（' + e.behavior + '）')
    ok(typeof e.hp === 'number' && e.hp > 0, id + ' hp 为正数')
    ok(typeof e.speed === 'number' && e.speed > 0, id + ' speed 为正数')
    ok(typeof e.dmg === 'number' && e.dmg >= 1, id + ' dmg 至少 1 点')
    ok(typeof e.radius === 'number' && e.radius >= 8 && e.radius <= 20, id + ' radius 合理')
    ok(typeof e.contactCd === 'number' && e.contactCd > 0, id + ' contactCd > 0')
    ok(typeof e.flying === 'boolean', id + ' flying 是布尔值')
    eq(e.sprite, 'enemy_' + id, id + ' sprite 命名 enemy_<id>')
    ok(Array.isArray(e.coins) && e.coins.length === 2, id + ' coins 是 [min,max]')
    if (Array.isArray(e.coins) && e.coins.length === 2) {
      ok(e.coins[0] >= 1 && e.coins[1] >= e.coins[0], id + ' 金币区间合法')
    }
    ok(e.attack && ATTACK_TYPES[e.attack.type] === 1, id + ' attack.type 取契约值（' + (e.attack && e.attack.type) + '）')
    if (e.attack) testAttack(id, e.attack)
  }
  eq(chapterCount[0], 6, '森林普通敌人 6 种')
  eq(chapterCount[1], 6, '沙漠普通敌人 6 种')
  eq(chapterCount[2], 6, '冰原普通敌人 6 种')

  eq(enemyById('slime'), ENEMIES.slime, 'enemyById 能查到史莱姆')
  eq(enemyById('no_such_enemy'), null, 'enemyById 未知 id 返回 null')
  eq(enemyById('toString'), null, 'enemyById 不会返回原型属性')

  /* ---------- Boss ---------- */
  var bossIds = Object.keys(BOSSES)
  eq(bossIds.length, 4, 'Boss 共 4 个')
  var wantedBosses = ['goblin_chief', 'sand_queen', 'ice_queen', 'dark_knight']
  for (i = 0; i < wantedBosses.length; i++) {
    ok(bossById(wantedBosses[i]) !== null, '契约要求 Boss 存在：' + wantedBosses[i])
  }
  var bossHp = []
  for (i = 0; i < bossIds.length; i++) {
    id = bossIds[i]
    e = BOSSES[id]
    ok(e && e.id === id, 'Boss ' + id + ' id 字段自洽')
    if (!e) continue
    ok(typeof e.name === 'string' && e.name.length > 0, 'Boss ' + id + ' 有中文名')
    ok(typeof e.desc === 'string' && e.desc.length >= 6, 'Boss ' + id + ' 有描述')
    eq(e.sprite, 'boss_' + id, 'Boss ' + id + ' sprite 命名 boss_<id>')
    ok(e.chapter >= 1 && e.chapter <= 3, 'Boss ' + id + ' chapter 合法')
    ok(typeof e.hp === 'number' && e.hp >= 300, 'Boss ' + id + ' 血量像 Boss')
    ok(typeof e.speed === 'number' && e.speed > 0, 'Boss ' + id + ' speed 为正')
    ok(typeof e.radius === 'number' && e.radius >= 20, 'Boss ' + id + ' 碰撞半径够大')
    eq(e.flying, false, 'Boss ' + id + ' 默认不飞行')

    ok(Array.isArray(e.phaseAt) && e.phaseAt.length >= 2, 'Boss ' + id + ' phaseAt 至少 2 段')
    ok(Array.isArray(e.routine) && e.routine.length === e.phaseAt.length, 'Boss ' + id + ' routine 段数与 phaseAt 一致')
    eq(e.phaseAt[0], 1.0, 'Boss ' + id + ' 首阶段阈值从 1.0 开始')
    for (j = 1; j < e.phaseAt.length; j++) {
      ok(e.phaseAt[j] > 0 && e.phaseAt[j] < e.phaseAt[j - 1], 'Boss ' + id + ' phaseAt 严格递减')
    }

    patternKeys = Object.keys(e.patterns || {})
    ok(patternKeys.length >= 3, 'Boss ' + id + ' 至少 3 种攻击 pattern')
    for (j = 0; j < patternKeys.length; j++) {
      key = patternKeys[j]
      testBossPattern(id, key, e.patterns[key])
    }
    for (j = 0; j < e.routine.length; j++) {
      phaseKeys = e.routine[j]
      ok(Array.isArray(phaseKeys) && phaseKeys.length >= 2, 'Boss ' + id + ' 第 ' + (j + 1) + ' 阶段至少 2 个招式')
      if (!Array.isArray(phaseKeys)) continue
      for (var k = 0; k < phaseKeys.length; k++) {
        ok(e.patterns[phaseKeys[k]] !== undefined, 'Boss ' + id + ' routine 招式在 patterns 中存在：' + phaseKeys[k])
      }
    }

    ok(Array.isArray(e.coins) && e.coins.length === 2 && e.coins[0] > 0 && e.coins[1] >= e.coins[0], 'Boss ' + id + ' 金币区间合法')
    ok(typeof e.gems === 'number' && e.gems > 0, 'Boss ' + id + ' 有宝石奖励')
    bossHp.push({ id: id, hp: e.hp })
  }
  /* 章节越后 Boss 血量越高 */
  var byId = {}
  for (i = 0; i < bossHp.length; i++) byId[bossHp[i].id] = bossHp[i].hp
  ok(byId.goblin_chief < byId.sand_queen, 'Boss 血量：哥布林酋长 < 沙海女王')
  ok(byId.sand_queen < byId.ice_queen, 'Boss 血量：沙海女王 < 冰霜女王')
  ok(byId.ice_queen < byId.dark_knight, 'Boss 血量：冰霜女王 < 暗黑骑士')

  eq(bossById('no_such_boss'), null, 'bossById 未知 id 返回 null')
  eq(bossById('toString'), null, 'bossById 不会返回原型属性')

  /* ---------- floorBoss ---------- */
  eq(floorBoss(1, 3), 'goblin_chief', '第 1 章第 3 层 Boss 是哥布林酋长')
  eq(floorBoss(2, 6), 'sand_queen', '第 2 章第 20 层 Boss 是沙海女王')
  eq(floorBoss(3, 7), 'ice_queen', '第 3 章普通层 Boss 是冰霜女王')
  eq(floorBoss(3, 9), 'ice_queen', '第 3 章第 20 层是冰霜女王')
  eq(floorBoss(3, FLOOR_COUNT), 'dark_knight', 'floorIndex 达到 FLOOR_COUNT 时必为终局 Boss')
  eq(floorBoss(3), 'ice_queen', '只传章节时返回该章普通 Boss')
  eq(floorBoss(99, 3), 'goblin_chief', '章节越界会夹到第 1 章')
  ok(bossById(floorBoss(1, 3)) !== null, 'floorBoss(1,3) 可被 bossById 查到')
  ok(bossById(floorBoss(2, 6)) !== null, 'floorBoss(2,6) 可被 bossById 查到')
  ok(bossById(floorBoss(3, 9)) !== null, 'floorBoss(3,9) 可被 bossById 查到')

  /* ---------- eliteScale ---------- */
  var scale = eliteScale()
  eq(scale.hp, 1.8, '精英倍率 hp = 1.8')
  eq(scale.dmg, 1.25, '精英倍率 dmg = 1.25')
  eq(scale.speed, 1.05, '精英倍率 speed = 1.05')
  eq(scale.coins, 2.2, '精英倍率 coins = 2.2')
  ok(eliteScale() !== scale, 'eliteScale 每次返回新对象')

  /* ---------- spawnWave ---------- */
  var waveA = spawnWave(makeRng(20261026), 1, 1, 'battle')
  var waveB = spawnWave(makeRng(20261026), 1, 1, 'battle')
  eq(JSON.stringify(waveA), JSON.stringify(waveB), '同 seed 的敌人波次完全一致')
  ok(waveA.length >= 2 && waveA.length <= 5, '战斗房敌人数量 2~5（实际 ' + waveA.length + '）')
  testWave(waveA, 1, false, '战斗房波次')

  for (ch = 1; ch <= 4; ch++) {
    for (var floorIndex = 1; floorIndex <= FLOOR_COUNT; floorIndex++) {
      var wave = spawnWave(makeRng(seedOf(ch, floorIndex)), ch, floorIndex, 'battle')
      ok(wave.length >= 2 && wave.length <= 5, '第 ' + floorIndex + ' 层战斗房敌人数量 2~5')
      testWave(wave, ch, false, '第 ' + floorIndex + ' 层战斗房')
    }
  }

  var eliteWave = spawnWave(makeRng(4242), 2, 6, 'elite')
  ok(eliteWave.length >= 1 && eliteWave.length <= 2, '精英房 1~2 个精英（实际 ' + eliteWave.length + '）')
  testWave(eliteWave, 2, true, '精英房波次')

  var emptyTypes = ['start', 'shop', 'treasure', 'statue', 'boss']
  for (i = 0; i < emptyTypes.length; i++) {
    eq(spawnWave(makeRng(7), 3, 9, emptyTypes[i]).length, 0, emptyTypes[i] + ' 房不生成普通敌潮')
  }
}

function testAttack(id, atk) {
  ok(typeof atk.cd === 'number' || atk.type === 'contact', id + ' 攻击有冷却')
  if (atk.type === 'contact') return
  ok(typeof atk.cd === 'number' && atk.cd > 0, id + ' shoot/charge 类攻击 cd > 0')
  ok(typeof atk.dmg === 'number' && atk.dmg >= 1, id + ' 攻击伤害 >= 1')
  if (atk.type === 'shoot' || atk.type === 'burst' || atk.type === 'bomb') {
    ok(typeof atk.range === 'number' && atk.range > 0, id + ' 远程攻击有射程')
    ok(typeof atk.speed === 'number' && atk.speed > 0, id + ' 远程攻击有弹速')
    ok(typeof atk.count === 'number' && atk.count >= 1, id + ' 远程攻击有弹数')
    ok(typeof atk.telegraph === 'number' && atk.telegraph > 0, id + ' 远程攻击有前摇')
  }
  if (atk.type === 'shoot' || atk.type === 'burst') {
    ok(typeof atk.spread === 'number' && atk.spread >= 0, id + ' 散射角合法')
  }
  if (atk.type === 'bomb') {
    ok(typeof atk.radius === 'number' && atk.radius > 0, id + ' 炸弹有爆炸半径')
  }
  if (atk.type === 'charge') {
    ok(typeof atk.telegraph === 'number' && atk.telegraph > 0, id + ' 冲锋有前摇')
    ok(typeof atk.speed === 'number' && atk.speed > 0, id + ' 冲锋有速度')
  }
}

function testBossPattern(bossId, key, p) {
  var tag = 'Boss ' + bossId + ' 招式 ' + key
  ok(p && typeof p === 'object', tag + ' 是对象')
  if (!p) return
  ok(typeof p.cd === 'number' && p.cd > 0, tag + ' 有冷却')
  if (key === 'charge') {
    ok(typeof p.telegraph === 'number' && p.telegraph > 0, tag + ' 有前摇')
    ok(typeof p.speed === 'number' && p.speed > 0, tag + ' 有冲刺速度')
    ok(typeof p.dmg === 'number' && p.dmg >= 1, tag + ' 有伤害')
  } else if (key === 'radial') {
    ok(typeof p.count === 'number' && p.count >= 6, tag + ' 环形弹幕数量够多')
    ok(typeof p.speed === 'number' && p.speed > 0, tag + ' 有弹速')
    ok(typeof p.dmg === 'number' && p.dmg >= 1, tag + ' 有伤害')
  } else if (key === 'summon') {
    ok(typeof p.mob === 'string' && ENEMIES[p.mob] !== undefined, tag + ' 召唤物是已存在的敌人')
    ok(typeof p.count === 'number' && p.count >= 1, tag + ' 召唤数量 >= 1')
  } else if (key === 'aimed') {
    ok(typeof p.count === 'number' && p.count >= 1, tag + ' 有弹数')
    ok(typeof p.speed === 'number' && p.speed > 0, tag + ' 有弹速')
    ok(typeof p.dmg === 'number' && p.dmg >= 1, tag + ' 有伤害')
    ok(typeof p.spread === 'number' && p.spread >= 0, tag + ' 有扩散角')
  } else {
    ok(false, tag + ' 是未知招式名')
  }
}

function seedOf(chapter, floorIndex) {
  return chapter * 1000 + floorIndex * 17 + 3
}

function testWave(wave, chapter, wantElite, tag) {
  var pool = CHAPTERS[chapter - 1].enemyPool
  ok(Array.isArray(wave), tag + ' 返回数组')
  if (!Array.isArray(wave)) return
  for (var i = 0; i < wave.length; i++) {
    var unit = wave[i]
    ok(unit && typeof unit.id === 'string', tag + ' 单位有 id')
    if (!unit) continue
    ok(pool.indexOf(unit.id) !== -1, tag + ' 敌人来自本章池：' + unit.id)
    ok(typeof unit.elite === 'boolean', tag + ' elite 是布尔值')
    eq(unit.elite, wantElite, tag + ' elite 标记正确')
  }
}

/* ======================= 地牢生成 ======================= */

function walkableChar(ch) {
  if (ch === T.WALL || ch === T.PILLAR || ch === T.CRATE || ch === T.BARREL) return false
  return T_CHARS[ch] === true
}

function roomMid(room) {
  return { x: Math.floor(room.w / 2), y: Math.floor(room.h / 2) }
}

function roomDoorCells(room) {
  var m = roomMid(room)
  var list = []
  if (room.doors.up) list.push({ x: m.x, y: 0 })
  if (room.doors.down) list.push({ x: m.x, y: room.h - 1 })
  if (room.doors.left) list.push({ x: 0, y: m.y })
  if (room.doors.right) list.push({ x: room.w - 1, y: m.y })
  return list
}

/* 房间内部从门格出发的 BFS，返回可达格集合 */
function roomBfs(room, seeds) {
  var seen = {}
  var queue = []
  var i, s, k, head, cur, nx, ny, nk, j
  for (i = 0; i < seeds.length; i++) {
    s = seeds[i]
    if (s.x < 0 || s.y < 0 || s.x >= room.w || s.y >= room.h) continue
    k = s.x + ',' + s.y
    if (seen[k]) continue
    if (!walkableChar(room.rows[s.y].charAt(s.x))) continue
    seen[k] = true
    queue.push({ x: s.x, y: s.y })
  }
  head = 0
  while (head < queue.length) {
    cur = queue[head]
    head = head + 1
    for (j = 0; j < DIRS.length; j++) {
      nx = cur.x + DIRS[j].dx
      ny = cur.y + DIRS[j].dy
      if (nx < 0 || ny < 0 || nx >= room.w || ny >= room.h) continue
      nk = nx + ',' + ny
      if (seen[nk]) continue
      if (!walkableChar(room.rows[ny].charAt(nx))) continue
      seen[nk] = true
      queue.push({ x: nx, y: ny })
    }
  }
  return seen
}

function validateRoom(floor, room, problems) {
  var tag = '[' + floor.floorIndex + 'F ' + room.key + ' ' + room.type + '] '
  var w = room.w
  var h = room.h
  var rows = room.rows
  var y, x, i, ch

  if (ROOM_TYPES[room.type] !== 1) problems.push(tag + '未知房间类型 ' + room.type)
  if (!(w >= 28 && w <= 40)) problems.push(tag + '宽度越界 w=' + w)
  if (!(h >= 9 && h <= 13)) problems.push(tag + '高度越界 h=' + h)
  if (!Array.isArray(rows) || rows.length !== h) {
    problems.push(tag + '行数与 h 不一致')
    return
  }

  for (y = 0; y < h; y++) {
    if (typeof rows[y] !== 'string' || rows[y].length !== w) {
      problems.push(tag + '第 ' + y + ' 行长度不是 ' + w)
      return
    }
    for (x = 0; x < w; x++) {
      ch = rows[y].charAt(x)
      if (T_CHARS[ch] !== true) {
        problems.push(tag + '出现非法字符 ' + ch)
        return
      }
    }
  }

  var m = roomMid(room)

  /* 边框：除门洞外必须是墙 */
  for (x = 0; x < w; x++) {
    var topWant = (x === m.x && room.doors.up) ? T.DOOR : T.WALL
    var botWant = (x === m.x && room.doors.down) ? T.DOOR : T.WALL
    if (rows[0].charAt(x) !== topWant) problems.push(tag + '上墙中央开洞不对')
    if (rows[h - 1].charAt(x) !== botWant) problems.push(tag + '下墙中央开洞不对')
  }
  for (y = 0; y < h; y++) {
    var leftWant = (y === m.y && room.doors.left) ? T.DOOR : T.WALL
    var rightWant = (y === m.y && room.doors.right) ? T.DOOR : T.WALL
    if (rows[y].charAt(0) !== leftWant) problems.push(tag + '左墙中央开洞不对')
    if (rows[y].charAt(w - 1) !== rightWant) problems.push(tag + '右墙中央开洞不对')
  }

  /* 门与相邻房间必须双向对应 */
  for (i = 0; i < DIRS.length; i++) {
    var dir = DIRS[i]
    var nk = (room.gx + dir.dx) + ',' + (room.gy + dir.dy)
    var neighbor = floor.rooms[nk]
    if (room.doors[dir.side]) {
      if (!neighbor) problems.push(tag + '门 ' + dir.side + ' 没有相邻房间')
      else if (neighbor.doors[dir.opp] !== true) problems.push(tag + '门 ' + dir.side + ' 对面没有对应门')
    } else if (neighbor) {
      problems.push(tag + '与 ' + nk + ' 相邻但缺门')
    }
  }

  /* 标记点：字符、越界、重叠 */
  var used = {}
  function claimPoint(p, label, wantCh) {
    if (!p) return
    if (typeof p.x !== 'number' || typeof p.y !== 'number' ||
        p.x < 0 || p.y < 0 || p.x >= w || p.y >= h) {
      problems.push(tag + label + ' 坐标越界')
      return
    }
    var cc = rows[p.y].charAt(p.x)
    if (cc !== wantCh) problems.push(tag + label + ' 字符是 ' + cc)
    var kk = p.x + ',' + p.y
    if (used[kk]) problems.push(tag + label + ' 与其他标记重叠')
    used[kk] = true
  }

  if (room.type === 'start') {
    if (!room.spawn || !room.spawn.player) problems.push(tag + '入口房缺出生点')
    else claimPoint(room.spawn.player, '出生点', T.SPAWN)
  } else if (room.spawn) {
    problems.push(tag + '非入口房不该有 spawn')
  }
  for (i = 0; i < room.enemyPoints.length; i++) claimPoint(room.enemyPoints[i], '敌人点' + i, T.ENEMY)
  for (i = 0; i < room.elitePoints.length; i++) claimPoint(room.elitePoints[i], '精英点' + i, T.ELITE)
  if (room.bossPoint) claimPoint(room.bossPoint, 'Boss 点', T.BOSS)
  if (room.chest) claimPoint(room.chest, '宝箱', T.CHEST)
  if (room.goldChest) claimPoint(room.goldChest, '金宝箱', T.GOLD_CHEST)
  if (room.npc) claimPoint(room.npc, '商店 NPC', T.SHOP)
  if (room.statue) claimPoint(room.statue, '雕像', T.STATUE)
  if (room.portal) problems.push(tag + '生成期不该预置传送门')

  /* 房间类型的必备内容 */
  if (room.type === 'battle' && room.enemyPoints.length < 3) problems.push(tag + '战斗房敌人点少于 3')
  if (room.type === 'elite' && room.elitePoints.length < 1) problems.push(tag + '精英房没有精英点')
  if (room.type === 'boss' && !room.bossPoint) problems.push(tag + 'Boss 房缺 Boss 点')
  if (room.type === 'treasure' && !room.chest) problems.push(tag + '宝箱房缺宝箱')
  if (room.type === 'shop' && !room.npc) problems.push(tag + '商店房缺 NPC')
  if (room.type === 'statue' && !room.statue) problems.push(tag + '雕像房缺雕像')

  /* 门口内侧必须可走（不堵门） */
  if (room.doors.up && !walkableChar(rows[1].charAt(m.x))) problems.push(tag + '上门口被堵')
  if (room.doors.down && !walkableChar(rows[h - 2].charAt(m.x))) problems.push(tag + '下门口被堵')
  if (room.doors.left && !walkableChar(rows[m.y].charAt(1))) problems.push(tag + '左门口被堵')
  if (room.doors.right && !walkableChar(rows[m.y].charAt(w - 2))) problems.push(tag + '右门口被堵')

  /* 从门出发 BFS：门、出生点、所有标记点必须同一连通域 */
  var doorCells = roomDoorCells(room)
  if (!doorCells.length) {
    problems.push(tag + '没有任何门（不连通）')
    return
  }
  var seen = roomBfs(room, doorCells)
  for (i = 0; i < doorCells.length; i++) {
    if (!seen[doorCells[i].x + ',' + doorCells[i].y]) problems.push(tag + '门之间不连通')
  }
  function checkReach(p, label) {
    if (!p || typeof p.x !== 'number') return
    if (!seen[p.x + ',' + p.y]) problems.push(tag + label + ' 不可达')
  }
  if (room.spawn && room.spawn.player) checkReach(room.spawn.player, '出生点')
  for (i = 0; i < room.enemyPoints.length; i++) checkReach(room.enemyPoints[i], '敌人点')
  for (i = 0; i < room.elitePoints.length; i++) checkReach(room.elitePoints[i], '精英点')
  checkReach(room.bossPoint, 'Boss 点')
  checkReach(room.chest, '宝箱')
  checkReach(room.goldChest, '金宝箱')
  checkReach(room.npc, '商店 NPC')
  checkReach(room.statue, '雕像')
  if (room.spawn && room.spawn.player) {
    ch = rows[room.spawn.player.y].charAt(room.spawn.player.x)
    if (!walkableChar(ch)) problems.push(tag + '出生点不可走')
  }
}

function validateFloor(floor, opts, problems) {
  var tag = '[' + floor.floorIndex + 'F seed=' + opts.seed + '] '
  var i, j, key, room, gx, gy, nk, dir
  if (floor.chapter !== opts.chapter) problems.push(tag + '章节字段不对')
  if (floor.floorIndex !== opts.floorIndex) problems.push(tag + '层号字段不对')
  if (floor.floorInChapter !== opts.floorInChapter) problems.push(tag + '章内层号字段不对')
  if (floor.gridW !== 5 || floor.gridH !== 5) problems.push(tag + '网格不是 5x5')
  eqStr(floor.startKey, '2,4', tag + '入口固定 2,4', problems)
  eqStr(floor.bossKey, '2,0', tag + 'Boss 房固定 2,0', problems)
  if (floor.difficulty !== (opts.difficulty || 1)) problems.push(tag + 'difficulty 字段不对')

  var meta = CHAPTERS[floor.chapter - 1]
  if (!meta) {
    problems.push(tag + '章节越界')
    return
  }
  eqStr(floor.chapterName, meta.name, tag + '章节名', problems)
  eqStr(floor.theme, meta.theme, tag + '主题', problems)

  var keys = Object.keys(floor.rooms)
  var count = keys.length
  if (!(count >= 6 && count <= 8)) problems.push(tag + '房间数 ' + count + ' 不在 6~8')
  if (!Array.isArray(floor.roomOrder) || floor.roomOrder.length !== count) {
    problems.push(tag + 'roomOrder 数量与房间数不一致')
  } else {
    var seenOrder = {}
    for (i = 0; i < floor.roomOrder.length; i++) {
      key = floor.roomOrder[i]
      if (seenOrder[key]) problems.push(tag + 'roomOrder 重复 ' + key)
      seenOrder[key] = true
      if (!floor.rooms[key]) problems.push(tag + 'roomOrder 含不存在的房间 ' + key)
    }
    if (floor.roomOrder[0] !== floor.startKey) problems.push(tag + 'roomOrder 未从入口开始')
  }

  var startRoom = floor.rooms[floor.startKey]
  var bossRoom = floor.rooms[floor.bossKey]
  if (!startRoom || startRoom.type !== 'start') problems.push(tag + '入口房缺失或类型不对')
  if (!bossRoom || bossRoom.type !== 'boss') problems.push(tag + 'Boss 房缺失或类型不对')

  var typeCount = { start: 0, battle: 0, elite: 0, treasure: 0, shop: 0, statue: 0, boss: 0 }
  for (i = 0; i < keys.length; i++) {
    key = keys[i]
    room = floor.rooms[key]
    if (room.key !== key) problems.push(tag + 'room.key 与键不一致 ' + key)
    var parts = key.split(',')
    gx = parseInt(parts[0], 10)
    gy = parseInt(parts[1], 10)
    if (room.gx !== gx || room.gy !== gy) problems.push(tag + 'room.gx/gy 与 key 不一致 ' + key)
    if (!(gx >= 0 && gx < 5 && gy >= 0 && gy < 5)) problems.push(tag + '房间坐标越界 ' + key)
    if (typeCount[room.type] === undefined) problems.push(tag + '未知类型 ' + room.type)
    else typeCount[room.type] = typeCount[room.type] + 1
    validateRoom(floor, room, problems)
  }

  if (typeCount.start !== 1) problems.push(tag + '入口房数量不是 1')
  if (typeCount.boss !== 1) problems.push(tag + 'Boss 房数量不是 1')
  if (typeCount.shop < 1) problems.push(tag + '缺少商店房')
  if (typeCount.treasure < 1) problems.push(tag + '缺少宝箱房')
  if (typeCount.elite > 1) problems.push(tag + '精英房超过 1 个')

  /* 房间图连通性（BFS） */
  var reached = {}
  reached[floor.startKey] = true
  var queue = [floor.startKey]
  var head = 0
  while (head < queue.length) {
    key = queue[head]
    head = head + 1
    room = floor.rooms[key]
    if (!room) continue
    for (j = 0; j < DIRS.length; j++) {
      dir = DIRS[j]
      nk = (room.gx + dir.dx) + ',' + (room.gy + dir.dy)
      if (floor.rooms[nk] && !reached[nk]) {
        reached[nk] = true
        queue.push(nk)
      }
    }
  }
  var reachedCount = Object.keys(reached).length
  if (reachedCount !== count) problems.push(tag + '房间不连通：可达 ' + reachedCount + '/' + count)
  if (!reached[floor.bossKey]) problems.push(tag + 'Boss 房从入口不可达')

  /* Boss 选择 */
  var wantBoss = floor.floorIndex >= FLOOR_COUNT ? FINAL_BOSS : meta.boss
  eqStr(floor.bossId, wantBoss, tag + 'bossId', problems)
  if (!bossById(floor.bossId)) problems.push(tag + 'bossId 在 BOSSES 中查不到')
}

function eqStr(actual, expected, msg, problems) {
  if (actual !== expected) problems.push(msg + '（期望 ' + expected + '，实际 ' + actual + '）')
}

function testDungeon() {
  section('地牢生成：20 层 x 多种子结构校验')
  var seeds = [1, 2, 3, 777, 20261026]
  var checked = 0
  var generatedFloorIds = {}
  var ch, fic, s, si, floorIndex, floor, problems, i

  for (ch = 1; ch <= 4; ch++) {
    for (fic = 1; fic <= 5; fic++) {
      floorIndex = (ch - 1) * 5 + fic
      for (si = 0; si < seeds.length; si++) {
        s = seeds[si]
        floor = generateFloor({
          chapter: ch, floorIndex: floorIndex, floorInChapter: fic, seed: s, difficulty: 1
        })
        problems = []
        validateFloor(floor, { chapter: ch, floorIndex: floorIndex, floorInChapter: fic, seed: s, difficulty: 1 }, problems)
        ok(problems.length === 0, '第 ' + floorIndex + ' 层 seed=' + s + ' 结构异常：' + problems.slice(0, 5).join('；'))
        checked = checked + 1
        generatedFloorIds[floorIndex] = true
      }
    }
  }
  eq(checked, 100, '3 章 x 3 层 x 5 种子共生成 45 层')
  eq(Object.keys(generatedFloorIds).length, FLOOR_COUNT, '20 个楼层编号全部能生成')

  section('地牢生成：可复现性与随机性')
  var opts = { chapter: 3, floorIndex: 5, floorInChapter: 1, seed: 424242, difficulty: 1 }
  var a = generateFloor(opts)
  generateFloor({ chapter: 1, floorIndex: 1, floorInChapter: 1, seed: 999, difficulty: 1 })
  var b = generateFloor(opts)
  eq(JSON.stringify(a), JSON.stringify(b), '同 seed 输出逐字节一致（中间穿插其它生成也不受影响）')
  eq(JSON.stringify(a.rooms), JSON.stringify(b.rooms), '同 seed 房间结构一致')

  var sigs = {}
  for (i = 0; i < 6; i++) {
    var f = generateFloor({ chapter: 1, floorIndex: 1, floorInChapter: 1, seed: 1000 + i, difficulty: 1 })
    sigs[JSON.stringify(f)] = true
  }
  ok(Object.keys(sigs).length >= 5, '不同 seed 至少产生 5 种不同布局（实际 ' + Object.keys(sigs).length + '）')

  /* 大 seed（Date.now 量级）与 0 seed 都要能跑 */
  var bigSeed = generateFloor({ chapter: 4, floorIndex: 20, floorInChapter: 5, seed: 1729929756000, difficulty: 1 })
  problems = []
  validateFloor(bigSeed, { chapter: 4, floorIndex: 20, floorInChapter: 5, seed: 1729929756000, difficulty: 1 }, problems)
  ok(problems.length === 0, 'Date.now 量级 seed 可生成：' + problems.slice(0, 3).join('；'))
  eq(bigSeed.bossId, FINAL_BOSS, '第 20 层 bossId 是终局 Boss')

  var zeroSeed = generateFloor({ chapter: 1, floorIndex: 1, floorInChapter: 1, seed: 0, difficulty: 1 })
  problems = []
  validateFloor(zeroSeed, { chapter: 1, floorIndex: 1, floorInChapter: 1, seed: 1, difficulty: 1 }, problems)
  ok(problems.length === 0, 'seed=0 会归一为 1 并正常生成：' + problems.slice(0, 3).join('；'))

  /* 参数缺省与夹取 */
  var inferred = generateFloor({ chapter: 2, floorInChapter: 2, seed: 31 })
  eq(inferred.floorIndex, 7, '只给章节+章内层号可推出全局层号')
  problems = []
  validateFloor(inferred, { chapter: 2, floorIndex: 7, floorInChapter: 2, seed: 31, difficulty: 1 }, problems)
  ok(problems.length === 0, '推导层号后结构仍合法：' + problems.slice(0, 3).join('；'))

  var defaulted = generateFloor({ seed: 8 })
  eq(defaulted.chapter, 1, '无参数默认第 1 章')
  eq(defaulted.floorIndex, 1, '无参数默认第 1 层')

  var clamped = generateFloor({ chapter: 99, floorIndex: 3, floorInChapter: 1, seed: 12 })
  eq(clamped.chapter, 4, '章节越界夹到第 4 章')

  var hard = generateFloor({ chapter: 4, floorIndex: 20, floorInChapter: 5, seed: 55, difficulty: 5 })
  problems = []
  validateFloor(hard, { chapter: 4, floorIndex: 20, floorInChapter: 5, seed: 55, difficulty: 5 }, problems)
  ok(problems.length === 0, 'difficulty=5 也能生成合法楼层：' + problems.slice(0, 3).join('；'))

  section('地牢生成：精英房出现概率')
  var eliteRate1 = eliteRate(1, 200)
  var eliteRate20 = eliteRate(20, 200)
  console.log('  第 1 层精英房概率 ≈ ' + eliteRate1 + '，第 20 层 ≈ ' + eliteRate20)
  ok(eliteRate1 >= 0.2 && eliteRate1 <= 0.6, '第 1 层精英房概率落在 20%~60%（实际 ' + eliteRate1 + '）')
  ok(eliteRate20 >= 0.7 && eliteRate20 <= 1.0, '第 20 层精英房概率落在 70%~100%（实际 ' + eliteRate20 + '）')
  ok(eliteRate20 > eliteRate1, '精英房概率随层数上升')

  section('地牢生成：每层必有 boss / shop / 宝箱')
  /* 与上面 45 层重复，但这里单独统计一次，便于失败时快速定位 */
  var floorChecks = 0
  for (i = 1; i <= FLOOR_COUNT; i++) {
    var fl = generateFloor({ chapter: Math.floor((i - 1) / 3) + 1, floorIndex: i, seed: 606 + i })
    var hasBoss = false
    var hasShop = false
    var hasChest = false
    var keys2 = Object.keys(fl.rooms)
    for (var q = 0; q < keys2.length; q++) {
      var t2 = fl.rooms[keys2[q]].type
      if (t2 === 'boss') hasBoss = true
      if (t2 === 'shop') hasShop = true
      if (t2 === 'treasure') hasChest = true
    }
    ok(hasBoss, '第 ' + i + ' 层有 Boss 房')
    ok(hasShop, '第 ' + i + ' 层有商店房')
    ok(hasChest, '第 ' + i + ' 层有宝箱房')
    floorChecks = floorChecks + 1
  }
  eq(floorChecks, 20, '9 层逐层检查完成')
}

function eliteRate(floorIndex, total) {
  var count = 0
  var chapter = Math.floor((floorIndex - 1) / 3) + 1
  for (var s = 1; s <= total; s++) {
    var f = generateFloor({ chapter: chapter, floorIndex: floorIndex, seed: s * 7919 + floorIndex })
    var keys = Object.keys(f.rooms)
    var hasElite = false
    for (var i = 0; i < keys.length; i++) {
      if (f.rooms[keys[i]].type === 'elite') {
        hasElite = true
        break
      }
    }
    if (hasElite) count = count + 1
  }
  return Math.round((count / total) * 1000) / 1000
}

/* ======================= ES5 / 依赖红线 ======================= */

function testSourceStyle() {
  section('数据模块 ES5 与依赖检查')
  var files = ['enemies.js', 'dungeon.js']
  var BACKTICK = String.fromCharCode(96)
  var allowed = { './constants.js': 1, './rng.js': 1 }
  var f, i
  for (i = 0; i < files.length; i++) {
    f = files[i]
    var full = path.join(GAME_DIR, f)
    ok(fs.existsSync(full), f + ' 文件存在')
    if (!fs.existsSync(full)) continue
    var src = fs.readFileSync(full, 'utf8')
    ok(src.indexOf('=>') === -1, f + ' 没有箭头函数')
    ok(src.indexOf(BACKTICK) === -1, f + ' 没有模板字符串')
    ok(!/\b(let|const)\s+/.test(src), f + ' 没有 let/const')
    ok(!/\bclass\s+/.test(src), f + ' 没有 class')
    ok(!/\.includes\s*\(/.test(src), f + ' 没有 Array.prototype.includes')
    ok(!/Object\.assign/.test(src), f + ' 没有 Object.assign')
    ok(!/\.\.\./.test(src), f + ' 没有展开语法')
    ok(!/\bfor\s*\(\s*(?:var|let|const)\s+\w+\s+of\b/.test(src), f + ' 没有 for-of')
    var importPaths = []
    var re = /import\s*\{[^}]*\}\s*from\s*'([^']+)'/g
    var mm
    while ((mm = re.exec(src)) !== null) importPaths.push(mm[1])
    ok(importPaths.length >= 1, f + ' 使用 ESM import')
    var allowedOnly = true
    for (var j = 0; j < importPaths.length; j++) {
      if (allowed[importPaths[j]] !== 1) allowedOnly = false
    }
    ok(allowedOnly, f + ' 只 import constants.js / rng.js（实际 ' + importPaths.join(', ') + '）')
  }
}

/* ======================= 主流程 ======================= */

testEnemies()
testDungeon()
testSourceStyle()

console.log('')
console.log('='.repeat(60))
console.log('结果: ' + pass + ' 通过, ' + fail + ' 失败')
if (fail > 0) {
  console.log('失败明细：')
  for (var fi = 0; fi < failMsgs.length && fi < 25; fi++) console.log('  ' + (fi + 1) + '. ' + failMsgs[fi])
  process.exit(1)
}
process.exit(0)
