// AI STUDY: how smart does the team AI look today? (The co-designer, 24 Oct: "improve the general game AI, not
// necessarily making it harder, but making them smarter. Running, positioning, better passes, less clunky. For both
// enemy teams and allied team." 27 Oct: stage 1 = measure, then the 7 clunkiest moments as GIFs.)
// Counting only: it wraps the game's own moves and reads the players every 0.1 s; it never draws a random number, so a
// match plays exactly as it would without it. Each match is set up exactly like tools/preview.js MATCH=1 (same page,
// tiles preloaded, the same seeded dice, the computer on both sides), so any moment it finds replays as a GIF with
//   MATCH=1 VS=<home>,<away> SEED=<seed> SKIP=<t> OUT=... node tools/preview.js
//
//   node tools/aistudy.js                        6 matches (seeds 1-6, rotating team pairs), full length
//   MATCHES=12 node tools/aistudy.js             more
//   OUT=docs/ai/study.json node tools/aistudy.js also write every number and every candidate moment as JSON
//   PORT=8765 (default): serve the game first with  python3 -m http.server 8765 --directory game
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const E = process.env, PORT = E.PORT || 8765, N = +(E.MATCHES || 6);
const TEAMS = ['IS', 'IRO', 'USCS', 'LUC', 'THUAS', 'AUC'];
const setup = i => { const h = TEAMS[i % 6]; let a = TEAMS[(i * 5 + 1) % 6]; if (a === h) a = TEAMS[(i + 3) % 6]; return { seed: i + 1, home: h, away: a }; };

