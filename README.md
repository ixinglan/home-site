# my-products · 个人产品展示站

纯静态、配置驱动的个人产品作品集。无后端、无数据库、无登录。

- 技术栈：Vite 7 + 原生 HTML / CSS / JS（ES Modules），零运行时依赖
- 主题：亮 / 暗双主题（跟随系统 + 手动切换，localStorage 持久化）
- 路由：hash 路由 `#/product/<id>`，nginx 无需任何 rewrite 规则
- 内容：`public/data/` 下 4 个 JSON 驱动，部署后改文案**不需要重新构建**

## 快速开始

```bash
npm install
npm run dev        # 开发预览 http://localhost:5173
npm run build      # 产物输出到 dist/
npm run preview    # 本地预览构建产物 http://localhost:4173
```

> 注意：内容通过 fetch 加载 JSON，**直接双击 index.html 打不开**（file:// 有跨域限制），必须走 dev / preview 服务。

## 目录结构

```
public/data/          ← 所有内容都在这里（改完刷新即生效）
  site.config.json    站点信息 / Hero / 主题 / 关于 / 页脚
  products.json       产品列表（核心）
  categories.json     平台分类（全部 / macOS / iOS / Web / Java 后端）
  navigation.json     导航（主导航 / 外链图标）
public/assets/images/ 产品封面与详情海报（3:2 与 16:9）
src/
  styles/             设计令牌 → 主题 → 基础 → 布局 → 组件（5 层 CSS）
  core/               dom / config / schema / theme / router / motion / icons
  components/         每个区块一个文件，按需增删
scripts/
  gen-mockups.mjs        按平台生成设备示例图（iPhone / Android / 浏览器 / macOS 窗口）
  gen-placeholders.mjs   旧版渐变占位图（已被 mockups 取代，保留备用）
  verify.mjs             端到端冒烟验证（31 项检查 + 截图）
```

## 产品示例图（mockup）

每个产品自动生成 `cover / poster / shot-01..03` 五张设备示例图，外壳按 `platforms[0]` 自动选择
（ios→iPhone、android→安卓机、web→浏览器窗口、macos→Mac 窗口），界面内容按 `mockup.kind` 渲染：

| kind | 界面 | 适合 |
|---|---|---|
| `metronome` | 大数字 + 圆环 + 节拍点 | 工具类 / 音频类 App |
| `feed` | 文章流 | 博客 / 内容站 |
| `terminal` | 终端输出 | CLI / API 服务 |
| `timer` | 侧栏 + 计时环 + 柱状图 | 桌面效率工具 |
| `chart` | 折线图 + 指标卡 | 数据 / 健康类 |

在 `products.json` 里配置：

```json
"mockup": { "kind": "metronome", "title": "Cadence", "subtitle": "毫秒级节拍" }
```

`media.gallery` 留空时会自动回退到 `shot-01..03.svg`。放真实截图后重跑 `npm run gen:mockups`
（已存在的文件不覆盖）。加脚本：`package.json` 的 scripts 里补
`"gen:mockups": "node scripts/gen-mockups.mjs"`，或直接 `node scripts/gen-mockups.mjs`。

## 外站入口（博客 / 面试题站）

三个位置，强度递减：

1. **顶部导航**（桌面端常驻）：`navigation.json` 的 `external` 数组，渲染成带外链图标的文字链接
2. **「我也在写」双卡区块**（产品区之后，主转化位）：`site.config.json` 的 `sites` 数组驱动，
   每条支持 `name / url / desc / icon / accent / label / highlight`，hover 时浮现品牌色渐变 + 箭头位移
3. **页脚**：`footer.links` 文字兜底

移动端导航隐藏，入口靠页面内的站点区块与页脚。

## 日常改内容

### 新增一个产品

1. 把封面（1600×1067）放进 `public/assets/images/products/<id>/cover.png`，海报（1920×1080）放 `poster.png`
2. 在 `products.json` 里加一条：

