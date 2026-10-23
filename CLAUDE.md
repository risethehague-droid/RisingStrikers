# HC2 Football: house rules for every Claude session

These rules apply to every session on this repo, on either account. If you're on the co-designer's account, read
`README-friend-sessions.md` first. Then read your lane brief in `docs/lanes/`.

## The team and the flow

- **Luca** owns the project and gives the final OK on anything that goes live.
- **The co-designer** (Luca's friend) runs the Design & Vision and Stadiums & maps lanes from his own account.
- **The taskmaster** is Luca's main Claude chat. It splits work into cards on the Taskboard, checks every pull request, merges into `main` and publishes the official game. Nobody else merges or publishes.
- **Agents:** four sessions, two per account. Luca's: the taskmaster and **worker-l**. The co-designer's: his main session and **worker-f**. The workers are general: they do the tasks the taskmaster assigns and report into the agents folder. `docs/agents.md` has the whole setup.
- **The flow:** card → branch `<lane>/<topic>` (workers: `<agent>/t-NNN-<topic>`) → pull request → card to *Needs OK* → Luca's OK → the taskmaster merges and publishes. Workers also send a report, which the taskmaster reviews before the card goes to Needs OK.
  - Never push to `main`.
  - Never merge.
  - Never publish to the official pages.
- Taskboard: https://claude.ai/artifact/PtvBPpqTta99vWSSfSBoX4 · Team setup: https://claude.ai/artifact/8QEZs4UX4XEGYGWYdqPssF

## How to talk to Luca and the co-designer

- Short and scannable: decision or result first, then bullets, short sentences. Casual and direct.
- Always say **where** the work happens: [cloud], [your laptop], [PixelLab], [Aseprite], [claude.ai], [GitHub].
- Work in the most logical order. Don't ask questions you can settle from the repo or the board.

## Art

- **All art comes from PixelLab or Aseprite.** Make it there, bring it here, wire it up with code. Never draw sprites, tiles or backgrounds in code or with other image tools.
- **Generate only when a person on the team asks for it.** No speculative PixelLab batches.
- **Other games are style recipes in words only.** Never give their images to PixelLab.
- **Kits carry only the team emblem.** No other lettering or logos.
- **Pitch boards show sponsors and the venue only.** "RISE" appears only where it already is.
- **PixelLab tends to draw a ball into kicking moves.** Prompt "with no ball anywhere in the picture"; the game draws its own ball.

## Safety and accounts

- **Never read, copy, repeat or commit keys, tokens or passwords.** That includes the "Secret" on the PixelLab account page; on that page read only the Generations line.
- **In a browser:**
  - never tick "Give full trust" or "Don't show this alert again"
  - never solve CAPTCHAs
  - reject non-essential cookies
  - don't change system settings; give the steps instead
- **On Luca's laptop:**
  - never delete files: list what should go in `HC2-TODO.txt` and Luca deletes it
  - PixelLab exports land in Downloads and get copied into `HC2-aseprite\pixellab-in\batchN\` without asking
- Don't comment on unrelated files you see on anyone's computer.

## The code

- **Stack:** plain JavaScript, Phaser 3.90, no build step and no bundler. Add a library only with an OK'd card.
- **Units:** the world is in metres (x along the pitch, y across, z up). The stadium art is pre-projected: `tools/stadium/cfg.py` and `docs/lanes/stadiums-maps.md` have the geometry.
- **Layout:**
  - the game lives in `game/`
  - the code is split by area into 17 files under `game/src/`; `game/src/README.md` says which file is which and which lane edits it
  - new `Match` methods go inside the file's `hc2Mix(Match, { ... })` block
  - a new file goes into all three pages (`index.html`, `lab.html`, `test.html`) in load order
- **PC first.** The phone version is on pause; don't break it, don't extend it.
- **Comments:** explain *why* (the request or the bug behind a change), as the existing code does.
- **Refactors keep behaviour identical.** Prove it: the same seeded matches give the same scores before and after.
- **Versions:** the taskmaster bumps `GAME_VER`, adds the header line in the game source and the entry at the top of `docs/CHANGELOG.txt` when it merges. Branches don't bump versions.

## Agents and the report folder

- The report folder is the `agents` branch: `agents/tasks/` (briefs), `agents/reports/`, `agents/reviews/`. Never merged into `main`, no game files.
- Use `bash tools/agent.sh` for everything there (`status`, `tasks`, `show`, `report`; the taskmaster also `assign`, `review`, `inbox`). Never edit those files by hand.
- Workers: `/work`. The taskmaster: `/inbox` to review. Every session prints the agents' status line when it starts.

## Staying in sync with main

- Sessions bring in the latest `main` automatically when they start or resume: the hook in `.claude/settings.json` runs `tools/sync.sh --start`. Read its `[sync]` lines first.
- `/sync` (`.claude/skills/sync/`) does the full version: bring in main, run the smoke test, push the branch, republish the preview.
- Uncommitted work or a clash: it stops and says so; it never pushes and never changes `main` on GitHub.

## Testing (before every pull request)

1. Serve the game: `cd game && python3 -m http.server 8765`.
2. Smoke test: `node tools/smoke.js` plays a match at all four difficulty levels. It must end with `errors []`.
3. Test Lab groups: `bash tools/mklab.sh` once (and after any change to `lab.html`), then `GROUP=<id> node tools/grp.js` (GK, CH, SM, ...). Run the groups your lane brief lists.
4. Lane-specific tests: the ones in your brief, e.g. the difficulty checks `tools/proxy093.js` and `tools/train093.js`.
5. Anything visual: put a screenshot or a short GIF in the pull request (`tools/chipgif.js` shows how).

Tests use Node with Playwright and Chromium, run headless; time is stepped by hand, so a 5-minute match takes seconds.

## Pull requests

- One topic per pull request, small enough to review in 10 minutes.
- In the description:
  - what changed and why (link the card)
  - how to try it: what to click, which Test Lab test
  - which files it touches
  - test results
  - any PixelLab generations it used
- Then put the PR link on the card and move the card to *Needs OK*.
  - Exception: PRs from `friend/` branches get their Needs OK card automatically (the "HC2 taskmaster check" scheduled task on Luca's account, every 2 hours 09:00 to 23:00 Dutch time, which also reviews the agents' reports). The co-designer's account can't write to the board.
