// t-044 LAN MATCH (docs/lan-step2.md "Done means" 2): tools/lan/serve.py plus two headless pages on loopback that only
// press PLAY ON LAN, then HOST on one and JOIN on the other (no code handling in the test: the matchmaker swaps them),
// both READY, the host's ENTER through the settings / team sheet / walk-out, then a match in real time. Both sides'
// "hands" are scripted (the stick and buttons, as tools/twohuman.js scripts them) through each page's own keyboard state.
// Checks:
//   - the guest's scripted stick moves the away human on the host (he runs where the guest points)
//   - under fake 120 ms spikes (the host holds its snapshots, step 1's worst) the guest keeps drawing
//   - the score and clock agree on both pages (compared with the match paused: the guest draws 100 ms behind)
//   - the edges: the guest pauses -> both stop, the host's ENTER can't resume, the guest's can; the guest's PC goes away
//     -> CONNECTION LOST on the host, back to the menu after 10 s
//   - no page errors
//   node tools/lanmatch.js        SECS=60 (match time) · LANPORT=8771 · GIF=docs/previews/pr<N>-lan-match.gif (both pages side by side)
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process'), fs = require('fs'), path = require('path'), os = require('os');
const E = process.env, SECS = +(E.SECS || 60), LANPORT = +(E.LANPORT || 8771), GIF = E.GIF;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fail = []; const check = (ok, what) => { console.log((ok ? 'ok   ' : 'FAIL ') + what); if (!ok) fail.push(what); };

