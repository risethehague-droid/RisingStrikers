'use strict';
// HC2 Football · gkstyle.js: SITUATIONAL SAVES - the keeper's save picks its look from the moment (a PREVIEW)
// Luca, 31 Oct 02:39: "different saves with specific animations for different situations for the gk ... against a lob that
// would normally go over, he would leap up cinematically and catch it with one hand ... if the ball is far to the side the
// gk he dives dynamically, the higher the level the more interesting and dynamic ... the selection is automatic as its
// decided based on location parameters we set".
//
// How real football and other games do it: a keeper's technique follows the ball - a dropping lob over his head is taken
// at the top of a backwards leap, often one hand (the "one-handed claim" coaches teach when two can't get there); a ball
// well wide of him gets the full-length "extension dive", a top-corner one the "top hand" across, a low one near him the
// collapse, a close-range shot the starfish. FIFA / EA FC and PES pick the save animation by exactly those inputs (where
// the ball crosses him: side, height, time to get there) and their best keepers get the showier ones; Captain Tsubasa /
// Inazuma Eleven add the after-images, the freeze at the top, the flash on the glove.
//
// So: when a save starts (keeper.js keeperPlan / ball.js gkAerial decide WHAT he does, untouched), gsPick reads the same
// numbers - how far to his side the ball crosses him, how high, whether it's dropping on him - and gives the move a style.
// The style is drawn on his existing PixelLab frames (the base rig: no new art) - a frame order (the one-handed snatch is
// ktip's one-arm reach, then kleap's pull-in and landing), a little lift, after-images, the PixelLab effects, a beat of
// slow motion - by level: EASY plain (as now), NORMAL clean, HARD + after-images and a flash on the glove, RISE WARRIOR +
// the hang at the top, a shake and the name of the save. Off unless GK_STYLE.on (the Lab, the preview).
// The one gameplay change, only with GK_STYLE.on: at HARD / RISE his leap reaches a little higher (GK_STYLE.reach), so a
// lob that just went over him before is now his - Luca's "would normally go over".

const GK_STYLE = {
  on: true,              // on in matches since v0.16.0 (Luca OK'd PR #76, 31 Oct). false = the plain saves of v0.15.
  tier: null,            // the Lab can force a flair level 0-3; null = from the keeper's level (gsTier)
  cut: [0.85, 1.15, 1.45],   // his gkSave (difficulty.js) -> flair level: EASY 0.72 | NORMAL / your keeper 1.0 | HARD 1.27 | RISE 1.63
  reach: [0, 0, 0.12, 0.25], // extra height his leap gets to (m), by flair level
  late: 0.5,             // s: a dive that wide waits until the ball is this far off (keeperPlan's longest flight), then goes
  wide: 2.0,             // m to his side where the ball crosses him: from here a dive is the FLYING STRETCH
  lift: [0, 4, 8, 12],   // px of extra height at the top of a dive / snatch (small: the gloves still meet the ball)
  hang: [0, 0, 0, 0.18], // s of slow motion at the top of a snatch / flying stretch (real time; the match runs at 0.4)
  stop: [0, 0, 0.035, 0.06], // s of hit-stop as the gloves meet it
  ghost: 2,              // after-images from this flair level up
  name: 3,               // the save's name on screen from this flair level up (Luca: the big cut-in covered too much - this is the small line)
};
const GS_NAMES = { snatch: 'SKY SNATCH', flying: 'FLYING STRETCH', top: 'TOP-CORNER STRETCH', scramble: 'LOW SCRAMBLE', wall: 'STARFISH WALL', smother: 'SMOTHER', tip: 'FINGERTIPS' };
const GS_TINT = { snatch: 0xffe28a, flying: 0x9fd8ff, top: 0xc8b0ff, scramble: 0xd8c8a0, wall: 0xffffff, smother: 0xd8c8a0, tip: 0xffe28a };
// the one-handed snatch's frames: [move, frame, share of the time]. ktip (PixelLab batch 16) reaches up and back with ONE
// arm on frames 2-3; kleap's 8-11 bring it into his chest and land him. (ktip-E's frames, 256 x 184, same origin as kleap.)
const GS_SNATCH = [['ktip', 0, 0.13], ['ktip', 1, 0.13], ['ktip', 2, 0.26], ['ktip', 3, 0.1], ['kleap', 8, 0.1], ['kleap', 9, 0.1], ['kleap', 10, 0.09], ['kleap', 11, 0.09]];
const GS_SNATCH_HIT = 2;   // (the frame his glove is at the top on: the contact)
// where his gloves are on ktip's frames (E window; W = mirrored by PixelLab, measured too) - the top glove on 2-3, so a
// ball he snatches sits in that one hand (measured like tools/gk_hands.py: the white glove's centre). Kept apart from
// GK_HANDS so the special save's FINGERTIPS flash (specials.js, the other thread's) is untouched
const GS_HANDS = {
  'ktip-E': [[113, 93], [132, 96], [81, 30], [66, 47], [67, 51], [71, 56], [83, 65], [97, 107]],
  'ktip-W': [[142, 93], [124, 96], [174, 30], [189, 47], [188, 51], [184, 56], [172, 65], [158, 107]],
};

