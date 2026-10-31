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
  GK:  { line: 0, name: 'Keeper',        job: 'the goal (keeper.js)' },
  CB:  { line: 0, name: 'Centre-back',   job: 'the middle of the back four' },
  FB:  { line: 0, name: 'Full-back',     job: 'the side of the back four; overlaps on his flank' },
  CDM: { line: 1, name: 'Holding mid',   job: 'the anchor: screens the CBs, drops into the line when one steps out, stays back with the ball' },
  CM:  { line: 1, name: 'Centre mid',    job: 'central midfield, box to box; late runs to the edge of the box' },
  CAM: { line: 1, name: 'Attacking mid', job: 'between their lines; the edge of the box; presses their holding man' },
  W:   { line: 1, name: 'Winger',        job: 'wide midfield; goes far post on a cross; tracks their full-back' },
  WF:  { line: 2, name: 'Wide forward',  job: 'the front three\'s wide man: in behind on his flank; tracks their full-back' },
  CF:  { line: 2, name: 'Striker',       job: 'runs in behind, stays onside' },
};

// THE FORMATIONS (role-based AI, step 4 - docs/role-ai-plan.md 6.1 + 7). Luca, 31 Oct 02:24: "cdm, winger, centerforward
// cam etc". Until step 4 every team was a 4-4-2 and a man's spot was his shirt slot in three tables (teamai.js FORMATION
// for the kick-off, AI.HOME_Y_DEF / _ATT across the pitch). Now each formation is one entry: per slot his role, his
// kick-off spot, how far across he stands without / with the ball, and how much deeper (-) or higher (+) than his line's
// band he plays without / with the ball (m). Slots 1-4 are the back four in every formation (the line, step 2, and the
// Lab's RL tests read them) and slots 9-10 take the kick-off, so 9 is always the striker.
// How real teams and other games set them up (FIFA Training Centre shapes; EA FC's formation + role cards; eFootball's
// Anchor Man / Hole Player): the 4-2-3-1's holding pair sits ~10 m in front of the back four and the 10 plays in the hole
// behind the striker; the 4-3-3's single 6 is the anchor, its wide forwards start high and wide and come back with their
// full-back.
//  slot:   role,  kick-off [x, y],  across without / with the ball,  deeper / higher without / with the ball
const SHAPE = (rows) => ({ roles: rows.map(r => r[0]), spot: rows.map(r => r[1]), yDef: rows.map(r => r[2]), yAtt: rows.map(r => r[3]),
  dxDef: rows.map(r => r[4] || 0), dxAtt: rows.map(r => r[5] || 0) });
const SHAPES = {
  // today's 4-4-2, number for number (FORMATION, AI.HOME_Y_DEF / _ATT): a match on it plays as before step 4, bar the
  // wingers tracking back (MID.TRACK)
  '4-4-2': SHAPE([['GK', [3, 34], 0, 0], ['FB', [17, 10], -18, -27], ['CB', [15, 26], -6, -9], ['CB', [15, 42], 6, 9], ['FB', [17, 58], 18, 27],
    ['W', [33, 12], -19, -26], ['CM', [31, 28], -6, -8], ['CM', [31, 40], 6, 8], ['W', [33, 56], 19, 26], ['CF', [46, 29], -4, -7], ['CF', [46, 40], 5, 7]]),
  // the holding pair: the CDM anchors, the CM goes box to box; the 10 in the hole behind the one striker
  '4-2-3-1': SHAPE([['GK', [3, 34], 0, 0], ['FB', [17, 10], -18, -27], ['CB', [15, 26], -6, -9], ['CB', [15, 42], 6, 9], ['FB', [17, 58], 18, 27],
    ['W', [35, 12], -19, -26], ['CDM', [26, 29], -5, -6, -3, -6], ['CM', [28, 39], 5, 7, -1, -2], ['W', [35, 56], 19, 26],
    ['CF', [46, 34], -1, -2], ['CAM', [39, 34], 1, 1, 4, 7]]),
  // one anchor, two CMs either side of him, a front three: the wide forwards high and wide
  '4-3-3': SHAPE([['GK', [3, 34], 0, 0], ['FB', [17, 10], -18, -27], ['CB', [15, 26], -6, -9], ['CB', [15, 42], 6, 9], ['FB', [17, 58], 18, 27],
    ['WF', [42, 10], -21, -28, -4, -3], ['CDM', [25, 34], 0, 0, -3, -6], ['CM', [31, 24], -10, -12], ['WF', [42, 58], 21, 28, -4, -3],
    ['CF', [46, 34], 0, 0], ['CM', [31, 44], 10, 12]]),
};
const FORMATIONS = Object.fromEntries(Object.entries(SHAPES).map(([k, v]) => [k, v.roles]));
const FORMATION_LIST = Object.keys(SHAPES);
// every team plays FORMATION_DEFAULT until step 6 gives each team its own pick; OPTIONS > FORMATION changes YOUR side's
// shape (kept in localStorage 'hc2-form', like the TEAM AI switch)
const FORMATION_DEFAULT = '4-2-3-1';
let FORMATION_MINE = (() => { try { const f = localStorage.getItem('hc2-form'); return SHAPES[f] ? f : null; } catch (e) { return null; } })();
function setMyFormation(f) { FORMATION_MINE = SHAPES[f] ? f : null; try { localStorage.setItem('hc2-form', FORMATION_MINE || ''); } catch (e) {} }
const shapeOf = team => SHAPES[(team && team.formation) || '4-4-2'] || SHAPES['4-4-2'];
// a team's formation for a new match: yours from OPTIONS, theirs the default (the Lab / tools can set FORMATION_FORCE)
function formationFor(team, isMine) { if (typeof window !== 'undefined' && window.FORMATION_FORCE) return window.FORMATION_FORCE; return (isMine && FORMATION_MINE) || FORMATION_DEFAULT; }
// change a team's shape (a new match, or live from the pause menu): roles and kick-off spots follow; the AI reads them
// every frame, so nothing else needs resetting
function applyFormation(team, f) {
  if (!SHAPES[f]) return; team.formation = f; const S = SHAPES[f];
  for (const p of team.players) { p.role = S.roles[p.i]; const h = S.spot[p.i]; p.home = team.side > 0 ? { x: h[0], y: h[1] } : { x: PITCH_L - h[0], y: h[1] }; }
}
const homeY = (p, att) => { const S = shapeOf(p.team); return (att ? S.yAtt : S.yDef)[p.i]; };

