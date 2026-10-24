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
hc2Mix(Match, {

  // ---------- restarts
  kickoff(team) {
    this.dead = null; this.foulScene = null;
    for (const p of this.all) { if (p.sentOff) continue; p.x = p.home.x; p.y = p.home.y; p.vx = p.vy = 0; p.state = 'idle'; p.hands = false; p.face = p.team.side > 0 ? 0 : 4; }
    const on = [9, 10, 8, 7, 6, 5, 4, 3, 2, 1].map(i => team.players[i]).filter(p => !p.sentOff), k = on[0], k2 = on[1] || on[0];
    k.x = 52.5 - team.side * 0.5; k.y = 34; k2.x = 52.5 - team.side * 1.0; k2.y = 37;
    Object.assign(this.ball, { x: 52.5, y: 34, z: 0, vx: 0, vy: 0, vz: 0, owner: k, last: team, inNet: false, netRight: undefined, target: null, skid: false });
    if (this.ref) { this.ref.x = 52.5 + 3; this.ref.y = 22; this.ref.vx = this.ref.vy = 0; this.ref.act('whistle', 0.9); }   // v0.7.1: the referee starts it
    if (team === this.home) this.human = k;
    this.setPiece = null; this.pending = null;
    applyPace(); this.freeze = paceK().koFreeze; this.say('KICK-OFF', team.name + ' TO START', 1.2); SFX.whistle(1);   // (t-004: ARCADE 0.6 s)
  },
  // dead-ball restarts become SET PIECES: play stops, the taker stands over the ball and aims with a cursor
  restart(kind, team, x, y, note, opts = {}) {
    this.dead = null; if (kind === 'FREE KICK' || kind === 'PENALTY') SFX.whistle(1);
    if (kind === 'GOAL KICK') return this.goalKick(team, y);                     // v0.10.4: a cut to the keeper with it in his hands
    for (const p of this.all) p.spot = null;
    if (kind === 'CORNER') { this.ramiSay('corner', { TEAM: team.name }); this.stat(team).corners++; }
    if (kind === 'PENALTY' && MAN.penalty && !window.HC2_NO_PENCAM && !this.demo) return this.startPenalty(team, note);
    const b = this.ball;
    Object.assign(b, { x, y, z: 0, vx: 0, vy: 0, vz: 0, inNet: false, netRight: undefined, target: null, skid: false, save: null });
    for (const p of this.all) { if (p.sentOff) continue; p.hands = false; if (p.busy() && p.state !== 'getup') p.setState('idle', 0); p.stun = 0; }
    let taker;
    if (kind === 'GOAL KICK') taker = team.players[0];
    else if (kind === 'PENALTY') taker = [9, 10, 8, 7, 6, 5, 4, 3, 2, 1].map(i => team.players[i]).find(p => !p.sentOff) || team.players[0];
    else taker = team.players.filter(p => !p.keeper && !p.sentOff).sort((a, c) => len(a.x - x, a.y - y) - len(c.x - x, c.y - y))[0];
    this.placeSetPiece(kind, team, taker, x, y, opts.cut);
    this.aimPt = this.defaultAim(kind, team, taker, x, y);
    const dx = this.aimPt.x - x, dy = this.aimPt.y - y, dl = len(dx, dy) || 1;
    taker.x = x - dx / dl * 0.6; taker.y = y - dy / dl * 0.6; taker.vx = taker.vy = 0; taker.face = dirIndex(dx, dy);
    if (kind === 'THROW-IN') { taker.x = x; taker.y = y + (y < 34 ? -0.5 : 0.5); }
    b.owner = taker; b.last = team; taker.state = 'idle';
    if (team === this.home) this.human = taker;
    this.setPiece = { kind, team, taker, t: 0, kicked: false };
    this.charge = -1; this.nextHuman = null;
    this.freeze = paceK().spFreeze; this.say(kind, note || (team === this.home ? (k => `${k.move} AIM  ${k.pass} PASS  ${k.lob} CROSS  ${k.shoot} SHOOT (HOLD)`)(keyset()) : team.name), team === this.home ? 2.4 : 1.4);
  },
  // v0.10.4 GOAL KICK (Luca, 24 Oct 06:21, "of immediate importance": "it should have a clean cut away to the goalie with
  // it in his hands and the team laid out how they would in a normal game"). Players used to stay wherever the ball went
  // out and the keeper walked to a ball on the grass. Now a TV wipe covers a cut (match.js starts it 0.24 s before), the
  // keeper stands at the edge of his six-yard box with the ball in his hands and both teams stand in a goal-kick shape:
  // his centre-backs split to the corners of the box, the full-backs high and wide, midfield spread, the strikers near
  // halfway; the other side outside his box, its strikers screening, midfield marking, the back four goal-side of his
  // strikers. Then he plays it out of his hands as after a catch: yours = you throw (PASS) or punt (LOB), the computer's =
  // its outlet throw / punt. GK_SHAPE: [metres out from HIS goal line, y] per slot (1-4 back four, 5-8 midfield, 9-10 up front).
  goalKick(team, y) {
    const gk = team.players[0], s = team.side, gx = team.ownGoalX, opp = team.opp, b = this.ball;
    const X = d => gx + s * d, jit = () => rnd(-0.8, 0.8);
    const OURS = [null, [30, 6], [17, 19], [17, 49], [30, 62], [45, 10], [38, 27], [40, 41], [45, 58], [57, 28], [59, 41]];
    const THEIRS = [null, [60, 10], [61, 25], [61, 43], [60, 58], [41, 12], [39, 28], [40, 40], [41, 56], [23, 26], [24, 43]];
    for (const p of this.all) { if (p.sentOff) continue; p.hands = false; p.spot = null; p.stun = 0; p.cool = 0; p.vx = p.vy = 0; p.claiming = false; if (p.busy()) p.setState('idle', 0); else p.state = 'idle'; }
    const put = (p, sp) => { if (!p || p.sentOff || !sp) return; p.x = clamp(X(sp[0]) + jit(), 0.5, PITCH_L - 0.5); p.y = clamp(sp[1] + jit(), 0.5, PITCH_W - 0.5); };
    team.players.forEach((p, i) => put(p, OURS[i])); opp.players.forEach((p, i) => put(p, THEIRS[i]));
    const og = opp.players[0]; if (!og.sentOff) { og.x = opp.ownGoalX + opp.side * 3; og.y = 34; }   // their keeper: on his line, far end
    gk.x = X(5.5); gk.y = clamp(34 + (y - 34) * 0.3, 31, 37); gk.face = s > 0 ? 0 : 4;
    for (const p of this.all) if (!p.sentOff && p !== gk) p.face = dirIndex(gk.x - p.x, gk.y - p.y);
    Object.assign(b, { owner: gk, last: team, lastP: gk, z: 1.1, vx: 0, vy: 0, vz: 0, inNet: false, netRight: undefined, target: null, skid: false, save: null, lob: false, ring: null, shotBy: null });
    gk.hands = true; gk.hold = -0.4; this.placeAtFeet();                         // (a breath before he plays it)
    if (this.ref) this.ref.place(b);
    this.camX = this.camY = undefined;                                           // a cut, not a pan
    this.setPiece = null; this.pending = null; this.charge = -1; this.nextHuman = null;
    if (team === this.home) this.human = gk;
    this.freeze = Math.max(this.freeze, paceK().spFreeze + 0.2);
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
    return { x: ahead.x, y: ahead.y };
  },
  placeSetPiece(kind, team, taker, x, y, cut) {
    const opp = team.opp, gx = team.goalX, s = team.side;
    const inBox = (p, g) => Math.abs(p.x - g) < 18 && Math.abs(p.y - 34) < 21;
    if (cut && kind === 'FREE KICK') return this.layoutFreeKick(team, taker, x, y);
    if (kind === 'CORNER') {                                                     // bodies in the box
      const att = [9, 10, 7, 6].map(i => team.players[i]).filter(p => p !== taker && !p.sentOff);
      if (att.length) att.forEach((p, k) => { p.x = gx - s * (6 + k * 2.2 + rnd(0, 2)); p.y = 34 + (k - 1.5) * 3.2 + rnd(-1, 1); p.vx = p.vy = 0; });
      if (att.length) [2, 3, 4, 6].map(i => opp.players[i]).filter(p => !p.sentOff).forEach((p, k) => { const a = att[k % att.length]; p.x = a.x + s * 0.9; p.y = a.y + rnd(-0.6, 0.6); p.vx = p.vy = 0; });
    } else if (kind === 'PENALTY') {                                             // everyone out of the box except the keeper
      let k = 0;
      for (const p of this.all) { if (p === taker || (p.keeper && p.team === opp)) continue; if (inBox(p, gx)) { p.x = gx - s * 19.5; p.y = 34 + ((k++ % 9) - 4) * 3; p.vx = p.vy = 0; } }
      const gk = opp.players[0]; gk.x = gx - s * 0.6; gk.y = 34; gk.vx = gk.vy = 0;
    } else {                                                                     // 9.15 m (5 m on throws) - and a wall near goal
      const r = kind === 'FREE KICK' ? 9.15 : 5;
      for (const p of opp.players) { const d = len(p.x - x, p.y - y); if (d < r && !p.keeper) { p.x = x + (p.x - x) / (d || 1) * r; p.y = y + (p.y - y) / (d || 1) * r; } }
      if (kind === 'FREE KICK' && len(gx - x, 34 - y) < 35) {
        const dx = gx - x, dy = 34 - y, dl = len(dx, dy), ux = dx / dl, uy = dy / dl;
        [5, 6, 7].map(i => opp.players[i]).filter(p => !p.sentOff).forEach((p, k) => { p.x = x + ux * 9.15 + (-uy) * (k - 1) * 0.75; p.y = y + uy * 9.15 + ux * (k - 1) * 0.75; p.vx = p.vy = 0; });
      }
    }
  },
  // v0.8 free kick after a foul scene (Luca: "the players lay out properly ... like the other games"): both teams in
  // their shape around the ball; near goal the defence builds a wall on 9.15 m, attackers line up on the edge of the box
  // with a marker goal-side of each. Everyone lands a couple of metres off his spot and jogs the last bit in.
  layoutFreeKick(team, taker, x, y) {
    const opp = team.opp, gx = team.goalX, s = team.side, spots = new Map();
    const shape = (tm, has) => { for (const p of tm.players) { if (p.sentOff || p === taker) continue;
        if (p.keeper) { spots.set(p, { x: tm.ownGoalX + tm.side * 1.5, y: clamp(34 + (y - 34) * 0.08, 32, 36) }); continue; }
        const role = p.i <= 4 ? 0 : p.i <= 8 ? 1 : 2, push = (has ? [4, 10, 18][role] : [-1, 1, 3][role]) * tm.side;
        spots.set(p, { x: clamp(p.home.x + (x - 52.5) * (has ? 0.75 : 0.85) + push, 4, 101), y: clamp(p.home.y + (y - 34) * (has ? 0.32 : 0.45), 3, 65) }); } };
    shape(team, true); shape(opp, false);
    const dGoal = len(gx - x, 34 - y);
    if (dGoal < 35) {
      const ux = (gx - x) / dGoal, uy = (34 - y) / dGoal, n = dGoal < 26 ? 3 : 2;
      const wall = [6, 7, 5, 8].map(i => opp.players[i]).filter(p => !p.sentOff).slice(0, n);
      wall.forEach((p, k) => { const o = (k - (n - 1) / 2) * 0.75; spots.set(p, { x: x + ux * 9.15 - uy * o, y: y + uy * 9.15 + ux * o }); });
      const att = [9, 10, 8, 7].map(i => team.players[i]).filter(p => p !== taker && !p.sentOff).slice(0, 4);
      const lineX = gx - s * clamp(Math.abs(gx - x) - 2, 5, 11);              // on the last defender's line, onside
      att.forEach((p, k) => spots.set(p, { x: lineX - s * (k % 2) * 1.5 + rnd(-0.4, 0.4), y: 34 + (k - (att.length - 1) / 2) * 5.5 + rnd(-0.8, 0.8) }));
      const mk = [2, 3, 4, 1, 8, 5].map(i => opp.players[i]).filter(p => !p.sentOff && !wall.includes(p));
      att.forEach((a, k) => { const p = mk[k]; if (!p) return; const sa = spots.get(a); spots.set(p, { x: sa.x + s * 0.9, y: sa.y + (y > sa.y ? 0.5 : -0.5) }); });
    }
    for (const p of opp.players) { const q = spots.get(p); if (!q || p.keeper) continue; const d = len(q.x - x, q.y - y); if (d < 9.15) { q.x = x + (q.x - x) / (d || 1) * 9.15; q.y = y + (q.y - y) / (d || 1) * 9.15; } }
    for (const p of team.players) { const q = spots.get(p); if (!q || p.keeper) continue; const d = len(q.x - x, q.y - y); if (d < 3) { q.x = x + (q.x - x) / (d || 1) * 3; q.y = y + (q.y - y) / (d || 1) * 3; } }
    for (const [p, q] of spots) {
      q.x = clamp(q.x, 0.5, PITCH_L - 0.5); q.y = clamp(q.y, 0.5, PITCH_W - 0.5);
      let ox = p.x - q.x, oy = p.y - q.y;
      if (len(q.x - x, q.y - y) < 13) { ox = q.x - x; oy = q.y - y; }            // near the ball: come in from further out, never from inside 9.15
      const ol = len(ox, oy) || 1, m = p.keeper ? 0 : Math.min(2.6, len(p.x - q.x, p.y - q.y) + 0.6, 1.2 + Math.random() * 1.4);
      p.x = q.x + ox / ol * m; p.y = q.y + oy / ol * m; p.vx = p.vy = 0; p.spot = q; p.face = dirIndex(x - p.x, y - p.y);
      if (p.busy()) p.setState('idle', 0);
    }
  },
  settle(p, dt) {                                                                // jog the last metres onto a set-piece spot
    const q = p.spot; if (!q || p.busy() || p.sentOff) return false;
    const d = p.moveTo(q.x, q.y, 3.2, dt);
    if (d < 0.3) { p.spot = null; p.face = dirIndex(this.ball.x - p.x, this.ball.y - p.y); }
    return true;
  },
  // aiming at a set piece: the stick moves the cursor; Z = pass along the grass, C = lofted / cross, X (hold) = shot or driven ball
  setPieceTick(dt) {
    const sp = this.setPiece, b = this.ball, p = sp.taker;
    sp.t += dt;
    for (const q of this.all) { if (q !== p) { if (!this.settle(q, dt)) q.steer(0, 0, dt); q.step(dt); } }
    p.steer(0, 0, dt); p.step(dt);
    if (sp.kicked) return false;                                                 // the kick is under way: normal play takes over
    this.placeAtFeet();
    const gx = sp.team.goalX, s = sp.team.side, A = this.aimPt;
    const human = sp.team === this.home && p === this.human;
    if (human && sp.t < 12) {                                                    // (after 12 s idle the AI takes it for you)
      const ax = Input.axis; A.x = clamp(A.x + ax.x * 16 * dt, -2, PITCH_L + 2); A.y = clamp(A.y + ax.y * 16 * dt, -2, PITCH_W + 2);
      if (sp.kind === 'PENALTY') { A.x = gx + s * 0.5; A.y = clamp(A.y, GOAL_Y0 + 0.4, GOAL_Y1 - 0.4); }
      p.face = dirIndex(A.x - p.x, A.y - p.y);
      const atGoal = Math.abs(A.x - gx) < 3 && Math.abs(A.y - 34) < 5;
      if (sp.kind !== 'PENALTY' && Input.pressed('pass')) return this.spKick('ground');
      if (sp.kind !== 'PENALTY' && (Input.pressed('lob') || Input.pressed('through'))) return this.spKick('lob');
      if (sp.kind === 'THROW-IN') { if (Input.pressed('shoot')) return this.spKick('lob'); return true; }
      if (Input.held('shoot')) this.charge = this.charge < 0 ? 0 : Math.min(1, this.charge + dt / paceK().chargeT);
      if (Input.released('shoot') && this.charge >= 0) { const c = this.charge; this.charge = -1; return this.spKick(atGoal || sp.kind === 'PENALTY' ? 'shot' : 'lob', c); }
      return true;
    }
    if (sp.t < paceK().aiTake) return true;                                      // AI takes a breath, then takes it (t-004: ARCADE quickly)
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
    sp.kicked = true; for (const q of this.all) q.spot = null;
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
    this.setPiece = null; this.pending = null; this.dead = null; this.charge = -1;
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
    this.setPiece = null; this.pending = null; this.dead = null; this.charge = -1;
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
    if (this.human === p) this.switchHuman();
    if (this.nextHuman === p) this.nextHuman = null;
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
      this.pending = null; this.charge = -1; this.passAim = null; this.loseTime(-8);
      if (mate) { Object.assign(b, { owner: null, target: null, save: null, z: 0, vz: 0 }); this.gain(mate, 0); this.say('', 'ADVANTAGE!', 0.9); this.ramiSay('foul', { text: 'PLAY ON!\nADVANTAGE!', expr: 'smirk' }, 2); return; }
      SFX.whistle(1); this.restart('FREE KICK', victim.team, clamp(victim.x, 1, PITCH_L - 1), clamp(victim.y, 1, PITCH_W - 1)); return;
    }
    SFX.whistle(1);
    if (!victim.keeper && victim.state !== 'fall' && victim.state !== 'getup') {        // he goes down
      const ux = victim.x - by.x, uy = victim.y - by.y, ul = len(ux, uy) || 1;
      victim.setState('fall', 0.8); victim.vx = victim.vx * 0.4 + ux / ul * 2.2; victim.vy = victim.vy * 0.4 + uy / ul * 2.2;
    }
    Object.assign(b, { owner: null, target: null, save: null }); this.pending = null; this.charge = -1; this.passAim = null;
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
    const t = v.team, human = t === this.home && !this.demo;
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
    if ((b.special || b.saveable) && (b.inNet || b.x < -0.5 || b.x > PITCH_L + 0.5 || b.y < -0.5 || b.y > PITCH_W + 0.5)) { b.special = 0; b.saveable = null; }   // v0.8.7: out / in the net = an ordinary ball again
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
      if (b.last === defending) this.dead = { kind: 'CORNER', team: defending.opp, x: left ? 0.4 : PITCH_L - 0.4, y: b.y < 34 ? 0.4 : PITCH_W - 0.4, t: 0.8 * paceK().deadT };   // (t-004: ARCADE restarts sooner)
      else {
        const close = b.shotBy && b.shotBy.team === defending.opp && Math.min(Math.abs(b.y - GOAL_Y0), Math.abs(b.y - GOAL_Y1)) < 1.3 && b.z < BAR_Z + 0.8;
        if (close) { this.flagReplay('SO CLOSE!'); SFX.ooh(); }                                   // inches wide: worth a second look
        this.dead = { kind: 'GOAL KICK', team: defending, x: left ? 5.5 : PITCH_L - 5.5, y: 34, t: 0.8 * paceK().deadT }; this.missedChance(defending.opp);
      }
      return;
    }
    if (b.y < 0 || b.y > PITCH_W) { const t = b.last === this.home ? this.away : this.home; this.dead = { kind: 'THROW-IN', team: t, x: clamp(b.x, 1, PITCH_L - 1), y: b.y < 0 ? 0.2 : PITCH_W - 0.2, t: 0.6 * paceK().deadT }; }
  },
});
