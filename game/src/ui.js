'use strict';
// HC2 Football · ui.js: menus and HUD: setup, pause, team sheet, walk-out intro, Rami commentary, radar, on-screen feedback
// (split out of game.js in v0.9.5 - load order and lanes: src/README.md)
// ---------- RAMI ON THE MIC: the picked 64 px ZINE sticker (Aseprite, E10) talks in a box bottom-left with the E11
// call-out lines - talk loop while the line types out, then the line's expression (goal / shock / laugh ...).
// Used by the match and the penalty camera.
const RAMI_ALT = {                                   // a few extra takes so the same moment doesn't always get the same line
  goal_followup: [['WHAT A STRIKE FROM', '{TEAM}!'], ['{TEAM} SCORE!', 'THE FANS GO WILD!']],
  save: [['SAVED! WHAT HANDS!'], ['HE GETS A GLOVE', 'TO IT!']],
  miss: [['OFF TARGET!', 'HE WANTS THAT BACK!']],
  post: [['RATTLES THE POST!']],
  banter: [['WHAT A CROWD', 'AT KLEINE LOO!'], ['SIX TEAMS, ONE CUP,', 'ONE GOOD CAUSE!']],
};

class RamiBox {
  static make(scene) { return MAN.rami && scene.textures.exists('rami') ? new RamiBox(scene) : null; }
  constructor(scene) {
    const F = '"Press Start 2P"'; this.s = scene;
    this.c = scene.add.container(0, 0).setScrollFactor(0).setDepth(9.7e6).setVisible(false);
    this.panel = scene.add.graphics();
    this.pic = scene.add.image(0, 0, 'rami', 'rami-0').setOrigin(0, 1).setScale(1.5);   // E11 was drawn for 640 x 360: x1.5 here
    this.tab = scene.add.text(0, 0, 'RAMI', { fontFamily: F, fontSize: '9px', color: '#0c0a0e', backgroundColor: '#ffde1e', padding: { x: 6, y: 4 } }).setOrigin(0, 1);
    this.txt = scene.add.text(0, 0, '', { fontFamily: F, fontSize: '11px', color: '#f4f0e4', lineSpacing: 8 }).setOrigin(0, 0);
    this.c.add([this.panel, this.pic, this.tab, this.txt]);
    this.line = null; this.t = 0; this.prio = 0; this.cool = {}; this.quiet = 0;
  }
  say(key, v = {}, prio = 1) {
    const L = MAN.rami.lines[key]; if (!L || (window.__lab && !window.__labCut)) return;
    if (this.line && this.prio > prio && this.t < this.dur) return;                // a bigger moment is still on
    const now = this.s.time.now; if (prio < 3 && this.cool[key] && now - this.cool[key] < 9000) return; this.cool[key] = now;
    const alts = RAMI_ALT[key], src = alts && Math.random() < 0.5 ? alts[Math.floor(Math.random() * alts.length)] : L.text;
    const text = v.text || src.map(x => x.replace('{TEAM}', v.TEAM || '').replace('{NUM}', v.NUM == null ? '' : v.NUM).replace('{WINNER}', v.WINNER || '')).join('\n');
    this.txt.setText(text); const tw = this.txt.width, th = this.txt.height; this.txt.setText('');
    this.line = { text, expr: v.expr || L.expr, tw, th }; this.t = 0; this.prio = prio; this.dur = 0.6 + text.length / 40 + 2.2; this.quiet = 0;
  }
  tick(dt, lift = 0) {
    this.quiet += dt;
    if (!this.line) { this.c.setVisible(false); return; }
    this.t += dt; const L = this.line, tg = MAN.rami.tags;
    if (this.t > this.dur) { this.line = null; this.c.setVisible(false); return; }
    const n = Math.min(L.text.length, Math.floor(this.t * 40)), typing = n < L.text.length;
    this.txt.setText(L.text.slice(0, n));
    let f = 0;
    if (typing) f = tg.talk[0] + Math.floor(this.t / 0.12) % 4;
    else if (L.expr !== 'talk' && tg[L.expr]) f = tg[L.expr][0];
    else f = Math.floor(this.t * 2) % 7 === 3 ? tg.blink[0] : 0;
    this.pic.setFrame('rami-' + f);
    // layout: sticker bottom-left, the line in an INK panel beside it, name tab on the panel's top-left
    const by = VIEW_H - 10 - lift;
    const pop = Math.min(1, this.t / 0.12), shake = !typing && (L.expr === 'goal' || L.expr === 'shock') && this.t - L.text.length / 40 < 0.35 ? Math.round(Math.sin(this.t * 70) * 2) : 0;
    const px = 10 + Math.round(MAN.rami.w * 1.5) + 4, pw = L.tw + 26, ph = L.th + 22, py = by - 14 - ph;
    this.pic.setPosition(10 + shake, by + (1 - pop) * 30);
    this.panel.clear().fillStyle(0x0c0a0e, 0.94).fillRect(px, py, pw, ph).lineStyle(2, 0xf4f0e4).strokeRect(px, py, pw, ph);
    this.tab.setPosition(px + 8, py + 2); this.txt.setPosition(px + 13, py + 12);
    this.c.setVisible(true);
  }
}

