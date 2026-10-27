import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const chapters = JSON.parse(fs.readFileSync(path.join(root, 'data/wiki/chapters.json'), 'utf8'))
const chapter1 = JSON.parse(fs.readFileSync(path.join(root, 'data/wiki/chapter1.json'), 'utf8'))

let fail = 0
function ok(cond, msg) {
  if (cond) console.log('  OK   ' + msg)
  else { fail++; console.log('  FAIL ' + msg) }
}

console.log('== 4 大关结构 ==')
ok(chapters.chapters.length === 4, '共 4 大关')
ok(chapters.floorsPerChapter === 5, '每大关 5 小关')
ok(chapters.victoryFloor === 15, '3-5 后通关（第 15 层）')

const seen = new Set()
for (const ch of chapters.chapters) {
  ok(ch.scenes.length > 0, ch.name + ' 至少一个场景')
  for (const sc of ch.scenes) {
    ok(!seen.has(sc.id), '场景 id 唯一：' + sc.id)
    seen.add(sc.id)
  }
}

console.log('== 第一大关 ==')
for (const [id, sc] of Object.entries(chapter1.scenes)) {
  ok(chapters.chapters[0].scenes.some(function (s) { return s.id === id }), '场景在章节表中：' + id)
  ok(sc.enemies.length > 0, sc.name + ' 有小怪')
  ok(sc.bosses.length > 0, sc.name + ' 有首领')
}

ok(fail === 0, '数据检查通过')
process.exit(fail ? 1 : 0)
