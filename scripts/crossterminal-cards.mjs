/**
 * CrossTerminal 示例图：仓库没有现成截图、设置窗口在自动化环境唤不出，
 * 用仓库里的真实 AppIcon.svg + README 中的真实事实做信息卡：
 *   cover.png 1600x1067 / shot-01..03.png 1600x1000（poster 直接复用 cover 构图）
 */
import { chromium } from 'playwright-core';
import { homedir } from 'node:os';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const exe = resolve(
  homedir(),
  'Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'
);
const OUT = resolve(process.cwd(), 'public/assets/images/products/crossterminal');
const iconSvg = readFileSync('/Users/ixiaoqiang/Workbuddy/CrossTerminal/Resources/AppIcon.svg', 'utf8')
  .replace('<svg ', '<svg width="100%" height="100%" ');

const css = `
* { margin:0; padding:0; box-sizing:border-box; }
html,body { width:100%; height:100%; overflow:hidden;
  font-family:-apple-system,'PingFang SC',sans-serif; color:#E8ECF4;
  background:
    radial-gradient(900px 560px at 50% 38%, rgba(129,140,248,.30), transparent 68%),
    radial-gradient(700px 420px at 82% 88%, rgba(56,189,248,.14), transparent 70%),
    linear-gradient(180deg,#0A0C10,#141821); position:relative; }
.dots { position:absolute; inset:0;
  background-image:radial-gradient(rgba(255,255,255,.10) 1.5px, transparent 1.5px);
  background-size:46px 46px; }
.mono { font-family:ui-monospace,SFMono-Regular,Menlo,monospace; }
.center { width:100%; height:100%; display:flex; flex-direction:column;
  align-items:center; justify-content:center; gap:26px; position:relative; }
.icon-box { width:300px; height:300px; filter:drop-shadow(0 26px 48px rgba(0,0,0,.55)); }
h1 { font-size:76px; font-weight:800; letter-spacing:.5px; }
.tag { font-size:28px; color:#AEB6C8; }
.sub { font-size:19px; color:#7C8598; letter-spacing:.28em; }
.card { position:relative; width:86%; background:rgba(255,255,255,.045);
  border:1px solid rgba(255,255,255,.10); border-radius:26px; padding:44px 56px; }
.title { font-size:34px; font-weight:700; margin-bottom:8px; }
.desc { font-size:20px; color:#9AA3B5; margin-bottom:30px; }
.steps { display:flex; gap:26px; }
.step { flex:1; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.09);
  border-radius:20px; padding:28px; }
.step .no { font-family:ui-monospace,Menlo,monospace; font-size:15px; color:#818CF8;
  letter-spacing:.2em; margin-bottom:12px; }
.step .t { font-size:22px; font-weight:700; margin-bottom:10px; }
.step .d { font-size:17px; color:#9AA3B5; line-height:1.55; }
.term { margin-top:16px; background:#0B0E14; border:1px solid rgba(255,255,255,.12);
  border-radius:14px; padding:18px 20px; font-family:ui-monospace,Menlo,monospace;
  font-size:16px; color:#7EE2A8; }
.term .path { color:#8FB8FF; }
.grid { display:grid; grid-template-columns:repeat(3,1fr); gap:22px; }
.titem { background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.09);
  border-radius:16px; padding:22px 26px; display:flex; align-items:center; gap:16px; }
.titem .dot { width:10px; height:10px; border-radius:50%; background:#818CF8; }
.titem .n { font-size:21px; font-weight:600; }
.titem .id { margin-left:auto; font-family:ui-monospace,Menlo,monospace; font-size:14px; color:#6E7788; }
.feat { display:flex; flex-direction:column; gap:20px; }
.frow { display:flex; gap:26px; }
.fbox { flex:1; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.09);
  border-radius:20px; padding:30px 34px; }
.fbox .t { font-size:23px; font-weight:700; margin-bottom:8px; }
.fbox .d { font-size:17px; color:#9AA3B5; line-height:1.6; }
`;

const page = (body) => `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body><div class="dots"></div>${body}</body></html>`;

