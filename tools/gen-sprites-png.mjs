/*
 * 精灵表 -> PNG 资源生成器（Node 24，零第三方依赖）。
 *
 * 输入：ui/src/services/game/sprites/{world.js, entities.js}
 *       ui/src/services/game/palette.js（唯一取色来源）
 * 输出：
 *   ui/assets/icons/<spriteKey>.png        武器/拾取物/道具/UI 图标，4x 最近邻
 *   ui/assets/portraits/<charId>.png       角色立绘（player_<id> 第一帧），4x 最近邻
 *   ui/assets/maintenance/contact-sheet.png 全量精灵拼图（带 key 标注，供审查，不打进包）
 *   ui/icon.png                            128x128 应用图标（骑士像素头像 + 深色底）
 *
 * 约束：
 *   - 只用 node 内置模块（zlib），自己写 PNG（IHDR/IDAT/IEND + CRC32）。
 *   - 透明背景；放大用最近邻，绝不插值（像素风不允许模糊）。
 *   - 可重复运行：同样的精灵表永远输出逐字节相同的 PNG。
 *
 * 用法（Node 24）：
 *   node tools/gen-sprites-png.mjs
 *   node --no-warnings tools/gen-sprites-png.mjs   # 静默 ui/package.json 无 type 的 ESM 提示
 */
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '..')
const GAME_DIR = path.join(ROOT, 'ui', 'src', 'services', 'game')
const ASSETS = path.join(ROOT, 'ui', 'assets')
const ICON_DIR = path.join(ASSETS, 'icons')
const PORTRAIT_DIR = path.join(ASSETS, 'portraits')
const MAINT_DIR = path.join(ASSETS, 'maintenance')

const SCALE = 4          /* 图标统一 4 倍（DOM 显示尺寸≈32~64px，避免二次放大） */
const PORTRAIT_SCALE = 8 /* 立绘单独 8 倍（96x128，页面大图使用，避免 CSS 放大糊） */
const SHEET_SCALE = 4    /* 拼图里每个精灵 4 倍，方便肉眼检查 */

/* ------------------------------------------------------------------ *
 * 0. 读精灵表 / 调色板（缺文件时降级，方便并行开发期间反复跑）
 * ------------------------------------------------------------------ */
async function importMaybe(rel) {
  try {
    const p = path.join(GAME_DIR, rel)
    if (!fs.existsSync(p)) return null
    return await import(pathToFileUrl(p))
  } catch (e) {
    console.warn('[skip] 无法加载 ' + rel + ': ' + e.message)
    return null
  }
}

function pathToFileUrl(p) {
  let s = path.resolve(p).replace(/\\/g, '/')
  if (s.charAt(0) !== '/') s = '/' + s
  return 'file://' + encodeURI(s)
}

const paletteMod = await importMaybe('palette.js')
const PAL = (paletteMod && paletteMod.PAL) || {}
const worldMod = await importMaybe('sprites/world.js')
const entitiesMod = await importMaybe('sprites/entities.js')
const charactersMod = await importMaybe('characters.js')
const weaponsMod = await importMaybe('weapons.js')

const WEAPON_SPRITES = (worldMod && worldMod.WEAPON_SPRITES) || {}
const PICKUP_SPRITES = (worldMod && worldMod.PICKUP_SPRITES) || {}
const PROP_SPRITES = (worldMod && worldMod.PROP_SPRITES) || {}
const UI_SPRITES = (worldMod && worldMod.UI_SPRITES) || {}
const ENTITY_SPRITES = (entitiesMod && entitiesMod.ENTITY_SPRITES) || {}

const CHARACTER_ORDER = (charactersMod && charactersMod.CHARACTER_ORDER) || [
  'knight', 'rogue', 'wizard', 'elf', 'engineer', 'assassin', 'alchemist', 'paladin'
]
const CHARACTERS = (charactersMod && charactersMod.CHARACTERS) || {}
const WEAPONS = (weaponsMod && weaponsMod.WEAPONS) || {}

/* ------------------------------------------------------------------ *
 * 1. 像素画布（RGBA8），所有绘制都在这里做
 * ------------------------------------------------------------------ */
