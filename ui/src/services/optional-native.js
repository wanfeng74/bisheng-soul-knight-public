/*
 * 可选原生模块加载器。
 *
 * 依据: native-twofinger.js 已验证 —— 普通 .js 模块【函数体内】的 require
 * 不会进 app.js.bin 的 requires 头, 模块缺失时抛错也能被 catch 住,
 * 所以可以作为「组合包里运行时才知道有没有该模块」的加载手段。
 *
 * 用途: 组合包 (merged) 下同一个包要跑 rk / cvis / rka 多家族设备,
 * 而 panet / Eric 只在部分家族存在。生成的 native-mods.js 里
 * getPanet() / getEricShell() 首次调用时走这里做运行时加载并缓存结果;
 * 单包构建仍然用静态 import, 不经过这里。
 *
 * 红线: 只允许在普通 .js 模块的函数体内 require; .vue 的 script 里
 * 写 require 会被构建器静态提升成 chunk 顶层 import, 缺少 .so 时整页黑屏。
 */

export function tryRequire(name) {
  try {
    if (typeof require === 'function') {
      var m = require(name)
      return m || null
    }
  } catch (e) {}
  return null
}
