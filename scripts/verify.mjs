/**
 * 端到端冒烟验证（本地跑，不进构建产物）
 * 前置：npm run build && npm run preview（默认 http://127.0.0.1:4173/）
 * 运行：node scripts/verify.mjs           （playwright-core 已在 devDependencies）
 *       VERIFY_URL=http://localhost:5173 node scripts/verify.mjs   也能验 dev 服务
 */
import { chromium } from 'playwright-core';
import { homedir } from 'node:os';
import { resolve } from 'node:path';
import { readFile } from 'node:fs/promises';

const EXECUTABLE = resolve(
  homedir(),
  'Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'
);
const BASE_URL = process.env.VERIFY_URL || 'http://127.0.0.1:4173/';
const OUT_DIR = resolve(process.cwd(), 'verify-shots');

/* ---------- 画廊 / Lightbox 用例用到的数据 ---------- */
const rawProducts = JSON.parse(await readFile(resolve(process.cwd(), 'public/data/products.json'), 'utf8'));
const PRODUCTS = Array.isArray(rawProducts) ? rawProducts : rawProducts.products || [];
const START_ID = 'purecadence';
const START_GALLERY = (PRODUCTS.find((p) => p.id === START_ID)?.media?.gallery || []).map(
  (p) => new URL(p, BASE_URL).href
);

