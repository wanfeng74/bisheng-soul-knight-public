/*
 * 局内渲染（Canvas 2D，像素风）。
 * 只使用 fillRect / fillText / save / restore / translate / rotate / setTransform。
 */
import { TILE, RARITY, ELEMENT, CHAPTERS, ROOM } from './constants.js'
import { CHARACTERS } from './characters.js'
import { SPRITES } from './sprites/index.js'

var THEME = {
  forest: { floor1: '#2c4529', floor2: '#334f2e', wall: '#39483a', wallTop: '#5d7053', back: '#141c14' },
  desert: { floor1: '#5b4a2c', floor2: '#645230', wall: '#6a5434', wallTop: '#94734a', back: '#221a10' },
  ice: { floor1: '#2c4050', floor2: '#32495c', wall: '#3a5368', wallTop: '#6288a2', back: '#101822' },
  ruins: { floor1: '#4a4640', floor2: '#544f48', wall: '#5a554c', wallTop: '#8a8275', back: '#1b1916' },
  mech: { floor1: '#303a44', floor2: '#36424d', wall: '#3e4a56', wallTop: '#6e8494', back: '#11161b' },
  volcano: { floor1: '#4a2620', floor2: '#552c24', wall: '#5c3028', wallTop: '#9a5540', back: '#1b0c09' },
  alien: { floor1: '#352a4a', floor2: '#3e3157', wall: '#473a63', wallTop: '#7c6aa8', back: '#130f1e' },
  seabed: { floor1: '#1f3d4a', floor2: '#254854', wall: '#2b525f', wallTop: '#4e889a', back: '#0a161b' }
}

function spr(key) {
  return SPRITES[key] || null
}

/* ---- 精灵行程烘焙 ----
 * 原实现每帧逐字符扫描字符画、逐像素查调色板；这里在首次绘制时把每帧
 * 解析成「同行同色连续段」缓存到数组隐藏字段上，之后每帧只做 fillRect。
 * QuickJS 20200705 兼容：不使用 Symbol/WeakMap，不改变 rows 内容。 */
var RUN_KEY = '__runsBaked'
function bakeRows(rows) {
  if (!rows || !rows.length) return null
  var h = rows.length
  var w = rows[0].length
  var runs = []
  for (var y = 0; y < h; y++) {
    var row = rows[y]
    var px = 0
    while (px < w) {
      var ch = row.charAt(px)
      if (ch === '.' || ch === ' ') { px++; continue }
      var run = 1
      while (px + run < w && row.charAt(px + run) === ch) run++
      var col = PAL[ch]
      if (col) runs.push({ x: px, y: y, w: run, c: col })
      px += run
    }
  }
  return { w: w, h: h, runs: runs }
}
function bakedRows(rows) {
  if (!rows || !rows.length) return null
  var b = rows[RUN_KEY]
  if (b) return b
  b = bakeRows(rows)
  try { rows[RUN_KEY] = b } catch (e) {}
  return b
}