```json
{
  "id": "my-app",                  // 唯一，同时是图片目录名和分享链接里的 id
  "name": "My App",
  "tagline": "一句话介绍",
  "category": "ios",               // 对应 categories.json 里的 id
  "platforms": ["ios"],            // 跨平台就多写几个
  "status": "released",            // released | beta | wip | archived
  "featured": true,                // 置顶放大
  "order": 10,                     // 排序，小的在前
  "version": "1.0.0",
  "releaseDate": "2026-10-01",
  "accent": "#FF6B35",             // 该产品自己的主题色（卡片 hover / 占位封面）
  "summary": "列表简介",
  "description": "详情长描述，\n\n空行分段",
  "highlights": [{ "icon": "sparkles", "title": "亮点", "desc": "说明" }],
  "tags": ["SwiftUI", "Swift 6"],
  "media": { "cover": "assets/images/products/my-app/cover.png", "poster": "...", "gallery": [] },
  "links": [{ "type": "appstore", "label": "App Store", "href": "https://...", "primary": true }],
  "metrics": [{ "label": "下载", "value": "1.2k" }]
}
```

3. 刷新页面即可。字段缺失会在控制台告警并跳过该产品，不会白屏。

### 改文案 / 主题

直接编辑 `site.config.json`，刷新生效。`theme.accent` 是全局强调色。

### 可用图标

`src/core/icons.js` 里的 `PATHS`，产品亮点 / 链接 / 分类都从这里取名字（sparkles、code、globe、phone、desktop、java、github、mail、bilibili…）。要新图标就在这个文件里加一条 SVG path。

## ⚠️ 占位内容清单（上线前替换）

- `products.json` 中 `focus-deck`（macOS）和 `forge-kit`（Java 后端）是**演示用占位产品**，请替换成真实产品
- 所有产品封面当前是脚本生成的渐变占位图，替换为真实截图效果最好
- `site.config.json` 里的域名是占位值；页脚版权年份写 `{year}` 会自动替换为当前年份
- `public/favicon.svg` 是通用图标，可换成自己的 logo

重新生成占位图：`npm run gen:placeholders`（已存在的文件不会被覆盖）。

## 端到端验证

```bash
npm install --no-save playwright-core   # 一次性，用本机缓存的可执行浏览器
npm run build && npm run preview        # 或手动起一个静态服务
node scripts/verify.mjs                 # 56 项检查 + 截图到 verify-shots/
```

覆盖：各区块渲染、逐字标题、光标策略（常态系统默认 / 悬浮原生小手）、精选双列卡、筛选、
全屏详情（共享元素名切换）、
截图画廊、键盘 ←/→ 切换、ESC 关闭、hash 直链、暗色主题、主题持久化、移动端、控制台无错误。

## 交互亮点

- **首页卡通角色**：手绘 SVG 场景（戴耳机写代码的小人 + 显示器 + 咖啡杯），
  瞳孔与头部跟随鼠标转动，漂浮元素分层视差，随机眨眼，鼠标移到角色上会挥手；
  背景是渐变光斑 + 粒子连线，光斑同样随鼠标视差
- **全屏详情页**（替代传统侧边抽屉）：点击卡片，封面经 View Transitions
  共享元素形变放大为详情头图（Chrome/Edge/Safari 18+，其余自动降级为淡入）
- 详情内：头图滚动视差、横向 coverflow 截图画廊（中间放大两侧缩小）、
  编号式亮点排版、底部"下一个产品"大卡（hover 浮现对方封面）
- 键盘：`Esc` 关闭详情，`←` `→` 直接切换上/下一个产品
- 个性化层：颗粒质感、顶部滚动进度条、Hero 标题逐字上浮、CTA 磁吸、卡片 3D 倾斜 + 鼠标跟随高光
- **光标不做接管**：平时就是系统默认箭头，悬浮可交互元素（卡片 / 芯片 / 外站卡 / 外链 / 小猫）
  使用原生小手 `cursor: pointer`；这样没有跟随延迟，也不会在触屏 / 无障碍场景出问题
- 全部动效尊重 `prefers-reduced-motion`，触屏设备自动关闭磁吸与 3D 倾斜

## 部署（nginx）

`npm run build` 后把 `dist/` 内容上传到服务器目录即可。参考配置（无 SPA rewrite 需求）：

```nginx
server {
    listen 443 ssl;
    server_name products.example.com;        # 换成你的子域名
    root /var/www/my-products;
    index index.html;

    location / { try_files $uri $uri/ =404; }

    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;

    location /data/ { add_header Cache-Control "no-cache"; }   # 配置文件不缓存
    location ~* \.(svg|png|jpe?g|webp|woff2)$ { expires 30d; } # 静态资源长缓存
}
```

`vite.config.js` 的 `base: './'` 已设好，任意子路径部署无需改代码。
