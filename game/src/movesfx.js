'use strict';
// HC2 Football · movesfx.js: MOVE SOUNDS - every special move gets its own sound, themed to its element (fire crackles,
// thunder cracks, the tornado swirls, shadow hisses in reverse, the rainbow sparkles up a scale, iron clangs ...), and
// the new interactions get theirs: keeper dives / catches / parries / punches, the 1 V 1 slow-mo, corners, the replay,
// the menu. All made in code with Web Audio (no sound files, so nothing with an unclear licence), through SFX's own
// output, so M (mute), - / = and the pause menu's VOLUME cover them too.
// (load order and lanes: src/README.md; loaded after resume.js, before boot.js: it wraps Match / Player methods)
//
// Luca, 31 Oct 2026 13:07: "develop a sound effect for all new moves and interactions".
// How real football and other games do it (words only): real football's sound is the crowd and the ball - the crowd
// lifts before a corner and gasps at a big save, a keeper's catch is a dull leather smack, a parry a sharper slap.
// The specials games give every move its own voice: Inazuma Eleven's hissatsu each have an element sound (fire roars,
// wind howls, holy techniques ring with a choir), Captain Tsubasa's drive shots whoosh then thump, Mario Strikers'
// Mega Strike has a charge, a cue and a hit. Fighting games teach the rule we keep: the sound starts on the frame the
// move does (no lag), is short (under ~1.5 s) and has one clear "hit" so play stays readable. Slow-mo in FIFA's and
// PES's replays pitches the world down and brings in a heartbeat; replays open with a tape-rewind swoosh on TV.
//
// HOW IT HOOKS IN (no change to the moves' own code, so moves on open branches sound right the day they merge):
//  - every special already says its name: this.say('<NAME>!', ...), or say('', '<NAME>! · ...') for a save. When that
//    name is in MOVE_SFX below, its element sound plays and the generic SFX.special() whoosh of the same moment is
//    skipped (one sound per move, not two). A new move = one line in MOVE_SFX. A move can also call MSFX.play(element).
//  - the interactions are wraps of the moments the game already has: Player.setState (keeper dive / punch),
//    Match.gkCount (parried / punched / smothered), Match.spSetup (a corner), Match.startReplay / endReplay,
//    Match.render (the 1 V 1 slow-mo of PR #73 = this.v1, the chip's slow motion = this.slowMo), and the start menu's
//    buttons (PR #79's too). The game's own sounds (kicks, whistle, net, crowd) are unchanged.
//  - the sound only uses its own little random number list, never Math.random, so seeded matches stay identical.
// Off: MOVE_SOUND.on = false (everything here goes quiet, the old sounds stay). The Test Lab's SOUND BOARD button
// (and game/sounds.html) plays every sound, one by one or all in a row.

const MOVE_SOUND = { on: true, vol: 1 };

// Every special's name -> its element (the same names and elements as the MOVE CALL pop-ups of PR #85, so a fire name
// that burns on screen also roars). Names from specials.js, arcadesp.js and the open PRs #70, #75, #76, #77.
const MOVE_SFX = {
  // special shots (SP_NAMES) and the aerial specials
  'BLAZE SHOT': 'fire', 'THUNDER SHOT': 'thunder', 'RISING PHOENIX': 'phoenix',
  'AIR BLAZE': 'fire', 'TIDE CUTTER': 'water', 'SKY THUNDER': 'thunder', 'CYCLONE HEEL': 'wind', 'PHOENIX': 'phoenix', 'METEOR DRIVE': 'cosmic',
  // keeper special saves (SAVE_NAMES)
  'IRON WALL': 'iron', 'THUNDER GLOVE': 'thunder', 'RISING SHIELD': 'phoenix',
  // the curving special passes (t-011) and PR #70's LV1 special passes
  'CURLER': 'curl', 'OUTSIDE CURL': 'curlGold', 'BANANA LOB': 'banana',
  'TORNADO DRILL': 'tornado', 'BURROW BLAST': 'earth', 'ANGEL GLIDE': 'holy',
  // PR #75's skill dribbles
  'RAINBOW FLICK': 'rainbow', 'SHADOW STEP': 'shadow',
  // ARCADE: each team's signature shot, combo and special dribble (arcadesp.js TEAM_SP) + the fallbacks
  'WHITE COMET': 'cosmic', 'TWIN COMET': 'cosmic', 'MIRAGE STEP': 'shadow',
  'CRIMSON FANG': 'crimson', 'TWIN FANG': 'crimson', 'EMBER DANCE': 'fire',
  'SOLAR FLARE': 'sun', 'DOUBLE SUN': 'sun', 'SUNSPIN': 'sun',
  'SAKURA STORM': 'sakura', 'PETAL CYCLONE': 'sakura', 'BLOSSOM FEINT': 'sakura',
  'EMERALD GALE': 'leaf', 'TWIN GALE': 'leaf', 'LEAF SHADOW': 'leaf',
  'SCARLET LANCE': 'crimson', 'CROSSED LANCES': 'crimson', 'PHANTOM CUT': 'shadow',
  'TWIN STRIKE': 'power', 'SPECIAL DRIBBLE': 'power',
  // PR #76's keeper flair saves
  'SKY SNATCH': 'glove', 'FLYING STRETCH': 'glove', 'TOP-CORNER STRETCH': 'glove', 'LOW SCRAMBLE': 'glove', 'STARFISH WALL': 'glove',
};
// Other lines the game says that get a sound (the big text or the small one, matched from the start)
const SAY_SFX = [
  [/^WHAT A SAVE/, 'bigSave'], [/^A HAND TO IT/, 'parry'], [/^SMOTHERED/, 'smother'], [/^SP METER EMPTY/, 'empty'],
  [/^OFF THE (POST|BAR)/, null],   // (the game's own post sound already plays)
];
const msKey = s => String(s || '').trim().replace(/!+$/, '').trim();

