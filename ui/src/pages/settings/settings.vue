<template>
  <div class="page">
    <div class="bg"></div>
    <div class="topbar">
      <div class="back-btn" @touchstart="goBack" @click="goBack" @tap="goBack">
        <text class="back-text">返回</text>
      </div>
      <text class="title">设置</text>
      <text class="subtitle">操作偏好 · 存档 · 关于</text>
    </div>
    <div v-if="msg" class="msg-bar">
      <text class="msg-text">{{ msg }}</text>
    </div>
    <scroller class="body-scroller" :style="{ height: bodyH + 'px' }" scrollDirection="vertical">
    <div class="body">
      <div class="left-panel">
        <text class="panel-title">游戏设置</text>
        <div class="set-row">
          <text class="set-label">音效与音乐</text>
          <div class="switch-btn" :class="soundOn ? 'switch-on' : 'switch-off'" @touchstart="toggleSound" @click="toggleSound" @tap="toggleSound">
            <text class="switch-text">{{ soundOn ? '开' : '关' }}</text>
          </div>
        </div>
        <div class="set-row">
          <text class="set-label">自动瞄准</text>
          <div class="switch-btn" :class="autoAim ? 'switch-on' : 'switch-off'" @touchstart="toggleAim" @click="toggleAim" @tap="toggleAim">
            <text class="switch-text">{{ autoAim ? '开' : '关' }}</text>
          </div>
        </div>
        <div class="set-row">
          <text class="set-label">出战宠物</text>
          <div class="switch-btn" :class="'switch-on'" @touchstart="cyclePet" @click="cyclePet" @tap="cyclePet">
            <text class="switch-text">{{ petLabel }}</text>
          </div>
        </div>
        <div class="set-row">
          <text class="set-label">震屏反馈</text>
          <div class="switch-btn" :class="shake ? 'switch-on' : 'switch-off'" @touchstart="toggleShake" @click="toggleShake" @tap="toggleShake">
            <text class="switch-text">{{ shake ? '开' : '关' }}</text>
          </div>
        </div>
        <div class="set-row">
          <text class="set-label">显示帧率</text>
          <div class="switch-btn" :class="showFps ? 'switch-on' : 'switch-off'" @touchstart="toggleFps" @click="toggleFps" @tap="toggleFps">
            <text class="switch-text">{{ showFps ? '开' : '关' }}</text>
          </div>
        </div>
        <div class="set-row">
          <text class="set-label">调试模式 · 锁血</text>
          <div class="switch-btn" :class="debugInvincible ? 'switch-on' : 'switch-off'" @touchstart="toggleDebug" @click="toggleDebug" @tap="toggleDebug">
            <text class="switch-text">{{ debugInvincible ? '开' : '关' }}</text>
          </div>
        </div>
        <div class="set-row">
          <text class="set-label">调试模式 · 无限金币宝石</text>
          <div class="switch-btn" :class="debugCurrency ? 'switch-on' : 'switch-off'" @touchstart="toggleDebugCurrency" @click="toggleDebugCurrency" @tap="toggleDebugCurrency">
            <text class="switch-text">{{ debugCurrency ? '开' : '关' }}</text>
          </div>
        </div>
        <text class="panel-title">存档</text>
        <div class="danger-btn" @touchstart="askReset" @click="askReset" @tap="askReset">
          <text class="danger-text">重置存档</text>
        </div>
        <text class="danger-hint">重置会清空宝石、角色解锁、能力升级、成就与统计</text>
      </div>
      <div class="right-panel">
        <text class="panel-title">关于</text>
        <div v-for="(r, ri) in aboutRows" :key="'ab' + ri" class="about-row">
          <text class="about-label">{{ r.label }}</text>
          <text class="about-value">{{ r.value }}</text>
        </div>
        <text class="about-tip">纯单机像素地牢 · 本地存档 · 无内购</text>
        <text class="disclaimer">免责声明：本作为《元气骑士》同人创作，仅供学习交流使用，非官方原版，与官方无关。</text>
      </div>
    </div>
    </scroller>
    <div v-if="confirmReset" class="mask">
      <div class="dialog">
        <text class="dialog-title">重置存档</text>
        <text class="dialog-text">将清空宝石、角色解锁、能力升级、成就与全部统计。</text>
        <text class="dialog-text">此操作无法撤销，确定继续吗？</text>
        <div class="dialog-btns">
          <div class="dialog-btn" @touchstart="cancelReset" @click="cancelReset" @tap="cancelReset">
            <text class="dialog-btn-text">取消</text>
          </div>
          <div class="dialog-btn-danger" @touchstart="doReset" @click="doReset" @tap="doReset">
            <text class="dialog-btn-danger-text">确认重置</text>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/*
 * 设置页：音效/自动瞄准/震屏/FPS 四个开关（即时生效并落盘）、重置存档（二次确认）、
 * 关于（版本/构建号/平台/逻辑屏幕/存储后端/日志路径）。
 * 开关状态写入 db.settings，游戏页通过 db.settings 读取；音效额外调 sound.setSoundOn。
 */
