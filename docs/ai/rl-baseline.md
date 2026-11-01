# Role-AI step 0: today's exploit rates (v0.16.0)

The yardstick for steps 2-3 of `docs/role-ai-plan.md`. Measured 31 Oct on `main` (v0.16.0), before any role-AI change.

- **Exploit tests:** Test Lab group **RL** (`game/lab.js`, `rlTests`), each test run 20 times on fresh dice with
  `node tools/rlrates.js`. Every line is in `docs/ai/rl-baseline.json`.
- **Line study:** `node tools/linestudy.js` (6 seeded CPU v CPU matches) → `docs/ai/linestudy-v0.16.0.txt`. The shape is
  the plan's (v0.15.3) picture, the keeper a bit further up (below).

## The exploits (20 runs each)

Each test is a human's move, scripted. **Your** side (home) plays it. **Their** side is the real team AI and the real
keeper AI, starting where its own AI wants to stand (`aiZone` / `gkPlan`).

| Id | The move | Worked (v0.16.0) | (v0.15.3) | The number behind it | Target after the fix |
| --- | --- | --- | --- | --- | --- |
| E1 | Chip (held LOB) from 36-46 m over a keeper who starts 10-14 m out | **0%** (18 of 20: he got back and caught it) | 0% | keeper 10.5 m out at the chip | stays ≤ 15% |
| E2 | Through ball on the grass behind their line, you unpressured ~50 m out | **0%** (19 of 20: their CB cut it out) | 10% | their line flat (spread 0.5 m); keeper 8.3 m out | ≤ 10% |
| E2b | The same over the top (held LOB) | **0%** | 5% | line spread 1.0 m; keeper 8.4 m out | ≤ 10% |
| E3 | Your #9 drags a centre-back out, your #11 runs into his hole | **0%** (10 of 20: you never got a clear pass) | 0% | **their CB follows #9 5.7 m out of the line; nobody covers his spot (nearest man 12 m away)** | CB ≤ 3 m out, or a man in his spot |
| E4 | Square pass in a 2-on-the-keeper (two CBs chasing) | **100%** | 100% | **keeper 8.7 m off his line, charging #9** | ≤ 40% |
| E5 | Walk round the keeper on a breakaway (closed in t-017 / t-027) | **0%** | 30% | keeper up to 14.9 m out | stays ≤ 10% |
| E6 | Counter down the flank their full-back left | **90%** | 70% | 4.7 of theirs goal-side of the ball at the turnover | ≤ 35% |

## What it says

- **The live exploits are the keeper and the counter, not the chip.** E4 (100%) and E6 (90%) beat today's AI almost
  every time.
- **E4:** the keeper charges the man on the ball even with a second attacker beside him, so a square pass leaves an
  empty net. Plan step 3 ("1v1 with support" + goal-line cover) is aimed exactly at this.
- **E6:** with their full-back up, an early ball down his flank puts your winger in the box 18 times out of 20. Plan
  step 2 (rest defence) fixes this.
- **E5 is closed again on v0.16.0** (it went in 6 of 20 on v0.15.3; the KP tests run one fixed seed each, so they
  wouldn't have shown it). It stays here as a guard.
- **E1, E2, E2b and E3 don't beat today's AI**, but not because the shape is right. The game's held lob is slow (about
  2 s in the air), so the keeper and the dropping centre-backs get to it, and their midfield closes the passer down
  before the centre-back has gone far. The shape problem still shows in the numbers: in E3 a centre-back follows #9
  5.7 m out and nobody fills his spot (the line study: one defender 8 m+ out of the line 28% of the time). These four
  are guards: after steps 2-3 their rates must not go up, and E3's "CB followed" number must come down.
- **Targets** are real-football-like, never zero: a well-worked 2-on-1 still scores sometimes (E4 ≤ 40%), and so does
  a quick counter (E6 ≤ 35%).

## The line study on v0.16.0 (6 matches, IS v IRO)

| | v0.15.3 (the plan) | v0.16.0 |
| --- | --- | --- |
| Back-four spread (deepest to highest) | 6.9 m | 7.0 m |
| One defender 8 m+ out of the line | 27% | 28% |
| Keeper off his line, average | 11.4 m | 12.8 m |
| Keeper with the ball 35-50 m away | 9.4 m (12 m+ 23%) | 9.4 m (12 m+ 23%) |
| Keeper with the ball 50 m+ away | 13.6 m | 15.7 m |
| Goals (6 matches) | 27 | 17 |

## Re-run

```
cd game && python3 -m http.server 8765 &      # from the repo root
bash tools/mklab.sh                            # game/labtest.html
REP=20 OUT=docs/ai/rl-after-step2.json node tools/rlrates.js
node tools/linestudy.js
```
