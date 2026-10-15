/**
 * 首屏氛围背景：网格 + 光晕（CSS） + 缓慢漂移的粒子连线（canvas）
 * 尊重 prefers-reduced-motion；页面隐藏时暂停动画。
 */
import { qs } from '../core/dom.js';
import { prefersReducedMotion } from '../core/motion.js';

const LINK_DIST = 132;

export function initBackground() {
  const layer = qs('#bg-layer');
  if (!layer) return;

  const grid = document.createElement('div');
  grid.className = 'bg-layer__grid';
  const glow = document.createElement('div');
  glow.className = 'bg-layer__glow';
  const canvas = document.createElement('canvas');
  canvas.className = 'bg-layer__canvas';
  layer.append(grid, glow, canvas);

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let particles = [];
  let raf = null;
  let particleColor = 'rgba(140,150,170,0.3)';

  const readColor = () => {
    const v = getComputedStyle(document.documentElement).getPropertyValue('--particle');
    if (v && v.trim()) particleColor = v.trim();
  };

  function seed() {
    const count = Math.min(72, Math.max(24, Math.floor((width * height) / 28000)));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22,
      r: 0.7 + Math.random() * 1.3,
    }));
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
  }

  function step() {
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < -20) p.x = width + 20;
      if (p.x > width + 20) p.x = -20;
      if (p.y < -20) p.y = height + 20;
      if (p.y > height + 20) p.y = -20;
    }
    draw();
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    // 连线
    ctx.strokeStyle = particleColor;
    ctx.lineWidth = 1;
    for (let i = 0; i < particles.length; i += 1) {
      for (let j = i + 1; j < particles.length; j += 1) {
        const a = particles[i];
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.hypot(dx, dy);
        if (dist > LINK_DIST) continue;
        ctx.globalAlpha = (1 - dist / LINK_DIST) * 0.22;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    // 粒子
    ctx.fillStyle = particleColor;
    ctx.globalAlpha = 0.55;
    for (const p of particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function loop() {
    step();
    raf = requestAnimationFrame(loop);
  }

  function start() {
    if (raf != null || prefersReducedMotion()) return;
    raf = requestAnimationFrame(loop);
  }

  function stop() {
    if (raf == null) return;
    cancelAnimationFrame(raf);
    raf = null;
  }

  resize();
  readColor();
  draw();

  if (!prefersReducedMotion()) start();

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resize();
      draw();
    }, 160);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else start();
  });

  // 主题切换后重新取色（--particle 会变）
  new MutationObserver(() => {
    readColor();
    draw();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}
