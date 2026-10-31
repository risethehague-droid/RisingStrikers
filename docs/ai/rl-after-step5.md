# Role-AI step 5: the forward roles, before / after

Step 5 of `docs/role-ai-plan.md` (6.1, 7: "CF advanced / target / poacher, first-line press"). Measured 31 Oct in a
cloud session. **Before** = PR #92 (step 4, on #89 + #91). **After** = the same plus this branch. Same tools, same
machine, the same seeded set-ups on both builds. Every team plays **4-4-2** (the default).

## What changed (game/src/roles.js `FWD` + `cfKind`, game/src/teamai.js)

- **Kinds of striker per formation slot:** 4-4-2 = slot 9 the **target man**, slot 10 the **advanced forward**;
  4-2-3-1 = one advanced forward; 4-3-3 = a **poacher**. (`team.cfKinds` can override per team: step 6.)
- **The first line of the press:** their back man (or keeper, ball at his feet) on the ball 14 m+ into his half = a
  striker gets a head start in the race to press him, and **curves his run** to cut off the pass back / across. The
  other striker screens the next easiest pass back / across. It's a jockey, not a lunge: the aim is to force the ball
  forward or long, not to hunt tackles.
- **Target man:** while we build from our own half he comes short (7 m in front of their line, at most 18 m in front of
  the ball). On the ball with a man tight on him (square or goal-side), more than 22 m from goal, he **holds it up**:
  shields, eases back, and looks for the lay-off instead of turning into the centre-back.
- **Advanced forward:** the one who runs in behind (the target man is picked last for that).
- **Poacher:** our ball past 12 m into their half = he heads for the box, between the posts, on the last man's shoulder.

## Exploit tests (Lab group RL, 40 runs each, `REP=40 node tools/rlrates.js`)

| Id | Before | After |
| --- | --- | --- |
| E1 chip over the keeper | 0% | 0% |
| E2 through ball | 10% | 3% |
| E2b over the top | 0% | 0% |
| E3 drag a CB out | 0% | 0% |
| E4 square pass on the keeper | 35% | 38% (14 → 15 of 40: the dice; step 3 measured 35-38%) |
| E5 walk round the keeper | 0% | 0% |
| E6 counter down the flank | 18% | 15% |

Nothing got worse beyond the dice.

## Smarter, not harder (`tools/soak.js`, 24 matches; you = home at base v the level)

| Build | Goals a match | Shots a match | You W-D-L |
| --- | --- | --- | --- |
| Before | 1.75 | 14.2 | 7-8-9 |
| **After** | **1.63** | **12.5** | **6-11-7** |

- **Not harder:** you lose less (9 → 7), win about the same (7 → 6), more draws. Goals about the same.
- Shots are down ~12%: the press makes the other side go long more often, and long balls lead to fewer shots than
  playing out. Worth watching in step 6 (the per-team picks); not a reason to hold this back.
- `MOVE CHECK`: the computer's chip shot wasn't played in either build's 24 matches (a rare move, same as step 4).

## The forwards (`tools/fwdstudy.js`, 12 matches, IS v IRO both ways)

| | Before | After |
| --- | --- | --- |
| A striker is the one pressing their back man (deep in his half) | 39% | **59%** |
| Their back man's spell ends: pass back / across | 7% | 8% |
| ... pass forward | 60% | **66%** |
| ... ball lost | 33% | **26%** |
| Regains in the other half, a match | 22.2 | 19.7 |
| Slot 9 (the target man) from the ball while his side builds from its own half | 20.7 m | **16.7 m** |
| Goals a match / shots a match | 1.67 / 15.9 | 1.67 / 13.0 |
| Page errors | 0 | 0 |

The first line now does the pressing (the midfield keeps its shape), and it forces the ball forward rather than winning
it more: fewer turnovers high up, so the game isn't harder, but the build-up looks like football: pressed, the centre-back
plays it forward or goes long.

## Test Lab group FW (watch tests, real team AI on both sides)

- **F1 THE FIRST LINE OF THE PRESS:** their #3 on the ball at the edge of his box. Typical line: `PLAYED FORWARD to their
  #10 at 2.1 s · your nearest striker got 2.4 m from him · pressing: #11 (CF)`.
- **F2 THE TARGET MAN comes short:** your #3 on the ball 20 m out, looking up for 3.5 s. Slot 9 comes from ~42 m to
  ~23-25 m from him (before step 5, an earlier cut of this test: he stayed ~32 m away). Their midfield still screens the ball into him often: that's the
  pass's risk, judged by the passer as before.
