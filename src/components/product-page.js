/**
 * 全屏产品详情页
 * - 卡片封面 → 详情头图：View Transitions 共享元素形变（不支持的浏览器自动降级为淡入）
 * - 截图画廊：横向 scroll-snap + 两侧缩小的 coverflow 效果；点图放大走 Lightbox
 * - 键盘：Esc 关闭，← / → 切换上/下一个产品（Lightbox 打开时让位给翻图）
 */
import { h, qs, mount, clear, trapFocus } from '../core/dom.js';
import { state, assetUrl } from '../core/config.js';
import { icon, linkIcon } from '../core/icons.js';
import { STATUS_LABEL } from '../core/schema.js';
import { goHome } from '../core/router.js';
import { prefersReducedMotion } from '../core/motion.js';
import { openLightbox, isLightboxOpen } from './lightbox.js';

const VT =
  typeof document !== 'undefined' &&
  typeof document.startViewTransition === 'function' &&
  !prefersReducedMotion();

/** 拖动超过这个位移（px）就认为用户是在滑画廊，不该触发放大 */
const DRAG_SLOP = 8;

let pageEl = null;
let scrollEl = null;
let heroImg = null;
let titleEl = null;
let tagEl = null;
let opened = false;
let closing = false;
let currentId = null;
let lastFocused = null;
let flowObserver = null;

/* ---------- 骨架（构建一次） ---------- */
export function initProductPage() {
  const root = qs('#page-root');
  if (!root) return;

  scrollEl = h('div', { class: 'ppage__scroll' });
  heroImg = h('img', { alt: '', decoding: 'async' });
  titleEl = h('h1', { class: 'ppage__title' });
  // 只建一次：fill() 里只改 textContent，否则每次切产品都会多出一个 <p>
  tagEl = h('p', { class: 'ppage__tag' });

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
    h('div', { class: 'ppage__hero-caption' }, titleEl, tagEl)
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

/**
 * 把第 index 张图推到容器可视正中。
 * 用 getBoundingClientRect 而不是 offsetLeft —— 后者的坐标系是 offsetParent，
 * 与 scrollLeft 不是同一套，算出来的 delta 天然带一个常量偏移（首图偏右的元凶）。
 * 已经居中（|delta| < 1px）时直接返回：不写 scrollLeft，免得和 scroll-snap 互相拉扯。
 */
export function centerFlow(flow, index = 0) {
  if (!flow) return;
  const items = flow.querySelectorAll('.flow__item');
  if (!items.length) return;
  const item = items[Math.max(0, Math.min(index, items.length - 1))];
  if (!item) return;

  const box = flow.getBoundingClientRect();
  const rect = item.getBoundingClientRect();
  const delta = rect.left + rect.width / 2 - (box.left + flow.clientWidth / 2);
  if (Math.abs(delta) < 1) return;
  flow.scrollTo({ left: flow.scrollLeft + delta, behavior: 'auto' });
}

function paintFlow(flow) {
  if (!flow) return;
  const items = Array.from(flow.querySelectorAll('.flow__item'));
  if (!items.length) return;

  const box = flow.getBoundingClientRect();
  const mid = box.left + flow.clientWidth / 2;

  let best = 0;
  let bestDist = Infinity;

  items.forEach((item, i) => {
    const rect = item.getBoundingClientRect();
    const dist = Math.abs(rect.left + rect.width / 2 - mid) / flow.clientWidth;
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }

    const t = Math.min(1, dist * 1.6);
    const isCenter = dist < 0.18;
    if (isCenter) {
      // 交回 CSS：内联 --s/--o 会盖掉 .is-center 的类样式，首图就是这样被压暗的
      item.style.removeProperty('--s');
      item.style.removeProperty('--o');
    } else {
      item.style.setProperty('--s', (1 - t * 0.1).toFixed(3));
      item.style.setProperty('--o', (1 - t * 0.5).toFixed(3));
    }
    item.classList.toggle('is-center', isCenter);
  });

  flow.dataset.idx = String(best);
}

