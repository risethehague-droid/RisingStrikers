'use strict';
// HC2 Football · teamai.js: team AI: roles, shape, pressing, marking, support runs, the computer carrier, Classic AI
// (split out of game.js in v0.9.5 - load order and lanes: src/README.md)

let AI_MODE = (() => { try { return localStorage.getItem('hc2-ai') || 'new'; } catch (e) { return 'new'; } })();   // 'new' (v0.8.1) or 'classic' (v0.7.6)
function setAiMode(v) { AI_MODE = v; try { localStorage.setItem('hc2-ai', v); } catch (e) {} }
// v0.8.1 team AI numbers (see ai(): SBSP lines from helios' normal-formation, gfootball role switching / containing)
const AI = { ROLE_DT: 0.4, RATIO: 0.8, PAD: 0.5, HOLD: 0.6, GOALSIDE: 0.95, COVER_R: 20, MARKERS: 3, MARK_GAP: 1.5,
  CONTAIN: 2.0, MIRROR: 7, REACH: 1.5, COMMIT: 1.3, COMMIT_VS_YOU: 0.8, SEP: 6, ARRIVE: 2.6, POSS_RATE: 2.5,
  LINES: [ { def: -24, att: -15, ax: 0.7, ay: 0.22, behind: true, min: -45, max: 8 },      // back four   (v0.8.2: with the ball the team stretches
           { def: -10, att: 6, ax: 0.66, ay: 0.28, behind: false, min: -38, max: 38 },     // midfield four  to ~40 m deep, like real teams;
           { def: 4, att: 27, ax: 0.55, ay: 0.28, behind: false, min: -12, max: 46 } ],    // two strikers   without it ~28 m compact)
  HOME_Y_DEF: [0, -18, -6, 6, 18, -19, -6, 6, 19, -4, 5],                                // across the pitch (centre = 0): narrow without the ball
  HOME_Y_ATT: [0, -27, -9, 9, 27, -26, -8, 8, 26, -7, 7],                                // wide with it
  OPEN: 5, APART: 3,
  // smarter-ai stage 2 (the co-designer: "less clunky"; Sensible Soccer's lesson: commit to a run, never dither). A man keeps
  // his job and his target until another is CLEARLY better: the cover's and the support man's lead (s / m), the marker's
  // pull to the man he had, the runner's lead (m), how long the offside read holds (s); every target is eased (TGT_T s)
  STICK_COVER: 0.8, STICK_SUP: 4, STICK_SPOT: 1.0, STICK_MARK: 3, STICK_RUN: 6, OFF_HOLD_T: [6, 9], TGT_T: 0.3,
  SCREEN: 7.5, LOB_READ: 0.6 };                                                    // (LOB_READ: how much the man on the receiver / on the passer counts against a lob)                                                                    // everyone but the presser and the cover screens this far off the ball                                                                  // ...and nobody stands on top of an opponent (3 m)                                                                             // with the ball: step away from markers inside 5 m (find space)
// ------------------------------------------------------------------ players
// t-012 WING PLAY (Luca 24 Oct 06:22, "VERY important": "make the attacking ai look for more wing plays where they play
// lobs and try to get arial shot i think the game would feel more dynamic and inclusive of the whole arsenal of special
// moves"). Measured first (tools/soak.js, 12 matches of 2 x 3 min): 0.4 open-play crosses and 0.7 aerial shots a match -
// a wide carrier always drifted inside, nobody ran into the box, and the only lofted balls went to a team-mate's feet.
// Now a wide man keeps his lane and goes down the flank, his full-back overlaps, team-mates run near post / far post /
// the spot / the edge of the box (aiWingRuns), and from wide in the final third he crosses at a runner (crossLook):
// whipped to the near post or the spot, floated to the far post, laid back to the edge - never into the keeper's reach.
// Spots are in the team's frame (aiFrame: metres from the centre line, the goal line at 52.5) and metres across from the
// centre towards the ball's side (+) or away from it (-).
const WING = { WIDE: 11, RUNS: { near: [45.5, 3.5], far: [45, -6], spot: [41.5, -1], edge: [35.5, -2.5] }, BACK: 8,
  GK_REACH: 5.5, SIX: 46.8 };
const FORMATION = [ // 4-4-2 for a team attacking towards x = 105 (metres)
  [3, 34], [17, 10], [15, 26], [15, 42], [17, 58], [33, 12], [31, 28], [31, 40], [33, 56], [46, 29], [46, 40]];

