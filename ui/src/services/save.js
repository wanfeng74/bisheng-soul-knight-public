/*
 * 本地存档（falcon jsapi.storage 持久化）。
 *
 * 设计：单存档 + 整体写入（数据 < 10KB）。
 * 兼容多种 storage 形态（jsapi.storage / jsapi 对象 / 原生 storage / localStorage），
 * 全部失败时退化为内存存档，保证游戏可玩（只是退出后丢进度）。
 *
 * 存档结构见 defaultSave()；数值成长/解锁逻辑在 services/game/meta.js。
 */

/* 新档赠送宝石（与 constants.START_GEMS 保持一致，便于首次解锁角色/升级） */
import { START_GEMS } from './game/constants.js'

var SAVE_VERSION = 1
var STORAGE_KEY = 'sk_save_v' + SAVE_VERSION
var _memory = null
var _nativeStorage = null

export function defaultSave() {
  return {
    v: SAVE_VERSION,
    gems: START_GEMS,
    lifetimeCoins: 0,
    unlockedChars: ['knight'],
    charUpgrades: {},          /* { charId: { hp, armor, energy, crit, speed, skill } } */
    skillChoices: {},          /* { charId: 0|1|2 } —— 当前出战技能 */
    unlockedWeapons: {},       /* { weaponId: true } —— 锻造/图鉴解锁 */
    achievements: {},          /* { achId: true } */
    stats: {
      runs: 0, wins: 0, deaths: 0, kills: 0, bossKills: 0,
      bestFloor: 0, bestRoom: 0, totalGems: 0, playMs: 0, revives: 0
    },
    settings: { soundOn: true, autoAim: true, shake: true, showFps: false, debugInvincible: false, debugInfiniteCurrency: false, debugGemSnapshot: 0, petId: 'random' },
    lastChar: 'knight',
    seenIntro: false,
    runSave: null,
    saveAt: 0
  }
}

/* ---------------- 存储后端 ---------------- */

function storageObject() {
  var paths = [
    function () { return ($falcon && $falcon.jsapi) ? $falcon.jsapi.storage : null },
    function () { return (typeof jsapi !== 'undefined' && jsapi) ? jsapi.storage : null },
    function () { return (typeof window !== 'undefined' && window.jsapi) ? window.jsapi.storage : null },
    function () { return $falcon ? $falcon.storage : null }
  ]
  for (var i = 0; i < paths.length; i++) {
    try {
      var s = paths[i]()
      if (s && typeof s === 'object') return s
    } catch (e) {}
  }
  return null
}

function storageBackend() {
  var s = storageObject()
  if (s) {
    if (typeof s.setStorage === 'function' && typeof s.getStorage === 'function') return 'jsapi-storage'
    if (typeof s.setItem === 'function' && typeof s.getItem === 'function') return 'jsapi-item'
  }
  try {
    if (typeof require === 'function') {
      var m = require('storage')
      if (m && (typeof m.setStorage === 'function' || typeof m.setItem === 'function')) {
        _nativeStorage = m
        return typeof m.setStorage === 'function' ? 'native-storage' : 'native-item'
      }
    }
  } catch (e) {}
  try {
    if (typeof window !== 'undefined' && window.localStorage) return 'local'
  } catch (e) {}
  return null
}

function extractData(res) {
  if (res == null) return null
  if (typeof res === 'string') return res
  if (res.error) return null
  if (typeof res.data === 'string') return res.data
  if (typeof res.result === 'string') return res.result
  return null
}

function invokeRead(readFn, arg, timeoutMs) {
  return new Promise(function (resolve) {
    var settled = false
    var done = function (v) { if (!settled) { settled = true; resolve(v) } }
    var timer = setTimeout(function () { done(null) }, timeoutMs)
    try {
      var r = readFn(arg, function (res) {
        clearTimeout(timer)
        done(typeof res === 'string' ? res : extractData(res))
      })
      if (r && typeof r.then === 'function') {
        r.then(function (res) {
          clearTimeout(timer)
          done(typeof res === 'string' ? res : extractData(res))
        })
      } else if (typeof r === 'string') {
        clearTimeout(timer); done(r)
      } else if (r != null && typeof r === 'object') {
        clearTimeout(timer); done(extractData(r))
      }
    } catch (e) { clearTimeout(timer); done(null) }
  })
}

