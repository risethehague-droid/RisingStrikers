# Arcade pace: a faster, punchier HC2

**Proposal:** add one **PACE** setting, *Classic* (today) and *Arcade*, that turns a set of measured dials at once:
quicker players and ball, more shots and goals, and far less waiting between the action. Build it as a preset so
Luca can play both, then decide whether Arcade becomes the default.

Status: draft by the co-designer (Design & Vision), 24 Oct. Branch `friend/arcade-pace`. Not a card yet.
Related decision already sent: the chip stays **arcade** (fast, hard dip), and B's lob hang times should be shorter.

---

## 1. What "arcade" means for HC2

Style recipes, in words only (house rule):
- **Sensible Soccer:** tiny quick players, the ball always moving, a match over in a few minutes, goals often.
- **Mario Strikers:** no stoppages to speak of, physical, big moments with a bang, then straight back to play.
- **Neo Geo Super Sidekicks:** big special shots, short dramatic cut-ins, then play on.
- **Rocket League:** constant motion, instant restarts, a goal is a burst of fireworks and then you're playing again
  within seconds.

The common thread: **more decisions per minute, fewer seconds of waiting, and every touch feels strong.**
Not: chaos, or the AI making silly mistakes. It should still be football.

## 2. Today, measured

`node tools/pacestudy.js 4`: 4 full computer v computer matches (normal, hard, easy, rise), 1x speed, replays and
celebrations played at their real length.

| | Today |
| --- | --- |
| Match length | 2 x 3 real minutes of play = **7.5 real minutes** with the pauses (plus walk-out, toss and half time in a real match) |
| Live play | **85%** of the time |
| Biggest pauses per match | replays **32 s** (7%), freezes before restarts **12 s**, foul scenes **8 s**, hit-stops **7 s** |
| Half time (real match) | players walk off **3.2 s** + the stats card **25 s** (skippable) |
| Kick-off / restart freezes | kick-off **1.2 s**, set pieces **0.5 s**, second half **1.6 s**; restarts taken after **1.8 s** |
| Shots | **~10 per match** (one every ~36 s) |
| Goals | **~2.5 per match** (one every ~2.5 min) |
| Possession changes | **~74 per match** (one every ~5 s) |
| Ball in live play | **6.5 m/s** on average; over 54 km/h only **8%** of the time |
| Players | jog 3.8, run 5.2, sprint 7.7 m/s, accel 12 m/s²; outfield average **3.1 m/s**; end to end at a sprint **~14 s** |

What it tells us: the waiting is not the main problem (85% live). The main problem is that **live play itself is
slow and low-event**: the ball crawls, players take a long time to get anywhere, and shots and goals are rare.

## 3. The dials (Arcade preset; every number is a starting point to tune)

### A. Movement (biggest effect on feel)
| Dial | Classic | Arcade | Why |
| --- | --- | --- | --- |
| Run / sprint (m/s) | 5.2 / 7.7 | 6.0 / 8.8 | end to end in ~12 s instead of ~14 |
| Acceleration / braking (m/s²) | 12 / 26 | 16 / 32 | snappier starts and turns: the biggest "arcade" tell |
| Sprint drain (stamina/s) | 0.23 | 0.15 | sprint more, walk less |
| With the ball | 0.90 of top speed | 0.95 | dribbles that go somewhere |

### B. The ball
| Dial | Classic | Arcade | Why |
| --- | --- | --- | --- |
| Ground pass arrive speed | firm, then dies | +20% | quicker passing, fewer interceptions mid-roll |
| Shot power (`SHOT_K`, `KICK_MAX`) | 1.0, 30 m/s | 1.12, 33 m/s | shots that feel like shots |
| Lob hang time | today (PR #2) | ~15% shorter | arcade, as already decided for the chip |
| Grass grip (`SKID_DEC` / `ROLL_DEC`) | 8.6 / 5.4 | slightly less grip | the ball keeps rolling, more loose-ball races |

### C. Shots and goals (target: ~16 shots, ~4-5 goals per match)
| Dial | Classic | Arcade | Why |
| --- | --- | --- | --- |
| Computer's shooting range / willingness | today | +20% range, shoots sooner | more shots, both ways |
| Keeper read / reaction | `gkReact` by level | a little slower at every level | more goals, still fair |
| Power-shot charge time | today | ~25% quicker | big shots more often |

### D. Less waiting
| Dial | Classic | Arcade | Why |
| --- | --- | --- | --- |
| Goal replay | full slow-mo replay | one short replay (~4 s), skippable at once | keeps the moment, loses the wait |
| Near-miss / save replays | auto | only in HIGHLIGHTS | they cost most of the 32 s |
| Kick-off freeze | 1.2 s | 0.6 s | |
| Set-piece freeze, restart wait | 0.5 s, ~1.8 s | 0.3 s, ~0.8 s; computer takes throw-ins and goal kicks quickly | quick restarts |
| Foul scenes | stop and show | advantage played more; scene only for cards | fewer stoppages |
| Half time | walk off + 25 s card | 8 s card, any key skips | |

### E. Big moments
| Dial | Classic | Arcade | Why |
| --- | --- | --- | --- |
| SP meter fill | time only | ~1.5x faster | specials a few times a match, not once |
| Special cut-scenes | today | shorter (~60%) | the bang without the wait |
| Hit-stop on passes | 0.025 s | 0 (keep it on shots and specials) | flow on passes, punch on shots |

### F. Match length
Keep **2 x 3 minutes** for now. With more happening per minute it will feel fuller. Revisit after playtests
(2 x 2 minutes may suit the event day, where many people queue to play).

## 4. How to build it (suggestion)

- One `PACE` object in `core.js`, `classic` and `arcade`, holding every dial above; the code reads the dials from it
  instead of the constants. `classic` = today's numbers exactly, so nothing changes until Arcade is picked
  (proof: seeded matches identical, as for refactors).
- **PACE: CLASSIC / ARCADE** on the start screen and in Pause > Options (like CAMERA), remembered on the browser.
- Measure Arcade with `tools/pacestudy.js` (shots, goals, live %, ball and player speeds) and the difficulty
  proxies (`proxy093.js`) so the levels stay apart.
- Order: **D (less waiting)** and **A (movement)** first: cheap and the most felt. Then B, C, E.
- Lanes: mostly Gameplay & AI (`player.js`, `ball.js`, `teamai.js`, `keeper.js`, `matchflow.js`, `replay.js`,
  `specials.js`), plus `core.js` (lead) and the menu (Design & Vision). Probably 2-3 tasks.

## 5. Decisions for Luca

1. **A PACE setting (Classic / Arcade)**, or go straight to an arcade game and drop Classic?
2. **Default** once it's tuned: Arcade or Classic?
3. **Targets:** about 16 shots and 4-5 goals in a 2 x 3-minute match. Right ballpark?
4. **Replays:** one short goal replay, the rest only in HIGHLIGHTS. OK?
5. **Fouls:** play advantage more, stop only for cards. OK?
6. **Match length** for the event day: keep 2 x 3, or 2 x 2?
