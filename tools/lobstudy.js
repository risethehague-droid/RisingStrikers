// friend/lob-mechanics: what happens to a lofted ball? (headless, the real game)
//   ai  : computer v computer for MIN minutes; every open-play lob (not keepers, not set pieces) is followed until
//         someone has it, it goes out, or 6 s pass
//   you : a scripted "you" taps LOB to a forward from midfield, TRIALS times (the other side plays normally)
// For each lob: who got it (the man it was meant for / a team-mate / them / out), how (feet, chest, header, volley,
// knocked loose), and at the moment it drops below 1 m: how far the receiver and the nearest opponent are from it.
//   node tools/lobstudy.js ai [MIN]      node tools/lobstudy.js you [TRIALS]
// t-005: PORT=8781 picks the server (or BASE=http://...), SETUP='js' runs in the page first (e.g. SETUP='LOB_H = 0.9'),
// SEED=99 the dice (one seed is noisy: any change to a flight reshuffles every later dice roll - compare a few seeds)
const { chromium } = require('playwright');
const MODE = process.argv[2] || 'ai', N = +(process.argv[3] || (MODE === 'ai' ? 60 : 60)), BASE = process.env.BASE || `http://localhost:${process.env.PORT || 8765}/`;
(async () => {
  const br = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await br.newPage({ viewport: { width: 640, height: 360 } }); const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(BASE + 'test.html#flow'); await page.waitForFunction(() => window.__hc2 && window.__hc2.home, null, { timeout: 120000 });
  if (process.env.SETUP) await page.evaluate(process.env.SETUP);
  const out = await page.evaluate(([MODE, N, SEED]) => {
    const m = window.__hc2, g = m.game; g.loop.sleep(); window.HC2_NO_DEMO = true; let T = 1e6;
    for (const id of ['start', 'flow']) { const e = document.getElementById(id); if (e) e.remove(); }
    m.cameras.main.setVisible(false); m.render = function () {}; if (m.bw) { m.bw.tick = () => {}; m.bw.frame = () => {}; }
    m.startReplay = function (l, after) { if (after) after(); }; m.ramiSay = () => {};
    let seed = SEED; Math.random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    const step = () => { T += 1000 / 60; g.step(T, 1000 / 60); if (m.cutIn) m.cutInEnd(); if (m.replay) m.endReplay(); };
    let L = null; const log = [];
    const close = (res, by) => { if (!L) return; L.res = res; L.by = by; L.t = +(m.time.now / 1000 - L.t0).toFixed(2); log.push(L); L = null; };
    const rk = m.releaseKick.bind(m);
    m.releaseKick = function (k) {
      const lob = k.info.mode === 'lob' && !k.info.chip && !k.p.hands && !this.setPiece && !(k.p.keeper);
      rk(k); if (!lob || this.ball.owner) return;
      if (L) close('replaced', '');
      const b = this.ball; L = { team: k.p.team, tgt: k.info.target || null, d: +Math.hypot(k.tx - k.p.x, k.ty - k.p.y).toFixed(1), pow: k.info.lobPow != null,
        you: k.p === this.human && !this.demo, t0: this.time.now / 1000, how: 'feet', drop: null, contact: [], landErr: null, tx: k.tx, ty: k.ty };
    };
    const who = p => !L ? '' : p === L.tgt ? 'target' : p.team === L.team ? 'mate' : 'them';
    const hd = m.header.bind(m); m.header = function (p, kind) { if (L) L.contact.push('header-' + who(p)); return hd(p, kind); };
    const dh = m.divingHeader.bind(m); m.divingHeader = function (p) { if (L) L.contact.push('dheader-' + who(p)); return dh(p); };
    const ds = m.doShot.bind(m); m.doShot = function (p, ...a) { if (L && !L.contact.length) L.contact.push('volley-' + who(p)); return ds(p, ...a); };
    const gn = m.gain.bind(m); m.gain = function (p, inc) { if (L) { if (this.ball.z > 0.9) L.how = 'chest'; if (L.contact.length) L.how = L.contact[0].split('-')[0]; close(p.team === L.team ? (p === L.tgt ? 'target' : 'mate') : 'them', p.keeper ? 'keeper' : ''); } return gn(p, inc); };
    const watch = () => {
      if (!L) return; const b = m.ball;
      if (!L.drop && !L.contact.length && b.z < 2.0 && b.vz < 0 && m.time.now / 1000 - L.t0 > 0.2) {   // (first descent to head height, before anyone touched it)
        const opp = (L.team === m.home ? m.away : m.home).players.filter(p => !p.sentOff).map(p => Math.hypot(p.x - b.x, p.y - b.y));
        const mates = L.team.players.filter(p => !p.sentOff && !p.keeper).map(p => Math.hypot(p.x - b.x, p.y - b.y));
        L.drop = { rcv: L.tgt ? +Math.hypot(L.tgt.x - b.x, L.tgt.y - b.y).toFixed(1) : null, mate: +Math.min(...mates).toFixed(1), opp: +Math.min(...opp).toFixed(1) };
        L.landErr = +Math.hypot(b.x - L.tx, b.y - L.ty).toFixed(1);
      }
      if (L.contact.length && b.last !== L.team && !L.lostAir) L.lostAir = true;
      if (m.setPiece || m.dead) close('out', m.setPiece ? m.setPiece.kind : 'dead');
      else if (m.time.now / 1000 - L.t0 > 6) close('loose', '');
    };
    if (MODE === 'ai') {
      m.demo = true; window.HC2_STARTED = true; m.home.score = m.away.score = 0; m.kickoff(m.home);
      for (let i = 0; i < 60 * 60 * N; i++) { step(); watch(); if (m.over) { m.over = false; m.kickoff(m.home); } }
    } else {
      m.demo = false; window.HC2_STARTED = true;
      for (let t = 0; t < N; t++) {
        m.home.score = m.away.score = 0; m.kickoff(m.home); m.setPiece = null; m.pending = null; m.dead = null; m.freeze = 0;
        for (let i = 0; i < 30; i++) step();
        const s = m.home.side, h = m.home.players[6 + t % 3], fw = m.home.players[9 + t % 2];
        h.x = 52.5 + s * (2 + (t % 5) * 3); h.y = 18 + (t * 7) % 32; fw.x = h.x + s * (16 + (t % 4) * 6); fw.y = clamp(h.y + ((t % 3) - 1) * 12, 6, 62);
        m.human = h; m.ball.owner = null; m.gain(h, 0); m.ball.x = h.x + s * 0.5; m.ball.y = h.y; L = null;
        for (let i = 0; i < 20; i++) step();
        if (m.ball.owner !== h) continue;
        const dx = fw.x - h.x, dy = fw.y - h.y, l = Math.hypot(dx, dy); Input.keys.clear();
        if (dx / l > 0.38) Input.keys.add('KeyD'); if (dx / l < -0.38) Input.keys.add('KeyA'); if (dy / l > 0.38) Input.keys.add('KeyS'); if (dy / l < -0.38) Input.keys.add('KeyW');
        Input.downs.add('KeyC'); Input.keys.add('KeyC'); step(); Input.keys.delete('KeyC'); step(); Input.keys.clear();
        for (let i = 0; i < 60 * 7 && L === null; i++) step();
        for (let i = 0; i < 60 * 7 && L; i++) { step(); watch(); }
        if (L) close('loose', '');
      }
    }
    const R = {}, add = (k, v = 1) => R[k] = (R[k] || 0) + v;
    for (const x of log) { add('n'); add('res:' + x.res + (x.by ? '/' + x.by : '')); add('how:' + x.how); x.contact.forEach(c => add('touch:' + c));
      if (x.drop) { add('dropN'); add('rcvSum', x.drop.rcv ?? 0); add('rcvN', x.drop.rcv != null ? 1 : 0); add('oppSum', x.drop.opp); if (x.drop.opp < 1.5) add('opp<1.5m'); if (x.drop.rcv != null && x.drop.rcv > 3) add('rcv>3m'); add('landErrSum', x.landErr); } }
    const kept = (R['res:target'] || 0) + (R['res:mate'] || 0);
    return { R, kept: R.n ? Math.round(kept / R.n * 100) + '%' : '-', avgRcv: R.rcvN ? (R.rcvSum / R.rcvN).toFixed(1) : '-', avgOpp: R.dropN ? (R.oppSum / R.dropN).toFixed(1) : '-',
      avgLandErr: R.dropN ? (R.landErrSum / R.dropN).toFixed(1) : '-', sample: log.slice(0, 20).map(x => `${x.you ? 'YOU' : x.team.name} d${x.d} -> ${x.res}${x.by ? '/' + x.by : ''} ${x.how} [${x.contact.join(',')}] drop:${JSON.stringify(x.drop)} ${x.t}s`) };
  }, [MODE, N, +(process.env.SEED || 99)]);
  console.log(JSON.stringify(out, null, 1)); console.log('errors', JSON.stringify(errs.slice(0, 4))); await br.close();
})();
