/*
 * 笔上元气骑士 — 局内引擎核心（房间 / 楼层 / 状态机 / 交互）。
 *
 * 分工：
 *   engine.js  状态机、地牢进度、房间切换、输入、交互、结算
 *   combat.js  玩家/敌人/子弹/掉落/技能运行时（installCombat 混入 Game.prototype）
 *   render.js  全部绘制（renderGame）
 *   skills.js  8 个职业技能实现
 *
 * 运行环境：QuickJS + Canvas 2D，无 document/window；ES5 语法风格。
 */
import {
  TILE, DESIGN_W, DESIGN_H, INTERACT_RANGE, ROOM, CHAPTERS, FLOOR_COUNT,
  FINAL_BOSS, GEM_PER_ROOM, GEM_PER_FLOOR, GEM_PER_BOSS, GEM_PER_WIN, SCENE_MODS,
  ELEMENT, WIKI_BOSS_RED_FULL, WIKI_BOSS_RED, WIKI_BOSS_RED_EXTRA, WIKI_PASSIVE_BUFF, WIKI_PASSIVE_BUFF2, WIKI_ENEMY_WEIGHT, reviveCost, START_GEMS
} from './constants.js'
import { makeRng, rint, rfloat, chance, pick } from './rng.js'
import { characterById, charStats } from './characters.js'
import { weaponById } from './weapons.js'
import { bossById, spawnWave, floorBoss, enemyById } from './enemies.js'
import { buffById, rollBuffs } from './buffs.js'
import { roomReward, chestLoot, rollShop } from './loot.js'
import { generateFloor } from './dungeon.js'
import { installCombat } from './combat.js'
import { castSkill } from './skills.js'
import { PETS, PET_ORDER, petById } from './pets.js'
import { renderGame } from './render.js'

var OPPOSITE = { up: 'down', down: 'up', left: 'right', right: 'left' }
var DIR_VEC = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } }

function makeWeaponState(id) {
  var def = weaponById(id)
  if (!def) return null
  return { id: def.id, def: def, cd: 0, burstLeft: 0, burstT: 0, burstDirX: 1, burstDirY: 0 }
}

export function Game(ctx, hooks) {
  this.ctx = ctx
  this.hooks = hooks || {}
  this.viewW = DESIGN_W
  this.viewH = DESIGN_H
  this.canvasPxW = 0
  this.canvasPxH = 0
  this.scX = 1
  this.scY = 1
  this.actualCw = 0
  this.actualCh = 0
  this.rng = makeRng(1)
  this.state = 'idle'
  this.paused = false
  this.ended = false
  this.time = 0
  this.stateT = 0
  this.fps = 60
  this.settings = {}
  this.autoAim = true
  this.gemsAvail = 0
  this.run = null
  this.floorData = null
  this.room = null
  this.rows = null
  this.roomW = 0
  this.roomH = 0
  this.worldW = 0
  this.worldH = 0
  this.player = null
  this.enemies = []
  this.bullets = []
  this.pickups = []
  this.effects = []
  this.floats = []
  this.chests = []
  this.npcs = []
  this.statue = null
  this.portal = null
  this.turret = null
  this.doors = []
  this.doorTiles = {}
  this.camX = 0
  this.camY = 0
  this.shake = 0
  this.moveX = 0
  this.moveY = 0
  this.firing = false
  this.modded = false
  this.mods = {
    damageMul: 1, fireRateMul: 1, speedMul: 1, rangeMul: 1,
    pierceAdd: 0, bounceAdd: 0, elementAdd: '', lifesteal: 0,
    killHeal: 0, killEnergy: 0, coinMul: 1, gemMul: 1, shopDiscount: 0,
    magnetAdd: 0, skillHaste: 0, armorRegenMul: 1, thorns: 0, reviveExtra: 0
  }
  this.ownedBuffs = []
  this.buffOptions = []
  this.buffSource = ''
  this.shop = null
  this.reviveInfo = null
  this.interactInfo = null
  this.damageDealt = 0
  this.damageTaken = 0
  this.killCount = 0
  this._doorCooldown = 0
  this._hudCache = null
  this._hudT = 0
  this._pendingEnd = null
  this._uiPulse = 0
}

/* ---------------- 视口 / 画布 ---------------- */

Game.prototype.setCanvasPixels = function (w, h) {
  var W = Number(w) || 0
  var H = Number(h) || 0
  if (W > 0 && H > 0) { this.canvasPxW = W; this.canvasPxH = H }
}

Game.prototype.setViewport = function (w, h) {
  var W = Number(w) || 0
  var H = Number(h) || 0
  if (W > 0) this.viewW = W
  if (H > 0) this.viewH = H
}

Game.prototype._sfx = function (name) {
  try { if (this.hooks && this.hooks.sfx) this.hooks.sfx(name) } catch (e) {}
}

/* ---------------- 开局 / 楼层 ---------------- */

Game.prototype.startRun = function (opts) {
  opts = opts || {}
  var cid = opts.characterId || 'knight'
  var ch = characterById(cid) || characterById('knight')
  if (!ch) ch = { id: 'knight', name: '骑士', starterWeapon: 'pistol', hp: 7, armor: 6, energy: 140, crit: 5, speed: 1, skill: { cd: 12 } }
  var stats = charStats(ch.id, opts.upgrades || {})
  var _skillChoice = Math.floor(Number(opts.skillChoice) || 0)
  if (_skillChoice < 0 || _skillChoice > 2) _skillChoice = 0
  var _baseSkill = ch.skill || { id: 'dual_wield', name: '技能', cd: 12 }
  var _wikiSkill = ch.wikiSkillData && ch.wikiSkillData[_skillChoice]
  var _chosenSkill = _baseSkill
  if (_wikiSkill) {
    _chosenSkill = {
      id: (_skillChoice === 0) ? _baseSkill.id : ((ch.wikiSkillForms && ch.wikiSkillForms[_skillChoice]) || _baseSkill.id),
      name: _wikiSkill.name || _baseSkill.name,
      desc: _wikiSkill.desc || _baseSkill.desc || '',
      cd: (typeof _wikiSkill.cooldown === 'number') ? _wikiSkill.cooldown : _baseSkill.cd
    }
    var _tune = ch.wikiSkillTuning && ch.wikiSkillTuning[_skillChoice]
    if (_tune) {
      if (typeof _tune.duration === 'number') _chosenSkill.duration = _tune.duration
      if (typeof _tune.radius === 'number') _chosenSkill.radius = _tune.radius
      if (typeof _tune.arrows === 'number') _chosenSkill.arrows = _tune.arrows
      if (typeof _tune.chains === 'number') _chosenSkill.chains = _tune.chains
      if (_tune.element) _chosenSkill.element = _tune.element
    }
  }
  var seed = Number(opts.seed) || Date.now()
  this.rng = makeRng(seed)
  this.settings = opts.settings || {}
  this.debugInvincible = !!this.settings.debugInvincible
  this.debugInfinite = !!this.settings.debugInfiniteCurrency
  this.autoAim = this.settings.autoAim !== false
  this.gemsAvail = (typeof opts.gems === 'number') ? opts.gems : START_GEMS
  if (this.debugInfinite) this.gemsAvail = 999999
  this.damageDealt = 0
  this.damageTaken = 0
  this.killCount = 0
  this.ownedBuffs = []
  this.mods = {
    damageMul: 1, fireRateMul: 1, speedMul: 1, rangeMul: 1,
    pierceAdd: 0, bounceAdd: 0, elementAdd: '', lifesteal: 0,
    killHeal: 0, killEnergy: 0, coinMul: 1, gemMul: 1, shopDiscount: 0,
    magnetAdd: 0, skillHaste: 0, armorRegenMul: 1, thorns: 0, reviveExtra: 0
  }
  this.run = {
    seed: seed,
    characterId: ch.id,
    characterName: ch.name,
    chapter: 1,
    chapterName: CHAPTERS[0].name,
    floorIndex: 0,
    floorInChapter: 0,
    roomsCleared: 0,
    kills: 0,
    bossKills: 0,
    coins: this.debugInfinite ? 999999 : 0,
    gemsCollected: 0,
    revives: 0,
    startTime: Date.now(),
    weaponIds: [],
    buffIds: []
  }
  var w0 = makeWeaponState(ch.starterWeapon) || makeWeaponState('pistol')
  this.player = {
    x: 0, y: 0, r: 11,
    hp: stats.maxHp, maxHp: stats.maxHp,
    armor: stats.maxArmor, maxArmor: stats.maxArmor,
    energy: stats.maxEnergy, maxEnergy: stats.maxEnergy,
    crit: stats.crit, speedMul: stats.speed || 1,
    skillCdMul: stats.skillCdMul || 1,
    skill: _chosenSkill,
    passive: ch.passive || '',
    passiveType: ch.passiveType || '',
    facing: 1, aimX: 1, aimY: 0,
    weapons: [w0, null],
    activeSlot: 0,
    fireCd: 0, invuln: 0, skillCd: 0, skillCdMax: (ch.skill && ch.skill.cd) || 12,
    hitFlash: 0, walkT: 0, moving: false,
    statuses: { burn: 0, poison: 0, freeze: 0, burnTick: 0, poisonTick: 0 },
    armorRegenT: 0, dead: false, reviveUsed: false,
    dualWieldT: 0, rollT: 0, rollVX: 0, rollVY: 0,
    energyWarnT: 0
  }
  this.player.skillCdMax = this.player.skillCdMax * (this.player.skillCdMul || 1)
  if (w0) this.run.weaponIds.push(w0.id)
  var _passiveBuff = WIKI_PASSIVE_BUFF[ch.id] || WIKI_PASSIVE_BUFF2[ch.id]
  if (_passiveBuff && buffById(_passiveBuff)) this._applyBuff(_passiveBuff)
  /* 4 大关各随机一个维基场景；同一大关 5 小关共用 */
  this.run.sceneByChapter = {}
  for (var _ci = 0; _ci < CHAPTERS.length; _ci++) {
    var _ch = CHAPTERS[_ci]
    if (!_ch.scenes || !_ch.scenes.length) continue
    var _sc = _ch.scenes[Math.floor(this.rng() * _ch.scenes.length)]
    if (_sc) {
      this.run.sceneByChapter[_ch.id] = {
        id: _sc.id, name: _sc.name, theme: _sc.theme,
        enemyPool: _sc.enemyPool, boss: _sc.boss
      }
    }
  }
  var _ch1 = this.run.sceneByChapter[1]
  if (_ch1) {
    this.run.sceneId = _ch1.id
    this.run.sceneName = _ch1.name
    this.run.sceneTheme = _ch1.theme
    this.run.enemyPool = _ch1.enemyPool
    this.run.bossId = _ch1.boss
  }
  var _pt = this.player.passiveType
  if (_pt === 'hp') { this.player.maxHp += 1; this.player.hp += 1 }
  else if (_pt === 'armor') this.player.maxArmor += 1
  else if (_pt === 'energy') this.player.maxEnergy += 20
  else if (_pt === 'crit') this.player.crit += 3
  else if (_pt === 'move') this.player.speed *= 1.05
  else if (_pt === 'skill') this.player.skillCdMax *= 0.9
  var _petDef = petById(this.settings.petId) || PETS[PET_ORDER[this.run.seed % PET_ORDER.length]] || PETS[PET_ORDER[0]]
  this.pet = { def: _petDef, x: this.player.x - 22, y: this.player.y + 10, cd: 0.6, r: 8 }
  this.state = 'playing'
  this.paused = false
  this.ended = false
  this.time = 0
  this.stateT = 0
  this.loadFloor(1)
}

