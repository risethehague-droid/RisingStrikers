# Find footballs PixelLab drew into a frame, anywhere (not only at the feet): a round, mostly opaque disc of ball colours
# (white + dark pentagons, or the odd coloured balls PixelLab sometimes draws: red / yellow / blue / cyan) that sticks out of
# the body - most of a ring just outside it is empty. Skin inside / right next to the disc = a head, hand or knee: not a ball.
# Used on the raw 128 x 160 window, before the palette snap (the coloured balls are still coloured then).
import numpy as np
from scipy import ndimage


def masks(a):
    al = a[:, :, 3] > 0; rgb = a[:, :, :3].astype(int)
    mx, mn = rgb.max(2), rgb.min(2); r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    white = al & (mn > 175) & (mx - mn < 50)
    dark = al & (mx < 90)
    grey = al & (mx - mn < 45) & (mx >= 90)
    skin = al & (r > 150) & (g >= 80) & (g < 195) & (r - b > 60)          # skin + its shading; a red ball has g < 80
    col = al & (mx - mn > 70) & ~skin                                     # saturated, not skin: red / yellow / blue / cyan balls
    return al, white, dark, grey, skin, col


def find(a, rmin=5, rmax=9, ring_free=0.45, region=None):
    al, white, dark, grey, skin, col = masks(a)
    ballish = white | dark | grey | col
    H, W = al.shape; hits = []
    taken = np.zeros_like(al)
    for r in range(rmax, rmin - 1, -1):
        k = r + 3
        yy, xx = np.mgrid[-k:k + 1, -k:k + 1]; dd = xx ** 2 + yy ** 2
        inner = dd <= r * r; ring = (dd >= (r + 2) ** 2) & (dd <= (r + 3) ** 2); near = dd <= (r + 1) ** 2
        for cy in range(k, H - k):
            for cx in range(k, W - k):
                if region is not None and not region[cy, cx]: continue
                if taken[cy, cx]: continue
                s = (slice(cy - k, cy + k + 1), slice(cx - k, cx + k + 1))
                wa = al[s]
                if wa[inner].mean() < 0.93: continue
                if ballish[s][inner].mean() < 0.9: continue
                w_, c_, d_ = white[s][inner].mean(), col[s][inner].mean(), dark[s][inner].mean()
                if w_ + c_ < 0.35 or d_ > 0.6: continue
                if (~wa[ring]).mean() < ring_free: continue
                if skin[s][near].sum() > 1: continue
                hits.append((cx, cy, r))
                taken[max(0, cy - 2 * r):cy + 2 * r + 1, max(0, cx - 2 * r):cx + 2 * r + 1] = True
    return hits


def erase(a, hits, pad=1.8):
    a = a.copy(); H, W = a.shape[:2]; yy, xx = np.mgrid[0:H, 0:W]; n = 0
    for cx, cy, r in hits:
        m = (xx - cx) ** 2 + (yy - cy) ** 2 <= (r + pad) ** 2
        n += int((m & (a[:, :, 3] > 0)).sum()); a[m] = 0
    return a, n


def drop_detached(a, max_blob=400):
    a = a.copy(); al = a[:, :, 3] > 0
    lab, n = ndimage.label(al, structure=np.ones((3, 3)))
    if n > 1:
        sizes = ndimage.sum(al, lab, range(1, n + 1)); keep = 1 + int(np.argmax(sizes))
        for i in range(1, n + 1):
            if i != keep and sizes[i - 1] < max_blob: a[lab == i] = 0
    return a
