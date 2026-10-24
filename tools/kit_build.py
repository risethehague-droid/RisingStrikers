# Wire PixelLab batch 0 (new idle + run, made on the IS-home rig) into the game's outfield kits.
# - new frames: 256 px PixelLab canvas -> 128 x 160 window, feet on row 143
# - W / SW / NW = mirrored E / SE / NE (as agreed in the brief)
# - stray pixels: small blobs not touching the body are removed
# - IRO-home gets the same new frames, recoloured with the IS -> IRO colour map measured on the old v0.1 kits
# - the moves PixelLab hasn't remade yet (kick) are the old frames, padded into the same window
import json, os, sys, glob, collections
import numpy as np
from PIL import Image, ImageOps
from scipy import ndimage

GAME = sys.argv[1]                       # web/game
ZIPDIR = sys.argv[2]                     # extracted PixelLab export
OUT = f'{GAME}/assets/sprites'
WIN = (64, 56, 192, 216)                 # crop of the 256 canvas (x0, y0, x1, y1)
FW, FH = WIN[2] - WIN[0], WIN[3] - WIN[1]
FEET = 199 - WIN[1]                      # feet row of the rig (rotations) inside the window
OLD_AT = (0, 73 - WIN[1])                # where an old 128 frame sits in the window (same feet row)
PL_DIR = {'S': 'south', 'SE': 'south-east', 'E': 'east', 'NE': 'north-east', 'N': 'north'}
MIRROR = {'SW': 'SE', 'W': 'E', 'NW': 'NE'}
DIRS = ['E', 'NE', 'N', 'NW', 'W', 'SW', 'S', 'SE']


def load_atlas(kit):
    js = json.load(open(f'{OUT}/{kit}.json')); at = Image.open(f'{OUT}/{kit}.webp').convert('RGBA')
    fr = {}
    for k, f in js['frames'].items():
        r, s, ss = f['frame'], f['spriteSourceSize'], f['sourceSize']
        im = Image.new('RGBA', (ss['w'], ss['h'])); im.paste(at.crop((r['x'], r['y'], r['x'] + r['w'], r['y'] + r['h'])), (s['x'], s['y']))
        fr[k] = im
    return fr


def clean(im, min_px=14):
    """drop small blobs that don't touch the main body (generation leftovers)"""
    a = np.array(im); al = a[:, :, 3] > 0
    lab, n = ndimage.label(al, structure=np.ones((3, 3)))
    if n <= 1: return im, 0
    sizes = ndimage.sum(al, lab, range(1, n + 1)); keep = 1 + int(np.argmax(sizes)); removed = 0
    for i in range(1, n + 1):
        if i != keep and sizes[i - 1] < min_px: a[lab == i] = 0; removed += int(sizes[i - 1])
    return Image.fromarray(a), removed


RIG_PAL = np.array([(0, 0, 0), (62, 12, 10), (100, 118, 145), (132, 153, 180), (174, 180, 221), (175, 193, 211),
                    (185, 89, 56), (196, 158, 78), (252, 254, 252), (255, 159, 124)], np.int32)
W_RGB = np.array([2, 4, 3], np.int32)           # rough perceptual weights


def snap(im):
    """every pixel to the nearest colour of the rig's 10-colour palette (PixelLab adds in-between shades)"""
    a = np.array(im); al = a[:, :, 3] > 0
    px = a[al][:, :3].astype(np.int32)
    d = (((px[:, None, :] - RIG_PAL[None, :, :]) ** 2) * W_RGB).sum(2)
    a[al, :3] = RIG_PAL[d.argmin(1)].astype(np.uint8); a[al, 3] = 255
    return Image.fromarray(a)


