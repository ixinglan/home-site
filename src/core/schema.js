/**
 * 配置校验与归一化
 * 目标：字段缺失只告警并跳过该产品，绝不让整站白屏。
 */

export const PRODUCT_REQUIRED = ['id', 'name', 'category', 'summary'];

const STATUS_VALUES = ['released', 'beta', 'wip', 'archived'];

export const STATUS_LABEL = {
  released: '已发布',
  beta: '测试中',
  wip: '开发中',
  archived: '已归档',
};

const DEFAULTS = {
  status: 'released',
  featured: false,
  order: 999,
  version: '',
  releaseDate: '',
  accent: '',
  tagline: '',
  description: '',
  tags: [],
  highlights: [],
  links: [],
  metrics: [],
  platforms: [],
};

/** 校验并补默认值，返回 { products, warnings } */
export function normalizeProducts(raw) {
  const list = Array.isArray(raw) ? raw : raw?.items;
  if (!Array.isArray(list)) {
    return { products: [], warnings: ['products.json 内容不是数组，已忽略全部产品'] };
  }

  const warnings = [];
  const products = [];
  const seen = new Set();

  list.forEach((item, index) => {
    if (!item || typeof item !== 'object') {
      warnings.push(`products.json 第 ${index + 1} 项不是对象，已跳过`);
      return;
    }
    const missing = PRODUCT_REQUIRED.filter((k) => !item[k]);
    if (missing.length) {
      warnings.push(`产品「${item.name || item.id || `#${index + 1}`}」缺少必填字段：${missing.join(', ')}，已跳过`);
      return;
    }
    if (seen.has(item.id)) {
      warnings.push(`产品 id 重复：${item.id}，已跳过`);
      return;
    }
    seen.add(item.id);

    const status = STATUS_VALUES.includes(item.status) ? item.status : DEFAULTS.status;
    const platforms = Array.isArray(item.platforms) && item.platforms.length
      ? item.platforms
      : [item.category];

    products.push({
      ...DEFAULTS,
      ...item,
      status,
      platforms,
      tags: Array.isArray(item.tags) ? item.tags : [],
      highlights: Array.isArray(item.highlights) ? item.highlights : [],
      links: (Array.isArray(item.links) ? item.links : []).filter((l) => l && l.href),
      metrics: Array.isArray(item.metrics) ? item.metrics : [],
      media: item.media || {},
    });
  });

  products.sort((a, b) => {
    if (Boolean(b.featured) !== Boolean(a.featured)) return b.featured ? 1 : -1;
    if (a.order !== b.order) return a.order - b.order;
    return String(a.name).localeCompare(String(b.name));
  });

  return { products, warnings };
}

/** 分类校验 */
export function normalizeCategories(raw) {
  const list = Array.isArray(raw) ? raw : raw?.items;
  if (!Array.isArray(list) || !list.length) {
    return { categories: [{ id: 'all', label: '全部', icon: 'grid', order: 0 }], warnings: [] };
  }
  const warnings = [];
  const categories = list
    .filter((c) => {
      if (!c || !c.id) {
        warnings.push('categories.json 存在缺少 id 的分类，已跳过');
        return false;
      }
      return true;
    })
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  return { categories, warnings };
}

/** 站点配置兜底 */
export function normalizeSite(raw) {
  const site = raw && typeof raw === 'object' ? raw : {};
  return {
    ...site,
    meta: site.meta || {},
    brand: site.brand || {},
    hero: site.hero || {},
    theme: site.theme || {},
    features: { showStats: true, showTimeline: true, enableDrawer: true, showGallery: true, ...(site.features || {}) },
    stats: Array.isArray(site.stats) ? site.stats : [],
    about: site.about || {},
    footer: site.footer || {},
    sites: Array.isArray(site.sites) ? site.sites.filter((s) => s && s.url) : [],
    sections: site.sections || {},
  };
}

export function normalizeNavigation(raw) {
  const nav = raw && typeof raw === 'object' ? raw : {};
  return {
    primary: Array.isArray(nav.primary) ? nav.primary : [],
    secondary: Array.isArray(nav.secondary) ? nav.secondary : [],
    external: Array.isArray(nav.external) ? nav.external : [],
    mobileQuick: Array.isArray(nav.mobileQuick) ? nav.mobileQuick : [],
  };
}

/** 打印所有告警（只在开发模式下啰嗦） */
export function report(warnings) {
  if (!warnings?.length) return;
  console.groupCollapsed(`[my-products] 配置校验：${warnings.length} 条提示`);
  warnings.forEach((w) => console.warn(w));
  console.groupEnd();
}