// The sound board's list: what each sound is, in the order PLAY ALL plays them
const MSFX_LIST = [
  ['SPECIAL MOVES', [
    ['fire', 'FIRE · BLAZE SHOT, AIR BLAZE, EMBER DANCE'], ['thunder', 'THUNDER · THUNDER SHOT, SKY THUNDER, THUNDER GLOVE'],
    ['phoenix', 'PHOENIX · RISING PHOENIX, RISING SHIELD'], ['tornado', 'TORNADO · TORNADO DRILL'], ['wind', 'WIND · CYCLONE HEEL'],
    ['water', 'WATER · TIDE CUTTER'], ['cosmic', 'COMET · METEOR DRIVE, WHITE COMET'], ['sun', 'SUN · SOLAR FLARE, SUNSPIN'],
    ['iron', 'IRON · IRON WALL'], ['shadow', 'SHADOW · SHADOW STEP, MIRAGE STEP, PHANTOM CUT'], ['rainbow', 'RAINBOW · RAINBOW FLICK'],
    ['earth', 'EARTH · BURROW BLAST'], ['holy', 'ANGEL · ANGEL GLIDE'], ['sakura', 'SAKURA · SAKURA STORM, BLOSSOM FEINT'],
    ['leaf', 'LEAF · EMERALD GALE, LEAF SHADOW'], ['crimson', 'CRIMSON · CRIMSON FANG, SCARLET LANCE'],
    ['curl', 'CURL · CURLER'], ['curlGold', 'GOLD CURL · OUTSIDE CURL'], ['banana', 'BANANA · BANANA LOB'],
    ['power', 'POWER · TWIN STRIKE, SPECIAL DRIBBLE'],
  ]],
  ['KEEPER', [
    ['dive', 'DIVE · whoosh'], ['catch', 'CATCH · leather smack'], ['parry', 'PARRY · palm slap'], ['punch', 'PUNCH · fist'],
    ['smother', 'SMOTHER · at your feet'], ['glove', 'FLAIR SAVE · SKY SNATCH, FLYING STRETCH ...'], ['bigSave', 'WHAT A SAVE! · crowd gasp'],
  ]],
  ['MOMENTS', [
    ['oneIn', '1 V 1 · slow-mo in'], ['heart', '1 V 1 · heartbeat'], ['oneOut', '1 V 1 · back to speed'], ['slow', 'SLOW MOTION · chip'],
    ['corner', 'CORNER · crowd lifts'], ['replayIn', 'REPLAY · rewind in'], ['replayOut', 'REPLAY · back to live'],
    ['callout', 'NAME POP-UP · stinger'], ['empty', 'SP METER EMPTY'],
  ]],
  ['MENU', [['hover', 'MENU · move'], ['select', 'MENU · pick'], ['start', 'MENU · PLAY / START'], ['back', 'MENU · BACK / DONE']]],
];

