/**
 * 全屏产品详情页
 * - 卡片封面 → 详情头图：View Transitions 共享元素形变（不支持的浏览器自动降级为淡入）
 * - 截图画廊：横向 scroll-snap + 两侧缩小的 coverflow 效果
 * - 键盘：Esc 关闭，← / → 切换上/下一个产品
 */
import { h, qs, mount, clear } from '../core/dom.js';
import { state, assetUrl } from '../core/config.js';
import { icon, linkIcon } from '../core/icons.js';
import { STATUS_LABEL } from '../core/schema.js';
import { goHome } from '../core/router.js';
import { prefersReducedMotion } from '../core/motion.js';

const VT =
  typeof document !== 'undefined' &&
  typeof document.startViewTransition === 'function' &&
  !prefersReducedMotion();

let pageEl = null;
let scrollEl = null;
let heroImg = null;
let titleEl = null;
let opened = false;
let closing = false;
let currentId = null;
let lastFocused = null;

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/* ---------- 骨架（构建一次） ---------- */
export function initProductPage() {
  const root = qs('#page-root');
  if (!root) return;

  scrollEl = h('div', { class: 'ppage__scroll' });
  heroImg = h('img', { alt: '', decoding: 'async' });
  titleEl = h('h1', { class: 'ppage__title' });

  const hero = h(
    'header',
    { class: 'ppage__hero' },
    h('div', { class: 'ppage__hero-media' }, heroImg),
    h(
      'button',
      {
        class: 'ppage__close',
        type: 'button',
        'aria-label': '关闭详情（Esc）',
        onclick: () => closeProductPage(),
      },
      h('span', { html: icon('close') }),
      h('span', { text: '关闭' })
    ),
    h(
      'div',
      { class: 'ppage__kbd' },
      h('kbd', { text: 'ESC 关闭' }),
      h('kbd', { text: '← → 切换' })
    ),
    h('div', { class: 'ppage__hero-caption' }, titleEl, h('p', { class: 'ppage__tag' }))
  );

  const body = h('div', { class: 'ppage__body' });

  pageEl = h('section', {
    class: 'ppage',
    role: 'dialog',
    'aria-modal': 'true',
    'aria-label': '产品详情',
  }, scrollEl);

  scrollEl.append(hero, body);
  mount(root, pageEl);

  scrollEl.addEventListener('scroll', onScroll, { passive: true });
  document.addEventListener('keydown', onKeyDown);
}

/* ---------- 滚动视差 ---------- */
function onScroll() {
  if (!opened) return;
  const y = scrollEl.scrollTop;
  heroImg.style.transform = `scale(1.08) translateY(${y * 0.16}px)`;
}

/* ---------- 画廊 coverflow ---------- */
function paintFlow(flow) {
  if (!flow) return;
  const items = flow.querySelectorAll('.flow__item');
  const mid = flow.scrollLeft + flow.clientWidth / 2;
  items.forEach((item) => {
    const c = item.offsetLeft + item.offsetWidth / 2;
    const dist = Math.abs(c - mid) / flow.clientWidth;
    const t = Math.min(1, dist * 1.6);
    item.style.setProperty('--s', (1 - t * 0.1).toFixed(3));
    item.style.setProperty('--o', (1 - t * 0.5).toFixed(3));
    item.classList.toggle('is-center', dist < 0.18);
  });
}

/* ---------- 键盘 ---------- */
function onKeyDown(e) {
  if (!opened) return;
  if (e.key === 'Escape') {
    e.preventDefault();
    closeProductPage();
    return;
  }
  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
    const idx = state.products.findIndex((p) => p.id === currentId);
    if (idx < 0) return;
    const next =
      e.key === 'ArrowRight'
        ? state.products[(idx + 1) % state.products.length]
        : state.products[(idx - 1 + state.products.length) % state.products.length];
    location.hash = `#/product/${encodeURIComponent(next.id)}`;
  }
}

