'use strict';
// HC2 Football · arcadesp.js: the ARCADE specials - the special dribble, combo specials, team signature moves, bigger
// leaps. The co-designer, 28 Oct (Arcade part 2, "the rest": "more specials both ways", "more than human"; the plan is
// design/arcade-specials.md). ARCADE only: every hook here checks paceK().arcade first and does nothing else on CLASSIC
// (no extra dice either), so CLASSIC plays exactly as before. Everything is the computer's too, at its level: not easier.
// It's its own file (loaded after specials.js / teamai.js, before ui.js) so it wraps the moves it needs instead of
// editing them - teamai.js is being reworked by worker-f's smarter AI at the same time.
// How real football and other games do it (words only): Inazuma Eleven's named special dribbles and combo shots by two
// players, Captain Tsubasa's signature shots and twin shot, Mario Strikers' Mega Strike on a full charge, FIFA / PES's
// skill moves (their own input, or one contextual button - the preview has both, the co-designer picks one).
const ASP = {
  dribble: {
    bars: 1,          // costs one bar (a special shot spends them all)
    T: 0.6,           // seconds the move takes (8 PixelLab frames at ~14 fps). The co-designer, 29 Oct: "very slightly
                      // extending the special dribble animations" (was 0.5)
    spin: 0.42,       // the first 42% is the spin: he drifts round the man at vSpin...
    vSpin: 3.5,       // ...m/s, in a beat of slow motion (slow, the sim's slowMo, real seconds)...
    vOut: 11.5,       // ...then the burst: he accelerates to this (more than human: a sprint is 8.8) and comes OUT of it
                      // at that speed, still with the ball - no stop at the end (29 Oct: "smoother into the run").
                      // About 4 m in all; the carrier's own running takes over from there
    slow: 0.16,       // the slow-mo on the spin (real seconds; the sim runs at 0.4 in it)
    look: 6.5,        // the man in front: within this, in a cone ahead of him
    far: 30,          // AUTO (by position): SPECIAL further than this from goal, with a man in front = the dribble
    stun: 1.0,        // the beaten man is out of it this long, no more: he staggers and turns to watch him go (29 Oct:
                      // "defender reaction"); only a man he goes right past (within fallR) is put on the floor
    fallR: 1.4,
    aiCool: 75,       // the computer: at most one every 75 s a side (soak 28 Oct: at 25 s it dribbled ~12 times a match and
                      // never banked the bars for a special shot - 2.3 -> 0.3 a match)...
    aiRate: 0.5,      // ...about this often a second while a man squares up to its carrier - the same at every level (29 Oct:
                      // x the level's sp tilted Hard / Rise against you in the 24-match soak)...
    aiBars: 3,        // ...only from a full meter: 2 bars are left, enough for its special shot (it fires those from 2;
                      // soak 28 Oct: dribbling at 2 left 1, special shots 2.3 -> 1.5 a match)...
    aiZone: [22, 50], // ...and only between 22 and 50 m from their goal (the attacking half, not its own)
  },
  combo: {
    oneTwo: 2.4,      // the 1-2: his pass and the return within this many seconds...
    after: 1.6,       // ...and SPECIAL within this long of the return
    lob: 3.5,         // the lob + volley: SPECIAL (the aerial special) within this long of a team-mate's lob to him
    lv: { 2: { power: 170, pierce: 3, speed: 37 }, 3: { power: 240, pierce: 6, speed: 41 } },   // solo: LV2 140 / 2, LV3 200 / 5
    cut: 1.15,        // the two-portrait cut-in (x the pace's cutK)
  },
  leap: { headZ: 3.4 }, // ARCADE headers / overheads up to 3.4 m (was 3.1; CLASSIC 2.7). "Without overdoing it" - Luca to set
};
PACE.arcade.headZ = ASP.leap.headZ;
// each team's signature names (theme A, colours and elements - the co-designer picked it, 28 Oct; Luca gives the final
// OK): its LV3 shot (instead of RISING PHOENIX), its combo, its special dribble. Colour = the team's own (TEAMS.col).
const TEAM_SP = {
  IS: { shot: 'WHITE COMET', combo: 'TWIN COMET', dribble: 'MIRAGE STEP' },
  IRO: { shot: 'CRIMSON FANG', combo: 'TWIN FANG', dribble: 'EMBER DANCE' },
  USCS: { shot: 'SOLAR FLARE', combo: 'DOUBLE SUN', dribble: 'SUNSPIN' },
  LUC: { shot: 'SAKURA STORM', combo: 'PETAL CYCLONE', dribble: 'BLOSSOM FEINT' },
  THUAS: { shot: 'EMERALD GALE', combo: 'TWIN GALE', dribble: 'LEAF SHADOW' },
  AUC: { shot: 'SCARLET LANCE', combo: 'CROSSED LANCES', dribble: 'PHANTOM CUT' },
};
const teamSp = team => TEAM_SP[team && team.name] || { shot: SP_NAMES[2], combo: 'TWIN STRIKE', dribble: 'SPECIAL DRIBBLE' };
const teamCol = team => (TEAMS[team && team.name] || {}).col || 0xffde1e;
// the special dribble's own button (the BUTTON way): N (arrows set) / O (WASD set), pad LT (6). N is watch mode's
// "mark" key too, but in watch mode nobody plays. SPECIAL keeps the shot everywhere with this one.
Input.map.sdribble = ['KeyN', 'KeyO']; Input.padMap.sdribble = [6];
KICK_HIT.combo = 3;                    // batch 22: the boot meets the ball on frame 3 of the combo strike
KICK_HIT.combo2 = 3;

