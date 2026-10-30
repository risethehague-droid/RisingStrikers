'use strict';
// HC2 Football · specials.js: special shots and special saves: meters, power, rigs, cut scenes, guard
// (split out of game.js in v0.9.5 - load order and lanes: src/README.md)

// ------------------------------------------------------------------ SPECIAL-MOVE ENERGY (v0.7)
// Each side charges a 3-level meter by playing: passes that arrive, time on the ball, shots, winning it back, saves -
// and most of all by conceding (comeback fuel). Every full bar is a level (LV1..LV3); the third one sets off RISE UP.
// Two looks, T switches: BASIC = a clean segmented arcade gauge (fighting-game super meter, 3 stocks, MAX blinks);
// WILD = slanted and striped, it shakes when a bar is nearly full, each level has its own power colour
// (LV1 fire, LV2 electric, LV3 aura) and PixelLab flames climb the bar as it fills.
// SPECIAL (U / B / pad LB) on the ball spends every full bar: LV1 BLAZE SHOT, LV2 THUNDER SHOT, LV3 RISING PHOENIX.
const GUARD_POWER = 0.34, GUARD_SP = [0, 0.5, 0.7, 0.95], GUARD_REGEN = 0.035;   // v0.8 keeper guard: hits, refill per second (after 2.5 s)
const SP_COL = [0x28c8e6, 0xffde1e, 0xff2878];                                         // basic: one colour per level
const SP_HOT = [[0xff7a1e, 0xffde1e, 0xffffff], [0x1e8cff, 0x8ce6ff, 0xffffff], [0x9a28ff, 0xffd84a, 0xfff4b0]];   // wild: fire, electric, aura
const SP_NAMES = ['BLAZE SHOT', 'THUNDER SHOT', 'RISING PHOENIX'];
// v0.8.6 THE POWER SYSTEM (Luca 04:09). Power: a normal hard shot ~60, LV1 100, LV2 140, LV3 200 (keeper special saves the same).
// A special can't be blocked first time: it BLOWS THROUGH defenders (LV1 one, LV2 two, LV3 five), losing power each time
// (LV1 35%, LV2 18%, LV3 none); after that the next man square in front of it can block it. RANGE: LV1 has no long-range
// power (fades past 22 m like any shot), LV2 keeps most of it from their half, LV3 from anywhere (behind halfway it loses
// up to 35%, the further back the more). KEEPER SPECIAL SAVE (same bars): same level = saved; lower level = a chance,
// (save / shot)^3 - LV2 v a full LV3 = 34%, LV1 v LV3 = 13%, LV1 v LV2 = 36%; a weakened shot is easier to stop.
const SP_POWER = [100, 140, 200], SP_PIERCE = [1, 2, 5], SP_PIERCE_LOSS = [0.35, 0.18, 0], SAVE_POWER = [100, 140, 200];
const SAVE_NAMES = ['IRON WALL', 'THUNDER GLOVE', 'RISING SHIELD'];
// t-014 Rami's line for each aerial special (the commentary hook the specials already use)
const AIR_RAMI = { air1: 'AIR BLAZE!\nTHE VOLLEY IS ON FIRE!', tide: 'TIDE CUTTER!\nHE SLIDES IN AND SLICES IT!', air2: 'SKY THUNDER!!\nAN OVERHEAD - UNBELIEVABLE!',
  cyclone: 'CYCLONE HEEL!!\nHE SPINS AND HEELS IT!', air3: 'HE FLIES!!\nTHE PHOENIX!', meteor: 'METEOR DRIVE!!!\nOUT OF THE SKY!' };
// t-011 the curving special pass: the PixelLab move, the banner and the trail colours for each kind (white-hot at the ball)
const CURVE_MOVE = { ground: 'cpass', through: 'cthru', lob: 'clob' };
const CURVE_NAMES = { ground: 'CURLER!', through: 'OUTSIDE CURL!', lob: 'BANANA LOB!' };
const CURVE_COL = { ground: [0xffffff, 0xc8fbff, 0x8cf0ff, 0x3ed8f0, 0x28c8e6, 0x1ea0c8, 0x1e78b4, 0x1e50a0, 0x1e3c8c],
  through: [0xffffff, 0xfff8c8, 0xfff08c, 0xffe65a, 0xffde1e, 0xffc81e, 0xf0aa1e, 0xd28c1e, 0xb46e1e],   // (gold: green and pink vanish on the grass)
  lob: [0xffffff, 0xffe6c8, 0xffbe8c, 0xff965a, 0xff6e3e, 0xf04a2e, 0xd2322e, 0xb41e2e, 0x961e3c] };
// ======================================================================= v0.8.9 ROUGH RIGS (Luca 23 Oct 13:35: "rig 3 cruder new
// animations for 3 new aerial special shots so the game has working moves, same for the saves, make cut scenes for the
// special saves too"). PLACEHOLDERS until the real ones are made in PixelLab: each move is put together from PixelLab
// frames we already have - a frame per key (anim a, frame f) moved / turned / squashed by code (lift = px up, rot = degrees
// as if he faced E, sx / sy = squash) - plus the PixelLab effects (ev), and after-images in the level's colour (ghost).
// hit: the key where the boot (foot) / glove (fist) meets the ball - a point on that frame (x, y of the 128 x 160 E frame).
const RIG_COL = [0xff8c28, 0x50b4ff, 0xbe5aff];
const RIG_BREAK = /^(fall|hit|blasted|slide|dive|dheader|tackle)$/;               // knocked over / a new move: the rig stops
// t-014: a batch 16 move as rig keys - one key per PixelLab frame at the times given (the last time = the end of the
// move), the contact frame marked with where the boot (foot) / glove (fist) is on it: x, y of the E frame in its own
// window (256 x 184 for the aerial specials and most keeper saves, 128 x 160 for the turned dive catch)
function rigSeq(a, ts, hit, pt, fist) {
  const keys = ts.slice(0, -1).map((t, f) => ({ t, a, f }));
  keys.push({ t: ts[ts.length - 1], a, f: ts.length - 2 });
  Object.assign(keys[hit], { hit: true, [fist ? 'fist' : 'foot']: pt });
  return keys;
}
const AIR_TINT = { tide: 0x30d8c8, cyclone: 0xd8f0ff, meteor: 0xffc828 };          // t-014: TIDE teal wave, CYCLONE pale wind, METEOR gold
const GK_BRK = /^(fall|hit|blasted)$/;                                             // t-014: a keeper's special-save move stops only when he's knocked over
const RIGS = {
  // ======================================================================= t-014 THE BATCH 16 MOVES IN PLAY (Luca 24 Oct 05:57: "re pick
  // up the alternate animations for lvl 1 - 2 - 3, make them unique and impactful - make them match to the arc of the ball
  // from passes"; 14:16: "new aerial shots with different names / vibe / animation / effect"). The PixelLab frames
  // (PR #12) replace the v0.8.9 stand-ins: the art carries the pose and most of the body's path, the rig times the frames
  // so the boot meets the ball on the contact frame and lifts him (rise .. riseMax px) to where the ball arrives
  // (airSpecial). Two per level, picked by the ball's arc (airPick). ev / ghost as before; the new three tint the
  // existing PixelLab fx (no new art)
  air1: { name: 'AIR BLAZE', lv: 1, dur: 0.95, col: RIG_COL[0], ghost: [0.06, 0.5], rise: 14, riseMax: 54,
    keys: rigSeq('air1', [0, 0.06, 0.12, 0.18, 0.24, 0.3, 0.36, 0.42, 0.52, 0.62, 0.72, 0.82, 0.95], 7, [196, 92]),
    ev: [{ t: 0, fx: 'dust', at: 'feet', s: [0.4, 1], ms: 320 }, { t: 0.02, fx: 'flame', at: 'feet', s: [0.7, 1.7], ms: 420, dy: -24 },
      { t: 0.42, fx: 'flame', at: 'foot', s: [0.9, 2.3], ms: 380 }, { t: 0.42, fx: 'sparks', at: 'foot', s: [0.7, 2], ms: 360 }, { t: 0.82, fx: 'dust', at: 'feet', s: [0.4, 1], ms: 300 }] },
  tide: { name: 'TIDE CUTTER', lv: 1, dur: 0.78, col: AIR_TINT.tide, ghost: [0.12, 0.45], rise: 0, riseMax: 12,
    keys: rigSeq('tide', [0, 0.07, 0.14, 0.21, 0.28, 0.4, 0.52, 0.64, 0.78], 4, [165, 120]),
    ev: [{ t: 0, fx: 'dust', at: 'feet', s: [0.4, 1], ms: 300 }, { t: 0.14, fx: 'whoosh', at: 'feet', s: [0.6, 1.5], ms: 300, dy: -10, tint: AIR_TINT.tide },
      { t: 0.21, fx: 'dust', at: 'feet', s: [0.6, 1.6], kx: 2, ms: 380 },
      { t: 0.28, fx: 'ring', at: 'foot', s: [0.6, 2.8], kx: 1.7, ky: 0.5, ms: 460, tint: AIR_TINT.tide }, { t: 0.28, fx: 'impactBig', at: 'foot', s: [0.8, 2], ms: 260, tint: 0x9ff8ee },
      { t: 0.28, fx: 'sparkle', at: 'foot', s: [0.7, 1.8], ms: 380, n: 3, sp: 20, tint: AIR_TINT.tide }, { t: 0.34, fx: 'ring', at: 'feet', s: [0.5, 3.4], kx: 2, ky: 0.35, ms: 520, tint: AIR_TINT.tide }] },
  air2: { name: 'SKY THUNDER', lv: 2, dur: 1.2, back: true, bike: true, col: RIG_COL[1], ghost: [0.06, 0.6], rise: 10, riseMax: 50,
    keys: rigSeq('air2', [0, 0.08, 0.16, 0.26, 0.38, 0.48, 0.58, 0.68, 0.78, 0.88, 0.98, 1.08, 1.2], 3, [184, 32]),
    ev: [{ t: 0, fx: 'dust', at: 'feet', s: [0.4, 1], ms: 320 }, { t: 0.08, fx: 'bolt', at: 'body', s: [0.8, 1.4], ms: 240, n: 2, sp: 26 },
      { t: 0.16, fx: 'bolt', at: 'body', s: [0.9, 1.5], ms: 240, n: 2, sp: 30 }, { t: 0.26, fx: 'bolt', at: 'foot', s: [1.2, 2.1], ms: 300, n: 3, sp: 18 },
      { t: 0.26, fx: 'impactBig', at: 'foot', s: [0.8, 2], ms: 260 }, { t: 0.98, fx: 'dust', at: 'feet', s: [0.5, 1.2], ms: 340, shake: [160, 0.006] }] },
  cyclone: { name: 'CYCLONE HEEL', lv: 2, dur: 0.82, col: AIR_TINT.cyclone, ghost: [0.08, 0.5], rise: 8, riseMax: 44,
    keys: rigSeq('cyclone', [0, 0.08, 0.16, 0.24, 0.32, 0.44, 0.56, 0.68, 0.82], 4, [186, 84]),
    ev: [{ t: 0, fx: 'dust', at: 'feet', s: [0.4, 1], ms: 300 }, { t: 0.08, fx: 'whoosh', at: 'body', s: [0.8, 1.8], ms: 320, tint: AIR_TINT.cyclone },
      { t: 0.18, fx: 'ring', at: 'body', s: [0.5, 2.2], kx: 1.5, ky: 0.45, ms: 380, a: 0.8, tint: AIR_TINT.cyclone },
      { t: 0.32, fx: 'whoosh', at: 'foot', s: [1, 2.4], ms: 300, tint: AIR_TINT.cyclone }, { t: 0.32, fx: 'impactBig', at: 'foot', s: [0.8, 2], ms: 260, tint: 0xffffff },
      { t: 0.32, fx: 'ring', at: 'foot', s: [0.6, 2.6], ms: 420, tint: AIR_TINT.cyclone }, { t: 0.68, fx: 'dust', at: 'feet', s: [0.5, 1.2], ms: 320 }] },
  air3: { name: 'PHOENIX', lv: 3, dur: 1.05, col: RIG_COL[2], ghost: [0.08, 0.7], rise: 80, riseMax: 140,
    keys: rigSeq('air3', [0, 0.1, 0.2, 0.32, 0.44, 0.54, 0.64, 0.82, 1.05], 6, [172, 126]),
    ev: [{ t: 0, fx: 'flamePurple', at: 'feet', s: [0.9, 2.4], ky: 1.6, ms: 520, dy: -40 }, { t: 0.04, fx: 'whoosh', at: 'body', s: [0.8, 1.6], ms: 300 },
      { t: 0.36, fx: 'orb', at: 'body', s: [0.6, 2.2], ms: 480, a: 0.8 }, { t: 0.64, fx: 'impactBig', at: 'foot', s: [1, 2.6], ms: 300 },
      { t: 0.64, fx: 'ring', at: 'foot', s: [0.8, 3.4], ms: 420 }, { t: 0.64, fx: 'flamePurple', at: 'foot', s: [1, 2.4], ms: 380 },
      { t: 0.82, fx: 'dust', at: 'feet', s: [0.6, 1.4], ms: 360, shake: [200, 0.008] }] },
  meteor: { name: 'METEOR DRIVE', lv: 3, dur: 1.0, col: AIR_TINT.meteor, ghost: [0.08, 0.72], rise: 30, riseMax: 96,
    keys: rigSeq('meteor', [0, 0.08, 0.18, 0.3, 0.42, 0.54, 0.7, 0.84, 1.0], 5, [152, 34]),
    ev: [{ t: 0, fx: 'flame', at: 'feet', s: [0.8, 2], ky: 1.4, ms: 420, dy: -30, tint: AIR_TINT.meteor }, { t: 0.18, fx: 'orb', at: 'body', s: [0.6, 2], ms: 440, a: 0.7, tint: AIR_TINT.meteor },
      { t: 0.54, fx: 'impactBig', at: 'foot', s: [1, 2.6], ms: 300, tint: AIR_TINT.meteor }, { t: 0.54, fx: 'ring', at: 'foot', s: [0.8, 3.6], ms: 460, tint: AIR_TINT.meteor },
      { t: 0.54, fx: 'sparks', at: 'foot', s: [0.8, 2.2], ms: 380, tint: 0xffe890 },
      { t: 0.72, fx: 'ring', at: 'feet', s: [0.6, 4.4], kx: 1.9, ky: 0.45, ms: 540, tint: AIR_TINT.meteor, shake: [220, 0.009] }, { t: 0.72, fx: 'dust', at: 'feet', s: [0.8, 2], ms: 380 }] },
  // t-014 the keeper's special saves (Luca: "for a lob it can do a leap and grab it, if its straight it does something, if its
  // far to the sides gk does a dynamic leap and catches it"): picked by the shot (gkSpecialMove), started early so the
  // contact frame meets the ball (gkSpecialRoll); their effects are the level's (save1-3 below) from the contact on
  kleap: { name: 'LEAP & SNATCH', gk: true, brk: GK_BRK, dur: 0.88, keys: rigSeq('kleap', [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.36, 0.46, 0.56, 0.66, 0.76, 0.88], 7, [130, 14], true) },
  kblock: { name: 'IRON BLOCK', gk: true, brk: GK_BRK, dur: 1.1, keys: rigSeq('kblock', [0, 0.06, 0.12, 0.18, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1], 3, [208, 86], true) },
  kdivecatchDown: { name: 'FLYING CATCH', gk: true, brk: GK_BRK, dur: 1.06, keys: rigSeq('kdivecatchDown', [0, 0.05, 0.1, 0.16, 0.26, 0.36, 0.46, 0.56, 0.66, 0.76, 0.86, 0.96, 1.06], 3, [60, 156], true) },
  kdivecatchUp: { name: 'FLYING CATCH', gk: true, brk: GK_BRK, dur: 1.06, keys: rigSeq('kdivecatchUp', [0, 0.05, 0.1, 0.16, 0.26, 0.36, 0.46, 0.56, 0.66, 0.76, 0.86, 0.96, 1.06], 3, [66, 4], true) },
  ktip: { name: 'FINGERTIPS', gk: true, brk: GK_BRK, dur: 0.72, keys: rigSeq('ktip', [0, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.72], 2, [185, 42], true) },
  // v0.8.9 stand-in save rigs: their effects / after-images are each level's special-save look (t-014 plays them on the
  // batch 16 moves); the frames are only used by a keeper kit without the batch 16 moves
  save1: { name: 'IRON WALL', dur: 0.8, cy: 0.55, col: RIG_COL[0], keys: [
    { t: 0, a: 'punch', f: 4, sx: 1.18, sy: 1.06, hit: true, fist: [91, 70] }, { t: 0.25, a: 'punch', f: 4, sx: 1.1, sy: 1.02 },
    { t: 0.45, a: 'punch', f: 5 }, { t: 0.62, a: 'kset', f: 5 }, { t: 0.8, a: 'kset', f: 6 }],
    ev: [{ t: 0, fx: 'ring', at: 'body', dx: 30, s: [0.5, 1.1], kx: 0.32, ky: 2.2, ms: 750, tint: 0xffc070 },
      { t: 0.04, fx: 'ring', at: 'body', dx: 38, s: [0.4, 1], kx: 0.3, ky: 2.4, ms: 700, tint: 0xff8c28 },
      { t: 0, fx: 'impactBig', at: 'fist', s: [0.8, 1.8], ms: 260 }, { t: 0, fx: 'sparks', at: 'fist', s: [0.8, 2.2], ms: 380, shake: [180, 0.007] }] },
  save2: { name: 'THUNDER GLOVE', dur: 0.85, cy: 0.55, col: RIG_COL[1], ghost: [0, 0.3], keys: [
    { t: 0, a: 'punch', f: 3, lift: 14, rot: -8, sx: 1.12, sy: 1.04, hit: true, fist: [92, 76] }, { t: 0.15, a: 'punch', f: 4, lift: 18, rot: -4 },
    { t: 0.35, a: 'punch', f: 5, lift: 10 }, { t: 0.55, a: 'punch', f: 6 }, { t: 0.7, a: 'punch', f: 7 }, { t: 0.85, a: 'punch', f: 7 }],
    ev: [{ t: 0, fx: 'impactBig', at: 'fist', s: [1, 2.4], ms: 280 }, { t: 0, fx: 'bolt', at: 'fist', s: [1.1, 1.9], ms: 300, n: 3, sp: 22 },
      { t: 0.12, fx: 'bolt', at: 'fist', s: [0.9, 1.5], ms: 240, n: 2, sp: 30, shake: [200, 0.008] }] },
  save3: { name: 'RISING SHIELD', dur: 1.0, cy: 0.5, col: RIG_COL[2], ghost: [0, 0.5], keys: [
    { t: 0, a: 'diveUp', f: 5, lift: 30, hit: true, fist: [69, 3] }, { t: 0.3, a: 'diveUp', f: 5, lift: 38 },
    { t: 0.5, a: 'punch', f: 3, lift: 26 }, { t: 0.75, a: 'punch', f: 6, lift: 4 }, { t: 1.0, a: 'kset', f: 6 }],
    ev: [{ t: 0, fx: 'orb', at: 'body', s: [1, 3.4], ms: 760, a: 0.75, tint: 0xd090ff }, { t: 0, fx: 'ring', at: 'body', s: [0.8, 3.2], ms: 520 },
      { t: 0.15, fx: 'ring', at: 'body', s: [0.6, 2.6], ms: 480 }, { t: 0.05, fx: 'sparkle', at: 'fist', s: [0.8, 1.8], ms: 420, n: 3, sp: 24, shake: [220, 0.009] }] },
};
function spRange(lv, p) {                                   // how much of its power a special keeps from where it was struck
  const half = (p.x - 52.5) * p.team.side, dGoal = len(p.team.goalX - p.x, 34 - p.y);
  if (lv === 1) return dGoal <= 22 ? 1 : clamp(1 - (dGoal - 22) / 30, 0.25, 1);
  if (lv === 2) return half >= 0 ? (dGoal <= 26 ? 1 : clamp(1 - (dGoal - 26) / 70, 0.7, 1)) : clamp(0.62 + half / 52.5 * 0.42, 0.2, 0.62);
  return half >= 0 ? 1 : 1 - clamp(-half / 52.5, 0, 1) * 0.35;
}
function saveChance(K, P) { return P <= K ? 1 : clamp(Math.pow(K / P, 3), 0.04, 1); }
// v0.8 (Luca): goals give nothing (that would be OP). It refills by itself, passing moves pay (from the 3rd pass in a row each
// pass gives more), winning it back pays a little, and a hard shot the keeper has to save pays the ATTACKER (go and shoot).
// Scaling idea from fighting-game super meters / Captain Tsubasa: steady trickle + bigger chunks for doing the right things.
const SP_GAIN = { regen: 0.015 };   // v0.8.1 (Luca): time only, the same for both sides - one bar about every 67 s of play
let SP_STYLE = (() => { try { return localStorage.getItem('hc2-meter') || 'wild'; } catch (e) { return 'wild'; } })();
function setSpStyle(v) { SP_STYLE = v; try { localStorage.setItem('hc2-meter', v); } catch (e) {} }

