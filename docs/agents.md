# Agents: who does what, and the report folder

Four Claude sessions work on HC2 Football, two per account. Every task is split off and assigned by the taskmaster,
and every agent reports back into one shared folder, which the taskmaster reviews. Luca gives the final OK.

| Agent | Account | Does | Its branches |
| --- | --- | --- | --- |
| **taskmaster** | Luca's: his main Claude chat | splits work, writes the briefs, reviews every report, merges into `main`, publishes the official game | `main`; `agents` (briefs + reviews) |
| **co-designer** | the co-designer's: his main session | his own lanes, Design & Vision and Stadiums & maps (`README-friend-sessions.md`) | `friend/<topic>` |
| **worker-l** | Luca's: a second session | any task assigned to it: code, tests, docs, art | `worker-l/t-NNN-<topic>` |
| **worker-f** | the co-designer's: a second session | any task assigned to it: code, tests, docs, art | `worker-f/t-NNN-<topic>` |

- Both workers are general: no fixed area. The taskmaster spreads the work so two open tasks never touch the same files.
- Art can go to either worker. PixelLab keys stay in each person's own PixelLab setup: never in chat, the repo,
  the Taskboard or a report.
- Two sessions on one account share that account's usage limits.

## The report folder

It's the `agents` branch on GitHub. It holds only `agents/`, never game files, and is never merged into `main`.
It's the one place both accounts can write (the co-designer's account can't write to the Taskboard).

```
agents/
  roster.md                              who's who
  tasks/<agent>/t-NNN.md                 briefs, written by the taskmaster
  reports/t-NNN--<agent>--<time>.md      reports, written by the agent doing the task
  reviews/<same name as the report>      the taskmaster's verdict on that report
```

Everyone uses `bash tools/agent.sh` instead of editing these files. It pushes one new file per send, so agents never
clash. Every session prints a status line when it starts: open tasks per agent, and reports waiting for review.

## How a task goes

1. **Split** (taskmaster, with Luca): a job is cut into tasks, one agent each. For every task:
   - a Taskboard card, id `t-NNN`, owner `worker-l` or `worker-f`, status Ready
   - a brief: `bash tools/agent.sh assign <agent> $(bash tools/agent.sh next-id) <file>` (template below)
2. **Work** (the worker, `/work`): it reads the brief, works on `<agent>/t-NNN-<topic>`, tests, opens a pull request,
   then sends a report: `bash tools/agent.sh report <agent> t-NNN done <file>`.
   - Stuck: `blocked`. Needs an answer: `question`.
3. **Review** (taskmaster, `/inbox`): every 2 hours, 09:00 to 23:00 Dutch time, the scheduled check on Luca's account
   reviews new reports. Luca's main chat can also do it any time ("check the reports"). For each report it checks the
   branch against the brief (files, tests, PR) and posts a verdict:
   - `ok`: the card moves to **Needs OK** for Luca, with the review and the PR link
   - `needs-work`: the card goes back to Ready; the review says what to fix and the worker picks it up again
   - `answered`: a question settled in the review
   - `for-luca`: a decision card for Luca
   - `dropped`: no longer needed
4. **OK and merge**: Luca OKs the card. The taskmaster merges, bumps the version and publishes, in Luca's main chat.

The co-designer's own `friend/` pull requests get their Needs OK card automatically from the same scheduled check.
He can also report through the folder: `bash tools/agent.sh report co-designer note done <file>`.

## The brief (template)

```
title: <one line>
lane: <gameplay | art | qa | design | lead>
card: t-NNN on the Taskboard
---

## Goal
What to make or fix, and why (the request behind it, in the requester's words where possible).

## Files you may touch
- game/src/<file>.js
- ...

## Done means
- the tests to run and what they must show (smoke "errors []", Test Lab group X, a screenshot of Y)

## Notes
Anything that saves time: where the code lives, what was tried, what to avoid.
```

## Starting a worker session

Start a new Claude Code session at claude.ai/code with **only** the `RisingStrikers` repository selected. With one
repository, the start-of-session sync and status line run on their own. Paste the kickoff message:

**worker-l** (Luca's account):

> You are **worker-l**, a general worker for HC2 Football on Luca's account. Read `CLAUDE.md` and
> `docs/agents.md`, then run `/work`. Report everything through `bash tools/agent.sh`; the taskmaster reviews it.

**worker-f** (the co-designer's account):

> You are **worker-f**, a general worker for HC2 Football on the co-designer's account. Read
> `README-friend-sessions.md`, `CLAUDE.md` and `docs/agents.md`, then run `/work`. Report everything through
> `bash tools/agent.sh`; the taskmaster reviews it.

A worker with no tasks says so and stops. Come back to it (or say "work") once the taskmaster has assigned something.