// ---------------------------------------------------------------- Match methods: ui
hc2Mix(Match, {

  buildHud() {
    const F = '"Press Start 2P"', hud = this.add.container(0, 0).setScrollFactor(0).setDepth(1e7);
    this.hud = hud;
    const slip = this.add.rectangle(16, 14, 300, 36, 0x0c0a0e).setOrigin(0, 0).setStrokeStyle(2, 0xf4f0e4);
    this.scoreTxt = this.add.text(30, 25, '', { fontFamily: F, fontSize: '14px', color: '#f4f0e4' });
    const clk = this.add.rectangle(16, 54, 150, 26, 0xffde1e).setOrigin(0, 0).setStrokeStyle(2, 0x0c0a0e);
    this.clockTxt = this.add.text(26, 61, '', { fontFamily: F, fontSize: '11px', color: '#0c0a0e' });
    this.msg = this.add.text(VIEW_W / 2, VIEW_H * 0.26, '', { fontFamily: F, fontSize: '34px', color: '#ffde1e', stroke: '#0c0a0e', strokeThickness: 8 }).setOrigin(0.5);
    this.sub = this.add.text(VIEW_W / 2, VIEW_H * 0.26 + 44, '', { fontFamily: F, fontSize: '12px', color: '#f4f0e4', stroke: '#0c0a0e', strokeThickness: 5 }).setOrigin(0.5);
    this.help = this.add.text(16, VIEW_H - 30, this.helpText(),
      { fontFamily: F, fontSize: '8px', color: '#0c0a0e', backgroundColor: '#f4f0e4', padding: { x: 8, y: 6 } });
    this.radar = this.add.graphics();
    this.power = this.add.graphics();          // world-space feedback: shot arrow + power bar, energy bar, pass ring
    hud.add([slip, this.scoreTxt, clk, this.clockTxt, this.msg, this.sub, this.help, this.radar]);
    this.meters = [new SpMeter(this, 0), new SpMeter(this, 1)];                     // v0.7 special-move energy, one per side
    // t-009 (Luca, 24 Oct: "a more contrasting visible arrow which shows who you control"): the same E6 cursor art, with a
    // dark ink outline behind it (the image tinted ink, 8 copies nudged out ~2 px) so it separates from grass, crowd, rain,
    // snow and night. A container, so the code elsewhere that hides / fades this.cursor still works on all of it.
    // drawCursor() sizes, bobs, pops and colours it.
    this.cursorInk = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]].map(([dx, dy]) =>
      this.add.image(dx * CUR_INK, dy * CUR_INK, 'HC2-E6-cursor-blue').setOrigin(0.5, 1).setTintFill(0x0c0a0e).setVisible(this.game.renderer.type !== Phaser.CANVAS));   // (safe mode's canvas can't tint: no outline there)
    this.cursorImg = this.add.image(0, 0, 'HC2-E6-cursor-blue').setOrigin(0.5, 1);
    this.cursor = this.add.container(0, 0, [...this.cursorInk, this.cursorImg]).setDepth(8e6);
    this.power.setDepth(8e6 + 1);
    this.ring = this.add.graphics().setDepth(-4e5);   // pass-target ring sits on the grass, under the players
    this.helpUntil = 9000;
    if (window.HC2_TOUCH) this.help.setVisible(false);
    // t-006 INSTA FLAG: a small FLAG button next to the score (a click does what F does); shown while you play or watch
    this.flagBtn = this.add.text(326, 14, 'FLAG \u00b7 F', { fontFamily: F, fontSize: '9px', color: '#ffffff', backgroundColor: '#ff2878', padding: { x: 8, y: 7 } }).setScrollFactor(0).setVisible(false);   // (scroll factor 0 on the button itself: the click test uses it)
    this.flagBtn.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.flagOpen());
    hud.add(this.flagBtn);
    this.events.on('postupdate', () => { const fb = this.flagBtn; if (fb && fb.scene) fb.setVisible(!!window.HC2_STARTED && !window.HC2_TOUCH && !window.__lab && !this.replay && !this.flagUI && !this.pre && !this.intro && !this.penaltyMode && !this.cupScreen && !this.ceremony); });
  },
  pauseLine() { const k = keyset(), H = this.highlights && this.highlights.length;
    return `PRESS ENTER / START${this.lastReplay ? ` · ${k.lob}: LAST GOAL` : ''}${H ? ` · ${k.pass}: HIGHLIGHTS (${H})` : ''}`; },
  ftLine() { const H = this.highlights && this.highlights.length;
    const B = this.bw ? this.bw.list.filter(x => !x.review).length : 0;
    return `${this.home.name} ${this.home.score} - ${this.away.score} ${this.away.name}${this.half > 2 ? ' (AET)' : ''}   ENTER: ${this.cup && this.cupLive ? 'CUP' : 'AGAIN'}${H ? `   ${keyset().pass}: HIGHLIGHTS` : ''}${B ? `   B: BUG WATCH (${B})` : ''}`; },
  helpText() {
    const k = keyset();
    return `${k.move} MOVE  ${k.pass} PASS / CHALLENGE  ${k.shoot} SHOOT (HOLD) / SLIDE  ${k.lob} LOB  ${k.through} THROUGH  SHIFT SPRINT  ${k.special} SPECIAL`;
  },
  layoutHud() {},

  say(big, small, sec) { this.msg.setText(big || ''); this.sub.setText(small || ''); this.msgT = sec || 1.5; },

  // ---------- RAMI ON THE MIC (see class RamiBox)
  buildRami() { this.rami = RamiBox.make(this); },
  ramiSay(key, v, prio) { if (this.rami) this.rami.say(key, v, prio); },
  ramiTick(dt) { if (this.rami) this.rami.tick(dt, this.replay ? (this.replay.ctl ? 92 : 52) : (this.help && this.help.visible ? 40 : 0)); },
  // ---- the overlay (team sheet / half time card): DOM, same look as the cup table
  flowEl(kind) {
    let el = document.getElementById('flow');
    if (!el) { el = document.createElement('div'); el.id = 'flow'; document.body.appendChild(el);
      const st = document.createElement('style'); st.textContent = `#flow{position:fixed;inset:0;z-index:6;display:flex;flex-direction:column;align-items:center;justify-content:safe center;gap:10px;overflow-y:auto;padding:16px;
        background:rgba(12,10,14,.72);color:#f4f0e4;font:10px/1.8 "Press Start 2P",monospace;text-align:center}
        #flow h2{margin:0;font-size:14px;background:#ffde1e;color:#0c0a0e;padding:10px 14px;border:3px solid #0c0a0e;box-shadow:4px 4px 0 #0c0a0e}
        #flow .sc{font-size:16px;color:#ffde1e} #flow table{border-collapse:collapse;background:#1d1a22;border:3px solid #0c0a0e;box-shadow:4px 4px 0 #0c0a0e}
        #flow td,#flow th{padding:4px 12px} #flow th{color:#28c8e6;font-weight:normal} #flow small{font-size:8px;opacity:.85}
        #flow .row{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}
        #flow button{font:11px "Press Start 2P",monospace;background:#f4f0e4;color:#0c0a0e;padding:10px 12px;border:3px solid #0c0a0e;box-shadow:3px 3px 0 #0c0a0e;cursor:pointer}
        #flow button.go{background:#ff2878;color:#fff}
        #flow .sheet{display:flex;gap:14px;flex-wrap:wrap;justify-content:center;align-items:flex-start}
        #flow .pitch{position:relative;width:min(300px,78vw);aspect-ratio:68/58;max-width:100%;background:repeating-linear-gradient(0deg,#1f9e3a 0 18px,#24ad41 18px 36px);border:3px solid #0c0a0e;box-shadow:4px 4px 0 #0c0a0e;
          background-clip:padding-box;outline:2px solid #f4f0e4;outline-offset:-10px}
        #flow .pitch:after{content:"";position:absolute;left:30%;right:30%;bottom:8px;height:16%;border:2px solid #f4f0e4;border-bottom:0}
        #flow .tk{position:absolute;transform:translate(-50%,-50%);width:34px;height:34px;display:flex;flex-direction:column;align-items:center;justify-content:center;
          border:3px solid #0c0a0e;box-shadow:2px 2px 0 #0c0a0e;cursor:pointer;font-size:11px;padding:0;line-height:1;z-index:1}
        #flow .tk i{display:block;width:24px;height:4px;margin-top:3px;background:#0c0a0e} #flow .tk i b{display:block;height:100%;background:#4cff7a}
        #flow .tk.sel{outline:3px solid #ffde1e;outline-offset:2px} #flow .tk.yc:after{content:"";position:absolute;right:-6px;top:-6px;width:7px;height:10px;background:#ffde1e;border:1px solid #0c0a0e}
        #flow .tk.off{opacity:.35;cursor:default} #flow .tk.inj:before{content:"+";position:absolute;left:-7px;top:-8px;width:13px;height:13px;line-height:13px;font-size:11px;background:#ff2878;color:#fff;border:1px solid #0c0a0e}
        #flow .bench{display:flex;flex-direction:column;gap:8px;align-items:center;background:#1d1a22;border:3px solid #0c0a0e;box-shadow:4px 4px 0 #0c0a0e;padding:10px}
        #flow .bench .tk{position:relative;transform:none}
        #flow .opts{display:grid;gap:8px;width:min(620px,100%)} #flow .opt{display:grid;grid-template-columns:150px 1fr;gap:10px;align-items:center;background:#1d1a22;border:3px solid #0c0a0e;padding:8px 10px;text-align:left}
        #flow .opt.on{outline:3px solid #ffde1e;outline-offset:1px} #flow .opt b{font-weight:normal;color:#28c8e6;font-size:9px}
        #flow .ch{display:flex;flex-wrap:wrap;gap:6px} #flow .ch button{font-size:9px;padding:7px 8px;box-shadow:2px 2px 0 #0c0a0e}
        #flow .ch button[aria-pressed=true]{background:#ffde1e} #flow .menu{display:grid;gap:8px;width:min(360px,100%)}
        #flow .menu button{display:flex;justify-content:space-between;align-items:center;gap:10px;text-align:left} #flow .menu button.on{background:#ffde1e;outline:3px solid #f4f0e4;outline-offset:1px}
        #flow .menu kbd{font:8px "Press Start 2P",monospace;background:#0c0a0e;color:#f4f0e4;padding:3px 5px}
        #flow table.mv{max-width:min(620px,100%);text-align:left} #flow table.mv th{color:#ffde1e;white-space:nowrap;vertical-align:top} #flow table.mv td{font-size:9px}
        @media (max-width:560px){ #flow .opt{grid-template-columns:1fr} }`;
      el.appendChild(st); }
    el.dataset.kind = kind; el.style.display = 'flex';
    [...el.children].forEach(c => { if (c.tagName !== 'STYLE') c.remove(); });
    const box = document.createElement('div'); box.className = 'box'; box.style.cssText = 'display:contents'; el.appendChild(box);
    return { set innerHTML(h) { box.innerHTML = h; }, querySelector: s => box.querySelector(s), querySelectorAll: s => box.querySelectorAll(s) };
  },
  closeFlowEl() { const el = document.getElementById('flow'); if (el) el.style.display = 'none'; },
  // ---- TEAM SHEET (before kick-off: any swaps; at half time: bench swaps are subs, 3 a match, no coming back)
  openSheet(mode) {
    const team = this.home, Q = this.squadOf(team), hcol = '#' + (TEAMS[team.name] ? TEAMS[team.name].col : 0xf4f0e4).toString(16).padStart(6, '0');
    this.sheet = { mode, sel: null }; if (this.ht) this.ht.phase = 'subs';
    const el = this.flowEl('sheet');
    const tok = (d, k, extra = '', st = '') => `<button class="tk ${extra}" data-k="${k}" style="background:${hcol};color:#0c0a0e;${st}" aria-label="number ${d.num}">${d.num}${mode !== 'pre' ? `<i><b style="width:${Math.round(100 * (d.stamina ?? 1))}%"></b></i>` : ''}</button>`;
    const draw = () => {
      const pos = i => { const f = FORMATION[i]; return `left:${(f[1] / 68 * 100).toFixed(1)}%;top:${(96 - f[0] / 50 * 88).toFixed(1)}%`; };
      const xi = team.players.map((p, i) => tok(p, 'p' + i, `${p.sentOff ? 'off' : ''} ${(p.yellows || 0) ? 'yc' : ''} ${p.injury ? 'inj' : ''} ${this.sheet.sel === 'p' + i ? 'sel' : ''}`, pos(i))).join('');
      const bench = Q.bench.map((d, j) => tok(d, 'b' + j, `${d.used ? 'off' : ''} ${this.sheet.sel === 'b' + j ? 'sel' : ''}`)).join('');
      const left = 3 - Q.subs;
      el.innerHTML = `<h2>${mode === 'ht' ? 'HALF TIME · SUBS' : mode === 'pause' ? 'SUBS' : 'TEAM SHEET'} · ${team.name}</h2>
        <div class="sheet"><div class="pitch">${xi}</div><div class="bench"><small>BENCH</small>${bench}<small>12 = KEEPER</small></div></div>
        <small>${this.sheetMsg || (mode !== 'pre' ? `TAP A PLAYER, THEN WHO COMES ON · ${left} SUB${left === 1 ? '' : 'S'} LEFT` : 'TAP TWO PLAYERS TO SWAP THEM (POSITIONS OR THE BENCH)')}</small>
        <div class="row"><button data-k="done" class="go">${mode !== 'pre' ? 'DONE' : 'WALK OUT'} &#9654;</button></div><small>ENTER / ${keyset().pass}: ${mode !== 'pre' ? 'DONE' : 'WALK OUT'}</small>`;
      el.querySelectorAll('.tk').forEach(b => b.onclick = () => this.sheetTap(b.dataset.k, draw));
      el.querySelector('[data-k=done]').onclick = () => this.closeSheet();
    };
    this.sheetMsg = ''; draw();
  },
  sheetTap(k, draw) {
    const S = this.sheet, team = this.home, Q = this.squadOf(team);
    const get = key => key[0] === 'p' ? { p: team.players[+key.slice(1)] } : { b: Q.bench[+key.slice(1)], j: +key.slice(1) };
    const A = get(k); this.sheetMsg = '';
    if ((A.p && A.p.sentOff) || (A.b && A.b.used)) return;
    if (!S.sel) { S.sel = k; return draw(); }
    if (S.sel === k) { S.sel = null; return draw(); }
    const B = get(S.sel); S.sel = null;
    const isGk = x => x.p ? x.p.keeper : x.b.gk;
    if (isGk(A) !== isGk(B)) { this.sheetMsg = 'KEEPERS ONLY SWAP WITH THE OTHER KEEPER'; return draw(); }
    if (A.b && B.b) { const t = Q.bench[A.j]; Q.bench[A.j] = Q.bench[B.j]; Q.bench[B.j] = t; return draw(); }
    if (A.p && B.p) { const t = this.ident(A.p); this.setIdent(A.p, this.ident(B.p)); this.setIdent(B.p, t); return draw(); }
    const P = A.p ? A.p : B.p, X = A.b ? A : B;                                     // pitch <-> bench
    if (S.mode !== 'pre') {
      if (Q.subs >= 3) { this.sheetMsg = 'NO SUBS LEFT (3 A MATCH)'; return draw(); }
      const offRec = { ...this.ident(P), used: true, off: true }; this.setIdent(P, { num: X.b.num, stamina: 1, yellows: 0, fouls: 0 });
      Q.bench[X.j] = offRec; Q.subs++; SFX.whistle(1);
      this.sheetMsg = `${P.num} ON, ${offRec.num} OFF`;
    } else { const t = this.ident(P); this.setIdent(P, { num: X.b.num, stamina: 1, yellows: 0, fouls: 0 }); Q.bench[X.j] = { ...X.b, num: t.num }; }
    draw();
  },
  closeSheet() {
    const S = this.sheet; if (!S) return; this.sheet = null;
    if (S.mode === 'pre') { this.lineup = this.lineup || {}; const Q = this.squadOf(this.home);
      this.lineup[this.home.name] = { xi: this.home.players.map(p => p.num), bench: Q.bench.map(d => d.num) };   // kept for your next match
      this.closeFlowEl(); this.startIntro(); return; }
    if (S.mode === 'pause') { this.drawPause(); return; }                         // v0.8.5 back to the pause menu
    if (this.ht) { this.ht.phase = 'card'; this.ht.auto = 25; this.htCard(); }
  },
  applyLineup(team) {                                                             // your last team sheet, in the next match too
    const L = this.lineup && this.lineup[team.name]; if (!L) return;
    team.players.forEach((p, i) => { if (L.xi[i] != null) p.num = L.xi[i]; });
    const Q = this.squadOf(team); Q.bench.forEach((d, j) => { if (L.bench[j] != null) d.num = L.bench[j]; d.gk = d.num === 1 || d.num === 12; });   // (the spare keeper is 1 or 12)
  },
  // ---- before kick-off: the team sheet, then the walk-out (index.html / the cup / AGAIN call this after setTeams)
  preMatch() {
    if (this.flowFast() || window.HC2_SKIP_INTRO) return;
    this.pre = true; this.freeze = 0; this.msg.setText(''); this.sub.setText(''); this.openSetup();                          // v0.8.5: match settings, then the team sheet
    this.camTarget = { x: wx(22, -12), y: wy(-11.5) };                            // the stand behind the sheet (its art loads before the walk-out)
  },
  // ---- WALK-OUT: the camera takes in the main stand, the teams + the referee come out of the tunnel (under the stand,
  // halfway line), line up facing the camera, then break to their positions. Any key skips. Existing art only.
  startIntro() {
    this.pre = false;
    const T = { x: 52.5, y: -5.2 };
    this.intro = { t: 0, phase: 'crowd' };
    this.all.forEach(p => { if (p.sentOff) return; p.x = T.x + (p.team.side > 0 ? -0.6 : 0.6); p.y = T.y; p.vx = p.vy = 0; p.state = 'idle'; p.hide = true; });
    // the line-up: home to the left of the referee, away to the right, 4 m in from the touchline
    const row = (t, k) => ({ x: 52.5 + (t.side > 0 ? -1 : 1) * (1.3 + k * 1.05), y: 3.6 });
    for (const t of [this.home, this.away]) t.players.filter(p => !p.sentOff).forEach((p, k) => { p.lineSpot = row(t, k); p.walkAt = 2.1 + k * 0.2 + (t.side > 0 ? 0 : 0.1); });
    if (this.ref) { this.ref.x = T.x; this.ref.y = T.y; this.ref.goTo = null; this.ref.walkAt = 1.9; this.ref.hidden = true; }
    this.camX = wx(22, -12); this.camY = wy(-11.5);                               // (straight onto the stand, no swing over the grass)
    this.stadium.cheer(14); SFX.roar(3, 0.6);
    this.say(this.arenaName(), `${this.home.name} v ${this.away.name}`, 2.6);
    this.ramiSay('kickoff', { text: 'WELCOME TO\nHET KLEINE LOO!', expr: 'talk' }, 3); this.ramiHello = true;
    for (const o of [this.cursor, this.ring]) if (o) o.setVisible(false);
  },
  introTick(dt) {
    const I = this.intro; I.t += dt;
    const skip = Input.pressed('start') || Input.pressed('pass') || Input.pressed('shoot');
    if (skip && I.t > 0.4) return this.endIntro();
    if (I.t < 3) { const k = clamp(I.t / 3, 0, 1), e = k * k * (3 - 2 * k); this.camTarget = { x: wx(22 + e * 61, -12), y: wy(-11.5) }; this.camFast = true; }   // the main stand, left to right
    else this.camFast = false;
    let maxT = 0, walking = 0, sx = 0, n = 0;
    for (const p of this.all) {
      if (p.sentOff || !p.lineSpot) continue;
      if (I.t < p.walkAt) continue;
      p.hide = false;
      const d = p.moveTo(p.lineSpot.x, p.lineSpot.y, 2.25, dt); p.step(dt);
      if (d < 0.25) { p.vx = p.vy = 0; p.face = 6; } else walking++;
      sx += p.x; n++;
    }
    if (this.ref) { if (I.t >= this.ref.walkAt) { this.ref.hidden = false; this.ref.goTo = { x: 52.5, y: 3.6 }; } this.ref.step(dt); }
    const cx = n ? sx / n : 52.5;
    if (I.t >= 3) this.camTarget = { x: wx(cx, 4), y: wy(3.5) - 110 };
    if (I.phase === 'crowd' && I.t >= 2.1) { I.phase = 'walk'; this.ramiSay('banter', { text: 'AND HERE THEY COME,\nOUT OF THE TUNNEL!', expr: 'talk' }, 3); }
    if (I.phase === 'walk' && I.t > 6 && walking === 0) { I.phase = 'line'; I.lineT = I.t; SFX.roar(3, 0.8); this.stadium.cheer(4); }
    if (I.phase === 'line' && I.t - I.lineT > 2.2) this.endIntro();
    if (I.t > 22) this.endIntro();
  },
  endIntro() {
    this.intro = null; this.camTarget = null; this.camFast = false;
    for (const p of this.all) { p.lineSpot = null; p.hide = false; }
    if (this.ref) { this.ref.hidden = false; this.ref.goTo = null; }
    for (const o of [this.cursor, this.ring]) if (o) o.setVisible(true);
    this.startToss();                                                            // v0.8.5: the coin decides who kicks off
  },

  // ======================================================================= v0.8.5 MENUS + ENDINGS + COIN TOSS (Luca, 23 Oct 04:09)
  // Before the team sheet: MATCH SETTINGS - arena, time of day, weather, what happens when it's level at 90 (crude
  // placeholders for the art: a tint, rain / snow on screen, a little ball physics). ENDINGS: a draw, extra time (2 x 15),
  // golden goal, extra time + penalties, penalties at 90. After the walk-out the COIN TOSS (PixelLab coin: RISE / the RISE
  // arrow) decides who kicks off. A real PAUSE MENU: resume, team + subs, the moves, options, replays, quit.
  loadRules() {
    const R = { arena: 'loo', tod: 'day', weather: 'clear', ending: 'none' };
    try { const s = JSON.parse(localStorage.getItem('hc2-rules') || 'null'); if (s) for (const k in R) if (RULE_OPTS[k].some(o => o[0] === s[k])) R[k] = s[k]; } catch (e) {}
    return R;
  },
  saveRules() { try { localStorage.setItem('hc2-rules', JSON.stringify(this.mset)); } catch (e) {} },
  setupRows() {
    const rows = [{ k: 'arena', label: 'ARENA' }, { k: 'tod', label: 'TIME OF DAY' }, { k: 'weather', label: 'WEATHER' }];
    if (!this.inCup()) rows.push({ k: 'ending', label: 'LEVEL AT 90?' });
    return rows.map(r => ({ ...r, opts: RULE_OPTS[r.k] }));
  },
  openSetup() {
    this.mset = this.loadRules(); this.setup = { row: 0 };
    const R = this.mset, el = this.flowEl('setup');
    const draw = () => {
      const rows = this.setupRows(), S = this.setup; if (!S) return;
      const cupNote = this.inCup() ? (this.cup.stage === 'final' ? 'THE FINAL: LEVEL AT 90 = EXTRA TIME, THEN PENALTIES' : 'GROUP GAME: A DRAW IS A DRAW') : '';
      el.innerHTML = `<h2>MATCH SETTINGS</h2><div class="sc">${this.home.name} v ${this.away.name} · ${(DIFF_OPTS.find(o => o[0] === DIFF_LEVEL) || DIFF_OPTS[1])[1]}${AI_MODE === 'classic' ? ' · CLASSIC AI: THE LEVEL BARELY APPLIES' : ''}</div>
        <div class="opts">${rows.map((r, i) => `<div class="opt${S.row === i ? ' on' : ''}"><b>${r.label}</b><div class="ch">${r.opts.map(([k, l]) =>
          `<button type="button" data-r="${i}" data-v="${k}" aria-pressed="${R[r.k] === k}">${l}</button>`).join('')}</div></div>`).join('')}</div>
        ${cupNote ? `<small>${cupNote}</small>` : ''}<small>ARENAS, LIGHT + WEATHER ARE PLACEHOLDERS FOR NOW (THE ART COMES LATER)</small>
        <div class="row"><button type="button" data-k="go" class="go">TEAM SHEET &#9654;</button></div>
        <small>&#8593;&#8595; PICK A ROW · &#8592;&#8594; CHANGE · ENTER / ${keyset().pass}: TEAM SHEET</small>`;
      el.querySelectorAll('.ch button').forEach(b => b.onclick = () => { const r = this.setupRows()[+b.dataset.r]; R[r.k] = b.dataset.v; S.row = +b.dataset.r; SFX.click(); draw(); });
      el.querySelector('[data-k=go]').onclick = () => this.closeSetup();
    };
    this.setup.draw = draw; draw();
  },
  setupInput() {
    const S = this.setup, rows = this.setupRows(), R = this.mset, n = Input.nav();
    if (n.y) { S.row = (S.row + n.y + rows.length) % rows.length; SFX.click(); S.draw(); }
    if (n.x) { const r = rows[S.row], i = r.opts.findIndex(o => o[0] === R[r.k]); R[r.k] = r.opts[(i + n.x + r.opts.length) % r.opts.length][0]; SFX.click(); S.draw(); }
    if (Input.pressed('start') || Input.pressed('pass')) this.closeSetup();
  },
  closeSetup() {
    if (!this.setup) return; this.setup = null; this.saveRules(); this.applyRules(); SFX.click(); this.openSheet('pre');
  },
  // the settings in play: physics for the weather, the light + weather on screen
  applyRules() {
    const R = this.mset || {}, w = R.weather || 'clear', B = BASE_PHYS;
    SKID_DEC = B.SKID_DEC * (w === 'rain' ? 0.72 : w === 'snow' ? 1.3 : 1);       // wet grass: the ball skids on; snow: it dies
    ROLL_DEC = B.ROLL_DEC * (w === 'rain' ? 0.82 : w === 'snow' ? 1.45 : 1);
    BOUNCE_Z = B.BOUNCE_Z * (w === 'rain' ? 0.9 : w === 'snow' ? 0.68 : 1);
    BOUNCE_X = Math.min(0.97, B.BOUNCE_X * (w === 'rain' ? 1.06 : w === 'snow' ? 0.85 : 1));
    this.buildSky();
  },

  // ---- PAUSE MENU: resume, team + subs, the moves, options (sound, meter look, team AI), replays, quit
  openPause() {
    this.paused = true; this.say('PAUSED', this.pauseLine(), 9999); this.msg.setVisible(false); this.sub.setVisible(false); SFX.click();   // (the menu says it)
    this.pm = { page: 'main', i: 0 }; this.drawPause();
  },
  closePause() { this.pm = null; this.closeFlowEl(); this.paused = false; this.say('', '', 0.01); this.msg.setVisible(true); this.sub.setVisible(true); },
  pauseItems() {
    const P = this.pm, k = keyset(), H = (this.highlights || []).length, Q = this.squadOf(this.home);
    if (P.page === 'opts') return [
      { k: 'snd', l: `SOUND: ${SFX.muted ? 'OFF' : 'ON'}`, act: () => SFX.toggle() },
      { k: 'meter', l: `SP METER LOOK: ${SP_STYLE.toUpperCase()}`, act: () => setSpStyle(SP_STYLE === 'wild' ? 'basic' : 'wild') },
      { k: 'ai', l: `TEAM AI: ${AI_MODE === 'classic' ? 'CLASSIC (v0.7.6)' : 'NEW'}`, act: () => setAiMode(AI_MODE === 'classic' ? 'new' : 'classic') },
      { k: 'diff', l: `DIFFICULTY: ${(DIFF_OPTS.find(o => o[0] === DIFF_LEVEL) || DIFF_OPTS[1])[1]}${AI_MODE === 'classic' ? ' (NEEDS THE NEW AI)' : ''}`, act: () => setDiff(DIFF_OPTS[(DIFF_OPTS.findIndex(o => o[0] === DIFF_LEVEL) + 1) % DIFF_OPTS.length][0]) },   // v0.9.2
      { k: 'cam', l: `CAMERA: ${(CAM_OPTS.find(o => o[0] === CAM_VIEW) || CAM_OPTS[0])[1]}`, act: () => setCamView(CAM_OPTS[(CAM_OPTS.findIndex(o => o[0] === CAM_VIEW) + 1) % CAM_OPTS.length][0]) },   // camera-pov
      { k: 'pace', l: `PACE: ${(PACE_OPTS.find(o => o[0] === PACE_MODE) || PACE_OPTS[0])[1]}`, act: () => setPace(PACE_OPTS[(PACE_OPTS.findIndex(o => o[0] === PACE_MODE) + 1) % PACE_OPTS.length][0]) },   // t-004 ARCADE PACE
      { k: 'bwon', l: `BUG WATCH: ${BW_ON ? 'ON' : 'OFF'}`, act: () => setBwOn(!BW_ON) },
      { k: 'ptr', l: `POINTER: ${PTR_ON ? 'ON' : 'OFF'}`, act: () => setPtrOn(!PTR_ON) },   // t-009: the direction chevron on the grass
      { k: 'back', l: '◀ BACK', act: () => { P.page = 'main'; P.i = 3; } }];
    const BWn = this.bw ? this.bw.list.length : 0, BWnew = this.bw ? this.bw.list.filter(x => !x.review).length : 0;
    if (P.page === 'moves') return [{ k: 'back', l: '◀ BACK', act: () => { P.page = 'main'; P.i = 2; } }];
    return [
      { k: 'resume', l: 'RESUME', key: 'ENTER', act: () => this.closePause() },
      { k: 'team', l: `TEAM · SUBS (${3 - Q.subs} LEFT)`, act: () => this.openSheet('pause') },
      { k: 'moves', l: 'MOVES', act: () => { P.page = 'moves'; P.i = 0; } },
      { k: 'opts', l: 'OPTIONS', act: () => { P.page = 'opts'; P.i = 0; } },
      ...((this.rec || []).length >= 60 ? [{ k: 'rec', l: 'REPLAY (LAST 10 S)', act: () => this.pauseReplay('rec') }] : []),   // t-006: the replay player on the last 10 seconds
      ...(this.lastReplay ? [{ k: 'last', l: 'LAST GOAL', key: k.lob, act: () => this.pauseReplay('last') }] : []),
      ...(H ? [{ k: 'hl', l: `HIGHLIGHTS (${H})`, key: k.pass, act: () => this.pauseReplay('hl') }] : []),
      ...(this.watch ? this.watchItems() : []),                                    // watch mode: speed, mark this moment
      { k: 'bw', l: `BUG WATCH (${BWn}${BWnew ? ` · ${BWnew} TO CHECK` : ''})`, act: () => this.bwOpen('pause') },
      { k: 'quit', l: P.quit ? 'SURE? PRESS AGAIN TO QUIT' : 'QUIT TO MENU', act: () => { if (P.quit) { this.resumeSave(); try { location.reload(); } catch (e) {} } else P.quit = true; } }];   // (v0.10.2: kept for RESUME on the start screen)
  },
  drawPause() {
    const P = this.pm; if (!P) return; const el = this.flowEl('pause'), items = this.pauseItems(); P.i = clamp(P.i, 0, items.length - 1);
    const k = keyset();
    const moves = P.page !== 'moves' ? '' : `<table class="mv">${[
      [k.move, 'MOVE'], ['SHIFT', 'SPRINT (USES ENERGY)'], [k.pass, 'PASS · CHALLENGE (WITHOUT THE BALL)'], [k.shoot, 'SHOOT, HOLD FOR POWER · SLIDE TACKLE'],
      [k.lob, 'LOB / CROSS · SWITCH PLAYER'], [k.through, 'THROUGH BALL'], [k.special, 'SPECIAL: SPENDS YOUR FULL SP BARS'],
      ['1 BAR', SP_NAMES[0]], ['2 BARS', SP_NAMES[1]], ['3 BARS', SP_NAMES[2]],
      [`${k.ud} + ${k.shoot}`, 'AIM HIGH / LOW'], [`${k.pass} / ${k.shoot}`, 'BALL IN THE AIR: HEADER · VOLLEY · DIVING HEADER'],
      [`SHIFT + ${k.shoot}`, 'HIGH BALL NEAR GOAL: OVERHEAD KICK'], ['T', 'SP METER LOOK'], ['M', 'SOUND ON / OFF'], ['F', 'FLAG A PROBLEM: THE LAST 8 S + YOUR NOTE'], ['ENTER', 'PAUSE']].map(([a, b]) => `<tr><th>${a}</th><td>${b}</td></tr>`).join('')}</table>`;
    el.innerHTML = `<h2>${P.page === 'opts' ? 'OPTIONS' : P.page === 'moves' ? 'THE MOVES' : 'PAUSED'}</h2>
      <div class="sc">${this.home.name} ${this.home.score} - ${this.away.score} ${this.away.name} · ${this.halfLabel()} ${String(Math.floor(this.clock / 60)).padStart(2, '0')}'</div>${moves}
      <div class="menu">${items.map((it, j) => `<button type="button" data-j="${j}" class="${j === P.i ? 'on' : ''}">${it.l}${it.key ? `<kbd>${it.key}</kbd>` : ''}</button>`).join('')}</div>
      <small>&#8593;&#8595; PICK · ENTER: OK · ESC: ${P.page === 'main' ? 'RESUME' : 'BACK'}</small>`;
    el.querySelectorAll('.menu button').forEach(b => b.onclick = () => { P.i = +b.dataset.j; this.pauseAct(); });
  },
  pauseAct() { const P = this.pm, it = this.pauseItems()[P.i]; if (!it) return; if (it.k !== 'quit') P.quit = false; SFX.click(); it.act(); if (this.pm && !this.sheet && !this.replay && !this.bwUI) this.drawPause(); },
  pauseReplay(which) {
    const back = () => { if (this.paused) { this.say('PAUSED', this.pauseLine(), 9999); this.msg.setVisible(false); this.sub.setVisible(false); this.pm = this.pm || { page: 'main', i: 0 }; this.drawPause(); } };
    this.closeFlowEl(); this.msg.setText(''); this.sub.setText(''); this.msg.setVisible(true); this.sub.setVisible(true);
    if (which === 'rec') this.startReplay('REPLAY', back, (this.rec || []).slice(-600).map(f => Object.assign({}, f)), { caption: 'REPLAY \u00b7 THE LAST 10 SECONDS', ctl: true });   // (copies: the match timeline goes on after)
    else if (which === 'last') this.startReplay('LAST GOAL', back, this.lastReplay, { caption: 'LAST GOAL', ctl: true }); else this.playHighlights(back);   // (t-006: in the replay player)
  },
  pauseInput() {
    const P = this.pm; if (!P) { this.pm = { page: 'main', i: 0 }; return this.drawPause(); }
    if (this.sheet) { if (Input.pressed('start') || Input.pressed('pass')) this.closeSheet(); return; }   // team sheet open (subs)
    const esc = Input.taps.has('Escape') || Input.taps.has('KeyP');
    if (esc) { if (P.page === 'main') this.closePause(); else { P.page = 'main'; P.i = 0; this.drawPause(); } return; }
    if (P.page === 'main' && Input.pressed('lob') && this.lastReplay) return this.pauseReplay('last');
    if (P.page === 'main' && Input.pressed('pass') && this.highlights && this.highlights.length) return this.pauseReplay('hl');
    const n = Input.nav(), items = this.pauseItems();
    if (n.y) { P.i = (P.i + n.y + items.length) % items.length; P.quit = false; SFX.click(); this.drawPause(); }
    if (P.page === 'opts' && n.x && items[P.i] && items[P.i].k !== 'back') this.pauseAct();
    if (Input.pressed('start')) this.pauseAct();
  },
  // ---- t-006 INSTA FLAG overlay (the saving + the fixer's wake-up are in replay.js flagSend). The game stops while it's up;
  // the note box takes every key (the game never sees them: typing WASD moves nobody). Works in your matches and watch
  // mode, from the pause menu too; not in the Test Lab, the menus before kick-off, half time or the penalty scene.
  flagCan() {
    return !!(window.HC2_STARTED && this.home && this.bw && !window.__lab && !this.replay && !this.bwUI && !this.pre && !this.setup && !this.sheet
      && !this.ht && !this.intro && !this.toss && !this.cutIn && !this.cupScreen && !this.ceremony && !this.penaltyMode);
  },
  flagOpen() {
    if (this.flagUI || !this.flagCan()) return false;
    this.flagUI = { t: 0, phase: 'edit', pm: !!(this.paused && this.pm) };
    Input.keys.clear(); SFX.click();                                              // (keys held when F went down don't carry on)
    this.msg.setVisible(false); this.sub.setVisible(false);
    const el = this.flowEl('flag');
    if (!document.getElementById('flagcss')) {
      const st = document.createElement('style'); st.id = 'flagcss';
      st.textContent = `#flow .flag{width:min(560px,100%);display:grid;gap:10px;text-align:left}
        #flow .flag .card{background:#1d1a22;border:3px solid #0c0a0e;box-shadow:4px 4px 0 #0c0a0e;padding:10px 12px;display:grid;gap:8px}
        #flow .flag p{margin:0;font-size:9px;line-height:1.9} #flow .flag .hint{color:#28c8e6;font-size:8px}
        #flow .flag textarea{font:10px/1.8 "Press Start 2P",monospace;padding:8px;border:3px solid #0c0a0e;background:#f4f0e4;color:#0c0a0e;width:100%;box-sizing:border-box;min-height:84px;resize:vertical}
        #flow .flag .row{justify-content:flex-start}`;
      document.head.appendChild(st);
    }
    el.innerHTML = `<h2>FLAG A PROBLEM</h2><div class="flag"><div class="card">
        <p>WHAT LOOKS WRONG? SEND KEEPS THE LAST ${FLAG_SECS} SECONDS WITH YOUR NOTE, AND THE FIXER GETS TO WORK.</p>
        <textarea id="flagnote" maxlength="500" placeholder="E.G. THE KEEPER WALKED THROUGH THE POST"></textarea>
        <p class="hint">SPEAK INSTEAD: WIN + H (WINDOWS) / FN FN (MAC) TYPES WHAT YOU SAY</p></div>
      <div class="row"><button type="button" class="go" data-k="send">SEND</button><button type="button" data-k="cancel">CANCEL</button></div></div>
      <small>ENTER: SEND &middot; ESC: CANCEL</small>`;
    const ta = el.querySelector('#flagnote');
    if (ta) {
      ta.addEventListener('keydown', e => {                                       // every key stays in the box (and out of the game)
        e.stopPropagation();
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.flagSubmit(); } else if (e.key === 'Escape') { e.preventDefault(); this.flagClose(); }
      });
      try { ta.focus(); } catch (e) {}
    }
    el.querySelector('[data-k=send]').onclick = () => this.flagSubmit();
    el.querySelector('[data-k=cancel]').onclick = () => this.flagClose();
    return true;
  },
  flagTick(dt) {
    if (!this.flagUI && !this.flagOpen()) return;
    const U = this.flagUI; U.t += dt;
    if (U.phase === 'sent') { U.left -= dt; if (U.left <= 0) this.flagClose(); }
    else if (U.t > 0.2) {                                                         // (the key that opened it doesn't close it again)
      const T = Input.taps;
      if (T.has('Escape') || Input.pressed('flag')) this.flagClose();             // pad BACK again: cancel
      else if (T.has('Enter') || (Input.pressed('start') && !T.has('KeyP'))) this.flagSubmit();   // pad START: send
    }
    this.stadium.update(dt); this.render(dt); this.ramiTick(dt);
  },
  flagSubmit() {
    const U = this.flagUI; if (!U || U.phase !== 'edit') return;
    const ta = document.getElementById('flagnote'), note = ta ? ta.value : '';
    try { U.inc = this.flagSend(note); } catch (e) { CRUMB('flag: not saved ' + e.message); }
    U.phase = 'sent'; U.left = 1.1; SFX.click();
    if (ta) ta.blur();
    const el = this.flowEl('flag');
    el.innerHTML = `<h2>FLAGGED &#10003; &middot; THANKS</h2><small>${U.inc ? 'THE CLIP IS IN BUG WATCH (PAUSE MENU)' : 'COULD NOT KEEP THE CLIP'}</small>`;
  },
  flagClose() {
    const U = this.flagUI; this.flagUI = null; this.closeFlowEl();
    const a = document.activeElement; if (a && a.id === 'flagnote' && a.blur) a.blur();
    if (U && U.pm && this.paused && this.pm) { this.drawPause(); return; }       // (opened from the pause menu: back to it)
    this.msg.setVisible(true); this.sub.setVisible(true);
  },
  // ---- t-006 the replay player's bar (replay.js replayCtl does the work): clickable buttons + a bar you click or drag to
  // jump. Laid out in the game's own pixels on top of the canvas, in the deeper bottom band the player draws.
  rpBarDraw(r) {
    let el = document.getElementById('rpbar');
    if (!el) {
      el = document.createElement('div'); el.id = 'rpbar'; document.body.appendChild(el);
      const st = document.createElement('style'); st.textContent = `#rpbar{position:fixed;z-index:5;width:800px;display:none;flex-direction:column;gap:6px;transform-origin:0 0;
          font:9px "Press Start 2P",monospace;color:#f4f0e4;user-select:none;-webkit-user-select:none}
        #rpbar .tr{position:relative;height:14px;background:#1d1a22;border:2px solid #f4f0e4;cursor:pointer;touch-action:none}
        #rpbar .tr i{position:absolute;left:0;top:0;bottom:0;background:#ff2878;pointer-events:none} #rpbar .tr b{position:absolute;top:-4px;bottom:-4px;width:3px;background:#ffde1e;pointer-events:none}
        #rpbar .bt{display:flex;gap:6px;align-items:center} #rpbar button{font:9px "Press Start 2P",monospace;background:#f4f0e4;color:#0c0a0e;padding:6px 8px;border:2px solid #0c0a0e;box-shadow:2px 2px 0 #ff2878;cursor:pointer}
        #rpbar button.go{background:#ffde1e} #rpbar .tm{margin-left:auto;color:#ffde1e} #rpbar small{font-size:7px;opacity:.8}`;
      el.appendChild(st);
      el.insertAdjacentHTML('beforeend', `<div class="tr"><i></i><b></b></div><div class="bt">
        <button type="button" data-a="restart" title="LOB / R">&#8634; START</button><button type="button" data-a="back" title="LEFT">&#9664; FRAME</button>
        <button type="button" data-a="play" class="go" title="PASS / SPACE">PAUSE</button><button type="button" data-a="fwd" title="RIGHT">FRAME &#9654;</button>
        <button type="button" data-a="speed" title="UP / DOWN">1X</button><button type="button" data-a="exit" title="ENTER / SHOOT">EXIT</button><span class="tm"></span></div>
        <small></small>`);
      const push = a => { const R = this.replay; if (R && R.ctl) R.ctl.q.push(a); };
      el.querySelectorAll('button').forEach(b => b.addEventListener('pointerdown', e => { e.preventDefault(); push(b.dataset.a); }));   // (no focus: ENTER stays the game's)
      const tr = el.querySelector('.tr'), seek = e => { const R = tr.getBoundingClientRect(); push({ seek: (e.clientX - R.left) / Math.max(1, R.width) }); };
      tr.addEventListener('pointerdown', e => { e.preventDefault(); try { tr.setPointerCapture(e.pointerId); } catch (x) {} tr.__drag = true; seek(e); });
      tr.addEventListener('pointermove', e => { if (tr.__drag) seek(e); });
      const up = () => { tr.__drag = false; }; tr.addEventListener('pointerup', up); tr.addEventListener('pointercancel', up);
    }
    const cv = this.game.canvas, R = cv ? cv.getBoundingClientRect() : { left: 0, top: 0, width: VIEW_W }, k = R.width / VIEW_W;
    el.style.display = 'flex'; el.style.left = `${R.left + (VIEW_W / 2 - 400) * k}px`; el.style.top = `${R.top + (VIEW_H - 78) * k}px`; el.style.transform = `scale(${k})`;
    const C = r.ctl, n = r.frames.length, end = r.frames[n - 1].t0 || 1, u = clamp(r.t / end, 0, 1), ky = keyset();
    const s = `${C.play ? 'PAUSE' : C.end ? 'AGAIN' : 'PLAY'}|${RP_SPEEDS[C.sp]}|${r.i}|${n}|${k}`;
    if (el.__s === s) return; el.__s = s;                                            // (only touch the page when something changed)
    el.querySelector('.tr i').style.width = `${(u * 100).toFixed(2)}%`; el.querySelector('.tr b').style.left = `calc(${(u * 100).toFixed(2)}% - 1px)`;
    el.querySelector('[data-a=play]').textContent = C.play ? 'PAUSE' : C.end ? 'AGAIN' : 'PLAY';
    el.querySelector('[data-a=speed]').textContent = `${RP_SPEEDS[C.sp]}X`;
    el.querySelector('.tm').textContent = `${r.t.toFixed(1)} / ${end.toFixed(1)} S · FRAME ${r.i + 1}/${n}`;
    el.querySelector('small').textContent = `${ky.pass}/SPACE PLAY · UP/DOWN SPEED · LEFT/RIGHT FRAME (HOLD: SCRUB) · ${ky.lob}/R START · ENTER/${ky.shoot} EXIT`;
  },
  rpBarHide() { const el = document.getElementById('rpbar'); if (el) { el.style.display = 'none'; el.__s = ''; } },
  // plain code-drawn placeholders (no art): energy bar, pass ring, shot aim arrow + power bar.
  // If you want pixel-art versions, they get made in Aseprite and swapped in.
  drawFeedback() {
    const g = this.power, hp = this.human, b = this.ball, INK = 0x0c0a0e;
    g.clear(); this.ring.clear();
    // v0.8 keeper guard (stand-in look until the final art): a small bar over a keeper who has been rattled by power shots
    if (!this.replay) for (const t of [this.home, this.away]) {
      const gk = t.players[0], gv = gk.guard ?? 1; if (gv > 0.995 || gk.sentOff) continue;
      const kx = Math.round(wx(gk.x, gk.y)), ky = Math.round(wy(gk.y)) - 170, shake = gv < 0.35 ? Math.round(Math.sin(this.time.now / 30)) : 0;
      g.fillStyle(INK, 0.85).fillRect(kx - 22 + shake, ky - 4, 44, 8);
      g.fillStyle(gv < 0.35 ? 0xff2878 : gv < 0.67 ? 0xffde1e : 0xf4f0e4, 1).fillRect(kx - 20 + shake, ky - 2, Math.max(1, Math.round(40 * gv)), 4);
    }
    const X = Math.round(wx(hp.x, hp.y)), Y = Math.round(wy(hp.y));
    // energy bar under the controlled player
    const st = hp.stamina, low = st < 0.3 || hp.tired, blink = hp.tired && Math.floor(this.time.now / 160) % 2;
    g.fillStyle(INK).fillRect(X - 18, Y + 3, 36, 7);
    if (!blink) g.fillStyle(low ? 0xff2878 : 0x28c8e6).fillRect(X - 16, Y + 5, Math.round(32 * st), 3);
    // v0.7.4 pass preview: a thin pulsing ring under the mate a pass would find right now (you see who before you press)
    const pa = this.passAim;
    if (pa && b.owner === hp && this.charge < 0 && !this.lobAim && !this.setPiece && !(this.passRing && this.passRing.t > 0 && this.passRing.p)) {
      const k = 0.5 + 0.25 * Math.sin(this.time.now / 110), cx = Math.round(wx(pa.x, pa.y)), cy = Math.round(wy(pa.y)) - 2;
      this.ring.lineStyle(2, 0x28c8e6, k).strokeEllipse(cx, cy, 38, 14);
      this.ring.fillStyle(0x28c8e6, k).fillTriangle(cx - 7, cy - 172, cx + 7, cy - 172, cx, cy - 162);
      const cam = this.cameras.main, V = cam.worldView, ty = cy - 70;
      if (!V.contains(cx, ty)) {                                                 // off screen: an arrow on the edge points at him
        const mg = 34 / cam.zoom, ex = clamp(cx, V.x + mg, V.right - mg), ey = clamp(ty, V.y + 168 / cam.zoom, V.bottom - 95 / cam.zoom);   // clear of the score box, meters, Rami + radar
        const an = Math.atan2(ty - ey, cx - ex), s = 13 / cam.zoom, c = Math.cos(an), sn = Math.sin(an);
        const tri = (r, col, al) => g.fillStyle(col, al).fillTriangle(ex + c * r * 1.7, ey + sn * r * 1.7, ex - c * r * 0.8 - sn * r * 0.75, ey - sn * r * 0.8 + c * r * 0.75, ex - c * r * 0.8 + sn * r * 0.75, ey - sn * r * 0.8 - c * r * 0.75);
        tri(s + 4 / cam.zoom, INK, 0.9); tri(s, 0x28c8e6, 0.6 + 0.4 * k);
      }
    }
    // ring under the player the pass is going to
    if (this.passRing && this.passRing.p) {
      const q = this.passRing.p, a = clamp(this.passRing.t, 0, 1);
      this.ring.lineStyle(3, 0x28c8e6, a).strokeEllipse(Math.round(wx(q.x, q.y)), Math.round(wy(q.y)) - 2, 46, 18);
    }
    // t-005 (lob step 1): every lofted ball - lob, power lob, chip, either side's - keeps its ring on the grass where it
    // comes down (the real predicted landing, ball.js ringSpot) until someone touches it; it showed only while you charged
    const LR = !this.replay && this.ringSpot();
    if (LR) { const rx = Math.round(wx(LR.x, LR.y)), ry = Math.round(wy(LR.y)) - 2, col = LR.chip ? 0xff2878 : 0x28c8e6;
      this.ring.lineStyle(5, INK, 0.75).strokeEllipse(rx, ry, 44, 17).lineStyle(3, col, 0.95).strokeEllipse(rx, ry, 44, 17).fillStyle(col, 0.95).fillRect(rx - 1, ry - 1, 3, 3); }
    if (!this.replay) { this.drawLobAim(g, INK); this.drawAerial(g, INK); }      // t-008: the hold-to-aim ring, the AERIAL BATTLE
    // set piece (yours): aim cursor on the pitch + a line from the ball
    const sp = this.setPiece;
    if (sp && !sp.kicked && sp.team === this.home && this.aimPt) {
      const A = this.aimPt, ax = Math.round(wx(A.x, A.y)), ay = Math.round(wy(A.y)), bx = wx(b.x, b.y), by = wy(b.y) - 6;
      g.lineStyle(5, INK, 0.9).lineBetween(bx, by, ax, ay).lineStyle(2, 0xffde1e, 1).lineBetween(bx, by, ax, ay);
      g.lineStyle(5, INK).strokeEllipse(ax, ay, 40, 16).lineStyle(3, 0xffde1e).strokeEllipse(ax, ay, 40, 16);
      g.fillStyle(0xffde1e).fillRect(ax - 1, ay - 1, 3, 3);
      // v0.8 (Luca: see who you can pass to at free kicks / corners): a faint marker over every team-mate,
      // the ring + arrow on the one the ball would find (nearest the cursor)
      const tgt = this.spTarget(), k = 0.5 + 0.25 * Math.sin(this.time.now / 110);
      for (const q of sp.team.players) {
        if (q === sp.taker || q.sentOff || q.keeper) continue;
        const qx = Math.round(wx(q.x, q.y)), qy = Math.round(wy(q.y)) - 2;
        if (q === tgt) { const bob = Math.round(3 * Math.sin(this.time.now / 140)); this.ring.lineStyle(3, 0x28c8e6, 0.5 + k).strokeEllipse(qx, qy, 44, 17);
          g.fillStyle(INK, 0.9).fillTriangle(qx - 11, qy - 176 + bob, qx + 11, qy - 176 + bob, qx, qy - 157 + bob).fillStyle(0x28c8e6, 1).fillTriangle(qx - 8, qy - 174 + bob, qx + 8, qy - 174 + bob, qx, qy - 160 + bob); }
        else g.fillStyle(INK, 0.55).fillTriangle(qx - 7, qy - 172, qx + 7, qy - 172, qx, qy - 162).fillStyle(0x28c8e6, 0.6).fillTriangle(qx - 5, qy - 171, qx + 5, qy - 171, qx, qy - 164);
      }
      if (this.charge >= 0) { const px = X - 30, py = Y + 13; g.fillStyle(INK).fillRect(px - 2, py - 2, 64, 12).fillStyle(0xffde1e).fillRect(px, py, Math.round(60 * this.charge), 8); }
      return;
    }
    this.drawPointer(INK);
    // v0.8.6 SPECIAL pop-up (aerial special ready): the I is the RISE arrow
    if (this.airSp && this.textures.exists('coin')) {
      if (!this.airUi) { const F = '"Press Start 2P"', st = { fontFamily: F, fontSize: '13px', color: '#ffde1e', stroke: '#0c0a0e', strokeThickness: 5 };
        this.airUi = { a: this.add.text(0, 0, 'SPEC', st).setOrigin(1, 0.5).setDepth(8.5e6), i: this.add.image(0, 0, 'coin', 'rise-arrow').setOrigin(0.5).setDepth(8.5e6), b: this.add.text(0, 0, 'AL', st).setOrigin(0, 0.5).setDepth(8.5e6),
          k: this.add.text(0, 0, '', { fontFamily: F, fontSize: '8px', color: '#0c0a0e', backgroundColor: '#ffde1e', padding: { x: 4, y: 3 } }).setOrigin(0.5, 0).setDepth(8.5e6) }; }
      const U = this.airUi, s2 = 1 + 0.12 * Math.sin(this.time.now / 70), ux = Math.round(wx(hp.x, hp.y)), uy = Math.round(wy(hp.y)) - 150;
      U.i.setPosition(ux, uy).setScale(0.55 * s2).setVisible(true); U.a.setPosition(ux - 7, uy).setScale(s2).setVisible(true); U.b.setPosition(ux + 7, uy).setScale(s2).setVisible(true);
      U.k.setText(`PRESS ${keyset().special}`).setPosition(ux, uy + 16).setVisible(true);
    } else if (this.airUi) for (const k in this.airUi) this.airUi[k].setVisible(false);
    // v0.8.5 power lob: where it will land (a ring that walks out as you hold) + a cyan power bar
    if (this.lobCharge >= 0 && b.owner === hp) {
      // t-005 (lob step 1): the arc is the ball's real path (lobPreview: the launch the release will use, flown with the
      // game's ball physics) and the ring sits where that path comes down - the arc was a fixed sine, the ring the aim point
      const L = this.lobSpot(hp), V = this.lobPreview(hp, L, this.lobCharge), E = L.chip ? L : V.end, lx = Math.round(wx(E.x, E.y)), ly = Math.round(wy(E.y)) - 2;
      const arc = (w, col, a) => { g.lineStyle(w, col, a); g.beginPath(); V.pts.forEach((q, i) => { const x = wx(q.x, q.y), y = wy(q.y, q.z) - 6; if (i) g.lineTo(x, y); else g.moveTo(x, y); }); g.strokePath(); };
      arc(4, INK, 0.7); arc(2, L.chip ? 0xff2878 : 0x28c8e6, 0.95);
      g.lineStyle(5, INK).strokeEllipse(lx, ly, 44, 17).lineStyle(3, L.chip ? 0xff2878 : 0x28c8e6).strokeEllipse(lx, ly, 44, 17);   // (pink ring: it's a CHIP)
      const px = X - 30, py = Y + 13; g.fillStyle(INK).fillRect(px - 2, py - 2, 64, 12).fillStyle(0x28c8e6).fillRect(px, py, Math.round(60 * this.lobCharge), 8);
    }
    // shooting: aim arrow from the ball towards the chosen spot in the goal + power bar with zones
    if (this.charge >= 0 && b.owner === hp) {
      const c = this.charge, gx = hp.team.goalX, ty = 34 + this.aimY * 2.8;
      const bx = wx(b.x, b.y), by = wy(b.y) - 12, tx = wx(gx, ty), tyS = wy(ty, 1.0);
      let dx = tx - bx, dy = tyS - by; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
      const L = 34 + 96 * c, ex = bx + dx * L, ey = by + dy * L, col = c > 0.9 ? 0xff2878 : 0xffde1e;
      const head = (s, colr) => g.fillStyle(colr).fillTriangle(ex + dx * s * 1.6, ey + dy * s * 1.6, ex - dy * s, ey + dx * s, ex + dy * s, ey - dx * s);
      g.lineStyle(7, INK).lineBetween(bx, by, ex, ey); head(10, INK);
      g.lineStyle(3, col).lineBetween(bx, by, ex, ey); head(7, col);
      const px = X - 30, py = Y + 13;
      g.fillStyle(INK).fillRect(px - 2, py - 2, 64, 12);
      g.fillStyle(0x3e0c0a).fillRect(px + 54, py, 6, 8);                             // over-hit zone
      g.fillStyle(col).fillRect(px, py, Math.round(60 * c), 8);
      g.fillStyle(0xf4f0e4).fillRect(px + 33, py - 2, 1, 12).fillRect(px + 51, py - 2, 1, 12);   // sweet spot 0.55-0.85
    }
  },
  // t-008 HOLD LOB TO AIM: the landing ring you walk with the stick (pulsing; solid once it has settled on a team-mate,
  // with the marker over him), the ball's real arc to it (ball.js aimPreview), and from the release until the ball is
  // off the boot the same ring stays (then the lofted ball's own landing ring, ringSpot, takes over)
  drawLobAim(g, INK) {
    const A = this.lobAim, hp = this.human, b = this.ball, CY = 0x28c8e6;
    const ring = (x, y, a, w = 44, h = 17) => { const rx = Math.round(wx(x, y)), ry = Math.round(wy(y)) - 2;
      this.ring.lineStyle(5, INK, 0.8 * a).strokeEllipse(rx, ry, w, h).lineStyle(3, CY, a).strokeEllipse(rx, ry, w, h).fillStyle(CY, a).fillRect(rx - 1, ry - 1, 3, 3); return { rx, ry }; };
    if (A && b.owner === hp) {
      const k = 0.75 + 0.25 * Math.sin(this.time.now / 90), V = this.aimPreview(hp, A.x, A.y);
      const arc = (w, col, a) => { g.lineStyle(w, col, a); g.beginPath(); V.pts.forEach((q, i) => { const x = wx(q.x, q.y), y = wy(q.y, q.z) - 6; if (i) g.lineTo(x, y); else g.moveTo(x, y); }); g.strokePath(); };
      if (A.t >= LOB2.tapT * 0.5) { arc(4, INK, 0.6); arc(2, CY, 0.9); }       // (not on a quick tap: no flash of an arc)
      const R = ring(A.x, A.y, A.q ? 1 : k, A.q ? 50 : 44, A.q ? 19 : 17);
      if (A.q) { const q = A.q, qx = Math.round(wx(q.x, q.y)), qy = Math.round(wy(q.y)) - 2, bob = Math.round(3 * Math.sin(this.time.now / 140));
        g.fillStyle(INK, 0.9).fillTriangle(qx - 11, qy - 176 + bob, qx + 11, qy - 176 + bob, qx, qy - 157 + bob).fillStyle(CY, 1).fillTriangle(qx - 8, qy - 174 + bob, qx + 8, qy - 174 + bob, qx, qy - 160 + bob); }
      else if (len(A.rx - A.x, A.ry - A.y) > 0.3) ring(A.rx, A.ry, 0.35, 20, 8);
      return;
    }
    const P = this.pending, L = this.lobAimLast;
    if (P && P.info.aim && L && P.p === L.by) ring(L.x, L.y, 1);
  },
  // t-008 THE AERIAL BATTLE on screen: MASH! (PRESS! for the defending side), the key to hit, a tug-of-war bar in the two
  // teams' colours over the pair (live: who's winning), sparks and impacts off the ball from the fx atlas (aerialPop)
  drawAerial(g, INK) {
    const A = this.aerial;
    if (!A) { if (this.aerUi) for (const k in this.aerUi) this.aerUi[k].setVisible(false); return; }
    if (!this.aerUi) { const F = '"Press Start 2P"';
      this.aerUi = { t: this.add.text(0, 0, 'MASH!', { fontFamily: F, fontSize: '26px', color: '#ffde1e', stroke: '#0c0a0e', strokeThickness: 7 }).setOrigin(0.5).setDepth(8.6e6),
        k: this.add.text(0, 0, '', { fontFamily: F, fontSize: '9px', color: '#0c0a0e', backgroundColor: '#ffde1e', padding: { x: 5, y: 4 } }).setOrigin(0.5, 0).setDepth(8.6e6) }; }
    const U = this.aerUi, D = A.D, cx = Math.round(wx(D.x, D.y)), cy = Math.round(wy(D.y)) - 205, mine = !this.demo && (A.att.p === this.human || A.def.p === this.human);
    const intro = A.phase === 'intro', s = intro ? 0.3 + 0.7 * clamp(A.t / AERIAL.introT, 0, 1) : 1 + 0.1 * Math.sin(this.time.now / 45) + (A.pulse = Math.max(0, (A.pulse || 0) - 0.06));
    const word = A.phase === 'done' ? (A.res === 'att' ? 'WON IT!' : 'CLEARED!') : mine && A.def.p === this.human ? 'PRESS!' : 'MASH!';
    U.t.setText(word).setPosition(cx, cy - 34).setScale(s).setAngle(intro ? 0 : Math.sin(this.time.now / 60) * 3).setVisible(true);
    U.k.setText(mine && A.phase !== 'done' ? `${keyset().shoot}  ${keyset().shoot}  ${keyset().shoot}` : '').setPosition(cx, cy + 14).setVisible(mine && A.phase !== 'done');
    const sa = this.aerialScore(A.att), sd = this.aerialScore(A.def), sh = A.share = A.share == null ? 0.5 : A.share + (sa / (sa + sd) - A.share) * 0.25;
    const W = 150, x0 = cx - W / 2, y0 = cy, ca = TEAM_COL[A.att.p.team.name] ?? 0x28c8e6, cd = TEAM_COL[A.def.p.team.name] ?? 0xff2878, mx = Math.round(x0 + W * sh);
    g.fillStyle(INK, 0.9).fillRect(x0 - 3, y0 - 3, W + 6, 14).fillStyle(ca, 1).fillRect(x0, y0, mx - x0, 8).fillStyle(cd, 1).fillRect(mx, y0, x0 + W - mx, 8);
    g.fillStyle(0xf4f0e4, 1).fillRect(mx - 2, y0 - 6, 4, 20).fillStyle(INK, 1).fillRect(cx, y0 - 3, 1, 14);   // the marker, and the middle
  },
  // a press in the battle: sparks off the ball, an impact for every third (the PixelLab fx atlas)
  aerialPop(att) {
    const A = this.aerial; if (!A || !this.textures.exists('fx') || !this.cameras.main.visible) return; A.pulse = 0.25;
    const n = (att ? A.att : A.def).n, j = (n * 37 + (att ? 0 : 11)) % 21 - 10;  // (a jitter from the press count: no dice here, so a replay or a headless run plays the same)
    const b = this.ball, X = wx(b.x, b.y) + j + (att ? -6 : 6), Y = wy(b.y) - 10 - b.z * PX_H + ((n * 13) % 17 - 8);
    const pop = (name, s0, s1, ms, a = 1) => { const im = this.add.image(X, Y, 'fx', name).setScale(s0).setAlpha(a).setDepth(wy(b.y) + 3).setAngle((n * 67) % 360);
      this.tweens.add({ targets: im, scale: s1, alpha: 0, duration: ms, ease: 'Cubic.easeOut', onComplete: () => im.destroy() }); };
    pop('sparks', 0.5, 1.5, 260, 0.95); if (n % 3 === 0) pop(n % 6 === 0 ? 'impactBig' : 'impact', 0.4, 1.0, 180, 0.8); if (n % 4 === 0) pop('sparkle', 0.5, 1.2, 300, 0.8);
  },
  // t-009 the "you" arrow over the man you control (was one line in world.js: 1x size, a 2 px sine bob, always blue).
  // Bigger, a bouncier bob, a pop when control moves to a new man, the red or blue cursor picked against your kit, and
  // lifted over a ball that's above his head (it sat on top of headers and lobs dropping to him). Drawing only.
  drawCursor() {
    const hp = this.human, b = this.ball, t = this.time.now, X = Math.round(wx(hp.x, hp.y)), Y = Math.round(wy(hp.y));
    const dt = clamp((t - (this.curT ?? t)) / 1000, 0, 0.1); this.curT = t;
    const kit = this.home && this.home.name;
    if (kit !== this.curKit) { this.curKit = kit; const key = curColFor(TEAM_COL[kit]);   // once per match: the kits are fixed
      if (this.textures.exists(key)) { this.cursorImg.setTexture(key); for (const o of this.cursorInk) o.setTexture(key); } }
    if (hp !== this.curFor) { if (this.curFor) this.curPop = t; this.curFor = hp; }      // (not on the first man of the match)
    const since = (t - (this.curPop ?? -1e9)) / 1000, k = since < CUR_POP ? 1 - since / CUR_POP : 0;
    const pop = 1 + 0.45 * k * k, drop = Math.round(-16 * k * k);                        // it lands on him bigger, from a little above
    const bob = Math.abs(Math.sin(t / 170)) * 6;                                        // a bounce, not the old 2 px wobble
    let top = Y - 112;                                                                  // just over his head
    const bx = wx(b.x, b.y), by = wy(b.y, b.z);
    const lift = b.z > 1.4 && Math.abs(bx - X) < 34 && by < top + 24 ? Math.min(0, by - 16 - top) : 0;   // the ball over his head: go above it
    this.curLift = (this.curLift || 0) + (lift - (this.curLift || 0)) * Math.min(1, dt * 16);
    this.cursor.setPosition(X, Math.round(top + this.curLift - bob + drop)).setScale(CUR_SCALE * pop).setAlpha(this.demo ? 0 : 1);
  },
  // t-009 (Luca: "a lowkey but useful pointing arrow that shows direction"): a thin chevron on the grass in front of your
  // man, only while you push, pointing where you push - with the ball that's where a pass / shot goes (actions.js uses
  // the stick as the pass direction). Drawn in metres, so it lies flat on the pitch. Same style as the other code-drawn
  // markers here (ink edge + one light colour, semi-transparent); a pixel-art one would come from Aseprite / PixelLab.
  // Not in replays, cut scenes, set pieces (the aim cursor shows there), the demo or watch mode, or with POINTER: OFF.
  drawPointer(INK) {
    const hp = this.human, ax = Input.axis, l = len(ax.x, ax.y);
    if (!PTR_ON || l < 0.1 || this.replay || this.demo || this.watch || this.cutIn || this.intro || this.toss || this.paused || this.pre || this.over
      || this.ht || this.penaltyMode || this.ceremony || (this.setPiece && !this.setPiece.kicked) || this.charge >= 0 || this.lobCharge >= 0
      || !this.cursor.visible || hp.sentOff) { this.ptrShown = null; return; }
    const dx = ax.x / l, dy = ax.y / l, nx = -dy, ny = dx, d = 1.9 + 0.12 * Math.sin(this.time.now / 160);   // (a slow nudge forward)
    const P = (f, s) => { const x = hp.x + dx * (d + f) + nx * s, y = hp.y + dy * (d + f) + ny * s; return [wx(x, y), wy(y)]; };
    const [ax1, ay1] = P(-0.7, -0.5), [tx, ty] = P(0, 0), [ax2, ay2] = P(-0.7, 0.5);
    const chev = (w, col, a) => { this.ring.lineStyle(w, col, a); this.ring.beginPath(); this.ring.moveTo(ax1, ay1); this.ring.lineTo(tx, ty); this.ring.lineTo(ax2, ay2); this.ring.strokePath(); };
    chev(6, INK, 0.55); chev(3, 0xf4f0e4, 0.85);
    this.ptrShown = { dx, dy };                                                         // (for tools/pointertest.js)
  },
  drawRadar() {
    const g = this.radar, W = 168, H = 108, x0 = VIEW_W - W - 16, y0 = window.HC2_TOUCH ? 62 : VIEW_H - H - 16;   // touch: top right, under the away SP meter (the buttons sit bottom right)
    g.clear().fillStyle(0x0c0a0e, 0.72).fillRect(x0 - 4, y0 - 4, W + 8, H + 8).lineStyle(1, 0xf4f0e4, 0.8).strokeRect(x0, y0, W, H)
      .lineBetween(x0 + W / 2, y0, x0 + W / 2, y0 + H).strokeCircle(x0 + W / 2, y0 + H / 2, 14);
    const sx = x => x0 + x / PITCH_L * W, sy = y => y0 + y / PITCH_W * H;
    for (const p of this.all) {
      if (p.sentOff) continue;
      g.fillStyle(TEAM_COL[p.team.name]).fillRect(Math.round(sx(p.x)) - 2, Math.round(sy(p.y)) - 2, 4, 4);
    }
    const hp = this.human; g.lineStyle(1, 0x28c8e6).strokeRect(Math.round(sx(hp.x)) - 4, Math.round(sy(hp.y)) - 4, 8, 8);
    { const bx = sx(this.ball.x), by = sy(this.ball.y), pulse = 5 + 2 * Math.abs(Math.sin(this.time.now / 260));   // v0.8.5: a ball that stands out from every kit
      g.fillStyle(0x0c0a0e).fillCircle(bx, by, 4.5).fillStyle(0xffffff).fillCircle(bx, by, 3).lineStyle(2, 0xff2878, 0.9).strokeCircle(bx, by, pulse); }
  },
});

