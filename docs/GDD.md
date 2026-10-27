# 笔上元气骑士 · 游戏设计文档（GDD）

> 版本：v0.1（2026-10-26）
> 本文描述**设计目标与当前数据实现**。所有数值标注了代码来源，可直接核对；
> 未实现/未验证的部分会标注「建设中」「待真机验证」，实现状态以 [还原度验收.md](还原度验收.md) 为准。
> 数据来源：`ui/src/services/game/{constants,characters,weapons,buffs,loot,meta,enemies,dungeon,skills,engine,combat}.js`。

---

## 1. 核心循环

```
┌──────────── 大厅 ────────────┐
│ 选角色 / 解锁 / 6 项升级      │
│ 看最佳记录 / 图鉴 / 设置      │
└──────────────┬───────────────┘
               │ 开始冒险（$falcon.navTo('game')，带 characterId + seed）
               ▼
┌──────────── 地牢（6 层） ──────────────────────────────┐
│ 层介绍 1.25s → 进入入口房                              │
│ 逐房间：清怪 → 开门 → 宝箱/商店/雕像/精英 → Boss       │
│ Boss 死后：传送门 + 天赋三选一                          │
│ 传送门 → 下一层（第 6 层为终局 Boss）                   │
└──────────────┬─────────────────────────────────────────┘
               │ 死亡（可宝石复活一次）或通关
               ▼
┌──────────── 结算 ────────────┐
│ 胜负 / 统计 / 宝石 / 新纪录   │
│ 成就解锁 / 再来一局 / 回大厅  │
└──────────────┬───────────────┘
               └──► 回大厅继续成长
```

- 单局 6 层、每层 6～8 个房间；设计时长 6～10 分钟（待真机验证）。
- 局内成长：金币、武器、天赋、护甲/能量回复。
- 局外成长：宝石、角色解锁、6 项永久升级、成就、图鉴。
- 引擎状态机（`engine.js`）：`idle / playing / floor_intro / buff_choice / shop / revive / paused / ended`。

---

## 2. 大厅

实现：`ui/src/pages/index/index.vue`（已实现）；数据来自 `save.load()` 与 `characters.charStats()`。

### 2.1 布局

| 区域 | 内容 |
|---|---|
| 顶部 | 标题「笔上元气骑士」、宝石数量、音效开关、版本号 |
| 左侧 | 当前角色立绘（`assets/portraits/<id>.png`，缺失时用职业首字占位）、名字、称号、简介 |
| 左侧 | 属性面板：生命 / 护甲 / 能量 / 暴击 / 移速 / 技能冷却 |
| 左侧 | 技能卡：技能名、描述、冷却秒数 |
| 左侧 | 起始武器名称与品质色 |
| 中部/底部 | 「开始冒险」大按钮 |
| 入口 | 角色 / 图鉴 / 设置 三个入口 |
| 记录 | 最佳层数、最佳房间、累计击杀、累计宝石等 |

### 2.2 行为

- 打开大厅时 `load()` 存档，读取 `lastChar`（默认 `knight`）；切换角色后写回 `lastChar` 并 `save(db)`。
- 点「开始冒险」：`$falcon.navTo('game', {})`，`game.vue` 生成新 seed（或复用 `$falcon.__gameRun.seed`）。
- 宝石数量实时显示 `db.gems`；无存档/坏档时 `normalize()` 兜底为默认档。
- 背景 BGM：`bgmPlay('lobby', ...)`（音频资源就绪后生效；当前资源缺失会静默降级）。

---

## 3. 角色系统

实现：`characters.js`（8 名，数据已就绪）；技能实现：`skills.js`。

### 3.1 角色总表

