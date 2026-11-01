# Contact sheets: one row per persona, up to 9 screenshots cropped to the viewport, 3 sheets of 10.
import json, os, sys, re
from PIL import Image, ImageDraw, ImageFont
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '.uat-out')
ids = sorted(d for d in os.listdir(OUT) if d.startswith('p') and os.path.isdir(os.path.join(OUT, d)))
W = 170; N = 9; LABEL = 34; GAP = 6
try: font = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 13); small = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 10)
except Exception: font = ImageFont.load_default(); small = font
who = {}
try:
    import subprocess
    src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'personas.mjs')).read()
    for m in re.finditer(r"id: '([^']+)', who: '([^']+)'", src): who[m.group(1)] = m.group(2)
except Exception: pass
def pick(files):
    # prefer the narrative: login→onboarding-1→checkin-1→path→today→workout-instruction→workout-working→(rest|feedback|cancel)→last
    keys = ['onboarding-1', 'checkin-2', 'path', 'today.png', 'workout-overview', 'workout-working', 'workout-rest', 'workout-feedback', 'cancel', 'settings-', 'own-', 'whynot', 'voortgang', 'deze-week', 'connect', 'coach', 'eregalerij', 'after']
    chosen = []
    for k in keys:
        for f in files:
            if k in f and f not in chosen: chosen.append(f); break
    rest = [f for f in files if f not in chosen]
    chosen = (chosen + rest)[:N] if len(chosen) < N else chosen[:N]
    return sorted(chosen)
for sheet in range(0, len(ids), 10):
    group = ids[sheet:sheet + 10]
    rows = []
    for pid in group:
        d = os.path.join(OUT, pid); files = sorted(f for f in os.listdir(d) if f.endswith('.png'))
        log = json.load(open(os.path.join(d, 'log.json'))) if os.path.exists(os.path.join(d, 'log.json')) else {'flows': []}
        fails = sum(1 for f in log['flows'] if not f['ok']); taps = sum(f['taps'] for f in log['flows'])
        thumbs = []
        for f in pick(files):
            im = Image.open(os.path.join(d, f)); vw, vh = im.size
            # crop full-page shots to a phone viewport (aspect ~ 2.16 for 390×844, 1.78 for SE)
            h = min(vh, int(vw * 2.16)); im = im.crop((0, 0, vw, h)); r = W / vw; im = im.resize((W, int(h * r)))
            thumbs.append((f, im))
        rows.append((pid, f"{who.get(pid, pid)}  ·  {len(log['flows'])} flows, {fails} failed, {taps} taps", thumbs))
    H = max((max((t.size[1] for _, t in r[2]), default=0) for r in rows), default=0)
    rowH = LABEL + H + 14 + GAP
    img = Image.new('RGB', (GAP + N * (W + GAP), len(rows) * rowH + GAP), (12, 14, 22)); dr = ImageDraw.Draw(img)
    for i, (pid, label, thumbs) in enumerate(rows):
        y = GAP + i * rowH
        dr.text((GAP, y + 8), label, fill=(240, 240, 240), font=font)
        for j, (f, t) in enumerate(thumbs):
            x = GAP + j * (W + GAP); img.paste(t, (x, y + LABEL)); dr.text((x, y + LABEL + t.size[1] + 1), re.sub(r'^\d+-', '', f)[:-4][:28], fill=(150, 160, 180), font=small)
    name = f'sheet-{group[0]}-{group[-1]}.png'; img.save(os.path.join(OUT, name)); print('wrote', name, img.size)
