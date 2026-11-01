'use strict';
// HC2 Football · replay.js: replays, highlights and BUG WATCH (the game checking its own footage)
// (split out of game.js in v0.9.5 - load order and lanes: src/README.md)

// ======================================================================= v0.8.7 BUG WATCH (Luca, 23 Oct 06:04: "add a feature in
// which the ai keeps checking the footage played and checks for errors, pulls them up, we review")
// Every frame of a match (yours, the demo behind the menu, Claude's overnight test matches) the game checks its own state
// against the rules below. When one trips it keeps the clip: the last 4 s of footage + 1.5 s after (the frames the replays
// use), what tripped, the numbers behind it and a 6-second trace. Pause menu / B at full time → BUG WATCH: watch each clip
// with the spot circled, mark it BUG / FINE / NOT SURE, add a note. Clips also go to the game's database (when the page
// has one), so Claude can read them back and fix what's real. This browser keeps the last 8 either way.
const BW_CHECKS = {
  MANUAL:      { t: 'YOU MARKED THIS', sev: 'mark', why: 'you pressed N while watching (watch mode)' },
  CRASH:       { t: 'GAME ERROR', sev: 'bug', why: 'the code threw an error (or a promise failed with nobody catching it)' },
  // t-021 (Luca 25 Oct 06:44: "it should flag mechanics issues, actual game bugs, when game code breaks and clear errors
  // occurs"): the errors that never reached Bug Watch before, and new checks for broken mechanics
  CONSOLE_ERR: { t: 'ERROR IN THE LOG', sev: 'bug', why: 'the code (or Phaser) reported an error with console.error' },
  FROZE:       { t: 'GAME FROZE', sev: 'bug', why: 'the page was open and visible, but the game stopped drawing frames (an error killed the loop, or it hung)' },
  CLOCK_FROZEN: { t: 'CLOCK STOPPED', sev: 'bug', why: 'live play, but the match clock has not moved for 4 s' },
  BALL_TOO_FAST: { t: 'BALL FLEW OFF', sev: 'bug', why: 'the ball went faster than 45 m/s without a special (the physics blew up)' },
  BALL_UNDER:  { t: 'BALL UNDER THE GRASS', sev: 'bug', why: 'the ball is below the ground' },
  THROUGH_KEEPER: { t: 'THROUGH THE KEEPER', sev: 'bug', why: 'a shot passed through the keeper\'s body (within 0.3 m, under 1.5 m up) with no touch and no guard break' },
  IN_THE_NET:  { t: 'PLAYER IN THE NET', sev: 'bug', why: 'a player has stood inside the goal (behind the line, between the posts) for 1.5 s of live play' },
  GOAL_TWICE:  { t: 'GOAL COUNTED TWICE?', sev: 'bug', why: 'the score went up by 2 within 3 s' },
  TEAM_FROZEN: { t: 'TEAM FROZEN', sev: 'bug', why: 'all of one team\'s outfield players stood still for 3 s of live play' },
  CONTROL_DEAD: { t: 'CONTROLS NOT ANSWERING', sev: 'bug', why: 'you held a direction for 1 s, your man was free to move (not busy, not stunned) and he did not move' },
  NAN:         { t: 'BROKEN NUMBERS', sev: 'bug', why: 'a position or a speed stopped being a number' },
  BALL_GONE:   { t: 'BALL LEFT THE STADIUM', sev: 'bug', why: 'the ball is far outside the pitch' },
  OUT_LIVE:    { t: 'OUT, BUT PLAY GOES ON', sev: 'bug', why: 'the ball has been over a line for a second and nobody stopped play' },
  GOAL_MISSED: { t: 'GOAL NOT GIVEN?', sev: 'bug', why: 'the whole ball was over the goal line, between the posts, under the bar - and no goal' },
  GOAL_WRONG:  { t: 'GOAL THAT WASN\'T?', sev: 'bug', why: 'a goal was given with the ball outside the posts or over the bar' },
  OWNER_FAR:   { t: 'BALL NOT AT HIS FEET', sev: 'bug', why: 'a player has the ball but it is far away from him' },
  TELEPORT:    { t: 'JUMPED', sev: 'bug', why: 'something moved further in one frame than anyone can run' },
  HANDS_OUT:   { t: 'KEEPER HANDLES OUTSIDE HIS BOX', sev: 'bug', why: 'the keeper holds the ball outside his penalty area' },
  NO_SPRITE:   { t: 'PLAYER NOT DRAWN', sev: 'bug', why: 'a player on the pitch is invisible or has no picture' },
  FLOW_STUCK:  { t: 'GAME STUCK', sev: 'bug', why: 'a stoppage (set piece, freeze, foul, kick) never ends' },
  STUCK_STATE: { t: 'STUCK IN A MOVE', sev: 'bug', why: 'a player has been in one move for far too long' },
  WHIFF:       { t: 'SPECIAL MISSED THE BALL', sev: 'bug', why: 'a special move went off but never touched the ball' },
  STUCK_BALL:  { t: 'NOBODY GOES FOR THE BALL', sev: 'bug', why: 'the ball lies still in play and nobody takes it' },
  OFF_WORLD:   { t: 'PLAYER OFF THE PITCH', sev: 'odd', why: 'a player has been pinned against the edge of the world (3 m outside the lines) during play' },
  HOLDS_BALL:  { t: 'FROZEN ON THE BALL', sev: 'odd', why: 'a computer player stands on the ball and does nothing' },
  KEEPER_HOLD: { t: 'KEEPER WON\'T LET GO', sev: 'odd', why: 'the keeper has held the ball for 9 s' },
  SWARM:       { t: 'EVERYONE ON THE BALL', sev: 'odd', why: 'most players crowd round the ball for a long time' },
  KEEPER_WANDER:{ t: 'KEEPER MILES FROM GOAL', sev: 'odd', why: 'a keeper is more than 40 m from his goal during play' },
  FOUL_FAR:    { t: 'FOUL FROM A DISTANCE', sev: 'odd', why: 'a foul was given with the two players far apart' },
  STACKED:     { t: 'PLAYERS INSIDE EACH OTHER', sev: 'odd', why: 'two players stand on the same spot for 2 s' },
  // t-021: 'look' = cosmetic. Counted (the soak prints the numbers), but no clip, no database doc, no badge, not in the
  // lists: the art is still beta, and ~230 flicker clips a soak buried the real bugs.
  JITTER:      { t: 'FLICKERING', sev: 'look', why: 'a player keeps flipping the way he faces' },
  ANIM_FLICKER: { t: 'ANIMATION FLICKER', sev: 'look', why: 'animations flash up for a frame or two and switch again (idle / walk / run...)' },
  BALL_ON_PLAYER: { t: 'BALL STUCK ON A PLAYER', sev: 'odd', why: 'the ball sits at a player\'s feet but he never takes it' },
  PASS_LOOP:   { t: 'BACK AND FORTH', sev: 'odd', why: 'two players pass to each other again and again' },
  STUTTER:     { t: 'STUTTER', sev: 'look', why: 'the game skipped frames several times in a few seconds' },
  FLAG:        { t: 'YOU FLAGGED THIS', sev: 'flag', why: 'you pressed F (INSTA FLAG) and said what looks wrong' },
};
// t-021: the review screens lead with real bugs - errors first (with their stack), then broken mechanics, your flags and
// marks, then the 'looks odd' AI checks. A clip from before t-021 is judged by its code's kind today (old flicker
// clips were 'odd' / 'perf' then and are hidden now).
const BW_ERR = new Set(['CRASH', 'CONSOLE_ERR', 'FROZE']), BW_RANK = { bug: 1, flag: 2, mark: 3, odd: 4, perf: 5, look: 6 };
// t-035: a GAME FROZE clip the watchdog tagged 'odd' (the browser paused the page: no focus / hidden) is not a code error
const bwPaused = x => x.code === 'FROZE' && x.sev === 'odd';
const bwSev = x => (bwPaused(x) ? 'odd' : BW_CHECKS[x.code] ? BW_CHECKS[x.code].sev : x.sev);
const bwLook = x => bwSev(x) === 'look';
const bwRank = x => (BW_ERR.has(x.code) && !bwPaused(x) ? 0 : BW_RANK[bwSev(x)] ?? 5);
const bwOrder = (a, b) => (a.review ? 1 : 0) - (b.review ? 1 : 0) || bwRank(a) - bwRank(b) || (a.old ? 1 : 0) - (b.old ? 1 : 0) || String(b.at || '').localeCompare(String(a.at || ''));
// t-006 INSTA FLAG (Luca, 24 Oct 05:57: "a button where you can insta flag an issue in the game, auto clips last 5
// seconds or whatever you think is best ... type the problem ... then instantly start working on fixing the issue").
// F / pad BACK / the HUD's FLAG button: the game stops, you write (or dictate) a note, SEND keeps the last 8 s as a
// Bug Watch clip (kind 'flag') with the note + the match's settings, and wakes the fixer task on Luca's account through
// the Claude Code Remote connector (the same call HC2 HQ's "Check now" makes). FLAG_TRIGGER is that task's id: the
// taskmaster fills it in (and gives the page the 'mcp' capability) when it merges. Empty = the clip is only saved.
// Set at the v0.11.0 merge (24 Oct): the "HC2 INSTA FLAG fixer" scheduled task on Luca's account. Only Luca's own
// account can wake it (a friend's flag is still saved as a clip; their call is refused and the clip says woke 'failed').
const FLAG_TRIGGER = 'trig_01VzRQHSabhTC2L8tbWSX2aP';
const FLAG_SECS = 8, REC_MAX = 660;          // the recorder keeps 11 s at 60 a second: 8 s for a flag, 10 s for REPLAY (LAST 10 S)
const RP_SPEEDS = [1, 0.5, 0.25];             // the replay player's slow-mo steps
const REC_ALL_MAX = 30 * 60 * 40;             // the whole-match recorder: 40 real minutes at 30 a second (recAllPush)
const BW_VERDICT = { bug: 'BUG', fine: 'FINE', unsure: 'NOT SURE' };
const BW_MAX = 30, BW_GAP = 25000, BW_PRE = 240, BW_POST = 90, BW_KEEP = 8;
const BW_LONG = new Set(['applaud', 'party', 'trophy', 'dejected', 'celebrate', 'hurt', 'beaten', 'roar', 'protest', 'labanim', 'pick', 'runup', 'flight', 'done', 'walk']);
let BW_ON = (() => { try { return localStorage.getItem('hc2-bw') !== 'off'; } catch (e) { return true; } })();
function setBwOn(v) { BW_ON = !!v; try { localStorage.setItem('hc2-bw', v ? 'on' : 'off'); } catch (e) {} }
// QA overnight 24 Oct: a clip's id used to take its random part from Math.random, the game's own dice. The soak and the
// Lab seed those dice, so every clip Bug Watch saved shifted every roll after it: a fix that only changed how often a
// check trips (even a drawing fix) replayed a different match, and the soak's repro lines stopped matching. The id now
// takes its random part from the browser's crypto source, which the game never rolls.
const bwTag = () => { try { return (crypto.getRandomValues(new Uint32Array(1))[0] % 46656).toString(36); } catch (e) { return (Date.now() % 46656).toString(36); } };
const bwF1 = v => (Number.isFinite(v) ? v.toFixed(1) : String(v)), bwF2 = v => (Number.isFinite(v) ? v.toFixed(2) : String(v));

