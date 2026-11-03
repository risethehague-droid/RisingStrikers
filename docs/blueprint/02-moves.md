# 02 · Moves: passing, shooting, dribbling, the air, tackling, specials

Legend: see [README](README.md). Keys are named in the NEW layout (J kick, K pass, I through, L lob, SPACE charge).
"Anim" = the animation it needs on the new rig (full list in [06](06-animation-rig.md)).

## A. On the ball

| ID | Move | What it must do | Whose | Pri | Status | Anim |
| --- | --- | --- | --- | --- | --- | --- |
| MV-01 | **Ground pass** (K) | goes to the team-mate the stick points at (strong pick, no flicker between two); the receiver runs onto it himself; the ball is pulled to the boot so a pass never misses it | C✓ (v0.7.0) | P0 | ✅ | pass |
| MV-02 | **Through ball** (I) | into space ahead of the runner | C✓ | P0 | ✅ | pass |
| MV-03 | **Lob** (L) | AUTO (default): to the mate the arrow points at, landing a step ahead; RING: a landing ring you steer. Hold = power lob 12-50 m. Climbs over the men in between (3.6-8 m). Lob from wide in their third = a real cross to the first runner | C✓ (v0.8.5, v0.12.0) + F (v0.9.8, #57) | P0 | ✅ | pass / kick |
| MV-04 | **Chip** | L in their box facing goal = chip (fast, hard dip). The computer chips too, by level, rarely | L ("computer chips too and pixellab first", 23 Oct) | P1 | ✅ (QA: the AI stopped chipping since v0.19, fix OK'd: qa-flag-20261103-2) | chip |
| MV-05 | **Tap kick** | J tapped (let go < 0.15 s) = low quick stab that dies by ~15 m | L OK'd (q-tap-kick) | P0 | ✅ | tap |
| MV-06 | **Power shot** | J held; past 3/4 = longer freeze, harder shake, deep thump, hot trail. Too much = over the bar | C✓ (v0.7.0) | P0 | ✅ | shot / kick |
| MV-07 | Shots can be **blocked** by a defender in the line | | C✓ | P1 | ✅ | hit |
| MV-08 | **First touch / trap** | chest / thigh trap takes the ball into his run, turned the way you hold | F (#49) | P1 | ✅ | trap, touch |
| MV-09 | **Lob plan B, steps 2-3** (spin, floated / driven lob, chip on LOB + SHOOT, keeper backpedal + tip over) | Luca picked "B, in steps" 24 Oct; step 1 shipped (v0.10.3), steps 2-3 not built | L | P2 | ❓ Q-MV-1 (still wanted?) | — |

## B. Dribbling

| ID | Move | What it must do | Whose | Pri | Status | Anim |
| --- | --- | --- | --- | --- | --- | --- |
| MV-10 | **Dribble** | ball rides just ahead of the boot, touched in rhythm with the stride, smooth arcs; sprint pushes it further; sprinting does NOT protect the ball | C✓ (v0.8.1) + F (#57) | P0 | ✅ | run, sprint |
| MV-11 | Shielding + stepping round a man in the way | | C✓ (#20) | P1 | ✅ | run |
| MV-15 | **Special dribble** (1 bar): short slow-mo, after-images, bursts 2.5-4 m past the man, he's left spinning ~1 s; the computer uses it too (max 1 / 25 s) | F (arcade-specials.md, ARCADE) | P0 | ✅ ARCADE; new trigger = charged + SHIFT at a defender (CTL-11, 🧪 #111) | sdribble |
| MV-16 | **RAINBOW FLICK** (rainbow trail on the ball), used with a man square in front | L ask, 31 Oct | P0 | 🧪 the charged-SHIFT dribble in PR #111 (1 bar) | needs own anim |
| MV-17 | **SHADOW STEP**: he ends up BEHIND the man, dark shadow with faded purple | L ("more like he ends up behind the guy, make the shadow darker add some faded purple") | P0 | 🧪 the charged-SHIFT dribble in PR #111 (1 bar) | needs own anim |

## C. Special shots (power system, Luca 23 Oct 04:09)

| ID | Move | What it must do | Whose | Pri | Status | Anim |
| --- | --- | --- | --- | --- | --- | --- |
| MV-20 | **LV1 BLAZE SHOT** (fire) | close range only (fades past ~22 m); goes through 1 blocker | L system, C✓ name | P0 | ✅ | sp1 |
| MV-21 | **LV2 THUNDER SHOT** (electric) | from their half; through 2 | L system, C✓ name | P0 | ✅ | sp2 |
| MV-22 | **LV3 RISING PHOENIX** (aura) | from anywhere (weaker behind halfway); through 5; crouch, leap, mid-air scissor; rips the net | L system, C✓ name | P0 | ✅ | air3 / super |
| MV-23 | Knock-back | a blasted defender flies, the ball keeps going; a parried LV2 / LV3 knocks the keeper flat | L | P0 | ✅ | hit, fall, blasted |
| MV-24 | A special flies like an energy shot (low drag, flat, skims) within its range; out of range = just a hard shot | C✓ | P0 | ✅ | — |
| MV-25 | **Fair finishing**: an LV3 that beats the keeper goes in (no loop-up); LV3 breaks any un-answered guard | L ("played hard mode, didn't score once") | P0 | ✅ | — |
| MV-26 | Tackled in the wind-up → **the bars are still spent** (refund proposal: Luca said NO) | L | P1 | ✅ / ✖ refund | — |
| MV-27 | In an aerial special's wind-up a standing tackle can't take the ball off his boot | L flag ("lvl 3 aerial shot was completely blocked, that cannot happen") | P0 | ✅ | — |
| MV-28 | Short cut-in for every special shot (no double cut-in with combos) | F (#57) | P1 | ✅ | cut-in art |

### Aerial specials (ball dropping to you + SPACE, CTL-30)

| ID | Move | Whose | Pri | Status | Anim |
| --- | --- | --- | --- | --- | --- |
| MV-29a | LV1 **BLAZING SCISSOR** (leap, lean back, scissor volley) | L ask ("rig 3 cruder new animations for 3 new aerial special shots"), C✓ name | P0 | ✅ rough rig | air1 |
| MV-29b | LV2 **THUNDER OVERHEAD** (back to goal, overhead, lands on his back) | L ask, C✓ name | P0 | ✅ rough rig | air2 |
| MV-29c | LV3 **PHOENIX DIVE** (huge leap, hangs, dives onto it) | L ask, C✓ name | P0 | ✅ rough rig | air3 |
| MV-29d | The ball stops at his boot for the strike; he plants for the strike at a full run (never misses) | C✓ (v0.8.7, #100) | P0 | ✅ | — |
| MV-29e | The "Special Moves" board: Luca to pick A / B final ideas per aerial special / save / cut scene | L | P1 | ❓ Q-MV-2 (q-picks still open) | — |

### Combo + team specials (the co-designer's ARCADE design)

| ID | Move | Whose | Pri | Status | Anim |
| --- | --- | --- | --- | --- | --- |
| MV-35 | **1-2 combo**: you pass, he plays it back first time, SPECIAL as it arrives = joint strike (2 bars: power 170, through 3; 3 bars: 240, through 6) | F | P1 | ✅ ARCADE | combo, combo2 |
| MV-36 | **Lob + volley combo**: mate's lob, SPECIAL as it drops, he flicks it up, you volley | F | P1 | ✅ ARCADE | combo |
| MV-37 | **Team signature moves**: each team's own LV3 / combo / dribble names + colour. Placeholders = theme A (colours) | F, names need Luca's final OK | P2 | ❓ Q-MV-3 | meteor, tide, cyclone, clob ... |
| MV-38 | How combos fit the new SPACE levels | — | P0 | ❓ Q-CTL-3 | — |

## D. Special passes (Luca 30-31 Oct, in matches since v0.20.0)

| ID | Move | What it must do | Whose | Pri | Status | Anim |
| --- | --- | --- | --- | --- | --- | --- |
| MV-30 | **TORNADO DRILL** | charge + K (LV1, 1 bar): the ball's scripted drill trick | L ask, C✓ name/look | P0 | ✅ | cpass |
| MV-31 | **BURROW BLAST** | charge + I (LV1, 1 bar) | L ask, C✓ | P0 | ✅ | cthru |
| MV-32 | **ANGEL GLIDE** | charge + L (LV1, 1 bar) | L ask, C✓ | P0 | ✅ | clob |
| MV-33 | The computer uses them too | C✓ (#101) | P1 | ✅ | — |
| MV-34 | LV2 / LV3 versions of the passes | L (implied, "for your passes") | P? | ❓ Q-CTL-3 | — |

## E. In the air (no special)

| ID | Move | What it must do | Whose | Pri | Status | Anim |
| --- | --- | --- | --- | --- | --- | --- |
| MV-40 | **Header** | ball in the air near you: J = at goal, K = nod on. Press window 0.7 s | C✓ / F (v0.9.8) | P0 | ✅ | header, jump |
| MV-41 | **Power header, volleys, diving headers** | header2, volley (side) / volley2 (whipped) / volleyf (front), dheader / dheader2; every strike leaves on its contact frame | L list 25 Oct, C✓ | P0 | ✅ | header2, volley*, dheader* |
| MV-42 | **Charged header / volley** | hold J as it comes, let go as it arrives: hold = power, timing keeps it (sweet window = on target); a well-timed one gets a white flash + spark + tiny hit-stop, less than a special. Computer charges ~3 in 10 | L list 25 Oct, C✓ | P1 | ✅ | — |
| MV-43 | **Overhead / bicycle kick** | ball above head height near their goal + back to goal (or SHIFT held) | C✓ (v0.5.6, v0.5.9) | P1 | ✅ | bicycle |
| MV-44 | **Lob receives**: one race per high ball; clearly his = uncontested; only a near tie is a duel; a defender must be goal-side to contest | F (#49: "only in very contested receives should there be a button mash") | P0 | ✅ | trap |

## F. Aerial battle (the MASH)

| ID | Rule | Whose | Pri | Status |
| --- | --- | --- | --- | --- |
| MV-50 | **Only in their penalty box**; head height = header v header, waist height = volley v volley | L (25 Oct 19:14) | P0 | ✅ |
| MV-51 | Attacker wins = a 68-108 km/h shot at goal (keeper can save), defender thrown down ~1.4 s; defender wins = cleared ~40 m | L | P0 | ✅ |
| MV-52 | The mash: one press = one bar step, head start = where the bar starts; hit-stop, sparks, thump; "impactful and consistent" | L | P0 | ✅ |
| MV-53 | Outside the box: a quick duel, no mash. ARCADE: MASH duels on the grass too | C✓ / F | P1 | ✅ |
| MV-54 | **Jostling** for a high ball (strikers fight for the spot; mash only on a true 50/50) | F (#109). Luca sent back: "they scramble way too much, keep em more static" | P1 | 🔁 PR #109 |
| MV-55 | Camera eases in to 1.35x on the pair during a battle (picture only, no slow-mo) | C✓ (t-042) | P2 | ✅ |

## G. Tackling and defending

| ID | Move | What it must do | Whose | Pri | Status | Anim |
| --- | --- | --- | --- | --- | --- | --- |
| MV-60 | **Standing challenge** (K) | close, in front or side; a won challenge stays won; from front best, side less, behind least; a missed one = 0.6 s off balance | C✓ (v0.8.0-v0.12.0) | P0 | ✅ | tackle |
| MV-61 | **Slide** (J) | in the direction you push, aims where the ball will be, really slides (3.6 m), gets up after; head-on = block tackle; from behind = foul; missed = 1.4 s before he can act, 1.5 s before the next; J on the grass / getting up does nothing | L list 25 Oct, C✓ | P0 | ✅ | slide2, slideup |
| MV-62 | **Jockey**: the defender low and side-on, backing off, goes round onto the goal side | C✓ (v0.8.2) | P1 | ✅ | jockey |
| MV-63 | Standing in the dribbler's path BLOCKS the ball off him | C✓ | P1 | ✅ | — |
| MV-64 | The computer makes recovery slides / lunges (and fouls) | C✓ | P1 | ✅ | — |
| MV-65 | **Defenders have NO special defence** ("Only goalkeepers, no defenders can use defensive special abilities, yet") | L (23 Oct 14:43) | P? | ✅ as is; "yet" → Q-MV-4 | — |

## H. Energy and the SP meter

| ID | Rule | Whose | Pri | Status |
| --- | --- | --- | --- | --- |
| MV-70 | Sprint: short burst at the start, costs energy, can't sprint all game; injured = limps 25-30% slower | C✓ | P0 | ✅ |
| MV-71 | **SP meter**: one per team, 3 bars = LV1 / LV2 / LV3; fills with time (CLASSIC 1.4x, ARCADE 2.0x + extras for big moments) | C✓ / F (#57) | P0 | ✅ |
| MV-72 | Both SP meters on the same level (co-designer's `friend/meter-level`, committed, no PR) | F | P? | ❓ Q-MV-5 |

## I. Ball and goal physics

| ID | Rule | Whose | Pri | Status |
| --- | --- | --- | --- | --- |
| MV-80 | Real bounce numbers (FIFA rebound test), grass grip, a skimming shot keeps ~60% pace; weather: rain skids, snow dies + bounces less | C✓ | P0 | ✅ |
| MV-81 | Lobs reach their real height; the shadow shrinks as it climbs (min 65% opacity); a landing ring stays on the grass until someone touches it | C✓ (Luca's picks) | P0 | ✅ |
| MV-82 | **Goal physics**: round posts + bar with real rebounds, a parry can loop up for a man following in | L OK (q-goal-phys) | P0 | ✅ |
| MV-83 | **Living net**: stretches by the strike (soft 32 cm ... LV2 2 m), ball rolls in it 1-2 s, **LV3 rips through** (hole stays until kick-off), recorded in replays | L OK'd the look | P1 | ✅ |
