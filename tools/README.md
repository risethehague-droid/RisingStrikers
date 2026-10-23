# Tools

All tests drive the real game headless (Node + Playwright + Chromium, time stepped by hand). Serve the game first:
`cd game && python3 -m http.server 8765`. Builds are Python 3 (Pillow, NumPy, SciPy).

## Tests
| Command | What it checks |
| --- | --- |
| `node tools/smoke.js` | a match at Easy, Normal, Hard and Rise Warrior; must end `errors []` |
| `GROUP=<id> [REP=3] node tools/grp.js` | one Test Lab group, every test, outcome per test. Groups: FP, K, KH, YS, C, P, M, D, T, A, PK, N5, PW, CH, GK, SM, CS, BW |
| `node tools/proxy093.js run\|def <trials> [levels]` | a scripted "you": run at goal from the centre circle / defend from kick-off, at each level |
| `LEVELS=... node tools/train093.js probe 0 <matches> <secs>` | computer v computer strength per level (S against the old Normal) |
| `node tools/train093.js <level> <iters> <matches> <secs>` | self-play tuning of one level's traits (writes `train093-out/`) |
| `node tools/gk091.js` | keeper situations with the keeper's plan printed |
| `node tools/chipgif.js` | example of recording Test Lab frames for a preview GIF |
| `tools/train092.js` | the v0.9.2 trainer (kept for history) |

## Builds
| Command | What it makes |
| --- | --- |
| `python3 tools/kit_build.py game <unzipped PixelLab export> tools/data/kits-v0.1` | every outfield kit atlas + manifest entries from the IS frames (see `docs/lanes/art.md`) |
| `python3 tools/keeper_build.py game <unzipped keeper export> tools/data/kits-v0.1` | keeper atlases |
| `python3 tools/lo_build.py game` | the half-size phone copies in `game/assets-lo/` |
| `python3 tools/stadium/world_build.py <layers> game/assets` | stadium tiles + manifest world entries (see `docs/lanes/stadiums-maps.md`) |
| `tools/ref_build.py`, `fx_build.py`, `ball_build.py`, `rami_build.py`, `pen_build.py` | referee, effects, ball, Rami, penalty view (read the header of each before running) |
| `tools/sheet.py`, `tools/atlas_sheet.py` | contact sheets: raw PixelLab frames / built frames per kit |

`kits.py`, `ballrm.py`, `ballfind.py`, `tmask.py` are helpers the kit build imports. `tools/stadium/cfg.py` is the world
geometry. `tools/data/kits-v0.1/` holds the first kits, which the kit build still needs for a few old frames.
