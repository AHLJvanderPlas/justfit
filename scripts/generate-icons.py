#!/usr/bin/env python3
"""
Generate JustFit PWA icon assets.
Design: #020617 dark-navy background + #10b981 emerald lightning bolt + emerald glow.
Method: 4-8× supersampling via PIL for clean anti-aliased edges.
"""

import os, sys
from PIL import Image, ImageDraw, ImageFilter

BG_COLOR  = (2, 6, 23)           # #020617
BOLT_COLOR = (16, 185, 129)       # #10b981
GLOW_ALPHA = 65                   # glow layer opacity

# Canonical bolt polygon in a 24×24 grid (centered at 12,12)
# Points:  top → upper-left → upper-notch → bottom → lower-right → lower-notch
RAW_BOLT = [(13,2), (3,14), (12,14), (11,22), (21,10), (12,10)]
BOLT_W, BOLT_H = 18, 20          # bounding box: x∈[3,21], y∈[2,22]
BOLT_CX, BOLT_CY = 12.0, 12.0   # center of bounding box in 24-grid


def bolt_polygon(canvas_size: int, fill_ratio: float):
    """Return PIL polygon points for a bolt centered in canvas_size × canvas_size."""
    scale = (canvas_size * fill_ratio) / BOLT_H
    ox = canvas_size / 2 - BOLT_CX * scale
    oy = canvas_size / 2 - BOLT_CY * scale
    return [(ox + x * scale, oy + y * scale) for x, y in RAW_BOLT]


def make_icon(size: int, fill_ratio: float, maskable: bool = False) -> Image.Image:
    """Render an icon at `size`×`size` with optional maskable safe-zone padding."""
    ss = 6 if size <= 64 else 4          # supersampling factor (higher for tiny icons)
    d  = size * ss                       # draw dimension

    poly = bolt_polygon(d, fill_ratio)

    # ── 1. Background ──────────────────────────────────────────────────────────
    base = Image.new("RGBA", (d, d), (*BG_COLOR, 255))

    # ── 2. Glow (blurred larger bolt) ─────────────────────────────────────────
    if size >= 32:
        glow_radius = max(2, d // 22)
        glow = Image.new("RGBA", (d, d), (0, 0, 0, 0))
        ImageDraw.Draw(glow).polygon(poly, fill=(*BOLT_COLOR, GLOW_ALPHA))
        glow = glow.filter(ImageFilter.GaussianBlur(radius=glow_radius))
        base = Image.alpha_composite(base, glow)

    # ── 3. Solid bolt ─────────────────────────────────────────────────────────
    bolt = Image.new("RGBA", (d, d), (0, 0, 0, 0))
    ImageDraw.Draw(bolt).polygon(poly, fill=(*BOLT_COLOR, 255))
    base = Image.alpha_composite(base, bolt)

    # ── 4. Downsample with LANCZOS ─────────────────────────────────────────────
    out = base.convert("RGB").resize((size, size), Image.LANCZOS)
    return out


# ─── Icon catalogue ───────────────────────────────────────────────────────────
# (filename, size, fill_ratio, maskable)
ICONS = [
    ("icon-1024.png",              1024, 0.62, False),
    ("apple-touch-icon.png",        180, 0.60, False),
    ("android-chrome-512x512.png",  512, 0.62, False),
    ("android-chrome-192x192.png",  192, 0.60, False),
    ("maskable-512x512.png",        512, 0.46, True),   # bolt in 80% safe-zone circle
    ("mstile-150x150.png",          150, 0.58, False),
    ("favicon-32x32.png",            32, 0.70, False),
    ("favicon-16x16.png",            16, 0.72, False),
]

out_dir = os.path.join(os.path.dirname(__file__), "..", "public", "icons")
os.makedirs(out_dir, exist_ok=True)

for filename, size, ratio, maskable in ICONS:
    path = os.path.join(out_dir, filename)
    img  = make_icon(size, ratio, maskable)
    img.save(path, "PNG", optimize=True)
    print(f"  ✓  {filename:40s}  {size}×{size}  fill={ratio}")

print(f"\nAll icons written to public/icons/")
