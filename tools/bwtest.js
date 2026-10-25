// t-021 BUG WATCH ERROR TEST (Luca 25 Oct 06:44: "it should flag ... when game code breaks and clear errors occurs").
// Headless, on test.html, with the game's real frame loop running (not stepped by hand), a computer v computer match on:
//   1. a promise that fails with nobody catching it        → a CRASH clip with its stack
//   2. console.error twice in a row                         → one CONSOLE_ERR clip (rate-limited), both counted
//   3. an error thrown inside a frame (the scene's update)  → a CRASH clip with its stack; the throw kills Phaser's loop,
//      so the WATCHDOG (switched on here with window.__bwDog: it normally skips the test browsers) → a FROZE clip
//   4. every clip has footage, and none is a 'look' (flicker) one
// Serve the game first (CLAUDE.md "Testing"): python3 -m http.server 8765 --directory game, then node tools/bwtest.js
const { chromium } = require('playwright');
(async () => {
  const br = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await br.newPage({ viewport: { width: 640, height: 360 } }); const errs = [], fails = [], log = [];
  page.on('pageerror', e => errs.push(e.message));
  const ok = (c, what) => { log.push(`${c ? 'ok  ' : 'FAIL'} ${what}`); if (!c) fails.push(what); };
  const wait = ms => page.waitForTimeout(ms);
  const incs = () => page.evaluate(() => window.__inc.slice());
  try {
    await page.goto(`http://localhost:${process.env.PORT || 8765}/test.html#flow`);
    await page.waitForFunction(() => window.__hc2 && window.__hc2.home, null, { timeout: 120000 });
    await page.evaluate(() => { const m = window.__hc2; window.HC2_NO_DEMO = true; window.__bwDog = true; window.__inc = [];
      for (const id of ['start', 'flow']) { const e = document.getElementById(id); if (e) e.remove(); }
      window.__bwHook = x => window.__inc.push({ code: x.code, sev: x.sev, msg: String(x.msg), stack: String(x.stack || ''), frames: (x.frames || []).length });
      window.HC2_STARTED = true; m.demo = false; m.human = m.home.players[9]; m.kickoff(m.home); m.demo = true; });
    await wait(2500);                                                             // the real loop plays a couple of seconds
    const f0 = await page.evaluate(() => window.__hc2.game.loop.frame); ok(f0 > 30, `the frame loop runs (${f0} frames)`);

    await page.evaluate(() => { Promise.reject(new Error('t-021 forced rejection')); });
    await wait(600);
    let L = await incs(), c = L.find(x => x.code === 'CRASH' && x.msg.includes('t-021 forced rejection'));
    ok(c && c.stack.includes('Error'), `a failed promise → CRASH clip with its stack (${c ? c.msg : 'none'})`);
    ok(c && c.frames > 30, `… with footage (${c ? c.frames : 0} frames)`);

    await page.evaluate(() => { console.error('t-021 forced console error', 1); console.error('t-021 forced console error', 2); });
    await wait(400);
    L = await incs(); const ce = L.filter(x => x.code === 'CONSOLE_ERR');
    const ceN = await page.evaluate(() => window.__hc2.bw.stats.CONSOLE_ERR || 0);
    ok(ce.length === 1 && ceN === 2, `console.error twice → 1 CONSOLE_ERR clip, counted ${ceN} times (${ce.map(x => x.msg).join(' | ')})`);

    await page.evaluate(() => { const m = window.__hc2; m.events.once('update', () => { throw new Error('t-021 forced frame error'); }); });
    await wait(5000);                                                             // the loop is dead now: the watchdog checks once a second
    L = await incs(); c = L.find(x => x.code === 'CRASH' && x.msg.includes('t-021 forced frame error'));
    ok(c && /Error: t-021 forced frame error/.test(c.stack), `an error in a frame → CRASH clip with its stack (${c ? c.msg : 'none'})`);
    const f1 = await page.evaluate(() => window.__hc2.game.loop.frame); await wait(1200); const f2 = await page.evaluate(() => window.__hc2.game.loop.frame);
    ok(f1 === f2, `… the throw stopped the loop (frame ${f1} → ${f2})`);
    const fz = L.find(x => x.code === 'FROZE');
    ok(fz && fz.msg.includes('t-021 forced frame error'), `the watchdog saw the freeze → FROZE clip (${fz ? fz.msg : 'none'})`);
    ok(fz && fz.frames > 30, `… with the footage up to the freeze (${fz ? fz.frames : 0} frames)`);
    ok(!L.some(x => x.sev === 'look'), `no 'look' clips (${L.map(x => x.code).join(', ')})`);
    ok(errs.length === 2 && errs.every(e => /t-021 forced/.test(e)), `the page errors are only the two forced ones (${errs.join(' | ')})`);
  } catch (e) { fails.push('crashed: ' + e.message); }
  console.log(log.join('\n'));
  console.log(fails.length ? `FAILED ${fails.length}` : 'all ok', 'errors', JSON.stringify(errs.filter(e => !/t-021 forced/.test(e))));
  await br.close(); process.exit(fails.length ? 1 : 0);
})();