function drawProcMonster(ctx, key, cx, cy, w, h, theme, behavior) {
  var hash = 0
  for (var i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  var pals = {
    forest: ['#7ee787', '#5fbf6a', '#a5e887', '#c8f0a0'],
    desert: ['#ffb86b', '#d99a52', '#e8c07a', '#c98a45'],
    ice: ['#9adcff', '#6fb8d8', '#b3ecff', '#4dd0e1'],
    ruins: ['#b0a89a', '#8a8275', '#c9c0b0', '#70685c'],
    mech: ['#9ab0c0', '#6e8494', '#b8ccd8', '#4e6070'],
    volcano: ['#ff6b4a', '#d94a30', '#ff9a6b', '#a83020'],
    alien: ['#c86bff', '#9a4dd0', '#d8b4ff', '#7ee787'],
    seabed: ['#4dd0e1', '#2b9aaa', '#7ee8f0', '#1f6f7a']
  }
  var pal = pals[theme] || ['#7ee787', '#ffb86b', '#c86bff', '#4dd0e1', '#ff6b4a', '#9adcff', '#ffd93d', '#d8b4ff']
  var body = pal[hash % pal.length]
  var dark = '#1a1a24'
  var x = Math.round(cx - w / 2)
  var y = Math.round(cy - h)
  /* 身体 */
  ctx.fillStyle = body
  ctx.fillRect(x + 2, y + Math.round(h * 0.35), w - 4, Math.round(h * 0.65))
  /* 头 */
  ctx.fillRect(x + Math.round(w * 0.18), y + 2, Math.round(w * 0.64), Math.round(h * 0.4))
  if (w >= 20) {
    ctx.fillRect(x, y + Math.round(h * 0.48), Math.max(2, Math.round(w * 0.14)), Math.round(h * 0.3))
    ctx.fillRect(x + w - Math.round(w * 0.14), y + Math.round(h * 0.48), Math.max(2, Math.round(w * 0.14)), Math.round(h * 0.3))
  }
  /* 眼睛 */
  ctx.fillStyle = dark
  var ey = y + Math.round(h * 0.18)
  ctx.fillRect(x + Math.round(w * 0.3), ey, Math.max(2, Math.round(w * 0.1)), 3)
  ctx.fillRect(x + Math.round(w * 0.6), ey, Math.max(2, Math.round(w * 0.1)), 3)
  /* 脚 */
  ctx.fillStyle = dark
  ctx.fillRect(x + 3, y + h - 3, 5, 3)
  ctx.fillRect(x + w - 10, y + h - 3, 5, 3)
  /* 首领额外尖角 */
  if (key.indexOf('boss_') === 0) {
    ctx.fillStyle = '#ffd93d'
    ctx.fillRect(x + Math.round(w * 0.2), y - 4, 4, 6)
    ctx.fillRect(x + Math.round(w * 0.7), y - 4, 4, 6)
  } else if (behavior === 'shoot' || behavior === 'burst' || behavior === 'summon') {
    /* 远程型：手持发光法球 */
    ctx.fillStyle = '#ffe066'
    ctx.fillRect(x + w - 4, y + Math.round(h * 0.45), 5, 5)
  } else if (behavior === 'charge') {
    /* 冲锋型：头部尖角 */
    ctx.fillStyle = body
    ctx.fillRect(x + Math.round(w * 0.15), y - 3, 4, 5)
    ctx.fillRect(x + Math.round(w * 0.7), y - 3, 4, 5)
  } else if (behavior === 'tank') {
    /* 坦克型：加宽护甲 */
    ctx.fillStyle = dark
    ctx.fillRect(x + 2, y + Math.round(h * 0.5), w - 4, 3)
  }
}

function drawProcWeapon(ctx, key, cx, cy, w, h) {
  var hash = 0
  for (var i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  var pal = ['#c8ccd4', '#ffd93d', '#7ee787', '#4dd0e1', '#c86bff', '#ffb86b', '#ff6b4a']
  var c = pal[hash % pal.length]
  var dark = '#2a2a34'
  var wood = '#7a5230'
  var x = Math.round(cx - w / 2)
  var y = Math.round(cy - h)
  var kind = hash % 6
  if (kind === 0) {
    ctx.fillStyle = '#dfe7ef'
    ctx.fillRect(x + Math.round(w * 0.62), y, Math.max(3, Math.round(w * 0.14)), Math.round(h * 0.7))
    ctx.fillStyle = c
    ctx.fillRect(x + Math.round(w * 0.6), y + Math.round(h * 0.3), Math.round(w * 0.18), Math.round(h * 0.18))
    ctx.fillStyle = dark
    ctx.fillRect(x + Math.round(w * 0.6), y + Math.round(h * 0.55), Math.round(w * 0.3), Math.max(2, Math.round(h * 0.12)))
    ctx.fillRect(x + Math.round(w * 0.72), y + Math.round(h * 0.65), Math.max(2, Math.round(w * 0.1)), Math.round(h * 0.25))
  } else if (kind === 1) {
    ctx.fillStyle = wood
    ctx.fillRect(x + Math.round(w * 0.2), y + Math.round(h * 0.25), Math.max(2, Math.round(w * 0.1)), Math.round(h * 0.55))
    ctx.fillRect(x + Math.round(w * 0.3), y + Math.round(h * 0.15), Math.max(2, Math.round(w * 0.1)), Math.round(h * 0.2))
    ctx.fillRect(x + Math.round(w * 0.3), y + Math.round(h * 0.7), Math.max(2, Math.round(w * 0.1)), Math.round(h * 0.2))
    ctx.fillStyle = '#e8e8e0'
    ctx.fillRect(x + Math.round(w * 0.32), y + Math.round(h * 0.2), 1, Math.round(h * 0.65))
    ctx.fillStyle = c
    ctx.fillRect(x + Math.round(w * 0.55), y + Math.round(h * 0.45), Math.round(w * 0.18), Math.round(h * 0.1))
  } else if (kind === 2) {
    ctx.fillStyle = wood
    ctx.fillRect(x + Math.round(w * 0.45), y + Math.round(h * 0.25), Math.max(3, Math.round(w * 0.1)), Math.round(h * 0.7))
    ctx.fillStyle = c
    ctx.fillRect(x + Math.round(w * 0.35), y + Math.round(h * 0.1), Math.round(w * 0.3), Math.round(h * 0.2))
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(x + Math.round(w * 0.45), y + Math.round(h * 0.14), Math.max(2, Math.round(w * 0.08)), Math.round(h * 0.08))
  } else if (kind === 3) {
    ctx.fillStyle = '#404852'
    ctx.fillRect(x + Math.round(w * 0.2), y + Math.round(h * 0.35), Math.round(w * 0.55), Math.round(h * 0.18))
    ctx.fillRect(x + Math.round(w * 0.68), y + Math.round(h * 0.3), Math.round(w * 0.16), Math.round(h * 0.12))
    ctx.fillRect(x + Math.round(w * 0.35), y + Math.round(h * 0.5), Math.round(w * 0.12), Math.round(h * 0.25))
    ctx.fillStyle = c
    ctx.fillRect(x + Math.round(w * 0.25), y + Math.round(h * 0.32), Math.round(w * 0.15), Math.round(h * 0.06))
  } else if (kind === 4) {
    ctx.fillStyle = '#3a4048'
    ctx.fillRect(x + Math.round(w * 0.1), y + Math.round(h * 0.35), Math.round(w * 0.65), Math.round(h * 0.25))
    ctx.fillStyle = c
    ctx.fillRect(x + Math.round(w * 0.65), y + Math.round(h * 0.3), Math.round(w * 0.22), Math.round(h * 0.3))
    ctx.fillStyle = dark
    ctx.fillRect(x + Math.round(w * 0.25), y + Math.round(h * 0.55), Math.round(w * 0.14), Math.round(h * 0.18))
  } else {
    ctx.fillStyle = c
    ctx.fillRect(x + Math.round(w * 0.3), y + Math.round(h * 0.25), Math.round(w * 0.35), Math.round(h * 0.35))
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(x + Math.round(w * 0.4), y + Math.round(h * 0.32), Math.max(2, Math.round(w * 0.08)), Math.round(h * 0.08))
    ctx.fillStyle = dark
    ctx.fillRect(x + Math.round(w * 0.43), y + Math.round(h * 0.55), Math.round(w * 0.1), Math.round(h * 0.15))
  }
}

function drawProcPlayer(ctx, key, cx, cy, w, h, color) {
  var c = color || '#c9c9d8'
  var x = Math.round(cx - w / 2)
  var y = Math.round(cy - h)
  var skin = '#f5d6b4'
  var dark = '#1a1a24'
  ctx.fillStyle = c
  ctx.fillRect(x + 4, y + Math.round(h * 0.45), w - 8, Math.round(h * 0.45))
  ctx.fillStyle = skin
  ctx.fillRect(x + Math.round(w * 0.25), y + Math.round(h * 0.12), Math.round(w * 0.5), Math.round(h * 0.34))
  ctx.fillStyle = c
  ctx.fillRect(x + Math.round(w * 0.2), y + Math.round(h * 0.05), Math.round(w * 0.6), Math.round(h * 0.16))
  ctx.fillStyle = dark
  ctx.fillRect(x + Math.round(w * 0.35), y + Math.round(h * 0.24), 2, 3)
  ctx.fillRect(x + Math.round(w * 0.58), y + Math.round(h * 0.24), 2, 3)
  ctx.fillRect(x + 4, y + h - 3, 5, 3)
  ctx.fillRect(x + w - 9, y + h - 3, 5, 3)
}

function drawSprite(ctx, key, cx, cy, opts) {
  opts = opts || {}
  var s = spr(key)
  var scale = Math.max(1, Math.round(opts.scale || 2))
  if (!s) {
    /* 占位：没有美术也不崩；敌人/首领按 id 生成原创像素小怪 */
    var w = opts.fallbackW || 20
    var h = opts.fallbackH || 20
    if (key.indexOf('enemy_') === 0 || key.indexOf('boss_') === 0) {
      drawProcMonster(ctx, key, cx, cy, w, h, opts.theme, opts.behavior)
      return
    }
    if (key.indexOf('wp_') === 0) {
      drawProcWeapon(ctx, key, cx, cy, w, h)
      return
    }
    if (key.indexOf('player_') === 0) {
      drawProcPlayer(ctx, key, cx, cy, w, h, opts.fallbackColor)
      return
    }
    ctx.fillStyle = opts.fallbackColor || '#7a7a92'
    ctx.fillRect(Math.round(cx - w / 2), Math.round(cy - h), w, h)
    return
  }
  var frames = s.frames || [s.rows]
  var idx = opts.frame || 0
  if (idx >= frames.length) idx = frames.length - 1
  if (idx < 0) idx = 0
  var b = bakedRows(frames[idx])
  if (!b) return
  var w2 = b.w
  var h2 = b.h
  var x0 = Math.round(cx - (w2 * scale) / 2)
  var y0 = Math.round(cy - h2 * scale)
  var flip = !!opts.flip
  var alpha = (opts.alpha == null ? 1 : opts.alpha)
  var tint = opts.tint || null
  var runs = b.runs
  ctx.save()
  ctx.globalAlpha = alpha
  if (tint) ctx.fillStyle = tint
  for (var i = 0; i < runs.length; i++) {
    var r = runs[i]
    if (!tint) ctx.fillStyle = r.c
    var dx = flip ? (w2 - r.x - r.w) : r.x
    ctx.fillRect(x0 + dx * scale, y0 + r.y * scale, r.w * scale, scale)
  }
  ctx.restore()
}

/* 让美术表可以覆盖颜色：默认用全局 PAL；单 key 可通过 SPRITE_COLORS 覆盖（预留） */
import { PAL } from './palette.js'
function colorFor(key, ch) {
  var col = PAL[ch]
  return col || null
}

function drawSpriteRot(ctx, key, cx, cy, angle, scale, flip, tint) {
  scale = Math.max(1, Math.round(scale || 2))
  var s = spr(key)
  if (!s) return
  var frames = s.frames || [s.rows]
  var b = bakedRows(frames[0])
  if (!b) return
  var w2 = b.w
  var h2 = b.h
  ctx.save()
  ctx.translate(Math.round(cx), Math.round(cy))
  ctx.rotate(angle)
  if (flip) ctx.scale(1, -1)
  if (tint) {
    /* 简易描边闪光：画一个亮色小方块 */
    ctx.fillStyle = tint
    ctx.fillRect(-6, -4, 14, 7)
    ctx.restore()
    return
  }
  var runs = b.runs
  for (var i = 0; i < runs.length; i++) {
    var r = runs[i]
    ctx.fillStyle = r.c
    ctx.fillRect(Math.round((r.x - w2 / 2) * scale), Math.round((r.y - h2 / 2) * scale), Math.max(1, r.w * scale), Math.max(1, scale))
  }
  ctx.restore()
}

function text(ctx, str, x, y, size, color, align, bold) {
  ctx.font = (bold ? 'bold ' : '') + Math.round(size) + 'px sans-serif'
  ctx.textAlign = align || 'left'
  ctx.fillStyle = color || '#e8e8f0'
  ctx.fillText(str, Math.round(x), Math.round(y))
}

function pxRect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h))
}

