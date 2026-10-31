'use strict';
// HC2 Football · matchflow.js: referee and the laws: kick-off, restarts, set pieces, fouls, cards, injuries, subs, halves, extra time, coin toss
// (split out of game.js in v0.9.5 - load order and lanes: src/README.md)
// ------------------------------------------------------------------ REFEREE (v0.7.1, PixelLab)
// Keeps 12-16 m from the ball on the far side of play (a simple diagonal system), runs with the PixelLab run, and stops
// to show the yellow / red card (red = the same PixelLab move, card repainted) or to blow and point (fouls, goals).
// He's scenery for the ball: it never hits him.
class Referee {
  constructor(m) {
    this.m = m; this.x = 52.5; this.y = 18; this.vx = 0; this.vy = 0; this.face = 6; this.state = 'idle'; this.t = 0; this.anim = '';
    const K = MAN.kits.REF; this.spr = m.add.sprite(0, 0, 'REF', K.anims[Object.keys(K.anims)[0]][0]).setOrigin(0.5, K.feetY / (K.frameH || 160));
  }
  play(name, rate, once) {
    const key = `REF:${name}`;
    if (!this.m.anims.exists(key)) { const fr = MAN.kits.REF.anims[name]; if (!fr) return false;
      this.m.anims.create({ key, frames: fr.map(f => ({ key: 'REF', frame: f })), frameRate: rate, repeat: once ? 0 : -1 }); }
    if (this.anim !== key) { this.spr.play(key); this.anim = key; }
    return true;
  }
  act(kind, sec, at) { this.state = kind; this.t = sec; this.vx = this.vy = 0; this.face = 6; this.anim = ''; }
  spot(b) { return { x: clamp(b.x + (b.x < 52.5 ? 10 : -10), 8, 97), y: clamp(b.y < 34 ? b.y + 14 : b.y - 14, 3, 65) }; }
  place(b) { const s = this.spot(b); this.x = s.x; this.y = s.y; this.vx = this.vy = 0; this.face = dirIndex(b.x - s.x, b.y - s.y); }   // after a cut
  step(dt) {
    const b = this.m.ball;
    if (this.t > 0) { this.t -= dt; if (this.t <= 0) this.state = 'idle'; return; }
    if (this.goTo) {                                                              // v0.8 foul scene: he runs over to the fouler
      const dx = this.goTo.x - this.x, dy = this.goTo.y - this.y, d = len(dx, dy), v = d > 0.3 ? Math.min(8.5, 1.2 + d * 1.3) : 0;
      const k = Math.min(1, dt * 7); this.vx += ((d ? dx / d : 0) * v - this.vx) * k; this.vy += ((d ? dy / d : 0) * v - this.vy) * k;
      this.x += this.vx * dt; this.y += this.vy * dt;
      const sp = len(this.vx, this.vy); this.state = sp > 0.6 ? 'run' : 'idle'; this.face = sp > 0.6 ? dirIndex(this.vx, this.vy) : 6;
      return;
    }
    const { x: tx, y: ty } = this.spot(b);
    const dx = tx - this.x, dy = ty - this.y, d = len(dx, dy), v = d > 1.5 ? Math.min(6.4, 0.6 + d * 0.32) : 0;   // v0.7.4: walks when play is close, runs to catch up
    const k = Math.min(1, dt * 3.5); this.vx += ((d ? dx / d : 0) * v - this.vx) * k; this.vy += ((d ? dy / d : 0) * v - this.vy) * k;
    this.x += this.vx * dt; this.y += this.vy * dt;
    const sp = len(this.vx, this.vy); this.state = sp > 0.6 ? 'run' : 'idle';
    this.face = sp > 0.6 ? dirIndex(this.vx, this.vy) : dirIndex(b.x - this.x, b.y - this.y);
  }
  draw() {
    const X = wx(this.x, this.y), Y = wy(this.y), d = DIRS[this.face], A = MAN.kits.REF.anims;
    this.spr.setPosition(Math.round(X), Math.round(Y)).setDepth(Y).setVisible(this.hidden ? false : (!this.m.replay || this.spr.visible));
    if (this.state === 'card' || this.state === 'cardR' || this.state === 'whistle') { if (!this.play(`${this.state}-S`, 9, true)) this.play('idle-S', 6); this.spr.anims.timeScale = 1; return; }
    const v = len(this.vx, this.vy); this.walkLook = this.state === 'run' && A[`walk-${d}`] && v < WALK_V * (this.walkLook ? 1.12 : 0.9);
    if (this.walkLook) { this.play(`walk-${d}`, 8); this.spr.anims.timeScale = clamp(v / 1.5, 0.45, 1.6); }                    // v0.7.4 PixelLab walk
    else if (this.state === 'run' && A[`run-${d}`]) { this.play(`run-${d}`, 12); this.spr.anims.timeScale = clamp(v / 5.5, 0.5, 1.4); }
    else { this.play(A[`idle-${d}`] ? `idle-${d}` : 'idle-S', 6); this.spr.anims.timeScale = 1; }
  }
}

// ---------------------------------------------------------------- Match methods: matchflow
// t-035: Phaser draws Math.random for an id each time it makes a text (and a few other objects), and the game makes
// some only when first needed (the replay captions, the added-time board...): halfway through a page's first match
// those draws shifted the match's own dice, so a soak repro line played a different match on a fresh page than after
// another one. Making an object now draws from its own generator, never the game's.
(() => {
  let a = 0x2f6b9d3; const own = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  for (const P of [Phaser.GameObjects.GameObjectFactory.prototype, Phaser.GameObjects.GameObjectCreator.prototype])
    for (const k of Object.getOwnPropertyNames(P)) {
      const f = P[k]; if (typeof f !== 'function' || k === 'constructor' || /^(boot|start|shutdown|destroy|existing|register|remove)$/.test(k)) continue;
      P[k] = function (...args) { const R = Math.random; Math.random = own; try { return f.apply(this, args); } finally { Math.random = R; } };
    }
})();

