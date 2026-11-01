'use strict';
// HC2 Football · street.js: STREET 5s, part 1 (t-003) - the rules, the walls and 5 v 5 play, on today's art.
// The co-designer's pitch, OK'd by Luca 23 Oct 23:51 ("Start STREET 5s mode?"): 5 v 5, small goals, no keepers, a
// basketball-court-size court (~28 x 15 m) by the beach, the ball plays off the walls all round - no throw-ins, corners
// or goal kicks - and quick restarts after goals. Part 2 (the court art, PixelLab + Aseprite) is the co-designer's
// Stadiums & maps lane; part 3 is the menus, Rami's lines and polish.
//
// How real football and other games do it:
//  * Real 5-a-side (Powerleague / Goals-style cages, the FA's small-sided rules): a 12 x 4 ft goal (3.66 x 1.22 m), the
//    ball stays in play off the boards and the fence, kick-off straight after a goal, no offside, free kicks for
//    fouls with the wall back ~5 m. Futsal is the indoor cousin (no walls, kick-ins), so the walls are the cage game's.
//  * Street football games (FIFA Street, the VOLTA mode of EA FC, Rocket League's arena walls as the extreme): the wall
//    is a team-mate - a one-two off the boards, the rebound read early, the pitch small enough that everyone is always
//    near the ball. Short halves, no walk-out, no coin-toss ceremony, no half-time subs.
//  * Sensible Soccer's lesson for small pitches: the camera stays on the play, the shape stays simple (2-1-2 here) and
//    the press is one man with a cover.
//
// How it's built: the court is the middle 28 x 15 m of today's pitch (the art is pre-projected, so the court has to sit on
// it). setStreet() swaps the pitch length (PITCH_L = 28: x runs 0..28 and wx() centres it on the big pitch's centre spot),
// the court's sides across (COURT_Y0 / _Y1, 26.5 .. 41.5 around the same y = 34 centre every rule already uses), the
// goal (half-size: the existing goal art at 0.5 scale is exactly a 5-a-side goal) and the halves, and squeezes the
// team AI's frame onto the court (FRAME_K: its 105 m numbers - lines, bands, runs - land on 28 m). setStreet(false) puts
// every number back, so 11 v 11 plays exactly as before (proved with the same seeded matches, see the PR).
// Each team still builds 11 men (shirt slots are read all over the code: 9 is the striker, 0 the keeper): the five who
// play are STREET.slots, the other six sit out as if sent off - hidden, off the pitch, skipped by every loop already.

const STREET = {
  L: 28, W: 15,              // the court (m): along, across
  goalHW: 1.83, bar: 1.22,   // a 5-a-side goal: 3.66 x 1.22 m (12 x 4 ft)
  art: 0.5,                  // the goal art's scale (today's 7.32 x 2.44 m goal at half size = that goal)
  slots: [2, 3, 6, 9, 10],   // the five who play: two at the back, one in the middle, two up (2-1-2, no keeper)
  half: 150,                 // real seconds a half (11 v 11: 180)
  edge: 0.35,                // a man stays this far inside the walls (m)
  // the walls (boards + fence all round, as high as play needs): e of the speed into it comes back, tang of the speed
  // along it is kept, a low ball hit hard into the boards jumps a little (pop x the speed into it, up to popMax m/s)
  wall: { r: 0.11, e: 0.62, tang: 0.86, pop: 0.06, popZ: 0.35, popMin: 7, popMax: 2.2 },
  wallPass: { clear: 1.3, ahead: 1, far: 16, near: 4.5, pace: 1.25, try: 0.6 },   // the computer's wall pass (streetWallPass): lanes clear by m, team-mate ahead / within m, him within m of the wall, aim past the mirror point, how often when pressed
  guard: { from: 40, off: 1.2, k: 0.22, max: 4.5, hold: 7 },  // the last man (streetGuard): on the job while it's theirs within m of our goal; off the line: k x the ball's distance, off .. max m; with the ball ours he stays within hold m of our goal
  shotSpread: 0.26,          // a shot also goes up to this x its distance off line (m per m: 10 m out = up to 2.6 m) - no keeper, so the small goal is the test
  shotFar: [5, 14],          // the computer's read of a shot (shotLook) fades from full at 5 m out to a fifth at 14 m (it can't miss the keeper - it can miss the goal)
  fkWall: 5,                 // a free kick's wall stands this far back (m; 11 v 11: 9.15)
};
const STREET_BASE = { L: PITCH_L, y0: GOAL_Y0, y1: GOAL_Y1, bar: BAR_Z, half: HALF_REAL_SECONDS, netD: GP.netD, netBZ: GP.netBZ };

