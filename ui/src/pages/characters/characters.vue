<template>
  <div class="page">
    <div class="bg"></div>
    <div class="topbar">
      <div class="back-btn" @touchstart="goBack" @click="goBack" @tap="goBack">
        <text class="back-text">返回</text>
      </div>
      <text class="title">角色</text>
      <text class="subtitle">解锁角色 · 强化能力</text>
      <div class="topright">
        <div class="gem-box">
          <div class="gem-icon"></div>
          <text class="gem-text">{{ db.gems }}</text>
        </div>
      </div>
    </div>
    <div v-if="msg" class="msg-bar">
      <text class="msg-text">{{ msg }}</text>
    </div>
    <div class="body">
      <scroller class="main-scroller" :style="{ height: scrollerH + 'px' }" scrollDirection="vertical">
        <div class="scroll-inner" @touchstart="onTouchStart" @touchmove="onTouchMove">
          <div class="card-grid">
            <div v-for="(c, ci) in charCards" :key="c.id" class="char-card" :class="c.selected ? 'card-on' : (c.locked ? 'card-locked' : 'card-off')" @click="pickChar(c.id)" @tap="pickChar(c.id)">
              <div class="card-portrait">
                <text class="card-mark">{{ c.mark }}</text>
                <image class="card-img" :src="c.portrait" mode="aspectFit"></image>
              </div>
              <div class="card-info">
                <text class="card-name">{{ c.name }}</text>
                <text class="card-title">{{ c.title }}</text>
                <text v-if="c.locked" class="card-cost">宝石 {{ c.cost }}</text>
                <text v-else class="card-state">{{ c.selected ? '出战中' : '已解锁' }}</text>
              </div>
            </div>
          </div>
          <div class="detail-panel">
            <div class="detail-head">
              <text class="detail-name">{{ sel.name }}</text>
              <text class="detail-title">{{ sel.title }}</text>
              <text class="detail-desc">{{ sel.desc }}</text>
            </div>
            <div class="detail-cols">
              <div class="detail-left">
                <text class="section-title">基础属性</text>
                <div v-for="(s, si) in baseRows" :key="'bs' + si" class="stat-row">
                  <text class="stat-label">{{ s.label }}</text>
                  <text class="stat-value">{{ s.value }}</text>
                </div>
                <div class="skill-box">
                  <text class="skill-name">技能 · {{ skillName }}</text>
                  <text class="skill-desc">{{ skillDesc }}</text>
                  <text class="skill-cd">冷却 {{ skillCd }} 秒</text>
                  <text class="skill-cd">技能组：{{ skillListText }}</text>
                  <div class="skill-picks">
                    <div v-for="(s, si) in skillDetails" :key="'pick' + si" :class="selectedSkill === si ? 'skill-pick skill-pick-on' : 'skill-pick'" @click="pickSkill(si)">
                      <text class="skill-pick-text">{{ si + 1 }}</text>
                    </div>
                  </div>
                  <div class="skill-detail" v-for="(s, si) in skillDetails" :key="'sk' + si">
                    <text class="skill-detail-name">{{ si + 1 }}. {{ s.name }}{{ s.cd ? ' · ' + s.cd + 's' : '' }}</text>
                    <text class="skill-detail-desc">{{ s.desc }}</text>
                  </div>
                </div>
                <div class="weapon-row">
                  <text class="weapon-label">被动</text>
                  <text class="weapon-name" style="color:#7ee787">{{ passiveName }}</text>
                </div>
                <text v-if="passiveDesc" class="passive-desc">{{ passiveDesc }}</text>
                <div class="weapon-row">
                  <text class="weapon-label">起始武器</text>
                  <text class="weapon-name" :style="{ color: starterColor }">{{ starterName }}</text>
                </div>
              </div>
              <div class="detail-right">
                <text class="section-title">能力升级（每项最高 5 级）</text>
                <div v-for="(u, ui) in upgrades" :key="u.id" class="up-row">
                  <text class="up-name">{{ u.name }}</text>
                  <text class="up-lv">Lv.{{ u.level }}/{{ u.max }}</text>
                  <text class="up-fmt">{{ u.fmt }}</text>
                  <text v-if="u.maxed" class="up-max">已满级</text>
                  <text v-else class="up-cost">{{ u.cost }} 宝石</text>
                  <div v-if="u.maxed" class="up-done">
                    <text class="up-done-text">满</text>
                  </div>
                  <div v-else class="up-btn" @click="buyUpgrade(u.id)" @tap="buyUpgrade(u.id)">
                    <text class="up-btn-text">+</text>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </scroller>
      <div class="bottom-bar">
        <text class="bottom-hint">{{ bottomHint }}</text>
        <div class="start-btn" @touchstart="startRun" @click="startRun" @tap="startRun">
          <text class="start-text">开始冒险</text>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/*
 * 角色页：8 张角色卡片（锁定显示宝石费用，点击即扣宝石解锁）+ 选中角色详情
 * + 六项能力升级（等级/费用/加号，扣宝石并落盘）+ 开始冒险。
 * 只修改存档里的 gems / unlockedChars / charUpgrades / lastChar 四个字段。
 */
