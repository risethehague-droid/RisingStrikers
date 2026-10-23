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
  CRASH:       { t: 'GAME ERROR', sev: 'bug', why: 'the code threw an error' },
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
  JITTER:      { t: 'FLICKERING', sev: 'odd', why: 'a player keeps flipping the way he faces' },
  ANIM_FLICKER: { t: 'ANIMATION FLICKER', sev: 'odd', why: 'animations flash up for a frame or two and switch again (idle / walk / run...)' },
  BALL_ON_PLAYER: { t: 'BALL STUCK ON A PLAYER', sev: 'odd', why: 'the ball sits at a player\'s feet but he never takes it' },
  PASS_LOOP:   { t: 'BACK AND FORTH', sev: 'odd', why: 'two players pass to each other again and again' },
  STUTTER:     { t: 'STUTTER', sev: 'perf', why: 'the game skipped frames several times in a few seconds' },
};
const BW_VERDICT = { bug: 'BUG', fine: 'FINE', unsure: 'NOT SURE' };
const BW_MAX = 30, BW_GAP = 25000, BW_PRE = 240, BW_POST = 90, BW_KEEP = 8;
const BW_LONG = new Set(['applaud', 'party', 'trophy', 'dejected', 'celebrate', 'hurt', 'beaten', 'roar', 'protest', 'labanim', 'pick', 'runup', 'flight', 'done', 'walk']);
let BW_ON = (() => { try { return localStorage.getItem('hc2-bw') !== 'off'; } catch (e) { return true; } })();
function setBwOn(v) { BW_ON = !!v; try { localStorage.setItem('hc2-bw', v ? 'on' : 'off'); } catch (e) {} }
const bwF1 = v => (Number.isFinite(v) ? v.toFixed(1) : String(v)), bwF2 = v => (Number.isFinite(v) ? v.toFixed(2) : String(v));

// a clip, packed small enough for the database: 30 frames a second, whole pixels, frame names in a table
function bwPack(frames, mark) {
  const names = [], ix = new Map(), N = s => { let i = ix.get(s); if (i === undefined) { i = names.length; names.push(s); ix.set(s, i); } return i; };
  const r = v => Math.round(v || 0), r10 = v => Math.round((v || 0) * 10), rk = v => Math.round((v || 0) * 1000), out = [];
  let acc = 0;
  frames.forEach((f, i) => {
    acc += f.dt || 0; if (i % 2 && i !== frames.length - 1) return;
    const row = [Math.round(acc * 1000), r(f.cam[0]), r(f.cam[1]), r(f.b[0]), r(f.b[1]), N(f.b[2]), f.b[3] ? 1 : 0, r10(f.b[4]), rk(f.b[5]),
      r(f.s[0]), r(f.s[1]), rk(f.s[2]), r10(f.s[3]), rk(f.s[4]), f.p.length];
    for (const v of f.p) row.push(r(v[0]), r(v[1]), N(v[2]), v[3] ? 1 : 0, r10(v[4]), rk(v[5]), rk(v[6]), v[7] ? 1 : 0);
    if (f.r) row.push(r(f.r[0]), r(f.r[1]), N(f.r[2]), f.r[3] ? 1 : 0, r10(f.r[4]), f.r[5] ? 1 : 0);
    out.push(row); acc = 0;
  });
  return JSON.stringify({ v: 1, mark: Math.round((mark || 0) / 2), names, f: out });
}
function bwUnpack(s) {
  const d = typeof s === 'string' ? JSON.parse(s) : s, N = d.names;
  const frames = d.f.map(row => {
    let k = 0; const g = () => row[k++];
    const f = { dt: g() / 1000, cam: [g(), g()], b: [g(), g(), N[g()], !!g(), g() / 10, g() / 1000], s: [g(), g(), g() / 1000, g() / 10, g() / 1000], p: [] };
    const n = g(); for (let i = 0; i < n; i++) f.p.push([g(), g(), N[g()], !!g(), g() / 10, g() / 1000, g() / 1000, !!g()]);
    f.r = k < row.length ? [g(), g(), N[g()], !!g(), g() / 10, !!g()] : null;
    return f;
  });
  return { frames, mark: d.mark || 0 };
}

