#!/usr/bin/env bash
# Build the "HC2 PR #N preview" page for a pull request: the PR's branch as one page Luca can open from its Needs OK
# card on HC2 HQ (Luca + the co-designer, 24 Oct). The link's end picks what opens:
#   …#play        the game (also with no ending)
#   …#lab-CH1     the Test Lab, at test CH1 (any test id, or a group: #lab-CH)
# One page per PR, because a card's buttons must show that PR's code, not whichever PR was published last.
#
#   bash tools/prpreview.sh <branch or commit> <out dir> <PR number> ["PR title"]
#
# Then publish it with the Artifact tool (the taskmaster / the 2-hourly check, Luca's account):
#   file_path <out dir>/index.html, root <out dir>, files = the list in <out dir>/files.json,
#   capabilities {"db": {}, "sample": {"images": true}} on the first publish (omit them later), and the PR page's url
#   from its HQ card (card.preview.page) when it exists. Phones: preview pages are for a computer (no assets-lo/).
set -euo pipefail
REF=${1:?branch or commit}; OUT=${2:?out dir}; NUM=${3:?PR number}; TITLE=${4:-}
cd "$(dirname "$0")/.."
SHA=$(git rev-parse --short "$REF")
rm -rf "$OUT"; mkdir -p "$OUT"; TMP=$(mktemp -d)
# the preview is the PR merged onto today's main: what would go live if Luca says OK (and it has main's Lab features,
# like opening a test from the link). If they clash, it falls back to the branch as it is and says so.
git fetch -q origin main 2>/dev/null || true
git worktree add -q --detach "$TMP/wt" origin/main
if git -C "$TMP/wt" -c user.name=preview -c user.email=preview@local merge -q --no-edit "$SHA" >/dev/null 2>&1; then BASE="PR + main"
else git -C "$TMP/wt" merge --abort 2>/dev/null || true; git -C "$TMP/wt" checkout -q --detach "$SHA"; BASE="the branch as it is (it clashes with main)"; fi
G="$TMP/wt/game"
cp -r "$G/src" "$G/lab.js" "$G/assets" "$OUT/"
[ -f "$G/channel.js" ] && cp "$G/channel.js" "$OUT/"                           # MAIN / EXPERIMENTAL (channel.js: the version switch)
find "$OUT/assets" -type f -name '*-pre*' -delete                               # old manifests / sheets the game never loads
find "$OUT" -type f -name '*.md' -delete                                         # notes (src/README.md) aren't part of the page
python3 -I - "$G" "$OUT" "$NUM" "$SHA" "$TITLE" "$BASE" <<'PY'
import sys, json, os, html
g, out, num, sha, title, base = sys.argv[1:7]
game = open(os.path.join(g, 'index.html')).read(); lab = open(os.path.join(g, 'lab.html')).read()
js = lambda s: json.dumps(s).replace('</', '<\\/')                      # safe inside a <script>
label = f'PR #{num}' + (f' · {title}' if title else '')
page = f'''<title>HC2 PR #{num} preview</title>
<script>
// HC2 PR preview ({html.escape(label)}, {sha}, {base}; built by tools/prpreview.sh): the end of the link picks the page.
// #lab-<test> opens the Test Lab at that test, anything else the game. Both are written in here, so the page needs
// no second address (artifact links only pass a plain #anchor through).
(function () {{
  var h = (location.hash || '').slice(1), lab = /^lab/i.test(h);
  window.HC2_PREVIEW = {{ pr: {num}, sha: '{sha}', page: lab ? 'lab' : 'game' }};
  document.write(lab ? {js(lab)} : {js(game)});
  window.addEventListener('hashchange', function () {{ if (/^lab/i.test((location.hash || '').slice(1)) !== lab) location.reload(); }});
}})();
</script>
'''
open(os.path.join(out, 'index.html'), 'w').write(page)
files = sorted(os.path.relpath(os.path.join(d, f), out) for d, _, fs in os.walk(out) for f in fs if f != 'index.html')
json.dump(files, open(os.path.join(out, 'files.json'), 'w'))
print(f'built {out}: {label} @ {sha} ({base}), {len(files)} files + index.html')
PY
git worktree remove --force "$TMP/wt"; rm -rf "$TMP"
