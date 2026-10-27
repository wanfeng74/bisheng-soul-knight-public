/*
 * 引擎端到端集成测试（无浏览器）。
 *
 * 用假的 Canvas 2D 上下文构造 Game，覆盖：
 *   - 8 角色 × 技能、43 武器 × pattern 发射
 *   - 房间清怪 / 开门 / 奖励 / 宝箱持久化
 *   - 商店购买 / 雕像祈福 / Boss 三选一 / 传送门
 *   - 9 层推进到胜利、死亡复活/放弃、结算字段
 *   - 每帧渲染无异常且有绘制调用（防黑屏）
 *
 * 运行：node ui/scripts/test-engine.mjs
 */
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const GAME = path.join(process.cwd(), 'src', 'services', 'game')
const { Game } = await import(pathToFileURL(path.join(GAME, 'engine.js')).href)
const { CHARACTER_ORDER } = await import(pathToFileURL(path.join(GAME, 'characters.js')).href)
const { WEAPONS, WEAPON_ORDER } = await import(pathToFileURL(path.join(GAME, 'weapons.js')).href)

let pass = 0
let fail = 0
const fails = []
function ok(cond, msg) {
  if (cond) pass++
  else { fail++; fails.push(msg); console.log('  FAIL ' + msg) }
}
function noThrow(fn, msg) {
  try { fn(); ok(true, msg) } catch (e) { ok(false, msg + ': ' + (e && e.message)) }
}

function makeCtx() {
  const calls = { total: 0 }
  const noop = function () { calls.total++ }
  return {
    canvas: { width: 936, height: 287 },
    fillStyle: '#000', font: '12px sans-serif', textAlign: 'left', globalAlpha: 1, imageSmoothingEnabled: false,
    fillRect: noop, fillText: noop, clearRect: noop,
    save: function () {}, restore: function () {}, translate: function () {}, rotate: function () {},
    scale: function () {}, setTransform: function () {},
    measureText: function () { return { width: 10 } },
    createImageData: function (w, h) { return { width: w, height: h, data: new Uint8ClampedArray(w * h * 4) } },
    putImageData: function () {}, getImageData: function (x, y, w, h) { return { width: w, height: h, data: new Uint8ClampedArray(w * h * 4) } },
    _calls: calls
  }
}

function newGame(characterId, seed) {
  const ctx = makeCtx()
  let ended = null
  const g = new Game(ctx, { onEndRun: function (r) { ended = r }, sfx: function () {} })
  g.setCanvasPixels(936, 287)
  g.setViewport(960, 287)
  g.startRun({ characterId: characterId || 'knight', upgrades: {}, seed: seed || 20261026, gems: 500, settings: { autoAim: true } })
  g.state = 'playing'
  return { g: g, ctx: ctx, ended: function () { return ended } }
}

function frames(g, n, fire) {
  for (let i = 0; i < n; i++) {
    if (i % 3 === 0) g.setMove(Math.sin(i / 11), Math.cos(i / 13))
    if (fire && i % 2 === 0) g.setFire(true)
    g.update(16)
    g.render()
  }
}

/* ================= 1. 8 角色 × 技能 ================= */
console.log('\n== 1. 角色与技能 ==')
for (const cid of CHARACTER_ORDER) {
  const env = newGame(cid, 1234)
  const g = env.g
  ok(!!g.player, cid + ' 生成玩家')
  ok(g.player.maxHp > 0 && g.player.maxEnergy > 0, cid + ' 属性有效')
  g.state = 'playing'
  g.player.skillCd = 0
  const before = env.ctx._calls.total
  let okSkill = false
  try {
    g._spawnEnemy('slime', g.player.x + 100, g.player.y, {})
    okSkill = g.pressSkill() === true
  } catch (e) { ok(false, cid + ' 技能抛错: ' + e.message) }
  ok(okSkill, cid + ' 技能可释放')
  noThrow(function () { frames(g, 120, true) }, cid + ' 120 帧战斗无异常')
  ok(env.ctx._calls.total - before > 100, cid + ' 渲染有绘制调用')
}

