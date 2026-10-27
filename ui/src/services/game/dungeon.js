/*
 * 地牢楼层生成器（world-data 交付）。
 *
 * 结构：
 *  - 5x5 网格里挑 8~10 个房间，从入口 (2,4) 一路打通往 Boss 房 (2,0)，其余房间从已选房间
 *    向外随机扩张，天然保证全连通；
 *  - 每层必有 入口 / 首领 / 商店 / 宝箱，另有概率出精英房与雕像房；
 *  - 房间四周 1 格墙，门开在墙的中央 1 格（T.DOOR），相邻房间的门必然成对；
 *  - 房间内部随机撒 O/c/b 障碍与 t 火把，但中央十字走廊永久保持畅通，
 *    因此门与出生点不会被堵死，所有标记点都从可达区域里选；
 *  - 全部随机数来自 makeRng(seed)，同 seed 输出逐字节一致，方便测试与复现。
 *
 * 坐标约定：room.key = 'gx,gy'，gx 向右、gy 向下；瓦片坐标 x 向右、y 向下。
 */
import { T, CHAPTERS, FLOOR_COUNT, FINAL_BOSS } from './constants.js'
import { makeRng, rint, chance, shuffle } from './rng.js'

var GRID_W = 5
var GRID_H = 5
var START_CELL = { x: 2, y: 4 }
var BOSS_CELL = { x: 2, y: 0 }
var MIN_ROOMS = 6
var MAX_ROOMS = 8
var MIN_ROOM_W = 28
var MAX_ROOM_W = 40
var MIN_ROOM_H = 9
var MAX_ROOM_H = 13

/* 四个方向：dx/dy 为网格与瓦片通用偏移，door/opp 为门字段名 */
var DIRS = [
  { dx: 0, dy: -1, door: 'up', opp: 'down' },
  { dx: 1, dy: 0, door: 'right', opp: 'left' },
  { dx: 0, dy: 1, door: 'down', opp: 'up' },
  { dx: -1, dy: 0, door: 'left', opp: 'right' }
]

function cellKey(gx, gy) {
  return gx + ',' + gy
}

function cellPos(key) {
  var parts = key.split(',')
  return { x: parseInt(parts[0], 10), y: parseInt(parts[1], 10) }
}

function clampInt(v, lo, hi) {
  var n = Math.floor(Number(v))
  if (!(n >= lo)) n = lo
  if (n > hi) n = hi
  return n
}

function countKeys(obj) {
  return Object.keys(obj).length
}

/* ---------------- 房间布局（网格层） ---------------- */

/* 从入口向 Boss 房找一条简单路径；maxLen 限制路径长度，保证后面还有位置扩张 */
function findPath(rng, sx, sy, goalX, goalY, maxLen) {
  var visited = {}
  var path = [{ x: sx, y: sy }]
  visited[cellKey(sx, sy)] = true
  return dfsPath(rng, sx, sy, goalX, goalY, visited, path, maxLen)
}

function dfsPath(rng, x, y, goalX, goalY, visited, path, maxLen) {
  if (x === goalX && y === goalY) return path
  if (path.length >= maxLen) return null
  var dirs = shuffle(rng, DIRS)
  var i, nx, ny, nk, sub
  for (i = 0; i < dirs.length; i++) {
    nx = x + dirs[i].dx
    ny = y + dirs[i].dy
    if (nx < 0 || ny < 0 || nx >= GRID_W || ny >= GRID_H) continue
    nk = cellKey(nx, ny)
    if (visited[nk]) continue
    visited[nk] = true
    path.push({ x: nx, y: ny })
    sub = dfsPath(rng, nx, ny, goalX, goalY, visited, path, maxLen)
    if (sub) return sub
    path.pop()
    visited[nk] = false
  }
  return null
}

/* 已选房间的相邻空格，用于随机扩张 */
function frontierCells(selected) {
  var keys = Object.keys(selected)
  var seen = {}
  var list = []
  var i, j, pos, nx, ny, nk
  for (i = 0; i < keys.length; i++) {
    pos = cellPos(keys[i])
    for (j = 0; j < DIRS.length; j++) {
      nx = pos.x + DIRS[j].dx
      ny = pos.y + DIRS[j].dy
      if (nx < 0 || ny < 0 || nx >= GRID_W || ny >= GRID_H) continue
      nk = cellKey(nx, ny)
      if (selected[nk] || seen[nk]) continue
      seen[nk] = true
      list.push({ x: nx, y: ny })
    }
  }
  return list
}

