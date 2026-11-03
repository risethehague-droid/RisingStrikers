'use strict';
// HC2 Football · chargebtn.js: the NEW BUTTON MECHANIC - SPACE charges your special (LV1 / LV2 / LV3), then the
// normal button plays that action's special. (load order and lanes: src/README.md; loaded after skilldrib.js and
// gkcounter.js, before tutorial.js: it wraps controlHuman last, so it sees the keys first)
//
// Luca, 3 Nov 2026 (thread "New button mechanic"):
//   11:48 "a new version of the game ... new controls, where the special key is space bar, and once pressed the
//         character you control charges up, then another button can be pressed, let's say the kick button to use a
//         special kick, pass button would be a special pass, so on and so forth, as to reduce button amount, improve
//         game play and game feel ... everything runs the same except for this new change"
//   12:05 "always reference as if I'm using WASD for movement and my right hand for any mechanics ... WASD movement,
//         shift is sprint, C is change character, space bar is the special bar that charges up" / 12:07 "lob on L,
//         pass is K, through ball I, kick J" / "on a ball dropping to you, space bar is perfect volley or header"
//   12:10 "pressing the space bar more than once can charge the character to lvl 2 if possible and 3 times to lvl 3 ...
//         it doesn't insta use your strongest shot ... use a level one to bait a keeper and then use a level two for a
//         guaranteed goal ... make each stage clearly more, distinct, more of an upgrade of energy ... but keep it clean"
//   12:30 "make dribble be automatic, next defender you interact with after you've charged up and are sprinting
//         (holding shift) you will do a dribble ... but add a dribble button just in case" (O: ENTER is pause)
//
// THE KEYS (the start screen's KEYS pick "NEW: SPACE CHARGE"; window.HC2_KEYS === 'charge'):
//   left hand  WASD move · SHIFT sprint · C switch player · SPACE charge
//   right hand J kick · K pass · I through ball · L lob · O special dribble (the backup)
//   defending  K challenge · J slide (the old pass / shoot jobs, on their new keys)
// THE CHARGE: each SPACE tap adds a level, up to the bars in the meter (3 max). The first tap needs 1 bar. A level fills
//   in CHG.fill s (an action pressed while it fills waits and fires when it's full); the charge lasts CHG.hold s after
//   the last tap, then fades and spends nothing. Bars go only when a special fires: LVn costs n.
//   J = the special shot at your level (BLAZE SHOT / THUNDER SHOT / RISING PHOENIX). K / I / L = the LV1 special pass
//   (TORNADO DRILL / BURROW BLAST / ANGEL GLIDE): only LV1 passes exist, so a pass costs 1 bar whatever the level and
//   ends the charge (the other bars stay in the bank). Charged + SHIFT held + a defender in front = the special dribble.
//   A ball dropping to you: SPACE alone = the aerial special (volley / header) at your level, LV1 if you're not charged.
//   Your keeper: SPACE alone = the special save at LV1; each tap after it, before the ball gets there, raises it a level.
// How the games do it (words only): Mario Strikers charges a shot while you hold it and the aura grows; Inazuma Eleven
//   and Captain Tsubasa build an aura before the named move; fighting games (Street Fighter's EX moves vs Super Arts)
//   let you choose how much meter to spend - the "bait with a LV1, finish with a LV2" choice Luca asked for.
// The look is a placeholder in code (rings, aura lines, a screen-edge tint) until the new base rig: every level reuses
// the special shots' colours (RIG_COL) so LV1 / LV2 / LV3 read the same everywhere.
// Off (any other KEYS pick, or two humans on one keyboard): nothing here does anything; the classic keys are untouched.