| id | 名称 | 称号 | 生命 | 护甲 | 能量 | 暴击% | 移速 | 起始武器 | 技能 | 冷却 | 解锁宝石 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `knight` | 骑士 | 双持剑士 | 7 | 6 | 140 | 5 | 1.00 | `pistol` 旧式手枪 | 双持 | 12s | 0 |
| `rogue` | 游侠 | 疾风浪人 | 6 | 4 | 180 | 10 | 1.12 | `dagger` 匕首 | 翻滚 | 6s | 500 |
| `wizard` | 法师 | 元素学者 | 5 | 4 | 220 | 7 | 0.98 | `apprentice_staff` 学徒法杖 | 奥术飞弹 | 8s | 800 |
| `elf` | 精灵 | 林间射手 | 6 | 5 | 180 | 8 | 1.02 | `short_bow` 短弓 | 箭雨 | 12s | 1200 |
| `engineer` | 工程师 | 机械师 | 7 | 7 | 160 | 4 | 0.96 | `smg` 旧式冲锋枪 | 炮台 | 18s | 1500 |
| `assassin` | 刺客 | 暗影行者 | 5 | 3 | 190 | 15 | 1.15 | `dagger` 匕首 | 影袭 | 7s | 2000 |
| `alchemist` | 炼金术士 | 药剂师 | 6 | 5 | 200 | 6 | 1.00 | `apprentice_staff` 学徒法杖 | 毒瓶 | 10s | 2500 |
| `paladin` | 圣骑士 | 圣光守卫 | 9 | 9 | 120 | 3 | 0.90 | `rusty_blade` 锈蚀短剑 | 圣盾 | 16s | 3000 |

- 角色差异 = 五项基础属性 + 技能 + 起始武器；不做职业专属被动。
- 基础值区间（`characters.js` 头注释）：生命 5～9、护甲 3～9、能量 120～220、暴击 3%～15%、移速 0.90～1.15 倍（`PLAYER_SPEED = 158 px/s` 为基准）。

### 3.2 技能实现（`skills.js`，8/8 已实现）

| 技能 id | 角色 | 实际效果（代码） |
|---|---|---|
| `dual_wield` | 骑士 | 生成第二把相同武器并进入**双持 6 秒**（`p.dualWieldT = 6`），射速提升；无第二槽时自动创建 |
| `roll` | 游侠 | 向移动/瞄准方向翻滚 **0.34 秒**，速度 **760 px/s**，无敌 **0.55 秒**，拖尾粒子 |
| `arcane_bolt` | 法师 | 锁定 460px 内最近敌人，链式闪电最多 **4 个目标**（初始 + 3 跳），每跳 6 点伤害、元素雷、可连锁 240px |
| `arrow_rain` | 精灵 | 以最近敌人（或瞄准方向 180px 处）为圆心，半径 **150px** 内 8 段箭雨，每段 4 点伤害 |
| `turret` | 工程师 | 在面前 34px 处放置自动炮台，持续 **10 秒**，自动射击附近敌人；落点被墙阻挡时放在脚下 |
| `shadow_strike` | 刺客 | 瞬移到 420px 内最近敌人身后 26px，造成 9 点**必定暴击**伤害并短暂无敌 0.5 秒 |
| `poison_flask` | 炼金术士 | 朝最近敌人抛出毒瓶（速度 420、爆炸半径 76），落点形成持续毒雾，4 点基础伤害 + 中毒 |
| `holy_shield` | 圣骑士 | 无敌 **2.2 秒**，回复 2 点生命，护甲回满，并对贴身敌人造成灼烧（视觉/音效反馈） |

> 释放成功才进入冷却：`engine.pressSkill()` 里 `castSkill()` 返回 true 后才写 `skillCd`；
> 冷却 = 角色技能 CD × `skillCdMul`（升级减 CD，最低 0.6）。

### 3.3 永久升级（局外，`meta.js`）

| 项 | id | 每级效果 | 上限 | 基础费用 |
|---|---|---|---|---|
| 生命 | `hp` | 生命上限 +1 | 5 | 45 宝石 |
| 护甲 | `armor` | 护甲上限 +1 | 5 | 50 |
| 能量 | `energy` | 能量上限 +20 | 5 | 35 |
| 暴击 | `crit` | 暴击率 +3% | 5 | 60 |
| 移速 | `speed` | 移速 +3% | 5 | 55 |
| 冷却 | `skill` | 技能冷却 -8% | 5 | 75 |

- 费用公式：`round(base × (1 + 0.55 × 当前等级) / 5) × 5`，满级返回 0（UI 显示已满）。
- 例：生命从 1 级升 2 级 = 70 宝石、2→3 = 95、3→4 = 120、4→5 = 145（已核对 `meta.upgradeCost`）。
- 全部角色同价；`charStats(id, upgrades)` 输出 `maxHp/maxArmor/maxEnergy/crit/speed/skillCdMul`，引擎开局读取。

