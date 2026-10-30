// t-043 TWO HUMANS (LAN step 2, part 1: docs/lan-step2.md "Two humans in one match"), headless, no network.
//   same: the refactor proof. Seeded matches with a scripted human on the home side (keys through the real Input, the
//         way proxy093.js drives it), at every level. Prints each match's score and a hash of where every player and
//         the ball were every half second, so a run on main and a run on the branch must print the same lines.
//         Uses only what main already has, so it runs on either build.
//   two:  both sides human: the home side scripted on the keys as above, the away side on a scripted input source
//         (io.js inputPad) handed to m.twoHumans(). Checks that the away human runs where his stick points, switches,
//         passes and shoots (moving along his stick: the computer isn't steering him), and that no page errors happen.
//   node tools/twohuman.js same|two      PORT=8765 · SEEDS=101,202 · LEVELS=easy,normal,hard,rise · STEPS=<frames>
const { chromium } = require('playwright');
const MODE = process.argv[2] || 'same', PORT = process.env.PORT || 8765;
const SEEDS = (process.env.SEEDS || (MODE === 'two' ? '101,202,303' : '101,202')).split(',').map(Number), LEVELS = (process.env.LEVELS || (MODE === 'two' ? 'normal' : 'easy,normal,hard,rise')).split(',');   // (two humans: no computer side, so both play base at any level)
const STEPS = +(process.env.STEPS || (MODE === 'two' ? 60 * 120 : 60 * 400));   // (same: a whole match, both halves and the break)
(async () => {
  const br = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await br.newPage({ viewport: { width: 640, height: 360 } }); const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(`http://localhost:${PORT}/test.html#flow`); await page.waitForFunction(() => window.__hc2 && window.__hc2.home, null, { timeout: 120000 });
  await page.evaluate(() => { const m = window.__hc2, g = m.game; g.loop.sleep(); window.__T = 1e6; window.HC2_NO_DEMO = true;
    for (const id of ['start', 'flow']) { const e = document.getElementById(id); if (e) e.remove(); }
    m.cameras.main.setVisible(false); m.ramiSay = () => {}; window.HC2_STARTED = true;
    window.__rngOf = seed => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
    // the scripted player: a pure function of the frame and the pitch, so both builds get the same "hands".
    // f = frame, me = his player, own = his side's goal direction. Returns the stick and the buttons this frame.
    window.__script = (m, f, me, team, ph) => { const b = m.ball, mine = b.owner === me, k = f + ph;
      const tx = mine ? team.goalX : b.x, ty = mine ? 34 + 10 * Math.sin(k / 90) : b.y, dx = tx - me.x, dy = ty - me.y, l = Math.hypot(dx, dy) || 1;
      const idle = k % 300 > 270;                                                 // (now and then the stick rests: passes run on by themselves)
      return { x: idle ? 0 : dx / l, y: idle ? 0 : dy / l, sprint: k % 240 < 90, pass: k % 113 === 0, through: k % 167 === 0, lob: k % 197 === 0,
        shoot: k % 149 < 25, special: k % 421 === 0, start: false }; };
    // the home side: through the real keyboard state, arrows + Z X C V B + right SHIFT (the set that stays home's in a split)
    window.__keys = s => { const I = Input; I.keys.clear();
      if (s.x > 0.38) I.keys.add('ArrowRight'); if (s.x < -0.38) I.keys.add('ArrowLeft'); if (s.y > 0.38) I.keys.add('ArrowDown'); if (s.y < -0.38) I.keys.add('ArrowUp');
      if (s.sprint) I.keys.add('ShiftRight'); if (s.shoot) I.keys.add('KeyX');
      if (s.pass) I.downs.add('KeyZ'); if (s.through) I.downs.add('KeyV'); if (s.lob) I.downs.add('KeyC'); if (s.special) I.downs.add('KeyB'); };
    window.__hash = (h, m) => { const v = [m.ball.x, m.ball.y, m.ball.z]; for (const p of m.all) v.push(p.x, p.y);
      const s = v.map(n => n.toFixed(5)).join(','); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h; };
  });
  const rows = [];
  for (const seed of SEEDS) for (const lvl of LEVELS) {
    await page.evaluate(() => { window.__ready = false; window.__hc2.setTeams('IS', 'IRO', () => { window.__ready = true; }); });
    await page.waitForFunction(() => window.__ready, null, { timeout: 120000 });
    const r = await page.evaluate(([seed, lvl, STEPS, MODE]) => { const m = window.__hc2, g = m.game;
      Math.random = window.__rngOf(seed); setDiff(lvl); m.demo = false; m.human = m.home.players[9];
      let pad = null;
      if (MODE === 'two') { pad = inputPad(); m.twoHumans(pad); }
      m.kickoff(m.home);
      const C = { moves: 0, along: 0, against: 0, aiSteered: 0, passes: 0, shots: 0, switches: 0, homePasses: 0, owned: 0 };
      if (MODE === 'two') {                                                       // count what the away human does, wrapped around the game's own moves
        const away = () => m.humanOf(m.away);
        const dp = m.doPass; m.doPass = function (p, ...a) { if (p === away()) C.passes++; else if (p === m.human) C.homePasses++; return dp.call(this, p, ...a); };
        const ds = m.doShot; m.doShot = function (p, ...a) { if (p === away()) C.shots++; return ds.call(this, p, ...a); };
        const sw = m.switchHuman; m.switchHuman = function (...a) { const was = away(), r = sw.apply(this, a); if (was !== away()) C.switches++; return r; };
      }
      let h = 2166136261, f = 0;
      for (; f < STEPS && !m.over; f++) {
        window.__keys(window.__script(m, f, m.human, m.home, 0));
        let s2 = null, a0 = null;
        if (pad) { const ah = m.humanOf(m.away); s2 = window.__script(m, f, ah, m.away, 57); pad.set(s2); a0 = { p: ah, x: ah.x, y: ah.y }; }
        window.__T += 1000 / 60; g.step(window.__T, 1000 / 60); if (m.cutIn) m.cutInEnd(); if (m.replay) m.endReplay();
        if (pad && a0 && a0.p === m.humanOf(m.away) && !m.setPiece && !(m.freeze > 0) && !m.aerial && !m.ht && !m.intro && !m.paused && a0.p.state !== 'kick' && !(a0.p.stun > 0)) {
          const dx = a0.p.x - a0.x, dy = a0.p.y - a0.y, l = Math.hypot(s2.x, s2.y);
          if (Math.hypot(dx, dy) > 0.02 && l > 0.5) { C.moves++; if ((dx * s2.x + dy * s2.y) / (Math.hypot(dx, dy) * l) > 0.3) C.along++; else C.against++; }
          if (m.ball.owner === a0.p) C.owned++;
        }
        if (f % 30 === 0) h = window.__hash(h, m);
      }
      return { score: `${m.home.score}-${m.away.score}`, hash: h.toString(16), frames: f, over: m.over, clock: Math.round(m.clock), C }; }, [seed, lvl, STEPS, MODE]);
    rows.push(Object.assign({ seed, lvl }, r));
    console.log(MODE === 'same' ? `seed ${seed} ${lvl.padEnd(6)} score ${r.score}  trace ${r.hash}  frames ${r.frames}${r.over ? ' FT' : ''}`
      : `seed ${seed} ${lvl.padEnd(6)} score ${r.score} · away human: moved ${r.C.moves} frames (${r.C.along} along the stick, ${r.C.against} not) · passes ${r.C.passes} · shots ${r.C.shots} · switches ${r.C.switches} · on the ball ${r.C.owned} frames · home passes ${r.C.homePasses}`);
  }
  if (MODE === 'two') { const ok = rows.every(r => r.C.moves > 200 && r.C.along > r.C.against * 4 && r.C.passes > 0 && r.C.shots > 0 && r.C.switches > 0);
    console.log(ok ? 'two humans: OK' : 'two humans: FAILED (see the counts above)'); }
  console.log('errors', JSON.stringify(errs.slice(0, 6))); await br.close();
})();
