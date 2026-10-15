/** 页脚 */
import { h, qs, mount } from '../core/dom.js';
import { state } from '../core/config.js';

export function renderFooter() {
  const host = qs('#site-footer');
  const footer = state.site?.footer || {};
  const brand = state.site?.brand || {};

  const links = (footer.links || []).map((l) =>
    h('a', {
      href: l.href,
      target: l.href?.startsWith('http') ? '_blank' : null,
      rel: l.href?.startsWith('http') ? 'noopener noreferrer' : null,
      text: l.label,
    })
  );

  // 配置里可以写 {year}，运行时替换成当前年份；不配就自动拼一条
  const year = new Date().getFullYear();
  const copyright = footer.copyright
    ? String(footer.copyright).replace(/\{year\}/g, String(year))
    : `© ${year} ${brand.name || ''}`;

  mount(
    host,
    h(
      'div',
      { class: 'container footer-inner' },
      h('span', { text: copyright }),
      h(
        'div',
        { class: 'footer-links' },
        links,
        footer.icp ? h('span', { text: footer.icp }) : null
      )
    )
  );
}
