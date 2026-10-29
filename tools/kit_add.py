# ADD new PixelLab moves to the outfield kits WITHOUT rebuilding the rest (batch 22, the co-designer's Arcade specials,
# 28 Oct). kit_build.py rebuilds every move from a full PixelLab export ZIP; this takes only the new moves (frames
# downloaded per direction: <batch>/<move>/<pl-direction>/frame_NNN.png), cleans them the same way (PixelLab's grass,
# stray balls, the rig's 10-colour palette), mirrors W / SW / NW, paints every team kit with kits.py and appends them to
# each kit's existing atlas. Every old frame is checked pixel-identical after the repack; the manifest only gains.
#   python3 kit_add.py ../game <batch dir>
import json, sys, glob, os
import numpy as np
from PIL import Image, ImageOps
from kits import KITS, paint
from ballrm import remove_balls
from ballfind import drop_detached

GAME, BATCH = sys.argv[1], sys.argv[2]
OUT = f'{GAME}/assets/sprites'
PL_DIR = {'S': 'south', 'SE': 'south-east', 'E': 'east', 'NE': 'north-east', 'N': 'north'}
MIRROR = {'SW': 'SE', 'W': 'E', 'NW': 'NE'}
RIG_PAL = np.array([(0, 0, 0), (62, 12, 10), (100, 118, 145), (132, 153, 180), (174, 180, 221), (175, 193, 211),
                    (185, 89, 56), (196, 158, 78), (252, 254, 252), (255, 159, 124)], np.int32)   # (= kit_build.py)
W_RGB = np.array([2, 4, 3], np.int32)
WIN_WIDE = (32, 56, 224, 216)        # kit_build.py's 192 px window: feet on row 143, same centre, no origin needed
WIN_TALL = (0, 32, 256, 216)         # the aerial specials' window (batch 16): the combo's leap goes above row 56
# move -> (window, PixelLab frames kept). Frame 0 is PixelLab's reference pose (standing): dropped.
MOVES = {'combo': (WIN_TALL, range(1, 9)),       # the leaping scissor volley (combo strike)
         'combo2': (WIN_WIDE, range(1, 9)),      # the partner's flick (combo set-up)
         'sdribble': (WIN_WIDE, range(1, 9))}    # the special dribble: the spin into the burst
# the contact frame (index into the kept frames) - where the combo's boot meets the ball / the flick's foot is up
CONTACT = {'combo': 3, 'combo2': 3}


def snap(im):
    a = np.array(im); al = a[:, :, 3] > 0
    px = a[al][:, :3].astype(np.int32)
    d = (((px[:, None, :] - RIG_PAL[None, :, :]) ** 2) * W_RGB).sum(2)
    a[al, :3] = RIG_PAL[d.argmin(1)].astype(np.uint8); a[al, 3] = 255
    return Image.fromarray(a)


def window(im256, box, d):
    a = np.array(im256.convert('RGBA').crop(box)); rgb = a[:, :, :3].astype(int)
    a[(rgb[:, :, 1] > rgb[:, :, 0] + 25) & (rgb[:, :, 1] > rgb[:, :, 2] + 25), 3] = 0   # PixelLab grass / dust: not the player
    a[a[:, :, 3] < 128] = 0
    a, _, _ = remove_balls(a, attached=d != 'S')    # the balls PixelLab drew anyway (combo E / N, the flick NE)
    a = drop_detached(a, max_blob=900)
    return snap(Image.fromarray(a))


new = {}
for mv, (box, keep) in MOVES.items():
    for d, pd in PL_DIR.items():
        fs = sorted(glob.glob(f'{BATCH}/{mv}/{pd}/frame_*.png'))
        if not fs: sys.exit(f'missing {mv} {pd}')
        new[f'{mv}-{d}'] = [window(Image.open(fs[i]), box, d) for i in keep if i < len(fs)]
    for d, src in MIRROR.items(): new[f'{mv}-{d}'] = [ImageOps.mirror(im) for im in new[f'{mv}-{src}']]
