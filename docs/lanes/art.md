# Lane brief: Art (PixelLab → Aseprite → kits)

**Account:** Luca's (it needs Luca's PixelLab account and his laptop). **Branch:** `art/<topic>`. **Card lane:** Art.

## Scope
New animations and sprites for players, keepers, the referee, effects and HUD pieces, made in PixelLab or Aseprite,
then built into every team's kit.

## The pipeline (it works; keep to it)
1. **[PixelLab]** The outfield player is the IS character "young adult male football player" (256 x 256, 8 directions).
   The keeper and the referee are their own characters.
2. **Add Animation → Describe your own → Custom Animation:**
   - model PixMiniMax
   - 8 frames, keep first frame on
   - AI rewrite of the description off
   - a detailed, ball-free prompt ("with no ball anywhere in the picture")
3. **Directions:** generate E, NE, SE, S and N, one at a time (about 3 can run at once). W / NW / SW are mirrors. Each direction costs 1 generation; check the Generations line first.
4. **Export:** ZIP (all frames). The built-in browser saves it to Downloads as a `.tmp` file. Copy it, without asking, to `HC2-aseprite\pixellab-in\batchN\HC2-PL-batchN-outfield.zip`, then put the leftover `.tmp` on the deletion list in `HC2-TODO.txt`.
5. **[cloud] Map the animation in `tools/kit_build.py`:**
   - `MAP`: the folder name → the game's animation name
   - `TRIM` / `TRIM_DIR`: which frames to keep (the contact frame should land 4th)
   - `SKIP_DIR`: a direction where PixelLab drew a ball
   - `DETACHED`: drop loose balls
6. **Build:**
   - `python3 tools/kit_build.py game <unzipped export> tools/data/kits-v0.1`: every kit is painted from the IS frames
   - `python3 tools/lo_build.py game`: the phone copies
7. **Check by eye:**
   - `tools/sheet.py`: a contact sheet of the raw frames
   - `tools/atlas_sheet.py`: the built frames on two or three kits
   - Compare the manifest before and after: only your animation may be added.
8. **Code:** wire it up in the game (e.g. `KICK_HIT` / `KICK_RATE` for a kick), add a Test Lab test, and make a preview GIF.

## Rules
Art only from PixelLab / Aseprite; generate only when Luca (or the co-designer, for his lanes) asks; kits carry only
the team emblem; reference games only as style recipes in words. `docs/pixellab/` has the tutorial notes.

## Tests
`node tools/smoke.js`, the Test Lab group for the move, and a look at every kit's version of the new frames.
