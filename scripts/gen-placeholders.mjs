/**
 * 生成占位封面图
 * 从 products.json 读取产品，为每个产品生成 cover.svg(3:2) 与 poster.svg(16:9)，
 * 并从 site.config.json 生成社交分享图 og/cover.svg。
 *
 * 已存在的文件不会被覆盖 —— 放了真实截图后重跑本脚本是安全的。
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = join(root, 'public/data');
const imgDir = join(root, 'public/assets/images/products');
const ogDir = join(root, 'public/assets/og');

const products = JSON.parse(readFileSync(join(dataDir, 'products.json'), 'utf8'));
const site = JSON.parse(readFileSync(join(dataDir, 'site.config.json'), 'utf8'));

const A1 = '#3D6BFF';
const A2 = '#7B5CFF';

const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function art({ w, h, accent, accent2, initial, title, subtitle }) {
  const fs = Math.round(h * 0.42);
  const nameSize = Math.round(h * 0.078);
  const subSize = Math.round(h * 0.045);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${accent}"/>
      <stop offset="1" stop-color="${accent2}"/>
    </linearGradient>
    <pattern id="dots" width="40" height="40" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.6" fill="#ffffff" fill-opacity="0.16"/>
    </pattern>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <rect width="${w}" height="${h}" fill="url(#dots)"/>
  <text x="50%" y="46%" text-anchor="middle" dominant-baseline="central"
    font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="${fs}"
    font-weight="600" fill="#ffffff" fill-opacity="0.95">${esc(initial)}</text>
  <text x="56" y="${h - 96}" font-family="-apple-system, 'PingFang SC', sans-serif"
    font-size="${nameSize}" font-weight="600" fill="#ffffff" fill-opacity="0.95">${esc(title)}</text>
  <text x="58" y="${h - 48}" font-family="-apple-system, 'PingFang SC', sans-serif"
    font-size="${subSize}" fill="#ffffff" fill-opacity="0.7">${esc(subtitle)}</text>
</svg>
`;
}

function writeIfAbsent(file, content) {
  if (existsSync(file)) {
    console.log(`跳过（已存在）：${file.replace(root + '/', '')}`);
    return false;
  }
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content, 'utf8');
  console.log(`生成：${file.replace(root + '/', '')}`);
  return true;
}

let created = 0;

for (const p of Array.isArray(products) ? products : []) {
  const accent = p.accent || A1;
  const initial = String(p.name || '?').trim().charAt(0).toUpperCase();
  const label = p.tagline || p.summary || '';

  if (
    writeIfAbsent(
      join(imgDir, p.id, 'cover.svg'),
      art({ w: 1600, h: 1067, accent, accent2: A2, initial, title: p.name, subtitle: label })
    )
  )
    created += 1;

  if (
    writeIfAbsent(
      join(imgDir, p.id, 'poster.svg'),
      art({ w: 1920, h: 1080, accent, accent2: A2, initial, title: p.name, subtitle: label })
    )
  )
    created += 1;
}

const brand = site.brand || {};
if (
  writeIfAbsent(
    join(ogDir, 'cover.svg'),
    art({
      w: 1200,
      h: 630,
      accent: site.theme?.accent || A1,
      accent2: A2,
      initial: (brand.shortName || brand.name || 'P').slice(0, 2),
      title: brand.name || '我的产品',
      subtitle: brand.slogan || site.meta?.description || '',
    })
  )
)
  created += 1;

console.log(`\n完成，新增 ${created} 个文件。`);