hc2Mix(Match, {

  // ---------- restarts
  kickoff(team) {
    this.dead = null; this.foulScene = null; this.offSide = null;                // (t-024: a new phase - nobody is offside from before)
    for (const p of this.all) { if (p.sentOff) continue; p.x = p.home.x; p.y = p.home.y; p.vx = p.vy = 0; p.state = 'idle'; p.hands = false; p.face = p.team.side > 0 ? 0 : 4; }
    const on = [9, 10, 8, 7, 6, 5, 4, 3, 2, 1].map(i => team.players[i]).filter(p => !p.sentOff), k = on[0], k2 = on[1] || on[0];
    k.x = 52.5 - team.side * 0.5; k.y = 34; k2.x = 52.5 - team.side * 1.0; k2.y = 37;
    Object.assign(this.ball, { x: 52.5, y: 34, z: 0, vx: 0, vy: 0, vz: 0, owner: k, last: team, inNet: false, netRight: undefined, target: null, skid: false });
    this.netReset();                                                             // t-025: the net still and whole again (an LV3's hole closes now, not after the freeze)
    if (this.ref) { this.ref.x = 52.5 + 3; this.ref.y = 22; this.ref.vx = this.ref.vy = 0; this.ref.act('whistle', 0.9); }   // v0.7.1: the referee starts it
    { const S = this.slot(team); if (S) S.human = k; }   // (t-043: his side's human, either side)
    this.setPiece = null; this.pending = null;
    applyPace(); this.freeze = paceK().koFreeze; this.say('KICK-OFF', team.name + ' TO START', 1.2); SFX.whistle(1);   // (t-004: ARCADE 0.6 s)
  },
  // dead-ball restarts become SET PIECES: play stops, the taker stands over the ball and aims with a cursor
  // t-029 (Luca 25 Oct 14:59: "only the catching of the offside happened, then they resume without people reorganizing
  // ... do the same with the corners: they transition too quick, fix the pacing for set pieces"). Players used to be
  // TELEPORTED onto their spots and the kick came half a second later. Now every restart (but the penalty, which has its
  // own scene) has a SETUP first, as on TV and in FIFA / PES: the whistle / flag and a caption, the players JOG into the
  // restart's shape (spShape: a spot each), the taker walks up and places the ball, then you aim / the computer takes it.
  // Anyone who can't get there in time is moved under the goal kick's TV wipe (a cut), never in plain sight. How long it
  // lasts: PACE[..].setup (core.js), CLASSIC / ARCADE; your own set piece skips to aiming with PASS / SHOOT / LOB / THROUGH
  // once the shape is mostly in (spSetupTick).
  restart(kind, team, x, y, note, opts = {}) {
    this.offSide = null;                                                         // t-024: the ball was dead - whoever was offside before isn't now
    this.dead = null; if (kind === 'FREE KICK' || kind === 'PENALTY') SFX.whistle(1);
    if (kind === 'GOAL KICK') return this.goalKick(team, y);                     // v0.10.4: a cut to the keeper with it in his hands
    for (const p of this.all) p.spot = null;
    if (kind === 'CORNER') { this.ramiSay('corner', { TEAM: team.name }); this.stat(team).corners++; }
    if (kind === 'PENALTY' && MAN.penalty && !window.HC2_NO_PENCAM && !this.demo) return this.startPenalty(team, note);
    const b = this.ball;
    Object.assign(b, { vx: 0, vy: 0, vz: 0, inNet: false, netRight: undefined, target: null, skid: false, save: null, owner: null });
    if (kind !== 'CORNER') Object.assign(b, { x, y, z: 0 });                     // (t-029: a corner's ball goes to the flag with its taker, under the cut)
    for (const p of this.all) { if (p.sentOff) continue; p.hands = false; if (p.busy() && p.state !== 'getup') p.setState('idle', 0); p.stun = 0; }
    let taker;
    if (kind === 'PENALTY') taker = [9, 10, 8, 7, 6, 5, 4, 3, 2, 1].map(i => team.players[i]).find(p => !p.sentOff) || team.players[0];
    else taker = this.spTaker(kind, team, x, y, opts);
    for (const S of this.hSlots()) { S.charge = -1; S.nextHuman = null; } this.pending = null;
    if (kind === 'PENALTY') {                                                    // (the demo / the old test page: no penalty scene - as before)
      this.placeSetPiece(kind, team, taker, x, y);
      this.aimPt = this.defaultAim(kind, team, taker, x, y);
      const dx = this.aimPt.x - x, dy = this.aimPt.y - y, dl = len(dx, dy) || 1;
      taker.x = x - dx / dl * 0.6; taker.y = y - dy / dl * 0.6; taker.vx = taker.vy = 0; taker.face = dirIndex(dx, dy);
      b.owner = taker; b.last = team; taker.state = 'idle';
      { const S = this.slot(team); if (S) S.human = taker; }
      this.setPiece = { kind, team, taker, t: 0, kicked: false };
      this.freeze = paceK().spFreeze; this.say(kind, note || (team === this.home ? (k => `${k.move} AIM  ${k.pass} PASS  ${k.lob} CROSS  ${k.shoot} SHOOT (HOLD)`)(keyset()) : team.name), team === this.home ? 2.4 : 1.4);
      return;
    }
    b.last = team;
    this.spSetup(kind, team, taker, x, y, note, opts);
  },
  // who takes it: the nearest outfield man (as before); an offside free kick deep in his own half: the keeper, as on TV
  // ("a defender (often the keeper or a centre-back) places it"), else a defender if one is close
  spTaker(kind, team, x, y, opts) {
    const on = team.players.filter(p => !p.keeper && !p.sentOff), d = p => len(p.x - x, p.y - y), by = (a, c) => d(a) - d(c);
    if (opts.offside) {
      const gk = team.players[0];
      const S = paceK().setup, can = p => len(p.x - x, p.y - y) < S.v * (S.offside + 0.5);   // (if he can get there: no cut needed)
      if (!gk.sentOff && Math.abs(x - team.ownGoalX) < 22 && Math.abs(y - 34) < 22 && can(gk)) return gk;
      const def = on.filter(p => isBack(p)).sort(by)[0];
      if (def && d(def) < 14) return def;
    }
    return on.sort(by)[0] || team.players[0];
  },
  // t-029 the SETUP. The table key, every man's spot, who has to be there before it is taken (must), whether a wipe is
  // needed (a corner always: the TV cut to the taker at the flag), then spSetupTick runs it frame by frame
  spSetup(kind, team, taker, x, y, note, opts) {
    const P = paceK(), S = P.setup, b = this.ball, near = kind === 'FREE KICK' && len(team.goalX - x, 34 - y) < 35;
    const key = opts.offside ? 'offside' : kind === 'CORNER' ? 'corner' : kind === 'THROW-IN' ? 'throw' : near ? 'fkNear' : 'fk';
    const T = S[key], { spots, must } = this.spShape(kind, team, taker, x, y, opts);
    const gx = team.goalX, s = team.side, top = y < 34;
    const toward = kind === 'CORNER' ? { x: gx - s * 9, y: 34 } : kind === 'THROW-IN' ? { x, y: top ? 10 : PITCH_W - 10 } : near ? { x: gx, y: 34 } : { x: x + s * 20, y: 34 + (y - 34) * 0.5 };
    const dx = toward.x - x, dy = toward.y - y, dl = len(dx, dy) || 1;
    const stand = kind === 'THROW-IN' ? { x, y: top ? -0.5 : PITCH_W + 0.5 } : { x: x - dx / dl * 0.6, y: y - dy / dl * 0.6 };
    for (const [p, q] of spots) p.spot = q;
    const reach = S.v * (T + 0.5), far = p => p === taker ? len(stand.x - p.x, stand.y - p.y) > reach : !!p.spot && len(p.spot.x - p.x, p.spot.y - p.y) > reach;
    const wipe = !opts.cut && (kind === 'CORNER' || [taker, ...must].some(far));   // (a foul's free kick: the foul scene's wipe is covering it right now)
    // t-032: a corner's cut is a BLACKOUT (ui.js blackout, times in PACE setup bo*), not the TV wipe: an eased fade out,
    // everyone moved while it is fully black, then it fades in on the taker walking to the flag and the box filling
    const bo = wipe && kind === 'CORNER' ? { t: 0, o: S.boOut, h: S.boHold, i: S.boIn, a: 0, at: {} } : null;
    if (wipe && !bo) this.wipe();
    this.aimPt = null;                                                           // (no aim cursor yet: the camera follows the ball, ui.js draws nothing)
    { const S = this.slot(team); if (S) S.human = taker; }
    this.setPiece = { kind, team, taker: null, t: 0, kicked: false,
      su: { key, t: 0, T, Tmax: T * 1.5 + 0.6, taker, must, stand, ball: { x, y }, toward, cutAt: bo ? 1e9 : wipe ? 0.24 : opts.cut ? 0 : -1, cut: false, placed: null, skip: false, wiped: wipe || !!opts.cut, moved: 0, bo } };
    if (!wipe && !opts.cut) this.setPiece.su.cut = true;                         // (nothing to cut: they all jog)
    const cap = opts.offside ? ['OFFSIDE!', note || `FREE KICK · ${team.name}`] : [kind, note || team.name];
    this.say(cap[0], cap[1], Math.min(2.2, T + 0.4));
  },
  // the CUT, under the wipe: whoever is further than he can jog in the time lands a step or two off his spot and jogs
  // the last bit in (v0.8's free-kick landing); a corner's taker lands a few metres along the byline with the ball in
  // his hands and walks to the flag. The camera cuts too.
  spCut() {
    const sp = this.setPiece, U = sp.su, b = this.ball, tk = U.taker, S = paceK().setup, reach = S.v * Math.max(0.5, U.T - U.t) * 0.85, n0 = U.moved;
    U.cut = true;
    for (const p of this.all) {
      if (p.sentOff || p === tk || !p.spot) continue;
      const q = p.spot, d = len(p.x - q.x, p.y - q.y); if (d <= reach && !p.keeper) continue;
      let ox = p.x - q.x, oy = p.y - q.y;
      if (len(q.x - U.ball.x, q.y - U.ball.y) < 13) { ox = q.x - U.ball.x; oy = q.y - U.ball.y; }   // near the ball: come in from further out, never from inside 9.15
      const ol = len(ox, oy) || 1, m = p.keeper ? Math.min(d, 1.2) : Math.min(2.6, d, 1.2 + Math.random() * 1.4);
      p.x = clamp(q.x + ox / ol * m, -1.5, PITCH_L + 1.5); p.y = clamp(q.y + oy / ol * m, -1.5, PITCH_W + 1.5); p.vx = p.vy = 0; p.face = dirIndex(q.x - p.x, q.y - p.y); U.moved++;
    }
    const st = U.stand, dt0 = len(st.x - tk.x, st.y - tk.y);
    if (sp.kind === 'CORNER') {                                                  // he comes over from the box side with the ball under his arm
      const ix = sp.team.goalX - sp.team.side * 0.6, iy = st.y + (st.y < 34 ? 1 : -1) * 4.5;
      tk.x = ix; tk.y = clamp(iy, 1, PITCH_W - 1); tk.vx = tk.vy = 0; tk.hands = true;
      Object.assign(b, { owner: tk, z: 1.1, vx: 0, vy: 0, vz: 0 }); this.placeAtFeet(); U.moved++;
    } else if (dt0 > reach) { const ox = (tk.x - st.x) / (dt0 || 1), oy = (tk.y - st.y) / (dt0 || 1);   // two or three steps away, then he walks up
      tk.x = st.x + ox * 2.4; tk.y = st.y + oy * 2.4; tk.vx = tk.vy = 0; U.moved++; }
    if (this.ref) this.ref.place(sp.kind === 'CORNER' ? { x: U.ball.x, y: U.ball.y } : b);
    this.camX = this.camY = undefined;                                           // a cut, not a pan
    U.cutMoved = U.moved - n0;
  },
  // t-032 the corner's BLACKOUT, on the setup's own clock (game time: a pause holds it, the Test Lab steps it): out (eased),
  // held black - the cut half-way through it, so nobody is ever seen jumping - then in (eased) on the corner being set up.
  // A press to skip runs the rest boSkip x faster; at most out + hold + in after the restart it is gone, never a hang.
  spBlackout(U, dt) {
    const B = U.bo, ease = x => 0.5 - 0.5 * Math.cos(Math.PI * clamp(x, 0, 1));
    if (B.done) return;
    B.t += dt * (U.skip ? paceK().setup.boSkip : 1);
    if (!U.cut && B.t >= B.o + B.h * 0.5) this.spCut();
    B.a = B.t < B.o ? ease(B.t / B.o) : B.t < B.o + B.h ? 1 : 1 - ease((B.t - B.o - B.h) / B.i);
    const at = B.at;                                                             // (when each stage was reached, setup seconds: the Test Lab reports them)
    if (at.black == null && B.a >= 1) at.black = U.t;
    if (at.black != null && at.up == null && B.a < 1) at.up = U.t;
    if (B.t >= B.o + B.h + B.i) { B.a = 0; B.done = true; at.clear = U.t; }
    this.blackout(B.a);
  },
  // one frame of the setup (true: still setting up). The taker walks to the ball (a corner's carries it), places it,
  // waits for the shape; your set piece: a press of PASS / SHOOT / LOB / THROUGH takes you to aiming once it is mostly in
  spSetupTick(dt) {
    const sp = this.setPiece, U = sp.su, b = this.ball, tk = U.taker, S = paceK().setup;
    U.t += dt;
    if (U.bo) this.spBlackout(U, dt);                                            // t-032: the corner's fade (it makes the cut while black)
    if (!U.cut && U.t >= U.cutAt) this.spCut();
    for (const q of this.all) { if (q.sentOff || q === tk) continue;
      if (!U.cut || !this.settle(q, dt, q.keeper ? S.v * 0.8 : S.v)) q.steer(0, 0, dt);
      q.step(dt); }
    if (U.cut && U.placed == null) {
      const st = U.stand, d = len(st.x - tk.x, st.y - tk.y);
      tk.moveTo(st.x, st.y, d > 2.6 ? S.v : S.walk, dt);                        // jogs over, walks the last steps
      if (b.owner === tk) this.placeAtFeet();
      if (d < 0.3 || U.t > U.Tmax + 4) {                                         // (the last line: never stuck walking)
        if (d >= 0.3) { tk.x = st.x; tk.y = st.y; }
        tk.hands = false; tk.vx = tk.vy = 0; Object.assign(b, { x: U.ball.x, y: U.ball.y, z: 0, vx: 0, vy: 0, vz: 0, owner: tk, last: sp.team, lastP: tk });
        tk.face = dirIndex(U.toward.x - tk.x, U.toward.y - tk.y); sp.taker = tk; U.placed = U.t;   // placed (a throw-in: picked up, over his head)
      }
    } else tk.steer(0, 0, dt);
    tk.step(dt);
    if (sp.taker) this.placeAtFeet();
    // the camera frames the setup (world.js follows camTarget with its slower ease; the shot is only ~16 m deep, so the
    // flag and the box never fit together): a corner follows the taker to the flag, then, once it is placed, goes over to
    // the box as the bodies set; a free kick near goal looks towards the wall and the goal; everything else stays on the ball
    const fk = sp.kind === 'CORNER' ? (U.placed == null ? 0 : 0.95) : U.key === 'fkNear' ? 0.4 : 0, fb = sp.kind === 'CORNER' && U.placed == null ? tk : U.ball;
    if ((fk || sp.kind === 'CORNER') && U.cut && (!this.camTarget || this.camTarget === this.spCam)) { const fx = fb.x + (U.toward.x - fb.x) * fk, fy = fb.y + (U.toward.y - fb.y) * fk;
      this.spCam = this.spCam || {}; this.spCam.x = wx(fx, fy); this.spCam.y = wy(fy) - 40; this.camTarget = this.spCam; }
    if (this.hasHuman(sp.team) && !this.demo && U.t > 0.2 && ['pass', 'shoot', 'lob', 'through'].some(a => this.inpOf(sp.team).pressed(a))) U.skip = true;
    const inN = U.must.filter(q => q.sentOff || !q.spot || len(q.x - q.spot.x, q.y - q.spot.y) < 1.2).length;
    U.frac = U.must.length ? inN / U.must.length : 1;
    if (U.placed == null || !((U.frac >= 0.8 && (U.t >= U.T || U.skip)) || U.t >= U.Tmax)) return true;
    // ready: aim / the computer takes it (anyone not quite in keeps jogging in - settle() - until it is kicked)
    if (this.spCam && this.camTarget === this.spCam) this.camTarget = null;     // (your aim's framing / the ball from here)
    if (U.bo) this.blackout(0);                                                  // (never carry the black into the aim)
    sp.su = null; sp.setup = { t: U.t, key: U.key, frac: U.frac, skip: U.skip, wiped: U.wiped, moved: U.moved, placed: U.placed, bo: U.bo && U.bo.at };
    sp.t = 0; sp.gate = this.inpOf(sp.team).held('shoot');                                     // (a SHOOT that skipped: let go before it charges a shot)
    this.aimPt = this.defaultAim(sp.kind, sp.team, tk, U.ball.x, U.ball.y);
    if (sp.kind !== 'THROW-IN') tk.face = dirIndex(this.aimPt.x - tk.x, this.aimPt.y - tk.y);
    if (this.hasHuman(sp.team)) { this.slot(sp.team).human = tk; const k = keyset();
      this.say(sp.kind, sp.kind === 'THROW-IN' ? `${k.move} AIM  ${k.pass} SHORT  ${k.lob} LONG` : `${k.move} AIM  ${k.pass} PASS  ${k.lob} CROSS  ${k.shoot} SHOOT (HOLD)`, 2.4); }
    return true;
  },
  // goal kick: below - placed under the dead ball's wipe, then a short jog-in (t-029), PACE setup.gk
  goalKick(team, y) {
    const gk = team.players[0], s = team.side, gx = team.ownGoalX, opp = team.opp, b = this.ball;
    const X = d => gx + s * d, jit = () => rnd(-0.8, 0.8);
    const OURS = [null, [30, 6], [17, 19], [17, 49], [30, 62], [45, 10], [38, 27], [40, 41], [45, 58], [57, 28], [59, 41]];
    const THEIRS = [null, [60, 10], [61, 25], [61, 43], [60, 58], [41, 12], [39, 28], [40, 40], [41, 56], [23, 26], [24, 43]];
    const T = paceK().setup.gk, until = this.time.now + (T + 1) * 1000;
    for (const p of this.all) { if (p.sentOff) continue; p.hands = false; p.spot = null; p.stun = 0; p.cool = 0; p.vx = p.vy = 0; p.claiming = false; if (p.busy()) p.setState('idle', 0); else p.state = 'idle'; }
    // t-029: each man lands a step or two short of his spot (on the side he came from) and jogs the rest in the setup
    const put = (p, sp) => { if (!p || p.sentOff || !sp) return; const q = { x: clamp(X(sp[0]) + jit(), 0.5, PITCH_L - 0.5), y: clamp(sp[1] + jit(), 0.5, PITCH_W - 0.5), until };
      const ox = p.x - q.x, oy = p.y - q.y, ol = len(ox, oy) || 1, m = Math.min(ol, 0.8 + Math.random() * 1.6);
      p.x = q.x + ox / ol * m; p.y = q.y + oy / ol * m; p.spot = q; };
    team.players.forEach((p, i) => put(p, OURS[i])); opp.players.forEach((p, i) => put(p, THEIRS[i]));
    const og = opp.players[0]; if (!og.sentOff) { og.spot = null; og.x = opp.ownGoalX + opp.side * 3; og.y = 34; }   // their keeper: on his line, far end
    gk.spot = null; gk.x = X(5.5); gk.y = clamp(34 + (y - 34) * 0.3, 31, 37); gk.face = s > 0 ? 0 : 4;
    for (const p of this.all) if (!p.sentOff && p !== gk) p.face = dirIndex(gk.x - p.x, gk.y - p.y);
    Object.assign(b, { owner: gk, last: team, lastP: gk, z: 1.1, vx: 0, vy: 0, vz: 0, inNet: false, netRight: undefined, target: null, skid: false, save: null, lob: false, ring: null, shotBy: null });
    gk.hands = true; gk.hold = -0.4; this.placeAtFeet();                         // (a breath before he plays it)
    this.offGK = gk;                                                             // t-024: no offside from a goal kick (his first ball out of his hands)
    if (this.ref) this.ref.place(b);
    this.camX = this.camY = undefined;                                           // a cut, not a pan
    this.setPiece = null; this.pending = null; for (const S of this.hSlots()) { S.charge = -1; S.nextHuman = null; }
    { const S = this.slot(team); if (S) S.human = gk; }
    this.freeze = Math.max(this.freeze, T);
    this.gkSetup = { t0: this.time.now, T };                                     // (the Test Lab's RS6 reads it)
    const k = keyset(); this.say('GOAL KICK', team === this.home ? `${k.pass} THROW  ${k.lob} PUNT` : team.name, team === this.home ? 2.0 : 1.2);
  },
  defaultAim(kind, team, taker, x, y) {
    const gx = team.goalX, s = team.side;
    const mates = team.players.filter(p => p !== taker && !p.keeper && !p.sentOff);
    const nearest = (pt, maxD) => mates.filter(p => len(p.x - pt.x, p.y - pt.y) < maxD).sort((a, c) => len(a.x - pt.x, a.y - pt.y) - len(c.x - pt.x, c.y - pt.y))[0];
    if (kind === 'CORNER') return { x: gx - s * 9, y: 34 + (y < 34 ? -2 : 2) };
    if (kind === 'PENALTY') return { x: gx + s * 0.5, y: 34 };
    if (kind === 'FREE KICK' && len(gx - x, 34 - y) < 32) return { x: gx + s * 0.5, y: 34 + rnd(-2, 2) };
    const ahead = mates.filter(p => (p.x - x) * s > 0).sort((a, c) => len(a.x - x, a.y - y) - len(c.x - x, c.y - y))[0] || nearest({ x, y }, 99);
    return ahead ? { x: ahead.x, y: ahead.y } : { x: x + s * 15, y };
  },
  placeSetPiece(kind, team, taker, x, y) {                                       // (t-029: only the penalty without its scene still lands everyone at once)
    const opp = team.opp, gx = team.goalX, s = team.side;
    const inBox = (p, g) => Math.abs(p.x - g) < 18 && Math.abs(p.y - 34) < 21;
    let k = 0;
    for (const p of this.all) { if (p === taker || (p.keeper && p.team === opp)) continue; if (inBox(p, gx)) { p.x = gx - s * 19.5; p.y = 34 + ((k++ % 9) - 4) * 3; p.vx = p.vy = 0; } }
    const gk = opp.players[0]; gk.x = gx - s * 0.6; gk.y = 34; gk.vx = gk.vy = 0;
  },
  // t-029 THE SHAPES: a spot for every man, per restart, and the men who have to be on theirs before it is taken.
  // Everyone starts from both teams' shape around the ball (v0.8's free-kick shape), then per kind:
  //  * FREE KICK near goal: the wall on 9.15 m, attackers on the last defender's line with a marker goal-side of each
  //    (v0.8); far out: just 9.15 m. OFFSIDE (t-024's free kick): the side that was caught trots back onside - every one
  //    of them a metre or two behind the defenders' line - while the defenders push up into their shape.
  //  * CORNER: the taker at the flag; near post, six-yard line, the spot, far post, the edge filled by the attackers,
  //    each picked up goal-side by a marker; a man on the near post, a zonal man in the six-yard box, the keeper set on
  //    his line a touch to the near side; the other side keeps a man up, the corner side's centre-backs hold halfway.
  //  * THROW-IN: a short option back and a longer one up the line, each with a marker; nobody within 2 m (Law 15).
  spShape(kind, team, taker, x, y, opts) {
    const opp = team.opp, gx = team.goalX, s = team.side, spots = new Map(), must = [];
    const shape = (tm, has) => { for (const p of tm.players) { if (p.sentOff || p === taker) continue;
        if (p.keeper) { spots.set(p, { x: tm.ownGoalX + tm.side * 1.5, y: clamp(34 + (y - 34) * 0.08, 32, 36) }); continue; }
        const role = lineOf(p), push = (has ? [4, 10, 18][role] : [-1, 1, 3][role]) * tm.side;
        spots.set(p, { x: clamp(p.home.x + (x - 52.5) * (has ? 0.75 : 0.85) + push, 4, 101), y: clamp(p.home.y + (y - 34) * (has ? 0.32 : 0.45), 3, 65) }); } };
    shape(team, true); shape(opp, false);
    const set = (p, q) => { if (p && !p.sentOff && p !== taker) { spots.set(p, q); return true; } return false; };
    const mk = p => { if (p && !p.sentOff && p !== taker && !must.includes(p)) must.push(p); };
    if (kind === 'FREE KICK') {
      const dGoal = len(gx - x, 34 - y);
      if (dGoal < 35) {                                                          // v0.8 near goal: the wall, the line, the markers
        const ux = (gx - x) / dGoal, uy = (34 - y) / dGoal, n = dGoal < 26 ? 3 : 2;
        const wall = [6, 7, 5, 8].map(i => opp.players[i]).filter(p => !p.sentOff).slice(0, n);
        wall.forEach((p, k) => { const o = (k - (n - 1) / 2) * 0.75; set(p, { x: x + ux * 9.15 - uy * o, y: y + uy * 9.15 + ux * o }); mk(p); });
        const att = [9, 10, 8, 7].map(i => team.players[i]).filter(p => p !== taker && !p.sentOff).slice(0, 4);
        const lineX = gx - s * clamp(Math.abs(gx - x) - 2, 5, 11);              // on the last defender's line, onside
        att.forEach((p, k) => { set(p, { x: lineX - s * (k % 2) * 1.5 + rnd(-0.4, 0.4), y: 34 + (k - (att.length - 1) / 2) * 5.5 + rnd(-0.8, 0.8) }); mk(p); });
        const mks = [2, 3, 4, 1, 8, 5].map(i => opp.players[i]).filter(p => !p.sentOff && !wall.includes(p));
        att.forEach((a, k) => { const p = mks[k]; if (!p) return; const sa = spots.get(a); set(p, { x: sa.x + s * 0.9, y: sa.y + (y > sa.y ? 0.5 : -0.5) }); mk(p); });
        mk(opp.players[0]);
      }
      if (opts.offside) {                                                        // t-029: the attackers that were caught jog back onside
        const xs = [...spots].filter(([p]) => p.team === team).map(([, q]) => this.aiFrame(opp, q.x)), F = f => opp.side > 0 ? f + 52.5 : PITCH_L - (f + 52.5);
        if (!team.players[0].sentOff && !spots.has(team.players[0])) xs.push(this.aiFrame(opp, team.players[0].x));   // (the keeper taking it: where he is)
        const line = xs.sort((a, c) => c - a)[1] ?? 40;
        for (const [p, q] of spots) if (p.team === opp && !p.keeper && this.aiFrame(opp, q.x) > line - 0.6) { q.x = F(line - 1 - Math.random() * 2); mk(p); }
      }
    } else if (kind === 'CORNER') {
      const c = y < 34 ? -1 : 1, X = d => gx - s * d, Y = o => 34 + c * o;      // o > 0: the corner's side (near post)
      const BOX = [[5.5, 2.8], [11, 0.5], [6.5, -4.2], [8.5, -1.8], [16, 1.5]];  // near post, the spot, far post, six-yard line, the edge
      const att = [9, 10, 7, 6, 8].map(i => team.players[i]).filter(p => p !== taker && !p.sentOff);
      att.forEach((p, k) => { const B = BOX[k]; set(p, { x: X(B[0] + rnd(-0.6, 0.6)), y: Y(B[1] + rnd(-0.6, 0.6)) }); mk(p); });
      const mks = [3, 2, 4, 6, 7].map(i => opp.players[i]).filter(p => !p.sentOff);
      att.slice(0, 4).forEach((a, k) => { const p = mks[k], q = spots.get(a); if (!p || !q) return; set(p, { x: q.x + s * 0.9, y: q.y + c * 0.4 }); mk(p); });   // goal-side, on the ball side
      if (set(opp.players[5], { x: X(0.9), y: Y(3.1) })) mk(opp.players[5]);                         // the near-post man
      if (set(opp.players[1], { x: X(4.5), y: Y(-1) })) mk(opp.players[1]);                          // zonal, six-yard box
      if (set(opp.players[8], { x: X(14), y: Y(-5) })) mk(opp.players[8]);                           // the edge, for the knock-down
      if (set(opp.players[0], { x: X(0.7), y: Y(0.8) })) mk(opp.players[0]);                         // the keeper, set
      // smarter-ai step 3 (the co-designer: chasing late = bold): the last minutes, a goal down - their keeper comes up for it
      // and waits by the far post (brain.js keeperUp: he attacks the ball, then sprints back)
      const gk = team.players[0]; if (gk && !gk.sentOff && this.brainKeeperUp(team)) { set(gk, { x: X(7.5), y: Y(-3.5) }); mk(gk); gk.up = { t: this.time.now + 1e9 }; }
      set(opp.players[10], { x: X(19), y: Y(5) }); set(opp.players[9], { x: X(48), y: 34 - c * 6 });     // one on the edge, one up
      set(team.players[2], { x: X(52), y: 26 }); set(team.players[3], { x: X(52), y: 42 });            // the corner side holds halfway
      set(team.players[1], { x: X(38), y: 14 }); set(team.players[4], { x: X(38), y: 54 }); set(team.players[5], { x: X(24), y: Y(14) });
    } else if (kind === 'THROW-IN') {
      const inw = y < 34 ? 1 : -1, opts2 = [{ x: x - s * 6, y: y + inw * 5 }, { x: x + s * 9, y: y + inw * 8 }];
      const mates = team.players.filter(p => !p.keeper && !p.sentOff && p !== taker).sort((a, c) => len(a.x - x, a.y - y) - len(c.x - x, c.y - y)).slice(0, 2);
      mates.forEach((p, k) => { const o = opts2[k]; o.x = clamp(o.x, 2, PITCH_L - 2); set(p, o);
        const mo = opp.players.filter(q => !q.keeper && !q.sentOff).sort((a, c) => len(a.x - o.x, a.y - o.y) - len(c.x - o.x, c.y - o.y))[0];
        if (mo) set(mo, { x: o.x + (opp.ownGoalX > o.x ? 1 : -1), y: o.y + inw * 0.8 }); });   // (goal-side of him)
    }
    const r = kind === 'THROW-IN' ? 2.5 : 9.15;                                  // the distance (Law 13: 9.15 m; Law 15: 2 m on throws)
    for (const p of opp.players) { const q = spots.get(p); if (!q || p.keeper) continue; const d = len(q.x - x, q.y - y); if (d < r) { q.x = x + (q.x - x) / (d || 1) * r; q.y = y + (q.y - y) / (d || 1) * r; } if (len(p.x - x, p.y - y) < r + 1) mk(p); }
    for (const p of team.players) { const q = spots.get(p); if (!q || p.keeper) continue; const d = len(q.x - x, q.y - y); if (d < 3) { q.x = x + (q.x - x) / (d || 1) * 3; q.y = y + (q.y - y) / (d || 1) * 3; } }
    for (const q of spots.values()) { q.x = clamp(q.x, 0.5, PITCH_L - 0.5); q.y = clamp(q.y, 0.5, PITCH_W - 0.5); }
    return { spots, must };
  },
  settle(p, dt, v = 3.2) {                                                       // jog the last metres onto a set-piece spot
    const q = p.spot; if (!q || p.busy() || p.sentOff) return false;
    if (q.until && this.time.now > q.until) { p.spot = null; return false; }    // (t-029: a goal kick's spot doesn't outlive its setup)
    const d = p.moveTo(q.x, q.y, v, dt);
    if (d < 0.3) { p.spot = null; p.face = dirIndex(this.ball.x - p.x, this.ball.y - p.y); }
    return true;
  },
  // aiming at a set piece: the stick moves the cursor; Z = pass along the grass, C = lofted / cross, X (hold) = shot or driven ball
  setPieceTick(dt) {
    const sp = this.setPiece, b = this.ball;
    if (sp.su) return this.spSetupTick(dt);                                      // t-029: the setup first
    const p = sp.taker;
    sp.t += dt;
    for (const q of this.all) { if (q !== p) { if (!this.settle(q, dt)) q.steer(0, 0, dt); q.step(dt); } }
    p.steer(0, 0, dt); p.step(dt);
    if (sp.kicked) return false;                                                 // the kick is under way: normal play takes over
    this.placeAtFeet();
    const gx = sp.team.goalX, s = sp.team.side, A = this.aimPt;
    const human = this.isHuman(p), I = this.inpOf(sp.team), S = this.slot(sp.team) || this;   // (t-043: the taker's own human: his stick, his buttons, his charge)
    if (human && sp.t < 12) {                                                    // (after 12 s idle the AI takes it for you)
      const ax = I.axis; A.x = clamp(A.x + ax.x * 16 * dt, -2, PITCH_L + 2); A.y = clamp(A.y + ax.y * 16 * dt, -2, PITCH_W + 2);
      if (sp.kind === 'PENALTY') { A.x = gx + s * 0.5; A.y = clamp(A.y, GOAL_Y0 + 0.4, GOAL_Y1 - 0.4); }
      p.face = dirIndex(A.x - p.x, A.y - p.y);
      const atGoal = Math.abs(A.x - gx) < 3 && Math.abs(A.y - 34) < 5;
      if (sp.kind !== 'PENALTY' && I.pressed('pass')) return this.spKick('ground');
      if (sp.kind !== 'PENALTY' && (I.pressed('lob') || I.pressed('through'))) return this.spKick('lob');
      if (sp.kind === 'THROW-IN') { if (I.pressed('shoot')) return this.spKick('lob'); return true; }
      if (sp.gate) { if (!I.held('shoot')) sp.gate = false; return true; }   // (t-029: the SHOOT that skipped the setup)
      if (I.held('shoot')) S.charge = S.charge < 0 ? 0 : Math.min(1, S.charge + dt / paceK().chargeT);
      if (I.released('shoot') && S.charge >= 0) { const c = S.charge; S.charge = -1; return this.spKick(atGoal || sp.kind === 'PENALTY' ? 'shot' : 'lob', c); }
      return true;
    }
    if (sp.t < (sp.setup ? paceK().setup.aiAfter : paceK().aiTake)) return true;   // (t-029: after a setup he has already placed it - a short breath)                                      // AI takes a breath, then takes it (t-004: ARCADE quickly)
    const mates = sp.team.players.filter(q => q !== p && !q.keeper && !q.sentOff);
    if (sp.kind === 'PENALTY' || (sp.kind === 'FREE KICK' && len(gx - b.x, 34 - b.y) < 28 && Math.random() < 0.7)) {
      Object.assign(A, { x: gx + s * 0.5, y: 34 + rnd(-1, 1) * 3 }); return this.spKick('shot', rnd(0.6, 0.85));
    }
    if (sp.kind === 'CORNER') { const box = mates.filter(q => Math.abs(q.x - gx) < 16); const t = box[Math.floor(Math.random() * box.length)] || mates[0]; Object.assign(A, { x: t.x, y: t.y }); return this.spKick('lob'); }
    if (sp.kind === 'GOAL KICK') { const up = mates.filter(q => Math.abs(q.x - p.x) > 25).sort(() => Math.random() - 0.5)[0] || mates[0]; Object.assign(A, { x: up.x, y: up.y }); return this.spKick('lob'); }
    const best = this.bestOption(p);
    if (best) { Object.assign(A, { x: best.q.x, y: best.q.y }); return this.spKick(sp.kind === 'THROW-IN' ? 'lob' : best.mode === 'lob' ? 'lob' : 'ground'); }
    return this.spKick('ground');
  },
  spTarget() {                                                                   // the team-mate a set-piece ball would find (nearest the cursor, 7 m)
    const sp = this.setPiece, A = this.aimPt; if (!sp || !A) return null;
    return sp.team.players.filter(q => q !== sp.taker && !q.sentOff && len(q.x - A.x, q.y - A.y) < 7).sort((a, c) => len(a.x - A.x, a.y - A.y) - len(c.x - A.x, c.y - A.y))[0] || null;
  },
  spKick(mode, power = 0.7) {
    const sp = this.setPiece, p = sp.taker, A = this.aimPt;
    const target = this.spTarget();
    sp.kicked = true; for (const q of this.all) { q.spot = null; if (q.up) q.up.t = this.time.now; }   // (smarter-ai: a keeper up for the corner attacks it from now)
    if (mode === 'shot') { this.penaltyKick = sp.kind === 'PENALTY'; this.doShot(p, power, clamp((A.y - 34) / 2.8, -1.2, 1.2)); }
    else if (sp.kind === 'THROW-IN') { const d = Math.min(len(A.x - p.x, A.y - p.y), 22); const dx = A.x - p.x, dy = A.y - p.y, l = len(dx, dy) || 1; this.kick(p, p.x + dx / l * d, p.y + dy / l * d, 0, 0, 0.18, { mode: 'lob', target }); }
    else if (mode === 'ground' && target) this.kick(p, target.x, target.y, 0, 0, 0.14, { mode, target });   // v0.8: a ground ball goes to the ringed man's feet
    else this.kick(p, A.x, A.y, 0, 0, 0.14, { mode, target });
    if (target && sp.team === this.home) { this.nextHuman = target; this.passRing = { p: target, t: 1.0 }; }
    return false;
  },

  // ======================================================================= v0.8.4 MATCH FLOW (Luca, 23 Oct 02:55)
  // Like a real match: a TEAM SHEET before kick-off (swap players around - a placeholder for the final art), the teams
  // WALK OUT of the tunnel under the main stand while the camera takes in the crowd, ADDED TIME per half from the
  // time lost (IFAB Law 7: goals, cards, injuries, penalties, subs), the half ends at a calm moment - an attack in
  // their final third, a corner or a free kick near goal plays out first, a penalty is always completed (Law 7) - and
  // a real HALF-TIME break with the stats and SUBSTITUTIONS. The demo, the Test Lab and the old test page skip all of it.
  flowFast() { return !!window.HC2_TEST_FAST || this.demo || (!!window.__lab && !window.__labCut); },   // (v0.8.7: the Lab's CUT SCENES play the full versions)
  stat(team) { const S = (this.mstats = this.mstats || {}); return S[team.name] || (S[team.name] = { shots: 0, fouls: 0, yellows: 0, reds: 0, corners: 0, poss: 0 }); },
  loseTime(sec) { this.lost = (this.lost || 0) + sec; },
  // t-035 (QA 25 Oct: a soak repro line didn't replay its match on its own, and a second match on the same page could
  // start with a special "cooling down"): a new match is a clean slate, as kick-off of a new match is in every football
  // game. setTeams (match.js) already resets the clock, score, half, stats, meters, teams and players (new objects),
  // the referee, Bug Watch and the replays; this is the rest a match owns - left over from the last one it changed
  // what the next did (the ball's spin / special / last player, a cooldown, a hit-stop or slow motion, a half-made move)
  resetMatchState() {
    const b = this.ball; for (const k of Object.keys(b)) delete b[k];           // the ball as create() makes it (no spin, special, ring, last player...)
    Object.assign(b, { x: 52.5, y: 34, z: 0, vx: 0, vy: 0, vz: 0, owner: null, last: null, roll: 0, inNet: false, skid: false, rollV: 0, target: null });
    if (this.cutIn) this.cutInEnd(); if (this.rise) { this.rise.c.destroy(); this.rise = null; }
    Object.assign(this, { hitStop: 0, slowMo: 0, flashT: 0, trailT: 0, trailSp: 0, trailHot: 0, saveAsk: null, cutInQ: null,   // effects / prompts in flight
      dead: null, offSide: null, offGK: null, offFlag: null, penaltyKick: false, goalAt: 0, lastScorer: null,                    // the rules' memory
      nextHuman: null, passRing: null, passAim: null, passStick: null, spHeld: 0, charge: -1, lobCharge: -1, lobAim: null, headBuf: 0, airSp: null, airCh: null,   // your half-made moves
      aerial: null, aerialClock: 0, aerialAt: undefined, duelAt: undefined, aerialKick: undefined, aerialLast: undefined, spAerialSeen: undefined,   // the aerial battle / grass duel cooldowns
      savedFor: undefined, ghost: null, camX: undefined, camY: undefined, kickCapN: null });   // (ghost: the demo's stand-in "you" held the last match's team)
  },
  resetHalfTime() { this.lost = 0; this.added = null; this.timeUp = null; if (this.addedTxt) this.addedTxt.setVisible(false); },
  announceAdded() {
    if (this.flowFast() && window.HC2_TEST_FAST) { this.added = 0; return; }   // the old tests end halves on the minute
    const lostMin = Math.ceil((this.lost || 0) / 60), close = Math.abs(this.home.score - this.away.score) <= 1;
    this.added = this.half === 1 ? clamp(1 + lostMin, 1, 5) : this.half === 2 ? clamp(2 + lostMin + (close ? 1 : 0), 2, 8) : clamp(lostMin, 1, 3);   // (a tight game: a bit more; extra time: 1-3)
    if (!this.addedTxt) {
      this.addedTxt = this.add.text(172, 59, '', { fontFamily: '"Press Start 2P"', fontSize: '12px', color: '#4cff7a', backgroundColor: '#0c0a0e', padding: { x: 6, y: 5 } });
      this.hud.add(this.addedTxt);
    }
    this.addedTxt.setText(`+${this.added}`).setVisible(true).setScale(1.6);
    this.tweens.add({ targets: this.addedTxt, scale: 1, duration: 900, ease: 'Back.easeOut' });
    if (!this.msg.text) this.say('', `+${this.added} MINUTE${this.added > 1 ? 'S' : ''} ADDED ON`, 2.2);
    const W = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT'][this.added];
    this.ramiSay('banter', { text: `${W} MINUTE${this.added > 1 ? 'S' : ''}\nADDED ON!`, expr: 'talk' }, 2);
  },
  // time is up: blow now, or let what's happening play out?
  canBlow() {
    if (window.HC2_TEST_FAST) return true;                                       // (the old test page: on the minute, like before)
    const T = this.timeUp.t, b = this.ball, sp = this.setPiece;
    if (this.penaltyMode || this.foulScene || this.freeze > 0 || this.pending) return false;
    if (sp) { if (sp.kind === 'PENALTY') return false; if (T > 20) return true;
      const gx = sp.team.goalX, near = len(b.x - gx, b.y - 34) < 35;
      return !(sp.kind === 'CORNER' || (sp.kind === 'FREE KICK' && near)); }        // a corner / free kick near goal: taken first
    if (T > 14) return true;                                                     // (the referee's patience, in real seconds)
    const o = b.owner;
    if (o) { if (o.keeper && o.hands) return true; return (o.x - o.team.ownGoalX) * o.team.side < 70; }   // an attack in their final third plays on
    if (b.shotBy || b.save) return false;                                        // a shot on its way
    for (const t of [this.home, this.away]) if (b.last === t && len(b.x - t.goalX, b.y - 34) < 30) return false;   // a ball into their box
    return true;
  },
  blowHalf() {
    this.timeUp = null; if (this.addedTxt) this.addedTxt.setVisible(false);
    if (this.half === 1) return this.halfTime();
    const level = this.home.score === this.away.score, E = this.endingRule();    // v0.8.5 endings
    if (this.half === 2) {
      this.clock = Math.max(this.clock, 90 * 60);
      if (level && (E === 'et' || E === 'golden' || E === 'etpens')) return this.extraTime();
      if (level && E === 'pens') return this.toPens('FULL TIME');
      return this.fullTime();
    }
    if (this.half === 3) { this.clock = Math.max(this.clock, 105 * 60); return this.etHalfTime(); }
    this.clock = Math.max(this.clock, 120 * 60);
    if (level && (E === 'golden' || E === 'etpens')) return this.toPens('AFTER EXTRA TIME');
    return this.fullTime('FULL TIME · AET');
  },
  // ---- HALF TIME: whistle, they walk off towards the tunnel, the stats + subs, then the second half
  halfTime() {
    SFX.whistle(2, true); this.ramiSay('half_time', {}, 3);
    this.say('HALF TIME', `${this.home.name} ${this.home.score} - ${this.away.score} ${this.away.name}`, 3);
    const b = this.ball; Object.assign(b, { owner: null, vx: 0, vy: 0, vz: 0, target: null, save: null, shotBy: null });
    this.setPiece = null; this.pending = null; this.dead = null; for (const S of this.hSlots()) S.charge = -1;
    for (const p of this.all) { if (p.sentOff) continue; if (p.busy()) p.setState('idle', 0); p.hands = false; p.stun = 0; }
    if (this.flowFast()) { this.secondHalf(true); return; }                     // demo / tests: straight on, like before
    this.htAiSubs = ''; this.aiSubs(this.away); this.htSubsDone = true;          // (the computer's changes show on the card)
    this.ht = { t: 0, phase: 'off' }; this.stadium.cheer(2);
  },
  htTick(dt) {
    const H = this.ht; H.t += dt;
    if (H.phase === 'off' || H.phase === 'card' || H.phase === 'subs') {         // off they go, towards the tunnel
      for (const p of this.all) { if (p.sentOff) continue; p.moveTo(52.5 + (p.team.side < 0 ? 1.2 : -1.2) + (p.i % 3 - 1) * 0.5, -4.5, 1.9, dt); p.step(dt); if (p.y < -3.5) p.hide = true; }
      if (this.ref) { this.ref.goTo = { x: 52.5, y: -4.5 }; this.ref.step(dt); }
      this.camTarget = { x: wx(52.5, -2), y: wy(-9) };
      if (H.phase === 'off' && H.t > paceK().htOff) { H.phase = 'card'; H.auto = paceK().htCard; this.htCard(); }   // (t-004: ARCADE an 8 s card)
      if (H.phase === 'card') { H.auto -= dt; if (H.auto <= 0) this.htDone(); }
    }
    Object.assign(this.ball, { x: 52.5, y: 34, z: 0, vx: 0, vy: 0, owner: null });
  },
  htInput() {
    const H = this.ht; if (!H) return;
    if (H.phase === 'card') { if (Input.pressed('start') || Input.pressed('pass') || (paceK().htAnyKey && (Input.pressed('lob') || Input.pressed('through') || Input.pressed('special') || Input.pressed('sprint')))) this.htDone();   // (t-004: ARCADE any key; SHOOT still opens SUBS)
    else if (Input.pressed('shoot')) this.openSheet('ht'); }
    else if (H.phase === 'subs') { if (Input.pressed('start') || Input.pressed('pass')) this.closeSheet(); }
  },
  htCard() {
    const S = t => this.stat(t), h = this.home, a = this.away, tot = Math.max(1, S(h).poss + S(a).poss);
    const row = (k, x, y) => `<tr><td>${x}</td><th>${k}</th><td>${y}</td></tr>`;
    const el = this.flowEl('ht');
    el.innerHTML = `<h2>HALF TIME</h2><div class="sc">${h.name} ${h.score} - ${a.score} ${a.name}</div>
      <table>${row('POSSESSION', Math.round(100 * S(h).poss / tot) + '%', Math.round(100 * S(a).poss / tot) + '%')}${row('SHOTS', S(h).shots, S(a).shots)}
      ${row('CORNERS', S(h).corners, S(a).corners)}${row('FOULS', S(h).fouls, S(a).fouls)}${row('CARDS', S(h).yellows + S(h).reds, S(a).yellows + S(a).reds)}</table>
      ${this.htAiSubs ? `<small>${this.htAiSubs}</small>` : ''}
      <div class="row"><button data-k="subs">SUBS (${keyset().shoot})</button><button data-k="go" class="go">SECOND HALF &#9654;</button></div><small>ENTER / ${keyset().pass}: SECOND HALF</small>`;
    el.querySelector('[data-k=subs]').onclick = () => this.openSheet('ht');
    el.querySelector('[data-k=go]').onclick = () => this.htDone();
  },
  htDone() { const H = this.ht; if (!H || H.done) return; H.done = true; this.closeFlowEl(); this.secondHalf(); },
  secondHalf(fast) {
    // fresh legs: the break gives some energy back; the computer brings on its most tired men
    for (const p of this.all) if (!p.sentOff) { if (!window.HC2_TEST_FAST) { p.stamina = Math.min(1, p.stamina + 0.35); p.tired = false; } p.hide = false; }
    if (!this.htSubsDone) { this.htAiSubs = ''; if (!window.HC2_TEST_FAST) { this.aiSubs(this.away); if (this.demo) this.aiSubs(this.home); } } this.htSubsDone = false;
    this.half = 2; this.clock = 45 * 60; this.resetHalfTime(); this.ht = null; this.camTarget = null;
    if (this.ref) this.ref.goTo = null;
    const second = (this.firstKick || this.home).opp; this.kickoff(second);   // v0.8.5: the side that didn't start the match
    if (fast) { this.say('HALF TIME', `${this.home.name} ${this.home.score} - ${this.away.score} ${this.away.name}`, 2.5); this.freeze = 2.6; return; }
    this.say('SECOND HALF', `${second.name} TO START`, 1.6);
    this.ramiSay('banter', { text: 'HERE WE GO,\nTHE SECOND HALF!', expr: 'talk' }, 2); this.freeze = paceK().half2Freeze;
  },
  // ---- squads: 11 on the pitch + a bench of 5 (12 = the spare keeper). A player's identity (shirt, legs, cards) moves
  // between slots when you swap; the slot is the position (0 keeper, 1-4 back four, 5-8 midfield, 9-10 up front)
  squadOf(team) {
    const Q = (this.squads = this.squads || {});
    if (!Q[team.name] || Q[team.name].team !== team) Q[team.name] = { team, subs: 0, bench: [12, 13, 14, 15, 16].map(n => ({ num: n, gk: n === 12, stamina: 1, yellows: 0, fouls: 0, used: false })) };
    return Q[team.name];
  },
  ident(p) { return { num: p.num, stamina: p.stamina, tired: p.tired, yellows: p.yellows || 0, fouls: p.fouls || 0, injury: p.injury || null }; },
  setIdent(p, d) { p.num = d.num; p.stamina = d.stamina; p.tired = !!d.tired; p.yellows = d.yellows || 0; p.fouls = d.fouls || 0; p.injury = d.injury || null; },
  aiSubs(team) {                                                                 // the computer: its most tired outfield man off (if he's spent)
    const Q = this.squadOf(team), out = [];
    const tired = team.players.filter(p => !p.keeper && !p.sentOff && (p.stamina < 0.65 || p.injury)).sort((u, v) => (v.injury ? 1 : 0) - (u.injury ? 1 : 0) || u.stamina - v.stamina).slice(0, 1);   // (v0.8.5: the injured first)
    for (const p of tired) { const sb = Q.bench.find(s => !s.gk && !s.used && !s.off); if (!sb || Q.subs >= 3) break;
      const offRec = { ...this.ident(p), off: true, used: true }; this.setIdent(p, { num: sb.num, stamina: 1, yellows: 0, fouls: 0 }); sb.used = true;
      Q.bench.push(offRec); Q.subs++; out.push(`${sb.num} ON, ${offRec.num} OFF`); }
    if (team !== this.home) this.htAiSubs = out.length ? `${team.name}: ${out.join(' · ')}` : '';
  },

  // ---- ENDINGS: what happens when it's level at the end of normal time
  endingRule() {
    if (this.inCup()) return this.cup.stage === 'final' ? (window.HC2_TEST_FAST ? 'pens' : 'etpens') : 'none';
    return (this.mset && this.mset.ending) || 'none';
  },
  halfLabel() { return ['1ST', '2ND', 'ET1', 'ET2'][this.half - 1] || '2ND'; },
  afterGoal(conceded) {                                                          // after a goal (and its replay)
    if (this.golden && this.half >= 3) return this.fullTime('GOLDEN GOAL!');
    if (this.timeUp) return this.blowHalf();
    this.kickoff(conceded);
  },
  stopPlay() {
    const b = this.ball; Object.assign(b, { owner: null, vx: 0, vy: 0, vz: 0, target: null, save: null, shotBy: null });
    this.setPiece = null; this.pending = null; this.dead = null; for (const S of this.hSlots()) S.charge = -1;
    for (const p of this.all) { if (p.sentOff) continue; if (p.busy()) p.setState('idle', 0); p.hands = false; p.stun = 0; p.vx = p.vy = 0; }
  },
  extraTime() {
    const golden = this.endingRule() === 'golden';
    SFX.whistle(3, true); this.stopPlay();
    this.say('EXTRA TIME', `${this.home.name} ${this.home.score} - ${this.away.score} ${this.away.name} · ${golden ? 'GOLDEN GOAL: NEXT GOAL WINS' : '2 x 15 MINUTES'}`, 3.2);
    this.ramiSay('banter', { text: golden ? 'ALL SQUARE!\nNEXT GOAL WINS IT!' : 'ALL SQUARE!\nWE GO TO EXTRA TIME!', expr: 'shock' }, 3);
    this.half = 3; this.clock = 90 * 60; this.resetHalfTime(); this.golden = golden; this.stadium.cheer(3);
    for (const p of this.all) if (!p.sentOff && !window.HC2_TEST_FAST) { p.stamina = Math.min(1, p.stamina + 0.12); p.tired = false; }   // a short break on the pitch
    if (this.flowFast()) { this.kickoff(this.firstKick || this.home); this.etFirst = this.firstKick || this.home; this.freeze = 2.4; return; }
    this.freeze = 99; const ep = this.epoch;
    this.time.delayedCall(2600, () => { if (ep !== this.epoch || this.over) return; this.freeze = 0;
      this.startToss({ quick: true, after: t => { this.etFirst = t; this.kickoff(t); this.say('EXTRA TIME', `${t.name} TO START${golden ? ' · GOLDEN GOAL' : ''}`, 1.8); this.freeze = 1.8; } }); });
  },
  etHalfTime() {                                                                 // after 105 min: change round, no break
    SFX.whistle(2); this.half = 4; this.clock = 105 * 60; this.resetHalfTime();
    const t = (this.etFirst || this.home).opp; this.kickoff(t);
    this.say('EXTRA TIME · 2ND HALF', `${this.home.name} ${this.home.score} - ${this.away.score} ${this.away.name} · ${t.name} TO START`, 2.4); this.freeze = 2.4;
  },
  toPens(head) {
    if (this.inCup()) this.cupPens = true; else this.matchPens = true;
    this.resumeEnd();                                                            // v0.10.2: decided now, nothing to resume
    this.stopPlay(); SFX.whistle(3, true);
    this.say(head, 'LEVEL - IT GOES TO PENALTIES!', 3);
    this.ramiSay('full_time', { text: this.inCup() ? 'ALL SQUARE IN THE FINAL!\nPENALTIES!!' : 'ALL SQUARE!\nPENALTIES!!', expr: 'shock' }, 3);
    const ep = this.epoch; this.time.delayedCall(3200, () => { if (ep === this.epoch) this.startShootout(true); }); this.over = true;
  },
  fullTime(head) {
    this.resumeEnd();                                                            // v0.10.2: the match is over, the RESUME button goes
    this.over = true; this.golden = false; this.say(head || 'FULL TIME', this.ftLine(), 99999); SFX.whistle(3, true); SFX.roar(4, 0.7);
    { const h = this.home.score, a = this.away.score; this.ramiSay('full_time', h === a ? { text: 'THAT IS FULL TIME!\nHONOURS EVEN!' } : head === 'GOLDEN GOAL!' ? { text: `GOLDEN GOAL!!\n${(h > a ? this.home : this.away).name} WIN IT!`, expr: 'laugh' } : { WINNER: (h > a ? this.home : this.away).name }, 3); }
    for (const p of this.all) { if (p.sentOff) continue; p.vx = p.vy = 0; p.speed = 0; if (p.busy()) p.setState('idle', 0);   // everyone stops
      if (!p.keeper && MAN.kits[p.kit].anims['applaud-S']) { p.setState('applaud', 999); p.face = 6; } }
  },

  // ---- COIN TOSS (after the walk-out; again before extra time): the captains + the referee at the centre spot, you call
  // it, the referee flips the PixelLab coin (RISE on one side, the RISE arrow on the other), the winner picks who kicks off
  startToss(opts = {}) {
    const done = t => (opts.after ? opts.after(t) : this.kickoff(t));
    if (this.flowFast() || !this.textures.exists('coin')) { this.firstKick = this.firstKick || this.home; return done(opts.quick ? this.home : this.firstKick); }
    for (const p of this.all) { if (p.sentOff) continue; p.x = p.home.x; p.y = p.home.y; p.vx = p.vy = 0; p.state = 'idle'; p.hide = false; p.face = p.team.side > 0 ? 0 : 4; }
    const cap = t => t.players.filter(p => !p.sentOff && !p.keeper).sort((a, b) => b.i - a.i)[0] || t.players[0];
    const ch = cap(this.home), ca = cap(this.away);
    ch.x = 51.1; ch.y = 34.3; ch.face = 0; ca.x = 53.9; ca.y = 34.3; ca.face = 4;
    if (this.ref) { this.ref.x = 52.5; this.ref.y = 33.2; this.ref.vx = this.ref.vy = 0; this.ref.goTo = null; this.ref.face = 6; this.ref.hidden = false; }
    Object.assign(this.ball, { x: 52.5, y: 34, z: 0, vx: 0, vy: 0, vz: 0, owner: null, target: null });
    this.setPiece = null; this.pending = null; this.dead = null; this.freeze = 0;
    this.camTarget = { x: wx(52.5, 34), y: wy(34) - Math.round(VIEW_H * 0.4) };                      // (the centre spot low in the shot: the coin above the captains)
    this.camX = this.camTarget.x; this.camY = this.camTarget.y;                  // (a cut, not a pan)
    const human = !this.demo, quick = !!opts.quick;
    const ph = quick || !human ? 'auto' : 'call';
    this.toss = { t: 0, phase: ph, phase0: ph, call: 0, pick: 0, quick, human, done, spin: 0 };
    if (!this.coinUi) {
      const F = '"Press Start 2P"';
      this.coinUi = {
        dim: this.add.rectangle(VIEW_W / 2, VIEW_H / 2, VIEW_W, VIEW_H, 0x0c0a0e, 0.35),
        sh: this.add.ellipse(VIEW_W / 2, COIN_Y + 92, 110, 18, 0x0c0a0e, 0.45),
        coin: this.add.image(VIEW_W / 2, COIN_Y, 'coin', 'rise-0').setScale(COIN_S),
        a: this.add.text(VIEW_W / 2 - 235, COIN_Y, '', { fontFamily: F, fontSize: '14px', color: '#0c0a0e', backgroundColor: '#f4f0e4', padding: { x: 10, y: 8 } }).setOrigin(0.5),
        b: this.add.text(VIEW_W / 2 + 235, COIN_Y, '', { fontFamily: F, fontSize: '14px', color: '#0c0a0e', backgroundColor: '#f4f0e4', padding: { x: 10, y: 8 } }).setOrigin(0.5),
        hint: this.add.text(VIEW_W / 2, VIEW_H * 0.26 + 72, '', { fontFamily: F, fontSize: '9px', color: '#f4f0e4', stroke: '#0c0a0e', strokeThickness: 4 }).setOrigin(0.5),
      };
      const U = this.coinUi; this.hud.add([U.dim, U.sh, U.coin, U.a, U.b, U.hint]); this.hud.bringToTop(this.msg); this.hud.bringToTop(this.sub);
      U.a.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.tossPick(0));
      U.b.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.tossPick(1));
    }
    this.tossUi(true);
    this.say('COIN TOSS', quick ? 'FOR EXTRA TIME' : `${this.arenaName()} · ${this.home.name} v ${this.away.name}`, 99);
    if (this.toss.phase === 'call') this.ramiSay('banter', { text: 'THE CAPTAINS MEET.\nCALL IT!', expr: 'talk' }, 4);
    this.tossDraw();
  },
  tossUi(on) { const U = this.coinUi; if (!U) return; for (const k in U) U[k].setVisible(on); this.ballSpr.setVisible(!on); if (this.cursor) this.cursor.setVisible(!on); },
  tossPick(i) {                                                                  // a click on one of the two choices
    const T = this.toss; if (!T) return;
    if (T.phase === 'call') { T.call = i; this.tossGo(); } else if (T.phase === 'choose') { T.pick = i; this.tossChosen(); }
  },
  tossGo() {                                                                     // the referee flips it
    const T = this.toss; T.phase = 'flip'; T.t = 0; T.result = Math.random() < 0.5 ? 0 : 1;   // 0 = RISE, 1 = ARROW
    if (T.human && T.phase0 === 'call') T.winner = T.call === T.result ? this.home : this.away;   // you called it
    else { T.call = Math.random() < 0.5 ? 0 : 1; T.winner = Math.random() < 0.5 ? this.home : this.away; }
    if (this.ref) this.ref.act('whistle', 0.6);
    this.msg.setText(''); this.sub.setText('');                                  // (the coin flies up through where the title was)
    SFX.flick(); this.tossDraw();
  },
  tossChosen() {
    const T = this.toss, kicks = T.winner === this.home ? (T.pick === 0 ? this.home : this.away) : T.winner;
    this.endToss(kicks);
  },
  endToss(kicks) {
    const T = this.toss; if (!T) return; this.toss = null; this.tossUi(false); this.camTarget = null; this.msg.setText(''); this.sub.setText('');
    if (!T.quick) this.firstKick = kicks;
    T.done(kicks);
  },
  tossTick(dt) {
    const T = this.toss; T.t += dt; const U = this.coinUi;
    if (Input.pressed('shoot') && T.phase !== 'flip') {                            // K / X: skip it
      if (!T.winner) { T.result = Math.random() < 0.5 ? 0 : 1; T.winner = Math.random() < 0.5 ? this.home : this.away; }
      return this.endToss(T.winner);
    }
    if (T.phase === 'auto' && T.t > 0.8) this.tossGo();
    else if (T.phase === 'call') {
      const n = Input.nav(); if (n.x) { T.call = n.x < 0 ? 0 : 1; SFX.click(); this.tossDraw(); }
      if (Input.pressed('start') || Input.pressed('pass') || T.t > 8) this.tossGo();
    } else if (T.phase === 'flip') {
      const D = 1.7, k = clamp(T.t / D, 0, 1);
      T.spin += dt * (26 - 20 * k);                                              // fast, then slower as it comes down
      const lift = Math.sin(k * Math.PI) * VIEW_H * 0.24;
      U.coin.setY(Math.round(COIN_Y - lift)); U.sh.setScale(1 - 0.55 * Math.sin(k * Math.PI), 1).setAlpha(0.45 - 0.25 * Math.sin(k * Math.PI));
      const cyc = COIN_SPIN, i = Math.floor(T.spin) % cyc.length;
      if (k >= 1) { U.coin.setFrame(T.result ? 'arrow-0' : 'rise-0').setY(COIN_Y); SFX.coin(); T.phase = 'show'; T.t = 0;
        this.say(T.result ? 'ARROW!' : 'RISE!', `${T.winner.name} WIN THE TOSS`, 99); this.stadium.cheer(1.5); this.tossDraw(); }
      else U.coin.setFrame(cyc[i]);
    } else if (T.phase === 'show') {
      U.coin.setScale(COIN_S + Math.max(0, 0.5 - T.t) * 0.7);
      if (T.t > 1.5) {
        if (T.human && T.phase0 === 'call' && T.winner === this.home) { T.phase = 'choose'; T.t = 0; T.pick = 0; this.say('YOU WON THE TOSS', 'WHO KICKS OFF?', 99); this.tossDraw(); }
        else { const kicks = T.winner; this.say(T.result ? 'ARROW!' : 'RISE!', `${T.winner.name} WIN THE TOSS · ${kicks.name} KICK OFF`, 1.2); this.endToss(kicks); }
      }
    } else if (T.phase === 'choose') {
      const n = Input.nav(); if (n.x) { T.pick = n.x < 0 ? 0 : 1; SFX.click(); this.tossDraw(); }
      if (Input.pressed('start') || Input.pressed('pass') || T.t > 7) this.tossChosen();
    }
  },
  tossDraw() {
    const T = this.toss, U = this.coinUi; if (!T || !U) return;
    const k = keyset(), sel = (o, on) => o.setStyle({ backgroundColor: on ? '#ffde1e' : '#f4f0e4' }).setScale(on ? 1.08 : 1);
    if (T.phase === 'call') { U.a.setText('◀ RISE'); U.b.setText('ARROW ▶'); sel(U.a, T.call === 0); sel(U.b, T.call === 1); U.hint.setText(`CALL IT · ENTER / ${k.pass}: FLIP · ${k.shoot}: SKIP`); U.a.setVisible(true); U.b.setVisible(true);
      U.coin.setFrame(T.call ? 'arrow-0' : 'rise-0').setY(COIN_Y).setScale(COIN_S); }
    else if (T.phase === 'choose') { U.a.setText('◀ WE KICK OFF'); U.b.setText('THEY KICK OFF ▶'); sel(U.a, T.pick === 0); sel(U.b, T.pick === 1); U.hint.setText(`ENTER / ${k.pass}: OK`); U.a.setVisible(true); U.b.setVisible(true); }
    else { U.a.setVisible(false); U.b.setVisible(false); U.hint.setText(T.phase === 'flip' ? '' : T.phase === 'auto' ? (T.quick ? 'A NEW TOSS FOR EXTRA TIME' : '') : ''); }
  },
  sendOff(p) {
    p.sentOff = true; p.state = 'idle'; p.vx = p.vy = 0; p.x = -60; p.y = -60; p.stun = 1e9; p.cool = 1e9; p.hands = false;
    if (this.ball.owner === p) this.ball.owner = null;
    if (this.isHuman(p)) this.asSide(p.team, () => this.switchHuman());          // (t-043: his own side's next man)
    for (const S of this.hSlots()) if (S.nextHuman === p) S.nextHuman = null;
  },
  // ======================================================================= t-024 OFFSIDE (Luca 25 Oct 07:14: "OFF SIDE rule
  // MANDATORY just make it smooth"). IFAB Law 11, simplified:
  //  * when a team-mate plays the ball (releaseKick: the contact frame, not the button), every man of his in their half,
  //    nearer their goal line than the ball AND than the second-last opponent (the keeper counts), is in an offside
  //    POSITION. Level (OFFSIDE.LEVEL) is onside. None from a throw-in, a corner or a goal kick.
  //  * he's only penalised when he plays it: gets it, heads it, shoots it (offWatch, every step). Being there and not
  //    touching it is fine (the "clearly blocks a defender / the keeper" part is left out - too much guesswork).
  //  * it lasts until someone else plays it: an onside team-mate, or an opponent's deliberate play (he gets it, heads it,
  //    kicks it). A save or a deflection (a block, a ball off a body) doesn't end it.
  //  * the call is instant and short: the HUD callout + Rami, the flagged man marked a moment, and the defending side's
  //    quick free kick where he played it (the restart's own whistle). No replay, no scene.
  // Frames are the team's (aiFrame: metres from the centre line, + = towards the goal it attacks).
  offLine(team) {                                                                // their second-last man (the keeper counts)
    const xs = team.opp.players.filter(o => !o.sentOff).map(o => this.aiFrame(team, o.x));
    if (xs.length < 2) xs.push(52.5);                                            // (half a team in a Lab set-up: an empty goal counts as its keeper)
    return xs.sort((u, v) => v - u)[1];
  },
  offPos(q, line = this.offLine(q.team)) {                                       // is he in an offside position right now?
    const X = this.aiFrame(q.team, q.x);
    return X > 0 && X > this.aiFrame(q.team, this.ball.x) + 0.05 && X > line + OFFSIDE.LEVEL;
  },
  offKick(k) {                                                                   // the snapshot, from releaseKick (true = he's offside: no kick)
    const S = this.offSide, sp = this.setPiece, by = k.p;
    if (!offsideOn()) { this.offSide = null; return false; }
    if (S && S.team === by.team && S.men.has(by)) { this.offCall(by, S); return true; }   // (a first-time shot / pass by the man who was off)
    const kind = sp && sp.taker === by ? sp.kind : '', gk = this.offGK; this.offGK = null;
    if (kind === 'THROW-IN' || kind === 'CORNER' || kind === 'GOAL KICK' || gk === by) { this.offSide = null; return false; }
    const team = by.team, line = this.offLine(team), men = new Map();
    for (const q of team.players) if (q !== by && !q.sentOff && !q.keeper && this.offPos(q, line)) men.set(q, { x: q.x, y: q.y });
    this.offSide = men.size ? { team, by, men, line, lp: undefined } : null;
    return false;
  },
  offWatch() {                                                                   // every step: has one of them played it? has the phase ended?
    const S = this.offSide; if (!S) return false;
    const b = this.ball, o = b.owner;
    if (!offsideOn()) { this.offSide = null; return false; }
    if (o) { if (o.team === S.team && S.men.has(o)) { this.offCall(o, S); return true; } this.offSide = null; return false; }   // anyone else has it: over
    if (S.lp === undefined) S.lp = b.lastP;                                      // (the kick's own step: a block on the strike is a deflection)
    const lp = b.lastP; if (!lp || lp === S.lp) return false;
    S.lp = lp;
    if (lp.team === S.team) { if (S.men.has(lp)) { this.offCall(lp, S); return true; } if (lp !== S.by) this.offSide = null; return false; }   // his header / volley: off; an onside mate's touch: over
    if (!lp.keeper) this.offSide = null;                                         // their header / clearance: a deliberate play, over (a keeper's touch is a save)
    return false;
  },
  offCall(p, S) {
    const def = S.team.opp, x = clamp(p.x, 1, PITCH_L - 1), y = clamp(p.y, 1, PITCH_W - 1), b = this.ball;
    this.offSide = null; this.pending = null; for (const S of this.hSlots()) S.charge = -1; p.hands = false;
    Object.assign(b, { owner: null, vx: 0, vy: 0, vz: 0, target: null, save: null, saveable: null, special: 0, shotBy: null, lob: false, ring: null, crossBy: null });
    const st = this.stat(S.team); st.offsides = (st.offsides || 0) + 1;
    this.offFlag = { p, until: this.time.now + OFFSIDE.FLAG * 1000 };             // (ui.js marks him)
    this.offLast = { p, team: S.team, x, y, from: S.men.get(p), past: this.aiFrame(S.team, S.men.get(p).x) - S.line, t: this.time.now };   // (the Test Lab and the soak read this)
    if (this.ref) this.ref.act('whistle', 0.6);
    // the free kick to the defenders, where he played it (its whistle). t-029: no longer instant - its setup (spSetup):
    // the side that was caught trots back onside, the defenders push up, a defender or the keeper places it
    this.restart('FREE KICK', def, x, y, `#${p.num} WAS OFF · FREE KICK ${def.name}`, { offside: true });
    this.ramiSay('offside', {}, 2);
  },
  // a foul: free kick where it happened, or a penalty if it was in the fouler's own box.
  // v0.8 FOUL SCENE (Luca: no hard cut any more): whistle, the man goes down, play stops; the ref runs over and shows
  // the card to the fouler himself, Rami has his say, the fouler protests, the victim stays down hurt - then a TV wipe
  // to the free kick with both teams already lined up. Any action key skips it (like FIFA's cutscenes).
  foul(by, victim, fromBehind) {
    if (this.setPiece || this.freeze > 0 || this.foulScene || this.penaltyMode) return;
    by.fouls = (by.fouls || 0) + 1; this.stat(by.team).fouls++;
    let card = '';
    if ((fromBehind && Math.random() < 0.6) || by.fouls >= 3) { by.yellows = (by.yellows || 0) + 1; card = by.yellows >= 2 ? 'RED CARD!' : 'YELLOW CARD'; }
    if (card) this.stat(by.team)[card === 'YELLOW CARD' ? 'yellows' : 'reds']++;
    this.loseTime(card ? 40 : 12);                                               // v0.8.4: added time
    const def = by.team, gx = def.ownGoalX, b = this.ball;
    const inBox = Math.abs(victim.x - gx) < 16.5 && Math.abs(victim.y - 34) < 20.16;
    if (paceK().advantage && !card && !inBox) {                                  // arcade-2 ADVANTAGE (the co-designer: "fouls stop play only for a
      if (!victim.keeper && victim.state !== 'fall' && victim.state !== 'getup') victim.setState('fall', 0.8);   // card", ~9 s of foul scenes a match):
      const mate = victim.team.players.filter(q => q !== victim && !q.sentOff && !q.keeper && !q.busy() && len(q.x - b.x, q.y - b.y) < 5)   // a team-mate right there
        .sort((u, v) => len(u.x - b.x, u.y - b.y) - len(v.x - b.x, v.y - b.y))[0];   // plays on with it, else a quick free kick, no scene
      this.pending = null; for (const S of this.hSlots()) { S.charge = -1; S.passAim = null; } this.loseTime(-8);
      if (mate) { Object.assign(b, { owner: null, target: null, save: null, z: 0, vz: 0 }); this.gain(mate, 0); this.say('', 'ADVANTAGE!', 0.9); this.ramiSay('foul', { text: 'PLAY ON!\nADVANTAGE!', expr: 'smirk' }, 2); return; }
      SFX.whistle(1); this.restart('FREE KICK', victim.team, clamp(victim.x, 1, PITCH_L - 1), clamp(victim.y, 1, PITCH_W - 1)); return;
    }
    SFX.whistle(1);
    if (!victim.keeper && victim.state !== 'fall' && victim.state !== 'getup') {        // he goes down
      const ux = victim.x - by.x, uy = victim.y - by.y, ul = len(ux, uy) || 1;
      victim.setState('fall', 0.8); victim.vx = victim.vx * 0.4 + ux / ul * 2.2; victim.vy = victim.vy * 0.4 + uy / ul * 2.2;
    }
    Object.assign(b, { owner: null, target: null, save: null }); this.pending = null; for (const S of this.hSlots()) { S.charge = -1; S.passAim = null; }
    if (this.ref) { const r = this.ref, dx = r.x - by.x, dy = r.y - by.y, d = len(dx, dy);
      if (card && d > 9) { r.x = by.x + dx / d * 9; r.y = by.y + dy / d * 9; }   // he runs in from just off screen
      r.act('whistle', 0.45); }
    this.say('FOUL!', '', 1.3);
    // v0.8.5 INJURY CHANCE (Luca): a bad one can leave him limping (slower) until he's subbed - more likely on a card / from behind
    const injured = !victim.keeper && !victim.injury && !this.demo && !window.HC2_TEST_FAST && !window.__lab && Math.random() < (card ? 0.14 : 0.04) + (fromBehind ? 0.04 : 0);
    if (injured) { victim.injury = { k: rnd(0.7, 0.82) }; this.loseTime(50); }
    this.foulScene = { t: 0, by, victim, card, inBox, injured, kind: inBox ? 'PENALTY' : 'FREE KICK', team: victim.team,
      x: inBox ? gx + def.side * 11 : clamp(victim.x, 1, PITCH_L - 1), y: inBox ? 34 : clamp(victim.y, 1, PITCH_W - 1),
      shown: false, hurt: false, end: card ? 99 : injured ? 3.4 : 1.9, wipeT: -1, n: this.recN || 0 };
    if (!card) this.ramiSay('foul', { text: this.foulLine('', inBox, by), expr: inBox ? 'shock' : 'smirk' }, 2);
  },
  foulLine(card, inBox, by) {                                                     // Rami's take (Luca: "some funny line")
    const pick = a => a[Math.floor(Math.random() * a.length)];
    if (card === 'RED CARD!') return pick(['RED CARD!\nOFF YOU GO, ' + by.num + '!', 'OUTRAGEOUS!\nHE IS OFF!', 'THAT IS A RED!\nSEE YOU NEXT SEASON!', 'EARLY SHOWER\nFOR NUMBER ' + by.num + '!']);
    if (card) return pick(['OOF! THAT WAS A\nTERRIBLE FOUL!', 'HE TOOK THE MAN,\nNOT THE BALL!', 'THAT IS NOT FOOTBALL,\nTHAT IS WRESTLING!', 'HE WILL FEEL THAT\nONE TOMORROW!', 'BOOKED! AND HE\nKNOWS IT, ' + by.num + '!']);
    if (inBox) return pick(['PENALTY!! WHAT WAS\nHE THINKING?!', 'IN THE BOX!\nTHE REF POINTS TO THE SPOT!']);
    return pick(['A BIT LATE THERE!\nFREE KICK.', 'CLUMSY!\nREF HAS SEEN IT.', 'HE WENT DOWN LIKE\nA SACK OF SPUDS!', 'NAUGHTY!\nFREE KICK.']);
  },
  foulSceneTick(dt) {
    const F = this.foulScene, b = this.ball, by = F.by, v = F.victim, ref = this.ref;
    F.t += dt;
    if (F.wipeT >= 0) { F.wipeT -= dt; if (F.wipeT < 0) this.endFoulScene(); return; }   // the wipe is covering the cut
    // the ball rolls dead
    b.z = Math.max(0, b.z - dt * 3); b.vz = 0; const k = Math.exp(-dt * 3.5); b.vx *= k; b.vy *= k;
    b.x = clamp(b.x + b.vx * dt, 0.5, PITCH_L - 0.5); b.y = clamp(b.y + b.vy * dt, 0.5, PITCH_W - 0.5);
    // everyone pulls up; the ones close by wander over to have a look
    for (const p of this.all) {
      if (p.sentOff) continue;
      if (p !== by && p !== v && !p.keeper && !p.busy()) {
        const dx = p.x - by.x, dy = p.y - by.y, d = len(dx, dy);
        if (d < 14 && d > 4.5 && F.t > 0.4) p.moveTo(by.x + dx / d * 4.5, by.y + dy / d * 4.5, 1.9, dt); else p.steer(0, 0, dt);
        if (d < 14 && p.speed < 0.3) p.look(by.x - p.x, by.y - p.y);
      } else if (!p.busy()) p.steer(0, 0, dt);
      p.step(dt);
    }
    if (F.t > 0.85 && !F.hurt && (F.card || F.injured) && MAN.kits[v.kit].anims['hurt-S'] && !v.keeper && (v.state === 'getup' || !v.busy())) {   // stays down, holding it
      F.hurt = true; v.setState('hurt', 2.6); v.face = 6; v.vx = v.vy = 0;
    }
    if (F.card && !F.shown) {
      const tx = clamp(by.x + 0.9, 1, PITCH_L - 1), ty = clamp(by.y - 2.0, 0.5, PITCH_W - 1);   // just behind him, facing the camera and him
      if (ref && F.t > 0.45) ref.goTo = { x: tx, y: ty };
      const there = !ref || (F.t > 0.45 && len(ref.x - tx, ref.y - ty) < 0.6);
      if (there || F.t > 3.2) {
        F.shown = true; F.end = F.t + 2.3;
        if (ref) { ref.goTo = null; if (!there) { ref.x = tx; ref.y = ty; } ref.act(F.card === 'RED CARD!' ? 'cardR' : 'card', 2.3); }
        if (!by.busy() || by.state === 'getup' || by.state === 'tackle') { if (MAN.kits[by.kit].anims['protest-S']) by.setState('protest', 2.0); by.face = 6; by.vx = by.vy = 0; }
        this.ramiSay(F.card === 'RED CARD!' ? 'red' : 'yellow', { text: this.foulLine(F.card, F.inBox, by), expr: F.card === 'RED CARD!' ? 'shock' : 'laugh' }, 3);
        this.say(F.card === 'RED CARD!' ? 'RED CARD!' : 'YELLOW CARD', `${by.team.name} #${by.num}`, 2.2);
        this.cardPop(by, F.card);
      }
    } else if (!F.card && !F.protest && F.t > 0.5 && !by.busy() && Math.random() < 0.6 && MAN.kits[by.kit].anims['protest-S']) { F.protest = true; by.setState('protest', 1.1); by.face = 6; by.vx = by.vy = 0; }
    else if (!F.card && !F.protest && F.t > 0.5) F.protest = true;
    const skip = !this.demo && F.t > 0.9 && (Input.pressed('pass') || Input.pressed('shoot') || Input.pressed('lob'));
    if (skip) { F.wipeT = 0.24; this.wipe(); return; }
    if (F.t >= F.end) {                                                          // v0.8.1 (Luca): a replay of the tackle for cards + penalties
      const fr = (F.card || F.inBox) && this.foulFrames(F);
      if (fr) { const cap = F.card ? `${F.card === 'RED CARD!' ? 'RED CARD' : 'YELLOW CARD'} · ${F.by.team.name} #${F.by.num}` : 'PENALTY';
        F.wipeT = 1e9; this.startReplay('FOUL', () => this.endFoulScene(), fr, { caption: cap, slowPre: 1.0, slow: 1.2 }); }
      else { F.wipeT = 0.24; this.wipe(); }
    }
  },
  foulFrames(F) {                                                                // ~2.5 s before the contact to ~0.8 s after, slow-mo on the contact
    const rec = this.rec || [], i = this.recIndex(F.n); if (i < 60 || i >= rec.length) return null;
    const a = Math.max(0, i - 120), fr = rec.slice(a, Math.min(rec.length, i + 45)).map(f => Object.assign({}, f));
    fr[i - a].goal = true; return fr.length >= 60 ? fr : null;
  },
  cardPop(by, card) {                                                             // the card pops up over the booked player
    if (!this.textures.exists('fx') || !this.textures.get('fx').has('cardY')) return;
    const im = this.add.image(0, 0, 'fx', card === 'RED CARD!' ? 'cardR' : 'cardY').setScale(0.2).setDepth(8e6 + 2), o = { lift: 0 };
    const stick = () => { if (!by.sentOff) im.setPosition(wx(by.x, by.y), wy(by.y) - 150 - o.lift); };
    stick(); this.events.on('postupdate', stick);
    this.tweens.add({ targets: im, scale: 1.1, angle: 8, duration: 220, ease: 'Back.easeOut', onComplete: () => this.tweens.add({ targets: [im, o], alpha: 0, lift: 20, delay: 1500, duration: 300, onComplete: () => { this.events.off('postupdate', stick); im.destroy(); } }) });
  },
  endFoulScene() {
    const F = this.foulScene; this.foulScene = null; if (!F) return;
    if (F.card === 'RED CARD!' && !F.by.keeper) this.sendOff(F.by);
    if (this.ref) { this.ref.goTo = null; this.ref.t = 0; this.ref.state = 'idle'; }
    this.camX = this.camY = undefined;                                           // a cut, not a pan
    this.restart(F.kind, F.team, F.x, F.y, F.inBox ? F.card : '', { cut: true });
    if (this.ref && !this.penaltyMode) this.ref.place(this.ball);
    if (F.injured) this.injuryNews(F.victim);
  },
  // v0.8.5: after the free kick is given - the computer brings a man on for him; you get told (PAUSE -> TEAM to sub him)
  injuryNews(v) {
    if (!v.injury || v.sentOff) return;
    const t = v.team, human = this.hasHuman(t) && !this.demo;
    if (!human && this.injSub(v)) return;
    this.ramiSay('foul', { text: `THAT LOOKS BAD.\nNUMBER ${v.num} IS LIMPING.`, expr: 'shock' }, 3);
    this.time.delayedCall(2600, () => { if (!this.over) this.say('INJURY', human ? `#${v.num} IS LIMPING · PAUSE (ENTER) -> TEAM TO SUB HIM` : `${t.name} #${v.num} PLAYS ON LIMPING`, 3); });
  },
  injSub(p) {                                                                    // a sub for this man, if the team has one left
    const Q = this.squadOf(p.team), sb = Q.bench.find(s => !s.gk && !s.used && !s.off); if (!sb || Q.subs >= 3) return false;
    const offRec = { ...this.ident(p), off: true, used: true }; this.setIdent(p, { num: sb.num, stamina: 1, yellows: 0, fouls: 0 }); sb.used = true; Q.bench.push(offRec); Q.subs++;
    SFX.whistle(1); this.loseTime(30);
    this.time.delayedCall(2600, () => { if (!this.over) this.say('SUBSTITUTION', `${p.team.name}: #${sb.num} ON FOR THE INJURED #${offRec.num}`, 2.6); });
    return true;
  },
  // a shot that missed or got saved: the shooter can't believe it (batch 7 'big chance missed', facing the camera)
  missedChance(team, how = 'wide') {
    const s = this.ball.shotBy; this.ball.shotBy = null;
    if (s && s.team === team && how === 'wide') this.ramiSay('miss');
    if (!s || s.team !== team || s.busy() || s.sentOff || !MAN.kits[s.kit].anims['chance-S']) return;
    this.time.delayedCall(250, () => { if (!s.busy()) { s.setState('chance', 1.5); s.vx = s.vy = 0; } });
  },
  rules() {
    const b = this.ball;
    if (this.spCam && this.camTarget === this.spCam) this.camTarget = null;     // (t-029: a setup cut short - half time, a new test - never keeps the camera)
    if (this.setPiece && this.setPiece.su) return;                               // (t-029: a corner's ball waits behind the line for its cut - it isn't going out again)
    if ((b.special || b.saveable) && (b.inNet || b.x < -0.5 || b.x > PITCH_L + 0.5 || b.y < -0.5 || b.y > PITCH_W + 0.5)) { b.special = 0; b.saveable = null; }   // v0.8.7: out / in the net = an ordinary ball again
    if (this.offWatch()) return;                                                 // t-024: a man who was offside when it was played has just played it
    if (b.inNet || (b.owner && b.owner.hands) || this.dead) return;
    if (b.owner && (b.x < 0 || b.x > PITCH_L || b.y < 0 || b.y > PITCH_W)) { b.last = b.owner.team; b.owner = null; }   // dribbled out
    if (b.owner) return;
    if (!b.inNet && (b.x < 0 || b.x > PITCH_L)) {
      const left = b.x < 0, defending = left ? (this.home.side > 0 ? this.home : this.away) : (this.home.side > 0 ? this.away : this.home);
      if (b.y > GOAL_Y0 && b.y < GOAL_Y1 && b.z < BAR_Z) {
        b.inNet = true; const scorer = defending.opp; scorer.score++;
        this.netRipple(left ? 'L' : 'R', len(b.vx, b.vy, b.vz)); b.vx *= 0.5; b.vz *= 0.4;      // the net takes the pace off
        const hero = b.lastP && b.lastP.team === scorer && !b.lastP.keeper ? b.lastP : null;
        if (hero) { hero.setState('celebrate', 2.6); hero.face = 6; hero.vx = hero.vy = 0;
          const KA = MAN.kits[hero.kit].anims, opts = ['celebrate', 'celeb2', 'celeb3', 'celeb4'].filter(c => KA[`${c}-S`]);   // batch 7-8: knee slide, aeroplane
          hero.celeAnim = opts[Math.floor(Math.random() * opts.length)] || 'celebrate';
          if (KA[`${hero.celeAnim}-E`] && Math.random() < 0.5) hero.face = scorer.side > 0 ? 4 : 0; }          // half the time towards the side, not the camera
        for (const p of defending.players) {                                       // the beaten side: keeper on his knees, heads drop
          if (p.sentOff || (p.busy() && !p.keeper)) continue;
          const KA = MAN.kits[p.kit].anims;
          if (p.keeper) { if (KA['pkdefeat-S']) { const g = p; this.time.delayedCall(800, () => { if (!g.busy() && !g.hands) { g.setState('beaten', 2.2); g.face = 6; g.vx = g.vy = 0; } }); } }
          else if (KA['dejected-S'] && len(p.x - b.x, p.y - b.y) < 35 && Math.random() < 0.7) { const q = p; this.time.delayedCall(200 + Math.random() * 500, () => { if (!q.busy()) { q.setState('dejected', 2.2); q.face = 6; q.vx = q.vy = 0; } }); }
        }
        this.stadium.cheer(4.5); this.say('GOAL!!', `${scorer.name} SCORES`, 2.8); SFX.net(); SFX.roar(5, 1);
        if (this.ref) this.ref.act('whistle', 2.2);
        if (window.__lab && !window.__labCut) { this.time.delayedCall(2600, () => this.kickoff(defending)); this.freeze = 2.7; return; }   // (v0.8.7: the Lab's GOAL cut scene gets the real celebration + replay)
        this.goalAt = this.recN || 0; this.evReplay = null; this.lastScorer = { team: scorer, min: Math.min(HALF_END[this.half - 1] || 90, Math.floor(this.clock / 60) + 1), num: hero && hero.num,
          own: !!(b.lastP && b.lastP.team === defending && !b.lastP.keeper), late: this.half >= 2 && this.clock > ((HALF_END[this.half - 1] || 90) - 3) * 60,
          bike: !!(this.lastBike && this.lastBike.p === b.lastP && this.time.now - this.lastBike.t < 2500),
          how: b.how && b.how.kind, far: b.how ? len(b.how.x - (left ? 0 : PITCH_L), b.how.y - 34) : 0 };
        this.ramiSay('goal', {}, 3); this.loseTime(45);                         // v0.8.4: celebrations cost time
        { const ep = this.epoch;                                                 // celebrate, then the replay
          this.time.delayedCall(paceK().goalWaitMs, () => { if (ep !== this.epoch || this.over && !this.cupPens) return;   // (t-004: ARCADE sooner, and a shorter replay)
            // v0.8.2: the frames are taken NOW (a pause-menu replay can't empty them later); if you've paused or another
            // replay is on, it waits its turn - and so does the kick-off after it
            const rec = this.rec || [], frames = rec.slice(-paceK().goalFrames), gi = this.recIndex(this.goalAt || 0) - (rec.length - frames.length); if (frames[gi]) frames[gi].goal = true;
            this.goalQ = { ep, frames, after: () => this.afterGoal(defending) }; this.goalQTick(); }); }   // v0.8.4: a goal in the last seconds - then the whistle
        this.freeze = 99; return;
      }
      if (paceK().arcade) return this.arcadeOut();                              // t-020 ARCADE: no corners or goal kicks - it comes back off the board
      if (b.last === defending) this.dead = { kind: 'CORNER', team: defending.opp, x: left ? 0.4 : PITCH_L - 0.4, y: b.y < 34 ? 0.4 : PITCH_W - 0.4, t: 0.8 * paceK().deadT };   // (t-004: ARCADE restarts sooner)
      else {
        const close = b.shotBy && b.shotBy.team === defending.opp && Math.min(Math.abs(b.y - GOAL_Y0), Math.abs(b.y - GOAL_Y1)) < 1.3 && b.z < BAR_Z + 0.8;
        if (close) { this.flagReplay('SO CLOSE!'); SFX.ooh(); }                                   // inches wide: worth a second look
        this.dead = { kind: 'GOAL KICK', team: defending, x: left ? 5.5 : PITCH_L - 5.5, y: 34, t: 0.8 * paceK().deadT }; this.missedChance(defending.opp);
      }
      return;
    }
    if ((b.y < 0 || b.y > PITCH_W) && paceK().arcade && ARCADE.boards.touch) return this.arcadeOut();   // t-020 ARCADE: no throw-ins either (t-026: off - Luca wants the throw-ins back)
    if (b.y < 0 || b.y > PITCH_W) { const t = b.last === this.home ? this.away : this.home; this.dead = { kind: 'THROW-IN', team: t, x: clamp(b.x, 1, PITCH_L - 1), y: b.y < 0 ? 0.2 : PITCH_W - 0.2, t: 0.6 * paceK().deadT }; }
  },
});
