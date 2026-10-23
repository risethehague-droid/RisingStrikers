# v0.7.5 PHONE (LITE) ASSETS: every texture at half size -> a quarter of the memory. iOS kills a web page that uses too much
# graphics memory (it reloads / "this browser doesn't work"); the game loads these on touch screens and keeps all its
# drawing sizes (the full-size width/height is handed to Phaser, so the frames stay where they are, just with fewer texels).
#   python3 lo_build.py game      -> game/assets-lo/{sprites,world,hud}/*.webp + game/assets-lo/dims.json
import json, os, sys, glob
from PIL import Image
G = sys.argv[1]; dims = {}
for sub in ('sprites', 'world', 'hud'):
    os.makedirs(f'{G}/assets-lo/{sub}', exist_ok=True)
    for f in sorted(glob.glob(f'{G}/assets/{sub}/*.webp')):
        rel = f'{sub}/{os.path.basename(f)}'
        if 'preball' in rel: continue
        im = Image.open(f).convert('RGBA'); w, h = im.size; dims[rel] = [w, h]
        lo = im.convert('RGBa').resize((max(1, (w + 1) // 2), max(1, (h + 1) // 2)), Image.BOX).convert('RGBA')   # premultiplied: no dark fringes
        lo.save(f'{G}/assets-lo/{rel}', 'WEBP', lossless=True, quality=100, method=4)
json.dump(dims, open(f'{G}/assets-lo/dims.json', 'w'))
tot = sum(w * h * 4 for w, h in dims.values())
print(len(dims), 'textures; full', round(tot / 1e6), 'MB decoded -> lite', round(tot / 4e6), 'MB')
