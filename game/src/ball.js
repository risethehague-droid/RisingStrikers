'use strict';
// HC2 Football · ball.js: ball physics (flight, bounce, spin), kicks, passes, shots, lobs, the chip, dribbling, possession
// (split out of game.js in v0.9.5 - load order and lanes: src/README.md)

// ------------------------------------------------------------------ ball physics (shared by the game and by the pass maths)
// In the air: gravity + quadratic drag. Bounce: loses ~45% height and ~20% pace. On the grass: a struck ball
// skids first (high friction, the "bite") until it has lost ~28% of its pace, then rolls (low friction + drag).
// A dribbled ball (owned) uses its own, higher friction so touches stay short.
function ballStep(b, h, owned) {
  // v0.8.7: a SPECIAL flies like an energy shot, not a football - a quarter of the drag, a flatter arc, it skims the
  // grass - so LV3 "from anywhere" really gets there (from your own half it died on the grass at 87 m: the Lab's PW4)
  const sp = !!b.special && !owned && (b.spF ?? 1) > 0.85;                     // (out of its range it's just a hard shot)
  const ch = !!b.chip && !owned;                                                // v0.9.2 CHIP: struck with backspin-then-dip - it climbs fast, then drops hard
  if (owned && b.tap) b.tap = false;                                            // (t-010: someone has it - it's an ordinary ball again)
  if (b.z > 0 || b.vz > 0) {
    b.vz -= G * h * (sp ? 0.35 : 1) + (ch && b.vz < 0 ? G * h * CHIP_DIP : 0);   // (t-005: the chip keeps its hard dip - Luca: "the chip stays arcade")
    if (b.spin || b.curl) {                                                     // t-002 prototype B: Magnus lift - backspin (+) floats it,
      const vh = Math.hypot(b.vx, b.vy), k = MAGNUS_K * (b.spin || 0) * h, q = MAGNUS_K * (b.curl || 0) * h, vx = b.vx;   // topspin (-) dips it,
      if (vh > 0) { const f = -k * b.vz / vh; b.vx += b.vx * f - q * b.vy; b.vy += b.vy * f + q * vx; }   // curl bends it sideways
      b.vz += k * vh; b.spin = (b.spin || 0) * (1 - h / SPIN_TAU); b.curl = (b.curl || 0) * (1 - h / SPIN_TAU);
    }
    const s = Math.hypot(b.vx, b.vy, b.vz), f = AIR_K * s * h * (sp ? 0.25 : ch ? 0.7 : 1);
    b.vx -= b.vx * f; b.vy -= b.vy * f; b.vz -= b.vz * f;
    b.z += b.vz * h;
    if (b.z <= 0) {
      b.z = 0;
      if (b.vz < -BOUNCE_MIN) {
        const vin = -b.vz, e = BOUNCE_Z - clamp((vin - 3) / 9, 0, 1) * BOUNCE_DROP, vh = Math.hypot(b.vx, b.vy);
        b.vz = vin * e;
        if (vh > 0) { const k = (vh - Math.min(BOUNCE_MU * (1 + e) * vin, 0.4 * vh)) / vh; b.vx *= k; b.vy *= k; }
        b.bounced = (b.bounced || 0) + 1;
      } else b.vz = 0;
      b.chip = false;                                                             // (one bounce and it's an ordinary ball)
      if (b.spin || b.curl) { if (b.spin > 0) { const k = 1 - Math.min(0.45, b.spin * 0.008); b.vx *= k; b.vy *= k; } b.spin = 0; b.curl = 0; }   // (t-002 prototype: backspin checks it)
      b.skid = true; b.rollV = 0.8 * Math.hypot(b.vx, b.vy);
    }
  } else {
    const s = Math.hypot(b.vx, b.vy);
    if (s > 0) {
      let dec;
      if (owned) dec = DRIB_DEC;
      else if (sp) dec = SKID_DEC * 0.3;
      else if (b.skid && s > b.rollV) dec = SKID_DEC;
      else { b.skid = false; dec = ROLL_DEC + ROLL_K * s * s; }
      if (b.tap && !owned && !sp) dec += TAP.grip;                                 // t-010: a tap kick grips the grass and dies (a close-range finish)
      const ns = Math.max(0, s - dec * h); b.vx *= ns / s; b.vy *= ns / s;
    }
  }
  if (b.cv && !owned) curveStep(b, h);                                        // t-011: a curving special pass (never set in a match)
  b.x += b.vx * h; b.y += b.vy * h;
}
// t-013: when (0..1) a point moving from (x0, y0) to (x1, y1) first comes within R of (cx, cy); null if it doesn't
// (already within R and moving in: 0). The goal frame's swept test (Match.gpWood)
function gpSweep(x0, y0, x1, y1, cx, cy, R) {
  const dx = x1 - x0, dy = y1 - y0, fx = x0 - cx, fy = y0 - cy, c = fx * fx + fy * fy - R * R;
  if (c <= 0) return fx * dx + fy * dy < 0 ? 0 : null;
  const a = dx * dx + dy * dy; if (a < 1e-12) return null;
  const q = 2 * (fx * dx + fy * dy), disc = q * q - 4 * a * c; if (disc < 0) return null;
  const t = (-q - Math.sqrt(disc)) / (2 * a); return t >= 0 && t <= 1 ? t : null;
}
// t-011 CURVE PASS: sideways spin. b.cv is the path's curvature (1/m, + turns it towards +y): each step the velocity turns by
// cv x speed x h, so the sideways pull grows with pace (Magnus: spin x speed) - strongest off the boot, fading as the ball
// slows - and the spin wears off with CURVE.tau. On the grass too (a normal ball's curl stops at its first bounce: Luca wants
// the ground pass itself to bend), and it never changes the pace, so the pass solvers' timing still holds.
function curveStep(b, h) {
  const a = b.cv * Math.hypot(b.vx, b.vy) * h, c = Math.cos(a), s = Math.sin(a), vx = b.vx;
  b.vx = vx * c - b.vy * s; b.vy = vx * s + b.vy * c; b.cv *= 1 - h / CURVE.tau;
  if (Math.abs(b.cv) < 1e-4) b.cv = 0;
}
// fly a curving test ball from (0,0) towards (d,0): launched th radians off the line to side s (+1 = +y), curvature k
// bringing it back. Ground: where it is when it first gets d along (null: it stopped or turned round first); lob: where it
// lands. `at`: the ball's lateral offset and height as it passes each man in `block` (along a). arc: the distance flown.
function curveFly(speed, vz, th, k, s, lob, d, block) {
  const b = { x: 0, y: 0, z: 0.05, vx: speed * Math.cos(th), vy: speed * Math.sin(th) * s, vz, skid: true, rollV: 0.8 * speed, cv: -k * s }, h = 1 / 120;
  let arc = 0, bend = 0; const at = block ? block.map(() => null) : null;
  for (let t = 0; t < 6; t += h) {
    const ox = b.x, oy = b.y, z0 = b.z; ballStep(b, h, false); arc += Math.hypot(b.x - ox, b.y - oy);
    if (Math.abs(b.y) > Math.abs(bend)) bend = b.y;
    if (at) block.forEach((o, i) => { if (!at[i] && ox < o.a && b.x >= o.a) at[i] = { y: b.y, z: b.z }; });
    if (lob) { if (z0 > 0 && b.z <= 0) return { x: b.x, y: b.y, arc, bend, at, t }; }
    else if (b.x >= d) { const f = (d - ox) / (b.x - ox || 1); return { x: d, y: oy + (b.y - oy) * f, arc, bend, at, t }; }
    else if (b.vx <= 0 || Math.hypot(b.vx, b.vy) < 0.3) return null;
  }
  return null;
}
// the curving pass of `mode` over d metres: which side it bends to, how far off the line it sets off, and the spin that
// brings it back onto the target. opps: the other side in the pass's frame (a along, l across, + = right of the line).
// A man on the straight line decides the side (round him, away from the side he leans to) and the smallest launch
// angle that keeps CURVE.clear from him (a lob also clears him by going over: 2.3 m up). Nobody in the way: the
// kicker's natural bend (foot: +1 = the right foot as the frames show it facing E, -1 = mirrored) - the side-foot pass and
// the scoop lob bend in from the right, the outside-of-the-boot through ball the other way. The pace: the mode's own
// (ground and through arrive as firm as the straight pass over the distance it really flies; the lob peaks at `apex`).
function curveSolve(mode, d, opps, foot, apex) {
  const lob = mode === 'lob', vz0 = mode === 'through' ? 0.25 : 0.2, arrive = mode === 'through' ? 4.5 : clamp(4.5 + d * 0.15, 5.5, 11);
  const block = opps.filter(o => o.a > 1.5 && o.a < d - 1.2 && Math.abs(o.l) < CURVE.clear + 0.6);
  const near = block.reduce((m, o) => !m || Math.abs(o.l) < Math.abs(m.l) ? o : m, null);
  const s = near && Math.abs(near.l) > 0.3 ? -Math.sign(near.l) : (mode === 'through' ? -1 : 1) * foot;
  const at = th => {
    let L = d, speed = 0, vz = vz0, k = 0, r = null;
    for (let it = 0; it < (lob ? 3 : 2); it++) {
      if (lob) { const S = lobSolve(Math.max(4, L), apex, undefined, true); speed = S.speed; vz = S.vz; } else speed = solveGround(Math.min(50, L), arrive, vz);
      let lo = 0, hi = CURVE.kMax;
      for (let i = 0; i < 15; i++) { const mid = (lo + hi) / 2, f = curveFly(speed, vz, th, mid, s, lob, d); if (f && f.y * s > 0) lo = mid; else hi = mid; }
      k = (lo + hi) / 2; r = curveFly(speed, vz, th, k, s, lob, d, block); if (!r) return null;
      L = lob ? L * d / Math.max(1, Math.hypot(r.x, r.y)) : r.arc;
    }
    const clear = block.every((o, i) => { const q = r.at[i]; return !q || (q.y - o.l) * s >= CURVE.clear || q.z > 2.3; });
    return { th, k, s, speed, vz, bend: Math.abs(r.bend), miss: Math.hypot(r.x - d, r.y), t: r.t, clear, block: block.length };
  };
  let best = null;
  // (a lob clears a man by going over him: its bend is the show, so it takes the free angle)
  for (const deg of block.length && !lob ? CURVE.ang : [CURVE.angFree]) { const S = at(deg * Math.PI / 180); if (!S || S.miss > 1.2) continue; best = S; if (S.clear) break; }
  return best;
}
// fly a test ball along +x and report when/how fast it gets to `dist` (or where it stops)
function simKick(v0, vz, dist) {
  const b = { x: 0, y: 0, z: 0.05, vx: v0, vy: 0, vz, skid: true, rollV: 0.8 * v0 }, h = 1 / 120;
  for (let t = 0; t < 5; t += h) {
    ballStep(b, h, false);
    if (b.x >= dist) return { t, v: Math.hypot(b.vx, b.vy), z: b.z };
    if (b.vx < 0.05 && b.z <= 0) return { t, v: 0, short: true };
  }
  return { t: 5, v: b.vx, short: true };
}
// ground pass: the kick speed that makes the ball arrive at `dist` with speed `arrive`
function solveGround(dist, arrive, vz) {
  let lo = 2, hi = KICK_MAX;
  for (let i = 0; i < 22; i++) { const mid = (lo + hi) / 2, r = simKick(mid, vz, dist); if (r.short || r.v < arrive) lo = mid; else hi = mid; }
  return hi;
}
// v0.8.2 how long an AI ground pass of d metres takes to arrive (cached per metre; the AI's interception check uses it)
const PASS_T = [];
function passTime(d) { const i = Math.round(clamp(d, 1, 50)); if (PASS_T[i] == null) { const v = solveGround(i, clamp(4.5 + i * 0.15, 5.5, 11), 0.2); PASS_T[i] = simKick(v, 0.2, i).t; } return PASS_T[i]; }
// friend/lob-mechanics (co-designer: "it never makes sense to lob the ball - easily interrupted, glitchy"). Measured:
// a 12 m lob peaked at 1.8 m and a 25 m one at 3.5 m, so the ball stayed at head height (under 2.7 m) for most of its
// flight and anyone near the line headed it away (28 of 60 of your lobs). An open-play lob now climbs over the
// players in between: 3.6 m for a short one up to 6 m for a long one; a held (power) lob 3.6 to 8 m.
function lobApex(d, pow) { return (pow != null ? 3.6 + clamp(pow, 0, 1) * 3.0 : clamp(2.9 + d * 0.07, 3.6, 6.0)) * LOB_H; }   // (LOB_H: the Lab's lob-height knob, 1 in the game)
// (v0.10.3, Luca's OK on PR #8's call 3, "lean arcade": a full power lob peaks at 6.6 m and hangs ~2.35 s, was 8 m / 2.58 s)
// lofted ball: the forward speed that makes it come down at `dist` for a given upward speed
// (n: bisection steps - t-005's charge-arc preview asks for 12, about 1 cm; every kick keeps the full 22)
function solveLob(dist, vz, spin, n = 22) {
  const land = v0 => { const b = { x: 0, y: 0, z: 0.05, vx: v0, vy: 0, vz, skid: true, rollV: 0, spin }, h = 1 / 120;
    for (let t = 0; t < 6; t += h) { ballStep(b, h, false); if (b.z <= 0 && t > 0.1) return b.x; } return b.x; };
  let lo = 2, hi = KICK_MAX;
  for (let i = 0; i < n; i++) { const mid = (lo + hi) / 2; if (land(mid) < dist) lo = mid; else hi = mid; }
  return hi;
}
// the kick that lands at `dist` AND really peaks at `apex` (drag and spin included). t-002 (worker-f) found that
// sqrt(2 g h) ignores drag, so friend/lob-mechanics' "3.6-6 m" lobs measured 3.5-4.7 m; t-005 (lob step 1) makes it the
// game's: open-play and power lobs now really peak at lobApex (25 m: 4.65 m, 1.9 s in the air; a full power lob 8 m, 2.5 s)
// (quick: for drawing only - the charge arc is asked every frame while you hold LOB; ~4 cm against the kick's own solve)
function lobSolve(dist, apex, spin, quick) {
  const peak = (v0, vz) => { const b = { x: 0, y: 0, z: 0.05, vx: v0, vy: 0, vz, skid: true, rollV: 0, spin }, h = 1 / 120; let p = 0;
    for (let t = 0; t < 6; t += h) { ballStep(b, h, false); p = Math.max(p, b.z); if (b.vz < 0) break; } return p; };
  const n = quick ? 12 : 22;
  let lo = 1, hi = 20, v = 10;
  for (let i = 0; i < (quick ? 9 : 14); i++) { const vz = (lo + hi) / 2; v = solveLob(dist, vz, spin, n); if (peak(v, vz) < apex) lo = vz; else hi = vz; }
  return { speed: solveLob(dist, hi, spin, n), vz: hi };
}
// t-012 the computer's WHIPPED CROSS: driven (about 65-75 km/h over 25 m), over the first man (peak ~2.5-3 m) and coming
// down through head height (tz, ~1.6 m) at the runner's spot, so the man who meets it heads or volleys it (a lob drops
// onto a duel or his chest). The Lab's aimAir solver (the C crosses), with drag: forward speed nudged until it does
function crossSolve(d, tz, T) {
  T = Math.max(T, d / 24); let v = d / T; const vz = (tz - 0.05 + 0.5 * G * T * T) / T;
  for (let it = 0; it < 8; it++) {
    const c = { x: 0, y: 0, z: 0.05, vx: v, vy: 0, vz, skid: true, rollV: 0 }, h = 1 / 120; let at = null, pz = c.z;
    for (let t = 0; t < 5; t += h) { ballStep(c, h, false); if (c.vz < 0 && pz >= tz && c.z < tz) { at = c.x; break; } if (c.z <= 0 && t > 0.05) { at = c.x; break; } pz = c.z; }
    if (!at) break; v *= d / at;
  }
  return { speed: v, vz };
}
// t-005 (lob step 1, readability): the shadow's size at height z - top-down games show a ball's height by its shadow
// shrinking (docs/lob-chip.md); ours kept one size, so height read only from a faint fade
function shadowK(z) { return 1 - (1 - SHADOW_MIN) * clamp(z / SHADOW_Z, 0, 1); }

