// t-038 TEST LAB NAVIGATION + FREE PLAY CHECK (Luca 29 Oct 00:38: "the test lab must be completely fixed, as of now I
// cannot actually navigate it, it's missing moves"). Headless, at 1366x768 and 1280x720:
//  - the Lab opens on FREE PLAY with no #test in the link, on the named test with #K01, RESUME goes back to the last test
//  - the BACK / NEXT / ALL TESTS / FREE PLAY buttons do what they say
//  - ALL TESTS fits the window, and every group and every test in it can be scrolled to and clicked (a real click on
//    each group, and on every test once each group is expanded); search finds "keeper", "t-031", "GH3"; 1-9 / 0; Esc
//  - FREE PLAY (MOVES=0 skips it): every move button pressed in turn, time stepped by hand - each one must run without a
//    page error and make something happen (the ball, your player, their keeper or a set piece); one line per move.
// Serve the game and build the Lab page first: (cd game && python3 -m http.server 8765) · bash tools/mklab.sh
//   node tools/labnav.js            PORT=8765, VIEWS=1366x768,1280x720 (none: skip), MOVES=1 (ONLY=gk-lowl,curler: just those moves)
const { chromium } = require('playwright');
const E = process.env, PORT = E.PORT || 8765, URL = `http://localhost:${PORT}/labtest.html`;
const VIEWS = E.VIEWS === 'none' ? [] : (E.VIEWS || '1366x768,1280x720').split(',').map(v => v.split('x').map(Number));   // (VIEWS=none: only the moves)
let fails = 0; const ok = (c, msg) => { console.log(`${c ? 'ok  ' : 'FAIL'} ${msg}`); if (!c) fails++; };
(async () => {
  const br = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const errs = [];
  const open = async (page, hash = '') => {
    await page.goto(URL + hash); await page.waitForFunction(() => window.__lab && window.__lab.active, null, { timeout: 120000 });
  };
  const cur = page => page.evaluate(() => { const L = window.__lab; return { g: L.groups[L.g].id, id: L.groups[L.g].tests[L.i].id }; });
  for (const [W, H] of VIEWS) {
    console.log(`\n== ${W}x${H}`);
    const ctx = await br.newContext({ viewport: { width: W, height: H } }), page = await ctx.newPage();
    page.on('pageerror', e => errs.push(`${W}x${H} ${e.message} ${(e.stack || '').split('\n').slice(1, 3).join(' | ')}`));
    await open(page);
    ok((await cur(page)).g === 'FP', 'opens on FREE PLAY with no #test in the link');
    // the nav bar
    for (const id of ['nav-back', 'nav-next', 'nav-all', 'nav-fp']) ok(await page.isVisible('#' + id), `#${id} visible`);
    await page.click('#nav-next'); let c = await cur(page); ok(c.g !== 'FP', `NEXT → ${c.id}`);
    await page.click('#nav-next'); c = await cur(page); const second = c.id; ok(true, `NEXT → ${c.id}`);
    await page.click('#nav-back'); c = await cur(page); ok(c.id !== second, `BACK → ${c.id}`);
    await page.click('#nav-fp'); c = await cur(page); ok(c.g === 'FP', 'FREE PLAY button → FREE PLAY');
    await page.keyboard.press(']'); c = await cur(page); ok(c.g !== 'FP', `] → ${c.id} (in FREE PLAY B is the game's SPECIAL)`);
    await page.keyboard.press('['); c = await cur(page); ok(c.g === 'FP', '[ → back to FREE PLAY');
    // ALL TESTS: open, fits, every group by a real click
    await page.click('#nav-all'); ok(await page.isVisible('#menu'), 'ALL TESTS opens');
    const fit = await page.evaluate(() => { const r = document.querySelector('#menu .card').getBoundingClientRect(); return { top: r.top, bottom: r.bottom, h: innerHeight }; });
    ok(fit.top >= 0 && fit.bottom <= fit.h, `the list fits the window (card ${Math.round(fit.top)}-${Math.round(fit.bottom)} of ${fit.h} px)`);
    await page.keyboard.press('Escape'); ok(!(await page.isVisible('#menu')), 'Esc closes it');
    const groups = await page.evaluate(() => window.__lab.groups.map(g => ({ id: g.id, name: g.name, tests: g.tests.map(t => t.id) })));
    let gOk = 0;
    for (let j = 0; j < groups.length; j++) {
      await page.click('#nav-all');
      const sel = `#menu-body .mg-open[data-g="${j}"]`, n = await page.locator(sel).count();
      await page.locator(sel).nth(n - 1).click({ timeout: 5000 });          // (its own section's row; NEWEST repeats the newest)
      c = await cur(page); if (c.g === groups[j].id && !(await page.isVisible('#menu'))) gOk++; else ok(false, `group ${groups[j].id} by click → ${c.id}`);
    }
    ok(gOk === groups.length, `every group opens by a click: ${gOk} / ${groups.length}`);
    // every test: expand each group (its ▸), scroll to each test and check it's the thing under the pointer, then click a few for real
    await page.click('#nav-all');
    await page.fill('#menu-q', '');
    await page.evaluate(() => { for (const b of document.querySelectorAll('#menu-body .mg-x')) { const j = +b.dataset.x; if (!window.__lab.menuOpen.has(j)) { const x = document.querySelector(`#menu-body .mg-x[data-x="${j}"]`); x.click(); } } });
    const reach = await page.evaluate(() => { const L = window.__lab, miss = []; let n = 0;
      L.groups.forEach((g, j) => g.tests.forEach((t, i) => { const bs = [...document.querySelectorAll(`#menu-body .mg-t button[data-g="${j}"][data-i="${i}"]`)]; const b = bs[bs.length - 1];
        if (!b) { miss.push(t.id + ' (not listed)'); return; } b.scrollIntoView({ block: 'nearest' }); const r = b.getBoundingClientRect(), el = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
        if (el && b.contains(el)) n++; else miss.push(t.id); }));
      return { n, miss, total: L.groups.reduce((a, g) => a + g.tests.length, 0) }; });
    ok(reach.n === reach.total, `every test listed, in view after scrolling and clickable: ${reach.n} / ${reach.total}${reach.miss.length ? ' · missing ' + reach.miss.slice(0, 8).join(', ') : ''}`);
    const lastG = groups.length - 1, deep = [[lastG, groups[lastG].tests.length - 1], [groups.findIndex(g => g.id === 'K'), 29], [groups.findIndex(g => g.id === 'GH'), 2]];
    for (const [j, i] of deep) {
      if (!(await page.isVisible('#menu'))) await page.click('#nav-all');
      const xs = `#menu-body .mg-x[data-x="${j}"]`, n = await page.locator(xs).count(), x = page.locator(xs).nth(n - 1);
      if ((await x.getAttribute('aria-expanded')) !== 'true') await x.click();
      const ts = `#menu-body .mg-t button[data-g="${j}"][data-i="${i}"]`, tn = await page.locator(ts).count();
      await page.locator(ts).nth(tn - 1).click({ timeout: 5000 }); c = await cur(page);
      ok(c.id === groups[j].tests[i], `test ${groups[j].tests[i]} by a real click (scrolled to) → ${c.id}`);
    }
    // search, number keys
    await page.click('#nav-all');
    await page.fill('#menu-q', 'keeper');
    const kq = await page.evaluate(() => [...document.querySelectorAll('#menu-body .mg-open em')].map(e => e.textContent));
    ok(kq.length >= 6, `search "keeper" → ${kq.length} groups (${kq.slice(0, 4).join(' / ')} ...)`);
    await page.fill('#menu-q', 't-031'); ok(await page.evaluate(() => [...document.querySelectorAll('#menu-body .mg-open em')].some(e => /KEEPER HANDS/.test(e.textContent))), 'search "t-031" finds KEEPER HANDS');
    await page.fill('#menu-q', 'GH3'); await page.press('#menu-q', 'Enter'); c = await cur(page); ok(c.id === 'GH3', `search "GH3" + Enter → ${c.id}`);
    await page.click('#nav-all'); await page.press('#menu-q', '3'); c = await cur(page);
    const k3 = await page.evaluate(() => { const L = window.__lab; return L.groups[L.menuKeys[2]].id; }); ok(c.g === k3, `key 3 (search empty) → the group marked 3 (${c.g})`);
    await page.click('#nav-all'); await page.keyboard.press('1'); c = await cur(page); ok(c.g === 'FP', 'key 1 → FREE PLAY');
    // RESUME and #links
    await page.click('#nav-all'); await page.fill('#menu-q', 'KC4'); await page.press('#menu-q', 'Enter');
    await open(page); c = await cur(page);
    ok(c.g === 'FP' && await page.isVisible('#nav-resume'), `reopened: FREE PLAY, RESUME shows "${(await page.textContent('#nav-resume')).trim()}"`);
    await page.click('#nav-resume'); c = await cur(page); ok(c.id === 'KC4', `RESUME → ${c.id}`);
    await open(page, '#K01'); c = await cur(page); ok(c.id === 'K01', `#K01 → ${c.id}`);
    await open(page, '#lab-gh'); c = await cur(page); ok(c.g === 'GH', `#lab-gh → group ${c.g}`);
    await ctx.close();
  }
  // ---- FREE PLAY: every move button
  if (E.MOVES !== '0') {
    console.log('\n== FREE PLAY moves (1366x768, time stepped by hand)');
    const ctx = await br.newContext({ viewport: { width: 1366, height: 768 } }), page = await ctx.newPage();
    page.on('pageerror', e => errs.push(`FP ${e.message} ${(e.stack || '').split('\n').slice(1, 3).join(' | ')}`));
    await open(page); await page.evaluate(() => { window.__hc2.game.loop.sleep(); window.__T = 5e6; });
    // every pitch tile first (as tools/preview.js): stepping time by hand outruns the tile streaming, and a tile decoding
    // later blocks the page for seconds (the next click then times out)
    await page.evaluate(() => { const m = window.__hc2, st = m.stadium; for (const t of st.tiles) for (const k of t.uniq) if (!m.textures.exists(k)) st.queue.add(k); st.pump(); });
    for (let i = 0; i < 3000; i++) { const done = await page.evaluate(() => { const m = window.__hc2, st = m.stadium; window.__T += 1000 / 60; m.game.step(window.__T, 1000 / 60); return !st.loading && !st.queue.size; });
      if (done) break; await new Promise(r => setTimeout(r, 20)); }
    const moves = await page.evaluate(() => window.__lab.api.FP_MOVES.map(x => ({ mv: x.mv, n: x.n, sec: x.sec, game: !!x.game })));
    const only = E.ONLY ? E.ONLY.split(',') : null; let mOk = 0, mN = 0;
    for (const mv of moves) {
      if (only && !only.includes(mv.mv)) continue; mN++;
      const e0 = errs.length;
      await page.click(`#fp [data-mv="${mv.mv}"]`, { timeout: 180000 });   // (swiftshader draws the stepped frames afterwards: the page can be busy for a while)
      const secs = /^set-/.test(mv.mv) ? 9 : mv.mv === 'gk-walk' ? 9 : /^gk-cl|^gk-sv|^sp|^air-sp/.test(mv.mv) ? 6 : 4.5;
      const res = await page.evaluate(secs => { const m = window.__hc2, g = m.game, L = window.__lab, r = L.run, b = m.ball;
        const idle = /^(idle|run|walk|jog|labanim)$/; let vMax = 0, sp = false; const st = new Set(), gs = new Set(), x0 = { x: b.x, y: b.y };
        for (let k = 0; k < secs * 60; k++) { window.__T += 1000 / 60; g.step(window.__T, 1000 / 60); const R = L.run, p = R.human, gk = R.gk;
          vMax = Math.max(vMax, Math.hypot(b.vx, b.vy, b.vz)); if (m.setPiece) sp = true;
          if (!idle.test(p.state)) st.add(p.state + (p.kickAnim ? ':' + p.kickAnim : '')); if (gk && !gk.sentOff && !idle.test(gk.state)) gs.add(gk.state + (gk.saveKind ? ':' + gk.saveKind : '') + (gk.hands ? ':hands' : ''));
          if (p.jockeyOn) st.add('jockey'); }
        return { vMax, sp, st: [...st].slice(0, 4), gs: [...gs].slice(0, 4), last: (L.run.why ? L.run.why.toUpperCase() + " · " : "") + (L.run.last || ""), moved: Math.hypot(b.x - x0.x, b.y - x0.y) }; }, secs);
      if (/^set-/.test(mv.mv) && res.sp) {                                    // a set piece: then YOU take it (C crosses, Z throws short)
        await page.keyboard.press(mv.mv === 'set-throw' ? 'KeyZ' : 'KeyC');
        const t = await page.evaluate(() => { const m = window.__hc2, g = m.game; for (let k = 0; k < 120; k++) { window.__T += 1000 / 60; g.step(window.__T, 1000 / 60); if (!m.setPiece) return true; } return false; });
        res.last += t ? ' → you took it' : ' → NOT TAKEN'; if (!t) res.sp = false;
      }
      const did = res.vMax > 1.5 || res.st.length || res.gs.length || res.sp, good = did && errs.length === e0;
      if (good) mOk++;
      console.log(`${good ? 'ok  ' : 'FAIL'} ${mv.n.padEnd(22)} ${mv.game ? 'IN THE GAME' : 'LAB ONLY   '} · ball ${Math.round(res.vMax * 3.6)} km/h${res.st.length ? ' · you: ' + res.st.join(', ') : ''}${res.gs.length ? ' · keeper: ' + res.gs.join(', ') : ''}${res.sp ? ' · set piece' : ''} · "${res.last}"`);
      if (errs.length > e0) console.log('     ' + errs.slice(e0).join('\n     '));
      if (!good) fails++;
    }
    console.log(`FREE PLAY: ${mOk} / ${mN} moves ran and did something`);
    await ctx.close();
  }
  console.log('\nerrors', JSON.stringify(errs.slice(0, 6))); console.log(fails ? `${fails} FAILED` : 'all checks passed');
  await br.close(); process.exit(fails || errs.length ? 1 : 0);
})();
