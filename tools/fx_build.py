# v0.7: PixelLab effects (Object Creator, 16 items) -> one atlas assets/hud/fx.webp + fx.json, names used by game.js
import json, sys, os
from PIL import Image
srcs, game = sys.argv[1].split(','), sys.argv[2]; src = srcs[0]
NAMES = {  # PixelLab folder prefix -> frame name in the game
  'tall_flickering_flame': 'flame', 'wide_burst_of_fire': 'flame2', 'small_flame_tongue': 'flameSmall', 'twin_flame': 'flameTwin',
  'thick_upward_arrow': 'arrowbang', 'upward_arrow_that_turns': 'arrowbang2', 'white_and_yellow_star': 'impact', 'big_jagged_impact': 'impactBig',
  'ring_of_fire': 'ring', 'cluster_of_glowing': 'sparks', 'crackling_blue': 'bolt', 'blue_flame': 'flameBlue', 'purple_and_gold': 'flamePurple',
  'small_puff_of_dust': 'dust', 'curved_white_speed': 'whoosh', 'glowing_golden_energy': 'orb',
  # batch 11d: trophy ceremony + referee props
  'big_golden_football_trophy': 'trophy', 'gold_winner_medal': 'medalGold', 'silver_runner': 'medalSilver', 'burst_of_multicolour': 'confetti',
  'golden_firework': 'fwGold', 'pink_and_white_firework': 'fwPink', 'curly_party_streamers': 'streamers', 'golden_laurel': 'laurel',
  'blank_golden_ribbon': 'ribbon', 'white_and_yellow_sparkle': 'sparkle', 'golden_football_boot': 'goldBoot', 'golden_football_award': 'goldBall',
  'silver_referee_whistle': 'whistle', 'yellow_referee_card': 'cardY', 'red_referee_card': 'cardR', 'small_golden_crown': 'crown'}
ims = {}
for sdir in srcs:
  for d in os.listdir(os.path.join(sdir, 'objects')):
    key = next((v for k, v in sorted(NAMES.items(), key=lambda kv: -len(kv[0])) if d.startswith(k)), None)
    if not key: print('unmapped object', d); continue
    rot = os.path.join(sdir, 'objects', d, 'rotations'); f = [x for x in os.listdir(rot) if x.endswith('.png')][0]
    im = Image.open(os.path.join(rot, f)).convert('RGBA'); bb = im.getbbox(); ims[key] = im.crop(bb)
    if key in ('trophy', 'fwGold', 'fwPink', 'confetti', 'medalGold', 'medalSilver'): ims[key].save(os.path.join(game, 'assets', 'hud', f'{key}.png'))   # the champion screen (HTML) uses these
if 'cardY' in ims:                                   # PixelLab drew the red card empty: it's the yellow card, repainted
    import numpy as np
    a = np.array(ims['cardY']); rgb = a[:, :, :3].astype(int); yel = (a[:, :, 3] > 0) & (rgb[:, :, 0] > 150) & (rgb[:, :, 1] > 120) & (rgb[:, :, 2] < 120)
    lum = rgb[:, :, 0] * 0.5 + rgb[:, :, 1] * 0.5
    a[yel, 0] = np.clip(lum[yel] * 0.95, 0, 255).astype(np.uint8); a[yel, 1] = (lum[yel] * 0.16).astype(np.uint8); a[yel, 2] = (lum[yel] * 0.2).astype(np.uint8)
    ims['cardR'] = Image.fromarray(a)
ims.pop('goldBall', None)                            # came out as an American football - not used
pad, x, y, rowh, W = 2, 0, 0, 0, 256
frames = {}; place = []
for k in sorted(ims, key=lambda k: -ims[k].height):
    im = ims[k]
    if x + im.width > W: x, y, rowh = 0, y + rowh + pad, 0
    place.append((k, x, y)); frames[k] = {'frame': {'x': x, 'y': y, 'w': im.width, 'h': im.height}, 'rotated': False, 'trimmed': False,
        'spriteSourceSize': {'x': 0, 'y': 0, 'w': im.width, 'h': im.height}, 'sourceSize': {'w': im.width, 'h': im.height}}
    x += im.width + pad; rowh = max(rowh, im.height)
H = y + rowh
sheet = Image.new('RGBA', (W, H))
for k, px, py in place: sheet.alpha_composite(ims[k], (px, py))
out = os.path.join(game, 'assets', 'hud'); sheet.save(os.path.join(out, 'fx.webp'), lossless=True); sheet.save(os.path.join(src, 'fx-sheet.png'))
json.dump({'frames': frames, 'meta': {'image': 'fx.webp', 'size': {'w': W, 'h': H}, 'scale': 1, 'source': 'PixelLab Object Creator batch 11'}}, open(os.path.join(out, 'fx.json'), 'w'))
man = json.load(open(os.path.join(game, 'assets', 'manifest.json'))); man['fx'] = sorted(frames); json.dump(man, open(os.path.join(game, 'assets', 'manifest.json'), 'w'))
print(len(frames), 'fx frames', W, 'x', H, {k: (v['frame']['w'], v['frame']['h']) for k, v in frames.items()})