function invokeWrite(writeFn, arg, timeoutMs) {
  return new Promise(function (resolve) {
    var settled = false
    var done = function (v) { if (!settled) { settled = true; resolve(v) } }
    var timer = setTimeout(function () { done(false) }, timeoutMs)
    try {
      var r = writeFn(arg, function (res) {
        clearTimeout(timer); done(!(res && res.error))
      })
      if (r && typeof r.then === 'function') {
        r.then(function (res) { clearTimeout(timer); done(!(res && res.error)) })
      } else if (r === false) {
        clearTimeout(timer); done(false)
      } else if (r != null && r.error) {
        clearTimeout(timer); done(false)
      } else if (typeof r === 'boolean' || typeof r === 'string') {
        clearTimeout(timer); done(true)
      }
    } catch (e) { clearTimeout(timer); done(false) }
  })
}

function rawGet(key) {
  var b = storageBackend()
  if (b === 'jsapi-storage')
    return invokeRead(storageObject().getStorage, { key: key }, 800)
  if (b === 'jsapi-item')
    return invokeRead(storageObject().getItem, { key: key }, 800)
  if (b === 'native-storage') {
    var m1 = _nativeStorage
    return invokeRead(function (a, cb) { return m1.getStorage(a, cb) }, { key: key }, 800)
  }
  if (b === 'native-item') {
    var m2 = _nativeStorage
    return invokeRead(function (a, cb) { return m2.getItem(a, cb) }, { key: key }, 800)
  }
  if (b === 'local') {
    try { return Promise.resolve(window.localStorage.getItem(key)) } catch (e) { return Promise.resolve(null) }
  }
  return Promise.resolve(null)
}

function rawSet(key, value) {
  var b = storageBackend()
  if (b === 'jsapi-storage')
    return invokeWrite(storageObject().setStorage, { key: key, data: value }, 1000)
  if (b === 'jsapi-item')
    return invokeWrite(storageObject().setItem, { key: key, value: value }, 1000)
  if (b === 'native-storage') {
    var m3 = _nativeStorage
    return invokeWrite(function (a, cb) { return m3.setStorage(a, cb) }, { key: key, data: value }, 1000)
  }
  if (b === 'native-item') {
    var m4 = _nativeStorage
    return invokeWrite(function (a, cb) { return m4.setItem(a, cb) }, { key: key, value: value }, 1000)
  }
  if (b === 'local') {
    try { window.localStorage.setItem(key, String(value)); return Promise.resolve(true) } catch (e) { return Promise.resolve(false) }
  }
  return Promise.resolve(false)
}

/* ---------------- 归一化 ---------------- */

function num(v, def) {
  var n = Number(v)
  return (typeof v !== 'undefined' && v !== null && isFinite(n)) ? n : def
}

function intClamp(v, min, max, def) {
  var n = Math.floor(num(v, def))
  if (n < min) n = min
  if (n > max) n = max
  return n
}

function strArr(v) {
  var out = []
  if (!v || typeof v.length !== 'number') return out
  for (var i = 0; i < v.length; i++) {
    if (typeof v[i] === 'string' && v[i]) out.push(v[i])
  }
  return out
}

function objOfNums(v, keys) {
  var out = {}
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i]
    out[k] = intClamp(v && v[k], 0, 99, 0)
  }
  return out
}

