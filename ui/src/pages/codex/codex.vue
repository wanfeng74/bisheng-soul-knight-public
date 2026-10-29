<template>
  <div class="page">
    <div class="bg"></div>
    <div class="topbar">
      <div class="back-btn" @touchstart="goBack" @click="goBack" @tap="goBack">
        <text class="back-text">返回</text>
      </div>
      <text class="title">图鉴</text>
      <text class="subtitle">武器 · 敌人 · 天赋 · 成就</text>
    </div>
    <div class="tab-row">
      <div class="tab-btn" :class="tab === 'weapons' ? 'tab-on' : 'tab-off'" @touchstart="pickTab('weapons')" @click="pickTab('weapons')" @tap="pickTab('weapons')">
        <text class="tab-text" :style="{ color: tab === 'weapons' ? '#ffd93d' : '#a49fc0' }">武器 {{ weapons.length }}</text>
      </div>
      <div class="tab-btn" :class="tab === 'enemies' ? 'tab-on' : 'tab-off'" @touchstart="pickTab('enemies')" @click="pickTab('enemies')" @tap="pickTab('enemies')">
        <text class="tab-text" :style="{ color: tab === 'enemies' ? '#ffd93d' : '#a49fc0' }">敌人 {{ enemies.length }}</text>
      </div>
      <div class="tab-btn" :class="tab === 'talents' ? 'tab-on' : 'tab-off'" @touchstart="pickTab('talents')" @click="pickTab('talents')" @tap="pickTab('talents')">
        <text class="tab-text" :style="{ color: tab === 'talents' ? '#ffd93d' : '#a49fc0' }">天赋 {{ talents.length }}</text>
      </div>
      <div class="tab-btn" :class="tab === 'achievements' ? 'tab-on' : 'tab-off'" @touchstart="pickTab('achievements')" @click="pickTab('achievements')" @tap="pickTab('achievements')">
        <text class="tab-text" :style="{ color: tab === 'achievements' ? '#ffd93d' : '#a49fc0' }">成就 {{ achDone }}/{{ achievements.length }}</text>
      </div>
    </div>
    <div class="body">
      <scroller class="main-scroller" :style="{ height: scrollerH + 'px' }" scrollDirection="vertical">
        <div class="scroll-inner">
          <div v-if="tab === 'weapons'" class="wp-grid">
            <div v-for="(w, wi) in weapons" :key="w.id" class="wp-card" :class="w.locked ? 'wp-locked' : 'wp-open'">
              <div class="wp-icon">
                <text class="wp-mark">{{ w.mark }}</text>
                <image class="wp-img" :src="w.icon" mode="aspectFit"></image>
              </div>
              <div class="wp-info">
                <text class="wp-name" :style="{ color: w.locked ? '#6b6880' : w.color }">{{ w.name }}</text>
                <text class="wp-rarity" :style="{ color: w.locked ? '#5a566e' : w.color }">{{ w.rarityName }} · {{ w.cat }}</text>
                <text class="wp-stat">伤害 {{ w.dmg }} · 耗能 {{ w.energy }}</text>
                <text v-if="w.locked" class="wp-lock">未获得</text>
              </div>
            </div>
          </div>
          <div v-if="tab === 'enemies'">
            <text class="section-title">普通敌人</text>
            <div class="enemy-grid">
              <div v-for="(e, ei) in enemies" :key="e.id" class="enemy-card">
                <div class="enemy-icon">
                  <text class="enemy-mark">{{ e.mark }}</text>
                  <image class="enemy-img" :src="e.icon" mode="aspectFit"></image>
                </div>
                <div class="enemy-info">
                  <text class="enemy-name">{{ e.name }}</text>
                  <text class="enemy-sub">{{ e.chapterText }}</text>
                  <text class="enemy-stat">生命 {{ e.hp }} · 伤害 {{ e.dmg }}</text>
                </div>
              </div>
            </div>
            <text class="section-title">章节首领</text>
            <div class="enemy-grid">
              <div v-for="(b, bi) in bosses" :key="b.id" class="enemy-card">
                <div class="enemy-icon">
                  <text class="enemy-mark">{{ b.mark }}</text>
                  <image class="enemy-img" :src="b.icon" mode="aspectFit"></image>
                </div>
                <div class="enemy-info">
                  <text class="enemy-name">{{ b.name }}</text>
                  <text class="enemy-sub">{{ b.chapterText }}</text>
                  <text class="enemy-stat">生命 {{ b.hp }}</text>
                </div>
              </div>
            </div>
          </div>
          <div v-if="tab === 'talents'" class="ach-list">
            <div v-for="(t, ti) in talents" :key="'talent' + ti" class="ach-row ach-done">
              <div class="ach-head">
                <text class="ach-name">{{ t.name }}</text>
                <text class="ach-state" style="color:#a49fc0">{{ t.group }}</text>
              </div>
              <text class="ach-desc">{{ t.desc }}</text>
            </div>
          </div>
          <div v-if="tab === 'achievements'" class="ach-list">
            <div v-for="(a, ai) in achievements" :key="a.id" class="ach-row" :class="a.done ? 'ach-done' : 'ach-todo'">
              <div class="ach-head">
                <text class="ach-name">{{ a.name }}</text>
                <text class="ach-state" :style="{ color: a.done ? '#ffd93d' : '#8f89a8' }">{{ a.stateText }}</text>
              </div>
              <text class="ach-desc">{{ a.desc }}</text>
              <div class="ach-foot">
                <div class="ach-bar">
                  <div class="ach-fill" :style="{ width: a.pct + '%' }"></div>
                </div>
                <text class="ach-progress">{{ a.progressText }}</text>
              </div>
            </div>
          </div>
        </div>
      </scroller>
    </div>
  </div>
