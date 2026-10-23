// v0.9.3 "YOU v THEM" proxies - a scripted human at each level (the real game, headless, your side not in demo):
//   run: he picks it up in the centre circle and runs at goal (sprint held, a burst every 1.6 s, side-steps whoever is
//        right in front). Score: how often he reaches their box.
//   def: they kick off; he (always the nearest man - a perfect switcher) gets goal-side of the carrier and taps
//        CHALLENGE when he's on the ball. Score: how often he wins it back before they reach our box, and how fast.
// The old v0.9.2 levels are emulated: OLD-NORMAL = base, OLD-HARD = v0.9.2 hard traits + base edges.
//   node proxy093.js run|def [TRIALS] [levels,comma,separated]
const { chromium } = require('playwright');
const MODE = process.argv[2] || 'run', TRIALS = +(process.argv[3] || 40), LEVELS = (process.argv[4] || 'base,oldhard,easy,normal,hard,rise').split(','), BASE = process.env.BASE || 'http://localhost:8765/';
(async () => {
  const br = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await br.newPage({ viewport: { width: 640, height: 360 } }); const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(BASE + 'test.html#flow'); await page.waitForFunction(() => window.__hc2 && window.__hc2.home, null, { timeout: 120000 });
  const out = await page.evaluate(([MODE, TRIALS, LEVELS, PD]) => {
    const m = window.__hc2, g = m.game; g.loop.sleep(); window.HC2_NO_DEMO = true; let T = 1e6;
    for (const id of ['start', 'flow']) { const e = document.getElementById(id); if (e) e.remove(); }
    m.cameras.main.setVisible(false); m.render = function () {}; if (m.bw) { m.bw.tick = () => {}; m.bw.frame = () => {}; }
    m.startReplay = function (l, after) { if (after) after(); }; m.ramiSay = () => {};
    DIFF_TRAITS.oldhard = { r: 1.6, a: 1.44, d: 1.414, k: 1.326 }; DIFF_YOU.oldhard = DIFF_YOU.base;
    if (PD != null) for (const l in DIFF_TRAITS) diffK(l).pdist *= PD;
    let seed = 7; const RND = Math.random; Math.random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    const keys = (dx, dy, sprint, tap) => { Input.keys.clear(); const l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l;
      if (ux > 0.38) Input.keys.add('KeyD'); if (ux < -0.38) Input.keys.add('KeyA'); if (uy > 0.38) Input.keys.add('KeyS'); if (uy < -0.38) Input.keys.add('KeyW');
      if (sprint) Input.keys.add('ShiftLeft'); if (tap) Input.downs.add('KeyZ'); };
    const fresh = kickTeam => { m.home.score = m.away.score = 0; m.over = false; m.cutIn = null; m.cutInQ = null; m.clock = 0; m.half = 1; m.ht = null; m.so = null; m.penaltyMode = false;
      for (const p of m.all) { if (p.sentOff && !p.benched) { p.sentOff = false; p.hide = false; }
        if (!p.sentOff) { p.setState('idle', 0); p.stamina = 1; p.tired = false; p.cool = 0; p.stun = 0; p.yellows = 0; p.fouls = 0; p.injury = null; p.burst = 0; } }
      m.kickoff(kickTeam); m.setPiece = null; m.pending = null; m.dead = null; m.freeze = 0; m.foulScene = null; };
    const res = {}; let how = '', HOW = {};
    { const st = m.steal.bind(m); m.steal = function (p, c, block) { if (p.team === m.home) how = (p === m.human ? 'you-' : 'mate-') + (block ? 'block' : 'tackle'); return st(p, c, block); };
      const gn = m.gain.bind(m); m.gain = function (p, inc) { if (p.team === m.home && !how) { const b = m.ball; how = b.last === m.away ? (b.how && b.how.kind ? 'cut-' + b.how.kind : 'cut-?') + (p === m.human ? '-you' : '-mate') : 'loose'; } return gn(p, inc); }; }
    for (const lv of LEVELS) {
      DIFF_LEVEL = lv; window.HC2_STARTED = true; m.demo = false; seed = 12345;
      let good = 0, bad = 0, tsum = 0, dsum = 0, n = 0;
      for (let t = 0; t < TRIALS; t++) {
        const gx = m.home.goalX, s = Math.sign(gx - 52.5), own = m.home.ownGoalX;
        let outc = '', loose = 0, f = 0;
        if (MODE === 'run') {
          fresh(m.home);
          const h = m.home.players[9]; h.x = 52.5 - s * 0.5; h.y = 34 + (t % 3 - 1) * 4; m.human = h;
          Object.assign(m.ball, { x: h.x + s * 0.5, y: h.y, z: 0, vx: 0, vy: 0, vz: 0 }); m.gain(h, 0);
          for (const p of m.away.players) if (!p.keeper) p.x = 52.5 + s * (p.i <= 4 ? 18 : p.i <= 8 ? 9 : 3) + (Math.random() - 0.5) * 3;
          const x0 = h.x;
          for (f = 0; f < 60 * 15; f++) {
            const b = m.ball, o = b.owner;
            if (o && o.team !== m.home) { outc = 'bad'; break; }
            if (!o) { loose += 1 / 60; if (loose > 1.2) { outc = 'bad'; break; } } else loose = 0;
            if (o && o.team === m.home && o !== m.human) m.human = o;
            if (o === m.human && Math.abs(o.x - gx) < 17 && Math.abs(o.y - 34) < 22) { outc = 'good'; break; }
            if (m.dead || m.setPiece || m.foulScene) { outc = 'foul'; break; }
            const p = m.human; let ay = Math.abs(34 - p.y) > 3 ? Math.sign(34 - p.y) : 0;
            const ahead = m.away.players.filter(q => !q.sentOff && !q.keeper && (q.x - p.x) * s > 0 && (q.x - p.x) * s < 4 && Math.abs(q.y - p.y) < 2.2).sort((u, v) => Math.abs(u.x - p.x) - Math.abs(v.x - p.x))[0];
            if (ahead) ay = p.y >= ahead.y ? 1 : -1;
            keys(s, ay, f % 96 !== 0, false);
            T += 1000 / 60; m.sys.step(T, 1000 / 60); if (m.cutIn) m.cutInEnd();
          }
          dsum += Math.abs(m.human.x - x0);
        } else {
          fresh(m.away); let tapCd = 0; how = '';
          for (f = 0; f < 60 * 20; f++) {
            const b = m.ball, o = b.owner;
            if (o && o.team === m.home) { outc = 'good'; break; }
            if (m.away.score > 0) { outc = 'bad'; break; }
            if (o && o.team === m.away && !o.keeper && Math.abs(o.x - own) < 17 && Math.abs(o.y - 34) < 22) { outc = 'bad'; break; }
            if (m.dead || m.setPiece || m.foulScene) { outc = 'foul'; break; }
            if (f % 30 === 0) { const near = m.home.players.filter(p => !p.keeper && !p.sentOff).sort((u, v) => Math.hypot(u.x - b.x, u.y - b.y) - Math.hypot(v.x - b.x, v.y - b.y))[0]; if (near) m.human = near; }
            const p = m.human, c = o && o.team === m.away ? o : null;
            let tx = b.x, ty = b.y;
            if (c) { const ux = own - c.x, uy = 34 - c.y, ul = Math.hypot(ux, uy) || 1; const d = Math.hypot(c.x - p.x, c.y - p.y); const k = d > 3 ? 1.2 : 0.4; tx = c.x + ux / ul * k + c.vx * 0.25; ty = c.y + uy / ul * k + c.vy * 0.25; }
            const db = Math.hypot(b.x - p.x, b.y - p.y); tapCd -= 1 / 60; const tap = c && db < 1.4 && tapCd <= 0; if (tap) tapCd = 0.45;
            keys(tx - p.x, ty - p.y, Math.hypot(tx - p.x, ty - p.y) > 3.5, tap);
            T += 1000 / 60; m.sys.step(T, 1000 / 60); if (m.cutIn) m.cutInEnd();
          }
          if (outc === 'good') { tsum += f / 60; HOW[how] = (HOW[how] || 0) + 1; }
        }
        Input.keys.clear(); Input.downs.clear();
        if (outc === 'good') good++; else if (outc === 'bad') bad++; n++;
        if (MODE === 'run') tsum += f / 60;
      }
      res[lv] = MODE === 'run' ? { box: Math.round(100 * good / n) + '%', lost: Math.round(100 * bad / n) + '%', metres: (dsum / n).toFixed(1) }
        : { how: (() => { const h = HOW; HOW = {}; return h; })(), wonBack: Math.round(100 * good / n) + '%', theyReachBox: Math.round(100 * bad / n) + '%', avgWin: good ? (tsum / good).toFixed(1) + ' s' : '-' };
    }
    Math.random = RND; DIFF_LEVEL = 'normal'; return res;
  }, [MODE, TRIALS, LEVELS, process.env.PD != null ? +process.env.PD : null]);
  for (const k in out) console.log(MODE, k.padEnd(8), JSON.stringify(out[k])); console.log('errors', JSON.stringify(errs.slice(0, 4))); await br.close();
})();
