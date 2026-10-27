# tools/ — 项目工具链

这些都是**持续使用**的工具（每次改代码或发版都会跑），不是一次性脚本。
全部从脚本自身位置推导路径，clone 到任何目录都能直接运行。

需要 Node.js 18+。运行方式一律在 `tools/` 目录下：

```bash
cd tools
node check-undefined-calls.mjs
```

---

## 静态检查器

改完代码先跑这一组。它们专抓**语法正确但运行时会炸**的问题 ——
这些在浏览器里点不出来，在设备上表现为白屏或卡死。

| 脚本 | 抓什么 |
|---|---|
| `_check_modules.mjs` | 真实 `import` 每个模块，抓 ESM 语法错误（`node --check` 抓不到跨文件问题） |
| `check-exports.mjs` | 每个 `import` 的符号在目标模块里是否真的导出了 |
| `check-undefined-calls.mjs` | 调用了但没导入/没声明的标识符 |
| `check-duplicate-imports.mjs` | 重复 import / 重复声明（真机上直接 `already been declared`） |
| `check-unhandled-promises.mjs` | 调了异步原生方法却没接拒绝 → 真机崩页 |
| `check-alias-refs.mjs` | `import { X as Y }` 之后仍用旧名 `X` |
| `check-vshow-null.mjs` | `v-show="obj && obj.x"` 这类对 `null` 取属性的写法 |
| `selftest_vshow_null.mjs` | 上面那个检查器自身的自检（确认它真能区分 `v-if`/`v-show`） |
| `check-underscore-data.mjs` | 对 `data()` 里 `_` 开头字段做 `++` / `--` / `+=`（Vue 2 不代理，恒为 NaN） |
| `check-css-classes.mjs` | 模板静态 `class` 在本文件/全局样式里是否真有定义（动态 `:class` 跳过） |
| `check-tap-dedupe.mjs` | 绑在 `@touchstart` 且会改持久数据/调 `$forceUpdate()` 的方法必须做点击去重 |
| `_check_vue_deep.mjs` | 编译所有页面模板 |
| `_check_template_scope.mjs` | 模板里引用的标识符是否都有定义 |
| `_check_ui_text.mjs` | 玩家可见文案规范 |
| `_check_null_deref.mjs` / `_check_shadowing.mjs` / `_audit_collisions.mjs` | 空引用、变量遮蔽、`import` 符号与组件选项键重名 |

> 目录内实际为 **16 个检查器 + 1 个自检 + 生成/校验/发布/真机脚本**；
> 新增检查器时同步补进上表，并像 `selftest_vshow_null.mjs` 一样写自检。

> 写检查器时**必须同时写自检**：`check-unhandled-promises.mjs` 最初把
> 后面的 `return r` 误判成「已处理」，漏报了真实缺陷；`_check_modules.mjs`
> 也曾经把一切非 SyntaxError 的加载失败都算通过，等于没检查。

---

## 地图

| 脚本 | 用途 |
|---|---|
| `gen-map.mjs` | 结构化生成地图 + 校验（宽高一致、字符合法、四周封闭、全图连通）。手写 120×30 的字符网格极易出错，务必用它生成 |

输出 `tools/_map_out.txt`，随后替换 `ui/src/services/game/maps.js` 里对应的数组。

---

## 产物校验

| 脚本 | 用途 |
|---|---|
| `_verify_119.mjs` | 检查打包出来的 `.amr` 里该有的标记/字符串是否都在（防止构建静默漏文件） |
| `_scan_bin.mjs` / `_ctx_bin.mjs` / `_raw_bin.mjs` / `_strings_bin.mjs` | 扫 QuickJS 字节码（`app.js.bin`）。注意里面的字符串是**混合编码**：ASCII 原子 8 位、中文 UTF-16LE，必须按字节搜 |
| `_elf_arch.mjs` / `_so_symbols.mjs` / `_so_ctx.mjs` / `_so_api.mjs` | 判断 `.so` 的架构、导出符号与可用 API（例如确认 `libjsapi_panet.so` 到底是 aarch64 还是 arm32） |

> 2026-10-19 官方规范对齐重构后，包内 `libs/` 布局有两种：
> **单包**是平铺 `libs/*.so`（rk：panet/Eric/twofinger/updater；cvis/rka：bridge/updater）；
> **按家族组合包**是 `libs/<架构>-<代号>/` 子目录（根目录无平铺 so）。
> 校验脚本按这两种形态分别看；AMR 本身仍是 ZIP（`pk` 头，直接 `unzip -l` 或 Python `zipfile` 均可）。

