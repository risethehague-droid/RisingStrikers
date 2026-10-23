'use strict';
// HC2 Football · io.js: sound effects, keyboard / gamepad / touch input, asset loading (Boot + Load scenes, phone textures)
// (split out of game.js in v0.9.5 - load order and lanes: src/README.md)

// ------------------------------------------------------------------ input (keyboard + gamepad + touch)
// two key sets, both always live; the start screen's KEYS pick only decides which one the on-screen hints name
const KEYSETS = {
  arrows: { move: 'ARROWS', pass: 'Z', shoot: 'X', lob: 'C', through: 'V', special: 'B', ud: 'UP/DOWN' },
  wasd: { move: 'WASD', pass: 'J', shoot: 'K', lob: 'L', through: 'I', special: 'U', ud: 'W/S' },
};
const keyset = () => KEYSETS[window.HC2_KEYS] || KEYSETS.arrows;
// ---------- SOUND: tiny 16-bit-console style effects made in code (Web Audio, no files): kicks, whistle, net, post,
// catches and a crowd that bed + roars. Starts on the first key / click (browsers need that), M mutes (remembered).
const SFX = {
  ctx: null, out: null, crowd: null, muted: false,
  init() {
    if (this.ctx) return; const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    try { this.muted = localStorage.getItem('hc2-mute') === '1'; } catch (e) {}
    this.ctx = new AC(); this.out = this.ctx.createGain(); this.out.gain.value = this.muted ? 0 : 0.5; this.out.connect(this.ctx.destination);
    const n = this.ctx.sampleRate * 2, buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate), d = buf.getChannelData(0);
    let l = 0; for (let i = 0; i < n; i++) { l = (l + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = l * 3.5; }   // brown-ish noise
    this.noise = buf;
    const src = this.ctx.createBufferSource(); src.buffer = buf; src.loop = true;            // the crowd bed
    const lp = this.ctx.createBiquadFilter(); lp.type = 'bandpass'; lp.frequency.value = 520; lp.Q.value = 0.6;
    this.crowd = this.ctx.createGain(); this.crowd.gain.value = 0.05; src.connect(lp).connect(this.crowd).connect(this.out); src.start();
    this.crowdF = lp;
  },
  resume() { this.init(); if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },
  toggle() { this.init(); if (!this.ctx) return; this.muted = !this.muted; this.out.gain.value = this.muted ? 0 : 0.5; try { localStorage.setItem('hc2-mute', this.muted ? '1' : '0'); } catch (e) {} return this.muted; },
  ok() { return this.ctx && !this.muted && this.ctx.state === 'running'; },
  tone(type, f0, f1, dur, vol, delay = 0) {
    if (!this.ok()) return; const t = this.ctx.currentTime + delay, o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur); o.connect(g).connect(this.out); o.start(t); o.stop(t + dur + 0.02);
  },
  hiss(f, q, dur, vol, delay = 0) {
    if (!this.ok()) return; const t = this.ctx.currentTime + delay, s = this.ctx.createBufferSource(), bp = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
    s.buffer = this.noise; bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur); s.connect(bp).connect(g).connect(this.out); s.start(t, Math.random()); s.stop(t + dur + 0.02);
  },
  kick(p = 0.6) { this.tone('sine', 150 + p * 40, 45, 0.09 + p * 0.05, 0.5 + p * 0.4); this.hiss(1800, 1.2, 0.04, 0.25 + p * 0.3); },
  pass() { this.tone('sine', 120, 60, 0.07, 0.35); this.hiss(1500, 1.5, 0.03, 0.15); },
  head() { this.tone('square', 260, 140, 0.06, 0.12); this.hiss(900, 2, 0.05, 0.2); },
  catch() { this.tone('sine', 90, 50, 0.12, 0.5); this.hiss(400, 1, 0.08, 0.3); },
  post() { this.tone('triangle', 880, 860, 0.55, 0.35); this.tone('triangle', 1320, 1300, 0.4, 0.2); this.tone('sine', 140, 60, 0.12, 0.4); },
  net() { this.hiss(2600, 0.7, 0.35, 0.35); this.hiss(700, 0.8, 0.25, 0.25, 0.04); },
  whistle(n = 1, long = false) {
    for (let i = 0; i < n; i++) { const d = long && i === n - 1 ? 0.75 : 0.22, at = i * 0.34;
      if (!this.ok()) return; const t = this.ctx.currentTime + at, o = this.ctx.createOscillator(), lfo = this.ctx.createOscillator(), lg = this.ctx.createGain(), g = this.ctx.createGain();
      o.type = 'square'; o.frequency.value = 2900; lfo.frequency.value = 32; lg.gain.value = 140; lfo.connect(lg).connect(o.frequency);
      g.gain.setValueAtTime(0.0008, t); g.gain.exponentialRampToValueAtTime(0.06, t + 0.02); g.gain.setValueAtTime(0.06, t + d - 0.04); g.gain.exponentialRampToValueAtTime(0.0008, t + d);
      o.connect(g).connect(this.out); o.start(t); lfo.start(t); o.stop(t + d + 0.02); lfo.stop(t + d + 0.02); }
  },
  roar(sec = 3, big = 1) {                                                           // the crowd goes up and comes down again
    if (!this.ok()) return; const t = this.ctx.currentTime, g = this.crowd.gain, f = this.crowdF.frequency;
    g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(0.32 * big, t + 0.25); g.setTargetAtTime(0.05, t + sec * 0.5, sec * 0.35);
    f.cancelScheduledValues(t); f.setValueAtTime(f.value, t); f.linearRampToValueAtTime(900, t + 0.25); f.setTargetAtTime(520, t + sec * 0.5, sec * 0.4);
  },
  coin() { this.tone('triangle', 2350, 2300, 0.32, 0.12); this.tone('sine', 3520, 3500, 0.22, 0.05, 0.02); },   // v0.8.5 the coin lands
  flick() { this.tone('square', 900, 1500, 0.05, 0.05); },
  click() { this.tone('square', 660, 660, 0.035, 0.035); },
  boom(p = 1) { this.tone('sine', 95, 28, 0.32, 0.55 * p); this.hiss(320, 0.8, 0.22, 0.35 * p); },                  // v0.7 power-shot thump
  level(n = 1) { [523, 659, 784, 1047].slice(0, n + 1).forEach((f, i) => this.tone('square', f, f, 0.09, 0.08, i * 0.07)); },   // a bar fills
  rise() { this.tone('sawtooth', 160, 1300, 0.7, 0.09); [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone('square', f, f * 1.01, 0.16, 0.07, 0.35 + i * 0.06)); this.hiss(2400, 0.6, 0.6, 0.18, 0.2); this.roar(2.5, 0.8); },
  special(lv = 1) { this.tone('sawtooth', 80 + lv * 30, 1400, 0.35, 0.1); this.hiss(1200 + lv * 600, 0.5, 0.5, 0.3); this.boom(0.8 + lv * 0.1); },
  ooh() { if (!this.ok()) return; const t = this.ctx.currentTime, g = this.crowd.gain; g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(0.16, t + 0.2); g.setTargetAtTime(0.05, t + 0.6, 0.5); },
};
addEventListener('keydown', e => { SFX.resume(); if (e.code === 'KeyM' && !e.repeat) { const m = SFX.toggle(); const s = window.__hc2; if (s && s.say) s.say(m ? 'SOUND OFF' : 'SOUND ON', 'M TO SWITCH', 0.9); } });
addEventListener('pointerdown', () => SFX.resume());

