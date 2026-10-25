// run every test of one Lab group headless (GROUP=CH), print the outcome of each
// (t-018: a test can run longer than 14 s with its own maxT, TT5's 20 s)
const { chromium } = require('playwright');
(async () => {
  const br = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await br.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = []; page.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' | ')));
  await page.goto(`http://localhost:${process.env.PORT || 8765}/labtest.html`);
  await page.waitForFunction(() => window.__lab && window.__lab.active, null, { timeout: 120000 });
  const res = await page.evaluate(([G, REP]) => { const L = window.__lab, m = window.__hc2, g = m.game; g.loop.sleep(); let T = 5e6; const out = [];
    const gi = L.groups.findIndex(x => x.id === G);
    for (let rep = 0; rep < REP; rep++) for (let i = 0; i < L.groups[gi].tests.length; i++) { L.g = gi; L.i = i; L.api.start(rep > 0); const r = L.run;
      for (let k = 0; k < 60 * (r.sc.maxT || 14); k++) { T += 1000 / 60; g.step(T, 1000 / 60); if (r.result && r.t > r.endT) break; }
      out.push([r.sc.id, r.sc.name, r.result ? r.result.o : 'not finished']); }
    return out; }, [process.env.GROUP || 'CH', +(process.env.REP || 1)]);
  for (const [id, n, o] of res) console.log(`${id.padEnd(5)} ${n.padEnd(42).slice(0, 42)} → ${o}`);
  console.log('errors', JSON.stringify(errs.slice(0, 5))); await br.close();
})();