function planRooms(rng, roomCount) {
  var selected = {}
  var path = findPath(rng, START_CELL.x, START_CELL.y, BOSS_CELL.x, BOSS_CELL.y, roomCount)
  var i, frontier, cell
  for (i = 0; i < path.length; i++) {
    selected[cellKey(path[i].x, path[i].y)] = true
  }
  while (countKeys(selected) < roomCount) {
    frontier = frontierCells(selected)
    if (!frontier.length) break
    cell = frontier[rint(rng, 0, frontier.length - 1)]
    selected[cellKey(cell.x, cell.y)] = true
  }
  return selected
}

/* 房间类型：入口/Boss 固定，商店+宝箱必出，精英/雕像按层数概率出现 */
function planTypes(rng, selected, floorIndex, difficulty) {
  var keys = Object.keys(selected)
  var startKey = cellKey(START_CELL.x, START_CELL.y)
  var bossKey = cellKey(BOSS_CELL.x, BOSS_CELL.y)
  var types = {}
  var others = []
  var i, idx, eliteP, statueP
  types[startKey] = 'start'
  types[bossKey] = 'boss'
  for (i = 0; i < keys.length; i++) {
    if (keys[i] !== startKey && keys[i] !== bossKey) others.push(keys[i])
  }
  others = shuffle(rng, others)
  types[others[0]] = 'shop'
  types[others[1]] = 'treasure'
  idx = 2
  eliteP = 0.35 + 0.07 * (floorIndex - 1) + (difficulty - 1) * 0.03
  if (eliteP > 0.92) eliteP = 0.92
  if (idx < others.length && chance(rng, eliteP)) {
    types[others[idx]] = 'elite'
    idx = idx + 1
  }
  statueP = 0.28
  if (idx < others.length && chance(rng, statueP)) {
    types[others[idx]] = 'statue'
    idx = idx + 1
  }
  for (; idx < others.length; idx++) {
    types[others[idx]] = 'battle'
  }
  return types
}

/* ---------------- 单房间生成（瓦片层） ---------------- */

function doorsOf(selected, gx, gy) {
  return {
    up: selected[cellKey(gx, gy - 1)] === true,
    down: selected[cellKey(gx, gy + 1)] === true,
    left: selected[cellKey(gx - 1, gy)] === true,
    right: selected[cellKey(gx + 1, gy)] === true
  }
}

function blankGrid(w, h) {
  var g = []
  var y, x, row
  for (y = 0; y < h; y++) {
    row = []
    for (x = 0; x < w; x++) {
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) row.push(T.WALL)
      else row.push(T.FLOOR)
    }
    g.push(row)
  }
  return g
}

/*
 * 随机摆障碍：中央十字走廊（x=midX 与 y=midY）永不放置，
 * 于是四扇门与房间中心始终连通，不会出现"堵门/封死"。
 */
function carveObstacles(rng, g, w, h, midX, midY, density) {
  var y, x, r
  for (y = 1; y < h - 1; y++) {
    for (x = 1; x < w - 1; x++) {
      if (x === midX || y === midY) continue
      if (rng() > density) continue
      r = rng()
      if (r < 0.34) g[y][x] = T.PILLAR
      else if (r < 0.67) g[y][x] = T.BARREL
      else g[y][x] = T.CRATE
    }
  }
}

/* 火把装饰：贴着上下墙每隔几格放一盏（不放在中央走廊上） */
function placeTorches(g, w, h, midX) {
  var x
  for (x = 2; x < w - 2; x += 5) {
    if (x !== midX && g[1][x] === T.FLOOR) g[1][x] = T.TORCH
    if (x !== midX && g[h - 2][x] === T.FLOOR) g[h - 2][x] = T.TORCH
  }
}

function walkableCh(ch) {
  if (ch === T.WALL) return false
  if (ch === T.PILLAR) return false
  if (ch === T.CRATE) return false
  if (ch === T.BARREL) return false
  return true
}

/* 从房间中心做 BFS，返回可达瓦片列表（顺序稳定，便于后续取点） */
function reachableFrom(g, w, h, sx, sy) {
  var seen = {}
  var list = []
  var queue = [{ x: sx, y: sy }]
  var head = 0
  var i, cur, nx, ny, nk
  seen[cellKey(sx, sy)] = true
  while (head < queue.length) {
    cur = queue[head]
    head = head + 1
    list.push(cur)
    for (i = 0; i < DIRS.length; i++) {
      nx = cur.x + DIRS[i].dx
      ny = cur.y + DIRS[i].dy
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue
      if (!walkableCh(g[ny][nx])) continue
      nk = cellKey(nx, ny)
      if (seen[nk]) continue
      seen[nk] = true
      queue.push({ x: nx, y: ny })
    }
  }
  return { list: list, seen: seen }
}