/* ================= 2. 43 武器 × pattern ================= */
console.log('\n== 2. 武器发射 ==')
for (const wid of WEAPON_ORDER) {
  const env = newGame('knight', 777)
  const g = env.g
  g.state = 'playing'
  const def = WEAPONS[wid]
  g.player.weapons[0] = { id: wid, def: def, cd: 0, burstLeft: 0, burstT: 0, burstDirX: 1, burstDirY: 0 }
  g.player.activeSlot = 0
  g.player.energy = 999
  g.player.maxEnergy = 999
  g._spawnEnemy('slime', g.player.x + 70, g.player.y, {})
  try {
    g.setFire(true)
    for (let i = 0; i < 12; i++) { g.update(16); g.render() }
    ok(g.bullets.length + g.effects.length > 0 || def.pattern === 'arc', wid + ' 发射产生子弹/特效')
  } catch (e) {
    ok(false, wid + ' 发射抛错: ' + (e && e.message))
  }
}

/* ================= 3. 清房 / 开门 / 奖励 / 宝箱持久化 ================= */
console.log('\n== 3. 房间清怪与宝箱 ==')
{
  const env = newGame('knight', 4242)
  const g = env.g
  const f = g.floorData
  const battleKey = Object.keys(f.rooms).find(function (k) { return f.rooms[k].type === 'battle' })
  ok(!!battleKey, '找到战斗房')
  g._enterRoom(battleKey, null, false)
  g.state = 'playing'
  ok(g.enemies.length > 0, '战斗房生成敌人')
  g.player.invuln = 999
  for (let i = 0; i < 300 && g.enemies.length; i++) {
    for (const e of g.enemies.slice()) g._damageEnemy(e, 9999, {})
    g.update(16)
  }
  ok(g.room.cleared, '清怪后房间标记已清')
  ok(g.doors.every(function (d) { return d.open }), '清怪后门全部打开')
  ok(g.pickups.length + g.run.coins > 0, '清怪有金币/掉落奖励')
  const treasureKey = Object.keys(g.floorData.rooms).find(function (k) { return g.floorData.rooms[k].type === 'treasure' })
  if (treasureKey) {
    g._enterRoom(treasureKey, null, false)
    g.state = 'playing'
    const chests = g.chests.filter(function (c) { return !c.opened })
    ok(chests.length > 0, '宝箱房有宝箱')
    if (chests.length) {
      const chest = chests[0]
      g.player.x = chest.x
      g.player.y = chest.y
      g._updateInteract()
      ok(g.pressInteract() === true, '可交互开启宝箱')
      const idx = chest.idx
      ok(g.room.openedChests[idx] === true, '宝箱开启状态写回房间')
      g._enterRoom(battleKey, null, false)
      g._enterRoom(treasureKey, null, false)
      const again = g.chests.filter(function (c) { return c.idx === idx })
      ok(again.length === 0 || again[0].opened === true, '重进宝箱房不重置已开宝箱')
    }
  }
}

/* ================= 4. 商店 / 雕像 ================= */
console.log('\n== 4. 商店与雕像 ==')
{
  const env = newGame('rogue', 5150)
  const g = env.g
  g.state = 'playing'
  g.run.coins = 999
  g._openShop()
  ok(g.state === 'shop', '打开商店状态')
  const hud = g.getHud()
  ok(hud.shop && hud.shop.offers.length > 0, '商店有商品')
  let bought = false
  for (let i = 0; i < hud.shop.offers.length; i++) {
    if (!hud.shop.offers[i].sold && g.buyShop(i)) { bought = true; break }
  }
  ok(bought, '能买至少一件商品')
  ok(g.run.coins < 999, '购买扣金币')
  g.closeShop()
  ok(g.state === 'playing', '关闭商店回到游戏')

  const stKey = Object.keys(g.floorData.rooms).find(function (k) { return g.floorData.rooms[k].type === 'statue' })
  if (stKey) {
    g._enterRoom(stKey, null, false)
    g.state = 'playing'
    if (g.statue) {
      g.player.x = g.statue.x
      g.player.y = g.statue.y
      g._updateInteract()
      ok(g.pressInteract() === true, '雕像可交互')
      ok(g.state === 'buff_choice', '雕像触发天赋选择')
      const opt = g.getHud().buffOptions
      ok(opt.length > 0, '雕像提供天赋选项')
      g.chooseBuff(0)
      ok(g.state === 'playing' && g.room.statueUsed === true, '雕像选完变为已使用')
    }
  }
}

