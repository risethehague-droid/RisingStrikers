'use strict';
// HC2 Football · brain.js: the team brain (smarter-ai stage 2): the computer's move list on the ball, the match state
// (score + clock), team styles, and Rise Warrior reading your habits. The plan, its numbers and the co-designer's
// decisions: docs/smarter-ai.md. (New file in stage 2 - load order and lanes: src/README.md)
//
// The co-designer, 24 Oct: "smarter. Running, positioning, better passes, less clunky. For both enemy teams and allied
// team"; 27 Oct: "this team IQ is adaptive and incorporates future additional gameplay features added"; and "the number
// of goals should increase with little to no increase to the win rate". How real football and other games do it:
//  * real football: one presses, one covers, the rest screen; game management by score and clock (chase late, protect a lead)
//  * FIFA / EA FC: team tactics give every side its own style (tempo, width, pressing); PES 2008's Teamvision: the
//    computer adapting to the human (here only on Rise Warrior); Football Manager: mentality by score and clock
//  * Sensible Soccer: simple choices, made with conviction - nobody dithers

// ======================================================================= THE MOVE LIST (on the ball)
// carrierAI2's fixed chain of ifs (special, chip, shot, cross, pass) is now one list. Every move is an entry:
//   id          a short name (soak.js counts how often each one is played, per side)
//   available   (m, p, c) -> is it on at all? its switch, the meter, the moment it needs (a keeper off his line for the
//               chip...). Cheap: checked every think. soak.js fails a move that was available but never played.
//   look        (m, p, c) -> { value, want, how } or null: value ranks it against the others, want is the chance he
//               plays it now (the level's knobs, the style and the match state go in here), how is passed to play
//   play        (m, p, how, c) -> plays it; false = it couldn't (the next best one is tried)
// Every look reuses the game's own judgements (shotLook, passLook, crossLook, chipCan, aiTapAt...). Each think, the
// dice are rolled for every move he wants; of those that come up, he plays the one worth most. Nothing comes up: he
// carries on with it (carrierAI2's dribble / take-on steering).
// A NEW FEATURE JOINS IN with one entry here (and its switch in `available`): docs/smarter-ai.md "How a new move joins in".
// c = { K: the level's knobs, S: the team's style, M: the match state, toGoal, front, fd, pressed, sh: shotLook here,
//       pass(): passLook (worked out once, only if a move asks for it) }
const AI_MOVES = [
  { id: 'special',                                                               // v0.7 the special shot (meter 2+ bars, or 1 when full)
    available: (m, p) => { const lv = m.meterOf(p.team).level(); return lv >= (lv === 3 ? 1 : 2); },
    look: (m, p, c) => c.central && c.toGoal < 24 * (c.M.chase ? 1.15 : 1) ? { value: 6, want: 0.5 * c.K.sp * (1 + 0.6 * c.S.specials) * (c.M.chase ? 1.3 : 1) } : null,
    play: (m, p) => m.special(p) },
  { id: 'chip',                                                                  // v0.9.2 a keeper rushing out at him: chip him
    available: (m, p, c) => { const gko = p.team.opp.players[0]; return !!gko && !gko.sentOff && c.toGoal < 19 && (gko.x - p.team.opp.ownGoalX) * p.team.opp.side > c.K.chipOff; },
    look: (m, p, c) => { const team = p.team, gko = team.opp.players[0];
      const gH = (gko.x - team.opp.ownGoalX) * team.opp.side, gap = len(gko.x - p.x, gko.y - p.y);
      if (!(gap > 3 && gap < 12 && m.chipCan(p, { x: team.goalX - p.x, y: 34 - p.y }))) return null;
      return { value: 5, want: (gap < 7 || gH > 7 ? 0.55 : 0.3) * c.K.chip, how: clamp((gap - 3) / 8, 0, 1) * 0.6 }; },
    play: (m, p, how) => { m.chipShot(p, how, 0); } },
  { id: 'tap',                                                                   // t-010 the tap-in past the keeper (TAP_KICK: Test Lab only)
    available: () => TAP_KICK,
    look: (m, p) => { const dir = m.aiTapAt(p); return dir ? { value: 4.6, want: 0.9, how: dir } : null; },
    play: (m, p, dir) => { m.tapKick(p, dir); } },
  { id: 'shot',                                                                  // v0.8.2 a shot when there's a lane (shotLook)
    available: () => true,
    look: (m, p, c) => { const sh = c.sh, Q = c.K.shotQ, PR = c.PR;
      const want = (sh.q > 0.85 + Q ? 0.9 : sh.q > 0.6 + Q ? (c.toGoal < 20 * PR ? 0.6 : 0.3) : sh.q > 0.42 + Q ? (c.toGoal < 26 * PR ? 0.12 : 0.04) : 0) * c.K.shotWant * paceK().shotWant;
      if (!want) return null;
      const pw = c.toGoal < 14 ? rnd(0.5, 0.72) : c.toGoal < 22 ? rnd(0.62, 0.84) : rnd(0.76, 0.9);
      return { value: 3 + sh.q, want: want * (1 + 0.25 * c.S.direct) * (c.M.chase ? 1.5 : 1), how: { pw, aim: clamp(sh.aim + rnd(-0.15, 0.15), -1, 1) } }; },
    play: (m, p, h) => { m.doShot(p, h.pw, h.aim); } },
  { id: 'cross',                                                                 // t-012 from wide in the final third, at a runner
    available: () => true,
    look: (m, p, c) => { const r = m.aiCrossLook(p, c.K, c.pressed); return r ? { value: 2.6 + r.c.score * 0.3, want: r.want * c.K.cross * (1 + 0.5 * c.S.width), how: r.c } : null; },
    play: (m, p, cc, c) => { m.aiCross(p, cc, c.K); } },
  { id: 'line',                                                                  // t-012 a cross is on: take it on to the line rather than give it back
    available: (m, p, c) => p.crossOn && !c.pressed,
    look: (m, p, c) => ({ value: 2.4, want: 0.7 * Math.min(1, c.K.cross) }),
    play: () => true },
  { id: 'wall',                                                                  // smarter-ai (the co-designer, 29 Oct: "doing a 1-2 is impractical"): the man who just
    available: (m, p) => p.wallAt !== p.gotAt && !!m.wallRunner(p),              // passed to him is running on past his marker - first time, back into his path
    look: (m, p, c) => { const w = m.wallLook(p); if (!w) return null; p.wallAt = p.gotAt; return { value: 3.4, want: WALL.WANT * clamp(0.5 + 0.5 * c.K.sp, 0.5, 1), how: w }; },   // (one go per touch)
    play: (m, p, w) => { m.doPass(p, w.dir, w.mode, w.r); } },
  { id: 'pass',                                                                  // v0.8.2 the best pass (passLook): to feet, through, lobbed
    available: () => true,
    look: (m, p, c) => { const b = c.pass(); if (!b || b.risk >= c.riskMax) return null;
      const want = c.pressed && b.score > -0.4 ? 0.8 : b.shot > c.sh.q + 0.25 && b.score > 0.6 ? 0.6 : b.score > 1.4 ? 0.3 : 0;
      // (smarter-ai: pressed, a risky ball is worth less - keeping it or the safe ball can win)
      return want ? { value: 1.6 + b.score * 0.4 - (c.pressed ? b.risk * 1.5 : 0), want: want * (1 + 0.3 * c.S.tempo), how: b } : null; },
    play: (m, p, b) => { m.doPass(p, b.dir, b.mode, b.q); m.passAndGo(p, b); } },
  { id: 'safe',                                                                  // smarter-ai (clip 7): pressed, the best ball is to a marked man - the safe one back or square
    available: () => true,
    look: (m, p, c) => { const b = c.pass(); if (!b) return null;
      const keep = c.M.protect > 0.3 && c.S.protect !== 'deep';                  // (protecting a lead, a side that keeps the ball recycles it - NEUTRAL half as much)
      if (!(c.pressed && b.marked && b.risk > SAFE.RISK) && !keep) return null;
      const s = b.all.filter(o => o !== b && o.risk < 0.2 && o.score > b.score - 1.2).sort((u, v) => v.score - u.score)[0]; if (!s) return null;
      return { value: 1.6 + b.score * 0.4 - (c.pressed ? b.risk * 1.5 : 0) + 0.2 - 0.3 * c.S.direct, want: c.pressed ? 0.8 : (c.S.protect === 'keep' ? 0.25 : 0.12) * c.M.protect, how: s }; },   // (just above the risky ball)
    play: (m, p, s) => { m.doPass(p, s.dir, s.mode, s.q); } },
  { id: 'curve',                                                                 // t-011 the curving pass round the man in the lane (CURVE_PASS: Test Lab only)
    available: (m, p) => CURVE_PASS && m.meterOf(p.team).level() >= 1,
    look: (m, p, c) => { const b = c.pass(); if (!b) return null;
      const o = b.all.filter(x => x.mode !== 'lob' && x.lane > 0.6 && x.risk - x.lane < 0.3).sort((u, v) => (v.score + v.lane * 1.6) - (u.score + u.lane * 1.6))[0];
      if (!o || o.score + o.lane * 1.6 < 0.8) return null;
      return { value: 1.8 + (o.score + o.lane * 1.6) * 0.4, want: 0.45 * c.K.sp * (1 + 0.5 * c.S.specials), how: o }; },
    play: (m, p, o) => m.curvePass(p, o.mode, o.dir) },
  { id: 'carry',                                                                 // smarter-ai (clip 7): pressed, the ball is to a marked man and nothing's safe - keep it, shield it, go on
    available: (m, p, c) => c.pressed,
    look: (m, p, c) => { const b = c.pass(); return b && b.marked && b.risk > SAFE.KEEP && c.fd > 1.6 ? { value: 1.6 + b.score * 0.4 - b.risk * 1.5 + 0.1, want: 1 } : null; },   // (just above the risky ball)
    play: () => true },
];
// clip 7's rule: pressed, a ball to a marked man this risky loses to the safe one (RISK) or to keeping it (KEEP). Looser
// than it could be on purpose: tighter (0.3 / 0.45) made the top levels so careful they scored less
const SAFE = { RISK: 0.45, KEEP: 0.6 };
// the 1-2 (wall pass): how long after he got it he still plays it first time (s), the passer's run (m/s forward, how far
// level with or past the wall man), the lane (a defender this close to the line shuts it), how often it's taken
const WALL = { FIRST: 0.9, RUN_V: 2.4, PAST: -3, LANE: 1.4, LEAD: 0.7, WANT: 0.85, TRACK: 2.5 };
// how often each move was looked at (available) and played, by side: tools/soak.js reads it (the "never used" check)
const BRAIN_N = { seen: {}, used: {}, reset() { this.seen = {}; this.used = {}; } };

