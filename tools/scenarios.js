// PRACTICE SCENARIOS CHECK (Luca 31 Oct 01:39: "give more options for setup like scenarios in which you can try passes
// dribbles etc"). Headless: every scenario in lab.js SCN (and a few BUILD YOUR OWN set-ups) started by a real click on its
// button, time stepped by hand. Each one must: put the right men on the pitch with the ball where the drill says, let
// the Lab's stand-in for you run at goal and shoot (attacking) or stand off (defending) with no page error, end the try
// by itself (goal / saved / lost it / out / time up) and set itself up again (try 2). Then E (again), STOP, and a move
// button after a scenario (back to plain FREE PLAY).
// Serve the game and build the Lab page first: (cd game && python3 -m http.server 8765) · bash tools/mklab.sh
//   node tools/scenarios.js        PORT=8765, ONLY=p-2v1,k-off (just those)
const { chromium } = require('playwright');
const E = process.env, PORT = E.PORT || 8765, URL = `http://localhost:${PORT}/labtest.html`;
let fails = 0; const ok = (c, msg) => { console.log(`${c ? 'ok  ' : 'FAIL'} ${msg}`); if (!c) fails++; };
(async () => {
  const br = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const errs = [], page = await (await br.newContext({ viewport: { width: 1366, height: 768 } })).newPage();
  page.on('pageerror', e => errs.push(`${e.message} ${(e.stack || '').split('\n').slice(1, 3).join(' | ')}`));
  await page.goto(URL); await page.waitForFunction(() => window.__lab && window.__lab.active, null, { timeout: 120000 });
  // (stepped by hand from here, as labnav.js)
  await page.evaluate(() => { window.__hc2.game.loop.sleep(); window.__T = 5e6; });
  await page.evaluate(() => { const m = window.__hc2, st = m.stadium; for (const t of st.tiles) for (const k of t.uniq) if (!m.textures.exists(k)) st.queue.add(k); st.pump(); });
  for (let i = 0; i < 3000; i++) { const done = await page.evaluate(() => { const m = window.__hc2, st = m.stadium; window.__T += 1000 / 60; m.game.step(window.__T, 1000 / 60); return !st.loading && !st.queue.size; });
    if (done) break; await new Promise(r => setTimeout(r, 20)); }
  const step = (secs, drive) => page.evaluate(([secs, drive]) => { const m = window.__hc2, g = m.game, L = window.__lab, T = Input.touch;
    let vMax = 0; const outs = new Set();
    for (let k = 0; k < secs * 60; k++) {
      const r = L.run, p = r.human, b = m.ball;
      if (drive === 'attack') {                                                 // run at goal; inside 22 m of it, a shot (SHOOT held 0.3 s); a loose ball: go and get it
        const d = Math.hypot(105 - p.x, 34 - p.y);
        if (b.owner === p) { T.x = (105 - p.x) / d; T.y = (34 - p.y) / d; if (d < 22) window.__hold = (window.__hold || 0) + 1; T.btn.shoot = window.__hold > 0 && window.__hold < 18; }
        else { window.__hold = 0; T.btn = {}; const e = Math.hypot(b.x - p.x, b.y - p.y) || 1; if (!b.owner && b.z < 0.5 && Math.hypot(b.vx, b.vy) < 6) { T.x = (b.x - p.x) / e; T.y = (b.y - p.y) / e; } else { T.x = 0; T.y = 0; } }
      } else if (drive === 'defend') { T.x = 0; T.y = 0; T.btn = {}; }
      window.__T += 1000 / 60; g.step(window.__T, 1000 / 60);
      vMax = Math.max(vMax, Math.hypot(b.vx, b.vy, b.vz)); if (r.scn && r.last) { const o = String(r.last).slice(r.scn.n.length + 3).split(' · ')[0]; if (o !== 'GO!') outs.add(o); }
    }
    Object.assign(T, { x: 0, y: 0, btn: {} });
    const r = L.run; return { vMax, outs: [...outs], last: r.last, scn: r.scn && r.scn.id, st: r.scnSt, on: m.all.filter(p => !p.sentOff).length }; }, [secs, drive]);
  const scns = await page.evaluate(() => window.__lab.api.SCN.map(s => ({ id: s.id, n: s.n, def: !!s.def, men: 1 + (s.mates || []).length + (s.opps || []).length + (s.def || s.gk !== 'none' ? 1 : 0), maxT: s.maxT || 20 })));
  const only = E.ONLY ? E.ONLY.split(',') : null;
  const custom = [['mid', 2, 3, 'line', false], ['wt', 1, 2, 'off', true], ['edge', 0, 0, 'none', false], ['half', 3, 5, 'line', false]];
  for (const c of only && !only.includes('custom') ? [] : custom) scns.push({ id: 'custom', n: `BUILD YOUR OWN ${c.join(' ')}`, custom: c, men: 1 + c[1] + c[2] + (c[3] !== 'none' ? 1 : 0), maxT: 20 });
  for (const s of scns) {
    if (only && !only.includes(s.id)) continue;
    const e0 = errs.length;
    if (s.custom) {                                                             // BUILD YOUR OWN: its buttons, then PLAY MY SET-UP
      await page.evaluate(() => { const d = document.querySelector('#fp .fp-sb-box'); d.open = true; });
      const [from, mates, opps, gk, stand] = s.custom;
      for (const [k, v] of [['from', from], ['mates', mates], ['opps', opps], ['gk', gk], ['stand', stand]]) await page.click(`#fp [data-sb="${k}"][data-v="${v}"]`);
    }
    await page.click(`#fp [data-scn="${s.id}"]`);
    const a = await page.evaluate(() => { const L = window.__lab, r = L.run, m = window.__hc2, b = m.ball;
      return { scn: r.scn && r.scn.id, on: m.all.filter(p => !p.sentOff).length, mine: b.owner === r.human, theirs: !!b.owner && b.owner.team === m.away,
        pressed: document.querySelector(`#fp [data-scn="${r.scn && r.scn.id}"]`).getAttribute('aria-pressed'), tip: document.getElementById('fp-scn-tip').textContent }; });
    const set = a.scn === s.id && a.on === s.men && (s.def ? a.theirs : a.mine) && a.pressed === 'true' && a.tip.length > 20;
    const r1 = await step(s.def ? 6 : 6, s.def ? 'defend' : 'attack');
    const r2 = await step(s.maxT + 4, s.def ? 'defend' : 'attack');
    const good = set && r1.vMax > 1 && r2.st && r2.st.tries >= 2 && errs.length === e0 && r2.scn === s.id;
    ok(good, `${s.n.padEnd(32)} ${a.on} men${set ? '' : ` (SET-UP WRONG: ${JSON.stringify(a)})`} · ball ${Math.round(r1.vMax * 3.6)} km/h · tries ${r2.st && r2.st.tries} · ${s.def ? 'stopped' : 'goals'} ${r2.st && (s.def ? r2.st.wins : r2.st.goals)} · "${r2.outs.slice(0, 4).join(' / ')}"`);
    if (errs.length > e0) console.log('     ' + errs.slice(e0).join('\n     '));
  }
  if (!only) {
    // E = the same set-up again; STOP and a move button = back to plain FREE PLAY
    await page.click('#fp [data-scn="p-2v1"]'); await step(2, 'attack');
    await page.keyboard.press('KeyE'); let q = await page.evaluate(() => { const r = window.__lab.run, m = window.__hc2; return { id: r.scn && r.scn.id, tries: r.scnSt.tries, mine: m.ball.owner === r.human, x: r.human.x }; });
    ok(q.id === 'p-2v1' && q.tries === 2 && q.mine && Math.abs(q.x - 62) < 0.5, `E → the same scenario again (try ${q.tries})`);
    await page.click('#fp-scn-stop'); q = await page.evaluate(() => { const r = window.__lab.run, m = window.__hc2; return { scn: r.scn, on: m.all.filter(p => !p.sentOff).length, real: r.real, hidden: document.getElementById('fp-scn-stop').hidden }; });
    ok(!q.scn && q.on === 2 && !q.real && q.hidden, 'STOP → plain FREE PLAY (you and their keeper)');
    await page.click('#fp [data-scn="d-1v1"]'); await step(1, 'attack'); await page.click('#fp [data-mv="shot"]'); await step(2);
    q = await page.evaluate(() => { const r = window.__lab.run, m = window.__hc2; return { scn: r.scn, on: m.all.filter(p => !p.sentOff).length }; });
    ok(!q.scn && q.on === 2, 'a move button during a scenario → plain FREE PLAY, then the move');
  }
  console.log('\nerrors', JSON.stringify(errs.slice(0, 6))); console.log(fails ? `${fails} FAILED` : 'all checks passed');
  await br.close(); process.exit(fails || errs.length ? 1 : 0);
})();