---

## 4. 武器系统

实现：`weapons.js`（43 把，数据已就绪）；开火/近战/弹道：`combat.js`；绘制：`render.js`。

### 4.1 分类与数量（10 类，共 43 把）

| 类别 | 数量 | 代表武器 | 伤害区间 | 射速区间（秒/发） | 耗能区间 |
|---|---|---|---|---|---|
| 手枪 gun | 3 | 旧式手枪、六发左轮、沙漠之鹰 | 3～7 | 0.30～0.50 | 1～2 |
| 霰弹 shotgun | 2 | 铁砂霰弹枪、双管猎枪 | 3～6 | 0.66～0.75 | 2～3 |
| 冲锋枪 smg | 3 | 旧式冲锋枪、微型冲锋枪、加特林 | 2～4 | 0.12～0.15 | 1 |
| 步枪 rifle | 3 | 猎枪、突击步枪、AK 步枪 | 5～6 | 0.22～0.70 | 1～2 |
| 狙击 sniper | 2 | 电磁狙击枪、苍穹狙击枪 | 12～16 | 0.95～1.05 | 4 |
| 发射器 launcher | 3 | 火箭筒、榴弹发射器、龙息火箭筒 | 8～12 | 0.90～1.10 | 3～5 |
| 法杖 staff | 7 | 学徒法杖、火焰/寒冰/剧毒/雷霆法杖、虚空法杖、陨星法杖 | 3～10 | 0.48～0.80 | 2～5 |
| 弓 bow | 4 | 短弓、十字弩、复合弓、长弓 | 4～12 | 0.55～0.72 | 1～3 |
| 近战 melee | 9 | 锈蚀短剑、匕首、长矛、武士刀、骑士长剑、战锤、巨斧、光剑、太阳神剑 | 4～16 | 0.34～0.68 | 0（不耗能） |
| 特殊 special | 7 | 泡泡枪、雪球枪、金币枪、回旋镖、火焰喷射器、等离子炮、激光枪 | 2～7 | 0.12～0.55 | 1～3 |

**数值边界**（`weapons.js` 全表核对）：伤害 **2～16**、射速 **0.12～1.10 秒/发**、耗能 **0～5**；带元素武器 11 把（火/冰/毒/雷）。

### 4.2 品质（6 档，`constants.RARITY`）

| 品质 | id | 颜色 | 数量 | 说明 |
|---|---|---|---|---|
| 普通 | `common` | `#c8ccd4` | 8 | 起始/低层掉落 |
| 精良 | `good` | `#7ee787` | 8 | 1～3 层常见 |
| 稀有 | `rare` | `#4fc3f7` | 8 | 中期主力 |
| 史诗 | `epic` | `#d580ff` | 8 | 4～7 层 |
| 传说 | `legend` | `#ffd93d` | 7 | 高层/金箱 |
| 神话 | `mythic` | `#ff6b35` | 4 | Boss/金箱稀有 |

### 4.3 射击模式（`pattern`，5 种全部有实现）

| pattern | 语义 | 数量 |
|---|---|---|
| `single` | 单发直线弹 | 25 |
| `spread` | 多弹丸扇形散射（`projectiles` + `spread`） | 7 |
| `burst` | 连发（`burst` 发、`burstGap` 间隔） | 1（AK 步枪） |
| `arc` | 近战扇形（`arc` 弧度、`meleeRange` 范围） | 9 |
| `beam` | 即时光束（命中判定沿射线） | 1（激光枪） |

其他字段：`pierce` 穿透、`bounce` 弹射、`chain` 连锁、`explodeRadius` 爆炸、`critBonus` 暴击加成、`knockback` 击退、`element` 元素。

### 4.4 武器获取与价格

- 起始武器（8 人）：`pistol / dagger / apprentice_staff / short_bow / smg / dagger / apprentice_staff / rusty_blade`（全部可在 WEAPONS 中查到）。
- 局内拾取：宝箱、商店、Boss 掉落（Boss 固定从 `sniper / rocket_launcher / great_sword / fire_staff / assault_rifle` 中随机 1 把）。
- 双武器槽：按「换枪」切换；新武器拾取会替换当前槽。
- 商店武器价格：`floor(8 + weaponPower × 3)`；出售价 = `floor(价格 × 0.45)`（最低 1 金币）。