// in the page: one match, sampled every 6 frames (0.1 s)
function studyMatch() {
  const m = window.__hc2, g = m.game, b = () => m.ball, R = window.__ai = {
    f: 0, samples: 0, live: 0,
    idle: { poss: 0, def: 0, possN: 0, defN: 0 },        // outfield men standing still (speed < 0.3) in live play
    turns: 0, stutter: 0, manSec: 0,                     // sharp turnarounds, go-stop-go, per man-second moving
    bunch: 0, swarm: 0, swarmN: 0, width: [0, 0], depth: [0, 0], wN: [0, 0],
    opts: 0, optsN: 0, noOpt: 0,                          // the carrier's open team-mates (a clear lane, within 28 m)
    passes: { n: 0, man: 0, kept: 0, lost: 0, out: 0, fwd: 0, marked: 0, markedLost: 0, byMode: {} },
    losses: { tackled: 0 }, cand: [],
  };
  const T = () => R.f / 60;
  const outf = t => t.players.filter(p => !p.keeper && !p.sentOff);
  const frame = (t, x) => (t.side > 0 ? x : 105 - x);
  const hist = new Map();                                 // per player: recent headings / speeds for turns and stutters
  const idleRun = new Map(), bunchRun = { t: 0 }, swarmRun = new Map(), noOptRun = { p: null, t: 0 };
  let pend = null;                                         // the last pass, until someone has the ball
  const dp = m.doPass;
  m.doPass = function (p, dir, mode, to) {
    const r = dp.call(this, p, dir, mode, to);
    const k = this.pending || null, q = (k && k.info && k.info.target) || to || null;
    if (!p.keeper && !this.setPiece) {
      let mk = 99; if (q) for (const o of p.team.opp.players) if (!o.sentOff) mk = Math.min(mk, Math.hypot(o.x - q.x, o.y - q.y));
      pend = { p, q, mode, t: T(), team: p.team, fwd: q ? frame(p.team, q.x) - frame(p.team, p.x) : 0, marked: mk < 2 };
    }
    return r;
  };
  const lanes = (p) => {                                   // team-mates he could pass to: within 28 m, nobody within 1.8 m of the line
    let n = 0;
    for (const q of outf(p.team)) { if (q === p) continue; const dx = q.x - p.x, dy = q.y - p.y, L = Math.hypot(dx, dy); if (L > 28 || L < 3) continue;
      let ok = true; for (const o of p.team.opp.players) { if (o.sentOff) continue; const t = ((o.x - p.x) * dx + (o.y - p.y) * dy) / (L * L); if (t < 0.05 || t > 1.05) continue;
        if (Math.hypot(p.x + dx * t - o.x, p.y + dy * t - o.y) < 1.8) { ok = false; break; } }
      if (ok) n++; }
    return n;
  };
  const cand = (kind, p, extra) => { const last = R.cand.filter(c => c.kind === kind).pop(); if (last && T() - last.t < 8) return;
    R.cand.push(Object.assign({ kind, t: +T().toFixed(1), team: p ? p.team.name : null, man: p ? p.i : null, clock: Math.round(m.clock) }, extra || {})); };
  let lastOwner = null;
  const sample = () => {
    R.samples++; const ball = b(), live = m.bw && m.bw.live() && !m.setPiece; if (!live) { pend = null; idleRun.clear(); return; }
    R.live++;
    const owner = ball.owner;
    // the pass that was in flight: who got it
    if (pend && owner && owner === pend.p && T() - pend.t < 1.5) { /* the wind-up: it hasn't left his foot yet */ }
    else if (pend && owner) { const P = R.passes, bm = P.byMode[pend.mode] = P.byMode[pend.mode] || { n: 0, kept: 0 };
      P.n++; bm.n++; if (pend.fwd > 2) P.fwd++; if (pend.marked) P.marked++;
      if (owner.team === pend.team) { P.kept++; bm.kept++; if (owner === pend.q) P.man++; }
      else { P.lost++; if (pend.marked) { P.markedLost++; cand('pass_into_marked_man', pend.p, { to: pend.q ? pend.q.i : null, mode: pend.mode, at: +pend.t.toFixed(1) }); } }
      pend = null; }
    if (pend && T() - pend.t > 6) { R.passes.out++; pend = null; }
    if (owner && lastOwner && owner.team !== lastOwner.team && !pend && Math.hypot(owner.x - lastOwner.x, owner.y - lastOwner.y) < 3) R.losses.tackled++;
    lastOwner = owner || lastOwner;
    for (const team of [m.home, m.away]) {
      const ps = outf(team), poss = !!(owner && owner.team === team);
      // shape: width / depth of the outfield ten
      const xs = ps.map(p => p.x), ys = ps.map(p => p.y), k = poss ? 0 : 1;
      R.width[k] += Math.max(...ys) - Math.min(...ys); R.depth[k] += Math.max(...xs) - Math.min(...xs); R.wN[k]++;
      // bunching: pairs of team-mates within 3 m, away from the ball (a duel on the ball isn't bunching)
      let pairs = 0, tri = null;
      for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) { const a = ps[i], c = ps[j];
        if (Math.hypot(a.x - c.x, a.y - c.y) < 3 && Math.hypot(a.x - ball.x, a.y - ball.y) > 8) { pairs++;
          const third = ps.find(o => o !== a && o !== c && Math.hypot(o.x - a.x, o.y - a.y) < 4.5 && Math.hypot(o.x - c.x, o.y - c.y) < 4.5); if (third) tri = a; } }
      R.bunch += pairs;
      if (tri) { bunchRun.t += 0.1; if (bunchRun.t > 1.5) cand('three_bunched_off_the_ball', tri); } else bunchRun.t = 0;
      // swarm: men within 7 m of the ball when they don't have it
      if (!poss && owner) { const near = ps.filter(p => Math.hypot(p.x - ball.x, p.y - ball.y) < 7).length; R.swarm += near; R.swarmN++;
        const s = (swarmRun.get(team) || 0) + 0.1; if (near >= 3) { swarmRun.set(team, s); if (s > 2) cand('swarm_on_the_ball', ps[0], { near }); } else swarmRun.set(team, 0); }
      for (const p of ps) {
        const human = p === m.human && !m.demo; if (human) continue;
        const v = Math.hypot(p.vx, p.vy), still = v < 0.3 && !p.busy() && p !== owner;
        if (poss) { R.idle.possN++; if (still) R.idle.poss++; } else { R.idle.defN++; if (still) R.idle.def++; }
        // a man standing still while his team attacks, ahead of the ball and near it (should offer or run)
        const ahead = frame(team, p.x) > frame(team, ball.x) - 2, near = Math.hypot(p.x - ball.x, p.y - ball.y) < 25;
        const ir = still && poss && ahead && near ? (idleRun.get(p) || 0) + 0.1 : 0; idleRun.set(p, ir);
        if (ir > 3) cand('standing_still_in_attack', p, { secs: +ir.toFixed(1) });
        // turns and stutters
        let h = hist.get(p); if (!h) hist.set(p, h = []); h.push({ t: T(), v, a: Math.atan2(p.vy, p.vx) }); while (h.length && T() - h[0].t > 2) h.shift();
        if (v > 1.5) R.manSec += 0.1;
        const prev = h.length > 4 ? h[h.length - 5] : null;   // 0.4 s ago
        if (prev && prev.v > 1.5 && v > 1.5) { let d = Math.abs(h[h.length - 1].a - prev.a); if (d > Math.PI) d = 2 * Math.PI - d;
          if (d > 2.35 && !(h.lastTurn > T() - 0.4)) { R.turns++; h.lastTurn = T(); h.turnsAt = (h.turnsAt || []).filter(x => T() - x < 3); h.turnsAt.push(T());
            if (h.turnsAt.length >= 3 && p !== owner) cand('dithering_back_and_forth', p, { turns: h.turnsAt.length }); } }
        if (h.length > 8) { const s = h.slice(-10).map(x => x.v > 1.2 ? 1 : x.v < 0.3 ? 0 : -1).filter(x => x >= 0); let flips = 0; for (let i = 1; i < s.length; i++) if (s[i] !== s[i - 1]) flips++;
          if (flips >= 3 && !(h.lastSt > T() - 1)) { R.stutter++; h.lastSt = T(); } }
      }
    }
    // the carrier's options
    if (owner && !owner.keeper && !(owner === m.human && !m.demo)) { const n = lanes(owner); R.opts += n; R.optsN++; if (n === 0) R.noOpt++;
      if (n === 0) { if (noOptRun.p === owner) noOptRun.t += 0.1; else { noOptRun.p = owner; noOptRun.t = 0.1; } if (noOptRun.t > 2) cand('carrier_with_no_one_to_pass_to', owner, { secs: +noOptRun.t.toFixed(1) }); }
      else noOptRun.t = 0;
      if ((owner.y < 1.2 || owner.y > 66.8)) cand('carrier_runs_into_the_touchline', owner); }
  };
  window.__aiStep = n => { for (let k = 0; k < n && !m.over; k++) { window.__T += 1000 / 60; g.step(window.__T, 1000 / 60); R.f++;
      if (m.cutIn) m.cutInEnd(); if (m.replay) m.endReplay();           // (no cut-ins / replays: the match plays straight on)
      if (R.f % 6 === 0) sample(); }
    return { over: m.over, clock: m.clock, score: `${m.home.score}-${m.away.score}` }; };
}