import { load, save, reset, storageKind } from '../../services/save.js'
import { setSoundOn, isSoundOn, loadSoundSetting, bgmPlay, bgmStop } from '../../services/sound.js'
import { nowVersion, buildCode, platform } from '../../res/version.js'
import { pageSize } from '../../services/screen.js'
import { loggerStatus } from '../../services/logger.js'
import { PETS, PET_ORDER } from '../../services/game/pets.js'

export default {
  data() {
    return {
      db: {
        gems: 0,
        unlockedChars: ['knight'],
        charUpgrades: {},
        unlockedWeapons: {},
        achievements: {},
        stats: {
          runs: 0, wins: 0, deaths: 0, kills: 0, bossKills: 0,
          bestFloor: 0, bestRoom: 0, totalGems: 0, playMs: 0, revives: 0
        },
        settings: { soundOn: true, autoAim: true, shake: true, showFps: false, debugInvincible: false },
        lastChar: 'knight'
      },
      soundOn: true,
      autoAim: true,
      shake: true,
      showFps: false,
      debugInvincible: false,
      debugCurrency: false,
      petId: 'random',
      petLabel: '随机',
      confirmReset: false,
      aboutRows: [],
      bodyH: 220,
      msg: ''
    }
  },
  methods: {
    _dedupe() {
      var now = Date.now()
      if (now - (this._lastTap || 0) < 250) return true
      this._lastTap = now
      return false
    },
    onShow() {
      try { var h = pageSize().h; this.bodyH = Math.max(140, h - Math.round(h * 0.17)) } catch (eB) { this.bodyH = 220 }
      try { loadSoundSetting() } catch (e0) {}
      try { this.loadDb() } catch (e1) {}
      try { this.rebuild() } catch (e2) {}
    },
    loadDb() {
      var self = this
      try {
        var mem = $falcon.__gameDb
        if (mem) {
          this.db = mem
          try { self.rebuild() } catch (e0) {}
        }
      } catch (e1) {}
      try {
        load().then(function (db) {
          if (!db) return
          self.db = db
          try { self.rebuild() } catch (e2) {}
        }, function () {})
      } catch (e3) {}
    },
    rebuild() {
      var db = this.db || {}
      var se = db.settings || {}
      this.autoAim = se.autoAim !== false
      this.shake = se.shake !== false
      this.showFps = !!se.showFps
      this.debugInvincible = se.debugInvincible === true
      this.debugCurrency = se.debugInfiniteCurrency === true
      if (this.debugCurrency) {
        if (!se.debugGemSnapshot) { se.debugGemSnapshot = db.gems || 0; this.db.settings.debugGemSnapshot = se.debugGemSnapshot }
        db.gems = 999999
      }
      this.petId = (typeof se.petId === 'string' && se.petId) ? se.petId : 'random'
      this.petLabel = this.petId === 'random' ? '随机' : ((PETS[this.petId] || {}).name || '随机')
      try { this.soundOn = isSoundOn() } catch (eS) { this.soundOn = se.soundOn !== false }
      this.aboutRows = this.buildAbout()
    },
    buildAbout() {
      var screenLine = '960 逻辑宽'
      try { screenLine = '960 × ' + pageSize().h + ' 逻辑像素' } catch (e0) {}
      var storeLine = '未知'
      try { storeLine = storageKind() } catch (e1) {}
      var logLine = '（未初始化）'
      try {
        var st = loggerStatus()
        logLine = (st && st.path) ? String(st.path) : '（未定）'
      } catch (e2) {}
      return [
        { label: '版本', value: 'v' + nowVersion },
        { label: '构建号', value: String(buildCode) },
        { label: '平台', value: String(platform) },
        { label: '逻辑屏幕', value: screenLine },
        { label: '存储后端', value: storeLine },
        { label: '日志路径', value: logLine }
      ]
    },
    saveDb() {
      try {
        var p = save(this.db)
        if (p && typeof p.then === 'function') p.then(function () {}, function () {})
      } catch (e) {}
    },
    setMsg(text) {
      var self = this
      var page = null
      try { page = this.$page } catch (e0) { page = null }
      if (page && this._msgTimer && typeof page.clearTimeout === 'function') {
        try { page.clearTimeout(this._msgTimer) } catch (e1) {}
      }
      this.msg = text
      var fn = function () {
        self.msg = ''
        self._msgTimer = null
      }
      /* 优先用页面托管定时器（页面卸载会自动释放）。两次尝试都不成立就只保留提示，不抛错 */
      try {
        if (page && typeof page.setTimeout === 'function') {
          this._msgTimer = page.setTimeout(fn, 2200)
          return
        }
      } catch (e2) {}
      try {
        if (typeof this.setTimeout === 'function') this._msgTimer = this.setTimeout(fn, 2200)
      } catch (e3) {}
    },
    toggleSound() {
      if (this._dedupe()) return
      this.soundOn = !this.soundOn
      try { setSoundOn(this.soundOn) } catch (e0) {}
      try {
        if (!this.db.settings) this.db.settings = {}
        this.db.settings.soundOn = this.soundOn
        this.saveDb()
      } catch (e1) {}
      try {
        if (this.soundOn) bgmPlay('lobby', 0.55)
        else bgmStop()
      } catch (e2) {}
    },
    toggleAim() {
      if (this._dedupe()) return
      this.autoAim = !this.autoAim
      try {
        if (!this.db.settings) this.db.settings = {}
        this.db.settings.autoAim = this.autoAim
        this.saveDb()
      } catch (e) {}
    },
    cyclePet() {
      if (this._dedupe()) return
      var list = ['random'].concat(PET_ORDER)
      var idx = list.indexOf(this.petId)
      if (idx < 0) idx = 0
      this.petId = list[(idx + 1) % list.length]
      this.petLabel = this.petId === 'random' ? '随机' : ((PETS[this.petId] || {}).name || '随机')
      try {
        if (!this.db.settings) this.db.settings = {}
        this.db.settings.petId = this.petId
        this.saveDb()
      } catch (e) {}
    },
    toggleShake() {
      if (this._dedupe()) return
      this.shake = !this.shake
      try {
        if (!this.db.settings) this.db.settings = {}
        this.db.settings.shake = this.shake
        this.saveDb()
      } catch (e) {}
    },
    toggleFps() {
      if (this._dedupe()) return
      this.showFps = !this.showFps
      try {
        if (!this.db.settings) this.db.settings = {}
        this.db.settings.showFps = this.showFps
        this.saveDb()
      } catch (e) {}
    },
    toggleDebug() {
      if (this._dedupe()) return
      this.debugInvincible = !this.debugInvincible
      try {
        if (!this.db.settings) this.db.settings = {}
        this.db.settings.debugInvincible = this.debugInvincible
        this.saveDb()
      } catch (e) {}
    },
    toggleDebugCurrency() {
      if (this._dedupe()) return
      this.debugCurrency = !this.debugCurrency
      try {
        if (!this.db.settings) this.db.settings = {}
        this.db.settings.debugInfiniteCurrency = this.debugCurrency
        if (this.debugCurrency) {
          if (!this.db.settings.debugGemSnapshot) this.db.settings.debugGemSnapshot = this.db.gems || 0
          this.db.gems = 999999
        } else {
          this.db.gems = this.db.settings.debugGemSnapshot || 0
          this.db.settings.debugGemSnapshot = 0
        }
        this.saveDb()
      } catch (e) {}
    },
    askReset() {
      if (this._dedupe()) return
      this.confirmReset = true
    },
    cancelReset() {
      if (this._dedupe()) return
      this.confirmReset = false
    },
    /* 二次确认后真正重置：save.reset() 会把 $falcon.__gameDb 也换成新档 */
    doReset() {
      if (this._dedupe()) return
      var self = this
      this.confirmReset = false
      try {
        reset().then(function () {
          return load()
        }).then(function (db) {
          self.db = db
          try { self.rebuild() } catch (e1) {}
          try { setSoundOn(true) } catch (e2) {}
          try { bgmPlay('lobby', 0.55) } catch (e3) {}
          self.setMsg('存档已重置')
        }, function () {
          self.setMsg('重置失败，请重试')
        })
      } catch (e) {
        this.setMsg('重置失败，请重试')
      }
    },
    goBack() {
      if (this._dedupe()) return
      try {
        this.$page.finish()
      } catch (e) {
        try { $falcon.navTo('index', {}) } catch (e2) {}
      }
    },
  },
}
</script>

