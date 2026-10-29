/*
 * 测试环境的 panet 桩。
 *
 * 真机上 panet 由 libjsapi_panet.so 提供; Node 里没有这个模块, 所以测试用
 * 解析钩子 (panet-hooks.mjs) 把裸模块名映射到这里, 默认导出 null。
 * 各测试用例会通过 globalThis.require / resetNative() 自行注入期望行为,
 * 所以这里保持"存在但为空"即可。
 */
export default null
export const TwoFinger = null
