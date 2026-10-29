# Arcade specials: the special dribble, combo specials, team signature moves, bigger leaps

The co-designer, 28 Oct (Arcade part 2, "the rest": more specials both ways, more than human). ARCADE only: CLASSIC
plays exactly as before. Built in this chat on `friend/arcade-specials`, played in his preview first, then a PR for
Luca. **Not easier:** everything here is the computer's too, at its level.

Left out of this version (on the To-Do for later): a special block / tackle for defenders.

## How real football and other games do it (words only, house rule)

- **Real football:** the moments people replay are a dribble past two men (the step-over, the roulette), a quick 1-2
  round a defender (the wall pass), a cross met on the volley. Those are the moves we make "more than human".
- **Inazuma Eleven:** named special dribbles (a burst past the defender, who is left spinning), and combo shots where two
  or three players strike together under one name, stronger than a solo shot.
- **Captain Tsubasa:** every star has a signature shot with its own name and look; the twin shot by two players at once.
- **Mario Strikers:** the big shot is an event with its own cut-in; the "Mega Strike" costs a full charge.
- **FIFA / PES:** skill moves on their own input, or a contextual one-button version; we try both (below).

## 1. The special dribble (1 bar)

- **What you see:** a short slow-mo, after-images in the team's colour, he bursts past the man in front (2.5-4 m), the
  defender is left spinning / on the floor (`fall`), a banner with the move's name, Rami.
- **Two triggers to try in your preview** (you pick one before it goes to Luca; Pause > Options > SP DRIBBLE):
  - **AUTO (by position):** SPECIAL far from goal (outside shooting range) with a defender in front = the dribble;
    in range = the special shot as today.
  - **BUTTON:** its own key, **N** (arrows set) / **O** (WASD set), pad **LT**. SPECIAL stays the shot everywhere.
- **The computer:** uses it when a defender squares up to its carrier in midfield, by level, at most once every 25 s.
- **Fair:** the beaten defender is out for ~1 s, no more; the dribble doesn't go through a second man (that's what the
  special shot's "blows through" is for).

## 2. Combo specials (2 or 3 bars)

Two team-mates, one named shot, stronger than a solo special of the same bars.
- **The 1-2 combo:** you pass, a team-mate plays it back first time, you press SPECIAL as it arrives: both men strike it
  together (he arrives alongside), a two-portrait cut-in, the shot.
- **The lob + volley combo:** a team-mate's lob to you, SPECIAL as it drops: he flicks it up as you arrive, you volley it.
- **2 bars:** power 170, blows through 3 men (LV2 solo: 140 / 2). **3 bars:** power 240, through 6 (LV3 solo: 200 / 5).
  A combo meets a keeper's special save in the clash like any special (power against power).
- **The computer:** a 1-2 or a lob into the box with the bars banked, by level.

## 3. Team signature moves (names to choose together; Luca gives the final OK)

Each team gets its own names and colour for: its **LV3 shot** (replacing RISING PHOENIX for that team), its **combo**,
its **special dribble**. LV1 / LV2 shots and the keepers' saves keep today's shared names. Draft names, two themes to
pick from (or mix):

**A. Colours and elements**

| Team | Colour | LV3 shot | Combo | Special dribble |
| --- | --- | --- | --- | --- |
| IS | cream / white | WHITE COMET | TWIN COMET | MIRAGE STEP |
| IRO | red | CRIMSON FANG | TWIN FANG | EMBER DANCE |
| USCS | gold | SOLAR FLARE | DOUBLE SUN | SUNSPIN |
| LUC | pink | SAKURA STORM | PETAL CYCLONE | BLOSSOM FEINT |
| THUAS | green | EMERALD GALE | TWIN GALE | LEAF SHADOW |
| AUC | dark red | SCARLET LANCE | CROSSED LANCES | PHANTOM CUT |

