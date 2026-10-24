'use strict';
// HC2 Football · actions.js: what players do on the ball and off it: human controls, switching, tackles, slides, headers, bicycle kicks
// (split out of game.js in v0.9.5 - load order and lanes: src/README.md)

// ---------------------------------------------------------------- Match methods: actions
hc2Mix(Match, {

  separate() {
    const A = this.all, R = 0.95;
    for (let i = 0; i < A.length; i++) for (let j = i + 1; j < A.length; j++) {
      const p = A[i], q = A[j], dx = q.x - p.x, dy = (q.y - p.y) * 1.3, d = Math.hypot(dx, dy);
      if (d > 0.001 && d < R) {
        const ph = p.keeper && p.hands, qh = q.keeper && q.hands;                 // a keeper holding the ball doesn't get shoved
        const push = (R - d) / 2, ux = dx / d, uy = dy / d, kp = ph ? 0 : qh ? 2 : 1, kq = qh ? 0 : ph ? 2 : 1;
        p.x -= ux * push * kp; p.y -= uy * push / 1.3 * kp; q.x += ux * push * kq; q.y += uy * push / 1.3 * kq;
      }
    }
    for (const k of [this.home.players[0], this.away.players[0]]) {              // ...and never carries it over his own line
      if (k.hands && this.ball.owner !== k) k.hands = false;
      if (k.hands) { const gl = k.team.ownGoalX, inX = gl + k.team.side * 0.6; if ((k.x - inX) * k.team.side < 0) k.x = inX;
        for (const o of k.team.opp.players) { const d = len(o.x - k.x, o.y - k.y); if (d > 0.01 && d < 3.5) { o.x += (o.x - k.x) / d * 0.04; o.y += (o.y - k.y) / d * 0.04; } }   // give him room
      }
    }
  },
  controlHuman(dt) {
    const b = this.ball, me = this.human, team = this.home;
    const prevAir = this.airSp; this.airSp = null;                               // v0.8.6 (set again below while the moment lasts)
    if (b.owner && b.owner.team === team && b.owner !== me) this.human = b.owner;
    if (!b.owner && this.nextHuman && b.last === team) { /* ball travelling to a team-mate: switch once it is closer to him */
      const q = this.nextHuman; if (len(q.x - b.x, q.y - b.y) < len(this.human.x - b.x, this.human.y - b.y)) { this.human = q; this.nextHuman = null; }
    }
    if (!(b.owner && b.owner.team === team) && (Input.pressed('lob') || (b.owner && b.owner.team !== team && this.human.keeper))) this.switchHuman();
    const p = this.human;
    if (p.state === 'kick' || p.state === 'slide' || p.state === 'dheader' || p.stun > 0) return;
    const ax = Input.axis, moving = len(ax.x, ax.y) > 0.1, owns = b.owner === p;
    const sprint = Input.held('sprint') && moving;
    if (sprint && !p.sprinting && p.stamina > 0.3 && (p.burstCd || 0) <= this.time.now) { p.burst = 0.55; p.burstCd = this.time.now + 1500; }   // v0.8 burst (not spammable)
    p.sprinting = sprint;
    let spd = p.top(sprint, owns);
    if (owns && this.charge >= 0) spd *= 0.75;                                   // winding up a shot slows you down
    // pass coming to me: he runs onto it by himself while the stick is idle OR still held the way you passed it
    // (v0.6 sent him off in the pass direction - away from the ball). Point somewhere new and you take over.
    const ps = this.passStick, sameStick = ps && len(ps.x, ps.y) > 0.1 && moving && (ax.x * ps.x + ax.y * ps.y) / (len(ax.x, ax.y) * len(ps.x, ps.y)) > 0.7;
    if (moving && !sameStick) this.passStick = null;
    if (!b.owner && b.target === p && b.last === team && (!moving || sameStick)) {
      const v = p.top(sprint, false), pt = this.intercept(p, v, 0.12, b.lob ? 1.9 : 1.0); p.moveTo(pt.x, pt.y, v, dt);   // lob-mechanics: meet it in the air
    } else if (owns && moving) this.carrySteer(p, ax.x, ax.y, spd, dt, sprint ? (p.burst > 0 ? ACC * 1.35 : ACC * 0.85) : ACC);
    else p.steer(ax.x * spd, ax.y * spd, dt, sprint ? (p.burst > 0 ? ACC * 1.35 : ACC * 0.85) : ACC);
    const dir = moving ? ax : dirVec(p.face);
    if (owns && moving) { const l = len(ax.x, ax.y); p.wantDir = { x: ax.x / l, y: ax.y / l }; }
    if (owns && p.keeper && p.hands) {                                           // you hold it: after 5 s he lets it go himself
      p.hold = (p.hold || 0) + dt;
      // v0.8.3: in his hands he stays inside his box (he walked 70 m upfield and off the pitch, untouchable) and 6 s is the
      // limit even if you keep walking (it only counted while the stick was idle)
      const bx = team.ownGoalX + team.side * 16.2;
      if ((p.x - bx) * team.side > 0) { p.x = bx; if (p.vx * team.side > 0) p.vx = 0; }
      if (Math.abs(p.y - 34) > 19.8) { p.y = 34 + Math.sign(p.y - 34) * 19.8; if (p.vy * (p.y - 34) > 0) p.vy = 0; }
      if ((p.hold > 5 && !moving) || p.hold > 6) { p.hold = 0; const o = this.keeperOutlet(p); this.doPass(p, o.dir, o.mode); return; }
    }
    this.passAim = owns && !(p.keeper && p.hands) ? this.passTarget(p, dir, 'ground', this.passAim) : null;   // v0.7.4: who a pass would go to right now (shown on the grass)
    if (owns && Input.pressed('special') && !p.keeper) { if (this.special(p)) return; this.say('', 'SP METER EMPTY', 0.6); }
    if (owns) {
      if (Input.pressed('pass')) this.doPass(p, dir, 'ground');
      else if (Input.pressed('through')) this.doPass(p, dir, 'through');
      else if (Input.pressed('lob')) this.lobCharge = 0;                          // v0.8.5: a tap = the lob to a team-mate, hold = power
      if (this.lobCharge >= 0) {
        if (Input.held('lob')) this.lobCharge = Math.min(1, this.lobCharge + dt / 0.9);
        else { const c = this.lobCharge; this.lobCharge = -1; if (this.chipCan(p, dir)) this.chipShot(p, c, ax.y); else if (c < 0.2) this.doPass(p, dir, 'lob'); else this.powerLob(p, dir, c); }   // v0.9.2: in their box facing goal = CHIP
      }
      if (Input.held('shoot')) { this.charge = this.charge < 0 ? 0 : Math.min(1, this.charge + dt / 0.8); this.aimY = ax.y; }
      if (Input.released('shoot') && this.charge >= 0) { this.doShot(p, this.charge, this.aimY); this.charge = -1; }
    } else {
      this.charge = -1; this.lobCharge = -1;
      // v0.8.6 AERIAL SPECIAL: a ball dropping to you at volley / head height in their half, near enough to goal, SP in the bank
      const mtA = this.meterOf(team), dA = len(b.x - p.x, b.y - p.y), toG = len(team.goalX - p.x, 34 - p.y);
      const coming = (b.x - p.x) * b.vx + (b.y - p.y) * b.vy < 0 || dA < 1.2;     // dropping towards him
      this.airSp = !b.owner && !b.inNet && b.last === team && b.z > 0.55 && b.z < 2.6 && b.vz < 2 && dA < 3.6 && coming && toG < 30 && !p.busy() && mtA.level() >= 1 ? (prevAir || { t: 0 }) : null;
      if (this.airSp) { this.airSp.t += dt; if (Input.pressed('special')) { this.airSpecial(p); return; } }
      // v0.8.1 defending: CHALLENGE = pass button, SLIDE = shoot button (in the direction you push)
      if (Input.pressed('pass') && b.owner && b.owner.team !== team) this.challenge(p, b.owner);
      else if (Input.pressed('shoot') && b.owner && b.owner.team !== team) this.slideTackle(p, moving ? ax : null);
      else if (Input.pressed('shoot') && !b.owner && b.z < 0.3 && len(b.x - p.x, b.y - p.y) >= 2.0 && len(b.x - p.x, b.y - p.y) < 4.5 &&
        b.last !== team && !p.busy()) this.slideTackle(p, null);                 // a loose ball just out of reach: slide in for it
      else if (Input.pressed('shoot') && !b.owner && len(b.x - p.x, b.y - p.y) < 2.0 && b.z < 1) {   // first-time shot / volley
        const volley = b.z > 0.35; b.owner = p; this.doShot(p, 0.6, ax.y); if (volley) p.kickAnim = 'volley';
      }
      else if (Input.pressed('shoot') && this.canBicycle(p, true)) this.bicycle(p);   // ball over head height in front of goal: overhead kick
      else if (Input.pressed('shoot') && !b.owner && b.z >= 0.4 && b.z < 1.3 && len(b.x - p.x, b.y - p.y) < 3.4 && !p.busy()) {
        this.divingHeader(p);                                                  // too far to volley, too low to head: throw yourself at it
      }
      else if ((Input.pressed('shoot') || Input.pressed('pass')) && !b.owner) {  // ball in the air: get ready to head it
        this.headBuf = 0.7; this.headKind = Input.pressed('shoot') ? 'shoot' : 'pass';   // lob-mechanics: 0.7 s (was 0.35 s, near impossible to time)
      }
    }
  },
  // HEADERS: a ball at head height next to a player. You head it if you pressed X (at goal) or Z (to a team-mate)
  // BICYCLE KICK (batch 10): a high ball (head height or above) close to him near their goal -> over the head at goal
  canBicycle(p, human) {                                                          // back to goal (or SHIFT held): over the head instead of a header
    const b = this.ball; if (!MAN.kits[p.kit].anims['bicycle-E'] || p.keeper || p.busy() || b.owner || b.inNet) return false;
    const d = len(p.x - b.x, p.y - b.y), gx = p.team.goalX - p.x, gy = 34 - p.y, toGoal = len(gx, gy), f = dirVec(p.face);
    const backToGoal = (f.x * gx + f.y * gy) / (toGoal || 1) < -0.2;
    return b.z > 1.35 && b.z < 2.4 && d < 1.5 && toGoal < 19 && (backToGoal || (human && Input.held('sprint')));
  },
  bicycle(p) {
    const b = this.ball; b.owner = p; this.doShot(p, rnd(0.6, 0.85), rnd(-0.8, 0.8));
    if (this.pending && this.pending.p === p) this.pending.vz = rnd(-1.4, 0.4);   // struck from head height: it dips, not balloons
    p.kickAnim = 'bicycle'; p.stateT = 0.7; p.bike = true; this.lastBike = { p, n: this.recN || 0, t: this.time.now };                      // he lies there after (get-up follows)
    this.ramiSay('skill', { text: 'AN OVERHEAD KICK!!\nOH THAT IS FILTHY!', expr: 'laugh' }, 2);
    this.flagReplay('OVERHEAD KICK!');                                           // worth another look at the next stoppage
  },
  // just before; the AI heads at goal near the box, clears near its own goal, otherwise nods it on.
  headers() {
    const b = this.ball, bsp = len(b.vx, b.vy);
    if (b.special && b.pierce > 0) return;                                      // v0.8.6: nobody heads / volleys a special that still blows through people
    if (this.lobDuel()) return;                                                  // lob-mechanics: a lob's drop is a duel first
    // AI: a fast ball across the box at his feet / knees -> hit it first time (a volley if it's off the ground)
    if (!b.owner && !b.inNet && b.z > 1.35 && b.z < 2.4 && !this.diving) {         // AI: the odd bicycle kick
      for (const p of this.all) {
        if (p === this.human || (b.tried && b.tried.has('b' + p.team.name + p.i)) || !this.canBicycle(p)) continue;
        (b.tried = b.tried || new Set()).add('b' + p.team.name + p.i);
        if (Math.random() < 0.3) { this.bicycle(p); return; }
      }
    }
    if (!b.owner && !b.inNet && b.z < 1.0 && bsp > 8 && !this.diving) {
      for (const p of this.all) {
        if (p === this.human || p.keeper || p.busy() || p.stun > 0 || p.cool > 0 || (b.tried && b.tried.has('v' + p.team.name + p.i))) continue;
        const d = len(p.x - b.x, p.y - b.y), toGoal = len(p.team.goalX - p.x, 34 - p.y);
        if (d < 1.0 && toGoal < 20 && (p.team.goalX - p.x) * p.team.side > 2) {
          (b.tried = b.tried || new Set()).add('v' + p.team.name + p.i);
          if (Math.random() < 0.8) { const volley = b.z > 0.35; b.owner = p; this.doShot(p, rnd(0.45, 0.75), rnd(-1, 1)); if (volley) p.kickAnim = 'volley'; return; }
        }
      }
    }
    if (!b.owner && !b.inNet && b.z > 0.5 && b.z < 1.3 && !this.diving && b.vz < 0) {           // AI: dive at a low cross near goal
      for (const p of this.all) {
        if (p === this.human || p.keeper || p.busy() || p.stun > 0 || p.cool > 0 || (b.tried && b.tried.has('d' + p.team.name + p.i))) continue;
        const d = len(p.x - b.x, p.y - b.y), toGoal = len(p.team.goalX - p.x, 34 - p.y);
        if (d > 1.3 && d < 3.0 && toGoal < 16) { (b.tried = b.tried || new Set()).add('d' + p.team.name + p.i); if (Math.random() < 0.45) { this.divingHeader(p); break; } }
      }
    }
    if (b.owner || b.inNet || b.z < 1.1 || b.z > 2.7) return;
    for (const p of [...this.all].sort((u, v) => len(u.x - b.x, u.y - b.y) - len(v.x - b.x, v.y - b.y))) {   // lob-mechanics: nearest first (was: home side always first)
      if (p.busy() || p.stun > 0 || p.cool > 0) continue;
      if (p.keeper && Math.abs(p.x - p.team.ownGoalX) < 16.5 && Math.abs(p.y - 34) < 20.2) continue;   // keepers catch it
      if (len(p.x - b.x, p.y - b.y) > 1.2) continue;
      let kind;
      if (p === this.human) { if (!(this.headBuf > 0)) continue; kind = this.headKind === 'shoot' ? 'goal' : 'pass'; }
      else {
        const toGoal = len(p.team.goalX - p.x, 34 - p.y);
        const chestable = b.z < 1.7 && len(b.vx, b.vy) < (b.target === p ? 16 : 9);                 // away from goal he'd rather chest it down
        if ((chestable && toGoal > 20) || (b.tried && b.tried.has('h' + p.team.name + p.i))) continue;
        (b.tried = b.tried || new Set()).add('h' + p.team.name + p.i); if (Math.random() > (toGoal < 20 ? 0.9 : 0.75)) continue;
        kind = toGoal < 18 ? 'goal' : (Math.abs(p.x - p.team.ownGoalX) < 25 ? 'clear' : 'pass');
      }
      this.header(p, kind); return;
    }
  },
  // lob-mechanics: THE DROP OF A LOB IS A DUEL. Before, the nearest defender ran to the landing spot and headed it
  // away while our man waited to take it at his feet (28 of 60 of your lobs lost that way), and the header check went
  // down the player list in order, so the home side won every tie. Now, when the ball comes down to head height
  // (0.6-2.6 m) with the intended man within reach, everyone within reach contests it once: closer to the ball is
  // better, the intended man has the run on it (+0.35), arriving flat out costs a little, plus luck. Our winner
  // heads it at goal near the box, chests it down when it's low enough or he has room, else nods it on first time;
  // their winner heads it clear. You decide it yourself if you pressed PASS / SHOOT in time.
  lobDuel() {
    const b = this.ball, q = b.target;
    if (!b.lob || b.owner || b.inNet || this.diving || b.vz >= 0 || b.z < 0.6 || b.z > 2.6 || !q || q.sentOff || b.last !== q.team) return false;
    const R = 1.35, inBox = p => p.keeper && Math.abs(p.x - p.team.ownGoalX) < 16.5 && Math.abs(p.y - 34) < 20.2;
    const ok = p => !p.sentOff && !p.busy() && p.stun <= 0 && p.cool <= 0 && !inBox(p) && len(p.x - b.x, p.y - b.y) < R;
    const us = q.team.players.filter(ok); if (!us.length) return false;          // our man isn't there yet: no duel (a defender alone heads it as before)
    const them = q.team.opp.players.filter(ok);
    const sc = p => (R - len(p.x - b.x, p.y - b.y)) + (p === q ? 0.35 : 0) - ((p.speed || 0) > 5.5 ? 0.15 : 0) + Math.random() * 0.5;
    let win = null, ws = -1e9; for (const p of [...us, ...them]) { const s = sc(p); if (s > ws) { ws = s; win = p; } }
    b.lob = false; b.tried = null;
    if (them.length) this.say('', win.team === q.team ? 'WON IT IN THE AIR!' : 'HEADED AWAY!', 0.7);
    if (win.team !== q.team) { this.header(win, win === this.human && this.headBuf > 0 && this.headKind === 'shoot' ? 'goal' : 'clear'); return true; }
    const toGoal = len(win.team.goalX - win.x, 34 - win.y);
    if (win === this.human && this.headBuf > 0) { this.header(win, this.headKind === 'shoot' ? 'goal' : 'pass'); return true; }
    if (win !== this.human && toGoal < 18 && b.z > 1.1) { this.header(win, 'goal'); return true; }
    if (b.z < 1.75) {                                                             // chest / thigh it down: his ball
      const ivx = b.vx, ivy = b.vy, sp = len(b.vx, b.vy); this.gain(win, sp);
      if (!win.hands) { win.setState('trap', 0.32); win.face = dirIndex(-ivx || win.team.side, -ivy); }
      return true;
    }
    for (const o of them) o.cool = Math.max(o.cool, 0.45);                       // too high to chest: beaten men are out of it for a moment, and he
    const free = !win.team.opp.players.some(o => !o.sentOff && len(o.x - win.x, o.y - win.y) < 2.0);   // with room: he lets it drop onto his chest (you:
    if (free && (win === this.human || Math.random() < 0.6)) { b.target = win; (b.tried = new Set()).add('h' + win.team.name + win.i); return true; }   // or volley it)
    this.header(win, free ? 'down' : 'pass'); return true;                       // or cushions it to his feet; marked tight: nods it on first time
  },
  header(p, kind) {
    const b = this.ball, s = p.team.side; let tx, ty, spd, vz, best = null;
    if (kind === 'goal') { tx = p.team.goalX + s * 2; ty = 34 + (p === this.human ? Input.axis.y * 2.6 : rnd(-2.6, 2.6)); spd = rnd(12, 15); vz = rnd(-1.5, 0.8); }
    else if (kind === 'clear') { tx = p.x + s * 25; ty = clamp(p.y + rnd(-12, 12), 4, 64); spd = 15; vz = 4.5; }
    else if (kind === 'down') {                                                  // lob-mechanics: cushioned down to his feet, on the side away from his marker
      const o = p.team.opp.players.filter(e => !e.sentOff && !e.keeper).sort((u, v) => len(u.x - p.x, u.y - p.y) - len(v.x - p.x, v.y - p.y))[0];
      let ux = o ? p.x - o.x : -b.vx, uy = o ? p.y - o.y : -b.vy; const ul = len(ux, uy) || 1; ux /= ul; uy /= ul;
      tx = p.x + ux * 0.5; ty = p.y + uy * 0.5; spd = 0.8; vz = -0.6; best = { q: p };
    }
    else { best = this.bestOption(p); tx = best ? best.q.x : p.x + s * 12; ty = best ? best.q.y : p.y; spd = clamp(len(tx - p.x, ty - p.y) * 0.9, 7, 14); vz = 2.5; }
    const dx = tx - b.x, dy = ty - b.y, l = len(dx, dy) || 1;
    Object.assign(b, { vx: dx / l * spd, vy: dy / l * spd, vz, skid: true, rollV: 0.72 * spd, last: p.team, lastP: p, save: null, target: best ? best.q : null, special: 0, power: 0, saveable: null });   // v0.8.8: a headed ball is an ordinary ball (a spent special kept its special flight)
    p.face = dirIndex(dx, dy); p.setState('header', 0.5); p.cool = kind === 'down' ? 0 : 0.4; this.headBuf = 0;   // (a cushion: he takes it straight away)
    b.tried = null; b.lob = false; SFX.head(); b.how = { kind: 'header', x: b.x, y: b.y };
    if (kind === 'goal') { this.planSave(p.team.opp.players[0]); this.shotSaveCall(p.team.opp, p.team); }
    if (best && p.team === this.home) { this.nextHuman = best.q; this.passRing = { p: best.q, t: 1.0 }; }
  },
  divingHeader(p) {
    const b = this.ball, dx = b.x + b.vx * 0.15 - p.x, dy = b.y + b.vy * 0.15 - p.y, d = len(dx, dy) || 1;
    p.face = dirIndex(dx, dy); p.setState('dheader', 0.75); p.cool = 0; p.vx = dx / d * 8; p.vy = dy / d * 8;
    this.diving = { p, t: 0.35 };
  },
  diveTick(dt) {
    const D = this.diving; if (!D) return; D.t -= dt; const b = this.ball, p = D.p;
    if (p.state !== 'dheader' || b.owner || D.t <= 0) { this.diving = null; return; }
    if (len(b.x - p.x, b.y - p.y) < 1.2 && b.z > 0.2 && b.z < 1.6) {
      this.diving = null; p.cool = p.stateT + 0.45; const s = p.team.side, toGoal = len(p.team.goalX - p.x, 34 - p.y);
      const tx = toGoal < 25 ? p.team.goalX + s * 2 : p.x + s * 18, ty = toGoal < 25 ? 34 + (p === this.human ? Input.axis.y * 2.6 : rnd(-2.6, 2.6)) : p.y + rnd(-8, 8);
      const ddx = tx - b.x, ddy = ty - b.y, l = len(ddx, ddy) || 1, spd = rnd(15, 18);
      Object.assign(b, { vx: ddx / l * spd, vy: ddy / l * spd, vz: rnd(0.5, 2), skid: true, rollV: 0.72 * spd, last: p.team, lastP: p, save: null, target: null, special: 0, power: 0, saveable: null });
      if (toGoal < 25) { this.planSave(p.team.opp.players[0]); this.shotSaveCall(p.team.opp, p.team); }
      this.say('', 'DIVING HEADER!', 0.9); SFX.head(); b.how = { kind: 'dheader', x: b.x, y: b.y };
    }
  },
  switchHuman() {
    const b = this.ball;
    const c = this.home.players.filter(p => !p.keeper && !p.sentOff).sort((a, q) => len(a.x - b.x, a.y - b.y) - len(q.x - b.x, q.y - b.y));
    if (c[0] === this.human && c[1]) this.human = c[1]; else this.human = c[0];
  },
  // v0.8.1 two different tackles (Luca): CHALLENGE (pass button) and SLIDE (shoot button), like FIFA / PES.
  tackle(p, carrier, slide, dir) { return slide ? this.slideTackle(p, dir) : this.challenge(p, carrier); },
  // CHALLENGE: a standing tackle for when you're close, in front of him or just to the side. Win it and the ball is
  // AT YOUR FEET straight away. From behind it rarely works and can be a foul. Miss and you're off balance a moment.
  challenge(p, carrier) {
    const b = this.ball;
    if (!carrier || (carrier.keeper && carrier.hands) || p.cool > 0) return;
    p.cool = 0.6; p.face = dirIndex(b.x - p.x, b.y - p.y);
    if (MAN.kits[p.kit].anims[`tackle-${DIRS[p.face]}`]) p.setState('tackle', 0.3);      // the lunge (PixelLab batch 5)
    const db = len(b.x - p.x, b.y - p.y);
    if (db > 1.6) { p.stun = 0.35; return; }                                     // lunged at nothing: too far
    const cv = carrier.speed > 0.6 ? { x: carrier.vx / carrier.speed, y: carrier.vy / carrier.speed } : dirVec(carrier.face);
    const rx = p.x - carrier.x, ry = p.y - carrier.y, rl = len(rx, ry) || 1, front = (cv.x * rx + cv.y * ry) / rl;
    const human = p === this.human && !this.demo, vsHuman = carrier === this.human && !this.demo;
    let pWin = front > 0.3 ? 0.8 : front > -0.3 ? 0.55 : 0.2;                   // in his path / beside him / behind him
    if (len(b.x - carrier.x, b.y - carrier.y) < 0.7) pWin -= 0.1;               // tight control is harder to win
    if (db < 0.9) pWin += 0.08;                                                  // right on the ball
    if (human) { const Y = this.dkY(carrier.team); pWin += Y.yb - Y.sh; }         // (v0.9.3: by level, was always +0.08; the top levels shield it)
    if (vsHuman) { const Y = this.dkY(p.team); pWin -= carrier.burst > 0 ? Math.max(0.2, 0.3 * Y.tk) : (carrier.sprinting ? 0.2 : 0.12) * Y.tk; }   // you can beat the computer with a burst (v0.9.3: by how much, by level)
    else if (carrier.burst > 0) pWin -= 0.25;                                     // v0.8.2: the computer's take-on burst too
    if (Math.random() < pWin) { this.steal(p, carrier); return; }               // won: it's yours, at your feet
    if (front < -0.3 && rl < 1.2 && Math.random() < 0.4) { this.foul(p, carrier, true); return; }   // through the back of him
    if (rl < 1.0 && Math.random() < 0.06) { this.foul(p, carrier, false); return; }                // clipped his ankle
    p.stun = 0.4;                                                                // missed: off balance
  },
  // SLIDE: you go to ground in the direction you're pushing (or at the ball). It reaches further than a challenge.
  // A perfect slide from straight in front can stop the ball dead for you; otherwise the ball rolls on the way the
  // tackle sends it (your slide + his run). Hitting the man before the ball is a foul. Resolved on contact in slides().
  slideTackle(p, dir) {
    const b = this.ball; if (p.cool > 0) return;
    // v0.8.2: aim where the ball WILL be (it was aimed at where it was, so a slide at a runner hit the man: 22 fouls in 60);
    // a push within ~35 degrees of that line is helped onto it
    // (a slide covers (9.5 / 3.2) * (1 - e^(-3.2 t)) metres: it slows fast, so the lead is solved on that, not on 9.5 m/s)
    // the earliest moment the slide can reach where the ball will be (foot 0.7 m out, ~1 m of leg reach)
    let tr = 0, gap = 1e9;
    for (let t = 0; t <= 0.6; t += 0.025) { const D = len(b.x + b.vx * t - p.x, b.y + b.vy * t - p.y) - 0.7 - 2.97 * (1 - Math.exp(-3.2 * t));
      if (D < 0.6) { tr = t; break; } if (D < gap) { gap = D; tr = t; } }
    const lx = b.x + b.vx * tr - p.x, ly = b.y + b.vy * tr - p.y, ll = len(lx, ly) || 1, lead = { x: lx / ll, y: ly / ll };
    let d = dir && len(dir.x, dir.y) > 0.2 ? { x: dir.x / len(dir.x, dir.y), y: dir.y / len(dir.x, dir.y) } : lead;
    if (d !== lead && d.x * lead.x + d.y * lead.y > 0.82 && ll < 5) d = lead;
    p.face = dirIndex(d.x, d.y); p.slideDir = d;
    p.vx = d.x * 9.5; p.vy = d.y * 9.5; p.setState('slide', 0.6); p.cool = 0.7; p.slideWon = false; p.slideHit = new Set();
  },
  // v0.8 a clean win: the ball is yours, he stumbles
  steal(p, carrier, block) {
    // v0.8.2: the man who lost it is off balance a moment longer and can't nick it straight back (he took it back 1 in 2)
    this.gain(p, 0); if (carrier) { carrier.stun = block ? 0.35 : 0.6; carrier.cool = 1.0; if (!block && carrier.state !== 'kick') carrier.setState('hit', 0.43); }
    this.stats && this.stats.steals++;
  },
  // v0.8 BLOCK: stand in the dribbler's path (jockey him) and he runs the ball into you - no button needed.
  // You (human) win it quickly; the computer needs a bit longer against you, more if you're bursting past on a sprint.
  blockSteals(dt) {
    const b = this.ball, c = b.owner; if (!c || c.hands || c.state === 'kick' || this.setPiece || this.pending || b.z > 0.5) return;
    const dir = c.speed > 0.8 ? { x: c.vx / c.speed, y: c.vy / c.speed } : dirVec(c.face);
    for (const p of c.team.opp.players) {
      if (p.keeper || p.sentOff || p.stun > 0 || p.cool > 0 || p.busy()) continue;
      const still = c.speed < 0.8;                                               // v0.8.2: standing still he isn't running it into you -
      if (len(b.x - p.x, b.y - p.y) > (still ? 0.55 : 0.85)) continue;          // you have to be right on the ball
      const rx = p.x - c.x, ry = p.y - c.y, rl = len(rx, ry); if (rl > 1.8) continue;
      if ((dir.x * rx + dir.y * ry) / (rl || 1) < 0.35) continue;               // not in his way
      const human = p === this.human && !this.demo, vsHuman = c === this.human && !this.demo;
      const rate = human ? (c.burst > 0 ? 1.6 : 3.2) * this.dkY(c.team).mine : vsHuman ? (c.burst > 0 ? 0.3 : c.sprinting ? 0.7 : 1.3) * this.dkY(p.team).blk : (c.burst > 0 ? 0.5 : 1.6);   // per second in his path (v0.9.3: v you, by level)
      if (Math.random() < rate * (still ? 0.5 : 1) * dt) { this.steal(p, c, true); return; }
    }
  },
  knock(p, carrier, power) {
    const b = this.ball; b.owner = null; b.target = null;
    const ux = (b.x - p.x) || 0.01, uy = b.y - p.y, l = len(ux, uy);
    b.vx = ux / l * power + rnd(-1, 1); b.vy = uy / l * power + rnd(-1, 1); b.vz = 0.6; b.z = 0.05; b.skid = true; b.rollV = 0;
    b.last = p.team; if (carrier) { carrier.stun = 0.55; carrier.cool = 0.5; carrier.hands = false; }
  },
  slides() {
    const b = this.ball;
    for (const p of this.all) {
      if (p.state !== 'slide') continue;
      const dv = p.slideDir || dirVec(p.face), fx = p.x + dv.x * 0.7, fy = p.y + dv.y * 0.7;   // v0.8.2: the real slide line (was the 8-way facing: up to 0.3 m off)
      if (b.z < 0.6 && !p.slideWon && !(b.owner && b.owner.team === p.team) && len(b.x - fx, b.y - fy) < 1.05) {   // (an outstretched leg's reach)
        const carrier = b.owner, sd = p.slideDir || dv;
        const cv = carrier && carrier.speed > 0.6 ? { x: carrier.vx / carrier.speed, y: carrier.vy / carrier.speed } : carrier ? dirVec(carrier.face) : null;
        const head = cv ? (sd.x * cv.x + sd.y * cv.y) : 0;                       // -1 = straight into him, head on
        const front = carrier ? ((p.x - carrier.x) * (cv ? cv.x : 0) + (p.y - carrier.y) * (cv ? cv.y : 0)) / (len(p.x - carrier.x, p.y - carrier.y) || 1) : 0;
        this.knock(p, carrier, 0); p.slideWon = true;
        if (carrier) { carrier.stun = 0.85; carrier.cool = 1.0; }                // v0.8.2: he hurdles your leg and loses his stride
        if (carrier && head < -0.6 && front > 0.5 && Math.random() < 0.55) {   // perfect, head on: a block - you both stop dead and
          p.vx *= 0.2; p.vy *= 0.2; p.stateT = Math.min(p.stateT, 0.3);           // the ball's yours as you get up (no teleport: it
          b.vx = sd.x * 0.5; b.vy = sd.y * 0.5; b.vz = 0; p.slideKeep = true;      // stays where you met it)
        } else {                                                                // it rolls on, the way the tackle sends it
          const cvx = carrier ? carrier.vx * 0.15 : 0, cvy = carrier ? carrier.vy * 0.15 : 0;   // (was * 0.5: it ran on with him and he just collected it)
          b.vx = sd.x * 6.5 + cvx; b.vy = sd.y * 6.5 + cvy; b.vz = 0.3;
        }
      }
      for (const o of p.team.opp.players) {
        if (o.sentOff || p.slideHit.has(o) || len(o.x - fx, o.y - fy) > 0.8 || o.keeper && o.hands) continue;
        p.slideHit.add(o);
        const nearBall = len(o.x - b.x, o.y - b.y) < 2.2;
        const od = dirVec(o.face), fromBehind = (od.x * dv.x + od.y * dv.y) > 0.6;   // he was running away from you
        o.setState('fall', 0.55); o.cool = 0.6; o.vx = dv.x * 3; o.vy = dv.y * 3;
        const fromRight = (od.x * dv.x + od.y * dv.y) > 0.8;                     // v0.8.2: ball first and not straight through his back = fair
        if (nearBall && (p.slideWon ? (fromRight && Math.random() < 0.3) : (fromBehind || Math.random() < 0.55))) { this.foul(p, o, fromBehind); return; }   // v0.8: ball first = fair
      }
    }
  },
});
