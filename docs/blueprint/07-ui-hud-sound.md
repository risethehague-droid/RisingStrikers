# 07 · UI, HUD, camera, replays, commentary, sound

Legend: see [README](README.md).

## A. HUD

| ID | Item | What it must do | Whose | Pri | Status |
| --- | --- | --- | --- | --- | --- |
| UI-01 | **SP meter** | one per team (top left / right), 3 bars, each its power colour (fire / electric / aura); full = RISE UP! (flaming letters + arrow) | C✓ (v0.7.0) | P0 | ✅ |
| UI-02 | Meter look BASIC / WILD (T) | BASIC = clean 3-cell gauge; WILD = PixelLab frame, flames grow per level | C✓ | P2 | ✅ |
| UI-03 | **Charge level display**: "CHARGE LVn" over the player + a bottom line with what each key does; "SPACE: CHARGE YOUR SPECIAL" hint when you could | L (CTL-23), C✓ | P0 | 🧪 PR #111 |
| UI-04 | **Radar** | ball = white dot, black edge, pulsing pink ring; away human gets a yellow box | C✓ | P0 | ✅ |
| UI-05 | **The "you" arrow** | 3x, outlined, pops on a switch, red / blue by kit; optional direction pointer | C✓ | P0 | ✅ |
| UI-06 | **Pass preview** | thin cyan ring + arrow on the mate a pass goes to right now (edge arrow if off screen); never flickers | C✓ | P0 | ✅ |
| UI-07 | **Set-piece help** | FIFA-style panel above the radar listing YOUR set-piece keys until it's taken; H hides | L ("like in fifa") | P1 | ✅ (keys must follow the new layout) |
| UI-08 | Clock, score, added-time board | | C✓ | P0 | ✅ |
| UI-09 | "NOT ENOUGH BARS" flash | C✓ | P0 | 🧪 PR #111 |

## B. Pop-ups and names

| ID | Item | Whose | Pri | Status |
| --- | --- | --- | --- | --- |
| UI-20 | **Move CALL**: every special's name (shots, passes, dribbles ...) pops up near the top in its element's lettering (fire burns, thunder zaps, rainbow cycles, shadow glitches) | L ("generate cool text (names) that matches the vibe / element / theme") | P0 | ✅ |
| UI-21 | Keeper special saves get the pop-up + sound too; **normal saves get no name** | L (31 Oct 14:21, then 1 Nov 22:17) | P0 | ✅ |
| UI-22 | "N PASSES!" chain, GUARD BROKEN!, OFFSIDE!, SMOTHERED!, SO CLOSE! and other short calls | C✓ | P2 | ✅ |

## C. Camera

| ID | Item | Whose | Pri | Status |
| --- | --- | --- | --- | --- |
| UI-25 | 1152 × 648 view, fills the screen | L (wider camera) | P0 | ✅ |
| UI-26 | CLOSE / MEDIUM (0.75) / WIDE (0.5), live in options | F (#1) | P1 | ✅ |
| UI-27 | Camera rides up with the ball after a save and with lobs; no chasing jolt on lobs | C✓ | P1 | ✅ |
| UI-28 | Aerial battle close-up 1.35x → MV-55 | C✓ | P2 | ✅ |

## D. Rami (commentator)

| ID | Item | Whose | Pri | Status |
| --- | --- | --- | --- | --- |
| UI-30 | Rami talks bottom-left (types the line, pulls its face): kick-off, goals (bullet header, "FROM 28 METRES!"), saves, posts, misses, fouls, cards, corners, penalties, half / full time, specials, net lines, banter | L (picked the ZINE Rami) | P1 | ✅ |

## E. Replays

| ID | Item | Whose | Pri | Status |
| --- | --- | --- | --- | --- |
| UI-40 | **No replays while the ball is live**; big saves / near misses / posts go to HIGHLIGHTS | L (24 Oct 06:24) | P0 | ✅ |
| UI-41 | Goal replay after every goal (slow-mo, TV zoom, TV wipe in / out, any key skips) | C✓ | P0 | ✅ |
| UI-42 | Foul replays for card fouls and penalties | C✓ | P2 | ✅ |
| UI-43 | Pause: REPLAY LAST 10 S, LAST GOAL, HIGHLIGHTS, **WHOLE MATCH** (scrub, [ / ] 10 s jumps, G next goal, END, goals ticked) | L ask | P1 | ✅ |
| UI-44 | Replay player: play / pause, 1x / 0.5x / 0.25x, frame step, scrub, every effect redrawn | C✓ | P1 | ✅ |
| UI-45 | Every replay records the net, specials, keeper hands (anything new must record too) | C✓ | P0 | ✅ |

## F. Menus

| ID | Item | Whose | Pri | Status |
| --- | --- | --- | --- | --- |
| UI-50 | **Start menu**: one centred column: CONTINUE, PLAY, HAGUE CUP, TRAINING, PENALTY BATTLE, WATCH, TUTORIAL; OPTIONS pop-up; HOW TO PLAY; ⇄ MAIN / EXPERIMENTAL | L ask (31 Oct) | P0 | ✅ |
| UI-51 | **Pause menu** (one panel): RESUME, TEAM + SUBS, THE MOVES, OPTIONS, replays, BUG WATCH, LEAVE GAME (says whether the match is kept) | L ask | P0 | ✅ |
| UI-52 | Demo match behind the menu after 8 s idle (handy at the tournament stand) | C✓ | P2 | ✅ |
| UI-53 | HOW TO PLAY / THE MOVES must show the NEW layout in WASD + right-hand words | L (HOUSE-03) | P0 | 📝 |

## G. Sound

| ID | Item | Whose | Pri | Status |
| --- | --- | --- | --- | --- |
| UI-60 | 16-bit style effects made in code: kicks, passes, headers, catches, whistle, net, post clang, crowd (murmur, ooh, roar) | C✓ | P0 | ✅ |
| UI-61 | **Every special its own element sound** + keeper saves, 1 V 1 heartbeat, corners, replays, menu | L ("develop a sound effect for all new moves and interactions") | P1 | ✅ |
| UI-62 | Charge LV1 / 2 / 3 rising sounds | C✓ (CTL-23) | P0 | 🧪 PR #111 |
| UI-63 | SOUND volume OFF / 25-100%, M mute, - / =; SOUND BOARD in the Lab | C✓ | P1 | ✅ |
| UI-64 | Real recorded sounds instead of synth? (offered 22 Oct, never answered) | — | P? | ❓ Q-UI-1 |
| UI-65 | Music | nobody has asked for in-game music yet (the promo has a chiptune) | — | ❓ Q-UI-2 |
