# Role-AI step 6: each team its own formation + the shots back, before / after

Step 6 of `docs/role-ai-plan.md` (7: "a formation and roles per team ... plus the balance round-robin"). Measured 31 Oct
in a cloud session. **Before** = PR #93 (step 5, on #92 / #91 / #89). **After** = the same plus this branch. Same tools,
same machine, the same seeded set-ups on both builds.

## What changed

- **Each team has its own card** (`game/src/roles.js` `TEAM_SHAPE`): its formation and, if it wants, its strikers'
  kinds (`cf: { 9: 'target', 10: 'advanced' }`). Until now every computer side played one shared `FORMATION_DEFAULT`.
  **Every card is 4-4-2 for now** (Luca's default, not confirmed yet): Luca + the co-designer pick the six cards,
  together with the style cards (`brain.js TEAM_STYLE`). With all six on 4-4-2 the same seeded matches play out
  exactly as before (soak, 3 matches: same scores, same shots).
- **OPTIONS > FORMATION** cycles 4-4-2 → 4-2-3-1 → 4-3-3 → **TEAM'S OWN** (your team's card).
- **Tools:** `FORM=4-3-3,4-4-2` = home, away (one shape still = both sides). New **`tools/formations.js`**: the balance
  round-robin, every shape v every shape both ways.
- **The shots:** the target man comes short only while we build from **our own third** (`FWD.SHORT_X` 20 → -15).

## Why shots dropped in step 5, and the fix

Turning each part of step 5 off in turn (soak, 24 matches each, `TUNE=`):

| Step 5 with ... off | Shots a match |
| --- | --- |
| nothing (step 5) | 12.5 |
| the hold-up | 15.0 (but you lost 12 of 24: harder) |
| **the target man coming short** | **14.2** |
| the first-line press | 15.2 (lost 10 of 24: harder) |
| the target man's run bias | 11.8 |

The biggest single cause that doesn't make the game harder is **the target man coming short**: he did it in all the
build-up up to their third, so when the ball got forward there was only one man up front. Real target men drop to give
the keeper / centre-backs a ball out, then they're a striker again. So now: own third only.

## Smarter, not harder (`tools/soak.js`, 96 matches = 4 x 24, FROM=0/24/48/72; you = home at base v the level)

24 matches turned out too few here (one 24 said 12.5 shots, another 14.2 on the same build), so every build below is 96.

| Build | Shots a match | Goals a match | Your points share (win 1, draw 0.5) |
| --- | --- | --- | --- |
| Step 4 (#92) | 14.4 | 1.58 | 44% |
| Step 5 (#93) | 13.2 | 1.58 | 53% |
| Step 5, target man never comes short | 14.2 | 1.62 | 48% |
| Step 5, comes short in our own half (`SHORT_X` 0) | 13.8 | 1.49 | 47% |
| **This branch (own third, `SHORT_X` -15)** | **14.4** | **1.76** | **42%** |

- **Shots back to step 4's level** (13.2 → 14.4), and the most goals of any build.
- **Not harder:** your points share is within the dice of step 4 (44% → 42%; 96 matches = about ±5 points of noise).
- Step 5's real drop was ~8% (14.4 → 13.2) over 96 matches, not the 12% one 24-match sample showed.

## The forwards (`tools/fwdstudy.js`, 12 matches, IS v IRO both ways)

| | Step 5 | This branch |
| --- | --- | --- |
| Shots a match / goals a match | 12.8 / 1.58 | **14.5 / 2.08** |
| A striker is the one pressing their back man | 61% | 52% |
| Their back man's spell ends: back / forward / lost | 9 / 64 / 27% | 11 / 62 / 27% |
| Regains in the other half, a match | 19.7 | 18.1 |
| Slot 9 from the ball while his side builds from its own half | 16.8 m | 17.7 m |
| Page errors | 0 | 0 |

The press still forces the ball forward as often; the target man still comes short in the build-up from the back (Lab FW
F2: #9 comes from ~41 m to ~24 m from your #3, as before).

## The line and keeper (`tools/linestudy.js`, the step 0 baseline, 6 matches)

Unchanged, as expected (this branch doesn't touch the back four or the keeper): line spread 7.7 → 8.0 m, flat line 43%
both, keeper off his line 10.9 → 10.8 m, a defender pulled 8 m+ out 35 → 36%, keeper over 14 m 32.5% both, goals with
the keeper 10 m+ out 0 both, page errors 0.

## Exploit tests (Lab group RL, 40 runs each, `REP=40 node tools/rlrates.js`)

| Id | Step 5 | This branch |
| --- | --- | --- |
| E1 chip over the keeper | 0% | 0% |
| E2 through ball | 3% | 5% |
| E2b over the top | 0% | 0% |
| E3 drag a CB out | 0% | 0% |
| E4 square pass on the keeper | 38% (re-run: 38%) | 44% (two runs of 40: 18, 17) |
| E5 walk round the keeper | 0% | 0% |
| E6 counter down the flank | 15% | 13% |

Nothing got worse beyond the dice. E4 (the keeper v a square pass: this branch doesn't touch the keeper or the line)
is the noisiest test, step 3 measured 35-38%, and 44% v 38% on 40 runs each is inside the noise; worth a look in the
keeper's next round, not a reason to hold this back.

## The formations balance round-robin (`node tools/formations.js`, 8 matches each way, both sides at base, normal)

| Formation | Played | W / D / L | Goals | Its shots a match | Points share |
| --- | --- | --- | --- | --- | --- |
| 4-4-2 | 32 | 9 / 12 / 11 | 30 - 29 | 6.1 | 47% |
| 4-2-3-1 | 32 | 9 / 14 / 9 | 28 - 29 | 6.1 | 50% |
| 4-3-3 | 32 | 12 / 10 / 10 | 36 - 36 | 8.0 | 53% |

**Balanced:** every formation within 8 points of 50%, goals 1.96 a match, page errors 0. So any team can be given any
of the three without making it the side to beat. 4-3-3 games are the most open (8 shots a side, 2.25 goals a match).
