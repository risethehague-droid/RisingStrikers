import json, sys
from PIL import Image, ImageDraw
G, kits, anim, out = sys.argv[1], sys.argv[2].split(','), sys.argv[3], sys.argv[4]
man = json.load(open(f'{G}/assets/manifest.json'))
rows = []
for kit in kits:
    js = json.load(open(f'{G}/assets/sprites/{kit}.json')); at = Image.open(f'{G}/assets/sprites/{kit}.webp').convert('RGBA')
    an = man['kits'][kit]['anims']
    for d in ['E', 'NE', 'N', 'NW', 'W', 'SW', 'S', 'SE']:
        keys = an.get(f'{anim}-{d}')
        if not keys: continue
        ims = []
        for k in keys:
            f = js['frames'][k]; fr = f['frame']; ss = f.get('spriteSourceSize', {'x': 0, 'y': 0}); src = f.get('sourceSize', {'w': fr['w'], 'h': fr['h']})
            c = Image.new('RGBA', (src['w'], src['h'])); c.paste(at.crop((fr['x'], fr['y'], fr['x'] + fr['w'], fr['y'] + fr['h'])), (ss['x'], ss['y'])); ims.append(c)
        rows.append((f'{kit} {d}', ims))
W = max(len(r[1]) for r in rows); fw, fh = rows[0][1][0].size; Z = 2
sh = Image.new('RGBA', (110 + W * fw * Z, len(rows) * fh * Z), (40, 44, 52, 255)); dr = ImageDraw.Draw(sh)
for r, (lab, ims) in enumerate(rows):
    dr.text((4, r * fh * Z + 6), lab, fill=(255, 255, 255, 255))
    for c, im in enumerate(ims):
        sh.alpha_composite(im.resize((fw * Z, fh * Z), Image.NEAREST), (110 + c * fw * Z, r * fh * Z)); dr.text((110 + c * fw * Z + 3, r * fh * Z + 3), str(c), fill=(255, 220, 90, 255))
sh.save(out); print(len(rows), 'rows', fw, fh)
