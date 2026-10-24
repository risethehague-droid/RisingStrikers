# Test Lab revamp: the plan (t-001, stage 1)

Luca (23 Oct, 22:31): "revamp the entire test lab to have a professional grade UI, and that is easy to use, but can
give us all the data that we want and give us all the permutations of different things we might want to test.
Please reference in industry standards for game testing. Make sure that it is accessible for us, though, because we
are beginners in this field. Make sure you include all the actions, the animations."

## Plain version (read this first)

Luca on the first preview: "too technical for us". So the new Lab looks like a game menu with **three big buttons**:

1. **Check the game.** One press plays every automatic test (about 10 minutes). A traffic light shows the result:
   green = all the same as before, amber = something changed, red = something broke. You only look at what changed,
   in football words ("K12: was a goal, now the keeper pushes it away"), with a clip of last time and now.
   Looks right → OK. Looks wrong → report it.
2. **Try a move.** Pick a move from pictures (chip, lob, header, volley, keeper dive...), watch your player do it,
   then thumbs up or down, with a note if you like.
3. **Look at the animations.** Flip through every animation of every kit. Mark "looks right" or "looks wrong".

**Report a bug** and **Bug Watch** are always on screen. Everything else (all the numbers, the combinations, the
history, every move in the code) sits behind **Advanced (for Claude)** at the bottom.

**Nothing old is lost.** Today's Lab stays as **Lab classic** (`game/lab-classic.html`, the same code) until you pick
the winner. The first preview stays as its own page.

**What we found in today's Lab:**
- The penalty tests can't be checked automatically yet (the checker gets stuck). Fixable in our tools.
- 6 of the 108 automatic tests come out differently by luck (K12, K14, K17, C5, C8, CH6).
- K12 gives a different result depending on which test played just before it. The new check starts every test fresh.
- Two tests miss what they say they should do: the keeper in GK2 doesn't walk up as far as its text says, and in CH6
  the computer usually shoots instead of chipping.
- Every rating is saved with the wrong version number.

**Previews:** "HC2 Test Lab v2" (this design) and "HC2 Test Lab · preview · t-001" (the first, technical one).
**Next:** four building steps, each a pull request you OK. **Three questions for you** are in section 7.

---

## The technical plan

This is stage 1: research, an audit of today's Lab, the design, the build stages, and two clickable prototypes.
Nothing in the real Lab changes in this stage. The build waits for Luca's three decisions (section 7).

- **Prototype v2:** `game/lab/prototype-v2.html` (+ `proto-v2-data.js`, `clips/`), published as the private page
  "HC2 Test Lab v2". The three beginner screens in front; every v1 screen under "Advanced (for Claude)". Clips are
  filmed headless from the real Lab; the sprite pictures are the real atlases for every kit.
- **Prototype v1:** `game/lab/prototype.html` (+ `proto-data.js`, `proto-pitch.jpg`), the private page
  "HC2 Test Lab · preview · t-001", kept as it was. It runs on a snapshot of real data: a headless run of today's Lab
  on v0.9.7, reruns with new dice, and the real sprite sheets. Run plays back recorded results; it doesn't run the game.
- **The real Lab** (`game/lab.html`, `game/lab.js`) is untouched.

---

## 1. Research: what the industry does, in plain words

