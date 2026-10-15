/** 产品展示区：区块标题 + 平台筛选 + 卡片栅格 */
import { h, qs, mount, clear } from '../core/dom.js';
import { state, inCategory } from '../core/config.js';
import { createFilter } from './category-filter.js';
import { productCard } from './product-card.js';
import { revealOnScroll } from '../core/motion.js';
import { icon } from '../core/icons.js';

export function renderProducts() {
  const host = qs('#products');
  const section = state.site?.sections?.products || {};

  const head = h(
    'div',
    { class: 'section-head' },
    h('span', { class: 'section-head__eyebrow', text: section.eyebrow || 'Products' }),
    h('h2', { class: 'section-head__title', text: section.title || '作品集' }),
    section.sub ? h('p', { class: 'section-head__sub', text: section.sub }) : null
  );

  const grid = h('div', { class: 'product-grid' });

  function paint(categoryId) {
    clear(grid);
    const list = state.products.filter((p) => inCategory(p, categoryId));

    if (!list.length) {
      grid.append(
        h(
          'div',
          { class: 'empty' },
          h('span', { html: icon('sparkles') }),
          h('p', { text: '这个平台还没有上架的作品，先去看看别的吧。' })
        )
      );
      grid.style.gridTemplateColumns = 'minmax(0, 1fr)';
      return;
    }

    grid.style.removeProperty('grid-template-columns');
    const cards = list.map((p) => productCard(p));
    grid.append(...cards);
    revealOnScroll(cards, { delayStep: 70 });
  }

  const filter = createFilter(paint);

  mount(host, h('div', { class: 'container' }, head, filter.el, grid));
  revealOnScroll([head]);
}
