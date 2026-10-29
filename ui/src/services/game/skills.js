/*
 * 8 个职业技能实现。
 * 约定：castSkill(game) 返回 true 表示释放成功（引擎才进入冷却）。
 */
import { ELEMENT } from './constants.js'

function vecNorm(x, y) {
  var l = Math.sqrt(x * x + y * y)
  if (l < 0.0001) return { x: 1, y: 0, l: 0 }
  return { x: x / l, y: y / l, l: l }
}

function dmgOf(game, base) {
  var pw = (game.player && game.player.skill && game.player.skill.power) ? game.player.skill.power : 1
  return base * (game.mods.damageMul || 1) * pw
}

function nearest(game, range) {
  var p = game.player
  return game._nearestEnemy(p.x, p.y, range)
}

function ring(game, x, y, color, count) {
  game.effects.push({ type: 'ring', x: x, y: y, r: 12, life: 0.45, maxLife: 0.45, color: color })
  game._addParticles(x, y, color, count || 10, 160)
}

export function castSkill(game) {
  var p = game.player
  if (!p) return false
  var id = p.skill && p.skill.id
  if (id === 'dual_wield') return castDualWield(game, p)
  if (id === 'roll') return castRoll(game, p)
  if (id === 'arcane_bolt') return castArcaneBolt(game, p)
  if (id === 'arrow_rain') return castArrowRain(game, p)
  if (id === 'turret') return castTurret(game, p)
  if (id === 'shadow_strike') return castShadowStrike(game, p)
  if (id === 'poison_flask') return castPoisonFlask(game, p)
  if (id === 'holy_shield') return castHolyShield(game, p)
  if (id === 'beam') return castBeam(game, p)
  if (id === 'nova') return castNova(game, p)
  if (id === 'transform') return castTransform(game, p)
  if (id === 'heal') return castHeal(game, p)
  if (id === 'dash_strike') return castDashStrike(game, p)
  if (id === 'blackhole') return castBlackhole(game, p)
  if (id === 'meteor') return castMeteor(game, p)
  return false
}

/* 通用：黑洞牵引 */
function castBlackhole(game, p) {
  var target = nearest(game, 420)
  var cx = target ? target.x : p.x + p.aimX * 180
  var cy = target ? target.y : p.y + p.aimY * 180
  var radius = p.skill.radius || 200
  game.effects.push({ type: 'ring', x: cx, y: cy, r: radius, life: 0.8, maxLife: 0.8, color: '#b06bff' })
  for (var i = 0; i < game.enemies.length; i++) {
    var e = game.enemies[i]
    if (e.dead) continue
    var dx = e.x - cx
    var dy = e.y - cy
    if (dx * dx + dy * dy > radius * radius) continue
    e.x -= dx * 0.5
    e.y -= dy * 0.5
    game._damageEnemy(e, dmgOf(game, 5), { element: p.skill.element || '', knock: 0, sourceX: cx, sourceY: cy })
  }
  game._sfx('skill')
  return true
}

/* 通用：陨石 */
function castMeteor(game, p) {
  var target = nearest(game, 460)
  var cx = target ? target.x : p.x + p.aimX * 180
  var cy = target ? target.y : p.y + p.aimY * 180
  var count = p.skill.arrows || 4
  for (var i = 0; i < count; i++) {
    var mx = cx + (game.rng() - 0.5) * 120
    var my = cy + (game.rng() - 0.5) * 120
    game._spawnBullet(mx, my, 0, 0, {
      owner: 'player', dmg: dmgOf(game, 5), speed: 0, life: 0.5, size: 7,
      color: '#ffb86b', element: 'fire', explodeRadius: 50
    })
  }
  game._sfx('skill')
  return true
}

/* 通用：短时强化/免伤 */
function castTransform(game, p) {
  p.invuln = Math.max(p.invuln || 0, 0.5)
  p.transformT = p.skill.duration || 5
  game.effects.push({ type: 'ring', x: p.x, y: p.y, r: 60, life: 0.6, maxLife: 0.6, color: '#ffd93d' })
  game._addParticles(p.x, p.y, '#ffd93d', 16, 160)
  game._addFloat(p.x, p.y - 36, '强化!', '#ffd93d')
  game._sfx('skill')
  return true
}

/* 通用：治疗/护盾 */
function castHeal(game, p) {
  p.hp = Math.min(p.maxHp, p.hp + 2)
  p.armor = Math.min(p.maxArmor, p.armor + 2)
  p.energy = Math.min(p.maxEnergy, p.energy + 20)
  game.effects.push({ type: 'ring', x: p.x, y: p.y, r: 80, life: 0.6, maxLife: 0.6, color: '#7ee787' })
  game._addFloat(p.x, p.y - 36, '恢复', '#7ee787')
  game._sfx('skill')
  return true
}

