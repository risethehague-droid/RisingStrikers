// s-curled-setpieces (Luca 1 Nov: "bind it to the proper wasd buttons"). Serve game/ and run bash tools/mklab.sh first; node tools/wasdcorner.js
// WASD corners in the Lab's FREE PLAY > CORNER: L in-swinger, I out-swinger, hold K driven, J short (+ C still works); the prompt names the WASD keys
const { chromium } = require('playwright');
(async () => { const br = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const errs = [], out = [];
  const page = await (await br.newContext({ viewport: { width: 1366, height: 768 } })).newPage(); page.on('pageerror', e => errs.push(e.message));
  await page.addInitScript(() => { window.HC2_KEYS = 'wasd'; });
  await page.goto(`http://localhost:${process.env.PORT || 8765}/labtest.html`); await page.waitForFunction(() => window.__lab && window.__lab.active, null, { timeout: 120000 });
  await page.evaluate(() => { window.__hc2.game.loop.sleep(); window.__T = 5e6; const m = window.__hc2; window.__said = []; const s0 = m.say.bind(m); m.say = (a, b, c) => { window.__said.push(a + ' | ' + b); return s0(a, b, c); }; });
  await page.evaluate(() => { const m = window.__hc2, st = m.stadium; for (const t of st.tiles) for (const k of t.uniq) if (!m.textures.exists(k)) st.queue.add(k); st.pump(); });
  for (let i = 0; i < 3000; i++) { const done = await page.evaluate(() => { const m = window.__hc2, st = m.stadium; window.__T += 1000 / 60; m.game.step(window.__T, 1000 / 60); return !st.loading && !st.queue.size; }); if (done) break; await new Promise(r => setTimeout(r, 20)); }
  const step = n => page.evaluate(n => { const g = window.__hc2.game; for (let k = 0; k < n; k++) { window.__T += 1000 / 60; g.step(window.__T, 1000 / 60); } }, n);
  for (const [key, want, hold] of [['KeyL', 'in'], ['KeyI', 'out'], ['KeyK', 'driven', 40], ['KeyJ', 'short'], ['KeyC', 'in (arrows key)']]) {
    await page.click('#fp [data-mv="set-corner"]', { timeout: 180000 });
    let ready = false; for (let i = 0; i < 80 && !ready; i++) { await step(10); ready = await page.evaluate(() => { const sp = window.__hc2.setPiece; return !!(sp && !sp.su && sp.setup && !sp.kicked && sp.kind === 'CORNER'); }); }
    await page.evaluate(() => { const m = window.__hc2; m.spCurlLast = undefined; window.__kick = null; const k0 = m.kick.bind(m); m.kick = (p, x, y, s, vz, sp, info) => { window.__kick = window.__kick || { mode: info && info.mode, setCurl: info && info.setCurl, drive: !!(info && info.drive) }; return k0(p, x, y, s, vz, sp, info); }; });
    await page.keyboard.down(key); await step(hold || 2); await page.keyboard.up(key); await step(4);
    const r = await page.evaluate(() => ({ kick: window.__kick, curl: window.__hc2.spCurlLast && window.__hc2.spCurlLast.swing, said: window.__said.filter(s => /^CORNER/.test(s)).slice(-1)[0] }));
    out.push({ key, want, ready, ...r });
  }
  console.log(JSON.stringify(out, null, 1), '\nerrors', JSON.stringify(errs.slice(0, 3))); await br.close(); })();
