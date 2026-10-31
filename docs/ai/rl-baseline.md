# Role-AI step 0: today's exploit rates (v0.15.3)

The yardstick for steps 2-3 of `docs/role-ai-plan.md`. Measured 31 Oct on `main` (v0.15.3), before any role-AI change.

- **Exploit tests:** Test Lab group **RL** (`game/lab.js`, `rlTests`), each test run 20 times on fresh dice with
  `node tools/rlrates.js`. Every line is in `docs/ai/rl-baseline.json`.
- **Line study:** `node tools/linestudy.js` (6 seeded CPU v CPU matches). It gives exactly the numbers in the plan's
  section 2 (`docs/ai/linestudy-v0.15.3.txt`), so that baseline stands as it is.

## The exploits (20 runs each)

Each test is a human's move, scripted. **Your** side (home) plays it. **Their** side is the real team AI and the real
keeper AI, starting where its own AI wants to stand (`aiZone` / `gkPlan`).

| Id | The move | Worked today | The number behind it | Target after the fix |
| --- | --- | --- | --- | --- |
| E1 | Chip (held LOB) from 36-46 m over a keeper who starts 10-14 m out | **0%** (18 of 20: the keeper got back and caught it) | keeper 9.7 m out at the chip | stays ≤ 15% |
| E2 | Through ball on the grass behind their line, you unpressured ~50 m out | **10%** | their line flat (spread 0.6 m); keeper 8.2 m out | ≤ 10% |
| E2b | The same over the top (held LOB) | **5%** | their line flat (0.9 m); keeper 8.0 m out | ≤ 10% |
| E3 | Your #9 drags a centre-back out, your #11 runs into his hole | **0%** (9 of 20: you never got a clear pass) | **their CB follows #9 5.5 m out of the line; nobody covers his spot (nearest man 12 m away)** | CB ≤ 3 m out, or a man in his spot |
| E4 | Square pass in a 2-on-the-keeper (two CBs chasing) | **100%** | **keeper 8.5 m off his line, charging #9** | ≤ 40% |
| E5 | Walk round the keeper on a breakaway (t-017 / t-027 closed it) | **30%** | keeper up to 12.9 m out | ≤ 10% |
| E6 | Counter down the flank their full-back left | **70%** | 4.6 of theirs goal-side of the ball at the turnover | ≤ 35% |

## What it says

- **The live exploits are the keeper and the counter, not the chip.** E4 (100%) and E6 (70%) beat today's AI most of
  the time, and E5 (30%) too often.
- **E4:** the keeper charges the man on the ball even with a second attacker beside him, so a square pass leaves an
  empty net. Plan step 3 ("1v1 with support" + goal-line cover) is aimed exactly at this.
- **E5 is back, a bit.** It went in 6 of 20 times on fresh dice. The KP tests (t-017 / t-027) each run on one fixed
  seed, so this is the first time the move has been tried on 20 different dice. It's a step-3 job too.
- **E6:** with their full-back up, an early ball down his flank puts your winger in the box 14 times out of 20. Plan
  step 2 (rest defence) fixes this.
- **E1, E2, E2b and E3 don't beat today's AI often**, but not because the shape is right. The game's held lob is slow
  (about 2 s in the air), so the keeper and the dropping centre-backs get to it. Their midfield also closes the passer
  down before the centre-back has gone far. The shape problems still show in the numbers: in E3 a centre-back follows
  #9 5.5 m out and nobody fills his spot (the plan's "27% of the time one defender is 8 m+ out"). These four stay as
  guards: after steps 2-3 their rates must not go up, and E3's "CB followed" number must come down.
- **Targets** are real-football-like, never zero: a well-worked 2-on-1 still scores sometimes (E4 ≤ 40%), and so does
  a quick counter (E6 ≤ 35%).

## Re-run

```
cd game && python3 -m http.server 8765 &      # from the repo root
bash tools/mklab.sh                            # game/labtest.html
REP=20 OUT=docs/ai/rl-after-step2.json node tools/rlrates.js
node tools/linestudy.js
```
