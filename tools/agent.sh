#!/usr/bin/env bash
# The agents' report folder: the `agents` branch on GitHub. It holds only agents/ (briefs, reports, reviews), never
# game files, and is never merged into main. Reading needs nothing; writing pushes one new file to that branch.
#
#   bash tools/agent.sh status                                  open tasks per agent + reports waiting for review
#   bash tools/agent.sh tasks <agent>                           that agent's briefs with their state, oldest first
#   bash tools/agent.sh show <path>                             print one file, e.g. tasks/worker-l/t-003.md
#   bash tools/agent.sh report <agent> <task> <status> <file>   send a report (status: done | blocked | question | progress)
#   bash tools/agent.sh inbox                                   (taskmaster) reports that have no review yet
#   bash tools/agent.sh next-id                                 (taskmaster) the next free task id
#   bash tools/agent.sh assign <agent> <task> <file>            (taskmaster) post a brief
#   bash tools/agent.sh review <report> <verdict> <file>        (taskmaster) post a review (verdict: ok | needs-work |
#                                                                answered | for-luca | dropped)
# Agents: worker-l (Luca's account), worker-f (the co-designer's account), co-designer. How it all fits: docs/agents.md.
set -u
ORIG="$PWD"; abs() { case "$1" in /*|"") echo "$1";; *) echo "$ORIG/$1";; esac; }   # file paths are relative to where you ran it
cd "${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}" || exit 0
AGENTS="worker-l worker-f co-designer"
REF=refs/remotes/origin/agents
say() { echo "[agents] $*"; }
die() { echo "[agents] $*" >&2; exit 1; }
fetch() { git fetch -q origin +refs/heads/agents:$REF 2>/dev/null; }
have() { git rev-parse -q --verify $REF >/dev/null; }
ls_dir() { git ls-tree -r --name-only $REF -- "agents/$1" 2>/dev/null | sed 's#^agents/##' | grep '\.md$'; }
get() { git show "$REF:agents/$1" 2>/dev/null; }
field() { get "$1" | sed -n "s/^$2: *//p" | head -1; }          # a "key: value" line from a file's header
valid_agent() { case " $AGENTS " in *" $1 "*) return 0;; esac; die "unknown agent '$1' (one of: $AGENTS)"; }
now() { TZ=Europe/Amsterdam date '+%Y-%m-%d %H:%M'; }
stamp() { TZ=Europe/Amsterdam date '+%Y%m%d-%H%M%S'; }

publish() {  # $1 path under agents/, $2 source file, $3 commit message. One new file per call, so pushes never clash.
  local tmp; tmp="$(mktemp -d)"; fetch || { rmdir "$tmp"; die "couldn't reach GitHub - nothing sent"; }
  have || { rmdir "$tmp"; die "there's no agents branch on GitHub yet - ask the taskmaster"; }
  git worktree add -q --detach "$tmp" $REF 2>/dev/null || { rmdir "$tmp"; die "couldn't open the agents branch"; }
  mkdir -p "$tmp/agents/$(dirname "$1")" && cp "$2" "$tmp/agents/$1"
  local id=(); git config user.name >/dev/null 2>&1 || id=(-c user.name="HC2 agent" -c user.email="noreply@anthropic.com")
  local msg="$3"; [ -n "${AGENT_COMMIT_TRAILER:-}" ] && msg="$msg

$AGENT_COMMIT_TRAILER"
  if ! ( cd "$tmp" && git add "agents/$1" && git ${id[@]+"${id[@]}"} commit -q -m "$msg" ); then
    git worktree remove --force "$tmp"; die "nothing to send (is the file empty or already there?)"; fi
  local ok=""
  for _ in 1 2 3; do
    ( cd "$tmp" && git push -q origin HEAD:refs/heads/agents 2>/dev/null ) && { ok=1; break; }
    ( cd "$tmp" && git fetch -q origin +refs/heads/agents:$REF && git rebase -q $REF ) || break
  done
  git worktree remove --force "$tmp"; [ -n "$ok" ] || die "couldn't push to the agents branch - nothing sent, try again"
  fetch; say "sent: agents/$1"
}

