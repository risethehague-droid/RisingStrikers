# Tools

All tests drive the real game headless (Node + Playwright + Chromium, time stepped by hand). Serve the game first:
`cd game && python3 -m http.server 8765`. Builds are Python 3 (Pillow, NumPy, SciPy).

## Sync
| Command | What it does |
| --- | --- |
| `bash tools/sync.sh --start` | brings in the latest `main` (runs automatically at session start and resume) |
| `bash tools/sync.sh` or `/sync` | the same, then the smoke test on its own port (8799) |

## Simulations and watch mode
| Command | What it does |
| --- | --- |
| `node tools/soak.js` | 12 seeded computer-v-computer matches across teams, levels, AI, weather, light, with BUG WATCH on: every trip, stall and page error, a repro line per match (`MATCHES=30`, `OUT=soak-out`) |
| `ONE='seed=... home=... away=... lvl=... ai=... weather=... tod=...' node tools/soak.js` | replay one match exactly, to check a fix |

In the game, **WATCH** on the start screen: the computer plays both sides; ENTER pauses, 1-4 = speed, N marks a moment,
the review opens at full time. Marks and notes reach the taskmaster through the game's database.

## Agents
| Command | What it does |
| --- | --- |
| `bash tools/agent.sh status` | open tasks per agent and reports waiting for review (also printed at session start) |
| `bash tools/agent.sh tasks <agent>` / `show <path>` | an agent's briefs and their state / one file from the agents folder |
| `bash tools/agent.sh report <agent> <task> <status> <file>` | send a report (done, blocked, question, progress) |
| `bash tools/agent.sh inbox` / `next-id` / `assign` / `review` | taskmaster only: see `docs/agents.md` |

## Tests
| Command | What it checks |
| --- | --- |
| `node tools/smoke.js` | a match at Easy, Normal, Hard and Rise Warrior; must end `errors []` |
| `bash tools/mklab.sh` | builds `game/labtest.html` (the Test Lab as a local page) for `grp.js`, `gk091.js`, `chipgif.js`; rerun after changing `lab.html` |
| `GROUP=<id> [REP=3] node tools/grp.js` | one Test Lab group, every test, outcome per test. Groups: FP, K, KH, YS, C, P, M, D, T, A, PK, N5, PW, CH, GK, SM, CS, BW |
| `node tools/proxy093.js run\|def <trials> [levels]` | a scripted "you": run at goal from the centre circle / defend from kick-off, at each level |
| `LEVELS=... node tools/train093.js probe 0 <matches> <secs>` | computer v computer strength per level (S against the old Normal) |
| `node tools/train093.js <level> <iters> <matches> <secs>` | self-play tuning of one level's traits (writes `train093-out/`) |
| `node tools/lobstudy.js you\|ai [N]` | open-play lobs: who wins them (you tapping LOB to a forward N times, or N minutes of computer v computer), how (header / chest / feet) and where everyone is at the drop |
| `node tools/pacestudy.js [N]` | where N full computer v computer matches spend their real time (live play, replays, freezes, restarts...), plus shots, goals, possession changes and ball / player speeds |
| `node tools/gk091.js` | keeper situations with the keeper's plan printed |
| `TEST=<id> OUT=docs/previews/pr<N>-<topic>.gif node tools/preview.js` | the PR's preview GIF (CLAUDE.md "The `## Preview` section"): a Test Lab test, or `MATCH=1 SKIP=<s>` for a match moment; 3-5 s, under 1 MB |
| `bash tools/prpreview.sh <commit> <dir> <N> "<title>"` | taskmaster / 2-hourly check: builds the "HC2 PR #N preview" page (the PR on top of `main`; `#play` = the game, `#lab-CH1` = the Lab at a test) |
| `node tools/chipgif.js` | the v0.9.4 chip frames (the first preview GIF; `preview.js` replaces it) |
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
