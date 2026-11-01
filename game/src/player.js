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
// t-031: which frame of its move a sprite is showing (frame names end in -<n>), or null
function frameNo(spr) { const m = /-(\d+)$/.exec((spr.frame && spr.frame.name) || ''); return m ? +m[1] : null; }
function airContact(K, a, d) { const c = K.contact; return c ? c[`${a}-${K.anims[`${a}-${d}`] ? d : 'S'}`] : undefined; }
// t-033 THE DIVE'S ANGLE (Luca 25 Oct 17:52, PR #38's preview: "the dive animation is angled the wrong way"). PixelLab
// drew these dives side-on, a full-length flying dive lying flat across the frame (like ksmother still is). The kit build
// (tools/keeper_build.py dive_frames, batch 1 / 16 / 18) turned them a quarter so he'd fly along his goal line - which put
// his head at the bottom of the frame and his boots straight up: a handstand (GH1 since v0.12.0, older than t-031). Real
// keepers and FIFA / PES / Sensible Soccer: a dive across the goal is a sideways spring, body near-flat, hands and head
// leading, legs trailing low. So the game turns those frames back to how PixelLab drew them (the same quarter, exact) and
// keeps GK_LEAN of it, so the body tilts 20° in the dive's direction (head lower going towards the camera, higher going
// away). Sign: +1 = the build turned it clockwise (Down), -1 anticlockwise (Up); -W frames are mirrors, so the turn flips.
const GK_KNEEL = 10;                                                             // (kdivecatch: from this frame on he's on his knees with it)
const GK_SLIDE_OUT = 3;                                                          // (diveTurn: the picture slides back to where he is over his last 3 frames, the landing)
const GK_TURN = { kdivecatchDown: 1, kdivecatchUp: -1, kcollapseDown: 1, kcollapseUp: -1, diveDown: 1, diveUp: -1 }, GK_LEAN = 20;
function gkTurn(move) {                                                          // move 'kdivecatchDown-W' -> the sprite's rotation (rad)
  const mm = /^(\w+)-(E|W)$/.exec(move || ''), sg = mm && GK_TURN[mm[1]];
  return sg ? -sg * (mm[2] === 'W' ? -1 : 1) * (90 - GK_LEAN) * Math.PI / 180 : 0;
}
// t-036: a point of the frame he's drawn with right now (x, y in that frame's own window) on the screen, through the
// sprite's real origin, scale and turn and where it really stands - so after diveTurn has turned a dive flat and slid
// the picture, it's the turned + slid point. Shared by what's pinned to his gloves: t-031's ball (handPoint) and the
// special save's fist flash (specials.js rigEvent), which before read the unturned frame (rigPt off rigAt's P)
function sprPt(s, pt) {
  const f = s.frame, lx = (pt[0] - f.realWidth * s.originX) * s.scaleX, ly = (pt[1] - f.realHeight * s.originY) * s.scaleY, c = Math.cos(s.rotation), sn = Math.sin(s.rotation);
  return { x: s.x + lx * c - ly * sn, y: s.y + lx * sn + ly * c };
}
// t-036: his gloves as drawn on this frame - the measured glove point (GK_HANDS) where the move has one, so the flash
// sits on them as he flies and lands like the ball does (FIFA / PES pin an impact effect to the hand bone); a frame
// without one (kblock, ktip): the rig's contact point (fist, an E-frame point, mirrored for W) on the drawn frame
function rigGlovePt(s, fist, W) {
  const f = s.frame; if (!f) return null;
  const mm = /^(.*)-(\d+)$/.exec(f.name || ''), T = mm && GK_HANDS[mm[1]], h = T && T[+mm[2]];
  return sprPt(s, h || [W ? f.realWidth - fist[0] : fist[0], fist[1]]);
}
class Player {
  constructor(m, team, i, kit) {
    this.m = m; this.team = team; this.i = i; this.role = roleFor(team, i); this.kit = kit; this.keeper = i === 0;   // (role-AI step 1: his role card, roles.js)
    const h = shapeOf(team).spot[i]; this.home = team.side > 0 ? { x: h[0], y: h[1] } : { x: PITCH_L - h[0], y: h[1] };
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
    this.bob = 0;                                                                // (t-031: carryPlay sets it while he walks with the ball)
    if (this.keeper && this.m.gkAuraGlow) this.m.gkAuraGlow(this);              // gk-cover: the glow in his save's colour while it's on
    if (this.keeper && this.spSave && !this.sentOff && (this.m.ball.special || this.m.ball.saveable)) this.m.auraFx(this);   // v0.8.9 his special save is ready: he burns in its colour
    if (this.rig && !this.sentOff) { const P = this.m.rigAt(this, this.rig.n, this.rig.t, this.rig.d, this.rig); if (P) { this.rigShow(P); return; } this.rig = null; }
    if (this._turned) { this._turned = false; this.spr.setRotation(0); }         // (t-033: a dive turned flat is turned again each frame it shows)
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
    else if (this.state === 'dive') { this.play(this.diveAnim, /^ksmother/.test(this.diveAnim || '') ? 20 : /^kcollapse/.test(this.diveAnim || '') ? 12 : 16, true);   // (t-017: the smother's hands land on frame 6 at ~0.3 s; the 4-frame collapse a little slower)
      if (this.hands && !this.handJump) { this.handJump = true; const c = GK_HAND_HIT[(this.diveAnim || '').replace(/-\w+$/, '')], i = frameNo(this.spr);   // t-031: caught before his gloves were out: on to the frame where they meet it
        if (c != null && i != null && i < c && MAN.kits[this.kit].anims[this.diveAnim].length > c) this.spr.play({ key: this.anim, startFrame: c }); }
      this.diveTurn(this.diveAnim); }
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
    else if (this.state === 'getup' && this.getupAnim && ((this._from = this.getupFrom || 0), this.play(this.getupAnim, 18, true))) { this._from = 0; }   // t-017: the keeper back up off the grass after a dive (batch 18 kgetup)
    else if (this.state === 'aerial' && this.aerPose && this.posePlay(K, d, this.aerPose)) { }   // t-034: up for the aerial battle, held on the contact
    else if (ONCE[this.state]) { const ap = (this.state === 'header' || this.state === 'dheader') && airPick(K, this.state, d, this.airHit);   // (t-022: the header / dive from AIR_PICKS)
      const [nm, fps] = ap ? [ap.a, ap.fps] : this.state === 'celebrate' && this.celeAnim ? [this.celeAnim, 10] : ONCE[this.state];
      if (ap && this.state === 'header') this._from = airContact(K, nm, d) || 0;   // batch 20: the ball leaves his head the moment the header starts, so the move opens on the frame that meets it (the snap shows with the thump, flash and hit-stop; the take-off frames before it are skipped)
      if (!this.play(`${nm}-${d}`, fps, true) && !this.play(`${nm}-S`, fps, true)) this.play(`idle-${d}`, 5); }
    else if (this.state === 'sdribble') { if (!this.play(`sdribble-${d}`, 14, true)) this.play(`sprint-${d}`, 16); }   // arcadesp.js: PixelLab batch 22 (the spin, then the burst)
    else if (this.waitingThrowIn()) { if (!this.play(`throwinhold-${this.y < 34 ? 'S' : 'N'}`, 1, true)) this.play(`idle-${d}`, 5); }   // ball held over his head
    else if (this.keeper && this.hands && this.speed < 0.5) { if (this.handDive) this._from = Math.max(0, (K.anims[`catch-${d}`] || [0]).length - 1);   // t-031: up from a diving catch: straight into the hold (not catching it again)
      if (!(this.claimHigh && !this.handDive && this.play(`claim-${d}`, 16, true)) && !this.play(`catch-${d}`, 16, true)) this.play(`idle-${d}`, 5); this._from = 0; }   // holds it as he caught it
    else if (this.keeper && this.hands && this.m.ball.owner === this && !this.busy()) this.carryPlay(K, d);   // t-031: on the move with it in his hands
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
      if (!this.m.isHuman(this) && !this.m.replay) {                             // (your own player turns the moment you steer)
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
    if (this.bob) this.spr.y -= this.bob;                                         // (t-031: the carry's walk bob)
    this.handBall();
  }
  // t-031 KEEPER HANDS: with the ball in his hands he walks / jogs with it - PixelLab batch 21's kcarry (walk) and
  // kcarryrun (jog) by name; a kit without them yet: the catch's hold pose (its last frame, the ball at his chest) with
  // a gentle bob in step with his walk, so it already reads as carrying it (FIFA / PES: a dedicated carry run)
  carryPlay(K, d) {
    const run = this.speed > WALK_V * 1.15, n = run && K.anims[`kcarryrun-${d}`] ? 'kcarryrun' : K.anims[`kcarry-${d}`] ? 'kcarry' : null;
    if (n) { this.play(`${n}-${d}`, n === 'kcarry' ? 8 : 11); this.spr.anims.timeScale = clamp(this.speed / (n === 'kcarry' ? 1.5 : 3.2), 0.5, 1.8); return; }
    const L = K.anims[`catch-${d}`];
    if (L && L.length) { if (this.anim !== `${this.kit}:catch-${d}`) this._from = L.length - 1; this.play(`catch-${d}`, 16, true); this._from = 0; }
    else this.play(`idle-${d}`, 5);
    this.bobPh = (this.bobPh || 0) + this.speed * (1 / 60) * Math.PI / 0.55;       // (a step every ~0.55 m)
    this.bob = Math.round(Math.abs(Math.sin(this.bobPh)) * (run ? 3 : 2));
  }
  // t-031: the ball he holds goes where his gloves are on this frame (keeper.js GK_HANDS; the hold point otherwise), from
  // the first frame they're on it through the dive, the landing and the get-up. Just caught: it eases in from where it
  // was over 0.1 s (soft hands), no snap. A move that draws the ball itself (catch, claim, throw: K.carry) needs none
  handBall() {
    if (!this.keeper) return;
    if (!this.hands || this.m.ball.owner !== this) { this.handDive = false; this.bob = 0; this.handLast = null; return; }
    if (this.state === 'dive' || this.state === 'getup') this.handDive = true;
    else if (this.state !== 'idle' && this.state !== 'run') this.handDive = false;
    if (this.carrying || this.spr.visible === false) { this.handLast = null; return; }
    const G = this.handPoint(); if (!G) return;
    // a new move whose frames put his hands somewhere else (the dive's landing frame -> the get-up, drawn from another
    // origin): the ball goes across over 0.12 s from where it was, so it never jumps
    const rel = { x: G.x - this.spr.x, y: G.y - this.spr.y }, mv = G.move;
    if (this.handLast && mv !== this.handMv && len(rel.x - this.handLast.x, rel.y - this.handLast.y) > 10 && !(this.handEase > 0))
      { this.handFrom = { x: this.spr.x + this.handLast.dx, y: this.spr.y + this.handLast.dy }; this.handEase = this.handEase0 = 0.12; this.handOff = null; }
    if (this.handEase > 0 && this.handFrom) {
      if (!this.handOff) this.handOff = { x: this.handFrom.x - G.x, y: this.handFrom.y - G.y };
      const k = this.handEase / (this.handEase0 || 0.1); G.x += this.handOff.x * k; G.y += this.handOff.y * k;
    }
    this.handEasing = this.handEase > 0;                                         // (the Test Lab's GH lines tell the ease apart)
    this.handMv = mv; this.handLast = { x: rel.x, y: rel.y, dx: G.x - this.spr.x, dy: G.y - this.spr.y };
    this.m.gkHandBall(this, G.x, G.y, G.behind);
  }
  handPoint() {
    const s = this.spr, f = s.frame; if (!f) return null;
    const mm = /^(.*)-(\d+)$/.exec(f.name || ''), T = mm && GK_HANDS[mm[1]];
    let pt = T && T[+mm[2]], behind = false;
    if (!pt) {                                                                   // anything else (a carry move, idle): at his chest, by the way he faces
      const d = DIRS[this.face], H = GK_HOLD[d]; if (!H) return null;
      pt = [f.realWidth * s.originX + H[0] - 64, f.realHeight * s.originY + H[1] - 143]; behind = /N/.test(d);
    }
    const { x, y } = sprPt(s, pt), R = s.rotation ? Math.round : v => v;   // (t-033: a turned frame's gloves land between pixels: the ball goes on the nearest one, as it does for an upright frame)
    return { x: R(x), y: R(y), behind, move: mm ? mm[1] : '' };
  }
  // t-033: a dive frame the kit build turned a quarter is drawn as PixelLab drew it, near-flat (gkTurn). Turned about the
  // frame's centre, his gloves on the contact frame (GK_HAND_HIT) would land ~3 m from where the ball meets them, so the
  // picture is slid to keep them there: in from nothing on his set frame to all of it on the contact frame, held while
  // he can still catch it (the GH catches land on frames 6-7), and back out over the landing, so he leaves the dive (the
  // get-up, drawn on his feet) where he really is. Where the gloves meet the ball on screen and when are as before:
  // t-027 / t-028's reach and timing and t-031's ball in his gloves are untouched
  diveTurn(move) {
    const s = this.spr, rot = gkTurn(move), f = s.frame; if (!rot || !f) return false;
    const T = GK_HANDS[move], c = GK_HAND_HIT[move.replace(/-\w+$/, '')], pt = T && c != null && T[c], i = frameNo(s) || 0, L = (T || []).length;
    let k = 0;
    if (pt) k = i <= c ? (c ? i / c : 1) : clamp((L - 1 - i) / GK_SLIDE_OUT, 0, 1);
    if (k) { const hx = pt[0] - f.realWidth * s.originX, hy = pt[1] - f.realHeight * s.originY, C = Math.cos(rot), S = Math.sin(rot);
      s.setPosition(s.x + Math.round((hx - (hx * C - hy * S)) * k), s.y + Math.round((hy - (hx * S + hy * C)) * k)); }
    s.setRotation(rot); this._turned = true; return true;
  }
  // (the Test Lab's GH lines: how far his body is from lying flat on screen, ° - 90 = upright / a handstand)
  bodyTilt() { const r = Math.abs(this.spr.rotation) * 180 / Math.PI, mv = ((this.spr.frame && this.spr.frame.name) || '').replace(/-\d+$/, ''), sg = GK_TURN[mv.replace(/-\w+$/, '')];
    return sg ? Math.round(Math.abs(90 - r)) : null; }
  rigShow(P) {                                                                // v0.8.9 one frame of a rough rig
    const s = this.spr; s.setVisible(!this.hide); s.anims.stop(); s.setFrame(P.fr); this.anim = 'rig:' + this.rig.n;
    if (this._ox !== P.ox || this._oy !== P.oy) { s.setOrigin(P.ox, P.oy); this._ox = P.ox; this._oy = P.oy; }   // (t-014: batch 16 frames hang from the manifest's origin)
    s.setPosition(Math.round(P.x), Math.round(P.y)).setRotation(P.rot).setScale(P.sx, P.sy).setDepth(wy(this.y));
    this.diveTurn(P.fr.replace(/-\d+$/, ''));                                   // t-033: the special save's flying catch flat too (rigAt lined up his unturned gloves with the ball: diveTurn keeps them there)
    this._rigged = true; this.carrying = false; this.m.rigFx(this, P);
    this.handBall();                                                             // t-031: a special save he holds: the ball in his gloves too
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
  // t-034 THE AERIAL BATTLE's pose: both men play the header (or volley) the AIR_PICKS table gives a power strike at
  // that height, frame by frame up to its contact frame as they rise (P.f: 0 -> 1 over the battle's lead-in), then
  // held on it while they fight for the ball - so both contacts meet the ball together. Only picks frames by name.
  posePlay(K, d, P) {
    const r = airPick(K, P.kind, d, P.h); if (!r) return false;
    const nm = K.anims[`${r.a}-${d}`] ? `${r.a}-${d}` : `${r.a}-S`, fr = K.anims[nm]; if (!fr || !fr.length) return false;
    const c = airContact(K, r.a, d), i = clamp(Math.round(P.f * (c ?? Math.floor(fr.length / 2))), 0, fr.length - 1), key = `${this.kit}:${nm}`;
    if (this.anim !== key) { this.setOrg(nm); this.spr.anims.stop(); this.anim = key; }
    if (!this.spr.frame || this.spr.frame.name !== fr[i]) this.spr.setFrame(fr[i]);
    return true;
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
    if (this.handEase > 0) this.handEase = Math.max(0, this.handEase - dt);       // t-031: the catch's ease into his gloves
    this.cool = Math.max(0, this.cool - dt); this.stun = Math.max(0, this.stun - dt); if (this.touchAnimT > 0) this.touchAnimT -= dt;
    if (this.burst > 0) this.burst -= dt;
    if (this.keeper) { this.guardT = (this.guardT || 0) + dt; if (this.guardT > 2.5) this.guard = Math.min(1, (this.guard ?? 1) + GUARD_REGEN * dt); }   // v0.8 keeper guard refills
    if (this.trapRun && (((this.trapRun.t -= dt) <= 0 && (this.m.ball.z <= 0.05 || this.trapRun.t < RECV.runT - 0.8)) || this.m.ball.owner !== this)) this.trapRun = null;   // (lob receives: the trap's run ends with the ball at his feet)
    if (this.state !== 'idle' && this.state !== 'run') {
      this.stateT -= dt;
      if (this.stateT <= 0) {                                       // after a slide or a fall you get up first
        if (this.state === 'slide' || this.state === 'fall' || this.state === 'dheader' || this.state === 'blasted' || (this.state === 'kick' && this.bike)) { const won = this.state === 'slide' && this.slideWon; this.slideUp = this.state === 'slide'; this.bike = false; this.setState('getup', won ? TACKLE.upWon : this.slideUp ? TACKLE.upMiss : 0.45);
          if (won) this.cool = Math.min(this.cool, TACKLE.upWon);                 // t-018: won it - free once he's up (a miss keeps its cool-down)
          const b = this.m.ball; if (this.slideKeep && !b.owner && len(b.x - this.x, b.y - this.y) < 1.8 && b.z < 0.5) { this.cool = 0; this.m.gain(this, 0); }   // v0.8.2 the block tackle: yours
          this.slideKeep = false; }
        else if (this.keeper && this.state === 'dive' && /^(diveLow|dive|diveHigh|smother)$/.test(this.saveKind || '') && MAN.kits[this.kit].anims['kgetup-E']) {   // t-017: off the grass, not a pop-up (t-031: with the ball too - held at his chest as he gets up; it used to pop him up into the hold)
          // t-033: drawn flat again, PixelLab's flying catch ends with him already up on his knees, the ball gathered in
          // (frames 10-11): the get-up goes on from its crouch (frame 4), not back down onto his back first. Same 0.44 s
          this.getupFrom = /^kdivecatch/.test(this.diveAnim || '') && (frameNo(this.spr) || 0) >= GK_KNEEL ? 4 : 0;
          this.getupAnim = `kgetup-${this.team.side > 0 ? 'E' : 'W'}`; this.setState('getup', 0.44); }   // (8 frames at 18 a second)
        else { this.state = 'idle'; this.getupAnim = null; this.slideUp = false; }
      }
      if (this.state === 'dive') { const age = (this.diveLen || 0.85) - this.stateT, k = Math.exp(-dt * (age > (this.diveFly || 0.4) ? 16 : 0.4)); this.vx *= k; this.vy *= k; }
      else if (this.state === 'slide' || this.state === 'fall' || this.state === 'dheader' || this.state === 'blasted') { const k = Math.exp(-dt * (this.state === 'slide' ? TACKLE.slideK : 3.2)); this.vx *= k; this.vy *= k; }   // (t-018: the slide glides further)
      else if (!(this.state === 'trap' && this.trapRun)) this.steer(0, 0, dt);   // (lob receives: the chest trap doesn't stop him - he runs on through it)
    }
    if (this.stun > 0 && this.state !== 'slide') this.steer(0, 0, dt);
    // energy: sprinting drains it, everything else refills it (faster when walking or standing)
    if (this.sprinting && !this.tired && this.speed > RUN * 1.02) this.stamina -= SPRINT_DRAIN * (this.team.drain || 1) * dt;   // (v0.9.3: RISE WARRIOR's lungs)
    else this.stamina += (this.speed < 2.5 ? REST_GAIN : RUN_GAIN) * dt;
    this.stamina = clamp(this.stamina, 0, 1);
    if (this.stamina < 0.02) this.tired = true; else if (this.tired && this.stamina > 0.3) this.tired = false;
    this.x = clamp(this.x + this.vx * dt, -3, PITCH_L + 3); this.y = clamp(this.y + this.vy * dt, -3, PITCH_W + 3);
    if (this.keeper && this.spSave && this.m.gkCoverTick) this.m.gkCoverTick(this, dt);   // gk-cover: his special save on - the aura dash to a ball he can't reach (specials.js)
    this.speed = len(this.vx, this.vy);
    const b = this.m.ball, human = this.m.isHuman(this);                         // (t-043: either side's human)
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