---

## 5. 地牢

实现：`dungeon.js`（生成器）+ `engine.js`（房间/门/层推进）。

### 5.1 章节与层

| 章 | 楼层 | 主题 | 敌人池 | Boss | Boss 基础 HP |
|---|---|---|---|---|---|
| 1 森林遗迹 | 1～3 | forest | 史莱姆/哥布林/哥布林弓手/野猪/树精/蘑菇法师 | 哥布林酋长 `goblin_chief` | 420 |
| 2 沙海地宫 | 4～6 | desert | 沙蝎/木乃伊/沙匪/沙虫/火魔/沙石魔像 | 沙海女王 `sand_queen` | 560 |
| 3 霜寒王座 | 7～9 | ice | 冰史莱姆/冰狼/雪人/冰法师/霜蛛/水晶魔像 | 冰霜女王 `ice_queen` | 700 |
| — | 9（终局） | ice | — | 暗黑骑士 `dark_knight` | 1100 |

- 层数 `FLOOR_COUNT = 6`；第 2/4/6 层为章节 Boss/终局 Boss（`engine` 按 `floorInChapter` 进入 Boss 房）。
- **Boss 血量随层数缩放**：`HP × (1 + 0.18 × (floorIndex - 1))`。

### 5.2 楼层结构（`generateFloor`，已实测 6 层）

- 房间网格 **5×5**，`gridW = gridH = 5`；每层 **8～10 个房间**（实测 8/9/10 都有）。
- 房间尺寸：宽 **28～40** 瓦片、高 **9～13** 瓦片；瓦片 `TILE = 32`，四周 1 格墙。
- 必含：入口 `start` ×1、Boss `boss` ×1、商店 `shop` ×1、宝箱 `treasure` ×1。
- 可变：普通战斗 `battle`、精英 `elite`、雕像 `statue`（雕像房可替换部分战斗房；实测 1～2 个）。
- 连通性：所有房间可达；门在墙中央开 1 格，相邻房间门位对应；门在房间清空后才可通行。
- 障碍：内部随机放柱子 `O`、木箱 `c`、木桶 `b`、火把 `t`，不会堵死门与出生点。
- **种子可复现**：`seed` 由 `run.seed` 派生；同 seed 生成结果完全一致（已实测 6 层 `sameSeed = true`）。

### 5.3 房间类型（`constants.ROOM`）

| 类型 | id | 内容 | 清空条件 |
|---|---|---|---|
| 入口 | `start` | 玩家出生点 + 2~3 只初始敌人（第 4 层起 3 只） | 击杀全部 |
| 战斗 | `battle` | 一波敌人（数量随层数增加） | 击杀全部 |
| 精英 | `elite` | 战斗房 + 首个敌人精英化 | 击杀全部 |
| 宝箱 | `treasure` | 1 个宝箱（普通/金）+ 少量金币宝石 | 无强制战斗 |
| 商店 | `shop` | 商人 NPC（可交互打开商店） | 无强制战斗 |
| 雕像 | `statue` | 雕像（一次免费天赋三选一） | 无强制战斗 |
| 首领 | `boss` | 1 个 Boss | 击杀 Boss 后掉传送门 |

> 普通战斗房实测数量 2～6 个/层；精英房在高层（约 5 层起）出现。

---

## 6. 敌人与 Boss

实现：`enemies.js`（18 普通 + 4 Boss）；行为/弹幕：`combat.js`。

### 6.1 普通敌人（18 种，每章 6 种）