/* ---------------- 局内存档 ---------------- */
/* 以「本层起点」为检查点：保存当前运行数据、角色比例、武器与天赋；
 * 恢复时用同一 seed 重新生成同一层，再回到本层入口。
 * 不清空当前地图的探索细节（房间探索会在本层重新开始），但角色成长/资源保留。 */
Game.prototype.checkpoint = function () {
  if (!this.run || !this.player || this.ended) return null
  var p = this.player
  var weapons = []
  for (var i = 0; i < p.weapons.length; i++) weapons.push(p.weapons[i] ? p.weapons[i].id : null)
  var buffs = []
  for (var b = 0; b < this.ownedBuffs.length; b++) {
    buffs.push({ id: this.ownedBuffs[b].id, stacks: this.ownedBuffs[b].stacks || 1 })
  }
  return {
    v: 1,
    ts: Date.now(),
    characterId: this.run.characterId,
    seed: this.run.seed,
    floorIndex: this.run.floorIndex,
    hpRatio: p.maxHp > 0 ? (p.hp / p.maxHp) : 1,
    armorRatio: p.maxArmor > 0 ? (p.armor / p.maxArmor) : 1,
    energyRatio: p.maxEnergy > 0 ? (p.energy / p.maxEnergy) : 1,
    weapons: weapons,
    activeSlot: p.activeSlot || 0,
    buffs: buffs,
    coins: this.run.coins || 0,
    gemsCollected: this.run.gemsCollected || 0,
    kills: this.run.kills || 0,
    bossKills: this.run.bossKills || 0,
    revives: this.run.revives || 0,
    roomsCleared: this.run.roomsCleared || 0,
    scenes: this.run.sceneByChapter || null
  }
}

Game.prototype.resumeRun = function (snap, opts) {
  if (!snap || !snap.seed || !snap.characterId) return false
  opts = opts || {}
  this._suppressCheckpoint = true
  try {
    this.startRun({
      characterId: snap.characterId,
      upgrades: opts.upgrades || {},
      seed: snap.seed,
      gems: opts.gems,
      settings: opts.settings
    })
    var r = this.run
    if (snap.scenes) r.sceneByChapter = snap.scenes
    r.coins = Number(snap.coins) || 0
    r.gemsCollected = Number(snap.gemsCollected) || 0
    r.kills = Number(snap.kills) || 0
    r.bossKills = Number(snap.bossKills) || 0
    r.revives = Number(snap.revives) || 0
    r.roomsCleared = Number(snap.roomsCleared) || 0
    var bs = snap.buffs || []
    for (var i = 0; i < bs.length; i++) {
      var stacks = Math.max(1, Number(bs[i].stacks) || 1)
      for (var s = 0; s < stacks; s++) this._applyBuff(bs[i].id)
    }
    var ws = snap.weapons || []
    var p = this.player
    p.weapons = [null, null]
    p.weaponIds = []
    for (var w = 0; w < 2; w++) {
      if (ws[w]) {
        var st = makeWeaponState(ws[w])
        if (st) { p.weapons[w] = st; r.weaponIds.push(ws[w]) }
      }
    }
    if (!p.weapons[0] && !p.weapons[1]) {
      var starter = makeWeaponState(characterById(snap.characterId).starterWeapon || 'pistol')
      p.weapons[0] = starter
      if (starter) r.weaponIds.push(starter.id)
    }
    p.activeSlot = (snap.activeSlot === 1 && p.weapons[1]) ? 1 : 0
    this.loadFloor(Math.max(1, Math.min(FLOOR_COUNT, Number(snap.floorIndex) || 1)))
    p.hp = Math.max(1, Math.round(p.maxHp * (Number(snap.hpRatio) || 0.6)))
    p.armor = Math.max(0, Math.round(p.maxArmor * (Number(snap.armorRatio) || 1)))
    p.energy = Math.max(0, Math.round(p.maxEnergy * (Number(snap.energyRatio) || 1)))
    p.invuln = 1.2
    this.state = 'playing'
    this.stateT = 0
    this._suppressCheckpoint = false
    return true
  } catch (e) {
    this._suppressCheckpoint = false
    return false
  }
}

