/**
 * 配置加载：四个 JSON 并联拉取 → 校验 → 归一化 → 存进 state
 * 内容放 public/data/，构建期不处理，部署后可直接改文案刷新生效。
 */
import {
  normalizeCategories,
  normalizeNavigation,
  normalizeProducts,
  normalizeSite,
  report,
} from './schema.js';

const BASE = import.meta.env.BASE_URL || './';
const DATA_DIR = `${BASE.endsWith('/') ? BASE : `${BASE}/`}data/`;

export const DATA_FILES = {
  site: 'site.config.json',
  products: 'products.json',
  categories: 'categories.json',
  navigation: 'navigation.json',
};

/** 全局状态：各组件直接读这里 */
export const state = {
  site: {},
  products: [],
  categories: [],
  navigation: {},
  byId: new Map(),
  loaded: false,
};

async function fetchJson(file) {
  const url = `${DATA_DIR}${file}`;
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`加载 ${file} 失败：HTTP ${res.status}`);
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error(`${file} 不是合法 JSON（${err.message}）`);
  }
}

export function categoryById(id) {
  return state.categories.find((c) => c.id === id);
}

/**
 * 资源路径解析：统一转成绝对 URL。
 * 关键点：CSS 变量里的 url() 会相对“使用它的样式表”解析（构建后是 /assets/），
 * 所以凡是喂给 CSS 的图片路径都必须先在这里转成绝对地址。
 */
export function assetUrl(path) {
  if (!path) return '';
  try {
    return new URL(path, document.baseURI).href;
  } catch {
    return path;
  }
}

export function productById(id) {
  return state.byId.get(id);
}

/** 平台判断：优先用 platforms 数组，兼容只填 category 的情况 */
export function inCategory(product, categoryId) {
  if (!categoryId || categoryId === 'all') return true;
  const list = Array.isArray(product.platforms) && product.platforms.length
    ? product.platforms
    : [product.category];
  return list.includes(categoryId);
}

export async function loadConfig() {
  const [siteRaw, productsRaw, categoriesRaw, navigationRaw] = await Promise.all([
    fetchJson(DATA_FILES.site),
    fetchJson(DATA_FILES.products),
    fetchJson(DATA_FILES.categories),
    fetchJson(DATA_FILES.navigation),
  ]);

  const site = normalizeSite(siteRaw);
  const { products, warnings: w1 } = normalizeProducts(productsRaw);
  const { categories, warnings: w2 } = normalizeCategories(categoriesRaw);
  const navigation = normalizeNavigation(navigationRaw);

  state.site = site;
  state.products = products;
  state.categories = categories;
  state.navigation = navigation;
  state.byId = new Map(products.map((p) => [p.id, p]));
  state.loaded = true;

  report([...w1, ...w2]);
  return state;
}
