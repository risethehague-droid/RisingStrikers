---
name: publish
description: Taskmaster only (Luca's main chat) - publish the official HC2 game and Test Lab from main after a merge. Use when the taskmaster has merged into main and says "publish", "/publish", "make it live".
---

# /publish: put `main` live on Luca's pages

Only the taskmaster, only from `main`, only after Luca's OK on what's being published (CLAUDE.md). Workers publish
their own **preview** pages instead, never these.

1. **Be on the latest `main`** [cloud]: `git fetch origin && git checkout main && git merge --ff-only origin/main`,
   with a clean working tree.
2. **Last check:** serve `game/` and run `node tools/smoke.js` (must end `errors []`).
3. **Publish the game** with the Artifact tool:
   - `url`: https://claude.ai/artifact/AD1rvV13DR3nvQPzfsRojf
   - `file_path`: `<repo>/game/index.html`, `root`: `<repo>/game`
   - `files`: every changed file under its own path, e.g. `{"src/core.js": "src/core.js", ...}`. Files left out stay
     as they are. A file that no longer exists goes in as `null`.
   - After a change to `assets/`: those files too (a publish takes at most 255 files; split it if needed).
4. **Publish the Test Lab** the same way: `url` https://claude.ai/artifact/Goa4b8PepGxbqv9877pPCV, `file_path`
   `<repo>/game/lab.html`, the same `root`, the changed `src/*.js` plus `lab.js` (and `lab/*` if it exists).
5. **Leave the capabilities alone:** omit `capabilities` so each page keeps its database (and the Lab its `sample`).
6. **Tell Luca** in one line what went live and the version. Close the card.

To see what's published: Artifact `list` with `scope: "files"` and the page's `url`.
