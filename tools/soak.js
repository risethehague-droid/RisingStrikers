// SOAK: computer v computer matches headless, one after another, across different set-ups, with BUG WATCH on.
// (Luca 23 Oct 22:36: "run simulations of the games in the background catching any bugs and improving".) It catches
// what one smoke run can't: rare stalls, stuck moves, broken numbers, page errors, and how often the odd things happen.
// Every match is seeded, so any finding replays exactly: the summary prints a repro line for each match.
//
//   node tools/soak.js                                   12 full matches (2 x 3 real minutes each, fast-forwarded)
//   MATCHES=30 node tools/soak.js                        more
//   FROM=12 MATCHES=12 node tools/soak.js                the next 12 set-ups (a second sample)
//   ONE='seed=8919 home=IS away=IRO lvl=hard ai=new weather=rain tod=night' node tools/soak.js    replay one match
//   OUT=soak-out node tools/soak.js                      also write soak-out/soak-<time>.json and .md
//   PORT=8765 (default): serve the game first with  python3 -m http.server 8765 --directory game
//   GOAL_PHYS=1 node tools/soak.js                       t-013: the goal physics forced ON in the matches (it's off in a match
//                                                        until Luca's OK); the summary adds woodwork hits, rebounds back in play, pop-ups
//
// The set-ups rotate with different strides, so pairs of factors (teams x level, level x weather, AI x light...)
// get covered in a few matches instead of every combination. Your side plays at base, theirs at the level.
const { chromium } = require('playwright');
const fs = require('fs');
const TEAMS = ['IS', 'IRO', 'USCS', 'LUC', 'THUAS', 'AUC'], LVLS = ['easy', 'normal', 'hard', 'rise'];
const WX = ['clear', 'rain', 'snow'], TOD = ['day', 'sunset', 'night'];
const setup = i => {
  const home = TEAMS[i % 6]; let away = TEAMS[(i * 5 + 1) % 6]; if (away === home) away = TEAMS[(i + 3) % 6];
  return { seed: 1000 + i * 7919, home, away, lvl: LVLS[i % 4], ai: i % 4 === 3 ? 'classic' : 'new', weather: WX[Math.floor(i / 2) % 3], tod: TOD[Math.floor(i / 3) % 3] };
};
const parseOne = s => Object.fromEntries(s.trim().split(/\s+/).map(kv => kv.split('=')).map(([k, v]) => [k, k === 'seed' ? +v : v]));
const line = c => `seed=${c.seed} home=${c.home} away=${c.away} lvl=${c.lvl} ai=${c.ai} weather=${c.weather} tod=${c.tod}`;

