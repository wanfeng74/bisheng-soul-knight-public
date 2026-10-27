/*
 * 跑全部测试 (自动挂上 panet 解析钩子)。
 * 用法: node --import ./scripts/test-loader.mjs scripts/run-all.mjs
 * 或:   pnpm test
 */
import { execFileSync } from 'node:child_process'
import { readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const UI = join(HERE, '..')

/* 排除: 加载器自身与桩文件 (它们不是测试)。
   另外 --import 只接受 file URL, 直接给 Windows 路径会报
   ERR_UNSUPPORTED_ESM_URL_SCHEME。 */
const SKIP = new Set(['test-loader.mjs'])
const FILES = readdirSync(HERE)
  .filter((f) => /^test-.*\.mjs$/.test(f) && !SKIP.has(f))
  .sort()
const LOADER_URL = pathToFileURL(join(HERE, 'test-loader.mjs')).href

let pass = 0, fail = 0
const failed = []

console.log('='.repeat(70))
console.log('全量测试 (' + FILES.length + ' 个文件)')
console.log('='.repeat(70))

for (const f of FILES) {
  let out = ''
  let ok = true
  try {
    out = execFileSync(process.execPath, [
      '--import', LOADER_URL,
      join(HERE, f),
    ], { encoding: 'utf8', cwd: UI, stdio: ['ignore', 'pipe', 'pipe'] })
  } catch (e) {
    ok = false
    out = String((e && e.stdout) || '') + String((e && e.stderr) || '')
  }
  const m = out.match(/结果:\s*(\d+)\s*通过,\s*(\d+)\s*失败/)
  if (m) {
    const p = Number(m[1]), fl = Number(m[2])
    pass += p; fail += fl
    console.log(`  ${ok && fl === 0 ? 'OK  ' : 'FAIL'} ${f.padEnd(26)} ${p} 通过, ${fl} 失败`)
    if (fl) failed.push(f)
  } else {
    fail++
    failed.push(f)
    const firstErr = out.split('\n').filter((l) => l.trim()).slice(-4).join(' | ').slice(0, 200)
    console.log(`  FAIL ${f.padEnd(26)} 没有输出结果行  ${firstErr}`)
  }
}

console.log('='.repeat(70))
console.log('合计: ' + pass + ' 通过, ' + fail + ' 失败')
if (failed.length) console.log('失败文件: ' + failed.join(', '))
console.log('='.repeat(70))
process.exit(fail ? 1 : 0)