| 章 | id | 名称 | 行为 | HP | 速度 | 接触伤害 |
|---|---|---|---|---|---|---|
| 1 | `slime` | 史莱姆 | chase 追击 | 14 | 42 | 1 |
| 1 | `goblin` | 哥布林 | chase | 20 | 58 | 1 |
| 1 | `goblin_archer` | 哥布林弓手 | shoot 远程 | 16 | 44 | 1 |
| 1 | `boar` | 野猪 | charge 冲锋 | 30 | 48 | 2 |
| 1 | `treant` | 树精 | tank 坦克 | 52 | 26 | 2 |
| 1 | `mushroom_mage` | 蘑菇法师 | burst 连发 | 24 | 36 | 1 |
| 2 | `scorpion` | 沙蝎 | chase | 26 | 62 | 2 |
| 2 | `mummy` | 木乃伊 | chase | 44 | 34 | 2 |
| 2 | `bandit` | 沙匪 | strafe 走射 | 34 | 56 | 2 |
| 2 | `sand_worm` | 沙虫 | burrow 钻地 | 38 | 48 | 2 |
| 2 | `fire_imp` | 火魔 | flyer 飞行远程 | 28 | 66 | 1 |
| 2 | `sand_golem` | 沙石魔像 | tank | 72 | 28 | 2 |
| 3 | `ice_slime` | 冰史莱姆 | chase | 34 | 46 | 2 |
| 3 | `ice_wolf` | 冰狼 | charge | 42 | 78 | 2 |
| 3 | `snowman` | 雪人 | bomb 自爆/炸弹 | 46 | 40 | 2 |
| 3 | `ice_mage` | 冰法师 | shoot/burst | 38 | 42 | 2 |
| 3 | `frost_spider` | 霜蛛 | chase（高速） | 30 | 86 | 2 |
| 3 | `crystal_golem` | 水晶魔像 | tank | 95 | 30 | 3 |

- 敌人 HP 区间 14～95，随章节递增；`dmg` 为接触伤害，远程/炸弹按 `attack` 字段覆盖。
- 远程攻击统一字段：`{type:'shoot', cd, range, speed, dmg, count, spread, telegraph}`；`telegraph` 为前摇预警时间。
- 精英化（`eliteScale()`）：HP ×1.8、伤害 ×1.25、速度 ×1.05、金币 ×2.2（契约 §4.6）。

### 6.2 Boss（4 个）

| id | 名称 | 章 | 基础 HP | 速度 | 金币 | 宝石 | 弹幕招式 |
|---|---|---|---|---|---|---|---|
| `goblin_chief` | 哥布林酋长 | 1 | 420 | 52 | 40～60 | 12 | charge / radial / summon / aimed |
| `sand_queen` | 沙海女王 | 2 | 560 | 56 | 55～80 | 16 | 同上 |
| `ice_queen` | 冰霜女王 | 3 | 700 | 58 | 70～100 | 20 | 同上 |
| `dark_knight` | 暗黑骑士 | 3（第 6 层终局） | 1100 | 64 | 120～180 | 40 | 同上 |

- 阶段：`phaseAt = [1.0, 0.5]`（满血进入第一阶段，50% 血量进入第二阶段）；每阶段按 `routine` 轮换招式。
- 招式语义：
  - `charge`：前摇后直线冲锋；
  - `radial`：环形弹幕（数量/速度/伤害按配置）；
  - `summon`：召唤小怪；
  - `aimed`：朝玩家方向多发点射。
- Boss 死亡：清空房间 → 掉金币/宝石/武器 → 生成传送门 → 弹出天赋三选一 → 进入下一层。
- 第 6 层 Boss 死亡后使用传送门即通关（`outcome = 'victory'`）。

---

## 7. 天赋系统

实现：`buffs.js`（33 个，超过 24 的要求）。

### 7.1 获取方式

1. **Boss 战后**三选一（必出）；
2. **雕像房**交互，三选一（每座一次）；
3. **宝箱**有概率开出天赋（`chestLoot` 的 `kind:'buff'`）；
4. **商店**可购买 1 个天赋。

规则：`rollBuffs(rng, floorIndex, owned, count)` 不重复、不超 `maxStack`（1～4 层）；已满层不再出现。

### 7.2 天赋分类（33 个）

