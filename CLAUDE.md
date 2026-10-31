# HC2 Football: house rules for every Claude session

These rules apply to every session on this repo, on either account. If you're on the co-designer's account, read
`README-friend-sessions.md` first. Then read your lane brief in `docs/lanes/`.

## The team and the flow

- **Luca** owns the project and gives the final OK on anything that goes live.
- **The co-designer** (Luca's friend) runs the Design & Vision and Stadiums & maps lanes from his own account.
- **The taskmaster** is Luca's main Claude chat. It splits work into cards on the Taskboard, checks every pull request, merges into `main` and publishes the official game. Nobody else merges or publishes (one exception: the co-designer may publish HC2 HQ itself, see below). A new taskmaster chat starts with `docs/taskmaster.md` (and `/publish`).
- **Agents:** four sessions, two per account. Luca's: the taskmaster and **worker-l**. The co-designer's: his main session and **worker-f**. The workers are general: they do the tasks the taskmaster assigns and report into the agents folder. `docs/agents.md` has the whole setup.
- **The flow:** card → branch `<lane>/<topic>` (workers: `<agent>/t-NNN-<topic>`) → pull request → card to *Needs OK* → Luca's OK → the taskmaster merges and publishes. Workers also send a report, which the taskmaster reviews before the card goes to Needs OK.
  - Never push to `main`.
  - Never merge.
  - Never publish to the official pages (the game, the Test Lab).
- **HC2 HQ is the exception** (Luca's OK, PR #39): the co-designer may publish HQ's page directly from his own
  account (his main session, or worker-f when he asks it to). The rules:
  - **HQ's page only:** its layout, sections and menus. Never the game or the Test Lab, and never HQ's card data by
    hand (cards change through HQ's own buttons, the taskmaster and the scheduled check, as now).
  - **Start from the live HQ:** read the current version first (Artifact `read`) and build on that file, never on an
    older copy. Keep HQ's data model, capabilities and ↻ Check now working.
  - **HQ's code lives in the repo too** (Luca, 30 Oct: "give codesigner access to HQ's code to facilitate more direct
    contact between codesigner and taskmaster"): `design/hq/index.html` is the live HQ page. After every HQ publish,
    whoever published commits the exact file they published there (co-designer: a `friend/hq-<topic>` branch + PR;
    the taskmaster: with its next change). Before building, compare the live HQ (Artifact `read`) with that file; if
    they differ, the live page wins: copy it in first. Then both sides can read, diff and review HQ's code on GitHub.
  - **Say what changed:** after each publish, a note through the folder (`bash tools/agent.sh report co-designer note
    done <file>`): what changed and why. A big redesign: tell Luca first.
  - Luca can always roll HQ back to an earlier version from the page's history.
- HC2 HQ (the Taskboard): https://claude.ai/artifact/PtvBPpqTta99vWSSfSBoX4 · Team setup: https://claude.ai/artifact/8QEZs4UX4XEGYGWYdqPssF

## How to talk to Luca and the co-designer

- Short and scannable: decision or result first, then bullets, short sentences. Casual and direct.
- Always say **where** the work happens: [cloud], [your laptop], [PixelLab], [Aseprite], [claude.ai], [GitHub].
- Work in the most logical order. Don't ask questions you can settle from the repo or the board.

## Think like football (every task, every session)

Luca, 25 Oct 14:59: "be a bit smarter and reference real football / video games for what to do when I ask a task ...
make sure you think if something else is needed to match how football usually runs." (His example: offside got
called, but nobody reorganised before the free kick.)
- Before building, check how **real football** does it (the Laws of the Game, what players and referees actually do
  around the moment) and how the **reference games** do it (FIFA / EA FC, PES / eFootball, Sensible Soccer; for
  specials Inazuma Eleven, Captain Tsubasa, Mario Strikers). Say which ones you used in the brief or the PR.
- Build the whole flow around a rule, not only the rule: what happens before, during and after it on the pitch
  (players moving into shape, the restart, the pacing, the camera, Rami).
- Briefs carry a short "How real football and other games do it" section.

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
  - the code is split by area into 22 files under `game/src/`; `game/src/README.md` says which file is which and which lane edits it
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
- **The message board** (`agents/messages/`, `docs/agents.md`): agents talk to each other there, in detail. Start each session with `bash tools/agent.sh board <you>` and answer what's yours. Ask other agents there instead of guessing. After every substantial piece of work, and before stopping, post a session log (`msg <you> all <file> --log`) that quotes what the person asked and decided.

## Staying in sync with main

- Sessions bring in the latest `main` automatically when they start or resume: the hook in `.claude/settings.json` runs `tools/sync.sh --start`. Read its `[sync]` lines first.
- `/sync` (`.claude/skills/sync/`) does the full version: bring in main, run the smoke test, push the branch, republish the preview.
- Uncommitted work or a clash: it stops and says so; it never pushes and never changes `main` on GitHub.

## Testing (before every pull request)

1. Serve the game: `cd game && python3 -m http.server 8765`.
2. Smoke test: `node tools/smoke.js` plays a match at all four difficulty levels. It must end with `errors []`.
3. Test Lab groups: `bash tools/mklab.sh` once (and after any change to `lab.html`), then `GROUP=<id> node tools/grp.js` (GK, CH, SM, ...). Run the groups your lane brief lists.
4. Lane-specific tests: the ones in your brief, e.g. the difficulty checks `tools/proxy093.js` and `tools/train093.js`.
5. Anything visual: record the PR's preview GIF with `tools/preview.js` (see "The `## Preview` section" below).
6. **Every new or changed move gets its FREE PLAY button** (Luca, 29 Oct: "add all the moves that we work on as they are
   finished, once we like them we OK to add to the final game"). A PR that adds or changes a move or a mechanic adds (or
   updates) its line in `FP_MOVES` in `game/lab.js`: the button sets the moment up and the game plays the move, tagged
   `game: true` (IN THE GAME) or not (LAB ONLY, until Luca's OK). Say which button in "How to try it". Check it with
   `ONLY=<mv> VIEWS=none node tools/labnav.js` (the whole Lab: `node tools/labnav.js`).
7. **Every new or changed move gets its clip on HQ** (Luca, 30 Oct: "keep the hq updated with all new animations you
   add, as short previews (shots, passes, mash etc)"). Record the move's FREE PLAY button:
   `MOVE=<mv> FPS=10 WIDTH=320 OUT=docs/previews/pr<N>-move-<mv>.gif node tools/preview.js` (a set piece: add
   `SKIP=6 MOVEKEY=KeyC`), commit it with the PR and name it in the description (`Move clips: <mv>, ...`). The
   taskmaster puts it in HQ's MOVES section when it merges.

Tests use Node with Playwright and Chromium, run headless; time is stepped by hand, so a 5-minute match takes seconds.

## Pull requests

- One topic per pull request, small enough to review in 10 minutes.
- In the description:
  - what changed and why (link the card)
  - how to try it: what to click, which Test Lab test
  - which files it touches
  - test results
  - any PixelLab generations it used
  - a `## Preview` section (below)
- Then put the PR link on the card and move the card to *Needs OK*: write `status: "review"` exactly (the key, not the label; `"needs-ok"` used to hide cards in To do). Status keys are listed in docs/taskmaster.md, "Card status keys".
  - Exception: PRs from `friend/` branches get their Needs OK card automatically (the "HC2 taskmaster check" scheduled task on Luca's account, 3 times a day at 08:39, 13:39 and 20:39 Dutch time, every 2 hours when Luca switches TURBO on in HQ; it also reviews the agents' reports). The co-designer's account can't write to the board.

### The `## Preview` section (every PR, every agent)

HC2 HQ shows it on the PR's Needs OK card: the GIF playing, **Play it** (the PR's code as a game) and **Try it in
the Test Lab** (the tests you name). The taskmaster and the scheduled check build those from this section, so keep its
shape exactly.

1. **Open the PR first** to learn its number `<N>`.
2. **Record a GIF** of the change in action, 3-5 s, under 1 MB, with the game served (Testing, step 1):
   - a Test Lab test: `TEST=CH1 OUT=docs/previews/pr<N>-<topic>.gif node tools/preview.js` (run `bash tools/mklab.sh` once first)
   - a match moment: `MATCH=1 SKIP=<seconds in> OUT=docs/previews/pr<N>-<topic>.gif node tools/preview.js`
   - `SETUP='<js>'` sets something up first (a camera, a weather). The tool's header lists every option.
3. **Commit it on your branch** under `docs/previews/`, push, then add the section to the description:
   ```
   ## Preview
   ![a lob over midfield, won in the air](https://github.com/risethehague-droid/RisingStrikers/blob/<branch>/docs/previews/pr<N>-<topic>.gif?raw=true)
   Preview: docs/previews/pr<N>-<topic>.gif · Test Lab: CH1,A4
   ```
   - The `Preview:` line comes exactly once, in that shape. After `Test Lab:` go the tests that show the change, comma-separated, or `none`.
   - Updating a description: `gh api -X PATCH repos/risethehague-droid/RisingStrikers/pulls/<N> -F body=@body.md` (`gh pr edit` needs GraphQL, which is blocked here).
4. **Nothing to see** (docs, tools, a refactor): `Preview: none · Test Lab: none`, plus one line saying why.

The GIFs **stay in `main`** after the merge. `docs/previews/` is the game's picture history; it sits outside `game/`,
so it's never published.
