'use strict';
// HC2 Football · penalties.js: the penalty scene and shoot-outs
// (split out of game.js in v0.9.5 - load order and lanes: src/README.md)

// ------------------------------------------------------------------ PENALTY: the camera goes behind the taker
// A cut-in scene over the match. PixelLab drew the goal from behind the spot (assets/pen), the keeper facing you on his
// line and the taker from behind. A simple pinhole camera is fitted to the drawn goal and spot, so the ball shrinks as it
// flies and the keeper's reach is in metres: a save is the ball actually meeting his body or gloves.
//   x = metres across the goal (+ = right on screen), y = metres up, z = metres from the camera
// Three styles (start screen):
//   BASE      both sides secretly pick a zone (left / middle / right, low / high), then it plays out
//   WILD      the taker charges a power shot (hold, let go); the keeper can STRETCH at the last moment (press as the
//             ball reaches him); slow motion, camera punch, flashes, bigger reactions
//   TECHNICAL the taker aims anywhere + stops a sweet-spot meter (or chips it); the keeper picks side + height and can
//             read the computer's run-up
// Who plays each side: 'human' (either key set), 'p1' (WASD + K), 'p2' (arrows + .), 'cpu'. Two humans = a 1v1: both
// lock in during the countdown and nothing of either pick is shown, then the shot plays out with reactions.
const PEN_STYLES = { base: 'BASE', wild: 'WILD', tech: 'TECHNICAL' };
const PEN_KEYS = {
  p1: { l: ['KeyA'], r: ['KeyD'], u: ['KeyW'], d: ['KeyS'], ok: ['KeyK', 'Space'], alt: ['KeyL'], hint: 'WASD + K' },
  p2: { l: ['ArrowLeft'], r: ['ArrowRight'], u: ['ArrowUp'], d: ['ArrowDown'], ok: ['Period', 'ShiftRight', 'Numpad0'], alt: ['Comma', 'Numpad1'], hint: 'ARROWS + .' },
};

class PenCtl {                                       // one side's controls, read every frame
  constructor(kind) { this.kind = kind; this.cur = {}; this.prev = {}; }
  get cpu() { return this.kind === 'cpu'; }
  poll() {
    this.prev = this.cur; const c = { x: 0, y: 0, ok: false, alt: false };
    if (this.kind === 'human') { c.x = Input.axis.x; c.y = Input.axis.y; c.ok = Input.held('shoot'); c.alt = Input.held('lob'); }
    else if (PEN_KEYS[this.kind]) {
      const K = PEN_KEYS[this.kind], h = a => a.some(k => Input.keys.has(k) || Input.taps.has(k));
      c.x = (h(K.r) ? 1 : 0) - (h(K.l) ? 1 : 0); c.y = (h(K.d) ? 1 : 0) - (h(K.u) ? 1 : 0); c.ok = h(K.ok); c.alt = h(K.alt);
    }
    this.cur = c;
  }
  pressed(b) { return !!this.cur[b] && !this.prev[b]; }
  released(b) { return !this.cur[b] && !!this.prev[b]; }
  zone() { return { side: this.cur.x < -0.3 ? -1 : this.cur.x > 0.3 ? 1 : 0, high: this.cur.y < -0.3 }; }
}
const zoneAim = z => ({ x: z.side * 2.75, y: z.high ? 1.9 : 0.4 });

