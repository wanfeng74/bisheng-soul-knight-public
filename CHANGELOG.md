# 更新日志

本文件记录《笔上元气骑士》的版本变更。格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号语义化。

> 说明：本仓库早期曾用于「三角洲摸金模拟器」，旧项目的更新记录不属于本作，已由本文件替换。

---

## v0.1.0（2026-10-26，首个开发版）

首个可构建、可自动化验证的开发版本：核心玩法闭环（大厅 → 6 层地牢 → 结算 → 成长）已打通，6 个页面、43 把武器、33 个天赋、18 种敌人与 4 个 Boss 均已落地；**三平台单包均已构建并通过包完整性校验，但尚未做真机验证**。当前还原度自评 **94.75 / 100**（目标 ≥90，自动化证据口径），详见 [docs/还原度验收.md](docs/还原度验收.md)。

### 新增 — 工程底座

- 应用入口 `ui/src/app.js`：`setViewPort(960)`、`$falcon.__game*` 全局状态、应用级 `onShow/onHide` 写 `$falcon.__gameHidden`、启动日志（含 `[screen]` 诊断行）。
- 页面基类 `ui/src/base-page.js`：统一托管 `$falcon.on` 事件与 `setTimeout/setInterval`，页面卸载统一释放。
- 屏幕适配 `ui/src/services/screen.js`：`env → window → document → 960×266` 兜底读取，逻辑高按物理短边/长边换算；`screenInfo()/pageSize()/screenText()` 供日志与页面使用；`touch-map.js` 负责物理像素 → 逻辑坐标换算。
- 存档 `ui/src/services/save.js`：单存档（`sk_save_v1`）整体读写；兼容 `jsapi-storage / jsapi-item / native / localStorage`，全部失败退内存；`normalize()` 修复坏档；字段含宝石、解锁角色、角色升级、成就、统计、设置、最佳记录。
- 音频 `ui/src/services/sound.js`：经 `updater.audio` 播放安装包内 WAV；17 个 SFX + 3 首循环 BGM（lobby/dungeon/boss）；节流 + 无原生能力时静默降级。
- 日志 `ui/src/services/logger.js`：按原生写文件 → panet → `jsapi.storage` → 内存逐级降级，日志落盘便于远程排障。
- 构建链 `scripts/`（Node 24）：`build-amr.mjs`（三平台单包 / 家族组合包 / 暂存 / 发版递增）、`profiles.mjs`（rk/cvis/rka profile）、`gen-ui-version.mjs`（版本文件生成）、`stage-libs.mjs`、`elf-strip.mjs`、`native-mods-content.mjs`。
- 三平台 profile：rk=arm64/glibc（y02-1/orange）、cvis=armv7/glibc（coco/plum）、rka=armv7/uClibc（y09/y09p）；`ui/package.json` 版本 `0.1.0`、APPID `8001865309001001`、QuickJS 20200705、单 JS 包。
- 15 个静态检查器（`tools/`）：模块可加载、未定义调用、导出对齐、CSS 类、v-show-null、模板作用域、未处理 Promise、重复 import 等。

### 新增 — 游戏数据

- `constants.js`：设计分辨率 960×266、瓦片 32、角色/交互/磁吸范围、护甲回复（延迟 4.0s / 用时 2.2s）、能量回复 2/s、6 档品质、4 种元素、3 章 6 层配置、7 种房间类型、经济常量（每房间 1 宝石 / 每层 5 / 每 Boss 20 / 通关 50 / 初始 300）、复活费用 `5 + 层数×2`。
- `characters.js`：**8 名角色**（骑士/游侠/法师/精灵/工程师/刺客/炼金术士/圣骑士），属性、技能 id、起始武器、解锁费 0～3000；`charStats()` 折算 6 项升级。
- `weapons.js`：**43 把武器**、10 大类、6 档品质、5 种 pattern；伤害 2～16、射速 0.12～1.10、耗能 0～5，含 11 把元素武器；`rollWeapon/rollShopWeapons/weaponPower`。
- `buffs.js`：**33 个天赋**、22 种 effect type、叠层 1～4；`rollBuffs` 不重复/不超层。
- `loot.js`：6 种拾取物、房间奖励、宝箱掉落（普通/金）、商店货架与价格、回收价 45%。
- `meta.js`：**25 个成就**、6 项升级费用、`applyRunResult`（统计/宝石/成就/记录/saveAt）、`progressOf`（返回 0～target 绝对值）。
- `enemies.js`：**18 种普通敌人**（每章 6 种、9 种 behavior）、**4 个 Boss**（哥布林酋长/沙海女王/冰霜女王/暗黑骑士，含 phaseAt/patterns/routine）、`spawnWave/eliteScale/floorBoss`。
- `dungeon.js`：5×5 网格、每层 8～10 房间、房间 28～40 × 9～13 瓦片、门双向对应、全连通、同 seed 可复现。

### 新增 — 引擎与玩法

