'use strict';
// HC2 Football · sppass.js: the LV1 SPECIAL PASSES - TORNADO DRILL, BURROW BLAST, ANGEL GLIDE.
// Luca, 30 Oct 2026: "make 3 new passes but make them more exciting with their effects, but also keep them not too
// advanced its still a base rig: a pass that shoots into the ground, rotates and then flies towards the person you
// wanted to pass to; one that burrows into the ground and pops out to the player; and a lob that glides angelically
// towards the person you are passing to (golden ray, small feathers)".
// How they fit: the same chord as t-011's curving passes (SPECIAL held + PASS / THROUGH / LOB, actions.js curveInput),
// in their place. Luca, 31 Oct: "these passes are not level two, they are level 1 and they use one bar" - so with a bar
// in the bank the chord plays these and spends ONE bar (SPP_ON; the Test Lab's CP tests turn it off to keep showing the
// t-011 curlers, which stay as FREE PLAY buttons). Behind CURVE_PASS (core.js): Test Lab only, until Luca's OK.
//   PASS    -> TORNADO DRILL: driven into the grass a step ahead, it spins there, then curls round the man to his feet
//   THROUGH -> BURROW BLAST:  dives into the pitch, a dust trail runs under the grass, it bursts out at the runner
//   LOB     -> ANGEL GLIDE:   floats up into a golden light and glides down onto him, feathers drifting off it
// The base rig: no new art. The wind-up is t-011's PixelLab move; the ball is scripted (b.sx) only while it does its
// trick - nobody can touch it then - and is a normal ball again for the last part (the drill's curl, the burrow's pop,
// the glide's drop onto his chest), so the receive and the defending around it are the game's own. The effects are the
// PixelLab fx atlas (dust, impact, ring, whoosh, sparkle, orb) moved / tinted by code, the t-011 tinted trail, and one
// Phaser graphics beam (the golden ray), as arcadesp.js draws its bands.
// How real football and other games do it (words only): Inazuma Eleven's named special passes and the "dig" moves of
// its burrowing shots, Captain Tsubasa's drive shot that dips into the turf and kicks up, Mario Strikers' charged
// passes; in real football a pass is never untouchable, so the trick is short and the end is a real ball.
const SPP = {
  bars: 1,                            // what one costs: one bar (Luca, 31 Oct: "these are level 1 and they use one bar")
  fxK: 2.2,                           // the fx frames are small (~30 px): every pop's scale x this (the rigs use 0.6-2.4 too)
  drill: { ahead: 2.2, down: 0.14, spin: 0.75, watch: 0.9, arrive: 9, col: [0xffffff, 0xd8f6ff, 0xa8ecff, 0x78dcff, 0x50c8ff, 0x3ca8f0, 0x2c88dc, 0x2468c0, 0x1e4ca0] },
                                      // ahead: m in front of the ball where it bores in; down / spin: s; watch: their men stop
                                      // to look while it spins (as for a special shot); arrive: m/s at his feet when it can't curl
  burrow: { ahead: 1.0, down: 0.14, v: 20, near: 1.6, lead: 0.35, maxT: 2.6, popVz: 5.2, popV: 2.6, puff: 0.05 },
                                      // v: its speed under the grass; it pops out `near` m short of where he'll be in `lead` s,
                                      // jumping up popVz m/s (about 1.4 m) and on at him popV m/s; puff: s between dust clouds
  angel: { apex: 6.5, rise: 0.3, endZ: 1.0, sway: 0.9, T: [1.8, 3.0], feather: 0.07,
           col: [0xffffff, 0xfffbe0, 0xfff3b0, 0xffe680, 0xffd95a, 0xffcc3c, 0xf0b42a, 0xdc9c1e, 0xc08418] },
                                      // up to apex m in the first `rise` of its flight, then a glide down to his chest (endZ);
                                      // sway: m it drifts side to side; T: flight time range (s); feather: s between feathers
};
let SPP_ON = true;                    // the chord plays these (true) or the t-011 curlers (false: the Lab's CP tests). let: the Lab sets it
const SPP_KIND = { ground: 'drill', through: 'burrow', lob: 'angel' };
const SPP_NAMES = { drill: 'TORNADO DRILL!', burrow: 'BURROW BLAST!', angel: 'ANGEL GLIDE!' };
const SPP_RAMI = { drill: 'TORNADO DRILL!\nIT SPINS IN THE GRASS - AND GOES!', burrow: 'BURROW BLAST!\nWHERE DID THE BALL GO?!', angel: 'ANGEL GLIDE!\nIT FLOATS DOWN FROM HEAVEN!' };

