# new PixelLab ball (16 px object, "rolls to the right" animation) -> props atlas ball-x0..7 / ball-y0..7
# The ball sits in the same 26 x 26 source box as before with its bottom on the same line, so the game's offsets stay;
# ball-y (rolling up / down the screen) = the same frames turned a quarter.
import json, glob, sys, shutil, os
from PIL import Image
game, src = sys.argv[1], sys.argv[2]
A = f'{game}/assets/sprites/props'
if not os.path.exists(A + '-preball.webp'): shutil.copy(A + '.webp', A + '-preball.webp'); shutil.copy(A + '.json', A + '-preball.json')
atl = Image.open(A + '-preball.webp').convert('RGBA'); man = json.load(open(A + '-preball.json'))
fr = [Image.open(f).convert('RGBA') for f in sorted(glob.glob(f'{src}/*/animations/*/unknown/frame_*.png'))][:8]
N = fr[0].size[0]; assert len(fr) == 8 and fr[0].size == (N, N) and N <= 26, (len(fr), fr[0].size)
for axis in 'xy':
    for i, im in enumerate(fr):
        if axis == 'y': im = im.rotate(-90)
        f = man['frames'][f'ball-{axis}{i}']; x, y = f['frame']['x'], f['frame']['y']
        atl.paste(Image.new('RGBA', (f['frame']['w'], f['frame']['h'])), (x, y))
        assert f['frame']['w'] >= N or True
        atl.paste(im, (x, y))
        f.update(frame=dict(x=x, y=y, w=N, h=N), trimmed=True, spriteSourceSize=dict(x=(26 - N) // 2, y=26 - N, w=N, h=N), sourceSize=dict(w=26, h=26))
atl.save(A + '.webp', lossless=True); json.dump(man, open(A + '.json', 'w'))
M = json.load(open(f'{game}/assets/manifest.json')); M['ballPx'] = N; json.dump(M, open(f'{game}/assets/manifest.json', 'w'))
print('ball frames written')