// the 2-1-2 on the court (roles.js SHAPE rows: role, kick-off [x, y] for a team attacking towards x = 28, across without /
// with the ball, deeper / higher than the line's band without / with it - those two in the AI's 105 m frame). Rows for
// the slots who sit out are placeholders: nobody stands on them.
const STREET_OFF = ['CM', [2, 34], 0, 0];
SHAPES.street = SHAPE([STREET_OFF, STREET_OFF, ['CB', [3.5, 31.2], -2.6, -4.6], ['CB', [3.5, 36.8], 2.6, 4.6], STREET_OFF, STREET_OFF,
  ['CM', [8.5, 34], 0, 0, 0, 2], STREET_OFF, STREET_OFF, ['CF', [12.5, 32], -2.2, -4.8], ['CF', [12.5, 36], 2.2, 4.8]]);

// switch the court on / off: every number the rules, the ball and the AI read
function setStreet(on) {
  on = !!on; if (on === STREET_ON) return;
  const S = STREET, B = STREET_BASE; STREET_ON = on;
  PITCH_L = on ? S.L : B.L;
  COURT_Y0 = on ? 34 - S.W / 2 : 0; COURT_Y1 = on ? 34 + S.W / 2 : PITCH_W;
  GOAL_Y0 = on ? 34 - S.goalHW : B.y0; GOAL_Y1 = on ? 34 + S.goalHW : B.y1; BAR_Z = on ? S.bar : B.bar;
  FRAME_K = on ? 52.5 / (S.L / 2) : 1; GOAL_K = on ? S.goalHW / 3.66 : 1;
  HALF_REAL_SECONDS = on ? S.half : B.half;
  GP.netD = on ? B.netD * S.art : B.netD; GP.netBZ = on ? B.netBZ * S.art : B.netBZ;   // the half-size net is half as deep and high
  if (on) { STREET.noOff = window.HC2_NO_OFFSIDE; window.HC2_NO_OFFSIDE = true; }   // no offside on the court
  else window.HC2_NO_OFFSIDE = STREET.noOff;
  const m = window.__hc2; if (m && m.streetArt) m.streetArt();
}