print('new anims', {k: len(v) for k, v in new.items()})


def load_atlas(kit):
    js = json.load(open(f'{OUT}/{kit}.json')); at = Image.open(f'{OUT}/{kit}.webp').convert('RGBA')
    fr = {}
    for k, f in js['frames'].items():
        r, s, ss = f['frame'], f['spriteSourceSize'], f['sourceSize']
        im = Image.new('RGBA', (ss['w'], ss['h'])); im.paste(at.crop((r['x'], r['y'], r['x'] + r['w'], r['y'] + r['h'])), (s['x'], s['y']))
        fr[k] = im
    return fr


def pack(frames, name, maxw=4096):           # (= kit_build.py's pack: 4096 wide, the phones' texture limit)
    items = []
    for k, im in frames:
        a = np.array(im); al = a[:, :, 3] > 0
        ys, xs = (np.array([0]), np.array([0])) if not al.any() else np.nonzero(al)
        x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
        items.append((k, im.crop((x0, y0, x1, y1)), x0, y0, im.size))
    items.sort(key=lambda t: -t[1].height)
    x = y = sh = 0; pos = []
    for k, c, x0, y0, sz in items:
        if x + c.width + 1 > maxw: x = 0; y += sh + 1; sh = 0
        pos.append((k, c, x0, y0, sz, x, y)); x += c.width + 1; sh = max(sh, c.height)
    Ht = y + sh; sheet = Image.new('RGBA', (maxw, Ht))
    js = {'frames': {}, 'meta': {'image': f'{name}.webp', 'size': {'w': maxw, 'h': Ht}, 'scale': '1'}}
    for k, c, x0, y0, sz, x, y in pos:
        sheet.paste(c, (x, y))
        js['frames'][k] = {'frame': {'x': x, 'y': y, 'w': c.width, 'h': c.height}, 'rotated': False, 'trimmed': True,
                           'spriteSourceSize': {'x': int(x0), 'y': int(y0), 'w': c.width, 'h': c.height},
                           'sourceSize': {'w': sz[0], 'h': sz[1]}}
    sheet.save(f'{OUT}/{name}.webp', 'WEBP', lossless=True, quality=100, method=6)
    json.dump(js, open(f'{OUT}/{name}.json', 'w'))
    return Ht


man = json.load(open(f'{GAME}/assets/manifest.json'))
for kit in ['IS-home'] + list(KITS):
    if kit not in man['kits']: continue
    old = load_atlas(kit); K = man['kits'][kit]
    frames = list(old.items())
    for name, lst in new.items():
        if name in K['anims']: sys.exit(f'{kit} already has {name}: this tool only adds')
        keys = [f'b22-{name}-{i}' for i in range(len(lst))]; K['anims'][name] = keys
        for k, im in zip(keys, lst): frames.append((k, im if kit == 'IS-home' else paint(im, name.rsplit('-', 1)[1], KITS[kit])))
    h = pack(frames, kit)
    org = K.setdefault('origins', {})
    for name in new:
        if name.split('-')[0] in ('combo',): org[name] = [0.5, (199 - WIN_TALL[1]) / (WIN_TALL[3] - WIN_TALL[1])]   # feet row 199 of the canvas
    con = K.setdefault('contact', {})
    for name in new:
        mv = name.split('-')[0]
        if mv in CONTACT: con[name] = CONTACT[mv]
    K['n'] = len(frames)
    back = load_atlas(kit)                                                    # proof: every old frame unchanged
    bad = [k for k, im in old.items() if np.array(back[k]).tobytes() != np.array(im).tobytes()]
    if bad: sys.exit(f'{kit}: {len(bad)} old frames changed, e.g. {bad[:3]}')
    print(kit, len(frames), 'frames, atlas h', h, '- old frames identical:', len(old))
json.dump(man, open(f'{GAME}/assets/manifest.json', 'w'))