---

## 构建/打包脚本（不在 tools/，在项目 `scripts/`）

这些是 2026-10-19 重构新增/改写的构建工具，用法与目录约定见
[`../docs/组合包打包.md`](../docs/组合包打包.md) 与 `node scripts/build-amr.mjs --help`：

| 脚本 | 用途 |
|---|---|
| `scripts/profiles.mjs` | 官方设备代号 profile 表（rk/cvis/rka → 架构/CLIB/ISCVI/库目录） |
| `scripts/gen-ui-version.mjs` | 生成 `ui/src/res/version.js`（`--target/--out/--verify`） |
| `scripts/native-mods-content.mjs` | 生成 `ui/src/services/native-mods.js`（rk/cvis/rka/merged 四目标） |
| `scripts/stage-libs.mjs` | `ui/libs/` 暂存：`--target` 单包平铺 / `--merge-family <家族>`（`--merge <家族>` 别名）家族组合包代号目录 / `--merge-cross` 跨家族实验 |
| `scripts/elf-strip.mjs` | zig `objcopy --strip-all`（组合包 bridge 用，源库不动） |
| `scripts/build-amr.mjs` | 整盒打包主脚本（`--targets/--merge` 家族组合包/`--merge-cross` 实验/`--release/--stage/--verify/--skip-so-check`） |

---

## 真机验证（Windows PowerShell）

词典笔的触摸**没法用自带 `send_event` 注入** —— 那个工具是工厂测试用的，
`touch press x y` 只发压力和 `BTN_TOUCH`，**不发坐标**（`evtest` 实测确认）。
所以这里改成直接往 `/dev/input/event4` 写 `struct input_event` 二进制。

已验证的坐标映射：

```
面板 ABS_MT_POSITION_X: 0..279    ABS_MT_POSITION_Y: 0..935
屏幕 936x280，与面板是 90° 旋转 + X 轴镜像：
    panel_x = screen_y
    panel_y = 935 - screen_x
```

| 脚本 | 用途 |
|---|---|
| `probe-touch.ps1` | 探测哪些事件码能被驱动放行（一次性验证用，结论：全部放行） |
| `mk_tap.ps1` | 生成某屏幕坐标的按下/抬起事件对并推到设备 |
| `tap.ps1` | 点一下（内部调用同样的构造逻辑） |
| `key.ps1` | 注入物理按键（`KEY_W`/`KEY_UP`/`KEY_POWER` 等） |

> **坑**：事件列表必须用**平行的扁平数组**。写成嵌套的
> `@(@(3,47,0), @(3,57,1), ...)` 会被 PowerShell 展平，
> 静默生成错误的事件 —— 这正是最初误判「坐标被内核丢弃」的原因。

设备侧配套命令：

```bash
adb shell send_event rk8xx_pwrkey press      # 电源键是「切换」式的，不是单纯熄屏
adb shell cat /tmp/.screen_state             # screen_on=0/1，判断熄屏最可靠
adb shell miniapp_cli capture /tmp/a.png     # 截图
adb shell miniapp_cli install /tmp/x.amr     # 安装
```

---

## 发布

| 脚本 | 用途 |
|---|---|
| `_push_all.mjs` | 通过 GitHub API 推送（不需要本地 git 仓库）。提交信息自动取版本号，正文可用 `CHANGELOG_FILE` 从更新公告里抓对应小节 |

> **版本号来源已变**：2026-10-19 重构后版本唯一入口是 `ui/package.json`，
> `ui/src/services/version.js` 变成 re-export 兼容层（不再有 `APP_VERSION = '...'` 字面量）。
> `_push_all.mjs` 的 `_appVersion()` 先按旧正则读 `services/version.js`、读不到会**自动回落到
> `ui/package.json` 的 `version`**，所以推送仍然可用；后续如要清理，可把它改成直接读
> `ui/package.json` 或构建生成的 `ui/src/res/version.js`（注意 `res/version.js` 是生成物，
> 本地未构建时可能不存在）。

```bash
# Windows
$env:GH_TOKEN='...'; $env:CHANGELOG_FILE='..\CHANGELOG.md'; node _push_all.mjs
```

> 提交信息以前是**写死**的，从 v1.1.13 到 v1.1.43 每次推送都是同一句话，
> git 历史完全没有信息量。现已改为按版本号生成。