### 1.1 How a test is written down (ISO/IEC/IEEE 29119-3)
The international standard for test documentation, ISO/IEC/IEEE 29119-3:2021, defines the documents a test effort
produces. The ones that matter for us are the **test case specification**, the **test procedure**, the **test
execution log**, the **actual results / test results** and the **incident report** (a bug report). It marks every
field as mandatory, recommended or possible
([microTOOL summary](https://www.microtool.de/en/document-management/test-documentation-with-iso-iec-ieee-29119-32021/),
[ISO catalogue entry](https://iteh.eu/catalog/standards/iso/b4f42a41-dd8f-446c-9674-238ba5dc90f1/iso-iec-ieee-29119-3-2021)).

For the Lab that becomes one card per test with these fields:

| Field | Plain words | Today's Lab has it? |
| --- | --- | --- |
| ID | `K03`, `GK9` | yes |
| Title | "penalty spot (11 m) → high, TOP corner" | yes |
| Purpose | what it checks and why | partly (the group blurb) |
| Setup (preconditions) | who is on the pitch, where, the weather, the level | only in the code |
| Steps | what happens, in order | only in the code |
| Expected result | what should happen, written down first | in words for some tests (GK, PK, PW), as a number for none |
| Actual result | the outcome and the numbers | yes (the readout, `summary()`) |
| Verdict | pass / fail | no: a person rates "looks right / wrong" |
| Evidence | seed, version, the numbers, a clip | seed yes; version label is wrong (see audit) |

### 1.2 Test types (ISTQB)
ISTQB is the main testing-qualifications body; its glossary is the shared vocabulary.

- **Smoke test:** "a test suite that covers the main functionality of a component or system to determine whether it
  works properly before planned testing begins". Ours: `tools/smoke.js` and the "Quick check" preset.
- **Regression test:** change-related testing "to detect whether defects have been introduced or uncovered in
  unchanged areas". Ours: re-running every automatic test after a change and comparing with the last version.
- **Confirmation test (re-test):** re-running the test that showed a bug, after the fix.
- **Functional test:** does a feature do what it should (the chip goes over the keeper).
- **Soak (endurance) test:** a form of performance testing that runs for a long time to find what only shows up
  over time. Ours: `tools/soak.js` overnight.
- **Performance test:** how fast and smooth it runs (frame time). Not covered today; the headless runner can time it.
- **Exploratory test:** a person plays and judges. Ours: the 39 "you play" tests.

Sources: [ISTQB glossary, smoke test and related terms](https://softwaretestpilot.com/istqb/glossary/smoke-testing),
[ISTQB glossary](https://glossary.istqb.org/en_US/term/stress-testing),
[ISTQB Performance Testing syllabus](https://istqb.org/certifications/certified-tester-performance-testing-ct-pt/),
[soak testing (TechTarget)](https://www.techtarget.com/it-infrastructure/definition/soak-testing).

### 1.3 Permutations without running every combination (NIST combinatorial testing)
NIST's research found that "most software bugs and failures are caused by one or two parameters, with progressively
fewer by three or more", and no failure seen needed more than six. A **covering array** holds every combination of
values for every group of *t* factors at least once; *t* = 2 is **pairwise**. It "can compress all t-way
combinations of values into an amazingly small set of tests": NIST's tool ACTS covers all 1,329,336,000 3-way
combinations of 1,000 on/off factors in 71 tests
([NIST ACTS FAQ](https://csrc.nist.gov/projects/automated-combinatorial-testing-for-software/faqs),
[NIST research programme](https://csrc.nist.gov/Projects/automated-combinatorial-testing-for-software/Our-Research-Program)).
The pairwise benchmark collection shows 4 factors × 3 values (81 combinations) covered in 9-11 tests
([pairwise.org](https://www.pairwise.org/efficiency.html)).

For us: the K group is already a full grid (6 spots × 5 targets = 30 runs). Add the keeper's level (4) and the
weather (3) and the full grid is 360 runs; pairwise covers every pair of those values in 30 (the prototype's
generator, run on exactly that). The rule for beginners: **pairwise to explore, full grid only for 2-3 factors you
really care about, and say the run count before anything runs.** soak.js already rotates its set-ups so pairs of
factors get covered; the matrix builder does the same thing on purpose.

### 1.4 Game test tools as UI models (Unreal, Unity)
- **Unreal Engine, Session Frontend → Automation:** a test list with **Start Tests** for the selected ones (with a
  count), filters for **Errors** and **Warnings**, **Presets** that save a selection plus its settings, a
  Name / Time display switch, results grouped by machine, and **Export** to CSV
  ([Automation System user guide](https://dev.epicgames.com/documentation/unreal-engine/automation-system-user-guide-in-unreal-engine?lang=en-US)).
  Unreal sorts tests into Unit, Feature, **Smoke** ("intended to complete within 1 second"), Content Stress and
  Screenshot Comparison ([Automation test framework](https://dev.epicgames.com/documentation/unreal-engine/automation-test-framework-in-unreal-engine?lang=en-US)).
- **Unity Test Runner:** a tree of tests, a search box, result-icon filter buttons, **Run All** and **Run Selected**,
  double-click to run one, a status icon per test and a counter that updates as it runs
  ([Unity manual: run tests](https://docs.unity3d.com/Manual/test-framework/workflow-run-test.html)).

What we take: the tree + search + filter-by-result, run one / selected / all, presets, a live counter, time per test,
export. What we add for beginners: every test in plain words, and a "start here" page.

### 1.5 Game QA bug reports
A game bug report has a title, category, severity / priority, **steps to reproduce** ("the most important part"),
the current (actual) and expected result, the affected version, how often it happens, the platform and attachments
(screenshots, video, logs). **Severity** is how harmful the bug is (Minor to Blocker); **priority** is how soon to
fix it (Low to Urgent), kept as a separate choice
([Game Developer: how to report bugs](https://www.gamedeveloper.com/design/how-to-report-bugs)).
Our edge: every Lab run is seeded, so the repro steps and the seed can be written for you.

### 1.6 Repeatability: seeds
A replay is exact when the simulation runs on a fixed step and all randomness comes from a recorded seed
([Bugnet: deterministic simulation for replays](https://bugnet.io/blog/how-to-make-a-game-simulation-deterministic-for-replays)).
The Lab already does this: a fixed 1/60 s step, and `Math.random` swapped for a seeded generator only inside the
simulation (`hook()` in `lab.js`); the default seed is a hash of the test ID, F rolls a new one. The v0.9.5 split was
proved the same way ("the same seeded matches give the same scores"). The new Lab shows the seed on every run, lets
you type one in, and puts it in every saved result and bug report.

### 1.7 Accessibility of the tool (WCAG 2.2 AA)
WCAG 2.2 is the web accessibility standard; level AA is the usual target. What it means for the Lab:

| Criterion | What we do |
| --- | --- |
| 1.4.1 Use of colour (A) | every verdict is a glyph **and** a word (✓ Pass, ✗ Fail, Δ Changed, ≈ Dice, ! Can't run) |
| 1.4.3 Contrast (AA) | text at 4.5:1 or more in both themes |
| 1.4.11 Non-text contrast (AA) | focus rings and control edges at 3:1 |
| 2.1.1 Keyboard (A) | every control is a real button or field; shortcuts listed next to each control |
| 2.4.7 Focus visible (AA) / 2.4.11 Focus not obscured (AA, new in 2.2) | a 2 px focus ring; sticky bars never cover the focused control |
| 2.5.8 Target size (AA, new in 2.2) | click targets at least 24 × 24 px |
| 3.2.6 Consistent help (A, new in 2.2) | the Glossary button in the same place on every page |
| 3.3.2 Labels or instructions (A) | every field labelled; each test says what to press |
| plain language | every term has a plain-words entry in the glossary and a click-to-explain link |

Sources: [W3C: what's new in WCAG 2.2](https://w3.org/WAI/standards-guidelines/wcag/new-in-22/),
[WCAG 2.2](https://www.w3.org/TR/WCAG22/).

---

## 2. Audit: what the Lab has today (v0.9.7)

Measured with a headless run of every test (`LAB.api.start()` + `LAB.api.summary()`, stepped at 60 Hz like
`tools/grp.js`) on this cloud machine.

### 2.1 The 18 groups

| Group | What it covers | Tests | Runs by itself | You play | You watch | Headless time | Headless outcome |
| --- | --- | --- | --- | --- | --- | --- | --- |
| FP | FREE PLAY | 1 | | 1 | | | |
| K | keeper v shots, 6 spots × 5 targets, 92 km/h | 30 | 30 | | | 39 s | 15 parried, 10 goals, 5 caught |
| KH | keeper v hard and soft shots | 10 | 10 | | | 21 s | 5 goals, 5 saves |
| YS | you shoot at a live keeper | 6 | | 6 | | | |
| C | keeper v crosses | 12 | 12 | | | 34 s | 10 claims, 2 headed goals |
| P | ball physics | 9 | 9 | | | 10 s | all measured |
| M | movement, no ball | 4 | | 4 | | | |
| D | dribbling | 5 | | 5 | | | |
| T | tackles | 6 | | 6 | | | |
| A | air balls | 5 | | 5 | | | |
| PK | penalties | 8 | 6 | 2 | | 105 s | **PK3-PK8 never finish** (2.4) |
| N5 | power lob, rain, snow, injury | 11 | 9 | 2 | | 98 s | all measured |
| PW | power specials | 12 | 8 | 4 | | 80 s | all measured |
| CH | chip shot | 6 | 6 | | | 23 s | all measured |
| GK | keeper AI | 11 | 11 | | | 98 s | all measured |
| SM | special moves, keeper saves | 11 | 7 | 4 | | 46 s | all measured |
| CS | cut scenes | 15 | | | 15 | | |
| BW | Bug Watch clips | 1 | | | 1 | | a placeholder; real clips load from the database on claude.ai |
| **All** | | **163** | **108** | **39** | **16** | **9 min 16 s** | |

The brief said "about 180": the real count is 163 (BW grows with the clips in the database).
"You play" counts the tests flagged `you: true`; PW10, PW11 and SM1-SM3 carry that flag although the Lab presses
SPECIAL itself, so they could run by themselves.

### 2.2 FREE PLAY, cut scenes, Bug Watch
- **FREE PLAY** (`freePlay()`, `fpUI()`): toggles (full SP, max shot, full energy, no keeper, injured, GK view),
  cycles (weather, CPU level, keeper save), move buttons (7 on the ground, power lob 30/60/100%, 5 in the air, 3
  specials + 3 aerial specials, ball to head / waist / feet), an animation player (any of the 46 outfield animations,
  play / loop), 4 tuning sliders (grip, bounce, sprint, shot power), camera zoom, E resets, Q hides the panel.
- **Cut scenes** (CS1-CS15): walk-out, coin tosses, half time, goal + replay, foul + yellow, red, injury, full time,
  golden goal, Rise Up, trophy, the 3 special-save cut scenes. `window.__labCut` lets the game play them in full.
- **Bug Watch review** (BW): clips from the `bugwatch` collection, unrated first; watch again, rate (1 = the game was
  right, 2 = bug, reasons 3-7), **ASK CLAUDE** (three frames + the state + the trace, through `window.claude.use('sample')`).

### 2.3 What it saves
| Where | What | Written by | Read by |
| --- | --- | --- | --- |
| database `ratings` | every rating: test, verdict, reasons, note, `summary()` numbers, seed, replays, speed; FREE PLAY adds tuning + toggles; clips add the clip and Claude's answer | `save()` | the Lab (coloured dots), the taskmaster |
| database `tuning` | SAVE FOR CLAUDE: grip, bounce, sprint, shot + what they mean in game constants, note | `fpUI()` | the taskmaster |
| database `bugwatch` | the clips (written by the game); the Lab writes a `review` on each | `saveClipReview()` | the QA check |
| this browser | ratings + the last 400 log entries, position, zoom, tuning, open sections | `persistLocal()` etc. | the Lab |

The brief named `tuning` and `bugwatch`; **`ratings`** is the third collection and the one written most.

### 2.4 The headless runner and the API the tools rely on
`tools/grp.js`, `tools/gk091.js` and `tools/chipgif.js` load `game/labtest.html` (built by `tools/mklab.sh`) and use:
`window.__lab.active`, `.groups` (`find`, `findIndex`, `.tests`), `.g`, `.i`, `.api.start(fresh)`, `.run`
(`.sc.id`, `.sc.name`, `.result.o`, `.t`, `.endT`, `.gk`, `.marks`), `.zoom`, `.boxes`, and `window.__hc2.game`
(`loop.sleep()`, `step(T, dt)`). **The new Lab keeps every one of these names.**

### 2.5 Findings (things to fix in the build)
1. **PK3-PK8 never finish headless.** `startPenalty()` launches the penalty scene, whose `preload()` loads images;
   loading needs the browser's event loop, and `grp.js` runs a whole group inside one synchronous `page.evaluate`.
   Meanwhile `Match.update` returns early while `penaltyMode` is on, so the Lab's clock stays at 0 s. The overnight
   QA's "every group" run gets "not finished" six times (105 s wasted). Fix in the runner: yield between tests, or
   preload the penalty view first.
2. **`grp.js` runs the 39 you-play tests too.** Nobody presses anything, so each one runs its full 14 s and prints
   "not finished". The runner should skip them (or list them as "for a person").
3. **Every rating and tuning save is labelled `game: 'v0.9.0'`** (hard-coded in `save()` and `tuneText()`), so
   ratings can't be grouped by version. Use `GAME_VER`.
4. **No expected results as data.** Many tests state one in words ("should be a save", "he should NOT come"); none
   is checked. Today a result can only be judged by a person.
5. **Outcomes that depend on the dice aren't marked.** Across three runs of the 108 automatic tests (the Lab's own
   seeds + two passes with new dice), **6 change outcome**: K12, K14, K17 (goal or parried), C5, C8 (claim, goal or
   parry after the header) and CH6 (the computer shot twice and chipped once). 41 give identical numbers every time
   (ball physics, most specials). A single run of these 6 says little: they need a repeat count and a rate target.
6. **Pass / fail dots are colour only** (`#dots i.good / .bad`): WCAG 1.4.1.
7. **Contact frames exist only for kicks** (`KICK_HIT`: pass, kick, shot, super, sp1, sp2, punt, chip). Header,
   volley, diving header, overhead kick, slide, tackle and the keeper's catch / punch have none, so the Lab can't
   check that the ball moves on the right frame for them.
8. **Animation sets with fewer than 8 directions or uneven frame counts** (shot: S 5, N 8, the rest 6; kick: E and
   W 3, the rest 5; super, sp1, sp2: E and W only). Probably intended; the animation browser lists them so someone
   decides once.
9. `tools/chipgif.js` has port 8765 hard-coded (the others read `PORT`).
10. Screenshots taken while stepping in one synchronous loop can show unloaded stadium tiles (black); a runner that
    yields fixes this too.
11. **A test's result can depend on the test before it.** With the same seed, K12 is a parried save when it plays first,
    twice in a row, or after K03, and a goal straight after K11 (which is how the recorded group run had it). The
    same with K17 and new dice: a save on its own, a goal after K16. The keeper's `guard` is not it (it stays 1.00); some other keeper or match state survives `start()` / `cast()`. So a
    group run is repeatable in its own order, but one test on its own (R, or a single test in "Check the game") is not.
    The build resets everything per test (or reloads the match), and proves it: every test gives the same result alone
    and inside its group.
12. **One same-seed mismatch.** In one of four separate page loads today, CH1 gave 45 km/h and a 3.2 m peak instead
    of 46 km/h and 3.1 m, with the same seed, while another heavy headless run shared the CPU. Replays on one page are
    identical (checked back to back, after another test, and after 6 s of real-time FREE PLAY). The likely cause is
    something that finishes loading on the wall clock, or the same leak as 11 (FREE PLAY runs in real time at boot,
    before the first test). Until it is found, the stage-2 "same results before and after"
    proof runs twice on an idle machine, and the runner records a page-load ID with each result.

---

## 3. The design

### 3.0 The beginner screens (prototype v2), in front of everything below
Rules (Nielsen's heuristics: recognition over recall, progressive disclosure; Hick's law; for ADHD: low working
memory, one clear next step): one main action per screen, at most 5 choices visible, short sentences and big text,
times in plain words ("about a minute"), progress as a bar, nothing to remember from one screen to the next, every
result says what to do next. No testing words on these screens (no seed, preset, regression, verdict, target...).

| Screen | One main action | What it shows | The next step it writes down |
| --- | --- | --- | --- |
| Home | pick one of 3 big buttons | Check the game · Try a move · Look at the animations, each with one sentence and a real sprite picture | "Not sure? Start with Check the game." |
| Check the game | Start the check | a progress bar and "about N minutes left", then a traffic light and "98 same as before · 4 changed · 0 broken" | one changed moment at a time, in football words: Watch it (last time / now, side by side), then "Looks right → OK" or "Looks wrong → report it"; at the end "All done" |
| Try a move | pick a move (5 at a time, "More moves") | the move played by your player | "Does it look right?" thumbs up / down + an optional note, then "Try another move" |
| Look at the animations | Looks right / Looks wrong | one animation of the chosen kit, big; "Turn him" for the other directions; a bar for how many are done | marking it brings the next one |
| Report a bug (always in the top bar) | Send to Claude | What went wrong? How bad is it (breaks / plays wrong / only looks wrong)? | the Lab adds the test and replay numbers for Claude |
| Bug Watch (always in the top bar) | watch a clip | the clips the game kept | "The game was right" or "It's a bug" |
| Advanced (for Claude) | | every v1 screen (3.1-3.7): every test, combinations, history and versions, every move in the code, animation frames, data out, glossary | |

How the build does "Watch it": the Lab is the game, so it replays that test on the pitch with last time's dice, then
with today's. No video files (the prototype uses short clips filmed from the real Lab instead).

Section by section, the screens behind Advanced (prototype v1):

### 3.1 Start here
- A three-step first run: pick a preset → watch it run → read the verdict and rate the feel.
- **Presets** (a saved list of tests + settings, like Unreal's):

| Preset | Type | Runs | Headless time (measured) |
| --- | --- | --- | --- |
| Quick check before a PR | smoke | 12 tests + the smoke match at 4 levels | about 1 min |
| Full regression | regression | all 108 automatic tests | about 9 min |
| Lob & chip | functional | 14 (+ N5-4 for you to play) | about 1 min |
| Keepers | functional | 69 (K, KH, C, GK, PK3-8) | about 5 min |
| Compare difficulty levels | matrix | 12 tests × 4 levels = 48 | about 7 min |

- "Where the tests stand" on the current version: how many run by themselves, need you, pass or fail their target,
  changed since the last version, depend on the dice.
- A **glossary** (button in the top bar, `?`) and click-to-explain on every term: test case, seed, new dice,
  expected / actual result, verdict, baseline, smoke, regression, soak, pairwise, full grid, dice-dependent,
  headless, hit boxes, contact frame, severity, priority, repro steps, coverage.

### 3.2 Tests (the catalogue)
- Group list on the left (18 groups, in plain words), search across all 163, filters by type (Automatic / You play /
  You watch) and verdict (Pass, Fail, Changed, Dice, Can't run).
- A table: tick tests to run a selection (with the time it will take).
- The **test case card** (29119-3 shape): purpose, setup, steps, expected result, actual result with every number
  (keeper's read, at his line, speed, top height, rings, bounces), verdict, the dice check, the older version's
  result, evidence (seed, version, headless time); buttons **Run**, **Run × 10 with new dice**, **Report a bug**.
- The setup and steps are written once per test kind (shot, cross, phys, move, tackle, air, pen, pw, gk, cut) from
  how `lab.js` builds them, plus per-test text where a test needs it. Stored as data next to the tests
  (`game/lab/cases.js`), so the taskmaster and the co-designer can edit the words without touching the test code.

### 3.3 Run
- Run one test, a selection, a group, a preset, or a matrix. Every run has a seed; **Repeat N** with new dice.
- Playback: replay (R), play / pause (Space), **step one frame** (`.`), speed 0.25× / 0.5× / 1× / 2× / 4×, type a
  seed, new dice (F), hit boxes (H), zoom. (Today: R, F, T for 1 / 0.5 / 0.25, H.)
- The live numbers beside the pitch (today's readout), the verdict on the pitch as glyph + word, a queue with a
  progress bar and a running count.
- **Rate the feel** stays exactly as today (1 / 2, reasons 3-7, a note): the numbers say what happened, the person
  says whether it looked right. Both are saved.
- Two layouts to choose from (decision 1): **Focus** (the pitch big, one panel) and **Workbench** (queue, pitch,
  numbers side by side).

### 3.4 Results and data
- **Run history**: every run with its version, preset, seeds and counts.
- **Compare two runs** (two versions, or the same version with new dice): only what moved, with the change in
  km/h and height. The prototype compares the v0.9.7 run with its new-dice reruns; versions use the same screen once
  there is a check file per version.
- **Copy CSV / JSON** of every number (the page can't start a download on claude.ai; a "Save file" button needs the
  page's downloads capability, which the build can add).
- **Report a bug**: title, severity (Blocker / Major / Minor / Cosmetic, each in plain words), priority (Now / Next
  version / Later), what you saw; the version, test, seed, repro steps, expected and actual are filled in.

### 3.5 Permutations: the matrix builder
- Pick a template (Keeper v a shot, The chip, Keeper AI situation), then the **factors** and values:
  shot spot (6), target (5), shot speed, their keeper's level (Easy, Normal, Hard, Rise Warrior), team AI (New,
  Classic), weather (dry, rain, snow), light (day, sunset, night), camera (close, medium, wide), kit, keeper
  position, how long LOB is held.
- **The run count first**: every pair vs every combination, side by side, with the headless time; repeat each with
  new dice (1, 3, 10, 40).
- "List the runs" shows the generated runs with their seeds (the prototype's pairwise generator is real: greedy,
  seeded, every pair at least once).
- Results as a grid (rows × columns, a glyph and a word per cell). The prototype shows the real K grid.
- Every factor can be set from Lab code without touching `game/src`: teams `m.setTeams()`, level `setDiff()` and
  the Lab's own `m.dk` / `m.dkY` overrides, AI `setAiMode()`, weather / light `m.mset` + `m.applyRules()`, camera
  the Lab zoom, plus each test's own knobs.
- Known constraint shown in the UI: the Classic AI ignores most of the level, so Classic × level pairs are flagged.

### 3.6 Every action
61 moves and match events, read from `actions.js`, `ball.js`, `specials.js`, `keeper.js`, `matchflow.js`,
`penalties.js`, `replay.js`, `ui.js` and `cup.js`. For each: where it lives in the code, the FREE PLAY button that
fires it today, the tests that cover it, and a coverage state. Today: **22 have a test and a FREE PLAY button, 27 a
test only (no button to fire them by hand), 12 nothing yet**. The gaps are set pieces (kick-off, throw-in, corner,
goal kick, free kick and wall), keeper distribution (throw, roll, punt, goal kick), punch, switch player, block /
steal, substitution, added time and the shoot-out. "Try it" fires the move in free play. Stage 4 adds tests for the
gaps (most of them as cut-scene style watch tests first).

### 3.7 Every animation
- A browser over every sprite sheet: 7 outfield kits and 6 keeper kits (each on the same rig), the referee; then
  props and effects (`fx`: 31 effects, ball, goals, coin) in the build.
- Every animation in all 8 directions playing at once; click one to step frame by frame (`,` `.`); the fps is the
  game's (`KICK_RATE`, else the Lab's 12); the **contact frame** marked from `KICK_HIT`; a missing direction says what
  the Lab falls back to; uneven frame counts flagged.
- 78 animations across the three sheets, 349 clips (animation × direction). Counts in the prototype are from
  `assets/manifest.json`.
- "Play on my player" sends it to free play (today's animation player).

### 3.8 What stays exactly as it is
Every existing test with the same setup and the same seeded results; FREE PLAY with all its buttons and sliders; the
cut scenes; Bug Watch review and ASK CLAUDE; saving tuning; the three database collections and their fields (new
fields only get added); `tools/grp.js` and the API in 2.4; the keyboard keys people already use (R, F, B, N, H, T,
G, 1-7, E, Q, - = \\).

---

## 4. Data model (what a run record looks like)

```
run      { id, at, version, preset | selection | matrix, by: 'lab' | 'headless', settings: { speed, level, ai, weather, ... },
           items: [ { test, seed, outcome, numbers: summary(), verdict, target, ms } ] }
rating   (today's `ratings` doc) + run id
bug      { title, severity, priority, version, test, seed, steps[], expected, actual, note, evidence, run id }
target   { test, text, check: { kind: 'outcome' | 'range' | 'compare' | 'rate', ... }, by, at }
```

---

## 5. Build stages (each one pull request, each reviewable on its own)

| Stage | What | Files | Size | Proof |
| --- | --- | --- | --- | --- |
| 2 · Classic + split + frame | **Lab classic:** today's `lab.html` + `lab.js` copied unchanged to `game/lab-classic.html` + `game/lab-classic.js`, reachable until Luca picks the winner. Then split the new `lab.js` by area into `game/lab/` (run loop + hooks, test builders, panel, free play, clips) with no change in behaviour, and the new frame (top bar with Report a bug and Bug Watch, Home with the 3 buttons, Advanced) with today's screens inside it | `game/lab-classic.*` (new, copies), `game/lab.html`, `game/lab.js` → `game/lab/*.js` | M: ~1,300 lines moved, ~350 new | `lab-classic.js` byte-identical to today's `lab.js`; the same `summary()` for all 108 automatic tests before / after, in group order (a dump like the prototype's, diffed, twice); `GROUP=CH grp.js`; smoke |
| 3 · The three main screens | Check the game (fresh start per test, see finding 11; traffic light; changed moments in football words; Watch it replays last time / now on the pitch; OK / report it), Try a move (15 moves on picture cards, fired in free play), Look at the animations (every kit, Turn him, looks right / wrong); Report a bug; answers saved per decision 3 | `game/lab/*` | L: ~900 new | a check on an unchanged build says "0 changed"; every test gives the same result alone and in its group; screenshots incl. phone width |
| 4 · Advanced (for Claude) | every v1 screen: every test as a test case, combinations with the count first, history and versions side by side, copy the data out, every move in the code with Try it, animation frames with contact frames, glossary; the version label fixed | `game/lab/*` | L: ~800 new | a 30-game combination run headless; every animation opens |
| 5 · The checker | `grp.js`: skip you-play tests, `JSON=1` output, compare with the last OK'd check, yield between tests (fixes PK), luck repeats (decision 2), a timing column; `chipgif.js` reads `PORT`; one check file per version | `tools/grp.js`, `tools/mklab.sh`, `tools/chipgif.js`, `game/lab/*` | M: ~400 | PK3-8 finish headless; an unchanged build shows 0 changed |

- No stage touches `game/src/*`. Contact frames for headers and volleys **in the game** (not only in the Lab) would
  be a separate gameplay card.
- Stage 2 adds files under `game/lab/` and `game/lab-classic.*`: `/publish` has to ship them next to `lab.html`, as
  it does `src/*.js`, and publish Lab classic as its own page.
- `tools/mklab.sh` keeps building `labtest.html` from the new `lab.html`; the tools keep the API in 2.4.
- The QA lane brief (`docs/lanes/qa.md`) gets the new checker options after stage 5 (the taskmaster's file).

---

## 6. Accessibility checklist for every stage
Glyph + word for every state · 4.5:1 text, 3:1 controls · real buttons, visible focus, nothing sticky covering it ·
targets ≥ 24 px · the glossary button in the same place · every field labelled · reduced motion respected (sprites
start paused) · works at 400 px wide (the pitch on top) · both themes.

---

## 7. Decisions for Luca
Three questions, in plain words. Each has a recommendation.

**1. "Check the game" compares with...?**
- A · the last check you said OK to.
- B · the version before.
- **Recommended: A.** Then "same as before" means "same as what you already approved", and a change you OK'd stops
  coming back. (Technical: a check file per OK'd check, written by the checker and kept in the repo; the Lab reads it.)

**2. Moments that depend on luck** (like K12: sometimes a goal, sometimes the keeper pushes it away)
- A · the check plays them 10 times and only tells you when the mix changes (for example "was a goal 6 times in 10,
  now 2 in 10").
- B · play them once and tell you every time they come out differently.
- **Recommended: A.** B gives false alarms (the 4 "changed" in the preview are exactly that). A makes the check about
  5 minutes longer. (Technical: a repeat count and an outcome mix per test; CH6 and PW7 get a "how often" target.)

**3. Where do your answers go** (OK, report it, thumbs up / down, bug reports)?
- A · into the Lab. Claude reads them the next time it checks.
- B · you copy them into the chat yourself.
- **Recommended: A.** Nothing to remember and nothing to paste. (Technical: the Lab's database, next to the
  `ratings`, `tuning` and `bugwatch` collections it already writes.)

The v1 questions (Focus or Workbench layout; change detector or written targets) are settled by v2: the beginner
screens replace the run layout, the check works as a change detector, and the 29 draft targets live under Advanced
(on v0.9.7: 22 pass, 2 fail (GK2, CH6), 4 can't run headless, 1 needs repeats).

---

## 8. How the prototypes were made
- `proto-data.js` (v1) and `proto-v2-data.js` (v2) are generated from a headless run of today's Lab: every automatic
  test once with the Lab's own seeds (the summary numbers) and the outcome of passes with new dice (one in v1, two in
  v2), plus the manifest and the sprite frame positions (v1: the IS outfield, IS keeper and referee sheets; v2: every
  kit). The scripts are in the worker's scratch space; stage 5 turns them into `GROUP=... JSON=1 node tools/grp.js`.
- `clips/` (v2): short clips filmed headless from the real Lab with hit boxes off, 12 frames a second: the four
  moments that came out differently (filmed with the test before them first, the way the group played them) and 15
  moves (free-play buttons, plus K03, SM5 and C1).
- `proto-pitch.jpg` is a still of the real Lab (test GK4) taken headless.
- Sprites load from `../assets/sprites/` in the repo (and from the preview's own copy on claude.ai). No art was made.
