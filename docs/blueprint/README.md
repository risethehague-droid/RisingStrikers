# HC2 Football: the MASTER BLUEPRINT

**What this is.** The single reference for the FINAL version of HC2. Luca, 3 Nov 2026: "we're working on a base rig
of animation, so we're going to redo everything here. So make sure you keep this in a sort of file in which it becomes
the master blueprint reference ... rank every T and I crossed on this, so that we make sure we don't forget anything
when we want to do the final version."

The rebuild = a new base animation rig, then everything is re-animated and re-wired. This folder says WHAT the game
must do. The code in `game/` (v0.20.0) says HOW it does it today. When they disagree, the blueprint wins for the
rebuild, and Luca wins over the blueprint.

Mined from (3 Nov 2026): v0.20.0 code, `docs/CHANGELOG.txt` v0.1 → v0.20.0, 157 HQ cards (incl. Luca's send-back
notes), open PRs #68 #71 #80 #99 #102 #105 #109, project memory, the "New button mechanic" thread.

## Read it in this order

| # | File | What's in it |
| --- | --- | --- |
| 0 | **this page** | the legend, the TOP 25, how to update |
| 1 | [01-controls.md](01-controls.md) | every key, the NEW layout, the SPACE charge levels 1-3 |
| 2 | [02-moves.md](02-moves.md) | passes, shots, lobs, dribbles, headers / volleys, tackles, every special |
| 3 | [03-keeper.md](03-keeper.md) | keeper positioning, saves, special saves, the clash, distribution |
| 4 | [04-rules-match-flow.md](04-rules-match-flow.md) | laws, set pieces, restarts, fouls, cards, time, endings |
| 5 | [05-ai.md](05-ai.md) | team AI, roles, formations, difficulty |
| 6 | [06-animation-rig.md](06-animation-rig.md) | **the re-animation checklist**: every animation and effect to rebuild |
| 7 | [07-ui-hud-sound.md](07-ui-hud-sound.md) | menus, HUD, pop-ups, camera, replays, Rami, sound |
| 8 | [08-modes-tools.md](08-modes-tools.md) | modes, options, cup, penalties, tutorial, Test Lab, QA, multiplayer, phone |
| 9 | [09-open-questions.md](09-open-questions.md) | every open question for Luca, in one list |
| 10 | [10-claude-ideas.md](10-claude-ideas.md) | Claude-made ideas Luca never asked for (kept apart, NOT the plan) |

## The legend (every table uses it)

**Whose design** (Luca 1 Nov: "I don't want you to get confused between what I've made and what you've made")

| Mark | Means |
| --- | --- |
| **L** | Luca's design: he asked for it or decided it (his words quoted where we have them) |
| **F** | the co-designer's design (Luca OK'd it to go live) |
| **C✓** | Claude worked out the detail (numbers, names, the how) for an ask of Luca's, and Luca OK'd it on HQ / by merge |
| **C?** | Claude-made and NOT asked for: never in the main tables, only in [10-claude-ideas.md](10-claude-ideas.md) |

**Priority for the final version**

| Mark | Means |
| --- | --- |
| **P0** | core: the game isn't HC2 without it. Rebuild first. |
| **P1** | part of the final game. Rebuild right after P0. |
| **P2** | polish / later / nice to have |
| **P?** | Luca hasn't ranked it yet (it sits in 09-open-questions) |

**Status today (v0.20.0, 3 Nov 2026)**

| Mark | Means |
| --- | --- |
| ✅ | live in the MAIN game |
| 🧪 | built, but Test Lab / EXPERIMENTAL only (not in main matches) |
| 🔁 | sent back by Luca, being reworked |
| 📝 | decided, not built yet |
| ❓ | open question, needs Luca |
| ⏸ | paused by Luca |
| ✖ | Luca said no / dropped (kept so nobody re-adds it) |

Every item has an **ID** (`CTL-03`, `MV-01` ...). Cards, PRs and threads should quote the ID.

## TOP 25: never forget these in the final version

The P0 spine, in build order. Each line links to its full entry.

