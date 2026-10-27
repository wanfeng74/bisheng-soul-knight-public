<template>
  <div class="page">
    <div class="bg"></div>
    <div class="content">
      <div class="head">
        <text :class="outcomeOk ? 'out-win' : 'out-lose'">{{ outcomeText }}</text>
        <text class="head-sub">{{ headSub }}</text>
      </div>
      <div v-if="!hasResult" class="empty-box">
        <text class="empty-text">没有读取到本局结算数据</text>
        <text class="empty-text">请回到大厅重新开始冒险</text>
      </div>
      <div v-else class="body" :style="{ height: bodyH + 'px' }">
        <scroller class="left-panel" :style="{ height: bodyH + 'px' }" scrollDirection="vertical">
          <text class="panel-title">本局战绩</text>
          <div class="stat-grid">
            <div v-for="(s, si) in statRows" :key="'sr' + si" class="stat-card">
              <text class="stat-label">{{ s.label }}</text>
              <text class="stat-value">{{ s.value }}</text>
            </div>
          </div>
        </scroller>
        <div class="right-panel" :style="{ height: bodyH + 'px' }">
          <div class="gem-panel">
            <text class="gem-title">宝石结算</text>
            <text class="gem-add">+{{ gemEarned }}</text>
            <text class="gem-total">当前宝石 {{ gemTotal }}</text>
          </div>
          <scroller class="record-scroller" :style="{ height: recordH + 'px' }" scrollDirection="vertical">
            <div class="record-panel">
              <text class="record-title">{{ recordTitle }}</text>
              <text class="record-text">{{ recordText }}</text>
              <text v-if="achNames.length" class="ach-title">新成就</text>
              <text v-for="(a, ai) in achNames" :key="'ach' + ai" class="ach-item">· {{ a }}</text>
              <text v-if="achMore" class="ach-more">{{ achMore }}</text>
            </div>
          </scroller>
        </div>
      </div>
      <div class="btn-row">
        <div class="btn-again" @touchstart="playAgain" @click="playAgain" @tap="playAgain">
          <text class="btn-again-text">再来一局</text>
        </div>
        <div class="btn-normal" @touchstart="goLobby" @click="goLobby" @tap="goLobby">
          <text class="btn-normal-text">回大厅</text>
        </div>
        <div class="btn-normal" @touchstart="goCharacters" @click="goCharacters" @tap="goCharacters">
          <text class="btn-normal-text">角色页</text>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/*
 * 结算页：只读显示 $falcon.__gameResult（统计/宝石/新纪录/新成就），
 * 宝石与成就在 game.vue 里已由 meta.applyRunResult 写入存档，本页不再重复结算。
 * game.vue 会在 result 上补 newAchievements（成就 id 数组）与
 * records（{newBestFloor,newBestRoom,newBestKills,newBestTime} 布尔），缺字段时自动降级。
 */
