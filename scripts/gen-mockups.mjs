/**
 * 生成产品示例图（设备 mockup）
 * 按 platform 选设备外壳（iPhone / Android / 浏览器 / macOS 窗口），
 * 按 products.json 里的 mockup.kind 画对应的界面内容，
 * 每个产品输出 cover(3:2) / poster(16:9) / shot-1..3（画廊横滑用）。
 *
 * 已存在的文件不会被覆盖 —— 换成真实截图后重跑是安全的。
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = join(root, 'public/data');
const imgDir = join(root, 'public/assets/images/products');

const products = JSON.parse(readFileSync(join(dataDir, 'products.json'), 'utf8'));
const site = JSON.parse(readFileSync(join(dataDir, 'site.config.json'), 'utf8'));
const A1 = site.theme?.accent || '#3D6BFF';

const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif";
const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";

const rect = (x, y, w, h, r, fill, extra = '') =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" ${extra}/>`;
const circle = (cx, cy, r, fill, extra = '') =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" ${extra}/>`;
const text = (x, y, s, size, fill, { weight = 500, anchor = 'start', font = FONT, op = 1 } = {}) =>
  `<text x="${x}" y="${y}" font-family="${font}" font-size="${size}" font-weight="${weight}" fill="${fill}" fill-opacity="${op}" text-anchor="${anchor}">${esc(s)}</text>`;

/* ============================================================
   界面内容：每种 kind 画一个"看起来真的能用"的 app 界面
   尺寸基于传入的屏幕宽高（sw, sh），variant 用来做 3 张不同截图
   ============================================================ */