/** 在页面里量：当前居中项的中心 vs 容器可视中心的偏差 */
const FLOW_METRICS = () => {
  const f = document.querySelector('.flow');
  if (!f) return null;
  const fb = f.getBoundingClientRect();
  const items = Array.from(f.querySelectorAll('.flow__item'));
  const mid = fb.left + f.clientWidth / 2;
  const first = items[0].getBoundingClientRect();
  const cur = items[Number(f.dataset.idx || 0)].getBoundingClientRect();
  return {
    // 首图中心 − 容器可视中心
    firstDelta: +(first.left + first.width / 2 - mid).toFixed(2),
    firstCenter: items[0].classList.contains('is-center'),
    firstOpacity: getComputedStyle(items[0]).opacity,
    // 当前居中项（切产品后会被重置为 0）
    delta: +(cur.left + cur.width / 2 - mid).toFixed(2),
    centers: f.querySelectorAll('.flow__item.is-center').length,
    idx: f.dataset.idx,
  };
};

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? '✅' : '❌'} ${name}${detail ? `  → ${detail}` : ''}`);
};

const browser = await chromium.launch({ executablePath: EXECUTABLE, headless: true });
const errors = [];

async function newPage(
  colorScheme = 'light',
  viewport = { width: 1440, height: 900 },
  extra = {}
) {
  const ctx = await browser.newContext({ viewport, colorScheme, ...extra });
  const page = await ctx.newPage();
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(String(err)));
  return { ctx, page };
}

/* ---------- 首页（亮色） ---------- */
{
  const { ctx, page } = await newPage('light');
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1400);

  check('Hero 逐字标题渲染', (await page.locator('.hero__title').innerText()).includes('我把想法做成'));
  check('逐字节点数量 > 5', (await page.locator('.char').count()) > 5);
  check('产品卡片 = 8', (await page.locator('.card').count()) === 8);
  check('精选卡占双列', (await page.locator('.card--featured').count()) === 1);
  check('筛选芯片 = 5', (await page.locator('.chip').count()) === 5);
  const chipLabels = await page.locator('.chip').allInnerTexts();
  check(
    '分类顺序正确',
    JSON.stringify(chipLabels.map((t) => t.replace(/\d+$/, '').trim())) ===
      JSON.stringify(['全部', 'macOS 应用', 'iOS App', 'Web 网站', 'Java 后端']),
    chipLabels.join(' | ')
  );
  check('无 Android 分类', !(await page.content()).includes('Android'));
  check('统计区块已移除', (await page.locator('#stats').count()) === 0);
  check(
    '导航 GitHub 指向 ixinglan',
    (await page.locator('.header-actions .icon-btn[href*="github"]').first().getAttribute('href')) ===
      'https://github.com/ixinglan'
  );
  check('历程区块已移除', (await page.locator('#timeline').count()) === 0);
  check('首页卡通角色挂载', (await page.locator('.mascot__svg').count()) === 1);
  check('首页光斑挂载', (await page.locator('.hero__blob').count()) === 2);
  check('外站卡片 = 2', (await page.locator('.site-card').count()) === 2, `实际 ${await page.locator('.site-card').count()}`);
  check(
    '博客链接正确',
    (await page.locator('.site-card').first().getAttribute('href')) === 'https://blog.zhaojq.top/'
  );
  check(
    '面试题链接正确',
    (await page.locator('.site-card').nth(1).getAttribute('href')) === 'https://blog.zhaojq.top/interview'
  );
  check(
    '外站链接新窗口打开',
    (await page.locator('.site-card').first().getAttribute('target')) === '_blank' &&
      (await page.locator('.site-card').first().getAttribute('rel')).includes('noopener')
  );
  check('顶部外链 = 2', (await page.locator('.nav__link--external').count()) === 2);
  check('页脚含博客入口', (await page.locator('.footer-links').innerText()).includes('博客'));
  const copyright = await page.locator('.footer-inner > span').first().innerText();
  check('版权年份自动获取', copyright.includes(String(new Date().getFullYear())), copyright);
  check('未接管光标（无 .cursor 节点）', (await page.locator('.cursor').count()) === 0);
  check('未隐藏系统光标', await page.evaluate(() => !document.body.classList.contains('has-cursor')));
  check('颗粒质感挂载', (await page.locator('.grain').count()) === 1);
  check('滚动进度条挂载', (await page.locator('.scroll-progress').count()) === 1);
  await page.screenshot({ path: `${OUT_DIR}/00-hero-light.png` });

  // 光标策略：常态随系统（default），悬浮可交互元素走原生小手（pointer）
  const bodyCursor = await page.evaluate(() => getComputedStyle(document.body).cursor);
  check('页面常态 = 系统默认光标', bodyCursor === 'auto' || bodyCursor === 'default', `cursor=${bodyCursor}`);
  const cardCursor = await page.locator('.card').first().evaluate((el) => getComputedStyle(el).cursor);
  check('悬浮产品卡 = 小手', cardCursor === 'pointer', `cursor=${cardCursor}`);
  const chipCursor = await page.locator('.chip').first().evaluate((el) => getComputedStyle(el).cursor);
  check('悬浮筛选芯片 = 小手', chipCursor === 'pointer', `cursor=${chipCursor}`);
  const siteCursor = await page.locator('.site-card').first().evaluate((el) => getComputedStyle(el).cursor);
  check('悬浮外站卡 = 小手', siteCursor === 'pointer', `cursor=${siteCursor}`);
  const catCursor = await page.locator('.cat').evaluate((el) => getComputedStyle(el).cursor);
  check('悬浮小猫 = 小手', catCursor === 'pointer', `cursor=${catCursor}`);
  const linkCursor = await page
    .locator('.nav__link--external')
    .first()
    .evaluate((el) => getComputedStyle(el).cursor);
  check('悬浮顶部外链 = 小手', linkCursor === 'pointer', `cursor=${linkCursor}`);

  check('卡片封面 = 真实截图', (await page.locator('.card__media img').first().getAttribute('src')).includes('cover.png'));

  // 鼠标互动：验证瞳孔与漂浮元素真的动了
  const before = await page.locator('.mascot__pupil').first().getAttribute('transform');
  const floatBefore = await page.locator('.mascot__float').first().getAttribute('transform');
  await page.mouse.move(1200, 700);
  await page.waitForTimeout(600);
  const after = await page.locator('.mascot__pupil').first().getAttribute('transform');
  const floatAfter = await page.locator('.mascot__float').first().getAttribute('transform');
  check('瞳孔跟随鼠标', before !== after && Boolean(after), `${before} → ${after}`);
  check('漂浮元素视差', floatBefore !== floatAfter && Boolean(floatAfter), `${floatBefore} → ${floatAfter}`);
  check('桌面小猫挂载', (await page.locator('.cat').count()) === 1);
  check('猫眼跟随鼠标', (await page.locator('.cat .mascot__pupil').first().getAttribute('transform')) !== null);
  // 猫一直在做呼吸动画，元素永不“静止”，这里强制点击跳过可操作性等待
  await page.locator('.cat').click({ force: true });
  await page.waitForTimeout(120);
  check('戳猫有反馈动画', (await page.locator('.mascot.is-cat-poke').count()) === 1);
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT_DIR}/00b-hero-interact.png` });

  // 滚动到产品区
  await page.locator('#products').scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  const opacity = await page.locator('.card').first().evaluate((el) => getComputedStyle(el).opacity);
  check('卡片滚动揭示后可见', opacity === '1', `opacity=${opacity}`);
  await page.screenshot({ path: `${OUT_DIR}/01-products-light.png` });

  // 外站区块截图
  await page.locator('#sites').scrollIntoViewIfNeeded();
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT_DIR}/08-sites.png` });

  // 筛选
  await page.getByRole('button', { name: /iOS App/ }).click();
  await page.waitForTimeout(300);
  check('筛选 iOS 后卡片 = 2', (await page.locator('.card').count()) === 2);
  await page.getByRole('button', { name: /全部/ }).click();
  await page.waitForTimeout(300);

  // 打开详情
  await page.locator('.card').first().click();
  await page.waitForTimeout(900);
  check('全屏详情打开', (await page.locator('.ppage.is-open').count()) === 1);
  check('hash 直链', page.url().includes('#/product/'), page.url());
  check('卡片区共享元素名已置空', (await page.locator('.card__media').first().evaluate((el) => el.style.viewTransitionName)) === 'none');
  check('详情头图有共享元素名', (await page.locator('.ppage__hero-media img').evaluate((el) => el.style.viewTransitionName)).startsWith('p-hero-'));
  check('截图画廊 ≥ 3', (await page.locator('.flow__item').count()) >= 3, `实际 ${await page.locator('.flow__item').count()}`);
  check('亮点列表 ≥ 2', (await page.locator('.notes li').count()) >= 2);
  check('下一个产品卡片', (await page.locator('.ppage__next').count()) === 1);
  await page.screenshot({ path: `${OUT_DIR}/02-detail-top.png` });

  // 滚到画廊再截一张
  await page.locator('.ppage__next').scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT_DIR}/03-detail-body.png` });

  // 键盘 → 切换到下一个产品
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(800);
  const title2 = await page.locator('.ppage__title').innerText();
  check('→ 键切换产品', title2.trim().length > 0, `当前：${title2.trim()}`);

  // ESC 关闭
  await page.keyboard.press('Escape');
  await page.waitForTimeout(800);
  check('ESC 关闭详情', (await page.locator('.ppage.is-open').count()) === 0);
  check('关闭后 hash 清空', !page.url().includes('#/'), page.url());
  check('卡片共享元素名恢复', (await page.locator('.card__media').first().evaluate((el) => el.style.viewTransitionName)).startsWith('p-hero-'));

  // 直链
  await page.goto(`${BASE_URL}#/product/purecadence`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);
  check('直链直达详情', (await page.locator('.ppage.is-open').count()) === 1);
  check('直链产品正确', (await page.locator('.ppage__title').innerText()) === '简步频 PureCadence');
  await ctx.close();
}

