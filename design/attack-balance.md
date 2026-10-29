# Attack balance + special events more often (branch friend/attack-balance)

The co-designer, 29 Oct: "The game is currently quite unidimensional. The best strategy is sprinting down the middle at
the goal and other strategies are all vastly inferior (for example, running down the wing and lobbing it for a header),
we want to improve this. We also want it so that special events are happening more often."
His picks: both paces; special events = special moves, aerial moments, cut-in scenes. The split: this branch does the
attacking side and the measuring. worker-f does defending the middle, inside smarter AI stage 2 (no recovery slides from
behind near their own box, a compact middle).

## How real football and other games do it
- Real football: a dribbler at full sprint has the ball further from his feet, so he is easier to tackle. Close
  control protects the ball. Wide play ends in crosses aimed at runners attacking the near post, the far post and the
  penalty spot.
- FIFA / EA FC: sprint dribbling loses close control. A cross from the byline area goes to a zone, not straight out.
- PES: the same, plus a meter that fills on big moments. Mario Strikers / Inazuma: special moves come often, each
  with a short cut-in.

## What changed
1. **Sprinting no longer protects the ball** (actions.js `challenge`, `blockSteals`, v you). The burst still gives a
   little protection.
2. **Your LOB from wide in their third is a real cross** (`crossYou`): it goes to the runner who gets there first,
   near post, far post or the spot, whipped or floated. Before this, every human cross from wide went out for a goal
   kick, because the AUTO lob cone found nobody.
3. **Special events more often** (core.js / specials.js / ball.js):
   - The SP meter fills 1.4x on CLASSIC (a bar every ~48 s, was ~67 s) and 2.0x on ARCADE (was 1.75x).
   - The big-moment SP extras now work on both paces.
   - Every special shot gets a short cut-in (0.7–1 s, shorter on ARCADE).
   - **Luca to OK the meter change.**
4. **Test Lab WG3, WG3-B…E:** your cross from wide, from five starting spots.
5. **tools/strategy.js:** a scripted "you" attacks from halfway three ways (centre sprint, wing cross, passing) and
   counts how each attack ends.
6. **Bug watch fix:** a slide that pokes the ball off a special-shot taker mid-wind-up is a fair tackle, not a WHIFF.
   Seed 8919 replays clean.

## Numbers (29 Oct)
Soak, 12 computer-v-computer matches each, main v0.13.0 vs this branch:

| | Classic main | Classic branch | Arcade main | Arcade branch |
|---|---|---|---|---|
| goals / match | 1.67 | **2.42** | 3.75 | **4.08** |
| special shots / match | 0.67 | **1.5** | 2.5 | 2.42 |
| crosses / match | 3.83 | 4.25 | 4.58 | 4.58 |
| aerial shots / match | 3.92 | 4.0 | 2.42 | **3.0** |
| fouls / match | 1.75 | 1.42 | 1.67 | 1.92 |
| home W-D-L | 4-2-6 | 1-7-4 | 7-1-4 | 4-2-6 |
| page errors / real bugs | 0 / 0 | 0 / 0 (after the fix) | 0 / 0 | 0 / 0 |

- The W-D-L swings in 12 matches are within noise, because both sides are the computer. Run a bigger sample before
  the PR is merged.
- On ARCADE, special shots stayed flat: the extra SP is spent on the other ARCADE extras too.

strategy.js, NORMAL, 30 attacks per way (the scripted human is crude, so read these as directions, not truths):
- **Centre sprint, ARCADE:** goals 13% → 0%, and edge free kicks up (the sprint no longer shields him). On CLASSIC
  it's unchanged: it was already mostly fouls and edge free kicks. worker-f's "defending the middle" work fixes those.
- **Wing, CLASSIC:** crosses that went out for a goal kick 30% → 0%. Crosses now reach the box and are won in the air
  (trapped 3, headers 1).
- **WG3 Lab (10 runs):** 9 crosses reached a runner, met by a header at 2.6–2.7 m (right on header height, so no
  height tuning needed). Result: 2 goals, 2 keeper saves, 1 corner. The 10th run ended in a free kick before the cross.

## Still open
- The co-designer plays the preview ("HC2 Football · preview · Attack balance") and says how the crosses feel.
- After his OK: open the PR with a GIF of WG3.
- When the arcadesp combo cut-in (PR #52) merges, clear `cutInQ` in `aspCombo` so the two cut-ins don't stack.
