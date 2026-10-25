#!/usr/bin/env python3
# t-031 KEEPER HANDS: finds where the keeper's gloves are on every frame of his catching moves, so the game can draw the
# ball IN them (keeper.js GK_HANDS) instead of next to him. Reads the PixelLab frames only (the white gloves), draws
# nothing. Prints the JS table (keeper.js sets kgetup and kleap's landing frame to chest points by hand: his gloves are
# on the grass there); --check compares every keeper kit against the first one (they share the poses).
#   python3 tools/gk_hands.py            -> the GK_HANDS table (x, y in the frame's own window, E and W)
#   python3 tools/gk_hands.py --check    -> every kit's frames have the first kit's outline (so its table fits them all)
import json, sys
from PIL import Image
MOVES = ['kdivecatchDown', 'kdivecatchUp', 'kleap', 'ksmother', 'kcollapseDown', 'kcollapseUp', 'kgetup']
M = json.load(open('game/assets/manifest.json'))['kits']
KITS = [k for k in M if k.endswith('-keeper')]

def frames(kit):
    J = json.load(open(f'game/assets/sprites/{kit}.json'))['frames']
    im = Image.open(f'game/assets/sprites/{kit}.webp').convert('RGBA')
    def get(n):
        f = J[n]; ss = f['sourceSize']; c = Image.new('RGBA', (ss['w'], ss['h']), (0, 0, 0, 0))
        r = f['frame']; c.alpha_composite(im.crop((r['x'], r['y'], r['x'] + r['w'], r['y'] + r['h'])), (f['spriteSourceSize']['x'], f['spriteSourceSize']['y'])); return c
    return get

def gloves(img):
    W, H = img.size; px = img.load(); seen = set(); comps = []
    white = lambda p: p[3] > 200 and min(p[:3]) >= 190 and max(p[:3]) - min(p[:3]) < 45
    for y in range(H):
        for x in range(W):
            if (x, y) in seen or not white(px[x, y]): continue
            st = [(x, y)]; seen.add((x, y)); c = []
            while st:
                a, b = st.pop(); c.append((a, b))
                for dx in (-1, 0, 1):
                    for dy in (-1, 0, 1):
                        q = (a + dx, b + dy)
                        if 0 <= q[0] < W and 0 <= q[1] < H and q not in seen and white(px[q]): seen.add(q); st.append(q)
            if len(c) >= 6: comps.append(c)
    comps.sort(key=len, reverse=True); g = comps[:2]
    if len(g) == 2 and len(g[1]) < len(g[0]) * 0.25: g = g[:1]            # (a stray white kit detail, not the other glove)
    if not g: return None
    cen = [(sum(p[0] for p in c) / len(c), sum(p[1] for p in c) / len(c)) for c in g]
    return [round(sum(c[0] for c in cen) / len(cen)), round(sum(c[1] for c in cen) / len(cen))]   # between his gloves: where the ball sits

def table(kit):
    get = frames(kit); A = M[kit]['anims']; T = {}
    for mv in MOVES:
        for d in 'EW':
            n = f'{mv}-{d}'
            if n in A: T[n] = [gloves(get(f)) for f in A[n]]
    return T

if __name__ == '__main__':
    base = table(KITS[0])
    if '--check' in sys.argv:                                               # the kits share the poses: their outlines must match
        # (only the outline: IRO's white shirt fools the glove finder, so the table is measured on the first kit only)
        g0 = frames(KITS[0]); A = M[KITS[0]]['anims']
        for k in KITS[1:]:
            gk = frames(k); worst = 0
            for mv in MOVES:
                for d in 'EW':
                    for f in A.get(f'{mv}-{d}', []):
                        a, b = g0(f).split()[3], gk(f).split()[3]
                        worst = max(worst, sum(1 for x, y in zip(a.tobytes(), b.tobytes()) if (x > 128) != (y > 128)))
            print(k, 'pixels outside', KITS[0] + "'s outline on its worst frame:", worst)
    else:
        print('const GK_HANDS = {')
        for n, pts in base.items(): print(f"  '{n}': {json.dumps(pts, separators=(',', ':'))},")
        print('};')
