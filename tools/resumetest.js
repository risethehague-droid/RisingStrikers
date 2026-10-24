// RESUME round trip (v0.10.2, Luca 24 Oct: "make it so i can resume a game that was last played in the menu").
// Plays a normal match on index.html, changes the state (score, a yellow, a red, a sub, tired legs, the meter, the
// stats, the settings), quits through the pause menu (QUIT TO MENU reloads the page), presses RESUME on the start
// screen and checks it all came back. Then: extra time comes back too, the demo behind the menu leaves the save alone,
// and full time clears it. Serve the game first (CLAUDE.md "Testing"): PORT=8765 node tools/resumetest.js
const { chromium } = require('playwright');
const URL = `http://localhost:${process.env.PORT || 8765}/index.html`;
(async () => {
  const br = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await br.newContext({ viewport: { width: 960, height: 540 } });   // (one context = one localStorage, kept across reloads)
  const page = await ctx.newPage(); const errs = [], fails = [], log = [];
  page.on('pageerror', e => errs.push(e.message));
  const ok = (c, what) => { log.push(`${c ? 'ok  ' : 'FAIL'} ${what}`); if (!c) fails.push(what); };
  const boot = async () => { await page.waitForFunction(() => window.__hc2 && window.__hc2.home, null, { timeout: 120000 });
    await page.evaluate(() => { window.HC2_SKIP_INTRO = true; window.HC2_NO_DEMO = true; }); };
  // step the game by hand (time is stepped, so a minute of play takes a moment)
  const step = secs => page.evaluate(n => { const m = window.__hc2, g = m.game; g.loop.sleep(); let T = window.__T || 1e6;
    for (let i = 0; i < n; i++) { T += 1000 / 60; g.step(T, 1000 / 60); if (m.cutIn) m.cutInEnd(); if (m.replay) m.endReplay(); if (m.paused && m.pm && !m.over) m.closePause(); }
    window.__T = T; }, Math.round(secs * 60));
  // press RESUME and hold the clock right after it (so the checks see exactly what came back)
  const clickResume = async () => { await page.evaluate(() => { const m = window.__hc2, rm = m.resumeMatch.bind(m); m.resumeMatch = S => { rm(S); m.game.loop.sleep(); window.__resumed = true; }; });
    await page.click('#resumebtn'); await page.waitForFunction(() => window.__resumed, null, { timeout: 60000 }); };
  const resumeBtn = () => page.$eval('#resumebtn', b => ({ hidden: b.hidden, text: b.textContent }));

  try {
  // 1. first visit: no RESUME. PLAY a match (sheet + walk-out skipped), play a bit
  await page.goto(URL); await boot();
  ok((await resumeBtn()).hidden, 'first visit: no RESUME button');
  await page.click('#play'); await page.waitForFunction(() => window.HC2_STARTED && window.__hc2.home.players.length, null, { timeout: 60000 });
  await step(20);
  ok(await page.evaluate(() => !!localStorage.getItem('hc2-resume')), 'a few seconds of play: a snapshot is kept');

  // 2. change everything a snapshot should carry
  const want = await page.evaluate(() => { const m = window.__hc2;
    m.mset = { arena: m.mset ? m.mset.arena : 'loo', tod: 'night', weather: 'snow', ending: 'golden' }; m.applyRules(); setDiff('hard');
    m.home.score = 2; m.away.score = 1; m.half = 2; m.clock = 67 * 60 + 30; m.lost = 75;
    m.home.players[3].yellows = 1; m.sendOff(m.away.players[5]); m.home.players[9].stamina = 0.42;
    const Q = m.squadOf(m.home), P = m.home.players[7], off = { ...m.ident(P), used: true, off: true }, onNum = Q.bench[1].num;
    m.setIdent(P, { num: onNum, stamina: 1, yellows: 0, fouls: 0 }); Q.bench[1] = off; Q.subs = 1;
    m.meters[0].e = 2.4; m.meters[1].e = 0.7; m.stat(m.home).shots = 7; m.stat(m.away).fouls = 4;
    return { onNum, offNum: off.num, h: m.home.name, a: m.away.name }; });

  // 3. QUIT TO MENU through the pause menu (it reloads the page)
  await page.evaluate(() => { const m = window.__hc2; m.openPause(); m.pauseItems().find(i => i.k === 'quit').act(); setTimeout(() => m.pauseItems().find(i => i.k === 'quit').act(), 10); });
  await page.waitForTimeout(400); await boot();
  const rb = await resumeBtn();
  ok(!rb.hidden && rb.text.includes(`${want.h} 2-1 ${want.a}`) && rb.text.includes("68'"), `start screen after QUIT: "${rb.text}"`);
  const saved = await page.evaluate(() => localStorage.getItem('hc2-resume'));

  // 4. RESUME: the same match, back where it was
  await clickResume();
  const got = await page.evaluate(() => { const m = window.__hc2, Q = m.squadOf(m.home);
    return { score: `${m.home.score}-${m.away.score}`, half: m.half, clock: m.clock, diff: DIFF_LEVEL, mset: m.mset, y3: m.home.players[3].yellows, red5: !!m.away.players[5].sentOff,
      n7: m.home.players[7].num, subs: Q.subs, b1: Q.bench[1], st9: m.home.players[9].stamina, sp: [m.meters[0].e, m.meters[1].e], shots: m.stat(m.home).shots, fouls: m.stat(m.away).fouls,
      lost: m.lost, start: !!document.getElementById('start') }; });
  ok(got.score === '2-1' && got.half === 2 && Math.abs(got.clock - (67 * 60 + 30)) < 30, `score ${got.score}, half ${got.half}, clock ${(got.clock / 60).toFixed(1)} min`);
  ok(got.diff === 'hard' && got.mset.weather === 'snow' && got.mset.tod === 'night' && got.mset.ending === 'golden', `settings: ${got.diff}, ${JSON.stringify(got.mset)}`);
  ok(got.y3 === 1 && got.red5, 'the yellow and the red card');
  ok(got.n7 === want.onNum && got.subs === 1 && got.b1 && got.b1.off && got.b1.num === want.offNum, `the sub: ${want.onNum} on for ${want.offNum}, ${got.subs} used`);
  ok(Math.abs(got.st9 - 0.42) < 0.02, `tired legs: ${got.st9.toFixed(2)}`);
  ok(Math.abs(got.sp[0] - 2.4) < 0.01 && Math.abs(got.sp[1] - 0.7) < 0.01, `special meters ${got.sp.map(v => v.toFixed(1)).join(' / ')}`);
  ok(got.shots === 7 && got.fouls === 4 && got.lost === 75, 'stats + time lost');
  ok(!got.start, 'the start screen is gone');
  await step(30);
  const on = await page.evaluate(() => ({ clock: window.__hc2.clock, over: window.__hc2.over }));
  ok(on.clock > got.clock + 120 && !on.over, `it plays on: ${(on.clock / 60).toFixed(1)} min`);

  // 5. extra time comes back as extra time
  for (let i = 0; i < 20 && !(await page.evaluate(() => window.__hc2.resumeOk())); i++) await step(0.5);   // (not mid foul scene / goal)
  await page.evaluate(() => { const m = window.__hc2; m.half = 3; m.clock = 95 * 60; m.golden = true; m.home.score = m.away.score = 1; m.resumeSave(); });
  await page.reload(); await boot();
  ok((await resumeBtn()).text.includes("96'"), `extra time on the button: "${(await resumeBtn()).text}"`);
  await clickResume();
  ok(await page.evaluate(() => window.__hc2.golden && window.__hc2.halfLabel() === 'ET1'), 'extra time + golden goal');

  // 6. closing / reloading the page keeps the moment you left; the demo behind the menu reaching full time leaves the save alone
  await page.evaluate(() => { window.__hc2.clock = 99 * 60; }); await page.reload(); await boot();
  ok((await resumeBtn()).text.includes("100'"), `a reload mid-match keeps that moment: "${(await resumeBtn()).text}"`);
  await page.evaluate(s => localStorage.setItem('hc2-resume', s), saved); await page.reload(); await boot();
  await page.evaluate(() => { const m = window.__hc2; m.demo = true; m.fullTime(); });
  ok(await page.evaluate(() => !!localStorage.getItem('hc2-resume')), 'the demo at full time: the save stays');

  // 7. full time in your match clears it: no RESUME after that
  await page.reload(); await boot();
  await clickResume();
  await page.evaluate(() => { const m = window.__hc2; m.clock = 95 * 60; m.added = 1; });
  for (let i = 0; i < 12 && !(await page.evaluate(() => window.__hc2.over)); i++) await step(5);
  ok(await page.evaluate(() => window.__hc2.over && !localStorage.getItem('hc2-resume')), 'full time: the save is gone');
  await page.reload(); await boot();
  ok((await resumeBtn()).hidden, 'start screen after full time: no RESUME');

  } catch (e) { fails.push(String(e.message || e).split('\n')[0]); log.push('STOPPED ' + fails[fails.length - 1]); }
  console.log(log.join('\n'));
  console.log(fails.length ? `FAILED ${fails.length}` : 'all ok', 'errors', JSON.stringify(errs.slice(0, 4)));
  await br.close(); process.exit(fails.length || errs.length ? 1 : 0);
})();
