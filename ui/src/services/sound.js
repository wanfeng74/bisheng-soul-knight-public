/*
 * 音效 / BGM 模块（原生 GStreamer 播放，资源随安装包安装，不需要下载）。
 *
 * 播放：updater.audio.playName(appid, name) —— 原生库在
 *   /userdisk/miniapp/data/mini_app/pkg/<appid>/assets/sounds/<name>.wav
 *   等位置找到文件后用 gst-launch-1.0 后台播放。
 * 无原生音频能力时静默降级，不影响游戏。
 *
 * 本作只使用 wav：音效 + 三首循环 BGM（大厅 / 地牢 / Boss）。
 */
import { load } from './save.js'
import { logInfo } from './logger.js'
import { updater } from './native-mods.js'

var FALLBACK_APPID = '8001865309001001'
var SOUND_NAMES = [
  'shot', 'shot_heavy', 'hit', 'hurt', 'pickup', 'reload', 'heal', 'win', 'lose',
  'slash', 'skill', 'coin', 'chest', 'portal', 'boss_roar', 'explode', 'dash'
]
var BGM_FILES = { lobby: 'bgm_lobby', dungeon: 'bgm_dungeon', boss: 'bgm_boss' }

var _ready = false
var _soundOn = true
var _soundLoaded = false
var SOUND_KEY = 'sk_sound_on'
var _lastPlay = {}
var _logged = {}
var _curBgm = ''
var _curBgmVol = 1

function audioApi() {
  try {
    if (updater && updater.audio && typeof updater.audio.playName === 'function') return updater.audio
  } catch (e) {}
  return null
}

function appid() {
  var a = ''
  try { a = ($falcon && $falcon.$appid) || '' } catch (e) {}
  a = String(a || '')
  return /^[0-9_-]{6,24}$/.test(a) ? a : FALLBACK_APPID
}

function workspaceAssetPath(fileName) {
  var ws = ''
  try { ws = String(($falcon && $falcon.$workspace) || '') } catch (e) {}
  if (!ws) return ''
  if (ws.charAt(ws.length - 1) !== '/') ws += '/'
  return ws + 'assets/sounds/' + fileName
}

function workspaceSoundPath(name) {
  return workspaceAssetPath(name + '.wav')
}

function _storageObj() {
  try { if ($falcon && $falcon.jsapi && $falcon.jsapi.storage) return $falcon.jsapi.storage } catch (e) {}
  try { if ($falcon && $falcon.storage) return $falcon.storage } catch (e) {}
  return null
}

function _valOf(res) {
  try {
    if (res == null) return ''
    if (typeof res === 'string') return res
    if (res.data != null) return String(res.data)
    if (res.value != null) return String(res.value)
  } catch (e) {}
  return ''
}

function _applySwitch(v) {
  if (v === '0') { _soundOn = false; try { bgmStop() } catch (e) {} }
  else if (v === '1') { _soundOn = true }
  _soundLoaded = true
}

export function loadSoundSetting() {
  if (_soundLoaded) return
  try {
    var m = $falcon && $falcon.__gameDb
    if (m && m.settings && m.settings.soundOn === false) _soundOn = false
  } catch (e) {}
  var s = _storageObj()
  if (s && typeof s.getStorage === 'function') {
    try {
      var r = s.getStorage({ key: SOUND_KEY })
      if (r && typeof r.then === 'function') {
        r.then(function (res) { _applySwitch(_valOf(res)) }, function () { _soundLoaded = true })
      } else {
        _applySwitch(_valOf(r))
      }
    } catch (e2) { _soundLoaded = true }
  }
  /* 存档兜底 */
  try {
    load().then(function (db) {
      if (_soundLoaded) return
      if (db && db.settings && db.settings.soundOn === false) _applySwitch('0')
      else _soundLoaded = true
    }, function () { _soundLoaded = true })
  } catch (e) {}
}

