// FREE KICK ROUND THE WALL (card s-fk-curl): your direct free kick, aimed at a corner, from 20-26 m (central and a
// little wide). Their wall forms on 9.15 m and their keeper is the real keeper AI. With FK_CURL on and off: how often
// the wall blocks it, how often it's on target (between the posts, under the bar), how often it goes in.
//   (serve the game first: cd game && python3 -m http.server 8765)   N=24 PORT=8765 node tools/fkcurl.js
const { chromium } = require('playwright');
(async () => { const br = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await br.newPage({ viewport: { width: 640, height: 360 } }); const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(`http://localhost:${process.env.PORT || 8765}/test.html#flow`); await page.waitForFunction(() => window.__hc2 && window.__hc2.home, null, { timeout: 120000 });
  const out = await page.evaluate(N => { const m = window.__hc2, g = m.game; g.loop.sleep(); window.HC2_NO_DEMO = true; let T = 1e6;
    for (const id of ['start', 'flow']) { const e = document.getElementById(id); if (e) e.remove(); }
    m.cameras.main.setVisible(false); m.startReplay = function (l, after) { if (after) after(); }; m.ramiSay = () => {};
    let seed = 7; const RND = Math.random; Math.random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    const step = () => { T += 1000 / 60; g.step(T, 1000 / 60); if (m.cutIn) m.cutInEnd(); if (m.replay) m.endReplay(); };
    const res = {};
    for (const on of [false, true]) { FK_CURL.on = on; seed = 99; let wall = 0, target = 0, goal = 0, curled = 0, n = 0;
      for (let t = 0; t < N; t++) {
        window.HC2_STARTED = true; m.demo = false; m.human = m.home.players[9]; m.home.score = m.away.score = 0; m.kickoff(m.home); for (let i = 0; i < 30; i++) step();
        const s = Math.sign(m.home.goalX - 52.5), D = 20 + (t % 4) * 2, Y = 34 + [0, -6, 6, -3][t % 4], X = m.home.goalX - s * D;
        Object.assign(m.ball, { x: X, y: Y, z: 0, vx: 0, vy: 0, vz: 0, owner: null, last: m.away, lastP: m.away.players[5] });
        m.restart('FREE KICK', m.home, X, Y);
        for (let i = 0; i < 60 * 20 && !(m.setPiece && m.setPiece.setup && !m.setPiece.su && m.setPiece.taker); i++) step();
        const sp = m.setPiece; if (!sp || !sp.taker) { continue; } sp.t = 0; Input.keys.clear();
        const corner = (t >> 2) % 2 ? 1 : -1; m.aimPt = Object.assign(m.aimPt || {}, { x: m.home.goalX + s * 0.5, y: 34 + corner * 2.8 });
        m.spKick('shot', 0.62 + (t % 3) * 0.05);
        let o = '', z = null, v0 = null; const gk = m.away.players[0];
        let px = m.ball.x, pv = 0; const x0 = m.ball.x, y0 = m.ball.y;
        for (let i = 0; i < 60 * 3 && !o; i++) { step(); const b = m.ball;
          if (!v0 && !b.owner && b.vx) v0 = [+b.vx.toFixed(1), +b.vy.toFixed(1), +b.vz.toFixed(1)];
          const v = Math.hypot(b.vx, b.vy), fromK = Math.hypot(b.x - x0, b.y - y0);
          if ((b.lastP && b.lastP.team === m.away && !b.lastP.keeper) || (pv > 8 && v < pv * 0.7 && fromK > 7 && fromK < 12)) { o = 'wall'; const nq = m.all.filter(q => !q.sentOff).sort((a, c) => Math.hypot(a.x - b.x, a.y - b.y) - Math.hypot(c.x - b.x, c.y - b.y))[0]; o += ':' + nq.team.name + nq.num + '@' + Math.hypot(nq.x - b.x, nq.y - b.y).toFixed(1) + 'z' + b.z.toFixed(1); }   // (a block off a body keeps the last man: the pace drops at the wall)
          else if (m.home.score) o = 'in';
          else if (b.owner === gk) o = 'saved';
          else if (b.lastP === gk) o = 'saved';
          else if (v0 && (px - m.home.goalX) * (b.x - m.home.goalX) <= 0) o = Math.abs(b.y - 34) < 3.66 && b.z < 2.44 ? 'in' : 'wide';
          px = b.x; pv = v; }
        (res.log = res.log || []).push([on ? 'C' : 'S', D, Y, o, m.fkCurlLast && m.fkCurlLast.deg, +m.ball.y.toFixed(1), +m.ball.z.toFixed(1), +m.ball.x.toFixed(1), !!m.ball.inNet, m.ball.lastP && m.ball.lastP.num, sp.taker.num, v0]);
        n++; if (m.fkCurlLast) curled++; m.fkCurlLast = null;
        if (o.startsWith('wall')) wall++; if (o === 'in' || o === 'saved') target++; if (o === 'in') goal++;
        m.setPiece = null; m.dead = null; m.pending = null;
      }
      res[on ? 'curl' : 'off (main)'] = { wall: Math.round(wall / n * 100) + '%', onTarget: Math.round(target / n * 100) + '%', goals: Math.round(goal / n * 100) + '%', saved: Math.round((target - goal) / n * 100) + '%', curled, taken: n }; }
    Math.random = RND; FK_CURL.on = true; return res; }, +(process.env.N || 24));
  const L = out.log; delete out.log; if (process.env.LOG) for (const l of L) console.log(JSON.stringify(l));   // LOG=1: every kick [mode, metres, y, outcome, curl degrees, ball y / z / x at the end, in net, last man, taker, v0]
  for (const k in out) console.log(k.padEnd(11), JSON.stringify(out[k]));
  console.log('errors', JSON.stringify(errs.slice(0, 4))); await br.close(); })();
