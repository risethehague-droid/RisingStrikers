'use strict';
// HC2 Football · skilldrib.js: two new special dribbles - the RAINBOW FLICK and the SHADOW STEP.
// Luca, 31 Oct 2026: "design 2 more dribbles as well - one is a rainbow flick with a rainbow trail effect on the ball and
// the second is called shadow step - interpret it as you will". Test Lab only (SKILL_DRIB below), like the LV2 special
// passes (PR #70), until Luca's OK.
//   RAINBOW FLICK: he rolls the ball up the back of his leg and flicks it over his own head and over the man in front;
//                  it arcs down behind him trailing a band of rainbow colours, and he runs round the man onto it.
//   SHADOW STEP:   he sinks into his own shadow - a dark double of him is left standing, and the man in front lunges at
//                  that - glides round him as a dark blur in a faded purple haze, and steps out of the shadow right
//                  behind his back (Luca's HQ note, 31 Oct: "more like he ends up behind the guy", darker, faded purple).
// How you play them: the special dribble button (N / O, pad LT; arcadesp.js), one bar of SP. Which one is picked BY
// POSITION (Luca, for the keeper's saves the same night: "the selection is automatic ... based on location
// parameters"): a man square in front of you, close = the RAINBOW FLICK over him; a man at an angle, two men near, or
// nobody = the SHADOW STEP (to the side your stick points, else the side with more room). On ARCADE with SKILL_DRIB off (or nobody to beat)
// the button is the co-designer's special dribble, untouched.
// The base rig: no new art. The flick's wind-up is the PixelLab chip (batch 15) played as a quick stab under it; the run
// is his own run / sprint; the trail is Phaser graphics lines in the ball's screen path; the shadow is his own PixelLab
// frame drawn as a tinted silhouette (as arcadesp.js draws its after-images); the puffs are the PixelLab fx atlas
// (dust, ring, impact, sparkle) tinted, through specials.js rigPop.
// How real football and other games do it (words only): the rainbow flick (the "lambreta") of Jay-Jay Okocha and Neymar
// - a heel flick from behind the standing leg over the defender's head - and FIFA / EA FC's five-star skill move of the
// same name; the shadow step is a body feint pushed to fantasy, like Inazuma Eleven's illusion and shadow dribbles where
// the defender tackles an after-image. In real football a skill only works against a man who commits, so both only beat
// the man squaring up to you, and only for a moment; the ball is yours again at the end, with nothing to spare.
let SKILL_DRIB = window.HC2_CHANNEL === 'experimental';   // the Test Lab (lab.js turns it on; FREE PLAY has its own switch)
                                       // and the EXPERIMENTAL game (channel.js, Luca 31 Oct: every new change goes live there
                                       // first); the MAIN game only after Luca's OK
const SKD = {
  bars: 1,                             // what one costs (the special dribble costs 1; 0 would make them plain skill moves)
  look: 6.5,                           // the man in front: within this many m, in a cone ahead of him
  pick: { headOn: 30, close: 4.5, crowd: 4 },   // the RAINBOW FLICK when that man is within headOn° of straight ahead and
                                       // closer than `close` m, with nobody else within `crowd` m; else the SHADOW STEP
  watch: 5,                            // their men within this many m stop to watch it (as for the special dribble)
  rainbow: { flick: 0.26, fly: 0.74, apex: 1.8, past: 2.2, min: 5.0, max: 7.5, round: 1.7, stun: 1.2, fall: 1.2,
             col: [0xff3b3b, 0xff9a2e, 0xffe23a, 0x4ee04e, 0x3aa8ff, 0x4a5cff, 0xb05cff] },
                                       // flick: s on the wind-up (the ball rolls up his leg); fly: s in the air; apex: m;
                                       // it lands `past` m beyond the man (between min / max m from where it started);
                                       // round: m he swings out round the man; stun: s the man stands watching it go over;
                                       // fall: within this many m of the man's feet he's turned and falls; col: the bands, red .. violet
  shadow: { sink: 0.12, glide: 0.34, rise: 0.1, side: 2.0, behind: 1.3, stun: 1.1, lunge: 4.5, dark: 0x0a0412, glow: 0x9a6bff, haze: 0xb48cff },
                                       // sink / glide / rise: s; side: m out to the side as he goes round the man; behind: he
                                       // comes out this many m straight behind the man's back (Luca's HQ note, 31 Oct: "more
                                       // like he ends up behind the guy"); stun: s the man is fooled; lunge: m/s he dives in at
                                       // the double; dark: his silhouette (near black: "make the shadow darker"); glow / haze:
                                       // the violet of the burst and the faded purple round him ("add some faded purple")
};
const SKD_NAMES = { rainbow: 'RAINBOW FLICK!', shadow: 'SHADOW STEP!' };
const SKD_RAMI = { rainbow: ['RAINBOW FLICK!!\nOVER HIS HEAD!', 'A RAINBOW!\nHE\'S HAD HIM THERE!'], shadow: ['SHADOW STEP!\nHE TACKLED A SHADOW!', 'WHERE DID HE GO?!\nA SHADOW STEP!'] };