const Input = {
  keys: new Set(), downs: new Set(), taps: new Set(), cur: {}, prev: {}, axis: { x: 0, y: 0 }, touch: { x: 0, y: 0, btn: {} }, padName: '',
  map: { pass: ['KeyZ', 'KeyJ'], shoot: ['KeyX', 'KeyK', 'Space'], lob: ['KeyC', 'KeyL'], through: ['KeyV', 'KeyI'],
         sprint: ['ShiftLeft', 'ShiftRight'], start: ['Enter', 'Escape', 'KeyP'], special: ['KeyB', 'KeyU'], meter: ['KeyT'] },
  padMap: { pass: [0], shoot: [1], through: [2], lob: [3], sprint: [5, 7], start: [9], special: [4] },
  init() {
    addEventListener('keydown', e => { this.keys.add(e.code); this.downs.add(e.code); if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault(); });
    addEventListener('keyup', e => this.keys.delete(e.code));
    addEventListener('blur', () => this.keys.clear());
  },
  poll() {
    this.prev = this.cur; this.prevAxis = this.axis; const c = {};
    let ax = 0, ay = 0;
    this.taps = this.downs; this.downs = new Set();                              // a quick tap between two frames still counts
    const k = { has: code => this.keys.has(code) || this.taps.has(code) };
    if (k.has('ArrowLeft') || k.has('KeyA')) ax -= 1; if (k.has('ArrowRight') || k.has('KeyD')) ax += 1;
    if (k.has('ArrowUp') || k.has('KeyW')) ay -= 1; if (k.has('ArrowDown') || k.has('KeyS')) ay += 1;
    for (const a in this.map) c[a] = this.map[a].some(code => k.has(code));
    let pads = [];
    try { pads = navigator.getGamepads ? [...navigator.getGamepads()].filter(Boolean) : []; } catch (e) { pads = []; }
    const p = pads[0];
    if (p) {
      this.padName = p.id;
      const b = i => p.buttons[i] && p.buttons[i].pressed;
      for (const a in this.padMap) c[a] = c[a] || this.padMap[a].some(b);
      if (b(14)) ax -= 1; if (b(15)) ax += 1; if (b(12)) ay -= 1; if (b(13)) ay += 1;
      const sx = p.axes[0] || 0, sy = p.axes[1] || 0;
      if (len(sx, sy) > 0.3) { ax += sx; ay += sy; }
    }
    const t = this.touch;
    if (len(t.x, t.y) > 0.25) { ax += t.x; ay += t.y; }
    for (const a in t.btn) c[a] = c[a] || t.btn[a];
    const l = len(ax, ay);
    this.axis = l > 0.2 ? { x: ax / Math.max(1, l), y: ay / Math.max(1, l) } : { x: 0, y: 0 };
    this.cur = c;
  },
  held(a) { return !!this.cur[a]; },
  nav() { const a = this.axis, p = this.prevAxis || { x: 0, y: 0 }, e = (v, w) => (Math.abs(v) > 0.5 && Math.abs(w) <= 0.5 ? Math.sign(v) : 0); return { x: e(a.x, p.x), y: e(a.y, p.y) }; },   // v0.8.5 menus
  pressed(a) { return !!this.cur[a] && !this.prev[a]; },
  released(a) { return !this.cur[a] && !!this.prev[a]; },
};

