# Taskmaster handover

For a **new taskmaster chat** on Luca's account. Read CLAUDE.md first, then this. Everything the taskmaster needs is
here, in the repo, on the Taskboard and in the agents folder; nothing depends on an old chat.

## The places

| What | Where |
| --- | --- |
| Official game (Luca's page) | https://claude.ai/artifact/AD1rvV13DR3nvQPzfsRojf (published from `game/index.html`) |
| Official Test Lab | https://claude.ai/artifact/Goa4b8PepGxbqv9877pPCV (published from `game/lab.html`) |
| HC2 HQ, the Taskboard (cards: collection `tasks`, each with `next` = who picks it up after Luca's OK; status lines: `meta/hq`; ↻ Check now = a quick run of the 2-hourly check, Luca only) | https://claude.ai/artifact/PtvBPpqTta99vWSSfSBoX4 |
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
| HC2 taskmaster check | every 2 hours, 09:00-23:00 Dutch time, and on HQ's ↻ Check now (a QUICK RUN: no test-running reviews) | Needs OK cards for `friend/` PRs; every PR card's preview (below); reviews new reports in the agents folder (`/inbox`); briefs OK'd cards whose `next` is a worker, when it's clear; HQ's status lines |
| HC2 overnight QA | 01:44 every night | 12 simulated matches (`tools/soak.js`) + all tests + Luca's watch-mode marks; at most 2 small fixes on `qa/` branches with `qa-*` cards; a report to the folder |

**HQ's page** can also change from the co-designer's side (CLAUDE.md "HC2 HQ is the exception", PR #39): before
the taskmaster republishes HQ, it reads the live version first and builds on that. His notes after each publish
arrive in the agents folder.

They never merge or publish the game. (The check publishes only HQ assets and the "HC2 PR #N preview" pages.) Change
them with the scheduled-task tools (list, update); tell Luca in plain words.

## Who works where

See `docs/agents.md`. In short: worker-l (Luca's account) and worker-f (the co-designer's) take `t-NNN` briefs; the
co-designer runs his own lanes; QA runs at night. Give work with `bash tools/agent.sh assign <agent> $(bash tools/agent.sh next-id) <brief>`
plus a `t-NNN` card. Every brief has a "How real football and other games do it" section (CLAUDE.md "Think like
football"). Keep two open tasks off the same files. `assign ... --replace` rewrites a brief nobody has
reported on yet.

## Merging a pull request (after Luca's OK on its card)

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

## Previews on Needs OK cards (the taskmaster and the 2-hourly check)

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

## Talking to Luca

Short, casual, direct, result first; always say where the work happens ([cloud], [your laptop], [PixelLab],
[Aseprite], [claude.ai], [GitHub]). He's a beginner at game testing: plain words. He's asked to keep usage sensible:
light checks for small changes, full checks before a merge.