| 类别 | 天赋（id） | 效果 |
|---|---|---|
| 基础属性 | 生命上限 `max_hp`、护甲上限 `max_armor`、能量上限 `max_energy`、鹰眼 `eagle_eye` | 生命/护甲 +1、能量 +20、暴击 +5% |
| 攻击强化 | 力量强化 `power_up`、疾速射击 `rapid_fire`、远射 `long_shot`、穿透弹 `piercing_round`、弹射弹 `bouncing_round` | 伤害 +12%、射速 +12%、射程 +15%、穿透 +1、弹射 +1 |
| 元素附魔 | 烈焰 `fire_ench`、寒霜 `ice_ench`、剧毒 `poison_ench`、雷霆 `lightning_ench` | 武器附加对应元素 |
| 生存回复 | 吸血 `vampire`、收割 `reaper`、灵魂汲取 `soul_energy`、护甲再生 `armor_regen`、荆棘之甲 `thorns` | 吸血、击杀回血/回能、护甲再生、反伤 |
| 经济 | 贪婪 `greed`、宝石猎手 `gem_hunter`、讨价还价 `bargain`、磁力吸附 `magnet` | 金币/宝石加成、商店折扣、拾取范围 |
| 技能 | 技能急速 `quick_skill` | 技能冷却 -12% |
| 移速 | 疾风步 `wind_step` | 移速 +8% |
| 史诗/传说组合 | 狂战士 `berserker`、狙击本能 `sniper_instinct`、能量核心 `core_reactor`、弹幕风暴 `bullet_storm`、寻宝者 `treasure_seeker`、幸存者 `survivor`、堡垒 `fortress`、猎手 `hunter` | 双属性组合 |
| 传奇 | 不屈之魂 `second_life`（额外一次免费复活） | `reviveOnce` |

- 效果类型共 **22 种**：`maxHp / maxArmor / maxEnergy / crit / damagePct / fireRatePct / speedPct / rangePct / pierce / bounce / element / lifesteal / killHeal / killEnergy / coinBonusPct / gemBonusPct / shopDiscount / magnet / skillHastePct / armorRegenPct / reviveOnce / thorns`（与契约 §4.3 一致）。
- 引擎在 `_applyBuff` 中折算进 `game.mods`，实际参与伤害/射速/移速/掉落/商店价格计算。

---

## 8. 经济

### 8.1 双货币

| 货币 | 范围 | 获得 | 消耗 |
|---|---|---|---|
| 金币 coins | 局内，结算后清空 | 清房间掉落、宝箱、精英/Boss、出售武器 | 商店买武器/药水/天赋、治疗 |
| 宝石 gems | 永久（存档） | 结算发放、局内宝石拾取、Boss 宝石 | 角色解锁、6 项升级、复活 |

### 8.2 宝石结算（`constants.js` + `meta.applyRunResult`）

```
gemsEarned = 清理房间数 × 1
           + 到达层数 × 5
           + 击杀 Boss 数 × 20
           + 通关奖励 50（仅 victory）
           + 局内拾取宝石数
```

- 初始宝石：`constants.START_GEMS = 300`，`save.defaultSave().gems` 同为 300（**新档赠送 300 宝石**，已统一）。
- 金币计入 `lifetimeCoins`（永久统计），不折算成宝石。
- 复活消耗宝石：`reviveCost(floorIndex) = 5 + max(1, floorIndex) × 2` → 1 层 **7**、3 层 **11**、6 层 **17**。

### 8.3 局内金币掉落（`loot.roomReward`）

| 房间 | 金币 | 其他 |
|---|---|---|
| 战斗 | 2～4 + floor/2 | 18% 红药水 |
| 精英 | 6～10 + floor | 55% 1～2 宝石；35% 药水 |
| 宝箱房 | 4～8 + floor | 1～2 宝石 |
| Boss | 10～16 + floor×2 | 2～3 宝石；60% 红药水 |

### 8.4 商店价格

- 武器：`floor(8 + weaponPower × 3)`（例：laser_gun 39 金币，已实测）。
- 药水：基础价（红 18 / 蓝 15 / 生命之心 22）+ 章节溢价 + 层数溢价。
- 天赋：`40 + floor×6 + (chapter-1)×10`。
- 治疗：`6 + floor×2 + (chapter-1)×4`（回满生命与护甲）。
- 商店 4 层起摆 3 把武器，否则 2 把；药水固定 2 件 + 天赋 1 件 + 治疗 1 项（实测 6 个 offer）。

---

## 9. 商店 / 宝箱 / 雕像

### 9.1 商店

