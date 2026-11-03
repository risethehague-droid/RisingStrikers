'use strict';
// HC2 Football · gkcanim.js: three NEW animations for the keeper COUNTER pop-ups (SAVED / PUSHED AWAY / BEATEN).
// (load order and lanes: src/README.md; loaded right after gkcounter.js, it swaps how its pop-up strip moves)
//
// Luca, 3 Nov 2026: "animate 3 new simple but fun dynamic animations for the 3 save pop ups then implement them into
// the game". The pop-up's words stay exactly as gkcounter.js has them (his three special-save names IRON WALL /
// THUNDER GLOVE / RISING SHIELD, and the SAVED / PUSHED AWAY / BEATEN captions). Only HOW it moves is new:
//   SAVED        "GLOVE CLAP"  - two big gloves fly in from the strip's ends and CLAP on the middle (white flash, stars),
//                                spring back to hold the strip's ends, the name pops out of the clap and wobbles like
//                                jelly; at the end the gloves clap shut again and squash the strip away (caught it).
//   PUSHED AWAY  "SWAT"        - the name slams in from his side, then a fist punches up under it: the letters are
//                                knocked up in a wave from the hit and spring back, a dotted arc shows the ball pushed
//                                over and away.
//   BEATEN       "SMASH"       - the name slams in, then a ball rockets through the strip from the shot's side: the
//                                strip splits in two, glass shards fly with the ball, the letters tumble off and fall,
//                                the red BEATEN! stamp lands with a shake.
// Look only: no Math.random (the seeded matches stay the same), nothing on the pitch changes. Temporary: the new base rig
// redoes these (docs/blueprint/06-animation-rig.md, RIG-61). Off: GKC_ANIM.on = false = gkcounter.js's PR #108 look.

const GKC_ANIM = {
  on: true,
  dur: { save: 0.78, hand: 0.76, beaten: 0.9 },   // s each pop-up lasts (all under a second: the play goes on under it)
};

