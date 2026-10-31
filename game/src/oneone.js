'use strict';
// HC2 Football · oneone.js: the 1 V 1 moment (a PREVIEW, Test Lab only for now)
// Luca, 30 Oct 22:22: "special scenario animation/screen effect for 1v1 striker vs goalkeeper. Time should slightly slow
// down and keeper and striker should both glow in auras in the respective colors of their team. The screen should get
// slightly darker, creating a contrast between glowing players and their environments. Create it as a preview first."
//
// How real football and other games do it: a striker is "through on goal" when no defender is goal-side of him and only
// the keeper is left (the same picture the Laws use for DOGSO: distance to goal, direction of play, no defender who can
// still get there). TV slows the replay of exactly that moment; Captain Tsubasa / Inazuma Eleven freeze the pitch and
// light the two duellists up; FIFA / EA FC and PES keep it subtle (a camera push, the crowd going quiet). So here: the
// pitch dims, both men burn in their team colours, the game runs at ~70% - and it ends the moment the duel is settled
// (the keeper has it, a defender gets back, the ball is in the net or the shot has gone by).
// v2, Luca 31 Oct 01:21: "dont make it fully dark but add this dynamic vignette [a manga speed-line burst], make it feel
// intense and dynamic, also the speed should slow down as you get closer to the gk, and if a kick occurs it slows until
// the ball is actually kicked then it shoots speeding up". So: only a light dim; black speed lines close in from the edges
// (redrawn every few frames, so they flicker like a manga panel) and tighten as he nears the keeper; the game slows from
// ~85% at 22 m from the keeper to ~55% at 6 m; while he winds up a shot it drops to ~30% (charging: ~50%), and on the
// contact it snaps back to full speed - the lines blast outwards, a little shake - and the ball flies at real pace.
//
// Off everywhere unless ONE_V_ONE.on (the Lab's 1 V 1 buttons switch it on in FREE PLAY). The match code is untouched:
// this file only wraps Match.sim (the slow-down) and Match.render (the look).

const ONE_V_ONE = {
  on: false,          // the Lab's FREE PLAY buttons set it; nothing in a match does yet
  far: [22, 0.85],    // [m from the keeper, game speed]: the slow-down starts gently...
  close: [6, 0.55],   // ...and deepens as he closes in
  charge: 0.5,        // speed while he holds SHOOT on the ball
  windup: 0.3,        // speed from the kick starting to the boot meeting the ball
  dim: 0.12,          // a light dim (v1 was 0.45: "dont make it fully dark")
  lines: 74,          // speed lines round the screen
  hole: [0.46, 0.3],  // the clear middle (fraction of the screen's half-size): far -> close, it tightens
  near: 32,           // m from goal: closer than this and through = a 1 v 1
  hold: 0.15,         // s the picture must hold before it starts (no flicker on a heavy touch)
  inT: 0.3, outT: 0.45,    // s to fade in / out
  burstT: 0.35,       // s the lines take to blast away once he's struck it
  glow: [3, 7],       // the aura's strength, pulsing between these
  after: 1.3,         // s the effect stays on once he's shot, while the ball travels
};
const V1_D = 7.6e6;   // the effect's depth: above the pitch, stands and players, below the weather (7.9e6), cursor (8e6) and HUD