// a clip, packed small enough for the database: 30 frames a second, whole pixels, frame names in a table
function bwPack(frames, mark) {
  const names = [], ix = new Map(), N = s => { let i = ix.get(s); if (i === undefined) { i = names.length; names.push(s); ix.set(s, i); } return i; };
  const r = v => Math.round(v || 0), r10 = v => Math.round((v || 0) * 10), rk = v => Math.round((v || 0) * 1000), out = [], ex = {};
  let acc = 0;
  frames.forEach((f, i) => {
    acc += f.dt || 0; if (i % 2 && i !== frames.length - 1) return;
    const row = [Math.round(acc * 1000), r(f.cam[0]), r(f.cam[1]), r(f.b[0]), r(f.b[1]), N(f.b[2]), f.b[3] ? 1 : 0, r10(f.b[4]), rk(f.b[5]),
      r(f.s[0]), r(f.s[1]), rk(f.s[2]), r10(f.s[3]), rk(f.s[4]), f.p.length];
    for (const v of f.p) row.push(r(v[0]), r(v[1]), N(v[2]), v[3] ? 1 : 0, r10(v[4]), rk(v[5]), rk(v[6]), v[7] ? 1 : 0);
    if (f.r) row.push(r(f.r[0]), r(f.r[1]), N(f.r[2]), f.r[3] ? 1 : 0, r10(f.r[4]), f.r[5] ? 1 : 0);
    out.push(row); acc = 0;
    // t-006 (every effect in replays): a stored clip keeps its effects too - the effect sprites, the rough rigs' turn /
    // squash, the ball's white flash, the camera's flash and shake - in a side table by row (v1 clips have none)
    const e = [], rig = [];
    f.p.forEach((v, k) => { if (v[8] || (v[9] ?? 1) !== 1 || (v[10] ?? 1) !== 1) rig.push(k, rk(v[8]), rk(v[9] ?? 1), rk(v[10] ?? 1)); });
    if (rig.length) e.push('g', rig);
    if (f.b[6]) e.push('t', 1);
    if (f.fl) e.push('fl', [f.fl[0], f.fl[1], f.fl[2], Math.round(f.fl[3] * 100)]);
    if (f.sh) e.push('sh', Math.round(f.sh * 1e4));
    if (f.nt) e.push('n', f.nt.map(rk));                                          // t-025: the net (its bulges, an LV3's hole)
    if (f.x && f.x.length) e.push('x', [].concat(...f.x.map(q => [N(q[0]), N(q[1]), r(q[2]), r(q[3]), r10(q[4]), rk(q[5]), rk(q[6]), rk(q[7]), Math.round(q[8] * 100), q[9] ? 1 : 0, rk(q[10]), rk(q[11]), q[12], q[13] ? 1 : 0])));
    if (e.length) ex[out.length - 1] = e;
  });
  return JSON.stringify({ v: 2, mark: Math.round((mark || 0) / 2), names, f: out, ex });
}
function bwUnpack(s) {
  const d = typeof s === 'string' ? JSON.parse(s) : s, N = d.names, EX = d.ex || {};
  const frames = d.f.map((row, j) => {
    let k = 0; const g = () => row[k++];
    const f = { dt: g() / 1000, cam: [g(), g()], b: [g(), g(), N[g()], !!g(), g() / 10, g() / 1000], s: [g(), g(), g() / 1000, g() / 10, g() / 1000], p: [] };
    const n = g(); for (let i = 0; i < n; i++) f.p.push([g(), g(), N[g()], !!g(), g() / 10, g() / 1000, g() / 1000, !!g()]);
    f.r = k < row.length ? [g(), g(), N[g()], !!g(), g() / 10, !!g()] : null;
    const e = EX[j];
    if (e) for (let i = 0; i < e.length; i += 2) {
      const key = e[i], v = e[i + 1];
      if (key === 'g') for (let q = 0; q < v.length; q += 4) { const P = f.p[v[q]]; if (P) P.push(v[q + 1] / 1000, v[q + 2] / 1000, v[q + 3] / 1000); }
      else if (key === 't') f.b[6] = 1;
      else if (key === 'fl') f.fl = [v[0], v[1], v[2], v[3] / 100];
      else if (key === 'sh') f.sh = v / 1e4;
      else if (key === 'n') f.nt = v.map(q => q / 1000);
      else if (key === 'x') { f.x = []; for (let q = 0; q < v.length; q += 14) f.x.push([N[v[q]], N[v[q + 1]], v[q + 2], v[q + 3], v[q + 4] / 10, v[q + 5] / 1000, v[q + 6] / 1000, v[q + 7] / 1000, v[q + 8] / 100, !!v[q + 9], v[q + 10] / 1000, v[q + 11] / 1000, v[q + 12], !!v[q + 13]]); }
    }
    return f;
  });
  return { frames, mark: d.mark || 0 };
}

