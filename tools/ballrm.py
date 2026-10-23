import numpy as np
from scipy import ndimage
SHORTS = np.array([(175, 193, 211), (132, 153, 180), (100, 118, 145)])
def remove_balls(a, max_blob=400, attached=True, rmin=8, top=False, pent=False):
    """PixelLab sometimes draws a football in custom moves. The game has its own ball, so: 1) drop detached blobs
    (anything but the body, < max_blob px), 2) find a ball still touching the foot: a solid disc (r 6-12) of white / black
    / grey pixels below the shorts with open space around most of it -> erase it."""
    a = a.copy(); al = a[:, :, 3] > 0; removed = 0
    lab, n = ndimage.label(al, structure=np.ones((3, 3)))
    if n > 1:
        sizes = ndimage.sum(al, lab, range(1, n + 1)); keep = 1 + int(np.argmax(sizes))
        for i in range(1, n + 1):
            if i != keep and sizes[i - 1] < max_blob: a[lab == i] = 0; removed += int(sizes[i - 1])
    if not attached: return a, removed, []
    al = a[:, :, 3] > 0; rgb = a[:, :, :3].astype(int)
    mx, mn = rgb.max(2), rgb.min(2)
    white = al & (mn > 175) & (mx - mn < 45)
    dark = al & ((mx < 80) | ((rgb[:, :, 2] > rgb[:, :, 0] + 30) & (mx < 150)) | ((rgb[:, :, 0] > 120) & (rgb[:, :, 1] < 80)))
    grey = al & (((mx - mn < 40) & (mx > 80)) | ((rgb[:, :, 2] >= rgb[:, :, 0]) & (mn > 110)))    # greys + the lavender ball shading
    ballish = white | dark | grey
    skin = al & (rgb[:, :, 0] > 150) & (rgb[:, :, 0] - rgb[:, :, 2] > 60) & (rgb[:, :, 1] < 190)   # legs have skin at the knee, a ball doesn't
    d = np.min(np.abs(rgb[:, :, None, :] - SHORTS[None, None]).sum(3), 2); sh = al & (d < 40)
    sl, sn = ndimage.label(sh, structure=np.ones((3, 3)))          # the shorts = the biggest patch of shorts colour (the ball's shading uses it too)
    shorts = sl == 1 + int(np.argmax(ndimage.sum(sh, sl, range(1, sn + 1)))) if sn else sh
    rows = np.nonzero(shorts.any(1))[0]
    y0 = rows.max() - 2 if len(rows) else a.shape[0] // 2
    if top: y0 = 0                                                # batch 13 punt: the ball can be anywhere (in the air over his head)
    H, W = al.shape; yy, xx = np.mgrid[0:H, 0:W]; hits = []
    for r in range(12, rmin - 1, -1):
        k = r + 4
        disc = (np.arange(-k, k + 1)[:, None] ** 2 + np.arange(-k, k + 1)[None, :] ** 2)
        inner = disc <= r * r; ring = (disc >= (r + 3) ** 2) & (disc <= (r + 4) ** 2)
        for cy in range(max(y0, k), H - k):
            for cx in range(k, W - k):
                win_al = al[cy - k:cy + k + 1, cx - k:cx + k + 1]
                if win_al[inner].mean() < 0.97: continue
                if ballish[cy - k:cy + k + 1, cx - k:cx + k + 1][inner].mean() < 0.9: continue
                if white[cy - k:cy + k + 1, cx - k:cx + k + 1][inner].mean() < 0.4: continue      # a ball is mostly white...
                if pent and dark[cy - k:cy + k + 1, cx - k:cx + k + 1][disc <= max(1, r - 2) ** 2].mean() < 0.08: continue   # ...with black patches (a white glove has none)
                if (~win_al[ring]).mean() < 0.5: continue
                if skin[cy - k:cy + k + 1, cx - k:cx + k + 1][disc <= (r + 2) ** 2].any(): continue
                hits.append((cx, cy, r)); break
            if hits: break
        if hits: break
    for cx, cy, r in hits:
        m = (xx - cx) ** 2 + (yy - cy) ** 2 <= (r + 2.5) ** 2
        removed += int((m & al).sum()); a[m] = 0
    return a, removed, hits
