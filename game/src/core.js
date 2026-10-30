// HELP OUT HAGUE CUP II - web game v0.15.1 (Luca OK'd PRs #59, #60, 30 Oct - two QA fixes from the overnight run: Phaser's own unused sound system is switched off, so a failed audio start when the tab comes back is no longer a crash (#59); Bug Watch no longer flags a keeper who is up for a last-minute corner on purpose (#60, PR #58's keeper))
// HELP OUT HAGUE CUP II - web game v0.15.0 (Luca OK'd PRs #55-#58, 29 Oct: SMARTER TEAM AI stage 2 - the team brain (brain.js): players keep their jobs, one presses + one covers, a move list (AI_MOVES), the 1-2, chasing late / protecting a lead, team style dials (every team NEUTRAL until Luca picks), Rise Warrior reads your habits (#58, worker-f); ATTACK BALANCE - sprinting no longer protects the ball, your lob from wide is a real cross to a runner, the SP meter fills faster (CLASSIC 1.4x, ARCADE 2.0x), a short cut-in on every special shot (#57, the co-designer); four QA fixes - every attempt counts as a shot, a hard cap on a kick waiting for its contact frame, a second match starts clean, GAME FROZE clips tell a paused browser from a hang (#55, t-035); the LAN connection test page in tools/lan (#56, t-041, not in the game))
// HELP OUT HAGUE CUP II - web game v0.14.0 (Luca OK'd PRs #51-#54, 29 Oct: the TAP KICK in every match (t-037); GOAL PHYSICS in every match - round posts and bar with real rebounds, parries that loop up (t-039); ARCADE SPECIALS part 2 - a special dribble, combo specials, team signature moves, higher leaps (the co-designer, ARCADE only); a failed audio start no longer counts as a crash (QA))
// HELP OUT HAGUE CUP II - web game v0.13.1 (Luca OK'd PR #50, 29 Oct - his 00:38 "the test lab must be completely fixed, I cannot navigate it, it's missing moves": THE TEST LAB REWORK - a clickable BACK / NEXT / ALL TESTS / FREE PLAY bar, a scrolling searchable ALL TESTS menu in sections, the Lab opens on FREE PLAY with RESUME, 58 FREE PLAY move buttons tagged IN THE GAME / LAB ONLY; Lab files only, matches unchanged)
// HELP OUT HAGUE CUP II - web game v0.13.0 (Luca OK'd PRs #43-#49, 27 + 29 Oct: AERIAL BATTLES only in the box, header v header or volley v volley, a win is a shot at goal and the defender goes down, a loss is cleared, an honest SPACE mash; LOB RECEIVES uncontested when the ball is clearly his, chest / thigh trap into his run; the CORNER BLACKOUT cut; KEEPER DIVES drawn sideways, the special save's flash on his gloves; a special save off his line still meets an angled special; the smarter-AI plan + tools)
// HELP OUT HAGUE CUP II - web game v0.12.4 (Luca OK'd PRs #36, #37, #38, 25 Oct: THE SPECIAL-SAVE CLASH - a charged save covers the whole goal, then power against power: held / bounces off / hands blown away / the body; SET PIECES WITH A RHYTHM - players jog into shape before every restart, CLASSIC and ARCADE timings, a press skips; KEEPER HANDS - the dive grabs the ball into his gloves, he gets up with it and carries it (PixelLab batch 21 carry walk / jog), the computer's keeper walks a calm catch out)
// HELP OUT HAGUE CUP II - web game v0.12.3 (Luca OK'd PR #35, 25 Oct: THE KEEPER'S RANGE - "gk needs to approach from further range to close in on attackers": on a breakaway he starts closing at 32 m, comes out to the edge of his box as the striker gets within ~20 m and attacks the ball from ~9 m away; dives with his hands only inside his box)
// v0.12.2 (Luca OK'd PRs #34, #31, #33, 25 Oct ~15:30: THE LIVING NET in every match - it stretches by shot strength and special level, the ball rolls in it, an LV3 special rips through, shown in every replay; ARCADE throw-ins again (no touchline boards; the byline boards stay); the house rule 'Think like football')
// v0.12.1 (Luca OK'd PR #32, 25 Oct 15:14 - his INSTA FLAG: a defender's standing tackle stole the ball off a striker in his aerial special's wind-up, so a LV3 aerial was "completely blocked"; now that tackle lunges at nothing)
// v0.12.0 (Luca OK'd PRs #23-#30, 25 Oct 13:42 - his 06:56 / 07:04 / 07:14 list: the TACKLE reworked (a longer slide, a get-up, a miss costs ~1.4 s: no spamming); the LOB two ways (AUTO: to the team-mate your arrow points at, a smooth camera - the default; RING: the landing ring, no arc, the camera doesn't follow - Options > LOB AIM); CHARGED HEADERS + VOLLEYS (hold SHOOT, let go at the contact: a power strike, subtle flash + sparks; PixelLab batch 20's power header, whipped and front volleys, flat-out diving header, struck on their contact frames); OFFSIDE in every match (instant OFFSIDE! call, quick free kick, red pass marker on an offside man, runs on the shoulder); ARCADE gets intense (boards instead of throw-ins / corners, rebounds up for aerials, more SP, quick restarts; with the co-designer's arcade-2 mash duels); BUG WATCH clips real bugs, not animation flicker; the NET preview in the Test Lab (NT); the keeper's starfish redone (batch 18b))
// v0.11.1 (Luca OK'd PR #22 + #20 + #21, 25 Oct: THE KEEPER REBUILT after his 02:58 report "you could just walk around it and score" - he tracks the ball a beat ahead, closes you down and steps up in a 1v1, dives at your feet (SMOTHERED! / BLOCKED!), a starfish block for close shots, faces the ball while he side-steps and backpedals, gets up after a dive; PixelLab batch 18 keeper moves; normal saves use the batch 16 dives; blocked players step round (PR #20); Bug Watch no longer counts the blank animation as a flicker (PR #21))
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
// the co-designer, 29 Oct: "we also want it so that special events are happening more often". The SP meter fills
// faster on both paces (spGain): CLASSIC 1 -> 1.4 (a bar every ~48 s of play, was ~67 s), ARCADE 1.75 -> 2.0 (~34 s,
// was ~38 s); both sides alike, so it isn't easier. Luca set the time-only fill (v0.8.1) - his OK on the new rate.
const PACE_OPTS = [['classic', 'CLASSIC'], ['arcade', 'ARCADE']];
const PACE = {
  classic: { RUN: 5.2, SPRINT: 7.7, ACC: 12, DEC: 26, SPRINT_DRAIN: 0.23, WITH_BALL: 0.9, WITH_BALL_SPRINT: 0.94,
    koFreeze: 1.2, half2Freeze: 1.6, spFreeze: 0.5, deadT: 1, aiTake: 1.3, htOff: 3.2, htCard: 25, htAnyKey: false,
    goalWaitMs: 1450, goalFrames: 330, goalSlowPre: 1.7, goalSlow: 2.0, skipAfter: 0.4, evReplays: false,
    KICK_MAX: 30, SHOT_K: 1, GRIP: 1, spGain: 1.4, shotRange: 1, shotWant: 1, chargeT: 0.8, gkCover: 0.95, gkAnswer: 0.55, passArrive: 1, lobH: 1, crossH: 1,
    hsPass: 1, hsShot: 1, trails: false, advantage: false, duels: false, duelCool: 5, duelGap: 30, pressK: 1, cmtK: 1, shK: 1, shAdd: 0, aiBurst: 1, burstT: 0.55, headZ: 2.7 },   // v0.10.4 (Luca 06:24: "dont do replays mid game being live, its janky"): big saves / near misses go to HIGHLIGHTS in CLASSIC too
  // A: end to end in ~12 s, snappier starts and turns, sprint more, dribbles that go somewhere. D: kick-off 0.6 s,
  // restarts taken after ~0.8 s, one short (~4 s) goal replay skippable at once, saves / near misses only in
  // HIGHLIGHTS, half time an 8 s card that any key skips
  arcade: { RUN: 6.0, SPRINT: 8.8, ACC: 16, DEC: 32, SPRINT_DRAIN: 0.15, WITH_BALL: 0.95, WITH_BALL_SPRINT: 0.97,
    koFreeze: 0.6, half2Freeze: 0.8, spFreeze: 0.3, deadT: 0.4, aiTake: 0.25, htOff: 1.2, htCard: 8, htAnyKey: true,
    goalWaitMs: 900, goalFrames: 160, goalSlowPre: 1.0, goalSlow: 0.9, skipAfter: -1, evReplays: false,
  // arcade-2 (the co-designer, 25 Oct: "the same energy as football anime. Exciting, fast pace, more than human almost" -
  // NOT easier: what helps the attacker helps the computer too, and keepers answer with MORE special saves, not slower
  // reactions). 1 more big moments: the SP meter fills 1.75x, both sides shoot from ~20% further and sooner, power shots
  // charge 25% quicker, shots +12% (KICK_MAX 33), keepers answer a shot they'd lose with a special save far more often.
  // 2 the MASH duel also on 50-50 loose balls and contested tackles. 3 a longer sprint dash, higher headers, hot trails on
  // hard shots. 4 passes 20% firmer, lobs ~8% less hang time (0.85 of the height: at 0.72 defenders headed them away and the AERIAL BATTLE nearly vanished), a little less grass grip.
  // 5 no hit-stop on passes (more on shots), advantage: a foul stops play only for a card or a penalty.
    KICK_MAX: 33, SHOT_K: 1.12, GRIP: 0.88, spGain: 2.0, shotRange: 1.2, shotWant: 0.85, chargeT: 0.6, gkCover: 0.7, gkAnswer: 0.85, passArrive: 1.2, lobH: 0.85, crossH: 1,
    hsPass: 0, hsShot: 1.35, trails: true, advantage: true, duels: true, duelCool: 3.5, duelGap: 9, pressK: 1.3, cmtK: 1.35, shK: 1.5, shAdd: 0.08, aiBurst: 1.4, burstT: 0.8, headZ: 3.1 },
};
// t-020 ARCADE GETS INTENSE (Luca 25 Oct 06:56: "arcade should have a smaller pitch, more rebounds that lead into aerials,
// more energy sp, make the game feel incredibly intense in a dynamic sense"). On top of arcade-2. CLASSIC never reads
// these: every use is behind paceK().arcade (false on CLASSIC, true on ARCADE).
PACE.classic.arcade = false; PACE.classic.cutK = 1;
PACE.arcade.arcade = true;
// t-029 SET-PIECE SETUP (Luca 25 Oct 14:59: "fix the pacing for set pieces"): how long each restart's setup lasts before
// you aim / the computer takes it (matchflow.js spSetup: the players jog into the shape, the taker places the ball).
// Seconds; v = the jog into the shape (m/s), walk = the taker's last steps, aiAfter = the computer's breath once it is set
// (it was aiTake from the teleport), gk = the goal kick's jog-in after its wipe. Your own set piece skips once it is mostly in.
// t-032 (Luca 25 Oct 17:53: "a black out cut that smoothly transitions to corner kick"): a corner's cut is a fade to
// black instead of the TV wipe - boOut = the eased fade out, boHold = fully black (the men are placed half-way through),
// boIn = the fade back in on the taker at the flag. Well under a second, as FIFA / PES do it; ARCADE about half
// (Sensible Soccer barely cuts at all). boSkip: how much faster the fade runs once you press to skip.
PACE.classic.setup = { throw: 1.5, offside: 2.5, fk: 2.5, fkNear: 4, corner: 4, gk: 1.0, v: 3.8, walk: 1.9, aiAfter: 0.5, boOut: 0.35, boHold: 0.15, boIn: 0.35, boSkip: 3 };
PACE.arcade.setup = { throw: 0.8, offside: 1.5, fk: 1.5, fkNear: 2.5, corner: 2.5, gk: 0.6, v: 4.8, walk: 2.4, aiAfter: 0.15, boOut: 0.18, boHold: 0.08, boIn: 0.18, boSkip: 3 };
PACE.arcade.cutK = 0.65;            // the special-save cut scene 1.5 s -> ~1 s: the bang without the wait (design E)
const ARCADE = {
  // 1 REBOUNDS: invisible boards along the touchlines and the bylines (not the goal mouth under the bar), so the ball never
  // goes out for a throw-in, goal kick or corner. It comes back lively: e = how much of the speed INTO the board it keeps,
  // tang = of the speed ALONG it; a ball low on the grass pops up off the board (pop x the speed into it, at most popMax
  // m/s up: square on, a 14 m/s drive comes back ~4 m high, a firm 8 m/s pass ~1.3 m - the drop is at header / volley
  // height; at 0.5, 3 rebounds in 10 went up for a header, at 0.65 about half, and ~4 goals a match). popMin: slower than
  // this it just rolls back. The pop leans on the angle (a square hit pops most), never on dice, so the AI's predicted
  // path (ball.js predict) is the path the ball really takes.
  boards: { e: 0.75, tang: 0.88, pop: 0.65, popMax: 10, popMin: 2.5, popZ: 1.0,
    // t-026 (Luca 25 Oct 14:42, after playing v0.12.0: "scrap the board for throws, that's bad"): the touchline boards are
    // off - a ball over a touchline is a throw-in again, on ARCADE too. The byline boards (no goal kicks / corners, the
    // rebounds in front of goal that go up for headers) stay. true = the v0.12.0 touchline boards back.
    touch: false },
  // 2 AERIALS: a rebound that will go up past headZ becomes a loose high ball "aimed" at the nearest man of the side that
  // touched it last (the way a lob is), so the game's own lob machinery takes over: he times his run under the drop,
  // their nearest man contests it, the drop is a duel / the AERIAL BATTLE, headers, volleys, the aerial specials.
  // run = how far (m) a man will come to attack a rebound; the nearest of EACH side within it goes (teamai.js).
  reb: { headZ: 1.3, run: 22, airT: 2.5 },
  // 3 SP: arcade-2's 1.75x fill stays; plus a little (bars, before the 1.75x) for winning an AERIAL BATTLE, a header /
  // volley straight off a rebound, and a special save (specials.js spBonus)
  sp: { aerial: 0.07, rebound: 0.08, save: 0.1 },
};
// ======================================================================= t-028 THE SPECIAL-SAVE CLASH (Luca 25 Oct 14:59: "the keeper can
// cover the whole goal when using a special save move, so you can't shoot around the gk when the special move is
// activated, but a special shot can still go through the hands after (blowing the hands away, or the body for a very
// strong shot) if it's stronger, or bounce off etc"). specials.js clash / clashTick / clashEnd. One table for the bands:
// r = the shot's power / the save's (spP v SAVE_POWER), shaken by the dice (r x 1 +- jit), then the first band it's under:
//   held   the save clearly stronger (LV1 v LV2 0.71, LV1 v LV3 0.5): caught, he lands with it
//   bounce close (the same level 1.0): parried back into play (a live rebound), or tipped over / round for a corner
//   hands  the shot a bit stronger (LV2 v LV1 1.4, LV3 v LV2 1.43): his arms knocked back, it goes on into the net
//   body   the shot much stronger (LV3 v LV1 2.0): he's blasted back into the net WITH the ball
// Power decides most of it: with jit 0.15, LV2 v LV1 is a bounce about 1 in 7, LV3 v LV1 always the body.
const CLASH = {
  bands: [[0.85, 'held'], [1.25, 'bounce'], [1.65, 'hands'], [Infinity, 'body']], jit: 0.15,
  tip: 0.5,                   // of the bounces: tipped over / round the post (a corner); else parried back out
  hold: 0.6, holdArcade: 0.4, // s (real time) the ball grinds against his gloves - Inazuma's beat, never a wait (ENTER cuts it)
  skip: 0.12,                 // ENTER skips it after this (the same key as the cut scene)
  slow: 0.2,                  // the world's animations while it holds: a small slow-mo
  carry: 0.4,                 // s THE BODY: he and the ball are driven back over the line together (Captain Tsubasa), then it's in
  reach: 4.3,                 // with a special save on he gets to anything on target: |y - 34| under this (the posts are 3.66) and under 3.2 m
};
// t-020: the Test Lab plays CLASSIC, except a test that names its pace (the AR group plays ARCADE's rebounds and SP)
function paceK() { return window.__lab ? (window.__labPace && PACE[window.__labPace]) || PACE.classic : PACE[PACE_MODE] || PACE.classic; }
let PACE_MODE = (() => { try { const v = localStorage.getItem('hc2-pace'); return PACE[v] ? v : 'classic'; } catch (e) { return 'classic'; } })();
// (called by setPace and at every kick-off: the start screen's script runs before this file loads. It writes only when
// the picked preset isn't the one in the globals, so a CLASSIC page never touches them - nor a tool's own tuning.)
let PACE_SET = 'classic';
function applyPace() { if (window.__lab || PACE_MODE === PACE_SET || !PACE[PACE_MODE]) return; const P = PACE[PACE_MODE];
  RUN = P.RUN; SPRINT = P.SPRINT; ACC = P.ACC; DEC = P.DEC; SPRINT_DRAIN = P.SPRINT_DRAIN; WITH_BALL = P.WITH_BALL; WITH_BALL_SPRINT = P.WITH_BALL_SPRINT;
  KICK_MAX = P.KICK_MAX; SHOT_K = P.SHOT_K; PACE_GRIP = P.GRIP; PACE_SET = PACE_MODE; }   // (arcade-2: shot power and grass grip too)
