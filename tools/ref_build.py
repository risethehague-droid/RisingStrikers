# v0.7.1: the referee (PixelLab, 128 px canvas, PixMiniMax animations) -> assets/sprites/REF.webp + .json, manifest kits.REF
# Frames go into the same 128 x 160 window as the players (feet on row 143), scaled to the players' height if needed.
# The red card is the yellow-card move with the card repainted red.
import json, os, sys, glob
import numpy as np
from PIL import Image, ImageOps
from scipy import ndimage

GAME, ZIPDIR = sys.argv[1], sys.argv[2]
OUT = f'{GAME}/assets/sprites'
FW, FH, FEET = 128, 160, 143
PL_DIR = {'S': 'south', 'SE': 'south-east', 'E': 'east', 'NE': 'north-east', 'N': 'north'}
MIRROR = {'SW': 'SE', 'W': 'E', 'NW': 'NE'}
MAP = [('walking', 'walk'), ('Running', 'run'), ('running', 'run'), ('Idle', 'idle'), ('idle', 'idle'), ('yellow_card', 'card'), ('shirt_pocket', 'card'), ('Hold_a_yellow', 'card'), ('whistle', 'whistle'), ('Blow', 'whistle')]

man = json.load(open(f'{GAME}/assets/manifest.json'))
# player height (idle-S of the IS kit) to match
pj = json.load(open(f'{OUT}/IS-home.json'))['frames']; k0 = man['kits']['IS-home']['anims']['idle-S'][0]
PL_H = pj[k0]['frame']['h']

def opaque_bbox(im):
    a = np.array(im)[:, :, 3] > 0; ys, xs = np.nonzero(a)
    return xs.min(), ys.min(), xs.max(), ys.max()

base = sorted(glob.glob(f'{ZIPDIR}/*/rotations/south.png')) or sorted(glob.glob(f'{ZIPDIR}/*/rotations/*.png'))
rot = Image.open(base[0]).convert('RGBA'); x0, y0, x1, y1 = opaque_bbox(rot); REF_H = y1 - y0 + 1
SCALE = PL_H / REF_H
SCALE = 1.0 if abs(SCALE - 1) < 0.08 else SCALE
FEET_SRC = y1
print('player h', PL_H, 'ref h', REF_H, 'scale', round(SCALE, 3))

def place(im, box=None):
    """canvas frame -> 128 x 160 window, feet on row 143, centred on the rotation's centre
    box: (x0, y0, x1, y1) of a whole move on its own canvas (batch 12: the V3 walk comes on a bigger canvas, a bit taller)"""
    if box:
        bx0, by0, bx1, by1 = box; sc = REF_H / (by1 - by0 + 1) * SCALE
        im = im.resize((round(im.width * sc), round(im.height * sc)), Image.NEAREST); cx = (bx0 + bx1) / 2 * sc; fy = by1 * sc
    else:
      if SCALE != 1.0: im = im.resize((round(im.width * SCALE), round(im.height * SCALE)), Image.NEAREST)
      cx = (x0 + x1) / 2 * SCALE; fy = FEET_SRC * SCALE
    out = Image.new('RGBA', (FW, FH)); out.paste(im, (int(round(FW / 2 - cx)), int(round(FEET - fy))), im)
    a = np.array(out); a[a[:, :, 3] < 128] = 0
    rgb = a[:, :, :3].astype(int); a[(rgb[:, :, 1] > rgb[:, :, 0] + 25) & (rgb[:, :, 1] > rgb[:, :, 2] + 25), 3] = 0   # PixelLab grass
    lab, n = ndimage.label(a[:, :, 3] > 0, structure=np.ones((3, 3)))                # loose specks
    if n > 1:
        sizes = ndimage.sum(a[:, :, 3] > 0, lab, range(1, n + 1)); keep = 1 + int(np.argmax(sizes))
        for i in range(1, n + 1):
            if i != keep and sizes[i - 1] < 14: a[lab == i] = 0
    return Image.fromarray(a)