/* ---------------- 主入口 ---------------- */

export function renderGame(g) {
  var ctx = g.ctx
  if (!ctx) return
  var cw = g.canvasPxW
  var ch = g.canvasPxH
  if (!cw || !ch) {
    try { if (ctx.canvas) { cw = ctx.canvas.width; ch = ctx.canvas.height } } catch (e) {}
  }
  if (!cw) cw = g.viewW
  if (!ch) ch = g.viewH
  g.actualCw = cw
  g.actualCh = ch
  var scX = cw / g.viewW
  var scY = ch / g.viewH
  g.scX = scX
  g.scY = scY
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  pxRect(ctx, 0, 0, cw, ch, '#080a10')
  ctx.setTransform(scX, 0, 0, scY, 0, 0)
  try { ctx.imageSmoothingEnabled = false } catch (eS) {}
  if (!g.room || !g.player) {
    text(ctx, '笔上元气骑士', g.viewW / 2, g.viewH / 2, 28, '#ffd93d', 'center', true)
    return
  }
  var staticDrawn = false
  if (g.shake <= 0.2) {
    try {
      ensureStaticLayer(g, ctx)
      if (g._staticLayer) staticDrawn = blitStatic(g, ctx)
    } catch (eBake) { staticDrawn = false }
  }
  ctx.setTransform(scX, 0, 0, scY, 0, 0)
  var shakeX = 0
  var shakeY = 0
  if (g.shake > 0.2) {
    shakeX = (Math.random() - 0.5) * g.shake
    shakeY = (Math.random() - 0.5) * g.shake
  }
  ctx.save()
  ctx.translate(Math.round(-g.camX + shakeX), Math.round(-g.camY + shakeY))
  if (staticDrawn) drawDoors(g, ctx)
  else drawTiles(g, ctx)
  drawProps(g, ctx)
  drawPickups(g, ctx)
  drawTurret(g, ctx)
  drawEnemies(g, ctx)
  drawPlayer(g, ctx)
  drawPet(g, ctx)
  drawExitGuide(g, ctx)
  drawBullets(g, ctx)
  drawEffects(g, ctx)
  drawFloats(g, ctx)
  ctx.restore()
  drawHUD(g, ctx)
  if (g.state === 'floor_intro') drawFloorIntro(g, ctx)
}

/* ---------------- 地图 ---------------- */

function themeOf(g) {
  var t = 'forest'
  if (g.run) {
    if (g.run.sceneTheme) t = g.run.sceneTheme
    else {
      var ch = CHAPTERS[g.run.chapter - 1]
      if (ch && ch.theme) t = ch.theme
    }
  }
  return THEME[t] || THEME.forest
}

function tileHash(x, y) {
  var n = (x * 374761393 + y * 668265263) & 0x7fffffff
  return (n % 100) / 100
}

/* ---- 静态地图层烘焙 ----
 * 地板/墙体/障碍在一间房内不变。用 createImageData 当离屏缓冲，进房后烘焙一次，
 * 每帧只 putImageData 可见区域，避免数百次 fillRect。Canvas 1:1 物理像素时启用；
 * 不支持 createImageData/putImageData 或缩放不为 1 时自动回退逐格绘制。 */
function hexRgb(hex) {
  if (typeof hex !== 'string' || hex.length !== 7 || hex.charAt(0) !== '#') return null
  var r = parseInt(hex.substr(1, 2), 16)
  var g = parseInt(hex.substr(3, 2), 16)
  var b = parseInt(hex.substr(5, 2), 16)
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null
  return [r, g, b]
}