**B. Den Haag (the Help Out Hague Cup's city)**

| Team | LV3 shot | Combo | Special dribble |
| --- | --- | --- | --- |
| IS | NORTH SEA STORM | DOUBLE TIDE | SEA MIST STEP |
| IRO | PIER CANNON | TWIN PIER | DUNE SLIDE |
| USCS | GOLDEN COAST | BEACH BLITZ | SAND DEVIL |
| LUC | PEACE PALACE BLAST | PALACE GUARD | GARDEN FEINT |
| THUAS | BOSCH WIND | FOREST DRIVE | HAAGSE BOS SHADOW |
| AUC | TRAM LINE DRIVE | CROSSTOWN | NIGHT TRAM |

(Placeholders in code until you pick: theme A.)

## 4. Bigger leaps, without overdoing it (talk it through with Luca)

ARCADE headers already go up to 3.1 m (CLASSIC 2.7). Proposal for the preview: up to **3.4 m** with a short hang
at the top (~0.12 s) so a header looks like a leap, not a jump; overheads the same. One dial (`ARCADE.leap`), so Luca
can set it. **For Luca:** how high is "more than human" before it stops looking like football?

## 5. PixelLab (the co-designer asked for a combo scene)

On the HC2 outfield character (`da68ec45`), 5 directions each (S, SE, E, NE, N; W side mirrored by the builder), recoloured
into all kits by `kits.py`, "with no ball anywhere in the picture":
- `combo` - the combo strike: a leaping two-footed volley (the striker's half of the joint shot): ~5 generations
- `combo2` - the partner's half: a side-on set-up flick / lay-off pose: ~5 generations
- `sdribble` - the special dribble: a low spinning burst (roulette into a sprint): ~5 generations
- the combo cut-in uses those frames, big, two portraits on the band (no new art needed for it)
About **15 generations + retries** (1,053 left this cycle, refills 11 Nov). Nothing is generated before the
co-designer OKs the count. Until then the preview uses today's moves (volley2, pass, sprint) with the effects.

## Tests (before the preview)
`node tools/smoke.js` `errors []`; Test Lab group **SX** (a special dribble each way of triggering, a 1-2 combo, a
lob + volley combo, 2 and 3 bars, a combo v a special save, the computer's dribble); the AR, SM, KS, AS, AB groups
unchanged; ARCADE soak before / after: goals, specials a match (target: special shots ~2 → ~3-4 a match, dribbles
~2), your win rate by level within a few points; CLASSIC soak identical.

## Built (28-29 Oct, `friend/arcade-specials`): measured

- **Test Lab SX1-SX8** `errors []`: both dribble triggers (3.4 m past the man, he goes down, the ball stays his, one
  bar), SPECIAL in range is still the shot, the 1-2 combo (170 / through 3 on 2 bars, 240 / through 6 on 3), the
  lob + volley combo, the computer's dribble, the six teams' names (CLASSIC keeps RISING PHOENIX). Smoke `errors []`.
- **CLASSIC identical:** 8 seeded soak matches, main v this branch, the same score in every match.
- **ARCADE soak, 12 matches (the same 12 set-ups), per match:**

  | | main | first try | 2+ bars | final: full meter |
  | --- | --- | --- | --- | --- |
  | Goals | 4.6 | 4.3 | 4.1 | 4.0 |
  | Special shots | 2.3 | 0.3 | 1.5 | 2.5 |
  | Special dribbles | - | 11.6 | 2.3 | 0.8 |
  | Combos | - | 0 | 0.1 | 0.2 |
  | Page errors / real bugs | 0 | 0 | 0 | 0 |

  The computer's dribble had to be held back: it costs a bar, and dribbling at will left it no bars for special shots.
  Now: only from a full meter, 22-50 m from goal, once per 75 s a side (`ASP.dribble`).
- **Not settled:** goals and win rates. 12 matches (3 a level) are too few: matches drift apart after the first
  different dice, and 4.6 v 4.0 goals is inside the noise. Before the PR: 48 matches each way (12 a level).
- **Art:** PixelLab batch 22, 15 generations: `combo`, `combo2`, `sdribble` in every outfield kit, added by
  `tools/kit_add.py` (old frames pixel-identical, the manifest only gains).

### 24-match comparison (29 Oct, ARCADE, the same 24 set-ups, 6 a level; "your side" = the computer at base)

| | main | first version | level-neutral (now) |
| --- | --- | --- | --- |
| Goals a match | 4.29 | 4.46 | 4.00 |
| Special shots / dribbles / combos | 1.96 / 0 / 0 | 2.17 / 0.75 / 0.04 | 2.25 / 0.79 / 0.17 |
| Your side W-D-L, all levels | 11-7-6 | 7-6-11 | 8-8-8 |
| Easy / Normal / Hard / Rise | 5-1-0 / 3-2-1 / 0-1-5 / 3-3-0 | 4-1-1 / 1-2-3 / 0-0-6 / 2-3-1 | 4-0-2 / 2-3-1 / 0-2-4 / 2-3-1 |

- The first version's computer dribble scaled with the level (Hard / Rise dribbled more): results tilted against
  you (7-6-11). Now the chance is the same at every level (`ASP.dribble.aiRate`, no level factor): 8-8-8.
- Goals: 4.0-4.5 either way, inside the noise of 24 matches (matches drift apart after the first different dice).
  The specials don't change the goal count by themselves; "more goals" is the smarter-AI work's target.
- 0 page errors, no real bugs in all three runs.
