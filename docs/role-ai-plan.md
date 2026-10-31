# Role-based AI: the plan

Luca, 31 Oct 02:24: "next VERY important thing ... building new logic for the playing ai, both on own team and
opponent, the players must be broken down into striker, midfield, defender and gk (with the specific sub types so like
cdm, winger, centerforward cam etc). First we build the plan then we start working."

**This is the plan only. Nothing in the game changes until Luca OKs it on HQ.**

## TL;DR (30 seconds)

- **The problem:** today all 10 outfield men run one brain. "Defender" just means shirt slots 1-4. Nobody owns the
  back line, so it never drops or steps up together: the four are **11 m apart** with the ball near our box (numbers below). The
  keeper sets his height off the deepest defender, not the ball: **9-14 m out with the ball 35-50 m away, in chipping
  range**, and up to 14 m out in a 1v1. That leaves the gap behind him.
- **The fix, in one line:** give every man a **role card** (CB, FB, CDM, CM, CAM, winger, CF, GK ...), make the back
  four **one unit with one line**, and tie the keeper to the ball and to that line, not only to the line.
- **Smarter, not harder:** keeper save chances, tackle odds and difficulty knobs stay as they are. We fix positions
  and decisions. Difficulty levels get tuned later, as their own job.
- **Both teams:** your team-mates and the computer's side use the same role AI. The man you control is never moved.
- **6 build steps**, each its own PR, preview and HQ card. **Steps 1-3 fix the exploits** (line + keeper). Steps 4-6
  add the midfield and forward roles and the formations.

**What Luca decides:** OK the plan and the order (HQ card). Two small picks are at the end.

---

## 1. What's wrong today (from the code)

| # | What you see | Why (the code) |
| --- | --- | --- |
| 1 | Defenders don't act like defenders | Roles are shirt numbers: `p.i <= 4` = defence, `5-8` = midfield, `9-10` = attack (23 checks in `teamai.js`). Every team is a 4-4-2. There's no CDM, CAM, winger or CF. |
| 2 | No defensive line | Each defender works out his own depth from the ball (`AI.LINES[0]` in `aiZone`). There's no "line" the four share, and no rule for when to **drop** (their man has time on the ball) or **step up** (ball played back). |
| 3 | Holes in the back four | A defender marking a runner gets pulled the full way (weight 1.0, up to 18 m out, `aiRoles` + the marker target in `ai()`). Nobody slides across into the gap he leaves. |
| 4 | Keeper too far out | Far from goal he walks up to `deepest defender - 18 m`, clamped to 8-17 m (`gkPlan`, ANGLE + SWEEPER). A 1v1 takes him up to 14 m out (t-027, `GK_1V1.outMax`). That's fine against a lone striker, but bad against a square pass or a chip. |
| 5 | Open goal behind him | When he comes out, no defender drops onto the goal line, and nothing makes him back off when a lob or chip is coming. |
| 6 | Counters | Attacking, the full-backs overlap and the midfield pushes up. Nobody is told to stay back (no "rest defence"). |

## 2. The numbers today (v0.15.3)

`tools/linestudy.js` (new, counting only, built on `tools/aistudy.js`): 6 seeded full matches, computer v computer, IS
v IRO both ways, default level. These are samples while the other side has the ball 20 m+ from our goal.

| Where the ball is (m from our goal) | Keeper off his line | Keeper 12 m+ out | Deepest defender | Back-four spread | Their man unpressured |
| --- | --- | --- | --- | --- | --- |
| 20-35 m (shooting / chipping range) | 6.3 m | 0% | 18.9 m | **11.1 m** | 10% |
| 35-50 m (chip / ball over the top) | **9.4 m** | **23%** | 26.4 m | 9.0 m | 15% |
| 50 m+ (their half) | 13.6 m | 69% | 38.5 m | 4.8 m | 40% |

- **The back four isn't a line:** the spread from the deepest to the highest defender averages 6.9 m, and 11 m with
  the ball near our box. Real back fours keep it to 1-2 m. **27% of the time one defender is 8 m+ out of the line**,
  pulled by his man.
- **The line barely drops when their man has time:** with the ball 35-50 m out it sits at 27.6 m unpressured v 26.4 m
  overall. Real teams drop on an uncovered ball.
- **The keeper:** 11.4 m off his line on average, 38% of the time more than 14 m, about 21 m behind his deepest
  defender. With the ball 35-50 m out, he's 12 m+ out a quarter of the time. That's chipping range.
