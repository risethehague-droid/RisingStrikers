'use strict';
// HC2 Football · sphelp.js: the SET-PIECE HELP panel (Luca, 1 Nov 2026: "create a help display in the corner which
// tells you which buttons to press for a set piece for different things like in fifa").
//
// How the reference games do it: FIFA / EA FC puts a small controls box on screen at every dead ball (corner, free
// kick, penalty, throw-in, goal kick) with the button icon and one word per option, and it goes the moment the ball
// is kicked; PES / eFootball does the same in a corner of the screen. Real football has nothing like it, of course,
// but the options are the real ones: a corner is in-swung, out-swung, driven or played short (most Premier League
// corners are in-swingers); a free kick near goal is a shot, else a cross or a short one; a throw goes to a man.
//
// So: while YOUR set piece waits to be taken, a panel on the right, above the radar, lists only that set piece's
// buttons (key caps in the game's yellow, one plain line each, a little curve drawn for the swung balls). It slides in,
// lights the row you are about to play (a free kick aimed at goal: SHOOT; X held: its charge fills), flashes the row
// you pressed and slides out. H hides / shows it (remembered in this browser). Off on the phone layout (its buttons are
// on screen already), in the demo, replays, the pause menu and the penalty scene (which has its own hint box).
//
// Lines live in SP_HELP below: a new set-piece option = one row { id, key, txt, when?, glyph? }. `key` names an action
// in KEYSETS (pass / shoot / lob / through / move), so WASD players see J / K / L / I. Corners show the in- / out-swinger
// and driven rows only when the curled set pieces (SP_CURL, PR #105) are in this build; without them C is a plain cross.
// Loaded after ui.js; it wraps Match.render (draw) and Match.spKick (the flash), nothing else.

const SP_HELP_ON = { key: 'hc2-sphelp' };
const spCurlOn = () => typeof SP_CURL !== 'undefined' && SP_CURL.on;
const SP_HELP = {
  CORNER: [
    { id: 'move', key: 'move', txt: 'AIM' },
    { id: 'in', key: 'lob', txt: () => spCurlOn() ? 'IN-SWINGER' : 'CROSS', glyph: () => spCurlOn() ? 'in' : 'lob' },
    { id: 'out', key: 'through', txt: 'OUT-SWINGER', when: spCurlOn, glyph: 'out' },
    { id: 'driven', key: 'shoot', hold: true, txt: () => spCurlOn() ? 'DRIVEN LOW' : 'HIT IT', glyph: 'driven' },
    { id: 'short', key: 'pass', txt: 'SHORT PASS', glyph: 'ground' },
  ],
  'FREE KICK': [
    { id: 'move', key: 'move', txt: 'AIM' },
    { id: 'shot', key: 'shoot', hold: true, txt: s => s.atGoal ? 'SHOOT' : (spCurlOn() ? 'DRIVEN BALL' : 'LONG BALL'), sub: 'AIM AT GOAL = SHOT', glyph: s => s.atGoal ? 'shot' : 'driven' },
    { id: 'in', key: 'lob', txt: () => spCurlOn() ? 'IN-SWING CROSS' : 'CROSS', glyph: () => spCurlOn() ? 'in' : 'lob' },
    { id: 'out', key: 'through', txt: 'OUT-SWING CROSS', when: spCurlOn, glyph: 'out' },
    { id: 'short', key: 'pass', txt: 'SHORT PASS', glyph: 'ground' },
  ],
  PENALTY: [
    { id: 'move', key: 'move', txt: 'PICK A SIDE' },
    { id: 'shot', key: 'shoot', hold: true, txt: 'SHOOT', sub: 'LET GO = KICK', glyph: 'shot' },
  ],
  'THROW-IN': [
    { id: 'move', key: 'move', txt: 'AIM' },
    { id: 'throw', key: 'pass', txt: 'THROW IT', sub: 'C / X TOO', glyph: 'lob' },
  ],
  'GOAL KICK': [
    { id: 'move', key: 'move', txt: 'WALK / AIM' },
    { id: 'short', key: 'pass', txt: 'THROW OUT', glyph: 'ground' },
    { id: 'punt', key: 'lob', txt: 'KICK LONG', sub: 'HOLD = AIM IT', glyph: 'lob' },
  ],
};
// which row a kick was (spKick's mode + swing)
const spHelpRowOf = (kind, mode, swing) => kind === 'THROW-IN' ? 'throw' : mode === 'shot' ? 'shot' : mode === 'ground' ? 'short'
  : swing === 'in' ? 'in' : swing === 'out' ? 'out' : swing === 'driven' ? (kind === 'FREE KICK' ? 'shot' : 'driven') : 'in';