const SCREENS = {
  /* 节拍器 / 数字类 App：大数字 + 圆环 + 节拍点 */
  metronome(sw, sh, accent, v) {
    const cx = sw / 2;
    const bpm = [172, 128, 96][v % 3];
    const beat = v % 4;
    const R = Math.min(sw, sh) * 0.28;
    const cy = sh * 0.42;
    const dash = 2 * Math.PI * R;
    const prog = [0.72, 0.45, 0.9][v % 3];
    let s = '';
    // 状态栏
    s += text(28, 44, '9:41', 15, '#fff', { weight: 600, font: MONO });
    s += rect(sw - 76, 32, 48, 18, 5, '#fff', 'fill-opacity=".25"');
    // 标题
    s += text(cx, 96, 'METRONOME', 12, '#fff', { anchor: 'middle', font: MONO, op: 0.5, weight: 600 });
    // 圆环
    s += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#ffffff" stroke-opacity=".1" stroke-width="10"/>`;
    s += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${accent}" stroke-width="10" stroke-linecap="round"
      stroke-dasharray="${dash}" stroke-dashoffset="${dash * (1 - prog)}"
      transform="rotate(-90 ${cx} ${cy})"/>`;
    s += text(cx, cy + 6, String(bpm), 74, '#fff', { anchor: 'middle', weight: 700, font: MONO });
    s += text(cx, cy + 40, 'BPM', 14, '#fff', { anchor: 'middle', font: MONO, op: 0.5 });
    // 节拍点
    const dotY = sh * 0.66;
    for (let i = 0; i < 4; i += 1) {
      const x = cx - 54 + i * 36;
      s += circle(x, dotY, i === beat ? 9 : 6, i === beat ? accent : '#ffffff', i === beat ? '' : 'fill-opacity=".22"');
    }
    // 播放按钮
    const py = sh * 0.78;
    s += circle(cx, py, 34, accent);
    s += `<path d="M${cx - 11} ${py - 15} L${cx + 17} ${py} L${cx - 11} ${py + 15} Z" fill="#0A0C10"/>`;
    // 底部控制条
    const by = sh - 74;
    s += rect(28, by, sw - 56, 52, 16, '#ffffff', 'fill-opacity=".07"');
    s += text(52, by + 32, '4/4', 14, '#fff', { font: MONO, op: 0.7 });
    s += text(cx, by + 32, 'SWING  OFF', 12, '#fff', { anchor: 'middle', font: MONO, op: 0.45 });
    s += text(sw - 52, by + 32, 'TAP', 12, accent, { anchor: 'end', font: MONO, weight: 700 });
    return s;
  },

  /* 文章流 / 博客 */
  feed(sw, sh, accent, v) {
    const titles = [
      ['用 Swift 6 重写节拍器', 'Swift · 并发'],
      ['Hugo 博客迁移记录', 'Web · 笔记'],
      ['uv 管理 Python 依赖', 'Python · 工具'],
      ['给博客加个防盗链', '后端 · Nginx'],
    ];
    let s = '';
    s += rect(0, 0, sw, 74, 0, '#ffffff', 'fill-opacity=".04"');
    s += text(28, 46, 'Pixel Blog', 22, '#fff', { weight: 700 });
    s += circle(sw - 44, 44, 18, accent);
    s += text(sw - 44, 50, 'P', 16, '#0A0C10', { anchor: 'middle', weight: 700 });
    // 搜索框
    s += rect(28, 100, sw - 56, 44, 22, '#ffffff', 'fill-opacity=".07"');
    s += text(52, 128, '搜索文章…', 14, '#fff', { op: 0.4 });
    // 文章列表
    let y = 172;
    for (let i = 0; i < 4; i += 1) {
      const [title, tag] = titles[(i + v) % titles.length];
      const active = i === v % 2;
      s += rect(28, y, sw - 56, 96, 16, active ? accent : '#ffffff', active ? 'fill-opacity=".14"' : 'fill-opacity=".05"');
      if (active) s += rect(28, y, 4, 96, 2, accent);
      s += text(52, y + 32, `2026 · 0${(i + v) % 9 + 1} · 1${i + 2}`, 11, '#fff', { font: MONO, op: 0.42 });
      s += text(52, y + 60, title, 16, '#fff', { weight: 600 });
      s += rect(52, y + 72, tag.length * 8 + 20, 20, 10, '#ffffff', 'fill-opacity=".1"');
      s += text(62, y + 86, tag, 10, '#fff', { font: MONO, op: 0.55 });
      y += 112;
    }
    return s;
  },

  /* 终端 / 接口服务 */
  terminal(sw, sh, accent, v) {
    const lines = [
      [['GET', '#7DD3FC'], [' /wallpaper', '#E9ECF3'], [' 302', accent]],
      [['referer', '#A78BFA'], ['  whitelist  ', '#E9ECF3'], ['PASS', '#4ADE80']],
      [['origin', '#A78BFA'], ['  blog.zhaojq.top ', '#E9ECF3']],
      [['redirect', '#FBBF24'], [' →  bing.com/th?id=OHR', '#9CA3AF']],
      [['cached', '#7DD3FC'], ['  hit  ', '#E9ECF3'], ['0.8ms', accent]],
    ];
    let s = '';
    s += rect(0, 0, sw, 60, 0, '#ffffff', 'fill-opacity=".05"');
    ['#FF5F57', '#FEBC2E', '#28C840'].forEach((c, i) => {
      s += circle(32 + i * 22, 30, 6, c);
    });
    s += text(sw / 2, 35, 'img-proxy — 302 redirect', 13, '#fff', { anchor: 'middle', font: MONO, op: 0.55 });
    let y = 108;
    lines.forEach((row, i) => {
      let x = 40;
      s += text(x, y, '$', 15, accent, { font: MONO, op: 0.8 });
      x += 20;
      row.forEach(([word, color]) => {
        s += text(x, y, word, 15, color, { font: MONO, weight: 500 });
        x += word.length * 9 + 6;
      });
      if (i === v % lines.length) s += rect(34, y - 20, sw - 68, 32, 6, accent, 'fill-opacity=".12"');
      y += 42;
    });
    s += rect(40, y + 8, sw - 80, 1, 0, '#ffffff', 'fill-opacity=".08"');
    s += text(40, y + 46, '3.2k req/day', 13, '#fff', { font: MONO, op: 0.5 });
    s += text(sw - 40, y + 46, '200 OK', 13, '#4ADE80', { anchor: 'end', font: MONO });
    // 光标
    s += rect(40 + 20 + 40, y - 6 - 42, 8, 20, 2, accent);
    return s;
  },

  /* 计时器 / 桌面工具 */
  timer(sw, sh, accent, v) {
    const cx = sw * 0.62;
    const cy = sh * 0.5;
    const R = Math.min(sw * 0.3, sh * 0.32);
    const dash = 2 * Math.PI * R;
    const times = ['24:31', '05:00', '12:07'];
    let s = '';
    // 左侧栏
    s += rect(0, 0, sw * 0.28, sh, 0, '#ffffff', 'fill-opacity=".04"');
    ['Focus', 'Short break', 'Long break', 'Stats'].forEach((t, i) => {
      const y = 96 + i * 52;
      if (i === v % 3) {
        s += rect(16, y - 24, sw * 0.28 - 32, 40, 10, accent, 'fill-opacity=".16"');
      }
      s += text(36, y, t, 14, i === v % 3 ? accent : '#fff', { weight: i === v % 3 ? 700 : 500, op: i === v % 3 ? 1 : 0.55 });
    });
    s += text(36, sh - 40, 'v0.3.0', 11, '#fff', { font: MONO, op: 0.35 });
    // 主区
    s += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#ffffff" stroke-opacity=".1" stroke-width="14"/>`;
    s += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${accent}" stroke-width="14" stroke-linecap="round"
      stroke-dasharray="${dash}" stroke-dashoffset="${dash * (0.3 + v * 0.2)}" transform="rotate(-90 ${cx} ${cy})"/>`;
    s += text(cx, cy + 12, times[v % 3], 56, '#fff', { anchor: 'middle', weight: 700, font: MONO });
    s += text(cx, cy + 44, 'FOCUS SESSION', 12, '#fff', { anchor: 'middle', font: MONO, op: 0.45 });
    // 底部柱状图
    const bars = [38, 62, 24, 78, 46, 88, 54, 70];
    const bw = 16;
    const baseY = sh - 56;
    bars.forEach((bh, i) => {
      const x = sw * 0.34 + i * (bw + 10);
      s += rect(x, baseY - bh, bw, bh, 5, accent, `fill-opacity="${0.35 + (i % 3) * 0.2}"`);
    });
    s += text(sw - 36, 60, '本周专注', 13, '#fff', { anchor: 'end', op: 0.5 });
    return s;
  },

  /* 图表 / 健康类 */
  chart(sw, sh, accent, v) {
    let s = '';
    s += rect(0, 0, sw, 72, 0, accent, 'fill-opacity=".16"');
    s += text(28, 46, 'Pulse', 20, '#fff', { weight: 700 });
    s += text(sw - 28, 46, '72 bpm', 14, accent, { anchor: 'end', font: MONO, weight: 700 });
    // 折线图
    const pts = [];
    const gw = sw - 56;
    const gy = sh * 0.52;
    const gh = sh * 0.22;
    for (let i = 0; i <= 22; i += 1) {
      const x = 28 + (gw / 22) * i;
      const noise = Math.sin(i * (1.1 + v * 0.4)) * 0.5 + Math.cos(i * 0.7) * 0.3;
      const y = gy - noise * gh * 0.5 - (i === 8 + v ? gh * 0.35 : 0);
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    s += `<polyline points="${pts.join(' ')}" fill="none" stroke="${accent}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
    s += `<polyline points="28,${gy + gh} ${pts.join(' ')} ${sw - 28},${gy + gh}" fill="${accent}" fill-opacity=".12" stroke="none"/>`;
    // 指标卡
    const cards = [['静息', '62'], ['最高', '148'], ['时长', '38m']];
    cards.forEach(([label, val], i) => {
      const w = (sw - 56 - 24) / 3;
      const x = 28 + i * (w + 12);
      const y = sh - 132;
      s += rect(x, y, w, 84, 14, '#ffffff', 'fill-opacity=".06"');
      s += text(x + 16, y + 28, label, 11, '#fff', { op: 0.45 });
      s += text(x + 16, y + 62, val, 24, '#fff', { weight: 700, font: MONO });
    });
    // 底部按钮
    s += rect(28, sh - 34, sw - 56, 12, 6, '#ffffff', 'fill-opacity=".08"');
    return s;
  },
};