(async () => {
  const list = process.env.ONE ? [parseOne(process.env.ONE)] : Array.from({ length: +(process.env.MATCHES || 12) }, (_, i) => setup(i + +(process.env.FROM || 0)));   // (t-007: FROM=12 = the next 12 set-ups)
  const br = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await br.newPage({ viewport: { width: 640, height: 360 } }); const errs = []; let cur = -1;
  page.on('pageerror', e => errs.push({ match: cur, msg: e.message, stack: String(e.stack || '').split('\n').slice(1, 4).join(' | ') }));
  await page.goto(`http://localhost:${process.env.PORT || 8765}/test.html#flow`); await page.waitForFunction(() => window.__hc2 && window.__hc2.home, null, { timeout: 120000 });
  const ver = await page.evaluate(() => { const m = window.__hc2, g = m.game; g.loop.sleep(); window.__T = 1e6; window.HC2_NO_DEMO = true; window.HC2_SOAK = true;
    for (const id of ['start', 'flow']) { const e = document.getElementById(id); if (e) e.remove(); }
    m.cameras.main.setVisible(false); window.HC2_STARTED = true; window.__soakInc = [];
    window.__bwHook = x => window.__soakInc.push({ code: x.code, title: x.title, sev: x.sev, msg: String(x.msg).slice(0, 300), half: x.half, min: x.min, who: x.whoName, where: x.where, score: x.score });
    window.__rngOf = seed => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
    window.__RND = Math.random; return GAME_VER; });
  if (process.env.GOAL_PHYS) await page.evaluate(() => { GOAL_PHYS = true; });   // t-013
  const out = { game: ver, at: new Date().toISOString(), matches: [], errors: errs };
  for (let i = 0; i < list.length; i++) {
    const c = list[i]; cur = i; const t0 = Date.now();
    await page.evaluate(c => { window.__ready = false; window.__hc2.setTeams(c.home, c.away, () => { window.__ready = true; }); }, c);
    await page.waitForFunction(() => window.__ready, null, { timeout: 120000 });
    await page.evaluate(c => { const m = window.__hc2; window.__soakInc = []; Math.random = window.__rngOf(c.seed);
      m.gpStats = { wood: 0, back: 0, pops: 0, net: 0 }; setAiMode(c.ai); setDiff(c.lvl === 'base' ? 'normal' : c.lvl);
      window.__diffTeams = { home: Object.assign({}, DIFF_TRAITS.base, { lvl: 'base' }), away: Object.assign({}, DIFF_TRAITS[c.lvl] || DIFF_TRAITS.normal, { lvl: c.lvl }) };
      m.mset = { arena: 'loo', tod: c.tod, weather: c.weather, ending: 'none' }; m.applyRules();
      m.demo = true; m.kickoff(m.home); }, c);
    let res = null, lastClock = -1, still = 0, stall = null;
    for (let chunk = 0; chunk < 60 && !res; chunk++) {                  // 600 steps (10 game-seconds at 1x) a chunk, at most ~1.3 matches long
      const s = await page.evaluate(() => { const m = window.__hc2, g = m.game;
        for (let k = 0; k < 600 && !m.over; k++) { window.__T += 1000 / 60; g.step(window.__T, 1000 / 60); if (m.cutIn) m.cutInEnd(); if (m.replay) m.endReplay(); }
        return { over: m.over, clock: m.clock, half: m.half }; });
      if (s.clock === lastClock && !s.over) { if (++still >= 3) { stall = `the clock stood at ${Math.round(s.clock)} s (half ${s.half}) for 30 game-seconds`; break; } } else still = 0;
      lastClock = s.clock;
      if (s.over) res = s;
    }
    const st = await page.evaluate(() => { const m = window.__hc2, S = m.mstats || {}, H = S[m.home.name] || {}, A = S[m.away.name] || {}; Math.random = window.__RND;
      const poss = (H.poss || 0) + (A.poss || 0);
      const sum = k => (H[k] || 0) + (A[k] || 0);                       // t-007: the keeper numbers (both sides together)
      return { score: `${m.home.score}-${m.away.score}`, shots: `${H.shots || 0}-${A.shots || 0}`, goals: m.home.score + m.away.score,
        corners: sum('corners'), onT: sum('onT'), held: sum('held'), parried: sum('parried'), kOut: sum('kOut'), kIn: sum('kIn'), fouls: `${H.fouls || 0}-${A.fouls || 0}`,
        possHome: poss ? Math.round(100 * H.poss / poss) : null, clock: Math.round(m.clock), half: m.half, trips: Object.assign({}, m.bw ? m.bw.stats : {}), incidents: window.__soakInc.slice(), gp: GOAL_PHYS ? Object.assign({}, m.gpStats) : null }; });
    out.matches.push(Object.assign({ n: i + 1, setup: c, repro: line(c), finished: !!res, stall, seconds: Math.round((Date.now() - t0) / 1000) }, st));
    const tr = Object.entries(st.trips).map(([k, v]) => `${k} ${v}`).join(', ');
    console.log(`#${i + 1} ${c.home} v ${c.away} · ${c.lvl} · ${c.ai} AI · ${c.weather} / ${c.tod} · ${res ? 'FT' : 'NOT FINISHED'} ${st.score} · shots ${st.shots} · on target ${st.onT} · corners ${st.corners} · saves held ${st.held} / parried ${st.parried} · keeper touches out ${st.kOut} / in play ${st.kIn} · ${tr || 'no trips'}${st.gp ? ` · woodwork ${st.gp.wood} (back in play ${st.gp.back}) · pop-ups ${st.gp.pops} · net hits ${st.gp.net}` : ''}${stall ? ' · STALL: ' + stall : ''} (${out.matches[i].seconds} s)`);
  }
  await br.close();
  // summary: every Bug Watch code across all matches, bugs first
  const by = {};
  for (const mt of out.matches) {
    for (const [code, n] of Object.entries(mt.trips)) { const e = by[code] = by[code] || { code, trips: 0, matches: 0, sev: '', title: '', examples: [] }; e.trips += n; e.matches++; }
    for (const x of mt.incidents) { const e = by[x.code] = by[x.code] || { code: x.code, trips: 0, matches: 0, examples: [] }; e.sev = x.sev; e.title = x.title;
      if (e.examples.length < 3) e.examples.push(`#${mt.n} ${x.min}' ${x.msg} (repro: ${mt.repro})`); }
  }
  out.summary = Object.values(by).sort((a, b) => (a.sev === 'bug' ? 0 : 1) - (b.sev === 'bug' ? 0 : 1) || b.trips - a.trips);
  const fin = out.matches.filter(m => m.finished).length, stalls = out.matches.filter(m => m.stall);
  const tot = k => out.matches.reduce((a, m) => a + (m[k] || 0), 0), per = k => (tot(k) / (out.matches.length || 1)).toFixed(1);   // t-007: per-match keeper numbers
  const md = [`# Soak ${out.game} · ${out.matches.length} matches · ${out.at.slice(0, 16).replace('T', ' ')} UTC`, '',
    `- Finished: ${fin} of ${out.matches.length}${stalls.length ? ` · STALLS: ${stalls.map(m => `#${m.n}`).join(', ')}` : ''}`,
    `- Page errors: ${errs.length}${errs.length ? '' : ' (none)'}`,
    `- Per match: goals ${per('goals')} · shots on target ${per('onT')} · corners ${per('corners')} · saves held ${per('held')} · parried ${per('parried')} · keeper touches out ${per('kOut')} / in play ${per('kIn')} (totals ${tot('goals')} / ${tot('onT')} / ${tot('corners')} / ${tot('held')} / ${tot('parried')})`, ...errs.slice(0, 5).map(e => `  - #${e.match + 1}: ${e.msg} ${e.stack}`), '',
    '| Code | Kind | Trips | In matches | Example |', '| --- | --- | --- | --- | --- |',
    ...out.summary.map(e => `| ${e.code} | ${e.sev || '?'} | ${e.trips} | ${e.matches} | ${(e.examples[0] || '').replace(/\|/g, '/').slice(0, 160)} |`), '',
    '| # | Set-up | Result | Shots | On target | Corners | Held / parried | Possession (home) | Repro |', '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    ...out.matches.map(m => `| ${m.n} | ${m.setup.home} v ${m.setup.away}, ${m.setup.lvl}, ${m.setup.ai} AI, ${m.setup.weather}/${m.setup.tod} | ${m.finished ? m.score : 'not finished'} | ${m.shots} | ${m.onT} | ${m.corners} | ${m.held} / ${m.parried} | ${m.possHome}% | \`${m.repro}\` |`)].join('\n');
  console.log('\n' + md + '\n');
  if (process.env.OUT) { fs.mkdirSync(process.env.OUT, { recursive: true }); const f = `${process.env.OUT}/soak-${out.at.replace(/[:.]/g, '-').slice(0, 19)}`;
    fs.writeFileSync(f + '.json', JSON.stringify(out, null, 1)); fs.writeFileSync(f + '.md', md); console.log('wrote', f + '.json', f + '.md'); }
  console.log('errors', JSON.stringify(errs.slice(0, 4).map(e => e.msg)));
})();
