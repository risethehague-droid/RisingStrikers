# 06 · The new base rig: re-animation checklist

Legend: see [README](README.md). Luca, 3 Nov: "we're working on a base rig of animation, so we're going to redo
everything ... you're going to reanimate and wire everything after." This page lists EVERY animation and effect the
game uses today (from `game/assets/manifest.json`, v0.20.0) so none is lost. Tick a line when its new-rig version is in.

## A. Rig rules (apply to every animation)

| ID | Rule | Whose | Pri | Status |
| --- | --- | --- | --- | --- |
| RIG-01 | **Contact frame**: every kick / pass / header / save names the frame where boot / head / glove meets the ball; the ball leaves on it. Hit-stop, ball flash, camera kick, impact burst on strikes | C✓ (v0.7.0) | P0 | ✅ today, redo per move |
| RIG-02 | **PixelLab / Aseprite only**; prompt "with no ball anywhere in the picture"; the game draws its own ball. Never give other games' images to PixelLab | L (house rule) | P0 | ✅ |
| RIG-03 | **8 directions**: E, NE, N, NW, W, SW, S, SE (PixelLab makes S / SE / E / NE / N; the W side is mirrored) | C✓ | P0 | ✅ |
| RIG-04 | **One base character, every kit painted on it** (6 teams + LUC alt + 6 keeper kits); kit carries only the emblem | L | P0 | ✅ |
| RIG-05 | Per-move data: origin (feet point), feetY, frame size, contact frame, carry point (keeper gloves `GK_HANDS`) | C✓ | P0 | ✅ |
| RIG-06 | Every idle / walk / run picture stays up ≥ 0.11 s (no flicker), facing has hysteresis (not for YOUR player) | C✓ (QA) | P0 | ✅ |
| RIG-07 | Walk vs run vs sprint chosen by speed, no flicking between run and sprint at top speed | C✓ | P0 | ✅ |
| RIG-08 | Where art shows the ball in hands / on chest (catch, throw, trap) the game hides its own ball | C✓ | P1 | ✅ |
| RIG-09 | Every new / redone move: a FREE PLAY button + an HQ clip (HOUSE-06) | L | P0 | ✅ rule |
| RIG-10 | Rough rigs (frames moved / turned / squashed by code) are placeholders only, until the real PixelLab move | L (23 Oct 13:35) | P0 | — |

## B. Outfield player (every kit)

