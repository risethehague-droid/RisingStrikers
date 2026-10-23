# Lane brief: Gameplay & AI

**Account:** Luca's. **Branch:** `gameplay/<topic>`. **Card lane:** Gameplay & AI.

## Scope
How the game plays: ball physics (passes, shots, lobs, the chip, bounces, weather), players (movement, sprint,
stamina, bursts, tackles), team AI (shape, pressing, marking, support runs, the carrier's choices), keepers
(positioning, saves, dives, special saves), specials (meters, power levels, clashes) and the four difficulty levels.

## Files you may touch
The code areas for ball, player, team AI, keeper, specials and difficulty: `game/src/` once the split lands (see
`game/src/README.md`), `game/game.js` before it. Test Lab tests in `game/lab.js` for your feature. Not: menus, HUD,
stadium drawing, art, `assets/`.

## Tests to run
- `node tools/smoke.js`: must end `errors []`.
- Test Lab groups that touch your change: `GROUP=P` (ball physics), `M`, `D` (movement), `T` (tackles), `A` (air
  balls), `K` / `KH` / `C` / `GK` (keepers), `YS` (shooting), `CH` (chip), `PW` / `SM` (specials), `PK` (penalties).
  `GROUP=<id> node tools/grp.js`; add `REP=3` for anything random.
- Difficulty or AI-strength changes:
  - `node tools/proxy093.js run 60` and `node tools/proxy093.js def 60`: a scripted "you" attacking and defending at every level
  - `LEVELS=easy,normal,hard,rise node tools/train093.js probe 0 40 300`: computer-v-computer strength (score S against the old Normal)
  - The order must stay Easy < Normal < Hard < Rise Warrior.
- Pure refactors: the same seeded matches give the same scores before and after.

## Done means
The card's ask works in a real match and in its Test Lab test, the tests above pass, the PR says what to click to see it.

## Watch out for
- `AI_MODE` 'classic' ignores most difficulty settings; test on the NEW AI.
- Self-play can't see the human-only rules (`DIFF_YOU`): check those with `tools/proxy093.js`.
- Self-play scores are noisy: use 40+ matches before believing a difference under about 0.5.
