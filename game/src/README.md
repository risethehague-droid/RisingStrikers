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
| 12 | `specials.js` | Special shots and special saves: meters, power, rigs, cut scenes, keeper guard | Gameplay & AI, Art |
| 13 | `matchflow.js` | Referee and the laws: kick-off, restarts, set pieces, fouls, cards, injuries, subs, halves, extra time, coin toss | Gameplay & AI |
| 14 | `penalties.js` | The penalty scene and shoot-outs | Gameplay & AI |
| 15 | `cup.js` | Cup (tournament) mode: table, fixtures, simulated games, trophy ceremony | Design & Vision (friend) |
| 16 | `ui.js` | Menus and HUD: setup, pause, team sheet, walk-out intro, Rami commentary, radar, on-screen feedback | Design & Vision (friend), Lead |
| 17 | `replay.js` | Replays, highlights, BUG WATCH (the game checking its own footage) | QA overnight |
| 18 | `watch.js` | WATCH mode: the computer plays both sides, pause, speed 0.5x-4x, N marks a moment, the review at full time | QA, Lead |
| 19 | `resume.js` | RESUME: the snapshot of your match (saved while you play, cleared at full time) and putting it back from the start screen | Lead |
| 20 | `boot.js` | Starts the game on page load (canvas size, scenes) | Lead |