function makeCanvas(w, h) {
  return { w: w, h: h, data: new Uint8ClampedArray(w * h * 4) }
}

function setPixel(cv, x, y, r, g, b, a) {
  if (x < 0 || y < 0 || x >= cv.w || y >= cv.h) return
  const i = (y * cv.w + x) * 4
  cv.data[i] = r
  cv.data[i + 1] = g
  cv.data[i + 2] = b
  cv.data[i + 3] = a === undefined ? 255 : a
}

function fillRect(cv, x, y, w, h, r, g, b, a) {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) setPixel(cv, xx, yy, r, g, b, a)
  }
}

function hexToRgb(hex) {
  const s = String(hex || '').replace('#', '')
  if (s.length !== 6) return null
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)]
}

/** 把 rows 字符画按 scale 倍最近邻画到画布 (ox,oy) */
function drawSprite(cv, ox, oy, sprite, scale) {
  const rows = sprite.frames ? sprite.frames[0] : sprite.rows
  if (!rows) return
  for (let y = 0; y < sprite.h; y++) {
    const row = rows[y]
    if (!row) continue
    for (let x = 0; x < sprite.w; x++) {
      const ch = row.charAt(x)
      const color = PAL[ch]
      if (!color) continue
      const rgb = hexToRgb(color)
      if (!rgb) continue
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          setPixel(cv, ox + x * scale + dx, oy + y * scale + dy, rgb[0], rgb[1], rgb[2], 255)
        }
      }
    }
  }
}

/* ------------------------------------------------------------------ *
 * 2. 3x5 像素字体（拼图上的 key 标注；只做 A-Z 0-9 与几个符号）
 * ------------------------------------------------------------------ */
const FONT = {
  A: ['.#.', '#.#', '###', '#.#', '#.#'],
  B: ['##.', '#.#', '##.', '#.#', '##.'],
  C: ['.##', '#..', '#..', '#..', '.##'],
  D: ['##.', '#.#', '#.#', '#.#', '##.'],
  E: ['###', '#..', '##.', '#..', '###'],
  F: ['###', '#..', '##.', '#..', '#..'],
  G: ['.##', '#..', '#.#', '#.#', '.##'],
  H: ['#.#', '#.#', '###', '#.#', '#.#'],
  I: ['###', '.#.', '.#.', '.#.', '###'],
  J: ['..#', '..#', '..#', '#.#', '.#.'],
  K: ['#.#', '#.#', '##.', '#.#', '#.#'],
  L: ['#..', '#..', '#..', '#..', '###'],
  M: ['#.#', '###', '###', '#.#', '#.#'],
  N: ['#.#', '##.', '###', '.##', '#.#'],
  O: ['.#.', '#.#', '#.#', '#.#', '.#.'],
  P: ['##.', '#.#', '##.', '#..', '#..'],
  Q: ['.#.', '#.#', '#.#', '##.', '.##'],
  R: ['##.', '#.#', '##.', '#.#', '#.#'],
  S: ['.##', '#..', '.#.', '..#', '##.'],
  T: ['###', '.#.', '.#.', '.#.', '.#.'],
  U: ['#.#', '#.#', '#.#', '#.#', '###'],
  V: ['#.#', '#.#', '#.#', '#.#', '.#.'],
  W: ['#.#', '#.#', '###', '###', '#.#'],
  X: ['#.#', '#.#', '.#.', '#.#', '#.#'],
  Y: ['#.#', '#.#', '.#.', '.#.', '.#.'],
  Z: ['###', '..#', '.#.', '#..', '###'],
  0: ['###', '#.#', '#.#', '#.#', '###'],
  1: ['.#.', '##.', '.#.', '.#.', '###'],
  2: ['##.', '..#', '.#.', '#..', '###'],
  3: ['##.', '..#', '.#.', '..#', '##.'],
  4: ['#.#', '#.#', '###', '..#', '..#'],
  5: ['###', '#..', '##.', '..#', '##.'],
  6: ['.##', '#..', '###', '#.#', '###'],
  7: ['###', '..#', '.#.', '.#.', '.#.'],
  8: ['###', '#.#', '###', '#.#', '###'],
  9: ['###', '#.#', '###', '..#', '##.'],
  _: ['...', '...', '...', '...', '###'],
  '-': ['...', '...', '###', '...', '...'],
  '.': ['...', '...', '...', '...', '.#.'],
  '/': ['..#', '..#', '.#.', '#..', '#..'],
  ' ': ['...', '...', '...', '...', '...']
}

