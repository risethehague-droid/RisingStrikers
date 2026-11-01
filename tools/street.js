// STREET 5s check (t-003): computer v computer on the court, headless, time stepped by hand. Prints the score, what
// happened (shots, wall hits, wall passes, fouls, stalls) and any page errors.
//   node tools/street.js                 4 matches  (MATCHES=n, LVL=normal, PORT=8765, SNAP=out.png a screenshot at 20 s)
const { chromium } = require('playwright');
(async () => { const br = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await br.newPage({ viewport: { width: 1152, height: 648 } }); const errs = []; page.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  await page.goto(`http://localhost:${process.env.PORT || 8765}/index.html`); await page.waitForFunction(() => window.__hc2 && window.__hc2.home, null, { timeout: 120000 });
  const N = +(process.env.MATCHES || 4), lvl = process.env.LVL || 'normal', TEAMS = ['IS', 'IRO', 'USCS', 'LUC', 'THUAS', 'AUC'];
  for (let i = 0; i < N; i++) {
    const h = TEAMS[i % 6], a = TEAMS[(i * 5 + 1) % 6] === h ? TEAMS[(i + 3) % 6] : TEAMS[(i * 5 + 1) % 6];
    await page.evaluate(([h, a, lvl]) => new Promise(res => { const m = window.__hc2; window.HC2_NO_DEMO = true; setDiff(lvl);
      for (const id of ['start']) { const e = document.getElementById(id); if (e) e.remove(); }
      m.streetStart(h, a, true, () => { window.HC2_STARTED = true; }); setTimeout(res, 600); }), [h, a, lvl]);
    if (process.env.SNAP && i === 0) { await page.evaluate(() => { const m = window.__hc2, g = m.game; g.loop.sleep(); let T = window.__T || 1e6; for (let k = 0; k < 60 * 20; k++) { T += 1000 / 60; g.step(T, 1000 / 60); } window.__T = T; g.loop.wake(); });
      await page.waitForTimeout(400); await page.screenshot({ path: process.env.SNAP }); }
    const r = await page.evaluate(() => { const m = window.__hc2, g = m.game; g.loop.sleep(); let T = window.__T || 1e6; const b = m.ball;
      const S = { shots: 0, stall: 0, maxStill: 0, out: 0, offCourt: 0 }; let still = 0, lx = b.x, ly = b.y;
      const sh = m.doShot ? m.doShot.bind(m) : null; if (sh) m.doShot = (...q) => { S.shots++; return sh(...q); };
      const how = {}; let sc = 0;
      for (let k = 0; k < 60 * 60 * 8 && !m.over; k++) { T += 1000 / 60; g.step(T, 1000 / 60); if (m.cutIn) m.cutInEnd(); if (m.replay) m.endReplay();
        if (m.home.score + m.away.score > sc) { sc = m.home.score + m.away.score; const L = m.lastScorer || {}, w = (L.how || 'other') + (L.far ? (L.far < 6 ? '<6' : L.far < 12 ? '<12' : '12+') : ''); how[w] = (how[w] || 0) + 1; }
        if (Math.hypot(b.x - lx, b.y - ly) < 0.02 && !m.freeze && !m.setPiece && !m.dead) still++; else { S.maxStill = Math.max(S.maxStill, still); still = 0; } lx = b.x; ly = b.y;
        if (!b.inNet && (b.x < -0.5 || b.x > PITCH_L + 0.5 || b.y < COURT_Y0 - 0.5 || b.y > COURT_Y1 + 0.5)) S.out++;
        for (const p of m.all) if (!p.sentOff && (p.x < 0 || p.x > PITCH_L || p.y < COURT_Y0 || p.y > COURT_Y1)) S.offCourt++; }
      window.__T = T; g.loop.wake(); if (sh) m.doShot = sh;
      const st = m.mstats || {}, H = st[m.home.name] || {}, A = st[m.away.name] || {};
      return { score: `${m.home.name} ${m.home.score}-${m.away.score} ${m.away.name}`, over: m.over, clock: Math.round(m.clock / 60), ...S, maxStill: (S.maxStill / 60).toFixed(1) + 's', walls: m.stN, how, fouls: (H.fouls || 0) + (A.fouls || 0),
        bw: m.bw ? m.bw.list.map(x => x.code || x.kind || x.type).join(',') : '' }; });
    console.log(JSON.stringify(r));
  }
  console.log('errors', JSON.stringify(errs.slice(0, 6))); await br.close(); })();
