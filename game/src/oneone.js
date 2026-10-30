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
//
// Off everywhere unless ONE_V_ONE.on (the Lab's 1 V 1 buttons switch it on in FREE PLAY). The match code is untouched:
// this file only wraps Match.sim (the slow-down) and Match.render (the look).

const ONE_V_ONE = {
  on: false,          // the Lab's FREE PLAY buttons set it; nothing in a match does yet
  slow: 0.7,          // the game's speed at full effect ("slightly slow down")
  dark: 0.45,         // how dark the rest of the screen gets
  near: 32,           // m from goal: closer than this and through = a 1 v 1
  hold: 0.15,         // s the picture must hold before it starts (no flicker on a heavy touch)
  inT: 0.35, outT: 0.45,   // s to fade in / out
  glow: [3, 7],       // the aura's strength, pulsing between these
  after: 1.3,         // s the effect stays on once he's shot, while the ball travels
};
const V1_D = 7.6e6;   // the veil's depth: above the pitch, stands and players, below the weather (7.9e6), cursor (8e6) and HUD

const _v1Sim = Match.prototype.sim, _v1Render = Match.prototype.render;
hc2Mix(Match, {
  sim(dt) {
    const S = this.v1, k = S && !(this.slowMo > 0) ? 1 - (1 - ONE_V_ONE.slow) * S.e : 1;   // (a chip's own slow motion wins: it's slower)
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
    const b = this.ball;
    let keep = false;
    if (on && w && w.p === S.p && w.gk === S.gk) { keep = true; S.shotT = 0; }
    else if (on && !b.owner && b.lastP === S.p && !b.inNet) { S.shotT += dt; keep = S.shotT < V.after; }   // his shot (or a touch past the keeper) still going
    S.e = clamp(S.e + dt / (keep ? V.inT : -V.outT), 0, 1);
    if (!keep && S.e <= 0) { this.v1End(); return; }
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
    return { p, gk, t: 0, e: 0, shotT: 0, veil, pool, men };
  },
  v1Draw(S) {
    const V = ONE_V_ONE, e = S.e * S.e * (3 - 2 * S.e), pulse = 0.5 + 0.5 * Math.sin(S.t * 7);
    S.veil.setAlpha(V.dark * e);
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
  v1End() {
    const S = this.v1; this.v1 = null; this.v1Hold = 0; if (!S) return;
    for (const M of S.men) if (M.fx && M.q.spr.preFX) M.q.spr.preFX.remove(M.fx);
    S.veil.destroy(); S.pool.destroy();
  },
});