class SpMeter {
  constructor(m, idx) {
    this.m = m; this.idx = idx; this.right = idx === 1; this.e = 0; this.shown = 0; this.flash = 0; this.pop = 0; this.t = 0; this.risen = false;
    const F = '"Press Start 2P"';
    this.W = 168; this.H = 12;
    this.x = this.right ? VIEW_W - 26 - this.W : 26; this.y = this.right ? 26 : 106;
    this.g = m.add.graphics();
    this.lab = m.add.text(0, 0, '', { fontFamily: F, fontSize: '8px', color: '#f4f0e4', stroke: '#0c0a0e', strokeThickness: 3 }).setOrigin(this.right ? 1 : 0, 1);
    this.lv = m.add.text(0, 0, '', { fontFamily: F, fontSize: '9px', color: '#ffde1e', stroke: '#0c0a0e', strokeThickness: 4 }).setOrigin(this.right ? 1 : 0, 0.5);
    this.frame = m.textures.exists('meter-wild') ? m.add.image(0, 0, 'meter-wild').setOrigin(0.5) : null;
    this.fl = [];                                                                        // PixelLab flames riding the bar (WILD)
    if (m.textures.exists('fx')) for (let i = 0; i < 9; i++) this.fl.push(m.add.image(0, 0, 'fx', 'flame').setOrigin(0.5, 1).setVisible(false));
    m.hud.add([this.g, ...(this.frame ? [this.frame] : []), ...this.fl, this.lab, this.lv]);
  }
  get team() { return this.idx ? this.m.away : this.m.home; }
  level() { return Math.floor(this.e + 1e-6); }
  reset() { this.e = this.shown = 0; this.risen = false; }
  add(v, src) {
    const m = this.m; if (m.over || m.replay || window.__lab || !(window.HC2_STARTED || m.demo)) return;
    const before = this.level(); this.e = clamp(this.e + (v > 0 ? v * paceK().spGain : v), 0, 3); const after = this.level();   // (arcade-2: ARCADE fills 1.75x - specials and special saves several times a match)
    if (after > before) { this.flash = 0.45; this.pop = 0.9; SFX.level(after); if (after === 3 && !this.risen) { this.risen = true; m.riseQ = this.team; }
      if (SP_STYLE === 'wild') { const u = after / 3, X = this.right ? this.x + this.W - u * this.W : this.x + u * this.W;
        this.burst('sparks', X, this.y + this.H / 2, 0.6, 1.8, 420); if (after >= 2) this.burst('bolt', X, this.y - 6, 0.7, 1.1, 300); } }
  }
  spend() { const n = this.level(); if (n < 1) return 0; this.e -= n; this.risen = false; this.flash = 0.3; return n; }
  burst(name, x, y, s0, s1, ms, tint) {                                            // one PixelLab effect sprite that pops and fades
    const m = this.m; if (!m.textures.exists('fx')) return;
    const im = m.add.image(x, y, 'fx', name).setScale(s0); if (tint) im.setTint(tint); m.hud.add(im);
    m.tweens.add({ targets: im, scale: s1, alpha: 0, duration: ms, ease: 'Cubic.easeOut', onComplete: () => im.destroy() });
  }
  // WILD with the PixelLab gauge (UI Creator): its three slots are cut out, the fills are drawn behind it
  drawFramed(x, y, n, dt) {
    const g = this.g, r = this.right, S = MAN.meterSlots, sc = this.W / S.w * 1.1, fw = S.w * sc, fh = S.h * sc;
    const fx = r ? x + this.W - fw : x, fy = y - fh / 2 + this.H / 2;                   // frame's top-left on screen
    const X = sx => r ? fx + (S.w - sx) * sc : fx + sx * sc, Y0 = fy + S.y0 * sc, Y1 = fy + S.y1 * sc;
    for (let i = 0; i < 3; i++) {
      const [a, b] = S.segs[i], xa = Math.min(X(a), X(b)), xb = Math.max(X(a), X(b)), w = xb - xa, f = clamp(this.shown - i, 0, 1), c = SP_HOT[i];
      g.fillStyle(0x27141c, 1).fillRect(xa, Y0, w, Y1 - Y0);
      if (f <= 0) continue;
      const fwid = w * f, f0 = r ? xb - fwid : xa;
      g.fillStyle(c[0], 1).fillRect(f0, Y0, fwid, Y1 - Y0);
      g.fillStyle(c[1], 1).fillRect(f0, Y0, fwid, (Y1 - Y0) * 0.42);
      const step = 7, off = (this.t * (26 + i * 14)) % step;                                // stripes slide along the fill
      for (let s = off; s < fwid - 2; s += step) g.fillStyle(c[2], f >= 1 ? 0.3 : 0.18).fillRect(r ? f0 + fwid - s - 2 : f0 + s, Y0, 2, Y1 - Y0);
      if (f >= 1 && n === 3) g.fillStyle(0xffffff, 0.25 + 0.25 * Math.sin(this.t * 16 + i)).fillRect(xa, Y0, w, Y1 - Y0);
    }
    if (this.flash > 0) g.fillStyle(0xffffff, this.flash * 1.8).fillRect(fx, fy, fw, fh);
    this.frame.setPosition(fx + fw / 2, fy + fh / 2).setScale(sc).setFlipX(r).setVisible(true);
    if (this.fl.length && this.shown > 0.05) {                                                // extra PixelLab flames ride the bar as it fills
      const count = n === 3 ? 9 : n === 2 ? 6 : n === 1 ? 3 : 1, filled = Math.min(1, this.shown / 3);
      for (let i = 0; i < count; i++) {
        const f = this.fl[i], u = (i + 0.5) / count * filled, lvl = Math.min(2, Math.floor(u * 3)), wob = Math.sin(this.t * 13 + i * 2.1);
        f.setVisible(true).setFrame(['flame', 'flameBlue', 'flamePurple'][lvl]).setPosition(Math.round(r ? fx + fw - (0.05 + u * 0.9) * fw : fx + (0.05 + u * 0.9) * fw), Math.round(fy + 5))
          .setScale((0.34 + 0.08 * n + 0.05 * wob) * (n === 3 ? 1.2 : 1), 0.38 + 0.12 * n + 0.09 * wob).setAlpha(0.95);
      }
    }
    if (n === 3 && this.fl.length && Math.random() < dt * 3) this.burst('sparks', fx + rnd(0.1, 0.9) * fw, fy + fh * rnd(0.3, 0.8), 0.4, 0.9, 300);
    if (n >= 2 && this.fl.length && Math.random() < dt * 0.8) this.burst('bolt', fx + rnd(0.1, 0.9) * fw, fy, 0.5, 0.8, 220);
    const name = this.team ? this.team.name : '';
    this.lab.setText(`${name} SP`).setPosition(r ? fx + fw - 4 : fx + 6, fy + fh + 9).setAngle(-3).setScale(1);
    const lvTxt = n === 3 ? 'MAX!' : n ? `LV${n}` : '';
    this.lv.setText(lvTxt).setColor(n ? '#' + SP_HOT[n - 1][1].toString(16).padStart(6, '0') : '#ffde1e')
      .setPosition(r ? fx - 6 : fx + fw + 6, fy + fh / 2 + 2).setScale(1.1 + this.pop * 0.9 + (n === 3 ? 0.12 * Math.sin(this.t * 20) : 0)).setAngle(-6);
  }
  // corner points of a slanted bar from fraction a to fraction b (0..1 of the whole bar)
  quad(a, b, x, y, W, H, sl) {
    const r = this.right, X = f => r ? x + W - f * W : x + f * W, k = r ? -1 : 1;
    return [{ x: X(a) + sl * k, y }, { x: X(b) + sl * k, y }, { x: X(b), y: y + H }, { x: X(a), y: y + H }];
  }
  draw(dt) {
    this.t += dt; this.shown += (this.e - this.shown) * (1 - Math.exp(-dt * 7));
    this.flash = Math.max(0, this.flash - dt); this.pop = Math.max(0, this.pop - dt);
    const g = this.g, n = this.level(), INK = 0x0c0a0e, PAPER = 0xf4f0e4, wild = SP_STYLE === 'wild', r = this.right;
    const hidden = this.m.replay || !(window.HC2_STARTED || this.m.demo);
    g.clear(); this.lab.setVisible(!hidden); this.lv.setVisible(!hidden); if (this.frame) this.frame.setVisible(!hidden && wild);
    this.fl.forEach(f => f.setVisible(false));
    if (hidden) return;
    let { x, y, W, H } = this;
    const name = this.team ? this.team.name : '';
    const blink = Math.floor(this.t * 6) % 2 === 0;
    if (!wild) {                                                                      // ---- BASIC
      g.fillStyle(INK, 1).fillRect(x - 3, y - 3, W + 6, H + 6).lineStyle(2, PAPER, 1).strokeRect(x - 3, y - 3, W + 6, H + 6);
      const cw = (W - 4) / 3;
      for (let i = 0; i < 3; i++) {
        const cx = r ? x + W - (i + 1) * cw - i * 2 : x + i * (cw + 2), f = clamp(this.shown - i, 0, 1);
        g.fillStyle(0x2a2630, 1).fillRect(cx, y, cw, H);
        if (f > 0) { const fw = Math.round(cw * f); g.fillStyle(n === 3 && blink ? PAPER : SP_COL[i], f >= 1 ? 1 : 0.65).fillRect(r ? cx + cw - fw : cx, y, fw, H);
          g.fillStyle(0xffffff, 0.35).fillRect(r ? cx + cw - fw : cx, y, fw, 2); }
      }
      if (this.flash > 0) g.fillStyle(0xffffff, this.flash * 1.6).fillRect(x - 3, y - 3, W + 6, H + 6);
      this.lab.setText(`${name} SP`).setPosition(r ? x + W + 3 : x - 3, y - 6).setScale(1).setAngle(0);
      this.lv.setText(n === 3 ? (blink ? 'MAX' : '') : n ? `LV${n}` : '').setColor('#ffde1e').setPosition(r ? x - 10 : x + W + 10, y + H / 2).setScale(1 + this.pop * 0.6);
      return;
    }
    // ---- WILD: slanted gauge, colour per level, moving stripes, shakes near a level, flames from PixelLab
    const frac = this.e - n, amp = n === 3 ? 1.6 : frac > 0.8 ? 1.2 : 0;
    if (amp) { x += Math.round(rnd(-amp, amp)); y += Math.round(rnd(-amp, amp)); }
    if (this.frame && MAN.meterSlots) { this.drawFramed(x, y, n, dt); return; }
    const sl = 8, body = this.quad(0, 1, x, y, W, H, sl);
    g.fillStyle(INK, 1).fillPoints(this.quad(-0.03, 1.03, x, y - 3, W, H + 6, sl), true);
    g.fillStyle(0x1d1a22, 1).fillPoints(body, true);
    const cur = Math.min(n, 2), hot = SP_HOT[cur];
    for (let i = 0; i < 3; i++) {                                                     // each level keeps its own power colour
      const f = clamp(this.shown - i, 0, 1); if (f <= 0) continue;
      const a = i / 3, b = (i + f) / 3, c = SP_HOT[i];
      g.fillStyle(c[0], 1).fillPoints(this.quad(a, b, x, y, W, H, sl), true);
      g.fillStyle(c[1], 1).fillPoints(this.quad(a, b, x, y, W, H * 0.45, sl * 0.45), true);
      // stripes sliding along the filled part
      const step = 0.045, off = (this.t * (0.35 + i * 0.2)) % step;
      for (let s = a + off; s < b - 0.012; s += step) g.fillStyle(c[2], 0.28).fillPoints(this.quad(s, Math.min(b, s + 0.012), x, y, W, H, sl), true);
    }
    for (const t of [1 / 3, 2 / 3]) g.fillStyle(INK, 1).fillPoints(this.quad(t - 0.004, t + 0.004, x, y, W, H, sl), true);   // level notches
    const glow = n === 3 ? 0.6 + 0.4 * Math.sin(this.t * 18) : 0.5 + 0.5 * Math.sin(this.t * 4);
    g.lineStyle(2, n ? SP_HOT[n - 1][1] : PAPER, n ? glow : 1).strokePoints(this.quad(-0.03, 1.03, x, y - 3, W, H + 6, sl), true);
    if (this.flash > 0) g.fillStyle(0xffffff, this.flash * 1.8).fillPoints(this.quad(-0.03, 1.03, x, y - 3, W, H + 6, sl), true);
    if (this.frame) this.frame.setPosition(x + W / 2, y + H / 2).setFlipX(r);
    // PixelLab flames: more and taller every level, tinted with that level's power
    if (this.fl.length && this.shown > 0.05) {
      const count = n === 3 ? 9 : n === 2 ? 5 : n === 1 ? 3 : 1, filled = Math.min(1, this.shown / 3);
      for (let i = 0; i < count; i++) {
        const f = this.fl[i], u = (i + 0.5) / count * filled, X = r ? x + W - u * W : x + u * W;
        const lvl = Math.min(2, Math.floor(u * 3)), wob = Math.sin(this.t * 13 + i * 2.1);
        f.setVisible(true).setFrame(['flame', 'flameBlue', 'flamePurple'][lvl])                    // each level burns in its own PixelLab colour
          .setPosition(Math.round(X + sl * 0.5 * (r ? -1 : 1)), y + 3).setScale((0.36 + 0.1 * n + 0.05 * wob) * (n === 3 ? 1.2 : 1), 0.4 + 0.13 * n + 0.09 * wob).setAlpha(0.95);
      }
    }
    if (n === 3 && this.fl.length && Math.random() < dt * 3) this.burst('sparks', (r ? x + W - rnd(0, 1) * W : x + rnd(0, 1) * W), y + rnd(0, H), 0.4, 0.9, 300);
    if (n >= 2 && this.fl.length && Math.random() < dt * 0.8) this.burst('bolt', (r ? x + W - rnd(0.34, 1) * W * (n / 3) : x + rnd(0.34, 1) * W * (n / 3)), y - 4, 0.5, 0.8, 220);
    this.lab.setText(`${name} SP`).setPosition(r ? x + W + 3 : x - 3 + sl, y - 7).setAngle(-4).setScale(1);
    const lvTxt = n === 3 ? 'MAX!' : n ? `LV${n}` : '';
    this.lv.setText(lvTxt).setColor(n ? '#' + SP_HOT[n - 1][1].toString(16).padStart(6, '0') : '#ffde1e')
      .setPosition(r ? x - 14 : x + W + 16, y + H / 2).setScale(1.1 + this.pop * 0.9 + (n === 3 ? 0.12 * Math.sin(this.t * 20) : 0)).setAngle(-6);
  }
}