/* ============================================================
   设备外壳
   ============================================================ */

const DEVICES = {
  ios: {
    ow: 420, oh: 862, sx: 14, sy: 14, sw: 392, sh: 834, r: 52, sr: 44,
    extra: (ow, oh) =>
      rect(ow / 2 - 58, 34, 116, 30, 15, '#000') + circle(ow / 2 + 34, 49, 6, '#12161f'),
  },
  android: {
    ow: 404, oh: 848, sx: 12, sy: 12, sw: 380, sh: 824, r: 40, sr: 32,
    extra: (ow) => circle(ow / 2, 34, 7, '#0b0d12') + circle(ow / 2, 34, 3, '#1b2029'),
  },
  web: {
    ow: 1180, oh: 760, sx: 0, sy: 58, sw: 1180, sh: 702, r: 16, sr: 0,
    extra: (ow) =>
      rect(0, 0, ow, 58, 0, '#ffffff', 'fill-opacity=".07"') +
      ['#FF5F57', '#FEBC2E', '#28C840'].map((c, i) => circle(30 + i * 22, 29, 6.5, c)).join('') +
      rect(ow * 0.22, 15, ow * 0.56, 28, 14, '#ffffff', 'fill-opacity=".08"') +
      text(ow * 0.25, 34, 'https://', 12, '#fff', { op: 0.45, font: MONO }),
  },
  macos: {
    ow: 1120, oh: 720, sx: 0, sy: 46, sw: 1120, sh: 674, r: 14, sr: 0,
    extra: (ow) =>
      rect(0, 0, ow, 46, 0, '#ffffff', 'fill-opacity=".07"') +
      ['#FF5F57', '#FEBC2E', '#28C840'].map((c, i) => circle(26 + i * 20, 23, 6, c)).join('') +
      text(ow / 2, 28, 'FocusDeck', 13, '#fff', { anchor: 'middle', op: 0.5, weight: 600 }),
  },
};

