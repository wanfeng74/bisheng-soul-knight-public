/*
 * 存档层测试：多后端探测、normalize 坏档修复、写入/读取往返、重置。
 * 用内存 mock 模拟设备 jsapi.storage（回调 + 同步返回两种形态都覆盖）。
 */
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const UI = path.join(process.cwd(), 'src', 'services')
let pass = 0
let fail = 0
const fails = []
function ok(cond, msg) {
  if (cond) pass++
  else { fail++; fails.push(msg); console.log('  FAIL ' + msg) }
}

/* ---- 内存 storage mock ---- */
const store = new Map()
const mockStorage = {
  getStorage: function (arg, cb) {
    const v = store.has(arg.key) ? store.get(arg.key) : null
    if (cb) { cb({ data: v }); return { data: v } }
    return { data: v }
  },
  setStorage: function (arg, cb) {
    store.set(arg.key, arg.data)
    if (cb) { cb({}); return true }
    return true
  }
}
globalThis.$falcon = { jsapi: { storage: mockStorage }, env: { deviceWidth: 936, deviceHeight: 280 } }

const save = await import(pathToFileURL(path.join(UI, 'save.js')).href)

/* 1. 默认档结构 */
const d = save.defaultSave()
ok(d && d.v === 1, '默认档版本 v1')
ok(typeof d.gems === 'number' && d.gems >= 0, '默认档宝石字段')
ok(Array.isArray(d.unlockedChars) && d.unlockedChars.indexOf('knight') >= 0, '默认解锁骑士')
ok(d.settings && d.settings.soundOn === true, '默认音效开')
ok(d.stats && d.stats.runs === 0 && d.stats.bestFloor === 0, '默认统计字段')
ok(d.charUpgrades && typeof d.charUpgrades === 'object', '默认升级字段')

/* 2. 坏档 normalize */
const bad = save.normalize({
  gems: -5, lifetimeCoins: 'x', unlockedChars: ['knight', '', 5, 'rogue'],
  charUpgrades: { knight: { hp: 99, armor: -3, energy: 'a', crit: 2 }, rogue: null },
  unlockedWeapons: { pistol: 1, bad: 0 },
  achievements: { first_run: true, no: false },
  stats: { runs: -1, wins: '2', bestFloor: 999, playMs: -100 },
  settings: { soundOn: false, autoAim: null },
  lastChar: '', seenIntro: 1
})
ok(bad.gems === 0, '负数宝石钳到 0')
ok(bad.lifetimeCoins === 0, '非法金币钳到 0')
ok(bad.unlockedChars.length === 2, '角色数组过滤非法项')
ok(bad.charUpgrades.knight.hp === 99, '升级等级保留合法值')
ok(bad.charUpgrades.knight.armor === 0, '负升级等级钳到 0')
ok(bad.unlockedWeapons.pistol === true && !bad.unlockedWeapons.bad, '武器解锁过滤')
ok(bad.achievements.first_run === true && !bad.achievements.no, '成就过滤')
ok(bad.stats.runs === 0 && bad.stats.bestFloor <= 9999, '统计钳制')
ok(bad.settings.soundOn === false, 'settings.soundOn 保留显式 false')
ok(bad.settings.autoAim === true, '非法 autoAim 回默认 true')
ok(bad.lastChar === 'knight', '空 lastChar 回退 knight')

/* 3. 存储后端探测 */
ok(save.storageKind() === 'jsapi-storage', '识别 jsapi.storage 后端')
ok(save.persistAvailable() === true, '存储可用')

/* 4. save/load 往返 */
const db = save.defaultSave()
db.gems = 123
db.unlockedChars.push('rogue')
db.charUpgrades.knight = { hp: 2, armor: 1, energy: 3, crit: 0, speed: 0, skill: 1 }
db.stats.bestFloor = 5
const saved = await save.save(db)
ok(saved === true, '写入成功')
const loaded = await save.load()
ok(loaded.gems === 123, '读回宝石')
ok(loaded.unlockedChars.indexOf('rogue') >= 0, '读回解锁角色')
ok(loaded.charUpgrades.knight.hp === 2 && loaded.charUpgrades.knight.energy === 3, '读回升级')
ok(loaded.stats.bestFloor === 5, '读回最佳层数')
ok(loaded.saveAt > 0, '写入 saveAt 时间戳')
ok(globalThis.$falcon.__gameDb === loaded, '读取后同步全局缓存')

/* 5. reset */
await save.reset()
const fresh = await save.load()
ok(fresh.gems === save.defaultSave().gems, '重置回默认宝石')
ok(fresh.stats.bestFloor === 0, '重置清空最佳层数')
ok(fresh.unlockedChars.length === 1, '重置只留骑士')

/* 6. 非法 JSON 不崩 */
store.set('sk_save_v1', '{not json')
const broken = await save.load()
ok(broken && broken.v === 1 && broken.gems === save.defaultSave().gems, '坏 JSON 回默认档')

/* 7. 无存储后端时降级（不能抛错） */
delete globalThis.$falcon.jsapi
ok(save.persistAvailable() === false, '无后端时 persistAvailable=false')
const loaded2 = await save.load()
ok(loaded2 && loaded2.v === 1, '无后端仍能返回默认档')
const saved2 = await save.save(loaded2)
ok(saved2 === false, '无后端写入返回 false')

console.log('\n' + '='.repeat(60))
console.log('结果: ' + pass + ' 通过, ' + fail + ' 失败')
if (fails.length) {
  for (const f of fails) console.log('  - ' + f)
  process.exit(1)
}
