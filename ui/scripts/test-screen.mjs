/*
 * 屏幕适配测试：960 逻辑宽 + 物理短边/长边换算、来源优先级、异常值过滤。
 * 通过 mock $falcon.env / window / document 覆盖设备矩阵与降级路径。
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

globalThis.$falcon = { env: { deviceWidth: 936, deviceHeight: 280 } }
const screen = await import(pathToFileURL(path.join(UI, 'screen.js')).href)

/* 1. 逻辑高换算矩阵 */
ok(screen.logicalHeight(936, 280) === 287, 'y02-1 936x280 -> 287')
ok(screen.logicalHeight(960, 266) === 266, '设计基准 960x266 -> 266')
ok(screen.logicalHeight(960, 240) === 240, '短屏 960x240 -> 240')
ok(screen.logicalHeight(960, 320) === 320, '高屏 960x320 -> 320')
ok(screen.logicalHeight(800, 240) === 288, 'CVI 800x240 -> 288')
ok(screen.logicalHeight(280, 936) === 287, '竖屏 280x936 -> 287')
ok(screen.logicalHeight(800, 480) === 576, 'X6P 800x480 -> 576')
ok(screen.logicalHeight(0, 0) === 266, '非法尺寸回退 266')

/* 2. screenInfo env 优先 */
let info = screen.screenInfo()
ok(info.source === 'env', 'env 可用时 source=env')
ok(info.physical.w === 936 && info.physical.h === 280, 'env 物理尺寸')
ok(info.logicalWidth === 960 && info.logicalHeight === 287, '逻辑尺寸 960x287')
ok(!!info.env && !!info.profile, '返回 env/profile 诊断字段')

/* 3. env 非法 -> window 兜底 */
globalThis.$falcon.env.deviceWidth = 0
globalThis.$falcon.env.deviceHeight = 0
globalThis.window = { innerWidth: 960, innerHeight: 266 }
info = screen.screenInfo()
ok(info.source === 'window', 'env 非法时 window 兜底')
ok(info.logicalHeight === 266, 'window 逻辑高 266')
delete globalThis.window

/* 4. 无 window/document -> fallback */
info = screen.screenInfo()
ok(info.source === 'fallback', '无来源时 fallback')
ok(info.logicalHeight === 266, 'fallback 逻辑高 266')

/* 5. 诊断串字段齐全 */
globalThis.$falcon.env.deviceWidth = 800
globalThis.$falcon.env.deviceHeight = 480
const txt = screen.screenText()
ok(txt.indexOf('env=800x480') >= 0, 'screenText 含 env 原始读数')
ok(txt.indexOf('logical=960x576') >= 0, 'screenText 含逻辑尺寸')
ok(txt.indexOf('source=env') >= 0, 'screenText 含来源')

/* 6. pageSize/readPhysical */
const ps = screen.pageSize()
ok(ps.w === 960 && ps.h === 576, 'pageSize 返回 960x576')
const rp = screen.readPhysical()
ok(rp.w === 800 && rp.h === 480, 'readPhysical 返回物理尺寸')

/* 7. 异常值过滤（99999 不采纳） */
globalThis.$falcon.env.deviceWidth = 99999
globalThis.$falcon.env.deviceHeight = 99999
info = screen.screenInfo()
ok(info.source === 'fallback', '超大异常值被过滤')

console.log('\n' + '='.repeat(60))
console.log('结果: ' + pass + ' 通过, ' + fail + ' 失败')
if (fails.length) {
  for (const f of fails) console.log('  - ' + f)
  process.exit(1)
}
