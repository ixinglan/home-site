/**
 * 页面"镀铬件"：颗粒质感 / 滚动进度条 / 磁吸按钮
 * 光标不接管：平时跟随系统，悬浮在可交互元素上由 CSS 走原生小手（cursor: pointer）。
 */
import { h } from '../core/dom.js';
import { prefersReducedMotion } from '../core/motion.js';

const fine = () => window.matchMedia('(pointer: fine)').matches;

/** 磁吸：鼠标在按钮附近时按钮轻微跟随 */
export function magnetize(el, strength = 0.28) {
  if (!fine() || prefersReducedMotion()) return;
  el.addEventListener('mousemove', (e) => {
    const r = el.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    el.style.transition = 'transform .08s linear';
    el.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`;
  });
  el.addEventListener('mouseleave', () => {
    el.style.transition = 'transform .4s cubic-bezier(.22,.61,.36,1)';
    el.style.transform = '';
  });
}

export function initChrome() {
  /* ---- 颗粒质感 ---- */
  const noise =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.55'/%3E%3C/svg%3E";
  document.body.append(
    h('div', { class: 'grain', 'aria-hidden': 'true', style: { backgroundImage: `url("${noise}")` } })
  );

  /* ---- 滚动进度条 ---- */
  const bar = h('div', { class: 'scroll-progress', 'aria-hidden': 'true' });
  document.body.append(bar);
  const paintBar = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
  };
  window.addEventListener('scroll', paintBar, { passive: true });
  window.addEventListener('resize', paintBar);
  paintBar();
}