/** 探测安装包内音频资源是否可播放（不下载，纯本地） */
export function initSounds() {
  return new Promise(function (resolve) {
    loadSoundSetting()
    var a = audioApi()
    if (!a) {
      try { logInfo('[sound] no native audio api') } catch (e) {}
      resolve(false)
      return
    }
    var found = ''
    try {
      var wp = workspaceSoundPath('shot')
      if (wp && a.probe && a.probe(wp)) found = wp
    } catch (eW) {}
    if (!found) { try { found = a.find(appid(), 'shot') || '' } catch (e) {} }
    try { logInfo('[sound] find(shot)=' + (found || '(none)')) } catch (e2) {}
    _ready = !!found
    resolve(_ready)
  })
}

/** 背景音乐（lobby/dungeon/boss），同名曲目切换不重播，'' 表示停 */
export function bgmPlay(name, vol) {
  var a = audioApi()
  if (!a || typeof a.musicPlay !== 'function') return false
  if (vol == null || !(vol > 0)) vol = 1
  if (vol > 1) vol = 1
  if (!_soundOn) { bgmStop(); return false }
  if (!name) { bgmStop(); return false }
  if (_curBgm === name && Math.abs(_curBgmVol - vol) < 0.01) return true
  var file = BGM_FILES[name]
  if (!file) return false
  var p = workspaceAssetPath(file + '.wav')
  if (!p) return false
  try {
    if (a.probe && !a.probe(p)) {
      try { logInfo('[bgm] missing ' + p) } catch (e0) {}
      return false
    }
    stopBgmInternal()
    var ok = a.musicPlay(p, vol)
    if (ok === false) { _curBgm = ''; _curBgmVol = 1; return false }
    _curBgm = name
    _curBgmVol = vol
    try { logInfo('[bgm] play ' + name) } catch (e1) {}
    return true
  } catch (e) { return false }
}

function stopBgmInternal() {
  var a = audioApi()
  if (!a || typeof a.musicStop !== 'function') return
  try { a.musicStop() } catch (e) {}
}

export function bgmStop() {
  _curBgm = ''
  _curBgmVol = 1
  stopBgmInternal()
}

export function isBgmPlaying() { return !!_curBgm }

export function setSoundOn(on) {
  _soundOn = !!on
  _soundLoaded = true
  try {
    var s = _storageObj()
    if (s && typeof s.setStorage === 'function') {
      var rr = s.setStorage({ key: SOUND_KEY, data: _soundOn ? '1' : '0' })
      if (rr && typeof rr.catch === 'function') rr.catch(function () {})
    }
  } catch (e) {}
  try { var m = $falcon && $falcon.__gameDb; if (m && m.settings) m.settings.soundOn = _soundOn } catch (e2) {}
  if (!_soundOn) bgmStop()
}

export function soundLoaded() {
  return new Promise(function (resolve) {
    if (_soundLoaded) { resolve(_soundOn); return }
    var tries = 0
    var iv = setInterval(function () {
      tries++
      if (_soundLoaded || tries > 20) {
        try { clearInterval(iv) } catch (e) {}
        resolve(_soundOn)
      }
    }, 50)
  })
}

export function isSoundOn() {
  try { loadSoundSetting() } catch (e) {}
  return _soundOn
}

/** 播放音效（节流 + 静默降级） */
export function sfx(name) {
  if (!_soundOn) return
  var now = Date.now()
  if (_lastPlay[name] && now - _lastPlay[name] < 60) return
  _lastPlay[name] = now
  var a = audioApi()
  if (!a) return
  var used = ''
  try {
    var wp = workspaceSoundPath(name)
    if (wp && a.probe && a.probe(wp)) { a.play(wp); used = wp }
  } catch (eW) {}
  if (!used) { try { used = a.playName(appid(), name) || '' } catch (e) {} }
  if (!_logged[name]) {
    _logged[name] = 1
    try { logInfo('[sound] playName ' + name + ' -> ' + (used || '(not found)')) } catch (e2) {}
  }
}