from ballrm import remove_balls
from ballfind import drop_detached
BALL_FIX = {'clob', 'kick', 'pass', 'shot', 'super', 'sp1', 'sp2', 'chip'}                       # batch 1 moves where PixelLab drew a football at the foot (the game draws its own)
DETACHED = {'cpass', 'cthru', 'clob', 'tap', 'air1', 'air2', 'air3', 'tide', 'cyclone', 'meteor', 'chip', 'sp1', 'volley', 'dheader', 'throwin', 'celebrate', 'penalty', 'header', 'sprint', 'tackle', 'touch', 'pcele', 'pmiss', 'ppower', 'pchip', 'pwait', 'celeb2', 'chance', 'celeb3', 'dejected', 'applaud', 'pplace', 'protest', 'hips', 'hurt', 'signal', 'celeb4', 'bicycle'}       # batch 2: drop loose balls / specks that don't touch the body
# batch 2 balls still touching the body, placed by eye on the raw frames (window px): (anim, dir, PixelLab frame) -> discs
ERASE = {('clob', 'E', 5): [(122, 91, 12)],   # batch 17: the scoop lob's PixelLab ball at the boot (the game draws its own)
         ('volley', 'S', 5): [(102, 59.5, 12)],
         ('volley', 'SE', 3): [(119, 55, 10)], ('volley', 'SE', 4): [(104.5, 82.5, 10)], ('volley', 'SE', 5): [(92, 41, 10)],
         ('volley', 'E', 4): [(117, 19, 11)],
         ('volley', 'NE', 3): [(62, 8.5, 10.5)], ('volley', 'NE', 4): [(62.5, 4, 11)], ('volley', 'NE', 5): [(65, 21.5, 11)],
         ('volley', 'N', 4): [(77, 12, 11)]}
# chest trap: the PixelLab ball is KEPT (the game hides its own ball while he traps it - manifest 'carry'), so the kit
# painting must not recolour it: these discs mark the ball in each frame
PROTECT = {('trap', 'S', 5): (65, 60, 10), ('trap', 'S', 6): (65, 99, 10), ('trap', 'S', 7): (65, 135, 10), ('trap', 'S', 8): (68.5, 129, 10.5),
           ('trap', 'SE', 5): (81, 46.5, 11), ('trap', 'SE', 6): (80.5, 107.5, 11), ('trap', 'SE', 7): (83, 137.5, 11.5), ('trap', 'SE', 8): (81, 137, 11.5),
           ('trap', 'E', 5): (55, 37.5, 9.5), ('trap', 'E', 6): (67.5, 56, 10), ('trap', 'E', 7): (74.5, 103, 10.5), ('trap', 'E', 8): (79, 128.5, 11),
           ('trap', 'N', 6): (63.5, 110, 10.5), ('trap', 'N', 7): (63.5, 123.5, 11), ('trap', 'N', 8): (63, 120, 11)}
CARRY = {'trap-S', 'trap-SE', 'trap-E', 'trap-N', 'trap-SW', 'trap-W', 'pass-S', 'super-E', 'super-W', 'sp1-E', 'sp1-W', 'sp2-E', 'sp2-W'}   # batch 11: the S pass and the special-move leap show PixelLab's ball until the strike     # anims where the sprite shows the ball (mirrors too)


def skin_hair(a):
    al = a[:, :, 3] > 0; rgb = a[:, :, :3].astype(int); r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    skin = al & (r > 150) & (g >= 80) & (g < 195) & (r - b > 60) & (b >= 50)        # (a yellow / orange ball has b < 50)
    hair = al & (np.abs(rgb - np.array([62, 12, 10])).sum(2) < 45) | (al & (r < 60) & (r > g + 15) & (r > b + 15))
    return skin, hair


def disc(shape, cx, cy, r):
    yy, xx = np.mgrid[0:shape[0], 0:shape[1]]; return (xx - cx) ** 2 + (yy - cy) ** 2 <= r * r


def erase_disc(a, cx, cy, r):
    """erase a ball: everything inside the disc but skin and hair, then the ball's black outline left hanging in the air"""
    a = a.copy(); skin, hair = skin_hair(a)
    m = disc(a.shape, cx, cy, r + 1.5) & ~skin & ~hair; a[m] = 0
    near = disc(a.shape, cx, cy, r + 3)
    for _ in range(2):
        al = a[:, :, 3] > 0; blk = al & (a[:, :, :3].astype(int).max(2) < 40)
        solid = ndimage.binary_dilation(al & ~blk, structure=np.ones((3, 3)))
        a[near & blk & ~solid] = 0
    return a


