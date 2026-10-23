# Kit painting on the PixelLab frames (all made on the IS-home rig). Every frame is split into regions - shirt, shorts,
# socks, trims (the IS gold), the rest (skin, hair, boots, outline) - in body coordinates (head -> shorts axis), so the
# patterns follow the body when a player slides or falls. Each team kit = colours per region + an optional pattern.
# The designs follow the C6 kits (characters\C6, 21 Oct): kits carry the team emblem only, no lettering.
import numpy as np
from PIL import Image
from scipy import ndimage

WHITE, LAV = (252, 254, 252), (174, 180, 221)
SH_L, SH_D, SH_DD, GOLD, HAIR = (175, 193, 211), (132, 153, 180), (100, 118, 145), (196, 158, 78), (62, 12, 10)
FRONT = {'S', 'SE', 'SW', 'W'}            # views where we see the chest (W: the sash / patterns run like the front)


def regions(a):
    al = a[:, :, 3] > 0; rgb = a[:, :, :3]
    eq = lambda c: al & np.all(rgb == np.array(c, np.uint8), axis=2)
    sh = eq(SH_L) | eq(SH_D) | eq(SH_DD)
    lab, n = ndimage.label(sh, structure=np.ones((3, 3)))
    shorts = lab == 1 + int(np.argmax(ndimage.sum(sh, lab, range(1, n + 1)))) if n else sh
    hair = eq(HAIR)
    ys, xs = np.mgrid[0:a.shape[0], 0:a.shape[1]]
    R = dict(eq=eq, shorts=shorts, xs=xs, ys=ys, ok=False)
    if shorts.any() and hair.any():
        c_s = np.array([xs[shorts].mean(), ys[shorts].mean()]); c_h = np.array([xs[hair].mean(), ys[hair].mean()])
        u = c_s - c_h; u /= (np.hypot(*u) or 1)
        proj = (xs - c_s[0]) * u[0] + (ys - c_s[1]) * u[1]
        below = proj > proj[shorts].max() - 1
        shirt = (eq(WHITE) | eq(LAV)) & ~below
        R.update(ok=True, below=below, shirt=shirt)
        if shirt.sum() > 30:
            top = np.percentile(proj[shirt], 8); bot = proj[shorts].min()
            tt = (xs - c_s[0]) * u[1] + (ys - c_s[1]) * (-u[0])
            hw = max(4.0, np.percentile(np.abs(tt[shirt]), 55))
            R.update(ss=(proj - top) / max(4.0, bot - top), tt=tt / hw)
    else:
        R.update(below=np.zeros_like(al), shirt=(eq(WHITE) | eq(LAV)))
    return R


def paint(im, d, kit):
    """kit: dict(shirt=(base, shade), shorts=(base, shade, deep), socks=(base, shade), trim=colour, pattern=fn or None)"""
    a = np.array(im); out = a.copy(); R = regions(a); eq = R['eq']; below = R['below']; shorts = R['shorts']
    put = lambda m, c: out.__setitem__((m, slice(0, 3)), c)
    sb, sd = kit['shirt']; put(eq(WHITE) & ~below, sb); put(eq(LAV) & ~below, sd)
    hb, hd, hdd = kit['shorts']
    for c, to in ((SH_L, hb), (SH_D, hd), (SH_DD, hdd)):
        put(eq(c) & ~below, to)
    xb, xd = kit['socks']
    put(eq(WHITE) & below, xb); put(eq(LAV) & below, xd)
    for c in (SH_L, SH_D, SH_DD): put(eq(c) & below & ~shorts, xd)          # sock shading
    put(eq(SH_L) & shorts, hb); put(eq(SH_D) & shorts, hd); put(eq(SH_DD) & shorts, hdd)
    put(eq(GOLD), kit['trim'])
    if kit.get('no_badge', True):                       # the IS badge: small blobs sitting inside the shirt -> shirt colour
        shirt = R['shirt']; al = a[:, :, 3] > 0
        lab, n = ndimage.label(al & ~shirt, structure=np.ones((3, 3)))
        for i in range(1, n + 1):
            m = lab == i; c = int(m.sum())
            if c > 40: continue
            ring = ndimage.binary_dilation(m) & ~m
            if ring.sum() and (shirt & ring).sum() / ring.sum() > 0.7: put(m, sb)
    if kit.get('pattern') and 'ss' in R:
        kit['pattern'](out, R, d, put)
    return Image.fromarray(out)


# ---------- patterns (body coordinates: ss 0 = shoulders .. 1 = waist, tt -1 .. 1 across the torso)
def sash(col, col_d, width=0.72, hatch=True):
    def f(out, R, d, put):
        eq, ss, tt, xs, ys = R['eq'], R['ss'], R['tt'], R['xs'], R['ys']
        centre = 0.85 * (1 - 2 * ss) * (1 if d in FRONT else -1)
        band = R['shirt'] & (np.abs(tt - centre) < width) & (ss > -0.15) & (ss < 1.1)
        put(band & eq(WHITE), col); put(band & eq(LAV), col_d)
        if hatch: put(band & ((xs + ys) % 4 == 0) & eq(WHITE), col_d)
    return f