hc2Mix(Match, {
  // the chord (actions.js curveInput) asks here first: a bar in the bank = this pass, otherwise false (then the curler, or nothing)
  spPass(p, mode, dir) {
    const mt = this.meterOf(p.team), b = this.ball;
    if (!CURVE_PASS || !SPP_ON || mt.level() < SPP.bars || p.keeper || b.owner !== p || p.busy() || this.pending || this.setPiece) return false;
    this.doPass(p, dir, mode);                                                   // who it goes to: the normal pass's pick
    const k = this.pending; if (!k || k.p !== p) return false;
    const kind = SPP_KIND[mode];
    mt.e -= SPP.bars; mt.flash = 0.3; if (mt.level() < 3) mt.risen = false;      // (back under 3 bars: RISE UP may come again)
    const A = CURVE_MOVE[mode], east = k.tx >= p.x;
    k.info.sp2 = { kind };
    if (MAN.kits[p.kit].anims[`${A}-E`]) { p.face = east ? 0 : 4; p.kickAnim = A; p.setState('kick', 8 / kickRate(A) + 0.05); k.t = (KICK_HIT[A] + 0.6) / kickRate(A); }
    this.say(SPP_NAMES[kind], `${p.team.name} · LV1 SPECIAL PASS`, 1.3);
    this.ramiSay('skill', { text: SPP_RAMI[kind], expr: 'laugh' }, 2);
    SFX.special(1); this.flagReplay(SPP_NAMES[kind]);
    this.spPassLast = { kind, by: p, to: k.info.target, played: false };
    return true;
  },
  // it's left the boot (ball.js releaseKick): the ball is scripted from here (spPassStep) until its trick is done
  spPassLaunch(b, k) {
    const kind = k.info.sp2.kind, q = k.info.target || null, dx = k.tx - b.x, dy = k.ty - b.y, d = len(dx, dy) || 1, ux = dx / d, uy = dy / d;
    const C = SPP[kind], ahead = C.ahead || 0;
    b.sx = { kind, t: 0, ph: 0, q, by: k.p, x0: b.x, y0: b.y, z0: Math.max(b.z, 0.1), ux, uy, tx: k.tx, ty: k.ty, d,
      sx: b.x + ux * ahead, sy: b.y + uy * ahead, puff: 0, T: kind === 'angel' ? clamp(SPP.angel.T[0] + d / 25, SPP.angel.T[0], SPP.angel.T[1]) : 0 };
    Object.assign(b, { target: null, ring: null, lob: false, aimLob: false, vx: 0, vy: 0, vz: 0 });   // (nobody runs at it or duels for it while it does its trick)
    if (kind === 'drill') for (const o of k.p.team.opp.players) o.stun = Math.max(o.stun, C.watch);   // everyone stops to watch it spin
    if (kind === 'angel') { this.spGlow(b, 0xffe680); this.cameras.main.flash(90, 255, 236, 160); }
    if (this.spPassLast) this.spPassLast.played = true;
  },
  // every sim step while b.sx is on (ball.js ballPhysics): moves the ball by script. true = it did this step's moving
  spPassStep(dt) {
    const b = this.ball, S = b.sx;
    if (b.owner || b.inNet || this.dead || this.setPiece) { b.sx = null; return false; }   // (a whistle, a restart: it's over)
    S.t += dt;
    const ox = b.x, oy = b.y, oz = b.z, T = { drill: SPP.drill, burrow: SPP.burrow, angel: SPP.angel }[S.kind];
    const vel = () => { b.vx = (b.x - ox) / dt; b.vy = (b.y - oy) / dt; b.vz = (b.z - oz) / dt; };
    if (S.kind !== 'angel' && S.ph === 0) {                                      // drill + burrow: driven down into the grass
      const f = Math.min(1, S.t / T.down);
      b.x = S.x0 + (S.sx - S.x0) * f; b.y = S.y0 + (S.sy - S.y0) * f; b.z = (S.z0 + 0.5 * Math.sin(Math.PI * f)) * (1 - f); vel();   // (a little hop off the boot, then down)
      if (f >= 1) { S.ph = 1; S.t = 0; this.spPassHitGround(S); }
      return true;
    }
    if (S.kind === 'drill') {                                                     // spinning in the hole it made...
      b.x = S.sx + Math.sin(S.t * 63) * 0.04; b.y = S.sy + Math.cos(S.t * 51) * 0.03; b.z = 0.06 + Math.abs(Math.sin(S.t * 38)) * 0.07;
      b.vx = b.vy = b.vz = 0; b.roll += dt * 55;                                 // (the PixelLab ball's own frames, spun fast)
      if (S.t < T.spin) return true;
      const q = S.q && !S.q.sentOff ? S.q : null;                                 // ...then it goes to him, where he'll be
      let tx = S.tx, ty = S.ty;
      if (q) { const tt = len(q.x - b.x, q.y - b.y) / 20; tx = q.x + q.vx * tt * 0.6; ty = q.y + q.vy * tt * 0.6; }
      // Luca, 31 Oct: "change the tornado so that it shoots to the side of the defender, either side depending on where the
      // person receiving is, and then it shoots at their feet". Out of the spin it goes as the t-011 curler on the grass
      // (ball.js curveSolve, solved from the hole): it sets off wide of the man in the lane on the side your receiver is
      // (curveSolve goes round a man away from the side he stands off the line, and the line runs to the receiver) and
      // bends back into his feet. Nobody in the lane: the curler's natural bend. Nothing solvable: straight at his feet.
      const dx = tx - b.x, dy = ty - b.y, d = len(dx, dy) || 1, ux = dx / d, uy = dy / d;
      const opps = S.by.team.opp.players.filter(o => !o.sentOff).map(o => ({ a: (o.x - b.x) * ux + (o.y - b.y) * uy, l: (o.y - b.y) * ux - (o.x - b.x) * uy, o }));
      const C = curveSolve('ground', d, opps, 1, 0);
      if (C) { const a = C.th * C.s, c = Math.cos(a), sn = Math.sin(a);
        Object.assign(b, { vx: (ux * c - uy * sn) * C.speed, vy: (ux * sn + uy * c) * C.speed, vz: C.vz, cv: -C.k * C.s, rollV: 0.8 * C.speed }); }
      else { const v = solveGround(d, T.arrive, 0.2); Object.assign(b, { vx: ux * v, vy: uy * v, vz: 0.2, rollV: 0.8 * v }); }
      Object.assign(b, { z: 0.05, skid: true, target: q, last: S.by.team, lastP: S.by });
      S.curve = C; if (this.spPassLast) Object.assign(this.spPassLast, { curve: C, from: { x: b.x, y: b.y }, tx, ty });   // (the Lab's readout)
      b.sx = null; this.spPassGo(S, tx, ty);
      return false;                                                              // (this step it flies as a ball)
    }
    if (S.kind === 'burrow') {                                                    // under the grass, homing on him
      const q = S.q && !S.q.sentOff ? S.q : null;
      const gx = q ? q.x + q.vx * T.lead : S.tx, gy = q ? q.y + q.vy * T.lead : S.ty;
      const dx = gx - b.x, dy = gy - b.y, d = len(dx, dy) || 1, st = Math.min(T.v * dt, Math.max(0, d - T.near));
      b.x += dx / d * st; b.y += dy / d * st; b.z = 0; b.vx = b.vy = b.vz = 0;  // (no pace showing: nothing can meet it down there)
      S.dir = { x: dx / d, y: dy / d };
      if (d > T.near + 0.05 && S.t < T.maxT) return true;
      Object.assign(b, { vx: S.dir.x * T.popV, vy: S.dir.y * T.popV, vz: T.popVz, z: 0.05, skid: true, rollV: T.popV, target: q, last: S.by.team, lastP: S.by });
      b.sx = null; this.spPassPop(S);
      return false;
    }
    // angel: up into the light, then a long glide down onto him (his position followed all the way, so it finds him)
    const q = S.q && !S.q.sentOff ? S.q : null, ex = q ? q.x : S.tx, ey = q ? q.y : S.ty, s = Math.min(1, S.t / S.T);
    const e = s * s * (3 - 2 * s), px = -S.uy, py = S.ux, sw = Math.sin(s * Math.PI * 2) * (1 - s) * T.sway;
    b.x = S.x0 + (ex - S.x0) * e + px * sw; b.y = S.y0 + (ey - S.y0) * e + py * sw;
    b.z = s < T.rise ? S.z0 + (T.apex - S.z0) * Math.sin(s / T.rise * Math.PI / 2) : T.endZ + (T.apex - T.endZ) * (1 - Math.pow((s - T.rise) / (1 - T.rise), 1.5));
    vel(); b.roll += dt * 2;                                                     // (a slow, floating turn)
    if (s < 1) return true;
    const dx = ex - b.x, dy = ey - b.y, d = len(dx, dy) || 1;
    Object.assign(b, { vx: dx / d * 1.5, vy: dy / d * 1.5, vz: -1.2, skid: true, rollV: 1.2, target: q, last: S.by.team, lastP: S.by });
    b.sx = null; this.spPassLand(S);
    return false;
  },
  // ---- the looks (PixelLab fx frames moved / tinted by code; screen point of the ball at height z)
  spFx(name, x, y, z, o) {
    if (!this.textures.exists('fx') || this.replay) return null;
    const X = wx(x, y), Y = wy(y) - 12 - z * PX_H, im = this.add.image(X + (o.dx || 0), Y + (o.dy || 0), 'fx', name).setScale((o.s0 ?? 0.5) * SPP.fxK).setAlpha(o.a ?? 1).setDepth(wy(y) + (o.dz ?? 1));
    if (o.tint != null) im.setTint(o.tint);
    const k = SPP.fxK; if (o.sy) im.setScale((o.s0 ?? 0.5) * k, (o.s0 ?? 0.5) * k * o.sy);
    this.tweens.add({ targets: im, scaleX: (o.s1 ?? 1) * k, scaleY: (o.s1 ?? 1) * k * (o.sy || 1), alpha: 0, x: X + (o.mx || 0), y: Y + (o.my || 0), angle: o.rot || 0,
      duration: o.ms || 300, ease: 'Cubic.easeOut', onComplete: () => im.destroy() });
    return im;
  },
  spGlow(b, col) { this.spFx('impact', b.x, b.y, b.z, { s0: 0.4, s1: 1.1, ms: 220, tint: col }); },
  // drill + burrow: the ball hits the grass - a thump, a dust burst, a shake
  spPassHitGround(S) {
    const b = this.ball; SFX.kick(0.8); SFX.boom(0.5);
    this.cameras.main.shake(140, 0.005); this.hitStop = Math.max(this.hitStop || 0, 0.05);
    this.spFx('impactBig', b.x, b.y, 0, { s0: 0.5, s1: 1.3, ms: 260, tint: S.kind === 'burrow' ? 0xc8a070 : 0xd8f6ff });
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; this.spFx('dust', b.x, b.y, 0, { s0: 0.35, s1: 0.8, ms: 420, mx: Math.cos(a) * 34, my: Math.sin(a) * 12 - 8, dz: 2 }); }
    if (S.kind === 'drill') { const w = this.spWhirl || (this.spWhirl = this.add.image(0, 0, 'fx', 'whoosh').setVisible(false)); w.setTint(0xa8ecff).setAlpha(0.9); }
  },
  // drill: the launch out of the spin - a flash, a boom and the t-011 tinted trail (specials.js curveTick) in ice blue
  spPassGo(S, tx, ty) {
    const b = this.ball, c = SPP.drill.col;
    SFX.boom(0.9); SFX.kick(1); this.cameras.main.shake(200, 0.007); this.cameras.main.flash(80, 160, 230, 255);
    this.spFx('impactBig', b.x, b.y, 0.1, { s0: 0.6, s1: 1.7, ms: 260, tint: 0xd8f6ff });
    this.spFx('ring', b.x, b.y, 0, { s0: 0.4, s1: 1.8, ms: 380, tint: 0x78dcff, sy: 0.4, dz: -1 });
    this.cvFx = { t: 0, mode: 'ground', cols: c, hist: [], tx, ty, cam: null };
  },
  // burrow: it bursts out of the pitch in front of him
  spPassPop(S) {
    const b = this.ball; SFX.boom(0.8); SFX.kick(0.7); this.cameras.main.shake(220, 0.008);
    this.spFx('impactBig', b.x, b.y, 0, { s0: 0.6, s1: 1.6, ms: 300, tint: 0xd8b888 });
    this.spFx('ring', b.x, b.y, 0, { s0: 0.4, s1: 1.6, ms: 420, tint: 0xa07848, sy: 0.4, dz: -1 });
    for (let i = 0; i < 7; i++) { const a = -Math.PI * (0.1 + i / 7 * 0.8); this.spFx('dust', b.x, b.y, 0, { s0: 0.4, s1: 0.9, ms: 520, mx: Math.cos(a) * 40, my: Math.sin(a) * 40, dz: 2 }); }
  },
  // angel: it settles onto him in a little shower of light
  spPassLand(S) {
    const b = this.ball; SFX.pass();
    this.spFx('orb', b.x, b.y, b.z, { s0: 0.3, s1: 1.2, ms: 400, a: 0.85 });
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; this.spFx('sparkle', b.x, b.y, b.z, { s0: 0.35, s1: 0.1, ms: 520, mx: Math.cos(a) * 26, my: Math.sin(a) * 20, tint: 0xfff3b0 }); }
  },
  // every frame (from specials.js tickRise, after the ball is drawn): what each trick shows while it runs
  spPassTick(dt) {
    const b = this.ball, S = b.sx, cam = this.cameras.main, live = S && !this.replay && this.ballSpr;
    const w = this.spWhirl, ray = this.spRay;
    const hide = live && S.kind === 'burrow' && S.ph === 1;
    if (hide) { this.ballSpr.setVisible(false); this.ballSh.setVisible(false); this.spHid = true; }
    else if (this.spHid) { this.ballSh.setVisible(true); this.spHid = false; }
    if (w) { const on = live && S.kind === 'drill' && S.ph === 1;               // the drill's whirl: the whoosh swirl turning flat round the ball
      if (on) { w.setVisible(true).setPosition(this.ballSpr.x, this.ballSpr.y + 6).setDepth(this.ballSpr.depth - 0.2).setScale(1.5 + Math.sin(S.t * 30) * 0.12, 0.6).setFlipX(Math.floor(S.t * 24) % 2 === 0).setAngle(Math.sin(S.t * 40) * 8);   // (flat on the grass: flipping fast reads as spinning)
        if ((S.puff -= dt) <= 0) { S.puff = 0.09; const a = Math.random() * Math.PI * 2;
          if (Math.random() < 0.5) this.spFx('ring', b.x, b.y, 0, { s0: 0.25, s1: 0.9, ms: 300, tint: 0x78dcff, sy: 0.35, dz: -1, a: 0.8 }); this.spFx('dust', b.x, b.y, 0, { s0: 0.25, s1: 0.55, ms: 340, mx: Math.cos(a) * 28, my: Math.sin(a) * 10 - 6, dz: 2 });
          this.spFx('sparkle', b.x, b.y, 0.15, { s0: 0.25, s1: 0.05, ms: 260, mx: Math.cos(a + 1) * 22, my: -10 - Math.random() * 14, tint: 0xa8ecff }); }
        if (Math.random() < 0.5) cam.shake(40, 0.0015); }
      else w.setVisible(false); }
    if (live && S.kind === 'burrow' && S.ph === 1 && (S.puff -= dt) <= 0) {       // the burrow: a dust cloud kicked up over it, a line of them behind
      S.puff = SPP.burrow.puff;
      this.spFx('dust', b.x, b.y, 0, { s0: 0.42, s1: 0.75, ms: 650, my: -6, dz: 2, a: 0.95 });
      if (Math.random() < 0.35) cam.shake(50, 0.002);
    }
    const angel = live && S.kind === 'angel';
    if (angel) {                                                                  // the golden ray from the sky onto the ball, and a feather now and then
      const g = ray || (this.spRay = this.add.graphics());
      const X = this.ballSpr.x, Y = this.ballSpr.y, top = cam.worldView.y - 20, fl = 0.85 + Math.sin(S.t * 22) * 0.15;
      g.clear().setVisible(true).setDepth(this.ballSpr.depth - 0.3);
      g.fillStyle(0xffd95a, 0.18 * fl); g.fillTriangle(X - 34, top, X + 34, top, X, Y + 14); g.fillTriangle(X - 34, top, X - 12, Y + 6, X + 12, Y + 6);
      g.fillStyle(0xfff6c8, 0.28 * fl); g.fillTriangle(X - 12, top, X + 12, top, X, Y + 8);
      g.fillStyle(0xffe680, 0.5 * fl); g.fillEllipse(X, Y - 15, 26, 7);                             // the halo
      g.lineStyle(2, 0xfff6c8, 0.9 * fl); g.strokeEllipse(X, Y - 15, 26, 7);
      if ((S.puff -= dt) <= 0) { S.puff = SPP.angel.feather;                     // feathers: small pale-gold sparkles that drift down, swaying
        const side = Math.random() < 0.5 ? -1 : 1, X0 = rnd(10, 26) * side;
        const f = this.add.image(X + X0, Y + rnd(-6, 6), 'fx', 'sparkle').setScale(rnd(0.45, 0.7)).setTint(Math.random() < 0.5 ? 0xffffff : 0xfff3b0).setDepth(this.ballSpr.depth - 0.1).setAngle(rnd(0, 90));
        this.tweens.add({ targets: f, x: X + X0 + side * rnd(10, 26), y: Y + rnd(40, 70), angle: f.angle + side * 160, alpha: 0, duration: rnd(800, 1100), ease: 'Sine.easeInOut', onComplete: () => f.destroy() }); }
      if (!this.cvFx) this.cvFx = { t: 0, mode: 'lob', cols: SPP.angel.col, hist: [], tx: S.tx, ty: S.ty, cam: null };   // (the t-011 trail, in gold)
      this.cvFx.t = Math.min(this.cvFx.t, 0.5);                                    // (it lasts the whole glide)
    } else if (ray) ray.clear().setVisible(false);
  },
});
