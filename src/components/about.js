/** 关于我 */
import { h, qs, mount } from '../core/dom.js';
import { state } from '../core/config.js';
import { icon } from '../core/icons.js';
import { revealOnScroll } from '../core/motion.js';

export function renderAbout() {
  const host = qs('#about');
  const about = state.site?.about || {};
  const section = state.site?.sections?.about || {};

  if (!about.paragraphs?.length && !about.links?.length) {
    host.hidden = true;
    return;
  }
  host.hidden = false;

  const head = h(
    'div',
    { class: 'section-head' },
    h('span', { class: 'section-head__eyebrow', text: section.eyebrow || 'About' }),
    h('h2', { class: 'section-head__title', text: about.title || section.title || '关于我' })
  );

  const text = h(
    'div',
    { class: 'about__text' },
    (about.paragraphs || []).map((p) => h('p', { text: p }))
  );

  const links = h(
    'div',
    { class: 'about__links' },
    (about.links || []).map((link) =>
      h(
        'a',
        {
          class: 'about__link',
          href: link.href,
          target: link.external || link.href?.startsWith('http') ? '_blank' : null,
          rel: link.external || link.href?.startsWith('http') ? 'noopener noreferrer' : null,
        },
        h('span', { html: icon(link.icon || 'link') }),
        h('span', { text: link.label }),
        h('span', { class: 'mono', text: link.handle || '' })
      )
    )
  );

  mount(host, h('div', { class: 'container' }, head, h('div', { class: 'about__grid' }, text, links)));
  revealOnScroll([head, text, links], { delayStep: 80 });
}
