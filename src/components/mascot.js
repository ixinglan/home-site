/**
 * 首屏卡通角色：手绘扁平风，跟随鼠标
 * - 瞳孔跟随鼠标移动，头部轻微转向
 * - 漂浮元素分层视差（远的慢、近的快）
 * - 随机眨眼；鼠标移到角色上会挥手
 */
import { h, qs } from '../core/dom.js';
import { prefersReducedMotion } from '../core/motion.js';

const ART = `
<svg class="mascot__svg" viewBox="0 0 520 470" role="img" aria-label="一个戴着耳机写代码的卡通人物">
  <!-- 漂浮装饰：外层 g 由 JS 写视差，内层做上下浮动动画 -->
  <g data-depth="1.5" class="mascot__float">
    <g class="floaty floaty--a">
      <g transform="translate(56 96)">
        <path d="M0 22V4l14-4v18" fill="none" stroke="#7B5CFF" stroke-width="4.5" stroke-linecap="round"/>
        <circle cx="-1" cy="24" r="6" fill="#7B5CFF"/>
        <circle cx="13" cy="20" r="6" fill="#7B5CFF"/>
      </g>
    </g>
  </g>

  <g data-depth="1.0" class="mascot__float">
    <g class="floaty floaty--b">
      <text x="428" y="112" font-family="ui-monospace, Menlo, monospace" font-size="30" font-weight="700" fill="#3D6BFF" opacity=".55">{ }</text>
    </g>
  </g>

  <g data-depth="2.0" class="mascot__float">
    <g class="floaty floaty--c">
      <g transform="translate(452 300)">
        <circle cx="0" cy="0" r="15" fill="#FFB84D"/>
        <ellipse cx="0" cy="3" rx="26" ry="7" fill="none" stroke="#FFB84D" stroke-width="3.5" opacity=".8"/>
      </g>
    </g>
  </g>

  <g data-depth="0.7" class="mascot__float">
    <g class="floaty floaty--a">
      <path d="M96 300l26-9-26-9 6 9-6 9z" fill="#34D399" opacity=".8"/>
    </g>
  </g>

  <!-- 桌子 -->
  <rect x="26" y="352" width="470" height="15" rx="7.5" fill="#DDE3EE"/>
  <rect x="66" y="367" width="12" height="66" rx="6" fill="#CFD7E6"/>
  <rect x="444" y="367" width="12" height="66" rx="6" fill="#CFD7E6"/>

  <!-- 显示器 -->
  <g>
    <rect x="300" y="118" width="196" height="132" rx="14" fill="#1B2436"/>
    <rect x="312" y="130" width="172" height="108" rx="8" fill="#111A2B"/>
    <rect x="326" y="146" width="70" height="8" rx="4" fill="#3D6BFF"/>
    <rect x="326" y="164" width="112" height="8" rx="4" fill="#7B5CFF" opacity=".8"/>
    <rect x="338" y="182" width="86" height="8" rx="4" fill="#34D399" opacity=".75"/>
    <rect x="326" y="200" width="52" height="8" rx="4" fill="#FFB84D" opacity=".7"/>
    <rect x="386" y="235" width="60" height="7" rx="3.5" fill="#2B3245"/>
    <rect x="392" y="250" width="24" height="30" fill="#2B3245"/>
    <rect x="356" y="280" width="96" height="11" rx="5.5" fill="#2B3245"/>
  </g>

  <!-- 咖啡杯：挪到左手边 -->
  <g transform="translate(56 310)">
    <path d="M36 16h9a7 7 0 0 1 0 14H36" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round"/>
    <rect x="0" y="0" width="38" height="42" rx="7" fill="#FFFFFF"/>
    <rect x="0" y="0" width="38" height="12" rx="6" fill="#3D6BFF" opacity=".85"/>
    <g class="steam">
      <path d="M12 -6c5-6-5-10 0-17" fill="none" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" opacity=".6"/>
      <path d="M26 -4c5-6-5-10 0-16" fill="none" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" opacity=".45"/>
    </g>
  </g>

  <!-- 人物 -->
  <g class="mascot__body">
    <!-- 椅子靠背 -->
    <rect x="118" y="248" width="120" height="104" rx="26" fill="#2B3245" opacity=".18"/>

    <!-- 身体（卫衣） -->
    <path d="M112 352V266c0-34 26-58 62-58s62 24 62 58v86z" fill="#4C5FD7"/>
    <path d="M150 208l26 26 26-26" fill="none" stroke="#3B4BC0" stroke-width="7" stroke-linecap="round"/>
    <rect x="146" y="236" width="56" height="10" rx="5" fill="#3B4BC0" opacity=".7"/>

    <!-- 手臂：左臂搭在桌上 -->
    <path d="M124 268c-16 12-22 34-20 56l4 28" fill="none" stroke="#4C5FD7" stroke-width="26" stroke-linecap="round"/>
    <circle cx="110" cy="352" r="14" fill="#F5CBA7"/>

    <!-- 右臂（挥手） -->
    <g class="mascot__arm" transform="rotate(0 218 272)">
      <path d="M212 268c18 8 30 22 34 40" fill="none" stroke="#4C5FD7" stroke-width="26" stroke-linecap="round"/>
      <circle cx="248" cy="310" r="14" fill="#F5CBA7"/>
    </g>

    <!-- 头 -->
    <g class="mascot__head">
      <!-- 头发（后） -->
      <path d="M104 158c0-42 30-70 70-70s70 28 70 70c0-6-8-14-22-18-16-4-30 2-48 2s-32-6-48-2c-14 4-22 12-22 18z" fill="#2B3245"/>
      <circle cx="174" cy="164" r="60" fill="#F5CBA7"/>
      <!-- 头发（前刘海） -->
      <path d="M114 150c6-30 30-46 60-46s54 16 60 46c-14-14-32-20-60-20s-46 6-60 20z" fill="#2B3245"/>
      <!-- 耳机 -->
      <path d="M118 152a56 56 0 0 1 112 0" fill="none" stroke="#2B3245" stroke-width="9" stroke-linecap="round"/>
      <rect x="104" y="150" width="22" height="34" rx="11" fill="#3D6BFF"/>
      <rect x="222" y="150" width="22" height="34" rx="11" fill="#3D6BFF"/>
      <!-- 眼睛 -->
      <g class="mascot__eyes">
        <ellipse cx="152" cy="176" rx="12" ry="14" fill="#FFFFFF"/>
        <ellipse cx="196" cy="176" rx="12" ry="14" fill="#FFFFFF"/>
        <circle class="mascot__pupil" cx="152" cy="177" r="5.5" fill="#2B3245"/>
        <circle class="mascot__pupil" cx="196" cy="177" r="5.5" fill="#2B3245"/>
      </g>
      <!-- 腮红 + 嘴 -->
      <ellipse cx="134" cy="196" rx="9" ry="5" fill="#FF9E9E" opacity=".55"/>
      <ellipse cx="214" cy="196" rx="9" ry="5" fill="#FF9E9E" opacity=".55"/>
      <path d="M166 198c5 6 17 6 22 0" fill="none" stroke="#2B3245" stroke-width="4" stroke-linecap="round"/>
    </g>
  </g>

  <!-- 桌上的橘猫（前景，最后绘制） -->
  <g class="cat">
    <g class="cat__breathe">
      <!-- 尾巴 -->
      <path class="cat__tail" d="M388 340c28 3 36 14 31 30" fill="none" stroke="#FFB84D" stroke-width="11" stroke-linecap="round"/>
      <!-- 身体 -->
      <ellipse cx="336" cy="331" rx="58" ry="20" fill="#FFB84D"/>
      <path d="M310 314c9-7 20-9 30-6" fill="none" stroke="#F08A2E" stroke-width="5" stroke-linecap="round"/>
      <path d="M330 310c9-6 20-7 29-4" fill="none" stroke="#F08A2E" stroke-width="5" stroke-linecap="round" opacity=".8"/>
      <ellipse cx="340" cy="341" rx="44" ry="10" fill="#FFF6EC" opacity=".9"/>
      <rect x="292" y="342" width="25" height="11" rx="5.5" fill="#FFF6EC"/>
      <rect x="322" y="344" width="25" height="9" rx="4.5" fill="#FFF6EC"/>

      <!-- 头 -->
      <g class="cat__head">
        <path d="M270 306l-7-19 19 10z" fill="#FFB84D"/>
        <path d="M271 302l-4-11 11 6z" fill="#FF9E9E" opacity=".75"/>
        <path d="M301 301l10-17 4 18z" fill="#FFB84D"/>
        <path d="M303 299l7-11 1 12z" fill="#FF9E9E" opacity=".75"/>
        <circle cx="286" cy="320" r="21" fill="#FFB84D"/>
        <ellipse cx="286" cy="327" rx="15" ry="11" fill="#FFF6EC" opacity=".5"/>
        <g class="cat__eyes">
          <ellipse cx="277" cy="317" rx="5.4" ry="6.4" fill="#FFFFFF"/>
          <ellipse cx="295" cy="317" rx="5.4" ry="6.4" fill="#FFFFFF"/>
          <circle class="mascot__pupil" cx="277" cy="318" r="2.8" fill="#2B3245"/>
          <circle class="mascot__pupil" cx="295" cy="318" r="2.8" fill="#2B3245"/>
        </g>
        <path d="M283 328h6l-3 3z" fill="#FF9E9E"/>
        <path d="M286 331c-2 3-6 3-7 0M286 331c2 3 6 3 7 0" fill="none" stroke="#2B3245" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M269 324l-11-3M269 329l-11 2M303 324l11-3M303 329l11 2" fill="none" stroke="#2B3245" stroke-width="1.4" stroke-linecap="round" opacity=".45"/>
      </g>
    </g>
  </g>
</svg>`;

