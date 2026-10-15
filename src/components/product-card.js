/** 单个产品卡片：3D 倾斜 + 鼠标跟随高光 + View Transitions 共享元素 */
import { h } from '../core/dom.js';
import { categoryById, assetUrl } from '../core/config.js';
import { icon } from '../core/icons.js';
import { STATUS_LABEL } from '../core/schema.js';

export function productCard(product) {
  const cat = categoryById(product.category);
  const catLabel = cat?.label || product.category;
  const catIcon = cat?.icon || 'grid';

  const initial = String(product.name || '?').trim().charAt(0).toUpperCase();

  const fallback = h('div', { class: 'card__fallback', 'aria-hidden': 'true' }, h('span', { text: initial }));

  const media = h(
    'div',
    { class: 'card__media' },
    fallback,
    product.media?.cover
      ? h('img', {
          src: assetUrl(product.media.cover),
          alt: `${product.name} 封面`,
          loading: 'lazy',
          decoding: 'async',
          onerror: (e) => {
            e.currentTarget.style.display = 'none';
          },
        })
      : null,
    h('span', { class: 'card__platform' }, h('span', { html: icon(catIcon) }), h('span', { text: catLabel }))
  );

  // 共享元素：卡片封面 → 详情头图，卡片名 → 详情标题
  const heroName = `p-hero-${product.id}`;
  const titleName = `p-title-${product.id}`;
  media.style.viewTransitionName = heroName;
  media.dataset.vtHero = heroName;

  const nameEl = h('h3', { class: 'card__name', text: product.name });
  nameEl.style.viewTransitionName = titleName;
  nameEl.dataset.vtTitle = titleName;

  const tags = (product.tags || []).slice(0, 3).map((t) => h('span', { class: 'tag', text: t }));

  const card = h(
    'a',
    {
      class: `card${product.featured ? ' card--featured' : ''}`,
      href: `#/product/${encodeURIComponent(product.id)}`,
      'aria-label': `查看 ${product.name} 详情`,
      style: product.accent ? { '--card-accent': product.accent } : null,
      onmousemove: (e) => {
        const el = e.currentTarget;
        const rect = el.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        el.style.setProperty('--mx', `${e.clientX - rect.left}px`);
        el.style.setProperty('--my', `${e.clientY - rect.top}px`);
        el.style.setProperty('--ry', `${(px * 5).toFixed(2)}deg`);
        el.style.setProperty('--rx', `${(-py * 5).toFixed(2)}deg`);
      },
      onmouseleave: (e) => {
        const el = e.currentTarget;
        el.style.setProperty('--rx', '0deg');
        el.style.setProperty('--ry', '0deg');
      },
    },
    media,
    h(
      'div',
      { class: 'card__body' },
      h(
        'div',
        { class: 'card__top' },
        nameEl,
        h('span', { class: `badge badge--${product.status}`, text: STATUS_LABEL[product.status] || product.status })
      ),
      h('p', { class: 'card__tagline', text: product.tagline || product.summary }),
      tags.length ? h('div', { class: 'card__foot' }, tags) : null
    )
  );

  return card;
}