1. **CTL-01..10** New controls: left hand WASD + SHIFT sprint + C switch + SPACE charge; right hand J kick, K pass, I through, L lob. B and N are gone. ([01](01-controls.md))
2. **CTL-20..29** SPACE charge LEVELS: tap 1 / 2 / 3 times = LV1 / LV2 / LV3, you choose, it never auto-uses your strongest; each level clearly bigger but clean. ([01](01-controls.md))
3. **CTL-30** Ball dropping to you + SPACE = special volley / header. ([01](01-controls.md))
4. **RIG-01** Every move leaves the boot on its CONTACT frame (hit-stop, flash, camera kick). ([06](06-animation-rig.md))
5. **RIG-02** Art from PixelLab / Aseprite only, prompted "with no ball anywhere in the picture"; the game draws the ball. ([06](06-animation-rig.md))
6. **MV-01..08** Pass to the man the stick points at, through ball, lob (AUTO / RING), tap kick vs held power shot. ([02](02-moves.md))
7. **MV-20..24** Special shots LV1 / LV2 / LV3: power through blockers (1 / 2 / 5 men), range by level. ([02](02-moves.md))
8. **MV-30..32** LV1 special passes TORNADO DRILL, BURROW BLAST, ANGEL GLIDE. ([02](02-moves.md))
9. **MV-40..44** Headers, volleys, charged headers / volleys, overhead, diving header, chest trap. ([02](02-moves.md))
10. **MV-50..53** Aerial battle: only in their box, MASH SPACE-style, only on a true 50/50. ([02](02-moves.md))
11. **MV-60..63** Tackles: standing challenge + slide, real slides, get-up, miss costs time. ([02](02-moves.md))
12. **GK-01..09** Keeper positioning: angle, sweeper up, set, close the 1v1 from 32 m, smother; never "walk round him". ([03](03-keeper.md))
13. **GK-20..27** Special saves (IRON WALL / THUNDER GLOVE / RISING SHIELD), cover the whole goal, the special-v-special CLASH. ([03](03-keeper.md))
14. **GK-28** Keeper COUNTER: press = charge, fires at the gloves, quick pop-up. Names ONLY on special saves. ([03](03-keeper.md))
15. **GK-30..34** Keeper hands: ball locked in the gloves, carry, walk it out, throw / roll / punt. ([03](03-keeper.md))
16. **RU-01..** Laws: offside, back-pass, fouls, cards, injuries, added time, the ref waits for the attack. ([04](04-rules-match-flow.md))
17. **RU-20..** Set pieces with a RHYTHM: everyone reorganises, nobody teleports in view, corner blackout cut, goal kick cut. ([04](04-rules-match-flow.md))
18. **AI-01..** Team AI: one presses, one covers, back four as one line, keeper stays home, roles + formations. ([05](05-ai.md))
19. **AI-30..** Difficulty Easy / Normal / Hard / Rise Warrior, fair finishing (Hard is beatable). ([05](05-ai.md))
20. **UI-01..** HUD: SP meter (3 bars, level colours), radar, the "you" arrow, pass preview, set-piece help (H). ([07](07-ui-hud-sound.md))
21. **UI-20..** Move CALL: every special's name pops up in its element's lettering, with its own sound. ([07](07-ui-hud-sound.md))
22. **UI-40..** Replays: goal replay, last 10 s, whole match, highlights; NEVER while the ball is live. ([07](07-ui-hud-sound.md))
23. **MO-01..** Modes: PLAY, HAGUE CUP, TRAINING, PENALTY BATTLE, WATCH, TUTORIAL, CONTINUE; CLASSIC / ARCADE pace. ([08](08-modes-tools.md))
24. **MO-40..** Test Lab FREE PLAY: every move on a button, tagged IN THE GAME / LAB ONLY. Keep it working through the rebuild. ([08](08-modes-tools.md))
25. **HOUSE-01..** The house rules that shape every move: think like football, PC first, only build what Luca asked. ([below](#house-rules-that-shape-the-design))

## House rules that shape the design

| ID | Rule | Whose | Source |
| --- | --- | --- | --- |
| HOUSE-01 | **Think like football.** Check real football + the reference games (FIFA / EA FC, PES, Sensible Soccer; for specials Inazuma Eleven, Captain Tsubasa, Mario Strikers). Build the whole flow around a rule, not just the rule. | L | 25 Oct 14:59 ("offside got called, nobody reorganised") |
| HOUSE-02 | **Only build what Luca asked.** Extras = a suggestion (card / one line), never shipped. Unused Claude ideas → [10-claude-ideas.md](10-claude-ideas.md). | L | 1 Nov 22:17 |
| HOUSE-03 | **Controls talk:** always WASD left hand + right-hand action keys. Never X / Z / V / C. | L | 3 Nov 12:05 |
| HOUSE-04 | **PC first.** The phone version follows the PC design (it was paused; un-paused 3 Nov for a plan only). | L | CLAUDE.md, 3 Nov 11:48 |
| HOUSE-05 | **Art:** PixelLab / Aseprite only, no sprites drawn in code; kits carry only the team emblem; boards show sponsors + venue only. | L | CLAUDE.md |
| HOUSE-06 | **Every move gets a FREE PLAY button and an HQ clip.** | L | 29 Oct, 30 Oct 22:38 |
| HOUSE-07 | **New work goes to EXPERIMENTAL first**, main only after Luca's OK on its HQ card. | L | 31 Oct 13:31 |
| HOUSE-08 | **Nobody gets stuck** (Luca has ADHD): tutorials count after 3 tries, skips everywhere, short text. | L | tutorial, 31 Oct |
| HOUSE-09 | **Play it as a new player before handing it over**, catch the basic traps. | L | 1 Nov 22:04 |
| HOUSE-10 | **Same seed = same match.** Refactors and look-only changes must keep seeded matches identical (that's how the rebuild proves it didn't break play). | C✓ | since v0.9.5 |

## How to keep this up to date (every thread, every PR)

1. **A PR that adds, changes or removes a mechanic** edits the matching line here in the same PR: status, priority,
   the PR number. No new mechanic without an ID.
2. **Luca decides something** (chat, HQ note, send-back): write it into the line with the date and his words, and
   mark it **L**. If it answers a question in 09, move it out of 09.
3. **Claude has an idea** Luca didn't ask for: it goes in [10-claude-ideas.md](10-claude-ideas.md) only.
4. **IDs never change and are never reused.** A dropped item stays, marked ✖, so nobody adds it back by mistake.
5. **Numbers** (speeds, timings, costs) live in the code (`core.js` and the file named in the line); the blueprint
   names the knob, so the two can't drift. Write a number here only when it IS the design (e.g. "LV1 = 1 bar").
6. Keep lines short. One line per item. Details go in the PR or the design doc it links.

Last full mine: 3 Nov 2026, v0.20.0 (main `1c38658`).
