# 笔上元气骑士

有道词典笔上的 **2D 俯视像素地牢射击**，对标《元气骑士》（Soul Knight）的核心玩法，基于 **Falcon / POSC 小程序运行时**（Vue 2 SFC 子集 + Canvas 2D + QuickJS）开发。

当前版本：**0.1.0**（`ui/package.json`，首个开发版）
APPID：`8001865309001001`
还原度自评：**94.75 / 100**（60 项加权，目标 ≥90；自动化证据口径，未做真机验证，详见 [docs/还原度验收.md](docs/还原度验收.md)）

> 本项目是**学习交流用的同人练习作**，与《元气骑士》开发商凉屋游戏（ChillyRoom）无关；全部美术与音频均为自绘/程序生成，不含原作素材。详见文末免责声明。

---

## 简介

带一名角色进入地牢，逐房间清怪、开箱、逛商店，击败 Boss 后三选一天赋，一路打到第 6 层终局 Boss；死亡可用宝石复活，结算获得宝石用于解锁新角色与永久升级。

核心循环：

```
大厅选角 / 升级 → 进入地牢 → 逐房间清怪 / 开箱 / 商店 → Boss → 三选一天赋 → 下一层
→ 第 6 层终局 Boss → 结算（宝石 / 成就 / 记录）→ 回大厅继续成长
```

当前内容量（已从代码核对，详见 [docs/GDD.md](docs/GDD.md)）：

- **8 名角色**，每人 1 个主动技能（骑士/游侠/法师/精灵/工程师/刺客/炼金术士/圣骑士）
- **43 把武器**，10 大类、6 档品质，支持单发/散射/连发/近战扇形/光束
- **3 章 × 2 层 = 6 层地牢**，每层 6～8 个房间，随机生成且同种子可复现
- **18 种普通敌人 + 4 个 Boss**（第 6 层终局 Boss「暗黑骑士」）
- **33 个天赋**（局内三选一）、商店 / 宝箱 / 雕像 / 传送门
- 金币（局内）+ 宝石（局外）双经济，8 角色解锁与 6 项永久升级；**新档赠送 300 宝石**
- 死亡宝石复活（费用随层数递增）、结算、25 个成就、图鉴、本地最佳记录
- 像素美术：123 个精灵 key、151 个包内资源（123 图标 + 8 立绘 + 20 音频）；音频：17 个音效 + 3 首循环 BGM

> 功能完成度与证据以 [docs/还原度验收.md](docs/还原度验收.md) 为准；未实现/未验证项会明确扣分，不虚报。

---

## 目录

```text
ui/                    客户端源码（Vue 2 SFC 子集 + Canvas 2D + QuickJS）
  src/app.js           应用入口（setViewPort、全局状态、日志、音效）
  src/pages/           6 个页面：index / game / result / characters / codex / settings
  src/services/        存档、屏幕、音频、日志、原生模块
  src/services/game/   游戏数据与引擎（constants/rng/palette + 数据 + engine/combat/render/skills）
  src/res/version.js   构建生成物（禁止手改）
  assets/              程序生成的图片与音频（portraits/icons/sounds）
  scripts/             测试脚本（test-*.mjs、run-all.mjs、test-loader.mjs）
scripts/               构建 / 打包 / 版本生成（Node 24 ESM）
tools/                 精灵 PNG / 音频生成、静态检查器
native/                三平台原生库（源码与物料）
rk/ cvis/ rka/         各平台构建产物（.amr）
docs/                  文档（含 还原度验收、GDD、立项书、技术规范、美术审查图）
```

---

## 构建

环境要求：

- **Node.js 24**（跑 `scripts/*.mjs` 构建编排与工具）
- **Node.js 16**（只用于 `aiot-vue-cli` 打包步骤；Node 17+ 会报 `No such module: http_parser`）
- pnpm（依赖 `ui/pnpm-lock.yaml` 已锁定）

### 1. 安装依赖（可选，`ui/node_modules` 已存在时跳过）

`<node>` / `<pnpm.mjs>` 用 DSH 自带运行时：

```powershell
node C:\Users\wangh\.dsh\dsh-runtimes\dsh-next-primary-runtime\dependencies\node\bin\node.exe C:\Users\wangh\.dsh\dsh-runtimes\dsh-next-primary-runtime\dependencies\pnpm\bin\pnpm.mjs --store-dir D:\wangshibo\pnpm-store -C ui install --frozen-lockfile
```

### 2. 打包（项目根执行）

```powershell
# Node 16 只用于 aiot-cli 这一步，其余脚本用 Node 24
$env:PATH="D:\wangshibo\tools\node-v16.20.2-win-x64;$env:PATH"
$env:PNPM_CMD='cd /d "D:\wangshibo\project1\笔上元气骑士\ui" && "D:\wangshibo\tools\node-v16.20.2-win-x64\node.exe" "node_modules\aiot-vue-cli\src\cli.js" -c -q -p'

# 只打 rk 单包（最快自测）
node scripts/build-amr.mjs --targets rk

# 三平台单包
node scripts/build-amr.mjs

# 发版（自动递增 patch）
node scripts/build-amr.mjs --release
```

产物：

- `rk/8001865309001001.<version>-rk.amr`
- `cvis/8001865309001001.<version>-cvis.amr`
- `rka/8001865309001001.<version>-rka.amr`

当前构建状态（2026-10-26 15:31 最终版）：

