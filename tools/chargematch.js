// chargematch.js (chargebtn.js, Luca 3 Nov): a whole match on the NEW keys (WASD + SHIFT + C + SPACE, J / K / I / L / O)
// with a scripted human pressing them all the time, the computer on the other side - page errors? how many charges,
// specials, special passes, dribbles and keeper saves came out? (the soak for the new controls)
//   node tools/chargematch.js     PORT=8765 · SEEDS=1,2 · LEVEL=normal · STEPS=<frames, default a whole match>
const { chromium } = require('playwright');
const E = process.env, PORT = E.PORT || 8765, SEEDS = (E.SEEDS || '1,2').split(',').map(Number), STEPS = +(E.STEPS || 60 * 400);
(async () => {
  const br = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await br.newPage({ viewport: { width: 640, height: 360 } }); const errs = []; page.on('pageerror', e => errs.push(`${e.message} ${(e.stack || '').split('\n').slice(1, 3).join(' | ')}`));
  await page.goto(`http://localhost:${PORT}/test.html#flow`); await page.waitForFunction(() => window.__hc2 && window.__hc2.home, null, { timeout: 120000 });
  for (const seed of SEEDS) {
    await page.evaluate(() => { window.__ready = false; window.__hc2.setTeams('IS', 'IRO', () => { window.__ready = true; }); });
    await page.waitForFunction(() => window.__ready, null, { timeout: 120000 });
    const out = await page.evaluate(([seed, STEPS, LEVEL]) => { const m = window.__hc2, g = m.game; g.loop.sleep(); let T = 2e6 + seed * 1e7; window.HC2_NO_DEMO = true;
      for (const id of ['start', 'flow']) { const e = document.getElementById(id); if (e) e.remove(); }
      m.cameras.main.setVisible(false); window.HC2_STARTED = true; window.HC2_KEYS = 'charge'; setDiff(LEVEL);
      let a = seed >>> 0; const rnd = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
      m.demo = false; m.home.score = m.away.score = 0; m.clock = 0; m.half = 1; m.kickoff(m.home);
      const n = { charges: 0, lv: [0, 0, 0, 0], shots: [0, 0, 0, 0], passes: 0, dribbles: 0, saves: 0, airs: 0 };
      const sp0 = m.special.bind(m); m.special = p => { const r = sp0(p); if (r && m.isHuman(p)) n.shots[m.ball.special || m.pending && m.pending.info.special || 0]++; return r; };
      const pp0 = m.spPass.bind(m); m.spPass = (...x) => { const r = pp0(...x); if (r) n.passes++; return r; };
      const sd0 = m.skillDrib.bind(m); m.skillDrib = (...x) => { const r = sd0(...x); if (r) n.dribbles++; return r; };
      const ct0 = m.chgTap.bind(m); m.chgTap = (t, p) => { const had = t.chg && t.chg.lv; ct0(t, p); if (t.chg && t.chg.lv !== had) { n.charges++; n.lv[t.chg.lv]++; } };
      const sf0 = m.saveFx.bind(m); m.saveFx = gk => { if (gk.team === m.home) n.saves++; return sf0(gk); };
      const as0 = m.airSpecial.bind(m); m.airSpecial = (p, ai) => { if (ai == null && m.isHuman(p)) n.airs++; return as0(p, ai); };
      for (let f = 0; f < STEPS && !m.over; f++) {
        const I = Input, me = m.human, b = m.ball, mine = b.owner === me; I.keys.clear();
        if (me) { const tx = mine ? m.home.goalX : b.x, ty = mine ? 34 + 12 * Math.sin(f / 80) : b.y, dx = tx - me.x, dy = ty - me.y;
          if (dx > 0.5) I.keys.add('KeyD'); if (dx < -0.5) I.keys.add('KeyA'); if (dy > 0.5) I.keys.add('KeyS'); if (dy < -0.5) I.keys.add('KeyW'); }
        if (f % 240 < 100) I.keys.add('ShiftLeft');
        const r = rnd();
        if (r < 0.012) I.downs.add('Space'); else if (r < 0.02) I.downs.add('KeyK'); else if (r < 0.024) I.downs.add('KeyI'); else if (r < 0.027) I.downs.add('KeyL');
        else if (r < 0.03) I.downs.add('KeyC'); else if (r < 0.031) I.downs.add('KeyO'); else if (r < 0.04) I.keys.add('KeyJ');
        if (m.saveAsk && rnd() < 0.3) I.downs.add('Space');
        T += 1000 / 60; g.step(T, 1000 / 60); if (m.cutIn) m.cutInEnd(); if (m.replay) m.endReplay();
        if (m.ht && m.htDone && f % 60 === 0) m.htDone();
      }
      return { score: `${m.home.score}-${m.away.score}`, clock: Math.round(m.clock), half: m.half, n }; }, [seed, STEPS, E.LEVEL || 'normal']);
    console.log(`seed ${seed}: ${JSON.stringify(out)}`);
  }
  console.log('errors', JSON.stringify(errs.slice(0, 5)));
  await br.close(); process.exit(errs.length ? 1 : 0);
})();
