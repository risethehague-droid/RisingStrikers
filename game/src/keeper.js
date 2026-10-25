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
  smother: ['ksmother', 'kdivecatch', 'DIVE'],   // t-017: down at the striker's feet, hands first (a 1v1; batch 18 ksmother)
  block: ['kstar', 'kblock', 'kset'],     // t-017: a shot from close, straight at him: big - the starfish (batch 18 kstar)
  collapse: ['kcollapse', 'kdivecatch', 'DIVE'],   // t-017: a low ball just to his side: legs out, down on his side (batch 18 kcollapse)
};
// t-014 (taskmaster's call on Luca's 24 Oct brief): the batch 16 keeper moves (kleap, ktip, kdivecatch, kblock) are the
// SPECIAL save's look (specials.js gkSpecialMove), so they read as special; normal saves keep the existing frames. Flip
// this to true to let GK_MOVES use them on every normal save too.
// t-017 (Luca 25 Oct 02:58: "it need animations and logic into diving etc ... if they are ready start developing the new
// gk logic"): on. Every dive, leap, tip, smother and close block uses the PixelLab batch 16 moves; a special save still
// has its own banner, rig and effects on top.
const GK_NEW_ON_NORMAL = true, GK_NEW = /^k(leap|tip|divecatch|block)/;
// t-027 THE KEEPER'S RANGE (Luca 25 Oct 14:42, after playing v0.12.0: "gk needs to approach from further range to
// close in on attackers who are coming close, right now it's easy to run around the goalie because they don't have
// enough engagement range"). t-017's 1v1 started late and stayed deep: he began coming at 26 m, came no further than
// 9 m off his line and only attacked the ball inside 13 m - so a striker had the whole box to take him on in. Now
// he starts earlier, comes out to the edge of his box and attacks the ball while it's still ~18 m out; the dive at
// the feet stays inside his box (hands). [the t-017 value in brackets]
const GK_1V1 = {
  engage: 32,        // a striker running at goal, no defender covering him: he starts closing from this far (m from goal) [26]
  engageSlow: 14,    // ...one not running at goal (walking it across / set to shoot): as t-017 (20 pulled him ~2 m further out
                     // against a set shooter at 14-20 m: the soak's goals from there doubled)
  stayOut: 24,       // once out, he stays out while the striker is within this, even if he slows [18]
  outMax: 14,        // how far off his line he comes while closing a breakaway (m along the angle; the box is 16.5) [9]...
  outNear: 20,       // ...once the ball is this close to goal (m); further out he stays at most outFar off his line, then moves up
  outFar: 9,         // with it (the first soak had him 14 m out with the striker still 25 m away: long shots went in 8 -> 22 in 12
                     // matches, goals 2.2 -> 3.3 a match)
  outSlow: 5.5,      // ...for a striker walking across the box or set to shoot: as t-017 (8 left him 6 m from a set shooter at
                     // 14 m with no time for a hard low shot: Test Lab GKX3 went in)
  blockGap: 9.5,     // nearer than this to the ball (m) on a breakaway, he attacks it: up to ~1.4 m in front of it [6.5]
  blockFrom: 19,     // ...once the ball is within this of his goal (m) [13]
  blockMax: 15.5,    // ...but never further out than this (m along the angle: inside his box)
  gap0: 1.2, gapK: 0.22, gapMin: 1.6, gapMax: 5.5,   // while closing a breakaway, he waits gap0 + gapK x (ball to goal) in front of the ball [1.4 + 0.3x, 1.9-7]
                                                     // (anyone else: t-017's gap, unchanged)
};
// t-031 KEEPER HANDS (Luca 25 Oct 15:41: "new physics for the hands and animation to be able to dive with the hands to
// grab the ball, also be able to hold it in his hands while he moves - keep it simple and smooth tho"). The ball used to
// sit 0.6 m to his side on a diving catch and snap into the hold pose as he stood up; now it is drawn IN his gloves.
// GK_HANDS: where the ball sits on each frame of his catching moves - between his gloves (x, y in the frame's own
// window, E and W). Measured off the PixelLab frames by tools/gk_hands.py (the white gloves; every keeper kit shares
// the poses, so one table). kgetup: his hands push off the grass there, so those are his CHEST (measured by eye on the
// frames, ending on the catch hold's ball), and so is kleap's landing frame (one glove on the grass): real keepers bring it into the chest as they land and get up holding it.
const GK_HANDS = {
  'kdivecatchDown-E': [[74,83],[74,91],[73,147],[66,149],[67,149],[63,146],[57,145],[58,142],[59,145],[51,133],[62,110],[76,91]],
  'kdivecatchDown-W': [[53,83],[53,91],[54,147],[61,149],[60,149],[64,146],[70,145],[69,142],[68,145],[76,133],[65,110],[51,91]],
  'kdivecatchUp-E': [[54,77],[55,69],[55,14],[63,11],[62,11],[66,14],[71,15],[71,19],[70,15],[77,28],[66,51],[52,69]],
  'kdivecatchUp-W': [[73,77],[72,69],[72,14],[64,11],[65,11],[61,14],[56,15],[56,19],[57,15],[50,28],[61,51],[75,69]],
  'kleap-E': [[118,108],[114,109],[113,109],[120,98],[118,69],[131,36],[130,23],[130,22],[134,57],[135,70],[141,91],[140,128]],
  'kleap-W': [[137,108],[141,109],[142,109],[135,98],[137,69],[124,36],[125,23],[125,22],[121,57],[120,70],[114,91],[115,128]],
  'ksmother-E': [[135,111],[122,113],[111,111],[179,101],[194,104],[165,106],[197,159],[193,160]],
  'ksmother-W': [[120,111],[133,113],[144,111],[76,101],[61,104],[90,106],[58,159],[62,160]],
  'kcollapseDown-E': [[44,139],[46,137],[46,134],[45,133]],
  'kcollapseDown-W': [[83,139],[81,137],[81,134],[82,133]],
  'kcollapseUp-E': [[84,22],[82,23],[83,26],[83,28]],
  'kcollapseUp-W': [[43,22],[45,23],[44,26],[44,28]],
  'kgetup-E': [[110,124],[100,134],[104,139],[115,130],[130,120],[136,118],[136,102],[134,81]],
  'kgetup-W': [[145,124],[155,134],[151,139],[140,130],[125,120],[119,118],[119,102],[121,81]],
};
// the frame where his gloves meet the ball (RIGS' hit keys; the smother's hands are out from frame 4, the collapse's from
// the start): a catch made before the move gets there jumps it to that frame, so the gloves are out when they take it
const GK_HAND_HIT = { kdivecatchDown: 3, kdivecatchUp: 3, kleap: 7, ksmother: 4, kcollapseDown: 0, kcollapseUp: 0 };
// the hold: where the ball sits at his chest on the catch move's last frame (128 x 160 frame, by the way he faces), for
// the carry moves (kcarry / kcarryrun, PixelLab batch 21) until they bring their own. Facing away (N, NE, NW) his body
// hides it: tools/gk_hands.py finds no gloves there, so it's the E / W point, drawn just behind him
const GK_HOLD = { E: [70, 57], NE: [70, 58], N: [64, 58], NW: [57, 58], W: [57, 57], SW: [54, 62], S: [63, 58], SE: [73, 62] };
// t-031 the computer's keeper WALKS IT OUT after a calm catch (real keepers take a few steps towards the edge of the box
// on the side they'll play it to, ~2-4 s, inside the Laws' 6 s; FIFA / PES keepers run it out the same way). Under
// pressure he lets it go quickly, as before.
const GK_WALKOUT = {
  calm: 11,           // no opponent within this (m) when he has it: he walks it out
  press: 7.5,         // ...until one comes within this: then he plays it at once
  steps: [4, 8],      // how far he walks it (m), towards the edge of his box on his outlet's side
  edge: 15,           // never further out than this (m from his line; the box is 16.5)
  v: 1.9,             // walking pace (m/s): the kcarry walk / the hold pose with a bob
  time: [2.0, 3.4],   // walking at most this long (s), then a breath and the throw / roll / punt
};
function gkMoveAnim(k, kind, down) {
  const A = MAN.kits[k.kit].anims, sides = [k.team.side > 0 ? 'E' : 'W', DIRS[k.face], 'S'];
  for (const n0 of GK_MOVES[kind] || ['DIVE']) {
    if (n0 === 'DIVE') return diveAnimFor(k, down);
    if (!GK_NEW_ON_NORMAL && GK_NEW.test(n0)) continue;
    const n = n0 === 'kdivecatch' || n0 === 'kcollapse' ? `${n0}${down ? 'Down' : 'Up'}` : n0;   // (the dive catch and the collapse come as Down / Up, like diveAnimFor's dives)
    for (const d of sides) if (A[`${n}-${d}`]) return `${n}-${d}`;
  }
  return diveAnimFor(k, down);
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
  // t-017: down at the striker's feet - a dive at where the ball will be in a quarter of a second, hands first. He
  // slides ~2 m; gkSmotherTake (called from ball.js's pickups) decides whether his hands get it before the striker does
  gkSmotherDive(k) {
    const b = this.ball; let T = 0.4;                                            // where his dive meets the ball: the first moment it can
    for (let t = 0.05; t <= 0.4; t += 0.05) if (len(b.x + b.vx * t - k.x, b.y + b.vy * t - k.y) <= 0.9 + 7.0 * Math.max(0, t - 0.06)) { T = t; break; }
    T += 0.06; const px = b.x + b.vx * T, py = b.y + b.vy * T;                  // (a touch past it: he throws himself through the ball, not at where it was)
    // he throws himself just through it: his body sweeps along its path (the ball rarely stays where he aimed - a touch,
    // a cut), and the batch 18 ksmother frames stretch his hands ~1.2 m further out in front (Test Lab KP: sliding only
    // up to the ball, he won 19 of 30; 0.3 m through it 21; 0.6 m through it 28)
    const dx = px - k.x, dy = py - k.y, d = len(dx, dy) || 1, v = clamp((d + 0.6) / 0.3, 3, 7.5);
    k.setState('dive', 0.95); k.diveLen = 0.95; k.diveFly = 0.32; k.diveZ = 0.2; k.leap = 0;
    k.diveDir = Math.sign(dy) || (k.y < 34 ? 1 : -1); k.saveKind = 'smother'; k.smDone = false; k.smU = Math.random(); k.smAt = this.time.now; k.smWant = 0;
    k.smDir = { x: dx / d, y: dy / d }; k.vx = dx / d * v; k.vy = dy / d * v;
    k.diveAnim = gkMoveAnim(k, 'smother', dy > 0); k.gkMode = 'SMOTHER';
  },
  // t-017: his hands reach the ball at the striker's feet. A touch that's got away from him (over ~0.7 m off his foot):
  // the keeper's. Tight at his feet: a contest, better keepers win more (Normal ~half, Rise ~3 in 4). Once per dive.
  gkSmotherTake(o) {
    const b = this.ball, k = o.team.opp.players[0];
    if (!k || !k.keeper || k.sentOff || k.state !== 'dive' || k.saveKind !== 'smother' || k.smDone || b.z > 0.7) return false;
    const age = (k.diveLen || 0.95) - k.stateT; if (age < 0.06 || age > 0.62) return false;
    const ux = k.smDir ? k.smDir.x : 0, uy = k.smDir ? k.smDir.y : 0, rx = b.x - k.x, ry = b.y - k.y;
    const along = rx * ux + ry * uy, perp = Math.abs(rx * uy - ry * ux);         // his body at full length on the grass: from his knees (0.6 m back) to his fingertips (1.2 m ahead)
    if (along < -0.6 || along > 1.2 || perp > 0.65) return false;
    k.smDone = true;
    // gathered, knocked loose off his body, or the striker got it away from him (more likely the tighter he keeps it and
    // the sharper he's cutting across the dive)
    const od = len(b.x - o.x, b.y - o.y), q = this.dk(k.team).gkSave, cut = Math.abs(o.vx * uy - o.vy * ux);
    const grab = od > 0.7 ? 1 : clamp(0.42 + 0.25 * (q - 1) + od * 0.3 - cut * 0.06, 0.2, 0.82), u = k.smU;
    if (u < grab) {
      k.vx *= 0.2; k.vy *= 0.2; this.gain(k, 0); o.stun = Math.max(o.stun, 0.25);
      this.gkCount(k.team, 'smothered'); this.say('', 'SMOTHERED!', 0.8); return true;
    }
    if (u < grab + (1 - grab) * 0.55) {                                         // off his body: loose, away from his goal and to a side
      const s = k.team.side, sv = rnd(4, 7), a = rnd(-1, 1) * 0.9;
      b.owner = null; b.target = null; b.last = k.team; b.lastP = k; b.vx = s * sv * Math.cos(a); b.vy = sv * Math.sin(a); b.vz = rnd(0.5, 2);
      o.cool = Math.max(o.cool, 0.3); this.gkCount(k.team, 'blocked'); this.say('', 'BLOCKED!', 0.7); return true;
    }
    return false;                                                               // he got it away from him: round the keeper
  },
  // t-017: a shot from close (under ~9 m) straight at him: no dive - planted and big (the batch 16 power block)
  gkBlock(k) {
    k.setState('dive', 0.7); k.diveLen = 0.7; k.diveFly = 0.05; k.diveDir = 0; k.diveZ = 0.8; k.leap = 0; k.vx = k.vy = 0;
    k.saveKind = 'block'; k.diveAnim = gkMoveAnim(k, 'block', false); k.gkMode = 'BLOCK';
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
  //    or the space" (within ~3 m drop low and smother; a good touch = hold your position). t-017: rebuilt - CLOSE / SET /
  //    BLOCK / SMOTHER in gkPlan (he used to stand still from 3.2 m and get walked round).
  //  - SET: a shot is coming (an attacker on the ball within ~25 m): small steps, then still in his ready stance.
  //  - BACK: a lob / ball over his head while he's up: he runs back to his line.
  // He walks when nothing is on, jogs to get back into place, runs only when it's urgent. k.gkMode / k.gkTgt = what he is
  // doing (the Lab draws it).
  // t-016 (worker-f, PR #20) held a keeper under 2.9 m/s near a loose ball so player.js kept him watching it. t-017 does
  // the facing in player.js at any speed instead (gkFace, set in keeperPlan): the cap also slowed him going across with
  // a dribbler - the 1v1 mirroring needs his full speed. keeperPlan is t-016's name for the keeper's brain, kept.
  keeperAI(k, dt) { this.keeperPlan(k, dt); },
  keeperPlan(k, dt) {
    const b = this.ball, side = k.team.side, gx = k.team.ownGoalX, lineX = gx + side * 1.3;
    k.gkSet = false;
    if (k.state === 'getup') { k.steer(0, 0, dt); return; }                      // t-017: back on his feet first (player.js)
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
      k.hold = (k.hold || 0) + dt;
      if (this.gkWalkOut(k, dt)) return;                                         // t-031: a calm catch: he walks it out first
      k.steer(0, 0, dt);
      if (k.hold > 1.1 && !(k.walk && k.speed > 0.6)) { k.hold = 0; k.walk = null; const o = this.keeperOutlet(k); this.doPass(k, o.dir, o.mode); }   // (after a walk: once he's stopped)
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
        else if (ady < 0.9 && z < 1.7 && left < 0.32) { sv.act = 'block'; this.gkBlock(k); return; }   // t-017: from close, at him, no time to set: a wall
        else if (ady < 0.45) sv.act = 'set';
        else if (ady < 1.3 && left > 0.4) sv.act = 'step';
        else {
          sv.act = 'dive';
          // fly so the ball meets his hands (0.4 m past his centre) as it arrives; the air slows him a little
          const fly = clamp(left, 0.2, 0.5), v = Math.min(GK_DIVE_V, Math.max(0, ady - 0.4) / (fly * (1 - 0.2 * fly)));
          k.setState('dive', 0.85); k.diveLen = 0.85; k.diveFly = fly + 0.08; k.diveDir = Math.sign(dy); k.diveZ = clamp(z, 0.2, 2.1);
          // t-007: low (down at the post), mid, or high (up and across: he leaves the grass, player.js)
          k.saveKind = z < 0.7 ? 'diveLow' : z > 1.6 ? 'diveHigh' : 'dive'; k.leap = k.saveKind === 'diveHigh' ? clamp((z - 1.4) * 0.4, 0.1, 0.4) : 0;
          k.vx = 0; k.vy = k.diveDir * v; k.diveAnim = gkMoveAnim(k, k.saveKind === 'diveLow' && ady < 1.6 ? 'collapse' : k.saveKind, dy > 0); k.gkMode = k.saveKind.toUpperCase();   // (t-017: a low one close to him: the collapse)
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
    if (T.dive) { k.gkFace = false; this.gkSmotherDive(k); return; }              // t-017: down at his feet
    const urgent = T.urgent || T.mode === 'SWEEP' || T.mode === 'SMOTHER' || T.mode === 'RUSH' || T.mode === 'BACK';
    // t-017: he faces the ball while he tracks it (side-steps and drops back facing it, player.js) - he used to turn his
    // back on it whenever he moved faster than a jog (Luca's Bug Watch note: "the keeper should not give his back to the ball")
    k.gkFace = !!T.track && (len(b.x - k.x, b.y - k.y) < 22 || len(T.x - k.x, T.y - k.y) < 3);   // (far out of place with the ball far off: he turns and runs)
    if (urgent || !k.gkS) k.gkS = { x: T.x, y: T.y };                            // positioning targets ease, so he doesn't twitch with every touch
    else { const a = 1 - Math.exp(-dt * (T.track ? 7 : 4)); k.gkS.x += (T.x - k.gkS.x) * a; k.gkS.y += (T.y - k.gkS.y) * a; }   // (t-017: quicker when the ball's near: he was ~1 m off the angle)
    k.gkTgt = { x: k.gkS.x, y: k.gkS.y, set: T.set };
    const D = len(k.gkS.x - k.x, k.gkS.y - k.y);
    if (T.v <= 0 || (!urgent && D < (T.track ? 0.12 : k.speed > 0.4 ? 0.2 : 0.45))) { k.steer(0, 0, dt); }   // (a dead band: no shuffling on the spot)
    else k.moveTo(k.gkS.x, k.gkS.y, T.v, dt);
    k.gkSet = !!T.set && k.speed < 0.7;
  },
  // t-031: the computer's keeper with the ball in his hands walks it out (GK_WALKOUT) when nobody's near: decided once he's
  // on his feet after the catch (k.walk: undefined = not yet, null = no walk), a few steps towards the edge of his box on
  // his outlet's side. Returns true while it has the frame; false = keeperPlan plays it as before (at once if pressed)
  gkWalkOut(k, dt) {
    const W = GK_WALKOUT, side = k.team.side, gx = k.team.ownGoalX, H = x => (x - gx) * side;
    if (k.busy()) { k.steer(0, 0, dt); return k.walk === undefined || !!(k.walk && !k.walk.done); }   // (getting up / the catch: he plays it once he's up)
    const opp = k.team.opp.players.filter(o => !o.sentOff), near = Math.min(99, ...opp.map(o => len(o.x - k.x, o.y - k.y)));
    if (k.walk === undefined) {
      if (near < W.calm || this.offGK === k || this.setPiece) { k.walk = null; return false; }   // (pressed, or a goal kick: as before)
      const o = this.keeperOutlet(k), hx = clamp(H(k.x) + rnd(W.steps[0], W.steps[1]), 2, W.edge);
      k.walk = { x: gx + side * hx, y: clamp(k.y + (o.dir.y || 0) * rnd(2, 5), 34 - 13, 34 + 13), T: rnd(W.time[0], W.time[1]), t: 0, from: { x: k.x, y: k.y } };
    }
    const w = k.walk; if (!w || w.done) return false;
    w.t += dt;
    if (near < W.press || w.t > w.T || len(w.x - k.x, w.y - k.y) < 0.4) { w.done = true; k.hold = Math.max(k.hold, 0.8); return false; }   // (a breath, then he plays it)
    k.gkMode = 'WALK OUT'; k.gkTgt = { x: w.x, y: w.y };
    k.moveTo(w.x, w.y, W.v, dt); return true;
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
    // t-017 1v1 (Luca 25 Oct 02:58, urgent: "it does not track naturally anymore, many time you could just walk around
    // it and score"). The v0.9.1 RUSH ran out ~11 m, then BLOCK stood stock still from 3.2 m away, and a keeper can't
    // tackle - a striker just walked round him (Test Lab KP1-5: 5 goals in 5 on v0.10.4 and v0.11.0). Now, from
    // goalkeeping coaching (close the gap while the ball is off his foot, be set when he can shoot, stay on the line
    // between ball and goal, go down at his feet when he tries to go round):
    //  - CLOSE: on the line that halves the angle, nearer the ball the nearer it is to goal. He follows the ball a beat
    //    ahead (where the dribbler's next touch puts it), with no easing, so he mirrors every sideways move at once.
    //  - SET: the striker has it under control within shooting range: small steps, in his stance.
    //  - SMOTHER: within ~3 m, a touch off the foot, a move round him or right on top of him: he dives at the ball
    //    (gkSmotherDive) and wins it if his hands get there first (gkSmotherTake, in ball.js's pickups).
    if (!carrier) { k.rushT = 0; k.smWant = 0; k.oneDeep = false; }
    if (carrier) {
      const ch = H(carrier.x), cd = len(carrier.x - gx, carrier.y - 34);
      const cover = defs.some(p => H(p.x) < ch - 0.3 && len(p.x - carrier.x, p.y - carrier.y) < 9 && Math.abs((p.y - 34) - (carrier.y - 34) * H(p.x) / Math.max(ch, 1)) < 3.5);
      const toG = ((gx - carrier.x) * carrier.vx + (34 - carrier.y) * carrier.vy) / (cd || 1), coming = toG > 1.3 && toG > 0.65 * carrier.speed;   // running AT goal (not across the box)
      const engaged = !!k.oneDeep;                                                    // (once out, he doesn't turn back when the dribbler slows)
      if (ch > 0.3 && Math.abs(carrier.y - 34) < 20 && (cd < 9 || (!cover && cd < (coming || engaged ? GK_1V1.engage : GK_1V1.engageSlow)))) {   // (t-027: from further out)
        k.rushT = (k.rushT || 0) + dt;
        const bx = b.x + b.vx * 0.12, by = b.y + b.vy * 0.12, bdd = len(bx - gx, by - 34);
        const od = len(b.x - carrier.x, b.y - carrier.y), gapNow = len(b.x - k.x, b.y - k.y);
        const deep = coming || (engaged && cd < GK_1V1.stayOut); k.oneDeep = deep;
        // when could his dive get his hands on it? (the ball's path a beat at a time against how far a dive reaches by then)
        let Tm = 9; for (let t = 0; t <= 0.45; t += 0.05) if (len(b.x + b.vx * t - k.x, b.y + b.vy * t - k.y) <= 0.9 + 7.0 * Math.max(0, t - 0.06)) { Tm = t; break; }
        const smOk = !k.smAt || this.time.now - k.smAt > 1400;                        // (not straight after a dive)
        // go down when it's almost on him, when a touch gets away from the striker inside his reach, or right on top of
        // him. A striker cutting across further out is mirrored (CLOSE / BLOCK below), not dived at - a dive that early
        // is a guess, and a quick cut beats it every time (Test Lab KP2)
        const inBox = H(b.x) < 16.2 && Math.abs(b.y - 34) < 20;                       // t-027: further out he'd be diving with his hands outside his box - he blocks and waits instead
        const want = smOk && inBox && b.z < 0.6 && (Tm <= 0.18 || (od > 0.75 && Tm <= 0.35) || gapNow < 1.3);
        k.smWant = want ? (k.smWant || 0) + dt : 0;
        if (want && k.smWant >= react * 0.5) return { mode: 'SMOTHER', x: b.x, y: b.y, v: kv, dive: true };   // (a weaker keeper reads it a beat later)
        const still = carrier.speed < 1.2 && od < 0.6;                               // he's stopped with it under control: don't charge in, be set
        let g, mode;
        if (gapNow < GK_1V1.blockGap && bdd < GK_1V1.blockFrom && deep && !still) {                 // close: step up to ~1.4 m in front of the ball and make him commit (he used to back off to his line)
          const u = this.gkBisector(bx, by, gx, side, clamp(bdd - 1.4, 0.6, GK_1V1.blockMax)); g = u; mode = 'BLOCK';   // (t-027: never past the edge of his box)
        } else {
          const gap = deep ? clamp(GK_1V1.gap0 + bdd * GK_1V1.gapK, GK_1V1.gapMin, GK_1V1.gapMax) : clamp(1.4 + bdd * 0.3, 1.9, 7);   // how far in front of the ball he wants to be (t-027: nearer only on a breakaway)
          const far = clamp((bdd - GK_1V1.outNear) / 4, 0, 1), outCap = GK_1V1.outMax + (GK_1V1.outFar - GK_1V1.outMax) * far;   // (t-027: all the way out only as the striker gets near)
          const depth = clamp(bdd - gap, 1.0, deep ? outCap : GK_1V1.outSlow);         // (t-027: out towards the edge of the box for a breakaway; a striker walking across the box: as t-017)
          g = this.gkBisector(bx, by, gx, side, depth); mode = gapNow < 4 ? 'BLOCK' : 'CLOSE';
        }
        const set = gapNow > 2.6 && gapNow < 10 && od < 0.75 && carrier.speed < 3.2 && (still || !deep);
        const D = len(g.x - k.x, g.y - k.y);
        return { mode: set && mode === 'CLOSE' ? 'SET' : mode, x: g.x, y: g.y, v: set ? Math.min(1.4 + D * 2, 3) : clamp(1.4 + D * 3.2, 0, kv), set: set && D < 0.6, track: true, urgent: true };
      }
      k.oneDeep = false;
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
    // t-017: with a threat on he gets there at a speed set by how far he has to go (it was 5.4 or 2.6 m/s: a lurch, then a crawl)
    const v = threat || breaking ? clamp(1.0 + D * 2.8, 0, 5.4) : (D > 6 ? JOG : 1.9);   // walk when nothing is on; jog back into place; run when they break
    return { mode: w > 0.5 ? (ours ? 'UP' : 'SWEEPER') : shot ? 'SET' : 'ANGLE', x: tx, y: ty, v, set: !!shot && D < 0.8, track: bd < 32 };
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
    if (diving && p.saveKind === 'block') {                                   // t-017: planted and big - wider than standing, nothing held at pace
      touch = Math.abs(rel) < 1.0 && b.z < 1.95;
      clean = Math.abs(rel) < 0.5 && b.z < 1.5 && spd < 18;
    } else if (diving && p.saveKind === 'smother') {                          // t-017: spread on the grass at his feet
      touch = Math.abs(rel) < 1.15 && b.z < 0.9;
      clean = false;
    } else if (up) {                                                                 // jumping: hands up to ~3 m
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
    const sv = b.save, kind = up ? p.saveKind : diving && p.saveKind !== 'block' ? 'dive' : 'stand';
    if (sv && sv.close) return b.z > 1.9 ? 'tip' : 'wide';                    // going wide / over anyway: he makes sure of it
    const hold = clean && !b.special && (sv && sv.u != null ? sv.u < this.gkHoldChance(p, spd, kind) : spd < (diving ? 17 : 24));
    if (hold) return 'catch';
    if (up) return 'tip';                                                     // jumping: up and over
    if (diving && p.saveKind === 'diveHigh') return b.z > 2.15 ? 'tip' : 'wide';      // high to the corner: round the post, or over if it's under the bar
    if (b.z > 1.9) return 'tip';
    return (diving || spd > 14) && Math.random() < this.gkOutChance(p) ? 'wide' : 'parry';
  },
});