class BugWatch {
  constructor(m) { this.m = m; this.list = []; this.cap = null; this.sent = 0; this.reset(); this.loadOld(); }
  reset() { if (this.cap) this.finish(); this.k = {}; this.seen = {}; this.trace = []; this.traceT = 0; this.pos = null; this.bpos = null; this.wasLive = false; this.inNet = false; this.hitch = []; this.faces = []; this.owners = []; this.lastOwner = null; this.wasFoul = false; this.now = 0; this.stats = {}; this.perCode = {}; this.score0 = null; this.goalT = []; this.clk0 = null; this.bz0 = 0; this.cd = null; this.errs = {}; if (this.m) this.m.recPrev = null; }   // (a new match: no frames from the last one in a flag)
  watching() { const m = this.m; return BW_ON && !!m.home && !!(window.HC2_STARTED || m.demo || window.__labWatch) && !(window.__lab && !window.__labWatch); }
  live() {
    const m = this.m;
    return !(m.freeze > 0 || m.foulScene || m.setPiece || m.dead || m.intro || m.ht || m.toss || m.pre || m.over || m.paused || m.replay
      || m.penaltyMode || m.ceremony || m.so || m.hitStop > 0 || m.ball.inNet || m.bwUI);
  }
  hold(key, on, dt, s) {                                  // true once, when `on` has lasted s seconds (again only after it stops)
    if (!on) { delete this.k[key]; return false; }
    const v = this.k[key] = (this.k[key] || 0) + dt; if (v >= s) { this.k[key] = -1e9; return true; } return false;
  }
  who(p) { return p ? `${p.team.name} #${p.num}${p.keeper ? ' (keeper)' : ''}` : ''; }
  nearest(b) { let best = null; for (const p of this.m.all) { if (p.sentOff || p.hide) continue; const d = len(p.x - b.x, p.y - b.y); if (!best || d < best.d) best = { p, d }; } return best; }
  tick(dt) {
    if (!this.watching()) return;
    const m = this.m, b = m.ball, A = m.all, live = this.live(), F = Number.isFinite;
    this.traceTick(dt, live); this.now += dt;
    if (b.owner && b.owner !== this.lastOwner) {                 // who has had it: two players passing it back and forth for ever
      this.owners.push([this.now, A.indexOf(b.owner)]); if (this.owners.length > 8) this.owners.shift();
      const O = this.owners.slice(-7), ids = [...new Set(O.map(o => o[1]))];
      if (O.length === 7 && ids.length === 2 && O.every((o, j) => j === 0 || o[1] !== O[j - 1][1]) && this.now - O[0][0] < 15 && A[ids[0]] && A[ids[1]] && A[ids[0]].team === A[ids[1]].team)
        this.flag('PASS_LOOP', `${this.who(A[ids[0]])} and #${A[ids[1]].num} passed it between them 6 times in ${bwF1(this.now - O[0][0])} s`, { p: A[ids[0]] });
    }
    this.lastOwner = b.owner || this.lastOwner;
    if (m.foulScene && !this.wasFoul) { const F = m.foulScene, d = F.by && F.victim ? len(F.by.x - F.victim.x, F.by.y - F.victim.y) : 0;
      if (d > 2.6) this.flag('FOUL_FAR', `${this.who(F.by)} fouled ${this.who(F.victim)} from ${bwF1(d)} m away (${F.card || 'no card'})`, { p: F.by }); }
    this.wasFoul = !!m.foulScene;
    if (![b.x, b.y, b.z, b.vx, b.vy, b.vz].every(F)) this.flag('NAN', `ball at ${[b.x, b.y, b.z].join(', ')} moving ${[b.vx, b.vy, b.vz].join(', ')}`);
    for (const p of A) if (!p.sentOff && ![p.x, p.y, p.vx, p.vy].every(F)) { this.flag('NAN', `${this.who(p)} at ${p.x}, ${p.y} moving ${p.vx}, ${p.vy} (${p.state})`, { p }); break; }
    if (!b.inNet && !this.m.dead && (b.x < -25 || b.x > PITCH_L + 25 || b.y < -25 || b.y > PITCH_W + 25 || b.z > 50)) this.flag('BALL_GONE', `ball at ${bwF1(b.x)}, ${bwF1(b.y)}, ${bwF1(b.z)} m up`);
    // t-021 mechanics checks that hold at any moment. (Like every check here they only READ the game: no dice, nothing
    // written back - the soak plays the same match with or without them.)
    const bs = Math.hypot(b.vx, b.vy, b.vz);
    if (!b.owner && !b.special && bs > 45) this.flag('BALL_TOO_FAST', `the ball at ${bwF1(bs)} m/s (${Math.round(bs * 3.6)} km/h) with no special, at ${bwF1(b.x)}, ${bwF1(b.y)}, ${bwF2(b.z)} m up`, { p: b.lastP && b.lastP.team ? b.lastP : null });
    if (!b.inNet && b.z < -0.05) this.flag('BALL_UNDER', `the ball ${bwF2(-b.z)} m under the grass at ${bwF1(b.x)}, ${bwF1(b.y)} (moving ${bwF1(b.vz)} m/s up)`);
    { const sc = m.home.score + m.away.score;                                  // GOAL_TWICE: two goals within 3 s (or a jump of 2)
      if (this.score0 != null && sc > this.score0) { for (let k = this.score0; k < sc; k++) this.goalT.push(this.now); this.goalT = this.goalT.filter(t => this.now - t < 3);
        if (this.goalT.length >= 2) { this.flag('GOAL_TWICE', `the score went up by ${this.goalT.length} in ${bwF1(this.now - this.goalT[0])} s (now ${m.home.name} ${m.home.score}-${m.away.score} ${m.away.name})`); this.goalT = []; } }
      this.score0 = sc; }
    // THROUGH_KEEPER: between two live frames the ball's path crossed a keeper's body, heading for his goal, and nothing
    // touched it (no catch, no parry, no deflection: the ball's last team isn't his) and no guard break (that stuns him)
    if (this.bpos && this.wasLive && !this.inNet && !b.owner) {
      const px = this.bpos[0], py = this.bpos[1], sx = b.x - px, sy = b.y - py, L2 = sx * sx + sy * sy, v = Math.hypot(b.vx, b.vy);
      if (L2 > 1e-6 && v > 10) for (const t of [m.home, m.away]) {
        const k = t.players[0]; if (!k || !k.keeper || k.sentOff || k.hide || b.last === t || k.stun > 0 || k.cool > 0 || (t.ownGoalX - px) * sx <= 0) continue;
        const u = ((k.x - px) * sx + (k.y - py) * sy) / L2; if (!(u > 0 && u <= 1)) continue;        // (his spot is level with this frame's stretch)
        const d = Math.hypot(px + sx * u - k.x, py + sy * u - k.y), z = this.bz0 + (b.z - this.bz0) * u;
        if (d < 0.3 && z < 1.5) this.flag('THROUGH_KEEPER', `the ball (${Math.round(v * 3.6)} km/h, ${bwF2(z)} m up) went ${bwF2(d)} m from the middle of ${this.who(k)} - no touch, no guard break (${k.state}${b.special ? `, a LV${b.special} special` : ''})`, { p: k });
      }
    }
    if (b.inNet && !this.inNet && !(b.y > GOAL_Y0 - 0.35 && b.y < GOAL_Y1 + 0.35 && b.z < BAR_Z + 0.35))
      this.flag('GOAL_WRONG', `in the net at y ${bwF2(b.y)} (posts at ${bwF2(GOAL_Y0)} and ${bwF2(GOAL_Y1)}), ${bwF2(b.z)} m up (bar ${BAR_Z} m)`);
    this.inNet = !!b.inNet;
    // stoppages that never end (a set piece YOU take can wait for you)
    const spc = m.setPiece;
    if (this.hold('fs-sp', !!(spc && !spc.kicked && (m.demo || spc.team !== m.home)), dt, 25)) this.flag('FLOW_STUCK', `${spc.kind} for ${spc.team.name} not taken after 25 s`, { p: spc.taker });
    if (this.hold('fs-fr', m.freeze > 0 && !m.goalQ && !m.toss && !m.intro && !m.ht, dt, 15)) this.flag('FLOW_STUCK', `play frozen for 15 s (freeze timer ${bwF1(m.freeze)})`);
    if (this.hold('fs-dead', !!m.dead, dt, 5)) this.flag('FLOW_STUCK', `${m.dead.kind} called, never restarted (5 s)`);
    if (this.hold('fs-foul', !!m.foulScene, dt, 18)) this.flag('FLOW_STUCK', 'the foul scene ran for 18 s');
    if (this.hold('fs-kick', !!m.pending, dt, 3)) this.flag('FLOW_STUCK', `a kick by ${this.who(m.pending.p)} hung for 3 s`, { p: m.pending.p });
    if (this.hold('fs-hit', m.hitStop > 0, dt, 3)) this.flag('FLOW_STUCK', 'the hit-stop lasted 3 s');
    if (live) {
      const out = b.x < -0.5 || b.x > PITCH_L + 0.5 || b.y < -0.5 || b.y > PITCH_W + 0.5, o = b.owner;
      if (this.hold('out', out, dt, 1.2)) this.flag('OUT_LIVE', `ball at ${bwF1(b.x)}, ${bwF1(b.y)} for 1.2 s and play goes on${o ? ` (${this.who(o)} has it${o.hands ? ' in his hands' : ''})` : ''}`, { p: o });
      const over = (b.x < -0.11 || b.x > PITCH_L + 0.11) && b.y > GOAL_Y0 + 0.11 && b.y < GOAL_Y1 - 0.11 && b.z < BAR_Z - 0.11;
      if (this.hold('goal', over, dt, 0.25)) this.flag('GOAL_MISSED', `ball over the line at x ${bwF2(b.x)}, y ${bwF2(b.y)}, ${bwF2(b.z)} m up${o ? ` - ${this.who(o)} ${o.hands ? 'holding it' : 'on it'}` : ''}`, { p: o });
      if (o && !o.hands && !o.carrying) {
        const d = len(b.x - o.x, b.y - o.y);
        if (this.hold('far', d > 1.8, dt, 0.4)) this.flag('OWNER_FAR', `${this.who(o)} has the ball, but it is ${bwF1(d)} m from him (${o.state})`, { p: o });
        if (this.hold('frozen', o.speed < 0.3 && !o.keeper && (m.demo || o.team !== m.home), dt, 9)) this.flag('HOLDS_BALL', `${this.who(o)} stood on the ball for 9 s (${o.state})`, { p: o });
      } else { delete this.k.far; delete this.k.frozen; }
      if (o && o.hands && o.keeper) {
        const inBox = Math.abs(o.x - o.team.ownGoalX) < 17.1 && Math.abs(o.y - 34) < 20.8;
        if (this.hold('hands', !inBox, dt, 0.3)) this.flag('HANDS_OUT', `${this.who(o)} holds it at ${bwF1(o.x)}, ${bwF1(o.y)}, ${bwF1(Math.abs(o.x - o.team.ownGoalX))} m from his line`, { p: o });
        if (this.hold('khold', true, dt, 9)) this.flag('KEEPER_HOLD', `${this.who(o)} has held the ball for 9 s`, { p: o });
      } else { delete this.k.hands; delete this.k.khold; }
      if (this.hold('still', !o && len(b.vx, b.vy) < 0.08 && b.z < 0.05, dt, 6)) {
        const n = this.nearest(b); this.flag('STUCK_BALL', `ball still for 6 s at ${bwF1(b.x)}, ${bwF1(b.y)} · nearest: ${n ? `${this.who(n.p)}, ${bwF1(n.d)} m away (${n.p.state})` : 'nobody'}`, { p: n && n.p });
      }
      let swarm = 0;
      A.forEach((p, i) => {
        if (p.sentOff || p.hide) return;
        if (this.hold('off' + i, p.x < -2.8 || p.x > PITCH_L + 2.8 || p.y < -2.8 || p.y > PITCH_W + 2.8, dt, 3)) this.flag('OFF_WORLD', `${this.who(p)} at ${bwF1(p.x)}, ${bwF1(p.y)} (${p.state})`, { p });
        if (this.hold('st' + i, p.busy() && !BW_LONG.has(p.state), dt, 6)) this.flag('STUCK_STATE', `${this.who(p)} in '${p.state}' for 6 s (animation ${p.anim || 'none'})`, { p });
        const sp = p.spr, bad = !sp.visible || !sp.frame || sp.frame.name === '__BASE' || (sp.texture && sp.texture.key === '__MISSING');
        if (this.hold('spr' + i, bad, dt, 0.5)) this.flag('NO_SPRITE', `${this.who(p)} not drawn (visible ${sp.visible}, picture ${sp.texture && sp.texture.key}/${sp.frame && sp.frame.name}, state ${p.state})`, { p });
        if (!p.keeper && len(p.x - b.x, p.y - b.y) < 5) swarm++;
      });
      if (this.hold('swarm', swarm >= 9, dt, 5)) this.flag('SWARM', `${swarm} outfield players within 5 m of the ball for 5 s`);
      // QA 30 Oct: k.up = he's up for a last-minute corner on purpose (smarter-ai, PR #58: chasing late, a goal down, as
      // keepers do in real football), so that trip there and the sprint back aren't a keeper wandering off
      for (const t of [m.home, m.away]) { const k = t.players[0], far = k && !k.sentOff && !k.up ? Math.abs(k.x - t.ownGoalX) : 0;
        if (this.hold('kw' + t.side, far > 40, dt, 3)) this.flag('KEEPER_WANDER', `${this.who(k)} is ${bwF1(far)} m from his goal line (${k.state})`, { p: k }); }
      let stack = null;
      for (let i = 0; i < A.length && !stack; i++) { const p = A[i]; if (p.sentOff || p.hide) continue;
        for (let j = i + 1; j < A.length; j++) { const q = A[j]; if (!q.sentOff && !q.hide && Math.abs(p.x - q.x) < 0.35 && Math.abs(p.y - q.y) < 0.3) { stack = [p, q]; break; } } }
      if (this.hold('stack', !!stack, dt, 2)) this.flag('STACKED', `${this.who(stack[0])} and ${this.who(stack[1])} on the same spot for 2 s (${stack[0].state} / ${stack[1].state})`, { p: stack[0] });
      // t-021 CLOCK_FROZEN (the Lab pins its clock on purpose: only its BW1 case watches it there)
      if (this.hold('clock', !(window.__lab && !window.__labClock) && m.clock === this.clk0, dt, 4)) this.flag('CLOCK_FROZEN', `live play, but the clock has stood at ${Math.floor(m.clock / 60)}:${String(Math.floor(m.clock % 60)).padStart(2, '0')} for 4 s (half ${m.half})`);
      A.forEach((p, i) => {                                                   // t-021 IN_THE_NET: stood inside a goal
        const inGoal = !p.sentOff && !p.hide && (p.x < -0.3 || p.x > PITCH_L + 0.3) && p.y > GOAL_Y0 && p.y < GOAL_Y1;
        if (this.hold('net' + i, inGoal, dt, 1.5)) this.flag('IN_THE_NET', `${this.who(p)} has stood in the goal at ${bwF1(p.x)}, ${bwF1(p.y)} for 1.5 s of live play (${p.state})`, { p }); });
      for (const t of [m.home, m.away]) {                                     // t-021 TEAM_FROZEN (not your team in your match: you might stand still)
        if (!m.demo && t === m.home) continue;
        const O = t.players.filter(p => !p.keeper && !p.sentOff && !p.hide), still = O.length >= 3 && O.every(p => (p.speed || 0) < 0.1);
        if (this.hold('tf' + t.side, still, dt, 3)) this.flag('TEAM_FROZEN', `all ${O.length} of ${t.name}'s outfield players stood still for 3 s (${[...new Set(O.map(p => p.state))].join(' / ')})`, { p: O[0] });
      }
      { const h = m.human, ax = typeof Input !== 'undefined' ? Input.axis : null;   // t-021 CONTROL_DEAD (your matches only)
        const free = h && h.team && !m.demo && !h.sentOff && !h.hands && !h.busy() && !(h.stun > 0) && !m.aerial && !m.flagUI
          && h.x > -2.5 && h.x < PITCH_L + 2.5 && h.y > -2.5 && h.y < PITCH_W + 2.5;   // (pushing into the edge of the world isn't dead controls)
        if (free && ax && Math.hypot(ax.x, ax.y) > 0.5) {
          const c = this.cd;
          if (!c || c.p !== h) this.cd = { p: h, x: h.x, y: h.y, t: 0 };
          else if ((c.t += dt) >= 1) { const d = Math.hypot(h.x - c.x, h.y - c.y);
            if (d < 0.3) this.flag('CONTROL_DEAD', `you held the stick ${bwF1(ax.x)}, ${bwF1(ax.y)} for 1 s and ${this.who(h)} moved ${bwF2(d)} m (${h.state}, ${bwF1(h.speed || 0)} m/s)`, { p: h });
            this.cd = null; }
        } else this.cd = null; }
      A.forEach((p, i) => { if (p.sentOff || p === m.human) return; const F = this.faces[i] || (this.faces[i] = { f: p.face, ts: [] });
        if (p.face !== F.f) { F.f = p.face; F.ts.push(this.now); while (F.ts.length && this.now - F.ts[0] > 1) F.ts.shift();
          if (F.ts.length >= 8 && (p.speed || 0) < 3) { F.ts = []; this.flag('JITTER', `${this.who(p)} turned 8 times in a second (${p.state}, ${bwF1(p.speed || 0)} m/s)`, { p }); } }
        const an = p.anim || '';                                                  // a BLIP: an animation on screen for under 0.1 s
        // (QA 25 Oct: '' is not an animation. setState() and a rig / replay clear p.anim to '' so the next draw() replays the
        // move; the sprite still shows the old picture until then. Counting '' as one made a false blip at every state change
        // - "run-W → " in the clips - so the code waits for the next real animation instead.)
        if (an && an !== F.a) { if (F.a && this.now - (F.at || 0) < 0.1) { (F.bl = F.bl || []).push(this.now); while (F.bl.length && this.now - F.bl[0] > 1) F.bl.shift();
            if (F.bl.length >= 3) { F.bl = []; this.flag('ANIM_FLICKER', `${this.who(p)}: 3 animations flashed up for under 0.1 s within a second (${(F.a.split(':')[1] || F.a)} → ${(an.split(':')[1] || an)}, ${bwF1(p.speed || 0)} m/s)`, { p }); } }
          F.a = an; F.at = this.now; } });
      const nb = !o && b.z < 0.3 && len(b.vx, b.vy) < 0.6 ? this.nearest(b) : null;
      if (this.hold('bop', !!(nb && nb.d < 0.45 && !nb.p.busy() && !(nb.p.stun > 0) && !(nb.p.cool > 0)), dt, 1.5)) this.flag('BALL_ON_PLAYER', `the ball sat ${bwF2(nb.d)} m from ${this.who(nb.p)} for 1.5 s and he never took it (${nb.p.state})`, { p: nb.p });
      if (this.pos && this.wasLive) {                       // only between two live frames: restarts place players on purpose
        A.forEach((p, i) => { const q = this.pos[i], ok = p.bwJumpOk; p.bwJumpOk = false; if (!q || p.sentOff || p.hide || ok) return; const d = len(p.x - q[0], p.y - q[1]);   // (gk-cover: a keeper put on his line on purpose)
          if (d > Math.max(2, 25 * dt)) this.flag('TELEPORT', `${this.who(p)} moved ${bwF1(d)} m in one frame (${bwF1(q[0])}, ${bwF1(q[1])} → ${bwF1(p.x)}, ${bwF1(p.y)}, ${p.state})`, { p }); });
        const bd = this.bpos ? len(b.x - this.bpos[0], b.y - this.bpos[1]) : 0;
        if (bd > Math.max(3.5, 60 * dt)) this.flag('TELEPORT', `the ball moved ${bwF1(bd)} m in one frame (${bwF1(this.bpos[0])}, ${bwF1(this.bpos[1])} → ${bwF1(b.x)}, ${bwF1(b.y)})`, { p: b.owner });
      }
    } else for (const key of Object.keys(this.k)) if (!key.startsWith('fs-') && !/^(st|off|spr)\d/.test(key)) delete this.k[key];   // (a man stuck in a move stays stuck through a throw-in)
    this.pos = A.map(p => [p.x, p.y]); this.bpos = [b.x, b.y]; this.bz0 = b.z; this.clk0 = m.clock; this.wasLive = live;
  }
  frame(ms) {                                              // long frames on YOUR screen (not in the test browsers)
    if (!this.watching() || navigator.webdriver || window.HC2_TEST_FAST || document.hidden || !this.live() || ms < 120) return;
    const t = this.m.time.now; this.hitch = this.hitch.filter(x => t - x < 10000); this.hitch.push(t);
    if (this.hitch.length >= 4) { this.flag('STUTTER', `${this.hitch.length} long frames in 10 s (the last one ${Math.round(ms)} ms)`); this.hitch = []; }
  }
  // every error gets a clip with its stack, now (the loop may be dead after it: nothing comes after). t-021: the same
  // message again in this match is only counted - one error thrown every frame used to fill all 30 clips with copies.
  crash(msg, stack, code = 'CRASH') {
    try { if (!this.m.home) return; const key = code + ' ' + msg;
      if (this.errs[key]) { this.stats[code] = (this.stats[code] || 0) + 1; return; }
      this.errs[key] = 1; delete this.seen[code]; this.flag(code, msg, { stack, now: true }); } catch (e) {}
  }
  traceTick(dt, live) {                                    // 10 numbers a tenth of a second, the last 6 s
    this.traceT += dt; if (this.traceT < 0.1) return; this.traceT = 0;
    const m = this.m, b = m.ball, r1 = v => Math.round(v * 10) / 10;
    this.trace.push([Math.round(m.clock), r1(b.x), r1(b.y), r1(b.z), r1(b.vx), r1(b.vy), b.owner ? m.all.indexOf(b.owner) : -1,
      (live ? 1 : 0) | (m.setPiece ? 2 : 0) | (m.freeze > 0 ? 4 : 0) | (m.dead ? 8 : 0) | (m.foulScene ? 16 : 0) | (m.pending ? 32 : 0) | (b.inNet ? 64 : 0)]);
    if (this.trace.length > 60) this.trace.shift();
  }
  snapshot() {
    const m = this.m, b = m.ball, r1 = v => Math.round(v * 10) / 10, sp = m.setPiece;
    return { ball: [r1(b.x), r1(b.y), r1(b.z), r1(b.vx), r1(b.vy), r1(b.vz)], owner: b.owner ? m.all.indexOf(b.owner) : -1, last: b.last ? b.last.name : '',
      flow: { setPiece: sp ? `${sp.kind}${sp.kicked ? ' kicked' : ''}` : '', freeze: r1(m.freeze || 0), dead: m.dead ? m.dead.kind : '', foul: !!m.foulScene, pending: !!m.pending, half: m.half, clock: Math.round(m.clock) },
      players: m.all.map((p, i) => [i, p.team.name, p.num, r1(p.x), r1(p.y), p.state, r1(p.speed || 0), p.face, p.sentOff ? 1 : 0, p.hands ? 1 : 0]) };
  }
  flag(code, msg, o = {}) {
    const m = this.m, now = m.time ? m.time.now : Date.now();
    this.stats[code] = (this.stats[code] || 0) + 1;                              // (every trip counts, clip or not: how often it happens)
    if (BW_CHECKS[code].sev === 'look') return;                                 // t-021: cosmetic - counted only (no clip, no doc, no badge)
    if (this.seen[code] != null && now - this.seen[code] < BW_GAP) return;
    this.seen[code] = now;
    if (this.list.filter(x => !x.old).length >= BW_MAX) return;
    if (BW_CHECKS[code].sev !== 'bug' && BW_CHECKS[code].sev !== 'mark' && (this.perCode[code] = (this.perCode[code] || 0) + 1) > 2) return;   // (2 clips a match of each 'looks odd' kind is plenty)
    const C = BW_CHECKS[code], p = o.p || null, b = m.ball;
    const inc = { id: `bw-${Date.now().toString(36)}-${bwTag()}`, code, title: C.t, sev: C.sev, why: C.why, msg,
      game: GAME_VER, at: new Date().toISOString(), mode: window.HC2_SOAK ? 'soak' : window.__labWatch ? 'lab' : m.watch ? 'watch' : m.demo ? 'demo' : 'match',
      home: m.home.name, away: m.away.name, score: `${m.home.score}-${m.away.score}`, half: m.half, min: Math.min(m.half > 2 ? 120 : 90, Math.floor(m.clock / 60) + 1),
      who: p ? m.all.indexOf(p) : -1, whoName: this.who(p), where: p ? [+p.x.toFixed(1), +p.y.toFixed(1)] : [+bwF1(b.x), +bwF1(b.y)],
      weather: (m.mset && m.mset.weather) || 'clear', state: this.snapshot(), trace: this.trace.slice(), stack: String(o.stack || '').slice(0, 1500),
      kits: m.all.map(q => q.kit), frames: (m.rec || []).slice(-BW_PRE).map(f => Object.assign({}, f)), mark: 0, review: null, isNew: true };
    inc.mark = Math.max(0, inc.frames.length - 1);
    if (this.cap) this.finish();
    this.cap = { inc, left: BW_POST };
    this.list.push(inc);
    if (m.bwBadge) m.bwBadge(inc);
    CRUMB('bug watch: ' + code);
    if (!inc.frames.length || o.now) this.finish();
  }
  onRecord(f) { const c = this.cap; if (!c || !f) return; c.inc.frames.push(Object.assign({}, f)); if (--c.left <= 0) this.finish(); }
  finish() {
    const c = this.cap; this.cap = null; if (!c) return;
    c.inc.ready = true; this.store(c.inc);
    if (window.__bwHook) { try { window.__bwHook(c.inc); } catch (e) {} }
  }
  doc(inc) {
    const { frames, isNew, ready, old, saved, packed, ...meta } = inc, js = v => (typeof v === 'string' ? v : JSON.stringify(v || null));
    const d = Object.assign({}, meta, { state: js(meta.state), trace: js(meta.trace), clip: packed || '' });
    if (frames && frames.length) {
      let fr = frames, mk = inc.mark; d.clip = bwPack(fr, mk);
      while (d.clip.length > 230000 && fr.length > 60) { const cut = Math.round(fr.length * 0.2); fr = fr.slice(cut); mk = Math.max(0, mk - cut); d.clip = bwPack(fr, mk); }
    }
    return d;
  }
  loadOld() {                                              // clips from earlier visits that nobody marked yet (t-021: not the old flicker ones)
    try { const L = JSON.parse(localStorage.getItem('hc2-bw-clips') || '[]');
      for (const d of L) if (d && d.id && !d.review && !bwLook(d)) this.list.push(Object.assign({}, d, { old: true, isNew: false, frames: null, packed: d.clip, state: d.state, trace: d.trace })); } catch (e) {}
  }
  framesOf(inc) {                                          // footage of a clip (unpacked on demand for the stored ones)
    if (inc.frames && inc.frames.length) return { frames: inc.frames, mark: inc.mark };
    const s = inc.packed || inc.clip; if (!s) return null;
    try { const u = bwUnpack(s); inc.frames = u.frames; inc.mark = u.mark; return u; } catch (e) { return null; }
  }
  async store(inc) {
    if (window.__bwNoStore) { inc.saved = 'test'; return inc.saved; }         // t-021: the Lab's BW cases trip checks on purpose - keep them out of the clips
    const d = this.doc(inc);
    try {
      const L = JSON.parse(localStorage.getItem('hc2-bw-clips') || '[]').filter(x => x && x.id !== inc.id);
      L.push(d); while (L.length > BW_KEEP) L.shift();
      let s = JSON.stringify(L); while (s.length > 2.4e6 && L.length > 1) { L.shift(); s = JSON.stringify(L); }
      localStorage.setItem('hc2-bw-clips', s);
    } catch (e) {}
    const yours = inc.kind === 'flag';                                         // (t-006: a flag you sent always goes)
    if (!yours && (inc.mode === 'soak' || (this.sent >= 40 && !inc.review))) return;     // (Claude's overnight runs collect their own)
    if (!yours && inc.mode === 'demo' && inc.sev !== 'bug' && !inc.review) return;      // (the demo behind the menu only sends real bugs)
    const db = await this.m.bwDb(); if (!db) { inc.saved = inc.saved || 'local'; return inc.saved; }
    try { await db.collection('bugwatch').doc(inc.id).set(d); inc.saved = 'db'; if (!inc.review && !yours) this.sent++; }
    catch (e) { inc.saved = 'local'; }
    if (this.m.bwUI) this.m.bwDraw();
    return inc.saved;
  }
  // t-006 INSTA FLAG: your clip - the last 8 s as they are now (play is stopped, so nothing comes after), your note and
  // the match's settings, so whoever fixes it can set the same match up. Not rate-limited and not switched off with
  // Bug Watch: you asked for it.
  flagClip(note) {
    const m = this.m, b = m.ball, C = BW_CHECKS.FLAG, rec = m.rec || [], R = m.mset || {};
    const pick = (opts, v) => { const o = (opts || []).find(q => q[0] === v); return o ? o[1] : v; };
    const ctx = { diff: typeof DIFF_LEVEL !== 'undefined' ? DIFF_LEVEL : '', ai: typeof AI_MODE !== 'undefined' ? AI_MODE : '',
      pace: typeof PACE_MODE !== 'undefined' ? PACE_MODE : '', cam: typeof CAM_VIEW !== 'undefined' ? CAM_VIEW : '',
      clock: m.clockTxt ? m.clockTxt.text : '', arena: R.arena || '', tod: R.tod || '', ending: R.ending || '',
      cup: !!(m.cup && m.cupLive), keys: window.HC2_KEYS || 'arrows', ua: String(navigator.userAgent || '').slice(0, 160) };
    // a repro line only when the match was seeded (the soak / test tools set window.__repro): a normal match has no seed
    const repro = typeof window.__repro === 'string' ? window.__repro : '';
    const text = String(note || '').trim().slice(0, 500);
    const inc = { id: `flag-${Date.now().toString(36)}-${bwTag()}`, code: 'FLAG', kind: 'flag', title: C.t, sev: C.sev, why: C.why,
      msg: text || '(no note)', note: text, game: GAME_VER, at: new Date().toISOString(), mode: m.watch ? 'watch' : m.demo ? 'demo' : 'match',
      home: m.home.name, away: m.away.name, score: `${m.home.score}-${m.away.score}`, half: m.half, min: Math.min(m.half > 2 ? 120 : 90, Math.floor(m.clock / 60) + 1),
      who: -1, whoName: '', where: [+bwF1(b.x), +bwF1(b.y)], weather: R.weather || 'clear', ctx: JSON.stringify(ctx), repro,
      line: `${GAME_VER} | ${m.home.name} ${m.home.score}-${m.away.score} ${m.away.name} | ${ctx.clock} | ${pick(typeof DIFF_OPTS !== 'undefined' && DIFF_OPTS, ctx.diff)} | ${ctx.ai} AI | pace ${ctx.pace} | camera ${ctx.cam}`,
      state: this.snapshot(), trace: this.trace.slice(), stack: '',
      kits: m.all.map(q => q.kit), frames: (rec.length < FLAG_SECS * 60 && m.recPrev ? m.recPrev.concat(rec) : rec).slice(-FLAG_SECS * 60).map(f => Object.assign({}, f)), mark: 0, review: null, isNew: true, ready: true };
    inc.mark = Math.max(0, inc.frames.length - 1);
    if (this.cap) this.finish();                                                // (a Bug Watch clip still filling ends here)
    this.list.push(inc);
    CRUMB('insta flag');
    if (window.__bwHook) { try { window.__bwHook(inc); } catch (e) {} }
    return { inc, saved: this.store(inc) };
  }
  review(inc, verdict, note) { inc.review = { verdict, note: note || '', at: new Date().toISOString() }; inc.isNew = false; this.store(inc); }
}
addEventListener('error', e => { const m = window.__hc2; if (m && m.bw) { const msg = `${e.message} (${String(e.filename || '').split('/').pop()}:${e.lineno})`; m.bw.lastErr = msg; m.bw.crash(msg, e.error && e.error.stack); } });
// t-021 (Luca 25 Oct: "when game code breaks and clear errors occurs"): the errors that never reached Bug Watch.
// A promise that fails with nobody catching it (index.html / test.html only showed it on screen) is a CRASH too.
addEventListener('unhandledrejection', e => { const m = window.__hc2, r = e.reason;
  if (m && m.bw) { const msg = `promise failed: ${(r && r.message) || String(r)}`; m.bw.lastErr = msg; m.bw.crash(msg, r && r.stack); } });