const _sphRender = Match.prototype.render, _sphKick = Match.prototype.spKick;
hc2Mix(Match, {
  render(dt) {
    _sphRender.call(this, dt);
    this.spHelpTick(dt);
  },
  spKick(mode, power, swing) {
    const sp = this.setPiece, H = this.sph;
    if (sp && H && H.kind === sp.kind) { H.flash = spHelpRowOf(sp.kind, mode, swing); H.flashT = 0.55; }
    return _sphKick.call(this, mode, power, swing);
  },
  spHelpHidden() {
    if (this._sphHide == null) { try { this._sphHide = localStorage.getItem(SP_HELP_ON.key) === '0'; } catch (e) { this._sphHide = false; } }
    return this._sphHide;
  },
  spHelpToggle() {
    this._sphHide = !this.spHelpHidden(); try { localStorage.setItem(SP_HELP_ON.key, this._sphHide ? '0' : '1'); } catch (e) {}
    if (this.say) this.say('', this._sphHide ? 'SET-PIECE HELP OFF · H' : 'SET-PIECE HELP ON · H', 0.9);
  },
  // what to show now: { kind, st } or null
  spHelpWhat() {
    if (window.HC2_TOUCH || this.demo || this.replay || this.paused || this.penaltyMode || this.over || this.intro || this.cupScreen) return null;
    const sp = this.setPiece;
    if (sp && !sp.kicked && SP_HELP[sp.kind] && this.hasHuman(sp.team)) {
      const st = { setup: !!sp.su, atGoal: false };
      if (!sp.su && this.aimPt) { const A = this.aimPt, gx = sp.team.goalX; st.atGoal = Math.abs(A.x - gx) < 3 && Math.abs(A.y - 34) < 5; }
      const S = this.slot(sp.team) || this; st.charge = !sp.su && S.charge >= 0 ? S.charge : -1;
      return { kind: sp.kind, st };
    }
    const b = this.ball, k = b && b.owner;                                       // a goal kick: the keeper has it in his hands (goalKick)
    if (!sp && k && k.keeper && k.hands && this.gkSetup && this.time.now - this.gkSetup.t0 < (this.gkSetup.T + 6) * 1000 && this.hasHuman(k.team) && this.isHuman(k))
      return { kind: 'GOAL KICK', st: { charge: this.lobCharge >= 0 ? Math.min(1, this.lobCharge) : -1 } };
    return null;
  },
  spHelpBuild() {
    const F = '"Press Start 2P"', c = this.add.container(0, 0);
    const g = this.add.graphics(), tab = this.add.text(0, 0, '', { fontFamily: F, fontSize: '9px', color: '#0c0a0e', backgroundColor: '#ffde1e', padding: { x: 6, y: 4 } }).setOrigin(0, 1);
    const foot = this.add.text(0, 0, '', { fontFamily: F, fontSize: '7px', color: '#8f8a80' });
    const rows = [];
    for (let i = 0; i < 6; i++) rows.push({
      cap: this.add.text(0, 0, '', { fontFamily: F, fontSize: '9px', color: '#0c0a0e' }).setOrigin(0.5),
      txt: this.add.text(0, 0, '', { fontFamily: F, fontSize: '9px', color: '#f4f0e4' }).setOrigin(0, 0.5),
      sub: this.add.text(0, 0, '', { fontFamily: F, fontSize: '7px', color: '#28c8e6' }).setOrigin(0, 0.5) });
    c.add([g, tab, foot, ...rows.flatMap(r => [r.cap, r.txt, r.sub])]);
    this.hud.add(c);                                                              // (inside the HUD: it stays put while the camera zooms - replay.js fixUi)
    this.sph = { c, g, tab, foot, rows, a: 0, kind: null, flash: null, flashT: 0, t: 0 };
    addEventListener('keydown', e => { if (e.code === 'KeyH' && !e.repeat && !(e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) && window.__hc2 === this) this.spHelpToggle(); });
  },
  spHelpTick(dt) {
    if (!this.hud) return;
    if (!this.sph) this.spHelpBuild();
    const H = this.sph, w = this.spHelpWhat(), hide = this.spHelpHidden();
    H.flashT = Math.max(0, H.flashT - dt);
    if (w && !hide) { if (H.kind !== w.kind) { H.kind = w.kind; H.a = 0; H.t = 0; } H.st = w.st; }
    const show = (w && !hide) || H.flashT > 0;                                   // (after the kick it stays a beat, its row lit)
    H.a = clamp(H.a + (show ? dt / 0.18 : -dt / 0.22), 0, 1); H.t += dt;
    if (H.a <= 0) { H.c.setVisible(false); if (!w) H.kind = null; return; }
    this.spHelpDraw(H);
  },
  spHelpDraw(H) {
    const k = keyset(), st = H.st || {}, val = (v, d) => typeof v === 'function' ? v(st) : (v ?? d);
    const list = (SP_HELP[H.kind] || []).filter(r => !r.when || r.when());
    const W = 236, RH = 26, top = 30, ph = top + list.length * RH + 22;
    const ease = 1 - Math.pow(1 - H.a, 3), x0 = VIEW_W - 16 - W + Math.round((1 - ease) * (W + 24)), yB = VIEW_H - 108 - 16 - 12, y0 = yB - ph;
    const g = H.g.clear();
    g.fillStyle(0x0c0a0e, 0.9).fillRect(x0, y0, W, ph).lineStyle(2, 0xf4f0e4).strokeRect(x0, y0, W, ph);
    H.tab.setText(H.kind + (st.setup ? ' · GET READY' : '')).setPosition(x0 + 8, y0 + 2 + 18);
    H.rows.forEach((R, i) => {
      const r = list[i]; const on = !!r; R.cap.setVisible(on); R.txt.setVisible(on); R.sub.setVisible(on); if (!on) return;
      const cy = y0 + top + i * RH + RH / 2, label = r.key === 'move' ? k.move : k[r.key];
      const lit = H.flash === r.id && H.flashT > 0, hot = !lit && r.id === 'shot' && H.kind === 'FREE KICK' && st.atGoal;
      const cw = Math.max(22, label.length * 9 + 10), cx = x0 + 12;
      if (lit || hot) g.fillStyle(lit ? 0xffde1e : 0x28c8e6, lit ? 0.35 + 0.4 * Math.abs(Math.sin(H.flashT * 18)) : 0.18).fillRect(x0 + 4, cy - RH / 2 + 2, W - 8, RH - 4);
      g.fillStyle(r.key === 'move' ? 0xf4f0e4 : 0xffde1e).fillRect(cx, cy - 10, cw, 20).fillStyle(0x0c0a0e, 0.35).fillRect(cx, cy + 7, cw, 3);   // (the key cap's lip)
      R.cap.setText(label).setFontSize(label.length > 3 ? '7px' : '9px').setPosition(cx + cw / 2, cy - 1);
      const tx = cx + cw + 10, sub = r.sub ? val(r.sub) : (r.hold ? 'HOLD' : '');
      R.txt.setText(val(r.txt, '')).setPosition(tx, sub ? cy - 5 : cy).setColor(lit ? '#ffde1e' : '#f4f0e4');
      R.sub.setText(sub).setPosition(tx, cy + 7);
      if (r.hold && st.charge >= 0 && (r.id === 'shot' || r.id === 'driven')) {   // X held: its charge fills under the row
        g.fillStyle(0x3a3640).fillRect(tx, cy + 11, W - (tx - x0) - 46, 3).fillStyle(0xffde1e).fillRect(tx, cy + 11, (W - (tx - x0) - 46) * st.charge, 3); }
      const gl = val(r.glyph, null); if (gl) this.spHelpGlyph(g, gl, x0 + W - 34, cy, lit);
    });
    H.foot.setText(st.setup ? 'KICK KEY = SKIP · H HIDES' : 'H HIDES THIS').setPosition(x0 + 12, y0 + ph - 14);
    H.c.setVisible(true).setAlpha(Math.min(1, H.a * 1.4));
    if (this.hud) this.hud.bringToTop(H.c);
  },
  // the little picture of each ball: a dot (the ball) and its path, the goal as a post on the right
  spHelpGlyph(g, kind, x, y, lit) {
    const col = lit ? 0xffde1e : 0xf4f0e4;
    g.lineStyle(2, 0x6c6870).lineBetween(x + 22, y - 9, x + 22, y + 9);              // the goal mouth
    g.lineStyle(2, col); const pts = [];
    for (let i = 0; i <= 10; i++) { const t = i / 10, X = x + t * 20; let Y = y;
      if (kind === 'in') Y = y + 6 - 12 * t - 8 * Math.sin(Math.PI * t) * -0.6;    // bends towards the goal
      else if (kind === 'out') Y = y + 6 - 12 * t - 8 * Math.sin(Math.PI * t) * 0.9;   // bends away
      else if (kind === 'lob') Y = y + 5 - 10 * Math.sin(Math.PI * t) * 0.9;
      else if (kind === 'driven') Y = y + 4 - 3 * t;
      else if (kind === 'shot') Y = y + 3 - 3 * t;
      else Y = y + 6;                                                                // ground
      pts.push({ x: X, y: Y }); }
    g.strokePoints(pts);
    if (kind === 'shot' || kind === 'driven') { const p = pts[10]; g.lineBetween(p.x, p.y, p.x - 4, p.y - 3); g.lineBetween(p.x, p.y, p.x - 4, p.y + 3); }
    g.fillStyle(col).fillCircle(x, pts[0].y, 2.5);
  },
});
