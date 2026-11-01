// PREVIEW GIF for a pull request (CLAUDE.md "Pull requests": every PR has a ## Preview section with a GIF of the
// change in action). Asked for by the co-designer and Luca on 24 Oct so every Needs OK card on HC2 HQ shows the change
// playing. It records the real game headless, stepping time by hand (like tools/chipgif.js), then makes a GIF with
// Pillow: about 480 px wide (nearest-neighbour), 64 shared colours, no dithering, under 1 MB (it shrinks itself
// until it fits: fewer colours, then narrower, then every 2nd frame). Every pitch tile is loaded before the first
// frame, so there are no black gaps.
//
//   TEST=CH1 OUT=docs/previews/pr3-chip.gif node tools/preview.js       a Test Lab test (bash tools/mklab.sh first)
//   MATCH=1 SKIP=30 OUT=docs/previews/pr3-x.gif node tools/preview.js   a computer v computer match, from 30 s in
//   TEST=NT1,NT2,NT3 OUT=... node tools/preview.js                       several Lab tests in a row in one GIF (t-023:
//                                                                         SKIP / SECS / SETUP apply to each, in turn)
//
// Options: SECS=4 (length), SKIP=0 (seconds to skip before recording), FPS=12, WIDTH=480, ZOOM=1.6 (Lab camera),
//   SEED=7 (the match's dice), VS=IS,IRO (the match's teams), SETUP='js run in the page just before recording'
//   (window.__hc2 is the match, window.__lab the Lab), KEEP=1 keeps the PNG frames next to the GIF, PORT=8765,
//   NOCUT=1 skips cut-ins and replays (a moment from tools/aistudy.js replays at the same SKIP),
//   MOVE=curler OUT=docs/moves/curler.gif node tools/preview.js        a FREE PLAY move (its button in FP_MOVES, game/lab.js):
//     Luca, 30 Oct: "keep the hq updated with all new animations you add, as short previews (shots, passes, mash etc)".
//     MOVEKEY=KeyC presses that key once recording starts (a set piece: after SKIP lets the setup run, you take it).
//   MARK=away,10 rings that man (MARK=ball,0: the man on the ball) on every frame of the GIF (drawn on the GIF only, not in the game).
// Serve the game first: python3 -m http.server 8765 --directory game
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), os = require('os'), { execFileSync } = require('child_process');
const E = process.env, OUT = E.OUT, SECS = +(E.SECS || 4), SKIP = +(E.SKIP || 0), FPS = +(E.FPS || 12), WIDTH = +(E.WIDTH || 480);
if (!OUT || !(E.TEST || E.MATCH || E.MOVE)) { console.error('usage: TEST=<Lab test id>, MOVE=<FREE PLAY move> or MATCH=1, plus OUT=docs/previews/pr<N>-<topic>.gif'); process.exit(2); }
const PORT = E.PORT || 8765, STEP = Math.max(1, Math.round(60 / FPS));

