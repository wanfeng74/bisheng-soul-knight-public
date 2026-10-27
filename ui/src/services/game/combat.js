/*
 * 战斗运行时（混入 Game.prototype）：玩家、敌人、子弹、掉落、伤害。
 * ES5 风格；所有数值由数据模块 + 引擎内加成共同决定。
 */
import { TILE, PLAYER_RADIUS, PLAYER_SPEED, MAGNET_RANGE, ENERGY_REGEN, ARMOR_REGEN_DELAY, ARMOR_REGEN_TIME, ELEMENT, ROOM } from './constants.js'
import { rint, rfloat, chance, pick } from './rng.js'
import { enemyById, bossById, eliteScale } from './enemies.js'
import { weaponById } from './weapons.js'
import { PICKUPS } from './loot.js'

var ENEMY_BULLET_CAP = 220
var PLAYER_BULLET_CAP = 160

function len(x, y) { return Math.sqrt(x * x + y * y) }

function vecNorm(x, y) {
  var l = len(x, y)
  if (l < 0.0001) return { x: 1, y: 0, l: 0 }
  return { x: x / l, y: y / l, l: l }
}

function angleOf(x1, y1, x2, y2) { return Math.atan2(y2 - y1, x2 - x1) }

function dist2(x1, y1, x2, y2) {
  var dx = x2 - x1
  var dy = y2 - y1
  return dx * dx + dy * dy
}

