import math, random, os, json, zipfile

random.seed(11)
OUT = "/mnt/user-data/outputs/precept-symbols"
os.makedirs(OUT, exist_ok=True)

PAL = dict(purple="#6a3d9a", red="#c0392b", gold="#c69500", amber="#dd7d00",
           green="#2e8b3d", brown="#8a5a2b", grey="#6d6d6d", yellow="#f0d24f",
           blue="#2f6fb0", orange="#e07b1a", lgreen="#bfe39a", lorange="#f6c48f",
           lyellow="#f6e6a0", lbrown="#d9b38c")

def rnd(a): return (random.random()*2-1)*a

def roughD(pts, closed, amp):
    p = pts + [pts[0]] if closed else pts
    out = []
    for i in range(len(p)-1):
        x1, y1 = p[i]; x2, y2 = p[i+1]
        dx, dy = x2-x1, y2-y1; ln = math.hypot(dx, dy) or 1
        seg = max(2, round(ln/12)); nx, ny = -dy/ln, dx/ln
        for s in range(1 if i else 0, seg+1):
            t = s/seg; o = rnd(amp)
            out.append((x1+dx*t+nx*o, y1+dy*t+ny*o))
    d = "M%.1f %.1f" % out[0]
    for q in out[1:]: d += "L%.1f %.1f" % q
    return d

def P(d, stroke=None, fill="none", sw=1.7, op=None):
    s = '<path d="%s" fill="%s"' % (d, fill)
    if stroke: s += ' stroke="%s" stroke-width="%g" stroke-linecap="round" stroke-linejoin="round"' % (stroke, sw)
    if op is not None: s += ' opacity="%g"' % op
    return s + '/>'

def stroke(pts, closed, c, sw=1.7, fill=None, fillOp=0.45, amp=1.2, passes=2):
    o = []
    if fill: o.append(P(roughD(pts, True, amp), fill=fill, op=fillOp))
    for _ in range(passes): o.append(P(roughD(pts, closed, amp), stroke=c, sw=sw))
    return "".join(o)

def dot(x, y, r, c):
    pts = [(x+math.cos(math.pi*2*i/10)*(r+rnd(.4)), y+math.sin(math.pi*2*i/10)*(r+rnd(.4))) for i in range(10)]
    return P(roughD(pts, True, .3), fill=c, stroke=c, sw=.8)

def rectpts(x, y, w, h): return [(x, y), (x+w, y), (x+w, y+h), (x, y+h)]

def cloudpts(b):
    x, y, w, h = b; cx, cy = x+w/2, y+h/2; rx, ry = w/2+10, h/2+11
    lobes = max(6, min(11, round((w+h)/24)))
    steps = lobes*7; pts = []
    for i in range(steps):
        t = math.pi*2*i/steps
        bump = 0.5 - 0.5*math.cos(lobes*t)
        r = 1 + 0.26*bump
        pts.append((cx+math.cos(t)*rx*r, cy+math.sin(t)*ry*r))
    return pts

INNER = (27, 24, 76, 17)
C = (65, 32)

def enc_triangle(c):
    x, y, w, h = INNER; p = 6
    return stroke([(x+w/2, y-p-4), (x-p, y+h+p), (x+w+p, y+h+p)], True, c, 1.8)
def rising(c):
    x, y, w, h = INNER
    return stroke([(x-2, y+h+5), (x+w+8, y+h-7)], False, c, 2.2, amp=1.0)
def cloud(c, fill=None, fillOp=0.28):
    return stroke(cloudpts(INNER), True, c, 1.5, fill=fill, fillOp=fillOp)
def box(c, fill=None, fillOp=0.3):
    x, y, w, h = INNER
    return stroke(rectpts(x-4, y-4, w+8, h+8), True, c, 1.7, fill=fill, fillOp=fillOp)
def underline(c, double=False):
    x, y, w, h = INNER
    out = stroke([(x-2, y+h+5), (x+w+4, y+h+5)], False, c, 1.8)
    if double: out += stroke([(x-2, y+h+9), (x+w+4, y+h+9)], False, c, 1.6)
    return out
def wavy(c):
    x, y, w, h = INNER; pts = []
    n = 30
    for i in range(n+1):
        pts.append((x-2+(w+6)*i/n, y+h+6+math.sin(i/n*math.pi*5)*2.5))
    return stroke(pts, False, c, 1.7, amp=0.5)
