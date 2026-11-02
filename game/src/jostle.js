// HC2 Football · jostle.js: JOSTLING FOR A HIGH BALL (the co-designer, 31 Oct)
//
// His words: "MASH aerial battles should happen less. Only when it is truly 50/50 contested. We want to lower that
// statistic down to 30%. Strikers should be trying to shove in front of defenders just like in real football, using
// their arms to push them back etc. ... Should be based on more real football mechanics." His picks: you jostle
// automatically and HOLD SPRINT to push harder (more power, more foul risk); the referee calls too much shoving (a
// striker's push = their free kick) and holding (a defender dragging him back in his own box = a penalty, rarely);
// both paces; corners, free kicks into the box and open-play crosses. PixelLab batch 23: jshove / jhold / jlean.
//
// How real football does it: while a cross or corner is in the air, the striker and his marker fight for the spot -
// arms out, shoulders in, the defender goal-side holding an arm-bar, the striker spinning or shoving to get in front.
// Whoever wins the position meets the ball cleanly; a real 50/50 is two men arriving together. Referees let normal
// contact go and blow for a clear push or a hold that stops the run (Law 12). FIFA / EA FC: contextual jostling in the
// box, strength + positioning decide the header, the shove is held with the sprint / shield button; PES: the marker
// goal-side wins most, the attacker needs the better run.
//
// How it works here: from the moment a high ball is struck towards a man near their box, he and the opponent marking him
// (within JOSTLE.pairR) jostle every frame until the lob-receive race (actions.js recvVerdict) is decided. The jostle
// is a running score J (+ = the striker is winning the spot): who is nearer where it comes down, the defender's
// goal-side start, each man's push (automatic, harder while you hold SPRINT, the computer by level) x his strength
// (stamina). J goes into that race as time (JOSTLE.toT s per point): a clear jostle win is a CLEAN ball (no mash, he
// heads it) or a LOST one (the defender heads it away); only a near tie stays CONTEST - the MASH. While they jostle,
// the one on top nudges the other off the spot, and both play batch 23's moves. Pushing past JOSTLE.foul draws the
// whistle when the race is decided.
const JOSTLE = {
  on: true,            // the Lab's switch
  pairR: 3.2,          // his marker: the nearest opponent within this of him as it's struck (m)
  contactR: 1.7,       // they jostle while this close (m); further apart it's just a race
  boxX: 24, boxY: 24,  // only for a ball coming down within this of their goal (x from the line, y from the middle)
  posK: 0.55,          // per second, per metre nearer to where it comes down
  goalSide: 0.12,      // per second, the defender goal-side of him (between him and the goal: the start every marker wants)
  push: 0.5,           // per second, each man's push at full strength (auto)
  pushHold: 1.8,       // ...x this while you HOLD SPRINT (it costs stamina: drain per second)
  drain: 0.22,
  cpuLvl: 0.18,        // the computer's push +/- this per level step (easy -1 .. rise +2)
  noise: 0.25,         // per second, the scramble
  toT: 1.15,           // the race: seconds of head start per point of J (2 Nov: at 0.42 the jostle moved the race by ~0.1 s and
                       // the MASH stayed at 4 in 5 corners; the spot won with arms and shoulders has to decide most balls)
  readR: 2.6,          // the man who contests it is read for the jostle if he's within this of him (not only his marker)
  nudge: 0.9,          // m/s: the one on top moves the other off the spot (x tanh J)
  foul: 1.15,          // a push spent above this (push x seconds, his side, over the other's) risks the whistle...
  foulP: 0.55,         // ...at this chance per point over
  penK: 0.35,          // a defender's hold in his own box is blown this much less often (refs give fewer penalties)
  // (2 Nov, measured: a whipped corner is decided almost as it's struck, so a jostle that starts at the kick never had
  // time - 3 jostles in 12 matches, MASH still 56 of 71 corners. Real football: the grappling is BEFORE the corner is
  // taken, while the taker places the ball. So:)
  setRate: 0.6,        // at a corner, each pair jostles from the setup to the kick at this share of the in-flight rates
  instT: 0.8,          // a cross with no jostle running: the man on him is read on the spot, as this many seconds of it
};