function trapFocus(e) {
  const items = Array.from(pageEl.querySelectorAll(FOCUSABLE)).filter(
    (el) => el.offsetParent !== null
  );
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

/* ---------- 填充内容 ---------- */
function fill(product) {
  currentId = product.id;
  const body = pageEl.querySelector('.ppage__body');
  const caption = pageEl.querySelector('.ppage__hero-caption');
  pageEl.style.setProperty('--card-accent', product.accent || '');

  heroImg.style.viewTransitionName = `p-hero-${product.id}`;
  titleEl.style.viewTransitionName = `p-title-${product.id}`;
  heroImg.src = assetUrl(product.media?.poster || product.media?.cover);
  heroImg.alt = `${product.name} 预览`;
  titleEl.textContent = product.name;

  clear(caption.querySelectorAll('.ppage__tag'));
  caption.append(h('p', { class: 'ppage__tag', text: product.tagline || '' }));

  clear(body);

  // meta
  const cat = state.categories.find((c) => c.id === product.category);
  const meta = [cat?.label, product.version ? `v${product.version}` : null, product.releaseDate]
    .filter(Boolean);
  body.append(
    h(
      'div',
      { class: 'ppage__meta' },
      h('span', { class: `badge badge--${product.status}`, text: STATUS_LABEL[product.status] || '' }),
      meta.map((m) => h('span', { text: m }))
    )
  );

  // 描述
  if (product.description || product.summary) {
    body.append(h('p', { class: 'ppage__desc', text: product.description || product.summary }));
  }

  // 截图画廊
  const gallery = product.media?.gallery || [];
  if (state.site?.features?.showGallery !== false && gallery.length) {
    const flow = h(
      'div',
      { class: 'flow' },
      gallery.map((src) => h('figure', { class: 'flow__item' }, h('img', { src: assetUrl(src), alt: `${product.name} 界面截图`, loading: 'lazy' })))
    );
    flow.addEventListener('scroll', () => paintFlow(flow), { passive: true });
    body.append(
      h('div', {}, h('div', { class: 'ppage__section-label' }, h('span', { text: '界面预览 · 拖动查看' })), flow, h('div', { class: 'flow__hint', text: 'SCROLL →' }))
    );
    requestAnimationFrame(() => paintFlow(flow));
  }

  // 亮点
  if (product.highlights?.length) {
    body.append(
      h(
        'div',
        {},
        h('div', { class: 'ppage__section-label' }, h('span', { text: '为什么做它' })),
        h(
          'ol',
          { class: 'notes' },
          product.highlights.map((item) =>
            h(
              'li',
              {},
              h('span', { class: 'notes__num' }),
              h('div', {}, h('h4', { text: item.title }), item.desc ? h('p', { text: item.desc }) : null)
            )
          )
        )
      )
    );
  }

  // 技术栈
  if (product.tags?.length) {
    body.append(
      h(
        'div',
        {},
        h('div', { class: 'ppage__section-label' }, h('span', { text: '技术栈' })),
        h('div', { class: 'ppage__tags' }, product.tags.map((t) => h('span', { class: 'tag', text: t })))
      )
    );
  }

  // 数据
  if (product.metrics?.length) {
    body.append(
      h(
        'div',
        { class: 'ppage__stats' },
        product.metrics.map((m) =>
          h('div', { class: 'ppage__stat' }, h('b', { text: String(m.value) }), h('span', { text: m.label }))
        )
      )
    );
  }

  // 链接
  const links = product.links || [];
  if (links.length) {
    body.append(
      h(
        'div',
        { class: 'ppage__links' },
        links.map((link) =>
          h(
            'a',
            {
              class: `btn ${link.primary ? 'btn--primary' : 'btn--ghost'}`,
              href: link.href,
              target: link.href?.startsWith('http') ? '_blank' : null,
              rel: link.href?.startsWith('http') ? 'noopener noreferrer' : null,
            },
            h('span', { html: icon(linkIcon(link.type)) }),
            h('span', { text: link.label || link.type })
          )
        )
      )
    );
  }

  // 下一个产品
  const idx = state.products.findIndex((p) => p.id === product.id);
  const next = state.products[(idx + 1) % state.products.length];
  if (next && next.id !== product.id) {
    body.append(
      h(
        'a',
        {
          class: 'ppage__next',
          href: `#/product/${encodeURIComponent(next.id)}`,
          'aria-label': `下一个产品：${next.name}`,
          style: next.media?.cover ? { '--next-cover': `url("${assetUrl(next.media.cover)}")` } : null,
        },
        h(
          'span',
          {},
          h('span', { class: 'ppage__next-label', text: 'NEXT UP · 下一个' }),
          h('span', { class: 'ppage__next-name', text: next.name })
        ),
        h('span', { class: 'ppage__next-arrow', html: icon('arrowRight') })
      )
    );
  }
}

/* ---------- 打开 / 关闭 ---------- */
function show() {
  opened = true;
  pageEl.classList.add('is-open');
  document.body.classList.add('is-locked');
  scrollEl.scrollTop = 0;
  requestAnimationFrame(() => pageEl.querySelector('.ppage__close')?.focus());
}

function hide() {
  opened = false;
  currentId = null;
  pageEl.classList.remove('is-open');
  document.body.classList.remove('is-locked');
  // 关键：详情页隐藏后立即释放共享元素名，
  // 否则与恢复名字的卡片同名，View Transitions 会因重名中断
  heroImg.style.viewTransitionName = 'none';
  titleEl.style.viewTransitionName = 'none';
  if (lastFocused && document.contains(lastFocused)) lastFocused.focus();
  lastFocused = null;
}

export function openProductPage(product) {
  if (!pageEl) return;
  if (opened && currentId === product.id) return;

  if (!opened) lastFocused = document.activeElement;

  const apply = () => {
    setGridNames(false);
    fill(product);
    show();
  };

  if (VT && !opened) {
    document.startViewTransition(apply);
  } else {
    apply();
  }
}

export function closeProductPage() {
  if (!opened || closing) return;
  closing = true;

  const apply = () => {
    hide();
    setGridNames(true);
    closing = false;
  };

  if (VT) {
    document.startViewTransition(apply);
  } else {
    apply();
  }
  goHome();
}

export const isPageOpen = () => opened;

/** 供 product-grid 调用：打开详情时清掉卡片上的共享元素名，避免重名导致过渡中断 */
function setGridNames(on) {
  document.querySelectorAll('[data-vt-hero]').forEach((el) => {
    el.style.viewTransitionName = on ? el.dataset.vtHero : 'none';
  });
  document.querySelectorAll('[data-vt-title]').forEach((el) => {
    el.style.viewTransitionName = on ? el.dataset.vtTitle : 'none';
  });
}
