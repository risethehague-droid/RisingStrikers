// friend/arcade-pace: where does a match's time go? (co-designer: "the game should be more fast-paced and arcade-like")
// Plays full computer v computer matches headless at 1x (60 steps per second), letting replays, celebrations and cut
// scenes run their real length, and times every frame by what the game is doing: live play, a restart being set up,
// a freeze, a goal / replay, a foul scene, half time... Also counts shots, goals, restarts, possession changes, and
// how fast the ball and the players move in live play.
//   node tools/pacestudy.js [MATCHES]          (default 4; the set-ups rotate like tools/soak.js)
const { chromium } = require('playwright');
const N = +(process.argv[2] || 4), TEAMS = ['IS', 'IRO', 'USCS', 'LUC', 'THUAS', 'AUC'], LVLS = ['normal', 'hard', 'easy', 'rise'];
(async () => {
  const br = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await br.newPage({ viewport: { width: 640, height: 360 } }); const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(`http://localhost:${process.env.PORT || 8765}/test.html#flow`); await page.waitForFunction(() => window.__hc2 && window.__hc2.home, null, { timeout: 120000 });
  await page.evaluate(() => { const m = window.__hc2, g = m.game; g.loop.sleep(); window.__T = 1e6; window.HC2_NO_DEMO = true;
    for (const id of ['start', 'flow']) { const e = document.getElementById(id); if (e) e.remove(); }
    m.cameras.main.setVisible(false); window.HC2_STARTED = true; window.__rngOf = seed => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }; });
  const all = [];
  for (let i = 0; i < N; i++) {
    const c = { seed: 2000 + i * 7919, home: TEAMS[i % 6], away: TEAMS[(i * 5 + 1) % 6] === TEAMS[i % 6] ? TEAMS[(i + 3) % 6] : TEAMS[(i * 5 + 1) % 6], lvl: LVLS[i % 4] };
    await page.evaluate(c => { window.__ready = false; window.__hc2.setTeams(c.home, c.away, () => { window.__ready = true; }); }, c);
    await page.waitForFunction(() => window.__ready, null, { timeout: 120000 });
    const r = await page.evaluate(c => { const m = window.__hc2, g = m.game; Math.random = window.__rngOf(c.seed); setDiff(c.lvl);
      m.mset = { arena: 'loo', tod: 'day', weather: 'clear', ending: 'none' }; m.applyRules(); m.demo = true; m.kickoff(m.home);
      const T = {}, add = (k, s) => T[k] = (T[k] || 0) + s, C = {}, cnt = k => C[k] = (C[k] || 0) + 1, dt = 1 / 60;
      let lastOwnerTeam = null, lastSp = null, ballSum = 0, ballFast = 0, liveN = 0, plSum = 0, plN = 0, wait = {}, spT = 0, spKind = '';
      const rk = m.releaseKick.bind(m); m.releaseKick = function (k) { cnt(k.info.shot ? 'kick:shot' : 'kick:' + (k.info.mode || 'other')); return rk(k); };
      for (let f = 0; f < 60 * 60 * 14 && !m.over; f++) {
        window.__T += 1000 / 60; g.step(window.__T, 1000 / 60);
        const sp = m.setPiece, b = m.ball;
        const cat = m.replay ? 'replay' : m.cutIn ? 'special cut-scene' : m.ht ? 'half time' : (m.intro || m.pre || m.toss) ? 'walk-out / toss' : m.goalQ ? 'goal' :
          m.foulScene ? 'foul scene' : (m.hitStop > 0) ? 'hit-stop' : (m.freeze > 0) ? 'freeze' : (sp && !sp.kicked) ? 'restart: ' + sp.kind.toLowerCase() : m.dead ? 'ball dead' : 'live';
        add(cat, dt);
        if (sp && !sp.kicked) { if (sp !== lastSp) { lastSp = sp; spT = 0; spKind = sp.kind.toLowerCase(); cnt('restart: ' + spKind); } spT += dt; }
        else if (lastSp && spKind) { (wait[spKind] = wait[spKind] || []).push(spT); spKind = ''; }
        if (cat === 'live') { liveN++; const v = Math.hypot(b.vx, b.vy); ballSum += v; if (v > 15) ballFast++;
          for (const p of m.all) if (!p.keeper && !p.sentOff) { plSum += Math.hypot(p.vx || 0, p.vy || 0); plN++; }
          const ot = b.owner ? b.owner.team : null; if (ot && lastOwnerTeam && ot !== lastOwnerTeam) cnt('possession change'); if (ot) lastOwnerTeam = ot; }
      }
      const S = m.mstats || {}, H = S[m.home.name] || {}, A = S[m.away.name] || {};
      const W = {}; for (const k in wait) W[k] = +(wait[k].reduce((a, x) => a + x, 0) / wait[k].length).toFixed(1);
      return { over: m.over, score: `${m.home.score}-${m.away.score}`, shots: (H.shots || 0) + (A.shots || 0), goals: m.home.score + m.away.score, T, C, W,
        ballAvg: +(ballSum / Math.max(1, liveN)).toFixed(1), ballFastPct: Math.round(100 * ballFast / Math.max(1, liveN)), playerAvg: +(plSum / Math.max(1, plN)).toFixed(2) };
    }, c);
    const tot = Object.values(r.T).reduce((a, x) => a + x, 0);
    console.log(`#${i + 1} ${c.home} v ${c.away} (${c.lvl}) ${r.over ? 'FT' : 'NOT FINISHED'} ${r.score} · ${Math.round(tot)} s real · live ${Math.round(100 * (r.T.live || 0) / tot)}% · shots ${r.shots}`);
    all.push(r);
  }
  // averages per match
  const avg = o => { const s = {}; for (const r of all) for (const k in r[o]) s[k] = (s[k] || 0) + r[o][k] / all.length; return s; };
  const T = avg('T'), C = avg('C'), tot = Object.values(T).reduce((a, x) => a + x, 0);
  const W = {}; for (const r of all) for (const k in r.W) (W[k] = W[k] || []).push(r.W[k]);
  console.log(`\n== Average match (${all.length}): ${Math.round(tot)} s real (${(tot / 60).toFixed(1)} min)`);
  for (const [k, v] of Object.entries(T).sort((a, b) => b[1] - a[1])) console.log(`  ${k.padEnd(24)} ${v.toFixed(0).padStart(4)} s  ${(100 * v / tot).toFixed(1).padStart(5)}%`);
  console.log('== Per match');
  for (const [k, v] of Object.entries(C).sort((a, b) => b[1] - a[1])) console.log(`  ${k.padEnd(24)} ${v.toFixed(1)}`);
  console.log(`  goals                    ${(all.reduce((a, r) => a + r.goals, 0) / all.length).toFixed(1)}`);
  console.log(`  shots                    ${(all.reduce((a, r) => a + r.shots, 0) / all.length).toFixed(1)}`);
  console.log('== Average wait before a restart is taken (s)');
  for (const k in W) console.log(`  ${k.padEnd(24)} ${(W[k].reduce((a, x) => a + x, 0) / W[k].length).toFixed(1)}`);
  console.log(`== Live play: ball ${(all.reduce((a, r) => a + r.ballAvg, 0) / all.length).toFixed(1)} m/s on average, ${Math.round(all.reduce((a, r) => a + r.ballFastPct, 0) / all.length)}% of the time over 15 m/s; outfield players ${(all.reduce((a, r) => a + r.playerAvg, 0) / all.length).toFixed(2)} m/s on average`);
  console.log('errors', JSON.stringify(errs.slice(0, 4))); await br.close();
})();
