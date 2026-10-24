# Rising Strikers: HC2 Football

A 16-bit pixel football game for the **Help Out Hague Cup II**, a football event in The Hague.
Six teams (IS, IRO, USCS, LUC, THUAS, AUC), four difficulty levels (Easy, Normal, Hard, Rise Warrior), special moves,
keeper saves, chips, penalties, Rami on commentary. Plain JavaScript on Phaser 3.90, all art from PixelLab and Aseprite.

Current version: **v0.10.4** (see `docs/CHANGELOG.txt`).

## Play it locally

```
cd game
python3 -m http.server 8765
```

- Game: http://localhost:8765/index.html
- Test Lab (every move and situation on a button): http://localhost:8765/lab.html

The official game and Test Lab are pages on Luca's claude.ai account; the taskmaster publishes them from `main`.

## What's where

| Path | What |
| --- | --- |
| `CLAUDE.md` | House rules for every Claude session |
| `README-friend-sessions.md` | Start here for sessions on the co-designer's account |
| `game/` | The game: `index.html`, `lab.html` (Test Lab), `test.html` (test harness page), the code in `src/` (19 files by area, see `game/src/README.md`), `lab.js`, `assets/`, `assets-lo/` (phone copies) |
| `tools/` | Tests (smoke, Lab groups, difficulty checks) and builds (kits from PixelLab exports, phone assets, stadium tiles). See `tools/README.md` |
| `docs/lanes/` | One brief per lane: scope, files, tests, what done means |
| `docs/pixellab/` | PixelLab notes: what worked, tutorial notes |
| `docs/CHANGELOG.txt` | Every version, newest first |
| `art/stadiums/` | Stadium sources: the active stadium's layers (OG, Het Kleine Loo), the Aseprite files |
| `art/style/` | The HC2 palette and the master style frame |
| `design/` | Design notes, pitches and decisions |

## How work gets in

Card on the Taskboard → branch → pull request → *Needs OK* → Luca's OK → the taskmaster merges and publishes.
Details: the **HC2 Team Setup** doc (https://claude.ai/artifact/8QEZs4UX4XEGYGWYdqPssF) and `CLAUDE.md`.