- Only 2 of the 27 goals came with the keeper 10 m+ out. **The computer doesn't go for these gaps; a human does.**
  That's why step 0 adds scripted exploit tests (a human's moves) instead of relying only on computer-v-computer
  soaks. The 1v1, where the keeper goes up to 14 m out (t-027), only shows up when someone runs at him.

**How it compares (FIFA Training Centre, World Cup 2022):** keepers average 13 m off their line in open play, about
20 m behind their own line. That includes the times their own team has the ball high up the pitch. **The real point
is height by ball position:** with the ball in front of their box, keepers stand 1-7 m out (Lloris 1 m, Livaković
2 m, Martínez 7 m).

## 3. The exploits we're closing (each gets a Test Lab test)

Each one becomes a scripted Test Lab test (group **RL**, "roles & line"), run 20 times before and after. Targets are
real-football rates, not zero: a good chip should still score sometimes.

| Id | The exploit | Fixed in |
| --- | --- | --- |
| E1 | **Chip / lob over a keeper who's 10 m+ out** from 25-40 m | Step 3 |
| E2 | **Ball over the top / through ball** behind a line that never drops when your man has time | Step 2 |
| E3 | **Drag a CB out** (the striker drops deep), then run into his hole | Step 2 |
| E4 | **Square pass in a 1v1** (keeper charges the carrier, the 2nd attacker taps into an empty net) | Step 3 |
| E5 | **Walk round the keeper** (fixed in t-017 / t-027, kept as a test so it doesn't come back) | Step 0 test |
| E6 | **Counter down the flank** after their full-back overlaps | Step 2 (rest defence) |

Luca's own Bug Watch marks, and the nightly QA, can add more to this list.

**Step 0 done (31 Oct):** today's rates are in `docs/ai/rl-baseline.md` (E4 100%, E6 70%, E5 30%; E1-E3 rarely work,
but their numbers still show the shape problem). E2 got a twin, E2b (the same ball in the air), and E1 is chipped from
36-46 m over a keeper who starts 10-14 m out (nearer, today's keeper is already back).

## 4. How real football does it (what we take)

- **The back four is one unit** (FIFA Training Centre; standard UEFA B "pressure / cover / balance" sessions). One
  line, one height. **Covered ball** (our man is on the carrier, goal-side) = hold or step up. **Uncovered ball**
  (the carrier has time and his head is up) = **drop** so nothing goes over the top. **Ball played back** =
  everyone steps up together.
- **Hold the edge of the box.** In their own third, with the ball in front, the line holds at about 16 m. It only
  drops into the box when the ball is played behind it (FIFA TC, Monterrey at the Club World Cup).
- **Slide with the ball.** The near full-back presses the winger, the CBs shift over, and the far full-back tucks in.
  Nobody is left alone 1v1 on the far side.
- **Pass the man on.** A CB follows a striker who drops only while someone covers his spot (the CDM drops in).
  Otherwise he hands the striker to the midfielder in front of him.
- **Rest defence.** When attacking, 2-3 men (the CBs plus the CDM, or a full-back) stay behind the ball against
  their forwards. That's what stops counters.
- **The keeper works with the line, and with the ball.** He covers the space behind his defence only while the ball
  is far away. As the ball comes into range (shooting or chipping), he drops back to his goal. He comes for a through
  ball only if he clearly gets there first and no defender can. If a defender stands between him and the attacker, he
  stays deeper and lets the defender deal with it (FIFA TC, World Cup 2022 keeper analysis).
- **The roles** (the jobs coaches give each position):
  - **CB:** stopper (steps out to win it) or cover (sweeps behind)
  - **FB:** defend first, or overlap
  - **CDM:** the anchor. Screens in front of the CBs and drops into the line when one steps out.
  - **CM:** box-to-box. Presses, supports, makes late runs.
  - **CAM:** plays between their lines. Edge-of-the-box runs. First to press their CDM.
  - **Winger:** wide (crosses) or inside forward (cuts in). Tracks their full-back.
  - **CF:** on the last man's shoulder, target man (holds it up), or poacher (in the box). Strikers are the first line
    of the press.

## 5. How other games do it (what we take)

- **EA FC 25 "FC IQ":** 31 player roles, each with a focus (Defend / Balanced / Attack). The formation sets the shape
  without the ball; the role sets each man's runs with it. Every role has a trade-off: an attacking role gets back
  more slowly. Line height is one team number ("Defensive Approach": Deep / Balanced / High). **We take:** role cards
  with a focus, one line number per team, and trade-offs instead of plain better or worse.
- **eFootball playing styles:** Anchor Man, Destroyer, Build Up (CB), Defensive vs Offensive Goalkeeper, Goal Poacher,
  Target Man, Cross Specialist, Roaming Flank, Hole Player. **We take:** the role names and flavours. Our GK gets a
  "keeper" vs "sweeper keeper" dial.
- **FIFA 23 Title Update 5:** EA fixed the over-powered *driven lobbed through ball* by making the ball itself lower
  and less accurate when the passer isn't facing the way he plays it. They didn't make the AI super-human. **We
  take:** fix an exploit at its cause (here, positions), never by giving the AI an unfair edge.
- **Google Research Football** (its built-in AI, which the v0.8.1 presser already borrows from): the same role names
  as positions (GK, CB, LB, RB, DM, CM, LM, RM, AM, CF), each with its own default behaviour.
- **Sensible Soccer:** simple rules that never look confused. Every role rule stays readable and commits (the
  stage-2 hysteresis stays).

## 6. The design

### 6.1 Role cards (one table, `ROLES`)

Each man gets `p.role` from his team's formation. Each card is plain data: which line he's in, his home spot with and
without the ball, width, how far he presses, whether he marks, his runs, and how fast he gets back. One table means a
new role, or a team's own flavour, is one entry (the same idea as `AI_MOVES` in stage 2).

| Role | Line | Main job without the ball | Main job with it |
| --- | --- | --- | --- |
| GK · keeper / sweeper keeper | - | ball-and-line height (6.3) | outlet, walk-out (as now) |
| CB · stopper / cover | back | hold the line; the stopper steps out only when covered | stays in rest defence |
| FB · full-back / wing-back | back | the line; near one presses the winger, far one tucks in | overlap (wing-back more often) |
| CDM · anchor | mid (deep) | screens the CBs; drops into the line when a CB steps out | rest defence, the safe outlet |
| CM · box-to-box | mid | press + cover (as stage 2) | supports, late box runs (as now) |
| CAM · playmaker | mid (high) | presses their CDM, screens passes into it | between the lines, edge of the box |
| W · winger / inside forward | mid-wide | tracks their full-back back to our half | wide and crosses / cuts in |
| CF · advanced / target / poacher | att | first press on their CBs, cuts the pass back | shoulder runs / holds it up / the box |

### 6.2 The back line as one unit (the core fix)

- **One number per team: `team.line`** (metres from our goal). It's set from where the ball is, whether the ball is
  **covered or uncovered**, whether it was just **played back**, their deepest runner, and the team style (stage 2's
  `brainLine`).
- **Floor:** the edge of the box (about 16 m) while the ball is in front of the line outside the box.
- **Ceiling:** low enough that the gap from the keeper to the line stays at about 18 m at most (6.3).
- **It moves slowly and together:** about 1.5 m/s when dropping, faster when stepping up. That keeps the four level
  (target: a spread under 3 m most of the time). The cover CB stands 1-2 m deeper than the others.
- **Across the pitch:** the line slides towards the ball. The near FB pressures, the far FB tucks in to the edge of
  the box.
- **Marking with a hand-off:** a defender follows his man out of the line (more than 6 m) only when the CDM (or a CM)
  has dropped into his spot. Otherwise he hands the man on and holds.
- **Rest defence:** with the ball, 2 CBs + the CDM stay behind it (a 4-4-2 has no CDM, so one full-back holds instead).

### 6.3 The keeper: tied to the ball and the line

- **Height by the ball:** a cap on how far out he stands, by where the ball is. Ball 20-35 m from goal: at most about
  6 m out. Ball 35-50 m: at most about 10 m. Ball further away: sweeper height behind the line, as now. (Tuned with
  the RL tests. Real keepers sit at 1-7 m with the ball in front of their box.)
- **Lob read:** if the carrier can chip him from where he stands (it would land under the bar before he could get
  back), he backs off. A lob he's already read sends him back on the line through the near post (BACK mode, made
  quicker). Easy keepers keep their slower read: the difficulty knob `gkRead` already exists.