(async () => {
  const br = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const all = [];
  for (let i = 0; i < N; i++) {
    const c = setup(i), page = await br.newPage({ viewport: { width: 1280, height: 720 } }); const errs = [];
    page.on('pageerror', e => errs.push(e.message));
    // exactly tools/preview.js MATCH=1's set-up (so a moment found here replays there)
    await page.goto(`http://localhost:${PORT}/test.html#flow`);
    await page.waitForFunction(() => window.__hc2 && window.__hc2.home, null, { timeout: 120000 });
    await page.evaluate(() => { const m = window.__hc2; m.game.loop.sleep(); window.__T = 1e6; window.HC2_NO_DEMO = true; window.HC2_STARTED = true;
      for (const id of ['start', 'flow']) { const e = document.getElementById(id); if (e) e.remove(); } });
    await page.evaluate(([h, a]) => { window.__ready = false; window.__hc2.setTeams(h, a, () => { window.__ready = true; }); }, [c.home, c.away]);
    await page.waitForFunction(() => window.__ready, null, { timeout: 120000 });
    await page.evaluate(() => { const m = window.__hc2, st = m.stadium; for (const t of st.tiles) for (const k of t.uniq) if (!m.textures.exists(k)) st.queue.add(k); st.pump(); });
    for (let k = 0; k < 3000; k++) { const done = await page.evaluate(() => { const m = window.__hc2, st = m.stadium; window.__T += 1000 / 60; m.game.step(window.__T, 1000 / 60); return !st.loading && !st.queue.size; }); if (done) break; await new Promise(r => setTimeout(r, 20)); }
    await page.evaluate(studyMatch);
    await page.evaluate(() => window.__hc2.cameras.main.setVisible(false));   // (no drawing: ~10x faster; the play itself doesn't change)
    await page.evaluate(seed => { const m = window.__hc2; let s = seed >>> 0;
      Math.random = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
      m.demo = true; m.kickoff(m.home); }, c.seed);
    let s; for (let k = 0; k < 80; k++) { s = await page.evaluate(() => window.__aiStep(600)); if (E.VERBOSE) console.log(`  ${k}: clock ${Math.round(s.clock)} ${s.score}`); if (s.over) break; }
    const R = await page.evaluate(() => { const R = window.__ai, S = window.__hc2.mstats || {}; R.stats = JSON.parse(JSON.stringify(S)); return R; });
    R.setup = c; R.score = s.score; R.errors = errs; all.push(R);
    const P = R.passes;
    console.log(`${c.home} v ${c.away} seed ${c.seed}: ${s.score} · passes ${P.n}, kept ${pc(P.kept, P.n)}, to the man ${pc(P.man, P.n)}, into a marked man ${P.marked} (lost ${P.markedLost}) · idle in attack ${pc(R.idle.poss, R.idle.possN)} · turns ${(R.turns / R.manSec * 60).toFixed(1)}/man-min · candidates ${R.cand.length}${errs.length ? ' · ERRORS ' + errs.length : ''}`);
    await page.close();
  }
  await br.close();
  // the summary (all matches together)
  const S = k => all.reduce((a, R) => a + k(R), 0), n = all.length;
  const P = { n: S(R => R.passes.n), man: S(R => R.passes.man), kept: S(R => R.passes.kept), lost: S(R => R.passes.lost), out: S(R => R.passes.out), fwd: S(R => R.passes.fwd), marked: S(R => R.passes.marked), markedLost: S(R => R.passes.markedLost) };
  const modes = {}; for (const R of all) for (const [k, v] of Object.entries(R.passes.byMode)) { const x = modes[k] = modes[k] || { n: 0, kept: 0 }; x.n += v.n; x.kept += v.kept; }
  const sum = {
    matches: n, goalsPerMatch: +(S(R => R.score.split('-').reduce((a, x) => a + +x, 0)) / n).toFixed(2),
    shotsPerMatch: +(S(R => Object.values(R.stats).reduce((a, t) => a + (t.shots || 0), 0)) / n).toFixed(1),
    onTargetPerMatch: +(S(R => Object.values(R.stats).reduce((a, t) => a + (t.onT || 0), 0)) / n).toFixed(1),
    running: { idleInAttackPct: +(100 * S(R => R.idle.poss) / S(R => R.idle.possN)).toFixed(1), idleDefendingPct: +(100 * S(R => R.idle.def) / S(R => R.idle.defN)).toFixed(1),
      turnaroundsPerManMin: +(S(R => R.turns) / S(R => R.manSec) * 60).toFixed(2), stuttersPerManMin: +(S(R => R.stutter) / S(R => R.manSec) * 60).toFixed(2) },
    shape: { widthAttacking: +(S(R => R.width[0]) / S(R => R.wN[0])).toFixed(1), widthDefending: +(S(R => R.width[1]) / S(R => R.wN[1])).toFixed(1),
      depthAttacking: +(S(R => R.depth[0]) / S(R => R.wN[0])).toFixed(1), depthDefending: +(S(R => R.depth[1]) / S(R => R.wN[1])).toFixed(1),
      bunchedPairsPerSample: +(S(R => R.bunch) / S(R => R.live) / 2).toFixed(2), defendersNearBall: +(S(R => R.swarm) / S(R => R.swarmN)).toFixed(2) },
    carrier: { openOptions: +(S(R => R.opts) / S(R => R.optsN)).toFixed(2), noOptionPct: +(100 * S(R => R.noOpt) / S(R => R.optsN)).toFixed(1), tackledPerMatch: +(S(R => R.losses.tackled) / n).toFixed(1) },
    passing: { perMatch: +(P.n / n).toFixed(1), keptPct: +(100 * P.kept / P.n).toFixed(1), toTheManPct: +(100 * P.man / P.n).toFixed(1), forwardPct: +(100 * P.fwd / P.n).toFixed(1),
      intoMarkedManPct: +(100 * P.marked / P.n).toFixed(1), markedLostPct: P.marked ? +(100 * P.markedLost / P.marked).toFixed(1) : 0,
      byMode: Object.fromEntries(Object.entries(modes).map(([k, v]) => [k, `${v.n} (${Math.round(100 * v.kept / v.n)}% kept)`])) },
    errors: S(R => R.errors.length),
  };
  const cands = all.flatMap(R => R.cand.map(c => Object.assign({ vs: `${R.setup.home},${R.setup.away}`, seed: R.setup.seed }, c)));
  const byKind = {}; for (const c of cands) byKind[c.kind] = (byKind[c.kind] || 0) + 1;
  console.log('\nSUMMARY ' + JSON.stringify(sum, null, 1));
  console.log('\nCANDIDATE MOMENTS (per kind): ' + JSON.stringify(byKind));
  if (E.OUT) { fs.mkdirSync(path.dirname(E.OUT), { recursive: true }); fs.writeFileSync(E.OUT, JSON.stringify({ summary: sum, candidates: cands }, null, 1)); console.log('wrote ' + E.OUT); }
})();
function pc(a, b) { return b ? Math.round(100 * a / b) + '%' : '-'; }
