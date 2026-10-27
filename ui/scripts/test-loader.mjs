/* 测试入口: 先注册原生模块解析钩子, 再跑测试。
   用法: node --import ./scripts/test-loader.mjs scripts/test-xxx.mjs */
import { register } from 'node:module'
register('./panet-hooks.mjs', import.meta.url)