function textWidth(text, scale) {
  const n = String(text).length
  return n > 0 ? n * 4 * scale - scale : 0
}

/** 画文字：scale=1 时字高 5px；颜色是 [r,g,b] */
function drawText(cv, x, y, text, scale, rgb) {
  const s = String(text).toUpperCase()
  let cx = x
  for (let i = 0; i < s.length; i++) {
    const glyph = FONT[s.charAt(i)] || FONT[' ']
    for (let gy = 0; gy < 5; gy++) {
      for (let gx = 0; gx < 3; gx++) {
        if (glyph[gy].charAt(gx) !== '#') continue
        fillRect(cv, cx + gx * scale, y + gy * scale, scale, scale, rgb[0], rgb[1], rgb[2], 255)
      }
    }
    cx += 4 * scale
  }
}

/* ------------------------------------------------------------------ *
 * 3. PNG 编码（自写，仅用 node:zlib）
 * ------------------------------------------------------------------ */
const CRC_TABLE = (function () {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
    table[n] = c >>> 0
  }
  return table
})()

function crc32(buf) {
  let c = 0xFFFFFFFF
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8)
  return (c ^ 0xFFFFFFFF) >>> 0
}

function pngChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const lenBuf = Buffer.alloc(4)
  lenBuf.writeUInt32BE(data.length, 0)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf])
}

function encodePNG(cv) {
  const w = cv.w
  const h = cv.h
  /* 每行前加 1 字节 filter type 0（None），保证输出确定 */
  const stride = w * 4 + 1
  const raw = Buffer.alloc(stride * h)
  for (let y = 0; y < h; y++) {
    raw[y * stride] = 0
    for (let i = 0; i < w * 4; i++) raw[y * stride + 1 + i] = cv.data[y * w * 4 + i]
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0)
  ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8   /* bit depth */
  ihdr[9] = 6   /* color type RGBA */
  ihdr[10] = 0  /* compression */
  ihdr[11] = 0  /* filter */
  ihdr[12] = 0  /* interlace */
  const idat = zlib.deflateSync(raw, { level: 9 })
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0))
  ])
}

/* ------------------------------------------------------------------ *
 * 4. 输出单帧图标：透明背景 + 整数倍最近邻
 * ------------------------------------------------------------------ */
function saveScaledSprite(sprite, scale, outPath) {
  const cv = makeCanvas(sprite.w * scale, sprite.h * scale)
  drawSprite(cv, 0, 0, sprite, scale)
  fs.writeFileSync(outPath, encodePNG(cv))
  return sprite.w * scale + 'x' + sprite.h * scale
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true })
}

/* ------------------------------------------------------------------ *
 * 5. 主流程
 * ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ *
 * 6. 大厅背景（可选）：960x266 像素地牢大厅，供大厅页做底图
 * ------------------------------------------------------------------ */
function getPixel(cv, x, y) {
  if (x < 0 || y < 0 || x >= cv.w || y >= cv.h) return [0, 0, 0]
  const i = (y * cv.w + x) * 4
  return [cv.data[i], cv.data[i + 1], cv.data[i + 2]]
}

/** 与已有像素混合（alpha 0..1），用于火光/暗角这类叠加效果 */
function blendPixel(cv, x, y, r, g, b, alpha) {
  if (alpha <= 0) return
  if (x < 0 || y < 0 || x >= cv.w || y >= cv.h) return
  const old = getPixel(cv, x, y)
  const a = alpha > 1 ? 1 : alpha
  const i = (y * cv.w + x) * 4
  cv.data[i] = old[0] + (r - old[0]) * a
  cv.data[i + 1] = old[1] + (g - old[1]) * a
  cv.data[i + 2] = old[2] + (b - old[2]) * a
  cv.data[i + 3] = 255
}