task_ids() { ls_dir "tasks/$1" | sed -n 's#^tasks/[^/]*/\(t-[0-9]*\)\.md$#\1#p' | sort; }
last_report() { ls_dir reports | grep "^reports/$1--" | awk -F'--' '{ print $NF "\t" $0 }' | sort | tail -1 | cut -f2; }   # newest report for a task (by its time stamp)
task_state() {   # open | reported: <status> | reviewed: <verdict>
  local r; r="$(last_report "$1")"; [ -z "$r" ] && { echo open; return; }
  local v; v="$(field "reviews/${r#reports/}" verdict)"
  if [ -n "$v" ]; then echo "reviewed: $v"; else echo "reported: $(field "$r" status), waiting for review"; fi
}
closed() { case "$1" in "reviewed: ok"|"reviewed: dropped") return 0;; esac; return 1; }
unreviewed() { for r in $(ls_dir reports | sort); do [ -n "$(get "reviews/${r#reports/}")" ] || echo "$r"; done; }

cmd="${1:-status}"; shift || true
case "$cmd" in
  status)
    fetch || { say "couldn't reach GitHub - no agent status"; exit 0; }
    have || { say "no agents branch yet"; exit 0; }
    line=""
    for a in $AGENTS; do open=""
      for t in $(task_ids "$a"); do s="$(task_state "$t")"; closed "$s" || open="$open $t"; done
      [ -n "$open" ] && line="$line · $a:$open"; done
    n="$(unreviewed | grep -c .)"
    line="${line# · }"; say "open tasks: ${line:-none}$( [ "$n" -gt 0 ] && echo " · reports waiting for the taskmaster: $n")";;
  tasks)
    a="${1:-}"; valid_agent "$a"; fetch || die "couldn't reach GitHub"; have || { say "no agents branch yet"; exit 0; }
    ids="$(task_ids "$a")"; [ -z "$ids" ] && { say "$a has no tasks"; exit 0; }
    for t in $ids; do echo "  $t  $(field "tasks/$a/$t.md" title)  [$(task_state "$t")]"; done;;
  show)
    fetch; [ -n "${1:-}" ] || die "which file? e.g. tasks/worker-l/t-001.md"; get "${1#agents/}" || die "no such file: $1";;
  report)
    a="${1:-}"; t="${2:-}"; s="${3:-}"; f="$(abs "${4:-}")"; valid_agent "$a"
    case "$s" in done|blocked|question|progress) ;; *) die "status must be done, blocked, question or progress";; esac
    [ -s "$f" ] || die "the report file '$f' is missing or empty"
    fetch || die "couldn't reach GitHub"
    [ "$t" = note ] || [ -n "$(get "tasks/$a/$t.md")" ] || die "no brief tasks/$a/$t.md - check the task id (bash tools/agent.sh tasks $a)"
    tmpf="$(mktemp)"; { echo "---"; echo "task: $t"; echo "agent: $a"; echo "status: $s"; echo "sent: $(now)"
      echo "branch: $(git rev-parse --abbrev-ref HEAD 2>/dev/null)"; echo "---"; echo; cat "$f"; } > "$tmpf"
    publish "reports/$t--$a--$(stamp).md" "$tmpf" "report: $t $s ($a)"; rm -f "$tmpf";;
  inbox)
    fetch || die "couldn't reach GitHub"; have || { say "no agents branch yet"; exit 0; }
    rs="$(unreviewed)"; [ -z "$rs" ] && { say "no reports waiting"; exit 0; }
    for r in $rs; do echo "  ${r#reports/}  ($(field "$r" agent), $(field "$r" status), sent $(field "$r" sent))"; done;;
  next-id)
    fetch; n="$(git ls-tree -r --name-only $REF -- agents/tasks 2>/dev/null | sed -n 's#.*/t-\([0-9]*\)\.md$#\1#p' | sort -n | tail -1)"
    printf 't-%03d\n' $(( 10#${n:-0} + 1 ));;
  assign)
    a="${1:-}"; t="${2:-}"; f="$(abs "${3:-}")"; valid_agent "$a"
    [[ "$t" =~ ^t-[0-9]{3,}$ ]] || die "task id looks like t-001 (bash tools/agent.sh next-id)"
    [ -s "$f" ] || die "the brief file '$f' is missing or empty"; grep -q '^title: ' "$f" || die "the brief needs a 'title: ...' line"
    fetch || die "couldn't reach GitHub"
    [ -z "$(git ls-tree -r --name-only $REF -- agents/tasks 2>/dev/null | grep "/$t\.md$")" ] || die "$t is already taken"
    tmpf="$(mktemp)"; { echo "---"; echo "task: $t"; echo "agent: $a"; echo "assigned: $(now)"; cat "$f"; } > "$tmpf"
    publish "tasks/$a/$t.md" "$tmpf" "brief: $t for $a"; rm -f "$tmpf";;
  review)
    r="${1:-}"; v="${2:-}"; f="$(abs "${3:-}")"; r="${r#agents/}"; r="${r#reports/}"
    case "$v" in ok|needs-work|answered|for-luca|dropped) ;; *) die "verdict must be ok, needs-work, answered, for-luca or dropped";; esac
    [ -s "$f" ] || die "the review file '$f' is missing or empty"; fetch || die "couldn't reach GitHub"
    [ -n "$(get "reports/$r")" ] || die "no report agents/reports/$r (bash tools/agent.sh inbox)"
    tmpf="$(mktemp)"; { echo "---"; echo "report: $r"; echo "task: $(field "reports/$r" task)"; echo "agent: $(field "reports/$r" agent)"
      echo "verdict: $v"; echo "reviewed: $(now)"; echo "---"; echo; cat "$f"; } > "$tmpf"
    publish "reviews/$r" "$tmpf" "review: ${r%%--*} $v"; rm -f "$tmpf";;
  *) sed -n '2,14p' "$0"; exit 1;;
esac