def erase_cyan(a):
    """the throw-in ball PixelLab drew is pale cyan (no outline): erase it, the game holds its own ball over his head"""
    a = a.copy(); al = a[:, :, 3] > 0; rgb = a[:, :, :3].astype(int); r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    cy = al & (g > 150) & (b > 140) & (g - r > 35) & (b - r > 25)
    cy = ndimage.binary_closing(cy, structure=np.ones((3, 3))) & al
    a[cy] = 0
    near = ndimage.binary_dilation(cy, iterations=3)
    for _ in range(3):                                           # ... and its dark outline, now hanging in the air
        al = a[:, :, 3] > 0; blk = al & (a[:, :, :3].astype(int).max(2) < 60)
        solid = ndimage.binary_dilation(al & ~blk, structure=np.ones((3, 3)))
        a[near & blk & ~solid] = 0
    return a


TALL = {'trophy': 30}
# batch 16: the aerial specials leap, flip and stretch beyond the 128 x 160 window - a 256 x 184 window (the full canvas
# width, from row 32), drawn on its own origin (feet row / frame height in the manifest's 'origins')
RIG = {'air1', 'air2', 'air3', 'tide', 'cyclone', 'meteor'}   # tide / cyclone / meteor: batch 16b, the 3 new aerial specials (Luca 14:16: "new aerial shots with different names / vibe / animation / effect")
WIN_RIG = (0, 32, 256, 216)                    # batch 12: the cup goes above the usual window -> taller frames (128 x 186, feet on row 169)
SHIFT_Y = {('walk', 'S'): 6, ('walk', 'N'): 7, ('walk', 'E'): 1}                     # batch 12: the V3 walk stands 6 px higher on its canvas than the rig (feet 191 vs 197)


def window(im256, anim=None, d=None, idx=None):
    dy = SHIFT_Y.get((anim, d), 0); top = TALL.get(anim, WIN[1])
    box = WIN_RIG if anim in RIG else (WIN[0], top - dy, WIN[2], WIN[3] - dy)
    a = np.array(im256.crop(box)); rgb = a[:, :, :3].astype(int)
    fx = (rgb[:, :, 1] > rgb[:, :, 0] + 25) & (rgb[:, :, 1] > rgb[:, :, 2] + 25)   # PixelLab's green grass / dust puffs: not part of the player
    if anim != 'throwin': a[fx, 3] = 0                                            # (the throw-in ball is cyan: handled below)
    if anim in BALL_FIX: a, _, _ = remove_balls(a, attached=d != 'S')
    for cx, cy, r in ERASE.get((anim, d, idx), []): a = erase_disc(a, cx, cy, r)
    if anim == 'throwin':
        a = erase_cyan(a); rgb = a[:, :, :3].astype(int)
        a[(rgb[:, :, 1] > rgb[:, :, 0] + 25) & (rgb[:, :, 1] > rgb[:, :, 2] + 25), 3] = 0
    a[a[:, :, 3] < 128] = 0
    if anim in DETACHED: a = drop_detached(a, max_blob=900)       # a loose ball is up to ~550 px
    if anim in KEEP_GOLD:                                          # batch 12: the PixelLab trophy keeps its own colours (no rig snap -> no kit paint)
        keep = trophy_mask(a)
        out = np.array(snap(Image.fromarray(a))); out[keep] = a[keep]; GOLD_MASK[(anim, d, idx)] = keep
        return Image.fromarray(out)
    return snap(Image.fromarray(a))


from tmask import trophy_mask
KEEP_GOLD = {'trophy'}
TROPHY_UP = 6                                     # first frame of the trophy lift where the cup is up (after the trim)
GOLD_MASK = {}


def pad_old(im128):
    out = Image.new('RGBA', (FW, FH)); out.paste(im128, OLD_AT, im128); return out


def pack(frames, name, maxw=4096):           # 4096 wide: keeps both sides inside the 4096 texture limit of phones
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


