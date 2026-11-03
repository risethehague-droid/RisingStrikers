// chargetest.js (Luca 3 Nov: the NEW BUTTON MECHANIC, chargebtn.js): plays the Test Lab's NEW BUTTONS (FREE PLAY,
// section charge) through the real keys and checks each one: the level charged, the special that came out, the bars
// left. Serve the game and build the Lab page first: (cd game && python3 -m http.server 8765) · bash tools/mklab.sh
//   node tools/chargetest.js            (ONLY=chg-sp1,chg-drill ...; PORT=8765; V=1 prints every run's line)
const { chromium } = require('playwright');
const E = process.env, PORT = E.PORT || 8765;
const WANT = {   // mv: [charged level, what must show in the Lab's line, bars left of 3]
  'chg-sp1': [1, 'ball LV1', 2], 'chg-sp2': [2, 'ball LV2', 1], 'chg-sp3': [3, 'ball LV3', 0],
  'chg-drill': [1, 'special pass played', 2], 'chg-burrow': [1, 'special pass played', 2], 'chg-angel': [1, 'special pass played', 2],
  'chg-drib': [1, 'dribble played', 2],
};
const ONLY = E.ONLY ? E.ONLY.split(',') : Object.keys(WANT);
(async () => {
  const br = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await (await br.newContext({ viewport: { width: 1366, height: 768 } })).newPage(), errs = [];
  page.on('pageerror', e => errs.push(`${e.message} ${(e.stack || '').split('\n').slice(1, 3).join(' | ')}`));
  await page.goto(`http://localhost:${PORT}/labtest.html`);
  await page.waitForFunction(() => window.__lab && window.__lab.active, null, { timeout: 120000 });
  await page.evaluate(() => { window.__hc2.game.loop.sleep(); window.__T = 5e6; });
  let bad = 0;
  for (const mv of ONLY) {
    const res = await page.evaluate(mv => { const m = window.__hc2, g = m.game; window.__lab.api.fpMove(mv); let lvSeen = 0, aura = 0;
      for (let s = 0; s < 5 * 60; s++) { window.__T += 1000 / 60; g.step(window.__T, 1000 / 60); if (m.cutIn && m.cutInEnd) m.cutInEnd();
        if (m.home.chg) { lvSeen = Math.max(lvSeen, m.home.chg.lv); if (m.chgG && m.chgG.commandBuffer.length) aura++; } }
      return { last: window.__lab.run.last, lvSeen, aura, e: m.meters[0].e }; }, mv);
    const [lv, txt, left] = WANT[mv], ok = res.lvSeen === lv && res.last.includes(txt) && Math.floor(res.e + 1e-6) >= left && res.aura > 0;
    if (!ok) bad++;
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${mv.padEnd(11)} charged LV${res.lvSeen} · aura frames ${res.aura} · SP ${res.e.toFixed(2)} · ${res.last}`);
  }
  // the two one-press SPACE moments, from the Lab's own tests with the new keys on: SM10 (a shot at YOUR keeper: SPACE
  // when SAVE? is up = LV1, a second tap = LV2) and PW12 (a cross drops to you: SPACE = the aerial special, LV1 uncharged)
  if (!E.ONLY) for (const [id, want] of [['SM10', 'save'], ['PW12', 'air'], ['PW12', 'early']]) {
    const res = await page.evaluate(([id, want]) => { const m = window.__hc2, g = m.game, L = window.__lab, api = L.api;
      window.HC2_KEYS = 'charge'; const gi = L.groups.findIndex(G => G.tests.some(t => t.id === id)); api.goTo(gi, L.groups[gi].tests.findIndex(t => t.id === id));
      let set = false, tap = 0, tapT = 0, maxSave = 0, sp = 0, t = 0;
      for (let s = 0; s < 9 * 60; s++) { window.__T += 1000 / 60; g.step(window.__T, 1000 / 60); t += 1 / 60; if (m.cutIn && m.cutInEnd) m.cutInEnd();
        if (!set && t > 0.3) { set = true; m.meters[0].e = 3; }
        if (want === 'save') { if (m.saveAsk && tap === 0) { Input.downs.add('Space'); tap = 1; tapT = t; } else if (tap === 1 && t - tapT > 0.12) { Input.downs.add('Space'); tap = 2; }
          maxSave = Math.max(maxSave, m.home.players[0].spSave || 0); }
        else if (want === 'air') { if (m.airSp && !tap) { Input.downs.add('Space'); tap = 1; } sp = Math.max(sp, m.ball.special || 0); }
        else { const b = m.ball; if (!tap && !b.owner && b.lastP && b.lastP !== m.human && len(b.x - m.human.x, b.y - m.human.y) < 9) { Input.downs.add('Space'); tap = 1; } sp = Math.max(sp, b.special || 0); } }   // (early: SPACE as the cross comes, before the window - the charge releases when it opens)
      return { want, maxSave, sp, e: m.meters[0].e, last: L.run && L.run.last }; }, [id, want]);
    const ok = want === 'save' ? res.maxSave === 2 && Math.abs(res.e - 1) < 0.01 : res.sp === 1 && Math.abs(res.e - 1) < 0.01;
    if (!ok) bad++;
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${(id + (want === 'early' ? ' early' : '')).padEnd(11)} ${want === 'save' ? `keeper save LV${res.maxSave} (SPACE, then SPACE)` : `aerial special LV${res.sp} (${want === 'early' ? 'SPACE as it comes: the charge releases' : 'SPACE, not charged'}; 2 bars in the bank)`} · SP ${res.e.toFixed(2)}`);
  }
  console.log('errors', JSON.stringify(errs.slice(0, 5)));
  await br.close(); process.exit(bad || errs.length ? 1 : 0);
})();