// ---------------------------------------------------------------- camera distance
// friend/camera-pov (co-designer: three camera distances to pick from; CLOSE is the v0.9.4 view and stays the default).
// Only the zoom changes: the stadium is one pre-projected painting seen from the main stand, so a new ANGLE would need
// all-new art. MEDIUM 0.75 / WIDE 0.5 (not 0.8 / 0.65) so the pixel art shrinks by even steps and the lines stay clean.
const CAM_OPTS = [['close', 'CLOSE', 1], ['medium', 'MEDIUM', 0.75], ['wide', 'WIDE', 0.5]];
let CAM_VIEW = (() => { try { const v = localStorage.getItem('hc2-cam'); return CAM_OPTS.some(o => o[0] === v) ? v : 'close'; } catch (e) { return 'close'; } })();
function setCamView(v) { if (!CAM_OPTS.some(o => o[0] === v)) return; CAM_VIEW = v; try { localStorage.setItem('hc2-cam', v); } catch (e) {} }
// t-009 the "you" arrow and the direction pointer
const CUR_SCALE = 3, CUR_INK = 0.67, CUR_POP = 0.3;   // size (x the 13 px E6 art: 39 px); ink outline: 2 screen px out; pop on a switch (s)
// the cursor that stands out from your kit: red on a blue-ish kit, blue on red / pink / yellow / white ones (the old
// look). Green kits get red (it pops more on the grass too). By hue, from the kit's radar colour.
function curColFor(col) {
  if (col == null) return 'HC2-E6-cursor-blue';
  const r = (col >> 16 & 255) / 255, g = (col >> 8 & 255) / 255, b = (col & 255) / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), c = mx - mn;
  if (!mx || c / mx < 0.25) return 'HC2-E6-cursor-blue';                                                 // white / grey / black kit
  const h = (mx === r ? ((g - b) / c + 6) % 6 : mx === g ? (b - r) / c + 2 : (r - g) / c + 4) * 60;
  const far = (a, z) => { const v = Math.abs(a - z) % 360; return Math.min(v, 360 - v); };
  return far(h, 213) < far(h, 358) ? 'HC2-E6-cursor-red' : 'HC2-E6-cursor-blue';                         // the cursor whose hue is further off
}
let PTR_ON = (() => { try { return localStorage.getItem('hc2-ptr') !== 'off'; } catch (e) { return true; } })();
function setPtrOn(v) { PTR_ON = !!v; try { localStorage.setItem('hc2-ptr', v ? 'on' : 'off'); } catch (e) {} }
function camZoom() { return (CAM_OPTS.find(o => o[0] === CAM_VIEW) || CAM_OPTS[0])[2]; }