# ---------- new PixelLab frames (IS-home)
new = {}
removed_total = 0
# PixelLab folder name (template name, or the start of a custom prompt) -> game animation name
REDONE = ('side-foot_pass_seen_from_behind', 'power_shot_seen_from_behind')
PICK = {('shot', 'N'): [2, 3, 4, 8, 9, 10, 11, 12]}   # run-up, then straight into the strike (frames 5-7 have PixelLab's ball at the boot)   # batch 12: ball-free pass N / NE + shot N
MAP = [('curling_pass', 'cpass'), ('outside-of-the-boot', 'cthru'), ('curling_scoop_lob', 'clob'),   # batch 17 (24 Oct, Luca 05:57: "a special lvl 1 pass that curves ... 1 for lob, one for through ball, one for normal pass", Test Lab first): made facing E only, W = mirror; PixelLab drew balls into the scoop lob (BALL_FIX + DETACHED clean them)
       ('quick_snap_shot', 'tap'), ('comet_volley', 'air1'), ('thunder_overhead', 'air2'), ('phoenix_dive', 'air3'), ('tide_cutter', 'tide'), ('cyclone_heel', 'cyclone'), ('meteor_drive', 'meteor'),   # batch 16 (24 Oct, Luca: "re pick up the alternate animations for lvl 1-2-3 ... match them to the arc of the ball from passes" + the tap kick): made facing E only, W = mirror; the aerial specials are rig poses (the game moves the body)
       ('chip_shot', 'chip'),   # batch 15 (v0.9.4, PixMiniMax, ball-free prompt): the chip - short step, stab under it, leg lifts
       ('defender_jockeying', 'jockey'),   # batch 13: low side-on stance, shuffling back (the presser contains a dribbler)
       ('side-foot_pass_seen_from_behind', 'pass'), ('power_shot_seen_from_behind', 'shot'), ('walking', 'walk'), ('trophy_celebration', 'trophy'), ('captain_lifts', None),   # batch 12: V3 walk, trophy lift (the first try hid his face)
       ('full_sprint_football', None), ('Plant_the_standing_foot', 'shot'), ('Take_a_small_step_inward', 'pass'), ('Crouch_low_to_gather_power', 'super'), ('Spin_around_once', 'sp1'), ('Stamp_the_foot', 'sp2'),   # batch 11 (PixMiniMax): looping sprint, power shot, side-foot pass, special-move demo
       ('bicycle_kick', 'bicycle'),   # batch 10
       ('protests_to_the_referee', 'protest'), ('waiting_for_a_set_piece', 'hips'), ('hurt_after_a_hard_foul', 'hurt'), ('signals_before', 'signal'),   # batch 9
       ('aeroplane', 'celeb3'), ('dejected_after', 'dejected'), ('applauds', 'applaud'), ('places_the_ball', 'pplace'),   # batch 8
       ('seen_from_behind_waiting', 'pwait'), ('knee_slide', 'celeb2'), ('big_chance_missed', 'chance'),   # batch 7
       ('goal_celebration_towards', 'celeb4'),   # batch 9: points to the sky (after knee slide / aeroplane, which share the words)
       ('penalty_scored', 'pcele'), ('missed_penalty', 'pmiss'), ('power_penalty', 'ppower'), ('chipped_penalty', 'pchip'),   # batch 6: penalty camera, seen from behind
       ('full_sprint', 'sprint'), ('standing_tackle', 'tackle'), ('first_touch', 'touch'), ('attacking_header', 'header'), ('Breathing_Idle', 'idle'), ('Running', 'run'), ('Slide', 'slide'), ('Getting_Up', 'getup'), ('Two-Footed_Jump', 'jump'),
       ('Falling_Back', 'fall'), ('Taking_Punch', 'hit'), ('strikes', 'kick'), ('standing_in_place', None), ('side-foot', None),
       ('controls_a_dropping', 'trap'), ('volleys', 'volley'), ('diving_header', 'dheader'), ('celebration', 'celebrate'),
       ('throw-in', 'throwin'), ('penalty_kick', 'penalty')]