// ---------------------------------------------------------------- Match methods: specials
hc2Mix(Match, {
  // v0.8.6 the aerial special itself: LV by the bars spent; LV1 a volley, LV2 an overhead kick (or volley if it's low), LV3 the leap
  airSpecial(p, aimAI) {
    const b = this.ball, mt = this.meterOf(p.team), lv = mt.spend(); if (!lv) return; if (aimAI == null) this.airSp = null;
    const pick = this.airPick(p, lv), bz0 = b.z;                                  // t-014: which of the level's two, from the ball's arc as it arrives (before it's stopped for the strike)
    const aim = aimAI != null ? aimAI : Math.abs(this.inp.axis.y) > 0.2 ? this.inp.axis.y : (Math.random() < 0.5 ? -1 : 1) * rnd(0.55, 1), KA = MAN.kits[p.kit].anims;   // (t-012: the computer passes its own aim, not your stick)
    { const dv = dirVec(p.face); b.x = p.x + dv.x * 0.45; b.y = p.y + dv.y * 0.35; b.vx = b.vy = b.vz = 0; }   // he meets it (the leap / volley closes the gap) - v0.8.7: and it stops there for the strike (it flew on and the kick missed: the Lab's PW10 caught it)
    b.owner = p; this.doShot(p, 0.85, aim);
    const k = this.pending; if (!k || k.p !== p) return;
    // v0.8.9 RIG per move: he takes off, the ball hangs where his boot will meet it, then the strike. t-014: the batch 16
    // move the arc picked (its kit lacks it: the level's first move); lifted so his boot meets the ball about where it
    // arrived (g.up, between the move's rise and riseMax)
    const toE = p.team.side > 0, dOf = R => (R && R.back ? !toE : toE) ? 'E' : 'W';
    let n = pick, R = RIGS[n], d = dOf(R), g = { up: 0 }, P = R && this.rigAt(p, n, R.keys.find(q => q.hit).t, d, g);
    if (!P && n !== 'air' + lv) { n = 'air' + lv; R = RIGS[n]; d = dOf(R); P = R && this.rigAt(p, n, R.keys.find(q => q.hit).t, d, g); }
    if (P) {
      const hk = R.keys.find(q => q.hit), z0 = (wy(p.y) - 12 - this.rigPt(P, hk.foot, d).y) / PX_H;
      g.up = clamp((bz0 - z0) * PX_H, R.rise || 0, R.riseMax || 0);
      const f = this.rigPt(this.rigAt(p, n, hk.t, d, g), hk.foot, d);
      p.face = d === 'E' ? 0 : 4; p.kickAnim = 'rig'; p.rig = { n, t: 0, d, up: g.up }; p.stateT = R.dur; if (R.bike) p.bike = true;
      this.airLast = { n, name: R.name, f: hk.f, at: hk.t };                     // (the Test Lab's AS lines read it)
      k.info.air = { x: clamp(p.x + (f.x - wx(p.x, p.y)) / (PX_X * scaleAt(p.y)), 0.5, PITCH_L - 0.5), y: p.y, z: clamp((wy(p.y) - 12 - f.y) / PX_H, 0.3, 3.2) };
      Object.assign(b, { x: k.info.air.x, y: k.info.air.y, z: k.info.air.z });
      k.t = hk.t;                                                                 // the strike lands on the rig's contact key
    } else {                                                                      // (no rig for this kit: the old moves)
      this.airLast = { n: 'old', name: RIGS['air' + lv].name, f: -1, at: 0 };
      const anim = lv === 3 && KA['super-E'] ? 'super' : lv >= 2 && b.z > 1.2 && KA['bicycle-E'] ? 'bicycle' : 'volley';
      p.kickAnim = anim; if (anim === 'super' || anim === 'bicycle') { p.face = p.team.side > 0 ? 0 : 4; } if (anim === 'bicycle') { p.stateT = 0.7; p.bike = true; }
      k.t = Math.min(k.t, 0.18);                                                   // in the air: struck at once
    }
    const f = spRange(lv, p);
    k.ty = clamp(34 + aim * 2.9 + rnd(-0.25, 0.25), GOAL_Y0 + 0.5, GOAL_Y1 - 0.5); k.tx = p.team.goalX + p.team.side * 2;
    k.speed = [31, 35, 39][lv - 1] * (0.7 + 0.3 * f); k.vz = [0.6, -0.6, 1.2][lv - 1]; k.info.special = lv; k.info.power = 1; k.info.spP = SP_POWER[lv - 1] * f; k.info.spF = f;
    // t-014: struck from up high (METEOR DRIVE's axe kick, a PHOENIX or SKY THUNDER lifted to a high ball) it's driven down, so it comes in
    // under the bar (~1.6 m at the goal) instead of flying over it
    const za = k.info.air && k.info.air.z; if (za > 1.6) { const T = len(k.tx - b.x, k.ty - b.y) / k.speed; k.vz = Math.min(k.vz, (1.6 - za + 0.5 * G * T * T) / T); }
    // t-014: the move's own name on the banner (like RISE UP / THUNDER SHOT) and its own line from Rami
    const nm = (P && R.name) || RIGS['air' + lv].name;
    this.say(nm + '!', `${p.team.name} · LV${lv} AERIAL SPECIAL`, 1.3); this.spName = { p, name: nm };   // (t-028: the clash's caption names the move)
    this.ramiSay('skill', { text: AIR_RAMI[P ? n : 'air' + lv] || AIR_RAMI['air' + lv], expr: 'laugh' }, 3);
    SFX.special(lv); this.flagReplay('AERIAL SPECIAL!'); this.hitStop = 0.08; this.cameras.main.flash(90, 255, 230, 120);
  },
  // t-014 (Luca 24 Oct 05:57: "make them match to the arc of the ball from passes"): which of the level's two aerial
  // specials, from how the ball arrives - its height now, how high its arc goes (z + vz^2 / 2g: a dropping ball came from
  // about that high, a rising one is going that high) and where it comes from (behind his back or his shoulder, or at
  // his face). No dice, so the same ball always gives the same move, for you and for the computer (aiAirSpecial ends in
  // airSpecial too). The level is still the bars spent.
  //   LV1  a low driven ball (under ~1 m, flat)               -> TIDE CUTTER   · else (chest-high drop)  -> AIR BLAZE
  //   LV2  shoulder height (under 1.75 m) from his side / back -> CYCLONE HEEL  · else (over his head)    -> SKY THUNDER
  //   LV3  a sky-high loop (arc over 6.5 m)                     -> METEOR DRIVE  · else (very high ball)   -> PHOENIX
  airPick(p, lv) {
    const b = this.ball, arc = b.z + b.vz * b.vz / (2 * G), gx = p.team.goalX - p.x, gy = 34 - p.y, gl = len(gx, gy) || 1, v = len(b.vx, b.vy) || 1;
    const along = (b.vx * gx + b.vy * gy) / (v * gl);                            // +1 the ball travels the way he faces (from behind him), -1 it comes at his face
    const tc = clamp(-((b.x - p.x) * b.vx + (b.y - p.y) * b.vy) / (v * v), 0, 0.6), z = Math.max(0, b.z + b.vz * tc - G * tc * tc / 2);   // its height as it reaches him (SPECIAL pressed a moment early still reads the ball he'll meet)
    if (lv === 1) return z < 1.0 && arc < 2.0 ? 'tide' : 'air1';
    if (lv === 2) return z < 1.75 && arc < 4.5 && along > -0.3 ? 'cyclone' : 'air2';
    return arc > 6.5 ? 'meteor' : 'air3';
  },
  // t-014 TIDE CUTTER's low window: the aerial-special popup normally needs the ball over 0.55 m; a low driven ball (0.3 m
  // up, flat and fast) opens it too, only with exactly one bar - the only level that has a move for it (actions.js)
  tideWin(p) {
    const b = this.ball; return b.z > 0.3 && b.z <= 0.9 && Math.abs(b.vz) < 3 && len(b.vx, b.vy) > 8 && this.meterOf(p.team).level() === 1;
  },
  // ======================================================================= t-014 KEEPER SPECIAL SAVES PICKED BY THE SHOT (Luca 24 Oct 05:57:
  // "these animations are chosen by the game depending on the shot, so for a lob it can do a leap and grab it, if its
  // straight it does something, if its far to the sides gk does a dynamic leap and catches it or attempts it (all
  // animations have to follow the power logic we are building but be fluid)"). Only the frames: who wins, held / pushed
  // out / a hand to it stays clash() + pickups (t-007). Where the ball will cross his line picks the move:
  //   a lob / high dropping ball -> kleap · straight at him -> kblock · far to a side -> kdivecatchDown / Up (towards / away
  //   from the camera, as diveAnimFor) · too strong to hold (a hand to it) -> ktip (over the bar: a corner)
  // LV2 / LV3 use the same four with their stronger aura, hit-stop, effects and cut scene (Luca adds a LV3 pop-up later).
  gkSpecialCross(gk) {                                                            // where (and in how long) the ball crosses his line - planSave's way, no dice
    const b = this.ball, c = { ...b }, h = 1 / 120, px = gk.x; let t = 0;
    while (t < 1.2) { const ox = c.x; ballStep(c, h, false); t += h; if ((ox - px) * (c.x - px) <= 0) return { t, x: c.x, y: c.y, z: c.z, vz: c.vz }; }
    return null;
  },
  // INSTA FLAG flag-mvo4pchr-368 (Luca 25 Oct, HARD, IS 0-2 IRO 59:34: "gklvl 3 move still let lvl 3 shot through"):
  // "on target" for a special save was read where the ball crosses HIS line. Off his line on the angle (GK_1V1 brings
  // him out up to 14 m), an angled shot into the near post is still ~4.5 m off the middle there, so his charged LV3 save
  // was called off ("off target") and the LV3 went in with no clash. The Laws judge a shot at the goal line, and FIFA /
  // PES keepers narrow the angle exactly like this - so a shot that would go in between the posts is on target wherever
  // he meets it (Inazuma Eleven: a hissatsu catch always meets a hissatsu shot on frame). x: the ball at his line.
  // Not wider than the 6-yard box at his line (9.16 m): no dash across the whole box.
  gkSpOnTarget(gk, x) {
    if (!x || x.z > 3.2) return false;
    if (Math.abs(x.y - 34) <= CLASH.reach) return true;                          // (as before: no extra steps for the old cases)
    if (Math.abs(x.y - 34) > 9.16) return false;
    const b = this.ball, c = { ...b }, h = 1 / 120, gx = gk.team.ownGoalX; let t = 0;
    if ((gx - b.x) * (b.vx || 0) <= 0) return false;                              // (going away from his goal)
    while (t < 1.5) { const ox = c.x; ballStep(c, h, false); t += h; if ((ox - gx) * (c.x - gx) <= 0) return Math.abs(c.y - 34) <= CLASH.reach && c.z <= 3.2; }
    return false;
  },
  // where he stands when he meets it: the old save kept him inside the posts (lo .. hi), right when he met it under
  // CLASH.reach of the middle. Met wider than that (gkSpOnTarget's new case: off his line) he's out there with it -
  // pulling him back inside the posts snapped the ball 3-4 m across in one frame (the soak's TELEPORT)
  gkMeetY(by, v, lo, hi) { return Math.abs(by - 34) > CLASH.reach ? v : clamp(v, lo, hi); },
  gkSpecialMove(gk, x) {
    const K = MAN.kits[gk.kit].anims, d = gk.team.side > 0 ? 'E' : 'W', dy = x.y - gk.y;
    const n = x.z > 1.9 || (x.vz < -2.5 && x.z > 1.5) ? 'kleap' : Math.abs(dy) > 1.2 ? (dy > 0 ? 'kdivecatchDown' : 'kdivecatchUp') : 'kblock';
    return K[`${n}-${d}`] ? n : null;
  },
  // every step for a keeper with a special save ready (player.js): the move starts early enough that its contact frame
  // lands as the ball reaches him; a shot that's gone (blocked, out, off target) calls it off before the contact.
  // t-028 (Luca's INSTA FLAG 25 Oct 14:41, "the gk save plays too early some times"; and 14:59 "the keeper can cover the
  // whole goal"): (1) CHARGED: while the shot is on its way and his move hasn't started, his gloves glow in the save's
  // colour (gkGloveFx). (2) The move is played from the REAL ball, every frame: its clock is set to the time the ball
  // still needs to his line (gkSpecialCross, re-read each step), never ahead of it - a dipping, slowing or deflected
  // shot makes him wait on an earlier frame (it used to hold the contact frame, the save "gone off" too early), a ball
  // that's suddenly close skips him on to the contact. It never runs backwards. His gloves aim at where it crosses NOW.
  // (3) He gets to anything on target (CLASH.reach): the move slides him there with a dash (rigFx's after-images).
  gkSpecialRoll(gk) {
    const b = this.ball, g = gk.rig, R = g && RIGS[g.n];
    const live = !!gk.spSave && !b.owner && !b.inNet && (b.special ? !!b.spTeam && b.spTeam !== gk.team : !!b.saveable && b.saveable !== gk.team);
    if (!live) gk.spPick = null;
    if (R && R.gk && g.e0 == null) {
      if (!live) { gk.rig = null; return; }
      const hk = R.keys.find(q => q.hit), x = this.gkSpecialCross(gk);
      if (this.gkSpOnTarget(gk, x)) { g.t = clamp(hk.t - x.t, g.lastT ?? 0, hk.t); g.B = { x: wx(x.x, x.y), y: wy(x.y) - 12 - x.z * PX_H }; }
      else g.t = Math.min(g.lastT ?? g.t, hk.t);                                   // (no crossing in sight now: he waits where he is)
      g.lastT = g.t;
      return;
    }
    if (live && !g) this.gkGloveFx(gk);
    if (!live || g) return;
    const x = this.gkSpecialCross(gk); if (!this.gkSpOnTarget(gk, x)) return;          // (flag-mvo4pchr-368: on target at the goal line)
    // the move is read from where he stood as the shot came (picked once: his own steps / dive towards it don't turn a
    // shot to the side into a straight one)
    if (!gk.spPick) gk.spPick = { n: this.gkSpecialMove(gk, x) };
    const n = gk.spPick.n, hk = n && RIGS[n].keys.find(q => q.hit); if (!hk || x.t > hk.t) return;
    gk.face = gk.team.side > 0 ? 0 : 4; gk.rig = { n, t: hk.t - x.t, lastT: hk.t - x.t, d: gk.team.side > 0 ? 'E' : 'W', B: { x: wx(x.x, x.y), y: wy(x.y) - 12 - x.z * PX_H }, dash: RIG_COL[clamp(gk.spSave, 1, 3) - 1] };   // (B: the ball on screen as it reaches him; dash: t-028's after-images)
  },
  // t-028 CHARGED GLOVES: a keeper with his special save on, waiting for the shot - a light glow in the save's colour
  // at his hands (the fx atlas' orb + a sparkle, tinted: no new art)
  gkGloveFx(gk) {
    const now = this.time.now; if (now < (gk.gloveAt || 0) || this.replay || !gk.spr) return; gk.gloveAt = now + 80;
    const c = RIG_COL[clamp(gk.spSave, 1, 3) - 1], X = wx(gk.x, gk.y), Y = wy(gk.y) - 64 * (gk.spr.scaleY || 1), D = wy(gk.y) + 0.3;
    for (const s of [-1, 1]) this.rigPop('orb', X + s * 15 + rnd(-2, 2), Y + rnd(-3, 3), D, { s: [0.22, 0.42], ms: 260, a: 0.7, tint: c });
    if (Math.random() < 0.5) this.rigPop('sparkle', X + rnd(-18, 18), Y + rnd(-8, 6), D, { s: [0.3, 0.6], ms: 300, tint: c });
  },
  // the clash: the move shows its contact frame now, with the level's effects. A hand to it: the fingertips (ktip).
  // A kit without the batch 16 moves: the v0.8.9 stand-in rig, as before
  gkSpecialHit(gk, res, lv) {
    const b = this.ball, d = gk.team.side > 0 ? 'E' : 'W', K = MAN.kits[gk.kit].anims, S = RIGS['save' + lv];
    let g = gk.rig && RIGS[gk.rig.n] && RIGS[gk.rig.n].gk ? gk.rig : null;
    if (res === 'hand') g = K[`ktip-${d}`] ? { n: 'ktip', d } : null;
    else if (!g) { const n = gk.spPick ? gk.spPick.n : this.gkSpecialMove(gk, { y: b.y, z: b.z, vz: b.vz }); g = n ? { n, d } : null; }
    gk.spPick = null;
    gk.face = gk.team.side > 0 ? 0 : 4;
    if (!g) { gk.rig = res === true && S ? { n: 'save' + lv, t: 0, d } : null; return; }
    const hk = RIGS[g.n].keys.find(q => q.hit);
    Object.assign(g, { t: hk.t, e0: hk.t, B: { x: wx(b.x, b.y), y: wy(b.y) - 12 - b.z * PX_H }, off: null, ei: 0, col: RIG_COL[lv - 1], ev: res === true ? S.ev : [{ t: 0, fx: 'impact', at: 'fist', s: [0.6, 1.5], ms: 240 }], ghost: res === true ? S.ghost : [0, 0.25] });
    gk.rig = g; this.gkSpLast = { n: g.n, res };                                  // (the Test Lab's KS lines read it)
  },
  // t-012 THE COMPUTER'S AERIAL SPECIAL: it never used one (airSpecial was only for your SPECIAL key), so the aerial
  // moves were yours alone. Now the man meeting a cross / a lob near their goal (22 m, in front of it) spends its bars on
  // one: how often by level (K.sp), never twice inside 30 s for a side. Only the computer's side: your bars are yours
  // to spend (your team-mates head it as before)
  aiAirSpecial(p) {
    const b = this.ball, team = p.team, lv = this.meterOf(team).level();
    if (lv < 1 || p.keeper || (this.hasHuman(team) && !this.demo) || b.owner || b.inNet || b.z < 0.55 || b.z > 2.6 || p.busy() || this.pending) return false;
    const gx = team.goalX, toGoal = len(gx - p.x, 34 - p.y); if (toGoal > 22 || (gx - p.x) * team.side < 3 || Math.abs(p.y - 34) > 14) return false;
    if ((team.airSpAt ?? -1e9) > this.time.now - 30000 || !(Math.random() < 0.45 * this.dk(team).sp)) return false;
    team.airSpAt = this.time.now; p.face = dirIndex(gx - p.x, 34 - p.y); this.airSpecial(p, (Math.random() < 0.5 ? -1 : 1) * rnd(0.5, 1)); return true;
  },
  // ---------- v0.8.9 ROUGH RIGS: where a rig puts him at time t (frame, place, turn, squash) - shared by the drawing and
  // by the aerial special (to hang the ball where his boot will be)
  rigAt(p, n, t, d, g) {
    const R = RIGS[n], K = MAN.kits[p.kit]; if (!R || !K) return null;
    const keys = R.keys; let i = 0; while (i < keys.length - 1 && keys[i + 1].t <= t) i++;
    const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)], u = b === a ? 0 : clamp((t - a.t) / (b.t - a.t), 0, 1);
    const L = (q, d0) => (a[q] ?? d0) + ((b[q] ?? d0) - (a[q] ?? d0)) * u;
    const list = K.anims[`${a.a}-${d}`]; if (!list || !list.length) return null;
    const fr = list[Math.min(a.f, list.length - 1)], org = K.origins && K.origins[`${a.a}-${d}`], rot = L('rot', 0) * (d === 'W' ? -1 : 1) * Math.PI / 180;
    if (org) {
      // t-014 a batch 16 frame: drawn from the manifest's origin (its feet line, or the centre of the turned dive catch),
      // on its own window. The art carries the pose; the rig adds the lift to the ball's height (g.up, else R.rise),
      // easing in to the contact frame and out by the landing. A keeper's move is slid so his gloves on the contact
      // frame meet the ball: towards where the shot will cross him (g.B) before the contact, from where it met him
      // (g.off) after it, fading out as he lands - only the picture: where he really is stays the keeper AI's / the save's
      const F = this.textures.getFrame(p.kit, fr), hk = keys.find(q => q.hit), th = hk ? hk.t : R.dur / 2, tl = keys[keys.length - 2].t;
      const env = t < th ? Math.sin(Math.PI / 2 * t / th) : Math.max(0, 1 - (t - th) / Math.max(tl - th, 0.05));
      const up = (g && g.up != null ? g.up : R.rise || 0) * env;
      const P = { fr, x: wx(p.x, p.y), y: wy(p.y) - L('lift', 0) - up, rot, sx: L('sx', 1), sy: L('sy', 1), ox: org[0], oy: org[1], fw: F ? F.realWidth : 256, fh: F ? F.realHeight : 184 };
      if (g && R.gk && hk && (g.B || g.off)) {
        let o = g.off, k = t < th ? 1 : Math.max(0, 1 - (t - th) / Math.max(R.dur - th, 0.05));
        if (!o || t < th) { const h = this.rigPt(this.rigAt(p, n, th, d), hk.fist, d); o = { x: g.B.x - h.x, y: g.B.y - h.y };
          if (t < th) k = Math.sin(Math.PI / 2 * clamp(t / th, 0, 1)); else g.off = o; }   // (from the contact on: frozen where the ball met him - the save has put him on its line by then)
        P.x += clamp(o.x, -230, 230) * k; P.y += clamp(o.y, -200, 200) * k;   // (t-028: the whole goal - 4.3 m either side, a ball under the bar in a top corner)
      }
      return P;
    }
    const cy = R.cy ?? 0.56, FH = K.frameH || 160, sy = L('sy', 1), lift = L('lift', 0);
    return { fr, x: wx(p.x, p.y), y: wy(p.y) - (K.feetY - cy * FH) * sy - lift, rot, sx: L('sx', 1), sy, ox: 0.5, oy: cy, fw: 128, fh: FH };
  },
  rigPt(P, pt, d) {                                                               // a point of the frame (E frame, px) on the screen
    const lx = (d === 'W' ? P.fw - pt[0] : pt[0]) - P.fw * P.ox, ly = pt[1] - P.fh * P.oy, c = Math.cos(P.rot), s = Math.sin(P.rot);   // (t-014: any window and origin)
    return { x: P.x + lx * P.sx * c - ly * P.sy * s, y: P.y + lx * P.sx * s + ly * P.sy * c };
  },
  rigPop(name, x, y, depth, o = {}) {                                             // one PixelLab effect: grows, rises, fades
    if (!this.textures.exists('fx') || !this.textures.get('fx').has(name)) return null;
    const s0 = o.s ? o.s[0] : 1, s1 = o.s ? o.s[1] : s0, kx = o.kx || 1, ky = o.ky || 1;
    const im = this.add.image(x, y, 'fx', name).setScale(s0 * kx, s0 * ky).setAlpha(o.a ?? 1).setDepth(depth).setRotation(o.rot || 0).setFlipX(!!o.flip);
    if (o.tint) im.setTint(o.tint);
    this.tweens.add({ targets: im, scaleX: s1 * kx, scaleY: s1 * ky, alpha: 0, y: y + (o.dy || 0), duration: o.ms || 300, delay: o.delay || 0, ease: 'Cubic.easeOut', onComplete: () => im.destroy() });
    return im;
  },
  rigFx(p, P) {                                                                   // the rig's effects + after-images, as its clock passes them
    // t-014: a keeper's special-save move plays its level's effects from the contact on (g.ev / g.ghost / g.col, timed
    // from g.e0, set by gkSpecialHit) - nothing before it, while he's still getting there
    const g = p.rig, R = RIGS[g.n];
    if (R.gk && g.e0 == null) {                                                    // t-028 the dash across his goal: after-images in the save's colour + a whoosh as he goes
      if (!g.dash || this.replay) return;
      if (!g.wAt) { g.wAt = 1; this.rigPop('whoosh', p.spr.x, p.spr.y - 40, p.spr.depth + 0.1, { s: [0.7, 1.6], ms: 300, tint: g.dash, flip: g.d === 'W' }); }
      if (this.time.now - (g.gAt || 0) > 45) { g.gAt = this.time.now; const s = p.spr;
        const im = this.add.image(s.x, s.y, s.texture.key, s.frame.name).setOrigin(s.originX, s.originY).setRotation(s.rotation).setScale(s.scaleX, s.scaleY).setDepth(s.depth - 0.3).setTintFill(g.dash).setAlpha(0.45);
        this.tweens.add({ targets: im, alpha: 0, duration: 200, onComplete: () => im.destroy() }); }
      return;
    }
    const ev = g.ev || R.ev || [], t = g.t - (g.e0 || 0), gh = g.ghost || R.ghost; g.ei = g.ei || 0;
    while (g.ei < ev.length && ev[g.ei].t <= t) { this.rigEvent(p, R, ev[g.ei], P); g.ei++; }
    if (gh && t >= gh[0] && t <= gh[1] && this.time.now - (g.gAt || 0) > 40) {
      g.gAt = this.time.now; const s = p.spr;
      const im = this.add.image(s.x, s.y, s.texture.key, s.frame.name).setOrigin(s.originX, s.originY).setRotation(s.rotation).setScale(s.scaleX, s.scaleY).setDepth(s.depth - 0.3).setTintFill(g.col || R.col).setAlpha(0.5);
      this.tweens.add({ targets: im, alpha: 0, duration: 240, onComplete: () => im.destroy() });
    }
  },
  // where a rig's boot / glove effect goes (the Test Lab's KC / KS lines measure the same point). t-036: a glove on his
  // gloves as they're drawn this frame (player.js rigGlovePt) - rigAt's P is the frame before t-033's diveTurn turned it
  // flat and slid it, so between the contact and the landing the flash sat up to ~90 px off his gloves (KS3), and a
  // fixed contact-frame point drifted off them as the move went on (kleap's landing: 115 px). A boot: as before
  rigFxPt(p, R, P, at) {
    const hk = R.keys.find(q => q.hit) || R.keys[0];
    if (at === 'fist' && hk.fist) { const q = rigGlovePt(p.spr, hk.fist, p.rig.d === 'W'); if (q) return q; }
    return this.rigPt(P, hk[at] || [64, 60], p.rig.d);
  },
  rigEvent(p, R, e, P) {
    if (e.shake) this.cameras.main.shake(e.shake[0], e.shake[1]);
    if (!e.fx) return;
    const s = p.spr, hk = R.keys.find(q => q.hit) || R.keys[0], W = p.rig.d === 'W';
    let x = s.x, y = s.y;
    if (e.at === 'feet') { x = wx(p.x, p.y); y = wy(p.y) - 4; }
    else if (e.at === 'body' && P.oy > 0.8) y -= 64 * s.scaleY;                   // (t-014: a batch 16 frame hangs from his feet: his body is ~64 px up)
    else if (e.at === 'foot' || e.at === 'fist') { const q = this.rigFxPt(p, R, P, e.at); x = q.x; y = q.y; }
    x += (e.dx || 0) * (W ? -1 : 1);
    for (let i = 0; i < (e.n || 1); i++) this.rigPop(e.fx, x + (e.n > 1 ? rnd(-e.sp, e.sp) : 0), y + (e.n > 1 ? rnd(-e.sp, e.sp) : 0), wy(p.y) + 1, { ...e, flip: W, delay: i * 40 });
  },
  auraFx(p) {                                                                     // v0.8.9 a keeper with a special save ready: flames at his feet
    const now = this.time.now; if (now < (p.auraAt || 0) || this.replay) return; p.auraAt = now + 70;
    this.rigPop(['flame', 'flameBlue', 'flamePurple'][clamp(p.spSave, 1, 3) - 1], wx(p.x, p.y) + rnd(-16, 16), wy(p.y) - rnd(0, 8), wy(p.y) + 0.2, { s: [0.45, 0.9], ms: 420, dy: -34, a: 0.85 });
  },
  // v0.8.6 a special BLOWS THROUGH a defender: he's thrown down, the ball goes on (a bit weaker, a bit slower)
  pierce(p) {
    const b = this.ball, lv = b.special, sp = len(b.vx, b.vy) || 1;
    b.pierce--; b.spP *= 1 - SP_PIERCE_LOSS[lv - 1];
    const k = 1 - SP_PIERCE_LOSS[lv - 1] * 0.5; b.vx *= k; b.vy *= k;
    const KA = MAN.kits[p.kit].anims;
    if (KA['blasted-E']) { p.setState('blasted', 1.1); p.face = b.vx > 0 ? 4 : 0; } else p.setState('fall', 0.9);
    p.stun = 1.1; p.cool = 1.1; p.vx = b.vx / sp * 3.2; p.vy = b.vy / sp * 3.2;
    this.hitStop = Math.max(this.hitStop || 0, 0.06); this.cameras.main.shake(140, 0.008); SFX.boom(0.7);
    this.say('', `THROUGH HIM! · ${Math.round(b.spP)} POWER LEFT`, 0.9);
  },
  // t-020 ARCADE SP (Luca 25 Oct: "more energy sp"): on top of arcade-2's 1.75x fill, a little for the big moments -
  // winning an AERIAL BATTLE, a header / volley straight off a board rebound, a special save (ARCADE.sp, bars before the
  // 1.75x). CLASSIC: nothing. spArcadeWatch runs every frame on ARCADE (ballPhysics) and only reads what the moves leave
  // behind (aerialLast, the ball's how / reb), so the moves themselves stay untouched.
  spBonus(team, kind) {
    if (!team || !ARCADE.sp[kind]) return;                                      // (29 Oct: both paces now - "special events more often")
    this.meterOf(team).add(ARCADE.sp[kind], kind);
    const N = this.arcN = this.arcN || { reb: 0, air: 0, rebShots: 0, sp: 0 }; N.sp++; N[kind] = (N[kind] || 0) + 1;
  },
  spArcadeWatch() {
    const A = this.aerialLast, b = this.ball;
    if (this.spAerialSeen === undefined) this.spAerialSeen = A || null;          // (one from before ARCADE was on doesn't count)
    if (A && A !== this.spAerialSeen) { this.spAerialSeen = A; if (A.kind !== 'ground' && A.by) this.spBonus(A.by.team, 'aerial'); }   // (an AERIAL BATTLE won, either side)
    const R = b.reb, h = b.how;
    if (R && !R.done && h && h !== R.how) {                                      // the first touch after a rebound
      R.done = true;
      if (this.time.now - R.t < ARCADE.reb.airT * 1000 && /header|dheader|volley|bicycle/.test(h.kind) && b.lastP) { this.spBonus(b.lastP.team, 'rebound'); this.arcN.rebShots++; }
    }
  },
  // v0.8.6 SPECIAL SAVE: a special is on its way - the defending side can spend its bars on the keeper.
  // You: a SAVE! prompt for a moment, press SPECIAL. The computer: uses its bars if it has them (most of the time).
  saveCall(def) {
    const mt = this.meterOf(def), gk = def.players[0]; if (!gk || gk.sentOff) return;
    gk.spSave = 0;
    if (mt.level() < 1) return;
    if (this.hasHuman(def) && !this.demo) { this.saveAsk = { team: def, t: 0.75 }; this.say('', `SPECIAL SAVE! PRESS ${keyset().special}`, 0.75); return; }
    if (Math.random() < (paceK().gkAnswer > 0.6 ? 0.95 : 0.8)) { gk.spSave = mt.spend(); this.saveFx(gk); }   // (arcade-2: ARCADE nearly always answers a special)
  },
  saveFx(gk) {
    const lv = gk.spSave; if (!lv) return;
    this.say(SAVE_NAMES[lv - 1] + '!', `${gk.team.name} KEEPER · LV${lv} SAVE`, 1.1); SFX.special(lv);
    this.ramiSay('save', { text: [`THE KEEPER ANSWERS!\n${SAVE_NAMES[0]}!`, `${SAVE_NAMES[1]}!\nHE IS READY FOR IT!`, `THE ${SAVE_NAMES[2]}!!\nPOWER AGAINST POWER!`][lv - 1], expr: 'shock' }, 3);
    if (!window.HC2_TEST_FAST && !this.replay) this.cutInQ = { kind: 'save', who: gk, lv };   // v0.8.9 the special-save cut scene (after the shot's hit-stop)
  },
  // ---------- v0.8.9 SPECIAL SAVE CUT SCENE (rough): everything stops for ~1.5 s - the screen darkens, a band in the level's
  // colour sweeps in with speed lines, the keeper (a PixelLab frame, 2.6x) slides in with flames behind him, the save's
  // name slams in, then it all sweeps out and play goes on. ENTER skips it. Screen-fixed, whatever the camera zoom.
  cutInBuild(q) {
    const lv = clamp(q.lv, 1, 3), gk = q.who, col = RIG_COL[lv - 1], F = '"Press Start 2P"', D = 9.7e6, K = MAN.kits[gk.kit], o = [];
    const add = x => { o.push(x); x.setScrollFactor(0); return x; };
    const veil = add(this.add.rectangle(0, 0, VIEW_W * 3, VIEW_H * 3, 0x0c0a0e, 1).setOrigin(0.5).setAlpha(0).setDepth(D));
    const band = add(this.add.graphics().setDepth(D + 1)), lines = add(this.add.graphics().setDepth(D + 2));
    // 29 Oct (the co-designer: "special events more often" - the cut-ins too): a special SHOT gets its cut-in as well
    // (q.kind 'shot': the shooter in his special move, its name; shorter than the keeper's - the shot is the moment)
    const shot = q.kind === 'shot', SA = ['sp1', 'sp2', 'super'][lv - 1], sa = K.anims[`${SA}-E`] || K.anims['kick-E'];
    const fr = shot ? ((sa && sa[Math.floor(sa.length * 0.6)]) || K.anims['idle-S'][0])
      : (K.anims['kroar-S'] && K.anims['kroar-S'][3]) || (K.anims['kset-S'] && K.anims['kset-S'][4]) || K.anims['idle-S'][0];
    const fl = this.textures.exists('fx') ? [0, 1, 2].map(i => add(this.add.image(0, 0, 'fx', ['flame', 'flameBlue', 'flamePurple'][lv - 1]).setDepth(D + 3).setAlpha(0))) : [];
    const por = add(this.add.image(0, 0, gk.kit, fr).setOrigin(0.5, K.feetY / (K.frameH || 160)).setDepth(D + 4));
    const name = add(this.add.text(0, 0, (shot ? q.name || SP_NAMES[lv - 1] : SAVE_NAMES[lv - 1]) + '!', { fontFamily: F, fontSize: '34px', color: '#ffde1e', stroke: '#0c0a0e', strokeThickness: 8 }).setOrigin(0.5).setDepth(D + 5).setAlpha(0));
    const sub = add(this.add.text(0, 0, shot ? `${gk.team.name} #${gk.num} · LV${lv} SPECIAL SHOT` : `${gk.team.name} KEEPER · LV${lv} SPECIAL SAVE`, { fontFamily: F, fontSize: '12px', color: '#ffffff', stroke: '#0c0a0e', strokeThickness: 5 }).setOrigin(0.5).setDepth(D + 5).setAlpha(0));
    SFX.special(lv); this.cameras.main.shake(160, 0.004);
    const hush = (shot ? SP_NAMES : SAVE_NAMES).some(n => (this.msg.text || '').includes(n)); if (hush) { this.msg.setText(''); this.sub.setText(''); }   // (the banner says it: no second caption)
    return { ...q, lv, col, t: 0, dur: (shot ? 0.55 + 0.15 * lv : 1.5) * paceK().cutK, o, veil, band, lines, por, fl, name, sub, seed: Math.random() * 1000 };   // (t-020: dur - ARCADE ~1 s; a shot's 0.7-1 s, ARCADE ~0.45-0.65)
  },
  cutInTick(dt) {
    if (this.cutIn.kind === 'clash') { this.clashTick(dt); return; }
    if (this.cutIn.kind === 'combo') { this.aspCutTick(dt); return; }            // arcadesp.js: the combo special's two-portrait cut-in              // t-028: the clash plays on the cut scene's path (play waits, ENTER cuts it)
    const c = this.cutIn; c.t += dt; const t = c.t, W = VIEW_W, H = VIEW_H, z = this.cameras.main.zoom || 1, cx = W / 2, cy = H / 2;
    const at = (obj, x, y, sc = 1) => obj.setPosition(cx + (x - cx) / z, cy + (y - cy) / z).setScale(sc / z);   // screen point -> what this zoom needs
    const io = clamp(t / 0.2, 0, 1), ein = 1 - Math.pow(1 - io, 3), ko = clamp((t - (c.dur - 0.3)) / 0.3, 0, 1), eout = ko * ko;
    c.veil.setPosition(cx, cy).setScale(1 / z).setAlpha(0.62 * io * (1 - ko));
    const bx = (1 - ein) * W * 1.1 - eout * W * 1.2;                               // the band: in from the right, out to the left
    c.band.clear().setPosition(cx * (1 - 1 / z), cy * (1 - 1 / z)).setScale(1 / z);
    c.band.fillStyle(c.col, 1).fillPoints([{ x: bx, y: H * 0.31 }, { x: bx + W, y: H * 0.23 }, { x: bx + W, y: H * 0.73 }, { x: bx, y: H * 0.81 }], true);
    c.band.fillStyle(0xffde1e, 1).fillPoints([{ x: bx, y: H * 0.29 }, { x: bx + W, y: H * 0.21 }, { x: bx + W, y: H * 0.23 }, { x: bx, y: H * 0.31 }], true)
      .fillPoints([{ x: bx, y: H * 0.81 }, { x: bx + W, y: H * 0.73 }, { x: bx + W, y: H * 0.75 }, { x: bx, y: H * 0.83 }], true);
    c.lines.clear().setPosition(cx * (1 - 1 / z), cy * (1 - 1 / z)).setScale(1 / z).lineStyle(2, 0xffffff, 0.55 * io * (1 - ko));
    for (let i = 0; i < 16; i++) { const yy = H * (0.27 + ((i * 0.618 + c.seed) % 1) * 0.5), len = 80 + ((i * 97) % 200), xx = W + 150 - ((t * 2200 + i * 173 + c.seed) % (W + 400));
      c.lines.lineBetween(xx, yy, xx + len, yy - len * 0.08); }
    const shake = t > 0.2 && t < c.dur - 0.3 ? Math.sin(t * 70) * 2 : 0;
    const px = -160 + (W * 0.3 + 160) * ein - eout * W * 0.7 + shake, py = H * 0.86;
    at(c.por, px, py, 2.6);
    c.fl.forEach((f, i) => { at(f, px + (i - 1) * 70, py - 150 - (i === 1 ? 40 : 0), (3.2 + Math.sin(t * 18 + i * 2) * 0.3) * (i === 1 ? 1.35 : 1)); f.setAlpha(0.85 * io * (1 - ko)).setFlipX(i === 2); });   // flames behind him
    const ti = clamp((t - 0.15) / 0.12, 0, 1);
    at(c.name, W * 0.66 - eout * W * 0.8, H * 0.46, 1 + (1 - ti) * 1.4); c.name.setAlpha(ti * (1 - ko));
    at(c.sub, W * 0.66 - eout * W * 0.8, H * 0.6, 1); c.sub.setAlpha(clamp((t - 0.3) / 0.15, 0, 1) * (1 - ko));
    if (t >= c.dur || (t > 0.35 && Input.pressed('start'))) this.cutInEnd();
  },
  cutInEnd() { const c = this.cutIn; if (!c) return; for (const x of c.o) x.destroy(); this.cutIn = null; this.anims.globalTimeScale = 1; if (c.kind === 'clash') this.clashEnd(c); },   // (t-028: a skipped clash still ends by power)
  // v0.9.0 (Luca: "Teams should be able to use their Iron Wall-like special abilities to also block normal shots (K). Only
  // goalkeepers, no defenders can use defensive special abilities, yet.") A normal shot on target: the defending side
  // can spend its bars on a keeper special save - a sure stop. You: the SAVE prompt (only with a bar in the bank). The
  // computer: only on a shot its keeper wouldn't reach, about half the time. Defenders never get one (keepers only).
  shotSaveCall(def, shooters, pen) {
    const b = this.ball, s = b.save, mt = this.meterOf(def), gk = def.players[0];
    if (!gk || gk.sentOff || pen || b.special || !s || s.gk !== gk || s.off || gk.spSave || mt.level() < 1) return;
    b.saveable = shooters;
    if (this.hasHuman(def) && !this.demo) { this.saveAsk = { team: def, t: 0.75, normal: true }; this.say('', `SPECIAL SAVE? PRESS ${keyset().special}`, 0.75); return; }
    const P = paceK(); if (s.dy > s.cover * P.gkCover && Math.random() < P.gkAnswer * this.dk(def).gkSave) { gk.spSave = mt.spend(); this.saveFx(gk); }   // he'd be beaten: answer it (arcade-2: ARCADE answers more, and a little sooner: a keeper's move against every big shot)
  },
  // the clash at the keeper: true = saved, 'hand' = he only gets a hand to it (t-007: it goes out), 'clash' = a special v
  // his special save: the ball is held on his gloves now and power decides when that ends (t-028, clashStart .. clashEnd)
  clash(gk) {
    const b = this.ball, lv = gk.spSave || 0; gk.spSave = 0; if (!lv || !(b.special || b.saveable)) return null;
    const norm = !b.special; b.saveable = null;                                   // v0.9.0: a special save always stops a normal shot
    const K = SAVE_POWER[lv - 1], N = this.clashN || (this.clashN = {});
    if (norm) {
      // t-007: a power shot (held K) against a LV1 save: half the time only a hand to it - over the bar or round the post
      const hand = lv === 1 && (b.power || 0) > 0.72 && Math.random() < 0.5;
      this.cameras.main.flash(140, 255, 240, 160); this.hitStop = Math.max(this.hitStop || 0, 0.12); SFX.boom(1);
      N[hand ? 'metTip' : 'met'] = (N[hand ? 'metTip' : 'met'] || 0) + 1;         // (the soak: normal shots met by a special save)
      if (hand) { this.gkSpecialHit(gk, 'hand', lv); this.say('A HAND TO IT!', `${SAVE_NAMES[lv - 1]} CAN ONLY PUSH IT AWAY`, 1.4); return 'hand'; }
      this.gkSpecialHit(gk, true, lv);                                            // t-014: the batch 16 move picked by the shot (v0.8.9: the rough save rig)
      this.say('SAVED!', `${SAVE_NAMES[lv - 1]} STOPS THE SHOT`, 1.4);
      this.spBonus(gk.team, 'save');                                              // (t-020: ARCADE - a big save gives a little back)
      return true;
    }
    // t-028 POWER AGAINST POWER: the band from the table (core.js CLASH), a little dice inside it. clashForce: the Test
    // Lab's SM / KS / GP tests make an outcome happen so it can be seen
    const P = b.spP || SP_POWER[b.special - 1], r = P / K * (1 + rnd(-CLASH.jit, CLASH.jit));
    let out = CLASH.bands.find(q => r < q[0])[1], tip = Math.random() < CLASH.tip;
    const F = this.clashForce; if (F) { out = F === 'tip' ? 'bounce' : F; tip = F === 'tip' || (F === 'bounce' && tip); }
    this.clashStart(gk, lv, P, K, out, tip, r);
    return 'clash';
  },
  // ======================================================================= t-028 THE CLASH (Inazuma Eleven's hissatsu shot v hissatsu catch, Captain
  // Tsubasa's keeper driven back over the line: "the ball grinds against the technique for a moment, power numbers decide").
  // The ball meets his gloves and HOLDS there (CLASSIC 0.6 s, ARCADE 0.4, real time): it shudders and spins against his
  // hands on the contact frame of his move, sparks fly, an orb in each level's colour pushes at it (the stronger one
  // grows), the world's animations run slow, the camera eases in on it, Rami: "POWER AGAINST POWER". It runs on the cut
  // scene's path (match.js: play waits, ENTER cuts it short, a test tool's cutInEnd ends it) - however it ends, clashEnd
  // plays the outcome. The same for both keepers: nothing here asks whose keeper it is.
  clashStart(gk, lv, P, K, out, tip, r) {
    const b = this.ball, slv = b.special, SN = this.spName && this.spName.p === b.shotBy ? this.spName.name : SP_NAMES[slv - 1];
    gk.y = this.gkMeetY(b.y, b.y, 30.6, 37.4); gk.vx = gk.vy = 0;                             // (he got there: on its line, as the old save did)
    this.gkSpecialHit(gk, true, lv);                                              // his move on its contact frame, the save's effects
    const c = { kind: 'clash', gk, lv, slv, P, K, out, tip, r, SN, SV: SAVE_NAMES[lv - 1], t: 0, dur: paceK().arcade ? CLASH.holdArcade : CLASH.hold, o: [], fxAt: 0,
      bx: b.x, by: b.y, bz: b.z, vx: b.vx, vy: b.vy, vz: b.vz, cs: SP_HOT[slv - 1][0], ck: RIG_COL[lv - 1] };
    b.vx = b.vy = b.vz = 0;
    if (this.textures.exists('fx')) for (const t of [c.cs, c.ck]) { const im = this.add.image(0, 0, 'fx', 'orb').setTint(t).setAlpha(0.75).setBlendMode(Phaser.BlendModes.ADD); c.o.push(im); }
    if (this.cutInQ && this.cutInQ.who === gk) this.cutInQ = null;               // (his save's cut scene never got its turn: this is the moment now)
    if (!this.camTarget) this.camTarget = c.cam = { x: wx(b.x, b.y), y: wy(b.y) - 40 - b.z * PX_H * 0.5 };
    this.hitStop = 99;                                                            // (no sim step may run under it - watch mode's extra steps a frame: the ball sits still by his gloves; clashEnd lets go)
    this.cameras.main.flash(140, 255, 240, 160); this.cameras.main.shake(c.dur * 1000 + 120, 0.006); SFX.boom(1); SFX.special(lv);
    this.say('POWER AGAINST POWER!', `${SN} ${Math.round(P)} v ${K} ${c.SV}`, c.dur + 0.4);
    this.ramiSay('save', { text: 'POWER AGAINST\nPOWER!!', expr: 'shock' }, 3);
    this.cutIn = c;
  },
  clashTick(dt) {
    const c = this.cutIn, b = this.ball, side = c.gk.team.side;
    if (c.carry) { this.clashCarryTick(c, dt); return; }
    c.t += dt;
    this.anims.globalTimeScale = CLASH.slow;                                      // (match.js froze them for the cut scene: a small slow-mo instead)
    const u = clamp(c.t / c.dur, 0, 1), lean = clamp(c.r - 1, -0.6, 0.9);        // + the shot is winning, - the save
    b.x = c.bx - side * lean * 0.3 * u + rnd(-0.035, 0.035); b.y = c.by + rnd(-0.035, 0.035); b.z = Math.max(0.12, c.bz + rnd(-0.025, 0.025));   // it shudders, pressed in (or pushed back out)
    b.roll = (b.roll || 0) + dt * 30;                                             // spinning against his gloves (render steps the ball's frames by its roll)
    const X = wx(b.x, b.y), Y = wy(b.y) - 12 - b.z * PX_H, D = wy(b.y) + 1, pulse = 0.08 * Math.sin(c.t * 40);
    const [os, ok] = c.o; if (os) {                                               // the two powers pushing: an orb in each level's colour, the stronger one grows
      os.setPosition(X + side * 9, Y).setDepth(D - 0.2).setScale(0.7 + 0.6 * u * Math.max(0, lean) + pulse);
      ok.setPosition(X - side * 9, Y).setDepth(D - 0.2).setScale(0.7 + 0.6 * u * Math.max(0, -lean) + 0.15 * u - pulse); }
    if (this.time.now >= c.fxAt) {                                                // sparks off the contact, both colours
      c.fxAt = this.time.now + 45; c.n = (c.n || 0) + 1;
      this.rigPop('sparks', X + rnd(-10, 10), Y + rnd(-10, 10), D, { s: [0.4, 1.2], ms: 260, tint: c.n % 2 ? c.cs : c.ck, rot: rnd(0, 6.3) });
      if (c.n % 3 === 0) this.rigPop(c.slv >= 2 ? 'bolt' : 'flame', X + rnd(-12, 12), Y + rnd(-14, 6), D, { s: [0.5, 1], ms: 220, tint: c.cs });
      if (c.n % 4 === 0) this.rigPop('ring', X, Y, D - 0.1, { s: [0.4, 1.4 + u], ms: 300, a: 0.7, tint: c.ck });
    }
    const skip = c.t > CLASH.skip && Input.pressed('start');
    if (c.t >= c.dur && !skip && c.out === 'body') { this.clashCarry(c); return; }
    if (c.t >= c.dur || skip) this.cutInEnd();
  },
  // THE BODY: the shot drives him back over his line WITH the ball at his chest (CLASH.carry s), the PixelLab 'blasted
  // back' move. Both are moved by hand here (play still waits), so he really ends up in the net - left to the physics,
  // the goal's freeze stopped him short of it. ENTER / a test tool's cutInEnd: straight to the end (clashEnd)
  clashCarry(c) {
    const gk = c.gk, side = gk.team.side, bl = MAN.kits[gk.kit].anims['blasted-E'];
    c.carry = { t: 0, x0: gk.x, x1: gk.team.ownGoalX - side * 0.7, bz: this.ball.z };
    gk.setState(bl ? 'blasted' : 'fall', 1.5); gk.face = side > 0 ? 0 : 4; gk.vx = gk.vy = 0;
    if (c.cam && this.camTarget === c.cam) { this.camTarget = null; c.cam = null; }
    this.cameras.main.flash(120, 255, 240, 200); this.cameras.main.shake(420, 0.018); SFX.boom(1);
    this.say('BLASTED INTO THE NET!', `${c.SN} ${Math.round(c.P)} v ${c.K} ${c.SV} - HE GOES IN WITH IT!`, 1.8);
    this.ramiSay('save', { text: 'HE\'S IN THE NET WITH IT!!!\nWHAT POWER!', expr: 'laugh' }, 3);
  },
  clashCarryTick(c, dt) {
    const K = c.carry, gk = c.gk, b = this.ball, side = gk.team.side; K.t += dt;
    this.anims.globalTimeScale = 1;
    const u = clamp(K.t / CLASH.carry, 0, 1), e = 1 - (1 - u) * (1 - u);
    gk.x = K.x0 + (K.x1 - K.x0) * e; b.x = gk.x + side * 0.45; b.y = c.by; b.z = Math.max(0.5, K.bz * (1 - 0.3 * e)); b.roll = (b.roll || 0) + dt * 30;
    if (this.time.now >= c.fxAt) { c.fxAt = this.time.now + 60;
      const X = wx(b.x, b.y), Y = wy(b.y) - 12 - b.z * PX_H; this.rigPop('sparks', X, Y, wy(b.y) + 1, { s: [0.5, 1.3], ms: 260, tint: c.cs, rot: rnd(0, 6.3) });
      this.rigPop('dust', wx(gk.x, gk.y), wy(gk.y) - 4, wy(gk.y) - 1, { s: [0.4, 1.1], ms: 320 }); }
    if (u >= 1 || Input.pressed('start')) this.cutInEnd();
  },
  // how it ends (core.js CLASH: the bands). The caption says it in plain words, the two numbers on it.
  clashEnd(c) {
    const b = this.ball, gk = c.gk, side = gk.team.side; this.hitStop = 0;
    Object.assign(b, { x: c.bx, y: c.by, z: c.bz, vx: c.vx, vy: c.vy, vz: c.vz });
    if (c.cam && this.camTarget === c.cam) this.camTarget = null;
    const key = c.out === 'bounce' && c.tip ? 'tip' : c.out, N = this.clashN || (this.clashN = {}); N[key] = (N[key] || 0) + 1;
    this.clashLast = { out: key, P: Math.round(c.P), K: c.K, r: +c.r.toFixed(2), held: +c.t.toFixed(2), slv: c.slv, lv: c.lv, sn: c.SN, sv: c.SV };   // (the Test Lab's KC lines read it)
    const sk = `${c.SV} ${c.K} v ${Math.round(c.P)} ${c.SN}`, ss = `${c.SN} ${Math.round(c.P)} v ${c.K} ${c.SV}`;   // (the winner's name first)
    this.cameras.main.flash(120, 255, 240, 200); SFX.boom(1);
    if (c.out === 'held') {                                                       // HELD: caught - he lands with it (his move plays on from the contact)
      b.vx = b.vy = b.vz = 0; this.gkCount(gk.team, 'held'); this.gain(gk, 0);
      this.say('SAVED!', `${sk} - HE HOLDS IT!`, 1.6); this.ramiSay('save', { text: `HE HOLDS IT!!\n${c.SV} WINS!`, expr: 'shock' }, 3);
      this.spBonus(gk.team, 'save'); this.flagReplay('WHAT A SAVE!', gk); this.shotSaved(gk); return;
    }
    if (c.out === 'bounce') {                                                     // BOUNCES OFF: tipped for a corner (t-007), or back out into play
      b.special = 0; b.spP = 0; b.save = null; this.gkCount(gk.team, 'parried');
      if (c.tip) { const hi = b.z > 1.3; this.gkSpecialHit(gk, 'hand', c.lv); this.gkDeflect(gk, hi ? 'tip' : 'wide');
        this.say(hi ? 'TIPPED OVER!' : 'ROUND THE POST!', `${sk} - IT BOUNCES OFF HIS GLOVES`, 1.6); }
      else { const rel = b.y - 34 || rnd(-1, 1);                                  // a live rebound for a man following in (a strong parry into a dangerous area: a real keeper's mistake)
        b.vx = side * rnd(6, 10); b.vy = Math.sign(rel) * rnd(2, 6); b.vz = rnd(2.5, 4.5); b.z = Math.max(b.z, 0.4);
        b.skid = true; b.rollV = 0; b.last = gk.team; b.lastP = gk; b.target = null; b.ring = null; gk.cool = 0.5;
        this.gpPop(gk, 'parry', 30);
        this.say('PARRIED!', `${sk} - IT BOUNCES OFF HIM!`, 1.6); }
      this.ramiSay('save', { text: c.tip ? 'A HAND TO IT!!\nHE PUSHES IT AWAY!' : 'IT BOUNCES OFF HIM!!\nIT\'S STILL LIVE!', expr: 'shock' }, 3);
      this.spBonus(gk.team, 'save'); this.flagReplay('WHAT A SAVE!', gk); this.shotSaved(gk); return;
    }
    // the shot wins: it goes on into the net (his hands took a little of it) and he can't touch it again
    const body = c.out === 'body', k = body ? 0.7 : 0.8;
    b.vx *= k; b.vy *= k; b.save = null; b.saveable = null; gk.spSave = 0; gk.face = side > 0 ? 0 : 4;
    const bl = MAN.kits[gk.kit].anims['blasted-E'];
    if (body) {                                                                   // THE BODY: he's in the net with it (clashCarry; skipped: straight there)
      if (!c.carry) this.clashCarry(c);
      gk.x = c.carry.x1; gk.vx = -side * 1.5; gk.vy = 0; gk.stun = 0.6; gk.cool = 2;
      b.x = gk.team.ownGoalX - side * 0.3; b.y = c.by; b.z = Math.max(0.5, c.carry.bz * 0.7);   // just over the line: in (matchflow.js rules)
      b.vx = -side * 6; b.vy = 0; b.vz = 0;
    } else {                                                                      // HANDS BLOWN AWAY: arms knocked back, he's thrown off his feet, it goes on
      gk.setState(bl ? 'blasted' : 'fall', 0.9); gk.vx = -side * 1.6; gk.vy = (Math.sign(gk.y - b.y) || 1) * 1.5; gk.stun = 0.9; gk.cool = 1.4;
      this.hitStop = 0.07; this.cameras.main.shake(280, 0.012);
      this.say('THROUGH HIS HANDS!', `${ss} - HIS HANDS ARE BLOWN AWAY!`, 1.8); this.ramiSay('save', { text: 'THROUGH HIS HANDS!!\nTOO MUCH POWER!', expr: 'laugh' }, 3);
    }
    this.flagReplay('THROUGH THE KEEPER!', gk);
    if (!body) this.gpPop(gk, 'break', len(b.vx, b.vy));                          // (t-013 GOAL_PHYS: through his hands it sometimes loops up off him instead; the body goes in with it)
  },
  // RISE UP: the third bar is full. BASIC: the words blink in. WILD: they slam in huge and tilted, flicker through
  // fire colours, PixelLab flames burn under the letters and the flaming arrow-exclamation bobs beside them.
  riseUp(team) {
    const wild = SP_STYLE === 'wild', F = '"Press Start 2P"', fx = this.textures.exists('fx');
    if (this.rise) this.rise.c.destroy();
    const c = this.add.container(VIEW_W / 2, 176); this.hud.add(c);
    const fl = [];
    if (fx && wild) for (let i = 0; i < 12; i++) fl.push(this.add.image(-154 + i * 28, 24, 'fx', ['flame', 'flame2', 'flameTwin'][i % 3]).setOrigin(0.5, 1).setAlpha(0.95));
    const st = { fontFamily: F, fontSize: '40px' };
    const back = this.add.text(5, 6, 'RISE UP', { ...st, color: '#5a0f14' }).setOrigin(0.5);
    const mid = this.add.text(0, 0, 'RISE UP', { ...st, color: '#ff6a1e', stroke: '#0c0a0e', strokeThickness: 8 }).setOrigin(0.5);
    const top = this.add.text(0, 0, 'RISE UP', { ...st, color: '#ffde1e', stroke: '#0c0a0e', strokeThickness: 8 }).setOrigin(0.5);
    top.setCrop(0, 0, top.width, top.height * 0.52);                              // two-tone fire letters: yellow over orange
    const who = this.add.text(0, -42, `${team.name} · ENERGY FULL · LV3`, { fontFamily: F, fontSize: '10px', color: '#f4f0e4', stroke: '#0c0a0e', strokeThickness: 5 }).setOrigin(0.5);
    const arrow = fx ? this.add.image(mid.width / 2 + 40, -2, 'fx', 'arrowbang').setScale(wild ? 1.6 : 1.2)
      : this.add.text(mid.width / 2 + 30, 0, '!', { ...st, color: '#ffde1e', stroke: '#0c0a0e', strokeThickness: 8 }).setOrigin(0.5);
    c.add([...fl, back, mid, top, who, arrow]);
    this.rise = { c, t: 0, wild, fl, top, mid, arrow, who };
    SFX.rise();
    this.ramiSay('skill', { text: `LISTEN TO THIS CROWD!\n${team.name}, RISE UP!!`, expr: 'laugh' }, 1);
    if (wild) { c.setScale(3).setAngle(-14).setAlpha(0); this.tweens.add({ targets: c, scale: 1, angle: -4, alpha: 1, duration: 280, ease: 'Back.easeOut' });
      this.cameras.main.flash(140, 255, 190, 60); this.cameras.main.shake(260, 0.004); }
  },
  tickRise(dt) {
    this.curveTick(dt);                                                           // (t-011: the curving pass's trail and camera)
    const R = this.rise; if (!R) return; R.t += dt; const T = 2.3;
    if (R.wild) {
      const fire = ['#ffffff', '#ffde1e', '#ffb02e', '#ffde1e'];
      R.top.setColor(fire[Math.floor(R.t * 18) % 4]);
      R.c.setPosition(VIEW_W / 2 + Math.round(rnd(-1.6, 1.6)), 176 + Math.round(rnd(-1.2, 1.2)) - (R.t > T - 0.4 ? (R.t - T + 0.4) * 160 : 0));
      R.fl.forEach((f, i) => f.setScale(0.85 + 0.25 * Math.sin(R.t * 15 + i * 1.7), 1.0 + 0.35 * Math.sin(R.t * 11 + i * 2.3)));
      R.arrow.setY(-4 + Math.sin(R.t * 9) * 5).setAngle(Math.sin(R.t * 7) * 6);
    } else R.c.setVisible(R.t > 1.0 || Math.floor(R.t * 6) % 2 === 0);
    if (R.t > T - 0.4) R.c.setAlpha(Math.max(0, (T - R.t) / 0.4));
    if (R.t > T) { R.c.destroy(); this.rise = null; }
  },
  // SPECIAL (U / B / pad LB) on the ball: spends every full bar. Fixed, hard and on target; the level decides how it looks.
  special(p) {
    const mt = this.meterOf(p.team), b = this.ball;
    if (mt.level() < 1 || p.keeper || b.owner !== p || p.busy() || this.pending) return false;
    const lv = mt.spend(), pax = this.inpOf(p.team).axis, held = this.isHuman(p) && Math.abs(pax.y) > 0.2, aim = held ? pax.y : (Math.random() < 0.5 ? -1 : 1) * rnd(0.55, 1);   // no aim held: it picks a corner
    this.doShot(p, 0.8, aim);
    const k = this.pending; if (!k || k.p !== p) return false;
    k.ty = clamp(34 + aim * 2.9 + rnd(-0.25, 0.25), GOAL_Y0 + 0.5, GOAL_Y1 - 0.5); k.tx = p.team.goalX + p.team.side * 2;
    const f = spRange(lv, p);                                                    // v0.8.6 range
    k.speed = [31, 35, 39][lv - 1] * (0.7 + 0.3 * f); k.vz = [1.3, 0.7, 2.2][lv - 1]; k.info.special = lv; k.info.power = 1; k.info.spP = SP_POWER[lv - 1] * f; k.info.spF = f;
    if (f < 0.999) this.time.delayedCall(700, () => this.say('', f > 0.8 ? 'A LONG WAY OUT...' : 'TOO FAR - IT LOSES ITS POWER', 1));
    const SA = ['sp1', 'sp2', 'super'][lv - 1];                                   // PixelLab special-move demos: LV1 spin strike, LV2 thunder strike, LV3 leap
    if (MAN.kits[p.kit].anims[`${SA}-E`]) {
      p.face = p.team.side > 0 ? 0 : 4; p.kickAnim = SA; p.setState('kick', 12 / kickRate(SA) + 0.05);
      k.t = (KICK_HIT[SA] + 0.6) / kickRate(SA);
      for (const o of p.team.opp.players) o.stun = Math.max(o.stun, k.t + 0.2);  // everyone stops to watch
    }
    const NM = this.spNameFor ? this.spNameFor(p.team, lv) : SP_NAMES[lv - 1];   // (arcadesp.js: on ARCADE a LV3 is the team's own signature shot)
    this.say(NM + '!', `${p.team.name} · LV${lv} SPECIAL`, 1.3); this.spName = { p, name: NM };
    this.ramiSay('skill', { text: [`A ${SP_NAMES[0]}!\nTHE BALL IS ON FIRE!`, `${SP_NAMES[1]}!\nYOU CAN HEAR IT CRACKLE!`, `THE ${NM}!!\nI HAVE NEVER SEEN THAT!`][lv - 1], expr: 'laugh' }, 2);
    SFX.special(lv); this.flagReplay(NM + '!');
    if (!window.HC2_TEST_FAST && !this.replay && (!window.__lab || window.__labCut)) this.cutInQ = { kind: 'shot', who: p, lv, name: NM };   // 29 Oct: its cut-in (during the wind-up; with arcade specials: the team's signature name on a LV3)
    return true;
  },
  // ======================================================================= t-011 THE CURVING SPECIAL PASS (Luca 24 Oct 05:57: "add a special
  // lvl 1 pass that curves impressively and dynamically, make it look cool, [...] one for lob, one for through ball, one
  // for normal pass (don't add these new passes to the game just yet, only test lab)"). SPECIAL held + PASS / THROUGH /
  // LOB (actions.js) with a bar in the bank: the same team-mate / space the normal pass picks, but it bends round the man
  // on the straight line (ball.js curveSolve / curveStep) and spends ONE bar (a special shot spends them all). The look,
  // with no new art: the PixelLab batch 17 move (contact on its strike frame), a name banner like the special shots', the
  // ball trail tinted along the curve and the camera easing a little towards where it's going. Behind CURVE_PASS (core.js).
  curvePass(p, mode, dir) {
    const mt = this.meterOf(p.team), b = this.ball;
    if (!CURVE_PASS || mt.level() < 1 || p.keeper || b.owner !== p || p.busy() || this.pending || this.setPiece) return false;
    this.doPass(p, dir, mode);                                                   // who it goes to: the normal pass's pick
    const k = this.pending; if (!k || k.p !== p) return false;
    mt.e -= 1; mt.flash = 0.3; if (mt.level() < 3) mt.risen = false;             // (back under 3 bars: RISE UP may come again)
    const A = CURVE_MOVE[mode], east = k.tx >= p.x;
    k.info.curve = { mode, foot: east ? 1 : -1 };                                // (the frames face E; facing W they're mirrored: the other foot)
    if (MAN.kits[p.kit].anims[`${A}-E`]) { p.face = east ? 0 : 4; p.kickAnim = A; p.setState('kick', 8 / kickRate(A) + 0.05); k.t = (KICK_HIT[A] + 0.6) / kickRate(A); }
    this.say(CURVE_NAMES[mode], `${p.team.name} · LV1 SPECIAL PASS`, 1.1);
    return true;
  },
  // it's left the boot (ball.js curveLaunch): a small flash in its colour and the trail + camera start
  curveFx(k, S) {
    const c = CURVE_COL[k.info.curve.mode];
    this.cvFx = { t: 0, mode: k.info.curve.mode, cols: c, hist: [], tx: k.tx, ty: k.ty, cam: null };
    this.cameras.main.flash(70, (c[3] >> 16) & 255, (c[3] >> 8) & 255, c[3] & 255);
  },
  // every frame (from tickRise, the per-frame hook this file already has): the tinted trail - the PixelLab ball repeated
  // along the last ~half second of flight, spaced out so the bend itself shows - and the camera's lean towards the target
  // (camTarget, world.js: it follows that point with its slower ease), handed back once the ball is played or after CURVE.cam
  curveTick(dt) {
    const F = this.cvFx; if (!F) return;
    const b = this.ball, tr = this.cvTrail || (this.cvTrail = Array.from({ length: 9 }, () => this.add.image(0, 0, 'props', 'ball-x0').setVisible(false)));
    F.t += dt;
    const live = !b.owner && !this.replay && F.t < CURVE.trail && this.ballSpr;
    if (live) { F.hist.unshift([this.ballSpr.x, this.ballSpr.y, this.ballSpr.frame.name, this.ballSpr.depth]); F.hist.length = Math.min(F.hist.length, 30); }
    tr.forEach((im, i) => { const h = live && F.hist[(i + 1) * 3]; if (!h) { im.setVisible(false); return; }
      im.setVisible(true).setPosition(h[0], h[1]).setFrame(h[2]).setDepth(h[3] - 0.1).setScale(this.ballSpr.scaleX * (1 - i * 0.07)).setAlpha(0.95 - i * 0.08).setTintFill(F.cols[Math.min(i, F.cols.length - 1)]); });
    const camOn = live && F.t < CURVE.cam && (!this.camTarget || this.camTarget === F.cam);
    if (camOn) { const X = wx(F.tx, F.ty), Y = wy(F.ty);
      F.cam = F.cam || {}; F.cam.x = this.ballSpr.x + (X - this.ballSpr.x) * 0.35; F.cam.y = this.ballSpr.y + (Y - this.ballSpr.y) * 0.35; this.camTarget = F.cam; }
    else if (F.cam && this.camTarget === F.cam) this.camTarget = null;
    if (!live) { if (F.cam && this.camTarget === F.cam) this.camTarget = null; tr.forEach(im => im.setVisible(false)); this.cvFx = null; }
  },
  // v0.8 a hard shot the keeper had to deal with: the attacking side earns energy (more for a power shot)
  shotSaved(gk) {
    const b = this.ball, by = b.shotBy || b.lastP; if (!by || by.team === gk.team) return;
    if (this.savedFor === b.shotT) return; this.savedFor = b.shotT;              // once per shot
    // v0.8.1 (Luca): SP comes from time only - nothing here any more
  },
  // v0.8 GUARD BROKEN: the keeper gets the ball but it's too much - he's knocked back and it carries on into the net
  guardBreak(gk) {
    const b = this.ball; gk.guard = 0.55; gk.guardT = 0; gk.cool = 1.2; gk.stun = 1.2; b.save = null;
    if (MAN.kits[gk.kit].anims['blasted-E']) { gk.setState('blasted', 1.2); gk.face = gk.team.side > 0 ? 0 : 4; gk.vx = gk.team.side * -2.5; gk.vy = 0; }
    else gk.setState('fall', 0.7);
    b.vx *= 0.85; b.vy *= 0.85; this.hitStop = Math.max(this.hitStop || 0, 0.09); this.cameras.main.shake(220, 0.012); this.cameras.main.flash(120, 255, 240, 200);
    this.say('GUARD BROKEN!', 'IT GOES THROUGH HIM!', 1.2); this.flagReplay('THROUGH THE KEEPER!', gk);
  },
  meterOf(team) { return (this.meters && team && this.meters[team === this.home ? 0 : 1]) || { add() {}, level: () => 0, spend: () => 0 }; },
});