const CHG = {
  fill: 0.3,        // s for a level to fill (the charge-up)
  hold: 3.0,        // s a charge lasts after the last tap
  dribD: 2.6,       // m: a defender this close in front, while charged and sprinting = the special dribble
};
// the classic map (io.js + arcadesp.js), kept to switch back
const CHG_MAP = {
  pass: ['KeyK'], shoot: ['KeyJ'], lob: ['KeyL'], through: ['KeyI'], sprint: ['ShiftLeft', 'ShiftRight'],
  start: ['Enter', 'Escape', 'KeyP'], special: ['Space'], meter: ['KeyT'], flag: ['KeyF'], sdribble: ['KeyO'], switch: ['KeyC'],
};
KEYSETS.charge = { move: 'WASD', pass: 'K', shoot: 'J', lob: 'L', through: 'I', special: 'SPACE', ud: 'W/S', sw: 'C', drib: 'O' };
const chgOn = () => window.HC2_KEYS === 'charge' && !Input.skip;

(() => {
  // ---------- the key map follows the KEYS pick (checked every poll: the start screen, the Lab and #2p can change it)
  let classic = null, classicPad = null, applied = false;
  const poll0 = Input.poll;
  Input.poll = function () {
    const on = chgOn();
    if (on !== applied) {
      if (on) { classic = Object.assign({}, this.map); classicPad = Object.assign({}, this.padMap); this.map = Object.assign({}, CHG_MAP); this.padMap = Object.assign({}, this.padMap, { switch: [3] }); }   // (pad: Y switches, LB charges)
      else if (classic) { this.map = classic; this.padMap = classicPad; }
      applied = on;
    }
    return poll0.call(this);
  };

  // ---------- the meter can be capped for one call: a LVn special spends n bars, not all of them (SpMeter.spend
  // spends level(), so capping level() is all it takes)
  const SM = SpMeter.prototype, level0 = SM.level;
  SM.level = function () { const n = level0.call(this); return this.cap ? Math.min(n, this.cap) : n; };
  const capped = (mt, n, fn) => { const c0 = mt.cap; mt.cap = n; try { return fn(); } finally { mt.cap = c0; } };

  const M = Match.prototype;
  const human0 = M.controlHuman, air0 = M.airSpecial, update0 = M.update, render0 = M.render, help0 = M.helpText, saveFx0 = M.saveFx;

  hc2Mix(Match, {
    chgOf(team) { return team && team.chg; },
    // a SPACE tap: start the charge, or add a level
    chgTap(team, p) {
      const mt = this.meterOf(team), bars = level0.call(mt), C = team.chg, now = this.time.now;
      if (bars < 1) { this.say('', 'SP METER EMPTY', 0.6); return; }
      if (C && C.lv >= Math.min(3, bars)) { C.at = now; this.say('', C.lv >= 3 ? 'MAX CHARGE · LV3' : `NOT ENOUGH BARS FOR LV${C.lv + 1}`, 0.7); return; }
      if (C) { C.lv++; C.fillT = 0; C.at = now; C.p = p; }
      else team.chg = { lv: 1, fillT: 0, at: now, p, pend: null, eat: null };
      SFX.level(team.chg.lv);
    },
    chgReady(C) { return C && C.fillT >= CHG.fill; },
    chgTick(team, dt) {
      const C = team.chg; if (!C) return;
      C.fillT += dt;
      if (this.setPiece || this.over || this.time.now - C.at > CHG.hold * 1000) {     // (a set piece / full time: it's off; 3 s unused: it fades)
        if (!this.setPiece && !this.over) this.say('', 'CHARGE FADED', 0.6);
        team.chg = null;
      }
    },
    // fire the charged special for an action ('shot' / a pass mode / 'dribble'); true when it went
    chgFire(p, team, what, dir) {
      const C = team.chg, mt = this.meterOf(team); let ok = false;
      if (what === 'shot') { this.chgShot = true; try { ok = capped(mt, C.lv, () => this.special(p)); } finally { this.chgShot = false; } }
      else if (what === 'dribble') ok = this.chgDribble(p);
      else ok = capped(mt, 1, () => !!(this.spPass(p, what, dir) || this.curvePass(p, what, dir)));
      if (ok) team.chg = null;
      return ok;
    },
    // the special dribble: the RAINBOW FLICK / SHADOW STEP (skilldrib.js, picked by where the man is), in every match
    // with these keys (they're behind SKILL_DRIB, a Lab switch, for the classic keys); the ARCADE one if that can't go
    chgDribble(p) {
      const ax = this.inp.axis, s0 = SKILL_DRIB; let ok = false;
      SKILL_DRIB = true; try { ok = !!this.skillDrib(p, null, ax); } finally { SKILL_DRIB = s0; }
      if (!ok && this.aspOn && this.aspOn()) ok = !!this.aspDribble(p, ax);
      return ok;
    },
    // what the rest of the game reads as "your buttons" while you're on these keys: SPACE on the ball is only the
    // charge (never the old SPECIAL), L without the ball isn't the switch any more (C is), and the key that just fired
    // a special is swallowed until you let go (no normal shot / pass after it)
    chgView(src, owns, team) {
      const eat = team.chgEat;
      const hide = a => (a === 'special' && (owns || this.chgSpaceUsed)) || a === 'sdribble' || (eat && a === eat);   // (O: the dribble is played here)
      const V = Object.create(src);
      V.pressed = a => (a === 'lob' && !owns ? src.pressed('switch') : !hide(a) && src.pressed(a));
      V.held = a => !hide(a) && src.held(a);
      V.released = a => !hide(a) && src.released(a);
      V.mashTake = () => src.mashTake();
      return V;
    },
    controlHuman(dt, side, ...a) {
      if (!chgOn()) return human0.call(this, dt, side, ...a);
      const team = side || this.home, p = this.human, src = this.inp, b = this.ball;
      if (team.chgEat && !src.held(team.chgEat)) team.chgEat = null;
      this.chgTick(team, dt);
      if (this.chgGk && this.chgGk.team === team && this.chgSaveLive(this.chgGk)) this.chgSpaceUsed = true;   // (his save is on: SPACE is his, update below)
      if (!p || this.aerial || p.sdrib || p.skd) {                                   // (an aerial battle: SPACE is its special, as before)
        const s = this.inp; this.inp = this.chgView(src, false, team); try { return human0.call(this, dt, side, ...a); } finally { this.inp = s; }
      }
      const owns = b.owner === p, space = src.pressed('special') && !this.chgSpaceUsed, C = team.chg;
      const busy = p.state === 'kick' || p.state === 'slide' || p.state === 'getup' || p.state === 'dheader' || p.stun > 0;
      if (owns && !p.keeper && !busy) {
        const ax = src.axis, moving = len(ax.x, ax.y) > 0.1, dir = moving ? ax : dirVec(p.face);
        if (space) this.chgTap(team, p);
        else if (src.pressed('sdribble')) { if (!this.chgDribble(p) && level0.call(this.meterOf(team)) < 1) this.say('', 'SP METER EMPTY', 0.6); else if (C) team.chg = null; }
        else if (C) {
          const key = src.pressed('shoot') ? 'shoot' : src.pressed('pass') ? 'pass' : src.pressed('through') ? 'through' : src.pressed('lob') ? 'lob' : null;
          if (key) C.pend = key;
          if (C.pend && this.chgReady(C)) {
            const k = C.pend, what = k === 'shoot' ? 'shot' : k === 'pass' ? 'ground' : k; C.pend = null;
            if (this.chgFire(p, team, what, dir)) { team.chgEat = k; return; }
          } else if (C.pend) team.chgEat = C.pend;                                   // (waiting for the fill: the key does nothing else meanwhile)
          if (team.chg && this.chgReady(team.chg) && src.held('sprint') && moving) {   // charged + sprinting: the next man in front gets the dribble
            const o = this.aspFront ? this.aspFront(p) : null;
            if (o && len(o.x - p.x, o.y - p.y) < CHG.dribD && this.chgFire(p, team, 'dribble', dir)) return;
          }
        }
      }
      const mt = this.meterOf(team), e0 = mt.e, s = this.inp;
      this.inp = this.chgView(src, owns, team);
      try { human0.call(this, dt, side, ...a); } finally { this.inp = s; }
      if (!owns && space && !p.keeper && !(mt.e < e0)) this.chgTap(team, p);       // (off the ball: the aerial special got first go at SPACE)
      // Luca, 3 Nov 13:26 "the aerial special isn't releasing right": SPACE pressed a moment BEFORE the dropping ball's
      // window opened (the natural timing - you press as it comes) only started a charge, and nothing fired when the
      // ball got there. Now a charge you're holding RELEASES by itself as the window opens: the aerial special at your level.
      if (!owns && !p.keeper && team.chg && this.airSp && !(mt.e < e0) && !p.busy() && this.ball.owner !== p) this.airSpecial(p);
    },
    // the aerial special (a ball dropping to you, or the aerial battle): at your charge level, LV1 if you're not charged
    airSpecial(p, aimAI) {
      if (!chgOn() || aimAI != null || !this.isHuman(p)) return air0.call(this, p, aimAI);
      const C = p.team.chg, lv = C ? (this.chgReady(C) ? C.lv : Math.max(1, C.lv - 1)) : 1;
      const r = capped(this.meterOf(p.team), lv, () => air0.call(this, p, aimAI));
      p.team.chg = null; return r;
    },
    // the keeper: SPACE alone saves at LV1 (no time for two buttons), each tap after it raises it before the ball gets there.
    // The SAVE? prompt is read inside update (match.js, after the keys are polled), so while it's up for your side the
    // meter is capped at 1 for the frame; saveFx (the press) marks that SPACE as used, so it doesn't start a charge too.
    update(time, deltaMs) {
      this.chgSpaceUsed = false; this.chgSaved = false;
      const A = this.saveAsk;
      if (!chgOn() || !A || this.paused || !this.hasHuman(A.team)) update0.call(this, time, deltaMs);
      else capped(this.meterOf(A.team), 1, () => update0.call(this, time, deltaMs));
      // (read here, after the keys were polled: during the save's hit-stop the players' controls don't run)
      const G = this.chgGk;
      if (G && chgOn() && !this.chgSaved && !this.paused && this.inpOf(G.team).pressed('special')) this.chgSaveUp(G);
      if (G && !G.spSave) this.chgGk = null;
    },
    saveFx(gk) {
      if (chgOn() && gk && gk.spSave && this.hasHuman(gk.team)) { this.chgGk = gk; this.chgSpaceUsed = this.chgSaved = true; }
      return saveFx0.call(this, gk);
    },
    chgSaveLive(gk) { const b = this.ball; return !!(gk.spSave && b && !b.owner && !b.inNet && (b.special || b.saveable)); },
    chgSaveUp(gk) {                                                                  // a later SPACE tap: one level more, one more bar
      const mt = this.meterOf(gk.team);
      if (!this.chgSaveLive(gk)) return false;
      if (gk.spSave < 3 && level0.call(mt) >= 1) {
        mt.e -= 1; mt.flash = 0.3; if (level0.call(mt) < 3) mt.risen = false;
        gk.spSave++; if (gk.gkc) gk.gkc.lv = gk.spSave; SFX.level(gk.spSave);
        if (this.gkAuraBurst && gk.spr) this.gkAuraBurst(gk, gk.spSave);
        this.say('', `SAVE CHARGED · LV${gk.spSave}`, 0.6);
      }
      return true;
    },
    render(dt) { const r = render0.call(this, dt); this.chgDraw(); return r; },
    helpText() {
      if (!chgOn()) return help0.call(this);
      return 'WASD MOVE  SHIFT SPRINT  C SWITCH  SPACE CHARGE (TAP 1-3x)  J KICK  K PASS / CHALLENGE  I THROUGH  L LOB  O DRIBBLE';
    },
    // ---------- THE LOOK (placeholder until the new rig): every level clearly more, still clean
    //   LV1: a ring at his feet in the LV1 colour (the arc fills as it charges), a soft pulse
    //   LV2: + a second, wider ring and aura lines rising round him
    //   LV3: + a glow under him, more and taller lines, a faster pulse, and the screen's edge tinted
    //   over his head: CHARGE LV n; at the bottom: what each button does now
    chgDraw() {
      const G = this.chgG || (this.chgG = this.add.graphics());
      G.clear();
      const E = this.chgE || (this.chgE = this.add.graphics().setScrollFactor(0));
      E.clear();
      const T = this.chgT || (this.chgT = this.add.text(0, 0, '', { fontFamily: '"Press Start 2P"', fontSize: '9px', color: '#ffffff', stroke: '#0c0a0e', strokeThickness: 4 }).setOrigin(0.5, 1));
      const H = this.chgH || (this.chgH = this.add.text(VIEW_W / 2, VIEW_H - 64, '', { fontFamily: '"Press Start 2P"', fontSize: '9px', color: '#f4f0e4', stroke: '#0c0a0e', strokeThickness: 4, align: 'center' }).setOrigin(0.5, 1).setScrollFactor(0));
      if (this.hud && !this.chgInHud) { this.chgInHud = true; this.hud.addAt(E, 0); this.hud.add(H); }   // (screen space: in the HUD, which the camera's zoom leaves alone)
      T.setVisible(false); H.setVisible(false); E.setVisible(true);                // (E: something hides the HUD's spare graphics; it's empty unless LV3)
      if (!chgOn() || this.replay || !this.ball) return;
      const now = this.time.now / 1000;
      for (const S of this.hSlots ? this.hSlots() : [this]) {
        const team = S === this ? this.hTeam() : this[S.hSide], C = team && team.chg, p = S.human;
        if (!C && S === this && p && this.ball.owner === p && !p.keeper && !this.setPiece && level0.call(this.meterOf(team)) >= 1) {   // (a new player: what SPACE does, once there's a bar)
          const n = level0.call(this.meterOf(team));
          H.setText(window.HC2_TOUCH ? `TAP CHARGE FOR YOUR SPECIAL (${n} BAR${n > 1 ? 'S' : ''} · UP TO ${n}x)` : `SPACE: CHARGE YOUR SPECIAL (${n} BAR${n > 1 ? 'S' : ''} · TAP UP TO ${n}x)`)   // (phone controls: name the button).setAlpha(0.75).setVisible(true);
        }
        if (!C || !p || p.sentOff) continue;
        const lv = C.lv, u = clamp(C.fillT / CHG.fill, 0, 1), col = RIG_COL[lv - 1], ky = 0.36;
        const fade = clamp((CHG.hold * 1000 - (this.time.now - C.at)) / 600, 0, 1);  // (the last 0.6 s: it fades out)
        const X = wx(p.x, p.y), Y = wy(p.y) - 2, pulse = 0.5 + 0.5 * Math.sin(now * (lv >= 3 ? 16 : lv === 2 ? 11 : 7));
        const h = ((p.spr && p.spr.displayHeight) || 160) * 0.44;                    // (sized to him - his body is about 44% of the frame)
        G.setDepth(wy(p.y) + 0.5);
        if (lv >= 3) { G.fillStyle(col, (0.22 + 0.14 * pulse) * fade); G.fillEllipse(X, Y, h * 1.5, h * 1.5 * ky);   // LV3: a glow under him
          G.lineStyle(3, 0xffffff, (0.3 + 0.4 * pulse) * fade).strokeEllipse(X, Y, h * 1.7, h * 1.7 * ky); }
        const r1 = h * (0.4 + 0.03 * pulse);
        G.lineStyle(3, col, 0.85 * fade).strokeEllipse(X, Y, r1 * 2, r1 * 2 * ky);
        { const R = r1 + h * 0.08, N = Math.max(2, Math.round(40 * u)), pts = [];   // the fill arc: full (white) = ready
          for (let i = 0; i <= N; i++) { const ang = Math.PI / 2 - (i / 40) * Math.PI * 2; pts.push({ x: X + Math.cos(ang) * R, y: Y + Math.sin(ang) * R * ky }); }
          G.lineStyle(4, u >= 1 ? 0xffffff : col, 0.95 * fade).strokePoints(pts, false); }
        if (lv >= 2) { const r2 = h * (0.62 + 0.04 * pulse); G.lineStyle(3, col, 0.6 * fade).strokeEllipse(X, Y, r2 * 2, r2 * 2 * ky);
          const n = lv >= 3 ? 14 : 8, hgt = h * (lv >= 3 ? 1.35 : 0.95), rr = h * (lv >= 3 ? 0.36 : 0.3);   // aura lines rising round him
          for (let i = 0; i < n; i++) { const ang = (i / n) * Math.PI * 2 + now * 1.3, ph = (now * (lv >= 3 ? 2.2 : 1.6) + i * 0.37) % 1;
            const lx = X + Math.cos(ang) * rr, ly = Y + Math.sin(ang) * rr * ky, y0 = ly - ph * hgt, y1 = y0 - h * (lv >= 3 ? 0.28 : 0.18);
            G.lineStyle(lv >= 3 ? 4 : 3, ph < 0.35 ? 0xffffff : col, (1 - ph) * 0.9 * fade).lineBetween(lx, y0, lx, y1); } }
        T.setText(u >= 1 ? `CHARGE LV${lv}` : 'CHARGING...').setColor('#' + col.toString(16).padStart(6, '0')).setPosition(X, Y - ((p.spr && p.spr.displayHeight) || 160) * 0.92).setDepth(wy(p.y) + 1).setAlpha(fade).setVisible(true);
        if (lv >= 3) { E.lineStyle(14, col, (0.22 + 0.16 * pulse) * fade).strokeRect(7, 7, VIEW_W - 14, VIEW_H - 14); }
        if (S === this) {                                                           // (your own buttons; a second human reads his at the bottom too, so only the home one)
          const nm = SP_NAMES[lv - 1];
          H.setText(window.HC2_TOUCH ? `SHOOT: ${nm} (LV${lv}) · PASS / THROUGH / LOB: SPECIAL PASS\nSPRINT AT HIM: DRIBBLE · CHARGE: ${lv < 3 ? 'MORE POWER' : 'MAX'}`
            : `J ${nm} (LV${lv}) · K / I / L SPECIAL PASS (1 BAR)\nSHIFT + RUN AT HIM: DRIBBLE · SPACE: ${lv < 3 ? 'MORE POWER' : 'MAX'}`).setAlpha(fade).setVisible(true);
        }
      }
    },
  });
})();
// the pause menu's THE MOVES list for these keys (ui.js drawPause)
function chgMoveRows() {
  return [['WASD', 'MOVE'], ['SHIFT', 'SPRINT (USES ENERGY)'], ['C', 'SWITCH PLAYER'],
    ['J', 'KICK, HOLD FOR POWER · SLIDE TACKLE'], ['K', 'PASS · CHALLENGE (WITHOUT THE BALL)'], ['I', 'THROUGH BALL'], ['L', 'LOB / CROSS'],
    ['SPACE', 'CHARGE YOUR SPECIAL: TAP 1 / 2 / 3 TIMES = LV1 / LV2 / LV3 (UP TO YOUR BARS)'],
    ['SPACE, THEN J', `SPECIAL SHOT AT YOUR LEVEL: ${SP_NAMES.join(' · ')}`],
    ['SPACE, THEN K / I / L', 'SPECIAL PASS (1 BAR): TORNADO DRILL · BURROW BLAST · ANGEL GLIDE'],
    ['SPACE, THEN SHIFT', 'RUN AT A DEFENDER: SPECIAL DRIBBLE (1 BAR) · O DOES IT TOO'],
    ['SPACE (BALL DROPPING)', 'SPECIAL VOLLEY / HEADER'], ['SPACE (YOUR KEEPER)', 'SPECIAL SAVE · TAP AGAIN FOR MORE'],
    ['T', 'SP METER LOOK'], ['M', 'SOUND ON / OFF'], ['F', 'FLAG A PROBLEM: THE LAST 8 S + YOUR NOTE'], ['ENTER', 'PAUSE']];
}