function bakeStatic(g, ctx) {
  var th = themeOf(g)
  var w = g.worldW
  var h = g.worldH
  if (!(w > 0) || !(h > 0)) return null
  if (w * h * 4 > 8 * 1024 * 1024) return null
  var base = hexRgb(th.back)
  var f1 = hexRgb(th.floor1)
  var f2 = hexRgb(th.floor2)
  var wall = hexRgb(th.wall)
  var top = hexRgb(th.wallTop)
  var dark = hexRgb('#10120f')
  if (!base || !f1 || !f2 || !wall || !top || !dark) return null
  var img, d
  try {
    if (!ctx || typeof ctx.createImageData !== 'function') return null
    img = ctx.createImageData(w, h)
    if (!img || !img.data || img.data.length < w * h * 4) return null
    d = img.data
  } catch (e0) { return null }
  var rowBytes = w << 2
  function rowPattern(altFirst) {
    var pat = new Uint8ClampedArray(rowBytes)
    for (var px = 0; px < w; px++) {
      var tileIdx = Math.floor(px / TILE)
      var useAlt = altFirst ? (tileIdx % 2 === 0) : (tileIdx % 2 === 1)
      var col = useAlt ? f2 : f1
      var o = px << 2
      pat[o] = col[0]; pat[o + 1] = col[1]; pat[o + 2] = col[2]; pat[o + 3] = 255
    }
    return pat
  }
  var canRow = (typeof d.set === 'function')
  if (canRow) {
    try {
      var patEven = rowPattern(true)
      var patOdd = rowPattern(false)
      for (var ry = 0; ry < h; ry++) {
        d.set((Math.floor(ry / TILE) % 2 === 0) ? patEven : patOdd, ry * rowBytes)
      }
    } catch (eSet) { canRow = false }
  }
  if (!canRow) {
    for (var i0 = 0, n0 = w * h; i0 < n0; i0++) {
      var o0 = i0 << 2
      d[o0] = base[0]; d[o0 + 1] = base[1]; d[o0 + 2] = base[2]; d[o0 + 3] = 255
    }
  }
  function fill(px, py, pw, ph, col) {
    var xa = Math.max(0, px)
    var ya = Math.max(0, py)
    var xb = Math.min(w, px + pw)
    var yb = Math.min(h, py + ph)
    for (var yy = ya; yy < yb; yy++) {
      var ro = (yy * w + xa) << 2
      for (var xx = xa; xx < xb; xx++) {
        d[ro] = col[0]; d[ro + 1] = col[1]; d[ro + 2] = col[2]; d[ro + 3] = 255
        ro += 4
      }
    }
  }
  for (var ty = 0; ty < g.roomH; ty++) {
    var row = g.rows[ty]
    if (!row) continue
    for (var tx = 0; tx < g.roomW; tx++) {
      var ch = row ? row[tx] : '#'
      var x = tx * TILE
      var y = ty * TILE
      if (ch === '#') {
        fill(x, y, TILE, TILE, wall)
        fill(x, y, TILE, 6, top)
        fill(x, y + TILE - 4, TILE, 4, dark)
      } else if (ch === 'O') {
        fill(x, y, TILE, TILE, f1)
        fill(x + 2, y + 2, TILE - 4, TILE - 4, wall)
        fill(x + 6, y + 6, TILE - 12, 4, top)
      } else if (ch === 'D') {
        fill(x, y, TILE, TILE, f1)
      } else {
        /* 与墙相邻的格边加暗，保留纵深感 */
        if (g.tileAt(tx, ty - 1) === '#') fill(x, y, TILE, 4, dark)
        if (g.tileAt(tx, ty + 1) === '#') fill(x, y + TILE - 4, TILE, 4, dark)
      }
    }
  }
  return { img: img, w: w, h: h }
}

function staticKey(g) {
  var rk = g.room ? (g.room.key || ((g.room.gx == null ? '?' : g.room.gx) + ',' + (g.room.gy == null ? '?' : g.room.gy))) : ''
  return (g.run ? g.run.chapter + ':' + g.run.floorIndex : '0') + ':' + rk + ':' + g.roomW + 'x' + g.roomH
}

function ensureStaticLayer(g, ctx) {
  var key = staticKey(g)
  if (g._staticLayer && g._staticKey === key) return g._staticLayer
  if (g._staticFailKey === key) return null
  var layer = null
  try { layer = bakeStatic(g, ctx) } catch (e) { layer = null }
  if (!layer) { g._staticFailKey = key; g._staticLayer = null; return null }
  g._staticLayer = layer.img
  g._staticW = layer.w
  g._staticH = layer.h
  g._staticKey = key
  return layer.img
}

function blitStatic(g, ctx) {
  var img = g._staticLayer
  if (!img) return false
  if (Math.abs((g.scX || 1) - 1) > 0.001 || Math.abs((g.scY || 1) - 1) > 0.001) return false
  var vx0 = Math.max(0, Math.floor(g.camX))
  var vy0 = Math.max(0, Math.floor(g.camY))
  var vx1 = Math.min(g._staticW || g.worldW, Math.ceil(g.camX + g.viewW))
  var vy1 = Math.min(g._staticH || g.worldH, Math.ceil(g.camY + g.viewH))
  var vw = vx1 - vx0
  var vh = vy1 - vy0
  if (!(vw > 0) || !(vh > 0)) return false
  var dx = Math.round(vx0 - g.camX)
  var dy = Math.round(vy0 - g.camY)
  try {
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.putImageData(img, -vx0, -vy0, vx0, vy0, vw, vh, dx, dy)
    return true
  } catch (e) {
    try {
      ctx.putImageData(img, -vx0, -vy0)
      return true
    } catch (e2) { return false }
  }
}

function drawDoors(g, ctx) {
  var th = themeOf(g)
  for (var ty = 0; ty < g.roomH; ty++) {
    var row = g.rows[ty]
    if (!row) continue
    for (var tx = 0; tx < g.roomW; tx++) {
      if (row[tx] !== 'D') continue
      var door = g.doorTiles[tx + ',' + ty]
      var x = tx * TILE
      var y = ty * TILE
      pxRect(ctx, x, y, TILE, TILE, th.floor1)
      if (door && door.open) {
        pxRect(ctx, x + 2, y + 4, TILE - 4, TILE - 8, 'rgba(0,0,0,0.35)')
        pxRect(ctx, x + 4, y + 6, TILE - 8, 4, '#c8a24a')
      } else if (door) {
        pxRect(ctx, x + 1, y + 2, TILE - 2, TILE - 4, '#6b4a2f')
        pxRect(ctx, x + 4, y + 6, TILE - 8, TILE - 12, '#8a6238')
        pxRect(ctx, x + TILE / 2 - 2, y + TILE / 2 - 8, 4, 16, '#c8a24a')
      }
    }
  }
}

