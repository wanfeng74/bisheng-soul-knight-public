/*
 * 笔上元气骑士 — 应用入口。
 *
 * 运行时红线（继承自已验证的三角洲摸金模拟器项目）：
 *   1. 页面上下文没有 window / document / require，不要依赖浏览器 API。
 *   2. 是否熄屏/切后台由应用级 onHide/onShow 写 $falcon.__gameHidden，
 *      游戏循环必须直接查这个标记（真机页面级 onHide/onShow 不一定触发）。
 *   3. 逻辑宽固定 960，逻辑高按设备物理短边/长边换算，页面布局用 vw/vh。
 *   4. 页面生命周期逻辑必须独立 try/catch，避免一处失败中断整条链路。
 */
import { BasePage } from './base-page.js'
import { startLogger, logInfo, logError } from './services/logger.js'
import { loadSoundSetting, bgmStop } from './services/sound.js'
import { screenInfo } from './services/screen.js'

const DESIGN_WIDTH = 960

function _envBrief() {
  try {
    var e = $falcon.env || {}
    return 'platform=' + e.platform + ' model=' + e.deviceModel +
           ' screen=' + e.deviceWidth + 'x' + e.deviceHeight +
           ' fw=' + e.version + ' theme=' + (e.custom && e.custom.theme)
  } catch (err) { return '(env 读取失败)' }
}

class App extends $falcon.App {
  constructor() {
    super()
  }

  onLaunch(options) {
    super.onLaunch(options)
    /* 全局状态：游戏页与结算页通过 $falcon.__game* 传递，不写 window */
    try {
      $falcon.__gameHidden = false
      $falcon.__gameDb = null
      $falcon.__gameRun = null
      $falcon.__gameResult = null
      $falcon.__gameEntryNotice = ''
    } catch (e0) {}

    /* 960 逻辑宽映射到设备物理宽 */
    try { this.setViewPort(DESIGN_WIDTH) } catch (eV) {}
    try { $falcon.useDefaultBasePageClass(BasePage) } catch (eB) {}

    try {
      startLogger()
      logInfo('app launch, ' + _envBrief())
      var s = screenInfo()
      logInfo('[screen] logical=' + s.logicalWidth + 'x' + s.logicalHeight +
        ' physical=' + s.physical.w + 'x' + s.physical.h + ' source=' + s.source)
    } catch (e) {
      try { logError('logger init failed: ' + (e && e.message)) } catch (e2) {}
    }

    try { loadSoundSetting() } catch (eSnd) {}
  }

  onShow() {
    super.onShow()
    try { $falcon.__gameHidden = false } catch (e0) {}
    try { logInfo('app show') } catch (e) {}
  }

  onHide() {
    try { bgmStop() } catch (eBgm) {}
    super.onHide()
    try { $falcon.__gameHidden = true } catch (e0) {}
    try { logInfo('app hide') } catch (e) {}
  }

  onDestroy() {
    super.onDestroy()
    try { logInfo('app destroy') } catch (e) {}
  }
}

export default App