hc2Mix(Match, {
  // the man squaring up to him: in a cone ahead (his stick, else towards their goal)
  skdFront(p, fx, fy) {
    let best = null, bd = SKD.look;
    for (const o of p.team.opp.players) {
      if (o.sentOff || o.keeper || o.stun > 0) continue;
      const dx = o.x - p.x, dy = o.y - p.y, d = len(dx, dy);
      if (d < bd && (dx * fx + dy * fy) / (d || 1) > 0.2) { bd = d; best = o; }
    }
    return best;
  },
  skdCan(p) {
    const b = this.ball;
    return SKILL_DRIB && p && !p.keeper && b.owner === p && !p.hands && !p.busy() && !this.pending && !this.setPiece && !p.skd && !p.sdrib && this.meterOf(p.team).level() >= SKD.bars;
  },
  // which one, by position (the button's AUTO pick): returns 'rainbow' or 'shadow'
  skdPick(p, dir) {
    const f = this.skdDir(p, dir), o = this.skdFront(p, f.x, f.y);
    if (!o) return this.aspOn && this.aspOn() ? null : 'shadow';                // (nobody to beat on ARCADE: the team's own special dribble)
    const dx = o.x - p.x, dy = o.y - p.y, d = len(dx, dy) || 1, ang = Math.acos(clamp((dx * f.x + dy * f.y) / d, -1, 1)) * 180 / Math.PI;
    const crowd = p.team.opp.players.filter(q => q !== o && !q.sentOff && !q.keeper && len(q.x - p.x, q.y - p.y) < SKD.pick.crowd).length;
    return ang < SKD.pick.headOn && d < SKD.pick.close && !crowd ? 'rainbow' : 'shadow';
  },
  skdDir(p, dir) {                                                                // forward: your stick, else towards their goal
    if (dir && len(dir.x, dir.y) > 0.2) { const l = len(dir.x, dir.y); return { x: dir.x / l, y: dir.y / l }; }
    const gx = p.team.goalX - p.x, gy = (34 - p.y) * 0.4, l = len(gx, gy) || 1; return { x: gx / l, y: gy / l };
  },
  // kind: 'rainbow' / 'shadow' / null (= pick by position); dir: your stick (null: the computer's / the Lab's own way)
  skillDrib(p, kind, dir) {
    if (!this.skdCan(p)) return false;
    kind = kind || this.skdPick(p, dir); if (!kind) return false;
    const f = this.skdDir(p, dir), o = this.skdFront(p, f.x, f.y);
    const mt = this.meterOf(p.team); mt.e -= SKD.bars; mt.flash = 0.3; if (mt.level() < 3) mt.risen = false;   // (back under 3 bars: RISE UP may come again)
    const s = p.skd = { kind, t: 0, x0: p.x, y0: p.y, fx: f.x, fy: f.y, o, gAt: 0, hist: [], done: false };
    // the side he goes round / slips out to: your stick's sideways part, else away from the man's side of him, else more room
    const lat = o ? (o.x - p.x) * -f.y + (o.y - p.y) * f.x : 0, stickLat = dir ? dir.x * -f.y + dir.y * f.x : 0;
    s.side = Math.abs(stickLat) > 0.35 ? Math.sign(stickLat) : Math.abs(lat) > 0.25 ? -Math.sign(lat) : Math.sign((34 - p.y) * f.x) || 1;   // (side +1 moves him along (-fy, fx): towards the middle = more room)
    if (kind === 'rainbow') {
      const R = SKD.rainbow, od = o ? (o.x - p.x) * f.x + (o.y - p.y) * f.y : 3;
      s.dist = clamp(od + R.past, R.min, R.max);
      s.lx = clamp(p.x + f.x * s.dist, 1, PITCH_L - 1); s.ly = clamp(p.y + f.y * s.dist, 1, PITCH_W - 1);   // where it comes down
      p.face = dirIndex(f.x, f.y);
      if (MAN.kits[p.kit].anims[`chip-${DIRS[p.face]}`] || MAN.kits[p.kit].anims['chip-E']) { p.kickAnim = 'chip'; p.setState('kick', R.flick + 0.02); }
      SFX.flick();
    } else {
      const S = SKD.shadow; this.skdShadowAim(p, s);
      p.face = dirIndex(f.x, f.y); p.setState('sdribble', S.sink + S.glide + S.rise + 0.02);   // (the co-designer's spin frames while he's dark; his sprint without them)
      this.skdDouble(p, s);
      if (o) { const dx = p.x - o.x, dy = p.y - o.y, d = len(dx, dy) || 1; o.vx = dx / d * S.lunge; o.vy = dy / d * S.lunge; o.face = dirIndex(dx, dy); }   // he dives in at the double
      SFX.boom(0.35);
    }
    for (const q of p.team.opp.players) if (!q.sentOff && !q.keeper && len(q.x - p.x, q.y - p.y) < SKD.watch) q.stun = Math.max(q.stun, kind === 'rainbow' ? SKD.rainbow.flick + 0.25 : SKD.shadow.sink + 0.1);
    if (o) o.stun = Math.max(o.stun, kind === 'rainbow' ? SKD.rainbow.stun : SKD.shadow.stun);
    this.hitStop = Math.max(this.hitStop || 0, 0.04);
    if (this.textures.exists('fx')) for (const k of [-1, 1]) this.rigPop('dust', wx(p.x, p.y) + k * 10, wy(p.y) - 4, wy(p.y) + 0.5, { s: [0.45, 1.1], ms: 340, dy: -8, flip: k > 0, tint: kind === 'shadow' ? 0x4a3070 : undefined });
    this.say(SKD_NAMES[kind], `${p.team.name} · SPECIAL DRIBBLE`, 1.1); SFX.special(1);
    const lines = SKD_RAMI[kind]; this.ramiSay('skill', { text: lines[Math.floor(Math.random() * lines.length)], expr: 'laugh' }, 2);
    this.flagReplay(SKD_NAMES[kind]);
    this.skdLast = { kind, by: p, o, t0: this.time.now, x0: p.x, y0: p.y, sp0: mt.e + SKD.bars, sp1: mt.e, kept: null, past: null };
    return true;
  },
  // every sim step, after the players moved (match.js sim, through aspStep): his path, the ball, the man in front
  skdStep(dt) {
    for (const p of this.all) {
      const s = p.skd; if (!s) continue;
      const b = this.ball;
      if (b.owner !== p || p.sentOff || this.setPiece || this.dead || (s.kind === 'rainbow' && s.t > SKD.rainbow.flick && p.state === 'fall')) { this.skdEnd(p, false); continue; }   // (tackled, a whistle: it's over)
      s.t += dt;
      if (s.kind === 'rainbow') this.skdRainbow(p, s, dt); else this.skdShadow(p, s, dt);
    }
  },
  skdRainbow(p, s, dt) {
    const R = SKD.rainbow, b = this.ball, o = s.o;
    if (s.t < R.flick) {                                                          // the wind-up: it rolls up the back of his leg
      const u = s.t / R.flick;
      p.vx = p.vy = 0; p.x = s.x0; p.y = s.y0;
      b.x = p.x - s.fx * 0.15 * Math.sin(Math.PI * u); b.y = p.y - s.fy * 0.15 * Math.sin(Math.PI * u) + 0.01; b.z = 0.55 * u * u; b.vx = b.vy = b.vz = 0;
      return;
    }
    if (!s.up) { s.up = true; s.bx0 = b.x; s.by0 = b.y; s.bz0 = b.z; SFX.kick(0.5);   // the flick: off his heel, up over him
      if (o && !o.sentOff) o.face = dirIndex(p.x - o.x, p.y - o.y);
      if (this.textures.exists('fx')) this.rigPop('ring', wx(b.x, b.y), wy(b.y) - 12 - b.z * PX_H, wy(b.y) + 1, { s: [0.3, 1.1], ms: 260, tint: 0xfff6c8 }); }
    const u = clamp((s.t - R.flick) / R.fly, 0, 1);
    // the ball: a high arc from his heel to the landing spot (nobody can head it: it's over the man and coming down behind him)
    b.x = s.bx0 + (s.lx - s.bx0) * u; b.y = s.by0 + (s.ly - s.by0) * u;
    b.z = Math.max(0, s.bz0 * (1 - u) + 4 * R.apex * u * (1 - u)); b.vx = (s.lx - s.bx0) / R.fly; b.vy = (s.ly - s.by0) / R.fly; b.vz = 0; b.roll = (b.roll || 0) + dt * 14;
    // him: round the man on the side he picked (a curve that bulges `round` m out), arriving as it comes down
    const e = Math.min(1, u * 1.04), bul = Math.sin(Math.PI * e) * R.round * s.side;
    const nx = s.x0 + (s.lx - s.x0) * e + -s.fy * bul - s.fx * 0.45 * e, ny = s.y0 + (s.ly - s.y0) * e + s.fx * bul - s.fy * 0.45 * e;
    p.vx = (nx - p.x) / dt; p.vy = (ny - p.y) / dt; p.x = nx; p.y = ny; p.sprinting = true;
    if (p.state !== 'run') p.setState('run', 0);
    p.face = dirIndex(s.fx, s.fy);
    if (o && !o.sentOff && o.state !== 'fall') { o.face = dirIndex(b.x - o.x, b.y - o.y);   // the man watches it go over his head...
      if (!s.fell && u > 0.55 && len(o.x - p.x, o.y - p.y) < R.fall) { s.fell = true; o.setState('hit', 0.5); } }   // ...and is turned as he goes round him
    if (u >= 1) {                                                                 // down at his feet: a little burst of colour, on he goes
      b.z = 0; b.x = p.x + s.fx * 0.55; b.y = p.y + s.fy * 0.45; b.vx = p.vx; b.vy = p.vy;
      SFX.pass();
      if (this.textures.exists('fx')) for (let i = 0; i < 7; i++) { const a = -Math.PI * (0.1 + i / 7 * 0.8);
        this.rigPop('sparkle', wx(b.x, b.y) + Math.cos(a) * 14, wy(b.y) - 10 + Math.sin(a) * 10, wy(b.y) + 1, { s: [0.5, 0.15], ms: 420, dy: -10, tint: R.col[i] }); }
      this.skdEnd(p, true);
    }
  },
  // where the glide goes: round the man's side (c) and out right behind his back (e). Aimed at where he is NOW, every
  // step, so his lunge at the double can't leave you beside him instead of behind him
  skdShadowAim(p, s) {
    const S = SKD.shadow, o = s.o && !s.o.sentOff ? s.o : null, f = { x: s.fx, y: s.fy }, n = { x: -f.y * s.side, y: f.x * s.side };
    const ox = o ? o.x : s.x0 + f.x * 2.4, oy = o ? o.y : s.y0 + f.y * 2.4;
    s.c = { x: ox - f.x * 0.4 + n.x * S.side, y: oy - f.y * 0.4 + n.y * S.side };
    s.e = { x: clamp(ox + f.x * S.behind, 1, PITCH_L - 1), y: clamp(oy + f.y * S.behind, 1, PITCH_W - 1) };
  },
  skdShadow(p, s, dt) {
    const S = SKD.shadow, b = this.ball, o = s.o, T1 = S.sink, T2 = S.sink + S.glide, T3 = T2 + S.rise;
    let nx = s.x0, ny = s.y0;
    if (s.t < T2) this.skdShadowAim(p, s);
    if (s.t >= T1) {                                                              // the glide: out to the side and round, behind the man
      const u = clamp((s.t - T1) / S.glide, 0, 1), e = u * u * (3 - 2 * u), a = 1 - e;
      nx = a * a * s.x0 + 2 * a * e * s.c.x + e * e * s.e.x; ny = a * a * s.y0 + 2 * a * e * s.c.y + e * e * s.e.y;
      if (!s.gone) { s.gone = true; SFX.flick(); }
    }
    if (s.t >= T2) { nx = s.e.x; ny = s.e.y; }
    p.vx = (nx - p.x) / dt; p.vy = (ny - p.y) / dt; p.x = nx; p.y = ny;
    const mvx = p.vx, mvy = p.vy, ml = len(mvx, mvy);
    if (ml > 1) p.face = dirIndex(mvx, mvy);
    b.x = p.x + (ml > 1 ? mvx / ml : s.fx) * 0.55; b.y = p.y + (ml > 1 ? mvy / ml : s.fy) * 0.45; b.z = 0; b.vx = p.vx; b.vy = p.vy; b.vz = 0;
    if (o && !o.sentOff && s.t >= T1 && o.state !== 'fall') o.face = dirIndex(s.dbl ? s.x0 - o.x : p.x - o.x, s.dbl ? s.y0 - o.y : p.y - o.y);   // (he's still looking at the double)
    if (s.t >= T2 && !s.out) {                                                    // out of the shadow behind him: a violet burst, the man turns too late
      s.out = true; SFX.boom(0.5); this.cameras.main.shake(110, 0.004);
      if (this.textures.exists('fx')) { this.rigPop('impact', wx(p.x, p.y), wy(p.y) - 40, wy(p.y) + 1, { s: [0.5, 1.3], ms: 260, tint: S.glow });
        this.rigPop('ring', wx(p.x, p.y), wy(p.y) - 4, wy(p.y) - 0.5, { s: [0.4, 1.6], ms: 380, tint: S.glow, ky: 0.4 }); }
      if (o && !o.sentOff && o.state !== 'fall') { if (len(o.x - s.x0, o.y - s.y0) < 1.6) o.setState('hit', 0.5); o.face = dirIndex(s.x0 - o.x, s.y0 - o.y); }   // (he dived in at the double: he stumbles, still facing the wrong way)
    }
    if (s.t >= T3) {
      p.vx = s.fx * RUN * 1.15; p.vy = s.fy * RUN * 1.15;                       // straight into his run, at pace
      this.skdEnd(p, true);
    }
  },
  skdEnd(p, kept) {
    const s = p.skd; if (!s) return;
    p.skd = null;
    if (kept) { if (p.state !== 'run') p.setState('run', 0); p.sprinting = true; p.burst = 0.45; p.touchT = 0; }
    if (p.spr) { p.spr.setAlpha(1); if (p.spr.isTinted) p.spr.clearTint(); }
    for (const k of ['dbl', 'rim']) if (s[k]) { const d = s[k]; s[k] = null; this.tweens.add({ targets: d, alpha: 0, y: d.y - 18, duration: 240, onComplete: () => d.destroy() }); }
    const L = this.skdLast; if (L && L.by === p && L.kept == null) { L.kept = kept && this.ball.owner === p; L.t1 = this.time.now;
      L.past = L.o ? ((p.x - L.o.x) * s.fx + (p.y - L.o.y) * s.fy) : null; L.dist = len(p.x - s.x0, p.y - s.y0); }
    s.fade = 0.35; this.skdFade = s;                                              // (the rainbow fades out over a moment, not at once)
  },
  // the shadow double: his own frame as a dark silhouette, left where he stood (the man in front goes for that)
  skdDouble(p, s) {
    if (this.replay || !p.spr) return;
    const sp = p.spr;
    s.dbl = this.add.image(sp.x, sp.y, sp.texture.key, sp.frame.name).setOrigin(sp.originX, sp.originY).setScale(sp.scaleX, sp.scaleY).setDepth(sp.depth - 0.2).setTintFill(SKD.shadow.dark).setAlpha(0.95);
    s.rim = this.add.image(sp.x, sp.y + 2, sp.texture.key, sp.frame.name).setOrigin(sp.originX, sp.originY).setScale(sp.scaleX * 1.08, sp.scaleY * 1.05).setDepth(sp.depth - 0.25).setTintFill(SKD.shadow.haze).setAlpha(0.35);   // (a faded purple rim round it)
  },
  // every frame (from specials.js curveTick, after the ball and the men are drawn): what each one shows while it runs
  skdTick(dt) {
    const g = this.skdG || (this.skdG = this.add.graphics());
    g.clear(); if (this.skdHaze) this.skdHaze.clear();
    if (this.replay) return;
    for (const p of this.all) {
      const s = p.skd; if (!s || !p.spr) continue;
      if (s.kind === 'rainbow') this.skdTrailPush(s);
      else this.skdShadowLook(p, s, dt);
    }
    const F = this.skdFade;                                                       // the trail of one that just ended, fading
    if (F && F.kind === 'rainbow') { F.fade -= dt; if (F.fade <= 0) this.skdFade = null; }
    for (const s of [...this.all.map(p => p.skd).filter(Boolean), ...(F && F.fade > 0 ? [F] : [])]) if (s.kind === 'rainbow') this.skdTrailDraw(g, s, s.fade != null ? Math.max(0, s.fade / 0.35) : 1);
  },
  skdTrailPush(s) {
    if (!this.ballSpr || s.t < SKD.rainbow.flick) return;
    s.hist.unshift([this.ballSpr.x, this.ballSpr.y, this.ballSpr.depth]); s.hist.length = Math.min(s.hist.length, 16);
    if (this.textures.exists('fx') && Math.random() < 0.35) { const c = SKD.rainbow.col[Math.floor(Math.random() * 7)];
      this.rigPop('sparkle', this.ballSpr.x + rnd(-8, 8), this.ballSpr.y + rnd(-6, 6), this.ballSpr.depth - 0.05, { s: [0.45, 0.1], ms: 380, dy: 8, tint: c }); }
  },
  // the rainbow: seven bands, red on top to violet underneath, laid along the ball's path on screen and thinning out
  skdTrailDraw(g, s, k) {
    const H = s.hist, C = SKD.rainbow.col, n = H.length; if (n < 2) return;
    g.setDepth(H[0][2] - 0.1);
    for (let j = 0; j < n - 1; j++) {
      const [x0, y0] = H[j], [x1, y1] = H[j + 1], fade = (1 - j / (n - 1)) * k, w = 3.4 * (1 - j / n * 0.5);
      for (let i = 0; i < 7; i++) { const off = (i - 3) * w * 0.95;
        g.lineStyle(w + 0.6, C[i], 0.9 * fade); g.lineBetween(x0, y0 + off, x1, y1 + off * (1 - 0.5 / n)); }
    }
    g.fillStyle(0xffffff, 0.55 * k); g.fillCircle(H[0][0], H[0][1], 4);           // (a bright head on the ball)
  },
  // the shadow: dark and see-through while he's in it, violet after-images and smoke behind him, the double fading
  skdShadowLook(p, s, dt) {
    const S = SKD.shadow, T1 = S.sink, T2 = S.sink + S.glide, sp = p.spr;
    const dark = s.t < T1 ? s.t / T1 : s.t < T2 ? 1 : Math.max(0, 1 - (s.t - T2) / S.rise);
    sp.setTintFill(S.dark).setAlpha(1 - 0.12 * dark);
    if (dark < 0.15) { sp.clearTint(); sp.setAlpha(1); }
    if (dark > 0.05) {                                                            // the faded purple: a soft haze round him and a dark pool at his feet
      const h = this.skdHaze || (this.skdHaze = this.add.graphics()), X = sp.x, Y = sp.y, fl = 0.85 + Math.sin(s.t * 40) * 0.15;
      h.setDepth(sp.depth - 0.35);
      h.fillStyle(0x05020a, 0.5 * dark); h.fillEllipse(X, Y + 2, 56, 16);
      for (const [w, hh, a] of [[84, 156, 0.14], [64, 132, 0.2], [44, 110, 0.26]]) { h.fillStyle(S.haze, a * dark * fl); h.fillEllipse(X, Y - 48, w, hh); }
    }
    if (this.ballSpr) this.ballSpr.setTint(dark > 0.5 ? 0x7a60b0 : 0xffffff);
    if (s.t >= T1 && s.t < T2 && this.time.now - s.gAt > 30) {                    // the blur: violet after-images and a wisp of smoke
      s.gAt = this.time.now;
      const im = this.add.image(sp.x, sp.y, sp.texture.key, sp.frame.name).setOrigin(sp.originX, sp.originY).setScale(sp.scaleX, sp.scaleY).setDepth(sp.depth - 0.3).setTintFill(Math.random() < 0.6 ? S.haze : 0x3a1d6e).setAlpha(0.5);
      this.tweens.add({ targets: im, alpha: 0, duration: 260, onComplete: () => im.destroy() });
      if (this.textures.exists('fx')) this.rigPop('dust', sp.x + rnd(-6, 6), sp.y - rnd(4, 20), sp.depth - 0.25, { s: [0.35, 0.9], ms: 420, dy: -12, tint: Math.random() < 0.5 ? 0x7a52b8 : 0x1a0e2c, a: 0.6 });
    }
    if (s.dbl) { const d = s.dbl;                                                 // the double: held a beat, then it dissolves upwards
      if (s.t > T2 - 0.05) d.setAlpha(Math.max(0, d.alpha - dt * 3)).setY(d.y - dt * 20);
      if (s.rim) s.rim.setAlpha(Math.min(s.rim.alpha, d.alpha * 0.37)).setY(d.y + 2);
      if (this.textures.exists('fx') && Math.random() < 0.3) this.rigPop('dust', d.x + rnd(-8, 8), d.y - rnd(10, 40), d.depth + 0.05, { s: [0.3, 0.6], ms: 300, dy: -12, tint: 0x7a52b8, a: 0.45 }); }
  },
});
{
  const P = Match.prototype;
  // the hooks: the move runs from the end of the players' step (aspStep, match.js sim), and while it runs nobody else
  // moves him or the ball (his controls, the computer's carrier brain, the normal dribble, the ball's physics, a block)
  const asp0 = P.aspStep;
  P.aspStep = function (dt) { if (asp0) asp0.call(this, dt); this.skdStep(dt); };
  const human0 = P.controlHuman;
  P.controlHuman = function (dt, ...a) {
    const h = this.human;                                                         // (t-043: either side's human - this.inp is his source)
    if (h && h.skd) return;
    if (SKILL_DRIB && h && this.inp.pressed('sdribble') && this.ball.owner === h) {
      if (this.skillDrib(h, null, this.inp.axis)) return;
      if (this.meterOf(h.team).level() < SKD.bars) { this.say('', 'SP METER EMPTY', 0.6); return; }   // (otherwise: on to the ARCADE special dribble)
    }
    return human0.call(this, dt, ...a);
  };
  const carrier0 = P.carrierAI2;
  P.carrierAI2 = function (p, dt) { if (p.skd) return; return carrier0.call(this, p, dt); };
  const drib0 = P.dribble;
  P.dribble = function (p, dt) { if (p && p.skd) return; return drib0.call(this, p, dt); };
  const phys0 = P.ballPhysics;
  P.ballPhysics = function (dt) { const o = this.ball.owner; if (o && o.skd) return; return phys0.call(this, dt); };
  const block0 = P.blockSteals;
  P.blockSteals = function (dt) { const o = this.ball.owner; if (o && o.skd) return; return block0.call(this, dt); };
  const curve0 = P.curveTick;
  P.curveTick = function (dt) { curve0.call(this, dt); this.skdTick(dt); };
}
