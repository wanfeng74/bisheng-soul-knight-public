/*
 * Node 解析钩子: 把平台原生模块名映射到测试桩。
 *
 * 背景: native.js 里 `import PanetModule from 'panet'` 是【必须】的 ——
 * 只有静态 import 才会被构建器 (falcon-module 插件) 标成 external 并写进
 * app.js.bin 的模块依赖头; 用 require('panet') 的话运行时根本没有 require,
 * 真机上 panet 永远加载不到 (实测 sn 读不出来就是这个原因)。
 * 但 Node 不认识裸模块名 'panet' / 'Eric' / 'updater', 测试会直接 ERR_MODULE_NOT_FOUND,
 * 所以测试运行时挂上这个钩子把它指到桩文件。
 *
 * 用法: node --import ./scripts/test-loader.mjs scripts/xxx.mjs
 * 注意: 只在测试里用, 打包完全不受影响 (构建器走自己的解析)。
 */
export async function resolve(specifier, context, next) {
  if (specifier === 'panet' || specifier === 'Eric' || specifier === 'twofinger' || specifier === 'updater') {
    return { url: new URL('./panet-stub.mjs', import.meta.url).href, shortCircuit: true }
  }
  return next(specifier, context)
}
