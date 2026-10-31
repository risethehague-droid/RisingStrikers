// SOAK: computer v computer matches headless, one after another, across different set-ups, with BUG WATCH on.
// (Luca 23 Oct 22:36: "run simulations of the games in the background catching any bugs and improving".) It catches
// what one smoke run can't: rare stalls, stuck moves, broken numbers, page errors, and how often the odd things happen.
// Every match is seeded, so any finding replays exactly: the summary prints a repro line for each match.
//
//   node tools/soak.js                                   12 full matches (2 x 3 real minutes each, fast-forwarded)
//   MATCHES=30 node tools/soak.js                        more
//   GOAL_PHYS=1 node tools/soak.js                       t-013: the goal physics forced ON in the matches (it's off in a match
//                                                        until Luca's OK); the summary adds woodwork hits, rebounds back in play, pop-ups
//   NET_FX=0 node tools/soak.js                          t-025: the living net OFF (v0.12.0's net: the before / after check)
//   FROM=12 MATCHES=12 node tools/soak.js                the next 12 set-ups (a second sample)
//   ONE='seed=8919 home=IS away=IRO lvl=hard ai=new weather=rain tod=night' node tools/soak.js    replay one match
//   OUT=soak-out node tools/soak.js                      also write soak-out/soak-<time>.json and .md
//   TAP=1 node tools/soak.js                            t-010: with the TAP KICK forced on (it's off in matches until Luca's OK)
//   PACE=arcade node tools/soak.js                      t-020: the matches on ARCADE (default: the page's own, CLASSIC); the summary adds
//                                                        board rebounds, those that went up for a header, headers / volleys off them,
//                                                        special shots, special saves, the ARCADE SP extras
//   LVL=rise AI=new MATCHES=24 node tools/soak.js         smarter-ai: one level, one AI for every match (the before / after by level)
//   STYLE=press,counter node tools/soak.js               smarter-ai: the home / away style cards (brain.js STYLES; tools/styles.js plays them all)
//   (every soak ends with the team brain's MOVES line; 12+ matches: MOVE CHECK - fails if a move that was available was never played)
//   PORT=8765 (default): serve the game first with  python3 -m http.server 8765 --directory game
//
// The set-ups rotate with different strides, so pairs of factors (teams x level, level x weather, AI x light...)
// get covered in a few matches instead of every combination. Your side plays at base, theirs at the level.
const { chromium } = require('playwright');
const fs = require('fs');
const TEAMS = ['IS', 'IRO', 'USCS', 'LUC', 'THUAS', 'AUC'], LVLS = ['easy', 'normal', 'hard', 'rise'];
const WX = ['clear', 'rain', 'snow'], TOD = ['day', 'sunset', 'night'];
const setup = i => {
  const home = TEAMS[i % 6]; let away = TEAMS[(i * 5 + 1) % 6]; if (away === home) away = TEAMS[(i + 3) % 6];
  // (smarter-ai stage 2: the CLASSIC AI used to come on i % 4 === 3 - the same step as Rise Warrior, so Rise was never
  // played with the new team AI. Now every 7th match, which walks through all four levels; AI=new / LVL=<level> force one)
  const lvl = process.env.LVL || LVLS[i % 4], ai = process.env.AI || (i % 7 === 6 ? 'classic' : 'new');
  return { seed: 1000 + i * 7919, home, away, lvl, ai, weather: WX[Math.floor(i / 2) % 3], tod: TOD[Math.floor(i / 3) % 3] };
};
const parseOne = s => Object.fromEntries(s.trim().split(/\s+/).map(kv => kv.split('=')).map(([k, v]) => [k, k === 'seed' ? +v : v]));
const line = c => `seed=${c.seed} home=${c.home} away=${c.away} lvl=${c.lvl} ai=${c.ai} weather=${c.weather} tod=${c.tod}`;