class PenaltyScene extends Phaser.Scene {
  constructor() { super('penalty'); }
  init(d) { this.d = d; }
  preload() { const P = MAN.penalty; if (P && !this.textures.exists('pen-bg')) this.load.image('pen-bg', P.bg); }
  create() {
    this.cameras.main.setZoom(VIEW_W / PEN_W).centerOn(PEN_W / 2, PEN_H / 2);   // v0.8.5: same picture on the bigger screen
    const d = this.d, P = MAN.penalty, S = P.scale;
    this.style = d.force ? 'base' : (d.style || window.HC2_PEN || 'base'); if (!PEN_STYLES[this.style]) this.style = 'base';
    const ctl = d.ctl || { take: d.human === 'take' ? 'human' : 'cpu', keep: d.human === 'keep' ? 'human' : 'cpu' };
    this.ct = { take: new PenCtl(ctl.take), keep: new PenCtl(ctl.keep) };
    this.secret = !this.ct.take.cpu && !this.ct.keep.cpu;                         // a 1v1: picks stay hidden
    this.add.rectangle(0, 0, PEN_W, PEN_H, 0x0c0a0e).setOrigin(0);
    this.add.image(-P.crop[0] * S, -P.crop[1] * S, 'pen-bg').setOrigin(0).setScale(S);
    const X = v => (v - P.crop[0]) * S, Y = v => (v - P.crop[1]) * S;
    const gl = X(P.goal.l), gr = X(P.goal.r), bar = Y(P.goal.bar), line = Y(P.goal.line), spotY = Y(P.spot[1]);
    const Dc = P.camBack, zg = Dc + 11, fx = (gr - gl) / 2 * zg / 3.66, fy = (line - bar) * zg / 2.44, cx = (gl + gr) / 2;
    const Hc = (spotY - line) / (fy * (1 / Dc - 1 / zg)), yh = line - fy * Hc / zg;
    this.C = { Dc, zg, fx, fy, cx, Hc, yh, spotX: X(P.spot[0]) };
    this.proj = (x, y, z) => ({ x: cx + fx * x / z, y: yh + fy * (Hc - y) / z, s: fy / z });
    // sprites: the keeper (team colours) on his line facing you, the taker big at the bottom seen from behind
    const gk = d.gk, gK = MAN.kits[gk.kit], tk = d.taker, tK = MAN.kits[tk.kit];
    const anim = (kit, K, name, fps, rep) => { const key = `${kit}:pen:${name}`; const fr = K.anims[name]; if (!fr) return null;
      if (!this.anims.exists(key)) this.anims.create({ key, frames: fr.map(f => ({ key: kit, frame: f })), frameRate: fps, repeat: rep ? -1 : 0 }); return key; };
    this.A = {
      ready: anim(gk.kit, gK, 'pready-S', 8, true) || anim(gk.kit, gK, 'idle-S', 5, true),
      diveL: anim(gk.kit, gK, 'pdive-SL', 12, false), diveR: anim(gk.kit, gK, 'pdive-SR', 12, false),
      catchS: anim(gk.kit, gK, 'catch-S', 14, false), kIdle: anim(gk.kit, gK, 'idle-S', 5, true),
      kCele: anim(gk.kit, gK, 'pkcele-S', 10, false), kDefeat: anim(gk.kit, gK, 'pkdefeat-S', 9, false),   // batch 6 (PixelLab)
      distract: anim(gk.kit, gK, 'pdistract-S', 10, true), highL: anim(gk.kit, gK, 'pdiveH-SL', 12, false), highR: anim(gk.kit, gK, 'pdiveH-SR', 12, false),   // batch 7
      tWait: anim(tk.kit, tK, 'pwait-N', 7, true), place: anim(tk.kit, tK, 'pplace-N', 9, false),   // batch 8: puts the ball on the spot
      run: anim(tk.kit, tK, 'penalty-N', 11, false) || anim(tk.kit, tK, 'kick-N', 11, false),
      power: anim(tk.kit, tK, 'ppower-N', 12, false), chip: anim(tk.kit, tK, 'pchip-N', 9, false),
      tIdle: anim(tk.kit, tK, 'idle-N', 5, true),
      cele: anim(tk.kit, tK, 'pcele-N', 10, false) || anim(tk.kit, tK, 'celebrate-S', 10, false), miss: anim(tk.kit, tK, 'pmiss-N', 9, false),
    };
    const kb = this.proj(0, 0, zg - 0.3);
    this.gkSpr = this.add.sprite(Math.round(kb.x), Math.round(kb.y), gk.kit).setOrigin(0.5, gK.feetY / gK.frameH).setScale(P.keeperScale).setDepth(10);
    this.gkSpr.play(this.A.ready);
    const st = P.takerStart || [-70, 66];
    this.tk0 = { x: this.C.spotX + st[0], y: spotY + st[1] }; this.tk1 = { x: this.C.spotX + P.taker[0], y: spotY + P.taker[1] };
    this.tkSpr = this.add.sprite(Math.round(this.tk0.x), Math.round(this.tk0.y), tk.kit).setOrigin(0.5, tK.feetY / tK.frameH).setScale(P.takerScale).setDepth(30);
    this.tkSpr.play(this.A.tWait || this.A.tIdle);
    this.ballSpr = this.add.image(0, 0, 'props', 'ball-x0').setDepth(20);
    this.rami = RamiBox.make(this);                                              // Rami calls the penalty too
    if (this.rami) { const z = VIEW_W / PEN_W, cx = VIEW_W / 2, cy = VIEW_H / 2; this.rami.c.setScale(1 / z).setPosition(cx - cx / z, cy - cy / z); }   // v0.8.5: his box laid out for the full screen, not zoomed
    if (this.rami && !d.force) this.time.delayedCall(400, () => { if (this.state === 'pick') this.rami.say('banter', { text: Math.random() < 0.5 ? 'HE STEPS UP...\nTHE KEEPER WAITS.' : 'THE WHOLE OF KLEINE\nLOO HOLDS ITS BREATH', expr: 'talk' }, 1); });
    this.shadow = this.add.image(0, 0, 'props', 'ball-shadow').setDepth(5);
    this.g = this.add.graphics().setDepth(40);
    const F = '"Press Start 2P"', T = (x, y, sz, col, o = {}) => this.add.text(x, y, '', { fontFamily: F, fontSize: sz, color: col, stroke: '#0c0a0e', strokeThickness: 6, align: 'center', ...o }).setDepth(50);
    this.title = T(PEN_W / 2, 26, '22px', '#ffde1e').setOrigin(0.5, 0);
    this.hint = this.add.text(PEN_W / 2, PEN_H - 22, '', { fontFamily: F, fontSize: '9px', color: '#0c0a0e', backgroundColor: '#f4f0e4', padding: { x: 8, y: 6 }, align: 'center', lineSpacing: 6 }).setOrigin(0.5, 1).setDepth(50);
    this.big = T(PEN_W / 2, PEN_H * 0.36, '40px', '#ffde1e', { strokeThickness: 9 }).setOrigin(0.5);
    this.sub = T(PEN_W / 2, PEN_H * 0.36 + 44, '12px', '#f4f0e4').setOrigin(0.5);
    this.cnt = T(PEN_W / 2, PEN_H * 0.52, '34px', '#f4f0e4', { strokeThickness: 8 }).setOrigin(0.5);
    this.tagT = T(110, PEN_H - 92, '11px', '#f4f0e4').setOrigin(0.5);
    this.tagK = T(PEN_W - 110, PEN_H - 92, '11px', '#f4f0e4').setOrigin(0.5);
    // state
    this.ball = { x: 0, y: 0.11, z: Dc, vx: 0, vy: 0, vz: 0 };
    this.t = 0; this.state = 'pick'; this.result = null; this.kx = 0; this.ky = 0; this.dive = 0; this.lift = 0; this.diveT = -1; this.closed = false;
    this.pick = { take: null, keep: null }; this.aim = { x: 0, y: 1.0 }; this.charge = -1; this.meter = -1; this.stretch = false; this.stretchTry = false;
    this.pickT = (this.style === 'tech' ? 8 : this.style === 'wild' ? 6 : 5) + (this.secret ? 0 : 5);
    this.title.setText(`PENALTY · ${PEN_STYLES[this.style]}`);
    if (d.force) {                                                               // lab tests: a set shot against a set dive
      const f = d.force; this.pick.take = { x: f.x, y: f.y, power: f.power, err: 0.25 + f.power * 0.3 };
      this.pick.keep = { side: f.dive || 0, high: false }; this.startRun(); return;
    }
    if (this.A.place) {                                                           // he puts the ball down, then walks back to his mark
      this.placing = true; this.pickT += 1.6; this.tkSpr.setPosition(Math.round(this.tk1.x), Math.round(this.tk1.y)).play(this.A.place);
      this.tkSpr.once('animationcomplete', () => {
        this.placing = false; if (this.state !== 'pick') return;
        this.tkSpr.play(this.A.tWait || this.A.tIdle);
        this.tweens.add({ targets: this.tkSpr, x: Math.round(this.tk0.x), y: Math.round(this.tk0.y), duration: 650, ease: 'Sine.easeOut' });
      });
    }
    if (this.ct.keep.cpu && this.A.distract && (this.style === 'wild' || Math.random() < 0.4)) { this.distracting = true; this.gkSpr.play(this.A.distract); }
    if (this.ct.take.cpu) this.pick.take = this.cpuTake();
    if (this.ct.keep.cpu) this.pick.keep = this.cpuKeep();
    this.tell = this.ct.take.cpu && this.style === 'tech' ? (Math.random() < 0.65 ? Math.sign(this.pick.take.x) : (Math.random() < 0.5 ? -1 : 1)) : 0;
    if (this.tell) this.tk0.x += this.tell > 0 ? -24 : 22;                      // the run-up angle gives it away (mostly)
    this.tkSpr.setPosition(Math.round(this.tk0.x), Math.round(this.tk0.y));
    this.hintText();
  }
  // ---- the computer's choices
  cpuTake() {
    const r = Math.random(), side = Math.random() < 0.5 ? -1 : 1, s = this.style;
    if (s === 'tech' && Math.random() < 0.07) return { x: rnd(-0.4, 0.4), y: 1.5, power: 0.3, chip: true, err: 0.15 };
    const aim = r < 0.16 ? { x: rnd(-0.7, 0.7), y: rnd(0.3, 1.5) } : { x: side * rnd(2.2, 3.25), y: Math.random() < 0.62 ? rnd(0.15, 0.7) : rnd(1.3, 2.2) };
    const power = s === 'wild' ? rnd(0.55, 0.99) : rnd(0.5, 0.85);
    return { ...aim, power, err: s === 'tech' ? rnd(0.12, 0.4) : 0.25 + power * 0.3 };
  }
  cpuKeep() { const r = Math.random(); return { side: r < 0.42 ? -1 : r < 0.84 ? 1 : 0, high: Math.random() < 0.3 }; }
  hintText() {
    const tk = this.ct.take, kp = this.ct.keep, s = this.style, L = [];
    const who = c => c.kind === 'p1' ? 'P1' : c.kind === 'p2' ? 'P2' : 'YOU';
    const mv = c => c.kind === 'p1' ? 'WASD' : c.kind === 'p2' ? 'ARROWS' : keyset().move, ok = c => c.kind === 'p1' ? 'K' : c.kind === 'p2' ? '.' : keyset().shoot;
    const alt = c => c.kind === 'p1' ? 'L' : c.kind === 'p2' ? ',' : keyset().lob;
    if (!tk.cpu && !this.pick.take) L.push(`${who(tk)} SHOOT (${mv(tk)} + ${ok(tk)}): ` + (s === 'base' ? `HOLD A DIRECTION (UP = HIGH), PRESS ${ok(tk)}`
      : s === 'wild' ? `HOLD A DIRECTION, HOLD ${ok(tk)} FOR POWER, LET GO` : `${this.secret ? 'HOLD A DIRECTION' : 'AIM'}, ${ok(tk)}, STOP THE METER IN THE GREEN · ${alt(tk)} = CHIP`));
    if (!kp.cpu && !this.pick.keep) L.push(`${who(kp)} KEEP (${mv(kp)} + ${ok(kp)}): HOLD WHERE YOU DIVE (UP = HIGH), PRESS ${ok(kp)}` + (s === 'wild' ? ' · AGAIN = STRETCH' : '') + (s !== 'base' && this.A.distract ? ` · HOLD ${alt(kp)} = MIND GAMES` : ''));
    this.hint.setText(L.join('\n')).setVisible(L.length > 0);
  }
  update(time, deltaMs) {
    let dt = Math.min(deltaMs / 1000, 1 / 30); Input.poll(); this.ct.take.poll(); this.ct.keep.poll();
    if (this.rami) this.rami.tick(dt, this.hint.visible ? 70 : 0);
    const d = this.d, P = MAN.penalty, b = this.ball, C = this.C;
    // WILD: the moment of truth in slow motion
    this.slow = this.style === 'wild' && this.state === 'flight' && !this.result && b.z > C.zg - 6 ? 0.3 : 1;
    dt *= this.slow; this.t += dt;
    if (this.state === 'pick') this.pickTick(dt);
    else if (this.state === 'runup') {
      const sT = this.strikeT, commitT = sT - 0.15, u = clamp(this.t / sT, 0, 1);
      this.tkSpr.setPosition(Math.round(this.tk0.x + (this.tk1.x - this.tk0.x) * u), Math.round(this.tk0.y + (this.tk1.y - this.tk0.y) * u));
      if (this.diveT < 0 && this.t >= commitT) this.commitKeeper();
      if (this.t >= sT) this.strike();
    } else if (this.state === 'flight') { this.stretchTick(); this.fly(dt); }
    else if (this.state === 'done') {
      const wait = this.style === 'wild' ? 3.4 : 3.0;
      if (this.t > (d.force ? 1.8 : wait) && !this.closed) { this.closed = true; d.done && d.done(this.result); }
    }
    this.keeperTick(dt);
    this.draw();
  }
  // ---- both sides choose; humans lock in, nothing of a pick is shown in a 1v1
  pickTick(dt) {
    const s = this.style, tk = this.ct.take, kp = this.ct.keep, left = this.pickT - this.t;
    if (!tk.cpu && !this.pick.take) {
      if (s === 'tech') {
        if (this.meter < 0) {
          if (this.secret) this.aim = zoneAim(tk.zone());                           // 1v1: aim by direction (a cursor would give it away)
          else { this.aim.x = clamp(this.aim.x + tk.cur.x * dt * 3.4, -4.0, 4.0); this.aim.y = clamp(this.aim.y - tk.cur.y * dt * 1.8, 0.1, 2.9); }
          if (tk.pressed('alt')) this.pick.take = { x: this.aim.x * 0.35, y: clamp(this.aim.y, 1.1, 1.8), power: 0.3, chip: true, err: 0.12 };
          else if (tk.pressed('ok')) this.meter = 0;
        } else {
          this.meter += dt;
          if (tk.pressed('ok') || this.meter > 3) { const v = this.meterVal(); this.pick.take = { ...this.aim, power: 0.45 + v * 0.5, err: 0.08 + Math.abs(v - 0.75) * 1.4 }; }
        }
      } else if (s === 'wild') {
        if (this.charge < 0) { if (tk.pressed('ok')) { this.charge = 0; this.lockZone = tk.zone(); } }
        else { this.charge = Math.min(1, this.charge + dt / 0.85); if (tk.released('ok') || this.charge >= 1) this.pick.take = { ...zoneAim(this.lockZone), power: this.charge, err: 0.2 + this.charge * 0.3 }; }
      } else if (tk.pressed('ok')) this.pick.take = { ...zoneAim(tk.zone()), power: 0.7, err: 0.3 };
      if (this.pick.take) this.hintText();
    }
    if (!kp.cpu && !this.pick.keep && kp.pressed('ok')) { this.pick.keep = kp.zone(); this.hintText(); }
    if (!kp.cpu && this.A.distract && kp.cur.alt !== !!this.distracting) {        // MIND GAMES: hold the chip key to wave your arms
      this.distracting = !!kp.cur.alt; this.gkSpr.play(this.distracting ? this.A.distract : this.A.ready);
    }
    if (this.pick.take && !this.shaken && this.distracting && s !== 'base') { this.shaken = true; this.pick.take.err += 0.12; this.sub.setText('MIND GAMES!'); this.time.delayedCall(900, () => { if (!this.result) this.sub.setText(''); }); }
    if (left <= 0) {                                                             // time's up: what they hold is what they get
      const idle = z => !z.side && !z.high, rz = () => ({ side: [-1, 1, -1, 1, 0][Math.floor(Math.random() * 5)], high: Math.random() < 0.35 });   // v0.8.3
      if (!this.pick.take) this.pick.take = s === 'tech' ? { ...this.aim, power: 0.6, err: 0.45 } : { ...zoneAim(this.lockZone || (idle(tk.zone()) ? rz() : tk.zone())), power: Math.max(0.5, this.charge), err: 0.35 };
      if (!this.pick.keep) this.pick.keep = kp.cpu || idle(kp.zone()) ? this.cpuKeep() : kp.zone();   // (nobody touched it: a random pick, not centre forever)
    }
    this.cnt.setText(left <= 3.2 && left > 0 && !(this.pick.take && this.pick.keep) ? String(Math.ceil(left)) : '');
    const tag = (c, done) => c.cpu ? '' : `${c.kind === 'p1' ? 'P1' : c.kind === 'p2' ? 'P2' : 'YOU'} ${done ? 'READY ✓' : '...'}`;
    this.tagT.setText(tag(tk, !!this.pick.take)); this.tagK.setText(tag(kp, !!this.pick.keep));
    if (this.pick.take && this.pick.keep) this.startRun();
  }
  meterVal() { const u = (this.meter / 0.9) % 2; return u < 1 ? u : 2 - u; }        // 0 -> 1 -> 0, green near 0.75
  startRun() {
    const t = this.pick.take, s = this.style;
    this.placing = false; this.tweens.killTweensOf(this.tkSpr); SFX.whistle(1);
    this.state = 'runup'; this.t = 0; this.cnt.setText(''); this.hint.setVisible(false); this.title.setText('');
    this.strikeT = MAN.penalty.strikeT * (t.chip ? 1.5 : s === 'wild' && t.power > 0.85 ? 1.15 : 1);
    const a = t.chip ? this.A.chip : s === 'wild' && t.power > 0.8 ? this.A.power : null;
    this.tkSpr.play(a || this.A.run); if (t.chip && !this.A.chip) this.tkSpr.anims.timeScale = 0.7;
    this.tagT.setText(''); this.tagK.setText('');
    if (this.distracting) { this.distracting = false; this.gkSpr.play(this.A.ready); }
    if (s === 'wild' && t.power > 0.88) { this.sub.setText('SUPER SHOT!'); this.time.delayedCall(700, () => { if (!this.result) this.sub.setText(''); }); }
  }
  // the keeper goes just before the strike: the side and height he picked
  commitKeeper() {
    const k = this.pick.keep; this.dive = k.side || 0; this.diveT = 0;
    this.lift = this.dive ? (k.high ? 1.15 : 0.15) : (k.high ? 0.55 : 0);
    const hi = k.high && this.A.highL && this.A.highR;                             // batch 7: the high tip-over dive
    if (this.dive < 0) this.gkSpr.play(hi ? this.A.highL : this.A.diveL || this.A.ready); else if (this.dive > 0) this.gkSpr.play(hi ? this.A.highR : this.A.diveR || this.A.ready);
  }
  keeperTick(dt) {
    if (this.diveT < 0 || this.standing) return; this.diveT += dt;
    const P = MAN.penalty, reach = P.diveReach * (this.stretch ? 1.15 : 1), k = clamp(this.diveT / P.diveTime, 0, 1);
    this.kx = this.dive * reach * Math.sin(k * Math.PI / 2);                      // fast off the line, slowing at full stretch
    this.ky = (this.lift || 0) * Math.sin(Math.min(1, this.diveT / (P.diveTime * 1.6)) * Math.PI);   // up and back down
    const kb = this.proj(this.kx - this.dive * P.diveDrift * Math.sin(k * Math.PI / 2), this.ky, this.C.zg - 0.3);
    this.gkSpr.setPosition(Math.round(kb.x), Math.round(kb.y));
  }
  // WILD: press as the ball reaches you = a last-moment stretch (a ring closes on the ball)
  stretchTick() {
    if (this.style !== 'wild' || this.stretchTry || this.result) return;
    const b = this.ball, C = this.C, tLeft = (C.zg - 0.3 - b.z) / Math.max(1, b.vz), kp = this.ct.keep;
    if (kp.cpu) { if (tLeft < 0.12) { this.stretchTry = true; this.stretch = Math.random() < 0.45; } }
    else if (kp.pressed('ok')) { this.stretchTry = true; this.stretch = tLeft < 0.22 && tLeft > -0.02; }
    if (this.stretchTry && this.stretch) { this.sub.setText('STRETCH!'); this.cameras.main.shake(90, 0.004); }
  }
  strike() {
    const C = this.C, b = this.ball, t = this.pick.take, p = t.power, s = this.style;
    SFX.kick(t.chip ? 0.3 : p);
    let tx, ty, speed;
    if (t.chip) { tx = t.x + rnd(-t.err, t.err); ty = t.y + rnd(-0.15, 0.15); speed = 12.5; }
    else {
      const miss = p > 0.93 ? (p - 0.93) * (s === 'wild' ? 18 : 14) : 0;          // too much power: it can fly
      tx = t.x + rnd(-t.err, t.err); ty = Math.max(0.05, t.y + rnd(-t.err, t.err) * 0.6 + rnd(0, miss));
      speed = 15 + p * (s === 'wild' ? 19 : 15);                                 // 54 - 108 km/h (wild: up to 122)
    }
    const T = 11 / speed;
    b.x = 0; b.y = 0.11; b.z = C.Dc; b.vx = tx / T; b.vz = speed; b.vy = (ty - 0.11 + 0.5 * G * T * T) / T;
    this.state = 'flight'; this.t = 0; this.shot = { tx, ty, speed: +speed.toFixed(1), power: +p.toFixed(2), chip: !!t.chip, style: s };
    this.cameras.main.shake(s === 'wild' ? 220 : 120, (s === 'wild' ? 0.009 : 0.004) * (0.5 + p));
    if (s === 'wild') { this.cameras.main.zoomTo(1.1, 160); if (p > 0.88) this.cameras.main.flash(120, 255, 222, 30); }
  }
  fly(dt) {
    const C = this.C, b = this.ball, P = MAN.penalty, n = 4;
    for (let i = 0; i < n; i++) {
      const h = dt / n, oz = b.z;
      b.vy -= G * h; b.x += b.vx * h; b.y += b.vy * h; b.z += b.vz * h;
      if (b.y < 0.11 && b.vy < 0) { b.y = 0.11; b.vy = -b.vy * 0.45; b.vx *= 0.85; b.vz *= 0.85; }
      if (this.result) { if (this.result.kind === 'goal' && b.z > C.zg + 1.2) { b.vz = 0; b.vx *= 0.5; b.z = C.zg + 1.2; } continue; }
      const kz = C.zg - 0.3;
      if (oz < kz && b.z >= kz) {                                                 // the ball reaches the keeper's plane
        const k = this.diveT < 0 ? 0 : clamp(this.diveT / P.diveTime, 0, 1), st = this.stretch ? 1 : 0;
        const ky = this.ky || 0, w = (this.dive ? 0.5 + 0.45 * k : 0.75) + st * 0.45, top = (this.dive ? 1.4 + 0.5 * k : 2.25) + ky + st * 0.35;
        const bot = this.dive ? Math.max(0, ky - 0.5) : 0, gap = Math.abs(b.x - this.kx);
        if (gap < w && b.y < top && b.y > bot) {
          const caught = b.vz < (this.dive ? 21 : 26) && gap < (this.dive ? 0.35 : 0.5) && b.y < 1.7 + ky;
          this.end(caught ? 'saved' : 'parried', { gap: +gap.toFixed(2) });
          if (caught) { b.vx = b.vy = b.vz = 0; b.x = this.kx; b.y = 1.0; b.held = true; if (!this.dive && this.A.catchS) this.gkSpr.play(this.A.catchS); }
          else { b.vz = -b.vz * 0.25; b.vx = (b.x >= this.kx ? 1 : -1) * rnd(3, 6); b.vy = rnd(2, 5); }
          continue;
        }
      }
      if (oz < C.zg && b.z >= C.zg) {                                             // the goal line
        const inX = Math.abs(b.x) < 3.66 - 0.11, inY = b.y < 2.44 - 0.11;
        const post = !inX && Math.abs(Math.abs(b.x) - 3.66) < 0.22 && b.y < 2.55, barHit = inX && Math.abs(b.y - 2.44) < 0.2;
        if (inX && inY) this.end('goal');
        else if (post || barHit) { this.end('post'); b.vz = -b.vz * 0.4; b.vx = -b.vx * 0.3 + rnd(-2, 2); }
        else this.end('miss');
      }
    }
    if (this.result && this.result.kind !== 'goal' && b.z > C.zg + 6) { b.vx = b.vy = b.vz = 0; }
  }
  // ---- the outcome, with reactions on both sides
  end(kind, extra = {}) {
    const s = this.style, cam = this.cameras.main, wild = s === 'wild';
    const text = { goal: 'GOAL!!', saved: 'SAVED!', parried: 'SAVED!', miss: 'MISSED!', post: 'OFF THE POST!' }[kind];
    this.result = { kind, dive: this.dive, high: !!(this.pick.keep && this.pick.keep.high), stretch: this.stretch, ...this.shot, ...extra };
    this.big.setText(text); this.hint.setVisible(false); this.state = 'done'; this.t = 0;
    if (kind === 'goal') { SFX.net(); SFX.roar(4, 1); } else if (kind === 'post') { SFX.post(); SFX.ooh(); } else if (kind === 'miss') SFX.ooh(); else { SFX.catch(); SFX.roar(2.5, 0.6); }
    if (this.rami) {
      if (kind === 'goal') this.rami.say('goal', this.shot && this.shot.chip ? { text: 'A PANENKA!!\nCHEEKY!', expr: 'laugh' } : {}, 3);
      else if (kind === 'post') this.rami.say('post', {}, 3);
      else if (kind === 'miss') this.rami.say('miss', { text: 'OHHH! HE HAS\nPUT IT WIDE!' }, 3);
      else this.rami.say('save', {}, 3);
    }
    if (!this.stretch || kind === 'goal') this.sub.setText(this.shot.chip && kind === 'goal' ? 'CHIPPED IT!' : '');
    const later = (ms, fn) => this.time.delayedCall(ms, fn);
    const stand = a => { if (!a) return; this.standing = true; const kb = this.proj(this.kx, 0, this.C.zg - 0.3); this.gkSpr.setPosition(Math.round(kb.x), Math.round(kb.y)); this.gkSpr.play(a); };
    if (wild) later(250, () => cam.zoomTo(1, 400));
    if (kind === 'goal') {
      if (wild) cam.flash(220, 255, 255, 255);
      later(350, () => this.A.cele && this.tkSpr.play(this.A.cele));
      later(650, () => stand(this.A.kDefeat));
      if (this.d.m && this.d.m.stadium) this.d.m.stadium.cheer(4);
    } else if (kind === 'saved' || kind === 'parried') {
      if (wild) { cam.flash(180, 40, 200, 230); cam.shake(200, 0.006); }
      later(450, () => this.A.miss && this.tkSpr.play(this.A.miss));
      later(kind === 'saved' ? 900 : 700, () => stand(this.A.kCele));
    } else {
      later(400, () => this.A.miss && this.tkSpr.play(this.A.miss));
      later(800, () => stand(this.A.kCele || this.A.kIdle));
    }
  }
  draw() {
    const g = this.g, b = this.ball, C = this.C, s = this.style; g.clear();
    if (b.held) { const kb = this.proj(this.kx, (this.dive ? 0.45 : 1.0) + (this.ky || 0), C.zg - 0.35); this.ballSpr.setPosition(kb.x, kb.y).setScale(kb.s * 0.22 / ballPx() * PEN_BALL_S).setDepth(12); this.shadow.setVisible(false);
      if (this.standing) this.ballSpr.setVisible(false); }
    else {
      const p = this.proj(b.x, b.y + 0.11 * (PEN_BALL_S - 1), b.z), sh = this.proj(b.x, 0, b.z), sc = p.s * 0.22 / ballPx() * PEN_BALL_S;   // drawn big, still sits on the grass
      this.ballSpr.setPosition(Math.round(p.x), Math.round(p.y - (13 - ballPx() / 2) * sc)).setScale(sc).setDepth(b.z > C.zg - 0.3 ? 8 : 20)
        .setFrame(`ball-y${Math.floor((this.t * 30 * (this.state === 'flight' ? 1 : 0)) % 8)}`);
      this.shadow.setVisible(true).setPosition(Math.round(sh.x), Math.round(sh.y - 7.5 * sc)).setScale(sc).setAlpha(clamp(1 - b.y / 4, 0.3, 0.9)).setDepth(b.z > C.zg - 0.3 ? 7 : 19);
      this.ballSpr.setVisible(!this.placing);                                    // his hands hold the ball while he places it
    }
    if (this.state === 'pick') {
      const tk = this.ct.take, kp = this.ct.keep;
      const box = (z, col) => {                                                  // a zone of the goal: a third wide, half high
        const x0 = z.side * 2.44 - 1.22, y0 = z.high ? 1.22 : 0, a = this.proj(x0, y0 + 1.22, C.zg), c = this.proj(x0 + 2.44, y0, C.zg);
        g.lineStyle(3, 0x0c0a0e).strokeRect(a.x, a.y, c.x - a.x, c.y - a.y).lineStyle(2, col).strokeRect(a.x + 1, a.y + 1, c.x - a.x - 2, c.y - a.y - 2);
      };
      if (!this.secret) {
        if (!tk.cpu && !this.pick.take) {
          if (s === 'tech') {
            const a = this.proj(this.aim.x, this.aim.y, C.zg), r = 9;
            g.lineStyle(3, 0x0c0a0e).strokeCircle(a.x, a.y, r + 1).lineStyle(2, 0xffde1e).strokeCircle(a.x, a.y, r)
              .lineBetween(a.x - r - 5, a.y, a.x - r + 3, a.y).lineBetween(a.x + r - 3, a.y, a.x + r + 5, a.y)
              .lineBetween(a.x, a.y - r - 5, a.x, a.y - r + 3).lineBetween(a.x, a.y + r - 3, a.x, a.y + r + 5);
          } else box(this.charge >= 0 ? this.lockZone : tk.zone(), 0xffde1e);
        }
        if (!kp.cpu && !this.pick.keep) box(kp.zone(), 0x28c8e6);
      }
      const W = 220, x0 = PEN_W / 2 - W / 2, y0 = PEN_H - 100;
      if (s === 'wild' && this.charge >= 0 && !this.pick.take) {                  // power: past the white line it can fly
        g.fillStyle(0x0c0a0e).fillRect(x0 - 3, y0 - 3, W + 6, 16).fillStyle(this.charge > 0.93 ? 0xff2878 : 0xffde1e).fillRect(x0, y0, Math.round(W * this.charge), 10)
          .fillStyle(0xf4f0e4).fillRect(x0 + Math.round(W * 0.93), y0 - 3, 2, 16);
      }
      if (s === 'tech' && this.meter >= 0 && !this.pick.take) {                   // stop it in the green
        const v = this.meterVal();
        g.fillStyle(0x0c0a0e).fillRect(x0 - 3, y0 - 3, W + 6, 16).fillStyle(0x3a3542).fillRect(x0, y0, W, 10)
          .fillStyle(0x7cff9a).fillRect(x0 + Math.round(W * 0.68), y0, Math.round(W * 0.14), 10)
          .fillStyle(0xffde1e).fillRect(x0 + Math.round(W * v) - 2, y0 - 4, 4, 18);
      }
    }
    if (s === 'wild' && this.state === 'flight' && !this.result && !this.ct.keep.cpu && !this.stretchTry) {   // the stretch ring closes on the ball
      const tLeft = (C.zg - 0.3 - b.z) / Math.max(1, b.vz), p = this.proj(b.x, b.y, b.z), r = 10 + Math.max(0, tLeft) * 90;
      if (tLeft < 0.6) g.lineStyle(3, tLeft < 0.22 ? 0x7cff9a : 0xf4f0e4, 0.9).strokeCircle(p.x, p.y, r);
    }
    const so = this.d.shootout;                                                  // 1v1 shoot-out: the score so far
    if (so) {
      const F = (i, y) => {
        const marks = so.marks[i], xs = PEN_W / 2 - 40;
        g.fillStyle(0x0c0a0e, 0.7).fillRect(xs - 150, y - 10, 330, 22);
        for (let k = 0; k < Math.max(5, marks.length + (so.shooter === i ? 1 : 0)); k++) {
          const cx = xs + 24 + k * 20, m = marks[k];
          if (m === true) g.fillStyle(0x7cff9a).fillCircle(cx, y + 1, 7); else if (m === false) g.fillStyle(0xff2878).fillCircle(cx, y + 1, 7);
          else g.lineStyle(2, so.shooter === i && k === marks.length ? 0xffde1e : 0xf4f0e4).strokeCircle(cx, y + 1, 6);
        }
      };
      F(0, 64); F(1, 90);
      if (!this.soT) { this.soT = [0, 1].map(i => this.add.text(PEN_W / 2 - 186, [64, 90][i] + 1, so.names[i], { fontFamily: '"Press Start 2P"', fontSize: '10px', color: '#f4f0e4' }).setOrigin(0, 0.5).setDepth(51)); }
    }
  }
}