function availableCells(list, used) {
  var out = []
  var i, c
  for (i = 0; i < list.length; i++) {
    c = list[i]
    if (used[cellKey(c.x, c.y)]) continue
    out.push({ x: c.x, y: c.y })
  }
  return out
}

/* 从可达区域随机取 count 个未被占用的格子 */
function takeCells(rng, list, count, used) {
  var pool = shuffle(rng, availableCells(list, used))
  var out = []
  var i
  for (i = 0; i < pool.length && out.length < count; i++) {
    used[cellKey(pool[i].x, pool[i].y)] = true
    out.push(pool[i])
  }
  return out
}

/* 取离 (tx,ty) 最近的可达格子；距离相同则随机，避免每张图都落在同一点 */
function takeNearest(rng, list, tx, ty, used) {
  var pool = availableCells(list, used)
  if (!pool.length) return null
  var best = []
  var bestD = 999999
  var i, c, d, chosen
  for (i = 0; i < pool.length; i++) {
    c = pool[i]
    d = Math.abs(c.x - tx) + Math.abs(c.y - ty)
    if (d < bestD) {
      bestD = d
      best = [c]
    } else if (d === bestD) {
      best.push(c)
    }
  }
  chosen = best[rint(rng, 0, best.length - 1)]
  used[cellKey(chosen.x, chosen.y)] = true
  return chosen
}

function makeRoom(rng, key, pos, type, selected, floorIndex, difficulty) {
  var w, h
  if (type === 'boss') {
    w = rint(rng, 30, MAX_ROOM_W)
    h = rint(rng, 11, MAX_ROOM_H)
  } else if (type === 'start') {
    w = rint(rng, MIN_ROOM_W, 34)
    h = rint(rng, MIN_ROOM_H, 12)
  } else {
    w = rint(rng, MIN_ROOM_W, MAX_ROOM_W)
    h = rint(rng, MIN_ROOM_H, MAX_ROOM_H)
  }
  var midX = Math.floor(w / 2)
  var midY = Math.floor(h / 2)
  var doors = doorsOf(selected, pos.x, pos.y)
  var g = blankGrid(w, h)
  var x, y, i, cells, cell
  var rows = []
  var row

  if (doors.up) g[0][midX] = T.DOOR
  if (doors.down) g[h - 1][midX] = T.DOOR
  if (doors.left) g[midY][0] = T.DOOR
  if (doors.right) g[midY][w - 1] = T.DOOR

  carveObstacles(rng, g, w, h, midX, midY, 0.09 + 0.005 * floorIndex + (difficulty - 1) * 0.01)
  placeTorches(g, w, h, midX)

  var reach = reachableFrom(g, w, h, midX, midY)
  var used = {}
  /* 门格保留给门本身，不摆放任何标记 */
  used[cellKey(midX, 0)] = true
  used[cellKey(midX, h - 1)] = true
  used[cellKey(0, midY)] = true
  used[cellKey(w - 1, midY)] = true

  var room = {
    key: key,
    gx: pos.x,
    gy: pos.y,
    type: type,
    w: w,
    h: h,
    rows: null,
    doors: doors,
    spawn: null,
    enemyPoints: [],
    elitePoints: [],
    bossPoint: null,
    chest: null,
    goldChest: null,
    npc: null,
    statue: null,
    portal: null,
    cleared: false,
    visited: false
  }

  if (type === 'start') {
    cell = takeNearest(rng, reach.list, midX, h - 2, used)
    if (cell) {
      g[cell.y][cell.x] = T.SPAWN
      room.spawn = { player: { x: cell.x, y: cell.y } }
    }
  } else if (type === 'battle') {
    cells = takeCells(rng, reach.list, 3 + Math.floor((floorIndex - 1) / 3), used)
    for (i = 0; i < cells.length; i++) {
      g[cells[i].y][cells[i].x] = T.ENEMY
      room.enemyPoints.push({ x: cells[i].x, y: cells[i].y })
    }
  } else if (type === 'elite') {
    cells = takeCells(rng, reach.list, 2, used)
    for (i = 0; i < cells.length; i++) {
      g[cells[i].y][cells[i].x] = T.ELITE
      room.elitePoints.push({ x: cells[i].x, y: cells[i].y })
    }
    cells = takeCells(rng, reach.list, 1, used)
    for (i = 0; i < cells.length; i++) {
      g[cells[i].y][cells[i].x] = T.ENEMY
      room.enemyPoints.push({ x: cells[i].x, y: cells[i].y })
    }
  } else if (type === 'treasure') {
    cell = takeNearest(rng, reach.list, midX, midY, used)
    if (cell) {
      g[cell.y][cell.x] = T.CHEST
      room.chest = { x: cell.x, y: cell.y }
    }
    if (chance(rng, 0.18 + 0.03 * floorIndex)) {
      cell = takeNearest(rng, reach.list, midX + 3, midY, used)
      if (cell) {
        g[cell.y][cell.x] = T.GOLD_CHEST
        room.goldChest = { x: cell.x, y: cell.y }
      }
    }
  } else if (type === 'shop') {
    cell = takeNearest(rng, reach.list, midX, midY, used)
    if (cell) {
      g[cell.y][cell.x] = T.SHOP
      room.npc = { x: cell.x, y: cell.y }
    }
  } else if (type === 'statue') {
    cell = takeNearest(rng, reach.list, midX, midY, used)
    if (cell) {
      g[cell.y][cell.x] = T.STATUE
      room.statue = { x: cell.x, y: cell.y }
    }
  } else if (type === 'boss') {
    cell = takeNearest(rng, reach.list, midX, midY, used)
    if (cell) {
      g[cell.y][cell.x] = T.BOSS
      room.bossPoint = { x: cell.x, y: cell.y }
    }
  }

  for (y = 0; y < h; y++) {
    row = []
    for (x = 0; x < w; x++) row.push(g[y][x])
    rows.push(row.join(''))
  }
  room.rows = rows
  return room
}