- 交互：靠近商人「交互」→ 打开商店弹窗（暂停战斗）；金币不足提示；可购买已售罄标记。
- 商品：武器 2～3、药水 2、天赋 1、治疗 1；购买后 `sold = true`，金币扣除。
- 折扣天赋 `bargain`（15%/层）按 `mods.shopDiscount` 生效。

### 9.2 宝箱

- 普通木箱 `chestLoot(rng, floor, false)`：
  - 32% 武器、15% 天赋、25% 药水、28% 金币（8～14 + floor×2）。
- 金宝箱（`gold = true`）：
  - 45% 武器（`rarityBoost +1`）、25% 天赋、15% 药水、15% 金币（翻倍）。
- 木箱/木桶可破坏（掉落少量金币）；宝箱需交互打开。

### 9.3 雕像

- 交互后免费三选一天赋（与 Boss 后同一套 `rollBuffs`）；每座只能使用一次（`used = true`）。
- 实测：交互 → `state = 'buff_choice'`，`buffOptions.length = 3`。

---

## 10. 死亡与宝石复活

实现：`engine._onPlayerDeath / revive / declineRevive`。

1. 玩家生命归零 → 播放失败音效 → 若本局尚未复活且宝石足够：
   - 状态切到 `revive`，弹窗显示费用与是否可负担；
   - 费用 = `5 + 层数 × 2`；
2. 选择复活：
   - 扣宝石（`hooks.onSpendGems` 由页面写档）；
   - 生命回复 50%（至少 1）、护甲/能量回满、无敌 **3 秒**、清除 360px 内敌弹；
   - `run.revives += 1`，`reviveUsed = true`；
3. 选择「接受失败」或宝石不足：本局结束（`outcome='dead'`），进入结算。
4. 天赋「不屈之魂」提供额外一次**免费**复活机会（`mods.reviveExtra`），走同一弹窗但费用 0。

---

## 11. 结算、成长与成就

### 11.1 结算输入（`onEndRun`）

```
outcome: 'victory' | 'dead' | 'abandon'
characterId, characterName, chapter, chapterName, floor, floorInChapter
roomsCleared, kills, bossKills, coins, gemsCollected, gemsEarned
durationMs, damageDealt, damageTaken, revives, weapons[], buffs[]
```

### 11.2 结算处理（`meta.applyRunResult`）

1. 累加 `stats`：runs/wins/deaths/kills/bossKills/revives/playMs/totalGems；
2. 发放宝石（优先 `gemsEarned`，缺失时按 §8.2 公式）；
3. 金币计入 `lifetimeCoins`；
4. 更新最佳层数/最佳房间，返回 `records`（是否新纪录 + 旧纪录）；
5. 遍历 25 个成就，满足条件写入 `achievements` 并返回 `newAchievements`；
6. 写 `saveAt`，由页面 `save(db)` 落盘（`game.vue` 已实现）。

### 11.3 成就（25 个，`meta.ACHIEVEMENTS`）

| 类别 | 成就 |
|---|---|
| 进程 | 初次踏入、破晓之光（首通）、森林深处（3 层）、沙海尽头（6 层）、三界尽头（6 层） |
| Boss | 首领克星（1）、猎首者（5）、万军之首（20） |
| 击杀 | 初露锋芒（50）、百人斩（200）、千人斩（1000） |
| 探索 | 探索者（单局 10 房）、迷宫行者（单局 30 房）、三界行者（踏足 3 章） |
| 通关 | 三度凯旋（3 胜）、常胜将军（10 胜）、不屈意志（无复活通关） |
| 财富 | 宝石收藏家（1000）、宝石大亨（5000）、金币猎手（500） |
| 时间/死亡 | 老练冒险者（1 小时）、屡败屡战（10 死）、向死而生（5 次复活） |
| 收集 | 八面玲珑（8 角色）、武器收藏家（15 武器） |

- 进度值由 `meta.progressOf(db, achId, result)` 返回 **0～target 的绝对值**（已解锁返回 target）；图鉴页按 `p / target` 换算百分比并显示「p / target」文本。

### 11.4 结算页 / 图鉴 / 设置（页面状态）

