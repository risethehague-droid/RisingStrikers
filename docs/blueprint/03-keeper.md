# 03 · The keeper

Legend: see [README](README.md). Keeper AI was Luca's "top priority" (23 Oct 14:56: "include walking up etc when
needed") and "very broken gk logic ... you could just walk around it and score" (25 Oct 02:58, urgent). The final
keeper must never be walkable-round.

## A. Positioning (keeper.js)

| ID | Behaviour | What it must do | Whose | Pri | Status | Anim |
| --- | --- | --- | --- | --- | --- | --- |
| GK-01 | **ANGLE** | on the line that halves the angle between ball and posts; ~2 m off his line for a ball 6 m away, ~5 m at 25-30 m | L ask, C✓ (coaching sources) | P0 | ✅ | shuffle, kback |
| GK-02 | **UP / SWEEPER** | ball far away: walks up to the top of his box and beyond (~18 m behind his last man, max 21 m) | L ("walking up") | P0 | ✅ | walk |
| GK-03 | **SET** | an attacker on the ball within 25 m: still, ready stance | C✓ | P0 | ✅ | kset |
| GK-04 | **CLOSE the 1v1** | starts closing at 32 m, out to ~14 m on the angle once the striker is within ~20 m, attacks the ball from 9.5 m inside 19 m, never past 15.5 m | L ("approach from further range ... easy to run around the goalie") | P0 | ✅ | run |
| GK-05 | **BLOCK + SMOTHER** | steps up to ~1.4 m in front of the ball, mirrors every sideways move, dives through the ball at your feet: SMOTHERED / BLOCKED / beaten if you cut late. Smother only in his box | L (25 Oct urgent) | P0 | ✅ | ksmother, kstar, kcollapse |
| GK-06 | **Stays home on a 2-v-keeper** (square pass for a tap-in is no longer a sure goal) | L (role-AI "keeper stops leaving the goal open") | P0 | ✅ | — |
| GK-07 | **BACK** | a lob over him while he's up: runs back | C✓ | P1 | ✅ | kback |
| GK-08 | Faces the ball while he tracks (side-step, backpedal), gets up after a dive | C✓ | P0 | ✅ | kgetup |
| GK-09 | **Reads a lob by level** (Easy 0.35 s ... Rise 0.15 s) before he claims / sweeps / backs off; claims crosses only when he beats the attacker | C✓ (Luca's picks) | P1 | ✅ | claim |
| GK-10 | **Keeper or sweeper keeper per team** (IS, THUAS sweepers) | C✓ proposal (role-AI 6b) | P? | ❓ PR #99 waiting OK (Q-GK-1) | — |
| GK-11 | Goes up for a last-minute corner when a goal down | C✓ | P2 | ✅ | — |
| GK-12 | Back-pass rule: a team-mate's pass / throw back = feet only; under pressure he clears long | C✓ (IFAB Law 12) | P1 | ✅ | kick |

## B. Normal saves

| ID | Rule | Whose | Pri | Status | Anim |
| --- | --- | --- | --- | --- | --- |
| GK-15 | No dice: he reads the shot (reaction + small misread), then sets, side-steps or dives; only what meets his body / gloves is saved; caught if soft, else parried | C✓ (v0.4.1) | P0 | ✅ | dive*, catch |
| GK-16 | Save picked by where the ball crosses him: stand / low / mid / high dive / leap / tip / punch; tips and parries make corners (~5 a match) | C✓ (v0.11.0) | P0 | ✅ | diveL/R/Up/Down, ktip, punch |
| GK-17 | **Situational save looks**: SKY SNATCH (one hand on a dropping lob), FLYING STRETCH, TOP-CORNER STRETCH, LOW SCRAMBLE, STARFISH WALL; more flair by level (NORMAL dust, HARD after-images + a little reach, RISE a beat of slow-mo) | L ask ("lob = one-handed leap catch, far side = dynamic dive, fancier at higher levels"), C✓ details | P1 | ✅ | needs own anims |
| GK-18 | **Normal saves get NO names on screen** | L (1 Nov 22:17) | P0 | ✅ | — |
| GK-19 | **Dives go SIDEWAYS** with a ~20° lean into the dive, ball in the gloves ("the dive animation is angled the wrong way") | L | P0 | ✅ | dive* |
| GK-20 | **Keeper guard**: power shots and specials that hit him wear a hidden guard; when it breaks the shot goes through (GUARD BROKEN!). "A tired keeper parries a power shot" (#97): Luca said NO | C✓; ✖ #97 | P1 | ✅ / ✖ | — |
| GK-21 | **No-bars catch**: a keeper with no bars can stop a special ONLY an LV1, ~1 in 8, and even then it never goes in (bounces out for a corner or off the post) | L (his note on t-045) | P1 | 🔁 PR #71 back in review | — |

## C. Special saves (Luca 23 Oct)

| ID | Rule | Whose | Pri | Status | Anim |
| --- | --- | --- | --- | --- | --- |
| GK-25 | LV1 **IRON WALL**, LV2 **THUNDER GLOVE**, LV3 **RISING SHIELD** | L (uses "Iron Wall"), C✓ names | P0 | ✅ | kleap, kblock, kdivecatch, ktip |
| GK-26 | Special save v a NORMAL shot on target: always stops it (holds it) | L ("Teams should be able to use their Iron Wall-like special abilities to also block normal shots") | P0 | ✅ | — |
| GK-27 | **Only keepers** have defensive specials | L | P0 | ✅ | — |
| GK-28 | **Covers the whole goal** once it's on (lobbed, late, wide: he dashes in his aura); he glows while it's on | L (31 Oct) | P0 | ✅ | aura |
| GK-29 | **No full-screen cut-in for saves** (it blocked the screen): a slow-mo beat + a small tag | L | P0 | ✅ | — |
| GK-30 | **The CLASH** (special shot v special save): ball holds on his gloves ~0.6 s, sparks, slow-mo, "POWER AGAINST POWER", then by power: HELD / BOUNCES OFF / HANDS BLOWN AWAY (goal) / THE BODY (blasted in with it). Same level = saved, higher = saved, lower = a chance ((save/shot)³) | L ("the keeper can cover the whole goal ... but a special shot can still go through the hands if it's stronger, or bounce off") | P0 | ✅ | blasted |
| GK-31 | **Keeper COUNTER**: press = the save CHARGES (ring at his feet closes in as the ball comes), FIRES at the contact with a quick pop-up: SAVED / PUSHED AWAY / BEATEN (letters blown off) | L (1 Nov 21:46) | P0 | ✅ v0.20.0 | — |
| GK-32 | **Names pop up ONLY for special saves** (the ones that spend a bar) | L (1 Nov 22:17) | P0 | ✅ | — |
| GK-33 | Your keeper: SPACE = the save at LV1, each later tap = one more level / bar, up to LV3 | L OK 3 Nov | P0 | 🧪 PR #111 (CTL-33) | — |
| GK-34 | The computer's keeper answers your special by difficulty (easy 30% ... rise 75%) | C✓ (fair finishing) | P0 | ✅ | — |
| GK-35 | A save that's ready is cancelled the moment anyone else gets the ball; not for penalties | C✓ | P1 | ✅ | — |

## D. Hands and distribution

| ID | Rule | Whose | Pri | Status | Anim |
| --- | --- | --- | --- | --- | --- |
| GK-40 | **The ball stays in his gloves** from the contact frame through landing and get-up, every frame | L ("dive with the hands to grab the ball, also be able to hold it in his hands while he moves, keep it simple and smooth") | P0 | ✅ | kdivecatch, catch |
| GK-41 | **Carry**: walks / jogs with it (kcarry, kcarryrun); the computer walks a calm catch out ~4 m / ~2 s before throwing | L | P0 | ✅ | kcarry, kcarryrun |
| GK-42 | Nobody can challenge a keeper holding the ball; opponents back off; he stays in his box, lets go after 6 s | C✓ | P0 | ✅ | — |
| GK-43 | Distribution: underarm roll (short), overarm throw, drop-kick punt (long), foot clearance in any direction | C✓ | P1 | ✅ | roll, throw, punt, kick |
| GK-44 | Claims high balls with a jumping claim; shouts and organises at set pieces; roars after a big save; punches the ground when beaten | C✓ (PixelLab batches) | P2 | ✅ | claim, korg, kroar, beaten |