# which frames of each PixelLab move the game uses (start, end): the game needs the action to land fast
#   kick: plant -> wind-up -> strike (frame 2 = the ball leaves the foot, ~0.11 s at 18 fps) -> follow-through
#   slide: drop the standing frame, end on the slide pose (the game holds it, then plays getup)
#   jump (header): start already rising, peak on frame 1
#   batch 2 (game timing in brackets):
#   trap: from the ball on the chest down to the feet (0.32 s at 18 fps)     volley: approach -> contact on frame 2 -> follow-through
#   dheader: crouch -> launch -> flight -> landing, lying (0.75 s at 16 fps)  throwin: ball over the head -> throw (release ~0.18 s)
TRIM = {'cpass': (1, None), 'cthru': (1, None), 'clob': (1, None), 'tap': (1, None), 'air1': (1, None), 'air2': (1, None), 'air3': (1, None), 'tide': (1, None), 'cyclone': (1, None), 'meteor': (1, None),   # batch 16: drop PixelLab's kept idle frame
        'chip': (1, None), 'jockey': (2, None), 'trophy': (1, None), 'kick': (4, None), 'pass': (3, 8), 'shot': (3, None), 'super': (1, None), 'sp1': (1, None), 'sp2': (1, None), 'slide': (1, 4), 'jump': (3, None), 'fall': (1, None),
        'trap': (5, None), 'volley': (3, 8), 'dheader': (2, None), 'throwin': (5, None), 'penalty': (1, None),
        'header': (5, None), 'sprint': (0, None), 'tackle': (1, None), 'touch': (1, None),
        'pcele': (1, None), 'pmiss': (1, None), 'ppower': (1, None), 'pchip': (1, None), 'pwait': (1, None), 'celeb2': (1, None), 'chance': (1, None), 'celeb3': (1, None), 'dejected': (1, 8), 'applaud': (1, None), 'pplace': (1, None), 'protest': (1, None), 'hips': (1, None), 'hurt': (1, None), 'signal': (1, None), 'celeb4': (1, None), 'bicycle': (1, None)}   # batch 5: drop the idle first frame          # batch 4 attacking header: leap -> forehead snap (contact) -> landing
TRIM_DIR = {('chip', 'S'): (2, None), ('chip', 'NE'): (2, None), ('chip', 'N'): (2, None),   # batch 15: contact = 4th frame kept everywhere
            ('pass', 'SE'): (1, 6), ('pass', 'NE'): (2, 8), ('pass', 'N'): (3, 9), ('shot', 'N'): (4, None), ('shot', 'S'): (4, None),   # batch 12: NE / N pass + N shot redone ball-free (contact on frame 2 / 3)
              # batch 11: 2 frames before the contact frame, 2 after
            ('kick', 'E'): (4, 7), ('touch', 'N'): (2, None), ('bicycle', 'NE'): (2, None)}   # bicycle NE: frame 1 shows PixelLab's ball   # first touch N: frame 1 has PixelLab's ball over his head
SKIP_DIR = {('chip', 'N'), ('touch', 'NE'), ('shot', 'N'), ('pass', 'NE'), ('pass', 'N'), ('jockey', 'NE')}   # batch 13: the NE jockey turned round + drew a ball - E stands in   # batch 11: PixelLab's NE / N pass lifts its own ball into the air - the E pass stands in                     # first touch NE: PixelLab plays the ball with his hand - the E move stands in (and mirrors to NW)               # kick East: PixelLab turns him round (back + a number) after the strike
NEIGH = {'S': ['SE'], 'SE': ['S', 'E'], 'E': ['SE', 'NE'], 'NE': ['E', 'N'], 'N': ['NE']}   # stand-in when a direction failed
ONLY_MADE = {'cpass', 'cthru', 'clob', 'tap', 'air1', 'air2', 'air3', 'tide', 'cyclone', 'meteor', 'trophy', 'super', 'sp1', 'sp2', 'throwin', 'celebrate', 'penalty', 'pcele', 'pmiss', 'ppower', 'pchip', 'pwait', 'celeb2', 'chance', 'celeb3', 'dejected', 'applaud', 'pplace', 'protest', 'hips', 'hurt', 'signal', 'celeb4'}       # penalty: seen from behind (N) for the penalty camera             # made for the directions the game uses only (throw-ins S / N, celebration S)
prot = {}                                        # anim -> per-frame ball masks (trap), protected from the kit painting


