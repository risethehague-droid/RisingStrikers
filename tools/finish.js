// FINISH: can YOU score past their keeper at each level? (Luca 31 Oct: "i tried to play hard mode and i didnt score once,
// lvl3 shot was saved by the gk"). A scripted human striker gets the ball at a good spot (12-20 m out, central or a
// little wide), their keeper is the real keeper AI at the level, their outfield men stand off (this is the keeper's
// test, not the defence's), and he shoots:
//   placed  a good normal shot: power 0.8 to a corner (aim +-1) - what a decent player does every time
//   power   a full charge (power 1) to a corner
//   sp1 / sp2 / sp3  a special at that level (his bars), aimed at a corner
// Their meter starts at BARS (default 0,1,2,3: one run each) - their keeper can only answer with a special save when it
// has a bar. Prints goals % by level x their bars.
//   (serve the game first: cd game && python3 -m http.server 8765)
//   N=24 KINDS=placed,sp3 BARS=0,3 LEVELS=easy,normal,hard,rise node tools/finish.js
const { chromium } = require('playwright');
const N = +(process.env.N || 24), KINDS = (process.env.KINDS || 'placed,power,sp1,sp2,sp3').split(','), BARS = (process.env.BARS || '0,1,2,3').split(',').map(Number);
const LEVELS = (process.env.LEVELS || 'easy,normal,hard,rise').split(','), PORT = process.env.PORT || 8765;
(async () => {
  const br = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await br.newPage({ viewport: { width: 640, height: 360 } }); const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(`http://localhost:${PORT}/test.html#flow`); await page.waitForFunction(() => window.__hc2 && window.__hc2.home, null, { timeout: 120000 });
  const out = await page.evaluate(([N, KINDS, BARS, LEVELS]) => {
    const m = window.__hc2, g = m.game; g.loop.sleep(); window.HC2_NO_DEMO = true; window.HC2_TEST_FAST = true; let T = 1e6;
    for (const id of ['start', 'flow']) { const e = document.getElementById(id); if (e) e.remove(); }
    m.cameras.main.setVisible(false); m.render = function () {}; if (m.bw) { m.bw.tick = () => {}; m.bw.frame = () => {}; }
    m.startReplay = function (l, after) { if (after) after(); }; m.ramiSay = () => {};
    let seed = 7; const RND = Math.random; Math.random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    const step = () => { T += 1000 / 60; m.sys.step(T, 1000 / 60); if (m.cutIn) m.cutInEnd(); if (m.cutInQ) m.cutInQ = null; };
    const fresh = () => { m.home.score = m.away.score = 0; m.over = false; m.cutIn = null; m.cutInQ = null; m.clock = 0; m.half = 1; m.ht = null; m.so = null; m.penaltyMode = false;
      for (const p of m.all) { if (p.sentOff && !p.benched) { p.sentOff = false; p.hide = false; }
        if (!p.sentOff) { p.setState('idle', 0); p.stamina = 1; p.tired = false; p.cool = 0; p.stun = 0; p.yellows = 0; p.fouls = 0; p.injury = null; p.burst = 0; p.spSave = 0; } }
      m.kickoff(m.home); m.setPiece = null; m.pending = null; m.dead = null; m.freeze = 0; m.foulScene = null; m.saveAsk = null; };
    const SPOTS = [[12, 0], [14, -6], [14, 6], [17, 0], [18, -8], [18, 8], [20, -3], [20, 3]];
    let touched = false; { const gc = m.gkCount.bind(m); m.gkCount = function (team, kind) { if (team === m.away) touched = true; return gc(team, kind); }; }
    const res = {};
    window.HC2_STARTED = true; m.demo = false;
    for (const lv of LEVELS) { DIFF_LEVEL = lv; res[lv] = {};
      for (const kind of KINDS) for (const bars of BARS) { seed = 4242; let goals = 0, saved = 0, wide = 0, spSaves = 0;
        for (let t = 0; t < N; t++) {
          fresh(); const gx = m.home.goalX, s = Math.sign(gx - 52.5), [dx, dy] = SPOTS[t % SPOTS.length], aim = t % 2 ? 1 : -1;
          const h = m.home.players[9]; h.x = gx - s * dx; h.y = 34 + dy; h.vx = h.vy = 0; m.human = h; h.face = s > 0 ? 0 : 4;
          for (const p of m.home.players) if (p !== h && !p.keeper) { p.x = 52.5 - s * 10; p.y = 10 + p.i * 4; }
          for (const p of m.away.players) if (!p.keeper) { p.x = gx - s * 30; p.y = 6 + p.i * 5; p.stun = 2; }
          const k = m.away.players[0]; k.x = gx - s * 1; k.y = 34; k.vx = k.vy = 0;
          Object.assign(m.ball, { x: h.x + s * 0.5, y: h.y, z: 0, vx: 0, vy: 0, vz: 0 }); m.gain(h, 0);
          m.meterOf(m.away).e = bars; m.meterOf(m.home).e = kind.startsWith('sp') ? +kind[2] : 0;
          for (let f = 0; f < 20; f++) step();                                    // he settles in goal
          Input.keys.clear(); if (aim > 0) Input.keys.add('KeyS'); else Input.keys.add('KeyW');
          if (kind === 'placed') m.doShot(h, 0.8, aim); else if (kind === 'power') m.doShot(h, 1, aim); else m.special(h);
          let res1 = '', sp = false; touched = false;
          for (let f = 0; f < 60 * 5 && !res1; f++) { step(); if (k.spSave) sp = true;
            if (m.home.score > 0 || m.ball.inNet) res1 = 'goal';
            else if (m.ball.owner && m.ball.owner.team === m.away) res1 = 'saved';
            else if (m.dead || m.setPiece) res1 = touched || (m.ball.lastP && m.ball.lastP.team === m.away) ? 'saved' : 'wide'; }
          Input.keys.clear(); for (let f = 0; f < 60 * 8; f++) step();     // let a goal's celebration / restart run out, so it can't spill into the next try
          if (sp) spSaves++;
          if (res1 === 'goal') goals++; else if (res1 === 'wide') wide++; else saved++;
        }
        res[lv][kind + '/' + bars] = { goal: Math.round(100 * goals / N), saved: Math.round(100 * saved / N), wide: Math.round(100 * wide / N), spSave: Math.round(100 * spSaves / N) };
      } }
    Math.random = RND; DIFF_LEVEL = 'normal'; return res;
  }, [N, KINDS, BARS, LEVELS]);
  const cols = Object.keys(out[LEVELS[0]]);
  console.log('goal % (saved / wide / their special save used)  -  column = shot / their bars');
  console.log('level    ' + cols.map(c => c.padEnd(16)).join(''));
  for (const lv of LEVELS) console.log(lv.padEnd(9) + cols.map(c => { const r = out[lv][c]; return `${r.goal}% (${r.saved}/${r.wide}/${r.spSave})`.padEnd(16); }).join(''));
  console.log('errors', JSON.stringify(errs.slice(0, 4))); await br.close();
})();
