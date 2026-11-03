# 01 · Controls

Legend: see [README](README.md). **Always describe keys as left hand WASD + right-hand action keys** (HOUSE-03).

## A. The NEW layout (the final version's controls)

Luca, 3 Nov 2026 12:05 + 12:07: "there should be a whole change ... Everyone plays it with the left hand for movement."
**Luca OK'd the full spec at 12:30 UTC.** Built in **PR #111** (branch `gameplay/charge-buttons`, `game/src/chargebtn.js`),
live in EXPERIMENTAL as the KEYS option **"NEW: SPACE CHARGE"**. Main still uses the old layout (E below) until his OK on #111.

### Left hand

| ID | Key | Does | Whose | Pri | Status |
| --- | --- | --- | --- | --- | --- |
| CTL-01 | **W A S D** | move / aim | L | P0 | ✅ |
| CTL-02 | **SHIFT** | sprint (uses energy); charged + SHIFT at a defender = special dribble (CTL-11) | L | P0 | ✅ / 🧪 #111 |
| CTL-03 | **C** | switch player | L | P0 | 🧪 #111 |
| CTL-04 | **SPACE** | charge your special (CTL-20) | L | P0 | 🧪 #111 |

### Right hand

| ID | Key | Attacking | Defending | Whose | Pri | Status |
| --- | --- | --- | --- | --- | --- | --- |
| CTL-05 | **J** | kick / shot (tap = tap kick, hold = power) | slide tackle | L | P0 | 🧪 #111 |
| CTL-06 | **K** | pass | standing challenge | L | P0 | 🧪 #111 |
| CTL-07 | **I** | through ball | — | L | P0 | 🧪 #111 |
| CTL-08 | **L** | lob / cross | — | L | P0 | 🧪 #111 |

- CTL-09 · **B and N are removed** ("a whole change"). — L · P0 · 🧪 #111
- CTL-10 · Defending on K (challenge) and J (slide): in the spec Luca OK'd at 12:30. — L OK · P0 · 🧪 #111
- CTL-13 · ENTER stays pause, so it's never an action key. — C✓ · P0 · 🧪 #111

### Special dribble (Luca, 12:30: automatic)

| ID | Rule | Whose | Pri | Status |
| --- | --- | --- | --- | --- |
| CTL-11 | **Charged + hold SHIFT + run at a defender** → the next defender in front (within ~2.6 m) gets the special dribble: RAINBOW FLICK or SHADOW STEP, picked by position, **1 bar** | L | P0 | 🧪 #111 |
| CTL-12 | Backup dribble key **O** (no charge needed). Double-tap SHIFT was replaced by the automatic dribble | L OK | P1 | 🧪 #111 |

## B. SPACE charge levels (the core new mechanic)

**Luca's design (L), 3 Nov 12:10, his words:**
> "pressing the space bar more than once can charge the character to lvl 2 if possible and 3 time to lvl 3 to use a
> lvl 2 and 3 skill if you so choose, but it doesnt insta use your strongest shot ... you can preserve your energy and
> perhaps use like a level one to bait a keeper and then use a level two for a guaranteed goal ... it's about giving
> control of how much ... power you want to use for your shots, for your specials, for your passes ... each stage is
> clearly more, like is distinct, clear, more of an upgrade of energy, like charging up. But keep it clean."

Final spec, OK'd by Luca 12:30 UTC (details worked out by the button thread = **C✓**):

| ID | Rule | Whose | Pri | Status |
| --- | --- | --- | --- | --- |
| CTL-20 | **Every SPACE tap while charged adds one level**: 1 tap = LV1, 2 = LV2, 3 = LV3 | L | P0 | 🧪 #111 |
| CTL-21 | **You choose** the level. It NEVER auto-spends your strongest (the old SPECIAL key spent every full bar) | L | P0 | 🧪 #111 |
| CTL-22 | Saving bars is a tactic: LV1 to bait the keeper, LV2 later for the goal | L | P0 | 🧪 #111 |
| CTL-23 | Each level looks **clearly stronger, distinct, more aura, but clean** | L | P0 | 🧪 placeholder look, final with RIG-40 |
| CTL-24 | The charge level feeds whichever action you press next | L | P0 | 🧪 #111 |
| CTL-25 | **Taps don't need to be quick** (no time window between taps) | C✓ | P0 | 🧪 #111 |
| CTL-26 | Max level = min(3, your bars); a tap past it flashes NOT ENOUGH BARS | C✓ | P0 | 🧪 #111 |
| CTL-27 | Each level fills in **0.3 s**; a key pressed while it fills fires once it's full | C✓ | P0 | 🧪 #111 |
| CTL-28 | The charge lasts **3 s from the last tap**, then fades and **spends nothing**; no cancel key | C✓ | P0 | 🧪 #111 |
| CTL-29 | **Bars are spent only when a special fires.** LVn special shot = n bars; a special pass = 1 bar and ends the charge | C✓ | P0 | 🧪 #111 |

What each level does per key:

