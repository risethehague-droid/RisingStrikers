'use strict';
// HC2 Football · gkcounter.js: the keeper's SPECIAL SAVE as a COUNTER, and its quick pop-up.
// (load order and lanes: src/README.md; loaded after movecall.js and specials.js, it wraps their save calls)
//
// Luca, 1 Nov 2026 21:46 + 21:48: "make new animations for the pop ups for the saves i want to re introduce them" /
// "When you press the special move to save, it charges up ... And then when it interacts with the ball to save, that's
// when you can have the cool animation happen if it saves, and if it doesn't, it like blows past, or it ejects off ...
// reintroduce the pop-ups for these special moves, but just make them quick ... it works under that system of
// activating a charged ... it's almost like a counter. And the move actually activates when the ball is next to his hand."
//
// What was there: PR #77 (gk-cover) switched the full-screen special-save cut scene off (it "blocked too much of the
// screen") and the save's name popped up the moment you PRESSED the key (movecall.js caught 'IRON WALL! · ...'), long
// before the ball arrived. The save itself already happened at the contact (ball.js pickups -> clash()).
// Now, with GK_COUNTER.on:
//   PRESS   = he CHARGES: the aura + a burst as before, a small "COUNTER READY" line, no name yet. While the ball comes
//             a ring at his feet closes in and a gauge fills with how near the ball is to his hands (the counter's
//             timing, made visible: full = it's at his gloves).
//   CONTACT = the counter FIRES (clash(): it meets the ball): the QUICK POP-UP, ~0.7 s and a strip, not the screen.
//     SAVED (a normal shot met, a clash he wins: held / bounced off) - the strip slashes in from his side in the save's
//             colour, his roar frame slides in, the name SLAMS in with a shockwave, a shine runs over it, it snaps shut.
//     A HAND TO IT (too strong, pushed over / wide)  - the same, but the name jolts and the stamp says PUSHED AWAY.
//     BEATEN (a special that wins the clash: through his hands / into the net with him) - the name slams in, then the
//             strip CRACKS red and the letters are blown off the side the shot went (the hands knocked away).
//   The normal banner for those moments ('SAVED!', 'A HAND TO IT!', 'THROUGH HIS HANDS!' ...) goes: the pop-up says it.
// Nothing here changes what happens on the pitch: when the bars are spent, who saves what and how often are the same
// as before (the seeded soak matches stay the same). Only the look and when the name shows.
// How the games do it (words only): fighting games' counters (Street Fighter's parry, Tekken's power crush) flash
// COUNTER! the instant the hit lands, never on the button press; Inazuma Eleven's keeper techniques charge in an aura
// and the name card snaps in at the catch; Mario Strikers' keeper big-saves are a half-second strip over live play.
// Real football: the camera never leaves the play for a save - so the strip sits high and is gone in under a second.
// Off: GK_COUNTER.on = false brings back PR #77's look (name on the press, the small tag over him).

const GK_COUNTER = {
  on: true,
  y: 0.25,          // the strip's height on the screen (0 top .. 1 bottom): above the action, under MOVE_CALL's names
  dur: 0.72,        // s the pop-up lasts (saved / a hand)
  durBeat: 0.86,    // s when he's beaten (the crack needs a beat more)
  ring: [54, 18],   // px the charge ring's radius: when he starts charging .. when the ball is at his gloves
};