function drawTiles(g, ctx) {
  var th = themeOf(g)
  var x0 = Math.max(0, Math.floor(g.camX / TILE) - 1)
  var y0 = Math.max(0, Math.floor(g.camY / TILE) - 1)
  var x1 = Math.min(g.roomW - 1, Math.ceil((g.camX + g.viewW) / TILE) + 1)
  var y1 = Math.min(g.roomH - 1, Math.ceil((g.camY + g.viewH) / TILE) + 1)
  pxRect(ctx, 0, 0, g.worldW, g.worldH, th.back)
  for (var ty = y0; ty <= y1; ty++) {
    for (var tx = x0; tx <= x1; tx++) {
      var ch = g.rows[ty][tx]
      var x = tx * TILE
      var y = ty * TILE
      if (ch === '#') {
        pxRect(ctx, x, y, TILE, TILE, th.wall)
        pxRect(ctx, x, y, TILE, 6, th.wallTop)
        pxRect(ctx, x, y + TILE - 4, TILE, 4, 'rgba(0,0,0,0.25)')
        if (tileHash(tx, ty) > 0.7) pxRect(ctx, x + 6, y + 12, 8, 4, th.wallTop)
        if (tileHash(tx + 7, ty) > 0.8) pxRect(ctx, x + 18, y + 20, 8, 4, 'rgba(0,0,0,0.22)')
      } else if (ch === 'O') {
        pxRect(ctx, x, y, TILE, TILE, th.floor1)
        pxRect(ctx, x + 2, y + 2, TILE - 4, TILE - 4, th.wall)
        pxRect(ctx, x + 6, y + 6, TILE - 12, 4, th.wallTop)
      } else if (ch === 'D') {
        var door = g.doorTiles[tx + ',' + ty]
        pxRect(ctx, x, y, TILE, TILE, th.floor1)
        if (door && door.open) {
          pxRect(ctx, x + 2, y + 4, TILE - 4, TILE - 8, 'rgba(0,0,0,0.35)')
          pxRect(ctx, x + 4, y + 6, TILE - 8, 4, '#c8a24a')
        } else if (door) {
          pxRect(ctx, x + 1, y + 2, TILE - 2, TILE - 4, '#6b4a2f')
          pxRect(ctx, x + 4, y + 6, TILE - 8, TILE - 12, '#8a6238')
          pxRect(ctx, x + TILE / 2 - 2, y + TILE / 2 - 8, 4, 16, '#c8a24a')
        }
      } else {
        var h = tileHash(tx, ty)
        pxRect(ctx, x, y, TILE, TILE, h > 0.5 ? th.floor1 : th.floor2)
        if (h > 0.85) pxRect(ctx, x + 8, y + 10, 5, 5, 'rgba(255,255,255,0.06)')
        else if (h < 0.08) pxRect(ctx, x + 18, y + 20, 7, 4, 'rgba(0,0,0,0.14)')
        /* 与墙相邻的边加暗 */
        if (g.tileAt(tx, ty - 1) === '#') pxRect(ctx, x, y, TILE, 4, 'rgba(0,0,0,0.28)')
        if (g.tileAt(tx, ty + 1) === '#') pxRect(ctx, x, y + TILE - 4, TILE, 4, 'rgba(0,0,0,0.18)')
      }
    }
  }
}

/* ---------------- 道具 / 拾取物 ---------------- */

function drawProps(g, ctx) {
  var i
  for (i = 0; i < g.chests.length; i++) {
    var c = g.chests[i]
    var key = 'prop_chest'
    if (c.kind === 'crate') key = 'prop_crate'
    else if (c.kind === 'barrel') key = 'prop_barrel'
    else if (c.kind === 'gold') key = 'prop_gold_chest'
    ctx.save()
    ctx.globalAlpha = c.opened ? 0.45 : 1
    drawSprite(ctx, key, c.x, c.y + 10, { scale: 1.6, fallbackW: 22, fallbackH: 22, fallbackColor: c.kind === 'gold' ? '#ffd93d' : '#8a6238' })
    ctx.restore()
    if (c.kind === 'gold' && !c.opened) {
      var bl = Math.sin(g.time * 4) * 2
      text(ctx, '金', c.x, c.y - 16 + bl, 10, '#ffd93d', 'center', true)
    }
  }
  for (i = 0; i < g.npcs.length; i++) {
    var n = g.npcs[i]
    drawSprite(ctx, 'prop_shopkeeper', n.x, n.y + 14, { scale: 1.8, fallbackW: 22, fallbackH: 26, fallbackColor: '#c8a24a' })
    text(ctx, '商店', n.x, n.y - 20, 11, '#ffd93d', 'center', true)
  }
  if (g.statue && !g.statue.used) {
    drawSprite(ctx, 'prop_statue', g.statue.x, g.statue.y + 16, { scale: 1.9, fallbackW: 22, fallbackH: 28, fallbackColor: '#7a7a92' })
    text(ctx, '祈福', g.statue.x, g.statue.y - 18, 11, '#b3ecff', 'center', true)
  }
  if (g.portal) {
    var t = g.portal.t || 0
    var pulse = 10 + Math.sin(t * 5) * 3
    pxRect(ctx, g.portal.x - 20, g.portal.y - 34, 40, 44, '#1a1030')
    for (var r = 0; r < 8; r++) {
      var a = r * Math.PI * 2 / 8 + t * 2
      var col = r % 2 === 0 ? '#b06bff' : '#4dd0e1'
      pxRect(ctx, g.portal.x + Math.cos(a) * pulse - 2, g.portal.y - 12 + Math.sin(a) * pulse - 2, 4, 4, col)
    }
    pxRect(ctx, g.portal.x - 8, g.portal.y - 42, 16, 6, '#b06bff')
    text(ctx, '传送门', g.portal.x, g.portal.y - 52, 11, '#e0a0ff', 'center', true)
  }
}

function drawPickups(g, ctx) {
  for (var i = 0; i < g.pickups.length; i++) {
    var pk = g.pickups[i]
    var bob = Math.sin((pk.t || 0) * 5) * 2
    if (pk.kind === 'weapon') {
      drawSprite(ctx, 'wp_' + pk.weaponId, pk.x, pk.y + 6 + bob, { scale: 2, fallbackW: 20, fallbackH: 10, fallbackColor: '#c8ccd4' })
      if (pk.name) text(ctx, pk.name, pk.x, pk.y - 16, 12, '#ffd93d', 'center', false)
    } else if (pk.kind === 'coin') {
      drawSprite(ctx, 'pk_coin', pk.x, pk.y + 3 + bob, { scale: 2, fallbackW: 8, fallbackH: 8, fallbackColor: '#ffd93d' })
    } else if (pk.kind === 'gem') {
      drawSprite(ctx, 'pk_gem', pk.x, pk.y + 3 + bob, { scale: 2, fallbackW: 8, fallbackH: 8, fallbackColor: '#e0a0ff' })
    } else if (pk.kind === 'heart') {
      drawSprite(ctx, 'pk_heart', pk.x, pk.y + 3 + bob, { scale: 2, fallbackW: 8, fallbackH: 8, fallbackColor: '#ff5a5a' })
    } else if (pk.kind === 'energy') {
      drawSprite(ctx, 'pk_energy_orb', pk.x, pk.y + 3 + bob, { scale: 2, fallbackW: 8, fallbackH: 8, fallbackColor: '#4dd0e1' })
    } else if (pk.kind === 'potion_hp') {
      drawSprite(ctx, 'pk_potion_hp', pk.x, pk.y + 3 + bob, { scale: 2, fallbackW: 8, fallbackH: 8, fallbackColor: '#ff5a5a' })
    } else if (pk.kind === 'potion_energy') {
      drawSprite(ctx, 'pk_potion_energy', pk.x, pk.y + 3 + bob, { scale: 2, fallbackW: 8, fallbackH: 8, fallbackColor: '#4dd0e1' })
    }
  }
}