def split_bolt(col, col_d):
    """USCS: one side of the shirt in the second colour, divided by a zig-zag lightning edge"""
    def f(out, R, d, put):
        eq, ss, tt = R['eq'], R['ss'], R['tt']
        zig = 0.18 * np.sign(np.sin(ss * np.pi * 4)) * (1 - np.abs(np.sin(ss * np.pi * 4)) * 0.2)
        side = (tt - zig) > 0 if d in FRONT else (tt - zig) < 0
        m = R['shirt'] & side & (ss > -0.3)
        put(m & eq(WHITE), col); put(m & eq(LAV), col_d)
    return f


def chest_star(col, col_d):
    """LUC: a big five-point star on the chest (front views only)"""
    def f(out, R, d, put):
        if d not in FRONT: return
        eq, ss, tt = R['eq'], R['ss'], R['tt']
        cx, cy = -0.05 if d != 'W' else 0.1, 0.42
        dx, dy = tt - cx, (ss - cy) * 2.0
        r = np.hypot(dx, dy); th = np.arctan2(dx, -dy) % (2 * np.pi)              # 0 = straight up (a point at the top)
        al_ = np.pi / 5; ph = th % (2 * al_); ph = np.where(ph > al_, 2 * al_ - ph, ph)
        Ro, ri = 0.85, 0.36
        rb = Ro * ri * np.sin(al_) / (Ro * np.sin(ph) + ri * np.sin(al_ - ph))   # edge of the star at that angle
        star = r < rb
        m = R['shirt'] & star
        put(m & eq(WHITE), col); put(m & eq(LAV), col_d)
    return f


def stripes(cols):
    """LUC alt: two thin diagonal stripes across the chest"""
    def f(out, R, d, put):
        eq, ss, tt = R['eq'], R['ss'], R['tt']
        sgn = 1 if d in FRONT else -1
        for i, (c, cd) in enumerate(cols):
            centre = 0.9 * (1 - 2 * (ss - 0.12 * i)) * sgn
            band = R['shirt'] & (np.abs(tt - centre - 0.25 * i * sgn) < 0.16) & (ss > 0) & (ss < 1)
            put(band & eq(WHITE), c); put(band & eq(LAV), cd)
    return f


IRO_RED, IRO_RED_D = (216, 33, 39), (150, 20, 28)
KITS = {
    'IRO-home':   dict(shirt=((40, 40, 48), (24, 24, 30)), shorts=((40, 40, 48), (24, 24, 30), (12, 12, 16)), socks=(WHITE, LAV),
                       trim=IRO_RED, pattern=sash(IRO_RED, IRO_RED_D)),
    'USCS-home':  dict(shirt=((36, 34, 40), (20, 20, 24)), shorts=((36, 34, 40), (20, 20, 24), (10, 10, 12)), socks=((246, 200, 40), (196, 150, 24)),
                       trim=(246, 200, 40), pattern=split_bolt((246, 200, 40), (196, 150, 24))),
    'LUC-home':   dict(shirt=((236, 150, 190), (204, 112, 156)), shorts=((106, 70, 120), (80, 50, 94), (56, 34, 66)), socks=((236, 150, 190), (204, 112, 156)),
                       trim=(106, 70, 120), pattern=chest_star((196, 88, 140), (166, 64, 116))),
    'LUC-alt':    dict(shirt=((34, 40, 86), (22, 26, 60)), shorts=((34, 40, 86), (22, 26, 60), (14, 16, 40)), socks=((34, 40, 86), (22, 26, 60)),
                       trim=(236, 110, 170), pattern=stripes([((236, 110, 170), (190, 80, 136)), ((120, 196, 236), (86, 150, 196))])),
    'THUAS-home': dict(shirt=((140, 222, 120), (100, 186, 88)), shorts=((150, 152, 156), (116, 118, 124), (86, 88, 94)), socks=((140, 222, 120), (100, 186, 88)),
                       trim=(70, 150, 70), pattern=None),
    'AUC-home':   dict(shirt=((206, 40, 44), (160, 26, 32)), shorts=(WHITE, LAV, (132, 153, 180)), socks=((206, 40, 44), (160, 26, 32)),
                       trim=WHITE, pattern=None),
}
TEAM_KITS = {'IS': 'IS-home', 'IRO': 'IRO-home', 'USCS': 'USCS-home', 'LUC': 'LUC-home', 'THUAS': 'THUAS-home', 'AUC': 'AUC-home'}
