# 翻糖派对作品集网站

一站式派对服务作品集展示网站，纯静态部署，0成本托管于 GitHub Pages。

## 文件结构

```
fondant-party/
├── index.html          # 前台展示页面
├── admin.html          # 后台管理页面
├── css/
│   ├── style.css       # 前台样式
│   └── admin.css       # 后台样式
├── js/
│   ├── config.js       # 业务配置（品类、文案、联系方式等）
│   ├── db.js           # IndexedDB 数据层
│   ├── app.js          # 前台逻辑
│   └── admin.js        # 后台逻辑
├── images/             # 图片资源
│   ├── brand/          # 品牌图片
│   └── samples/        # 样片
├── .nojekyll           # 禁用 Jekyll（GitHub Pages 必需）
└── README.md
```

## 后台管理

访问 `/admin.html`，初始密码：`fondant2026`

## 部署

推送到 GitHub 仓库后，在 Settings → Pages 中选择 main 分支即可。