/* 通用：翻滚 + 斩击 */
function castDashStrike(game, p) {
  var ok = castRoll(game, p)
  var radius = p.skill.radius || 100
  for (var i = 0; i < game.enemies.length; i++) {
    var e = game.enemies[i]
    if (e.dead) continue
    var dx = e.x - p.x
    var dy = e.y - p.y
    if (dx * dx + dy * dy > radius * radius) continue
    game._damageEnemy(e, dmgOf(game, 6), { element: p.skill.element || '', knock: 50, sourceX: p.x, sourceY: p.y })
  }
  game.effects.push({ type: 'ring', x: p.x, y: p.y, r: radius, life: 0.4, maxLife: 0.4, color: '#a5e887' })
  game._sfx('skill')
  return ok || true
}

/* 通用：直线光束 */
function castBeam(game, p) {
  var range = 420
  var dx = p.aimX || 1
  var dy = p.aimY || 0
  var len = Math.sqrt(dx * dx + dy * dy) || 1
  dx /= len; dy /= len
  var hx = p.x + dx * range
  var hy = p.y + dy * range
  game.effects.push({ type: 'beam', x1: p.x, y1: p.y, x2: hx, y2: hy, color: '#ffe066', life: 0.22, maxLife: 0.22 })
  for (var i = 0; i < game.enemies.length; i++) {
    var e = game.enemies[i]
    if (e.dead) continue
    var ex = e.x - p.x
    var ey = e.y - p.y
    var t = ex * dx + ey * dy
    if (t < 0 || t > range) continue
    var px = ex - dx * t
    var py = ey - dy * t
    if (px * px + py * py > 26 * 26) continue
    game._damageEnemy(e, dmgOf(game, 7), { element: (p.skill.element || 'lightning'), knock: 42, sourceX: p.x, sourceY: p.y })
    game._addParticles(e.x, e.y, '#ffe066', 6, 140)
  }
  game.shake = Math.min(8, game.shake + 2)
  game._sfx('skill')
  return true
}

/* 通用：自身范围冲击 */
function castNova(game, p) {
  var radius = p.skill.radius || 145
  game.effects.push({ type: 'ring', x: p.x, y: p.y, r: radius, life: 0.45, maxLife: 0.45, color: '#c86bff' })
  for (var i = 0; i < game.enemies.length; i++) {
    var e = game.enemies[i]
    if (e.dead) continue
    var dx = e.x - p.x
    var dy = e.y - p.y
    if (dx * dx + dy * dy > radius * radius) continue
    game._damageEnemy(e, dmgOf(game, 6), { element: (p.skill.element || ''), knock: 110, sourceX: p.x, sourceY: p.y })
  }
  game._addParticles(p.x, p.y, '#c86bff', 16, 180)
  game.shake = Math.min(8, game.shake + 3)
  game._sfx('skill')
  return true
}

/* 骑士：双持 6 秒 */
function castDualWield(game, p) {
  var active = p.weapons[p.activeSlot]
  if (!active) return false
  if (!p.weapons[1]) {
    p.weapons[1] = {
      id: active.id, def: active.def, cd: 0,
      burstLeft: 0, burstT: 0, burstDirX: 1, burstDirY: 0
    }
    if (game.run.weaponIds.indexOf(active.id) < 0) game.run.weaponIds.push(active.id)
  }
  p.dualWieldT = p.skill.duration || 6
  game._addFloat(p.x, p.y - 32, '双持!', '#ffd93d')
  ring(game, p.x, p.y, '#ffd93d', 12)
  game._sfx('skill')
  return true
}

/* 游侠：翻滚突进，短暂无敌 */
function castRoll(game, p) {
  var dir = vecNorm(game.moveX, game.moveY)
  if (dir.l < 0.15) dir = vecNorm(p.aimX, p.aimY)
  if (dir.l < 0.15) dir = { x: p.facing, y: 0, l: 1 }
  p.rollT = 0.34
  p.rollVX = dir.x * (p.skill.distance || 760)
  p.rollVY = dir.y * (p.skill.distance || 760)
  p.invuln = Math.max(p.invuln, 0.55)
  game.effects.push({ type: 'ring', x: p.x, y: p.y, r: 10, life: 0.28, maxLife: 0.28, color: '#7ee787' })
  game._addParticles(p.x, p.y, '#7ee787', 8, 130)
  game._sfx('dash')
  return true
}

/* 法师：奥术闪电（链式） */
function castArcaneBolt(game, p) {
  var target = nearest(game, 460)
  if (!target) return false
  var hit = [target]
  var cur = target
  var chains = p.skill.chains || 3
  for (var i = 0; i < chains; i++) {
    var next = null
    var bestD = 240 * 240
    for (var j = 0; j < game.enemies.length; j++) {
      var e = game.enemies[j]
      if (e.dead || hit.indexOf(e) >= 0) continue
      var dx = e.x - cur.x
      var dy = e.y - cur.y
      var d = dx * dx + dy * dy
      if (d < bestD) { bestD = d; next = e }
    }
    if (!next) break
    hit.push(next)
    cur = next
  }
  var fromX = p.x
  var fromY = p.y
  for (var k = 0; k < hit.length; k++) {
    var en = hit[k]
    game.effects.push({ type: 'beam', x1: fromX, y1: fromY, x2: en.x, y2: en.y, color: '#ffe066', life: 0.18, maxLife: 0.18 })
    game._damageEnemy(en, dmgOf(game, 6), { element: (p.skill.element || 'lightning'), knock: 30, sourceX: fromX, sourceY: fromY })
    game._addParticles(en.x, en.y, '#ffe066', 5, 120)
    fromX = en.x
    fromY = en.y
  }
  game.shake = Math.min(8, game.shake + 2)
  game._sfx('skill')
  return true
}

