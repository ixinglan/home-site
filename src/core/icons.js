/**
 * 极简图标库：内联 SVG 字符串，颜色随 currentColor 变化。
 * 用法：icon('github') 或 icon('sun', 'icon-sun')
 */
const PATHS = {
  // 平台 / 分类
  grid: '<rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18z"/>',
  phone: '<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10.5 18.5h3"/>',
  android:
    '<path d="M4.5 13a7.5 7.5 0 0 1 15 0v3.5a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2z"/><path d="M8 6 6.5 8.5M16 6l1.5 2.5"/><circle cx="9.6" cy="12.2" r=".9" fill="currentColor" stroke="none"/><circle cx="14.4" cy="12.2" r=".9" fill="currentColor" stroke="none"/>',
  desktop: '<rect x="2.5" y="4" width="19" height="12.5" rx="2"/><path d="M8 21h8M12 16.5V21"/>',
  // Java：一杯冒着热气的咖啡
  java:
    '<path d="M4 8h12v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M16 9.5h1.5a2.5 2.5 0 0 1 0 5H16"/><path d="M7 4.5c.8-.9-.8-1.6 0-2.5M11 4.5c.8-.9-.8-1.6 0-2.5"/><path d="M4 21h13"/>',

  // 界面
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  close: '<path d="M18 6 6 18M6 6l12 12"/>',
  arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  arrowDown: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  external:
    '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  sparkles: '<path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 17.5v.01M20.5 21l.9-2.1 2.1-.9"/>',
  code: '<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>',

  // 外链 / 社交
  github:
    '<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2.5 7 9.5 6 9.5-6"/>',
  website: '<circle cx="12" cy="12" r="9"/><path d="M3.6 9h16.8M3.6 15h16.8"/><path d="M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18z"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5M12 15V3"/>',
  appstore:
    '<path d="M6.5 2 4.5 6v13.5a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5V6l-2-4z"/><path d="M4.5 6h15"/><path d="M16 10.5a4 4 0 0 1-8 0"/>',
  testflight: '<path d="M21 3 3 10.5l7 2.5 2.5 7z"/><path d="M21 3 10 14"/>',
  message:
    '<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.9 8.9 0 0 1-4-.9L3 21l1.9-4.6A8.4 8.4 0 0 1 12 3.1a8.4 8.4 0 0 1 9 8.4z"/>',
  x: '<path d="M18 2h3.5l-7.6 8.7L22.5 22h-7l-5.5-7.2L4 22H.5l8.1-9.3L1.5 2H8l5 6.6z"/>',
  // bilibili：小电视
  bilibili:
    '<rect x="2.5" y="6.5" width="19" height="13" rx="3"/><path d="M7.5 3 10.5 6.5M16.5 3 13.5 6.5"/><path d="M8.75 11v3M15.25 11v3"/><path d="M9.5 15.5h5"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.5 1.5"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.5-1.5"/>',
};

/** 生成 svg 字符串 */
export function icon(name, extraClass = '') {
  const path = PATHS[name] || PATHS.link;
  const cls = ['icon', extraClass].filter(Boolean).join(' ');
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
}

/** 链接类型 → 图标名 */
export function linkIcon(type) {
  const map = {
    github: 'github',
    website: 'website',
    web: 'website',
    appstore: 'appstore',
    testflight: 'testflight',
    download: 'download',
    mail: 'mail',
    email: 'mail',
    wechat: 'message',
    x: 'x',
    twitter: 'x',
  };
  return map[type] || 'link';
}

export const hasIcon = (name) => Boolean(PATHS[name]);
