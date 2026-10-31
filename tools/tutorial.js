// TUTORIAL CHECK (src/tutorial.js, Luca 31 Oct: "a simple tutorial ... try the basics and then the advanced stuff before
// you play, make it optional to skip or return back to"). Headless, time stepped by hand:
//  1. the game's start screen has the TUTORIAL button (and TRAINING's TUTORIAL link) pointing at the Lab's #TUT
//  2. labtest.html#TUT opens the tutorial card (Lab panel hidden), PART 1 / PART 2 on its menu
//  3. every step of both parts: SHOW ME plays it with the step's own keys and its success check must fire (that proves
//     the set-up, the keys and the check fit together), then the step comes back for you
//  4. a few steps played "by hand" (keys through Input.touch, as a player's would) must tick and move on by themselves
//  5. SKIP / BACK / MENU / Esc, the progress kept in localStorage (CONTINUE), and no page errors
// Serve the game and build the Lab page first: (cd game && python3 -m http.server 8765) · bash tools/mklab.sh
//   node tools/tutorial.js         PORT=8765, ONLY=sp1,drill (just those steps' demos)
const { chromium } = require('playwright');
const path = require('path');
const E = process.env, PORT = E.PORT || 8765, BASE = `http://localhost:${PORT}`;
let fails = 0; const ok = (c, msg) => { console.log(`${c ? 'ok  ' : 'FAIL'} ${msg}`); if (!c) fails++; };
(async () => {
  const br = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await br.newContext({ viewport: { width: 1366, height: 768 } });
  await ctx.route(/cdn\.jsdelivr\.net\/npm\/phaser/, r => r.fulfill({ path: path.join(__dirname, '../game/phaser.min.js'), contentType: 'text/javascript' }));   // (the sandbox has no CDN)
  const errs = [];
  // ---- 1. the start screen
  const g = await ctx.newPage(); g.on('pageerror', e => errs.push('game: ' + e.message));
  await g.goto(`${BASE}/index.html`); await g.waitForSelector('#tutbtn');
  const sb = await g.evaluate(() => ({ txt: document.getElementById('tutbtn').textContent, link: document.getElementById('lab-tut').getAttribute('href') }));
  ok(/TUTORIAL/.test(sb.txt) && /NEW HERE/.test(sb.txt) && sb.link === 'lab.html#TUT', `start screen: TUTORIAL button "${sb.txt.trim()}" · TRAINING link ${sb.link}`);
  await g.click('#tutbtn'); await g.waitForURL(/lab\.html#TUT/, { timeout: 10000 }).catch(() => {});
  ok(/lab\.html#TUT$/.test(g.url()), `the button opens ${g.url().replace(BASE, '')}`);
  await g.close();

  // ---- 2. the Lab at #TUT
  const page = await ctx.newPage(); page.on('pageerror', e => errs.push(`${e.message} ${(e.stack || '').split('\n').slice(1, 3).join(' | ')}`));
  await page.goto(`${BASE}/labtest.html#TUT`); await page.waitForFunction(() => window.__lab && window.__lab.active, null, { timeout: 120000 });
  await page.evaluate(() => { try { localStorage.removeItem('hc2-tut'); } catch (e) {} window.__hc2.game.loop.sleep(); window.__T = 5e6; });
  const step = secs => page.evaluate(secs => { const g = window.__hc2.game; for (let k = 0; k < secs * 60; k++) { window.__T += 1000 / 60; g.step(window.__T, 1000 / 60); } }, secs);
  await step(0.5);
  const st = () => page.evaluate(() => { const T = TUTORIAL.run; return T ? { part: T.part, i: T.i, phase: T.phase, id: T.phase === 'menu' || T.phase === 'done' ? '' : TUTORIAL.PARTS[T.part].steps[T.i].id, demoOk: T.demoOk, hint: T.hint || '' } : null; });
  const m0 = await page.evaluate(() => ({ card: !!document.querySelector('#tut .tc'), panel: getComputedStyle(document.getElementById('panel')).display, parts: [...document.querySelectorAll('#tut [data-act="part"]')].map(b => b.textContent.trim().slice(0, 30)) }));
  ok(m0.card && m0.panel === 'none' && m0.parts.length === 2, `tutorial menu: card up, Lab panel hidden · ${m0.parts.join(' | ')}`);

  // ---- 3. every step's SHOW ME
  const only = E.ONLY ? E.ONLY.split(',') : null;
  const parts = await page.evaluate(() => TUTORIAL.PARTS.map(p => p.steps.map(s => ({ id: s.id, info: !!s.info, demo: !!s.demo }))));
  for (let pi = 0; pi < parts.length; pi++) {
    await page.click(`#tut [data-act="part"][data-p="${pi}"]`); await step(0.3);
    for (let si = 0; si < parts[pi].length; si++) {
      const s = parts[pi][si], e0 = errs.length; let a = await st();
      if (a.i !== si) { ok(false, `part ${pi + 1}: expected step ${si + 1}, at ${a.i + 1}`); break; }
      if (s.info || !s.demo || (only && !only.includes(s.id))) {
        if (s.info) { await page.keyboard.press('Enter'); await step(2.5); a = await st(); ok(a.i === si + 1 || a.phase === 'done', `${s.id.padEnd(8)} info step: ENTER = GOT IT, on to the next`); }
        else { await page.click('#tut [data-act="skip"]'); await step(0.2); }
        continue;
      }
      await page.click('#tut [data-act="demo"]');
      let t = 0; for (; t < 16; t += 0.5) { await step(0.5); a = await st(); if (a.phase === 'shown') break; }
      ok(a.phase === 'shown' && a.demoOk && errs.length === e0, `${s.id.padEnd(8)} SHOW ME plays it and the check ticks (${t + 0.5} s)${a.demoOk ? '' : ' - CHECK NEVER FIRED'}`);
      await step(4); a = await st();
      ok(a.phase === 'play' && a.i === si, `${s.id.padEnd(8)} then it's your turn: same step, set up again`);
      await page.click('#tut [data-act="skip"]'); await step(0.2);
      if (errs.length > e0) console.log('     ' + errs.slice(e0).join('\n     '));
    }
    const d = await st(); ok(d.phase === 'done', `part ${pi + 1}: the "done" card at the end (${d.phase})`);
    await page.click('#tut [data-act="menu"]'); await step(0.2);
  }
  const done = await page.evaluate(() => TUTORIAL.done());
  ok(done.basics && done.adv, `both parts marked done in this browser ${JSON.stringify(done)}`);

  // ---- 4. by hand: the keys a player presses (Input.touch, as a pad / the phone buttons would)
  const hand = async (pi, si, drive, secs, label) => {
    await page.evaluate(([pi, si]) => { const b = document.querySelector(`#tut [data-act="part"][data-p="${pi}"]`); b.click(); }, [pi, si]);
    for (let k = 0; k < si; k++) { await page.click('#tut [data-act="skip"]'); }
    await step(0.3);
    const r = await page.evaluate(([drive, secs]) => { const m = window.__hc2, g = m.game, T = TUTORIAL.run, Tc = Input.touch; const i0 = T.i; let okAt = null;
      for (let k = 0; k < secs * 60; k++) { const S = T.S, p = T.r.human; Object.assign(Tc, { x: 0, y: 0, btn: {} }); new Function('S', 'p', 'Tc', 'm', drive)(S, p, Tc, m);
        window.__T += 1000 / 60; g.step(window.__T, 1000 / 60); if (T.phase === 'ok' && okAt == null) okAt = k / 60; if (T.i !== i0) break; }
      Object.assign(Tc, { x: 0, y: 0, btn: {} }); return { okAt, i0, i: T.i, phase: T.phase, hint: T.hint }; }, [drive, secs]);
    ok(r.okAt != null && r.i === r.i0 + 1, `by hand · ${label}: ticked at ${r.okAt && r.okAt.toFixed(1)} s, on to step ${r.i + 1} by itself${r.hint ? ` (last hint: ${r.hint})` : ''}`);
    await page.keyboard.press('Escape'); await step(0.2);
  };
  await hand(0, 0, `const d = Math.hypot(S.ring.x - p.x, S.ring.y - p.y) || 1; Tc.x = (S.ring.x - p.x) / d; Tc.y = (S.ring.y - p.y) / d;`, 8, 'MOVE (stick to the ring)');
  await hand(0, 2, `Tc.btn.pass = S.t > 0.3 && S.t < 0.4;`, 6, 'PASS (one press)');
  await hand(0, 5, `Tc.btn.shoot = S.t > 0.3 && S.t < 0.62; Tc.y = S.t > 0.3 && S.t < 0.7 ? 1 : 0;`, 22, 'SHOOT (low corner; may need a retry or two)');
  await hand(1, 3, `Tc.btn.special = S.t > 0.3 && S.t < 0.9; Tc.btn.pass = S.t > 0.5 && S.t < 0.6;`, 8, 'TORNADO DRILL (hold SPECIAL + tap PASS)');
  // a miss: MOVE's ring, run the other way into it without... (SPRINT without SHIFT = the hint, then the same step again)
  await page.click('#tut [data-act="part"][data-p="0"]'); await page.click('#tut [data-act="skip"]'); await step(0.3);
  const miss = await page.evaluate(() => { const g = window.__hc2.game, T = TUTORIAL.run, Tc = Input.touch; let hint = '';
    for (let k = 0; k < 600; k++) { const S = T.S, p = T.r.human, d = Math.hypot(S.ring.x - p.x, S.ring.y - p.y) || 1; Object.assign(Tc, { x: (S.ring.x - p.x) / d, y: (S.ring.y - p.y) / d, btn: {} });
      window.__T += 1000 / 60; g.step(window.__T, 1000 / 60); if (T.phase === 'fail') { hint = T.hint; break; } }
    Object.assign(Tc, { x: 0, y: 0, btn: {} }); for (let k = 0; k < 150; k++) { window.__T += 1000 / 60; g.step(window.__T, 1000 / 60); }
    return { hint, i: T.i, phase: T.phase }; });
  ok(/SHIFT/.test(miss.hint) && miss.i === 1 && miss.phase === 'play', `a miss (SPRINT without SHIFT): "${miss.hint}", then the same step again`);

  // ---- 5. skip / back / menu / continue / Esc
  await page.click('#tut [data-act="skip"]'); await page.click('#tut [data-act="skip"]'); await page.click('#tut [data-act="back"]'); await step(0.2);
  let a = await st(); ok(a.i === 2, `SKIP, SKIP, BACK: step ${a.i + 1} (${a.id})`);
  await page.keyboard.press('Escape'); await step(0.2);
  const cont = await page.evaluate(() => { const b = document.querySelector('#tut [data-act="cont"]'); return b && b.textContent; });
  ok(cont && /step 3 of 8/.test(cont), `Esc = the tutorial menu, with CONTINUE: "${cont}"`);
  await page.click('#tut [data-act="cont"]'); await step(0.2); a = await st(); ok(a.part === 0 && a.i === 2 && a.phase === 'play', `CONTINUE picks it up at step ${a.i + 1}`);
  const left = await page.evaluate(() => { window.__lab.api.goFree(); return { tut: !!window.__lab.tut, card: !!document.getElementById('tut'), panel: getComputedStyle(document.getElementById('panel')).display }; });
  ok(!left.tut && !left.card && left.panel !== 'none', 'leaving for FREE PLAY: the card goes, the Lab panel is back');
  ok(errs.length === 0, `no page errors${errs.length ? ': ' + errs.slice(0, 5).join(' / ') : ''}`);
  await br.close();
  console.log(fails ? `${fails} FAILED` : 'all ok');
  process.exit(fails ? 1 : 0);
})();
