# game/src: the game, split by area

Plain classic scripts (no modules, no build step): they share one global scope and load in this order from
`index.html`, `test.html` and `lab.html`. The `Match` scene is declared in `match.js`; every other file adds its
group of Match methods with `hc2Mix(Match, { ... })` (defined in `core.js`), which is the same as writing them in
the class body. A new file goes into all three pages, after `match.js` if it adds Match methods.

| # | File | What's in it | Lane that usually edits it |
| --- | --- | --- | --- |
| 1 | `core.js` | Constants and tunables, teams, pitch size and projection (metres to pixels: `wx`, `wy`, `scaleAt`), helpers, `GAME_VER`, `hc2Mix` | Lead (touch with care: everyone depends on it) |
| 2 | `io.js` | Sound effects, keyboard / gamepad / touch input, asset loading (Boot + Load scenes, phone textures) | Lead |
| 3 | `player.js` | `Player` (movement, stamina, animation, drawing) and `Team` | Gameplay & AI, Art (new animations) |
| 4 | `match.js` | The `Match` scene shell: create, update, the sim loop, building the teams | Lead |
| 5 | `world.js` | The stadium and pitch drawing (`Stadium`), goals, sky and weather, the per-frame render, ball trail | Stadiums & maps (friend) |
| 6 | `ball.js` | Ball physics (flight, bounce, roll), kicks, passes, shots, lobs, the chip, dribbling, possession | Gameplay & AI |
| 7 | `actions.js` | Human controls, switching player, tackles, slides, headers, bicycle kicks | Gameplay & AI |
| 8 | `teamai.js` | Team AI: roles, shape, pressing, marking, support runs, the computer on the ball, Classic AI | Gameplay & AI |
| 9 | `keeper.js` | Keeper AI: positioning plan, saves, dives, claims, distribution | Gameplay & AI |
| 10 | `difficulty.js` | Difficulty levels: trained traits, knobs, the edges against you (`DIFF_YOU`), `dk` / `dkY` | Gameplay & AI |
| 11 | `brain.js` | The team brain (smarter-ai stage 2): the computer's move list on the ball (`AI_MOVES`: a new move joins with one entry), the match state (score + clock), team styles (`STYLES`, `TEAM_STYLE`), Rise Warrior reading your habits | Gameplay & AI |
| 12 | `roles.js` | Role-based AI (docs/role-ai-plan.md): the role cards (`ROLES`: GK, CB, FB, CDM, CM, CAM, W, WF, CF), the formations (`SHAPES`: 4-4-2, 4-2-3-1, 4-3-3 - roles, kick-off spots, widths, depths; `FORMATION_DEFAULT`, `applyFormation`), `p.role`, the helpers the AI asks (`lineOf`, `isBack`, `isWide`, `homeY`) instead of shirt numbers, the numbers for the back line (`LINE`) and the midfield roles (`MID`), and the forwards (`FWD`: CF kinds advanced / target / poacher per formation slot, `cfKind`, the first-line press), and each team's own card (`TEAM_SHAPE`: its formation and striker kinds, `formationFor`). Loaded after brain.js | Gameplay & AI |
| 13 | `specials.js` | Special shots and special saves: meters, power, rigs, cut scenes, keeper guard | Gameplay & AI, Art |
| 14 | `matchflow.js` | Referee and the laws: kick-off, restarts, set pieces, fouls, cards, injuries, subs, halves, extra time, coin toss | Gameplay & AI |
| 15 | `penalties.js` | The penalty scene and shoot-outs | Gameplay & AI |
| 16 | `cup.js` | Cup (tournament) mode: table, fixtures, simulated games, trophy ceremony | Design & Vision (friend) |
| 17 | `ui.js` | Menus and HUD: setup, pause, team sheet, walk-out intro, Rami commentary, radar, on-screen feedback | Design & Vision (friend), Lead |
| 18 | `replay.js` | Replays, highlights, BUG WATCH (the game checking its own footage) | QA overnight |
| 19 | `watch.js` | WATCH mode: the computer plays both sides, pause, speed 0.5x-4x, N marks a moment, the review at full time | QA, Lead |
| 20 | `resume.js` | RESUME: the snapshot of your match (saved while you play, cleared at full time) and putting it back from the start screen | Lead |
| 21 | `boot.js` | Starts the game on page load (canvas size, scenes) | Lead |
| 22 | `arcadesp.js` | ARCADE specials (the co-designer, 28 Oct): the special dribble, combo specials, team signature names, bigger leaps. Loaded after cup.js, before ui.js; it wraps the moves it needs, CLASSIC untouched | Design & Vision (friend) |
| 23 | `gkstyle.js` | SITUATIONAL SAVES (a preview, `GK_STYLE.on`): the keeper's save gets its look from the moment (one-handed sky snatch, flying stretch, top corner, low scramble, starfish), fancier by level. Loaded right after specials.js; wraps Player.draw / setState / handBall and keeperTouch, draws on the existing PixelLab frames | Gameplay & AI |
| 24 | `movecall.js` | MOVE CALL (Luca, 31 Oct): every special's name pops up near the top in its element's lettering (fire, thunder, shadow, rainbow ...). Loaded after ui.js; it wraps `say`, so a move's own banner call becomes the pop-up. A new move = one line in `MOVE_THEME` | Design & Vision (friend), Gameplay & AI |
| 25 | `sppass.js` | The LV1 SPECIAL PASSES (Luca, 30-31 Oct): TORNADO DRILL, BURROW BLAST, ANGEL GLIDE - SPECIAL + PASS / THROUGH / LOB with a bar (costs 1); the ball's scripted trick and its looks. Loaded after arcadesp.js, before ui.js; Test Lab only for now (CURVE_PASS) | Gameplay & AI |
| 26 | `oneone.js` | The 1 V 1 moment (PREVIEW, 30 Oct): through on goal, only the keeper left - slow-down, team-colour auras, darker pitch. Off unless `ONE_V_ONE.on` (the Lab's FREE PLAY 1 V 1 buttons). Loaded after arcadesp.js; it wraps `sim` and `render` | Gameplay & AI, Lead |
| 27 | `skilldrib.js` | The RAINBOW FLICK and the SHADOW STEP (31 Oct, Test Lab only behind `SKILL_DRIB`): two special dribbles on the special dribble button, picked by position. Loaded after arcadesp.js; it wraps the moves it needs | Gameplay & AI |
| 28 | `movesfx.js` | MOVE SOUNDS (31 Oct): every special's own element sound, keyed by name (`MOVE_SFX`: a new move = one line), the keeper / 1 V 1 / corner / replay / menu sounds, and the SOUND BOARD (a Test Lab button + `game/sounds.html`). Loaded after resume.js, before boot.js (it wraps Match / Player methods) | Lead |
