#!/usr/bin/env python3
"""
把本地各项目的真实截图合成为站点用的产品图：
  cover.png  1600x1067 (3:2，产品卡封面)
  poster.png 1920x1080 (16:9，详情头图)
  shot-01..03.png 1600x1000 (16:10，详情画廊)

合成规则：
- 宽幅截图（macOS 窗口 / 网页）：等比缩放后"放入"画布，不裁切（fit 模式）
- 手机竖屏截图：多张并排成一行（row 模式），避免被 3:2 画布裁得只剩中间一条
- 背景：深色渐变 + 产品主色光晕 + 点阵，和旧占位图风格一致
只做"真实截图的排版"，不绘制假 UI。
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path("/Users/ixiaoqiang/Workbuddy")
OUT = Path("/Users/ixiaoqiang/WorkBuddy/my-products/public/assets/images/products")

COVER = (1600, 1067)
POSTER = (1920, 1080)
SHOT = (1600, 1000)

BG_TOP = (10, 12, 16)
BG_BOTTOM = (20, 24, 33)


def bg(w, h, accent):
    """深色渐变 + 主色光晕 + 点阵背景"""
    img = Image.new("RGB", (w, h))
    px = img.load()
    for y in range(h):
        t = y / (h - 1)
        r = int(BG_TOP[0] + (BG_BOTTOM[0] - BG_TOP[0]) * t)
        g = int(BG_TOP[1] + (BG_BOTTOM[1] - BG_TOP[1]) * t)
        b = int(BG_TOP[2] + (BG_BOTTOM[2] - BG_TOP[2]) * t)
        for x in range(w):
            px[x, y] = (r, g, b)
    # 主色光晕（径向）
    glow = Image.new("L", (w, h), 0)
    gd = ImageDraw.Draw(glow)
    cx, cy, rad = int(w * 0.5), int(h * 0.42), int(min(w, h) * 0.62)
    gd.ellipse([cx - rad, cy - rad, cx + rad, cy + rad], fill=46)
    glow = glow.filter(ImageFilter.GaussianBlur(rad * 0.45))
    accent_img = Image.new("RGB", (w, h), accent)
    img = Image.composite(accent_img, img, glow)
    # 点阵
    dots = ImageDraw.Draw(img, "RGBA")
    step = 46
    for y in range(step // 2, h, step):
        for x in range(step // 2, w, step):
            dots.ellipse([x - 1.5, y - 1.5, x + 1.5, y + 1.5], fill=(255, 255, 255, 22))
    return img


def rounded(img, radius):
    """圆角 + 1px 浅边框，返回带 alpha 的图"""
    img = img.convert("RGBA")
    mask = Image.new("L", img.size, 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle([0, 0, img.size[0] - 1, img.size[1] - 1], radius=radius, fill=255)
    img.putalpha(mask)
    # 边框
    bd = ImageDraw.Draw(img)
    bd.rounded_rectangle(
        [0, 0, img.size[0] - 1, img.size[1] - 1], radius=radius, outline=(255, 255, 255, 40), width=2
    )
    return img


def paste_fit(canvas, src, box, radius=24):
    """等比缩放放进 box（不裁切），水平垂直居中，带投影"""
    x0, y0, x1, y1 = box
    max_w, max_h = x1 - x0, y1 - y0
    img = src.copy()
    img.thumbnail((max_w, max_h), Image.LANCZOS)
    img = rounded(img, radius)
    # 投影
    sh = Image.new("RGBA", (img.size[0] + 80, img.size[1] + 80), (0, 0, 0, 0))
    alpha = img.split()[3].point(lambda a: int(a * 0.55))
    mask = Image.new("L", sh.size, 0)
    mask.paste(alpha, (40, 44))
    shadow = Image.new("RGBA", sh.size, (0, 0, 0, 255))
    sh.paste(shadow, (0, 0), mask)
    sh = sh.filter(ImageFilter.GaussianBlur(22))
    px = x0 + (max_w - img.size[0]) // 2
    py = y0 + (max_h - img.size[1]) // 2
    canvas.alpha_composite(sh, (px - 40, py - 40))
    canvas.alpha_composite(img, (px, py))
    return img.size


def paste_row(canvas, srcs, box, gap=44, fill=0.82):
    """多张竖屏截图并排，高度统一，整体居中"""
    x0, y0, x1, y1 = box
    max_h = int((y1 - y0) * fill)
    imgs = []
    for s in srcs:
        im = s.copy()
        ratio = max_h / im.size[1]
        im = im.resize((int(im.size[0] * ratio), max_h), Image.LANCZOS)
        imgs.append(im)
    total_w = sum(i.size[0] for i in imgs) + gap * (len(imgs) - 1)
    # 超宽就按宽度反缩
    avail = x1 - x0
    if total_w > avail:
        ratio = avail / total_w
        imgs = [i.resize((int(i.size[0] * ratio), int(i.size[1] * ratio)), Image.LANCZOS) for i in imgs]
        total_w = sum(i.size[0] for i in imgs) + gap * (len(imgs) - 1)
        max_h = imgs[0].size[1]
    px = x0 + (avail - total_w) // 2
    py = y0 + ((y1 - y0) - max_h) // 2
    for im in imgs:
        im = rounded(im, int(im.size[1] * 0.045))
        sh = Image.new("RGBA", (im.size[0] + 60, im.size[1] + 60), (0, 0, 0, 0))
        alpha = im.split()[3].point(lambda a: int(a * 0.5))
        mask = Image.new("L", sh.size, 0)
        mask.paste(alpha, (30, 34))
        shadow = Image.new("RGBA", sh.size, (0, 0, 0, 255))
        sh.paste(shadow, (0, 0), mask)
        sh = sh.filter(ImageFilter.GaussianBlur(16))
        canvas.alpha_composite(sh, (px - 30, py - 30))
        canvas.alpha_composite(im, (px, py))
        px += im.size[0] + gap


def load(path):
    return Image.open(path).convert("RGB")


def make(product_id, accent, cover_srcs, poster_srcs, shot_srcs, row=False):
    """cover/poster/shot 统一生成；row=True 表示源图是竖屏截图，按并排排版"""
    dst = OUT / product_id
    dst.mkdir(parents=True, exist_ok=True)
    accent = tuple(int(accent[i : i + 2], 16) for i in range(1, 7, 2))

    def render(sources, size, out, mode):
        canvas = bg(size[0], size[1], accent).convert("RGBA")
        pad = int(size[1] * 0.06)
        box = (pad, pad, size[0] - pad, size[1] - pad)
        if mode == "row":
            paste_row(canvas, sources, box)
        else:
            paste_fit(canvas, sources[0], box)
        canvas.convert("RGB").save(out, "PNG", optimize=True)
        print("生成", out.relative_to(OUT.parent.parent.parent))

    make.cover = None
    render(cover_srcs, COVER, dst / "cover.png", "row" if row else "fit")
    render(poster_srcs, POSTER, dst / "poster.png", "row" if row else "fit")
    for i, srcs in enumerate(shot_srcs, 1):
        render(srcs if isinstance(srcs, list) else [srcs], SHOT, dst / f"shot-{i:02d}.png", "row" if row else "fit")


# ============================================================
# 各产品（路径都指向本地真实截图）
# ============================================================

# 1. PicHome：macOS 桌面端（Tauri），宽幅窗口截图
d = ROOT / "PicHome/docs"
make(
    "pichome", "#38BDF8",
    [load(d / "1.png")],
    [load(d / "2.png")],
    [[load(d / "3.png")], [load(d / "4.png")], [load(d / "5.png")]],
)

# 2. NBKey：macOS 设置窗口（800x640 横图 + 520x620 编辑面板）
d = ROOT / "NBKey/docs/images"
make(
    "nbkey", "#A78BFA",
    [load(d / "settings-main.png"), load(d / "settings-dark.png")],
    [load(d / "settings-main.png")],
    [
        [load(d / "rule-editor.png"), load(d / "settings-empty.png")],
        [load(d / "settings-dark.png")],
        [load(d / "settings-main.png")],
    ],
    row=True,
)

# 4. 简日历 PureCalendar：iPhone 竖屏截图并排
d = ROOT / "日历 APP/docs/screenshots"
make(
    "purecalendar", "#F59E0B",
    [load(d / "01-月视图与黄历.png"), load(d / "02-年视图.png"), load(d / "06-小组件预览.png")],
    [load(d / "01-月视图与黄历.png"), load(d / "03-历史上的今天.png"), load(d / "05-设置.png")],
    [
        [load(d / "01-月视图与黄历.png"), load(d / "02-年视图.png")],
        [load(d / "03-历史上的今天.png"), load(d / "04-大字体模式.png")],
        [load(d / "05-设置.png"), load(d / "06-小组件预览.png")],
    ],
    row=True,
)

# 5. 简步频 PureCadence
d1 = ROOT / "步频器/预览截图"
d2 = ROOT / "步频器/适配截图"
make(
    "purecadence", "#FF6B35",
    [load(d1 / "1-首页-深色.png"), load(d1 / "3-运行中-深色.png"), load(d1 / "7-自定义步频-深色.png")],
    [load(d2 / "适配对比-四机型.png")],
    [
        [load(d1 / "2-首页-浅色.png"), load(d1 / "4-运行中-浅色.png")],
        [load(d1 / "5-设置-深色.png"), load(d1 / "6-设置-浅色.png")],
        [load(d1 / "9-设置-跟随系统-浅色系统.png"), load(d2 / "灵动岛-后台.png")],
    ],
    row=True,
)

# 6. MiniCoze：本地运行的页面截图 + 项目文档里的编排图
mc = Path("/tmp")
graph = ROOT / "springAi/docs/imgs/supervisorGraph.png"
make(
    "minicoze", "#22C55E",
    [load(mc / "mc-agent6.png")],
    [load(mc / "mc-chat.png")],
    [
        [load(mc / "mc-rag.png")],
        [load(mc / "mc-ticket.png")],
        [load(graph)],
    ],
)

# 7. bing-img-proxy：本地起服务后的真实返回
make(
    "bing-img-proxy", "#0EA5E9",
    [load(mc / "bing-wallpaper1.png")],
    [load(mc / "bing-wallpaper2.png")],
    [
        [load(mc / "bing-health.png")],
        [load(mc / "bing-wallpaper1.png")],
        [load(mc / "bing-wallpaper2.png")],
    ],
)

# 8. LaunchFreedom：应用自检的真实全屏快照
d = ROOT / "LaunchFreedom/build/snapshots"
make(
    "launchfreedom", "#6366F1",
    [load(d / "01 第一页.png")],
    [load(d / "04 选中态.png")],
    [
        [load(d / "05 拼音搜索.png")],
        [load(d / "06 中文搜索.png")],
        [load(d / "08 文件夹展开.png")],
    ],
)

print("全部完成")
