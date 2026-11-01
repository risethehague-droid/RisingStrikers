#!/usr/bin/env bash
# EXPERIMENTAL: the game build that gets every new change as soon as it's built (Luca, 31 Oct: "implement all new
# changes on a new version you can select in game called experimental ... the card for me to ok implementation ONLY for
# the main game version, for experimental it is updated live each time something new is added").
#
#   bash tools/experimental.sh add <branch> [...]   merge feature branch(es) + latest main into `experimental`, push
#   bash tools/experimental.sh sync                 just bring the latest main in, push
#   bash tools/experimental.sh build <out dir>      build the experimental page (game + its own Test Lab) to publish
#
# After `add` / `sync`: `build`, then publish with the Artifact tool (Luca's account):
#   url https://claude.ai/artifact/CjKrd5vBnAt8E6HRma29mZ, file_path <out>/index.html, root <out>, files = <out>/files.json,
#   no icon, no capabilities. Then refresh the public link's /experimental/:
#   gh api -X POST repos/risethehague-droid/RisingStrikers/actions/workflows/public-game.yml/dispatches -f ref=main
#   (if that is refused, it catches up by itself within 2 hours: the workflow also runs on a schedule)
# and post Luca one line (what's new in experimental). No HQ card: the card is only for promoting a PR into main.
# Never merge `experimental` into main: PRs go into main on their own, after Luca's OK. LAN (t-044) stays out until
# Luca has retested it on two PCs.
set -euo pipefail
fetch() { for b in "$@"; do git fetch -q origin "+$b:refs/remotes/origin/$b"; done; }   # (explicit refspecs: works in shallow / single-branch clones)
cd "$(dirname "$0")/.."
G="git -c user.name=Claude -c user.email=noreply@anthropic.com"
# The docs every PR touches (CLAUDE.md, docs/taskmaster.md, game/src/README.md, CHANGELOG, README.md) clash on almost every
# merge (step 2 thread, 31 Oct). Those get both sides kept; the file table is renumbered and the file count fixed. A clash
# in any other file still stops, for a person-sized look.
domerge() {
  $G merge -q --no-ff --no-edit "$@" && return 0
  local left; left=$(git diff --name-only --diff-filter=U | grep -vxE 'CLAUDE.md|docs/taskmaster.md|game/src/README.md|docs/CHANGELOG.txt|README.md' || true)
  [ -z "$left" ] || { echo "CLASH in $left: fix it by hand, commit, push"; return 1; }
  python3 -I - <<'PY'
import re, subprocess, glob
for p in subprocess.run(['git', 'diff', '--name-only', '--diff-filter=U'], capture_output=True, text=True).stdout.split():
    out, side = [], None
    for l in open(p).read().split('\n'):
        if l.startswith('<<<<<<< ') or l.startswith('======= ') or l == '=======' or l.startswith('>>>>>>> '): continue
        out.append(l)
    seen, res = set(), []
    for l in out:                                        # both sides kept; a line that came in twice is kept once
        m = re.match(r'\| \d+ \| `([^`]+)`', l)
        k = ('row', m.group(1)) if m else ('count', 0) if 'files under `game/src/`' in l else None
        if k and k in seen: continue
        if k: seen.add(k)
        res.append(l)
    n = 0
    for i, l in enumerate(res):
        if p == 'game/src/README.md' and re.match(r'\| \d+ \| `', l): n += 1; res[i] = re.sub(r'^\| \d+ \|', f'| {n} |', l)
        if 'files under `game/src/`' in l: res[i] = re.sub(r'into \d+ files', f"into {len(glob.glob('game/src/*.js'))} files", l)
    open(p, 'w').write('\n'.join(res))
PY
  git add -A && $G commit -q --no-edit && echo "(doc clashes merged: both sides kept)"
}
cmd=${1:-}; shift || true
prep() {
  [ -z "$(git status --porcelain)" ] || { echo "uncommitted changes: stop"; exit 1; }
  fetch main experimental
  git checkout -q -B experimental origin/experimental
  domerge origin/main || { echo "(bringing main in; keep channel.js = 'experimental')"; exit 1; }
}
case "$cmd" in
  add)
    prep
    for b in "$@"; do
      fetch "$b"
      domerge "origin/$b" -m "experimental: + $b" || exit 1
      echo "merged $b"
    done
    git push -q origin experimental; echo "pushed experimental $(git rev-parse --short HEAD)";;
  sync) prep; git push -q origin experimental; echo "pushed experimental $(git rev-parse --short HEAD)";;
  build)
    OUT=${1:?out dir}; fetch main experimental
    bash tools/prpreview.sh origin/experimental "$OUT" 0 "EXPERIMENTAL"
    sed -i 's#<title>HC2 PR \#0 preview</title>#<title>HC2 Experimental</title>#' "$OUT/index.html"
    grep -q "HC2_CHANNEL = 'experimental'" "$OUT/channel.js" || { echo "channel.js isn't 'experimental': stop"; exit 1; }
    echo "built $OUT (publish it, see the header)";;
  *) sed -n 2,18p "$0"; exit 1;;
esac
