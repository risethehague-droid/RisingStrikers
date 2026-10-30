---
title: LAN step 2 - play each other: a two-player LAN match, served from one laptop on the Wi-Fi
lane: lead
card: q-lan-play, step 2 (needs Luca's OK; step 1 = t-041, PR #56)
written: 2026-10-30 19:55, the co-designer's main session, from the co-designer's real 2-PC test
---

# LAN step 2: two players, two PCs, one match

The co-designer, 30 Oct 19:48, after the step 1 test: "Okay, how do we play with each other now?" Then, 19:54:
"Write the brief and send it in as a PR. It should find a way to automate the process of the code sending. We dont
want to do that everytime. **Players should only have to press Host or Join**." Luca, 29 Oct: "We dont have
controllers so lets do real LAN."

This brief is written for the taskmaster to assign, as is or changed (`agent.sh assign <agent> <id> docs/lan-step2.md`).
It needs Luca's OK first: it's the biggest change to how the game runs since the smarter AI.

## What step 1 found (30 Oct, 19:36–19:48, two real PCs on one home Wi-Fi)
| Where tools/lan/lantest.html ran | Result |
|---|---|
| Published on claude.ai (a private artifact) | **Blocked on load**: "RTCPeerConnection is blocked here (it does not exist on this page)". The artifact sandbox removes WebRTC, so no PC-to-PC link from any claude.ai page. |
| The same file opened locally (double-clicked), no STUN | **CONNECTED** on both. Chat both ways "instantaneously". Ping x20: **min 6.0 · avg 34.5 · max 121.0 ms (20/20)** |

So:
- **The Wi-Fi is fine.** Host / mDNS candidates connect, with no STUN and no internet.
- **The lag is fine on average** for a football match, but **121 ms spikes happen**. The design must hide them: no
  lockstep on raw input.
- **LAN play can't run from the published game on claude.ai.** It runs from a copy of the game served on one laptop
  in the room (plan B in tools/lan/README.md).

## How real football games and others do it
- **FIFA / EA FC and eFootball online:** one side or a server runs the match (it is authoritative). Each player's
  inputs travel to it, the state comes back, and the client hides the lag with a little input delay plus smoothing.
  When the line spikes, the game slows or warps players briefly rather than letting the two sides disagree.
- **Sensible Soccer and Kick Off on the Amiga** had a 2-machine cable link: one host, the other sending joystick
  input. The no-server "type the host's address" LAN of old PC games is the model for HOST / JOIN here.
- **Rocket League and fighting games** use rollback. It's too big for a first step and needs a fully deterministic
  sim; we skip it.
- On the pitch it must still feel like football:
  - kick-off, set pieces, goals, half time and the replays all show the same on both screens, at the same moment
  - both players see the same score and clock
  - a pause or a disconnect stops the match for both, and nobody plays on alone

## What to build

### 1. Serve the game on the Wi-Fi, and swap the codes automatically
The rule from the co-designer: **players only press HOST or JOIN.** No codes on screen, no copy-paste, no chat app.
The step 1 code swap happens behind the scenes, through the laptop that serves the game.

- `tools/lan/serve.py`: a tiny Python 3 server (standard library only, no installs) that:
  - serves `game/` on port 8770 to the whole Wi-Fi (`0.0.0.0`)
  - is the **matchmaker**. HOST posts its WebRTC offer to `POST /lan/host` and gets a room. JOIN asks
    `GET /lan/rooms`. With one room open it joins straight away; with several it shows the hosts' names to pick. The
    guest posts its answer to `POST /lan/answer/<room>`, and the host collects it by long-polling
    `GET /lan/answer/<room>`.
  - Rooms close when the match starts or after 2 minutes unanswered.
  - does nothing else: it never carries match traffic, which goes PC-to-PC over WebRTC, as step 1 proved works here
    (avg 34.5 ms)
- **Starting it: one double-click, not a terminal.**
  - `tools/lan/Start LAN.command` (Mac) and `tools/lan/Start LAN.bat` (Windows) start serve.py and open the game in
    the browser on that laptop.
  - The laptop's window and the game's LAN screen both show the address for the other PC, as a short name where
    the network allows it (e.g. `http://lucas-macbook.local:8770`, the Mac's own network name) and the IP as a
    backup. Write it for a beginner: the co-designer is on a Mac.
- **The other PC types that address once** and bookmarks it. A browser can't find a server on the Wi-Fi by itself,
  so this one-time address is the only typing. After that it's bookmark, then JOIN.
- **Fallback:** if the laptop's firewall blocks the other PC, the LAN screen says so plainly ("PC 2 can't reach this
  laptop: allow Python in the firewall"), with the steps. Keep step 1's hand copy hidden under a small "trouble
  connecting?" link, never in the normal flow.

### 2. A LAN mode in the game
- Start screen: **PLAY ON LAN**, shown only when the page comes from serve.py (it answers `GET /lan/ping`). On
  claude.ai it stays hidden, because the sandbox has no WebRTC.
  - **HOST:** one press. The screen says "waiting for a player… (PC 2: open <address> and press JOIN)". Then come
    team picks, pace, level and settings, as for a normal match.
  - **JOIN:** one press. The screen says "connected to <host's name>", then shows the host's choices.
  - **Like FIFA's friendly lobby:** each player picks his own team (host = home), both press READY, and the walk-out
    and kick-off play on both screens together.
- The connection comes from lantest.html's code, moved into a new `game/src/lan.js`. It's added to `index.html`,
  `lab.html` and `test.html` in load order, per CLAUDE.md.

### 3. The host runs the match; the guest sends inputs
- **Two humans in one match.** Today one global `Input` drives one human: `this.human`, on the home side (match.js,
  `controlHuman` in actions.js). Make it two:
  - `controlHuman(dt)` becomes `controlHuman(dt, side)`, reading an input source per side: the local `Input` for
    the host, and the latest guest input packet for the away side
  - player switching, the special meter, mashes (aerial battle, lob receive duel), charge / hold, lob aim and set
    pieces each read their side's source
  - **The single-player game must play exactly as today.** Prove it: the same seeded matches give the same scores
    before and after (CLAUDE.md "Refactors keep behaviour identical"), before any network code.
- **Guest to host:** each frame, the guest sends the button state (`Input.cur` as bits, plus the stick axis), with a
  frame number. The host applies it 2–3 frames late (input delay ~50 ms) so most packets arrive in time. A late
  packet repeats the last one.
- **Host to guest:** 20–30 snapshots a second, unreliable and unordered (a second data channel), holding:
  - each player's x, y, z, velocity, state, facing and animation key
  - the ball's x, y, z and velocity
  - the score, clock, half, set piece, meters, cards and the cut-in / replay / goal flags
- **The guest draws** the snapshots ~100 ms behind, interpolated, so a 121 ms spike costs at most a brief hitch. It
  never simulates the match itself.
- **Sound, cut-ins, replays and Rami's lines** play on both screens, triggered from the snapshot's flags.

### 4. Edges
- **Pause:** either player pauses both screens, and only the one who paused can resume. Same for QUIT (both go to the
  menu).
- **Disconnect:** both screens show "CONNECTION LOST". After 10 s, both go back to the menu. No AI takes over.
- **Out of scope for step 2:**
  - the cup, watch mode, penalties-only, the Test Lab and resume
  - phones (PC first, per CLAUDE.md)

## Files you may touch
- new: `game/src/lan.js`, `tools/lan/serve.py`, `tools/lan/Start LAN.command`, `tools/lan/Start LAN.bat`,
  `tools/lanmatch.js`
- `tools/lan/README.md`: add the "Play a LAN match" section
- `game/src/actions.js`: `controlHuman` per side
- `game/src/match.js`: two humans; the snapshot hooks
- `game/src/io.js`: input sources
- `game/src/ui.js`: the start-screen button and the LAN overlays
- `game/index.html`, `game/lab.html`, `game/test.html`: lan.js in load order
- Check `bash tools/agent.sh status` for anyone else on these files first. Ask on the board if they clash.

## Done means
1. **The refactor alone:** the same seeded matches give the same scores before and after. `node tools/smoke.js`
   ends with `errors []`.
2. **`node tools/lanmatch.js`:** serve.py running, then two headless pages on loopback that **only press HOST and
   JOIN** (no code handling in the test) play a 1-minute match. Check:
   - the guest's scripted inputs move the away player
   - the score and clock agree on both pages at the end
   - no page errors
   - under a fake 120 ms spike, the guest keeps drawing and nothing desyncs
3. **A FREE PLAY button isn't needed:** there's no new move. Say so in the PR.
4. **The 2-PC test:** the co-designer and Luca run serve.py on one laptop and play a half on two PCs. Put the result
   in the report, with the ping line, how it felt, and any stutter.
5. **The PR:**
   - a GIF of the two pages side by side (record both headless pages)
   - `Preview: docs/previews/pr<N>-lan-match.gif · Test Lab: none`
   - one line saying the published preview can't run LAN (the claude.ai sandbox), so trying it means serve.py

## Notes
- **Keep it small enough to review:** split it into two PRs if it grows.
  1. Two humans plus input sources: no network, provably identical single-player.
  2. lan.js, serve.py (the automatic code swap), the launchers and the snapshots.
- **Determinism isn't needed** (the host is the only sim), so the game's `Math.random` use is fine.
- **Security:**
  - serve.py binds to the local network only; never port-forward it to the internet
  - it serves `game/` and nothing else, and has no file uploads
  - the matchmaker only stores the WebRTC offers and answers in memory, for 2 minutes at most