// ======================================================================= TEAM STYLES (step 4: build the dials, don't pick them)
// A style card per team, weights on the move list and the shape. Every dial runs -1 .. +1 (0 = as the game played before):
//   tempo     how quickly he decides and moves it on        width     how wide with the ball, how much it goes to the wings
//   direct    forward balls and early shots v keeping it    press     how high the team presses without the ball
//   risk      how risky a pass he'll try                    specials  how keen on the special shot / curving pass
//   protect   how it protects a lead: 'keep' (the ball), 'deep' (sits deep, counters), 'middle' (a bit of both)
// LUCA PICKS each team's personality with the co-designer. Until then every team is NEUTRAL; the Test Lab (group AI) has
// four examples to try, and tools/styles.js plays every style against every style (no style may win clearly more).
const STYLES = {
  neutral:    { name: 'NEUTRAL', tempo: 0, width: 0, direct: 0, press: 0, risk: 0, specials: 0, protect: 'middle' },
  possession: { name: 'PATIENT POSSESSION', tempo: -0.5, width: 0.3, direct: -0.4, press: 0.2, risk: -0.3, specials: -0.3, protect: 'keep' },
  wide:       { name: 'DIRECT AND WIDE', tempo: 0.4, width: 0.8, direct: 0.5, press: -0.2, risk: 0.3, specials: 0.2, protect: 'deep' },
  press:      { name: 'HIGH PRESS', tempo: 0.4, width: 0, direct: 0.2, press: 0.45, risk: 0.1, specials: 0, protect: 'keep' },
  counter:    { name: 'COUNTER', tempo: 0.6, width: 0.2, direct: 0.8, press: -0.3, risk: 0.3, specials: 0.4, protect: 'deep' },
};
const TEAM_STYLE = { IS: 'neutral', IRO: 'neutral', USCS: 'neutral', LUC: 'neutral', THUAS: 'neutral', AUC: 'neutral' };   // (Luca picks)