// console.error (ours or Phaser's: a file that failed to load, a WebGL error...) - passed on as before, and kept as a
// clip at most once every 5 s (the same message again in a match is only counted). The guard stops a loop if keeping
// the clip itself logged an error.
(() => {
  const real = console.error.bind(console); let last = 0, inside = false;
  console.error = (...a) => {
    real(...a);
    const m = window.__hc2; if (inside || !m || !m.bw || !m.home) return;
    const now = Date.now(); if (now - last < 5000) { m.bw.stats.CONSOLE_ERR = (m.bw.stats.CONSOLE_ERR || 0) + 1; return; }
    last = now; inside = true;
    try { const er = a.find(x => x instanceof Error), msg = a.map(x => (x instanceof Error ? x.message : typeof x === 'string' ? x : (() => { try { return JSON.stringify(x); } catch (e) { return String(x); } })())).join(' ').slice(0, 300);
      m.bw.crash(msg || '(empty console.error)', (er && er.stack) || String(new Error().stack || '').split('\n').slice(2).join('\n'), 'CONSOLE_ERR'); } finally { inside = false; }
  };
})();
// The WATCHDOG: a game that froze without throwing (or whose loop died after an error: Phaser asks for the next frame
// only after the last one ran cleanly). Once a second: page visible, the loop meant to be running, Bug Watch watching -
// and Phaser's frame count hasn't moved for 3 s → FROZE, with the footage up to the freeze. Real browsers only: the test
// tools step time by hand (window.__bwDog lets tools/bwtest.js check it). A match clock that stops while frames run is
// CLOCK_FROZEN, in the checks above.
// t-035 (QA 29 Oct: 12 GAME FROZE clips from Luca's browser, no error, no headless repro): the clip now says what tells
// a real hang from the browser pausing the page - how long the gap really was (closed when frames come back, or the
// page hides), whether the window had focus and was visible at its start and its end (and lost either in between),
// and what the match was doing. No focus or hidden for the gap: the browser paused it - the clip stays, tagged 'odd'.
// When it fires is unchanged.
function bwPhase(m) {                                      // what the match was doing (the clip's "why" line)
  const b = m.ball;
  return m.over ? 'full time' : m.cutIn ? 'a cut scene (special save)' : m.replay ? 'a replay' : m.foulScene ? 'a cut scene (foul)'
    : m.intro ? 'the walk-out' : m.ht ? 'half time' : m.toss ? 'the coin toss' : m.pre ? 'the team sheet' : m.paused ? 'the pause menu'
    : m.freeze > 0 && b && Math.abs(b.x - 52.5) < 0.8 && Math.abs(b.y - 34) < 0.8 ? 'kick-off' : m.freeze > 0 || m.dead ? 'a stoppage'
    : m.setPiece ? `a set piece (${m.setPiece.kind})` : m.bw && m.bw.live() ? 'live play' : 'a stoppage';
}
function bwFrozeNote(D, end) {                             // the facts, and the "why" line built from them
  const F = D.info, fv = (f, v) => `${f ? 'focused' : 'NO FOCUS'}, ${v ? 'visible' : 'HIDDEN'}`;
  F.gap = +((D.tEnd - D.t) / 1000).toFixed(1); F.ended = !!end;
  const paused = !F.foc0 || !F.vis0 || F.lost || (end && (!F.foc1 || !F.vis1));
  return { paused, why: `no frame for ${F.gap} s${end ? '' : ' so far (still frozen)'} · window at the start: ${fv(F.foc0, F.vis0)}`
    + (end ? ` · at the end: ${fv(F.foc1, F.vis1)}` : '') + (F.lost ? ' · lost focus / hidden during it' : '') + ` · during ${F.phase}`
    + (paused ? ' → the browser paused the page (not a bug)' : ' → the window had focus and was visible: a real hang') };
}
function bwFrozeTag(D, end) {                              // (written into the clip already saved, and saved again)
  const inc = D.inc, m = window.__hc2; if (!inc || !m || !m.bw) return;
  const N = bwFrozeNote(D, end); inc.froze = Object.assign({}, D.info); inc.why = N.why; inc.sev = N.paused ? 'odd' : 'bug';
  try { m.bw.store(inc); } catch (e) {}
  if (end) D.inc = null;
}
(() => {                                                   // focus lost / page hidden at any moment of a gap (between the 1 s looks)
  const lost = () => { const D = window.__bwDogS; if (D) D.lost = true; };
  window.addEventListener('blur', lost); document.addEventListener('visibilitychange', () => { if (document.visibilityState !== 'visible') lost(); });
})();
setInterval(() => {
  const D = window.__bwDogS = window.__bwDogS || { f: -1, n: 0, fired: false }, m = window.__hc2, L = m && m.game && m.game.loop;
  const tools = navigator.webdriver || window.HC2_TEST_FAST || window.__lab;
  const now = (window.__bwDogNow || Date.now)(), foc = document.hasFocus(), vis = document.visibilityState === 'visible';   // (__bwDogNow: a test's own clock)
  const close = () => { if (D.inc) { Object.assign(D.info, { foc1: foc, vis1: vis, lost: D.info.lost || !!D.lost }); D.tEnd = now; bwFrozeTag(D, true); } };   // the gap is over: its real length
  if (!L || !m.bw || (tools && !window.__bwDog) || document.visibilityState !== 'visible' || !L.running || !m.bw.watching()) { close(); D.f = -1; D.n = 0; return; }
  if (L.frame !== D.f) { close(); D.f = L.frame; D.n = 0; D.fired = false; D.t = now; D.lost = false; D.info = { foc0: foc, vis0: vis }; return; }
  if (++D.n >= 3 && !D.fired) { D.fired = true; const n0 = m.bw.list.length;
    D.info = Object.assign(D.info || { foc0: foc, vis0: vis }, { phase: bwPhase(m), lost: !!D.lost, foc1: foc, vis1: vis }); D.tEnd = now;
    m.bw.crash(`no frame drawn for 3 s with the page open${m.bw.lastErr ? ` - the last error: ${m.bw.lastErr}` : ' - no error thrown'}`, '', 'FROZE');
    const inc = m.bw.list.length > n0 ? m.bw.list[m.bw.list.length - 1] : null; D.inc = inc && inc.code === 'FROZE' ? inc : null;
    bwFrozeTag(D, false); }
  else if (D.fired && D.inc) D.info.lost = D.info.lost || !!D.lost;
}, 1000);

