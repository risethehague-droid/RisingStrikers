# Lane brief: QA overnight

**Account:** Luca's, as the scheduled task "HC2 overnight QA" (01:44 Dutch time, every night). **Agent name:** `qa`.
**Branches:** `qa/<YYYYMMDD>-<topic>`, one per fix. **Card lane:** QA overnight. **Who says OK:** Luca.

Luca (23 Oct, 22:36): "run simulations of the games in the background catching any bugs and improving etc", next to
the WATCH mode he uses himself ("manual so I can pause etc plus manually comment on after for bug etc").

## Each run
1. Fresh clone of `main`; `npm i playwright` if it's missing; serve `game/` on port 8765.
2. **Simulate:** `MATCHES=12 OUT=soak-out node tools/soak.js`. These are seeded computer-v-computer matches across
   teams, levels, AI, weather and light, with BUG WATCH on; every finding has a repro line.
3. **Regression:** `node tools/smoke.js`, then every Test Lab group (`bash tools/mklab.sh`, then
   `GROUP=<id> node tools/grp.js` for FP, K, KH, YS, C, P, M, D, T, A, PK, N5, PW, CH, GK, SM, CS, BW), and
   `node tools/bwtest.js`.
4. **Luca's own marks:** read the game page's database (collection `bugwatch`) for clips Luca marked BUG in watch
   mode or in a match since the last QA report: his note, the minute, what Bug Watch saw. These come first.
5. **Compare** with the last QA report (`bash tools/agent.sh inbox` / the newest `reports/note--qa--*`): new codes,
   counts that went up, tests that changed outcome.

## What Bug Watch flags (t-021, Luca 25 Oct: "it should flag mechanics issues, actual game bugs, when game code breaks")
- **Errors (top of every list, with the stack):** CRASH (a throw, or a promise that failed with nobody catching it),
  CONSOLE_ERR (`console.error`, ours or Phaser's: one clip per 5 s), FROZE (the watchdog: the page is open and visible
  but no frame was drawn for 3 s - real browsers only). `node tools/bwtest.js` proves all three.
- **Broken mechanics (`bug`):** the old ones (NAN, BALL_GONE, OUT_LIVE, GOAL_MISSED, GOAL_WRONG, OWNER_FAR, TELEPORT,
  HANDS_OUT, NO_SPRITE, FLOW_STUCK, STUCK_STATE, WHIFF, STUCK_BALL) plus CLOCK_FROZEN, BALL_TOO_FAST, BALL_UNDER,
  THROUGH_KEEPER, IN_THE_NET, GOAL_TWICE, TEAM_FROZEN and CONTROL_DEAD (your matches only). Test Lab group BW trips
  each on purpose (BW1-BW8); BW9 is normal play where none may trip.
- **Looks odd (`odd`):** the AI checks (SWARM, PASS_LOOP, HOLDS_BALL, KEEPER_WANDER, STACKED...): at most 2 clips a match each.
- **Cosmetic (`look`):** ANIM_FLICKER, JITTER, STUTTER. Counted only - no clip, no database doc, not in the review
  lists (old flicker clips in the database are hidden too). The soak prints them in its one "Looks" line; report them
  only when a count jumps.
- The soak report leads with "Real bugs" (each with up to 3 examples and repro lines), then the Looks line, then the
  table. The Test Lab's clip review is group **CL** now (CL1...), real bugs first.

## Fixing ("improving")
- At most **two fixes a night**, each small and clearly right, each on its own branch `qa/<date>-<topic>` from `main`.
- Prove it: the repro line no longer trips (`ONE='<repro>' node tools/soak.js`), the smoke test passes, and normal
  play elsewhere is unchanged (same seeded scores for matches the fix shouldn't touch).
- Open a pull request (CLAUDE.md "Pull requests"), make a Taskboard card `qa-<YYYYMMDD>-<n>`: kind bug, lane qa,
  status review, result = the PR link, notes = what was wrong, the proof, the repro.
- Anything bigger or unclear: no fix. Describe it in the report with the repro, so the taskmaster can make a task.
- Stay out of files a worker's open task lists (`bash tools/agent.sh status`, then the brief).

## The report
One per night: `bash tools/agent.sh report qa note done <file>`. Order: Luca's marks, then bugs, then fixes made (PR
links), then odd things that are getting more frequent, then the soak table (the `.md` soak-out writes). The
taskmaster's 2-hourly check reviews it and puts the fixes in front of Luca.

## Never
Merge, publish, push to `main`, generate art, or change anything outside your `qa/` branches and `qa-*` cards.