/* ================= 5. 20 层推进 / Boss / 天赋 / 胜利 ================= */
console.log('\n== 5. 二十层推进与胜利结算 ==')
{
  const env = newGame('paladin', 9090)
  const g = env.g
  g.player.invuln = 99999
  let pickCount = 0
  for (let floor = 1; floor <= 20; floor++) {
    if (g.ended) break
    if (g.run.floorIndex !== floor) { g.loadFloor(floor); g.state = 'playing' }
    const bossKey = g.floorData.bossKey
    g._enterRoom(bossKey, null, false)
    g.state = 'playing'
    const bossFloor = (floor % 5 === 0)
    if (bossFloor) {
      ok(g.enemies.some(function (e) { return e.boss }), '第 ' + floor + ' 层 Boss 已生成')
      g.player.invuln = 99999
      for (const e of g.enemies.slice()) g._damageEnemy(e, 99999, {})
      for (let i = 0; i < 10; i++) g.update(16)
      ok(g.room.cleared, '第 ' + floor + ' 层 Boss 房已清')
      ok(!!g.portal, '第 ' + floor + ' 层生成传送门')
      if (g.state === 'buff_choice') {
        const opts = g.getHud().buffOptions
        ok(opts.length > 0, '第 ' + floor + ' 层提供天赋选项')
        if (g.chooseBuff(0)) pickCount++
      }
      ok(pickCount >= Math.floor(floor / 5), '第 ' + floor + ' 层天赋已获得')
    } else {
      ok(!g.enemies.some(function (e) { return e.boss }), '第 ' + floor + ' 层不是首领关')
      ok(!!g.portal, '第 ' + floor + ' 层传送门房生成传送门')
    }
    if (floor < 20) {
      g._usePortal()
      g.state = 'playing'
      g.player.invuln = 99999
    } else {
      g._usePortal()
    }
  }
  ok(g.ended, '第 20 层后本局结束')
  const res = env.ended()
  ok(!!res, '结算回调触发')
  ok(res && res.outcome === 'victory', '结算结果 victory')
  ok(res && res.floor === 20, '结算记录到达第 20 层')
  ok(res && res.bossKills >= 4, '结算记录 Boss 击杀')
  ok(res && res.gemsEarned > 0, '结算发放宝石')
  ok(res && res.weapons.length > 0 && res.buffs.length > 0, '结算携带武器与天赋')
}

/* ================= 6. 死亡 / 复活 / 放弃 ================= */
console.log('\n== 6. 死亡与复活 ==')
{
  const env = newGame('wizard', 6060)
  const g = env.g
  g.state = 'playing'
  g.player.invuln = 0
  g._damagePlayer(9999, g.player.x, g.player.y, '')
  ok(g.state === 'revive', '阵亡进入复活选择')
  ok(g.getHud().revive && g.getHud().revive.cost > 0, '复活费用有效')
  ok(g.revive() === true, '宝石复活成功')
  ok(g.state === 'playing' && g.player.hp > 0, '复活后回到战斗')
  ok(g.run.revives === 1, '复活次数记录')
}
{
  const env = newGame('wizard', 6061)
  const g = env.g
  g.state = 'playing'
  g.player.invuln = 0
  g._damagePlayer(9999, g.player.x, g.player.y, '')
  if (g.state === 'revive') g.declineRevive()
  ok(g.ended && env.ended() && env.ended().outcome === 'dead', '拒绝复活进入失败结算')
}
{
  const env = newGame('elf', 6062)
  const g = env.g
  g.state = 'playing'
  g.abandonRun()
  ok(g.ended && env.ended() && env.ended().outcome === 'abandon', '放弃本局进入结算')
}