- **1v1 with support:** the t-027 engagement stays against a lone striker. When a second attacker could take a square
  pass, the keeper stops short (about 6-8 m), sets, and stays on the line between ball and goal. He doesn't charge.
- **Goal-line cover:** when the keeper is out (a sweep or a smother), the nearest CB drops onto the goal line by the
  far post.
- **Unchanged:** saves, dives, catches, hands, specials, special saves and the 1v1 smother. Only where he *stands*
  and *when he comes* changes.

### 6.4 "Smarter, not harder": how we check

Each step must pass, before it goes to Luca:
- **Seeded soak** (`tools/soak.js`, 24 matches a level): goals a match stay in today's range (around 2-4). The win
  rate against each level stays within a few points of today.
- **The exploit tests:** E1-E6 success rates fall to real-football-like levels (set in step 0 from what we measure).
- **Feel:** the line spread, the keeper height by band and the clunkiness numbers from stage 2 (U-turns, swarms)
  don't get worse.
- **A preview GIF for every step** (the back four dropping together, the keeper backing off a chip) and its **Play
  it** link. Never the live game until merged.

## 7. Build order (one PR per step, Luca's OK on each)

| Step | What | Changes play? | Size |
| --- | --- | --- | --- |
| **0** | **Measure + exploit tests:** `tools/linestudy.js` (already in this PR); Test Lab group RL with E1-E6 as scripted tests; today's rates written down | No | small |
| **1** | **Role layer (refactor):** `ROLES` table + `p.role`; all 23 shirt-number checks become role checks; still 4-4-2 | **No** (the same seeded matches give the same scores) | medium |
| **2** | **The back line as one unit:** `team.line`, covered / uncovered, step up / drop, slide, hand-off marking, rest defence | Yes | big |
| **3** | **The keeper tied to the ball and the line:** height by ball, lob read, 1v1 with support, goal-line cover | Yes | medium |
| **4** | **Midfield roles + formations:** 4-2-3-1 and 4-3-3 (the CDM anchor, the CAM, wingers tracking back) | Yes | big |
| **5** | **Forward roles:** CF advanced / target / poacher, first-line press | Yes | medium |
| **6** | **Per-team picks:** a formation and roles per team (with the personalities card: Luca + the co-designer pick), plus the balance round-robin | Yes | small |
| later | **Difficulty levels** retuned on top (its own card, as Luca said) | Yes | - |

