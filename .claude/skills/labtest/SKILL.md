---
name: labtest
description: Run HC2 Test Lab groups headless (GK, KP, KC, GH, RS, ...) plus the smoke test and soak, and read the results. Use when someone says "run the Lab tests", "run group X", "check the keeper tests", or before a PR / merge.
---

# /labtest: run the Test Lab groups and read them

1. **Serve the build you're testing** [cloud]: `cd game && python3 -m http.server <port>` started detached
   (`setsid nohup ... &`), one port per worktree (8765 for the main checkout, 8801+ for others). Check it answers:
   `curl -s -o /dev/null -w '%{http_code}' http://localhost:<port>/index.html` → 200. A dead server is the usual
   cause of `ERR_CONNECTION_REFUSED`.
2. **Build the Lab test page** once per checkout and after any change to `lab.html`: `bash tools/mklab.sh`.
3. **Smoke:** `PORT=<port> node tools/smoke.js` → must end `errors []` (a match at all four levels).
4. **Groups:** `GROUP=<id> PORT=<port> node tools/grp.js` (add `REP=10` to repeat for numbers). The ids are in
   `game/lab.js` (e.g. GK keeper positioning, GKX special saves, KP 1v1 range, KC save clash, GH keeper hands, KS, K,
   RS set-piece setup, OF offside, C corners, CH chips, HV headers / volleys, NT the net, SM specials, WG wings).
   Each line: test id, what it sets up → what happened; the group ends `errors []`.
5. **Soak** (before / after numbers): `MATCHES=12 PORT=<port> node tools/soak.js` (`PACE=arcade` for ARCADE). Read the
   summary: `Page errors: 0`, `Real bugs: none`, then goals / saves / time in play per match.
   Compare against `main` on the same command: one run's goals can swing ±1 by dice.
6. **The machine is small (2 CPUs):** at most 2 browser tests at once; more crash with "Target page ... closed".
   Never `pkill` broadly (it can kill your own shell); stop a server by its port.
7. **Report** the way Luca reads it: the group, one line per test in plain words, the totals, and anything red first.
