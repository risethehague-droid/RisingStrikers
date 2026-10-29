// STRATEGY: which way of attacking pays? (The co-designer, 29 Oct: "The game is currently quite unidimensional. The best
// strategy is sprinting down the middle at the goal and other strategies are all vastly inferior (for example, running
// down the wing and lobbing it for a header), we want to improve this.")
// A scripted "you" (your side not in demo: the keys are pressed, as tools/proxy093.js does) attacks from the halfway
// line against the real computer team, TRIALS times per strategy, and the attack is scored by what came of it:
//   centre  sprint straight at goal down the middle (a burst every 1.6 s, side-stepping the man right in front), shoot
//           (a held shot) once inside 17 m and central
//   wing    out to the touchline, sprint down it, cross from wide inside 20 m of the byline (LOB at the box), you are
//           switched to the man it's for; you head / volley it (SHOOT as it arrives at head / volley height)
//   pass    walk-pace build-up: a pass to the most forward free team-mate every ~1.5 s, then shoot inside 17 m
// Outcome per attack: GOAL, on-target saved, off target / blocked, LOST (they win it / a loose ball 1.5 s), a foul on you
// (PENALTY in the box, a free kick NEAR = under 30 m out, FAR), OTHER (a throw-in / corner / offside...), TIME (12 s).
//   node tools/strategy.js [TRIALS] [levels]      e.g. node tools/strategy.js 30 normal,hard
//   PACE=arcade node tools/strategy.js ...         (default CLASSIC)
const { chromium } = require('playwright');
const TRIALS = +(process.argv[2] || 30), LEVELS = (process.argv[3] || 'normal,hard').split(','), STRATS = (process.env.STRATS || 'centre,wing,pass').split(',');
(async () => {
  const br = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await br.newPage({ viewport: { width: 640, height: 360 } }); const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(`http://localhost:${process.env.PORT || 8765}/test.html#flow`); await page.waitForFunction(() => window.__hc2 && window.__hc2.home, null, { timeout: 120000 });
  const out = await page.evaluate(([TRIALS, LEVELS, STRATS, PACE]) => {
    const m = window.__hc2, g = m.game; g.loop.sleep(); window.HC2_NO_DEMO = true; let T = 1e6;
    for (const id of ['start', 'flow']) { const e = document.getElementById(id); if (e) e.remove(); }
    m.cameras.main.setVisible(false); m.render = function () {}; if (m.bw) { m.bw.tick = () => {}; m.bw.frame = () => {}; }
    m.startReplay = function (l, after) { if (after) after(); }; m.ramiSay = () => {};
    if (PACE) setPace(PACE);
    let seed = 7; const RND = Math.random; Math.random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    const keys = (dx, dy, sprint, extra) => { Input.keys.clear(); const l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l;
      if (ux > 0.38) Input.keys.add('KeyD'); if (ux < -0.38) Input.keys.add('KeyA'); if (uy > 0.38) Input.keys.add('KeyS'); if (uy < -0.38) Input.keys.add('KeyW');
      if (sprint) Input.keys.add('ShiftLeft'); for (const k of extra || []) Input.keys.add(k); };
    const fresh = () => { m.home.score = m.away.score = 0; m.over = false; m.cutIn = null; m.cutInQ = null; m.clock = 0; m.half = 1; m.ht = null; m.so = null; m.penaltyMode = false;
      for (const p of m.all) { if (p.sentOff && !p.benched) { p.sentOff = false; p.hide = false; }
        if (!p.sentOff) { p.setState('idle', 0); p.stamina = 1; p.tired = false; p.cool = 0; p.stun = 0; p.yellows = 0; p.fouls = 0; p.injury = null; p.burst = 0; } }
      m.kickoff(m.home); m.setPiece = null; m.pending = null; m.dead = null; m.freeze = 0; m.foulScene = null; };
    const step = () => { T += 1000 / 60; m.sys.step(T, 1000 / 60); if (m.cutIn) m.cutInEnd(); };
    const res = {};
    for (const lv of LEVELS) for (const st of STRATS) {
      DIFF_LEVEL = lv; window.HC2_STARTED = true; m.demo = false; seed = 12345;
      const R = { goal: 0, saved: 0, miss: 0, lost: 0, pen: 0, fkNear: 0, fkFar: 0, other: 0, time: 0, shots: 0, crosses: 0, headers: 0, secs: 0 };
      for (let t = 0; t < TRIALS; t++) {
        fresh();
        const gx = m.home.goalX, s = Math.sign(gx - 52.5);
        const h = m.home.players[st === 'pass' ? 6 : 9]; h.x = 52.5 - s * 0.5; h.y = 34 + (t % 3 - 1) * 4; m.human = h;
        Object.assign(m.ball, { x: h.x + s * 0.5, y: h.y, z: 0, vx: 0, vy: 0, vz: 0 }); m.gain(h, 0);
        for (const p of m.away.players) if (!p.keeper) p.x = 52.5 + s * (p.i <= 4 ? 18 : p.i <= 8 ? 9 : 3) + (Math.random() - 0.5) * 3;
        let crosser = null, outc = '', loose = 0, f = 0, shotAt = -1, charge = 0, wing = t % 2 ? 1 : -1, crossed = false, passCd = 1.2, tapped = 0, score0 = m.home.score;
        for (f = 0; f < 60 * 12; f++) {
          const b = m.ball, o = b.owner;
          if (m.home.score > score0) { outc = 'goal'; break; }
          if (shotAt >= 0 && f - shotAt > 150 && !b.special) { outc = b.shotOnT ? 'saved' : 'miss'; break; }
          if (o && o.team !== m.home) { outc = shotAt >= 0 ? (o.keeper ? 'saved' : 'miss') : 'lost'; if (outc === 'lost') { const k = (b.how && b.how.kind) || (b.last === m.home ? 'interception' : 'tackle'); (R.lostHow = R.lostHow || {})[k] = (R.lostHow[k] || 0) + 1; } break; }
          if (!o && shotAt < 0 && !crossed && !m.pending) { loose += 1 / 60; if (loose > 1.5) { outc = 'lost'; break; } } else loose = 0;
          if (m.dead || m.setPiece || m.foulScene) {
            if (shotAt >= 0) { outc = 'miss'; break; }
            const bx = Math.abs(gx - b.x), by = Math.abs(b.y - 34);
            outc = m.foulScene || (m.setPiece && /FREE|PEN/.test(m.setPiece.kind || '')) ? (bx < 16.5 && by < 20.2 ? 'pen' : bx < 30 ? 'fkNear' : 'fkFar') : 'other';
            if (outc === 'other') { const k = (m.setPiece && m.setPiece.kind) || (m.dead && m.dead.kind) || '?'; (R.otherHow = R.otherHow || {})[k] = (R.otherHow[k] || 0) + 1; } break; }
          if (o && o.team === m.home && o !== m.human && !o.keeper) m.human = o;
          const p = m.human, toG = Math.hypot(gx - p.x, 34 - p.y), central = Math.abs(p.y - 34) < 12;
          if (crossed && o && o.team === m.home && o !== crosser && !m.pending) { crossed = false; R.trapped = (R.trapped || 0) + 1; }   // (v0.13.0 lob receives: a clean one is chest-trapped - he plays on)
          if (shotAt >= 0 || (crossed && !(b.target && b.target.team === m.home))) { keys(0, 0, false); step(); continue; }
          if (crossed) {                                                          // the cross is on its way: be the man it's for, meet it
            const q = b.target; if (q && q.team === m.home) m.human = q;
            const d = Math.hypot(b.x - m.human.x, b.y - m.human.y);
            const tap = d < 1.6 && b.z > 0.5 && b.z < 2.8 && tapped <= 0;
            if (tap) { tapped = 0.3; R.headers++; shotAt = f; }
            tapped -= 1 / 60; keys(b.x - m.human.x, b.y - m.human.y, d > 3, tap ? ['KeyX'] : []); step(); continue;
          }
          if (o !== p) { keys(b.x - p.x, b.y - p.y, true); step(); continue; }   // (a touch away: get back on it)
          if (st === 'centre' || st === 'pass') {
            if (toG < 20 && Math.abs(p.y - 34) < 14) {                                            // shoot: a held shot, released at ~0.5
              charge += 1 / 60; keys(gx - p.x, 0, false, ['KeyX']);
              if (charge > 0.32) { Input.keys.delete('KeyX'); keys(gx - p.x, (t % 2 ? 1 : -1) * 0.3, false); shotAt = f; R.shots++; }
              step(); continue;
            }
            let ay = Math.abs(34 - p.y) > 3 ? Math.sign(34 - p.y) : 0;
            const ahead = m.away.players.filter(q => !q.sentOff && !q.keeper && (q.x - p.x) * s > 0 && (q.x - p.x) * s < 4 && Math.abs(q.y - p.y) < 2.2).sort((u, v) => Math.abs(u.x - p.x) - Math.abs(v.x - p.x))[0];
            if (ahead) ay = p.y >= ahead.y ? 1 : -1;
            if (st === 'pass') {
              passCd -= 1 / 60;
              if (passCd <= 0) {
                passCd = 1.5; const fw = m.home.players.filter(q => q !== p && !q.keeper && !q.sentOff && (q.x - p.x) * s > 2 && Math.hypot(q.x - p.x, q.y - p.y) < 30
                  && !m.away.players.some(e => !e.sentOff && Math.hypot(e.x - q.x, e.y - q.y) < 2.5)).sort((u, v) => (v.x - u.x) * s - (u.x - u.x))[0];
                if (fw) { keys(fw.x - p.x, fw.y - p.y, false, ['KeyZ']); step(); Input.keys.delete('KeyZ'); continue; }
              }
              keys(s, ay * 0.6, false); step(); continue;
            }
            keys(s, ay, f % 96 !== 0); step(); continue;
          }
          if (st === 'wing' && toG < 20 && Math.abs(p.y - 34) < 14) {              // (after a trapped cross: finish it)
            charge += 1 / 60; keys(gx - p.x, 0, false, ['KeyX']);
            if (charge > 0.32) { Input.keys.delete('KeyX'); keys(gx - p.x, (t % 2 ? 1 : -1) * 0.3, false); shotAt = f; R.shots++; }
            step(); continue;
          }
          // wing: out wide, down the line, cross into the box
          const wy = 34 + wing * 26, lineX = gx - s * 14;
          if ((lineX - p.x) * s > 0) { const dy = Math.abs(p.y - wy) > 2 ? (wy - p.y) / 8 : 0; keys(s, dy, true); step(); continue; }
          const box = { x: gx - s * 9, y: 34 - wing * 1 };
          keys(box.x - p.x, box.y - p.y, false, ['KeyC']); step(); Input.keys.delete('KeyC'); keys(0, 0, false); step();
          crossed = true; crosser = p; R.crosses++;
        }
        Input.keys.clear(); Input.downs.clear();
        R[outc || 'time']++; R.secs += f / 60;
      }
      const n = TRIALS, pc = v => Math.round(100 * v / n) + '%';
      res[`${lv} ${st}`] = { goals: pc(R.goal), saved: pc(R.saved), offTarget: pc(R.miss), lost: pc(R.lost), penalty: pc(R.pen), fkNear: pc(R.fkNear), fkFar: pc(R.fkFar), other: pc(R.other), time: pc(R.time), shots: R.shots, crosses: R.crosses, trapped: R.trapped || 0, headers: R.headers, lostHow: R.lostHow, otherHow: R.otherHow, avgSecs: (R.secs / n).toFixed(1) };
    }
    Math.random = RND; DIFF_LEVEL = 'normal'; return res;
  }, [TRIALS, LEVELS, STRATS, process.env.PACE || '']);
  for (const k in out) console.log(k.padEnd(14), JSON.stringify(out[k])); console.log('errors', JSON.stringify(errs.slice(0, 4))); await br.close();
})();