function drawTurret(g, ctx) {
  if (!g.turret) return
  drawSprite(ctx, 'prop_turret', g.turret.x, g.turret.y + 12, { scale: 1.6, fallbackW: 20, fallbackH: 20, fallbackColor: '#ffd93d' })
  var ratio = Math.max(0, g.turret.life / 10)
  pxRect(ctx, g.turret.x - 12, g.turret.y - 18, 24, 3, '#333')
  pxRect(ctx, g.turret.x - 12, g.turret.y - 18, 24 * ratio, 3, '#ffd93d')
}

/* ---------------- 角色 / 敌人 ---------------- */

function shadow(ctx, x, y, w) {
  pxRect(ctx, x - w / 2, y - 3, w, 4, 'rgba(0,0,0,0.32)')
}

function drawPet(g, ctx) {
  var pet = g.pet
  if (!pet || !pet.def) return
  var c = pet.def.color || '#ffd93d'
  shadow(ctx, pet.x, pet.y + 2, 14)
  drawSprite(ctx, 'pet_' + pet.def.id, pet.x, pet.y + 1, {
    scale: 1.2, fallbackW: 16, fallbackH: 16, fallbackColor: c
  })
}

function drawPlayer(g, ctx) {
  var p = g.player
  if (!p || p.dead) return
  var def = null
  var key = 'player_' + (g.run ? g.run.characterId : 'knight')
  var moving = p.moving || p.rollT > 0
  var frame = 0
  if (moving) frame = 1 + (Math.floor(p.walkT * 10) % 2)
  var alpha = 1
  if (p.invuln > 0 && Math.floor(p.invuln * 20) % 2 === 0) alpha = 0.55
  if (p.rollT > 0) alpha = 0.8
  shadow(ctx, p.x, p.y + 2, 22)
  drawSprite(ctx, key, p.x, p.y + 14, {
    scale: 2, flip: p.facing < 0, frame: frame, alpha: alpha,
    tint: p.hitFlash > 0 ? '#ffffff' : null,
    fallbackW: 22, fallbackH: 30,
    fallbackColor: (CHARACTERS[g.run ? g.run.characterId : 'knight'] || {}).color || '#c9c9d8'
  })
  /* 手持武器 */
  var w = p.weapons[p.activeSlot]
  if (w && w.def) {
    var ang = Math.atan2(p.aimY, p.aimX)
    var wx = p.x + Math.cos(ang) * 16
    var wy = p.y - 6 + Math.sin(ang) * 10
    drawSpriteRot(ctx, w.def.sprite, wx, wy, ang, 2, p.facing < 0, p.hitFlash > 0 ? '#ffffff' : null)
  }
  /* 技能冷却环（像素块） */
  if (p.skillCd > 0) {
    var ratio = p.skillCd / (p.skillCdMax || 1)
    var n = 10
    for (var i = 0; i < n; i++) {
      if (i / n < ratio) continue
      var a2 = Math.PI * 2 * i / n - Math.PI / 2
      pxRect(ctx, p.x + Math.cos(a2) * 26 - 2, p.y - 8 + Math.sin(a2) * 26 - 2, 4, 4, '#ffd93d')
    }
  }
  if (p.dualWieldT > 0) text(ctx, '双持', p.x, p.y - 34, 11, '#ffd93d', 'center', true)
  if (g.interactInfo) text(ctx, g.interactInfo.label, p.x, p.y - 46, 12, '#ffd93d', 'center', true)
}

function enemyFrame(e) {
  if (e.boss) return Math.floor((e.walkT || 0) * 3) % 2
  return Math.floor((e.walkT || 0) * 6) % 2
}

function drawEnemies(g, ctx) {
  for (var i = 0; i < g.enemies.length; i++) {
    var e = g.enemies[i]
    if (e.dead) continue
    var key = (e.boss ? 'boss_' : 'enemy_') + e.id
    var scale = e.boss ? 3 : 2
    if (e.state === 'burrow') {
      /* 潜地：只画土堆 */
      pxRect(ctx, e.x - 12, e.y - 4, 24, 8, '#8a6a3a')
      pxRect(ctx, e.x - 6, e.y - 8, 12, 5, '#a8814a')
      continue
    }
    shadow(ctx, e.x, e.y + 2, e.boss ? 56 : (e.elite ? 30 : 24))
    if (e.elite) {
      var rr = 24 + Math.sin(g.time * 6) * 3
      for (var a = 0; a < 12; a++) {
        var ang = Math.PI * 2 * a / 12 + g.time * 2
        pxRect(ctx, e.x + Math.cos(ang) * rr - 2, e.y + Math.sin(ang) * rr - 2, 4, 4, '#ffd93d')
      }
    }
    drawSprite(ctx, key, e.x, e.y + (e.boss ? 28 : 12), {
      scale: scale, frame: enemyFrame(e),
      tint: e.hitFlash > 0 ? '#ffffff' : null,
      alpha: e.state === 'tele' && Math.floor(e.stateT * 12) % 2 === 0 ? 0.6 : 1,
      fallbackW: e.boss ? 52 : 24, fallbackH: e.boss ? 64 : 24,
      fallbackColor: e.boss ? '#a02030' : (e.elite ? '#ffd93d' : '#4caf50'),
      theme: (g.run && g.run.sceneTheme) ? g.run.sceneTheme : 'forest',
      behavior: e.def ? e.def.behavior : ''
    })
    if (!e.boss && e.hp < e.maxHp) {
      var bw = e.elite ? 34 : 26
      pxRect(ctx, e.x - bw / 2, e.y - (e.elite ? 26 : 20), bw, 4, 'rgba(0,0,0,0.6)')
      pxRect(ctx, e.x - bw / 2, e.y - (e.elite ? 26 : 20), bw * Math.max(0, e.hp / e.maxHp), 4, '#ff5a5a')
    }
    if (e.state === 'tele' || e.state === 'charge_tele') {
      var r2 = 20 + (e.stateT || 0) * 40
      for (var b = 0; b < 16; b++) {
        var a2 = Math.PI * 2 * b / 16
        pxRect(ctx, e.x + Math.cos(a2) * r2 - 2, e.y + Math.sin(a2) * r2 - 2, 4, 4, '#ff5a5a')
      }
    }
  }
}

/* ---------------- 子弹 / 特效 ---------------- */

function drawBullets(g, ctx) {
  for (var i = 0; i < g.bullets.length; i++) {
    var b = g.bullets[i]
    var s = b.size
    if (b.owner === 'player') {
      pxRect(ctx, b.x - s, b.y - s, s * 2, s * 2, b.color)
      pxRect(ctx, b.x - s * 0.45, b.y - s * 0.45, s * 0.9, s * 0.9, '#ffffff')
      if (b.trail) pxRect(ctx, b.x - b.vx * 0.012 - 1, b.y - b.vy * 0.012 - 1, 3, 3, b.color)
    } else {
      pxRect(ctx, b.x - s, b.y - s, s * 2, s * 2, '#3a1020')
      pxRect(ctx, b.x - s + 1, b.y - s + 1, s * 2 - 2, s * 2 - 2, b.color)
      if (b.element && ELEMENT[b.element]) pxRect(ctx, b.x - 2, b.y - 2, 4, 4, '#ffffff')
    }
  }
}

