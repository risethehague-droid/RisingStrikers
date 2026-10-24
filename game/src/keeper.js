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
// t-007 (Luca 24 Oct 05:57: "the gk ai needs major improvements ... understand the x y z more, diving left right lower
// higher, jump for a ball i lob ... or at least punch it"): every save move picks its frames through this one table,
// save kind -> the animations to try, in order. The first names are the new PixelLab keeper moves the taskmaster is
// making (kleap: a leap-and-grab, kdivecatch: a full-stretch side dive, kpunch2: a punch, ktip: a tip over the bar);
// until they're in the kit the existing frames stand in. A name is tried facing the pitch (-E for the left goal, -W
// for the right one), then the way he faces, then -S. 'DIVE' = the side dive diveAnimFor picks (our diveDown / diveUp
// frames are named by where he goes on SCREEN, towards / away from the camera, not by height: so low and high dives
// share them for now and differ by the height he goes to, and a high one lifts him off the grass, player.js).
const GK_MOVES = {
  diveLow: ['kdivecatch', 'DIVE'],        // low to a side: down at the post
  dive: ['kdivecatch', 'DIVE'],           // to a side, about waist to chest high
  diveHigh: ['kdivecatch', 'DIVE'],       // high to a side: up and across
  leap: ['kleap', 'claim', 'catch'],      // straight up: jump and catch it over his head
  tip: ['ktip', 'diveUp', 'punch'],       // straight up: fingertips over the bar (diveUp-E / -W is a full upward stretch, no ball in his hands)
  punch: ['kpunch2', 'punch'],            // a high ball fisted clear
};
// t-014 (taskmaster's call on Luca's 24 Oct brief): the batch 16 keeper moves (kleap, ktip, kdivecatch, kblock) are the
// SPECIAL save's look (specials.js gkSpecialMove), so they read as special; normal saves keep the existing frames. Flip
// this to true to let GK_MOVES use them on every normal save too
const GK_NEW_ON_NORMAL = false, GK_NEW = /^k(leap|tip|divecatch|block)/;
function gkMoveAnim(k, kind, down) {
  const A = MAN.kits[k.kit].anims, sides = [k.team.side > 0 ? 'E' : 'W', DIRS[k.face], 'S'];
  for (const n0 of GK_MOVES[kind] || ['DIVE']) {
    if (n0 === 'DIVE') return diveAnimFor(k, down);
    if (!GK_NEW_ON_NORMAL && GK_NEW.test(n0)) continue;
    const n = n0 === 'kdivecatch' ? `kdivecatch${down ? 'Down' : 'Up'}` : n0;   // (the dive catch comes as Down / Up, like diveAnimFor's dives)
    for (const d of sides) if (A[`${n}-${d}`]) return `${n}-${d}`;
  }
  return diveAnimFor(k, down);
}

