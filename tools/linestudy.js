// LINE STUDY: how does today's back line and keeper stand? (Luca, 31 Oct: "the defenders are not thinking like
// defenders (not holding a defensive line etc) which then make the goalkeeper go too far out leaving a big gap behind
// him" - docs/role-ai-plan.md, step 0). Counting only, built on tools/aistudy.js: the same seeded set-ups, the
// computer on both sides; it reads the players every 0.1 s and never draws a random number.
// While one side has the ball 20 m+ from the other's goal it counts, for the defending side: the back four's spread
// (deepest to highest, m), the deepest defender's and the keeper's height off their goal line, the gap between them, a
// defender pulled 8 m+ out of the line, and the same by where the ball is (20-35, 35-50, 50+ m from goal). At each goal:
// the keeper's furthest point and the line's spread in the 1.5 s before it.
//
//   node tools/linestudy.js                  6 matches (seeds 1-6, IS v IRO both ways), full length
//   MATCHES=12 FROM=6 SETUP='<js>' ...       as tools/aistudy.js
//   PORT=8765 (default): serve the game first with  python3 -m http.server 8765 --directory game
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const E = process.env, PORT = E.PORT || 8765, N = +(E.MATCHES || 6);
// IS v IRO, home and away in turn: tools/preview.js MATCH=1 can only load the two kits the page boots with (another
// pair waits forever for its kits while the game is paused), and every moment found here has to replay there as a GIF
const setup = i => (i % 2 ? { seed: i + 1, home: 'IRO', away: 'IS' } : { seed: i + 1, home: 'IS', away: 'IRO' });


// in the page: one match, sampled every 6 frames (0.1 s) - counting only
function studyMatch() {
  const m = window.__hc2, g = m.game, R = window.__ai = { f: 0, n: 0, spread: 0, height: 0, gkH: 0, gap: 0, pulled: 0, gkFar: 0, gkFarSamples: [], goals: [], ring: [], bands: [0,1,2].map(() => ({ n: 0, kh: 0, mn: 0, spread: 0, free: 0, freeMn: 0, gk12: 0 })), deepCB: 0, flat: 0 };
  const T = () => R.f / 60, H = (t, x) => (x - t.ownGoalX) * t.side;
  const sample = () => {
    const b = m.ball, o = b.owner; if (m.setPiece || m.over || !o) { R.ring.push(null); if (R.ring.length > 40) R.ring.shift(); return; }
    const att = o.team, def = att.opp, k = def.players[0];
    const backs = def.players.filter(p => p.i >= 1 && p.i <= 4 && !p.sentOff);
    const bh = H(def, b.x), kh = k && !k.sentOff ? H(def, k.x) : 0;
    const rec = { t: T(), kh, bh, side: def.side };
    if (backs.length >= 3 && bh > 20) {                                        // they have it, 20 m+ from our goal: our shape
      const hs = backs.map(p => H(def, p.x)), mn = Math.min(...hs), mx = Math.max(...hs), mean = hs.reduce((a, x) => a + x, 0) / hs.length;
      R.n++; R.spread += mx - mn; R.height += mn; R.gkH += kh; R.gap += mn - kh; if (mx - mn < 4) R.flat++;
      if (hs.some(h => h - (mean * hs.length - h) / (hs.length - 1) > 8)) R.pulled++;
      if (kh > 14) { R.gkFar++; }
      rec.mn = mn; rec.spread = mx - mn;
      const band = bh < 35 ? 0 : bh < 50 ? 1 : 2, B = R.bands[band], pr = Math.min(...def.players.filter(q => !q.keeper && !q.sentOff).map(q => Math.hypot(q.x - o.x, q.y - o.y)));
      B.n++; B.kh += kh; B.mn += mn; B.spread += mx - mn; if (pr > 5) { B.free++; B.freeMn += mn; } if (kh > 12) B.gk12++;
    }
    R.ring.push(rec); if (R.ring.length > 40) R.ring.shift();
  };
  let sc = [m.home.score, m.away.score];
  window.__aiStep = n => { for (let k = 0; k < n && !m.over; k++) { window.__T += 1000 / 60; g.step(window.__T, 1000 / 60); R.f++;
      if (m.cutIn) m.cutInEnd(); if (m.replay) m.endReplay();
      if (R.f % 6 === 0) sample();
      const s2 = [m.home.score, m.away.score];
      if (s2[0] !== sc[0] || s2[1] !== sc[1]) { const conc = s2[0] !== sc[0] ? m.away : m.home, k0 = conc.players[0];
        const recs = R.ring.filter(Boolean).filter(r => r.side === conc.side), last = recs.slice(-15);
        R.goals.push({ t: +T().toFixed(1), gkMax: last.length ? +Math.max(...last.map(r => r.kh)).toFixed(1) : null, lineMin: last.length && last[0].mn != null ? +Math.min(...last.filter(r => r.mn != null).map(r => r.mn)).toFixed(1) : null,
          spreadMax: last.filter(r => r.spread != null).length ? +Math.max(...last.filter(r => r.spread != null).map(r => r.spread)).toFixed(1) : null, lob: !!m.ball.lob, set: !!m.lastSetPiece });
        sc = s2; }
    }
    return { over: m.over, clock: m.clock, score: `${m.home.score}-${m.away.score}` }; };
}

