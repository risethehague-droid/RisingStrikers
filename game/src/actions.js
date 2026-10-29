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
  // t-011 (Luca: "add a special lvl 1 pass that curves [...] only test lab"): with CURVE_PASS on, hold SPECIAL and press
  // PASS / THROUGH / LOB = the curving special pass (specials.js curvePass); no bar in the bank = that button's normal pass
  // (the press falls through). So the chord can be made, SPECIAL on its own then fires the special shot when you LET GO
  // (not on the press), and only if no pass was made while it was held. Returns true when it took the frame.
  curveInput(p, owns, dir) {
    if (!owns || p.keeper) { this.spHeld = 0; return false; }
    if (Input.pressed('special')) this.spHeld = 1;
    if (this.spHeld && Input.held('special')) {
      const md = Input.pressed('pass') ? 'ground' : Input.pressed('through') ? 'through' : Input.pressed('lob') ? 'lob' : null;
      if (md) { this.spHeld = 2; if (this.curvePass(p, md, dir)) return true; }
    } else if (this.spHeld && Input.released('special')) {
      const solo = this.spHeld === 1; this.spHeld = 0;
      if (solo) { if (this.special(p)) return true; this.say('', 'SP METER EMPTY', 0.6); }
    } else this.spHeld = 0;
    return false;
  },
  controlHuman(dt) {
    const b = this.ball, me = this.human, team = this.home;
    const prevAir = this.airSp; this.airSp = null;                               // v0.8.6 (set again below while the moment lasts)
    if (this.aerial) { this.lobAim = null; this.aerialInput(); return; }         // t-008: an AERIAL BATTLE is on - your SHOOT presses are the mash
    if (this.camTarget && this.camTarget === this.lobAimCam && !this.lobAim) this.camTarget = null;   // (t-008: the aim's framing ends with the aim)
    if (b.owner && b.owner.team === team && b.owner !== me) this.human = b.owner;
    if (!b.owner && this.nextHuman && b.last === team) { /* ball travelling to a team-mate: switch once it is closer to him */
      const q = this.nextHuman; if (len(q.x - b.x, q.y - b.y) < len(this.human.x - b.x, this.human.y - b.y)) { this.human = q; this.nextHuman = null; }
    }
    if (!(b.owner && b.owner.team === team) && (Input.pressed('lob') || (b.owner && b.owner.team !== team && this.human.keeper))) this.switchHuman();
    const p = this.human;
    // t-018 (Luca: "you can spam it too easy"): getting up off the grass he does nothing either - a SHOOT pressed there
    // slid again, shot first time or was kept for a header (no queued presses)
    this.airChargeTick(p, dt);                                                   // t-022: SHOOT held for a header / volley
    if (p.state === 'kick' || p.state === 'slide' || p.state === 'getup' || p.state === 'dheader' || p.stun > 0) return;
    const ax = Input.axis, moving = len(ax.x, ax.y) > 0.1, owns = b.owner === p;
    if (owns && this.trapRunStep(p, dt)) return;                                 // lob receives: the chest / thigh trap carries him on into the run
    const sprint = Input.held('sprint') && moving;
    if (sprint && !p.sprinting && p.stamina > 0.3 && (p.burstCd || 0) <= this.time.now) { p.burst = paceK().burstT; p.burstCd = this.time.now + 1500; }   // v0.8 burst (not spammable; arcade-2: ARCADE a longer dash, 0.8 s)
    p.sprinting = sprint;
    let spd = p.top(sprint, owns);
    if (owns && this.charge >= 0) spd *= 0.75;                                   // winding up a shot slows you down
    if (owns && this.lobAim && !this.lobAim.auto) spd *= LOB2.aimSlow;          // t-008: aiming a lob he shields it (the stick walks the ring; t-019: RING only - in AUTO the stick is your arrow)
    // pass coming to me: he runs onto it by himself while the stick is idle OR still held the way you passed it
    // (v0.6 sent him off in the pass direction - away from the ball). Point somewhere new and you take over.
    const ps = this.passStick, sameStick = ps && len(ps.x, ps.y) > 0.1 && moving && (ax.x * ps.x + ax.y * ps.y) / (len(ax.x, ax.y) * len(ps.x, ps.y)) > 0.7;
    if (moving && !sameStick) this.passStick = null;
    if (!b.owner && b.target === p && b.last === team && (!moving || sameStick)) {
      if (!this.lobRun(p, dt)) { const v = p.top(sprint, false), pt = this.intercept(p, v, 0.12, b.lob ? 1.9 : 1.0); p.moveTo(pt.x, pt.y, v, dt); }   // lob-mechanics: meet it in the air (t-008: a lob - timed to arrive under the drop)
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
    if (CURVE_PASS) { if (this.curveInput(p, owns, dir)) return; }              // t-011 (Test Lab only): SPECIAL held + a pass = the curving pass
    else if (owns && Input.pressed('special') && !p.keeper) { if (this.special(p)) return; this.say('', 'SP METER EMPTY', 0.6); }
    if (owns) {
      if (Input.pressed('pass')) this.doPass(p, dir, 'ground');
      else if (Input.pressed('through')) this.doPass(p, dir, 'through');
      else if (Input.pressed('lob')) this.lobPress(p, dir);                       // v0.8.5: a tap = the lob to a team-mate (t-008: hold = aim the landing ring)
      if (this.lobAim) { if (this.lobAimTick(p, ax, dir, dt)) return; }
      else if (this.lobCharge >= 0) {                                             // (the chip in their box and the keeper's throw: the old hold)
        if (Input.held('lob')) this.lobCharge = Math.min(1, this.lobCharge + dt / 0.9);
        else { const c = this.lobCharge; this.lobCharge = -1; if (this.chipCan(p, dir)) this.chipShot(p, c, ax.y); else if (c < 0.2) this.doPass(p, dir, 'lob'); else this.powerLob(p, dir, c); }   // v0.9.2: in their box facing goal = CHIP
      }
      if (Input.held('shoot')) { this.charge = this.charge < 0 ? 0 : Math.min(1, this.charge + dt / paceK().chargeT); this.aimY = ax.y; }   // (arcade-2: ARCADE charges 25% quicker)
      if (Input.released('shoot') && this.charge >= 0) { if (!this.tapKickTry(p, ax, this.charge)) this.doShot(p, this.charge, this.aimY); this.charge = -1; }   // (t-010: a quick tap = the tap kick)
    } else {
      this.charge = -1; this.lobCharge = -1; this.lobAim = null;
      // v0.8.6 AERIAL SPECIAL: a ball dropping to you at volley / head height in their half, near enough to goal, SP in the bank
      // (t-014: or a low driven ball with one bar: TIDE CUTTER's window, specials.js tideWin)
      const mtA = this.meterOf(team), dA = len(b.x - p.x, b.y - p.y), toG = len(team.goalX - p.x, 34 - p.y);
      const coming = (b.x - p.x) * b.vx + (b.y - p.y) * b.vy < 0 || dA < 1.2;     // dropping towards him
      this.airSp = !b.owner && !b.inNet && b.last === team && (b.z > 0.55 || this.tideWin(p)) && b.z < 2.6 && b.vz < 2 && dA < 3.6 && coming && toG < 30 && !p.busy() && mtA.level() >= 1 ? (prevAir || { t: 0 }) : null;
      if (this.airSp) { this.airSp.t += dt; if (Input.pressed('special')) { this.airSpecial(p); return; } }
      // v0.8.1 defending: CHALLENGE = pass button, SLIDE = shoot button (in the direction you push)
      if (Input.pressed('pass') && b.owner && b.owner.team !== team) this.challenge(p, b.owner);
      else if (Input.pressed('shoot') && b.owner && b.owner.team !== team) this.slideTackle(p, moving ? ax : null);
      else if (Input.pressed('shoot') && !b.owner && b.z < 0.3 && len(b.x - p.x, b.y - p.y) >= 2.0 && len(b.x - p.x, b.y - p.y) < 4.5 &&
        b.last !== team && !p.busy()) this.slideTackle(p, null);                 // a loose ball just out of reach: slide in for it
      else if (Input.pressed('shoot') && !b.owner && len(b.x - p.x, b.y - p.y) < 2.0 && b.z < 1) {   // first-time shot / volley
        const volley = b.z > 0.35; b.owner = p; this.doShot(p, 0.6, ax.y); if (volley) { this.airHitNote(p, p.team.goalX - p.x, 34 - p.y); this.volleyLook(p); }   // (batch 20: picked + timed like airVolley's)
      }
      else if (Input.pressed('shoot') && this.canBicycle(p, true)) this.bicycle(p);   // ball over head height in front of goal: overhead kick
      else if (Input.pressed('shoot') && !b.owner && b.z >= 0.4 && b.z < 1.3 && len(b.x - p.x, b.y - p.y) < 3.4 && !p.busy()) {
        this.divingHeader(p);                                                  // too far to volley, too low to head: throw yourself at it
      }
      else if ((Input.pressed('shoot') || Input.pressed('pass')) && !b.owner) {  // ball in the air: get ready to head it
        this.headBuf = Math.max(0.7, this.lobDropIn(p)); this.headKind = Input.pressed('shoot') ? 'shoot' : 'pass';   // lob-mechanics: 0.7 s (was 0.35 s, near impossible to time)
        if (this.headKind === 'shoot') this.airChargeStart(p);                   // t-022: keep holding it = the charged header / volley
      }                                                                          // (t-008: a lob dropping to you - kept until it gets there)
      // t-008 (Luca: "so aerial shots are easier to do and become more common"): SHOOT pressed as a lob drops to you and it
      // came down past head height without a header: you volley it at goal as it reaches you (it took a second press)
      else if (this.headBuf > 0 && this.headKind === 'shoot' && !b.owner && b.last === team && b.z > 0.25 && b.z < 1.0 && len(b.x - p.x, b.y - p.y) < 1.6 && !p.busy()) {
        b.owner = p; this.airVolley(p, 0.6, ax.y); this.headBuf = 0;            // (t-022: charged if you held SHOOT)
      }
    }
  },
  // t-010 TAP KICK: SHOOT let go within TAP.tapT of pressing it (charge counts 0 -> 1 over 0.8 s, from the first held
  // frame) is the tap kick, along the stick - or the way he faces with the stick idle (Luca: "it just faces the direction
  // of the arrow you point with"). Held longer: false, and the power shot goes as before. Set pieces keep their own
  // rules (a free kick is still struck), and with TAP_KICK off (matches, until Luca's OK) it never happens.
  tapKickTry(p, ax, charge) {
    if (!TAP_KICK || charge * 0.8 >= TAP.tapT || this.setPiece || p.keeper) return false;
    const moving = len(ax.x, ax.y) > 0.1, dir = moving ? ax : dirVec(p.face);
    this.tapKick(p, dir); return true;
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
    if (this.aerial || this.aerialCheck() || this.looseDuelCheck()) return;                               // t-008: a clear contest at the drop = the AERIAL BATTLE
    if (this.lobDuel()) return;                                                  // lob-mechanics: a lob's drop is a duel first
    // AI: a fast ball across the box at his feet / knees -> hit it first time (a volley if it's off the ground)
    if (!b.owner && !b.inNet && b.z > 1.35 && b.z < 2.4 && !this.diving) {         // AI: the odd bicycle kick
      for (const p of this.all) {
        if (p === this.human || (b.tried && b.tried.has('b' + p.team.name + p.i)) || !this.canBicycle(p)) continue;
        (b.tried = b.tried || new Set()).add('b' + p.team.name + p.i);
        if (Math.random() < 0.3) { if (!this.aiAirSpecial(p)) this.bicycle(p); return; }   // (t-012: or the aerial special, SP in the bank)
      }
    }
    if (!b.owner && !b.inNet && b.z < 1.0 && bsp > 8 && !this.diving) {
      for (const p of this.all) {
        if (p === this.human || p.keeper || p.busy() || p.stun > 0 || p.cool > 0 || this.recvShield(p) || (b.tried && b.tried.has('v' + p.team.name + p.i))) continue;
        const d = len(p.x - b.x, p.y - b.y), toGoal = len(p.team.goalX - p.x, 34 - p.y);
        if (d < 1.0 && toGoal < 20 && (p.team.goalX - p.x) * p.team.side > 2) {
          (b.tried = b.tried || new Set()).add('v' + p.team.name + p.i);
          if (Math.random() < 0.8) { if (b.z > 0.55 && this.aiAirSpecial(p)) return; const volley = b.z > 0.35; b.owner = p; if (volley) this.airVolley(p, rnd(0.45, 0.75), rnd(-1, 1)); else this.doShot(p, rnd(0.45, 0.75), rnd(-1, 1)); return; }   // (t-022: a volley may be charged)
        }
      }
    }
    if (!b.owner && !b.inNet && b.z > 0.5 && b.z < 1.3 && !this.diving && b.vz < 0) {           // AI: dive at a low cross near goal
      for (const p of this.all) {
        if (p === this.human || p.keeper || p.busy() || p.stun > 0 || p.cool > 0 || this.recvShield(p) || (b.tried && b.tried.has('d' + p.team.name + p.i))) continue;
        const d = len(p.x - b.x, p.y - b.y), toGoal = len(p.team.goalX - p.x, 34 - p.y);
        if (d > 1.3 && d < 3.0 && toGoal < 16) { (b.tried = b.tried || new Set()).add('d' + p.team.name + p.i); if (Math.random() < 0.45) { this.divingHeader(p); break; } }
      }
    }
    if (b.owner || b.inNet || b.z < 1.1 || b.z > paceK().headZ) return;         // (arcade-2: ARCADE they leap higher: 3.1 m)
    for (const p of [...this.all].sort((u, v) => len(u.x - b.x, u.y - b.y) - len(v.x - b.x, v.y - b.y))) {   // lob-mechanics: nearest first (was: home side always first)
      if (p.busy() || p.stun > 0 || p.cool > 0 || this.recvShield(p)) continue;   // (lob receives: clearly his - their men stay out of it)
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
        if (kind === 'goal' && this.aiAirSpecial(p)) return;                     // t-012: SP banked - the aerial special instead of the header
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
    const V = this.recvVerdict(); if (V && V.kind === 'lost') return false;      // lob receives: clearly theirs - their man wins it as before (headers)
    const R = 1.35, inBox = p => p.keeper && Math.abs(p.x - p.team.ownGoalX) < 16.5 && Math.abs(p.y - 34) < 20.2;
    const ok = p => !p.sentOff && !p.busy() && p.stun <= 0 && p.cool <= 0 && !inBox(p) && len(p.x - b.x, p.y - b.y) < R;
    const us = q.team.players.filter(ok); if (!us.length) return false;          // our man isn't there yet: no duel (a defender alone heads it as before)
    const them = V && V.kind === 'clean' ? [] : q.team.opp.players.filter(ok);   // lob receives: clearly his - nobody contests it
    if (them.length) this.recvCount('duel');
    const sc = p => (R - len(p.x - b.x, p.y - b.y)) + (p === q ? 0.35 : 0) - ((p.speed || 0) > 5.5 ? 0.15 : 0) + Math.random() * 0.5;
    let win = null, ws = -1e9; for (const p of [...us, ...them]) { const s = sc(p); if (s > ws) { ws = s; win = p; } }
    b.lob = false; b.tried = null;
    if (them.length) this.say('', win.team === q.team ? 'WON IT IN THE AIR!' : 'HEADED AWAY!', 0.7);
    if (win.team !== q.team) { this.header(win, win === this.human && this.headBuf > 0 && this.headKind === 'shoot' ? 'goal' : 'clear'); return true; }
    const toGoal = len(win.team.goalX - win.x, 34 - win.y);
    if (win === this.human && this.headBuf > 0 && this.headKind === 'shoot' && b.z < 1.1) { b.owner = win; this.airVolley(win, 0.6, Input.axis.y); this.headBuf = 0; return true; }   // (t-008: too low to head: volleyed at goal)
    if (win === this.human && this.headBuf > 0) { this.header(win, this.headKind === 'shoot' ? 'goal' : 'pass'); return true; }
    if (win !== this.human && toGoal < (b.aimLob ? 22 : 18) && b.z > 1.1) { if (!this.aiAirSpecial(win)) this.header(win, 'goal'); return true; }   // (t-012: or the aerial special; t-008: your aimed lob - he goes for goal from a little further)
    if (b.z < 1.75) { this.chestTrap(win, len(b.vx, b.vy)); return true; }    // chest / thigh it down into his stride: his ball
    for (const o of them) o.cool = Math.max(o.cool, 0.45);                       // too high to chest: beaten men are out of it for a moment, and he
    const free = !win.team.opp.players.some(o => !o.sentOff && len(o.x - win.x, o.y - win.y) < 2.0);   // with room: he lets it drop onto his chest (you:
    if ((free || !them.length) && len(b.vx, b.vy) < (them.length ? 9 : 14) && (win === this.human || !them.length || Math.random() < 0.6)) {   // (lob receives: uncontested - he chests it)   // (t-008: only a ball dropping steeply - a flatter one came on at his head and bounced off him)
      b.target = win; (b.tried = new Set()).add('h' + win.team.name + win.i); return true; }   // or volley it)
    this.header(win, free ? 'down' : 'pass'); return true;                       // or cushions it to his feet; marked tight: nods it on first time
  },
  // ======================================================================= LOB RECEIVES (co-designer 28 Oct: "In lob receives it's not a
  // button mash every time. Only in very contested receives should there be a button mash. When it is clearly going to a
  // certain receiver, it should be uncontested." + "chest traps / lob receives are now too clunky and slow. It should be
  // so you can chest trap and animate into running"). Real football: a good lob to a free man is simply received, his
  // first touch takes him into space; a real aerial contest is two men arriving together. PES: the contested header only
  // with a defender goal-side and close. So as a high ball (a lob, a cross) comes down to the man it's meant for, ONE race
  // decides it, once per ball: when can he play it (the first point of its drop in the head-to-thigh band he gets to in
  // time) v when can their quickest man (keepers keep their own claim). First by RECV.margin s or more - or none of
  // theirs can get within RECV.room m of it by then - CLEAN: no battle, no duel, their men stay out of it (recvShield)
  // while he's on it. Their man first by the margin - LOST: theirs, as before. Only a near tie is CONTEST: lobDuel, or in
  // their box t-034's battle with the mash. The same for the computer's balls and yours.
  recvVerdict() {
    const b = this.ball, q = b.target, P = this.path, C = RECV;
    if (!C.on || b.owner || b.inNet || !q || q.sentOff || q.keeper || b.last !== q.team || !P || this.setPiece || this.dead || !(b.lob || b.crossBy)) return null;
    const R = b.recv; if (R && R.k === b.spT && R.q === q) return R;
    const band = []; let pz = b.z;                                               // the points it can be played at (a lob: on its way down)
    for (const pt of P) { const down = pt.z <= pz; pz = pt.z; if (pt.z <= C.zHi && pt.z >= C.zLo && (down || !b.lob)) band.push(pt); }
    if (!band.length) return null;
    // where he meets it: the first point he gets to in time (else the one he gets to soonest, late)
    const arr = (p, pt) => C.react + Math.max(0, len(pt.x - p.x, pt.y - p.y) - C.reachR) / p.top(p.stamina > 0.2, false);
    let M = null, late = null; for (const pt of band) { const t = arr(q, pt); if (t <= pt.t) { M = pt; break; } if (!late || t - pt.t < late.t - late.pt.t) late = { t, pt }; }
    const Mt = M ? M.t : late.t, aq = M ? arr(q, M) : late.t, Mp = M || late.pt;
    if (Math.min(Mt, band[0].t) > C.look) return null;                           // (not yet: the runs aren't made)
    // their man: plays it first if he can meet it in time at an earlier point of the drop; else whoever is on the spot
    // first (two men both waiting under it: the one settled there first has it - a real contest is arriving together)
    let gap = Infinity, room = true;
    for (const o of q.team.opp.players) { if (o.sentOff || o.keeper || o.stun > 0) continue;
      let g = arr(o, Mp) - aq;
      const ox = Mp.x - o.x, oy = Mp.y - o.y, ol = len(ox, oy) || 1, qa = ((q.x - o.x) * ox + (q.y - o.y) * oy) / ol;   // boxed out: the receiver stands in his
      if (qa > 0.3 && qa < ol + 1.2 && Math.abs(((q.x - o.x) * oy - (q.y - o.y) * ox) / ol) < C.boxOut) g += C.boxT;   // way to it (PES: only a man goal-side and close contests it) for (const pt of band) { if (pt.t >= Mt - 0.05) break; if (arr(o, pt) <= pt.t) { g = Math.min(g, pt.t - Mt); break; } }
      if (g < gap) gap = g;
      if (len(o.x - Mp.x, o.y - Mp.y) - o.top(true, false) * Math.max(0, Mt - C.react) < C.room) room = false; }
    const kind = room || gap >= C.margin ? 'clean' : gap <= -C.margin ? 'lost' : 'contest';
    this.recvCount(kind);
    return (b.recv = { k: b.spT, q, kind, gap, at: { x: Mp.x, y: Mp.y, z: Mp.z }, t: Mt });
  },
  recvCount(k) { const N = this.recvN = this.recvN || { clean: 0, contest: 0, lost: 0, duel: 0, battle: 0, chest: 0, thigh: 0 }; N[k]++; },
  // clearly his: their men leave it to him (no header, volley, block or pickup) while he's right there for it
  recvShield(p) {
    const b = this.ball, R = b.recv;
    if (!R || R.kind !== 'clean' || b.owner || R.k !== b.spT || b.target !== R.q || p.team === R.q.team) return false;
    return R.q.stun <= 0 && !R.q.sentOff && len(R.q.x - b.x, R.q.y - b.y) < RECV.shieldR;
  },
  // which way the first touch takes him: the arrow you hold; else the way he was already going; else away from the
  // nearest of theirs (a little towards their goal); nobody near: towards their goal
  recvDir(p) {
    const ax = Input.axis, al = len(ax.x, ax.y);
    if (p === this.human && !this.demo && al > 0.2) return { x: ax.x / al, y: ax.y / al };
    if (p.speed > 1.5) return { x: p.vx / p.speed, y: p.vy / p.speed };
    const gx = p.team.goalX - p.x, gy = 34 - p.y, gl = len(gx, gy) || 1;
    const o = p.team.opp.players.filter(e => !e.sentOff && !e.keeper && len(e.x - p.x, e.y - p.y) < 8).sort((u, v) => len(u.x - p.x, u.y - p.y) - len(v.x - p.x, v.y - p.y))[0];
    let ux = gx / gl, uy = gy / gl;
    if (o) { const ol = len(p.x - o.x, p.y - o.y) || 1; ux = (p.x - o.x) / ol + ux * 0.35; uy = (p.y - o.y) / ol + uy * 0.35; }
    const l = len(ux, uy) || 1; return { x: ux / l, y: uy / l };
  },
  // THE CHEST / THIGH TRAP INTO THE RUN (FIFA / EA FC's directional first touch; real football's "chest it into his
  // stride"). It used to stop him: the ball dead at his feet, him stood facing where it came from (0.32 s of 'trap', then
  // a standing start). Now he takes it on the move, turned the way he'll go: on the chest (RECV.chestZ and up: the trap
  // move's frames, RECV.trapT) it's cushioned down in front of him; on the thigh (lower) it pops up a touch and drops.
  // He keeps running the whole time (trapRunStep) and it lands in his stride: running with it ~RECV.runT s after the
  // contact. Until then the touch can't be played on (no pass or shot off a ball still dropping).
  chestTrap(p, sp) {
    const b = this.ball, C = RECV, z = b.z, thigh = z < C.chestZ, u = this.recvDir(p);
    this.gain(p, sp); if (p.hands) return;                                       // (a keeper in his box: his hands, as before)
    const v = Math.min(Math.max(p.speed, RUN * 0.75), p.top(true, true));
    p.trapRun = { u, v, t: C.runT, kind: thigh ? 'thigh' : 'chest' }; p.face = dirIndex(u.x, u.y);
    Object.assign(b, { x: p.x + u.x * 0.3, y: p.y + u.y * 0.25, z: Math.max(0.3, z - 0.1), vx: u.x * v, vy: u.y * v, vz: thigh ? C.thighVz : C.dropVz });
    p.touchT = C.runT; b.trapDrop = true;                                        // (his next stride's touch once it's down; ball.js dribble settles it there)
    if (thigh) p.touchAnimT = 0.28; else p.setState('trap', C.trapT);
    this.recvCount(thigh ? 'thigh' : 'chest');
  },
  trapRunStep(p, dt) {                                                           // (the trap's run: your arrow can still bend it)
    const T = p.trapRun; if (!T) return false;
    if (p === this.human && !this.demo) { const ax = Input.axis, al = len(ax.x, ax.y); if (al > 0.2) { T.u = { x: ax.x / al, y: ax.y / al }; if (Input.held('sprint')) T.v = Math.max(T.v, p.top(true, true)); } }
    p.wantDir = T.u; p.steer(T.u.x * T.v, T.u.y * T.v, dt, ACC * 1.2); return true;
  },
  header(p, kind, dir, chIn) {                                                   // (t-008: dir - the AERIAL BATTLE's clearance; t-022: chIn - its charge)
    const b = this.ball, s = p.team.side; let tx, ty, spd, vz, best = null, ch = null;
    if (kind === 'goal') { const gk = p.team.opp.players[0], away = gk && !gk.sentOff ? (gk.y > 34 ? -2.4 : 2.4) : 0;   // (t-008: yours with the stick idle - away from the keeper, it was straight at him)
      ch = chIn !== undefined ? chIn : this.airChargeFor(p);                     // t-022: held SHOOT (or the computer's dice): a charged header
      tx = p.team.goalX + s * 2; ty = 34 + (p === this.human ? (Math.abs(Input.axis.y) > 0.2 ? Input.axis.y * 2.6 : away) : rnd(-2.6, 2.6));
      if (!ch) { spd = rnd(12, 15); vz = rnd(-1.5, 0.8); }                        // a tap: today's header
      else { const C = AIR_CHARGE, w = 1 - ch.q;                                  // charged: pace from the hold, lost and sprayed by the timing
        spd = C.hdrLo + (C.hdrHi - C.hdrLo) * ch.pw; ty += rnd(-1, 1) * (C.err0 + w * C.err);
        vz = rnd(-0.9, 0.3) + w * rnd(0, C.wild) + (ch.pw > C.overP ? (ch.pw - C.overP) * C.overK : 0); }   // (too much: over the bar, like a ground shot)
      if (p !== this.human) { const toG = len(p.team.goalX - p.x, 34 - p.y), e = (0.9 + toG * 0.13) * this.dk(p.team).shotErr;   // t-012: the computer's headers
        ty += rnd(-1, 1) * e; vz += rnd(0, 1) * e * 0.5; } }                     // miss too (the soak: a headed cross went in 1 in 2 - the posts were never missed)
    else if (kind === 'clear' && dir) { tx = p.x + dir.x * 25; ty = clamp(p.y + dir.y * 25, 2, 66); spd = 15; vz = 4.5; }
    else if (kind === 'clear') { tx = p.x + s * 25; ty = clamp(p.y + rnd(-12, 12), 4, 64); spd = 15; vz = 4.5; }
    else if (kind === 'down') {                                                  // lob-mechanics: cushioned down to his feet, on the side away from his marker
      const o = p.team.opp.players.filter(e => !e.sentOff && !e.keeper).sort((u, v) => len(u.x - p.x, u.y - p.y) - len(v.x - p.x, v.y - p.y))[0];
      let ux = o ? p.x - o.x : -b.vx, uy = o ? p.y - o.y : -b.vy; const ul = len(ux, uy) || 1; ux /= ul; uy /= ul;
      tx = p.x + ux * 0.5; ty = p.y + uy * 0.5; spd = 0.8; vz = -0.6; best = { q: p };
    }
    else { best = this.bestOption(p); tx = best ? best.q.x : p.x + s * 12; ty = best ? best.q.y : p.y; spd = clamp(len(tx - p.x, ty - p.y) * 0.9, 7, 14); vz = 2.5; }
    const dx = tx - b.x, dy = ty - b.y, l = len(dx, dy) || 1;
    this.airHitNote(p, dx, dy, ch);                                              // (t-022: for the animation pick - before the ball turns)
    Object.assign(b, { vx: dx / l * spd, vy: dy / l * spd, vz, skid: true, rollV: 0.72 * spd, last: p.team, lastP: p, save: null, target: best ? best.q : null, special: 0, power: ch ? ch.pw : 0, saveable: null });   // v0.8.8: a headed ball is an ordinary ball (a spent special kept its special flight)   // (t-022: a charged one is a shot by its pace for the keeper's guard, as a ground shot)
    p.face = dirIndex(dx, dy); p.setState('header', 0.5); p.cool = kind === 'down' ? 0 : 0.4; this.headBuf = 0;   // (a cushion: he takes it straight away)
    b.tried = null; b.lob = false; SFX.head(); b.how = { kind: 'header', x: b.x, y: b.y };
    if (b.spin || b.curl || b.aft) { b.spin = 0; b.curl = 0; b.aft = null; }     // (t-002 prototype: a header kills the lob's spin)
    if (kind === 'goal') { this.shotCount(p.team); this.planSave(p.team.opp.players[0]); this.shotSaveCall(p.team.opp, p.team); }   // (t-035: a header at goal is a shot)
    if (kind === 'goal') this.airChargeDone(p, 'header', ch, spd);
    if (best && p.team === this.home) { this.nextHuman = best.q; this.passRing = { p: best.q, t: 1.0 }; }
  },
  divingHeader(p) {
    this.airHitNote(p, this.ball.x - p.x, this.ball.y - p.y);                    // (t-022: the dive's pick)
    const b = this.ball, dx = b.x + b.vx * 0.15 - p.x, dy = b.y + b.vy * 0.15 - p.y, d = len(dx, dy) || 1;
    p.face = dirIndex(dx, dy); p.setState('dheader', 0.75); p.cool = 0; p.vx = dx / d * 8; p.vy = dy / d * 8;
    this.diving = { p, t: 0.35 };
  },
  diveTick(dt) {
    this.aerialTick(dt);                                                         // t-008: the AERIAL BATTLE runs here (after the headers, before the ball moves)
    const D = this.diving; if (!D) return; D.t -= dt; const b = this.ball, p = D.p;
    if (p.state !== 'dheader' || b.owner || D.t <= 0) { this.diving = null; return; }
    if (len(b.x - p.x, b.y - p.y) < 1.2 && b.z > 0.2 && b.z < 1.6) {
      this.diving = null; p.cool = p.stateT + 0.45; const s = p.team.side, toGoal = len(p.team.goalX - p.x, 34 - p.y);
      const tx = toGoal < 25 ? p.team.goalX + s * 2 : p.x + s * 18, ty = toGoal < 25 ? 34 + (p === this.human ? Input.axis.y * 2.6 : rnd(-2.6, 2.6)) : p.y + rnd(-8, 8);
      const ddx = tx - b.x, ddy = ty - b.y, l = len(ddx, ddy) || 1, spd = rnd(15, 18);
      Object.assign(b, { vx: ddx / l * spd, vy: ddy / l * spd, vz: rnd(0.5, 2), skid: true, rollV: 0.72 * spd, last: p.team, lastP: p, save: null, target: null, special: 0, power: 0, saveable: null });
      if (toGoal < 25) { this.shotCount(p.team); this.planSave(p.team.opp.players[0]); this.shotSaveCall(p.team.opp, p.team); }   // (t-035: a shot)
      this.say('', 'DIVING HEADER!', 0.9); SFX.head(); b.how = { kind: 'dheader', x: b.x, y: b.y };
    }
  },
  // ======================================================================= t-022 CHARGED HEADERS AND VOLLEYS (Luca 25 Oct 07:04: "headers
  // and volleys can also be charged up and hit like a power shot (from kicks) if timed properly"). SHOOT pressed off the
  // ball as it comes through the air starts the charge (airChargeStart); held, it counts up like the ground shot's;
  // the header / volley still happens where it always did (headers, lobDuel, the late volley) and asks airChargeAt
  // what it's worth: under AIR_CHARGE.tapT held = a tap (null: today's strike), else the power from the hold, graded by
  // when you let go - within AIR_CHARGE.sweet before the contact keeps it all and goes where you aimed, earlier fades
  // it, still holding as it reaches you is late. The computer rolls its timing by level (aiAirCharge). (t-034: the aerial
  // battle's winner no longer charges by his hold - SPACE / SHOOT is the mash; his strike's pace is the bar's margin.)
  airChargeStart(p) { this.airCh = AIR_CHARGE.on ? { p, held: 0, rel: null } : null; },
  airChargeTick(p, dt) {
    const C = this.airCh; if (!C) return; const b = this.ball;
    if (C.p !== p || b.owner || b.inNet || this.setPiece || (C.rel ?? 0) > 1.0 || C.held > 3) { this.airCh = null; return; }   // (it never came: forgotten)
    if (C.rel != null) { C.rel += dt; return; }
    if (Input.held('shoot')) { C.held += dt; this.headBuf = Math.max(this.headBuf || 0, 0.25); }   // (the press's 0.7 s would run out under a long hold)
    else { C.rel = 0; this.headBuf = Math.max(this.headBuf || 0, 0.7); }        // let go: it still meets the ball as a press did
  },
  airChargeFor(p) { return p === this.human && !this.demo ? this.airChargeAt(p) : this.aiAirCharge(p); },
  airChargeAt(p) {
    const C = this.airCh, A = AIR_CHARGE; this.airCh = null;
    if (!A.on || !C || C.p !== p || C.held < A.tapT) return null;                // a tap (or no hold): today's header / volley
    const late = C.rel == null; return this.airGrade(Math.min(1, C.held / A.fullT), late ? A.lateOff : C.rel, late);
  },
  aiAirCharge(p) {
    const A = AIR_CHARGE; if (!A.on || Math.random() >= A.cpuP) return null;
    return this.airGrade(rnd(A.cpuLo, A.cpuHi), Math.random() * A.cpuJit * Math.max(this.dk(p.team).shotErr, A.cpuFloor), false);
  },
  // q: 1 = timed right, falling to 0 at AIR_CHARGE.slop past the sweet window; the power kept = minQ..1 of the hold's
  airGrade(raw, off, late) {
    const A = AIR_CHARGE, q = off <= A.sweet ? 1 : clamp(1 - (off - A.sweet) / A.slop, 0, 1);
    return { raw, pw: raw * (A.minQ + (1 - A.minQ) * q), q, off, late, sweet: q >= 1 };
  },
  // a volley at goal: doShot as before (a tap: the same call), charged = its power, the timing's spray on the kick waiting
  airVolley(p, power, aimY) {
    const ch = this.airChargeFor(p);
    this.airHitNote(p, p.team.goalX - p.x, 34 - p.y, ch);
    this.doShot(p, ch ? ch.pw : power, aimY); this.volleyLook(p);
    const k = this.pending; if (!ch || !k || k.p !== p) { this.airChargeDone(p, 'volley', null, k && k.p === p ? k.speed : 0); return; }
    const A = AIR_CHARGE, w = 1 - ch.q;
    k.ty = clamp(k.ty + rnd(-1, 1) * w * A.err, 24, 44); k.vz += w * rnd(0, A.wild); k.info.airCh = ch;   // (ball.js impact: the sparks when it leaves the boot; not info.air - that is the aerial special's hang point)
    this.airChargeDone(p, 'volley', ch, k.speed);
  },
  // where the ball came from and how high, for the header / volley pick (player.js AIR_PICKS)
  airHitNote(p, ox, oy, ch) {
    const b = this.ball, ix = -b.vx, iy = -b.vy, il = len(ix, iy), ol = len(ox, oy);
    p.airHit = { z: b.z, side: il > 0.5 && ol > 0.1 ? Math.acos(clamp((ix * ox + iy * oy) / (il * ol), -1, 1)) * 180 / Math.PI : 0, pw: ch ? ch.pw : 0 };
  },
  // batch 20: a volley's move is picked here (the same pick player.js makes from p.airHit and his facing), so the kick
  // waiting in this.pending lets the ball go on that move's contact frame (manifest 'contact'), as KICK_HIT does for
  // the ground kicks. Moves without a contact frame keep the wind-up doShot gave them.
  volleyLook(p) {
    p.kickAnim = 'volley'; const k = this.pending, K = MAN.kits[p.kit], d = DIRS[p.face], r = airPick(K, 'volley', d, p.airHit);
    const c = r && airContact(K, r.a, d); if (k && k.p === p && c != null) k.t = (c + 0.6) / kickRate(r.a);
  },
  airChargeDone(p, kind, ch, spd) {
    this.acLast = ch ? { by: p, kind, ...ch, spd, t: this.time.now } : { by: p, kind, tap: true, spd, t: this.time.now };   // (the Lab's HV lines)
    if (!ch) return;
    if (kind === 'header') SFX.kick(0.3 + ch.pw * 0.5);                          // a charged header thumps (the ground shot's voice, softer)
    if (kind === 'header' && ch.sweet && ch.raw >= AIR_CHARGE.impP) this.airImpact(true);   // (a volley's comes with its kick: ball.js impact)
  },
  // the impact of a well-timed one, subtle: the ball white for ~3 frames, a small spark burst from the fx atlas, a
  // tiny hit-stop and a light camera nudge (a volley already has the kick's own hit-stop and shake: only flash + sparks)
  airImpact(all) {
    const A = AIR_CHARGE, b = this.ball;
    this.flashT = Math.max(this.flashT || 0, A.flashT + (all ? A.stop : 0));
    if (all) { this.hitStop = Math.max(this.hitStop || 0, A.stop); this.cameras.main.shake(A.shakeMs, A.shakeK); }
    if (!this.textures.exists('fx') || !this.cameras.main.visible) return;
    const X = wx(b.x, b.y), Y = wy(b.y) - 12 - b.z * PX_H;
    const pop = (name, s0, s1, ms, a) => { const im = this.add.image(X, Y, 'fx', name).setScale(s0).setAlpha(a).setDepth(wy(b.y) + 2);
      this.tweens.add({ targets: im, scale: s1, alpha: 0, duration: ms, delay: (this.hitStop || 0) * 600, ease: 'Cubic.easeOut', onComplete: () => im.destroy() }); };
    pop('sparks', 0.45, 1.15, 220, 0.9); pop('impact', 0.3, 0.7, 140, 0.7);      // (a special: impactBig, a fire ring, sparks at 0.8-2.2, a flash in its colour)
  },

  // ======================================================================= t-008 HOLD LOB TO AIM (Luca 24 Oct 05:57: "make the lob a hold
  // until its the right spot then release is the actual lob kick to pass it"). Press: the landing ring appears where a
  // lob would go (ball.js lobAimStart). Held: the stick walks it at LOB2.ringV, easing in so a tap of a key nudges it,
  // 8-45 m out; near a team-mate it settles on the spot he'll reach and he walks there (teamai.js lobAimMate).
  // Release: the kick, solved to land on the ring (ball.js aimLob). Let go within LOB2.tapT = the instant lob, as before.
  // My call on "hold longer for a higher ball": no - the hold is for aiming now, so its length must not change the kick;
  // the height comes from the distance and who's in the way (lobAimApex), the same every time.
  lobPress(p, dir) {
    this.lobCharge = -1; this.lobAim = null;
    if (p.keeper || this.chipCan(p, dir)) { this.lobCharge = 0; return; }       // the chip in their box, the keeper's throw / punt: as they were
    if (LOB_AIM_MODE === 'auto') { this.lobAim = { auto: true, t: 0, mate: null }; this.lobAutoPick(p, dir); this.passAim = this.lobAim.mate; return; }   // t-019 AUTO: no ring
    const s = this.lobAimStart(p, dir);
    this.lobAim = { t: 0, rx: s.x, ry: s.y, x: s.x, y: s.y, q: null, k: 0, vx: 0, vy: 0 };
    this.lobAimMagnet(p);
  },
  lobAimTick(p, ax, dir, dt) {
    const A = this.lobAim; A.t += dt;
    if (this.pending && this.pending.p === p) { this.lobAim = null; return false; }   // (another kick went first - a pass or a shot pressed while aiming)
    if (A.auto) return this.lobAutoTick(p, dir);
    if (!Input.held('lob')) {                                                    // let go: the kick
      this.lobAim = null;
      // t-019: the aim's framing hands over to the normal follow over LOB_AIM.camBlend (it snapped back to the ball)
      if (this.camTarget === this.lobAimCam && !LOB_AIM.camOld) this.lobCamBlend = { x: this.lobAimCam.x, y: this.lobAimCam.y, t: 0 };
      if (A.t < LOB2.tapT) this.doPass(p, dir, 'lob'); else this.aimLob(p, A);
      return true;
    }
    const m = len(ax.x, ax.y);
    if (LOB_AIM.ringOld) {                                                       // (t-008's ring: the Lab's LV4 comparison only)
      if (m > 0.1) { A.k = Math.min(1, A.k + dt / LOB2.ease); const v = LOB2.ringV * (LOB2.easeK + (1 - LOB2.easeK) * A.k); A.rx += ax.x * v * dt; A.ry += ax.y * v * dt; }
      else A.k = 0;
    } else {
      // t-019 RING (Luca: "too sensitive"): slower, and the ring's speed eases towards the stick's (up in ringUp, down in
      // ringStop) - a steady glide with no jump in speed, and it stops about where you let go
      const tv = m > 0.1 ? LOB_AIM.ringV : 0, a = 1 - Math.exp(-dt / (m > 0.1 ? LOB_AIM.ringUp : LOB_AIM.ringStop));
      A.vx += (ax.x * tv - A.vx) * a; A.vy += (ax.y * tv - A.vy) * a; A.rx += A.vx * dt; A.ry += A.vy * dt;
    }
    const c = this.lobAimClamp(p, A.rx, A.ry); A.rx = c.x; A.ry = c.y;
    this.lobAimMagnet(p, dt);
    // the camera frames the ring and the ball (as it does your set piece's aim cursor): a 40 m ring was off screen
    const bx = wx(this.ball.x, this.ball.y), by = wy(this.ball.y), C = this.lobAimCam || (this.lobAimCam = {});
    // (t-019: the framing eases over to the ring in its first half second - it jumped there at the press, the LV5 jolt)
    const s = LOB_AIM.camOld ? 1 : clamp(A.t / 0.5, 0, 1), f = 0.7 * s * s * (3 - 2 * s);
    C.x = bx + (wx(A.x, A.y) - bx) * f; C.y = by + (wy(A.y) - by) * f - 40;   // (mostly the ring: past ~25 m both don't fit, and where it lands is the point)
    if (!this.camTarget || this.camTarget === C) this.camTarget = C;
    return false;
  },
  // ======================================================================= t-019 LOB AIM: AUTO (Luca 25 Oct 06:56: "a lob target is
  // determined by the direction of where the arrow is pointing and is closest or something (closer to fifa)"). No ring:
  // while LOB is held the pick shows as the usual pass-aim marker on him (the only thing on screen); let go = the lob,
  // landing a step ahead of him on his run (ball.js lobAutoSpot), so his t-008 receiving run meets it. How long you held
  // = a little more height and distance (capped at LOB_AIM.holdT); a tap = the quick one. Nobody in the cone = into
  // space along the arrow, as far as the hold says. (The chip in their box and the keeper's throw: as they were.)
  lobAutoTick(p, dir) {
    const A = this.lobAim; this.lobAutoPick(p, dir);
    if (!Input.held('lob')) { this.lobAim = null; this.autoLob(p, A, dir, clamp((A.t - LOB2.tapT) / LOB_AIM.holdT, 0, 1)); return true; }
    this.passAim = A.mate;                                                       // (the marker on the grass under him; none = into space)
    return false;
  },
  // who fits the arrow: team-mates within LOB_AIM.cone degrees of it, 8-45 m out; the cheapest wins, cost = his distance
  // (a man at the cone's edge counts as LOB_AIM.angW further) + opponents near where it would drop (a marked man costs
  // more, so one further on but clearly free can win). The pick shown stays unless another is clearly better.
  lobAutoPick(p, dir) {
    const A = this.lobAim, C = LOB_AIM, l = len(dir.x, dir.y) || 1, ux = dir.x / l, uy = dir.y / l, cone = C.cone * Math.PI / 180, cc = Math.cos(cone);
    let best = null, bc = 1e9, kc = 1e9;
    for (const q of p.team.players) {
      if (q === p || q.sentOff || q.keeper) continue;
      const dx = q.x - p.x, dy = q.y - p.y, d = len(dx, dy); if (d < C.minD || d > C.maxD) continue;
      const cos = (dx * ux + dy * uy) / d; if (cos < cc) continue;
      const ang = Math.acos(clamp(cos, -1, 1)) / cone, s = this.lobAutoSpot(p, q, 0);
      let press = 0; for (const o of p.team.opp.players) { if (o.sentOff) continue; const od = len(o.x - s.x, o.y - s.y); if (od < C.pressR) press += C.pressR - od; }
      const cost = d * (1 + C.angW * ang * ang) + press * C.pressW;
      if (q === A.mate) kc = cost;
      if (cost < bc) { bc = cost; best = q; }
    }
    A.mate = kc < 1e9 && !(bc < kc * C.keep) ? A.mate : best;
  },
  // the light magnet: the ring within LOB2.magnet of a team-mate settles towards him (and he walks to it, so it ends on
  // the spot he'll reach); it lets go past LOB2.magnetOut
  // (t-019 RING: a lighter pull, LOB_AIM.magnetPull, eased in over LOB_AIM.magnetEase - it snapped ~1.8 m onto him)
  lobAimMagnet(p, dt) {
    const A = this.lobAim; let q = A.q && !A.q.sentOff && len(A.q.x - A.rx, A.q.y - A.ry) < LOB2.magnetOut ? A.q : null;
    if (!q) { let bd = LOB2.magnet; for (const m of p.team.players) { if (m === p || m.sentOff || m.keeper) continue; const d = len(m.x - A.rx, m.y - A.ry); if (d < bd) { bd = d; q = m; } } }
    A.q = q;
    const pull = LOB_AIM.ringOld ? LOB2.magnetPull : LOB_AIM.magnetPull, ox = q ? (q.x - A.rx) * pull : 0, oy = q ? (q.y - A.ry) * pull : 0;
    if (dt == null || LOB_AIM.ringOld || A.ox == null) { A.ox = ox; A.oy = oy; }
    else { const a = 1 - Math.exp(-dt / LOB_AIM.magnetEase); A.ox += (ox - A.ox) * a; A.oy += (oy - A.oy) * a; }
    if (A.ox || A.oy) { const c = this.lobAimClamp(p, A.rx + A.ox, A.ry + A.oy); A.x = c.x; A.y = c.y; }
    else { A.x = A.rx; A.y = A.ry; }
  },
  // how long until a lob coming to you drops to head height (0 if it isn't one): SHOOT pressed early is kept that long
  lobDropIn(p) {
    const b = this.ball, P = this.path; if (!b.lob || b.owner || b.target !== p || !P) return 0;
    let hi = b.z > 2.2; for (const q of P) { if (q.z > 2.2) hi = true; else if (hi) return Math.min(LOB2.shootWin, q.t + 0.15); }
    return 0;
  },

  // ======================================================================= t-008 THE AERIAL BATTLE (Luca: "if you kick a lob meant as a pass
  // and its aimed and arriving clearly between/around two opponents clearly, transition a smooth aerial battle where you
  // have to mash kick against the computer (make the mash feel good (dynamic), it can exclaim MASH or PRESS or some sound
  // effect looking all cool, sparks flying, and if df wins it gets cleared away (half randomly, so in a random
  // direction, but also based on the position a bit)"). Either side's open-play lob: just before it drops, if a man of
  // each side is right there (AERIAL.gap / reach), it's a clear contest; most of those (AERIAL.chance, never two within
  // AERIAL.cool s) become the battle, the rest stay the quick duel (lobDuel). Slow motion, the ball hangs between them,
  // MASH! (ui.js), each press a spark and a note. You mash SHOOT; the computer mashes at its level's rate (difficulty.js
  // `mash`); the better position is a head start. Attacker wins: a header at goal (or the aerial special with SP
  // banked), far out he heads it down to his feet. Defender wins: cleared (aerialClearDir).
  // t-034 (Luca 25 Oct 19:14: "aerial battles only within gk box so if you win as attack ball goes like a shot towards the
  // goal and defender thrown to ground, make the aerial battle either be a header on header or volley on volley, if
  // defender wins it gets cleared out, fix the mash mechanics use space bar and make it feel impactful, also the mash
  // mechanic itself when you press is not consistent with click output"). As real football (aerial duels at crosses
  // and set pieces in the box: the firmer contact heads it at goal or clears it, the loser often on the floor) and
  // Tsubasa / Inazuma's in-the-box clashes: the battle only when the contest point is inside the DEFENDING side's
  // penalty area (outside: lobDuel, the quick duel, as before); a whipped cross in counts as well as a lob. The height
  // it is met at picks the duel: head height = HEADER v HEADER, waist height = VOLLEY v VOLLEY (AERIAL.volleyZ).
  aerialCheck() {
    const b = this.ball, q = b.target, C = AERIAL;
    const cross = !b.lob && !!b.crossBy && !!q && b.crossBy.team === q.team;   // (t-034: the computer's whipped cross, or anyone's cross marked at the kick)
    if (!C.on || !((b.lob && b.ring) || cross) || b.owner || b.inNet || this.diving || this.pending || (b.lob && b.vz >= 0) || b.z < C.lowZ || b.z > 4 || !q || q.sentOff || b.last !== q.team || this.setPiece || this.dead) return false;
    if (this.aerialKick === b.spT) return false;                                 // (decided once per ball: b.spT is its kick)
    const V = this.recvVerdict(); if (V && V.kind !== 'contest') return false;   // lob receives: a battle only when it's a near tie (clearly his: no mash)
    const P = this.path; if (!P) return false;
    const dg = q.team.opp, inBox = pt => Math.abs(pt.x - dg.ownGoalX) < C.boxX && Math.abs(pt.y - 34) < C.boxY;
    const ok = p => !p.sentOff && !p.keeper && !p.busy() && p.stun <= 0 && p.cool <= 0;
    const near = (t, pt) => t.players.filter(p => ok(p) && len(p.x - pt.x, p.y - pt.y) < C.reach).sort((u, v) => len(u.x - pt.x, u.y - pt.y) - len(v.x - pt.x, v.y - pt.y))[0];
    const gap = (p, pt) => len(p.x - pt.x, p.y - pt.y) - Math.min(C.reach - C.gap, p.top(true, false) * pt.t * 0.5);   // (where he'll be by then)
    // the first point of its flight in the next 0.45 s, in their box, at a height to contest, with a man of each side on it
    let D = null, att = null, def = null;
    for (const pt of P) { if (pt.t > 0.45) break; if (pt.z > 2.0 || pt.z < C.lowZ || !inBox(pt)) continue;
      const a = near(q.team, pt), d = near(dg, pt);
      if (a && d && len(a.x - d.x, a.y - d.y) <= C.reach && gap(a, pt) <= C.gap && gap(d, pt) <= C.gap) { D = pt; att = a; def = d; break; } }
    if (!D) return false;                                                        // (nobody there yet, or it isn't in their box: look again next frame)
    this.aerialKick = b.spT;
    if ((this.aerialClock || 0) - (this.aerialAt ?? -1e9) < (paceK().duels ? paceK().duelCool : C.cool)) return false;   // (arcade-2: ARCADE more often)
    // (their keeper comes and claims that one: he gets there in time, or it's in his six-yard box - keeper.js's own tests.
    // t-034: it was "within 8 m of him" - in the box that was nearly every drop, from his normal spot off his line)
    const gk = dg.players[0]; if (gk && !gk.sentOff && (0.15 + len(gk.x - D.x, gk.y - D.y) / 6.5 <= D.t + 0.25 || (Math.abs(D.x - dg.ownGoalX) < 5.5 && Math.abs(D.y - 34) < 9.2))) return false;
    if (Math.random() > C.chance) return false;
    // where they meet it: the point of its flight (in the box, at a height to contest) nearest the two of them - a head-
    // height one counts 0.8 m nearer (they'd rather rise and meet it than let it drop to the waist)
    const mx = (att.x + def.x) / 2, my = (att.y + def.y) / 2, far = pt => len(pt.x - mx, pt.y - my) - (pt.z >= C.volleyZ ? 0.8 : 0); let M = D;
    for (const pt of P) { if (pt.t < D.t) continue; if (pt.t > D.t + 0.35) break; if (pt.z > 2.0 || pt.z < C.lowZ || !inBox(pt)) continue;
      if (far(pt) < far(M)) M = pt; }
    this.aerialStart(att, def, M, { move: M.z < C.volleyZ ? 'volley' : 'header' }); return true;
  },
  aerialStart(att, def, D, o = {}) {                                             // (arcade-2: o.kind 'ground' = the same battle on the grass, o.hs = head starts)
    const b = this.ball, C = AERIAL, n0 = { x: att.x - def.x, y: att.y - def.y }, nl = len(n0.x, n0.y) || 1;
    const hs = (p, o) => { const dp = len(p.x - D.x, p.y - D.y), dq = len(o.x - D.x, o.y - D.y), f = dirVec(p.face), ux = (D.x - p.x) / (dp || 1), uy = (D.y - p.y) / (dp || 1);
      return clamp((dq - dp) * C.hsDist + Math.max(0, f.x * ux + f.y * uy) * C.hsFace + (p === b.target ? C.hsRun : 0) + (p.stamina ?? 1) * C.hsSpring, -C.hsMax, C.hsMax); };
    const side = (p, q, sg) => ({ p, hs: o.hs ? o.hs[sg > 0 ? 0 : 1] : hs(p, q), n: 0, acc: 0, x0: p.x, y0: p.y, tx: D.x + n0.x / nl * 0.45 * sg, ty: D.y + n0.y / nl * 0.45 * sg, push: 0,
      cpu: !this.demo && p.team === this.home ? null : C.cpuRate * this.dk(p.team).mash * (1 + rnd(-1, 1) * C.cpuJit) });   // (you mash yourself; the computer at its rate)
    const A = this.aerial = { t: 0, phase: 'intro', kind: o.kind || 'air', D, b0: { x: b.x, y: b.y, z: b.z }, att: side(att, def, 1), def: side(def, att, -1), sp: false, res: null, cam: { x: wx(D.x, D.y), y: wy(D.y) - 110 } };
    if (A.kind === 'ground') { b.owner = null; b.target = null; this.duelN = (this.duelN || 0) + 1; }   // (the ball is nobody's while they fight for it)
    else {
      this.aerialN = (this.aerialN || 0) + 1; this.recvCount('battle');
      // t-034 THE BAR, honest: it starts where the head start puts it (whole steps), then every press is one step - yours
      // towards their end, the computer's back towards yours - and where it stands at the end is the result
      Object.assign(A, { move: o.move || 'header', R: C.barR, owed: 0, T: paceK().arcade ? C.mashTArc : C.mashT, n: { x: n0.x / nl, y: n0.y / nl } });
      A.hz = A.move === 'volley' ? C.holdZv : C.holdZ;
      A.pos0 = A.pos = clamp(Math.round(A.att.hs - A.def.hs), -C.hsBar, C.hsBar);
      for (const s of [A.att, A.def]) { if (s.cpu != null) s.acc = -s.cpu * C.cpuReact; s.p.aerPose = { kind: A.move, f: 0, h: { z: A.hz, side: 0, pw: 1 } }; s.p.setState('aerial', 9); }   // (both go up for it: player.js holds the move's frames)
      Input.mashTake();                                                          // (presses before the prompt don't count)
    }
    if (!this.demo) { this.human = att.team === this.home ? att : def; this.nextHuman = null; }
    for (const p of [att, def]) { p.vx = p.vy = 0; p.cool = 9; }               // (busy with each other: no pickups, no tackles)
    this.headBuf = 0; this.charge = -1; this.lobCharge = -1; this.lobAim = null;
    this.slowMo = Math.max(this.slowMo || 0, 0.2); this.camTarget = A.cam;
    if (A.kind === 'ground') this.duelAt = this.aerialClock || 0; else this.aerialAt = this.aerialClock || 0;   // (arcade-2: the grass duel keeps its own clock - lob battles aren't crowded out)
    SFX.ooh(); SFX.roar(2.2, 0.7);
    this.ramiSay('skill', { text: A.kind === 'ground' ? ['SHOULDER TO\nSHOULDER!', 'NEITHER WILL\nGIVE AN INCH!', 'A BATTLE FOR\nTHE BALL!'][Math.floor(Math.random() * 3)]
      : A.move === 'volley' ? ['BOTH SWING\nAT IT!', 'A VOLLEY EACH -\nWHO GETS THERE?', 'BOOTS UP IN\nTHE BOX!'][Math.floor(Math.random() * 3)]
      : ['UP THEY GO!\nWHO WANTS IT MORE?', 'A BATTLE IN\nTHE AIR!', 'THEY BOTH GO\nFOR IT!'][Math.floor(Math.random() * 3)], expr: 'laugh' }, 2);
  },
  // your mash. The grass duel (arcade-2, unchanged): each new SHOOT / PASS press, a rising edge once a frame. The aerial
  // battle (t-034): every press since the last frame, counted as the keys go down (io.js mashTake: a held key or its
  // auto-repeat is one press, two taps inside one frame are two)
  aerialInput() {
    const A = this.aerial, s = A.att.p === this.human ? A.att : A.def.p === this.human ? A.def : null; if (!s) return;
    if (A.kind !== 'ground') {
      const n = Input.mashTake(); if (A.res == null) for (let i = 0; i < n && this.aerial === A && A.res == null; i++) this.aerialPress(s, true);
      if (s === A.att && Input.pressed('special') && this.meterOf(s.p.team).level() >= 1) A.sp = true;   // SPECIAL in the battle: the aerial special if you win it
      return;
    }
    const g = A.kind === 'ground', h = Input.held('shoot') || (g && Input.held('pass')), hit = Input.pressed('shoot') || (g && Input.pressed('pass')) || (h && !A.lastShoot); A.lastShoot = h;   // (arcade-2: on the grass PASS mashes too)
    if (A.phase === 'mash' && hit) this.aerialHit(s);
    if (s === A.att && Input.pressed('special') && this.meterOf(s.p.team).level() >= 1) A.sp = true;   // SPECIAL in the battle: the aerial special if you win it
  },
  aerialHit(s) {                                                                 // (the grass duel's press: arcade-2, as it was)
    const A = this.aerial, att = s === A.att; s.n++;
    SFX.tone('square', (att ? 520 : 330) + Math.min(s.n, 16) * 22, (att ? 760 : 480) + Math.min(s.n, 16) * 22, 0.05, 0.05); SFX.hiss(2200, 1.5, 0.03, 0.06);   // (a note per press, climbing)
    if (this.aerialPop) this.aerialPop(att);                                     // sparks off the ball (ui.js)
    if (s.p === this.human || s.n % 2 === 0) this.cameras.main.shake(40, 0.0012);
  },
  // t-034 one press in the aerial battle = one step of the bar, always. Yours (own): a tiny hit-stop, sparks, a punchy
  // thump, a camera kick, your man shoves in. The computer's: the bar steps back the same, its man shoves, a softer,
  // lower knock - no sparks (they used to fire for its presses too, so you couldn't tell whose press did what).
  // Reaching the end of the bar wins it outright, there and then.
  aerialPress(s, own) {
    const A = this.aerial, C = AERIAL, att = s === A.att; s.n++; A.pos += att ? 1 : -1; s.push = 1; A.joltAt = this.time.now; A.joltBy = att ? 1 : -1;
    if (own) {
      const k = Math.min(s.n, 14);
      SFX.tone('sine', 150, 46, 0.09, 0.5); SFX.tone('square', 380 + k * 28, 190 + k * 14, 0.05, 0.07); SFX.hiss(2600, 1.3, 0.04, 0.16);   // (a thump + a climbing crack)
      if (this.aerialPop) this.aerialPop(att);                                   // sparks off the ball (ui.js)
      this.hitStop = Math.max(this.hitStop || 0, C.stopPress * (this.slowMo > 0 ? 0.4 : 1)); A.owed += C.stopPress;   // (the window runs on through it: owed)
      this.cameras.main.shake(60, 0.0035);
    } else SFX.tone('triangle', 170, 95, 0.07, 0.07);
    if (Math.abs(A.pos) >= A.R) this.aerialFinish(A.pos > 0 ? 'att' : 'def', true);
  },
  aerialTick(dt) {
    this.aerialClock = (this.aerialClock || 0) + dt;
    const A = this.aerial; if (!A) return;
    const b = this.ball, C = AERIAL, rdt = this.slowMo > 0 ? dt / 0.4 : dt;       // (in real time: the match runs at 0.4 in slow motion)
    if (b.owner || b.inNet || this.dead || this.setPiece || this.foulScene || A.att.p.sentOff || A.def.p.sentOff) { this.aerialEnd(); return; }   // (anything else: called off)
    this.slowMo = Math.max(this.slowMo, 0.2);
    if (A.kind !== 'ground') { this.aerialAirTick(A, rdt); return; }
    A.t += rdt;
    const T = C.introT + C.mashT, k = clamp(A.t / T, 0, 1), e = 1 - (1 - Math.min(1, A.t / C.introT)) ** 2;
    const hz = A.kind === 'ground' ? 0.12 : C.holdZ;                              // (arcade-2: on the grass it's held between their feet)
    b.x = A.b0.x + (A.D.x - A.b0.x) * e; b.y = A.b0.y + (A.D.y - A.b0.y) * e; b.z = A.b0.z + (hz - A.b0.z) * e + Math.sin(k * Math.PI * 6) * 0.04;   // it drifts to the drop and hangs there
    b.vx = b.vy = b.vz = 0;
    for (const s of [A.att, A.def]) { const p = s.p; p.x = s.x0 + (s.tx - s.x0) * e; p.y = s.y0 + (s.ty - s.y0) * e; p.vx = p.vy = 0; p.face = dirIndex(b.x - p.x, b.y - p.y); }
    if (A.phase === 'intro' && A.t >= C.introT) A.phase = 'mash';
    if (A.phase === 'mash') {
      for (const s of [A.att, A.def]) if (s.cpu != null) { s.acc += s.cpu * rdt; while (s.acc >= 1) { s.acc -= 1; this.aerialHit(s); } }
      if (A.t >= T) {
        const sa = this.aerialScore(A.att), sd = this.aerialScore(A.def);
        A.res = sa > sd || (sa === sd && Math.random() < 0.5) ? 'att' : 'def'; A.phase = 'done'; A.wait = C.outroT;
      }
    } else if (A.phase === 'done') { A.wait -= rdt; if (A.wait <= 0) this.aerialEnd(); }
  },
  aerialScore(s) { return Math.max(0.2, 2 + s.hs + s.n); },                      // (the grass duel's bar: att / (att + def))
  // t-034 the aerial battle's frame: in wall-clock time (the hit-stops are paid back through A.owed, so the window is
  // ~1.2 s however hard you mash, and the computer keeps pressing through them). Both rise to the contact over introT
  // (presses count from the prompt), then hang on it, shoving in on each press; the ball sits at head / waist height,
  // nudged towards whoever is losing it. The window's end: the bar decides (dead level: a coin).
  aerialAirTick(A, rdt) {
    const b = this.ball, C = AERIAL, w = rdt + A.owed; A.owed = 0; A.t += w;
    const e = 1 - (1 - Math.min(1, A.t / C.introT)) ** 2, k = A.pos / A.R;
    if (A.phase === 'intro' && A.t >= C.introT) A.phase = 'mash';
    b.x = A.b0.x + (A.D.x - A.b0.x) * e - A.n.x * 0.25 * k; b.y = A.b0.y + (A.D.y - A.b0.y) * e - A.n.y * 0.25 * k;
    b.z = A.b0.z + (A.hz - A.b0.z) * e + Math.sin(A.t * 31) * 0.03; b.vx = b.vy = b.vz = 0;
    for (const s of [A.att, A.def]) { const p = s.p, sg = s === A.att ? -1 : 1; s.push = Math.max(0, s.push - w * 9);
      p.x = s.x0 + (s.tx - s.x0) * e + A.n.x * sg * 0.14 * s.push; p.y = s.y0 + (s.ty - s.y0) * e + A.n.y * sg * 0.14 * s.push; p.vx = p.vy = 0;
      p.face = dirIndex(b.x - p.x, b.y - p.y); if (p.aerPose) p.aerPose.f = e; if (p.state !== 'aerial') p.setState('aerial', 9); }
    for (const s of [A.att, A.def]) if (s.cpu != null && this.aerial === A && A.res == null) { s.acc += s.cpu * w; while (s.acc >= 1 && this.aerial === A && A.res == null) { s.acc -= 1; this.aerialPress(s, false); } }
    if (this.aerial === A && A.res == null && A.t >= A.T) this.aerialFinish(A.pos > 0 || (A.pos === 0 && Math.random() < 0.5) ? 'att' : 'def', false);
  },
  // the finish: a big hit-stop, a white flash, a hard shake, a boom and a whoosh, the burst off the ball, Rami - and
  // the ball goes there and then (aerialEnd: the shot at goal / the clearance)
  aerialFinish(res, ko) {
    const A = this.aerial; if (!A || A.res) return; A.res = res; A.ko = ko; A.phase = 'done';
    const C = AERIAL, att = res === 'att';
    this.hitStop = Math.max(this.hitStop || 0, C.stopEnd * (this.slowMo > 0 ? 0.4 : 1));
    this.cameras.main.flash(110, 255, 250, 235); this.cameras.main.shake(240, 0.009);
    SFX.boom(1); SFX.hiss(1300, 0.5, 0.4, 0.35, 0.04); SFX.roar(2.5, att ? 1 : 0.7);   // (the boom, then the whoosh of the ball going)
    if (this.aerialBurst) this.aerialBurst(att);
    this.aerFx = { word: att ? (A.move === 'volley' ? 'VOLLEYED!' : 'WON IT!') : 'CLEARED!', at: this.time.now, x: A.D.x, y: A.D.y };   // (ui.js: the word stays up a moment after)
    this.ramiSay('skill', { text: att ? ['HE WINS IT IN\nTHE AIR - AT GOAL!', 'WHAT A LEAP!\nHE GOES FOR IT!', 'HE BULLIES HIM\nOFF THE BALL!'][Math.floor(Math.random() * 3)]
      : ['CLEARED!\nMAGNIFICENT!', 'THE DEFENDER\nWINS THAT ONE!', 'HEADED TO\nSAFETY!'][Math.floor(Math.random() * 3)], expr: att ? 'laugh' : 'talk' }, 2);
    this.aerialEnd();
  },
  // arcade-2 (the co-designer: "a mini-game button masher... the same energy as football anime"): on ARCADE the MASH duel
  // also comes on the grass - a contested tackle (challenge) and a 50-50 loose ball two men reach together. Never two
  // within PACE duelCool seconds (shared with the AERIAL BATTLE); CLASSIC never gets here.
  duelReady() { const c = this.aerialClock || 0, P = paceK();
    return !this.aerial && !this.setPiece && !this.dead && !this.foulScene && !this.pending && c - (this.duelAt ?? -1e9) >= P.duelGap && c - (this.aerialAt ?? -1e9) >= P.duelCool; },
  looseDuelCheck() {
    if (!paceK().duels) return false;
    const b = this.ball; if (b.owner || b.inNet || b.duelTry || b.z > 0.6 || len(b.vx, b.vy) > 7 || b.special || this.diving || !this.duelReady()) return false;
    const ok = p => !p.sentOff && !p.keeper && !p.busy() && p.stun <= 0 && p.cool <= 0 && len(p.x - b.x, p.y - b.y) < 1.5;
    const near = t => t.players.filter(ok).sort((u, v) => len(u.x - b.x, u.y - b.y) - len(v.x - b.x, v.y - b.y))[0];
    const h = near(this.home), a = near(this.away); if (!h || !a || len(h.x - a.x, h.y - a.y) > 2.2) return false;
    b.duelTry = true;                                                            // (once per loose ball: cleared when someone has it)
    if (Math.random() > 0.4) return false;
    const [att, def] = len(h.x - b.x, h.y - b.y) <= len(a.x - b.x, a.y - b.y) ? [h, a] : [a, h];   // (the nearer man is the "attacker": the bar starts his way)
    this.aerialStart(att, def, { x: b.x, y: b.y }, { kind: 'ground' }); return true;
  },
  aerialEnd() {
    const A = this.aerial; if (!A) return; this.aerial = null;
    if (this.camTarget === A.cam) this.camTarget = null;
    for (const s of [A.att, A.def]) { s.p.cool = 0; if (s.p.state === 'aerial') s.p.setState('idle', 0); s.p.aerPose = null; }   // (t-034: down from the pose)
    if (!A.res) return;
    const b = this.ball, w = A.res === 'att' ? A.att.p : A.def.p, l = A.res === 'att' ? A.def.p : A.att.p;
    if (A.kind === 'ground') {                                                    // arcade-2: the winner comes away with it at his feet, loud
      Object.assign(b, { x: A.D.x, y: A.D.y, z: 0, vx: 0, vy: 0, vz: 0, lob: false, tried: null, owner: null });
      l.stun = 0.45; l.cool = 0.7; l.setState('hit', 0.43); w.cool = 0; this.gain(w, 0);
      this.say('', A.res === 'att' ? 'KEPT IT!' : 'WON IT!', 0.9); this.hitStop = Math.max(this.hitStop || 0, 0.09); this.cameras.main.shake(180, 0.006); SFX.boom(0.6);
      this.aerialLast = { res: A.res, by: w, att: A.att.p, def: A.def.p, n: [A.att.n, A.def.n], hs: [+A.att.hs.toFixed(2), +A.def.hs.toFixed(2)], kind: 'ground', at: { x: A.D.x, y: A.D.y } };
      return;
    }
    const C = AERIAL; Object.assign(b, { z: A.hz, vx: 0, vy: 0, vz: 0, lob: false, tried: null, owner: null });
    let dir = null, how = '';
    if (A.res === 'att') {
      // t-034 the attacker wins: the defender is thrown to the ground (out of it ~1.3 s: the fall, then his get-up), and
      // the ball goes like a shot - off his contact frame, at a real shot's pace, at a corner (or the aerial special)
      const ux = l.x - w.x, uy = l.y - w.y, ul = len(ux, uy) || 1;
      l.setState('fall', C.floorT); l.stun = C.floorT + 0.45; l.cool = l.stun; l.vx = ux / ul * 2.6; l.vy = uy / ul * 2.6; l.face = dirIndex(-ux, -uy);
      const me = w === this.human && !this.demo;
      this.say('', 'WON IT IN THE AIR!', 0.9);
      if (me && A.sp && this.meterOf(w.team).level() >= 1) { this.airSpecial(w); how = 'special'; }   // your aerial special (SPECIAL pressed in the battle)
      else if (!me && this.aiAirSpecial(w)) how = 'special';                     // (the computer's, SP banked)
      else how = this.aerialShot(w, A);
    } else {
      l.stun = 0.35; l.cool = 0.6; l.setState('hit', 0.43);                     // beaten in the air: he stumbles, stays up
      dir = this.aerialClearDir(w); this.aerialClear(w, A, dir); how = 'clear';
      this.say('', A.move === 'volley' ? 'VOLLEYED CLEAR!' : 'HEADED CLEAR!', 0.9);
    }
    this.aerialLast = { res: A.res, by: w, att: A.att.p, def: A.def.p, n: [A.att.n, A.def.n], hs: [+A.att.hs.toFixed(2), +A.def.hs.toFixed(2)], dir, at: { x: A.D.x, y: A.D.y },
      kind: 'air', move: A.move, pos0: A.pos0, pos: A.pos, R: A.R, ko: !!A.ko, T: +A.t.toFixed(2), how, spd: how === 'special' ? 0 : Math.round(Math.hypot(b.vx, b.vy, b.vz) * 3.6), loser: l };   // (t-034: the Lab's AB lines)
    this.flagReplay(A.res === 'att' ? 'WON IN THE AIR!' : 'AERIAL BATTLE');
  },
  // t-034 the winning header / volley at goal: struck as the battle ends (the ball leaves his head / boot on the move's
  // contact frame - the move opens there), at the pace the margin earned (AERIAL.hdrV / volV: a narrow win to won
  // outright), at a corner away from the keeper (yours: your stick's side if you hold one), give or take
  // AERIAL.shotSpread (the computer's x its finishing by level). A normal shot for the keeper: planSave, the SAVE! call.
  aerialShot(w, A) {
    const b = this.ball, C = AERIAL, s = w.team.side, gk = w.team.opp.players[0], m = clamp(Math.abs(A.pos) / A.R, 0, 1), vol = A.move === 'volley', me = w === this.human && !this.demo;
    const sideY = me && Math.abs(Input.axis.y) > 0.2 ? Math.sign(Input.axis.y) : gk && !gk.sentOff ? (gk.y > 34 ? -1 : 1) : (Math.random() < 0.5 ? -1 : 1);
    const ty = 34 + sideY * C.shotAim + rnd(-1, 1) * C.shotSpread * (me ? 1 : this.dk(w.team).shotErr), tx = w.team.goalX;
    const V = vol ? C.volV : C.hdrV, spd = V[0] + (V[1] - V[0]) * m, dx = tx - b.x, dy = ty - b.y, l = len(dx, dy) || 1, T = l / spd, zt = vol ? rnd(0.4, 1.9) : rnd(0.3, 1.5);
    const vz = (zt - b.z + 0.5 * G * T * T) / T;                                // (to cross the line at zt: under the bar)
    w.face = dirIndex(dx, dy); this.airHitNote(w, dx, dy, { pw: 1 });           // (the power header / whipped volley pick: player.js AIR_PICKS)
    this.aerialStrikeLook(w, vol);
    Object.assign(b, { vx: dx / l * spd, vy: dy / l * spd, vz, skid: true, rollV: 0.72 * spd, last: w.team, lastP: w, save: null, target: null, special: 0, power: 0.55 + 0.45 * m, saveable: null, crossBy: null });
    if (b.spin || b.curl || b.aft) { b.spin = 0; b.curl = 0; b.aft = null; }
    b.how = { kind: vol ? 'volley' : 'header', x: b.x, y: b.y }; this.stat(w.team).shots++;
    if (vol) SFX.kick(0.95); else { SFX.head(); SFX.kick(0.7); }
    if (gk && !gk.sentOff) this.planSave(gk); this.shotSaveCall(w.team.opp, w.team);
    return 'shot';
  },
  // t-034 the defender's clearance: AERIAL.clearV / clearVz - high and long, out of the box (aerialClearDir's way)
  aerialClear(w, A, dir) {
    const b = this.ball, C = AERIAL, vol = A.move === 'volley';
    w.face = dirIndex(dir.x, dir.y); this.airHitNote(w, dir.x, dir.y, { pw: 1 }); this.aerialStrikeLook(w, vol);
    Object.assign(b, { vx: dir.x * C.clearV, vy: dir.y * C.clearV, vz: C.clearVz, skid: true, rollV: 0.72 * C.clearV, last: w.team, lastP: w, save: null, target: null, special: 0, power: 0, saveable: null, crossBy: null });
    if (b.spin || b.curl || b.aft) { b.spin = 0; b.curl = 0; b.aft = null; }
    b.how = { kind: vol ? 'volley' : 'header', x: b.x, y: b.y };
    if (vol) SFX.kick(0.8); else { SFX.head(); SFX.kick(0.5); }
  },
  // the winner's move from its contact frame on: a header plays from it already (player.js), the volley is told to
  aerialStrikeLook(w, vol) {
    w.cool = 0.4; this.headBuf = 0;
    if (!vol) { w.setState('header', 0.5); return; }
    w.kickAnim = 'volley'; w.setState('kick', 0.45);
    const K = MAN.kits[w.kit], d = DIRS[w.face], r = airPick(K, 'volley', d, w.airHit), c = r && airContact(K, r.a, d); if (c != null) w._from = c;
  },
  // the clearance: AERIAL.clearRand of it a random direction, the rest by position (up the pitch, out towards the nearer
  // touchline) - and never back into the middle of his own box
  aerialClearDir(p) {
    const s = p.team.side, ny = Math.sign(p.y - 34) || (Math.random() < 0.5 ? -1 : 1), a = rnd(-Math.PI, Math.PI), r = AERIAL.clearRand;
    let x = s * (1 - r) / Math.SQRT2 * 1.2 + Math.cos(a) * r, y = ny * (1 - r) / Math.SQRT2 * 0.9 + Math.sin(a) * r;
    if (x * s < 0.25) x = s * Math.max(0.25, Math.abs(x) * 0.5);                 // not back towards his own goal
    const own = Math.abs(p.x - p.team.ownGoalX) < 24;
    if (own && Math.sign(y) !== ny && Math.abs(y) > 0.2) y = -y * 0.6;          // near his own goal: out wide, not across the box
    const l = len(x, y) || 1; return { x: x / l, y: y / l };
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
    p.cool = TACKLE.chCool; p.face = dirIndex(b.x - p.x, b.y - p.y);
    if (MAN.kits[p.kit].anims[`tackle-${DIRS[p.face]}`]) p.setState('tackle', 0.3);      // the lunge (PixelLab batch 5)
    const db = len(b.x - p.x, b.y - p.y);
    if (db > 1.6) { p.stun = TACKLE.chMissStun; p.cool = TACKLE.chMissCool; return; }   // lunged at nothing: too far (t-018: it costs as much as a miss)
    // INSTA FLAG 25 Oct (Luca: "the final lvl 3 aerial shot was completely blocked that cannot happen"): during an aerial
    // special's wind-up the ball hangs up at his boot (b.owner = the striker, this.pending) and a defender's standing
    // tackle took it off him there 17 times in 20, before the strike: a special that never got to blow through anyone.
    // A ball in the air at his boot is out of a standing tackle's reach: he lunges at nothing
    { const k = this.pending; if (k && k.p === carrier && k.info.special && b.z > 0.6) { p.stun = TACKLE.chMissStun; p.cool = TACKLE.chMissCool; return; } }
    const cv = carrier.speed > 0.6 ? { x: carrier.vx / carrier.speed, y: carrier.vy / carrier.speed } : dirVec(carrier.face);
    const rx = p.x - carrier.x, ry = p.y - carrier.y, rl = len(rx, ry) || 1, front = (cv.x * rx + cv.y * ry) / rl;
    const human = p === this.human && !this.demo, vsHuman = carrier === this.human && !this.demo;
    let pWin = front > 0.3 ? 0.8 : front > -0.3 ? 0.55 : 0.2;                   // in his path / beside him / behind him
    if (len(b.x - carrier.x, b.y - carrier.y) < 0.7) pWin -= 0.1;               // tight control is harder to win
    if (db < 0.9) pWin += 0.08;                                                  // right on the ball
    if (human) { const Y = this.dkY(carrier.team), P = paceK(); pWin += Y.yb - (Y.sh * P.shK + (Y.sh > 0 ? P.shAdd : 0)); }   // (v0.9.3: by level, was always +0.08; the top levels shield it;
                                                                                   // arcade-2: on ARCADE more, so the quicker game isn't easier to defend)
    if (vsHuman) { const Y = this.dkY(p.team); pWin -= carrier.burst > paceK().burstT - 0.55 ?   // (arcade-2: ARCADE's longer dash protects you only its first 0.55 s, as on CLASSIC)
      Math.max(0.2, 0.3 * Y.tk) : (carrier.sprinting ? 0.2 : 0.12) * Y.tk; }   // you can beat the computer with a burst (v0.9.3: by how much, by level)
    else if (carrier.burst > 0) pWin -= 0.25;                                     // v0.8.2: the computer's take-on burst too
    if (paceK().duels && front > -0.3 && Math.abs(pWin - 0.5) < 0.22 && !carrier.keeper && this.duelReady() && Math.random() < 0.35) {   // arcade-2: a CONTESTED tackle (not a clear
      const h = clamp((pWin - 0.5) * 7, -AERIAL.hsMax, AERIAL.hsMax); this.aerialStart(carrier, p, { x: b.x, y: b.y }, { kind: 'ground', hs: [-h, h] }); return; }   // win or loss) becomes a MASH duel; the better tackle is a head start
    if (Math.random() < pWin) { this.steal(p, carrier); return; }               // won: it's yours, at your feet
    if (front < -0.3 && rl < 1.2 && Math.random() < 0.4) { this.foul(p, carrier, true); return; }   // through the back of him
    if (rl < 1.0 && Math.random() < 0.06) { this.foul(p, carrier, false); return; }                // clipped his ankle
    p.stun = TACKLE.chMissStun; p.cool = TACKLE.chMissCool;                      // missed: off balance (t-018: longer, so mashing it doesn't pay)
  },
  // SLIDE: you go to ground in the direction you're pushing (or at the ball). It reaches further than a challenge.
  // A perfect slide from straight in front can stop the ball dead for you; otherwise the ball rolls on the way the
  // tackle sends it (your slide + his run). Hitting the man before the ball is a foul. Resolved on contact in slides().
  slideTackle(p, dir) {
    const b = this.ball; if (p.cool > 0) return;
    // v0.8.2: aim where the ball WILL be (it was aimed at where it was, so a slide at a runner hit the man: 22 fouls in 60);
    // a push within ~35 degrees of that line is helped onto it
    // (a slide covers (V / K) * (1 - e^(-K t)) metres: it slows down, so the lead is solved on that, not on V m/s)
    // the earliest moment the slide can reach where the ball will be (foot 0.7 m out, ~1 m of leg reach)
    const V = TACKLE.slideV, K = TACKLE.slideK;
    let tr = 0, gap = 1e9;
    for (let t = 0; t <= TACKLE.slideT; t += 0.025) { const D = len(b.x + b.vx * t - p.x, b.y + b.vy * t - p.y) - 0.7 - V / K * (1 - Math.exp(-K * t));
      if (D < 0.6) { tr = t; break; } if (D < gap) { gap = D; tr = t; } }
    const lx = b.x + b.vx * tr - p.x, ly = b.y + b.vy * tr - p.y, ll = len(lx, ly) || 1, lead = { x: lx / ll, y: ly / ll };
    let d = dir && len(dir.x, dir.y) > 0.2 ? { x: dir.x / len(dir.x, dir.y), y: dir.y / len(dir.x, dir.y) } : lead;
    if (d !== lead && d.x * lead.x + d.y * lead.y > 0.82 && ll < 5) d = lead;
    p.face = dirIndex(d.x, d.y); p.slideDir = d;
    // t-018: a longer slide and a cool-down that runs through the get-up (it ran out in the get-up: slide, slide, slide)
    p.vx = d.x * V; p.vy = d.y * V; p.setState('slide', TACKLE.slideT); p.cool = TACKLE.missCool; p.slideWon = false; p.slideHit = new Set();
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
        p.stateT = Math.min(p.stateT, TACKLE.wonRest);                          // t-018: won it - he stops sliding and gets up (player.js)
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
