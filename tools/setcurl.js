// CURLED SET PIECES (card s-curled-setpieces): does an in-swinging corner bend in towards goal, an out-swinger away from
// it, and a driven one fly low and fast - and do all three still land where they were aimed? Kicks a corner from each
// flag at three spots in the box with each swing and reports the bulge (m off the straight line, + = on the goal's side: an in-swinger bulges away from goal and bends back in), where it came down (m off
// the spot) and how high it went. Then plays computer v computer and counts the corners it takes by swing.
//   (serve the game first: cd game && python3 -m http.server 8765)   PORT=8765 node tools/setcurl.js
const { chromium } = require('playwright');
(async () => { const br = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await br.newPage({ viewport: { width: 640, height: 360 } }); const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(`http://localhost:${process.env.PORT || 8765}/test.html#flow`); await page.waitForFunction(() => window.__hc2 && window.__hc2.home, null, { timeout: 120000 });
  await page.evaluate(n => { window.__MIN = n; }, +(process.env.MIN || 20));
  const out = await page.evaluate(() => { const m = window.__hc2, g = m.game; g.loop.sleep(); window.HC2_NO_DEMO = true;
    for (const id of ['start', 'flow']) { const e = document.getElementById(id); if (e) e.remove(); }
    const b = m.ball, gx = m.home.goalX, s = Math.sign(gx - 52.5), res = {};
    for (const sw of ['in', 'out', 'driven']) { const R = [];
      for (const fy of [0.4, PITCH_W - 0.4]) for (const [d, dy] of [[6, -2], [11, 0], [9, 3]]) {   // near post, the spot, far side
        const fx = gx - s * 0.4, tx = gx - s * d, ty = 34 + (fy < 34 ? -1 : 1) * dy, p = m.home.players[7];
        Object.assign(b, { x: fx, y: fy, z: 0, vx: 0, vy: 0, vz: 0, owner: null, cv: 0, spin: 0, curl: 0 }); p.x = fx; p.y = fy;
        const info = sw === 'driven' ? { mode: 'lob', cross: 'whip', drive: { tz: SP_CURL.drivenZ, T: SP_CURL.drivenT[0] + len(tx - fx, ty - fy) / SP_CURL.drivenT[1] } } : { mode: 'lob', setCurl: sw };
        m.pending = null; b.owner = p; m.releaseKick({ p, tx, ty, speed: 0, vz: 0, t: 0, info }); b.owner = null;
        const ux = (tx - fx), uy = (ty - fy), L = Math.hypot(ux, uy), gside = Math.sign(ux * (34 - fy) - uy * (gx - fx));
        let bend = 0, top = 0, t = 0, pz = b.z, land = null;
        for (; t < 5; t += 1 / 120) { ballStep(b, 1 / 120, false);
          const lat = ((b.x - fx) * -uy + (b.y - fy) * ux) / L * gside; if (Math.abs(lat) > Math.abs(bend)) bend = lat; top = Math.max(top, b.z);
          if (sw === 'driven' ? (b.vz < 0 && b.z < SP_CURL.drivenZ) : (pz > 0 && b.z <= 0 && t > 0.1)) { land = { x: b.x, y: b.y, t }; break; } pz = b.z; }
        R.push({ bend: +bend.toFixed(1), miss: land ? +Math.hypot(land.x - tx, land.y - ty).toFixed(1) : null, top: +top.toFixed(1), t: land ? +land.t.toFixed(2) : null });
      }
      res[sw] = R; }
    // the computer's corners: computer v computer for MIN minutes of game time, every corner and crossed free kick counted
    const N = {}; const sw0 = m.spSwing.bind(m); m.spSwing = sp => { const w = sw0(sp); N[sp.kind + ' ' + w] = (N[sp.kind + ' ' + w] || 0) + 1; return w; };
    let T = 1e6; m.demo = true; window.HC2_STARTED = true; m.home.score = m.away.score = 0; m.kickoff(m.home);
    for (let i = 0; i < 60 * 60 * (+window.__MIN || 20); i++) { T += 1000 / 60; g.step(T, 1000 / 60); if (m.cutIn) m.cutInEnd(); if (m.replay) m.endReplay(); if (m.over) { m.over = false; m.home.score = m.away.score = 0; m.kickoff(m.home); } }
    res.ai = N; return res; });
  for (const k in out) console.log(k.padEnd(7), JSON.stringify(out[k]));
  console.log('errors', JSON.stringify(errs.slice(0, 4))); await br.close(); })();
