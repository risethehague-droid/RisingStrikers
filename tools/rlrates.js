// RL RATES (role-ai step 0, docs/role-ai-plan.md 3 + 7): run each exploit test of the Test Lab's RL group N times on fresh
// dice and count how often it WORKED. The plan's yardstick: steps 2-3 must bring these down to real-football levels
// (never to zero - a good chip still scores sometimes), without making the game harder.
// Every RL line starts WORKED or STOPPED (game/lab.js rlRes); the rest of the line is kept as a sample.
//
//   node tools/rlrates.js                         every RL test, 20 runs each (the first on the test's own dice, as the Lab's R)
//   REP=40 ONLY=E1,E4 node tools/rlrates.js       more runs, some tests
//   OUT=docs/ai/rl-baseline.json ...              also write every line as JSON
//   first: python3 -m http.server 8765 --directory game, then bash tools/mklab.sh (builds game/labtest.html)
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const E = process.env, REP = +(E.REP || 20), ONLY = E.ONLY ? E.ONLY.split(',') : null;
// the numbers behind each test, averaged over its runs (the yardsticks for steps 2-3 even where the move itself fails today)
const NUMS = {
  E1: [['keeper m out at the chip', /keeper ([\d.]+) m out at the chip/]],
  E2: [['their line spread at the ball, m', /spread ([\d.]+) m/], ['keeper m out at the ball', /keeper ([\d.]+) m out$/]],
  E2b: [['their line spread at the ball, m', /spread ([\d.]+) m/], ['keeper m out at the ball', /keeper ([\d.]+) m out$/]],
  E3: [['m their CB followed your #9 out of the line', /followed your #9 ([\d.]+) m out/], ['m from his spot to their nearest man at the pass', /his old spot at the pass ([\d.]+) m/]],
  E4: [['keeper m off his line at the square ball', /\(([\d.]+) m off his line\)/]],
  E5: [['keeper furthest out, m', /keeper furthest out ([\d.]+) m/]],
  E6: [['their men goal-side of the ball at the turnover', /behind the ball when you won it: (\d+)/]],
};
(async () => {
  const br = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await br.newPage({ viewport: { width: 1280, height: 720 } });
  if (process.env.FORM) await page.addInitScript(f => { window.FORMATION_FORCE = f; }, process.env.FORM);   // role-ai step 4: FORM=4-4-2 / 4-2-3-1 / 4-3-3 = every team in that shape
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(`http://localhost:${E.PORT || 8765}/labtest.html`);
  await page.waitForFunction(() => window.__lab && window.__lab.active, null, { timeout: 120000 });
  const ids = await page.evaluate(() => { const L = window.__lab; return L.groups.find(g => g.id === 'RL').tests.map(t => [t.id, t.name]); });
  const all = {};
  for (const [id, name] of ids) {
    if (ONLY && !ONLY.includes(id)) continue;
    const lines = await page.evaluate(([ID, REP]) => { const L = window.__lab, m = window.__hc2, g = m.game; g.loop.sleep(); let T = 5e6; const out = [];
      L.g = L.groups.findIndex(x => x.id === 'RL'); L.i = L.groups[L.g].tests.findIndex(t => t.id === ID);
      for (let rep = 0; rep < REP; rep++) { L.api.start(rep > 0); const r = L.run;
        for (let k = 0; k < 60 * (r.sc.maxT || 14); k++) { T += 1000 / 60; g.step(T, 1000 / 60); if (r.result) break; }
        out.push(r.result ? r.result.o : 'not finished'); }
      return out; }, [id, REP]);
    const w = lines.filter(o => o.startsWith('WORKED')).length;
    const nums = {}; for (const [k, re] of NUMS[id] || []) { const v = lines.map(o => (o.match(re) || [])[1]).filter(x => x != null).map(Number); if (v.length) nums[k] = +(v.reduce((a, x) => a + x, 0) / v.length).toFixed(1); }
    const kinds = {}; for (const o of lines) { const k = o.split(' · ').slice(0, 2).join(' · ').replace(/\d+(\.\d+)? m/g, '# m'); kinds[k] = (kinds[k] || 0) + 1; }
    all[id] = { name, runs: lines.length, worked: w, rate: Math.round(100 * w / lines.length), nums, outcomes: kinds, lines };
    console.log(`${id.padEnd(3)} ${name.padEnd(46).slice(0, 46)} WORKED ${String(w).padStart(2)}/${lines.length} (${all[id].rate}%)${Object.keys(nums).length ? ' · ' + Object.entries(nums).map(([k, v]) => `${k}: ${v}`).join(' · ') : ''}`);
    if (E.VERBOSE) for (const o of lines) console.log('      ' + o);
  }
  console.log('errors', JSON.stringify(errs.slice(0, 5)));
  if (E.OUT) { fs.mkdirSync(path.dirname(E.OUT), { recursive: true }); fs.writeFileSync(E.OUT, JSON.stringify({ rep: REP, tests: all, errors: errs }, null, 1)); console.log('wrote ' + E.OUT); }
  await br.close();
})();