</template>

<script>
/*
 * 图鉴页：武器 / 敌人 / 成就三个 tab，全部由数据模块生成，滚动列表。
 * 武器按品质色显示（图标 assets/icons/wp_<id>.png），未获得显示灰色 + 未获得标记；
 * 敌人含四个章节首领（图标 assets/icons/enemy_<id>.png / boss_<id>.png）；
 * 成就显示进度条与完成态（进度来自 meta.progressOf，完成态来自 db.achievements）。
 */
import { load } from '../../services/save.js'
import { pageSize } from '../../services/screen.js'
import { WEAPONS, WEAPON_ORDER } from '../../services/game/weapons.js'
import { ENEMIES, WIKI_ENEMIES, BOSSES, WIKI_BOSSES } from '../../services/game/enemies.js'
import { ACHIEVEMENTS, ACHIEVEMENT_ORDER, progressOf } from '../../services/game/meta.js'
import { RARITY, WIKI_TALENT_LIST } from '../../services/game/constants.js'

var CAT_NAMES = {
  gun: '枪械', shotgun: '霰弹', smg: '冲锋', rifle: '步枪', sniper: '狙击',
  launcher: '重炮', staff: '法杖', bow: '弓弩', melee: '近战', special: '特殊'
}

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
      tab: 'weapons',
      weapons: [],
      enemies: [],
      bosses: [],
      talents: [],
      achievements: [],
      achDone: 0,
      scrollerH: 180
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
      try { this.scrollerH = this.calcScrollerH() } catch (e0) {}
      try { this.loadDb() } catch (e1) {}
      try { this.rebuild() } catch (e2) {}
    },
    calcScrollerH() {
      var h = 266
      try { h = pageSize().h } catch (e) { h = 266 }
      var top = Math.round(h * 0.12)
      var tabs = Math.round(h * 0.14)
      var rest = h - top - tabs - 8
      return rest > 80 ? rest : 80
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
      this.buildWeapons()
      this.buildEnemies()
      this.buildAchievements()
      this.talents = WIKI_TALENT_LIST || []
    },
    buildWeapons() {
      var db = this.db || {}
      var unlocked = db.unlockedWeapons || {}
      var order = []
      if (WEAPON_ORDER && WEAPON_ORDER.length) {
        for (var i = 0; i < WEAPON_ORDER.length; i++) order.push(WEAPON_ORDER[i])
      } else if (WEAPONS) {
        for (var k in WEAPONS) {
          if (Object.prototype.hasOwnProperty.call(WEAPONS, k)) order.push(k)
        }
      }
      var out = []
      for (var n = 0; n < order.length; n++) {
        var id = order[n]
        var w = (WEAPONS && WEAPONS[id]) || {}
        var rar = (RARITY && RARITY[w.rarity]) || {}
        var isLocked = !(unlocked[id] || w.starter === true)
        out.push({
          id: id,
          name: w.name || id,
          mark: String(w.name || id).charAt(0),
          color: rar.color || '#c8ccd4',
          rarityName: rar.name || '普通',
          cat: CAT_NAMES[w.category] || w.category || '',
          dmg: (typeof w.dmg === 'number') ? w.dmg : 0,
          energy: (typeof w.energy === 'number') ? w.energy : 0,
          icon: 'assets/icons/wp_' + id + '.png',
          locked: isLocked
        })
      }
      this.weapons = out
    },
    chapterText(ch) {
      try {
        if (typeof ch === 'number') return '第 ' + ch + ' 章'
        if (ch && ch.length) {
          var parts = []
          for (var i = 0; i < ch.length; i++) parts.push(String(ch[i]))
          return '第 ' + parts.join('、') + ' 章'
        }
      } catch (e) {}
      return ''
    },
    buildEnemies() {
      var list = []
      var src = (WIKI_ENEMIES && Object.keys(WIKI_ENEMIES).length) ? WIKI_ENEMIES : ENEMIES
      if (src) {
        for (var id in src) {
          if (!Object.prototype.hasOwnProperty.call(src, id)) continue
          var e = src[id] || {}
          var atk = e.attack || {}
          list.push({
            id: id,
            name: e.name || id,
            mark: String(e.name || id).charAt(0),
            hp: (typeof e.hp === 'number') ? e.hp : 0,
            dmg: (typeof atk.dmg === 'number') ? atk.dmg : ((typeof e.dmg === 'number') ? e.dmg : 0),
            chapterText: this.chapterText(e.chapter),
            icon: 'assets/enemies/' + id + '.png'
          })
        }
      }
      this.enemies = list
      var blist = []
      var bsrc = (WIKI_BOSSES && Object.keys(WIKI_BOSSES).length) ? WIKI_BOSSES : BOSSES
      if (bsrc) {
        for (var bid in bsrc) {
          if (!Object.prototype.hasOwnProperty.call(bsrc, bid)) continue
          var b = bsrc[bid] || {}
          blist.push({
            id: bid,
            name: b.name || bid,
            mark: String(b.name || bid).charAt(0),
            hp: (typeof b.hp === 'number') ? b.hp : 0,
            chapterText: this.chapterText(b.chapter),
            icon: 'assets/enemies/' + bid + '.png'
          })
        }
      }
      this.bosses = blist
    },
    buildAchievements() {
      var db = this.db || {}
      var doneMap = db.achievements || {}
      var out = []
      var doneCount = 0
      var order = []
      if (ACHIEVEMENT_ORDER && ACHIEVEMENT_ORDER.length) {
        for (var oi = 0; oi < ACHIEVEMENT_ORDER.length; oi++) order.push(ACHIEVEMENT_ORDER[oi])
      } else if (ACHIEVEMENTS) {
        for (var ok in ACHIEVEMENTS) {
          if (Object.prototype.hasOwnProperty.call(ACHIEVEMENTS, ok)) order.push(ok)
        }
      }
      for (var ai = 0; ai < order.length; ai++) {
        var id = order[ai]
        var a = (ACHIEVEMENTS && ACHIEVEMENTS[id]) || {}
        var done = !!doneMap[id]
        var p = 0
        try { p = progressOf(db, id) } catch (eP) { p = 0 }
        if (typeof p !== 'number' || !isFinite(p)) p = 0
        var target = Number(a.target || a.goal || a.count || 0)
        if (!isFinite(target) || target < 0) target = 0
        var pct = 0
        if (target > 0) pct = Math.min(100, Math.round(p / target * 100))
        else pct = done ? 100 : 0
        if (done) doneCount++
        out.push({
          id: id,
          name: a.name || id,
          desc: a.desc || '',
          done: done,
          pct: pct,
          stateText: done ? '已完成' : '未完成',
          progressText: target > 0 ? (Math.min(p, target) + ' / ' + target) : (done ? '已达成' : '进行中')
        })
      }
      this.achievements = out
      this.achDone = doneCount
    },
    pickTab(name) {
      if (this._dedupe()) return
      this.tab = name
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
.topbar { position: relative; width: 100vw; height: 12vh; flexDirection: row; alignItems: center; paddingLeft: 1.6vw; paddingRight: 1.6vw; }
.back-btn { width: 9vw; height: 9vh; backgroundColor: #241e36; borderWidth: 2px; borderColor: #4a3f68; borderRadius: 0.8vh; alignItems: center; justifyContent: center; marginRight: 1.2vw; }
.back-text { fontSize: 4.8vh; color: #d8d3ea; }
.title { fontSize: 7.2vh; fontWeight: 700; color: #ffd93d; }
.subtitle { fontSize: 4.4vh; color: #7d7893; marginLeft: 0.9vw; marginTop: 0.9vh; }
.tab-row { position: relative; width: 100vw; height: 14vh; flexDirection: row; alignItems: center; paddingLeft: 1.6vw; paddingRight: 1.6vw; borderBottomWidth: 2px; borderBottomColor: #2a2438; }
.tab-btn { width: 24vw; height: 10vh; alignItems: center; justifyContent: center; borderWidth: 2px; borderRadius: 0.8vh; marginRight: 1.2vw; }
.tab-on { backgroundColor: #2b2313; borderColor: #ffd93d; }
.tab-off { backgroundColor: #1b1726; borderColor: #3a3352; }
.tab-text { fontSize: 5.2vh; fontWeight: 600; }
.body { position: relative; flex: 1; flexDirection: column; paddingLeft: 1.5vw; paddingRight: 1.5vw; paddingTop: 1vh; }
.main-scroller { width: 97vw; }
.scroll-inner { flexDirection: column; paddingBottom: 1.5vh; }
.section-title { fontSize: 1.69vw; fontWeight: 700; color: #4fc3f7; marginTop: 1vh; marginBottom: 0.8vh; }
.wp-grid { flexDirection: row; flexWrap: wrap; }
.wp-card { width: 30.6vw; height: auto; paddingTop: 0.8vh; paddingBottom: 0.8vh; flexDirection: row; alignItems: center; backgroundColor: #1b1726; borderWidth: 2px; borderColor: #3a3352; borderRadius: 0.8vh; paddingLeft: 0.6vw; paddingRight: 0.6vw; marginRight: 1vw; marginBottom: 1.1vh; }
.wp-open { borderColor: #4a4064; }
.wp-locked { borderColor: #2c2640; backgroundColor: #17131f; }
.wp-icon { position: relative; width: 13.3vh; height: 7.6vh; backgroundColor: #221c31; borderWidth: 2px; borderColor: #3a3352; borderRadius: 0.5vh; alignItems: center; justifyContent: center; overflow: hidden; marginRight: 0.7vw; }
.wp-mark { fontSize: 2.64vw; fontWeight: 700; color: #2e2740; }
.wp-img { position: absolute; left: 0; top: 0; width: 100%; height: 100%; }
.wp-info { flex: 1; flexDirection: column; }
.wp-name { fontSize: 1.62vw; fontWeight: 700; }
.wp-rarity { fontSize: 1.32vw; marginTop: 0.3vh; }
.wp-stat { fontSize: 1.32vw; color: #a49fc0; marginTop: 0.3vh; }
.wp-lock { fontSize: 1.32vw; color: #6b6880; marginTop: 0.2vh; }
.enemy-grid { flexDirection: row; flexWrap: wrap; }
.enemy-card { width: 22.4vw; height: auto; paddingTop: 0.8vh; paddingBottom: 0.8vh; flexDirection: row; alignItems: center; backgroundColor: #1b1726; borderWidth: 2px; borderColor: #3a3352; borderRadius: 0.8vh; paddingLeft: 0.6vw; paddingRight: 0.6vw; marginRight: 0.9vw; marginBottom: 1.1vh; }
.enemy-icon { position: relative; width: 10vh; height: 10vh; backgroundColor: #221c31; borderWidth: 2px; borderColor: #3a3352; borderRadius: 0.5vh; alignItems: center; justifyContent: center; overflow: hidden; marginRight: 0.6vw; }
.enemy-mark { fontSize: 2.86vw; fontWeight: 700; color: #2e2740; }
.enemy-img { position: absolute; left: 0; top: 0; width: 100%; height: 100%; }
.enemy-info { flex: 1; flexDirection: column; }
.enemy-name { fontSize: 1.71vw; fontWeight: 700; color: #f2effa; }
.enemy-sub { fontSize: 1.25vw; color: #8f89a8; marginTop: 0.3vh; }
.enemy-stat { fontSize: 1.25vw; color: #a49fc0; marginTop: 0.3vh; }
.ach-list { flexDirection: column; }
.ach-row { width: 96vw; height: auto; paddingTop: 0.9vh; paddingBottom: 0.9vh; backgroundColor: #1b1726; borderWidth: 2px; borderColor: #3a3352; borderRadius: 0.8vh; paddingLeft: 1vw; paddingRight: 1vw; flexDirection: column; marginBottom: 1vh; }
.ach-done { borderColor: #ffd93d; backgroundColor: #241d14; }
.ach-todo { borderColor: #2c2640; }
.ach-head { flexDirection: row; alignItems: center; }
.ach-name { fontSize: 1.62vw; fontWeight: 700; color: #f2effa; flex: 1; }
.ach-state { fontSize: 1.55vw; fontWeight: 600; }
.ach-desc { fontSize: 1.4vw; color: #a49fc0; marginTop: 0.4vh; }
.ach-foot { flexDirection: row; alignItems: center; marginTop: 0.5vh; }
.ach-bar { width: 60vw; height: 1.6vh; backgroundColor: #2a2438; borderRadius: 0.5vh; overflow: hidden; }
.ach-fill { height: 1.6vh; backgroundColor: #ffd93d; borderRadius: 0.5vh; }
.ach-progress { fontSize: 1.32vw; color: #8f89a8; marginLeft: 1vw; }
</style>
