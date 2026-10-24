// SOAK: computer v computer matches headless, one after another, across different set-ups, with BUG WATCH on.
// (Luca 23 Oct 22:36: "run simulations of the games in the background catching any bugs and improving".) It catches
// what one smoke run can't: rare stalls, stuck moves, broken numbers, page errors, and how often the odd things happen.
// Every match is seeded, so any finding replays exactly: the summary prints a repro line for each match.
//
//   node tools/soak.js                                   12 full matches (2 x 3 real minutes each, fast-forwarded)
//   MATCHES=30 node tools/soak.js                        more
//   GOAL_PHYS=1 node tools/soak.js                       t-013: the goal physics forced ON in the matches (it's off in a match
//                                                        until Luca's OK); the summary adds woodwork hits, rebounds back in play, pop-ups
//   FROM=12 MATCHES=12 node tools/soak.js                the next 12 set-ups (a second sample)
//   ONE='seed=8919 home=IS away=IRO lvl=hard ai=new weather=rain tod=night' node tools/soak.js    replay one match
//   OUT=soak-out node tools/soak.js                      also write soak-out/soak-<time>.json and .md
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
  return { seed: 1000 + i * 7919, home, away, lvl: LVLS[i % 4], ai: i % 4 === 3 ? 'classic' : 'new', weather: WX[Math.floor(i / 2) % 3], tod: TOD[Math.floor(i / 3) % 3] };
};
const parseOne = s => Object.fromEntries(s.trim().split(/\s+/).map(kv => kv.split('=')).map(([k, v]) => [k, k === 'seed' ? +v : v]));
const line = c => `seed=${c.seed} home=${c.home} away=${c.away} lvl=${c.lvl} ai=${c.ai} weather=${c.weather} tod=${c.tod}`;