(async () => {
  const list = process.env.ONE ? [parseOne(process.env.ONE)] : Array.from({ length: +(process.env.MATCHES || 12) }, (_, i) => setup(i + +(process.env.FROM || 0)));   // (t-007: FROM=12 = the next 12 set-ups)
  const br = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await br.newPage({ viewport: { width: 640, height: 360 } }); const errs = []; let cur = -1;
  if (process.env.FORM) await page.addInitScript(f => { window.FORMATION_FORCE = f; }, process.env.FORM);   // role-ai step 4: FORM=4-4-2 / 4-2-3-1 / 4-3-3 = every team in that shape
  page.on('pageerror', e => errs.push({ match: cur, msg: e.message, stack: String(e.stack || '').split('\n').slice(1, 4).join(' | ') }));
  await page.goto(`http://localhost:${process.env.PORT || 8765}/test.html#flow`); await page.waitForFunction(() => window.__hc2 && window.__hc2.home, null, { timeout: 120000 });
  const ver = await page.evaluate(TAPON => { const m = window.__hc2, g = m.game; if (TAPON) TAP_KICK = true; g.loop.sleep(); window.__T = 1e6; window.HC2_NO_DEMO = true; window.HC2_SOAK = true;
    for (const id of ['start', 'flow']) { const e = document.getElementById(id); if (e) e.remove(); }
    m.cameras.main.setVisible(false); window.HC2_STARTED = true; window.__soakInc = [];
    window.__bwHook = x => window.__soakInc.push({ code: x.code, title: x.title, sev: x.sev, msg: String(x.msg).slice(0, 300), half: x.half, min: x.min, who: x.whoName, where: x.where, score: x.score });
    window.__rngOf = seed => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
    window.__RND = Math.random;
    // t-012 WING COUNTERS (wing play, crosses, aerial shots): wrapped around the game's own moves, so they count the same
    // on any version (the before / after soaks of t-012). cross = an open-play ball from wide (or lofted) aimed into the box
    const W = window.__wing = { z() { Object.assign(W, { cross: 0, crossWhip: 0, crossFloat: 0, crossCut: 0, crossH: 0, crossA: 0, crossL: 0, crossR: 0, crossGoalsL: 0, crossGoalsR: 0, headTry: 0, spCross: 0, aerial: 0, head: 0, volley: 0, bike: 0, dhead: 0, airSp: 0,
      goals: 0, aerialGoals: 0, airSpGoals: 0, headGoals: 0, crossGoals: 0, chips: 0, goalLog: [], lastCross: null, lastAerial: null,
      lobs: 0, aimLobs: 0, battles: 0, battleAtt: 0, battleDef: 0,
      airB: 0, airBox: 0, airOut: 0, airHdr: 0, airVol: 0, airAtt: 0, airDef: 0, airGoals: 0, lastBattle: null,
      rcDrop: 0, rcFree: 0, rcDuel: 0, hdrAll: 0, airVolAll: 0, traps: 0 }); } }; W.z();   // (lob receives: the lob drops played, free / contested; every header, every volley off a drop, chest / thigh traps - counted the same on any version)   // (t-034: the AERIAL battles apart from arcade-2's ground duels: in their box or not, header / volley, who won, goals off them)   // (t-008: open-play lobs, hold-aimed lobs, aerial battles and who won them)
    const inBox = (t, team) => Math.abs(t.x - team.goalX) < 16.5 && Math.abs(t.y - 34) < 20.2;
    const aer = (kind, p) => { W.aerial++; W[kind]++; W.lastAerial = { kind, team: p.team, t: m.time.now }; };
    const rk = m.releaseKick; m.releaseKick = function (k, ...rest) { const b = this.ball, had = b.owner === k.p, fx = b.x, fy = b.y, r = rk.call(this, k, ...rest);
      if (had && !b.owner && b.lastP === k.p && k.info.loft) { W.lobs++; if (k.info.aim) W.aimLobs++; }
      if (had && !b.owner && b.lastP === k.p && k.info.tap) W.taps++;          // t-010 tap kicks (only with TAP=1)
      if (had && !b.owner && b.lastP === k.p) W.lastKick = { p: k.p, kind: k.info.shot ? 'shot' : k.info.cross ? 'cross' : 'pass' };
      if (had && !b.owner && b.lastP === k.p && !k.p.keeper) {
        if (k.info.shot) { if (k.info.chip) W.chips++; if (!k.info.special && (k.p.kickAnim === 'volley' || k.p.kickAnim === 'bicycle')) aer(k.p.kickAnim === 'volley' ? 'volley' : 'bike', k.p); }
        else if (inBox({ x: k.tx, y: k.ty }, k.p.team) && !inBox({ x: fx, y: fy }, k.p.team) && Math.abs(k.p.team.goalX - fx) < 40 && (Math.abs(fy - 34) > 12 || b.vz > 2.5)) {
          if (this.setPiece) W.spCross++; else { W.cross++; W[k.info.cross === 'whip' ? 'crossWhip' : k.info.cross === 'float' ? 'crossFloat' : 'crossCut']++; W[k.p.team === this.home ? 'crossH' : 'crossA']++; W.lastCross = { team: k.p.team, t: this.time.now, y: fy < 34 ? 'L' : 'R' }; W['cross' + W.lastCross.y]++; } } }
      return r; };
    // exploit hunt: a runner standing still short of his run's spot (seconds), and a carrier parked out wide in the final 30 m (4 s+)
    W.z0 = W.z; W.z = () => { W.z0(); Object.assign(W, { taps: 0, runIdle: 0, wideHold: 0, wideT: 0, wideIn: 0, wideCross: 0, widePass: 0, wideShot: 0, wideLost: 0, wideOwner: null, lastKick: null }); }; W.z();
    // t-018 TACKLE COUNTERS (Luca 25 Oct: the tackle was spammable): slides and standing challenges that actually went in
    // (a press on cool-down doesn't count), the ones that won the ball, and how often the ball changed teams - wrapped
    // around the game's own moves, so the before / after soaks count the same way
    W.z1 = W.z; W.z = () => { W.z1(); Object.assign(W, { slides: 0, slideWins: 0, challenges: 0, chWins: 0, possCh: 0, possTeam: null }); }; W.z();
    const st0 = m.slideTackle; m.slideTackle = function (p, ...a) { const was = p.state, r = st0.call(this, p, ...a); if (p.state === 'slide' && was !== 'slide') W.slides++; return r; };
    const ch0 = m.challenge; m.challenge = function (p, c, ...a) { const c0 = p.cool, r = ch0.call(this, p, c, ...a); if (p.cool > c0) { W.challenges++; if (this.ball.owner === p) W.chWins++; } return r; };
    const ai0 = m.ai; m.ai = function (dt, ...rest) { const r = ai0.call(this, dt, ...rest), b = this.ball, o = b.owner;
      if (o && !o.keeper && o.team !== W.possTeam) { if (W.possTeam) W.possCh++; W.possTeam = o.team; }   // (t-018)
      for (const p of this.all) if (p.state === 'slide' && p.slideWon && !p._soakWon) { p._soakWon = true; W.slideWins++; } else if (p.state !== 'slide') p._soakWon = false;
      for (const t of [this.home, this.away]) if (t.wing) for (const [p, w] of t.wing) if (!p.busy() && p.speed < 0.3 && len(w.x - p.x, w.y - p.y) > 2) W.runIdle += dt;
      { const wo = W.wideOwner;                                                     // wide in the final 30 m: how did each of those moments end?
        if (wo && o !== wo) { const k = W.lastKick && W.lastKick.p === wo ? W.lastKick.kind : null; W[k === 'cross' ? 'wideCross' : k === 'shot' ? 'wideShot' : k || (o && o.team === wo.team) ? 'widePass' : 'wideLost']++; W.wideOwner = null; }
        if (!W.wideOwner && o && !o.keeper && Math.abs(o.y - 34) > 11 && Math.abs(o.team.goalX - o.x) < 32.5) { W.wideOwner = o; W.wideIn++; W.lastKick = null; } }
      if (o && !o.keeper && Math.abs(o.y - 34) > 11 && Math.abs(o.team.goalX - o.x) < 30 && o.speed < 1) { W.wideT += dt; if (W.wideT >= 4 && W.wideT - dt < 4) W.wideHold++; } else W.wideT = 0;
      return r; };
    if (m.aerialStart) { const as = m.aerialStart, ae = m.aerialEnd;              // t-008 AERIAL BATTLES (only on a version that has them)
      m.aerialStart = function (...a) { W.battles++; const r = as.apply(this, a), A = this.aerial;
        if (A && A.kind !== 'ground') { W.airB++; const d = A.def.p.team, D = A.D, box = Math.abs(D.x - d.ownGoalX) < 16.5 && Math.abs(D.y - 34) < 20.16; W[box ? 'airBox' : 'airOut']++; W[A.move === 'volley' ? 'airVol' : 'airHdr']++; }
        return r; };
      m.aerialEnd = function (...a) { const A = this.aerial, r = ae.apply(this, a); if (A && A.res) W[A.res === 'att' ? 'battleAtt' : 'battleDef']++;
        if (A && A.res && A.kind !== 'ground') { W[A.res === 'att' ? 'airAtt' : 'airDef']++; if (A.res === 'att') W.lastBattle = { team: A.att.p.team, t: m.time.now }; } return r; }; }
    // (every wrapper passes ALL arguments on: t-008 gave header a 3rd one, dir, and a (p, kind) wrapper dropped it - soak runs then
    // played aerial-battle headers differently from the real game. Counting must never change play.)
    const hd = m.header; m.header = function (p, kind, ...rest) { W.hdrAll++; if (kind === 'goal') aer('head', p); return hd.call(this, p, kind, ...rest); };
    // LOB RECEIVES (co-designer 28 Oct): any version - a lob's drop played (lobDuel took it), with one of theirs within its reach (1.35 m) or
    // not; every volley off a dropping ball (airVolley); every chest / thigh trap. The new version's own verdicts come from m.recvN.
    if (m.lobDuel) { const ld = m.lobDuel; m.lobDuel = function (...a) { const b = this.ball, q = b.target;
      const them = q && q.team && q.team.opp.players.some(o => !o.sentOff && !o.keeper && len(o.x - b.x, o.y - b.y) < 1.35);
      const r = ld.apply(this, a); if (r) { W.rcDrop++; W[them && !(b.recv && b.recv.kind === 'clean') ? 'rcDuel' : 'rcFree']++; } return r; }; }
    if (m.airVolley) { const av = m.airVolley; m.airVolley = function (...a) { W.airVolAll++; return av.apply(this, a); }; }
    { const ss = Player.prototype.setState; Player.prototype.setState = function (st, ...a) { if (st === 'trap') W.traps++; return ss.call(this, st, ...a); }; }
    if (m.chestTrap) { const ct = m.chestTrap; m.chestTrap = function (p, ...a) { const b = this.ball; if (b.z < RECV.chestZ) W.traps++; return ct.call(this, p, ...a); }; }   // (the thigh trap has no 'trap' frames)
    const dt0 = m.diveTick; m.diveTick = function (dt, ...rest) { const b = this.ball, h0 = b.how, p = this.diving && this.diving.p, r = dt0.call(this, dt, ...rest);
      if (p && b.how !== h0 && b.how && b.how.kind === 'dheader' && len(p.team.goalX - p.x, 34 - p.y) < 25) aer('dhead', p); return r; };
    const as = m.airSpecial; m.airSpecial = function (p, ...a) { const lv = this.meterOf(p.team).level(); if (lv) aer('airSp', p); return as.call(this, p, ...a); };
    { let ls = m.lastScorer; Object.defineProperty(m, 'lastScorer', { configurable: true, get() { return ls; }, set(v) { ls = v; if (!v || v.own) return; const now = m.time.now; W.goals++;
      const A = W.lastAerial && W.lastAerial.team === v.team && now - W.lastAerial.t < 3500, C = W.lastCross && W.lastCross.team === v.team && now - W.lastCross.t < 6000;
      if (W.lastBattle && W.lastBattle.team === v.team && now - W.lastBattle.t < 3500) W.airGoals++;   // (t-034: a goal straight off an aerial battle won)
      if (A) { W.aerialGoals++; if (W.lastAerial.kind === 'airSp') W.airSpGoals++; if (W.lastAerial.kind === 'head') W.headGoals++; } if (C) { W.crossGoals++; W['crossGoals' + W.lastCross.y]++; } W.goalLog.push(`${v.team.name} ${v.min}' ${v.how || '?'}${A ? ' AERIAL:' + W.lastAerial.kind : ''}${C ? ' from a cross ' + W.lastCross.y : ''} far ${Math.round(v.far || 0)}`); } }); }
    return GAME_VER; }, !!process.env.TAP);
  if (process.env.GOAL_PHYS) await page.evaluate(() => { GOAL_PHYS = true; });   // t-013
  if (process.env.NET_FX) await page.evaluate(v => { NET_FX = v !== '0'; }, process.env.NET_FX);   // t-025: NET_FX=0 = v0.12.0's net (the living net is on in every match)
  // t-021: each check's kind on this version (bug / odd / look...), so the report can lead with the real bugs and put the
  // cosmetic 'look' ones (animation flicker, jitter, stutter: counted, never clipped) in one line
  const SEV = await page.evaluate(() => Object.fromEntries(Object.entries(BW_CHECKS).map(([k, v]) => [k, v.sev])));
  const ERRS = new Set(['CRASH', 'CONSOLE_ERR', 'FROZE']), RANK = { bug: 1, flag: 2, mark: 3, odd: 4, perf: 5, look: 6 };
  const rank = c => (ERRS.has(c) ? 0 : RANK[SEV[c]] ?? 5);
  if (process.env.PACE) await page.evaluate(v => { setPace(v); }, process.env.PACE);   // t-020 (applied at every kick-off)
  await page.evaluate(() => { const m = window.__hc2, W = window.__wing, sp = m.special, sf = m.saveFx;   // t-020: special shots / saves (counting only: all arguments passed on)
    m.special = function (...a) { W.spShot = (W.spShot || 0) + 1; return sp.apply(this, a); };
    m.saveFx = function (gk, ...a) { if (gk && gk.spSave) W.spSave = (W.spSave || 0) + 1; return sf.call(this, gk, ...a); };
    // t-028: what came of each special save at the keeper's line - clash()'s answer (any version: true / 'hand' / false
    // before t-028), and on a version with the visible clash its outcomes (m.clashN: met, held, bounce, tip, hands, body)
    const cl = m.clash; window.__clashN = {}; m.clash = function (...a) { const r = cl.apply(this, a), k = r === true ? 'saved' : r === false ? 'beaten' : String(r);
      window.__clashN[k] = (window.__clashN[k] || 0) + 1; return r; }; });
  const out = { game: ver, at: new Date().toISOString(), matches: [], errors: errs };
  if (process.env.SETUP) await page.evaluate(process.env.SETUP);                  // smarter-ai: SETUP='<js>' runs first (a tunable to try)
  if (process.env.STYLE) await page.evaluate(v => { const [h, a] = v.split(','); window.__styles = { home: h, away: a || 'neutral' }; }, process.env.STYLE);   // smarter-ai: STYLE=press,counter (tools/styles.js)
  await page.evaluate(() => { if (typeof BRAIN_N !== 'undefined') BRAIN_N.reset(); });   // smarter-ai: the team brain's moves, counted over the whole soak
  for (let i = 0; i < list.length; i++) {
    const c = list[i]; cur = i; const t0 = Date.now();
    await page.evaluate(c => { window.__ready = false; window.__hc2.setTeams(c.home, c.away, () => { window.__ready = true; }); }, c);
    await page.waitForFunction(() => window.__ready, null, { timeout: 120000 });
    await page.evaluate(c => { const m = window.__hc2; window.__soakInc = []; window.__wing.z(); Math.random = window.__rngOf(c.seed); m.gpStats = { wood: 0, back: 0, pops: 0, net: 0 };   // (t-013's goal-physics counts)
      m.arcN = { reb: 0, air: 0, rebShots: 0, sp: 0 }; window.__wing.spShot = 0; window.__wing.spSave = 0;   // (t-020's ARCADE counts)
      window.__clashN = {}; m.clashN = {};                                        // (t-028's special-save outcomes)
      m.recvN = null;                                                             // (lob receives: the race's verdicts)
      setAiMode(c.ai); setDiff(c.lvl === 'base' ? 'normal' : c.lvl);
      window.__diffTeams = { home: Object.assign({}, DIFF_TRAITS.base, { lvl: 'base' }), away: Object.assign({}, DIFF_TRAITS[c.lvl] || DIFF_TRAITS.normal, { lvl: c.lvl }) };
      m.mset = { arena: 'loo', tod: c.tod, weather: c.weather, ending: 'none' }; m.applyRules();
      window.__play = { run: 0, live: 0, sp: 0, n: 0, last: null };            // (t-029)
      window.__kw = { k: null, n: 0, max: 0 }; m.kickCapN = null;                // (t-035: the longest a kick waited for its contact frame, in steps; kicks the cap let go / called off)
      m.demo = true; m.kickoff(m.home); }, c);
    let res = null, lastClock = -1, still = 0, stall = null;
    for (let chunk = 0; chunk < 60 && !res; chunk++) {                  // 600 steps (10 game-seconds at 1x) a chunk, at most ~1.3 matches long
      const s = await page.evaluate(() => { const m = window.__hc2, g = m.game;
        for (let k = 0; k < 600 && !m.over; k++) { window.__T += 1000 / 60; const c0 = m.clock; g.step(window.__T, 1000 / 60); if (m.cutIn) m.cutInEnd(); if (m.replay) m.endReplay();
          // t-029 TIME IN PLAY: of the steps where the match clock ran, how many were live play (Bug Watch's live()) and how
          // many sat in a set piece before the kick (its setup + the aim). Counted the same way on any version (before / after)
          const P = window.__play; if (m.clock > c0) { P.run++; if (m.bw && m.bw.live()) P.live++; if (m.setPiece && !m.setPiece.kicked) P.sp++; }
          const sp = m.setPiece; if (sp && !sp.kicked && sp !== P.last) { P.last = sp; P.n++; }
          const KW = window.__kw; if (m.pending) { if (m.pending !== KW.k) { KW.k = m.pending; KW.n = 0; } KW.max = Math.max(KW.max, ++KW.n); } else KW.k = null; }
        return { over: m.over, clock: m.clock, half: m.half }; });
      if (s.clock === lastClock && !s.over) { if (++still >= 3) { stall = `the clock stood at ${Math.round(s.clock)} s (half ${s.half}) for 30 game-seconds`; break; } } else still = 0;
      lastClock = s.clock;
      if (s.over) res = s;
    }
    const st = await page.evaluate(() => { const m = window.__hc2, S = m.mstats || {}, H = S[m.home.name] || {}, A = S[m.away.name] || {}; Math.random = window.__RND;
      const poss = (H.poss || 0) + (A.poss || 0);
      const sum = k => (H[k] || 0) + (A[k] || 0);                       // t-007: the keeper numbers (both sides together)
      // merge of t-007 + t-012 (t-008): both sets of numbers, the keeper's and the wing play's
      return { score: `${m.home.score}-${m.away.score}`, shots: `${H.shots || 0}-${A.shots || 0}`, goals: m.home.score + m.away.score,
        corners: sum('corners'), onT: sum('onT'), onTs: `${H.onT || 0}-${A.onT || 0}`,   // (t-035: per side, to check on target <= shots)
        kickWait: +(window.__kw.max / 60).toFixed(2), kickCap: m.kickCapN ? { off: m.kickCapN.off, gone: m.kickCapN.gone, log: m.kickCapN.log } : null, held: sum('held'), parried: sum('parried'), kOut: sum('kOut'), kIn: sum('kIn'), fouls: `${H.fouls || 0}-${A.fouls || 0}`, offsides: sum('offsides'),   // (t-024)
        play: (P => ({ inPlay: P.run ? +(100 * P.live / P.run).toFixed(1) : 0, spWait: P.n ? +(P.sp / 60 / P.n).toFixed(2) : 0, setPieces: P.n }))(window.__play),   // (t-029)
        possHome: poss ? Math.round(100 * H.poss / poss) : null, clock: Math.round(m.clock), half: m.half, trips: Object.assign({}, m.bw ? m.bw.stats : {}), arc: Object.assign({}, m.arcN || {}), incidents: window.__soakInc.slice(), gp: GOAL_PHYS ? Object.assign({}, m.gpStats) : null,
        recv: Object.assign({}, m.recvN || {}), clash: Object.assign({}, window.__clashN), clashOut: Object.assign({}, m.clashN || {}), wing: Object.fromEntries(Object.entries(window.__wing).filter(([k, v]) => (typeof v === 'number' && k !== 'wideT') || k === 'goalLog')) }; });
    out.matches.push(Object.assign({ n: i + 1, setup: c, repro: line(c), finished: !!res, stall, seconds: Math.round((Date.now() - t0) / 1000) }, st));
    const TR = Object.entries(st.trips).sort((a, b) => rank(a[0]) - rank(b[0]) || b[1] - a[1]), lk = TR.filter(([k]) => SEV[k] === 'look');   // (t-021: bugs first, looks last)
    const tr = [TR.filter(([k]) => SEV[k] !== 'look').map(([k, v]) => `${k} ${v}`).join(', '), lk.length ? `looks: ${lk.map(([k, v]) => `${k} ${v}`).join(', ')}` : ''].filter(Boolean).join(' · ');
    { const w = st.wing; console.log(`   wing: crosses ${w.cross} (whipped ${w.crossWhip}, floated ${w.crossFloat}, other ${w.crossCut}, you ${w.crossH} / them ${w.crossA}) + set-piece ${w.spCross} · aerial shots ${w.aerial} (head ${w.head}, volley ${w.volley}, overhead ${w.bike}, diving ${w.dhead}, air SP ${w.airSp}) · goals ${w.goals}: aerial ${w.aerialGoals}, after a cross ${w.crossGoals} · corners ${st.corners} · chips ${w.chips} · runners idle ${w.runIdle.toFixed(1)} s · parked wide ${w.wideHold}${w.goalLog.length ? '\n     ' + w.goalLog.join('\n     ') : ''}`); }
    { const w = st.wing; console.log(`   aerial battles (t-034): ${w.airB} (in their box ${w.airBox}, outside ${w.airOut} · header ${w.airHdr}, volley ${w.airVol}) · attacker won ${w.airAtt}, defender ${w.airDef} · goals off them ${w.airGoals}`); }
    { const w = st.wing, R = st.recv, f = Object.entries(R).map(([k, v]) => `${k} ${v}`).join(', ');   // lob receives
      console.log(`   lob receives: drops played ${w.rcDrop} (free ${w.rcFree}, contested ${w.rcDuel}) · aerial battles ${w.airB} · headers ${w.hdrAll} · volleys off a drop ${w.airVolAll} · chest / thigh traps ${w.traps}${f ? ` · the race: ${f}` : ''}`); }
    { const w = st.wing; console.log(`   tackles (t-018): slides ${w.slides} (won the ball ${w.slideWins}) · challenges ${w.challenges} (won ${w.chWins}) · fouls ${st.fouls} · possession changes ${w.possCh}`); }
    if (process.env.PACE === 'arcade') { const a = st.arc; console.log(`   arcade: board rebounds ${a.reb} (up for a header ${a.air}) · headers / volleys off them ${a.rebShots} · special shots ${st.wing.spShot} · special saves ${st.wing.spSave} · aerial battles ${st.wing.battles} · SP extras ${a.sp} (aerial ${a.aerial || 0}, rebound ${a.rebound || 0}, save ${a.save || 0})`); }
    console.log(`#${i + 1} ${c.home} v ${c.away} · ${c.lvl} · ${c.ai} AI · ${c.weather} / ${c.tod} · ${res ? 'FT' : 'NOT FINISHED'} ${st.score} · shots ${st.shots} · on target ${st.onT} · corners ${st.corners} · saves held ${st.held} / parried ${st.parried} · keeper touches out ${st.kOut} / in play ${st.kIn} · ${process.env.TAP ? `tap kicks ${st.wing.taps} · ` : ''}${tr || 'no trips'}${st.gp ? ` · woodwork ${st.gp.wood} (back in play ${st.gp.back}) · pop-ups ${st.gp.pops} · net hits ${st.gp.net}` : ''}${stall ? ' · STALL: ' + stall : ''} (${out.matches[i].seconds} s)`);
    { const f = o => Object.entries(o).map(([k, v]) => `${k} ${v}`).join(', ') || 'none';   // t-028: special shots / saves and what came of the saves
      console.log(`   specials (t-028): special shots ${st.wing.spShot || 0} · special saves ${st.wing.spSave || 0} · at his line: ${f(st.clash)}${Object.keys(st.clashOut).length ? ` · clash outcomes: ${f(st.clashOut)}` : ''}`); }
    { const [a, b] = st.shots.split('-').map(Number), [c, d] = st.onTs.split('-').map(Number); st.shotsOk = out.matches[i].shotsOk = c <= a && d <= b;   // t-035
      console.log(`   shots ${st.shots} · on target ${st.onTs} · ${st.shotsOk ? 'on target <= shots' : 'MORE ON TARGET THAN SHOTS'} · longest kick wait ${st.kickWait} s${st.kickCap ? ` · KICK CAP: went off ${st.kickCap.off}, called off ${st.kickCap.gone} (${st.kickCap.log.join('; ')})` : ' · no kick hit its cap'}`); }
    console.log(`   offsides ${st.offsides || 0} · time in play ${st.play.inPlay}% · set pieces ${st.play.setPieces}, ${st.play.spWait} s each before the kick`);   // t-024 (aim: 1-3 a match) · t-029
  }
  const BN = await page.evaluate(() => typeof BRAIN_N === 'undefined' ? null : { seen: BRAIN_N.seen, used: BRAIN_N.used, ids: AI_MOVES.map(m => m.id) });
  await br.close();
  // summary: every Bug Watch code across all matches, errors and bugs first (t-021: the 'look' ones apart, counts only)
  const by = {};
  for (const mt of out.matches) {
    for (const [code, n] of Object.entries(mt.trips)) { const e = by[code] = by[code] || { code, trips: 0, matches: 0, sev: SEV[code] || '', title: '', examples: [] }; e.trips += n; e.matches++; }
    for (const x of mt.incidents) { const e = by[x.code] = by[x.code] || { code: x.code, trips: 0, matches: 0, examples: [] }; e.sev = SEV[x.code] || x.sev; e.title = x.title;
      if (e.examples.length < 3) e.examples.push(`#${mt.n} ${x.min}' ${x.msg} (repro: ${mt.repro})`); }
  }
  out.summary = Object.values(by).sort((a, b) => rank(a.code) - rank(b.code) || b.trips - a.trips);
  const bugs = out.summary.filter(e => e.sev === 'bug'), looks = Object.keys(SEV).filter(c => SEV[c] === 'look').map(c => by[c] || { code: c, trips: 0, matches: 0 });
  out.looks = Object.fromEntries(looks.map(e => [e.code, e.trips]));
  { const T = {}, n = out.matches.length; for (const mt of out.matches) { for (const [k, v] of Object.entries(mt.wing)) if (typeof v === 'number') T[k] = (T[k] || 0) + v;
      T.corners = (T.corners || 0) + mt.corners; const [a, b] = mt.shots.split('-').map(Number); T.shots = (T.shots || 0) + a + b; const [g1, g2] = mt.score.split('-').map(Number); T.score = (T.score || 0) + g1 + g2; }
    out.wing = Object.fromEntries(Object.entries(T).map(([k, v]) => [k, +(v / n).toFixed(2)]));
    if (process.env.PACE === 'arcade') { const A = {}; for (const mt of out.matches) for (const [k, v] of Object.entries(mt.arc)) A[k] = (A[k] || 0) + v; out.arc = Object.fromEntries(Object.entries(A).map(([k, v]) => [k, +(v / n).toFixed(2)]));
      console.log('\nARCADE per match (average of ' + n + '): ' + Object.entries(out.arc).map(([k, v]) => `${k} ${v}`).join(' · ')); }
    { const R = {}; for (const mt of out.matches) for (const [k, v] of Object.entries(mt.recv || {})) R[k] = (R[k] || 0) + v; out.recv = R;   // lob receives: totals
      const rc = (R.clean || 0) + (R.contest || 0) + (R.lost || 0), pc = k => rc ? Math.round(100 * (R[k] || 0) / rc) + '%' : '-';
      console.log(`\nLOB RECEIVES (totals of ${n}): goals ${T.score} · drops played ${T.rcDrop || 0} (free ${T.rcFree || 0}, contested ${T.rcDuel || 0}) · aerial battles ${T.airB || 0} · headers ${T.hdrAll || 0} · volleys off a drop ${T.airVolAll || 0} · chest / thigh traps ${T.traps || 0}` +
        (rc ? `\n  the race (${rc} receives): clean ${R.clean || 0} (${pc('clean')}) · contested ${R.contest || 0} (${pc('contest')}: duel ${R.duel || 0}, battle ${R.battle || 0}) · lost ${R.lost || 0} (${pc('lost')}) · chest ${R.chest || 0} · thigh ${R.thigh || 0}` : '')); }
    console.log('\nWING per match (average of ' + n + '): ' + Object.entries(out.wing).map(([k, v]) => `${k} ${v}`).join(' · '));
    const nw = out.matches.filter(mt => mt.setup.ai === 'new'), N = {};                // (the CLASSIC AI, v0.7.6, is kept as it was: no wing play)
    for (const mt of nw) { for (const k of ['cross', 'aerial', 'airSp', 'airSpGoals', 'aerialGoals', 'goals']) N[k] = (N[k] || 0) + mt.wing[k]; const [a, b] = mt.shots.split('-').map(Number); N.shots = (N.shots || 0) + a + b; N.corners = (N.corners || 0) + mt.corners; }
    if (nw.length) console.log(`  new AI only (${nw.length}): ` + Object.entries(N).map(([k, v]) => `${k} ${(v / nw.length).toFixed(2)}`).join(' · ')); }
  const fin = out.matches.filter(m => m.finished).length, stalls = out.matches.filter(m => m.stall);
  const tot2 = f => out.matches.reduce((a, m) => a + f(m), 0);                // (t-035)
  const tot = k => out.matches.reduce((a, m) => a + (m[k] || 0), 0), per = k => (tot(k) / (out.matches.length || 1)).toFixed(1);   // t-007: per-match keeper numbers
  const md = [`# Soak ${out.game} · ${out.matches.length} matches · ${out.at.slice(0, 16).replace('T', ' ')} UTC`, '',
    `- Finished: ${fin} of ${out.matches.length}${stalls.length ? ` · STALLS: ${stalls.map(m => `#${m.n}`).join(', ')}` : ''}`,
    `- Page errors: ${errs.length}${errs.length ? '' : ' (none)'}`,
    `- Offsides per match (t-024): ${per('offsides')} (total ${tot('offsides')})`,
    (() => { const add = k => out.matches.reduce((a, mt) => { for (const [x, v] of Object.entries(mt[k] || {})) a[x] = (a[x] || 0) + v; return a; }, {}), f = o => Object.entries(o).map(([k, v]) => `${k} ${v}`).join(' · ') || 'none';
      return `- Specials (t-028), totals: special shots ${out.matches.reduce((a, mt) => a + (mt.wing.spShot || 0), 0)} · special saves ${out.matches.reduce((a, mt) => a + (mt.wing.spSave || 0), 0)} · at his line: ${f(add('clash'))} · clash outcomes: ${f(add('clashOut'))}`; })(),
    (n => `- Time in play (t-029): ${(out.matches.reduce((a, m) => a + m.play.inPlay, 0) / n).toFixed(1)}% of the running clock · set pieces ${(out.matches.reduce((a, m) => a + m.play.setPieces, 0) / n).toFixed(1)} a match, ${(out.matches.reduce((a, m) => a + m.play.spWait * m.play.setPieces, 0) / Math.max(1, out.matches.reduce((a, m) => a + m.play.setPieces, 0))).toFixed(2)} s each before the kick`)(out.matches.length || 1),
    `- Per match: goals ${per('goals')} · shots on target ${per('onT')} · corners ${per('corners')} · saves held ${per('held')} · parried ${per('parried')} · keeper touches out ${per('kOut')} / in play ${per('kIn')} (totals ${tot('goals')} / ${tot('onT')} / ${tot('corners')} / ${tot('held')} / ${tot('parried')})`, ...errs.slice(0, 5).map(e => `  - #${e.match + 1}: ${e.msg} ${e.stack}`),
    `- Shots (t-035): on target <= shots in ${out.matches.filter(m => m.shotsOk).length} of ${out.matches.length} matches · longest kick wait ${Math.max(0, ...out.matches.map(m => m.kickWait))} s · kicks the cap let go / called off: ${tot2(m => m.kickCap ? m.kickCap.off : 0)} / ${tot2(m => m.kickCap ? m.kickCap.gone : 0)}`,
    `- Real bugs: ${bugs.length ? bugs.map(e => `${e.code} ${e.trips}`).join(' · ') : 'none'}`, ...bugs.flatMap(e => e.examples.map(x => `  - ${e.code}: ${x}`)),
    `- Looks (cosmetic: counted, no clips): ${looks.map(e => `${e.code} ${e.trips}${e.matches ? ` in ${e.matches} matches` : ''}`).join(' · ')}`, '',
    '| Code | Kind | Trips | In matches | Example |', '| --- | --- | --- | --- | --- |',
    ...out.summary.filter(e => e.sev !== 'look').map(e => `| ${e.code} | ${e.sev || '?'} | ${e.trips} | ${e.matches} | ${(e.examples[0] || '').replace(/\|/g, '/').slice(0, 160)} |`), '',
    '| # | Set-up | Result | Shots | On target | Corners | Held / parried | Possession (home) | Repro |', '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    ...out.matches.map(m => `| ${m.n} | ${m.setup.home} v ${m.setup.away}, ${m.setup.lvl}, ${m.setup.ai} AI, ${m.setup.weather}/${m.setup.tod} | ${m.finished ? m.score : 'not finished'} | ${m.shots} | ${m.onT} | ${m.corners} | ${m.held} / ${m.parried} | ${m.possHome}% | \`${m.repro}\` |`)].join('\n');
  console.log('\n' + md + '\n');
  // smarter-ai stage 2 THE MOVE CHECK (the co-designer: "incorporates future additional gameplay features added"): every
  // move on the team brain's list (brain.js AI_MOVES) that was available to the computer must have been played at least
  // once in 12+ matches - a new move that's switched on but never chosen fails the soak, so nothing gets forgotten again
  if (BN) { const per = id => ['home', 'away'].reduce((a, s) => a + (BN.used[s + '.' + id] || 0), 0), seen = id => ['home', 'away'].reduce((a, s) => a + (BN.seen[s + '.' + id] || 0), 0);
    const never = BN.ids.filter(id => seen(id) > 0 && !per(id)); out.moves = Object.fromEntries(BN.ids.map(id => [id, { played: per(id), available: seen(id) }]));
    console.log(`MOVES (team brain): ${BN.ids.map(id => seen(id) ? `${id} ${per(id)}` : `${id} off`).join(' · ')}`);
    if (never.length && out.matches.length >= 12) { console.log(`MOVE CHECK FAILED: available but never played by the computer in ${out.matches.length} matches: ${never.join(', ')}`); process.exitCode = 1; }
    else if (out.matches.length >= 12) console.log(`MOVE CHECK OK: every available move was played`); }
  if (process.env.OUT) { fs.mkdirSync(process.env.OUT, { recursive: true }); const f = `${process.env.OUT}/soak-${out.at.replace(/[:.]/g, '-').slice(0, 19)}`;
    fs.writeFileSync(f + '.json', JSON.stringify(out, null, 1)); fs.writeFileSync(f + '.md', md); console.log('wrote', f + '.json', f + '.md'); }
  console.log('errors', JSON.stringify(errs.slice(0, 4).map(e => e.msg)));
})();
