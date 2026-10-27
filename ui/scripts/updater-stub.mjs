/* 测试环境的 updater 桩 (libjsapi_updater.so 的替身)。
 *
 * 真机上这个模块由原生库提供:
 *     download(url, path) -> 0 成功 / 非 0 失败
 *     install(amrPath)    -> 0 成功 / 非 0 失败
 *     start(appid)        -> 0 成功 / 非 0 失败
 *     cliPath             -> 字符串常量
 *
 * Node 里没有原生库, 所以测试用解析钩子 (panet-hooks.mjs) 把裸模块名
 * 'updater' 映射到这里。默认导出 null, 表示"模块不可用" —— 测试用例可以
 * 自行注入来模拟"模块可用"的情况。
 *
 * 【为什么默认是 null】真实世界里有些平台 (cvia) 确实没有这个模块,
 * 默认走"不可用"分支能保证降级路径被测到。
 */
export default null