/* ---------------- 对外入口 ---------------- */

/* 房间连通顺序：从入口房开始做 BFS，用于小地图/进度推进 */
function orderRooms(selected, startKey) {
  var seen = {}
  var queue = [startKey]
  var order = []
  var head = 0
  var key, pos, i, nk
  seen[startKey] = true
  while (head < queue.length) {
    key = queue[head]
    head = head + 1
    order.push(key)
    pos = cellPos(key)
    for (i = 0; i < DIRS.length; i++) {
      nk = cellKey(pos.x + DIRS[i].dx, pos.y + DIRS[i].dy)
      if (!selected[nk] || seen[nk]) continue
      seen[nk] = true
      queue.push(nk)
    }
  }
  return order
}

function floorBossId(chapter, floorIndex) {
  if (floorIndex >= FLOOR_COUNT) return FINAL_BOSS
  return CHAPTERS[chapter - 1].boss
}

/*
 * generateFloor({ chapter, floorIndex, floorInChapter, seed, difficulty }) -> floor
 * 参数缺省时按 floorIndex 推章节；floorIndex 会被夹到 1..FLOOR_COUNT。
 * 返回值多带 bossId / seed / difficulty 三个便利字段，方便引擎与测试直接取用。
 */
export function generateFloor(opts) {
  opts = opts || {}
  var rawChapter = Number(opts.chapter)
  var rawFloor = Number(opts.floorIndex)
  var chapter
  if (rawChapter >= 1) chapter = Math.floor(rawChapter)
  else if (rawFloor >= 1) chapter = Math.floor((rawFloor - 1) / 5) + 1
  else chapter = 1
  chapter = clampInt(chapter, 1, CHAPTERS.length)

  var floorIndex
  if (rawFloor >= 1) floorIndex = Math.floor(rawFloor)
  else floorIndex = (chapter - 1) * 5 + clampInt(opts.floorInChapter || 1, 1, 5)
  floorIndex = clampInt(floorIndex, 1, FLOOR_COUNT)

  var floorInChapter = clampInt(opts.floorInChapter || ((floorIndex - 1) % 5 + 1), 1, 5)
  var difficulty = clampInt(opts.difficulty || 1, 1, 5)
  var seed = Number(opts.seed)
  if (!isFinite(seed) || seed === 0) seed = 1

  var rng = makeRng(seed)
  var roomCount = rint(rng, MIN_ROOMS, MAX_ROOMS)
  var selected = planRooms(rng, roomCount)
  var types = planTypes(rng, selected, floorIndex, difficulty)
  var startKey = cellKey(START_CELL.x, START_CELL.y)
  var bossKey = cellKey(BOSS_CELL.x, BOSS_CELL.y)
  var rooms = {}
  var keys = Object.keys(selected)
  var i, key
  for (i = 0; i < keys.length; i++) {
    key = keys[i]
    rooms[key] = makeRoom(rng, key, cellPos(key), types[key], selected, floorIndex, difficulty)
  }

  var meta = CHAPTERS[chapter - 1]
  return {
    chapter: chapter,
    chapterName: meta.name,
    floorIndex: floorIndex,
    floorInChapter: floorInChapter,
    theme: meta.theme,
    gridW: GRID_W,
    gridH: GRID_H,
    rooms: rooms,
    startKey: startKey,
    bossKey: bossKey,
    roomOrder: orderRooms(selected, startKey),
    bossId: floorBossId(chapter, floorIndex),
    seed: seed,
    difficulty: difficulty
  }
}
