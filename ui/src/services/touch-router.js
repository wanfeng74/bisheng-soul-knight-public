/*
 * 游戏触控路由器: 按触点真实 id 做手指归属 (机制同 pencraft)。
 * start 时触点按坐标判定角色并登记到 owners(id->role); move/end 只按 id 维护,
 * 各手指独立, 互不干扰。角色:
 *   move   = 摇杆区 (持续, 动态中心)
 *   fire   = 射击 (按住)
 *   sprint = 奔跑 (按住)
 *   点按类 = reload/interact/bandage/autoaim/bag/pause (start 触发一次)
 * handlers 回调:
 *   moveStart(x,y) / move(x,y) / moveEnd()
 *   fireStart()/fireEnd() / sprintStart()/sprintEnd()
 *   tap(role) / resetTouch()
 */

function contains(point, rect) {
  if (!rect) return false
  return point.x >= rect.left && point.y >= rect.top &&
    point.x < rect.left + rect.width && point.y < rect.top + rect.height
}

/* 触点坐标 -> 角色。layout 由页面按实际渲染提供 */
function roleAt(point, layout) {
  /* 固定按钮优先 (均在摇杆区之外, 互不重叠) */
  if (contains(point, layout.fire)) return 'fire'

  if (contains(point, layout.reload)) return 'reload'
  if (contains(point, layout.interact)) return 'interact'
  if (contains(point, layout.bandage)) return 'bandage'
  if (contains(point, layout.sprint)) return 'sprint'
  if (contains(point, layout.gadget0)) return 'gadget0'
  if (contains(point, layout.gadget1)) return 'gadget1'
  if (contains(point, layout.autoaim)) return 'autoaim'
  if (contains(point, layout.bag)) return 'bag'
  if (contains(point, layout.pause)) return 'pause'
  if (contains(point, layout.moveZone)) return 'move'
  return null
}

function createTouchRouter(layout, handlers) {
  handlers = handlers || {}
  var owners = {}          // id -> role
  var moveId = -1

  function has(id) { return Object.prototype.hasOwnProperty.call(owners, id) }

  function releaseRole(id, role) {
    if (role === 'move') {
      moveId = -1
      if (handlers.moveEnd) handlers.moveEnd()
    } else if (role === 'fire') {
      if (handlers.fireEnd) handlers.fireEnd()
    } else if (role === 'sprint') {
      if (handlers.sprintEnd) handlers.sprintEnd()
    }
  }

  function remove(id) {
    if (!has(id)) return
    var role = owners[id]
    delete owners[id]
    releaseRole(id, role)
  }

  function reset() {
    var ids = []
    for (var k in owners) ids.push(k)
    owners = {}
    moveId = -1
    if (handlers.resetTouch) handlers.resetTouch()
  }

  /* 接收合成 touch 事件: {type, touches, changedTouches} */
  function accept(event) {
    if (!event) return
    if (event.type === 'cancel') { reset(); return }
    var touches = event.touches || []
    var current = {}
    for (var i = 0; i < touches.length; i++) current[touches[i].id] = touches[i]
    /* 清理已不存在的归属 */
    var gone = []
    for (var id in owners) { if (!current[id]) gone.push(id) }
    for (var g = 0; g < gone.length; g++) remove(gone[g])

    if (event.type === 'start') {
      var added = event.changedTouches && event.changedTouches.length ? event.changedTouches : touches
      for (var a = 0; a < added.length; a++) {
        var p = added[a]
        if (!p || has(p.id)) continue
        var role = roleAt(p, layout)
        if (!role) continue
        owners[p.id] = role
        if (role === 'move') {
          if (moveId < 0) {
            moveId = p.id
            if (handlers.moveStart) handlers.moveStart(p.x, p.y)
          }
        } else if (role === 'fire') {
          if (handlers.fireStart) handlers.fireStart()
        } else if (role === 'sprint') {
          if (handlers.sprintStart) handlers.sprintStart()
        } else {
          if (handlers.tap) handlers.tap(role)
        }
      }
    } else if (event.type === 'move') {
      if (moveId >= 0 && current[moveId] && handlers.move) {
        handlers.move(current[moveId].x, current[moveId].y)
      }
    }
    /* end 由开头 current 对比统一处理移除/释放 */
  }

  return { accept: accept, reset: reset }
}

export { roleAt, createTouchRouter }