| 平台 | 产物 | 体积 | 构建时间 | 状态 |
|---|---|---|---|---|
| rk | `rk/8001865309001001.0_1_0-rk.amr` | 2,962,005 B | 15:31:13 | 已出包，未真机 |
| cvis | `cvis/8001865309001001.0_1_0-cvis.amr` | 3,830,157 B | 15:31:18 | 已出包，未真机 |
| rka | `rka/8001865309001001.0_1_0-rka.amr` | 1,893,488 B | 15:31:24 | 已出包，未真机 |

- 包内：151 个 `assets/` 条目（123 图标 + 8 立绘 + 20 音频），`libs/` rk 4 个 / cvis、rka 各 3 个，`app.js.bin` 约 226 KB；
- 三包均通过 zip 完整性 + manifest cert（size/md5）校验；
- contact-sheet 与大厅背景已移出安装包（放在 `docs/art-contact-sheet.png`、`docs/art-lobby-bg.png`）；
- 三平台均**未做真机安装验证**。

说明：

- 构建脚本会自动重写 `ui/src/res/version.js`（版本/APPID/clib/platform/updateDir），结束后恢复 rk 默认值；
  当前 `updateDir=/userdisk/BiShangSoulKnightUpdate`（已从旧项目目录名改为本作目录）；
- `ui/libs/` 是构建暂存目录，**不要手改**；
- 组合包（`--merge`）需要 zig（`../_ref/zig/z/zig.exe`），当前工作区没有 `_ref/`，组合包构建会失败；单包不受影响。

---

## 测试

```powershell
cd ui
node --import ./scripts/test-loader.mjs scripts/test-content.mjs
node --import ./scripts/test-loader.mjs scripts/test-dungeon.mjs
node --import ./scripts/test-loader.mjs scripts/test-engine.mjs
node --import ./scripts/test-loader.mjs scripts/test-save.mjs
node --import ./scripts/test-loader.mjs scripts/test-screen.mjs
node --import ./scripts/test-loader.mjs scripts/run-all.mjs
```

当前结果（2026-10-26 实测）：

```
全量测试 (5 个文件)
  OK   test-content.mjs   6541 通过, 0 失败
  OK   test-dungeon.mjs   1152 通过, 0 失败
  OK   test-engine.mjs     220 通过, 0 失败
  OK   test-save.mjs        33 通过, 0 失败
  OK   test-screen.mjs      22 通过, 0 失败
合计: 7968 通过, 0 失败（exit 0）
```

静态检查（改完 `ui/src` 后至少跑）：

```powershell
cd 项目根
node tools/_check_modules.mjs          # 29/29 模块可加载，0 语法错误
node tools/check-undefined-calls.mjs   # 未发现未定义调用
node tools/check-exports.mjs           # 全部 import/export 一致
node tools/check-css-classes.mjs       # 6 页无缺失样式
node tools/check-vshow-null.mjs        # 5 页无风险
node tools/check-underscore-data.mjs   # 0 处（已清零）
node tools/check-tap-dedupe.mjs        # 强校验通过
```

> 当前 9 项静态检查全部通过（含 duplicate-imports / template-scope）。

---

## 平台

| 平台 | 设备代号 | 架构 | C 库 | 库物料 | 构建状态 |
|---|---|---|---|---|---|
| rk | y02-1 / orange | arm64 | glibc | `native/libs/arm64-y02-1/` | 已出包（未真机） |
| cvis | coco / plum | armv7 | glibc | `native/libs/arm-coco/` | 已出包（未真机） |
| rka | y09 / y09p | armv7 | uClibc | `native/libs/arm-y09/` | 已出包（未真机） |

- 逻辑宽固定 **960**，逻辑高按设备物理比例换算（约 240～576）；
- 最低/最高适配见 [docs/屏幕适配.md](docs/屏幕适配.md)；
- 三平台真机验证状态以还原度表为准（当前**无真机验证**）。

---

## 文档

| 文档 | 内容 |
|---|---|
| [docs/架构与接口.md](docs/架构与接口.md) | 模块契约、数据格式、引擎 API、文件归属（**并行开发唯一接口来源**） |
| [docs/立项书.md](docs/立项书.md) | 背景、目标、范围/非目标、里程碑、验收标准、风险与版权 |
| [docs/GDD.md](docs/GDD.md) | 玩法设计：角色/武器/地牢/敌人/天赋/经济/HUD |
| [docs/开发规范.md](docs/开发规范.md) | ES5/Canvas/页面/存档/构建/测试/文件归属 |
| [docs/屏幕适配.md](docs/屏幕适配.md) | 960 + pageH 换算、vw/vh、canvas 物理像素、设备矩阵 |
| [docs/还原度验收.md](docs/还原度验收.md) | 60 项加权检查表、当前自评 94.75、真机待验清单 |
| [docs/技术规范/](docs/技术规范/) | 继承自三角洲摸金模拟器的 5 篇技术规范（开发/适配/组合包/更新/官方对齐） |
| [CHANGELOG.md](CHANGELOG.md) | 版本变更记录 |

---

## 说明（免责声明）

1. 本项目为**个人学习交流用的同人练习作**，与《元气骑士》开发商凉屋游戏（ChillyRoom）**无任何关联**，未获授权或认可。
2. 全部美术素材为本项目**自绘或程序生成**的像素图；全部音频由脚本**程序合成**；不包含任何原作素材。
3. 角色名、武器名与玩法机制属于对同类玩法的学习与致敬，不主张相关知识产权；若权利人认为存在侵权，请联系删除并停止分发。
4. 本项目**不用于商业用途**，不设内购、广告或付费下载。
5. 安装第三方应用存在风险，本项目不对设备损坏或数据丢失负责。
