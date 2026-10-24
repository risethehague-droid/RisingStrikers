// GOAL KICK (v0.10.4, Luca 24 Oct 06:21: "a clean cut away to the goalie with it in his hands and the team laid out how
// they would in a normal game"): the ball goes out over a goal line off an attacker -> the wipe, then the keeper at
// the edge of his six-yard box holding the ball, his team in a goal-kick shape, the other side outside his box; then
// he plays it out. Both ends, the computer's keeper and yours. Serve the game first: PORT=8765 node tools/goalkicktest.js
const { chromium } = require('playwright');
(async () => { const br = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await br.newPage({ viewport: { width: 640, height: 360 } }); const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(`http://localhost:${process.env.PORT || 8765}/test.html#flow`); await page.waitForFunction(() => window.__hc2 && window.__hc2.home, null, { timeout: 120000 });
  const out = await page.evaluate(() => { const m = window.__hc2, g = m.game; g.loop.sleep(); let T = 1e6; window.HC2_NO_DEMO = true; window.HC2_STARTED = true; m.demo = false;
    for (const id of ['start', 'flow']) { const e = document.getElementById(id); if (e) e.remove(); }
    const step = n => { for (let i = 0; i < n; i++) { T += 1000 / 60; g.step(T, 1000 / 60); if (m.cutIn) m.cutInEnd(); if (m.replay) m.endReplay(); } };
    const res = [];
    for (const def of [m.away, m.home]) {                                         // their goal kick (computer keeper), then yours
      m.kickoff(m.home); step(90); const att = def.opp, gx = def.ownGoalX, b = m.ball;
      m.setPiece = null; m.pending = null; m.dead = null; m.freeze = 0.02;   // (not a live frame: Bug Watch doesn't call the test's own move a jump)
      const bw0 = m.bw ? m.bw.list.length : 0;
      Object.assign(b, { owner: null, x: gx + def.side * 1.5, y: 25, z: 0.3, vx: -def.side * 9, vy: 0, vz: 0, last: att, lastP: att.players[9], inNet: false });
      let wiped = false, t = 0; const w0 = m.wipe.bind(m); m.wipe = () => { wiped = true; w0(); };
      while (t < 240 && !(b.owner === def.players[0] && def.players[0].hands)) { step(1); t++; }
      m.wipe = w0;
      const gk = def.players[0], H = p => (p.x - gx) * def.side;
      const oppIn = att.players.filter(p => !p.keeper && !p.sentOff && H(p) < 16.5 && Math.abs(p.y - 34) < 20.2).length;
      const cbs = [def.players[2], def.players[3]].map(p => `${H(p).toFixed(0)},${p.y.toFixed(0)}`);
      const r = { side: def === m.home ? 'yours' : 'theirs', held: b.owner === gk && gk.hands, frames: t, wiped, gkOut: +H(gk).toFixed(1), oppInBox: oppIn, cbs, human: m.human === gk };
      let u = 0; while (u < 60 * 8 && b.owner === gk) { step(1); u++; } r.playedOutAfter = +(u / 60).toFixed(1); r.toWho = b.owner ? b.owner.team === def ? 'mate' : 'them' : 'in flight';
      r.bugWatch = m.bw ? m.bw.list.slice(bw0).map(x => x.title + ': ' + x.msg) : []; res.push(r); }
    return res; });
  console.log(JSON.stringify(out, null, 1)); console.log('errors', JSON.stringify(errs.slice(0, 4))); await br.close(); })();
