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
#   bash tools/agent.sh assign <agent> <task> <file> [--replace|--move] (taskmaster) post a brief (--replace: rewrite
#                                                                one no one has reported on yet; --move: hand that one
#                                                                to another agent)
#   bash tools/agent.sh review <report> <verdict> <file>        (taskmaster) post a review (verdict: ok | needs-work |
#                                                                answered | for-luca | dropped)
# The message board (the co-designer, 29 Oct: "We want you communicating in a lot more details", HQ's board can't be
# reached from his account's Claude sessions, so the board lives here, where both accounts already write):
#   bash tools/agent.sh msg <from> <to> <file> [--re <id>] [--close] [--urgent] [--card <id>] [--log]
#                                                               a message (--re: a reply in that thread, --close: the reply
#                                                                that answers it, --log: a session log for everyone that
#                                                                needs no answer). who: luca co-designer taskmaster
#                                                                worker-l worker-f check qa all
#   bash tools/agent.sh board [<who>] [--all] [--logs]          open threads (to <who> or everyone), newest first
#   bash tools/agent.sh thread <id>                             a whole thread: the message and every reply
# Agents: worker-l (Luca's account), worker-f (the co-designer's account), co-designer, qa (the nightly QA run). How it all fits: docs/agents.md.
set -u
ORIG="$PWD"; abs() { case "$1" in /*|"") echo "$1";; *) echo "$ORIG/$1";; esac; }   # file paths are relative to where you ran it
cd "${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}" || exit 0
AGENTS="worker-l worker-f co-designer qa"
WHO="luca co-designer taskmaster worker-l worker-f check qa all"   # (the board: the same names as HQ's Messages)
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

publish() {  # $1 path under agents/, $2 source file, $3 commit message, $4 (optional) a path under agents/ to remove in
             # the same commit (a brief moved to another agent). One new file per call, so pushes never clash.
  local tmp; tmp="$(mktemp -d)"; fetch || { rmdir "$tmp"; die "couldn't reach GitHub - nothing sent"; }
  have || { rmdir "$tmp"; die "there's no agents branch on GitHub yet - ask the taskmaster"; }
  git worktree add -q --detach "$tmp" $REF 2>/dev/null || { rmdir "$tmp"; die "couldn't open the agents branch"; }
  mkdir -p "$tmp/agents/$(dirname "$1")" && cp "$2" "$tmp/agents/$1"
  [ -n "${4:-}" ] && ( cd "$tmp" && git rm -q "agents/$4" )
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

# ---- the message board: agents/messages/<id>.md, one file per message (so pushes never clash), id = <time>--<from>.
# A reply carries "re: <id>"; a thread is answered once a reply says "closes: yes". Logs ("kind: log") need no answer.
valid_who() { case " $WHO " in *" $1 "*) return 0;; esac; die "unknown name '$1' (one of: $WHO)"; }
msgs() { ls_dir messages | sed -n 's#^messages/\(.*\)\.md$#\1#p' | sort; }
mfield() { field "messages/$1.md" "$2"; }
replies() { for m in $(msgs); do [ "$(mfield "$m" re)" = "$1" ] && echo "$m"; done; }
closed_t() { for r in $(replies "$1"); do [ "$(mfield "$r" closes)" = yes ] && return 0; done; return 1; }
first_line() { get "messages/$1.md" | awk 'f && NF { print; exit } /^---$/ { n++; if (n == 2) f = 1 }' | cut -c1-110; }
waiting() {   # "<id>\t<whose turn>" for each open thread (not a log, no closing reply): whose turn = who the newest
              # message in it is to (you asked the taskmaster; it replied to you: now it's yours)
  local all; all="$(msgs)"; local closed="" last=""
  for m in $all; do r="$(mfield "$m" re)"; [ -n "$r" ] && { last="$last $r=$m"; [ "$(mfield "$m" closes)" = yes ] && closed="$closed $r"; }; done
  for m in $all; do [ -z "$(mfield "$m" re)" ] && [ "$(mfield "$m" kind)" != log ] && case " $closed " in *" $m "*) ;; *)
    n="$m"; for kv in $last; do [ "${kv%%=*}" = "$m" ] && n="${kv#*=}"; done
    printf '%s\t%s\n' "$m" "$(mfield "$n" to)";; esac; done
}

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
    line="${line# · }"; say "open tasks: ${line:-none}$( [ "$n" -gt 0 ] && echo " · reports waiting for the taskmaster: $n")"
    w="$(waiting | cut -f2 | sort | uniq -c | awk '{ printf "%s%s %s", (NR > 1 ? ", " : ""), $2, $1 }')"
    [ -n "$w" ] && say "messages waiting: $w (bash tools/agent.sh board <you>)"
    last="$(for m in $(msgs); do [ "$(mfield "$m" kind)" = log ] && echo "$m"; done | tail -1)"
    [ -n "$last" ] && say "latest session log: $last ($(mfield "$last" from)) - bash tools/agent.sh board --logs";;
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
    taken="$(git ls-tree -r --name-only $REF -- agents/tasks 2>/dev/null | grep "/$t\.md$")"
    moved=""
    if [ -n "$taken" ]; then
      case "${4:-}" in --replace|--move) ;; *) die "$t is already taken (add --replace to rewrite its brief, or --move to hand it to another agent, before anyone reports on it)";; esac
      [ -z "$(last_report "$t")" ] || die "$t already has a report - assign a new task instead"
      if [ "$taken" != "agents/tasks/$a/$t.md" ]; then
        [ "${4:-}" = --move ] || die "$t belongs to another agent: $taken (use --move to hand it over)"
        moved="${taken#agents/}"                                               # (Luca 24 Oct: "Assign t005 to worker L")
      fi
    fi
    tmpf="$(mktemp)"; { echo "---"; echo "task: $t"; echo "agent: $a"; echo "assigned: $(now)${taken:+ (brief ${moved:+moved from ${moved#tasks/}, }rewritten)}"; cat "$f"; } > "$tmpf"
    publish "tasks/$a/$t.md" "$tmpf" "brief: $t for $a${moved:+ (moved from ${moved#tasks/})}${taken:+ (rewritten)}" "$moved"; rm -f "$tmpf";;
  review)
    r="${1:-}"; v="${2:-}"; f="$(abs "${3:-}")"; r="${r#agents/}"; r="${r#reports/}"
    case "$v" in ok|needs-work|answered|for-luca|dropped) ;; *) die "verdict must be ok, needs-work, answered, for-luca or dropped";; esac
    [ -s "$f" ] || die "the review file '$f' is missing or empty"; fetch || die "couldn't reach GitHub"
    [ -n "$(get "reports/$r")" ] || die "no report agents/reports/$r (bash tools/agent.sh inbox)"
    tmpf="$(mktemp)"; { echo "---"; echo "report: $r"; echo "task: $(field "reports/$r" task)"; echo "agent: $(field "reports/$r" agent)"
      echo "verdict: $v"; echo "reviewed: $(now)"; echo "---"; echo; cat "$f"; } > "$tmpf"
    publish "reviews/$r" "$tmpf" "review: ${r%%--*} $v"; rm -f "$tmpf";;
  msg)
    fr="${1:-}"; to="${2:-}"; f="$(abs "${3:-}")"; shift 3 2>/dev/null || die "usage: msg <from> <to> <file> [--re <id>] [--close] [--urgent] [--card <id>] [--log]"
    valid_who "$fr"; valid_who "$to"; [ -s "$f" ] || die "the message file '$f' is missing or empty"
    re=""; cl=""; ur=""; card=""; kind=message
    while [ $# -gt 0 ]; do case "$1" in --re) re="${2:-}"; shift;; --close) cl=yes;; --urgent) ur=yes;; --card) card="${2:-}"; shift;; --log) kind=log;; *) die "unknown option $1";; esac; shift; done
    fetch || die "couldn't reach GitHub"
    if [ -n "$re" ]; then re="${re#messages/}"; re="${re%.md}"; [ -n "$(get "messages/$re.md")" ] || die "no message $re (bash tools/agent.sh board --all)"
      root="$(mfield "$re" re)"; [ -n "$root" ] && re="$root"; kind=reply; fi                  # a reply to a reply joins the thread
    [ -n "$cl" ] && [ -z "$re" ] && die "--close goes with --re <id> (the reply that answers it)"
    ns="$(date +%N 2>/dev/null | cut -c1-4)"; case "$ns" in [0-9][0-9][0-9][0-9]) ;; *) ns="$(printf %04d $((RANDOM % 10000)))";; esac
    id="$(stamp)-$ns--$fr"; tmpf="$(mktemp)"   # (two in one second got the same id; the extra digits keep them in order)
    { echo "---"; echo "id: $id"; echo "from: $fr"; echo "to: $to"; echo "kind: $kind"; echo "sent: $(now)"
      [ -n "$re" ] && echo "re: $re"; [ -n "$cl" ] && echo "closes: yes"; [ -n "$ur" ] && echo "urgent: yes"; [ -n "$card" ] && echo "card: $card"
      echo "branch: $(git rev-parse --abbrev-ref HEAD 2>/dev/null)"; echo "---"; echo; cat "$f"; } > "$tmpf"
    publish "messages/$id.md" "$tmpf" "message: $fr -> $to ($kind${re:+, re $re}${cl:+, closes it})"; rm -f "$tmpf"
    [ -n "$ur" ] && say "urgent: on Luca's side, also ring the doorbell (an HQ comment starting \"Claude:\")"; say "id: $id";;
  board)
    who=""; all=""; logs=""
    while [ $# -gt 0 ]; do case "$1" in --all) all=1;; --logs) logs=1;; *) valid_who "$1"; who="$1";; esac; shift; done
    fetch || die "couldn't reach GitHub"; have || { say "no agents branch yet"; exit 0; }
    if [ -n "$logs" ]; then ids="$(for m in $(msgs); do [ "$(mfield "$m" kind)" = log ] && echo "$m"; done | sort -r | head -15)"
      [ -z "$ids" ] && { say "no session logs yet"; exit 0; }
      for m in $ids; do echo "  LOG  $m  $(first_line "$m")"; done; exit 0; fi
    if [ -n "$all" ]; then ids="$(for m in $(msgs); do [ -z "$(mfield "$m" re)" ] && echo "$m"; done | sort -r | head -40)"
    else ids="$(waiting | awk -F'\t' -v w="$who" 'w == "" || $2 == w || $2 == "all" { print $1 }' | sort -r)"; fi
    [ -z "$ids" ] && { say "nothing waiting${who:+ for $who}"; exit 0; }
    for m in $ids; do n="$(replies "$m" | grep -c .)"; st="open"; closed_t "$m" && st="answered"; [ "$(mfield "$m" kind)" = log ] && st="log"
      echo "  $m  $(mfield "$m" from) -> $(mfield "$m" to)  [$st$( [ "$n" -gt 0 ] && echo ", $n repl$( [ "$n" = 1 ] && echo y || echo ies)")]$( [ "$(mfield "$m" urgent)" = yes ] && echo " URGENT")"
      echo "      $(first_line "$m")"; done
    say "read one: bash tools/agent.sh thread <id>";;
  thread)
    m="${1:-}"; m="${m#agents/}"; m="${m#messages/}"; m="${m%.md}"; fetch; [ -n "$(get "messages/$m.md")" ] || die "no message $m"
    root="$(mfield "$m" re)"; [ -n "$root" ] && m="$root"
    get "messages/$m.md"; for r in $(replies "$m"); do echo; echo "======== reply"; get "messages/$r.md"; done;;
  *) sed -n '2,24p' "$0"; exit 1;;
esac
