// gk-cover (Luca 31 Oct: "once he activates the special save ... has perfect coverage"): the Test Lab's three COVER
// set-ups (lab.js COVER_SET, FREE PLAY → THEIR KEEPER → COVER · ...) played N times each, headless, time stepped by
// hand. A keeper with his special save on must stop every one: the line says how many went in.
// Serve the game and build the Lab page first: (cd game && python3 -m http.server 8765) · bash tools/mklab.sh
//   N=20 node tools/cover.js        (ONLY=lob,late,wide; PORT=8765)
const { chromium } = require('playwright');
const E = process.env, PORT = E.PORT || 8765, N = +E.N || 20, ONLY = (E.ONLY || 'lob,late,wide').split(',');
(async () => {
  const br = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await (await br.newContext({ viewport: { width: 1366, height: 768 } })).newPage(), errs = [];
  page.on('pageerror', e => errs.push(`${e.message} ${(e.stack || '').split('\n').slice(1, 3).join(' | ')}`));
  await page.goto(`http://localhost:${PORT}/labtest.html`);
  await page.waitForFunction(() => window.__lab && window.__lab.active, null, { timeout: 120000 });
  await page.evaluate(() => { window.__hc2.game.loop.sleep(); window.__T = 5e6; window.HC2_TEST_FAST = true; });
  let bad = 0;
  for (const k of ONLY) {
    const out = {}, moves = new Set();
    for (let i = 0; i < N; i++) {
      await page.evaluate(k => window.__lab.api.fpMove('gk-cover-' + k), k);
      const res = await page.evaluate(() => { const m = window.__hc2, g = m.game, L = window.__lab; let jump = 0, px = null, zp = null, bx = m.ball.x;
        for (let s = 0; s < 3.3 * 60; s++) { window.__T += 1000 / 60; g.step(window.__T, 1000 / 60); const gk = L.run.gk;
          if (px && s > 5) { const j = Math.hypot(gk.x - px[0], gk.y - px[1]); if (j > jump) { jump = j; window.__jw = `${s} ${px.map(v => v.toFixed(1))} -> ${gk.x.toFixed(1)},${gk.y.toFixed(1)} ${gk.state}`; } } px = [gk.x, gk.y]; if (m.ball.owner === gk || m.ball.inNet) break;
          const b = m.ball; if (zp == null && !b.owner && (bx - gk.x) * (b.x - gk.x) <= 0) zp = b.z; bx = b.x; }
        const t = L.run.last || '', S = m.gkSpLast; return { o: t.split(' · ')[2] || t, mv: S ? S.n : '-', jump, zp, jw: window.__jw }; });
      if (E.V) console.log('   ', res.jw);
      out[res.o] = (out[res.o] || 0) + 1; moves.add(res.mv); out.jumpMax = Math.max(out.jumpMax || 0, +res.jump.toFixed(2)); if (res.zp != null) out.zAtHim = Math.max(out.zAtHim || 0, +res.zp.toFixed(2));
    }
    const goals = out.GOAL || 0; if (goals || out.jumpMax > 2) bad++;   // (over 2 m in a frame: BUG WATCH would call it a TELEPORT)
    console.log(`${goals || out.jumpMax > 2 ? "FAIL" : "ok  "} COVER ${k.padEnd(5)} ${N} shots: ${JSON.stringify(out)} · moves ${[...moves].join(', ')}`);
  }
  console.log(`errors ${JSON.stringify(errs.slice(0, 5))}`);
  await br.close(); process.exit(bad || errs.length ? 1 : 0);
})();
