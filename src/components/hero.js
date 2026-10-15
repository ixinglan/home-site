/** 首屏：左侧逐字文案 + 右侧卡通角色（跟随鼠标） */
import { h, qs, mount } from '../core/dom.js';
import { state } from '../core/config.js';
import { icon } from '../core/icons.js';
import { revealOnScroll, prefersReducedMotion } from '../core/motion.js';
import { magnetize } from './chrome.js';
import { createMascot, createHeroBlobs } from './mascot.js';

/** 标题按字符拆分：highlight 子串带渐变色，每个字错峰上浮 */
function charNodes(headline, highlight) {
  const hlStart = highlight ? headline.indexOf(highlight) : -1;
  const hlEnd = hlStart >= 0 ? hlStart + highlight.length : -1;
  return [...headline].map((ch, idx) => {
    const accent = idx >= hlStart && idx < hlEnd;
    return h(
      'span',
      { class: `char${accent ? ' char--accent' : ''}` },
      h('span', { class: 'char__inner', text: ch, style: { '--char-delay': `${idx * 26}ms` } })
    );
  });
}

export function renderHero() {
  const host = qs('#hero');
  const hero = state.site?.hero || {};
  const brand = state.site?.brand || {};

  const headline = hero.headline || brand.slogan || brand.name || '我的产品';
  const eyebrow = hero.eyebrow || brand.tagline || '独立开发';

  const ctaButtons = [];
  if (hero.primaryCta?.label) {
    const btn = h(
      'a',
      { class: 'btn btn--primary', href: hero.primaryCta.href || '#products' },
      h('span', { text: hero.primaryCta.label }),
      h('span', { html: icon('arrowRight') })
    );
    ctaButtons.push(btn);
    magnetize(btn, 0.22);
  }
  if (hero.secondaryCta?.label) {
    ctaButtons.push(
      h('a', { class: 'btn btn--ghost', href: hero.secondaryCta.href || '#about', text: hero.secondaryCta.label })
    );
  }

  const eyebrowEl = h('div', { class: 'hero__eyebrow' }, h('span', { class: 'hero__dot' }), h('span', { text: eyebrow }));
  const titleEl = h('h1', { class: 'hero__title' }, charNodes(headline, hero.highlight));
  const subEl = hero.subheadline ? h('p', { class: 'hero__sub', text: hero.subheadline }) : null;
  const ctaEl = ctaButtons.length ? h('div', { class: 'hero__cta' }, ctaButtons) : null;

  const art = createMascot();

  mount(
    host,
    h(
      'div',
      { class: 'container hero' },
      createHeroBlobs(),
      h(
        'div',
        { class: 'hero__grid' },
        h('div', { class: 'hero__copy' }, eyebrowEl, titleEl, subEl, ctaEl),
        h('div', { class: 'hero__art' }, art)
      )
    ),
    h('div', { class: 'hero__scroll' }, h('span', { text: 'SCROLL' }), h('span', {}))
  );

  revealOnScroll([eyebrowEl, subEl, ctaEl, art].filter(Boolean), { delayStep: 80, delayStart: 320 });

  if (prefersReducedMotion()) {
    titleEl.querySelectorAll('.char__inner').forEach((el) => (el.style.transform = 'none'));
  }
}
