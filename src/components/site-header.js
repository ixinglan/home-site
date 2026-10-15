/** 顶部导航：品牌 + 主导航 + 外链 + 主题开关 */
import { h, qs, mount } from '../core/dom.js';
import { state } from '../core/config.js';
import { icon } from '../core/icons.js';
import { toggleTheme } from '../core/theme.js';

export function renderHeader() {
  const host = qs('#site-header');
  const brand = state.site?.brand || {};

  const mark = brand.logo
    ? h('img', { class: 'brand__mark', src: brand.logo, alt: brand.name || '' })
    : h('span', { class: 'brand__mark', text: (brand.shortName || brand.name || 'P').slice(0, 2) });

  const extLinks = (state.navigation?.external || []).map((item) =>
    h(
      'a',
      {
        class: 'nav__link nav__link--external',
        href: item.href,
        target: item.external ? '_blank' : null,
        rel: item.external ? 'noopener noreferrer' : null,
      },
      h('span', { text: item.label }),
      h('span', { class: 'nav__ext-icon', html: icon('external') })
    )
  );

  const navLinks = (state.navigation?.primary || [])
    .map((item) => h('a', { class: 'nav__link', href: item.href || '#', text: item.label }))
    .concat(extLinks);

  const external = (state.navigation?.secondary || []).map((item) =>
    h('a', {
      class: 'icon-btn',
      href: item.href,
      target: item.external ? '_blank' : null,
      rel: item.external ? 'noopener noreferrer' : null,
      'aria-label': item.label,
      title: item.label,
      html: icon(item.icon || 'link'),
    })
  );

  const themeBtn = h('button', {
    class: 'icon-btn theme-toggle',
    type: 'button',
    'aria-label': '切换明暗主题',
    title: '切换明暗主题',
    html: icon('sun', 'icon-sun') + icon('moon', 'icon-moon'),
    onclick: toggleTheme,
  });

  mount(
    host,
    h(
      'div',
      { class: 'container header-inner' },
      h('a', { class: 'brand', href: '#top' }, mark, h('span', { class: 'brand__name', text: brand.name || '我的产品' }), brand.tagline ? h('span', { class: 'brand__tag', text: brand.tagline }) : null),
      h('nav', { class: 'nav', 'aria-label': '主导航' }, navLinks),
      h('div', { class: 'header-actions' }, external, themeBtn)
    )
  );

  // 滚动后显示分隔线
  const onScroll = () => {
    host.classList.toggle('is-scrolled', window.scrollY > 8);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}