// ------------------------------------------------------------------ boot: manifest, then assets
// ------------------------------------------------------------------ v0.7.5 PHONE (LITE) TEXTURES
// iOS reloads a page that takes too much graphics memory ("browser doesn't work"). On touch screens every texture comes from
// assets-lo/ at half size (a quarter of the memory); Phaser is told the full size, so frames, positions and scales don't change.
// #full in the address forces the big textures, #lite forces the small ones on a computer.
const CRUMB = s => (window.HC2_CRUMB || (() => {}))(s);   // v0.7.6: where the game got to (shown after a crash on the next start)
const LITE = !window.HC2_SAFE && (/(^|#|&)lite\b/.test(location.hash) || (!/(^|#|&)full\b/.test(location.hash) && (matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window)));
let LO_DIMS = null; const LO_KEY = {};
const SRC = (rel, key) => { const d = LITE && LO_DIMS && LO_DIMS[rel]; if (d) { LO_KEY[key] = d; return 'assets-lo/' + rel; } return 'assets/' + rel; };
{ const TM = Phaser.Textures.TextureManager.prototype, mk = TM.create;
  TM.create = function (key, source, width, height) { const d = LO_KEY[key]; if (d && !width) { width = d[0]; height = d[1]; } return mk.call(this, key, source, width, height); }; }

class Boot extends Phaser.Scene {
  constructor() { super('boot'); }
  preload() { CRUMB('boot'); this.load.json('manifest', 'assets/manifest.json'); if (LITE) this.load.json('lodims', 'assets-lo/dims.json'); }
  create() { MAN = this.cache.json.get('manifest'); if (LITE) LO_DIMS = this.cache.json.get('lodims') || null; CX = Math.floor(MAN.worldW / 2); FAR_H = MAN.farH; this.scene.start('load'); }
}

class Load extends Phaser.Scene {
  constructor() { super('load'); }
  preload() {
    const w = VIEW_W, h = VIEW_H;
    this.add.rectangle(w / 2, h / 2, w, h, 0x0c0a0e);
    this.add.text(w / 2, h / 2 - 40, 'HELP OUT HAGUE CUP II', { fontFamily: '"Press Start 2P"', fontSize: '20px', color: '#ffde1e' }).setOrigin(0.5);
    const bar = this.add.rectangle(w / 2 - 200, h / 2 + 10, 0, 14, 0xff2878).setOrigin(0, 0.5);
    this.add.rectangle(w / 2, h / 2 + 10, 404, 18).setStrokeStyle(2, 0xf4f0e4);
    const txt = this.add.text(w / 2, h / 2 + 44, 'LOADING THE STADIUM', { fontFamily: '"Press Start 2P"', fontSize: '10px', color: '#f4f0e4' }).setOrigin(0.5);
    CRUMB('loading'); this.load.on('progress', v => { bar.width = 400 * v; const q = Math.floor(v * 4); if (q !== this.q) { this.q = q; CRUMB(`loading ${q * 25}%`); } });
    for (const kit of ['IS-home', 'IRO-home', 'IS-keeper', 'IRO-keeper', 'REF']) if (MAN.kits[kit]) this.load.atlas(kit, SRC(`sprites/${kit}.webp`, kit), `assets/sprites/${kit}.json`);
    this.load.atlas('props', SRC('sprites/props.webp', 'props'), 'assets/sprites/props.json');
    if (MAN.rami) this.load.atlas('rami', SRC('hud/rami.webp', 'rami'), 'assets/hud/rami.json');   // commentator (Aseprite)
    if (MAN.fx) this.load.atlas('fx', SRC('hud/fx.webp', 'fx'), 'assets/hud/fx.json');
    if (MAN.coin) this.load.atlas('coin', SRC('hud/coin.png', 'coin'), 'assets/hud/coin.json');      // v0.8.5 PixelLab coin (RISE / arrow) for the toss          // v0.7 PixelLab effects: flames, impact, RISE UP arrow
    if (MAN.meterFrame) this.load.image('meter-wild', SRC('hud/' + MAN.meterFrame, 'meter-wild'));      // v0.7 PixelLab UI frame for the WILD meter
    for (const f of MAN.hud) this.load.image(f.replace('.webp', ''), SRC(`hud/${f}`, f.replace('.webp', '')));
    // world tiles around the kick-off view (the rest stream in as the camera moves)
    const cx = wx(52.5, 34), cy = wy(34);
    const r = new Phaser.Geom.Rectangle(cx - VIEW_W, cy - VIEW_H, VIEW_W * 2, VIEW_H * 2);
    for (const t of MAN.tiles) if (Phaser.Geom.Intersects.RectangleToRectangle(r, new Phaser.Geom.Rectangle(t.x, t.y, t.w, t.h)))
      for (const k of new Set(t.frames)) this.load.image(k, SRC(`world/${k}.webp`, k));
    for (const o of MAN.over) this.load.image(o.key, SRC(`world/${o.key}.webp`, o.key));
    txt.setText('LOADING THE STADIUM');
  }
  create() { CRUMB('loaded'); this.scene.start('match'); }
}

// ------------------------------------------------------------------ touch controls (phones / tablets)
function setupTouch() {
  const ui = document.getElementById('touch'); if (!ui) return;
  const coarse = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  if (!coarse) return;
  ui.hidden = false; window.HC2_TOUCH = true;
  const stick = document.getElementById('stick'), knob = document.getElementById('knob');
  let sid = null, ox = 0, oy = 0;
  const R = 56;
  const zone = document.getElementById('stickzone');
  zone.addEventListener('pointerdown', e => {
    sid = e.pointerId; zone.setPointerCapture(sid); ox = e.clientX; oy = e.clientY;
    stick.style.left = (ox - 70) + 'px'; stick.style.top = (oy - 70) + 'px'; stick.classList.add('on');
  });
  zone.addEventListener('pointermove', e => {
    if (e.pointerId !== sid) return;
    let dx = e.clientX - ox, dy = e.clientY - oy; const l = Math.hypot(dx, dy);
    if (l > R) { dx = dx / l * R; dy = dy / l * R; }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    Input.touch.x = dx / R; Input.touch.y = dy / R;
  });
  const end = e => { if (e.pointerId !== sid) return; sid = null; Input.touch.x = Input.touch.y = 0; knob.style.transform = ''; stick.classList.remove('on'); };
  zone.addEventListener('pointerup', end); zone.addEventListener('pointercancel', end);
  document.querySelectorAll('#touch [data-act]').forEach(btn => {
    const a = btn.dataset.act;
    btn.addEventListener('pointerdown', e => { e.preventDefault(); btn.setPointerCapture(e.pointerId); Input.touch.btn[a] = true; btn.classList.add('down'); });
    const up = () => { Input.touch.btn[a] = false; btn.classList.remove('down'); };
    btn.addEventListener('pointerup', up); btn.addEventListener('pointercancel', up);
  });
}
