'use strict';
// HC2 Football · cup.js: the cup (tournament) mode: table, fixtures, simulated games, trophy ceremony
// (split out of game.js in v0.9.5 - load order and lanes: src/README.md)

// ---------------------------------------------------------------- Match methods: cup
hc2Mix(Match, {
  inCup() { return !!(this.cup && this.cupLive); },
  // ---------- HAGUE CUP (v0.7.2): all six teams, two groups of three, the group winners meet in the final.
  // Your matches are played; the other matches are simulated. A level final goes to penalties (you vs the computer).
  cupStart(you) {
    if (this.replay) { this.replay.after = null; this.endReplay(); } this.goalQ = null;   // v0.8.3: the demo's replay ate the first ENTER
    const o = Object.keys(TEAMS).filter(t => t !== you).sort(() => Math.random() - 0.5);
    const A = [you, o[0], o[1]], B = [o[2], o[3], o[4]];
    const tbl = {}; for (const t of [...A, ...B]) tbl[t] = { p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 };
    this.cup = { you, groups: [A, B], table: tbl, results: [], stage: 'group', champion: null,
      fixtures: [[A[0], A[1]], [B[0], B[1]], [B[1], B[2]], [A[0], A[2]], [B[2], B[0]], [A[1], A[2]]], idx: 0, final: null };
    this.cupNext();
  },
  cupSim(h, a) { const pois = l => { let L = Math.exp(-l), k = 0, p = 1; do { k++; p *= Math.random(); } while (p > L); return k - 1; }; return [pois(1.35), pois(1.25)]; },
  cupRecord(h, a, gh, ga, pens) {
    const c = this.cup; c.results.push({ h, a, gh, ga, pens, stage: c.stage });
    if (c.stage === 'group') {
      const T = c.table, H = T[h], A = T[a]; H.p++; A.p++; H.gf += gh; H.ga += ga; A.gf += ga; A.ga += gh;
      if (gh > ga) { H.w++; A.l++; H.pts += 3; } else if (gh < ga) { A.w++; H.l++; A.pts += 3; } else { H.d++; A.d++; H.pts++; A.pts++; }
    } else c.champion = pens ? (pens === 1 ? h : a) : (gh > ga ? h : a);
  },
  cupOrder(g) { const T = this.cup.table; return [...g].sort((x, y) => (T[y].pts - T[x].pts) || ((T[y].gf - T[y].ga) - (T[x].gf - T[x].ga)) || (T[y].gf - T[x].gf) || (Math.random() - 0.5)); },
  cupNext() {
    const c = this.cup;
    while (c.stage === 'group' && c.idx < c.fixtures.length && !c.fixtures[c.idx].includes(c.you)) { const [h, a] = c.fixtures[c.idx++]; const [gh, ga] = this.cupSim(h, a); this.cupRecord(h, a, gh, ga); }
    if (c.stage === 'group' && c.idx >= c.fixtures.length) { c.stage = 'final'; c.final = [this.cupOrder(c.groups[0])[0], this.cupOrder(c.groups[1])[0]]; }
    if (c.stage === 'final' && !c.champion && !c.final.includes(c.you)) {          // you didn't make it: the final is simulated
      const [h, a] = c.final; let [gh, ga] = this.cupSim(h, a); this.cupRecord(h, a, gh, ga, gh === ga ? (Math.random() < 0.5 ? 1 : 2) : 0);
    }
    this.cupShow();
  },
  cupShow() {
    const c = this.cup; this.cupScreen = true; this.cupLive = false; this.paused = true;
    let el = document.getElementById('cup'); if (!el) { el = document.createElement('div'); el.id = 'cup'; document.body.appendChild(el); }
    const row = t => { const r = c.table[t]; return `<tr class="${t === c.you ? 'you' : ''}"><td>${t}</td><td>${r.p}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td><td>${r.gf - r.ga > 0 ? '+' : ''}${r.gf - r.ga}</td><td><b>${r.pts}</b></td></tr>`; };
    const grp = (g, n) => `<table><caption>GROUP ${n}</caption><tr><th></th><th>P</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>PTS</th></tr>${this.cupOrder(g).map(row).join('')}</table>`;
    const res = c.results.map(r => `<li class="${r.h === c.you || r.a === c.you ? 'you' : ''}">${r.stage === 'final' ? 'FINAL: ' : ''}${r.h} ${r.gh}-${r.ga} ${r.a}${r.pens ? ` (${r.pens === 1 ? r.h : r.a} ON PENS)` : ''}</li>`).join('');
    const nxt = c.stage === 'group' ? c.fixtures[c.idx] : c.final;
    let head, btn;
    if (c.champion) { head = c.champion === c.you ? `CHAMPIONS! ${c.you} WIN THE HAGUE CUP` : `${c.champion} WIN THE HAGUE CUP`; btn = 'NEW CUP &#9654;';
      if (!c.toldRami) { c.toldRami = true; this.ramiSay('full_time', { text: c.champion === c.you ? `${c.you} ARE THE CHAMPIONS!\nTHE HAGUE CUP IS THEIRS!` : `${c.champion} LIFT THE CUP!\nNEXT YEAR, ${c.you}!`, expr: 'laugh' }, 3); SFX.roar(5, 1); } }
    else { head = c.stage === 'final' ? `THE FINAL: ${nxt[0]} vs ${nxt[1]}` : `GROUP STAGE · NEXT: ${nxt[0]} vs ${nxt[1]}`; btn = `PLAY ${c.stage === 'final' ? 'THE FINAL' : 'MATCH'} &#9654;`; }
    el.innerHTML = `<style>#cup{position:fixed;inset:0;z-index:6;display:flex;flex-direction:column;align-items:center;justify-content:safe center;gap:12px;overflow-y:auto;padding:16px;
      background:rgba(12,10,14,.78);color:#f4f0e4;font:10px/1.8 "Press Start 2P",monospace;text-align:center}
      #cup h2{margin:0;font-size:14px;background:#ffde1e;color:#0c0a0e;padding:10px 14px;border:3px solid #0c0a0e;box-shadow:4px 4px 0 #0c0a0e}
      #cup .g{display:flex;flex-wrap:wrap;gap:14px;justify-content:center} #cup table{border-collapse:collapse;background:#1d1a22;border:3px solid #0c0a0e;box-shadow:4px 4px 0 #0c0a0e}
      #cup caption{color:#28c8e6;padding:4px} #cup td,#cup th{padding:3px 7px;text-align:right} #cup td:first-child{text-align:left} #cup tr.you td{color:#ffde1e}
      #cup ul{list-style:none;margin:0;padding:0;max-width:560px} #cup li.you{color:#ffde1e}
      #cup button{font:13px "Press Start 2P",monospace;background:#ff2878;color:#fff;padding:12px 16px;border:3px solid #0c0a0e;box-shadow:4px 4px 0 #0c0a0e;cursor:pointer}
      #cup small{font-size:8px;opacity:.8}
      #cup .tro{position:relative;width:300px;max-width:100%;height:150px;display:flex;justify-content:center;align-items:flex-end}
      #cup .tro img{image-rendering:pixelated}
      #cup .tro .cup{width:132px;filter:drop-shadow(4px 4px 0 #0c0a0e);animation:tro 1.2s ease-in-out infinite alternate}
      #cup .tro .fw{position:absolute;width:96px;opacity:0;animation:fw 1.6s ease-out infinite}
      #cup .tro .a{left:0;top:0} #cup .tro .b{right:0;top:10px;animation-delay:.55s} #cup .tro .c{left:100px;top:-20px;animation-delay:1.1s}
      @keyframes tro{from{transform:translateY(0) rotate(-3deg)}to{transform:translateY(-8px) rotate(3deg)}}
      @keyframes fw{0%{opacity:0;transform:scale(.3)}25%{opacity:1}100%{opacity:0;transform:scale(1.25)}}
      @media (prefers-reduced-motion:reduce){#cup .tro .cup,#cup .tro .fw{animation:none;opacity:1}}</style>
      ${c.champion && MAN.fx && MAN.fx.includes('trophy') ? `<div class="tro">${c.champion === c.you ? '<img class="fw a" src="assets/hud/fwGold.png" alt=""><img class="fw b" src="assets/hud/fwPink.png" alt=""><img class="fw c" src="assets/hud/confetti.png" alt="">' : ''}<img class="cup" src="assets/hud/trophy.png" alt="The Hague Cup trophy"></div>` : ''}
      <h2>${head}</h2><div class="g">${grp(c.groups[0], 'A')}${grp(c.groups[1], 'B')}</div>
      ${res ? `<ul>${res}</ul>` : '<small>TWO GROUPS OF THREE · WIN YOUR GROUP TO REACH THE FINAL · A LEVEL FINAL GOES TO PENALTIES</small>'}
      <button type="button" id="cup-go">${btn}</button><small>ENTER = ${btn.replace(' &#9654;', '')}</small>`;
    el.hidden = false; el.style.display = 'flex';
    document.getElementById('cup-go').onclick = () => this.cupPlay();
  },
  cupPlay() {
    if (!this.cupScreen) return;
    const c = this.cup, el = document.getElementById('cup');
    if (c.champion) { if (el) el.remove(); this.cupScreen = false; this.cupStart(c.you); return; }   // NEW CUP
    const [h, a] = c.stage === 'group' ? c.fixtures[c.idx] : c.final, you = h === c.you ? h : a, opp = h === c.you ? a : h;
    if (el) el.style.display = 'none'; this.cupScreen = false;
    this.setTeams(you, opp, () => { this.paused = false; this.cupLive = true; this.cupPens = false; this.so = null; this.freeze = Math.max(this.freeze, 0.8);
      this.say(c.stage === 'final' ? 'THE FINAL' : 'HAGUE CUP', `${you} vs ${opp}`, 2); this.preMatch(); });
  },
  cupResult() {
    const c = this.cup; if (!c) return;
    const gh = this.home.score, ga = this.away.score, so = this.so && this.so.done ? this.so : null;
    const pens = so ? (so.winner === 0 ? 1 : 2) : 0;
    const [h, a] = c.stage === 'group' ? c.fixtures[c.idx] : c.final;
    const homeIsYou = h === c.you, rh = homeIsYou ? gh : ga, ra = homeIsYou ? ga : gh;
    const rp = pens ? ((pens === 1) === homeIsYou ? 1 : 2) : 0;
    this.cupRecord(h, a, rh, ra, rp); if (c.stage === 'group') c.idx++;
    this.cupLive = false; this.so = null; this.over = false; this.msg.setText(''); this.sub.setText(''); this.scene.stop('penalty'); this.penaltyMode = false;
    if (c.champion && (c.champion === this.home.name || c.champion === this.away.name)) { this.cupCeremony(c.champion); return; }   // v0.7.4: the trophy is lifted on the pitch first
    this.cupNext();
  },
  // v0.7.4 TROPHY CEREMONY: the winning captain lifts the PixelLab trophy at the centre spot, his team-mates go wild behind
  // him, the beaten finalists slump, fireworks + confetti (PixelLab) go off over the stadium. ENTER -> the cup table.
  cupCeremony(champ) {
    const win = this.home.name === champ ? this.home : this.away, lose = win === this.home ? this.away : this.home, b = this.ball;
    this.ceremony = { t: 0, fw: 0, win }; this.over = true; this.paused = false; this.freeze = 0; this.setPiece = null; this.pending = null;
    const outs = win.players.filter(p => !p.sentOff), cap = outs.find(p => p.num === 10 && !p.keeper) || outs.find(p => !p.keeper), rest = outs.filter(p => p !== cap);
    const KA = MAN.kits[cap.kit].anims, party = ['celeb4', 'celebrate', 'applaud', 'jump'].filter(a => KA[`${a}-S`]);
    for (const p of this.all) { p.vx = p.vy = 0; p.speed = 0; p.hands = false; p.stun = 0; p.state = 'idle'; p.anim = ''; }
    cap.x = 52.5; cap.y = 38.6; cap.face = 6; cap.state = 'trophy'; cap.stateT = 999;
    rest.forEach((p, i) => { const k = i - (rest.length - 1) / 2; p.x = 52.5 + k * 2.5 + rnd(-0.3, 0.3); p.y = 36 - Math.abs(k) * 0.2 + (i % 2) * 0.8; p.face = 6;
      p.state = 'party'; p.stateT = 999; p.partyAnim = party[i % party.length]; p.partyFps = 8 + (i % 3); });
    lose.players.forEach((p, i) => { if (p.sentOff) return; p.x = i < 6 ? 40.5 - i * 1.9 : 64.5 + (i - 6) * 1.9; p.y = 40.5 + (i % 3) * 1.1; p.face = 6;
      if (MAN.kits[p.kit].anims['dejected-S']) { p.state = 'dejected'; p.stateT = 999; } });
    if (this.ref) { this.ref.x = 61; this.ref.y = 43; this.ref.vx = this.ref.vy = 0; this.ref.state = 'idle'; this.ref.t = 0; this.ref.face = 6; }
    b.owner = null; b.x = 52.5; b.y = 34.5; b.z = 0; b.vx = b.vy = b.vz = 0; b.inNet = false; this.camX = this.camY = undefined;
    { const X0 = wx(52.5, 34.5), Y0 = wy(34.5);                                 // the floodlights dim so the fireworks pop
      this.cerDim = this.add.rectangle(X0, Y0, VIEW_W * 4, VIEW_H * 4, 0x0c0a0e, 1).setAlpha(0).setDepth(-2e5);
      this.tweens.add({ targets: this.cerDim, alpha: 0.5, duration: 1400, delay: 600 }); }
    this.say('CHAMPIONS!', `${champ} WIN THE HAGUE CUP`, 99999);
    this.ramiSay('full_time', { text: `${champ} LIFT THE HAGUE CUP!\nWHAT A NIGHT AT KLEINE LOO!`, expr: 'laugh' }, 3);
    if (this.cup) this.cup.toldRami = true;
    SFX.roar(6, 1); SFX.whistle(3, true);
  },
  ceremonyTick(dt) {
    const c = this.ceremony; c.t += dt; c.fw -= dt;
    this.ballSpr.setVisible(false); this.ballSh.setVisible(false); this.cursor.setAlpha(0); this.power.clear(); this.ring.clear();
    if (c.t > 2.5 && !c.hint) { c.hint = true; this.sub.setText(`${c.win.name} WIN THE HAGUE CUP · ENTER`); }
    if (c.fw <= 0 && this.textures.exists('fx')) {                               // PixelLab fireworks, confetti, streamers over the stands
      c.fw = rnd(0.16, 0.34);
      const T = this.textures.get('fx'), pick = ['fwGold', 'fwPink', 'confetti', 'sparkle', 'streamers', 'fwGold'].filter(n => T.has(n));
      if (pick.length) {
        const V = this.cameras.main.worldView, nm = pick[Math.floor(Math.random() * pick.length)];
        const im = this.add.image(V.x + rnd(60, V.width - 60), V.y + rnd(70, nm === 'confetti' || nm === 'streamers' ? 320 : 230), 'fx', nm).setDepth(9e6).setScale(0.5).setAlpha(1);
        this.tweens.add({ targets: im, scale: rnd(2.0, 3.0), alpha: 0, y: im.y + (nm === 'confetti' || nm === 'streamers' ? 60 : 10), duration: rnd(800, 1300), ease: 'Cubic.easeOut', onComplete: () => im.destroy() });
        if (nm.startsWith('fw') && Math.random() < 0.5) SFX.kick && SFX.kick(0.2);
      }
    }
  },
  endCeremony() {
    this.ceremony = null; this.over = false; this.msg.setText(''); this.sub.setText(''); this.cursor.setAlpha(1); if (this.cerDim) { this.cerDim.destroy(); this.cerDim = null; } this.cameras.main.setZoom(this.baseZoom()); this.fixUi(this.baseZoom());
    for (const p of this.all) if (!p.sentOff) { p.state = 'idle'; p.stateT = 0; }
    this.cupNext();
  },
});
