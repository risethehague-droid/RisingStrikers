// INSTA FLAG + REPLAY PLAYER test (t-006, Luca 24 Oct 05:57: "a button where you can insta flag an issue in the game,
// auto clips last 5 seconds ... add a replay feature - where you can replay forward pause slow mo, make sure in replays
// ... generates the full animations of the shots effects and all"). Headless, on index.html, with a stub for the page's
// database and connector (a real claude.ai page has them; a local one doesn't):
//   1. play a few seconds, press F: play stops, the note box has the keys - typing "wasd" moves nobody
//   2. SEND: the clip keeps ~8 s of frames, the note and the match's settings, goes to the database (collection
//      bugwatch, kind 'flag'), "FLAGGED" shows, then play goes on. With no trigger id the fixer isn't called; with one
//      it is (fire_trigger on Claude Code Remote)
//   3. the clip in the replay player: pause holds the frame, 0.25x runs at a quarter speed, a step moves one frame,
//      exit goes back to Bug Watch (in the pause menu); the pause menu's REPLAY (LAST 10 S) exits to the pause menu
//   4. a special shot: the effect sprites drawn in its replay match the ones in live play
//   5. the HUD's FLAG button opens the box too; ESC cancels
// Serve the game first (CLAUDE.md "Testing"): python3 -m http.server 8765 --directory game, then node tools/flagtest.js
const { chromium } = require('playwright');
const URL = `http://localhost:${process.env.PORT || 8765}/index.html`;
(async () => {
  const br = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await br.newPage({ viewport: { width: 1280, height: 720 } }); const errs = [], fails = [], log = [];
  page.on('pageerror', e => errs.push(e.message));
  const ok = (c, what) => { log.push(`${c ? 'ok  ' : 'FAIL'} ${what}`); if (!c) fails.push(what); };
  // the stub database + connector, there before the game looks for them
  await page.addInitScript(() => {
    window.__db = {}; window.__mcp = [];
    const db = { collection: c => ({ doc: id => ({ set: async d => { (window.__db[c] = window.__db[c] || {})[id] = d; } }) }) };
    const mcp = { callTool: async (server, tool, args) => { window.__mcp.push({ server, tool, args }); return { ok: true }; } };
    window.claude = { use: async k => (k === 'db' ? db : k === 'mcp' ? mcp : null) };
  });
  // step the game by hand; auto replays (a goal) and cut scenes are skipped, the player's replays are not
  const step = (n, fn) => page.evaluate(([n, fn]) => { const m = window.__hc2, g = m.game; g.loop.sleep(); let T = window.__T || 1e6; const out = [];
    const f = fn ? new Function('m', fn) : null;
    for (let i = 0; i < n; i++) { T += 1000 / 60; g.step(T, 1000 / 60); if (m.cutIn) m.cutInEnd(); if (m.replay && !m.replay.ctl) m.endReplay(); if (f) out.push(f(m)); }
    window.__T = T; return out; }, [n, fn || '']);
  const key = async k => { await page.keyboard.press(k); await step(2); };

  try {
    await page.goto(URL); await page.waitForFunction(() => window.__hc2 && window.__hc2.home, null, { timeout: 120000 });
    await page.evaluate(() => { window.HC2_SKIP_INTRO = true; window.HC2_NO_DEMO = true; });
    await page.click('#play'); await page.waitForFunction(() => window.HC2_STARTED && window.__hc2.home.players.length, null, { timeout: 60000 });
    await step(9 * 60);                                                           // 9 s of play: more than a flag keeps

    // 1. F: play stops, the box has the keys
    const before = await page.evaluate(() => { const m = window.__hc2; return { clock: m.clock, pos: m.all.map(p => [p.x, p.y]), human: [m.human.x, m.human.y] }; });
    await page.keyboard.press('f'); await step(3);
    const open = await page.evaluate(() => ({ ui: !!window.__hc2.flagUI, focus: document.activeElement && document.activeElement.id, flow: document.getElementById('flow').dataset.kind,
      text: document.getElementById('flow').innerText }));
    ok(open.ui && open.flow === 'flag' && open.focus === 'flagnote', `F opens FLAG A PROBLEM with the note box focused (${open.flow}, focus ${open.focus})`);
    ok(/WIN \+ H/.test(open.text) && /FN FN/.test(open.text), 'the dictation line is there');
    await page.keyboard.type('wasd'); await step(40);
    await page.keyboard.down('d'); await step(20); await page.keyboard.up('d');
    const still = await page.evaluate(b => { const m = window.__hc2, moved = m.all.filter((p, i) => Math.hypot(p.x - b.pos[i][0], p.y - b.pos[i][1]) > 1e-6).length;
      return { moved, clock: m.clock - b.clock, keys: [...Input.keys], note: document.getElementById('flagnote').value }; }, before);
    ok(still.moved === 0 && still.clock === 0, `typing "wasd" (and holding D) moved nobody, the clock stood still (${still.moved} moved, +${still.clock.toFixed(2)} s)`);
    ok(still.note === 'wasdd' && !still.keys.some(k => /Key[WASD]/.test(k)), `the letters went into the box ("${still.note}"), not the game (keys: ${still.keys.join(',') || 'none'})`);

    // 2. SEND
    await page.evaluate(() => { document.getElementById('flagnote').value = ''; });
    await page.keyboard.type('keeper walked through the post'); await page.keyboard.press('Enter'); await step(2);
    const sent = await page.evaluate(() => document.getElementById('flow').innerText);
    ok(/FLAGGED/.test(sent) && /THANKS/.test(sent), 'SEND shows FLAGGED · THANKS');
    await step(80);
    const c0 = await page.evaluate(() => window.__hc2.clock); await step(60); const c1 = await page.evaluate(() => window.__hc2.clock);
    ok(await page.evaluate(() => !window.__hc2.flagUI && document.getElementById('flow').style.display === 'none') && c1 > c0, `the game goes on after a second (clock +${(c1 - c0).toFixed(1)} s)`);
    await page.waitForFunction(() => window.__db.bugwatch && Object.keys(window.__db.bugwatch).length, null, { timeout: 10000 });
    const clip = await page.evaluate(() => { const m = window.__hc2, x = m.bw.list.find(q => q.kind === 'flag'), d = window.__db.bugwatch[x.id], u = bwUnpack(d.clip);
      return { id: x.id, n: x.frames.length, secs: x.frames.reduce((a, f) => a + f.dt, 0), dbSecs: u.frames.reduce((a, f) => a + f.dt, 0), note: d.note, kind: d.kind, code: d.code,
        ctx: JSON.parse(d.ctx), home: d.home, away: d.away, score: d.score, half: d.half, min: d.min, game: d.game, line: d.line, saved: x.saved, woke: x.woke,
        clipKb: Math.round(d.clip.length / 1024), mcp: window.__mcp.length, inList: m.bwItems ? true : false }; });
    ok(clip.kind === 'flag' && clip.code === 'FLAG' && clip.note === 'keeper walked through the post', `the clip is a flag with the note ("${clip.note}")`);
    ok(Math.abs(clip.secs - 8) < 0.3 && clip.n >= 470, `it keeps the last 8 s (${clip.n} frames, ${clip.secs.toFixed(2)} s; ${clip.dbSecs.toFixed(2)} s in the database, ${clip.clipKb} KB)`);
    ok(clip.dbSecs > 6 && clip.saved === 'db', `stored in the database's bugwatch collection (${clip.saved})`);
    ok(clip.home && clip.away && /^\d+-\d+$/.test(clip.score) && clip.half >= 1 && clip.game && clip.ctx.diff && clip.ctx.ai && clip.ctx.pace && clip.ctx.cam && clip.ctx.clock,
      `match context: ${clip.line}`);
    ok(clip.mcp === 0 && clip.woke === 'no', 'no trigger id: the fixer is not called (the clip is still saved)');

    // ... with a trigger id, SEND wakes the fixer
    await page.evaluate(() => { window.__flagTrigger = 'trig_test'; });
    await page.keyboard.press('f'); await step(3); await page.keyboard.type('second flag'); await page.keyboard.press('Enter'); await step(90);
    await page.waitForFunction(() => window.__mcp.length > 0, null, { timeout: 10000 }).catch(() => {});
    const call = await page.evaluate(() => window.__mcp[0] || null);
    ok(call && call.server === 'Claude Code Remote' && call.tool === 'fire_trigger' && call.args.trigger_id === 'trig_test' && /^FLAG flag-.*: second flag/.test(call.args.text),
      `with a trigger id: fire_trigger is called (${call ? call.args.text.slice(0, 60) : 'no call'})`);
    await page.evaluate(() => { window.__flagTrigger = ''; });

    // 3. the clip in the player (pause menu > BUG WATCH > the flag > WATCH)
    await page.evaluate(() => { const m = window.__hc2; m.openPause(); m.bwOpen('pause'); });
    await step(2);
    const listed = await page.evaluate(() => [...document.querySelectorAll('#flow .menu button')].map(b => b.innerText).filter(t => /FLAG/.test(t)));
    ok(listed.length >= 2, `the flags are in the Bug Watch list, marked FLAG (${listed.length})`);
    await page.evaluate(() => { const m = window.__hc2, x = m.bw.list.find(q => q.kind === 'flag'); m.bwUI.page = 'one'; m.bwUI.sel = x; m.bwPlay(x); });
    await step(3);
    const P0 = await page.evaluate(() => { const r = window.__hc2.replay; return r && { ctl: !!r.ctl, flag: r.flag, n: r.frames.length, bar: getComputedStyle(document.getElementById('rpbar')).display }; });
    ok(P0 && P0.ctl && P0.flag && P0.bar === 'flex', `the flag clip opens in the replay player, bar showing (${JSON.stringify(P0)})`);
    await key('Space');                                                            // pause
    const p1 = await page.evaluate(() => { const r = window.__hc2.replay; return { play: r.ctl.play, i: r.i, t: r.t }; });
    await step(40); const p2 = await page.evaluate(() => { const r = window.__hc2.replay; return { i: r.i, t: r.t }; });
    ok(!p1.play && p1.i === p2.i && p1.t === p2.t, `pause holds the frame (frame ${p1.i} -> ${p2.i})`);
    await key('ArrowRight'); const p3 = await page.evaluate(() => window.__hc2.replay.i);
    await key('ArrowLeft'); await key('ArrowLeft'); const p4 = await page.evaluate(() => window.__hc2.replay.i);
    ok(p3 === p2.i + 1 && p4 === p3 - 2, `a step moves one frame (${p2.i} -> ${p3} -> ${p4})`);
    await key('ArrowDown'); await key('ArrowDown'); await key('Space');
    const q0 = await page.evaluate(() => { const r = window.__hc2.replay; return { t: r.t, sp: RP_SPEEDS[r.ctl.sp], play: r.ctl.play }; });
    await step(120); const q1 = await page.evaluate(() => window.__hc2.replay.t);
    const rate = (q1 - q0.t) / 2;
    ok(q0.sp === 0.25 && q0.play && Math.abs(rate - 0.25) < 0.01, `0.25x runs at a quarter speed (${rate.toFixed(3)} clip-s per real s)`);
    await page.evaluate(() => { const r = window.__hc2.replay; r.ctl.q.push({ seek: 0.5 }); }); await step(2);    // the bar: a click halfway
    const sk = await page.evaluate(() => { const r = window.__hc2.replay; return r.t / r.frames[r.frames.length - 1].t0; });
    ok(Math.abs(sk - 0.5) < 0.02, `a click on the bar jumps there (${(sk * 100).toFixed(0)}%)`);
    await key('Enter');
    const ex = await page.evaluate(() => { const m = window.__hc2; return { replay: !!m.replay, bw: !!m.bwUI, paused: m.paused, flow: document.getElementById('flow').dataset.kind, bar: getComputedStyle(document.getElementById('rpbar')).display }; });
    ok(!ex.replay && ex.bw && ex.paused && ex.flow === 'bw' && ex.bar === 'none', `exit goes back to Bug Watch in the pause menu (${JSON.stringify(ex)})`);
    await key('Escape'); await key('Escape');                                         // (the clip's page, then the list)
    ok(await page.evaluate(() => { const m = window.__hc2; return !m.bwUI && m.paused && !!m.pm && document.getElementById('flow').dataset.kind === 'pause'; }), 'ESC: back on the pause menu');
    await page.evaluate(() => window.__hc2.closePause()); await step(2);

    // 4. a special shot: its effects in the replay = in live play
    await page.evaluate(() => { const m = window.__hc2, p = m.human, b = m.ball;
      m.freeze = 0; m.setPiece = null; m.pending = null; m.dead = null;
      p.x = m.home.goalX - m.home.side * 22; p.y = 34; p.setState('idle', 0); b.owner = p; b.x = p.x + 0.4; b.y = p.y; b.z = 0; b.vx = b.vy = b.vz = 0; m.meters[0].e = 3;
      window.__sp = m.special(p); });
    const live = await step(150, 'return m.recFx() ? m.recFx().length : 0');
    const liveSum = live.reduce((a, v) => a + v, 0), liveMax = Math.max(...live);
    ok(await page.evaluate(() => window.__sp) && liveMax > 0, `a LV3 special goes off (up to ${liveMax} effect sprites at once live)`);
    await page.evaluate(() => { const m = window.__hc2; m.openPause(); m.pauseItems().find(i => i.k === 'rec').act(); });
    const R0 = await page.evaluate(() => { const r = window.__hc2.replay; return r && { label: r.label, n: r.frames.length, ctl: !!r.ctl, flow: document.getElementById('flow').style.display }; });
    ok(R0 && R0.label === 'REPLAY' && R0.ctl && R0.n >= 590, `pause menu > REPLAY (LAST 10 S) opens the player (${R0 && R0.n} frames)`);
    const shown = await step(R0.n + 30, 'const r = m.replay; return r ? [r.i, m.children.list.filter(o => o.__rp && o.type === "Image" && o.visible).length] : [-1, 0]');
    const byFrame = {}; for (const [i, c] of shown) if (i >= R0.n - live.length) byFrame[i] = c;   // the frames of the special (the last 150 of the 600)
    const rv = Object.values(byFrame), rSum = rv.reduce((a, v) => a + v, 0), rMax = Math.max(...rv);
    ok(rMax === liveMax && rSum === liveSum && rv.length === live.length, `the replay draws the same effects (live: ${liveSum} sprite-frames, max ${liveMax} · replay: ${rSum}, max ${rMax})`);
    const end = await page.evaluate(() => { const r = window.__hc2.replay; return r && { end: r.ctl.end, i: r.i, n: r.frames.length }; });
    ok(end && end.end && end.i === end.n - 1, 'at the end it waits on the last frame');
    await key('KeyX');                                                              // SHOOT = exit
    ok(await page.evaluate(() => { const m = window.__hc2; return !m.replay && m.paused && document.getElementById('flow').dataset.kind === 'pause' && document.getElementById('flow').style.display !== 'none'; }),
      'exit (SHOOT) returns to the pause menu');
    await page.evaluate(() => window.__hc2.closePause()); await step(30);

    // 5. the HUD's FLAG button
    const at = await page.evaluate(() => { const m = window.__hc2, b = m.flagBtn.getBounds(), c = m.game.canvas.getBoundingClientRect(), k = c.width / VIEW_W;
      return { x: c.left + (b.x + b.width / 2) * k, y: c.top + (b.y + b.height / 2) * k, vis: m.flagBtn.visible }; });
    await page.mouse.click(at.x, at.y); await step(3);
    ok(at.vis && await page.evaluate(() => !!window.__hc2.flagUI), `the HUD FLAG button opens it (visible ${at.vis})`);
    await page.keyboard.press('Escape'); await step(3);
    const n0 = await page.evaluate(() => window.__hc2.bw.list.filter(q => q.kind === 'flag').length);
    ok(await page.evaluate(() => !window.__hc2.flagUI && !window.__hc2.paused) && n0 === 2, `ESC cancels (nothing saved: ${n0} flags) and play goes on`);
  } catch (e) { fails.push('crashed: ' + e.message); log.push('CRASH ' + e.stack); }
  await br.close();
  console.log(log.join('\n'));
  console.log(`${fails.length ? 'FAILED: ' + fails.length : 'ALL OK'} · errors ${JSON.stringify(errs)}`);
  process.exit(fails.length || errs.length ? 1 : 0);
})();