export function normalize(d) {
  var f = defaultSave()
  if (!d || typeof d !== 'object') return f
  f.gems = intClamp(d.gems, 0, 99999999, 0)
  f.lifetimeCoins = intClamp(d.lifetimeCoins, 0, 999999999, 0)
  f.unlockedChars = strArr(d.unlockedChars)
  if (f.unlockedChars.indexOf('knight') < 0) f.unlockedChars.unshift('knight')
  var cu = (d.charUpgrades && typeof d.charUpgrades === 'object') ? d.charUpgrades : {}
  f.charUpgrades = {}
  for (var cid in cu) {
    if (!Object.prototype.hasOwnProperty.call(cu, cid)) continue
    f.charUpgrades[cid] = objOfNums(cu[cid], ['hp', 'armor', 'energy', 'crit', 'speed', 'skill'])
  }
  f.skillChoices = {}
  var sc = d.skillChoices
  if (sc && typeof sc === 'object') {
    for (var sid in sc) {
      if (!Object.prototype.hasOwnProperty.call(sc, sid)) continue
      var idx = Number(sc[sid])
      if (idx === 1 || idx === 2) f.skillChoices[sid] = idx
    }
  }
  var uw = (d.unlockedWeapons && typeof d.unlockedWeapons === 'object') ? d.unlockedWeapons : {}
  f.unlockedWeapons = {}
  for (var wid in uw) {
    if (!Object.prototype.hasOwnProperty.call(uw, wid)) continue
    if (uw[wid]) f.unlockedWeapons[wid] = true
  }
  var ach = (d.achievements && typeof d.achievements === 'object') ? d.achievements : {}
  f.achievements = {}
  for (var aid in ach) {
    if (!Object.prototype.hasOwnProperty.call(ach, aid)) continue
    if (ach[aid]) f.achievements[aid] = true
  }
  var st = d.stats || {}
  f.stats = {
    runs: intClamp(st.runs, 0, 9999999, 0),
    wins: intClamp(st.wins, 0, 9999999, 0),
    deaths: intClamp(st.deaths, 0, 9999999, 0),
    kills: intClamp(st.kills, 0, 99999999, 0),
    bossKills: intClamp(st.bossKills, 0, 9999999, 0),
    bestFloor: intClamp(st.bestFloor, 0, 9999, 0),
    bestRoom: intClamp(st.bestRoom, 0, 999999, 0),
    totalGems: intClamp(st.totalGems, 0, 999999999, 0),
    playMs: intClamp(st.playMs, 0, 999999999999, 0),
    revives: intClamp(st.revives, 0, 999999, 0)
  }
  var se = d.settings || {}
  f.settings = {
    soundOn: se.soundOn !== false,
    autoAim: se.autoAim !== false,
    shake: se.shake !== false,
    showFps: !!se.showFps,
    debugInvincible: se.debugInvincible === true,
    debugInfiniteCurrency: se.debugInfiniteCurrency === true,
    debugGemSnapshot: num(se.debugGemSnapshot, 0),
    petId: (typeof se.petId === 'string' && se.petId) ? se.petId : 'random'
  }
  f.lastChar = (typeof d.lastChar === 'string' && d.lastChar) ? d.lastChar : 'knight'
  f.seenIntro = !!d.seenIntro
  f.runSave = (d.runSave && typeof d.runSave === 'object' && d.runSave.characterId && d.runSave.seed) ? d.runSave : null
  f.saveAt = num(d.saveAt, 0)
  return f
}

/* ---------------- 对外 API ---------------- */

function read() {
  return rawGet(STORAGE_KEY).then(function (raw) {
    var d = null
    if (typeof raw === 'string' && raw) {
      try { d = JSON.parse(raw) } catch (e) { d = null }
    }
    return normalize(d)
  })
}

/** 读取存档（Promise<db>），同时缓存到 $falcon.__gameDb */
export function load() {
  return read().then(function (db) {
    _memory = db
    try { $falcon.__gameDb = db } catch (e) {}
    return db
  })
}

export function current() { return _memory }

/** 整体写入（传存档引用即可） */
export function save(db) {
  var d = normalize(db)
  d.saveAt = Date.now()
  _memory = d
  try { $falcon.__gameDb = d } catch (e) {}
  return rawSet(STORAGE_KEY, JSON.stringify(d)).then(function (ok) { return ok })
}

/** 重置为新档 */
export function reset() {
  var f = defaultSave()
  _memory = f
  try { $falcon.__gameDb = f } catch (e) {}
  return rawSet(STORAGE_KEY, JSON.stringify(f))
}

export function clearSave() { return reset() }

export function persistAvailable() {
  return storageBackend() !== null
}

export function storageKind() {
  return storageBackend() || 'none'
}

export var SAVE_KEY = STORAGE_KEY
