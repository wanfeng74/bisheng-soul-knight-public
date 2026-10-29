<template>
  <div class="game-page" @touchstart="multiStart" @touchmove="multiMove" @touchend="multiEnd" @touchcancel="multiEnd">
    <canvas ref="gameCanvas" class="game-canvas" :width="canvasW" :height="canvasH"></canvas>

    <!-- 左下摇杆区（DOM 触控，Falcon 单指可靠） -->
    <div
      class="joy-zone"
      @touchstart="joyStart"
      @touchmove="joyMove"
      @touchend="joyEnd"
      @touchcancel="joyEnd"
    >
      <div v-if="joyActive" class="joy-base" :style="joyBaseStyle">
        <div class="joy-stick" :style="joyStickStyle"></div>
      </div>
      <text v-if="!joyActive" class="joy-hint">拖动移动</text>
    </div>

    <!-- 右下操作区 -->
    <div class="actions">
      <div class="action-row">
        <div class="btn btn-small" @touchstart="doSwap" @click="doSwap" @tap="doSwap">
          <text class="btn-label">换枪</text>
        </div>
        <div class="btn btn-skill" @touchstart="doSkill">
          <text class="btn-label">{{ skillText }}</text>
        </div>
      </div>
      <div class="action-row">
        <div class="btn btn-fire" @touchstart="toggleFire">
          <text class="btn-fire-label">{{ firing ? '停火' : '开火' }}</text>
        </div>
      </div>
    </div>

    <!-- 交互/暂停 -->
    <div class="interact-btn" :style="hud.interact ? interactOnStyle : interactOffStyle" @touchstart="doInteract">
      <text class="interact-text">{{ hud.interact ? hud.interact.label : '交互' }}</text>
    </div>
    <div class="pause-btn" @touchstart="openPause">
      <text class="pause-text">暂停</text>
    </div>

    <!-- 顶部提示 -->
    <text v-if="toast" class="toast">{{ toast }}</text>
    <text v-if="debugMsg" class="debug">{{ debugMsg }}</text>

    <!-- 暂停 -->
    <div v-if="showPause" class="overlay">
      <div class="panel panel-pause">
        <text class="panel-title">已暂停</text>
        <text class="panel-sub">第 {{ hud.chapter }}-{{ hud.floorInChapter }} 层 · {{ hud.chapterName }}<template v-if="hud.petName"> · 宠物 {{ hud.petName }}</template></text>
        <div class="panel-btn panel-btn-green" @touchstart="resumeGame"><text class="panel-btn-text">继续冒险</text></div>
        <div class="panel-btn panel-btn-gray" @touchstart="toggleAutoAim"><text class="panel-btn-text">辅助瞄准：{{ hud.autoAim ? '开' : '关' }}</text></div>
        <div class="panel-btn panel-btn-green" @touchstart="saveAndExit"><text class="panel-btn-text">保存并退出</text></div>
        <div class="panel-btn panel-btn-red" @touchstart="quitRun"><text class="panel-btn-text">放弃本局</text></div>
      </div>
    </div>

    <!-- 天赋三选一 -->
    <div v-if="hud.state === 'buff_choice'" class="overlay">
      <div class="buff-wrap">
        <text class="overlay-title">选择一项天赋</text>
        <div class="buff-row">
          <div v-for="b in hud.buffOptions" :key="b.id" class="buff-card" @touchstart="chooseBuff(b.index)">
            <image class="buff-icon" :src="'assets/icons/' + (b.icon || 'ui_buff_hp') + '.png'" mode="aspectFit"></image>
            <text class="buff-name">{{ b.name }}</text>
            <text class="buff-desc">{{ b.desc }}</text>
          </div>
        </div>
      </div>
    </div>

    <!-- 商店 -->
    <div v-if="hud.state === 'shop' && hud.shop" class="overlay">
      <div class="shop-panel">
        <div class="shop-head">
          <text class="overlay-title">流浪商人</text>
          <text class="shop-coins">金币 {{ hud.coins }}</text>
        </div>
        <div class="shop-list">
          <div v-for="o in hud.shop.offers" :key="o.index" :class="o.sold ? 'shop-item shop-item-sold' : 'shop-item'">
            <text class="shop-item-name">{{ o.name }}</text>
            <text class="shop-item-desc">{{ o.kind === 'weapon' ? '武器' : (o.kind === 'buff' ? '天赋' : (o.kind === 'heal' ? '恢复' : '药品')) }}</text>
            <div v-if="!o.sold" class="shop-buy" @click="buyShop(o.index)" @tap="buyShop(o.index)">
              <text class="shop-buy-text">{{ o.price }} 金币</text>
            </div>
            <text v-else class="shop-sold">已售</text>
          </div>
        </div>
        <div class="panel-btn panel-btn-gray shop-close" @click="closeShop" @tap="closeShop"><text class="panel-btn-text">离开商店</text></div>
      </div>
    </div>

    <!-- 复活 -->
    <div v-if="hud.state === 'revive' && hud.revive" class="overlay">
      <div class="panel panel-pause">
        <text class="panel-title-red">你倒下了</text>
        <text class="panel-sub">消耗 {{ hud.revive.cost }} 宝石原地复活（回复半血/满护甲/短暂无敌）</text>
        <div v-if="hud.revive.canAfford" class="panel-btn panel-btn-green" @touchstart="doRevive"><text class="panel-btn-text">花费 {{ hud.revive.cost }} 宝石复活</text></div>
        <div v-else class="panel-btn panel-btn-gray"><text class="panel-btn-text">宝石不足（需 {{ hud.revive.cost }}）</text></div>
        <div class="panel-btn panel-btn-red" @touchstart="declineRevive"><text class="panel-btn-text">接受失败</text></div>
      </div>
    </div>
  </div>
