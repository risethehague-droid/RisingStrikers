'use strict';
// HC2 Football · tutorial.js: THE TUTORIAL - a short, guided, hands-on walk through the controls, from the menu.
// Luca, 31 Oct 2026: "please create a simple tutorial in which you can try the basics and then the advanced stuff
// before you play, make it optional to skip or return back to".
//   PART 1 · THE BASICS:  move, sprint, pass, through ball, lob, shoot, standing tackle, slide tackle
//   PART 2 · ADVANCED:    the SP meter + special shots (LV1, LV3), the LV1 special passes (TORNADO DRILL, BURROW BLAST,
//                         ANGEL GLIDE), the special dribble, your keeper's special save, a corner
// It runs inside the Test Lab page (lab.js turns this list into its TUT group: #TUT / #lab-TUT opens it), because the
// Lab already knows how to put just the right men on the pitch for one moment and play it with the game's own code.
// The menu's TUTORIAL button opens it; skip, back, menu and "back to the game" are always one click (or Esc) away, and
// where you got to is remembered in this browser (localStorage 'hc2-tut'), so you can come back later.
// This file loads on every page but only does something in the Lab (it only defines TUTORIAL).
//
// How real football and other games do it (words only): FIFA / EA FC's first-launch tutorial and Skill Games (one
// control, one target, a tick, the next one - with a "skip" always there), Rocket League's and Mario Strikers' short
// training drills, Inazuma Eleven's special-move tutorials (the move's name, the button, try it once), and real coaching
// sessions: one skill per drill, many short reps, the coach shows it first ("SHOW ME" here plays it for you).
// Made for focus (Luca has ADHD; what the research on attention and learning says works): ONE action per step and one
// short line of text (chunking, low reading load), the key drawn as a key cap (no hunting for it), an instant big
// tick + sound on success and an automatic next step (immediate feedback, momentum), a progress bar that fills
// (visible goals), a worked example on demand (SHOW ME), mistakes cost nothing (it just resets, with a one-line hint),
// and full control: skip, back, leave and come back where you were.
const TUTORIAL = (() => {
  const KEY = 'hc2-tut';
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || 'null') || {}; } catch (e) { return {}; } };
  const store = s => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} };
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const sdKey = () => (window.HC2_KEYS === 'wasd' ? 'O' : 'N');                    // the special dribble button (arcadesp.js)
  const SHIFT = 'SHIFT';

  // ---------- the steps. One action each: `say` (the instruction, short), `keys` (the caps to draw), `set` (who is where),
  // `ok` (true = done, {fail: 'hint'} = reset with a hint, null = keep going), `demo` (SHOW ME: the step's own keys pressed
  // for you), `info` (no action: a GOT IT button), `hold` (s to watch it play out after the tick), `leave` (tidy up).
  // Coordinates are the game's metres: you attack the right-hand goal (x 0-105, y 0-68 top to bottom).
  const BASICS = [
    { id: 'move', n: 'MOVE', say: k => 'Run into the yellow ring.', keys: k => [[k.move, 'run']],
      set(A, r, S) { const p = A.base(r, { gk: false }); A.put(p, 60, 34, 0); A.atFeet(p); S.ring = { x: 70, y: 24, r: 1.6 }; r.marks = [S.ring]; },
      ok(A, r, S) { return dist(r.human, S.ring) < S.ring.r + 0.4; },
      demo(A, r, S, T) { const p = r.human, d = dist(p, S.ring) || 1; T.x = (S.ring.x - p.x) / d; T.y = (S.ring.y - p.y) / d; } },
    { id: 'sprint', n: 'SPRINT', say: k => 'Hold SHIFT while you run to the ring.', keys: k => [[k.move, 'run'], [SHIFT, 'hold']],
      set(A, r, S) { const p = A.base(r, { gk: false }); A.put(p, 58, 40, 0); A.atFeet(p); S.ring = { x: 82, y: 30, r: 1.6 }; r.marks = [S.ring]; S.spr = false; },
      ok(A, r, S) { const p = r.human; if (p.sprinting) S.spr = true;
        if (dist(p, S.ring) < S.ring.r + 0.4) return S.spr ? true : { fail: 'Hold SHIFT the whole way!' }; return null; },
      demo(A, r, S, T) { const p = r.human, d = dist(p, S.ring) || 1; T.x = (S.ring.x - p.x) / d; T.y = (S.ring.y - p.y) / d; T.btn.sprint = true; } },
    { id: 'pass', n: 'PASS', say: k => 'Pass it to your team-mate.', keys: k => [[k.pass, 'pass']],
      set(A, r, S) { const p = A.base(r, { gk: false }), q = A.mate(r, 8); A.put(p, 60, 34, 0); A.atFeet(p); A.put(q, 72, 34, 4); r.bots.set(q, A.receive); S.q = q; },
      ok(A, r, S) { return A.got(S.q) || A.lost(r, S, 4); },
      demo: [[0.5, 0.62, 'pass']] },
    { id: 'through', n: 'THROUGH BALL', say: k => 'Your mate is running. Play it ahead of him.', keys: k => [[k.through, 'through']],
      set(A, r, S) { const p = A.base(r, { gk: false }), q = A.mate(r, 8); A.put(p, 55, 30, 0); A.atFeet(p); A.put(q, 64, 40, 0); r.bots.set(q, A.cpRun(3.4, -0.6)); S.q = q; },
      ok(A, r, S) { if (S.t > 6 && !S.kicked) return { fail: 'Press it sooner, while he runs!' }; return A.got(S.q) || A.lost(r, S, 5); },
      demo: [[0.6, 0.72, 'through']] },
    { id: 'lob', n: 'LOB', say: k => 'A defender is in the way. Lob it over him.', keys: k => [[k.lob, 'lob']],
      set(A, r, S) { const p = A.base(r, { gk: false }), q = A.mate(r, 8), o = A.opp(r, 3); A.put(p, 55, 34, 0); A.atFeet(p); A.put(o, 63, 34, 4); A.put(q, 76, 34, 4);
        r.bots.set(q, A.cpRun(0, 0)); r.bots.set(o, A.sit()); S.q = q; S.o = o; },
      ok(A, r, S) { if (A.got(S.o)) return { fail: 'Not along the ground: use LOB!' }; return A.got(S.q) || A.lost(r, S, 5); },
      demo: [[0.5, 0.62, 'lob']] },
    { id: 'shoot', n: 'SHOOT', say: k => `Hold to power up, let go to shoot. Score!`, keys: k => [[k.shoot, 'hold + let go'], [k.ud, 'aim']],
      set(A, r, S) { const p = A.base(r, { gk: true }); A.spot(r, 87, 33); S.misses = S.misses || 0; },
      ok(A, r, S) { const b = A.m.ball, gk = r.gk;
        if (b.inNet) return true;
        if (!S.kicked) return S.t > 15 ? { fail: 'Hold the shoot key, then let go.' } : null;
        if (A.m.ball.owner === gk || r.out || A.lost(r, S, 3.5)) { S.misses++;
          if (S.misses >= 3) return { ok: 'Good shot - that counts!' };                  // (no one should be stuck here)
          return { fail: S.misses >= 2 ? 'Aim for a corner: hold UP or DOWN as you shoot.' : 'Saved! Try a corner.' }; }
        return null; },
      demo(A, r, S, T) { const side = r.gk.y < 34 ? 1 : -1; T.y = S.t > 0.4 && S.t < 1.1 ? side : 0; T.btn.shoot = S.t > 0.4 && S.t < 1.0; }, hold: 1.2 },   // (the corner away from him)
    { id: 'tackle', n: 'TACKLE', say: k => 'He runs at you. Tackle him as he reaches you.', keys: k => [[k.pass, 'tackle']],
      set(A, r, S) { const p = A.base(r, { gk: false }), c = A.opp(r, 9); A.put(p, 66, 34, 0); A.put(c, 78, 34.3, 4); A.atFeet(c); A.ballLast(c);
        r.bots.set(c, A.dribbleTo(30, 34.3, 2.6)); S.c = c; S.e0 = r.events.length; },
      ok(A, r, S) { const p = r.human, c = S.c, b = A.m.ball;
        if (A.fouled(r, S)) return { fail: 'Foul! Wait until he is right in front of you.' };
        if (b.owner === p) return true;
        if (b.owner === c && c.x < p.x - 2.5) return { fail: 'He got past. Press it when he is close.' };
        return S.t > 9 ? { fail: 'Press it when he is close.' } : null; },
      demo(A, r, S, T) { T.btn.pass = !!S.c && dist(r.human, A.m.ball) < 1.0 && A.m.ball.owner === S.c; } },
    { id: 'slide', n: 'SLIDE TACKLE', say: k => 'Faster this time. Slide in and win the ball.', keys: k => [[k.shoot, 'slide']],
      set(A, r, S) { const p = A.base(r, { gk: false }), c = A.opp(r, 9); A.put(p, 66, 34, 0); A.put(c, 80, 34.3, 4); A.atFeet(c); A.ballLast(c);
        r.bots.set(c, A.dribbleTo(30, 34.3, 4.6)); S.c = c; S.e0 = r.events.length; },
      ok(A, r, S) { const p = r.human, c = S.c, b = A.m.ball;
        if (p.state === 'slide') S.slid = true;
        if (A.fouled(r, S)) return { fail: 'Foul! Slide at the ball, not the man.' };
        if (S.slid && b.owner !== c && S.t - (S.slT = S.slT || S.t) > 0.5) return true;
        if (b.owner === c && c.x < p.x - 3) return { fail: S.slid ? 'Missed! Slide a little earlier.' : 'He got past. Slide when he is near.' };
        return S.t > 9 ? { fail: 'Slide when he is near.' } : null; },
      demo(A, r, S, T) { T.btn.shoot = !!S.c && dist(r.human, S.c) < 3.0 && A.m.ball.owner === S.c; }, hold: 0.8 },
  ];

  const ADVANCED = [
    { id: 'meter', n: 'THE SP METER', info: true, say: k => 'Your SP bars (top left) fill up as you play. Specials spend them. We filled them for you here.', keys: k => [],
      set(A, r, S) { const p = A.base(r, { gk: true }); A.spot(r, 80, 34); A.bars(3); } },
    { id: 'sp1', n: 'SPECIAL SHOT · LV1', say: k => 'One bar = LV1. Press and let go of SPECIAL.', keys: k => [[k.special, 'special']],
      set(A, r, S) { A.base(r, { gk: true }); A.spot(r, 82, 34); A.bars(1); }, ok: (A, r, S) => A.special(r, 1), demo: [[0.5, 0.65, 'special']], hold: 2.2 },
    { id: 'sp3', n: 'SPECIAL SHOT · LV3', say: k => 'Three bars = LV3, the big one. Fire it!', keys: k => [[k.special, 'special']],
      set(A, r, S) { A.base(r, { gk: true }); A.spot(r, 80, 34); A.bars(3); }, ok: (A, r, S) => A.special(r, 3), demo: [[0.5, 0.65, 'special']], hold: 2.6 },
    { id: 'drill', n: 'TORNADO DRILL', say: k => 'Hold SPECIAL, then tap PASS. It spins in the grass and curls round him.', keys: k => [[k.special, 'hold'], [k.pass, 'tap']],
      set(A, r, S) { A.spPassSet(r, 'ground'); }, ok: (A, r, S) => A.spPassed('drill'), demo: [[0.4, 1.0, 'special'], [0.6, 0.72, 'pass']], hold: 2.4 },
    { id: 'burrow', n: 'BURROW BLAST', say: k => 'Hold SPECIAL, then tap THROUGH. It goes under the grass to your runner.', keys: k => [[k.special, 'hold'], [k.through, 'tap']],
      set(A, r, S) { A.spPassSet(r, 'through'); }, ok: (A, r, S) => A.spPassed('burrow'), demo: [[0.4, 1.0, 'special'], [0.6, 0.72, 'through']], hold: 2.4 },
    { id: 'angel', n: 'ANGEL GLIDE', say: k => 'Hold SPECIAL, then tap LOB. A golden lob floats down to him.', keys: k => [[k.special, 'hold'], [k.lob, 'tap']],
      set(A, r, S) { A.spPassSet(r, 'lob'); }, ok: (A, r, S) => A.spPassed('angel'), demo: [[0.4, 1.0, 'special'], [0.6, 0.72, 'lob']], hold: 2.8 },
    { id: 'dribble', n: 'SPECIAL DRIBBLE', say: k => `He squares up to you. Press ${sdKey()} to skip past him (1 bar).`, keys: k => [[sdKey(), 'dribble']],
      tip: () => (typeof SKILL_DRIB !== 'undefined' && SKILL_DRIB ? 'New: square in front = RAINBOW FLICK, from an angle = SHADOW STEP.' : ''),
      set(A, r, S) { const p = A.base(r, { gk: false }), o = A.opp(r, 3); window.__labPace = 'arcade';   // (the special dribble is the ARCADE button, arcadesp.js)
        A.put(p, 46, 34, 0); A.atFeet(p); A.put(o, 51.5, 34.1, 4); r.bots.set(o, A.sit()); A.bars(1); S.o = o; },
      ok(A, r, S) { const p = r.human; return !!(p.sdrib || p.skd) || (S.t > 0.2 && A.m.meters[0].e < 0.99 && A.m.ball.owner === p && p.x > S.o.x + 0.5); },
      demo: [[0.5, 0.62, 'sdribble']], hold: 1.6, leave() { window.__labPace = null; } },
    { id: 'save', n: 'YOUR KEEPER\'S SAVE', say: k => `They shoot at YOUR goal. When "SPECIAL SAVE?" flashes, press ${k.special}!`, keys: k => [[k.special, 'save']],
      set(A, r, S) { A.saveSet(r, S); },
      ok(A, r, S) { const m = A.m, gk = m.home.players[0];
        if (m.saveAsk && !S.asked) { S.asked = true; m.saveAsk.t = Math.max(m.saveAsk.t, 1.6); }     // (a little longer than a match gives you: you're learning it)
        if (gk.spSave > 0) return true;
        if (S.asked && !m.saveAsk) return { fail: 'Too late! Press it the moment it flashes.' };
        if (S.t > 6) return { fail: 'Watch for the flash, then press it.' };
        return null; },
      demo(A, r, S, T) { T.btn.special = !!A.m.saveAsk; }, hold: 2.4, cam: 'ball' },
    { id: 'corner', n: 'CORNER', say: k => `Your corner! Wait for the players, then press ${k.lob} to cross it in.`, keys: k => [[k.lob, 'cross']],
      set(A, r, S) { A.base(r, { gk: true }); A.fpSet(r, 'corner'); },
      ok(A, r, S) { const sp = A.m.setPiece; if (sp) S.seen = true; if (S.seen && !sp) return true; return S.t > 40 ? { fail: 'Press the lob key when it says YOUR KICK.' } : null; },
      demo(A, r, S, T) { const sp = A.m.setPiece; T.btn.lob = !!(sp && sp.setup && !sp.su && sp.team === A.m.home && (S.dt0 = S.dt0 || S.t) && S.t - S.dt0 > 0.5 && S.t - S.dt0 < 0.62); },
      hold: 3, cam: 'ball' },
  ];
  const PARTS = [
    { id: 'basics', n: 'PART 1 · THE BASICS', short: 'BASICS', mins: 3, steps: BASICS, blurb: 'Move, pass, shoot, tackle.' },
    { id: 'adv', n: 'PART 2 · ADVANCED', short: 'ADVANCED', mins: 4, steps: ADVANCED, blurb: 'Specials, special passes, dribble, saves, corners.' },
  ];

  // ---------- the engine: one Lab test (TUT1), the steps played inside it
  let A = null, T = null;                                                         // A: the Lab's helpers (lab.js tutApi), T: the run
  const $ = id => document.getElementById(id);

  function enter(api, r) {
    A = api; const L = A.LAB;
    T = { r, part: 0, i: 0, phase: 'menu', t: 0, S: {}, saved: { boxes: L.boxes, gkv: L.fp.gkv, cpu: L.fp.cpu } };
    L.tut = { key, leave }; L.boxes = false; L.fp.gkv = false; L.fp.cpu = 'easy';   // (no hit boxes, no keeper notes; their keeper on EASY: you're learning)
    ui(); document.body.classList.add('tut'); dispatchEvent(new Event('resize'));
    quiet(); r.cam = camFor({});
    const want = (location.hash || '').match(/tut-?(basics|adv)/i);                // #TUT-basics / #TUT-adv jump straight in
    if (want) startPart(want[1].toLowerCase() === 'adv' ? 1 : 0, 0); else showMenu();
  }
  function leave() {
    if (!T) return; const L = A.LAB; endStep(); L.boxes = T.saved.boxes; L.fp.gkv = T.saved.gkv; L.fp.cpu = T.saved.cpu; L.tut = null; T = null;
    document.body.classList.remove('tut'); const o = $('tut'); if (o) o.remove(); dispatchEvent(new Event('resize'));
  }
  const step = () => T && PARTS[T.part].steps[T.i];
  function quiet() { T.S = { t: 0 }; A.base(T.r, { gk: false }); A.put(T.r.human, 52.5, 34, 0); A.atFeet(T.r.human); T.r.marks = []; }   // (menus: just you and the ball)
  function endStep() { const s = step(); if (s && s.leave && T.phase !== 'menu') s.leave(A, T.r, T.S); Object.assign(Input.touch, { x: 0, y: 0, btn: {} }); }

  function startPart(p, i) { T.part = p; go(i); }
  function go(i) {
    endStep(); const steps = PARTS[T.part].steps;
    if (i >= steps.length) return partDone();
    T.i = Math.max(0, i); T.phase = 'play'; T.t = 0; T.S = { t: 0 }; T.r.marks = [];
    const s = step(); s.set(A, T.r, T.S); T.r.cam = camFor(s);
    const P = load(); P.at = { part: PARTS[T.part].id, i: T.i }; store(P);
    draw();
  }
  function again(hint) { T.phase = 'fail'; T.t = 0; T.hint = hint; draw(); }
  function success(msg) {
    T.phase = 'ok'; T.t = 0; T.okMsg = msg || ['NICE!', 'GREAT!', 'YES!', 'SPOT ON!', 'LOVELY!'][(T.i + T.part) % 5];
    try { SFX.level(3); } catch (e) {}                                // (the meter's level-up chime: a small reward)
    draw(); pop();
  }
  function partDone() {
    endStep(); T.phase = 'done'; const P = load(); P.done = P.done || {}; P.done[PARTS[T.part].id] = true;
    if (P.at && P.at.part === PARTS[T.part].id) delete P.at; store(P); quiet(); draw();
  }
  function demo() { if (!T || T.phase === 'menu' || T.phase === 'done' || step().info) return; T.demoTry = 0; go(T.i); T.phase = 'demo'; draw(); }
  function showMenu() { endStep(); T.phase = 'menu'; quiet(); draw(); }

  // called by the Lab every step (1/60 s) while the tutorial runs
  function tick(r) {
    if (!T) return; const s = step(); r.noAuto = true;
    T.t += A.STEP;
    if (T.phase === 'menu' || T.phase === 'done') return;
    T.S.t += A.STEP;
    const b = A.m.ball, p = r.human;
    if (!T.S.kicked && b.lastP === p && b.owner !== p && !A.m.pending) { T.S.kicked = true; T.S.kickT = T.S.t; }
    if (T.phase === 'demo') {                                                     // SHOW ME: the step's own keys, pressed for you
      const Tc = Input.touch; Tc.btn = {}; Tc.x = Tc.y = 0;
      if (typeof s.demo === 'function') s.demo(A, r, T.S, Tc);
      else if (s.demo) for (const [a, z, k] of s.demo) if (T.S.t >= a && T.S.t < z) Tc.btn[k] = true;
      const res = s.ok ? s.ok(A, r, T.S) : null;
      if (res && res.fail && (T.demoTry = (T.demoTry || 0) + 1) < 3) { go(T.i); T.phase = 'demo'; draw(); return; }   // (a demo that misses - a tackle can - just goes again)
      if (res === true || (res && res.ok) || (res && res.fail) || T.S.t > 12) { Object.assign(Tc, { x: 0, y: 0, btn: {} }); T.demoOk = res === true || !!(res && res.ok); T.phase = 'shown'; T.t = 0; draw(); }
      return;
    }
    if (T.phase === 'shown') { if (T.t > (s.hold || 1.2) + 0.6) { go(T.i); T.hint = ''; } return; }   // (after the demo: your turn, same set-up)
    if (T.phase === 'ok') { if (T.t > (s.hold || 1.0) + 0.5) go(T.i + 1); return; }
    if (T.phase === 'fail') { if (T.t > 1.6) { const keep = T.S.misses; go(T.i); T.S.misses = keep; T.phase = 'play'; draw(); } return; }
    if (s.info) return;
    const res = s.ok(A, r, T.S);
    if (res === true) success();
    else if (res && res.ok) success(res.ok);
    else if (res && res.fail) again(res.fail);
  }
  function camFor(s) {
    return () => { const r = T && T.r, m = A.m, b = m.ball; if (!r) return { x: b.x, y: b.y, sx: 0 };
      const p = r.human, S = T.S;
      if (S.ring) return { x: (p.x + S.ring.x) / 2, y: (p.y + S.ring.y) / 2, sx: 0 };
      if (s.cam === 'ball' || !(b.owner === p || (!b.owner && dist(b, p) < 4))) return { x: b.x + Math.max(-10, Math.min(10, b.vx * 0.35)), y: b.y, sx: 0 };
      return { x: p.x + 4, y: p.y, sx: 0 }; };
  }

  // ---------- keys (lab.js hands every key to us while the tutorial is on; the game still reads its own keys)
  function key(e) {
    if (!T) return; const k = e.key.toLowerCase();
    if (k === 'escape') { if (T.phase === 'menu') toGame(); else showMenu(); return; }
    if (T.phase === 'menu') { if (k === '1') startPart(0, 0); else if (k === '2') startPart(1, 0); else if (k === 'enter') { const b = $('tut-m-first'); if (b) b.click(); } return; }
    if (T.phase === 'done') { if (k === 'enter') { const b = $('tut-d-first'); if (b) b.click(); } return; }
    if (k === 'enter' && step().info && T.phase === 'play') { success('GOT IT'); return; }
    if (k === 'e') go(T.i);                                                       // (E = this step again, as in FREE PLAY)
  }
  // back to the game: the PR / experimental page swaps to its game in place (#play), served from the repo it's index.html,
  // on claude.ai the official game (the Lab was opened in its own tab: that tab closes if it can)
  function toGame() {
    if (window.HC2_PREVIEW) { location.hash = '#play'; return; }
    if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) { location.href = 'index.html'; return; }
    try { if (window.opener) { window.close(); } } catch (e) {}
    location.href = 'https://claude.ai/artifact/AD1rvV13DR3nvQPzfsRojf';
  }

  // ---------- the card on top of the pitch
  const CSS = `
body.tut #panel,body.tut #msfx-open{display:none!important} body.tut #game{right:0!important}
#tut{position:fixed;left:50%;bottom:max(10px,env(safe-area-inset-bottom,0px));transform:translateX(-50%);width:min(620px,calc(100vw - 32px));z-index:30;
  font:400 22px/1.15 "VT323",ui-monospace,monospace;color:#f4f0e4;pointer-events:none}
#tut .tc{background:rgba(20,17,24,.94);border:3px solid #0c0a0e;box-shadow:5px 5px 0 #0c0a0e;padding:10px 14px 12px;pointer-events:auto}
#tut .tt{display:flex;justify-content:space-between;align-items:center;gap:8px;font:9px/1.4 "Press Start 2P",monospace;color:#9a93a6}
#tut .tb{display:flex;gap:4px;margin:8px 0 6px}#tut .tb i{flex:1;height:8px;background:#3a3542;border:1px solid #0c0a0e}
#tut .tb i.td{background:#7cff9a}#tut .tb i.tcur{background:#ffde1e}
#tut h2{font:16px/1.3 "Press Start 2P",monospace;color:#ffde1e;margin:6px 0 4px;letter-spacing:.02em}
#tut .ts{font-size:26px;line-height:1.1;margin:2px 0 8px;text-wrap:balance}
#tut .tk{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;margin-bottom:8px}
#tut kbd{font:13px "Press Start 2P",monospace;color:#0c0a0e;background:#f4f0e4;border:3px solid #0c0a0e;box-shadow:3px 3px 0 #3a3542;padding:6px 8px;display:inline-block;min-width:16px;text-align:center}
#tut .tk span{display:inline-flex;align-items:center;gap:8px;color:#28c8e6}
#tut .ttip{color:#9a93a6;font-size:19px;margin:-2px 0 8px}
#tut .tr{display:flex;flex-wrap:wrap;gap:8px}
#tut button{font:10px "Press Start 2P",monospace;background:#1d1a22;color:#f4f0e4;padding:9px 11px;border:3px solid #f4f0e4;box-shadow:3px 3px 0 #0c0a0e;cursor:pointer}
#tut button:hover,#tut button:focus-visible{background:#f4f0e4;color:#0c0a0e;outline:none}
#tut button.go{background:#ffde1e;color:#0c0a0e;border-color:#0c0a0e}
#tut button.big{display:flex;width:100%;flex-direction:column;align-items:flex-start;gap:6px;text-align:left;font-size:12px;padding:12px 14px}
#tut button.big em{font:400 19px/1 "VT323",monospace;font-style:normal;opacity:.85}
#tut .tm{font:14px/1.4 "Press Start 2P",monospace;padding:8px 10px;border:3px solid #0c0a0e;margin:0 0 8px}
#tut .tm.ok{background:#7cff9a;color:#0c0a0e}#tut .tm.no{background:#ff2878;color:#fff}#tut .tm.watch{background:#28c8e6;color:#0c0a0e}
#tut .tdone{color:#7cff9a}
#tut-pop{position:fixed;left:50%;top:32%;transform:translate(-50%,-50%) scale(.6);font:40px "Press Start 2P",monospace;color:#7cff9a;
  text-shadow:4px 4px 0 #0c0a0e,-2px -2px 0 #0c0a0e;opacity:0;pointer-events:none;z-index:31}
#tut-pop.go{animation:tutpop .9s ease-out}
@keyframes tutpop{0%{opacity:0;transform:translate(-50%,-50%) scale(.6)}20%{opacity:1;transform:translate(-50%,-50%) scale(1.15)}70%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(-50%,-60%) scale(1)}}
@media (prefers-reduced-motion:reduce){#tut-pop.go{animation:none}}
@media (max-width:620px){#tut .ts{font-size:22px}#tut h2{font-size:13px}}`;
  function ui() {
    if (!$('tut-css')) { const st = document.createElement('style'); st.id = 'tut-css'; st.textContent = CSS; document.head.appendChild(st); }
    if (!$('tut')) { const d = document.createElement('div'); d.id = 'tut'; d.setAttribute('role', 'region'); d.setAttribute('aria-label', 'Tutorial'); d.setAttribute('aria-live', 'polite'); document.body.appendChild(d); }
    if (!$('tut-pop')) { const d = document.createElement('div'); d.id = 'tut-pop'; d.setAttribute('aria-hidden', 'true'); document.body.appendChild(d); }
  }
  function pop() { const f = $('tut-pop'); if (!f) return; f.textContent = '✓ ' + T.okMsg; f.classList.remove('go'); void f.offsetWidth; f.classList.add('go'); }
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function draw() {
    const box = $('tut'); if (!box || !T) return; const k = keyset(), P = load();
    let h = '';
    if (T.phase === 'menu') {
      const at = P.at && PARTS.findIndex(x => x.id === P.at.part), cont = at >= 0 && P.at.i > 0;
      h = `<div class="tc"><div class="tt"><span>HC2 FOOTBALL</span><span>ESC = BACK TO THE GAME</span></div>
        <h2>TUTORIAL</h2><div class="ts">Try every move once, one step at a time. Skip anything, any time.</div><div class="tr" style="flex-direction:column">
        ${cont ? `<button type="button" class="big go" id="tut-m-first" data-act="cont">CONTINUE ▶<em>${esc(PARTS[at].short)} · step ${P.at.i + 1} of ${PARTS[at].steps.length}</em></button>` : ''}
        ${PARTS.map((x, j) => `<button type="button" class="big${!cont && j === (P.done && P.done.basics ? 1 : 0) ? ' go' : ''}"${!cont && j === (P.done && P.done.basics ? 1 : 0) ? ' id="tut-m-first"' : ''} data-act="part" data-p="${j}">${esc(x.n)} ${P.done && P.done[x.id] ? '<span class="tdone">✓ DONE</span>' : ''}<em>${esc(x.blurb)} ${x.steps.length} steps · about ${x.mins} min</em></button>`).join('')}
        </div><div class="tr" style="margin-top:10px"><button type="button" data-act="game">◀ BACK TO THE GAME</button></div></div>`;
    } else if (T.phase === 'done') {
      const last = T.part === PARTS.length - 1;
      h = `<div class="tc"><div class="tt"><span>${esc(PARTS[T.part].n)}</span><span>${PARTS[T.part].steps.length} / ${PARTS[T.part].steps.length}</span></div>
        <div class="tb">${PARTS[T.part].steps.map(() => '<i class="td"></i>').join('')}</div>
        <h2>${last ? 'ALL DONE! YOU\'RE READY.' : 'BASICS DONE ✓'}</h2><div class="ts">${last ? 'You\'ve tried every move. Go and win one!' : 'Play a match now, or carry on with the advanced moves.'}</div>
        <div class="tr">${last ? '<button type="button" class="go" id="tut-d-first" data-act="game">PLAY A MATCH ▶</button>' : '<button type="button" class="go" id="tut-d-first" data-act="part" data-p="1">PART 2 · ADVANCED ▶</button><button type="button" data-act="game">PLAY A MATCH</button>'}
        <button type="button" data-act="menu">☰ TUTORIAL MENU</button></div></div>`;
    } else {
      const s = step(), N = PARTS[T.part].steps.length, tip = s.tip ? s.tip() : '';
      const msg = T.phase === 'ok' ? `<div class="tm ok">✓ ${esc(T.okMsg)}</div>` : T.phase === 'fail' ? `<div class="tm no">${esc(T.hint || 'Try again!')}</div>`
        : T.phase === 'demo' ? '<div class="tm watch">WATCH… (then it\'s your turn)</div>' : T.phase === 'shown' ? '<div class="tm watch">YOUR TURN NEXT…</div>' : '';
      h = `<div class="tc"><div class="tt"><span>${esc(PARTS[T.part].short)} · STEP ${T.i + 1} / ${N}</span><span>ESC = MENU</span></div>
        <div class="tb">${PARTS[T.part].steps.map((x, j) => `<i class="${j < T.i || (j === T.i && T.phase === 'ok') ? 'td' : j === T.i ? 'tcur' : ''}"></i>`).join('')}</div>
        <h2>${esc(s.n)}</h2>${msg}<div class="ts">${esc(s.say(k))}</div>
        <div class="tk">${s.keys(k).map(([cap, what]) => `<span><kbd>${esc(cap)}</kbd>${esc(what)}</span>`).join('')}</div>${tip ? `<div class="ttip">${esc(tip)}</div>` : ''}
        <div class="tr">${s.info ? '<button type="button" class="go" data-act="gotit">GOT IT ▶ <small>(ENTER)</small></button>' : ''}
        ${T.i > 0 ? '<button type="button" data-act="back">◀ BACK</button>' : ''}
        ${s.demo ? '<button type="button" data-act="demo">SHOW ME</button>' : ''}
        <button type="button" data-act="skip">SKIP ▶</button><button type="button" data-act="menu">☰ MENU</button></div></div>`;
    }
    box.innerHTML = h;
    for (const b of box.querySelectorAll('button[data-act]')) b.addEventListener('click', e => { act(b.dataset.act, b.dataset.p); e.currentTarget.blur(); });
  }
  function act(a, p) {
    if (!T) return; const P = load();
    if (a === 'cont') { const j = PARTS.findIndex(x => x.id === P.at.part); startPart(j, P.at.i); }
    else if (a === 'part') startPart(+p, 0);
    else if (a === 'game') toGame();
    else if (a === 'menu') showMenu();
    else if (a === 'skip') go(T.i + 1);
    else if (a === 'back') go(T.i - 1);
    else if (a === 'demo') demo();
    else if (a === 'gotit') success('GOT IT');
  }

  return {
    PARTS,
    // the Lab test (lab.js buildTests adds it as the TUT group, so #TUT opens it)
    test(api) {
      return { id: 'TUT1', group: 'TUT', name: 'the tutorial', sub: 'step by step', kind: 'free', you: true,
        setup(r) { api.freePlay().setup(r); r.noAuto = true; enter(api, r); },
        check(r) { r.noAuto = true; api.fpTick(r); tick(r); return null; } };
    },
    done: () => load().done || {},
    get run() { return T; },                                                     // (for tools/tutorial.js)
  };
})();
