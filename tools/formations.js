// FORMATIONS: the balance round-robin for the teams' own formations (role-based AI, step 6 - docs/role-ai-plan.md 7).
// Every shape in roles.js SHAPES plays every other one, both ways (home / away), in seeded computer v computer matches at
// the same level (both sides at base), with tools/soak.js doing the playing (FORM=<home>,<away>). Before Luca and the
// co-designer give each team its own formation (roles.js TEAM_SHAPE), none of the shapes may win clearly more often:
// every shape's points share (win 1, draw 0.5) should sit within a few points of 50%. It also prints shots a match per
// shape (a shape that kills the game is as bad as one that wins it). Same set-up as tools/styles.js.
//
//   node tools/formations.js                        every pair both ways, 8 matches each way (3 shapes: 48 matches)
//   N=16 node tools/formations.js                   more matches per pairing (a tighter answer)
//   ONLY=4-4-2,4-3-3 node tools/formations.js       just those shapes
//   TOL=8 (default): how many points off 50% still counts as balanced · JOBS=6 soaks at once
//   PORT=8765 (default): serve the game first with  python3 -m http.server 8765 --directory game
const { spawn } = require('child_process'), fs = require('fs'), path = require('path'), os = require('os');
const E = process.env, N = +(E.N || 8), TOL = +(E.TOL || 8), JOBS = +(E.JOBS || 6);
const STY = (E.ONLY || '4-4-2,4-2-3-1,4-3-3').split(',');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hc2-forms-'));
const pairs = []; for (const a of STY) for (const b of STY) if (a !== b) pairs.push([a, b]);
const run = ([a, b], k) => new Promise(res => {
  const out = path.join(tmp, `${k}-${a}-${b}`);
  const c = spawn(process.execPath, [path.join(__dirname, 'soak.js')], { env: Object.assign({}, E, { FORM: `${a},${b}`, LVL: 'normal', AI: 'new', MATCHES: String(N), FROM: String(k * 3), OUT: out }), stdio: 'ignore' });
  c.on('exit', () => { try { const f = fs.readdirSync(out).find(x => x.endsWith('.json')); res({ a, b, o: JSON.parse(fs.readFileSync(path.join(out, f))) }); } catch (e) { res({ a, b, o: null }); } });
});
(async () => {
  const R = []; let i = 0;
  await Promise.all(Array.from({ length: Math.min(JOBS, pairs.length) }, async () => { while (i < pairs.length) { const k = i++; R.push(await run(pairs[k], k)); process.stdout.write('.'); } }));
  const P = Object.fromEntries(STY.map(s => [s, { pts: 0, n: 0, gf: 0, ga: 0, w: 0, d: 0, l: 0, sh: 0 }])), errs = [];
  for (const { a, b, o } of R) { if (!o) { errs.push(`${a} v ${b}: no result`); continue; } errs.push(...o.errors.map(e => e.msg));
    for (const m of o.matches) { const [h, w] = m.score.split('-').map(Number), [sh, sa] = String(m.shots || '0-0').split('-').map(Number);
      for (const [s, f, g, k] of [[a, h, w, sh], [b, w, h, sa]]) { const x = P[s]; x.n++; x.gf += f; x.ga += g; x.sh += k || 0; if (f > g) { x.w++; x.pts += 1; } else if (f === g) { x.d++; x.pts += 0.5; } else x.l++; } } }
  console.log(`\nFORMATIONS · ${pairs.length} pairings x ${N} matches · level: both sides at base\n`);
  console.log('| Formation | Played | W / D / L | Goals | Its shots a match | Points share |\n| --- | --- | --- | --- | --- | --- |');
  let ok = true; for (const s of STY) { const x = P[s], sh = x.n ? 100 * x.pts / x.n : 0; if (Math.abs(sh - 50) > TOL) ok = false;
    console.log(`| ${s} | ${x.n} | ${x.w} / ${x.d} / ${x.l} | ${x.gf} - ${x.ga} | ${(x.sh / (x.n || 1)).toFixed(1)} | ${sh.toFixed(0)}%${Math.abs(sh - 50) > TOL ? ' (!)' : ''} |`); }
  console.log(`\n${ok ? 'BALANCED' : 'NOT BALANCED'}: every formation within ${TOL} points of 50%${ok ? '' : ' - not yet'} · goals a match ${(Object.values(P).reduce((a, x) => a + x.gf, 0) / (R.length * N || 1)).toFixed(2)}`);
  console.log('errors', JSON.stringify(errs.slice(0, 4)));
  fs.rmSync(tmp, { recursive: true, force: true });
})();
