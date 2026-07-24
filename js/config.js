/**
 * config.js — 翻糖派对 · 真实业务配置
 * 所有内容固化在代码中，无需 IndexedDB，环境重建不丢失
 * 数据来源：翻糖派对官方设计物料（29张业务图片）
 */

const DEFAULT_CONFIG = {
  // ========== 品牌信息 ==========
  site: {
    brandName: "翻糖派对",
    brandNameEn: "FONDANT PARTY",
    tagline: "翻糖藏甜，镜头留欢",
    heroTag: "FONDANT PARTY",
    heroTitleEn: "Celebrate Every Moment",
    subTagline: "一站式派对布置 · 用影像封存甜蜜",
    location: "阜阳本地全品类派对服务",
  },

  // ========== 关于我们 ==========
  about: {
    title: "关于翻糖派对",
    paragraphs: [
      "翻糖派对是阜阳本地一站式全品类派对服务品牌。我们集场景布置、摄影摄像、仪式主持于一体，从设计执行到现场落地，为您提供专业全包服务。",
      "拥有全套专业设备，不满意重拍、修片到满意为止。透明消费、品质保障，让每一场派对都值得被认真对待。",
    ],
    stats: [
      { num: "7+", label: "大服务品类" },
      { num: "100%", label: "透明消费" },
      { num: "1对1", label: "专属策划" },
    ],
    image: "images/brand/storefront.jpg",
  },

  // ========== 联系方式 ==========
  contact: {
    wechat: "fondant_party",
    phone: "199-0558-1912",
    phone2: "182-5582-2368",
    xiaohongshu: "@翻糖派对",
    email: "",
    address: "阜阳市",
  },

  // ========== 业务品类（作品集） ==========
  categories: [
    {
      id: "decor",
      name: "场景布置",
      nameEn: "DECORATION",
      icon: "balloon",
      description: "全主题气球场地搭建，上门搭建、现场确认、仪式结束后清理撤场",
      items: [],
    },
    {
      id: "photo",
      name: "摄影跟拍",
      nameEn: "PHOTOGRAPHY",
      icon: "camera",
      description: "全程抓拍高清纪实照片，不满意重拍、修片到满意为止",
      items: [],
    },
    {
      id: "zhuazhou",
      name: "抓周布置",
      nameEn: "FIRST BIRTHDAY",
      icon: "baby",
      description: "宝宝周岁专属仪式场景，从抓周道具到背景布置一站式完成",
      items: [],
    },
    {
      id: "engagement",
      name: "订婚宴布置",
      nameEn: "ENGAGEMENT",
      icon: "ring",
      description: "中式轻奢订婚氛围感，打造属于你们的浪漫仪式感",
      items: [],
    },
    {
      id: "video",
      name: "派对摄像",
      nameEn: "VIDEOGRAPHY",
      icon: "video",
      description: "全程录制与短片剪辑，用影像封存每一个甜蜜瞬间",
      items: [],
    },
    {
      id: "host",
      name: "仪式主持",
      nameEn: "HOSTING",
      icon: "mic",
      description: "专业控场带动氛围，让每一场仪式都有温度有故事",
      items: [],
    },
    {
      id: "birthday",
      name: "生日派对",
      nameEn: "BIRTHDAY PARTY",
      icon: "cake",
      description: "主题生日派对布置，让成长中的每个生日都值得庆祝",
      items: [],
    },
    {
      id: "wedding",
      name: "婚礼布置",
      nameEn: "WEDDING DECOR",
      icon: "bouquet",
      description: "婚礼场景布置，从仪式区到宴会厅，打造梦幻婚礼空间",
      items: [],
    },
  ],

  // ========== 服务项目（6大服务套餐） ==========
  services: [
    {
      icon: "balloon",
      title: "场景布置",
      desc: "全主题气球场地搭建，根据您的需求定制专属场景风格，上门搭建、现场确认、仪式结束后清理撤场",
      price: "详询客服",
    },
    {
      icon: "camera",
      title: "摄影跟拍",
      desc: "全程抓拍高清纪实照片，专业摄影师跟拍，不满意重拍、修片到满意为止，成片按时交付",
      price: "详询客服",
    },
    {
      icon: "baby",
      title: "抓周布置",
      desc: "宝宝周岁专属仪式场景，抓周道具、背景布置、仪式流程一站式策划，记录宝宝第一个重要时刻",
      price: "详询客服",
    },
    {
      icon: "ring",
      title: "订婚宴布置",
      desc: "中式轻奢订婚氛围感布置，从花艺到灯光，从背景到甜品台，打造浪漫订婚仪式",
      price: "详询客服",
    },
    {
      icon: "video",
      title: "派对摄像",
      desc: "全程录制与短片剪辑，专业摄像团队，用影像封存甜蜜，交付精剪短片",
      price: "详询客服",
    },
    {
      icon: "mic",
      title: "仪式主持",
      desc: "专业控场带动氛围，仪式流程策划与现场主持，让每一场仪式都有温度有故事",
      price: "详询客服",
    },
  ],

  // ========== 服务流程 ==========
  process: {
    title: "服务流程",
    titleEn: "OUR PROCESS",
    subtitle: "从策划到留念，一站式完成甜蜜仪式",
    steps: [
      { num: "01", title: "需求沟通", desc: "咨询客服，沟通派对需求与预算" },
      { num: "02", title: "方案确认", desc: "确定主题风格，锁定设计方案" },
      { num: "03", title: "场地布置", desc: "当天提前到场，专业团队搭建" },
      { num: "04", title: "活动跟拍", desc: "摄影摄像全程记录精彩瞬间" },
      { num: "05", title: "成片交付", desc: "后期精修，按时交付成品" },
    ],
    footer: "全程专人对接 · 档期提前锁定 · 成片按时交付",
  },

  // ========== 服务承诺 ==========
  promises: {
    title: "六大服务承诺",
    titleEn: "OUR PROMISES",
    items: [
      { num: "01", title: "无任何\n隐形消费" },
      { num: "02", title: "未核销\n随时可退" },
      { num: "03", title: "标准化\n服务流程" },
      { num: "04", title: "专属策划\n1对1服务" },
      { num: "05", title: "设计修改\n到满意为止" },
      { num: "06", title: "布置不满意\n现场调整" },
    ],
  },

  // ========== 选择理由 ==========
  reasons: {
    title: "选择翻糖派对的理由",
    titleEn: "WHY CHOOSE US",
    items: [
      "一站式派对服务",
      "场景布置 · 摄影摄像 · 仪式主持",
      "拥有全套专业设备",
      "品质输出",
      "不满意重拍，修片到满意为止",
      "阜阳本地全品类派对服务",
      "上门一站式服务 · 无隐形消费",
      "多样化的创意，满足您的各种需求",
      "透明消费 · 品质保障",
      "从设计执行到现场，享受专业全包服务",
    ],
  },

  // ========== 场景布置流程（详细版） ==========
  decorProcess: {
    title: "场景布置服务流程",
    steps: [
      "咨询客服沟通需求",
      "确定主题锁定风格",
      "下单后找客服核销锁定档期",
      "当天提前2小时布置服务",
      "气球搭建与场景布置",
      "确认无误后交付（修图）",
      "仪式结束后撤场",
    ],
    footer: "上门搭建 · 现场确认 · 仪式结束后清理撤场",
  },

  // ========== 后台密码 ==========
  adminPassword: "fantang2026",
};