Game.prototype.loadFloor = function (n) {  if (n > FLOOR_COUNT) n = FLOOR_COUNT
  var chapterIndex = Math.ceil(n / 5)
  if (chapterIndex > CHAPTERS.length) chapterIndex = CHAPTERS.length
  var chapter = CHAPTERS[chapterIndex - 1]
  var floorInChapter = ((n - 1) % 5) + 1
  this.run.floorIndex = n
  this.run.chapter = chapterIndex
  var chosenScene = this.run.sceneByChapter && this.run.sceneByChapter[chapter.id]
  if (chosenScene) {
    this.run.sceneId = chosenScene.id
    this.run.sceneName = chosenScene.name
    this.run.sceneTheme = chosenScene.theme
    var _sceneThemeMap = {
      ruins: 'ruins', mech_ruins: 'mech', castle: 'ruins', underground_castle: 'ruins',
      odd_city: 'mech', witch_forest: 'forest', volcano: 'volcano', alien_base: 'alien',
      mud_island: 'mech', stone_ruins: 'ruins', ancient_battlefield: 'desert', seabed: 'seabed'
    }
    if (_sceneThemeMap[chosenScene.id]) this.run.sceneTheme = _sceneThemeMap[chosenScene.id]
    var _sceneBosses = {
      castle: ['great_wizard', 'great_knight'],
      underground_castle: ['skeleton_king', 'vc_mecha'],
      witch_forest: ['ghost_king', 'headless_knight'],
      odd_city: ['mechanical_queen', 'mechanical_emperor'],
      volcano: ['volcano_sandworm', 'flying_dragon_cub', 'anubis'],
      alien_base: ['wacken_leader', 'colossus_zulan', 'laser_ufo_boss'],
      mud_island: ['pirate_king', 'steel_wave_breaker'],
      stone_ruins: ['stone_ancestor_arm', 'stone_fog_dragon', 'stone_ancestor'],
      ancient_battlefield: ['hua_xiong', 'li_jue', 'dong_zhuo', 'final_weapon_01']
    }
    var _bossList = _sceneBosses[chosenScene.id] || [chosenScene.boss]
    this.run.bossId = _bossList[(this.run.seed + chapterIndex) % _bossList.length]
    this.run.enemyPool = chosenScene.enemyPool
    this.run.chapterName = chosenScene.name
    var _mod = SCENE_MODS[chosenScene.id] || null
    this.run.sceneMod = _mod
    this.run.sceneHazardT = _mod && _mod.hazardCd ? _mod.hazardCd : 0
    this.run.sceneOxygen = _mod && _mod.oxygen ? _mod.oxygen : 0
    if (this.player) this.player.sceneSpeedMul = (_mod && _mod.speedMul) ? _mod.speedMul : 1
  } else {
    this.run.chapterName = chapter.name
    this.run.sceneTheme = chapter.theme
    this.run.enemyPool = chapter.enemyPool
    this.run.bossId = chapter.boss
    this.run.sceneMod = null
    this.run.sceneHazardT = 0
    this.run.sceneOxygen = 0
    if (this.player) this.player.sceneSpeedMul = 1
  }
  this.run.floorInChapter = floorInChapter
  var seed = (this.run.seed + n * 7919) >>> 0
  this.floorData = generateFloor({
    chapter: chapterIndex,
    floorIndex: n,
    floorInChapter: floorInChapter,
    seed: seed,
    difficulty: n
  })
  this._enterRoom(this.floorData.startKey, null, true)
  this.state = 'floor_intro'
  this.stateT = 0
  this._sfx('portal')
}

/* ---------------- 房间 ---------------- */

Game.prototype._enterRoom = function (key, fromDir, isStart) {
  var room = this.floorData && this.floorData.rooms[key]
  if (!room) return false
  this.room = room
  room.visited = true
  if (!room.openedChests) room.openedChests = {}
  this.roomW = room.w
  this.roomH = room.h
  this.worldW = room.w * TILE
  this.worldH = room.h * TILE
  this.enemies = []
  this.bullets = []
  this.pickups = []
  this.effects = []
  this.floats = []
  this.chests = []
  this.npcs = []
  this.statue = null
  this.portal = null
  this.turret = null
  this.doors = []
  this.doorTiles = {}
  this.interactInfo = null
  this._doorCooldown = 0.5
  /* rows 转为可变二维字符数组 */
  var rows = []
  var y, x
  for (y = 0; y < room.h; y++) {
    var src = room.rows[y] || ''
    var line = []
    for (x = 0; x < room.w; x++) line.push(src.charAt(x) || '#')
    rows.push(line)
  }
  this.rows = rows
  /* 解析门 / 道具 / NPC / 出生点 */
  for (y = 0; y < room.h; y++) {
    for (x = 0; x < room.w; x++) {
      var ch = rows[y][x]
      var px = x * TILE + TILE / 2
      var py = y * TILE + TILE / 2
      if (ch === 'D') {
        var dir = 'up'
        if (y === room.h - 1) dir = 'down'
        else if (x === 0) dir = 'left'
        else if (x === room.w - 1) dir = 'right'
        var door = {
          tx: x, ty: y, x: px, y: py, dir: dir,
          open: !!room.cleared,
          target: this._neighborKey(room, dir)
        }
        this.doors.push(door)
        this.doorTiles[x + ',' + y] = door
      } else if (ch === 'c') {
        this._addChest(px, py, 'crate', 22)
        rows[y][x] = '.'
      } else if (ch === 'b') {
        this._addChest(px, py, 'barrel', 22)
        rows[y][x] = '.'
      } else if (ch === 'C') {
        this._addChest(px, py, 'wood', 24)
        rows[y][x] = '.'
      } else if (ch === 'G') {
        this._addChest(px, py, 'gold', 24)
        rows[y][x] = '.'
      } else if (ch === 'S') {
        this.npcs.push({ kind: 'shop', x: px, y: py, w: 22, h: 26 })
        rows[y][x] = '.'
      } else if (ch === 'T') {
        this.statue = { x: px, y: py, w: 22, h: 28, used: !!room.statueUsed }
        rows[y][x] = '.'
      } else if (ch === 't') {
        rows[y][x] = '.'
        this.effects.push({ type: 'torch', x: px, y: py, life: 999, t: 0 })
      }
    }
  }
  /* 玩家位置 */
  var spawnX = this.worldW / 2
  var spawnY = this.worldH / 2
  if (isStart && room.spawn && room.spawn.player) {
    spawnX = room.spawn.player.x * TILE + TILE / 2
    spawnY = room.spawn.player.y * TILE + TILE / 2
  } else if (fromDir) {
    var wantDir = OPPOSITE[fromDir] || 'down'
    var door = null
    for (var di = 0; di < this.doors.length; di++) {
      if (this.doors[di].dir === wantDir) { door = this.doors[di]; break }
    }
    if (door) {
      var inward = DIR_VEC[OPPOSITE[wantDir]] || DIR_VEC.up
      spawnX = door.x + inward.x * TILE * 1.6
      spawnY = door.y + inward.y * TILE * 1.6
    }
  }
  this.player.x = spawnX
  this.player.y = spawnY
  this.player.hp = Math.max(1, this.player.hp)
  this.player.dead = false
  /* 敌人 */
  if (!room.cleared) this._populateRoom(room, isStart)
  else if (room.type === ROOM.boss.id && room.portalSpawned) this._spawnPortal()
  /* 门开合 */
  for (var d2 = 0; d2 < this.doors.length; d2++) this.doors[d2].open = !!room.cleared
  /* 相机 / BGM / 首屏提示 */
  this._snapCamera()
  this._sfx('portal')
  if (room.type === ROOM.boss.id && !room.cleared) this._sfx('boss_roar')
  return true
}

Game.prototype._neighborKey = function (room, dir) {
  var gx = room.gx + DIR_VEC[dir].x
  var gy = room.gy + DIR_VEC[dir].y
  return gx + ',' + gy
}

Game.prototype._sceneEnemyPool = function (chapter) {
  var c = CHAPTERS[chapter - 1]
  if (c && c.scenes && c.scenes.length && c.scenes[0].enemyPool) return c.scenes[0].enemyPool
  return (c && c.enemyPool) ? c.enemyPool : ['slime']
}

Game.prototype._pickSceneEnemy = function (pool) {
  if (!pool || !pool.length) return 'slime'
  var total = 0
  var i
  for (i = 0; i < pool.length; i++) total += (WIKI_ENEMY_WEIGHT[pool[i]] || 1)
  var r = this.rng() * total
  for (i = 0; i < pool.length; i++) {
    r -= (WIKI_ENEMY_WEIGHT[pool[i]] || 1)
    if (r <= 0) return pool[i]
  }
  return pool[pool.length - 1]
}

