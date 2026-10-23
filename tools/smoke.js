// quick smoke: the current build, computer v computer at each difficulty for a few minutes headless - errors?
const { chromium } = require('playwright');
(async () => { const br = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await br.newPage({ viewport: { width: 640, height: 360 } }); const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto('http://localhost:8765/test.html#flow'); await page.waitForFunction(() => window.__hc2 && window.__hc2.home, null, { timeout: 120000 });
  const out = await page.evaluate(() => { const m = window.__hc2, g = m.game; g.loop.sleep(); let T = 1e6; window.HC2_NO_DEMO = true; m.cameras.main.setVisible(false);
    for (const id of ['start', 'flow']) { const e = document.getElementById(id); if (e) e.remove(); }
    const res = {}; let chips = 0; const cs = m.chipShot.bind(m); m.chipShot = (...a) => { chips++; return cs(...a); };
    for (const lv of ['easy', 'normal', 'hard', 'rise']) { setDiff(lv); m.demo = false; window.HC2_STARTED = true; m.human = m.home.players[9];
      m.home.score = m.away.score = 0; m.kickoff(m.home); m.demo = true;   // (demo: the computer plays both sides)
      window.__diffTeams = { home: DIFF_TRAITS.normal, away: DIFF_TRAITS[lv] };
      for (let i = 0; i < 60 * 150; i++) { T += 1000 / 60; g.step(T, 1000 / 60); if (m.cutIn) m.cutInEnd(); if (m.replay) m.endReplay(); }
      res[lv] = `${m.home.score}-${m.away.score}`; }
    window.__diffTeams = null; setDiff('normal'); return { res, chips, opts: m.optsItems ? 'ok' : '' }; });
  console.log(JSON.stringify(out), 'errors', JSON.stringify(errs.slice(0, 4))); await br.close(); })();