// a keeper starting a save: mark it, gsPick gives it a style on his next draw (by then the save code has set its kind)
const _gsSetState = Player.prototype.setState;
Player.prototype.setState = function (s, t) {
  _gsSetState.call(this, s, t);
  if (this.keeper) { this.gs = null; if (s === 'dive' || s === 'catch') { const b = this.m.ball; this.gsNew = true; this.gsB = { lob: !!b.lob, vz: b.vz, vx: b.vx, x: b.x, y: b.y, z: b.z }; } }   // (the ball as he goes: a catch clears b.lob before gsPick reads it)
};
const _gsDraw = Player.prototype.draw, _gsHandBall = Player.prototype.handBall, _gsHandPoint = Player.prototype.handPoint;
Player.prototype.draw = function () {
  if (!this.keeper || !GK_STYLE.on) { this.gs = null; this.gsNew = false; return _gsDraw.call(this); }
  if (this._gsT) { this._gsT = false; this.spr.setScale(1); }
  if (this.gsNew) { this.gsNew = false; this.gs = this.rig ? null : this.m.gsPick(this); }
  const g = this.gs;
  if (g && (this.rig || this.sentOff || this.m.replay || (this.state !== 'dive' && this.state !== 'catch'))) { this.m.gsEnd(this, g); this.gs = null; }
  if (!this.gs) return _gsDraw.call(this);
  this._gsHold = true; _gsDraw.call(this); this._gsHold = false;              // (his frame / lift are set below: the ball goes in his gloves after that)
  this.m.gsShow(this, g);
  _gsHandBall.call(this);
};
Player.prototype.handBall = function () { if (this._gsHold) return; return _gsHandBall.call(this); };
Player.prototype.handPoint = function () {
  const s = this.spr, f = s.frame, mm = this.gs && /^(.*)-(\d+)$/.exec((f && f.name) || ''), T = mm && GS_HANDS[mm[1]], pt = T && T[+mm[2]];
  if (!pt) return _gsHandPoint.call(this);
  const q = sprPt(s, pt); return { x: Math.round(q.x), y: Math.round(q.y), behind: false, move: mm[1] };
};

