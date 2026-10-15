/**
 * 截图放大预览（Lightbox）
 * - 挂到 document.body 直属：详情页是 position:fixed 的层叠上下文，放进去会被裁
 * - 键盘走 capture 阶段 + stopPropagation：Esc 关闭、←/→ 翻图（不循环）、Tab 焦点陷阱
 *   —— 这样详情页的 ←/→ 切产品绝不会被同时触发
 * - 背景隔离用 inert；body.is-locked 由详情页负责，这里打开时不抢、关闭时不解
 */
import { h, trapFocus } from '../core/dom.js';
import { icon } from '../core/icons.js';
import { centerFlow } from './product-page.js';

/** 需要被「背景化」的节点：详情页之外的站点主体 + 详情页本身 */
const INERT_SELECTOR = '#app, .site-header, .site-footer, #page-root';

let root = null;
let imgEl = null;
let counterEl = null;
let prevBtn = null;
let nextBtn = null;
let closeBtn = null;

let list = [];
let index = 0;
let flowEl = null;
let lastFocused = null;
let baseName = '';
let opened = false;

export const isLightboxOpen = () => opened;

/* ---------- DOM ---------- */
function ensureDom() {
  if (root) return;

  imgEl = h('img', { class: 'lightbox__img', alt: '', decoding: 'async', draggable: 'false' });
  counterEl = h('p', { class: 'lightbox__counter', 'aria-live': 'polite' });

  prevBtn = h(
    'button',
    {
      class: 'lightbox__nav lightbox__nav--prev',
      type: 'button',
      'aria-label': '上一张截图',
      onclick: (e) => {
        e.stopPropagation();
        step(-1);
      },
    },
    h('span', { html: icon('arrowRight') })
  );

  nextBtn = h(
    'button',
    {
      class: 'lightbox__nav lightbox__nav--next',
      type: 'button',
      'aria-label': '下一张截图',
      onclick: (e) => {
        e.stopPropagation();
        step(1);
      },
    },
    h('span', { html: icon('arrowRight') })
  );

  closeBtn = h(
    'button',
    {
      class: 'lightbox__close',
      type: 'button',
      'aria-label': '关闭放大预览（Esc）',
      onclick: (e) => {
        e.stopPropagation();
        close();
      },
    },
    h('span', { html: icon('close') })
  );

  root = h(
    'div',
    {
      class: 'lightbox',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-label': '截图放大预览',
      onclick: (e) => {
        // 点遮罩 / 图片外的空白区域关闭，点图片本身不关
        if (e.target === root || e.target.classList.contains('lightbox__stage')) close();
      },
    },
    h('div', { class: 'lightbox__stage' }, imgEl),
    h('div', { class: 'lightbox__bar' }, counterEl, prevBtn, nextBtn),
    closeBtn
  );

  document.body.append(root);
}

/* ---------- 渲染 ---------- */
function preload(i) {
  if (i < 0 || i >= list.length) return;
  const im = new Image();
  im.decoding = 'async';
  im.src = list[i];
}

function render() {
  const n = list.length;
  imgEl.src = list[index];
  imgEl.alt = `${baseName} 界面截图 第 ${index + 1} 张，共 ${n} 张`;
  counterEl.textContent = `${index + 1} / ${n}`;

  const multi = n > 1;
  prevBtn.hidden = !multi;
  nextBtn.hidden = !multi;
  // 不循环：到头就置灰，键盘方向键同样是 no-op
  prevBtn.disabled = index === 0;
  nextBtn.disabled = index === n - 1;

  if (flowEl) centerFlow(flowEl, index);
}

function step(dir) {
  const next = index + dir;
  if (next < 0 || next >= list.length) return;
  index = next;
  render();
  preload(index + 1);
  preload(index - 1);
}

/* ---------- 键盘（capture 阶段，抢在详情页之前） ---------- */
function onKeyDown(e) {
  if (!opened) return;
  if (e.key === 'Escape') {
    e.preventDefault();
    e.stopPropagation();
    close();
    return;
  }
  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
    e.preventDefault();
    e.stopPropagation();
    step(e.key === 'ArrowRight' ? 1 : -1);
    return;
  }
  if (e.key === 'Tab') {
    e.stopPropagation();
    trapFocus(root, e);
  }
}

document.addEventListener('keydown', onKeyDown, true);

/* ---------- 打开 / 关闭 ---------- */
export function openLightbox(items, startIndex = 0, trigger = null) {
  const next = Array.isArray(items) ? items.filter(Boolean) : [];
  if (!next.length) return;

  ensureDom();
  list = next;
  index = Math.max(0, Math.min(Number(startIndex) || 0, list.length - 1));

  if (!opened) {
    lastFocused = trigger || document.activeElement;
    flowEl = trigger?.closest?.('.flow') || null;
    baseName =
      trigger?.closest?.('.ppage')?.querySelector('.ppage__title')?.textContent?.trim() || '产品';
    document.body.classList.add('is-locked');
  }

  render();

  if (!opened) {
    // 背景隔离：inert 同时挡住交互与读屏，比 aria-hidden 稳妥
    document.querySelectorAll(INERT_SELECTOR).forEach((n) => n.setAttribute('inert', ''));
    opened = true;
    root.classList.add('is-open');
    requestAnimationFrame(() => closeBtn?.focus());
  }

  preload(index + 1);
  preload(index - 1);
}

export function closeLightbox() {
  close();
}

function close() {
  if (!opened) return;
  opened = false;
  root.classList.remove('is-open');

  // 顺序很重要：先解除背景 inert，再把焦点还回去（inert 期间 focus 会被忽略）
  document.querySelectorAll(INERT_SELECTOR).forEach((n) => n.removeAttribute('inert'));

  const back =
    lastFocused && document.contains(lastFocused)
      ? lastFocused
      : document.querySelector('.ppage__close');
  back?.focus?.();

  lastFocused = null;
  flowEl = null;
}