hc2Mix(Match, {
  aspOn() { return !!paceK().arcade; },
  // ---------- 3. team signature names (specials.js special() asks for its banner name here)
  spNameFor(team, lv) { return this.aspOn() && lv === 3 ? teamSp(team).shot : SP_NAMES[lv - 1]; },

  // ---------- 1. THE SPECIAL DRIBBLE
  aspFront(p) {                                                                   // the man squaring up to him (a cone ahead)
    const side = p.team.side, gx = p.team.goalX; let best = null, bd = ASP.dribble.look;
    const fx = gx - p.x, fy = 34 - p.y, fl = len(fx, fy) || 1;
    for (const o of p.team.opp.players) {
      if (o.sentOff || o.keeper || o.stun > 0) continue;
      const dx = o.x - p.x, dy = o.y - p.y, d = len(dx, dy);
      if (d < bd && (dx * fx + dy * fy) / fl > -0.3 && (dx * side > -1)) { bd = d; best = o; }
    }
    return best;
  },
  aspDribbleCan(p) {
    const b = this.ball;
    return this.aspOn() && p && !p.keeper && b.owner === p && !p.busy() && !this.pending && !this.setPiece && !p.sdrib && this.meterOf(p.team).level() >= ASP.dribble.bars;
  },
  // dir: where he goes (your stick; the computer: round the man towards goal). Spends one bar.
  aspDribble(p, dir) {
    if (!this.aspDribbleCan(p)) return false;
    const D = ASP.dribble, front = this.aspFront(p), side = p.team.side;
    let dx = dir && len(dir.x, dir.y) > 0.2 ? dir.x : side, dy = dir && len(dir.x, dir.y) > 0.2 ? dir.y : 0;
    if (!(dir && len(dir.x, dir.y) > 0.2) && front) {                             // no direction: past the man, on the side with more room
      const lat = front.y - p.y, away = Math.abs(lat) > 0.3 ? -Math.sign(lat) : (p.y < 34 ? 1 : -1);
      dx = side * 0.82; dy = away * 0.57;
    }
    const l = len(dx, dy) || 1; dx /= l; dy /= l;
    const mt = this.meterOf(p.team); mt.e -= D.bars; mt.flash = 0.3; if (mt.level() < 3) mt.risen = false;
    const nm = teamSp(p.team).dribble;
    p.sdrib = { t: 0, x0: p.x, y0: p.y, dx, dy, front, fell: false, gAt: 0, col: teamCol(p.team), name: nm, burst: false, near: 99 };
    p.face = dirIndex(dx, dy); p.setState('sdribble', D.T + 0.02);
    for (const o of p.team.opp.players) if (!o.sentOff && len(o.x - p.x, o.y - p.y) < 6) o.stun = Math.max(o.stun, D.T + 0.1);   // they're left watching it
    this.hitStop = Math.max(this.hitStop || 0, 0.05); this.slowMo = Math.max(this.slowMo || 0, D.slow);   // a beat of slow motion on the spin
    if (this.textures.exists('fx')) for (const k of [-1, 1]) this.rigPop('dust', wx(p.x, p.y) + k * 10, wy(p.y) - 4, wy(p.y) + 0.5, { s: [0.5, 1.2], ms: 360, dy: -8, flip: k > 0 });   // dust kicked up as he plants
    const c = teamCol(p.team); this.cameras.main.flash(90, (c >> 16) & 255, (c >> 8) & 255, c & 255);
    this.say(nm + '!', `${p.team.name} · SPECIAL DRIBBLE`, 1.1); SFX.special(1);
    this.ramiSay('skill', { text: `${nm}!!\nHE'S LEFT HIM FOR DEAD!`, expr: 'laugh' }, 2);
    this.flagReplay(nm + '!');
    const N = this.arcN = this.arcN || { reb: 0, air: 0, rebShots: 0, sp: 0 }; N.dribbles = (N.dribbles || 0) + 1;
    return true;
  },
  // every sim step, after the players moved (match.js sim): the dribble's path, the ball at his feet, the after-images,
  // the man in front going down halfway through; and the history the combos read (who passed to whom, when)
  aspStep(dt) {
    const b = this.ball;
    if (b.owner !== this.aspOwn) { this.aspOwn = b.owner; this.aspOwnT = this.time.now; }
    if (!this.aspOn()) return;
    const D = ASP.dribble;
    for (const p of this.all) {
      const s = p.sdrib; if (!s) continue;
      if (p.state !== 'sdribble' || p.sentOff) { p.sdrib = null; continue; }   // (knocked over / a new state: it stops)
      s.t += dt; const u = clamp(s.t / D.T, 0, 1);
      // speed: the spin drifts at vSpin, the burst accelerates from vSpin to vOut (smooth: eased in, no stop at the end)
      const v = u < D.spin ? D.vSpin : D.vSpin + (D.vOut - D.vSpin) * Math.sin(Math.PI / 2 * (u - D.spin) / (1 - D.spin));
      p.vx = s.dx * v; p.vy = s.dy * v;
      s.px = clamp((s.px ?? s.x0) + p.vx * dt, 1, PITCH_L - 1); s.py = clamp((s.py ?? s.y0) + p.vy * dt, 1, PITCH_W - 1);   // (its own path: p.step's move is overwritten)
      p.x = s.px; p.y = s.py;
      if (b.owner === p) { b.x = p.x + s.dx * 0.7; b.y = p.y + s.dy * 0.7; b.z = 0; b.vx = p.vx; b.vy = p.vy; b.vz = 0; }
      const o = s.front;
      if (o && !o.sentOff) {
        s.near = Math.min(s.near, len(o.x - p.x, o.y - p.y));
        if (!s.fell && u > D.spin) {                                              // the burst: the man in front is beaten
          s.fell = true;
          if (s.near < D.fallR) o.setState('fall', 0.9); else o.setState('hit', 0.55);   // right past him: down; else he staggers
          o.stun = Math.max(o.stun, D.stun); o.cool = Math.max(o.cool || 0, D.stun); o.vx = o.vy = 0;
          if (this.textures.exists('fx')) this.rigPop('impact', wx(o.x, o.y), wy(o.y) - 40, wy(o.y) + 1, { s: [0.6, 1.4], ms: 260, tint: s.col });
        }
        if (s.fell && o.state !== 'fall') o.face = dirIndex(p.x - o.x, p.y - o.y);   // ...and turns to watch him go
      }
      if (!s.burst && u > D.spin) {                                               // the burst: a whoosh, a thump, speed lines
        s.burst = true; SFX.boom(0.45);
        if (this.textures.exists('fx')) this.rigPop('whoosh', wx(p.x, p.y) - s.dx * 30, wy(p.y) - 40, wy(p.y) + 0.6, { s: [0.8, 1.8], ms: 320, tint: s.col, flip: s.dx < 0 });
        this.cameras.main.shake(120, 0.004);
      }
      if (s.burst && !this.replay && p.spr) {                                     // speed lines behind him (code-drawn, like the cut-ins')
        const g = s.lines || (s.lines = this.add.graphics()); g.clear().setDepth(p.spr.depth - 0.4);
        const X = wx(p.x, p.y), Y = wy(p.y) - 40, k = (u - D.spin) / (1 - D.spin);
        g.lineStyle(2, s.col, 0.7 * (1 - k * 0.6));
        for (let i = 0; i < 5; i++) { const off = (i - 2) * 12, ln = 40 + ((i * 37) % 30); g.lineBetween(X - s.dx * 26 + -s.dy * off, Y + off * 0.6, X - s.dx * (26 + ln) + -s.dy * off, Y + off * 0.6); }
      }
      if (!this.replay && p.spr && this.time.now - s.gAt > 40) {                 // after-images in the team's colour (drawing only)
        s.gAt = this.time.now; const sp = p.spr;
        const im = this.add.image(sp.x, sp.y, sp.texture.key, sp.frame.name).setOrigin(sp.originX, sp.originY).setScale(sp.scaleX, sp.scaleY).setDepth(sp.depth - 0.3).setTintFill(s.col).setAlpha(0.5);
        this.tweens.add({ targets: im, alpha: 0, duration: 220, onComplete: () => im.destroy() });
      }
      if (u >= 1) {                                                               // out of it at full speed, straight into the run
        if (s.lines) { const g = s.lines; this.tweens.add({ targets: g, alpha: 0, duration: 160, onComplete: () => g.destroy() }); }
        p.sdrib = null; p.setState('run', 0); p.sprinting = true; p.burst = 0.45; p.touchT = 0;
      }
    }
  },

  // ---------- 2. COMBO SPECIALS
  aspPassLog(p, q, mode) {                                                        // (doPass, wrapped below)
    const L = this.aspPasses = this.aspPasses || []; L.push({ p, q, mode, t: this.time.now }); if (L.length > 4) L.shift();
  },
  aspOneTwo(p) {                                                                  // he passed, got it straight back: the partner
    const L = this.aspPasses || [], C = ASP.combo, now = this.time.now; if (L.length < 2) return null;
    const y = L[L.length - 1], x = L[L.length - 2];
    if (y.q !== p || x.p !== p || x.q !== y.p || y.p.team !== p.team) return null;
    if (y.t - x.t > C.oneTwo * 1000 || now - y.t > (C.after + 1.2) * 1000) return null;
    if (this.ball.owner !== p || now - (this.aspOwnT || 0) > C.after * 1000) return null;
    return y.p;
  },
  aspLobber(p) {                                                                  // a team-mate's lob to him, just now
    const L = this.aspPasses || [], y = L[L.length - 1];
    return y && y.mode === 'lob' && y.q === p && y.p !== p && y.p.team === p.team && this.time.now - y.t < ASP.combo.lob * 1000 ? y.p : null;
  },
  // the special just set up (special() / airSpecial() made the kick): make it the combo - its power, how many men it
  // goes through, its name, the partner's flick, the two-portrait cut-in
  aspCombo(p, partner, lv, kind) {
    const k = this.pending; if (!k || k.p !== p || !ASP.combo.lv[lv]) return false;
    const C = ASP.combo.lv[lv], f = k.info.spF ?? 1, nm = teamSp(p.team).combo;
    k.info.spP = C.power * f; k.info.combo = { lv, partner, kind, pierce: C.pierce };
    if (kind === '12') {
      k.speed = C.speed * (0.7 + 0.3 * f);
      if (MAN.kits[p.kit].anims['combo-E']) { p.kickAnim = 'combo'; p.setState('kick', 8 / kickRate('combo') + 0.05); k.t = (KICK_HIT.combo + 0.6) / kickRate('combo'); }
    }
    if (partner && !partner.sentOff && !partner.busy() && MAN.kits[partner.kit].anims['combo2-E']) {
      partner.face = dirIndex(p.x - partner.x, p.y - partner.y); partner.kickAnim = 'combo2'; partner.setState('kick', 8 / kickRate('combo2') + 0.05);
    }
    this.spName = { p, name: nm };
    this.say(nm + '!', `${p.team.name} · LV${lv} COMBO · #${p.num} + #${partner ? partner.num : '?'}`, 1.5);
    this.ramiSay('skill', { text: `${nm}!!!\nTWO OF THEM AT ONCE!`, expr: 'shock' }, 3);
    this.flagReplay(nm + '!');
    const N = this.arcN = this.arcN || { reb: 0, air: 0, rebShots: 0, sp: 0 }; N.combos = (N.combos || 0) + 1;
    if (!window.__labCutOff) this.cutIn = this.aspCutBuild(p, partner, lv, nm);
    return true;
  },
  aspCutBuild(p, q, lv, nm) {                                                     // the combo's cut-in: both men on the band
    const F = '"Press Start 2P"', D = 9.7e6, o = [], col = teamCol(p.team);
    const add = x => { o.push(x); x.setScrollFactor(0); return x; };
    const por = (pl, mv, i) => { const K = MAN.kits[pl.kit], fr = (K.anims[`${mv}-E`] || K.anims['idle-E'] || K.anims['idle-S'])[i] || K.anims['idle-S'][0];
      const org = K.origins && K.origins[`${mv}-E`];
      return add(this.add.image(0, 0, pl.kit, fr).setOrigin(org ? org[0] : 0.5, org ? org[1] : K.feetY / (K.frameH || 160)).setDepth(D + 4)); };
    const veil = add(this.add.rectangle(0, 0, VIEW_W * 3, VIEW_H * 3, 0x0c0a0e, 1).setOrigin(0.5).setAlpha(0).setDepth(D));
    const band = add(this.add.graphics().setDepth(D + 1)), lines = add(this.add.graphics().setDepth(D + 2));
    const a = por(p, 'combo', 3), b2 = q ? por(q, 'combo2', 3) : null;
    const name = add(this.add.text(0, 0, nm + '!', { fontFamily: F, fontSize: '34px', color: '#ffde1e', stroke: '#0c0a0e', strokeThickness: 8 }).setOrigin(0.5).setDepth(D + 5).setAlpha(0));
    const sub = add(this.add.text(0, 0, `${p.team.name} · LV${lv} COMBO SPECIAL`, { fontFamily: F, fontSize: '12px', color: '#ffffff', stroke: '#0c0a0e', strokeThickness: 5 }).setOrigin(0.5).setDepth(D + 5).setAlpha(0));
    SFX.special(lv); this.cameras.main.shake(180, 0.005);
    return { kind: 'combo', lv, col, t: 0, dur: ASP.combo.cut * paceK().cutK, o, veil, band, lines, a, b2, name, sub };
  },
  aspCutTick(dt) {                                                                // (specials.js cutInTick hands the combo's here)
    const c = this.cutIn; c.t += dt; const t = c.t, W = VIEW_W, H = VIEW_H, z = this.cameras.main.zoom || 1, cx = W / 2, cy = H / 2;
    const at = (obj, x, y, sc = 1) => obj.setPosition(cx + (x - cx) / z, cy + (y - cy) / z).setScale(sc / z);
    const io = clamp(t / 0.18, 0, 1), ein = 1 - Math.pow(1 - io, 3), ko = clamp((t - (c.dur - 0.25)) / 0.25, 0, 1), eout = ko * ko;
    c.veil.setPosition(cx, cy).setScale(1 / z).setAlpha(0.65 * io * (1 - ko));
    const bx = (1 - ein) * W * 1.1 - eout * W * 1.2;
    c.band.clear().setPosition(cx * (1 - 1 / z), cy * (1 - 1 / z)).setScale(1 / z);
    c.band.fillStyle(c.col, 1).fillPoints([{ x: bx, y: H * 0.3 }, { x: bx + W, y: H * 0.22 }, { x: bx + W, y: H * 0.74 }, { x: bx, y: H * 0.82 }], true);
    c.band.fillStyle(0xffde1e, 1).fillPoints([{ x: bx, y: H * 0.28 }, { x: bx + W, y: H * 0.2 }, { x: bx + W, y: H * 0.22 }, { x: bx, y: H * 0.3 }], true)
      .fillPoints([{ x: bx, y: H * 0.82 }, { x: bx + W, y: H * 0.74 }, { x: bx + W, y: H * 0.76 }, { x: bx, y: H * 0.84 }], true);
    c.lines.clear().setPosition(cx * (1 - 1 / z), cy * (1 - 1 / z)).setScale(1 / z).lineStyle(2, 0xffffff, 0.55 * io * (1 - ko));
    for (let i = 0; i < 18; i++) { const yy = H * (0.25 + ((i * 0.618) % 1) * 0.55), ln = 80 + ((i * 97) % 220), xx = W + 150 - ((t * 2400 + i * 173) % (W + 400)); c.lines.lineBetween(xx, yy, xx + ln, yy - ln * 0.08); }
    const sh = t > 0.18 && t < c.dur - 0.25 ? Math.sin(t * 70) * 2 : 0, py = H * 0.84;
    at(c.a, -160 + (W * 0.36 + 160) * ein - eout * W * 0.7 + sh, py, 2.4);       // the striker in front...
    if (c.b2) at(c.b2, -260 + (W * 0.17 + 260) * ein - eout * W * 0.7 - sh, py - 14, 2.1);   // ...his partner just behind
    const ti = clamp((t - 0.12) / 0.12, 0, 1);
    at(c.name, W * 0.7 - eout * W * 0.8, H * 0.45, 1 + (1 - ti) * 1.4); c.name.setAlpha(ti * (1 - ko));
    at(c.sub, W * 0.7 - eout * W * 0.8, H * 0.59, 1); c.sub.setAlpha(clamp((t - 0.25) / 0.15, 0, 1) * (1 - ko));
    if (t >= c.dur || (t > 0.3 && Input.pressed('start'))) this.cutInEnd();
  },
});

