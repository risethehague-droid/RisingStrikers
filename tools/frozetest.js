// t-035 GAME FROZE: A HANG OR THE BROWSER PAUSING? (QA 29 Oct: 12 FROZE clips from Luca's browser, no error, no
// headless repro). Headless, on test.html, with the game's real frame loop running and the watchdog switched on
// (window.__bwDog, as tools/bwtest.js), two faked gaps - Phaser's frame count held still for ~5 s:
//   1. the window focused and visible the whole time  → a FROZE clip, 'bug', its "why" says a real hang
//   2. the window loses focus as the gap starts        → a FROZE clip, tagged 'odd', its "why" says the browser paused it
// Each clip's why line is printed, once when the watchdog fires (the gap so far) and once the frames come back (its length).
// Serve the game first (CLAUDE.md "Testing"): python3 -m http.server 8765 --directory game, then node tools/frozetest.js
const { chromium } = require('playwright');
(async () => {
  const br = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await br.newPage({ viewport: { width: 640, height: 360 } }); const errs = [], fails = [], log = [];
  page.on('pageerror', e => errs.push(e.message));
  const ok = (c, what) => { log.push(`${c ? 'ok  ' : 'FAIL'} ${what}`); if (!c) fails.push(what); };
  const wait = ms => page.waitForTimeout(ms);
  const froze = () => page.evaluate(() => { const L = window.__hc2.bw.list.filter(x => x.code === 'FROZE'); const x = L[L.length - 1]; return x ? { sev: x.sev, why: x.why, froze: x.froze, n: L.length } : null; });
  try {
    await page.goto(`http://localhost:${process.env.PORT || 8765}/test.html#flow`);
    await page.waitForFunction(() => window.__hc2 && window.__hc2.home, null, { timeout: 120000 });
    await page.evaluate(() => { const m = window.__hc2, L = m.game.loop; window.HC2_NO_DEMO = true; window.__bwDog = true; window.__bwNoStore = true;
      for (const id of ['start', 'flow']) { const e = document.getElementById(id); if (e) e.remove(); }
      window.HC2_STARTED = true; m.demo = false; m.human = m.home.players[9]; m.kickoff(m.home); m.demo = true;
      // the faked gap: while window.__hold is set, the watchdog reads a frame count that stands still (the loop runs on)
      let f = L.frame; Object.defineProperty(L, 'frame', { configurable: true, get: () => window.__hold ?? f, set: v => { f = v; } });
      window.__focus = true; document.hasFocus = () => window.__focus; });
    await wait(2500);
    const run = async (name, unfocus) => {
      await page.evaluate(u => { const m = window.__hc2; m.bw.errs = {};      // (the same message twice in a match is counted, not clipped again)
        if (u) { window.__focus = false; window.dispatchEvent(new Event('blur')); } window.__hold = m.game.loop.frame; }, unfocus);
      await wait(4300); const a = await froze();
      await page.evaluate(() => { window.__hold = undefined; window.__focus = true; window.dispatchEvent(new Event('focus')); });
      await wait(1600); const b = await froze();
      log.push(`  ${name}, when it fired: ${a ? `[${a.sev}] ${a.why}` : 'no clip'}`, `  ${name}, frames back:   ${b ? `[${b.sev}] ${b.why}` : 'no clip'}`);
      return { a, b };
    };
    const F = await run('focused gap', false);
    ok(F.a && F.a.sev === 'bug' && /so far/.test(F.a.why), 'focused + visible: a FROZE clip, a bug, the gap so far');
    ok(F.b && F.b.sev === 'bug' && F.b.froze.ended && F.b.froze.gap >= 4 && /real hang/.test(F.b.why) && F.b.froze.phase, `… frames back: the gap closed at ${F.b && F.b.froze.gap} s, still a real hang, during ${F.b && F.b.froze.phase}`);
    const U = await run('unfocused gap', true);
    ok(U.a && U.b && U.b.n === F.b.n + 1, 'no focus: a second FROZE clip (kept)');
    ok(U.b && U.b.sev === 'odd' && /browser paused/.test(U.b.why) && (U.b.froze.lost || !U.b.froze.foc0), `… tagged 'odd': the browser paused the page (gap ${U.b && U.b.froze.gap} s)`);
  } catch (e) { fails.push('crashed: ' + e.message); }
  console.log(log.join('\n'));
  console.log(fails.length ? `FAILED ${fails.length}` : 'all ok', 'errors', JSON.stringify(errs));
  await br.close(); process.exit(fails.length ? 1 : 0);
})();
