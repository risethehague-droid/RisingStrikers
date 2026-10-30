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

## The message board (agents/messages/)

The co-designer, 29 Oct: "Lets optimise this message board fully. We want you communicating in a lot more details."
Luca, 29 Oct 02:24: "make it so you and his agent speak to each other and coordinate more directly" and "be extensive
in your conversations and questions and report back to us regularly".

**Why it's here:** HQ's Messages section can't be reached by the Claude sessions on the co-designer's account. His
account gets "no access" to HQ's data from Claude Code, because Luca's organisation doesn't let invited editors use
artifact data there. Every session on both accounts can already write to the agents branch, so the agents talk here.
HQ's Messages stays the place where Luca and the co-designer read and write, and the taskmaster check mirrors the two
(below).

**Who:** `luca`, `co-designer`, `taskmaster`, `worker-l`, `worker-f`, `check`, `qa`, `all`. These are the same names as
HQ's Messages.

**The commands:**
- **Ask or tell:** `bash tools/agent.sh msg <from> <to> <file>`. Add `--card t-040` when it's about a card and
  `--urgent` when it can't wait.
- **Reply:** `... msg <from> <to> <file> --re <id>`. Add `--close` to the reply that settles it.
- **Session log:** `... msg <from> all <file> --log`. It needs no answer (template below).
- **Read:** `bash tools/agent.sh board <you>` shows the threads where it's your turn: one sent to you or `all`, or one
  you started that got a reply. `board --all` shows every thread, `board --logs` the latest logs, and `thread <id>` a
  whole thread.
- Every session's start line says how many messages are waiting, and for whom, plus the latest log.

**The rules:**
1. **Read first.** At the start of every session or run, run `board <you>` and answer what's yours before new work.
   Answer with full context: what you checked, what you found, what you'll do and when. No one-word replies.
2. **Ask instead of guessing.** Ask on the board when you need something from another agent: a decision, a clash
   between branches, "is anyone touching teamai.js?", "can #57 and #58 merge in either order?". Write it so it can
   be answered without your chat.
3. **Post a session log** after every substantial piece of work, and before a session stops or runs out of credits. That
   is how the agents see what the people asked for in chats they can't read. Shape:
   ```
   # <session> log · <date> · <topic(s)>
   ## What the person asked (their words, quoted, with the time)
   ## Decisions (who decided, what, why)
   ## What was built / changed (branches, PRs, commits, previews)
   ## Numbers (tests, soaks: before -> after)
   ## Open questions (who each is for)
   ## Next (what this session does next; what it needs from others)
   ```
   Quote the person's own words for anything they decided. Never include keys, tokens, passwords or anything private
   that isn't about the game.
4. **Urgent:** use `--urgent`. A session on Luca's account also rings HQ's doorbell (an HQ comment starting
   "Claude:"). A session on the co-designer's account can't post HQ comments, so it asks him to ring it.
5. **Close what's settled:** the reply that answers a thread gets `--close`.

**The taskmaster check mirrors HQ <-> the board** at the start of every run (it reads both):
- An HQ message to or from `co-designer` or `worker-f` gets a copy on the board, from the same sender, with
  `--card hq-<HQ message id>`.
- A board message to `luca` gets a copy in HQ's Messages, so Luca sees it there.
- When a thread is closed on one side, it gets closed on the other.
- The run summary it posts to `all` lists the threads it mirrored.

## How a task goes

1. **Split** (taskmaster, with Luca): a job is cut into tasks, one agent each. For every task:
   - a Taskboard card, id `t-NNN`, owner `worker-l` or `worker-f`, status Ready
   - a brief: `bash tools/agent.sh assign <agent> $(bash tools/agent.sh next-id) <file>` (template below)
2. **Work** (the worker, `/work`): it reads the brief, works on `<agent>/t-NNN-<topic>`, tests, opens a pull request,
   then sends a report: `bash tools/agent.sh report <agent> t-NNN done <file>`.
   - Stuck: `blocked`. Needs an answer: `question`.
3. **Review** (taskmaster, `/inbox`): 3 times a day (08:39, 13:39, 20:39 Dutch time; every 2 hours with HQ's ⚡ Turbo on), the scheduled check on Luca's account
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
- the tests to run and what they must show (smoke "errors []", Test Lab group X, ...)
- the PR has its `## Preview` section: the GIF of <what to show> and `Test Lab: <ids>` (CLAUDE.md "Pull requests")
- a new or changed move: its FREE PLAY button in `FP_MOVES` (game/lab.js), tagged IN THE GAME / LAB ONLY, named in "How to try it" (CLAUDE.md "Testing" 6)

## Notes
Anything that saves time: where the code lives, what was tried, what to avoid.
```

## Starting a worker session

**Quickest:** open the link for your worker while signed in to your own account. It opens claude.ai/code with the
kickoff message and the repository already filled in. Check, then press Enter:
- [worker-l link](https://claude.ai/code?prompt=You%20are%20worker-l%2C%20a%20general%20worker%20for%20HC2%20Football%20on%20Luca%27s%20account.%20Read%20CLAUDE.md%20and%20docs%2Fagents.md%2C%20then%20run%20%2Fwork.%20Report%20everything%20through%20bash%20tools%2Fagent.sh%3B%20the%20taskmaster%20reviews%20it.&repositories=risethehague-droid%2FRisingStrikers) (Luca's account)
- [worker-f link](https://claude.ai/code?prompt=You%20are%20worker-f%2C%20a%20general%20worker%20for%20HC2%20Football%20on%20the%20co-designer%27s%20account.%20Read%20README-friend-sessions.md%2C%20CLAUDE.md%20and%20docs%2Fagents.md%2C%20then%20run%20%2Fwork.%20Report%20everything%20through%20bash%20tools%2Fagent.sh%3B%20the%20taskmaster%20reviews%20it.&repositories=risethehague-droid%2FRisingStrikers) (the co-designer's account)

Before you press Enter:
- **Repository:** only `risethehague-droid/RisingStrikers`, branch `main`. With two or more repositories, the
  start-of-session sync and status line don't run.
- **Permission mode:** Auto if it's offered, otherwise Accept edits. Plan stops for your approval on every task.
- **Environment:** Default is fine.

**By hand:** start a new session at claude.ai/code, pick the repository in the selector under the message box, and
paste the kickoff message:

**worker-l** (Luca's account):

> You are **worker-l**, a general worker for HC2 Football on Luca's account. Read `CLAUDE.md` and
> `docs/agents.md`, then run `/work`. Report everything through `bash tools/agent.sh`; the taskmaster reviews it.

**worker-f** (the co-designer's account):

> You are **worker-f**, a general worker for HC2 Football on the co-designer's account. Read
> `README-friend-sessions.md`, `CLAUDE.md` and `docs/agents.md`, then run `/work`. Report everything through
> `bash tools/agent.sh`; the taskmaster reviews it.

A worker with no tasks says so and stops. Come back to it (or say "work") once the taskmaster has assigned something.
