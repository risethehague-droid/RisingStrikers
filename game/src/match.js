'use strict';
// HC2 Football · match.js: the Match scene: create, update, sim loop, building the teams (its other methods live in the area files)
// (split out of game.js in v0.9.5 - load order and lanes: src/README.md)

// ------------------------------------------------------------------ the match
class Match extends Phaser.Scene {
  constructor() { super('match'); }
  create() {
    Input.init();
    this.hSide = 'home'; this.inp = Input; this.hOther = null;                  // t-043: one human, on the keyboard / pad (actions.js twoHumans)
    this.cameras.main.setBounds(0, 0, MAN.worldW, MAN.worldH).setRoundPixels(true);
    this.stadium = new Stadium(this);
    this.buildTeams('IS', 'IRO');
    this.ball = { x: 52.5, y: 34, z: 0, vx: 0, vy: 0, vz: 0, owner: null, last: null, roll: 0, inNet: false, skid: false, rollV: 0, target: null };
    this.path = null; this.hitStop = 0; this.passRing = null; this.aimY = 0; this.ballFrame = 0;
    this.ballSpr = this.add.image(0, 0, 'props', 'ball-x0').setOrigin(0.5);
    this.ballSh = this.add.image(0, 0, 'props', 'ball-shadow').setOrigin(0.5);
    this.buildGoals();
    this.buildHud(); this.buildRami();
    this.ref = MAN.kits.REF && this.textures.exists('REF') ? new Referee(this) : null;      // v0.7.1 PixelLab referee
    this.human = this.home.players[9]; this.charge = -1; this.freeze = 0; this.pending = null;
    this.clock = 0; this.half = 1; this.over = false; this.paused = false; this.msgT = 0;
    this.kickoff(this.home);
    if (/(^|#|&)2p\b/.test(location.hash)) this.twoHumans(keyPad());          // t-043: #2p = two humans on one keyboard (io.js keyPad)
    this.cameras.main.centerOn(wx(52.5, 34), wy(34) - 60);
    this.stadium.update(0, true);
    window.__hc2 = this;                                   // for automated play-tests
    this.bw = new BugWatch(this);                          // v0.8.7 BUG WATCH
    this.scale.on('resize', () => this.layoutHud());
  }

  // teams + players (again when you pick other teams on the start screen)
  buildTeams(h, a, altAway) {
    if (this.all) for (const p of this.all) p.spr.destroy();
    const A = TEAMS[a], awayKit = altAway && ALT_KIT[a] && MAN.kits[ALT_KIT[a]] ? ALT_KIT[a] : A.kit;
    this.home = new Team(h, 1, TEAMS[h].kit, TEAMS[h].gk);
    this.away = new Team(a, -1, awayKit, A.gk);
    this.home.opp = this.away; this.away.opp = this.home;
    this.home.formation = formationFor(this.home, this.hSide !== 'away'); this.away.formation = formationFor(this.away, this.hSide === 'away');   // role-ai step 4: each side's shape (roles.js SHAPES)
    for (const t of [this.home, this.away]) t.cfKinds = teamCfKinds(t);   // role-ai step 6: each team's own card (roles.js TEAM_SHAPE)
    for (const t of [this.home, this.away]) for (let i = 0; i < 11; i++) t.players.push(new Player(this, t, i, i === 0 ? t.gk : t.kit));
    this.all = [...this.home.players, ...this.away.players];
    this.human = this.home.players[9];
    if (this.hOther) Object.assign(this.hOther, { human: this.away.players[9], nextHuman: null, charge: -1, lobCharge: -1, lobAim: null, headBuf: 0, airCh: null });   // (t-043: the away human too)
  }
  // start screen: load the two teams' kits if they aren't loaded yet, then a fresh match
  setTeams(h, a, done) {
    const clash = (h === 'IRO' && a === 'USCS') || (h === 'USCS' && a === 'IRO') || (h === 'LUC' && a === 'AUC') || (h === 'AUC' && a === 'LUC');
    const kits = [TEAMS[h].kit, TEAMS[h].gk, TEAMS[a].kit, TEAMS[a].gk].concat(clash && ALT_KIT[a] ? [ALT_KIT[a]] : []);
    const need = kits.filter(k => MAN.kits[k] && !this.textures.exists(k));
    const go = () => {
      if (this.replay) { this.replay.after = null; this.endReplay(); }
      this.epoch = (this.epoch || 0) + 1; this.time.removeAllEvents();          // v0.8.1: no goal replay / kickoff from the last match (or the demo) fires in this one
      this.foulScene = null; this.goalQ = null; if (this.ref) { this.ref.goTo = null; this.ref.t = 0; this.ref.state = 'idle'; this.ref.hidden = false; } this.freeze = 0;
      this.mstats = {}; this.ht = null; this.intro = null; this.sheet = null; this.pre = false; this.camTarget = null; this.camFast = false; this.closeFlowEl(); this.resetHalfTime(); this.htAiSubs = ''; for (const q of this.all || []) q.hide = false;
      if (this.toss) { this.toss = null; this.tossUi(false); } this.setup = null; this.pm = null; this.msg.setVisible(true); this.sub.setVisible(true); this.firstKick = null; this.etFirst = null; this.golden = false; this.matchPens = false; this.cameras.main.setZoom(this.baseZoom()); this.fixUi(this.baseZoom()); this.lastReplayEnd = -1e9;   // v0.8.5
      if (this.bw) this.bw.reset(); if (this.bwUI) { this.bwUI = null; } this.demo = false; this.demoT = 0; this.highlights = []; this.lastReplay = null; this.rec = []; this.recAllReset(); this.evReplay = null; this.ramiHello = false; this.paused = false;   // (Luca 31 Oct: + the whole-match replay starts again)
      if (this.rami) { this.rami.line = null; this.rami.c.setVisible(false); }
      this.buildTeams(h, a, clash); this.applyLineup(this.home); this.home.score = this.away.score = 0; this.clock = 0; this.half = 1; this.over = false;   // (new Player objects: no injuries carried over)
      for (const mt of this.meters || []) mt.reset(); this.riseQ = null;
      this.resetMatchState(); this.setPiece = null; this.pending = null; this.diving = null; this.kickoff(this.home);   // (t-035: the rest a match owns)
      this.help.setText(this.helpText()).setVisible(!window.HC2_TOUCH); this.helpUntil = this.time.now + 10000;   // the keys you picked
      if (done) done();
    };
    if (!need.length) return go();
    for (const k of need) this.load.atlas(k, SRC(`sprites/${k}.webp`, k), `assets/sprites/${k}.json`);
    this.load.once('complete', go); this.load.start();
  }

  // ---------- update
  update(time, deltaMs) {
    const dt = Math.min(deltaMs / 1000, 1 / 30);
    this.resumeTick(dt);                                                         // v0.10.2: keeps a snapshot of your match for RESUME (resume.js)
    if (this.replay) { Input.poll(); this.stadium.update(dt); this.replayTick(dt); this.ramiTick(dt); for (const mt of this.meters || []) mt.draw(dt); return; }
    if (this.cupScreen) { Input.poll(); if (Input.pressed('start') || Input.pressed('pass')) this.cupPlay(); this.stadium.update(dt); return; }   // v0.7.2 cup table up
    if (this.ceremony) { Input.poll(); this.stadium.update(dt); this.render(dt); this.ceremonyTick(dt); this.ramiTick(dt);                 // v0.7.4 trophy ceremony on the pitch
      if ((Input.pressed('start') || Input.pressed('pass')) && this.ceremony.t > 1.2) this.endCeremony(); return; }
    if (this.so && this.so.done) { Input.poll(); if (Input.pressed('start')) { if (this.cup && this.cupLive) this.cupResult();
      else if (this.matchPens) { this.matchPens = false; this.so = null; this.scene.stop('penalty'); this.penaltyMode = false; this.over = false; this.setTeams(this.home.name, this.away.name, () => this.preMatch()); }   // v0.8.5: after a match: AGAIN
      else this.startShootout(this.so.cpu); } this.stadium.update(dt); this.ramiTick(dt); return; }   // shoot-out over
    if (this.penaltyMode) { this.stadium.update(dt); return; }               // the penalty scene has the screen (and the keys)
    Input.poll();
    if (this.hOther && this.hOther.inp.poll) this.hOther.inp.poll();             // t-043: the away human's source, after Input's (a keyPad reads its taps)
    if (this.flagUI || (Input.pressed('flag') && this.flagCan())) { this.flagTick(dt); return; }   // t-006 INSTA FLAG (F / pad BACK / the HUD's FLAG button): play waits while you write
    if (this.bwUI) { this.bwInput(); if (this.replay || !this.bwUI) return; this.stadium.update(dt); this.render(dt); this.ramiTick(dt); return; }   // v0.8.7 BUG WATCH review
    if (this.bw && !(this.watch && this.watch.speed > 1)) this.bw.frame(deltaMs);   // (watch mode sped up: long frames on purpose)
    if (this.pre) { if (this.setup) this.setupInput(); else if (this.sheet && (Input.pressed('start') || Input.pressed('pass'))) this.closeSheet(); this.stadium.update(dt); this.render(dt); this.ramiTick(dt); return; }   // v0.8.4 team sheet (v0.8.5: settings first)
    if (this.cutInQ && !this.cutIn && !(this.hitStop > 0) && !this.paused && !this.replay) { this.cutIn = this.cutInBuild(this.cutInQ); this.cutInQ = null; }
    if (this.cutIn) { this.anims.globalTimeScale = 0.0001; this.stadium.update(dt); this.cutInTick(dt); this.render(dt); this.ramiTick(dt); return; }   // v0.8.9 special-save cut scene: play waits
    const flowBusy = !!(this.ht || this.intro || this.toss);                    // (the key that ends half time must not pause the game too)
    if (this.ht) this.htInput();
    if (this.paused && !this.over) { this.pauseInput(); if (this.replay) return; }   // v0.8.5 PAUSE MENU
    else if (Input.pressed('start') && !flowBusy) {
      if (this.over && this.cup && this.cupLive) { if (!this.cupPens) this.cupResult(); return; }        // v0.7.2: back to the cup table (a level final waits for its penalties)
      if (this.over) { if (!this.matchPens) this.setTeams(this.home.name, this.away.name, () => (this.watch ? this.watchStart() : this.preMatch())); return; }   // (watch mode: watch another)   // v0.8.2: AGAIN = same teams, fresh match - v0.8.4: team sheet + walk-out
      if (window.HC2_STARTED && (!this.demo || this.watch)) this.openPause();   // (watch mode pauses too)
    }
    if (this.over && !this.paused && this.bw && this.bw.list.length && Input.taps.has('KeyB') && !(this.so && !this.so.done)) { this.bwOpen('ft'); return; }   // v0.8.7: B at full time = BUG WATCH
    if (this.over && !this.paused && (this.recAll || []).length >= 60 && Input.taps.has('KeyR') && !(this.so && !this.so.done)) {   // Luca 31 Oct: R at full time = the WHOLE MATCH replay
      this.msg.setText(''); this.sub.setText(''); this.startReplay('REPLAY', () => this.say('FULL TIME', this.ftLine(), 99999), this.recAll.map(f => Object.assign({}, f)), { caption: 'REPLAY \u00b7 THE WHOLE MATCH', ctl: true, full: true }); return;
    }
    if (this.over && this.highlights && this.highlights.length && Input.pressed('pass')) {
      this.msg.setText(''); this.sub.setText(''); this.playHighlights(() => this.say('FULL TIME', this.ftLine(), 99999)); return;
    }
    if (this.goalQ) { this.goalQTick(); if (this.replay) return; }
    this.stadium.update(dt);
    if (!window.HC2_STARTED) {                                                 // DEMO: idle on the start screen = the computer plays itself
      this.demoT = (this.demoT || 0) + dt;
      if (!this.demo && this.demoT > 8 && !window.__lab && !window.HC2_NO_DEMO && !window.HC2_SAFE && this.home) { this.demo = true; this.kickoff(this.home); CRUMB('demo behind the menu'); }
      if (!this.demo) { this.render(dt); return; }
    }
    if (this.saveAsk && !this.paused) {                                          // v0.8.6 SPECIAL SAVE prompt (read here: sim pauses for the hit-stop)
      const A = this.saveAsk; A.t -= dt;
      if (this.inpOf(A.team).pressed('special')) { const gk = A.team.players[0]; gk.spSave = this.meterOf(A.team).spend(); this.saveFx(gk); this.saveAsk = null; }   // (t-043: his side's human presses it)
      else if (A.t <= 0 || (A.normal ? !this.ball.saveable || this.ball.owner || this.ball.inNet : !this.ball.special)) this.saveAsk = null;   // (v0.9.0: a normal shot too)
    }
    if (!this.paused && !this.over) {                                            // v0.8.7 BUG WATCH checks every step (v0.9.2: chip slow motion)
      const W = this.watch ? this.watchSteps() : { n: 1, k: 1 };                  // (watch mode: 0.5x-4x = shorter or more steps a frame)
      for (let i = 0; i < W.n && (i === 0 || (!this.over && !this.replay)); i++) {   // (one step a frame as before; extra steps only in watch mode)
        const d = dt * W.k, sl = this.slowMo > 0; if (sl) this.slowMo -= d; this.sim(sl ? d * 0.4 : d); if (this.bw) this.bw.tick(d); }
    }
    if (this.watch) { if (!this.paused && !this.bwUI && !this.replay) this.watchInput(); this.watchTick(dt); }   // watch mode: speed keys, N = mark, the review at full time
    if (this.demo && !this.watch && this.over && (this.demoOver = (this.demoOver || 0) + dt) > 7) {   // the demo just starts again (watch mode waits for you)
      this.demoOver = 0; this.over = false; this.home.score = this.away.score = 0; this.clock = 0; this.half = 1; this.highlights = []; this.recAllReset(); this.resetHalfTime(); this.mstats = {};
      for (const mt of this.meters || []) mt.reset();
      for (const p of this.all) if (!p.sentOff) p.setState('idle', 0); this.kickoff(this.home);
    }
    this.render(dt);
    this.ramiTick(dt);
    this.crumbT = (this.crumbT || 0) - dt;
    if (this.crumbT <= 0) { this.crumbT = 10; CRUMB(window.HC2_STARTED ? `match ${this.clockTxt ? this.clockTxt.text : ''}` : this.demo ? 'demo behind the menu' : 'start screen'); }
    if (window.HC2_STARTED && !this.ramiHello) { this.ramiHello = true; this.ramiSay('kickoff'); }
    if (this.rami && !this.paused && !this.over && this.rami.quiet > 70 && !this.rami.line) this.ramiSay('banter', {}, 0);
    if (!this.paused) { this.record(dt); this.eventReplayTick(); }
    if (time > this.helpUntil && this.help.visible) this.help.setVisible(false);
  }

  sim(dt) {
    const b = this.ball;
    if (this.demo) this.human = this.ghost || (this.ghost = { x: -99, y: -99, team: this.home, keeper: false, stamina: 1, tired: false, state: 'idle', busy: () => false });   // demo: nobody on the pitch waits for your keys
    if (this.hitStop > 0) { this.hitStop -= dt; this.anims.globalTimeScale = this.hitStop > 0 ? 0.0001 : 1; return; }
    { const ts = (this.slowMo > 0 ? 0.4 : 1) * (this.watch ? this.watch.speed : 1); if (this.anims.globalTimeScale !== ts) this.anims.globalTimeScale = ts; }   // (watch mode: animations at its speed)   // (v0.9.2: slow motion as a chip goes over the keeper)
    if (b.chip && !b.chipSlow && (!window.__diffTeams || this.watch) && !window.HC2_TEST_FAST) { const k = (b.last && b.last.opp || this.away).players[0];
      if (k && !k.sentOff && b.z > 1.8 && Math.abs(b.x - k.x) < 1.2 && len(b.x - k.x, b.y - k.y) < 4) { b.chipSlow = true; this.slowMo = 0.55; } }
    if (this.passRing) { this.passRing.t -= dt; if (this.passRing.t <= 0) this.passRing = null; }
    if (this.intro) { this.introTick(dt); return; }                             // v0.8.4 walk-out
    if (this.ht) { this.htTick(dt); return; }                                   // v0.8.4 half-time break
    if (this.toss) { this.tossTick(dt); return; }                               // v0.8.5 coin toss
    if (this.pre) return;                                                       // team sheet up
    if (this.ref) this.ref.step(dt);
    if (this.freeze > 0) { this.freeze -= dt; for (const p of this.all) { if (!this.settle(p, dt)) p.steer(0, 0, dt); p.step(dt); } if (b.inNet) this.ballPhysics(dt); else this.placeAtFeet(); return; }
    if (this.foulScene) { this.foulSceneTick(dt); return; }                     // v0.8: the foul plays out, the clock stops
    // clock
    this.clock += dt * (45 * 60 / HALF_REAL_SECONDS);
    if (b.owner && b.owner.team) this.stat(b.owner.team).poss += dt;
    { // v0.8.4 ADDED TIME: shown at 45:00 / 90:00 from the time lost; when it's up the half ends at a calm moment
      const endAt = (HALF_END[this.half - 1] || 90) * 60;
      if (this.clock >= endAt && this.added == null) this.announceAdded();
      if (this.added != null && this.clock >= endAt + this.added * 60) { this.timeUp = this.timeUp || { t: 0 }; this.timeUp.t += dt; if (this.canBlow()) { this.blowHalf(); return; } }
    }

    if (this.setPiece) {                                                        // set piece: aim first, then normal play once the ball is off
      if (this.setPiece.kicked && !this.pending && b.owner !== this.setPiece.taker) this.setPiece = null;
      else if (this.setPieceTick(dt)) return;
    }
    this.path = b.owner ? null : this.predict();
    for (const p of this.all) { p.sprinting = false; p.wantDir = null; }      // controllers set these again every frame
    if (this.headBuf > 0) this.headBuf -= dt;
    if (this.hOther && this.hOther.headBuf > 0) this.hOther.headBuf -= dt;
    if (!this.demo) this.controlHumans(dt);                                     // (t-043: each human, home then away)
    this.ai(dt);
    for (const p of this.all) p.step(dt);
    if (this.aspStep) this.aspStep(dt);                                       // arcadesp.js (the co-designer's ARCADE specials): the special dribble's path
    this.separate();
    this.slides();
    this.headers();
    this.diveTick(dt);
    if (this.pending) {
      const k = this.pending, kp = k.p;
      if (b.owner === kp && !kp.hands && b.z < 0.5 && KICK_HIT[kp.kickAnim] != null) {     // v0.7: line the ball up with the striking boot
        const f = dirVec(kp.face), gx = b.x - (kp.x + f.x * 0.55), gy = b.y - (kp.y + f.y * 0.45), a = 1 - Math.exp(-dt * 16);
        kp.x += gx * a * 0.55; kp.y += gy * a * 0.55; b.x -= gx * a * 0.45; b.y -= gy * a * 0.45; b.vx *= 0.6; b.vy *= 0.6;
      }
      k.t -= dt; if (k.t <= 0) { this.releaseKick(k); this.pending = null; }
    }
    const airK = this.pending && this.pending.info.air && b.owner === this.pending.p ? this.pending.info.air : null;   // v0.8.9 aerial special: the ball hangs where he meets it
    if (b.owner && !airK) { const ow = b.owner; this.dribble(ow, dt); }
    for (const t of [this.home, this.away]) this.meterOf(t).add(SP_GAIN.regen * dt, 'regen');   // v0.8: the meter refills slowly by itself
    this.blockSteals(dt);
    const pbx = b.x;
    this.ballPhysics(dt);
    if (airK && b.owner) { b.x = airK.x; b.y = airK.y; b.z = airK.z; b.vx = b.vy = b.vz = 0; }
    this.pickups(pbx);
    if (b.save) { b.save.t -= dt; if (b.save.t <= 0) b.save = null; }
    b.airT = b.owner ? 0 : (b.airT || 0) + dt;
    if (this.dead) { this.dead.t -= dt; if (this.dead.kind === 'GOAL KICK' && !this.dead.wiped && this.dead.t <= 0.24) { this.dead.wiped = true; this.wipe(); }   // v0.10.4: the wipe covers the goal kick's cut
      if (this.dead.t <= 0) { const d = this.dead; this.dead = null; this.restart(d.kind, d.team, d.x, d.y); } }
    if (b.owner || b.z < 0.2) for (const t of [this.home, this.away]) t.players[0].claiming = false;
    this.rules();
  }
}