// the walls: a loose ball past a side or an end (but into the goal mouth under the bar, where the goal / post / net code
// decides) is put back inside and comes back off it. No dice, so the AI's predicted path (predict) reads the same rebound.
// Returns the wall it hit ('S' a side, 'E' an end) or null. Pure on b: predict() runs it on a copy.
function streetWall(b) {
  const A = STREET.wall, r = A.r, y0 = COURT_Y0 + r, y1 = COURT_Y1 - r; let hit = null;
  const back = vn => {                                                           // (vn: speed into the wall, > 0)
    if (b.z < A.popZ && vn > A.popMin) { b.vz = Math.max(b.vz, Math.min(A.popMax, A.pop * vn)); b.skid = true; }
    return vn * A.e;
  };
  const mouth = y => y > GOAL_Y0 && y < GOAL_Y1 && b.z < BAR_Z;
  // the ends first: a ball behind the line inside the goal's width and under the bar is the net's
  if (b.x < r && b.vx < 0 && !(b.x < 0.3 && mouth(b.y))) { b.x = Math.max(2 * r - b.x, r); b.vx = back(-b.vx); b.vy *= A.tang; hit = 'E'; }
  else if (b.x > PITCH_L - r && b.vx > 0 && !(b.x > PITCH_L - 0.3 && mouth(b.y))) { b.x = Math.min(2 * (PITCH_L - r) - b.x, PITCH_L - r); b.vx = -back(b.vx); b.vy *= A.tang; hit = 'E'; }
  const inGoal = b.x < 0 || b.x > PITCH_L;                                       // (inside the goal: the side netting holds it, not the court's sides)
  if (!inGoal && b.y < y0 && b.vy < 0) { b.y = Math.max(2 * y0 - b.y, y0); b.vy = back(-b.vy); b.vx *= A.tang; hit = hit || 'S'; }
  else if (!inGoal && b.y > y1 && b.vy > 0) { b.y = Math.min(2 * y1 - b.y, y1); b.vy = -back(b.vy); b.vx *= A.tang; hit = hit || 'S'; }
  if (hit) b.rollV = 0.8 * Math.hypot(b.vx, b.vy);
  return hit;
}