<style>
.page { width: 960px; width: 100vw; height: 100%; height: 100vh; position: relative; overflow: hidden; flexDirection: column; backgroundColor: #14121c; }
.bg { position: absolute; left: 0; top: 0; width: 100vw; height: 100vh; backgroundColor: #14121c; }
.topbar { position: relative; width: 100vw; height: 12vh; flexDirection: row; alignItems: center; paddingLeft: 1.6vw; paddingRight: 1.6vw; borderBottomWidth: 2px; borderBottomColor: #2a2438; }
.back-btn { width: 9vw; height: 9vh; backgroundColor: #241e36; borderWidth: 2px; borderColor: #4a3f68; borderRadius: 0.8vh; alignItems: center; justifyContent: center; marginRight: 1.2vw; }
.back-text { fontSize: 4.8vh; color: #d8d3ea; }
.title { fontSize: 7.2vh; fontWeight: 700; color: #ffd93d; }
.subtitle { fontSize: 4.4vh; color: #7d7893; marginLeft: 0.9vw; marginTop: 0.9vh; }
.msg-bar { position: absolute; left: 30vw; top: 13vh; width: 40vw; height: 7vh; backgroundColor: rgba(0,0,0,0.88); borderRadius: 0.8vh; alignItems: center; justifyContent: center; zIndex: 95; }
.msg-text { fontSize: 4.3vh; color: #ffd93d; }
.body-scroller { width: 100vw; }
.body { position: relative; flexDirection: row; paddingLeft: 1.5vw; paddingRight: 1.5vw; paddingTop: 1.4vh; paddingBottom: 1.2vh; }
.left-panel { width: 47vw; flexDirection: column; marginRight: 1.4vw; }
.right-panel { flex: 1; flexDirection: column; backgroundColor: #1b1726; borderWidth: 2px; borderColor: #3a3352; borderRadius: 1vh; paddingTop: 1.2vh; paddingBottom: 1.2vh; paddingLeft: 1.2vw; paddingRight: 1.2vw; }
.panel-title { fontSize: 1.76vw; fontWeight: 700; color: #ffd93d; marginBottom: 0.9vh; marginTop: 0.6vh; }
.set-row { width: 100%; height: auto; paddingTop: 0.8vh; paddingBottom: 0.8vh; flexDirection: row; alignItems: center; backgroundColor: #1b1726; borderWidth: 2px; borderColor: #3a3352; borderRadius: 0.8vh; paddingLeft: 1vw; paddingRight: 1vw; marginBottom: 1vh; }
.set-label { fontSize: 1.78vw; color: #e8e4f5; flex: 1; }
.switch-btn { width: 12vw; height: 10vh; borderRadius: 0.8vh; alignItems: center; justifyContent: center; borderWidth: 2px; }
.switch-on { backgroundColor: #2b2313; borderColor: #ffd93d; }
.switch-off { backgroundColor: #241e36; borderColor: #4a3f68; }
.switch-text { fontSize: 5.2vh; fontWeight: 700; color: #ffd93d; }
.danger-btn { width: 100%; height: 11vh; backgroundColor: #3a1a1e; borderWidth: 2px; borderColor: #ff5a5a; borderRadius: 0.8vh; alignItems: center; justifyContent: center; }
.danger-text { fontSize: 6vh; fontWeight: 700; color: #ff8a8a; }
.danger-hint { fontSize: 1.4vw; color: #8f89a8; marginTop: 0.8vh; marginBottom: 0.6vh; }
.about-row { width: 100%; height: auto; paddingTop: 0.7vh; paddingBottom: 0.7vh; flexDirection: row; alignItems: center; backgroundColor: #201a2e; borderRadius: 0.6vh; paddingLeft: 0.8vw; paddingRight: 0.8vw; marginBottom: 0.7vh; }
.about-label { width: 8vw; fontSize: 1.55vw; color: #8f89a8; }
.about-value { flex: 1; fontSize: 1.47vw; color: #e8e4f5; }
.about-tip { fontSize: 1.4vw; color: #6b6880; marginTop: 0.8vh; marginBottom: 0.8vh; }
  .disclaimer { width: 100%; fontSize: 1.25vw; color: #8f86a8; marginTop: 1.2vh; marginBottom: 1.2vh; }
.mask { position: absolute; left: 0; top: 0; width: 100vw; height: 100vh; backgroundColor: rgba(0,0,0,0.86); alignItems: center; justifyContent: center; zIndex: 120; }
.dialog { width: 56vw; backgroundColor: #1b1726; borderWidth: 3px; borderColor: #ff5a5a; borderRadius: 1.2vh; paddingTop: 1.6vh; paddingBottom: 1.6vh; paddingLeft: 1.4vw; paddingRight: 1.4vw; flexDirection: column; }
.dialog-title { fontSize: 7vh; fontWeight: 700; color: #ff8a8a; marginBottom: 1vh; }
.dialog-text { fontSize: 5vh; color: #d8d3ea; lineHeight: 7vh; }
.dialog-btns { flexDirection: row; marginTop: 1.6vh; }
.dialog-btn { flex: 1; height: 10vh; backgroundColor: #241e36; borderWidth: 2px; borderColor: #4a3f68; borderRadius: 0.8vh; alignItems: center; justifyContent: center; marginRight: 1vw; }
.dialog-btn-text { fontSize: 5.5vh; color: #d8d3ea; }
.dialog-btn-danger { flex: 1; height: 10vh; backgroundColor: #5a1f24; borderWidth: 2px; borderColor: #ff5a5a; borderRadius: 0.8vh; alignItems: center; justifyContent: center; }
.dialog-btn-danger-text { fontSize: 5.5vh; fontWeight: 700; color: #ffd3d3; }
</style>
