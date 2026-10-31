# Role-AI step 2: the back four as one line, before / after

Step 2 of `docs/role-ai-plan.md` (6.2). Measured 31 Oct in a cloud session. **Before** = PR #84 (step 1) + PR #86 (step 0
tests) on top of v0.16.0. **After** = the same plus this branch. Same tools and the same machine for both.

## What changed (game/src/roles.js `LINE`, game/src/teamai.js)

- **One line per team:** `team.line` (metres in the team's frame), eased every frame by `aiBackLine`. The four
  defenders stand on it (`lineSpot`). The cover CB, the one away from the ball, stands 1.2 m deeper.
- **Drop / hold / step up:** an uncovered carrier 10-35 m in front of the line = drop 3 m. Ball played back or cleared
  = step up 4 m. The edge of the box is the floor while the ball is outside it. A ball played forward towards the line =
  the line goes straight back to where the ball is going (`over`).
- **Moves together:** it drops at 4.5 m/s and steps up at 3.5 m/s. It goes at 7 m/s when the ball is past it, or
  just after the ball is lost (a recovery run). Back men sprint on those recovery runs.
- **Hand-off:** a defender marks a man at most 5 m in front of the line. Further out, the midfield picks him up.
- **Rest defence:** with the ball in their half, the line stays 20 m behind it, or 26 m when a full-back has gone
  forward. A full-back upfield (12 m+ in front of the line) = the other three slide 9 m over to his side.

## Exploit tests (Lab group RL, 20 runs each, `node tools/rlrates.js`)

| Id | Before | After | Note |
| --- | --- | --- | --- |
| E1 chip over the keeper | 0% | 0% | keeper 10.2 m out at the chip (step 3's job) |
| E2 through ball behind the line | 5% (2 of 40) | 8% (3 of 40) | 40 runs each: the same within the dice; target ≤ 10% |
| E2b over the top | 0% | 0% | |
| E3 drag a CB out | 5% | 0% | **CB followed #9 5.0 m out → 2.1 m** (hand-off) |
| E4 square pass on the keeper | 100% | 100% | the keeper, step 3 |
| E5 walk round the keeper | 30% (20 runs) / 0% (40 runs) | 40% / 0% | no defenders in this test: keeper-only, the same on both builds; it swings with the dice order |
| **E6 counter down the flank** | **75%** | **15%** (10-25% over 3 runs) | target ≤ 35% |

## Line study (6 seeded CPU v CPU matches, `node tools/linestudy.js`)

| | Before | After |
| --- | --- | --- |
| The men on line duty (back four minus the presser / cover): spread | 5.1 m | **3.9 m** |
| ... under 3 m apart | 51% | **67%** |
| Whole back four spread (presser included) | 7.0 m | 6.6 m |
| One defender 8 m+ out (presser included) | 28% | 28% |
| Keeper off his line | 12.8 m | 11.6 m |

The whole-four numbers barely move because the man pressing the ball is part of them, and in real football the near
full-back or the stopper stepping out to press is right. The men left on the line are what this step fixes.

## Smarter, not harder (`tools/soak.js`, 48 seeded matches, 12 a level, both builds)

| Level | Goals a match before | after | You W-D-L before | after |
| --- | --- | --- | --- | --- |
| Easy | 3.08 | 2.83 | 10-2-0 | 7-1-4 |
| Normal | 2.67 | 2.17 | 2-7-3 | 6-3-3 |
| Hard | 2.67 | 2.08 | 5-2-5 | 2-5-5 |
| Rise Warrior | 2.00 | 1.83 | 0-4-8 | 1-4-7 |
| **All** | **2.60** | **2.23** | **17-15-16** | **16-13-19** |

- Goals a match stay in the plan's 2-4 range, slightly down. Both sides defend better now, with a few fewer shots
  (742 → 697).
- Wins about the same overall (17 → 16). Per level, 12 matches is too few to read much. Easy has the biggest swing
  (10 wins → 7), so it's the one to watch when the difficulty card retunes the levels.
- A first version dropped 5 m for an uncovered ball and took goals to 1.98 a match. That's why it's 3 m now.
- `MOVE CHECK`: in one 24-match half the computer never played `tap` (it plays 2-3 a soak, so that's a rare move, not
  a broken one).
