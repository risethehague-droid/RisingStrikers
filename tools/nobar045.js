// t-045 THE NO-BARS CATCH, counted (card design-q-keeper): FREE PLAY's NO BARS move again and again, headless - your
// special v their keeper with no SP bars. v2 (Luca 31 Oct): an LV1 v a set keeper is stopped about 1 in 8 (ball.js
// NOBAR_SAVE: 8-17% is fine) and a stop never ends in the net (it plays on 3 s after the stop to check: 'in after' must
// be 0); an LV2 (MV=gk-nobar2) and an off-balance keeper (mode off) never stop it. One line per mode.
// Serve the game and build the Lab page first: (cd game && python3 -m http.server 8765) · bash tools/mklab.sh
//   node tools/nobar045.js          PORT=8765, N=200 (shots per mode), MODES=set,off, MV=gk-nobar (LV1) or gk-nobar2 (LV2)
const { chromium } = require('playwright');
const E = process.env, PORT = E.PORT || 8765, N = +(E.N || 200), MODES = (E.MODES || 'set,off').split(','), MV = E.MV || 'gk-nobar';
(async () => {
  const br = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await br.newPage({ viewport: { width: 640, height: 360 } }); const errs = [];
  page.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' | ')));
  await page.goto(`http://localhost:${PORT}/labtest.html`); await page.waitForFunction(() => window.__lab && window.__lab.active, null, { timeout: 120000 });
  for (const mode of MODES) {
    const res = await page.evaluate(([mode, N, MV]) => { const L = window.__lab, m = window.__hc2, g = m.game; g.loop.sleep(); m.cameras.main.setVisible(false);
      window.HC2_TEST_FAST = true; let T = window.__T || 5e6; const c = { shots: 0, goal: 0, stopped: 0, other: 0, onT: 0, how: {}, inAfter: 0 };
      L.nobarOff = mode === 'off';
      for (let i = 0; i < N; i++) { L.api.fpMove(MV); let goal = false, stop = null, sp = false; m.noBarLast = null;
        for (let k = 0; k < 60 * 6; k++) { T += 1000 / 60; g.step(T, 1000 / 60); if (m.cutIn) m.cutInEnd(); if (m.replay) m.endReplay();
          if (m.ball.special) sp = true; if (m.ball.inNet) goal = true; if (m.noBarLast && !stop) stop = m.noBarLast; if (goal || stop) break; }
        if (stop) for (let k = 0; k < 60 * 3; k++) { T += 1000 / 60; g.step(T, 1000 / 60); if (m.cutIn) m.cutInEnd(); if (m.replay) m.endReplay(); if (m.ball.inNet) { c.inAfter++; break; } }
        c.shots++; if (sp) c.onT++;
        if (stop) { c.stopped++; c.how[stop.how] = (c.how[stop.how] || 0) + 1; } else if (goal) c.goal++; else c.other++; }
      window.__T = T; L.nobarOff = false; return c; }, [mode, N, MV]);
    const pct = x => (100 * x / res.shots).toFixed(1) + '%';
    console.log(`${MV} ${mode === 'set' ? 'SET keeper     ' : 'OFF BALANCE    '} shots ${res.shots} (special ${res.onT}) · goals ${res.goal} (${pct(res.goal)}) · STOPPED ${res.stopped} (${pct(res.stopped)}) ${JSON.stringify(res.how)} · in after ${res.inAfter} · other ${res.other}`);
  }
  console.log('errors', JSON.stringify(errs.slice(0, 4))); await br.close();
})();