(async () => {
  const list = process.env.ONE ? [parseOne(process.env.ONE)] : Array.from({ length: +(process.env.MATCHES || 12) }, (_, i) => setup(i + +(process.env.FROM || 0)));   // (t-007: FROM=12 = the next 12 set-ups)
  const br = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await br.newPage({ viewport: { width: 640, height: 360 } }); const errs = []; let cur = -1;
  page.on('pageerror', e => errs.push({ match: cur, msg: e.message, stack: String(e.stack || '').split('\n').slice(1, 4).join(' | ') }));
  await page.goto(`http://localhost:${process.env.PORT || 8765}/test.html#flow`); await page.waitForFunction(() => window.__hc2 && window.__hc2.home, null, { timeout: 120000 });
  const ver = await page.evaluate(() => { const m = window.__hc2, g = m.game; g.loop.sleep(); window.__T = 1e6; window.HC2_NO_DEMO = true; window.HC2_SOAK = true;
    for (const id of ['start', 'flow']) { const e = document.getElementById(id); if (e) e.remove(); }
    m.cameras.main.setVisible(false); window.HC2_STARTED = true; window.__soakInc = [];
    window.__bwHook = x => window.__soakInc.push({ code: x.code, title: x.title, sev: x.sev, msg: String(x.msg).slice(0, 300), half: x.half, min: x.min, who: x.whoName, where: x.where, score: x.score });
    window.__rngOf = seed => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
    window.__RND = Math.random;
    // t-012 WING COUNTERS (wing play, crosses, aerial shots): wrapped around the game's own moves, so they count the same
    // on any version (the before / after soaks of t-012). cross = an open-play ball from wide (or lofted) aimed into the box
    const W = window.__wing = { z() { Object.assign(W, { cross: 0, crossWhip: 0, crossFloat: 0, crossCut: 0, crossH: 0, crossA: 0, crossL: 0, crossR: 0, crossGoalsL: 0, crossGoalsR: 0, headTry: 0, spCross: 0, aerial: 0, head: 0, volley: 0, bike: 0, dhead: 0, airSp: 0,
      goals: 0, aerialGoals: 0, airSpGoals: 0, headGoals: 0, crossGoals: 0, chips: 0, goalLog: [], lastCross: null, lastAerial: null,
      lobs: 0, aimLobs: 0, battles: 0, battleAtt: 0, battleDef: 0 }); } }; W.z();   // (t-008: open-play lobs, hold-aimed lobs, aerial battles and who won them)
    const inBox = (t, team) => Math.abs(t.x - team.goalX) < 16.5 && Math.abs(t.y - 34) < 20.2;
    const aer = (kind, p) => { W.aerial++; W[kind]++; W.lastAerial = { kind, team: p.team, t: m.time.now }; };
    const rk = m.releaseKick; m.releaseKick = function (k, ...rest) { const b = this.ball, had = b.owner === k.p, fx = b.x, fy = b.y, r = rk.call(this, k, ...rest);
      if (had && !b.owner && b.lastP === k.p && k.info.loft) { W.lobs++; if (k.info.aim) W.aimLobs++; }
      if (had && !b.owner && b.lastP === k.p) W.lastKick = { p: k.p, kind: k.info.shot ? 'shot' : k.info.cross ? 'cross' : 'pass' };
      if (had && !b.owner && b.lastP === k.p && !k.p.keeper) {
        if (k.info.shot) { if (k.info.chip) W.chips++; if (!k.info.special && (k.p.kickAnim === 'volley' || k.p.kickAnim === 'bicycle')) aer(k.p.kickAnim === 'volley' ? 'volley' : 'bike', k.p); }
        else if (inBox({ x: k.tx, y: k.ty }, k.p.team) && !inBox({ x: fx, y: fy }, k.p.team) && Math.abs(k.p.team.goalX - fx) < 40 && (Math.abs(fy - 34) > 12 || b.vz > 2.5)) {
          if (this.setPiece) W.spCross++; else { W.cross++; W[k.info.cross === 'whip' ? 'crossWhip' : k.info.cross === 'float' ? 'crossFloat' : 'crossCut']++; W[k.p.team === this.home ? 'crossH' : 'crossA']++; W.lastCross = { team: k.p.team, t: this.time.now, y: fy < 34 ? 'L' : 'R' }; W['cross' + W.lastCross.y]++; } } }
      return r; };
    // exploit hunt: a runner standing still short of his run's spot (seconds), and a carrier parked out wide in the final 30 m (4 s+)
    W.z0 = W.z; W.z = () => { W.z0(); Object.assign(W, { runIdle: 0, wideHold: 0, wideT: 0, wideIn: 0, wideCross: 0, widePass: 0, wideShot: 0, wideLost: 0, wideOwner: null, lastKick: null }); }; W.z();
    const ai0 = m.ai; m.ai = function (dt, ...rest) { const r = ai0.call(this, dt, ...rest), b = this.ball, o = b.owner;
      for (const t of [this.home, this.away]) if (t.wing) for (const [p, w] of t.wing) if (!p.busy() && p.speed < 0.3 && len(w.x - p.x, w.y - p.y) > 2) W.runIdle += dt;
      { const wo = W.wideOwner;                                                     // wide in the final 30 m: how did each of those moments end?
        if (wo && o !== wo) { const k = W.lastKick && W.lastKick.p === wo ? W.lastKick.kind : null; W[k === 'cross' ? 'wideCross' : k === 'shot' ? 'wideShot' : k || (o && o.team === wo.team) ? 'widePass' : 'wideLost']++; W.wideOwner = null; }
        if (!W.wideOwner && o && !o.keeper && Math.abs(o.y - 34) > 11 && Math.abs(o.team.goalX - o.x) < 32.5) { W.wideOwner = o; W.wideIn++; W.lastKick = null; } }
      if (o && !o.keeper && Math.abs(o.y - 34) > 11 && Math.abs(o.team.goalX - o.x) < 30 && o.speed < 1) { W.wideT += dt; if (W.wideT >= 4 && W.wideT - dt < 4) W.wideHold++; } else W.wideT = 0;
      return r; };
    if (m.aerialStart) { const as = m.aerialStart, ae = m.aerialEnd;              // t-008 AERIAL BATTLES (only on a version that has them)
      m.aerialStart = function (...a) { W.battles++; return as.apply(this, a); };
      m.aerialEnd = function (...a) { const A = this.aerial, r = ae.apply(this, a); if (A && A.res) W[A.res === 'att' ? 'battleAtt' : 'battleDef']++; return r; }; }
    // (every wrapper passes ALL arguments on: t-008 gave header a 3rd one, dir, and a (p, kind) wrapper dropped it - soak runs then
    // played aerial-battle headers differently from the real game. Counting must never change play.)
    const hd = m.header; m.header = function (p, kind, ...rest) { if (kind === 'goal') aer('head', p); return hd.call(this, p, kind, ...rest); };
    const dt0 = m.diveTick; m.diveTick = function (dt, ...rest) { const b = this.ball, h0 = b.how, p = this.diving && this.diving.p, r = dt0.call(this, dt, ...rest);
      if (p && b.how !== h0 && b.how && b.how.kind === 'dheader' && len(p.team.goalX - p.x, 34 - p.y) < 25) aer('dhead', p); return r; };
    const as = m.airSpecial; m.airSpecial = function (p, ...a) { const lv = this.meterOf(p.team).level(); if (lv) aer('airSp', p); return as.call(this, p, ...a); };
    { let ls = m.lastScorer; Object.defineProperty(m, 'lastScorer', { configurable: true, get() { return ls; }, set(v) { ls = v; if (!v || v.own) return; const now = m.time.now; W.goals++;
      const A = W.lastAerial && W.lastAerial.team === v.team && now - W.lastAerial.t < 3500, C = W.lastCross && W.lastCross.team === v.team && now - W.lastCross.t < 6000;
      if (A) { W.aerialGoals++; if (W.lastAerial.kind === 'airSp') W.airSpGoals++; if (W.lastAerial.kind === 'head') W.headGoals++; } if (C) { W.crossGoals++; W['crossGoals' + W.lastCross.y]++; } W.goalLog.push(`${v.team.name} ${v.min}' ${v.how || '?'}${A ? ' AERIAL:' + W.lastAerial.kind : ''}${C ? ' from a cross ' + W.lastCross.y : ''} far ${Math.round(v.far || 0)}`); } }); }
    return GAME_VER; });
  if (process.env.GOAL_PHYS) await page.evaluate(() => { GOAL_PHYS = true; });   // t-013
  const out = { game: ver, at: new Date().toISOString(), matches: [], errors: errs };
  for (let i = 0; i < list.length; i++) {
    const c = list[i]; cur = i; const t0 = Date.now();
    await page.evaluate(c => { window.__ready = false; window.__hc2.setTeams(c.home, c.away, () => { window.__ready = true; }); }, c);
    await page.waitForFunction(() => window.__ready, null, { timeout: 120000 });
    await page.evaluate(c => { const m = window.__hc2; window.__soakInc = []; window.__wing.z(); Math.random = window.__rngOf(c.seed); m.gpStats = { wood: 0, back: 0, pops: 0, net: 0 };   // (t-013's goal-physics counts)
      setAiMode(c.ai); setDiff(c.lvl === 'base' ? 'normal' : c.lvl);
      window.__diffTeams = { home: Object.assign({}, DIFF_TRAITS.base, { lvl: 'base' }), away: Object.assign({}, DIFF_TRAITS[c.lvl] || DIFF_TRAITS.normal, { lvl: c.lvl }) };
      m.mset = { arena: 'loo', tod: c.tod, weather: c.weather, ending: 'none' }; m.applyRules();
      m.demo = true; m.kickoff(m.home); }, c);
    let res = null, lastClock = -1, still = 0, stall = null;
    for (let chunk = 0; chunk < 60 && !res; chunk++) {                  // 600 steps (10 game-seconds at 1x) a chunk, at most ~1.3 matches long
      const s = await page.evaluate(() => { const m = window.__hc2, g = m.game;
        for (let k = 0; k < 600 && !m.over; k++) { window.__T += 1000 / 60; g.step(window.__T, 1000 / 60); if (m.cutIn) m.cutInEnd(); if (m.replay) m.endReplay(); }
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
        corners: sum('corners'), onT: sum('onT'), held: sum('held'), parried: sum('parried'), kOut: sum('kOut'), kIn: sum('kIn'), fouls: `${H.fouls || 0}-${A.fouls || 0}`,
        possHome: poss ? Math.round(100 * H.poss / poss) : null, clock: Math.round(m.clock), half: m.half, trips: Object.assign({}, m.bw ? m.bw.stats : {}), incidents: window.__soakInc.slice(), gp: GOAL_PHYS ? Object.assign({}, m.gpStats) : null,
        wing: Object.fromEntries(Object.entries(window.__wing).filter(([k, v]) => (typeof v === 'number' && k !== 'wideT') || k === 'goalLog')) }; });
    out.matches.push(Object.assign({ n: i + 1, setup: c, repro: line(c), finished: !!res, stall, seconds: Math.round((Date.now() - t0) / 1000) }, st));
    const tr = Object.entries(st.trips).map(([k, v]) => `${k} ${v}`).join(', ');
    { const w = st.wing; console.log(`   wing: crosses ${w.cross} (whipped ${w.crossWhip}, floated ${w.crossFloat}, other ${w.crossCut}, you ${w.crossH} / them ${w.crossA}) + set-piece ${w.spCross} · aerial shots ${w.aerial} (head ${w.head}, volley ${w.volley}, overhead ${w.bike}, diving ${w.dhead}, air SP ${w.airSp}) · goals ${w.goals}: aerial ${w.aerialGoals}, after a cross ${w.crossGoals} · corners ${st.corners} · chips ${w.chips} · runners idle ${w.runIdle.toFixed(1)} s · parked wide ${w.wideHold}${w.goalLog.length ? '\n     ' + w.goalLog.join('\n     ') : ''}`); }
    console.log(`#${i + 1} ${c.home} v ${c.away} · ${c.lvl} · ${c.ai} AI · ${c.weather} / ${c.tod} · ${res ? 'FT' : 'NOT FINISHED'} ${st.score} · shots ${st.shots} · on target ${st.onT} · corners ${st.corners} · saves held ${st.held} / parried ${st.parried} · keeper touches out ${st.kOut} / in play ${st.kIn} · ${tr || 'no trips'}${st.gp ? ` · woodwork ${st.gp.wood} (back in play ${st.gp.back}) · pop-ups ${st.gp.pops} · net hits ${st.gp.net}` : ''}${stall ? ' · STALL: ' + stall : ''} (${out.matches[i].seconds} s)`);
  }
  await br.close();
  // summary: every Bug Watch code across all matches, bugs first
  const by = {};
  for (const mt of out.matches) {
    for (const [code, n] of Object.entries(mt.trips)) { const e = by[code] = by[code] || { code, trips: 0, matches: 0, sev: '', title: '', examples: [] }; e.trips += n; e.matches++; }
    for (const x of mt.incidents) { const e = by[x.code] = by[x.code] || { code: x.code, trips: 0, matches: 0, examples: [] }; e.sev = x.sev; e.title = x.title;
      if (e.examples.length < 3) e.examples.push(`#${mt.n} ${x.min}' ${x.msg} (repro: ${mt.repro})`); }
  }
  out.summary = Object.values(by).sort((a, b) => (a.sev === 'bug' ? 0 : 1) - (b.sev === 'bug' ? 0 : 1) || b.trips - a.trips);
  { const T = {}, n = out.matches.length; for (const mt of out.matches) { for (const [k, v] of Object.entries(mt.wing)) if (typeof v === 'number') T[k] = (T[k] || 0) + v;
      T.corners = (T.corners || 0) + mt.corners; const [a, b] = mt.shots.split('-').map(Number); T.shots = (T.shots || 0) + a + b; const [g1, g2] = mt.score.split('-').map(Number); T.score = (T.score || 0) + g1 + g2; }
    out.wing = Object.fromEntries(Object.entries(T).map(([k, v]) => [k, +(v / n).toFixed(2)]));
    console.log('\nWING per match (average of ' + n + '): ' + Object.entries(out.wing).map(([k, v]) => `${k} ${v}`).join(' · '));
    const nw = out.matches.filter(mt => mt.setup.ai === 'new'), N = {};                // (the CLASSIC AI, v0.7.6, is kept as it was: no wing play)
    for (const mt of nw) { for (const k of ['cross', 'aerial', 'airSp', 'airSpGoals', 'aerialGoals', 'goals']) N[k] = (N[k] || 0) + mt.wing[k]; const [a, b] = mt.shots.split('-').map(Number); N.shots = (N.shots || 0) + a + b; N.corners = (N.corners || 0) + mt.corners; }
    if (nw.length) console.log(`  new AI only (${nw.length}): ` + Object.entries(N).map(([k, v]) => `${k} ${(v / nw.length).toFixed(2)}`).join(' · ')); }
  const fin = out.matches.filter(m => m.finished).length, stalls = out.matches.filter(m => m.stall);
  const tot = k => out.matches.reduce((a, m) => a + (m[k] || 0), 0), per = k => (tot(k) / (out.matches.length || 1)).toFixed(1);   // t-007: per-match keeper numbers
  const md = [`# Soak ${out.game} · ${out.matches.length} matches · ${out.at.slice(0, 16).replace('T', ' ')} UTC`, '',
    `- Finished: ${fin} of ${out.matches.length}${stalls.length ? ` · STALLS: ${stalls.map(m => `#${m.n}`).join(', ')}` : ''}`,
    `- Page errors: ${errs.length}${errs.length ? '' : ' (none)'}`,
    `- Per match: goals ${per('goals')} · shots on target ${per('onT')} · corners ${per('corners')} · saves held ${per('held')} · parried ${per('parried')} · keeper touches out ${per('kOut')} / in play ${per('kIn')} (totals ${tot('goals')} / ${tot('onT')} / ${tot('corners')} / ${tot('held')} / ${tot('parried')})`, ...errs.slice(0, 5).map(e => `  - #${e.match + 1}: ${e.msg} ${e.stack}`), '',
    '| Code | Kind | Trips | In matches | Example |', '| --- | --- | --- | --- | --- |',
    ...out.summary.map(e => `| ${e.code} | ${e.sev || '?'} | ${e.trips} | ${e.matches} | ${(e.examples[0] || '').replace(/\|/g, '/').slice(0, 160)} |`), '',
    '| # | Set-up | Result | Shots | On target | Corners | Held / parried | Possession (home) | Repro |', '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    ...out.matches.map(m => `| ${m.n} | ${m.setup.home} v ${m.setup.away}, ${m.setup.lvl}, ${m.setup.ai} AI, ${m.setup.weather}/${m.setup.tod} | ${m.finished ? m.score : 'not finished'} | ${m.shots} | ${m.onT} | ${m.corners} | ${m.held} / ${m.parried} | ${m.possHome}% | \`${m.repro}\` |`)].join('\n');
  console.log('\n' + md + '\n');
  if (process.env.OUT) { fs.mkdirSync(process.env.OUT, { recursive: true }); const f = `${process.env.OUT}/soak-${out.at.replace(/[:.]/g, '-').slice(0, 19)}`;
    fs.writeFileSync(f + '.json', JSON.stringify(out, null, 1)); fs.writeFileSync(f + '.md', md); console.log('wrote', f + '.json', f + '.md'); }
  console.log('errors', JSON.stringify(errs.slice(0, 4).map(e => e.msg)));
})();