// ========== 图标 SVG 库 ==========
const ICONS = {
  camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>',
  ring: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>',
  cake: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 21h16v-7a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4z"/><path d="M4 16c1.5 1 3 1 4 0s2.5-1 4 0 2.5 1 4 0 2.5-1 4 0"/><path d="M12 3v3"/><circle cx="12" cy="3" r="1"/></svg>',
  baby: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="5"/><path d="M9 8h.01M15 8h.01M9.5 10.5a3.5 3.5 0 0 0 5 0"/><path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7"/></svg>',
  party: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 22l5-5m0 0l3-9 6 6-9 3zm0 0l9 3M13 2l2 2M9 4l1-2M20 7l-2 1M19 13l2-1"/></svg>',
  bouquet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22V12"/><path d="M12 12c-3 0-5-2-5-5s2-5 5-5 5 2 5 5-2 5-5 5z"/><path d="M7 9c-2 0-4 1-4 3 2 0 4-1 4-3zM17 9c2 0 4 1 4 3-2 0-4-1 4-3z"/></svg>',
  balloon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2a7 7 0 0 0-7 7c0 4 3 7 7 7s7-3 7-7a7 7 0 0 0-7-7z"/><path d="M12 16v4M12 22l-1-2h2z"/></svg>',
  dessert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 21h16M5 21l1.5-9h11L19 21M8 12V8a4 4 0 0 1 8 0v4M10 6V3M14 6V3"/></svg>',
  video: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>',
  mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>',
};