function hash2(x, y, salt) {
  let h = (x * 73856093) ^ (y * 19349663) ^ ((salt || 0) * 83492791)
  h = h >>> 0
  h = (h ^ (h >>> 13)) >>> 0
  h = (h * 1274126177) >>> 0
  return (h ^ (h >>> 16)) >>> 0
}

function buildLobbyBg() {
  const W = 960
  const H = 266
  const cv = makeCanvas(W, H)
  const wallDark = [30, 28, 42]
  const wall = [42, 40, 56]
  const wallHi = [54, 52, 72]
  const mortar = [18, 17, 25]
  const stone = [46, 44, 60]
  const stoneDark = [34, 32, 46]
  const gold = [184, 134, 11]
  const goldHi = [255, 217, 61]

  /* 石墙砖块 */
  const BRICK_H = 18
  const BRICK_W = 44
  for (let y = 0; y < 196; y++) {
    const row = Math.floor(y / BRICK_H)
    const off = (row % 2) * (BRICK_W / 2)
    for (let x = 0; x < W; x++) {
      const by = y % BRICK_H
      const bx = (x + off) % BRICK_W
      if (by < 1 || bx < 1) {
        setPixel(cv, x, y, mortar[0], mortar[1], mortar[2], 255)
      } else {
        const h = hash2(x, y, 1) % 11
        const c = h === 0 ? wallHi : (h < 4 ? wall : wallDark)
        setPixel(cv, x, y, c[0], c[1], c[2], 255)
      }
    }
  }

  /* 地板：石板 + 横向缝 */
  for (let y = 200; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const ty = (y - 200) % 22
      const tx = x % 48
      if (ty < 1 || tx < 1) setPixel(cv, x, y, mortar[0], mortar[1], mortar[2], 255)
      else {
        const c = hash2(x, y, 2) % 9 === 0 ? stone : stoneDark
        setPixel(cv, x, y, c[0], c[1], c[2], 255)
      }
    }
  }

  /* 金色踢脚线 */
  fillRect(cv, 0, 194, W, 2, gold[0], gold[1], gold[2], 255)
  fillRect(cv, 0, 196, W, 1, goldHi[0], goldHi[1], goldHi[2], 255)

  /* 中央拱门（深色门洞 + 石框 + 紫色微光） */
  const archX = 480
  for (let y = 24; y < 200; y++) {
    const half = 92 + Math.round(14 * Math.sin((y - 24) / 176 * Math.PI))
    for (let x = archX - half; x <= archX + half; x++) {
      const dx = Math.abs(x - archX)
      if (dx > half - 16) {
        /* 拱门石框 */
        const grout = hash2(x, y, 3) % 13 === 0
        const c = grout ? mortar : (dx > half - 5 ? [86, 86, 106] : [62, 62, 82])
        setPixel(cv, x, y, c[0], c[1], c[2], 255)
      } else {
        /* 门洞内部 + 靠内壁紫色辉光 */
        const edge = (half - 16) - dx
        const glow = edge < 26 ? (1 - edge / 26) : 0
        const base = [12, 10, 20]
        const pc = [58, 30, 92]
        setPixel(cv, x, y,
          base[0] + (pc[0] - base[0]) * glow,
          base[1] + (pc[1] - base[1]) * glow,
          base[2] + (pc[2] - base[2]) * glow, 255)
      }
    }
  }

  /* 四根石柱 + 柱顶火把 */
  const pillars = [96, 300, 660, 864]
  for (const px of pillars) {
    /* 柱身 */
    fillRect(cv, px - 14, 18, 28, 178, 74, 74, 94, 255)
    fillRect(cv, px - 14, 18, 3, 178, 20, 19, 28, 255)
    fillRect(cv, px + 11, 18, 3, 178, 20, 19, 28, 255)
    fillRect(cv, px - 9, 18, 3, 178, 122, 122, 146, 255)
    fillRect(cv, px + 2, 18, 4, 178, 58, 58, 76, 255)
    /* 柱头 / 柱础 */
    fillRect(cv, px - 19, 14, 38, 8, 96, 96, 116, 255)
    fillRect(cv, px - 19, 14, 38, 2, 20, 19, 28, 255)
    fillRect(cv, px - 19, 20, 38, 2, 20, 19, 28, 255)
    fillRect(cv, px - 19, 188, 38, 8, 96, 96, 116, 255)
    fillRect(cv, px - 19, 188, 38, 2, 20, 19, 28, 255)
    /* 火把支架 + 火焰 */
    const fy = 92
    fillRect(cv, px - 2, fy, 5, 10, 20, 19, 28, 255)
    fillRect(cv, px - 3, fy + 9, 7, 3, 122, 122, 146, 255)
    const flame = [
      '..Y..',
      '.YOY.',
      '.YOY.',
      'YYOYY',
      'YOOOY',
      'YYOYY',
      '.YYY.'
    ]
    for (let ry = 0; ry < flame.length; ry++) {
      for (let rx = 0; rx < 5; rx++) {
        const ch = flame[ry].charAt(rx)
        const rgb = ch === 'Y' ? [255, 224, 102] : (ch === 'O' ? [255, 159, 28] : null)
        if (rgb) setPixel(cv, px - 2 + rx, fy - 7 + ry, rgb[0], rgb[1], rgb[2], 255)
      }
    }
    /* 火光光晕 */
    for (let dy = -40; dy <= 40; dy++) {
      for (let dx = -40; dx <= 40; dx++) {
        const d = Math.sqrt(dx * dx + dy * dy)
        if (d > 40) continue
        const a = (1 - d / 40) * 0.30
        blendPixel(cv, px + dx, fy + 4 + dy, 255, 160, 60, a)
      }
    }
  }

  /* 顶部两侧金色挂旗 */
  for (const bx of [168, 792]) {
    fillRect(cv, bx - 22, 0, 44, 3, goldHi[0], goldHi[1], goldHi[2], 255)
    fillRect(cv, bx - 20, 3, 40, 78, 160, 32, 48, 255)
    fillRect(cv, bx - 20, 3, 3, 78, 96, 20, 32, 255)
    fillRect(cv, bx + 17, 3, 3, 78, 96, 20, 32, 255)
    fillRect(cv, bx - 20, 62, 40, 4, gold[0], gold[1], gold[2], 255)
    /* 旗尖 */
    for (let i = 0; i < 14; i++) {
      fillRect(cv, bx - 20 + i, 78 + i, 40 - i * 2, 1, 160, 32, 48, 255)
    }
    /* 旗面宝石 */
    fillRect(cv, bx - 6, 24, 12, 12, 77, 208, 225, 255)
    fillRect(cv, bx - 4, 26, 8, 8, 179, 236, 255, 255)
    fillRect(cv, bx - 2, 28, 2, 4, 255, 255, 255, 255)
  }

  /* 顶部/底部金色包边 */
  fillRect(cv, 0, 0, W, 2, gold[0], gold[1], gold[2], 255)
  fillRect(cv, 0, H - 2, W, 2, gold[0], gold[1], gold[2], 255)

  /* 暗角：四周压暗，让中间 UI 内容更突出 */
  const cx = W / 2
  const cy = H / 2
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const nx = (x - cx) / cx
      const ny = (y - cy) / cy
      const d = Math.sqrt(nx * nx * 0.75 + ny * ny * 1.35)
      const a = Math.max(0, d - 0.55) * 0.85
      if (a > 0) blendPixel(cv, x, y, 8, 7, 12, a)
    }
  }

  const outPath = path.join(ASSETS, 'ui', 'lobby_bg.png')
  ensureDir(path.dirname(outPath))
  fs.writeFileSync(outPath, encodePNG(cv))
  return outPath
}