(() => {
  const M0 = Match.prototype, pop0 = M0.gkcPop, tick0 = M0.gkcTick;
  const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const ease = x => 1 - Math.pow(1 - cl(x), 3);
  const back = (x, s = 2.2) => { x = cl(x); return 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2); };
  const hash = i => { const v = Math.sin(i * 12.9898 + 4.1414) * 43758.5453; return v - Math.floor(v); };   // (no Math.random)
  const INK = 0x0c0a0e;
  // a big cartoon keeper glove, drawn once at (0, 0), fingers up (the Graphics object is moved / turned / scaled after)
  function glove(g, col) {
    g.fillStyle(INK, 1);
    for (let i = 0; i < 4; i++) g.fillRoundedRect(-17 + i * 8.5, -30, 9.5, 24, 4);
    g.fillRoundedRect(-19, -14, 38, 32, 8).fillRoundedRect(13, -6, 14, 22, 6).fillRect(-17, 14, 34, 14);
    g.fillStyle(col, 1);
    for (let i = 0; i < 4; i++) g.fillRoundedRect(-15 + i * 8.5, -28, 6.5, 22, 3);
    g.fillRoundedRect(-17, -12, 34, 28, 7).fillRoundedRect(15, -4, 10, 18, 5);
    g.fillStyle(0xffffff, 0.35).fillRoundedRect(-13, -9, 9, 18, 4);                 // the shine
    g.fillStyle(0xf4f0e4, 1).fillRect(-15, 16, 30, 10);                            // the cuff
    g.fillStyle(INK, 1).fillRect(-15, 19, 30, 2);
  }
  function fist(g, col) {
    g.fillStyle(INK, 1).fillRoundedRect(-18, -18, 36, 34, 9).fillRect(-14, 14, 28, 14);
    g.fillStyle(col, 1).fillRoundedRect(-16, -16, 32, 30, 8);
    g.fillStyle(INK, 0.55); for (let i = 0; i < 3; i++) g.fillRect(-8 + i * 8, -16, 2, 12);   // the knuckle lines
    g.fillStyle(0xffffff, 0.35).fillRoundedRect(-12, -12, 10, 8, 3);
    g.fillStyle(0xf4f0e4, 1).fillRect(-12, 14, 24, 10);
  }
  function ball(g) {
    g.fillStyle(INK, 1).fillCircle(0, 0, 12);
    g.fillStyle(0xffffff, 1).fillCircle(0, 0, 10);
    g.fillStyle(INK, 1).fillCircle(0, 0, 3.4).fillCircle(-6, -5, 2.2).fillCircle(6, -5, 2.2).fillCircle(-5, 6, 2.2).fillCircle(5, 6, 2.2);
  }
  // the strip itself: a slanted ink band, edged in the save's colour (dy: split offset for one half, half: -1 top, 1 bottom, 0 whole)
  function band(g, x0, w, hh, edge, half = 0, dx = 0, dy = 0) {
    const sk = 22, top = half > 0 ? 0 : -hh / 2, bot = half < 0 ? 0 : hh / 2, k = v => sk * (-2 * v / hh);
    const P = [{ x: x0 - w / 2 + k(top) + dx, y: top + dy }, { x: x0 + w / 2 + k(top) + dx, y: top + dy }, { x: x0 + w / 2 + k(bot) + dx, y: bot + dy }, { x: x0 - w / 2 + k(bot) + dx, y: bot + dy }];
    g.fillStyle(INK, 0.82).fillPoints(P, true);
    if (half >= 0) g.fillStyle(edge, 0.95).fillRect(x0 - w / 2 - 4 + dx, hh / 2 - 3 + dy, w, 5);
    if (half <= 0) g.fillStyle(edge, 0.95).fillRect(x0 - w / 2 + 26 + dx, -hh / 2 - 3 + dy, w, 4);
  }
  hc2Mix(Match, {
    gkcPop(gk, lv, out, shotName) {
      const P = pop0.call(this, gk, lv, out, shotName);
      if (!P || !GKC_ANIM.on) return P;
      P.v2 = true; P.dur = GKC_ANIM.dur[out] || P.dur;
      const add = o => { P.c.add(o); return o; };
      P.fx = add(this.add.graphics());                                             // stars / shards / trails, redrawn each frame
      if (out === 'save') { P.g1 = add(this.add.graphics()); P.g2 = add(this.add.graphics()); glove(P.g1, P.col); glove(P.g2, P.col); }
      if (out === 'hand') { P.fist = add(this.add.graphics()); fist(P.fist, P.col); P.arcBall = add(this.add.graphics()); ball(P.arcBall); }
      if (out === 'beaten') {
        P.ball = add(this.add.graphics()); ball(P.ball); P.band2 = this.add.graphics(); P.c.addAt(P.band2, 1);
        P.sh = []; for (let i = 0; i < 16; i++) P.sh.push({ x: (hash(i) - 0.5) * 50, y: (hash(i + 40) - 0.5) * P.bh * 0.8, vx: 380 + hash(i + 80) * 520, vy: (hash(i + 120) - 0.5) * 520, r: hash(i + 160) * 6, vr: (hash(i + 200) - 0.5) * 30, s: 5 + hash(i + 240) * 9 });
      }
      if (P.stamp) P.c.bringToTop(P.stamp);
      P.c.bringToTop(P.cap);
      return P;
    },
    gkcTick(dt) {
      const P = this.gkc;
      if (!P || !P.v2) return tick0.call(this, dt);
      this.gkcChargeTick();
      if (!P.c.scene) { this.gkc = null; return; }
      if (this.replay || this.penaltyMode || this.over) { this.gkcEnd(); return; }
      if (this.paused) { P.c.setVisible(false); return; }
      P.c.setVisible(true); P.t += dt;
      if (P.t > P.dur) { this.gkcEnd(); return; }
      P.lines.clear(); P.wave.clear(); P.crack.clear(); P.fx.clear(); P.band.clear();
      const k = P.out === 'save' ? this.gkcAnimClap(P) : P.out === 'hand' ? this.gkcAnimSwat(P) : this.gkcAnimSmash(P);
      P.c.setPosition(Math.round(VIEW_W / 2 + Math.sin(P.t * 97) * k), Math.round(VIEW_H * GK_COUNTER.y + Math.cos(P.t * 83) * k * 0.6));
    },
    // ---------- SAVED: GLOVE CLAP
    gkcAnimClap(P) {
      const t = P.t, d = P.dur, bw = P.bw, bh = P.bh, n = P.L.length;
      const CLAP = 0.11, shutT = d - 0.2, sh = cl((t - shutT) / 0.2);             // in: clap at CLAP; out: the gloves close the strip
      const open = t < CLAP ? 0 : 1 - sh * sh;                                    // 0 = gloves together in the middle, 1 = holding the ends
      const spring = t < CLAP ? 0 : back((t - CLAP) / 0.16, 2.6);
      const gx = t < CLAP ? (bw / 2 + 140) * (1 - ease(t / CLAP)) : (bw / 2 + 6) * Math.min(spring, 1.15) * open + 0;
      // the strip: born at the clap, squash and stretch, then squeezed shut by the gloves
      if (t >= CLAP) {
        const st = cl((t - CLAP) / 0.18), hh = bh * (1 + 0.45 * (1 - back(st))) * (sh > 0 ? 1 - sh * 0.3 : 1);
        const w = Math.max(0, 2 * gx - 10);
        if (w > 4) band(P.band, 0, w, hh, P.col);
        if (t < CLAP + 0.07) P.band.fillStyle(0xffffff, 0.9 * (1 - (t - CLAP) / 0.07)).fillRect(-w / 2, -hh / 2, w, hh);
      }
      // the gloves: palms facing, a little tilt, a squeeze pulse while they hold
      const squeeze = t > CLAP + 0.16 && sh === 0 ? Math.sin((t - CLAP) * 26) * 0.04 : 0;
      const tilt = t < CLAP ? 0.35 * (1 - t / CLAP) : 0.12 * Math.sin((t - CLAP) * 14) * (1 - sh);
      P.g1.setPosition(-gx - 8, 4).setRotation(-Math.PI / 2 + 0.2 + tilt).setScale(1.25 + squeeze, 1.25 - squeeze);
      P.g2.setPosition(gx + 8, 4).setRotation(Math.PI / 2 - 0.2 - tilt).setScale(-1.25 - squeeze, 1.25 - squeeze);
      const ga = t > d - 0.05 ? (d - t) / 0.05 : 1; P.g1.setAlpha(ga); P.g2.setAlpha(ga);
      // the clap: stars and a ring out of the middle (and a smaller one when they clap shut)
      const star = (u, big) => { if (u <= 0 || u >= 1) return;
        P.fx.lineStyle(4 * (1 - u) + 1, 0xffffff, 1 - u).strokeCircle(0, 0, 10 + u * (big ? 120 : 60));
        for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + 0.3, r = 18 + u * (big ? 110 : 55), s = (big ? 9 : 6) * (1 - u);
          const x = Math.cos(a) * r * 1.6, y = Math.sin(a) * r * 0.55; P.fx.fillStyle(i % 2 ? P.col : 0xffde1e, 1 - u)
            .fillTriangle(x - s, y, x + s, y, x, y - s * 1.6).fillTriangle(x - s, y, x + s, y, x, y + s * 1.6); } };
      star((t - CLAP) / 0.32, true); if (sh > 0.85) star((t - shutT - 0.17) / 0.2, false);
      // the name: pops out of the clap, spreads to its spots, then wobbles like jelly in a wave
      P.L.forEach((T, j) => {
        const p = cl((t - CLAP - 0.02 - Math.abs(j - (n - 1) / 2) * 0.01) / 0.14), b = back(p);
        const jel = t > CLAP + 0.14 ? Math.sin((t - CLAP) * 22 - j * 0.7) * Math.exp(-(t - CLAP - 0.14) * 5) : 0;
        const x = T.bx * b * (1 - sh * 0.9), y = jel * 8;
        const sc = (0.2 + 0.8 * b) * (1 + jel * 0.08), a = Math.min(1, p * 4) * (1 - sh);
        T.setPosition(Math.round(x + P.side * 30 * (1 - b)), Math.round(y)).setScale(sc * (1 - sh * 0.6), sc * (1 + sh * 0.3)).setRotation(jel * 0.05).setAlpha(a).clearTint();
        if (t > 0.34 && Math.abs(j / Math.max(1, n - 1) - (((t - 0.34) * 2.4) % 1.4 - 0.2)) < 0.1) T.setTint(0xffffff);   // a shine runs over it
      });
      if (P.por) P.por.setAlpha(0);
      P.cap.setX(0).setAlpha(cl((t - CLAP - 0.1) / 0.08) * (1 - sh));
      return t > CLAP && t < CLAP + 0.12 ? (1 - (t - CLAP) / 0.12) * 5 : 0;      // (the shake of the clap)
    },
    // ---------- PUSHED AWAY: SWAT
    gkcAnimSwat(P) {
      const t = P.t, d = P.dur, s = P.side, bw = P.bw, bh = P.bh, n = P.L.length;
      const outT = d - 0.16, o = cl((t - outT) / 0.16), HIT = 0.26;
      const wi = ease(t / 0.09), hh = bh * (1 - o * o), x0 = s * (bw / 2 + 40) * (1 - wi), w = bw * (0.15 + 0.85 * wi);
      if (hh > 0.5) band(P.band, x0, w, hh, P.col);
      if (t < 0.12 && hh > 0.5) P.band.fillStyle(0xffffff, 0.85 * (1 - t / 0.12)).fillRect(x0 - w / 2, -hh / 2, w, hh);
      // the fist: punches up under the strip at the far third, then drops away
      const hx = -s * bw * 0.18, up = t < HIT ? ease((t - HIT + 0.08) / 0.08) : 1 - ease((t - HIT - 0.06) / 0.16);
      P.fist.setPosition(hx, bh / 2 + 60 - up * 62).setRotation(s * -0.25).setScale(1.3).setAlpha(t > HIT - 0.08 ? cl(up * 3) * (1 - o) : 0);
      if (t > HIT - 0.06 && t < HIT + 0.04) { P.fx.lineStyle(3, 0xffffff, 0.8); for (let i = -1; i <= 1; i++) P.fx.lineBetween(hx + i * 14, bh / 2 + 40, hx + i * 14, bh / 2 + 70); }
      // the hit: a burst, then the ball's dotted arc up and over (away from his goal's middle)
      const hu = (t - HIT) / 0.26;
      if (hu > 0 && hu < 1) { P.fx.lineStyle(4 * (1 - hu) + 1, 0xffffff, 1 - hu).strokeEllipse(hx, -6, 30 + hu * 160, 14 + hu * 60);
        for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * 0.4, r = 20 + hu * 70; P.fx.fillStyle(P.col, 1 - hu).fillCircle(hx + Math.cos(a) * r, -6 + Math.sin(a) * r * 0.7, 4 * (1 - hu) + 1); } }
      const au = cl((t - HIT) / 0.4), arc = u => ({ x: hx + -s * u * bw * 0.42, y: -bh / 2 - 8 - Math.sin(u * Math.PI) * 70 + u * 30 });
      if (au > 0) { for (let i = 0; i < 14; i++) { const u = i / 13 * au; if (i % 2) continue; const q = arc(u); P.fx.fillStyle(0xffffff, 0.8 * (1 - o)).fillCircle(q.x, q.y, 2.5); }
        const q = arc(au); P.arcBall.setPosition(q.x, q.y).setRotation(t * 18 * -s).setScale(0.9).setAlpha(1 - o); } else P.arcBall.setAlpha(0);
      // the letters: SLAM in from his side; at the hit they're knocked up in a wave out from the fist, and spring back
      P.L.forEach((T, j) => {
        const k = s > 0 ? n - 1 - j : j, p = cl((t - 0.08 - k * 0.012) / 0.12), b = back(p);
        let x = T.bx, y = 0, sc = 1 + (1 - b) * 1.6, rot = 0;
        const dj = Math.abs(T.bx - hx) / (bw / 2), w0 = t - HIT - dj * 0.09;
        if (w0 > 0) { const sp = Math.sin(w0 * 24) * Math.exp(-w0 * 7) * (1 - dj * 0.5); y -= Math.abs(sp) * 34; rot = sp * 0.35 * (T.bx > hx ? 1 : -1); x += -s * Math.max(0, sp) * 8; }
        T.setPosition(Math.round(x), Math.round(y)).setScale(sc, sc * (1 - o * 0.7)).setRotation(rot).setAlpha(Math.min(1, p * 4) * (1 - o));
        if (w0 > 0 && w0 < 0.1) T.setTint(0xffffff); else T.clearTint();
      });
      if (P.por) { const pi = ease((t - 0.03) / 0.12); P.por.setX(s * (bw / 2 - 30) + s * 160 * (1 - pi)).setAlpha(pi * (1 - o)).setScale(0.9, 0.9 * (1 - o * 0.8)); }
      P.cap.setAlpha(cl((t - 0.3) / 0.08) * (1 - o)).setScale(t > 0.3 && t < 0.4 ? 1.2 - (t - 0.3) * 2 : 1);
      return t > HIT && t < HIT + 0.12 ? (1 - (t - HIT) / 0.12) * 5 : 0;
    },
    // ---------- BEATEN: SMASH
    gkcAnimSmash(P) {
      const t = P.t, d = P.dur, s = P.side, bw = P.bw, bh = P.bh, n = P.L.length;
      const outT = d - 0.16, o = cl((t - outT) / 0.16), HIT = 0.3;
      const dir = s;                                                              // the ball flies from the far side TO his side (into his net)
      const wi = ease(t / 0.09), hh = bh * (1 - o * o), x0 = s * (bw / 2 + 40) * (1 - wi), w = bw * (0.15 + 0.85 * wi);
      const sp = cl((t - HIT) / 0.22), split = ease(sp) * 14;
      const edge = t > HIT ? 0xff2846 : P.col;
      P.band2.clear();
      if (hh > 0.5) { if (t < HIT) band(P.band, x0, w, hh, edge);
        else { band(P.band, x0, w, hh, edge, -1, -dir * split * 0.4, -split); band(P.band2, x0, w, hh, edge, 1, dir * split * 0.4, split);
          P.band.setRotation(-dir * 0.03 * ease(sp)); P.band2.setRotation(dir * 0.03 * ease(sp)); } }
      if (t < 0.12 && hh > 0.5) P.band.fillStyle(0xffffff, 0.85 * (1 - t / 0.12)).fillRect(x0 - w / 2, -hh / 2, w, hh);
      // the ball: rockets in from the far side, through the middle, out past his side
      const bu = (t - HIT + 0.1) / 0.24;
      if (bu > 0 && bu < 1.2) { const bx = dir * (-bw / 2 - 60 + bu * (bw + 120)), by = -4 + Math.sin(bu * 3) * 4;
        for (let i = 1; i <= 6; i++) P.fx.fillStyle(i < 3 ? 0xffffff : 0xff2846, 0.5 * (1 - i / 7)).fillCircle(bx - dir * i * 16, by, 12 - i * 1.4);
        P.ball.setPosition(bx, by).setRotation(t * 30 * dir).setScale(1.2).setAlpha(1); } else P.ball.setAlpha(0);
      // the hole and the shards, flying with the ball
      if (t > HIT) { const u = t - HIT;
        if (u < 0.2) P.fx.fillStyle(0xffffff, 0.9 * (1 - u / 0.2)).fillCircle(0, 0, 20 + u * 200);
        P.sh.forEach((q, i) => { const x = q.x + dir * q.vx * u, y = q.y + q.vy * u + 900 * u * u, r = q.r + q.vr * u, sz = q.s * (1 - o);
          const A = (k2, m2) => ({ x: x + Math.cos(r + k2) * sz * m2, y: y + Math.sin(r + k2) * sz * m2 });
          P.fx.fillStyle(i % 3 ? INK : (i % 2 ? 0xff2846 : P.col), 0.95 * (1 - o)).fillPoints([A(0, 1.2), A(2.3, 1), A(4.1, 0.8)], true); }); }
      // the letters: SLAM in, then tumble off with the ball and fall (the ones nearest the hole first)
      P.L.forEach((T, j) => {
        const k = s > 0 ? n - 1 - j : j, p = cl((t - 0.08 - k * 0.012) / 0.12), b = back(p);
        let x = T.bx, y = 0, sc = 1 + (1 - b) * 1.6, rot = 0, a = Math.min(1, p * 4), tint = null;
        const u = t - HIT - Math.abs(T.bx) / (bw / 2) * 0.08;
        if (u > 0) { const h = hash(T.i + 7); x += dir * (120 + h * 260) * u; y += (-180 - h * 120) * u + 1300 * u * u; rot = dir * (4 + h * 6) * u; a *= cl(1 - u * 1.6); tint = 0xff5050; }
        T.setPosition(Math.round(x), Math.round(y)).setScale(sc).setRotation(rot).setAlpha(a * (1 - o));
        if (tint != null) T.setTint(tint); else T.clearTint();
      });
      if (P.por) { const pi = ease((t - 0.03) / 0.12); P.por.setX(s * (bw / 2 - 30) + s * 160 * (1 - pi)).setAlpha(pi * (1 - o)).setScale(0.9, 0.9 * (1 - o * 0.8));
        if (t > HIT) P.por.setTint(0xff8080).setAngle(s * ease(sp) * 70).setX(P.por.x + s * ease(sp) * 40); }
      if (P.stamp) { const st = back(cl((t - HIT - 0.1) / 0.12)); P.stamp.setScale(2.6 - 1.6 * st).setAlpha(Math.min(1, st * 3) * (1 - o)).setX(0); }
      P.cap.setPosition(0, bh / 2 + 14 + split).setAlpha(cl((t - HIT - 0.16) / 0.08) * (1 - o));
      const land = t - HIT - 0.2; return t > HIT && t < HIT + 0.1 ? 7 : land > 0 && land < 0.14 ? (1 - land / 0.14) * 6 : 0;
    },
  });
})();
