/*
 * 双指触控控制器 (evdev 直读方案) —— 按上游 yunchu-buchu/twofinger-jsapi 适配器移植。
 *
 * 上游 js/twofinger.js 是 ES6 写法；本项目跑 QuickJS 20200705，只能吃 ES5
 * （禁用箭头函数 / let / const / 模板字符串 / 默认参数 / 解构 / includes），
 * 所以这里逐段等价改写，行为与上游 v2 对齐：
 *   - mapTouch: axisRanges 覆盖、严格轴校验、flip + 0/90/180/270 旋转、返回归一化坐标
 *   - createTwoFinger: start 后校验坐标、poll 严格校验、gesture 手势事件、
 *     listener 异常上报、native 实例租约、dispose 后禁用
 *
 * 机制: 不依赖 Falcon DOM touch (identifier 恒为 0), 通过 native TwoFinger 直接
 * 打开 /dev/input/eventN，轮询 evdev Type-B 原始帧（真实 tracking id），归一化
 * 坐标并合成标准 touch 事件。
 */

var _leases = []

function _hasLease(native) {
  for (var i = 0; i < _leases.length; i++) {
    if (_leases[i] === native) return true
  }
  return false
}

function _addLease(native) {
  if (!_hasLease(native)) _leases.push(native)
}

function _delLease(native) {
  for (var i = _leases.length - 1; i >= 0; i--) {
    if (_leases[i] === native) _leases.splice(i, 1)
  }
}

function _finite(value) {
  return typeof value === 'number' && isFinite(value)
}

function _integer(value) {
  return typeof value === 'number' && isFinite(value) && value === Math.floor(value)
}

function _clamp(value) {
  return value < 0 ? 0 : (value > 1 ? 1 : value)
}

/* 原始触点 -> 页面坐标。device: {x:{min,max}, y:{min,max}}; options 见 createTwoFinger */
export function mapTouch(touch, device, options) {
  options = options || {}
  device = options.axisRanges || device
  if (!device || !device.x || !device.y ||
      !(device.x.max > device.x.min) || !(device.y.max > device.y.min)) {
    throw new Error('Invalid touch axis ranges')
  }
  if (!touch || !_finite(touch.x) || !_finite(touch.y) || !_integer(touch.id)) {
    throw new Error('Invalid touch point')
  }
  var rotation = options.rotation == null ? 0 : options.rotation
  var width = options.width == null ? 1 : options.width
  var height = options.height == null ? 1 : options.height
  if ((rotation !== 0 && rotation !== 90 && rotation !== 180 && rotation !== 270) ||
      !_finite(width) || !_finite(height) || width <= 0 || height <= 0) {
    throw new Error('Invalid coordinate transform')
  }
  var x = _clamp((touch.x - device.x.min) / (device.x.max - device.x.min))
  var y = _clamp((touch.y - device.y.min) / (device.y.max - device.y.min))
  if (options.flipX) x = 1 - x
  if (options.flipY) y = 1 - y
  var oldX = x
  if (rotation === 90) { x = 1 - y; y = oldX }
  else if (rotation === 180) { x = 1 - x; y = 1 - y }
  else if (rotation === 270) { x = y; y = 1 - oldX }
  return { id: touch.id, x: x * width, y: y * height,
           normalizedX: x, normalizedY: y, rawX: touch.x, rawY: touch.y }
}

/* 创建控制器。nativeOrConstructor: TwoFinger 构造器或实例; options:
   { width, height, rotation, flipX, flipY, interval, maxEvents, axisRanges }
   scheduler: 仅供测试注入 { setTimeout, clearTimeout }。 */