import { load } from '../../services/save.js'
import { pageSize } from '../../services/screen.js'
import { ACHIEVEMENTS } from '../../services/game/meta.js'

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
        settings: { soundOn: true, autoAim: true, shake: true, showFps: false },
        lastChar: 'knight'
      },
      /* 结算对象本身不整体放进 data（避免模板解引用空对象），拆成展示字段 */
      hasResult: false,
      outcomeText: '冒险结束',
      outcomeOk: false,
      headSub: '',
      statRows: [],
      gemEarned: 0,
      gemTotal: 0,
      recordTitle: '最佳记录',
      recordText: '',
      achNames: [],
      achMore: '',
      characterId: 'knight',
      bodyH: 160,
      recordH: 66
    }
  },
  mounted() {
    try { this._setBackSupport(false) } catch (eB0) {}
  },
  onUnload() {
    try { this._setBackSupport(true) } catch (eB1) {}
  },
  methods: {
    _dedupe() {
      var now = Date.now()
      if (now - (this._lastTap || 0) < 300) return true
      this._lastTap = now
      return false
    },
    /* 结算页同样关闭系统左滑返回，避免误退出 */
    _setBackSupport(enabled) {
      try {
        var np = this.$page && this.$page.$npage
        if (np && typeof np.setSupportBack === 'function') np.setSupportBack(!!enabled)
      } catch (e) {}
    },
    onShow() {
      try { this._setBackSupport(false) } catch (eB3) {}
      try {
        var h = pageSize().h
        this.bodyH = Math.max(110, h - Math.round(h * 0.45))
        this.recordH = Math.max(48, this.bodyH - 92)
      } catch (eB) { this.bodyH = 160; this.recordH = 66 }
      try { this.loadResult() } catch (e0) {}
      try { this.loadDb() } catch (e1) {}
    },
    loadDb() {
      var self = this
      try {
        var mem = $falcon.__gameDb
        if (mem) { this.db = mem; this.gemTotal = mem.gems || 0 }
      } catch (e0) {}
      try {
        load().then(function (db) {
          if (!db) return
          self.db = db
          self.gemTotal = db.gems || 0
        }, function () {})
      } catch (e1) {}
    },
    fmtDur(ms) {
      var n = Number(ms) || 0
      if (n <= 0) return '0 秒'
      var sec = Math.round(n / 1000)
      var min = Math.floor(sec / 60)
      var hour = Math.floor(min / 60)
      var ss = sec % 60
      if (hour > 0) return hour + ' 时 ' + (min % 60) + ' 分'
      if (min > 0) return min + ' 分 ' + (ss < 10 ? '0' + ss : ss) + ' 秒'
      return ss + ' 秒'
    },
    loadResult() {
      var r = null
      try { r = $falcon.__gameResult } catch (e0) { r = null }
      if (!r || !r.outcome) {
        this.hasResult = false
        this.headSub = ''
        return
      }
      this.hasResult = true
      var out = String(r.outcome)
      if (out === 'victory') {
        this.outcomeText = '通关成功'
        this.outcomeOk = true
      } else if (out === 'dead') {
        this.outcomeText = '冒险失败'
        this.outcomeOk = false
      } else if (out === 'abandon') {
        this.outcomeText = '主动撤退'
        this.outcomeOk = false
      } else {
        this.outcomeText = '冒险结束'
        this.outcomeOk = false
      }
      this.characterId = r.characterId || this.db.lastChar || 'knight'
      var chapterName = r.chapterName || ('第 ' + (r.chapter || 1) + ' 章')
      var floorNo = Number(r.floor) || 0
      this.headSub = (r.characterName || '未知角色') + ' · ' + chapterName +
        (floorNo > 0 ? (' · 第 ' + floorNo + ' 层') : '')
      this.gemEarned = Number(r.gemsEarned)
      if (!isFinite(this.gemEarned) || this.gemEarned < 0) {
        var recG = (r.records && typeof r.records.gemsEarned === 'number') ? r.records.gemsEarned : 0
        this.gemEarned = recG
      }
      this.statRows = [
        { label: '到达层数', value: floorNo > 0 ? (floorNo + ' 层') : '—' },
        { label: '章节', value: chapterName },
        { label: '清理房间', value: String(Number(r.roomsCleared) || 0) },
        { label: '击杀', value: String(Number(r.kills) || 0) },
        { label: '首领', value: String(Number(r.bossKills) || 0) },
        { label: '金币', value: String(Number(r.coins) || 0) },
        { label: '宝石', value: '+' + this.gemEarned },
        { label: '时长', value: this.fmtDur(r.durationMs) }
      ]
      this.buildRecord(r)
      this.buildAchievements(r)
      this.gemTotal = (this.db && this.db.gems) ? this.db.gems : this.gemTotal
    },
    buildRecord(r) {
      var rec = r.records || {}
      var parts = []
      if (rec.newBestFloor) parts.push('最深 ' + (Number(r.floor) || 0) + ' 层')
      if (rec.newBestRoom) parts.push('清理 ' + (Number(r.roomsCleared) || 0) + ' 房间')
      if (rec.newBestKills) parts.push('击杀 ' + (Number(r.kills) || 0))
      if (rec.newBestTime) parts.push('时长 ' + this.fmtDur(r.durationMs))
      if (parts.length) {
        this.recordTitle = '新纪录'
        this.recordText = parts.join(' · ')
        return
      }
      var st = (this.db && this.db.stats) || {}
      var bestFloor = Number(st.bestFloor) || 0
      var bestRoom = Number(st.bestRoom) || 0
      this.recordTitle = '最佳记录'
      this.recordText = '最佳层数 ' + bestFloor + ' 层 · 最远房间 ' + bestRoom
    },
    buildAchievements(r) {
      var ids = []
      if (r.newAchievements && r.newAchievements.length) ids = r.newAchievements
      else if (r.achievements && r.achievements.length) ids = r.achievements
      else if (r.records && r.records.newAchievements) ids = r.records.newAchievements
      var names = []
      for (var i = 0; i < ids.length; i++) {
        var id = ids[i]
        var a = (ACHIEVEMENTS && ACHIEVEMENTS[id]) || null
        names.push(a && a.name ? a.name : String(id))
      }
      if (names.length > 3) {
        this.achNames = names.slice(0, 3)
        this.achMore = '另有 ' + (names.length - 3) + ' 项新成就'
      } else {
        this.achNames = names
        this.achMore = ''
      }
    },
    playAgain() {
      if (this._dedupe()) return
      try {
        var cid = this.characterId || this.db.lastChar || 'knight'
        $falcon.__gameRun = { characterId: cid, seed: Date.now() }
        $falcon.navTo('game', {})
      } catch (e) {}
    },
    goLobby() {
      if (this._dedupe()) return
      try { $falcon.navTo('index', {}) } catch (e) {}
    },
    goCharacters() {
      if (this._dedupe()) return
      try { $falcon.navTo('characters', {}) } catch (e) {}
    },
  },
}
</script>

