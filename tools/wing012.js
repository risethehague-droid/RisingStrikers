// t-012 WING PLAY by level: the computer's side (away) at each level v base (home), new AI, N full matches (2 x 3 min)
// each, seeded. Counts the computer's crosses (whipped / floated / laid back), how many found their man (a team-mate's
// next touch), its aerial shots and aerial specials, and the goals. "The levels stay apart": Easy crosses less and
// worse, Rise Warrior picks its moment (more of its crosses find a man).
//   node tools/wing012.js [N=2]          (serve the game first: cd game && python3 -m http.server 8765)
const { chromium } = require('playwright');
(async () => {
  const N = +(process.argv[2] || 2), br = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await br.newPage({ viewport: { width: 640, height: 360 } }); const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(`http://localhost:${process.env.PORT || 8765}/test.html#flow`); await page.waitForFunction(() => window.__hc2 && window.__hc2.home, null, { timeout: 120000 });
  await page.evaluate(() => { const m = window.__hc2, g = m.game; g.loop.sleep(); window.__T = 1e6; window.HC2_NO_DEMO = true; window.HC2_SOAK = true; m.cameras.main.setVisible(false);
    for (const id of ['start', 'flow']) { const e = document.getElementById(id); if (e) e.remove(); }
    window.HC2_STARTED = true; window.__RND = Math.random; window.__C = null; const C = () => window.__C;
    const ac = m.aiCross; m.aiCross = function (p, c, K) { if (p.team === m.away) { C().cross++; C()[c.kind]++; C().pending = p; } return ac.call(this, p, c, K); };
    const as = m.airSpecial; m.airSpecial = function (p, a) { if (p.team === m.away && a != null) C().airSp++; return as.call(this, p, a); };
    const hd = m.header; m.header = function (p, kind) { if (p.team === m.away && kind === 'goal') C().head++; return hd.call(this, p, kind); }; });
  const out = {};
  for (const lv of ['easy', 'normal', 'hard', 'rise']) {
    out[lv] = { cross: 0, whip: 0, float: 0, cut: 0, found: 0, head: 0, airSp: 0, goals: 0, against: 0, shots: 0 };
    for (let n = 0; n < N; n++) {
      await page.evaluate(() => { window.__ready = false; window.__hc2.setTeams('IS', 'IRO', () => { window.__ready = true; }); });
      await page.waitForFunction(() => window.__ready, null, { timeout: 120000 });
      const c = await page.evaluate(([lv, seed]) => { const m = window.__hc2, g = m.game; const C = window.__C = { cross: 0, whip: 0, float: 0, cut: 0, found: 0, head: 0, airSp: 0, pending: null };
        let a = seed; Math.random = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
        setAiMode('new'); setDiff(lv); window.__diffTeams = { home: Object.assign({}, DIFF_TRAITS.base, { lvl: 'base' }), away: Object.assign({}, DIFF_TRAITS[lv], { lvl: lv }) };
        m.mset = { arena: 'loo', tod: 'day', weather: 'clear', ending: 'none' }; m.applyRules(); m.demo = true; m.kickoff(m.home);
        for (let i = 0; i < 60 * 60 * 9 && !m.over; i++) { window.__T += 1000 / 60; g.step(window.__T, 1000 / 60); if (m.cutIn) m.cutInEnd(); if (m.replay) m.endReplay();
          const b = m.ball; if (C.pending && b.lastP && b.lastP !== C.pending) { if (b.lastP.team === m.away) C.found++; C.pending = null; } }
        Math.random = window.__RND; const S = m.mstats || {};
        return Object.assign(C, { pending: null, goals: m.away.score, against: m.home.score, shots: (S[m.away.name] || {}).shots || 0, over: m.over }); }, [lv, 4242 + n * 977]);
      for (const k in out[lv]) out[lv][k] += c[k] || 0;
    }
  }
  for (const [lv, c] of Object.entries(out)) console.log(`${lv.padEnd(7)} per match: crosses ${(c.cross / N).toFixed(1)} (whipped ${c.whip}, floated ${c.float}, laid back ${c.cut}), found their man ${c.cross ? Math.round(100 * c.found / c.cross) : 0}% · headers at goal ${(c.head / N).toFixed(1)} · aerial specials ${(c.airSp / N).toFixed(1)} · shots ${(c.shots / N).toFixed(1)} · goals ${(c.goals / N).toFixed(1)} (conceded ${(c.against / N).toFixed(1)})`);
  console.log('errors', JSON.stringify(errs.slice(0, 4))); await br.close();
})();