hc2Mix(Match, {
  // every frame (match.js sim): start, run and end the jostle for the high ball in the air
  jostleStep(dt) {
    const b = this.ball, J = this.jostle;
    const sp = this.setPiece;
    if (JOSTLE.on && sp && sp.kind === 'CORNER' && !sp.kicked && !this.dead) { this.jostleSet(sp, dt); return; }   // (the grappling before a corner)
    if (J && (J.k !== b.spT || b.owner || b.inNet || this.dead || this.setPiece)) { this.jostleEnd(); return; }
    if (!JOSTLE.on || this.dead || this.setPiece || this.aerial) { if (this.jPairs && !sp) this.jostleSetEnd(); return; }
    if (!J) { if (!b.owner && b.spT && this.jostleKey !== b.spT) this.jostleTry(); return; }
    this.jostleTick(J, dt);
  },
  // a high ball just struck at a man near their box, with one of theirs on him: they jostle
  jostleTry() {
    const b = this.ball, q = b.target; this.jostleKey = b.spT;
    if (!q || q.keeper || q.sentOff || b.last !== q.team || !(b.lob || b.crossBy)) return;
    const pre = this.jPairs && this.jPairs.get(q); this.jostleSetEnd();          // (a corner: the pair that grappled before the kick carries on)
    const P = this.path; if (!P || !P.length) return;
    const land = P.find(pt => pt.z <= 2.4 && pt.t > 0.2) || P[P.length - 1], gx = q.team.goalX;
    if (Math.abs(land.x - gx) > JOSTLE.boxX || Math.abs(land.y - 34) > JOSTLE.boxY) return;
    const d = pre && !pre.d.sentOff ? [pre.d, 0] : q.team.opp.players.filter(o => !o.sentOff && !o.keeper && o.stun <= 0)
      .map(o => [o, len(o.x - q.x, o.y - q.y)]).filter(([, l]) => l < JOSTLE.pairR).sort((u, v) => u[1] - v[1])[0];
    if (!d) return;
    const cpu = p => 1 + JOSTLE.cpuLvl * ((this.dk(p.team).mash || 1) - 1) * 4 + rnd(-0.12, 0.12);   // (the computer by level - its mash rate, difficulty.js - a little different every time)
    this.jostle = pre ? Object.assign(pre, { k: b.spT, a: q, land }) : { k: b.spT, a: q, d: d[0], J: 0, t: 0, land, fa: 0, fd: 0, ka: cpu(q), kd: cpu(d[0]), contact: 0 };
    this.jostleN = (this.jostleN || 0) + 1;
  },
  // THE CORNER SETUP: every attacker in their box and the man marking him (t-029's shape puts a marker goal-side of
  // each) grapple until the kick - arms, shoulders, the arm-bar - at setRate of the in-flight jostle
  jostleSet(sp, dt) {
    const P = this.jPairs = this.jPairs || new Map(), team = sp.team, gx = team.goalX;
    if (this.jSetSp !== sp) { this.jSetSp = sp; this.jSetAt = this.time.now; P.clear(); }   // (a new corner: new pairs)
    for (const a of team.players) { if (a.sentOff || a.keeper || a === sp.taker || Math.abs(a.x - gx) > 16.5 || Math.abs(a.y - 34) > 20) continue;
      let J = P.get(a);
      if (!J) { const d = team.opp.players.filter(o => !o.sentOff && !o.keeper && ![...P.values()].some(v => v.d === o)).map(o => [o, len(o.x - a.x, o.y - a.y)]).filter(([, l]) => l < JOSTLE.contactR).sort((u, v) => u[1] - v[1])[0];
        if (!d) continue; const cpu = p => 1 + JOSTLE.cpuLvl * ((this.dk(p.team).mash || 1) - 1) * 4 + rnd(-0.12, 0.12);
        J = { a, d: d[0], J: 0, t: 0, land: { x: a.x, y: a.y }, fa: 0, fd: 0, ka: cpu(a), kd: cpu(d[0]), contact: 0, set: true }; P.set(a, J); this.jostleN = (this.jostleN || 0) + 1; }
      J.land = { x: gx - team.side * 8, y: a.y };                                    // (before the kick: the spot he wants is in front of his marker, towards the six-yard box)
      this.jostleTick(J, dt * JOSTLE.setRate, true); }
  },
  jostleSetEnd() { if (this.jPairs) for (const J of this.jPairs.values()) { this.jostleAnim(J.a, null); this.jostleAnim(J.d, null); } this.jPairs = null; this.jSetAt = 0; this.jSetSp = null; },
  jostleTick(J, dt, pre) {
    const C = JOSTLE, a = J.a, d = J.d, b = this.ball;
    if (a.sentOff || d.sentOff || a.stun > 0) { this.jostleEnd(); return; }
    J.t += dt;
    const P = !pre && this.path, land = (P && P.find(pt => pt.z <= 2.4 && pt.t > 0.05)) || J.land; J.land = land;
    const dist = len(a.x - d.x, a.y - d.y); if (dist > C.contactR) { this.jostleAnim(a, null); this.jostleAnim(d, null); return; }
    J.contact += dt;
    // where they stand: nearer the drop is better; the defender goal-side of him has the start every marker wants
    const da = len(a.x - land.x, a.y - land.y), dd = len(d.x - land.x, d.y - land.y), gx = a.team.goalX;
    const goalSide = Math.abs(d.x - gx) < Math.abs(a.x - gx) - 0.2 && Math.abs(d.y - a.y) < 1.6;
    // how hard each pushes: automatic, harder while a human holds SPRINT (costs stamina); the computer by level
    const push = p => { const human = this.isHuman(p) && !this.demo; let k = human ? 1 : (p === a ? J.ka : J.kd);
      if (human && this.inpOf(p.team).held('sprint')) { k *= C.pushHold; p.stamina = Math.max(0, (p.stamina ?? 1) - C.drain * dt); }
      return k * (0.8 + 0.4 * (p.stamina ?? 1)); };
    const pa = push(a), pd = push(d);
    J.fa += pa * dt; J.fd += pd * dt;
    J.J += (clamp(dd - da, -2, 2) * C.posK + (pa - pd) * C.push - (goalSide ? C.goalSide : 0) + rnd(-1, 1) * C.noise) * dt;
    // the one on top moves the other off the spot (a little; the runs still decide where they go)
    const loser = J.J > 0 ? d : a, winner = J.J > 0 ? a : d, ux = loser.x - winner.x, uy = loser.y - winner.y, ul = len(ux, uy) || 1, s = C.nudge * Math.tanh(Math.abs(J.J)) * dt;
    if (!pre) { loser.x += ux / ul * s; loser.y += uy / ul * s; }                  // (before the kick they hold their spots: the setup's shape stays)
    // batch 23's moves: on top he shoves (striker) or holds the arm-bar (defender); under it, shoulder in
    this.jostleAnim(a, J.J > 0.15 ? 'jshove' : 'jlean'); this.jostleAnim(d, J.J < -0.15 ? 'jhold' : 'jlean');
    a.face = dirIndex(d.x - a.x, d.y - a.y); d.face = dirIndex(a.x - d.x, a.y - d.y);
  },
  jostleAnim(p, a) { p.jAnim = a; p.jAnimT = a ? 0.2 : 0; },
  jostleEnd() { const J = this.jostle; if (J) { this.jostleAnim(J.a, null); this.jostleAnim(J.d, null); } this.jostle = null; },
  // the race (recvVerdict) asks: how much head start does the jostle give the man it's meant for over this opponent?
  // (s; + = his). Only for his marker, only once they've been in contact.
  jostleGap(q, o) {
    if (!JOSTLE.on) return 0;
    const J = this.jostle, C = JOSTLE;
    // the jostle that ran (from the corner's setup, or since the cross was struck) counts in full; anyone else who
    // gets to it - the zonal man, the near-post man, often the one who really contests it - is read on the spot:
    // the same sums, as instT seconds of it
    const ran = J && J.a === q && J.d === o && J.contact >= 0.15 ? J.J : 0;
    const b = this.ball; if (o.keeper || len(o.x - q.x, o.y - q.y) > C.readR) return ran * C.toT;
    const k = b.jRead || (b.jRead = { spT: b.spT, m: new Map() }); if (k.spT !== b.spT) { k.spT = b.spT; k.m.clear(); }
    if (k.m.has(o)) return (ran + k.m.get(o)) * C.toT;
    const P = this.path, land = (P && P.find(pt => pt.z <= 2.4 && pt.t > 0.05)) || { x: q.x, y: q.y };
    const da = len(q.x - land.x, q.y - land.y), dd = len(o.x - land.x, o.y - land.y), gx = q.team.goalX;
    const goalSide = Math.abs(o.x - gx) < Math.abs(q.x - gx) - 0.2 && Math.abs(o.y - q.y) < 1.6;
    const pw = p => (this.isHuman(p) && !this.demo && this.inpOf(p.team).held('sprint') ? C.pushHold : 1 + C.cpuLvl * ((this.dk(p.team).mash || 1) - 1) * 4) * (0.8 + 0.4 * (p.stamina ?? 1));
    const J0 = (clamp(dd - da, -2, 2) * C.posK + (pw(q) - pw(o)) * C.push - (goalSide ? C.goalSide : 0) + rnd(-1, 1) * C.noise) * C.instT;
    k.m.set(o, J0); return (ran + J0) * C.toT;
  },
  // decided (recvVerdict): too much pushing draws the whistle - a striker's shove gives them a free kick; a defender's
  // hold in his own box, a penalty (rarely: refs give fewer). Returns true when play stopped.
  jostleFoul(kind) {
    const J = this.jostle; if (!J || J.contact < 0.15 || window.__labNoJFoul) return false;
    const C = JOSTLE, overA = J.fa - J.fd * 0.5 - C.foul, overD = J.fd - J.fa * 0.5 - C.foul;
    const d = J.d, inBox = Math.abs(J.a.x - d.team.ownGoalX) < 16.5 && Math.abs(J.a.y - 34) < 20.16;
    let by = null, victim = null;
    if (overA > 0 && kind !== 'lost' && Math.random() < overA * C.foulP) { by = J.a; victim = d; }   // he shoved his way in: their free kick
    else if (overD > 0 && kind !== 'clean' && Math.random() < overD * C.foulP * (inBox ? C.penK : 1)) { by = d; victim = J.a; }   // he dragged him back
    if (!by) return false;
    this.jostleFouls = (this.jostleFouls || 0) + 1; this.jostleEnd();
    this.say('', by === victim ? '' : by.team === this.ball.last ? 'PUSHING!' : 'HOLDING!', 1.0);
    this.foul(by, victim, false); return !!(this.foulScene || this.dead || this.setPiece);
  },
});