<style>
.page { width: 960px; width: 100vw; height: 100%; height: 100vh; position: relative; overflow: hidden; backgroundColor: #14121c; }
.bg { position: absolute; left: 0; top: 0; width: 100vw; height: 100vh; backgroundColor: #14121c; }
.content { position: relative; width: 100vw; height: 100vh; flexDirection: column; paddingLeft: 1.8vw; paddingRight: 1.8vw; paddingTop: 1.2vh; paddingBottom: 1.2vh; }
.head { width: 100%; height: auto; paddingTop: 1.2vh; paddingBottom: 0.8vh; flexDirection: column; alignItems: center; justifyContent: center; }
.out-win { fontSize: 3.08vw; fontWeight: 700; color: #ffd93d; letterSpacing: 0.2vw; }
.out-lose { fontSize: 3.08vw; fontWeight: 700; color: #ff6b6b; letterSpacing: 0.2vw; }
.head-sub { fontSize: 1.55vw; color: #a49fc0; marginTop: 0.8vh; }
.empty-box { flex: 1; alignItems: center; justifyContent: center; flexDirection: column; }
.empty-text { fontSize: 1.62vw; color: #8f89a8; marginBottom: 0.6vh; }
.body { width: 100%; flexDirection: row; overflow: hidden; }
.left-panel { width: 52vw; flexDirection: column; marginRight: 1.4vw; }
.right-panel { flex: 1; flexDirection: column; overflow: hidden; }
.record-scroller { width: 100%; }
.panel-title { fontSize: 1.76vw; fontWeight: 700; color: #4fc3f7; marginBottom: 0.9vh; }
.stat-grid { flexDirection: row; flexWrap: wrap; }
.stat-card { width: 11.6vw; height: auto; paddingTop: 1vh; paddingBottom: 1vh; backgroundColor: #1b1726; borderWidth: 2px; borderColor: #3a3352; borderRadius: 0.8vh; flexDirection: column; alignItems: center; justifyContent: center; marginRight: 0.7vw; marginBottom: 1.2vh; }
.stat-label { fontSize: 1.4vw; color: #8f89a8; }
.stat-value { fontSize: 2.03vw; fontWeight: 700; color: #ffd93d; marginTop: 0.6vh; }
.gem-panel { width: 100%; height: auto; paddingTop: 1.2vh; paddingBottom: 1.2vh; backgroundColor: #241d14; borderWidth: 3px; borderColor: #ffd93d; borderRadius: 1vh; flexDirection: column; alignItems: center; justifyContent: center; marginBottom: 1.4vh; }
.gem-title { fontSize: 1.62vw; color: #d8c9a0; }
.gem-add { fontSize: 2.64vw; fontWeight: 700; color: #ffd93d; marginTop: 0.4vh; }
.gem-total { fontSize: 1.55vw; color: #b7a97e; marginTop: 0.4vh; }
.record-panel { width: 100%; backgroundColor: #1b1726; borderWidth: 2px; borderColor: #3a3352; borderRadius: 1vh; paddingTop: 1.2vh; paddingBottom: 1.2vh; paddingLeft: 1.2vw; paddingRight: 1.2vw; flexDirection: column; }
.record-title { fontSize: 1.76vw; fontWeight: 700; color: #ffd93d; marginBottom: 0.7vh; }
.record-text { fontSize: 1.55vw; color: #e8e4f5; lineHeight: 6.6vh; }
.ach-title { fontSize: 1.78vw; fontWeight: 700; color: #7ee787; marginTop: 1.2vh; marginBottom: 0.6vh; }
.ach-item { fontSize: 1.55vw; color: #d8d3ea; lineHeight: 6.6vh; }
.ach-more { fontSize: 1.4vw; color: #8f89a8; marginTop: 0.4vh; }
.btn-row { width: 100%; height: 16vh; flexDirection: row; alignItems: center; }
.btn-again { width: 30vw; height: 13vh; backgroundColor: #ffd93d; borderWidth: 3px; borderColor: #fff1a8; borderRadius: 1vh; alignItems: center; justifyContent: center; marginRight: 1.2vw; }
.btn-again-text { fontSize: 7vh; fontWeight: 700; color: #2a2205; }
.btn-normal { width: 22vw; height: 13vh; backgroundColor: #241e36; borderWidth: 2px; borderColor: #4a3f68; borderRadius: 1vh; alignItems: center; justifyContent: center; marginRight: 1.2vw; }
.btn-normal-text { fontSize: 5.5vh; color: #e8e4f5; }
</style>
