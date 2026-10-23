# Rami (commentator) into the web game: the picked 64 px ZINE sticker (Aseprite, 12 frames: talk 0-3, blink, laugh,
# tongue, goal, shock, pout, smirk, shh) -> assets/hud/rami.webp + .json atlas; the call-out lines (E11 lines json)
# go into the manifest so the game can pick a line + expression per moment.
#   python3 rami_build.py <web/game> <rami .aseprite> <rami-lines.json>
import json, sys
sys.path.insert(0, __file__.rsplit('/', 2)[0] + '/tools')
from ase_read import read
from PIL import Image
game, ase, lines = sys.argv[1:4]
r = read(ase); W, H, fr = r['W'], r['H'], r['frames']
sheet = Image.new('RGBA', (W * len(fr), H), (0, 0, 0, 0))
js = {'frames': {}, 'meta': {'image': 'rami.webp', 'size': {'w': W * len(fr), 'h': H}, 'scale': '1'}}
for i, im in enumerate(fr):
    sheet.paste(im, (i * W, 0))
    js['frames'][f'rami-{i}'] = {'frame': {'x': i * W, 'y': 0, 'w': W, 'h': H}, 'rotated': False, 'trimmed': False,
                                 'spriteSourceSize': {'x': 0, 'y': 0, 'w': W, 'h': H}, 'sourceSize': {'w': W, 'h': H}}
sheet.save(f'{game}/assets/hud/rami.webp', 'WEBP', lossless=True, quality=100, method=6)
json.dump(js, open(f'{game}/assets/hud/rami.json', 'w'))
L = json.load(open(lines))
man = json.load(open(f'{game}/assets/manifest.json'))
man['rami'] = {'w': W, 'h': H, 'tags': {t['name']: [t['from'], t['to']] for t in r['tags']}, 'durs': r['durs'], 'lines': L['lines']}
json.dump(man, open(f'{game}/assets/manifest.json', 'w'))
print('rami', W, H, len(fr), 'frames;', len(L['lines']), 'lines')