// ======================================================================= THE MATCH STATE (step 3)
// One number from the score and the clock, -1 (protect) .. +1 (chase), stronger as the clock runs down. Chasing late
// (the last 10%, a goal or more down) = BOLD (the co-designer's pick): a higher line, both strikers running, shots from
// further out, the keeper up for a corner. Protecting a lead = by the team's style ('keep' / 'deep' / 'middle').
const MOOD = { LATE: 0.9, LINE_CHASE: 7, LINE_DEEP: -6, LINE_MID: -3, RANGE_CHASE: 1.25, RISK_CHASE: 0.2, PRESS_LINE: 5 };

// ======================================================================= RISE WARRIOR READS YOUR HABITS (step 5)
// Rise Warrior only (the co-designer, 27 Oct; PES 2008's Teamvision as the recipe). Over the last few minutes, fading
// out (READ.FADE s of real play): your favourite flank (the cover shifts there), your shooting spots (closed down a
// beat sooner there), your dribble tricks (the side you cut past a man: he shows you the other way; when you burst: he
// gives you a little more room). Not your passing (the co-designer left that out). Rami says when they've read you.
const READ = { FADE: 75, FLANK_MIN: 14, FLANK_BIAS: 0.3, SHIFT: 4, SPOT_R: 6, SPOT_MIN: 1.6, CUT_MIN: 2.2, CUT_BIAS: 0.4, SHOW: 0.9, BURST_MIN: 2 };

