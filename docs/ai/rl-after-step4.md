# Role-AI step 4: the midfield roles and the formations, before / after

Step 4 of `docs/role-ai-plan.md` (6.1, 7). Measured 31 Oct in a cloud session. **Before** = PR #89 (step 2, the back
line) + PR #91 (step 3, the keeper) on top of v0.17.0. **After** = the same plus this branch. Same tools, same machine.

## What changed (game/src/roles.js `SHAPES` + `MID`, game/src/teamai.js)

- **Formations as data:** `SHAPES` holds 4-4-2, 4-2-3-1 and 4-3-3: per shirt slot the role, the kick-off spot, how
  wide without / with the ball, and how much deeper / higher than his line. The 4-4-2 numbers are today's tables
  (`FORMATION`, `AI.HOME_Y_DEF` / `_ATT`) one for one. Slots 1-4 are the back four and 9-10 take the kick-off in every
  shape. `OPTIONS > FORMATION` switches your side's shape, live, and remembers it.
- **New roles:** CDM (the anchor), CAM (the 10), WF (the 4-3-3's wide forward).
- **The anchor:** screens 8-13 m in front of the line on the ball's side. A back man out of the line (pressing, or
  pulled 6 m+ out) or sent off = the anchor drops into his spot. With the ball he stays 14 m behind it (rest defence)
  and makes no box runs.
- **The 10:** plays in the hole (higher than the midfield, 10 m higher with the ball), runs to the edge of the box and
  takes the far-post run when there's only one striker.
- **Wingers track back:** their full-back on his flank, level with him or past him = he follows him back, goal-side,
  down to about our midfield line (a wide forward only to just inside our half).
- **Default:** every team stays in **4-4-2** until step 6 gives each team its own pick (Luca's decision card).

## Exploit tests (Lab group RL, 40 runs each, `REP=40 node tools/rlrates.js`)

| Id | Before | After, 4-4-2 (default) | After, 4-2-3-1 | After, 4-3-3 |
| --- | --- | --- | --- | --- |
| E1 chip over the keeper | 0% | 0% | 0% | 0% |
| E2 through ball | 18% | 13% | 3% | 5% |
| E2b over the top | 0% | 0% | 0% | 0% |
| E3 drag a CB out | 0% | 0% | 0% | 0% |
| E4 square pass on the keeper | 45% | 43% | 45% | 35% |
| E5 walk round the keeper | 0% | 0% | 15%* | 0% |
| E6 counter down the flank | 13% | 13% | 18% | 20% |

\* E5 has no defenders (keeper only), so the formation can't touch it; it swings with the dice order (step 2 saw 0-40%).
E4 is noisy at 40 runs (step 3: 35-38%). Nothing got worse beyond the dice.

## Smarter, not harder (`tools/soak.js`, the same seeded set-ups on both builds; you = home at base v the level)

| Build | Matches | Goals a match | Shots a match | You W-D-L |
| --- | --- | --- | --- | --- |
| Before | 24 | 1.58 | 14.8 | 4-8-12 |
| **After, 4-4-2 (default)** | 24 | **1.75** | **14.2** | **7-8-9** |
| After, 4-2-3-1, first numbers (wingers back to 5 m from the line) | 24 | 1.17 | 12.0 | 3-12-9 |
| After, 4-2-3-1, tuned (wingers to 14 m, the 10 higher) | 24 | 1.46 | 12.3 | 5-8-11 |
| Before | 48 | 1.60 | 14.7 | 9-20-19 |
| After, 4-2-3-1 first numbers | 48 | 1.33 | 11.6 | 9-24-15 |

- **The default (4-4-2) is not harder:** you win more (4 → 7), lose less (12 → 9), goals and shots about the same.
- **4-2-3-1 games are tighter:** about 17% fewer shots. Everyone gets back behind the ball, and there's one striker,
  not two. Wins stay about the same. That's why the default stays 4-4-2 until step 6 (decision card).
- `MOVE CHECK`: the computer's chip shot is rare (3 in 48 matches before); none came in the two 24-match 4-4-2 runs.
  A rare move, not a broken one. No page errors anywhere.
