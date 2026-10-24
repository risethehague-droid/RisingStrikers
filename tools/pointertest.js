// t-009 check: the "you" arrow and the direction pointer (Luca, 24 Oct: "make a more contrasting visible arrow which
// shows who you control, make a lowkey but useful pointing arrow that shows direction"). Plays a real match headless
// (test.html, time stepped by hand), you on the home side, and checks:
//   - the cursor sits over the man you control, follows a control switch and pops (bigger for a moment) when it does
//   - the cursor colour against the kit: red on a blue-ish kit or a green one, blue on the others
//   - the pointer shows only while you push, points where you push (with the ball too), hides with POINTER: OFF,
//     in a replay (the cursor too) and in the demo / watch mode
// STILLS=<dir> also saves stills (a rainy night, a crowded box); they work on main's code too (for "before" shots).
// Serve the game first (CLAUDE.md "Testing"): PORT=8765 node tools/pointertest.js
const { chromium } = require('playwright');
const E = process.env, PORT = E.PORT || 8765;
(async () => {
  const br = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await br.newPage({ viewport: { width: 1280, height: 720 } }); const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(`http://localhost:${PORT}/test.html#flow`); await page.waitForFunction(() => window.__hc2 && window.__hc2.home, null, { timeout: 120000 });
  await page.evaluate(() => { const m = window.__hc2; m.game.loop.sleep(); window.__T = 1e6; window.HC2_NO_DEMO = true; window.HC2_STARTED = true;
    for (const id of ['start', 'flow']) { const e = document.getElementById(id); if (e) e.remove(); }
    window.__step = n => { for (let k = 0; k < n; k++) { window.__T += 1000 / 60; m.game.step(window.__T, 1000 / 60); if (m.cutIn) m.cutInEnd(); } };
    window.__push = (...codes) => { Input.keys.clear(); for (const c of codes) Input.keys.add(c); }; });
  const teams = async (h, a) => { await page.evaluate(([h, a]) => { window.__ready = false; window.__hc2.setTeams(h, a, () => { window.__ready = true; }); }, [h, a]);
    await page.waitForFunction(() => window.__ready, null, { timeout: 120000 });
    await page.evaluate(() => { const m = window.__hc2; let s = 7; Math.random = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
      m.kickoff(m.home); m.demo = false; window.__step(150); }); };
  const fails = [], ok = (c, what) => { if (!c) fails.push(what); console.log(`${c ? 'ok  ' : 'FAIL'} ${what}`); };
  await teams('IS', 'IRO');
  if (E.STILLS) {                                                                   // stills: (1) rain at night, pushing right
    const fs = require('fs'); fs.mkdirSync(E.STILLS, { recursive: true });
    const box = await page.evaluate(() => { const r = document.querySelector('#game canvas').getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; });
    // pick a still frame: the stadium tiles stream in as the game ticks, so give them real time to arrive
    const settle = async () => { for (let i = 0; i < 40; i++) { await page.evaluate(() => window.__step(1)); await new Promise(r => setTimeout(r, 50)); } };
    await page.evaluate(() => { const m = window.__hc2; m.mset = { ...m.mset, tod: 'night', weather: 'rain' }; m.buildSky(); window.__push('KeyD', 'KeyS'); });
    await settle(); await page.screenshot({ path: `${E.STILLS}/night-rain.png`, clip: box });
    // (2) a crowded box: ten men bunched around you near their goal, the ball dropping over your head; the spots are
    // put back every frame (they'd run off) while the camera and the tiles catch up
    await page.evaluate(() => { const m = window.__hc2; m.mset = { ...m.mset, tod: 'day', weather: 'clear' }; m.buildSky(); window.__push('KeyD'); setBwOn(false);
      const me = m.human, gx = m.home.goalX - m.home.side * 13, spots = new Map(); let i = 0;
      for (const p of m.all) { if (p.keeper || p.sentOff) continue; if (p === me) { spots.set(p, [gx, 34]); continue; }
        if (i >= 10) continue; const a = i * 0.63 + 0.3, r = 1.6 + (i % 3) * 1.1; spots.set(p, [gx + Math.cos(a) * r, 34 + Math.sin(a) * r * 1.3]); i++; }
      window.__hold = () => { for (const [p, [x, y]] of spots) { p.x = x; p.y = y; p.vx = p.vy = 0; } Object.assign(m.ball, { owner: null, x: gx + 0.2, y: 34.1, z: 2.4, vx: 0, vy: 0, vz: 0 }); }; });
    for (let i = 0; i < 40; i++) { await page.evaluate(() => { window.__hold(); window.__step(1); }); await new Promise(r => setTimeout(r, 50)); }
    await page.screenshot({ path: `${E.STILLS}/crowded-box.png`, clip: box });
    await page.evaluate(() => { window.__push(); setBwOn(true); });
    console.log(`stills in ${E.STILLS}`);
    if (E.STILLS_ONLY) { console.log('errors', JSON.stringify(errs.slice(0, 4))); await br.close(); return; }
    await teams('IS', 'IRO');
  }
  // 1. the cursor follows the man you control, and pops on a switch
  let r = await page.evaluate(() => { const m = window.__hc2, c = m.cursor, hp = m.human;
    return { dx: Math.abs(c.x - wx(hp.x, hp.y)), above: wy(hp.y) - c.y, s: c.scaleX, vis: c.visible && c.alpha > 0 }; });
  ok(r.vis && r.dx <= 1 && r.above > 100 && r.above < 140, `cursor over your man (dx ${r.dx.toFixed(1)}, ${r.above.toFixed(0)} px up)`);
  ok(Math.abs(r.s - CUR_SCALE_T) < 0.05, `cursor at its size (scale ${r.s.toFixed(2)})`);
  r = await page.evaluate(() => { const m = window.__hc2; Object.assign(m.ball, { owner: null, x: 52.5, y: 60, z: 0, vx: 0, vy: 0, vz: 0 }); m.nextHuman = null;   // (a loose ball: on the ball the owner is always you)
    const old = m.human; m.switchHuman(); if (m.human === old) m.human = m.home.players.find(p => p !== old && !p.keeper);
    window.__step(2); const c = m.cursor, hp = m.human, s0 = c.scaleX; window.__step(30);
    return { sw: m.human !== old, dx: Math.abs(c.x - wx(hp.x, hp.y)), s0, s1: c.scaleX }; });
  ok(r.sw && r.dx <= 1, `control switch: the cursor moves to the new man (dx ${r.dx.toFixed(1)})`);
  ok(r.s0 > r.s1 * 1.2 && Math.abs(r.s1 - CUR_SCALE_T) < 0.05, `control switch: it pops (scale ${r.s0.toFixed(2)} -> ${r.s1.toFixed(2)})`);
  // 2. kit colours
  r = await page.evaluate(() => ({ IS: curColFor(TEAM_COL.IS), IRO: curColFor(TEAM_COL.IRO), LUC: curColFor(TEAM_COL.LUC), THUAS: curColFor(TEAM_COL.THUAS),
    blue: curColFor(0x2a5ce0), sky: curColFor(0x6ab4f0), tex: window.__hc2.cursorImg.texture.key }));
  ok(r.blue.endsWith('red') && r.sky.endsWith('red'), `a blue-ish kit gets the red cursor (${r.blue}, ${r.sky})`);
  ok(r.IS.endsWith('blue') && r.IRO.endsWith('blue') && r.LUC.endsWith('blue') && r.THUAS.endsWith('red'), `IS / IRO / LUC blue, THUAS red (${r.IS} ${r.IRO} ${r.LUC} ${r.THUAS})`);
  ok(r.tex === r.IS, `IS at home: the cursor is ${r.tex}`);
  // 3. the pointer: only while you push, the way you push
  const ptr = async (...keys) => page.evaluate(k => { window.__push(...k); window.__step(3); return window.__hc2.ptrShown; }, keys);
  ok(!(await ptr()), 'no push: no pointer');
  r = await ptr('KeyD'); ok(r && r.dx > 0.99, `push right: the pointer points right (${r && r.dx.toFixed(2)}, ${r && r.dy.toFixed(2)})`);
  r = await ptr('KeyW', 'KeyA'); ok(r && r.dx < -0.6 && r.dy < -0.6, `push up-left: it points up-left (${r && r.dx.toFixed(2)}, ${r && r.dy.toFixed(2)})`);
  r = await page.evaluate(() => { const m = window.__hc2, hp = m.human; Object.assign(m.ball, { owner: hp, x: hp.x + 0.4, y: hp.y, z: 0, vx: 0, vy: 0, vz: 0 });
    window.__push('KeyS'); window.__step(2); return { own: m.ball.owner === m.human, p: m.ptrShown }; });
  ok(r.p && r.p.dy > 0.99, `with the ball, push down: it points down, the pass direction (owns ${r.own})`);
  await page.evaluate(() => setPtrOn(false)); r = await ptr('KeyD'); ok(!r, 'POINTER: OFF hides it');
  await page.evaluate(() => setPtrOn(true)); r = await ptr('KeyD'); ok(!!r, 'POINTER: ON brings it back');
  r = await page.evaluate(() => { const m = window.__hc2; const pm = m.pm; m.pm = { page: 'opts', i: 0 }; const it = m.pauseItems(); m.pm = pm; return it.some(x => x.k === 'ptr' && /POINTER: ON/.test(x.l)); });
  ok(r, 'the pause menu options list POINTER: ON');
  // 4. hidden in a replay (the cursor too) and in the demo / watch mode
  r = await page.evaluate(() => { const m = window.__hc2; window.__push('KeyD'); window.__step(60);
    m.startReplay('REPLAY', () => {}, (m.rec || []).slice(-60).map(f => Object.assign({}, f)), { caption: 'TEST' }); window.__step(10);
    const o = { rep: !!m.replay, p: m.ring.visible && m.ptrShown, cur: m.cursor.visible }; if (m.replay) m.endReplay(); window.__step(3); o.after = m.ptrShown; return o; });
  ok(r.rep && !r.p && !r.cur, `in a replay: no pointer, no cursor (replay ${r.rep}, pointer ${!!r.p}, cursor ${r.cur})`);
  ok(!!r.after, 'after the replay: the pointer is back');   // (in a replay the grass layer with the pointer is hidden and not redrawn)
  r = await page.evaluate(() => { const m = window.__hc2; m.demo = true; window.__step(3); const o = { p: m.ptrShown, a: m.cursor.alpha }; m.demo = false; return o; });
  ok(!r.p && r.a === 0, 'demo / watch mode: no pointer, no cursor');
  await page.evaluate(() => window.__push());
  console.log(fails.length ? `FAILED: ${fails.length}` : 'all ok', 'errors', JSON.stringify(errs.slice(0, 4))); await br.close();
  process.exit(fails.length || errs.length ? 1 : 0);
})();
const CUR_SCALE_T = 3;   // (CUR_SCALE in ui.js)
