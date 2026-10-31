// FORWARD STUDY (role-ai step 5, docs/role-ai-plan.md 6.1 + 7: "CF advanced / target / poacher, first-line press").
// Counting only, built on tools/linestudy.js: the same seeded set-ups (IS v IRO both ways), the computer on both sides,
// read every 0.1 s, no random numbers drawn. It counts, per match:
//  * THE FIRST LINE: while a back man (keeper with it at his feet, CB, FB, CDM) has the ball 14 m+ into his own half: how
//    near the other side's nearest striker is, how often a striker is the one pressing, and how the spell ends - a pass
//    BACK / across, a pass FORWARD, or the ball LOST; plus every regain in the opponents' half ("high regains")
//  * SLOT 9 / SLOT 10 (in a 4-4-2 the target man and the advanced forward from step 5 on): the balls each receives, and
//    with his side building from its own half, how far slot 9 is from the ball
//  * shots and goals a match, from the page's match stats
//   node tools/fwdstudy.js          6 matches · MATCHES / FROM / FORM / PORT / SETUP as tools/linestudy.js
//   MOMENTS=1 ...                   also list when a striker gets onto their back man (replay one: tools/preview.js MATCH=1 NOCUT=1 SKIP=<s>)
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const E = process.env, PORT = E.PORT || 8765, N = +(E.MATCHES || 6);
const setup = i => (i % 2 ? { seed: i + 1, home: 'IRO', away: 'IS' } : { seed: i + 1, home: 'IS', away: 'IRO' });

// in the page: one match, sampled every 6 frames (0.1 s) - counting only
function studyMatch() {
  const m = window.__hc2, g = m.game, R = window.__ai = { f: 0, deep: 0, cfD: 0, cfPress: 0, spells: { back: 0, fwd: 0, lost: 0 }, highWin: 0, rec: { 9: 0, 10: 0, other: 0 }, build: 0, s9d: 0, goals: [] };
  const X = (t, x) => (t.side > 0 ? x : 105 - x) - 52.5;                       // team frame: + = towards the goal it attacks
  const backRole = p => p.keeper || p.role === 'CB' || p.role === 'FB' || p.role === 'CDM';
  let prev = null, spell = null;
  const sample = () => {
    const b = m.ball, o = b.owner; if (m.setPiece || m.over) { prev = null; spell = null; return; }
    if (o && prev && o !== prev) {
      if (o.team !== prev.team && X(o.team, o.x) > 0) R.highWin++;
      if (o.team === prev.team && !o.keeper) { if (o.i === 9) R.rec[9]++; else if (o.i === 10) R.rec[10]++; else R.rec.other++; }
      if (spell && spell.p === prev) { const t = prev.team; R.spells[o.team !== t ? 'lost' : X(t, o.x) < X(t, prev.x) + 4 ? 'back' : 'fwd']++; }
      spell = null;
    }
    if (o) prev = o;
    if (!o) return;
    const att = o.team, def = att.opp, ax = X(att, o.x);
    if (backRole(o) && !(o.keeper && o.hands) && ax < -14) {
      if (!spell || spell.p !== o) { spell = { p: o }; if (def.presser && def.presser.role === 'CF' && Math.hypot(def.presser.x - o.x, def.presser.y - o.y) < 12) (R.moments = R.moments || []).push(+(R.f / 60).toFixed(1)); }   // (MOMENTS=1: when a striker is on him - GIF candidates)
      const cfs = def.players.filter(p => p.role === 'CF' && !p.sentOff); if (cfs.length) { R.deep++; R.cfD += Math.min(...cfs.map(p => Math.hypot(p.x - o.x, p.y - o.y))); if (def.presser && def.presser.role === 'CF') R.cfPress++; }
    } else if (spell && spell.p !== o) spell = null;
    if (ax < 0 && !o.keeper) { const s9 = att.players[9]; if (s9 && !s9.sentOff && s9 !== o) { R.build++; R.s9d += Math.hypot(s9.x - o.x, s9.y - o.y); } }
  };
  let sc = [m.home.score, m.away.score];
  window.__aiStep = n => { for (let k = 0; k < n && !m.over; k++) { window.__T += 1000 / 60; g.step(window.__T, 1000 / 60); R.f++;
      if (m.cutIn) m.cutInEnd(); if (m.replay) m.endReplay();
      if (R.f % 6 === 0) sample();
      const s2 = [m.home.score, m.away.score]; if (s2[0] !== sc[0] || s2[1] !== sc[1]) { R.goals.push({ t: +(R.f / 60).toFixed(1) }); sc = s2; } }
    return { over: m.over, clock: m.clock, score: `${m.home.score}-${m.away.score}` }; };
}

