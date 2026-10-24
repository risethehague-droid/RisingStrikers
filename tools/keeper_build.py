# Wire the PixelLab keeper (imported from the v0.1 keeper rig, RISE plate removed) into the game's keeper kits.
#   python3 keeper_build.py <web/game> <extracted keeper export dir> <backup-v0.1.1>
# - same 128 x 160 window / feet row as the outfield kits (the rig was placed exactly like the outfield rig)
# - idle + run: PixelLab templates (S, SE, E, NE, N made; W / SW / NW mirrored)
# - dives: two custom moves made facing East ("to his right" = towards the bottom of the screen, "to his left" = up);
#   the West-facing keeper gets the mirrors, so the game has diveDown-E, diveUp-E, diveDown-W, diveUp-W
# - everything PixelLab hasn't remade yet (catch, throw) = the v0.1 frames padded into the window (same pixel scale)
# - IRO keeper: region recolour of the IS keeper (green kit -> red kit, white trims, dark socks + boots)
import json, os, sys, glob
import numpy as np
from PIL import Image, ImageOps
from scipy import ndimage

GAME, ZIPDIR, BACKUP = sys.argv[1], sys.argv[2], sys.argv[3]
OUT = f'{GAME}/assets/sprites'
WIN = (64, 56, 192, 216)
FW, FH = WIN[2] - WIN[0], WIN[3] - WIN[1]
FEET = 199 - WIN[1]
OLD_AT = (0, 73 - WIN[1])
PL_DIR = {'S': 'south', 'SE': 'south-east', 'E': 'east', 'NE': 'north-east', 'N': 'north'}
MIRROR = {'SW': 'SE', 'W': 'E', 'NW': 'NE'}
DIRS = ['E', 'NE', 'N', 'NW', 'W', 'SW', 'S', 'SE']
NEIGH = {'S': ['SE'], 'SE': ['S', 'E'], 'E': ['SE', 'NE'], 'NE': ['E', 'N'], 'N': ['NE']}

# the keeper rig's own 16 colours
PAL = np.array([(0, 0, 0), (46, 161, 83), (40, 40, 46), (38, 112, 54), (255, 159, 124), (62, 12, 10), (36, 96, 214), (185, 89, 56),
                (24, 24, 28), (252, 254, 252), (222, 44, 44), (255, 172, 67), (99, 179, 244), (24, 124, 56), (14, 88, 40), (200, 204, 214)], np.int32)
W_RGB = np.array([2, 4, 3], np.int32)


def snap(im):
    a = np.array(im); al = a[:, :, 3] > 0
    px = a[al][:, :3].astype(np.int32)
    d = (((px[:, None, :] - PAL[None, :, :]) ** 2) * W_RGB).sum(2)
    a[al, :3] = PAL[d.argmin(1)].astype(np.uint8); a[al, 3] = 255
    return Image.fromarray(a)


def clean(im, min_px=14):
    a = np.array(im); al = a[:, :, 3] > 0
    lab, n = ndimage.label(al, structure=np.ones((3, 3)))
    if n <= 1: return im
    sizes = ndimage.sum(al, lab, range(1, n + 1)); keep = 1 + int(np.argmax(sizes))
    for i in range(1, n + 1):
        if i != keep and sizes[i - 1] < min_px: a[lab == i] = 0
    return Image.fromarray(a)


from ballfind import drop_detached


WALK_DY = {'S': -3, 'SE': -3, 'NE': -2, 'E': 1, 'N': 1}
WIN_WIDE = (0, 56, 256, 216)
# batch 16 (24 Oct, Luca: the keeper's level-1 special save reworked, picked by the shot - a lob = a leap and snatch, straight
# = a planted block, wide = a flying dive catch; plus a fingertip tip-over for a shot that's too strong): rig poses made
# facing E (W = mirror) on a 256 x 184 window (the leap goes above the usual window), drawn on their own origins
WIN_RIG = (0, 32, 256, 216)
KRIG = [('spinning_leap', 'kleap'), ('planted_iron_block', 'kblock'), ('spectacular_flying_dive', 'kdivecatch'), ('fingertip_save', 'ktip')]                              # penalty dives: he flies sideways across the whole canvas


