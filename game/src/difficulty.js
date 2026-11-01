'use strict';
// HC2 Football · difficulty.js: difficulty levels: trained traits, knobs, the edges v you (DIFF_YOU), dk / dkY
// (split out of game.js in v0.9.5 - load order and lanes: src/README.md)
// ======================================================================= v0.9.2 DIFFICULTY (Luca 23 Oct 15:06: "Add a difficulty modifier
// in the main menu (Easy-Normal-Hard-Rise Warrior). Make 4 separate models for difficulty and train them separately
// through self-learning and referencing other successful examples"). Like EA FC's levels, a level changes how the
// computer THINKS, never its players' legs or stats (v0.9.3: except
// Hard / Rise Warrior's lungs - they tire 10% / 25% slower): four traits (r reaction speed, a attacking intelligence, d defending
// + marking, k keeper), 1 = the AI as tuned up to v0.9.1. Each level's traits were trained on their own by self-play
// (tools/train092.js: headless matches v the NORMAL side, an optimiser nudging the traits until the level hits its
// target). Your own team-mates always play at base (= NORMAL); the level is the computer's side.
const DIFF_OPTS = [['easy', 'EASY'], ['normal', 'NORMAL'], ['hard', 'HARD'], ['rise', 'RISE WARRIOR']];
let DIFF_LEVEL = (() => { try { const v = localStorage.getItem('hc2-diff'); return DIFF_OPTS.some(o => o[0] === v) ? v : 'normal'; } catch (e) { return 'normal'; } })();
function setDiff(v) { if (!DIFF_OPTS.some(o => o[0] === v)) return; DIFF_LEVEL = v; try { localStorage.setItem('hc2-diff', v); } catch (e) {} }
let DIFF_TRAITS = {                                                                // TRAINED (see the header). v0.9.3: Hard and Rise one notch up
  base: { r: 1, a: 1, d: 1, k: 1 },                                                // = the AI as tuned up to v0.9.1: YOUR team-mates (and the demo)
  easy: { r: 0.56, a: 0.48, d: 0.66, k: 0.6 },                                    // (smarter-ai stage 2: a 0.6 -> 0.48, so Easy stays easy with the team brain)                                      // v0.9.2's trained Easy (S -1.72) nudged up: v0.9.3's smarter bursts left it at -2.5
  normal: { r: 1, a: 1, d: 1, k: 1 },                                              // = base (the computer side plays like your team-mates)
  // smarter-ai stage 2 (the co-designer: "the number of goals should increase with little to no increase to the win rate"):
  // the top levels defend a notch less and attack a touch sharper - with the team brain, the same win rate v them, more
  // goals both ways (tools/soak.js, 96 a level: docs/smarter-ai.md). Was hard a 1.5 d 1.48, rise a 2.0 d 2.0, easy a 0.6
  // fair-finishing (Luca 31 Oct: "i tried to play hard mode and i didnt score once"): the keeper trait came down (hard k
  // 1.38 -> 1.2, rise 1.9 -> 1.6) - Hard's keeper stopped ~4 in 5 well-placed shots from 12-20 m (tools/finish.js),
  // Rise's nearly all of them once it had a bar. Their keeper is still a level above yours; the rest of the level is unchanged.
  hard: { r: 1.6, a: 1.6, d: 1.25, k: 1.2 },                                       // v0.9.3 (Luca picked "one notch up"): v0.9.2's Hard + a little; the new edges v you do the rest
  rise: { r: 2.2, a: 2.15, d: 1.85, k: 1.6 } };                                     // v0.9.3: a step past that
