# 01 · Controls

Legend: see [README](README.md). **Always describe keys as left hand WASD + right-hand action keys** (HOUSE-03).

## A. The NEW layout (the final version's controls)

Luca, 3 Nov 2026 12:05 + 12:07: "there should be a whole change ... Everyone plays it with the left hand for movement."
Build thread: "New button mechanic". Status of the whole layout: 📝 **decided by Luca, plan v3 waiting for his OK to
build** (3 Nov 12:10). Today's game still uses layout B below.

### Left hand

| ID | Key | Does | Whose | Pri | Status |
| --- | --- | --- | --- | --- | --- |
| CTL-01 | **W A S D** | move / aim | L | P0 | ✅ (already the WASD set) |
| CTL-02 | **SHIFT** | sprint (uses energy) | L | P0 | ✅ |
| CTL-03 | **C** | switch player | L | P0 | 📝 (today switching rides on the lob key) |
| CTL-04 | **SPACE** | charge your special (CTL-20) | L | P0 | 📝 (today SPACE = a shoot key) |

### Right hand

| ID | Key | Attacking | Defending | Whose | Pri | Status |
| --- | --- | --- | --- | --- | --- | --- |
| CTL-05 | **J** | kick / shot (tap = tap kick, hold = power) | slide tackle | L (defence: C✓ draft) | P0 | 📝 |
| CTL-06 | **K** | pass | standing challenge | L (defence: C✓ draft) | P0 | 📝 |
| CTL-07 | **I** | through ball | — | L | P0 | 📝 |
| CTL-08 | **L** | lob / cross | — | L | P0 | 📝 |

- CTL-09 · **B and N are removed** ("a whole change"). U and O go with them. — L · P0 · 📝
- CTL-10 · Defending on K (challenge) and J (slide) is the button thread's proposal; Luca hasn't objected, not yet
  confirmed in words. — ❓ see Q-CTL-1.

### Special dribble (both get built, Luca picks after playing)

| ID | Option | Whose | Pri | Status |
| --- | --- | --- | --- | --- |
| CTL-11 | **A · always dribble**: while charged, running at a defender does the special dribble by itself | L ("just put always dribble for now") | P0 | 📝 |
| CTL-12 | **B · double-tap SHIFT** = the dribble move | L ("I think that would be cleaner ... add both and we'll try them both out") | P0 | 📝 |

## B. SPACE charge levels (the core new mechanic)

**Luca's design (L), 3 Nov 12:10, his words:**
> "pressing the space bar more than once can charge the character to lvl 2 if possible and 3 time to lvl 3 to use a
> lvl 2 and 3 skill if you so choose, but it doesnt insta use your strongest shot ... you can preserve your energy and
> perhaps use like a level one to bait a keeper and then use a level two for a guaranteed goal ... it's about giving
> control of how much ... power you want to use for your shots, for your specials, for your passes ... each stage is
> clearly more, like is distinct, clear, more of an upgrade of energy, like charging up. But keep it clean."

| ID | Rule | Whose | Pri | Status |
| --- | --- | --- | --- | --- |
| CTL-20 | Tap SPACE **1× = LV1, 2× = LV2, 3× = LV3** | L | P0 | 📝 |
| CTL-21 | **You choose** the level. It NEVER auto-spends your strongest (the old SPECIAL key spent every full bar) | L | P0 | 📝 |
| CTL-22 | Saving bars is a tactic: LV1 to bait the keeper, LV2 later for the goal | L | P0 | 📝 |
| CTL-23 | Each level looks **clearly stronger, distinct, more aura, but clean** | L | P0 | 📝 |
| CTL-24 | Works for shots, specials, passes "and whatnot": the charge level feeds whichever action you press next | L | P0 | 📝 |
| CTL-25 | Taps must come within **0.4 s** of each other | C✓ draft | P0 | ❓ Q-CTL-2 |
| CTL-26 | You can't charge past the bars you have; an extra tap flashes **NOT ENOUGH BARS** | C draft | P0 | ❓ Q-CTL-2 |
| CTL-27 | Each level fills in ~**0.3 s**; an action pressed early fires when the fill completes | C draft | P0 | ❓ Q-CTL-2 |
| CTL-28 | The charge lasts **3 s** after the last tap, then fades and **spends nothing**; no cancel key | C draft | P0 | ❓ Q-CTL-2 |
| CTL-29 | **Bars are spent only when a special fires; LVn costs n bars** | C draft | P0 | ❓ Q-CTL-2 |

What each level does per key (draft, plan v3):

| Key | LV1 (1 bar) | LV2 (2 bars) | LV3 (3 bars) |
| --- | --- | --- | --- |
| J kick | BLAZE SHOT (MV-20) | THUNDER SHOT (MV-21) | RISING PHOENIX (MV-22) |
| K pass | TORNADO DRILL (MV-30) | **none yet** → plays LV1, costs 1 | **none yet** → plays LV1, costs 1 |
| I through | BURROW BLAST (MV-31) | none yet → LV1 | none yet → LV1 |
| L lob | ANGEL GLIDE (MV-32) | none yet → LV1 | none yet → LV1 |
| dribble | special dribble (MV-15) | ? | ? |

- **LV2 / LV3 passes, through balls, lobs and dribbles don't exist.** Luca's words imply they should ("for your
  passes"), but only Luca designs them: ❓ Q-CTL-3. Claude must not invent them (HOUSE-02).

Charge LOOK (placeholder until the new rig, C draft, P0, 📝): LV1 a small ring at the feet · LV2 adds a taller aura
with sparks · LV3 adds a full glow, a pulse and a screen-edge tint · each level its own rising sound. Final look comes
with the rig (RIG-40).

References (C✓): Mario Strikers charge-up, Inazuma Eleven / Captain Tsubasa aura, fighting-game meter levels where
the player chooses what to spend.

## C. Context keys

| ID | Situation | Key | Whose | Pri | Status |
| --- | --- | --- | --- | --- | --- |
| CTL-30 | **Ball dropping to you** | SPACE = special volley / header (at your charge level; LV1 if not charged — C draft) | L | P0 | 📝 |
| CTL-31 | Ball dropping to you, no charge | J = header / volley at goal, K = nod it on / header pass | C✓ (v0.9.8) | P0 | ✅ (on today's keys) |
| CTL-32 | Charged header / volley | hold the kick key as the ball comes, let go as it arrives (timing = power) | L ask, C✓ | P1 | ✅ |
| CTL-33 | **Your keeper**, shot coming | SPACE = special save at LV1, extra taps before the ball arrives raise it (C draft) | L (keeper counter) | P0 | 📝 |
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

- **2 players on one keyboard** (`#2p`, v0.15.2): home = arrows set, away = WASD set. The new layout needs a second
  set for the away player: ❓ Q-CTL-6.
- **Penalties** (own scene): aim with move keys, hold shoot for power, let go; keeper holds a side; BASE / WILD /
  TECHNICAL styles; mind games on the lob key; chip on the lob key. → MO-20.