from ballrm import remove_balls


def window(im256, loose=False, wide=False, ball=False, rig=False):
    a = np.array(im256.crop(WIN_RIG if rig else WIN_WIDE if wide else WIN)); a[a[:, :, 3] < 128] = 0
    if ball: a, _, _ = remove_balls(a, attached=True)          # batch 12: PixelLab's own football at the boot (the game draws the ball)
    if loose: a = drop_detached(a, max_blob=900)          # balls in flight, motion lines, sparkles: not touching the keeper
    return clean(snap(Image.fromarray(a)))


def load_atlas(folder, kit):
    js = json.load(open(f'{folder}/{kit}.json')); at = Image.open(f'{folder}/{kit}.webp').convert('RGBA'); fr = {}
    for k, f in js['frames'].items():
        r, s_, ss = f['frame'], f['spriteSourceSize'], f['sourceSize']
        im = Image.new('RGBA', (ss['w'], ss['h'])); im.paste(at.crop((r['x'], r['y'], r['x'] + r['w'], r['y'] + r['h'])), (s_['x'], s_['y'])); fr[k] = im
    return fr


def derise(im):
    """v0.1 keeper frames carry a RISE name plate (black box, white letters) inside the blue chest shield: fill it with shield blue"""
    a = np.array(im); al = a[:, :, 3] > 0; rgb = a[:, :, :3].astype(int)
    bw = al & (np.all(rgb == 0, 2) | np.all(rgb == [252, 254, 252], 2) | np.all(rgb == [40, 40, 46], 2) | np.all(rgb == [24, 24, 28], 2))
    blue = al & (np.all(rgb == [36, 96, 214], 2) | np.all(rgb == [99, 179, 244], 2))
    lab, n = ndimage.label(bw)
    for i in range(1, n + 1):
        m = lab == i
        if m.sum() < 6: continue
        ring = ndimage.binary_dilation(m) & ~m
        if ring.sum() and (blue & ring).sum() / ring.sum() > 0.7: a[m, :3] = (36, 96, 214)
    return Image.fromarray(a)


def pad_old(im128):
    out = Image.new('RGBA', (FW, FH)); out.paste(im128, OLD_AT, im128); return out


def pack(frames, name, maxw=2048):
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


# ---------- PixelLab frames, by the metadata (custom move folders can share a truncated name, the prompt tells them apart)
meta = json.load(open(f'{ZIPDIR}/metadata.json'))
groups = meta.get('groups', [meta])                       # a multi-character export has groups; pick the keeper
states = [st for g in groups for st in g['states'] if 'goalkeeper' in st['character'].get('prompt', '').lower()]
DFR = (3, None)                                           # dives: the airborne frames only (push-off onwards)


