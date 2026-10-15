/** 平台筛选器 */
import { h } from '../core/dom.js';
import { state, inCategory } from '../core/config.js';
import { icon } from '../core/icons.js';

/**
 * @param {Function} onChange 切换分类时回调（传入分类 id）
 * @returns {{el: HTMLElement, setActive: Function}}
 */
export function createFilter(onChange) {
  const buttons = state.categories.map((cat) => {
    const count =
      cat.id === 'all'
        ? state.products.length
        : state.products.filter((p) => inCategory(p, cat.id)).length;

    const btn = h(
      'button',
      {
        class: 'chip',
        type: 'button',
        'aria-pressed': 'false',
        dataset: { cat: cat.id },
        onclick: () => setActive(cat.id),
      },
      h('span', { class: 'chip__icon', html: icon(cat.icon || 'grid') }),
      h('span', { text: cat.label }),
      h('span', { class: 'chip__count', text: String(count) })
    );
    return btn;
  });

  const el = h('div', { class: 'filters', role: 'group', 'aria-label': '按平台筛选' }, buttons);
  let active = 'all';

  function setActive(id) {
    active = id;
    buttons.forEach((btn) => {
      btn.setAttribute('aria-pressed', String(btn.dataset.cat === id));
    });
    onChange?.(id);
  }

  setActive('all');
  return { el, setActive, get active() { return active; } };
}