// ---------------------------------------------------------------- Match methods: brain
hc2Mix(Match, {
  // the team's style card (the Test Lab and tools/styles.js set window.__styles = { home: 'press', away: 'counter' })
  brainStyle(team) {
    const o = window.__styles, s = team === this.home ? 'home' : 'away';
    return STYLES[(o && o[s]) || TEAM_STYLE[team.name]] || STYLES.neutral;
  },
  // the match state for a team, once a frame (ai()): s -1 (protect) .. +1 (chase), chase = late and behind
  brainMood(team) {
    const d = team.score - team.opp.score, et = this.half >= 3, len0 = (et ? 120 : 90) * 60;
    const el = clamp(this.clock / len0, 0, 1), late = this.half === (et ? 4 : 2) && el >= MOOD.LATE;
    const s = d === 0 ? 0 : clamp(-Math.sign(d) * (0.2 + 0.8 * el * el) * Math.min(2, Math.abs(d)) / 1.4, -1, 1);
    return { s, late, chase: late && d < 0, protect: d > 0 ? -s : 0 };
  },
  // how far the line steps up (+) or drops (-), metres: the style's pressing height without the ball, the match state
  brainLine(team) {
    const S = this.brainStyle(team), M = team.mood || { s: 0, protect: 0 }, out = 1 - (team.poss ?? 0);
    let x = S.press * MOOD.PRESS_LINE * out;
    if (M.chase) x += MOOD.LINE_CHASE;
    else if (M.protect > 0) x += M.protect * (S.protect === 'deep' ? MOOD.LINE_DEEP : S.protect === 'keep' ? MOOD.LINE_MID * 0.5 : MOOD.LINE_MID);
    return x;
  },
  // the computer on the ball, once he's thought (carrierAI2): every move on the list, the best of those that come up
  brainChoose(p, c) {
    const team = p.team, K = c.K, S = c.S = this.brainStyle(team), M = c.M = team.mood || this.brainMood(team);
    c.central = Math.abs(p.y - 34) < 16 + Math.max(0, 18 - c.toGoal) * 0.3;
    c.PR = paceK().shotRange * (M.chase ? MOOD.RANGE_CHASE : 1);                // (arcade-2: ARCADE shoots from ~20% further; chasing: further still)
    c.sh = c.toGoal < 32 * c.PR ? this.shotLook(team, p.x, p.y) : { q: 0, aim: 0 };
    c.riskMax = (c.pressed ? Math.max(K.risk, 0.6) : K.risk) * (1 + 0.35 * S.risk) + (M.chase ? MOOD.RISK_CHASE : 0) - (M.protect > 0.3 ? (S.protect === 'keep' ? 0.1 : S.protect === 'middle' ? 0.05 : 0) : 0);
    let pl; c.pass = () => pl === undefined ? (pl = this.passLook(p)) : pl;
    const side = team === this.home ? 'home' : 'away', N = BRAIN_N, picks = [];
    for (const mv of AI_MOVES) {
      if (!mv.available(this, p, c)) continue;
      const k = side + '.' + mv.id; N.seen[k] = (N.seen[k] || 0) + 1;
      const r = mv.look(this, p, c); if (!r || !(r.want > 0)) continue;
      if (Math.random() < r.want) picks.push({ mv, r });
    }
    picks.sort((u, v) => v.r.value - u.r.value);
    for (const { mv, r } of picks) if (mv.play(this, p, r.how, c) !== false) { const k = side + '.' + mv.id; N.used[k] = (N.used[k] || 0) + 1; p.lastMove = mv.id; return mv.id; }
    return null;
  },
  // between his thinks: only the 1-2 is looked at (first time - he can't wait to think), once per touch
  brainWall(p, K) {
    const mv = AI_MOVES.find(x => x.id === 'wall'), c = { K, S: this.brainStyle(p.team), M: p.team.mood || this.brainMood(p.team) };
    if (!mv.available(this, p, c)) return false; const r = mv.look(this, p, c); if (!r || !(Math.random() < r.want)) return false;
    mv.play(this, p, r.how, c); const k = (p.team === this.home ? 'home' : 'away') + '.wall'; BRAIN_N.used[k] = (BRAIN_N.used[k] || 0) + 1; BRAIN_N.seen[k] = (BRAIN_N.seen[k] || 0) + 1; p.lastMove = 'wall'; return true;
  },
  // THE 1-2: who passed to him a moment ago and is now running on (ai() notes p.gotFrom / p.gotAt when the ball arrives).
  // Your own run counts the same as a computer team-mate's: the receiver looks for it first (it outranks a normal pass)
  wallRunner(p) {
    const r = p.gotFrom; if (!r || r.sentOff || r.team !== p.team || r.keeper || this.time.now - (p.gotAt || 0) > WALL.FIRST * 1000) return null;
    const side = p.team.side, vf = r.vx * side; if (vf < WALL.RUN_V || r.busy() || r.stun > 0) return null;
    if (this.aiFrame(p.team, r.x) < this.aiFrame(p.team, p.x) + WALL.PAST) return null;   // (he has to be getting level with / past the wall man)
    if (offsideOn() && this.offPos(r, this.offLine(p.team))) return null;
    return r;
  },
  // the return ball: into his path (where he'll be ~LEAD s on), along the grass, only if the lane is open and no defender
  // gets there first - so a well-timed 1-2 works and a covered one isn't tried
  wallLook(p) {
    const r = this.wallRunner(p); if (!r) return null;
    const tx = clamp(r.x + r.vx * WALL.LEAD * 1.4, 2, PITCH_L - 2), ty = clamp(r.y + r.vy * WALL.LEAD * 1.4, 2, PITCH_W - 2), dx = tx - p.x, dy = ty - p.y, d = len(dx, dy);
    if (d < 4 || d > 30) return null;
    const Tb = passTime(d) + 0.15, tr = len(tx - r.x, ty - r.y) / Math.max(4, r.speed);
    for (const o of p.team.opp.players) { if (o.sentOff || o.keeper) continue;
      const t = ((o.x - p.x) * dx + (o.y - p.y) * dy) / (d * d); if (t > 0.05 && t < 1) { const lat = Math.abs((o.x - p.x) * dy - (o.y - p.y) * dx) / d; if (lat < WALL.LANE) return null; }
      if (0.3 + Math.max(0, len(o.x - tx, o.y - ty) - 1) / 6.5 < Math.max(Tb, tr) - 0.1) return null; }
    return { r, dir: { x: (r.x - p.x) / (len(r.x - p.x, r.y - p.y) || 1), y: (r.y - p.y) / (len(r.x - p.x, r.y - p.y) || 1) }, mode: 'through' };
  },
  // PASS AND MOVE (real football's one-two and third-man run; the co-designer: "running, positioning"): a midfielder or
  // forward who plays a forward ground ball in their half goes on past the man he found, on the other side of him, for
  // ~2.5 s (ai(): his target while we have it), so there's a return ball or a ball in behind - instead of jogging back
  passAndGo(p, b) {
    const team = p.team, q = b.q; if (!q || p.i < 5 || b.mode === 'lob' || b.progress < 2 || this.aiFrame(team, p.x) < -10 || p.stamina < 0.3) return;
    const X = Math.max(this.aiFrame(team, p.x), this.aiFrame(team, q.x)) + 8, sd = Math.sign(p.y - q.y) || 1;
    p.goRun = { t: this.time.now, x: clamp(this.aiWorld(team, Math.min(X, 47)), 2, PITCH_L - 2), y: clamp(q.y + sd * 6, 4, PITCH_W - 4) };
  },
  // the keeper goes up for a corner: chasing late, a corner for his side (spShape puts him at the far post) - and from the
  // kick he attacks it like the runners do, then sprints back once it's gone (keeperAI asks this first)
  brainKeeperUp(team) { const M = team.mood || this.brainMood(team); return M.chase && !(team === this.home && !this.demo && this.human && this.human.keeper); },
  keeperUp(k, dt) {
    const U = k.up; if (!U) return false;
    const b = this.ball, sp = this.setPiece;
    if (sp && !sp.kicked && sp.team === k.team && sp.kind === 'CORNER') return false;   // (the set-up: settle() walks him to his spot)
    const t = (this.time.now - U.t) / 1000, inBox = Math.abs(b.x - k.team.goalX) < 20 && Math.abs(b.y - 34) < 24;
    if (t < 6 && !b.owner && inBox && b.lastP && b.lastP.team === k.team) {       // the corner's in the air (or loose in their box): attack it
      const v = k.top(true, false), pt = this.meetCross(k, v) || this.intercept(k, v, 0.12, 2.1); k.sprinting = true; k.moveTo(pt.x, pt.y, v, dt); return true; }
    if (Math.abs(k.x - k.team.ownGoalX) > 20) { k.sprinting = true; k.moveTo(k.team.ownGoalX + k.team.side * 2, 34, k.top(true, false), dt); return true; }   // it's gone: back, flat out
    k.up = null; return false;
  },
  // ---------- Rise Warrior's read (step 5): only against you, only on Rise Warrior (window.__readOn: the Test Lab)
  readOn() { return window.__readOn != null ? !!window.__readOn : !this.demo && DIFF_LEVEL === 'rise' && !window.__diffTeams; },
  readTick(dt) {
    if (!this.readOn()) { this.read = null; return; }
    const R = this.read || (this.read = { a: 0, b: 0, spots: [], cutA: 0, cutB: 0, burstD: 0, burstN: 0, said: {}, front: null, shotT: null, burst: false });
    const f = Math.exp(-dt / READ.FADE), you = this.home, b = this.ball, o = b.owner;
    R.a *= f; R.b *= f; R.cutA *= f; R.cutB *= f; R.burstN *= f; for (const s of R.spots) s.w *= f;
    R.spots = R.spots.filter(s => s.w > 0.05);
    if (!this.setPiece && !this.dead) {                                          // (live play only)
      // your flank: where the ball is while you have it past halfway (y < 34: the far touchline, as the camera shows it)
      if (o && o.team === you && this.aiFrame(you, b.x) > -5 && Math.abs(b.y - 34) > 9) R[b.y < 34 ? 'a' : 'b'] += dt;
      // your shooting spots: where each of your shots was hit from
      if (b.shotT && b.shotT !== R.shotT && b.lastP && b.lastP.team === you) { R.shotT = b.shotT; const P = b.lastP;
        const s = R.spots.find(q => len(q.x - P.x, q.y - P.y) < READ.SPOT_R / 2); if (s) s.w += 1; else R.spots.push({ x: P.x, y: P.y, w: 1 }); }
      // your dribble tricks: the side you go past a man, and how close he is when you burst
      const me = o && o.team === you && o === this.human ? o : null;
      if (me) {
        const ax = you.side; let fr = null, fd = 3.5;
        for (const e of you.opp.players) { if (e.keeper || e.sentOff) continue; const dx = (e.x - me.x) * ax, d = len(e.x - me.x, e.y - me.y); if (dx > 0.3 && d < fd) { fd = d; fr = e; } }
        if (fr) R.front = fr;
        else if (R.front) { const e = R.front, dx = (e.x - me.x) * ax; if (dx < -0.2 && len(e.x - me.x, e.y - me.y) < 3) { R[me.y < e.y ? 'cutA' : 'cutB'] += 1; } if (dx < -0.2 || len(e.x - me.x, e.y - me.y) > 5) R.front = null; }
        const bu = (me.burst || 0) > 0; if (bu && !R.burst) { let n = 9; for (const e of you.opp.players) if (!e.keeper && !e.sentOff) n = Math.min(n, len(e.x - me.x, e.y - me.y)); if (n < 8) { R.burstD = (R.burstD * R.burstN + n) / (R.burstN + 1); R.burstN += 1; } }
        R.burst = bu;
      } else { R.front = null; R.burst = false; }
    }
    // tell you once each read is on (Rami): the flank, the spots, the trick
    const say = (k, text) => { if (R.said[k]) return; R.said[k] = true; this.ramiSay('banter', { text, expr: 'talk', lab: true }, 2); };
    const fb = this.readFlank(); if (fb) say('flank', `RISE WARRIOR HAVE READ YOU!\nEVERYTHING GOES DOWN THE ${fb < 0 ? 'FAR' : 'NEAR'} SIDE`);
    if (R.spots.some(s => s.w >= READ.SPOT_MIN)) say('spot', 'THEY KNOW WHERE YOU\nLIKE TO SHOOT FROM!');
    if (this.readCut()) say('cut', 'THEY\'VE SEEN THAT TRICK -\nNOW THEY SHOW YOU THE OTHER WAY!');
  },
  // the flank you favour: -1 the far side (y < 34), +1 the near side, 0 no read yet
  readFlank() { const R = this.read; if (!R || R.a + R.b < READ.FLANK_MIN) return 0; const bias = (R.b - R.a) / (R.a + R.b); return Math.abs(bias) > READ.FLANK_BIAS ? Math.sign(bias) : 0; },
  // the side you go past a man: -1 his far side (lower y), +1 his near side, 0 no read
  readCut() { const R = this.read; if (!R || R.cutA + R.cutB < READ.CUT_MIN) return 0; const bias = (R.cutB - R.cutA) / (R.cutA + R.cutB); return Math.abs(bias) > READ.CUT_BIAS ? Math.sign(bias) : 0; },
  // you're on one of your shooting spots: they close you down a beat sooner there
  readHot(p) { const R = this.read; return !!R && p === this.human && R.spots.some(s => s.w >= READ.SPOT_MIN && len(s.x - p.x, s.y - p.y) < READ.SPOT_R); },
});