function deviceSvg(platform, kind, accent, variant) {
  const d = DEVICES[platform] || DEVICES.web;
  const draw = SCREENS[kind] || SCREENS.feed;
  const inner = draw(d.sw, d.sh, accent, variant);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${d.ow} ${d.oh}" width="${d.ow}" height="${d.oh}">
  <defs>
    <clipPath id="scr"><rect x="${d.sx}" y="${d.sy}" width="${d.sw}" height="${d.sh}" rx="${d.sr}"/></clipPath>
    <linearGradient id="body" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#2A3040"/><stop offset="1" stop-color="#12151D"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="${d.ow}" height="${d.oh}" rx="${d.r}" fill="url(#body)"/>
  <rect x="${d.sx}" y="${d.sy}" width="${d.sw}" height="${d.sh}" rx="${d.sr}" fill="#0E1116"/>
  <g clip-path="url(#scr)">${inner}</g>
  ${d.extra(d.ow, d.oh)}
  <rect x="0.5" y="0.5" width="${d.ow - 1}" height="${d.oh - 1}" rx="${d.r}" fill="none" stroke="#ffffff" stroke-opacity=".14"/>
</svg>`;
}

/* 把设备 SVG 嵌进画布（缩放居中），外面套背景 */
function canvas({ w, h, deviceMarkup, dw, dh, scale, accent, title, subtitle, ratio }) {
  const x = (w - dw * scale) / 2;
  const y = (h - dh * scale) / 2 + (title ? -h * 0.02 : 0);
  const bg = `<defs>
    <linearGradient id="cbg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${accent}" stop-opacity=".22"/>
      <stop offset="1" stop-color="${accent}" stop-opacity=".02"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="45%" r="60%">
      <stop offset="0" stop-color="${accent}" stop-opacity=".30"/>
      <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
      <circle cx="1.5" cy="1.5" r="1.4" fill="#ffffff" fill-opacity=".10"/>
    </pattern>
  </defs>
  <rect width="${w}" height="${h}" fill="#0A0C10"/>
  <rect width="${w}" height="${h}" fill="url(#cbg)"/>
  <rect width="${w}" height="${h}" fill="url(#grid)"/>
  <rect width="${w}" height="${h}" fill="url(#glow)"/>`;

  const caption = title
    ? `<g>${text(64, h - 92, title, Math.round(h * 0.062), '#fff', { weight: 700 })}
       ${subtitle ? text(65, h - 52, subtitle, Math.round(h * 0.038), '#fff', { op: 0.55 }) : ''}</g>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  ${bg}
  <g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${scale})" filter="none">
    <g opacity="0.35" transform="translate(0 14)"><rect x="6" y="6" width="${dw}" height="${dh}" rx="${dw * 0.06}" fill="#000"/></g>
    ${deviceMarkup}
  </g>
  ${caption}
</svg>`;
}

function writeIfAbsent(file, content) {
  if (existsSync(file)) {
    console.log(`跳过（已存在）：${file.replace(`${root}/`, '')}`);
    return false;
  }
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content, 'utf8');
  console.log(`生成：${file.replace(`${root}/`, '')}`);
  return true;
}

let created = 0;
for (const p of Array.isArray(products) ? products : []) {
  const platform = (p.platforms?.[0] || p.category || 'web').toLowerCase();
  const accent = p.accent || A1;
  const kind = p.mockup?.kind || 'feed';
  const title = p.mockup?.title || p.name;
  const sub = p.mockup?.subtitle || p.tagline || '';

  const dev = { ios: [420, 862], android: [404, 848], web: [1180, 760], macos: [1120, 720] }[platform] || [1180, 760];
  const base = deviceSvg(platform, kind, accent, 0);

  const mk = (w, h, scaleRatio, withCaption, variant = 0) =>
    canvas({
      w, h, dw: dev[0], dh: dev[1],
      scale: Math.min((w * scaleRatio) / dev[0], (h * scaleRatio) / dev[1]),
      accent, title: withCaption ? title : null, subtitle: withCaption ? sub : null,
      deviceMarkup: deviceSvg(platform, kind, accent, variant),
    });

  // cover 带标题文字；poster 用于详情头图（页面自己会叠标题），保持纯净
  if (writeIfAbsent(join(imgDir, p.id, 'cover.svg'), mk(1600, 1067, 0.52, false))) created += 1;
  if (writeIfAbsent(join(imgDir, p.id, 'poster.svg'), mk(1920, 1080, 0.62, false))) created += 1;
  for (let i = 1; i <= 3; i += 1) {
    if (writeIfAbsent(join(imgDir, p.id, `shot-0${i}.svg`), mk(1280, 800, 0.82, false, i - 1))) created += 1;
  }
  void base;
}

console.log(`\n完成，新增 ${created} 个文件。`);