def bbox_cx(im):
    al = np.array(im)[:, :, 3] > 0; xs = np.nonzero(al.any(0))[0]
    return (xs.min() + xs.max()) / 2 if len(xs) else FW / 2


def shifted(im, dx):
    out = Image.new('RGBA', im.size); out.paste(im, (int(round(dx)), 0), im); return out


for folder in sorted(glob.glob(f'{ZIPDIR}/*/animations/*')):
    fname = os.path.basename(folder)
    hit_ = next((g for key, g in MAP if key.lower() in fname.lower()), 'none')
    if hit_ is None: print('skipped (not used yet):', fname); continue
    anim = hit_ if hit_ != 'none' else None
    if not anim: print('unmapped PixelLab animation:', fname); continue
    for d, pd in PL_DIR.items():
        if (anim, d) in SKIP_DIR and not any(fname.startswith(k) for k in REDONE): continue      # batch 12: redone moves bring their own N / NE
        fs = sorted(glob.glob(f'{folder}/{pd}/frame_*.png'))
        if not fs: continue
        a0, a1 = TRIM_DIR.get((anim, d)) or TRIM.get(anim) or (0, None)
        idxs = list(range(len(fs)))[a0:a1]; fs = fs[a0:a1]
        if (anim, d) in PICK and any(fname.startswith(k) for k in REDONE):     # batch 12: hand-picked frames (skip the ones where PixelLab drew a ball)
            idxs = [i for i in PICK[(anim, d)] if i < len(sorted(glob.glob(f'{folder}/{pd}/frame_*.png')))]; allf = sorted(glob.glob(f'{folder}/{pd}/frame_*.png')); fs = [allf[i] for i in idxs]
        lst, masks = [], []
        for i, f in zip(idxs, fs):
            im, r = clean(window(Image.open(f).convert('RGBA'), anim, d, i)); removed_total += r; lst.append(im)
            pc = PROTECT.get((anim, d, i))
            masks.append(None if pc is None else disc((FH, FW), *pc[:2], pc[2] + 1) & ~skin_hair(np.array(im))[0] & (np.array(im)[:, :, 3] > 0))
            if (anim, d, i) in GOLD_MASK: masks[-1] = GOLD_MASK[(anim, d, i)] & (np.array(im)[:, :, 3] > 0)
        if anim == 'dheader' and f'getup-{d}' in new:
            # PixelLab moves him across the frame as he dives; the game moves the player itself, and the get-up that follows
            # starts where he stands - so slide the frames back progressively, landing where the get-up starts
            dx = bbox_cx(new[f'getup-{d}'][0]) - bbox_cx(lst[-1])
            lst = [shifted(im, dx * min(1, max(0, (k - 1) / 3))) for k, im in enumerate(lst)]
        new[f'{anim}-{d}'] = lst
        if any(m is not None for m in masks): prot[f'{anim}-{d}'] = masks
    for d in (PL_DIR if anim not in ONLY_MADE else ()):          # ONLY_MADE: no stand-ins, but a made East still mirrors to West
        if f'{anim}-{d}' not in new:
            nb = next((n for n in NEIGH[d] if f'{anim}-{n}' in new), None)
            if nb: new[f'{anim}-{d}'] = new[f'{anim}-{nb}']; print(f'  {anim}-{d} missing in the export: using {nb}')
    for d, src_d in MIRROR.items():
        if f'{anim}-{src_d}' in new: new[f'{anim}-{d}'] = [ImageOps.mirror(im) for im in new[f'{anim}-{src_d}']]
        if f'{anim}-{src_d}' in prot: prot[f'{anim}-{d}'] = [None if m is None else np.fliplr(m) for m in prot[f'{anim}-{src_d}']]
# batch 11b: sprint N regenerated (the first try was drawn tiny)
for d in ('S', 'N'):                             # throw-in: the taker waits holding the ball over his head (first frame)
    if f'throwin-{d}' in new: new[f'throwinhold-{d}'] = new[f'throwin-{d}'][:1]
if 'trophy-S' in new:                            # batch 12: after the lift he keeps the cup up there (loop of the raised frames)
    k0 = TROPHY_UP; new['trophyup-S'] = new['trophy-S'][k0:]
    if 'trophy-S' in prot: prot['trophyup-S'] = prot['trophy-S'][k0:]