function drawEffects(g, ctx) {
  for (var i = 0; i < g.effects.length; i++) {
    var e = g.effects[i]
    var k = e.life / (e.maxLife || 1)
    if (e.type === 'particle') {
      pxRect(ctx, e.x, e.y, e.size, e.size, e.color)
    } else if (e.type === 'slash') {
      var steps = 9
      for (var s = 0; s < steps; s++) {
        var a = e.ang - e.arc / 2 + e.arc * (s / (steps - 1))
        for (var r = 18; r < e.range; r += 14) {
          pxRect(ctx, e.x + Math.cos(a) * r - 1, e.y + Math.sin(a) * r - 1, 3, 3, e.color)
        }
      }
    } else if (e.type === 'beam') {
      var dx = e.x2 - e.x1
      var dy = e.y2 - e.y1
      var l = Math.sqrt(dx * dx + dy * dy)
      var n = Math.max(1, Math.floor(l / 10))
      for (var j = 0; j < n; j++) {
        var t = j / n
        pxRect(ctx, e.x1 + dx * t, e.y1 + dy * t, 5, 5, e.color)
        pxRect(ctx, e.x1 + dx * t + 1, e.y1 + dy * t + 1, 3, 3, '#ffffff')
      }
    } else if (e.type === 'explosion' || e.type === 'ring') {
      var centerX = e.x
      var centerY = e.y
      var radius = (e.type === 'explosion' ? e.r * (1 - k) : e.r * (1 + (1 - k) * 0.4))
      var cnt = e.type === 'explosion' ? 20 : 16
      for (var q = 0; q < cnt; q++) {
        var aa = Math.PI * 2 * q / cnt
        pxRect(ctx, centerX + Math.cos(aa) * radius - 2, centerY + Math.sin(aa) * radius - 2, 4, 4, e.color)
      }
    } else if (e.type === 'torch') {
      var fl = 1 + Math.sin(g.time * 9 + e.x) * 1.5
      pxRect(ctx, e.x - 3, e.y - 10 - fl, 6, 6 + fl, '#ffd93d')
      pxRect(ctx, e.x - 1, e.y - 12 - fl, 3, 3, '#ff9f1c')
    } else if (e.type === 'arrow') {
      pxRect(ctx, e.x - 1, e.y - 12, 3, 12, e.color)
      pxRect(ctx, e.x - 3, e.y - 12, 7, 3, e.color)
    }
  }
}

function drawFloats(g, ctx) {
  for (var i = 0; i < g.floats.length; i++) {
    var f = g.floats[i]
    var k = f.life / (f.maxLife || 1)
    ctx.globalAlpha = Math.max(0.2, k)
    text(ctx, f.text, f.x, f.y, 14, f.color, 'center', true)
    ctx.globalAlpha = 1
  }
}

/* ---------------- HUD ---------------- */

function drawHeart(ctx, x, y, size, filled, color) {
  if (filled) {
    pxRect(ctx, x, y + size * 0.25, size, size * 0.75, color || '#ff5a5a')
    pxRect(ctx, x + size * 0.2, y, size * 0.6, size * 0.4, color || '#ff5a5a')
    pxRect(ctx, x + size * 0.35, y - size * 0.15, size * 0.3, size * 0.3, color || '#ff8a8a')
  } else {
    pxRect(ctx, x, y + size * 0.25, size, size * 0.75, 'rgba(80,20,30,0.55)')
    pxRect(ctx, x + size * 0.2, y, size * 0.6, size * 0.4, 'rgba(80,20,30,0.55)')
  }
}

function drawShield(ctx, x, y, size, filled, color) {
  var c = filled ? (color || '#4a7dff') : 'rgba(20,40,70,0.55)'
  pxRect(ctx, x + 2, y, size - 4, size * 0.5, c)
  pxRect(ctx, x, y + size * 0.25, size, size * 0.4, c)
  pxRect(ctx, x + 3, y + size * 0.6, size - 6, size * 0.3, c)
}

/* 出口引导：玩家脚下向最近已开门/传送门画一条金色虚线，并在目标上方立光标 */
function drawExitGuide(g, ctx) {
  var target = null
  try { target = g.exitGuide ? g.exitGuide() : null } catch (e0) {}
  if (!target || !g.player) return
  var p = g.player
  var dx = target.x - p.x
  var dy = target.y - p.y
  var d = Math.sqrt(dx * dx + dy * dy)
  if (d < 36) return
  var ux = dx / d
  var uy = dy / d
  var sx = p.x + ux * 20
  var sy = p.y + uy * 20
  var i
  for (i = 1; i <= 9; i++) {
    var t = i / 9
    var col = (i % 2 === 0) ? '#ffd93d' : '#fff1a8'
    pxRect(ctx, sx + (target.x - sx) * t - 2, sy + (target.y - sy) * t - 2, 4, 4, col)
  }
  var bob = Math.sin((g.time || 0) * 5) * 2
  pxRect(ctx, target.x - 2, target.y - 44 + bob, 4, 30, 'rgba(255,217,61,0.9)')
  pxRect(ctx, target.x - 8, target.y - 16 + bob, 16, 4, '#ffd93d')
  text(ctx, target.label, target.x, target.y - 52 + bob, 11, '#ffe66d', 'center', true)
}