(() => {
  const M0 = Match.prototype;
  const saveFx0 = M0.saveFx, clash0 = M0.clash, clashEnd0 = M0.clashEnd, say0 = M0.say, savePop0 = M0.gkSavePop, burst0 = M0.gkAuraBurst, gkCount0 = M0.gkCount;
  const ease = x => 1 - Math.pow(1 - clamp(x, 0, 1), 3);
  const back = x => { x = clamp(x, 0, 1); const s = 2.2; return 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2); };
  const hex = c => '#' + c.toString(16).padStart(6, '0');
  hc2Mix(Match, {
    // PRESS: he charges. (The computer's keeper goes through here too: the same look for both sides)
    saveFx(gk) {
      if (!GK_COUNTER.on) return saveFx0.call(this, gk);
      const lv = gk.spSave; if (!lv) return;
      gk.gkc = { d0: 0, lv };                                                    // (the charge ring's start distance: set on its first frame)
      this.gkcHook();
      this.gkcHush = true;
      try { saveFx0.call(this, gk); } finally { this.gkcHush = false; }           // (its say / tag are swapped below for the charge line)
      say0.call(this, '', `COUNTER READY · ${gk.team.name} KEEPER · LV${lv}`, 0.9);
    },
    gkAuraBurst(gk, lv) {
      burst0.call(this, gk, lv);
      if (GK_COUNTER.on && this.gkcHush && gk.spr && !this.replay) this.gkcTag(gk, 'CHARGE!', RIG_COL[lv - 1]);
    },
    gkSavePop(gk, txt, col) { if (this.gkcHush) return; return savePop0.call(this, gk, txt, col); },
    // the banners of the press and of the contact moment go: the charge line and the pop-up say it (both sat on the
    // same spot under the strip and the words ran into each other). Rami still calls it.
    say(big, small, sec) {
      if (this.gkcHush) return;
      return say0.call(this, big, small, sec);
    },
    // (movecall.js names a held catch SAFE HANDS etc.: not over the counter's own pop-up)
    gkCount(team, key) {
      if (key === 'held' && this.gkcHush) { const mc = MOVE_CALL.on; MOVE_CALL.on = false; try { return gkCount0.call(this, team, key); } finally { MOVE_CALL.on = mc; } }
      return gkCount0.call(this, team, key);
    },
    // CONTACT: the counter fires (ball.js pickups, the ball at his gloves)
    clash(gk) {
      if (!GK_COUNTER.on) return clash0.call(this, gk);
      const lv = gk.spSave || 0; let r;
      this.gkcHush = true;
      try { r = clash0.call(this, gk); } finally { this.gkcHush = false; }
      gk.gkc = null;
      if (lv && r === true) this.gkcPop(gk, lv, 'save');
      else if (lv && r === 'hand') this.gkcPop(gk, lv, 'hand');
      return r;                                                                   // ('clash': POWER AGAINST POWER plays first, clashEnd below decides)
    },
    clashEnd(c) {
      if (!GK_COUNTER.on) return clashEnd0.call(this, c);
      this.gkcHush = true;
      try { clashEnd0.call(this, c); } finally { this.gkcHush = false; }
      const out = c.out === 'bounce' && c.tip ? 'hand' : c.out === 'held' || c.out === 'bounce' ? 'save' : 'beaten';
      this.gkcPop(c.gk, c.lv, out, c.SN);
    },
    // a small tag over his head (the charge)
    gkcTag(gk, txt, col) {
      const t = this.add.text(wx(gk.x, gk.y), wy(gk.y) - 140, txt, { fontFamily: '"Press Start 2P"', fontSize: '11px', color: hex(col), stroke: '#0c0a0e', strokeThickness: 5 })
        .setOrigin(0.5).setDepth(9.6e6).setScale(0.6);
      this.tweens.add({ targets: t, scale: 1, duration: 120, ease: 'Back.easeOut' });
      this.tweens.add({ targets: t, y: t.y - 18, alpha: 0, delay: 380, duration: 260, onComplete: () => t.destroy() });
    },
    // ---------- THE QUICK POP-UP
    gkcPop(gk, lv, out, shotName) {
      if (!gk) return;
      lv = clamp(lv || 1, 1, 3);
      this.gkcN = this.gkcN || {}; this.gkcN[out] = (this.gkcN[out] || 0) + 1;    // (the Lab / tests read how many of each)
      this.gkcLast = { out, lv, name: SAVE_NAMES[lv - 1], at: this.time.now };
      if (this.replay || this.penaltyMode || this.over || window.HC2_TEST_FAST) return;
      this.gkcHook();
      this.gkcEnd();
      if (this.mc && SAVE_NAMES_ALL.has((this.mc.name || '').replace(/!$/, ''))) this.moveCallEnd();   // (one save name on screen at a time)
      const F = '"Press Start 2P"', W = VIEW_W, H = VIEW_H, col = RIG_COL[lv - 1], beat = out === 'beaten';
      const left = gk.team.ownGoalX < 52.5;                                      // his goal's side of the pitch: the strip comes from there
      const side = left ? -1 : 1, name = SAVE_NAMES[lv - 1] + '!';
      const c = this.add.container(W / 2, Math.round(H * GK_COUNTER.y)).setScrollFactor(0);
      if (this.hud) this.hud.add(c);
      const bw = Math.min(W * 0.7, 620), bh = 62;
      const band = this.add.graphics(), lines = this.add.graphics(), wave = this.add.graphics(), crack = this.add.graphics();
      c.add([band, lines, wave]);
      // his roar frame (the old cut scene's portrait), small, at the strip's near end
      const K = MAN.kits[gk.kit], fr = K && ((K.anims['kroar-S'] && K.anims['kroar-S'][3]) || (K.anims['kset-S'] && K.anims['kset-S'][4]) || (K.anims['idle-S'] && K.anims['idle-S'][0]));
      const por = fr && this.textures.exists(gk.kit) ? this.add.image(0, bh / 2 + 4, gk.kit, fr).setOrigin(0.5, 1).setScale(0.9) : null;
      if (por) c.add(por);
      // the name, letter by letter (each can be blown off on its own)
      const fs = 26, adv = fs * 0.98, L = [];
      for (let i = 0; i < name.length; i++) {
        if (name[i] === ' ') continue;
        const t = this.add.text(0, 0, name[i], { fontFamily: F, fontSize: fs + 'px', color: '#ffffff', stroke: '#0c0a0e', strokeThickness: 7, padding: { x: 10, y: 10 } }).setOrigin(0.5);
        const gr = t.context.createLinearGradient(0, 10, 0, t.height - 10);
        gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.45, '#ffde1e'); gr.addColorStop(1, hex(col));
        t.setFill(gr); t.bx = (i - (name.length - 1) / 2) * adv + side * -30; t.i = i; L.push(t); c.add(t);
      }
      const capTxt = out === 'save' ? 'COUNTER! · SAVED' : out === 'hand' ? 'COUNTER! · PUSHED AWAY' : `${shotName ? shotName + ' ' : ''}BREAKS THROUGH!`;
      const cap = this.add.text(side * -30, bh / 2 + 14, capTxt, { fontFamily: F, fontSize: '10px', color: beat ? '#ff6e6e' : '#f4f0e4', stroke: '#0c0a0e', strokeThickness: 5 }).setOrigin(0.5).setAlpha(0);
      const stamp = beat ? this.add.text(side * -30, -2, 'BEATEN!', { fontFamily: F, fontSize: '30px', color: '#ff2846', stroke: '#1e0206', strokeThickness: 8 }).setOrigin(0.5).setAlpha(0).setAngle(-8) : null;
      c.add(crack); c.add(cap); if (stamp) c.add(stamp);
      // the effects at his gloves on the pitch: the counter's hit
      if (gk.spr) { const X = wx(this.ball.x, this.ball.y), Y = wy(this.ball.y) - 12 - this.ball.z * PX_H;
        this.rigPop('ring', X, Y, wy(this.ball.y) + 1.2, { s: [0.3, beat ? 1.6 : 3.0], ms: 300, tint: beat ? 0xff2846 : 0xffffff });
        if (!beat) this.rigPop('impact', X, Y, wy(this.ball.y) + 1.3, { s: [0.6, 1.5], ms: 240, tint: col }); }
      this.cameras.main.flash(beat ? 90 : 70, beat ? 255 : (col >> 16) & 255, beat ? 60 : (col >> 8) & 255, beat ? 70 : col & 255);
      this.gkc = { c, band, lines, wave, crack, por, L, cap, stamp, out, beat, col, side, bw, bh, t: 0, dur: beat ? GK_COUNTER.durBeat : GK_COUNTER.dur };
      return this.gkc;
    },
    gkcHook() { if (!this.gkcHooked) { this.gkcHooked = true; this.events.on('postupdate', (t, d) => this.gkcTick(Math.min(d / 1000, 1 / 30))); } },
    gkcEnd() { const P = this.gkc; if (!P) return; this.gkc = null; if (P.c && P.c.scene) P.c.destroy(true); },
    gkcTick(dt) {
      this.gkcChargeTick();
      const P = this.gkc; if (!P) return;
      if (!P.c.scene) { this.gkc = null; return; }
      if (this.replay || this.penaltyMode || this.over) { this.gkcEnd(); return; }
      if (this.paused) { P.c.setVisible(false); return; }
      P.c.setVisible(true); P.t += dt;
      const t = P.t, d = P.dur, s = P.side, bw = P.bw, bh = P.bh;
      if (t > d) { this.gkcEnd(); return; }
      const outT = d - 0.16, o = clamp((t - outT) / 0.16, 0, 1);                // the snap shut
      const crackT = 0.3, cr = P.beat ? clamp((t - crackT) / 0.3, 0, 1) : 0;
      // the strip: slashes in from his side (0.09 s), a slanted ink band edged in the save's colour; snaps shut vertically
      const wi = ease(t / 0.09), hh = bh * (1 - o * o);
      const x0 = s * (bw / 2 + 40) * (1 - wi), w = bw * (0.15 + 0.85 * wi), sk = 22;
      const edge = P.beat && cr > 0 ? 0xff2846 : P.col;
      P.band.clear();
      if (hh > 0.5) {
        P.band.fillStyle(0x0c0a0e, 0.82).fillPoints([{ x: x0 - w / 2 + sk, y: -hh / 2 }, { x: x0 + w / 2 + sk, y: -hh / 2 }, { x: x0 + w / 2 - sk, y: hh / 2 }, { x: x0 - w / 2 - sk, y: hh / 2 }], true);
        P.band.fillStyle(edge, 0.95).fillRect(x0 - w / 2 - 4, hh / 2 - 3, w, 5).fillRect(x0 - w / 2 + 26, -hh / 2 - 3, w, 4);
        if (t < 0.12) P.band.fillStyle(0xffffff, 0.85 * (1 - t / 0.12)).fillRect(x0 - w / 2, -hh / 2, w, hh);   // the hit's white frame
      }
      // speed lines through the strip, running away from his side
      P.lines.clear();
      if (hh > 4 && !P.beat || hh > 4 && cr < 0.5) {
        P.lines.lineStyle(2, 0xffffff, 0.35 * (1 - o));
        for (let i = 0; i < 9; i++) { const yy = -hh / 2 + 6 + ((i * 0.618) % 1) * (hh - 12), ln = 40 + (i * 37) % 70;
          const xx = -s * (((t * 1500 + i * 131) % (bw + 160)) - bw / 2 - 80); P.lines.lineBetween(xx, yy, xx - s * ln, yy); }
      }
      // the shockwave behind the name as it lands
      P.wave.clear();
      const wv = clamp((t - 0.1) / 0.26, 0, 1);
      if (wv > 0 && wv < 1) P.wave.lineStyle(4 * (1 - wv) + 1, P.beat ? 0xffffff : P.col, 1 - wv).strokeEllipse(-s * 30, 0, 60 + wv * bw * 0.9, 18 + wv * 70);
      // his portrait slides in at the near end
      if (P.por) { const pi = ease((t - 0.03) / 0.12); P.por.setX(s * (bw / 2 - 30) + s * 160 * (1 - pi)).setAlpha(pi * (1 - o)).setScale(0.9, 0.9 * (1 - o * 0.8));
        if (P.beat && cr > 0) P.por.setTint(0xff8080).setX(P.por.x + s * cr * 30).setAngle(s * cr * 25); }
      // the letters: SLAM in (big -> 1, staggered from his side), a shine runs over them; beaten: blown off the far side
      const n = P.L.length;
      P.L.forEach((T, j) => {
        const k = s > 0 ? n - 1 - j : j;                                         // (from his side first)
        const p = clamp((t - 0.08 - k * 0.012) / 0.12, 0, 1), b = back(p);
        let x = T.bx, y = 0, sc = 1 + (1 - b) * 1.6, a = Math.min(1, p * 4), rot = 0, tint = null;
        const sw = ((t - 0.3) * 2.6) % 1.6 - 0.2, u = j / Math.max(1, n - 1);
        if (!P.beat && t > 0.3 && Math.abs((s > 0 ? 1 - u : u) - sw) < 0.12) tint = 0xffffff;
        if (P.out === 'hand' && t > 0.24 && t < 0.4) { x += Math.sin(t * 120 + j) * 4; rot = Math.sin(t * 90) * 0.06; }
        if (P.beat && cr > 0) {                                                   // the hands knocked away: the letters go with the shot
          const q = cr * cr, sd = Math.sin(T.i * 12.9898) * 0.5 + 0.5;
          x += -s * (60 + sd * 220) * q; y += (Math.cos(T.i * 78.233) * 70 - 30) * q + 120 * q * q; rot = -s * (1 + sd * 2) * q; a *= 1 - cr * 0.85; tint = 0xff5050;
        }
        a *= 1 - o; T.setPosition(Math.round(x), Math.round(y)).setScale(sc, sc * (1 - o * 0.7)).setRotation(rot).setAlpha(a);
        if (tint != null) T.setTint(tint); else T.clearTint();
      });
      // beaten: the strip cracks (a zigzag from the impact, both ways) and the stamp lands
      P.crack.clear();
      if (P.beat && cr > 0) {
        P.crack.lineStyle(3, 0xffffff, 0.9 * (1 - o));
        let px = -s * 30, py = 0; const segs = Math.ceil(cr * 7);
        for (let i = 0; i < segs; i++) { const nx = px - s * bw / 14, ny = (i % 2 ? 1 : -1) * (6 + (i * 7) % 14); P.crack.lineBetween(px, py, nx, ny); px = nx; py = ny; }
        px = -s * 30; py = 0;
        for (let i = 0; i < segs; i++) { const nx = px + s * bw / 16, ny = (i % 2 ? -1 : 1) * (5 + (i * 5) % 12); P.crack.lineBetween(px, py, nx, ny); px = nx; py = ny; }
        if (P.stamp) { const sp = back(clamp((t - crackT - 0.06) / 0.12, 0, 1)); P.stamp.setScale(2.4 - 1.4 * sp).setAlpha(Math.min(1, sp * 3) * (1 - o)); }
      }
      P.cap.setAlpha(clamp((t - 0.18) / 0.08, 0, 1) * (1 - o));
      // a jolt as it lands
      const land = t - 0.18, k = land > 0 && land < 0.14 ? (1 - land / 0.14) * (P.beat ? 6 : 4) : 0;
      P.c.setPosition(Math.round(VIEW_W / 2 + Math.sin(t * 97) * k), Math.round(VIEW_H * GK_COUNTER.y + Math.cos(t * 83) * k * 0.6));
    },
    // ---------- THE CHARGE: a ring at his feet that closes in as the ball comes, a gauge that fills (world space)
    gkcChargeTick() {
      const G = this.gkcG || (this.gkcG = this.add.graphics());
      G.clear();
      if (!GK_COUNTER.on || this.replay || !this.ball) return;
      const b = this.ball;
      for (const tm of [this.home, this.away]) {
        const gk = tm && tm.players && tm.players[0];
        if (!gk || !gk.spSave || !gk.gkc || !gk.spr || gk.sentOff) continue;
        const live = !b.owner && !b.inNet && (b.special ? !!b.spTeam && b.spTeam !== gk.team : !!b.saveable && b.saveable !== gk.team);
        if (!live) continue;
        const dist = len(b.x - gk.x, b.y - gk.y);
        if (!gk.gkc.d0) gk.gkc.d0 = Math.max(dist, 3);
        const u = clamp(1 - dist / gk.gkc.d0, 0, 1), col = RIG_COL[clamp(gk.spSave, 1, 3) - 1];
        const X = wx(gk.x, gk.y), Y = wy(gk.y) - 2, r = GK_COUNTER.ring[0] + (GK_COUNTER.ring[1] - GK_COUNTER.ring[0]) * u, ky = 0.36;
        const hot = u > 0.82, flick = hot && Math.floor(this.time.now / 45) % 2 === 0;
        G.setDepth(wy(gk.y) - 0.4);
        G.lineStyle(2, flick ? 0xffffff : col, 0.35 + 0.4 * u).strokeEllipse(X, Y, r * 2, r * 2 * ky);
        // the gauge: an arc on a wider ellipse, filling clockwise from the front as the ball nears his hands
        const R = GK_COUNTER.ring[0] + 10, N = Math.max(2, Math.round(40 * u)), pts = [];
        for (let i = 0; i <= N; i++) { const a = Math.PI / 2 - (i / 40) * Math.PI * 2; pts.push({ x: X + Math.cos(a) * R, y: Y + Math.sin(a) * R * ky }); }
        if (u > 0.02) G.lineStyle(4, flick ? 0xffffff : col, 0.85).strokePoints(pts, false);
        // four ticks pointing in (the "lock on")
        G.lineStyle(2, hot ? 0xffffff : col, 0.6 + 0.4 * u);
        for (let q = 0; q < 4; q++) { const a = q * Math.PI / 2 + Math.PI / 4, cx = Math.cos(a), cy = Math.sin(a) * ky;
          G.lineBetween(X + cx * (r + 12), Y + cy * (r + 12), X + cx * (r + 3), Y + cy * (r + 3)); }
      }
    },
  });
})();
