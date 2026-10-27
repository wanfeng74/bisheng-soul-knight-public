/*
 * 可复现随机数（mulberry32）。
 * 地牢生成、掉落、商店都用同一套，种子来自 startRun，方便测试复现。
 */
export function makeRng(seed) {
  var s = (Number(seed) || 1) >>> 0
  return function () {
    s = (s + 0x6D2B79F5) >>> 0
    var t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function rint(rng, min, max) {
  if (max <= min) return min
  return min + Math.floor(rng() * (max - min + 1))
}

export function rfloat(rng, min, max) {
  return min + rng() * (max - min)
}

export function chance(rng, p) {
  return rng() < p
}

export function pick(rng, arr) {
  if (!arr || !arr.length) return null
  return arr[Math.floor(rng() * arr.length)]
}

export function shuffle(rng, arr) {
  var out = arr.slice(0)
  for (var i = out.length - 1; i > 0; i--) {
    var j = Math.floor(rng() * (i + 1))
    var t = out[i]
    out[i] = out[j]
    out[j] = t
  }
  return out
}

/* 按权重抽取: items = [[value, weight], ...] */
export function weighted(rng, items) {
  var total = 0
  var i
  for (i = 0; i < items.length; i++) total += items[i][1]
  if (total <= 0) return null
  var r = rng() * total
  for (i = 0; i < items.length; i++) {
    r -= items[i][1]
    if (r <= 0) return items[i][0]
  }
  return items[items.length - 1][0]
}