function drawHUD(g, ctx) {  var p = g.player
  if (!p) return
  var W = g.viewW
  /* 顶部背景条 */
  pxRect(ctx, 0, 0, W, 46, 'rgba(5,7,12,0.55)')
  /* 生命 */
  var hearts = Math.ceil(p.maxHp)
  var perRow = 12
  var hs = 12
  for (var i = 0; i < hearts; i++) {
    var col = i % perRow
    var row = Math.floor(i / perRow)
    drawHeart(ctx, 10 + col * (hs + 2), 6 + row * (hs + 2), hs, i < p.hp, '#ff5a5a')
  }
  /* 护甲 */
  var shields = Math.ceil(p.maxArmor)
  for (var a = 0; a < shields; a++) {
    drawShield(ctx, 10 + a * (hs + 2), 6 + Math.ceil(hearts / perRow) * (hs + 2) + 2, hs, a < p.armor, '#4a7dff')
  }
  /* 能量条 */
  var ey = 6 + Math.ceil(hearts / perRow) * (hs + 2) + 20
  var ew = 150
  pxRect(ctx, 10, ey, ew, 8, 'rgba(0,0,0,0.6)')
  pxRect(ctx, 10, ey, ew * Math.max(0, Math.min(1, p.energy / p.maxEnergy)), 8, '#4dd0e1')
  text(ctx, Math.floor(p.energy) + '/' + p.maxEnergy, 10 + ew + 6, ey + 8, 12, '#9adcff')
  /* 金币 / 宝石 */
  var rowY = 8
  drawSprite(ctx, 'pk_coin', W - 178, rowY + 12, { scale: 2, fallbackW: 8, fallbackH: 8, fallbackColor: '#ffd93d' })
  text(ctx, String(g.run ? g.run.coins : 0), W - 168, rowY + 15, 15, '#ffd93d', 'left', true)
  drawSprite(ctx, 'pk_gem', W - 108, rowY + 12, { scale: 2, fallbackW: 8, fallbackH: 8, fallbackColor: '#e0a0ff' })
  text(ctx, String(g.run ? g.run.gemsCollected : 0), W - 98, rowY + 15, 15, '#e0a0ff', 'left', true)
  /* 楼层 */
  var fname = (g.run ? g.run.chapterName : '') + ' ' + (g.run ? g.run.chapter : 1) + '-' + (g.run ? g.run.floorInChapter : 1)
  text(ctx, fname, W / 2, 19, 16, '#e8e8f0', 'center', true)
  /* 精英/Boss 血条 */
  var boss = null
  for (var e = 0; e < g.enemies.length; e++) if (g.enemies[e].boss) { boss = g.enemies[e]; break }
  if (boss) {
    var bw = 300
    pxRect(ctx, W / 2 - bw / 2 - 2, 26, bw + 4, 16, 'rgba(0,0,0,0.7)')
    pxRect(ctx, W / 2 - bw / 2, 28, bw * Math.max(0, boss.hp / boss.maxHp), 12, '#e5484d')
    text(ctx, boss.def.name, W / 2, 39, 13, '#ffffff', 'center', true)
  }
  /* 小地图 */
  drawMinimap(g, ctx, W - 92, 50)
  /* 武器槽 */
  drawWeaponSlots(g, ctx, 10, g.viewH - 50)
  /* 天赋图标 */
  var bx = 170
  for (var b = 0; b < g.ownedBuffs.length && b < 8; b++) {
    var ob = g.ownedBuffs[b]
    var icon = ob.icon || 'ui_buff_hp'
    drawSprite(ctx, icon, 176 + b * 26, 22, { scale: 1, fallbackW: 16, fallbackH: 16, fallbackColor: '#7ee787' })
    if (ob.stacks > 1) text(ctx, 'x' + ob.stacks, 176 + b * 26 + 11, 39, 11, '#ffffff', 'center', true)
    bx = 176 + b * 26
  }
  /* 自动瞄准/FPS */
  if (g.autoAim) text(ctx, '辅助瞄准', W - 94, 152, 11, 'rgba(200,220,255,0.55)', 'center')
  if (g.settings && g.settings.showFps) text(ctx, 'FPS:' + (g.fps || 0), 10, g.viewH - 8, 11, '#7ee787')
}

function drawWeaponSlots(g, ctx, x, y) {
  var p = g.player
  for (var i = 0; i < 2; i++) {
    var w = p.weapons[i]
    var sx = x + i * 156
    var active = p.activeSlot === i
    pxRect(ctx, sx, y, 148, 40, 'rgba(5,7,12,0.78)')
    pxRect(ctx, sx, y, 148, 2, active ? '#ffd93d' : 'rgba(120,120,140,0.5)')
    if (!w) {
      text(ctx, '空', sx + 8, y + 25, 13, 'rgba(160,160,180,0.6)')
      continue
    }
    var color = RARITY[w.def.rarity] ? RARITY[w.def.rarity].color : '#c8ccd4'
    drawSprite(ctx, w.def.sprite, sx + 30, y + 32, { scale: 2, fallbackW: 18, fallbackH: 10, fallbackColor: color })
    text(ctx, w.def.name, sx + 48, y + 17, 13, color, 'left', true)
    var extra = '能' + (w.def.energy || 0) + ' 伤' + (w.def.dmg || 0)
    text(ctx, extra, sx + 48, y + 33, 11, 'rgba(200,200,220,0.8)')
    if (active) text(ctx, '使用中', sx + 104, y + 17, 11, '#ffd93d')
  }
}

function drawMinimap(g, ctx, x, y) {
  if (!g.floorData) return
  var cells = 5
  var size = 10
  var gap = 2
  pxRect(ctx, x - 4, y - 4, cells * (size + gap) + 4, cells * (size + gap) + 4, 'rgba(5,7,12,0.65)')
  var rooms = g.floorData.rooms
  for (var key in rooms) {
    if (!Object.prototype.hasOwnProperty.call(rooms, key)) continue
    var r = rooms[key]
    if (!r.visited) continue
    var cxp = x + r.gx * (size + gap)
    var cyp = y + r.gy * (size + gap)
    var col = 'rgba(120,130,150,0.75)'
    if (r.type === ROOM.boss.id) col = '#e5484d'
    else if (r.type === ROOM.shop.id) col = '#ffd93d'
    else if (r.type === ROOM.treasure.id) col = '#c8a24a'
    else if (r.type === ROOM.statue.id) col = '#4dd0e1'
    else if (r.cleared) col = 'rgba(126,231,135,0.7)'
    if (r.type === ROOM.start.id) col = '#4a7dff'
    pxRect(ctx, cxp, cyp, size, size, col)
    if (r.current) {
      pxRect(ctx, cxp - 1, cyp - 1, size + 2, 1, '#ffffff')
      pxRect(ctx, cxp - 1, cyp + size, size + 2, 1, '#ffffff')
      pxRect(ctx, cxp - 1, cyp - 1, 1, size + 2, '#ffffff')
      pxRect(ctx, cxp + size, cyp - 1, 1, size + 2, '#ffffff')
    }
  }
}

function drawFloorIntro(g, ctx) {
  var W = g.viewW
  var H = g.viewH
  var intro = g.state === 'floor_intro' && g.run ? {
    chapter: g.run.chapter,
    chapterName: g.run.chapterName,
    floor: g.run.floorIndex,
    floorInChapter: g.run.floorInChapter
  } : null
  if (!intro) return
  var k = Math.min(1, g.stateT / 0.22)
  ctx.globalAlpha = 0.82 * k
  pxRect(ctx, 0, 0, W, H, '#05070c')
  ctx.globalAlpha = 1
  var title = intro.chapterName
  var sub = '第 ' + intro.chapter + ' 章 · 第 ' + intro.floorInChapter + ' 层'
  text(ctx, title, W / 2, H / 2 - 18, 40, '#ffd93d', 'center', true)
  text(ctx, sub, W / 2, H / 2 + 20, 18, '#e8e8f0', 'center')
  text(ctx, '清空房间 → 打开门 → 击败首领 → 三选一天赋', W / 2, H / 2 + 48, 12, 'rgba(200,210,235,0.7)', 'center')
}
