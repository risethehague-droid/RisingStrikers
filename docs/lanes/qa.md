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
   `GROUP=<id> node tools/grp.js` for FP, K, KH, YS, C, P, M, D, T, A, PK, N5, PW, CH, GK, SM, CS).
4. **Luca's own marks:** read the game page's database (collection `bugwatch`) for clips Luca marked BUG in watch
   mode or in a match since the last QA report: his note, the minute, what Bug Watch saw. These come first.
5. **Compare** with the last QA report (`bash tools/agent.sh inbox` / the newest `reports/note--qa--*`): new codes,
   counts that went up, tests that changed outcome.

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
