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
