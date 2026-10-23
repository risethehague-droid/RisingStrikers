# Penalty camera background (PixelLab, 480 x 272) -> assets/pen + the fitted goal geometry in the manifest
#   python3 pen_build.py <web/game> <goal-view.png>
import json, sys
from PIL import Image
GAME, SRC = sys.argv[1], sys.argv[2]
import os; os.makedirs(f'{GAME}/assets/pen', exist_ok=True)
Image.open(SRC).convert('RGB').save(f'{GAME}/assets/pen/goal-view.webp', 'WEBP', lossless=True, method=6)
man = json.load(open(f'{GAME}/assets/manifest.json'))
# measured on the image (image pixels): posts x 160 / 320, crossbar row 121, goal line row 180, penalty spot (240, 251)
man['penalty'] = dict(bg='assets/pen/goal-view.webp', scale=2.5, crop=[48, 56],
                      goal=dict(l=160, r=320, bar=121, line=180), spot=[240, 251],
                      camBack=14.5, keeperScale=1, takerScale=2, taker=[-14, 52], strikeT=0.55,
                      diveReach=2.4, diveTime=0.4, diveDrift=0)
json.dump(man, open(f'{GAME}/assets/manifest.json', 'w'))
print('penalty geometry written')