print('new anims', {k: len(v) for k, v in new.items()}, 'stray px removed', removed_total)

# ---------- IRO-home: region recolour of the new IS frames (IRO = black kit, red trims; the red sash comes with the kit-painting pass)
WHITE, LAV = (252, 254, 252), (174, 180, 221)
SH_L, SH_D, SH_DD, GOLD = (175, 193, 211), (132, 153, 180), (100, 118, 145), (196, 158, 78)
IRO_BASE, IRO_SHADE, IRO_DEEP, IRO_RED = (40, 40, 48), (24, 24, 30), (12, 12, 16), (216, 33, 39)
IRO_RED_D = (150, 20, 28)
BACKUP = sys.argv[3] if len(sys.argv) > 3 else None             # folder with the v0.1 atlases + manifest
def load_atlas_from(folder, kit):
    js = json.load(open(f'{folder}/{kit}.json')); at = Image.open(f'{folder}/{kit}.webp').convert('RGBA'); fr = {}
    for k, f in js['frames'].items():
        r, s_, ss = f['frame'], f['spriteSourceSize'], f['sourceSize']
        im = Image.new('RGBA', (ss['w'], ss['h'])); im.paste(at.crop((r['x'], r['y'], r['x'] + r['w'], r['y'] + r['h'])), (s_['x'], s_['y'])); fr[k] = im
    return fr
old_is, old_iro = (load_atlas_from(BACKUP, 'IS-home'), load_atlas_from(BACKUP, 'IRO-home')) if BACKUP else (load_atlas('IS-home'), load_atlas('IRO-home'))
OLD_ANIMS = json.load(open(f'{BACKUP}/manifest.json'))['kits'] if BACKUP else None


def recolour(im, d=None):
    """IS white kit -> IRO black kit. Socks stay white: they are the white pixels further down the body than the shorts,
    measured along the head -> shorts axis, so it also works for players lying on the ground (slides, falls)"""
    a = np.array(im); out = a.copy(); al = a[:, :, 3] > 0; rgb = a[:, :, :3]
    eq = lambda c: al & np.all(rgb == np.array(c, np.uint8), axis=2)
    sh = eq(SH_L) | eq(SH_D) | eq(SH_DD)
    lab, n = ndimage.label(sh, structure=np.ones((3, 3)))
    if n: sizes = ndimage.sum(sh, lab, range(1, n + 1)); shorts = lab == 1 + int(np.argmax(sizes))
    else: shorts = sh
    hair = eq((62, 12, 10))
    ys, xs = np.mgrid[0:a.shape[0], 0:a.shape[1]]
    if shorts.any() and hair.any():
        c_s = np.array([xs[shorts].mean(), ys[shorts].mean()]); c_h = np.array([xs[hair].mean(), ys[hair].mean()])
        ax_ = c_s - c_h; ax_ /= (np.hypot(*ax_) or 1)
        proj = (xs - c_s[0]) * ax_[0] + (ys - c_s[1]) * ax_[1]
        below = proj > proj[shorts].max() - 1
    else:
        below = np.zeros_like(al)
    def put(mask, c): out[mask, :3] = c
    put(eq(WHITE) & ~below, IRO_BASE); put(eq(LAV) & ~below, IRO_SHADE)
    for c, to in ((SH_L, IRO_BASE), (SH_D, IRO_SHADE), (SH_DD, IRO_DEEP)):
        put(eq(c) & ~below, to)
        put(eq(c) & below & ~shorts, {SH_L: LAV, SH_D: LAV, SH_DD: SH_D}[c])   # sock shading stays a light grey
    put(eq(SH_L) & shorts, IRO_BASE); put(eq(SH_D) & shorts, IRO_SHADE); put(eq(SH_DD) & shorts, IRO_DEEP)
    put(eq(GOLD), IRO_RED)                                     # sleeve stripes, shorts trim, sock band
    # the IRO SASH: a wide red band over the left shoulder to the right hip, painted in body coordinates (head -> shorts
    # axis), so it follows the body in slides and falls; front views run top-right -> bottom-left, back views the mirror
    if d and shorts.any() and hair.any():
        shirt = (eq(WHITE) | eq(LAV)) & ~below
        if shirt.sum() > 30:
            vx_, vy_ = ax_[1], -ax_[0]                                       # across the body
            top = np.percentile(proj[shirt], 8); bot = proj[shorts].min()
            ss = (proj - top) / max(4.0, bot - top)                           # 0 = shoulders, 1 = waist
            tt = (xs - c_s[0]) * vx_ + (ys - c_s[1]) * vy_
            hw = max(4.0, np.percentile(np.abs(tt[shirt]), 55))               # torso half-width (arms count less)
            tt = tt / hw
            front = d in ('S', 'SE', 'SW', 'W')
            centre = 0.85 * (1 - 2 * ss) * (1 if front else -1)
            band = shirt & (np.abs(tt - centre) < 0.72) & (ss > -0.15) & (ss < 1.1)
            hatch = ((xs + ys) % 4 == 0)
            put(band & eq(WHITE), IRO_RED); put(band & eq(LAV), IRO_RED_D)
            put(band & hatch & eq(WHITE), IRO_RED_D)
    return Image.fromarray(out)