- 结算页 `pages/result/result.vue`：已实现（只读 `$falcon.__gameResult`，展示胜负/统计/宝石/新纪录/新成就；宝石与成就在 `game.vue` 中已写入存档）。
- 图鉴页 `pages/codex/codex.vue`：已实现武器/敌人/成就三 tab。
- 设置页 `pages/settings/settings.vue`：已实现音效/自动瞄准/震屏/FPS 开关、重置存档（二次确认）、关于信息。
- 以上页面均**未真机验证**。

---

## 12. 操作与 HUD

### 12.1 操作布局（`game.vue`，DOM 触摸层）

| 控件 | 位置 | 行为 |
|---|---|---|
| 摇杆区 | 左 42vw × 高 72vh，顶部 20vh | 按下出现摇杆，拖动输出 -1..1 方向；抬起归零 |
| 开火 | 右下最大按钮 | 点按切换「自动开火 / 停火」（默认开） |
| 技能 | 右下紫色按钮 | 显示技能名与剩余冷却；释放成功进入 CD |
| 换枪 | 右下小按钮 | 双武器槽切换 |
| 交互 | 底部中间 | 靠近宝箱/武器/商店/雕像/传送门时高亮并显示标签 |
| 暂停 | 右上 | 打开暂停面板：继续 / 辅助瞄准开关 / 放弃本局 |

- 手感参数（`constants.js`）：玩家半径 11、移速 158 px/s、受击无敌 0.6s、护甲回复延迟 4.0s / 用时 2.2s、能量回复 2/s、磁吸 92px、交互 54px。
- 自动瞄准：默认开，锁定 460px（× 射程加成）内最近敌人；暂停面板可切换并写入存档。
- 触摸坐标：物理像素 → 逻辑坐标换算（`touch-map.js`），X6P 类设备避免偏移。

### 12.2 HUD（`render.js`，canvas 绘制）

| 区域 | 内容 | 坐标/尺寸（逻辑 px） |
|---|---|---|
| 顶部背景条 | 半透明黑条 | 全宽 × 46 |
| 生命 | 红心，每行 12 颗 | 左上 (10,6) 起，12px |
| 护甲 | 蓝盾 | 红心下方 |
| 能量 | 青色条 + 数值 | 左侧，150×8 |
| 金币/宝石 | 图标 + 数字 | 右上 (W-178 / W-108) |
| 楼层 | 「章节名 章-层」 | 顶部居中 |
| Boss 血条 | 300px 红条 + 名字 | 顶部居中，仅 Boss 房 |
| 小地图 | 5×5 房间格：已访/当前/已清/类型色 | 右上 (W-92, 50) |
| 武器槽 | 2 格：图标/名称/品质色/耗能/伤害 | 左下 (10, H-44) |
| 天赋图标 | 最多 8 个 + 层数 | 顶部左侧 (176, 22) |
| 辅助瞄准/FPS | 文字提示 | 右侧 / 左下 |

### 12.3 音效 / BGM（`sound.js`）

- SFX 17 个：`shot / shot_heavy / hit / hurt / pickup / reload / heal / win / lose / slash / skill / coin / chest / portal / boss_roar / explode / dash`；
- BGM 3 首：`bgm_lobby / bgm_dungeon / bgm_boss`（循环，游戏页进 Boss 房自动切换）；
- 资源已生成：`ui/assets/sounds/` 共 20 个 WAV，合计约 1.78MB（< 2.5MB 上限）；
- 播放经原生 `updater.audio`，**尚未在真机试听**；无原生音频能力时静默降级。

---

## 13. 待定 / 已知问题

| 项 | 状态 |
|---|---|
| 初始宝石 | 已统一：`START_GEMS = save.defaultSave().gems = 300`（新档赠送 300） |
| 音频资源（3 BGM + 17 SFX WAV） | 已生成（20 个 WAV，约 1.78MB），**待真机试听** |
| 角色立绘/图标 PNG（portraits/icons） | 已生成（8 立绘 + 123 图标 + contact-sheet + 大厅背景） |
| 结算页 / 设置页 | 已实现，**待真机验证** |
| cvis / rka 构建包 | 三包均已构建（2026-10-26 15:31 最终版，未真机安装） |
| 手感数值（射速/敌速/掉率/复活价） | 设计值，**待真机调参** |
| 难度曲线（精英占比、Boss HP 缩放） | 已按层线性缩放，**待真机验证** |