Game.prototype._populateRoom = function (room, isStart) {
  var self = this
  var chapter = this.run.chapter
  var floorIndex = this.run.floorIndex
  if (room.type === ROOM.start.id) {
    /* 第一间也刷怪（元气骑士式开局）：清空后门才会开，避免玩家一进图只看到空房间 */
    var pool0 = this.run.enemyPool || this._sceneEnemyPool(chapter)
    var startCount = 3 + (floorIndex >= 4 ? 1 : 0)
    for (var si = 0; si < startCount; si++) {
      var sp = this._randomOpenPos(150)
      if (!sp) sp = { x: this.worldW / 2, y: this.worldH / 2 }
      this._spawnEnemy(this._pickSceneEnemy(pool0), sp.x, sp.y, {})
    }
    return
  }
  if (room.type === ROOM.boss.id) {
    /* 维基结构：每大关第 5 小关才是首领房，其余小关的终点是传送门房 */
    if (this.run.floorInChapter !== 5) {
      room.cleared = true
      this._spawnPortal()
      return
    }
    var bossId = this.run.bossId || floorBoss(chapter)
    var bdef = bossById(bossId)
    var bp = room.bossPoint || { x: Math.floor(room.w / 2), y: 3 }
    if (bdef) this._spawnEnemy(bdef.id, bp.x * TILE + TILE / 2, bp.y * TILE + TILE / 2, { boss: true })
    return
  }
  if (room.type === ROOM.shop.id || room.type === ROOM.treasure.id || room.type === ROOM.statue.id) {
    /* 商店/宝箱/雕像不是强制战斗房：不刷怪，直接视为已清（门可通行） */
    room.cleared = true
    return
  }
  var wave = spawnWave(this.rng, chapter, floorIndex, room.type)
  if (!wave || !wave.length) {
    wave = []
    var pool = this.run.enemyPool || this._sceneEnemyPool(chapter)
    var count = 2 + Math.min(5, Math.floor(floorIndex / 2))
    for (var wi = 0; wi < count; wi++) wave.push({ id: this._pickSceneEnemy(pool), elite: false })
  }
  if (room.type === ROOM.elite.id && wave.length) wave[0].elite = true
  if (room.type === ROOM.battle.id && wave.length && floorIndex >= 2 && this.rng() < 0.15) {
    var _cand = []
    for (var _wi = 0; _wi < wave.length; _wi++) {
      var _ed = enemyById(wave[_wi].id)
      if (_ed && _ed.eliteHp) _cand.push(_wi)
    }
    if (_cand.length) wave[_cand[Math.floor(this.rng() * _cand.length)]].elite = true
  }
  var points = (room.enemyPoints && room.enemyPoints.length) ? room.enemyPoints : null
  if (room.type === ROOM.elite.id && room.elitePoints && room.elitePoints.length) {
    points = [room.elitePoints[0]].concat(points || [])
  }
  var _scenePool = this.run.enemyPool || this._sceneEnemyPool(chapter)
  if (_scenePool && _scenePool.length) {
    for (var wi = 0; wi < wave.length; wi++) wave[wi].id = this._pickSceneEnemy(_scenePool)
  }
  for (var i = 0; i < wave.length; i++) {
    var pos = null
    if (points && i < points.length) pos = { x: points[i].x * TILE + TILE / 2, y: points[i].y * TILE + TILE / 2 }
    if (!pos) pos = this._randomOpenPos(120)
    if (!pos) pos = { x: this.worldW / 2, y: this.worldH / 2 }
    this._spawnEnemy(wave[i].id, pos.x, pos.y, { elite: !!wave[i].elite })
  }
  return self
}

/* ---------------- 更新 ---------------- */

Game.prototype._updateSceneHazard = function (dt) {
  var run = this.run
  var p = this.player
  var mod = run && run.sceneMod
  if (!mod || !p || p.dead) return
  if (mod.oxygen) {
    run.sceneOxygen -= dt
    if (run.sceneOxygen > 0) return
  }
  if (!mod.hazardCd) return
  run.sceneHazardT -= dt
  if (run.sceneHazardT > 0) return
  run.sceneHazardT = mod.hazardCd
  var hx = p.x
  var hy = p.y
  if (mod.hazardType === 'cannon') {
    var side = this.rng() < 0.5 ? -1 : 1
    var sx = p.x + side * 420
    var sy = p.y - 220 + this.rng() * 200
    var ang = Math.atan2(p.y - sy, p.x - sx)
    this._spawnBullet(sx, sy, Math.cos(ang), Math.sin(ang), {
      owner: 'enemy', dmg: mod.hazardDmg || 1, speed: 260, life: 3,
      size: 8, color: mod.hazardElement && ELEMENT[mod.hazardElement] ? ELEMENT[mod.hazardElement].color : '#ff8a8a',
      element: mod.hazardElement || ''
    })
    this._addFloat(p.x, p.y - 40, mod.label || '城防炮', '#ff8a8a')
    return
  }
  if (mod.hazardType === 'rocks') {
    for (var ri = 0; ri < 2; ri++) {
      var rx = p.x + (this.rng() - 0.5) * 120
      var ry = p.y - 180 - this.rng() * 40
      this.effects.push({ type: 'ring', x: rx, y: p.y, r: 26, life: 0.4, maxLife: 0.4, color: '#ffb86b' })
      this._spawnBullet(rx, ry, 0, 1, {
        owner: 'enemy', dmg: mod.hazardDmg || 1, speed: 380, life: 1.4,
        size: 9, color: '#ffb86b', element: mod.hazardElement || '', explodeRadius: 38
      })
    }
    this._addFloat(p.x, p.y - 40, mod.label || '落石', '#ffb86b')
    return
  }
  if (mod.hazardType === 'fog') {
    this.effects.push({ type: 'ring', x: p.x, y: p.y, r: 70, life: 0.8, maxLife: 0.8, color: '#7ee787' })
    this._addParticles(p.x, p.y, '#7ee787', 8, 90)
  }
  this._damagePlayer(mod.hazardDmg || 1, p.x, p.y, mod.hazardElement || '')
  this._addFloat(p.x, p.y - 40, mod.label || '环境伤害', '#ff6b4a')
}

Game.prototype._updatePet = function (dt) {
  var pet = this.pet
  var p = this.player
  if (!pet || !p || p.dead) return
  pet.cd -= dt
  var tx = p.x - p.facing * 24
  var ty = p.y + 8
  pet.x += (tx - pet.x) * Math.min(1, dt * 8)
  pet.y += (ty - pet.y) * Math.min(1, dt * 8)
  var target = this._nearestEnemy(pet.x, pet.y, pet.def.range || 300)
  if (target && pet.cd <= 0) {
    pet.cd = pet.def.cd || 1.5
    var ang = Math.atan2(target.y - pet.y, target.x - pet.x)
    this._spawnBullet(pet.x, pet.y, Math.cos(ang), Math.sin(ang), {
      owner: 'player', dmg: (pet.def.dmg || 2) + Math.floor((this.run.floorIndex || 1) / 5),
      speed: 420, life: 0.9, size: 5, color: pet.def.color || '#ffd93d',
      pierce: 0, bounce: 0, knock: 20, element: ''
    })
    this._addParticles(pet.x, pet.y, pet.def.color || '#ffd93d', 3, 80)
  }
}

Game.prototype.update = function (dtMs) {
  var dt = Number(dtMs) || 0
  if (dt > 100) dt = 100
  if (dt < 0) dt = 0
  dt = dt / 1000
  if (this.paused || this.ended) return
  this.time += dt
  this.stateT += dt
  if (this._doorCooldown > 0) this._doorCooldown -= dt
  this._uiPulse += dt

  /* 弹窗类状态只推进特效动画 */
  if (this.state === 'buff_choice' || this.state === 'shop' || this.state === 'revive') {
    this._updateEffects(dt)
    this._updateFloats(dt)
    this._updateCamera(dt)
    return
  }
  if (this.state === 'floor_intro') {
    this._updateEffects(dt)
    this._updateFloats(dt)
    this._updateCamera(dt)
    if (this.stateT >= 1.25) { this.state = 'playing'; this.stateT = 0 }
    return
  }
  if (this.state !== 'playing') return

  this._updatePlayer(dt)
  this._updatePet(dt)
  this._updateSceneHazard(dt)
  this._updateWeapons(dt)
  this._updateEnemies(dt)
  this._updateBullets(dt)
  this._updatePickups(dt)
  this._updateTurret(dt)
  this._updateEffects(dt)
  this._updateFloats(dt)
  this._checkRoomClear()
  this._checkDoorTransition()
  this._checkPortalTouch()
  this._updateInteract()
  this._updateCamera(dt)
  /* 玩家死亡（由 combat._onPlayerDeath 设置 state） */
  if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 22)
}

Game.prototype.pause = function () { this.paused = true }
Game.prototype.resume = function () { this.paused = false; this.stateT = this.stateT }