| Key | LV1 (1 bar) | LV2 (2 bars) | LV3 (3 bars) |
| --- | --- | --- | --- |
| J kick | BLAZE SHOT (MV-20) | THUNDER SHOT (MV-21) | RISING PHOENIX (MV-22) |
| K pass | TORNADO DRILL (MV-30) | **none yet** → plays LV1, costs 1 | **none yet** → plays LV1, costs 1 |
| I through | BURROW BLAST (MV-31) | none yet → LV1 | none yet → LV1 |
| L lob | ANGEL GLIDE (MV-32) | none yet → LV1 | none yet → LV1 |
| SHIFT dribble | RAINBOW FLICK / SHADOW STEP (MV-16, MV-17), 1 bar | same, 1 bar | same, 1 bar |

- **LV2 / LV3 passes, through balls, lobs and dribbles don't exist.** Luca's words imply they should ("for your
  passes"), but only Luca designs them: ❓ Q-CTL-3. Claude must not invent them (HOUSE-02).

Charge on screen (🧪 #111, placeholder until the new rig): a **"CHARGE LVn"** label over the player; a bottom line
saying what each key does while charged; with the ball, ≥ 1 bar and no charge it reads **"SPACE: CHARGE YOUR
SPECIAL"**. Aura grows per level (ring → taller aura + sparks → full glow + pulse + screen-edge tint), a rising sound
per level. Final look comes with the rig (RIG-40).

References (C✓): Mario Strikers charge-up, Inazuma Eleven / Captain Tsubasa aura, fighting-game meter levels where
the player chooses what to spend.

## C. Context keys

| ID | Situation | Key | Whose | Pri | Status |
| --- | --- | --- | --- | --- | --- |
| CTL-30 | **Ball dropping to you** | SPACE alone = the aerial special at your charge level (LV1 if not charged) | L | P0 | 🧪 #111 |
| CTL-31 | Ball dropping to you, no charge | J = header / volley at goal, K = nod it on / header pass | C✓ (v0.9.8) | P0 | ✅ (on today's keys) |
| CTL-32 | Charged header / volley | hold the kick key as the ball comes, let go as it arrives (timing = power) | L ask, C✓ | P1 | ✅ |
| CTL-33 | **Your keeper**, shot coming | SPACE = special save at LV1; each later tap before the ball arrives = one more level, one more bar, up to LV3 | L OK | P0 | 🧪 #111 |
| CTL-34 | Aerial battle (MASH) | one press = one bar step; key repeat / holding never count | L ("mash on space") | P0 | ✅ (on the shoot key today) |
| CTL-35 | Set pieces | WASD aim; K along the grass, L cross, hold + release J = shot; corners: L in-swinger, I out-swinger, hold K driven (PR #105 draft), J short | L ("bind it to the proper wasd buttons") | P1 | 🔁 PR #105; needs re-mapping to the new layout (Q-CTL-4) |
| CTL-36 | Leave a set piece 12 s → the computer takes it | — | C✓ | P2 | ✅ |
| CTL-37 | Keeper with the ball in his hands | K throws / rolls, L punts; after 6 s he plays it himself | C✓ | P1 | ✅ |

## D. System keys (today, carry over unless Luca says otherwise)

| ID | Key | Does | Status |
| --- | --- | --- | --- |
| CTL-40 | ENTER / ESC / P | pause menu | ✅ |
| CTL-41 | M, - / = | mute, volume | ✅ |
| CTL-42 | H | hide the set-piece help | ✅ |
| CTL-43 | F | INSTA FLAG (last 8 s + note to Bug Watch) | ✅ |
| CTL-44 | T | meter look BASIC / WILD | ✅ |
| CTL-45 | E (Lab / tutorial) | reset the ball / the step | ✅ |
| CTL-46 | Gamepad: A pass, B shoot, X through, Y lob, RB sprint, LB special, Start pause | needs the new layout (Q-CTL-5) | ✅ old map |

⚠ **Key clashes to sort in the rebuild:** C is today's arrow-set lob and the coin-toss / skip key in places; SPACE is
today a shoot key and the MASH key; F is INSTA FLAG; E resets in the Lab. Check every scene (penalties, cup, tutorial,
watch) for old letters.

## E. The OLD layout (v0.20.0, for reference only)

Both sets always work today; the KEYS pick on the start screen only changes the hints.

| Action | WASD set | Arrows set (do NOT use when talking to Luca) |
| --- | --- | --- |
| move | WASD | arrows |
| pass / challenge | J | Z |
| shoot / slide (hold = power) | K or SPACE | X |
| lob / cross / switch | L | C |
| through ball | I | V |
| sprint | left SHIFT | SHIFT |
| special (spends EVERY full bar) | U | B |
| special dribble | O | N |

- **2 players on one keyboard** (`#2p`, v0.15.2): home = arrows set, away = WASD set. In PR #111 `#2p` stays on these
  classic keys; a second new-layout set for the away player is still open: ❓ Q-CTL-6.
- **Penalties** (own scene): aim with move keys, hold shoot for power, let go; keeper holds a side; BASE / WILD /
  TECHNICAL styles; mind games on the lob key; chip on the lob key. → MO-20.