// ---------- the wraps: each one does nothing extra on CLASSIC
{
  const P = Match.prototype;
  const doPass0 = P.doPass;
  P.doPass = function (p, dir, mode, to) {                                         // the combos' pass history (no dice, any pace)
    const r = doPass0.call(this, p, dir, mode, to);
    const k = this.pending; if (k && k.p === p) this.aspPassLog(p, k.info.target || null, mode);
    return r;
  };
  const special0 = P.special;
  P.special = function (p) {                                                       // SPECIAL on the ball
    if (this.aspOn() && p && this.ball.owner === p) {
      const toGoal = len(p.team.goalX - p.x, 34 - p.y), front = this.aspFront(p);
      // AUTO (by position): far from goal with a man in front = the special dribble (the preview has both ways)
      if (toGoal > ASP.dribble.far && front && !this.aspOneTwo(p)) return this.aspDribble(p, p === this.human && !this.demo ? Input.axis : null);
      const partner = this.meterOf(p.team).level() >= 2 ? this.aspOneTwo(p) : null;
      const lv = this.meterOf(p.team).level(), ok = special0.call(this, p);
      if (ok && partner) this.aspCombo(p, partner, Math.min(lv, 3), '12');
      else if (ok && lv >= 3) { const c = teamCol(p.team); this.cameras.main.flash(120, (c >> 16) & 255, (c >> 8) & 255, c & 255); }   // a signature shot: its team's colour
      return ok;
    }
    return special0.call(this, p);
  };
  const air0 = P.airSpecial;
  P.airSpecial = function (p, aimAI) {                                             // the lob + volley combo
    const lob = this.aspOn() && this.meterOf(p.team).level() >= 2 ? this.aspLobber(p) : null, lv = this.meterOf(p.team).level();
    const r = air0.call(this, p, aimAI);
    if (lob && this.pending && this.pending.p === p) this.aspCombo(p, lob, Math.min(lv, 3), 'lob');
    return r;
  };
  const release0 = P.releaseKick;
  P.releaseKick = function (k) {                                                   // the combo goes through more men
    const r = release0.call(this, k);
    if (k.info.combo && this.ball.special) { this.ball.pierce = k.info.combo.pierce; this.ball.combo = k.info.combo.lv; }
    return r;
  };
  const human0 = P.controlHuman;
  P.controlHuman = function (dt) {                                                 // the BUTTON way, and nothing else mid-dribble
    const h = this.human;
    if (h && h.sdrib) return;
    if (this.aspOn() && h && Input.pressed('sdribble') && this.ball.owner === h) { if (this.aspDribble(h, Input.axis)) return; if (this.meterOf(h.team).level() < 1) this.say('', 'SP METER EMPTY', 0.6); }
    return human0.call(this, dt);
  };
  const carrier0 = P.carrierAI2;
  P.carrierAI2 = function (p, dt) {                                                // the computer's special dribble
    if (p.sdrib) return;
    if (this.aspOn() && this.aspDribbleCan(p) && !(p.team === this.home && !this.demo && p === this.human)) {
      const front = this.aspFront(p), D = ASP.dribble, toGoal = len(p.team.goalX - p.x, 34 - p.y);
      if (front && len(front.x - p.x, front.y - p.y) < 3.5 && toGoal > D.aiZone[0] && toGoal < D.aiZone[1] && this.meterOf(p.team).level() >= D.aiBars && (p.team.sdribAt ?? -1e9) < this.time.now - D.aiCool * 1000
        && Math.random() < dt * D.aiRate) { p.team.sdribAt = this.time.now; if (this.aspDribble(p, null)) return; }
    }
    return carrier0.call(this, p, dt);
  };
}
{
  const P = Match.prototype, drib0 = P.dribble;
  P.dribble = function (p, dt) { if (p && p.sdrib) return; return drib0.call(this, p, dt); };   // the special dribble carries the ball itself
}
