---
name: pixellab-art
description: Make new HC2 sprite moves in PixelLab on Luca's laptop and build them into the game's kits (keeper or outfield). Use only when Luca (or the co-designer) has asked for specific art, e.g. "make the carry moves", "do batch 22", "generate X in PixelLab".
---

# /pixellab-art: PixelLab batch → kits in the game

Art rules first (CLAUDE.md "Art"): generate **only when a person on the team asks**; other games are style recipes in
words only; kits carry only the team emblem; kicking moves end "with no ball anywhere in the picture" (unless the ball
is meant to be in the picture, like a keeper carrying it, and then the move goes in the manifest's `carry` list).
Never read or copy the PixelLab "Secret"; on the account page read only the Generations line.

## 1. Plan the batch [cloud]
- The next batch number: the highest `batchN` in `HC2-aseprite\pixellab-in\` on Luca's laptop, plus one.
- Which character: the keeper (`create-character/1d1ad9e1-ec8a-4794-b1bb-af45d7f1e5bb`) or the outfield rig. Which moves,
  their game names (e.g. `kcarry`, `kcarryrun`), how many generations (5 directions each: S, SE, E, NE, N; W / SW / NW
  are mirrored by the builder). Tell Luca the count before starting; check Generations left.

## 2. Generate [your laptop] [PixelLab]
In the Claude app's browser on Luca's laptop (`mcp__remote-devices__Claude_Browser__*`; load the built-in-browser skill):
- the character page → Animate → custom animation, model **PixMiniMax**, a plain prompt (what the body does, the
  direction, "16-bit football keeper", the no-ball line when it applies)
- generate **South** first; then the other directions with each direction box's own generate button (the first
  unlabelled button in the box), because the direction radio doesn't always stick
- if the page is too zoomed to read, use `document.body.style.zoom` and read it with JS / `get_page_text`, not screenshots
- reject non-essential cookies; never tick "Give full trust"; never solve a CAPTCHA (stop and tell Luca)

## 3. Export [your laptop]
- "Export" → "ZIP (all frames)". It lands in `Downloads` as `<uuid>.tmp` (it's a zip).
- Stage it into the cloud (`device_stage_files`) right away, before Chrome tidies it. Then copy it on the laptop to
  `Downloads\HC2-aseprite\pixellab-in\batchN\HC2-PL-batchN-<topic>.zip` without asking (via `device_commit_files` from
  `/mnt/user-data/outputs/`). Never delete on the laptop: anything that should go is listed in `HC2-TODO.txt`.

## 4. Build [cloud]
- A branch `art/batchN-<topic>` from `main` (a worktree is fine). Unzip into a clean scratch dir.
- Map the new moves by the words in their PixelLab folder names, in `tools/keeper_build.py` (keeper) or
  `tools/kit_build.py` (outfield): the `anim =` name, the trim (`KTRIM_ANIM`), the mirror loop, `CARRY` if the ball is
  drawn in. Then: `cd tools && python3 keeper_build.py ../game <export dir> data/kits-v0.1` (or kit_build.py) and
  `python3 lo_build.py ../game`.
- **Prove nothing old moved:** every old frame pixel-identical (decode the old and new atlases, compare frame by
  frame), the manifest diff = additions only, every kit of that type got the same anims.
- **Look at it:** a contact sheet of the new frames in one kit (e.g. IRO), each direction, with `Read`. Wrong facing,
  stray balls, cut-off limbs → fix the mapping or regenerate (ask Luca for the extra generations).
- `node tools/smoke.js` must end `errors []`.

## 5. Deliver
- Commit as `Claude <noreply@anthropic.com>`: "art batch N: <what> (<anim names>) in every <keeper|outfield> kit, for
  <task>", with the trailer lines. Push the branch.
- If a task's PR waits for the art: merge `art/batchN-*` into that task branch, rerun its Lab group + smoke, re-record
  its preview GIF, note "PixelLab generations: N, batch N" in its PR body. Otherwise open its own PR (CLAUDE.md "Pull
  requests"; the GIF shows the new moves in the Test Lab).
- Tell Luca where it all is: the batch zip [your laptop], the branch / PR [GitHub], what's next.