Game.prototype._updateCamera = function (dt) {
  if (!this.player) return
  var tx = this.player.x - this.viewW / 2
  var ty = this.player.y - this.viewH / 2
  var maxX = this.worldW - this.viewW
  var maxY = this.worldH - this.viewH
  if (maxX < 0) tx = maxX / 2
  else { if (tx < 0) tx = 0; if (tx > maxX) tx = maxX }
  if (maxY < 0) ty = maxY / 2
  else { if (ty < 0) ty = 0; if (ty > maxY) ty = maxY }
  var k = (dt <= 0) ? 1 : Math.min(1, dt * 9)
  this.camX += (tx - this.camX) * k
  this.camY += (ty - this.camY) * k
}

Game.prototype._snapCamera = function () {
  if (!this.player) return
  var tx = this.player.x - this.viewW / 2
  var ty = this.player.y - this.viewH / 2
  var maxX = this.worldW - this.viewW
  var maxY = this.worldH - this.viewH
  if (maxX < 0) tx = maxX / 2
  else { if (tx < 0) tx = 0; if (tx > maxX) tx = maxX }
  if (maxY < 0) ty = maxY / 2
  else { if (ty < 0) ty = 0; if (ty > maxY) ty = maxY }
  this.camX = tx
  this.camY = ty
}

/* ---------------- 房间状态 ---------------- */

Game.prototype._checkRoomClear = function () {
  var room = this.room
  if (!room || room.cleared) return
  if (this.player && this.player.dead) return
  if (this.aliveEnemyCount() > 0) return
  this._clearRoom()
}

Game.prototype._clearRoom = function () {
  var room = this.room
  room.cleared = true
  this.run.roomsCleared += 1
  for (var i = 0; i < this.doors.length; i++) this.doors[i].open = true
  var isBoss = room.type === ROOM.boss.id
  if (isBoss) {
    this.run.bossKills += 1
    this._spawnBossReward()
    this._spawnPortal()
    this.buffOptions = rollBuffs(this.rng, this.run.floorIndex, this.ownedBuffIds(), 3)
    this.buffSource = 'boss'
    if (this.buffOptions.length) {
      this.state = 'buff_choice'
      this.stateT = 0
    }
    this._sfx('win')
  } else {
    this._spawnRoomReward()
    this._sfx('chest')
  }
}

Game.prototype._spawnRoomReward = function () {
  var self = this
  var drops = roomReward(this.rng, this.run.floorIndex, this.room.type)
  var cx = this.room.w * TILE / 2
  var cy = this.room.h * TILE / 2
  for (var i = 0; i < drops.length; i++) {
    var d = drops[i]
    if (!d) continue
    var ang = this.rng() * Math.PI * 2
    var rad = 20 + this.rng() * 50
    this._spawnPickup(d.kind, d.id, cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad, d.count || 1)
  }
  return self
}

Game.prototype._spawnBossReward = function () {
  var cx = this.portal ? this.portal.x : this.worldW / 2
  var cy = this.portal ? this.portal.y : this.worldH / 2
  var i
  for (i = 0; i < 10; i++) {
    var ang = this.rng() * Math.PI * 2
    var rad = 24 + this.rng() * 60
    this._spawnPickup('coin', 'coin', cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad, 1)
  }
  for (i = 0; i < 3; i++) {
    var a2 = this.rng() * Math.PI * 2
    this._spawnPickup('gem', 'gem', cx + Math.cos(a2) * 40, cy + Math.sin(a2) * 40, 1)
  }
  var chapter = CHAPTERS[this.run.chapter - 1]
  var wid = (this._lastBossDef && (WIKI_BOSS_RED_FULL[this._lastBossDef.id] || WIKI_BOSS_RED[this._lastBossDef.id] || WIKI_BOSS_RED_EXTRA[this._lastBossDef.id])) || pick(this.rng, ['sniper', 'rocket_launcher', 'great_axe', 'fire_staff', 'assault_rifle'])
  this._spawnPickup('weapon', wid, cx + 24, cy + 20, 1)
  return chapter
}

Game.prototype._spawnPortal = function () {
  var room = this.room
  var bp = room.bossPoint || { x: Math.floor(room.w / 2), y: 2 }
  this.portal = {
    x: bp.x * TILE + TILE / 2,
    y: bp.y * TILE + TILE / 2 + (room.type === ROOM.boss.id ? TILE * 1.4 : 0),
    w: 30, h: 40, t: 0
  }
  room.portalSpawned = true
  this.portal.y = Math.max(TILE * 1.6, Math.min(this.worldH - TILE * 1.6, this.portal.y))
}

/* ---------------- 门 / 楼层 ---------------- */

Game.prototype._checkDoorTransition = function () {
  if (this._doorCooldown > 0 || !this.room || !this.room.cleared) return
  var p = this.player
  if (!p) return
  var tx = Math.floor(p.x / TILE)
  var ty = Math.floor(p.y / TILE)
  var door = this.doorTiles[tx + ',' + ty]
  if (!door || !door.open || !door.target) return
  var c = this._tileCenter(tx, ty)
  var dx = p.x - c.x
  var dy = p.y - c.y
  if (dx * dx + dy * dy > 18 * 18) return
  var targetRoom = this.floorData.rooms[door.target]
  if (!targetRoom) return
  this._enterRoom(door.target, door.dir === 'up' ? 'up' : (door.dir === 'down' ? 'down' : (door.dir === 'left' ? 'left' : 'right')), false)
  this.state = 'playing'
  this.stateT = 0
}

Game.prototype._usePortal = function () {
  if (!this.portal) return
  this._sfx('portal')
  if (this.run.floorIndex >= FLOOR_COUNT) {
    this._endRun('victory')
    return
  }
  this.loadFloor(this.run.floorIndex + 1)
}

/* 当前应引导的出口：Boss 房优先传送门，普通房找最近的已开门 */
Game.prototype.exitGuide = function () {
  var p = this.player
  if (!p) return null
  if (this.portal) return { x: this.portal.x, y: this.portal.y, label: '传送门', kind: 'portal' }
  var best = null
  var bestD = Infinity
  for (var i = 0; i < this.doors.length; i++) {
    var d = this.doors[i]
    if (!d.open || !d.target) continue
    var dx = d.x - p.x
    var dy = d.y - p.y
    var dist = dx * dx + dy * dy
    if (dist < bestD) { bestD = dist; best = d }
  }
  if (!best) return null
  return { x: best.x, y: best.y, label: '出口', kind: 'door' }
}

/* 走上传送门自动进入（Boss 房清空后才会生成） */
Game.prototype._checkPortalTouch = function () {
  if (!this.portal || !this.player || this.state !== 'playing') return
  var dx = this.player.x - this.portal.x
  var dy = this.player.y - this.portal.y
  if (dx * dx + dy * dy < 30 * 30) this._usePortal()
}

/* ---------------- 输入 ---------------- */

Game.prototype.setMove = function (dx, dy) {
  var x = Number(dx) || 0
  var y = Number(dy) || 0
  if (x < -1) x = -1
  if (x > 1) x = 1
  if (y < -1) y = -1
  if (y > 1) y = 1
  var len = Math.sqrt(x * x + y * y)
  if (len > 1) { x /= len; y /= len }
  this.moveX = x
  this.moveY = y
}

Game.prototype.setFire = function (v) { this.firing = !!v }

Game.prototype.toggleAutoAim = function () {
  this.autoAim = !this.autoAim
  return this.autoAim
}

Game.prototype.pressSkill = function () {
  if (this.state !== 'playing' || !this.player || this.player.dead) return false
  var p = this.player
  if (p.skillCd > 0) return false
  var ok = castSkill(this)
  if (ok) {
    p.skillCd = p.skillCdMax * (1 - (this.mods.skillHaste || 0))
    if (p.skillCd < 1) p.skillCd = 1
    this._sfx('skill')
  }
  return !!ok
}

Game.prototype.pressSwap = function () {
  if (!this.player) return false
  var p = this.player
  if (!p.weapons[1]) return false
  var now = Date.now()
  if (this._swapT && now - this._swapT < 220) return false
  this._swapT = now
  p.activeSlot = p.activeSlot === 0 ? 1 : 0
  p.fireCd = 0
  this._sfx('reload')
  return true
}

Game.prototype.pressInteract = function () {
  if (this.state !== 'playing') return false
  this._updateInteract()
  var it = this.interactInfo
  if (!it) return false
  if (it.kind === 'chest') return this._openChest(it.target)
  if (it.kind === 'weapon') return this._takeWeapon(it.target)
  if (it.kind === 'shop') return this._openShop()
  if (it.kind === 'statue') return this._openStatue()
  if (it.kind === 'portal') { this._usePortal(); return true }
  return false
}

