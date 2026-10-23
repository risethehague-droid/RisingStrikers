// v0.9.1 keeper AI: every GK test headless (real update loop), the outcome line + the keeper's path every 0.5 s
const { chromium } = require('playwright');
(async () => {
  const br = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await br.newPage({ viewport: { width: 1440, height: 810 } });
  const errs = []; page.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' | ')));
  await page.goto(`http://localhost:${process.env.PORT || 8765}/labtest.html`);
  await page.waitForFunction(() => window.__lab && window.__lab.active, null, { timeout: 120000 });
  const ids = process.env.ONLY ? process.env.ONLY.split(',') : null;
  const n = await page.evaluate(() => window.__lab.groups.find(g => g.id === 'GK').tests.length);
  for (let i = 0; i < n; i++) {
    const out = await page.evaluate(([i, ids]) => { const L = window.__lab, m = window.__hc2, g = m.game; g.loop.sleep(); let T = (window.__T = (window.__T || 5e6) + 1e6);
      const gi = L.groups.findIndex(x => x.id === 'GK'); if (ids && !ids.includes(L.groups[gi].tests[i].id)) return null;
      L.g = gi; L.i = i; L.api.start(false); const r = L.run, trace = [];
      for (let k = 0; k < 60 * 16; k++) { T += 1000 / 60; g.step(T, 1000 / 60);
        if (k % 30 === 0) { const gk = r.gk; trace.push(`${(r.t).toFixed(1)}:${gk.gkMode}@${(105 - gk.x).toFixed(1)},${gk.y.toFixed(1)} v${gk.speed.toFixed(1)}`); }
        if (r.result && r.t > r.endT) break; }
      window.__T = T; return { id: r.sc.id, name: r.sc.name, out: r.result ? r.result.o : 'not finished', trace }; }, [i, ids]);
    if (!out) continue;
    console.log(`${out.id.padEnd(5)} ${out.name}\n      → ${out.out}`); if (process.env.TRACE) console.log('      ' + out.trace.join(' | '));
  }
  console.log('errors', JSON.stringify(errs.slice(0, 6))); await br.close();
})();
