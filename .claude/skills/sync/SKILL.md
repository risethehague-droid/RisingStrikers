---
name: sync
description: Sync this branch with main on GitHub (brings in everything the taskmaster merged), run the smoke test, then republish your preview page. Use when someone says "sync", "/sync", "update from main", or the session-start sync reported a clash.
---

# /sync: bring in the latest main

Every session already does a quick sync when it starts or resumes (`tools/sync.sh --start`, from `.claude/settings.json`).
This command does the full version.

1. **Run** `bash tools/sync.sh` [cloud]. It fetches `main`, merges it into this branch, prints what came in and runs
   the smoke test. It never pushes and never changes `main` on GitHub.
2. **If it says "uncommitted work":** commit the work in progress on this branch (a short message is fine), then run
   step 1 again.
3. **If it says "clash":** merge by hand: `git merge origin/main`, then resolve each conflicted file.
   - Keep both sides' intent.
   - Never drop the other side's change to make yours fit.
   - Never touch a file outside your lane to make it fit.
   - Unsure about a conflict? Run `git merge --abort` and note the clash in the pull request; the taskmaster resolves it.
   - Resolved it? Commit, then run `bash tools/sync.sh` again so the smoke test runs on the merged result.
4. **If the smoke test failed:** say which level failed and the last line of the error. Don't open or update a pull
   request until it passes.
5. **Push** the branch (never `main`).
6. **Republish the preview** if this branch has one (`HC2 Football · preview · <topic>`): publish `game/index.html`
   with the game files to the same page. About 300 files and a publish takes at most 255, so it's two publishes.
   Skip this on Luca's account: the taskmaster publishes the official game itself.
7. **Report** in three lines or fewer:
   - what came in from main (version, headline)
   - whether it merged cleanly
   - the smoke test result
