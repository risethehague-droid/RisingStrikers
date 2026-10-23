// v0.9.2 DIFFICULTY TRAINER (self-play) - Luca: "Make 4 separate models for difficulty and train them separately through
// self-learning and referencing other successful examples".
// A level = 4 traits { r: reaction speed, a: attacking intelligence, d: defending + marking, k: keeper } (EA FC's four
// AI dials; 1 = the AI as tuned up to v0.9.1). A candidate plays as the AWAY side against the NORMAL side (home), both
// fully computer-run, the real game logic headless (no drawing). Score per match, away minus home:
//   S = goals x1 + shots on target x0.25 + shots x0.05 + (possession share - 0.5) x 2
// Each level is trained on its own: a (1+1) evolution strategy - mutate (a shared skill step + small per-trait noise),
// keep the child if its |S - target| beats the parent's, step size by the 1/5th success rule; traits stay ordered
// easy < normal < hard < rise and close to each other (a level should feel like one opponent, not a lopsided one).
//   node train092.js LEVEL [ITERS] [MATCHES] [SECS]      (LEVEL: easy | hard | rise | normal | probe)
const { chromium } = require('playwright');
const fs = require('fs');
const LEVEL = process.argv[2] || 'probe', ITERS = +(process.argv[3] || 8), MATCHES = +(process.argv[4] || 4), SECS = +(process.argv[5] || 240);
const BASE = process.env.BASE || 'http://localhost:8766/';
const TARGET = { easy: -1.6, normal: 0, hard: 1.1, rise: 2.2 };
const PRIOR = { easy: { r: 0.45, a: 0.45, d: 0.5, k: 0.5 }, normal: { r: 1, a: 1, d: 1, k: 1 }, hard: { r: 1.25, a: 1.25, d: 1.2, k: 1.15 }, rise: { r: 1.9, a: 1.75, d: 1.7, k: 1.6 } };
const BOUNDS = { easy: [0.05, 0.95], normal: [0.85, 1.15], hard: [1.0, 1.6], rise: [1.5, 2.4] };
const OUT = 'train092-out'; fs.mkdirSync(OUT, { recursive: true });
const log = s => { console.log(s); fs.appendFileSync(`${OUT}/log.txt`, s + '\n'); };
(async () => {
  const br = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await br.newPage({ viewport: { width: 640, height: 360 } });
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(BASE + 'test.html#flow');
  await page.waitForFunction(() => window.__hc2 && window.__hc2.home, null, { timeout: 120000 });
  await page.evaluate(() => { const m = window.__hc2, g = m.game; g.loop.sleep(); window.HC2_NO_DEMO = true; window.__T = 1e6;
    for (const id of ['start', 'flow']) { const e = document.getElementById(id); if (e) e.remove(); }
    m.cameras.main.setVisible(false); m.render = function () {}; if (m.bw) { m.bw.tick = () => {}; m.bw.frame = () => {}; }
    m.startReplay = function (l, after) { if (after) window.__afterQ = after; };   // (a replay 'ends' on the next frame) m.flagReplay = () => {}; m.ramiSay = () => {};   // (no replays / commentary in training)
    const ps = m.planSave.bind(m); m.planSave = function (gk) { ps(gk); const S = window.__st, b = m.ball; if (!S || !b.save) return; const t = gk.team === m.home ? 'a' : 'h'; S.sh[t]++; if (!b.save.off) S.sot[t]++; };
    const rng = seed => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
    const RND = Math.random;
    window.__match = (home, away, secs, kickHome, seed) => { Math.random = rng(seed); try { return play(home, away, secs, kickHome); } finally { Math.random = RND; } };   // (the same dice for parent + child: a fair comparison)
    const play = (home, away, secs, kickHome) => { const st = window.__st = { sh: { h: 0, a: 0 }, sot: { h: 0, a: 0 }, poss: { h: 0, a: 0 }, g: { h: 0, a: 0 } };
      window.__diffTeams = { home: { ...home }, away: { ...away } }; m.demo = true;
      const reset = kh => { m.home.score = m.away.score = 0; m.over = false; m.clock = 0; m.half = 1; m.so = null; m.penaltyMode = false; m.dead = null; m.setPiece = null; m.foulScene = null; m.cutIn = null; m.cutInQ = null;
        for (const mt of m.meters || []) mt.reset && mt.reset();
        for (const p of m.all) { if (p.sentOff && !p.benched) { p.sentOff = false; p.hide = false; p.x = p.home.x; p.y = p.home.y; }   // (a fresh squad every match: no red cards carried over)
          if (!p.sentOff) { p.setState('idle', 0); p.stamina = 1; p.tired = false; p.yellows = 0; p.fouls = 0; p.injury = null; p.spSave = 0; p.rig = null; } }
        window.__afterQ = null; m.kickoff(kh ? m.home : m.away); };
      reset(kickHome); let gh = 0, ga = 0;
      for (let i = 0; i < secs * 60; i++) { window.__T += 1000 / 60;
        try { m.sys.step(window.__T, 1000 / 60); if (window.__afterQ) { const f = window.__afterQ; window.__afterQ = null; f(); } } catch (e) { st.err = String(e && e.message || e); break; }
        if (m.cutIn) m.cutInEnd();
        const o = m.ball.owner; if (o) st.poss[o.team === m.home ? 'h' : 'a']++;
        if (m.over || m.half > 2 || m.ht) { gh += m.home.score; ga += m.away.score; if (m.ht) { m.ht = null; } reset(!kickHome); } }
      st.g.h = gh + m.home.score; st.g.a = ga + m.away.score; return st; };
  });
  const evalTraits = async (t, label) => { let S = 0; const parts = [];
    for (let i = 0; i < MATCHES; i++) { const st = await page.evaluate(([h, a, s, k, sd]) => window.__match(h, a, s, k, sd), [PRIOR.normal, t, SECS, i % 2 === 0, 1000 + i * 7919]);
      const pt = st.poss.h + st.poss.a || 1, s = (st.g.a - st.g.h) + 0.25 * (st.sot.a - st.sot.h) + 0.05 * (st.sh.a - st.sh.h) + 2 * (st.poss.a / pt - 0.5);
      if (st.err) log('  match error: ' + st.err); S += s; parts.push(`${st.g.h}-${st.g.a} sot ${st.sot.h}-${st.sot.a} sh ${st.sh.h}-${st.sh.a} poss ${Math.round(100 * st.poss.a / pt)}%`); }
    return { S: S / MATCHES, parts }; };
  if (LEVEL === 'probe') {                                                         // how fast, and how far apart the priors are
    for (const L of ['easy', 'normal', 'hard', 'rise']) { const t0 = Date.now(); const r = await evalTraits(PRIOR[L]); log(`PROBE ${L.padEnd(6)} S ${r.S.toFixed(2)} · ${((Date.now() - t0) / 1000).toFixed(0)} s · ${r.parts.join(' | ')}`); }
    log('errors ' + JSON.stringify(errs.slice(0, 3))); await br.close(); return;
  }
  const tgt = TARGET[LEVEL], [lo, hi] = BOUNDS[LEVEL], K = ['r', 'a', 'd', 'k'];
  const fix = t => { const o = {}; for (const k of K) o[k] = Math.round(Math.min(hi, Math.max(lo, t[k])) * 1000) / 1000; const mean = K.reduce((s, k) => s + o[k], 0) / 4;
    for (const k of K) o[k] = Math.round(Math.min(mean + 0.3, Math.max(mean - 0.3, o[k])) * 1000) / 1000; return o; };   // (traits within 0.3 of each other)
  let par = fix(PRIOR[LEVEL]), pr = await evalTraits(par), sigma = 0.15, wins = 0;
  log(`[${LEVEL}] target S ${tgt} · start ${JSON.stringify(par)} S ${pr.S.toFixed(2)} · ${pr.parts.join(' | ')}`);
  for (let it = 1; it <= ITERS; it++) {
    const dir = Math.sign(tgt - pr.S) || 1, step = dir * sigma * (0.5 + Math.random());   // move the whole side up / down a little, + noise per trait
    const child = fix(Object.fromEntries(K.map(k => [k, par[k] + step + (Math.random() * 2 - 1) * sigma * 0.5])));
    const cr = await evalTraits(child), better = Math.abs(cr.S - tgt) < Math.abs(pr.S - tgt);
    log(`[${LEVEL}] it ${it} σ ${sigma.toFixed(3)} child ${JSON.stringify(child)} S ${cr.S.toFixed(2)} ${better ? 'KEEP' : 'drop'} · ${cr.parts.join(' | ')}`);
    if (better) { par = child; pr = cr; wins++; }
    if (it % 4 === 0) { sigma *= wins / 4 > 0.2 ? 1.22 : 0.82; wins = 0; }               // 1/5th success rule
  }
  const res = { level: LEVEL, target: tgt, traits: par, S: +pr.S.toFixed(3), matches: MATCHES, secs: SECS, at: new Date().toISOString() };
  fs.writeFileSync(`${OUT}/${LEVEL}.json`, JSON.stringify(res, null, 1)); log(`[${LEVEL}] DONE ${JSON.stringify(res)}`);
  log('errors ' + JSON.stringify(errs.slice(0, 3))); await br.close();
})().catch(e => { console.error('TRAIN-FAIL', e); process.exit(1); });