(async () => {
  const br = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const all = [];
  for (let i = 0; i < N; i++) {
    const c = setup(i + +(E.FROM || 0)), page = await br.newPage({ viewport: { width: 1280, height: 720 } }); const errs = []; if (E.FORM) await page.addInitScript(f => { window.FORMATION_FORCE = f; }, E.FORM);   // (role-ai step 4: every team in that shape)
    page.on('pageerror', e => errs.push(e.message));
    // exactly tools/preview.js MATCH=1's set-up (so a moment found here replays there)
    await page.goto(`http://localhost:${PORT}/test.html#flow`);
    await page.waitForFunction(() => window.__hc2 && window.__hc2.home, null, { timeout: 120000 });
    if (E.SETUP) await page.evaluate(E.SETUP);                         // (smarter-ai stage 2: SETUP='<js>' first, e.g. a tunable or window.__styles)
    await page.evaluate(() => { const m = window.__hc2; m.game.loop.sleep(); window.__T = 1e6; window.HC2_NO_DEMO = true; window.HC2_STARTED = true;
      for (const id of ['start', 'flow']) { const e = document.getElementById(id); if (e) e.remove(); } });
    await page.evaluate(([h, a]) => { window.__ready = false; window.__hc2.setTeams(h, a, () => { window.__ready = true; }); }, [c.home, c.away]);
    await page.waitForFunction(() => window.__ready, null, { timeout: 120000 });
    await page.evaluate(() => { const m = window.__hc2, st = m.stadium; for (const t of st.tiles) for (const k of t.uniq) if (!m.textures.exists(k)) st.queue.add(k); st.pump(); });
    for (let k = 0; k < 3000; k++) { const done = await page.evaluate(() => { const m = window.__hc2, st = m.stadium; window.__T += 1000 / 60; m.game.step(window.__T, 1000 / 60); return !st.loading && !st.queue.size; }); if (done) break; await new Promise(r => setTimeout(r, 20)); }
    await page.evaluate(studyMatch);
    if (!E.DRAW) await page.evaluate(() => window.__hc2.cameras.main.setVisible(false));   // (no drawing: ~10x faster)
    else await page.evaluate(() => { window.__aiDraw = true; });
    await page.evaluate(seed => { const m = window.__hc2; let s = seed >>> 0;
      Math.random = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
      m.demo = true; m.kickoff(m.home); }, c.seed);
    if (E.UNTIL) { const r = await page.evaluate(n => { window.__aiStep(n); const m = window.__hc2; return `clock ${m.clock.toFixed(1)} score ${m.home.score}-${m.away.score}`; }, Math.round(+E.UNTIL * 60)); console.log(`${c.home} v ${c.away} seed ${c.seed} at ${E.UNTIL} s: ${r}`); await page.close(); continue; }
    let s; for (let k = 0; k < 80; k++) { s = await page.evaluate(() => window.__aiStep(600)); if (E.VERBOSE) console.log(`  ${k}: clock ${Math.round(s.clock)} ${s.score}`); if (s.over) break; }
    const R = await page.evaluate(() => { const R = window.__ai, S = window.__hc2.mstats || {}; R.stats = JSON.parse(JSON.stringify(S)); return R; });
    R.setup = c; R.score = s.score; R.errors = errs; all.push(R);
    console.log(`${c.home} v ${c.away} seed ${c.seed}: ${s.score} goals ${JSON.stringify(R.goals)}`);
    if (E.MOMENTS) console.log(`  striker on their back man at (s): ${(R.moments || []).join(' ')}`);
    await page.close();
  }
  await br.close();
  const S = k => all.reduce((a, R) => a + k(R), 0), sp = { back: S(R => R.spells.back), fwd: S(R => R.spells.fwd), lost: S(R => R.spells.lost) }, spN = sp.back + sp.fwd + sp.lost;
  const shots = S(R => { const s = R.stats || {}; let n = 0; for (const k of Object.keys(s)) if (/shots?$/i.test(k) && typeof s[k] === 'number') n += s[k]; else if (s[k] && typeof s[k] === 'object' && typeof s[k].shots === 'number') n += s[k].shots; return n; });
  console.log('\nSUMMARY ' + JSON.stringify({ matches: all.length,
    goalsPerMatch: +(S(R => R.goals.length) / all.length).toFixed(2), shotsPerMatch: +(shots / all.length).toFixed(1),
    deepSamples: S(R => R.deep), nearestStrikerToTheirBackMan: +(S(R => R.cfD) / Math.max(1, S(R => R.deep))).toFixed(1), strikerIsPresserPct: +(100 * S(R => R.cfPress) / Math.max(1, S(R => R.deep))).toFixed(0),
    deepSpells: spN, endBackPct: +(100 * sp.back / Math.max(1, spN)).toFixed(0), endFwdPct: +(100 * sp.fwd / Math.max(1, spN)).toFixed(0), endLostPct: +(100 * sp.lost / Math.max(1, spN)).toFixed(0),
    highRegainsPerMatch: +(S(R => R.highWin) / all.length).toFixed(1),
    slot9ReceivesPerMatch: +(S(R => R.rec[9]) / all.length).toFixed(1), slot10ReceivesPerMatch: +(S(R => R.rec[10]) / all.length).toFixed(1),
    slot9FromBallBuildingUp: +(S(R => R.s9d) / Math.max(1, S(R => R.build))).toFixed(1),
    errors: S(R => R.errors.length) }, null, 1));
})();