export function createMascot() {
  const wrap = h('div', { class: 'mascot', 'aria-hidden': 'false' });
  wrap.innerHTML = ART;

  const svg = wrap.querySelector('.mascot__svg');
  const pupils = wrap.querySelectorAll('.mascot__pupil');
  const head = wrap.querySelector('.mascot__head');
  const catHead = wrap.querySelector('.cat__head');
  const cat = wrap.querySelector('.cat');
  const floats = wrap.querySelectorAll('.mascot__float');
  const still = prefersReducedMotion();

  /* ---------- 鼠标跟随 ---------- */
  let targetX = 0;
  let targetY = 0;
  let curX = 0;
  let curY = 0;
  let raf = null;

  const paint = () => {
    curX += (targetX - curX) * 0.12;
    curY += (targetY - curY) * 0.12;
    pupils.forEach((p) => {
      p.setAttribute('transform', `translate(${curX * 5} ${curY * 4})`);
    });
    head.setAttribute('transform', `translate(${curX * 7} ${curY * 5}) rotate(${curX * 2.2} ${174} ${164})`);
    catHead?.setAttribute('transform', `translate(${curX * 4} ${curY * 3}) rotate(${curX * 1.6} ${286} ${320})`);
    floats.forEach((g) => {
      const d = Number(g.dataset.depth || 1);
      g.setAttribute('transform', `translate(${-curX * 7 * d} ${-curY * 6 * d})`);
    });
    raf = Math.abs(targetX - curX) > 0.002 || Math.abs(targetY - curY) > 0.002 ? requestAnimationFrame(paint) : null;
  };

  const onMove = (e) => {
    const r = wrap.getBoundingClientRect();
    targetX = Math.max(-1, Math.min(1, ((e.clientX - (r.left + r.width / 2)) / r.width) * 2));
    targetY = Math.max(-1, Math.min(1, ((e.clientY - (r.top + r.height / 2)) / r.height) * 2));
    if (raf == null) raf = requestAnimationFrame(paint);
  };

  if (!still) window.addEventListener('mousemove', onMove, { passive: true });

  /* ---------- 挥手 ---------- */
  svg.addEventListener('pointerenter', () => wrap.classList.add('is-wave'));
  svg.addEventListener('pointerleave', () => wrap.classList.remove('is-wave'));

  /* ---------- 小猫互动：靠近摇尾巴，戳一下会弹起来 ---------- */
  cat?.addEventListener('pointerenter', () => wrap.classList.add('is-cat-happy'));
  cat?.addEventListener('pointerleave', () => wrap.classList.remove('is-cat-happy'));
  cat?.addEventListener('click', () => {
    wrap.classList.remove('is-cat-poke');
    // 强制重排，保证连续点击也能重放动画
    void cat.offsetWidth;
    wrap.classList.add('is-cat-poke');
    setTimeout(() => wrap.classList.remove('is-cat-poke'), 520);
  });

  /* ---------- 随机眨眼 ---------- */
  if (!still) {
    const blink = () => {
      wrap.classList.add('is-blink');
      setTimeout(() => wrap.classList.remove('is-blink'), 160);
      setTimeout(blink, 3200 + Math.random() * 4200);
    };
    setTimeout(blink, 2600);
  }

  return wrap;
}

/** Hero 背景光斑（同样跟随鼠标做视差） */
export function createHeroBlobs() {
  const a = h('span', { class: 'hero__blob hero__blob--a', 'aria-hidden': 'true' });
  const b = h('span', { class: 'hero__blob hero__blob--b', 'aria-hidden': 'true' });
  const box = h('div', { class: 'hero__blobs', 'aria-hidden': 'true' }, a, b);

  if (prefersReducedMotion()) return box;

  let tx = 0;
  let ty = 0;
  let cx = 0;
  let cy = 0;
  let raf = null;
  const paint = () => {
    cx += (tx - cx) * 0.06;
    cy += (ty - cy) * 0.06;
    a.style.transform = `translate3d(${cx * 26}px, ${cy * 20}px, 0)`;
    b.style.transform = `translate3d(${cx * -34}px, ${cy * -22}px, 0)`;
    raf = Math.abs(tx - cx) > 0.002 || Math.abs(ty - cy) > 0.002 ? requestAnimationFrame(paint) : null;
  };
  window.addEventListener(
    'mousemove',
    (e) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
      if (raf == null) raf = requestAnimationFrame(paint);
    },
    { passive: true }
  );

  return box;
}

export const mountMascot = (host) => qs(host);
