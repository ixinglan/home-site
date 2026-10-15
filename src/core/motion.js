/**
 * 动效工具：滚动揭示 + 数字滚动 + 降级判断
 */
export const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let observer = null;

function getObserver() {
  if (observer) return observer;
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
  );
  return observer;
}

/** 让进入视口的元素带上 .is-visible；支持 delay 参数做错峰 */
export function revealOnScroll(nodes, { delayStep = 60, delayStart = 0 } = {}) {
  const list = Array.isArray(nodes) ? nodes : [nodes];
  if (prefersReducedMotion()) {
    list.forEach((n) => n?.classList.add('is-visible'));
    return;
  }
  const io = getObserver();
  list.forEach((node, i) => {
    if (!node) return;
    node.classList.add('reveal');
    if (delayStep) node.style.setProperty('--reveal-delay', `${delayStart + i * delayStep}ms`);
    io.observe(node);
  });
}

/** 数字滚动：只对数值生效，字符串直接显示 */
export function countUp(el, value, duration = 900) {
  const target = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(target)) {
    el.textContent = String(value);
    return;
  }
  if (prefersReducedMotion()) {
    el.textContent = formatNumber(target);
    return;
  }
  const start = performance.now();
  const tick = (now) => {
    const p = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = formatNumber(Math.round(target * eased));
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

export function formatNumber(n) {
  return new Intl.NumberFormat('zh-CN').format(n);
}