| ID | Anim | Used for | Pri | Done on new rig |
| --- | --- | --- | --- | --- |
| RIG-20 | idle, walk, run, sprint (looping, leans in, dust puffs) | moving | P0 | ☐ |
| RIG-21 | touch (first touch), trap (chest / thigh) | receiving | P0 | ☐ |
| RIG-22 | pass (side-foot), kick (full strike), shot (power), tap (tap kick) | MV-01..06 | P0 | ☐ |
| RIG-23 | chip | MV-04 | P1 | ☐ |
| RIG-24 | jump, header, header2 (power) | MV-40..42 | P0 | ☐ |
| RIG-25 | volley (side), volley2 (whipped), volleyf (front), dheader, dheader2 (flat-out) | MV-41 | P0 | ☐ |
| RIG-26 | bicycle (overhead) | MV-43 | P1 | ☐ |
| RIG-27 | tackle (standing), slide2 (the real slide), slideup (get up from it), slide (old) | MV-60, MV-61 | P0 | ☐ |
| RIG-28 | jockey | MV-62 | P1 | ☐ |
| RIG-29 | hit, fall, getup, hurt (shin), protest | contact, fouls | P0 | ☐ |
| RIG-30 | sdribble (special dribble) + RAINBOW FLICK + SHADOW STEP looks | MV-15..17 | P0 / P1 | ☐ |
| RIG-31 | sp1 (BLAZE), sp2 (THUNDER), super / air3 (RISING PHOENIX) | MV-20..22 | P0 | ☐ |
| RIG-32 | air1 (BLAZING SCISSOR), air2 (THUNDER OVERHEAD), air3 (PHOENIX DIVE) | MV-29a-c | P0 | ☐ |
| RIG-33 | cpass (TORNADO DRILL), cthru (BURROW BLAST), clob (ANGEL GLIDE) | MV-30..32 | P0 | ☐ |
| RIG-34 | combo, combo2 (joint strike), meteor, tide, cyclone (team signature shots) | MV-35..37 | P1 / P2 | ☐ |
| RIG-35 | throwin, throwinhold (N, S) | RU-09 | P0 | ☐ |
| RIG-36 | hips (waiting at set pieces), signal (corner taker's arm) | RU-20 | P2 | ☐ |
| RIG-37 | celebrate, celeb2, celeb3, celeb4 (knee slide, aeroplane, sky point), chance (hands on head), dejected, applaud | RU-67, RU-68 | P2 | ☐ |
| RIG-38 | penalty set: pwait, pplace, penalty, ppower, pchip, pmiss, pcele (N) | MO-20 | P1 | ☐ |
| RIG-39 | trophy, trophyup (taller 128 × 186 frames, cup stays gold on every kit) | MO-10 | P2 | ☐ |
| RIG-40 | **Charge aura LV1 / LV2 / LV3** (new): distinct, clearly bigger each level, clean | CTL-23 | P0 | ☐ (📝 design) |

## C. Keeper (every keeper kit)

| ID | Anim | Used for | Pri | Done on new rig |
| --- | --- | --- | --- | --- |
| RIG-50 | idle, walk, run, shuffle (side-step), kback (backpedal), kset (ready) | GK-01..08 | P0 | ☐ |
| RIG-51 | diveL, diveR, diveUp, diveDown (sideways, ~20° lean), kgetup | GK-15..19 | P0 | ☐ |
| RIG-52 | catch, claim (jumping), punch, ktip | GK-16, GK-44 | P0 | ☐ |
| RIG-53 | ksmother, kstar (starfish), kcollapseUp / Down, kblock | GK-05 | P0 | ☐ |
| RIG-54 | kleap, kdivecatchUp / Down (ball in gloves) | GK-17, GK-25 | P0 | ☐ |
| RIG-55 | situational saves: SKY SNATCH, FLYING STRETCH, TOP-CORNER, LOW SCRAMBLE, STARFISH (today drawn on existing frames) | GK-17 | P1 | ☐ |
| RIG-56 | kcarry, kcarryrun (ball in hands) | GK-41 | P0 | ☐ |
| RIG-57 | roll, throw, punt, gkick, kick (foot clearance) | GK-43 | P0 | ☐ |
| RIG-58 | blasted (knocked flat by a special) | GK-30, MV-23 | P0 | ☐ |
| RIG-59 | korg (organises), kroar, beaten / pkdefeat, pkcele | GK-44 | P2 | ☐ |
| RIG-60 | penalty keeper: pready, pdistract (mind games), pdive, pdiveH (high) | MO-20 | P1 | ☐ |
| RIG-61 | special-save auras + counter ring + SAVED / PUSHED AWAY / BEATEN pop-ups | GK-28..32 | P0 | ☐ |

## D. Referee and others

| ID | Anim / art | Used for | Pri | Done |
| --- | --- | --- | --- | --- |
| RIG-70 | Referee: idle, walk, run, whistle, card (yellow), cardR (red); keeps 12-16 m from the ball | RU-02..03 | P1 | ☐ |
| RIG-71 | **Rami** (64 px ZINE commentator, Aseprite): talks bottom-left, pulls each line's face | UI-30 | P1 | ☐ |
| RIG-72 | Coin (RISE / RISE ARROW), trophy, medals, confetti, fireworks, streamers, laurel, crown, gold boot, cards | RU-63, MO-10 | P2 | ☐ |
| RIG-73 | Ball: 16 / 24 px white ball with a rolling animation, shadow | MV-80 | P0 | ☐ |
| RIG-74 | Net (PixelLab net on a mesh) | MV-83 | P1 | ☐ |
| RIG-75 | Stadium tiles, three arenas, sky, weather, boards (sponsors + venue only) | RU-60 | P1 | ☐ (arenas are placeholders) |

## E. Effects (fx sprites today)

| ID | Effects | Used for | Pri | Done |
| --- | --- | --- | --- | --- |
| RIG-80 | flame, flame2, flameSmall, flameTwin, flameBlue, flamePurple, bolt, sparks, sparkle, orb, ring | specials, auras, meter | P0 | ☐ |
| RIG-81 | impact, impactBig, whoosh, dust | strikes, sprint | P0 | ☐ |
| RIG-82 | arrowbang, arrowbang2 (RISE UP! flaming arrow-exclamation) | full meter | P1 | ☐ |
| RIG-83 | Move-call lettering per element (fire, thunder, shadow, rainbow ...) | UI-20 | P1 | ☐ |
| RIG-84 | 1 V 1: team-colour auras, manga speed-line vignette OR RISE arrows | MO-41 | P1 | ☐ |
| RIG-85 | WILD meter frame (UI Creator), cut-in bands | UI-02 | P1 | ☐ |

## F. Known art debt to fix in the rebuild

- Kick N / NE and pass E / NE: crumbs of a PixelLab ball left in some frames.
- Diving header: lands on his front, the get-up starts on his back.
- N chip uses NE frames (PixelLab drew a ball into the N feet).
- The IS badge on every kit (each team's own emblem missing).
- Celebration only faces the camera in the oldest set; throw-ins only S + N.
- Optional touch-up card: chip NE contact frame (art-chip-ne).
