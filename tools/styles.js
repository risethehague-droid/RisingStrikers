// STYLES: the balance check for the team styles (smarter-ai stage 2, step 4). Every style card in brain.js STYLES plays
// every other one, both ways (home / away), in seeded computer v computer matches at the same level (both sides at base),
// with tools/soak.js doing the playing. The co-designer / Luca: no style may win clearly more often than another - every
// style's points share (win 1, draw 0.5) should sit within a few points of 50%. It runs JOBS soaks at once.
//
//   node tools/styles.js                      every pair both ways, 8 matches each way (5 styles: 160 matches)
//   N=16 node tools/styles.js                 more matches per pairing (a tighter answer)
//   ONLY=neutral,press node tools/styles.js   just those styles
//   TOL=8 (default): how many points off 50% still counts as balanced
//   PORT=8765 (default): serve the game first with  python3 -m http.server 8765 --directory game
const { spawn } = require('child_process'), fs = require('fs'), path = require('path'), os = require('os');
const E = process.env, N = +(E.N || 8), TOL = +(E.TOL || 8), JOBS = +(E.JOBS || 6);
const STY = (E.ONLY || 'neutral,possession,wide,press,counter').split(',');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hc2-styles-'));
const pairs = []; for (const a of STY) for (const b of STY) if (a !== b) pairs.push([a, b]);
const run = ([a, b], k) => new Promise(res => {
  const out = path.join(tmp, `${k}-${a}-${b}`);
  const c = spawn(process.execPath, [path.join(__dirname, 'soak.js')], { env: Object.assign({}, E, { STYLE: `${a},${b}`, LVL: 'normal', AI: 'new', MATCHES: String(N), FROM: String(k * 3), OUT: out }), stdio: 'ignore' });
  c.on('exit', () => { try { const f = fs.readdirSync(out).find(x => x.endsWith('.json')); res({ a, b, o: JSON.parse(fs.readFileSync(path.join(out, f))) }); } catch (e) { res({ a, b, o: null }); } });
});
(async () => {
  const R = []; let i = 0;
  await Promise.all(Array.from({ length: Math.min(JOBS, pairs.length) }, async () => { while (i < pairs.length) { const k = i++; R.push(await run(pairs[k], k)); process.stdout.write('.'); } }));
  const P = Object.fromEntries(STY.map(s => [s, { pts: 0, n: 0, gf: 0, ga: 0, w: 0, d: 0, l: 0 }])), errs = [];
  for (const { a, b, o } of R) { if (!o) { errs.push(`${a} v ${b}: no result`); continue; } errs.push(...o.errors.map(e => e.msg));
    for (const m of o.matches) { const [h, w] = m.score.split('-').map(Number);
      for (const [s, f, g] of [[a, h, w], [b, w, h]]) { const x = P[s]; x.n++; x.gf += f; x.ga += g; if (f > g) { x.w++; x.pts += 1; } else if (f === g) { x.d++; x.pts += 0.5; } else x.l++; } } }
  console.log(`\nSTYLES · ${pairs.length} pairings x ${N} matches · level: both sides at base\n`);
  console.log('| Style | Played | W / D / L | Goals | Points share |\n| --- | --- | --- | --- | --- |');
  let ok = true; for (const s of STY) { const x = P[s], sh = x.n ? 100 * x.pts / x.n : 0; if (Math.abs(sh - 50) > TOL) ok = false;
    console.log(`| ${s} | ${x.n} | ${x.w} / ${x.d} / ${x.l} | ${x.gf} - ${x.ga} | ${sh.toFixed(0)}%${Math.abs(sh - 50) > TOL ? ' (!)' : ''} |`); }
  console.log(`\n${ok ? 'BALANCED' : 'NOT BALANCED'}: every style within ${TOL} points of 50%${ok ? '' : ' - not yet'} · goals a match ${(Object.values(P).reduce((a, x) => a + x.gf, 0) / (R.length * N || 1)).toFixed(2)}`);
  console.log('errors', JSON.stringify(errs.slice(0, 4)));
  fs.rmSync(tmp, { recursive: true, force: true });
})();
