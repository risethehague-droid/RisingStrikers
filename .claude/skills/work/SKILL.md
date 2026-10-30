---
name: work
description: For the worker agents (worker-l, worker-f) - pick up your next task from the agents folder, do it on its own branch, test it, open a pull request and send your report to the taskmaster. Use when someone says "work", "/work", "next task", or a worker session starts.
---

# /work: do your next task

You are **worker-l** (Luca's account) or **worker-f** (the co-designer's account): your kickoff message says which.
If it doesn't, ask once. `docs/agents.md` explains the whole setup; CLAUDE.md's house rules apply as always.

0. **The board first** [cloud]: `bash tools/agent.sh board <you>`. Answer every thread where it's your turn, in full
   (`msg <you> <them> <file> --re <id>`, `--close` when settled), before starting work.
1. **Your tasks** [cloud]: `bash tools/agent.sh tasks <you>`. Take the oldest one that is `open`,
   `reviewed: needs-work` or `reviewed: answered`. None? Say so in one line and stop: the taskmaster hands out the
   work. Don't pick cards off the Taskboard yourself.
2. **Read the brief**: `bash tools/agent.sh show tasks/<you>/<task>.md`. If the task has a review already, read the
   newest one too (`bash tools/agent.sh show reviews/<report name>`; `tasks` shows the state) and do what it asks.
3. **Branch** from the latest `main`: `git checkout -b <you>/<task>-<short-topic>`. For needs-work, reuse that branch.
   - New task: first `git ls-remote origin "refs/heads/<you>/<task>-*"`. A branch for it already there means another
     session took it (24 Oct: t-011 got built twice): don't start a second one; send a `question` report and stop.
4. **Do it.**
   - Touch only the files the brief lists. Something outside them needs changing? Ask (step 7, `question`) rather
     than doing it: another agent may be working there.
   - Art comes from PixelLab or Aseprite only (CLAUDE.md "Art"). A PixelLab key never goes in chat, the repo,
     the board or a report.
5. **Test**: CLAUDE.md "Testing", plus everything under "Done means" in the brief.
6. **Pull request** (when you changed files): push the branch and open a PR to `main`.
   - Title: `<task> · <brief title>`.
   - Body: as CLAUDE.md "Pull requests", plus a line `Task: <task>`.
   - **Preview:** once the PR has its number, record the GIF with `tools/preview.js` and commit it as
     `docs/previews/pr<N>-<topic>.gif`. Then add the `## Preview` section with its one `Preview: … · Test Lab: …` line
     (CLAUDE.md "The `## Preview` section"). Nothing visible: `Preview: none · Test Lab: none` and why.
   - No version bump. Never merge.
7. **Report**: write the report below to a file in your scratchpad, then
   `bash tools/agent.sh report <you> <task> done <file>`.
   - Stuck: same command with `blocked`; need an answer first: `question`. Say exactly what you need.
   - A report can't be changed once sent: send a new one.
8. **Log**: post a session log to the board (`msg <you> all <file> --log`, shape in docs/agents.md "The message board").
9. **Next**: go back to step 0, or stop when there's nothing open.

## The report (short; the taskmaster reads every one)

```
## What I did
(2-5 bullets)

## Where
Branch: <you>/<task>-<topic> · PR: <link> · Files: <list>

## Tests
(the commands you ran and their last lines, e.g. smoke "errors []")

## PixelLab generations used
(a number, or 0)

## Open points / questions for the taskmaster
(or "none")
```

## Never

- push to `main`, merge, or publish to Luca's pages (game, Test Lab, Taskboard). Exception: worker-f may publish HC2 HQ when
  the co-designer asks it to (CLAUDE.md, "HC2 HQ is the exception").
- write in `agents/tasks/` or `agents/reviews/` (the taskmaster's), or edit any file in the agents folder by hand
- start a task that wasn't assigned to you