hc2Mix(Match, {
  // what a hit on the wall means for play: a new loose ball (no pass target, no landing ring, a special is spent), the
  // thud of the boards (the pass sound - existing effects only) and a count for the soak's summary
  streetRebound(b, hit) {
    const N = this.stN = this.stN || { walls: 0, wallPass: 0 }; N.walls++;
    if (b.wp && b.wp.by === b.lastP) { b.wp.hit = this.time.now; N.wallPass++; }   // a wall pass on purpose (streetWallPass) came off as planned
    Object.assign(b, { target: b.wp && b.wp.to && !b.wp.to.sentOff ? b.wp.to : null, ring: null, lob: false, aimLob: false, tried: null, crossBy: null, save: null, saveable: null, special: 0, pierce: 0, chip: false, tap: false, duelTry: false });
    b.wp = null;
    if (Math.hypot(b.vx, b.vy) > 5) SFX.pass();
  },
  // THE WALL PASS for the computer (the brief: "give the AI a simple 'play it off the wall' option"; FIFA Street / the
  // cage game's one-two off the boards): pressed, near a side wall, with a team-mate ahead whose straight lane is shut, he
  // plays it into the wall so it comes off to him - the mirror image of the team-mate across the wall is the aim, so the
  // angle in is the angle out. Both legs must be clear of their men. Returns true if he played it.
  streetWallPass(p) {
    const team = p.team, side = team.side, b = this.ball, A = STREET.wallPass;
    const opp = team.opp.players.filter(o => !o.sentOff), lane = (x0, y0, x1, y1) => opp.every(o => {
      const dx = x1 - x0, dy = y1 - y0, L2 = dx * dx + dy * dy || 1, t = clamp(((o.x - x0) * dx + (o.y - y0) * dy) / L2, 0, 1);
      return len(o.x - (x0 + dx * t), o.y - (y0 + dy * t)) > A.clear; });
    let best = null;
    for (const q of team.players) {
      if (q === p || q.sentOff || q.stun > 0) continue;
      const ahead = (q.x - p.x) * side; if (ahead < A.ahead || len(q.x - p.x, q.y - p.y) > A.far) continue;
      if (lane(p.x, p.y, q.x, q.y)) continue;                                     // the straight pass is on: no need
      for (const Yw of [COURT_Y0 + STREET.wall.r, COURT_Y1 - STREET.wall.r]) {
        if (Math.abs(p.y - Yw) > A.near) continue;
        const my = 2 * Yw - q.y, t = (Yw - p.y) / (my - p.y); if (!(t > 0.1 && t < 0.9)) continue;
        const hx = p.x + (q.x - p.x) * t;                                          // where it meets the wall
        if (!lane(p.x, p.y, hx, Yw) || !lane(hx, Yw, q.x, q.y)) continue;
        const sc = ahead - Math.abs(hx - p.x) * 0.1; if (!best || sc > best.sc) best = { q, x: q.x, y: my, sc };
      }
    }
    if (!best) return false;
    const k = A.pace;                                                               // (a touch firmer: the wall takes some pace off)
    this.kick(p, p.x + (best.x - p.x) * k, p.y + (best.y - p.y) * k, 0, 0, 0.12, { mode: 'ground' });
    b.wp = { by: p, to: best.q, t: this.time.now };
    return true;
  },
  // THE LAST MAN (no keepers, no hands - the cage game's answer and Sensible Soccer's on a small pitch): when they have
  // it in our half, our deepest back man who isn't the one pressing drops onto the line between the ball and the middle of
  // our goal, a step off the line, and holds it there - so a shot has to beat a body, not an empty goal. He still plays
  // any ball that comes to him (pickups), and he's off the job as soon as we win it.
  streetGuard(team, dt, was) {
    const b = this.ball, o = b.owner, G = STREET.guard, gx = team.ownGoalX, s = team.side;
    const they = o ? o.team !== team : b.last && b.last !== team && !b.target;
    // one man has the job for good (a team that keeps changing its last man leaves the goal empty in the change): the
    // deeper back man when it's first needed; another only if he's sent off or is the man you're playing as
    let p = team.stG; if (!p || p.sentOff || this.isHuman(p)) p = team.stG = team.players.filter(q => !q.sentOff && isBack(q) && !this.isHuman(q)).sort((u, v) => Math.abs(u.x - gx) - Math.abs(v.x - gx))[0] || null;
    team.stGuard = null; if (!p || p === o || p.busy() || p.stun > 0 || b.target === p) return;
    const dx = b.x - gx, dy = b.y - 34, d = len(dx, dy) || 1;
    if (!(they && d < G.from)) {                                                     // ours: he stays the last man, never past G.hold m out
      if (Math.abs(p.x - gx) <= G.hold && (they || !(o && o.team === team))) return;
      if (!(o && o.team === team) && len(b.x - p.x, b.y - p.y) < 6) return;     // (a loose ball by him: he goes for it, as anyone would)
      const tx = gx + s * Math.min(G.hold, Math.abs(p.x - gx)), ty = clamp(34 + dy * 0.3, COURT_Y0 + 2, COURT_Y1 - 2), far = len(tx - p.x, ty - p.y);
      team.stGuard = p; if (was && was.p === p) { p.vx = was.vx; p.vy = was.vy; } if (far > 0.4) p.moveTo(tx, ty, Math.min(p.top(false, false), AI.ARRIVE * far + 0.3), dt); return;
    }
    if (team.presser === p && len(b.x - p.x, b.y - p.y) < 2.5) return;           // (he's the one on him already: he stays on him)
    const o2 = clamp(d * G.k, G.off, G.max);                                        // (further out the further the ball: a sweeper-keeper)
    const tx = gx + dx / d * o2, ty = clamp(34 + dy / d * o2, GOAL_Y0 - 0.4, GOAL_Y1 + 0.4);
    team.stGuard = p; const far = len(tx - p.x, ty - p.y); if (was && was.p === p) { p.vx = was.vx; p.vy = was.vy; }
    p.sprinting = far > 2 && p.stamina > 0.15; p.moveTo(tx, ty, Math.min(p.top(p.sprinting, false), AI.ARRIVE * far + 0.3), dt);
    if (far < 0.5) p.look(b.x - p.x, b.y - p.y);
  },
  // the goals and the corner flags onto the court (or back): the same art, moved to the court's goal lines and scaled
  streetArt() {
    const G = this.goalArt, on = STREET_ON, k = on ? STREET.art : 1;
    if (G) for (const side of ['L', 'R']) {
      const gx = side === 'L' ? 0 : PITCH_L, X = wx(gx, 34), Y = wy(34);           // the goal line's middle, on the ground, now
      for (const g of G[side]) { const oy = Y + (g.oy - g.Y0) * k; g.img.setScale(k).setPosition(X + (g.ox - g.X0) * k, oy).setDepth(on && g.sort != null ? oy + g.sort * k : g.depth); }   // (shadow + back net: under everyone, as before)
      const n = this.nets && this.nets[side];
      if (n) { n.x = X + (G[side][0].ox - G[side][0].X0) * k;
        for (const o of n.meshes || []) o.mesh.setVisible(false); n.meshOn = false;
        for (const c of n.cells || []) c.img.setVisible(false); n.cellsOn = false;
        for (const im of n.imgs) { im.setVisible(true); im.x = n.x; } }
    }
    if (this.flags && this.flagBase) this.flags.forEach((f, i) => {
      const B = this.flagBase[i]; if (!on) return f.setPosition(B.x, B.y).setDepth(B.d);
      const P = [[0, COURT_Y0], [PITCH_L, COURT_Y0], [0, COURT_Y1], [PITCH_L, COURT_Y1]][B.i], X = wx(P[0], P[1]), Y = wy(P[1]);
      f.setPosition(X, Y).setDepth(Y);
    });
  },
  // the five who play; the other six sit out (hidden, off the pitch: the loops skip a man who is sentOff)
  streetBench() {
    for (const t of [this.home, this.away]) {
      applyFormation(t, 'street'); t.cfKinds = null;
      for (const p of t.players) {
        if (STREET.slots.includes(p.i)) continue;
        Object.assign(p, { sentOff: true, streetOff: true, hide: true, state: 'idle', vx: 0, vy: 0, x: -60, y: -60, stun: 1e9, cool: 1e9, hands: false });
        p.spr.setVisible(false);
      }
    }
    this.human = this.home.players[9];
  },
  // the STREET 5s button: you v the computer at the chosen level (watch: the computer plays both sides). No team sheet,
  // walk-out or coin toss - the home side kicks off and it's on.
  streetStart(h, a, watch, done) {
    setStreet(true);
    this.setTeams(h, a, () => {
      if (done) done();
      this.mset = Object.assign(this.loadRules ? this.loadRules() : {}, { ending: 'none' });
      if (watch) { this.watchStart(); this.say('STREET 5s', `${this.home.name} v ${this.away.name} · WATCH MODE`, 2.4); return; }
      this.kickoff(this.home); this.say('STREET 5s', `${this.home.name} v ${this.away.name} · OFF THE WALLS, NO KEEPERS`, 2.4);
    });
  },
});

