'use strict';
// HC2 Football · watch.js: WATCH MODE - the computer plays both sides while you watch, pause, speed it up, mark moments
// and review them at full time
// (Luca 23 Oct 22:36: "set up a 1v1 computer game that simulates games, make one that's manual so i can pause etc plus
// manually comment on after for bug etc"). Built on two things the game already has: the DEMO (the computer plays
// itself) and BUG WATCH (the game checks its own footage, keeps clips, and the review marks them BUG / FINE / NOT SURE
// with a note). N keeps the moment as a clip of its own (the 4 s before + 1.5 s after); at full time the review opens
// with your marks and whatever Bug Watch caught. Marks, verdicts and notes go to the game's database like every Bug
// Watch clip, so Claude reads them back. Your side plays at NORMAL and theirs at the level you picked, as in a match.
const WATCH_SPEEDS = [0.5, 1, 2, 4];

hc2Mix(Match, {
  watchStart() {
    BW_ON = true;                                                                 // (on for watch mode: it's what it's for; your saved setting is untouched)
    window.HC2_WATCH = true;
    window.__diffTeams = { home: Object.assign({}, DIFF_TRAITS.base, { lvl: 'base' }),
      away: Object.assign({}, DIFF_TRAITS[DIFF_LEVEL] || DIFF_TRAITS.normal, { lvl: DIFF_LEVEL }) };
    this.watch = { speed: (this.watch && this.watch.speed) || 1, marks: 0, ftT: 0, reviewed: false };
    this.demo = true; this.kickoff(this.home); this.watchHud(true);
    this.say('WATCH MODE', `${this.home.name} v ${this.away.name} · N: MARK A MOMENT · 1-4: SPEED · ENTER: PAUSE`, 3.5);
    CRUMB('watch mode');
  },
  watchSteps() {                                                                  // sim steps per frame and their length: 0.5x = one half step, 4x = four steps
    const s = this.watch ? this.watch.speed : 1;
    return s < 1 ? { n: 1, k: s } : { n: Math.round(s), k: 1 };
  },
  watchInput() {
    const W = this.watch, t = Input.taps; if (!W) return;
    WATCH_SPEEDS.forEach((s, i) => { if (t.has('Digit' + (i + 1)) || t.has('Numpad' + (i + 1))) this.watchSpeed(s); });
    if (t.has('KeyN') && !this.over) this.watchMark();
  },
  watchSpeed(s) { const W = this.watch; if (!W || !WATCH_SPEEDS.includes(s)) return; W.speed = s; SFX.click(); this.watchHud(true); },
  watchMark(note) {
    const W = this.watch, bw = this.bw; if (!W || !bw) return false;
    delete bw.seen.MANUAL; const n0 = bw.list.length, b = this.ball, near = bw.nearest(b);
    const when = `${this.halfLabel()} ${String(Math.floor(this.clock / 60)).padStart(2, '0')}'`;
    bw.flag('MANUAL', note || `you marked ${when} · ${this.home.name} ${this.home.score}-${this.away.score} ${this.away.name}`, { p: b.owner || (near && near.p) });
    const ok = bw.list.length > n0;
    if (ok) { W.marks++; this.say('', `MARKED · ${W.marks} MARK${W.marks > 1 ? 'S' : ''} · ADD YOUR NOTE AT FULL TIME`, 1.6); SFX.click(); }
    else this.say('', `BUG WATCH IS FULL FOR THIS MATCH (${BW_MAX} CLIPS)`, 1.6);
    this.watchHud(true); return ok;
  },
  watchTick(dt) {
    const W = this.watch; if (!W) return;
    if (this.over && !W.reviewed && !this.bwUI && !this.replay) {                // full time: open the review by itself
      W.ftT += dt;
      if (W.ftT > 2.5) { W.reviewed = true; if (this.bw && this.bw.list.some(x => !x.old && !x.review)) this.bwOpen('ft'); }
    }
    this.watchHud();
  },
  watchHud(force) {
    const W = this.watch; if (!W || !this.hud) return;
    if (!this.watchTxt || !this.watchTxt.scene) {
      this.watchTxt = this.add.text(VIEW_W / 2, VIEW_H - 12, '', { fontFamily: '"Press Start 2P"', fontSize: '8px', color: '#f4f0e4', backgroundColor: '#0c0a0e', padding: { x: 7, y: 5 } })
        .setOrigin(0.5, 1).setScrollFactor(0);
      this.hud.add(this.watchTxt);
    }
    const caught = this.bw ? this.bw.list.filter(x => !x.old && x.code !== 'MANUAL').length : 0;
    const s = this.over ? `WATCH · FULL TIME · ${W.marks} MARK${W.marks === 1 ? '' : 'S'} · ${caught} CAUGHT · B: REVIEW · ENTER: WATCH ANOTHER`
      : `WATCH · ${W.speed}x · ${W.marks} MARK${W.marks === 1 ? '' : 'S'} · ${caught} CAUGHT · N: MARK · 1-4: SPEED · ENTER: PAUSE`;
    if (force || this.watchTxt.text !== s) this.watchTxt.setText(s);
    this.watchTxt.setVisible(!this.replay && !this.bwUI && !this.paused);
  },
  watchItems() {                                                                  // extra pause-menu rows in watch mode
    const W = this.watch; if (!W) return [];
    const i = WATCH_SPEEDS.indexOf(W.speed);
    return [{ k: 'wspeed', l: `SPEED: ${W.speed}x`, key: '1-4', act: () => this.watchSpeed(WATCH_SPEEDS[(i + 1) % WATCH_SPEEDS.length]) },
      { k: 'wmark', l: `MARK THIS MOMENT (${W.marks} SO FAR)`, key: 'N', act: () => this.watchMark() }];
  },
});