const roleFor = (team, i) => shapeOf(team).roles[i];
const lineOf = p => ROLES[p.role].line;                     // 0 back (with the keeper), 1 midfield, 2 attack
const isBack = p => p.role === 'CB' || p.role === 'FB';     // an outfield defender
const isWide = p => p.role === 'W' || p.role === 'WF';      // a winger (4-4-2 / 4-2-3-1) or a wide forward (4-3-3)

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

// THE MIDFIELD ROLES (role-based AI, step 4 - docs/role-ai-plan.md 6.1). What real midfields do (FIFA Training Centre;
// UEFA B "pressure / cover / balance"; eFootball's Anchor Man and Hole Player, EA FC's CDM "holding" and winger "track
// back" focus) and what we take:
//  * the ANCHOR (CDM) screens the centre-backs: he stands a set gap in front of the line, between the ball and our goal,
//    never as high as the rest of the midfield. When a back man has stepped out of the line (he's pressing the ball, or
//    he's pulled out of it), the anchor drops into his spot until he's back - step 2's hand-off, the other half of it.
//    With the ball he's rest defence: he stays a set distance behind it and makes no runs into the box.
//  * the 10 (CAM) plays in the hole between their midfield and their back line and arrives at the edge of the box.
//  * WINGERS TRACK BACK: their full-back going forward on his side is his man - he follows him back (goal-side, a step
//    off) down to near our line, instead of waiting upfield while their full-back gets a 2 v 1 on ours.
const MID = {
  ANCHOR_GAP: 8,       // m the anchor stands in front of the line without the ball
  ANCHOR_GAP_MAX: 13,  // ... at most this far in front of it (he never joins the press line)
  ANCHOR_Y: 0.55,      // how much he follows the ball across (the line follows it 0.22, the midfield 0.28 - he screens the ball's side)
  ANCHOR_YMAX: 12,     // m from the middle at most
  ANCHOR_REST: 14,     // m he stays behind the ball with it (rest defence; the line itself is 20 m back)
  HOLE: 6,             // m a back man is in front of the line = he's out of it: the anchor drops into his spot
  TRACK_X: 4,          // their full-back this close to level with the winger (m) or past him = the winger follows him
  TRACK_GAP: 2.5,      // m the winger stays goal-side of him
  TRACK_DEEP: 5,       // m in front of our line: the deepest the winger goes (he doesn't become a fifth defender)
  TRACK_Y: 0.6,        // how much he moves across onto him
  TRACK_WF: -8,        // a 4-3-3's wide forward tracks only to here (team frame m: just inside our half) - he's the outlet
};