/* ---------------- 交互 ---------------- */

Game.prototype._updateInteract = function () {
  var p = this.player
  var best = null
  var bestD = INTERACT_RANGE * INTERACT_RANGE
  var i
  for (i = 0; i < this.chests.length; i++) {
    var c = this.chests[i]
    if (c.opened) continue
    var d = (c.x - p.x) * (c.x - p.x) + (c.y - p.y) * (c.y - p.y)
    if (d < bestD) {
      bestD = d
      best = { kind: 'chest', target: c, label: c.kind === 'gold' ? '开启金宝箱' : (c.kind === 'wood' ? '开启宝箱' : '破坏箱子') }
    }
  }
  for (i = 0; i < this.pickups.length; i++) {
    var pk = this.pickups[i]
    if (pk.kind !== 'weapon') continue
    var d2 = (pk.x - p.x) * (pk.x - p.x) + (pk.y - p.y) * (pk.y - p.y)
    if (d2 < bestD) {
      bestD = d2
      best = { kind: 'weapon', target: pk, label: '拾取 ' + (pk.name || '武器') }
    }
  }
  for (i = 0; i < this.npcs.length; i++) {
    var n = this.npcs[i]
    var d3 = (n.x - p.x) * (n.x - p.x) + (n.y - p.y) * (n.y - p.y)
    if (d3 < bestD) { bestD = d3; best = { kind: 'shop', target: n, label: '商店' } }
  }
  if (this.statue && !this.statue.used) {
    var d4 = (this.statue.x - p.x) * (this.statue.x - p.x) + (this.statue.y - p.y) * (this.statue.y - p.y)
    if (d4 < bestD) { bestD = d4; best = { kind: 'statue', target: this.statue, label: '雕像祈福' } }
  }
  if (this.portal) {
    var d5 = (this.portal.x - p.x) * (this.portal.x - p.x) + (this.portal.y - p.y) * (this.portal.y - p.y)
    if (d5 < bestD) { bestD = d5; best = { kind: 'portal', target: this.portal, label: '进入传送门' } }
  }
  this.interactInfo = best
}

Game.prototype._addChest = function (px, py, kind, size) {
  var idx = this.chests.length
  var opened = !!(this.room && this.room.openedChests && this.room.openedChests[idx])
  this.chests.push({ x: px, y: py, w: size, h: size, kind: kind, opened: opened, idx: idx, hp: 1 })
}

/* 子弹命中可破坏箱子：不用走过去按交互，射击即可快速破箱 */
Game.prototype._chestAt = function (x, y, r) {
  for (var i = 0; i < this.chests.length; i++) {
    var c = this.chests[i]
    if (c.opened) continue
    var hw = (c.w || 20) / 2 + (r || 0)
    if (x >= c.x - hw && x <= c.x + hw && y >= c.y - hw && y <= c.y + hw) return c
  }
  return null
}

Game.prototype._openChest = function (c) {
  if (!c || c.opened) return false
  c.opened = true
  if (this.room && c.idx != null) {
    if (!this.room.openedChests) this.room.openedChests = {}
    this.room.openedChests[c.idx] = true
  }
  if (c.kind === 'crate' || c.kind === 'barrel') {
    this._spawnPickup('coin', 'coin', c.x, c.y, rint(this.rng, 1, 3))
    if (chance(this.rng, 0.25)) this._spawnPickup('potion', 'potion_hp', c.x + 10, c.y, 1)
    this._sfx('pickup')
    return true
  }
  var gold = c.kind === 'gold'
  var loot = chestLoot(this.rng, this.run.floorIndex, gold)
  if (loot) {
    if (loot.kind === 'weapon' && loot.weaponId) this._spawnPickup('weapon', loot.weaponId, c.x, c.y, 1)
    else if (loot.kind === 'buff' && loot.buffId) {
      this.buffOptions = [loot.buffId]
      var extra = rollBuffs(this.rng, this.run.floorIndex, this.ownedBuffIds(), 2)
      for (var i = 0; i < extra.length && this.buffOptions.length < 3; i++) {
        if (this.buffOptions.indexOf(extra[i]) < 0) this.buffOptions.push(extra[i])
      }
      this.buffSource = 'chest'
      this.state = 'buff_choice'
      this.stateT = 0
    } else {
      this._spawnPickup(loot.kind === 'coins' ? 'coin' : 'potion', loot.id || (loot.kind === 'coins' ? 'coin' : 'potion_hp'), c.x, c.y, loot.count || (gold ? 4 : 2))
    }
  }
  this._sfx('chest')
  return true
}

Game.prototype._takeWeapon = function (pk) {
  if (!pk || pk.kind !== 'weapon' || !pk.weaponId) return false
  var p = this.player
  var wid = pk.weaponId
  var slot = p.activeSlot
  if (!p.weapons[0]) slot = 0
  else if (!p.weapons[1]) slot = 1
  var old = p.weapons[slot]
  var nw = makeWeaponState(wid)
  if (!nw) return false
  p.weapons[slot] = nw
  this.run.weaponIds.push(wid)
  pk.picked = true
  if (old) this._spawnPickup('weapon', old.id, p.x + 18, p.y, 1)
  this._sfx('pickup')
  return true
}

Game.prototype._openShop = function () {
  if (this.state !== 'playing') return false
  if (!this.shop || this.shop.floor !== this.run.floorIndex) {
    this.shop = rollShop(this.rng, this.run.floorIndex, this.run.chapter)
  }
  this.state = 'shop'
  this.stateT = 0
  return true
}

Game.prototype.buyShop = function (index) {
  if (this.state !== 'shop' || !this.shop || !this.shop.offers) return false
  var offer = this.shop.offers[index]
  if (!offer || offer.sold) return false
  var price = Math.floor((offer.price || 0) * (1 - (this.mods.shopDiscount || 0)))
  if (price < 0) price = 0
  if (this.run.coins < price) return false
  var p = this.player
  if (offer.kind === 'weapon') {
    var wid = offer.weaponId
    var slot = -1
    if (!p.weapons[0]) slot = 0
    else if (!p.weapons[1]) slot = 1
    else slot = p.activeSlot
    var old = p.weapons[slot]
    var nw = makeWeaponState(wid)
    if (!nw) return false
    p.weapons[slot] = nw
    p.activeSlot = slot
    this.run.weaponIds.push(wid)
    if (old) this._spawnPickup('weapon', old.id, p.x + 18, p.y, 1)
  } else if (offer.kind === 'potion') {
    if (offer.id === 'potion_hp') { p.hp = Math.min(p.maxHp, p.hp + 2); this._addFloat(p.x, p.y - 24, '+2', '#7ee787') }
    else if (offer.id === 'potion_energy') { p.energy = Math.min(p.maxEnergy, p.energy + 60); this._addFloat(p.x, p.y - 24, '+60', '#4dd0e1') }
    else if (offer.id === 'potion_armor') { p.armor = Math.min(p.maxArmor, p.armor + 2); this._addFloat(p.x, p.y - 24, '+2', '#4a7dff') }
  } else if (offer.kind === 'buff' && offer.buffId) {
    this._applyBuff(offer.buffId)
  } else if (offer.kind === 'heal') {
    p.hp = p.maxHp
    p.armor = p.maxArmor
    this._addFloat(p.x, p.y - 24, '恢复', '#7ee787')
  }
  this.run.coins -= price
  offer.sold = true
  this._sfx('coin')
  return true
}

Game.prototype.closeShop = function () {
  if (this.state === 'shop') { this.state = 'playing'; this.stateT = 0 }
}

Game.prototype._openStatue = function () {
  if (this.state !== 'playing' || !this.statue || this.statue.used) return false
  this.buffOptions = rollBuffs(this.rng, this.run.floorIndex, this.ownedBuffIds(), 3)
  this.buffSource = 'statue'
  if (!this.buffOptions.length) return false
  this.state = 'buff_choice'
  this.stateT = 0
  return true
}

Game.prototype.chooseBuff = function (index) {
  if (this.state !== 'buff_choice') return false
  var id = this.buffOptions[index]
  if (!id) return false
  this._applyBuff(id)
  if (this.buffSource === 'statue' && this.statue) {
    this.statue.used = true
    if (this.room) this.room.statueUsed = true
  }
  this.buffOptions = []
  this.state = 'playing'
  this.stateT = 0
  this._sfx('skill')
  return true
}