def to_red(im):
    """yellow card -> red card (only saturated yellow pixels)"""
    a = np.array(im); rgb = a[:, :, :3].astype(int); r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    yel = (a[:, :, 3] > 0) & (r > 180) & (g > 0.82 * r) & (b < 0.35 * g)          # card yellow only (skin is redder, g < 0.8 r)
    lum = (r + g) / 2
    a[yel, 0] = np.clip(lum[yel] * 1.0, 120, 235).astype(np.uint8); a[yel, 1] = (np.clip(lum[yel], 0, 255) * 0.18).astype(np.uint8); a[yel, 2] = (np.clip(lum[yel], 0, 255) * 0.2).astype(np.uint8)
    return Image.fromarray(a)

new = {}
for folder in sorted(glob.glob(f'{ZIPDIR}/*/animations/*')):
    fname = os.path.basename(folder); anim = next((g for key, g in MAP if key.lower() in fname.lower()), None)
    if not anim: print('unmapped', fname); continue
    for d, pd in PL_DIR.items():
        fs = sorted(glob.glob(f'{folder}/{pd}/*.png'))
        if not fs: continue
        ims = [Image.open(f).convert('RGBA') for f in fs]; box = None
        if anim == 'walk' or ims[0].size != rot.size:                       # own canvas: align the move by its own bounding box
            bb = [opaque_bbox(im) for im in ims]; box = (min(b[0] for b in bb), min(b[1] for b in bb), max(b[2] for b in bb), max(b[3] for b in bb))
        new[f'{anim}-{d}'] = [place(im, box) for im in ims]
    for d, s in MIRROR.items():
        if f'{anim}-{s}' in new: new[f'{anim}-{d}'] = [ImageOps.mirror(im) for im in new[f'{anim}-{s}']]
if 'card-S' in new: new['cardR-S'] = [to_red(im) for im in new['card-S']]
# idle: the PixelLab rotation (one still frame) wherever there is no idle move in that direction
if True:
    for d, pd in PL_DIR.items():
        if f'idle-{d}' in new: continue
        p = glob.glob(f'{ZIPDIR}/*/rotations/{pd}.png')
        if p: new[f'idle-{d}'] = [place(Image.open(p[0]).convert('RGBA'))]
    for d, s in MIRROR.items():
        if f'idle-{s}' in new: new[f'idle-{d}'] = [ImageOps.mirror(im) for im in new[f'idle-{s}']]
print({k: len(v) for k, v in new.items()})

# pack (trimmed frames, 2048 wide)
items = []
for name, lst in new.items():
    for i, im in enumerate(lst):
        bb = im.getbbox() or (0, 0, 1, 1); items.append((f'{name}-{i}', im.crop(bb), bb))
items.sort(key=lambda t: -t[1].height)
W, x, y, rowh, pos = 2048, 0, 0, 0, []
for k, c, bb in items:
    if x + c.width > W: x, y, rowh = 0, y + rowh + 1, 0
    pos.append((k, c, bb, x, y)); x += c.width + 1; rowh = max(rowh, c.height)
H = y + rowh; sheet = Image.new('RGBA', (W, H)); js = {'frames': {}, 'meta': {'image': 'REF.webp', 'size': {'w': W, 'h': H}, 'scale': '1'}}
for k, c, bb, px, py in pos:
    sheet.paste(c, (px, py))
    js['frames'][k] = {'frame': {'x': px, 'y': py, 'w': c.width, 'h': c.height}, 'rotated': False, 'trimmed': True,
                       'spriteSourceSize': {'x': bb[0], 'y': bb[1], 'w': c.width, 'h': c.height}, 'sourceSize': {'w': FW, 'h': FH}}
sheet.save(f'{OUT}/REF.webp', 'WEBP', lossless=True, quality=100, method=6); json.dump(js, open(f'{OUT}/REF.json', 'w'))
man = json.load(open(f'{GAME}/assets/manifest.json'))
man['kits']['REF'] = dict(anims={n: [f'{n}-{i}' for i in range(len(l))] for n, l in new.items()}, feetY=FEET, frameH=FH, n=len(items), carry=[], src='PixelLab referee (batch 11c)')
json.dump(man, open(f'{GAME}/assets/manifest.json', 'w'))
print('REF atlas', W, 'x', H, len(items), 'frames')
