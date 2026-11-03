# 08 · Modes, options, training, tools, multiplayer, platforms

Legend: see [README](README.md).

## A. Modes

| ID | Mode | What it must do | Whose | Pri | Status |
| --- | --- | --- | --- | --- | --- |
| MO-01 | **PLAY** | a full match v the computer with the match flow in [04](04-rules-match-flow.md) | L | P0 | ✅ |
| MO-02 | **CONTINUE** | resume your last unfinished match (score, clock, half, settings, shirts, energy, cards, subs, meters, stats); kicks off for the side that had it; cleared at full time | L ("make it so i can resume a game") | P1 | ✅ |
| MO-03 | **CLASSIC / ARCADE pace** | → RU-40..45 | F, L OK | P0 | ✅ |
| MO-10 | **HAGUE CUP** | six teams, two groups of three, your games played, the rest simulated, group winners meet in the FINAL (ET then pens), tables, champion screen, on-pitch trophy lift with fireworks | C✓ (Help Out Hague Cup) | P1 | ✅ |
| MO-20 | **PENALTIES / PENALTY BATTLE** | own camera behind the taker; BASE / WILD / TECHNICAL styles; keeper mind games, high dive, STRETCH; 1V1 battle for two people (5 each then sudden death); time-out picks random | C✓ | P1 | ✅ (keys → new layout, Q-CTL-6) |
| MO-30 | **WATCH** | computer v computer; pause, speed 0.5x-4x, N marks a moment; review at full time (BUG / FINE / NOT SURE + note) to the database | L ("a 1v1 computer game that simulates games ... manual so i can pause etc plus manually comment") | P1 | ✅ |
| MO-31 | **TUTORIAL** | PART 1 basics, PART 2 advanced; one action per step with a success check, SHOW ME, skip / back / menu, RESET (E), "Stuck?" nudge, only the step's keys work | L ("a simple tutorial ... basics and then the advanced stuff before you play, optional to skip or return back to") | P0 | ✅ (must be rewritten for the new keys + charge levels) |
| MO-32 | **TRAINING** | opens the Test Lab FREE PLAY | L | P1 | ✅ |
| MO-35 | **STREET 5s** (5 v 5, walls) | L | P2 | ⏸ PR #102, paused by Luca 1 Nov until he says |

## B. Test Lab (the dev + practice ground)

| ID | Item | Whose | Pri | Status |
| --- | --- | --- | --- | --- |
| MO-40 | **FREE PLAY**: every move on a button that sets the moment up and plays it for real, tagged IN THE GAME / LAB ONLY | L ("the test lab must be completely fixed ... it's missing moves") | P0 | ✅ (rebuild every button on the new rig) |
| MO-41 | **1 V 1 moment**: through on goal with only the keeper left, slow-mo from 8 m, team-colour auras, slight dim, speed lines (or RISE arrows) | L (30 Oct 23:22, v2-v4 notes: "no full dark", "start a bit later") | P1 | ✅ in matches since v0.20.0; lines vs arrows ❓ Q-MO-1 |
| MO-42 | **Practice scenarios**: 20 drills + BUILD YOUR OWN | L ask | P2 | ✅ |
| MO-43 | **CHANGE HOW IT FEELS** knobs (player, ball, lobs, shots, keeper) + SUGGEST THIS FOR THE GAME | L ("add the sliders ... to the classic version") | P2 | ✅ |
| MO-44 | Test groups (GK, KP, KC, RL, AB, ...) and link-to-a-test (`#CH1`) | C✓ | P1 | ✅ (they are the rebuild's regression tests) |

## C. QA built into the game

| ID | Item | Whose | Pri | Status |
| --- | --- | --- | --- | --- |
| MO-50 | **BUG WATCH**: ~25 rules checked every frame; trips keep a clip (4 s + 1.5 s) for review | L ("the ai keeps checking the footage played and checks for errors, pulls them up, we review") | P1 | ✅ |
| MO-51 | **INSTA FLAG** (F): last 8 s + your note; Luca's flags wake a fixer task | L | P1 | ✅ |
| MO-52 | Nightly QA soak (12 seeded matches), seeded matches replay exactly | C✓ | P1 | ✅ |

## D. Options (start OPTIONS + pause OPTIONS)

Difficulty, pace, camera, team AI NEW / CLASSIC, formation, offside ON / OFF, lob aim AUTO / RING, pointer ON / OFF,
meter look, sound volume, Bug Watch ON / OFF, keys hint set. Each must survive the rebuild (P1, ✅). New: KEYS option
"NEW: SPACE CHARGE" (PR #111, 🧪 EXPERIMENTAL).

## E. Multiplayer and sharing

| ID | Item | Whose | Pri | Status |
| --- | --- | --- | --- | --- |
| MO-60 | **LAN 2-PC play** (HOST / JOIN, host snapshots): Luca's 2-PC test was "terrible, lost immediately"; fix pushed, waiting his retest | L ("no controllers, drop couch 2P, go real LAN") | P1 | 🧪 PR #68 held |
| MO-61 | Two humans in one match (one keyboard, `#2p`) | C✓ step | P2 | ✅ (keys ❓ Q-CTL-6) |
| MO-62 | **Online friendly by room code → public lobby** (Cloudflare Workers matchmaker) | L idea, OK'd as a future idea | P2 | 📝 after LAN |
| MO-63 | **Public game link** for friends (GitHub Pages, updates with every merge) | L | P1 | ✅ |
| MO-64 | MAIN / EXPERIMENTAL versions → HOUSE-07 | L | P0 | ✅ |

## F. Platforms

| ID | Item | Whose | Pri | Status |
| --- | --- | --- | --- | --- |
| MO-70 | **PC first** (keyboard; gamepad map exists) | L | P0 | ✅ |
| MO-71 | **Phone version**: pitch left, button strip right; 5 labelled buttons SHOOT / PASS / THROUGH / LOB / SPECIAL whose words change (defending SLIDE / TACKLE / SWITCH, charged SUPER ...); sprint = push the stick to the edge; camera ~15% closer; HUD 1.4x. Plan + mockup only | L (3 Nov 11:48: "make every button say what it does") | P2 | 📝 plan waiting his OK; must follow the new charge levels |
| MO-72 | Phones load half-size textures; SAFE MODE after a crash; turn-sideways screen | C✓ | P2 | ✅ |
| MO-73 | iPhone in the Claude app ("This browser isn't supported") | — | P2 | ⏸ parked by Luca |