</template>

<script>
import { Game } from '../../services/game/engine.js'
import { characterById } from '../../services/game/characters.js'
import { applyRunResult } from '../../services/game/meta.js'
import { load, save } from '../../services/save.js'
import { readPhysical, logicalHeight } from '../../services/screen.js'
import { mapTouchToLogical } from '../../services/touch-map.js'
import { loadTwoFingerNative } from '../../services/native-twofinger.js'
import { createTwoFinger } from '../../services/twofinger.js'
import { sfx, bgmPlay, bgmStop, isSoundOn } from '../../services/sound.js'
import { logInfo, logError } from '../../services/logger.js'

export default {
  data() {
    return {
      canvasW: 960,
      canvasH: 266,
      pageH: 266,
      physW: 0,
      physH: 0,
      engine: null,
      db: null,
      hud: { state: 'loading', weapons: [], buffOptions: [], minimap: [], coins: 0, autoAim: true },
      firing: true,
      joyActive: false,
      multiTouch: false,
      multiMoving: false,
      nativeMulti: false,
      tfCalib: { a: -0.0055, b: -1.0539, c: 979.4, d: 1.0449, e: -0.0023, f: 1.0 },
      multiOX: 0,
      multiOY: 0,
      joyOX: 0,
      joyOY: 0,
      joyDX: 0,
      joyDY: 0,
      joyBaseStyle: {},
      joyStickStyle: {},
      showPause: false,
      toast: '',
      debugMsg: '',
      loopToken: null,
      lastTs: 0,
      hudT: 0,
      initTries: 0,
      runEnded: false,
      navDone: false,
      aimTapTs: 0,
      bossBgm: false,
      lastSavedFloor: 0,
      toastTimer: null,
      interactOnStyle: { backgroundColor: 'rgba(255,217,61,0.92)', borderColor: '#fff3b0' },
      interactOffStyle: { backgroundColor: 'rgba(30,34,48,0.72)', borderColor: 'rgba(120,130,150,0.4)' }
    }
  },
  computed: {
    pageStyle() {
      return { width: '100vw', height: '100vh' }
    },
    skillText() {
      var s = this.hud && this.hud.skill
      if (!s) return '技能'
      if (s.cdLeft > 0) return s.name + ' ' + Math.ceil(s.cdLeft) + 's'
      return s.name
    }
  },
  mounted() {
    try { this._setBackSupport(false) } catch (eB0) {}
    this._applyScreen()
    this._tryInit()
  },
  methods: {
    onShow() {
      try { this._setBackSupport(false) } catch (eB0) {}
      try { this._applyScreen() } catch (e) {}
      try { $falcon.__gameHidden = false } catch (e0) {}
      if (!this.engine) { this._tryInit(); return }
      var c = this.$refs.gameCanvas
      if (c && this.canvasW > 0) {
        try {
          c.width = this.canvasW
          c.height = this.canvasH
          var ctx = c.getContext('2d')
          if (ctx && this.engine) this.engine.ctx = ctx
        } catch (eC) {}
      }
      if (!this.showPause) {
        try { this.engine.resume() } catch (eR) {}
      }
      try { this._startNativeTwoFinger() } catch (eT) {}
    },
    onHide() {
      try { if (this.engine) this.engine.pause() } catch (e) {}
      try { this._stopNativeTwoFinger() } catch (eT) {}
    },
    onUnload() {
      try { this._setBackSupport(true) } catch (eB1) {}
      try { this._stopNativeTwoFinger(true) } catch (eT) {}
      this.stopLoop()
      if (this.toastTimer) { clearTimeout(this.toastTimer); this.toastTimer = null }
      if (this.engine) { try { this.engine.destroy() } catch (e) {} this.engine = null }
      try { bgmStop() } catch (e2) {}
    },
    /* Falcon 页面 API：关闭系统左滑返回，避免对局中误退出 */
    _setBackSupport(enabled) {
      try {
        var np = this.$page && this.$page.$npage
        if (np && typeof np.setSupportBack === 'function') np.setSupportBack(!!enabled)
      } catch (e) {}
    },
    _applyScreen() {      var p = readPhysical()
      this.physW = p.w
      this.physH = p.h
      this.pageH = logicalHeight(p.w, p.h)
      this.canvasW = Math.max(1, Math.round(p.w))
      this.canvasH = Math.max(1, Math.round(p.h))
      if (this.engine) {
        try { this.engine.setCanvasPixels(this.canvasW, this.canvasH) } catch (e1) {}
        try { this.engine.setViewport(this.canvasW, this.canvasH) } catch (e2) {}
      }
    },
    _tryInit() {
      var self = this
      var canvas = this.$refs.gameCanvas
      if (!canvas) {
        if (this.initTries < 8) {
          this.initTries++
          setTimeout(function () { self._tryInit() }, 60)
        } else {
          this.debugMsg = 'canvas 未就绪'
        }
        return
      }
      var ctx = null
      try {
        if (this.canvasW > 0) { canvas.width = this.canvasW; canvas.height = this.canvasH }
      } catch (eW) {}
      try { ctx = canvas.getContext('2d') } catch (e) { ctx = null }
      if (!ctx && typeof createCanvasContext === 'function') {
        try { ctx = createCanvasContext(canvas) } catch (e2) { ctx = null }
      }
      if (!ctx) { this.debugMsg = 'ctx=null'; return }
      try { ctx.imageSmoothingEnabled = false } catch (eSm) {}
      load().then(function (db) {
        self.db = db
        var runOpts = {}
        try { runOpts = $falcon.__gameRun || {} } catch (eR) {}
        var cid = runOpts.characterId || db.lastChar || 'knight'
        if (!characterById(cid)) cid = 'knight'
        db.lastChar = cid
        try { $falcon.__gameDb = db } catch (eD) {}
        var hooks = {
          onEndRun: function (result) { self._onEndRun(result) },
          sfx: function (name) { try { if (isSoundOn()) sfx(name) } catch (eS) {} },
          onSpendGems: function (cost) { return self._spendGems(cost) }
        }
        var resume = runOpts.resume || null
        if (resume && resume.characterId && characterById(resume.characterId)) cid = resume.characterId
        db.lastChar = cid
        var opts = {
          characterId: cid,
          upgrades: db.charUpgrades[cid] || {},
          skillChoice: (db.skillChoices && db.skillChoices[cid]) || 0,
          seed: runOpts.seed || Date.now(),
          gems: db.gems,
          settings: db.settings
        }
        self.engine = new Game(ctx, hooks)
        try { self.engine.setViewport(self.canvasW, self.canvasH) } catch (e3) {}
        try { self.engine.setCanvasPixels(self.canvasW, self.canvasH) } catch (e4) {}
        var resumed = false
        if (resume) {
          try { resumed = self.engine.resumeRun(resume, opts) } catch (eRs) { resumed = false }
        }
        if (!resumed) self.engine.startRun(opts)
        self.lastSavedFloor = self.engine.run ? self.engine.run.floorIndex : 0
        self._saveCheckpoint()
        self.engine.setFire(true)
        self.firing = true
        try { bgmPlay('dungeon', 0.35) } catch (eB) {}
        self.hud = self.engine.getHud()
        self.startLoop()
        try { self._startNativeTwoFinger() } catch (eT) {}
        try { logInfo('[game] start char=' + cid + ' seed=' + (runOpts.seed || '-')) } catch (eL) {}
      }).catch(function (e) {
        self.debugMsg = '存档读取失败: ' + (e && e.message)
      })
    },
    startLoop() {
      if (this.loopToken != null) return
      var self = this
      this.lastTs = Date.now()
      var raf = function (fn) { return setTimeout(fn, 16) }
      this._loopRaf = false
      var tick = function () {
        if (self.loopToken == null) return
        try {
          var now = Date.now()
          var dt = now - self.lastTs
          self.lastTs = now
          if (dt > 100) dt = 100
          if (!self.engine) return
          var hidden = false
          try { hidden = $falcon.__gameHidden === true } catch (eH) {}
          if (hidden) return
          if (self.showPause) {
            try { self.engine.render() } catch (eR) {}
            return
          }
          try {
            self.engine.update(dt)
            self.engine.render()
          } catch (e) {
            self.debugMsg = 'LOOP: ' + (e && e.message ? e.message : String(e))
            try { logError('game loop: ' + (e && e.stack ? e.stack : e)) } catch (e2) {}
          }
          self.hudT += dt
          if (self.hudT >= 100) {
            self.hudT = 0
            try {
              self.hud = self.engine.getHud()
              self._syncBgm()
              if (self.engine.run && self.engine.state === 'playing' &&
                  self.engine.run.floorIndex !== self.lastSavedFloor) {
                self.lastSavedFloor = self.engine.run.floorIndex
                self._saveCheckpoint()
              }
              if (self.hud.state !== 'playing' && self.hud.state !== 'floor_intro') {
                self.engine.setMove(0, 0)
                self.joyActive = false
              }
              if (self.hud.state === 'revive' || self.hud.state === 'buff_choice' || self.hud.state === 'shop') {
                self.engine.setFire(false)
              } else if (self.firing) {
                self.engine.setFire(true)
              }
            } catch (e3) {}
          }
        } finally {
          if (self.loopToken != null) self.loopToken = raf(tick)
        }
      }
      this.loopToken = raf(tick)
    },
    stopLoop() {
      if (this.loopToken != null) {
        try {
          if (this._loopRaf && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(this.loopToken)
          else clearTimeout(this.loopToken)
        } catch (e0) {}
        this.loopToken = null
      }
    },
    _syncBgm() {
      var boss = this.hud && this.hud.boss
      if (boss && !this.bossBgm) { this.bossBgm = true; try { bgmPlay('boss', 0.4) } catch (e) {} }
      else if (!boss && this.bossBgm) { this.bossBgm = false; try { bgmPlay('dungeon', 0.35) } catch (e2) {} }
    },
    showToast(msg, ms) {
      var self = this
      this.toast = msg
      if (this.toastTimer) clearTimeout(this.toastTimer)
      this.toastTimer = setTimeout(function () { self.toast = '' }, ms || 1400)
    },
    _touchPoint(e) {
      var t = null
      try {
        if (e.touches && e.touches.length) t = e.touches[0]
        else if (e.changedTouches && e.changedTouches.length) t = e.changedTouches[0]
      } catch (eT) {}
      if (!t) return null
      var x = (t.screenX != null) ? t.screenX : t.clientX
      var y = (t.screenY != null) ? t.screenY : t.clientY
      if (x == null) x = t.pageX
      if (y == null) y = t.pageY
      return mapTouchToLogical(x, y, this.physW, this.physH, this.pageH)
    },
    _rawTouchPoint(e) {
      var t = null
      try {
        if (e.touches && e.touches.length) t = e.touches[0]
        else if (e.changedTouches && e.changedTouches.length) t = e.changedTouches[0]
      } catch (eT) {}
      if (!t) return null
      var x = (t.clientX != null) ? t.clientX : t.pageX
      var y = (t.clientY != null) ? t.clientY : t.pageY
      if (x == null) return null
      return { x: x, y: y }
    },
    _allTouchPoints(e) {
      var arr = null
      try { arr = e.touches } catch (e0) {}
      if (!arr || !arr.length) { try { arr = e.changedTouches } catch (e1) {} }
      if (!arr || !arr.length) return []
      var out = []
      for (var i = 0; i < arr.length; i++) {
        var t = arr[i]
        var x = (t.screenX != null) ? t.screenX : t.clientX
        var y = (t.screenY != null) ? t.screenY : t.clientY
        if (x == null) x = t.pageX
        if (y == null) y = t.pageY
        var p = mapTouchToLogical(x, y, this.physW, this.physH, this.pageH)
        if (p) {
          p.cx = (t.clientX != null) ? t.clientX : x
          p.cy = (t.clientY != null) ? t.clientY : y
          out.push(p)
        }
      }
      return out
    },
    /* 原生双指：按 twofinger-jsapi 的 listDevices + start + touch 事件接入。
     * 只有读到至少两个真实触点的帧才接管；单指仍走原 DOM 控件。 */
    _startNativeTwoFinger() {
      if (this._nativeTwoFinger) return
      this._nativeTouchSeen = false
      this._nativeEventCount = 0
      this._nativeMoveLogged = false
      var T = null
      try { T = loadTwoFingerNative() } catch (e0) { T = null }
      if (!T) {
        try { logInfo('[game] twofinger native unavailable') } catch (eL) {}
        return
      }
      var ctrl = null
      try {
        var native = (typeof T === 'function') ? new T() : T
        ctrl = createTwoFinger(native, {
          width: 960,
          height: this.pageH || 287,
          rotation: 90,
          interval: 16,
          maxEvents: 256
        })
        var list = ctrl.listDevices() || []
        try {
          var desc = []
          for (var di = 0; di < list.length; di++) {
            var dd = list[di] || {}
            desc.push(String(dd.path || '?') + '{name=' + String(dd.name || '') +
              ',supported=' + String(dd.supported) + ',typeB=' + String(dd.typeB) +
              ',readable=' + String(dd.readable) + ',slots=' + String(dd.slots) + '}')
          }
          logInfo('[game] twofinger devices: ' + desc.join(' | '))
        } catch (eLd) {}
        var dev = null
        for (var i = 0; i < list.length; i++) {
          var d = list[i]
          if (!d || !d.path) continue
          if (d.readable === false || d.supported === false || d.typeB === false) continue
          if (typeof d.slots === 'number' && d.slots < 2) continue
          dev = d
          break
        }
        if (!dev) {
          try { ctrl.dispose() } catch (eD0) {}
          try { logInfo('[game] twofinger no supported device') } catch (eL2) {}
          return
        }
        var self = this
        ctrl.on('touch', function (ev) { self._onNativeTouch(ev) })
        ctrl.on('error', function (err) {
          try { logInfo('[game] twofinger error ' + ((err && err.message) || err)) } catch (eL3) {}
        })
        ctrl.start(dev.path)
        this._nativeTwoFinger = ctrl
        this._nativeDevicePath = dev.path
        try { logInfo('[game] twofinger start ' + dev.path) } catch (eL4) {}
      } catch (eStart) {
        var tinfo = ''
        try {
          tinfo = ' type=' + (typeof T)
          if (T && typeof T === 'object') tinfo += ' keys=' + Object.keys(T).join(',')
        } catch (eTi) {}
        try { logInfo('[game] twofinger init failed: ' + ((eStart && eStart.message) || eStart) + tinfo) } catch (eL5) {}
        try { if (ctrl) ctrl.dispose() } catch (eD1) {}
      }
    },
    _stopNativeTwoFinger(dispose) {
      var ctrl = this._nativeTwoFinger
      this._nativeTwoFinger = null
      this._nativeDevicePath = ''
      this._nativeRelease()
      if (!ctrl) return
      try { if (ctrl.isRunning()) ctrl.stop() } catch (eS) {}
      if (dispose) { try { ctrl.dispose() } catch (eD) {} }
    },
    _nativeRelease() {
      if (!this.nativeMulti && !this.multiTouch) return
      this.nativeMulti = false
      this.multiTouch = false
      this.multiMoving = false
      this.joyActive = false
      this.joyDX = 0
      this.joyDY = 0
      if (this.engine) this.engine.setMove(0, 0)
    },
    _onNativeTouch(ev) {
      if (!this.engine || !ev) return
      if (ev.type === 'cancel') { this._nativeRelease(); return }
      var ts = ev.touches || []
      if (!this._nativeTouchSeen) {
        this._nativeTouchSeen = true
        try { logInfo('[game] twofinger touch first type=' + ev.type + ' n=' + ts.length) } catch (eT0) {}
      }
      this._nativeEventCount = (this._nativeEventCount || 0) + 1
      if (this._nativeEventCount <= 24) {
        try {
          var ps = []
          for (var pi = 0; pi < ts.length; pi++) ps.push('(' + Math.round(ts[pi].x) + ',' + Math.round(ts[pi].y) + ')')
          logInfo('[game] twofinger ev ' + ev.type + ' n=' + ts.length + ' ' + ps.join(' '))
        } catch (eT1) {}
      }
      if (ts.length < 2) {
        if (this.nativeMulti) this._nativeRelease()
        return
      }
      /* 三角洲同款 sitronix 279x935 校准矩阵：screen = c + a*rawX + b*rawY */
      var cal = this.tfCalib
      if (cal) {
        for (var ci = 0; ci < ts.length; ci++) {
          var tp = ts[ci]
          if (!tp || tp.rawX == null || tp.rawY == null) continue
          var sx = cal.c + cal.a * tp.rawX + cal.b * tp.rawY
          var sy = cal.f + cal.d * tp.rawX + cal.e * tp.rawY
          tp.x = sx < 0 ? 0 : (sx > 960 ? 960 : sx)
          tp.y = sy < 0 ? 0 : (sy > (this.pageH || 287) ? (this.pageH || 287) : sy)
        }
      }
      var sorted = ts.slice().sort(function (a, b) { return a.x - b.x })
      var left = sorted[0]
      var right = sorted[sorted.length - 1]
      if (!left || !right) return
      var max = Math.max(34, Math.round(this._joySize() * 0.5))
      if (!this.nativeMulti) {
        this.nativeMulti = true
        this.multiTouch = true
        this.multiMoving = true
        this.joyActive = true
        this.joyOX = left.x
        this.joyOY = left.y
        this.multiOX = left.x
        this.multiOY = left.y
        this.joyDX = 0
        this.joyDY = 0
        try { logInfo('[game] twofinger multi ON left=(' + Math.round(left.x) + ',' + Math.round(left.y) + ') right=(' + Math.round(right.x) + ',' + Math.round(right.y) + ')') } catch (eM) {}
      }
      var dx = left.x - this.joyOX
      var dy = left.y - this.joyOY
      var l = Math.sqrt(dx * dx + dy * dy)
      if (l > max) { dx = dx / l * max; dy = dy / l * max }
      this.joyDX = dx
      this.joyDY = dy
      this._updateJoyStyle()
      this.engine.setMove(dx / max, dy / max)
      if (!this._nativeMoveLogged) {
        this._nativeMoveLogged = true
        try { logInfo('[game] twofinger move dx=' + Math.round(dx) + ' dy=' + Math.round(dy) + ' max=' + max) } catch (eMv) {}
      }
      if (!this.firing) { this.firing = true; this.engine.setFire(true) }
    },
    /* DOM 双指降级：两指同时按住时，左半屏走摇杆、右半屏下侧持续开火。
     * 原生双指可用时优先原生；原生不可用才走这里。 */
    multiStart(e) {
      if (this.nativeMulti) return
      var n = 0
      try { n = e.touches ? e.touches.length : 0 } catch (e0) {}
      if (n >= 2) {
        this.multiTouch = true
        this.multiMoving = false
        this._multiProcess(e)
      } else if (!this.multiTouch) {
        var p = this._touchPoint(e)
        if (p && p.x < 960 * 0.45) this.joyStart(e)
      }
    },
    multiMove(e) {
      if (this.nativeMulti) return
      var n = 0
      try { n = e.touches ? e.touches.length : 0 } catch (e0) {}
      if (this.multiTouch || n >= 2) {
        this.multiTouch = true
        this._multiProcess(e)
      } else {
        this.joyMove(e)
      }
    },
    multiEnd(e) {
      if (this.nativeMulti) return
      var n = 0
      try { n = e.touches ? e.touches.length : 0 } catch (e0) {}
      if (this.multiTouch) {
        if (n < 2) {
          this.multiTouch = false
          this.multiMoving = false
          this.joyActive = false
          if (this.engine) this.engine.setMove(0, 0)
          return
        }
        this._multiProcess(e)
        return
      }
      this.joyEnd()
    },
    _multiProcess(e) {
      var pts = this._allTouchPoints(e)
      if (!pts.length) return
      var W = 960
      var H = this.pageH || 287
      var movePt = null
      var firePt = null
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i]
        if (p.x < W * 0.45 && p.y > H * 0.16) {
          if (!movePt || p.x < movePt.x) movePt = p
        } else if (p.x > W * 0.60 && p.y > H * 0.55) {
          firePt = p
        }
      }
      if (movePt) {
        var mx = (movePt.cx != null) ? movePt.cx : movePt.x
        var my = (movePt.cy != null) ? movePt.cy : movePt.y
        if (!this.multiMoving) {
          this.multiMoving = true
          this.multiOX = mx
          this.multiOY = my
          this.joyActive = true
          this.joyOX = mx
          this.joyOY = my
          this.joyDX = 0
          this.joyDY = 0
          this._updateJoyStyle()
        }
        var dx = mx - this.multiOX
        var dy = my - this.multiOY
        var max = Math.max(34, Math.round(this._joySize() * 0.5))
        var l = Math.sqrt(dx * dx + dy * dy)
        if (l > max) { dx = dx / l * max; dy = dy / l * max }
        this.joyDX = dx
        this.joyDY = dy
        this._updateJoyStyle()
        if (this.engine) this.engine.setMove(dx / max, dy / max)
      } else {
        this.multiMoving = false
        this.joyActive = false
        if (this.engine) this.engine.setMove(0, 0)
      }
      if (firePt) {
        if (!this.firing) { this.firing = true; if (this.engine) this.engine.setFire(true) }
      }
    },
    joyStart(e) {
      var p = this._rawTouchPoint(e)
      if (!p) return
      this.joyActive = true
      this.joyOX = p.x
      this.joyOY = p.y
      this.joyDX = 0
      this.joyDY = 0
      if (this.engine) this.engine.setMove(0, 0)
      this._updateJoyStyle()
    },
    joyMove(e) {
      if (!this.joyActive) return
      var p = this._rawTouchPoint(e)
      if (!p) return
      var dx = p.x - this.joyOX
      var dy = p.y - this.joyOY
      var max = Math.max(34, Math.round(this._joySize() * 0.5))
      var l = Math.sqrt(dx * dx + dy * dy)
      if (l > max) { dx = dx / l * max; dy = dy / l * max }
      this.joyDX = dx
      this.joyDY = dy
      this._updateJoyStyle()
      if (this.engine) this.engine.setMove(dx / max, dy / max)
    },
    joyEnd() {
      this.joyActive = false
      this.joyDX = 0
      this.joyDY = 0
      if (this.engine) this.engine.setMove(0, 0)
    },
    _joySize() {
      return Math.max(64, Math.round((this.pageH || 287) * 0.30))
    },
    _joyStickSize() {
      return Math.max(24, Math.round(this._joySize() * 0.38))
    },
    _updateJoyStyle() {
      var size = this._joySize()
      var stick = this._joyStickSize()
      this.joyBaseStyle = {
        left: (this.joyOX - size / 2) + 'px',
        top: (this.joyOY - size / 2) + 'px',
        width: size + 'px',
        height: size + 'px'
      }
      this.joyStickStyle = {
        left: (size / 2 - stick / 2 + this.joyDX) + 'px',
        top: (size / 2 - stick / 2 + this.joyDY) + 'px',
        width: stick + 'px',
        height: stick + 'px'
      }
    },
    doSkill() {
      if (!this.engine) return
      this.engine.pressSkill()
      this.hud = this.engine.getHud()
    },
    doSwap() {
      if (!this.engine) return
      this.engine.pressSwap()
      this.hud = this.engine.getHud()
    },
    doInteract() {
      if (!this.engine) return
      this.engine.pressInteract()
      this.hud = this.engine.getHud()
    },
    toggleFire() {
      this.firing = !this.firing
      if (this.engine) this.engine.setFire(this.firing)
      this.showToast(this.firing ? '自动开火：开' : '自动开火：关', 900)
    },
    toggleAutoAim() {
      if (!this.engine) return
      var now = Date.now()
      if (now - this.aimTapTs < 300) return
      this.aimTapTs = now
      var on = this.engine.toggleAutoAim()
      try { this.db.settings.autoAim = on; save(this.db) } catch (e) {}
      this.hud = this.engine.getHud()
    },
    openPause() {
      if (!this.engine) return
      this.joyEnd()
      this.showPause = true
      try { this.engine.pause() } catch (e) {}
    },
    resumeGame() {
      this.showPause = false
      if (this.engine) { try { this.engine.resume() } catch (e) {} }
    },
    quitRun() {
      this.showPause = false
      if (this.db) {
        this.db.runSave = null
        try { save(this.db) } catch (e0) {}
      }
      if (this.engine) this.engine.abandonRun()
    },
    chooseBuff(i) {
      if (!this.engine) return
      this.engine.chooseBuff(i)
      this.hud = this.engine.getHud()
      if (this.firing) this.engine.setFire(true)
    },
    buyShop(i) {
      if (!this.engine) return
      if (this.engine.buyShop(i)) this.showToast('购买成功', 900)
      else this.showToast('金币不足', 900)
      this.hud = this.engine.getHud()
    },
    closeShop() {
      if (!this.engine) return
      this.engine.closeShop()
      this.hud = this.engine.getHud()
      if (this.firing) this.engine.setFire(true)
    },
    doRevive() {
      if (!this.engine) return
      this.engine.revive()
      this.hud = this.engine.getHud()
    },
    declineRevive() {
      if (!this.engine) return
      this.engine.declineRevive()
    },
    saveAndExit() {
      if (!this.engine) return
      try {
        var snap = this.engine.checkpoint()
        if (snap && this.db) {
          this.db.runSave = snap
          this.db.lastChar = snap.characterId
          try { $falcon.__gameDb = this.db } catch (eD) {}
          save(this.db)
        }
      } catch (e) {}
      this.showPause = false
      this.stopLoop()
      try { bgmStop() } catch (e2) {}
      try { $falcon.navTo('index', {}) } catch (e3) {}
    },
    _saveCheckpoint() {
      if (!this.engine || !this.db) return
      try {
        var snap = this.engine.checkpoint()
        if (!snap) return
        this.db.runSave = snap
        this.db.lastChar = snap.characterId
        try { $falcon.__gameDb = this.db } catch (eD) {}
        save(this.db)
      } catch (e) {}
    },
    _spendGems(cost) {
      var db = this.db
      if (!db || db.gems < cost) return false
      db.gems -= cost
      save(db)
      return true
    },
    _onEndRun(result) {
      if (this.runEnded) return
      this.runEnded = true
      this.stopLoop()
      var self = this
      var db = this.db
      try {
        if (!db) db = { gems: 0 }
        db.runSave = null
        var out = applyRunResult(db, result)
        if (out && out.db) db = out.db
        result.newAchievements = (out && out.newAchievements) || []
        result.records = (out && out.records) || {}
        db.lastChar = result.characterId
        var starter = characterById(result.characterId)
        if (starter && starter.starterWeapon) {
          if (!db.unlockedWeapons) db.unlockedWeapons = {}
          db.unlockedWeapons[starter.starterWeapon] = true
        }
        for (var i = 0; i < (result.weapons || []).length; i++) {
          if (!db.unlockedWeapons) db.unlockedWeapons = {}
          db.unlockedWeapons[result.weapons[i]] = true
        }
        self.db = db
        try { $falcon.__gameDb = db } catch (eD) {}
      } catch (eM) {
        try { logError('settle: ' + (eM && eM.message)) } catch (eL) {}
      }
      var go = function () {
        if (self.navDone) return
        self.navDone = true
        try { $falcon.__gameResult = result } catch (eR) {}
        try { $falcon.__gameRun = null } catch (eR2) {}
        try { bgmStop() } catch (eB) {}
        try { $falcon.navTo('result', {}) } catch (eN) { self.debugMsg = '结算跳转失败: ' + eN }
      }
      try {
        save(db).then(go, go)
        setTimeout(go, 1200)
      } catch (eS) {
        go()
      }
    }
  }
}
</script>