- `engine.js`：状态机（`floor_intro/playing/buff_choice/shop/revive/paused/ended`）、6 层推进、房间切换/开门、传送门、天赋三选一、商店、雕像、复活、结算、`getHud()`（28 个字段）、小地图数据。
- `combat.js`：移动/碰撞、自动瞄准（460px）、暴击、5 种射击模式、近战扇形、穿透/弹射/连锁/爆炸、元素状态（火/冰/毒/雷）、护甲/能量回复、受击无敌、击退、震屏、掉落拾取、死亡处理。
- `render.js`：Canvas 2D 像素绘制（受限指令集）、角色/敌人/Boss/武器/道具、HUD（生命/护甲/能量/金币/宝石/楼层/Boss 血条/小地图/武器槽/天赋图标/FPS）、特效与伤害数字。
- `skills.js`：8 个职业技能全部实现（双持/翻滚/奥术飞弹/箭雨/炮台/影袭/毒瓶/圣盾）。
- `sprites/`：`entities.js`（角色/敌人/Boss）+ `world.js`（武器/拾取/道具/UI）+ `index.js` 合并查询，共 **123 个精灵 key**。

### 新增 — 页面

- 大厅 `pages/index`：宝石、角色立绘/属性/技能/起始武器、开始冒险、角色/图鉴/设置入口、最佳记录。
- 角色 `pages/characters`：8 角色卡片、解锁扣宝石、6 项升级面板（等级/费用/+）。
- 对局 `pages/game`：canvas + 摇杆 + 开火/技能/换枪/交互/暂停 + 暂停/天赋/商店/复活弹窗 + 主循环 + 结算跳转与写档。
- 图鉴 `pages/codex`：武器/敌人/成就三 tab、品质色、成就进度。
- 设置 `pages/settings`：音效/自动瞄准/震屏/FPS 开关、重置存档二次确认、关于（版本/平台/屏幕/存储/日志）。
- 结算 `pages/result`：胜负、统计、宝石、新纪录、新成就、再来一局/回大厅。

### 新增 — 美术与音频资源

- `tools/gen-sprites-png.mjs`：Node 24 纯 JS + zlib 生成 PNG——**8 张角色立绘、123 张图标、全量 contact-sheet、128×128 应用图标**；contact-sheet 与大厅背景放在 `docs/art-*.png`，**不打进安装包**。
- `tools/gen-audio.py`：Python + numpy 合成 **20 个 WAV**（17 个 SFX + 3 首 BGM），合计约 1.78MB（< 2.5MB 上限）。

### 新增 — 测试与构建

- `ui/scripts/test-content.mjs`：6541 条断言（角色/武器/天赋/掉落/成长/ES5 红线）。
- `ui/scripts/test-dungeon.mjs`：1152 条断言（尺寸/字符集/连通/门/种子/9 层）。
- `ui/scripts/test-engine.mjs`：**220 条断言**（8 技能实际效果、43 武器发射、宝箱/商店/雕像、4 Boss 全招式+半血阶段、元素+DoT、精英数值、磁吸、木箱破坏、护甲回复、自动瞄准、6 层胜利、复活、结算字段、每帧渲染无异常）。
- `ui/scripts/test-save.mjs`：33 条断言（多后端探测/normalize 坏档/写入读取往返/reset/坏 JSON/无后端降级）。
- `ui/scripts/test-screen.mjs`：22 条断言（936×280→287、800×480→576、竖屏、异常值、来源优先级）。
- `run-all.mjs` + `test-loader.mjs`：全量测试入口，当前 **7968 通过 / 0 失败**；9 项静态检查全部通过。
- 构建产物（2026-10-26 15:31 最终版，版本 0.1.0 / appid 8001865309001001）：
  - `rk/8001865309001001.0_1_0-rk.amr` 2,962,005 B（156 条 + 4 libs：Eric/panet/twofinger/updater）
  - `cvis/8001865309001001.0_1_0-cvis.amr` 3,830,157 B（3 libs：bridge/twofinger/updater）
  - `rka/8001865309001001.0_1_0-rka.amr` 1,893,488 B（3 libs：bridge/twofinger/updater）
  - 三包 zip 完整性 + manifest cert（size/md5）通过；包内 151 个 assets、`app.js.bin` 约 226 KB。

### 变更

- `updateDir` 从旧项目目录改为本作目录：`/userdisk/BiShangSoulKnightUpdate`（`scripts/gen-ui-version.mjs`）。
- 新档初始宝石统一：`save.defaultSave().gems = constants.START_GEMS = 300`。
- 包内清理：contact-sheet / lobby_bg 移出到 `docs/`，旧 `assets/icon.png` 删除。

### 已知限制

- **无真机验证**：所有平台适配、手感、音效播放、存储写入、切后台恢复均未在词典笔上确认；三包均未真机安装启动。
- 战斗手感/难度曲线仍是设计值，需要在真机上试玩后调参。
- 组合包构建需要 `../_ref/zig/z/zig.exe`，当前工作区无 `_ref/`，只支持单包构建。
- `ui/src/res/version.js` 为构建生成物，当前值为 `0.1.0 / 100 / 8001865309001001 / updateDir=/userdisk/BiShangSoulKnightUpdate`（rk 默认）。
- 还原度自评 **94.75 / 100**（自动化证据口径，已达 ≥90）；真机待验清单见 [docs/还原度验收.md](docs/还原度验收.md) 第四节。