(async () => {
  const srv = spawn('python3', [path.join(__dirname, 'lan', 'serve.py'), '--no-browser', '--port', String(LANPORT)], { stdio: ['ignore', 'pipe', 'pipe'] });
  let srvOut = ''; srv.stdout.on('data', d => srvOut += d); srv.stderr.on('data', d => srvOut += d);
  await sleep(1200);
  const br = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-features=WebRtcHideLocalIpsWithMdns',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'] });
  const errs = { host: [], guest: [] }, pages = {};
  for (const who of ['host', 'guest']) {
    const ctx = await br.newContext({ viewport: { width: 960, height: 540 } }), p = pages[who] = await ctx.newPage();
    p.on('pageerror', e => errs[who].push(e.message));
    await p.addInitScript(() => { try { localStorage.setItem('hc2-mute', '1'); } catch (e) {} });
    await p.goto(`http://localhost:${LANPORT}/test.html#flow`);
    await p.waitForFunction(() => window.__hc2 && window.__hc2.home && document.getElementById('lanbtn'), null, { timeout: 120000 });
  }
  const H = pages.host, G = pages.guest;
  await G.click('#pick-home button:nth-child(3)');                               // (PC 2 picks his own team on his start screen: the 2nd team, IRO)
  // the two presses
  await H.click('#lanbtn'); await H.click('#lanhost');
  await G.click('#lanbtn'); await G.click('#lanjoin');
  await H.waitForSelector('#lanready', { timeout: 30000 }); await G.waitForSelector('#lanready', { timeout: 30000 });
  check(true, 'HOST + JOIN connected through serve.py: ' + (await G.textContent('#lanst')).replace(/\s+/g, ' '));
  await H.click('#lanready'); await G.click('#lanready');
  // the scripted hands (a pure function of the frame and the pitch, as tools/twohuman.js): written into Input.keys before each poll
  for (const [P, side] of [[H, 'home'], [G, 'away']]) await P.evaluate(side => {
    const m = () => window.__hc2; let f = 0; const poll = Input.poll.bind(Input);
    window.__drive = true;
    Input.poll = function () {
      const M = m(); f++;
      if (window.__drive && M && M.ball && (side === 'home' ? !M.pre && window.HC2_STARTED : M.lanGuest)) {
        const team = M[side], me = side === 'home' ? M.human : M.away.players.reduce((a, q) => (Math.hypot(q.x - M.ball.x, q.y - M.ball.y) < Math.hypot(a.x - M.ball.x, a.y - M.ball.y) && !q.keeper ? q : a), M.away.players[9]);
        const b = M.ball, k = f + (side === 'home' ? 0 : 57), mine = Math.hypot(b.x - me.x, b.y - me.y) < 1.2;
        const tx = mine ? team.goalX : b.x, ty = mine ? 34 + 10 * Math.sin(k / 90) : b.y, dx = tx - me.x, dy = ty - me.y, l = Math.hypot(dx, dy) || 1, idle = k % 300 > 270;
        const s = { x: idle ? 0 : dx / l, y: idle ? 0 : dy / l, sprint: k % 240 < 90, pass: k % 113 === 0, through: k % 167 === 0, lob: k % 197 === 0, shoot: k % 149 < 25 };
        for (const c of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'ShiftRight', 'KeyX']) Input.keys.delete(c);
        if (s.x > 0.38) Input.keys.add('ArrowRight'); if (s.x < -0.38) Input.keys.add('ArrowLeft'); if (s.y > 0.38) Input.keys.add('ArrowDown'); if (s.y < -0.38) Input.keys.add('ArrowUp');
        if (s.sprint) Input.keys.add('ShiftRight'); if (s.shoot) Input.keys.add('KeyX');
        if (s.pass) Input.downs.add('KeyZ'); if (s.through) Input.downs.add('KeyV'); if (s.lob) Input.downs.add('KeyC');
      }
      return poll();
    };
  }, side);
  // the host gets through the settings, the team sheet, the walk-out and the toss with ENTER (as a player would)
  for (let i = 0; i < 60; i++) {
    const st = await H.evaluate(() => { const m = window.__hc2; return { pre: !!(m.pre || m.setup || m.sheet), intro: !!m.intro, toss: !!m.toss, started: !!window.HC2_STARTED, clock: m.clock }; });
    if (st.started && !st.pre && !st.intro && !st.toss && st.clock > 0) break;   // (the clock running: kicked off)
    if (st.started && (st.pre || st.intro || st.toss)) await H.keyboard.press('Enter');
    await sleep(500);
  }
  await G.waitForFunction(() => window.__hc2.lanGuest && window.__hc2.lanBuf.length > 5, null, { timeout: 30000 });
  // the host counts how the away human moves against the guest's stick (as it arrives in the host's netPad)
  await H.evaluate(() => { const m = window.__hc2, C = window.__C = { moves: 0, along: 0, against: 0, frames: 0 }; let was = null;
    m.events.on('postupdate', () => { const O = m.hOther; if (!O || m.paused || m.setPiece || m.freeze > 0 || m.aerial || m.ht || m.intro) { was = null; return; }
      const p = O.human, ax = O.inp.axis, l = Math.hypot(ax.x, ax.y); C.frames++;
      if (was && was.p === p && l > 0.5 && p.state !== 'kick' && !(p.stun > 0)) { const dx = p.x - was.x, dy = p.y - was.y, d = Math.hypot(dx, dy);
        if (d > 0.02) { C.moves++; if ((dx * ax.x + dy * ax.y) / (d * l) > 0.3) C.along++; else C.against++; } }
      was = { p, x: p.x, y: p.y }; }); });
  await G.evaluate(() => { const m = window.__hc2, C = window.__G = { frames: 0, spikeFrames: 0, held: 0 }; const t = m.lanGuestTick.bind(m);
    m.lanGuestTick = dt => { C.frames++; if (window.__spikeOn) C.spikeFrames++; return t(dt); }; });
  // GIF frames: both screens side by side, 4 s from 6 s in
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hc2lan-')); let shots = 0;
  const t0 = Date.now(); let spiked = false;
  while (Date.now() - t0 < SECS * 1000) {
    const s = (Date.now() - t0) / 1000;
    if (GIF && s > 6 && shots < 40) { const n = String(shots++).padStart(3, '0');
      await Promise.all([H.screenshot({ path: path.join(dir, `h${n}.png`) }), G.screenshot({ path: path.join(dir, `g${n}.png`) })]); continue; }
    if (s > SECS * 0.5 && !spiked) { spiked = true;                    // five fake spikes, 2 s apart
      for (let i = 0; i < 5; i++) { await G.evaluate(() => { window.__spikeOn = true; }); await H.evaluate(() => LAN.spike(120)); await sleep(300); await G.evaluate(() => { window.__spikeOn = false; }); await sleep(1700); } }
    await sleep(500);
  }
  await H.evaluate(() => { window.__drive = false; }); await G.evaluate(() => { window.__drive = false; });
  const C = await H.evaluate(() => window.__C), GC = await G.evaluate(() => window.__G);
  console.log(`away human (the guest's stick, on the host): moved ${C.moves} frames, ${C.along} along the stick, ${C.against} not · host frames ${C.frames}`);
  console.log(`guest drew ${GC.frames} frames (${GC.spikeFrames} during the spikes)`);
  check(C.moves > 100 && C.along > C.against * 3, "the guest's scripted inputs move the away player");
  check(GC.spikeFrames > 10, 'the guest kept drawing through the 120 ms spikes');
  // the host pauses (its menu) -> the guest sees PAUSED BY THE HOST; then compare the two screens
  await H.keyboard.press('Enter'); await sleep(800);
  const hs = await H.evaluate(() => { const m = window.__hc2; return { score: m.scoreTxt.text, clock: m.clockTxt.text, paused: m.paused }; });
  const gs = await G.evaluate(() => { const m = window.__hc2; return { score: m.scoreTxt.text, clock: m.clockTxt.text, over: (document.getElementById('lanover') || {}).textContent || '' }; });
  console.log(`host  ${hs.score} · ${hs.clock}\nguest ${gs.score} · ${gs.clock} · "${gs.over}"`);
  check(hs.score === gs.score && hs.clock === gs.clock, 'score and clock agree on both pages');
  check(hs.paused && /PAUSED BY THE HOST/.test(gs.over), 'the host paused: both stop, the guest is told');
  await H.keyboard.press('Escape'); await sleep(600);                              // (ESC: resume from the host's menu)
  // the guest pauses: the host stops and its ENTER can't resume it; the guest's ENTER does
  await G.keyboard.press('Enter'); await sleep(600);
  const p1 = await H.evaluate(() => ({ paused: window.__hc2.paused, hold: window.__hc2.lanHold, msg: window.__hc2.sub.text }));
  await H.keyboard.press('Enter'); await sleep(400);
  const p2 = await H.evaluate(() => ({ paused: window.__hc2.paused, hold: window.__hc2.lanHold, menu: !!window.__hc2.pm }));
  await G.keyboard.press('Enter'); await sleep(600);
  const p3 = await H.evaluate(() => ({ paused: window.__hc2.paused, hold: window.__hc2.lanHold }));
  check(p1.paused && p1.hold === 'guest' && p2.paused && p2.hold === 'guest' && !p2.menu && !p3.paused, `the guest paused both (host: "${p1.msg}"), the host couldn't resume, the guest did`);
  // the guest's PC goes away
  await G.context().close(); const tl = Date.now();
  await H.waitForFunction(() => /CONNECTION LOST/.test((document.getElementById('lanover') || {}).textContent || ''), null, { timeout: 8000 }).catch(() => {});
  const lost = await H.evaluate(() => ({ over: (document.getElementById('lanover') || {}).textContent || '', paused: window.__hc2 && window.__hc2.paused }));
  check(/CONNECTION LOST/.test(lost.over) && lost.paused, `the guest left: CONNECTION LOST on the host after ${((Date.now() - tl) / 1000).toFixed(1)} s, the match stopped`);
  await H.waitForFunction(() => !!document.getElementById('start') && !window.HC2_STARTED, null, { timeout: 16000 }).catch(() => {});
  check(await H.evaluate(() => !!document.getElementById('start') && !window.HC2_STARTED), 'back to the menu 10 s later');
  check(!errs.host.length && !errs.guest.length, `no page errors (host ${JSON.stringify(errs.host.slice(0, 3))}, guest ${JSON.stringify(errs.guest.slice(0, 3))})`);
  if (GIF && shots) {
    const py = path.join(dir, 'gif.py');
    fs.writeFileSync(py, `import sys, glob, os
from PIL import Image
d, out = sys.argv[1], sys.argv[2]
hs = sorted(glob.glob(os.path.join(d, 'h*.png'))); frames = []
for h in hs:
    g = h.replace(os.sep + 'h', os.sep + 'g'); a, b = Image.open(h).convert('RGB'), Image.open(g).convert('RGB')
    w = 360; a = a.resize((w, a.height * w // a.width), Image.NEAREST); b = b.resize((w, b.height * w // b.width), Image.NEAREST)
    c = Image.new('RGB', (w * 2 + 6, a.height), (12, 10, 14)); c.paste(a, (0, 0)); c.paste(b, (w + 6, 0)); frames.append(c)
for cols in (64, 48, 32):
    q = [f.quantize(colors=cols, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE) for f in frames]
    q[0].save(out, save_all=True, append_images=q[1:], duration=150, loop=0, optimize=True)
    if os.path.getsize(out) < 1000000: break
print('gif', out, os.path.getsize(out), 'bytes,', len(frames), 'frames')
`);
    console.log(execFileSync('python3', ['-I', py, dir, GIF]).toString().trim());
  }
  await br.close(); srv.kill();
  console.log(fail.length ? `lan match: FAILED (${fail.length})` : 'lan match: OK');
  process.exit(fail.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
