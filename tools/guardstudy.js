// qa-flag-20261031-2 (Luca's flag, 31 Oct: "goalie just let the ball past"): FREE PLAY's TIRED KEEPER move again and
// again, headless - the shot from his flag (a power shot, ~0.83, low to the far post) at a keeper whose KEEPER GUARD is
// worn down, as after a few power shots in a row. Counts goals and how many went straight THROUGH him (a guard break).
//   node tools/guardstudy.js        PORT=8765, N=60 (shots per guard), GUARDS=1,0.4,0.2, POW=0.83
// Serve the game and build the Lab page first: (cd game && python3 -m http.server 8765) · bash tools/mklab.sh
const { chromium } = require('playwright');
const E = process.env, N = +(E.N || 60), GUARDS = (E.GUARDS || '1,0.4,0.2').split(',').map(Number), POW = +(E.POW || 0.83);
(async () => {
  const br = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await br.newPage({ viewport: { width: 640, height: 360 } }); const errs = [];
  page.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' | ')));
  await page.goto(`http://localhost:${E.PORT || 8765}/labtest.html`);
  await page.waitForFunction(() => window.__lab && window.__lab.active, null, { timeout: 120000 });
  for (const G of GUARDS) {
    const c = await page.evaluate(([G, N, POW]) => { const L = window.__lab, m = window.__hc2, g = m.game; g.loop.sleep(); m.cameras.main.setVisible(false);
      let T = window.__T || 5e6; const c = { shots: 0, goals: 0, through: 0, held: 0, other: 0 };
      const gb = m.guardBreak; let broke = 0; m.guardBreak = function (...a) { broke++; return gb.apply(this, a); };
      L.tiredGuard = G; L.tiredPow = POW;
      for (let i = 0; i < N; i++) { L.api.fpMove('gk-tired'); broke = 0; let goal = false, held = false;
        for (let k = 0; k < 60 * 5; k++) { T += 1000 / 60; g.step(T, 1000 / 60); if (m.cutIn) m.cutInEnd(); if (m.replay) m.endReplay();
          if (m.ball.inNet) { goal = true; break; } if (m.ball.owner && m.ball.owner.keeper) held = true; }
        c.shots++; if (goal) { c.goals++; if (broke) c.through++; } else if (held) c.held++; else c.other++; }
      m.guardBreak = gb; window.__T = T; L.tiredGuard = L.tiredPow = undefined; return c; }, [G, N, POW]);
    console.log(`guard ${String(G).padEnd(4)} power ${POW}: shots ${c.shots} · goals ${c.goals} (THROUGH HIM ${c.through}) · held ${c.held} · parried / wide / other ${c.other}`);
  }
  console.log('errors', JSON.stringify(errs.slice(0, 4))); await br.close();
})();
