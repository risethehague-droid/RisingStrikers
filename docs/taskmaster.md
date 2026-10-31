# Taskmaster handover

For a **new taskmaster chat** on Luca's account. Read CLAUDE.md first, then this. Everything the taskmaster needs is
here, in the repo, on the Taskboard and in the agents folder; nothing depends on an old chat.

## The places

| What | Where |
| --- | --- |
| Official game (Luca's page) | https://claude.ai/artifact/AD1rvV13DR3nvQPzfsRojf (published from `game/index.html`) |
| Official Test Lab | https://claude.ai/artifact/Goa4b8PepGxbqv9877pPCV (published from `game/lab.html`) |
| EXPERIMENTAL game + its Test Lab (every new change, live, no HQ card) | https://claude.ai/artifact/CjKrd5vBnAt8E6HRma29mZ (built from branch `experimental` by `tools/experimental.sh`; on the public link: `/experimental/`) |
| HC2 HQ, the Taskboard (cards: collection `tasks`, each with `next` = who picks it up after Luca's OK; status lines: `meta/hq`; ↻ Check now = a quick run of the scheduled check, Luca only; ⚡ Turbo = the check every 2 hours instead of 3 times a day, Luca only) | https://claude.ai/artifact/PtvBPpqTta99vWSSfSBoX4 |
| Test Lab classic (frozen at v0.9.7, a fallback) | https://claude.ai/artifact/UA1KSu38xBxmQe5eEBToTk |
| PR previews | one "HC2 PR #N preview" page per PR, linked from its card (`preview.page`); see "Previews" below |
| Team setup doc | https://claude.ai/artifact/8QEZs4UX4XEGYGWYdqPssF |
| Repo | https://github.com/risethehague-droid/RisingStrikers (`main` = what's live) |
| Agents folder | the `agents` branch: `bash tools/agent.sh status` / `inbox` |
| Bug Watch clips + Luca's marks | the game page's database, collection `bugwatch` (ArtifactData; big docs: use `out_dir`) |
| Saved tuning from the Lab | the Test Lab page's database, collection `tuning` |

## The scheduled tasks (Luca's account)

| Name | When | Does |
| --- | --- | --- |
| HC2 taskmaster check | 3 times a day (08:39, 13:39, 20:39 Dutch time; Luca, 29 Oct: to save usage); every 2 hours (08:39-22:39) while HQ's ⚡ Turbo is on (it changes this task's schedule, recorded in `meta/hq.turbo`); and on HQ's ↻ Check now (a QUICK RUN: no test-running reviews) | Needs OK cards for `friend/` PRs; every PR card's preview (below); reviews new reports in the agents folder (`/inbox`); briefs OK'd cards whose `next` is a worker, when it's clear; HQ's status lines |
| HC2 overnight QA | 01:44 every night | 12 simulated matches (`tools/soak.js`) + all tests + Luca's watch-mode marks; at most 2 small fixes on `qa/` branches with `qa-*` cards; a report to the folder |

**HQ's page** can also change from the co-designer's side (CLAUDE.md "HC2 HQ is the exception", PR #39): before
the taskmaster republishes HQ, it reads the live version first and builds on that. His notes after each publish
arrive in the agents folder.

They never merge or publish the game. (The check publishes only HQ assets and the "HC2 PR #N preview" pages.) Change
them with the scheduled-task tools (list, update); tell Luca in plain words.

## The message board (agents/messages/, since 29 Oct)
The co-designer's Claude sessions can't reach HQ's Messages, because the org setting blocks invited editors' artifact
data from Claude Code. So the agents talk on the board in the agents folder (`docs/agents.md` has the commands and
rules). On every check, before the inbox:
1. Run `bash tools/agent.sh board taskmaster` and answer each thread in full. Use `board check` too.
2. Mirror HQ <-> the board. HQ messages to or from `co-designer` or `worker-f` get a copy on the board, with
   `--card hq-<id>`. Board messages to `luca` get a copy in HQ's Messages. A thread closed on one side gets closed on
   the other.
3. Read the new session logs (`board --logs`). They hold what the people said in chats you can't see, so act on
   their open questions.
4. Post your own run summary as a log (`msg check all <file> --log`).

## The public game link (GitHub Pages)
https://risethehague-droid.github.io/RisingStrikers/ is the game for friends: no claude.ai account, no invite.
`.github/workflows/public-game.yml` republishes it by itself after every merge into main that touches `game/`, so it
always matches the official game. It publishes only the game: `index.html`, `src/`, the assets and Phaser. The Test
Lab and the test pages stay off it. Luca switched it on once in the repo's Settings -> Pages (Source: GitHub
Actions). To pause it, set Source to None.

## Who works where

See `docs/agents.md`. In short: worker-l (Luca's account) and worker-f (the co-designer's) take `t-NNN` briefs; the
co-designer runs his own lanes; QA runs at night. Give work with `bash tools/agent.sh assign <agent> $(bash tools/agent.sh next-id) <brief>`
plus a `t-NNN` card. Every brief has a "How real football and other games do it" section (CLAUDE.md "Think like
football"). Keep two open tasks off the same files. `assign ... --replace` rewrites a brief nobody has
reported on yet.

## EXPERIMENTAL: new work goes live there first (Luca, 31 Oct)

Luca: "implement all new changes on a new version you can select in game called experimental, and create the card for
me to ok implementation ONLY for the main game version, for experimental it is updated live each time something new
is added / or slowly passively improving".
1. **When a PR is ready** (tests pass, preview done): `bash tools/experimental.sh add <branch>` (it brings in the
   latest main too), `bash tools/experimental.sh build $TMP/exp`, publish to the experimental page (the header of the
   script has the exact call), refresh the public link (`gh api -X POST .../actions/workflows/public-game.yml/dispatches
   -f ref=main`). No HQ card for this, no OK needed.
2. **Tell Luca in one line** right away: what's new in EXPERIMENTAL + the link (Dutch time if you name a time).
3. **The HQ card is for MAIN only:** the PR still gets its Needs OK card. His OK = merge that PR into main (below),
   never the `experimental` branch.
4. **After every merge into main:** `bash tools/experimental.sh sync`, rebuild, republish, so experimental stays
   main + the extras. A clash: keep `game/channel.js` = `'experimental'`.
5. A fix pushed to a PR's branch: run `add <branch>` again. A PR closed without merging: rebuild `experimental` from
   main + the open PRs (`git checkout -B experimental origin/main`, `add` each, keep channel.js) and push with
   `--force-with-lease`.
6. Out until Luca says so: LAN (t-044, his two-PC retest), duplicates (PR #80).
## Card status keys (HQ `tasks`, every writer)

HQ shows a card in a column by its `status` **key**. Write the key, never the column's label:

| Write `status:` | Column on HQ | When |
| --- | --- | --- |
| `"inbox"` | To do (New) | a new card nobody has sorted |
| `"ready"` | To do | sorted, briefed, or sent back by Luca |
| `"doing"` | In progress | a worker or the taskmaster is on it |
| `"review"` | **Needs OK** (and YOUR MOVE) | waits for Luca's OK: every new PR card, every question for him |
| `"approved"` | In progress (OK'd) | only HQ's OK button writes this |
| `"done"` / `"dropped"` | Done | merged and live / said no |

- **Needs OK is `"review"`.** On 30-31 Oct cards were saved as `"needs-ok"`, which isn't a key, so HQ showed them as
  New in To do and Luca had to hunt for them (#70, #75, and #72, #74, #76-#79 before he found and OK'd them). HQ now
  reads common misspellings and flags any unknown status in red on the card, but write the key anyway.
- **A PR that gets new code after Luca's OK goes back to `"review"`** with a log line saying what changed (t-044 / #68,
  31 Oct). A merge of main into the branch with no change of its own doesn't count.
- **`next` is who acts after the OK.** When the OK means "merge", `next.agent` is `"taskmaster"`, never `"luca"`
  (otherwise the OK'd card sits in In progress with nobody on it). Use `"luca"` only when his OK hands him a step
  himself, such as a 2-PC test.
- **After writing a card, read it back** (ArtifactData `get`) and check the status is one of the keys above.
- Before every check ends: list the open PRs and make sure each one has a card in `review`, `approved` or `ready`
  (sent back). An open PR with no card, or a card with an unknown status, gets fixed in the same run.

## Merging a pull request (after Luca's OK on its card)

0. **Read the PR's card on HQ first: merge only if its status is `approved`** (Luca's OK through HQ's button, with
   `decision.verdict` "ok"). An "ok" in chat is not enough on its own: on 25 Oct an "ok" in chat came in the same
   minute Luca sent #37 and #38 *back* on HQ, and both went live by mistake. Sent back = not merged; read his note.
1. Check: `gh api repos/risethehague-droid/RisingStrikers/pulls/<n>` (REST only; GraphQL is blocked). **Note the
   head SHA you test.**
2. Merge it locally into `main` (`git merge --no-ff origin/<branch>`), resolve clashes keeping both sides' intent.
   A branch made before a refactor: move its changed lines into the new files unchanged.
3. Test the merged result: smoke at all levels, the Lab groups it touches, seeded matches if play might change,
   anything the brief's "Done means" lists. A visual change: look at screenshots.
4. Bump the version: `GAME_VER` + the header line in `game/src/core.js`, the entry at the top of `docs/CHANGELOG.txt`,
   "Current version" in `README.md`.
5. Push `main`. If GitHub doesn't mark the PR merged by itself, merge it through the API **pinned to the SHA you
   tested**: `gh api -X PUT .../pulls/<n>/merge -f merge_method=merge -f sha=<tested sha>`. (Without `sha`, commits
   pushed after your test come in untested: it happened with PR #1.) Then check `main` again.
6. `/publish`, then the card → done with one line of what went live.
7. **HQ's Versions:** add the new version's doc. Upload the PR GIFs that aren't in HQ yet (a Needs OK card's
   `preview.gif` is usually already there: reuse it) and add them to `design/hq/gif-assets.json` (repo path → HQ
   `/_blob/…` url; commit it). Then `python3 design/hq/hqdata.py versions $TMP/hq --gifs design/hq/gif-assets.json` and
   ArtifactData `set` only the new `versions/<v0-x-y>` doc. Set `meta/hq.gameVer`.

## Handover notes (kept here so a new taskmaster chat loses nothing)

- **Starting workers.** A worker is a one-shot scheduled task (`create_trigger` with `run_once_at` a few minutes
  ahead), model claude-opus-5-5. Copy the prompt of an earlier "HC2 worker-l · t-NNN …" task (`list_triggers` with
  `include_completed`) and change the task id, branch name, files and the one-paragraph summary. It runs in a fresh
  cloud session; it reports through the folder; it never merges or publishes.
- **Usage is limited (Luca, 29 Oct).** One worker at a time unless two tasks are both urgent; small flag-flip tasks can
  share one session; skip test runs the brief doesn't need; keep replies short.
- **The Try-it Lab** (https://claude.ai/artifact/GLSDm1t1mFYFy15LxdQ6Ma, branch `candidate/try-it`, never merged): main
  + every PR waiting for Luca's OK, merged together so he can test them side by side, with a TRY THE NEW STUFF panel
  (lab.html / lab.js) and `#play-gp` / `#play-tap` / `#play-curve` / `#play-all` links that start a match with a
  Lab-only switch on (core.js, try-it only). Rebuild: reset the branch to main, merge the waiting PRs, re-add the panel,
  `bash tools/prpreview.sh <sha> <dir> 0 "Try it"`, set the page title to "HC2 Try-it Lab", publish to the same url.
  Once t-038 (FREE PLAY with a button and an IN THE GAME / LAB ONLY tag per move) is live, prefer FREE PLAY there.
- **The check's schedule.** "HC2 taskmaster check" is `trig_01XnmuxJ2BFdFv4jwZvQ7q1E`: normal
  `CRON_TZ=Europe/Berlin 39 8,13,20 * * *`, TURBO `CRON_TZ=Europe/Berlin 39 8-22/2 * * *`. HQ's ⚡ Turbo button switches
  it (update_trigger, as Luca) and writes `meta/hq.turbo`; if you change the schedule by hand, update `meta/hq.turbo`
  too so HQ's next-check line stays right. Nightly QA is `trig_01MrQu9w8x9GS2hgEKev33u8` (01:44).
- **Where "now" lives.** HQ's `meta/hq` (the taskmaster's note says what's running and what's next), the cards in
  Needs OK / In progress, Loose Ends, and `bash tools/agent.sh inbox` / `status`. Read those before doing anything.

## Previews on Needs OK cards (the taskmaster and the scheduled check)

Every PR's card on HQ shows its preview (Luca + the co-designer, 24 Oct): the GIF playing, **Play it** and **Try it in
the Test Lab**. The data sits on the card as `preview`; HQ only displays it. Build it for every open PR whose card
(`pr-<N>`, or the `t-NNN` / `qa-*` card it belongs to) has no `preview`, or a `preview.head` different from the PR's
head SHA:

1. **Read the line** in the PR description: the first line starting with `Preview:`, shaped
   `Preview: <path or none> · Test Lab: <ids or none>` (CLAUDE.md "The `## Preview` section"). No such line: the card
   gets `preview: {missing: true, head}`; for a worker's PR that's also needs-work.
2. **The GIF** (when there's a path): `git fetch origin <branch>`, then `git show <head>:<path> > $TMP/pr<N>.gif`.
   It must exist and be at most about 1 MB. Upload it to HQ's own asset store (the repo is private, so HQ can't show
   the GitHub copy): Artifact publish with `url` = HQ, `asset: true`, `file_path` = the GIF. The result's `url` goes
   into `preview.gif`.
3. **The page:** `bash tools/prpreview.sh <head> $TMP/pr<N>prev <N> "<PR title>"`, then Artifact publish:
   - `file_path` = `$TMP/pr<N>prev/index.html`, `root` = `$TMP/pr<N>prev`, `files` = the list in its `files.json`
   - **first time:** no `url`, `icon` "play", `capabilities` `{"db": {}, "sample": {"images": true}}`,
     description "PR #N's code on top of main, as a playable game and Test Lab (a preview, not live)"
   - **after that:** `url` = `preview.page`, no `icon`, no `capabilities`
4. **The card:** ArtifactData `update` (pinned) `preview` = `{head, gif, gifPath, tests: [ids], page, base:
   "PR + main" or "branch", builtAt: <ms>, none: "<why>" for Preview: none}`.
5. Merged or closed PRs keep their page; never delete one unless Luca asks.

## MOVES on HQ (Luca, 30 Oct: "keep the hq updated with all new animations you add, as short previews")

HQ's MOVES section shows every FREE PLAY move (`FP_MOVES` in game/lab.js) as a short clip, grouped like the Lab. When
you merge a PR that adds or changes a move (its `Move clips:` line, CLAUDE.md Testing 7):
1. The clip: the PR's `docs/previews/pr<N>-move-<mv>.gif`, or record it from main:
   `MOVE=<mv> FPS=10 WIDTH=320 OUT=$TMP/<mv>.gif node tools/preview.js` (set pieces: `SKIP=6 MOVEKEY=KeyC`; the throw-in
   `KeyZ`). Shrink it to about 200 KB first if it's bigger (every 2nd frame, 32 colours).
2. Upload it to HQ's assets (Artifact publish, `url` = HQ, `asset: true`) and add the move's line to
   `design/hq/move-assets.json`: `"<mv>": {"gif": "<the url>", "ver": "v0.x.y", "at": <ms>}`. Commit it.
3. `python3 design/hq/hqdata.py moves $T`, then one ArtifactData batch from `$T/moves-writes.json` (set; it also picks up
   renamed moves and the IN THE GAME / LAB ONLY tag).

## LIVE NOW on HQ + the timeline (Luca, 31 Oct: "a hud which shows me what each agent is working on live")

HQ's AGENTS section starts with a **LIVE NOW** panel. It reads the HQ database collection `hud`: one doc per agent or
thread, and HQ shows changes the moment they're written, with "last update X ago".
- **Every thread, worker and the scheduled check** sets its own doc (ArtifactData `set`/`update` on HQ, pinned) when
  it **starts** a task and when it **finishes** or gets **stuck**:
  `hud/<short-id>` = `{who: "<what Luca would call it>", doing: "<one plain line>", state: "working" | "waiting" |
  "blocked" | "done", card: "<card id or ''>", pr: <PR number or 0>, at: <now in ms>, by: "<agent>"}`.
  `waiting` = waiting for Luca's OK or a merge; `blocked` = stuck, needs Luca. A "working" doc older than 6 h shows
  as gone quiet; "done" docs drop off after a day.
- **The scheduled check** tidies it each run: one doc per running thread or worker (`list_threads`), stale ones set to
  done, and a `check` doc for its own run.
- **The timeline** (top of VERSIONS) draws itself from the `versions` collection: no extra step at a merge.
- **Strike Barge HQ** (the spaceship HQ, https://claude.ai/artifact/2CLY3PHHuAGDiXAf3C1n4q): the same data in Luca's
  fun style. It can't read HQ's database, so it carries a snapshot: the scheduled check rebuilds and republishes it
  each run (`design/hq/ship.py` header has the 3 steps). Buttons and OKs stay on the real HQ.

## Talking to Luca

Short, casual, direct, result first; always say where the work happens ([cloud], [your laptop], [PixelLab],
[Aseprite], [claude.ai], [GitHub]). He's a beginner at game testing: plain words. He's asked to keep usage sensible:
light checks for small changes, full checks before a merge.

**Tell him the moment something happens** (Luca, 30 Oct: "did you automatically send a brief after I okd this PR?
How was I supposed to know"). Whenever you merge, publish, or start or schedule an OK'd card (a worker session, a
brief), post one line to Luca right away: what happened, and when the next step runs, in his time (Dutch time, not
UTC). This holds during night runs too; it isn't an "interim check-in". The scheduled check does the same in its
summary message.