<style>
.game-page { width: 960px; width: 100vw; height: 100%; height: 100vh; position: relative; overflow: hidden; backgroundColor: #080a10; }
.game-canvas { width: 960px; width: 100vw; height: 100%; height: 100vh; position: absolute; left: 0; top: 0; }
.joy-zone { position: absolute; left: 0; top: 18vh; width: 42vw; height: 76vh; zIndex: 10; }
.joy-base { position: absolute; width: 30vh; height: 30vh; borderRadius: 999px; backgroundColor: rgba(20,26,40,0.55); borderWidth: 2px; borderColor: rgba(160,180,220,0.45); }
.joy-stick { position: absolute; width: 11.4vh; height: 11.4vh; borderRadius: 999px; backgroundColor: rgba(205,215,235,0.75); }
.joy-hint { position: absolute; left: 8vw; bottom: 4vh; fontSize: 1.35vw; color: rgba(180,195,220,0.5); }
.actions { position: absolute; right: 1.4vw; bottom: 1.2vh; flexDirection: column; alignItems: flex-end; zIndex: 20; }
.action-row { flexDirection: row; alignItems: center; marginTop: 0.8vh; }
.btn { marginLeft: 1.2vh; alignItems: center; justifyContent: center; borderWidth: 2px; }
.btn-small { width: 16vh; height: 16vh; borderRadius: 1.2vw; backgroundColor: rgba(30,36,52,0.8); borderColor: rgba(160,180,220,0.5); }
.btn-skill { width: 22vh; height: 22vh; borderRadius: 1.6vw; backgroundColor: rgba(120,60,200,0.72); borderColor: rgba(224,160,255,0.85); }
.btn-fire { width: 30vh; height: 30vh; borderRadius: 2.2vw; backgroundColor: rgba(200,50,60,0.85); borderColor: rgba(255,170,170,0.95); }
.btn-label { fontSize: 5.5vh; color: #f2f2f7; fontWeight: 700; }
.btn-fire-label { fontSize: 7vh; color: #fff3b0; fontWeight: 700; }
.interact-btn { position: absolute; left: 38vw; bottom: 2vh; height: 12vh; paddingLeft: 2.2vh; paddingRight: 2.2vh; borderRadius: 1.2vw; borderWidth: 3px; alignItems: center; justifyContent: center; zIndex: 20; }
.interact-text { fontSize: 6.5vh; color: #14121c; fontWeight: 700; }
.pause-btn { position: absolute; right: 1.6vw; top: 1vh; width: 14vh; height: 14vh; borderRadius: 1vw; backgroundColor: rgba(10,14,22,0.7); borderWidth: 2px; borderColor: rgba(160,180,220,0.4); alignItems: center; justifyContent: center; zIndex: 30; }
.pause-text { fontSize: 6.5vh; color: #c9c9d8; }
.toast { position: absolute; left: 28vw; top: 10vh; width: 44vw; textAlign: center; fontSize: 6vh; color: #ffd93d; backgroundColor: rgba(10,14,22,0.85); paddingTop: 0.8vh; paddingBottom: 0.8vh; borderRadius: 1vw; zIndex: 50; }
.debug { position: absolute; left: 1vw; top: 0.4vh; fontSize: 4vh; color: #ff5a5a; zIndex: 50; }
.overlay { position: absolute; left: 0; top: 0; width: 100vw; height: 100vh; backgroundColor: rgba(5,7,12,0.86); alignItems: center; justifyContent: center; zIndex: 100; }
.panel { width: 50vw; height: 78vh; backgroundColor: #141a26; borderWidth: 2px; borderColor: rgba(255,217,61,0.4); borderRadius: 1.2vw; alignItems: center; justifyContent: center; }
.panel-pause { width: 44vw; }
.panel-title { fontSize: 8vh; color: #ffd93d; fontWeight: 700; marginBottom: 1vh; }
.panel-title-red { fontSize: 8vh; color: #ff5a5a; fontWeight: 700; marginBottom: 1vh; }
.panel-sub { fontSize: 5.2vh; color: #c9c9d8; width: 36vw; textAlign: center; marginBottom: 1.6vh; lineHeight: 7.2vh; }
.panel-btn { width: 34vw; height: 11vh; borderRadius: 1vw; marginTop: 0.8vh; alignItems: center; justifyContent: center; borderWidth: 2px; }
.panel-btn-green { backgroundColor: rgba(60,140,80,0.85); borderColor: rgba(126,231,135,0.8); }
.panel-btn-red { backgroundColor: rgba(150,50,60,0.85); borderColor: rgba(255,138,138,0.8); }
.panel-btn-gray { backgroundColor: rgba(50,56,72,0.9); borderColor: rgba(140,150,170,0.6); }
.panel-btn-text { fontSize: 6vh; color: #f2f2f7; fontWeight: 700; }
.overlay-title { fontSize: 7vh; color: #ffd93d; fontWeight: 700; }
.buff-wrap { width: 100vw; alignItems: center; }
.buff-row { flexDirection: row; marginTop: 2vh; }
.buff-card { width: 26vw; height: 58vh; marginLeft: 1.2vw; marginRight: 1.2vw; backgroundColor: #141a26; borderWidth: 2px; borderColor: rgba(224,160,255,0.5); borderRadius: 1.2vw; alignItems: center; paddingTop: 1.6vh; }
.buff-icon { width: 14vh; height: 14vh; }
.buff-name { fontSize: 6vh; color: #ffd93d; fontWeight: 700; marginTop: 1vh; }
.buff-desc { fontSize: 4.8vh; color: #c9c9d8; width: 22vw; textAlign: center; marginTop: 0.8vh; lineHeight: 6.6vh; }
.shop-panel { width: 86vw; height: 88vh; backgroundColor: #141a26; borderWidth: 2px; borderColor: rgba(255,217,61,0.4); borderRadius: 1.2vw; padding: 1.2vw; }
.shop-head { flexDirection: row; alignItems: center; justifyContent: space-between; marginBottom: 1vh; }
.shop-coins { fontSize: 5.5vh; color: #ffd93d; fontWeight: 700; }
.shop-list { flexDirection: row; flexWrap: wrap; }
.shop-item { width: 19vw; height: 32vh; marginRight: 1vw; marginBottom: 1vh; backgroundColor: #1c2434; borderRadius: 1vw; padding: 1vh 0.8vw; alignItems: center; borderWidth: 2px; borderColor: rgba(90,100,130,0.5); }
.shop-item-sold { opacity: 0.45; }
.shop-item-name { fontSize: 5.5vh; color: #f2f2f7; fontWeight: 700; }
.shop-item-desc { fontSize: 4.5vh; color: #9aa4b8; marginTop: 0.4vh; }
.shop-buy { marginTop: 1vh; height: 10vh; width: 16vw; borderRadius: 0.8vw; backgroundColor: rgba(60,140,80,0.85); borderWidth: 2px; borderColor: rgba(126,231,135,0.8); alignItems: center; justifyContent: center; }
.shop-buy-text { fontSize: 5.2vh; color: #f2f2f7; fontWeight: 700; }
.shop-sold { fontSize: 5.2vh; color: #7a7a92; marginTop: 1vh; }
.shop-close { width: 18vw; height: 9vh; }
</style>