import { load, save } from '../../services/save.js'
import { sfx } from '../../services/sound.js'
import { pageSize } from '../../services/screen.js'
import { CHARACTERS, CHARACTER_ORDER } from '../../services/game/characters.js'
import { WEAPONS } from '../../services/game/weapons.js'
import { UPGRADE_DEFS, upgradeCost } from '../../services/game/meta.js'
import { RARITY } from '../../services/game/constants.js'

var STAT_ORDER = ['hp', 'armor', 'energy', 'crit', 'speed', 'skill']

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
      charCards: [],
      selected: 'knight',
      sel: { id: 'knight', name: '骑士', title: '双持剑士', desc: '', locked: false, cost: 0 },
      baseRows: [],
      skillName: '双持',
      skillDesc: '',
      skillCd: 12,
      skillListText: '',
      skillDetails: [],
      selectedSkill: 0,
      passiveName: '—',
      passiveDesc: '',
      starterName: '旧式手枪',
      starterColor: '#c8ccd4',
      upgrades: [],
      scrollerH: 200,
      bottomHint: '',
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
      try { this.scrollerH = this.calcScrollerH() } catch (e0) {}
      try { this.loadDb() } catch (e1) {}
      try { this.rebuild() } catch (e2) {}
    },
    calcScrollerH() {
      var h = 266
      try { h = pageSize().h } catch (e) { h = 266 }
      /* 顶栏 10vh + 底栏 14vh + 间隙；滚动区必须显式 px 高度（框架约定） */
      var top = Math.round(h * 0.12)
      var bottom = Math.round(h * 0.15)
      var rest = h - top - bottom - 6
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
    /* 把存档与角色数据翻译成卡片 / 详情 / 升级面板 */
    rebuild() {
      var db = this.db || {}
      if (!db.unlockedChars || !db.unlockedChars.length) db.unlockedChars = ['knight']
      var order = []
      if (CHARACTER_ORDER && CHARACTER_ORDER.length) {
        for (var i = 0; i < CHARACTER_ORDER.length; i++) order.push(CHARACTER_ORDER[i])
      } else if (CHARACTERS) {
        for (var k in CHARACTERS) {
          if (Object.prototype.hasOwnProperty.call(CHARACTERS, k)) order.push(k)
        }
      }
      var unlocked = {}
      for (var u = 0; u < db.unlockedChars.length; u++) unlocked[db.unlockedChars[u]] = true
      var cur = db.lastChar || 'knight'
      if (!unlocked[cur] && db.unlockedChars.length) cur = db.unlockedChars[0]
      this.selected = cur
      var cards = []
      for (var c = 0; c < order.length; c++) {
        var id = order[c]
        var info = (CHARACTERS && CHARACTERS[id]) || {}
        var isLocked = !unlocked[id]
        cards.push({
          id: id,
          name: info.name || id,
          title: info.title || '',
          mark: String(info.name || id).charAt(0),
          portrait: 'assets/portraits/' + id + '_wiki.png',
          locked: isLocked,
          cost: (typeof info.unlockCost === 'number') ? info.unlockCost : 0,
          selected: id === cur
        })
      }
      this.charCards = cards
      this.buildDetail(cur, unlocked)
    },
    buildDetail(cid, unlocked) {
      var info = (CHARACTERS && CHARACTERS[cid]) || {}
      this.sel = {
        id: cid,
        name: info.name || cid,
        title: info.title || '',
        desc: info.desc || '',
        locked: !unlocked[cid],
        cost: (typeof info.unlockCost === 'number') ? info.unlockCost : 0
      }
      this.baseRows = [
        { label: '生命', value: String(info.hp || 0) },
        { label: '护甲', value: String(info.armor || 0) },
        { label: '能量', value: String(info.energy || 0) },
        { label: '暴击', value: (info.crit || 0) + '%' },
        { label: '移速', value: Math.round((info.speed || 1) * 100) + '%' }
      ]
      if (typeof info.hand === 'number') this.baseRows.push({ label: '手刀', value: String(info.hand) })
      var sk = info.skill || {}
      this.skillName = sk.name || '未知技能'
      this.skillDesc = sk.desc || ''
      this.skillCd = (typeof sk.cd === 'number') ? sk.cd : 0
      this.skillListText = (info.wikiSkills && info.wikiSkills.length) ? info.wikiSkills.join(' / ') : this.skillName
      this.skillDetails = []
      if (info.wikiSkillData && info.wikiSkillData.length) {        for (var si = 0; si < info.wikiSkillData.length; si++) {
          var sd = info.wikiSkillData[si] || {}
          this.skillDetails.push({
            name: sd.name || '—',
            desc: sd.desc || '',
            cd: (typeof sd.cooldown === 'number') ? String(sd.cooldown) : ''
          })
        }
      }
      var chosen = (this.db && this.db.skillChoices && this.db.skillChoices[cid]) || 0
      this.selectedSkill = (chosen >= 0 && chosen < this.skillDetails.length) ? chosen : 0
      this.passiveName = info.passive || '—'
      this.passiveDesc = info.passiveDesc || ''
      var w = {}
      try { w = (WEAPONS && WEAPONS[info.starterWeapon]) || {} } catch (eW) { w = {} }
      this.starterName = info.starterWeaponName || w.name || '—'
      var rar = (RARITY && w.rarity) ? RARITY[w.rarity] : null
      this.starterColor = (rar && rar.color) ? rar.color : '#c8ccd4'
      this.buildUpgrades(cid)
      if (this.sel.locked) {
        this.bottomHint = '该角色未解锁：点击卡片消耗 ' + this.sel.cost + ' 宝石解锁'
      } else {
        this.bottomHint = '当前出战：' + this.sel.name + ' · 点击卡片切换角色'
      }
    },
    buildUpgrades(cid) {
      var db = this.db || {}
      var ups = (db.charUpgrades && db.charUpgrades[cid]) || {}
      var rows = []
      var order = []
      if (UPGRADE_DEFS) {
        for (var i = 0; i < STAT_ORDER.length; i++) {
          if (UPGRADE_DEFS[STAT_ORDER[i]]) order.push(STAT_ORDER[i])
        }
      }
      for (var k = 0; k < order.length; k++) {
        var sid = order[k]
        var def = UPGRADE_DEFS[sid] || {}
        var max = (typeof def.max === 'number') ? def.max : 5
        var level = Number(ups[sid]) || 0
        if (level > max) level = max
        var cost = 0
        if (level < max) {
          try { cost = upgradeCost(cid, sid, level) } catch (eC) { cost = 0 }
        }
        rows.push({
          id: sid,
          name: def.name || sid,
          level: level,
          max: max,
          fmt: def.fmt || '',
          cost: cost,
          maxed: level >= max
        })
      }
      this.upgrades = rows
    },
    pickSkill(idx) {
      if (this._dedupe()) return
      if (this._touchMoved) return
      if (idx < 0 || idx >= this.skillDetails.length) return
      this.selectedSkill = idx
      if (!this.db.skillChoices) this.db.skillChoices = {}
      this.db.skillChoices[this.sel.id] = idx
      this.saveDb()
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
    /* 记录手指是否在滚动：滚动后不触发卡片/购买点击 */
    onTouchStart(e) {
      this._touchMoved = false
      try {
        var t = (e && e.touches && e.touches[0]) || (e && e.changedTouches && e.changedTouches[0])
        this._touchStartY = t ? Number(t.clientY || t.pageY || 0) : 0
      } catch (e0) { this._touchStartY = 0 }
    },
    onTouchMove(e) {
      try {
        var t = (e && e.touches && e.touches[0]) || (e && e.changedTouches && e.changedTouches[0])
        var y = t ? Number(t.clientY || t.pageY || 0) : 0
        if (Math.abs(y - (this._touchStartY || 0)) > 8) this._touchMoved = true
      } catch (e1) { this._touchMoved = true }
    },
    /* 点击卡片：已解锁 = 切换出战；未解锁 = 扣宝石解锁并直接选中 */
    pickChar(id) {
      if (this._dedupe()) return
      if (this._touchMoved) return
      try {
        var info = (CHARACTERS && CHARACTERS[id]) || {}
        var unlocked = (this.db.unlockedChars || []).indexOf(id) >= 0
        if (!unlocked) {
          var cost = (typeof info.unlockCost === 'number') ? info.unlockCost : 0
          if ((this.db.gems || 0) < cost) {
            this.setMsg('宝石不足：解锁「' + (info.name || id) + '」需要 ' + cost + ' 宝石')
            return
          }
          this.db.gems = (this.db.gems || 0) - cost
          if (!this.db.unlockedChars) this.db.unlockedChars = []
          this.db.unlockedChars.push(id)
          if (!this.db.charUpgrades) this.db.charUpgrades = {}
          if (!this.db.charUpgrades[id]) this.db.charUpgrades[id] = { hp: 0, armor: 0, energy: 0, crit: 0, speed: 0, skill: 0 }
          this.db.lastChar = id
          this.saveDb()
          try { sfx('coin') } catch (eS) {}
          this.rebuild()
          this.setMsg('已解锁「' + (info.name || id) + '」，直接出战')
          return
        }
        this.db.lastChar = id
        this.saveDb()
        this.rebuild()
      } catch (e) {
        this.setMsg('操作失败，请重试')
      }
    },
    /* 点击「+」：扣宝石升一级并落盘 */
    buyUpgrade(statId) {
      if (this._dedupe()) return
      if (this._touchMoved) return
      if (Date.now() - (this._lastBuyAt || 0) < 500) return
      this._lastBuyAt = Date.now()
      try {
        var cid = this.selected
        var row = null
        for (var i = 0; i < this.upgrades.length; i++) {
          if (this.upgrades[i].id === statId) row = this.upgrades[i]
        }
        if (!row) return
        if (row.maxed) {
          this.setMsg('该项已满级')
          return
        }
        if ((this.db.gems || 0) < row.cost) {
          this.setMsg('宝石不足：升级「' + row.name + '」需要 ' + row.cost + ' 宝石')
          return
        }
        this.db.gems = (this.db.gems || 0) - row.cost
        if (!this.db.charUpgrades) this.db.charUpgrades = {}
        if (!this.db.charUpgrades[cid]) this.db.charUpgrades[cid] = { hp: 0, armor: 0, energy: 0, crit: 0, speed: 0, skill: 0 }
        var cur = Number(this.db.charUpgrades[cid][statId]) || 0
        this.db.charUpgrades[cid][statId] = cur + 1
        this.saveDb()
        try { sfx('coin') } catch (eS) {}
        this.rebuild()
        this.setMsg('「' + row.name + '」升到 Lv.' + (cur + 1))
      } catch (e) {
        this.setMsg('升级失败，请重试')
      }
    },
    startRun() {
      if (this._dedupe()) return
      try {
        var cid = this.selected || this.db.lastChar || 'knight'
        if (this.sel.locked) {
          this.setMsg('请先解锁该角色')
          return
        }
        $falcon.__gameRun = { characterId: cid, seed: Date.now() }
        $falcon.navTo('game', {})
      } catch (e) {
        this.setMsg('进入地牢失败，请重试')
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
.topright { flexDirection: row; alignItems: center; marginLeft: auto; }
.gem-box { height: 9vh; flexDirection: row; alignItems: center; backgroundColor: #241d14; borderWidth: 2px; borderColor: #ffd93d; borderRadius: 0.8vh; paddingLeft: 0.8vw; paddingRight: 0.9vw; }
.gem-icon { width: 1.6vw; height: 1.6vw; backgroundColor: #ffd93d; borderRadius: 0.8vh; marginRight: 0.5vw; }
.gem-text { fontSize: 4.6vh; fontWeight: 700; color: #ffd93d; }
.msg-bar { position: absolute; left: 26vw; top: 13vh; width: 48vw; height: 7vh; backgroundColor: rgba(0,0,0,0.88); borderRadius: 0.8vh; alignItems: center; justifyContent: center; zIndex: 90; }
.msg-text { fontSize: 4.3vh; color: #ffd93d; }
.body { position: relative; flex: 1; flexDirection: column; paddingLeft: 1.5vw; paddingRight: 1.5vw; }
.main-scroller { width: 97vw; }
.scroll-inner { flexDirection: column; paddingBottom: 1.5vh; }
.card-grid { flexDirection: row; flexWrap: wrap; }
.char-card { width: 22.6vw; height: auto; paddingTop: 0.8vh; paddingBottom: 0.8vh; flexDirection: row; alignItems: center; backgroundColor: #1b1726; borderWidth: 2px; borderColor: #3a3352; borderRadius: 0.9vh; paddingLeft: 0.6vw; paddingRight: 0.6vw; marginRight: 1vw; marginBottom: 1.2vh; }
.card-on { borderColor: #ffd93d; backgroundColor: #292115; }
.card-off { borderColor: #3a3352; }
.card-locked { borderColor: #4a3f68; backgroundColor: #171320; }
.card-portrait { position: relative; width: 9.75vh; height: 13vh; backgroundColor: #221c31; borderWidth: 2px; borderColor: #3a3352; borderRadius: 0.6vh; alignItems: center; justifyContent: center; overflow: hidden; marginRight: 0.7vw; }
.card-mark { fontSize: 3.2vw; fontWeight: 700; color: #2e2740; }
.card-img { position: absolute; left: 0; top: 0; width: 100%; height: 100%; }
.card-info { flex: 1; flexDirection: column; }
.card-name { fontSize: 1.69vw; fontWeight: 700; color: #f2effa; }
.card-title { fontSize: 1.32vw; color: #8f89a8; marginTop: 0.4vh; }
.card-cost { fontSize: 1.47vw; color: #ffd93d; fontWeight: 600; marginTop: 0.8vh; }
.card-state { fontSize: 1.4vw; color: #7d7893; marginTop: 0.8vh; }
.detail-panel { width: 96vw; backgroundColor: #1b1726; borderWidth: 2px; borderColor: #3a3352; borderRadius: 1vh; paddingTop: 1.2vh; paddingBottom: 1.4vh; paddingLeft: 1.2vw; paddingRight: 1.2vw; flexDirection: column; marginTop: 0.6vh; }
.detail-head { flexDirection: row; alignItems: center; marginBottom: 1vh; }
.detail-name { fontSize: 2.16vw; fontWeight: 700; color: #ffd93d; marginRight: 0.8vw; }
.detail-title { fontSize: 1.55vw; color: #a49fc0; marginRight: 1.2vw; }
.detail-desc { fontSize: 1.47vw; color: #b7b2cc; flex: 1; }
.detail-cols { flexDirection: row; }
.detail-left { width: 33vw; flexDirection: column; marginRight: 1.2vw; }
.section-title { fontSize: 1.78vw; fontWeight: 700; color: #4fc3f7; marginBottom: 0.8vh; }
.stat-row { width: 100%; height: auto; paddingTop: 0.5vh; paddingBottom: 0.5vh; flexDirection: row; alignItems: center; justifyContent: space-between; backgroundColor: #201a2e; borderRadius: 0.5vh; paddingLeft: 0.7vw; paddingRight: 0.7vw; marginBottom: 0.5vh; }
.stat-label { width: 52%; fontSize: 1.47vw; color: #8f89a8; marginBottom: 0.6vh; }
.stat-value { width: 48%; fontSize: 1.71vw; fontWeight: 600; color: #ffd93d; textAlign: right; marginBottom: 0.6vh; }
.skill-box { width: 100%; height: auto; backgroundColor: #201a2e; borderWidth: 2px; borderColor: #3a3352; borderRadius: 0.7vh; paddingTop: 0.9vh; paddingBottom: 0.9vh; paddingLeft: 0.8vw; paddingRight: 0.8vw; flexDirection: column; marginTop: 0.8vh; }
.skill-name { fontSize: 1.71vw; fontWeight: 600; color: #ffd93d; }
.skill-desc { fontSize: 1.4vw; color: #b7b2cc; marginTop: 0.4vh; marginBottom: 0.6vh; }
.skill-cd { fontSize: 1.32vw; color: #7d7893; marginTop: 0.4vh; }
.skill-detail { width: 100%; height: auto; marginTop: 0.6vh; paddingTop: 0.4vh; borderTopWidth: 1px; borderTopColor: #3a3352; flexDirection: column; }
.skill-detail-name { fontSize: 1.4vw; fontWeight: 700; color: #c8ccd4; }
.skill-detail-desc { fontSize: 1.28vw; color: #8f89a8; marginTop: 0.2vh; marginBottom: 0.8vh; }
.skill-picks { width: 100%; height: auto; flexDirection: row; marginTop: 0.6vh; }
.skill-pick { width: 5vh; height: 4.6vh; borderRadius: 0.6vh; backgroundColor: #2a2440; borderWidth: 1px; borderColor: #4a4366; alignItems: center; justifyContent: center; marginRight: 0.8vh; }
.skill-pick-on { backgroundColor: #ffd93d; borderColor: #ffd93d; }
.skill-pick-text { fontSize: 1.5vw; fontWeight: 700; color: #d8d4e8; }
.weapon-row { width: 100%; height: auto; paddingTop: 0.6vh; paddingBottom: 0.6vh; flexDirection: row; alignItems: center; backgroundColor: #201a2e; borderRadius: 0.6vh; paddingLeft: 0.7vw; paddingRight: 0.7vw; marginTop: 0.8vh; }
.weapon-label { fontSize: 1.47vw; color: #8f89a8; marginRight: 0.6vw; }
.weapon-name { fontSize: 1.71vw; fontWeight: 700; color: #c8ccd4; }
.passive-desc { width: 100%; height: auto; fontSize: 1.28vw; color: #8f89a8; marginBottom: 0.8vh; marginTop: 0.2vh; paddingLeft: 0.7vw; paddingRight: 0.7vw; }
.detail-right { flex: 1; flexDirection: column; }
.up-row { height: auto; paddingTop: 0.8vh; paddingBottom: 0.8vh; flexDirection: row; alignItems: center; backgroundColor: #201a2e; borderWidth: 2px; borderColor: #332d48; borderRadius: 0.7vh; paddingLeft: 0.8vw; paddingRight: 0.8vw; marginBottom: 0.7vh; }
.up-name { width: 9vw; fontSize: 1.63vw; fontWeight: 600; color: #e8e4f5; marginBottom: 0.6vh; }
.up-lv { width: 9vw; fontSize: 1.55vw; color: #4fc3f7; marginBottom: 0.6vh; }
.up-fmt { width: 10vw; fontSize: 1.55vw; color: #7ee787; marginBottom: 0.6vh; }
.up-cost { width: 9vw; fontSize: 1.47vw; color: #ffd93d; marginBottom: 0.6vh; }
.up-max { width: 9vw; fontSize: 1.47vw; color: #6b6880; marginBottom: 0.6vh; }
.up-btn { width: 10vw; height: 12vh; backgroundColor: #4fc3f7; borderRadius: 0.7vh; alignItems: center; justifyContent: center; marginLeft: auto; }
.up-btn-text { fontSize: 6.5vh; fontWeight: 700; color: #0b1a22; }
.up-done { width: 10vw; height: 12vh; backgroundColor: #2a2438; borderRadius: 0.7vh; alignItems: center; justifyContent: center; marginLeft: auto; }
.up-done-text { fontSize: 5vh; color: #6b6880; }
.bottom-bar { position: relative; width: 97vw; height: 15vh; flexDirection: row; alignItems: center; borderTopWidth: 2px; borderTopColor: #2a2438; }
.bottom-hint { fontSize: 5vh; color: #a49fc0; flex: 1; }
.start-btn { width: 34vw; height: 13vh; backgroundColor: #ffd93d; borderWidth: 3px; borderColor: #fff1a8; borderRadius: 1vh; alignItems: center; justifyContent: center; }
.start-text { fontSize: 7vh; fontWeight: 700; color: #2a2205; }
</style>
