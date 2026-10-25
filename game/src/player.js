'use strict';
// HC2 Football · player.js: Player (movement, stamina, animation, drawing) and Team
// (split out of game.js in v0.9.5 - load order and lanes: src/README.md)
// t-022 THE HEADER / VOLLEY / DIVING HEADER PICKS, in one table so the taskmaster's new PixelLab moves drop in by name:
// the first row whose frames are in his kit (his direction, or -S), whose dirs (if any) hold his direction and whose
// test passes wins. h = p.airHit at the contact: z (the ball's height, m), side (degrees between where the ball came
// from and where he sends it: 0 = straight back, 90 = across him) and pw (a charged one's power, 0 = a tap).
// Batch 20 (taskmaster, 25 Oct; Luca 07:04: "the header animation and volley animation should generate new versions
// from different angles and make the animation feel impactful"): header2 is a rising POWER header (leap, arch, snap
// through it), so it plays for the charged ones and the balls he leaps for; volley2 a whipped side volley (charged,
// high or side-on); volleyf a laced front volley, made facing S / N; dheader2 a flat-out diving header, made E / W
// (its other directions are the old dive's frames). (A volley plays at its kick rate, kickRate in core.js.)
const AIR_PICKS = {
  header: [
    { a: 'header2', fps: 15, ok: h => h.pw > 0 || h.z > 2.2 },             // batch 20: the power header (headers are met at 1.1-2.7 m: over 2.2 he leaps)
    { a: 'header', fps: 15 },                                                // the PixelLab header
    { a: 'jump', fps: 16 },                                                  // kits without it
  ],
  volley: [
    { a: 'volley2', fps: 18, ok: h => h.pw > 0 || h.z > 0.75 || h.side > 55 },   // batch 20: the whipped side volley
    { a: 'volleyf', fps: 18, dirs: ['S', 'N'] },                             // batch 20: the laced front volley
    { a: 'volley', fps: 18 },
  ],
  dheader: [
    { a: 'dheader2', fps: 16 },                                              // batch 20: the flat-out diving header
    { a: 'dheader', fps: 16 },
  ],
};
function airPick(K, kind, d, h) {
  for (const r of AIR_PICKS[kind]) if ((K.anims[`${r.a}-${d}`] || K.anims[`${r.a}-S`]) && (!r.dirs || r.dirs.includes(d)) && (!r.ok || (h && r.ok(h)))) return r;
  return null;
}
// batch 20: the frame where his forehead / boot meets the ball (manifest 'contact', written by tools/kit_build.py), for
// the direction that will actually play (his own, else -S, as play() falls back); undefined for moves without one
function airContact(K, a, d) { const c = K.contact; return c ? c[`${a}-${K.anims[`${a}-${d}`] ? d : 'S'}`] : undefined; }
class Player {
  constructor(m, team, i, kit) {
    this.m = m; this.team = team; this.i = i; this.kit = kit; this.keeper = i === 0;
    const h = FORMATION[i]; this.home = team.side > 0 ? { x: h[0], y: h[1] } : { x: PITCH_L - h[0], y: h[1] };
    this.x = this.home.x; this.y = this.home.y; this.vx = 0; this.vy = 0;
    this.face = team.side > 0 ? 0 : 4; this.state = 'idle'; this.stateT = 0; this.cool = 0; this.stun = 0;
    this.anim = ''; this.speed = 0; this.stamina = 1; this.tired = false; this.sprinting = false; this.touchT = 0; this.hands = false;
    const K = MAN.kits[kit];
    this.spr = m.add.sprite(0, 0, kit, K.anims['idle-E'][0]).setOrigin(0.5, K.feetY / (K.frameH || 128));   // PixelLab kits: 128 x 160 frames
    this.num = team.side > 0 ? [1, 2, 3, 4, 5, 6, 8, 10, 7, 9, 11][i] : [1, 2, 3, 4, 5, 6, 8, 10, 7, 9, 11][i];
  }
  play(name, rate, once) {
    const key = `${this.kit}:${name}`, from = this._from || 0; this._from = 0;   // (batch 20: a header starts on its contact frame)
    if (!this.m.anims.exists(key)) {
      const fr = MAN.kits[this.kit].anims[name]; if (!fr) return false;
      this.m.anims.create({ key, frames: fr.map(f => ({ key: this.kit, frame: f })), frameRate: rate, repeat: once ? 0 : -1 });
    }
    if (this.anim !== key) {
      this.setOrg(name);
      // run <-> sprint: carry on from the same point of the stride instead of snapping back to frame 0 (the v0.6 sprint 'jank')
      const loop = /:(run|sprint|walk)-/.test(key) && /:(run|sprint|walk)-/.test(this.anim || '') && this.spr.anims.isPlaying;
      const prog = loop ? this.spr.anims.getProgress() : 0;
      this.spr.play(from ? { key, startFrame: from } : key); this.anim = key;
      if (loop && prog > 0) this.spr.anims.setProgress(prog);
    }
    return true;
  }
  // most frames stand on the feet; moves made on a bigger canvas carry their own origin in the manifest ('origins'):
  // keeper dives (turned a quarter in the kit build, drawn centred), the trophy lift (taller frames), and batch 16's
  // aerial specials + keeper special saves (the 256 x 184 rig window). Set whenever the move changes (play), so new
  // PixelLab moves with an origin need no code here - it used to be picked per state (dive / trophy) in draw()
  setOrg(name) {
    const K = MAN.kits[this.kit], org = K.origins && K.origins[name];
    const ox = org ? org[0] : 0.5, oy = org ? org[1] : K.feetY / (K.frameH || 128);
    if (this._ox !== ox || this._oy !== oy) { this.spr.setOrigin(ox, oy); this._ox = ox; this._oy = oy; }
  }
  draw() {
    const X = wx(this.x, this.y), Y = wy(this.y);
    // t-007: a keeper's leap or high dive takes him off the grass: up to `leap` metres at the top of his flight (diveFly),
    // back down over 0.3 s (the frames stay his PixelLab ones; only where they're drawn moves). Not for the dive frames
    // drawn centred on him (kit origins): those already show him in the air
    let lift = 0;
    if (this.keeper && this.state === 'dive' && this.leap > 0 && !(MAN.kits[this.kit].origins || {})[this.diveAnim]) { const age = (this.diveLen || 0.85) - this.stateT, f = this.diveFly || 0.3;
      lift = this.leap * (age < f ? Math.sin(Math.PI / 2 * age / f) : Math.max(0, 1 - (age - f) / 0.3)); }
    this.spr.setPosition(Math.round(X), Math.round(Y - lift * PX_H)).setDepth(Y);
    if (this.keeper && this.spSave && !this.sentOff && (this.m.ball.special || this.m.ball.saveable)) this.m.auraFx(this);   // v0.8.9 his special save is ready: he burns in its colour
    if (this.rig && !this.sentOff) { const P = this.m.rigAt(this, this.rig.n, this.rig.t, this.rig.d, this.rig); if (P) { this.rigShow(P); return; } this.rig = null; }
    if (this._rigged || this.spr.rotation || this.spr.scaleX !== 1 || this.spr.scaleY !== 1) { this._rigged = false; this.spr.setRotation(0).setScale(1); this._ox = this._oy = null; this.anim = ''; }   // (after a rig / a replay)
    const K = MAN.kits[this.kit];
    const d = DIRS[this.face];
    const ONCE = { getup: ['getup', 12], fall: ['fall', 14], hit: ['hit', 14], header: ['jump', 16], trap: ['trap', 18],
      dheader: ['dheader', 16], celebrate: ['celebrate', 10], tackle: ['tackle', 16], punch: ['punch', 16], chance: ['chance', 10],
      dejected: ['dejected', 8], roar: ['kroar', 10], beaten: ['pkdefeat', 9], protest: ['protest', 9], hurt: ['hurt', 10], blasted: ['blasted', 11] };   // batch 8: conceded, keeper roars after a big save   // batch 5: tackle, keeper punch
    if (this.sentOff) { this.spr.setVisible(false); return; }
    this.spr.setVisible(!this.hide);   // v0.8.5: shown again when he comes back on (the Lab benches players between tests; the walk-out / half time hide them with .hide)
    if (this.state !== 'run' && this.state !== 'idle') this.spr.anims.timeScale = 1;
    if (this.state === 'kick') {
      let ka = this.kickAnim || 'kick', kd = d;
      if (ka === 'volley') { const ap = airPick(K, 'volley', d, this.airHit); if (ap) ka = ap.a; }   // t-022: the volley from AIR_PICKS
      if (ka === 'throwin') kd = this.y < 34 ? 'S' : 'N';                   // throw-ins: made facing in from either touchline
      if (ka === 'gkick') kd = dirVec(this.face).x >= 0 ? 'E' : 'W';                           // keeper kick-outs: made side-on
      if (ka === 'super' || ka === 'sp1' || ka === 'sp2') kd = dirVec(this.face).x >= 0 ? 'E' : 'W';   // the special moves: made side-on
      if (!this.play(`${ka}-${kd}`, kickRate(ka), true) && !this.play(`kick-${d}`, 18, true)) this.play(`throw-${d}`, 18, true) || this.play(`idle-${d}`, 5);
    }
    else if (this.state === 'catch') { if (!(this.claimHigh && this.play(`claim-${d}`, 16, true)) && !this.play(`catch-${d}`, 16, true)) this.play(`idle-${d}`, 5); }
    else if (this.state === 'dive') { this.play(this.diveAnim, /^ksmother/.test(this.diveAnim || '') ? 20 : /^kcollapse/.test(this.diveAnim || '') ? 12 : 16, true); }   // (t-017: the smother's hands land on frame 6 at ~0.3 s; the 4-frame collapse a little slower)
    else if (this.state === 'slide') { if (!this.tacklePlay('slide', d, TACKLE.slideT)) { this.play(`run-${d}`, 13); this.spr.anims.timeScale = 0.01; } }
    else if (this.state === 'applaud') { if (!this.play(`applaud-${d}`, 9) && !this.play('applaud-S', 9)) this.play(`idle-${d}`, 5); }   // full time (loops)
    else if (this.state === 'trophy') {                                         // v0.7.4 cup ceremony: PixelLab trophy lift, then he keeps it up there
      const up = this.anim === `${this.kit}:trophy-S` && !this.spr.anims.isPlaying;
      if (up || this.anim === `${this.kit}:trophyup-S`) { if (!this.play('trophyup-S', 8)) this.play('trophy-S', 10, true); }
      else if (!this.play('trophy-S', 10, true)) { if (!this.play('celeb4-S', 9)) this.play('celebrate-S', 9); }
    }
    else if (this.state === 'party') { if (!this.play(`${this.partyAnim || 'applaud'}-S`, this.partyFps || 9)) this.play('applaud-S', 9); }   // v0.7.4 ceremony: team-mates celebrate on a loop
    else if (this.state === 'blasted') { if (!this.play(`blasted-${dirVec(this.face).x >= 0 ? 'E' : 'W'}`, 11, true)) this.play(`idle-${d}`, 5); }
    else if (this.state === 'labanim') {                                       // Test Lab: play any move on its own
      const a = this.labAnim, k = [d, dirVec(this.face).x >= 0 ? 'E' : 'W', 'S'].find(q => K.anims[`${a}-${q}`]);
      if (!k || !this.play(`${a}-${k}`, this.labFps || 12, true)) this.play(`idle-${d}`, 5);
    }
    else if (this.state === 'getup' && this.slideUp && this.tacklePlay('slideup', d, this.slideWon ? TACKLE.upWon : TACKLE.upMiss)) { }   // t-018: up off the grass after a slide
    else if (this.state === 'getup' && this.getupAnim && this.play(this.getupAnim, 18, true)) { }   // t-017: the keeper back up off the grass after a dive (batch 18 kgetup)
    else if (ONCE[this.state]) { const ap = (this.state === 'header' || this.state === 'dheader') && airPick(K, this.state, d, this.airHit);   // (t-022: the header / dive from AIR_PICKS)
      const [nm, fps] = ap ? [ap.a, ap.fps] : this.state === 'celebrate' && this.celeAnim ? [this.celeAnim, 10] : ONCE[this.state];
      if (ap && this.state === 'header') this._from = airContact(K, nm, d) || 0;   // batch 20: the ball leaves his head the moment the header starts, so the move opens on the frame that meets it (the snap shows with the thump, flash and hit-stop; the take-off frames before it are skipped)
      if (!this.play(`${nm}-${d}`, fps, true) && !this.play(`${nm}-S`, fps, true)) this.play(`idle-${d}`, 5); }
    else if (this.waitingThrowIn()) { if (!this.play(`throwinhold-${this.y < 34 ? 'S' : 'N'}`, 1, true)) this.play(`idle-${d}`, 5); }   // ball held over his head
    else if (this.keeper && this.hands && this.speed < 0.5) { if (!(this.claimHigh && this.play(`claim-${d}`, 16, true)) && !this.play(`catch-${d}`, 16, true)) this.play(`idle-${d}`, 5); }   // holds it as he caught it
    else if (this.keeper && this.speed < 0.5 && ((this.m.ball.save && this.m.ball.save.gk === this) || this.gkSet) && K.anims[`kset-${d}`]) this.play(`kset-${d}`, 10);   // set for the shot (v0.9.1: or ready for one)
    else if ((this.touchAnimT || 0) > 0 && K.anims[`touch-${d}`]) this.play(`touch-${d}`, 18, true);      // first touch on the run
    else if (this.jockeyOn && K.anims[`jockey-${d}`]) { this.play(`jockey-${d}`, 10); this.spr.anims.timeScale = clamp(this.speed / 2.6, 0.35, 1.8); }   // v0.8.2 PixelLab jockey
    else {
      // v0.8.7 LOCOMOTION LOCK (BUG WATCH measured idle / walk / run blipping on screen for a frame or two ~2,500 times a
      // match): idle / walk / run / sprint / shuffle are picked with dead bands, then each one shows for at least 0.14 s
      this.moveLook = this.speed > (this.moveLook ? 0.3 : 0.6);
      this.sprintLook = this.moveLook && this.sprinting && this.speed > RUN * (this.sprintLook ? 0.92 : 1.04);   // (sprint: no flicking around top running speed)
      this.walkLook = this.moveLook && !this.sprintLook && !this.m.penaltyMode && !!K.anims[`walk-${d}`] && this.speed < WALK_V * (this.walkLook ? 1.12 : 0.9);   // v0.7.4 PixelLab walk below a jog
      const fv = this.keeper && this.speed < (this.gkFace ? 5.6 : 3.2) && K.anims['shuffle-E'] ? dirVec(this.face) : null;   // v0.7.4 keeper side-shuffle along his line (made facing E, W = mirror)
      const fwd = fv ? fv.x * this.vx + fv.y * this.vy : 0;                      // t-017: dropping back quickly while he faces the ball: the backpedal (PixelLab batch 18 kback), or the shuffle without it
      const back = this.moveLook && fv && this.gkFace && Math.abs(fv.x) > 0.3 && fwd < -0.5 * this.speed && this.speed > WALK_V * 0.9;
      const shuffle = this.moveLook && fv && Math.abs(fv.x) > 0.3 && (Math.abs(fwd) < 0.55 * this.speed || (back && !K.anims['kback-E']));
      let cls = !this.moveLook ? 'idle' : back && K.anims['kback-E'] ? 'kback' : shuffle ? 'shuffle' : this.walkLook ? 'walk' : this.sprintLook ? 'sprint' : 'run';
      const now = this.m.time.now;
      if (cls !== this.loco) { if (this.loco && this.anim === this.locoAnim && now - (this.locoAt || 0) < 140 && !this.m.replay) cls = this.loco; else { this.loco = cls; this.locoAt = now; } }
      // QA overnight 24 Oct (Luca marked ANIMATION FLICKER clips "bug"; the soak still counted ~200 a match): the lock above
      // holds the move but not the direction, so a turn landing a frame before a move change (walk-W, walk-SW for one
      // frame, run-SW) or just after one still blipped. Now every idle / walk / run picture, direction included, stays
      // up at least 0.11 s. The dust keeps the unheld pick: it draws a random number, so seeded matches play the same.
      const dustNow = cls === 'sprint'; let fc = this.face;
      if (this !== this.m.human && !this.m.replay) {                             // (your own player turns the moment you steer)
        const lk = cls + ':' + fc;
        if (this.lkKey && lk !== this.lkKey && this.anim === this.locoAnim && now - (this.lkAt || 0) < 110) { cls = this.lkCls; fc = this.lkFace; }
        else if (lk !== this.lkKey) { this.lkKey = lk; this.lkCls = cls; this.lkFace = fc; this.lkAt = now; }
      } else this.lkKey = null;
      const dd = DIRS[fc];
      if (cls === 'shuffle') { this.play(`shuffle-${dirVec(fc).x > 0 ? 'E' : 'W'}`, 10); this.spr.anims.timeScale = clamp(this.speed / 1.8, 0.5, 1.8); }
      else if (cls === 'kback') { this.play(`kback-${dirVec(fc).x > 0 ? 'E' : 'W'}`, 12); this.spr.anims.timeScale = clamp(this.speed / 2.4, 0.6, 1.8); }   // t-017
      else if (cls === 'walk') { if (this.play(`walk-${dd}`, 8)) { this.spr.anims.timeScale = clamp(this.speed / 1.5, 0.45, 1.6);
          if (this.keeper) { const fw = dirVec(fc), back = this.vx * fw.x + this.vy * fw.y < -0.5 * this.speed; if (!!this.spr.anims.inReverse !== back) this.spr.anims.reverse(); } }   // v0.9.1 keeper backs off facing the ball: the walk plays backwards
        else this.play(`run-${dd}`, 13); }
      else if (cls === 'run' || cls === 'sprint') {
        if (!(cls === 'sprint' && this.play(`sprint-${dd}`, 13))) this.play(`run-${dd}`, 13);
        const pxs = Math.hypot(this.vx * PX_X * scaleAt(this.y), this.vy * PX_Y);   // legs in step with the ground
        this.spr.anims.timeScale = clamp(pxs / STRIDE_PX / 13, 0.3, 2.0);
      }
      else {
        const sp = this.m.setPiece, KA = K.anims;
        if (sp && !sp.kicked && this.keeper && sp.team !== this.team && (sp.kind === 'CORNER' || sp.kind === 'FREE KICK') && KA['korg-S']) this.play('korg-S', 9);
        else if (sp && !sp.kicked && sp.taker === this && sp.kind === 'CORNER' && sp.t < 2.2 && KA['signal-S']) this.play('signal-S', 9, true);
        else if (sp && !sp.kicked && !this.keeper && sp.taker !== this && this.i % 3 !== 0 && KA['hips-S']) this.play('hips-S', 7);
        else this.play(`idle-${dd}`, 5);
        this.spr.anims.timeScale = 1;
      }
      if (dustNow && now > (this.dustAt || 0) && !this.m.replay) { this.dustAt = now + rnd(320, 460); this.m.dust(this); }   // v0.7 PixelLab dust off the boots
      this.locoAnim = this.anim;
    }
    // some PixelLab moves show the ball in his hands / on his chest (catch, throw, chest trap): the game hides its own ball then
    K._carry = K._carry || new Set(K.carry || []);
    this.carrying = K._carry.has(this.anim.slice(this.kit.length + 1));
  }
  rigShow(P) {                                                                   // v0.8.9 one frame of a rough rig
    const s = this.spr; s.setVisible(!this.hide); s.anims.stop(); s.setFrame(P.fr); this.anim = 'rig:' + this.rig.n;
    if (this._ox !== P.ox || this._oy !== P.oy) { s.setOrigin(P.ox, P.oy); this._ox = P.ox; this._oy = P.oy; }   // (t-014: batch 16 frames hang from the manifest's origin)
    s.setPosition(Math.round(P.x), Math.round(P.y)).setRotation(P.rot).setScale(P.sx, P.sy).setDepth(wy(this.y));
    this._rigged = true; this.carrying = false; this.m.rigFx(this, P);
  }
  waitingThrowIn() { const sp = this.m.setPiece; return !!(sp && sp.kind === 'THROW-IN' && sp.taker === this && !sp.kicked && !this.busy()); }
  // top speed right now: sprint needs energy; a tired player can't sprint and runs a little slower
  top(sprint, withBall) {
    let v = RUN * (0.9 + 0.1 * Math.min(1, this.stamina / 0.3));
    if (sprint && !this.tired) v = RUN + (SPRINT - RUN) * clamp(this.stamina / 0.35, 0.25, 1);
    if (sprint && !this.tired && this.burst > 0) v *= 1.1;                       // v0.8: the first half second of a sprint is a burst
    return v * (withBall ? (sprint ? WITH_BALL_SPRINT : WITH_BALL) : 1) * (this.injury ? this.injury.k : 1);   // v0.8.5: injured = limping
  }
  moveTo(tx, ty, speed, dt) {
    const dx = tx - this.x, dy = ty - this.y, d = len(dx, dy);
    if (d < 0.25) { this.steer(0, 0, dt); return d; }
    const s = Math.min(speed, Math.sqrt(2 * DEC * 0.5 * d));       // brake in time to stop on the spot
    this.steer(dx / d * s, dy / d * s, dt); return d;
  }
  // linear acceleration and hard braking: players plant and stop instead of gliding; sharp turns brake first
  steer(vx, vy, dt, acc = ACC) {
    const dvx = vx - this.vx, dvy = vy - this.vy, d = Math.hypot(dvx, dvy); if (d < 1e-4) return;
    const cur = Math.hypot(this.vx, this.vy), tgt = Math.hypot(vx, vy);
    const sharp = cur > 0.5 && tgt > 0.5 && (vx * this.vx + vy * this.vy) < 0.7 * cur * tgt;
    const m = ((tgt < cur - 0.05 || sharp) ? DEC : acc) * dt;
    if (d <= m) { this.vx = vx; this.vy = vy; } else { this.vx += dvx / d * m; this.vy += dvy / d * m; }
  }
  look(dx, dy) {                                                   // v0.8.7: turn to watch something without flicking between two directions
    const want = dirIndex(dx, dy); if (want === this.face) { this.lookCand = null; return; }
    const fv = dirVec(this.face), dev = Math.acos(clamp((dx * fv.x + dy * fv.y) / (len(dx, dy) || 1), -1, 1));
    if (dev < 0.6) { this.lookCand = null; return; }                            // only just past the edge: keep the way he faces
    const now = this.m.time.now;
    if (want !== this.lookCand) { this.lookCand = want; this.lookAt = now; return; }
    if (now - this.lookAt >= 120) { this.face = want; this.lookCand = null; }
  }
  // a one-off move: always restarts its animation
  setState(s, t) { this.state = s; this.stateT = t; this.anim = ''; if (this.rig && ((RIGS[this.rig.n] || {}).brk || RIG_BREAK).test(s)) this.rig = null; }   // (v0.8.9: a rough rig stops when he's knocked over; t-014: a keeper's special-save move only when he's knocked over - his dive / punch states carry on under it)
  // t-018: the slide / get-up move from TACKLE.anims (the first one this kit has, batch 19's slide2 / slideup when they're
  // in), played once: over the slide / a missed get-up when the table gives no frame rate, and sped up to fit a quicker
  // get-up (a won slide's 0.3 s) - the key's frame rate is fixed when it's first made, so the fit is a time scale
  tacklePlay(kind, d, dur) {
    const K = MAN.kits[this.kit];
    for (const [nm, fps] of TACKLE.anims[kind]) {
      // (batch 19: PixelLab drew the N and S slides going sideways, so up / down the pitch shows the diagonal on the
      // side he's sliding towards - SE / SW, NE / NW)
      let dd = d; if (TACKLE.diagNS.includes(nm) && (d === 'N' || d === 'S')) dd = d + (((this.slideDir && this.slideDir.x) ?? dirVec(this.face).x) >= 0 ? 'E' : 'W');
      const fr = K.anims[`${nm}-${dd}`]; if (!fr) continue;
      const rate = fps || Math.max(4, fr.length / (kind === 'slide' ? TACKLE.slideT : TACKLE.upMiss));
      if (!this.play(`${nm}-${dd}`, rate, true)) return false;
      this.spr.anims.timeScale = Math.max(1, fr.length / rate / dur); return true;
    }
    return false;
  }
  busy() { return this.state !== 'idle' && this.state !== 'run'; }
  step(dt) {
    if (this.sentOff) { this.vx = this.vy = 0; this.speed = 0; this.rig = null; return; }
    if (this.rig) { this.rig.t += dt; const R = RIGS[this.rig.n]; if (!R || this.rig.t >= R.dur) this.rig = null; }   // v0.8.9 rough rig clock (stops in hit-stops + cut scenes)
    if (this.keeper && (this.spSave || this.rig) && this.m.gkSpecialRoll) this.m.gkSpecialRoll(this);   // t-014: his special-save move starts so its contact frame meets the ball (specials.js)
    this.cool = Math.max(0, this.cool - dt); this.stun = Math.max(0, this.stun - dt); if (this.touchAnimT > 0) this.touchAnimT -= dt;
    if (this.burst > 0) this.burst -= dt;
    if (this.keeper) { this.guardT = (this.guardT || 0) + dt; if (this.guardT > 2.5) this.guard = Math.min(1, (this.guard ?? 1) + GUARD_REGEN * dt); }   // v0.8 keeper guard refills
    if (this.state !== 'idle' && this.state !== 'run') {
      this.stateT -= dt;
      if (this.stateT <= 0) {                                       // after a slide or a fall you get up first
        if (this.state === 'slide' || this.state === 'fall' || this.state === 'dheader' || this.state === 'blasted' || (this.state === 'kick' && this.bike)) { const won = this.state === 'slide' && this.slideWon; this.slideUp = this.state === 'slide'; this.bike = false; this.setState('getup', won ? TACKLE.upWon : this.slideUp ? TACKLE.upMiss : 0.45);
          if (won) this.cool = Math.min(this.cool, TACKLE.upWon);                 // t-018: won it - free once he's up (a miss keeps its cool-down)
          const b = this.m.ball; if (this.slideKeep && !b.owner && len(b.x - this.x, b.y - this.y) < 1.8 && b.z < 0.5) { this.cool = 0; this.m.gain(this, 0); }   // v0.8.2 the block tackle: yours
          this.slideKeep = false; }
        else if (this.keeper && this.state === 'dive' && !this.hands && /^(diveLow|dive|diveHigh|smother)$/.test(this.saveKind || '') && MAN.kits[this.kit].anims['kgetup-E']) {   // t-017: off the grass, not a pop-up
          this.getupAnim = `kgetup-${this.team.side > 0 ? 'E' : 'W'}`; this.setState('getup', 0.44); }   // (8 frames at 18 a second)
        else { this.state = 'idle'; this.getupAnim = null; this.slideUp = false; }
      }
      if (this.state === 'dive') { const age = (this.diveLen || 0.85) - this.stateT, k = Math.exp(-dt * (age > (this.diveFly || 0.4) ? 16 : 0.4)); this.vx *= k; this.vy *= k; }
      else if (this.state === 'slide' || this.state === 'fall' || this.state === 'dheader' || this.state === 'blasted') { const k = Math.exp(-dt * (this.state === 'slide' ? TACKLE.slideK : 3.2)); this.vx *= k; this.vy *= k; }   // (t-018: the slide glides further)
      else this.steer(0, 0, dt);
    }
    if (this.stun > 0 && this.state !== 'slide') this.steer(0, 0, dt);
    // energy: sprinting drains it, everything else refills it (faster when walking or standing)
    if (this.sprinting && !this.tired && this.speed > RUN * 1.02) this.stamina -= SPRINT_DRAIN * (this.team.drain || 1) * dt;   // (v0.9.3: RISE WARRIOR's lungs)
    else this.stamina += (this.speed < 2.5 ? REST_GAIN : RUN_GAIN) * dt;
    this.stamina = clamp(this.stamina, 0, 1);
    if (this.stamina < 0.02) this.tired = true; else if (this.tired && this.stamina > 0.3) this.tired = false;
    this.x = clamp(this.x + this.vx * dt, -3, PITCH_L + 3); this.y = clamp(this.y + this.vy * dt, -3, PITCH_W + 3);
    this.speed = len(this.vx, this.vy);
    const b = this.m.ball, human = this.m.human === this;
    // v0.8.7 (BUG WATCH found it: keepers + slow players flickered between idle / walk / shuffle and two facings several
    // times a second): ONE wish for the way he faces each frame, and a slow player only turns once the new way has
    // held for 0.12 s. You (and anyone running fast) still turn at once.
    // t-017: while he tracks the ball (keeper.js sets gkFace) he keeps facing it at any speed - side-steps and drops back
    // facing it - instead of turning his back on it above a jog (Luca's Bug Watch note, 24 Oct)
    const kw = this.keeper && !this.busy() && b.owner !== this && !human && (this.speed < 3 || this.gkFace) && len(b.x - this.x, b.y - this.y) > 0.3;
    let wv = kw ? [b.x - this.x, b.y - this.y] : null;                            // keepers watch the ball (unless rushing out)
    // v0.8.2 jockey: containing the dribbler he stays side-on and facing him while he backs off or slides across (a real
    // back-pedal tops out around 6 m/s). Running AT him to close down is a normal run; faster than that he turns and runs.
    this.jockeyOn = false;
    if (this.watch && !this.watch.sentOff && !this.busy() && MAN.kits[this.kit].anims['jockey-S']) {
      const wx = this.watch.x - this.x, wy = this.watch.y - this.y, wd = len(wx, wy) || 1, closing = (this.vx * wx + this.vy * wy) / wd;
      this.jockeyOn = this.speed < (this.wasJockey ? 6.2 : 5.8) && !(closing > 2.5 && closing > 0.6 * this.speed);
    }
    this.wasJockey = this.jockeyOn;
    if (this.jockeyOn) wv = [this.watch.x - this.x, this.watch.y - this.y];
    else if (!kw && this.speed > 0.8 && this.state !== 'kick' && this.state !== 'dive' && this.state !== 'slide' && this.state !== 'dheader' && this.state !== 'trap' && this.state !== 'celebrate') wv = [this.vx, this.vy];
    const want = wv ? dirIndex(wv[0], wv[1]) : null, fv = dirVec(this.face);
    const dev = wv ? Math.acos(clamp((wv[0] * fv.x + wv[1] * fv.y) / (len(wv[0], wv[1]) || 1), -1, 1)) : 0;   // how far off the way he faces now
    if (want != null && want !== this.face && !human && dev < 0.6) this.faceCand = null;    // just over the edge of the next direction: keep this one
    else if (want != null && want !== this.face) {
      const turn = Math.min(Math.abs(want - this.face), 8 - Math.abs(want - this.face));   // 1 = the next direction round
      if (human || (this.speed > 3.2 && turn >= 2)) { this.face = want; this.faceCand = null; }   // a real turn at speed: at once
      else { if (want === this.faceCand) this.faceWait += dt; else { this.faceCand = want; this.faceWait = 0; }
        if (this.faceWait >= (this.speed > 3.2 ? 0.1 : 0.12)) { this.face = want; this.faceCand = null; } }
    } else this.faceCand = null;
  }
}

class Team {
  constructor(name, side, kit, gk) { this.name = name; this.side = side; this.kit = kit; this.gk = gk; this.players = []; this.score = 0; }
  get goalX() { return this.side > 0 ? PITCH_L : 0; }       // the goal this team attacks
  get ownGoalX() { return this.side > 0 ? 0 : PITCH_L; }
}
