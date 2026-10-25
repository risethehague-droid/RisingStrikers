// t-025 frame time with the living net in a real match (Luca: "make the net stretch more ... drastically for special
// shots"; the brief asks for the numbers before / after). A computer-v-computer match on test.html, drawn (camera on),
// and every few seconds a shot is put into the right-hand goal - soft, power, LV1, LV2, LV3 in turn - so the net works
// hard. Each g.step (sim + drawing) is timed and sorted by what was on screen: live play, the ball in the net, the goal
// replay. Run it with NET_FX=0 for v0.12.0's net.
//
//   node tools/netperf.js                 the living net (WebGL mesh)
//   NET_FX=0 node tools/netperf.js        v0.12.0's net
//   CANVAS=1 node tools/netperf.js        the canvas renderer (phone SAFE MODE: t-013's cells)
//   LITE=1 node tools/netperf.js          touch screens' half-size art (#lite): the net images ripple whole
//   TOUCH=1 CANVAS=1 node tools/netperf.js  a phone in SAFE MODE (a touch screen): the net images ripple whole too
//   GOALS=10                              how many goals (default 10)
const { chromium } = require('playwright');
(async () => {
  const br = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await br.newPage({ viewport: { width: 1280, height: 720 }, hasTouch: !!process.env.TOUCH }); const errs = []; page.on('pageerror', e => errs.push(e.message));
  if (process.env.CANVAS) await page.addInitScript(() => { try { localStorage.setItem('hc2-safe', '1'); } catch (e) {} });   // (the page reads SAFE MODE from here)
  await page.goto(`http://localhost:${process.env.PORT || 8765}/test.html#flow${process.env.LITE ? '&lite' : ''}`);
  await page.waitForFunction(() => window.__hc2 && window.__hc2.home, null, { timeout: 120000 });
  const out = await page.evaluate(([fx, goals]) => {
    if (fx != null) NET_FX = fx !== '0';
    const m = window.__hc2, g = m.game; g.loop.sleep(); let T = 1e6; window.HC2_NO_DEMO = true;
    for (const id of ['start', 'flow']) { const e = document.getElementById(id); if (e) e.remove(); }
    m.demo = false; window.HC2_STARTED = true; m.human = m.home.players[9]; m.home.score = m.away.score = 0; m.kickoff(m.home); m.demo = true;
    const t = { live: [], net: [], replay: [] }, step = () => { const a = performance.now(); T += 1000 / 60; g.step(T, 1000 / 60); return performance.now() - a; };
    const kinds = [[16, 0], [31, 0], [30, 1], [30, 2], [33, 3]], res = [];
    for (let i = 0; i < 240; i++) step();                                        // (warm up)
    for (let k = 0; k < goals; k++) {
      for (let i = 0; i < 180; i++) t[m.replay ? 'replay' : 'live'].push(step());
      if (m.replay) m.endReplay(); if (m.cutIn) m.cutInEnd();
      const [v, lv] = kinds[k % kinds.length], b = m.ball, gk = (m.home.side > 0 ? m.away : m.home).players[0], sh = (m.home.side > 0 ? m.home : m.away).players[9];
      if (b.owner) b.owner = null; Object.assign(m, { pending: null, setPiece: null, dead: null, freeze: 0 });
      gk.x = PITCH_L - 1; gk.y = 39.5; gk.stun = 3;                              // (the keeper out of it: it's the net we time)
      Object.assign(b, { x: PITCH_L - 7, y: 33.6, z: 0.9, vx: v, vy: 0.5, vz: 1.2, special: lv, spTeam: sh.team, last: sh.team, lastP: sh, target: null, save: null, saveable: null, inNet: false });
      let n = 0, ripped = false, peak = 0;
      for (let i = 0; i < 60 * 14 && (m.ball.inNet || i < 60) ; i++) { const ms = step(); if (m.replay) t.replay.push(ms); else if (m.ball.inNet) { t.net.push(ms); n++; } else t.live.push(ms); if (m.cutIn) m.cutInEnd();
        const X = m.ball.nfx; if (X) { ripped = ripped || X.rip; peak = Math.max(peak, X.peak); } }
      res.push(`${lv ? 'LV' + lv : v > 20 ? 'power' : 'soft'}: ${n} frames in the net${peak ? `, ${Math.round(peak * 100)} cm` : ''}${ripped ? ', ripped' : ''}`);
      if (m.replay) m.endReplay();
    }
    const st = a => { const s = a.slice().sort((x, y) => x - y), q = p => s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))].toFixed(2) : '-'; return `n ${s.length} · median ${q(0.5)} · p95 ${q(0.95)} · max ${q(1)} ms`; };
    return { renderer: g.renderer.type === Phaser.WEBGL ? 'WebGL' : 'Canvas', lite: typeof LITE !== 'undefined' && LITE, touch: !!window.HC2_TOUCH, plainNet: netPlain(), netFx: nfxOn(), live: st(t.live), net: st(t.net), replay: st(t.replay), goals: `${m.home.score + m.away.score}`, shots: res };
  }, [process.env.NET_FX ?? null, +(process.env.GOALS || 10)]);
  console.log(JSON.stringify(out, null, 1)); console.log('errors', JSON.stringify(errs.slice(0, 4))); await br.close();
})();