- **Steps 2 and 3 are the ones that fix the gameplay** Luca is talking about. Step 3 needs step 2's `team.line`, so
  it comes right after. Step 0 and step 1 can run at the same time (different files).
- Every step works for **both teams** and keeps the man you control untouched. 2-player (#2p) and LAN carry over:
  they run the same AI code.
- **Files:** `teamai.js`, `keeper.js` and `brain.js` (Gameplay & AI), plus a new `roles.js` (the `ROLES` table and
  formations, loaded after `brain.js`). `lab.js` gets the RL group. Open PRs right now: #68 (LAN) touches `brain.js`,
  so step 1 waits for it or rebases. #71 and #73 don't touch these files.

## 8. Decisions for Luca

1. **OK the plan and the order** (the HQ card). After the OK, steps 0 + 1 start.
2. **Formations:** steps 1-3 keep every team in today's 4-4-2. Step 4 brings 4-2-3-1 / 4-3-3 (that's where the CDM,
   CAM and wingers come in). **Recommended:** yes, this order, so the line and keeper fix lands first, on its own.
3. **Keeper style:** one "keeper" for every team first. Each team gets its keeper or sweeper-keeper flavour in step 6.

## Sources

- FIFA Training Centre: [goalkeeper and defensive line distances in the final third](https://fifatrainingcentre.com/en/game/individual-qualities/goalkeeping/goalkeeper-and-defensive-line-distances-when-defending-in-the-final-third.php),
  [goalkeeper height and connection with the defensive line (World Cup 2022)](https://fifatrainingcentre.com/en/fwc2022/technical-and-tactical-analysis/goalkeeper-height-and-connection-with-the-defensive-line.php)
- Coaching sessions: [when to press, when to drop](https://www.sportsessionplanner.com/s/NHni/When-to-press-When-to-drop-1.html),
  [back four pressure / cover / balance](https://www.sportsessionplanner.com/s/1SpX/Caldwell-University-Shape-of-the-Back-Four-Pressure-Cover-Balance.html)
- EA: [FC 25 FC IQ deep dive](https://www.ea.com/en/games/ea-sports-fc/fc-25/news/pitch-notes-fc-25-fc-iq-deep-dive),
  [FIFA 23 Title Update 5 (lobbed through balls)](https://www.fut.gg/news/lobbed-through-balls-patched-fifa-23-title-update-5-overview/)
- eFootball: [playing styles](https://www.fifplay.com/efootball-2026-playing-styles/)
- [Google Research Football](https://arxiv.org/pdf/1907.11180)