function setPace(v) { if (!PACE[v]) return; PACE_MODE = v; try { localStorage.setItem('hc2-pace', v); } catch (e) {} applyPace(); }
// ball (a real football: air drag ~0.013/m; grass: skids first, then rolls)
const G = 9.81, AIR_K = 0.012, ROLL_K = 0.03, DRIB_DEC = 5.0;
let KICK_MAX = 30, PACE_GRIP = 1;                   // arcade-2: let, for the PACE preset (ARCADE 33 m/s, 0.88 of the grass grip)
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
// t-019 LOB AIM: TWO VERSIONS (Luca 25 Oct 06:56: "the lob is still a big problem right now its too sensitive hard to
// use and the camera is janky. make 2 versions - 1 make it so a lob target is determined by the direction of where the
// arrow is pointing and is closest or something (closer to fifa) - second version is still the circle on the ground but
// no arc [...] make it so the camera doesnt follow - try make it smooth"). Pause > Options and the start screen: LOB AIM
// AUTO (the default) / RING, remembered per browser like PACE. The Lab tests set it per test (LB / LV).
const LOB_AIM_OPTS = [['auto', 'AUTO'], ['ring', 'RING']];
let LOB_AIM_MODE = (() => { try { const v = localStorage.getItem('hc2-lobaim'); return LOB_AIM_OPTS.some(o => o[0] === v) ? v : 'auto'; } catch (e) { return 'auto'; } })();
function setLobAim(v) { if (!LOB_AIM_OPTS.some(o => o[0] === v)) return; LOB_AIM_MODE = v; try { localStorage.setItem('hc2-lobaim', v); } catch (e) {} }
const LOB_AIM = {
  // AUTO (FIFA-style): the lob goes to the team-mate who best fits your arrow; hold = a bit longer, tap = the quick one
  cone: 38,            // degrees either side of the arrow (8 key directions are 45 apart: everyone is in some arrow's cone)
  minD: 8, maxD: 45,   // team-mates this far from the kicker count (closer: a lob is the wrong ball; further: out of range)
  angW: 0.6,           // a man at the cone's edge counts as this much further away (x his distance): the arrow matters
  pressR: 5,           // an opponent this close to where it would drop marks him...
  pressW: 5,           // ...costing (pressR - his distance) x this many metres: a man much further on but clearly freer wins
  keep: 0.85,          // the pick shown stays unless another costs less than this x his (no flicker while held)
  step: 1.2,           // it lands this far ahead of him on his run (towards their goal when he stands), so he takes it in stride
  holdT: 0.7,          // holding this long (s) after the tap window = the longest version...
  holdApex: 0.35,      // ...up to this much higher (x the lob's height for the distance)
  holdStep: 3,         // ...and up to this many metres further on his run
  spaceMin: 14, spaceMax: 38,   // nobody in the cone: into space along the arrow, a tap this far, the full hold this far
  // RING: the t-008 ring without the arc, moving steadily (Luca: "too sensitive")
  ringV: 10,           // the ring's top speed, m/s (t-008: 16)
  ringUp: 0.16,        // seconds to get up to speed (a smooth ease, no jump)...
  ringStop: 0.05,      // ...and to stop when the stick is let go (short, so it stops about where you let go)
  magnetPull: 0.35,    // the light magnet: how far towards the team-mate it settles (t-008: 0.6)...
  magnetEase: 0.18,    // ...eased in over about this long, so the ring glides onto him instead of snapping
  ringOld: false,      // the t-008 ring's movement and magnet (the Lab's LV4 'before' only)
  // the camera (both): an open-play lob no longer rides up; the follow's lead eases instead of jumping at the kick and
  // the drop. camOld = the old camera (the Lab's LV5 'before' only)
  camLead: 2.2,        // how fast the lead follows the ball's speed while a lob is on (1/s; the normal follow: instant)
  camBlend: 0.9,       // RING: after the release the aim's framing hands over to the follow over this long (s)
  camOld: false,
};
const AERIAL = {
  on: true,            // the Lab's switch
  gap: 2.3,            // a clear contest: attacker and defender both within this of the drop and of each other (m)
  reach: 3.0,          // (measured just before the drop: either may still be closing in, so this is a little wider)
  chance: 0.9,         // not every contest becomes a battle: the rest are the quick duel (lobDuel)
  cool: 5,             // never two within this many seconds of play
  mashT: 1.2,          // how long you mash (s, real time; t-034: from the MASH SPACE! prompt, presses count from then)
  introT: 0.25,        // the slow-motion lead-in before MASH! (s; t-034: in the aerial battle, the rise to the contact - presses already count)
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
  // t-034 (Luca 25 Oct 19:14: "aerial battles only within gk box ... header on header or volley on volley ... if you win
  // as attack ball goes like a shot towards the goal and defender thrown to ground ... if defender wins it gets cleared
  // out ... make it feel impactful ... when you press is not consistent with click output")
  boxX: 16.5, boxY: 20.16, // the battle only when the drop is inside the defending side's penalty area (outside: lobDuel)
  volleyZ: 1.45,       // the contest point under this height = VOLLEY v VOLLEY, over it = HEADER v HEADER
  lowZ: 0.8,           // ...and nobody contests it under this (it's a ball at his feet)
  holdZv: 1.0,         // a volley battle: the ball hangs at waist height (a header battle: holdZ)
  mashTArc: 1.0,       // ARCADE's mash window (s, real time; CLASSIC: mashT)
  cpuReact: 0.12,      // the computer starts pressing this long after the prompt (s)
  barR: 12,            // the bar: this many presses from the middle to either end; one press = one step, and the end = won outright
  hsBar: 4,            // the head start, in whole steps, at most (it is where the bar starts)
  stopPress: 0.035,    // hit-stop on each of YOUR presses (s, real time)
  stopEnd: 0.13,       // ...and at the finish
  hdrV: [19, 25],      // the winning header at goal, m/s (a narrow win .. won outright): ~68-90 km/h
  volV: [23, 30],      // the winning volley at goal, m/s: ~83-108 km/h
  shotAim: 2.6,        // aimed this far off the middle of the goal, away from the keeper (posts at 3.66)
  shotSpread: 0.8,     // ...give or take this much (x the computer's finishing by level)
  clearV: 21, clearVz: 8,   // the defender's clearance: high and long, out of the box
  floorT: 0.85,        // the beaten defender on the ground (s), then his get-up (0.45 s): ~1.3 s out of it
};
// LOB RECEIVES (co-designer 28 Oct: "it's not a button mash every time. Only in very contested receives ... When it is
// clearly going to a certain receiver, it should be uncontested" + "chest trap and animate into running"). As the high
// ball comes down, one race decides it: when can the man it's meant for play it, when can their quickest man. Clearly his
// = uncontested (no battle, no duel: he heads, volleys or chests it into his stride); clearly theirs = their man wins it
// as before; only a near tie is the duel (in their box: t-034's battle with the mash). actions.js recvVerdict.
const RECV = {
  on: true,            // the Lab's switch (off = before: every contest a duel / battle)
  margin: 0.35,        // clearly his / theirs: first to it by this many seconds
  room: 2.0,           // ...or none of theirs can get within this of the ball by the time he plays it (m)
  zHi: 2.4, zLo: 0.5,  // the heights it can be played at as it comes down (head .. thigh)
  look: 0.8,           // decided this long before he can play it (s): the runs are made by then
  react: 0.1,          // the race: a reaction, then flat out to where he meets it
  reachR: 0.7,         // ...he plays it from this far away (m)
  boxOut: 0.9, boxT: 0.25, // their man whose way to it goes through the receiver (within this, m) loses this much (s): he's behind him
  shieldR: 1.8,        // clearly his: their men stay out of it while he's this close to the ball (m)
  // the CHEST / THIGH TRAP INTO THE RUN (FIFA's directional first touch): taken on the move, it drops into his stride
  chestZ: 1.1,         // chest 1.1-1.7 m, thigh 0.5-1.1 m
  trapT: 0.22,         // the chest frames (s; the trap move's 4 frames at 18 a second); running all the while
  dropVz: -1.5,        // the chest cushions it down in front of him (m/s): on the grass ~0.4 s after the contact
  thighVz: 0.6,        // the thigh pops it up a touch, then it drops into his stride
  runT: 0.45,          // contact to running with it at his feet (s): the touch can't be played on before that (or until it's down: 0.8 s at most)
};
// t-022 CHARGED HEADERS AND VOLLEYS (Luca 25 Oct 07:04: "headers and volleys can also be charged up and hit like a power
// shot (from kicks) if timed properly ... make the animation feel impactful (add frames flashing sparks etc but still
// subtle compared to special moves)"). Hold SHOOT as the ball comes in, let go as it reaches you: the hold sets the power
// (as the ground shot's charge), the release's timing against the contact sets how much of it you keep and how straight
// it goes. A tap is today's header / volley. Every number in one place for the Lab (group HV).
const AIR_CHARGE = {
  on: true,            // the Lab's switch (off = every header / volley is today's)
  tapT: 0.15,          // SHOOT held shorter than this (s) = a tap: today's header / volley, unchanged
  fullT: 0.8,          // held this long = full power (the ground shot's 0.8 s)
  sweet: 0.12,         // let go within this (s) before the contact = timed right: all the power, on target
  slop: 0.4,           // ...earlier than that the strike fades over this much more (s): weaker and wilder
  lateOff: 0.34,       // still holding as it reaches you = late: graded as a release this far off (s)
  minQ: 0.4,           // the worst-timed charged strike keeps this much of its power
  hdrLo: 12, hdrHi: 24,   // a charged header off the head (m/s): from today's ~45 km/h up to ~86 km/h
  overP: 0.88,         // power past this lifts it over the bar (as the ground shot: vz + (p - overP) * overK)
  overK: 30,
  err0: 0.35,          // aim error at the goal line (m) when timed right...
  err: 2.6,            // ...plus up to this much at the worst timing
  wild: 1.6,           // ...and up to this much extra lift (m/s): a mistimed one flies
  // the impact on a well-timed one (power past impP): clearly less than a special (no banner, no cut-in, no colour flash)
  impP: 0.3, flashT: 0.05, stop: 0.035, shakeMs: 90, shakeK: 0.0022,
  // the computer: charges cpuP of its headers / volleys at goal, power cpuLo-cpuHi, and lets go up to cpuJit s off the
  // contact x its finishing (difficulty.js shotErr, never under cpuFloor): Easy ~1 in 3 timed right, Normal ~2 in 5,
  // Hard ~2 in 3, Rise Warrior ~3 in 4
  cpuP: 0.3, cpuLo: 0.35, cpuHi: 0.8, cpuJit: 0.3, cpuFloor: 0.55,
};
// t-010 TAP KICK (Luca 24 Oct 05:57: "the kick if just pressed quickly once so not held should be a snappier kick from
// up close and it drops off [...] it follows a predictable path which just faces the direction of the arrow"): SHOOT
// tapped = a low stab along your arrow that dies on the grass; held = the power shot as before. ON in every match since
// t-037 (Luca OK'd q-tap-kick, 26 Oct; Test Lab only from 24 Oct until then). The Lab still sets it per test
// (lab.js: the TK tests and FREE PLAY's switch), so its other tests play with it off; false = v0.13.0's shooting.
let TAP_KICK = true;
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
// t-018 TACKLE (Luca 25 Oct 06:56, "super important": "you can spam it too easy, it should have more draw back if you
// miss so slower reset time ... making the slide actually slide more, but not too far either and gets up after, this will
// pace the game better"). v0.11.0 slid 2.5 m in 0.6 s (9.5 m/s, cool 0.7) and could go again ~1 s after a miss, even
// from the get-up; the standing challenge was back after 0.6 s. Same numbers for you and the computer, both paces.
const TACKLE = {
  slideV: 9,           // off the mark, m/s, slowing by e^(-slideK t): (9 / 2) * (1 - e^(-1.9)) = 3.8 m in the slide's 0.95 s (TT1: 3.6 m)
  slideK: 2.0,         // (was 3.2: it stopped dead after 2.5 m - now it really goes along the grass, ~1.3 m/s at the end)
  slideT: 0.95,        // on the grass (was 0.6)
  upMiss: 0.45,        // the get-up after a miss: slide + get-up = 1.4 s before he can do anything...
  missCool: 1.5,       // ...and 1.5 s from the press before the next tackle of either kind (was 0.7)
  wonRest: 0.2,        // won it: the slide stops this soon after the contact (it ran its full length)...
  upWon: 0.3,          // ...and he's up in 0.3 s (was 0.25 after the full slide), free at once
  chCool: 0.6,         // the standing CHALLENGE: back after this when it wins...
  chMissStun: 0.6,     // ...a miss (or a lunge at nothing) leaves him off balance this long (was 0.35-0.4)...
  chMissCool: 1.0,     // ...and he can't challenge again for this long from the press (was 0.6)
  // the moves, best first: a kit uses the first it has. Batch 19 (slide2, slideup) drops in here; fps null = its frames
  // spread over the slide / get-up time
  anims: { slide: [['slide2', null], ['slide', 12]], slideup: [['slideup', null], ['getup', 12]] },
  diagNS: ['slide2', 'slideup'],   // batch 19's N / S came out sideways: those directions use the diagonal (player.js)
};
const BASE_PHYS = { SKID_DEC, ROLL_DEC, BOUNCE_Z, BOUNCE_X };   // v0.8.5: the weather scales these (clear = as tuned)
// t-013 GOAL PHYSICS (Luca 24 Oct 14:04: "a net through which the ball can interact with slight give ... more dynamic
// feedback when the ball hits the post ... the keeper, when he blocks a lot of shots but can't grab it, but it breaks his
// guard, a lot should go more up dramatically ... be moderate"): the net catches the ball like a spring, the posts and bar
// are round with real rebounds, a parry or a broken guard can pop the ball up. All of it behind GOAL_PHYS: ON in every
// match (CLASSIC and ARCADE) and in the Test Lab since t-039 (Luca OK'd q-goal-phys, 27 Oct; Lab only from 24 Oct until
// then). null = the old split (on in the Lab, off in matches); false = off everywhere (v0.13.0's posts and parries).
let GOAL_PHYS = true;
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
// t-023 THE NET COMES ALIVE (Luca 25 Oct 07:04: "add more polygons or whatever to the net so it makes it more flowy and
// the impact of the goal is felt on stronger shots and especially special shots, the ball should roll with energy for a
// second or two before it drops, make the net stretch more in general but drastically for special shots, increasingly
// for each level, make lv3 shots rip through the goal ... and a rami reaction about it (make a preview of this before
// you implement)"). Built on t-013's spring net.
// t-025 (Luca OK'd the preview, 25 Oct 13:42 - "OK = you like it; then it gets built into matches"): THE NET IS IN EVERY
// MATCH now. Its own switch, split off GOAL_PHYS: NET_FX brings t-013's net with give (ball.js gpNet / gpPlane, the
// in-net code, world.js netDraw) plus all of t-023 on top; GOAL_PHYS keeps the rest of t-013 - the round posts / bar
// (gpWood) and the parry / guard-break pop-ups (gpPop) - Lab only, because Luca hasn't OK'd those for matches.
// NET_FX: null = ON everywhere; false forces it off (tools/soak.js NET_FX=0 plays v0.12.0's net).
let NET_FX = null;
const nfxOn = () => NET_FX ?? true;
const netOn = () => nfxOn() || gpOn();                             // the spring net: with NET_FX, or with all of t-013 (GOAL_PHYS)
// touch screens (the phone version is paused - "don't break it, don't extend it"): the net catches the ball the same,
// but it is drawn as in v0.12.0 (the images ripple whole). Their art is half size (io.js LITE), which the mesh / the
// cells can't be cut from, and in SAFE MODE's canvas the cells cost ~4x the frame time of the plain net (tools/netperf.js)
const netPlain = () => (typeof LITE !== 'undefined' && LITE) || !!window.HC2_TOUCH;
// every number in one place (ball.js gpNet / nfxRollStep / nfxTear, world.js netMesh / netWarp)
const NFX = {
  // the stretch: a goal's net spring is softened by S^2 (and its reach grown by S), so the ball sinks S times deeper than
  // t-013's net: S = base ("stretch more in general") + byV x its pace at the line (0 at v0 m/s, 1 at v1) + lv[special
  // level] - a soft shot ~1.2, a power shot ~1.5, LV1 ~2.3, LV2 ~2.9 (the drastic ones). The boards are board m behind
  // the line (6 m of grass, then the end boards: docs/lanes/stadiums-maps.md)
  base: 1.2, byV: 0.55, v0: 14, v1: 32, lv: [0, 0.6, 1.1, 1.6], board: 5.6,
  // the ball keeps its energy: at its deepest point the netting takes it round the pocket the bulge made (a swirl rollR m
  // across at rollHz turns a second, shrinking as it slows) for rollT s (soft .. hard, + rollLv per level), sliding down
  // the bulge (sag m/s), the mesh giving it back slowly (keep: the share of the depth left at the end); then it drops.
  // t-025: it never moves faster than rollVmax m/s on the swirl (the swirl itself goes ~4 m/s)
  rollT: [0.9, 1.7], rollLv: 0.15, rollR: 0.42, rollHz: 1.5, sag: 0.35, keep: 0.35, rollVmax: 8,
  // LV3 rips through: once it has pushed the mesh tearD m back the mesh splits (holeR m across the hole, opening in
  // holeT s), the ball flies on at keepV of its pace at least, hits the boards and drops; the hole stays open until the
  // restart. Rami: a big-stretch line past bigD m
  tearD: 1.25, holeR: 0.62, holeT: 0.12, keepV: 0.62, bigD: 1.2,
  // the drawn net: the art warped by a mesh of seg px triangles (WebGL; canvas falls back to t-013's cells); a vertex
  // moves at most drawMax px; the bulge's radius grows with the stretch (sigK x depth on top of GP.netSig); a torn
  // edge peels back flap px and flutters at flapHz
  seg: 5, drawMax: 150, sigK: 0.5, flap: 14, flapHz: 5,
};
const HALF_END = [45, 90, 105, 120];                               // v0.8.5: the minute each half ends (3 + 4 = extra time)
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
const GAME_VER = 'v0.15.1';

// v0.9.5 split: Match's methods live in the area files; each file adds its group with hc2Mix (the same as writing them
// in the class body: non-enumerable, writable, configurable, strict)
function hc2Mix(C, methods) { for (const [k, d] of Object.entries(Object.getOwnPropertyDescriptors(methods))) { d.enumerable = false; Object.defineProperty(C.prototype, k, d); } }