const coverHtml = page(`
  <div class="center">
    <div class="icon-box">${iconSvg}</div>
    <h1>CrossTerminal</h1>
    <div class="tag">在访达里一键把「当前文件夹」打开到你常用的终端</div>
    <div class="sub mono">MACOS 14+ · SWIFT 6 · SWIFTPM · 开源</div>
  </div>`);

const shot1 = page(`
  <div class="center" style="align-items:stretch; justify-content:center;">
    <div class="card">
      <div class="title">三步用上，之后就是「顺手一点」</div>
      <div class="desc">把一个小按钮钉在访达工具栏上，点一下，当前所在文件夹直接在终端里打开。</div>
      <div class="steps">
        <div class="step"><div class="no">STEP 1</div><div class="t">装进工具栏</div>
          <div class="d">按住 ⌘，把 CrossTerminal.app 从访达拖到窗口工具栏上松手。</div></div>
        <div class="step"><div class="no">STEP 2</div><div class="t">点一下图标</div>
          <div class="d">在访达里进入任意文件夹，点工具栏上的 CrossTerminal 图标。</div></div>
        <div class="step"><div class="no">STEP 3</div><div class="t">终端已就位</div>
          <div class="d">所选终端自动 cd 到当前目录，直接开敲。</div></div>
      </div>
      <div class="term"><span class="path">~/Workbuddy/my-products</span> $ <span style="color:#E8ECF4">▊</span></div>
    </div>
  </div>`);

const terms = [
  ['系统终端', 'terminal（默认）'], ['iTerm2', 'iterm'], ['Warp', 'warp'],
  ['Kitty', 'kitty'], ['Alacritty', 'alacritty'], ['Ghostty', 'ghostty'],
  ['Hyper', 'hyper'], ['Tabby', 'tabby'], ['WezTerm', 'wezterm'],
];
const shot2 = page(`
  <div class="center" style="align-items:stretch; justify-content:center;">
    <div class="card">
      <div class="title">九种内置终端，想换随时换</div>
      <div class="desc">首次运行从已安装的终端里挑一个；之后编辑 config.json 的 terminalId 即可，无需重装。</div>
      <div class="grid">
        ${terms.map(([n, id]) => `<div class="titem"><span class="dot"></span><span class="n">${n}</span><span class="id">${id}</span></div>`).join('')}
      </div>
    </div>
  </div>`);

const shot3 = page(`
  <div class="center" style="align-items:stretch; justify-content:center;">
    <div class="card">
      <div class="title">刻意做成一个「隐形」的小工具</div>
      <div class="desc">你几乎感觉不到它的存在，直到某天你习惯性点了一下、终端唰地打开。</div>
      <div class="feat">
        <div class="frow">
          <div class="fbox"><div class="t">无 Dock 图标</div><div class="d">以辅助应用（agent）方式运行，LSUIElement=true，不占 Dock 栏位。</div></div>
          <div class="fbox"><div class="t">无菜单栏图标</div><div class="d">setActivationPolicy(.accessory)，桌面干干净净。</div></div>
        </div>
        <div class="frow">
          <div class="fbox"><div class="t">不后台常驻</div><div class="d">读完访达目录、打开终端后应用自动退出，不占任何资源。</div></div>
          <div class="fbox"><div class="t">可自定义终端</div><div class="d">config.json 里追加 customTerminals，用 {PATH} 占位当前目录。</div></div>
        </div>
      </div>
    </div>
  </div>`);

const browser = await chromium.launch({ executablePath: exe, headless: true });

async function shot(html, w, h, out) {
  const p = await browser.newPage({ viewport: { width: w, height: h } });
  await p.setContent(html, { waitUntil: 'load' });
  await p.waitForTimeout(150);
  await p.screenshot({ path: out });
  await p.close();
  console.log('生成', out);
}

await shot(coverHtml, 1600, 1067, `${OUT}/cover.png`);
await shot(coverHtml, 1920, 1080, `${OUT}/poster.png`);
await shot(shot1, 1600, 1000, `${OUT}/shot-01.png`);
await shot(shot2, 1600, 1000, `${OUT}/shot-02.png`);
await shot(shot3, 1600, 1000, `${OUT}/shot-03.png`);
await browser.close();