// the hooks: a team built on the court plays five; a half ends straight into the next (no walk off, no subs card); a goal
// is celebrated and then it's straight back to the kick-off (no replay)
{
  const P = Match.prototype, _build = P.buildTeams, _half = P.halfTime, _goalQ = P.goalQTick, _goals = P.buildGoals, _pre = P.preMatch, _resOk = P.resumeOk, _car = P.carrierAI2, _ai = P.ai, _shape = P.spShape, _look = P.shotLook, _free = P.aiFree, _rules = P.rules, _restart = P.restart, _tap = P.aiTap, _tapAt = P.aiTapAt;
  hc2Mix(Match, {
    carrierAI2(p, dt) {                                                       // the computer on the ball: the wall pass first, when it's on
      if (STREET_ON && (p.think || 0) - dt <= 0 && !this.isHuman(p) && !p.busy()) {
        const pr = p.team.opp.players.some(o => !o.sentOff && len(o.x - p.x, o.y - p.y) < 3.2 && (o.x - p.x) * p.team.side > -1);
        if (pr && Math.random() < STREET.wallPass.try && this.streetWallPass(p)) { p.think = rnd(0.25, 0.45); return; }
      }
      return _car.call(this, p, dt);
    },
    shotLook(team, x, y) {
      const r = _look.call(this, team, x, y); if (!STREET_ON) return r;
      const F = STREET.shotFar, d = len(team.goalX - x, 34 - y); r.q *= clamp(1 - 0.8 * (d - F[0]) / (F[1] - F[0]), 0.2, 1); return r;
    },
    aiFree(p) { if (STREET_ON && p.team.stG === p && p.team.stGuard === p && !p.team.inPoss) return false; return _free.call(this, p); },   // (the last man isn't sent to press or mark)
    ai(dt) {
      if (!STREET_ON) return _ai.call(this, dt);
      const G = [this.home.stG, this.away.stG].map(p => p && { p, vx: p.vx, vy: p.vy });   // (the last man's own run replaces the zone run the AI just gave him)
      _ai.call(this, dt);
      for (const t of [this.home, this.away]) { const g = G.find(q => q && q.p === t.stG); this.streetGuard(t, dt, g); }
    },
    // a free kick on the court (the only set piece STREET 5s has): everyone eases towards the ball from his spot, the
    // defenders 5 m off it (the small-sided distance, not Law 13's 9.15), and near their goal two of them make a wall on
    // the line to the goal while the last man keeps the goal (streetGuard's spot) - all inside the walls
    spShape(kind, team, taker, x, y, opts) {
      if (!STREET_ON) return _shape.call(this, kind, team, taker, x, y, opts);
      const opp = team.opp, spots = new Map(), must = [], R = STREET.fkWall, gx = team.goalX;
      for (const tm of [team, opp]) for (const p of tm.players) { if (p.sentOff || p === taker) continue;
        spots.set(p, { x: p.home.x + (x - PITCH_L / 2) * 0.6 + (tm === team ? 2 : -1) * tm.side, y: p.home.y + (y - 34) * 0.4 }); }
      const dGoal = len(gx - x, 34 - y);
      if (dGoal < 15) {
        const ux = (gx - x) / dGoal, uy = (34 - y) / dGoal, D = opp.players.filter(p => !p.sentOff).sort((u, v) => Math.abs(u.x - gx) - Math.abs(v.x - gx));
        const keep = D[0], wall = D.slice(1, 3);
        if (keep) { spots.set(keep, { x: gx - team.side * STREET.guard.off, y: clamp(34 + (y - 34) * 0.15, GOAL_Y0 + 0.2, GOAL_Y1 - 0.2) }); must.push(keep); }
        wall.forEach((p, k) => { const o = (k - 0.5) * 0.75; spots.set(p, { x: x + ux * R - uy * o, y: y + uy * R + ux * o }); must.push(p); });
      }
      for (const p of opp.players) { const q = spots.get(p); if (!q) continue; const d = len(q.x - x, q.y - y); if (d < R) { q.x = x + (q.x - x) / (d || 1) * R; q.y = y + (q.y - y) / (d || 1) * R; } if (len(p.x - x, p.y - y) < R + 1) must.push(p); }
      const E = STREET.edge + 0.2; for (const q of spots.values()) { q.x = clamp(q.x, E, PITCH_L - E); q.y = clamp(q.y, COURT_Y0 + E, COURT_Y1 - E); }
      return { spots, must };
    },
    // the court never sends it out: a loose ball that got past a wall in one step (off the side netting, out of the
    // goal's mouth sideways) is put back on the court's side of it, moving away from it - and a restart the big pitch would
    // give (a goal kick, a corner, a throw-in) is a free kick on the court (belt and braces: neither should come up)
    rules() {
      if (STREET_ON) { const b = this.ball, E = STREET.wall.r;
        if (!b.inNet && !b.owner && !this.dead) {
          const mouth = b.y > GOAL_Y0 && b.y < GOAL_Y1 && b.z < BAR_Z;
          if ((b.x < 0 || b.x > PITCH_L) && !mouth) { const L = b.x < 0; b.x = L ? E : PITCH_L - E; b.vx = (L ? 1 : -1) * Math.abs(b.vx) * STREET.wall.e; }
          if (b.y < COURT_Y0 || b.y > COURT_Y1) { const T = b.y < COURT_Y0; b.y = T ? COURT_Y0 + E : COURT_Y1 - E; b.vy = (T ? 1 : -1) * Math.abs(b.vy) * STREET.wall.e; }
        }
      }
      return _rules.call(this);
    },
    restart(kind, team, x, y, note, opts = {}) {
      if (STREET_ON && (kind === 'GOAL KICK' || kind === 'CORNER' || kind === 'THROW-IN')) { kind = 'FREE KICK'; const E = STREET.edge + 0.6; x = clamp(x, E + 1.5, PITCH_L - E - 1.5); y = clamp(y, COURT_Y0 + E, COURT_Y1 - E); }
      return _restart.call(this, kind, team, x, y, note, opts);
    },
    aiTap(p) { return STREET_ON ? false : _tap.call(this, p); },                 // (the tap-in is for walking it round a keeper: with no keeper it's a pass into an empty net)
    aiTapAt(p) { return STREET_ON ? null : _tapAt.call(this, p); },
    buildTeams(...a) { _build.apply(this, a); if (STREET_ON) this.streetBench(); },
    halfTime() {
      if (!STREET_ON) return _half.call(this);
      SFX.whistle(2, true); this.say('HALF TIME', `${this.home.name} ${this.home.score} - ${this.away.score} ${this.away.name} · CHANGE ENDS`, 2.2);
      Object.assign(this.ball, { owner: null, vx: 0, vy: 0, vz: 0, target: null, save: null, shotBy: null });
      this.setPiece = null; this.pending = null; this.dead = null; for (const S of this.hSlots()) S.charge = -1;
      for (const p of this.all) { if (p.sentOff) continue; if (p.busy()) p.setState('idle', 0); p.hands = false; p.stun = 0; }
      this.secondHalf(true);
    },
    goalQTick() {
      const q = this.goalQ; if (!STREET_ON || !q) return _goalQ.call(this);
      if (this.replay || this.paused) return;
      this.goalQ = null; if (q.ep === this.epoch) q.after();
    },
    preMatch() { if (STREET_ON) return; return _pre.call(this); },          // (AGAIN at full time: straight into the next one)
    resumeOk() { return !STREET_ON && _resOk.call(this); },                 // (CONTINUE brings back 11 v 11 matches only, for now)
    buildGoals() {
      _goals.call(this);
      // remember where the art sits on the big pitch (relative to each goal line's middle), so streetArt can move it
      const G = this.goalArt = { L: [], R: [] }, all = this.children.list;
      for (const side of ['L', 'R']) {
        const X0 = wx(side === 'L' ? 0 : PITCH_L, 34), Y0 = wy(34), a = side === 'L' ? MAN.goals.left : MAN.goals.right;
        for (const im of all) { const f = im.frame && im.frame.name; if (!f || !f.startsWith(`goal-${side}-`)) continue;
          const part = f.slice(7), sort = part === 'frame_far' ? a.sort_far_post_y : part === 'net_near' ? a.sort_near_post_y : part === 'post_near' ? a.sort_near_post_y + 1 : null;
          G[side].push({ img: im, ox: im.x, oy: im.y, X0, Y0, depth: im.depth, sort }); }
      }
      const tag = { far_left: 0, far_right: 1, near_left: 2, near_right: 3 };
      this.flagBase = Object.keys(MAN.flags.corners_on_pitch_image).map((k, i) => ({ i: tag[k] ?? i, x: this.flags[i].x, y: this.flags[i].y, d: this.flags[i].depth }));
      if (STREET_ON) this.streetArt();
    },
  });
}