class BugWatch {
  constructor(m) { this.m = m; this.list = []; this.cap = null; this.sent = 0; this.reset(); this.loadOld(); }
  reset() { if (this.cap) this.finish(); this.k = {}; this.seen = {}; this.trace = []; this.traceT = 0; this.pos = null; this.bpos = null; this.wasLive = false; this.inNet = false; this.hitch = []; this.faces = []; this.owners = []; this.lastOwner = null; this.wasFoul = false; this.now = 0; this.stats = {}; this.perCode = {}; }
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
      for (const t of [m.home, m.away]) { const k = t.players[0], far = k && !k.sentOff ? Math.abs(k.x - t.ownGoalX) : 0;
        if (this.hold('kw' + t.side, far > 40, dt, 3)) this.flag('KEEPER_WANDER', `${this.who(k)} is ${bwF1(far)} m from his goal line (${k.state})`, { p: k }); }
      let stack = null;
      for (let i = 0; i < A.length && !stack; i++) { const p = A[i]; if (p.sentOff || p.hide) continue;
        for (let j = i + 1; j < A.length; j++) { const q = A[j]; if (!q.sentOff && !q.hide && Math.abs(p.x - q.x) < 0.35 && Math.abs(p.y - q.y) < 0.3) { stack = [p, q]; break; } } }
      if (this.hold('stack', !!stack, dt, 2)) this.flag('STACKED', `${this.who(stack[0])} and ${this.who(stack[1])} on the same spot for 2 s (${stack[0].state} / ${stack[1].state})`, { p: stack[0] });
      A.forEach((p, i) => { if (p.sentOff || p === m.human) return; const F = this.faces[i] || (this.faces[i] = { f: p.face, ts: [] });
        if (p.face !== F.f) { F.f = p.face; F.ts.push(this.now); while (F.ts.length && this.now - F.ts[0] > 1) F.ts.shift();
          if (F.ts.length >= 8 && (p.speed || 0) < 3) { F.ts = []; this.flag('JITTER', `${this.who(p)} turned 8 times in a second (${p.state}, ${bwF1(p.speed || 0)} m/s)`, { p }); } }
        const an = p.anim || '';                                                  // a BLIP: an animation on screen for under 0.1 s
        if (an !== F.a) { if (F.a && this.now - (F.at || 0) < 0.1) { (F.bl = F.bl || []).push(this.now); while (F.bl.length && this.now - F.bl[0] > 1) F.bl.shift();
            if (F.bl.length >= 3) { F.bl = []; this.flag('ANIM_FLICKER', `${this.who(p)}: 3 animations flashed up for under 0.1 s within a second (${(F.a.split(':')[1] || F.a)} → ${(an.split(':')[1] || an)}, ${bwF1(p.speed || 0)} m/s)`, { p }); } }
          F.a = an; F.at = this.now; } });
      const nb = !o && b.z < 0.3 && len(b.vx, b.vy) < 0.6 ? this.nearest(b) : null;
      if (this.hold('bop', !!(nb && nb.d < 0.45 && !nb.p.busy() && !(nb.p.stun > 0) && !(nb.p.cool > 0)), dt, 1.5)) this.flag('BALL_ON_PLAYER', `the ball sat ${bwF2(nb.d)} m from ${this.who(nb.p)} for 1.5 s and he never took it (${nb.p.state})`, { p: nb.p });
      if (this.pos && this.wasLive) {                       // only between two live frames: restarts place players on purpose
        A.forEach((p, i) => { const q = this.pos[i]; if (!q || p.sentOff || p.hide) return; const d = len(p.x - q[0], p.y - q[1]);
          if (d > Math.max(2, 25 * dt)) this.flag('TELEPORT', `${this.who(p)} moved ${bwF1(d)} m in one frame (${bwF1(q[0])}, ${bwF1(q[1])} → ${bwF1(p.x)}, ${bwF1(p.y)}, ${p.state})`, { p }); });
        const bd = this.bpos ? len(b.x - this.bpos[0], b.y - this.bpos[1]) : 0;
        if (bd > Math.max(3.5, 60 * dt)) this.flag('TELEPORT', `the ball moved ${bwF1(bd)} m in one frame (${bwF1(this.bpos[0])}, ${bwF1(this.bpos[1])} → ${bwF1(b.x)}, ${bwF1(b.y)})`, { p: b.owner });
      }
    } else for (const key of Object.keys(this.k)) if (!key.startsWith('fs-') && !/^(st|off|spr)\d/.test(key)) delete this.k[key];   // (a man stuck in a move stays stuck through a throw-in)
    this.pos = A.map(p => [p.x, p.y]); this.bpos = [b.x, b.y]; this.wasLive = live;
  }
  frame(ms) {                                              // long frames on YOUR screen (not in the test browsers)
    if (!this.watching() || navigator.webdriver || window.HC2_TEST_FAST || document.hidden || !this.live() || ms < 120) return;
    const t = this.m.time.now; this.hitch = this.hitch.filter(x => t - x < 10000); this.hitch.push(t);
    if (this.hitch.length >= 4) { this.flag('STUTTER', `${this.hitch.length} long frames in 10 s (the last one ${Math.round(ms)} ms)`); this.hitch = []; }
  }
  crash(msg, stack) { try { if (!this.m.home) return; delete this.seen.CRASH; this.flag('CRASH', msg, { stack, now: true }); } catch (e) {} }
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
    if (this.seen[code] != null && now - this.seen[code] < BW_GAP) return;
    this.seen[code] = now;
    if (this.list.filter(x => !x.old).length >= BW_MAX) return;
    if (BW_CHECKS[code].sev !== 'bug' && BW_CHECKS[code].sev !== 'mark' && (this.perCode[code] = (this.perCode[code] || 0) + 1) > 2) return;   // (2 clips a match of each 'looks odd' kind is plenty)
    const C = BW_CHECKS[code], p = o.p || null, b = m.ball;
    const inc = { id: `bw-${Date.now().toString(36)}-${Math.floor(Math.random() * 46656).toString(36)}`, code, title: C.t, sev: C.sev, why: C.why, msg,
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
  loadOld() {                                              // clips from earlier visits that nobody marked yet
    try { const L = JSON.parse(localStorage.getItem('hc2-bw-clips') || '[]');
      for (const d of L) if (d && d.id && !d.review) this.list.push(Object.assign({}, d, { old: true, isNew: false, frames: null, packed: d.clip, state: d.state, trace: d.trace })); } catch (e) {}
  }
  framesOf(inc) {                                          // footage of a clip (unpacked on demand for the stored ones)
    if (inc.frames && inc.frames.length) return { frames: inc.frames, mark: inc.mark };
    const s = inc.packed || inc.clip; if (!s) return null;
    try { const u = bwUnpack(s); inc.frames = u.frames; inc.mark = u.mark; return u; } catch (e) { return null; }
  }
  async store(inc) {
    const d = this.doc(inc);
    try {
      const L = JSON.parse(localStorage.getItem('hc2-bw-clips') || '[]').filter(x => x && x.id !== inc.id);
      L.push(d); while (L.length > BW_KEEP) L.shift();
      let s = JSON.stringify(L); while (s.length > 2.4e6 && L.length > 1) { L.shift(); s = JSON.stringify(L); }
      localStorage.setItem('hc2-bw-clips', s);
    } catch (e) {}
    if (inc.mode === 'soak' || (this.sent >= 40 && !inc.review)) return;     // (Claude's overnight runs collect their own)
    if (inc.mode === 'demo' && inc.sev !== 'bug' && !inc.review) return;      // (the demo behind the menu only sends real bugs)
    const db = await this.m.bwDb(); if (!db) { inc.saved = inc.saved || 'local'; return; }
    try { await db.collection('bugwatch').doc(inc.id).set(d); inc.saved = 'db'; if (!inc.review) this.sent++; }
    catch (e) { inc.saved = 'local'; }
    if (this.m.bwUI) this.m.bwDraw();
  }
  review(inc, verdict, note) { inc.review = { verdict, note: note || '', at: new Date().toISOString() }; inc.isNew = false; this.store(inc); }
}
addEventListener('error', e => { const m = window.__hc2; if (m && m.bw) m.bw.crash(`${e.message} (${String(e.filename || '').split('/').pop()}:${e.lineno})`, e.error && e.error.stack); });

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
    const b = this.ballSpr, sh = this.ballSh;
    this.recN = (this.recN || 0) + 1;
    (this.rec = this.rec || []).push({ dt, cam: [Math.round(this.camX), Math.round(this.camY)],
      b: [b.x, b.y, b.frame.name, b.visible, b.depth, b.scaleX], s: [sh.x, sh.y, sh.alpha, sh.depth, sh.scaleX],
      p: this.all.map(q => { const r = q.spr; return [r.x, r.y, r.frame.name, r.visible, r.depth, r.originX, r.originY, r.flipX, r.rotation, r.scaleX, r.scaleY]; }),   // (v0.8.9: + turn / squash for the rough rigs)
      r: this.ref ? (r => [r.x, r.y, r.frame.name, r.visible, r.depth, r.flipX])(this.ref.spr) : null });
    if (this.rec.length > 480) this.rec.shift();
    if (this.bw) this.bw.onRecord(this.rec[this.rec.length - 1]);                 // v0.8.7 BUG WATCH: the clip after the moment
  },
  recIndex(n) { return n - ((this.recN || 0) - (this.rec || []).length); },       // recorder frame number -> index in rec
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
    const gk = e.gk, roar = () => { if (gk && !gk.hands && !gk.busy() && MAN.kits[gk.kit].anims['kroar-S']) { gk.setState('roar', 1.3); gk.face = 6; gk.vx = gk.vy = 0; } };
    this.startReplay(e.label, roar, frames, { caption: e.label });
  },
  goalQTick() {                                                                   // v0.8.2: a goal replay waiting for the pause / another replay to end
    const q = this.goalQ; if (!q || this.replay || this.paused) return;
    this.goalQ = null; if (q.ep !== this.epoch) return;
    this.startReplay('GOAL', q.after, q.frames);
  },
  startReplay(label, after, frames, o = {}) {
    const rec = this.rec || [];
    if (!frames) { frames = rec.slice(-330); const gi = this.recIndex(this.goalAt || 0) - (rec.length - frames.length); if (frames[gi]) frames[gi].goal = true; }
    if (frames.length < 30) { after && after(); return; }
    if (this.bw && this.bw.cap && label !== 'BUG CLIP') this.bw.finish();          // v0.8.7: a clip being recorded ends here
    let t = 0, tg = null; for (const f of frames) { f.t0 = t; if (f.goal) tg = t; t += f.dt; }
    const slowA = (tg !== null ? tg + 0.3 : t - 1.2) - (o.slowPre ?? 1.7);              // slow-mo: the last 1.7 s before the ball crosses the line
    this.msg.setText(''); this.sub.setText('');
    this.replay = { frames, i: 0, t: 0, real: 0, after, slowA, slowB: slowA + (o.slow ?? 2.0), label, z: this.baseZoom(), exit: o.exit, noZoom: !!o.noZoom, focus: o.focus ?? -1, mark: o.mark ?? -1, kits: o.kits || null };
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
    this.letterbox.clear().fillStyle(0x0c0a0e).fillRect(0, 0, VIEW_W, 46).fillRect(0, VIEW_H - 46, VIEW_W, 46)
      .fillStyle(0xff2878).fillRect(0, 44, VIEW_W, 2).fillRect(0, VIEW_H - 46, VIEW_W, 2);
    this.replayCap.setText(o.caption || label);
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
    if (r.real > 0.4 && r.exit && Input.pressed('start')) { const ex = r.exit; r.after = null; this.endReplay(); ex(); return; }
    if (r.real > 0.4 && (Input.pressed('shoot') || Input.pressed('pass') || Input.pressed('start') || Input.pressed('lob'))) return this.endReplay();
    r.real += dt;
    const slow = r.t > r.slowA && r.t < r.slowB; r.t += dt * (slow ? 0.35 : 1);
    while (r.i < r.frames.length - 1 && r.frames[r.i + 1].t0 <= r.t) r.i++;
    const f = r.frames[r.i];
    f.p.forEach((v, k) => { const q = this.all[k]; if (!q) return; const sp = q.spr; sp.anims.stop();
      sp.setPosition(v[0], v[1]).setFrame(v[2]).setVisible(v[3]).setDepth(v[4]).setOrigin(v[5], v[6]).setFlipX(v[7]).setRotation(v[8] || 0).setScale(v[9] ?? 1, v[10] ?? 1); });
    this.ballSpr.setPosition(f.b[0], f.b[1]).setFrame(f.b[2]).setVisible(f.b[3]).setDepth(f.b[4]).setScale(f.b[5]);
    this.ballSh.setPosition(f.s[0], f.s[1]).setAlpha(f.s[2]).setDepth(f.s[3]).setScale(f.s[4]);
    if (f.r && this.ref) { const sp = this.ref.spr; sp.anims.stop(); sp.setPosition(f.r[0], f.r[1]).setFrame(f.r[2]).setVisible(f.r[3]).setDepth(f.r[4]).setFlipX(f.r[5]); this.ref.anim = ''; }
    // TV zoom: in on the ball during the slow motion, back out after
    const zb = this.baseZoom(), zt = !r.noZoom && r.t > r.slowA - 0.1 && r.t < r.slowB + 0.15 ? zb * 1.5 : zb;   // camera-pov: 1.5x the picked distance
    r.z += (zt - r.z) * Math.min(1, dt * 5);
    const k = (r.z - zb) / (0.5 * zb), cam = this.cameras.main;
    cam.setZoom(r.z);
    if (r.label === 'BUG CLIP' && r.focus >= 0 && f.p[r.focus] && f.p[r.focus][3]) {        // v0.8.7: a clip about a player follows HIM, not the ball
      const v = f.p[r.focus], tx = v[0], ty = v[1] - 70; r.fx = r.fx == null ? tx : r.fx + (tx - r.fx) * Math.min(1, dt * 6); r.fy = r.fy == null ? ty : r.fy + (ty - r.fy) * Math.min(1, dt * 6);
      cam.centerOn(r.fx, r.fy);
    } else cam.centerOn(f.cam[0] + (f.b[0] - f.cam[0]) * k * 0.8, f.cam[1] + (f.b[1] - f.cam[1]) * k * 0.8);
    this.fixUi(r.z);
    if (r.label === 'BUG CLIP') {                                                 // v0.8.7: circle the player it's about, flag the moment
      if (!this.bwG || !this.bwG.scene) this.bwG = this.add.graphics().setDepth(9.4e6);
      const g = this.bwG.clear().setVisible(true), at = r.mark >= 0 && Math.abs(r.i - r.mark) < 20, v = r.focus >= 0 && f.p[r.focus];
      const px = v ? v[0] : f.b[0], py = v ? v[1] - 50 : f.b[1];
      g.lineStyle(3, at ? 0xff2878 : 0xffde1e, 0.95).strokeEllipse(px, v ? v[1] - 4 : py + 10, 70, 30);
      g.fillStyle(at ? 0xff2878 : 0xffde1e, 1).fillTriangle(px - 9, py - 70, px + 9, py - 70, px, py - 56);
      this.replayTxt.setText(at ? '◆ HERE' : (Math.floor(r.real * 2) % 2 ? '● ' : '  ') + 'BUG WATCH' + (slow ? ' · SLOW' : ''));
    } else this.replayTxt.setText((Math.floor(r.real * 2) % 2 ? '● ' : '  ') + (slow ? 'REPLAY · SLOW-MO' : 'REPLAY'));
    if (r.i >= r.frames.length - 1) this.endReplay();
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
    const menu = r.label === 'LAST GOAL' || r.label === 'HIGHLIGHT' || r.label === 'BUG CLIP';   // v0.8.2: watched from the pause menu / full time (v0.8.7: + BUG WATCH)
    if (r.kits) for (const q of this.all) if (q.spr.texture.key !== q.kit) q.spr.setTexture(q.kit);
    if (this.bwG && this.bwG.scene) this.bwG.clear().setVisible(false);
    this.cameras.main.setZoom(this.baseZoom()); this.fixUi(this.baseZoom()); if (!menu) this.lastReplayEnd = this.recN || 0;   // v0.8.1: skipping mid-zoom left the camera (and HUD) zoomed for good
    for (const q of this.all) q.anim = '';                                        // let every sprite pick its animation up again
    this.wipe();
    this.letterbox.setVisible(false); this.replayTxt.setVisible(false); this.replayCap.setVisible(false);
    for (const o of [this.cursor, this.power, this.ring, this.radar]) if (o) o.setVisible(true);
    if (!menu) this.rec = [];                                                     // (the match timeline carries on after a pause-menu replay)
    if (r.after) r.after();
  },
  playHighlights(done) {                                                           // every goal of the match, in order
    const H = this.highlights || []; if (!H.length) { done && done(); return; }
    const go = i => {
      if (i >= H.length) { done && done(); return; }
      this.startReplay('HIGHLIGHT', () => go(i + 1), H[i].frames, { caption: `HIGHLIGHTS ${i + 1}/${H.length} · ${H[i].cap}`, exit: () => done && done() });
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
  bwList() { const L = this.bw ? this.bw.list : []; return [...L.filter(x => !x.old), ...L.filter(x => x.old)].slice(0, 40); },
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
    return [...L.map((x, j) => ({ k: 'i' + j, x, l: `${x.old ? 'EARLIER · ' : ''}${x.min}' ${x.title}`, tag: x.review ? BW_VERDICT[x.review.verdict] : x.isNew ? 'NEW' : '',
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
        #flow .bw .sev{display:inline-block;padding:2px 6px;margin-right:6px;font-size:8px;color:#0c0a0e;background:#ffde1e} #flow .bw .sev.bug{background:#ff2878;color:#fff} #flow .bw .sev.perf{background:#28c8e6} #flow .bw .sev.mark{background:#4cff7a}
        #flow .bw input{font:9px "Press Start 2P",monospace;padding:8px;border:3px solid #0c0a0e;background:#f4f0e4;color:#0c0a0e;width:100%;box-sizing:border-box}
        #flow .bw .menu{width:100%} #flow .bw .menu button em{font-style:normal;font-size:8px;padding:2px 5px;background:#0c0a0e;color:#ffde1e}
        #flow .bw .menu button em.BUG{color:#ff2878} #flow .bw .menu button em.FINE{color:#4cff7a} #flow .bw .menu button em.NEW{color:#28c8e6}
        #flow .bw .menu{max-height:min(52vh,420px);overflow-y:auto;padding:2px 6px 6px 2px}`;
      document.head.appendChild(st);
    }
    const L = this.bwList(), todo = L.filter(x => !x.review).length;
    if (U.page === 'one') {
      const x = U.sel, rv = x.review, saved = x.saved === 'db' ? 'SAVED · CLAUDE CAN READ IT' : x.saved === 'local' ? 'KEPT IN THIS BROWSER' : x.ready ? 'SAVING…' : 'STILL RECORDING…';
      el.innerHTML = `<h2>BUG WATCH</h2><div class="bw"><div class="card">
        <p><span class="sev ${x.sev}">${x.sev === 'bug' ? 'LOOKS LIKE A BUG' : x.sev === 'mark' ? 'YOUR MARK' : x.sev === 'perf' ? 'SPEED' : 'LOOKS ODD'}</span>${x.title}</p>
        <p>${x.min}' · ${['1ST HALF', '2ND HALF', 'EXTRA TIME 1', 'EXTRA TIME 2'][(x.half || 1) - 1]} · ${x.home} ${x.score} ${x.away}${x.mode === 'demo' ? ' · THE DEMO' : x.mode === 'watch' ? ' · WATCH MODE' : ''}</p>
        <p>WHAT TRIPPED: ${x.why}</p><p class="n">${String(x.msg).replace(/[<>&]/g, '')}</p>
        <p>${rv ? `YOU SAID: ${BW_VERDICT[rv.verdict]}${rv.note ? ' · ' + rv.note.replace(/[<>&]/g, '') : ''} · ` : ''}${saved}</p>
        <input id="bwnote" maxlength="200" placeholder="NOTE (OPTIONAL) - WHAT LOOKS WRONG?" value="${rv && rv.note ? rv.note.replace(/["<>&]/g, '') : ''}">
      </div><div class="menu">${items.map((it, j) => `<button type="button" data-j="${j}" class="${j === U.i ? 'on' : ''}">${it.l}<kbd>${it.key || ''}</kbd></button>`).join('')}</div></div>
      <small>WATCH IT, THEN MARK IT · &#8593;&#8595; PICK · ENTER: OK · ESC: BACK</small>`;
      const inp = el.querySelector('#bwnote'); if (inp) inp.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter' || e.key === 'Escape') inp.blur(); });
    } else {
      el.innerHTML = `<h2>BUG WATCH</h2><div class="bw"><div class="card"><p>THE GAME WATCHES ITS OWN FOOTAGE WHILE IT PLAYS. WHEN SOMETHING BREAKS A RULE (STUCK BALL, A GOAL NOT GIVEN, A PLAYER JUMPING...) IT KEEPS THE CLIP.</p>
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
      this.startReplay('BUG CLIP', back, frames, { caption: `BUG WATCH · ${x.min}' ${x.title}`, exit: back, kits: x.kits, focus: x.who, noZoom: true, mark: mk, slowPre: 1.2, slow: 1.8 });
      if (!this.replay) back();
    });
    void U;
  },
  bwLoadKits(kits, done) {                                 // a clip from another match: load those kits first
    const need = [...new Set(kits || [])].filter(k => k && MAN.kits[k] && !this.textures.exists(k));
    if (!need.length) return done();
    for (const k of need) this.load.atlas(k, SRC(`sprites/${k}.webp`, k), `assets/sprites/${k}.json`);
    this.load.once('complete', done); this.load.start();
  },
});