Game.prototype.ownedBuffIds = function () {
  var out = []
  for (var i = 0; i < this.ownedBuffs.length; i++) {
    var b = this.ownedBuffs[i]
    var n = b.stacks || 1
    for (var j = 0; j < n; j++) out.push(b.id)
  }
  return out
}

Game.prototype._applyBuff = function (id) {
  var def = buffById(id)
  if (!def) return false
  var p = this.player
  for (var i = 0; i < this.ownedBuffs.length; i++) {
    if (this.ownedBuffs[i].id === id) {
      if (def.maxStack && this.ownedBuffs[i].stacks >= def.maxStack) return false
      this.ownedBuffs[i].stacks += 1
      return this._applyBuffEffects(def)
    }
  }
  this.ownedBuffs.push({ id: id, name: def.name, desc: def.desc, icon: def.icon, stacks: 1 })
  if (this.run.buffIds.indexOf(id) < 0) this.run.buffIds.push(id)
  return this._applyBuffEffects(def)
}

Game.prototype._applyBuffEffects = function (def) {
  var p = this.player
  var effects = def.effects || []
  for (var k = 0; k < effects.length; k++) {
    var e = effects[k]
    var v = e.value
    if (e.type === 'maxHp') { p.maxHp += v; p.hp += v }
    else if (e.type === 'maxArmor') { p.maxArmor += v; p.armor += v }
    else if (e.type === 'maxEnergy') { p.maxEnergy += v; p.energy += v }
    else if (e.type === 'crit') p.crit += v
    else if (e.type === 'damagePct') this.mods.damageMul += v
    else if (e.type === 'fireRatePct') this.mods.fireRateMul += v
    else if (e.type === 'speedPct') this.mods.speedMul += v
    else if (e.type === 'rangePct') this.mods.rangeMul += v
    else if (e.type === 'pierce') this.mods.pierceAdd += v
    else if (e.type === 'bounce') this.mods.bounceAdd += v
    else if (e.type === 'element') this.mods.elementAdd = v
    else if (e.type === 'lifesteal') this.mods.lifesteal += v
    else if (e.type === 'killHeal') this.mods.killHeal += v
    else if (e.type === 'killEnergy') this.mods.killEnergy += v
    else if (e.type === 'coinBonusPct') this.mods.coinMul += v
    else if (e.type === 'gemBonusPct') this.mods.gemMul += v
    else if (e.type === 'shopDiscount') this.mods.shopDiscount += v
    else if (e.type === 'magnet') this.mods.magnetAdd += v
    else if (e.type === 'skillHastePct') this.mods.skillHaste += v
    else if (e.type === 'armorRegenPct') this.mods.armorRegenMul += v
    else if (e.type === 'thorns') this.mods.thorns += v
    else if (e.type === 'reviveOnce') this.mods.reviveExtra += v
  }
  return true
}

/* ---------------- 死亡 / 复活 / 结算 ---------------- */

Game.prototype._onPlayerDeath = function () {
  if (!this.player || this.player.dead) return
  this.player.dead = true
  this.player.hp = 0
  this._sfx('lose')
  var extra = (this.mods.reviveExtra || 0) > 0
  var cost = extra ? 0 : reviveCost(this.run.floorIndex)
  var canAfford = extra || this.gemsAvail >= cost
  if (!this.player.reviveUsed || extra) {
    this.reviveInfo = { cost: cost, canAfford: canAfford, free: extra }
    this.state = 'revive'
    this.stateT = 0
    return
  }
  this._endRun('dead')
}

Game.prototype._spendGems = function (cost) {
  if (cost <= 0) return true
  if (this.hooks && typeof this.hooks.onSpendGems === 'function') {
    var ok = false
    try { ok = this.hooks.onSpendGems(cost) === true } catch (e) { ok = false }
    if (ok) { this.gemsAvail -= cost; return true }
    return false
  }
  if (this.gemsAvail < cost) return false
  this.gemsAvail -= cost
  return true
}

Game.prototype.revive = function () {
  if (this.state !== 'revive' || !this.reviveInfo) return false
  var info = this.reviveInfo
  if (!this._spendGems(info.cost)) return false
  var p = this.player
  p.dead = false
  p.hp = Math.max(1, Math.ceil(p.maxHp * 0.5))
  p.armor = p.maxArmor
  p.energy = p.maxEnergy
  p.invuln = 3
  p.reviveUsed = true
  p.statuses.burn = 0
  p.statuses.poison = 0
  p.statuses.freeze = 0
  this.run.revives += 1
  this.run.gemsSpent = (this.run.gemsSpent || 0) + info.cost
  /* 清掉附近敌人子弹 */
  var keep = []
  for (var i = 0; i < this.bullets.length; i++) {
    var b = this.bullets[i]
    if (b.owner === 'enemy') {
      var dx = b.x - p.x
      var dy = b.y - p.y
      if (dx * dx + dy * dy < 360 * 360) continue
    }
    keep.push(b)
  }
  this.bullets = keep
  this.reviveInfo = null
  this.state = 'playing'
  this.stateT = 0
  this._sfx('heal')
  return true
}

Game.prototype.declineRevive = function () {
  if (this.state !== 'revive') return false
  this.reviveInfo = null
  this._endRun('dead')
  return true
}

Game.prototype.abandonRun = function () {
  if (this.ended) return
  this._endRun('abandon')
}

Game.prototype._endRun = function (outcome) {
  if (this.ended) return false
  this.ended = true
  this.state = 'ended'
  var floorBonus = Math.max(0, this.run.floorIndex - 1) * GEM_PER_FLOOR
  var bossBonus = this.run.bossKills * GEM_PER_BOSS
  var roomGems = this.run.roomsCleared * GEM_PER_ROOM * (this.mods.gemMul || 1)
  var winBonus = outcome === 'victory' ? GEM_PER_WIN : 0
  var gemsEarned = Math.floor((this.run.gemsCollected || 0) * (this.mods.gemMul || 1) + floorBonus + bossBonus + roomGems + winBonus)
  var weapons = []
  for (var i = 0; i < this.run.weaponIds.length; i++) {
    if (weapons.indexOf(this.run.weaponIds[i]) < 0) weapons.push(this.run.weaponIds[i])
  }
  var result = {
    outcome: outcome,
    characterId: this.run.characterId,
    characterName: this.run.characterName,
    chapter: this.run.chapter,
    chapterName: this.run.chapterName,
    floor: this.run.floorIndex,
    floorInChapter: this.run.floorInChapter,
    roomsCleared: this.run.roomsCleared,
    kills: this.run.kills,
    bossKills: this.run.bossKills,
    coins: this.run.coins,
    gemsCollected: this.run.gemsCollected,
    gemsEarned: gemsEarned,
    gemsSpent: this.run.gemsSpent || 0,
    durationMs: Date.now() - this.run.startTime,
    damageDealt: Math.round(this.damageDealt),
    damageTaken: Math.round(this.damageTaken),
    revives: this.run.revives,
    weapons: weapons,
    buffs: this.ownedBuffIds()
  }
  this._sfx(outcome === 'victory' ? 'win' : 'lose')
  try { if (this.hooks && this.hooks.onEndRun) this.hooks.onEndRun(result) } catch (e) {}
  return true
}

/* ---------------- 工具 ---------------- */

Game.prototype.tileAt = function (tx, ty) {
  if (!this.rows || tx < 0 || ty < 0 || ty >= this.rows.length) return '#'
  var row = this.rows[ty]
  if (!row || tx >= row.length) return '#'
  return row[tx]
}

Game.prototype.isSolid = function (tx, ty) {
  var ch = this.tileAt(tx, ty)
  if (ch === '#' || ch === 'O') return true
  if (ch === 'D') {
    var d = this.doorTiles[tx + ',' + ty]
    return !d || !d.open
  }
  return false
}

Game.prototype.isSolidPx = function (x, y) {
  return this.isSolid(Math.floor(x / TILE), Math.floor(y / TILE))
}

Game.prototype._tileCenter = function (tx, ty) {
  return { x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 }
}

Game.prototype._randomOpenPos = function (minDistFromPlayer) {
  var p = this.player
  for (var tries = 0; tries < 40; tries++) {
    var tx = rint(this.rng, 2, this.roomW - 3)
    var ty = rint(this.rng, 2, this.roomH - 3)
    if (this.isSolid(tx, ty)) continue
    var c = this._tileCenter(tx, ty)
    if (p && minDistFromPlayer) {
      var dx = c.x - p.x
      var dy = c.y - p.y
      if (dx * dx + dy * dy < minDistFromPlayer * minDistFromPlayer) continue
    }
    return c
  }
  return null
}