/* ================= 7. 黑屏防护 / 渲染稳定性 ================= */
console.log('\n== 7. 渲染稳定性 ==')
{
  const env = newGame('engineer', 7000)
  const g = env.g
  noThrow(function () {
    for (let i = 0; i < 900; i++) {
      g.setMove(Math.sin(i / 17), Math.cos(i / 19))
      if (i % 4 === 0) g.setFire(true)
      if (i % 53 === 0) g.pressSkill()
      if (i % 97 === 0) g.pressInteract()
      g.update(16)
      g.render()
      if (g.state === 'buff_choice') g.chooseBuff(0)
      if (g.state === 'shop') g.closeShop()
      if (g.state === 'revive') g.declineRevive()
      if (g.ended) break
    }
  }, '900 帧随机操作无异常')
  ok(env.ctx._calls.total > 10000, '渲染调用量正常 (' + env.ctx._calls.total + ')')
}

/* ================= 8. 8 技能的实际效果 ================= */
console.log('\n== 8. 技能效果 ==')
{
  const cases = {
    knight: function (g, e) {
      g.pressSkill()
      return g.player.dualWieldT > 0 && g.player.weapons[1] != null
    },
    rogue: function (g, e) {
      g.pressSkill()
      return g.player.rollT > 0 && g.player.invuln > 0
    },
    wizard: function (g, e) {
      const totalBefore = g.enemies.reduce(function (s, x) { return s + x.hp }, 0)
      g.pressSkill()
      const totalAfter = g.enemies.reduce(function (s, x) { return s + (x.dead ? 0 : x.hp) }, 0)
      return totalAfter < totalBefore
    },
    elf: function (g, e) {
      g.pressSkill()
      return e.hp < e.maxHp || e.dead
    },
    engineer: function (g, e) {
      g.pressSkill()
      return !!g.turret
    },
    assassin: function (g, e) {
      const x0 = g.player.x
      const y0 = g.player.y
      const hp0 = e.hp
      g.pressSkill()
      return (g.player.x !== x0 || g.player.y !== y0) && (e.hp < hp0 || e.dead)
    },
    alchemist: function (g, e) {
      g.pressSkill()
      return g.bullets.some(function (b) { return b.owner === 'player' && (b.element === 'poison' || b.explodeRadius > 0) })
    },
    paladin: function (g, e) {
      g.player.armor = 0
      g.pressSkill()
      return g.player.invuln >= 2 && g.player.armor >= g.player.maxArmor
    }
  }
  const skillAlias = {
    vampire: 'assassin', werewolf: 'rogue', berserker: 'knight', robot: 'engineer',
    priest: 'paladin', druid: 'elf', trapper: 'alchemist', qizong: 'wizard',
    transcendent: 'assassin', time_ninja: 'rogue',
    swordmaster: 'assassin', gunner: 'knight', lord: 'paladin', spellblade: 'wizard',
    captain: 'engineer', special_force: 'engineer', doctor: 'engineer', mecha_girl: 'engineer',
    necromancer: 'alchemist', cook: 'alchemist', sheriff: 'knight', taoist: 'rogue',
    suit_prince: 'knight', martialist: 'rogue', bard: 'elf', marksman: 'knight',
    gun_expert: 'engineer', owl: 'assassin', elemental: 'wizard', demon_warlock: 'alchemist',
    miner: 'engineer', astrologer: 'elf', illusionist: 'assassin', yinyang: 'paladin'
  }
  for (const cid of CHARACTER_ORDER) {
    const env = newGame(cid, 8888)
    const g = env.g
    g.state = 'playing'
    g.player.skillCd = 0
    /* 造一个近处目标 + 两个略微分散的目标，覆盖链式/箭雨/瞬移 */
    const e = g._spawnEnemy('slime', g.player.x + 60, g.player.y, {})
    g._spawnEnemy('slime', g.player.x + 90, g.player.y + 30, {})
    g._spawnEnemy('slime', g.player.x + 60, g.player.y - 40, {})
    const fn = cases[cid] || cases[skillAlias[cid]]
    let passed = false
    try { passed = fn(g, e) === true } catch (err) { passed = false; ok(false, cid + ' 技能效果抛错: ' + err.message) }
    ok(passed, cid + ' 技能产生预期效果')
  }
}