/* ---------- 暗色 ---------- */
{
  const { ctx, page } = await newPage('dark');
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  check('暗色主题生效', (await page.evaluate(() => document.documentElement.dataset.theme)) === 'dark');
  await page.locator('#products').scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT_DIR}/04-products-dark.png` });

  await page.locator('.theme-toggle').click();
  await page.waitForTimeout(400);
  check('主题按钮切换', (await page.evaluate(() => document.documentElement.dataset.theme)) === 'light');
  check('主题偏好持久化', (await page.evaluate(() => localStorage.getItem('mp-theme'))) === 'light');
  await ctx.close();
}

/* ---------- 移动端 ---------- */
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'light' });
  const page = await ctx.newPage();
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  check('移动端卡片单列', await page
    .locator('.product-grid')
    .evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length === 1));
  await page.screenshot({ path: `${OUT_DIR}/05-mobile-light.png` });

  await page.locator('.card').first().click();
  await page.waitForTimeout(900);
  check('移动端详情可用', (await page.locator('.ppage.is-open').count()) === 1);
  await page.screenshot({ path: `${OUT_DIR}/06-mobile-detail.png` });
  await ctx.close();
}

/* ---------- 画廊居中 + 切产品不堆积 tagline（1440×900） ---------- */
{
  const { ctx, page } = await newPage('light');
  await page.goto(`${BASE_URL}#/product/${START_ID}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const m0 = await page.evaluate(FLOW_METRICS);
  check(
    '① 首图水平居中（偏差 ≤2px）',
    Math.abs(m0.firstDelta) <= 2,
    `Δ=${m0.firstDelta}px（clientWidth=${await page.locator('.flow').evaluate((el) => el.clientWidth)}）`
  );
  check(
    '② 首图命中 is-center 且完全不透明',
    m0.firstCenter && m0.firstOpacity === '1',
    `is-center=${m0.firstCenter} opacity=${m0.firstOpacity}`
  );

  // 连续按 → 切 3 次产品
  const seen = [];
  for (let i = 0; i < 3; i += 1) {
    seen.push((await page.locator('.ppage__hero-caption .ppage__tag').innerText()).trim());
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(700);
  }
  const cap = await page.evaluate(() => {
    const c = document.querySelector('.ppage__hero-caption');
    const tags = Array.from(c.querySelectorAll('.ppage__tag'));
    return {
      count: tags.length,
      text: (tags[0]?.textContent || '').trim(),
      caption: c.textContent,
      title: document.querySelector('.ppage__title').textContent.trim(),
    };
  });
  const expected = (PRODUCTS.find((p) => p.name === cap.title) || {}).tagline || '';
  check('③ 切 3 次后 tagline 节点数 = 1', cap.count === 1, `实际 ${cap.count} 个`);
  check('③ tagline = 当前产品文案', cap.text === expected, `${cap.text} / 期望 ${expected}`);
  check(
    '③ caption 不含上一个产品的 tagline',
    seen.every((t) => !t || !cap.caption.includes(t)),
    `历史：${seen.join(' | ')}`
  );

  // resize：1440 → 1024 → 768
  for (const w of [1024, 768]) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.waitForTimeout(500);
    const r = await page.evaluate(FLOW_METRICS);
    check(`④ resize ${w} 后仍居中（≤2px）`, Math.abs(r.delta) <= 2, `Δ=${r.delta}px`);
    check(`④ resize ${w} 后唯一中心项`, r.centers === 1, `实际 ${r.centers} 个`);
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await ctx.close();
}