/** 只在「宽度」变化时重新居中：iOS 地址栏收放只改高度，跟着跳会很难受 */
function observeFlow(flow) {
  if (typeof ResizeObserver === 'undefined') return;
  if (!flowObserver) {
    flowObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const target = entry.target;
        const w = entry.contentRect.width;
        const prev = Number(target.dataset.flowW || 0);
        if (Math.abs(w - prev) < 1) continue; // 纯高度变化，忽略
        target.dataset.flowW = String(w);
        if (isLightboxOpen()) continue; // Lightbox 开着时不要抢它的滚动位置
        centerFlow(target, Number(target.dataset.idx || 0));
        paintFlow(target);
      }
    });
  }
  flowObserver.disconnect();
  flowObserver.observe(flow);
}

/* ---------- 键盘 ---------- */
function onKeyDown(e) {
  if (!opened) return;
  // Lightbox 打开时 ←/→ 只翻图，绝不切产品（它那边是 capture + stopPropagation，这里是双保险）
  if (isLightboxOpen()) return;
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
    return;
  }
  // 详情页本身也是 aria-modal 对话框：Tab 不要跑出去
  trapFocus(pageEl, e);
}

/* ---------- 填充内容 ---------- */
function fill(product) {
  currentId = product.id;
  const body = pageEl.querySelector('.ppage__body');
  pageEl.style.setProperty('--card-accent', product.accent || '');

  heroImg.style.viewTransitionName = `p-hero-${product.id}`;
  titleEl.style.viewTransitionName = `p-title-${product.id}`;
  heroImg.src = assetUrl(product.media?.poster || product.media?.cover);
  heroImg.alt = `${product.name} 预览`;
  titleEl.textContent = product.name;

  // 复用同一个 <p>：只改文本，空 tagline 就整个隐藏，不留空节点占位
  const tagline = product.tagline || '';
  tagEl.textContent = tagline;
  tagEl.hidden = !tagline;

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
    const urls = gallery.map((src) => assetUrl(src));
    const total = urls.length;

    const flow = h(
      'div',
      { class: 'flow' },
      urls.map((url, i) =>
        h(
          'figure',
          { class: 'flow__item' },
          h(
            'button',
            {
              class: 'flow__zoom',
              type: 'button',
              'aria-haspopup': 'dialog',
              dataset: { index: String(i) },
              'aria-label': `放大查看 ${product.name} 界面截图 第 ${i + 1} 张（共 ${total} 张）`,
            },
            h('img', {
              src: url,
              alt: `${product.name} 界面截图 第 ${i + 1} 张`,
              loading: 'lazy',
              draggable: 'false',
            })
          )
        )
      )
    );

    // 横向拖动误触发：按下点位移超过阈值就不当作点击
    let pressAt = null;
    flow.addEventListener(
      'pointerdown',
      (e) => {
        pressAt = { x: e.clientX, y: e.clientY };
      },
      { passive: true }
    );
    flow.addEventListener('click', (e) => {
      const btn = e.target.closest?.('.flow__zoom');
      if (!btn) return;
      const from = pressAt;
      pressAt = null;
      if (from && Math.hypot(e.clientX - from.x, e.clientY - from.y) > DRAG_SLOP) return;
      openLightbox(urls, Number(btn.dataset.index || 0), btn);
    });

    flow.addEventListener('scroll', () => paintFlow(flow), { passive: true });
    body.append(
      h('div', {}, h('div', { class: 'ppage__section-label' }, h('span', { text: '界面预览 · 拖动查看' })), flow, h('div', { class: 'flow__hint', text: 'SCROLL →' }))
    );

    // 顺序：先把滚动位置归零（= 首图居中的不变量），再在下一帧校正 + 上色
    flow.scrollLeft = 0;
    requestAnimationFrame(() => {
      centerFlow(flow, 0);
      paintFlow(flow);
    });
    observeFlow(flow);
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
