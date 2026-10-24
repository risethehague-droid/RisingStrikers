// ---------------------------------------------------------------- Match methods: resume
// v0.10.2 RESUME (Luca, 24 Oct: "make it so i can resume a game that was last played in the menu"). QUIT TO MENU
// reloads the page and a closed tab loses everything, so a normal match against the computer keeps a small snapshot
// in this browser (localStorage 'hc2-resume'): the score, the clock and the half, the settings of that match, every
// player's shirt / legs / cards, the subs used, the special meters and the stats. The start screen shows
// RESUME when there is one (index.html reads it itself, so the button is there before the game has loaded).
// Saved every few seconds of play, on QUIT TO MENU and when the page is hidden; cleared at full time and when it
// goes to penalties. Play picks up with a kick-off for the side that had the ball (the exact positions, replays and
// highlights aren't kept). Not for the cup, watch mode, the penalty battle, the demo or the Test Lab.
// Saving only reads the match: no random numbers, nothing changed, so seeded matches play exactly as before.
const RESUME_KEY = 'hc2-resume', RESUME_FMT = 1, RESUME_EVERY = 5;               // (seconds of play between saves)
function resumeLoad() {
  try { const S = JSON.parse(localStorage.getItem(RESUME_KEY) || 'null'); if (S && S.fmt === RESUME_FMT && TEAMS[S.h] && TEAMS[S.a] && S.t && S.t.h && S.t.a) return S; } catch (e) {}
  return null;
}

hc2Mix(Match, {
  // a match worth keeping: one you're playing, kicked off, not a break / walk-out / foul scene / goal in progress
  resumeOk() {
    return !!(window.HC2_STARTED && this.home && this.away && this.ball && !this.demo && !this.watch && !this.inCup() && !window.__lab && !window.HC2_TEST_FAST
      && !this.over && !this.matchPens && !this.so && !this.penaltyMode && !this.pre && !this.setup && !this.intro && !this.toss && !this.ht
      && !this.replay && !this.cupScreen && !this.ceremony && !this.foulScene && !this.goalQ && !this.ball.inNet && this.clock > 0);
  },
  resumeSnap() {
    const side = T => {
      const Q = this.squads && this.squads[T.name], mt = this.meterOf(T);     // (read only: squadOf would make one)
      return { score: T.score, xi: T.players.map(p => ({ ...this.ident(p), off: !!p.sentOff })), subs: Q ? Q.subs : 0,
        bench: Q ? Q.bench.map(d => ({ ...d })) : null, sp: mt.e || 0, risen: !!mt.risen };
    };
    const b = this.ball, had = b.owner && b.owner.team ? b.owner.team : b.last, hs = t => t === this.away ? 'a' : t === this.home ? 'h' : null;
    return { fmt: RESUME_FMT, ver: GAME_VER, at: Date.now(), h: this.home.name, a: this.away.name, half: this.half, clock: this.clock,
      lost: this.lost || 0, golden: !!this.golden, first: hs(this.firstKick), etFirst: hs(this.etFirst), ball: hs(had) || 'h',
      mset: this.mset || null, diff: DIFF_LEVEL, ai: AI_MODE, stats: this.mstats || {}, lineup: (this.lineup && this.lineup[this.home.name]) || null,
      t: { h: side(this.home), a: side(this.away) } };
  },
  resumeSave() {
    if (!this.resumeOk()) return false;
    try { localStorage.setItem(RESUME_KEY, JSON.stringify(this.resumeSnap())); this.resumeT = 0; return true; } catch (e) { return false; }
  },
  resumeClear() { try { localStorage.removeItem(RESUME_KEY); } catch (e) {} },
  resumeEnd() {                                                                  // (fullTime / toPens) your match is over: nothing to resume
    if (!window.HC2_STARTED || this.demo || this.watch || this.inCup() || window.__lab || window.HC2_TEST_FAST) return;   // (the demo behind the menu must not wipe it)
    this.resumeClear();
  },
  resumeTick(dt) {                                                               // (match.js update, every frame)
    if (!this.resumeOk()) return;
    this.resumeT = (this.resumeT || 0) + dt;
    if (this.resumeT >= RESUME_EVERY) this.resumeSave();
  },
  // index.html: setTeams(S.h, S.a, () => { go(); resumeMatch(S) }) - the same match, back where it was
  resumeMatch(S) {
    try {
      if (S.mset) { this.mset = { ...this.loadRules(), ...S.mset }; this.applyRules(); }                       // that match's arena, light, weather, ending
      if (S.diff && typeof setDiff === 'function') setDiff(S.diff);
      if (S.ai && typeof setAiMode === 'function') setAiMode(S.ai);
      if (S.lineup) { this.lineup = this.lineup || {}; this.lineup[this.home.name] = S.lineup; }                // (AGAIN keeps your team sheet)
      for (const [k, T] of [['h', this.home], ['a', this.away]]) {
        const D = S.t[k]; T.score = D.score | 0;
        const Q = this.squadOf(T); Q.subs = D.subs | 0; if (Array.isArray(D.bench)) Q.bench = D.bench.map(d => ({ ...d }));
        (D.xi || []).forEach((d, i) => { const p = T.players[i]; if (!p || !d) return; this.setIdent(p, d); if (d.off) this.sendOff(p); });
        const mt = this.meterOf(T); if (this.meters) { mt.e = mt.shown = clamp(+D.sp || 0, 0, 3); mt.risen = !!D.risen; }
      }
      this.mstats = S.stats || {};
      const tm = c => c === 'a' ? this.away : c === 'h' ? this.home : null;
      this.half = clamp(S.half | 0, 1, 4); this.clock = +S.clock || 0; this.golden = !!S.golden; this.firstKick = tm(S.first); this.etFirst = tm(S.etFirst);
      this.resetHalfTime(); this.lost = +S.lost || 0;
      this.kickoff(tm(S.ball) || this.home);
      if (this.clock >= (HALF_END[this.half - 1] || 90) * 60) this.announceAdded();   // (the same added time: it comes from the time lost + the score)
      const m = Math.floor(this.clock / 60) + 1, end = HALF_END[this.half - 1] || 90;
      this.say('RESUMED', `${this.home.name} ${this.home.score} - ${this.away.score} ${this.away.name} · ${m > end ? end + '+' + (m - end) : m}'`, 2); this.freeze = 1.6;
      this.ramiHello = true; this.ramiSay('banter', { text: 'AND WE ARE BACK!\nWHERE WERE WE...', expr: 'talk' }, 2.5);
      this.resumeT = 0; CRUMB('resumed a match');
    } catch (e) {                                                                // a snapshot that doesn't fit any more: a fresh match instead
      this.resumeClear(); console.warn('resume failed', e); this.setTeams(this.home.name, this.away.name, () => this.preMatch());
    }
  },
});

// a closed tab or a reload: keep the moment you left (the 5-second saves cover the rest)
window.addEventListener('pagehide', () => { const m = window.__hc2; if (m && m.resumeSave) m.resumeSave(); });
document.addEventListener('visibilitychange', () => { const m = window.__hc2; if (document.hidden && m && m.resumeSave) m.resumeSave(); });
