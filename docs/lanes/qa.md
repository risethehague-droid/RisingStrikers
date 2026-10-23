# Lane brief: QA overnight

**Account:** Luca's, as a scheduled task (about 03:00 Berlin, every night). **Branch:** `qa/nightly-<YYYY-MM-DD>`.
**Card lane:** QA overnight.

## Each run
1. Fresh clone of `main`; serve `game/` on port 8765.
2. `node tools/smoke.js` (all four levels).
3. Every Test Lab group (after `bash tools/mklab.sh`): `GROUP=<id> node tools/grp.js` for FP, K, KH, YS, C, P, M, D, T, A, PK, N5, PW, CH, GK, SM, CS.
4. One long computer-v-computer match (soak): no crash, no stuck state, no `errors`.
5. Compare against the last report: what changed.

## If something fails
Try a fix on the nightly branch, only if it's small and clearly right. Re-run what failed and open a pull request.
Anything bigger: no fix, just describe it on the card.

## The report card (one per night, lane QA overnight, status Needs OK, Who says OK = Luca)
Title `Nightly QA <date>: <n> passed, <n> failed`. Notes: failures first (test, what happened, a guess at why), then
the PR link if you made a fix. Nothing failed: say so in one line.

## Never
Merge, publish, push to `main`, generate art, or change anything outside your branch and your card.
