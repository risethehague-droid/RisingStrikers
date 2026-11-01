// t-003: when do the wall passes and the goals happen in the preview's seeded STREET 5s match (tools/preview.js
// MATCH=1 STREET=1 SEED=n): prints the second of each, so SKIP= can catch one
const { chromium } = require('playwright');
(async () => { const br = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] }); const page = await br.newPage();
  await page.goto(`http://localhost:${process.env.PORT || 8765}/test.html#flow`); await page.waitForFunction(() => window.__hc2 && window.__hc2.home, null, { timeout: 120000 });
  await page.evaluate(() => { const m = window.__hc2; m.game.loop.sleep(); window.__T = 1e6; window.HC2_NO_DEMO = true; window.HC2_STARTED = true; for (const id of ['start', 'flow']) { const e = document.getElementById(id); if (e) e.remove(); } setStreet(true); });
  await page.evaluate(() => new Promise(r => window.__hc2.setTeams('IS', 'IRO', r)));
  const r = await page.evaluate(seed => { const m = window.__hc2, g = m.game; let s = seed >>> 0;
    Math.random = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    m.demo = true; m.kickoff(m.home); const ev = []; let wp = 0, sc = 0;
    for (let k = 0; k < 60 * 120; k++) { window.__T += 1000 / 60; g.step(window.__T, 1000 / 60);
      const n = (m.stN || {}).wallPass || 0; if (n > wp) { wp = n; ev.push(`${(k / 60).toFixed(1)} wall pass`); }
      const t = m.home.score + m.away.score; if (t > sc) { sc = t; ev.push(`${(k / 60).toFixed(1)} GOAL ${m.home.score}-${m.away.score}`); } }
    return ev; }, +(process.env.SEED || 7));
  console.log(r.join('\n')); await br.close(); })();