def slash(c):
    x, y, w, h = INNER
    return stroke([(x-4, y+h+7), (x+w+6, y-7)], False, c, 1.8)
def hatch(c):
    x, y, w, h = INNER; out = ""
    for i in range(4):
        sx = x+6+i*(w-8)/4
        out += stroke([(sx, y+h+3), (sx+9, y-4)], False, c, 1.6)
    return out
def droplets(c):
    x, y, w, h = INNER; cx = x+w/2; out = ""
    for i in range(3): out += dot(cx-7+i*7, y-3+(3 if i % 2 else 0), 2.6, c)
    return out
def parallelogram(c):
    x, y, w, h = INNER; sk = 7
    return stroke([(x-4+sk, y-4), (x+w+4+sk, y-4), (x+w+4-sk, y+h+4), (x-4-sk, y+h+4)], True, c, 1.6)
def highlight_underline(c, hl):
    x, y, w, h = INNER
    out = P(roughD(rectpts(x-3, y-3, w+6, h+6), True, 1.0), fill=hl, op=0.5)
    out += stroke([(x-2, y+h+5), (x+w+4, y+h+5)], False, c, 1.7)
    return out
def tent(c):
    x, y, w, h = INNER
    return stroke([(x-4, y+h+2), (x+w/2, y-14), (x+w+4, y+h+2)], False, c, 1.8)
def tombstone(c):
    x, y, w, h = INNER; pad = 5; X = x-pad; Y = y-pad-1; W = w+pad*2; H = h+pad*2; arch = min(13, W*0.4)
    pts = [(X, Y+H), (X, Y+arch)]
    for i in range(13):
        a = math.pi*(1-i/12); pts.append((X+W/2+math.cos(a)*(W/2), (Y+arch)-math.sin(a)*arch))
    pts.append((X+W, Y+H))
    return stroke(pts, False, c, 1.8)
def arch_over(c):
    x, y, w, h = INNER; pts = []; n = 12
    for i in range(n+1):
        t = i/n; pts.append((x-2+(w+4)*t, (y+1)-math.sin(math.pi*t)*13))
    return stroke(pts, False, c, 1.8)
def atonement(c):
    x, y, w, h = INNER
    out = P(roughD(rectpts(x-3, y-2, w+6, h+5), True, 1.0), fill=PAL["lyellow"], op=0.5)
    return out + arch_over(c)
def pray(c):
    x, y, w, h = INNER; pts = []; n = 5; base = y+h+7
    for i in range(n*6+1):
        t = i/(n*6); pts.append((x-2+(w+6)*t, base-abs(math.sin(t*math.pi*n))*3))
    return stroke(pts, False, c, 1.7, amp=0.4)

def star6(c):
    cx, cy = C; R = 15
    def tri(rot): return [(cx+R*math.cos(math.radians(a+rot)), cy+R*math.sin(math.radians(a+rot))) for a in (90, 210, 330)]
    return stroke(tri(0), True, c, 1.6) + stroke(tri(60), True, c, 1.6)
def octagon(c):
    cx, cy = C; R = 15
    pts = [(cx+R*math.cos(math.pi/8+math.pi*2*i/8), cy+R*math.sin(math.pi/8+math.pi*2*i/8)) for i in range(8)]
    return stroke(pts, True, c, 1.7)
def crown(c):
    cx, cy = C; w = 30; h = 18
    pts = [(cx-w/2, cy+h/2), (cx-w/2, cy-h/2+4), (cx-w/4, cy+2), (cx, cy-h/2), (cx+w/4, cy+2), (cx+w/2, cy-h/2+4), (cx+w/2, cy+h/2)]
    return stroke(pts, True, c, 1.7)
def heart(c, fill=None):
    cx, cy = C; W = 30; H = 26; raw = []
    for i in range(61):
        t = math.pi*2*i/60
        raw.append((16*math.sin(t)**3, -(13*math.cos(t)-5*math.cos(2*t)-2*math.cos(3*t)-math.cos(4*t))))
    xs = [p[0] for p in raw]; ys = [p[1] for p in raw]
    mnx, mxx, mny, mxy = min(xs), max(xs), min(ys), max(ys)
    sx = W/(mxx-mnx); sy = H/(mxy-mny)
    pts = [(cx+(p[0]-(mnx+mxx)/2)*sx, cy+(p[1]-(mny+mxy)/2)*sy) for p in raw]
    return stroke(pts, True, c, 1.8, fill=fill, fillOp=0.5, amp=1.0)