/* 精灵：箭雨（区域多段伤害） */
function castArrowRain(game, p) {
  var target = nearest(game, 520)
  var cx = p.x + p.aimX * 180
  var cy = p.y + p.aimY * 180
  if (target) { cx = target.x; cy = target.y }
  var radius = p.skill.radius || 150
  game.effects.push({ type: 'ring', x: cx, y: cy, r: radius, life: 0.55, maxLife: 0.55, color: '#a5e887' })
  var arrows = p.skill.arrows || 8
  for (var i = 0; i < arrows; i++) {
    var ang = Math.PI * 2 * i / arrows
    var ax = cx + Math.cos(ang) * (radius * 0.6)
    var ay = cy + Math.sin(ang) * (radius * 0.6)
    game.effects.push({ type: 'arrow', x: ax, y: ay, life: 0.35, maxLife: 0.35, color: '#a5e887' })
  }
  for (var j = 0; j < game.enemies.length; j++) {
    var e = game.enemies[j]
    if (e.dead) continue
    var dx = e.x - cx
    var dy = e.y - cy
    if (dx * dx + dy * dy > radius * radius) continue
    game._damageEnemy(e, dmgOf(game, 4), { element: (p.skill.element || ''), knock: 20, sourceX: cx, sourceY: cy })
  }
  game._sfx('skill')
  return true
}

/* 工程师：部署炮台 10 秒 */
function castTurret(game, p) {
  var tx = p.x + p.aimX * 34
  var ty = p.y + p.aimY * 34
  if (game.isSolidPx(tx, ty)) { tx = p.x; ty = p.y }
  game.turret = { x: tx, y: ty, life: (p.skill.duration || 10), cd: 0.2, r: 12, walkT: 0 }
  ring(game, tx, ty, '#ffd93d', 10)
  game._sfx('skill')
  return true
}

/* 刺客：影袭（瞬移到最近敌人背后并重击） */
function castShadowStrike(game, p) {
  var target = nearest(game, p.skill.range || 420)
  if (!target) return false
  var v = vecNorm(target.x - p.x, target.y - p.y)
  var tx = target.x + v.x * 26
  var ty = target.y + v.y * 26
  if (game._circleBlocked(tx, ty, p.r)) { tx = target.x - v.x * 26; ty = target.y - v.y * 26 }
  if (game._circleBlocked(tx, ty, p.r)) { tx = target.x; ty = target.y + 26 }
  game._addParticles(p.x, p.y, '#b06bff', 12, 140)
  p.x = tx
  p.y = ty
  p.invuln = Math.max(p.invuln, 0.5)
  game.effects.push({ type: 'slash', x: target.x, y: target.y, ang: Math.atan2(target.y - ty, target.x - tx), arc: 2.4, range: 40, life: 0.18, maxLife: 0.18, color: '#b06bff', flip: 1 })
  game._damageEnemy(target, dmgOf(game, 9), { crit: true, element: (p.skill.element || ''), knock: 50, sourceX: tx, sourceY: ty })
  game._addParticles(target.x, target.y, '#b06bff', 14, 170)
  game._sfx('slash')
  return true
}

/* 炼金术士：毒瓶（抛射 + 爆炸毒云） */
function castPoisonFlask(game, p) {
  var target = nearest(game, 480)
  var ang = Math.atan2(p.aimY, p.aimX)
  if (target) ang = Math.atan2(target.y - p.y, target.x - p.x)
  game._spawnBullet(p.x + Math.cos(ang) * 16, p.y + Math.sin(ang) * 12, Math.cos(ang), Math.sin(ang), {
    owner: 'player', dmg: dmgOf(game, 4), speed: 420, life: 1.2, size: 7,
    color: ELEMENT.poison.color, element: 'poison', explodeRadius: (p.skill.radius || 76), knock: 40
  })
  game._sfx('skill')
  return true
}

/* 圣骑士：神圣护盾（无敌 + 回血 + 满护甲） */
function castHolyShield(game, p) {
  p.invuln = Math.max(p.invuln, (p.skill.duration || 2.2))
  p.hp = Math.min(p.maxHp, p.hp + (p.skill.heal || 2))
  p.armor = p.maxArmor
  ring(game, p.x, p.y, '#ffd93d', 16)
  game._addFloat(p.x, p.y - 32, '圣盾!', '#ffd93d')
  game._sfx('heal')
  return true
}
