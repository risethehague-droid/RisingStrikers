// gkcounter.js (Luca 1 Nov: the keeper's special save as a counter + quick pop-ups): plays the Test Lab's three COUNTER
// buttons N times each, headless, time stepped by hand, and says which pop-up each one ended in (and goals).
// Serve the game and build the Lab page first: (cd game && python3 -m http.server 8765) · bash tools/mklab.sh
//   N=5 node tools/gkcounter.js        (ONLY=save,hand,beaten; PORT=8765)
const { chromium } = require('playwright');
const E = process.env, PORT = E.PORT || 8765, N = +E.N || 5, ONLY = (E.ONLY || 'save,hand,beaten').split(',');
(async () => {
  const br = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await (await br.newContext({ viewport: { width: 1366, height: 768 } })).newPage(), errs = [];
  page.on('pageerror', e => errs.push(`${e.message} ${(e.stack || '').split('\n').slice(1, 3).join(' | ')}`));
  await page.goto(`http://localhost:${PORT}/labtest.html`);
  await page.waitForFunction(() => window.__lab && window.__lab.active, null, { timeout: 120000 });
  await page.evaluate(() => { window.__hc2.game.loop.sleep(); window.__T = 5e6; });
  let bad = 0;
  for (const k of ONLY) {
    const out = {};
    for (let i = 0; i < N; i++) {
      await page.evaluate(k => window.__lab.api.fpMove('gkc-' + k), k);
      const res = await page.evaluate(() => { const m = window.__hc2, g = m.game; m.gkcLast = null; let ring = 0;
        for (let s = 0; s < 7 * 60; s++) { window.__T += 1000 / 60; g.step(window.__T, 1000 / 60);
          if (m.gkcG && m.gkcG.commandBuffer && m.gkcG.commandBuffer.length) ring++;
          if (m.gkcLast && (m.ball.owner || m.ball.inNet || s > 400)) break; }
        return { last: window.__lab.run.last, o: (m.gkcLast ? m.gkcLast.out : 'none') + (m.ball.inNet ? '+goal' : ''), ring }; });
      if (E.V) console.log('   ', res.last, res.o, 'charge-ring frames', res.ring);
      out[res.o] = (out[res.o] || 0) + 1;
    }
    const ok = (out[k] || 0) + (out[k + '+goal'] || 0) === N;   // (beaten: through his hands it can still loop up off him, t-013)
    if (!ok) bad++;
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${k.padEnd(7)} ${JSON.stringify(out)}`);
  }
  console.log('errors', JSON.stringify(errs.slice(0, 5)));
  await br.close(); process.exit(bad || errs.length ? 1 : 0);
})();