def letterW(c):
    cx, cy = C; u = 7; top = cy-9; bot = cy+9
    return stroke([(cx-2*u, top), (cx-u, bot), (cx, top+4), (cx+u, bot), (cx+2*u, top)], False, c, 2.0, amp=0.8)
def letterR(c, sl=False):
    cx, cy = C; top = cy-11; bot = cy+11; left = cx-7
    out = stroke([(left, bot), (left, top)], False, c, 1.9, amp=0.6)
    out += stroke([(left, top), (left+11, top+1), (left+12, cy-2), (left, cy-1)], False, c, 1.8, amp=0.6)
    out += stroke([(left, cy-1), (left+12, bot)], False, c, 1.9, amp=0.6)
    if sl: out += stroke([(cx-13, bot+2), (cx+13, top-2)], False, c, 1.8)
    return out
def megaphone(c):
    cx, cy = C
    out = stroke([(cx-16, cy-6), (cx+10, cy-12), (cx+10, cy+12), (cx-16, cy+6)], True, c, 1.8)
    out += stroke([(cx+10, cy-12), (cx+15, cy-12), (cx+15, cy+12), (cx+10, cy+12)], True, PAL["green"], 1.6, fill=PAL["lgreen"], fillOp=0.5)
    out += stroke([(cx-10, cy+7), (cx-10, cy+15)], False, c, 1.8)
    return out
def clock(c):
    cx, cy = C; R = 14
    circ = [(cx+R*math.cos(math.pi*2*i/16), cy+R*math.sin(math.pi*2*i/16)) for i in range(16)]
    out = stroke(circ, True, c, 1.6)
    out += stroke([(cx, cy), (cx, cy-8)], False, c, 1.5)
    out += stroke([(cx, cy), (cx+6, cy+3)], False, c, 1.5)
    out += stroke([(cx-12, cy-9), (cx-7, cy-14)], False, c, 1.5)
    out += stroke([(cx+12, cy-9), (cx+7, cy-14)], False, c, 1.5)
    return out
def ear(c):
    cx, cy = C
    out = stroke([(cx+8, cy-12), (cx-6, cy-12), (cx-12, cy-4), (cx-9, cy+6), (cx-2, cy+11), (cx+6, cy+10)], False, c, 1.8)
    out += stroke([(cx+2, cy-5), (cx-4, cy-3), (cx-3, cy+3), (cx+2, cy+4)], False, c, 1.5)
    return out
def pitchfork(c):
    cx, cy = C
    out = stroke([(cx, cy+13), (cx, cy-6)], False, c, 1.9)
    out += stroke([(cx-9, cy-13), (cx-9, cy-3)], False, c, 1.7)
    out += stroke([(cx, cy-15), (cx, cy-3)], False, c, 1.7)
    out += stroke([(cx+9, cy-13), (cx+9, cy-3)], False, c, 1.7)
    out += stroke([(cx-9, cy-3), (cx+9, cy-3)], False, c, 1.7)
    return out
def repent_arrow(c):
    cx, cy = C
    out = stroke([(cx+14, cy-6), (cx+14, cy+8), (cx-6, cy+8), (cx-6, cy-6)], False, c, 1.9)
    out += stroke([(cx-6, cy-6), (cx-11, cy+1)], False, c, 1.8)
    out += stroke([(cx-6, cy-6), (cx-1, cy+1)], False, c, 1.8)
    return out
def book(c):
    cx, cy = C; s = 13
    out = stroke([(cx, cy-s*0.8), (cx-s*1.25, cy-s*0.35), (cx-s*1.25, cy+s*0.6), (cx, cy+s*0.35)], True, c, 1.5)
    out += stroke([(cx, cy-s*0.8), (cx+s*1.25, cy-s*0.35), (cx+s*1.25, cy+s*0.6), (cx, cy+s*0.35)], True, c, 1.5)
    return out
def swoosh(c):
    cx, cy = C
    return stroke([(cx+8, cy-10), (cx-4, cy-8), (cx-9, cy+1), (cx-3, cy+9), (cx+4, cy+6)], False, c, 2.0, amp=0.9)