/* ================= 9. Boss 招式与阶段 ================= */
console.log('\n== 9. Boss 招式与阶段 ==')
{
  const bossIds = ['goblin_chief', 'sand_queen', 'ice_queen', 'dark_knight']
  for (const bid of bossIds) {
    const env = newGame('knight', 4321)
    const g = env.g
    g.state = 'playing'
    g.player.invuln = 9999
    const boss = g._spawnEnemy(bid, g.player.x + 120, g.player.y, { boss: true })
    ok(!!boss, bid + ' 可生成')
    const def = boss.def
    const names = Object.keys(def.patterns || {})
    ok(names.length >= 4, bid + ' 至少 4 种招式')
    for (const name of names) {
      const bullets0 = g.bullets.length
      const enemies0 = g.enemies.length
      boss.state = 'idle'
      boss.stateT = 0
      noThrow(function () {
        g._bossPattern(boss, name, def.patterns[name], g.player)
      }, bid + ' 招式 ' + name + ' 可执行')
      const changed = g.bullets.length > bullets0 || g.enemies.length > enemies0 || boss.state === 'charge_tele'
      ok(changed, bid + ' 招式 ' + name + ' 产生效果')
    }
    /* 阶段切换 */
    boss.hp = boss.maxHp * 0.4
    g._updateBoss(boss, 0.016, g.player)
    ok(boss.phase >= 1, bid + ' 半血后进入第二阶段')
  }
}

/* ================= 10. 元素 / 精英 / 磁吸 / 护甲回复 ================= */
console.log('\n== 10. 元素与战斗细节 ==')
{
  const env = newGame('knight', 2468)
  const g = env.g
  g.state = 'playing'
  g.player.invuln = 9999
  /* 元素状态 */
  const els = ['fire', 'poison', 'ice']
  for (const el of els) {
    let applied = 0
    for (let i = 0; i < 30; i++) {
      const e = g._spawnEnemy('slime', g.player.x + 300 + i * 4, g.player.y + 200, {})
      g._damageEnemy(e, 1, { element: el })
      if (e.statuses && (e.statuses.burn > 0 || e.statuses.poison > 0 || e.statuses.freeze > 0)) applied++
      e.dead = true
    }
    ok(applied > 0, el + ' 元素可施加状态 (' + applied + '/30)')
  }
  /* 持续伤害 */
  const dot = g._spawnEnemy('slime', g.player.x + 120, g.player.y, {})
  dot.statuses = { burn: 5, burnTick: 0.01, poison: 0, poisonTick: 1, freeze: 0 }
  const hp0 = dot.hp
  g._updateStatuses(dot, 0.02)
  ok(dot.hp < hp0, '灼烧持续伤害生效')
  /* 精英数值 */
  const normal = g._spawnEnemy('slime', g.player.x + 400, g.player.y + 200, {})
  const elite = g._spawnEnemy('slime', g.player.x + 440, g.player.y + 200, { elite: true })
  ok(elite.hp > normal.hp && elite.r > normal.r && elite.dmg >= normal.dmg, '精英怪数值增强')
  /* 磁吸拾取 */
  const coins0 = g.run.coins
  g._spawnPickup('coin', 'coin', g.player.x + 70, g.player.y, 3)
  for (let i = 0; i < 30; i++) g.update(16)
  ok(g.run.coins > coins0, '金币磁吸拾取生效')
  /* 木箱破坏 */
  g._addChest(g.player.x + 20, g.player.y, 'crate', 22)
  const crate = g.chests[g.chests.length - 1]
  const picks0 = g.pickups.length
  g._openChest(crate)
  ok(g.pickups.length > picks0, '木箱可破坏并掉落')
  /* 护甲回复 */
  g.player.armor = 0
  g.player.armorRegenT = 5
  for (let i = 0; i < 90; i++) g.update(16)
  ok(g.player.armor > 0, '护甲延迟后回复')
  /* 自动瞄准 */
  g.enemies = []
  const target = g._spawnEnemy('slime', g.player.x + 120, g.player.y, {})
  g._updateAim(0.016)
  ok(g.player.aimX > 0.85, '自动瞄准锁定右侧最近敌人')
  ok(!!target, '瞄准目标存在')
}

/* ================= 汇总 ================= */
console.log('\n' + '='.repeat(60))
console.log('结果: ' + pass + ' 通过, ' + fail + ' 失败')
if (fails.length) {
  console.log('失败项:')
  for (const f of fails) console.log('  - ' + f)
  process.exit(1)
}