export function createTwoFinger(nativeOrConstructor, options, scheduler) {
  options = options || {}
  scheduler = scheduler || {}
  var native = typeof nativeOrConstructor === 'function' ? new nativeOrConstructor() : nativeOrConstructor
  if (!native || typeof native.start !== 'function' || typeof native.stop !== 'function' ||
      typeof native.poll !== 'function' || typeof native.status !== 'function' ||
      typeof native.listDevices !== 'function') {
    throw new Error('Expected a TwoFinger native class or instance')
  }
  var interval = options.interval == null ? 16 : options.interval
  if (!_integer(interval) || interval < 8 || interval > 1000) {
    throw new Error('interval must be 8..1000 ms')
  }
  /* 启动前先校验一次坐标变换参数（上游同样的防御） */
  mapTouch({ id: 0, x: 0, y: 0 }, { x: { min: 0, max: 1 }, y: { min: 0, max: 1 } }, options)

  var later = scheduler.setTimeout || setTimeout
  var clear = scheduler.clearTimeout || clearTimeout
  var listeners = {}
  var timer = null
  var epoch = 0
  var running = false
  var disposed = false
  var device = null
  var previous = []
  var gesture = null

  function notify(name, event) {
    var list = listeners[name] || []
    var handlers = list.slice()
    for (var i = 0; i < handlers.length; i++) {
      try {
        handlers[i](event)
      } catch (error) {
        if (name !== 'error') {
          var catchers = (listeners.error || []).slice()
          for (var j = 0; j < catchers.length; j++) {
            try {
              catchers[j]({ code: 'LISTENER_ERROR', message: String((error && error.message) || error) })
            } catch (ignored) {}
          }
        }
      }
    }
  }

  function reset(reason) {
    var old = previous
    var hadGesture = gesture !== null
    previous = []
    gesture = null
    if (old.length) notify('touch', { type: 'cancel', touches: [], changedTouches: old, reason: reason })
    if (hadGesture) notify('gesture', { type: 'cancel', reason: reason })
  }

  function stop(reason) {
    reason = reason || 'stopped'
    var owned = running
    running = false
    epoch++
    if (timer !== null) clear(timer)
    timer = null
    try {
      if (owned) native.stop()
    } finally {
      if (owned) _delLease(native)
      reset(reason)
    }
  }

  function findById(points, id) {
    for (var i = 0; i < points.length; i++) {
      if (points[i].id === id) return points[i]
    }
    return null
  }

  function feed(frame, token) {
    if (frame.phase === 'cancel' || frame.overflow) {
      reset(frame.reason || 'cancel')
      return
    }
    var raw = frame.touches || []
    var points = []
    for (var i = 0; i < raw.length; i++) {
      points.push(mapTouch(raw[i], device, options))
    }
    points.sort(function (a, b) { return a.id - b.id })
    if (points.length > 2) throw new Error('Invalid native touch frame')
    var seen = {}
    for (var s = 0; s < points.length; s++) {
      if (seen[points[s].id]) throw new Error('Invalid native touch frame')
      seen[points[s].id] = true
    }
    var old = previous
    var removed = []
    var added = []
    var moved = []
    for (var oi = 0; oi < old.length; oi++) {
      if (!findById(points, old[oi].id)) removed.push(old[oi])
    }
    for (var ni = 0; ni < points.length; ni++) {
      var prev = findById(old, points[ni].id)
      if (!prev) added.push(points[ni])
      else if (prev.x !== points[ni].x || prev.y !== points[ni].y) moved.push(points[ni])
    }
    previous = points
    if (removed.length) notify('touch', { type: 'end', seq: frame.seq, touches: points, changedTouches: removed })
    if (epoch !== token) return
    if (added.length) notify('touch', { type: 'start', seq: frame.seq, touches: points, changedTouches: added })
    if (epoch !== token) return
    if (moved.length) notify('touch', { type: 'move', seq: frame.seq, touches: points, changedTouches: moved })
    if (epoch !== token) return

    var ids = []
    for (var k = 0; k < points.length; k++) ids.push(points[k].id)
    var idKey = ids.join(':')
    if (gesture && (points.length !== 2 || gesture.ids !== idKey)) {
      var ended = gesture
      gesture = null
      notify('gesture', { type: 'end', ids: ended.ids })
      if (epoch !== token) return
    }
    if (points.length !== 2) return
    var dx = points[1].x - points[0].x
    var dy = points[1].y - points[0].y
    var distance = Math.sqrt(dx * dx + dy * dy)
    var angle = Math.atan2(dy, dx)
    var center = { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 }
    var starting = !gesture
    if (!gesture) {
      gesture = { ids: idKey, distance: distance > 0 ? distance : null, angle: angle,
                  lastAngle: angle, rotation: 0, center: center }
    }
    var delta = angle - gesture.lastAngle
    while (delta > Math.PI) delta -= Math.PI * 2
    while (delta < -Math.PI) delta += Math.PI * 2
    gesture.rotation += delta
    gesture.lastAngle = angle
    if (gesture.distance === null && distance > 0) gesture.distance = distance
    notify('gesture', {
      type: starting ? 'start' : 'change',
      touches: points,
      center: center,
      distance: distance,
      scale: gesture.distance ? distance / gesture.distance : 1,
      rotation: gesture.rotation * 180 / Math.PI,
      translation: { x: center.x - gesture.center.x, y: center.y - gesture.center.y },
    })
  }

  function poll(token) {
    timer = null
    if (!running || token !== epoch) return
    try {
      var result = native.poll()
      if (result.device) device = result.device
      if (!result.frames || typeof result.frames.length !== 'number' || result.frames.length > 256) {
        throw new Error('Invalid native poll response')
      }
      for (var i = 0; i < result.frames.length; i++) {
        if (!running || token !== epoch) return
        feed(result.frames[i], token)
      }
      if (!running || token !== epoch) return
      if (!result.running || result.error) {
        stop(result.error || 'disconnected')
        notify('error', { code: 'NATIVE_STOPPED', message: result.error || 'Touch device stopped' })
        return
      }
    } catch (error) {
      stop('error')
      notify('error', { code: 'POLL_ERROR', message: String((error && error.message) || error) })
      return
    }
    if (running && token === epoch) {
      timer = later(function () { poll(token) }, interval)
    }
  }

  return {
    on: function (name, handler) {
      if (disposed) throw new Error('TwoFinger controller disposed')
      if ((name !== 'touch' && name !== 'gesture' && name !== 'error') || typeof handler !== 'function') {
        throw new Error('Invalid event listener')
      }
      if (!listeners[name]) listeners[name] = []
      var list = listeners[name]
      if (list.indexOf(handler) < 0) list.push(handler)
      return function () {
        var index = list.indexOf(handler)
        if (index >= 0) list.splice(index, 1)
      }
    },
    listDevices: function () {
      if (disposed) throw new Error('TwoFinger controller disposed')
      return native.listDevices()
    },
    start: function (path) {
      if (disposed) throw new Error('TwoFinger controller disposed')
      if (typeof path !== 'string' || !/^\/dev\/input\/event\d{1,4}$/.test(path)) {
        throw new Error('Expected an explicit /dev/input/eventN path')
      }
      if (running) stop('restarted')
      if (_hasLease(native)) throw new Error('Native instance already used by another controller')
      _addLease(native)
      try {
        var status = native.start({ path: path, maxEvents: options.maxEvents == null ? 256 : options.maxEvents })
        if (!status.running || !status.device) throw new Error(status.error || 'Touch device did not start')
        device = status.device
        mapTouch({ id: 0, x: device.x.min, y: device.y.min }, device, options)
        running = true
        var token = ++epoch
        timer = later(function () { poll(token) }, interval)
        return status
      } catch (error) {
        _delLease(native)
        try { native.stop() } catch (ignored) {}
        throw error
      }
    },
    stop: stop,
    status: function () {
      return { running: running, disposed: disposed, device: device, native: native.status() }
    },
    /* 兼容旧调用方（game.vue 的熄屏恢复逻辑用 device() 拿 path） */
    device: function () { return device },
    isRunning: function () { return running },
    dispose: function () {
      if (disposed) return
      disposed = true
      try {
        stop('disposed')
      } finally {
        for (var key in listeners) {
          if (Object.prototype.hasOwnProperty.call(listeners, key)) listeners[key] = []
        }
      }
    },
  }
}