function main() {
  ensureDir(ICON_DIR)
  ensureDir(PORTRAIT_DIR)
  ensureDir(MAINT_DIR)

  let written = 0
  const warnings = []

  /* ---- 5.1 世界图标（wp_/pk_/prop_/ui_） ---- */
  const worldGroups = [
    ['WEAPON_SPRITES', WEAPON_SPRITES],
    ['PICKUP_SPRITES', PICKUP_SPRITES],
    ['PROP_SPRITES', PROP_SPRITES],
    ['UI_SPRITES', UI_SPRITES]
  ]
  const worldKeys = []
  for (const [gname, group] of worldGroups) {
    for (const key of Object.keys(group)) {
      const s = group[key]
      if (!s || !s.w || !s.h) { warnings.push(key + ': 缺少 w/h，跳过'); continue }
      saveScaledSprite(s, SCALE, path.join(ICON_DIR, key + '.png'))
      worldKeys.push(key)
      written++
    }
    console.log('[icons] ' + gname + ' -> ' + Object.keys(group).length + ' 个')
  }

  /* ---- 5.1b 角色/敌人/Boss 图标：图鉴页按 assets/icons/enemy_*.png 引用 ---- */
  const entityIconKeys = Object.keys(ENTITY_SPRITES)
  let entityIconCount = 0
  for (const key of entityIconKeys) {
    const s = ENTITY_SPRITES[key]
    if (!s || !s.w || !s.h) continue
    saveScaledSprite(s, SCALE, path.join(ICON_DIR, key + '.png'))
    entityIconCount++
    written++
  }
  console.log('[icons] ENTITY_SPRITES -> ' + entityIconCount + ' 个（图鉴/图鉴 Boss 用）')

  /* ---- 5.2 角色立绘（player_<id> 第一帧 8x，供页面大图 1:1 附近使用） ---- */
  const portraits = []
  for (const id of CHARACTER_ORDER) {
    const char = CHARACTERS[id] || {}
    const spriteKey = char.sprite || ('player_' + id)
    const s = ENTITY_SPRITES[spriteKey]
    if (!s) {
      warnings.push('立绘缺失: ' + spriteKey + '（entities.js 还没写好该角色？）')
      continue
    }
    const size = saveScaledSprite(s, PORTRAIT_SCALE, path.join(PORTRAIT_DIR, id + '.png'))
    portraits.push({ id: id, key: spriteKey, size: size })
    written++
  }
  console.log('[portraits] ' + portraits.length + '/' + CHARACTER_ORDER.length + ' 个角色')

  /* ---- 5.3 武器覆盖自检（以 weapons.js 的 sprite 字段为准） ---- */
  const weaponIds = Object.keys(WEAPONS)
  const missingWeaponSprites = []
  for (const wid of weaponIds) {
    const w = WEAPONS[wid]
    const sk = (w && w.sprite) || ('wp_' + wid)
    if (!WEAPON_SPRITES[sk]) missingWeaponSprites.push(sk)
  }
  if (missingWeaponSprites.length) {
    warnings.push('weapons.js 有 ' + missingWeaponSprites.length + ' 把武器缺精灵: ' + missingWeaponSprites.join(','))
  } else if (weaponIds.length) {
    console.log('[weapons] ' + weaponIds.length + ' 把武器精灵全覆盖')
  }

  /* ---- 5.4 全量拼图 contact-sheet.png ---- */
  const entityKeys = Object.keys(ENTITY_SPRITES)
  const playerKeys = entityKeys.filter(function (k) { return k.indexOf('player_') === 0 })
  const otherEntityKeys = entityKeys.filter(function (k) { return k.indexOf('player_') !== 0 })
  const sections = [
    { title: 'PLAYER', keys: playerKeys, src: ENTITY_SPRITES },
    { title: 'ENEMY / BOSS', keys: otherEntityKeys, src: ENTITY_SPRITES },
    { title: 'WEAPON (' + Object.keys(WEAPON_SPRITES).length + ')', keys: Object.keys(WEAPON_SPRITES), src: WEAPON_SPRITES },
    { title: 'PICKUP', keys: Object.keys(PICKUP_SPRITES), src: PICKUP_SPRITES },
    { title: 'PROP', keys: Object.keys(PROP_SPRITES), src: PROP_SPRITES },
    { title: 'UI ICON', keys: Object.keys(UI_SPRITES), src: UI_SPRITES }
  ].filter(function (sec) { return sec.keys.length > 0 })

  const COLS = 10
  const CELL_W = 104
  const CELL_H = 108
  const SPRITE_BOX = 96
  const TITLE_H = 22
  const MARGIN = 12

  let sheetW = MARGIN * 2 + COLS * CELL_W
  let sheetH = MARGIN * 2
  const layout = []
  for (const sec of sections) {
    const cols = Math.min(COLS, sec.keys.length)
    const rows = Math.ceil(sec.keys.length / COLS)
    sec._cols = cols
    sec._rows = rows
    sec._y = sheetH
    sheetH += TITLE_H + rows * CELL_H + 8
    layout.push(sec)
  }
  const sheet = makeCanvas(sheetW, sheetH)

  /* 背景：深色 + 每格棋盘格，透明区域能立刻看出来 */
  fillRect(sheet, 0, 0, sheetW, sheetH, 16, 15, 24, 255)

  let sheetCells = 0
  for (const sec of layout) {
    const y0 = sec._y
    /* 分节标题 + 金色下划线 */
    drawText(sheet, MARGIN, y0 + 4, sec.title, 2, [255, 217, 61])
    fillRect(sheet, MARGIN, y0 + TITLE_H - 3, sheetW - MARGIN * 2, 1, 184, 134, 11, 255)

    for (let i = 0; i < sec.keys.length; i++) {
      const key = sec.keys[i]
      const s = sec.src[key]
      if (!s) continue
      const col = i % COLS
      const row = Math.floor(i / COLS)
      const cx = MARGIN + col * CELL_W
      const cy = y0 + TITLE_H + row * CELL_H
      /* 棋盘格背景（8px 一格） */
      for (let by = 0; by < SPRITE_BOX; by += 8) {
        for (let bx = 0; bx < CELL_W; bx += 8) {
          const even = (((bx / 8) | 0) + ((by / 8) | 0)) % 2 === 0
          fillRect(sheet, cx + bx, cy + by, 8, 8, even ? 27 : 34, even ? 27 : 34, even ? 38 : 47, 255)
        }
      }
      fillRect(sheet, cx, cy + SPRITE_BOX, CELL_W, CELL_H - SPRITE_BOX, 20, 19, 30, 255)
      /* 边框 */
      fillRect(sheet, cx, cy, CELL_W, 1, 58, 58, 78, 255)
      fillRect(sheet, cx, cy + SPRITE_BOX - 1, CELL_W, 1, 58, 58, 78, 255)
      fillRect(sheet, cx, cy, 1, SPRITE_BOX, 58, 58, 78, 255)
      fillRect(sheet, cx + CELL_W - 1, cy, 1, SPRITE_BOX, 58, 58, 78, 255)
      /* 精灵居中（整数倍最近邻；Boss 28x32 超过 96 格时自动降到 3x，保证完整不越界） */
      let sc = SHEET_SCALE
      while (sc > 1 && (s.w * sc > SPRITE_BOX || s.h * sc > SPRITE_BOX)) sc--
      const sw = s.w * sc
      const sh = s.h * sc
      const px = cx + Math.floor((CELL_W - sw) / 2)
      const py = cy + Math.floor((SPRITE_BOX - sh) / 2)
      drawSprite(sheet, px, py, s, sc)
      /* key 标注（过长则缩小到 1x 已经是 1x；理论上 <=20 字符） */
      const label = key.toUpperCase()
      const tw = textWidth(label, 1)
      drawText(sheet, cx + Math.max(2, Math.floor((CELL_W - tw) / 2)), cy + SPRITE_BOX + 4, label, 1, [185, 185, 204])
      sheetCells++
    }
  }

  fs.writeFileSync(path.join(MAINT_DIR, 'contact-sheet.png'), encodePNG(sheet))
  written++

  /* ---- 5.5 应用图标 128x128 ---- */
  const iconCv = makeCanvas(128, 128)
  buildAppIcon(iconCv)
  fs.writeFileSync(path.join(ROOT, 'ui', 'icon.png'), encodePNG(iconCv))
  written++

  /* ---- 5.6 可选：大厅背景 960x266 ---- */
  const lobbyBgPath = buildLobbyBg()
  console.log('[lobby] ui/assets/ui/lobby_bg.png（960x266，可选底图）')
  written++

  /* ---- 汇总 ---- */
  const soundNote = fs.existsSync(path.join(ASSETS, 'sounds')) ? '' : '（sounds 目录还没生成，跑 tools/gen-audio.py）'
  console.log('')
  console.log('=== 精灵 PNG 生成完成 ===')
  console.log('  图标路径: ui/assets/icons/（世界 ' + worldKeys.length + ' + 角色/敌人/Boss ' + entityIconCount + ' = ' + (worldKeys.length + entityIconCount) + ' 个）')
  console.log('  立绘    : ui/assets/portraits/（' + portraits.length + ' 个）')
  console.log('  拼图    : ui/assets/maintenance/contact-sheet.png（' + sheet.w + 'x' + sheet.h + '，' + sheetCells + ' 格）')
  console.log('  应用图标: ui/icon.png（128x128）')
  console.log('  大厅背景: ui/assets/ui/lobby_bg.png（960x266，可选）')
  console.log('  写入文件: ' + written + ' 个' + soundNote)
  if (warnings.length) {
    console.log('')
    console.log('警告 ' + warnings.length + ' 条:')
    for (const w of warnings) console.log('  - ' + w)
  } else {
    console.log('  自检    : 无警告（全部 sprite key 尺寸/调色板合法，武器精灵全覆盖）')
  }
  return 0
}

