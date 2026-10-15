/** 外站入口区块：博客 / 面试题站 等 */
import { h, qs, mount } from '../core/dom.js';
import { state } from '../core/config.js';
import { icon } from '../core/icons.js';
import { revealOnScroll } from '../core/motion.js';

export function renderSites() {
  const host = qs('#sites');
  const sites = state.site?.sites || [];

  if (!sites.length) {
    host.hidden = true;
    return;
  }
  host.hidden = false;

  const section = state.site?.sections?.sites || {};

  const head = h(
    'div',
    { class: 'section-head' },
    h('span', { class: 'section-head__eyebrow', text: section.eyebrow || 'Elsewhere' }),
    h('h2', { class: 'section-head__title', text: section.title || '我也在写' }),
    section.sub ? h('p', { class: 'section-head__sub', text: section.sub }) : null
  );

  const cards = sites.map((s) =>
    h(
      'a',
      {
        class: 'site-card',
        href: s.url,
        target: '_blank',
        rel: 'noopener noreferrer',
        'aria-label': `打开 ${s.name}`,
        style: s.accent ? { '--card-accent': s.accent } : null,
      },
      h('span', { class: 'site-card__icon', html: icon(s.icon || 'website') }),
      h(
        'span',
        { class: 'site-card__main' },
        h('span', { class: 'site-card__name', text: s.name }),
        s.desc ? h('span', { class: 'site-card__desc', text: s.desc }) : null,
        h(
          'span',
          { class: 'site-card__meta' },
          h('span', { class: 'mono', text: s.label || hostOf(s.url) }),
          s.highlight ? h('span', { class: 'site-card__dot' }) : null,
          s.highlight ? h('span', { class: 'mono', text: s.highlight }) : null
        )
      ),
      h('span', { class: 'site-card__arrow', html: icon('external') })
    )
  );

  const grid = h('div', { class: 'sites-grid' }, cards);
  mount(host, h('div', { class: 'container' }, head, grid));
  revealOnScroll([head, ...cards], { delayStep: 80 });
}

function hostOf(url) {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}
