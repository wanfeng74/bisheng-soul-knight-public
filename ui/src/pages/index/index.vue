<template>
  <div class="page">
    <div class="bg"></div>
    <div class="topbar">
      <text class="title">笔上元气骑士</text>
      <text class="subtitle">四大章节 · 二十层地牢</text>
      <div class="topright">
        <div class="gem-box">
          <div class="gem-icon"></div>
          <text class="gem-text">{{ db.gems }}</text>
        </div>
        <div class="sound-btn" @touchstart="toggleSound" @click="toggleSound" @tap="toggleSound">
          <text class="sound-text">音效 {{ soundOn ? '开' : '关' }}</text>
        </div>
        <text class="version-text">v{{ version }}</text>
      </div>
    </div>
    <div v-if="msg" class="msg-bar">
      <text class="msg-text">{{ msg }}</text>
    </div>
    <div class="main" :style="{ height: mainH + 'px' }">
      <scroller class="left-scroller" :style="{ height: mainH + 'px' }" scrollDirection="vertical">
        <div class="left-card">
          <div class="portrait-box">
            <image class="portrait-img" :key="portraitPath" :src="portraitPath" mode="aspectFit"></image>
          </div>
          <text class="char-name">{{ char.name }}</text>
          <text class="char-title">{{ char.title }}</text>
          <div class="attr-row">
            <div v-for="(a, ai) in attrRows" :key="'at' + ai" class="attr-chip">
              <text class="attr-label">{{ a.label }}</text>
              <text class="attr-value">{{ a.value }}</text>
            </div>
          </div>
          <div class="skill-box">
            <text class="skill-name">技能 · {{ skillName }}</text>
            <text class="skill-desc">{{ skillDesc }}</text>
            <text class="skill-cd">冷却 {{ skillCd }} 秒</text>
          </div>
          <div class="weapon-row">
            <text class="weapon-label">起始武器</text>
            <text class="weapon-name" :style="{ color: starterColor }">{{ starterName }}</text>
          </div>
        </div>
      </scroller>
      <scroller class="right-scroller" :style="{ height: mainH + 'px' }" scrollDirection="vertical">
      <div class="right-col">
        <div class="record-panel">
          <div class="panel-head">
            <text class="panel-title">最佳记录</text>
            <text class="panel-sub">冒险 {{ db.stats.runs }} 次 · 通关 {{ db.stats.wins }} 次</text>
          </div>
          <div class="record-grid">
            <div v-for="(s, si) in statRows" :key="'st' + si" class="record-card">
              <text class="record-label">{{ s.label }}</text>
              <text class="record-value">{{ s.value }}</text>
            </div>
          </div>
        </div>
        <div class="start-btn" @touchstart="startRun" @click="startRun" @tap="startRun">
          <text class="start-text">开始冒险</text>
        </div>
        <div v-if="hasRunSave" class="continue-btn" @touchstart="continueRun" @click="continueRun" @tap="continueRun">
          <text class="continue-text">继续冒险 · 第 {{ runSaveFloor }} 层</text>
        </div>
        <div class="nav-row">
          <div class="nav-btn" @touchstart="goCharacters" @click="goCharacters" @tap="goCharacters">
            <text class="nav-text">角色</text>
          </div>
          <div class="nav-btn" @touchstart="goCodex" @click="goCodex" @tap="goCodex">
            <text class="nav-text">图鉴</text>
          </div>
          <div class="nav-btn" @touchstart="goSettings" @click="goSettings" @tap="goSettings">
            <text class="nav-text">设置</text>
          </div>
        </div>
        <div class="tips-panel">
            <text class="tips-title">冒险提示</text>
            <text class="tips-line">四大章节、二十层，每五层一位首领</text>
            <text class="tips-line">清空房间、开启宝箱、在商店补给，击败首领后由传送门进入下一层</text>
            <text class="tips-line">倒下也会带回宝石：回大厅解锁新角色、升级六项能力</text>
          </div>
      </div>
      </scroller>
    </div>
    <div v-if="updOpen" class="upd-mask">
      <div class="upd-panel">
        <text class="upd-title">{{ updCfg.title }}</text>
        <text class="upd-ver">{{ updMeta() }}</text>
        <scroller class="upd-scroller" :style="{ height: updScrollH + 'px' }" scrollDirection="vertical">
          <text class="upd-notes">{{ updInfo.notes || '本次更新没有提供说明' }}</text>
        </scroller>
        <text v-if="updHint" class="upd-hint">{{ updHint }}</text>
        <div class="upd-btns">
          <div v-if="updCfg.closable && !updBusy" class="upd-btn-ghost" @touchstart="closeUpdate" @click="closeUpdate" @tap="closeUpdate">
            <text class="upd-btn-ghost-text">{{ updCfg.secondary }}</text>
          </div>
          <div class="upd-btn" @touchstart="startUpdate" @click="startUpdate" @tap="startUpdate">
            <text class="upd-btn-text">{{ updBusy ? '更新中…' : updCfg.primary }}</text>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/*
 * 大厅页：展示当前角色三件套（立绘/属性/技能/起始武器）+ 最佳记录 + 三个入口。
 * 数据全部来自 save.js 的存档；开局参数写 $falcon.__gameRun，由 game.vue 读取。
 * 布局：纵向 100vh 分段（顶栏 10vh + 主区 flex），横向用 vw 定宽，字号用 vw，
 * 保证 960 宽、240~576 逻辑高都不裁切（主区高度为 flex，内容按 vh 分配）。
 */
