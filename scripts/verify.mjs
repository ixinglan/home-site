/**
 * 端到端冒烟验证（本地跑，不进构建产物）
 * 前置：npm run build && 一个静态服务（默认 http://127.0.0.1:8899/）
 * 运行：npm i --no-save playwright-core && node scripts/verify.mjs
 */
import { chromium } from 'playwright-core';
import { homedir } from 'node:os';
import { resolve } from 'node:path';

const EXECUTABLE = resolve(
  homedir(),
  'Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'
);
const BASE_URL = process.env.VERIFY_URL || 'http://127.0.0.1:8899/';
const OUT_DIR = resolve(process.cwd(), 'verify-shots');

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? '✅' : '❌'} ${name}${detail ? `  → ${detail}` : ''}`);
};

const browser = await chromium.launch({ executablePath: EXECUTABLE, headless: true });
const errors = [];

async function newPage(colorScheme = 'light', viewport = { width: 1440, height: 900 }) {
  const ctx = await browser.newContext({ viewport, colorScheme });
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

await browser.close();

const consoleErrors = errors.filter((e) => !e.includes('favicon'));
check('控制台无错误', consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' | '));

const failed = results.filter((r) => !r.ok);
console.log(`\n结果：${results.length - failed.length}/${results.length} 通过`);
process.exit(failed.length ? 1 : 0);