/* 应用图标：深色底 + 金色边框 + 骑士像素头像（7 倍最近邻） */
function buildAppIcon(cv) {
  const W = cv.w
  const H = cv.h
  /* 深色底 */
  fillRect(cv, 0, 0, W, H, 20, 18, 28, 255)
  /* 背景微光（同心像素圆，暗紫红） */
  const cx = W / 2
  const cy = H / 2 + 4
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const d2 = (x - cx) * (x - cx) + (y - cy) * (y - cy)
      if (d2 < 46 * 46) setPixel(cv, x, y, 44, 26, 34, 255)
      else if (d2 < 56 * 56) setPixel(cv, x, y, 30, 21, 30, 255)
    }
  }
  /* 金色双层边框 */
  fillRect(cv, 0, 0, W, 3, 255, 217, 61, 255)
  fillRect(cv, 0, H - 3, W, 3, 255, 217, 61, 255)
  fillRect(cv, 0, 0, 3, H, 255, 217, 61, 255)
  fillRect(cv, W - 3, 0, 3, H, 255, 217, 61, 255)
  fillRect(cv, 3, 3, W - 6, 1, 184, 134, 11, 255)
  fillRect(cv, 3, H - 4, W - 6, 1, 184, 134, 11, 255)
  fillRect(cv, 3, 3, 1, H - 6, 184, 134, 11, 255)
  fillRect(cv, W - 4, 3, 1, H - 6, 184, 134, 11, 255)
  /* 四角金色装饰 */
  fillRect(cv, 1, 1, 6, 2, 255, 243, 176, 255)
  fillRect(cv, 1, 1, 2, 6, 255, 243, 176, 255)
  fillRect(cv, W - 7, 1, 6, 2, 255, 243, 176, 255)
  fillRect(cv, W - 3, 1, 2, 6, 255, 243, 176, 255)
  fillRect(cv, 1, H - 3, 6, 2, 255, 243, 176, 255)
  fillRect(cv, 1, H - 7, 2, 6, 255, 243, 176, 255)
  fillRect(cv, W - 7, H - 3, 6, 2, 255, 243, 176, 255)
  fillRect(cv, W - 3, H - 7, 2, 6, 255, 243, 176, 255)

  /* 骑士头像（player_knight 第一帧），优先用精灵表，缺失时退回 ui_characters */
  const knight = ENTITY_SPRITES['player_knight'] || ENTITY_SPRITES['player_rogue'] || null
  if (knight) {
    const scale = 7
    const sw = knight.w * scale
    const sh = knight.h * scale
    const ox = Math.floor((W - sw) / 2)
    const oy = Math.floor((H - sh) / 2) + 3
    /* 脚下阴影 */
    fillRect(cv, ox - 8, oy + sh - 3, sw + 16, 4, 8, 7, 12, 255)
    drawSprite(cv, ox, oy, knight, scale)
  } else {
    const ui = UI_SPRITES['ui_characters']
    if (ui) drawSprite(cv, Math.floor((W - ui.w * 5) / 2), Math.floor((H - ui.h * 5) / 2), ui, 5)
  }
}

main()
