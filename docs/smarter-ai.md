# Smarter team AI: stage 1 (measure, watch, plan)

The co-designer, 24 Oct: "improve the general game AI, not necessarily making it harder, but making them smarter.
Running, positioning, better passes, less clunky. For both enemy teams and allied team."
27 Oct: "It is important that this team IQ is adaptive and incorporates future additional gameplay features added."

**The goal in one line:** players who look like they understand football, more goals in a match, and the same win rate
at every level as today ("the number of goals should increase with little to no increase to the win rate").

Built by worker-f in a preview first; the co-designer plays it, then a PR for Luca. Personalities: Luca picks them.

## How real football and other games do it

- **Real football:** support triangles round the ball; the third-man run; holding the shape and shifting as a
  block; one man presses, the next covers, the rest screen (nobody else chases the ball); game management: chasing a
  game late, full-backs go, the keeper goes up for the last corner; protecting a lead, teams either keep the ball or
  sit deep, by style.
- **FIFA / EA FC:** "Tactical AI" positioning: attackers time runs into space, defenders hold their lines and shift; team
  tactics and player instructions give every team its own style (tempo, width, pressing).
- **PES 2008 "Teamvision":** the computer adapted to the human within a match, picking up on repeated tactics. We take
  this only for **Rise Warrior** (the co-designer, 27 Oct).
- **Football Manager's match engine:** each team's mentality moves with the score and the clock.
- **Sensible Soccer:** the opposite lesson - very simple AI that never looks confused: players commit to a run and
  don't dither.

## The numbers today (v0.12.4)

`tools/aistudy.js`, 6 full matches, computer v computer, IS v IRO both ways, the default level (27 Oct).
Counting only: the tool never changes play.

| What | Today | What it means |
| --- | --- | --- |
| Goals a match | 4.0 | both sides at the default level |
| Sharp U-turns (> 135 deg in 0.4 s) | **7.1 per running man per minute** | one every ~9 s: the dithering you see |
| Back-and-forth (3 U-turns in 3 s) | **87 moments** (~15 a match) | the clunkiest single thing |
| 3+ men on the ball for 2 s+ | 16 moments | swarming, instead of press + cover |
| Standing still while his team attacks | 7% of the time (10% defending) | mostly fine |
| Team-mates bunched (two within 3 m, off the ball) | 0.1 pairs at any time | fine |
| Width / depth with the ball | 47 m / 34 m (43 / 33 without) | shape is OK; it barely changes with the ball |
| Open team-mates for the man on the ball | 3.1 on average, none 3% of the time | decent |
| Passes a match | 86: 81% kept, 77% to the man meant, 55% forward | |
| ...ground / through / lob | 83% / 74% / **41%** kept | the computer's lobs mostly give it away |
| Pass into a man marked within 2 m | 3% of passes, a third of them lost | rare, but ugly when it happens |
| The ball changes team on the ground | ~42 a match | choppy: lots of 50-50s |

Also found:
- The match stats' `shots` is smaller than `on target` (13 v 17 a match): the known undercount (t-035).
- **Drawing changes the match:** with the camera hidden (as `tools/soak.js` and the trainers run) a seeded match plays
  differently from the same seed drawn (the drawing uses `Math.random`), so a soak repro line can't be replayed as a GIF.
  `aistudy.js DRAW=1` + `preview.js NOCUT=1` replay exactly.

## The 7 clunkiest moments

(GIFs in `docs/ai/`, each with its cause - being recorded.)

## The plan: a team brain in four layers

Today the computer's choices are a fixed chain of `if`s with dice (`carrierAI2`: special, chip, shot, cross, pass), and
each new move had to be wired in by hand (the tap kick, the curving passes and Lob B are not in it at all). The new
brain keeps every judgement the game already makes (`shotLook`, `passLook`, `crossLook`, `aiSupport`, the keeper's
plan) and puts them behind one way of choosing.

### 1. A move list every new feature joins (the "new moves join in" rule)

- **On the ball:** every move is one entry in a list - `{ id, available(), look(p) -> { value, risk, how }, play(p, how) }`:
  shoot, special, chip, cross, ground pass, through ball, lob, dribble / take on, carry, hold it up, and later tap
  kick, curving pass, floated / driven lob, charged header... The man on the ball scores every available entry and
  plays the best (risk weighted by the team's style and the match state; a little noise by level).
- **A new mechanic = one new entry** (and its switch). A soak check fails if any available move is never used by the
  computer in 12 matches, so nothing gets forgotten again.
- **Off the ball:** the same for jobs - press, cover, mark, screen, support, run in behind, overlap, box runs, hold the
  line. Jobs are given out every ~0.4 s, and a man **keeps his job and his target until it's clearly worse**
  (hysteresis): this is the fix for the dithering.

### 2. The match state (the "reads the scoreline" rule)

One number from the score and the clock, -1 (protect) ... +1 (chase):
- **Chasing late, bold** (the co-designer's pick): last 10% of the match a goal down - a higher line, more runners, shots
  from range, the keeper up for a last corner.
- **Protecting a lead: by personality** - a possession side keeps the ball (patient, compact), a direct side sits deep
  and counters.

### 3. Team personalities (Luca picks them)

A style card per team, weights on the same move list: tempo, width, directness, pressing height, risk, specials
appetite, how it protects a lead. **Balance test:** every pairing both ways in a round-robin of seeded matches; no style
may win clearly more often than another (target: every style within a few points of 50%).

### 4. Reads your habits (Rise Warrior only)

What you do, over the last few minutes, fading out: **your favourite flank** (cover shifts there, the winger tucks
in), **your shooting spots** (closed down a beat sooner there), **your dribble tricks** (the way you always cut / when you
burst: they show you the other way). A Rami line when they've read you.

### Keeping "smarter, not harder"

- Before / after on the same seeds: goals a match **up**; your win rate at every level **within a few points** of today
  (`tools/soak.js` with your side at base v each level, plus `tools/proxy093.js` run / def).
- Easy stays easy: the brain's noise and reaction time still come from the level's knobs (`difficulty.js`).

## Decisions

- Luca: the personality of each team (a talk with the co-designer); OK for the whole plan as worker-f's task.
- Already decided (the co-designer, 27 Oct): chasing late = bold; protecting = by personality; habit reading on Rise
  Warrior only, for flank, shooting spots and dribble tricks; measure first, worker-f builds it, preview first.