import { load, save } from '../../services/save.js'
import { bgmPlay, bgmStop, setSoundOn, isSoundOn, loadSoundSetting } from '../../services/sound.js'
import { nowVersion } from '../../res/version.js'
import { pageSize } from '../../services/screen.js'
import { checkUpdate as fetchAppUpdate, downloadUpdate, installUpdate, autoInstallCapable, fmtSize } from '../../services/update.js'
import { CHARACTERS, charStats } from '../../services/game/characters.js'
import { WEAPONS } from '../../services/game/weapons.js'
import { RARITY } from '../../services/game/constants.js'

export default {
  data() {
    return {
      /* 存档初值必须写全：首帧渲染时 load() 还没回来，模板也不能访问 undefined */
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
        settings: { soundOn: true, autoAim: true, shake: true, showFps: false },
        lastChar: 'knight'
      },
      soundOn: true,
      version: nowVersion,
      charId: 'knight',
      charMark: '骑',
      portraitPath: 'assets/portraits/knight_wiki.png',
      char: { name: '骑士', title: '双持剑士', color: '#c9c9d8' },
      attrRows: [],
      statRows: [],
      skillName: '双持',
      skillDesc: '',
      skillCd: 12,
      starterName: '旧式手枪',
      starterColor: '#c8ccd4',
      mainH: 240,
      tipsH: 100,
      hasRunSave: false,
      runSaveFloor: 1,
      updOpen: false,
      updBusy: false,
      updHint: '',
      updInfo: { version: '', notes: '', size: 0, url: '', md5: '' },
      updCfg: { title: '发现新版本', desc: '', primary: '立即更新', secondary: '稍后', closable: true },
      updScrollH: 80,
      updChecking: false,
      updLastCheck: 0,
      msg: ''
    }
  },
  methods: {
    /* 一次物理点击会连着触发 touchstart/click/tap，改数据的操作必须去重 */
    _dedupe() {
      var now = Date.now()
      if (now - (this._lastTap || 0) < 250) return true
      this._lastTap = now
      return false
    },
    /* 页面生命周期钩子必须写在 methods 内；每段逻辑独立 try/catch，一处失败不影响其它 */
    onShow() {
      try {
        var h = pageSize().h
        this.mainH = Math.max(150, h - Math.round(h * 0.15))
        this.tipsH = Math.max(64, Math.round(h * 0.26))
      } catch (e0) { this.mainH = 240; this.tipsH = 100 }
      try { loadSoundSetting() } catch (e1) {}
      try { this.soundOn = isSoundOn() } catch (e2) {}
      try { this.playBgm() } catch (e3) {}
      try { this.loadDb() } catch (e4) {}
      try { this.rebuild() } catch (e5) {}
      var _self = this
      setTimeout(function () {
        try { _self.loadDb(); _self.rebuild() } catch (e7) {}
      }, 180)
      try { this.checkAppUpdate(true) } catch (e6) {}
    },
    updMeta() {
      var i = this.updInfo || {}
      var bits = []
      if (i.version) bits.push('v' + i.version)
      if (i.size) bits.push(fmtSize(i.size))
      return bits.join(' · ')
    },
    /* 自动检查更新：进大厅检查一次；10 分钟内不重复检查。
     * 版本从包名解析（0.1.9），不直接拿服务端 1.1.x 通道版本和 0.1.x 比。 */
    checkAppUpdate(silent) {
      if (this.updChecking) return
      var now = Date.now()
      if (silent && this.updLastCheck && now - this.updLastCheck < 10 * 60 * 1000) return
      this.updLastCheck = now
      this.updChecking = true
      var self = this
      try {
        fetchAppUpdate().then(function (r) {
          self.updChecking = false
          if (!r || !r.ok || !r.hasUpdate || !r.latest) return
          var skip = ''
          try { skip = String((self.db.settings && self.db.settings.updateSkipVer) || '') } catch (e0) {}
          if (!r.forced && skip && skip === String(r.latest.version || '')) return
          self.updInfo = r.latest
          self.updScrollH = Math.max(60, Math.round((pageSize().h || 287) * 0.30))
          self.updCfg = {
            title: r.forced ? '必须更新' : '发现新版本',
            desc: r.forced ? '本次更新包含重要修复，需要更新后才能继续游戏。' : '有新版本可用，建议立即更新。',
            primary: '立即更新',
            secondary: '稍后',
            closable: !r.forced
          }
          self.updOpen = true
          self.updBusy = false
          self.updHint = autoInstallCapable() ? '' : '当前固件不支持自动安装，请前往应用商店更新'
        }, function () { self.updChecking = false })
      } catch (e) { this.updChecking = false }
    },
    closeUpdate() {
      if (!this.updCfg.closable || this.updBusy) return
      try {
        if (!this.db.settings) this.db.settings = {}
        this.db.settings.updateSkipVer = String(this.updInfo.version || '')
      } catch (e) {}
      this.saveDb()
      this.updOpen = false
    },
    startUpdate() {
      if (this.updBusy) return
      if (!autoInstallCapable()) {
        this.updHint = '当前固件不支持自动安装，请前往应用商店更新'
        return
      }
      var self = this
      var info = this.updInfo
      this.updBusy = true
      this.updHint = '正在下载 v' + info.version + '…'
      try {
        downloadUpdate(info).then(function (r) {
          if (!r || !r.ok) {
            self.updBusy = false
            self.updHint = '下载失败：' + ((r && r.error) || 'unknown')
            return
          }
          self.updHint = '下载完成，正在安装…'
          return installUpdate(info, r.path).then(function (s) {
            if (s && s.ok) {
              self.updHint = '安装完成，正在重启…'
            } else {
              self.updBusy = false
              self.updHint = '安装失败：' + ((s && s.stage) || 'install')
            }
          }, function (e) {
            self.updBusy = false
            self.updHint = '安装异常：' + ((e && e.message) || e)
          })
        }, function (e) {
          self.updBusy = false
          self.updHint = '下载异常：' + ((e && e.message) || e)
        })
      } catch (e) {
        this.updBusy = false
        this.updHint = '更新异常：' + ((e && e.message) || e)
      }
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
    /* 把存档翻译成模板要用的展示数据（角色名/属性/技能/起始武器/记录卡片） */
    rebuild() {
      var db = this.db || {}
      if (db.settings) this.soundOn = db.settings.soundOn !== false
      var cid = db.lastChar || 'knight'
      var c = (CHARACTERS && CHARACTERS[cid]) || (CHARACTERS && CHARACTERS.knight) || {}
      var up = (db.charUpgrades && db.charUpgrades[cid]) || {}
      var st = null
      try { st = charStats(cid, up) } catch (e0) { st = null }
      var hp = (st && typeof st.maxHp === 'number') ? st.maxHp : (c.hp || 0)
      var armor = (st && typeof st.maxArmor === 'number') ? st.maxArmor : (c.armor || 0)
      var energy = (st && typeof st.maxEnergy === 'number') ? st.maxEnergy : (c.energy || 0)
      var crit = (st && typeof st.crit === 'number') ? st.crit : (c.crit || 0)
      var speed = (st && typeof st.speed === 'number') ? st.speed : (c.speed || 1)
      this.charId = cid
      var rs = db.runSave
      this.hasRunSave = !!(rs && rs.characterId && rs.seed)
      this.runSaveFloor = (rs && Number(rs.floorIndex)) || 1
      this.char = {
        name: c.name || cid,
        title: c.title || '',
        color: c.color || '#c9c9d8'
      }
      this.charMark = String(c.name || cid).charAt(0) || '?'
      this.portraitPath = 'assets/portraits/' + cid + '_wiki.png'
      this.attrRows = [
        { label: '生命', value: String(hp) },
        { label: '护甲', value: String(armor) },
        { label: '能量', value: String(energy) },
        { label: '暴击', value: crit + '%' },
        { label: '移速', value: Math.round(speed * 100) + '%' }
      ]
      var sk = c.skill || {}
      this.skillName = sk.name || '未知技能'
      this.skillDesc = sk.desc || ''
      this.skillCd = (typeof sk.cd === 'number') ? sk.cd : 0
      var w = {}
      try { w = (WEAPONS && WEAPONS[c.starterWeapon]) || {} } catch (e1) { w = {} }
      this.starterName = w.name || '—'
      var rar = (RARITY && w.rarity) ? RARITY[w.rarity] : null
      this.starterColor = (rar && rar.color) ? rar.color : '#c8ccd4'
      var stats = db.stats || {}
      this.statRows = [
        { label: '最佳层数', value: stats.bestFloor > 0 ? stats.bestFloor + ' 层' : '—' },
        { label: '最远房间', value: stats.bestRoom > 0 ? String(stats.bestRoom) : '—' },
        { label: '累计击杀', value: String(stats.kills || 0) },
        { label: '首领击杀', value: String(stats.bossKills || 0) },
        { label: '累计宝石', value: String(stats.totalGems || 0) },
        { label: '游戏时长', value: this.fmtDur(stats.playMs || 0) }
      ]
    },
    fmtDur(ms) {
      var n = Number(ms) || 0
      if (n <= 0) return '—'
      var min = Math.floor(n / 60000)
      var hour = Math.floor(min / 60)
      if (hour > 0) return hour + ' 时 ' + (min % 60) + ' 分'
      if (min > 0) return min + ' 分'
      return '<1 分'
    },
    playBgm() {
      try {
        if (this.soundOn) bgmPlay('lobby', 0.55)
      } catch (e) {}
    },
    saveDb() {
      try {
        var p = save(this.db)
        if (p && typeof p.then === 'function') p.then(function () {}, function () {})
      } catch (e) {}
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
    startRun() {
      if (this._dedupe()) return
      try {
        var cid = this.charId || this.db.lastChar || 'knight'
        /* 新开一局：清掉旧的层内检查点 */
        try { this.db.runSave = null; this.saveDb() } catch (e0) {}
        $falcon.__gameRun = { characterId: cid, seed: Date.now(), resume: null }
        $falcon.navTo('game', {})
      } catch (e) {
        this.setMsg('进入地牢失败，请重试')
      }
    },
    continueRun() {
      if (this._dedupe()) return
      var rs = this.db && this.db.runSave
      if (!rs || !rs.characterId) { this.setMsg('没有可继续的存档'); return }
      try {
        $falcon.__gameRun = { characterId: rs.characterId, seed: rs.seed, resume: rs }
        $falcon.navTo('game', {})
      } catch (e) { this.setMsg('继续冒险失败，请重试') }
    },
    goCharacters() {
      if (this._dedupe()) return
      try { $falcon.navTo('characters', {}) } catch (e) { this.setMsg('页面打开失败') }
    },
    goCodex() {
      if (this._dedupe()) return
      try { $falcon.navTo('codex', {}) } catch (e) { this.setMsg('页面打开失败') }
    },
    goSettings() {
      if (this._dedupe()) return
      try { $falcon.navTo('settings', {}) } catch (e) { this.setMsg('页面打开失败') }
    },
  },
}
</script>

<style>
.page { width: 960px; width: 100vw; height: 100%; height: 100vh; position: relative; overflow: hidden; flexDirection: column; backgroundColor: #14121c; }
.bg { position: absolute; left: 0; top: 0; width: 100vw; height: 100vh; backgroundColor: #14121c; }
.topbar { position: relative; width: 100vw; height: 12vh; flexDirection: row; alignItems: center; paddingLeft: 1.6vw; paddingRight: 1.6vw; borderBottomWidth: 2px; borderBottomColor: #2a2438; }
.title { fontSize: 7.5vh; fontWeight: 700; color: #ffd93d; letterSpacing: 0.1vw; }
.subtitle { fontSize: 2.8vh; color: #8d88a5; marginLeft: 1vw; marginTop: 2vh; }
.topright { flexDirection: row; alignItems: center; marginLeft: auto; }
.gem-box { height: 9vh; flexDirection: row; alignItems: center; backgroundColor: #241d14; borderWidth: 2px; borderColor: #ffd93d; borderRadius: 0.8vh; paddingLeft: 0.9vw; paddingRight: 1vw; marginRight: 1vw; }
.gem-icon { width: 1.8vw; height: 1.8vw; backgroundColor: #ffd93d; borderRadius: 0.8vh; marginRight: 0.5vw; }
.gem-text { fontSize: 4.6vh; fontWeight: 700; color: #ffd93d; }
.sound-btn { width: 14vw; height: 9vh; backgroundColor: #241e36; borderWidth: 2px; borderColor: #6b5e8a; borderRadius: 0.8vh; alignItems: center; justifyContent: center; }
.sound-text { fontSize: 4.5vh; color: #d8d3ea; }
.version-text { fontSize: 1.2vw; color: #8b86a0; marginLeft: 1vw; }
.msg-bar { position: absolute; left: 28vw; top: 13vh; width: 44vw; height: 7vh; backgroundColor: rgba(0,0,0,0.9); borderRadius: 0.8vh; alignItems: center; justifyContent: center; zIndex: 90; }
.msg-text { fontSize: 4.3vh; color: #ffd93d; }
.main { position: relative; flex: 1; flexDirection: row; paddingLeft: 1.5vw; paddingRight: 1.5vw; paddingTop: 1.2vh; paddingBottom: 1.2vh; overflow: hidden; }
.left-scroller { width: 33vw; marginRight: 1.2vw; }
.left-card { width: 100%; flexDirection: column; backgroundColor: #1b1726; borderWidth: 2px; borderColor: #3a3352; borderRadius: 1vh; paddingTop: 1.2vh; paddingBottom: 1.2vh; paddingLeft: 1vw; paddingRight: 1vw; }
.portrait-box { position: relative; width: 26vh; height: 34vh; alignSelf: center; backgroundColor: #221c31; borderWidth: 2px; borderColor: #4a3f68; borderRadius: 1vh; alignItems: center; justifyContent: center; overflow: hidden; marginBottom: 1vh; }
.portrait-mark { fontSize: 5vw; fontWeight: 700; color: #2e2740; }
.portrait-img { position: absolute; left: 0; top: 0; width: 100%; height: 100%; }
.char-name { fontSize: 2.6vw; fontWeight: 700; color: #f2effa; marginBottom: 0.4vh; }
.char-title { fontSize: 1.6vw; color: #aaa4c2; }
.attr-row { flexDirection: row; flexWrap: wrap; marginTop: 1.2vh; }
.attr-chip { width: 9.4vw; height: auto; paddingTop: 0.5vh; paddingBottom: 0.5vh; backgroundColor: #241e36; borderRadius: 0.6vh; flexDirection: column; alignItems: center; justifyContent: center; marginRight: 0.5vw; marginBottom: 0.5vh; }
.attr-label { fontSize: 1.3vw; color: #9b95b5; lineHeight: 5.2vh; }
.attr-value { fontSize: 1.7vw; fontWeight: 700; color: #ffd93d; lineHeight: 6.2vh; }
.skill-box { width: 100%; backgroundColor: #201a2e; borderWidth: 2px; borderColor: #3a3352; borderRadius: 0.8vh; paddingTop: 0.8vh; paddingBottom: 0.8vh; paddingLeft: 0.8vw; paddingRight: 0.8vw; flexDirection: column; marginTop: 1vh; }
.skill-name { fontSize: 1.8vw; fontWeight: 700; color: #ffd93d; }
.skill-desc { fontSize: 1.45vw; color: #c3bed7; marginTop: 0.5vh; lineHeight: 6.6vh; }
.skill-cd { fontSize: 1.4vw; color: #8d88a5; marginTop: 0.5vh; }
.weapon-row { width: 100%; height: auto; paddingTop: 0.8vh; paddingBottom: 0.8vh; flexDirection: row; alignItems: center; backgroundColor: #241e36; borderRadius: 0.6vh; paddingLeft: 0.8vw; paddingRight: 0.8vw; marginTop: 1vh; }
.weapon-label { fontSize: 1.4vw; color: #9b95b5; marginRight: 0.6vw; }
.weapon-name { fontSize: 1.6vw; fontWeight: 700; color: #c8ccd4; }
.right-scroller { width: 63vw; }
.right-col { width: 100%; flexDirection: column; }
.record-panel { width: 100%; height: auto; backgroundColor: #1b1726; borderWidth: 2px; borderColor: #3a3352; borderRadius: 1vh; paddingTop: 1vh; paddingBottom: 1vh; paddingLeft: 1vw; paddingRight: 1vw; flexDirection: column; }
.panel-head { flexDirection: row; alignItems: center; height: auto; marginBottom: 0.6vh; }
.panel-title { fontSize: 1.8vw; fontWeight: 700; color: #ffd93d; }
.panel-sub { fontSize: 1.4vw; color: #8d88a5; marginLeft: auto; }
.record-grid { flex: 1; flexDirection: row; flexWrap: wrap; alignContent: center; }
.record-card { width: 30%; height: auto; paddingTop: 0.7vh; paddingBottom: 0.7vh; backgroundColor: #241e36; borderWidth: 2px; borderColor: #35304a; borderRadius: 0.8vh; flexDirection: column; alignItems: center; justifyContent: center; marginRight: 1vw; marginBottom: 0.6vh; }
.record-label { fontSize: 1.35vw; color: #9b95b5; }
.record-value { fontSize: 1.9vw; fontWeight: 700; color: #ffd93d; marginTop: 0.3vh; }
.start-btn { width: 100%; height: 14vh; marginTop: 1vh; backgroundColor: #ffd93d; borderWidth: 2px; borderColor: #fff1a8; borderRadius: 1vh; alignItems: center; justifyContent: center; }
.start-text { fontSize: 6.8vh; fontWeight: 700; color: #2a2205; letterSpacing: 0.2vw; lineHeight: 8vh; }
.continue-btn { width: 100%; height: 12vh; marginTop: 1vh; backgroundColor: #2b3a24; borderWidth: 2px; borderColor: #7ee787; borderRadius: 1vh; alignItems: center; justifyContent: center; }
.continue-text { fontSize: 5.6vh; fontWeight: 700; color: #7ee787; lineHeight: 6.8vh; }
.nav-row { width: 100%; height: 12vh; flexDirection: row; marginTop: 1vh; }
.nav-btn { flex: 1; height: 12vh; backgroundColor: #241e36; borderWidth: 2px; borderColor: #4a3f68; borderRadius: 0.9vh; alignItems: center; justifyContent: center; marginRight: 1vw; }
.nav-text { fontSize: 4.8vh; fontWeight: 700; color: #e8e4f5; lineHeight: 6vh; }
.tips-scroller { width: 100%; marginTop: 1vh; }
.tips-panel { width: 100%; backgroundColor: #191523; borderWidth: 2px; borderColor: #2c2640; borderRadius: 1vh; paddingTop: 1vh; paddingBottom: 1vh; paddingLeft: 1.2vw; paddingRight: 1.2vw; flexDirection: column; }
.tips-title { fontSize: 1.6vw; fontWeight: 700; color: #ffd93d; marginBottom: 0.6vh; }
.tips-line { fontSize: 1.35vw; color: #b7b2cc; marginBottom: 0.8vh; }
.upd-mask { position: absolute; left: 0; top: 0; width: 100vw; height: 100vh; backgroundColor: rgba(4,6,10,0.9); alignItems: center; justifyContent: center; zIndex: 200; }
.upd-panel { width: 72vw; backgroundColor: #1b1726; borderWidth: 3px; borderColor: #ffd93d; borderRadius: 1.2vh; paddingTop: 1.6vh; paddingBottom: 1.6vh; paddingLeft: 2vw; paddingRight: 2vw; flexDirection: column; alignItems: center; }
.upd-title { fontSize: 7vh; fontWeight: 700; color: #ffd93d; lineHeight: 8.4vh; }
.upd-ver { fontSize: 4.8vh; color: #c9c9d8; marginTop: 0.4vh; lineHeight: 6vh; }
.upd-scroller { width: 64vw; marginTop: 1vh; backgroundColor: #14121c; borderRadius: 0.8vh; }
.upd-notes { width: 64vw; fontSize: 5vh; color: #e8e4f5; lineHeight: 7vh; paddingLeft: 1vw; paddingRight: 1vw; paddingTop: 0.6vh; }
.upd-hint { width: 64vw; textAlign: center; fontSize: 4.8vh; color: #7ee787; marginTop: 1vh; lineHeight: 6.4vh; }
.upd-btns { width: 64vw; flexDirection: row; marginTop: 1.2vh; }
.upd-btn { flex: 1; height: 12vh; backgroundColor: #ffd93d; borderWidth: 2px; borderColor: #fff1a8; borderRadius: 1vh; alignItems: center; justifyContent: center; marginLeft: 1vw; }
.upd-btn-text { fontSize: 6vh; fontWeight: 700; color: #2a2205; lineHeight: 7.2vh; }
.upd-btn-ghost { flex: 1; height: 12vh; backgroundColor: #241e36; borderWidth: 2px; borderColor: #6b5e8a; borderRadius: 1vh; alignItems: center; justifyContent: center; }
.upd-btn-ghost-text { fontSize: 5.5vh; color: #d8d3ea; lineHeight: 6.6vh; }
</style>