// ---------------------------------------------------------------- Match methods: replay
hc2Mix(Match, {

  // ---------- INSTANT REPLAY: every rendered frame is recorded (where each sprite is and which frame it shows), so a
  // replay costs no extra art. After a goal the last few seconds play back: slow motion + a TV zoom on the finish,
  // letterbox bars, a blinking REPLAY banner and a caption. Big saves and shots off the woodwork are replayed at the
  // next stoppage (ball out, keeper holding it). Any key skips. Pause menu: L / C = last goal, J / Z = HIGHLIGHTS
  // (every goal of the match in a row); full time offers the highlights too.
  record(dt) {
    if (this.replay || !(window.HC2_STARTED || this.demo) || (window.__lab && !window.__labWatch && !window.__labCut)) return;   // (v0.8.7: the Lab records when it watches / shows a cut scene)
    this.recAcc = (this.recAcc || 0) + dt; this.recSince = (this.recSince || 0) + dt;   // v0.8.2: a steady 60 frames a second on any screen
    if (this.recAcc < 0.75 / 60) return;                                         // (every replay limit is counted in recorded frames)
    this.recAcc = Math.min(this.recAcc - 1 / 60, 1 / 60); dt = this.recSince; this.recSince = 0;
    const b = this.ballSpr, sh = this.ballSh, cam = this.cameras.main, cf = cam.flashEffect, cs = cam.shakeEffect;
    this.recN = (this.recN || 0) + 1;
    (this.rec = this.rec || []).push({ dt, cam: [Math.round(this.camX), Math.round(this.camY)],
      b: [b.x, b.y, b.frame.name, b.visible, b.depth, b.scaleX, b.isTinted && b.tintFill ? 1 : 0], s: [sh.x, sh.y, sh.alpha, sh.depth, sh.scaleX],   // (t-006: + the hit's white flash)
      p: this.all.map(q => { const r = q.spr; return [r.x, r.y, r.frame.name, r.visible, r.depth, r.originX, r.originY, r.flipX, r.rotation, r.scaleX, r.scaleY]; }),   // (v0.8.9: + turn / squash for the rough rigs)
      r: this.ref ? (r => [r.x, r.y, r.frame.name, r.visible, r.depth, r.flipX])(this.ref.spr) : null,
      x: this.recFx(),                                                            // t-006: every effect on the pitch this frame
      nt: this.recNet(),                                                          // t-025: the net moving / torn (null while it hangs still)
      fl: cf && cf.isRunning && cf.alpha > 0.01 ? [cf.red, cf.green, cf.blue, cf.alpha] : null,   // the camera's flash + shake (a special, a guard break, a power shot)
      sh: cs && cs.isRunning ? cs.intensity.x : 0 });
    if (this.rec.length > REC_MAX) this.rec.shift();
    this.recAllPush(this.rec[this.rec.length - 1]);                              // Luca 31 Oct: the whole match too (REPLAY: WHOLE MATCH)
    if (this.bw) this.bw.onRecord(this.rec[this.rec.length - 1]);                 // v0.8.7 BUG WATCH: the clip after the moment
  },
  // WHOLE-MATCH REPLAY (Luca, 31 Oct: "make the replay be able to go back full game but also last 10 second in real
  // life"). The 60-a-second recorder above keeps only ~11 s; this keeps the whole match from kick-off at 30 a second
  // (every 2nd frame, its dt summed), so the replay player can scrub back to any moment - the way FIFA / EA FC's
  // full-match replay and PES's "replay the match" let you. Real time, as played: stoppages, celebrations and cut
  // scenes are in it, the replays themselves aren't (nothing is recorded while one plays). A goal's frame carries its
  // caption (g) and each frame its match minute (mn), for the player's goal ticks and its clock. It shares the frame's
  // arrays (no copies: ~half the memory of a second buffer). Cap: REC_ALL_MAX frames (40 real minutes - extra time and
  // penalties fit); past it the oldest go in blocks. Cleared at kick-off of a new match (match.js) and the demo's restart.
  // Reads only what was drawn: no dice, so play can't change.
  recAllPush(f) {
    if (!f) return; const A = this.recAll || (this.recAll = []);
    this.recAllAcc = (this.recAllAcc || 0) + f.dt;
    if (this.recAllAcc < 1 / 30 - 1e-4 && A.length) return;
    const o = Object.assign({}, f); o.dt = this.recAllAcc; this.recAllAcc = 0; delete o.goal; delete o.t0;
    o.mn = Math.min(HALF_END[(this.half || 1) - 1] || 120, Math.floor((this.clock || 0) / 60) + 1);
    const ga = this.goalAt || 0;
    if (ga && ga !== this.recAllGoal && (this.recN || 0) >= ga) {               // the goal went in on this frame (or the one before)
      this.recAllGoal = ga; const sc = this.lastScorer;
      o.g = sc ? `${sc.team.name} ${this.home.score}-${this.away.score} · ${sc.min}'` : 'GOAL';
    }
    A.push(o);
    if (A.length > REC_ALL_MAX + 1800) A.splice(0, 1800);                         // (in blocks: shift() on 70k frames each frame is slow)
  },
  recAllReset() { this.recAll = []; this.recAllAcc = 0; this.recAllGoal = this.goalAt || 0; },   // (the last match's goal isn't marked again)
  recIndex(n) { return n - ((this.recN || 0) - (this.rec || []).length); },       // recorder frame number -> index in rec
  // t-006 EVERY EFFECT IN REPLAYS (Luca: "make sure in replays ... generates the full animations of the shots effects and
  // all"): a replay used to put back only the players, the ball, its shadow and the referee, so a special shot replayed as a
  // plain kick. Now each recorded frame also lists every effect sprite on the pitch, as it is drawn: the PixelLab effects
  // (flames, impacts, sparks, bolts, dust, the keeper's save aura - texture 'fx'), the after-images of the rough rigs and
  // the ball's trail (pictures tinted solid in a colour). Taking them off the screen, not from each effect's code, means a
  // new effect shows up in replays by itself. Reads the display list only: no dice, so play can't change.
  isFxSprite(o) {
    return o.type === 'Image' && o.visible && o.alpha > 0.02 && o.scrollFactorX === 1 && !o.__rp && o !== this.ballSpr && o !== this.ballSh
      && o.texture && (o.texture.key === 'fx' || (o.isTinted && o.tintFill));
  },
  recFx() {
    const out = [], L = this.children.list;
    for (let i = 0; i < L.length; i++) { const o = L[i]; if (!this.isFxSprite(o)) continue;
      out.push([o.texture.key, o.frame.name, o.x, o.y, o.depth, o.scaleX, o.scaleY, o.rotation, o.alpha, o.flipX, o.originX, o.originY, o.tintTopLeft, o.isTinted && o.tintFill]); }
    return out.length ? out : null;
  },
  // t-025 (Luca's living net in every replay - "the impact of the goal is felt"): the net is recorded with each frame -
  // every bulge on it (where it was hit, how deep it is, how old its ripple is) and an LV3's hole - and redrawn from
  // that in the replay, the same way the sprites are. Recording it beats re-running the net from the ball: the replay
  // shows exactly what was played, a pause-menu replay can't disturb the live net, and a stored Bug Watch / INSTA FLAG
  // clip carries it too (bwPack 'n'). Nine numbers a bulge, only on the frames the net moves.
  recNet() {
    const S = this.netS, T = this.netRip; if (!S || (!S.L.length && !S.R.length && !T)) return null;
    const o = [], R = v => Math.round(v * 1000) / 1000;
    for (const [k, L] of [[0, S.L], [1, S.R]]) for (const q of L) o.push(k, R(q.hx), R(q.hy), R(q.hz), R(q.d), R(q.sx), R(q.sy), R(q.age), R(q.peak));
    if (T) o.push(T.side === 'L' ? 2 : 3, R(T.hx), R(T.hy), R(T.hz), R(T.d), R(T.sx), R(T.sy), R((this.gpT || 0) - T.t), 0);   // (kind 2 / 3: the hole, with its age)
    return o;
  },
  netReplay(nt) {                                                                  // a recorded frame's net, drawn by world.js netDraw (the live one is put back)
    if (!this.nets || !netOn()) return;
    const live = this.netS, liveRip = this.netRip, S = { L: [], R: [] }; let T = null;
    for (let i = 0; nt && i + 8 < nt.length; i += 9) {
      const q = { hx: nt[i + 1], hy: nt[i + 2], hz: nt[i + 3], d: nt[i + 4], sx: nt[i + 5], sy: nt[i + 6], age: nt[i + 7], peak: nt[i + 8] };
      if (nt[i] < 2) S[nt[i] ? 'R' : 'L'].push(q); else T = Object.assign(q, { side: nt[i] === 2 ? 'L' : 'R', t: (this.gpT || 0) - q.age });
    }
    this.netS = S; this.netRip = T;
    try { this.netDraw(); } finally { this.netS = live || { L: [], R: [] }; this.netRip = liveRip; }   // (never null after: netDraw has to put the plain art back once the replay ends)
  },
  drawFx(f) {                                                                      // a recorded frame's effects, from a pool of images (returns how many)
    const P = this.rpFx || (this.rpFx = []), X = (f && f.x) || [];
    let k = 0;
    for (const q of X) {
      if (!this.textures.exists(q[0])) continue;                                   // (a stored clip's after-image of a kit this page hasn't loaded)
      let im = P[k]; if (!im || !im.scene) { im = P[k] = this.add.image(0, 0, q[0], q[1]); im.__rp = true; }
      k++;
      if (im.texture.key !== q[0]) im.setTexture(q[0], q[1]); else if (im.frame.name !== q[1]) im.setFrame(q[1]);
      im.setVisible(true).setPosition(q[2], q[3]).setDepth(q[4]).setScale(q[5], q[6]).setRotation(q[7]).setAlpha(q[8]).setFlipX(!!q[9]).setOrigin(q[10], q[11]);
      if (q[13]) im.setTintFill(q[12]); else if (q[12] != null && q[12] !== 0xffffff) im.setTint(q[12]); else im.clearTint();
    }
    const drawn = k;
    for (; k < P.length; k++) if (P[k] && P[k].scene) P[k].setVisible(false);
    return drawn;
  },
  hideLiveFx() {                                                                   // a replay starts: the live trail / flames / pops step aside
    for (const o of this.children.list) if (this.isFxSprite(o)) o.setVisible(false);
  },
  flagReplay(label, gk) {
    if (window.__lab || !(window.HC2_STARTED || this.demo) || this.replay || this.foulScene) return;
    if ((this.recN || 0) - (this.lastReplayEnd ?? -1e9) < 60 * 40) return;      // v0.8.1: at most one of these every ~40 s, never back to back
    this.evReplay = { label, n: this.recN || 0, gk };
  },
  eventReplayTick() {                                                              // a big save / post: show it at the next stoppage
    const e = this.evReplay; if (!e || this.replay || this.over || this.paused) return;
    const age = (this.recN || 0) - e.n, b = this.ball;
    if (b.inNet || age > 400) { this.evReplay = null; return; }
    if (age < 45 || !(this.setPiece || this.dead || (b.owner && b.owner.hands))) return;
    this.evReplay = null;
    const rec = this.rec || [], i = this.recIndex(e.n); if (i < 0 || i >= rec.length) return;
    const a = Math.max(0, i - 170), frames = rec.slice(a); frames[i - a].goal = true;
    if (!paceK().evReplays) { (this.highlights = this.highlights || []).push({ frames, cap: e.label }); return; }   // t-004 ARCADE: a big save / near miss waits for HIGHLIGHTS
    const gk = e.gk, roar = () => { if (gk && !gk.hands && !gk.busy() && MAN.kits[gk.kit].anims['kroar-S']) { gk.setState('roar', 1.3); gk.face = 6; gk.vx = gk.vy = 0; } };
    this.startReplay(e.label, roar, frames, { caption: e.label });
  },
  goalQTick() {                                                                   // v0.8.2: a goal replay waiting for the pause / another replay to end
    const q = this.goalQ; if (!q || this.replay || this.paused) return;
    this.goalQ = null; if (q.ep !== this.epoch) return;
    const P = paceK(); this.startReplay('GOAL', q.after, q.frames, { slowPre: P.goalSlowPre, slow: P.goalSlow });   // (t-004: ARCADE a short slow-mo)
  },
  startReplay(label, after, frames, o = {}) {
    const rec = this.rec || [];
    if (!frames) { frames = rec.slice(-330); const gi = this.recIndex(this.goalAt || 0) - (rec.length - frames.length); if (frames[gi]) frames[gi].goal = true; }
    if (frames.length < 30) { after && after(); return; }
    if (this.bw && this.bw.cap && label !== 'BUG CLIP') this.bw.finish();          // v0.8.7: a clip being recorded ends here
    let t = 0, tg = null; for (const f of frames) { f.t0 = t; if (f.goal) tg = t; t += f.dt; }
    let slowA = (tg !== null ? tg + 0.3 : t - 1.2) - (o.slowPre ?? 1.7);              // slow-mo: the last 1.7 s before the ball crosses the line
    if (o.ctl) slowA = 1e9;                                                         // (t-006: in the player you pick the speed - no slow-mo / zoom of its own)
    this.msg.setText(''); this.sub.setText('');
    this.replay = { frames, i: 0, t: 0, real: 0, after, slowA, slowB: slowA + (o.slow ?? 2.0), label, z: this.baseZoom(), exit: o.exit, noZoom: !!o.noZoom, focus: o.focus ?? -1, mark: o.mark ?? -1, kits: o.kits || null,
      total: t, fxMax: 0, ctl: o.ctl ? { play: true, sp: 0, q: [], hold: 0, end: false } : null,
      full: !!o.full, goals: o.full ? frames.filter(f => f.g).map(f => ({ t0: f.t0, g: f.g })) : null };   // (Luca 31 Oct: the whole match, its goals ticked on the bar)
    if (o.at != null) this.replay.t = clamp(o.at, 0, t);                            // (start part-way in: LAST 10 S of the whole match)
    this.hideLiveFx();                                                             // t-006: the replay draws its own effects
    if (o.kits) this.all.forEach((q, k) => { const kk = o.kits[k]; if (kk && q.spr.texture.key !== kk && this.textures.exists(kk)) q.spr.setTexture(kk); });   // v0.8.7: a BUG WATCH clip from another match
    if (label === 'GOAL') {
      this.lastReplay = frames;
      const sc = this.lastScorer;
      const cap = sc ? `GOAL · ${sc.team.name} ${this.home.score}-${this.away.score} · ${sc.min}'` : 'GOAL';
      (this.highlights = this.highlights || []).push({ frames, cap });
      o.caption = o.caption || cap;
    }
    if (!this.letterbox || !this.letterbox.scene) {                              // (rebuilt if a scene restart destroyed it)
      const F = '"Press Start 2P"';
      this.letterbox = this.add.graphics().setScrollFactor(0).setDepth(9.5e6);
      this.replayTxt = this.add.text(VIEW_W - 24, 16, '', { fontFamily: F, fontSize: '14px', color: '#ff2878', stroke: '#0c0a0e', strokeThickness: 5 }).setOrigin(1, 0).setScrollFactor(0).setDepth(9.6e6);
      this.replayCap = this.add.text(VIEW_W / 2, VIEW_H - 23, '', { fontFamily: F, fontSize: '12px', color: '#ffde1e', stroke: '#0c0a0e', strokeThickness: 4 }).setOrigin(0.5).setScrollFactor(0).setDepth(9.6e6);
    }
    const lb = o.ctl ? 84 : 46;                                                    // (t-006: the player's control bar sits in a deeper bottom band)
    this.letterbox.clear().fillStyle(0x0c0a0e).fillRect(0, 0, VIEW_W, 46).fillRect(0, VIEW_H - lb, VIEW_W, lb)
      .fillStyle(0xff2878).fillRect(0, 44, VIEW_W, 2).fillRect(0, VIEW_H - lb, VIEW_W, 2);
    const cap = o.caption || label;
    if (o.ctl) this.replayCap.setScale(1).setPosition(VIEW_W / 2, 23).setOrigin(0.5).setText(cap.length > 36 ? cap.slice(0, 33) + '...' : cap);   // (the caption moves up, out of the bar's way, clear of the score)
    else this.replayCap.setScale(1).setPosition(VIEW_W / 2, VIEW_H - 23).setOrigin(0.5).setText(cap);
    if (this.replayCap.__ui) this.replayCap.__ui = null;                           // (its zoom-1 layout is taken again from here)
    this.letterbox.setVisible(true); this.replayTxt.setVisible(true); this.replayCap.setVisible(true);
    for (const o2 of [this.cursor, this.power, this.ring, this.radar, this.help]) if (o2) o2.setVisible(false);
    if (label === 'GOAL' && this.lastScorer) {
      const sc = this.lastScorer;
      if (sc.own) this.ramiSay('own_goal', {}, 3);
      else if (sc.bike) this.ramiSay('goal_followup', { text: 'WHAT AN OVERHEAD\nKICK! UNBELIEVABLE!', expr: 'goal' }, 3);
      else if (sc.how === 'dheader') this.ramiSay('goal_followup', { text: 'A DIVING HEADER!\nBRAVE AS YOU LIKE!', expr: 'shock' }, 3);
      else if (sc.how === 'header') this.ramiSay('goal_followup', { text: 'A BULLET HEADER!\nNUMBER ' + (sc.num || '') + ' RISES!', expr: 'goal' }, 3);
      else if (sc.how === 'volley') this.ramiSay('goal_followup', { text: 'ON THE VOLLEY!\nWHAT A STRIKE!', expr: 'goal' }, 3);
      else if (sc.how === 'shot' && sc.far > 24) this.ramiSay('goal_followup', { text: 'FROM ' + Math.round(sc.far) + ' METRES!\nWHAT A HIT!', expr: 'shock' }, 3);
      else if (sc.late) this.ramiSay('last_minute', {}, 3);
      else this.ramiSay('goal_followup', { TEAM: sc.team.name, NUM: sc.num || '' }, 3);
    }
    else if (label === 'WHAT A SAVE!') this.ramiSay('save', {}, 2);
    else if (label === 'FOUL') this.ramiSay('foul', { text: ['LET US SEE IT AGAIN...', 'WATCH THE TIMING\nON THIS ONE...', 'OUCH. LOOK AT THAT.'][Math.floor(Math.random() * 3)], expr: 'shock' }, 3);
    else if (label === 'SO CLOSE!') this.ramiSay('miss', { text: 'OHHH! INCHES WIDE!', expr: 'shock' }, 2);
    else if (label === 'OFF THE POST!' || label === 'OFF THE BAR!') this.ramiSay('post', label === 'OFF THE BAR!' ? { text: 'OFF THE BAR!!' } : {}, 2);
    this.wipe();
    this.uiFix = this.uiItems();
  },
  replayTick(dt) {
    const r = this.replay;
    if (r.ctl) { if (this.replayCtl(r, dt)) return; }                              // t-006 the replay player: you drive the clock
    else {
      if (r.real > 0.4 && r.exit && Input.pressed('start')) { const ex = r.exit; r.after = null; this.endReplay(); ex(); return; }
      if (r.real > paceK().skipAfter && (Input.pressed('shoot') || Input.pressed('pass') || Input.pressed('start') || Input.pressed('lob'))) return this.endReplay();   // (t-004: ARCADE skips at once)
      r.real += dt;
      const sl = r.t > r.slowA && r.t < r.slowB; r.t += dt * (sl ? 0.35 : 1);
    }
    const slow = r.t > r.slowA && r.t < r.slowB;
    while (r.i < r.frames.length - 1 && r.frames[r.i + 1].t0 <= r.t) r.i++;
    while (r.i > 0 && r.frames[r.i].t0 > r.t) r.i--;                              // (the player can go back)
    const f = r.frames[r.i];
    f.p.forEach((v, k) => { const q = this.all[k]; if (!q) return; const sp = q.spr; sp.anims.stop();
      sp.setPosition(v[0], v[1]).setFrame(v[2]).setVisible(v[3]).setDepth(v[4]).setOrigin(v[5], v[6]).setFlipX(v[7]).setRotation(v[8] || 0).setScale(v[9] ?? 1, v[10] ?? 1); });
    this.ballSpr.setPosition(f.b[0], f.b[1]).setFrame(f.b[2]).setVisible(f.b[3]).setDepth(f.b[4]).setScale(f.b[5]);
    if (f.b[6]) this.ballSpr.setTintFill(0xffffff); else if (this.ballSpr.isTinted) this.ballSpr.clearTint();   // t-006: the hit's white flash
    this.ballSh.setPosition(f.s[0], f.s[1]).setAlpha(f.s[2]).setDepth(f.s[3]).setScale(f.s[4]);
    if (f.r && this.ref) { const sp = this.ref.spr; sp.anims.stop(); sp.setPosition(f.r[0], f.r[1]).setFrame(f.r[2]).setVisible(f.r[3]).setDepth(f.r[4]).setFlipX(f.r[5]); this.ref.anim = ''; }
    r.fxNow = this.drawFx(f); r.fxMax = Math.max(r.fxMax, r.fxNow);              // t-006: the effects of that frame (slow-mo too: they're per frame)
    this.netReplay(f.nt);                                                          // t-025: and the net as it was (bulging, rolling, torn)
    // TV zoom: in on the ball during the slow motion, back out after
    const zb = this.baseZoom(), zt = !r.noZoom && r.t > r.slowA - 0.1 && r.t < r.slowB + 0.15 ? zb * 1.5 : zb;   // camera-pov: 1.5x the picked distance
    r.z += (zt - r.z) * Math.min(1, dt * 5);
    const k = (r.z - zb) / (0.5 * zb), cam = this.cameras.main;
    cam.setZoom(r.z);
    // t-006: the camera's shake as it was recorded - a fixed wobble per frame (no dice: a replay mid-match mustn't move them)
    const shk = f.sh ? f.sh * VIEW_W * 0.6 : 0, sx = shk * Math.sin(r.i * 2.39), sy = shk * Math.cos(r.i * 3.71);
    if (r.label === 'BUG CLIP' && r.focus >= 0 && f.p[r.focus] && f.p[r.focus][3]) {        // v0.8.7: a clip about a player follows HIM, not the ball
      const v = f.p[r.focus], tx = v[0], ty = v[1] - 70; r.fx = r.fx == null ? tx : r.fx + (tx - r.fx) * Math.min(1, dt * 6); r.fy = r.fy == null ? ty : r.fy + (ty - r.fy) * Math.min(1, dt * 6);
      cam.centerOn(r.fx + sx, r.fy + sy);
    } else cam.centerOn(f.cam[0] + (f.b[0] - f.cam[0]) * k * 0.8 + sx, f.cam[1] + (f.b[1] - f.cam[1]) * k * 0.8 + sy);
    if (!this.rpFlash || !this.rpFlash.scene) { this.rpFlash = this.add.rectangle(VIEW_W / 2, VIEW_H / 2, VIEW_W * 3, VIEW_H * 3, 0xffffff).setScrollFactor(0).setDepth(9.45e6); this.rpFlash.__rp = true; }
    if (f.fl) this.rpFlash.setFillStyle((f.fl[0] << 16) | (f.fl[1] << 8) | f.fl[2], f.fl[3]).setVisible(true); else this.rpFlash.setVisible(false);   // t-006: the camera's flash
    this.fixUi(r.z);
    const st = r.ctl ? ` · ${RP_SPEEDS[r.ctl.sp]}X${r.ctl.play ? '' : r.ctl.end ? ' · END' : ' · PAUSED'}` : '';
    if (r.label === 'BUG CLIP') {                                                 // v0.8.7: circle the player it's about, flag the moment
      if (!this.bwG || !this.bwG.scene) this.bwG = this.add.graphics().setDepth(9.4e6);
      const g = this.bwG.clear().setVisible(true), at = r.mark >= 0 && Math.abs(r.i - r.mark) < 20, v = r.focus >= 0 && f.p[r.focus];
      const px = v ? v[0] : f.b[0], py = v ? v[1] - 50 : f.b[1];
      g.lineStyle(3, at ? 0xff2878 : 0xffde1e, 0.95).strokeEllipse(px, v ? v[1] - 4 : py + 10, 70, 30);
      g.fillStyle(at ? 0xff2878 : 0xffde1e, 1).fillTriangle(px - 9, py - 70, px + 9, py - 70, px, py - 56);
      this.replayTxt.setText(at ? '◆ HERE' + st : (Math.floor(r.real * 2) % 2 ? '● ' : '  ') + (r.flag ? 'FLAG' : 'BUG WATCH') + (slow ? ' · SLOW' : '') + st);
    } else this.replayTxt.setText((Math.floor(r.real * 2) % 2 ? '● ' : '  ') + (slow ? 'REPLAY · SLOW-MO' : 'REPLAY') + st);
    if (r.ctl) this.rpBarDraw(r);
    else if (r.i >= r.frames.length - 1) this.endReplay();
  },
  // t-006 REPLAY PLAYER (Luca: "a replay feature - where you can replay forward pause slow mo"): pause-menu REPLAY (LAST 10 S),
  // LAST GOAL, HIGHLIGHTS and every Bug Watch / flag clip play here. PASS or SPACE play / pause · UP / DOWN 1x 0.5x 0.25x ·
  // LEFT / RIGHT one frame (hold to scrub) · LOB or R from the start · ENTER or SHOOT out. The bar under the picture
  // (ui.js) does the same with clicks. Only ever off the pause menu / full time / the review: never while the ball is live.
  replayCtl(r, dt) {
    const C = r.ctl, n = r.frames.length, T = Input.taps, nav = Input.nav(), a = C.q.shift() || '';
    r.real += dt;
    const space = T.has('Space') || Input.keys.has('Space');                      // (SPACE is a shoot key too: here it means play / pause)
    if (r.real > 0.25 && (a === 'exit' || Input.pressed('start') || (Input.pressed('shoot') && !space))) {
      const ex = r.exit; if (ex) { r.after = null; this.endReplay(); ex(); } else this.endReplay(); return true;
    }
    const from0 = () => { r.t = 0; r.i = 0; C.end = false; C.play = true; };
    if (a === 'restart' || T.has('KeyR') || Input.pressed('lob')) from0();
    else if (a === 'play' || T.has('Space') || Input.pressed('pass')) { if (C.end) from0(); else C.play = !C.play; }
    if (a === 'slower' || nav.y > 0) C.sp = Math.min(RP_SPEEDS.length - 1, C.sp + 1);
    if (a === 'faster' || nav.y < 0) C.sp = Math.max(0, C.sp - 1);
    if (a === 'speed') C.sp = (C.sp + 1) % RP_SPEEDS.length;
    const step = d => { C.play = false; C.end = false; r.i = clamp(r.i + d, 0, n - 1); r.t = r.frames[r.i].t0; };
    if (a === 'back' || nav.x < 0) step(-1);
    if (a === 'fwd' || nav.x > 0) step(1);
    if (typeof a === 'object' && a.seek != null) { C.play = false; C.end = false; r.t = clamp(a.seek, 0, 1) * r.frames[n - 1].t0; }   // a click / drag on the bar
    if (r.full) {                                                                    // Luca 31 Oct: the WHOLE MATCH - big jumps, not only frames
      const end = r.frames[n - 1].t0, jump = s => { C.end = false; r.t = clamp(r.t + s, 0, end); };
      if (a === 'jb' || T.has('BracketLeft') || T.has('PageUp')) jump(-10);          // [ / PAGE UP: 10 s back
      if (a === 'jf' || T.has('BracketRight') || T.has('PageDown')) jump(10);        // ] / PAGE DOWN: 10 s on
      if (a === 'home' || T.has('Home')) { r.t = 0; C.end = false; }
      if (a === 'last10' || T.has('End')) { r.t = Math.max(0, end - 10); C.end = false; C.play = true; }   // END: the last 10 seconds, playing
      if ((a === 'goal' || T.has('KeyG')) && r.goals.length) {                       // G: the next goal, from 4 s before it (then round again)
        const g = r.goals.find(q => q.t0 - 4 > r.t + 0.5) || r.goals[0]; r.t = Math.max(0, g.t0 - 4); C.end = false; C.play = true;
      }
    }
    C.hold = Math.abs(Input.axis.x) > 0.5 ? C.hold + dt : 0;                       // LEFT / RIGHT held: scrub at twice real time
    const scr = r.full ? Math.min(40, 2 + Math.max(0, C.hold - 0.3) * 16) : 2;     // (the whole match: it speeds up the longer you hold, to 40x)
    if (C.hold > 0.3) { C.play = false; C.end = false; r.t = clamp(r.t + Math.sign(Input.axis.x) * dt * scr, 0, r.frames[n - 1].t0); }
    if (C.play) {
      r.t += dt * RP_SPEEDS[C.sp];
      if (r.t >= r.frames[n - 1].t0) {
        if (r.label === 'HIGHLIGHT') { this.endReplay(); return true; }           // (HIGHLIGHTS go on to the next one)
        r.t = r.frames[n - 1].t0; C.play = false; C.end = true;                    // the end: it waits on the last frame
      }
    }
    return false;
  },
  wipe() {                                                                       // TV-style sweep in and out of a replay
    if (!this.wipeG || !this.wipeG.scene) {
      this.wipeG = this.add.graphics().setScrollFactor(0).setDepth(9.9e6);
      this.wipeG.fillStyle(0xff2878).fillPoints([{ x: 0, y: 0 }, { x: 260, y: 0 }, { x: 160, y: VIEW_H }, { x: -100, y: VIEW_H }], true)
        .fillStyle(0xffde1e).fillPoints([{ x: 260, y: 0 }, { x: 330, y: 0 }, { x: 230, y: VIEW_H }, { x: 160, y: VIEW_H }], true)
        .fillStyle(0x0c0a0e).fillPoints([{ x: -560, y: 0 }, { x: 0, y: 0 }, { x: -100, y: VIEW_H }, { x: -660, y: VIEW_H }], true);
    }
    this.tweens.killTweensOf(this.wipeG);
    const z = this.cameras.main.zoom || 1, cx = VIEW_W / 2, cy = VIEW_H / 2, at = x => cx + (x - cx) / z;   // camera-pov: screen-sized at any zoom
    this.wipeG.setVisible(true).setPosition(at(-360), cy - cy / z).setScale(1 / z);
    this.tweens.add({ targets: this.wipeG, x: at(VIEW_W + 700), duration: 480, ease: 'Cubic.easeInOut', onComplete: () => this.wipeG.setVisible(false) });
  },
  fixUi(z) {                                                                       // keep the HUD / bars still while the camera zooms
    const cx = VIEW_W / 2, cy = VIEW_H / 2;
    for (const u of this.uiFix || []) { const g = u.g; if (!g || !g.scene) continue;
      const o = g.__ui || (g.__ui = { x: u.x, y: u.y, s: u.s });                  // camera-pov: the layout at zoom 1, kept once
      g.setScale(o.s / z).setPosition(cx + (o.x - cx) / z, cy + (o.y - cy) / z); }
  },
  uiItems() {                                                                      // camera-pov: everything drawn in screen space
    return [this.hud, this.letterbox, this.replayTxt, this.replayCap, this.rami && this.rami.c, this.wxG].filter(Boolean).map(g => ({ g, x: g.x, y: g.y, s: g.scaleX }));
  },
  baseZoom() { return window.__lab ? 1 : camZoom(); },                              // camera-pov: the picked distance (the Test Lab has its own slider)
  endReplay() {
    const r = this.replay; this.replay = null; if (!r) return;
    const menu = r.label === 'LAST GOAL' || r.label === 'HIGHLIGHT' || r.label === 'BUG CLIP' || !!r.ctl;   // v0.8.2: watched from the pause menu / full time (v0.8.7: + BUG WATCH; t-006: + the player)
    if (r.kits) for (const q of this.all) if (q.spr.texture.key !== q.kit) q.spr.setTexture(q.kit);
    if (this.bwG && this.bwG.scene) this.bwG.clear().setVisible(false);
    for (const im of this.rpFx || []) if (im && im.scene) im.setVisible(false);   // t-006: the replay's effects, flash and bar go
    if (this.rpFlash && this.rpFlash.scene) this.rpFlash.setVisible(false);
    this.rpBarHide();
    this.cameras.main.setZoom(this.baseZoom()); this.fixUi(this.baseZoom()); if (!menu) this.lastReplayEnd = this.recN || 0;   // v0.8.1: skipping mid-zoom left the camera (and HUD) zoomed for good
    for (const q of this.all) q.anim = '';                                        // let every sprite pick its animation up again
    this.wipe();
    this.letterbox.setVisible(false); this.replayTxt.setVisible(false); this.replayCap.setVisible(false);
    for (const o of [this.cursor, this.power, this.ring, this.radar]) if (o) o.setVisible(true);
    // flag-mvwailzc-pm3 (Luca 31 Oct, "goalie just let the ball past", flagged right after the goal): the timeline starts
    // again after a goal / foul replay, so his INSTA FLAG kept 4 frames of the kick-off and none of the goal. The frames
    // before the replay stay in recPrev, for flagClip only (replays and recIndex still use rec alone)
    if (!menu) { this.recPrev = this.rec; this.rec = []; }                       // (the match timeline carries on after a pause-menu replay)
    if (r.after) r.after();
  },
  playHighlights(done) {                                                           // every goal of the match, in order
    const H = this.highlights || []; if (!H.length) { done && done(); return; }
    const go = i => {
      if (i >= H.length) { done && done(); return; }
      this.startReplay('HIGHLIGHT', () => go(i + 1), H[i].frames, { caption: `HIGHLIGHTS ${i + 1}/${H.length} · ${H[i].cap}`, exit: () => done && done(), ctl: true });   // (t-006: in the player)
    };
    go(0);
  },

  // ---------- v0.8.7 BUG WATCH review screen (pause menu · B at full time): the clips the watchdog kept, one by one
  async bwDb() {
    if (this._bwDb !== undefined) return this._bwDb;
    this._bwDb = null;
    try { if (window.claude && window.claude.use) this._bwDb = await window.claude.use('db'); } catch (e) { this._bwDb = null; }
    return this._bwDb;
  },
  bwBadge(inc) {                                           // a small note under the clock, never in the way
    if (!window.HC2_STARTED || (this.demo && !this.watch) || window.__lab || !this.hud || inc.sev !== 'bug') return;   // (the odd ones wait quietly in the list)
    if (!this.bwTxt || !this.bwTxt.scene) {
      this.bwTxt = this.add.text(16, 88, '', { fontFamily: '"Press Start 2P"', fontSize: '8px', color: '#f4f0e4', backgroundColor: '#ff2878', padding: { x: 6, y: 4 } }).setScrollFactor(0);
      this.hud.add(this.bwTxt);
    }
    const n = this.bw.list.filter(x => x.isNew).length;
    this.bwTxt.setText(`BUG WATCH · ${inc.title} · ${n} TO CHECK`).setVisible(true);
    if (this.bwHide) this.bwHide.remove(false);
    this.bwHide = this.time.delayedCall(4000, () => { if (this.bwTxt && this.bwTxt.scene) this.bwTxt.setVisible(false); });
  },
  bwOpen(from) {
    this.bwUI = { page: 'list', i: 0, from, sel: null };
    this.msg.setVisible(false); this.sub.setVisible(false);
    if (this.bwTxt && this.bwTxt.scene) this.bwTxt.setVisible(false);
    SFX.click(); this.bwDraw();
  },
  bwClose() {
    const U = this.bwUI; this.bwUI = null; this.closeFlowEl();
    if (U && U.from === 'pause' && this.paused && this.pm) { this.drawPause(); return; }
    this.msg.setVisible(true); this.sub.setVisible(true);
  },
  bwList() { const L = this.bw ? this.bw.list : []; return L.filter(x => !bwLook(x)).sort(bwOrder).slice(0, 40); },   // (t-021: real bugs first, errors on top; to check before marked)
  bwItems() {
    const U = this.bwUI, L = this.bwList();
    if (U.page === 'one') {
      const x = U.sel;
      return [{ k: 'watch', l: 'WATCH THE CLIP', key: 'ENTER', act: () => this.bwPlay(x) },
        { k: 'bug', l: 'THAT\'S A BUG', key: '1', act: () => this.bwMark(x, 'bug') },
        { k: 'fine', l: 'LOOKS FINE', key: '2', act: () => this.bwMark(x, 'fine') },
        { k: 'unsure', l: 'NOT SURE', key: '3', act: () => this.bwMark(x, 'unsure') },
        { k: 'back', l: '◀ BACK', key: 'ESC', act: () => { U.page = 'list'; U.i = Math.max(0, L.indexOf(x)); } }];
    }
    return [...L.map((x, j) => ({ k: 'i' + j, x, l: `${x.old ? 'EARLIER · ' : ''}${x.min}' ${x.kind === 'flag' ? String(x.note || x.title).slice(0, 28).toUpperCase() : x.title}`, tag: x.review ? BW_VERDICT[x.review.verdict] : x.kind === 'flag' ? 'FLAG' : BW_ERR.has(x.code) ? 'ERROR' : x.isNew ? 'NEW' : '',   // (t-006: your flags say FLAG; t-021: errors say ERROR)
      act: () => { U.page = 'one'; U.sel = x; U.i = 0; x.isNew = false; } })),
      { k: 'close', l: '◀ BACK', key: 'ESC', act: () => this.bwClose() }];
  },
  bwDraw() {
    const U = this.bwUI; if (!U) return;
    const el = this.flowEl('bw'), items = this.bwItems(); U.i = clamp(U.i, 0, items.length - 1);
    if (!document.getElementById('bwcss')) {
      const st = document.createElement('style'); st.id = 'bwcss';
      st.textContent = `#flow .bw{width:min(640px,100%);display:grid;gap:8px;text-align:left}
        #flow .bw .card{background:#1d1a22;border:3px solid #0c0a0e;box-shadow:4px 4px 0 #0c0a0e;padding:10px 12px;display:grid;gap:6px}
        #flow .bw .card p{margin:0;font-size:9px;line-height:1.9} #flow .bw .card .n{color:#28c8e6;word-break:break-word}
        #flow .bw .sev{display:inline-block;padding:2px 6px;margin-right:6px;font-size:8px;color:#0c0a0e;background:#ffde1e} #flow .bw .sev.bug{background:#ff2878;color:#fff} #flow .bw .sev.perf{background:#28c8e6} #flow .bw .sev.mark{background:#4cff7a} #flow .bw .sev.flag{background:#ff2878;color:#fff}
        #flow .bw input{font:9px "Press Start 2P",monospace;padding:8px;border:3px solid #0c0a0e;background:#f4f0e4;color:#0c0a0e;width:100%;box-sizing:border-box}
        #flow .bw .menu{width:100%} #flow .bw .menu button em{font-style:normal;font-size:8px;padding:2px 5px;background:#0c0a0e;color:#ffde1e}
        #flow .bw .menu button em.BUG{color:#ff2878} #flow .bw .menu button em.FINE{color:#4cff7a} #flow .bw .menu button em.NEW{color:#28c8e6} #flow .bw .menu button em.FLAG{color:#fff;background:#ff2878}
        #flow .bw .menu{max-height:min(52vh,420px);overflow-y:auto;padding:2px 6px 6px 2px}
        #flow .bw .stk{margin:0;max-height:120px;overflow:auto;white-space:pre-wrap;word-break:break-all;font:8px/1.6 monospace;color:#ffde1e;background:#0c0a0e;padding:6px}
        #flow .bw .menu button em.ERROR{color:#fff;background:#ff2878}`;
      document.head.appendChild(st);
    }
    const L = this.bwList(), todo = L.filter(x => !x.review).length;
    if (U.page === 'one') {
      const x = U.sel, rv = x.review, saved = x.saved === 'db' ? 'SAVED · CLAUDE CAN READ IT' : x.saved === 'local' ? 'KEPT IN THIS BROWSER' : x.ready ? 'SAVING…' : 'STILL RECORDING…';
      el.innerHTML = `<h2>BUG WATCH</h2><div class="bw"><div class="card">
        <p><span class="sev ${x.sev}">${BW_ERR.has(x.code) && !bwPaused(x) ? 'CODE ERROR' : x.sev === 'bug' ? 'LOOKS LIKE A BUG' : x.sev === 'mark' ? 'YOUR MARK' : x.sev === 'flag' ? 'YOUR FLAG' : x.sev === 'perf' ? 'SPEED' : 'LOOKS ODD'}</span>${x.title}</p>
        <p>${x.min}' · ${['1ST HALF', '2ND HALF', 'EXTRA TIME 1', 'EXTRA TIME 2'][(x.half || 1) - 1]} · ${x.home} ${x.score} ${x.away}${x.mode === 'demo' ? ' · THE DEMO' : x.mode === 'watch' ? ' · WATCH MODE' : ''}</p>
        <p>WHAT TRIPPED: ${x.why}</p><p class="n">${String(x.msg).replace(/[<>&]/g, '')}</p>${BW_ERR.has(x.code) && x.stack ? `<pre class="stk">${String(x.stack).slice(0, 700).replace(/[<>&]/g, '')}</pre>` : ''}
        <p>${rv ? `YOU SAID: ${BW_VERDICT[rv.verdict]}${rv.note ? ' · ' + rv.note.replace(/[<>&]/g, '') : ''} · ` : ''}${saved}</p>
        <input id="bwnote" maxlength="200" placeholder="NOTE (OPTIONAL) - WHAT LOOKS WRONG?" value="${rv && rv.note ? rv.note.replace(/["<>&]/g, '') : ''}">
      </div><div class="menu">${items.map((it, j) => `<button type="button" data-j="${j}" class="${j === U.i ? 'on' : ''}">${it.l}<kbd>${it.key || ''}</kbd></button>`).join('')}</div></div>
      <small>WATCH IT, THEN MARK IT · &#8593;&#8595; PICK · ENTER: OK · ESC: BACK</small>`;
      const inp = el.querySelector('#bwnote'); if (inp) inp.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter' || e.key === 'Escape') inp.blur(); });
    } else {
      el.innerHTML = `<h2>BUG WATCH</h2><div class="bw"><div class="card"><p>THE GAME WATCHES ITS OWN FOOTAGE WHILE IT PLAYS. WHEN SOMETHING BREAKS A RULE (AN ERROR, A GOAL NOT GIVEN, A BALL THROUGH THE KEEPER...) IT KEEPS THE CLIP. REAL BUGS COME FIRST; ANIMATION FLICKER IS ONLY COUNTED.</p>
        <p class="n">${L.length ? `${L.length} CLIP${L.length > 1 ? 'S' : ''} · ${todo} TO CHECK` : 'NOTHING CAUGHT YET - GOOD SIGN.'}${BW_ON ? '' : ' · BUG WATCH IS OFF (OPTIONS)'}</p></div>
        <div class="menu">${items.map((it, j) => `<button type="button" data-j="${j}" class="${j === U.i ? 'on' : ''}">${it.l}${it.tag ? `<em class="${it.tag.replace(' ', '')}">${it.tag}</em>` : it.key ? `<kbd>${it.key}</kbd>` : ''}</button>`).join('')}</div></div>
        <small>&#8593;&#8595; PICK · ENTER: OPEN · ESC: BACK</small>`;
    }
    el.querySelectorAll('.menu button').forEach(b => b.onclick = () => { U.i = +b.dataset.j; this.bwAct(); });
    const on = el.querySelector('.menu button.on'); if (on && on.scrollIntoView) on.scrollIntoView({ block: 'nearest' });
  },
  bwAct() { const U = this.bwUI, it = this.bwItems()[U.i]; if (!it) return; SFX.click(); it.act(); if (this.bwUI && !this.replay) this.bwDraw(); },
  bwInput() {
    const U = this.bwUI, t = Input.taps;
    if (t.has('Escape') || t.has('KeyP')) { if (U.page === 'one') { const L = this.bwList(); U.page = 'list'; U.i = Math.max(0, L.indexOf(U.sel)); this.bwDraw(); } else this.bwClose(); return; }
    if (U.page === 'one') { const v = t.has('Digit1') ? 'bug' : t.has('Digit2') ? 'fine' : t.has('Digit3') ? 'unsure' : null; if (v) return this.bwMark(U.sel, v); }
    const n = Input.nav(), items = this.bwItems();
    if (n.y) { U.i = (U.i + n.y + items.length) % items.length; SFX.click(); this.bwDraw(); }
    if (Input.pressed('start')) this.bwAct();
  },
  bwMark(x, v) {
    const inp = document.getElementById('bwnote'), note = inp ? inp.value.trim() : '';
    this.bw.review(x, v, note); SFX.click();
    const U = this.bwUI, L = this.bwList(), next = L.findIndex(y => !y.review);
    U.page = 'list'; U.i = next >= 0 ? next : L.length; this.bwDraw();
  },
  bwPlay(x) {
    const F = this.bw.framesOf(x), U = this.bwUI;
    if (!F || F.frames.length < 30) { x.msg += ' (no footage kept for this one)'; this.bwDraw(); return; }
    const back = () => { if (!this.bwUI) return; this.msg.setVisible(false); this.sub.setVisible(false); this.bwDraw(); };
    this.bwLoadKits(x.kits, () => {
      this.closeFlowEl(); this.msg.setText(''); this.sub.setText(''); this.msg.setVisible(true); this.sub.setVisible(true);
      const frames = F.frames.map(f => Object.assign({}, f)), mk = clamp(F.mark, 0, frames.length - 1); frames[mk].goal = true;
      const cap = x.kind === 'flag' ? `FLAG · ${x.min}' ${String(x.note || '').replace(/\s+/g, ' ').toUpperCase()}` : `BUG WATCH · ${x.min}' ${x.title}`;
      this.startReplay('BUG CLIP', back, frames, { caption: cap, exit: back, kits: x.kits, focus: x.who, noZoom: true, mark: mk, slowPre: 1.2, slow: 1.8, ctl: true });   // (t-006: in the player)
      if (this.replay) this.replay.flag = x.kind === 'flag';
      if (!this.replay) back();
    });
    void U;
  },
  // t-006 INSTA FLAG, SEND: keep the clip (Bug Watch's list + this browser + the game's database), then wake the fixer.
  // The connector call is fire-and-forget: no trigger id, no 'mcp' capability, an error - the clip is still saved and
  // play never waits for it.
  flagSend(note) {
    const { inc, saved } = this.bw.flagClip(note);
    Promise.resolve(saved).then(where => {
      const id = typeof window.__flagTrigger === 'string' ? window.__flagTrigger : FLAG_TRIGGER;   // (the flag test sets its own)
      inc.woke = 'no';
      if (where !== 'db' || !id) return;
      return Promise.resolve().then(async () => {
        const mcp = window.claude && window.claude.use ? await window.claude.use('mcp') : null; if (!mcp) return;
        await mcp.callTool('Claude Code Remote', 'fire_trigger', { trigger_id: id, text: `FLAG ${inc.id}: ${inc.note || '(no note)'} | ${inc.line}` });
        inc.woke = 'yes'; CRUMB('flag: fixer woken');
      });
    }).catch(() => { inc.woke = 'failed'; });
    return inc;
  },
  bwLoadKits(kits, done) {                                 // a clip from another match: load those kits first
    const need = [...new Set(kits || [])].filter(k => k && MAN.kits[k] && !this.textures.exists(k));
    if (!need.length) return done();
    for (const k of need) this.load.atlas(k, SRC(`sprites/${k}.webp`, k), `assets/sprites/${k}.json`);
    this.load.once('complete', done); this.load.start();
  },
});