// traits -> the knobs inside the AI (1 = unchanged). v0.9.3: the caps opened up so traits past 1.6 still count
function diffKnobs(t) {
  const e = (x, s) => Math.exp(-(x - 1) * s);
  return { think: e(t.r, 0.85), role: e(t.r, 0.6), gkReact: Math.max(-0.09, (1 - t.r) * (t.r > 1 ? 0.03 : 0.06) + (1 - t.k) * 0.05),   // (fair-finishing: past NORMAL the level's reactions speed his dive half as much - the keeper trait does the rest)
   
    shotWant: clamp(0.35 + 0.65 * t.a, 0.2, 1.9), shotQ: (1 - t.a) * 0.08, shotErr: e(t.a, 0.9), risk: clamp(0.6 + (1 - t.a) * 0.45, 0.45, 1.2), passErr: Math.max(0, 1 - t.a) * 0.13, sp: clamp(t.a, 0.3, 2.4),
    commit: clamp(0.45 + 0.55 * t.d, 0.3, 2.4), mark: clamp(1 + (1 - t.d) * 0.9, 0.4, 2.2), press: clamp(0.85 + 0.15 * t.d, 0.75, 1.2),
    gkRead: e(t.k, 0.8), gkPos: Math.max(0, 1 - t.k) * 1.4, gkSpd: clamp(0.9 + 0.1 * t.k, 0.85, 1.14), gkSave: clamp(0.3 + 0.7 * t.k, 0.2, 1.85),
    chip: clamp(0.15 + 0.85 * (t.a - 0.5) / 0.5, 0.1, 1.8), chipOff: clamp(4 + (t.a - 1) * 3.5, 2.2, 6.5),
    burst: clamp(0.6 + 0.4 * t.a, 0.6, 1.9), burstCd: clamp(1.15 - 0.15 * t.a, 0.7, 1.1),   // (v0.9.3: a smart dribbler times his take-on burst - more often, sooner again)   // (v0.9.2 chips: how often, and how far off his line the keeper must be first)
    // t-012 crosses (Luca: "Easy crosses less and worse, Rise Warrior picks the right moment"): how often, how far off
    // the runner's spot it lands (metres), and how good a look it waits for (crossLook's score)
    cross: clamp(0.15 + t.a, 0.5, 1.6), crossErr: clamp(2.6 - 1.2 * t.a, 0.5, 2.2), crossRead: clamp(0.2 + 0.35 * (t.a - 1), -0.2, 0.6),
    // t-008 AERIAL BATTLE (Luca: "mash kick against the computer"): how fast it mashes, x AERIAL.cpuRate - by its
    // reactions: Easy ~5.2 a second, Normal 6.5, Hard ~8.3, Rise Warrior ~10 (a fast human manages 7-10)
    mash: clamp(0.55 + 0.45 * t.r, 0.7, 1.6) };
}
// v0.9.3 (Luca: "The difficulties are too easy. Hard poses barely a challenge"): the edges YOU had over the computer were
// fixed whatever the level - its tackles on you lost 12-30% win chance, it blocked your dribble at 80% of the rate it
// blocks its own kind, it went in on you 40% less, never doubled up on you. Self-play can't see those (no human in it),
// so the ladder never touched them. Now each level sets them:
//   tk  its tackle penalty v you (x the old 0.12 / 0.2 sprinting / 0.3 burst; your burst always keeps at least 0.2)
//   yb  your own tackle bonus   sh  its shielding (off your tackle's win chance)   blk  its body-block steal rate v you
//   mine  your body-block steal rate v it
//   cmt how readily it goes in on you   sl  its recovery slides v you      cov  the cover man's gap behind the presser
//   dbl the cover man's own challenge rate when you're in reach (a double team)   st  its stamina drain (1 = same as you)
//   ans  how often its keeper answers YOUR special with a special save (it has the bars)   ansN  x the chance it spends
//        its bars on a sure-stop special save against your normal shot that would beat him (specials.js shotSaveCall)
//   (fair-finishing, Luca 31 Oct: "i tried to play hard mode and i didnt score once, lvl3 shot was saved by the gk". The
//   keeper answered 80% of your specials at every level, and his sure stop on a normal shot came up to ~70% on Hard -
//   so the level hardly changed it and a goal past a computer with bars in the bank was rare. Now the level sets it:
//   Mario Strikers / Inazuma Eleven's rule of thumb - the big shot is the way through, the keeper's answer is the
//   exception. base keeps the old numbers, so computer v computer is unchanged.)
const DIFF_YOU = {
  base:   { tk: 1, yb: 0.08, sh: 0, blk: 1, mine: 1, cmt: 1, sl: 0.45, cov: 7, dbl: 0, st: 1, ans: 0.8, ansN: 1 },           // = v0.9.2 at every level
  easy:   { tk: 1.2, yb: 0.10, sh: 0, blk: 0.9, mine: 1, cmt: 0.8, sl: 0.4, cov: 7, dbl: 0, st: 1, ans: 0.3, ansN: 0.25 },
  normal: { tk: 0.85, yb: 0.07, sh: 0.03, blk: 1.1, mine: 1, cmt: 1.05, sl: 0.5, cov: 6, dbl: 0, st: 1, ans: 0.45, ansN: 0.45 },
  hard:   { tk: 0.3, yb: 0.02, sh: 0.1, blk: 1.5, mine: 0.85, cmt: 1.5, sl: 0.65, cov: 3.2, dbl: 1.0, st: 0.9, ans: 0.6, ansN: 0.4 },
  rise:   { tk: -0.4, yb: 0, sh: 0.2, blk: 2.2, mine: 0.65, cmt: 2.2, sl: 0.85, cov: 1.6, dbl: 2.4, st: 0.75, ans: 0.75, ansN: 0.55 } };   // (tk below 0: it tackles you BETTER than its own kind)
const DIFF_K = {}; function diffK(l) { return DIFF_K[l] || (DIFF_K[l] = diffKnobs(DIFF_TRAITS[l] || DIFF_TRAITS.base)); }

// ---------------------------------------------------------------- Match methods: difficulty
hc2Mix(Match, {
  // v0.9.2 the AI knobs for a side: the computer's side plays at your difficulty, yours at NORMAL (the self-play trainer
  // sets window.__diffTeams to play any two trait sets against each other)
  dk(team) {
    const o = window.__diffTeams, s = team === this.home ? 'home' : 'away';
    if (o && o[s]) return o[s].K || (o[s].K = diffKnobs(o[s]));
    return diffK(!this.demo && !this.hasHuman(team) ? DIFF_LEVEL : 'base');            // (v0.9.3: your side plays at the old NORMAL = base)
  },
  // v0.9.3 the level's edges v YOU (DIFF_YOU) for a side: the computer's side at your level, yours / the demo at base
  dkY(team) {
    const o = window.__diffTeams, s = team === this.home ? 'home' : 'away';
    if (o && o[s]) return DIFF_YOU[o[s].lvl] || DIFF_YOU.base;
    return DIFF_YOU[!this.demo && !this.hasHuman(team) ? DIFF_LEVEL : 'base'] || DIFF_YOU.base;   // (t-043: two humans: no computer side, both base)
  },
});