// the gloves meet the ball (keeper.js keeperTouch decided what his touch does): the style's contact moment
const _gsTouch = Match.prototype.keeperTouch;
hc2Mix(Match, {
  keeperTouch(p, pbx) {
    const r = _gsTouch.call(this, p, pbx);
    if (r && p.gs && !p.gs.hit) this.gsHit(p, p.gs, r);
    return r;
  },
  // flair level 0-3: the Lab's override, else his level (the computer's keeper: its difficulty; yours: the match's)
  gsTier(k) {
    if (GK_STYLE.tier != null) return GK_STYLE.tier;
    const q = (this.isHuman && this.hasHuman && this.hasHuman(k.team) ? diffK(DIFF_LEVEL) : this.dk(k.team)).gkSave, C = GK_STYLE.cut;
    return q < C[0] ? 0 : q < C[1] ? 1 : q < C[2] ? 2 : 3;
  },
  // his leap's extra reach (keeper.js: the 'leave' line, gkLeap, keeperTouch's hands-up box) - 0 unless on
  gsReach(k) { return GK_STYLE.on && k ? GK_STYLE.reach[this.gsTier(k)] || 0 : 0; },
  // a dive well wide of him: he stays set and goes as late as the dive allows (fly is capped at 0.5 s in keeperPlan, so he
  // still gets just as far), so he's at full stretch as the ball arrives - he used to fly at once and lie on the grass
  // waiting for it (real keepers: "set, then explode"; FIFA / PES time the dive's peak to the ball). 0 change to his reach.
  // Not against a special (those are the special-save thread's: a Lab check, SX4, showed the wait changing a combo's result)
  gsLate(k, ady, left) { return GK_STYLE.on && !this.ball.special && ady >= GK_STYLE.wide && left > GK_STYLE.late && this.gsTier(k) >= 1; },
  // which save is this? The numbers the save was decided on: where it crosses him (side, height), dropping or not
  gsPick(k) {
    const b = this.ball, tier = this.gsTier(k); if (!tier) return null;
    const sv = b.save && b.save.gk === k ? b.save : null, kind = k.saveKind || '';
    const B = k.gsB || b, tA = Math.abs(k.x - B.x) / Math.max(Math.abs(B.vx), 0.5), vzA = B.vz - G * Math.min(tA, 1.5);
    const drop = !!B.lob || vzA < -1.5;                                         // coming DOWN on him: a lob, a chip, a looping header
    const side = sv ? Math.abs(sv.y - k.y) : Math.abs(B.y - k.y), z = sv ? sv.z : B.z;
    let n = null;
    if (k.state === 'catch') n = k.claimHigh && z > 2.0 ? 'snatch' : null;    // (ball.js gkAerial: the high claim - over his head: the one-hander)
    else if (kind === 'leap') n = drop || tier >= 3 ? 'snatch' : null;
    else if (kind === 'tip') n = 'tip';
    else if (kind === 'diveHigh') n = side >= GK_STYLE.wide - 0.4 ? 'top' : 'flying';
    else if (kind === 'dive') n = side >= GK_STYLE.wide ? 'flying' : null;
    else if (kind === 'diveLow') n = side >= GK_STYLE.wide ? 'flying' : 'scramble';
    else if (kind === 'block') n = 'wall';
    else if (kind === 'smother') n = 'smother';
    if (!n) return null;
    const g = { n, tier, t0: this.time.now, age: 0, len: k.state === 'catch' ? 0.6 : k.diveLen || 0.85, fly: k.state === 'catch' ? 0.05 : k.diveFly || 0.3, d: k.team.side > 0 ? 'E' : 'W', z, side };
    if (n === 'snatch') g.seq = GS_SNATCH;
    if (k.state === 'catch' || k.hands) g.caught = true;                        // (already in his hands: ball.js gkAerial's high claim takes it as he goes up)
    this.gsLast = { n, tier, kind, side: +side.toFixed(2), z: +z.toFixed(2), drop };   // (the Lab's readout)
    // take-off: dust off his boots, a whoosh on the long ones
    const X = wx(k.x, k.y), Y = wy(k.y), D = Y + 1;
    if (n !== 'wall') this.rigPop('dust', X, Y - 4, D, { s: [0.4, tier >= 2 ? 1.3 : 1], ms: 320, a: 0.85 });
    if (tier >= 2 && (n === 'flying' || n === 'top' || n === 'snatch')) this.rigPop('whoosh', X, Y - 50, D, { s: [0.6, 1.5], ms: 300, tint: GS_TINT[n], flip: g.d === 'W' });
    if (g.caught) this.gsHit(k, g, 'catch');
    return g;
  },
  // every frame of the save: his frame (the snatch), a little lift, the after-images, the hang at the top, the landing
  gsShow(k, g) {
    const s = k.spr, T = GK_STYLE, dt = 1 / 60; g.age += this.slowMo > 0 ? dt * 0.4 : dt;
    const u = clamp(g.age / Math.max(g.len, 0.1), 0, 1), top = clamp(g.fly / Math.max(g.len, 0.1), 0.15, 0.6);
    if (g.seq) {                                                                // the snatch: frame by frame, the contact frame at the top of his leap
      let acc = 0, i = 0; const tot = g.seq.reduce((a, q) => a + q[2], 0);
      const hitAt = g.seq.slice(0, GS_SNATCH_HIT).reduce((a, q) => a + q[2], 0) / tot;   // (where the contact frame starts)
      const v = g.caught ? hitAt + u * (1 - hitAt) : u < top ? u / top * hitAt : hitAt + (u - top) / (1 - top) * (1 - hitAt);   // (a dive's leap: on the contact frame as it arrives; caught already: from the contact frame)
      for (; i < g.seq.length - 1; i++) { acc += g.seq[i][2] / tot; if (v < acc) break; }
      const [mv, f] = g.seq[i], nm = `${mv}-${g.d}`, L = MAN.kits[k.kit].anims[nm];
      if (L && L[f] != null) {
        if (s.anims.isPlaying) s.anims.stop();
        const org = (MAN.kits[k.kit].origins || {})[nm];
        if (org && (k._ox !== org[0] || k._oy !== org[1])) { s.setOrigin(org[0], org[1]); k._ox = org[0]; k._oy = org[1]; }
        if (!s.frame || s.frame.name !== L[f]) s.setFrame(L[f]);
      }
    }
    // the lift: up to the top of his flight, held while he's up, down as he lands (the hit keeps the gloves on the ball)
    const lift = T.lift[g.tier] * (g.n === 'wall' || g.n === 'scramble' || g.n === 'smother' ? 0 : u < top ? Math.sin(Math.PI / 2 * u / top) : Math.max(0, 1 - (u - top) / 0.35));
    if (lift) s.y = Math.round(s.y - lift);
    // the snatch with the ball in his hand: the leap goes up to where he took it - his one glove on the ball as it arrived
    // (ktip's reach is ~2.3 m; a lob taken at 3 m lifts him the rest), then he comes down with it (the picture only: where
    // he stands is the keeper AI's). g.off is fixed on the first frame he has it, then fades out as he lands
    if (g.seq && k.hands) {
      if (!g.off) { const h = this.gsGlove(k), B = g.B0; g.off = h && B ? { x: clamp(B.x - h.x, -70, 70), y: clamp(B.y - h.y, -80, 10) } : { x: 0, y: 0 }; g.offU = u; }
      const f = u <= g.offU + 0.25 ? 1 : clamp(1 - (u - g.offU - 0.25) / 0.45, 0, 1), e = f * f * (3 - 2 * f);
      s.x = Math.round(s.x + g.off.x * e); s.y = Math.round(s.y + g.off.y * e);
    }
    if (g.n === 'wall' && g.hit && g.tier >= 2) { const p = clamp((this.time.now - g.hitAt) / 220, 0, 1), sc = 1 + 0.1 * Math.sin(Math.PI * p); s.setScale(sc); k._gsT = true; }   // (the starfish: big on the hit)
    // the hang: a beat of slow motion as he reaches the top (RISE): the snatch, the full-length dives
    if (!g.hung && T.hang[g.tier] && u >= top * 0.8 && (g.n === 'snatch' || g.n === 'flying' || g.n === 'top') && !this.replay) { g.hung = true; this.slowMo = Math.max(this.slowMo || 0, T.hang[g.tier]); }
    // after-images in the style's colour while he flies (HARD up)
    if (g.tier >= T.ghost && u < top + 0.25 && g.n !== 'wall' && this.time.now - (g.gAt || 0) > 45 && !this.replay) {
      g.gAt = this.time.now;
      const im = this.add.image(s.x, s.y, s.texture.key, s.frame.name).setOrigin(s.originX, s.originY).setRotation(s.rotation).setScale(s.scaleX, s.scaleY).setDepth(s.depth - 0.3).setTintFill(GS_TINT[g.n]).setAlpha(0.42);
      this.tweens.add({ targets: im, alpha: 0, duration: 220, onComplete: () => im.destroy() });
    }
    // the landing: dust where he comes down (a dive / a snatch)
    if (!g.landed && u > top + 0.22 && g.n !== 'wall') { g.landed = true;
      this.rigPop('dust', wx(k.x, k.y), wy(k.y) - 6, wy(k.y) + 1, { s: [0.5, g.tier >= 2 ? 1.6 : 1.2], kx: 1.4, ms: 380, a: 0.9 });
      if (g.tier >= 3) this.cameras.main.shake(120, 0.004); }
  },
  // the gloves meet it: a flash on the glove, the hit-stop, the save's name (RISE)
  gsHit(k, g, res) {
    g.hit = res; g.hitAt = this.time.now; const T = GK_STYLE, b = this.ball, B = k.gsB && g.caught ? k.gsB : b;   // (caught already: where it was as he went for it)
    const X = wx(B.x, B.y), Y = wy(B.y) - 12 - B.z * PX_H, D = wy(k.y) + 1, held = res === 'catch'; g.B0 = { x: X, y: Y };
    this.rigPop('impactBig', X, Y, D, { s: [0.5, 1.2 + 0.3 * g.tier], ms: 240, tint: GS_TINT[g.n] });
    if (g.tier >= 2) this.rigPop('sparkle', X, Y, D, { s: [0.6, 1.6], ms: 380, tint: GS_TINT[g.n] });
    if (g.tier >= 3) { this.rigPop('ring', X, Y, D, { s: [0.5, 2.4], ms: 420, tint: GS_TINT[g.n] }); this.cameras.main.shake(140, 0.005); }
    if (T.stop[g.tier]) this.hitStop = Math.max(this.hitStop || 0, T.stop[g.tier]);
    if (g.tier >= T.name && !this.replay) this.say('', `${GS_NAMES[g.n]}${held ? '!' : ''}`, 0.8);
    if (this.gsLast) this.gsLast.res = res;
  },
  gsGlove(k) {                                                                  // his glove on this frame, on screen (the snatch's table, else GK_HANDS)
    const s = k.spr, f = s.frame, mm = /^(.*)-(\d+)$/.exec((f && f.name) || ''), T = mm && (GS_HANDS[mm[1]] || GK_HANDS[mm[1]]), pt = T && T[+mm[2]];
    return pt ? sprPt(s, pt) : null;
  },
  gsEnd(k, g) { if (k._gsT) { k._gsT = false; k.spr.setScale(1); } },
});
