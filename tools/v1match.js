// 1 V 1 IN MATCHES (card s-1v1-in-matches): does the slow-mo duel start in a real match you play, stay off when the
// computer plays itself (demo / WATCH), respect OPTIONS > 1 V 1 MOMENT: OFF, and wait ONE_V_ONE.cd seconds before the
// next one? Puts your striker through on their keeper (their outfield men far behind him) and steps the game.
//   (serve the game first: cd game && python3 -m http.server 8765)   PORT=8765 node tools/v1match.js
const { chromium } = require('playwright');
(async () => { const br = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await br.newPage({ viewport: { width: 640, height: 360 } }); const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(`http://localhost:${process.env.PORT || 8765}/test.html#flow`); await page.waitForFunction(() => window.__hc2 && window.__hc2.home, null, { timeout: 120000 });
  const out = await page.evaluate(() => { const m = window.__hc2, g = m.game; g.loop.sleep(); let T = 1e6; window.HC2_NO_DEMO = true;
    for (const id of ['start', 'flow']) { const e = document.getElementById(id); if (e) e.remove(); }
    let starts = 0, slow = 1; const st = m.v1Start.bind(m); m.v1Start = (...a) => { starts++; return st(...a); };
    const step = n => { for (let i = 0; i < n; i++) { T += 1000 / 60; g.step(T, 1000 / 60); if (m.cutIn) m.cutInEnd(); if (m.replay) m.endReplay(); if (m.v1) slow = Math.min(slow, m.v1.k); } };
    const through = () => {   // your no. 9 on the ball 20 m out, their outfield men 25 m behind him, their keeper on his line
      const p = m.human, s = Math.sign(m.home.goalX - 52.5);
      m.setPiece = null; m.pending = null; m.dead = null; m.freeze = 0; m.foulScene = null;
      p.x = m.home.goalX - s * 20; p.y = 34; m.ball.owner = p; m.ball.x = p.x; m.ball.y = p.y; m.ball.z = 0; m.ball.vx = m.ball.vy = m.ball.vz = 0;
      for (const q of m.away.players) if (q !== m.away.players[0]) { q.x = p.x - s * 25; q.vx = q.vy = 0; }
      const gk = m.away.players[0]; gk.x = m.home.goalX - s * 1; gk.y = 34; };
    const trial = (demo, opt) => { setV1Match(opt); m.v1End(); m.v1Cd = 0; starts = 0; slow = 1;
      window.HC2_STARTED = true; m.demo = false; m.human = m.home.players[9]; m.home.score = m.away.score = 0; m.kickoff(m.home); step(200);
      m.demo = demo; through(); step(30); return { starts, slow: +slow.toFixed(2) }; };
    const res = { you: trial(false, true), demo: trial(true, true), optOff: trial(false, false) };
    // the limit: one ends, and you're through again straight away - no new one until the cooldown has run
    setV1Match(true); m.demo = false; m.v1Cd = 0; starts = 0; through(); step(30); const a = starts;
    m.v1End(); through(); step(60); const b = starts; step(60 * ONE_V_ONE.cd); through(); step(30);
    res.cooldown = { first: a, rightAfter: b - a, afterCd: starts - b };
    setV1Match(true); return res; });
  console.log(JSON.stringify(out), 'errors', JSON.stringify(errs.slice(0, 4))); await br.close(); })();
