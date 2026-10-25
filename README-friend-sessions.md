# HC2 Football: start here (sessions on the co-designer's account)

You are a Claude session working on HC2 Football from the **second Claude account**, the co-designer's.
Read this file first, then `CLAUDE.md` (the full house rules), then your lane brief in `docs/lanes/`.
Your account can't see Luca's chats, memory or workspace: everything you need is in this repo or on the Taskboard.

## What HC2 is

A 16-bit pixel football game for the Help Out Hague Cup II, a football event in The Hague.
Plain JavaScript on Phaser 3, no build step. Six teams: IS, IRO, USCS, LUC, THUAS, AUC.
All art is made in PixelLab and Aseprite. The official game and its Test Lab are pages on Luca's claude.ai account.

## Who's who

| Who | Role |
| --- | --- |
| Luca | Owner. Gives the final OK on anything that goes live. |
| The co-designer (your person) | Design & Vision, Stadiums & maps. Works through sessions like you, on his own account. |
| Claude, the taskmaster (Luca's account) | Splits work into cards, checks every pull request, merges into `main`, publishes the official game. |
| Lane agents (Luca's account) | Gameplay & AI, Art, QA overnight. |

## Your lanes

- **Design & Vision:** game design, themes, where the game goes next. Notes and pitches go in `design/` as Markdown. Questions that need a decision go on the board as cards.
- **Stadiums & maps:** new stadiums, pitches and maps. Read `docs/lanes/stadiums-maps.md` before making anything: it covers how the pitch is projected, the tile grid and sizes, the layers, the palette and the board rules. Raw exports go in `art/stadiums/<name>/`.

## House rules (short list; `CLAUDE.md` has all of them)

1. **Art comes only from PixelLab or Aseprite.** Never draw sprites or tiles in code or with other image tools. Generate only when a person on the team asks for it.
2. **Other games are style recipes in words only.** Never feed their images to PixelLab.
3. **Kits carry only the team emblem.** Pitch boards show sponsors and the venue only. "RISE" appears only where it already is.
4. **No keys or passwords** in the repo, on the board, or in chat. Ever.
5. **Say where work happens:** [cloud], [PixelLab], [Aseprite], [claude.ai], [GitHub], [your laptop].
6. **Short, scannable replies:** decision first, bullets, short sentences.
7. **PC first.** The phone version is on pause.

## Setup (each session)

1. The repo `<owner>/hc2-football` is attached to the session; you push with your person's GitHub access.
2. Run the game: `cd game && python3 -m http.server 8765`, then open `http://localhost:8765/index.html` (game) or `http://localhost:8765/lab.html` (Test Lab).
3. Tests use Node with Playwright and Chromium (`npm i playwright` if it's missing). With the server above running:
   - `node tools/smoke.js`: a match at all four difficulty levels. It must end with `errors []`.
   - `GROUP=CH node tools/grp.js`: one Test Lab group (`GK`, `CH`, `SM`, ...). Run the groups your lane brief lists.

## How you work

1. **Card:** your account can view the Taskboard but can't change it, so you don't manage cards. Pick the card you're working on and mention it in the pull request. No card yet? Just open the PR; it gets one (step 7).
2. **Branch:** start from the latest `main`: `git checkout -b friend/<topic>`.
3. **Change:** keep it small and focused. Touch only the files your lane brief lists. If you must touch another area's file, say why in the pull request.
4. **Test:** run the tests above and the ones in your brief.
5. **Your own preview page (optional now):** Luca's side builds an "HC2 PR #N preview" page from your branch for every PR (step 7), so you no longer need to share one. For trying things yourself you can still publish your branch as your **own private page** (`HC2 Football · preview · <topic>`).
   - The game is about 300 files and one publish takes at most 255, so publish twice to the same page.
   - Never publish to Luca's game or Test Lab pages. HC2 HQ is the one page you may publish yourself (CLAUDE.md, "HC2 HQ is the exception").
6. **Pull request:** push and open a PR. Put in the description:
   - what changed and why
   - how to try it (what to click)
   - which files it touches
   - how many PixelLab generations it used
   - the **`## Preview` section**: once the PR has its number, record a GIF with `tools/preview.js`, commit it on your branch as `docs/previews/pr<N>-<topic>.gif`, and add the one line `Preview: docs/previews/pr<N>-<topic>.gif · Test Lab: <tests or none>`. CLAUDE.md "The `## Preview` section" has the exact shape and commands.
7. **Card: automatic.** Every open PR from a `friend/` branch gets a **Needs OK** card on its own, with the PR's title, description and link, plus its preview: your GIF playing, **Play it** (your branch on top of today's `main` as a game) and **Try it in the Test Lab** (the tests on your `Preview:` line). A scheduled task on Luca's account checks GitHub every 2 hours, 09:00 to 23:00 Dutch time, so allow up to 2 hours.
8. **Review:** the taskmaster checks it and writes a verdict on the card. Luca decides:
   - **OK:** the taskmaster merges and publishes.
   - **Not yet:** fix it on the same branch and push. The card moves back to Needs OK on its own at the next check.
   - **No:** the branch is closed.

## Your second session: worker-f

Next to your main session you run **worker-f**, a general worker: it does whatever task the taskmaster assigns it
(code, tests, docs or art) and reports back into the agents folder. You don't manage its tasks: the taskmaster does.

- **Start it:** open the [worker-f link](https://claude.ai/code?prompt=You%20are%20worker-f%2C%20a%20general%20worker%20for%20HC2%20Football%20on%20the%20co-designer%27s%20account.%20Read%20README-friend-sessions.md%2C%20CLAUDE.md%20and%20docs%2Fagents.md%2C%20then%20run%20%2Fwork.%20Report%20everything%20through%20bash%20tools%2Fagent.sh%3B%20the%20taskmaster%20reviews%20it.&repositories=risethehague-droid%2FRisingStrikers) while signed in to your account: it fills in the message
  and the repository. Keep only that one repository, choose Auto (or Accept edits), press Enter. By hand: a new
  session at claude.ai/code with only the `RisingStrikers` repository, then paste:
  > You are **worker-f**, a general worker for HC2 Football on the co-designer's account. Read
  > `README-friend-sessions.md`, `CLAUDE.md` and `docs/agents.md`, then run `/work`. Report everything through
  > `bash tools/agent.sh`; the taskmaster reviews it.
- **Keep it going:** when it says it has no tasks, leave it. Say "work" in it later, or check the status line every
  session prints when it starts (`[agents] open tasks: ...`).
- It shares your account's usage limits with your main session.
- Your main session can report through the folder too: `bash tools/agent.sh report co-designer note done <file>`.
- How it all fits: `docs/agents.md`.

## Staying in sync

- **Automatic:** every time a session starts or resumes, it brings in the latest `main` (`tools/sync.sh --start`, run by the hook in `.claude/settings.json`). The first thing you see is a `[sync]` line saying what came in. Hooks don't run in a session with several repositories or in a project thread: run `/sync` there.
- **`/sync`:** the full version. It brings in `main`, runs the smoke test, and then you republish your preview. Run it before you open or update a PR.
- If it reports a clash and you can't resolve it cleanly: stop and note it in the PR. The taskmaster resolves it.
- **Branches made before v0.9.5:** `main` split `game/game.js` into `game/src/` (17 files, every method moved unchanged). `/sync` on such a branch reports a clash on `game/game.js`. Fix: move each of your `game.js` changes into the file that now holds that code (`grep -n "<a line you changed>" game/src/*.js` finds it), delete `game/game.js`, then run `/sync` again.

## PixelLab

- Use the co-designer's own PixelLab plan if he has one.
- If Luca has given him Luca's key:
  - keep it only in this session's own environment (e.g. an environment variable or his own PixelLab connection), never in a file
  - it spends Luca's monthly generations, so ask on the board before any batch over about 50
  - list the generations used in every PR
- Prompts that worked: say "with no ball anywhere in the picture" for kicking moves (PixelLab likes to draw one). Match the palette and reference images in `docs/pixellab/`.

## Never

- push to `main` or merge pull requests
- publish to, or change, Luca's game or Test Lab pages (HC2 HQ is the exception: CLAUDE.md, "HC2 HQ is the exception")
- delete files: propose deletions in the PR instead
- add libraries or a build step without a card Luca has OK'd
- change another lane's files without saying so in the PR

## Links (they need Luca's invite to open)

- Taskboard: https://claude.ai/artifact/PtvBPpqTta99vWSSfSBoX4
- Team setup (how the accounts and sessions fit together): https://claude.ai/artifact/8QEZs4UX4XEGYGWYdqPssF
- HC2 Football: https://claude.ai/artifact/AD1rvV13DR3nvQPzfsRojf
- Test Lab: https://claude.ai/artifact/Goa4b8PepGxbqv9877pPCV
