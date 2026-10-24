'use strict';
// HC2 Football · keeper.js: keeper AI: positioning plan, saves, dives, claims, distribution
// (split out of game.js in v0.9.5 - load order and lanes: src/README.md)

// keeper dive animation: PixelLab dives are made facing the pitch (E for the left goal, W for the right one),
// named by where he goes on screen; the v0.1 South-facing dives are the fallback
function diveAnimFor(k, down) {
  const A = MAN.kits[k.kit].anims, f = down ? 'diveDown-S' : 'diveUp-N';       // dives drawn towards / away from the camera
  if (A[f]) return f;
  const n = `dive${down ? 'Down' : 'Up'}-${k.team.side > 0 ? 'E' : 'W'}`;
  if (A[n]) return n;
  const o = (k.team.side > 0) === down ? 'diveR-S' : 'diveL-S'; return A[o] ? o : 'idle-S';
}

// ---------------------------------------------------------------- Match methods: keeper
hc2Mix(Match, {
  // a shot: the keeper reads it - a reaction delay and a small misread that grow with the pace - then really moves.
  // No dice: whether he saves it is decided when the ball meets (or misses) his body and gloves (pickups).
  planSave(gk) {
    const b = this.ball, c = { ...b }, h = 1 / 120, px = gk.x;
    let t = 0; while (t < 2.5) { const ox = c.x; ballStep(c, h, false); t += h; if ((ox - px) * (c.x - px) <= 0) break; }
    const sp = len(b.vx, b.vy, b.vz);
    const KK = this.dk(gk.team); let react = rnd(0.12, 0.2) + sp / 400 + KK.gkReact, y = c.y + rnd(-1, 1) * (0.1 + sp / 100) * KK.gkRead;   // (v0.9.2: the keeper's read by level)
    if (b.special) { react += 0.05 + b.special * 0.06; y += rnd(-1, 1) * b.special * 0.45; }   // v0.7: a special is hard to read
    if (this.penaltyKick) {                                                    // old in-match penalty (no camera): he guesses a side
      this.penaltyKick = false; const guess = [-1, 0, 1][Math.floor(Math.random() * 3)]; y = 34 + guess * 2.6; react = 0;
    }
    const g = { ...c }, gx = gk.team.ownGoalX;                                  // off target is judged at the goal line (a dipping shot)
    for (let u = 0; u < 1.5 && (g.x - gx) * gk.team.side > 0; u += h) ballStep(g, h, false);
    const off = g.y < GOAL_Y0 - 0.3 || g.y > GOAL_Y1 + 0.3 || g.z > BAR_Z + 0.25;
    b.save = { gk, y, z: c.z, t: t + 0.6, t0: t, react, act: null, off, dy: Math.abs(c.y - gk.y), cover: this.keeperCover(t - react, c.z), sp };
    if (!off) this.gkCount(gk.team.opp, 'onT');
  },
  // t-007: match counts for the soak (tools/soak.js: shots on target, saves held v parried) - counting only, no dice
  gkCount(team, key) { if (!team || !this.stat) return; const S = this.stat(team); S[key] = (S[key] || 0) + 1; },
  // how far sideways he can get his hands in time T (seconds after he reacts), for a ball at height z
  keeperCover(T, z) { return Math.min(GK_DIVE_V * Math.max(0, T - 0.05), 3.0) + GK_REACH - Math.max(0, z - 1.7) * 0.6; },
  // t-005 (lob step 1, docs/lob-chip.md: "the keeper reads a lob instantly"): how long he needs to read a lob, by level -
  // 0.35 s (Easy) / 0.25 (Normal) / 0.19 (Hard) / 0.15 (Rise), from his gkReact like his read of a shot
  gkRead(k) { const r = this.dk(k.team).gkReact; return clamp(0.25 + r * (r > 0 ? 2.2 : 1.1), 0.15, 0.35); },
  // ...and their open-play lob (b.lob) he hasn't read yet: he doesn't go for it by any route (back, claim, sweep) until he has
  gkUnread(k) { const b = this.ball; return !!b.lob && !b.owner && b.last !== k.team && (b.airT || 0) < this.gkRead(k); },
  keeperOutlet(k) {                                                               // the freest team-mate for a throw / roll-out
    let best = null;
    for (const q of k.team.players.slice(1)) {
      if (q.sentOff) continue;
      const d = len(q.x - k.x, q.y - k.y); if (d < 6 || d > 45) continue;
      const free = Math.min(...k.team.opp.players.filter(o => !o.sentOff).map(o => len(o.x - q.x, o.y - q.y)));
      const sc = Math.min(free, 10) - d / 12 + rnd(0, 1.5);
      if (!best || sc > best.sc) best = { q, d, sc };
    }
    if (!best) return { dir: { x: k.team.side, y: 0 }, mode: 'lob' };
    const dx = best.q.x - k.x, dy = best.q.y - k.y, l = len(dx, dy);
    return { dir: { x: dx / l, y: dy / l }, mode: best.d > 22 ? 'lob' : 'ground' };
  },
  // ======================================================================= v0.9.1 KEEPER AI (Luca 23 Oct 14:56: "move gk ai dev to
  // top priority we need to test it + include walking up etc when needed"). Built on goalkeeping coaching:
  //  - ANGLE: on the line that halves the angle between the ball and the two posts (the bisector), deeper as the ball
  //    comes closer (6 m away ~2 m off his line, 25-30 m away ~5 m) - keeperstop.com "how far off the line".
  //  - SWEEPER: with the ball far away he walks up to the top of his box and beyond, ~18 m behind his last defender -
  //    FIFA's World Cup 2022 analysis: keepers averaged 13 m off their line and 20 m behind the defensive line, higher
  //    when their team has the ball in the final third.
  //  - SWEEP: a ball played into the space behind his defence that he reaches first: he comes for it (feet outside the box).
  //  - 1v1 (RUSH): an attacker through on goal with nobody goal-side: he comes out on the ball line, then within ~3.5 m
  //    he stops and sets low to block; a heavy touch he can reach first, he smothers - FIFA session "defending the goal
  //    or the space" (within ~3 m drop low and smother; a good touch = hold your position).
  //  - SET: a shot is coming (an attacker on the ball within ~25 m): small steps, then still in his ready stance.
  //  - BACK: a lob / ball over his head while he's up: he runs back to his line.
  // He walks when nothing is on, jogs to get back into place, runs only when it's urgent. k.gkMode / k.gkTgt = what he is
  // doing (the Lab draws it).
  keeperAI(k, dt) {
    const b = this.ball, side = k.team.side, gx = k.team.ownGoalX, lineX = gx + side * 1.3;
    k.gkSet = false;
    if (b.owner === k) {
      k.gkMode = 'BALL'; k.gkTgt = null;
      if (!k.hands) {                                                          // ball at his feet: pass it out quickly - or clear it under pressure
        k.steer(0, 0, dt); k.hold = (k.hold || 0) + dt;
        if (k.hold > 0.6) { k.hold = 0;
          const press = k.team.opp.players.some(o => !o.sentOff && len(o.x - k.x, o.y - k.y) < 7);
          if (press) this.doPass(k, { x: side, y: clamp((k.y - 34) / 20, -0.7, 0.7) }, 'lob');
          else { const o = this.keeperOutlet(k); this.doPass(k, o.dir, o.mode === 'lob' && o.dir ? 'lob' : 'ground'); } }
        return;
      }
      k.hold = (k.hold || 0) + dt; k.steer(0, 0, dt);
      if (k.hold > 1.1) { k.hold = 0; const o = this.keeperOutlet(k); this.doPass(k, o.dir, o.mode); }
      return;
    }
    const sv = !b.owner && b.save && b.save.gk === k && len(b.vx, b.vy) > 3.5 && b.vx * -side > 0 ? b.save : null;   // (v0.9.1: a shot that's died or been knocked away isn't one any more - he goes for the loose ball)
    if (sv) {                                                                   // a shot at him: set, step across or dive
      k.gkMode = 'SHOT'; k.gkTgt = { x: k.x, y: sv.y };
      const age = sv.t0 + 0.6 - sv.t, left = sv.t0 - age, dy = sv.y - k.y;
      if (age < sv.react) { k.steer(0, 0, dt); return; }                       // he plants his feet while he reads it
      if (!sv.act) {
        if (sv.off && Math.abs(dy) > 0.8) sv.act = 'leave';
        else if (Math.abs(dy) < 0.45) sv.act = 'set';
        else if (Math.abs(dy) < 1.3 && left > 0.4) sv.act = 'step';
        else {
          sv.act = 'dive';
          // fly so the ball meets his hands (0.4 m past his centre) as it arrives; the air slows him a little
          const fly = clamp(left, 0.2, 0.5), v = Math.min(GK_DIVE_V, Math.max(0, Math.abs(dy) - 0.4) / (fly * (1 - 0.2 * fly)));
          k.setState('dive', 0.85); k.diveLen = 0.85; k.diveFly = fly + 0.08; k.diveDir = Math.sign(dy); k.diveZ = clamp(sv.z, 0.2, 2.1);
          k.vx = 0; k.vy = k.diveDir * v; k.diveAnim = diveAnimFor(k, dy > 0);
          return;
        }
      }
      if (sv.act === 'leave') { k.steer(0, 0, dt); return; }
      k.moveTo(k.x, sv.y, 6.5, dt); return;
    }
    if (!b.owner && this.path && (b.z > 0.6 || b.vz > 2) && !(b.save && b.save.gk === k)) {     // a cross into his area: come and claim it
      // he reads the flight first (no instant rush), and outside his six-yard box he only comes if he clearly beats the attackers
      if (((b.airT || 0) > 0.22 && !this.gkUnread(k)) || k.claiming) {           // (t-005: a lob waits for his read by level)
        const pt = this.path.find(q => q.z < 2.5 && q.z > 0.3 && Math.abs(q.x - gx) < 7.5 && Math.abs(q.y - 34) < 10);
        const mine = pt && 0.15 + len(pt.x - k.x, pt.y - k.y) / 6.5 <= pt.t + 0.25;
        const six = pt && pt.z > 1.0 && Math.abs(pt.x - gx) < 5.5 && Math.abs(pt.y - 34) < 9.2;      // in the air in his six-yard box: his ball
        const beaten = pt && !six && k.team.opp.players.some(o => !o.keeper && !o.sentOff && 0.12 + len(pt.x - o.x, pt.y - o.y) / 7 < 0.15 + len(pt.x - k.x, pt.y - k.y) / 6.5 + 0.1);
        if (mine && (six || !beaten || k.claiming)) { k.claiming = true; k.gkMode = 'CLAIM'; k.gkTgt = { x: pt.x, y: pt.y }; k.moveTo(pt.x, pt.y, 6.5, dt); return; }
      }
    }
    const toward = (b.vx * -side) > 4;
    if (!b.owner && toward && !b.save && Math.abs(k.x - lineX) < 2.5) {        // a pass or loose ball across his goal mouth: where does it cross his line?
      const t = (lineX - b.x) / b.vx;
      if (t > 0 && t < 1.4) {
        const cy = clamp(b.y + b.vy * t, GOAL_Y0 - 0.5, GOAL_Y1 + 0.5);
        if (Math.abs(cy - k.y) > 1.6 && t < 0.6 && k.state !== 'dive') {
          k.setState('dive', 0.7); const down = cy > k.y; k.vx = 0; k.vy = (cy - k.y) / 0.45;
          k.diveAnim = diveAnimFor(k, down); k.gkMode = 'DIVE';
          return;
        }
        if (t < 1.0 && Math.abs(b.y - 34) < 12) { k.gkMode = 'CUT'; k.gkTgt = { x: lineX, y: cy }; k.moveTo(lineX, cy, 6, dt); return; }
      }
    }
    // everything else: where he should stand, and how fast to get there
    const T = this.gkPlan(k, dt); k.gkMode = T.mode;
    const urgent = T.mode === 'SWEEP' || T.mode === 'SMOTHER' || T.mode === 'RUSH' || T.mode === 'BACK';
    if (urgent || !k.gkS) k.gkS = { x: T.x, y: T.y };                            // positioning targets ease, so he doesn't twitch with every touch
    else { const a = 1 - Math.exp(-dt * 4); k.gkS.x += (T.x - k.gkS.x) * a; k.gkS.y += (T.y - k.gkS.y) * a; }
    k.gkTgt = { x: k.gkS.x, y: k.gkS.y, set: T.set };
    const D = len(k.gkS.x - k.x, k.gkS.y - k.y);
    if (T.v <= 0 || (!urgent && D < (k.speed > 0.4 ? 0.2 : 0.45))) { k.steer(0, 0, dt); }   // (a dead band: no shuffling on the spot)
    else k.moveTo(k.gkS.x, k.gkS.y, T.v, dt);
    k.gkSet = !!T.set && k.speed < 0.7;
  },
  // the keeper's plan: { mode, x, y, v (top speed for getting there), set (in his ready stance) }
  gkPlan(k, dt) {
    const b = this.ball, side = k.team.side, gx = k.team.ownGoalX, own = k.team, opp = own.opp;
    const H = x => (x - gx) * side;                                                // height: metres out from his goal line
    const bh = H(b.x), bd = len(b.x - gx, b.y - 34);
    const defs = own.players.filter(p => !p.keeper && !p.sentOff), atk = opp.players.filter(p => !p.keeper && !p.sentOff);
    const lastH = defs.length ? Math.min(...defs.map(p => H(p.x))) : 30;          // his defensive line (the deepest outfield man)
    const carrier = b.owner && b.owner.team === opp ? b.owner : null, ours = b.owner && b.owner.team === own;
    const KD = this.dk(own), kv = 6.6 * KD.gkSpd, react = 0.15 + KD.gkReact;
    // BACK: a high ball dropping behind him while he's off his line. t-005 (lob step 1): a lob only once he has READ it
    // (gkRead, by level) - he turned the frame it passed 1.6 m, or went for its landing spot 0.07 s after the kick
    const unread = this.gkUnread(k);
    if (!b.owner && !unread && H(k.x) > 5 && b.z > 1.6 && b.vx * -side > 3 && this.path) {
      const land = this.path.find(q => q.z < 2.2 && H(q.x) < H(k.x));
      if (land && H(land.x) > -1 && Math.abs(land.y - 34) < 9) { const g = this.gkBisector(land.x, land.y, gx, side, 1.2); return { mode: 'BACK', x: g.x, y: g.y, v: kv }; }
    }
    // SWEEP / SMOTHER: a loose ball he gets to first (behind his defence, or a heavy touch in a 1v1)
    if (!b.owner && !unread && this.path && !(b.z > 1.2 && bh < 7)) {
      const toGoal = b.vx * -side > -1 || len(b.vx, b.vy) < 2;                       // (not a ball running away from his goal)
      for (const pt of this.path) {
        if (pt.z > 1.0 || !toGoal) continue;
        const ph = H(pt.x); if (ph < -0.5 || ph > 26 || Math.abs(pt.y - 34) > 22) continue;
        const me = react + len(pt.x - k.x, pt.y - k.y) / kv;
        if (me > pt.t + 0.05) continue;                                            // he can't be there in time for this point
        const them = Math.min(9, ...atk.map(o => 0.12 + len(pt.x - o.x, pt.y - o.y) / SPRINT));
        const mates = Math.min(9, ...defs.map(o => 0.12 + len(pt.x - o.x, pt.y - o.y) / SPRINT));
        if (me < them - 0.12 && (mates > me + 0.3 || ph < 5.5)) { const out = ph > 16.5 || Math.abs(pt.y - 34) > 20.2;
          return { mode: k.gkMode === 'SWEEP' || k.gkMode === 'SMOTHER' ? k.gkMode : out ? 'SWEEP' : 'SMOTHER', x: pt.x, y: pt.y, v: kv }; }   // (the label sticks while he goes for it)
        break;                                                                     // (the first point he reaches decides it)
      }
    }
    // 1v1: an attacker on the ball with nobody between him and the goal
    if (!carrier) k.rushT = 0;
    if (carrier) {
      const ch = H(carrier.x), cd = len(carrier.x - gx, carrier.y - 34);
      const cover = defs.some(p => H(p.x) < ch - 0.3 && len(p.x - carrier.x, p.y - carrier.y) < 9 && Math.abs((p.y - 34) - (carrier.y - 34) * H(p.x) / Math.max(ch, 1)) < 3.5);
      const coming = ((gx - carrier.x) * carrier.vx + (34 - carrier.y) * carrier.vy) / (cd || 1) > 1.5;   // running at goal (a striker standing on the ball: he sets instead)
      if (!cover && ch > 2 && cd < 30 && Math.abs(carrier.y - 34) < 20 && (coming || (k.rushT > 0 && cd < 14))) {   // (once out, he doesn't turn back when the dribbler slows)
        const ux = (carrier.x - gx) / (cd || 1), uy = (carrier.y - 34) / (cd || 1), gap = len(carrier.x - k.x, carrier.y - k.y);
        const out = clamp(cd - 4.5, 2.0, 14);                                      // meet him ~4-5 m in front of him on the ball line
        const tx = gx + ux * out, ty = 34 + uy * out;
        if (gap < 5.2) return { mode: 'BLOCK', x: k.x + (tx - k.x) * 0.3, y: k.y + (ty - k.y) * 0.3, v: gap > 3.2 ? 1.6 : 0, set: true };   // close: small steps, then still, low and big
        k.rushT = (k.rushT || 0) + dt;
        return { mode: 'RUSH', x: tx, y: ty, v: gap > 10 ? kv : 3.2, set: false };
      }
      k.rushT = 0;
    }
    // ANGLE + SWEEPER: stand on the angle's bisector at a depth set by how close the ball is; with the ball far away,
    // walk up behind the defence (top of the box and beyond)
    const depth = clamp(1.2 + bd * 0.14, 1.2, 5.2);
    const g = bh > 0.8 ? this.gkBisector(b.x, b.y, gx, side, depth) : { x: gx + side * 1.0, y: b.y < 34 ? GOAL_Y0 + 0.6 : GOAL_Y1 - 0.6 };   // (ball by the byline: his near post)
    let sh = clamp(lastH - 18, 8, 17) + (ours && bh > 60 ? 3 : 0);                // how far up he walks with the ball far away
    sh = Math.min(sh, Math.max(6, lastH - 6), 21);                                 // (always behind his last man)
    const w = clamp((bh - 30) / 22, 0, 1), sy = 34 + (b.y - 34) * 0.18;
    if (KD.gkPos > 0 && (!k.gkN || this.time.now > k.gkN.t)) k.gkN = { x: rnd(-1, 1) * KD.gkPos, y: rnd(-1, 1) * KD.gkPos * 0.7, t: this.time.now + rnd(1500, 3000) };   // v0.9.2: a weaker keeper stands a bit off
    const nx = KD.gkPos > 0 && k.gkN ? k.gkN.x : 0, ny = KD.gkPos > 0 && k.gkN ? k.gkN.y : 0;
    const tx = g.x + (gx + side * sh - g.x) * w + nx * side * 0.5, ty = g.y + (sy - g.y) * w + ny;
    const threat = carrier && len(carrier.x - gx, carrier.y - 34) < 32;
    const cdC = carrier ? len(carrier.x - gx, carrier.y - 34) : 99, breaking = carrier && cdC < 55 && ((gx - carrier.x) * carrier.vx + (34 - carrier.y) * carrier.vy) / (cdC || 1) > 2.5;   // they're running at his goal
    const shot = carrier && len(carrier.x - gx, carrier.y - 34) < 25 && Math.abs(carrier.y - 34) < 18;   // a shot could come any moment
    const D = len(tx - k.x, ty - k.y);
    const v = threat || breaking ? (D > 2.5 ? 5.4 : 2.6) : (D > 6 ? JOG : 1.9);    // walk when nothing is on; jog back into place; run when they break
    return { mode: w > 0.5 ? (ours ? 'UP' : 'SWEEPER') : shot ? 'SET' : 'ANGLE', x: tx, y: ty, v, set: !!shot && D < 0.8 };
  },
  // a point on the bisector of the angle between the ball and his two posts, `depth` m out from his goal line
  gkBisector(bx, by, gx, side, depth) {
    const p1 = { x: gx, y: GOAL_Y0 }, p2 = { x: gx, y: GOAL_Y1 };
    const l1 = len(p1.x - bx, p1.y - by) || 1, l2 = len(p2.x - bx, p2.y - by) || 1;
    let ux = (p1.x - bx) / l1 + (p2.x - bx) / l2, uy = (p1.y - by) / l1 + (p2.y - by) / l2; const ul = len(ux, uy) || 1; ux /= ul; uy /= ul;
    const bh = (bx - gx) * side, k = ux * side < -0.05 ? (bh - depth) / (-ux * side) : 0;   // from the ball, along the bisector, to that depth
    return { x: gx + side * Math.max(0.6, Math.min(depth, bh)), y: clamp(by + uy * k, GOAL_Y0 - 0.4, GOAL_Y1 + 0.4) };
  },
  // does the shot meet the keeper? Standing: his body plus arms. Diving: his stretched body in the direction he flew,
  // at the height he went for. Returns 'catch', 'parry' or null (not level with him yet, or past his hands).
  keeperTouch(p, pbx) {
    const b = this.ball;
    if (!((pbx - p.x) * (b.x - p.x) <= 0 || Math.abs(b.x - p.x) < 0.4)) return null;
    const rel = b.y - p.y, spd = len(b.vx, b.vy, b.vz), diving = p.state === 'dive';
    let touch;
    if (diving) {
      const along = rel * (p.diveDir || 1), zc = p.diveZ ?? 0.8, out = GK_REACH - Math.max(0, b.z - 1.7) * 0.6;
      touch = along > -0.35 && along < out && b.z < Math.max(zc + 0.9, 1.1) && b.z > zc - 1.0 && b.z < 2.75;
    } else touch = Math.abs(rel) < (b.z > 0.7 && b.z < 2.3 ? 0.85 : 0.55) && b.z < 2.6;           // arms up and a little hop
    if (!touch) return null;
    const clean = diving ? (spd < 17 && Math.abs(rel) < 0.8 && b.z < 1.9) : (spd < 24 && b.z < 2.1);
    return clean ? 'catch' : 'parry';
  },
});