// ---------------------------------------------------------------- Match methods: penalties
hc2Mix(Match, {
  // a penalty: the camera cuts to behind the taker (PenaltyScene); afterwards the match carries on from what happened
  startPenalty(team, note, opts = {}) {
    const def = team.opp, b = this.ball; this.loseTime(45);
    const taker = opts.taker || [9, 10, 8, 7, 6, 5, 4, 3, 2, 1].map(i => team.players[i]).find(p => !p.sentOff) || team.players[0];
    const gk = def.players[0];
    Object.assign(b, { owner: null, vx: 0, vy: 0, vz: 0, inNet: false, save: null, target: null });
    this.setPiece = null; this.pending = null; this.penaltyMode = true;
    if (note) this.say('PENALTY', note, 1.5);
    const human = opts.human !== undefined ? opts.human : (team === this.home ? 'take' : 'keep');
    this.scene.launch('penalty', { m: this, team, taker, gk, human, force: opts.force, style: opts.style || window.HC2_PEN,
      done: res => { this.endPenalty(res, team, taker, gk); if (opts.done) opts.done(res); } });
  },
  // 1v1 PENALTY BATTLE on one keyboard: P1 (home, WASD + K) v P2 (away, arrows + .), 5 each then sudden death, roles swap
  startShootout(vsCpu) {
    this.scene.stop('penalty'); this.penaltyMode = true; this.setPiece = null; this.pending = null; this.over = false; this.msg.setText(''); this.sub.setText('');
    this.so = { teams: [this.home, this.away], marks: [[], []], kick: 0, done: false, winner: -1, cpu: !!vsCpu };
    this.nextShootoutKick();
  },
  nextShootoutKick() {
    const so = this.so, i = so.kick % 2, team = so.teams[i], def = so.teams[1 - i];
    const order = [9, 10, 8, 7, 6, 5, 4, 3, 2, 1].map(k => team.players[k]).filter(p => !p.sentOff), taker = order[Math.floor(so.kick / 2) % order.length];
    this.scene.stop('penalty');
    this.time.delayedCall(60, () => this.scene.launch('penalty', { m: this, team, taker, gk: def.players[0], style: window.HC2_PEN || 'base',
      ctl: so.cpu ? { take: i === 0 ? 'human' : 'cpu', keep: i === 0 ? 'cpu' : 'human' } : { take: i === 0 ? 'p1' : 'p2', keep: i === 0 ? 'p2' : 'p1' },
      shootout: { names: so.cpu ? [so.teams[0].name, so.teams[1].name] : [`P1 ${so.teams[0].name}`, `P2 ${so.teams[1].name}`], marks: so.marks, shooter: i },
      done: res => this.shootoutResult(res) }));
  },
  shootoutResult(res) {
    const so = this.so, i = so.kick % 2; so.marks[i].push(res.kind === 'goal'); so.kick++;
    const g = so.marks.map(m => m.filter(Boolean).length), n = so.marks.map(m => m.length);
    let w = -1;
    if (so.kick <= 10) { for (const a of [0, 1]) if (g[a] > g[1 - a] + (5 - n[1 - a])) w = a; }   // can't be caught any more
    else if (so.kick % 2 === 0 && g[0] !== g[1]) w = g[0] > g[1] ? 0 : 1;                       // sudden death: after each pair
    if (w >= 0) {
      so.done = true; so.winner = w; this.scene.stop('penalty');
      this.say(so.cpu ? `${so.teams[w].name} WIN!` : `P${w + 1} WINS!`, `${so.teams[0].name} ${g[0]} - ${g[1]} ${so.teams[1].name} ON PENALTIES · ENTER: ${this.inCup() ? 'CUP' : 'AGAIN'}`, 99999); this.stadium.cheer(5);
      this.ramiSay('full_time', { text: so.cpu ? `WHAT A SHOOT-OUT!\n${so.teams[w].name} TAKE IT!` : `WHAT A SHOOT-OUT!\nP${w + 1} TAKES IT!`, expr: 'laugh' }, 3);
      return;
    }
    this.nextShootoutKick();
  },
  endPenalty(res, team, taker, gk) {
    this.scene.stop('penalty'); this.penaltyMode = false;
    const def = team.opp, b = this.ball, gx = team.goalX;
    if (window.HC2_PEN_NO_RESUME) return;
    if (res.kind === 'goal') {
      team.score++; this.say('GOAL!!', `${team.name} SCORES`, 2.4); this.stadium.cheer(3);
      this.afterGoal(def);                                                       // v0.8.5 (golden goal / time up)
    } else if (res.kind === 'saved') {                                           // the keeper has it in his hands
      for (const p of this.all) { if (p.sentOff) continue; p.state = 'idle'; p.vx = p.vy = 0; }
      gk.x = def.ownGoalX + def.side * 1.5; gk.y = 34; gk.face = def.side > 0 ? 0 : 4;
      Object.assign(b, { x: gk.x, y: 34, z: 1.1, owner: gk, last: def }); gk.hands = true; gk.hold = 0; this.freeze = 0.8;
    } else if (res.kind === 'parried') this.restart('CORNER', team, gx - team.side * 0.4, Math.random() < 0.5 ? 0.4 : PITCH_W - 0.4);
    else this.restart('GOAL KICK', def, gx - team.side * 5.5, 34);
  },
});