Game.prototype._addFloat = function (x, y, text, color) {
  this.floats.push({ x: x, y: y, text: text, color: color || '#ffffff', life: 0.75, maxLife: 0.75, vy: -38 })
  if (this.floats.length > 40) this.floats.shift()
}

Game.prototype._addParticles = function (x, y, color, count, speed) {
  var n = count || 6
  var room = 360 - this.effects.length
  if (room <= 0) return
  if (n > room) n = room
  for (var i = 0; i < n; i++) {
    var ang = Math.random() * Math.PI * 2
    var sp = (speed || 80) * (0.4 + Math.random() * 0.8)
    this.effects.push({
      type: 'particle', x: x, y: y,
      vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
      life: 0.35 + Math.random() * 0.3, maxLife: 0.65,
      color: color || '#ffd93d', size: 2 + Math.floor(Math.random() * 3)
    })
  }
}

Game.prototype._spawnPickup = function (kind, id, x, y, count) {
  if (kind === 'potion' && (!id || id === 'potion')) { kind = 'potion_hp'; id = 'potion_hp' }
  else if (kind === 'potion' && id) kind = id
  var pk = {
    kind: kind, id: id || kind, x: x, y: y,
    vx: (Math.random() - 0.5) * 40, vy: (Math.random() - 0.5) * 40,
    count: count || 1, life: 60, t: 0, picked: false
  }
  if (kind === 'weapon') {
    var def = weaponById(id)
    if (!def) return null
    pk.weaponId = def.id
    pk.name = def.name
  }
  this.pickups.push(pk)
  if (this.pickups.length > 80) this.pickups.shift()
  return pk
}

Game.prototype._updateEffects = function (dt) {
  var w = 0
  for (var i = 0; i < this.effects.length; i++) {
    var e = this.effects[i]
    e.life -= dt
    if (e.life <= 0) continue
    e.t = (e.t || 0) + dt
    if (e.type === 'particle') {
      e.x += (e.vx || 0) * dt
      e.y += (e.vy || 0) * dt
      e.vy += 240 * dt
    }
    this.effects[w++] = e
  }
  this.effects.length = w
}

Game.prototype._updateFloats = function (dt) {
  var w = 0
  for (var i = 0; i < this.floats.length; i++) {
    var f = this.floats[i]
    f.life -= dt
    f.y += f.vy * dt
    f.vy += 26 * dt
    if (f.life > 0) this.floats[w++] = f
  }
  this.floats.length = w
}

Game.prototype._updateTurret = function (dt) {
  var t = this.turret
  if (!t) return
  t.life -= dt
  t.cd -= dt
  if (t.life <= 0) { this.turret = null; return }
  if (t.cd <= 0) {
    var target = this._nearestEnemy(t.x, t.y, 320)
    if (target) {
      t.cd = 0.42
      var ang = Math.atan2(target.y - t.y, target.x - t.x)
      this._spawnBullet(t.x, t.y, Math.cos(ang), Math.sin(ang), {
        owner: 'player', dmg: 2, speed: 520, life: 0.8, size: 4, color: '#ffd93d', pierce: 0, bounce: 0
      })
      this._sfx('shot')
    }
  }
}

/* ---------------- HUD ---------------- */

Game.prototype.getHud = function () {
  var p = this.player || {}
  var weapons = []
  var ws = p.weapons || []
  for (var i = 0; i < 2; i++) {
    var w = ws[i]
    weapons.push(w ? {
      id: w.id, name: w.def.name, rarity: w.def.rarity, color: w.def.color,
      sprite: w.def.sprite, energy: w.def.energy, dmg: w.def.dmg
    } : null)
  }
  var buffs = []
  for (var b = 0; b < this.ownedBuffs.length; b++) {
    var ob = this.ownedBuffs[b]
    buffs.push({ id: ob.id, name: ob.name, desc: ob.desc, icon: ob.icon, stacks: ob.stacks })
  }
  var boss = null
  for (var e = 0; e < this.enemies.length; e++) {
    if (this.enemies[e].boss) {
      boss = { name: this.enemies[e].def.name, hp: Math.max(0, Math.ceil(this.enemies[e].hp)), maxHp: this.enemies[e].maxHp }
      break
    }
  }
  var minimap = []
  if (this.floorData) {
    for (var key in this.floorData.rooms) {
      if (!Object.prototype.hasOwnProperty.call(this.floorData.rooms, key)) continue
      var rm = this.floorData.rooms[key]
      minimap.push({
        key: key, gx: rm.gx, gy: rm.gy, type: rm.type,
        visited: !!rm.visited, cleared: !!rm.cleared,
        current: !!(this.room && this.room.key === rm.key)
      })
    }
  }
  var shopInfo = null
  if (this.shop) {
    var offers = []
    for (var s = 0; s < this.shop.offers.length; s++) {
      var o = this.shop.offers[s]
      var name = o.name
      if (o.kind === 'weapon') {
        var wdef = weaponById(o.weaponId)
        name = wdef ? wdef.name : '武器'
      } else if (o.kind === 'buff') {
        var bdef = buffById(o.buffId)
        name = bdef ? bdef.name : '天赋'
      }
      if (!name) name = o.kind
      offers.push({ index: s, kind: o.kind, name: name, price: Math.floor((o.price || 0) * (1 - (this.mods.shopDiscount || 0))), sold: !!o.sold, desc: o.desc || '' })
    }
    shopInfo = { offers: offers, healPrice: Math.floor((this.shop.healPrice || 0) * (1 - (this.mods.shopDiscount || 0))) }
  }
  var revive = this.reviveInfo ? { cost: this.reviveInfo.cost, canAfford: this.reviveInfo.canAfford, free: !!this.reviveInfo.free } : null
  var opts = []
  if (this.state === 'buff_choice') {
    for (var bo = 0; bo < this.buffOptions.length; bo++) {
      var d = buffById(this.buffOptions[bo])
      if (d) opts.push({ index: bo, id: d.id, name: d.name, desc: d.desc, icon: d.icon, rarity: d.rarity })
    }
  }
  var interact = this.interactInfo ? { kind: this.interactInfo.kind, label: this.interactInfo.label } : null
  return {
    state: this.paused ? 'paused' : this.state,
    chapter: this.run ? this.run.chapter : 1,
    chapterName: this.run ? this.run.chapterName : '',
    petName: (this.pet && this.pet.def) ? this.pet.def.name : '',
    floor: this.run ? this.run.floorIndex : 1,
    floorInChapter: this.run ? this.run.floorInChapter : 1,
    characterId: this.run ? this.run.characterId : 'knight',
    characterName: this.run ? this.run.characterName : '骑士',
    hp: p.hp || 0, maxHp: p.maxHp || 1,
    armor: p.armor || 0, maxArmor: p.maxArmor || 1,
    energy: Math.floor(p.energy || 0), maxEnergy: p.maxEnergy || 1,
    coins: this.run ? this.run.coins : 0,
    gems: Math.floor((this.run ? this.run.gemsCollected : 0) + (this.gemsAvail || 0)),
    weapons: weapons,
    activeSlot: p.activeSlot || 0,
    skill: p.skill ? {
      id: p.skill.id, name: p.skill.name, desc: p.skill.desc,
      cd: p.skillCdMax || 10,
      cdLeft: Math.max(0, p.skillCd || 0),
      ready: (p.skillCd || 0) <= 0
    } : null,
    buffs: buffs,
    boss: boss,
    interact: interact,
    minimap: minimap,
    floorIntro: (this.state === 'floor_intro' && this.run) ? {
      chapterName: this.run.chapterName, chapter: this.run.chapter,
      floor: this.run.floorIndex, floorInChapter: this.run.floorInChapter
    } : null,
    buffOptions: opts,
    shop: shopInfo,
    revive: revive,
    fps: this.fps,
    autoAim: this.autoAim
  }
}

/* ---------------- 销毁 ---------------- */

Game.prototype.destroy = function () {
  this.ended = true
  this.state = 'ended'
  this.ctx = null
  this.enemies = []
  this.bullets = []
  this.pickups = []
  this.effects = []
  this.floats = []
}

/* ---------------- 挂载渲染与战斗 ---------------- */

Game.prototype.render = function () {
  renderGame(this)
}

installCombat(Game)

export { Game as default }