def dive_frames(paths, cw):
    """PixelLab made the dive as a full-length dive along the way he faces (East). On the pitch the keeper dives along his
    goal line = up / down the screen, so the airborne frames are turned a quarter (pixel-exact, like the mirrors):
    clockwise = head first towards the bottom of the screen, anticlockwise = towards the top. Each frame is centred on the
    body, and the game draws dives centred on the keeper (manifest 'origins'), so the keeper's own movement carries him."""
    out = []
    for f in paths:
        a = np.array(Image.open(f).convert('RGBA')); a[a[:, :, 3] < 128] = 0
        im = Image.fromarray(drop_detached(a, max_blob=900))          # specks would throw the centring off
        if cw is not None: im = im.transpose(Image.ROTATE_270 if cw else Image.ROTATE_90)
        al = np.array(im)[:, :, 3] > 0; ys, xs = np.nonzero(al)
        cx, cy = (xs.min() + xs.max()) // 2, (ys.min() + ys.max()) // 2
        fr = Image.new('RGBA', (FW, FH)); fr.paste(im, (FW // 2 - cx, FH // 2 - cy), im)
        out.append(clean(snap(fr)))
    return out


# batch 2 frame choice (PixelLab frame numbers); game timing: catch 0.5 s at 16 fps, throw / goal kick 0.45 s at 18 fps
#   catch: from the moment the ball is in his hands (the game hides its own ball while the sprite holds it - 'carry')
#   throw: arm back with the ball -> release on frame 7 (= 0.22 s, the game lets go then) -> follow-through
#   gkick: plant -> swing -> contact on frame 7 (0.11 s)
# batch 4 'clean catch' (ball held in both gloves at the chest): from the moment the ball meets his hands
KTRIM = {('catch', 'S'): (5, None), ('catch', 'SE'): (3, None), ('catch', 'E'): (3, None), ('catch', 'NE'): (3, None),
         ('catch', 'N'): (2, None)}
PDH = (3, None)                                  # high penalty dive: frames used (start, end)
KTRIM.update({('kick', 'S'): (4, None), ('kick', 'SE'): (1, None), ('kick', 'E'): (3, None), ('kick', 'NE'): (3, None), ('kick', 'N'): (2, None)})   # contact on frame 2
KTRIM_ANIM = {'roll': (1, None), 'claim': (1, None), 'throw': (3, None), 'gkick': (5, None), 'punch': (1, None), 'kset': (1, None), 'punt': (1, None)}
PUNT_HIT = 6                                    # batch 13 punt (after the trim): he holds the ball until here, the boot meets it on this frame
CARRY = {f'catch-{d}' for d in DIRS} | {f'claim-{d}' for d in DIRS} | {f'roll-{d}' for d in DIRS} | {f'throw-{d}' for d in ('S', 'SE', 'SW', 'NE', 'NW', 'N')}   # throw E / W: no ball drawn
CARRY |= {f'punt-{d}' for d in DIRS}            # batch 13: PixelLab's ball while he holds it; from the contact frame on the game's ball
new = {}
for st in states:
    for aname, dirs in st['frames'].get('animations', {}).items():
        low = aname.lower()
        rig = next((nm for key, nm in KRIG if key in low), None)   # batch 16 (before the generic 'dive' match below)
        if rig:
            fs = dirs.get('east', [])[1:]                              # (frame 0 = PixelLab's kept idle pose)
            if not fs: continue
            if rig == 'kdivecatch':                                    # flies along his goal line like the dives: turned a quarter
                paths = [f'{ZIPDIR}/{f}' for f in fs]
                new['kdivecatchDown-E'] = dive_frames(paths, cw=True); new['kdivecatchUp-E'] = dive_frames(paths, cw=False)
            else:
                new[f'{rig}-E'] = [window(Image.open(f'{ZIPDIR}/{f}').convert('RGBA'), loose=True, rig=True) for f in fs]
                new[f'{rig}-W'] = [ImageOps.mirror(im) for im in new[f'{rig}-E']]
            continue
        if 'organises_his' in low:                                 # batch 9: shouts + points before a corner (loop)
            fs = dirs.get('south', [])[1:]
            if fs: new['korg-S'] = [window(Image.open(f'{ZIPDIR}/{f}').convert('RGBA'), loose=True) for f in fs]
            continue
        if 'roars_after' in low:                                   # batch 8: roar after a big save (facing you)
            fs = dirs.get('south', [])[1:]
            if fs: new['kroar-S'] = [window(Image.open(f'{ZIPDIR}/{f}').convert('RGBA'), loose=True) for f in fs]
            continue
        if 'mind_games' in low or 'high_penalty_save' in low:     # batch 7: arm-waving distraction (loop) / high tip-over dive
            nm, tr = ('pdistract-S', (1, None)) if 'mind_games' in low else ('pdiveH-SR', PDH)
            fs = dirs.get('south', [])[tr[0]:tr[1]]
            if fs: new[nm] = [window(Image.open(f'{ZIPDIR}/{f}').convert('RGBA'), loose=True, wide=nm.startswith('pdive')) for f in fs]
            if fs and nm == 'pdiveH-SR': new['pdiveH-SL'] = [ImageOps.mirror(im) for im in new[nm]]
            continue
        if 'shuffles_sideways' in low:                                  # batch 12: side-shuffle along the line, facing the play (E made, W = mirror)
            fs = dirs.get('east', [])[1:]
            if fs: new['shuffle-E'] = [window(Image.open(f'{ZIPDIR}/{f}').convert('RGBA'), loose=True) for f in fs]; new['shuffle-W'] = [ImageOps.mirror(im) for im in new['shuffle-E']]
            continue
        if 'absorb_the_impact' in low or 'blasted_backwards' in low:   # batch 11: knocked flat by a special shot (E made, W = mirror)
            fs = dirs.get('east', [])[2:]
            if fs: new['blasted-E'] = [window(Image.open(f'{ZIPDIR}/{f}').convert('RGBA'), loose=True, wide=True) for f in fs]; new['blasted-W'] = [ImageOps.mirror(im) for im in new['blasted-E']]
            continue
        if 'breathing' in low: anim = 'idle'
        elif 'running' in low: anim = 'run'
        elif 'walking' in low: anim = 'walk'                  # batch 12: PixMiniMax walk
        elif 'clears_the_ball' in low: anim = 'kick'          # batch 12: clears with his foot (the game used his throw before)
        elif 'punts_the_ball' in low: anim = 'punt'           # batch 13: drop-kick out of his hands (long distribution)
        elif 'rolls_the_ball_out' in low: anim = 'roll'          # batch 10: underarm roll-out
        elif 'claims_a_high' in low: anim = 'claim'             # batch 9: jumping catch of a high cross
        elif 'clean_catch' in low: anim = 'catch'
        elif 'punch_save' in low: anim = 'punch'               # batch 5: fists a high ball away
        elif 'set_position' in low: anim = 'kset'              # batch 5: set stance before a shot (loop)
        elif 'catches' in low: print('old catch: replaced by the clean catch'); continue
        elif 'throws' in low: anim = 'throw'
        elif 'goal_kick' in low: anim = 'gkick'
        elif 'penalty_saved_celebration' in low or 'beaten_by_a_penalty' in low:   # batch 6: penalty camera reactions (facing you)
            nm = 'pkcele-S' if 'celebration' in low else 'pkdefeat-S'
            fs = dirs.get('south', [])[1:]
            if fs: new[nm] = [window(Image.open(f'{ZIPDIR}/{f}').convert('RGBA'), loose=True) for f in fs]
            continue
        elif 'penalty_ready' in low or 'penalty_dive_left' in low or 'facing_the_camera_saves' in low:
            # penalty camera (keeper facing you): ready stance (loop of the crouched frames), dives to either side of the
            # picture - "dive left" is to HIS left = the right of the screen
            nm, tr = ('pready-S', (4, None)) if 'penalty_ready' in low else (('pdive-SR', (5, None)) if 'penalty_dive_left' in low else ('pdive-SL', (5, None)))
            fs = dirs.get('south', [])[tr[0]:tr[1]]
            if fs: new[nm] = [window(Image.open(f'{ZIPDIR}/{f}').convert('RGBA'), loose=True, wide=nm.startswith('pdive')) for f in fs]
            continue
        elif 'straight_forward' in low:                      # forward dive facing the camera (S) / away from it (N)
            for pd, nm in (('south', 'diveDown-S'), ('north', 'diveUp-N')):
                fs = dirs.get(pd, [])[DFR[0]:DFR[1]]
                if fs: new[nm] = dive_frames([f'{ZIPDIR}/{f}' for f in fs], cw=None)
            continue
        elif 'dive' in low or 'diving' in low:
            anim = 'diveUp' if 'left' in low else 'diveDown'
            fs = dirs.get('east', [])[DFR[0]:DFR[1]]
            if fs: new[f'{anim}-E'] = dive_frames([f'{ZIPDIR}/{f}' for f in fs], cw=anim == 'diveDown')
            continue
        else: print('unmapped:', aname); continue
        for d, pd in PL_DIR.items():
            fs = dirs.get(pd)
            if not fs: continue
            a0, a1 = KTRIM.get((anim, d)) or KTRIM_ANIM.get(anim) or (0, None); fs = fs[a0:a1]
            new[f'{anim}-{d}'] = [window(Image.open(f'{ZIPDIR}/{f}').convert('RGBA'), loose=anim in ('catch', 'throw', 'gkick', 'punch', 'claim', 'roll', 'kick', 'punt'),
                                         ball=anim == 'kick') for i, f in enumerate(fs)]
            dy = WALK_DY.get(d, 0) if anim == 'walk' else 0                  # batch 12: the V3 walk's feet sit a few px off the rig's row
            if dy: new[f'{anim}-{d}'] = [Image.fromarray(np.roll(np.array(im), dy, axis=0)) for im in new[f'{anim}-{d}']]
# batch 13 punt: PixelLab's frames while he holds + drops the ball, then his ball-free clearance from its contact frame
# (PixelLab drew its own ball after the kick and it can't be told from his white gloves; the game's ball takes over there)
for d in PL_DIR:
    if f'punt-{d}' in new and f'kick-{d}' in new: new[f'punt-{d}'] = new[f'punt-{d}'][:PUNT_HIT] + new[f'kick-{d}'][2:]
print('from PixelLab:', {k: len(v) for k, v in new.items()})
for anim in ('idle', 'run', 'walk', 'kick', 'catch', 'throw', 'punch', 'kset', 'claim', 'roll', 'punt'):
    if not any(k.startswith(anim + '-') for k in new): continue
    for d in PL_DIR:
        if f'{anim}-{d}' not in new:
            nb = next((n for n in NEIGH[d] if f'{anim}-{n}' in new), None)
            if nb: new[f'{anim}-{d}'] = new[f'{anim}-{nb}']; print(f'  {anim}-{d} missing: using {nb}')
    for d, s in MIRROR.items():
        if f'{anim}-{s}' in new: new[f'{anim}-{d}'] = [ImageOps.mirror(im) for im in new[f'{anim}-{s}']]
if 'gkick-E' in new: new['gkick-W'] = [ImageOps.mirror(im) for im in new['gkick-E']]
# the West-facing keeper (right-hand goal) gets the mirrors; down stays down
for nm in ('diveDown', 'diveUp', 'kdivecatchDown', 'kdivecatchUp'):
    if f'{nm}-E' in new and f'{nm}-W' not in new: new[f'{nm}-W'] = [ImageOps.mirror(im) for im in new[f'{nm}-E']]
ORIGINS = {k: [0.5, 0.5] for k in new if k.startswith('dive') or k.startswith('kdivecatch')}
ORIGINS.update({f'{a}-{d}': [0.5, (199 - WIN_RIG[1]) / (WIN_RIG[3] - WIN_RIG[1])] for a in ('kleap', 'kblock', 'ktip') for d in ('E', 'W') if f'{a}-{d}' in new})   # batch 16

# ---------- IRO keeper: red kit, white trims and socks
GREEN, GREEN_D, GREEN_DD, GREEN_X = (46, 161, 83), (38, 112, 54), (24, 124, 56), (14, 88, 40)
RED, RED_D, RED_DD = (222, 44, 44), (160, 28, 34), (110, 16, 22)
SOCK, SOCK_D = (40, 40, 46), (24, 24, 28)


def recolour_iro(im):
    a = np.array(im); out = a.copy(); al = a[:, :, 3] > 0; rgb = a[:, :, :3]
    eq = lambda c: al & np.all(rgb == np.array(c, np.uint8), axis=2)
    put = lambda m, c: out.__setitem__((m, slice(0, 3)), c)
    put(eq(GREEN), RED); put(eq(GREEN_D), RED_D); put(eq(GREEN_DD), RED_D); put(eq(GREEN_X), RED_DD)
    put(eq((36, 96, 214)), (252, 254, 252)); put(eq((99, 179, 244)), (200, 204, 214))      # chest panel -> white
    put(eq((255, 172, 67)), (252, 254, 252)); put(eq((222, 44, 44)) & ~eq(GREEN), (252, 254, 252))  # shoulder flames -> white
    # socks and boots share one dark colour on the rig: both stay dark (a sock recolour turned the boots white)
    return Image.fromarray(out)


def recolour_plain(base, shade, dark, light):
    """the other teams' keepers: one plain colour (C6 design), the IS panel + flames become shades of it"""
    def f(im):
        a = np.array(im); out = a.copy(); al = a[:, :, 3] > 0; rgb = a[:, :, :3]
        eq = lambda c: al & np.all(rgb == np.array(c, np.uint8), axis=2)
        put = lambda m, c: out.__setitem__((m, slice(0, 3)), c)
        put(eq(GREEN), base); put(eq(GREEN_D), shade); put(eq(GREEN_DD), shade); put(eq(GREEN_X), dark)
        put(eq((36, 96, 214)), shade); put(eq((99, 179, 244)), base)
        put(eq((255, 172, 67)), light); put(eq((222, 44, 44)), shade)
        return Image.fromarray(out)
    return f


KEEPERS = {'IS-keeper': None, 'IRO-keeper': recolour_iro,
           'USCS-keeper': recolour_plain((96, 96, 104), (70, 70, 78), (46, 46, 52), (136, 136, 146)),
           'LUC-keeper': recolour_plain((170, 214, 60), (130, 174, 40), (92, 128, 28), (206, 236, 110)),
           'THUAS-keeper': recolour_plain((238, 146, 40), (196, 108, 26), (140, 74, 18), (250, 190, 100)),
           'AUC-keeper': recolour_plain((40, 190, 200), (26, 146, 160), (16, 104, 116), (120, 226, 232))}
ONLY = os.environ.get('HC2_KITS')

man = json.load(open(f'{GAME}/assets/manifest.json'))
OLD = json.load(open(f'{BACKUP}/manifest.json'))['kits']
old = {k: derise(im) for k, im in load_atlas(BACKUP, 'IS-keeper').items()}   # both keepers start from the IS keeper (no RISE plate)
for kit, rc in KEEPERS.items():
    if ONLY and kit not in ONLY.split(','): continue
    rc = rc or (lambda im: im)
    frames, an = [], {}
    for name, lst in new.items():
        keys = [f'{name}-{i}' for i in range(len(lst))]; an[name] = keys
        frames += [(k, rc(im)) for k, im in zip(keys, lst)]
    for name, keys in OLD['IS-keeper']['anims'].items():
        if name in an: continue
        oim = lambda k: rc(pad_old(old[k]))
        an[name] = [f'old-{k}' for k in keys]; frames += [(f'old-{k}', oim(k)) for k in keys]
    h = pack(frames, kit)
    man['kits'][kit] = dict(anims=an, feetY=FEET, frameH=FH, origins=ORIGINS, n=len(frames), carry=sorted(c for c in CARRY if c in an),
                            src='PixelLab keeper: idle, run, catch, throw, goal kick, dives')
    print(kit, len(frames), 'frames, atlas h', h, 'anims', sorted({k.rsplit('-', 1)[0] for k in an}))
json.dump(man, open(f'{GAME}/assets/manifest.json', 'w'))
