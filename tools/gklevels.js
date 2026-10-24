// t-007: their keeper by level. Every Test Lab K shot (30 of them: 6 spots x 5 targets, the real keeper AI) is played
// against their keeper at each level (the Lab's per-test level, as LC7 uses), REP times with fresh dice, and the
// outcomes are counted: held, pushed away (the Lab stops the test on the touch, so out v in play is the soak's job), goal. The levels should stay apart: a better
// keeper holds more and concedes less.
//   bash tools/mklab.sh; REP=3 PORT=8765 node tools/gklevels.js
const { chromium } = require('playwright');
(async () => {
  const br = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await br.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(`http://localhost:${process.env.PORT || 8765}/labtest.html`);
  await page.waitForFunction(() => window.__lab && window.__lab.active, null, { timeout: 120000 });
  const res = await page.evaluate(([REP, LV]) => { const L = window.__lab, m = window.__hc2, g = m.game; g.loop.sleep(); let T = 5e6; const out = {};
    const gi = L.groups.findIndex(x => x.id === 'K');
    for (const lvl of LV) { const c = out[lvl] = { shots: 0, held: 0, out: 0, inPlay: 0, goal: 0, other: 0 };
      for (let rep = 0; rep < REP; rep++) for (let i = 0; i < L.groups[gi].tests.length; i++) {
        const sc = L.groups[gi].tests[i]; sc.lvl = lvl; L.g = gi; L.i = i; L.api.start(rep > 0); const r = L.run;
        for (let k = 0; k < 60 * 12; k++) { T += 1000 / 60; g.step(T, 1000 / 60); if (r.result && r.t > r.endT) break; }
        const o = r.result ? r.result.o : ''; c.shots++;
        if (/caught/.test(o)) c.held++; else if (/GOAL/.test(o) && !r.out) c.goal++; else if (r.out === 'CORNER' || /corner/.test(o)) c.out++; else if (m.ball.inNet) c.goal++; else if (/parried|OUT/.test(o)) c.inPlay++; else c.other++;
        delete sc.lvl; } }
    return out; }, [+(process.env.REP || 3), (process.env.LEVELS || 'easy,normal,hard,rise').split(',')]);
  for (const [l, c] of Object.entries(res)) console.log(`${l.padEnd(7)} ${c.shots} shots · held ${c.held} · pushed away ${c.out + c.inPlay} · goals ${c.goal}${c.other ? ` · other ${c.other}` : ''}`);
  console.log('errors', JSON.stringify(errs.slice(0, 5))); await br.close();
})();
