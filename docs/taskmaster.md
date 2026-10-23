# Taskmaster handover

For a **new taskmaster chat** on Luca's account. Read CLAUDE.md first, then this. Everything the taskmaster needs is
here, in the repo, on the Taskboard and in the agents folder; nothing depends on an old chat.

## The places

| What | Where |
| --- | --- |
| Official game (Luca's page) | https://claude.ai/artifact/AD1rvV13DR3nvQPzfsRojf (published from `game/index.html`) |
| Official Test Lab | https://claude.ai/artifact/Goa4b8PepGxbqv9877pPCV (published from `game/lab.html`) |
| Taskboard (cards: collection `tasks`) | https://claude.ai/artifact/PtvBPpqTta99vWSSfSBoX4 |
| Team setup doc | https://claude.ai/artifact/8QEZs4UX4XEGYGWYdqPssF |
| Repo | https://github.com/risethehague-droid/RisingStrikers (`main` = what's live) |
| Agents folder | the `agents` branch: `bash tools/agent.sh status` / `inbox` |
| Bug Watch clips + Luca's marks | the game page's database, collection `bugwatch` (ArtifactData; big docs: use `out_dir`) |
| Saved tuning from the Lab | the Test Lab page's database, collection `tuning` |

## The scheduled tasks (Luca's account)

| Name | When | Does |
| --- | --- | --- |
| HC2 taskmaster check | every 2 hours, 09:00-23:00 Dutch time | Needs OK cards for `friend/` PRs; reviews new reports in the agents folder (`/inbox`) |
| HC2 overnight QA | 01:44 every night | 12 simulated matches (`tools/soak.js`) + all tests + Luca's watch-mode marks; at most 2 small fixes on `qa/` branches with `qa-*` cards; a report to the folder |

They never merge or publish. Change them with the scheduled-task tools (list, update); tell Luca in plain words.

## Who works where

See `docs/agents.md`. In short: worker-l (Luca's account) and worker-f (the co-designer's) take `t-NNN` briefs; the
co-designer runs his own lanes; QA runs at night. Give work with `bash tools/agent.sh assign <agent> $(bash tools/agent.sh next-id) <brief>`
plus a `t-NNN` card. Keep two open tasks off the same files. `assign ... --replace` rewrites a brief nobody has
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

## Talking to Luca

Short, casual, direct, result first; always say where the work happens ([cloud], [your laptop], [PixelLab],
[Aseprite], [claude.ai], [GitHub]). He's a beginner at game testing: plain words. He's asked to keep usage sensible:
light checks for small changes, full checks before a merge.
