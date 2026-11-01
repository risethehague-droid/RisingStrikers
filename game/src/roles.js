// ROLES: every man's role card (role-based AI, step 1 - docs/role-ai-plan.md section 6.1).
// Luca, 31 Oct 02:24: "the players must be broken down into striker, midfield, defender and gk (with the specific sub
// types so like cdm, winger, centerforward cam etc)". Until now a man's job was his shirt slot (p.i <= 4 defence, 5-8
// midfield, 9-10 attack), checked by number all over teamai.js. Now each man carries p.role, read from his team's
// formation, and the AI asks his card instead. A new role (CDM, CAM ...) or a new formation is one entry here.
//
// Step 1 is a pure refactor: still the 4-4-2 for every team, and the same seeded matches play out exactly as before.
// So `line` copies the old shirt bands one for one: 0 = back (shirts 0-4), 1 = midfield (5-8), 2 = attack (9-10).
// The keeper sits on row 0 because shirt 0 was inside every old `p.i <= 4` check; where a check meant "outfield
// defender" (shirts 1-4) it asks isBack() instead. Steps 2-5 add the rest of each card (home spot, width, press,
// marking, runs, recovery) and give the keeper his own logic.
//
// Loaded after brain.js. Nothing here runs at load time; Player reads FORMATIONS when a team is built.

const ROLES = {
  GK: { line: 0, name: 'Keeper',      job: 'the goal (keeper.js)' },
  CB: { line: 0, name: 'Centre-back', job: 'the middle of the back four' },
  FB: { line: 0, name: 'Full-back',   job: 'the side of the back four; overlaps on his flank' },
  W:  { line: 1, name: 'Winger',      job: 'wide midfield; goes far post on a cross' },
  CM: { line: 1, name: 'Centre mid',  job: 'central midfield; late runs to the edge of the box' },
  CF: { line: 2, name: 'Striker',     job: 'runs in behind, stays onside' },
};

// one role per shirt slot (0-10), in the slot order of FORMATION (core.js: the kick-off spots) and AI.HOME_Y_DEF / _ATT
const FORMATIONS = {
  '4-4-2': ['GK', 'FB', 'CB', 'CB', 'FB', 'W', 'CM', 'CM', 'W', 'CF', 'CF'],
};

const roleFor = (team, i) => FORMATIONS[team.formation || '4-4-2'][i];
const lineOf = p => ROLES[p.role].line;                     // 0 back (with the keeper), 1 midfield, 2 attack
const isBack = p => p.role === 'CB' || p.role === 'FB';     // an outfield defender

// THE BACK LINE AS ONE UNIT (role-based AI, step 2 - docs/role-ai-plan.md 6.2). Luca, 31 Oct: "the defenders are not
// thinking like defenders (not holding a defensive line etc)". Until now each defender worked out his own depth from the
// ball, a marker could pull one 18 m out, and with the ball both full-backs and the line went up - tools/linestudy.js:
// the four 7 m apart, one of them 8 m+ out 28% of the time; the Lab's E6 (a counter down the flank the full-back left)
// worked 90% of the time. Now every team has ONE number, team.line (metres from the centre line in the team's frame,
// aiFrame), and its four defenders stand on it. How real back fours do it (FIFA Training Centre, UEFA B "pressure /
// cover / balance"; EA FC's single "defensive approach" line):
//  * uncovered ball (their man has time, nobody of ours on him goal-side) = DROP, so nothing goes over the top;
//    covered = hold; ball played back = everyone STEPS UP together
//  * the edge of the box is the floor while the ball is in front of the line outside it
//  * it moves slowly and together (a drop is a walk back, not a sprint) unless the ball is already past it
//  * the cover CB (the one away from the ball) stands a little deeper
//  * hand-off: a defender follows a man only a few metres out of the line; further out, the midfield picks him up
//  * rest defence: with the ball, the line stays a set distance behind it, and when a full-back has gone forward the
//    other three slide across to his side, so his flank isn't empty when the ball's lost
//  * a ball played forward towards the line: it goes back at once, to where the ball is going, not where it was
//  * recovery: when the ball is past them, the back four run back flat out (as every real defender does on a counter)
const LINE = {
  BOX: -36.5,          // the edge of our box in the team frame (16 m out): the floor while the ball is in front of it
  DROP_V: 4.5,         // m/s the line drops at (back together, about as fast as a man runs with the ball - slower and it lags)
  UP_V: 3.5,           // m/s it steps up at
  FAST_V: 7.0,         // m/s when the ball is already level with or past the line, or just lost (everyone sprints back)
  FAR: 5,              // m: the line this far above where it should be (the ball's just been lost) = a recovery run, not a jog
  UNCOV: 3,            // m it drops for an uncovered ball (5 cut goals a match by a quarter in the soak: too much)
  UNCOV_R: 4.5,        // a man of ours this close, goal-side of their carrier = the ball is covered
  UNCOV_AHEAD: [10, 35],// an uncovered ball only matters this far in front of the line (m): closer it's a duel, further it can't be played over
  BACK_V: 4,           // m/s the ball travels away from our goal = played back: step up
  STEP: 4,             // m the line steps up when it is
  COVER_DEEP: 1.2,     // m the cover CB (away from the ball) stands deeper than the rest
  HAND: 5,             // m a defender follows his man out in front of the line before handing him on to the midfield
  UP: 12,              // m a full-back is in front of the line = he's "up" (overlapping / caught upfield)
  SLIDE: 9,            // m the other three slide across to his side
  REST: 20,            // m the line stays behind the ball with it (rest defence)
  REST_UP: 26,         // ... and with a full-back gone forward (three left at the back: they hold deeper)
  OVER_V: 6,           // m/s: their ball going forward this fast (a pass, a through ball) ...
  OVER_T: 0.8,         // ... the line goes back to where it'll be in this long (s) ...
  OVER_GAP: 3,         // ... and this much deeper, at a sprint: a ball played in behind is a race the line must start at once
};