export function installCombat(Game) {

  /* ================= 玩家 ================= */

  Game.prototype._updatePlayer = function (dt) {
    var p = this.player
    if (!p || p.dead) return
    var st = p.statuses
    var moveScale = 1
    if (st.freeze > 0) { st.freeze -= dt; moveScale *= 0.45 }
    if (st.burn > 0) {
      st.burn -= dt
      st.burnTick -= dt
      if (st.burnTick <= 0) {
        st.burnTick = 0.5
        this._directHpDamage(1, '#ff9f1c')
      }
    }
    if (st.poison > 0) {
      st.poison -= dt
      st.poisonTick -= dt
      if (st.poisonTick <= 0) {
        st.poisonTick = 0.8
        this._directHpDamage(1, '#7ee787')
      }
    }
    if (p.invuln > 0) p.invuln -= dt
    if (p.fireCd > 0) p.fireCd -= dt
    if (p.skillCd > 0) p.skillCd -= dt
    if (p.dualWieldT > 0) p.dualWieldT -= dt
    if (p.hitFlash > 0) p.hitFlash -= dt
    if (p.energyWarnT > 0) p.energyWarnT -= dt
    /* 护甲回复 */
    p.armorRegenT += dt
    if (p.armorRegenT >= ARMOR_REGEN_DELAY && p.armor < p.maxArmor) {
      var mul = (this.mods.armorRegenMul || 1)
      p.armor = Math.min(p.maxArmor, p.armor + (p.maxArmor / ARMOR_REGEN_TIME) * mul * dt)
    }
    /* 能量回复 */
    if (p.energy < p.maxEnergy) p.energy = Math.min(p.maxEnergy, p.energy + ENERGY_REGEN * dt)

    /* 移动：翻滚优先 */
    var dx = 0
    var dy = 0
    if (p.rollT > 0) {
      p.rollT -= dt
      dx = p.rollVX * dt
      dy = p.rollVY * dt
      p.invuln = Math.max(p.invuln, 0.05)
    } else {
      var speed = PLAYER_SPEED * (p.speedMul || 1) * (p.sceneSpeedMul || 1) * (this.mods.speedMul || 1) * moveScale
      var mv = vecNorm(this.moveX, this.moveY)
      p.moving = mv.l > 0.1
      if (p.moving) {
        dx = mv.x * speed * dt
        dy = mv.y * speed * dt
        p.walkT += dt
        if (Math.abs(mv.x) > 0.15) p.facing = mv.x > 0 ? 1 : -1
      }
    }
    this._moveWithCollision(p, dx, dy)
    /* 朝向/瞄准 */
    this._updateAim(dt)
    /* 交互提示 */
    this._updateInteract()
  }

  Game.prototype._updateAim = function (dt) {
    var p = this.player
    if (!p) return
    var target = null
    if (this.autoAim) target = this._nearestEnemy(p.x, p.y, 460 * (this.mods.rangeMul || 1))
    if (target) {
      var v = vecNorm(target.x - p.x, target.y - p.y)
      p.aimX = v.x
      p.aimY = v.y
      p.facing = v.x >= 0 ? 1 : -1
    } else if (p.moving) {
      var mv = vecNorm(this.moveX, this.moveY)
      p.aimX = mv.x
      p.aimY = mv.y
    } else {
      if (Math.abs(this.moveX) > 0.2) p.facing = this.moveX > 0 ? 1 : -1
    }
  }

  Game.prototype._moveWithCollision = function (ent, dx, dy) {
    var r = ent.r || 10
    var nx = ent.x + dx
    var ny = ent.y + dy
    if (!this._circleBlocked(nx, ent.y, r)) ent.x = nx
    if (!this._circleBlocked(ent.x, ny, r)) ent.y = ny
    /* 房间边界保底 */
    if (ent.x < r) ent.x = r
    if (ent.y < r) ent.y = r
    if (ent.x > this.worldW - r) ent.x = this.worldW - r
    if (ent.y > this.worldH - r) ent.y = this.worldH - r
  }

  Game.prototype._circleBlocked = function (x, y, r) {
    var off = r * 0.72
    if (this.isSolidPx(x - off, y - off)) return true
    if (this.isSolidPx(x + off, y - off)) return true
    if (this.isSolidPx(x - off, y + off)) return true
    if (this.isSolidPx(x + off, y + off)) return true
    return false
  }

  /* ================= 开火 ================= */

  Game.prototype._updateWeapons = function (dt) {
    var p = this.player
    if (!p || p.dead) return
    for (var i = 0; i < p.weapons.length; i++) {
      var w = p.weapons[i]
      if (!w) continue
      if (w.cd > 0) w.cd -= dt
      if (w.burstLeft > 0) {
        w.burstT -= dt
        if (w.burstT <= 0) {
          w.burstLeft -= 1
          w.burstT = w.def.burstGap || 0.06
          this._fireOnce(w, w.burstDirX, w.burstDirY)
        }
      }
    }
    if (!this.firing || p.dead) return
    if (this.state !== 'playing') return
    var active = p.weapons[p.activeSlot]
    if (!active) return
    if (p.fireCd > 0) return
    var aim = vecNorm(p.aimX, p.aimY)
    this._startFire(active, aim.x, aim.y)
    if (p.dualWieldT > 0) {
      var other = p.weapons[p.activeSlot === 0 ? 1 : 0]
      if (other && other !== active && other.cd <= 0) this._startFire(other, aim.x, aim.y)
    }
  }

  Game.prototype._startFire = function (w, ax, ay) {
    var def = w.def
    if (!def) return false
    var p = this.player
    if (def.energy > 0) {
      if (p.energy < def.energy) {
        if (p.energyWarnT <= 0) {
          p.energyWarnT = 1.2
          this._addFloat(p.x, p.y - 30, '能量不足', '#4dd0e1')
        }
        p.fireCd = 0.3
        return false
      }
      p.energy -= def.energy
    }
    var rate = def.fireRate / ((this.mods.fireRateMul || 1))
    if (rate < 0.05) rate = 0.05
    w.cd = rate
    p.fireCd = rate * 0.72
    if (p.passive === '蓄力加快' && def.category === 'bow') p.fireCd *= 0.85
    if (def.pattern === 'arc') {
      this._meleeSwing(w, ax, ay)
    } else if (def.pattern === 'beam') {
      this._fireBeam(w, ax, ay)
    } else if (def.pattern === 'burst' && (def.burst || 1) > 1) {
      w.burstLeft = (def.burst || 1) - 1
      w.burstT = def.burstGap || 0.06
      w.burstDirX = ax
      w.burstDirY = ay
      this._fireOnce(w, ax, ay)
    } else {
      this._fireOnce(w, ax, ay)
    }
    return true
  }

  Game.prototype._fireOnce = function (w, ax, ay) {
    var def = w.def
    var p = this.player
    var count = def.projectiles || 1
    var totalSpread = def.spread || 0
    var baseAng = Math.atan2(ay, ax)
    var element = def.element || this.mods.elementAdd || ''
    var color = def.color || '#ffe066'
    if (element && ELEMENT[element]) color = ELEMENT[element].color
    for (var i = 0; i < count; i++) {
      var ang = baseAng
      if (count > 1) ang = baseAng - totalSpread / 2 + totalSpread * (i / (count - 1))
      else if (totalSpread > 0) ang = baseAng + (this.rng() - 0.5) * totalSpread
      var dmg = def.dmg * (this.mods.damageMul || 1)
      if (p.passiveType === 'gun') dmg *= 1.10
      var isCrit = this.rng() * 100 < ((p.crit || 0) + (def.critBonus || 0))
      if (isCrit) dmg *= 2
      this._spawnBullet(p.x + ax * 14, p.y + ay * 10 - 4, Math.cos(ang), Math.sin(ang), {
        owner: 'player',
        dmg: dmg,
        crit: isCrit,
        speed: (def.speed || 500) * (1 + (this.mods.rangeMul || 1) * 0),
        life: def.life || 0.9,
        size: def.size || 5,
        color: color,
        pierce: (def.pierce || 0) + (this.mods.pierceAdd || 0),
        bounce: (def.bounce || 0) + (this.mods.bounceAdd || 0),
        element: element,
        explodeRadius: def.explodeRadius || 0,
        knock: def.knockback || 0,
        chain: def.chain || 0
      })
    }
    var sname = def.category === 'launcher' ? 'shot_heavy' : 'shot'
    this._sfx(sname)
    this.shake = Math.min(6, this.shake + (def.category === 'sniper' || def.category === 'launcher' ? 2.2 : 0.7))
  }

  Game.prototype._meleeSwing = function (w, ax, ay) {
    var def = w.def
    var p = this.player
    var range = (def.meleeRange || 56)
    var arc = def.arc || 1.9
    var base = Math.atan2(ay, ax)
    var dmg = def.dmg * (this.mods.damageMul || 1)
    if (p.passiveType === 'melee') dmg *= 1.12
    if (p.passive === '破甲冲击') dmg += 1
    this.effects.push({
      type: 'slash', x: p.x, y: p.y, ang: base, arc: arc, range: range,
      life: 0.16, maxLife: 0.16, color: def.color || '#ffe066', flip: p.facing
    })
    var count = 0
    for (var i = 0; i < this.enemies.length; i++) {
      var e = this.enemies[i]
      if (e.dead) continue
      var dx = e.x - p.x
      var dy = e.y - p.y
      if (dx * dx + dy * dy > (range + e.r) * (range + e.r)) continue
      var a = Math.atan2(dy, dx)
      var diff = Math.abs(this._angDiff(a, base))
      if (diff > arc / 2) continue
      var isCrit = this.rng() * 100 < ((p.crit || 0) + (def.critBonus || 0))
      this._damageEnemy(e, dmg * (isCrit ? 2 : 1), { crit: isCrit, element: def.element || this.mods.elementAdd, knock: def.knockback, sourceX: p.x, sourceY: p.y })
      count++
    }
    this._sfx('slash')
    if (count > 0) this.shake = Math.min(6, this.shake + 1.2)
  }

  Game.prototype._fireBeam = function (w, ax, ay) {
    var def = w.def
    var p = this.player
    var maxLen = 760
    var end = { x: p.x + ax * maxLen, y: p.y + ay * maxLen }
    /* 逐格步进找墙 */
    for (var d = 12; d < maxLen; d += 8) {
      var bx = p.x + ax * d
      var by = p.y + ay * d
      if (this.isSolidPx(bx, by)) { end.x = bx; end.y = by; break }
    }
    var dmg = def.dmg * (this.mods.damageMul || 1)
    var isCrit = this.rng() * 100 < ((p.crit || 0) + (def.critBonus || 0))
    var hit = 0
    for (var i = 0; i < this.enemies.length; i++) {
      var e = this.enemies[i]
      if (e.dead) continue
      if (this._distToSegment(e.x, e.y, p.x, p.y, end.x, end.y) <= e.r + (def.size || 4)) {
        this._damageEnemy(e, dmg * (isCrit ? 2 : 1), { crit: isCrit, element: def.element, knock: 0, sourceX: p.x, sourceY: p.y })
        hit++
      }
    }
    this.effects.push({ type: 'beam', x1: p.x, y1: p.y, x2: end.x, y2: end.y, color: def.color || '#b3ecff', life: 0.12, maxLife: 0.12 })
    this._sfx('shot_heavy')
    if (hit) this.shake = Math.min(8, this.shake + 2)
  }

  Game.prototype._angDiff = function (a, b) {
    var d = a - b
    while (d > Math.PI) d -= Math.PI * 2
    while (d < -Math.PI) d += Math.PI * 2
    return d
  }

  Game.prototype._distToSegment = function (px, py, x1, y1, x2, y2) {
    var vx = x2 - x1
    var vy = y2 - y1
    var l2 = vx * vx + vy * vy
    if (l2 < 1) return Math.sqrt(dist2(px, py, x1, y1))
    var t = ((px - x1) * vx + (py - y1) * vy) / l2
    if (t < 0) t = 0
    if (t > 1) t = 1
    return Math.sqrt(dist2(px, py, x1 + vx * t, y1 + vy * t))
  }

  Game.prototype._spawnBullet = function (x, y, dx, dy, opts) {
    opts = opts || {}
    var speed = opts.speed || 500
    var v = vecNorm(dx, dy)
    var b = {
      x: x, y: y,
      vx: v.x * speed, vy: v.y * speed,
      owner: opts.owner || 'player',
      dmg: opts.dmg || 1,
      crit: !!opts.crit,
      life: opts.life || 1,
      maxLife: opts.life || 1,
      size: opts.size || 5,
      color: opts.color || '#ffe066',
      pierce: opts.pierce || 0,
      bounce: opts.bounce || 0,
      element: opts.element || '',
      explodeRadius: opts.explodeRadius || 0,
      knock: opts.knock || 0,
      chain: opts.chain || 0,
      hit: [],
      trail: opts.trail !== false
    }
    var cap = b.owner === 'enemy' ? ENEMY_BULLET_CAP : PLAYER_BULLET_CAP
    var list = this.bullets
    /* 环形弹幕标记 noRecycle：不按上限回收，直接飞出去 */
    if (list.length >= cap && !opts.noRecycle) list.shift()
    list.push(b)
    return b
  }

  /* ================= 子弹 ================= */

  Game.prototype._updateBullets = function (dt) {
    var out = []
    for (var i = 0; i < this.bullets.length; i++) {
      var b = this.bullets[i]
      b.life -= dt
      if (b.life <= 0) continue
      b.x += b.vx * dt
      b.y += b.vy * dt
      /* 子弹直接打破木箱/木桶/宝箱，避免必须贴脸按交互 */
      if (b.owner === 'player') {
        var hitChest = this._chestAt(b.x, b.y, b.size)
        if (hitChest) this._openChest(hitChest)
      }
      /* 墙 */
      if (this.isSolidPx(b.x, b.y)) {
        if (b.bounce > 0) {
          b.bounce -= 1
          var tx = Math.floor(b.x / TILE)
          var ty = Math.floor(b.y / TILE)
          var sx = this.isSolidPx(b.x - Math.sign(b.vx) * 3, b.y)
          var sy = this.isSolidPx(b.x, b.y - Math.sign(b.vy) * 3)
          if (sx && !sy) b.vx = -b.vx
          else if (sy && !sx) b.vy = -b.vy
          else { b.vx = -b.vx; b.vy = -b.vy }
          b.x = tx * TILE + TILE / 2
          b.y = ty * TILE + TILE / 2
        } else {
          if (b.explodeRadius > 0) this._explode(b.x, b.y, b.explodeRadius, b.dmg, b.owner, b.element)
          out.push(b)
          continue
        }
      }
      if (b.x < -40 || b.y < -40 || b.x > this.worldW + 40 || b.y > this.worldH + 40) {
        out.push(b)
        continue
      }
      /* 碰撞 */
      var consumed = false
      if (b.owner === 'player') {
        for (var e = 0; e < this.enemies.length; e++) {
          var en = this.enemies[e]
          if (en.dead) continue
          if (b.hit.indexOf(en) >= 0) continue
          if (dist2(b.x, b.y, en.x, en.y) > (en.r + b.size) * (en.r + b.size)) continue
          b.hit.push(en)
          var hitDmg = b.dmg
          if (b.element && this.player && this.player.passive === '元素精通') hitDmg += 1
          this._damageEnemy(en, hitDmg, { crit: b.crit, element: b.element, knock: b.knock, sourceX: b.x, sourceY: b.y })
          if (b.crit && this.player && this.player.passive === '暴击穿透') b.pierce += 1
          if (b.explodeRadius > 0) {
            this._explode(b.x, b.y, b.explodeRadius, b.dmg * 0.7, 'player', b.element)
            consumed = true
            break
          }
          if (b.pierce > 0) { b.pierce -= 1 }
          else { consumed = true; break }
        }
      } else if (b.owner === 'enemy') {
        var p = this.player
        if (p && !p.dead && p.invuln <= 0 && dist2(b.x, b.y, p.x, p.y) <= (p.r + b.size) * (p.r + b.size)) {
          this._damagePlayer(b.dmg, b.x, b.y, b.element)
          if (b.explodeRadius > 0) this._explode(b.x, b.y, b.explodeRadius, b.dmg * 0.6, 'enemy', b.element)
          if (p.passive === '近战反弹') {
            b.owner = 'player'
            b.vx = -b.vx * 1.25
            b.vy = -b.vy * 1.25
            b.dmg = Math.max(1, Math.round(b.dmg * 1.5))
            b.hit = []
            consumed = false
          } else {
            consumed = true
          }
        }
      }
      if (!consumed) out.push(b)
    }
    this.bullets = out
  }

  Game.prototype._explode = function (x, y, radius, dmg, owner, element) {
    this.effects.push({ type: 'explosion', x: x, y: y, r: radius, life: 0.3, maxLife: 0.3, color: element === 'fire' ? '#ff9f1c' : '#ffd93d' })
    this._addParticles(x, y, element === 'fire' ? '#ff9f1c' : '#ffd93d', 10, 180)
    this._sfx('explode')
    this.shake = Math.min(10, this.shake + 4)
    if (owner === 'player') {
      for (var i = 0; i < this.enemies.length; i++) {
        var e = this.enemies[i]
        if (e.dead) continue
        if (dist2(x, y, e.x, e.y) <= (radius + e.r) * (radius + e.r)) {
          this._damageEnemy(e, dmg, { element: element, knock: 80, sourceX: x, sourceY: y })
        }
      }
      var p = this.player
      if (p && !p.dead && dist2(x, y, p.x, p.y) > (radius + 40) * (radius + 40)) { /* 玩家自身爆炸不伤自己 */ }
    } else {
      var pl = this.player
      if (pl && !pl.dead && pl.invuln <= 0 && dist2(x, y, pl.x, pl.y) <= (radius + pl.r) * (radius + pl.r)) {
        this._damagePlayer(dmg, x, y, element)
      }
    }
  }

  /* ================= 敌人 ================= */

  /* 敌人所有攻击冷却统一缩短：射速更快 */
  Game.prototype._enemyCd = function (cd) {
    cd = Number(cd)
    if (!(cd > 0)) cd = 2
    return Math.max(0.25, cd * 0.72)
  }

  /* 找一个不卡墙的生成点：优先原位置，其次螺旋搜索，最后随机找空地 */
  Game.prototype._freeSpawnPos = function (x, y, r) {
    var minX = r + 2
    var maxX = this.worldW - r - 2
    var minY = r + 2
    var maxY = this.worldH - r - 2
    function free(px, py) {
      if (px < minX || px > maxX || py < minY || py > maxY) return false
      return !this._circleBlocked(px, py, r)
    }
    if (free.call(this, x, y)) return { x: x, y: y }
    var step = Math.max(14, r + 8)
    for (var ring = 1; ring <= 8; ring++) {
      var dist = step * ring
      var count = 8 + ring * 4
      for (var k = 0; k < count; k++) {
        var a = (Math.PI * 2 * k) / count
        var nx = x + Math.cos(a) * dist
        var ny = y + Math.sin(a) * dist
        if (free.call(this, nx, ny)) return { x: nx, y: ny }
      }
    }
    for (var tries = 0; tries < 80; tries++) {
      var rx = rint(this.rng, Math.ceil(minX), Math.floor(maxX))
      var ry = rint(this.rng, Math.ceil(minY), Math.floor(maxY))
      if (free.call(this, rx, ry)) return { x: rx, y: ry }
    }
    return { x: this.worldW / 2, y: this.worldH / 2 }
  }

  Game.prototype._spawnEnemy = function (defId, x, y, opts) {
    opts = opts || {}
    var def = enemyById(defId) || bossById(defId)
    if (!def) return null
    var floorIndex = this.run ? this.run.floorIndex : 1
    var elite = !!opts.elite
    var boss = !!opts.boss
    var chapterMul = 1 + (((this.run ? this.run.chapter : 1) || 1) - 1) * 0.22
    var mul = (1 + (floorIndex - 1) * 0.22) * chapterMul
    var hp = (def.hp || 10) * mul
    var dmg = ((def.dmg || 1) + Math.floor((floorIndex - 1) / 3)) * (1 + (chapterMul - 1) * 0.7)
    var radius = def.radius || 10
    if (elite) {
      var es = eliteScale()
      hp *= es.hp
      dmg = dmg * es.dmg
      radius *= 1.25
    }
    if (boss) hp = (def.hp || 200) * (1 + (floorIndex - 1) * 0.14) * chapterMul
    var sp = this._freeSpawnPos(x, y, radius)
    x = sp.x
    y = sp.y
    var e = {
      def: def,
      id: def.id,
      x: x, y: y,
      r: radius,
      hp: hp, maxHp: hp,
      dmg: dmg,
      speed: (def.speed || 40) * (elite ? 1.05 : 1) * (1 + (floorIndex - 1) * 0.02),
      behavior: boss ? 'boss' : (def.behavior || 'chase'),
      elite: elite,
      boss: boss,
      flying: !!def.flying,
      state: 'idle', stateT: 0,
      atkCd: this._enemyCd(rfloat(this.rng, 0.5, 1.6)),
      contactCd: 0,
      hitFlash: 0,
      dead: false,
      walkT: 0,
      dirX: 0, dirY: 0,
      phase: 0,
      patternIndex: 0,
      patternCd: {},
      summoned: false,
      teleT: 0
    }
    if (boss) {
      e.maxHp = hp
      e.atkCd = this._enemyCd(1.6)
    }
    this.enemies.push(e)
    return e
  }

  Game.prototype._updateEnemies = function (dt) {
    var p = this.player
    var alive = []
    for (var i = 0; i < this.enemies.length; i++) {
      var e = this.enemies[i]
      if (e.dead) continue
      /* 卡墙保护：生成点/移动被挤进墙时，拉回最近空地 */
      if (!e.flying && this._circleBlocked(e.x, e.y, e.r)) {
        var fp = this._freeSpawnPos(e.x, e.y, e.r)
        e.x = fp.x
        e.y = fp.y
      }
      if (e.hitFlash > 0) e.hitFlash -= dt
      if (e.contactCd > 0) e.contactCd -= dt
      if (e.atkCd > 0) e.atkCd -= dt
      if (e.stateT !== undefined) e.stateT += dt
      this._updateStatuses(e, dt)
      if (p && !p.dead) {
        if (e.behavior === 'boss') this._updateBoss(e, dt, p)
        else this._updateEnemyAI(e, dt, p)
        /* 接触伤害 */
        if (!p.dead && e.contactCd <= 0 && dist2(e.x, e.y, p.x, p.y) < (e.r + p.r) * (e.r + p.r)) {
          var cd = e.def.contactCd || 0.9
          if (e.behavior === 'bomb') cd = 1.2
          e.contactCd = cd
          this._damagePlayer(e.dmg, e.x, e.y, '')
        }
      }
      if (!e.dead) alive.push(e)
    }
    this.enemies = alive
  }

  Game.prototype._updateStatuses = function (e, dt) {
    var st = e.statuses
    if (!st) return
    if (st.burn > 0) {
      st.burn -= dt
      st.burnTick -= dt
      if (st.burnTick <= 0) { st.burnTick = 0.5; this._damageEnemy(e, 1, { silent: true }) }
    }
    if (st.poison > 0) {
      st.poison -= dt
      st.poisonTick -= dt
      if (st.poisonTick <= 0) { st.poisonTick = 0.8; this._damageEnemy(e, 1, { silent: true }) }
    }
    if (st.freeze > 0) st.freeze -= dt
  }

  Game.prototype._updateEnemyAI = function (e, dt, p) {
    var d = Math.sqrt(dist2(e.x, e.y, p.x, p.y))
    var v = vecNorm(p.x - e.x, p.y - e.y)
    var speed = e.speed * (e.statuses && e.statuses.freeze > 0 ? 0.5 : 1)
    var behavior = e.behavior
    var attack = e.def.attack || {}
    var move = { x: 0, y: 0 }

    if (behavior === 'chase' || behavior === 'tank') {
      move.x = v.x * speed
      move.y = v.y * speed
    } else if (behavior === 'shoot' || behavior === 'strafe') {
      var range = attack.range || 260
      if (d > range * 0.9) { move.x = v.x * speed; move.y = v.y * speed }
      else if (d < range * 0.45) { move.x = -v.x * speed; move.y = -v.y * speed }
      else if (behavior === 'strafe') { move.x = -v.y * speed * 0.8; move.y = v.x * speed * 0.8 }
      if (e.atkCd <= 0 && d < range + 80) {
        this._enemyShoot(e, p, attack)
        e.atkCd = this._enemyCd(attack.cd || 1.8)
      }
    } else if (behavior === 'burst') {
      if (d > 240) { move.x = v.x * speed; move.y = v.y * speed }
      if (e.atkCd <= 0 && d < 420) {
        this._enemyShoot(e, p, attack)
        e.atkCd = this._enemyCd(attack.cd || 2.2)
      }
    } else if (behavior === 'charge') {
      if (e.state === 'dash') {
        e.x += e.dirX * speed * 3.1 * dt
        e.y += e.dirY * speed * 3.1 * dt
        if (!e.flying && this._circleBlocked(e.x, e.y, e.r)) {
          e.x -= e.dirX * speed * 3.1 * dt
          e.y -= e.dirY * speed * 3.1 * dt
          e.state = 'cool'
          e.stateT = 0
        }
        if (e.stateT > 0.42) { e.state = 'cool'; e.stateT = 0; e.atkCd = this._enemyCd(2.4) }
      } else if (e.state === 'tele') {
        if (e.stateT > 0.55) {
          e.state = 'dash'
          e.stateT = 0
          e.dirX = v.x
          e.dirY = v.y
          this._sfx('dash')
        }
      } else {
        move.x = v.x * speed * 0.6
        move.y = v.y * speed * 0.6
        if (e.atkCd <= 0 && d < 340) {
          e.state = 'tele'
          e.stateT = 0
          e.atkCd = this._enemyCd(1.5)
        }
      }
    } else if (behavior === 'bomb') {
      if (e.state !== 'fuse') {
        move.x = v.x * speed
        move.y = v.y * speed
        if (d < 54) { e.state = 'fuse'; e.stateT = 0; this._sfx('skill') }
      } else if (e.stateT > 0.85) {
        this._explode(e.x, e.y, 60, e.dmg + 1, 'enemy', 'fire')
        e.dead = true
        this._addParticles(e.x, e.y, '#ff9f1c', 14, 180)
        return
      }
    } else if (behavior === 'summon') {
      var range2 = attack.range || 300
      if (d < range2) { move.x = -v.x * speed; move.y = -v.y * speed }
      if (e.atkCd <= 0) {
        if (this.enemies.length < 10) {
          var mob = attack.mob || (e.def.summonMob || 'slime')
          var ang = this.rng() * Math.PI * 2
          this._spawnEnemy(mob, e.x + Math.cos(ang) * 36, e.y + Math.sin(ang) * 36, {})
          this._addParticles(e.x, e.y, '#b06bff', 8, 120)
        }
        e.atkCd = this._enemyCd(attack.cd || 5)
      }
    } else if (behavior === 'burrow') {
      if (e.state === 'burrow') {
        if (e.stateT > 0.9) {
          var ang2 = this.rng() * Math.PI * 2
          e.x = p.x + Math.cos(ang2) * 46
          e.y = p.y + Math.sin(ang2) * 46
          e.state = 'idle'
          e.stateT = 0
          this._addParticles(e.x, e.y, '#d9b382', 10, 140)
          this._sfx('dash')
        }
      } else {
        move.x = v.x * speed
        move.y = v.y * speed
        if (e.atkCd <= 0 && d < 420) { e.state = 'burrow'; e.stateT = 0; e.atkCd = this._enemyCd(3.2) }
      }
    } else if (behavior === 'flyer') {
      move.x = v.x * speed
      move.y = v.y * speed
      if (e.atkCd <= 0 && d < 400) {
        this._enemyShoot(e, p, attack)
        e.atkCd = this._enemyCd(attack.cd || 2)
      }
    }
    if (move.x || move.y) {
      e.walkT += dt
      if (e.flying) {
        e.x += move.x * dt
        e.y += move.y * dt
        if (e.x < e.r) e.x = e.r
        if (e.y < e.r) e.y = e.r
        if (e.x > this.worldW - e.r) e.x = this.worldW - e.r
        if (e.y > this.worldH - e.r) e.y = this.worldH - e.r
      } else {
        this._moveWithCollision(e, move.x * dt, move.y * dt)
      }
    }
  }

  Game.prototype._enemyShoot = function (e, p, attack) {
    attack = attack || {}
    var count = attack.count || 1
    var spread = attack.spread || 0
    var base = angleOf(e.x, e.y, p.x, p.y)
    var speed = attack.speed || 210
    var element = attack.element || ''
    var color = element && ELEMENT[element] ? ELEMENT[element].color : '#ff8a8a'
    for (var i = 0; i < count; i++) {
      var ang = base
      if (count > 1) ang = base - spread / 2 + spread * (i / (count - 1))
      else if (spread > 0) ang = base + (this.rng() - 0.5) * spread
      this._spawnBullet(e.x, e.y, Math.cos(ang), Math.sin(ang), {
        owner: 'enemy', dmg: attack.dmg || e.dmg || 1, speed: speed,
        life: attack.life || 2.2, size: attack.size || 6, color: color,
        element: element
      })
    }
    this._sfx('shot')
  }

  /* ================= Boss ================= */

  Game.prototype._updateBoss = function (e, dt, p) {
    var def = e.def
    var d = Math.sqrt(dist2(e.x, e.y, p.x, p.y))
    var v = vecNorm(p.x - e.x, p.y - e.y)
    /* 阶段 */
    var phase = 0
    var pa = def.phaseAt || []
    for (var i = 0; i < pa.length; i++) {
      if (e.hp / e.maxHp < pa[i]) phase++
    }
    var maxPhase = (def.routine && def.routine.length) ? def.routine.length - 1 : 0
    if (phase > maxPhase) phase = maxPhase
    if (phase !== e.phase) {
      e.phase = phase
      e.atkCd = this._enemyCd(0.6)
      this._addParticles(e.x, e.y, '#ff5a5a', 20, 200)
      this.shake = Math.min(10, this.shake + 5)
    }
    if (e.state === 'charge_dash') {
      e.x += e.dirX * e.speed * 4.6 * dt
      e.y += e.dirY * e.speed * 4.6 * dt
      if (this._circleBlocked(e.x, e.y, e.r)) {
        e.x -= e.dirX * e.speed * 4.6 * dt
        e.y -= e.dirY * e.speed * 4.6 * dt
        e.state = 'idle'
        e.atkCd = this._enemyCd(1.2)
      }
      if (e.stateT > 0.5) { e.state = 'idle'; e.stateT = 0; e.atkCd = this._enemyCd(1.2) }
      return
    }
    if (e.state === 'charge_tele') {
      if (e.stateT > 0.7) {
        e.state = 'charge_dash'
        e.stateT = 0
        e.dirX = v.x
        e.dirY = v.y
        this._sfx('boss_roar')
      }
      return
    }
    /* 普通移动：保持在 150~260 距离 */
    var speed = e.speed
    if (d > 260) this._moveWithCollision(e, v.x * speed * dt, v.y * speed * dt)
    else if (d < 120) this._moveWithCollision(e, -v.x * speed * 0.6 * dt, -v.y * speed * 0.6 * dt)
    if (e.atkCd > 0) return
    var routine = def.routine || [['radial', 'aimed'], ['charge', 'radial']]
    var list = routine[Math.min(routine.length - 1, e.phase)] || routine[0]
    var name = list[e.patternIndex % list.length]
    e.patternIndex += 1
    var pattern = (def.patterns && def.patterns[name]) || {}
    this._bossPattern(e, name, pattern, p)
    var cd = pattern.cd || 2.6
    if (e.phase > 0) cd *= 0.82
    e.atkCd = this._enemyCd(cd)
  }

  Game.prototype._bossPattern = function (e, name, pat, p) {
    var count = pat.count || 8
    var speed = pat.speed || 170
    var dmg = pat.dmg || e.dmg
    var element = pat.element || e.def.element || ''
    var color = element && ELEMENT[element] ? ELEMENT[element].color : '#ff8a8a'
    var i
    if (name === 'charge') {
      e.state = 'charge_tele'
      e.stateT = 0
      this.effects.push({ type: 'ring', x: e.x, y: e.y, r: e.r + 10, life: 0.7, maxLife: 0.7, color: '#ff5a5a' })
      this._sfx('skill')
      return
    }
    if (name === 'summon') {
      var mob = pat.mob || 'goblin'
      for (i = 0; i < (pat.count || 2); i++) {
        var ang = this.rng() * Math.PI * 2
        this._spawnEnemy(mob, e.x + Math.cos(ang) * 60, e.y + Math.sin(ang) * 60, {})
      }
      this._addParticles(e.x, e.y, '#b06bff', 12, 140)
      return
    }
    if (name === 'radial' || name === 'ice_shards' || name === 'sword_wave') {
      /* 和 3 发扇形子弹完全同一条路径：普通子弹 _spawnBullet，直接打出去 */
      for (i = 0; i < count; i++) {
        var a = (Math.PI * 2 * i) / count
        this._spawnBullet(e.x, e.y, Math.cos(a), Math.sin(a), {
          owner: 'enemy', dmg: dmg, speed: speed, life: 2.4,
          size: pat.radius || 7, color: color, element: element
        })
      }
      this._sfx('shot_heavy')
      return
    }
    if (name === 'aimed' || name === 'sweep') {
      var base = angleOf(e.x, e.y, p.x, p.y)
      var spread = pat.spread || 0.18
      for (i = 0; i < count; i++) {
        var ang2 = base - spread / 2 + spread * (count > 1 ? i / (count - 1) : 0.5)
        this._spawnBullet(e.x, e.y, Math.cos(ang2), Math.sin(ang2), {
          owner: 'enemy', dmg: dmg, speed: speed, life: 2.4,
          size: pat.radius || 6, color: color, element: element
        })
      }
      this._sfx('shot')
      return
    }
    /* 未知 pattern 兜底：扇形 */
    for (i = 0; i < count; i++) {
      var a3 = Math.PI * 2 * i / count
      this._spawnBullet(e.x, e.y, Math.cos(a3), Math.sin(a3), {
        owner: 'enemy', dmg: dmg, speed: speed, life: 2.4, size: 6, color: color, element: element
      })
    }
  }

  Game.prototype._nearestEnemy = function (x, y, range) {
    var best = null
    var bestD = range * range
    for (var i = 0; i < this.enemies.length; i++) {
      var e = this.enemies[i]
      if (e.dead) continue
      var d = dist2(x, y, e.x, e.y)
      if (d < bestD) { bestD = d; best = e }
    }
    return best
  }

  Game.prototype._nearestEnemies = function (x, y, range, maxN) {
    var list = []
    for (var i = 0; i < this.enemies.length; i++) {
      var e = this.enemies[i]
      if (e.dead) continue
      var d = dist2(x, y, e.x, e.y)
      if (d <= range * range) list.push({ e: e, d: d })
    }
    list.sort(function (a, b) { return a.d - b.d })
    var out = []
    for (var j = 0; j < list.length && j < (maxN || 99); j++) out.push(list[j].e)
    return out
  }

  Game.prototype.aliveEnemyCount = function () {
    var n = 0
    for (var i = 0; i < this.enemies.length; i++) if (!this.enemies[i].dead) n++
    return n
  }

  /* ================= 伤害 ================= */

  Game.prototype._damageEnemy = function (e, dmg, opts) {
    if (!e || e.dead) return
    opts = opts || {}
    var final = Math.max(1, Math.round(dmg))
    e.hp -= final
    this.damageDealt += final
    if (!opts.silent) {
      e.hitFlash = 0.12
      this._addFloat(e.x + (this.rng() - 0.5) * 10, e.y - e.r - 6, String(final), opts.crit ? '#ffd93d' : '#ffffff')
      this._addParticles(e.x, e.y, opts.element && ELEMENT[opts.element] ? ELEMENT[opts.element].color : '#ffffff', opts.crit ? 6 : 3, 90)
      if (opts.knock && !e.boss) {
        var v = vecNorm(e.x - (opts.sourceX || e.x), e.y - (opts.sourceY || e.y))
        this._moveWithCollision(e, v.x * opts.knock * 0.03, v.y * opts.knock * 0.03)
      }
      if (opts.element) this._applyElementToEnemy(e, opts.element)
    }
    if (this.mods.lifesteal > 0) {
      var p = this.player
      if (p && !p.dead) p.hp = Math.min(p.maxHp, p.hp + final * this.mods.lifesteal)
    }
    if (e.hp <= 0) this._killEnemy(e)
  }

  Game.prototype._applyElementToEnemy = function (e, element) {
    if (e.boss) return
    if (!e.statuses) e.statuses = { burn: 0, burnTick: 0, poison: 0, poisonTick: 0, freeze: 0 }
    var st = e.statuses
    if (element === 'fire' && chance(this.rng, 0.35)) { st.burn = 3; st.burnTick = 0.5 }
    else if (element === 'poison' && chance(this.rng, 0.4)) { st.poison = 4; st.poisonTick = 0.8 }
    else if (element === 'ice' && chance(this.rng, 0.3)) { st.freeze = 2 }
  }

  Game.prototype._killEnemy = function (e) {
    if (!e || e.dead) return
    e.dead = true
    this.run.kills += 1
    this.killCount += 1
    this._addParticles(e.x, e.y, e.elite ? '#ffd93d' : '#ff8a8a', e.boss ? 30 : (e.elite ? 16 : 8), e.boss ? 260 : 140)
    var p = this.player
    if (p && !p.dead) {
      if (this.mods.killHeal > 0) p.hp = Math.min(p.maxHp, p.hp + this.mods.killHeal)
      if (this.mods.killEnergy > 0) p.energy = Math.min(p.maxEnergy, p.energy + this.mods.killEnergy)
    }
    /* 掉落 */
    if (!e.boss) {
      var coinRange = e.def.coins || [1, 3]
      var coins = rint(this.rng, coinRange[0], coinRange[1])
      if (e.elite) coins = Math.ceil(coins * 2.2)
      if (coins > 0) this._spawnPickup('coin', 'coin', e.x, e.y, coins)
      if (e.elite) {
        this._spawnPickup('weapon', this._rollWeaponId(), e.x + 14, e.y, 1)
        if (chance(this.rng, 0.5)) this._spawnPickup('gem', 'gem', e.x - 14, e.y, 1)
      } else if (chance(this.rng, 0.10)) {
        this._spawnPickup('gem', 'gem', e.x, e.y, 1)
      } else if (chance(this.rng, 0.08)) {
        this._spawnPickup('heart', 'heart', e.x, e.y, 1)
      }
    }
    this._sfx('hit')
    if (e.boss) {
      this.shake = Math.min(14, this.shake + 8)
      this._explode(e.x, e.y, 40, 0, 'enemy', '')
    }
  }

  Game.prototype._rollWeaponId = function () {
    var pool = ['pistol', 'smg', 'rifle', 'assault_rifle', 'shotgun', 'short_bow', 'apprentice_staff', 'rusty_blade', 'sniper', 'fire_staff', 'great_axe']
    return pick(this.rng, pool)
  }

  Game.prototype._damagePlayer = function (dmg, sx, sy, element) {
    var p = this.player
    if (!p || p.dead) return
    if (this.debugInvincible) return
    if (p.invuln > 0) return
    if (p.passive === '毒盾' && element === 'poison') return
    if (p.passive === '火盾' && element === 'fire') return
    var final = Math.max(1, Math.round(dmg))
    if (p.passive === '破甲保护' && p.armor > 0) final = Math.max(1, final - 1)
    this.damageTaken += final
    p.invuln = 0.62
    p.armorRegenT = 0
    p.hitFlash = 0.15
    this.shake = Math.min(10, this.shake + 3)
    this._sfx('hurt')
    var remain = final
    if (p.armor > 0) {
      var absorbed = Math.min(p.armor, remain)
      p.armor -= absorbed
      remain -= absorbed
    }
    if (remain > 0) p.hp -= remain
    if (element && ELEMENT[element]) {
      if (element === 'fire' && p.passive !== '火盾' && chance(this.rng, 0.3)) { p.statuses.burn = 2.5; p.statuses.burnTick = 0.5 }
      if (element === 'ice' && chance(this.rng, 0.3)) { p.statuses.freeze = 1.4 }
      if (element === 'poison' && p.passive !== '毒盾' && chance(this.rng, 0.3)) { p.statuses.poison = 3; p.statuses.poisonTick = 0.8 }
    }
    this._addParticles(p.x, p.y, '#ff5a5a', 6, 110)
    if (p.hp <= 0) { p.hp = 0; this._onPlayerDeath() }
  }

  Game.prototype._directHpDamage = function (dmg, color) {
    var p = this.player
    if (!p || p.dead) return
    p.hp -= dmg
    this._addFloat(p.x, p.y - 26, '-' + dmg, color || '#ff5a5a')
    if (p.hp <= 0) { p.hp = 0; this._onPlayerDeath() }
  }

  /* ================= 掉落物 ================= */

  Game.prototype._updatePickups = function (dt) {
    var p = this.player
    if (!p || p.dead) return
    var magnet = MAGNET_RANGE + (this.mods.magnetAdd || 0)
    var keep = []
    for (var i = 0; i < this.pickups.length; i++) {
      var pk = this.pickups[i]
      if (pk.picked) continue
      pk.life -= dt
      if (pk.life <= 0) continue
      pk.t = (pk.t || 0) + dt
      var dx = p.x - pk.x
      var dy = p.y - pk.y
      var d2 = dx * dx + dy * dy
      /* 金币/宝石/红心/能量自动吸附 */
      if (pk.kind !== 'weapon' && pk.kind !== 'potion_hp' && pk.kind !== 'potion_energy' && d2 < magnet * magnet) {
        var v = vecNorm(dx, dy)
        var pull = 460
        pk.x += v.x * pull * dt
        pk.y += v.y * pull * dt
      } else {
        pk.x += (pk.vx || 0) * dt
        pk.y += (pk.vy || 0) * dt
        pk.vx *= (1 - 4 * dt)
        pk.vy *= (1 - 4 * dt)
      }
      if (pk.kind !== 'weapon' && d2 < (p.r + 14) * (p.r + 14)) {
        this._collectPickup(pk)
        continue
      }
      keep.push(pk)
    }
    this.pickups = keep
  }

  Game.prototype._collectPickup = function (pk) {
    var p = this.player
    if (!pk || pk.picked) return
    var kind = pk.kind
    var count = pk.count || 1
    if (kind === 'coin') {
      var gain = Math.ceil(count * (this.mods.coinMul || 1))
      this.run.coins += gain
      this._addFloat(pk.x, pk.y - 8, '+' + gain, '#ffd93d')
      this._sfx('coin')
    } else if (kind === 'gem') {
      var g = Math.ceil(count * (this.mods.gemMul || 1))
      this.run.gemsCollected += g
      this._addFloat(pk.x, pk.y - 8, '+' + g + ' 宝石', '#e0a0ff')
      this._sfx('pickup')
    } else if (kind === 'heart') {
      p.hp = Math.min(p.maxHp, p.hp + 1)
      this._addFloat(pk.x, pk.y - 8, '+1', '#7ee787')
      this._sfx('heal')
    } else if (kind === 'energy') {
      p.energy = Math.min(p.maxEnergy, p.energy + 30)
      this._addFloat(pk.x, pk.y - 8, '+30', '#4dd0e1')
      this._sfx('pickup')
    } else if (kind === 'potion_hp') {
      p.hp = Math.min(p.maxHp, p.hp + 2)
      p.armor = Math.min(p.maxArmor, p.armor + 1)
      this._addFloat(pk.x, pk.y - 8, '+2', '#7ee787')
      this._sfx('heal')
    } else if (kind === 'potion_energy') {
      p.energy = Math.min(p.maxEnergy, p.energy + 60)
      this._addFloat(pk.x, pk.y - 8, '+60', '#4dd0e1')
      this._sfx('pickup')
    }
    pk.picked = true
  }

}
