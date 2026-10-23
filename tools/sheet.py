# contact sheet of one PixelLab animation folder: rows = directions, columns = frames (index labelled), 2x zoom of the
# 64..192 x 40..216 crop of the 256 canvas
import sys, glob, os
from PIL import Image, ImageDraw
root, key, out = sys.argv[1], sys.argv[2], sys.argv[3]
folder = [f for f in glob.glob(f'{root}/*/animations/*') if key.lower() in os.path.basename(f).lower()][0]
dirs = ['east', 'north-east', 'south-east', 'south', 'north']
rows = [(d, sorted(glob.glob(f'{folder}/{d}/frame_*.png'))) for d in dirs]
n = max(len(fs) for _, fs in rows); CW, CH = 128 * 2, 176 * 2
sheet = Image.new('RGBA', (n * CW + 90, len(rows) * CH), (40, 44, 52, 255)); dr = ImageDraw.Draw(sheet)
for r, (d, fs) in enumerate(rows):
    dr.text((4, r * CH + 8), d, fill=(255, 255, 255, 255))
    for c, f in enumerate(fs):
        im = Image.open(f).convert('RGBA').crop((64, 40, 192, 216)).resize((CW, CH), Image.NEAREST)
        sheet.alpha_composite(im, (90 + c * CW, r * CH)); dr.text((90 + c * CW + 4, r * CH + 4), str(c), fill=(255, 220, 90, 255))
sheet.save(out); print(folder, [len(fs) for _, fs in rows])
