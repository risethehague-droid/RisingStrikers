# Build the stadium (world) tiles for the game from a folder of stadium layer PNGs.
# World-only: kits, props and HUD in the manifest are left alone (the old all-in-one exporter rewrote them).
#
#   python3 tools/stadium/world_build.py <layers dir> game/assets
#   python3 tools/lo_build.py game          # then the phone (lite) copies
#
# Layers (all 6429 px wide; names as in art/stadiums/og):
#   HC2-E1-pitch-full.png                  6429 x 2850  grass, lines, ground outside the pitch
#   HC2-E2-far-bg.png                      6429 x 900   backdrop + far stand (sits directly above the pitch image)
#   HC2-E3-surround.png                    6429 x 2850  end stands + end boards over the pitch image
#   HC2-E3-surround-top.png                6429 x 900   the far-corner part of the end stands
#   HC2-E2-far-fg.png                      6429 x 900   front wall, tunnel, pitch-side boards
#   HC2-E2-crowd-{idle,cheer}-{0..3}.png   6429 x 900   the crowd, 4 idle + 4 cheer frames
#   HC2-E2-booth-{idle,cheer}-{0..3}.png   6429 x 900   the commentary booth
#   HC2-E3-ends-{idle,cheer}-{0..3}.png    6429 x 3750  the end-stand crowds
#   HC2-E3-near-boards-back.png            6429 x 2850  near boards, drawn OVER the players
# Output: game/assets/world/w_<tx>_<ty>_<n>.webp (1024 px tiles, one file per distinct crowd frame),
#         nb_<tx>_<ty>.webp (near-board overlay pieces), and manifest.json keys tile, farH, worldW, worldH, tiles, over.
import numpy as np, os, json, glob, hashlib, sys
from PIL import Image

ENV, ASSETS = sys.argv[1], sys.argv[2]
OUT = f'{ASSETS}/world'; os.makedirs(OUT, exist_ok=True)
FAR_H = 900; T = 1024
L = lambda n: Image.open(f'{ENV}/{n}').convert('RGBA')
webp = lambda im, path: im.save(path, 'WEBP', lossless=True, quality=100, method=6)
for f in glob.glob(f'{OUT}/w_*.webp') + glob.glob(f'{OUT}/nb_*.webp'): os.remove(f)   # old tiles out (names can change)

man = json.load(open(f'{ASSETS}/manifest.json'))
pitch = L('HC2-E1-pitch-full.png'); W, Hp = pitch.size; H = FAR_H + Hp
man.update(tile=T, farH=FAR_H, worldW=W, worldH=H)
base = Image.new('RGBA', (W, H), (40, 90, 50, 255)); base.paste(L('HC2-E2-far-bg.png'), (0, 0)); base.paste(pitch, (0, FAR_H))
base.alpha_composite(L('HC2-E3-surround.png'), (0, FAR_H)); base.alpha_composite(L('HC2-E3-surround-top.png'), (0, 0))
fg = L('HC2-E2-far-fg.png')
frames = []
for mode, t in [('idle', t) for t in range(4)] + [('cheer', t) for t in range(4)]:
    w = base.copy()
    w.alpha_composite(L(f'HC2-E2-crowd-{mode}-{t}.png'), (0, 0)); w.alpha_composite(L(f'HC2-E2-booth-{mode}-{t}.png'), (0, 0))
    w.alpha_composite(fg, (0, 0)); w.alpha_composite(L(f'HC2-E3-ends-{mode}-{t}.png'), (0, 0))
    frames.append(np.array(w.convert('RGB'))); print('frame', mode, t, flush=True)
tiles = []; nx, ny = (W + T - 1) // T, (H + T - 1) // T
for ty in range(ny):
    for tx in range(nx):
        sl = (slice(ty * T, (ty + 1) * T), slice(tx * T, (tx + 1) * T)); parts = [f[sl] for f in frames]; keys = []; seen = {}
        for p in parts:
            h = hashlib.md5(p.tobytes()).hexdigest()
            if h not in seen:
                name = f'w_{tx}_{ty}_{len(seen)}'; webp(Image.fromarray(p), f'{OUT}/{name}.webp'); seen[h] = name
            keys.append(seen[h])
        tiles.append(dict(x=tx * T, y=ty * T, w=parts[0].shape[1], h=parts[0].shape[0], frames=keys))
man['tiles'] = tiles
nb = Image.new('RGBA', (W, H)); nb.alpha_composite(L('HC2-E3-near-boards-back.png'), (0, FAR_H)); a = np.array(nb); over = []
for ty in range(ny):
    for tx in range(nx):
        p = a[ty * T:(ty + 1) * T, tx * T:(tx + 1) * T]
        if p[:, :, 3].any():
            ys, xs = np.nonzero(p[:, :, 3]); y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
            name = f'nb_{tx}_{ty}'; webp(Image.fromarray(p[y0:y1, x0:x1]), f'{OUT}/{name}.webp'); over.append(dict(key=name, x=int(tx * T + x0), y=int(ty * T + y0)))
man['over'] = over
json.dump(man, open(f'{ASSETS}/manifest.json', 'w'))
print('world ok:', len(tiles), 'tiles,', len(os.listdir(OUT)), 'files')
