/*
 * 角色 / 敌人 / Boss 像素精灵表（art-entities 维护）。
 * 格式：{ w, h, frames: [rows, rows, ...] }，rows 为 h 行、每行 w 字符的等宽字符串；
 * 字符全部取自 palette.js，'.' 为透明；引擎按帧号取 rows 逐像素绘制，左右翻转由引擎处理。
 * 风格：元气骑士式「头大身小」四分之三俯视像素画，深色描边 + 单侧高光；
 *       角色按职业配色（骑士银蓝 / 游侠绿 / 法师紫 / 精灵青 / 工程师橙 / 刺客黑红 / 炼金黄绿 / 圣骑白金），
 *       敌人按章节配色（森林绿 / 沙漠黄 / 冰原蓝），Boss 用皇冠、角、巨剑等夸张剪影做体积与威胁感。
 * 角色 12x16 共 3 帧（idle + 两个迈步帧，仅腿脚/袍摆变化）；敌人 14x14、Boss 28x32 各 2 帧。
 */
export var ENTITY_SPRITES = {
  /* 骑士：银蓝重甲 + 蓝缨巨盔，金色腰扣与蓝色马甲；三帧只改脚步，左右脚交替抬起，避免闪烁。 */
  player_knight: {
    w: 12, h: 16,
    frames: [
      [
        '.....BB.....',
        '....KBBK....',
        '...KMWMwK...',
        '..KMWMMMwK..',
        '..KMWMMMwK..',
        '..KkBkkBkK..',
        '..KMWMMMwK..',
        '...KMWMwK...',
        '.KMWBBBBWMK.',
        'KMMMBBbbMMMK',
        'KMwMBBbbMwMK',
        '.KMBBYYBBMK.',
        '..KMMwwMMK..',
        '..KMK..KMK..',
        '..KKK..KKK..',
        '..KKK..KKK..'
      ],
      [
        '.....BB.....',
        '....KBBK....',
        '...KMWMwK...',
        '..KMWMMMwK..',
        '..KMWMMMwK..',
        '..KkBkkBkK..',
        '..KMWMMMwK..',
        '...KMWMwK...',
        '.KMWBBBBWMK.',
        'KMMMBBbbMMMK',
        'KMwMBBbbMwMK',
        '.KMBBYYBBMK.',
        '..KMMwwMMK..',
        '..KMK..KMK..',
        '..KKK..KKK..',
        '.KKKK.......'
      ],
      [
        '.....BB.....',
        '....KBBK....',
        '...KMWMwK...',
        '..KMWMMMwK..',
        '..KMWMMMwK..',
        '..KkBkkBkK..',
        '..KMWMMMwK..',
        '...KMWMwK...',
        '.KMWBBBBWMK.',
        'KMMMBBbbMMMK',
        'KMwMBBbbMwMK',
        '.KMBBYYBBMK.',
        '..KMMwwMMK..',
        '..KMK..KMK..',
        '..KKK..KKK..',
        '.......KKKK.'
      ]
    ]
  },

  /* 游侠：绿色尖兜帽 + 深棕皮甲，青色眼睛；帽檐压得很低，肩上有披风绿边，整体偏暗绿。 */
  player_rogue: {
    w: 12, h: 16,
    frames: [
      [
        '....KEK.....',
        '...KEEEK....',
        '..KEELLEEK..',
        '..KELLLLEK..',
        '..KEkkkkEK..',
        '..KEkCkCEK..',
        '..KEEkkEEK..',
        '..KEEEEEEK..',
        '.KEDdDdDEK..',
        'KEDdDDdDDEK.',
        'KDdDDDDDdDK.',
        '.KDDDTTDDK..',
        '..KDDDDDK...',
        '..KDK..KDK..',
        '..KKK..KKK..',
        '..KKK..KKK..'
      ],
      [
        '....KEK.....',
        '...KEEEK....',
        '..KEELLEEK..',
        '..KELLLLEK..',
        '..KEkkkkEK..',
        '..KEkCkCEK..',
        '..KEEkkEEK..',
        '..KEEEEEEK..',
        '.KEDdDdDEK..',
        'KEDdDDdDDEK.',
        'KDdDDDDDdDK.',
        '.KDDDTTDDK..',
        '..KDDDDDK...',
        '..KDK..KDK..',
        '..KKK..KKK..',
        '.KKKK.......'
      ],
      [
        '....KEK.....',
        '...KEEEK....',
        '..KEELLEEK..',
        '..KELLLLEK..',
        '..KEkkkkEK..',
        '..KEkCkCEK..',
        '..KEEkkEEK..',
        '..KEEEEEEK..',
        '.KEDdDdDEK..',
        'KEDdDDdDDEK.',
        'KDdDDDDDdDK.',
        '.KDDDTTDDK..',
        '..KDDDDDK...',
        '..KDK..KDK..',
        '..KKK..KKK..',
        '.......KKKK.'
      ]
    ]
  },

  /* 法师：紫色高尖帽 + 宽帽檐、白胡子、袍心 V 色高光；走路帧只让金色袍摆左右摆 1 像素。 */
  player_wizard: {
    w: 12, h: 16,
    frames: [
      [
        '.....KK.....',
        '....KPPK....',
        '...KPVPPK...',
        '..KPVVPPPK..',
        '.KPPVVPPPPK.',
        '..KSSSSSSK..',
        '..KSkSSkSK..',
        '..KWwWWwWK..',
        '.KPPVVPPPPK.',
        'KPPVPPPPPPPK',
        'KPPPPPYYPPPK',
        '.KPPVVPPPPK.',
        '.KPPVVPPPPK.',
        'KpPPPPPPPPpK',
        'KpPPPPPPPPpK',
        '.KUUUUUUUUK.'
      ],
      [
        '.....KK.....',
        '....KPPK....',
        '...KPVPPK...',
        '..KPVVPPPK..',
        '.KPPVVPPPPK.',
        '..KSSSSSSK..',
        '..KSkSSkSK..',
        '..KWwWWwWK..',
        '.KPPVVPPPPK.',
        'KPPVPPPPPPPK',
        'KPPPPPYYPPPK',
        '.KPPVVPPPPK.',
        '.KPPVVPPPPK.',
        'KpPPPPPPPPpK',
        'KpPPPPPPPPpK',
        'KUUUUUUUUK..'
      ],
      [
        '.....KK.....',
        '....KPPK....',
        '...KPVPPK...',
        '..KPVVPPPK..',
        '.KPPVVPPPPK.',
        '..KSSSSSSK..',
        '..KSkSSkSK..',
        '..KWwWWwWK..',
        '.KPPVVPPPPK.',
        'KPPVPPPPPPPK',
        'KPPPPPYYPPPK',
        '.KPPVVPPPPK.',
        '.KPPVVPPPPK.',
        'KpPPPPPPPPpK',
        'KpPPPPPPPPpK',
        '..KUUUUUUUUK'
      ]
    ]
  },

  /* 精灵：青色尖兜帽与披风、尖耳、皮革腰带；冷青色系与法师紫色拉开，身形更瘦。 */
  player_elf: {
    w: 12, h: 16,
    frames: [
      [
        '.....CC.....',
        '....KCCK....',
        '...KCCCCK...',
        '..KCCLLCCK..',
        '..KCSSSSCK..',
        '..KCSkSkCK..',
        '..KCSSSSCK..',
        '..KCCCCCCK..',
        '.KCCIICCCCK.',
        'KCCIICCCCCCK',
        'KCcCCCCCCcCK',
        '.KCcCTTCcK..',
        '..KCCCCCCK..',
        '..KCK..KCK..',
        '..KKK..KKK..',
        '..KKK..KKK..'
      ],
      [
        '.....CC.....',
        '....KCCK....',
        '...KCCCCK...',
        '..KCCLLCCK..',
        '..KCSSSSCK..',
        '..KCSkSkCK..',
        '..KCSSSSCK..',
        '..KCCCCCCK..',
        '.KCCIICCCCK.',
        'KCCIICCCCCCK',
        'KCcCCCCCCcCK',
        '.KCcCTTCcK..',
        '..KCCCCCCK..',
        '..KCK..KCK..',
        '..KKK..KKK..',
        '.KKKK.......'
      ],
      [
        '.....CC.....',
        '....KCCK....',
        '...KCCCCK...',
        '..KCCLLCCK..',
        '..KCSSSSCK..',
        '..KCSkSkCK..',
        '..KCSSSSCK..',
        '..KCCCCCCK..',
        '.KCCIICCCCK.',
        'KCCIICCCCCCK',
        'KCcCCCCCCcCK',
        '.KCcCTTCcK..',
        '..KCCCCCCK..',
        '..KCK..KCK..',
        '..KKK..KKK..',
        '.......KKKK.'
      ]
    ]
  },

  /* 工程师：橙色安全帽（整条深色帽檐最宽）+ 青色护目镜、背带工装与Y色扣具，块面感最强。 */
  player_engineer: {
    w: 12, h: 16,
    frames: [
      [
        '..KOyOOOOK..',
        '.KOyOOOOOOK.',
        '.KKKKKKKKKK.',
        '..KSSSSSSK..',
        '..KCCkkCCK..',
        '..KSSSSSSK..',
        '..KkSSSSkK..',
        '...KSSSSK...',
        '.KOOOOOOOOK.',
        'KOGgOOOOgGOK',
        'KOgGOOOOGgOK',
        '.KOGGYYGGOK.',
        '..KOOOOOOK..',
        '..KOK..KOK..',
        '..KKK..KKK..',
        '..KKK..KKK..'
      ],
      [
        '..KOyOOOOK..',
        '.KOyOOOOOOK.',
        '.KKKKKKKKKK.',
        '..KSSSSSSK..',
        '..KCCkkCCK..',
        '..KSSSSSSK..',
        '..KkSSSSkK..',
        '...KSSSSK...',
        '.KOOOOOOOOK.',
        'KOGgOOOOgGOK',
        'KOgGOOOOGgOK',
        '.KOGGYYGGOK.',
        '..KOOOOOOK..',
        '..KOK..KOK..',
        '..KKK..KKK..',
        '.KKKK.......'
      ],
      [
        '..KOyOOOOK..',
        '.KOyOOOOOOK.',
        '.KKKKKKKKKK.',
        '..KSSSSSSK..',
        '..KCCkkCCK..',
        '..KSSSSSSK..',
        '..KkSSSSkK..',
        '...KSSSSK...',
        '.KOOOOOOOOK.',
        'KOGgOOOOgGOK',
        'KOgGOOOOGgOK',
        '.KOGGYYGGOK.',
        '..KOOOOOOK..',
        '..KOK..KOK..',
        '..KKK..KKK..',
        '.......KKKK.'
      ]
    ]
  },

  /* 刺客：黑兜帽 + 红色眼缝与红围巾，灰亮面表现皮甲；全身只用一抹红做视觉焦点。 */
  player_assassin: {
    w: 12, h: 16,
    frames: [
      [
        '.....KK.....',
        '....KkkK....',
        '...KkkkkK...',
        '..KkkkkkkK..',
        '..KkkkkkkK..',
        '..KkRkkRkK..',
        '..KkkkkkkK..',
        '..KRRRRRRK..',
        '.KRRkkkkRRK.',
        'KkRRkkkkRRkK',
        'KkkkkGkkkkkK',
        '.KkkRRRRkkK.',
        '..KkkkkkkK..',
        '..KkK..KkK..',
        '..KKK..KKK..',
        '..KKK..KKK..'
      ],
      [
        '.....KK.....',
        '....KkkK....',
        '...KkkkkK...',
        '..KkkkkkkK..',
        '..KkkkkkkK..',
        '..KkRkkRkK..',
        '..KkkkkkkK..',
        '..KRRRRRRK..',
        '.KRRkkkkRRK.',
        'KkRRkkkkRRkK',
        'KkkkkGkkkkkK',
        '.KkkRRRRkkK.',
        '..KkkkkkkK..',
        '..KkK..KkK..',
        '..KKK..KKK..',
        '.KKKK.......'
      ],
      [
        '.....KK.....',
        '....KkkK....',
        '...KkkkkK...',
        '..KkkkkkkK..',
        '..KkkkkkkK..',
        '..KkRkkRkK..',
        '..KkkkkkkK..',
        '..KRRRRRRK..',
        '.KRRkkkkRRK.',
        'KkRRkkkkRRkK',
        'KkkkkGkkkkkK',
        '.KkkRRRRkkK.',
        '..KkkkkkkK..',
        '..KkK..KkK..',
        '..KKK..KKK..',
        '.......KKKK.'
      ]
    ]
  },

  /* 炼金术士：黄发 + 圆护目镜 + 黄绿围裙、绿色靴子；黄绿双色占比最高，辨识度最强。 */
  player_alchemist: {
    w: 12, h: 16,
    frames: [
      [
        '....KYYK....',
        '...KYYYYK...',
        '..KYyYYyYK..',
        '..KSSSSSSK..',
        '..KCCkkCCK..',
        '..KSSSSSSK..',
        '..KSSSSSSK..',
        '..KjjjjjjK..',
        '.KYYLLLLYYK.',
        'KYYjLLLLjYYK',
        'KYEjLLLLjEYK',
        '.KYYjLLjYYK.',
        '..KYYYYYYK..',
        '..KYK..KYK..',
        '..KjK..KjK..',
        '..KKK..KKK..'
      ],
      [
        '....KYYK....',
        '...KYYYYK...',
        '..KYyYYyYK..',
        '..KSSSSSSK..',
        '..KCCkkCCK..',
        '..KSSSSSSK..',
        '..KSSSSSSK..',
        '..KjjjjjjK..',
        '.KYYLLLLYYK.',
        'KYYjLLLLjYYK',
        'KYEjLLLLjEYK',
        '.KYYjLLjYYK.',
        '..KYYYYYYK..',
        '..KYK..KYK..',
        '..KjK..KjK..',
        '.KjKK.......'
      ],
      [
        '....KYYK....',
        '...KYYYYK...',
        '..KYyYYyYK..',
        '..KSSSSSSK..',
        '..KCCkkCCK..',
        '..KSSSSSSK..',
        '..KSSSSSSK..',
        '..KjjjjjjK..',
        '.KYYLLLLYYK.',
        'KYYjLLLLjYYK',
        'KYEjLLLLjEYK',
        '.KYYjLLjYYK.',
        '..KYYYYYYK..',
        '..KYK..KYK..',
        '..KjK..KjK..',
        '.......KjKK.'
      ]
    ]
  },

  /* 圣骑士：白金板甲 + 金色王冠状头盔、蓝色面甲宝石，金缝贯穿胸甲与金靴。 */
  player_paladin: {
    w: 12, h: 16,
    frames: [
      [
        '...KUUUUK...',
        '..KUwWWwUK..',
        '..KWwWWwWK..',
        '.KWMWWWWMWK.',
        '..KWBBBBWK..',
        '..KWKWWKWK..',
        '..KWwWWwWK..',
        '...KUUUUK...',
        '.KWWUUUUWWK.',
        'KWWUWWWWUWWK',
        'KWwUWWWWUwWK',
        '.KWWUUUUWWK.',
        '..KWwWWwWK..',
        '..KWK..KWK..',
        '..KUK..KUK..',
        '..KKK..KKK..'
      ],
      [
        '...KUUUUK...',
        '..KUwWWwUK..',
        '..KWwWWwWK..',
        '.KWMWWWWMWK.',
        '..KWBBBBWK..',
        '..KWKWWKWK..',
        '..KWwWWwWK..',
        '...KUUUUK...',
        '.KWWUUUUWWK.',
        'KWWUWWWWUWWK',
        'KWwUWWWWUwWK',
        '.KWWUUUUWWK.',
        '..KWwWWwWK..',
        '..KWK..KWK..',
        '..KUK..KUK..',
        '.KUKK.......'
      ],
      [
        '...KUUUUK...',
        '..KUwWWwUK..',
        '..KWwWWwWK..',
        '.KWMWWWWMWK.',
        '..KWBBBBWK..',
        '..KWKWWKWK..',
        '..KWwWWwWK..',
        '...KUUUUK...',
        '.KWWUUUUWWK.',
        'KWWUWWWWUWWK',
        'KWwUWWWWUwWK',
        '.KWWUUUUWWK.',
        '..KWwWWwWK..',
        '..KWK..KWK..',
        '..KUK..KUK..',
        '.......KUKK.'
      ]
    ]
  },

  /* 史莱姆（森林）：果冻绿团子、单侧高光 + 深绿投影；第 2 帧底座压扁 1 像素表现弹跳。 */
  enemy_slime: {
    w: 14, h: 14,
    frames: [
      [
        '.....KKKK.....',
        '...KKEEEEKK...',
        '..KELLEEEEEK..',
        '.KEELLEEEEEEK.',
        'KEELLEEEEEEEEK',
        'KEELLEkEEkEEEK',
        'KEELLEkEEkEEEK',
        'KEEELEEEEEEEEK',
        'KEEEEEEEEEEeEK',
        'KEEEEEEEEEEeeK',
        'KEEEEEEEEEEeeK',
        '.KEEEEEEEEeeK.',
        '..KEEEEEEeeK..',
        '...KKKKKKKK...'
      ],
      [
        '.....KKKK.....',
        '...KKEEEEKK...',
        '..KELLEEEEEK..',
        '.KEELLEEEEEEK.',
        'KEELLEEEEEEEEK',
        'KEELLEkEEkEEEK',
        'KEELLEkEEkEEEK',
        'KEEELEEEEEEEEK',
        'KEEEEEEEEEEeEK',
        'KEEEEEEEEEEeeK',
        'KEEEEEEEEEEeeK',
        '.KEEEEEEEEeeK.',
        '..KEEEEEEeeK..',
        '..KKKKKKKKKK..'
      ]
    ]
  },

  /* 哥布林（森林）：大耳朵绿皮、尖牙咧嘴、棕色兜裆布；第 2 帧只换脚步。 */
  enemy_goblin: {
    w: 14, h: 14,
    frames: [
      [
        '.....KKKK.....',
        '...KKEEEEKK...',
        '..KEEEEEEEEK..',
        '..KEEkEEkEEK..',
        '..KEEEkkEEEK..',
        '..KEEEEEEEEK..',
        '...KEEEEEEK...',
        '.KEEEEEEEEEEK.',
        'KEEEEEEEEEEEEK',
        'KEEEEEEEEEEEEK',
        'KEEEdTTTTdEEEK',
        '.KEEEEEEEEEEK.',
        '...KEK..KEK...',
        '...KKK..KKK...'
      ],
      [
        '.....KKKK.....',
        '...KKEEEEKK...',
        '..KEEEEEEEEK..',
        '..KEEkEEkEEK..',
        '..KEEEkkEEEK..',
        '..KEEEEEEEEK..',
        '...KEEEEEEK...',
        '.KEEEEEEEEEEK.',
        'KEEEEEEEEEEEEK',
        'KEEEEEEEEEEEEK',
        'KEEEdTTTTdEEEK',
        '.KEEEEEEEEEEK.',
        '...KEK..KEK...',
        '...KKK...KK...'
      ]
    ]
  },

  /* 哥布林弓手（森林）：红色额带 + 背后箭袋（R 箭羽、T 箭杆、d 皮袋），与普通哥布林靠剪影区分。 */
  enemy_goblin_archer: {
    w: 14, h: 14,
    frames: [
      [
        '.....KKKK.....',
        '...KKEEEEKK.RR',
        '..KEEEEEEEEKTT',
        '..KRRRRRRRRKdd',
        '..KEEkEEkEEKdd',
        '..KEEEEEEEEKdd',
        '...KEEEEEEKddd',
        '.KEEEEEEEEEEKd',
        'KEEEEEEEEEEEEK',
        'KEEEEEEEEEEEEK',
        'KEEEdTTTTdEEEK',
        '.KEEEEEEEEK.K.',
        '...KEK..KEK...',
        '...KKK..KKK...'
      ],
      [
        '.....KKKK.....',
        '...KKEEEEKK.RR',
        '..KEEEEEEEEKTT',
        '..KRRRRRRRRKdd',
        '..KEEkEEkEEKdd',
        '..KEEEEEEEEKdd',
        '...KEEEEEEKddd',
        '.KEEEEEEEEEEKd',
        'KEEEEEEEEEEEEK',
        'KEEEEEEEEEEEEK',
        'KEEEdTTTTdEEEK',
        '.KEEEEEEEEK.K.',
        '...KEK..KEK...',
        '...KKK...KK...'
      ]
    ]
  },

  /* 野猪（森林）：深棕鬃毛、粉褐大鼻子、骨白外翻獠牙；正面四分之三视角，冲撞感强。 */
  enemy_boar: {
    w: 14, h: 14,
    frames: [
      [
        '...KK....KK...',
        '..KddK..KddK..',
        '.KddddddddddK.',
        'KddddddddddddK',
        'KddkddddddkddK',
        'KddddddddddddK',
        'KdSSSSSSSSSSdK',
        'KdSkkSSSSkkSdK',
        'KWdSSSSSSSSdWK',
        'KWWdSSSSSSdWWK',
        '.KWWdSSSSdWWK.',
        '..KddddddddK..',
        '...KdK..KdK...',
        '...KKK..KKK...'
      ],
      [
        '...KK....KK...',
        '..KddK..KddK..',
        '.KddddddddddK.',
        'KddddddddddddK',
        'KddkddddddkddK',
        'KddddddddddddK',
        'KdSSSSSSSSSSdK',
        'KdSkkSSSSkkSdK',
        'KWdSSSSSSSSdWK',
        'KWWdSSSSSSdWWK',
        '.KWWdSSSSdWWK.',
        '..KddddddddK..',
        '...KdK..KdK...',
        '...KKK...KK...'
      ]
    ]
  },

  /* 树人（森林）：嫩绿树冠 + 深棕树干、金色发光眼；第 2 帧树根左右挪动。 */
  enemy_treant: {
    w: 14, h: 14,
    frames: [
      [
        '..KEEEEEEEEK..',
        '..KELEEELEEK..',
        '.KEELEEEEEEEK.',
        '.KEEEEEEEEEEK.',
        '..KddddddddK..',
        '.KddddddddddK.',
        '.KdYddddddYdK.',
        '.KddddddddddK.',
        'KddddddddddddK',
        'KddTddddddTddK',
        '.KddddddddddK.',
        '..KddddddddK..',
        '..KddK..KddK..',
        '.Kdddd..ddddK.'
      ],
      [
        '..KEEEEEEEEK..',
        '..KELEEELEEK..',
        '.KEELEEEEEEEK.',
        '.KEEEEEEEEEEK.',
        '..KddddddddK..',
        '.KddddddddddK.',
        '.KdYddddddYdK.',
        '.KddddddddddK.',
        'KddddddddddddK',
        'KddTddddddTddK',
        '.KddddddddddK.',
        '..KddddddddK..',
        '..KddK.KddK...',
        '.Kdddd..ddddK.'
      ]
    ]
  },

  /* 蘑菇法师（森林）：红伞白斑、伞下阴影脸 + 金色发光眼、紫色法袍；第 2 帧伞体轻微起伏。 */
  enemy_mushroom_mage: {
    w: 14, h: 14,
    frames: [
      [
        '....KKKKKK....',
        '..KKRRRRRRKK..',
        '.KRRRWRRRWRRK.',
        'KRRRRRRRRRRRRK',
        'KRWRRRWRRRWRRK',
        'KRRRRRRRRRRRRK',
        '..KkkkkkkkkK..',
        '..KkYkkkkYkK..',
        '..KkkkkkkkkK..',
        '.KpPPPPPPPPpK.',
        'KpPPPPVVPPPPpK',
        'KpPPPPPPPPPPpK',
        '.KpPPPPPPPPpK.',
        '.KppppppppppK.'
      ],
      [
        '....KKKKKK....',
        '..KKRRRRRRKK..',
        '.KRRRWRRRWRRK.',
        'KRRRRRRRRRRRRK',
        'KRWRRRWRRRWRRK',
        'KRRRRRRRRRRRRK',
        '..KkkkkkkkkK..',
        '..KkYkkkkYkK..',
        '..KkkkkkkkkK..',
        '.KpPPPPPPPPpK.',
        'KpPPPPVVPPPPpK',
        'KpPPPPPPPPPPpK',
        '.KpPPPPPPPPpK.',
        '..KppppppppK..'
      ]
    ]
  },

  /* 沙蝎（沙漠）：沙黄甲壳、双螯前伸、倒钩尾针；第 2 帧双螯向内夹一格。 */
  enemy_scorpion: {
    w: 14, h: 14,
    frames: [
      [
        '..KK....KK....',
        '.KqqK..KqqK...',
        '.KqqK..KqqK...',
        '..KqK..KqK....',
        '...KTTTTTTK...',
        '..KTTTTTTTTK..',
        '.KqTTTTTTTTqK.',
        '.KqTqqTTqqTqK.',
        '.KqTTTTTTTTqK.',
        '..KTTTTTTTTK..',
        '..KqTTTTTTqK..',
        '...KqTTTTqK...',
        '....KqTTqK....',
        '.....KYYK.....'
      ],
      [
        '..KK....KK....',
        '..KqqK.KqqK...',
        '..KqqK.KqqK...',
        '..KqK..KqK....',
        '...KTTTTTTK...',
        '..KTTTTTTTTK..',
        '.KqTTTTTTTTqK.',
        '.KqTqqTTqqTqK.',
        '.KqTTTTTTTTqK.',
        '..KTTTTTTTTK..',
        '..KqTTTTTTqK..',
        '...KqTTTTqK...',
        '....KqTTqK....',
        '.....KYYK.....'
      ]
    ]
  },

  /* 木乃伊（沙漠）：骨白绷带 + 深色缠布阴影、金色眼光；第 2 帧脚步外撇。 */
  enemy_mummy: {
    w: 14, h: 14,
    frames: [
      [
        '....KKKKKK....',
        '...KZZZZZZK...',
        '..KZZzZZzZZK..',
        '..KZYYZZYYZK..',
        '..KZZZZZZZZK..',
        '...KZzzzzZK...',
        '.KZZZZZZZZZZK.',
        'KZZZzZZZZzZZZK',
        'KZZZZZZZZZZZZK',
        'KZzZZZZZZZZzZK',
        'KZZZZZZZZZZZZK',
        '.KZZZzZZzZZZK.',
        '...KZZK.KZZK..',
        '...KZZK.KZZK..'
      ],
      [
        '....KKKKKK....',
        '...KZZZZZZK...',
        '..KZZzZZzZZK..',
        '..KZYYZZYYZK..',
        '..KZZZZZZZZK..',
        '...KZzzzzZK...',
        '.KZZZZZZZZZZK.',
        'KZZZzZZZZzZZZK',
        'KZZZZZZZZZZZZK',
        'KZzZZZZZZZZzZK',
        'KZZZZZZZZZZZZK',
        '.KZZZzZZzZZZK.',
        '...KZZK.KZZK..',
        '..KZZK..KZZK..'
      ]
    ]
  },

  /* 沙漠强盗（沙漠）：红头巾 + 黑布蒙面、深棕皮衣、红腰带；第 2 帧换脚步。 */
  enemy_bandit: {
    w: 14, h: 14,
    frames: [
      [
        '....KRRRRK....',
        '...KRRRRRRK...',
        '..KRRRRRRRRK..',
        '..KRRRRRRRRK..',
        '..KSkSSSSkSK..',
        '..KSkkkkkkSK..',
        '...KSSSSSSK...',
        '.KDDDDDDDDDDK.',
        'KDDdDDDDdDDDDK',
        'KDDDDDDDDDDDDK',
        'KRRRRRRRRRRRRK',
        '.KDDDDDDDDDDK.',
        '...KDDK.KDDK..',
        '...KKK..KKK...'
      ],
      [
        '....KRRRRK....',
        '...KRRRRRRK...',
        '..KRRRRRRRRK..',
        '..KRRRRRRRRK..',
        '..KSkSSSSkSK..',
        '..KSkkkkkkSK..',
        '...KSSSSSSK...',
        '.KDDDDDDDDDDK.',
        'KDDdDDDDdDDDDK',
        'KDDDDDDDDDDDDK',
        'KRRRRRRRRRRRRK',
        '.KDDDDDDDDDDK.',
        '...KDDK.KDDK..',
        '...KKK...KK...'
      ]
    ]
  },

  /* 沙虫（沙漠）：分节沙色虫体、环形口器与骨白利齿；第 2 帧上半身前倾蠕动。 */
  enemy_sand_worm: {
    w: 14, h: 14,
    frames: [
      [
        '...KTTTTTTK...',
        '..KqKKKKKKqK..',
        '..KqKWKWKWqK..',
        '..KqKKKKKKqK..',
        '..KqTTTTTTqK..',
        '.KqTTTTTTTTqK.',
        '.KqTTqqqqTTqK.',
        '.KqTTTTTTTTqK.',
        '..KqTTTTTTqK..',
        '..KqTTTTTTqK..',
        '...KqTTTTqK...',
        '....KqTTqK....',
        '..KTTTTTTTTTK.',
        '.KqqqqqqqqqqK.'
      ],
      [
        '..KTTTTTTK....',
        '.KqKKKKKKqK...',
        '.KqKWKWKWqK...',
        '..KqKKKKKKqK..',
        '..KqTTTTTTqK..',
        '.KqTTTTTTTTqK.',
        '.KqTTqqqqTTqK.',
        '.KqTTTTTTTTqK.',
        '..KqTTTTTTqK..',
        '..KqTTTTTTqK..',
        '...KqTTTTqK...',
        '....KqTTqK....',
        '..KTTTTTTTTTK.',
        '.KqqqqqqqqqqK.'
      ]
    ]
  },

  /* 火精灵（沙漠）：通红皮肤 + 弯角、橙黄肚皮、金色獠牙；第 2 帧换脚步。 */
  enemy_fire_imp: {
    w: 14, h: 14,
    frames: [
      [
        '..KK......KK..',
        '..KRK....KRK..',
        '...KRRRRRRK...',
        '..KRRRRRRRRK..',
        '..KRkRRRRkRK..',
        '..KRRRRRRRRK..',
        '..KYRRRRRRYK..',
        '...KRRRRRRK...',
        '.KOOOOOOOOOOK.',
        'KOOORRRRRROOOK',
        'KOOORRRRRROOOK',
        '.KOOORRRROOOK.',
        '...KOK..KOK...',
        '...KKK..KKK...'
      ],
      [
        '..KK......KK..',
        '..KRK....KRK..',
        '...KRRRRRRK...',
        '..KRRRRRRRRK..',
        '..KRkRRRRkRK..',
        '..KRRRRRRRRK..',
        '..KYRRRRRRYK..',
        '...KRRRRRRK...',
        '.KOOOOOOOOOOK.',
        'KOOORRRRRROOOK',
        'KOOORRRRRROOOK',
        '.KOOORRRROOOK.',
        '...KOK..KOK...',
        '...KKK...KK...'
      ]
    ]
  },

  /* 沙岩魔像（沙漠）：方正砂岩块甲、金眼、Z 色高光与裂缝；第 2 帧换脚步。 */
  enemy_sand_golem: {
    w: 14, h: 14,
    frames: [
      [
        '...KKKKKKKK...',
        '..KqqqqqqqqK..',
        '.KZqqqqqqqqZK.',
        '.KqUqqqqqqUqK.',
        '.KqqqqqqqqqqK.',
        '..KKqqqqqqKK..',
        '.KqqqqqqqqqqK.',
        'KqZqqqqqqqqZqK',
        'KqqqqqqqqqqqqK',
        'KqqqKqqqqKqqqK',
        '.KqqqqqqqqqqK.',
        '.KqqKqqqqKqqK.',
        '...KqK..KqK...',
        '...KKK..KKK...'
      ],
      [
        '...KKKKKKKK...',
        '..KqqqqqqqqK..',
        '.KZqqqqqqqqZK.',
        '.KqUqqqqqqUqK.',
        '.KqqqqqqqqqqK.',
        '..KKqqqqqqKK..',
        '.KqqqqqqqqqqK.',
        'KqZqqqqqqqqZqK',
        'KqqqqqqqqqqqqK',
        'KqqqKqqqqKqqqK',
        '.KqqqqqqqqqqK.',
        '.KqqKqqqqKqqK.',
        '...KqK..KqK...',
        '...KKK...KK...'
      ]
    ]
  },

  /* 冰史莱姆（冰原）：冰蓝果冻体 + 头顶三棱冰晶、白蓝高光；第 2 帧压扁弹跳。 */
  enemy_ice_slime: {
    w: 14, h: 14,
    frames: [
      [
        '......KK......',
        '.....KIIK.....',
        '....KIIIIK....',
        '...KCCCCCCK...',
        '..KCCIIICCCK..',
        '.KCCIIICCCCCK.',
        'KCCCkCCCkCCCCK',
        'KCCCCCCCCCCCCK',
        'KCCCCCCCCCCCCK',
        'KcCCCCCCCCCCcK',
        'KcCCCCCCCCCCcK',
        '.KcCCCCCCCCcK.',
        '..KcCCCCCCcK..',
        '...KKKKKKKK...'
      ],
      [
        '......KK......',
        '.....KIIK.....',
        '....KIIIIK....',
        '...KCCCCCCK...',
        '..KCCIIICCCK..',
        '.KCCIIICCCCCK.',
        'KCCCkCCCkCCCCK',
        'KCCCCCCCCCCCCK',
        'KCCCCCCCCCCCCK',
        'KcCCCCCCCCCCcK',
        'KcCCCCCCCCCCcK',
        '.KcCCCCCCCCcK.',
        '..KcCCCCCCcK..',
        '..KKKKKKKKKK..'
      ]
    ]
  },

  /* 冰狼（冰原）：银白毛皮、冰蓝眼窝、白吻部与黑鼻；第 2 帧换脚步。 */
  enemy_ice_wolf: {
    w: 14, h: 14,
    frames: [
      [
        '..KK......KK..',
        '..KMK....KMK..',
        '..KMMKKKKMMK..',
        '.KMMMMMMMMMMK.',
        'KMIkMMMMMMkIMK',
        'KMMMMMMMMMMMMK',
        'KMMMMMMMMMMMMK',
        'KMWWWWWWWWWWMK',
        'KWWkWWWWWWkWWK',
        'KMMMMMMMMMMMMK',
        'KmdMMMMMMMMdmK',
        '.KmmmMMMMmmmK.',
        '...KdK..KdK...',
        '...KKK..KKK...'
      ],
      [
        '..KK......KK..',
        '..KMK....KMK..',
        '..KMMKKKKMMK..',
        '.KMMMMMMMMMMK.',
        'KMIkMMMMMMkIMK',
        'KMMMMMMMMMMMMK',
        'KMMMMMMMMMMMMK',
        'KMWWWWWWWWWWMK',
        'KWWkWWWWWWkWWK',
        'KMMMMMMMMMMMMK',
        'KmdMMMMMMMMdmK',
        '.KmmmMMMMmmmK.',
        '...KdK..KdK...',
        '...KKK...KK...'
      ]
    ]
  },

  /* 雪人（冰原）：白色雪球、黑煤眼与纽扣、橙色胡萝卜鼻、树枝手；第 2 帧树枝手放下。 */
  enemy_snowman: {
    w: 14, h: 14,
    frames: [
      [
        '....KKKKKK....',
        '..KKKKKKKKKK..',
        '...KWWWWWWK...',
        '..KWWWWWWWWK..',
        '..KWkWWWWkWK..',
        '..KWWWOOWWWK..',
        '..KWWWOWWWWK..',
        '..KWWkWWkWWK..',
        '..KWWWWWWWWK..',
        'KdKWWWWWWWWKdK',
        '.KWWkWWWWkWWK.',
        '.KWWWWWWWWWWK.',
        '..KWWWWWWWWK..',
        '..KKKKKKKKKK..'
      ],
      [
        '....KKKKKK....',
        '..KKKKKKKKKK..',
        '...KWWWWWWK...',
        '..KWWWWWWWWK..',
        '..KWkWWWWkWK..',
        '..KWWWOOWWWK..',
        '..KWWWOWWWWK..',
        '..KWWkWWkWWK..',
        '..KWWWWWWWWK..',
        '.KdWWWWWWWWdK.',
        '.KWWkWWWWkWWK.',
        '.KWWWWWWWWWWK.',
        '..KWWWWWWWWK..',
        '..KKKKKKKKKK..'
      ]
    ]
  },

  /* 冰法师（冰原）：深蓝尖兜帽 + 冰青发光眼、蓝紫法袍、冰晶下摆；第 2 帧袍摆收窄。 */
  enemy_ice_mage: {
    w: 14, h: 14,
    frames: [
      [
        '......KK......',
        '.....KBBK.....',
        '....KBBBBK....',
        '...KBBCCBBK...',
        '..KBkIkkIkBK..',
        '...KBBkkBBK...',
        '....KBBBBK....',
        '...KBBBBBBK...',
        '..KBBBBBBBBK..',
        '.KBBBBBBBBBBK.',
        '.KBBBBIIBBBBK.',
        '.KBbBBBBBBbBK.',
        '.KBbBBBBBBbBK.',
        '.KIIIIIIIIIIK.'
      ],
      [
        '......KK......',
        '.....KBBK.....',
        '....KBBBBK....',
        '...KBBCCBBK...',
        '..KBkIkkIkBK..',
        '...KBBkkBBK...',
        '....KBBBBK....',
        '...KBBBBBBK...',
        '..KBBBBBBBBK..',
        '.KBBBBBBBBBBK.',
        '.KBBBBIIBBBBK.',
        '.KBbBBBBBBbBK.',
        '.KBbBBBBBBbBK.',
        '..KIIIIIIIIK..'
      ]
    ]
  },

  /* 霜蛛（冰原）：冰蓝甲壳、I 色霜斑、深青八足；第 2 帧足尖内外移动。 */
  enemy_frost_spider: {
    w: 14, h: 14,
    frames: [
      [
        '..K........K..',
        '.KcK......KcK.',
        '.KcK.KIIK.KcK.',
        '..KcKBBBBKcK..',
        '..KcBBBBBBcK..',
        '.KcKBBIIBBKcK.',
        '.KcKBBBBBBKcK.',
        '.KcKBBIIBBKcK.',
        '..KcBBBBBBcK..',
        '..KcKBBBBKcK..',
        '.KcK.KKKK.KcK.',
        '.KcK......KcK.',
        '..KcK....KcK..',
        '...K......K...'
      ],
      [
        '...K......K...',
        '.KcK......KcK.',
        '.KcK.KIIK.KcK.',
        '..KcKBBBBKcK..',
        '..KcBBBBBBcK..',
        '.KcKBBIIBBKcK.',
        '.KcKBBBBBBKcK.',
        '.KcKBBIIBBKcK.',
        '..KcBBBBBBcK..',
        '..KcKBBBBKcK..',
        '.KcK.KKKK.KcK.',
        '.KcK......KcK.',
        '..KcK....KcK..',
        '..K........K..'
      ]
    ]
  },

  /* 水晶魔像（冰原）：蓝色晶体块甲、Q 色冰核、b 色暗面、头顶晶簇；第 2 帧换脚步。 */
  enemy_crystal_golem: {
    w: 14, h: 14,
    frames: [
      [
        '......KK......',
        '.....KIIK.....',
        '....KIIIIK....',
        '...KBBIIBBK...',
        '..KBBBBBBBBK..',
        '..KBQBBBBQBK..',
        '..KBBBBBBBBK..',
        '...KBBBBBBK...',
        '.KBBBBBBBBBBK.',
        'KBBQBBBBBBQBBK',
        'KBBBBBBBBBBBBK',
        '.KBbBBBBBBbBK.',
        '..KBBK..KBBK..',
        '..KKK....KKK..'
      ],
      [
        '......KK......',
        '.....KIIK.....',
        '....KIIIIK....',
        '...KBBIIBBK...',
        '..KBBBBBBBBK..',
        '..KBQBBBBQBK..',
        '..KBBBBBBBBK..',
        '...KBBBBBBK...',
        '.KBBBBBBBBBBK.',
        'KBBQBBBBBBQBBK',
        'KBBBBBBBBBBBBK',
        '.KBbBBBBBBbBK.',
        '..KBBK..KBBK..',
        '..KKK.....KKK.'
      ]
    ]
  },

  /* 哥布林酋长（森林 Boss）：金冠 + 绿皮獠牙咧嘴、兽皮肩甲与金钉、圆滚肚腩；压倒性体型，第 2 帧挪步。 */
  boss_goblin_chief: {
    w: 28, h: 32,
    frames: [
      [
        '.....K...K...KK...K...K.....',
        '.....KUUUUUUUUUUUUUUUUK.....',
        '....KUUURUUURUURUUURUUUK....',
        '....KUUUUUUUUUUUUUUUUUUK....',
        '...KUUUUUUUUUUUUUUUUUUUUK...',
        '...KEEEEEEEEEEEEEEEEEEEEK...',
        '..KEEEEEEEEEEEEEEEEEEEEEEK..',
        '..KEELLEEEEEEEEEEEEEELLEEK..',
        '..KEEEEEEkYYkkkkYYkEEEEEEK..',
        '..KEEEEEEEEEEEEEEEEEEEEEEK..',
        '..KEEEEEEEEEEEEEEEEEEEEEEK..',
        '.KEEkkkkkkkkkkkkkkkkkkkkEEK.',
        '.KEEWkkkkkkkkkkkkkkkkkkWEEK.',
        '.KEEEEEEEEEEEEEEEEEEEEEEEEK.',
        '..KEEEEEEEEEEEEEEEEEEEEEEK..',
        '.KKddddddddddddddddddddddKK.',
        'KddUUEEEEEEEEEEEEEEEEEEUUddK',
        'KddEEEEEEEEEEEEEEEEEEEEEEddK',
        'KddEEEEEEEEEEEEEEEEEEEEEEddK',
        'KdEELLLLLLLLLLLLLLLLLLLLEEdK',
        'KdEELLLLLLLLLLLLLLLLLLLLEEdK',
        'KdEEEEEEEEEEEEEEEEEEEEEEEEdK',
        'KdEEEEEEEEEEEEEEEEEEEEEEEEdK',
        '.KdEEEEEEEEEEEEEEEEEEEEEEdK.',
        '.KddTTTTTTTTTTTTTTTTTTTTddK.',
        '.KddTTTTTTTTTTTTTTTTTTTTddK.',
        '.KKddTTTTTTTTTTTTTTTTTTddKK.',
        '......KEEEEK....KEEEEK......',
        '......KEEEEK....KEEEEK......',
        '......KEEEEK....KEEEEK......',
        '.....KKEEEKK....KKEEEKK.....',
        '....KKKKKKK......KKKKKKK....'
      ],
      [
        '.....K...K...KK...K...K.....',
        '.....KUUUUUUUUUUUUUUUUK.....',
        '....KUUURUUURUURUUURUUUK....',
        '....KUUUUUUUUUUUUUUUUUUK....',
        '...KUUUUUUUUUUUUUUUUUUUUK...',
        '...KEEEEEEEEEEEEEEEEEEEEK...',
        '..KEEEEEEEEEEEEEEEEEEEEEEK..',
        '..KEELLEEEEEEEEEEEEEELLEEK..',
        '..KEEEEEEkYYkkkkYYkEEEEEEK..',
        '..KEEEEEEEEEEEEEEEEEEEEEEK..',
        '..KEEEEEEEEEEEEEEEEEEEEEEK..',
        '.KEEkkkkkkkkkkkkkkkkkkkkEEK.',
        '.KEEWkkkkkkkkkkkkkkkkkkWEEK.',
        '.KEEEEEEEEEEEEEEEEEEEEEEEEK.',
        '..KEEEEEEEEEEEEEEEEEEEEEEK..',
        '.KKddddddddddddddddddddddKK.',
        'KddUUEEEEEEEEEEEEEEEEEEUUddK',
        'KddEEEEEEEEEEEEEEEEEEEEEEddK',
        'KddEEEEEEEEEEEEEEEEEEEEEEddK',
        'KdEELLLLLLLLLLLLLLLLLLLLEEdK',
        'KdEELLLLLLLLLLLLLLLLLLLLEEdK',
        'KdEEEEEEEEEEEEEEEEEEEEEEEEdK',
        'KdEEEEEEEEEEEEEEEEEEEEEEEEdK',
        '.KdEEEEEEEEEEEEEEEEEEEEEEdK.',
        '.KddTTTTTTTTTTTTTTTTTTTTddK.',
        '.KddTTTTTTTTTTTTTTTTTTTTddK.',
        '.KKddTTTTTTTTTTTTTTTTTTddKK.',
        '......KEEEEK....KEEEEK......',
        '......KEEEEK....KEEEEK......',
        '......KEEEEK....KEEEEK......',
        '....KKEEEKK......KKEEEKK....',
        '...KKKKKKKK......KKKKKKKK...'
      ]
    ]
  },

  /* 沙之女王（沙漠 Boss）：高金冠镶红宝石、金色眼窝与面纱感、层叠流沙长裙（q/T 条纹 + 金边）；第 2 帧手部与裙摆换位。 */
  boss_sand_queen: {
    w: 28, h: 32,
    frames: [
      [
        '......K..K..K..K..K..K......',
        '.....KUUUUUUUUUUUUUUUUK.....',
        '....KUUUUUUUUUUUUUUUUUUK....',
        '....KUUURUUUUUUUUUURUUUK....',
        '...KUUUUUUUUUUUUUUUUUUUUK...',
        '...KSSSSSSSSSSSSSSSSSSSSK...',
        '..KSSSSSSSSSSSSSSSSSSSSSSK..',
        '..KSSSSSSSSSSSSSSSSSSSSSSK..',
        '..KSSSSSSkYYkSSkYYkSSSSSSK..',
        '..KSSSSSSSSSSSSSSSSSSSSSSK..',
        '..KSSSSSSSSSSSSSSSSSSSSSSK..',
        '...KSSSSSSSSSSSSSSSSSSSSK...',
        '....KSSSSSSSSSSSSSSSSSSK....',
        '....KUUCUUUUUUUUUUUUCUUK....',
        '...KUUUUUUUUUUUUUUUUUUUUK...',
        '..KUUUUUUUUUUUUUUUUUUUUUUK..',
        'KSqqqqqqqqqqqqqqqqqqqqqqqqSK',
        'KqTqqqqqqqqqqqqqqqqqqqqqqTqK',
        'KqTqqqUqqqqqqqqqqqqqqUqqqTqK',
        'KqqTqqUqqqqqqqqqqqqqqUqqTqqK',
        'KqqqTqUqqqqqqqqqqqqqqUqTqqqK',
        'KqqqqTUqqqqqqqqqqqqqqUTqqqqK',
        'KqqqTUqqqqqqqqqqqqqqqqUTqqqK',
        'KqqTqUqqqqqqqqqqqqqqqqUqTqqK',
        'KqqTUqqqqqqqqqqqqqqqqqqUTqqK',
        'KqTqUqqqqCqqqqqqqqCqqqqUqTqK',
        'KqTqUqqqqqqqqqqqqqqqqqqUqTqK',
        'KqTUqqqqqqqqqqqqqqqqqqqqUTqK',
        'KTqUqqqqqqqqqqqqqqqqqqqqUqTK',
        'KTqUqqqqqqqqqqqqqqqqqqqqUqTK',
        'KqUqqqqqqqqqqqqqqqqqqqqqqUqK',
        'KUUUUUUUUUUUUUUUUUUUUUUUUUUK'
      ],
      [
        '......K..K..K..K..K..K......',
        '.....KUUUUUUUUUUUUUUUUK.....',
        '....KUUUUUUUUUUUUUUUUUUK....',
        '....KUUURUUUUUUUUUURUUUK....',
        '...KUUUUUUUUUUUUUUUUUUUUK...',
        '...KSSSSSSSSSSSSSSSSSSSSK...',
        '..KSSSSSSSSSSSSSSSSSSSSSSK..',
        '..KSSSSSSSSSSSSSSSSSSSSSSK..',
        '..KSSSSSSkYYkSSkYYkSSSSSSK..',
        '..KSSSSSSSSSSSSSSSSSSSSSSK..',
        '..KSSSSSSSSSSSSSSSSSSSSSSK..',
        '...KSSSSSSSSSSSSSSSSSSSSK...',
        '....KSSSSSSSSSSSSSSSSSSK....',
        '....KUUCUUUUUUUUUUUUCUUK....',
        '...KUUUUUUUUUUUUUUUUUUUUK...',
        '..KUUUUUUUUUUUUUUUUUUUUUUK..',
        'KqqqqqqqqqqqqqqqqqqqqqqqqqqK',
        'KSqqqqqqqqqqqqqqqqqqqqqqqqSK',
        'KqTqqqUqqqqqqqqqqqqqqUqqqTqK',
        'KqqTqqUqqqqqqqqqqqqqqUqqTqqK',
        'KqqqTqUqqqqqqqqqqqqqqUqTqqqK',
        'KqqqqTUqqqqqqqqqqqqqqUTqqqqK',
        'KqqqTUqqqqqqqqqqqqqqqqUTqqqK',
        'KqqTqUqqqqqqqqqqqqqqqqUqTqqK',
        'KqqTUqqqqqqqqqqqqqqqqqqUTqqK',
        'KqTqUqqqqCqqqqqqqqCqqqqUqTqK',
        'KqTqUqqqqqqqqqqqqqqqqqqUqTqK',
        'KqTUqqqqqqqqqqqqqqqqqqqqUTqK',
        'KTqUqqqqqqqqqqqqqqqqqqqqUqTK',
        'KTqUqqqqqqqqqqqqqqqqqqqqUqTK',
        'KUUqqqqqqqqqqqqqqqqqqqqqqUUK',
        'KUUUUUUUUUUUUUUUUUUUUUUUUUUK'
      ]
    ]
  },

  /* 冰之女王（冰原 Boss）：冰晶尖冠 + 苍白长发、深蓝长裙、I 色霜纹由胸向裙摆扩散、冰蓝裙边；第 2 帧手部与裙摆微动。 */
  boss_ice_queen: {
    w: 28, h: 32,
    frames: [
      [
        '.....K..K..K....K..K..K.....',
        '....KIIIIIIIIIIIIIIIIIIK....',
        '...KIIIIIIIIIIIIIIIIIIIIK...',
        '...KIIIIIIIIIIIIIIIIIIIIK...',
        '..KIIIIIIIIIIIIIIIIIIIIIIK..',
        '..KWWWWWWWWWWWWWWWWWWWWWWK..',
        '..KWWWWwWWWWWWWWWWWWwWWWWK..',
        '..KWWWWWWWWWWWWWWWWWWWWWWK..',
        '..KWWWWWWkYYkWWkYYkWWWWWWK..',
        '..KWWWWWWWWWWWWWWWWWWWWWWK..',
        '..KWWWwWWWWWWWWWWWWWWwWWWK..',
        '..KWWWWWWWWWWWWWWWWWWWWWWK..',
        '...KWWWWWWWWWWWWWWWWWWWWK...',
        '....KWWWWWWWWWWWWWWWWWWK....',
        '...KIIIIIIIIIIIIIIIIIIIIK...',
        '..KIIIIIIIIIIIIIIIIIIIIIIK..',
        'KSIIIIIIIIIIIIIIIIIIIIIIIISK',
        '.KBBBBBBBBBBBBBBBBBBBBBBBBK.',
        'KBBBBBBBBBBBBBBBBBBBBBBBBBBK',
        'KBBIIIIIIIIBBBBBBIIIIIIIIBBK',
        'KBBIIIIIIIIBBBBBBIIIIIIIIBBK',
        'KBIIIIIIIIIIBBBBIIIIIIIIIIBK',
        'KBIIIIIIIIIIBBBBIIIIIIIIIIBK',
        'KBBIIIIIIIIBBBBBBIIIIIIIIBBK',
        'KBBBIIIIIIBBBBBBBBIIIIIIBBBK',
        'KBBBBIIIIBBBBBBBBBBIIIIBBBBK',
        'KBBBBBIIBBBBBBBBBBBBIIBBBBBK',
        'KBBBBBBBBBBBBBBBBBBBBBBBBBBK',
        'KBBBBBBBBBBBBBBBBBBBBBBBBBBK',
        'KBbBBBBBBBBbBBBBbBBBBBBBBbBK',
        'KBbBBBBBBBBbBBBBbBBBBBBBBbBK',
        'KIIIIIIIIIIIIIIIIIIIIIIIIIIK'
      ],
      [
        '.....K..K..K....K..K..K.....',
        '....KIIIIIIIIIIIIIIIIIIK....',
        '...KIIIIIIIIIIIIIIIIIIIIK...',
        '...KIIIIIIIIIIIIIIIIIIIIK...',
        '..KIIIIIIIIIIIIIIIIIIIIIIK..',
        '..KWWWWWWWWWWWWWWWWWWWWWWK..',
        '..KWWWWwWWWWWWWWWWWWwWWWWK..',
        '..KWWWWWWWWWWWWWWWWWWWWWWK..',
        '..KWWWWWWkYYkWWkYYkWWWWWWK..',
        '..KWWWWWWWWWWWWWWWWWWWWWWK..',
        '..KWWWwWWWWWWWWWWWWWWwWWWK..',
        '..KWWWWWWWWWWWWWWWWWWWWWWK..',
        '...KWWWWWWWWWWWWWWWWWWWWK...',
        '....KWWWWWWWWWWWWWWWWWWK....',
        '...KIIIIIIIIIIIIIIIIIIIIK...',
        '..KIIIIIIIIIIIIIIIIIIIIIIK..',
        '.KIIIIIIIIIIIIIIIIIIIIIIIIK.',
        'KSBBBBBBBBBBBBBBBBBBBBBBBBSK',
        'KBBBBBBBBBBBBBBBBBBBBBBBBBBK',
        'KBBIIIIIIIIBBBBBBIIIIIIIIBBK',
        'KBBIIIIIIIIBBBBBBIIIIIIIIBBK',
        'KBIIIIIIIIIIBBBBIIIIIIIIIIBK',
        'KBIIIIIIIIIIBBBBIIIIIIIIIIBK',
        'KBBIIIIIIIIBBBBBBIIIIIIIIBBK',
        'KBBBIIIIIIBBBBBBBBIIIIIIBBBK',
        'KBBBBIIIIBBBBBBBBBBIIIIBBBBK',
        'KBBBBBIIBBBBBBBBBBBBIIBBBBBK',
        'KBBBBBBBBBBBBBBBBBBBBBBBBBBK',
        'KBBBBBBBBBBBBBBBBBBBBBBBBBBK',
        'KBbBBBBBBBBbBBBBbBBBBBBBBbBK',
        'KBbBBBBBBBBbBBBBbBBBBBBBBbBK',
        '.KIIIIIIIIIIIIIIIIIIIIIIIIK.'
      ]
    ]
  },

  /* 暗黑骑士（终局 Boss）：双角黑盔 + 红色眼缝、钢灰肩甲、暗红腰带，胸前横持巨剑（M/W 刃 + U 剑格）；第 2 帧双眼变亮、脚步压前。 */
  boss_dark_knight: {
    w: 28, h: 32,
    frames: [
      [
        '..K.......K......K.......K..',
        '..KG.....KG......GK.....GK..',
        '..KGG...KGG......GGK...GGK..',
        '...KGG.KGG........GGK.GGK...',
        '...KGGGGGGGGGGGGGGGGGGGGK...',
        '..KGGGGGGGGGGGGGGGGGGGGGGK..',
        '.KKGGGGGGGGGGGGGGGGGGGGGGKK.',
        '.KGGGGGGGGGGGGGGGGGGGGGGGGK.',
        'KGGggGGGGGGGGGGGGGGGGGGggGGK',
        'KGGGGGRRGGGGGGGGGGGGRRGGGGGK',
        'KGGGGGGGGGGGGGGGGGGGGGGGGGGK',
        '.KGGGGGGGGGGGGGGGGGGGGGGGGK.',
        '..KGGGGGGGGGGGGGGGGGGGGGGK..',
        '...KGGGGGGGGGGGGGGGGGGGGK...',
        '.KKggGGGGGGGGGGGGGGGGGGggKK.',
        'KKgggGGGGGGGGGGGGGGGGGGgggKK',
        'KGGkkMMMMMMMWWWWMMMMMMMkkGGK',
        'KGGkkMMWWWWWWWWWWWWWWMMkkGGK',
        'KGGkkMMMMMMMWWWWMMMMMMMkkGGK',
        'KkkkkUkkkkkkkkkkkkkkkkUkkkkK',
        'KkkrrrrrrrrrrrrrrrrrrrrrrkkK',
        'KkkGkkkkkkkkkkkkkkkkkkkkGkkK',
        '.KkkGGGGGGGGGGGGGGGGGGGGkkK.',
        '.KkkGGGGGGGGGGGGGGGGGGGGkkK.',
        '..KkkGGGGGGGGGGGGGGGGGGkkK..',
        '...KkkGGGGGGGGGGGGGGGGkkK...',
        '......KkkkkK....KkkkkK......',
        '......KkkkkK....KkkkkK......',
        '......KkkkkK....KkkkkK......',
        '......KkkkkK....KkkkkK......',
        '.....KggggggK..KggggggK.....',
        '....KKggggggK..KggggggKK....'
      ],
      [
        '..K.......K......K.......K..',
        '..KG.....KG......GK.....GK..',
        '..KGG...KGG......GGK...GGK..',
        '...KGG.KGG........GGK.GGK...',
        '...KGGGGGGGGGGGGGGGGGGGGK...',
        '..KGGGGGGGGGGGGGGGGGGGGGGK..',
        '.KKGGGGGGGGGGGGGGGGGGGGGGKK.',
        '.KGGGGGGGGGGGGGGGGGGGGGGGGK.',
        'KGGggGGGGGGGGGGGGGGGGGGggGGK',
        'KkkkkRRRRkkkkkkkkkkRRRRkkkkK',
        'KGGGGGGGGGGGGGGGGGGGGGGGGGGK',
        '.KGGGGGGGGGGGGGGGGGGGGGGGGK.',
        '..KGGGGGGGGGGGGGGGGGGGGGGK..',
        '...KGGGGGGGGGGGGGGGGGGGGK...',
        '.KKggGGGGGGGGGGGGGGGGGGggKK.',
        'KKgggGGGGGGGGGGGGGGGGGGgggKK',
        'KGGkkMMMMMMMWWWWMMMMMMMkkGGK',
        'KGGkkMMWWWWWWWWWWWWWWMMkkGGK',
        'KGGkkMMMMMMMWWWWMMMMMMMkkGGK',
        'KkkkkUkkkkkkkkkkkkkkkkUkkkkK',
        'KkkrrrrrrrrrrrrrrrrrrrrrrkkK',
        'KkkGkkkkkkkkkkkkkkkkkkkkGkkK',
        '.KkkGGGGGGGGGGGGGGGGGGGGkkK.',
        '.KkkGGGGGGGGGGGGGGGGGGGGkkK.',
        '..KkkGGGGGGGGGGGGGGGGGGkkK..',
        '...KkkGGGGGGGGGGGGGGGGkkK...',
        '......KkkkkK....KkkkkK......',
        '......KkkkkK....KkkkkK......',
        '......KkkkkK....KkkkkK......',
        '......KkkkkK....KkkkkK......',
        '....KggggggK....KggggggK....',
        '...KKggggggK....KggggggKK...'
      ]
    ]
  }
}