// ---------------------------------------------------------------- Match methods: ball
hc2Mix(Match, {

  // ---------- kicks
  // a kick has a short wind-up; the ball leaves the foot when the swing lands (releaseKick)
  kick(p, tx, ty, speed, vz, delay = 0.12, info = {}) {
    p.setState('kick', 0.45); p.face = dirIndex(tx - p.x, ty - p.y);
    p.kickAnim = (info.mode === 'ground' || info.mode === 'through') ? 'pass' : 'kick';     // side-foot pass vs full strike
    if (p.keeper) p.kickAnim = p.hands ? (info.mode === 'ground' && MAN.kits[p.kit].anims['roll-S'] ? 'roll' : 'throw')   // batch 10: rolls it out
      : (this.setPiece && this.setPiece.kind === 'GOAL KICK') || !MAN.kits[p.kit].anims['kick-S'] ? 'gkick' : 'kick';   // v0.7.6: open play = PixelLab clearance, any direction
    if (this.setPiece && this.setPiece.kind === 'THROW-IN' && this.setPiece.taker === p) p.kickAnim = 'throwin';
    if (p.keeper && p.hands && info.mode === 'lob' && len(tx - p.x, ty - p.y) > 30 && MAN.kits[p.kit].anims['punt-S']) { p.kickAnim = 'punt'; p.setState('kick', 0.72); }   // v0.8.1: a long one out of his hands is a punt
    if (p.keeper && p.hands) delay = p.kickAnim === 'roll' ? 0.3 : 0.22;         // overarm throw / underarm roll: lets go on PixelLab's release frame
    if (info.shot && !p.keeper && MAN.kits[p.kit].anims[`shot-${DIRS[p.face]}`]) p.kickAnim = 'shot';   // v0.7: the new PixelLab strike
    if (info.chip && MAN.kits[p.kit].anims[`chip-${DIRS[p.face]}`]) p.kickAnim = 'chip';   // v0.9.4: the PixelLab chip (the scoop under it)
    if (info.tap) this.tapAnim(p);                                                // t-010: the PixelLab tap (made E / W only)
    if (KICK_HIT[p.kickAnim] != null && !(this.setPiece && this.setPiece.kind === 'THROW-IN')) delay = (KICK_HIT[p.kickAnim] + 0.6) / kickRate(p.kickAnim);   // ball leaves on the contact frame
    this.pending = { p, tx, ty, speed, vz, t: delay, info };
  },
  releaseKick(k) {
    const b = this.ball, whiff = why => { if (/^(fall|hit|blasted|getup|slide)$/.test(k.p.state) || (b.lastP && b.lastP.team !== k.p.team)) return;   // (tackled / knocked down in the wind-up: fair, not a bug - the overnight soak's one WHIFF was that)
      if (k.info.special && this.bw) this.bw.flag('WHIFF', `${this.bw.who(k.p)}'s LV${k.info.special} ${k.p.kickAnim || 'special'} never touched the ball (${why}) - the bars were spent`, { p: k.p }); };   // v0.8.7 BUG WATCH
    if (b.owner !== k.p) return b.owner ? undefined : whiff('it got away');     // (someone took it off him in the wind-up: fair)
    if (!k.p.hands && len(b.x - k.p.x, b.y - k.p.y) > 2.0) return whiff(`it was ${len(b.x - k.p.x, b.y - k.p.y).toFixed(1)} m away`);   // the ball ran away from him: air kick
    if (this.offKick(k)) return;                                                  // t-024 OFFSIDE: who's offside, taken on the contact frame (true = he was, the kick is off)
    const dx = k.tx - b.x, dy = k.ty - b.y, d = len(dx, dy) || 1;
    let speed = k.speed, vz = k.vz;
    const mode = k.info.mode;
    if (mode === 'ground') { vz = 0.2; speed = solveGround(d, clamp(4.5 + d * 0.15, 5.5, 11), vz); }   // arrives firm, then dies
    else if (mode === 'through') { vz = 0.25; speed = solveGround(d, 4.5, vz); }                          // slows into the runner's path
    else if (mode === 'lob' && k.info.aim) { const L = lobSolve(d, k.info.aim.apex); speed = L.speed; vz = L.vz; }   // t-008: the hold-aimed lob lands ON the ring (solved from where the ball is as it leaves the boot)
    else if (mode === 'lob' && k.info.loft) { const L = this.loftLaunch(d, k.info.lobPow); speed = L.speed; vz = L.vz; }   // lob-mechanics: over their heads (t-005: really as high as lobApex says)
    else if (mode === 'lob' && k.info.lobPow != null) { const T = 1.0 + k.info.lobPow * 1.5; vz = G * T / 2; speed = solveLob(Math.max(4, d - 1), vz); }   // v0.8.5 power lob: up to ~8 m high
    else if (mode === 'lob') { const T = clamp(0.7 + d / 25, 0.9, 1.9); vz = G * T / 2 * 1.05; speed = solveLob(Math.max(4, d - 2), vz); }
    if (k.info.cross === 'whip') { const S = crossSolve(d, rnd(1.35, 1.85), 0.25 + d / 21); speed = S.speed; vz = S.vz; }   // t-012: the computer's whipped cross
    if (k.info.chip) { const S = this.chipSolve(b, k.tx, k.ty, k.p.team, k.info.chipC || 0); speed = S.speed; vz = S.vz; }   // v0.9.2 CHIP: fast, over the keeper, dipping under the bar
    b.tap = !!k.info.tap;                                                         // t-010: the tap kick's drop-off (ballStep); any other kick is a normal ball
    const P = LOB_PROTO && ((mode === 'lob' && k.info.loft) || k.info.chip) ? this.lobProto(k, d) : null;   // t-002 prototype B (off in a normal match)
    if (P && P.speed) { speed = P.speed; vz = P.vz; }
    speed = Math.min(speed, k.info.special ? 40 : KICK_MAX);
    b.special = k.info.special || 0; b.power = k.info.shot ? (k.info.power ?? 0.6) : 0;   // v0.8: the keeper guard needs to know
    b.chip = !!k.info.chip && !(P && P.spin); b.chipSlow = false;
    if (P) { b.spin = P.spin || 0; b.curl = 0; }                                // (t-002 prototype B: a spinning ball, no fake dip)
    else if (b.spin || b.curl) { b.spin = 0; b.curl = 0; }                      // (any other kick: no spin left over)
    if (b.cv) b.cv = 0;                                                         // (t-011: nor a curving pass's)
    // t-005 (lob step 1): every lofted ball (lob, power lob, chip, a keeper's throw or punt, a lofted set piece) keeps a
    // landing ring on the grass until someone touches it (docs/lob-chip.md: "you can't see where it lands once it's gone")
    b.ring = mode === 'lob' || k.info.chip ? { by: k.p, chip: !!k.info.chip, n: b.bounced || 0, at: null } : null;
    b.spP = b.special ? (k.info.spP || SP_POWER[b.special - 1]) : 0; b.spF = b.special ? (k.info.spF ?? 1) : 1; b.pierce = b.special ? SP_PIERCE[b.special - 1] : 0; b.spT = this.time.now; b.spTeam = b.special ? k.p.team : null;   // v0.8.6
    if (b.special) this.saveCall(k.p.team.opp);                                  // v0.8.6: the defending side can answer with a special save
    b.owner = null; b.vx = dx / d * speed; b.vy = dy / d * speed; b.vz = vz; b.z = Math.max(b.z, 0.05);
    if (k.p.kickAnim === 'super') b.z = 1.0;                                      // struck in mid-air, at the height of his boot
    if (k.p.keeper && k.p.hands && mode === 'lob') b.z = k.p.kickAnim === 'punt' ? 0.45 : 1.9;   // a throw leaves the raised hand, a punt the boot
    b.skid = true; b.rollV = 0.8 * speed; b.target = k.info.target || null; b.airT = 0; b.lob = !!k.info.loft; b.aimLob = !!k.info.aim;   // lob-mechanics: an open-play lob (its drop is a duel)
    if (k.info.curve) this.curveLaunch(b, k);                                     // t-011: the curving special pass (Test Lab only)
    b.last = k.p.team; b.lastP = k.p; k.p.cool = 0.3; b.tried = null; b.crossBy = k.info.cross ? k.p : null;   // (t-012: the runners attack a cross until someone touches it)
    if (k.info.tap) this.tapSfx(); else if (k.p.hands && k.p.kickAnim === 'punt') SFX.kick(0.55); else if (k.p.hands) SFX.pass(); else if (k.info.shot) SFX.kick(k.info.power || 0.6); else if (mode === 'lob') SFX.kick(0.4); else SFX.pass();
    k.p.hands = false;
    b.save = null; b.saveable = null;
    b.how = { kind: k.p.kickAnim === 'volley' ? 'volley' : k.p.kickAnim === 'bicycle' ? 'bicycle' : k.info.shot ? 'shot' : 'pass', x: b.x, y: b.y };
    this.impact(k);                                                               // v0.7: you feel the contact
    if (k.info.shot) { b.shotBy = k.p; b.shotT = this.time.now + Math.random();   // weight on the strike
      // a defender standing in the line of the shot can block it
      const ux = b.vx / (speed || 1), uy = b.vy / (speed || 1);
      for (const o of k.p.team.opp.players) {
        if (o.keeper || o.sentOff || o.busy() || k.info.special || k.info.chip) continue;     // (v0.8.6: a special isn't blocked on the strike - it blows through, see pierce; v0.9.2: a chip goes over)
        const rx = o.x - b.x, ry = o.y - b.y, along = rx * ux + ry * uy, lat = Math.abs(rx * uy - ry * ux);
        if (along > 0.4 && along < 5 && lat < 0.75 && Math.random() < 0.6) {
          const sp2 = speed * rnd(0.25, 0.45), ang = Math.atan2(-uy, -ux) + rnd(-1.3, 1.3);
          b.vx = Math.cos(ang) * sp2; b.vy = Math.sin(ang) * sp2; b.vz = rnd(0.5, 3); b.last = o.team; b.lastP = o;
          o.cool = 0.25; this.say('', 'BLOCKED!', 0.8); return;
        }
      }
      const pen = !!this.penaltyKick || !!(this.setPiece && this.setPiece.kind === 'PENALTY');
      this.planSave(k.p.team.opp.players[0]); if (!k.info.special) this.shotSaveCall(k.p.team.opp, k.p.team, pen);   // v0.9.0
    }
  },
  // v0.7 IMPACT: hit-stop (everything freezes on the contact frame for a few hundredths), the ball flashes white,
  // a camera kick; a charged power shot (held shoot) freezes longer, shakes harder and drags a hot trail behind the ball
  impact(k) {
    const pw = k.info.shot ? (k.info.power ?? 0.6) : 0, power = k.info.shot && pw > 0.72;
    this.hitStop = k.info.shot ? 0.05 + pw * 0.08 : (k.info.mode === 'lob' ? 0.035 : 0.025);
    this.flashT = this.hitStop + 0.03;
    if (k.info.shot) this.cameras.main.shake(power ? 260 : 150, power ? 0.004 + pw * 0.004 : 0.0015 + pw * 0.002);
    else this.cameras.main.shake(70, 0.0008);
    this.trailT = power ? 0.9 : 0; this.trailHot = pw; this.trailSp = 0;
    if (power) SFX.boom(pw);
    const sp = k.info.special || 0;
    if (sp) { this.hitStop = 0.14 + sp * 0.05; this.flashT = this.hitStop; this.trailT = 1.6; this.trailSp = sp;
      const c = [[255, 140, 40], [80, 180, 255], [190, 90, 255]][sp - 1]; this.cameras.main.flash(90 + sp * 40, ...c); this.cameras.main.shake(300 + sp * 80, 0.005 + sp * 0.002); }
    if (this.fxImpact) this.fxImpact(k, pw);                                     // PixelLab impact burst (when the art is in)
  },
  dust(p) {
    if (!this.textures.exists('fx') || p.speed < RUN) return;
    const X = wx(p.x, p.y), Y = wy(p.y), im = this.add.image(X - p.vx * 3, Y - 4, 'fx', 'dust').setScale(0.35).setAlpha(0.8).setDepth(Y - 1).setFlipX(p.vx > 0);
    this.tweens.add({ targets: im, scale: 0.75, alpha: 0, x: X - p.vx * 9, y: Y - 10, duration: 380, ease: 'Quad.easeOut', onComplete: () => im.destroy() });
  },
  // PixelLab impact burst where the boot meets the ball (bigger for power shots, a fire ring + sparks for specials)
  fxImpact(k, pw) {
    if (!this.textures.exists('fx')) return;
    const b = this.ball, X = wx(b.x, b.y), Y = wy(b.y) - 12 - b.z * PX_H, sp = k.info.special || 0, big = sp || pw > 0.72;
    const pop = (name, s0, s1, ms, a = 1) => { const im = this.add.image(X, Y, 'fx', name).setScale(s0).setAlpha(a).setDepth(wy(b.y) + 2);
      this.tweens.add({ targets: im, scale: s1, alpha: 0, duration: ms, delay: (this.hitStop || 0) * 600, ease: 'Cubic.easeOut', onComplete: () => im.destroy() }); };
    if (!k.info.shot && k.info.mode !== 'lob') { pop('impact', 0.35, 0.6, 140, 0.8); return; }
    pop(big ? 'impactBig' : 'impact', big ? 0.9 : 0.6, big ? 1.9 : 1.1, big ? 260 : 170);
    if (sp) { pop('ring', 0.8, 2.6 + sp * 0.5, 420); pop('sparks', 0.8, 2.2, 380); if (sp >= 2) pop('bolt', 1.0, 1.6, 260); }
  },
  passTarget(p, dir, mode, keep) {
    let best = null, bs = -1e9, ks = -1e9;
    const far = mode === 'ground' ? 40 : 52;
    for (const q of p.team.players) {
      if (q === p) continue;
      const dx = q.x - p.x, dy = q.y - p.y, d = len(dx, dy); if (d < 3 || d > far) continue;
      const cos = (dx * dir.x + dy * dir.y) / d; if (cos < 0.5) continue;
      let press = 0, lane = 0;
      for (const o of p.team.opp.players) {
        const od = len(o.x - q.x, o.y - q.y); if (od < 4) press += (4 - od);
        // opponents standing in the passing lane
        const t = ((o.x - p.x) * dx + (o.y - p.y) * dy) / (d * d);
        if (t > 0.08 && t < 0.95) { const lat = Math.abs((o.x - p.x) * dy - (o.y - p.y) * dx) / d; if (lat < 2.2) lane += (2.2 - lat); }
      }
      // v0.7: where you point wins (a mate inside ~25 degrees of the stick beats a 'safer' one 50 degrees off)
      const sc = cos * 7 - d / 30 - press * 0.25 - lane * (mode === 'lob' ? 0.1 : 0.45);
      if (q === keep) ks = sc;
      if (sc > bs) { bs = sc; best = q; }
    }
    return keep && ks > bs - 0.6 ? keep : best;                                // v0.7.4: the mate you're shown stays picked unless another is clearly better (no flicker)
  },
  doPass(p, dir, mode, to) {
    const q = to || this.passTarget(p, dir, mode, p === this.human ? this.passAim : null);   // (v0.8.2: the AI names the man it picked)
    let tx, ty;
    if (q) {
      if (mode === 'through') {                                                // into the space in front of him
        const lead = q.speed > 2 ? 8 : 6.5;
        tx = clamp(q.x + q.team.side * lead, 2, PITCH_L - 2); ty = clamp(q.y + (34 - q.y) * 0.12 + q.vy * 0.6, 2, PITCH_W - 2);
      } else {                                                                 // to his feet, a little ahead if he's running
        const t = len(q.x - p.x, q.y - p.y) / 14;
        tx = q.x + q.vx * t * 0.6; ty = q.y + q.vy * t * 0.6;
      }
    } else { const d = mode === 'lob' ? 25 : 16; tx = p.x + dir.x * d; ty = p.y + dir.y * d; }
    if (!(p === this.human && !this.demo) && !p.keeper) { const e = this.dk(p.team).passErr; if (e > 0) {   // v0.9.2: a weaker computer side passes less accurately
      const a = rnd(-1, 1) * e, dx = tx - p.x, dy = ty - p.y, c = Math.cos(a), s = Math.sin(a); tx = p.x + dx * c - dy * s; ty = p.y + dx * s + dy * c; } }
    this.kick(p, tx, ty, 0, 0, 0.12, { mode, target: q, loft: mode === 'lob' && !p.keeper && !this.setPiece });
    if (q && p.team === this.home) { this.nextHuman = q; this.passRing = { p: q, t: 1.0 }; this.passStick = { ...Input.axis }; }
  },
  // t-011: the curving special pass leaves the boot - solved from where the ball really is at contact, round the men in
  // the way now (specials.js curvePass set it up; nothing solvable = it goes as the straight pass it already is)
  curveLaunch(b, k) {
    const C = k.info.curve, dx = k.tx - b.x, dy = k.ty - b.y, d = len(dx, dy) || 1, ux = dx / d, uy = dy / d;
    const opps = k.p.team.opp.players.filter(o => !o.sentOff).map(o => ({ a: (o.x - b.x) * ux + (o.y - b.y) * uy, l: (o.y - b.y) * ux - (o.x - b.x) * uy, o }));
    const S = curveSolve(C.mode, d, opps, C.foot, C.mode === 'lob' ? this.lobAimApex(k.p, k.tx, k.ty) : 0);
    this.curveLast = S ? { ...S, mode: C.mode, by: k.p, to: k.info.target, from: { x: b.x, y: b.y }, tx: k.tx, ty: k.ty, d } : null;
    if (!S) return;
    const a = S.th * S.s, c = Math.cos(a), s = Math.sin(a), lx = ux * c - uy * s, ly = ux * s + uy * c;   // the line turned by th to side s
    b.vx = lx * S.speed; b.vy = ly * S.speed; b.vz = S.vz; b.rollV = 0.8 * S.speed; b.cv = -S.k * S.s;
    this.curveFx(k, S);                                                         // the look (specials.js)
  },
  // v0.8.5 (Luca): HOLD the lob for a high ball where you point - the longer you hold, the further and higher (12-50 m)
  powerLob(p, dir, c) {
    const l = len(dir.x, dir.y) || 1, d = 12 + c * (LOB_MAX - 12), tx = clamp(p.x + dir.x / l * d, 1, PITCH_L - 1), ty = clamp(p.y + dir.y / l * d, 1, PITCH_W - 1);
    const q = p.team.players.filter(m => m !== p && !m.sentOff && !m.keeper).sort((a, b) => len(a.x - tx, a.y - ty) - len(b.x - tx, b.y - ty))[0];
    const target = q && len(q.x - tx, q.y - ty) < 9 ? q : null;
    this.kick(p, tx, ty, 0, 0, 0.14, { mode: 'lob', target, lobPow: c, loft: !p.keeper && !this.setPiece });
    if (target && p.team === this.home) { this.nextHuman = target; this.passRing = { p: target, t: 1.0 }; this.passStick = { ...Input.axis }; }
  },
  lobSpot(p) { const ax = Input.axis, dv = len(ax.x, ax.y) > 0.1 ? ax : dirVec(p.face), l = len(dv.x, dv.y) || 1, d = 12 + this.lobCharge * (LOB_MAX - 12);
    if (this.chipCan(p, dv)) return { x: p.team.goalX, y: clamp(34 + (Math.abs(ax.y) > 0.2 ? ax.y * 2.4 : 0), GOAL_Y0 + 0.4, GOAL_Y1 - 0.4), chip: true };   // v0.9.2 a chip: at the goal
    return { x: clamp(p.x + dv.x / l * d, 1, PITCH_L - 1), y: clamp(p.y + dv.y / l * d, 1, PITCH_W - 1) }; },
  // ======================================================================= t-008 THE HOLD-TO-AIM LOB (Luca 24 Oct 05:57: "the sensitivity /
  // speed of the build up of distance power is janky and too quick [...] make the lob a hold until its the right spot
  // then release is the actual lob kick"). The old hold charged 0 -> 1 in 0.9 s and the distance came with it, so you
  // couldn't place it. Now pressing LOB puts the landing ring where a lob would go (the team-mate the pass logic picks that
  // way, or LOB2.startD ahead), the stick walks it at a steady speed (actions.js lobAimTick), and the release is the kick:
  // solved with the real flight (lobSolve) so it comes down on the ring. Its arc comes from the distance and what's in
  // the way (lobAimApex). The tap stays the instant lob; the chip in their box and the keeper's throw keep the old hold.
  lobAimStart(p, dir) {
    const l = len(dir.x, dir.y) || 1, ux = dir.x / l, uy = dir.y / l, q = this.passTarget(p, { x: ux, y: uy }, 'lob', p === this.human ? this.passAim : null);
    const qd = q ? len(q.x - p.x, q.y - p.y) : 0;
    const s = q && qd >= LOB2.minD && qd <= LOB2.maxD ? { x: q.x + q.vx * 0.5, y: q.y + q.vy * 0.5 } : { x: p.x + ux * LOB2.startD, y: p.y + uy * LOB2.startD };
    return this.lobAimClamp(p, s.x, s.y);
  },
  // the ring stays LOB2.minD-maxD from the kicker and on the pitch
  lobAimClamp(p, x, y) {
    let dx = x - p.x, dy = y - p.y, d = len(dx, dy); if (d < 1e-3) { const f = dirVec(p.face); dx = f.x; dy = f.y; d = 1; }
    const dc = clamp(d, LOB2.minD, LOB2.maxD);
    return { x: clamp(p.x + dx / d * dc, 1, PITCH_L - 1), y: clamp(p.y + dy / d * dc, 1, PITCH_W - 1) };
  },
  // how high it goes: over an opponent in its path it climbs clear of his head (LOB2.clearZ where he stands: the arc is
  // close to a parabola, 4 h t (1 - t) high t of the way along); a short ball with a clear lane is driven, flatter and
  // quicker; otherwise the open-play lob's height for the distance (lobApex). Men right next to the kicker (he blocks it
  // off the boot, pickups) or at the drop (that's the duel) don't count.
  lobAimApex(p, tx, ty) {
    const b = this.ball, dx = tx - b.x, dy = ty - b.y, d = len(dx, dy) || 1; let need = 0;
    for (const o of p.team.opp.players) {
      if (o.sentOff) continue;
      const al = ((o.x - b.x) * dx + (o.y - b.y) * dy) / d; if (al < 2.5 || al > d - 2.5) continue;
      const lat = Math.abs((o.x - b.x) * dy - (o.y - b.y) * dx) / d; if (lat > 2.2) continue;
      const t = al / d; need = Math.max(need, LOB2.clearZ * (1 - lat / 2.2 * 0.3) / (4 * t * (1 - t)));
    }
    const base = !need && d < LOB2.drivenD ? LOB2.drivenLo + (LOB2.drivenHi - LOB2.drivenLo) * clamp((d - LOB2.minD) / (LOB2.drivenD - LOB2.minD), 0, 1) : lobApex(d, null);
    return clamp(Math.max(base, need), 2, LOB2.apexMax);
  },
  // the release: the kick to the ring, and the man who'll get there (the one the ring settled on, else the team-mate
  // who can reach the drop soonest - he starts his run now: teamai.js lobRun)
  aimLob(p, A) {
    const tx = A.x, ty = A.y, apex = this.lobAimApex(p, tx, ty), T = 2 * Math.sqrt(2 * apex / G) * 0.95;   // (time up and down: enough to pick the man)
    let q = A.q && !A.q.sentOff ? A.q : null;
    if (!q) { let bt = 1e9; for (const m of p.team.players) { if (m === p || m.sentOff || m.keeper) continue;
      const t = len(m.x - tx, m.y - ty) / (m.top ? m.top(true, false) : RUN); if (t < bt && t < T + 0.6) { bt = t; q = m; } } }
    this.kick(p, tx, ty, 0, 0, 0.14, { mode: 'lob', target: q, loft: !p.keeper && !this.setPiece, aim: { apex, x: tx, y: ty } });
    this.lobAimLast = { x: tx, y: ty, apex, q, by: p };
    if (q && p.team === this.home) { this.nextHuman = q; this.passRing = { p: q, t: 1.0 }; this.passStick = { ...Input.axis }; }
  },
  // the arc drawn while you aim: the same solve the release will use, flown with ballStep (cached by the metre and 0.5 m of
  // height, ~6 ms a miss headless: it's asked every frame and the ring moves; the path is stretched to end on the ring,
  // and the kick itself solves exactly)
  aimPreview(p, x, y) {
    const b = this.ball, apex = this.lobAimApex(p, x, y), dx = x - b.x, dy = y - b.y, d = len(dx, dy) || 1, ux = dx / d, uy = dy / d;
    const kd = Math.max(1, Math.round(d)), ka = Math.round(apex * 2) / 2, key = kd + '|' + ka + '|' + LOB_H;
    const C = this.aimPv || (this.aimPv = new Map()); let S = C.get(key);
    if (!S) { S = lobSolve(kd, ka, undefined, true); if (C.size > 600) C.clear(); C.set(key, S); }
    const f = { x: 0, y: 0, z: 0.05, vx: S.speed, vy: 0, vz: S.vz, skid: true, rollV: 0 }, pts = [{ x: b.x, y: b.y, z: 0.05 }], h = 1 / 60;
    for (let i = 1; i <= 300; i++) { const z0 = f.z; ballStep(f, h, false); const k = d / kd;
      if (i % 2 === 0 || f.z <= 0) pts.push({ x: b.x + ux * f.x * k, y: b.y + uy * f.x * k, z: f.z }); if (z0 > 0 && f.z <= 0) break; }
    return { pts, apex };
  },
  // ======================================================================= t-010 TAP KICK (Luca 24 Oct 05:57: "a snappier kick from
  // up close and it drops off [...] it follows a predictable path which just faces the direction of the arrow you point
  // with, but a goalie can deal with them easy in their range"). SHOOT tapped (actions.js tapKickTry) or the computer's
  // tap-in (doShot): low, ~65 km/h off the boot, straight along `dir`, about a degree of error, no curve, and it grips the
  // grass (TAP.grip in ballStep) so it's dead by ~15 m. It's a shot like any other once it leaves the boot: a defender
  // in the line blocks it, and the keeper's t-007 planSave reads it - in his reach he holds most (a soft ball at his
  // body), out of it (committed, wrong-footed, the far post after a cut-back) it goes in. No dice for that.
  tapKick(p, dir) {
    const b = this.ball, l = len(dir.x, dir.y) || 1, e = rnd(-1, 1) * (TAP.err + (p.sprinting || p.tired ? TAP.errRun : 0));
    const c = Math.cos(e), s = Math.sin(e), ux = (dir.x * c - dir.y * s) / l, uy = (dir.x * s + dir.y * c) / l;
    const at = this.tapOnGoal(p, b.x, b.y, ux, uy);                               // heading for their goal: a shot (stats, the keeper's read)
    if (at && (!this.setPiece || this.setPiece.kind !== 'PENALTY')) this.stat(p.team).shots++;
    this.kick(p, b.x + ux * 30, b.y + uy * 30, TAP.speed * SHOT_K, TAP.vz, 0.13, { shot: at, tap: true, power: 0.3 });
  },
  // a tap along (ux, uy) from (x, y): does it cross their goal line between the posts (with a little to spare)?
  tapOnGoal(p, x, y, ux, uy) {
    const gx = p.team.goalX; if ((gx - x) * ux <= 0) return false;
    const t = (gx - x) / ux, yy = y + uy * t; return yy > GOAL_Y0 - 1 && yy < GOAL_Y1 + 1;
  },
  // the PixelLab tap (batch 16) is drawn E / W: side-on to the way it goes, like the specials. A kit without it: the shot
  tapAnim(p) {
    if (!MAN.kits[p.kit].anims['tap-E']) return;
    p.face = dirVec(p.face).x >= 0 ? 0 : 4; p.kickAnim = 'tap';
  },
  // a short, sharp click off the toe: higher and shorter than a shot's thump (no boom), the existing synth voices
  tapSfx() { SFX.tone('triangle', 330, 110, 0.05, 0.45); SFX.hiss(2400, 1.4, 0.03, 0.28); },
  // the computer's tap-in (t-010, with TAP_KICK on): on the ball close in, the corner away from the keeper past his
  // reach (the same keeperCover his save uses, with the tap's travel time) - it slots it there instead of blasting
  aiTap(p) {
    const b = this.ball, gx = p.team.goalX, gk = p.team.opp.players[0];
    if (!TAP_KICK || (p === this.human && !this.demo) || b.owner !== p || b.z > 0.25 || this.setPiece || p.keeper) return false;
    if (len(gx - b.x, 34 - b.y) > TAP.aiD) return false;
    const ty = !gk || gk.sentOff ? 34 : gk.y < 34 ? GOAL_Y1 - 0.6 : GOAL_Y0 + 0.6, dx = gx - b.x, dy = ty - b.y, d = len(dx, dy);
    if (gk && !gk.sentOff) {
      const T = d / (TAP.speed * 0.8) - 0.15, t = (gk.x - b.x) / dx, gap = Math.abs(b.y + dy * clamp(t, 0, 1) - gk.y);   // where it passes him
      const busy = gk.state === 'dive' || gk.stun > 0 || Math.abs(gk.x - gx) > 6;   // down, stranded, or far off his line
      if (!busy && gap < this.keeperCover(T, 0.2) + TAP.aiGap) return false;   // he'd get there: a normal shot
    }
    this.tapKick(p, { x: dx / d, y: dy / d }); return true;
  },
  // power 0..1 from holding the button; aimY -1..1 from the stick (far post / near post)
  doShot(p, power, aimY) {
    if (this.aiTap(p)) return;                                                    // t-010: the computer's tap-in (only with TAP_KICK on)
    const gx = p.team.goalX; if (!this.setPiece || this.setPiece.kind !== 'PENALTY') this.stat(p.team).shots++;
    if (power > 0.93 && p === this.human) this.ramiSay('power_shot', {}, 1);
    const err = rnd(-1, 1) * (0.35 + Math.max(0, power - 0.85) * 5 + (p.sprinting ? 0.7 : 0) + (p.tired ? 0.6 : 0)) * (p === this.human && !this.demo ? 1 : this.dk(p.team).shotErr);   // (v0.9.2: the computer's finishing by level)
    const ty = clamp(34 + aimY * 2.8 + err, 27, 41);
    const spd = (16 + power * 16) * SHOT_K;
    const vz = 0.9 + power * 3.6 + (power > 0.88 ? (power - 0.88) * 40 : 0) + rnd(-0.3, 0.4);  // too much power: over the bar
    this.kick(p, gx + p.team.side * 2, ty, spd, vz, 0.13, { shot: true, power });
  },
  // where the loose ball will be over the next 3 seconds (for receivers and chasers). t-005: plus `land`, where a ball
  // in the air first comes down (the landing ring; every step is checked, not only the 1-in-3 kept for the path)
  predict() {
    const b = this.ball, c = { x: b.x, y: b.y, z: b.z, vx: b.vx, vy: b.vy, vz: b.vz, skid: b.skid, rollV: b.rollV, special: b.special, spF: b.spF, chip: b.chip, spin: b.spin, curl: b.curl, tap: b.tap, cv: b.cv }, out = [], h = 1 / 60;   // (t-010: a tap kick's drop-off too; t-011: + the curving pass's spin)
    for (let i = 1; i <= 180; i++) { const z0 = c.z; ballStep(c, h, false); if (!out.land && z0 > 0 && c.z <= 0) out.land = { x: c.x, y: c.y, t: i * h }; if (i % 3 === 0) out.push({ t: i * h, x: c.x, y: c.y, z: c.z }); }
    return out;
  },
  // t-005: where the landing ring sits - the ball's predicted first bounce while it flies, then the spot it came down
  // on - or null once someone has touched it: a trap, a kick, a header (it names a new last man), a save or a deflection
  ringSpot() {
    const b = this.ball, R = b.ring;
    if (!R || b.owner || b.lastP !== R.by || b.inNet || this.dead || this.setPiece) return null;
    const P = (b.bounced || 0) === R.n ? this.path || this.predict() : null;     // (the frame it leaves the boot, the path was made while he still had it)
    if (P && P.land) R.at = { x: P.land.x, y: P.land.y };
    return R.at ? { x: R.at.x, y: R.at.y, chip: R.chip } : null;
  },
  // t-005: the launch of an open-play / power lob: it lands 2 m short of the man (1 m for a power lob - he meets it) and
  // really peaks at lobApex. The release and the charge arc's preview both use it, so the arc you see is the kick you get
  loftLaunch(d, pow, quick) { return lobSolve(Math.max(4, d - (pow != null ? 1 : 2)), lobApex(d, pow), undefined, quick); },
  // t-005 (lob step 1): the power-lob charge arc follows the ball's real path (it was a fixed sine, 40-130 px high) -
  // the same launch the release will use, flown with ballStep. Returns the points in metres and where it comes down
  // (a chip: where it crosses the goal line). Cached, since it's asked every frame while you hold LOB.
  lobPreview(p, L, c) {
    const b = this.ball, gk = p.team.opp.players[0], tx = L.chip ? p.team.goalX + p.team.side * 1.5 : L.x, ty = L.y;
    const q = v => Math.round(v * 4), key = [L.chip ? 1 : 0, Math.round(c * 50), q(b.x), q(b.y), q(tx), q(ty), L.chip && gk ? `${q(gk.x)},${q(gk.y)}` : '', LOB_H, LOB_MAX, CHIP_DIP, LOB_PROTO].join('|');
    if (this.lobPv && this.lobPv.key === key) return this.lobPv;
    const dx = tx - b.x, dy = ty - b.y, d = len(dx, dy) || 1, ux = dx / d, uy = dy / d;
    const info = L.chip ? { shot: true, chip: true, chipC: c } : { mode: 'lob', lobPow: c, loft: true };
    const P = LOB_PROTO ? this.lobProto({ p, tx, ty, info }, d, true) : null;   // (#lobB: its own flight)
    const S = P && P.speed ? P : L.chip ? this.chipSolve(b, tx, ty, p.team, c, 0) : this.loftLaunch(d, c, true);   // (chip: no dice - the preview mustn't use the game's)
    const f = { x: b.x, y: b.y, z: Math.max(b.z, 0.05), vx: ux * S.speed, vy: uy * S.speed, vz: S.vz, skid: true, rollV: 0, chip: L.chip && !(P && P.spin), spin: P ? P.spin : 0 }, pts = [{ x: f.x, y: f.y, z: f.z }], h = 1 / 60;
    let end = null;
    for (let i = 1; i <= 300 && !end; i++) { const z0 = f.z; ballStep(f, h, false);
      if (L.chip && (f.x - p.team.goalX) * p.team.side >= 0) end = { x: f.x, y: f.y, z: f.z };   // (a chip: up to the goal line)
      else if (z0 > 0 && f.z <= 0) end = { x: f.x, y: f.y, z: 0 };
      if (end || i % 2 === 0) pts.push({ x: f.x, y: f.y, z: f.z }); }
    return (this.lobPv = { key, pts, end: end || pts[pts.length - 1] });
  },
  // the first point on the ball's path this player can reach in time
  intercept(p, speed, react = 0.12, zmax = 1.0) {                                 // lob-mechanics: zmax 1.9 = meet a lob at chest / head height
    const P = this.path, b = this.ball; if (!P) return { x: b.x, y: b.y };
    for (const pt of P) { if (pt.z > zmax) continue; if (react + len(pt.x - p.x, pt.y - p.y) / speed <= pt.t) return pt; }
    return P[P.length - 1];
  },
  placeAtFeet() {
    const b = this.ball, p = b.owner; if (!p) return;
    const sp = this.setPiece;
    if (sp && sp.kind === 'THROW-IN' && sp.taker === p && (!sp.kicked || (this.pending && this.pending.p === p))) {
      // held over his head until it leaves his hands; the ball sits on the line, he stands 0.4 m behind it, so the
      // height makes up the difference on screen (measured on PixelLab's throw-in frames: hands ~130 px above the feet)
      const top = p.y < 34; b.x = p.x; b.y = top ? 0.1 : PITCH_W - 0.1; b.z = top ? 2.2 : 1.8; b.vx = b.vy = b.vz = 0; return;
    }
    if (p.hands) { b.x = p.x + dirVec(p.face).x * 0.25; b.y = p.y; b.z = 1.1; b.vx = b.vy = b.vz = 0; return; }
    if (len(b.x - p.x, b.y - p.y) > 0.8) { const dv = dirVec(p.face); b.x = p.x + dv.x * 0.5; b.y = p.y + dv.y * 0.45; }
    b.vx = b.vy = b.vz = 0; b.z = 0;
  },
  // ======================================================================= v0.9.2 CHIP SHOT (Luca 23 Oct 15:39: "Lob in the box with the POV of
  // the attacker looking at the goal becomes a chip, if the attacker points POV away from the goal it becomes a normal
  // lob. Chips should be faster with a more aggressive curve, not just the lob mechanic into a goal"). In their box,
  // facing within ~60 degrees of the goal: LOB = CHIP. Tap = a quick dink just over the keeper; hold = more height (for a
  // keeper further out). The ball flies fast and low-arced, then dips hard after its peak (CHIP_DIP) to come down under
  // the bar - the solver picks the FASTEST flight that clears his reach. EA FC: "a chip works best when the keeper has
  // left his line or is rushing out" - against a keeper on his line it's an easy catch.
  chipCan(p, dir) {
    if (!CHIP_ON && !window.__lab) return false;                                // (waiting for the PixelLab chip animation)
    const gx = p.team.goalX; if (!(Math.abs(p.x - gx) < 16.5 && Math.abs(p.y - 34) < 20.16)) return false;   // in their penalty area
    const gxv = gx - p.x, gyv = 34 - p.y, gl = len(gxv, gyv) || 1, dl = len(dir.x, dir.y) || 1;
    return (dir.x * gxv + dir.y * gyv) / (dl * gl) > 0.5;                        // looking at the goal (within ~60 degrees)
  },
  chipShot(p, c, aimY) {
    const gx = p.team.goalX, s = p.team.side, gk = p.team.opp.players[0];
    const ay = Math.abs(aimY) > 0.2 ? aimY : gk && !gk.sentOff ? (gk.y > 34 ? -0.55 : 0.55) : 0;   // no aim: away from the keeper
    const err = rnd(-1, 1) * (0.25 + (p.sprinting ? 0.5 : 0) + (p.tired ? 0.4 : 0)) * (p === this.human && !this.demo ? 1 : this.dk(p.team).shotErr);
    const ty = clamp(34 + ay * 2.3 + err, GOAL_Y0 + 0.3, GOAL_Y1 - 0.3);
    this.kick(p, gx + s * 1.5, ty, 0, 0, 0.12, { shot: true, chip: true, chipC: clamp(c, 0, 1), power: 0.45, chipErr: err });
    if (p.kickAnim !== 'chip') p.kickAnim = MAN.kits[p.kit].anims[`pass-${DIRS[p.face]}`] ? 'pass' : 'kick';   // (a kit without the PixelLab chip: the pass frames)
    this.ramiSay('skill', { text: ['A CHIP!\nCHEEKY!', 'OH, THE DINK!\nOVER THE TOP!', 'HE TRIES TO\nCHIP HIM!'][Math.floor(Math.random() * 3)], expr: 'laugh' }, 2);
  },
  // the chip's flight: from the ball to (tx, ty) on the goal line - fast as it can be while clearing the keeper's reach
  // (2.7 m + more with a longer hold) where he stands, then dropping to ~1.3-1.7 m as it crosses the line.
  // jit: the dice on that height (t-005: the charge arc's preview passes 0, so drawing it never uses the game's dice)
  chipSolve(b, tx, ty, team, c, jit) {
    const gk = team.opp.players[0], dx = tx - b.x, dy = ty - b.y, d = len(dx, dy) || 1, ux = dx / d, uy = dy / d, h = 1 / 120;
    const off = gk && !gk.sentOff ? (gk.x - team.opp.ownGoalX) * team.opp.side : 0;   // (a keeper on his line can't be chipped - the ball has nowhere to drop)
    const along = off > 3.5 ? (gk.x - b.x) * ux + (gk.y - b.y) * uy : -1, reachZ = 2.8 + c * 0.8, minPeak = 2.4 + c * 0.9, zg = clamp(1.3 + c * 0.4 + (jit ?? (Math.random() - 0.5)) * 0.3, 0.9, 2.1);
    const sp = LOB_PROTO === 'B' ? CHIP_SPIN : undefined;                        // (t-002 prototype B: a backspin scoop instead of the dip)
    const fly = (v, vz) => { const q = { x: 0, y: 0, z: Math.max(b.z, 0.05), vx: v, vy: 0, vz, skid: true, rollV: 0, chip: !sp, spin: sp }; let atK = null;
      for (let t = 0; t < 3; t += h) { const ox = q.x; ballStep(q, h, false); if (atK == null && along > 0 && q.x >= along) atK = q.z; if (q.x >= d - 1.5) return { z: q.z, atK, peak: q.peak }; if (q.z <= 0 && t > 0.05) return { z: -1, atK }; q.peak = Math.max(q.peak || 0, q.z); }
      return { z: -1, atK }; };
    let best = null;
    for (let T = 0.42; T <= 1.6 && !best; T += 0.06) {
      const v = (d - 1.5) / T * 1.06; let lo = 0.5, hi = 22, r = null;
      for (let i = 0; i < 18; i++) { const mid = (lo + hi) / 2, f = fly(v, mid); if (f.z < 0 || f.z < zg) lo = mid; else { hi = mid; r = { vz: mid, f }; } }
      if (r && (r.f.peak || 0) >= minPeak && (along < 1.5 || r.f.atK == null || r.f.atK >= reachZ)) best = { speed: v, vz: r.vz };   // (a chip always goes up - even if he's on his line, when it's simply an easy catch)
    }
    return best || { speed: (d - 1.5) / 1.6 * 1.06, vz: 9 };                       // (keeper right on top of him: a high one and hope)
  },

  // t-002 prototype B (#lobB; step 2 builds the real thing from it): three kicks with backspin - a tap is a high
  // floated lob, SPRINT + LOB a driven lob (low, fast, onto his feet), the chip a scoop that floats over the keeper.
  // (t-005: prototypes A and C are gone - A's fixes are the game now, C wasn't picked)
  lobProto(k, d, quick) {
    const pow = k.info.lobPow, mine = k.p === this.human && !this.demo;
    if (k.info.chip) return { spin: CHIP_SPIN };                                 // (chipSolve already flew it with the spin)
    const driven = mine && pow == null && Input.held('sprint');
    const apex = driven ? clamp(1.8 + d * 0.05, 2.4, 3.8) : pow != null ? 4.5 + pow * 7 : clamp(3 + d * 0.12, 4.5, 9);
    const spin = driven ? 8 : 30;
    return { ...lobSolve(Math.max(4, d - (driven ? 0.5 : pow != null ? 1 : 2)), apex, spin, quick), spin };   // (quick: t-005's charge arc)
  },
  ballPhysics(dt) {
    const b = this.ball, gp = gpOn();
    if (gp) this.netStep(dt);                                                   // t-013: the mesh rings on after the ball has gone
    if (b.owner && b.owner.hands) return;
    if (gp && b.gpIn) { b.vx = b.gpIn.vx; b.vz = b.gpIn.vz; b.gpIn = null; }   // (t-013: the net takes the pace off now, not the goal line - netRipple)
    const owned = !!b.owner, sub = 3, h = dt / sub;
    for (let i = 0; i < sub; i++) {
      const ox = b.x, oy = b.y, oz = b.z;
      ballStep(b, h, owned);
      if (gp) { if (!owned) this.gpWood(b, ox, oy, oz); this.gpNet(b, h, oz); }   // t-013 GOAL PHYSICS (core.js GP)
      else if (!owned) this.posts(b, ox);
      if (this.dead) {                                                          // out of play: the boards stop it
        if (b.x < -4 || b.x > PITCH_L + 4) { b.x = clamp(b.x, -4, PITCH_L + 4); b.vx *= -0.25; }
        if (b.y < -3 || b.y > PITCH_W + 3) { b.y = clamp(b.y, -3, PITCH_W + 3); b.vy *= -0.25; }
      }
      if (b.inNet && !gp) { const right = b.netRight ?? (b.netRight = b.x > 52.5); const lo = right ? PITCH_L + 0.2 : -1.4, hi = right ? PITCH_L + 1.4 : -0.2;
        if (b.x < lo || b.x > hi) { b.x = clamp(b.x, lo, hi); b.vx *= -0.12; b.vy *= 0.7; b.vz *= 0.5; }       // back net: it gives and drops
        if (b.y < GOAL_Y0 + 0.2 || b.y > GOAL_Y1 - 0.2) { b.y = clamp(b.y, GOAL_Y0 + 0.2, GOAL_Y1 - 0.2); b.vy *= -0.2; }
        if (b.z > 2.2) { b.z = 2.2; b.vz = -Math.abs(b.vz) * 0.2; } b.vy *= 0.97; }
    }
    b.roll += len(b.vx, b.vy) * dt * (b.skid ? 0.6 : 1);                       // a skidding ball turns less
  },
  posts(b, ox) {
    for (const gx of [0, PITCH_L]) {
      if ((ox - gx) * (b.x - gx) > 0 || b.inNet) continue;          // didn't cross this goal line
      for (const py of [GOAL_Y0, GOAL_Y1]) {
        if (Math.abs(b.y - py) < 0.18 && b.z < BAR_Z + 0.1) { b.vx = -b.vx * 0.6; b.x = ox; this.say('', 'OFF THE POST!', 0.9); this.flagReplay('OFF THE POST!'); SFX.post(); SFX.ooh(); return; }
      }
      if (b.y > GOAL_Y0 && b.y < GOAL_Y1 && Math.abs(b.z - BAR_Z) < 0.15) { b.vz = -Math.abs(b.vz) * 0.6; b.vx *= -0.4; b.x = ox; this.say('', 'OFF THE BAR!', 0.9); this.flagReplay('OFF THE BAR!'); SFX.post(); SFX.ooh(); }
    }
  },

  // ======================================================================= t-013 GOAL PHYSICS (behind GOAL_PHYS, core.js)
  // Luca 24 Oct 14:04: "I want the goal to have more dynamic feedback when the ball hits the post. If there's enough of
  // the top post and there's enough power, it can bounce ... back into close to the box ... so then maybe a player can
  // catch it and start an aerial battle or a special move ... give it actual physics". Based on how football games do
  // it (FIFA / PES / Rocket League-style arcade physics, in words only - see the PR): the posts and bar are round, so the
  // rebound follows from WHERE on the round tube the ball meets it - the normal from the tube's axis to the ball's
  // centre. The part of the ball's speed along that normal comes back with restitution e (less on a hard hit: the ball
  // squashes); the part along the tube carries on, less a little friction that leaves the ball spinning. A glancing
  // touch (small normal share) carries on in or wide, a square one comes back. Swept test, so a 30 m/s ball can't skip
  // through a 12 cm post between two steps.
  gpWood(b, ox, oy, oz) {
    if (b.gpSpin && (b.bounced || 0) > b.gpSpin.n) { b.vx += b.gpSpin.x; b.vy += b.gpSpin.y; b.gpSpin = null; }   // the spin grips on its first bounce
    if (b.inNet) return;
    const R = GP.postR + GP.ballR;
    for (const gx of [0, PITCH_L]) {
      if (Math.min(Math.abs(ox - gx), Math.abs(b.x - gx)) > 1) continue;
      for (const py of [GOAL_Y0, GOAL_Y1]) {                                    // the posts: upright tubes (a circle in the x-y plane)
        const t = gpSweep(ox, oy, b.x, b.y, gx, py, R); if (t == null) continue;
        const z = oz + (b.z - oz) * t; if (z > BAR_Z + 0.02) continue;         // (over the top of the post: the bar's end decides)
        b.x = ox + (b.x - ox) * t; b.y = oy + (b.y - oy) * t; b.z = z;
        if (this.gpBounce(b, b.x - gx, b.y - py, 0, 'post', gx)) return;
      }
      const t = gpSweep(ox, oz, b.x, b.z, gx, BAR_Z, R); if (t == null) continue;   // the bar: a tube across (a circle in the x-z plane)
      const y = oy + (b.y - oy) * t; if (y < GOAL_Y0 - 0.02 || y > GOAL_Y1 + 0.02) continue;
      b.x = ox + (b.x - ox) * t; b.y = y; b.z = oz + (b.z - oz) * t;
      if (this.gpBounce(b, b.x - gx, 0, b.z - BAR_Z, 'bar', gx)) return;
    }
  },
  // the rebound off a post / the bar: (nx, ny, nz) from the tube's axis to the ball's centre
  gpBounce(b, nx, ny, nz, what, gx) {
    const n = Math.hypot(nx, ny, nz) || 1; nx /= n; ny /= n; nz /= n;
    const vn = b.vx * nx + b.vy * ny + b.vz * nz; if (vn >= 0) return false;    // already moving away from it
    const vin = -vn, tx = b.vx - vn * nx, ty = b.vy - vn * ny, tz = b.vz - vn * nz, vt = Math.hypot(tx, ty, tz), sq = vin / (Math.hypot(vin, vt) || 1);   // sq: 1 square on, 0 a glancing touch
    const again = b.gpWoodT != null && this.gpT - b.gpWoodT < 0.4;              // a second touch straight after: it dies (no ping-pong)
    const e = (GP.woodE - GP.woodEDrop * clamp((vin - 8) / 20, 0, 1)) * (again ? GP.woodAgain : 1);
    const dvt = vt > 0 ? Math.min(GP.woodMu * (1 + e) * vin, 0.4 * vt) : 0, kt = vt > 0 ? 1 - dvt / vt : 1;   // friction: at most until it rolls round the tube
    b.vx = tx * kt + nx * e * vin; b.vy = ty * kt + ny * e * vin; b.vz = tz * kt + nz * e * vin;
    if (!again && (what === 'post' || nz > -0.3)) b.vz += (what === 'post' ? GP.postLift : GP.barLift) * vin * sq * sq;   // arcade: a square, hard hit pops it up to meet
    b.gpSpin = vt > 0 ? { x: -tx / vt * dvt * GP.spinGrip, y: -ty / vt * dvt * GP.spinGrip, n: b.bounced || 0 } : null;   // e.g. under the bar: backspin, it can check back out off the line
    b.gpWoodT = this.gpT; b.skid = true; b.rollV = 0; b.chip = false; b.lob = false; b.ring = null; b.save = null; b.target = null;
    if (b.spin || b.curl) { b.spin = 0; b.curl = 0; }
    if (b.special) { b.special = 0; b.spP = 0; }                               // (off the woodwork it's an ordinary ball)
    this.gpLast = { what, sq, vin: Math.hypot(vin, vt), vout: Math.hypot(b.vx, b.vy, b.vz), t: this.gpT };
    if (!again) {
      const st = this.gpStats || (this.gpStats = { wood: 0, back: 0, pops: 0, net: 0 }); st.wood++; this.gpWatch = { gx, t: this.gpT };
      const m = what === 'post' ? 'OFF THE POST!' : 'OFF THE BAR!';
      this.say('', m, 0.9); this.flagReplay(m); SFX.post(); if (vin > 6) SFX.ooh();
    }
    return true;
  },
  // THE NET (Luca: "a net through which the ball can interact with slight give ... so it can dramatically hit the net and
  // have dynamism"): not a wall but a spring-damper, as the games do it - the ball sinks into the mesh, slows over a short
  // distance (harder = deeper), is held a beat and drops. The planes are where the art draws them (GP.netD deep, the roof
  // sloping from the bar to GP.netBZ). Inside a goal: back, roof and both sides. From outside: the side netting and the
  // top of the roof (a ball that went wide or over - already a dead ball - no longer passes through the mesh).
  gpNet(b, h, oz) {
    if (b.owner) { b.gpHold = 0; b.gpSpin = null; return; }
    const gx = b.x < PITCH_L / 2 ? 0 : PITCH_L, s = gx ? 1 : -1, u = (b.x - gx) * s, D = GP.netD, r = GP.ballR;   // u: metres behind the goal line
    if (u <= 0 || u > D + GP.netMax + 0.3) { b.gpAbove = b.gpOut = false; return; }
    const side = gx ? 'R' : 'L', zr = BAR_Z - (BAR_Z - GP.netBZ) * clamp(u / D, 0, 1), ay = Math.abs(b.y - 34);
    if (b.gpHold > 0) { b.gpHold -= h; const k = Math.exp(-GP.holdDamp * h); b.vx *= k; b.vy *= k; b.vz = b.vz * k + G * h * 0.75; }   // held a beat
    if (b.inNet) {
      if (u < 0.2) { b.x = gx + s * 0.2; if (b.vx * s < 0) b.vx *= -0.12; }    // it stays in the goal (as before)
      this.gpPlane(b, h, side, 'back', u - (D - r), -s, 0, 0);
      this.gpPlane(b, h, side, 'roof', b.z - (zr - r), 0, 0, -1);
      this.gpPlane(b, h, side, 'far', GOAL_Y0 + r - b.y, 0, 1, 0);
      this.gpPlane(b, h, side, 'near', b.y - (GOAL_Y1 - r), 0, -1, 0);
      return;
    }
    if (u > D) { b.gpAbove = b.gpOut = false; return; }
    if (ay >= 3.66 + r) b.gpOut = true;                                         // (it came at the side netting from outside)
    if (ay < 3.66 && oz >= zr + r - 0.02) b.gpAbove = true;                     // (it came down onto the roof from above)
    if (b.gpOut && ay < 3.66 + r) this.gpPlane(b, h, side, b.y < 34 ? 'farOut' : 'nearOut', 3.66 + r - ay, 0, b.y < 34 ? -1 : 1, 0);
    else if (b.gpAbove && ay < 3.66) this.gpPlane(b, h, side, 'top', zr + r - b.z, 0, 0, 1);
  },
  // one plane of mesh: p = how far the ball has pushed past where the mesh hangs, (nx, ny, nz) = the way the mesh pushes back
  gpPlane(b, h, side, key, p, nx, ny, nz) {
    if (p <= 0) return;
    if (p > GP.netMax) {                                                        // fully stretched: it goes no further
      const c = p - GP.netMax, vn = b.vx * nx + b.vy * ny + b.vz * nz; p = GP.netMax;
      b.x += nx * c; b.y += ny * c; b.z += nz * c; if (vn < 0) { b.vx -= vn * nx; b.vy -= vn * ny; b.vz -= vn * nz; }
    }
    const vin = -(b.vx * nx + b.vy * ny + b.vz * nz), F = Math.max(0, GP.netK * p + GP.netC * vin);   // a net only pushes, never pulls
    b.vx += nx * F * h; b.vy += ny * F * h; b.vz += nz * F * h;
    const vn = b.vx * nx + b.vy * ny + b.vz * nz, k = Math.exp(-GP.netFric * h);   // the mesh grips what slides along it
    b.vx = nx * vn + (b.vx - nx * vn) * k; b.vy = ny * vn + (b.vy - ny * vn) * k; if (b.z > 0) b.vz = nz * vn + (b.vz - nz * vn) * k;
    const st = this.netS || (this.netS = { L: [], R: [] }), L = st[side];
    const hx = b.x - nx * (GP.ballR - p), hy = b.y - ny * (GP.ballR - p), hz = b.z - nz * (GP.ballR - p);   // where it meets the mesh at rest
    let q = L.find(o => o.key === key && (o.touch > 0 || Math.hypot(o.hx - hx, o.hy - hy, o.hz - hz) < 0.6));
    if (!q) {
      q = { key, hx, hy, hz, d: p, dv: 0, touch: 1, age: 0, peak: p, vin0: vin, sx: -nx * PX_X * scaleAt(hy), sy: -ny * PX_Y + nz * PX_H };
      L.push(q); if (L.length > 3) L.shift();
      if (vin > 3) { const S = this.gpStats || (this.gpStats = { wood: 0, back: 0, pops: 0, net: 0 }); S.net++; }
      if (/Out|top/.test(key) && vin > 2) { SFX.net(); this.say('', key === 'top' ? 'ON TOP OF THE NET!' : 'SIDE NETTING!', 0.8); }
    } else {
      if (!q.held && vin <= 0 && q.vin0 > 6) { q.held = true; if (!(b.gpHold > 0)) b.gpHold = GP.netHold * clamp(q.vin0 / 25, 0.3, 1); }   // the deepest point: caught
      q.dv = q.touch > 0 ? (p - q.d) / h : q.dv; q.d = p; q.touch = 1; q.peak = Math.max(q.peak, p); q.hx += (hx - q.hx) * 0.3; q.hy += (hy - q.hy) * 0.3; q.hz += (hz - q.hz) * 0.3; }
  },
  // once a frame: the mesh where the ball has left it rings on (a damped spring) and settles; the bulges fade out.
  // Also keeps the woodwork score for the soak (a rebound that is still in play, out in the field, 1.2 s later)
  netStep(dt) {
    this.gpT = (this.gpT || 0) + dt;
    const W = this.gpWatch;
    if (W && this.gpT - W.t > 1.2) { const b = this.ball; this.gpWatch = null; if (!this.dead && !b.inNet && Math.abs(b.x - W.gx) > 3) this.gpStats.back++; }
    const st = this.netS; if (!st) return;
    const w = 2 * Math.PI * GP.netHz, z = GP.netZeta;
    for (const L of [st.L, st.R]) for (let i = L.length - 1; i >= 0; i--) {
      const q = L[i]; q.age += dt;
      if (q.touch > 0) { q.touch--; continue; }
      for (let j = 0, hh = dt / 2; j < 2; j++) { q.dv += (-w * w * q.d - 2 * z * w * q.dv) * hh; q.d += q.dv * hh; }
      if (Math.abs(q.d) < 0.004 && Math.abs(q.dv) < 0.05 && q.age > GP.ripTau * 3) L.splice(i, 1);
    }
  },
  // the keeper got to it but couldn't hold it (Luca: "when he blocks a lot of shots but can't grab it, but it breaks his
  // guard, a lot should go more up dramatically. So then if there is an attacker, he could capitalize ... make sure it
  // doesn't become OP"): SOMETIMES the ball loops UP off him instead - a parry a few metres out into his box (the
  // follow-up chance), a broken guard on towards the goal (the bar, over, just under) or back out over him. Its own small
  // function so the keeper work (t-007) only has to keep the one call. kind 'parry' | 'break'; true when it popped.
  gpPop(gk, kind, spd) {
    if (!gpOn() || !gk || gk.sentOff) return false;
    const b = this.ball, lvl = this.gpLvl(kind === 'parry' ? gk.team.opp : gk.team);   // the side the pop-up helps
    const ch = (kind === 'parry' ? GP.parryPop * clamp((spd - 12) / 14, 0.25, 1) : GP.breakPop) * (lvl === 'easy' ? GP.easyK : 1);   // fair: on EASY the computer gets fewer
    if (Math.random() >= ch) return false;
    const R = a => rnd(a[0], a[1]), out = gk.team.side;
    b.vz = R(GP.popVz); b.z = Math.max(b.z, 0.5);
    if (kind === 'parry') { const sy = Math.sign(b.vy) || (Math.random() < 0.5 ? -1 : 1); b.vx = out * R(GP.popOut); b.vy = sy * R(GP.popSide); }
    else {
      const hv = len(b.vx, b.vy) || 1, ux = b.vx / hv, uy = b.vy / hv;
      if (Math.random() < 0.55) { const v = R(GP.breakOn); b.vx = ux * v; b.vy = uy * v; }                         // on: the bar, over, or just under
      else { const v = R(GP.breakBack); b.vx = -ux * v; b.vy = -uy * v + rnd(-1.5, 1.5); }                          // back out over him
      this.say('GUARD BROKEN!', 'IT LOOPS UP OFF HIM!', 1.2);
    }
    b.skid = true; b.rollV = 0; b.last = gk.team; b.save = null; b.target = null; b.special = 0; b.spP = 0; b.saveable = null; b.ring = null; b.chip = false; b.lob = false;
    if (b.spin || b.curl) { b.spin = 0; b.curl = 0; }
    gk.cool = Math.max(gk.cool || 0, 0.5);
    const st = this.gpStats || (this.gpStats = { wood: 0, back: 0, pops: 0, net: 0 }); st.pops++; this.gpLastPop = { kind, vz: b.vz, t: this.gpT };
    return true;
  },
  // the level of a side, as dk() picks it (the computer's side at your level; the soak's / trainer's own pair)
  gpLvl(team) {
    const o = window.__diffTeams, s = team === this.home ? 'home' : 'away';
    if (o && o[s]) return o[s].lvl || 'normal';
    return !this.demo && team !== this.home ? DIFF_LEVEL : 'base';
  },
  // dribbling: the ball is NOT glued to the foot. The carrier touches it ahead, it rolls (and slows), he catches
  // up and touches it again. Faster running = bigger touches = easier to nick. Standing still = ball at the feet.
  dribble(p, dt) {
    const b = this.ball;
    if (p.hands && p.state === 'dive') { b.x = p.x; b.y = p.y + (p.diveDir || 0) * 0.6; b.z = Math.max(0.15, (p.diveZ ?? 0.6) * clamp(p.stateT / 0.45, 0, 1)); b.vx = b.vy = b.vz = 0; return; }
    if (p.hands) { b.x = p.x + dirVec(p.face).x * 0.25; b.y = p.y; b.z = 1.1; b.vx = b.vy = b.vz = 0; return; }
    // v0.8.1 DRIBBLE (Luca: "when you have the ball you don't move so smoothly"): like FIFA / PES the ball rides just
    // in front of his boot and he knocks it on in rhythm with his stride - short quick touches when he's slow, longer
    // ones at a sprint (that's when it can be nicked). The ball eases after him, it never snaps; he turns in arcs.
    const rx = b.x - p.x, ry = b.y - p.y, dist = len(rx, ry);
    if (dist > 2.6 * BALL_MAG) { b.owner = null; b.target = null; return; }     // too heavy a touch: it's a loose ball now (BALL_MAG: the Lab's magnetism knob, 1 in the game)
    if (p.state === 'kick') return;                                              // let it roll into the swing
    const sp = p.speed, want = p.wantDir;
    const dir = sp > 0.6 ? { x: p.vx / sp, y: p.vy / sp } : (want || dirVec(p.face));
    p.touchT -= dt;
    if (sp > 0.6 && p.touchT <= 0) { p.touchT = clamp(0.5 - sp * 0.035, 0.24, 0.45); p.touchPush = ((p.sprinting ? 0.6 : 0.2) + sp * 0.02) / BALL_MAG; }
    p.touchPush = (p.touchPush || 0) * Math.exp(-dt * 5);
    const lead = (sp < 0.6 ? 0.5 : clamp(0.42 + sp * 0.04, 0.45, 0.75)) / BALL_MAG + p.touchPush;
    const tx = p.x + dir.x * lead, ty = p.y + dir.y * lead * 0.84;               // (in front of the boot, like at kick-off)
    const k = (sp < 0.6 ? 9 : 7) * BALL_MAG;
    b.vx = p.vx + (tx - b.x) * k; b.vy = p.vy + (ty - b.y) * k; b.skid = false; if (b.z <= 0) b.vz = 0;
  },
  // the carrier runs where you point, turning in an arc (tighter when he's slower); only an about-turn stops him first.
  // If the ball got away from him (a knock, a deflection) he goes and gets it.
  carrySteer(p, dx, dy, v, dt, acc = ACC) {
    const b = this.ball, rx = b.x - p.x, ry = b.y - p.y, d = len(rx, ry);
    if (b.owner === p && !p.hands && d >= 1.7) { p.steer(rx / d * v, ry / d * v, dt, acc); return; }
    const sp = p.speed, dl = len(dx, dy) || 1;
    if (sp < 1.0) { p.steer(dx / dl * v, dy / dl * v, dt, acc); return; }
    const cur = Math.atan2(p.vy, p.vx); let da = Math.atan2(dy, dx) - cur;
    while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
    if (Math.abs(da) > 2.4) { p.steer(dx / dl * v, dy / dl * v, dt, acc); return; }   // drag-back: plant and go the other way
    const rate = (sp < 3 ? 9 : sp < 5.6 ? 6 : 4.2) * dt, na = cur + clamp(da, -rate, rate);
    const tv = v * (1 - 0.22 * Math.min(1, Math.abs(da) / 2.4)), ns = sp + clamp(tv - sp, -DEC * 0.45 * dt, acc * dt);
    p.vx = Math.cos(na) * ns; p.vy = Math.sin(na) * ns;
  },
  pickups(pbx = this.ball.x) {
    const b = this.ball; if (b.inNet || this.dead) return;                      // nobody plays a dead ball
    const sp = len(b.vx, b.vy);
    if (b.owner) {                                                               // a loose touch can be nicked
      const o = b.owner; if (o.hands) return;
      if (this.gkSmotherTake(o)) return;                                         // t-017: a keeper diving at his feet (keeper.js)
      const od = len(o.x - b.x, o.y - b.y); if (od < 0.85) return;
      for (const p of o.team.opp.players) {
        if (p.cool > 0 || p.stun > 0 || p.state === 'slide') continue;
        const d = len(p.x - b.x, p.y - b.y); if (d < 0.7 && b.z < 0.8 && d < od) { this.gain(p, sp); return; }
      }
      return;
    }
    let best = null, bd = 1e9, hit = null, viaChest = false;
    for (const p of this.all) {
      if (p.sentOff) continue;
      const d = len(p.x - b.x, p.y - b.y);
      if (b.special && !p.keeper && b.spTeam && p.team !== b.spTeam && d < 0.9 && b.z < 1.9 && p.pierced !== b.spT && p.state !== 'slide') {   // v0.8.6 a special meets a defender (even one stood watching it)
        const sv = len(b.vx, b.vy) || 1, lat = Math.abs(((p.x - b.x) * b.vy - (p.y - b.y) * b.vx) / sv);   // how far off the ball's line he stands
        if (lat < 0.8) { p.pierced = b.spT;
          if (b.pierce > 0) { this.pierce(p); continue; }
          if (lat < 0.55) { b.special = 0; b.spP = 0; hit = p; continue; }     // square in front: blocked, deflected off him
        }
      }
      if (p.cool > 0 || p.stun > 0 || p.state === 'slide') { if (!(p.keeper && p.spSave && (b.special || b.saveable))) continue; }
      if (b.lob && b.vz > 0 && b.z < 1.6 && p.team !== b.last) {                   // lob-mechanics: a lob leaving the boot - a presser could take it off his
        const sv = len(b.vx, b.vy) || 1, along = ((p.x - b.x) * b.vx + (p.y - b.y) * b.vy) / sv, lat = Math.abs(((p.x - b.x) * b.vy - (p.y - b.y) * b.vx) / sv);   // foot from
        if (!(along > 0.1 && lat < 0.45)) continue;                                // behind or the side (a third of the computer's lobs). Now only a man
      }                                                                            // square in front of it can block it
      const box = p.keeper && Math.abs(p.x - p.team.ownGoalX) < 16.5 && Math.abs(p.y - 34) < 20.2;
      const reach = box ? 1.3 : (b.target === p && b.last === p.team ? 1.25 : 0.8), zmax = box ? 2.6 : 0.9;   // v0.7: the man you passed to reaches for it
      if (p.keeper && p.spSave && ((b.special && b.spTeam && p.team !== b.spTeam) || (!b.special && b.saveable && b.saveable !== p.team))) {   // v0.8.6 SPECIAL SAVE v SPECIAL SHOT, on his line (v0.9.0: or v a normal shot)
        if (!((pbx - p.x) * (b.x - p.x) <= 0 || Math.abs(b.x - p.x) < 0.3)) continue;
        if (Math.abs(b.y - 34) > 4.3 || b.z > 3.2) { p.spSave = 0; continue; }   // off target: nothing to save
        const K = SAVE_POWER[p.spSave - 1], ok = this.clash(p);
        if (!ok) { this.guardBreak(p); if (this.gpPop(p, 'break', len(b.vx, b.vy))) return; continue; }   // (t-013: or it loops up off him)
        if (ok === 'hand') {                                                     // t-007: too strong to stop, but he gets a hand to it: over or wide
          p.y = clamp(b.y - Math.sign(b.y - p.y || 1) * 0.5, 29.6, 38.4); p.vx = p.vy = 0;
          this.gkDeflect(p, b.z > 1.3 || Math.random() < 0.5 ? 'tip' : 'wide'); b.special = 0; b.spP = 0;
          this.gkSaveAnim(p); this.gkCount(p.team, 'parried'); this.flagReplay('A HAND TO IT!', p); this.shotSaved(p); return;
        }
        p.y = clamp(b.y, 30.6, 37.4); p.vx = p.vy = 0;
        if ((b.spP || 0) < K * 0.8) { b.special = 0; best = p; bd = 0; viaChest = false; this.gkCount(p.team, 'held'); break; }   // held
        // fisted away. t-007 (Luca: "from special saves that dont fully save a ball maybe if the ball is too strong it goes
        // over to give a corner"): a special he only just matched goes over the bar or round the post 60% of the time
        if (Math.random() < 0.6) this.gkDeflect(p, b.z > 1.3 ? 'tip' : 'wide');
        else { const rel = b.y - 34 || rnd(-1, 1);
          b.vx = -b.vx * 0.2 + p.team.side * rnd(3, 5); b.vy = Math.sign(rel) * rnd(5, 9); b.vz = rnd(3, 5); b.z = Math.max(b.z, 0.4);
          b.skid = true; b.rollV = 0; b.last = p.team; b.save = null; b.target = null; p.cool = 0.5; b.ring = null;   // (t-005: touched - no landing ring)
          this.gpPop(p, 'parry', 30); }                                             // (t-013: fisted UP sometimes - a special is always a hard one; t-007's tips / wides stay corners)
        b.special = 0; b.spP = 0;
        if (MAN.kits[p.kit].anims['punch-S']) p.setState('punch', 0.45); this.gkCount(p.team, 'parried');
        this.flagReplay('WHAT A SAVE!', p); this.shotSaved(p); return;
      }
      if (b.save && b.save.gk === p) {                                           // a shot at this keeper: his body and gloves decide
        const hit = this.keeperTouch(p, pbx);
        if (!hit) continue;                                                       // not at him yet - or it beat him
        // v0.8 KEEPER GUARD: power shots (held K) and specials wear him down; one that hits harder than what he has left goes through
        const dmg = b.special ? (GUARD_SP[b.special] || 0.5) * clamp((b.spP || SP_POWER[b.special - 1]) / SP_POWER[b.special - 1], 0.3, 1) : (b.power > 0.72 ? GUARD_POWER : 0);   // v0.8.6: a weakened special hits him less
        if (dmg) {
          const g = p.guard ?? 1;
          if (dmg > g + 1e-6) { this.guardBreak(p); if (this.gpPop(p, 'break', len(b.vx, b.vy))) return; continue; }   // (t-013: or it loops up off him)
          p.guard = g - dmg; p.guardT = 0; if (p.guard < GUARD_POWER) this.say('', 'THE KEEPER IS RATTLED!', 0.9);
        }
        if (hit === 'catch') { this.gkCount(p.team, 'held'); if ((p.state === 'dive' && len(b.vx, b.vy) > 20) || len(b.vx, b.vy) > 28) this.flagReplay('WHAT A SAVE!', p); best = p; bd = 0; viaChest = false; break; }
        const spd = len(b.vx, b.vy); this.gkCount(p.team, 'parried');           // not held: t-007 over the bar, round the post, or pushed out to the side
        this.gkDeflect(p, hit);
        if (b.z > 1.5 && p.state !== 'dive' && MAN.kits[p.kit].anims['punch-S']) p.setState('punch', 0.45);   // fists it away
        if (b.special >= 2) {                                                     // v0.7: a big special knocks him flat (PixelLab 'blasted back')
          if (MAN.kits[p.kit].anims['blasted-E']) { p.setState('blasted', 1.3); p.stun = 1.3; p.face = p.team.side > 0 ? 0 : 4; p.vx = p.team.side * -2.5; p.vy = 0; }
          else if (p.state !== 'dive') { p.setState('fall', 0.7); p.vx = -b.vx * 0.05; } }
        b.special = 0;
        if (hit !== 'tip' && hit !== 'wide') this.gpPop(p, 'parry', spd);        // t-013: a plain parry sometimes loops UP off him instead (GOAL_PHYS; t-007's tips / wides stay corners)
        this.say(spd > 24 ? 'WHAT A SAVE!' : '', hit === 'tip' ? 'TIPPED OVER THE BAR!' : hit === 'wide' ? 'PARRIED ROUND THE POST!' : 'PARRIED!', 0.8); if ((p.state === 'dive' && spd > 20) || spd > 28) this.flagReplay('WHAT A SAVE!', p); this.shotSaved(p); return;
      }
      if (box && !b.save && b.z > 1.6 && b.z < 3.15 && d < 1.3 && b.last !== p.team && !this.gkUnread(p)) {   // t-007: a high ball (a lob, a cross) he goes up for
        const a = this.gkAerial(p);
        if (a === 'catch') { best = p; bd = 0; viaChest = false; break; }
        if (a === 'done') return;
        if (a === 'skip') continue;
      }
      const smax = box ? 40 : (b.target === p ? 26 : 17);                       // the intended receiver can take a firm ball
      // chest / thigh control of a dropping ball (headers come with the v0.2 animations)
      const chest = !box && b.z >= zmax && b.z < 1.7 && d < 0.8 && (b.target === p ? sp < 16 : sp < 9);
      if (chest && d < bd) { bd = d; best = p; viaChest = true; continue; }
      if (d < reach && b.z < zmax) { if (sp < smax) { if (d < bd) { bd = d; best = p; } } else if (d < 0.55 && !hit) hit = p; }
      else if (d < 0.5 && b.z < 1.9 && !hit) hit = p;                            // the ball hits his body / head
    }
    if (best && viaChest && b.z > 0.9 && best.team.opp.players.some(o => !o.keeper && o.stun <= 0 && len(o.x - best.x, o.y - best.y) < 1.0) && Math.random() < 0.5) {
      hit = best; best = null; hit.stun = 0.25;                                  // challenged in the air: it runs loose
    }
    if (best) { const ivx = b.vx, ivy = b.vy; this.gain(best, sp); if (viaChest && !best.hands) { best.setState('trap', 0.32); best.face = dirIndex(-ivx || best.team.side, -ivy); } }
    else if (hit) {                                                              // deflection: no more balls passing through people
      const d = len(b.x - hit.x, b.y - hit.y) || 0.01, nx = (b.x - hit.x) / d, ny = (b.y - hit.y) / d, vn = b.vx * nx + b.vy * ny;
      if (vn < 0) { b.vx -= 1.4 * vn * nx; b.vy -= 1.4 * vn * ny; }
      b.vx *= 0.6; b.vy *= 0.6; b.vz = Math.abs(b.vz) * 0.3 + 0.6; b.z = Math.max(b.z, 0.05);
      b.skid = true; b.rollV = 0; hit.cool = 0.25; b.last = hit.team; b.target = null; b.lob = false;
      if (b.spin || b.curl) { b.spin = 0; b.curl = 0; }                          // (t-002 prototype: a deflection kills the spin)
      if (b.cv) b.cv = 0;                                                        // (t-011: and a curving pass's)
      b.ring = null;                                                             // (t-005: touched - no landing ring)
    }
  },
  // t-007: where the ball goes off a keeper's hands (his touch is his side's last touch, so 'tip' and 'wide' are corners):
  //  'tip'   up and over the bar (aimed to clear it by ~0.6 m at the goal line)
  //  'wide'  round the post: it crosses the goal line 0.7-2.4 m outside the near post
  //  'punch' a high ball fisted clear, out and up
  //  'parry' pushed out to the side of the box, away from the middle (not back into it)
  // Well off his line a tip (over 9 m out) or a round-the-post (over 14 m: a 1v1 out at the edge of his box) becomes a
  // parry: there's no goal behind him to put it past. Off his line it carries on faster (up to ~60% of its pace), so
  // it still gets there: no looping balloon.
  gkDeflect(p, how) {
    const b = this.ball, side = p.team.side, H = Math.max(0, (b.x - p.team.ownGoalX) * side), sp = len(b.vx, b.vy);
    const s = Math.sign(b.y - 34) || Math.sign(b.y - p.y) || (Math.random() < 0.5 ? -1 : 1);   // the near post's side
    const tip = how === 'tip' && H < 9, wide = how === 'wide' && H < 14;
    this.gkCount(p.team, tip || wide ? 'kOut' : 'kIn');                         // (the soak: touches turned out v kept in play)
    if (tip) {
      const v1 = Math.max(rnd(2.5, 4.5), Math.min(H / 0.42, sp * 0.55)), T = Math.max(0.12, H / v1);
      b.vx = -side * v1; b.vy = b.vy * 0.25 + rnd(-0.6, 0.6); b.vz = clamp((BAR_Z + 0.6 - b.z + 0.5 * G * T * T) / T, 3.2, 9);
    } else if (wide) {
      const ty = 34 + s * (3.66 + rnd(0.7, 2.4)); let v1 = Math.max(rnd(3.5, 6.5), Math.min(H / 0.5, sp * 0.6)), T = Math.max(0.12, H / v1);
      if (Math.abs(ty - b.y) / T > 12) { T = Math.abs(ty - b.y) / 12; v1 = H / T; }
      b.vx = -side * v1; b.vy = (ty - b.y) / T; b.vz = rnd(0.6, 2.2);
    } else if (how === 'punch') {
      b.vx = side * rnd(9, 14); b.vy = s * rnd(2, 6) + b.vy * 0.2; b.vz = rnd(4, 6.5);
    } else {
      b.vx = side * rnd(1.5, 3.5) - b.vx * 0.1; b.vy = s * rnd(5, 9) + b.vy * 0.15; b.vz = rnd(1.5, 4) + (b.z > 1.6 ? 2 : 0);
    }
    b.z = Math.max(b.z, 0.3); b.skid = true; b.rollV = 0; b.last = p.team; b.save = null; b.target = null; b.lob = false; p.cool = 0.5; b.ring = null;   // (t-005: touched - no landing ring)
    if (b.spin || b.curl || b.cv) { b.spin = 0; b.curl = 0; b.cv = 0; }          // (t-002 prototype; t-011 the curving pass)
    b.camUp = how !== 'parry' || b.vz > 3;                                       // t-007: the camera follows it up and out (world.js)
  },
  // t-007: the keeper's frames for a save he makes on the spot (a special he gets a hand to): a dive if he's flying already
  gkSaveAnim(p) { if (p.state === 'dive') return; const K = MAN.kits[p.kit].anims; if (K['punch-S']) p.setState('punch', 0.45); },
  // t-007 (Luca: "jump for a ball i lob is coming his way or at least punch it"): a high ball within his reach in his box
  // (a lob he has read, a cross). Held when the dice say so (by its pace and his level; far less often with one of
  // theirs on him); otherwise punched clear, or tipped over when it's dropping towards his goal near the bar.
  // He jumps for anything over 2 m. Returns 'catch' (pickups gives it him), 'done' (it's off his fists) or 'skip'.
  gkAerial(p) {
    const b = this.ball, side = p.team.side, H = (b.x - p.team.ownGoalX) * side, sp = len(b.vx, b.vy, b.vz);
    const up = p.state === 'dive' && (p.saveKind === 'leap' || p.saveKind === 'tip');
    if (b.z > (up ? 3.1 : 2.95)) return 'skip';                                 // (over him even with a jump)
    if (p.state === 'dive' && !up) return 'skip';                                 // (on the grass from another save)
    const opp = p.team.opp.players.filter(o => !o.keeper && !o.sentOff);
    const crowd = opp.some(o => len(o.x - b.x, o.y - b.y) < 0.7) || opp.filter(o => Math.min(len(o.x - b.x, o.y - b.y), len(o.x - p.x, o.y - p.y)) < 1.8).length >= 2;   // (one of theirs right under it, or two around him)
    const hold = Math.random() < this.gkHoldChance(p, sp, 'claim') * (crowd ? 0.2 : 1);
    if (b.z > 2.0 && !up) {                                                       // he goes up for it
      p.setState('dive', 0.55); p.diveLen = 0.55; p.diveFly = 0.12; p.diveDir = 0; p.diveZ = clamp(b.z, 1.8, 2.9); p.vx = p.vy = 0;
      p.saveKind = hold ? 'leap' : 'tip'; p.leap = clamp(b.z - 1.9, 0.25, 0.7);
    }
    if (hold) { if (p.state === 'dive') p.diveAnim = gkMoveAnim(p, 'leap', b.y > p.y); p.gkMode = 'LEAP'; return 'catch'; }
    const how = b.vx * -side > 1.5 && H < 5 && b.z > 2.1 && !crowd ? 'tip' : 'punch';
    if (p.state === 'dive') p.saveKind = how;
    this.gkDeflect(p, how); this.gkCount(p.team, 'punched'); p.gkMode = how === 'tip' ? 'TIP' : 'PUNCH';
    if (p.state === 'dive') p.diveAnim = gkMoveAnim(p, how, b.y > p.y);
    else if (MAN.kits[p.kit].anims['punch-S']) { const pa = gkMoveAnim(p, 'punch', false); p.setState('dive', 0.45); p.diveLen = 0.45; p.diveFly = 0.1; p.diveDir = 0; p.saveKind = 'punch'; p.leap = 0.15; p.diveAnim = pa; }
    this.say('', how === 'tip' ? 'TIPPED OVER THE BAR!' : 'PUNCHED CLEAR!', 0.8);
    return 'done';
  },
  gain(p, incoming) {
    const b = this.ball, prev = b.owner;
    // v0.8.1 (Luca): no SP for passes - the AI just passed it back and forth to farm it. SP fills with time only.
    b.special = 0; b.saveable = null; b.chip = false;
    for (const t of [this.home, this.away]) { const k = t.players[0]; if (k && k !== p && k.spSave) k.spSave = 0; }   // v0.9.0: someone has it: no save to make
    if (b.shotBy && b.shotBy.team !== p.team && p.keeper) this.missedChance(b.shotBy.team, 'held'); else b.shotBy = null;
    const back = p.keeper && b.last === p.team && b.lastP && b.lastP !== p && b.how && b.how.kind === 'pass';   // v0.9.1 (IFAB Law 12): a team-mate's pass / throw-in back to him - feet only
    const box = p.keeper && !back && Math.abs(p.x - p.team.ownGoalX) < 16.5 && Math.abs(p.y - 34) < 20.2;
    b.owner = p; b.last = p.team; b.target = null; b.save = null; b.lob = false; b.ring = null; b.camUp = false;   // (t-007: the camera stops following it up) (t-005: someone has it - no landing ring, even if a tackle knocks it loose)
    if (b.spin || b.curl || b.cv) { b.spin = 0; b.curl = 0; b.cv = 0; }          // (t-002 prototype; t-011 the curving pass)
    if (prev) { prev.cool = 0.4; }
    if (box) {
      if (len(b.vx, b.vy) > 2 && p.state !== 'dive') p.face = dirIndex(-b.vx, -b.vy);
      SFX.catch(); p.hands = true; p.hold = 0; p.claimHigh = b.z > 1.45 && p.state !== 'dive'; b.vz = 0; if (p.state !== 'dive') p.setState('catch', p.claimHigh ? 0.6 : 0.5);    // a diving catch keeps the dive; a high ball = the jumping claim
      if (incoming > 15) this.say('', 'SAVED!', 0.8); return;
    }
    // first touch: a hard ball pops off the foot a little
    if (incoming > 6) p.touchAnimT = 0.28;
    const pop = Math.min(0.18, 0.04 + incoming * 0.008);
    b.vx = p.vx + b.vx * pop; b.vy = p.vy + b.vy * pop; b.vz = 0; b.z = 0; p.touchT = 0.2;
  },
  // the net gives: a quick ripple outwards that settles (the net images shift a few pixels and spring back)
  netRipple(side, speed) {
    if (gpOn()) { const b = this.ball; b.gpIn = { vx: b.vx, vz: b.vz }; return; }   // t-013: the spring net (gpNet) takes the pace off and draws the give
    const n = this.nets && this.nets[side]; if (!n) return;
    const amp = clamp(Math.round(speed / 6), 2, 5) * (side === 'L' ? -1 : 1);
    this.tweens.killTweensOf(n.imgs); for (const im of n.imgs) im.x = n.x;
    this.tweens.add({ targets: n.imgs, x: n.x + amp, duration: 80, ease: 'Sine.easeOut', yoyo: true, repeat: 1,
      onComplete: () => { this.tweens.add({ targets: n.imgs, x: n.x + Math.sign(amp), duration: 90, yoyo: true, onComplete: () => { for (const im of n.imgs) im.x = n.x; } }); } });
  },
});
