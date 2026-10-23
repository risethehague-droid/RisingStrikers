#!/usr/bin/env bash
# Sync this checkout with main on GitHub.
#   bash tools/sync.sh          full sync: bring in main, then run the smoke test (what /sync runs)
#   bash tools/sync.sh --start  quick sync at session start (the SessionStart hook): bring in main, no tests
# It never pushes and never touches main on GitHub. Uncommitted work or a conflict: it stops and says what to do.
cd "${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}" || exit 0
MODE="${1:-full}"
say() { echo "[sync] $*"; }
git rev-parse --git-dir >/dev/null 2>&1 || { say "not a git checkout - nothing to sync"; exit 0; }
BR="$(git rev-parse --abbrev-ref HEAD 2>/dev/null)"
BEFORE="$(git rev-parse HEAD 2>/dev/null)"
if ! git fetch --quiet --depth=1000 origin main 2>/dev/null; then say "couldn't reach GitHub - working on the copy you have"; exit 0; fi
[ "$BR" != "main" ] && git ls-remote --exit-code --heads origin "$BR" >/dev/null 2>&1 && git fetch --quiet --depth=1000 origin "$BR" 2>/dev/null
if [ -z "$(git log --oneline HEAD..origin/main 2>/dev/null | head -1)" ]; then
  say "up to date with main ($(git log -1 --format=%h origin/main))"
else
  if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
    say "main has new changes, but this branch has uncommitted work - not merging."
    say "commit (or stash) your work, then run /sync."
    git log --oneline --no-merges HEAD..origin/main | head -10 | sed 's/^/[sync]   new on main: /'
    exit 0
  fi
  if [ "$BR" = "main" ]; then
    git merge --ff-only --quiet origin/main 2>/dev/null || { say "local main has commits that aren't on GitHub - left as is (only the taskmaster merges into main)"; exit 0; }
  elif ! git merge --no-edit --quiet origin/main >/dev/null 2>&1; then
    FILES="$(git diff --name-only --diff-filter=U | tr '\n' ' ')"
    git merge --abort 2>/dev/null
    say "main has changes that clash with this branch in: ${FILES:-(unrelated history - fetch more with: git fetch --depth=5000 origin main $BR)}"
    say "nothing was changed. Run /sync to resolve it with Claude, or note the clash in your pull request."
    exit 0
  fi
  say "brought in from main:"
  git log --oneline --no-merges "$BEFORE"..HEAD | head -15 | sed 's/^/[sync]   /'
fi
VER="$(grep -ho "GAME_VER = '[^']*'" game/game.js game/src/*.js 2>/dev/null | head -1 | cut -d"'" -f2)"
say "branch: $BR · game version: ${VER:-?} · latest changelog: $(grep -m1 '^HC2 WEB GAME' docs/CHANGELOG.txt 2>/dev/null | cut -c1-90)"
[ "$MODE" = "--start" ] && exit 0
# full mode: the smoke test (a match at all four levels)
if ! node -e "require('playwright')" >/dev/null 2>&1; then
  say "smoke test skipped: Playwright isn't installed (npm i playwright, then npx playwright install chromium)"; exit 0; fi
PORT=8799; python3 -m http.server $PORT --directory game >/dev/null 2>&1 & SRV=$!; sleep 1   # its own port: always tests THIS checkout
OUT="$(PORT=$PORT timeout 600 node tools/smoke.js 2>&1 | tail -1)"; kill "$SRV" 2>/dev/null
case "$OUT" in *"errors []"*) say "smoke test passed: $OUT";; *) say "SMOKE TEST FAILED: $OUT";; esac