(async () => {
  const br = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const all = [];
  for (let i = 0; i < N; i++) {
    const c = setup(i + +(E.FROM || 0)), page = await br.newPage({ viewport: { width: 1280, height: 720 } }); const errs = [];
    page.on('pageerror', e => errs.push(e.message));
    // exactly tools/preview.js MATCH=1's set-up (so a moment found here replays there)
    await page.goto(`http://localhost:${PORT}/test.html#flow`);
    await page.waitForFunction(() => window.__hc2 && window.__hc2.home, null, { timeout: 120000 });
    if (E.SETUP) await page.evaluate(E.SETUP);                         // (smarter-ai stage 2: SETUP='<js>' first, e.g. a tunable or window.__styles)
    await page.evaluate(() => { const m = window.__hc2; m.game.loop.sleep(); window.__T = 1e6; window.HC2_NO_DEMO = true; window.HC2_STARTED = true;
      for (const id of ['start', 'flow']) { const e = document.getElementById(id); if (e) e.remove(); } });
    await page.evaluate(([h, a]) => { window.__ready = false; window.__hc2.setTeams(h, a, () => { window.__ready = true; }); }, [c.home, c.away]);
    await page.waitForFunction(() => window.__ready, null, { timeout: 120000 });
    await page.evaluate(() => { const m = window.__hc2, st = m.stadium; for (const t of st.tiles) for (const k of t.uniq) if (!m.textures.exists(k)) st.queue.add(k); st.pump(); });
    for (let k = 0; k < 3000; k++) { const done = await page.evaluate(() => { const m = window.__hc2, st = m.stadium; window.__T += 1000 / 60; m.game.step(window.__T, 1000 / 60); return !st.loading && !st.queue.size; }); if (done) break; await new Promise(r => setTimeout(r, 20)); }
    await page.evaluate(studyMatch);
    if (!E.DRAW) await page.evaluate(() => window.__hc2.cameras.main.setVisible(false));   // (no drawing: ~10x faster)
    else await page.evaluate(() => { window.__aiDraw = true; });
    await page.evaluate(seed => { const m = window.__hc2; let s = seed >>> 0;
      Math.random = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
      m.demo = true; m.kickoff(m.home); }, c.seed);
    if (E.UNTIL) { const r = await page.evaluate(n => { window.__aiStep(n); const m = window.__hc2; return `clock ${m.clock.toFixed(1)} score ${m.home.score}-${m.away.score}`; }, Math.round(+E.UNTIL * 60)); console.log(`${c.home} v ${c.away} seed ${c.seed} at ${E.UNTIL} s: ${r}`); await page.close(); continue; }
    let s; for (let k = 0; k < 80; k++) { s = await page.evaluate(() => window.__aiStep(600)); if (E.VERBOSE) console.log(`  ${k}: clock ${Math.round(s.clock)} ${s.score}`); if (s.over) break; }
    const R = await page.evaluate(() => { const R = window.__ai, S = window.__hc2.mstats || {}; R.stats = JSON.parse(JSON.stringify(S)); return R; });
    R.setup = c; R.score = s.score; R.errors = errs; all.push(R);
    console.log(`${c.home} v ${c.away} seed ${c.seed}: ${s.score} goals ${JSON.stringify(R.goals)}`);
    await page.close();
  }
  await br.close();
  const S = k => all.reduce((a, R) => a + k(R), 0), N2 = S(R => R.n);
  const G = all.flatMap(R => R.goals);
  console.log('\nSUMMARY ' + JSON.stringify({ matches: all.length, samples: N2,
    backLineSpread: +(S(R => R.spread) / N2).toFixed(1), flatLinePct: +(100 * S(R => R.flat) / N2).toFixed(0), deepestDefenderFromGoal: +(S(R => R.height) / N2).toFixed(1),
    keeperOffLine: +(S(R => R.gkH) / N2).toFixed(1), gapKeeperToLine: +(S(R => R.gap) / N2).toFixed(1), oneDefenderPulled8mPct: +(100 * S(R => R.pulled) / N2).toFixed(0),
    keeperOver14mPct: +(100 * S(R => R.gkFar) / N2).toFixed(1), goals: G.length, goalsKeeper10mPlusOut: G.filter(g => g.gkMax > 10).length, goalsLobbed: G.filter(g => g.lob).length,
    errors: S(R => R.errors.length) }, null, 1));
  for (const [i, nm] of ['ball 20-35 m from our goal', 'ball 35-50 m', 'ball 50+ m'].entries()) { const n = S(R => R.bands[i].n), f = S(R => R.bands[i].free);
    console.log(`${nm}: keeper ${(S(R => R.bands[i].kh) / n).toFixed(1)} m out (over 12 m ${(100 * S(R => R.bands[i].gk12) / n).toFixed(0)}%), deepest defender ${(S(R => R.bands[i].mn) / n).toFixed(1)} m, line spread ${(S(R => R.bands[i].spread) / n).toFixed(1)} m, carrier unpressured ${(100 * f / n).toFixed(0)}% (line then ${(S(R => R.bands[i].freeMn) / Math.max(1, f)).toFixed(1)} m)`); }
})();
function pc(a, b) { return b ? Math.round(100 * a / b) + '%' : '-'; }