man = json.load(open(f'{GAME}/assets/manifest.json'))
# every team kit is painted onto the same PixelLab frames (kits.py); IS-home = the frames as made
from kits import KITS, paint
ONLY = os.environ.get('HC2_KITS')                                 # e.g. "IS-home,IRO-home" for a quick build
for kit in ['IS-home'] + list(KITS):
    if ONLY and kit not in ONLY.split(','): continue
    old = old_is if kit == 'IS-home' else old_iro
    frames, an = [], {}
    def kit_frame(name, i, im):
        if kit == 'IS-home': return im
        out = paint(im, name.rsplit('-', 1)[1], KITS[kit])
        m = prot.get(name, [None] * (i + 1))[i]
        if m is not None: o = np.array(out); o[m] = np.array(im)[m]; out = Image.fromarray(o)      # the ball stays a ball
        return out
    for name, lst in new.items():
        keys = [f'{name}-{i}' for i in range(len(lst))]; an[name] = keys
        frames += [(k, kit_frame(name, i, im)) for i, (k, im) in enumerate(zip(keys, lst))]
    for name, keys in OLD_ANIMS['IS-home']['anims'].items():     # old v0.1 frames for anything not remade yet
        if name in an: continue
        an[name] = [f'old-{k}' for k in keys]; frames += [(f'old-{k}', pad_old(old_is[k])) for k in keys]
    for d in DIRS:                                               # no pass yet in a direction: use that direction's kick
        if f'pass-{d}' not in an and f'kick-{d}' in an: an[f'pass-{d}'] = an[f'kick-{d}']
    h = pack(frames, kit)
    man['kits'][kit] = dict(anims=an, feetY=FEET, frameH=FH, n=len(frames), carry=sorted(c for c in CARRY if c in an),
                            src='PixelLab (IS rig) + kits.py')
    org = {f'{a_}-S': [0.5, (199 - TALL[a_.replace('up', '')]) / (WIN[3] - TALL[a_.replace('up', '')])] for a_ in ('trophy', 'trophyup') if f'{a_}-S' in an}
    org.update({f'{a_}-{d_}': [0.5, (199 - WIN_RIG[1]) / (WIN_RIG[3] - WIN_RIG[1])] for a_ in RIG for d_ in ('E', 'W') if f'{a_}-{d_}' in an})   # batch 16
    if org: man['kits'][kit]['origins'] = org                    # tall frames: feet row / frame height
    print(kit, len(frames), 'frames, atlas h', h)
json.dump(man, open(f'{GAME}/assets/manifest.json', 'w'))

# ---------- measure the new run stride (planted foot travel per frame, E-facing) for leg sync
st = []
for i, im in enumerate(new['run-E']):
    a = np.array(im)[:, :, 3] > 0; rows = np.nonzero(a.any(1))[0]; low = rows.max()
    xs = np.nonzero(a[low - 2:low + 1].any(0))[0]; st.append((i, low, xs.min(), xs.max()))
print('run-E lowest rows (frame, row, xmin, xmax):', st)