const MSFX = {
  seed: 7, lastEl: -1, last: {}, delay: null,
  rnd() { this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff; return this.seed / 0x7fffffff; },   // (not Math.random: seeded matches)
  ok() { return MOVE_SOUND.on && SFX.ok(); },
  now() { return SFX.ctx.currentTime; },
  // ---- the voices (all into SFX.out, so mute / volume apply)
  // an oscillator: f0 -> f1 over dur, attack a, filter {type, f0, f1, q}, vibrato {r, d}, wet = into the echo
  osc(o) {
    const c = SFX.ctx, t = this.now() + (o.at || 0), d = o.dur || 0.2, a = o.a || 0.005, v = (o.vol || 0.2) * MOVE_SOUND.vol;
    const os = c.createOscillator(), g = c.createGain(); os.type = o.type || 'sine';
    os.frequency.setValueAtTime(o.f0, t); if (o.f1 && o.f1 !== o.f0) os.frequency[o.lin ? 'linearRampToValueAtTime' : 'exponentialRampToValueAtTime'](Math.max(20, o.f1), t + d);
    if (o.det) os.detune.value = o.det;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + a);
    if (o.hold) g.gain.setValueAtTime(v, t + a + o.hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    let n = os;
    if (o.vib) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = o.vib.r; lg.gain.value = o.vib.d; l.connect(lg).connect(os.frequency); l.start(t); l.stop(t + d + 0.05); }
    if (o.filt) { const f = c.createBiquadFilter(); f.type = o.filt.type || 'lowpass'; f.Q.value = o.filt.q || 1; f.frequency.setValueAtTime(o.filt.f0, t); if (o.filt.f1) f.frequency.exponentialRampToValueAtTime(o.filt.f1, t + d); n.connect(f); n = f; }
    n.connect(g); this.route(g, o.wet); os.start(t); os.stop(t + d + 0.05);
  },
  // filtered noise: band f0 -> f1, q, attack a (a long attack = a swell, like a sound played backwards)
  noise(o) {
    const c = SFX.ctx, t = this.now() + (o.at || 0), d = o.dur || 0.2, a = o.a || 0.004, v = (o.vol || 0.2) * MOVE_SOUND.vol;
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = o.white ? this.white() : SFX.noise; s.loop = true;
    f.type = o.type || 'bandpass'; f.Q.value = o.q || 1; f.frequency.setValueAtTime(o.f0, t);
    if (o.f1) f.frequency.exponentialRampToValueAtTime(o.f1, t + (o.fd || d));
    if (o.wob) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = o.wob.r; lg.gain.value = o.wob.d; l.connect(lg).connect(f.frequency); l.start(t); l.stop(t + d + 0.05); }
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + a);
    if (o.hold) g.gain.setValueAtTime(v, t + a + o.hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    s.connect(f).connect(g); this.route(g, o.wet); s.start(t, this.rnd() * 1.5); s.stop(t + d + 0.05);
  },
  white() {                                                                       // a bright noise for cracks and sparkles (made once)
    if (this.wh) return this.wh; const c = SFX.ctx, n = c.sampleRate, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = this.rnd() * 2 - 1; return (this.wh = b);
  },
  route(g, wet) {
    g.connect(SFX.out);
    if (wet) {                                                                    // one shared echo (holy, shadow, phoenix ring out)
      const c = SFX.ctx;
      if (!this.delay) { const d = c.createDelay(1), fb = c.createGain(), lp = c.createBiquadFilter(); d.delayTime.value = 0.16; fb.gain.value = 0.38; lp.type = 'lowpass'; lp.frequency.value = 2800; d.connect(lp).connect(fb).connect(d); lp.connect(SFX.out); this.delay = d; }
      const w = c.createGain(); w.gain.value = wet; g.connect(w).connect(this.delay);
    }
  },
  thud(p = 1, at = 0) { this.osc({ f0: 130, f1: 38, dur: 0.28, vol: 0.55 * p, at }); this.noise({ f0: 260, q: 0.8, dur: 0.18, vol: 0.3 * p, at }); },
  notes(list, o) { list.forEach((f, i) => this.osc(Object.assign({ f0: f, f1: f, at: (o.at || 0) + i * (o.step || 0.06) }, o, { at: (o.at || 0) + i * (o.step || 0.06) }))); },

  // ---- the sounds. Each: a lead-in, ONE clear hit, a short tail. Keep under ~1.5 s.
  S: {
    fire(M) {      // ignition whoosh, crackles, a low roar under it, the hit
      M.noise({ f0: 300, f1: 3200, q: 0.7, dur: 0.55, a: 0.18, vol: 0.32 });
      M.osc({ type: 'sawtooth', f0: 62, f1: 48, dur: 0.9, a: 0.1, vol: 0.12, filt: { f0: 380, f1: 160, q: 2 } });
      for (let i = 0; i < 12; i++) M.noise({ white: true, type: 'highpass', f0: 2500 + M.rnd() * 3000, q: 1, dur: 0.02 + M.rnd() * 0.03, vol: 0.12 + M.rnd() * 0.12, at: 0.05 + M.rnd() * 0.75 });
      M.thud(0.9, 0.16);
    },
    thunder(M) {   // a crackle of static, the crack, zaps, the rumble rolling away
      M.noise({ white: true, type: 'highpass', f0: 4000, q: 0.5, dur: 0.12, a: 0.08, vol: 0.12 });
      M.noise({ white: true, type: 'highpass', f0: 1500, q: 0.5, dur: 0.16, vol: 0.55, at: 0.1 });
      [0.1, 0.17, 0.27].forEach((t, i) => M.osc({ type: 'square', f0: 2400 - i * 400, f1: 180, dur: 0.07, vol: 0.07, at: t }));
      M.noise({ type: 'lowpass', f0: 220, f1: 90, q: 0.7, dur: 1.3, a: 0.05, vol: 0.5, at: 0.12 });
      M.thud(0.8, 0.1);
    },
    phoenix(M) {   // the rise, a bird's cry, a bright fanfare, ringing out
      M.osc({ type: 'sawtooth', f0: 180, f1: 1500, dur: 0.5, a: 0.05, vol: 0.08, filt: { f0: 600, f1: 4000, q: 3 } });
      M.osc({ f0: 1900, f1: 3100, dur: 0.38, a: 0.03, vol: 0.09, vib: { r: 22, d: 120 }, at: 0.25, wet: 0.4 });
      M.notes([523, 659, 784, 1047], { type: 'square', dur: 0.2, vol: 0.06, step: 0.06, at: 0.4, wet: 0.3 });
      M.noise({ f0: 3000, f1: 6000, q: 0.8, dur: 0.6, a: 0.2, vol: 0.1, at: 0.3 }); M.thud(0.8, 0.42);
    },
    sun(M) {       // a swelling major chord, a flare of shimmer, the hit
      [262, 330, 392, 523].forEach(f => M.osc({ type: 'triangle', f0: f, f1: f * 1.01, dur: 0.9, a: 0.3, vol: 0.06, wet: 0.2 }));
      M.noise({ white: true, type: 'highpass', f0: 5000, q: 0.5, dur: 0.6, a: 0.3, vol: 0.08 });
      M.osc({ type: 'sawtooth', f0: 220, f1: 1760, dur: 0.32, a: 0.02, vol: 0.06, at: 0.08, filt: { f0: 1200, q: 1 } }); M.thud(0.9, 0.32);
    },
    water(M) {     // bubbles, a wave washing in and slicing out
      for (let i = 0; i < 7; i++) { const f = 300 + M.rnd() * 500; M.osc({ f0: f, f1: f * 2.6, dur: 0.07, vol: 0.12, at: i * 0.045 }); }
      M.noise({ f0: 500, f1: 1800, q: 1.2, dur: 0.6, a: 0.2, vol: 0.32, at: 0.1 });
      M.noise({ white: true, type: 'highpass', f0: 3000, f1: 900, q: 0.7, dur: 0.25, vol: 0.18, at: 0.38 }); M.thud(0.6, 0.38);
    },
    tornado(M) {   // a swirling howl spinning up (the filter wobbles round), then the drill bites
      M.noise({ f0: 400, f1: 2400, q: 6, dur: 1.0, a: 0.25, vol: 0.4, wob: { r: 9, d: 500 } });
      M.osc({ f0: 600, f1: 1600, dur: 0.9, a: 0.3, vol: 0.05, vib: { r: 9, d: 60 } });
      M.osc({ type: 'sawtooth', f0: 90, f1: 140, dur: 0.4, a: 0.02, vol: 0.12, vib: { r: 40, d: 30 }, at: 0.55, filt: { f0: 700, q: 2 } }); M.thud(0.8, 0.6);
    },
    wind(M) {      // a gust round the heel and the swish of the strike
      M.noise({ f0: 500, f1: 1800, q: 3, dur: 0.7, a: 0.2, vol: 0.35, wob: { r: 5, d: 300 } });
      M.noise({ white: true, type: 'highpass', f0: 2000, f1: 6000, q: 0.7, dur: 0.18, vol: 0.2, at: 0.35 }); M.thud(0.7, 0.36);
    },
    cosmic(M) {    // the falling whistle of a meteor, the impact, sparks
      M.osc({ f0: 3200, f1: 260, dur: 0.6, a: 0.04, vol: 0.09, vib: { r: 30, d: 40 } });
      M.noise({ f0: 4000, f1: 500, q: 1.2, dur: 0.6, a: 0.1, vol: 0.18 }); M.thud(1.1, 0.55);
      for (let i = 0; i < 6; i++) M.osc({ type: 'triangle', f0: 2000 + M.rnd() * 2500, dur: 0.08, vol: 0.05, at: 0.6 + i * 0.05 });
    },
    iron(M) {      // a wall slamming down: the clang of metal (bell-like partials) and a heavy thud
      M.thud(1.2, 0);
      [[220, 0.25], [567, 0.14], [1043, 0.1], [1607, 0.07], [2210, 0.05]].forEach(([f, v]) => M.osc({ type: 'sine', f0: f, f1: f * 0.995, dur: 1.0, vol: v, wet: 0.15 }));
      M.noise({ white: true, type: 'highpass', f0: 3000, q: 0.5, dur: 0.05, vol: 0.4 });
    },
    shadow(M) {    // a hiss that swells in (like a sound backwards), a low dark chord, the step snaps it off
      M.noise({ f0: 900, f1: 2200, q: 1.5, dur: 0.42, a: 0.38, vol: 0.32, wet: 0.3 });
      M.osc({ type: 'sawtooth', f0: 73, f1: 69, dur: 0.8, a: 0.15, vol: 0.12, filt: { f0: 400, q: 3 }, det: -15 });
      M.osc({ type: 'sawtooth', f0: 78, f1: 74, dur: 0.8, a: 0.15, vol: 0.1, filt: { f0: 400, q: 3 }, det: 15 });
      M.osc({ f0: 1250, f1: 1180, dur: 0.6, a: 0.25, vol: 0.03, vib: { r: 6, d: 20 }, wet: 0.5 });
      M.noise({ white: true, type: 'highpass', f0: 1800, q: 0.7, dur: 0.06, vol: 0.3, at: 0.42 }); M.thud(0.5, 0.42);
    },
    rainbow(M) {   // a quick sparkly run up the scale (seven notes, seven colours) and a chime
      M.notes([523, 587, 659, 784, 880, 1047, 1175], { type: 'triangle', dur: 0.22, vol: 0.08, step: 0.045, wet: 0.25 });
      M.osc({ f0: 2093, f1: 2093, dur: 0.6, vol: 0.06, at: 0.33, wet: 0.3 }); M.osc({ f0: 3136, f1: 3136, dur: 0.4, vol: 0.03, at: 0.35 });
      M.noise({ white: true, type: 'highpass', f0: 6000, q: 0.5, dur: 0.35, a: 0.1, vol: 0.06, at: 0.1 });
    },
    earth(M) {     // a rumble, digging crunches, then it bursts up
      M.noise({ type: 'lowpass', f0: 150, q: 0.8, dur: 0.8, a: 0.15, vol: 0.45 });
      for (let i = 0; i < 4; i++) M.noise({ f0: 500 + M.rnd() * 300, q: 1.5, dur: 0.06, vol: 0.3, at: 0.06 + i * 0.09 });
      M.thud(1.2, 0.45); M.noise({ f0: 900, f1: 300, q: 0.7, dur: 0.4, vol: 0.25, at: 0.45 });
    },
    holy(M) {      // a soft choir swell and a harp run up, ringing out
      [440, 554, 659].forEach((f, i) => M.osc({ f0: f, f1: f, dur: 1.1, a: 0.35, vol: 0.05, vib: { r: 5 + i, d: 4 }, wet: 0.4 }));
      M.notes([880, 988, 1109, 1319, 1480, 1760], { type: 'triangle', dur: 0.4, vol: 0.05, step: 0.05, at: 0.15, wet: 0.4 });
      M.noise({ f0: 1200, f1: 2400, q: 1.5, dur: 0.6, a: 0.25, vol: 0.08 });
    },
    sakura(M) {    // petals: soft pentatonic chimes drifting on a breeze
      M.noise({ f0: 1200, f1: 2600, q: 2, dur: 0.8, a: 0.25, vol: 0.12, wob: { r: 4, d: 300 } });
      [1175, 1319, 1568, 1760, 2093, 1760].forEach((f, i) => M.osc({ f0: f, f1: f, dur: 0.35, vol: 0.06, at: i * 0.07 + M.rnd() * 0.02, wet: 0.35 }));
      M.thud(0.5, 0.35);
    },
    leaf(M) {      // a gale with leaves rustling in it
      M.noise({ f0: 700, f1: 1600, q: 2.5, dur: 0.8, a: 0.2, vol: 0.3, wob: { r: 6, d: 250 } });
      for (let i = 0; i < 10; i++) M.noise({ white: true, type: 'highpass', f0: 4000, q: 0.8, dur: 0.025, vol: 0.1, at: 0.1 + M.rnd() * 0.6 });
      M.thud(0.6, 0.4);
    },
    crimson(M) {   // a blade: the draw, the slash, a ringing edge, the hit
      M.osc({ type: 'sawtooth', f0: 2600, f1: 3400, dur: 0.15, a: 0.1, vol: 0.03, filt: { type: 'highpass', f0: 2000 } });
      M.noise({ white: true, type: 'bandpass', f0: 6000, f1: 900, q: 2, dur: 0.18, vol: 0.4, at: 0.14 });
      M.osc({ f0: 2700, f1: 2650, dur: 0.6, vol: 0.05, at: 0.16, wet: 0.2 }); M.osc({ f0: 4050, f1: 4000, dur: 0.4, vol: 0.025, at: 0.16 });
      M.thud(0.9, 0.18);
    },
    curl(M) {      // the swish of a ball bending (pitch rises then falls, like it swings round)
      M.noise({ f0: 900, f1: 2600, fd: 0.25, q: 3, dur: 0.5, a: 0.08, vol: 0.3 });
      M.osc({ f0: 500, f1: 900, dur: 0.22, a: 0.03, vol: 0.05, lin: true }); M.osc({ f0: 900, f1: 600, dur: 0.25, vol: 0.04, at: 0.22, lin: true });
    },
    curlGold(M) {  // the curl with a golden ping on it
      MSFX.S.curl(M); M.osc({ type: 'triangle', f0: 1568, f1: 1568, dur: 0.35, vol: 0.06, at: 0.1, wet: 0.2 }); M.osc({ type: 'triangle', f0: 2093, f1: 2093, dur: 0.4, vol: 0.05, at: 0.18, wet: 0.2 });
    },
    banana(M) {    // a cartoon slide-whistle up and over
      M.osc({ f0: 500, f1: 1500, dur: 0.3, a: 0.03, vol: 0.07, vib: { r: 7, d: 15 }, lin: true });
      M.osc({ f0: 1500, f1: 700, dur: 0.35, vol: 0.06, at: 0.3, vib: { r: 7, d: 15 }, lin: true });
      M.noise({ f0: 1200, f1: 2200, q: 2, dur: 0.6, a: 0.15, vol: 0.12 });
    },
    power(M) {     // the all-round special: a charge up and a big hit
      M.osc({ type: 'square', f0: 200, f1: 1200, dur: 0.3, a: 0.02, vol: 0.05, filt: { f0: 1500, q: 2 } });
      M.noise({ f0: 800, f1: 3000, q: 1, dur: 0.35, a: 0.15, vol: 0.2 }); M.thud(1, 0.28);
    },
    // ---- keeper
    dive(M) { M.noise({ f0: 600, f1: 1400, q: 1.5, dur: 0.3, a: 0.06, vol: 0.18 }); },
    catch(M) { M.osc({ f0: 110, f1: 50, dur: 0.14, vol: 0.45 }); M.noise({ f0: 1300, q: 1.6, dur: 0.06, vol: 0.4 }); M.noise({ f0: 380, q: 1, dur: 0.1, vol: 0.25 }); },
    parry(M) { M.noise({ white: true, f0: 2200, q: 1.2, dur: 0.05, vol: 0.45 }); M.osc({ f0: 180, f1: 70, dur: 0.12, vol: 0.35 }); },
    punch(M) { M.osc({ f0: 160, f1: 55, dur: 0.15, vol: 0.5 }); M.noise({ f0: 900, q: 1, dur: 0.07, vol: 0.4 }); },
    smother(M) { M.thud(0.7, 0); M.noise({ type: 'lowpass', f0: 600, q: 0.7, dur: 0.25, vol: 0.25, at: 0.04 }); },
    glove(M) { M.noise({ f0: 700, f1: 1800, q: 1.5, dur: 0.25, a: 0.08, vol: 0.18 }); M.notes([784, 1175], { type: 'triangle', dur: 0.25, vol: 0.05, step: 0.07, at: 0.12 }); },
    bigSave(M) { SFX.ooh(); M.notes([392, 494, 587], { type: 'square', dur: 0.14, vol: 0.05, step: 0.07 }); },
    // ---- moments
    oneIn(M) {     // the world sinks into slow motion: a deep whoomp and the air goes thick
      M.osc({ f0: 200, f1: 40, dur: 0.7, a: 0.02, vol: 0.4 });
      M.noise({ type: 'lowpass', f0: 3000, f1: 200, q: 1, dur: 0.8, a: 0.03, vol: 0.3 });
      M.osc({ type: 'sawtooth', f0: 330, f1: 110, dur: 0.6, a: 0.02, vol: 0.04, filt: { f0: 900, q: 2 }, wet: 0.3 });
    },
    heart(M) { M.osc({ f0: 70, f1: 42, dur: 0.16, vol: 0.45 }); M.osc({ f0: 64, f1: 40, dur: 0.18, vol: 0.32, at: 0.2 }); },
    oneOut(M) { M.noise({ f0: 300, f1: 3500, q: 1, dur: 0.35, a: 0.2, vol: 0.25 }); M.osc({ f0: 60, f1: 220, dur: 0.3, a: 0.1, vol: 0.18 }); },
    slow(M) { M.osc({ type: 'triangle', f0: 600, f1: 180, dur: 0.45, vol: 0.06 }); M.noise({ type: 'lowpass', f0: 2000, f1: 300, q: 1, dur: 0.45, vol: 0.15 }); },
    corner(M) {    // the crowd lifts and a drum roll says "here it comes"
      SFX.roar(2.6, 0.45);
      for (let i = 0; i < 8; i++) M.osc({ f0: 120, f1: 70, dur: 0.07, vol: 0.12 + i * 0.03, at: i * 0.07 });
      M.thud(0.7, 0.6);
    },
    replayIn(M) {  // a tape rewinding (fast chirps falling) under a TV swoosh
      for (let i = 0; i < 6; i++) M.osc({ type: 'sawtooth', f0: 1800 - i * 180, f1: 600 - i * 60, dur: 0.06, vol: 0.035, at: i * 0.06, filt: { f0: 2500 } });
      M.noise({ f0: 4000, f1: 400, q: 0.8, dur: 0.45, a: 0.05, vol: 0.3 });
    },
    replayOut(M) { M.noise({ f0: 400, f1: 4000, q: 0.8, dur: 0.35, a: 0.15, vol: 0.25 }); M.osc({ type: 'triangle', f0: 523, f1: 784, dur: 0.15, vol: 0.05, at: 0.25 }); },
    callout(M) { M.noise({ white: true, type: 'highpass', f0: 3000, f1: 8000, q: 0.7, dur: 0.2, a: 0.05, vol: 0.12 }); M.osc({ type: 'square', f0: 880, f1: 1760, dur: 0.1, vol: 0.04 }); },
    empty(M) { M.osc({ type: 'square', f0: 180, f1: 160, dur: 0.12, vol: 0.06 }); M.osc({ type: 'square', f0: 140, f1: 120, dur: 0.18, vol: 0.06, at: 0.12 }); },
    hover(M) { M.osc({ type: 'triangle', f0: 1400, f1: 1400, dur: 0.035, vol: 0.04 }); },
    select(M) { M.osc({ type: 'square', f0: 660, f1: 660, dur: 0.05, vol: 0.05 }); M.osc({ type: 'square', f0: 990, f1: 990, dur: 0.08, vol: 0.05, at: 0.05 }); },
    start(M) { M.notes([523, 659, 784, 1047], { type: 'square', dur: 0.12, vol: 0.06, step: 0.07 }); M.thud(0.5, 0.28); },
    back(M) { M.osc({ type: 'square', f0: 784, f1: 784, dur: 0.05, vol: 0.05 }); M.osc({ type: 'square', f0: 523, f1: 523, dur: 0.08, vol: 0.05, at: 0.05 }); },
  },
  // loudness trims, measured (peak of each sound rendered offline) so every special lands near the game's own kick
  // and the small ones (menu, dive, replay) sit a step under it
  GAIN: { curl: 6, curlGold: 5, banana: 5, glove: 6, dive: 10, replayIn: 6, replayOut: 6, rainbow: 3, holy: 2.6, sakura: 1.5,
    bigSave: 5, slow: 3, empty: 4, select: 4, back: 4, hover: 4, oneOut: 2, callout: 1.8, leaf: 1.3 },
  // play a sound by name (an element or a moment); cool = seconds the same sound waits before it can play again
  play(k, cool = 0.12) {
    const f = this.S[k]; if (!f || !this.ok()) return false;
    const t = this.now(); if (this.last[k] != null && t - this.last[k] < cool) return false; this.last[k] = t;
    const v0 = MOVE_SOUND.vol; MOVE_SOUND.vol = v0 * (this.GAIN[k] || 1);
    try { f(this); } catch (e) { return false; } finally { MOVE_SOUND.vol = v0; }
    return true;
  },
  // a special's name -> its element sound (true if it played); also stops the generic special whoosh of this moment
  move(name) {
    const el = MOVE_SFX[msKey(name)]; if (!el) return false;
    this.lastEl = performance.now(); return this.play(el, 0.3);
  },
  fromSay(big, small) {
    if (!MOVE_SOUND.on) return;
    const kb = msKey(big); if (kb && MOVE_SFX[kb]) return this.move(kb);
    if (!big && small) {
      const m = /^([A-Z][A-Z' &-]+?)!? · /.exec(small); if (m && MOVE_SFX[m[1]]) return this.move(m[1]);
      if (MOVE_SFX[msKey(small)]) return this.move(small);
    }
    const s = (big || small || '').toUpperCase();
    for (const [re, k] of SAY_SFX) if (re.test(s)) { if (k) this.play(k, 0.4); return; }
  },
};

// ---- the generic special sound steps aside when the move's own element sound plays at the same moment. The move's
// code calls say() and SFX.special() in the same frame, in either order, so the check waits to the end of that frame.
(() => {
  const sp0 = SFX.special.bind(SFX);
  let q = false, lv = 1;
  SFX.special = function (l = 1) {
    if (!MOVE_SOUND.on) return sp0(l);
    lv = Math.max(lv, l); if (q) return; q = true;
    queueMicrotask(() => { q = false; const l2 = lv; lv = 1; if (performance.now() - MSFX.lastEl > 40) sp0(l2); });
  };
  const c0 = SFX.catch.bind(SFX);                                                    // the catch: a leather smack instead of the old thump
  SFX.catch = function () { if (!MSFX.play('catch', 0.08) && !MOVE_SOUND.on) c0(); };
})();

// ---- the hooks into the game (only where the game is loaded; game/sounds.html has the sounds alone)
if (typeof Match !== 'undefined') {
  const say0 = Match.prototype.say, gk0 = Match.prototype.gkCount, sp0 = Match.prototype.spSetup;
  const rp0 = Match.prototype.startReplay, rpE = Match.prototype.endReplay, rd0 = Match.prototype.render, mc0 = Match.prototype.moveCall;
  hc2Mix(Match, {
    // every line the game says: a special's name plays its element (loaded after PR #85's movecall.js, so this wrap
    // sees the name before the pop-up takes it)
    say(big, small, sec) { if (!this.replay) MSFX.fromSay(big, small); return say0.call(this, big, small, sec); },
    gkCount(team, key) {
      const r = gk0.call(this, team, key);
      if (!this.replay) { if (key === 'parried') MSFX.play('parry', 0.2); else if (key === 'punched') MSFX.play('punch', 0.2); else if (key === 'smothered') MSFX.play('smother', 0.3); }
      return r;
    },
    spSetup(kind, ...a) { const r = sp0.call(this, kind, ...a); if (kind === 'CORNER') MSFX.play('corner', 2); return r; },
    startReplay(...a) { const r = rp0.call(this, ...a); if (this.replay) MSFX.play('replayIn', 0.5); return r; },
    endReplay(...a) { const was = !!this.replay; const r = rpE.call(this, ...a); if (was) MSFX.play('replayOut', 0.5); return r; },
    // the 1 V 1 slow-mo (PR #73 sets this.v1 while it's on): in, a heartbeat while it lasts, out. The chip's slow-mo too.
    render(dt) {
      const r = rd0.call(this, dt);
      if (MOVE_SOUND.on && !this.replay) {
        const v1 = !!this.v1;
        if (v1 !== !!this.msV1) { this.msV1 = v1; MSFX.play(v1 ? 'oneIn' : 'oneOut', 0.6); this.msBeat = 0.5; }
        if (v1) { this.msBeat = (this.msBeat || 0) - (dt || 0); if (this.msBeat <= 0) { MSFX.play('heart', 0.3); this.msBeat = 0.85; } }
        const sl = (this.slowMo || 0) > 0.3 && !v1;
        if (sl && !this.msSlow) MSFX.play('slow', 1); this.msSlow = sl;
      }
      return r;
    },
  });
  // a move that pops its name up by itself (PR #85's moveCall(name, ...)) sounds the same
  if (mc0) hc2Mix(Match, { moveCall(name, ...a) { if (!MSFX.move(name) && !MOVE_SFX[msKey(name)]) MSFX.play('callout', 0.3); return mc0.call(this, name, ...a); } });
  if (typeof Player !== 'undefined') {                                             // the keeper's dive: a whoosh as he leaves the ground
    const st0 = Player.prototype.setState;
    Player.prototype.setState = function (s, t) {
      if (this.keeper && s === 'dive' && this.state !== 'dive' && this.m && !this.m.replay) MSFX.play('dive', 0.25);
      return st0.call(this, s, t);
    };
  }
}

// ---- the start menu (and PR #79's new one): a tick when you move over a button, a click to pick, a fanfare to start
(() => {
  if (typeof document === 'undefined') return;
  const START = /^(play|cupbtn|battle|watchbtn|trainbtn|resumebtn)$/;
  const btn = e => { const b = e.target && e.target.closest && e.target.closest('button'); return b && !b.dataset.act && !b.closest('#fp, #msfx-board, .lab-only') ? b : null; };
  let hov = null;
  document.addEventListener('pointerover', e => { const b = btn(e); if (b && b !== hov && b.closest('#start, [data-close], .pop, .modal, dialog')) MSFX.play('hover', 0.04); hov = b; });
  document.addEventListener('click', e => {
    const b = btn(e); if (!b || !b.closest('#start, .pop, .modal, dialog') && !b.hasAttribute('data-close')) return;
    MSFX.play(START.test(b.id) ? 'start' : b.hasAttribute('data-close') ? 'back' : 'select', 0.05);
  }, true);
})();

// ---- the SOUND BOARD: every sound on a button, PLAY ALL in a row, the volume. In the Test Lab (a button bottom-left)
// and on game/sounds.html. Luca: "develop a sound effect for all new moves and interactions" - this is where to hear them.
const MSFX_BOARD = {
  playing: null,
  build(host, opts = {}) {
    const el = document.createElement('div'); el.id = 'msfx-board'; if (opts.float) el.className = 'float';
    const flat = MSFX_LIST.flatMap(([, L]) => L);
    el.innerHTML = `<style>
      #msfx-board{font:10px 'Press Start 2P',monospace;color:#f4f0e4;background:#16121e;border:4px solid #0c0a0e;box-shadow:0 0 0 3px #ffde1e;padding:14px;max-width:760px;box-sizing:border-box}
      #msfx-board.float{position:fixed;left:12px;bottom:12px;z-index:99;max-height:80vh;overflow:auto;width:min(760px,calc(100vw - 24px))}
      #msfx-board h3{margin:0 0 10px;font-size:13px;color:#ffde1e} #msfx-board h4{margin:14px 0 6px;font-size:10px;color:#9ad}
      #msfx-board .row{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:6px}
      #msfx-board .g{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:6px}
      #msfx-board button{font:inherit;font-size:8px;line-height:1.5;text-align:left;padding:8px;border:3px solid #0c0a0e;background:#f4f0e4;color:#0c0a0e;cursor:pointer}
      #msfx-board button.on{background:#ffde1e} #msfx-board button.big{font-size:10px;background:#ffde1e;text-align:center}
      #msfx-board input{width:160px} #msfx-board .note{font-size:8px;color:#aaa;line-height:1.6}
    </style>
    <h3>&#128266; SOUND BOARD · ${flat.length} SOUNDS</h3>
    <div class="row"><button type="button" class="big" data-all>&#9654; PLAY EVERY SOUND</button><button type="button" class="big" data-stop>&#9632; STOP</button>
      <label>VOLUME <input type="range" min="0" max="100" step="5" data-vol></label><span data-vv></span>${opts.float ? '<button type="button" data-close-board>CLOSE</button>' : ''}</div>
    <div class="note" data-now>Tap a sound to hear it. In a match: M mutes, - / = change the volume (also PAUSE &gt; OPTIONS).</div>
    ${MSFX_LIST.map(([sec, L]) => `<h4>${sec}</h4><div class="g">${L.map(([k, n]) => `<button type="button" data-k="${k}">${n}</button>`).join('')}</div>`).join('')}`;
    host.appendChild(el);
    const $ = s => el.querySelector(s), vol = $('[data-vol]'), vv = $('[data-vv]'), now = $('[data-now]');
    const showVol = () => { vol.value = Math.round(SFX.vol * 100); vv.textContent = SFX.muted ? 'MUTED (M)' : vol.value + '%'; };
    const wake = () => { SFX.resume(); if (SFX.muted) SFX.toggle(); };
    const hit = k => { el.querySelectorAll('button.on').forEach(b => b.classList.remove('on')); const b = el.querySelector(`[data-k="${k}"]`); if (b) b.classList.add('on'); };
    el.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return; e.stopPropagation();
      if (b.dataset.k) { wake(); this.stop(); hit(b.dataset.k); setTimeout(() => { MSFX.last[b.dataset.k] = null; MSFX.play(b.dataset.k, 0); }, 30); now.textContent = b.textContent; }
      else if (b.hasAttribute('data-all')) { wake(); this.all(flat, (k, n, i) => { hit(k); now.textContent = `${i + 1} / ${flat.length} · ${n}`; }); }
      else if (b.hasAttribute('data-stop')) { this.stop(); now.textContent = 'Stopped.'; }
      else if (b.hasAttribute('data-close-board')) { this.stop(); el.remove(); }
    });
    vol.addEventListener('input', () => { SFX.init(); SFX.setVol(vol.value / 100); if (SFX.muted) SFX.toggle(); showVol(); });
    showVol(); return el;
  },
  all(flat, on) {
    this.stop(); let i = 0;
    const next = () => { if (i >= flat.length) { this.playing = null; return; } const [k, n] = flat[i]; on(k, n, i); MSFX.last[k] = null; MSFX.play(k, 0); i++; this.playing = setTimeout(next, k === 'corner' ? 2000 : 1500); };
    setTimeout(next, 60);
  },
  stop() { if (this.playing) clearTimeout(this.playing); this.playing = null; },
};
// the Test Lab gets a SOUND BOARD button, bottom-left (the board floats over the Lab; CLOSE puts it away)
if (typeof document !== 'undefined') {
  addEventListener('load', () => {
    if (!document.getElementById('fp') && !window.__lab) return;                 // (only the Test Lab: its FREE PLAY card is #fp)
    const b = document.createElement('button'); b.type = 'button'; b.id = 'msfx-open'; b.textContent = '\u{1F50A} SOUND BOARD';
    b.style.cssText = "position:fixed;left:12px;bottom:12px;z-index:98;font:9px 'Press Start 2P',monospace;padding:8px 10px;border:3px solid #0c0a0e;background:#ffde1e;color:#0c0a0e;cursor:pointer";
    b.onclick = e => { e.stopPropagation(); if (!document.getElementById('msfx-board')) MSFX_BOARD.build(document.body, { float: true }); };
    document.body.appendChild(b);
  });
}
