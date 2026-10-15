/**
 * 入口：加载配置 → 渲染各区块 → 启动路由
 */
import './styles/tokens.css';
import './styles/themes.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/extras.css';
import './styles/hero.css';
import './styles/detail.css';

import { h, qs, mount } from './core/dom.js';
import { loadConfig, state, productById } from './core/config.js';
import { applySiteTheme, initSystemWatch } from './core/theme.js';
import { onRoute, startRouter, goHome } from './core/router.js';

import { initBackground } from './components/background.js';
import { initChrome } from './components/chrome.js';
import { renderHeader } from './components/site-header.js';
import { renderHero } from './components/hero.js';
import { renderProducts } from './components/product-grid.js';
import { renderAbout } from './components/about.js';
import { renderSites } from './components/sites.js';
import { renderFooter } from './components/site-footer.js';
import { initProductPage, openProductPage, closeProductPage } from './components/product-page.js';

/** 用配置覆盖 <head> 里的 SEO 信息 */
function applyMeta(site) {
  const meta = site?.meta || {};
  const brand = site?.brand || {};

  if (meta.title || brand.name) document.title = meta.title || brand.name;

  /** 按属性名精确匹配，没有就新建 */
  const setMeta = (attr, key, content) => {
    if (!content) return;
    let el = document.head.querySelector(`meta[${attr}="${key}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, key);
      document.head.append(el);
    }
    el.setAttribute('content', content);
  };

  setMeta('name', 'description', meta.description);
  setMeta('name', 'keywords', Array.isArray(meta.keywords) ? meta.keywords.join(', ') : meta.keywords);
  setMeta('name', 'author', meta.author);
  setMeta('property', 'og:title', meta.title || brand.name);
  setMeta('property', 'og:description', meta.description);
  setMeta('property', 'og:type', 'website');
  setMeta('name', 'twitter:card', 'summary_large_image');

  // og:image 必须是绝对地址，社交平台才抓得到；配置里写相对路径时用 meta.url 兜底补全
  if (meta.ogImage) {
    let og = meta.ogImage;
    try {
      og = new URL(og, meta.url || location.origin).href;
    } catch {
      /* 解析失败就用原值 */
    }
    setMeta('property', 'og:image', og);
  }

  if (meta.favicon) {
    const link = document.querySelector('link[rel="icon"]');
    if (link) link.href = meta.favicon;
  }
}

function renderBootError(err) {
  console.error('[my-products] 启动失败：', err);
  mount(
    qs('#app'),
    h(
      'div',
      { class: 'container' },
      h(
        'div',
        { class: 'boot-error' },
        h('h2', { text: '配置加载失败' }),
        h('p', { text: '请确认 public/data/ 下的四个 JSON 文件存在且格式正确。' }),
        h('p', {}, h('code', { text: String(err?.message || err) }))
      )
    )
  );
}

function handleRoute(route) {
  if (route.name === 'product') {
    const product = productById(route.id);
    if (product) openProductPage(product);
    else goHome();
  } else {
    closeProductPage();
  }
}

async function boot() {
  try {
    await loadConfig();
  } catch (err) {
    renderBootError(err);
    return;
  }

  applyMeta(state.site);
  applySiteTheme(state.site);
  initSystemWatch();

  renderHeader();
  renderHero();
  renderProducts();
  renderSites();
  renderAbout();
  renderFooter();

  initBackground();
  initChrome();
  initProductPage();

  onRoute(handleRoute);
  startRouter();

  // 页面内容由 JS 渲染，浏览器在加载时对 #products 这类原生锚点的定位会落空，
  // 这里在渲染完成后补一次定位（hash 路由 #/ 开头的除外）。
  const initialHash = location.hash;
  if (initialHash && !initialHash.startsWith('#/')) {
    qs(initialHash)?.scrollIntoView();
  }
}

boot();