def spirit(c, hl):
    x, y, w, h = INNER
    out = P(roughD(rectpts(x - 2, y - 2, w + 4, h + 4), True, 1.0), fill=hl, op=0.30)
    apexX = x + w * 0.24; apexY = y - 16; endX = x + w + 4; endY = y + h * 0.30; nb = 2.0; amp = 7.0
    pts = [(x - 3, y + h * 0.45), (apexX, apexY)]
    steps = 26
    for s in range(1, steps + 1):
        t = s / steps; px = apexX + (endX - apexX) * t
        base = apexY + (endY - apexY) * t
        pts.append((px, base - amp * (0.5 - 0.5 * math.cos(2 * math.pi * nb * t))))
    return out + stroke(pts, False, c, 1.6, amp=0.5)

SYMS = [
    ("god", "God", lambda: enc_triangle(PAL["purple"])),
    ("jesus", "Jesus Christ / Son", lambda: rising(PAL["purple"])),
    ("spirit", "Spirit (Holy Spirit)", lambda: spirit(PAL["purple"], PAL["yellow"])),
    ("holy", "holy", lambda: cloud(PAL["gold"], fill=PAL["yellow"])),
    ("unholy", "unholy", lambda: cloud(PAL["gold"], fill=PAL["yellow"]) + slash(PAL["red"])),
    ("covenant", "covenant", lambda: box(PAL["red"], fill=PAL["yellow"])),
    ("bless", "bless", lambda: cloud(PAL["blue"])),
    ("curse", "curse", lambda: cloud(PAL["brown"], fill=PAL["lbrown"], fillOp=0.35)),
    ("circumcised", "circumcised", lambda: wavy(PAL["red"])),
    ("die", "die (death)", lambda: tombstone(PAL["grey"])),
    ("israel", "Israel", lambda: star6(PAL["blue"])),
    ("sin", "sin (iniquity, transgression)", lambda: cloud(PAL["brown"])),
    ("remnant", "remnant", lambda: parallelogram(PAL["blue"])),
    ("eternal_life", "eternal life", lambda: box(PAL["green"])),
    ("devil", "devil (evil spirits)", lambda: pitchfork(PAL["red"])),
    ("land", "land", lambda: underline(PAL["green"])),
    ("sign", "sign", lambda: octagon(PAL["red"])),
    ("law", "law (commandments)", lambda: tablets_glyph(PAL["grey"])),
    ("tabernacle", "tabernacle / tent", lambda: tent(PAL["brown"])),
    ("nations", "nations", lambda: highlight_underline(PAL["green"], PAL["lgreen"])),
    ("blood", "blood", lambda: droplets(PAL["red"])),
    ("righteous", "righteous", lambda: letterR(PAL["blue"])),
    ("unrighteous", "unrighteous", lambda: letterR(PAL["blue"], sl=True)),
    ("atonement", "atonement", lambda: atonement(PAL["red"])),
    ("wrath", "wrath", lambda: letterW(PAL["red"])),
    ("redeem", "redeem (redemption)", lambda: cloud(PAL["red"])),
    ("coming", "the coming of the Lord", lambda: cloud(PAL["blue"])),
    ("cry", "cry", lambda: swoosh(PAL["orange"])),
    ("pray", "pray", lambda: pray(PAL["purple"])),
    ("listen", "listen (hear)", lambda: ear(PAL["green"])),
    ("love", "love", lambda: heart(PAL["red"])),
    ("gods_love", "God's love", lambda: heart(PAL["red"], fill=PAL["yellow"])),
    ("grace", "grace", lambda: box(PAL["gold"], fill=PAL["lyellow"])),
    ("suffer", "suffer (affliction, trial)", lambda: hatch(PAL["red"])),
    ("repent", "repent", lambda: repent_arrow(PAL["red"])),
    ("kingdom", "kingdom", lambda: crown(PAL["purple"])),
    ("believe", "believe (faith, truth)", lambda: book(PAL["green"])),
    ("gospel", "gospel", lambda: megaphone(PAL["orange"])),
    ("day_of_the_lord", "day of the Lord", lambda: box(PAL["orange"], fill=PAL["lorange"])),
    ("time", "references to time", lambda: clock(PAL["green"])),
    ("geography", "geographical locations", lambda: underline(PAL["green"], double=True)),
]