/* ---------- Lightbox：打开 / 翻图 / 双层 Esc / 焦点 / 拖动不误开 ---------- */
{
  const { ctx, page } = await newPage('light');
  await page.goto(`${BASE_URL}#/product/${START_ID}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // ⑩ 先测拖动：按下后横移 60px 再松开，不该打开
  const box = await page.locator('.flow__zoom').nth(0).boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 60, box.y + box.height / 2);
  await page.mouse.up();
  await page.waitForTimeout(350);
  check('⑩ 横向拖动 60px 不误开 Lightbox', (await page.locator('.lightbox.is-open').count()) === 0);

  // ⑤ 点第 2 张放大
  await page.locator('.flow__zoom').nth(1).click();
  await page.waitForTimeout(400);
  check('⑤ 点第 2 张打开 Lightbox', await page.locator('.lightbox.is-open').isVisible());
  check(
    '⑤ Lightbox 图片 = gallery[1]',
    (await page.locator('.lightbox__img').getAttribute('src')) === START_GALLERY[1],
    await page.locator('.lightbox__img').getAttribute('src')
  );
  check(
    '⑤ 计数显示 2 / n',
    (await page.locator('.lightbox__counter').innerText()).trim() === `2 / ${START_GALLERY.length}`,
    (await page.locator('.lightbox__counter').innerText()).trim()
  );
  check(
    '⑤ 焦点落在关闭按钮',
    await page.evaluate(() => Boolean(document.activeElement?.classList.contains('lightbox__close')))
  );
  check(
    '⑤ 背景被 inert 隔离',
    await page.evaluate(() =>
      Array.from(document.querySelectorAll('#app, #page-root')).every((n) => n.hasAttribute('inert'))
    )
  );

  // ⑥ Lightbox 内 → 翻图，且 hash 不能变（不能被切成下一个产品）
  const urlBefore = page.url();
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(350);
  check(
    '⑥ Lightbox 内 → 翻到下一张',
    (await page.locator('.lightbox__img').getAttribute('src')) === START_GALLERY[2],
    await page.locator('.lightbox__img').getAttribute('src')
  );
  check('⑥ 翻图时产品 hash 完全没变', page.url() === urlBefore, page.url());
  check(
    '⑥ 翻图同步画廊居中位置',
    (await page.evaluate(() => document.querySelector('.flow').dataset.idx)) === '2'
  );
  // 到最后一张再按一次：不循环
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(300);
  check(
    '⑥ 末张再按 → 不循环',
    (await page.locator('.lightbox__img').getAttribute('src')) ===
      START_GALLERY[START_GALLERY.length - 1]
  );

  // ⑦ 第 1 次 Esc 只关 Lightbox
  await page.keyboard.press('Escape');
  await page.waitForTimeout(350);
  check(
    '⑦ 第 1 次 Esc 只关 Lightbox（详情页仍开着）',
    (await page.locator('.lightbox.is-open').count()) === 0 &&
      (await page.locator('.ppage.is-open').count()) === 1
  );
  check('⑦ 关 Lightbox 后 hash 不变', page.url() === urlBefore, page.url());
  check(
    '⑦ 背景 inert 已解除',
    await page.evaluate(() =>
      Array.from(document.querySelectorAll('#app, #page-root')).every((n) => !n.hasAttribute('inert'))
    )
  );

  // ⑧ 焦点回到触发的那颗按钮
  check(
    '⑧ 关闭后焦点回到触发的 .flow__zoom',
    await page.evaluate(() => {
      const a = document.activeElement;
      return Boolean(a?.classList.contains('flow__zoom')) && a.dataset.index === '1';
    })
  );

  // ⑦ 第 2 次 Esc 才关详情页
  await page.keyboard.press('Escape');
  await page.waitForTimeout(900);
  check(
    '⑦ 第 2 次 Esc 关闭详情页回首页',
    (await page.locator('.ppage.is-open').count()) === 0 && !page.url().includes('#/'),
    page.url()
  );
  await ctx.close();
}

/* ---------- 暗色主题下的画廊 + Lightbox ---------- */
{
  const { ctx, page } = await newPage('dark');
  await page.goto(`${BASE_URL}#/product/${START_ID}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const m = await page.evaluate(FLOW_METRICS);
  check('暗色：首图仍居中（≤2px）', Math.abs(m.firstDelta) <= 2, `Δ=${m.firstDelta}px`);
  await page.locator('.flow__zoom').nth(0).click();
  await page.waitForTimeout(400);
  check('暗色：Lightbox 可打开且图片已渲染', (await page.locator('.lightbox.is-open').count()) === 1 && (await page.locator('.lightbox__img').getAttribute('src')) === START_GALLERY[0]);
  await page.screenshot({ path: `${OUT_DIR}/09-lightbox-dark.png` });
  await ctx.close();
}

/* ---------- ⑪ reduced-motion ---------- */
{
  const { ctx, page } = await newPage('light', { width: 1440, height: 900 }, { reducedMotion: 'reduce' });
  await page.goto(`${BASE_URL}#/product/${START_ID}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);
  const m = await page.evaluate(FLOW_METRICS);
  check('⑪ reduced-motion 下画廊仍居中', Math.abs(m.firstDelta) <= 2, `Δ=${m.firstDelta}px`);
  await page.locator('.flow__zoom').nth(0).click();
  await page.waitForTimeout(300);
  check('⑪ reduced-motion 下 Lightbox 可打开', (await page.locator('.lightbox.is-open').count()) === 1);
  const dur = await page.evaluate(
    () => getComputedStyle(document.querySelector('.lightbox__img')).transitionDuration
  );
  check(
    '⑪ reduced-motion：图片过渡时长 = 0s',
    dur.split(',').every((v) => v.trim() === '0s'),
    dur
  );
  await ctx.close();
}

/* ---------- ⑨ 移动端 390×844 ---------- */
{
  const { ctx, page } = await newPage('light', { width: 390, height: 844 });
  await page.goto(`${BASE_URL}#/product/${START_ID}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const m = await page.evaluate(FLOW_METRICS);
  check('⑨ 移动端首图居中（≤2px）', Math.abs(m.firstDelta) <= 2, `Δ=${m.firstDelta}px`);
  check('⑨ 移动端唯一中心项', m.centers === 1, `实际 ${m.centers} 个`);
  check(
    '⑨ 移动端两侧不做缩放/变暗',
    await page.evaluate(() => {
      const it = document.querySelectorAll('.flow__item')[1];
      const cs = getComputedStyle(it);
      return cs.transform === 'none' && cs.opacity === '1';
    })
  );
  await page.locator('.flow__zoom').nth(0).click();
  await page.waitForTimeout(400);
  check('⑨ 移动端点图可打开放大预览', (await page.locator('.lightbox.is-open').count()) === 1);
  const nav = await page.evaluate(() => {
    const n = document.querySelector('.lightbox__nav');
    const r = n.getBoundingClientRect();
    return { w: r.width, h: r.height };
  });
  check('⑨ 移动端翻页按钮 ≥44×44', nav.w >= 44 && nav.h >= 44, `${nav.w}×${nav.h}`);
  await page.screenshot({ path: `${OUT_DIR}/10-lightbox-mobile.png` });
  await ctx.close();
}

await browser.close();

const consoleErrors = errors.filter((e) => !e.includes('favicon'));
check('控制台无错误', consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' | '));

const failed = results.filter((r) => !r.ok);
console.log(`\n结果：${results.length - failed.length}/${results.length} 通过`);
process.exit(failed.length ? 1 : 0);
