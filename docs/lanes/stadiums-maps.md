# Lane brief: Stadiums & maps

**Account:** the co-designer's. **Branch:** `friend/stadium-<name>`. **Card lane:** Design & Vision (title starts "Stadium:").

## Scope
New stadiums and grounds, the pitch around them, and any maps or venue screens. The players, ball and goals stay as
they are; a stadium is the world painted around them.

## The one thing that must match: the projection
The camera never tilts. It only scrolls left and right over one big pre-projected painting, as if seen from the main
(near) stand. Everything is drawn to this geometry (`tools/stadium/cfg.py`, the same numbers as in the game):

| | Value |
| --- | --- |
| Pitch | 105 m x 68 m, plus 6 m of grass behind each goal line and 3.5 m beside each touchline |
| Along the pitch | 48 px per metre at mid-depth |
| Across the pitch | 38 px per metre (foreshortened) |
| Height (posts, people, stands) | 60 px per metre, the same everywhere |
| Perspective | horizontal scale 0.87 at the far touchline, 1.13 at the near one; lines across the pitch lean in towards the centre |
| Metres to pixels | `x_px = 3214 + (x - 52.5) * 48 * s(y)`, `y_px = 900 + (y + 3.5) * 38 - z * 60`, where `s(y) = 0.87 + 0.26 * y / 68` (x from the left goal line, y from the far touchline, z up, all in metres) |
| Whole world | 6429 x 3750 px: a 900 px band above the pitch for the far stand, then the 6429 x 2850 pitch image |
| Screen | 640 x 360 base resolution; players are about 110 px tall |

Draw anything standing in the world (stands, walls, people, flags) at 60 px per metre of height, on the right depth row.
A wrong scale is the usual reason a stadium "feels off".

## The layers (the active stadium, Het Kleine Loo "OG", is in `art/stadiums/og/`)

| Layer file | Size | What |
| --- | --- | --- |
| `HC2-E1-pitch-full.png` | 6429 x 2850 | grass, lines, ground outside the pitch |
| `HC2-E2-far-bg.png` | 6429 x 900 | backdrop + far stand, sits directly above the pitch image |
| `HC2-E2-crowd-idle-0..3`, `-cheer-0..3` | 6429 x 900 | the far crowd: 4 idle frames (180 ms), 4 cheer frames (140 ms, on goals) |
| `HC2-E2-booth-idle-0..3`, `-cheer-0..3` | 6429 x 900 | Rami's commentary booth |
| `HC2-E2-far-fg.png` | 6429 x 900 | front wall, tunnel, pitch-side boards (with the open gate in front of the tunnel) |
| `HC2-E3-surround.png` | 6429 x 2850 | end stands and end boards, over the pitch |
| `HC2-E3-surround-top.png` | 6429 x 900 | the far-corner part of the end stands |
| `HC2-E3-ends-idle-0..3`, `-cheer-0..3` | 6429 x 3750 | the crowds behind the goals |
| `HC2-E3-near-boards-back.png` | 6429 x 2850 | the near boards, drawn OVER the players |

Draw order, back to front: backdrop → crowd → booth → front wall → boards → pitch → end stands → goal back → players,
ball, goal frame, flags (sorted by feet) → near boards → HUD. Players walking out of the tunnel pass between the front
wall and the pitch-side boards. `art/stadiums/README-environment.txt` has the full story and
`art/stadiums/aseprite/` the editable Aseprite files (pitch, far side, goals, flag, ball).

## How a new stadium gets made
1. **[PixelLab]** make the pieces: stand sections, crowd sprites, boards, buildings, trees, textures.
   - The API has map and tile tools (top-down tilesets, isometric tiles, map objects, pro tiles).
   - PixelLab makes small pieces, not a 6429 px painting.
   - Prompt for the 3/4 view from the main stand, not top-down.
2. **[Aseprite]** lay the pieces onto the layer canvases above, at the right scale and depth. Copy the OG files as your starting point.
3. **[cloud]** build it into the game:
   - `python3 tools/stadium/world_build.py <your layers folder> game/assets`, then `python3 tools/lo_build.py game`
   - The builder cuts 1024 px tiles, keeps one file per distinct crowd frame and updates the manifest.
   - Run on the OG layers it reproduces today's tiles byte for byte.
4. Play a match and the Test Lab on your preview page; check the tunnel walk-out, goals at both ends, and a corner on each side.

## Code
The stadium is drawn in code by `game/src/world.js` (the `Stadium` class: tiles, crowd frames, goals, flags, sky and
weather). The projection helpers `wx`, `wy` and `scaleAt` are in `game/src/core.js`; change them only with an OK'd card,
since every lane depends on them.

## Rules
- Art only from PixelLab or Aseprite.
- Boards show sponsors and the venue only. "RISE" appears only where it already is.
- Crowd sections in team colours (IS, IRO, USCS, LUC, THUAS, AUC + Den Haag) are welcome. Kits and flags carry only the team emblems.
- The HC2 palette is in `art/style/HC2-palette.gpl`, the look in `art/style/HC2-A1-master-style-frame.png`.
- Raw exports go in `art/stadiums/<name>/`. Keep each file under 20 MB; zip a layer set.
- Never commit a PixelLab key. If you use Luca's, say in the PR how many generations it took.

## Done means
The stadium builds with `world_build.py`, a full match runs with `node tools/smoke.js` ending `errors []`, the walk-out
and both goals look right on the preview, and the PR has a screenshot of each end and the centre.
