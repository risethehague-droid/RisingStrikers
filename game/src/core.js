// HELP OUT HAGUE CUP II - web game v0.11.1 (Luca OK'd PR #22 + #20 + #21, 25 Oct: THE KEEPER REBUILT after his 02:58 report "you could just walk around it and score" - he tracks the ball a beat ahead, closes you down and steps up in a 1v1, dives at your feet (SMOTHERED! / BLOCKED!), a starfish block for close shots, faces the ball while he side-steps and backpedals, gets up after a dive; PixelLab batch 18 keeper moves; normal saves use the batch 16 dives; blocked players step round (PR #20); Bug Watch no longer counts the blank animation as a flicker (PR #21))
// v0.11.0 (Luca OK'd PRs #9-#19, 24 Oct 18:35 - his whole 05:57 list: INSTA FLAG (F) + a replay player with every effect; a clear 'you' arrow + direction pointer; the KEEPER AI reads x / y / z, holds weak shots, tips and parries out for CORNERS; the computer plays DOWN THE WINGS with crosses, runs and aerial specials; the LOB remade - hold to aim a landing ring, release to kick - with timed runs and the MASH! AERIAL BATTLE; PixelLab batch 16 + 16b in play: keeper special saves picked by the shot (leap / iron block / flying catch / fingertips), aerial specials picked by the ball's arc (AIR BLAZE / TIDE CUTTER, SKY THUNDER / CYCLONE HEEL, PHOENIX / METEOR DRIVE); Test Lab only for now: GOAL PHYSICS (net with give, post rebounds), the TAP KICK and the CURVING SPECIAL PASSES (batch 17))
// v0.10.4 (Luca 24 Oct 06:21, "of immediate importance": the GOAL KICK is a clean cut - a TV wipe, then the keeper at the edge of his six-yard box with the ball in his hands and both teams in a goal-kick shape (his centre-backs split, full-backs wide, the other side outside his box); he plays it out of his hands like after a catch (you: PASS throws, LOB punts). Luca 06:24: no replays while the ball is live - big saves / near misses / aerial specials go to HIGHLIGHTS in CLASSIC too, as in ARCADE; the goal replay after a goal stays)
// v0.10.3 (Luca OK'd PR #7 + #8, 24 Oct 06:16: ARCADE PACE part 1 - PACE: CLASSIC (today, the default) / ARCADE (run 6.0 / sprint 8.8, snappier, less waiting) on the start screen and in Options (worker-f, t-004); LOB STEP 1 - lobs really reach their height, a shadow that shrinks as the ball climbs, a landing ring that stays until someone touches it, the real power-lob arc, the keeper reads a lob by level (worker-l, t-005). The 4 calls with the taskmaster's picks: keep rates same as before, the keeper's read also holds claim / sweep, a full power lob trimmed to ~2.35 s (6.6 m), the high-ball shadow fades less)
// v0.10.2 (Luca 24 Oct: "make it so i can resume a game that was last played in the menu": RESUME on the start screen - a normal match against the computer keeps a snapshot in this browser (score, clock, half, that match's settings, every player's shirt / legs / cards, subs, special meters, stats; resume.js), saved every 5 s of play, on QUIT TO MENU and when the page is hidden, cleared at full time / penalties; it picks up with a kick-off for the side that had the ball. Not for the cup, watch mode, the penalty battle or the Lab. Saving only reads: the same seeded matches give the same scores, 8/8 with a save every 7 frames)
// v0.10.1 (the first nightly QA run's two fixes, PR #5 + #6: BUG WATCH no longer changes the match it watches - its clip ids used the game's own dice, so the same seed played a different match with it on or off; and the ANIMATION FLICKER is down ~90% - every idle / walk / run picture, direction included, stays up at least 0.11 s (not your own player, not in replays). Seeded matches: Bug Watch on = off = v0.10.0)
// v0.10.0 (worker-f, PR #3 / t-002 stage 1: the LOB AND CHIP revamp starts - the plan (docs/lob-chip.md) and three prototypes, OFF in the game: open the page with #lobA, #lobB or #lobC (or ?lob=) to try a direction. Luca picked B in steps: real backspin, floated / driven / chip; arcade chip on LOB + SHOOT; the driven lob behind a switch first; PixelLab keeper backpedal / tip-over. Off = the same seeded matches as v0.9.9)
// v0.9.9 (Luca 02:50: "add the sliders from the training ground to the classic version and lets go with that for now": the classic Test Lab's FREE PLAY gets the Test Lab v3 knobs - run / sprint speed, energy, getting energy back, ball magnetism, grip, bounce, lob height, power-lob distance, chip dip, shot power, keeper level / reaction / reach / dive speed - in tabs, in plain words, Less / Normal / More + reset, a comment and SUGGEST THIS FOR THE GAME. For that, RUN / JOG / SPRINT_DRAIN / REST_GAIN / RUN_GAIN / CHIP_DIP / GK_REACH / GK_DIVE_V are let, and three inline numbers are named: BALL_MAG, LOB_H, LOB_MAX. The game plays exactly as before: 8 seeded matches identical)
// v0.9.8 (co-designer, PR #2 friend/lob-mechanics: LOBS that make sense - an open-play lob climbs over the players in between, 3.6-6 m (a held power lob 3.6-8 m; set pieces and keepers unchanged); the drop is a fair aerial duel (nearer + the run on it + luck, ordinary headers nearest first): your winner heads at goal near the box, chests it, cushions it down or nods it on; theirs heads it clear; the defender marks the man instead of the landing spot; a rising lob can only be blocked by a man square in front of it; your header window 0.35 -> 0.7 s. Measured with tools/lobstudy.js: your lobs kept 45% -> 75%, the computer's 33% -> 50%)
// v0.9.7 (Luca 22:36: "set up a 1v1 computer game that simulates games, make one that's manual so i can pause etc plus manually comment on after for bug etc but also run simulations of the games in the background catching any bugs": WATCH on the start screen - the computer plays both sides at your level v base, ENTER pauses, 1-4 = 0.5x / 1x / 2x / 4x, N keeps the moment as a Bug Watch clip, the review opens at full time (BUG / FINE / NOT SURE + a note, to the database); tools/soak.js plays seeded computer-v-computer matches across teams, levels, AI, weather and light for the nightly QA)
// v0.9.6 (co-designer, PR #1 friend/camera-pov: CAMERA distance - CLOSE = the old view and the default, MEDIUM 0.75, WIDE 0.5 - on the start screen and in Pause > Options; only the zoom changes, the HUD stays screen-sized, replays zoom in from the picked distance; remembered per browser)
// v0.9.5 (Luca 18:08: "it should be split during the move": the code is split by area into 17 files in src/ for the shared repo, one lane per file - nothing changes in play: the same seeded matches give the same scores, the same Test Lab results)
// v0.9.4 (Luca 15:47: "computer chips too and pixellab first": the CHIP is ON in matches - PixelLab batch 15 made the chip on the IS rig (PixMiniMax, ball-free prompt: short step, stab under it, lean back, the leg lifts; E / NE / SE / S made, N = the NE frames, W / NW / SW mirrored), painted onto every kit; contact on the 4th frame at 20 fps)
// v0.9.3 (Luca: "The difficulties are too easy. Hard poses barely a challenge. Adjust." - then: he had been on the CLASSIC AI, which ignores most of the level, and picked "one notch up": the edges you had over the computer at EVERY level (its tackles on you up to 30% weaker, slower to go in, never a double team) now come from the level (DIFF_YOU: Easy softer than before, Hard mostly gone, Rise reversed + it shields the ball, double-teams you, tires slower); Hard = v0.9.2's Rise, Rise a step past it; a smart side times its take-on bursts and still releases a pass under pressure; the trait caps opened up; your team-mates play at base = the old Normal; the menus say when the Classic AI is on)
// v0.9.2 (Luca: "Add a difficulty modifier in the main menu (Easy-Normal-Hard-Rise Warrior)... 4 separate models... train them separately through self-learning" + "Lob in the box with the POV of the attacker looking at the goal becomes a chip... Chips should be faster with a more aggressive curve": DIFFICULTY on the start screen + pause options - four trait profiles (reaction, attacking IQ, defending + marking, keeper - like EA FC: how the computer thinks, not its players' stats), each trained on its own by self-play v the NORMAL side; your team-mates stay NORMAL. CHIP SHOT (Test Lab for now - on in matches with its PixelLab animation): LOB in their box facing goal = a chip (fast, low arc, hard dip under the bar; a keeper on his line catches it), facing away = a lob; the computer chips a keeper who has come out - how often and how well by difficulty; slow motion as it goes over him)
// v0.9.1 (Luca: "move gk ai dev to top priority we need to test it + include walking up etc when needed": KEEPER AI rebuilt on goalkeeping coaching - ANGLE on the bisector of ball + posts, deeper as the ball comes; SWEEPER: walks up to the top of his box and beyond (~18 m behind his last defender, higher when his team attacks); SWEEP: comes for a through ball he reaches first (feet outside the box); 1v1 RUSH + BLOCK (stops ~3.5 m from the dribbler, low and big), SMOTHER a heavy touch; SET for a shot; BACK for a lob over him; walks / jogs / runs by urgency, backs off facing the ball; back-pass rule (IFAB Law 12): feet only; clears under pressure)
// v0.9.0 (Luca: "Teams should be able to use their Iron Wall-like special abilities to also block normal shots (K). Only goalkeepers, no defenders can use defensive special abilities, yet": a keeper special save (LV1-3, the bars in the bank) now also stops a normal shot or header on target - a sure stop, the same cut scene + save rig; your keeper: the SAVE? prompt on any shot on target while you have a bar; the computer: on a shot its keeper would not reach, about half the time; keepers only)
// v0.8.9 (Luca: "rig 3 cruder new animations for 3 new aerial special shots so the game has working moves, same for the saves, make cut scenes for the special saves too": ROUGH RIGS until the real ones are made in PixelLab - built from our PixelLab frames moved / turned / squashed by code + the PixelLab effects + after-images: AIR LV1 BLAZING SCISSOR, LV2 THUNDER OVERHEAD (back to goal), LV3 PHOENIX DIVE - the ball hangs where his boot will meet it; keeper saves LV1 IRON WALL, LV2 THUNDER GLOVE, LV3 RISING SHIELD at the clash; a keeper with a save ready burns in its colour; SPECIAL SAVE CUT SCENE (1.5 s, ENTER skips); replays keep the turn / squash)
// v0.8.8 (Luca: "add the aerial moves and anything else to test lab in buttons, clean the overlay a bit": the Lab's FREE PLAY has every move on a button - header, volley, diving header, overhead kick, chest trap, aerial specials LV1-3, power lob 30/60/100%, ball to your feet - plus INJURED, WEATHER and KEEPER SAVE switches, a tidier panel and lighter hit boxes; fix: a header or diving header off a spent special is an ordinary ball again (it could keep the special's flight))
// v0.8.7 (BUG WATCH: the game checks its own footage every frame - ~25 rules - keeps a clip of anything wrong or odd, pause menu / B at full time to watch + mark them, saved for Claude; overnight runs found + fixed the facing / animation flicker of keepers and slow players, aerial specials that missed the ball, AI fidgeting on its spot)
// v0.8.6 (POWER SYSTEM: special shots blow through blockers - LV1 one man, LV2 two, LV3 five - and lose power over distance (LV1 close range only, LV2 from their half, LV3 from anywhere); keeper special saves LV1-3 (same level cancels, lower = a chance), SAVE! prompt; aerial specials off a lob (volley / overhead / LV3 super) with the SPECIAL popup)// v0.8.5 (MENUS + ENDINGS: match settings - arena / time of day / weather / level at 90; extra time, golden goal, penalties; PixelLab coin toss; pause menu; wider 1152 x 648 view; hold-L power lob; injuries)
// v0.8.4 (MATCH FLOW: team sheet before kick-off (swap players / bench), walk-out from the tunnel with the crowd, added time per half from the time lost (IFAB Law 7) + the half ends at a calm moment (attacks / corners / free kicks near goal play out, penalties always taken), real half time: walk off, stats card, 3 substitutions; v0.8.3: fixes from a 2nd outside check: a dribbler shielding the ball is tackled (match stalls), your keeper stays in his box with the ball + 6 s limit, idle 1V1 penalty battle ends, referee forgets the old foul spot in a new match, HAGUE CUP during the demo replay; v0.8.2: attack AI from Buckland Simple Soccer: shot lanes, safe passes by interception race, support spot, take-ons; PixelLab jockey; team stretches in possession, midfield screens instead of standing on the ball; challenge wins stick, head-on slide = block tackle, slide aims where the ball will be; computer recovery slides + fouls; replays: AGAIN freeze, pause-safe goal replays, 60 Hz recorder on 120/144 Hz screens; grass grips skimming bounces; v0.8.1: team AI rebuilt on gfootball / YSoccer / RoboCup SBSP + CLASSIC option, challenge vs slide, smooth dribble, real-ball bounce, SP from time only, foul replays, replay zoom + stale replay fix, keeper punt; v0.8.0 FEEL PASS: tackles + block steals, fewer fouls, tighter dribble, sprint burst, marking, SP from pass chains, keeper guard, foul scenes + tidy free kicks, set-piece pass markers; v0.7.6: crash breadcrumbs + phone SAFE MODE: canvas renderer, no demo, comes on by itself after a crash; v0.7.5: phones load half-size textures from assets-lo/ so iOS stops reloading the page; v0.7.4: pass preview ring + off-screen arrow, sticky pass target; PixelLab walk for players, keepers and the referee; keeper side-shuffle; PixelLab trophy lift + on-pitch cup ceremony; keeper clears with his feet; v0.7.3: PixelLab trophy, fireworks + confetti on the champion screen, card pops over the booked player, kickoff whistle; v0.7.2: HAGUE CUP mode: six teams, two groups of three, group winners in the final, a level final goes to penalties vs the computer; v0.7.1: PixelLab referee: follows play, cards, whistle; specials LV1 spin strike / LV2 thunder strike / LV3 leap, keeper blasted back by a parried LV2+; sprint N redone; v0.7.0: Luca's feedback: sprint = PixelLab looping sprint, no more jank; ball grips + bounces; passes connect (82% vs 42%); the boot meets the ball on the contact frame + hit-stop / shake / PixelLab impact; SP ENERGY METER per team, 3 levels, BASIC + WILD looks (T), RISE UP!, SPECIAL SHOTS LV1-3 (LV3 = PixelLab leap); v0.6.2: demo fix: the home side's 'your player' slot no longer holds the demo team back - it never shot; v0.6.1: Rami describes the goal: header, diving header, volley, from distance; v0.6.0: DEMO: leave the start screen for 8 s and the computer plays itself behind the menu - replays, Rami and all - PLAY starts a fresh match; v0.5.9: overhead kicks need your back to goal or Shift held, so shooting at a cross is still a header; Rami calls overhead-kick goals; lab A5; v0.5.8: SOUND: code-made 16-bit effects - kicks, headers, whistle, net, post, catches, crowd bed + roars; M mutes; v0.5.7: TV wipe in / out of replays, shorter start-screen notes; v0.5.6: PixelLab batch 10: BICYCLE KICKS - shoot on a ball above head height near their goal, the AI tries the odd one, replayed; keepers roll the ball out underarm; v0.5.5: fix: nobody can tackle a keeper holding the ball, opponents back off, he can't be shoved over his line, a held ball you leave alone is thrown out after 5 s to a free team-mate; near misses replayed; Rami intro on penalties; v0.5.4: PixelLab batch 9: protest to the ref, hurt after a carded foul, hands on hips + keeper organising + corner signal at set pieces, point-to-the-sky celebration, keeper jumping claim of high balls; Rami also calls penalties + shoot-outs; first touch NE no longer uses a hand; v0.5.3: Rami on the mic with the E11 lines; replay v2: TV zoom, save + post replays, HIGHLIGHTS; PixelLab batch 8 reactions: aeroplane, celebrations E / W, dejected, keeper beaten / roar, full-time applause, ball placed on the spot; v0.5.2: instant replay after goals + LAST GOAL replay in the pause menu; PixelLab batch 7: keeper mind games, high penalty dive, taker waiting, knee-slide celebration, big-chance-missed reaction; v0.5.1: penalty styles BASE / WILD / TECHNICAL + 1v1 shoot-out, PixelLab batch 5-6; v0.4.2: PixelLab batch 4: attacking header, clean catch, 16 px ball; v0.4.1: keepers save by contact, heavier grass, attackers attack crosses; v0.4: penalty camera; v0.3: all six teams, volleys, diving headers, chest traps, throw-ins, celebrations, red cards;
// PixelLab batch 1: kick, slide, fall, get-up, jump, hit; batch 2: trap, volley, diving header, throw-in, celebration,
// keeper catch / throw / goal kick / forward dives)
// Phaser 3. World units are metres on the pitch (x along, y across, z up); the stadium art is pre-projected,
// so wx()/wy() turn metres into world pixels exactly like the art scripts do.
'use strict';
const VIEW_W = 1152, VIEW_H = 648;                 // v0.8.5 (Luca: more of the pitch, to see the pass options) - was 960 x 540
const PEN_W = 960, PEN_H = 540;                    // the penalty scene keeps its 960 x 540 layout (its camera zooms it up)
const PITCH_L = 105, PITCH_W = 68, PX_X = 48, PX_Y = 38, PX_H = 60, S_FAR = 0.87, S_NEAR = 1.13, RUNOFF_Y = 3.5;
const GOAL_Y0 = 34 - 3.66, GOAL_Y1 = 34 + 3.66, BAR_Z = 2.44;
let CHIP_DIP = 1.9;                                // v0.9.9: let, so the Test Lab's FREE PLAY knobs can change it live (same value in the game)
const CHIP_ON = true;                                                          // v0.9.4: ON in matches - the PixelLab chip animation is in (batch 15)
// t-002 (Luca 23 Oct 22:31: "work on the game mechanics of the lob and chip... revamp it completely"): the directions in
// docs/lob-chip.md. Luca picked B, in steps (24 Oct 03:45). t-005 (step 1): A's fixes are now the real game (lobs that
// reach their height) and C (aftertouch) wasn't picked, so both prototypes are gone. B (backspin / Magnus lift, three
// lofted kicks: lob, driven lob, chip) stays as a PROTOTYPE for step 2 to build from, OFF unless the page is opened with
// ?lob=B, or #lobB / #play-lobB on the link's ending (claude.ai artifact links pass only a plain #anchor through, not
// ?lob=, so that's how Luca tries it from HQ's "Play it"). Off (null) = the game.
let LOB_PROTO = (() => { try { const q = new URLSearchParams(location.search).get('lob'), m = /(^|#|&|-)lob-?B\b/i.exec(location.hash);
  return q === 'B' || m ? 'B' : null; } catch (e) { return null; } })();
const MAGNUS_K = 0.0058, SPIN_TAU = 5, CHIP_SPIN = 55;   // lift accel = MAGNUS_K x spin (rad/s) x speed: rho*A/(2m) * r (Cl ~ spin ratio, Goff & Carre 2009); spin halves in ~3.5 s;
                                         // a chip leaves the boot with ~9 rev/s of backspin
// t-011 CURVING SPECIAL PASS (Luca 24 Oct 05:57: "add a special lvl 1 pass that curves impressively and dynamically, make
// it look cool [...] don't add these new passes to the game just yet, only test lab"). SPECIAL held + PASS / THROUGH / LOB
// with a bar in the bank = the bending version (specials.js curvePass, ball.js curveStep / curveSolve). OFF in matches;
// the Test Lab turns it on (lab.js). let: the Lab sets it.
let CURVE_PASS = false;
// the spin: tau = how fast it wears off (s; the bend is strongest off the boot, then straightens as the ball slows);
// clear = how far (m) the curve keeps from a defender standing on the straight line; ang = the launch angles (degrees off
// the straight line) tried, smallest first, and the default bend when nobody is in the way; kMax = the most curvature
// (1/m) a solve may ask for; trail / cam = the look (s)
const CURVE = { tau: 1.6, clear: 2.8, ang: [14, 18, 22, 26, 30, 34, 38], angFree: 20, kMax: 0.35, trail: 2.2, cam: 1.1 };
// t-005 (lob step 1, readability): the ball's shadow shrinks as it climbs - full size on the grass, SHADOW_MIN of it from
// SHADOW_Z metres up (docs/lob-chip.md: "100% to about 60% between 0 and 6 m"); the ball-shadow sprite scaled, nothing drawn
const SHADOW_MIN = 0.62, SHADOW_Z = 6;
const DIRS = ['E', 'NE', 'N', 'NW', 'W', 'SW', 'S', 'SE'];
const HALF_REAL_SECONDS = 180;                     // 3 real minutes per half (match length option later)
// the six Help Out Hague Cup II teams: kit atlases (painted on the same PixelLab frames) + radar colour
const TEAMS = {
  IS: { kit: 'IS-home', gk: 'IS-keeper', col: 0xf4f0e4 },      IRO: { kit: 'IRO-home', gk: 'IRO-keeper', col: 0xe8343c },
  USCS: { kit: 'USCS-home', gk: 'USCS-keeper', col: 0xf6c828 }, LUC: { kit: 'LUC-home', gk: 'LUC-keeper', col: 0xec96be },
  THUAS: { kit: 'THUAS-home', gk: 'THUAS-keeper', col: 0x8cde78 }, AUC: { kit: 'AUC-home', gk: 'AUC-keeper', col: 0xce282c },
};
const TEAM_COL = Object.fromEntries(Object.entries(TEAMS).map(([k, v]) => [k, v.col]));
const ALT_KIT = { LUC: 'LUC-alt' };                              // second kit for a colour clash
// movement (metres per second, m/s²)
let RUN = 5.2, JOG = 3.8;                          // v0.9.9 (Luca: the training-ground knobs in the classic Test Lab): let, for the Lab's knobs
let WITH_BALL = 0.9, WITH_BALL_SPRINT = 0.94, ACC = 12, DEC = 26;   // t-004: let, so the PACE preset can set them (Classic = these)
let SPRINT = 7.7;                                  // v0.8: let (not const) so the Test Lab's FREE PLAY sliders can tune it live
const WALK_V = 2.3;                                // v0.7.4: below this (m/s) a player walks (PixelLab walk) instead of running in slow motion
const STRIDE_PX = 22;                              // planted-foot travel per run frame (PixelLab 8-frame run, measured ~16-30 px)
let SPRINT_DRAIN = 0.23, REST_GAIN = 0.16, RUN_GAIN = 0.07;   // stamina per second (0..1)
// t-004 ARCADE PACE (Luca OK'd the co-designer's request, HQ card t-004, 24 Oct 03:15: "more decisions per minute,
// fewer seconds of waiting, and every touch feels strong" - design/arcade-pace.md). PACE: CLASSIC (today, the default)
// or ARCADE, on the start screen and in Pause > Options. Part 1 = the design's A (movement) and D (less waiting).
// The movement dials ARE the tunable globals above: applyPace() writes them, so the Test Lab's FREE PLAY knobs still
// win there. The Lab always plays CLASSIC (paceK() and applyPace() ignore the setting on the Lab page).
const PACE_OPTS = [['classic', 'CLASSIC'], ['arcade', 'ARCADE']];
const PACE = {
  classic: { RUN: 5.2, SPRINT: 7.7, ACC: 12, DEC: 26, SPRINT_DRAIN: 0.23, WITH_BALL: 0.9, WITH_BALL_SPRINT: 0.94,
    koFreeze: 1.2, half2Freeze: 1.6, spFreeze: 0.5, deadT: 1, aiTake: 1.3, htOff: 3.2, htCard: 25, htAnyKey: false,
    goalWaitMs: 1450, goalFrames: 330, goalSlowPre: 1.7, goalSlow: 2.0, skipAfter: 0.4, evReplays: false },   // v0.10.4 (Luca 06:24: "dont do replays mid game being live, its janky"): big saves / near misses go to HIGHLIGHTS in CLASSIC too
  // A: end to end in ~12 s, snappier starts and turns, sprint more, dribbles that go somewhere. D: kick-off 0.6 s,
  // restarts taken after ~0.8 s, one short (~4 s) goal replay skippable at once, saves / near misses only in
  // HIGHLIGHTS, half time an 8 s card that any key skips
  arcade: { RUN: 6.0, SPRINT: 8.8, ACC: 16, DEC: 32, SPRINT_DRAIN: 0.15, WITH_BALL: 0.95, WITH_BALL_SPRINT: 0.97,
    koFreeze: 0.6, half2Freeze: 0.8, spFreeze: 0.3, deadT: 0.4, aiTake: 0.25, htOff: 1.2, htCard: 8, htAnyKey: true,
    goalWaitMs: 900, goalFrames: 160, goalSlowPre: 1.0, goalSlow: 0.9, skipAfter: -1, evReplays: false },
};
let PACE_MODE = (() => { try { const v = localStorage.getItem('hc2-pace'); return PACE[v] ? v : 'classic'; } catch (e) { return 'classic'; } })();
function paceK() { return window.__lab ? PACE.classic : PACE[PACE_MODE] || PACE.classic; }
// (called by setPace and at every kick-off: the start screen's script runs before this file loads. It writes only when
// the picked preset isn't the one in the globals, so a CLASSIC page never touches them - nor a tool's own tuning.)
let PACE_SET = 'classic';
function applyPace() { if (window.__lab || PACE_MODE === PACE_SET || !PACE[PACE_MODE]) return; const P = PACE[PACE_MODE];
  RUN = P.RUN; SPRINT = P.SPRINT; ACC = P.ACC; DEC = P.DEC; SPRINT_DRAIN = P.SPRINT_DRAIN; WITH_BALL = P.WITH_BALL; WITH_BALL_SPRINT = P.WITH_BALL_SPRINT; PACE_SET = PACE_MODE; }
function setPace(v) { if (!PACE[v]) return; PACE_MODE = v; try { localStorage.setItem('hc2-pace', v); } catch (e) {} applyPace(); }
// ball (a real football: air drag ~0.013/m; grass: skids first, then rolls)
const G = 9.81, AIR_K = 0.012, ROLL_K = 0.03, DRIB_DEC = 5.0, KICK_MAX = 30;
let SKID_DEC = 8.6, ROLL_DEC = 5.4, SHOT_K = 1;   // v0.8: tunable from the Test Lab (grip, shot power)   // v0.7: grippier grass (Luca: less slide)
// v0.8.1 bounce from real numbers (Luca: "too bouncy, study real balls"): FIFA's natural-pitch test wants a 0.60-1.00 m
// rebound from a 2 m drop (restitution ~0.55-0.7), and grass soaks up more of a hard landing, so restitution falls
// from BOUNCE_Z on a soft landing to BOUNCE_Z - BOUNCE_DROP on a hard one (12 m/s+). Each bounce also loses speed to
// friction (BOUNCE_MU), at most down to rolling speed (3/5 of it for a hollow ball). Under BOUNCE_MIN it just rolls.
// v0.8.2: grass grips a skimming ball harder (MU 0.5 -> 0.9): FIFA's angled test (50 km/h at 15 deg) keeps 45-70% of the
// pace; it kept 77% and a skimming 25 m/s shot ran on for 37 m. Steep landings are unchanged (capped at rolling speed).
let BOUNCE_Z = 0.64, BOUNCE_X = 0.84, BOUNCE_MIN = 1.1, BOUNCE_DROP = 0.16, BOUNCE_MU = 0.9;   // v0.8: less slide, more bounce (Luca)                       // v0.7: livelier bounce (was 0.55 / 0.8 / 1.2)
// v0.9.9 (Luca: "increase or decrease ... magnetism of ball to legs, different lobs" in the Test Lab): numbers that
// were written inline, named so the Lab's FREE PLAY knobs can change them. At these values the game plays exactly as before.
let BALL_MAG = 1;                                  // how close the dribbled ball stays to the feet (ball.js dribble)
let LOB_H = 1;                                     // lob height: scales the arc of open-play and power lobs (ball.js lobApex)
let LOB_MAX = 50;                                  // how far a fully held power lob goes, metres (a tap: 12 m)
// t-008 LOB REMAKE (Luca 24 Oct 05:57: "the lob pass needs to be re made completely [...] make the lob a hold until its
// the right spot then release is the actual lob kick"). Every number of the hold-to-aim lob, the receiving run and the
// AERIAL BATTLE in one place, so they can be tuned in the Lab (docs/lob-chip.md "8. Step 2, Luca's version")
const LOB2 = {
  tapT: 0.18,          // LOB let go sooner than this = the instant lob to a team-mate (as before)
  ringV: 16,           // how fast the stick moves the landing ring, m/s (at full speed)
  ease: 0.22,          // seconds of stick to reach that speed (from easeK of it): a tap of a key nudges the ring
  easeK: 0.25,
  minD: 8, maxD: 45,   // the ring stays this far from the kicker (metres), and on the pitch
  startD: 20,          // where it starts with no team-mate that way: this far ahead
  magnet: 3,           // a team-mate this close to the ring: it settles on the spot he'll reach (he walks there)
  magnetOut: 3.8,      // ...and lets go of him past this (no flicker on the edge)
  magnetPull: 0.6,     // how far towards him the ring settles (0 = where you put it, 1 = on him)
  aimSlow: 0.35,       // the kicker's speed while he aims (x his top speed): he shields it, the ring does the moving
  clearZ: 3.2,         // a lob climbs at least this high over an opponent in its path
  apexMax: 9,          // ...but never higher than this
  drivenD: 22,         // a clear lane and shorter than this: a flatter, driven ball (peak drivenLo-drivenHi m)
  drivenLo: 2.3, drivenHi: 3.3,
  markDelay: 0.35,     // the receiver's marker reads the drop this much later than the receiver (s)
  shootWin: 1.4,       // SHOOT pressed while a lob drops to you is kept this long (s, at most) for the header / volley
};
const AERIAL = {
  on: true,            // the Lab's switch
  gap: 2.3,            // a clear contest: attacker and defender both within this of the drop and of each other (m)
  reach: 3.0,          // (measured just before the drop: either may still be closing in, so this is a little wider)
  chance: 0.9,         // not every contest becomes a battle: the rest are the quick duel (lobDuel)
  cool: 5,             // never two within this many seconds of play
  mashT: 1.2,          // how long you mash (s, real time)
  introT: 0.25,        // the slow-motion lead-in before MASH! (s)
  outroT: 0.2,         // the result frozen a beat before play goes on (s)
  holdZ: 2.15,         // the ball hangs at this height while they fight for it
  cpuRate: 6.5,        // the computer's presses per second at base (NORMAL); its level scales it (difficulty.js `mash`)
  cpuJit: 0.18,        // ...a little random, each battle
  hsDist: 1.4,         // head start (in presses) per metre closer to the drop
  hsFace: 0.8,         // ...for facing it
  hsRun: 0.6,          // ...for the man it was meant for (he has the run on it)
  hsSpring: 0.6,       // ...for fresh legs (stamina: a higher jump)
  hsMax: 3,
  clearRand: 0.5,      // the loser clears it: this much random direction, the rest by position (up the pitch, to the near touchline)
};
// t-010 TAP KICK (Luca 24 Oct 05:57: "the kick if just pressed quickly once so not held should be a snappier kick from
// up close and it drops off [...] it follows a predictable path which just faces the direction of the arrow"): SHOOT
// tapped = a low stab along your arrow that dies on the grass; held = the power shot as before. OFF in matches until
// Luca's OK (the Test Lab turns it on; ADD TO GAME there says what flipping it changes) - with it off nothing differs.
let TAP_KICK = false;
const TAP = {
  tapT: 0.15,          // SHOOT let go sooner than this (s) = the tap kick; held longer = the power shot
  speed: 18,           // off the boot, m/s (~65 km/h; ~55 km/h by 6 m, ~38 by 10 m: soft enough at a set keeper's body that he holds most)
  vz: 0.25,            // a little hop off the toe, then it skims the grass
  grip: 3.5,           // extra slowing on the grass (m/s^2): it's dead by ~15 m - a close-range finish, useless from 20 m
  err: 0.02,           // aim error, radians either way (~1 degree): it goes where the arrow points
  errRun: 0.03,        // ...a little more sprinting or tired
  aiD: 9,              // the computer taps it in from this close (metres from the goal's centre)...
  aiGap: 0.6,          // ...when the corner away from the keeper is this much past his reach
};
const BASE_PHYS = { SKID_DEC, ROLL_DEC, BOUNCE_Z, BOUNCE_X };   // v0.8.5: the weather scales these (clear = as tuned)
// t-013 GOAL PHYSICS (Luca 24 Oct 14:04: "a net through which the ball can interact with slight give ... more dynamic
// feedback when the ball hits the post ... the keeper, when he blocks a lot of shots but can't grab it, but it breaks his
// guard, a lot should go more up dramatically ... be moderate"): the net catches the ball like a spring, the posts and bar
// are round with real rebounds, a parry or a broken guard can pop the ball up. All of it behind GOAL_PHYS:
// null = ON in the Test Lab, OFF in matches (until Luca's OK); true / false forces it (tools/soak.js GOAL_PHYS=1).
let GOAL_PHYS = null;
const gpOn = () => GOAL_PHYS ?? !!window.__lab;
// t-024 OFFSIDE (Luca 25 Oct 07:14: "OFF SIDE rule MANDATORY just make it smooth"): IFAB Law 11, simplified - the rule
// is in matchflow.js (offKick / offWatch / offCall), the computer playing to it in teamai.js. ON by default and in every
// match; Options can switch it OFF for testing (kept like the other options). The Test Lab plays it in the OF group and
// in the tests that run the real team AI; its other set-ups are single moments with half a team, so it stays out of them.
const OFFSIDE = {
  LEVEL: 0.3,       // within 30 cm of the second-last defender = level = onside (the assistant gives the attacker that)
  HOLD: 0.7,        // the computer's runners wait this far behind the line until the pass is played (on his shoulder)
  SLIP: 4.0,        // ...give or take: how tight they play it varies by up to this much (a step too far now and then)
  READ: 3.0,        // the passer's misread: a man up to this far past the line can still look onside to him
                    // (SLIP / READ are the dial for how often the computer gets caught: 12-match soak 0.3 a match with these,
                    // 0 with 1.6 / 0.6 - its forwards rarely reach their line in this game's shape, so the flag stays rare)
  FLAG: 1.5,        // seconds the flagged man stays marked
};
let OFFSIDE_ON = (() => { try { return localStorage.getItem('hc2-offside') !== 'off'; } catch (e) { return true; } })();
function setOffside(v) { OFFSIDE_ON = !!v; try { localStorage.setItem('hc2-offside', v ? 'on' : 'off'); } catch (e) {} }
const offsideOn = () => OFFSIDE_ON && !window.HC2_NO_OFFSIDE;
// every number in one place, to tune in the Lab (ball.js gpNet / gpWood / gpPop, world.js netDraw)
const GP = {
  // the net (metres, per kg of ball): as deep as the art draws it - 2 m back at the grass, the back 2 m high, the roof
  // sloping down to it from the bar. A ball pushing into it meets a spring (K) with damping (C, half of critical): a
  // 110 km/h shot stretches it ~65 cm, a 55 km/h one ~35 cm (netMax at most); at the deepest point the mesh holds it a
  // beat (netHold s, at most, for a hard one) and lets it drop; while it lies against the mesh the mesh grips it (netFric)
  netD: 2.0, netBZ: 2.0, netK: 600, netC: 25, netMax: 0.9, netFric: 5, netHold: 0.32, holdDamp: 12,
  // the drawn net: the bulge's radius (m, it widens as it stretches), the mesh's own ringing once the ball is gone
  // (Hz, damping ratio), the most a cell moves (px), the cells' size (px), a small ripple running out from the hit
  netSig: 0.7, netHz: 3.2, netZeta: 0.2, drawMax: 28, cell: 8, ripPx: 2.5, ripV: 170, ripL: 26, ripTau: 0.55,
  // woodwork: posts / bar 12 cm across (Law 1); restitution off the aluminium falls from woodE on a soft touch to
  // woodE - woodEDrop on a hard one (the ball squashes more); friction woodMu gives spin, which grips on the next
  // bounce (spinGrip); a square, hard hit on the round post lifts the ball a little (postLift x speed in, barLift
  // for the bar) so a rebound comes back at a height a player can meet. A second touch within 0.4 s loses more (no ping-pong)
  postR: 0.06, ballR: 0.11, woodE: 0.68, woodEDrop: 0.24, woodMu: 0.25, spinGrip: 0.55, postLift: 0.2, barLift: 0.08, woodAgain: 0.6,
  // the keeper's touch: the chance a parry (by its pace) or a broken guard loops the ball UP, and how; on EASY the
  // computer's side gets fewer of the pop-ups that help it (easyK)
  parryPop: 0.42, breakPop: 0.45, popVz: [5.5, 8], popOut: [1.5, 4.5], popSide: [0.5, 3], breakOn: [1.2, 4], breakBack: [2, 4.5], easyK: 0.5,
};
const HALF_END = [45, 90, 105, 120];                                // v0.8.5: the minute each half ends (3 + 4 = extra time)
const RULE_OPTS = {                                                 // v0.8.5 match settings (arenas / light / weather: placeholders for the art)
  arena: [['loo', 'HET KLEINE LOO'], ['epic', 'EPIC STADIUM'], ['vuc', 'VUC GROUND']],
  tod: [['day', 'DAY'], ['sunset', 'SUNSET'], ['night', 'NIGHT']],
  weather: [['clear', 'CLEAR'], ['rain', 'RAIN'], ['snow', 'SNOW']],
  ending: [['none', 'A DRAW'], ['et', 'EXTRA TIME'], ['golden', 'GOLDEN GOAL + PENS'], ['etpens', 'EXTRA TIME + PENS'], ['pens', 'PENALTIES']],
};
const ARENA_TINT = { loo: 0xffffff, epic: 0xe6ecff, vuc: 0xfff2de };
const COIN_Y = Math.round(VIEW_H * 0.555), COIN_S = 2.4;                                    // the toss: coin centre on screen + its zoom
const COIN_SPIN = ['rise-0', 'rise-1', 'rise-2', 'edge', 'arrow-2', 'arrow-1', 'arrow-0', 'arrow-1', 'arrow-2', 'edge', 'rise-2', 'rise-1'];   // one turn of the coin (PixelLab faces)
const mulCol = (a, b) => (((((a >> 16) & 255) * ((b >> 16) & 255) / 255) << 16) | ((((a >> 8) & 255) * ((b >> 8) & 255) / 255) << 8) | (((a & 255) * (b & 255)) / 255)) >>> 0;
// v0.7 kick timing: the ball leaves on the frame where the boot meets it (frame index in the PixelLab strip, played at 18 fps)
const KICK_HIT = { pass: 2, kick: 2, shot: 3, super: 8, sp1: 6, sp2: 8, punt: 6, chip: 3, tap: 3, cpass: 3, cthru: 4, clob: 4 }, KICK_FPS = 18;   // tap: t-010 PixelLab batch 16 (the toe meets it on frame 3)   // cpass / cthru / clob: t-011 batch 17 (contact on frames 3 / 4 / 4)   // chip: v0.9.4 PixelLab batch 15 (the stab under it)   // punt: v0.8.1 keeper drop-kick (PixelLab batch 13)
const KICK_RATE = { pass: 22, shot: 22, super: 14, sp1: 18, sp2: 16, punt: 16, chip: 20, tap: 24, cpass: 18, cthru: 18, clob: 18 };   // (t-010: the tap is played quick - snappy, it leaves in 0.15 s)          // sp1 spin strike, sp2 thunder strike (batch 11b)                               // batch 11 strips play a little faster (super: the leap takes its time)
const kickRate = a => KICK_RATE[a] || KICK_FPS;
// keeper: how fast he flies sideways in a dive (m/s) and how far past his centre his hands reach when stretched (m)
let GK_DIVE_V = 5.2, GK_REACH = 1.0;               // v0.9.9: let, for the Test Lab's keeper knobs
// the ball is drawn bigger than life, like every arcade football game (about a quarter of a player's height)
const BALL_S = 1.75, PEN_BALL_S = 1.9;
const ballPx = () => MAN.ballPx || 16;                  // the PixelLab ball's size (16 or 24 px); drawn natively when it is 24
const ballS = () => ballPx() >= 24 ? 1.0 : BALL_S;
let MAN = null, CX = 0, FAR_H = 900;

const scaleAt = ym => S_FAR + (S_NEAR - S_FAR) * (ym / PITCH_W);
const wx = (xm, ym) => CX + (xm - PITCH_L / 2) * PX_X * scaleAt(ym);
const wy = (ym, z = 0) => FAR_H + (ym + RUNOFF_Y) * PX_Y - z * PX_H;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const len = (x, y) => Math.hypot(x, y);
const dirIndex = (vx, vy) => ((Math.round(-Math.atan2(vy, vx) / (Math.PI / 4)) % 8) + 8) % 8;
const dirVec = i => { const a = -i * Math.PI / 4; return { x: Math.cos(a), y: Math.sin(a) }; };
const rnd = (a, b) => a + Math.random() * (b - a);
const GAME_VER = 'v0.11.1';

// v0.9.5 split: Match's methods live in the area files; each file adds its group with hc2Mix (the same as writing them
// in the class body: non-enumerable, writable, configurable, strict)
function hc2Mix(C, methods) { for (const [k, d] of Object.entries(Object.getOwnPropertyDescriptors(methods))) { d.enumerable = false; Object.defineProperty(C.prototype, k, d); } }