def tablets_glyph(c):
    cx, cy = C
    out = stroke([(cx-14, cy+11), (cx-14, cy-6), (cx-12, cy-10), (cx-7, cy-11), (cx-2, cy-10), (cx-1, cy-6), (cx-1, cy+11)], False, c, 1.5)
    out += stroke([(cx+1, cy+11), (cx+1, cy-6), (cx+2, cy-10), (cx+7, cy-11), (cx+12, cy-10), (cx+14, cy-6), (cx+14, cy+11)], False, c, 1.5)
    out += stroke([(cx-14, cy+11), (cx-1, cy+11)], False, c, 1.4)
    out += stroke([(cx+1, cy+11), (cx+14, cy+11)], False, c, 1.4)
    return out

def svg(content):
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 64" width="130" height="64">%s</svg>' % content

manifest = []
for sid, label, fn in SYMS:
    content = fn()
    with open(os.path.join(OUT, sid+".svg"), "w") as f:
        f.write(svg(content))
    manifest.append({"id": sid, "label": label, "file": sid+".svg"})

with open(os.path.join(OUT, "manifest.json"), "w") as f:
    json.dump(manifest, f, indent=2)

cells = ""
for m in manifest:
    with open(os.path.join(OUT, m["file"])) as f:
        inner = f.read()
    cells += '<figure class="cell"><div class="tile">%s</div><figcaption>%s<span class="fn">%s</span></figcaption></figure>' % (inner, m["label"], m["file"])

contact = """<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Precept symbol set — transparent SVG stamps</title>
<style>
:root{--ink:#2a2622;--mut:#8a7d63;--rule:#e4dcc7}
*{box-sizing:border-box}
body{margin:0;background:#efece2;color:var(--ink);font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.wrap{max-width:960px;margin:0 auto;padding:28px 20px 64px}
h1{font-family:"Iowan Old Style",Palatino,Georgia,serif;font-weight:600;font-size:26px;margin:0 0 2px}
.sub{font-size:12.5px;color:var(--mut);margin:0 0 20px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:14px}
.cell{margin:0;background:#fff;border:.5px solid var(--rule);border-radius:10px;padding:10px;text-align:center}
.tile{height:64px;display:flex;align-items:center;justify-content:center;border-radius:7px;
 background-image:linear-gradient(45deg,#e7e2d4 25%,transparent 25%),linear-gradient(-45deg,#e7e2d4 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#e7e2d4 75%),linear-gradient(-45deg,transparent 75%,#e7e2d4 75%);
 background-size:14px 14px;background-position:0 0,0 7px,7px -7px,-7px 0}
.tile svg{width:120px;height:60px}
figcaption{font-size:12px;color:#5b513f;margin-top:8px;line-height:1.35;display:flex;flex-direction:column}
.fn{font-size:10.5px;color:#9a8c6f;font-family:ui-monospace,Menlo,Consolas,monospace;margin-top:2px}
.note{font-size:11.5px;color:var(--mut);margin-top:22px;border-top:.5px solid var(--rule);padding-top:12px;line-height:1.5}
</style></head><body><div class="wrap">
<h1>Precept symbol set</h1>
<p class="sub">@@COUNT@@ transparent hand-sketched SVG stamps &middot; checkerboard shows transparency</p>
<div class="grid">@@GRID@@</div>
<p class="note">Each tile is a standalone transparent .svg (viewBox 0 0 130 64). Enclosure marks (triangle, clouds, boxes, underlines) are drawn around an invisible word zone so they scale onto live text; pictographs (star, crown, clock, heart, and so on) are centred glyphs. Colours follow the legend sheet. Regenerated deterministically from gen_symbols.py.</p>
</div></body></html>"""
contact = contact.replace("@@COUNT@@", str(len(manifest))).replace("@@GRID@@", cells)

with open("/mnt/user-data/outputs/precept-symbols-contactsheet.html", "w") as f:
    f.write(contact)

zpath = "/mnt/user-data/outputs/precept-symbols.zip"
with zipfile.ZipFile(zpath, "w", zipfile.ZIP_DEFLATED) as z:
    for m in manifest:
        z.write(os.path.join(OUT, m["file"]), arcname="precept-symbols/"+m["file"])
    z.write(os.path.join(OUT, "manifest.json"), arcname="precept-symbols/manifest.json")

print("symbols:", len(manifest))
print("files in OUT:", len(os.listdir(OUT)))
print("zip bytes:", os.path.getsize(zpath))