const _v1Sim = Match.prototype.sim, _v1Render = Match.prototype.render;
hc2Mix(Match, {
  sim(dt) {
    const S = this.v1, k = S && !(this.slowMo > 0) ? S.k : 1;                   // (a chip's own slow motion wins)
    _v1Sim.call(this, dt * k);
    if (k < 1 && !(this.hitStop > 0)) this.anims.globalTimeScale = (this.watch ? this.watch.speed : 1) * k;
  },
  render(dt) {
    _v1Render.call(this, dt);
    this.v1Tick(dt);
  },
  // who's through: the man on the ball, near their goal, no outfield defender goal-side of him or on top of him
  v1Who() {
    const b = this.ball, p = b.owner;
    if (!p || p.keeper || p.sentOff || this.setPiece || this.dead || this.foulScene || this.over || !p.team) return null;
    const opp = p.team === this.home ? this.away : this.home, gk = opp.players[0];
    if (!gk || gk.sentOff || gk.hands) return null;
    const gx = p.team.goalX, s = Math.sign(gx - p.x) || 1, dGoal = len(gx - p.x, 34 - p.y);
    if (dGoal > ONE_V_ONE.near || dGoal < 4) return null;
    for (const q of opp.players) {
      if (q === gk || q.sentOff) continue;
      const d = len(q.x - p.x, q.y - p.y);
      if (d < 1.6) return null;                                                    // he's on him: a tackle, not a 1 v 1
      if ((q.x - p.x) * s > -0.5 && len(gx - q.x, 34 - q.y) < dGoal + 2) return null;   // a defender still between him and goal
    }
    return { p, gk };
  },
  v1Tick(dt) {
    const V = ONE_V_ONE, L = window.__lab;
    const on = V.on && !this.replay && !(L && !(L.run && L.run.sc && L.run.sc.kind === 'free'));   // (the Lab's tests never see it)
    let S = this.v1;
    if (S && !S.veil.scene) S = this.v1 = null;                                    // (the scene was rebuilt)
    const w = on ? this.v1Who() : null;
    if (!S) {
      this.v1Hold = w ? (this.v1Hold || 0) + dt : 0;
      if (!w || this.v1Hold < V.hold) return;
      S = this.v1 = this.v1Start(w.p, w.gk);
    }
    S.t += dt;
    const b = this.ball, V2 = ONE_V_ONE;
    let keep = false;
    if (on && w && w.p === S.p && w.gk === S.gk) { keep = true; S.shotT = 0; }
    else if (on && !b.owner && b.lastP === S.p && !b.inNet) { S.shotT += dt; keep = S.shotT < V2.after; }   // his shot (or a touch past the keeper) still going
    const winding = this.pending && this.pending.p === S.p;
    if (winding) S.wound = true;
    else if (S.wound && !S.burst) { S.burst = S.t; this.cameras.main.shake(140, 0.006); }   // the contact: full speed, the lines blast away
    S.e = clamp(S.e + dt / (keep || winding ? V2.inT : -V2.outT), 0, 1);
    if (!keep && !winding && S.e <= 0) { this.v1End(); return; }
    // the speed: how close he is to the keeper, slower again while he charges / winds up, full pace after the strike
    const d = len(S.p.x - S.gk.x, S.p.y - S.gk.y), c = clamp((V2.far[0] - d) / (V2.far[0] - V2.close[0]), 0, 1);
    S.c = S.burst ? S.c : S.c == null ? c : S.c + (c - S.c) * Math.min(1, dt * 6);
    let tk = V2.far[1] + (V2.close[1] - V2.far[1]) * S.c;
    if (winding) tk = V2.windup; else if (this.charge >= 0 && this.human === S.p && b.owner === S.p) tk = Math.min(tk, V2.charge);
    if (S.burst) tk = 1;
    S.k = S.burst ? 1 : S.k + (1 - (1 - tk) * S.e - S.k) * Math.min(1, dt * (winding ? 14 : 5));   // (eases in; the snap back is instant)
    this.v1Draw(S);
  },
  v1Start(p, gk) {
    const veil = this.add.rectangle(VIEW_W / 2, VIEW_H / 2, VIEW_W * 3, VIEW_H * 3, 0x06040c, 1).setScrollFactor(0).setDepth(V1_D).setAlpha(0);
    const pool = this.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
    const men = [p, gk].map(q => {
      const col = TEAM_COL[q.team.name] ?? (q === p ? 0x28c8e6 : 0xff2878);
      const fx = q.spr.preFX ? q.spr.preFX.addGlow(col, 0, 0, false, 0.1, 12) : null;   // (WebGL only; SAFE MODE's canvas gets the pool of light alone)
      return { q, col, fx };
    });
    CRUMB(`1v1 #${p.num} v the keeper`);
    const lines = this.add.graphics().setScrollFactor(0).setDepth(V1_D + 0.3);      // (under the two men: they always stand out in front of it)
    return { p, gk, t: 0, e: 0, k: 1, c: null, shotT: 0, veil, pool, lines, men, seed: 0, rays: null, rayT: 0 };
  },
  v1Draw(S) {
    const V = ONE_V_ONE, e = S.e * S.e * (3 - 2 * S.e), pulse = 0.5 + 0.5 * Math.sin(S.t * 7);
    S.veil.setAlpha(V.dim * e);
    this.v1Lines(S, e);
    S.pool.clear();
    for (const M of S.men) {
      const q = M.q, s = q.spr;
      s.setDepth(V1_D + 1 + s.depth);                                              // the two of them in front of the veil (draw() set Y this frame)
      if (M.fx) M.fx.outerStrength = (V.glow[0] + (V.glow[1] - V.glow[0]) * pulse) * e;
      const X = wx(q.x, q.y), Y = wy(q.y), k = scaleAt(q.y);          // a pool of light at his feet, in his colour
      S.pool.fillStyle(M.col, 0.22 * e).fillEllipse(X, Y - 2, 64 * k, 20 * k);
      S.pool.fillStyle(M.col, (0.25 + 0.15 * pulse) * e).fillEllipse(X, Y - 2, 38 * k, 12 * k);
    }
    S.pool.setDepth(V1_D + 0.5 + Math.min(...S.men.map(M => wy(M.q.y))) - 1);
    if (this.ballSpr) this.ballSpr.setDepth(V1_D + 1 + this.ballSpr.depth);        // the ball is part of the duel
    if (this.ballSh) this.ballSh.setDepth(V1_D + 1 + this.ballSh.depth);
  },
  // the manga speed-line burst: thin black wedges from beyond the screen's edge to a ragged oval round the middle. A new
  // set of rays every ~70 ms (the flicker that makes it feel alive); the oval tightens as he nears the keeper; after the
  // strike the lines rush outwards and fade
  v1Lines(S, e) {
    const V = ONE_V_ONE, W = VIEW_W, H = VIEW_H, cam = this.cameras.main, z = cam.zoom || 1, g = S.lines, v = cam.worldView;
    const mx = (S.p.x + S.gk.x) / 2, my = (S.p.y + S.gk.y) / 2;                    // the burst centres on the duel (pulled 60% of the way from the screen's middle)
    const dx = clamp((wx(mx, my) - v.x) * z - W / 2, -W * 0.3, W * 0.3), dy = clamp((wy(my) - 30 - v.y) * z - H / 2, -H * 0.3, H * 0.3);
    S.cx = S.cx == null ? dx : S.cx + (dx - S.cx) * 0.15; S.cy = S.cy == null ? dy : S.cy + (dy - S.cy) * 0.15;
    const ox0 = W / 2, oy0 = H / 2, cx = ox0 + S.cx * 0.6, cy = oy0 + S.cy * 0.6;
    if (!S.rays || S.t - S.rayT > 0.07) {
      S.rayT = S.t; S.rays = [];
      for (let i = 0; i < V.lines; i++) S.rays.push({ a: (i + Math.random() * 0.8) / V.lines * Math.PI * 2, r: 0.8 + Math.random() * 0.45, w: 1.5 + Math.random() * Math.random() * 11 });
    }
    const bt = S.burst ? clamp((S.t - S.burst) / V.burstT, 0, 1) : 0, a = 0.9 * e * (1 - bt);
    g.clear().setPosition(ox0 * (1 - 1 / z), oy0 * (1 - 1 / z)).setScale(1 / z);    // (screen-fixed whatever the camera zoom, as the cut-ins)
    if (a <= 0.01) return;
    const hole = (V.hole[0] + (V.hole[1] - V.hole[0]) * (S.c || 0)) * (1 + bt * 1.4) * (1 + 0.03 * Math.sin(S.t * 30));
    const R = Math.hypot(W, H) * 0.75;
    g.fillStyle(0x0c0a0e, a);
    for (const q of S.rays) {
      const ca = Math.cos(q.a), sa = Math.sin(q.a), ix = cx + ca * W / 2 * hole * q.r, iy = cy + sa * H / 2 * hole * q.r * 1.15;
      const ox = cx + ca * R, oy = cy + sa * R, hw = q.w * (1 + bt);
      g.fillTriangle(ix, iy, ox - sa * hw, oy + ca * hw, ox + sa * hw, oy - ca * hw);
    }
  },
  v1End() {
    const S = this.v1; this.v1 = null; this.v1Hold = 0; if (!S) return;
    for (const M of S.men) if (M.fx && M.q.spr.preFX) M.q.spr.preFX.remove(M.fx);
    S.veil.destroy(); S.pool.destroy(); S.lines.destroy();
  },
});