(async () => {
  const br = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await br.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  // the pitch tiles normally stream in as the camera moves; stepping time by hand outruns that and leaves black gaps.
  // So every tile is loaded first, before the test or the kick-off (Phaser's loader only finishes while the game ticks).
  const preload = async () => {
    await page.evaluate(() => { const m = window.__hc2, st = m.stadium;
      for (const t of st.tiles) for (const k of t.uniq) if (!m.textures.exists(k)) st.queue.add(k); st.pump(); });
    for (let i = 0; i < 3000; i++) {
      const done = await page.evaluate(() => { const m = window.__hc2, st = m.stadium; window.__T += 1000 / 60; m.game.step(window.__T, 1000 / 60); return !st.loading && !st.queue.size; });
      if (done) return; await new Promise(r => setTimeout(r, 20));
    }
    console.error('the pitch tiles did not finish loading; the GIF may have black gaps');
  };
  const startTest = async id => {
    const ok = await page.evaluate(([id, zoom]) => { const L = window.__lab;
      const gi = L.groups.findIndex(x => x.tests.some(t => t.id.toLowerCase() === id.toLowerCase())); if (gi < 0) return false;
      L.boxes = false; L.zoom = zoom; L.g = gi; L.i = L.groups[gi].tests.findIndex(t => t.id.toLowerCase() === id.toLowerCase()); L.api.start(false); L.run.marks = []; return true; },
      [id, +(E.ZOOM || 1.6)]);
    if (!ok) { console.error(`no Test Lab test called ${id}`); await br.close(); process.exit(1); }
  };
  // a FREE PLAY move: the Lab's FREE PLAY page, a clean start, then the move's own set-up and script (as its button)
  const startMove = async mv => {
    const ok = await page.evaluate(([mv, zoom]) => { const L = window.__lab; if (!L.api.FP_MOVES.some(x => x.mv === mv)) return false;
      L.boxes = false; L.zoom = zoom; L.api.goFree(); L.api.fpMove(mv); if (L.run) L.run.marks = []; return true; }, [mv, +(E.ZOOM || 1.6)]);
    if (!ok) { console.error(`no FREE PLAY move called ${mv}`); await br.close(); process.exit(1); }
  };
  const TESTS = E.TEST ? E.TEST.split(',').map(t => t.trim()).filter(Boolean) : E.MOVE ? E.MOVE.split(',').map(t => t.trim()).filter(Boolean) : [null];
  if (E.TEST || E.MOVE) {
    await page.goto(`http://localhost:${PORT}/labtest.html`);
    await page.waitForFunction(() => window.__lab && window.__lab.active, null, { timeout: 120000 });
    await page.evaluate(() => { window.__hc2.game.loop.sleep(); window.__T = 5e6; }); await preload();
  } else {
    await page.goto(`http://localhost:${PORT}/test.html#flow`);
    await page.waitForFunction(() => window.__hc2 && window.__hc2.home, null, { timeout: 120000 });
    await page.evaluate(() => { const m = window.__hc2; m.game.loop.sleep(); window.__T = 1e6; window.HC2_NO_DEMO = true; window.HC2_STARTED = true;
      for (const id of ['start', 'flow']) { const e = document.getElementById(id); if (e) e.remove(); } });
    await page.evaluate(([h, a]) => { window.__ready = false; window.__hc2.setTeams(h, a, () => { window.__ready = true; }); }, (E.VS || 'IS,IRO').split(','));
    await page.waitForFunction(() => window.__ready, null, { timeout: 120000 });
    await preload();
    await page.evaluate(seed => { const m = window.__hc2; let s = seed >>> 0;      // seeded dice, so the same command gives the same clip
      Math.random = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
      m.demo = true; m.kickoff(m.home); }, +(E.SEED || 7));
  }
  // step the game by hand: n frames of 1/60 s (the Lab's debug marks are cleared so they never show)
  // NOCUT=1 (smarter-AI study, 27 Oct): cut-ins and replays are skipped the moment they start, as tools/aistudy.js and
  // tools/soak.js play a match, so a moment they found at SKIP=<t> replays here at the same second
  const step = n => page.evaluate(([n, nocut]) => { const m = window.__hc2, g = m.game; for (let k = 0; k < n; k++) { window.__T += 1000 / 60; g.step(window.__T, 1000 / 60);
    if (nocut) { if (m.cutIn) m.cutInEnd(); if (m.replay) m.endReplay(); }
    if (window.__lab && window.__lab.run) window.__lab.run.marks = []; } }, [n, !!E.NOCUT]);
  const dir = E.KEEP ? OUT.replace(/\.gif$/, '') + '-frames' : fs.mkdtempSync(path.join(os.tmpdir(), 'hc2prev-'));
  fs.mkdirSync(dir, { recursive: true });
  const n = Math.max(2, Math.round(SECS * FPS)); let fno = 0; const marks = {};
  for (const id of TESTS) {                                                     // (one test, a match, or several tests in a row)
    if (id) await (E.MOVE ? startMove(id) : startTest(id));
    if (SKIP > 0) await step(Math.round(SKIP * 60));
    if (E.SETUP) await page.evaluate(E.SETUP);
    if (E.MOVEKEY) await page.keyboard.press(E.MOVEKEY);
    await step(1);
    const box = await page.evaluate(() => { const r = document.querySelector('#game canvas').getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; });
    for (let f = 0; f < n; f++) {
      if (E.MARK) marks[fno] = await page.evaluate(([side, i, w, h]) => {          // MARK=away,10: where that man is on screen
        const m = window.__hc2, p = side === 'ball' ? (m.ball.owner || m.ball) : m[side].players[+i], cam = m.cameras.main, v = cam.worldView, gw = m.scale.width, gh = m.scale.height;
        return p ? { x: (wx(p.x, p.y) - v.x) * cam.zoom * w / gw, y: (wy(p.y) - v.y) * cam.zoom * h / gh } : null; }, [...E.MARK.split(','), box.width, box.height]);
      await page.screenshot({ path: path.join(dir, `${String(fno++).padStart(4, '0')}.png`), clip: box, timeout: 120000 });
      await step(STEP);
    }
  }
  await br.close();
  fs.mkdirSync(path.dirname(path.resolve(OUT)), { recursive: true });
  // Pillow: one palette shared by every frame (no flicker, smaller), no dithering; if it's over 1 MB, fewer colours,
  // then narrower, then every 2nd frame, until it fits.
  const py = `
import sys, glob, os
from PIL import Image
src, out, width, fps = sys.argv[1], sys.argv[2], int(sys.argv[3]), float(sys.argv[4])
frames = [Image.open(p).convert('RGB') for p in sorted(glob.glob(os.path.join(src, '*.png')))]
import json
from PIL import ImageDraw
mk = json.load(open(sys.argv[5])) if len(sys.argv) > 5 else {}
for i, f in enumerate(frames):   # MARK: a yellow ring round the man the clip is about (on the GIF only, never in the game)
    m = mk.get(str(i))
    if m: d = ImageDraw.Draw(f); r = f.width / 40; d.ellipse((m['x'] - r * 1.6, m['y'] - r * 0.6, m['x'] + r * 1.6, m['y'] + r * 0.6), outline=(255, 222, 30), width=max(2, int(r / 4)))
def make(colors, keep, w):
    fr = frames[::keep]; h = round(fr[0].height * w / fr[0].width)
    fr = [f.resize((w, h), Image.NEAREST) for f in fr]   # nearest keeps the pixel art crisp and halves the size (flat runs)
    sheet = Image.new('RGB', (w, h * min(len(fr), 8)))
    for i, f in enumerate(fr[::max(1, len(fr) // 8)][:8]): sheet.paste(f, (0, i * h))
    pal = sheet.quantize(colors=colors, method=Image.Quantize.MEDIANCUT)
    q = [f.quantize(palette=pal, dither=Image.Dither.NONE) for f in fr]
    q[0].save(out, save_all=True, append_images=q[1:], duration=round(1000 * keep / fps), loop=0, optimize=True, disposal=1)
    return os.path.getsize(out), len(q), w, h
tries = [(64, 1, 1), (48, 1, 1), (64, 1, .85), (48, 1, .85), (32, 1, .85), (48, 2, 1), (32, 2, .8), (24, 2, .7)]   # colours, every n-th frame, width
for colors, keep, wf in tries:
    w = int(width * wf)
    size, n, w2, h = make(colors, keep, w)
    if size <= 1000000: break
print(f'{out}: {n} frames, {w2}x{h}, {colors} colours, {size / 1024:.0f} KB' + ('' if size <= 1000000 else ' - STILL OVER 1 MB: use a shorter SECS'))
`;
  const pyFile = path.join(os.tmpdir(), `hc2prev-${process.pid}.py`); fs.writeFileSync(pyFile, py);
  const markFile = path.join(dir, 'marks.json'); fs.writeFileSync(markFile, JSON.stringify(marks));
  try { process.stdout.write(execFileSync('python3', ['-I', pyFile, dir, OUT, String(WIDTH), String(FPS), markFile]).toString()); }
  finally { fs.unlinkSync(pyFile); if (!E.KEEP) fs.rmSync(dir, { recursive: true, force: true }); }
  console.log('errors', JSON.stringify(errs.slice(0, 5)));
})();