// ---------------------------------------------------------------- Match methods: keeper
const GK_BACKPEDAL = 2.9;                       // t-016: m/s a keeper back-pedals / side-steps with a close ball (player.js: under 3 he watches it)

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
    // t-007 (more corners): a hard shot only just wide or over - he doesn't take the chance, he goes for it and turns it
    // round the post / over the bar (about 5 in 6, within ~2.5 m of the frame): a corner instead of a goal kick
    const close = off && sp > 13 && g.y > GOAL_Y0 - 2.5 && g.y < GOAL_Y1 + 2.5 && g.z < BAR_Z + 1.0 && Math.random() < 0.85;
    // t-007 ("the gk should try catch more if the kick is weaker"): one dice for the whole shot, u; whether he holds it
    // is u against gkHoldChance when the ball meets his gloves (by its pace there, his level and the kind of save)
    b.save = { gk, y, z: c.z, t: t + 0.6, t0: t, react, act: null, off, close, dy: Math.abs(c.y - gk.y), cover: this.keeperCover(t - react, c.z), sp, u: Math.random() };
    if (!off) this.gkCount(gk.team.opp, 'onT');
  },
  // t-007: match counts for the soak (tools/soak.js: shots on target, saves held v parried) - counting only, no dice
  gkCount(team, key) { if (!team || !this.stat) return; const S = this.stat(team); S[key] = (S[key] || 0) + 1; },
  // t-007: the chance he HOLDS a ball that reaches his gloves cleanly. It grows as the ball's pace falls: a soft ball
  // (under ~50 km/h) nearly always, ~65 km/h at his body three in four, a 90 km/h drive at his body one in three, at full
  // stretch hardly ever (a hard ball he can only push away is what makes corners). His level (gkSave) moves
  // it: Rise holds a ball ~10% faster than Normal, Easy ~4% slower. A ball at his body is easier than one he stretches
  // for ('stand' / 'leap' / a dive), and a cross or lob he comes for and meets ('claim': no shooter's pace on it) easiest.
  // t-010: a tap kick at his body (Luca: "a goalie can deal with them easy in their range") - straight, no swerve, no
  // weight behind it - is held like a cross he comes for: ~96% at 6 m. Out of his reach it's a dive like any other.
  gkHoldChance(gk, spd, kind) {
    const q = this.dk(gk.team).gkSave, v = spd * (1.15 - 0.15 * q) * (kind === 'claim' ? 0.75 : kind === 'stand' && this.ball.tap ? 0.8 : kind === 'stand' ? 0.9 : kind === 'leap' || kind === 'tip' ? 0.95 : 1.05);
    return clamp(0.97 - (v - 13) * 0.085, 0.05, 0.97);
  },
  // t-007: a touch he can't hold - does he push it out (a corner) or keep it in play? Off his line or on his heels he
  // just gets something on it; set and in his goal a better keeper turns it safely out more often (by level)
  gkOutChance(gk) { return clamp(0.85 + 0.1 * (this.dk(gk.team).gkSave - 1), 0.75, 0.92); },
  // t-007: straight up for a ball over his head (a shot or a chip dropping under the bar): he times the leap so he's
  // at the top as it arrives; 'leap' to catch it, 'tip' when it's too high or too hard to hold (over the bar)
  gkLeap(k, sv, dy, left) {
    const fly = clamp(left, 0.18, 0.5), kind = sv.z > 2.75 || (sv.sp > 22 && sv.z > 2.2) ? 'tip' : 'leap';   // (hard and right under the bar: over it, not held)
    k.setState('dive', fly + 0.4); k.diveLen = fly + 0.4; k.diveFly = fly; k.diveDir = 0; k.diveZ = clamp(sv.z, 1.8, 2.9);
    k.vx = 0; k.vy = dy / Math.max(fly, 0.25); k.saveKind = kind; k.leap = clamp(sv.z - 1.9, 0.25, 0.7);
    k.diveAnim = gkMoveAnim(k, kind, dy > 0); k.gkMode = kind === 'tip' ? 'TIP' : 'LEAP';
  },
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
  keeperAI(k, dt) { this.keeperPlan(k, dt); this.gkFaceBall(k); },
  // t-016 (Luca's Bug Watch mark, 24 Oct: "if ball is close enough, the keeper should not give his back to the ball" - he
  // turned for his spot with a loose ball a few metres away; the Lab's KF1 had him 144 deg off it, back to it, at 5.4 m/s).
  // A ball loose or at an attacker's feet within 6 m, on the ground or about to be: he may back-pedal or side-step to his
  // spot but not turn and run - moving anywhere but at the ball, he's held under 3 m/s, the speed under which player.js
  // keeps a keeper watching the ball (faster, he faces where he runs). Coming AT the ball (rush, smother) is untouched,
  // and so are lobs over him (z > 1.5: he must turn and run, the Lab's GK11) and shots (a ball over 6 m/s, or a special).
  gkFaceBall(k) {
    const b = this.ball; if (k.sentOff || k.busy() || k.hands || b.inNet || (b.owner && b.owner.team === k.team) || b.z > 1.5 || (b.save && b.save.gk === k)
      || b.special || (!b.owner && len(b.vx, b.vy) > 6)) return;   // (a shot or a special at him isn't a ball to back off from: the Lab's GK4 / PW7)
    const dx = b.x - k.x, dy = b.y - k.y, d = len(dx, dy), sp = len(k.vx, k.vy);
    if (d > 6 || d < 0.3 || sp <= GK_BACKPEDAL || (k.vx * dx + k.vy * dy) / (sp * d) > 0.5) return;   // (far, on top of it, slow already, or going at it)
    const f = GK_BACKPEDAL / sp; k.vx *= f; k.vy *= f;
  },
  keeperPlan(k, dt) {
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
        // t-007: the save is read from where the ball will cross him: how far to the side (dy) and how high (sv.z)
        const ady = Math.abs(dy), z = sv.z;
        k.saveKind = ''; k.leap = 0;
        if (sv.off && ady > 0.8 && !sv.close) sv.act = 'leave';
        else if (z > 3.1 && ady < 1.3) sv.act = 'leave';                      // over him: out of reach whatever he does
        else if (ady < 1.1 && z > 2.05) {                                     // over his head: jump for it - timed, so he's at the top as it arrives
          if (left > 0.5) { k.moveTo(k.x, sv.y, 6.5, dt); return; }
          sv.act = 'leap'; this.gkLeap(k, sv, dy, left); return; }
        else if (ady < 0.45) sv.act = 'set';
        else if (ady < 1.3 && left > 0.4) sv.act = 'step';
        else {
          sv.act = 'dive';
          // fly so the ball meets his hands (0.4 m past his centre) as it arrives; the air slows him a little
          const fly = clamp(left, 0.2, 0.5), v = Math.min(GK_DIVE_V, Math.max(0, ady - 0.4) / (fly * (1 - 0.2 * fly)));
          k.setState('dive', 0.85); k.diveLen = 0.85; k.diveFly = fly + 0.08; k.diveDir = Math.sign(dy); k.diveZ = clamp(z, 0.2, 2.1);
          // t-007: low (down at the post), mid, or high (up and across: he leaves the grass, player.js)
          k.saveKind = z < 0.7 ? 'diveLow' : z > 1.6 ? 'diveHigh' : 'dive'; k.leap = k.saveKind === 'diveHigh' ? clamp((z - 1.4) * 0.4, 0.1, 0.4) : 0;
          k.vx = 0; k.vy = k.diveDir * v; k.diveAnim = gkMoveAnim(k, k.saveKind, dy > 0); k.gkMode = k.saveKind.toUpperCase();
          return;
        }
      }
      if (sv.act === 'leave') { k.steer(0, 0, dt); return; }
      k.moveTo(k.x, sv.y, 6.5, dt); return;
    }
    if (!b.owner && this.path && (b.z > 0.6 || b.vz > 2) && !(b.save && b.save.gk === k)) {     // a cross into his area: come and claim it
      // he reads the flight first (no instant rush), and outside his six-yard box he only comes if he clearly beats the attackers
      if (((b.airT || 0) > 0.22 && !this.gkUnread(k)) || k.claiming) {           // (t-005: a lob waits for his read by level)
        const area = q => q.z > 0.3 && Math.abs(q.x - gx) < 7.5 && Math.abs(q.y - 34) < 10;
        // t-007 ("jump for a ball i lob is coming his way"): not only the first point it drops into his area - the first
        // one that's his ball; and if there's none under 2.5 m, higher with a jump (up to ~2.9 m: gkAerial) if he's there in time
        const go = pt => {
          const mine = pt && 0.15 + len(pt.x - k.x, pt.y - k.y) / 6.5 <= pt.t + 0.25;
          const six = pt && pt.z > 1.0 && Math.abs(pt.x - gx) < 5.5 && Math.abs(pt.y - 34) < 9.2;      // in the air in his six-yard box: his ball
          const beaten = pt && !six && k.team.opp.players.some(o => !o.keeper && !o.sentOff && 0.12 + len(pt.x - o.x, pt.y - o.y) / 7 < 0.15 + len(pt.x - k.x, pt.y - k.y) / 6.5 + 0.1);
          return mine && (six || !beaten || k.claiming);
        };
        const pt = this.path.find(q => area(q) && q.z < 2.5 && go(q))                // the first point on its way down that's his (in his six it always is)
          || this.path.find(q => area(q) && q.z < 2.9 && 0.15 + len(q.x - k.x, q.y - k.y) / 6.5 <= q.t + 0.1 && go(q));   // or higher, with a jump
        if (pt) { k.claiming = true; k.gkMode = 'CLAIM'; k.gkTgt = { x: pt.x, y: pt.y }; k.moveTo(pt.x, pt.y, 6.5, dt); return; }
      }
    }
    const toward = (b.vx * -side) > 4;
    if (!b.owner && toward && !b.save && b.z < 1.3 && Math.abs(k.x - lineX) < 2.5) {   // a pass or loose ball across his goal mouth: where does it cross his line? (t-007: a low one - a lob dropping in is a CLAIM, not a dive along the grass)
      const t = (lineX - b.x) / b.vx;
      if (t > 0 && t < 1.4) {
        const cy = clamp(b.y + b.vy * t, GOAL_Y0 - 0.5, GOAL_Y1 + 0.5);
        if (Math.abs(cy - k.y) > 1.6 && t < 0.6 && k.state !== 'dive') {
          k.setState('dive', 0.7); const down = cy > k.y; k.vx = 0; k.vy = (cy - k.y) / 0.45;
          k.saveKind = 'diveLow'; k.leap = 0; k.diveDir = Math.sign(cy - k.y); k.diveZ = 0.3;   // (t-007: a ball across the grass: a low dive)
          k.diveAnim = gkMoveAnim(k, 'diveLow', down); k.gkMode = 'DIVE';
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
  // at the height he went for. Leaping: his hands above his head. Returns null (not level with him yet, or past his
  // hands) or what his touch does: 'catch', 'parry' (pushed out to the side, in play), 'wide' (round the post) or
  // 'tip' (over the bar). t-007: held = a clean contact AND the shot's dice under gkHoldChance; not held, a high ball
  // goes over the bar and a hard one or a stretch is often turned round the post - both corners (Luca: "there are
  // virtually no corners happening because the ball doesnt bounce enough off the goalie out there")
  keeperTouch(p, pbx) {
    const b = this.ball;
    if (!((pbx - p.x) * (b.x - p.x) <= 0 || Math.abs(b.x - p.x) < 0.4)) return null;
    const rel = b.y - p.y, spd = len(b.vx, b.vy, b.vz), diving = p.state === 'dive', up = diving && (p.saveKind === 'leap' || p.saveKind === 'tip');
    let touch, clean;
    if (up) {                                                                 // jumping: hands up to ~3 m
      touch = Math.abs(rel) < 0.8 && b.z > 1.1 && b.z < 3.1;
      clean = p.saveKind === 'leap' && Math.abs(rel) < 0.6 && b.z < 2.8;
    } else if (diving) {
      const along = rel * (p.diveDir || 1), zc = p.diveZ ?? 0.8, out = GK_REACH - Math.max(0, b.z - 1.7) * 0.6;
      touch = along > -0.35 && along < out && b.z < Math.max(zc + 0.9, 1.1) && b.z > zc - 1.0 && b.z < 2.75;
      clean = along < out - (spd > 16 ? 0.3 : 0.12) && Math.abs(rel) < 0.85 && b.z < 2.0;   // (at full stretch: fingertips, never held)
    } else {
      touch = Math.abs(rel) < (b.z > 0.7 && b.z < 2.3 ? 0.85 : 0.55) && b.z < 2.6;           // arms up and a little hop
      clean = b.z < 2.2 && Math.abs(rel) < 0.7;
    }
    if (!touch) return null;
    const sv = b.save, kind = up ? p.saveKind : diving ? 'dive' : 'stand';
    if (sv && sv.close) return b.z > 1.9 ? 'tip' : 'wide';                    // going wide / over anyway: he makes sure of it
    const hold = clean && !b.special && (sv && sv.u != null ? sv.u < this.gkHoldChance(p, spd, kind) : spd < (diving ? 17 : 24));
    if (hold) return 'catch';
    if (up) return 'tip';                                                     // jumping: up and over
    if (diving && p.saveKind === 'diveHigh') return b.z > 2.15 ? 'tip' : 'wide';      // high to the corner: round the post, or over if it's under the bar
    if (b.z > 1.9) return 'tip';
    return (diving || spd > 14) && Math.random() < this.gkOutChance(p) ? 'wide' : 'parry';
  },
});