// ---------------------------------------------------------------- Match methods: teamai
hc2Mix(Match, {

  // ---------- v0.8.1 TEAM AI, rebuilt on established football games (Luca: "the defence clutters - model it on other
  // games, check their code"). What each part is taken from:
  //  * possession is decided per team and does NOT flip while your own pass is travelling (Buckland's Simple Soccer);
  //    the shape blends from defending to attacking over ~0.4 s instead of jumping
  //  * off the ball everyone holds a ZONE: his formation spot + a share of where the ball is, per line, defenders
  //    always behind the ball, forwards onside (RoboCup SBSP as coded in UvA Trilearn / helios - same 105 x 68 m pitch)
  //  * ONE presser (goal-side, quickest to the ball, kept unless someone is clearly quicker: YSoccer + Google Research
  //    Football's 0.8 ratio / 0.5 s pad), ONE cover behind him, up to 3 markers on the most dangerous runners
  //    (defenders mark fully, midfielders partly, forwards never - gfootball), the rest stay in their zones and keep
  //    6 m apart (Buckland's separation)
  //  * the presser JOCKEYS: 2 m goal-side of the dribbler, mirrors him, and only commits when he's in front of him
  //    (gfootball GetDefendPosition / FIFA 12 "contain")
  //  * roles are re-thought every 0.4 s (gfootball), not every frame; tiny moves inside a dead zone are skipped (helios)
  aiFrame(team, x) { return (team.side > 0 ? x : PITCH_L - x) - 52.5; },          // metres from the centre line, + = towards the goal it attacks
  aiWorld(team, X) { return team.side > 0 ? X + 52.5 : PITCH_L - (X + 52.5); },
  aiTime(p, pt) { return len(pt.x - p.x, pt.y - p.y) / p.top(true, false); },
  aiFree(p) { return !p.keeper && !p.sentOff && p.stun <= 0 && (!p.busy() || p.state === 'tackle'); },
  aiRoles(team) {
    const b = this.ball, owner = b.owner, gx = team.ownGoalX, they = owner && owner.team !== team;
    const human = !this.demo ? this.humanOf(team) : null;                     // (t-043: either side's human)
    const cand = team.players.filter(p => this.aiFree(p));
    const spot = p => owner ? owner : this.intercept(p, p.top(true, false));
    const prevCover = team.cover, prevMarks = team.marks;                          // (smarter-ai: kept unless another is clearly better)
    team.cover = null; team.marks = new Map();
    const loose = !owner && !(b.target && !b.target.sentOff);                    // nobody's: BOTH sides send one man for it
    if (team.inPoss && !loose) { team.presser = null; return; }
    // goal-side players only, when they have it (YSoccer: never press from behind)
    const ballG = len(b.x - gx, b.y - 34);
    let pool = cand; if (they) {                                                 // (the man already on him keeps it while he's level or goal-side)
      const gs = cand.filter(p => len(p.x - gx, p.y - 34) < (p === team.presser ? 1.03 : AI.GOALSIDE) * ballG); if (gs.length) pool = gs; }
    const hp = this.fwdPressOn(team, owner), fb = p => hp && p.role === 'CF' && len(p.x - b.x, p.y - b.y) < FWD.PRESS_R ? FWD.PRESS_BIAS : 0;   // (role-ai step 5: the first line presses their back men)
    const T = new Map(pool.map(p => [p, this.aiTime(p, spot(p)) - fb(p)])); pool = pool.slice().sort((u, v) => T.get(u) - T.get(v));
    let best = pool[0] || null; const cur = team.presser;
    if (cur && best && cur !== best && pool.includes(cur) && ((team.presserHeld || 0) < AI.HOLD || T.get(best) + AI.PAD >= AI.RATIO * (T.get(cur) + AI.PAD))) best = cur;
    if (best !== cur) team.presserHeld = 0;
    // you're the one going to the ball: the computer doesn't double up on you
    if (human && best && !human.sentOff && this.aiTime(human, spot(human)) <= T.get(best) + 0.6) { team.cover = best; team.presser = human; }
    else { team.presser = best; if (they) { const ok = p => p && p !== best && p !== human && pool.includes(p) && len(p.x - b.x, p.y - b.y) < AI.COVER_R;
      team.cover = pool.find(ok) || null; if (ok(prevCover) && team.cover && T.get(prevCover) < T.get(team.cover) + AI.STICK_COVER) team.cover = prevCover; } }
    if (!they) team.cover = null;
    if (team.inPoss) return;                                                     // a loose ball we had: one man goes for it, the rest keep shape
    // markers: the most dangerous runners (closest to a point between our goal and the ball), goal-side of each
    const aim = { x: 0.8 * gx + 0.2 * b.x, y: 0.8 * 34 + 0.2 * b.y };
    const wide = owner && they && Math.abs(owner.y - 34) > WING.WIDE && Math.abs(owner.x - gx) < 35;   // t-012: their man out wide near our box - the box
    const ra = team.opp.runAfter, runner = ra && this.time.now - ra.t < WALL.TRACK * 1000 && !ra.p.sentOff && ra.p !== owner && ra.p.vx * team.opp.side > WALL.RUN_V ? ra.p : null;   // (smarter-ai: the man who just passed and went - tracked first)
    const threats = team.opp.players.filter(o => !o.keeper && !o.sentOff && o !== owner && (o === runner || len(o.x - gx, o.y - 34) < 40))   // gets one more marker (their runs
      .sort((u, v) => (u === runner ? -1e3 : 0) + len(u.x - aim.x, u.y - aim.y) - (v === runner ? -1e3 : 0) - len(v.x - aim.x, v.y - aim.y)).slice(0, AI.MARKERS + (wide ? 1 : 0));   // came in four-up against three)
    const free = team.players.filter(p => this.aiFree(p) && lineOf(p) <= 1 && p !== team.presser && p !== team.cover && p !== human);
    for (const o of threats) {
      let pick = null, bq = 1e9;
      const oX = this.aiFrame(team, o.x), lineX = team.line ?? this.lineTarget(team).x;
      for (const p of free) { if (team.marks.has(p)) continue; const d = len(p.x - o.x, p.y - o.y); if (d > 18) continue;
        if (isBack(p) && oX > lineX + LINE.HAND) continue;                           // role-ai step 2: too far out of the line - the midfield takes him (hand-off)
        const q = d - (len(p.x - gx, p.y - 34) < len(o.x - gx, o.y - 34) ? 4 : 0) - (lineOf(p) === 0 ? 3 : 0) - (prevMarks && prevMarks.get(p) === o ? AI.STICK_MARK : 0); if (q < bq) { bq = q; pick = p; } }
      if (pick) team.marks.set(pick, o);
    }
  },
  aiZone(p, team) {                                                              // SBSP: formation spot + a share of the (smoothed) ball, per line
    const L = AI.LINES[lineOf(p)], fx = team.fx, fy = team.fy;
    const S = this.brainStyle(team), wd = 1 + 0.15 * S.width * team.poss;        // (smarter-ai: the style's width with the ball)
    const SH = shapeOf(team), yD = SH.yDef[p.i], yA = SH.yAtt[p.i];                // (role-ai step 4: the team's formation, roles.js SHAPES)
    const hy = (yD + (yA - yD) * team.poss) * wd;
    let X = L.def + (L.att - L.def) * team.poss + L.ax * fx + this.brainLine(team), Y = hy + L.ay * fy * (1 - 0.4 * team.poss);   // (smarter-ai: the line by style and match state)
    X += SH.dxDef[p.i] + (SH.dxAtt[p.i] - SH.dxDef[p.i]) * team.poss;            // (role-ai step 4: deeper / higher than his line's band, by role)
    if (team !== this.home && this.read && !team.inPoss) Y += this.readFlank() * READ.SHIFT * (lineOf(p) <= 1 ? 1 : 0.5);   // (Rise Warrior has read your flank: the block shifts over)
    if (L.behind) X = Math.min(X, fx - 1.5);
    X = clamp(X, L.min, L.max);
    if (isBack(p)) { const B = this.lineSpot(p, team); X = B.x; Y += B.dy; }       // role-ai step 2: on the team's one line (aiBackLine)
    else if (p.role === 'CDM') { const A = this.anchorSpot(p, team, X, Y); if (A.hole) return A.hole; X = A.x; Y = A.y; }   // role-ai step 4: the anchor (roles.js MID)
    else if (isWide(p) && !team.inPoss) { const T = this.trackSpot(p, team, X, Y); X = T.x; Y = T.y; }   // role-ai step 4: wingers track their full-back
    if (lineOf(p) === 2 && team.offX != null) X = Math.min(X, Math.max(team.offX, fx) - 0.6);   // strikers stay onside
    return { x: clamp(this.aiWorld(team, X), 2, PITCH_L - 2), y: clamp(34 + Y, 3, PITCH_W - 3) };
  },
  // role-ai step 5 THE FORWARDS (roles.js FWD). The first line presses: their man on the ball deep in their half, not their
  // keeper with it in his hands (everyone backs off that), not a ball we've already been played past
  fwdPressOn(team, owner) {
    return !!(owner && owner.team !== team && !(owner.keeper && owner.hands) && this.aiFrame(team, owner.x) > FWD.PRESS_X);
  },
  // the passes the man on the ball has BACK or ACROSS (their keeper, the other centre-back, the full-back level with him),
  // nearest first: the ones the press cuts off, so he has to play it forward into our midfield or go long
  fwdBackOpts(team, owner) {
    const ox = this.aiFrame(team, owner.x), out = [];
    for (const o of team.opp.players) { if (o === owner || o.sentOff) continue; const d = len(o.x - owner.x, o.y - owner.y);
      if (d < 4 || d > FWD.SHADOW_R || this.aiFrame(team, o.x) < ox - 4) continue; out.push({ o, x: o.x, y: o.y, d }); }
    return out.sort((u, v) => u.d - v.d);
  },
  // the striker who isn't pressing stands in the lane of the next easiest pass back / across (one his team-mate's curved
  // run doesn't already cut), a share of the way from that man towards the ball - near his zone, never a chase across
  fwdScreen(p, team, owner, zone) {
    const all = this.fwdBackOpts(team, owner), pr = team.presser, cut = pr && pr.role === 'CF' ? all[0] : null;
    let best = null, bd = 1e9; for (const r of all) { if (cut && r.o === cut.o) continue;
      const sx = r.x + (owner.x - r.x) * FWD.SHADOW, sy = r.y + (owner.y - r.y) * FWD.SHADOW, d = len(sx - zone.x, sy - zone.y);
      if (d < bd && d < FWD.SHADOW_MAX) { bd = d; best = { x: sx, y: sy }; } }
    return best;
  },
  // with the ball (not the man running in behind): the TARGET MAN comes short in front of their line while we build it
  // from the back - a ball into his feet / chest; the POACHER heads for the box once we're in the final third
  fwdSpot(p, team, owner) {
    const k = cfKind(p); if (!k || (team.mood && team.mood.chase)) return null;
    const ox = this.aiFrame(team, owner.x), ln = (team.offX ?? 99) - 0.6;
    if (k === 'target' && ox < FWD.SHORT_X) { const X = Math.min(ln - FWD.SHORT_GAP, ox + FWD.SHORT_REACH);
      return { x: this.aiWorld(team, X), y: clamp(34 + (owner.y - 34) * 0.35 + homeY(p, true) * 0.4, 8, 60) }; }
    if (k === 'poacher' && ox > FWD.BOX_X) return { x: this.aiWorld(team, Math.min(FWD.BOX_DEEP, ln)), y: clamp(34 - (owner.y - 34) * 0.12, 30, 38) };
    return null;
  },
  // role-ai step 4 THE ANCHOR (roles.js MID): a back man out of the line (pressing the ball, or pulled out) = the anchor
  // drops into his spot; otherwise he screens a set gap in front of the line, on the ball's side; with the ball he holds
  // back (rest defence). X, Y in the team frame; `hole` is a world spot when he's filling in.
  anchorSpot(p, team, X, Y) {
    const live = team.line != null && team.lineN === (this.aiN || 0), line = live ? team.line : this.lineTarget(team).x, fx = team.fx ?? 0, fy = team.fy ?? 0;
    if (!team.inPoss) {
      const out = team.players.find(q => isBack(q) && !q.sentOff && (q === team.presser || (this.aiFree(q) && this.aiFrame(team, q.x) > line + MID.HOLE)));
      const gone = !out && team.players.find(q => isBack(q) && q.sentOff);
      const h = out || gone;
      if (h && h !== this.humanOf(team)) { const B = this.lineSpot(h, team), y = clamp(34 + shapeOf(team).yDef[h.i] + AI.LINES[0].ay * fy + B.dy, 3, PITCH_W - 3);
        return { hole: { x: clamp(this.aiWorld(team, B.x + 0.5), 2, PITCH_L - 2), y } }; }
      X = clamp(Math.min(X, fx - 2), line + MID.ANCHOR_GAP * 0.6, line + MID.ANCHOR_GAP_MAX); if (fx - line > MID.ANCHOR_GAP + 6) X = Math.max(X, line + MID.ANCHOR_GAP);
      Y = clamp(Y + (fy * MID.ANCHOR_Y - fy * AI.LINES[1].ay), -MID.ANCHOR_YMAX, MID.ANCHOR_YMAX);
    } else { X = Math.min(X, fx - MID.ANCHOR_REST); Y = clamp(Y, -MID.ANCHOR_YMAX, MID.ANCHOR_YMAX); }
    return { x: X, y: Y };
  },
  // role-ai step 4 WINGERS TRACK BACK (roles.js MID): their full-back on his flank, level with him or past him, is his man
  // - he follows him back goal-side, down to just in front of our line (a 4-3-3's wide forward only to just inside our half)
  trackSpot(p, team, X, Y) {
    const side = Math.sign(shapeOf(team).yDef[p.i]) || 1, live = team.line != null && team.lineN === (this.aiN || 0), line = live ? team.line : this.lineTarget(team).x;
    let o = null, oX = 99;
    for (const q of team.opp.players) { if (q.sentOff || q.role !== 'FB' || Math.sign(q.y - 34) !== side || Math.abs(q.y - 34) < 8) continue;
      const qx = this.aiFrame(team, q.x); if (qx < oX) { oX = qx; o = q; } }
    if (!o || oX > X + MID.TRACK_X || o === this.ball.owner) return { x: X, y: Y };
    const floor = p.role === 'WF' ? MID.TRACK_WF : line + MID.TRACK_DEEP;
    const tx = Math.max(Math.min(X, oX - MID.TRACK_GAP), floor);
    return { x: tx, y: Y + ((o.y - 34) - Y) * MID.TRACK_Y };
  },
  // role-ai step 2 (docs/role-ai-plan.md 6.2, the numbers in roles.js LINE): where the line WANTS to be right now, before
  // it's eased. The base is the old per-man formula for the back row (AI.LINES[0] + the style's brainLine), so the team's
  // average height is what it was; what's new is that the four share it, and the drop / step up / floor / rest defence.
  lineTarget(team) {
    const L = AI.LINES[0], b = this.ball, owner = b.owner, fx = team.fx ?? this.aiFrame(team, b.x), poss = team.poss ?? 0;
    let X = L.def + (L.att - L.def) * poss + L.ax * fx + this.brainLine(team), why = 'hold';
    const they = owner && owner.team !== team, bvx = (team.side > 0 ? b.vx : -b.vx);   // + = the ball going away from our goal
    if (team.inPoss) { if (fx > 0) X = Math.min(X, fx - (team.lineUp ? LINE.REST_UP : LINE.REST)); why = 'rest'; }   // rest defence: in their half, a set distance behind the ball
    else {
      const ahead = fx - X;
      if (they && !owner.keeper && ahead > LINE.UNCOV_AHEAD[0] && ahead < LINE.UNCOV_AHEAD[1]) {   // uncovered (their man has time) = drop
        const oX = this.aiFrame(team, owner.x), cov = team.players.some(q => !q.keeper && !q.sentOff && this.aiFrame(team, q.x) < oX + 0.5 && len(q.x - owner.x, q.y - owner.y) < LINE.UNCOV_R);
        if (!cov) { X -= LINE.UNCOV; why = 'drop'; }
      }
      if ((they ? bvx > LINE.BACK_V && owner.speed > 2 : !owner && b.last !== team.opp && bvx > LINE.BACK_V)) { X += LINE.STEP; why = 'up'; }   // played back / cleared: step up together
      if (fx > LINE.BOX + 2) X = Math.max(X, LINE.BOX);                          // the edge of the box, while the ball is in front of it
      if (!(owner && owner.team === team) && -bvx > LINE.OVER_V) {                 // their ball forward, on its way: the line goes back to where it's going
        const to = this.aiFrame(team, b.x + b.vx * LINE.OVER_T) - LINE.OVER_GAP; if (to < X) { X = to; why = 'over'; } }
      if (!offsideOn()) { const deep = team.opp.players.filter(o => !o.sentOff && !o.keeper).reduce((a, o) => Math.min(a, this.aiFrame(team, o.x)), 99); X = Math.min(X, deep - 1); }   // (no offside: nobody left in behind)
    }
    X = Math.min(X, fx - 1.5);                                                     // always behind the ball (as AI.LINES[0].behind)
    return { x: clamp(X, L.min, L.max), why };
  },
  // the line, eased: it drops at a jog and steps up a little quicker, together; if the ball is already level with it or
  // past it, everyone goes at once. Also who's "up": a full-back far in front of it (on the overlap, or caught upfield
  // when it's lost) - the other three slide across to his side until he's back (lineSpot)
  aiBackLine(team, dt) {
    const T = this.lineTarget(team), fx = team.fx ?? 0, n = this.aiN || 0;
    if (team.line == null || team.lineN !== n - 1 || Math.abs(T.x - team.line) > 30) team.line = T.x;   // (a restart or a set piece paused the AI: start from where it wants to be)
    else { const v = T.x < team.line ? (T.why === 'over' || T.x < team.line - LINE.FAR || this.aiFrame(team, this.ball.x) < team.line + 4 || team.poss > 0.5 ? LINE.FAST_V : LINE.DROP_V) : LINE.UP_V;
      team.line += clamp(T.x - team.line, -v * dt, v * dt); }
    team.line = Math.min(team.line, fx - 1.5); team.lineWhy = T.why; team.lineFar = T.x < team.line - LINE.FAR; team.lineN = n;
    const backs = team.players.filter(q => isBack(q) && !q.sentOff);
    team.lineUp = 0;
    for (const q of backs) if (q.role === 'FB' && (this.aiFrame(team, q.x) > team.line + LINE.UP)) team.lineUp = Math.sign(AI.HOME_Y_DEF[q.i]);
    if (backs.length < 4) { const gone = team.players.find(q => q.role === 'FB' && q.sentOff); if (gone) team.lineUp = Math.sign(AI.HOME_Y_DEF[gone.i]); }   // (a full-back sent off: the three cover his side too)
  },
  // a back man's spot on the line: x = the line (the cover CB a step deeper), dy = the slide across when a full-back is up
  lineSpot(p, team) {
    const live = team.line != null && team.lineN === (this.aiN || 0);              // (outside the AI's frame - the Lab placing men - the target, fresh)
    let X = live ? team.line : this.lineTarget(team).x, dy = 0;
    const side = Math.sign(AI.HOME_Y_DEF[p.i]), fy = team.fy ?? 0;
    if (p.role === 'CB' && !team.inPoss && fy * side < -4) X -= LINE.COVER_DEEP; // the CB away from the ball covers behind his partner
    const up = live ? team.lineUp : 0;
    if (up && !(p.role === 'FB' && side === up)) dy = up * LINE.SLIDE;           // rest defence: slide over to the empty flank
    return { x: X, dy };
  },
  aiPress(p, team, carrier, dt) {                                                // close him down, then jockey
    const gx = team.ownGoalX, ux = gx - carrier.x, uy = 34 - carrier.y, ul = len(ux, uy) || 1, d = len(carrier.x - p.x, carrier.y - p.y);
    let tx, ty, v;
    if (d > AI.MIRROR) { tx = carrier.x + ux / ul * Math.min(4, d * 0.25) + carrier.vx * 0.3; ty = carrier.y + uy / ul * Math.min(4, d * 0.25) + carrier.vy * 0.3;
      if (p.role === 'CF' && this.fwdPressOn(team, carrier)) { const r = this.fwdBackOpts(team, carrier)[0];   // role-ai step 5: the striker CURVES his run - in on the
        if (r) { const rx = r.x - carrier.x, ry = r.y - carrier.y, rl = len(rx, ry) || 1, k = Math.min(3, d * 0.2); tx += rx / rl * k; ty += ry / rl * k; } }   // side of the pass back, so it's cut off (the cover shadow)
      p.sprinting = d > 10 && p.stamina > 0.35; v = p.top(p.sprinting, false); }
    else {
      // v0.8.2 not goal-side yet (arriving from the side / behind): a recovery run ROUND him onto the goal side, not through him
      const gs = ((p.x - carrier.x) * ux + (p.y - carrier.y) * uy) / ul; let ox = 0, oy = 0;
      if (gs < 1) { const px = -uy / ul, py = ux / ul, sd = Math.sign((p.x - carrier.x) * px + (p.y - carrier.y) * py) || 1, k = clamp((1 - gs) / 2, 0, 1) * 1.6; ox = px * sd * k; oy = py * sd * k; }
      // v0.8.2: he slows down -> step in; he stops / shields it -> go to the BALL (just goal-side of it), round him if need be
      // (it stood off 2 m forever: a dribbler standing still, or shielding it with his back to you, was never tackled)
      const bl = this.ball, slow = carrier.speed < 1.5, rd = team !== this.home && this.read ? this.read : null;
      const cont = AI.CONTAIN * clamp(carrier.speed / 4, 0.45, 1) + (rd && rd.burstN >= READ.BURST_MIN && d < rd.burstD + 1.5 ? 0.5 : 0);   // (Rise Warrior: you burst from about here - a little more room)
      tx = carrier.x + ux / ul * cont + carrier.vx * 0.15 + ox; ty = carrier.y + uy / ul * cont + carrier.vy * 0.15 + oy;
      if (rd && carrier === this.human) { const cs = this.readCut(); if (cs) ty += cs * READ.SHOW; }   // (Rise Warrior: he stands on the side you like to go past him - showing you the other way)
      if (slow) {                                                               // v0.8.3: the ball's OPEN side (beyond it from him) -
        const bx = bl.x - carrier.x, by = bl.y - carrier.y, bd = len(bx, by) || 1, ubx = bx / bd, uby = by / bd;   // shielding it with his
        if ((p.x - carrier.x) * ubx + (p.y - carrier.y) * uby < 0.3) {          // back to you parked you on his flank for good
          const px = -uby, py = ubx, sd = Math.sign((p.x - carrier.x) * px + (p.y - carrier.y) * py) || 1;
          tx = carrier.x + px * sd * 1.3 + ubx * 0.5; ty = carrier.y + py * sd * 1.3 + uby * 0.5;   // round him first
        } else { tx = bl.x + ubx * 0.6; ty = bl.y + uby * 0.6; }
      }
      v = Math.min(p.top(false, false) * 1.05, len(carrier.vx, carrier.vy) + 1.2 + d * 0.5); p.look(carrier.x - p.x, carrier.y - p.y); }
    const PK = (this.hasHuman(team) && !this.demo ? 1 : Math.min(1.45, 1 + (paceK().pressK - 1) * this.dkY(team).cmt)) * (1 + 0.05 * this.brainStyle(team).press)
      * (team !== this.home && this.readHot(carrier) ? 1.15 : 1);                // (smarter-ai: the style's pressing; Rise Warrior closes you down sooner on your shooting spots)   // (arcade-2: ARCADE the computer's side
    p.moveTo(tx, ty, v * this.dk(team).press * PK, dt);                        // closes down harder, more at the top levels: the dash mustn't make dribbling past it easier)
                                                                                   // (v0.9.2: how hard he closes down, by level)
    p.watch = d < AI.MIRROR ? carrier : null;                                    // close: jockey him, facing him
    if (d < AI.MIRROR && p.speed < 2.5) p.look(carrier.x - p.x, carrier.y - p.y);
    // commit only from in front (or on a heavy touch), not every time he's near
    const b = this.ball, cv = carrier.speed > 0.6 ? { x: carrier.vx / carrier.speed, y: carrier.vy / carrier.speed } : dirVec(carrier.face);
    const front = (cv.x * (p.x - carrier.x) + cv.y * (p.y - carrier.y)) / (d || 1), loose = len(b.x - carrier.x, b.y - carrier.y) > 1.1;
    const vsHuman = this.isHuman(carrier) && !this.demo;
    p.standoff = carrier.speed < 1.5 && len(b.x - p.x, b.y - p.y) < 2.5 ? (p.standoff || 0) + dt : 0;   // (a stand-off that drags on: he pokes at it anyway)
    if (p.cool <= 0 && len(b.x - p.x, b.y - p.y) < AI.REACH && (front > 0.25 || loose || (carrier.speed < 1.5 && front > -0.3) || p.standoff > 3) && Math.random() < dt * (vsHuman ? AI.COMMIT_VS_YOU * this.dkY(team).cmt * paceK().cmtK : AI.COMMIT) * this.dk(team).commit) {   /* (arcade-2: ARCADE it goes in on you more - by level, via cmt) */ p.standoff = 0; this.challenge(p, carrier); return; }
    // v0.8.2 BEATEN (he's got past): a recovery slide from the side, or a lunge from behind when he's through - so the
    // computer gives fouls away too (it never did: no foul scenes or foul replays for its tackles)
    const beaten = front < -0.2, toOwn = len(carrier.x - gx, carrier.y - 34), db = len(b.x - p.x, b.y - p.y);
    if (p.cool <= 0 && beaten && !p.busy() && db > 1.4 && db < 3.6 && toOwn < 45 && carrier.speed > 3 && Math.random() < dt * (vsHuman ? this.dkY(team).sl : 0.6)) { this.slideTackle(p, null); return; }
    if (p.cool <= 0 && beaten && db < AI.REACH && toOwn < 30 && carrier.speed > 2.5 && Math.random() < dt * 0.28) this.challenge(p, carrier);   // (only when he's getting away)
  },
  // v0.7.6 team AI, kept as CLASSIC (start screen: AI button) so Luca can compare
  aiClassic(dt) {
    const b = this.ball;
    const owner = b.owner;
    for (const team of [this.home, this.away]) {
      const has = owner && owner.team === team;
      const chaser = (!has) ? team.players.filter(p => !p.keeper && !this.isHuman(p) && !p.sentOff)
        .sort((a, c) => len(a.x - b.x, a.y - b.y) - len(c.x - b.x, c.y - b.y))[0] : null;
      // a ball in the air to one of THEIR players: the nearest defender goes with the receiver to contest it
      const rcv = (!owner && b.target && b.target.team !== team && (b.z > 0.4 || b.vz > 1)) ? b.target : null;
      const marker = rcv ? team.players.filter(p => !p.keeper && !this.isHuman(p) && p !== chaser && !p.busy() && !p.sentOff)
        .sort((a, c) => len(a.x - rcv.x, a.y - rcv.y) - len(c.x - rcv.x, c.y - rcv.y))[0] : null;
      for (const p of team.players) {
        if (this.isHuman(p) && !this.demo) continue;
        if (p.state === 'kick' || p.state === 'catch' || p.state === 'dive' || p.state === 'slide' || p.state === 'dheader' || p.state === 'chance' || p.state === 'celebrate' || p.state === 'tackle' || p.state === 'dejected' || p.state === 'roar' || p.state === 'beaten' || p.state === 'protest' || p.state === 'hurt' || p.state === 'blasted' || p.stun > 0) continue;
        if (p.keeper) { this.keeperAI(p, dt); continue; }
        if (owner === p) { if (this.trapRunStep(p, dt)) continue; this.carrierAI(p, dt); continue; }
        if (p === marker && len(p.x - rcv.x, p.y - rcv.y) < 12) {                // stay touch-tight, goal side
          const pt = b.lob ? { x: rcv.x + rcv.vx * 0.25, y: rcv.y + rcv.vy * 0.25 } : this.intercept(rcv, rcv.top(true, false)),   // lob-mechanics: he goes with the man (he can't read the drop before the receiver does)
            gs = Math.sign(team.ownGoalX - pt.x) || 1;
          p.sprinting = true; p.moveTo(pt.x + gs * 0.6, pt.y, p.top(true, false), dt); continue;
        }
        // the intended receiver of a pass runs onto it
        if (!owner && b.target === p && b.last === team) {
          const far = len(b.x - p.x, b.y - p.y) > 8 && p.stamina > 0.3; p.sprinting = far;
          const v = p.top(far, false), pt = this.intercept(p, v, 0.12, b.lob ? 1.9 : 1.0); p.moveTo(pt.x, pt.y, v, dt); continue;   // lob-mechanics: attack the drop
        }
        if (owner && owner.keeper && owner.hands && owner.team !== team && len(p.x - owner.x, p.y - owner.y) < 14) {   // their keeper has it: back off
          const dx = p.x - owner.x, dy = p.y - owner.y, d = len(dx, dy) || 1;
          p.moveTo(owner.x + dx / d * 15, clamp(owner.y + dy / d * 15, 3, 65), JOG, dt); continue;
        }
        const chase = chaser === p && !(this.hasHuman(team) && len(this.humanOf(team).x - b.x, this.humanOf(team).y - b.y) < len(p.x - b.x, p.y - b.y) + 4) && !(owner && owner.keeper && owner.hands);
        if (chase) {
          const d = len(b.x - p.x, b.y - p.y), go = d > 4 && p.stamina > 0.35; p.sprinting = go;
          const v = p.top(go, false), pt = owner ? { x: b.x + b.vx * 0.3, y: b.y + b.vy * 0.3 } : this.intercept(p, v);
          p.moveTo(pt.x, pt.y, v, dt);
          if (owner && len(b.x - p.x, b.y - p.y) < 1.3 && Math.random() < dt * 1.4) this.tackle(p, owner, Math.random() < 0.12);
          continue;
        }
        // shape: the block follows the ball; with the ball the lines step up (forwards get in behind), without it they drop
        const role = lineOf(p);                                                  // 0 defence, 1 midfield, 2 attack (roles.js)
        const push = (has ? [4, 10, 18][role] : [-4, -3, 0][role]) * team.side;
        const tx = clamp(p.home.x + (b.x - 52.5) * 0.75 + push, 4, 101);
        const ty = clamp(p.home.y + (b.y - 34) * 0.32, 3, 65);
        const behind = len(tx - p.x, ty - p.y) > 12 && p.stamina > 0.5;          // far out of position: hurry back
        p.moveTo(tx, ty, behind ? RUN : JOG, dt);
      }
    }
  },
  ai(dt) {
    for (const p of this.all) p.watch = null;                                   // (re-set by aiPress for the man containing the dribbler)
    this.aiN = (this.aiN || 0) + 1;                                               // (role-ai step 2: the AI's frame count - aiBackLine knows a pause from a frame)
    if (AI_MODE === 'classic') return this.aiClassic(dt);
    const b = this.ball, owner = b.owner;
    this.readTick(dt);                                                            // smarter-ai step 5: Rise Warrior reads your habits (brain.js)
    // smarter-ai, the 1-2: when the ball reaches a man, who of his own side played it to him (wallRunner) - and that team's
    // runner after his pass, so the other side's markers pick him up too (defenders track the runner, not only the ball)
    if (owner && owner !== this.aiLastOwner) { const L = this.aiLastHolder; owner.gotAt = this.time.now; owner.gotFrom = L && L !== owner && L.team === owner.team ? L : null;
      if (owner.gotFrom) owner.team.runAfter = { p: owner.gotFrom, t: this.time.now }; }
    this.aiLastOwner = owner; if (owner) this.aiLastHolder = owner;
    for (const team of [this.home, this.away]) {
      team.mood = this.brainMood(team);                                          // smarter-ai step 3: the score and the clock (brain.js)
      team.drain = this.dkY(team).st * (1 + 0.25 * Math.max(0, this.brainStyle(team).press));   // (smarter-ai: a high press costs legs - styles.js had it winning 78%)                                              // v0.9.3 stamina by level (base 1)
      // possession: who has it, or whose pass is travelling; a loose ball keeps the last call (no flip-flopping)
      if (owner) team.inPoss = owner.team === team; else if (b.target && !b.target.sentOff) team.inPoss = b.target.team === team;
      team.poss = clamp((team.poss ?? (team.inPoss ? 1 : 0)) + (team.inPoss ? 1 : -1) * AI.POSS_RATE * dt, 0, 1);
      // the point the shape follows: where the ball is going, smoothed (~0.4 s)
      const fk = 1 - Math.exp(-dt / 0.4), lx = this.aiFrame(team, b.x + b.vx * 0.3), ly = clamp(b.y + b.vy * 0.3, 0, PITCH_W) - 34;
      team.fx = team.fx == null ? lx : team.fx + (lx - team.fx) * fk; team.fy = team.fy == null ? ly : team.fy + (ly - team.fy) * fk;
      { const xs = team.opp.players.filter(o => !o.sentOff).map(o => this.aiFrame(team, o.x)).sort((u, v) => v - u); team.offX = xs.length > 1 ? xs[1] : null; }   // their 2nd-last man
      this.aiBackLine(team, dt);                                                   // role-ai step 2: the back four's one line (roles.js LINE)
      team.roleT = (team.roleT ?? (team === this.home ? 0 : AI.ROLE_DT / 2)) - dt; team.presserHeld = (team.presserHeld || 0) + dt;
      if (team.roleT <= 0 || (team.presser && !this.aiFree(team.presser) && !this.isHuman(team.presser))) { team.roleT = AI.ROLE_DT * this.dk(team).role; this.aiRoles(team); }   // (v0.9.2: how quickly the team re-reads the play)
      if (owner && owner.team === team && !owner.keeper) { team.supT = (team.supT ?? 0) - dt; if (team.supT <= 0 || (team.support && !this.aiFree(team.support))) { team.supT = AI.ROLE_DT; this.aiSupport(team, owner); } }
      else { if (team.support) team.supMem = { p: team.support, pt: team.supportPt, t: this.time.now }; team.support = null; team.supportPt = null; team.supT = 0; }   // (smarter-ai: remembered a moment - a heavy touch or a one-two mustn't hand the job to someone else)
      // t-012 the runs for a wide man (kept while his cross is in the air, so the runners keep attacking it)
      if (owner && owner.team === team && !owner.keeper) { team.wingT = (team.wingT ?? 0) - dt; if (team.wingT <= 0) { team.wingT = AI.ROLE_DT; this.aiWingRuns(team, owner); } }
      else if (!this.crossLive(team)) { team.wing = null; team.wingBy = null; team.wingT = 0; }
      if (owner) b.crossBy = null;                                                 // (t-012: someone has it - the cross is over)
      const rcv = (!owner && b.target && b.target.team !== team && (b.z > 0.4 || b.vz > 1)) ? b.target : null;   // a ball in the air to one of THEIR players
      const aerial = rcv ? team.players.filter(p => this.aiFree(p) && !this.isHuman(p) && p !== team.presser)
        .sort((u, v) => len(u.x - rcv.x, u.y - rcv.y) - len(v.x - rcv.x, v.y - rcv.y))[0] : null;
      // everyone's target first (zones, cover, markers), then team-mates' zones are pushed apart
      const tgt = new Map(), fixed = [];
      for (const p of team.players) {
        if (p.keeper || p.sentOff || p === owner || p === team.presser) { if (!p.sentOff && !p.keeper) fixed.push(p); continue; }
        let t = this.aiZone(p, team);
        if (p === team.cover && owner && owner.team !== team) {                  // cover: between the ball and our goal, ~7 m behind the presser
          const gx = team.ownGoalX, ux = gx - owner.x, uy = 34 - owner.y, ul = len(ux, uy) || 1, back = Math.min(this.isHuman(owner) && !this.demo ? this.dkY(team).cov : 7, ul * 0.5);   // (v0.9.3: tighter on you at the top levels)
          t = { x: owner.x + ux / ul * back + (34 - owner.y) * 0.0, y: owner.y + uy / ul * back + (34 - owner.y) * 0.12 };
        } else if (team.marks && team.marks.get(p)) {                            // marker: goal-side of his man (defenders fully, midfield 60%)
          const o = team.marks.get(p), gx = team.ownGoalX, ux = gx - o.x, uy = 34 - o.y, ul = len(ux, uy) || 1, bx = b.x - o.x, by = b.y - o.y, bl = len(bx, by) || 1;
          const G = AI.MARK_GAP * this.dk(team).mark, m = { x: o.x + ux / ul * G + bx / bl * 0.5, y: o.y + uy / ul * G + by / bl * 0.5 }, w = lineOf(p) === 0 ? 1 : 0.6;   // (v0.9.2: marking tightness by level)
          t = { x: t.x + (m.x - t.x) * w, y: t.y + (m.y - t.y) * w };
          if (isBack(p) && team.line != null && this.aiFrame(team, t.x) > team.line + LINE.HAND) t.x = this.aiWorld(team, team.line + LINE.HAND);   // (role-ai step 2: never pulled further out of the line than that)
        } else if (p.goRun && team.inPoss && p !== owner && this.time.now - p.goRun.t < 2500) {   // smarter-ai: pass and move - after his forward ball he goes
          t = { x: p.goRun.x, y: p.goRun.y, go: true, goRun: true };                  // past the man he found (the one-two, the third man) instead of jogging back
        } else if (p === team.support && team.supportPt) {                       // v0.8.2 support: the best open spot near the ball
          t = { x: team.supportPt.x, y: team.supportPt.y };
        } else if (team.wing && team.wing.has(p)) {                               // t-012: a run for the cross (or an overlap)
          const w = team.wing.get(p); t = { x: w.x, y: w.y };
        } else if (team.inPoss && owner && owner.team === team && lineOf(p) === 2) {     // with the ball: a forward offers a run in behind
          const runT = (team.runT = (team.runT ?? 0) - dt / 2);
          if (runT <= 0) { team.runT = 1.5; const dO = q => len(q.x - owner.x, q.y - owner.y) + (cfKind(q) === 'target' ? FWD.RUN_BIAS : 0), cur = team.runner, nr = team.players.filter(q => lineOf(q) === 2 && !q.sentOff).sort((u, v) => dO(u) - dO(v))[0];
            team.runner = cur && cur !== nr && cur.team === team && !cur.sentOff && this.aiFree(cur) && dO(cur) < dO(nr) + AI.STICK_RUN ? cur : nr; }   // (smarter-ai: his run isn't cancelled for a man a step nearer)
          if (team.runner === p || (team.mood && team.mood.chase)) { const ox = this.aiFrame(team, owner.x), ln = (team.offX ?? 99) - 0.6;   // (smarter-ai: chasing late, both strikers go)
            const sh = offsideOn() && ln - ox < 28 && ln > 0 ? (team.offX ?? 99) - (team.offHold ?? OFFSIDE.HOLD) : null;   // t-024: within reach of their line he plays on the last man's shoulder,
            t = sh != null ? { x: this.aiWorld(team, sh), y: clamp(owner.y + (34 - owner.y) * 0.5, 6, 62), go: true, shoulder: true }   // as tight as he reads it (team.offHold, below), getting there at a run
              : { x: this.aiWorld(team, Math.min(ox + 18, ln)), y: clamp(owner.y + (34 - owner.y) * 0.5, 6, 62) }; }
          else { const f = this.fwdSpot(p, team, owner); if (f) t = f; }                  // role-ai step 5: the target man comes short, the poacher goes to the box (the runner: by role, FWD.RUN_BIAS)
        } else if (p.role === 'CF' && owner && owner.team !== team && p !== team.presser && this.fwdPressOn(team, owner)) {
          const f = this.fwdScreen(p, team, owner, t); if (f) t = f;                     // role-ai step 5: the other striker screens the next pass
        }
        if (team.marks && team.marks.get(p) || p === team.cover || (p === team.support && team.supportPt) || (team.wing && team.wing.has(p))) fixed.push({ x: t.x, y: t.y, fixedT: true });
        tgt.set(p, t);
      }
      const zones = [...tgt.entries()].filter(([p]) => !(team.marks && team.marks.get(p)) && p !== team.cover && !(p === team.support && team.supportPt) && !(team.wing && team.wing.has(p)));
      // v0.8.2: one man presses - the rest screen the space, they don't stand on the ball (no clutter). smarter-ai (clips 3
      // and 4, "three on the ball"): the markers near the ball screen too - real football's one presses, one covers, the
      // rest screen; only the presser and the cover go near him
      if (owner && owner.team !== team && team.presser) for (const [p, t] of tgt) {
        if (p === team.cover || !(zones.some(z => z[0] === p) || (team.marks && team.marks.get(p)))) continue;
        const dx = t.x - b.x, dy = t.y - b.y, d = len(dx, dy), R = AI.SCREEN;
        if (d < R) { const ux = d > 0.01 ? dx / d : -team.side, uy = d > 0.01 ? dy / d : 0; t.x = b.x + ux * R; t.y = clamp(b.y + uy * R, 3, PITCH_W - 3); }
      }
      for (const [p, t] of zones) for (const o of team.opp.players) {            // with the ball: get open (gfootball's repulsion);
        if (o.sentOff) continue; const R = team.inPoss ? AI.OPEN : AI.APART;         // without it: just don't stand on top of anyone
        const dx = t.x - o.x, dy = t.y - o.y, d = len(dx, dy); if (d >= R || d < 0.01) continue;
        // (smarter-ai, clip 1: the side he steps to flipped every time the man crossed his line - he swayed left, right,
        // left beside a duel. He keeps the side he chose until the man is clearly on the other one)
        let sd = dy === 0 ? 1 : Math.sign(dy); if (p.openFrom === o && Math.abs(dy) < 1.5) sd = p.openSd; p.openFrom = o; p.openSd = sd;
        t.y = clamp(t.y + sd * (R - d) * 0.9, 3, PITCH_W - 3);
      }
      for (let pass = 0; pass < 2; pass++) {
        for (let i = 0; i < zones.length; i++) {
          const ti = zones[i][1];
          for (let j = i + 1; j < zones.length; j++) { const tj = zones[j][1], dx = tj.x - ti.x, dy = tj.y - ti.y, d = len(dx, dy);
            if (d > 0.01 && d < AI.SEP) { const k = (AI.SEP - d) / 2 / d; ti.x -= dx * k; ti.y -= dy * k; tj.x += dx * k; tj.y += dy * k; } }
          for (const f of fixed) { const dx = ti.x - f.x, dy = ti.y - f.y, d = len(dx, dy); if (d > 0.01 && d < AI.SEP) { const k = (AI.SEP - d) / d; ti.x += dx * k; ti.y += dy * k; } }
        }
      }
      // t-024 OFFSIDE: while we have it, nobody goes past their second-last man - they wait on his shoulder and go as it's
      // played (a team-mate's kick on its way: the wind-up; no owner: the runs and the receiver's run take over). Like real
      // forwards they don't judge it to the centimetre: how tight they play it (team.offHold) changes every couple of
      // seconds, now and then a step too far - with the passer's misread (passLook) that's the odd flag (OFFSIDE.SLIP / READ)
      if (owner && owner.team === team && offsideOn() && !(this.pending && this.pending.p.team === team)) {
        team.offT = (team.offT ?? 0) - dt; if (team.offT <= 0 || team.offBy !== owner) { team.offT = rnd(AI.OFF_HOLD_T[0], AI.OFF_HOLD_T[1]); team.offBy = owner; team.offHold = OFFSIDE.HOLD - rnd(0, OFFSIDE.SLIP); }   // (smarter-ai: one read per man on the ball, not every 1.5-3 s - the runs stopped and started)
        const lim = Math.max(this.offLine(team) - (team.offHold ?? OFFSIDE.HOLD), this.aiFrame(team, b.x) - OFFSIDE.HOLD, 0);
        for (const [, t] of tgt) if (this.aiFrame(team, t.x) > lim) t.x = this.aiWorld(team, lim);
        team.offLim = lim;
      } else team.offLim = null;
      // smarter-ai (clips 1 and 2): the spot he runs to moves smoothly (~TGT_T s), not every frame - a target that jumped
      // about with the ball and the men round him turned into back-and-forth running. A new job far away: straight there
      { const k = 1 - Math.exp(-dt / (AI.TGT_T * this.dk(team).role));          // (by the level's reactions: Easy eases slower, Rise Warrior quicker)
        for (const [p, t] of tgt) { const a = p.aiTgt;
          if (!a || a.team !== team || len(a.x - t.x, a.y - t.y) > 20) p.aiTgt = { x: t.x, y: t.y, team }; else { a.x += (t.x - a.x) * k; a.y += (t.y - a.y) * k; }
          t.x = p.aiTgt.x; t.y = p.aiTgt.y;
          if (team.offLim != null && this.aiFrame(team, t.x) > team.offLim) t.x = this.aiWorld(team, team.offLim); } }
      for (const p of team.players) {
        if (this.isHuman(p) && !this.demo) continue;
        if (p.state === 'kick' || p.state === 'catch' || p.state === 'dive' || p.state === 'slide' || p.state === 'dheader' || p.state === 'chance' || p.state === 'celebrate' || p.state === 'tackle' || p.state === 'dejected' || p.state === 'roar' || p.state === 'beaten' || p.state === 'protest' || p.state === 'hurt' || p.state === 'blasted' || p.stun > 0) continue;
        if (p.keeper) { this.keeperAI(p, dt); continue; }
        if (owner === p) { if (this.trapRunStep(p, dt)) continue; this.carrierAI2(p, dt); continue; }
        if (this.lobAimMate(p, dt)) continue;                                    // t-008: you're aiming a lob at him - he walks to the ring
        if (p === aerial && len(p.x - rcv.x, p.y - rcv.y) < 12 && !this.lobMarkLate(p)) {   // stay touch-tight, goal side, to contest it (t-008: a beat after the receiver)
          const pt = b.lob ? { x: rcv.x + rcv.vx * 0.25, y: rcv.y + rcv.vy * 0.25 } : this.intercept(rcv, rcv.top(true, false)),   // lob-mechanics: he goes with the man (he can't read the drop before the receiver does)
            gs = Math.sign(team.ownGoalX - pt.x) || 1;
          p.sprinting = true; p.moveTo(pt.x + gs * 0.6, pt.y, p.top(true, false), dt); continue;
        }
        if (!owner && b.target === p && b.last === team && !this.crossLive(team) && this.lobRun(p, dt)) continue;   // t-008: a lob to him - timed to arrive under the drop
        if (!owner && b.target === p && b.last === team) {                       // the receiver of a pass runs onto it
          const far = len(b.x - p.x, b.y - p.y) > 8 && p.stamina > 0.3; p.sprinting = far || (this.crossLive(team) && p.stamina > 0.15);
          const v = p.top(p.sprinting, false), pt = this.crossLive(team) ? this.meetCross(p, v) || this.intercept(p, v, 0.12, 2.1) : this.intercept(p, v, 0.12, b.lob ? 1.9 : 1.0); p.moveTo(pt.x, pt.y, v, dt); continue;   // lob-mechanics: attack the drop (t-012: a cross at head height)
        }
        if (team.wing && team.wing.has(p) && this.crossLive(team)) {               // t-012: the other runners attack the cross too (the far post, the second ball)
          const v = p.top(p.stamina > 0.15, false), pt = this.meetCross(p, v);
          if (pt) { p.sprinting = p.stamina > 0.15; p.moveTo(pt.x, pt.y, v, dt); continue; }
        }
        if (owner && owner.keeper && owner.hands && owner.team !== team && len(p.x - owner.x, p.y - owner.y) < 14) {   // their keeper has it: back off
          const dx = p.x - owner.x, dy = p.y - owner.y, d = len(dx, dy) || 1;
          p.moveTo(owner.x + dx / d * 15, clamp(owner.y + dy / d * 15, 3, 65), JOG, dt); continue;
        }
        if (!owner && b.reb && this.reboundRun(p, team, aerial, dt)) continue;   // t-020 ARCADE: a ball popping up off the boards - go and meet it in the air
        if (p === team.presser && !(owner && owner.keeper && owner.hands)) {
          if (owner && owner.team !== team) { this.aiPress(p, team, owner, dt); continue; }
          if (!owner) { const d = len(b.x - p.x, b.y - p.y), go = d > 4 && p.stamina > 0.35; p.sprinting = go;   // a loose ball: go and get it
            const v = p.top(go, false), pt = this.intercept(p, v); p.moveTo(pt.x, pt.y, v, dt); continue; }
        }
        if (p === team.cover && owner && this.isHuman(owner) && !this.demo && p.cool <= 0) {   // v0.9.3 DOUBLE TEAM (HARD / RISE WARRIOR): the cover man
          const Y = this.dkY(team);                                                // steps in too when you're on top of him
          if (Y.dbl > 0 && len(b.x - p.x, b.y - p.y) < AI.REACH && Math.random() < dt * Y.dbl) { this.challenge(p, owner); continue; } }
        const t = tgt.get(p); if (!t) { p.steer(0, 0, dt); continue; }
        const d = len(t.x - p.x, t.y - p.y), dead = Math.max(0.8, 0.06 * len(b.x - p.x, b.y - p.y));
        const settled = (p.settledAt ?? -1e9) > this.time.now - 60;                // v0.8.7: settled men only move again once the spot is well away
        if (d < (settled ? dead * 1.8 : dead)) { p.settledAt = this.time.now; p.steer(0, 0, dt); if (p.speed < 0.4) p.look(b.x - p.x, b.y - p.y); continue; }   // in position: stand and watch the ball (BUG WATCH: no more step-stop-step fidgeting at the edge)
        const back = this.aiFrame(team, t.x) < this.aiFrame(team, p.x) - 4, hurry = back && d > 10, run = (team.wing && team.wing.get(p)) || (t.shoulder || t.goRun ? t : null);   // (t-024: the run to the last man's shoulder too)
        const recover = isBack(p) && !team.inPoss && d > 3 && p.stamina > 0.2 && back && (team.lineWhy === 'over' || team.lineFar || this.aiFrame(team, b.x) < this.aiFrame(team, p.x) - 2);   // role-ai step 2: the ball's past him - he gets back flat out
        p.sprinting = recover || (hurry && d > 18 && p.stamina > 0.5) || (!!run && run.go && d > 3 && p.stamina > 0.3);   // (t-012: a run into the box is made flat out)
        const cap = p.sprinting ? p.top(true, false) : hurry || run ? RUN : d > 14 ? RUN * 0.9 : JOG;
        p.moveTo(t.x, t.y, Math.min(cap, AI.ARRIVE * d + 0.4), dt);
      }
    }
    this.aiAround(dt);
  },
  // t-016 (Luca's Bug Watch mark, 24 Oct: "If player path is blocked they should find alternative paths to the ball or to
  // be useful" - THUAS #3 stood still: a man stood in his straight line, and separate() shoved him back every frame while
  // his legs kept going). Cheap, no path-finding: the AI has just set where everyone is heading (their velocity); a man
  // standing in the way 0.3-2.2 m ahead (within 0.9 m of the line, not the man on the ball, not running away from him)
  // and he bends round him, to the side with more room (and away from the touchline), keeping that side 0.5 s so he
  // doesn't dither; once past, he's straight back on line. The pressing man still goes AT the man on the ball.
  aiAround(dt) {
    const b = this.ball;
    for (const p of this.all) {
      if (p.keeper || p.sentOff || p === b.owner || (this.isHuman(p) && !this.demo) || p.busy() || p.stun > 0) { p.around = null; continue; }
      const v = len(p.vx, p.vy); if (v < 1.2) { p.around = null; continue; }
      const ux = p.vx / v, uy = p.vy / v; let blk = null, bd = 9;
      for (const o of this.all) {
        if (o === p || o.sentOff || o === b.owner) continue;
        const rx = o.x - p.x, ry = o.y - p.y, al = rx * ux + ry * uy, lat = rx * uy - ry * ux;
        if (al > 0.3 && al < 2.2 && Math.abs(lat) < 0.9 && o.vx * ux + o.vy * uy < v * 0.6 && al < bd) { blk = { o, lat }; bd = al; }
      }
      if (p.around) { p.around.t -= dt; if (p.around.t <= 0 && !blk) p.around = null; }
      if (!blk) continue;
      if (!p.around || p.around.o !== blk.o) {
        const room = sd => { let n = 0; const px = -uy * sd, py = ux * sd;             // (team-mates and opponents within 3 m on that side)
          for (const o of this.all) { if (o === p || o === blk.o || o.sentOff) continue; const rx = o.x - p.x, ry = o.y - p.y; if (rx * px + ry * py > 0 && len(rx, ry) < 3) n++; }
          const ey = p.y + py * 1.5; return n + (ey < 2 || ey > PITCH_W - 2 ? 3 : 0); };
        const pref = blk.lat > 0 ? -1 : 1, ra = room(pref), rb = room(-pref);           // (first choice: away from where he stands off the line)
        p.around = { o: blk.o, sd: rb < ra ? -pref : pref, t: 0.5 };
      }
      const sd = p.around.sd, k = 0.85, nx = ux + -uy * sd * k, ny = uy + ux * sd * k, nl = len(nx, ny);
      p.vx = nx / nl * v; p.vy = ny / nl * v;                                    // the same speed, bent ~40 deg round him
    }
  },
  carrierAI(p, dt) {
    const team = p.team, gx = team.goalX;
    p.think = (p.think || 0) - dt;
    const toGoal = len(gx - p.x, 34 - p.y);
    const dir = { x: team.side, y: clamp((34 - p.y) / 30, -0.6, 0.6) }; const dl = len(dir.x, dir.y);
    let near = 99; for (const o of team.opp.players) near = Math.min(near, len(o.x - p.x, o.y - p.y));
    const go = near > 7 && p.stamina > 0.55;                                     // open grass ahead: knock it on and sprint
    p.sprinting = go; const v = p.top(go, true) * 0.95;
    p.wantDir = { x: dir.x / dl, y: dir.y / dl };
    this.carrySteer(p, dir.x / dl, dir.y / dl, v, dt);
    if (p.think > 0) return;
    p.think = rnd(0.25, 0.45);
    // shooting: always from close in, often from the edge of the box, sometimes from range
    const central = Math.abs(p.y - 34) < 16 + Math.max(0, 18 - toGoal) * 0.3;
    if (central && toGoal < 24 && this.meterOf(team).level() >= (this.meterOf(team).level() === 3 ? 1 : 2) && Math.random() < 0.5 && this.special(p)) return;   // v0.7: the AI fires its specials too
    if (central && (toGoal < 18 || (toGoal < 24 && Math.random() < 0.7) || (toGoal < 28 && Math.random() < 0.25))) { this.doShot(p, rnd(0.45, 0.92), rnd(-1, 1)); return; }
    let pressure = 0; for (const o of team.opp.players) { const dx = (o.x - p.x) * team.side, d = len(o.x - p.x, o.y - p.y); if (d < 4 && dx > -1) pressure++; }
    const best = this.bestOption(p);
    if (best && ((pressure > 0 && Math.random() < 0.75) || (best.score > 1.2 && Math.random() < 0.35))) this.doPass(p, best.dir, best.mode);
  },
  // v0.8.2 ATTACK for the NEW team AI (Buckland's Simple Soccer + gfootball): SHOOT when there's a lane - how much of the
  // goal he can see, bodies in the way, where the keeper stands; PASS when he's pressed and someone's open, or a team-mate
  // has a better shot; otherwise DRIVE at goal - and a defender square in front gets TAKEN ON: a cut away from him + a burst.
  carrierAI2(p, dt) {
    const team = p.team, gx = team.goalX, side = team.side;
    p.think = (p.think || 0) - dt; p.takeT = (p.takeT || 0) - dt;
    const toGoal = len(gx - p.x, 34 - p.y);
    let front = null, fd = 99, near = 99;                                       // the man in his way (a cone ahead of him)
    for (const o of team.opp.players) { if (o.sentOff || o.keeper) continue;
      const ox = (o.x - p.x) * side, oy = o.y - p.y, d = len(ox, oy); near = Math.min(near, d);
      if (ox > -0.5 && d < 7 && Math.abs(oy) < ox * 1.2 + 1.5 && d < fd) { fd = d; front = o; } }
    let dx = side, dy = clamp((34 - p.y) / 30, -0.6, 0.6);
    { const fl = this.aiFrame(team, p.x), off = p.y - 34;                         // t-012: a wide man keeps his lane down the flank
      if (Math.abs(off) > WING.WIDE && fl > -12 && fl < 50) {                      // while the middle is crowded (it always drifted inside);
        let crowd = 0; for (const o of team.opp.players) if (!o.sentOff && !o.keeper && Math.abs(o.y - 34) < 12 && this.aiFrame(team, o.x) > fl - 2) crowd++;
        if (crowd >= 2 || fl < 28) { const lane = 34 + Math.sign(off) * (fl > 38 ? 17 : clamp(Math.abs(off), 18, 28)), w = clamp(this.dk(team).cross - 0.4, 0, 1);   // deep in their half: in towards the corner of the box
          dy += (clamp((lane - p.y) / 12, -0.5, 0.5) - dy) * w; } } }   // (how firmly by level: Easy still wanders inside - tools/proxy093 def: its wing play made it as hard to stop as Hard)
    let hold = false;                                                            // role-ai step 5: the TARGET MAN holds it up - a man tight on him
    if (cfKind(p) === 'target' && toGoal > 22 && !this.isHuman(p)) {             // (behind, or square) and he shields it, easing back towards his
      for (const o of team.opp.players) { if (o.sentOff || o.keeper) continue; if (len(o.x - p.x, o.y - p.y) < FWD.HOLD_FD && (o.x - p.x) * side > -1) { hold = true; break; } } }   // own side for the lay-off, no turn into the centre-back
    p.holdUp = hold; if (hold) { dx = -side * FWD.HOLD_BACK; dy *= 0.5; }
    else if (front && fd < 6 && toGoal > 9) {                                         // take him on: cut away from him, not into the line
      if (p.takeT <= 0) { const lat = front.y - p.y, edge = p.y < 9 ? 1 : p.y > PITCH_W - 9 ? -1 : 0;
        p.takeSide = edge || (Math.abs(lat) > 0.5 ? -Math.sign(lat) : (Math.sign(34 - p.y) || 1)); p.takeT = rnd(0.9, 1.5); }
      const a = clamp((6 - fd) / 6, 0, 1) * 0.85; dx = side * Math.cos(a); dy = p.takeSide * Math.sin(a) + dy * 0.25;
      const KB = this.dk(team); if (fd < 3.2 && p.stamina > 0.35 && (p.burstCd || 0) <= this.time.now && Math.random() < dt * 2.5 * KB.burst * paceK().aiBurst) { p.burst = 0.5 * (paceK().burstT / 0.55); p.burstCd = this.time.now + 1800 * KB.burstCd; }   // (v0.9.3: by level)
    }
    const go = (near > 7 || p.burst > 0) && p.stamina > 0.3;                    // open grass / beating his man: knock it on and sprint
    p.sprinting = go; const v = p.top(go, true) * 0.95, dl = len(dx, dy) || 1;
    p.wantDir = { x: dx / dl, y: dy / dl };
    this.carrySteer(p, dx / dl, dy / dl, v, dt, p.burst > 0 ? ACC * 1.35 : ACC);
    if (p.think > 0) { this.brainWall(p, this.dk(team)); return; }               // (smarter-ai: a 1-2 is played first time - he doesn't wait to think)
    // v0.9.2 difficulty: how quickly he decides (smarter-ai: and the team's tempo; a side keeping a lead slows it down)
    const K = this.dk(team), S = this.brainStyle(team), M = team.mood || this.brainMood(team);
    p.think = rnd(0.2, 0.35) * K.think * (1 - 0.25 * S.tempo) * (M.protect > 0.3 && S.protect === 'keep' ? 1.15 : 1);
    // smarter-ai stage 2: the decision is the team brain's move list (brain.js AI_MOVES): special, chip, tap, shot,
    // cross, pass, the safe ball, the curving pass, keep it - every judgement as before, the best of those that come up
    this.brainChoose(p, { K, toGoal, front, fd, pressed: !!(front && fd < 3.2) || hold });   // (role-ai step 5: holding it up = looking for the lay-off)
  },
  // t-012 THE RUNS for a wide man in their half: the nearest striker to the near post, the other to the far post, the
  // far-side winger to the spot, a central midfielder to the edge of the box (the knock-down, the cut-back), and the
  // full-back on his side overlaps him outside. The deeper the crosser, the deeper they wait (8 m back at their
  // halfway line, at the spot by the time he's 20 m from the line), so they arrive with the ball, not before it.
  // You're never sent: when you're the one out wide, your computer team-mates make the runs.
  aiWingRuns(team, owner) {
    team.wing = null; const fl = this.aiFrame(team, owner.x), off = owner.y - 34, sgn = Math.sign(off) || 1;
    if (Math.abs(off) < WING.WIDE - 1) return this.aiBoxRuns(team, owner, fl, sgn);   // (smarter-ai: through the middle - late runs into the box)
    if (fl < 10) return;
    const human = !this.demo ? this.humanOf(team) : null, W = new Map(), a = clamp((fl - 12) / 20, 0, 1);
    const free = team.players.filter(q => q !== owner && q !== human && !q.keeper && this.aiFree(q) && q !== team.support && q.stamina > 0.12);
    const homeSide = q => Math.sign(homeY(q, true) || 0);   // (role-ai step 4: by formation)
    const run = (name, pool) => { const [X, o] = WING.RUNS[name], pt = { x: this.aiWorld(team, X - (1 - a) * WING.BACK), y: clamp(34 + sgn * o, 3, PITCH_W - 3), run: name, go: a > 0.45 };
      const q = pool.filter(x => !W.has(x)).sort((u, v) => len(u.x - pt.x, u.y - pt.y) - len(v.x - pt.x, v.y - pt.y))[0]; if (q) W.set(q, pt); return q; };
    const fwd = free.filter(q => lineOf(q) === 2 && !(q.role === 'WF' && homeSide(q) === sgn)), wideFar = free.filter(q => isWide(q) && homeSide(q) === -sgn), mid = free.filter(q => q.role === 'CAM' || q.role === 'CM');   // (role-ai step 4: the 10 and the CMs arrive at the edge; the anchor stays)
    run('near', fwd); run('far', fwd.length > 1 ? fwd : [...fwd, ...wideFar, ...mid.filter(q => q.role === 'CAM')]);
    if (a > 0.6) run('spot', [...wideFar, ...fwd]);                             // (a third man only late on: four in the box flooded it - more goals, not more crosses)
    run('edge', mid);
    if (fl < 32 && !isBack(owner)) {                           // the overlap: his full-back goes past him on the outside
      const fb = free.find(q => isBack(q) && homeSide(q) === sgn && !W.has(q) && q.stamina > 0.4);
      if (fb && this.aiFrame(team, fb.x) > fl - 25) W.set(fb, { x: this.aiWorld(team, Math.min(fl + 10, 47)), y: clamp(34 + sgn * Math.min(Math.abs(off) + 5, 31), 3, PITCH_W - 3), run: 'overlap', go: true });
    }
    team.wing = W.size ? W : null; team.wingBy = W.size ? owner : null;
  },
  // smarter-ai: THROUGH THE MIDDLE (real football's late runs: the second striker peels off to the far side of the box, a
  // midfielder arrives at the edge - the third man). Before, only a wide man got runs; a central attack had the one runner in
  // behind and everyone else in their zones, so the man on the ball had nobody in the box to find. Same spots and timing
  // as the wing runs (WING.RUNS), mirrored away from the ball's side; the offside line still holds them (ai()).
  aiBoxRuns(team, owner, fl, sgn) {
    if (fl < 12) return;
    const human = !this.demo ? this.humanOf(team) : null, W = new Map(), a = clamp((fl - 12) / 18, 0, 1);
    const free = team.players.filter(q => q !== owner && q !== human && !q.keeper && this.aiFree(q) && q !== team.support && q !== team.runner && q.stamina > 0.12);
    const run = (name, pool) => { const [X, o] = WING.RUNS[name], pt = { x: this.aiWorld(team, X - (1 - a) * WING.BACK), y: clamp(34 - sgn * Math.abs(o) - sgn * 2, 3, PITCH_W - 3), run: name, go: a > 0.45 };
      const q = pool.filter(x => !W.has(x)).sort((u, v) => len(u.x - pt.x, u.y - pt.y) - len(v.x - pt.x, v.y - pt.y))[0]; if (q) W.set(q, pt); return q; };
    run('far', free.filter(q => lineOf(q) === 2 || q.role === 'CAM'));                   // the other striker (one up front: the 10): the far side of the box
    run('edge', free.filter(q => q.role === 'CM' || q.role === 'CAM'));    // a central midfielder (or the 10): late, to the edge
    team.wing = W.size ? W : null; team.wingBy = W.size ? owner : null;
  },
  // is our cross in the air? (nobody has touched it since he hit it). The computer's crosses are marked at the kick
  // (b.crossBy); yours, or any lofted ball from the man whose runs were on, count while they're still coming down in
  // their box - so your team-mates keep attacking your cross instead of jogging back to their zones
  crossLive(team) {
    const b = this.ball, by = b.lastP; if (b.owner || b.inNet || !by || by.team !== team) return false;
    if (b.crossBy === by) return true;
    if (team.wingBy !== by || !(b.lob || b.z > 0.3)) return false;
    const P = this.path, L = P && (P.land || P[P.length - 1]); return !!L && Math.abs(L.x - team.goalX) < 18 && Math.abs(L.y - 34) < 21;
  },
  // t-012 where a runner meets the cross: the first point on its flight at head height (0.9-2.3 m) he can reach in
  // time, else where it comes down low (the Lab's attackBall, which the C crosses were tuned with)
  meetCross(p, v) {
    const P = this.path; if (!P) return null;
    return P.find(q => q.z > 0.9 && q.z < 2.3 && 0.1 + len(q.x - p.x, q.y - p.y) / v <= q.t) || P.find(q => q.z <= 0.9 && 0.1 + len(q.x - p.x, q.y - p.y) / v <= q.t) || null;
  },
  // t-012 THE CROSS: wide (10 m+ off the middle), in the last 32 m, not yet in the box. crossLook finds the best runner
  // to hit; he crosses when it's a good one (a smarter side waits for a better look: K.crossRead), always at the
  // byline or with a man in his face, and how often by level (K.cross: Easy crosses less)
  aiCrossTry(p, K, pressed) {
    const r = this.aiCrossLook(p, K, pressed); if (!r || !(Math.random() < r.want * K.cross)) return false;
    this.aiCross(p, r.c, K); return true;
  },
  // (smarter-ai: the judgement on its own, without the dice - the team brain's 'cross' move uses it too)
  aiCrossLook(p, K, pressed) {
    const team = p.team, fl = this.aiFrame(team, p.x), off = Math.abs(p.y - 34);
    p.crossOn = false; if (off < WING.WIDE - 1 || fl < 20 || (fl > 36 && off < 20)) return null;
    const c = this.crossLook(p); p.crossOn = !!c && c.score > K.crossRead - 0.9; if (!c) return null;
    const early = fl < 28 ? 0.4 : 0;                                              // an early cross (25-32 m from the line) only for a good look
    const want = (fl > 46 || pressed) && c.score > K.crossRead - 1.2 ? 0.85 : c.score > K.crossRead + early ? 0.85 : c.score > K.crossRead + early - 1.0 ? 0.4 : 0;
    return want ? { c, want } : null;
  },
  // every team-mate in or running into the box as a cross: where he'll be (his run's spot), whipped or floated.
  // score = he gets there in time + the defenders don't + his shot from there - the keeper's reach - bodies in a low lane
  crossLook(p) {
    const team = p.team, gk = team.opp.players[0], defs = team.opp.players.filter(o => !o.sentOff && !o.keeper); let best = null;
    const offL = offsideOn() ? this.offLine(team) + rnd(0, OFFSIDE.READ) : null;   // t-024: never a cross at a man standing offside (as he reads it)
    for (const q of team.players) {
      if (q === p || q.keeper || q.sentOff || q.stun > 0 || (offL != null && this.offPos(q, offL))) continue;
      const w = team.wing && team.wing.get(q), name = w ? w.run : '', at0 = w && name !== 'overlap' ? w : { x: q.x + q.vx * 0.6, y: q.y + q.vy * 0.6 };
      const X = this.aiFrame(team, at0.x), off = Math.abs(at0.y - 34);
      if (X < 33 || X > 50 || off > 15) continue;                                  // in the box or at its edge
      const d0 = len(at0.x - p.x, at0.y - p.y); if (d0 < 8 || d0 > 42) continue;
      const kinds = name === 'edge' ? ['cut'] : name === 'far' ? ['float', 'whip'] : name ? ['whip', 'float'] : ['whip', 'float'];
      for (const kind of kinds) {
        let at = at0, d = d0;
        if (kind === 'whip' && w) {                                                // whipped: into his path, where his run has got to when it arrives
          const rx = at0.x - q.x, ry = at0.y - q.y, rl = len(rx, ry), reach = Math.max(0, (0.25 + d0 / 21 - 0.3) * 0.85 * q.top(true, false));
          if (rl > reach) { at = { x: q.x + rx / rl * reach, y: q.y + ry / rl * reach }; d = len(at.x - p.x, at.y - p.y); if (this.aiFrame(team, at.x) < 36) continue; } }
        const Tb = kind === 'float' ? 1.1 + d / 28 : kind === 'cut' ? passTime(d) + 0.15 : 0.25 + d / 21;
        const tq = 0.3 + len(at.x - q.x, at.y - q.y) / (0.85 * q.top(true, false)),   // (he has to get going: ~85% of his top speed on average)
           arrive = clamp(1 - Math.max(0, tq - Tb) / 0.5, -1, 1);   // (late = worse than nobody: he hits empty grass)
        let defT = 9, lane = 0; for (const o of defs) { defT = Math.min(defT, 0.3 + Math.max(0, len(o.x - at.x, o.y - at.y) - 1.2) / 6.5);
          if (kind !== 'float') { const lx = at.x - p.x, ly = at.y - p.y, t = ((o.x - p.x) * lx + (o.y - p.y) * ly) / (d * d);
            if (t > 0.08 && t < (kind === 'cut' ? 0.95 : 0.35)) { const lat = Math.abs((o.x - p.x) * ly - (o.y - p.y) * lx) / d; if (lat < 1.3) lane += 1 - lat / 1.3; } } }
        const race = clamp(defT - Math.max(tq, Tb) + 0.4, -1, 1.2);
        let gkPen = 0; if (gk && !gk.sentOff && kind !== 'cut') { const gd = len(gk.x - at.x, gk.y - at.y); if (gd < WING.GK_REACH + (kind === 'float' ? 2 : 0)) gkPen += 1.2 * (1 - gd / (WING.GK_REACH + 2)) + 0.4; if (this.aiFrame(team, at.x) > WING.SIX && Math.abs(at.y - 34) < 9.2) gkPen += 0.8; }   // never into his reach / his six-yard box
        const sh = this.shotLook(team, at.x, at.y).q, score = arrive * 1.1 + race + sh * 0.8 * Math.max(0, arrive) - gkPen - lane * 0.9 + (kind === 'cut' ? -0.2 : kind === 'whip' && (name === 'near' || name === 'spot' || !name) && arrive > 0.7 ? 0.45 : kind === 'float' && name === 'far' ? 0.6 : 0);   // (a man arriving at the near post / spot wants it whipped, the far post floated over everyone)
        if (!best || score > best.score) best = { q, pt: { x: at.x, y: at.y }, kind, score, run: name };
      }
    }
    return best;
  },
  // t-012 the computer's cross: off by up to K.crossErr metres (Easy crosses worse), then the kick (its flight is in
  // ball.js: releaseKick's `cross`). Floated = the open-play lob (its drop is lobDuel); whipped = driven, coming down
  // through head height at the spot; cut = a ground pass back to the edge of the box
  aiCross(p, c, K) {
    if (c.kind === 'cut') { this.doPass(p, { x: (c.q.x - p.x) / (len(c.q.x - p.x, c.q.y - p.y) || 1), y: (c.q.y - p.y) / (len(c.q.x - p.x, c.q.y - p.y) || 1) }, 'ground', c.q); return; }
    const e = K.crossErr * rnd(0.2, 1), a = rnd(0, Math.PI * 2), tx = clamp(c.pt.x + Math.cos(a) * e, 1, PITCH_L - 1), ty = clamp(c.pt.y + Math.sin(a) * e, 2, PITCH_W - 2);
    if (c.kind === 'float') this.kick(p, tx, ty, 0, 0, 0.12, { mode: 'lob', target: c.q, loft: true, cross: 'float' });
    else this.kick(p, tx, ty, 0, 0, 0.12, { target: c.q, cross: 'whip' });
  },
  // how good a shot is from (x, y): the goal angle he can see x a clear lane x the gap to the keeper; best aim -1..1
  shotLook(team, x, y) {
    const gx = team.goalX, k = team.opp.players[0], dxg = Math.abs(gx - x) || 0.1;
    const ang = Math.abs(Math.atan2(34 + 3.66 - y, dxg) - Math.atan2(34 - 3.66 - y, dxg));
    let best = { q: 0, aim: 0 };
    for (const aim of [-0.9, -0.45, 0, 0.45, 0.9]) {
      const lx = gx - x, ly = 34 + aim * 2.8 - y, ll2 = lx * lx + ly * ly, ll = Math.sqrt(ll2); let block = 0;
      for (const o of team.opp.players) { if (o.sentOff || o.keeper) continue;
        const t = ((o.x - x) * lx + (o.y - y) * ly) / ll2; if (t < 0.03 || t > 0.97) continue;
        const lat = Math.abs((o.x - x) * ly - (o.y - y) * lx) / ll; if (lat < 1.1) block += 1 - lat / 1.1; }
      let gk = 3; if (k && !k.sentOff) { const t = clamp((k.x - x) / (lx || 1e-6), 0, 1); gk = Math.abs(y + ly * t - k.y); }
      const q = Math.min(1.4, ang * 2.2) * Math.max(0, 1 - block) * (0.55 + 0.45 * Math.min(1, gk / 2.4));
      if (q > best.q) best = { q, aim };
    }
    return best;
  },
  // every team-mate as a pass, each way it can be played (to feet / through into space / lobbed), and the safest one:
  // risk = defenders who can reach the line before the ball (Buckland's isPassSafeFromAllOpponents) + defenders who win
  // the race to where it arrives. score = forward progress + his own shot from there - risk - distance
  passLook(p) {
    const team = p.team, side = team.side, opp = team.opp.players.filter(o => !o.sentOff); let best = null; const all = [];
    const ST = this.brainStyle(team), DIR = ST.direct, WID = ST.width;
    const race = (pt, Tb) => { let r = 0; for (const o of opp) { const to = 0.3 + Math.max(0, len(o.x - pt.x, o.y - pt.y) - 1.0) / 6.5; if (to < Tb + 0.2) r += clamp((Tb + 0.2 - to) / 0.5, 0, 1); } return r; };
    const lane = (pt, d, T) => { let r = 0; const dx = pt.x - p.x, dy = pt.y - p.y;
      for (const o of opp) { const t = ((o.x - p.x) * dx + (o.y - p.y) * dy) / (d * d); if (t < 0.02 || t > 1.0) continue;
        const lat = Math.abs((o.x - p.x) * dy - (o.y - p.y) * dx) / d, tb = 0.15 + t * (T - 0.15), to = 0.25 + Math.max(0, lat - 0.9) / 5.5;
        if (to < tb) r += clamp((tb - to) / 0.3, 0, 1); } return r; };
    const offL = offsideOn() ? this.offLine(team) + rnd(0, OFFSIDE.READ) : null;   // t-024: only a man who is onside as it's played (as he reads it: a little out)
    for (const q of team.players) {
      if (q === p || q.keeper || q.sentOff || q.stun > 0 || (offL != null && this.offPos(q, offL))) continue;
      const d0 = len(q.x - p.x, q.y - p.y); if (d0 < 5 || d0 > 40) continue;
      const lt = d0 / 14 * 0.6, feet = { x: q.x + q.vx * lt, y: q.y + q.vy * lt }, opts = [];   // (doPass leads him a little)
      { const d = len(feet.x - p.x, feet.y - p.y), T = passTime(d) + 0.15; opts.push({ mode: 'ground', pt: feet, d, risk: lane(feet, d, T) + race(feet, T) * 0.5 }); }
      // smarter-ai: a man waiting on the last defender's shoulder gets it in behind too (he goes as it's played - the
      // receiver's run), not only one already running: holding the line (t-024) had stopped the through balls to him
      const shoulder = lineOf(q) >= 1 && (offL != null ? this.aiFrame(team, q.x) > offL - 3.5 : team.offX != null && this.aiFrame(team, q.x) > team.offX - 3.5);
      if ((q.speed > 2 && q.vx * side > 1) || shoulder) {                         // through: into the space in front of a runner
        const pt = { x: clamp(q.x + side * 8, 2, PITCH_L - 2), y: clamp(q.y + (34 - q.y) * 0.12 + q.vy * 0.6, 2, PITCH_W - 2) }, d = len(pt.x - p.x, pt.y - p.y);
        const T = passTime(d) * 1.3 + 0.15, tq = len(pt.x - q.x, pt.y - q.y) / Math.max(5, q.top(true, false));
        opts.push({ mode: 'through', pt, d, risk: lane(pt, d, T) + race(pt, Math.max(T, tq)) * 0.8 });
      }
      // smarter-ai (clips 5 and 6, the computer kept only 41% of its lobs): a lob was rated by who reaches the drop at a
      // jog, not by how the defenders really go: the man nearest the receiver sprints WITH him while it's up (ai():
      // `aerial`), so anyone who gets there about when the receiver does makes it a 50-50 at best; and a man right on
      // the passer, in front of the kick, charges it down before it's up (most of the lost ones never got above 2 m)
      const lobRisk = (pt, T) => { const dq = len(q.x - pt.x, q.y - pt.y), dx = pt.x - p.x, dy = pt.y - p.y, dl = len(dx, dy) || 1; let r = race(pt, T) + 0.25, mk = 0;
        for (const o of opp) { if (o.keeper) continue; const de = len(o.x - pt.x, o.y - pt.y); if (de < 12) mk = Math.max(mk, clamp((dq + 3.5 - de) / 3.5, 0, 1));
          const rx = o.x - p.x, ry = o.y - p.y, rl = len(rx, ry); if (rl < 3.5 && (rx * dx + ry * dy) / (rl * dl) > 0.4) r += AI.LOB_READ; }
        return r + mk * 0.8 * AI.LOB_READ; };
      if (d0 > 14) { const T = clamp(0.7 + d0 / 25, 0.9, 1.9) + 0.2; opts.push({ mode: 'lob', pt: feet, d: d0, risk: lobRisk(feet, T) }); }   // over a blocked lane (lob-mechanics: the AI's old judgement of WHEN to lob, kept on purpose)
      const o = opts.sort((u, v) => u.risk - v.risk)[0];
      let open = 8; for (const e of opp) open = Math.min(open, len(e.x - o.pt.x, e.y - o.pt.y));
      const progress = (o.pt.x - p.x) * side, sh = len(team.goalX - o.pt.x, 34 - o.pt.y) < 30 ? this.shotLook(team, o.pt.x, o.pt.y).q : 0;
      const wide = Math.abs(o.pt.y - 34) > WING.WIDE + 1 && this.aiFrame(team, o.pt.x) > 14 && Math.abs(p.y - 34) < Math.abs(o.pt.y - 34) ? 0.8 * this.dk(team).cross : 0;   // t-012: out to a wide man in their half (wing play)
      const score = progress / 14 * (1 + 0.4 * DIR) + Math.min(open, 7) / 6 + sh * 1.2 - o.risk * 1.6 - o.d / 45 + wide * (1 + 0.5 * WID);   // (smarter-ai: the style's directness and width)
      let mk = 9; for (const e of opp) if (!e.keeper) mk = Math.min(mk, len(e.x - q.x, e.y - q.y));
      const opt = { q, score, mode: o.mode, shot: sh, risk: o.risk, progress, marked: mk < 2, lane: o.mode === 'lob' ? 0 : lane(o.pt, o.d, passTime(o.d) + 0.15), dir: { x: (q.x - p.x) / d0, y: (q.y - p.y) / d0 } };
      all.push(opt); if (!best || score > best.score) best = opt;
    }
    if (best) best.all = all;                                                     // (smarter-ai: the move list also wants the safe ball and the curve)
    return best;
  },
  // Buckland's SUPPORT SPOT: one team-mate goes to the best spot near the ball - open, a safe pass away, and a shot from there
  aiSupport(team, owner) {
    const cand = team.players.filter(q => lineOf(q) >= 1 && q !== owner && q !== team.runner && this.aiFree(q) && q !== (!this.demo ? this.humanOf(team) : null));
    const mem = team.supMem && this.time.now - team.supMem.t < 1500 ? team.supMem : null, dO = q => len(q.x - owner.x, q.y - owner.y);
    const prev = team.support || (mem && mem.p), prevPt = team.support ? team.supportPt : mem && mem.pt;
    let sup = cand.sort((u, v) => dO(u) - dO(v))[0];
    if (sup && prev !== sup && cand.includes(prev) && dO(prev) < dO(sup) * 1.4 + AI.STICK_SUP) sup = prev;   // (smarter-ai: the man already going keeps the job)
    team.support = sup || null; team.supportPt = null; if (!sup) return;
    let best = null; const side = team.side, lim = team.offX != null ? this.aiWorld(team, Math.max(team.offX, this.aiFrame(team, owner.x)) - 0.6) : null;
    const spots = []; for (const r of [10, 14, 19]) for (let a = -100; a <= 100; a += 25) { const ra = a * Math.PI / 180; spots.push({ x: owner.x + side * Math.cos(ra) * r, y: owner.y + Math.sin(ra) * r }); }
    const keep = prev === sup && prevPt && len(prevPt.x - owner.x, prevPt.y - owner.y) > 8 && len(prevPt.x - owner.x, prevPt.y - owner.y) < 22 ? prevPt : null;
    if (keep) spots.push({ x: keep.x, y: keep.y, keep: true });                    // (smarter-ai: his spot, scored the same way)
    for (const { x, y, keep: kept } of spots) { const r = len(x - owner.x, y - owner.y);
      if (x < 3 || x > PITCH_L - 3 || y < 3 || y > PITCH_W - 3 || (lim != null && (x - lim) * side > 0)) continue;
      let open = 8, safe = 1;
      for (const o of team.opp.players) { if (o.sentOff) continue; open = Math.min(open, len(o.x - x, o.y - y));
        const t = ((o.x - owner.x) * (x - owner.x) + (o.y - owner.y) * (y - owner.y)) / (r * r);
        if (t > 0.05 && t < 1) { const lat = Math.abs((o.x - owner.x) * (y - owner.y) - (o.y - owner.y) * (x - owner.x)) / r; if (lat < 1.5 + t * 2) safe = 0; } }
      const sh = len(team.goalX - x, 34 - y) < 28 ? this.shotLook(team, x, y).q : 0;
      const sc = Math.min(open, 7) / 2.5 + safe * 2 + sh * 2 + (x - owner.x) * side * 0.04 - len(x - sup.x, y - sup.y) * 0.03 + (kept ? AI.STICK_SPOT : 0);
      if (!best || sc > best.sc) best = { x, y, sc };
    }
    if (best) team.supportPt = { x: best.x, y: best.y };
  },
  // the AI looks at every team-mate: forward progress + how open he is - opponents in the lane - distance
  bestOption(p) {
    const team = p.team; let best = null;
    const offL = offsideOn() ? this.offLine(team) + rnd(0, OFFSIDE.READ) : null;   // t-024: not a man standing offside (as he reads it)
    for (const q of team.players) {
      if (q === p || q.keeper || (offL != null && this.offPos(q, offL))) continue;
      const dx = q.x - p.x, dy = q.y - p.y, d = len(dx, dy); if (d < 5 || d > 45) continue;
      let open = 8, lane = 0;
      for (const o of team.opp.players) {
        open = Math.min(open, len(o.x - q.x, o.y - q.y));
        const t = ((o.x - p.x) * dx + (o.y - p.y) * dy) / (d * d);
        if (t > 0.08 && t < 0.95) { const lat = Math.abs((o.x - p.x) * dy - (o.y - p.y) * dx) / d; if (lat < 2.2) lane += (2.2 - lat); }
      }
      const progress = (q.x - p.x) * team.side;
      const mode = lane > 1.5 && d > 15 ? 'lob' : (open > 6 && progress > 5 && q.speed > 2 ? 'through' : 'ground');
      const score = progress / 15 + open / 4 - lane * (mode === 'lob' ? 0.15 : 0.8) - d / 40;
      if (!best || score > best.score) best = { q, score, mode, dir: { x: dx / d, y: dy / d } };
    }
    return best;
  },
  // ======================================================================= t-008 RECEIVING A LOB (Luca: "work on the receiving the ball ai logic
  // so its smooth so aerial shots are easier to do and become more common"). He ran to the first point of the drop he
  // could reach and stood there waiting (or got there late); now he times his run: he heads for where the ball comes
  // down through head height (near goal, a header at goal) or chest height, at the speed that gets him there just as it
  // does - so he meets it on the move. False when he can't make it in time (the old intercept takes over).
  lobRun(p, dt) {
    const b = this.ball, P = this.path; if (!b.lob || b.owner || b.target !== p || b.last !== p.team || !P || p.keeper) return false;
    const toG = len(p.team.goalX - p.x, 34 - p.y), hz = toG < 25 ? 2.0 : 1.6;
    let hi = b.z > hz, pt = null; for (const q of P) { if (q.z > hz) hi = true; else if (hi) { pt = q; break; } }
    if (!pt) return false;
    const d = len(pt.x - p.x, pt.y - p.y), T = Math.max(pt.t - 0.1, 0.05), top = p.top(p.stamina > 0.2, false);
    if (d / T > top * 1.02) return false;
    const v = clamp(d / T * 1.05, 0, top); p.sprinting = v > p.top(false, false) * 0.98;
    if (d < 0.4) { p.steer(0, 0, dt); p.look(b.x - p.x, b.y - p.y); } else p.moveTo(pt.x, pt.y, v, dt);
    return true;
  },
  // while you hold LOB, the team-mate the ring has settled on walks to it (so the ring ends on the spot he'll reach)
  lobAimMate(p, dt) {
    const o = this.ball.owner, S = this.isHuman(o) ? this.slot(o.team) : null, A = S && S.lobAim; if (!A || A.q !== p) return false;   // (t-043: the lob aim of whichever human has it)
    p.moveTo(A.x, A.y, JOG, dt); return true;
  },
  // t-020 ARCADE REBOUNDS (Luca 25 Oct: "more rebounds that lead into aerials"): while a ball that came off the boards is
  // up in the air (ARCADE.reb.airT s, until someone touches it), each side sends its quickest man to meet it at chest /
  // head height - not where it lands - so the header, the volley, the duel and the aerial specials come out of it. The
  // man it was "aimed" at (ball.js arcadeRebound: he runs under it with the lob code) and their man going with him keep
  // their jobs; this is one more from each side, picked once per rebound. CLASSIC: b.reb is never set.
  reboundRun(p, team, aerial, dt) {
    const b = this.ball, R = b.reb;
    if (!paceK().arcade || !R || R.done || this.time.now - R.t > ARCADE.reb.airT * 1000 || (b.z < 0.3 && b.vz <= 0)) return false;
    const zmax = paceK().headZ - 0.6;                                            // (meet it where a header or a volley can take it)
    if (team.rebFor !== R) {
      team.rebFor = R; team.rebMan = null; let bt = ARCADE.reb.run / 7;          // (no further than he can sprint in that time)
      for (const q of team.players) {
        if (q.keeper || q.sentOff || this.isHuman(q) || q === b.target || q === aerial || !this.aiFree(q)) continue;
        const pt = this.intercept(q, q.top(true, false), 0.12, zmax); if (pt.t != null && pt.t < bt) { bt = pt.t; team.rebMan = q; }
      }
    }
    if (team.rebMan !== p) return false;
    const v = p.top(p.stamina > 0.15, false), pt = this.intercept(p, v, 0.12, zmax);
    p.sprinting = p.stamina > 0.15; p.moveTo(pt.x, pt.y, v, dt); return true;
  },
  // his marker reads the drop a beat after the receiver does (LOB2.markDelay), then goes with him
  lobMarkLate(p) { const b = this.ball; return !!b.lob && (b.airT || 0) < LOB2.markDelay; },
});
