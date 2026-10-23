// HELP OUT HAGUE CUP II - web game v0.9.4 (Luca 15:47: "computer chips too and pixellab first": the CHIP is ON in matches - PixelLab batch 15 made the chip on the IS rig (PixMiniMax, ball-free prompt: short step, stab under it, lean back, the leg lifts; E / NE / SE / S made, N = the NE frames, W / NW / SW mirrored), painted onto every kit; contact on the 4th frame at 20 fps)
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
const CHIP_DIP = 1.9;
const CHIP_ON = true;                                                          // v0.9.4: ON in matches - the PixelLab chip animation is in (batch 15)
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
const RUN = 5.2, JOG = 3.8, WITH_BALL = 0.9, ACC = 12, DEC = 26;
let SPRINT = 7.7;                                  // v0.8: let (not const) so the Test Lab's FREE PLAY sliders can tune it live
const WALK_V = 2.3;                                // v0.7.4: below this (m/s) a player walks (PixelLab walk) instead of running in slow motion
const STRIDE_PX = 22;                              // planted-foot travel per run frame (PixelLab 8-frame run, measured ~16-30 px)
const SPRINT_DRAIN = 0.23, REST_GAIN = 0.16, RUN_GAIN = 0.07;   // stamina per second (0..1)
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
const BASE_PHYS = { SKID_DEC, ROLL_DEC, BOUNCE_Z, BOUNCE_X };   // v0.8.5: the weather scales these (clear = as tuned)
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
const KICK_HIT = { pass: 2, kick: 2, shot: 3, super: 8, sp1: 6, sp2: 8, punt: 6, chip: 3 }, KICK_FPS = 18;   // chip: v0.9.4 PixelLab batch 15 (the stab under it)   // punt: v0.8.1 keeper drop-kick (PixelLab batch 13)
const KICK_RATE = { pass: 22, shot: 22, super: 14, sp1: 18, sp2: 16, punt: 16, chip: 20 };          // sp1 spin strike, sp2 thunder strike (batch 11b)                               // batch 11 strips play a little faster (super: the leap takes its time)
const kickRate = a => KICK_RATE[a] || KICK_FPS;
// keeper: how fast he flies sideways in a dive (m/s) and how far past his centre his hands reach when stretched (m)
const GK_DIVE_V = 5.2, GK_REACH = 1.0;
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

// ------------------------------------------------------------------ ball physics (shared by the game and by the pass maths)
// In the air: gravity + quadratic drag. Bounce: loses ~45% height and ~20% pace. On the grass: a struck ball
// skids first (high friction, the "bite") until it has lost ~28% of its pace, then rolls (low friction + drag).
// A dribbled ball (owned) uses its own, higher friction so touches stay short.
function ballStep(b, h, owned) {
  // v0.8.7: a SPECIAL flies like an energy shot, not a football - a quarter of the drag, a flatter arc, it skims the
  // grass - so LV3 "from anywhere" really gets there (from your own half it died on the grass at 87 m: the Lab's PW4)
  const sp = !!b.special && !owned && (b.spF ?? 1) > 0.85;                     // (out of its range it's just a hard shot)
  const ch = !!b.chip && !owned;                                                // v0.9.2 CHIP: struck with backspin-then-dip - it climbs fast, then drops hard
  if (b.z > 0 || b.vz > 0) {
    b.vz -= G * h * (sp ? 0.35 : 1) + (ch && b.vz < 0 ? G * h * CHIP_DIP : 0);
    const s = Math.hypot(b.vx, b.vy, b.vz), f = AIR_K * s * h * (sp ? 0.25 : ch ? 0.7 : 1);
    b.vx -= b.vx * f; b.vy -= b.vy * f; b.vz -= b.vz * f;
    b.z += b.vz * h;
    if (b.z <= 0) {
      b.z = 0;
      if (b.vz < -BOUNCE_MIN) {
        const vin = -b.vz, e = BOUNCE_Z - clamp((vin - 3) / 9, 0, 1) * BOUNCE_DROP, vh = Math.hypot(b.vx, b.vy);
        b.vz = vin * e;
        if (vh > 0) { const k = (vh - Math.min(BOUNCE_MU * (1 + e) * vin, 0.4 * vh)) / vh; b.vx *= k; b.vy *= k; }
        b.bounced = (b.bounced || 0) + 1;
      } else b.vz = 0;
      b.chip = false;                                                             // (one bounce and it's an ordinary ball)
      b.skid = true; b.rollV = 0.8 * Math.hypot(b.vx, b.vy);
    }
  } else {
    const s = Math.hypot(b.vx, b.vy);
    if (s > 0) {
      let dec;
      if (owned) dec = DRIB_DEC;
      else if (sp) dec = SKID_DEC * 0.3;
      else if (b.skid && s > b.rollV) dec = SKID_DEC;
      else { b.skid = false; dec = ROLL_DEC + ROLL_K * s * s; }
      const ns = Math.max(0, s - dec * h); b.vx *= ns / s; b.vy *= ns / s;
    }
  }
  b.x += b.vx * h; b.y += b.vy * h;
}
// fly a test ball along +x and report when/how fast it gets to `dist` (or where it stops)
function simKick(v0, vz, dist) {
  const b = { x: 0, y: 0, z: 0.05, vx: v0, vy: 0, vz, skid: true, rollV: 0.8 * v0 }, h = 1 / 120;
  for (let t = 0; t < 5; t += h) {
    ballStep(b, h, false);
    if (b.x >= dist) return { t, v: Math.hypot(b.vx, b.vy), z: b.z };
    if (b.vx < 0.05 && b.z <= 0) return { t, v: 0, short: true };
  }
  return { t: 5, v: b.vx, short: true };
}
// ground pass: the kick speed that makes the ball arrive at `dist` with speed `arrive`
function solveGround(dist, arrive, vz) {
  let lo = 2, hi = KICK_MAX;
  for (let i = 0; i < 22; i++) { const mid = (lo + hi) / 2, r = simKick(mid, vz, dist); if (r.short || r.v < arrive) lo = mid; else hi = mid; }
  return hi;
}
// v0.8.2 how long an AI ground pass of d metres takes to arrive (cached per metre; the AI's interception check uses it)
const PASS_T = [];
function passTime(d) { const i = Math.round(clamp(d, 1, 50)); if (PASS_T[i] == null) { const v = solveGround(i, clamp(4.5 + i * 0.15, 5.5, 11), 0.2); PASS_T[i] = simKick(v, 0.2, i).t; } return PASS_T[i]; }
// lofted ball: the forward speed that makes it come down at `dist` for a given upward speed
function solveLob(dist, vz) {
  const land = v0 => { const b = { x: 0, y: 0, z: 0.05, vx: v0, vy: 0, vz, skid: true, rollV: 0 }, h = 1 / 120;
    for (let t = 0; t < 6; t += h) { ballStep(b, h, false); if (b.z <= 0 && t > 0.1) return b.x; } return b.x; };
  let lo = 2, hi = KICK_MAX;
  for (let i = 0; i < 22; i++) { const mid = (lo + hi) / 2; if (land(mid) < dist) lo = mid; else hi = mid; }
  return hi;
}

// ------------------------------------------------------------------ input (keyboard + gamepad + touch)
// two key sets, both always live; the start screen's KEYS pick only decides which one the on-screen hints name
const KEYSETS = {
  arrows: { move: 'ARROWS', pass: 'Z', shoot: 'X', lob: 'C', through: 'V', special: 'B', ud: 'UP/DOWN' },
  wasd: { move: 'WASD', pass: 'J', shoot: 'K', lob: 'L', through: 'I', special: 'U', ud: 'W/S' },
};
const keyset = () => KEYSETS[window.HC2_KEYS] || KEYSETS.arrows;
// ---------- SOUND: tiny 16-bit-console style effects made in code (Web Audio, no files): kicks, whistle, net, post,
// catches and a crowd that bed + roars. Starts on the first key / click (browsers need that), M mutes (remembered).
const SFX = {
  ctx: null, out: null, crowd: null, muted: false,
  init() {
    if (this.ctx) return; const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    try { this.muted = localStorage.getItem('hc2-mute') === '1'; } catch (e) {}
    this.ctx = new AC(); this.out = this.ctx.createGain(); this.out.gain.value = this.muted ? 0 : 0.5; this.out.connect(this.ctx.destination);
    const n = this.ctx.sampleRate * 2, buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate), d = buf.getChannelData(0);
    let l = 0; for (let i = 0; i < n; i++) { l = (l + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = l * 3.5; }   // brown-ish noise
    this.noise = buf;
    const src = this.ctx.createBufferSource(); src.buffer = buf; src.loop = true;            // the crowd bed
    const lp = this.ctx.createBiquadFilter(); lp.type = 'bandpass'; lp.frequency.value = 520; lp.Q.value = 0.6;
    this.crowd = this.ctx.createGain(); this.crowd.gain.value = 0.05; src.connect(lp).connect(this.crowd).connect(this.out); src.start();
    this.crowdF = lp;
  },
  resume() { this.init(); if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },
  toggle() { this.init(); if (!this.ctx) return; this.muted = !this.muted; this.out.gain.value = this.muted ? 0 : 0.5; try { localStorage.setItem('hc2-mute', this.muted ? '1' : '0'); } catch (e) {} return this.muted; },
  ok() { return this.ctx && !this.muted && this.ctx.state === 'running'; },
  tone(type, f0, f1, dur, vol, delay = 0) {
    if (!this.ok()) return; const t = this.ctx.currentTime + delay, o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur); o.connect(g).connect(this.out); o.start(t); o.stop(t + dur + 0.02);
  },
  hiss(f, q, dur, vol, delay = 0) {
    if (!this.ok()) return; const t = this.ctx.currentTime + delay, s = this.ctx.createBufferSource(), bp = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
    s.buffer = this.noise; bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur); s.connect(bp).connect(g).connect(this.out); s.start(t, Math.random()); s.stop(t + dur + 0.02);
  },
  kick(p = 0.6) { this.tone('sine', 150 + p * 40, 45, 0.09 + p * 0.05, 0.5 + p * 0.4); this.hiss(1800, 1.2, 0.04, 0.25 + p * 0.3); },
  pass() { this.tone('sine', 120, 60, 0.07, 0.35); this.hiss(1500, 1.5, 0.03, 0.15); },
  head() { this.tone('square', 260, 140, 0.06, 0.12); this.hiss(900, 2, 0.05, 0.2); },
  catch() { this.tone('sine', 90, 50, 0.12, 0.5); this.hiss(400, 1, 0.08, 0.3); },
  post() { this.tone('triangle', 880, 860, 0.55, 0.35); this.tone('triangle', 1320, 1300, 0.4, 0.2); this.tone('sine', 140, 60, 0.12, 0.4); },
  net() { this.hiss(2600, 0.7, 0.35, 0.35); this.hiss(700, 0.8, 0.25, 0.25, 0.04); },
  whistle(n = 1, long = false) {
    for (let i = 0; i < n; i++) { const d = long && i === n - 1 ? 0.75 : 0.22, at = i * 0.34;
      if (!this.ok()) return; const t = this.ctx.currentTime + at, o = this.ctx.createOscillator(), lfo = this.ctx.createOscillator(), lg = this.ctx.createGain(), g = this.ctx.createGain();
      o.type = 'square'; o.frequency.value = 2900; lfo.frequency.value = 32; lg.gain.value = 140; lfo.connect(lg).connect(o.frequency);
      g.gain.setValueAtTime(0.0008, t); g.gain.exponentialRampToValueAtTime(0.06, t + 0.02); g.gain.setValueAtTime(0.06, t + d - 0.04); g.gain.exponentialRampToValueAtTime(0.0008, t + d);
      o.connect(g).connect(this.out); o.start(t); lfo.start(t); o.stop(t + d + 0.02); lfo.stop(t + d + 0.02); }
  },
  roar(sec = 3, big = 1) {                                                           // the crowd goes up and comes down again
    if (!this.ok()) return; const t = this.ctx.currentTime, g = this.crowd.gain, f = this.crowdF.frequency;
    g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(0.32 * big, t + 0.25); g.setTargetAtTime(0.05, t + sec * 0.5, sec * 0.35);
    f.cancelScheduledValues(t); f.setValueAtTime(f.value, t); f.linearRampToValueAtTime(900, t + 0.25); f.setTargetAtTime(520, t + sec * 0.5, sec * 0.4);
  },
  coin() { this.tone('triangle', 2350, 2300, 0.32, 0.12); this.tone('sine', 3520, 3500, 0.22, 0.05, 0.02); },   // v0.8.5 the coin lands
  flick() { this.tone('square', 900, 1500, 0.05, 0.05); },
  click() { this.tone('square', 660, 660, 0.035, 0.035); },
  boom(p = 1) { this.tone('sine', 95, 28, 0.32, 0.55 * p); this.hiss(320, 0.8, 0.22, 0.35 * p); },                  // v0.7 power-shot thump
  level(n = 1) { [523, 659, 784, 1047].slice(0, n + 1).forEach((f, i) => this.tone('square', f, f, 0.09, 0.08, i * 0.07)); },   // a bar fills
  rise() { this.tone('sawtooth', 160, 1300, 0.7, 0.09); [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone('square', f, f * 1.01, 0.16, 0.07, 0.35 + i * 0.06)); this.hiss(2400, 0.6, 0.6, 0.18, 0.2); this.roar(2.5, 0.8); },
  special(lv = 1) { this.tone('sawtooth', 80 + lv * 30, 1400, 0.35, 0.1); this.hiss(1200 + lv * 600, 0.5, 0.5, 0.3); this.boom(0.8 + lv * 0.1); },
  ooh() { if (!this.ok()) return; const t = this.ctx.currentTime, g = this.crowd.gain; g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(0.16, t + 0.2); g.setTargetAtTime(0.05, t + 0.6, 0.5); },
};
addEventListener('keydown', e => { SFX.resume(); if (e.code === 'KeyM' && !e.repeat) { const m = SFX.toggle(); const s = window.__hc2; if (s && s.say) s.say(m ? 'SOUND OFF' : 'SOUND ON', 'M TO SWITCH', 0.9); } });
addEventListener('pointerdown', () => SFX.resume());

const Input = {
  keys: new Set(), downs: new Set(), taps: new Set(), cur: {}, prev: {}, axis: { x: 0, y: 0 }, touch: { x: 0, y: 0, btn: {} }, padName: '',
  map: { pass: ['KeyZ', 'KeyJ'], shoot: ['KeyX', 'KeyK', 'Space'], lob: ['KeyC', 'KeyL'], through: ['KeyV', 'KeyI'],
         sprint: ['ShiftLeft', 'ShiftRight'], start: ['Enter', 'Escape', 'KeyP'], special: ['KeyB', 'KeyU'], meter: ['KeyT'] },
  padMap: { pass: [0], shoot: [1], through: [2], lob: [3], sprint: [5, 7], start: [9], special: [4] },
  init() {
    addEventListener('keydown', e => { this.keys.add(e.code); this.downs.add(e.code); if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault(); });
    addEventListener('keyup', e => this.keys.delete(e.code));
    addEventListener('blur', () => this.keys.clear());
  },
  poll() {
    this.prev = this.cur; this.prevAxis = this.axis; const c = {};
    let ax = 0, ay = 0;
    this.taps = this.downs; this.downs = new Set();                              // a quick tap between two frames still counts
    const k = { has: code => this.keys.has(code) || this.taps.has(code) };
    if (k.has('ArrowLeft') || k.has('KeyA')) ax -= 1; if (k.has('ArrowRight') || k.has('KeyD')) ax += 1;
    if (k.has('ArrowUp') || k.has('KeyW')) ay -= 1; if (k.has('ArrowDown') || k.has('KeyS')) ay += 1;
    for (const a in this.map) c[a] = this.map[a].some(code => k.has(code));
    let pads = [];
    try { pads = navigator.getGamepads ? [...navigator.getGamepads()].filter(Boolean) : []; } catch (e) { pads = []; }
    const p = pads[0];
    if (p) {
      this.padName = p.id;
      const b = i => p.buttons[i] && p.buttons[i].pressed;
      for (const a in this.padMap) c[a] = c[a] || this.padMap[a].some(b);
      if (b(14)) ax -= 1; if (b(15)) ax += 1; if (b(12)) ay -= 1; if (b(13)) ay += 1;
      const sx = p.axes[0] || 0, sy = p.axes[1] || 0;
      if (len(sx, sy) > 0.3) { ax += sx; ay += sy; }
    }
    const t = this.touch;
    if (len(t.x, t.y) > 0.25) { ax += t.x; ay += t.y; }
    for (const a in t.btn) c[a] = c[a] || t.btn[a];
    const l = len(ax, ay);
    this.axis = l > 0.2 ? { x: ax / Math.max(1, l), y: ay / Math.max(1, l) } : { x: 0, y: 0 };
    this.cur = c;
  },
  held(a) { return !!this.cur[a]; },
  nav() { const a = this.axis, p = this.prevAxis || { x: 0, y: 0 }, e = (v, w) => (Math.abs(v) > 0.5 && Math.abs(w) <= 0.5 ? Math.sign(v) : 0); return { x: e(a.x, p.x), y: e(a.y, p.y) }; },   // v0.8.5 menus
  pressed(a) { return !!this.cur[a] && !this.prev[a]; },
  released(a) { return !this.cur[a] && !!this.prev[a]; },
};

// ------------------------------------------------------------------ boot: manifest, then assets
// ------------------------------------------------------------------ v0.7.5 PHONE (LITE) TEXTURES
// iOS reloads a page that takes too much graphics memory ("browser doesn't work"). On touch screens every texture comes from
// assets-lo/ at half size (a quarter of the memory); Phaser is told the full size, so frames, positions and scales don't change.
// #full in the address forces the big textures, #lite forces the small ones on a computer.
const CRUMB = s => (window.HC2_CRUMB || (() => {}))(s);   // v0.7.6: where the game got to (shown after a crash on the next start)
const LITE = !window.HC2_SAFE && (/(^|#|&)lite\b/.test(location.hash) || (!/(^|#|&)full\b/.test(location.hash) && (matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window)));
let LO_DIMS = null; const LO_KEY = {};
const SRC = (rel, key) => { const d = LITE && LO_DIMS && LO_DIMS[rel]; if (d) { LO_KEY[key] = d; return 'assets-lo/' + rel; } return 'assets/' + rel; };
{ const TM = Phaser.Textures.TextureManager.prototype, mk = TM.create;
  TM.create = function (key, source, width, height) { const d = LO_KEY[key]; if (d && !width) { width = d[0]; height = d[1]; } return mk.call(this, key, source, width, height); }; }

class Boot extends Phaser.Scene {
  constructor() { super('boot'); }
  preload() { CRUMB('boot'); this.load.json('manifest', 'assets/manifest.json'); if (LITE) this.load.json('lodims', 'assets-lo/dims.json'); }
  create() { MAN = this.cache.json.get('manifest'); if (LITE) LO_DIMS = this.cache.json.get('lodims') || null; CX = Math.floor(MAN.worldW / 2); FAR_H = MAN.farH; this.scene.start('load'); }
}

class Load extends Phaser.Scene {
  constructor() { super('load'); }
  preload() {
    const w = VIEW_W, h = VIEW_H;
    this.add.rectangle(w / 2, h / 2, w, h, 0x0c0a0e);
    this.add.text(w / 2, h / 2 - 40, 'HELP OUT HAGUE CUP II', { fontFamily: '"Press Start 2P"', fontSize: '20px', color: '#ffde1e' }).setOrigin(0.5);
    const bar = this.add.rectangle(w / 2 - 200, h / 2 + 10, 0, 14, 0xff2878).setOrigin(0, 0.5);
    this.add.rectangle(w / 2, h / 2 + 10, 404, 18).setStrokeStyle(2, 0xf4f0e4);
    const txt = this.add.text(w / 2, h / 2 + 44, 'LOADING THE STADIUM', { fontFamily: '"Press Start 2P"', fontSize: '10px', color: '#f4f0e4' }).setOrigin(0.5);
    CRUMB('loading'); this.load.on('progress', v => { bar.width = 400 * v; const q = Math.floor(v * 4); if (q !== this.q) { this.q = q; CRUMB(`loading ${q * 25}%`); } });
    for (const kit of ['IS-home', 'IRO-home', 'IS-keeper', 'IRO-keeper', 'REF']) if (MAN.kits[kit]) this.load.atlas(kit, SRC(`sprites/${kit}.webp`, kit), `assets/sprites/${kit}.json`);
    this.load.atlas('props', SRC('sprites/props.webp', 'props'), 'assets/sprites/props.json');
    if (MAN.rami) this.load.atlas('rami', SRC('hud/rami.webp', 'rami'), 'assets/hud/rami.json');   // commentator (Aseprite)
    if (MAN.fx) this.load.atlas('fx', SRC('hud/fx.webp', 'fx'), 'assets/hud/fx.json');
    if (MAN.coin) this.load.atlas('coin', SRC('hud/coin.png', 'coin'), 'assets/hud/coin.json');      // v0.8.5 PixelLab coin (RISE / arrow) for the toss          // v0.7 PixelLab effects: flames, impact, RISE UP arrow
    if (MAN.meterFrame) this.load.image('meter-wild', SRC('hud/' + MAN.meterFrame, 'meter-wild'));      // v0.7 PixelLab UI frame for the WILD meter
    for (const f of MAN.hud) this.load.image(f.replace('.webp', ''), SRC(`hud/${f}`, f.replace('.webp', '')));
    // world tiles around the kick-off view (the rest stream in as the camera moves)
    const cx = wx(52.5, 34), cy = wy(34);
    const r = new Phaser.Geom.Rectangle(cx - VIEW_W, cy - VIEW_H, VIEW_W * 2, VIEW_H * 2);
    for (const t of MAN.tiles) if (Phaser.Geom.Intersects.RectangleToRectangle(r, new Phaser.Geom.Rectangle(t.x, t.y, t.w, t.h)))
      for (const k of new Set(t.frames)) this.load.image(k, SRC(`world/${k}.webp`, k));
    for (const o of MAN.over) this.load.image(o.key, SRC(`world/${o.key}.webp`, o.key));
    txt.setText('LOADING THE STADIUM');
  }
  create() { CRUMB('loaded'); this.scene.start('match'); }
}

// ------------------------------------------------------------------ world tiles that stream with the camera
class Stadium {
  constructor(scene) {
    this.s = scene; this.frame = 0; this.mode = 'idle'; this.cheerUntil = 0; this.t = 0;
    this.tiles = MAN.tiles.map(t => ({ ...t, img: null, uniq: [...new Set(t.frames)] }));
    this.queue = new Set(); this.loading = false;
    scene.load.on('complete', () => { this.loading = false; this.pump(); });
    for (const o of MAN.over) scene.add.image(o.x, o.y, o.key).setOrigin(0, 0).setDepth(9e6);
  }
  key(t) { return t.frames[this.frame]; }
  pump() {
    if (this.loading || !this.queue.size) return;
    for (const k of this.queue) this.s.load.image(k, SRC(`world/${k}.webp`, k));
    this.queue.clear(); this.loading = true; this.s.load.start();
  }
  cheer(sec) { this.cheerUntil = this.s.time.now + sec * 1000; }
  update(dt, force) {
    this.t += dt;
    const cheering = this.s.time.now < this.cheerUntil;
    const step = cheering ? 0.14 : 0.18;
    const f = (cheering ? 4 : 0) + Math.floor(this.t / step) % 4;
    const changed = f !== this.frame; this.frame = f;
    const v = this.s.cameras.main.worldView;
    const near = new Phaser.Geom.Rectangle(v.x - 500, v.y - 400, v.width + 1000, v.height + 800);
    for (const t of this.tiles) {
      const hit = Phaser.Geom.Intersects.RectangleToRectangle(near, new Phaser.Geom.Rectangle(t.x, t.y, t.w, t.h));
      if (!hit) { if (t.img && (t.x > v.right + 2600 || t.x + t.w < v.x - 2600)) { t.img.destroy(); t.img = null; } continue; }
      const missing = t.uniq.filter(k => !this.s.textures.exists(k));
      missing.forEach(k => this.queue.add(k));
      const k = this.key(t);
      if (!this.s.textures.exists(k)) continue;
      if (!t.img) t.img = this.s.add.image(t.x, t.y, k).setOrigin(0, 0).setDepth(-1e6);
      else if ((changed || force) && t.img.texture.key !== k) t.img.setTexture(k);
    }
    this.pump();
  }
}

let AI_MODE = (() => { try { return localStorage.getItem('hc2-ai') || 'new'; } catch (e) { return 'new'; } })();   // 'new' (v0.8.1) or 'classic' (v0.7.6)
function setAiMode(v) { AI_MODE = v; try { localStorage.setItem('hc2-ai', v); } catch (e) {} }
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
// friend/camera-pov (co-designer: three camera distances to pick from; CLOSE is the v0.9.4 view and stays the default).
// Only the zoom changes: the stadium is one pre-projected painting seen from the main stand, so a new ANGLE would need
// all-new art. MEDIUM 0.75 / WIDE 0.5 (not 0.8 / 0.65) so the pixel art shrinks by even steps and the lines stay clean.
const CAM_OPTS = [['close', 'CLOSE', 1], ['medium', 'MEDIUM', 0.75], ['wide', 'WIDE', 0.5]];
let CAM_VIEW = (() => { try { const v = localStorage.getItem('hc2-cam'); return CAM_OPTS.some(o => o[0] === v) ? v : 'close'; } catch (e) { return 'close'; } })();
function setCamView(v) { if (!CAM_OPTS.some(o => o[0] === v)) return; CAM_VIEW = v; try { localStorage.setItem('hc2-cam', v); } catch (e) {} }
function camZoom() { return (CAM_OPTS.find(o => o[0] === CAM_VIEW) || CAM_OPTS[0])[2]; }
let DIFF_TRAITS = {                                                                // TRAINED (see the header). v0.9.3: Hard and Rise one notch up
  base: { r: 1, a: 1, d: 1, k: 1 },                                                // = the AI as tuned up to v0.9.1: YOUR team-mates (and the demo)
  easy: { r: 0.56, a: 0.6, d: 0.66, k: 0.6 },                                      // v0.9.2's trained Easy (S -1.72) nudged up: v0.9.3's smarter bursts left it at -2.5
  normal: { r: 1, a: 1, d: 1, k: 1 },                                              // = base (the computer side plays like your team-mates)
  hard: { r: 1.6, a: 1.5, d: 1.48, k: 1.38 },                                      // v0.9.3 (Luca picked "one notch up"): v0.9.2's Hard + a little; the new edges v you do the rest
  rise: { r: 2.2, a: 2.0, d: 2.0, k: 1.9 } };                                      // v0.9.3: a step past that
// traits -> the knobs inside the AI (1 = unchanged). v0.9.3: the caps opened up so traits past 1.6 still count
function diffKnobs(t) {
  const e = (x, s) => Math.exp(-(x - 1) * s);
  return { think: e(t.r, 0.85), role: e(t.r, 0.6), gkReact: Math.max(-0.09, (1 - t.r) * 0.06 + (1 - t.k) * 0.05),
    shotWant: clamp(0.35 + 0.65 * t.a, 0.2, 1.9), shotQ: (1 - t.a) * 0.08, shotErr: e(t.a, 0.9), risk: clamp(0.6 + (1 - t.a) * 0.45, 0.45, 1.2), passErr: Math.max(0, 1 - t.a) * 0.13, sp: clamp(t.a, 0.3, 2.4),
    commit: clamp(0.45 + 0.55 * t.d, 0.3, 2.4), mark: clamp(1 + (1 - t.d) * 0.9, 0.4, 2.2), press: clamp(0.85 + 0.15 * t.d, 0.75, 1.2),
    gkRead: e(t.k, 0.8), gkPos: Math.max(0, 1 - t.k) * 1.4, gkSpd: clamp(0.9 + 0.1 * t.k, 0.85, 1.14), gkSave: clamp(0.3 + 0.7 * t.k, 0.2, 1.85),
    chip: clamp(0.15 + 0.85 * (t.a - 0.5) / 0.5, 0.1, 1.8), chipOff: clamp(4 + (t.a - 1) * 3.5, 2.2, 6.5),
    burst: clamp(0.6 + 0.4 * t.a, 0.6, 1.9), burstCd: clamp(1.15 - 0.15 * t.a, 0.7, 1.1) };   // (v0.9.3: a smart dribbler times his take-on burst - more often, sooner again)   // (v0.9.2 chips: how often, and how far off his line the keeper must be first)
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
const DIFF_YOU = {
  base:   { tk: 1, yb: 0.08, sh: 0, blk: 1, mine: 1, cmt: 1, sl: 0.45, cov: 7, dbl: 0, st: 1 },           // = v0.9.2 at every level
  easy:   { tk: 1.2, yb: 0.10, sh: 0, blk: 0.9, mine: 1, cmt: 0.8, sl: 0.4, cov: 7, dbl: 0, st: 1 },
  normal: { tk: 0.85, yb: 0.07, sh: 0.03, blk: 1.1, mine: 1, cmt: 1.05, sl: 0.5, cov: 6, dbl: 0, st: 1 },
  hard:   { tk: 0.3, yb: 0.02, sh: 0.1, blk: 1.5, mine: 0.85, cmt: 1.5, sl: 0.65, cov: 3.2, dbl: 1.0, st: 0.9 },
  rise:   { tk: -0.4, yb: 0, sh: 0.2, blk: 2.2, mine: 0.65, cmt: 2.2, sl: 0.85, cov: 1.6, dbl: 2.4, st: 0.75 } };   // (tk below 0: it tackles you BETTER than its own kind)
const DIFF_K = {}; function diffK(l) { return DIFF_K[l] || (DIFF_K[l] = diffKnobs(DIFF_TRAITS[l] || DIFF_TRAITS.base)); }
// v0.8.1 team AI numbers (see ai(): SBSP lines from helios' normal-formation, gfootball role switching / containing)
const AI = { ROLE_DT: 0.4, RATIO: 0.8, PAD: 0.5, HOLD: 0.6, GOALSIDE: 0.95, COVER_R: 20, MARKERS: 3, MARK_GAP: 1.5,
  CONTAIN: 2.0, MIRROR: 7, REACH: 1.5, COMMIT: 1.3, COMMIT_VS_YOU: 0.8, SEP: 6, ARRIVE: 2.6, POSS_RATE: 2.5,
  LINES: [ { def: -24, att: -15, ax: 0.7, ay: 0.22, behind: true, min: -45, max: 8 },      // back four   (v0.8.2: with the ball the team stretches
           { def: -10, att: 6, ax: 0.66, ay: 0.28, behind: false, min: -38, max: 38 },     // midfield four  to ~40 m deep, like real teams;
           { def: 4, att: 27, ax: 0.55, ay: 0.28, behind: false, min: -12, max: 46 } ],    // two strikers   without it ~28 m compact)
  HOME_Y_DEF: [0, -18, -6, 6, 18, -19, -6, 6, 19, -4, 5],                                // across the pitch (centre = 0): narrow without the ball
  HOME_Y_ATT: [0, -27, -9, 9, 27, -26, -8, 8, 26, -7, 7],                                // wide with it
  OPEN: 5, APART: 3 };                                                                  // ...and nobody stands on top of an opponent (3 m)                                                                             // with the ball: step away from markers inside 5 m (find space)
// ------------------------------------------------------------------ players
const FORMATION = [ // 4-4-2 for a team attacking towards x = 105 (metres)
  [3, 34], [17, 10], [15, 26], [15, 42], [17, 58], [33, 12], [31, 28], [31, 40], [33, 56], [46, 29], [46, 40]];
class Player {
  constructor(m, team, i, kit) {
    this.m = m; this.team = team; this.i = i; this.kit = kit; this.keeper = i === 0;
    const h = FORMATION[i]; this.home = team.side > 0 ? { x: h[0], y: h[1] } : { x: PITCH_L - h[0], y: h[1] };
    this.x = this.home.x; this.y = this.home.y; this.vx = 0; this.vy = 0;
    this.face = team.side > 0 ? 0 : 4; this.state = 'idle'; this.stateT = 0; this.cool = 0; this.stun = 0;
    this.anim = ''; this.speed = 0; this.stamina = 1; this.tired = false; this.sprinting = false; this.touchT = 0; this.hands = false;
    const K = MAN.kits[kit];
    this.spr = m.add.sprite(0, 0, kit, K.anims['idle-E'][0]).setOrigin(0.5, K.feetY / (K.frameH || 128));   // PixelLab kits: 128 x 160 frames
    this.num = team.side > 0 ? [1, 2, 3, 4, 5, 6, 8, 10, 7, 9, 11][i] : [1, 2, 3, 4, 5, 6, 8, 10, 7, 9, 11][i];
  }
  play(name, rate, once) {
    const key = `${this.kit}:${name}`;
    if (!this.m.anims.exists(key)) {
      const fr = MAN.kits[this.kit].anims[name]; if (!fr) return false;
      this.m.anims.create({ key, frames: fr.map(f => ({ key: this.kit, frame: f })), frameRate: rate, repeat: once ? 0 : -1 });
    }
    if (this.anim !== key) {
      // run <-> sprint: carry on from the same point of the stride instead of snapping back to frame 0 (the v0.6 sprint 'jank')
      const loop = /:(run|sprint|walk)-/.test(key) && /:(run|sprint|walk)-/.test(this.anim || '') && this.spr.anims.isPlaying;
      const prog = loop ? this.spr.anims.getProgress() : 0;
      this.spr.play(key); this.anim = key;
      if (loop && prog > 0) this.spr.anims.setProgress(prog);
    }
    return true;
  }
  draw() {
    const X = wx(this.x, this.y), Y = wy(this.y);
    this.spr.setPosition(Math.round(X), Math.round(Y)).setDepth(Y);
    if (this.keeper && this.spSave && !this.sentOff && (this.m.ball.special || this.m.ball.saveable)) this.m.auraFx(this);   // v0.8.9 his special save is ready: he burns in its colour
    if (this.rig && !this.sentOff) { const P = this.m.rigAt(this, this.rig.n, this.rig.t, this.rig.d); if (P) { this.rigShow(P); return; } this.rig = null; }
    if (this._rigged || this.spr.rotation || this.spr.scaleX !== 1 || this.spr.scaleY !== 1) { this._rigged = false; this.spr.setRotation(0).setScale(1); this._ox = this._oy = null; this.anim = ''; }   // (after a rig / a replay)
    // most frames stand on the feet; keeper dives (turned a quarter in the kit build) are drawn centred on the keeper
    const K = MAN.kits[this.kit], org = (this.state === 'dive' && K.origins && K.origins[this.diveAnim]) || (this.state === 'trophy' && K.origins && K.origins['trophy-S']);   // v0.7.4: the trophy lift has taller frames
    const ox = org ? org[0] : 0.5, oy = org ? org[1] : K.feetY / (K.frameH || 128);
    if (this._ox !== ox || this._oy !== oy) { this.spr.setOrigin(ox, oy); this._ox = ox; this._oy = oy; }
    const d = DIRS[this.face];
    const ONCE = { getup: ['getup', 12], fall: ['fall', 14], hit: ['hit', 14], header: ['jump', 16], trap: ['trap', 18],
      dheader: ['dheader', 16], celebrate: ['celebrate', 10], tackle: ['tackle', 16], punch: ['punch', 16], chance: ['chance', 10],
      dejected: ['dejected', 8], roar: ['kroar', 10], beaten: ['pkdefeat', 9], protest: ['protest', 9], hurt: ['hurt', 10], blasted: ['blasted', 11] };   // batch 8: conceded, keeper roars after a big save   // batch 5: tackle, keeper punch
    if (this.sentOff) { this.spr.setVisible(false); return; }
    this.spr.setVisible(!this.hide);   // v0.8.5: shown again when he comes back on (the Lab benches players between tests; the walk-out / half time hide them with .hide)
    if (this.state !== 'run' && this.state !== 'idle') this.spr.anims.timeScale = 1;
    if (this.state === 'kick') {
      let ka = this.kickAnim || 'kick', kd = d;
      if (ka === 'throwin') kd = this.y < 34 ? 'S' : 'N';                   // throw-ins: made facing in from either touchline
      if (ka === 'gkick') kd = dirVec(this.face).x >= 0 ? 'E' : 'W';                           // keeper kick-outs: made side-on
      if (ka === 'super' || ka === 'sp1' || ka === 'sp2') kd = dirVec(this.face).x >= 0 ? 'E' : 'W';   // the special moves: made side-on
      if (!this.play(`${ka}-${kd}`, kickRate(ka), true) && !this.play(`kick-${d}`, 18, true)) this.play(`throw-${d}`, 18, true) || this.play(`idle-${d}`, 5);
    }
    else if (this.state === 'catch') { if (!(this.claimHigh && this.play(`claim-${d}`, 16, true)) && !this.play(`catch-${d}`, 16, true)) this.play(`idle-${d}`, 5); }
    else if (this.state === 'dive') { this.play(this.diveAnim, 16, true); }
    else if (this.state === 'slide') { if (!this.play(`slide-${d}`, 12, true)) { this.play(`run-${d}`, 13); this.spr.anims.timeScale = 0.01; } }
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
    else if (ONCE[this.state]) { const [nm, fps] = this.state === 'header' && K.anims['header-S'] ? ['header', 15] : this.state === 'celebrate' && this.celeAnim ? [this.celeAnim, 10] : ONCE[this.state]; if (!this.play(`${nm}-${d}`, fps, true) && !this.play(`${nm}-S`, fps, true)) this.play(`idle-${d}`, 5); }
    else if (this.waitingThrowIn()) { if (!this.play(`throwinhold-${this.y < 34 ? 'S' : 'N'}`, 1, true)) this.play(`idle-${d}`, 5); }   // ball held over his head
    else if (this.keeper && this.hands && this.speed < 0.5) { if (!(this.claimHigh && this.play(`claim-${d}`, 16, true)) && !this.play(`catch-${d}`, 16, true)) this.play(`idle-${d}`, 5); }   // holds it as he caught it
    else if (this.keeper && this.speed < 0.5 && ((this.m.ball.save && this.m.ball.save.gk === this) || this.gkSet) && K.anims[`kset-${d}`]) this.play(`kset-${d}`, 10);   // set for the shot (v0.9.1: or ready for one)
    else if ((this.touchAnimT || 0) > 0 && K.anims[`touch-${d}`]) this.play(`touch-${d}`, 18, true);      // first touch on the run
    else if (this.jockeyOn && K.anims[`jockey-${d}`]) { this.play(`jockey-${d}`, 10); this.spr.anims.timeScale = clamp(this.speed / 2.6, 0.35, 1.8); }   // v0.8.2 PixelLab jockey
    else {
      // v0.8.7 LOCOMOTION LOCK (BUG WATCH measured idle / walk / run blipping on screen for a frame or two ~2,500 times a
      // match): idle / walk / run / sprint / shuffle are picked with dead bands, then each one shows for at least 0.14 s
      this.moveLook = this.speed > (this.moveLook ? 0.3 : 0.6);
      this.sprintLook = this.moveLook && this.sprinting && this.speed > RUN * (this.sprintLook ? 0.92 : 1.04);   // (sprint: no flicking around top running speed)
      this.walkLook = this.moveLook && !this.sprintLook && !this.m.penaltyMode && !!K.anims[`walk-${d}`] && this.speed < WALK_V * (this.walkLook ? 1.12 : 0.9);   // v0.7.4 PixelLab walk below a jog
      const fv = this.keeper && this.speed < 3.2 && K.anims['shuffle-E'] ? dirVec(this.face) : null;   // v0.7.4 keeper side-shuffle along his line (made facing E, W = mirror)
      const shuffle = this.moveLook && fv && Math.abs(fv.x) > 0.3 && Math.abs(fv.x * this.vx + fv.y * this.vy) < 0.55 * this.speed;
      let cls = !this.moveLook ? 'idle' : shuffle ? 'shuffle' : this.walkLook ? 'walk' : this.sprintLook ? 'sprint' : 'run';
      const now = this.m.time.now;
      if (cls !== this.loco) { if (this.loco && this.anim === this.locoAnim && now - (this.locoAt || 0) < 140 && !this.m.replay) cls = this.loco; else { this.loco = cls; this.locoAt = now; } }
      if (cls === 'shuffle') { this.play(`shuffle-${dirVec(this.face).x > 0 ? 'E' : 'W'}`, 10); this.spr.anims.timeScale = clamp(this.speed / 1.8, 0.5, 1.8); }
      else if (cls === 'walk') { if (this.play(`walk-${d}`, 8)) { this.spr.anims.timeScale = clamp(this.speed / 1.5, 0.45, 1.6);
          if (this.keeper) { const fw = dirVec(this.face), back = this.vx * fw.x + this.vy * fw.y < -0.5 * this.speed; if (!!this.spr.anims.inReverse !== back) this.spr.anims.reverse(); } }   // v0.9.1 keeper backs off facing the ball: the walk plays backwards
        else this.play(`run-${d}`, 13); }
      else if (cls === 'run' || cls === 'sprint') {
        if (!(cls === 'sprint' && this.play(`sprint-${d}`, 13))) this.play(`run-${d}`, 13);
        if (cls === 'sprint' && now > (this.dustAt || 0) && !this.m.replay) { this.dustAt = now + rnd(320, 460); this.m.dust(this); }   // v0.7 PixelLab dust off the boots
        const pxs = Math.hypot(this.vx * PX_X * scaleAt(this.y), this.vy * PX_Y);   // legs in step with the ground
        this.spr.anims.timeScale = clamp(pxs / STRIDE_PX / 13, 0.3, 2.0);
      }
      else {
        const sp = this.m.setPiece, KA = K.anims;
        if (sp && !sp.kicked && this.keeper && sp.team !== this.team && (sp.kind === 'CORNER' || sp.kind === 'FREE KICK') && KA['korg-S']) this.play('korg-S', 9);
        else if (sp && !sp.kicked && sp.taker === this && sp.kind === 'CORNER' && sp.t < 2.2 && KA['signal-S']) this.play('signal-S', 9, true);
        else if (sp && !sp.kicked && !this.keeper && sp.taker !== this && this.i % 3 !== 0 && KA['hips-S']) this.play('hips-S', 7);
        else this.play(`idle-${d}`, 5);
        this.spr.anims.timeScale = 1;
      }
      this.locoAnim = this.anim;
    }
    // some PixelLab moves show the ball in his hands / on his chest (catch, throw, chest trap): the game hides its own ball then
    K._carry = K._carry || new Set(K.carry || []);
    this.carrying = K._carry.has(this.anim.slice(this.kit.length + 1));
  }
  rigShow(P) {                                                                   // v0.8.9 one frame of a rough rig
    const s = this.spr; s.setVisible(!this.hide); s.anims.stop(); s.setFrame(P.fr); this.anim = 'rig:' + this.rig.n;
    if (this._ox !== 0.5 || this._oy !== P.cy) { s.setOrigin(0.5, P.cy); this._ox = 0.5; this._oy = P.cy; }
    s.setPosition(Math.round(P.x), Math.round(P.y)).setRotation(P.rot).setScale(P.sx, P.sy).setDepth(wy(this.y));
    this._rigged = true; this.carrying = false; this.m.rigFx(this, P);
  }
  waitingThrowIn() { const sp = this.m.setPiece; return !!(sp && sp.kind === 'THROW-IN' && sp.taker === this && !sp.kicked && !this.busy()); }
  // top speed right now: sprint needs energy; a tired player can't sprint and runs a little slower
  top(sprint, withBall) {
    let v = RUN * (0.9 + 0.1 * Math.min(1, this.stamina / 0.3));
    if (sprint && !this.tired) v = RUN + (SPRINT - RUN) * clamp(this.stamina / 0.35, 0.25, 1);
    if (sprint && !this.tired && this.burst > 0) v *= 1.1;                       // v0.8: the first half second of a sprint is a burst
    return v * (withBall ? (sprint ? 0.94 : WITH_BALL) : 1) * (this.injury ? this.injury.k : 1);   // v0.8.5: injured = limping
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
  // a one-off move: always restarts its animation
  setState(s, t) { this.state = s; this.stateT = t; this.anim = ''; if (this.rig && RIG_BREAK.test(s)) this.rig = null; }   // (v0.8.9: a rough rig stops when he's knocked over)
  busy() { return this.state !== 'idle' && this.state !== 'run'; }
  step(dt) {
    if (this.sentOff) { this.vx = this.vy = 0; this.speed = 0; this.rig = null; return; }
    if (this.rig) { this.rig.t += dt; const R = RIGS[this.rig.n]; if (!R || this.rig.t >= R.dur) this.rig = null; }   // v0.8.9 rough rig clock (stops in hit-stops + cut scenes)
    this.cool = Math.max(0, this.cool - dt); this.stun = Math.max(0, this.stun - dt); if (this.touchAnimT > 0) this.touchAnimT -= dt;
    if (this.burst > 0) this.burst -= dt;
    if (this.keeper) { this.guardT = (this.guardT || 0) + dt; if (this.guardT > 2.5) this.guard = Math.min(1, (this.guard ?? 1) + GUARD_REGEN * dt); }   // v0.8 keeper guard refills
    if (this.state !== 'idle' && this.state !== 'run') {
      this.stateT -= dt;
      if (this.stateT <= 0) {                                       // after a slide or a fall you get up first
        if (this.state === 'slide' || this.state === 'fall' || this.state === 'dheader' || this.state === 'blasted' || (this.state === 'kick' && this.bike)) { const won = this.state === 'slide' && this.slideWon; this.bike = false; this.setState('getup', won ? 0.25 : 0.45);
          const b = this.m.ball; if (this.slideKeep && !b.owner && len(b.x - this.x, b.y - this.y) < 1.8 && b.z < 0.5) { this.cool = 0; this.m.gain(this, 0); }   // v0.8.2 the block tackle: yours
          this.slideKeep = false; } else this.state = 'idle';
      }
      if (this.state === 'dive') { const age = (this.diveLen || 0.85) - this.stateT, k = Math.exp(-dt * (age > (this.diveFly || 0.4) ? 16 : 0.4)); this.vx *= k; this.vy *= k; }
      else if (this.state === 'slide' || this.state === 'fall' || this.state === 'dheader' || this.state === 'blasted') { const k = Math.exp(-dt * 3.2); this.vx *= k; this.vy *= k; }
      else this.steer(0, 0, dt);
    }
    if (this.stun > 0 && this.state !== 'slide') this.steer(0, 0, dt);
    // energy: sprinting drains it, everything else refills it (faster when walking or standing)
    if (this.sprinting && !this.tired && this.speed > RUN * 1.02) this.stamina -= SPRINT_DRAIN * (this.team.drain || 1) * dt;   // (v0.9.3: RISE WARRIOR's lungs)
    else this.stamina += (this.speed < 2.5 ? REST_GAIN : RUN_GAIN) * dt;
    this.stamina = clamp(this.stamina, 0, 1);
    if (this.stamina < 0.02) this.tired = true; else if (this.tired && this.stamina > 0.3) this.tired = false;
    this.x = clamp(this.x + this.vx * dt, -3, PITCH_L + 3); this.y = clamp(this.y + this.vy * dt, -3, PITCH_W + 3);
    this.speed = len(this.vx, this.vy);
    const b = this.m.ball, human = this.m.human === this;
    // v0.8.7 (BUG WATCH found it: keepers + slow players flickered between idle / walk / shuffle and two facings several
    // times a second): ONE wish for the way he faces each frame, and a slow player only turns once the new way has
    // held for 0.12 s. You (and anyone running fast) still turn at once.
    const kw = this.keeper && !this.busy() && b.owner !== this && !human && this.speed < 3 && len(b.x - this.x, b.y - this.y) > 0.3;
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

// keeper dive animation: PixelLab dives are made facing the pitch (E for the left goal, W for the right one),
// named by where he goes on screen; the v0.1 South-facing dives are the fallback
function diveAnimFor(k, down) {
  const A = MAN.kits[k.kit].anims, f = down ? 'diveDown-S' : 'diveUp-N';       // dives drawn towards / away from the camera
  if (A[f]) return f;
  const n = `dive${down ? 'Down' : 'Up'}-${k.team.side > 0 ? 'E' : 'W'}`;
  if (A[n]) return n;
  const o = (k.team.side > 0) === down ? 'diveR-S' : 'diveL-S'; return A[o] ? o : 'idle-S';
}

class Team {
  constructor(name, side, kit, gk) { this.name = name; this.side = side; this.kit = kit; this.gk = gk; this.players = []; this.score = 0; }
  get goalX() { return this.side > 0 ? PITCH_L : 0; }       // the goal this team attacks
  get ownGoalX() { return this.side > 0 ? 0 : PITCH_L; }
}

// ======================================================================= v0.8.7 BUG WATCH (Luca, 23 Oct 06:04: "add a feature in
// which the ai keeps checking the footage played and checks for errors, pulls them up, we review")
// Every frame of a match (yours, the demo behind the menu, Claude's overnight test matches) the game checks its own state
// against the rules below. When one trips it keeps the clip: the last 4 s of footage + 1.5 s after (the frames the replays
// use), what tripped, the numbers behind it and a 6-second trace. Pause menu / B at full time → BUG WATCH: watch each clip
// with the spot circled, mark it BUG / FINE / NOT SURE, add a note. Clips also go to the game's database (when the page
// has one), so Claude can read them back and fix what's real. This browser keeps the last 8 either way.
const GAME_VER = 'v0.9.4';
const BW_CHECKS = {
  CRASH:       { t: 'GAME ERROR', sev: 'bug', why: 'the code threw an error' },
  NAN:         { t: 'BROKEN NUMBERS', sev: 'bug', why: 'a position or a speed stopped being a number' },
  BALL_GONE:   { t: 'BALL LEFT THE STADIUM', sev: 'bug', why: 'the ball is far outside the pitch' },
  OUT_LIVE:    { t: 'OUT, BUT PLAY GOES ON', sev: 'bug', why: 'the ball has been over a line for a second and nobody stopped play' },
  GOAL_MISSED: { t: 'GOAL NOT GIVEN?', sev: 'bug', why: 'the whole ball was over the goal line, between the posts, under the bar - and no goal' },
  GOAL_WRONG:  { t: 'GOAL THAT WASN\'T?', sev: 'bug', why: 'a goal was given with the ball outside the posts or over the bar' },
  OWNER_FAR:   { t: 'BALL NOT AT HIS FEET', sev: 'bug', why: 'a player has the ball but it is far away from him' },
  TELEPORT:    { t: 'JUMPED', sev: 'bug', why: 'something moved further in one frame than anyone can run' },
  HANDS_OUT:   { t: 'KEEPER HANDLES OUTSIDE HIS BOX', sev: 'bug', why: 'the keeper holds the ball outside his penalty area' },
  NO_SPRITE:   { t: 'PLAYER NOT DRAWN', sev: 'bug', why: 'a player on the pitch is invisible or has no picture' },
  FLOW_STUCK:  { t: 'GAME STUCK', sev: 'bug', why: 'a stoppage (set piece, freeze, foul, kick) never ends' },
  STUCK_STATE: { t: 'STUCK IN A MOVE', sev: 'bug', why: 'a player has been in one move for far too long' },
  WHIFF:       { t: 'SPECIAL MISSED THE BALL', sev: 'bug', why: 'a special move went off but never touched the ball' },
  STUCK_BALL:  { t: 'NOBODY GOES FOR THE BALL', sev: 'bug', why: 'the ball lies still in play and nobody takes it' },
  OFF_WORLD:   { t: 'PLAYER OFF THE PITCH', sev: 'odd', why: 'a player has been pinned against the edge of the world (3 m outside the lines) during play' },
  HOLDS_BALL:  { t: 'FROZEN ON THE BALL', sev: 'odd', why: 'a computer player stands on the ball and does nothing' },
  KEEPER_HOLD: { t: 'KEEPER WON\'T LET GO', sev: 'odd', why: 'the keeper has held the ball for 9 s' },
  SWARM:       { t: 'EVERYONE ON THE BALL', sev: 'odd', why: 'most players crowd round the ball for a long time' },
  KEEPER_WANDER:{ t: 'KEEPER MILES FROM GOAL', sev: 'odd', why: 'a keeper is more than 40 m from his goal during play' },
  FOUL_FAR:    { t: 'FOUL FROM A DISTANCE', sev: 'odd', why: 'a foul was given with the two players far apart' },
  STACKED:     { t: 'PLAYERS INSIDE EACH OTHER', sev: 'odd', why: 'two players stand on the same spot for 2 s' },
  JITTER:      { t: 'FLICKERING', sev: 'odd', why: 'a player keeps flipping the way he faces' },
  ANIM_FLICKER: { t: 'ANIMATION FLICKER', sev: 'odd', why: 'animations flash up for a frame or two and switch again (idle / walk / run...)' },
  BALL_ON_PLAYER: { t: 'BALL STUCK ON A PLAYER', sev: 'odd', why: 'the ball sits at a player\'s feet but he never takes it' },
  PASS_LOOP:   { t: 'BACK AND FORTH', sev: 'odd', why: 'two players pass to each other again and again' },
  STUTTER:     { t: 'STUTTER', sev: 'perf', why: 'the game skipped frames several times in a few seconds' },
};
const BW_VERDICT = { bug: 'BUG', fine: 'FINE', unsure: 'NOT SURE' };
const BW_MAX = 30, BW_GAP = 25000, BW_PRE = 240, BW_POST = 90, BW_KEEP = 8;
const BW_LONG = new Set(['applaud', 'party', 'trophy', 'dejected', 'celebrate', 'hurt', 'beaten', 'roar', 'protest', 'labanim', 'pick', 'runup', 'flight', 'done', 'walk']);
let BW_ON = (() => { try { return localStorage.getItem('hc2-bw') !== 'off'; } catch (e) { return true; } })();
function setBwOn(v) { BW_ON = !!v; try { localStorage.setItem('hc2-bw', v ? 'on' : 'off'); } catch (e) {} }
const bwF1 = v => (Number.isFinite(v) ? v.toFixed(1) : String(v)), bwF2 = v => (Number.isFinite(v) ? v.toFixed(2) : String(v));

// a clip, packed small enough for the database: 30 frames a second, whole pixels, frame names in a table
function bwPack(frames, mark) {
  const names = [], ix = new Map(), N = s => { let i = ix.get(s); if (i === undefined) { i = names.length; names.push(s); ix.set(s, i); } return i; };
  const r = v => Math.round(v || 0), r10 = v => Math.round((v || 0) * 10), rk = v => Math.round((v || 0) * 1000), out = [];
  let acc = 0;
  frames.forEach((f, i) => {
    acc += f.dt || 0; if (i % 2 && i !== frames.length - 1) return;
    const row = [Math.round(acc * 1000), r(f.cam[0]), r(f.cam[1]), r(f.b[0]), r(f.b[1]), N(f.b[2]), f.b[3] ? 1 : 0, r10(f.b[4]), rk(f.b[5]),
      r(f.s[0]), r(f.s[1]), rk(f.s[2]), r10(f.s[3]), rk(f.s[4]), f.p.length];
    for (const v of f.p) row.push(r(v[0]), r(v[1]), N(v[2]), v[3] ? 1 : 0, r10(v[4]), rk(v[5]), rk(v[6]), v[7] ? 1 : 0);
    if (f.r) row.push(r(f.r[0]), r(f.r[1]), N(f.r[2]), f.r[3] ? 1 : 0, r10(f.r[4]), f.r[5] ? 1 : 0);
    out.push(row); acc = 0;
  });
  return JSON.stringify({ v: 1, mark: Math.round((mark || 0) / 2), names, f: out });
}
function bwUnpack(s) {
  const d = typeof s === 'string' ? JSON.parse(s) : s, N = d.names;
  const frames = d.f.map(row => {
    let k = 0; const g = () => row[k++];
    const f = { dt: g() / 1000, cam: [g(), g()], b: [g(), g(), N[g()], !!g(), g() / 10, g() / 1000], s: [g(), g(), g() / 1000, g() / 10, g() / 1000], p: [] };
    const n = g(); for (let i = 0; i < n; i++) f.p.push([g(), g(), N[g()], !!g(), g() / 10, g() / 1000, g() / 1000, !!g()]);
    f.r = k < row.length ? [g(), g(), N[g()], !!g(), g() / 10, !!g()] : null;
    return f;
  });
  return { frames, mark: d.mark || 0 };
}

class BugWatch {
  constructor(m) { this.m = m; this.list = []; this.cap = null; this.sent = 0; this.reset(); this.loadOld(); }
  reset() { if (this.cap) this.finish(); this.k = {}; this.seen = {}; this.trace = []; this.traceT = 0; this.pos = null; this.bpos = null; this.wasLive = false; this.inNet = false; this.hitch = []; this.faces = []; this.owners = []; this.lastOwner = null; this.wasFoul = false; this.now = 0; this.stats = {}; this.perCode = {}; }
  watching() { const m = this.m; return BW_ON && !!m.home && !!(window.HC2_STARTED || m.demo || window.__labWatch) && !(window.__lab && !window.__labWatch); }
  live() {
    const m = this.m;
    return !(m.freeze > 0 || m.foulScene || m.setPiece || m.dead || m.intro || m.ht || m.toss || m.pre || m.over || m.paused || m.replay
      || m.penaltyMode || m.ceremony || m.so || m.hitStop > 0 || m.ball.inNet || m.bwUI);
  }
  hold(key, on, dt, s) {                                  // true once, when `on` has lasted s seconds (again only after it stops)
    if (!on) { delete this.k[key]; return false; }
    const v = this.k[key] = (this.k[key] || 0) + dt; if (v >= s) { this.k[key] = -1e9; return true; } return false;
  }
  who(p) { return p ? `${p.team.name} #${p.num}${p.keeper ? ' (keeper)' : ''}` : ''; }
  nearest(b) { let best = null; for (const p of this.m.all) { if (p.sentOff || p.hide) continue; const d = len(p.x - b.x, p.y - b.y); if (!best || d < best.d) best = { p, d }; } return best; }
  tick(dt) {
    if (!this.watching()) return;
    const m = this.m, b = m.ball, A = m.all, live = this.live(), F = Number.isFinite;
    this.traceTick(dt, live); this.now += dt;
    if (b.owner && b.owner !== this.lastOwner) {                 // who has had it: two players passing it back and forth for ever
      this.owners.push([this.now, A.indexOf(b.owner)]); if (this.owners.length > 8) this.owners.shift();
      const O = this.owners.slice(-7), ids = [...new Set(O.map(o => o[1]))];
      if (O.length === 7 && ids.length === 2 && O.every((o, j) => j === 0 || o[1] !== O[j - 1][1]) && this.now - O[0][0] < 15 && A[ids[0]] && A[ids[1]] && A[ids[0]].team === A[ids[1]].team)
        this.flag('PASS_LOOP', `${this.who(A[ids[0]])} and #${A[ids[1]].num} passed it between them 6 times in ${bwF1(this.now - O[0][0])} s`, { p: A[ids[0]] });
    }
    this.lastOwner = b.owner || this.lastOwner;
    if (m.foulScene && !this.wasFoul) { const F = m.foulScene, d = F.by && F.victim ? len(F.by.x - F.victim.x, F.by.y - F.victim.y) : 0;
      if (d > 2.6) this.flag('FOUL_FAR', `${this.who(F.by)} fouled ${this.who(F.victim)} from ${bwF1(d)} m away (${F.card || 'no card'})`, { p: F.by }); }
    this.wasFoul = !!m.foulScene;
    if (![b.x, b.y, b.z, b.vx, b.vy, b.vz].every(F)) this.flag('NAN', `ball at ${[b.x, b.y, b.z].join(', ')} moving ${[b.vx, b.vy, b.vz].join(', ')}`);
    for (const p of A) if (!p.sentOff && ![p.x, p.y, p.vx, p.vy].every(F)) { this.flag('NAN', `${this.who(p)} at ${p.x}, ${p.y} moving ${p.vx}, ${p.vy} (${p.state})`, { p }); break; }
    if (!b.inNet && !this.m.dead && (b.x < -25 || b.x > PITCH_L + 25 || b.y < -25 || b.y > PITCH_W + 25 || b.z > 50)) this.flag('BALL_GONE', `ball at ${bwF1(b.x)}, ${bwF1(b.y)}, ${bwF1(b.z)} m up`);
    if (b.inNet && !this.inNet && !(b.y > GOAL_Y0 - 0.35 && b.y < GOAL_Y1 + 0.35 && b.z < BAR_Z + 0.35))
      this.flag('GOAL_WRONG', `in the net at y ${bwF2(b.y)} (posts at ${bwF2(GOAL_Y0)} and ${bwF2(GOAL_Y1)}), ${bwF2(b.z)} m up (bar ${BAR_Z} m)`);
    this.inNet = !!b.inNet;
    // stoppages that never end (a set piece YOU take can wait for you)
    const spc = m.setPiece;
    if (this.hold('fs-sp', !!(spc && !spc.kicked && (m.demo || spc.team !== m.home)), dt, 25)) this.flag('FLOW_STUCK', `${spc.kind} for ${spc.team.name} not taken after 25 s`, { p: spc.taker });
    if (this.hold('fs-fr', m.freeze > 0 && !m.goalQ && !m.toss && !m.intro && !m.ht, dt, 15)) this.flag('FLOW_STUCK', `play frozen for 15 s (freeze timer ${bwF1(m.freeze)})`);
    if (this.hold('fs-dead', !!m.dead, dt, 5)) this.flag('FLOW_STUCK', `${m.dead.kind} called, never restarted (5 s)`);
    if (this.hold('fs-foul', !!m.foulScene, dt, 18)) this.flag('FLOW_STUCK', 'the foul scene ran for 18 s');
    if (this.hold('fs-kick', !!m.pending, dt, 3)) this.flag('FLOW_STUCK', `a kick by ${this.who(m.pending.p)} hung for 3 s`, { p: m.pending.p });
    if (this.hold('fs-hit', m.hitStop > 0, dt, 3)) this.flag('FLOW_STUCK', 'the hit-stop lasted 3 s');
    if (live) {
      const out = b.x < -0.5 || b.x > PITCH_L + 0.5 || b.y < -0.5 || b.y > PITCH_W + 0.5, o = b.owner;
      if (this.hold('out', out, dt, 1.2)) this.flag('OUT_LIVE', `ball at ${bwF1(b.x)}, ${bwF1(b.y)} for 1.2 s and play goes on${o ? ` (${this.who(o)} has it${o.hands ? ' in his hands' : ''})` : ''}`, { p: o });
      const over = (b.x < -0.11 || b.x > PITCH_L + 0.11) && b.y > GOAL_Y0 + 0.11 && b.y < GOAL_Y1 - 0.11 && b.z < BAR_Z - 0.11;
      if (this.hold('goal', over, dt, 0.25)) this.flag('GOAL_MISSED', `ball over the line at x ${bwF2(b.x)}, y ${bwF2(b.y)}, ${bwF2(b.z)} m up${o ? ` - ${this.who(o)} ${o.hands ? 'holding it' : 'on it'}` : ''}`, { p: o });
      if (o && !o.hands && !o.carrying) {
        const d = len(b.x - o.x, b.y - o.y);
        if (this.hold('far', d > 1.8, dt, 0.4)) this.flag('OWNER_FAR', `${this.who(o)} has the ball, but it is ${bwF1(d)} m from him (${o.state})`, { p: o });
        if (this.hold('frozen', o.speed < 0.3 && !o.keeper && (m.demo || o.team !== m.home), dt, 9)) this.flag('HOLDS_BALL', `${this.who(o)} stood on the ball for 9 s (${o.state})`, { p: o });
      } else { delete this.k.far; delete this.k.frozen; }
      if (o && o.hands && o.keeper) {
        const inBox = Math.abs(o.x - o.team.ownGoalX) < 17.1 && Math.abs(o.y - 34) < 20.8;
        if (this.hold('hands', !inBox, dt, 0.3)) this.flag('HANDS_OUT', `${this.who(o)} holds it at ${bwF1(o.x)}, ${bwF1(o.y)}, ${bwF1(Math.abs(o.x - o.team.ownGoalX))} m from his line`, { p: o });
        if (this.hold('khold', true, dt, 9)) this.flag('KEEPER_HOLD', `${this.who(o)} has held the ball for 9 s`, { p: o });
      } else { delete this.k.hands; delete this.k.khold; }
      if (this.hold('still', !o && len(b.vx, b.vy) < 0.08 && b.z < 0.05, dt, 6)) {
        const n = this.nearest(b); this.flag('STUCK_BALL', `ball still for 6 s at ${bwF1(b.x)}, ${bwF1(b.y)} · nearest: ${n ? `${this.who(n.p)}, ${bwF1(n.d)} m away (${n.p.state})` : 'nobody'}`, { p: n && n.p });
      }
      let swarm = 0;
      A.forEach((p, i) => {
        if (p.sentOff || p.hide) return;
        if (this.hold('off' + i, p.x < -2.8 || p.x > PITCH_L + 2.8 || p.y < -2.8 || p.y > PITCH_W + 2.8, dt, 3)) this.flag('OFF_WORLD', `${this.who(p)} at ${bwF1(p.x)}, ${bwF1(p.y)} (${p.state})`, { p });
        if (this.hold('st' + i, p.busy() && !BW_LONG.has(p.state), dt, 6)) this.flag('STUCK_STATE', `${this.who(p)} in '${p.state}' for 6 s (animation ${p.anim || 'none'})`, { p });
        const sp = p.spr, bad = !sp.visible || !sp.frame || sp.frame.name === '__BASE' || (sp.texture && sp.texture.key === '__MISSING');
        if (this.hold('spr' + i, bad, dt, 0.5)) this.flag('NO_SPRITE', `${this.who(p)} not drawn (visible ${sp.visible}, picture ${sp.texture && sp.texture.key}/${sp.frame && sp.frame.name}, state ${p.state})`, { p });
        if (!p.keeper && len(p.x - b.x, p.y - b.y) < 5) swarm++;
      });
      if (this.hold('swarm', swarm >= 9, dt, 5)) this.flag('SWARM', `${swarm} outfield players within 5 m of the ball for 5 s`);
      for (const t of [m.home, m.away]) { const k = t.players[0], far = k && !k.sentOff ? Math.abs(k.x - t.ownGoalX) : 0;
        if (this.hold('kw' + t.side, far > 40, dt, 3)) this.flag('KEEPER_WANDER', `${this.who(k)} is ${bwF1(far)} m from his goal line (${k.state})`, { p: k }); }
      let stack = null;
      for (let i = 0; i < A.length && !stack; i++) { const p = A[i]; if (p.sentOff || p.hide) continue;
        for (let j = i + 1; j < A.length; j++) { const q = A[j]; if (!q.sentOff && !q.hide && Math.abs(p.x - q.x) < 0.35 && Math.abs(p.y - q.y) < 0.3) { stack = [p, q]; break; } } }
      if (this.hold('stack', !!stack, dt, 2)) this.flag('STACKED', `${this.who(stack[0])} and ${this.who(stack[1])} on the same spot for 2 s (${stack[0].state} / ${stack[1].state})`, { p: stack[0] });
      A.forEach((p, i) => { if (p.sentOff || p === m.human) return; const F = this.faces[i] || (this.faces[i] = { f: p.face, ts: [] });
        if (p.face !== F.f) { F.f = p.face; F.ts.push(this.now); while (F.ts.length && this.now - F.ts[0] > 1) F.ts.shift();
          if (F.ts.length >= 8 && (p.speed || 0) < 3) { F.ts = []; this.flag('JITTER', `${this.who(p)} turned 8 times in a second (${p.state}, ${bwF1(p.speed || 0)} m/s)`, { p }); } }
        const an = p.anim || '';                                                  // a BLIP: an animation on screen for under 0.1 s
        if (an !== F.a) { if (F.a && this.now - (F.at || 0) < 0.1) { (F.bl = F.bl || []).push(this.now); while (F.bl.length && this.now - F.bl[0] > 1) F.bl.shift();
            if (F.bl.length >= 3) { F.bl = []; this.flag('ANIM_FLICKER', `${this.who(p)}: 3 animations flashed up for under 0.1 s within a second (${(F.a.split(':')[1] || F.a)} → ${(an.split(':')[1] || an)}, ${bwF1(p.speed || 0)} m/s)`, { p }); } }
          F.a = an; F.at = this.now; } });
      const nb = !o && b.z < 0.3 && len(b.vx, b.vy) < 0.6 ? this.nearest(b) : null;
      if (this.hold('bop', !!(nb && nb.d < 0.45 && !nb.p.busy() && !(nb.p.stun > 0) && !(nb.p.cool > 0)), dt, 1.5)) this.flag('BALL_ON_PLAYER', `the ball sat ${bwF2(nb.d)} m from ${this.who(nb.p)} for 1.5 s and he never took it (${nb.p.state})`, { p: nb.p });
      if (this.pos && this.wasLive) {                       // only between two live frames: restarts place players on purpose
        A.forEach((p, i) => { const q = this.pos[i]; if (!q || p.sentOff || p.hide) return; const d = len(p.x - q[0], p.y - q[1]);
          if (d > Math.max(2, 25 * dt)) this.flag('TELEPORT', `${this.who(p)} moved ${bwF1(d)} m in one frame (${bwF1(q[0])}, ${bwF1(q[1])} → ${bwF1(p.x)}, ${bwF1(p.y)}, ${p.state})`, { p }); });
        const bd = this.bpos ? len(b.x - this.bpos[0], b.y - this.bpos[1]) : 0;
        if (bd > Math.max(3.5, 60 * dt)) this.flag('TELEPORT', `the ball moved ${bwF1(bd)} m in one frame (${bwF1(this.bpos[0])}, ${bwF1(this.bpos[1])} → ${bwF1(b.x)}, ${bwF1(b.y)})`, { p: b.owner });
      }
    } else for (const key of Object.keys(this.k)) if (!key.startsWith('fs-') && !/^(st|off|spr)\d/.test(key)) delete this.k[key];   // (a man stuck in a move stays stuck through a throw-in)
    this.pos = A.map(p => [p.x, p.y]); this.bpos = [b.x, b.y]; this.wasLive = live;
  }
  frame(ms) {                                              // long frames on YOUR screen (not in the test browsers)
    if (!this.watching() || navigator.webdriver || window.HC2_TEST_FAST || document.hidden || !this.live() || ms < 120) return;
    const t = this.m.time.now; this.hitch = this.hitch.filter(x => t - x < 10000); this.hitch.push(t);
    if (this.hitch.length >= 4) { this.flag('STUTTER', `${this.hitch.length} long frames in 10 s (the last one ${Math.round(ms)} ms)`); this.hitch = []; }
  }
  crash(msg, stack) { try { if (!this.m.home) return; delete this.seen.CRASH; this.flag('CRASH', msg, { stack, now: true }); } catch (e) {} }
  traceTick(dt, live) {                                    // 10 numbers a tenth of a second, the last 6 s
    this.traceT += dt; if (this.traceT < 0.1) return; this.traceT = 0;
    const m = this.m, b = m.ball, r1 = v => Math.round(v * 10) / 10;
    this.trace.push([Math.round(m.clock), r1(b.x), r1(b.y), r1(b.z), r1(b.vx), r1(b.vy), b.owner ? m.all.indexOf(b.owner) : -1,
      (live ? 1 : 0) | (m.setPiece ? 2 : 0) | (m.freeze > 0 ? 4 : 0) | (m.dead ? 8 : 0) | (m.foulScene ? 16 : 0) | (m.pending ? 32 : 0) | (b.inNet ? 64 : 0)]);
    if (this.trace.length > 60) this.trace.shift();
  }
  snapshot() {
    const m = this.m, b = m.ball, r1 = v => Math.round(v * 10) / 10, sp = m.setPiece;
    return { ball: [r1(b.x), r1(b.y), r1(b.z), r1(b.vx), r1(b.vy), r1(b.vz)], owner: b.owner ? m.all.indexOf(b.owner) : -1, last: b.last ? b.last.name : '',
      flow: { setPiece: sp ? `${sp.kind}${sp.kicked ? ' kicked' : ''}` : '', freeze: r1(m.freeze || 0), dead: m.dead ? m.dead.kind : '', foul: !!m.foulScene, pending: !!m.pending, half: m.half, clock: Math.round(m.clock) },
      players: m.all.map((p, i) => [i, p.team.name, p.num, r1(p.x), r1(p.y), p.state, r1(p.speed || 0), p.face, p.sentOff ? 1 : 0, p.hands ? 1 : 0]) };
  }
  flag(code, msg, o = {}) {
    const m = this.m, now = m.time ? m.time.now : Date.now();
    this.stats[code] = (this.stats[code] || 0) + 1;                              // (every trip counts, clip or not: how often it happens)
    if (this.seen[code] != null && now - this.seen[code] < BW_GAP) return;
    this.seen[code] = now;
    if (this.list.filter(x => !x.old).length >= BW_MAX) return;
    if (BW_CHECKS[code].sev !== 'bug' && (this.perCode[code] = (this.perCode[code] || 0) + 1) > 2) return;   // (2 clips a match of each 'looks odd' kind is plenty)
    const C = BW_CHECKS[code], p = o.p || null, b = m.ball;
    const inc = { id: `bw-${Date.now().toString(36)}-${Math.floor(Math.random() * 46656).toString(36)}`, code, title: C.t, sev: C.sev, why: C.why, msg,
      game: GAME_VER, at: new Date().toISOString(), mode: window.HC2_SOAK ? 'soak' : window.__labWatch ? 'lab' : m.demo ? 'demo' : 'match',
      home: m.home.name, away: m.away.name, score: `${m.home.score}-${m.away.score}`, half: m.half, min: Math.min(m.half > 2 ? 120 : 90, Math.floor(m.clock / 60) + 1),
      who: p ? m.all.indexOf(p) : -1, whoName: this.who(p), where: p ? [+p.x.toFixed(1), +p.y.toFixed(1)] : [+bwF1(b.x), +bwF1(b.y)],
      weather: (m.mset && m.mset.weather) || 'clear', state: this.snapshot(), trace: this.trace.slice(), stack: String(o.stack || '').slice(0, 1500),
      kits: m.all.map(q => q.kit), frames: (m.rec || []).slice(-BW_PRE).map(f => Object.assign({}, f)), mark: 0, review: null, isNew: true };
    inc.mark = Math.max(0, inc.frames.length - 1);
    if (this.cap) this.finish();
    this.cap = { inc, left: BW_POST };
    this.list.push(inc);
    if (m.bwBadge) m.bwBadge(inc);
    CRUMB('bug watch: ' + code);
    if (!inc.frames.length || o.now) this.finish();
  }
  onRecord(f) { const c = this.cap; if (!c || !f) return; c.inc.frames.push(Object.assign({}, f)); if (--c.left <= 0) this.finish(); }
  finish() {
    const c = this.cap; this.cap = null; if (!c) return;
    c.inc.ready = true; this.store(c.inc);
    if (window.__bwHook) { try { window.__bwHook(c.inc); } catch (e) {} }
  }
  doc(inc) {
    const { frames, isNew, ready, old, saved, packed, ...meta } = inc, js = v => (typeof v === 'string' ? v : JSON.stringify(v || null));
    const d = Object.assign({}, meta, { state: js(meta.state), trace: js(meta.trace), clip: packed || '' });
    if (frames && frames.length) {
      let fr = frames, mk = inc.mark; d.clip = bwPack(fr, mk);
      while (d.clip.length > 230000 && fr.length > 60) { const cut = Math.round(fr.length * 0.2); fr = fr.slice(cut); mk = Math.max(0, mk - cut); d.clip = bwPack(fr, mk); }
    }
    return d;
  }
  loadOld() {                                              // clips from earlier visits that nobody marked yet
    try { const L = JSON.parse(localStorage.getItem('hc2-bw-clips') || '[]');
      for (const d of L) if (d && d.id && !d.review) this.list.push(Object.assign({}, d, { old: true, isNew: false, frames: null, packed: d.clip, state: d.state, trace: d.trace })); } catch (e) {}
  }
  framesOf(inc) {                                          // footage of a clip (unpacked on demand for the stored ones)
    if (inc.frames && inc.frames.length) return { frames: inc.frames, mark: inc.mark };
    const s = inc.packed || inc.clip; if (!s) return null;
    try { const u = bwUnpack(s); inc.frames = u.frames; inc.mark = u.mark; return u; } catch (e) { return null; }
  }
  async store(inc) {
    const d = this.doc(inc);
    try {
      const L = JSON.parse(localStorage.getItem('hc2-bw-clips') || '[]').filter(x => x && x.id !== inc.id);
      L.push(d); while (L.length > BW_KEEP) L.shift();
      let s = JSON.stringify(L); while (s.length > 2.4e6 && L.length > 1) { L.shift(); s = JSON.stringify(L); }
      localStorage.setItem('hc2-bw-clips', s);
    } catch (e) {}
    if (inc.mode === 'soak' || (this.sent >= 40 && !inc.review)) return;     // (Claude's overnight runs collect their own)
    if (inc.mode === 'demo' && inc.sev !== 'bug' && !inc.review) return;      // (the demo behind the menu only sends real bugs)
    const db = await this.m.bwDb(); if (!db) { inc.saved = inc.saved || 'local'; return; }
    try { await db.collection('bugwatch').doc(inc.id).set(d); inc.saved = 'db'; if (!inc.review) this.sent++; }
    catch (e) { inc.saved = 'local'; }
    if (this.m.bwUI) this.m.bwDraw();
  }
  review(inc, verdict, note) { inc.review = { verdict, note: note || '', at: new Date().toISOString() }; inc.isNew = false; this.store(inc); }
}
addEventListener('error', e => { const m = window.__hc2; if (m && m.bw) m.bw.crash(`${e.message} (${String(e.filename || '').split('/').pop()}:${e.lineno})`, e.error && e.error.stack); });

// ------------------------------------------------------------------ the match
class Match extends Phaser.Scene {
  constructor() { super('match'); }
  create() {
    Input.init();
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
    for (const t of [this.home, this.away]) for (let i = 0; i < 11; i++) t.players.push(new Player(this, t, i, i === 0 ? t.gk : t.kit));
    this.all = [...this.home.players, ...this.away.players];
    this.human = this.home.players[9];
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
      if (this.bw) this.bw.reset(); if (this.bwUI) { this.bwUI = null; } this.demo = false; this.demoT = 0; this.highlights = []; this.lastReplay = null; this.rec = []; this.evReplay = null; this.ramiHello = false; this.paused = false;
      if (this.rami) { this.rami.line = null; this.rami.c.setVisible(false); }
      this.buildTeams(h, a, clash); this.applyLineup(this.home); this.home.score = this.away.score = 0; this.clock = 0; this.half = 1; this.over = false;   // (new Player objects: no injuries carried over)
      for (const mt of this.meters || []) mt.reset(); this.riseQ = null;
      this.setPiece = null; this.pending = null; this.diving = null; this.kickoff(this.home);
      this.help.setText(this.helpText()).setVisible(!window.HC2_TOUCH); this.helpUntil = this.time.now + 10000;   // the keys you picked
      if (done) done();
    };
    if (!need.length) return go();
    for (const k of need) this.load.atlas(k, SRC(`sprites/${k}.webp`, k), `assets/sprites/${k}.json`);
    this.load.once('complete', go); this.load.start();
  }

  buildGoals() {
    const g = MAN.goals;
    this.nets = {};
    for (const side of ['L', 'R']) {
      const a = side === 'L' ? g.left : g.right; const ox = a.x, oy = a.y + FAR_H;
      this.add.image(ox, oy, 'props', `goal-${side}-shadow`).setOrigin(0, 0).setDepth(-5e5);
      const back = this.add.image(ox, oy, 'props', `goal-${side}-net_back`).setOrigin(0, 0).setDepth(-5e5 + 1);
      this.add.image(ox, oy, 'props', `goal-${side}-frame_far`).setOrigin(0, 0).setDepth(oy + a.sort_far_post_y);
      const near = this.add.image(ox, oy, 'props', `goal-${side}-net_near`).setOrigin(0, 0).setDepth(oy + a.sort_near_post_y);
      this.nets[side] = { imgs: [back, near], x: ox };
      this.add.image(ox, oy, 'props', `goal-${side}-post_near`).setOrigin(0, 0).setDepth(oy + a.sort_near_post_y + 1);
    }
    const sz = MAN.propSizes['flag-0'], foot = MAN.flags.pole_foot_in_sprite;
    this.flags = [];
    for (const [k, [x, y]] of Object.entries(MAN.flags.corners_on_pitch_image)) {
      const left = k.includes('left');
      const f = this.add.sprite(x, y + FAR_H, 'props', 'flag-0').setDepth(y + FAR_H)
        .setOrigin(left ? foot[0] / sz[0] : 1 - foot[0] / sz[0], foot[1] / sz[1]).setFlipX(!left);
      this.flags.push(f);
    }
    if (!this.anims.exists('flag')) this.anims.create({ key: 'flag', frames: [0, 1, 2, 3].map(i => ({ key: 'props', frame: `flag-${i}` })), frameRate: 6, repeat: -1 });
    this.flags.forEach(f => f.play('flag'));
  }

  buildHud() {
    const F = '"Press Start 2P"', hud = this.add.container(0, 0).setScrollFactor(0).setDepth(1e7);
    this.hud = hud;
    const slip = this.add.rectangle(16, 14, 300, 36, 0x0c0a0e).setOrigin(0, 0).setStrokeStyle(2, 0xf4f0e4);
    this.scoreTxt = this.add.text(30, 25, '', { fontFamily: F, fontSize: '14px', color: '#f4f0e4' });
    const clk = this.add.rectangle(16, 54, 150, 26, 0xffde1e).setOrigin(0, 0).setStrokeStyle(2, 0x0c0a0e);
    this.clockTxt = this.add.text(26, 61, '', { fontFamily: F, fontSize: '11px', color: '#0c0a0e' });
    this.msg = this.add.text(VIEW_W / 2, VIEW_H * 0.26, '', { fontFamily: F, fontSize: '34px', color: '#ffde1e', stroke: '#0c0a0e', strokeThickness: 8 }).setOrigin(0.5);
    this.sub = this.add.text(VIEW_W / 2, VIEW_H * 0.26 + 44, '', { fontFamily: F, fontSize: '12px', color: '#f4f0e4', stroke: '#0c0a0e', strokeThickness: 5 }).setOrigin(0.5);
    this.help = this.add.text(16, VIEW_H - 30, this.helpText(),
      { fontFamily: F, fontSize: '8px', color: '#0c0a0e', backgroundColor: '#f4f0e4', padding: { x: 8, y: 6 } });
    this.radar = this.add.graphics();
    this.power = this.add.graphics();          // world-space feedback: shot arrow + power bar, energy bar, pass ring
    hud.add([slip, this.scoreTxt, clk, this.clockTxt, this.msg, this.sub, this.help, this.radar]);
    this.meters = [new SpMeter(this, 0), new SpMeter(this, 1)];                     // v0.7 special-move energy, one per side
    this.cursor = this.add.image(0, 0, 'HC2-E6-cursor-blue').setOrigin(0.5, 1).setDepth(8e6);
    this.power.setDepth(8e6 + 1);
    this.ring = this.add.graphics().setDepth(-4e5);   // pass-target ring sits on the grass, under the players
    this.helpUntil = 9000;
    if (window.HC2_TOUCH) this.help.setVisible(false);
  }
  pauseLine() { const k = keyset(), H = this.highlights && this.highlights.length;
    return `PRESS ENTER / START${this.lastReplay ? ` · ${k.lob}: LAST GOAL` : ''}${H ? ` · ${k.pass}: HIGHLIGHTS (${H})` : ''}`; }
  ftLine() { const H = this.highlights && this.highlights.length;
    const B = this.bw ? this.bw.list.filter(x => !x.review).length : 0;
    return `${this.home.name} ${this.home.score} - ${this.away.score} ${this.away.name}${this.half > 2 ? ' (AET)' : ''}   ENTER: ${this.cup && this.cupLive ? 'CUP' : 'AGAIN'}${H ? `   ${keyset().pass}: HIGHLIGHTS` : ''}${B ? `   B: BUG WATCH (${B})` : ''}`; }
  helpText() {
    const k = keyset();
    return `${k.move} MOVE  ${k.pass} PASS / CHALLENGE  ${k.shoot} SHOOT (HOLD) / SLIDE  ${k.lob} LOB  ${k.through} THROUGH  SHIFT SPRINT  ${k.special} SPECIAL`;
  }
  layoutHud() {}

  say(big, small, sec) { this.msg.setText(big || ''); this.sub.setText(small || ''); this.msgT = sec || 1.5; }

  // ---------- restarts
  kickoff(team) {
    this.dead = null; this.foulScene = null;
    for (const p of this.all) { if (p.sentOff) continue; p.x = p.home.x; p.y = p.home.y; p.vx = p.vy = 0; p.state = 'idle'; p.hands = false; p.face = p.team.side > 0 ? 0 : 4; }
    const on = [9, 10, 8, 7, 6, 5, 4, 3, 2, 1].map(i => team.players[i]).filter(p => !p.sentOff), k = on[0], k2 = on[1] || on[0];
    k.x = 52.5 - team.side * 0.5; k.y = 34; k2.x = 52.5 - team.side * 1.0; k2.y = 37;
    Object.assign(this.ball, { x: 52.5, y: 34, z: 0, vx: 0, vy: 0, vz: 0, owner: k, last: team, inNet: false, netRight: undefined, target: null, skid: false });
    if (this.ref) { this.ref.x = 52.5 + 3; this.ref.y = 22; this.ref.vx = this.ref.vy = 0; this.ref.act('whistle', 0.9); }   // v0.7.1: the referee starts it
    if (team === this.home) this.human = k;
    this.setPiece = null; this.pending = null;
    this.freeze = 1.2; this.say('KICK-OFF', team.name + ' TO START', 1.2); SFX.whistle(1);
  }
  // dead-ball restarts become SET PIECES: play stops, the taker stands over the ball and aims with a cursor
  restart(kind, team, x, y, note, opts = {}) {
    this.dead = null; if (kind === 'FREE KICK' || kind === 'PENALTY') SFX.whistle(1);
    for (const p of this.all) p.spot = null;
    if (kind === 'CORNER') { this.ramiSay('corner', { TEAM: team.name }); this.stat(team).corners++; }
    if (kind === 'PENALTY' && MAN.penalty && !window.HC2_NO_PENCAM && !this.demo) return this.startPenalty(team, note);
    const b = this.ball;
    Object.assign(b, { x, y, z: 0, vx: 0, vy: 0, vz: 0, inNet: false, netRight: undefined, target: null, skid: false, save: null });
    for (const p of this.all) { if (p.sentOff) continue; p.hands = false; if (p.busy() && p.state !== 'getup') p.setState('idle', 0); p.stun = 0; }
    let taker;
    if (kind === 'GOAL KICK') taker = team.players[0];
    else if (kind === 'PENALTY') taker = [9, 10, 8, 7, 6, 5, 4, 3, 2, 1].map(i => team.players[i]).find(p => !p.sentOff) || team.players[0];
    else taker = team.players.filter(p => !p.keeper && !p.sentOff).sort((a, c) => len(a.x - x, a.y - y) - len(c.x - x, c.y - y))[0];
    this.placeSetPiece(kind, team, taker, x, y, opts.cut);
    this.aimPt = this.defaultAim(kind, team, taker, x, y);
    const dx = this.aimPt.x - x, dy = this.aimPt.y - y, dl = len(dx, dy) || 1;
    taker.x = x - dx / dl * 0.6; taker.y = y - dy / dl * 0.6; taker.vx = taker.vy = 0; taker.face = dirIndex(dx, dy);
    if (kind === 'THROW-IN') { taker.x = x; taker.y = y + (y < 34 ? -0.5 : 0.5); }
    b.owner = taker; b.last = team; taker.state = 'idle';
    if (team === this.home) this.human = taker;
    this.setPiece = { kind, team, taker, t: 0, kicked: false };
    this.charge = -1; this.nextHuman = null;
    this.freeze = 0.5; this.say(kind, note || (team === this.home ? (k => `${k.move} AIM  ${k.pass} PASS  ${k.lob} CROSS  ${k.shoot} SHOOT (HOLD)`)(keyset()) : team.name), team === this.home ? 2.4 : 1.4);
  }
  // a penalty: the camera cuts to behind the taker (PenaltyScene); afterwards the match carries on from what happened
  startPenalty(team, note, opts = {}) {
    const def = team.opp, b = this.ball; this.loseTime(45);
    const taker = opts.taker || [9, 10, 8, 7, 6, 5, 4, 3, 2, 1].map(i => team.players[i]).find(p => !p.sentOff) || team.players[0];
    const gk = def.players[0];
    Object.assign(b, { owner: null, vx: 0, vy: 0, vz: 0, inNet: false, save: null, target: null });
    this.setPiece = null; this.pending = null; this.penaltyMode = true;
    if (note) this.say('PENALTY', note, 1.5);
    const human = opts.human !== undefined ? opts.human : (team === this.home ? 'take' : 'keep');
    this.scene.launch('penalty', { m: this, team, taker, gk, human, force: opts.force, style: opts.style || window.HC2_PEN,
      done: res => { this.endPenalty(res, team, taker, gk); if (opts.done) opts.done(res); } });
  }
  // 1v1 PENALTY BATTLE on one keyboard: P1 (home, WASD + K) v P2 (away, arrows + .), 5 each then sudden death, roles swap
  startShootout(vsCpu) {
    this.scene.stop('penalty'); this.penaltyMode = true; this.setPiece = null; this.pending = null; this.over = false; this.msg.setText(''); this.sub.setText('');
    this.so = { teams: [this.home, this.away], marks: [[], []], kick: 0, done: false, winner: -1, cpu: !!vsCpu };
    this.nextShootoutKick();
  }
  nextShootoutKick() {
    const so = this.so, i = so.kick % 2, team = so.teams[i], def = so.teams[1 - i];
    const order = [9, 10, 8, 7, 6, 5, 4, 3, 2, 1].map(k => team.players[k]).filter(p => !p.sentOff), taker = order[Math.floor(so.kick / 2) % order.length];
    this.scene.stop('penalty');
    this.time.delayedCall(60, () => this.scene.launch('penalty', { m: this, team, taker, gk: def.players[0], style: window.HC2_PEN || 'base',
      ctl: so.cpu ? { take: i === 0 ? 'human' : 'cpu', keep: i === 0 ? 'cpu' : 'human' } : { take: i === 0 ? 'p1' : 'p2', keep: i === 0 ? 'p2' : 'p1' },
      shootout: { names: so.cpu ? [so.teams[0].name, so.teams[1].name] : [`P1 ${so.teams[0].name}`, `P2 ${so.teams[1].name}`], marks: so.marks, shooter: i },
      done: res => this.shootoutResult(res) }));
  }
  shootoutResult(res) {
    const so = this.so, i = so.kick % 2; so.marks[i].push(res.kind === 'goal'); so.kick++;
    const g = so.marks.map(m => m.filter(Boolean).length), n = so.marks.map(m => m.length);
    let w = -1;
    if (so.kick <= 10) { for (const a of [0, 1]) if (g[a] > g[1 - a] + (5 - n[1 - a])) w = a; }   // can't be caught any more
    else if (so.kick % 2 === 0 && g[0] !== g[1]) w = g[0] > g[1] ? 0 : 1;                       // sudden death: after each pair
    if (w >= 0) {
      so.done = true; so.winner = w; this.scene.stop('penalty');
      this.say(so.cpu ? `${so.teams[w].name} WIN!` : `P${w + 1} WINS!`, `${so.teams[0].name} ${g[0]} - ${g[1]} ${so.teams[1].name} ON PENALTIES · ENTER: ${this.inCup() ? 'CUP' : 'AGAIN'}`, 99999); this.stadium.cheer(5);
      this.ramiSay('full_time', { text: so.cpu ? `WHAT A SHOOT-OUT!\n${so.teams[w].name} TAKE IT!` : `WHAT A SHOOT-OUT!\nP${w + 1} TAKES IT!`, expr: 'laugh' }, 3);
      return;
    }
    this.nextShootoutKick();
  }
  endPenalty(res, team, taker, gk) {
    this.scene.stop('penalty'); this.penaltyMode = false;
    const def = team.opp, b = this.ball, gx = team.goalX;
    if (window.HC2_PEN_NO_RESUME) return;
    if (res.kind === 'goal') {
      team.score++; this.say('GOAL!!', `${team.name} SCORES`, 2.4); this.stadium.cheer(3);
      this.afterGoal(def);                                                       // v0.8.5 (golden goal / time up)
    } else if (res.kind === 'saved') {                                           // the keeper has it in his hands
      for (const p of this.all) { if (p.sentOff) continue; p.state = 'idle'; p.vx = p.vy = 0; }
      gk.x = def.ownGoalX + def.side * 1.5; gk.y = 34; gk.face = def.side > 0 ? 0 : 4;
      Object.assign(b, { x: gk.x, y: 34, z: 1.1, owner: gk, last: def }); gk.hands = true; gk.hold = 0; this.freeze = 0.8;
    } else if (res.kind === 'parried') this.restart('CORNER', team, gx - team.side * 0.4, Math.random() < 0.5 ? 0.4 : PITCH_W - 0.4);
    else this.restart('GOAL KICK', def, gx - team.side * 5.5, 34);
  }
  defaultAim(kind, team, taker, x, y) {
    const gx = team.goalX, s = team.side;
    const mates = team.players.filter(p => p !== taker && !p.keeper && !p.sentOff);
    const nearest = (pt, maxD) => mates.filter(p => len(p.x - pt.x, p.y - pt.y) < maxD).sort((a, c) => len(a.x - pt.x, a.y - pt.y) - len(c.x - pt.x, c.y - pt.y))[0];
    if (kind === 'CORNER') return { x: gx - s * 9, y: 34 + (y < 34 ? -2 : 2) };
    if (kind === 'PENALTY') return { x: gx + s * 0.5, y: 34 };
    if (kind === 'FREE KICK' && len(gx - x, 34 - y) < 32) return { x: gx + s * 0.5, y: 34 + rnd(-2, 2) };
    const ahead = mates.filter(p => (p.x - x) * s > 0).sort((a, c) => len(a.x - x, a.y - y) - len(c.x - x, c.y - y))[0] || nearest({ x, y }, 99);
    return { x: ahead.x, y: ahead.y };
  }
  placeSetPiece(kind, team, taker, x, y, cut) {
    const opp = team.opp, gx = team.goalX, s = team.side;
    const inBox = (p, g) => Math.abs(p.x - g) < 18 && Math.abs(p.y - 34) < 21;
    if (cut && kind === 'FREE KICK') return this.layoutFreeKick(team, taker, x, y);
    if (kind === 'CORNER') {                                                     // bodies in the box
      const att = [9, 10, 7, 6].map(i => team.players[i]).filter(p => p !== taker && !p.sentOff);
      if (att.length) att.forEach((p, k) => { p.x = gx - s * (6 + k * 2.2 + rnd(0, 2)); p.y = 34 + (k - 1.5) * 3.2 + rnd(-1, 1); p.vx = p.vy = 0; });
      if (att.length) [2, 3, 4, 6].map(i => opp.players[i]).filter(p => !p.sentOff).forEach((p, k) => { const a = att[k % att.length]; p.x = a.x + s * 0.9; p.y = a.y + rnd(-0.6, 0.6); p.vx = p.vy = 0; });
    } else if (kind === 'PENALTY') {                                             // everyone out of the box except the keeper
      let k = 0;
      for (const p of this.all) { if (p === taker || (p.keeper && p.team === opp)) continue; if (inBox(p, gx)) { p.x = gx - s * 19.5; p.y = 34 + ((k++ % 9) - 4) * 3; p.vx = p.vy = 0; } }
      const gk = opp.players[0]; gk.x = gx - s * 0.6; gk.y = 34; gk.vx = gk.vy = 0;
    } else {                                                                     // 9.15 m (5 m on throws) - and a wall near goal
      const r = kind === 'FREE KICK' ? 9.15 : 5;
      for (const p of opp.players) { const d = len(p.x - x, p.y - y); if (d < r && !p.keeper) { p.x = x + (p.x - x) / (d || 1) * r; p.y = y + (p.y - y) / (d || 1) * r; } }
      if (kind === 'FREE KICK' && len(gx - x, 34 - y) < 35) {
        const dx = gx - x, dy = 34 - y, dl = len(dx, dy), ux = dx / dl, uy = dy / dl;
        [5, 6, 7].map(i => opp.players[i]).filter(p => !p.sentOff).forEach((p, k) => { p.x = x + ux * 9.15 + (-uy) * (k - 1) * 0.75; p.y = y + uy * 9.15 + ux * (k - 1) * 0.75; p.vx = p.vy = 0; });
      }
    }
  }
  // v0.8 free kick after a foul scene (Luca: "the players lay out properly ... like the other games"): both teams in
  // their shape around the ball; near goal the defence builds a wall on 9.15 m, attackers line up on the edge of the box
  // with a marker goal-side of each. Everyone lands a couple of metres off his spot and jogs the last bit in.
  layoutFreeKick(team, taker, x, y) {
    const opp = team.opp, gx = team.goalX, s = team.side, spots = new Map();
    const shape = (tm, has) => { for (const p of tm.players) { if (p.sentOff || p === taker) continue;
        if (p.keeper) { spots.set(p, { x: tm.ownGoalX + tm.side * 1.5, y: clamp(34 + (y - 34) * 0.08, 32, 36) }); continue; }
        const role = p.i <= 4 ? 0 : p.i <= 8 ? 1 : 2, push = (has ? [4, 10, 18][role] : [-1, 1, 3][role]) * tm.side;
        spots.set(p, { x: clamp(p.home.x + (x - 52.5) * (has ? 0.75 : 0.85) + push, 4, 101), y: clamp(p.home.y + (y - 34) * (has ? 0.32 : 0.45), 3, 65) }); } };
    shape(team, true); shape(opp, false);
    const dGoal = len(gx - x, 34 - y);
    if (dGoal < 35) {
      const ux = (gx - x) / dGoal, uy = (34 - y) / dGoal, n = dGoal < 26 ? 3 : 2;
      const wall = [6, 7, 5, 8].map(i => opp.players[i]).filter(p => !p.sentOff).slice(0, n);
      wall.forEach((p, k) => { const o = (k - (n - 1) / 2) * 0.75; spots.set(p, { x: x + ux * 9.15 - uy * o, y: y + uy * 9.15 + ux * o }); });
      const att = [9, 10, 8, 7].map(i => team.players[i]).filter(p => p !== taker && !p.sentOff).slice(0, 4);
      const lineX = gx - s * clamp(Math.abs(gx - x) - 2, 5, 11);              // on the last defender's line, onside
      att.forEach((p, k) => spots.set(p, { x: lineX - s * (k % 2) * 1.5 + rnd(-0.4, 0.4), y: 34 + (k - (att.length - 1) / 2) * 5.5 + rnd(-0.8, 0.8) }));
      const mk = [2, 3, 4, 1, 8, 5].map(i => opp.players[i]).filter(p => !p.sentOff && !wall.includes(p));
      att.forEach((a, k) => { const p = mk[k]; if (!p) return; const sa = spots.get(a); spots.set(p, { x: sa.x + s * 0.9, y: sa.y + (y > sa.y ? 0.5 : -0.5) }); });
    }
    for (const p of opp.players) { const q = spots.get(p); if (!q || p.keeper) continue; const d = len(q.x - x, q.y - y); if (d < 9.15) { q.x = x + (q.x - x) / (d || 1) * 9.15; q.y = y + (q.y - y) / (d || 1) * 9.15; } }
    for (const p of team.players) { const q = spots.get(p); if (!q || p.keeper) continue; const d = len(q.x - x, q.y - y); if (d < 3) { q.x = x + (q.x - x) / (d || 1) * 3; q.y = y + (q.y - y) / (d || 1) * 3; } }
    for (const [p, q] of spots) {
      q.x = clamp(q.x, 0.5, PITCH_L - 0.5); q.y = clamp(q.y, 0.5, PITCH_W - 0.5);
      let ox = p.x - q.x, oy = p.y - q.y;
      if (len(q.x - x, q.y - y) < 13) { ox = q.x - x; oy = q.y - y; }            // near the ball: come in from further out, never from inside 9.15
      const ol = len(ox, oy) || 1, m = p.keeper ? 0 : Math.min(2.6, len(p.x - q.x, p.y - q.y) + 0.6, 1.2 + Math.random() * 1.4);
      p.x = q.x + ox / ol * m; p.y = q.y + oy / ol * m; p.vx = p.vy = 0; p.spot = q; p.face = dirIndex(x - p.x, y - p.y);
      if (p.busy()) p.setState('idle', 0);
    }
  }
  settle(p, dt) {                                                                // jog the last metres onto a set-piece spot
    const q = p.spot; if (!q || p.busy() || p.sentOff) return false;
    const d = p.moveTo(q.x, q.y, 3.2, dt);
    if (d < 0.3) { p.spot = null; p.face = dirIndex(this.ball.x - p.x, this.ball.y - p.y); }
    return true;
  }
  // aiming at a set piece: the stick moves the cursor; Z = pass along the grass, C = lofted / cross, X (hold) = shot or driven ball
  setPieceTick(dt) {
    const sp = this.setPiece, b = this.ball, p = sp.taker;
    sp.t += dt;
    for (const q of this.all) { if (q !== p) { if (!this.settle(q, dt)) q.steer(0, 0, dt); q.step(dt); } }
    p.steer(0, 0, dt); p.step(dt);
    if (sp.kicked) return false;                                                 // the kick is under way: normal play takes over
    this.placeAtFeet();
    const gx = sp.team.goalX, s = sp.team.side, A = this.aimPt;
    const human = sp.team === this.home && p === this.human;
    if (human && sp.t < 12) {                                                    // (after 12 s idle the AI takes it for you)
      const ax = Input.axis; A.x = clamp(A.x + ax.x * 16 * dt, -2, PITCH_L + 2); A.y = clamp(A.y + ax.y * 16 * dt, -2, PITCH_W + 2);
      if (sp.kind === 'PENALTY') { A.x = gx + s * 0.5; A.y = clamp(A.y, GOAL_Y0 + 0.4, GOAL_Y1 - 0.4); }
      p.face = dirIndex(A.x - p.x, A.y - p.y);
      const atGoal = Math.abs(A.x - gx) < 3 && Math.abs(A.y - 34) < 5;
      if (sp.kind !== 'PENALTY' && Input.pressed('pass')) return this.spKick('ground');
      if (sp.kind !== 'PENALTY' && (Input.pressed('lob') || Input.pressed('through'))) return this.spKick('lob');
      if (sp.kind === 'THROW-IN') { if (Input.pressed('shoot')) return this.spKick('lob'); return true; }
      if (Input.held('shoot')) this.charge = this.charge < 0 ? 0 : Math.min(1, this.charge + dt / 0.8);
      if (Input.released('shoot') && this.charge >= 0) { const c = this.charge; this.charge = -1; return this.spKick(atGoal || sp.kind === 'PENALTY' ? 'shot' : 'lob', c); }
      return true;
    }
    if (sp.t < 1.3) return true;                                                 // AI takes a breath, then takes it
    const mates = sp.team.players.filter(q => q !== p && !q.keeper && !q.sentOff);
    if (sp.kind === 'PENALTY' || (sp.kind === 'FREE KICK' && len(gx - b.x, 34 - b.y) < 28 && Math.random() < 0.7)) {
      Object.assign(A, { x: gx + s * 0.5, y: 34 + rnd(-1, 1) * 3 }); return this.spKick('shot', rnd(0.6, 0.85));
    }
    if (sp.kind === 'CORNER') { const box = mates.filter(q => Math.abs(q.x - gx) < 16); const t = box[Math.floor(Math.random() * box.length)] || mates[0]; Object.assign(A, { x: t.x, y: t.y }); return this.spKick('lob'); }
    if (sp.kind === 'GOAL KICK') { const up = mates.filter(q => Math.abs(q.x - p.x) > 25).sort(() => Math.random() - 0.5)[0] || mates[0]; Object.assign(A, { x: up.x, y: up.y }); return this.spKick('lob'); }
    const best = this.bestOption(p);
    if (best) { Object.assign(A, { x: best.q.x, y: best.q.y }); return this.spKick(sp.kind === 'THROW-IN' ? 'lob' : best.mode === 'lob' ? 'lob' : 'ground'); }
    return this.spKick('ground');
  }
  spTarget() {                                                                   // the team-mate a set-piece ball would find (nearest the cursor, 7 m)
    const sp = this.setPiece, A = this.aimPt; if (!sp || !A) return null;
    return sp.team.players.filter(q => q !== sp.taker && !q.sentOff && len(q.x - A.x, q.y - A.y) < 7).sort((a, c) => len(a.x - A.x, a.y - A.y) - len(c.x - A.x, c.y - A.y))[0] || null;
  }
  spKick(mode, power = 0.7) {
    const sp = this.setPiece, p = sp.taker, A = this.aimPt;
    const target = this.spTarget();
    sp.kicked = true; for (const q of this.all) q.spot = null;
    if (mode === 'shot') { this.penaltyKick = sp.kind === 'PENALTY'; this.doShot(p, power, clamp((A.y - 34) / 2.8, -1.2, 1.2)); }
    else if (sp.kind === 'THROW-IN') { const d = Math.min(len(A.x - p.x, A.y - p.y), 22); const dx = A.x - p.x, dy = A.y - p.y, l = len(dx, dy) || 1; this.kick(p, p.x + dx / l * d, p.y + dy / l * d, 0, 0, 0.18, { mode: 'lob', target }); }
    else if (mode === 'ground' && target) this.kick(p, target.x, target.y, 0, 0, 0.14, { mode, target });   // v0.8: a ground ball goes to the ringed man's feet
    else this.kick(p, A.x, A.y, 0, 0, 0.14, { mode, target });
    if (target && sp.team === this.home) { this.nextHuman = target; this.passRing = { p: target, t: 1.0 }; }
    return false;
  }

  // ---------- kicks
  // a kick has a short wind-up; the ball leaves the foot when the swing lands (releaseKick)
  kick(p, tx, ty, speed, vz, delay = 0.12, info = {}) {
    p.setState('kick', 0.45); p.face = dirIndex(tx - p.x, ty - p.y);
    p.kickAnim = (info.mode === 'ground' || info.mode === 'through') ? 'pass' : 'kick';     // side-foot pass vs full strike
    if (p.keeper) p.kickAnim = p.hands ? (info.mode === 'ground' && MAN.kits[p.kit].anims['roll-S'] ? 'roll' : 'throw')   // batch 10: rolls it out
      : (this.setPiece && this.setPiece.kind === 'GOAL KICK') || !MAN.kits[p.kit].anims['kick-S'] ? 'gkick' : 'kick';   // v0.7.6: open play = PixelLab clearance, any direction
    if (this.setPiece && this.setPiece.kind === 'THROW-IN' && this.setPiece.taker === p) p.kickAnim = 'throwin';
    if (p.keeper && p.hands && info.mode === 'lob' && len(tx - p.x, ty - p.y) > 30 && MAN.kits[p.kit].anims['punt-S']) { p.kickAnim = 'punt'; p.setState('kick', 0.72); }   // v0.8.1: a long one out of his hands is a punt
    if (p.keeper && p.hands) delay = p.kickAnim === 'roll' ? 0.3 : 0.22;         // overarm throw / underarm roll: lets go on PixelLab's release frame
    if (info.shot && !p.keeper && MAN.kits[p.kit].anims[`shot-${DIRS[p.face]}`]) p.kickAnim = 'shot';   // v0.7: the new PixelLab strike
    if (info.chip && MAN.kits[p.kit].anims[`chip-${DIRS[p.face]}`]) p.kickAnim = 'chip';   // v0.9.4: the PixelLab chip (the scoop under it)
    if (KICK_HIT[p.kickAnim] != null && !(this.setPiece && this.setPiece.kind === 'THROW-IN')) delay = (KICK_HIT[p.kickAnim] + 0.6) / kickRate(p.kickAnim);   // ball leaves on the contact frame
    this.pending = { p, tx, ty, speed, vz, t: delay, info };
  }
  releaseKick(k) {
    const b = this.ball, whiff = why => { if (/^(fall|hit|blasted|getup|slide)$/.test(k.p.state) || (b.lastP && b.lastP.team !== k.p.team)) return;   // (tackled / knocked down in the wind-up: fair, not a bug - the overnight soak's one WHIFF was that)
      if (k.info.special && this.bw) this.bw.flag('WHIFF', `${this.bw.who(k.p)}'s LV${k.info.special} ${k.p.kickAnim || 'special'} never touched the ball (${why}) - the bars were spent`, { p: k.p }); };   // v0.8.7 BUG WATCH
    if (b.owner !== k.p) return b.owner ? undefined : whiff('it got away');     // (someone took it off him in the wind-up: fair)
    if (!k.p.hands && len(b.x - k.p.x, b.y - k.p.y) > 2.0) return whiff(`it was ${len(b.x - k.p.x, b.y - k.p.y).toFixed(1)} m away`);   // the ball ran away from him: air kick
    const dx = k.tx - b.x, dy = k.ty - b.y, d = len(dx, dy) || 1;
    let speed = k.speed, vz = k.vz;
    const mode = k.info.mode;
    if (mode === 'ground') { vz = 0.2; speed = solveGround(d, clamp(4.5 + d * 0.15, 5.5, 11), vz); }   // arrives firm, then dies
    else if (mode === 'through') { vz = 0.25; speed = solveGround(d, 4.5, vz); }                          // slows into the runner's path
    else if (mode === 'lob' && k.info.lobPow != null) { const T = 1.0 + k.info.lobPow * 1.5; vz = G * T / 2; speed = solveLob(Math.max(4, d - 1), vz); }   // v0.8.5 power lob: up to ~8 m high
    else if (mode === 'lob') { const T = clamp(0.7 + d / 25, 0.9, 1.9); vz = G * T / 2 * 1.05; speed = solveLob(Math.max(4, d - 2), vz); }
    if (k.info.chip) { const S = this.chipSolve(b, k.tx, k.ty, k.p.team, k.info.chipC || 0); speed = S.speed; vz = S.vz; }   // v0.9.2 CHIP: fast, over the keeper, dipping under the bar
    speed = Math.min(speed, k.info.special ? 40 : KICK_MAX);
    b.special = k.info.special || 0; b.power = k.info.shot ? (k.info.power ?? 0.6) : 0;   // v0.8: the keeper guard needs to know
    b.chip = !!k.info.chip; b.chipSlow = false;
    b.spP = b.special ? (k.info.spP || SP_POWER[b.special - 1]) : 0; b.spF = b.special ? (k.info.spF ?? 1) : 1; b.pierce = b.special ? SP_PIERCE[b.special - 1] : 0; b.spT = this.time.now; b.spTeam = b.special ? k.p.team : null;   // v0.8.6
    if (b.special) this.saveCall(k.p.team.opp);                                  // v0.8.6: the defending side can answer with a special save
    b.owner = null; b.vx = dx / d * speed; b.vy = dy / d * speed; b.vz = vz; b.z = Math.max(b.z, 0.05);
    if (k.p.kickAnim === 'super') b.z = 1.0;                                      // struck in mid-air, at the height of his boot
    if (k.p.keeper && k.p.hands && mode === 'lob') b.z = k.p.kickAnim === 'punt' ? 0.45 : 1.9;   // a throw leaves the raised hand, a punt the boot
    b.skid = true; b.rollV = 0.8 * speed; b.target = k.info.target || null; b.airT = 0;
    b.last = k.p.team; b.lastP = k.p; k.p.cool = 0.3; b.tried = null;
    if (k.p.hands && k.p.kickAnim === 'punt') SFX.kick(0.55); else if (k.p.hands) SFX.pass(); else if (k.info.shot) SFX.kick(k.info.power || 0.6); else if (mode === 'lob') SFX.kick(0.4); else SFX.pass();
    k.p.hands = false;
    b.save = null; b.saveable = null;
    b.how = { kind: k.p.kickAnim === 'volley' ? 'volley' : k.p.kickAnim === 'bicycle' ? 'bicycle' : k.info.shot ? 'shot' : 'pass', x: b.x, y: b.y };
    this.impact(k);                                                               // v0.7: you feel the contact
    if (k.info.shot) { b.shotBy = k.p; b.shotT = this.time.now + Math.random();   // weight on the strike
      // a defender standing in the line of the shot can block it
      const ux = b.vx / (speed || 1), uy = b.vy / (speed || 1);
      for (const o of k.p.team.opp.players) {
        if (o.keeper || o.sentOff || o.busy() || k.info.special || k.info.chip) continue;     // (v0.8.6: a special isn't blocked on the strike - it blows through, see pierce; v0.9.2: a chip goes over)
        const rx = o.x - b.x, ry = o.y - b.y, along = rx * ux + ry * uy, lat = Math.abs(rx * uy - ry * ux);
        if (along > 0.4 && along < 5 && lat < 0.75 && Math.random() < 0.6) {
          const sp2 = speed * rnd(0.25, 0.45), ang = Math.atan2(-uy, -ux) + rnd(-1.3, 1.3);
          b.vx = Math.cos(ang) * sp2; b.vy = Math.sin(ang) * sp2; b.vz = rnd(0.5, 3); b.last = o.team; b.lastP = o;
          o.cool = 0.25; this.say('', 'BLOCKED!', 0.8); return;
        }
      }
      const pen = !!this.penaltyKick || !!(this.setPiece && this.setPiece.kind === 'PENALTY');
      this.planSave(k.p.team.opp.players[0]); if (!k.info.special) this.shotSaveCall(k.p.team.opp, k.p.team, pen);   // v0.9.0
    }
  }
  // v0.7 IMPACT: hit-stop (everything freezes on the contact frame for a few hundredths), the ball flashes white,
  // a camera kick; a charged power shot (held shoot) freezes longer, shakes harder and drags a hot trail behind the ball
  impact(k) {
    const pw = k.info.shot ? (k.info.power ?? 0.6) : 0, power = k.info.shot && pw > 0.72;
    this.hitStop = k.info.shot ? 0.05 + pw * 0.08 : (k.info.mode === 'lob' ? 0.035 : 0.025);
    this.flashT = this.hitStop + 0.03;
    if (k.info.shot) this.cameras.main.shake(power ? 260 : 150, power ? 0.004 + pw * 0.004 : 0.0015 + pw * 0.002);
    else this.cameras.main.shake(70, 0.0008);
    this.trailT = power ? 0.9 : 0; this.trailHot = pw; this.trailSp = 0;
    if (power) SFX.boom(pw);
    const sp = k.info.special || 0;
    if (sp) { this.hitStop = 0.14 + sp * 0.05; this.flashT = this.hitStop; this.trailT = 1.6; this.trailSp = sp;
      const c = [[255, 140, 40], [80, 180, 255], [190, 90, 255]][sp - 1]; this.cameras.main.flash(90 + sp * 40, ...c); this.cameras.main.shake(300 + sp * 80, 0.005 + sp * 0.002); }
    if (this.fxImpact) this.fxImpact(k, pw);                                     // PixelLab impact burst (when the art is in)
  }
  dust(p) {
    if (!this.textures.exists('fx') || p.speed < RUN) return;
    const X = wx(p.x, p.y), Y = wy(p.y), im = this.add.image(X - p.vx * 3, Y - 4, 'fx', 'dust').setScale(0.35).setAlpha(0.8).setDepth(Y - 1).setFlipX(p.vx > 0);
    this.tweens.add({ targets: im, scale: 0.75, alpha: 0, x: X - p.vx * 9, y: Y - 10, duration: 380, ease: 'Quad.easeOut', onComplete: () => im.destroy() });
  }
  // PixelLab impact burst where the boot meets the ball (bigger for power shots, a fire ring + sparks for specials)
  fxImpact(k, pw) {
    if (!this.textures.exists('fx')) return;
    const b = this.ball, X = wx(b.x, b.y), Y = wy(b.y) - 12 - b.z * PX_H, sp = k.info.special || 0, big = sp || pw > 0.72;
    const pop = (name, s0, s1, ms, a = 1) => { const im = this.add.image(X, Y, 'fx', name).setScale(s0).setAlpha(a).setDepth(wy(b.y) + 2);
      this.tweens.add({ targets: im, scale: s1, alpha: 0, duration: ms, delay: (this.hitStop || 0) * 600, ease: 'Cubic.easeOut', onComplete: () => im.destroy() }); };
    if (!k.info.shot && k.info.mode !== 'lob') { pop('impact', 0.35, 0.6, 140, 0.8); return; }
    pop(big ? 'impactBig' : 'impact', big ? 0.9 : 0.6, big ? 1.9 : 1.1, big ? 260 : 170);
    if (sp) { pop('ring', 0.8, 2.6 + sp * 0.5, 420); pop('sparks', 0.8, 2.2, 380); if (sp >= 2) pop('bolt', 1.0, 1.6, 260); }
  }
  // a shot: the keeper reads it - a reaction delay and a small misread that grow with the pace - then really moves.
  // No dice: whether he saves it is decided when the ball meets (or misses) his body and gloves (pickups).
  planSave(gk) {
    const b = this.ball, c = { ...b }, h = 1 / 120, px = gk.x;
    let t = 0; while (t < 2.5) { const ox = c.x; ballStep(c, h, false); t += h; if ((ox - px) * (c.x - px) <= 0) break; }
    const sp = len(b.vx, b.vy, b.vz);
    const KK = this.dk(gk.team); let react = rnd(0.12, 0.2) + sp / 400 + KK.gkReact, y = c.y + rnd(-1, 1) * (0.1 + sp / 100) * KK.gkRead;   // (v0.9.2: the keeper's read by level)
    if (b.special) { react += 0.05 + b.special * 0.06; y += rnd(-1, 1) * b.special * 0.45; }   // v0.7: a special is hard to read
    if (this.penaltyKick) {                                                    // old in-match penalty (no camera): he guesses a side
      this.penaltyKick = false; const guess = [-1, 0, 1][Math.floor(Math.random() * 3)]; y = 34 + guess * 2.6; react = 0;
    }
    const g = { ...c }, gx = gk.team.ownGoalX;                                  // off target is judged at the goal line (a dipping shot)
    for (let u = 0; u < 1.5 && (g.x - gx) * gk.team.side > 0; u += h) ballStep(g, h, false);
    const off = g.y < GOAL_Y0 - 0.3 || g.y > GOAL_Y1 + 0.3 || g.z > BAR_Z + 0.25;
    b.save = { gk, y, z: c.z, t: t + 0.6, t0: t, react, act: null, off, dy: Math.abs(c.y - gk.y), cover: this.keeperCover(t - react, c.z), sp };
  }
  // how far sideways he can get his hands in time T (seconds after he reacts), for a ball at height z
  keeperCover(T, z) { return Math.min(GK_DIVE_V * Math.max(0, T - 0.05), 3.0) + GK_REACH - Math.max(0, z - 1.7) * 0.6; }
  passTarget(p, dir, mode, keep) {
    let best = null, bs = -1e9, ks = -1e9;
    const far = mode === 'ground' ? 40 : 52;
    for (const q of p.team.players) {
      if (q === p) continue;
      const dx = q.x - p.x, dy = q.y - p.y, d = len(dx, dy); if (d < 3 || d > far) continue;
      const cos = (dx * dir.x + dy * dir.y) / d; if (cos < 0.5) continue;
      let press = 0, lane = 0;
      for (const o of p.team.opp.players) {
        const od = len(o.x - q.x, o.y - q.y); if (od < 4) press += (4 - od);
        // opponents standing in the passing lane
        const t = ((o.x - p.x) * dx + (o.y - p.y) * dy) / (d * d);
        if (t > 0.08 && t < 0.95) { const lat = Math.abs((o.x - p.x) * dy - (o.y - p.y) * dx) / d; if (lat < 2.2) lane += (2.2 - lat); }
      }
      // v0.7: where you point wins (a mate inside ~25 degrees of the stick beats a 'safer' one 50 degrees off)
      const sc = cos * 7 - d / 30 - press * 0.25 - lane * (mode === 'lob' ? 0.1 : 0.45);
      if (q === keep) ks = sc;
      if (sc > bs) { bs = sc; best = q; }
    }
    return keep && ks > bs - 0.6 ? keep : best;                                // v0.7.4: the mate you're shown stays picked unless another is clearly better (no flicker)
  }
  doPass(p, dir, mode, to) {
    const q = to || this.passTarget(p, dir, mode, p === this.human ? this.passAim : null);   // (v0.8.2: the AI names the man it picked)
    let tx, ty;
    if (q) {
      if (mode === 'through') {                                                // into the space in front of him
        const lead = q.speed > 2 ? 8 : 6.5;
        tx = clamp(q.x + q.team.side * lead, 2, PITCH_L - 2); ty = clamp(q.y + (34 - q.y) * 0.12 + q.vy * 0.6, 2, PITCH_W - 2);
      } else {                                                                 // to his feet, a little ahead if he's running
        const t = len(q.x - p.x, q.y - p.y) / 14;
        tx = q.x + q.vx * t * 0.6; ty = q.y + q.vy * t * 0.6;
      }
    } else { const d = mode === 'lob' ? 25 : 16; tx = p.x + dir.x * d; ty = p.y + dir.y * d; }
    if (!(p === this.human && !this.demo) && !p.keeper) { const e = this.dk(p.team).passErr; if (e > 0) {   // v0.9.2: a weaker computer side passes less accurately
      const a = rnd(-1, 1) * e, dx = tx - p.x, dy = ty - p.y, c = Math.cos(a), s = Math.sin(a); tx = p.x + dx * c - dy * s; ty = p.y + dx * s + dy * c; } }
    this.kick(p, tx, ty, 0, 0, 0.12, { mode, target: q });
    if (q && p.team === this.home) { this.nextHuman = q; this.passRing = { p: q, t: 1.0 }; this.passStick = { ...Input.axis }; }
  }
  // v0.8.5 (Luca): HOLD the lob for a high ball where you point - the longer you hold, the further and higher (12-50 m)
  powerLob(p, dir, c) {
    const l = len(dir.x, dir.y) || 1, d = 12 + c * 38, tx = clamp(p.x + dir.x / l * d, 1, PITCH_L - 1), ty = clamp(p.y + dir.y / l * d, 1, PITCH_W - 1);
    const q = p.team.players.filter(m => m !== p && !m.sentOff && !m.keeper).sort((a, b) => len(a.x - tx, a.y - ty) - len(b.x - tx, b.y - ty))[0];
    const target = q && len(q.x - tx, q.y - ty) < 9 ? q : null;
    this.kick(p, tx, ty, 0, 0, 0.14, { mode: 'lob', target, lobPow: c });
    if (target && p.team === this.home) { this.nextHuman = target; this.passRing = { p: target, t: 1.0 }; this.passStick = { ...Input.axis }; }
  }
  lobSpot(p) { const ax = Input.axis, dv = len(ax.x, ax.y) > 0.1 ? ax : dirVec(p.face), l = len(dv.x, dv.y) || 1, d = 12 + this.lobCharge * 38;
    if (this.chipCan(p, dv)) return { x: p.team.goalX, y: clamp(34 + (Math.abs(ax.y) > 0.2 ? ax.y * 2.4 : 0), GOAL_Y0 + 0.4, GOAL_Y1 - 0.4), chip: true };   // v0.9.2 a chip: at the goal
    return { x: clamp(p.x + dv.x / l * d, 1, PITCH_L - 1), y: clamp(p.y + dv.y / l * d, 1, PITCH_W - 1) }; }
  // power 0..1 from holding the button; aimY -1..1 from the stick (far post / near post)
  doShot(p, power, aimY) {
    const gx = p.team.goalX; if (!this.setPiece || this.setPiece.kind !== 'PENALTY') this.stat(p.team).shots++;
    if (power > 0.93 && p === this.human) this.ramiSay('power_shot', {}, 1);
    const err = rnd(-1, 1) * (0.35 + Math.max(0, power - 0.85) * 5 + (p.sprinting ? 0.7 : 0) + (p.tired ? 0.6 : 0)) * (p === this.human && !this.demo ? 1 : this.dk(p.team).shotErr);   // (v0.9.2: the computer's finishing by level)
    const ty = clamp(34 + aimY * 2.8 + err, 27, 41);
    const spd = (16 + power * 16) * SHOT_K;
    const vz = 0.9 + power * 3.6 + (power > 0.88 ? (power - 0.88) * 40 : 0) + rnd(-0.3, 0.4);  // too much power: over the bar
    this.kick(p, gx + p.team.side * 2, ty, spd, vz, 0.13, { shot: true, power });
  }

  // ---------- RAMI ON THE MIC (see class RamiBox)
  buildRami() { this.rami = RamiBox.make(this); }
  ramiSay(key, v, prio) { if (this.rami) this.rami.say(key, v, prio); }
  ramiTick(dt) { if (this.rami) this.rami.tick(dt, this.replay ? 52 : (this.help && this.help.visible ? 40 : 0)); }

  // ---------- INSTANT REPLAY: every rendered frame is recorded (where each sprite is and which frame it shows), so a
  // replay costs no extra art. After a goal the last few seconds play back: slow motion + a TV zoom on the finish,
  // letterbox bars, a blinking REPLAY banner and a caption. Big saves and shots off the woodwork are replayed at the
  // next stoppage (ball out, keeper holding it). Any key skips. Pause menu: L / C = last goal, J / Z = HIGHLIGHTS
  // (every goal of the match in a row); full time offers the highlights too.
  record(dt) {
    if (this.replay || !(window.HC2_STARTED || this.demo) || (window.__lab && !window.__labWatch && !window.__labCut)) return;   // (v0.8.7: the Lab records when it watches / shows a cut scene)
    this.recAcc = (this.recAcc || 0) + dt; this.recSince = (this.recSince || 0) + dt;   // v0.8.2: a steady 60 frames a second on any screen
    if (this.recAcc < 0.75 / 60) return;                                         // (every replay limit is counted in recorded frames)
    this.recAcc = Math.min(this.recAcc - 1 / 60, 1 / 60); dt = this.recSince; this.recSince = 0;
    const b = this.ballSpr, sh = this.ballSh;
    this.recN = (this.recN || 0) + 1;
    (this.rec = this.rec || []).push({ dt, cam: [Math.round(this.camX), Math.round(this.camY)],
      b: [b.x, b.y, b.frame.name, b.visible, b.depth, b.scaleX], s: [sh.x, sh.y, sh.alpha, sh.depth, sh.scaleX],
      p: this.all.map(q => { const r = q.spr; return [r.x, r.y, r.frame.name, r.visible, r.depth, r.originX, r.originY, r.flipX, r.rotation, r.scaleX, r.scaleY]; }),   // (v0.8.9: + turn / squash for the rough rigs)
      r: this.ref ? (r => [r.x, r.y, r.frame.name, r.visible, r.depth, r.flipX])(this.ref.spr) : null });
    if (this.rec.length > 480) this.rec.shift();
    if (this.bw) this.bw.onRecord(this.rec[this.rec.length - 1]);                 // v0.8.7 BUG WATCH: the clip after the moment
  }
  recIndex(n) { return n - ((this.recN || 0) - (this.rec || []).length); }       // recorder frame number -> index in rec
  flagReplay(label, gk) {
    if (window.__lab || !(window.HC2_STARTED || this.demo) || this.replay || this.foulScene) return;
    if ((this.recN || 0) - (this.lastReplayEnd ?? -1e9) < 60 * 40) return;      // v0.8.1: at most one of these every ~40 s, never back to back
    this.evReplay = { label, n: this.recN || 0, gk };
  }
  eventReplayTick() {                                                              // a big save / post: show it at the next stoppage
    const e = this.evReplay; if (!e || this.replay || this.over || this.paused) return;
    const age = (this.recN || 0) - e.n, b = this.ball;
    if (b.inNet || age > 400) { this.evReplay = null; return; }
    if (age < 45 || !(this.setPiece || this.dead || (b.owner && b.owner.hands))) return;
    this.evReplay = null;
    const rec = this.rec || [], i = this.recIndex(e.n); if (i < 0 || i >= rec.length) return;
    const a = Math.max(0, i - 170), frames = rec.slice(a); frames[i - a].goal = true;
    const gk = e.gk, roar = () => { if (gk && !gk.hands && !gk.busy() && MAN.kits[gk.kit].anims['kroar-S']) { gk.setState('roar', 1.3); gk.face = 6; gk.vx = gk.vy = 0; } };
    this.startReplay(e.label, roar, frames, { caption: e.label });
  }
  goalQTick() {                                                                   // v0.8.2: a goal replay waiting for the pause / another replay to end
    const q = this.goalQ; if (!q || this.replay || this.paused) return;
    this.goalQ = null; if (q.ep !== this.epoch) return;
    this.startReplay('GOAL', q.after, q.frames);
  }
  startReplay(label, after, frames, o = {}) {
    const rec = this.rec || [];
    if (!frames) { frames = rec.slice(-330); const gi = this.recIndex(this.goalAt || 0) - (rec.length - frames.length); if (frames[gi]) frames[gi].goal = true; }
    if (frames.length < 30) { after && after(); return; }
    if (this.bw && this.bw.cap && label !== 'BUG CLIP') this.bw.finish();          // v0.8.7: a clip being recorded ends here
    let t = 0, tg = null; for (const f of frames) { f.t0 = t; if (f.goal) tg = t; t += f.dt; }
    const slowA = (tg !== null ? tg + 0.3 : t - 1.2) - (o.slowPre ?? 1.7);              // slow-mo: the last 1.7 s before the ball crosses the line
    this.msg.setText(''); this.sub.setText('');
    this.replay = { frames, i: 0, t: 0, real: 0, after, slowA, slowB: slowA + (o.slow ?? 2.0), label, z: this.baseZoom(), exit: o.exit, noZoom: !!o.noZoom, focus: o.focus ?? -1, mark: o.mark ?? -1, kits: o.kits || null };
    if (o.kits) this.all.forEach((q, k) => { const kk = o.kits[k]; if (kk && q.spr.texture.key !== kk && this.textures.exists(kk)) q.spr.setTexture(kk); });   // v0.8.7: a BUG WATCH clip from another match
    if (label === 'GOAL') {
      this.lastReplay = frames;
      const sc = this.lastScorer;
      const cap = sc ? `GOAL · ${sc.team.name} ${this.home.score}-${this.away.score} · ${sc.min}'` : 'GOAL';
      (this.highlights = this.highlights || []).push({ frames, cap });
      o.caption = o.caption || cap;
    }
    if (!this.letterbox || !this.letterbox.scene) {                              // (rebuilt if a scene restart destroyed it)
      const F = '"Press Start 2P"';
      this.letterbox = this.add.graphics().setScrollFactor(0).setDepth(9.5e6);
      this.replayTxt = this.add.text(VIEW_W - 24, 16, '', { fontFamily: F, fontSize: '14px', color: '#ff2878', stroke: '#0c0a0e', strokeThickness: 5 }).setOrigin(1, 0).setScrollFactor(0).setDepth(9.6e6);
      this.replayCap = this.add.text(VIEW_W / 2, VIEW_H - 23, '', { fontFamily: F, fontSize: '12px', color: '#ffde1e', stroke: '#0c0a0e', strokeThickness: 4 }).setOrigin(0.5).setScrollFactor(0).setDepth(9.6e6);
    }
    this.letterbox.clear().fillStyle(0x0c0a0e).fillRect(0, 0, VIEW_W, 46).fillRect(0, VIEW_H - 46, VIEW_W, 46)
      .fillStyle(0xff2878).fillRect(0, 44, VIEW_W, 2).fillRect(0, VIEW_H - 46, VIEW_W, 2);
    this.replayCap.setText(o.caption || label);
    this.letterbox.setVisible(true); this.replayTxt.setVisible(true); this.replayCap.setVisible(true);
    for (const o2 of [this.cursor, this.power, this.ring, this.radar, this.help]) if (o2) o2.setVisible(false);
    if (label === 'GOAL' && this.lastScorer) {
      const sc = this.lastScorer;
      if (sc.own) this.ramiSay('own_goal', {}, 3);
      else if (sc.bike) this.ramiSay('goal_followup', { text: 'WHAT AN OVERHEAD\nKICK! UNBELIEVABLE!', expr: 'goal' }, 3);
      else if (sc.how === 'dheader') this.ramiSay('goal_followup', { text: 'A DIVING HEADER!\nBRAVE AS YOU LIKE!', expr: 'shock' }, 3);
      else if (sc.how === 'header') this.ramiSay('goal_followup', { text: 'A BULLET HEADER!\nNUMBER ' + (sc.num || '') + ' RISES!', expr: 'goal' }, 3);
      else if (sc.how === 'volley') this.ramiSay('goal_followup', { text: 'ON THE VOLLEY!\nWHAT A STRIKE!', expr: 'goal' }, 3);
      else if (sc.how === 'shot' && sc.far > 24) this.ramiSay('goal_followup', { text: 'FROM ' + Math.round(sc.far) + ' METRES!\nWHAT A HIT!', expr: 'shock' }, 3);
      else if (sc.late) this.ramiSay('last_minute', {}, 3);
      else this.ramiSay('goal_followup', { TEAM: sc.team.name, NUM: sc.num || '' }, 3);
    }
    else if (label === 'WHAT A SAVE!') this.ramiSay('save', {}, 2);
    else if (label === 'FOUL') this.ramiSay('foul', { text: ['LET US SEE IT AGAIN...', 'WATCH THE TIMING\nON THIS ONE...', 'OUCH. LOOK AT THAT.'][Math.floor(Math.random() * 3)], expr: 'shock' }, 3);
    else if (label === 'SO CLOSE!') this.ramiSay('miss', { text: 'OHHH! INCHES WIDE!', expr: 'shock' }, 2);
    else if (label === 'OFF THE POST!' || label === 'OFF THE BAR!') this.ramiSay('post', label === 'OFF THE BAR!' ? { text: 'OFF THE BAR!!' } : {}, 2);
    this.wipe();
    this.uiFix = this.uiItems();
  }
  replayTick(dt) {
    const r = this.replay;
    if (r.real > 0.4 && r.exit && Input.pressed('start')) { const ex = r.exit; r.after = null; this.endReplay(); ex(); return; }
    if (r.real > 0.4 && (Input.pressed('shoot') || Input.pressed('pass') || Input.pressed('start') || Input.pressed('lob'))) return this.endReplay();
    r.real += dt;
    const slow = r.t > r.slowA && r.t < r.slowB; r.t += dt * (slow ? 0.35 : 1);
    while (r.i < r.frames.length - 1 && r.frames[r.i + 1].t0 <= r.t) r.i++;
    const f = r.frames[r.i];
    f.p.forEach((v, k) => { const q = this.all[k]; if (!q) return; const sp = q.spr; sp.anims.stop();
      sp.setPosition(v[0], v[1]).setFrame(v[2]).setVisible(v[3]).setDepth(v[4]).setOrigin(v[5], v[6]).setFlipX(v[7]).setRotation(v[8] || 0).setScale(v[9] ?? 1, v[10] ?? 1); });
    this.ballSpr.setPosition(f.b[0], f.b[1]).setFrame(f.b[2]).setVisible(f.b[3]).setDepth(f.b[4]).setScale(f.b[5]);
    this.ballSh.setPosition(f.s[0], f.s[1]).setAlpha(f.s[2]).setDepth(f.s[3]).setScale(f.s[4]);
    if (f.r && this.ref) { const sp = this.ref.spr; sp.anims.stop(); sp.setPosition(f.r[0], f.r[1]).setFrame(f.r[2]).setVisible(f.r[3]).setDepth(f.r[4]).setFlipX(f.r[5]); this.ref.anim = ''; }
    // TV zoom: in on the ball during the slow motion, back out after
    const zb = this.baseZoom(), zt = !r.noZoom && r.t > r.slowA - 0.1 && r.t < r.slowB + 0.15 ? zb * 1.5 : zb;   // camera-pov: 1.5x the picked distance
    r.z += (zt - r.z) * Math.min(1, dt * 5);
    const k = (r.z - zb) / (0.5 * zb), cam = this.cameras.main;
    cam.setZoom(r.z);
    if (r.label === 'BUG CLIP' && r.focus >= 0 && f.p[r.focus] && f.p[r.focus][3]) {        // v0.8.7: a clip about a player follows HIM, not the ball
      const v = f.p[r.focus], tx = v[0], ty = v[1] - 70; r.fx = r.fx == null ? tx : r.fx + (tx - r.fx) * Math.min(1, dt * 6); r.fy = r.fy == null ? ty : r.fy + (ty - r.fy) * Math.min(1, dt * 6);
      cam.centerOn(r.fx, r.fy);
    } else cam.centerOn(f.cam[0] + (f.b[0] - f.cam[0]) * k * 0.8, f.cam[1] + (f.b[1] - f.cam[1]) * k * 0.8);
    this.fixUi(r.z);
    if (r.label === 'BUG CLIP') {                                                 // v0.8.7: circle the player it's about, flag the moment
      if (!this.bwG || !this.bwG.scene) this.bwG = this.add.graphics().setDepth(9.4e6);
      const g = this.bwG.clear().setVisible(true), at = r.mark >= 0 && Math.abs(r.i - r.mark) < 20, v = r.focus >= 0 && f.p[r.focus];
      const px = v ? v[0] : f.b[0], py = v ? v[1] - 50 : f.b[1];
      g.lineStyle(3, at ? 0xff2878 : 0xffde1e, 0.95).strokeEllipse(px, v ? v[1] - 4 : py + 10, 70, 30);
      g.fillStyle(at ? 0xff2878 : 0xffde1e, 1).fillTriangle(px - 9, py - 70, px + 9, py - 70, px, py - 56);
      this.replayTxt.setText(at ? '◆ HERE' : (Math.floor(r.real * 2) % 2 ? '● ' : '  ') + 'BUG WATCH' + (slow ? ' · SLOW' : ''));
    } else this.replayTxt.setText((Math.floor(r.real * 2) % 2 ? '● ' : '  ') + (slow ? 'REPLAY · SLOW-MO' : 'REPLAY'));
    if (r.i >= r.frames.length - 1) this.endReplay();
  }
  wipe() {                                                                       // TV-style sweep in and out of a replay
    if (!this.wipeG || !this.wipeG.scene) {
      this.wipeG = this.add.graphics().setScrollFactor(0).setDepth(9.9e6);
      this.wipeG.fillStyle(0xff2878).fillPoints([{ x: 0, y: 0 }, { x: 260, y: 0 }, { x: 160, y: VIEW_H }, { x: -100, y: VIEW_H }], true)
        .fillStyle(0xffde1e).fillPoints([{ x: 260, y: 0 }, { x: 330, y: 0 }, { x: 230, y: VIEW_H }, { x: 160, y: VIEW_H }], true)
        .fillStyle(0x0c0a0e).fillPoints([{ x: -560, y: 0 }, { x: 0, y: 0 }, { x: -100, y: VIEW_H }, { x: -660, y: VIEW_H }], true);
    }
    this.tweens.killTweensOf(this.wipeG);
    const z = this.cameras.main.zoom || 1, cx = VIEW_W / 2, cy = VIEW_H / 2, at = x => cx + (x - cx) / z;   // camera-pov: screen-sized at any zoom
    this.wipeG.setVisible(true).setPosition(at(-360), cy - cy / z).setScale(1 / z);
    this.tweens.add({ targets: this.wipeG, x: at(VIEW_W + 700), duration: 480, ease: 'Cubic.easeInOut', onComplete: () => this.wipeG.setVisible(false) });
  }
  fixUi(z) {                                                                       // keep the HUD / bars still while the camera zooms
    const cx = VIEW_W / 2, cy = VIEW_H / 2;
    for (const u of this.uiFix || []) { const g = u.g; if (!g || !g.scene) continue;
      const o = g.__ui || (g.__ui = { x: u.x, y: u.y, s: u.s });                  // camera-pov: the layout at zoom 1, kept once
      g.setScale(o.s / z).setPosition(cx + (o.x - cx) / z, cy + (o.y - cy) / z); }
  }
  uiItems() {                                                                      // camera-pov: everything drawn in screen space
    return [this.hud, this.letterbox, this.replayTxt, this.replayCap, this.rami && this.rami.c, this.wxG].filter(Boolean).map(g => ({ g, x: g.x, y: g.y, s: g.scaleX }));
  }
  baseZoom() { return window.__lab ? 1 : camZoom(); }                               // camera-pov: the picked distance (the Test Lab has its own slider)
  endReplay() {
    const r = this.replay; this.replay = null; if (!r) return;
    const menu = r.label === 'LAST GOAL' || r.label === 'HIGHLIGHT' || r.label === 'BUG CLIP';   // v0.8.2: watched from the pause menu / full time (v0.8.7: + BUG WATCH)
    if (r.kits) for (const q of this.all) if (q.spr.texture.key !== q.kit) q.spr.setTexture(q.kit);
    if (this.bwG && this.bwG.scene) this.bwG.clear().setVisible(false);
    this.cameras.main.setZoom(this.baseZoom()); this.fixUi(this.baseZoom()); if (!menu) this.lastReplayEnd = this.recN || 0;   // v0.8.1: skipping mid-zoom left the camera (and HUD) zoomed for good
    for (const q of this.all) q.anim = '';                                        // let every sprite pick its animation up again
    this.wipe();
    this.letterbox.setVisible(false); this.replayTxt.setVisible(false); this.replayCap.setVisible(false);
    for (const o of [this.cursor, this.power, this.ring, this.radar]) if (o) o.setVisible(true);
    if (!menu) this.rec = [];                                                     // (the match timeline carries on after a pause-menu replay)
    if (r.after) r.after();
  }
  playHighlights(done) {                                                           // every goal of the match, in order
    const H = this.highlights || []; if (!H.length) { done && done(); return; }
    const go = i => {
      if (i >= H.length) { done && done(); return; }
      this.startReplay('HIGHLIGHT', () => go(i + 1), H[i].frames, { caption: `HIGHLIGHTS ${i + 1}/${H.length} · ${H[i].cap}`, exit: () => done && done() });
    };
    go(0);
  }

  // ======================================================================= v0.8.4 MATCH FLOW (Luca, 23 Oct 02:55)
  // Like a real match: a TEAM SHEET before kick-off (swap players around - a placeholder for the final art), the teams
  // WALK OUT of the tunnel under the main stand while the camera takes in the crowd, ADDED TIME per half from the
  // time lost (IFAB Law 7: goals, cards, injuries, penalties, subs), the half ends at a calm moment - an attack in
  // their final third, a corner or a free kick near goal plays out first, a penalty is always completed (Law 7) - and
  // a real HALF-TIME break with the stats and SUBSTITUTIONS. The demo, the Test Lab and the old test page skip all of it.
  flowFast() { return !!window.HC2_TEST_FAST || this.demo || (!!window.__lab && !window.__labCut); }   // (v0.8.7: the Lab's CUT SCENES play the full versions)
  stat(team) { const S = (this.mstats = this.mstats || {}); return S[team.name] || (S[team.name] = { shots: 0, fouls: 0, yellows: 0, reds: 0, corners: 0, poss: 0 }); }
  loseTime(sec) { this.lost = (this.lost || 0) + sec; }
  resetHalfTime() { this.lost = 0; this.added = null; this.timeUp = null; if (this.addedTxt) this.addedTxt.setVisible(false); }
  announceAdded() {
    if (this.flowFast() && window.HC2_TEST_FAST) { this.added = 0; return; }   // the old tests end halves on the minute
    const lostMin = Math.ceil((this.lost || 0) / 60), close = Math.abs(this.home.score - this.away.score) <= 1;
    this.added = this.half === 1 ? clamp(1 + lostMin, 1, 5) : this.half === 2 ? clamp(2 + lostMin + (close ? 1 : 0), 2, 8) : clamp(lostMin, 1, 3);   // (a tight game: a bit more; extra time: 1-3)
    if (!this.addedTxt) {
      this.addedTxt = this.add.text(172, 59, '', { fontFamily: '"Press Start 2P"', fontSize: '12px', color: '#4cff7a', backgroundColor: '#0c0a0e', padding: { x: 6, y: 5 } });
      this.hud.add(this.addedTxt);
    }
    this.addedTxt.setText(`+${this.added}`).setVisible(true).setScale(1.6);
    this.tweens.add({ targets: this.addedTxt, scale: 1, duration: 900, ease: 'Back.easeOut' });
    if (!this.msg.text) this.say('', `+${this.added} MINUTE${this.added > 1 ? 'S' : ''} ADDED ON`, 2.2);
    const W = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT'][this.added];
    this.ramiSay('banter', { text: `${W} MINUTE${this.added > 1 ? 'S' : ''}\nADDED ON!`, expr: 'talk' }, 2);
  }
  // time is up: blow now, or let what's happening play out?
  canBlow() {
    if (window.HC2_TEST_FAST) return true;                                       // (the old test page: on the minute, like before)
    const T = this.timeUp.t, b = this.ball, sp = this.setPiece;
    if (this.penaltyMode || this.foulScene || this.freeze > 0 || this.pending) return false;
    if (sp) { if (sp.kind === 'PENALTY') return false; if (T > 20) return true;
      const gx = sp.team.goalX, near = len(b.x - gx, b.y - 34) < 35;
      return !(sp.kind === 'CORNER' || (sp.kind === 'FREE KICK' && near)); }        // a corner / free kick near goal: taken first
    if (T > 14) return true;                                                     // (the referee's patience, in real seconds)
    const o = b.owner;
    if (o) { if (o.keeper && o.hands) return true; return (o.x - o.team.ownGoalX) * o.team.side < 70; }   // an attack in their final third plays on
    if (b.shotBy || b.save) return false;                                        // a shot on its way
    for (const t of [this.home, this.away]) if (b.last === t && len(b.x - t.goalX, b.y - 34) < 30) return false;   // a ball into their box
    return true;
  }
  blowHalf() {
    this.timeUp = null; if (this.addedTxt) this.addedTxt.setVisible(false);
    if (this.half === 1) return this.halfTime();
    const level = this.home.score === this.away.score, E = this.endingRule();    // v0.8.5 endings
    if (this.half === 2) {
      this.clock = Math.max(this.clock, 90 * 60);
      if (level && (E === 'et' || E === 'golden' || E === 'etpens')) return this.extraTime();
      if (level && E === 'pens') return this.toPens('FULL TIME');
      return this.fullTime();
    }
    if (this.half === 3) { this.clock = Math.max(this.clock, 105 * 60); return this.etHalfTime(); }
    this.clock = Math.max(this.clock, 120 * 60);
    if (level && (E === 'golden' || E === 'etpens')) return this.toPens('AFTER EXTRA TIME');
    return this.fullTime('FULL TIME · AET');
  }
  // ---- HALF TIME: whistle, they walk off towards the tunnel, the stats + subs, then the second half
  halfTime() {
    SFX.whistle(2, true); this.ramiSay('half_time', {}, 3);
    this.say('HALF TIME', `${this.home.name} ${this.home.score} - ${this.away.score} ${this.away.name}`, 3);
    const b = this.ball; Object.assign(b, { owner: null, vx: 0, vy: 0, vz: 0, target: null, save: null, shotBy: null });
    this.setPiece = null; this.pending = null; this.dead = null; this.charge = -1;
    for (const p of this.all) { if (p.sentOff) continue; if (p.busy()) p.setState('idle', 0); p.hands = false; p.stun = 0; }
    if (this.flowFast()) { this.secondHalf(true); return; }                     // demo / tests: straight on, like before
    this.htAiSubs = ''; this.aiSubs(this.away); this.htSubsDone = true;          // (the computer's changes show on the card)
    this.ht = { t: 0, phase: 'off' }; this.stadium.cheer(2);
  }
  htTick(dt) {
    const H = this.ht; H.t += dt;
    if (H.phase === 'off' || H.phase === 'card' || H.phase === 'subs') {         // off they go, towards the tunnel
      for (const p of this.all) { if (p.sentOff) continue; p.moveTo(52.5 + (p.team.side < 0 ? 1.2 : -1.2) + (p.i % 3 - 1) * 0.5, -4.5, 1.9, dt); p.step(dt); if (p.y < -3.5) p.hide = true; }
      if (this.ref) { this.ref.goTo = { x: 52.5, y: -4.5 }; this.ref.step(dt); }
      this.camTarget = { x: wx(52.5, -2), y: wy(-9) };
      if (H.phase === 'off' && H.t > 3.2) { H.phase = 'card'; H.auto = 25; this.htCard(); }
      if (H.phase === 'card') { H.auto -= dt; if (H.auto <= 0) this.htDone(); }
    }
    Object.assign(this.ball, { x: 52.5, y: 34, z: 0, vx: 0, vy: 0, owner: null });
  }
  htInput() {
    const H = this.ht; if (!H) return;
    if (H.phase === 'card') { if (Input.pressed('start') || Input.pressed('pass')) this.htDone(); else if (Input.pressed('shoot')) this.openSheet('ht'); }
    else if (H.phase === 'subs') { if (Input.pressed('start') || Input.pressed('pass')) this.closeSheet(); }
  }
  htCard() {
    const S = t => this.stat(t), h = this.home, a = this.away, tot = Math.max(1, S(h).poss + S(a).poss);
    const row = (k, x, y) => `<tr><td>${x}</td><th>${k}</th><td>${y}</td></tr>`;
    const el = this.flowEl('ht');
    el.innerHTML = `<h2>HALF TIME</h2><div class="sc">${h.name} ${h.score} - ${a.score} ${a.name}</div>
      <table>${row('POSSESSION', Math.round(100 * S(h).poss / tot) + '%', Math.round(100 * S(a).poss / tot) + '%')}${row('SHOTS', S(h).shots, S(a).shots)}
      ${row('CORNERS', S(h).corners, S(a).corners)}${row('FOULS', S(h).fouls, S(a).fouls)}${row('CARDS', S(h).yellows + S(h).reds, S(a).yellows + S(a).reds)}</table>
      ${this.htAiSubs ? `<small>${this.htAiSubs}</small>` : ''}
      <div class="row"><button data-k="subs">SUBS (${keyset().shoot})</button><button data-k="go" class="go">SECOND HALF &#9654;</button></div><small>ENTER / ${keyset().pass}: SECOND HALF</small>`;
    el.querySelector('[data-k=subs]').onclick = () => this.openSheet('ht');
    el.querySelector('[data-k=go]').onclick = () => this.htDone();
  }
  htDone() { const H = this.ht; if (!H || H.done) return; H.done = true; this.closeFlowEl(); this.secondHalf(); }
  secondHalf(fast) {
    // fresh legs: the break gives some energy back; the computer brings on its most tired men
    for (const p of this.all) if (!p.sentOff) { if (!window.HC2_TEST_FAST) { p.stamina = Math.min(1, p.stamina + 0.35); p.tired = false; } p.hide = false; }
    if (!this.htSubsDone) { this.htAiSubs = ''; if (!window.HC2_TEST_FAST) { this.aiSubs(this.away); if (this.demo) this.aiSubs(this.home); } } this.htSubsDone = false;
    this.half = 2; this.clock = 45 * 60; this.resetHalfTime(); this.ht = null; this.camTarget = null;
    if (this.ref) this.ref.goTo = null;
    const second = (this.firstKick || this.home).opp; this.kickoff(second);   // v0.8.5: the side that didn't start the match
    if (fast) { this.say('HALF TIME', `${this.home.name} ${this.home.score} - ${this.away.score} ${this.away.name}`, 2.5); this.freeze = 2.6; return; }
    this.say('SECOND HALF', `${second.name} TO START`, 1.6);
    this.ramiSay('banter', { text: 'HERE WE GO,\nTHE SECOND HALF!', expr: 'talk' }, 2); this.freeze = 1.6;
  }
  // ---- squads: 11 on the pitch + a bench of 5 (12 = the spare keeper). A player's identity (shirt, legs, cards) moves
  // between slots when you swap; the slot is the position (0 keeper, 1-4 back four, 5-8 midfield, 9-10 up front)
  squadOf(team) {
    const Q = (this.squads = this.squads || {});
    if (!Q[team.name] || Q[team.name].team !== team) Q[team.name] = { team, subs: 0, bench: [12, 13, 14, 15, 16].map(n => ({ num: n, gk: n === 12, stamina: 1, yellows: 0, fouls: 0, used: false })) };
    return Q[team.name];
  }
  ident(p) { return { num: p.num, stamina: p.stamina, tired: p.tired, yellows: p.yellows || 0, fouls: p.fouls || 0, injury: p.injury || null }; }
  setIdent(p, d) { p.num = d.num; p.stamina = d.stamina; p.tired = !!d.tired; p.yellows = d.yellows || 0; p.fouls = d.fouls || 0; p.injury = d.injury || null; }
  aiSubs(team) {                                                                 // the computer: its most tired outfield man off (if he's spent)
    const Q = this.squadOf(team), out = [];
    const tired = team.players.filter(p => !p.keeper && !p.sentOff && (p.stamina < 0.65 || p.injury)).sort((u, v) => (v.injury ? 1 : 0) - (u.injury ? 1 : 0) || u.stamina - v.stamina).slice(0, 1);   // (v0.8.5: the injured first)
    for (const p of tired) { const sb = Q.bench.find(s => !s.gk && !s.used && !s.off); if (!sb || Q.subs >= 3) break;
      const offRec = { ...this.ident(p), off: true, used: true }; this.setIdent(p, { num: sb.num, stamina: 1, yellows: 0, fouls: 0 }); sb.used = true;
      Q.bench.push(offRec); Q.subs++; out.push(`${sb.num} ON, ${offRec.num} OFF`); }
    if (team !== this.home) this.htAiSubs = out.length ? `${team.name}: ${out.join(' · ')}` : '';
  }
  // ---- the overlay (team sheet / half time card): DOM, same look as the cup table
  flowEl(kind) {
    let el = document.getElementById('flow');
    if (!el) { el = document.createElement('div'); el.id = 'flow'; document.body.appendChild(el);
      const st = document.createElement('style'); st.textContent = `#flow{position:fixed;inset:0;z-index:6;display:flex;flex-direction:column;align-items:center;justify-content:safe center;gap:10px;overflow-y:auto;padding:16px;
        background:rgba(12,10,14,.72);color:#f4f0e4;font:10px/1.8 "Press Start 2P",monospace;text-align:center}
        #flow h2{margin:0;font-size:14px;background:#ffde1e;color:#0c0a0e;padding:10px 14px;border:3px solid #0c0a0e;box-shadow:4px 4px 0 #0c0a0e}
        #flow .sc{font-size:16px;color:#ffde1e} #flow table{border-collapse:collapse;background:#1d1a22;border:3px solid #0c0a0e;box-shadow:4px 4px 0 #0c0a0e}
        #flow td,#flow th{padding:4px 12px} #flow th{color:#28c8e6;font-weight:normal} #flow small{font-size:8px;opacity:.85}
        #flow .row{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}
        #flow button{font:11px "Press Start 2P",monospace;background:#f4f0e4;color:#0c0a0e;padding:10px 12px;border:3px solid #0c0a0e;box-shadow:3px 3px 0 #0c0a0e;cursor:pointer}
        #flow button.go{background:#ff2878;color:#fff}
        #flow .sheet{display:flex;gap:14px;flex-wrap:wrap;justify-content:center;align-items:flex-start}
        #flow .pitch{position:relative;width:min(300px,78vw);aspect-ratio:68/58;max-width:100%;background:repeating-linear-gradient(0deg,#1f9e3a 0 18px,#24ad41 18px 36px);border:3px solid #0c0a0e;box-shadow:4px 4px 0 #0c0a0e;
          background-clip:padding-box;outline:2px solid #f4f0e4;outline-offset:-10px}
        #flow .pitch:after{content:"";position:absolute;left:30%;right:30%;bottom:8px;height:16%;border:2px solid #f4f0e4;border-bottom:0}
        #flow .tk{position:absolute;transform:translate(-50%,-50%);width:34px;height:34px;display:flex;flex-direction:column;align-items:center;justify-content:center;
          border:3px solid #0c0a0e;box-shadow:2px 2px 0 #0c0a0e;cursor:pointer;font-size:11px;padding:0;line-height:1;z-index:1}
        #flow .tk i{display:block;width:24px;height:4px;margin-top:3px;background:#0c0a0e} #flow .tk i b{display:block;height:100%;background:#4cff7a}
        #flow .tk.sel{outline:3px solid #ffde1e;outline-offset:2px} #flow .tk.yc:after{content:"";position:absolute;right:-6px;top:-6px;width:7px;height:10px;background:#ffde1e;border:1px solid #0c0a0e}
        #flow .tk.off{opacity:.35;cursor:default} #flow .tk.inj:before{content:"+";position:absolute;left:-7px;top:-8px;width:13px;height:13px;line-height:13px;font-size:11px;background:#ff2878;color:#fff;border:1px solid #0c0a0e}
        #flow .bench{display:flex;flex-direction:column;gap:8px;align-items:center;background:#1d1a22;border:3px solid #0c0a0e;box-shadow:4px 4px 0 #0c0a0e;padding:10px}
        #flow .bench .tk{position:relative;transform:none}
        #flow .opts{display:grid;gap:8px;width:min(620px,100%)} #flow .opt{display:grid;grid-template-columns:150px 1fr;gap:10px;align-items:center;background:#1d1a22;border:3px solid #0c0a0e;padding:8px 10px;text-align:left}
        #flow .opt.on{outline:3px solid #ffde1e;outline-offset:1px} #flow .opt b{font-weight:normal;color:#28c8e6;font-size:9px}
        #flow .ch{display:flex;flex-wrap:wrap;gap:6px} #flow .ch button{font-size:9px;padding:7px 8px;box-shadow:2px 2px 0 #0c0a0e}
        #flow .ch button[aria-pressed=true]{background:#ffde1e} #flow .menu{display:grid;gap:8px;width:min(360px,100%)}
        #flow .menu button{display:flex;justify-content:space-between;align-items:center;gap:10px;text-align:left} #flow .menu button.on{background:#ffde1e;outline:3px solid #f4f0e4;outline-offset:1px}
        #flow .menu kbd{font:8px "Press Start 2P",monospace;background:#0c0a0e;color:#f4f0e4;padding:3px 5px}
        #flow table.mv{max-width:min(620px,100%);text-align:left} #flow table.mv th{color:#ffde1e;white-space:nowrap;vertical-align:top} #flow table.mv td{font-size:9px}
        @media (max-width:560px){ #flow .opt{grid-template-columns:1fr} }`;
      el.appendChild(st); }
    el.dataset.kind = kind; el.style.display = 'flex';
    [...el.children].forEach(c => { if (c.tagName !== 'STYLE') c.remove(); });
    const box = document.createElement('div'); box.className = 'box'; box.style.cssText = 'display:contents'; el.appendChild(box);
    return { set innerHTML(h) { box.innerHTML = h; }, querySelector: s => box.querySelector(s), querySelectorAll: s => box.querySelectorAll(s) };
  }
  closeFlowEl() { const el = document.getElementById('flow'); if (el) el.style.display = 'none'; }
  // ---- TEAM SHEET (before kick-off: any swaps; at half time: bench swaps are subs, 3 a match, no coming back)
  openSheet(mode) {
    const team = this.home, Q = this.squadOf(team), hcol = '#' + (TEAMS[team.name] ? TEAMS[team.name].col : 0xf4f0e4).toString(16).padStart(6, '0');
    this.sheet = { mode, sel: null }; if (this.ht) this.ht.phase = 'subs';
    const el = this.flowEl('sheet');
    const tok = (d, k, extra = '', st = '') => `<button class="tk ${extra}" data-k="${k}" style="background:${hcol};color:#0c0a0e;${st}" aria-label="number ${d.num}">${d.num}${mode !== 'pre' ? `<i><b style="width:${Math.round(100 * (d.stamina ?? 1))}%"></b></i>` : ''}</button>`;
    const draw = () => {
      const pos = i => { const f = FORMATION[i]; return `left:${(f[1] / 68 * 100).toFixed(1)}%;top:${(96 - f[0] / 50 * 88).toFixed(1)}%`; };
      const xi = team.players.map((p, i) => tok(p, 'p' + i, `${p.sentOff ? 'off' : ''} ${(p.yellows || 0) ? 'yc' : ''} ${p.injury ? 'inj' : ''} ${this.sheet.sel === 'p' + i ? 'sel' : ''}`, pos(i))).join('');
      const bench = Q.bench.map((d, j) => tok(d, 'b' + j, `${d.used ? 'off' : ''} ${this.sheet.sel === 'b' + j ? 'sel' : ''}`)).join('');
      const left = 3 - Q.subs;
      el.innerHTML = `<h2>${mode === 'ht' ? 'HALF TIME · SUBS' : mode === 'pause' ? 'SUBS' : 'TEAM SHEET'} · ${team.name}</h2>
        <div class="sheet"><div class="pitch">${xi}</div><div class="bench"><small>BENCH</small>${bench}<small>12 = KEEPER</small></div></div>
        <small>${this.sheetMsg || (mode !== 'pre' ? `TAP A PLAYER, THEN WHO COMES ON · ${left} SUB${left === 1 ? '' : 'S'} LEFT` : 'TAP TWO PLAYERS TO SWAP THEM (POSITIONS OR THE BENCH)')}</small>
        <div class="row"><button data-k="done" class="go">${mode !== 'pre' ? 'DONE' : 'WALK OUT'} &#9654;</button></div><small>ENTER / ${keyset().pass}: ${mode !== 'pre' ? 'DONE' : 'WALK OUT'}</small>`;
      el.querySelectorAll('.tk').forEach(b => b.onclick = () => this.sheetTap(b.dataset.k, draw));
      el.querySelector('[data-k=done]').onclick = () => this.closeSheet();
    };
    this.sheetMsg = ''; draw();
  }
  sheetTap(k, draw) {
    const S = this.sheet, team = this.home, Q = this.squadOf(team);
    const get = key => key[0] === 'p' ? { p: team.players[+key.slice(1)] } : { b: Q.bench[+key.slice(1)], j: +key.slice(1) };
    const A = get(k); this.sheetMsg = '';
    if ((A.p && A.p.sentOff) || (A.b && A.b.used)) return;
    if (!S.sel) { S.sel = k; return draw(); }
    if (S.sel === k) { S.sel = null; return draw(); }
    const B = get(S.sel); S.sel = null;
    const isGk = x => x.p ? x.p.keeper : x.b.gk;
    if (isGk(A) !== isGk(B)) { this.sheetMsg = 'KEEPERS ONLY SWAP WITH THE OTHER KEEPER'; return draw(); }
    if (A.b && B.b) { const t = Q.bench[A.j]; Q.bench[A.j] = Q.bench[B.j]; Q.bench[B.j] = t; return draw(); }
    if (A.p && B.p) { const t = this.ident(A.p); this.setIdent(A.p, this.ident(B.p)); this.setIdent(B.p, t); return draw(); }
    const P = A.p ? A.p : B.p, X = A.b ? A : B;                                     // pitch <-> bench
    if (S.mode !== 'pre') {
      if (Q.subs >= 3) { this.sheetMsg = 'NO SUBS LEFT (3 A MATCH)'; return draw(); }
      const offRec = { ...this.ident(P), used: true, off: true }; this.setIdent(P, { num: X.b.num, stamina: 1, yellows: 0, fouls: 0 });
      Q.bench[X.j] = offRec; Q.subs++; SFX.whistle(1);
      this.sheetMsg = `${P.num} ON, ${offRec.num} OFF`;
    } else { const t = this.ident(P); this.setIdent(P, { num: X.b.num, stamina: 1, yellows: 0, fouls: 0 }); Q.bench[X.j] = { ...X.b, num: t.num }; }
    draw();
  }
  closeSheet() {
    const S = this.sheet; if (!S) return; this.sheet = null;
    if (S.mode === 'pre') { this.lineup = this.lineup || {}; const Q = this.squadOf(this.home);
      this.lineup[this.home.name] = { xi: this.home.players.map(p => p.num), bench: Q.bench.map(d => d.num) };   // kept for your next match
      this.closeFlowEl(); this.startIntro(); return; }
    if (S.mode === 'pause') { this.drawPause(); return; }                         // v0.8.5 back to the pause menu
    if (this.ht) { this.ht.phase = 'card'; this.ht.auto = 25; this.htCard(); }
  }
  applyLineup(team) {                                                             // your last team sheet, in the next match too
    const L = this.lineup && this.lineup[team.name]; if (!L) return;
    team.players.forEach((p, i) => { if (L.xi[i] != null) p.num = L.xi[i]; });
    const Q = this.squadOf(team); Q.bench.forEach((d, j) => { if (L.bench[j] != null) d.num = L.bench[j]; d.gk = d.num === 1 || d.num === 12; });   // (the spare keeper is 1 or 12)
  }
  // ---- before kick-off: the team sheet, then the walk-out (index.html / the cup / AGAIN call this after setTeams)
  preMatch() {
    if (this.flowFast() || window.HC2_SKIP_INTRO) return;
    this.pre = true; this.freeze = 0; this.msg.setText(''); this.sub.setText(''); this.openSetup();                          // v0.8.5: match settings, then the team sheet
    this.camTarget = { x: wx(22, -12), y: wy(-11.5) };                            // the stand behind the sheet (its art loads before the walk-out)
  }
  // ---- WALK-OUT: the camera takes in the main stand, the teams + the referee come out of the tunnel (under the stand,
  // halfway line), line up facing the camera, then break to their positions. Any key skips. Existing art only.
  startIntro() {
    this.pre = false;
    const T = { x: 52.5, y: -5.2 };
    this.intro = { t: 0, phase: 'crowd' };
    this.all.forEach(p => { if (p.sentOff) return; p.x = T.x + (p.team.side > 0 ? -0.6 : 0.6); p.y = T.y; p.vx = p.vy = 0; p.state = 'idle'; p.hide = true; });
    // the line-up: home to the left of the referee, away to the right, 4 m in from the touchline
    const row = (t, k) => ({ x: 52.5 + (t.side > 0 ? -1 : 1) * (1.3 + k * 1.05), y: 3.6 });
    for (const t of [this.home, this.away]) t.players.filter(p => !p.sentOff).forEach((p, k) => { p.lineSpot = row(t, k); p.walkAt = 2.1 + k * 0.2 + (t.side > 0 ? 0 : 0.1); });
    if (this.ref) { this.ref.x = T.x; this.ref.y = T.y; this.ref.goTo = null; this.ref.walkAt = 1.9; this.ref.hidden = true; }
    this.camX = wx(22, -12); this.camY = wy(-11.5);                               // (straight onto the stand, no swing over the grass)
    this.stadium.cheer(14); SFX.roar(3, 0.6);
    this.say(this.arenaName(), `${this.home.name} v ${this.away.name}`, 2.6);
    this.ramiSay('kickoff', { text: 'WELCOME TO\nHET KLEINE LOO!', expr: 'talk' }, 3); this.ramiHello = true;
    for (const o of [this.cursor, this.ring]) if (o) o.setVisible(false);
  }
  introTick(dt) {
    const I = this.intro; I.t += dt;
    const skip = Input.pressed('start') || Input.pressed('pass') || Input.pressed('shoot');
    if (skip && I.t > 0.4) return this.endIntro();
    if (I.t < 3) { const k = clamp(I.t / 3, 0, 1), e = k * k * (3 - 2 * k); this.camTarget = { x: wx(22 + e * 61, -12), y: wy(-11.5) }; this.camFast = true; }   // the main stand, left to right
    else this.camFast = false;
    let maxT = 0, walking = 0, sx = 0, n = 0;
    for (const p of this.all) {
      if (p.sentOff || !p.lineSpot) continue;
      if (I.t < p.walkAt) continue;
      p.hide = false;
      const d = p.moveTo(p.lineSpot.x, p.lineSpot.y, 2.25, dt); p.step(dt);
      if (d < 0.25) { p.vx = p.vy = 0; p.face = 6; } else walking++;
      sx += p.x; n++;
    }
    if (this.ref) { if (I.t >= this.ref.walkAt) { this.ref.hidden = false; this.ref.goTo = { x: 52.5, y: 3.6 }; } this.ref.step(dt); }
    const cx = n ? sx / n : 52.5;
    if (I.t >= 3) this.camTarget = { x: wx(cx, 4), y: wy(3.5) - 110 };
    if (I.phase === 'crowd' && I.t >= 2.1) { I.phase = 'walk'; this.ramiSay('banter', { text: 'AND HERE THEY COME,\nOUT OF THE TUNNEL!', expr: 'talk' }, 3); }
    if (I.phase === 'walk' && I.t > 6 && walking === 0) { I.phase = 'line'; I.lineT = I.t; SFX.roar(3, 0.8); this.stadium.cheer(4); }
    if (I.phase === 'line' && I.t - I.lineT > 2.2) this.endIntro();
    if (I.t > 22) this.endIntro();
  }
  endIntro() {
    this.intro = null; this.camTarget = null; this.camFast = false;
    for (const p of this.all) { p.lineSpot = null; p.hide = false; }
    if (this.ref) { this.ref.hidden = false; this.ref.goTo = null; }
    for (const o of [this.cursor, this.ring]) if (o) o.setVisible(true);
    this.startToss();                                                            // v0.8.5: the coin decides who kicks off
  }

  // ======================================================================= v0.8.5 MENUS + ENDINGS + COIN TOSS (Luca, 23 Oct 04:09)
  // Before the team sheet: MATCH SETTINGS - arena, time of day, weather, what happens when it's level at 90 (crude
  // placeholders for the art: a tint, rain / snow on screen, a little ball physics). ENDINGS: a draw, extra time (2 x 15),
  // golden goal, extra time + penalties, penalties at 90. After the walk-out the COIN TOSS (PixelLab coin: RISE / the RISE
  // arrow) decides who kicks off. A real PAUSE MENU: resume, team + subs, the moves, options, replays, quit.
  loadRules() {
    const R = { arena: 'loo', tod: 'day', weather: 'clear', ending: 'none' };
    try { const s = JSON.parse(localStorage.getItem('hc2-rules') || 'null'); if (s) for (const k in R) if (RULE_OPTS[k].some(o => o[0] === s[k])) R[k] = s[k]; } catch (e) {}
    return R;
  }
  saveRules() { try { localStorage.setItem('hc2-rules', JSON.stringify(this.mset)); } catch (e) {} }
  inCup() { return !!(this.cup && this.cupLive); }
  setupRows() {
    const rows = [{ k: 'arena', label: 'ARENA' }, { k: 'tod', label: 'TIME OF DAY' }, { k: 'weather', label: 'WEATHER' }];
    if (!this.inCup()) rows.push({ k: 'ending', label: 'LEVEL AT 90?' });
    return rows.map(r => ({ ...r, opts: RULE_OPTS[r.k] }));
  }
  openSetup() {
    this.mset = this.loadRules(); this.setup = { row: 0 };
    const R = this.mset, el = this.flowEl('setup');
    const draw = () => {
      const rows = this.setupRows(), S = this.setup; if (!S) return;
      const cupNote = this.inCup() ? (this.cup.stage === 'final' ? 'THE FINAL: LEVEL AT 90 = EXTRA TIME, THEN PENALTIES' : 'GROUP GAME: A DRAW IS A DRAW') : '';
      el.innerHTML = `<h2>MATCH SETTINGS</h2><div class="sc">${this.home.name} v ${this.away.name} · ${(DIFF_OPTS.find(o => o[0] === DIFF_LEVEL) || DIFF_OPTS[1])[1]}${AI_MODE === 'classic' ? ' · CLASSIC AI: THE LEVEL BARELY APPLIES' : ''}</div>
        <div class="opts">${rows.map((r, i) => `<div class="opt${S.row === i ? ' on' : ''}"><b>${r.label}</b><div class="ch">${r.opts.map(([k, l]) =>
          `<button type="button" data-r="${i}" data-v="${k}" aria-pressed="${R[r.k] === k}">${l}</button>`).join('')}</div></div>`).join('')}</div>
        ${cupNote ? `<small>${cupNote}</small>` : ''}<small>ARENAS, LIGHT + WEATHER ARE PLACEHOLDERS FOR NOW (THE ART COMES LATER)</small>
        <div class="row"><button type="button" data-k="go" class="go">TEAM SHEET &#9654;</button></div>
        <small>&#8593;&#8595; PICK A ROW · &#8592;&#8594; CHANGE · ENTER / ${keyset().pass}: TEAM SHEET</small>`;
      el.querySelectorAll('.ch button').forEach(b => b.onclick = () => { const r = this.setupRows()[+b.dataset.r]; R[r.k] = b.dataset.v; S.row = +b.dataset.r; SFX.click(); draw(); });
      el.querySelector('[data-k=go]').onclick = () => this.closeSetup();
    };
    this.setup.draw = draw; draw();
  }
  setupInput() {
    const S = this.setup, rows = this.setupRows(), R = this.mset, n = Input.nav();
    if (n.y) { S.row = (S.row + n.y + rows.length) % rows.length; SFX.click(); S.draw(); }
    if (n.x) { const r = rows[S.row], i = r.opts.findIndex(o => o[0] === R[r.k]); R[r.k] = r.opts[(i + n.x + r.opts.length) % r.opts.length][0]; SFX.click(); S.draw(); }
    if (Input.pressed('start') || Input.pressed('pass')) this.closeSetup();
  }
  closeSetup() {
    if (!this.setup) return; this.setup = null; this.saveRules(); this.applyRules(); SFX.click(); this.openSheet('pre');
  }
  // the settings in play: physics for the weather, the light + weather on screen
  applyRules() {
    const R = this.mset || {}, w = R.weather || 'clear', B = BASE_PHYS;
    SKID_DEC = B.SKID_DEC * (w === 'rain' ? 0.72 : w === 'snow' ? 1.3 : 1);       // wet grass: the ball skids on; snow: it dies
    ROLL_DEC = B.ROLL_DEC * (w === 'rain' ? 0.82 : w === 'snow' ? 1.45 : 1);
    BOUNCE_Z = B.BOUNCE_Z * (w === 'rain' ? 0.9 : w === 'snow' ? 0.68 : 1);
    BOUNCE_X = Math.min(0.97, B.BOUNCE_X * (w === 'rain' ? 1.06 : w === 'snow' ? 0.85 : 1));
    this.buildSky();
  }
  buildSky() {
    const R = this.mset || {}, tod = R.tod || 'day', w = R.weather || 'clear';
    if (!this.sky) {
      this.sky = this.add.rectangle(VIEW_W / 2, VIEW_H / 2, VIEW_W * 3, VIEW_H * 3, 0xffffff).setScrollFactor(0).setDepth(7.9e6).setBlendMode(Phaser.BlendModes.MULTIPLY);
      this.wxG = this.add.graphics().setScrollFactor(0).setDepth(7.95e6);
    }
    let col = mulCol(ARENA_TINT[R.arena] || 0xffffff, tod === 'night' ? 0x5c6cb4 : tod === 'sunset' ? 0xffc490 : 0xffffff);
    if (w === 'rain') col = mulCol(col, 0xc2cad6); else if (w === 'snow') col = mulCol(col, 0xeef2ff);
    this.sky.setFillStyle(col).setVisible(col !== 0xffffff);
    this.flakes = w === 'clear' ? null : Array.from({ length: w === 'rain' ? 150 : 110 }, () => ({ x: Math.random() * VIEW_W, y: Math.random() * VIEW_H, s: 0.6 + Math.random() * 0.8, p: Math.random() * 6.3 }));
    this.wxKind = w; this.wxG.clear();
  }
  weatherTick(dt) {
    const F = this.flakes, g = this.wxG; if (!g) return; g.clear(); if (!F) return;
    const rain = this.wxKind === 'rain';
    g.fillStyle(0xffffff, rain ? 0.42 : 0.85); g.lineStyle(1, 0xdde6f4, 0.5);
    for (const f of F) {
      if (rain) { f.x -= 160 * dt * f.s; f.y += 760 * dt * f.s; g.lineBetween(f.x, f.y, f.x - 3, f.y + 12 * f.s); }
      else { f.p += dt * 1.6; f.x += Math.sin(f.p) * 22 * dt; f.y += 46 * dt * f.s; const z = f.s > 1.1 ? 3 : 2; g.fillRect(Math.round(f.x), Math.round(f.y), z, z); }
      if (f.y > VIEW_H + 10) { f.y = -12; f.x = Math.random() * (VIEW_W + 120); } if (f.x < -10) f.x += VIEW_W + 20; else if (f.x > VIEW_W + 10) f.x -= VIEW_W + 20;
    }
  }
  arenaName() { const a = RULE_OPTS.arena.find(o => o[0] === (this.mset && this.mset.arena)); return a ? a[1] : 'HET KLEINE LOO'; }

  // ---- ENDINGS: what happens when it's level at the end of normal time
  endingRule() {
    if (this.inCup()) return this.cup.stage === 'final' ? (window.HC2_TEST_FAST ? 'pens' : 'etpens') : 'none';
    return (this.mset && this.mset.ending) || 'none';
  }
  halfLabel() { return ['1ST', '2ND', 'ET1', 'ET2'][this.half - 1] || '2ND'; }
  afterGoal(conceded) {                                                          // after a goal (and its replay)
    if (this.golden && this.half >= 3) return this.fullTime('GOLDEN GOAL!');
    if (this.timeUp) return this.blowHalf();
    this.kickoff(conceded);
  }
  stopPlay() {
    const b = this.ball; Object.assign(b, { owner: null, vx: 0, vy: 0, vz: 0, target: null, save: null, shotBy: null });
    this.setPiece = null; this.pending = null; this.dead = null; this.charge = -1;
    for (const p of this.all) { if (p.sentOff) continue; if (p.busy()) p.setState('idle', 0); p.hands = false; p.stun = 0; p.vx = p.vy = 0; }
  }
  extraTime() {
    const golden = this.endingRule() === 'golden';
    SFX.whistle(3, true); this.stopPlay();
    this.say('EXTRA TIME', `${this.home.name} ${this.home.score} - ${this.away.score} ${this.away.name} · ${golden ? 'GOLDEN GOAL: NEXT GOAL WINS' : '2 x 15 MINUTES'}`, 3.2);
    this.ramiSay('banter', { text: golden ? 'ALL SQUARE!\nNEXT GOAL WINS IT!' : 'ALL SQUARE!\nWE GO TO EXTRA TIME!', expr: 'shock' }, 3);
    this.half = 3; this.clock = 90 * 60; this.resetHalfTime(); this.golden = golden; this.stadium.cheer(3);
    for (const p of this.all) if (!p.sentOff && !window.HC2_TEST_FAST) { p.stamina = Math.min(1, p.stamina + 0.12); p.tired = false; }   // a short break on the pitch
    if (this.flowFast()) { this.kickoff(this.firstKick || this.home); this.etFirst = this.firstKick || this.home; this.freeze = 2.4; return; }
    this.freeze = 99; const ep = this.epoch;
    this.time.delayedCall(2600, () => { if (ep !== this.epoch || this.over) return; this.freeze = 0;
      this.startToss({ quick: true, after: t => { this.etFirst = t; this.kickoff(t); this.say('EXTRA TIME', `${t.name} TO START${golden ? ' · GOLDEN GOAL' : ''}`, 1.8); this.freeze = 1.8; } }); });
  }
  etHalfTime() {                                                                 // after 105 min: change round, no break
    SFX.whistle(2); this.half = 4; this.clock = 105 * 60; this.resetHalfTime();
    const t = (this.etFirst || this.home).opp; this.kickoff(t);
    this.say('EXTRA TIME · 2ND HALF', `${this.home.name} ${this.home.score} - ${this.away.score} ${this.away.name} · ${t.name} TO START`, 2.4); this.freeze = 2.4;
  }
  toPens(head) {
    if (this.inCup()) this.cupPens = true; else this.matchPens = true;
    this.stopPlay(); SFX.whistle(3, true);
    this.say(head, 'LEVEL - IT GOES TO PENALTIES!', 3);
    this.ramiSay('full_time', { text: this.inCup() ? 'ALL SQUARE IN THE FINAL!\nPENALTIES!!' : 'ALL SQUARE!\nPENALTIES!!', expr: 'shock' }, 3);
    const ep = this.epoch; this.time.delayedCall(3200, () => { if (ep === this.epoch) this.startShootout(true); }); this.over = true;
  }
  fullTime(head) {
    this.over = true; this.golden = false; this.say(head || 'FULL TIME', this.ftLine(), 99999); SFX.whistle(3, true); SFX.roar(4, 0.7);
    { const h = this.home.score, a = this.away.score; this.ramiSay('full_time', h === a ? { text: 'THAT IS FULL TIME!\nHONOURS EVEN!' } : head === 'GOLDEN GOAL!' ? { text: `GOLDEN GOAL!!\n${(h > a ? this.home : this.away).name} WIN IT!`, expr: 'laugh' } : { WINNER: (h > a ? this.home : this.away).name }, 3); }
    for (const p of this.all) { if (p.sentOff) continue; p.vx = p.vy = 0; p.speed = 0; if (p.busy()) p.setState('idle', 0);   // everyone stops
      if (!p.keeper && MAN.kits[p.kit].anims['applaud-S']) { p.setState('applaud', 999); p.face = 6; } }
  }

  // ---- COIN TOSS (after the walk-out; again before extra time): the captains + the referee at the centre spot, you call
  // it, the referee flips the PixelLab coin (RISE on one side, the RISE arrow on the other), the winner picks who kicks off
  startToss(opts = {}) {
    const done = t => (opts.after ? opts.after(t) : this.kickoff(t));
    if (this.flowFast() || !this.textures.exists('coin')) { this.firstKick = this.firstKick || this.home; return done(opts.quick ? this.home : this.firstKick); }
    for (const p of this.all) { if (p.sentOff) continue; p.x = p.home.x; p.y = p.home.y; p.vx = p.vy = 0; p.state = 'idle'; p.hide = false; p.face = p.team.side > 0 ? 0 : 4; }
    const cap = t => t.players.filter(p => !p.sentOff && !p.keeper).sort((a, b) => b.i - a.i)[0] || t.players[0];
    const ch = cap(this.home), ca = cap(this.away);
    ch.x = 51.1; ch.y = 34.3; ch.face = 0; ca.x = 53.9; ca.y = 34.3; ca.face = 4;
    if (this.ref) { this.ref.x = 52.5; this.ref.y = 33.2; this.ref.vx = this.ref.vy = 0; this.ref.goTo = null; this.ref.face = 6; this.ref.hidden = false; }
    Object.assign(this.ball, { x: 52.5, y: 34, z: 0, vx: 0, vy: 0, vz: 0, owner: null, target: null });
    this.setPiece = null; this.pending = null; this.dead = null; this.freeze = 0;
    this.camTarget = { x: wx(52.5, 34), y: wy(34) - Math.round(VIEW_H * 0.4) };                      // (the centre spot low in the shot: the coin above the captains)
    this.camX = this.camTarget.x; this.camY = this.camTarget.y;                  // (a cut, not a pan)
    const human = !this.demo, quick = !!opts.quick;
    const ph = quick || !human ? 'auto' : 'call';
    this.toss = { t: 0, phase: ph, phase0: ph, call: 0, pick: 0, quick, human, done, spin: 0 };
    if (!this.coinUi) {
      const F = '"Press Start 2P"';
      this.coinUi = {
        dim: this.add.rectangle(VIEW_W / 2, VIEW_H / 2, VIEW_W, VIEW_H, 0x0c0a0e, 0.35),
        sh: this.add.ellipse(VIEW_W / 2, COIN_Y + 92, 110, 18, 0x0c0a0e, 0.45),
        coin: this.add.image(VIEW_W / 2, COIN_Y, 'coin', 'rise-0').setScale(COIN_S),
        a: this.add.text(VIEW_W / 2 - 235, COIN_Y, '', { fontFamily: F, fontSize: '14px', color: '#0c0a0e', backgroundColor: '#f4f0e4', padding: { x: 10, y: 8 } }).setOrigin(0.5),
        b: this.add.text(VIEW_W / 2 + 235, COIN_Y, '', { fontFamily: F, fontSize: '14px', color: '#0c0a0e', backgroundColor: '#f4f0e4', padding: { x: 10, y: 8 } }).setOrigin(0.5),
        hint: this.add.text(VIEW_W / 2, VIEW_H * 0.26 + 72, '', { fontFamily: F, fontSize: '9px', color: '#f4f0e4', stroke: '#0c0a0e', strokeThickness: 4 }).setOrigin(0.5),
      };
      const U = this.coinUi; this.hud.add([U.dim, U.sh, U.coin, U.a, U.b, U.hint]); this.hud.bringToTop(this.msg); this.hud.bringToTop(this.sub);
      U.a.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.tossPick(0));
      U.b.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.tossPick(1));
    }
    this.tossUi(true);
    this.say('COIN TOSS', quick ? 'FOR EXTRA TIME' : `${this.arenaName()} · ${this.home.name} v ${this.away.name}`, 99);
    if (this.toss.phase === 'call') this.ramiSay('banter', { text: 'THE CAPTAINS MEET.\nCALL IT!', expr: 'talk' }, 4);
    this.tossDraw();
  }
  tossUi(on) { const U = this.coinUi; if (!U) return; for (const k in U) U[k].setVisible(on); this.ballSpr.setVisible(!on); if (this.cursor) this.cursor.setVisible(!on); }
  tossPick(i) {                                                                  // a click on one of the two choices
    const T = this.toss; if (!T) return;
    if (T.phase === 'call') { T.call = i; this.tossGo(); } else if (T.phase === 'choose') { T.pick = i; this.tossChosen(); }
  }
  tossGo() {                                                                     // the referee flips it
    const T = this.toss; T.phase = 'flip'; T.t = 0; T.result = Math.random() < 0.5 ? 0 : 1;   // 0 = RISE, 1 = ARROW
    if (T.human && T.phase0 === 'call') T.winner = T.call === T.result ? this.home : this.away;   // you called it
    else { T.call = Math.random() < 0.5 ? 0 : 1; T.winner = Math.random() < 0.5 ? this.home : this.away; }
    if (this.ref) this.ref.act('whistle', 0.6);
    this.msg.setText(''); this.sub.setText('');                                  // (the coin flies up through where the title was)
    SFX.flick(); this.tossDraw();
  }
  tossChosen() {
    const T = this.toss, kicks = T.winner === this.home ? (T.pick === 0 ? this.home : this.away) : T.winner;
    this.endToss(kicks);
  }
  endToss(kicks) {
    const T = this.toss; if (!T) return; this.toss = null; this.tossUi(false); this.camTarget = null; this.msg.setText(''); this.sub.setText('');
    if (!T.quick) this.firstKick = kicks;
    T.done(kicks);
  }
  tossTick(dt) {
    const T = this.toss; T.t += dt; const U = this.coinUi;
    if (Input.pressed('shoot') && T.phase !== 'flip') {                            // K / X: skip it
      if (!T.winner) { T.result = Math.random() < 0.5 ? 0 : 1; T.winner = Math.random() < 0.5 ? this.home : this.away; }
      return this.endToss(T.winner);
    }
    if (T.phase === 'auto' && T.t > 0.8) this.tossGo();
    else if (T.phase === 'call') {
      const n = Input.nav(); if (n.x) { T.call = n.x < 0 ? 0 : 1; SFX.click(); this.tossDraw(); }
      if (Input.pressed('start') || Input.pressed('pass') || T.t > 8) this.tossGo();
    } else if (T.phase === 'flip') {
      const D = 1.7, k = clamp(T.t / D, 0, 1);
      T.spin += dt * (26 - 20 * k);                                              // fast, then slower as it comes down
      const lift = Math.sin(k * Math.PI) * VIEW_H * 0.24;
      U.coin.setY(Math.round(COIN_Y - lift)); U.sh.setScale(1 - 0.55 * Math.sin(k * Math.PI), 1).setAlpha(0.45 - 0.25 * Math.sin(k * Math.PI));
      const cyc = COIN_SPIN, i = Math.floor(T.spin) % cyc.length;
      if (k >= 1) { U.coin.setFrame(T.result ? 'arrow-0' : 'rise-0').setY(COIN_Y); SFX.coin(); T.phase = 'show'; T.t = 0;
        this.say(T.result ? 'ARROW!' : 'RISE!', `${T.winner.name} WIN THE TOSS`, 99); this.stadium.cheer(1.5); this.tossDraw(); }
      else U.coin.setFrame(cyc[i]);
    } else if (T.phase === 'show') {
      U.coin.setScale(COIN_S + Math.max(0, 0.5 - T.t) * 0.7);
      if (T.t > 1.5) {
        if (T.human && T.phase0 === 'call' && T.winner === this.home) { T.phase = 'choose'; T.t = 0; T.pick = 0; this.say('YOU WON THE TOSS', 'WHO KICKS OFF?', 99); this.tossDraw(); }
        else { const kicks = T.winner; this.say(T.result ? 'ARROW!' : 'RISE!', `${T.winner.name} WIN THE TOSS · ${kicks.name} KICK OFF`, 1.2); this.endToss(kicks); }
      }
    } else if (T.phase === 'choose') {
      const n = Input.nav(); if (n.x) { T.pick = n.x < 0 ? 0 : 1; SFX.click(); this.tossDraw(); }
      if (Input.pressed('start') || Input.pressed('pass') || T.t > 7) this.tossChosen();
    }
  }
  tossDraw() {
    const T = this.toss, U = this.coinUi; if (!T || !U) return;
    const k = keyset(), sel = (o, on) => o.setStyle({ backgroundColor: on ? '#ffde1e' : '#f4f0e4' }).setScale(on ? 1.08 : 1);
    if (T.phase === 'call') { U.a.setText('◀ RISE'); U.b.setText('ARROW ▶'); sel(U.a, T.call === 0); sel(U.b, T.call === 1); U.hint.setText(`CALL IT · ENTER / ${k.pass}: FLIP · ${k.shoot}: SKIP`); U.a.setVisible(true); U.b.setVisible(true);
      U.coin.setFrame(T.call ? 'arrow-0' : 'rise-0').setY(COIN_Y).setScale(COIN_S); }
    else if (T.phase === 'choose') { U.a.setText('◀ WE KICK OFF'); U.b.setText('THEY KICK OFF ▶'); sel(U.a, T.pick === 0); sel(U.b, T.pick === 1); U.hint.setText(`ENTER / ${k.pass}: OK`); U.a.setVisible(true); U.b.setVisible(true); }
    else { U.a.setVisible(false); U.b.setVisible(false); U.hint.setText(T.phase === 'flip' ? '' : T.phase === 'auto' ? (T.quick ? 'A NEW TOSS FOR EXTRA TIME' : '') : ''); }
  }

  // ---- PAUSE MENU: resume, team + subs, the moves, options (sound, meter look, team AI), replays, quit
  openPause() {
    this.paused = true; this.say('PAUSED', this.pauseLine(), 9999); this.msg.setVisible(false); this.sub.setVisible(false); SFX.click();   // (the menu says it)
    this.pm = { page: 'main', i: 0 }; this.drawPause();
  }
  closePause() { this.pm = null; this.closeFlowEl(); this.paused = false; this.say('', '', 0.01); this.msg.setVisible(true); this.sub.setVisible(true); }
  pauseItems() {
    const P = this.pm, k = keyset(), H = (this.highlights || []).length, Q = this.squadOf(this.home);
    if (P.page === 'opts') return [
      { k: 'snd', l: `SOUND: ${SFX.muted ? 'OFF' : 'ON'}`, act: () => SFX.toggle() },
      { k: 'meter', l: `SP METER LOOK: ${SP_STYLE.toUpperCase()}`, act: () => setSpStyle(SP_STYLE === 'wild' ? 'basic' : 'wild') },
      { k: 'ai', l: `TEAM AI: ${AI_MODE === 'classic' ? 'CLASSIC (v0.7.6)' : 'NEW'}`, act: () => setAiMode(AI_MODE === 'classic' ? 'new' : 'classic') },
      { k: 'diff', l: `DIFFICULTY: ${(DIFF_OPTS.find(o => o[0] === DIFF_LEVEL) || DIFF_OPTS[1])[1]}${AI_MODE === 'classic' ? ' (NEEDS THE NEW AI)' : ''}`, act: () => setDiff(DIFF_OPTS[(DIFF_OPTS.findIndex(o => o[0] === DIFF_LEVEL) + 1) % DIFF_OPTS.length][0]) },   // v0.9.2
      { k: 'cam', l: `CAMERA: ${(CAM_OPTS.find(o => o[0] === CAM_VIEW) || CAM_OPTS[0])[1]}`, act: () => setCamView(CAM_OPTS[(CAM_OPTS.findIndex(o => o[0] === CAM_VIEW) + 1) % CAM_OPTS.length][0]) },   // camera-pov
      { k: 'bwon', l: `BUG WATCH: ${BW_ON ? 'ON' : 'OFF'}`, act: () => setBwOn(!BW_ON) },
      { k: 'back', l: '◀ BACK', act: () => { P.page = 'main'; P.i = 3; } }];
    const BWn = this.bw ? this.bw.list.length : 0, BWnew = this.bw ? this.bw.list.filter(x => !x.review).length : 0;
    if (P.page === 'moves') return [{ k: 'back', l: '◀ BACK', act: () => { P.page = 'main'; P.i = 2; } }];
    return [
      { k: 'resume', l: 'RESUME', key: 'ENTER', act: () => this.closePause() },
      { k: 'team', l: `TEAM · SUBS (${3 - Q.subs} LEFT)`, act: () => this.openSheet('pause') },
      { k: 'moves', l: 'MOVES', act: () => { P.page = 'moves'; P.i = 0; } },
      { k: 'opts', l: 'OPTIONS', act: () => { P.page = 'opts'; P.i = 0; } },
      ...(this.lastReplay ? [{ k: 'last', l: 'LAST GOAL', key: k.lob, act: () => this.pauseReplay('last') }] : []),
      ...(H ? [{ k: 'hl', l: `HIGHLIGHTS (${H})`, key: k.pass, act: () => this.pauseReplay('hl') }] : []),
      { k: 'bw', l: `BUG WATCH (${BWn}${BWnew ? ` · ${BWnew} TO CHECK` : ''})`, act: () => this.bwOpen('pause') },
      { k: 'quit', l: P.quit ? 'SURE? PRESS AGAIN TO QUIT' : 'QUIT TO MENU', act: () => { if (P.quit) { try { location.reload(); } catch (e) {} } else P.quit = true; } }];
  }
  drawPause() {
    const P = this.pm; if (!P) return; const el = this.flowEl('pause'), items = this.pauseItems(); P.i = clamp(P.i, 0, items.length - 1);
    const k = keyset();
    const moves = P.page !== 'moves' ? '' : `<table class="mv">${[
      [k.move, 'MOVE'], ['SHIFT', 'SPRINT (USES ENERGY)'], [k.pass, 'PASS · CHALLENGE (WITHOUT THE BALL)'], [k.shoot, 'SHOOT, HOLD FOR POWER · SLIDE TACKLE'],
      [k.lob, 'LOB / CROSS · SWITCH PLAYER'], [k.through, 'THROUGH BALL'], [k.special, 'SPECIAL: SPENDS YOUR FULL SP BARS'],
      ['1 BAR', SP_NAMES[0]], ['2 BARS', SP_NAMES[1]], ['3 BARS', SP_NAMES[2]],
      [`${k.ud} + ${k.shoot}`, 'AIM HIGH / LOW'], [`${k.pass} / ${k.shoot}`, 'BALL IN THE AIR: HEADER · VOLLEY · DIVING HEADER'],
      [`SHIFT + ${k.shoot}`, 'HIGH BALL NEAR GOAL: OVERHEAD KICK'], ['T', 'SP METER LOOK'], ['M', 'SOUND ON / OFF'], ['ENTER', 'PAUSE']].map(([a, b]) => `<tr><th>${a}</th><td>${b}</td></tr>`).join('')}</table>`;
    el.innerHTML = `<h2>${P.page === 'opts' ? 'OPTIONS' : P.page === 'moves' ? 'THE MOVES' : 'PAUSED'}</h2>
      <div class="sc">${this.home.name} ${this.home.score} - ${this.away.score} ${this.away.name} · ${this.halfLabel()} ${String(Math.floor(this.clock / 60)).padStart(2, '0')}'</div>${moves}
      <div class="menu">${items.map((it, j) => `<button type="button" data-j="${j}" class="${j === P.i ? 'on' : ''}">${it.l}${it.key ? `<kbd>${it.key}</kbd>` : ''}</button>`).join('')}</div>
      <small>&#8593;&#8595; PICK · ENTER: OK · ESC: ${P.page === 'main' ? 'RESUME' : 'BACK'}</small>`;
    el.querySelectorAll('.menu button').forEach(b => b.onclick = () => { P.i = +b.dataset.j; this.pauseAct(); });
  }
  pauseAct() { const P = this.pm, it = this.pauseItems()[P.i]; if (!it) return; if (it.k !== 'quit') P.quit = false; SFX.click(); it.act(); if (this.pm && !this.sheet && !this.replay && !this.bwUI) this.drawPause(); }
  pauseReplay(which) {
    const back = () => { if (this.paused) { this.say('PAUSED', this.pauseLine(), 9999); this.msg.setVisible(false); this.sub.setVisible(false); this.pm = this.pm || { page: 'main', i: 0 }; this.drawPause(); } };
    this.closeFlowEl(); this.msg.setText(''); this.sub.setText(''); this.msg.setVisible(true); this.sub.setVisible(true);
    if (which === 'last') this.startReplay('LAST GOAL', back, this.lastReplay, { caption: 'LAST GOAL' }); else this.playHighlights(back);
  }
  pauseInput() {
    const P = this.pm; if (!P) { this.pm = { page: 'main', i: 0 }; return this.drawPause(); }
    if (this.sheet) { if (Input.pressed('start') || Input.pressed('pass')) this.closeSheet(); return; }   // team sheet open (subs)
    const esc = Input.taps.has('Escape') || Input.taps.has('KeyP');
    if (esc) { if (P.page === 'main') this.closePause(); else { P.page = 'main'; P.i = 0; this.drawPause(); } return; }
    if (P.page === 'main' && Input.pressed('lob') && this.lastReplay) return this.pauseReplay('last');
    if (P.page === 'main' && Input.pressed('pass') && this.highlights && this.highlights.length) return this.pauseReplay('hl');
    const n = Input.nav(), items = this.pauseItems();
    if (n.y) { P.i = (P.i + n.y + items.length) % items.length; P.quit = false; SFX.click(); this.drawPause(); }
    if (P.page === 'opts' && n.x && items[P.i] && items[P.i].k !== 'back') this.pauseAct();
    if (Input.pressed('start')) this.pauseAct();
  }

  // ---------- v0.8.7 BUG WATCH review screen (pause menu · B at full time): the clips the watchdog kept, one by one
  async bwDb() {
    if (this._bwDb !== undefined) return this._bwDb;
    this._bwDb = null;
    try { if (window.claude && window.claude.use) this._bwDb = await window.claude.use('db'); } catch (e) { this._bwDb = null; }
    return this._bwDb;
  }
  bwBadge(inc) {                                           // a small note under the clock, never in the way
    if (!window.HC2_STARTED || this.demo || window.__lab || !this.hud || inc.sev !== 'bug') return;   // (the odd ones wait quietly in the list)
    if (!this.bwTxt || !this.bwTxt.scene) {
      this.bwTxt = this.add.text(16, 88, '', { fontFamily: '"Press Start 2P"', fontSize: '8px', color: '#f4f0e4', backgroundColor: '#ff2878', padding: { x: 6, y: 4 } }).setScrollFactor(0);
      this.hud.add(this.bwTxt);
    }
    const n = this.bw.list.filter(x => x.isNew).length;
    this.bwTxt.setText(`BUG WATCH · ${inc.title} · ${n} TO CHECK`).setVisible(true);
    if (this.bwHide) this.bwHide.remove(false);
    this.bwHide = this.time.delayedCall(4000, () => { if (this.bwTxt && this.bwTxt.scene) this.bwTxt.setVisible(false); });
  }
  bwOpen(from) {
    this.bwUI = { page: 'list', i: 0, from, sel: null };
    this.msg.setVisible(false); this.sub.setVisible(false);
    if (this.bwTxt && this.bwTxt.scene) this.bwTxt.setVisible(false);
    SFX.click(); this.bwDraw();
  }
  bwClose() {
    const U = this.bwUI; this.bwUI = null; this.closeFlowEl();
    if (U && U.from === 'pause' && this.paused && this.pm) { this.drawPause(); return; }
    this.msg.setVisible(true); this.sub.setVisible(true);
  }
  bwList() { const L = this.bw ? this.bw.list : []; return [...L.filter(x => !x.old), ...L.filter(x => x.old)].slice(0, 40); }
  bwItems() {
    const U = this.bwUI, L = this.bwList();
    if (U.page === 'one') {
      const x = U.sel;
      return [{ k: 'watch', l: 'WATCH THE CLIP', key: 'ENTER', act: () => this.bwPlay(x) },
        { k: 'bug', l: 'THAT\'S A BUG', key: '1', act: () => this.bwMark(x, 'bug') },
        { k: 'fine', l: 'LOOKS FINE', key: '2', act: () => this.bwMark(x, 'fine') },
        { k: 'unsure', l: 'NOT SURE', key: '3', act: () => this.bwMark(x, 'unsure') },
        { k: 'back', l: '◀ BACK', key: 'ESC', act: () => { U.page = 'list'; U.i = Math.max(0, L.indexOf(x)); } }];
    }
    return [...L.map((x, j) => ({ k: 'i' + j, x, l: `${x.old ? 'EARLIER · ' : ''}${x.min}' ${x.title}`, tag: x.review ? BW_VERDICT[x.review.verdict] : x.isNew ? 'NEW' : '',
      act: () => { U.page = 'one'; U.sel = x; U.i = 0; x.isNew = false; } })),
      { k: 'close', l: '◀ BACK', key: 'ESC', act: () => this.bwClose() }];
  }
  bwDraw() {
    const U = this.bwUI; if (!U) return;
    const el = this.flowEl('bw'), items = this.bwItems(); U.i = clamp(U.i, 0, items.length - 1);
    if (!document.getElementById('bwcss')) {
      const st = document.createElement('style'); st.id = 'bwcss';
      st.textContent = `#flow .bw{width:min(640px,100%);display:grid;gap:8px;text-align:left}
        #flow .bw .card{background:#1d1a22;border:3px solid #0c0a0e;box-shadow:4px 4px 0 #0c0a0e;padding:10px 12px;display:grid;gap:6px}
        #flow .bw .card p{margin:0;font-size:9px;line-height:1.9} #flow .bw .card .n{color:#28c8e6;word-break:break-word}
        #flow .bw .sev{display:inline-block;padding:2px 6px;margin-right:6px;font-size:8px;color:#0c0a0e;background:#ffde1e} #flow .bw .sev.bug{background:#ff2878;color:#fff} #flow .bw .sev.perf{background:#28c8e6}
        #flow .bw input{font:9px "Press Start 2P",monospace;padding:8px;border:3px solid #0c0a0e;background:#f4f0e4;color:#0c0a0e;width:100%;box-sizing:border-box}
        #flow .bw .menu{width:100%} #flow .bw .menu button em{font-style:normal;font-size:8px;padding:2px 5px;background:#0c0a0e;color:#ffde1e}
        #flow .bw .menu button em.BUG{color:#ff2878} #flow .bw .menu button em.FINE{color:#4cff7a} #flow .bw .menu button em.NEW{color:#28c8e6}
        #flow .bw .menu{max-height:min(52vh,420px);overflow-y:auto;padding:2px 6px 6px 2px}`;
      document.head.appendChild(st);
    }
    const L = this.bwList(), todo = L.filter(x => !x.review).length;
    if (U.page === 'one') {
      const x = U.sel, rv = x.review, saved = x.saved === 'db' ? 'SAVED · CLAUDE CAN READ IT' : x.saved === 'local' ? 'KEPT IN THIS BROWSER' : x.ready ? 'SAVING…' : 'STILL RECORDING…';
      el.innerHTML = `<h2>BUG WATCH</h2><div class="bw"><div class="card">
        <p><span class="sev ${x.sev}">${x.sev === 'bug' ? 'LOOKS LIKE A BUG' : x.sev === 'perf' ? 'SPEED' : 'LOOKS ODD'}</span>${x.title}</p>
        <p>${x.min}' · ${['1ST HALF', '2ND HALF', 'EXTRA TIME 1', 'EXTRA TIME 2'][(x.half || 1) - 1]} · ${x.home} ${x.score} ${x.away}${x.mode === 'demo' ? ' · THE DEMO' : ''}</p>
        <p>WHAT TRIPPED: ${x.why}</p><p class="n">${String(x.msg).replace(/[<>&]/g, '')}</p>
        <p>${rv ? `YOU SAID: ${BW_VERDICT[rv.verdict]}${rv.note ? ' · ' + rv.note.replace(/[<>&]/g, '') : ''} · ` : ''}${saved}</p>
        <input id="bwnote" maxlength="200" placeholder="NOTE (OPTIONAL) - WHAT LOOKS WRONG?" value="${rv && rv.note ? rv.note.replace(/["<>&]/g, '') : ''}">
      </div><div class="menu">${items.map((it, j) => `<button type="button" data-j="${j}" class="${j === U.i ? 'on' : ''}">${it.l}<kbd>${it.key || ''}</kbd></button>`).join('')}</div></div>
      <small>WATCH IT, THEN MARK IT · &#8593;&#8595; PICK · ENTER: OK · ESC: BACK</small>`;
      const inp = el.querySelector('#bwnote'); if (inp) inp.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter' || e.key === 'Escape') inp.blur(); });
    } else {
      el.innerHTML = `<h2>BUG WATCH</h2><div class="bw"><div class="card"><p>THE GAME WATCHES ITS OWN FOOTAGE WHILE IT PLAYS. WHEN SOMETHING BREAKS A RULE (STUCK BALL, A GOAL NOT GIVEN, A PLAYER JUMPING...) IT KEEPS THE CLIP.</p>
        <p class="n">${L.length ? `${L.length} CLIP${L.length > 1 ? 'S' : ''} · ${todo} TO CHECK` : 'NOTHING CAUGHT YET - GOOD SIGN.'}${BW_ON ? '' : ' · BUG WATCH IS OFF (OPTIONS)'}</p></div>
        <div class="menu">${items.map((it, j) => `<button type="button" data-j="${j}" class="${j === U.i ? 'on' : ''}">${it.l}${it.tag ? `<em class="${it.tag.replace(' ', '')}">${it.tag}</em>` : it.key ? `<kbd>${it.key}</kbd>` : ''}</button>`).join('')}</div></div>
        <small>&#8593;&#8595; PICK · ENTER: OPEN · ESC: BACK</small>`;
    }
    el.querySelectorAll('.menu button').forEach(b => b.onclick = () => { U.i = +b.dataset.j; this.bwAct(); });
    const on = el.querySelector('.menu button.on'); if (on && on.scrollIntoView) on.scrollIntoView({ block: 'nearest' });
  }
  bwAct() { const U = this.bwUI, it = this.bwItems()[U.i]; if (!it) return; SFX.click(); it.act(); if (this.bwUI && !this.replay) this.bwDraw(); }
  bwInput() {
    const U = this.bwUI, t = Input.taps;
    if (t.has('Escape') || t.has('KeyP')) { if (U.page === 'one') { const L = this.bwList(); U.page = 'list'; U.i = Math.max(0, L.indexOf(U.sel)); this.bwDraw(); } else this.bwClose(); return; }
    if (U.page === 'one') { const v = t.has('Digit1') ? 'bug' : t.has('Digit2') ? 'fine' : t.has('Digit3') ? 'unsure' : null; if (v) return this.bwMark(U.sel, v); }
    const n = Input.nav(), items = this.bwItems();
    if (n.y) { U.i = (U.i + n.y + items.length) % items.length; SFX.click(); this.bwDraw(); }
    if (Input.pressed('start')) this.bwAct();
  }
  bwMark(x, v) {
    const inp = document.getElementById('bwnote'), note = inp ? inp.value.trim() : '';
    this.bw.review(x, v, note); SFX.click();
    const U = this.bwUI, L = this.bwList(), next = L.findIndex(y => !y.review);
    U.page = 'list'; U.i = next >= 0 ? next : L.length; this.bwDraw();
  }
  bwPlay(x) {
    const F = this.bw.framesOf(x), U = this.bwUI;
    if (!F || F.frames.length < 30) { x.msg += ' (no footage kept for this one)'; this.bwDraw(); return; }
    const back = () => { if (!this.bwUI) return; this.msg.setVisible(false); this.sub.setVisible(false); this.bwDraw(); };
    this.bwLoadKits(x.kits, () => {
      this.closeFlowEl(); this.msg.setText(''); this.sub.setText(''); this.msg.setVisible(true); this.sub.setVisible(true);
      const frames = F.frames.map(f => Object.assign({}, f)), mk = clamp(F.mark, 0, frames.length - 1); frames[mk].goal = true;
      this.startReplay('BUG CLIP', back, frames, { caption: `BUG WATCH · ${x.min}' ${x.title}`, exit: back, kits: x.kits, focus: x.who, noZoom: true, mark: mk, slowPre: 1.2, slow: 1.8 });
      if (!this.replay) back();
    });
    void U;
  }
  bwLoadKits(kits, done) {                                 // a clip from another match: load those kits first
    const need = [...new Set(kits || [])].filter(k => k && MAN.kits[k] && !this.textures.exists(k));
    if (!need.length) return done();
    for (const k of need) this.load.atlas(k, SRC(`sprites/${k}.webp`, k), `assets/sprites/${k}.json`);
    this.load.once('complete', done); this.load.start();
  }

  // ---------- update
  update(time, deltaMs) {
    const dt = Math.min(deltaMs / 1000, 1 / 30);
    if (this.replay) { Input.poll(); this.stadium.update(dt); this.replayTick(dt); this.ramiTick(dt); for (const mt of this.meters || []) mt.draw(dt); return; }
    if (this.cupScreen) { Input.poll(); if (Input.pressed('start') || Input.pressed('pass')) this.cupPlay(); this.stadium.update(dt); return; }   // v0.7.2 cup table up
    if (this.ceremony) { Input.poll(); this.stadium.update(dt); this.render(dt); this.ceremonyTick(dt); this.ramiTick(dt);                 // v0.7.4 trophy ceremony on the pitch
      if ((Input.pressed('start') || Input.pressed('pass')) && this.ceremony.t > 1.2) this.endCeremony(); return; }
    if (this.so && this.so.done) { Input.poll(); if (Input.pressed('start')) { if (this.cup && this.cupLive) this.cupResult();
      else if (this.matchPens) { this.matchPens = false; this.so = null; this.scene.stop('penalty'); this.penaltyMode = false; this.over = false; this.setTeams(this.home.name, this.away.name, () => this.preMatch()); }   // v0.8.5: after a match: AGAIN
      else this.startShootout(this.so.cpu); } this.stadium.update(dt); this.ramiTick(dt); return; }   // shoot-out over
    if (this.penaltyMode) { this.stadium.update(dt); return; }               // the penalty scene has the screen (and the keys)
    Input.poll();
    if (this.bwUI) { this.bwInput(); if (this.replay || !this.bwUI) return; this.stadium.update(dt); this.render(dt); this.ramiTick(dt); return; }   // v0.8.7 BUG WATCH review
    if (this.bw) this.bw.frame(deltaMs);
    if (this.pre) { if (this.setup) this.setupInput(); else if (this.sheet && (Input.pressed('start') || Input.pressed('pass'))) this.closeSheet(); this.stadium.update(dt); this.render(dt); this.ramiTick(dt); return; }   // v0.8.4 team sheet (v0.8.5: settings first)
    if (this.cutInQ && !this.cutIn && !(this.hitStop > 0) && !this.paused && !this.replay) { this.cutIn = this.cutInBuild(this.cutInQ); this.cutInQ = null; }
    if (this.cutIn) { this.anims.globalTimeScale = 0.0001; this.stadium.update(dt); this.cutInTick(dt); this.render(dt); this.ramiTick(dt); return; }   // v0.8.9 special-save cut scene: play waits
    const flowBusy = !!(this.ht || this.intro || this.toss);                    // (the key that ends half time must not pause the game too)
    if (this.ht) this.htInput();
    if (this.paused && !this.over) { this.pauseInput(); if (this.replay) return; }   // v0.8.5 PAUSE MENU
    else if (Input.pressed('start') && !flowBusy) {
      if (this.over && this.cup && this.cupLive) { if (!this.cupPens) this.cupResult(); return; }        // v0.7.2: back to the cup table (a level final waits for its penalties)
      if (this.over) { if (!this.matchPens) this.setTeams(this.home.name, this.away.name, () => this.preMatch()); return; }   // v0.8.2: AGAIN = same teams, fresh match - v0.8.4: team sheet + walk-out
      if (window.HC2_STARTED && !this.demo) this.openPause();
    }
    if (this.over && !this.paused && this.bw && this.bw.list.length && Input.taps.has('KeyB') && !(this.so && !this.so.done)) { this.bwOpen('ft'); return; }   // v0.8.7: B at full time = BUG WATCH
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
      if (Input.pressed('special')) { const gk = A.team.players[0]; gk.spSave = this.meterOf(A.team).spend(); this.saveFx(gk); this.saveAsk = null; }
      else if (A.t <= 0 || (A.normal ? !this.ball.saveable || this.ball.owner || this.ball.inNet : !this.ball.special)) this.saveAsk = null;   // (v0.9.0: a normal shot too)
    }
    if (!this.paused && !this.over) { const sl = this.slowMo > 0; if (sl) this.slowMo -= dt; this.sim(sl ? dt * 0.4 : dt); if (this.bw) this.bw.tick(dt); }   // v0.8.7 BUG WATCH checks every frame (v0.9.2: chip slow motion)
    if (this.demo && this.over && (this.demoOver = (this.demoOver || 0) + dt) > 7) {   // the demo just starts again
      this.demoOver = 0; this.over = false; this.home.score = this.away.score = 0; this.clock = 0; this.half = 1; this.highlights = []; this.resetHalfTime(); this.mstats = {};
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
    { const ts = this.slowMo > 0 ? 0.4 : 1; if (this.anims.globalTimeScale !== ts) this.anims.globalTimeScale = ts; }   // (v0.9.2: slow motion as a chip goes over the keeper)
    if (b.chip && !b.chipSlow && !window.__diffTeams && !window.HC2_TEST_FAST) { const k = (b.last && b.last.opp || this.away).players[0];
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
    if (!this.demo) this.controlHuman(dt);
    this.ai(dt);
    for (const p of this.all) p.step(dt);
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
    if (this.dead) { this.dead.t -= dt; if (this.dead.t <= 0) { const d = this.dead; this.dead = null; this.restart(d.kind, d.team, d.x, d.y); } }
    if (b.owner || b.z < 0.2) for (const t of [this.home, this.away]) t.players[0].claiming = false;
    this.rules();
  }
  // where the loose ball will be over the next 3 seconds (for receivers and chasers)
  predict() {
    const b = this.ball, c = { x: b.x, y: b.y, z: b.z, vx: b.vx, vy: b.vy, vz: b.vz, skid: b.skid, rollV: b.rollV, special: b.special, spF: b.spF, chip: b.chip }, out = [], h = 1 / 60;
    for (let i = 1; i <= 180; i++) { ballStep(c, h, false); if (i % 3 === 0) out.push({ t: i * h, x: c.x, y: c.y, z: c.z }); }
    return out;
  }
  // the first point on the ball's path this player can reach in time
  intercept(p, speed, react = 0.12) {
    const P = this.path, b = this.ball; if (!P) return { x: b.x, y: b.y };
    for (const pt of P) { if (pt.z > 1.0) continue; if (react + len(pt.x - p.x, pt.y - p.y) / speed <= pt.t) return pt; }
    return P[P.length - 1];
  }
  placeAtFeet() {
    const b = this.ball, p = b.owner; if (!p) return;
    const sp = this.setPiece;
    if (sp && sp.kind === 'THROW-IN' && sp.taker === p && (!sp.kicked || (this.pending && this.pending.p === p))) {
      // held over his head until it leaves his hands; the ball sits on the line, he stands 0.4 m behind it, so the
      // height makes up the difference on screen (measured on PixelLab's throw-in frames: hands ~130 px above the feet)
      const top = p.y < 34; b.x = p.x; b.y = top ? 0.1 : PITCH_W - 0.1; b.z = top ? 2.2 : 1.8; b.vx = b.vy = b.vz = 0; return;
    }
    if (p.hands) { b.x = p.x + dirVec(p.face).x * 0.25; b.y = p.y; b.z = 1.1; b.vx = b.vy = b.vz = 0; return; }
    if (len(b.x - p.x, b.y - p.y) > 0.8) { const dv = dirVec(p.face); b.x = p.x + dv.x * 0.5; b.y = p.y + dv.y * 0.45; }
    b.vx = b.vy = b.vz = 0; b.z = 0;
  }

  separate() {
    const A = this.all, R = 0.95;
    for (let i = 0; i < A.length; i++) for (let j = i + 1; j < A.length; j++) {
      const p = A[i], q = A[j], dx = q.x - p.x, dy = (q.y - p.y) * 1.3, d = Math.hypot(dx, dy);
      if (d > 0.001 && d < R) {
        const ph = p.keeper && p.hands, qh = q.keeper && q.hands;                 // a keeper holding the ball doesn't get shoved
        const push = (R - d) / 2, ux = dx / d, uy = dy / d, kp = ph ? 0 : qh ? 2 : 1, kq = qh ? 0 : ph ? 2 : 1;
        p.x -= ux * push * kp; p.y -= uy * push / 1.3 * kp; q.x += ux * push * kq; q.y += uy * push / 1.3 * kq;
      }
    }
    for (const k of [this.home.players[0], this.away.players[0]]) {              // ...and never carries it over his own line
      if (k.hands && this.ball.owner !== k) k.hands = false;
      if (k.hands) { const gl = k.team.ownGoalX, inX = gl + k.team.side * 0.6; if ((k.x - inX) * k.team.side < 0) k.x = inX;
        for (const o of k.team.opp.players) { const d = len(o.x - k.x, o.y - k.y); if (d > 0.01 && d < 3.5) { o.x += (o.x - k.x) / d * 0.04; o.y += (o.y - k.y) / d * 0.04; } }   // give him room
      }
    }
  }
  controlHuman(dt) {
    const b = this.ball, me = this.human, team = this.home;
    const prevAir = this.airSp; this.airSp = null;                               // v0.8.6 (set again below while the moment lasts)
    if (b.owner && b.owner.team === team && b.owner !== me) this.human = b.owner;
    if (!b.owner && this.nextHuman && b.last === team) { /* ball travelling to a team-mate: switch once it is closer to him */
      const q = this.nextHuman; if (len(q.x - b.x, q.y - b.y) < len(this.human.x - b.x, this.human.y - b.y)) { this.human = q; this.nextHuman = null; }
    }
    if (!(b.owner && b.owner.team === team) && (Input.pressed('lob') || (b.owner && b.owner.team !== team && this.human.keeper))) this.switchHuman();
    const p = this.human;
    if (p.state === 'kick' || p.state === 'slide' || p.state === 'dheader' || p.stun > 0) return;
    const ax = Input.axis, moving = len(ax.x, ax.y) > 0.1, owns = b.owner === p;
    const sprint = Input.held('sprint') && moving;
    if (sprint && !p.sprinting && p.stamina > 0.3 && (p.burstCd || 0) <= this.time.now) { p.burst = 0.55; p.burstCd = this.time.now + 1500; }   // v0.8 burst (not spammable)
    p.sprinting = sprint;
    let spd = p.top(sprint, owns);
    if (owns && this.charge >= 0) spd *= 0.75;                                   // winding up a shot slows you down
    // pass coming to me: he runs onto it by himself while the stick is idle OR still held the way you passed it
    // (v0.6 sent him off in the pass direction - away from the ball). Point somewhere new and you take over.
    const ps = this.passStick, sameStick = ps && len(ps.x, ps.y) > 0.1 && moving && (ax.x * ps.x + ax.y * ps.y) / (len(ax.x, ax.y) * len(ps.x, ps.y)) > 0.7;
    if (moving && !sameStick) this.passStick = null;
    if (!b.owner && b.target === p && b.last === team && (!moving || sameStick)) {
      const v = p.top(sprint, false), pt = this.intercept(p, v); p.moveTo(pt.x, pt.y, v, dt);
    } else if (owns && moving) this.carrySteer(p, ax.x, ax.y, spd, dt, sprint ? (p.burst > 0 ? ACC * 1.35 : ACC * 0.85) : ACC);
    else p.steer(ax.x * spd, ax.y * spd, dt, sprint ? (p.burst > 0 ? ACC * 1.35 : ACC * 0.85) : ACC);
    const dir = moving ? ax : dirVec(p.face);
    if (owns && moving) { const l = len(ax.x, ax.y); p.wantDir = { x: ax.x / l, y: ax.y / l }; }
    if (owns && p.keeper && p.hands) {                                           // you hold it: after 5 s he lets it go himself
      p.hold = (p.hold || 0) + dt;
      // v0.8.3: in his hands he stays inside his box (he walked 70 m upfield and off the pitch, untouchable) and 6 s is the
      // limit even if you keep walking (it only counted while the stick was idle)
      const bx = team.ownGoalX + team.side * 16.2;
      if ((p.x - bx) * team.side > 0) { p.x = bx; if (p.vx * team.side > 0) p.vx = 0; }
      if (Math.abs(p.y - 34) > 19.8) { p.y = 34 + Math.sign(p.y - 34) * 19.8; if (p.vy * (p.y - 34) > 0) p.vy = 0; }
      if ((p.hold > 5 && !moving) || p.hold > 6) { p.hold = 0; const o = this.keeperOutlet(p); this.doPass(p, o.dir, o.mode); return; }
    }
    this.passAim = owns && !(p.keeper && p.hands) ? this.passTarget(p, dir, 'ground', this.passAim) : null;   // v0.7.4: who a pass would go to right now (shown on the grass)
    if (owns && Input.pressed('special') && !p.keeper) { if (this.special(p)) return; this.say('', 'SP METER EMPTY', 0.6); }
    if (owns) {
      if (Input.pressed('pass')) this.doPass(p, dir, 'ground');
      else if (Input.pressed('through')) this.doPass(p, dir, 'through');
      else if (Input.pressed('lob')) this.lobCharge = 0;                          // v0.8.5: a tap = the lob to a team-mate, hold = power
      if (this.lobCharge >= 0) {
        if (Input.held('lob')) this.lobCharge = Math.min(1, this.lobCharge + dt / 0.9);
        else { const c = this.lobCharge; this.lobCharge = -1; if (this.chipCan(p, dir)) this.chipShot(p, c, ax.y); else if (c < 0.2) this.doPass(p, dir, 'lob'); else this.powerLob(p, dir, c); }   // v0.9.2: in their box facing goal = CHIP
      }
      if (Input.held('shoot')) { this.charge = this.charge < 0 ? 0 : Math.min(1, this.charge + dt / 0.8); this.aimY = ax.y; }
      if (Input.released('shoot') && this.charge >= 0) { this.doShot(p, this.charge, this.aimY); this.charge = -1; }
    } else {
      this.charge = -1; this.lobCharge = -1;
      // v0.8.6 AERIAL SPECIAL: a ball dropping to you at volley / head height in their half, near enough to goal, SP in the bank
      const mtA = this.meterOf(team), dA = len(b.x - p.x, b.y - p.y), toG = len(team.goalX - p.x, 34 - p.y);
      const coming = (b.x - p.x) * b.vx + (b.y - p.y) * b.vy < 0 || dA < 1.2;     // dropping towards him
      this.airSp = !b.owner && !b.inNet && b.last === team && b.z > 0.55 && b.z < 2.6 && b.vz < 2 && dA < 3.6 && coming && toG < 30 && !p.busy() && mtA.level() >= 1 ? (prevAir || { t: 0 }) : null;
      if (this.airSp) { this.airSp.t += dt; if (Input.pressed('special')) { this.airSpecial(p); return; } }
      // v0.8.1 defending: CHALLENGE = pass button, SLIDE = shoot button (in the direction you push)
      if (Input.pressed('pass') && b.owner && b.owner.team !== team) this.challenge(p, b.owner);
      else if (Input.pressed('shoot') && b.owner && b.owner.team !== team) this.slideTackle(p, moving ? ax : null);
      else if (Input.pressed('shoot') && !b.owner && b.z < 0.3 && len(b.x - p.x, b.y - p.y) >= 2.0 && len(b.x - p.x, b.y - p.y) < 4.5 &&
        b.last !== team && !p.busy()) this.slideTackle(p, null);                 // a loose ball just out of reach: slide in for it
      else if (Input.pressed('shoot') && !b.owner && len(b.x - p.x, b.y - p.y) < 2.0 && b.z < 1) {   // first-time shot / volley
        const volley = b.z > 0.35; b.owner = p; this.doShot(p, 0.6, ax.y); if (volley) p.kickAnim = 'volley';
      }
      else if (Input.pressed('shoot') && this.canBicycle(p, true)) this.bicycle(p);   // ball over head height in front of goal: overhead kick
      else if (Input.pressed('shoot') && !b.owner && b.z >= 0.4 && b.z < 1.3 && len(b.x - p.x, b.y - p.y) < 3.4 && !p.busy()) {
        this.divingHeader(p);                                                  // too far to volley, too low to head: throw yourself at it
      }
      else if ((Input.pressed('shoot') || Input.pressed('pass')) && !b.owner) {  // ball in the air: get ready to head it
        this.headBuf = 0.35; this.headKind = Input.pressed('shoot') ? 'shoot' : 'pass';
      }
    }
  }
  // HEADERS: a ball at head height next to a player. You head it if you pressed X (at goal) or Z (to a team-mate)
  // BICYCLE KICK (batch 10): a high ball (head height or above) close to him near their goal -> over the head at goal
  canBicycle(p, human) {                                                          // back to goal (or SHIFT held): over the head instead of a header
    const b = this.ball; if (!MAN.kits[p.kit].anims['bicycle-E'] || p.keeper || p.busy() || b.owner || b.inNet) return false;
    const d = len(p.x - b.x, p.y - b.y), gx = p.team.goalX - p.x, gy = 34 - p.y, toGoal = len(gx, gy), f = dirVec(p.face);
    const backToGoal = (f.x * gx + f.y * gy) / (toGoal || 1) < -0.2;
    return b.z > 1.35 && b.z < 2.4 && d < 1.5 && toGoal < 19 && (backToGoal || (human && Input.held('sprint')));
  }
  bicycle(p) {
    const b = this.ball; b.owner = p; this.doShot(p, rnd(0.6, 0.85), rnd(-0.8, 0.8));
    if (this.pending && this.pending.p === p) this.pending.vz = rnd(-1.4, 0.4);   // struck from head height: it dips, not balloons
    p.kickAnim = 'bicycle'; p.stateT = 0.7; p.bike = true; this.lastBike = { p, n: this.recN || 0, t: this.time.now };                      // he lies there after (get-up follows)
    this.ramiSay('skill', { text: 'AN OVERHEAD KICK!!\nOH THAT IS FILTHY!', expr: 'laugh' }, 2);
    this.flagReplay('OVERHEAD KICK!');                                           // worth another look at the next stoppage
  }
  // v0.8.6 the aerial special itself: LV by the bars spent; LV1 a volley, LV2 an overhead kick (or volley if it's low), LV3 the leap
  airSpecial(p) {
    const b = this.ball, mt = this.meterOf(p.team), lv = mt.spend(); if (!lv) return; this.airSp = null;
    const aim = Math.abs(Input.axis.y) > 0.2 ? Input.axis.y : (Math.random() < 0.5 ? -1 : 1) * rnd(0.55, 1), KA = MAN.kits[p.kit].anims;
    { const dv = dirVec(p.face); b.x = p.x + dv.x * 0.45; b.y = p.y + dv.y * 0.35; b.vx = b.vy = b.vz = 0; }   // he meets it (the leap / volley closes the gap) - v0.8.7: and it stops there for the strike (it flew on and the kick missed: the Lab's PW10 caught it)
    b.owner = p; this.doShot(p, 0.85, aim);
    const k = this.pending; if (!k || k.p !== p) return;
    // v0.8.9 ROUGH RIG per level (RIGS air1-3): he takes off, the ball hangs where his boot will meet it, then the strike
    const n = 'air' + lv, R = RIGS[n], toE = p.team.side > 0, d = (R && R.back ? !toE : toE) ? 'E' : 'W';
    const P = R && this.rigAt(p, n, R.keys.find(q => q.hit).t, d);
    if (P) {
      const hk = R.keys.find(q => q.hit), f = this.rigPt(P, hk.foot, d);
      p.face = d === 'E' ? 0 : 4; p.kickAnim = 'rig'; p.rig = { n, t: 0, d }; p.stateT = R.dur; if (R.bike) p.bike = true;
      k.info.air = { x: clamp(p.x + (f.x - wx(p.x, p.y)) / (PX_X * scaleAt(p.y)), 0.5, PITCH_L - 0.5), y: p.y, z: clamp((wy(p.y) - 12 - f.y) / PX_H, 0.3, 3.2) };
      Object.assign(b, { x: k.info.air.x, y: k.info.air.y, z: k.info.air.z });
      k.t = hk.t;                                                                 // the strike lands on the rig's contact key
    } else {                                                                      // (no rig for this kit: the old moves)
      const anim = lv === 3 && KA['super-E'] ? 'super' : lv >= 2 && b.z > 1.2 && KA['bicycle-E'] ? 'bicycle' : 'volley';
      p.kickAnim = anim; if (anim === 'super' || anim === 'bicycle') { p.face = p.team.side > 0 ? 0 : 4; } if (anim === 'bicycle') { p.stateT = 0.7; p.bike = true; }
      k.t = Math.min(k.t, 0.18);                                                   // in the air: struck at once
    }
    const f = spRange(lv, p);
    k.ty = clamp(34 + aim * 2.9 + rnd(-0.25, 0.25), GOAL_Y0 + 0.5, GOAL_Y1 - 0.5); k.tx = p.team.goalX + p.team.side * 2;
    k.speed = [31, 35, 39][lv - 1] * (0.7 + 0.3 * f); k.vz = [0.6, -0.6, 1.2][lv - 1]; k.info.special = lv; k.info.power = 1; k.info.spP = SP_POWER[lv - 1] * f; k.info.spF = f;
    this.say(['AIR ' + SP_NAMES[0], 'SKY ' + SP_NAMES[1], SP_NAMES[2] + ' FROM THE SKY'][lv - 1] + '!', `${p.team.name} · LV${lv} AERIAL SPECIAL`, 1.3);
    this.ramiSay('skill', { text: ['ON THE VOLLEY -\nAND IT IS ON FIRE!', 'AN OVERHEAD SPECIAL!!\nUNBELIEVABLE!', 'HE FLIES!!\nTHE RISING PHOENIX!'][lv - 1], expr: 'laugh' }, 3);
    SFX.special(lv); this.flagReplay('AERIAL SPECIAL!'); this.hitStop = 0.08; this.cameras.main.flash(90, 255, 230, 120);
  }
  // ---------- v0.8.9 ROUGH RIGS: where a rig puts him at time t (frame, place, turn, squash) - shared by the drawing and
  // by the aerial special (to hang the ball where his boot will be)
  rigAt(p, n, t, d) {
    const R = RIGS[n], K = MAN.kits[p.kit]; if (!R || !K) return null;
    const keys = R.keys; let i = 0; while (i < keys.length - 1 && keys[i + 1].t <= t) i++;
    const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)], u = b === a ? 0 : clamp((t - a.t) / (b.t - a.t), 0, 1);
    const L = (q, d0) => (a[q] ?? d0) + ((b[q] ?? d0) - (a[q] ?? d0)) * u;
    const list = K.anims[`${a.a}-${d}`]; if (!list || !list.length) return null;
    const cy = R.cy ?? 0.56, FH = K.frameH || 160, sy = L('sy', 1), lift = L('lift', 0);
    return { fr: list[Math.min(a.f, list.length - 1)], x: wx(p.x, p.y), y: wy(p.y) - (K.feetY - cy * FH) * sy - lift, rot: L('rot', 0) * (d === 'W' ? -1 : 1) * Math.PI / 180,
      sx: L('sx', 1), sy, cy, FH };
  }
  rigPt(P, pt, d) {                                                               // a point of the frame (E frame, px) on the screen
    const lx = (d === 'W' ? 128 - pt[0] : pt[0]) - 64, ly = pt[1] - P.FH * P.cy, c = Math.cos(P.rot), s = Math.sin(P.rot);
    return { x: P.x + lx * P.sx * c - ly * P.sy * s, y: P.y + lx * P.sx * s + ly * P.sy * c };
  }
  rigPop(name, x, y, depth, o = {}) {                                             // one PixelLab effect: grows, rises, fades
    if (!this.textures.exists('fx') || !this.textures.get('fx').has(name)) return null;
    const s0 = o.s ? o.s[0] : 1, s1 = o.s ? o.s[1] : s0, kx = o.kx || 1, ky = o.ky || 1;
    const im = this.add.image(x, y, 'fx', name).setScale(s0 * kx, s0 * ky).setAlpha(o.a ?? 1).setDepth(depth).setRotation(o.rot || 0).setFlipX(!!o.flip);
    if (o.tint) im.setTint(o.tint);
    this.tweens.add({ targets: im, scaleX: s1 * kx, scaleY: s1 * ky, alpha: 0, y: y + (o.dy || 0), duration: o.ms || 300, delay: o.delay || 0, ease: 'Cubic.easeOut', onComplete: () => im.destroy() });
    return im;
  }
  rigFx(p, P) {                                                                   // the rig's effects + after-images, as its clock passes them
    const g = p.rig, R = RIGS[g.n], ev = R.ev || []; g.ei = g.ei || 0;
    while (g.ei < ev.length && ev[g.ei].t <= g.t) { this.rigEvent(p, R, ev[g.ei], P); g.ei++; }
    if (R.ghost && g.t >= R.ghost[0] && g.t <= R.ghost[1] && this.time.now - (g.gAt || 0) > 40) {
      g.gAt = this.time.now; const s = p.spr;
      const im = this.add.image(s.x, s.y, s.texture.key, s.frame.name).setOrigin(s.originX, s.originY).setRotation(s.rotation).setScale(s.scaleX, s.scaleY).setDepth(s.depth - 0.3).setTintFill(R.col).setAlpha(0.5);
      this.tweens.add({ targets: im, alpha: 0, duration: 240, onComplete: () => im.destroy() });
    }
  }
  rigEvent(p, R, e, P) {
    if (e.shake) this.cameras.main.shake(e.shake[0], e.shake[1]);
    if (!e.fx) return;
    const s = p.spr, hk = R.keys.find(q => q.hit) || R.keys[0], W = p.rig.d === 'W';
    let x = s.x, y = s.y;
    if (e.at === 'feet') { x = wx(p.x, p.y); y = wy(p.y) - 4; }
    else if (e.at === 'foot' || e.at === 'fist') { const q = this.rigPt(P, hk[e.at] || [64, 60], p.rig.d); x = q.x; y = q.y; }
    x += (e.dx || 0) * (W ? -1 : 1);
    for (let i = 0; i < (e.n || 1); i++) this.rigPop(e.fx, x + (e.n > 1 ? rnd(-e.sp, e.sp) : 0), y + (e.n > 1 ? rnd(-e.sp, e.sp) : 0), wy(p.y) + 1, { ...e, flip: W, delay: i * 40 });
  }
  auraFx(p) {                                                                     // v0.8.9 a keeper with a special save ready: flames at his feet
    const now = this.time.now; if (now < (p.auraAt || 0) || this.replay) return; p.auraAt = now + 70;
    this.rigPop(['flame', 'flameBlue', 'flamePurple'][clamp(p.spSave, 1, 3) - 1], wx(p.x, p.y) + rnd(-16, 16), wy(p.y) - rnd(0, 8), wy(p.y) + 0.2, { s: [0.45, 0.9], ms: 420, dy: -34, a: 0.85 });
  }
  // just before; the AI heads at goal near the box, clears near its own goal, otherwise nods it on.
  headers() {
    const b = this.ball, bsp = len(b.vx, b.vy);
    if (b.special && b.pierce > 0) return;                                      // v0.8.6: nobody heads / volleys a special that still blows through people
    // AI: a fast ball across the box at his feet / knees -> hit it first time (a volley if it's off the ground)
    if (!b.owner && !b.inNet && b.z > 1.35 && b.z < 2.4 && !this.diving) {         // AI: the odd bicycle kick
      for (const p of this.all) {
        if (p === this.human || (b.tried && b.tried.has('b' + p.team.name + p.i)) || !this.canBicycle(p)) continue;
        (b.tried = b.tried || new Set()).add('b' + p.team.name + p.i);
        if (Math.random() < 0.3) { this.bicycle(p); return; }
      }
    }
    if (!b.owner && !b.inNet && b.z < 1.0 && bsp > 8 && !this.diving) {
      for (const p of this.all) {
        if (p === this.human || p.keeper || p.busy() || p.stun > 0 || p.cool > 0 || (b.tried && b.tried.has('v' + p.team.name + p.i))) continue;
        const d = len(p.x - b.x, p.y - b.y), toGoal = len(p.team.goalX - p.x, 34 - p.y);
        if (d < 1.0 && toGoal < 20 && (p.team.goalX - p.x) * p.team.side > 2) {
          (b.tried = b.tried || new Set()).add('v' + p.team.name + p.i);
          if (Math.random() < 0.8) { const volley = b.z > 0.35; b.owner = p; this.doShot(p, rnd(0.45, 0.75), rnd(-1, 1)); if (volley) p.kickAnim = 'volley'; return; }
        }
      }
    }
    if (!b.owner && !b.inNet && b.z > 0.5 && b.z < 1.3 && !this.diving && b.vz < 0) {           // AI: dive at a low cross near goal
      for (const p of this.all) {
        if (p === this.human || p.keeper || p.busy() || p.stun > 0 || p.cool > 0 || (b.tried && b.tried.has('d' + p.team.name + p.i))) continue;
        const d = len(p.x - b.x, p.y - b.y), toGoal = len(p.team.goalX - p.x, 34 - p.y);
        if (d > 1.3 && d < 3.0 && toGoal < 16) { (b.tried = b.tried || new Set()).add('d' + p.team.name + p.i); if (Math.random() < 0.45) { this.divingHeader(p); break; } }
      }
    }
    if (b.owner || b.inNet || b.z < 1.1 || b.z > 2.7) return;
    for (const p of this.all) {
      if (p.busy() || p.stun > 0 || p.cool > 0) continue;
      if (p.keeper && Math.abs(p.x - p.team.ownGoalX) < 16.5 && Math.abs(p.y - 34) < 20.2) continue;   // keepers catch it
      if (len(p.x - b.x, p.y - b.y) > 1.2) continue;
      let kind;
      if (p === this.human) { if (!(this.headBuf > 0)) continue; kind = this.headKind === 'shoot' ? 'goal' : 'pass'; }
      else {
        const toGoal = len(p.team.goalX - p.x, 34 - p.y);
        const chestable = b.z < 1.7 && len(b.vx, b.vy) < (b.target === p ? 16 : 9);                 // away from goal he'd rather chest it down
        if ((chestable && toGoal > 20) || (b.tried && b.tried.has('h' + p.team.name + p.i))) continue;
        (b.tried = b.tried || new Set()).add('h' + p.team.name + p.i); if (Math.random() > (toGoal < 20 ? 0.9 : 0.75)) continue;
        kind = toGoal < 18 ? 'goal' : (Math.abs(p.x - p.team.ownGoalX) < 25 ? 'clear' : 'pass');
      }
      this.header(p, kind); return;
    }
  }
  header(p, kind) {
    const b = this.ball, s = p.team.side; let tx, ty, spd, vz, best = null;
    if (kind === 'goal') { tx = p.team.goalX + s * 2; ty = 34 + (p === this.human ? Input.axis.y * 2.6 : rnd(-2.6, 2.6)); spd = rnd(12, 15); vz = rnd(-1.5, 0.8); }
    else if (kind === 'clear') { tx = p.x + s * 25; ty = clamp(p.y + rnd(-12, 12), 4, 64); spd = 15; vz = 4.5; }
    else { best = this.bestOption(p); tx = best ? best.q.x : p.x + s * 12; ty = best ? best.q.y : p.y; spd = clamp(len(tx - p.x, ty - p.y) * 0.9, 7, 14); vz = 2.5; }
    const dx = tx - b.x, dy = ty - b.y, l = len(dx, dy) || 1;
    Object.assign(b, { vx: dx / l * spd, vy: dy / l * spd, vz, skid: true, rollV: 0.72 * spd, last: p.team, lastP: p, save: null, target: best ? best.q : null, special: 0, power: 0, saveable: null });   // v0.8.8: a headed ball is an ordinary ball (a spent special kept its special flight)
    p.face = dirIndex(dx, dy); p.setState('header', 0.5); p.cool = 0.4; this.headBuf = 0; b.tried = null; SFX.head(); b.how = { kind: 'header', x: b.x, y: b.y };
    if (kind === 'goal') { this.planSave(p.team.opp.players[0]); this.shotSaveCall(p.team.opp, p.team); }
    if (best && p.team === this.home) { this.nextHuman = best.q; this.passRing = { p: best.q, t: 1.0 }; }
  }
  divingHeader(p) {
    const b = this.ball, dx = b.x + b.vx * 0.15 - p.x, dy = b.y + b.vy * 0.15 - p.y, d = len(dx, dy) || 1;
    p.face = dirIndex(dx, dy); p.setState('dheader', 0.75); p.cool = 0; p.vx = dx / d * 8; p.vy = dy / d * 8;
    this.diving = { p, t: 0.35 };
  }
  diveTick(dt) {
    const D = this.diving; if (!D) return; D.t -= dt; const b = this.ball, p = D.p;
    if (p.state !== 'dheader' || b.owner || D.t <= 0) { this.diving = null; return; }
    if (len(b.x - p.x, b.y - p.y) < 1.2 && b.z > 0.2 && b.z < 1.6) {
      this.diving = null; p.cool = p.stateT + 0.45; const s = p.team.side, toGoal = len(p.team.goalX - p.x, 34 - p.y);
      const tx = toGoal < 25 ? p.team.goalX + s * 2 : p.x + s * 18, ty = toGoal < 25 ? 34 + (p === this.human ? Input.axis.y * 2.6 : rnd(-2.6, 2.6)) : p.y + rnd(-8, 8);
      const ddx = tx - b.x, ddy = ty - b.y, l = len(ddx, ddy) || 1, spd = rnd(15, 18);
      Object.assign(b, { vx: ddx / l * spd, vy: ddy / l * spd, vz: rnd(0.5, 2), skid: true, rollV: 0.72 * spd, last: p.team, lastP: p, save: null, target: null, special: 0, power: 0, saveable: null });
      if (toGoal < 25) { this.planSave(p.team.opp.players[0]); this.shotSaveCall(p.team.opp, p.team); }
      this.say('', 'DIVING HEADER!', 0.9); SFX.head(); b.how = { kind: 'dheader', x: b.x, y: b.y };
    }
  }
  switchHuman() {
    const b = this.ball;
    const c = this.home.players.filter(p => !p.keeper && !p.sentOff).sort((a, q) => len(a.x - b.x, a.y - b.y) - len(q.x - b.x, q.y - b.y));
    if (c[0] === this.human && c[1]) this.human = c[1]; else this.human = c[0];
  }
  // v0.8.1 two different tackles (Luca): CHALLENGE (pass button) and SLIDE (shoot button), like FIFA / PES.
  tackle(p, carrier, slide, dir) { return slide ? this.slideTackle(p, dir) : this.challenge(p, carrier); }
  // CHALLENGE: a standing tackle for when you're close, in front of him or just to the side. Win it and the ball is
  // AT YOUR FEET straight away. From behind it rarely works and can be a foul. Miss and you're off balance a moment.
  challenge(p, carrier) {
    const b = this.ball;
    if (!carrier || (carrier.keeper && carrier.hands) || p.cool > 0) return;
    p.cool = 0.6; p.face = dirIndex(b.x - p.x, b.y - p.y);
    if (MAN.kits[p.kit].anims[`tackle-${DIRS[p.face]}`]) p.setState('tackle', 0.3);      // the lunge (PixelLab batch 5)
    const db = len(b.x - p.x, b.y - p.y);
    if (db > 1.6) { p.stun = 0.35; return; }                                     // lunged at nothing: too far
    const cv = carrier.speed > 0.6 ? { x: carrier.vx / carrier.speed, y: carrier.vy / carrier.speed } : dirVec(carrier.face);
    const rx = p.x - carrier.x, ry = p.y - carrier.y, rl = len(rx, ry) || 1, front = (cv.x * rx + cv.y * ry) / rl;
    const human = p === this.human && !this.demo, vsHuman = carrier === this.human && !this.demo;
    let pWin = front > 0.3 ? 0.8 : front > -0.3 ? 0.55 : 0.2;                   // in his path / beside him / behind him
    if (len(b.x - carrier.x, b.y - carrier.y) < 0.7) pWin -= 0.1;               // tight control is harder to win
    if (db < 0.9) pWin += 0.08;                                                  // right on the ball
    if (human) { const Y = this.dkY(carrier.team); pWin += Y.yb - Y.sh; }         // (v0.9.3: by level, was always +0.08; the top levels shield it)
    if (vsHuman) { const Y = this.dkY(p.team); pWin -= carrier.burst > 0 ? Math.max(0.2, 0.3 * Y.tk) : (carrier.sprinting ? 0.2 : 0.12) * Y.tk; }   // you can beat the computer with a burst (v0.9.3: by how much, by level)
    else if (carrier.burst > 0) pWin -= 0.25;                                     // v0.8.2: the computer's take-on burst too
    if (Math.random() < pWin) { this.steal(p, carrier); return; }               // won: it's yours, at your feet
    if (front < -0.3 && rl < 1.2 && Math.random() < 0.4) { this.foul(p, carrier, true); return; }   // through the back of him
    if (rl < 1.0 && Math.random() < 0.06) { this.foul(p, carrier, false); return; }                // clipped his ankle
    p.stun = 0.4;                                                                // missed: off balance
  }
  // SLIDE: you go to ground in the direction you're pushing (or at the ball). It reaches further than a challenge.
  // A perfect slide from straight in front can stop the ball dead for you; otherwise the ball rolls on the way the
  // tackle sends it (your slide + his run). Hitting the man before the ball is a foul. Resolved on contact in slides().
  slideTackle(p, dir) {
    const b = this.ball; if (p.cool > 0) return;
    // v0.8.2: aim where the ball WILL be (it was aimed at where it was, so a slide at a runner hit the man: 22 fouls in 60);
    // a push within ~35 degrees of that line is helped onto it
    // (a slide covers (9.5 / 3.2) * (1 - e^(-3.2 t)) metres: it slows fast, so the lead is solved on that, not on 9.5 m/s)
    // the earliest moment the slide can reach where the ball will be (foot 0.7 m out, ~1 m of leg reach)
    let tr = 0, gap = 1e9;
    for (let t = 0; t <= 0.6; t += 0.025) { const D = len(b.x + b.vx * t - p.x, b.y + b.vy * t - p.y) - 0.7 - 2.97 * (1 - Math.exp(-3.2 * t));
      if (D < 0.6) { tr = t; break; } if (D < gap) { gap = D; tr = t; } }
    const lx = b.x + b.vx * tr - p.x, ly = b.y + b.vy * tr - p.y, ll = len(lx, ly) || 1, lead = { x: lx / ll, y: ly / ll };
    let d = dir && len(dir.x, dir.y) > 0.2 ? { x: dir.x / len(dir.x, dir.y), y: dir.y / len(dir.x, dir.y) } : lead;
    if (d !== lead && d.x * lead.x + d.y * lead.y > 0.82 && ll < 5) d = lead;
    p.face = dirIndex(d.x, d.y); p.slideDir = d;
    p.vx = d.x * 9.5; p.vy = d.y * 9.5; p.setState('slide', 0.6); p.cool = 0.7; p.slideWon = false; p.slideHit = new Set();
  }
  // v0.8 a clean win: the ball is yours, he stumbles
  steal(p, carrier, block) {
    // v0.8.2: the man who lost it is off balance a moment longer and can't nick it straight back (he took it back 1 in 2)
    this.gain(p, 0); if (carrier) { carrier.stun = block ? 0.35 : 0.6; carrier.cool = 1.0; if (!block && carrier.state !== 'kick') carrier.setState('hit', 0.43); }
    this.stats && this.stats.steals++;
  }
  // v0.8 BLOCK: stand in the dribbler's path (jockey him) and he runs the ball into you - no button needed.
  // You (human) win it quickly; the computer needs a bit longer against you, more if you're bursting past on a sprint.
  blockSteals(dt) {
    const b = this.ball, c = b.owner; if (!c || c.hands || c.state === 'kick' || this.setPiece || this.pending || b.z > 0.5) return;
    const dir = c.speed > 0.8 ? { x: c.vx / c.speed, y: c.vy / c.speed } : dirVec(c.face);
    for (const p of c.team.opp.players) {
      if (p.keeper || p.sentOff || p.stun > 0 || p.cool > 0 || p.busy()) continue;
      const still = c.speed < 0.8;                                               // v0.8.2: standing still he isn't running it into you -
      if (len(b.x - p.x, b.y - p.y) > (still ? 0.55 : 0.85)) continue;          // you have to be right on the ball
      const rx = p.x - c.x, ry = p.y - c.y, rl = len(rx, ry); if (rl > 1.8) continue;
      if ((dir.x * rx + dir.y * ry) / (rl || 1) < 0.35) continue;               // not in his way
      const human = p === this.human && !this.demo, vsHuman = c === this.human && !this.demo;
      const rate = human ? (c.burst > 0 ? 1.6 : 3.2) * this.dkY(c.team).mine : vsHuman ? (c.burst > 0 ? 0.3 : c.sprinting ? 0.7 : 1.3) * this.dkY(p.team).blk : (c.burst > 0 ? 0.5 : 1.6);   // per second in his path (v0.9.3: v you, by level)
      if (Math.random() < rate * (still ? 0.5 : 1) * dt) { this.steal(p, c, true); return; }
    }
  }
  knock(p, carrier, power) {
    const b = this.ball; b.owner = null; b.target = null;
    const ux = (b.x - p.x) || 0.01, uy = b.y - p.y, l = len(ux, uy);
    b.vx = ux / l * power + rnd(-1, 1); b.vy = uy / l * power + rnd(-1, 1); b.vz = 0.6; b.z = 0.05; b.skid = true; b.rollV = 0;
    b.last = p.team; if (carrier) { carrier.stun = 0.55; carrier.cool = 0.5; carrier.hands = false; }
  }
  slides() {
    const b = this.ball;
    for (const p of this.all) {
      if (p.state !== 'slide') continue;
      const dv = p.slideDir || dirVec(p.face), fx = p.x + dv.x * 0.7, fy = p.y + dv.y * 0.7;   // v0.8.2: the real slide line (was the 8-way facing: up to 0.3 m off)
      if (b.z < 0.6 && !p.slideWon && !(b.owner && b.owner.team === p.team) && len(b.x - fx, b.y - fy) < 1.05) {   // (an outstretched leg's reach)
        const carrier = b.owner, sd = p.slideDir || dv;
        const cv = carrier && carrier.speed > 0.6 ? { x: carrier.vx / carrier.speed, y: carrier.vy / carrier.speed } : carrier ? dirVec(carrier.face) : null;
        const head = cv ? (sd.x * cv.x + sd.y * cv.y) : 0;                       // -1 = straight into him, head on
        const front = carrier ? ((p.x - carrier.x) * (cv ? cv.x : 0) + (p.y - carrier.y) * (cv ? cv.y : 0)) / (len(p.x - carrier.x, p.y - carrier.y) || 1) : 0;
        this.knock(p, carrier, 0); p.slideWon = true;
        if (carrier) { carrier.stun = 0.85; carrier.cool = 1.0; }                // v0.8.2: he hurdles your leg and loses his stride
        if (carrier && head < -0.6 && front > 0.5 && Math.random() < 0.55) {   // perfect, head on: a block - you both stop dead and
          p.vx *= 0.2; p.vy *= 0.2; p.stateT = Math.min(p.stateT, 0.3);           // the ball's yours as you get up (no teleport: it
          b.vx = sd.x * 0.5; b.vy = sd.y * 0.5; b.vz = 0; p.slideKeep = true;      // stays where you met it)
        } else {                                                                // it rolls on, the way the tackle sends it
          const cvx = carrier ? carrier.vx * 0.15 : 0, cvy = carrier ? carrier.vy * 0.15 : 0;   // (was * 0.5: it ran on with him and he just collected it)
          b.vx = sd.x * 6.5 + cvx; b.vy = sd.y * 6.5 + cvy; b.vz = 0.3;
        }
      }
      for (const o of p.team.opp.players) {
        if (o.sentOff || p.slideHit.has(o) || len(o.x - fx, o.y - fy) > 0.8 || o.keeper && o.hands) continue;
        p.slideHit.add(o);
        const nearBall = len(o.x - b.x, o.y - b.y) < 2.2;
        const od = dirVec(o.face), fromBehind = (od.x * dv.x + od.y * dv.y) > 0.6;   // he was running away from you
        o.setState('fall', 0.55); o.cool = 0.6; o.vx = dv.x * 3; o.vy = dv.y * 3;
        const fromRight = (od.x * dv.x + od.y * dv.y) > 0.8;                     // v0.8.2: ball first and not straight through his back = fair
        if (nearBall && (p.slideWon ? (fromRight && Math.random() < 0.3) : (fromBehind || Math.random() < 0.55))) { this.foul(p, o, fromBehind); return; }   // v0.8: ball first = fair
      }
    }
  }
  sendOff(p) {
    p.sentOff = true; p.state = 'idle'; p.vx = p.vy = 0; p.x = -60; p.y = -60; p.stun = 1e9; p.cool = 1e9; p.hands = false;
    if (this.ball.owner === p) this.ball.owner = null;
    if (this.human === p) this.switchHuman();
    if (this.nextHuman === p) this.nextHuman = null;
  }
  // a foul: free kick where it happened, or a penalty if it was in the fouler's own box.
  // v0.8 FOUL SCENE (Luca: no hard cut any more): whistle, the man goes down, play stops; the ref runs over and shows
  // the card to the fouler himself, Rami has his say, the fouler protests, the victim stays down hurt - then a TV wipe
  // to the free kick with both teams already lined up. Any action key skips it (like FIFA's cutscenes).
  foul(by, victim, fromBehind) {
    if (this.setPiece || this.freeze > 0 || this.foulScene || this.penaltyMode) return;
    by.fouls = (by.fouls || 0) + 1; this.stat(by.team).fouls++;
    let card = '';
    if ((fromBehind && Math.random() < 0.6) || by.fouls >= 3) { by.yellows = (by.yellows || 0) + 1; card = by.yellows >= 2 ? 'RED CARD!' : 'YELLOW CARD'; }
    if (card) this.stat(by.team)[card === 'YELLOW CARD' ? 'yellows' : 'reds']++;
    this.loseTime(card ? 40 : 12);                                               // v0.8.4: added time
    const def = by.team, gx = def.ownGoalX, b = this.ball;
    const inBox = Math.abs(victim.x - gx) < 16.5 && Math.abs(victim.y - 34) < 20.16;
    SFX.whistle(1);
    if (!victim.keeper && victim.state !== 'fall' && victim.state !== 'getup') {        // he goes down
      const ux = victim.x - by.x, uy = victim.y - by.y, ul = len(ux, uy) || 1;
      victim.setState('fall', 0.8); victim.vx = victim.vx * 0.4 + ux / ul * 2.2; victim.vy = victim.vy * 0.4 + uy / ul * 2.2;
    }
    Object.assign(b, { owner: null, target: null, save: null }); this.pending = null; this.charge = -1; this.passAim = null;
    if (this.ref) { const r = this.ref, dx = r.x - by.x, dy = r.y - by.y, d = len(dx, dy);
      if (card && d > 9) { r.x = by.x + dx / d * 9; r.y = by.y + dy / d * 9; }   // he runs in from just off screen
      r.act('whistle', 0.45); }
    this.say('FOUL!', '', 1.3);
    // v0.8.5 INJURY CHANCE (Luca): a bad one can leave him limping (slower) until he's subbed - more likely on a card / from behind
    const injured = !victim.keeper && !victim.injury && !this.demo && !window.HC2_TEST_FAST && !window.__lab && Math.random() < (card ? 0.14 : 0.04) + (fromBehind ? 0.04 : 0);
    if (injured) { victim.injury = { k: rnd(0.7, 0.82) }; this.loseTime(50); }
    this.foulScene = { t: 0, by, victim, card, inBox, injured, kind: inBox ? 'PENALTY' : 'FREE KICK', team: victim.team,
      x: inBox ? gx + def.side * 11 : clamp(victim.x, 1, PITCH_L - 1), y: inBox ? 34 : clamp(victim.y, 1, PITCH_W - 1),
      shown: false, hurt: false, end: card ? 99 : injured ? 3.4 : 1.9, wipeT: -1, n: this.recN || 0 };
    if (!card) this.ramiSay('foul', { text: this.foulLine('', inBox, by), expr: inBox ? 'shock' : 'smirk' }, 2);
  }
  foulLine(card, inBox, by) {                                                     // Rami's take (Luca: "some funny line")
    const pick = a => a[Math.floor(Math.random() * a.length)];
    if (card === 'RED CARD!') return pick(['RED CARD!\nOFF YOU GO, ' + by.num + '!', 'OUTRAGEOUS!\nHE IS OFF!', 'THAT IS A RED!\nSEE YOU NEXT SEASON!', 'EARLY SHOWER\nFOR NUMBER ' + by.num + '!']);
    if (card) return pick(['OOF! THAT WAS A\nTERRIBLE FOUL!', 'HE TOOK THE MAN,\nNOT THE BALL!', 'THAT IS NOT FOOTBALL,\nTHAT IS WRESTLING!', 'HE WILL FEEL THAT\nONE TOMORROW!', 'BOOKED! AND HE\nKNOWS IT, ' + by.num + '!']);
    if (inBox) return pick(['PENALTY!! WHAT WAS\nHE THINKING?!', 'IN THE BOX!\nTHE REF POINTS TO THE SPOT!']);
    return pick(['A BIT LATE THERE!\nFREE KICK.', 'CLUMSY!\nREF HAS SEEN IT.', 'HE WENT DOWN LIKE\nA SACK OF SPUDS!', 'NAUGHTY!\nFREE KICK.']);
  }
  foulSceneTick(dt) {
    const F = this.foulScene, b = this.ball, by = F.by, v = F.victim, ref = this.ref;
    F.t += dt;
    if (F.wipeT >= 0) { F.wipeT -= dt; if (F.wipeT < 0) this.endFoulScene(); return; }   // the wipe is covering the cut
    // the ball rolls dead
    b.z = Math.max(0, b.z - dt * 3); b.vz = 0; const k = Math.exp(-dt * 3.5); b.vx *= k; b.vy *= k;
    b.x = clamp(b.x + b.vx * dt, 0.5, PITCH_L - 0.5); b.y = clamp(b.y + b.vy * dt, 0.5, PITCH_W - 0.5);
    // everyone pulls up; the ones close by wander over to have a look
    for (const p of this.all) {
      if (p.sentOff) continue;
      if (p !== by && p !== v && !p.keeper && !p.busy()) {
        const dx = p.x - by.x, dy = p.y - by.y, d = len(dx, dy);
        if (d < 14 && d > 4.5 && F.t > 0.4) p.moveTo(by.x + dx / d * 4.5, by.y + dy / d * 4.5, 1.9, dt); else p.steer(0, 0, dt);
        if (d < 14 && p.speed < 0.3) p.look(by.x - p.x, by.y - p.y);
      } else if (!p.busy()) p.steer(0, 0, dt);
      p.step(dt);
    }
    if (F.t > 0.85 && !F.hurt && (F.card || F.injured) && MAN.kits[v.kit].anims['hurt-S'] && !v.keeper && (v.state === 'getup' || !v.busy())) {   // stays down, holding it
      F.hurt = true; v.setState('hurt', 2.6); v.face = 6; v.vx = v.vy = 0;
    }
    if (F.card && !F.shown) {
      const tx = clamp(by.x + 0.9, 1, PITCH_L - 1), ty = clamp(by.y - 2.0, 0.5, PITCH_W - 1);   // just behind him, facing the camera and him
      if (ref && F.t > 0.45) ref.goTo = { x: tx, y: ty };
      const there = !ref || (F.t > 0.45 && len(ref.x - tx, ref.y - ty) < 0.6);
      if (there || F.t > 3.2) {
        F.shown = true; F.end = F.t + 2.3;
        if (ref) { ref.goTo = null; if (!there) { ref.x = tx; ref.y = ty; } ref.act(F.card === 'RED CARD!' ? 'cardR' : 'card', 2.3); }
        if (!by.busy() || by.state === 'getup' || by.state === 'tackle') { if (MAN.kits[by.kit].anims['protest-S']) by.setState('protest', 2.0); by.face = 6; by.vx = by.vy = 0; }
        this.ramiSay(F.card === 'RED CARD!' ? 'red' : 'yellow', { text: this.foulLine(F.card, F.inBox, by), expr: F.card === 'RED CARD!' ? 'shock' : 'laugh' }, 3);
        this.say(F.card === 'RED CARD!' ? 'RED CARD!' : 'YELLOW CARD', `${by.team.name} #${by.num}`, 2.2);
        this.cardPop(by, F.card);
      }
    } else if (!F.card && !F.protest && F.t > 0.5 && !by.busy() && Math.random() < 0.6 && MAN.kits[by.kit].anims['protest-S']) { F.protest = true; by.setState('protest', 1.1); by.face = 6; by.vx = by.vy = 0; }
    else if (!F.card && !F.protest && F.t > 0.5) F.protest = true;
    const skip = !this.demo && F.t > 0.9 && (Input.pressed('pass') || Input.pressed('shoot') || Input.pressed('lob'));
    if (skip) { F.wipeT = 0.24; this.wipe(); return; }
    if (F.t >= F.end) {                                                          // v0.8.1 (Luca): a replay of the tackle for cards + penalties
      const fr = (F.card || F.inBox) && this.foulFrames(F);
      if (fr) { const cap = F.card ? `${F.card === 'RED CARD!' ? 'RED CARD' : 'YELLOW CARD'} · ${F.by.team.name} #${F.by.num}` : 'PENALTY';
        F.wipeT = 1e9; this.startReplay('FOUL', () => this.endFoulScene(), fr, { caption: cap, slowPre: 1.0, slow: 1.2 }); }
      else { F.wipeT = 0.24; this.wipe(); }
    }
  }
  foulFrames(F) {                                                                // ~2.5 s before the contact to ~0.8 s after, slow-mo on the contact
    const rec = this.rec || [], i = this.recIndex(F.n); if (i < 60 || i >= rec.length) return null;
    const a = Math.max(0, i - 120), fr = rec.slice(a, Math.min(rec.length, i + 45)).map(f => Object.assign({}, f));
    fr[i - a].goal = true; return fr.length >= 60 ? fr : null;
  }
  cardPop(by, card) {                                                             // the card pops up over the booked player
    if (!this.textures.exists('fx') || !this.textures.get('fx').has('cardY')) return;
    const im = this.add.image(0, 0, 'fx', card === 'RED CARD!' ? 'cardR' : 'cardY').setScale(0.2).setDepth(8e6 + 2), o = { lift: 0 };
    const stick = () => { if (!by.sentOff) im.setPosition(wx(by.x, by.y), wy(by.y) - 150 - o.lift); };
    stick(); this.events.on('postupdate', stick);
    this.tweens.add({ targets: im, scale: 1.1, angle: 8, duration: 220, ease: 'Back.easeOut', onComplete: () => this.tweens.add({ targets: [im, o], alpha: 0, lift: 20, delay: 1500, duration: 300, onComplete: () => { this.events.off('postupdate', stick); im.destroy(); } }) });
  }
  endFoulScene() {
    const F = this.foulScene; this.foulScene = null; if (!F) return;
    if (F.card === 'RED CARD!' && !F.by.keeper) this.sendOff(F.by);
    if (this.ref) { this.ref.goTo = null; this.ref.t = 0; this.ref.state = 'idle'; }
    this.camX = this.camY = undefined;                                           // a cut, not a pan
    this.restart(F.kind, F.team, F.x, F.y, F.inBox ? F.card : '', { cut: true });
    if (this.ref && !this.penaltyMode) this.ref.place(this.ball);
    if (F.injured) this.injuryNews(F.victim);
  }
  // v0.8.5: after the free kick is given - the computer brings a man on for him; you get told (PAUSE -> TEAM to sub him)
  injuryNews(v) {
    if (!v.injury || v.sentOff) return;
    const t = v.team, human = t === this.home && !this.demo;
    if (!human && this.injSub(v)) return;
    this.ramiSay('foul', { text: `THAT LOOKS BAD.\nNUMBER ${v.num} IS LIMPING.`, expr: 'shock' }, 3);
    this.time.delayedCall(2600, () => { if (!this.over) this.say('INJURY', human ? `#${v.num} IS LIMPING · PAUSE (ENTER) -> TEAM TO SUB HIM` : `${t.name} #${v.num} PLAYS ON LIMPING`, 3); });
  }
  injSub(p) {                                                                    // a sub for this man, if the team has one left
    const Q = this.squadOf(p.team), sb = Q.bench.find(s => !s.gk && !s.used && !s.off); if (!sb || Q.subs >= 3) return false;
    const offRec = { ...this.ident(p), off: true, used: true }; this.setIdent(p, { num: sb.num, stamina: 1, yellows: 0, fouls: 0 }); sb.used = true; Q.bench.push(offRec); Q.subs++;
    SFX.whistle(1); this.loseTime(30);
    this.time.delayedCall(2600, () => { if (!this.over) this.say('SUBSTITUTION', `${p.team.name}: #${sb.num} ON FOR THE INJURED #${offRec.num}`, 2.6); });
    return true;
  }

  // ---------- v0.8.1 TEAM AI, rebuilt on established football games (Luca: "the defence clutters - model it on other
  // games, check their code"). What each part is taken from:
  //  * possession is decided per team and does NOT flip while your own pass is travelling (Buckland's Simple Soccer);
  //    the shape blends from defending to attacking over ~0.4 s instead of jumping
  //  * off the ball everyone holds a ZONE: his formation spot + a share of where the ball is, per line, defenders
  //    always behind the ball, forwards onside (RoboCup SBSP as coded in UvA Trilearn / helios - same 105 x 68 m pitch)
  //  * ONE presser (goal-side, quickest to the ball, kept unless someone is clearly quicker: YSoccer + Google Research
  //    Football's 0.8 ratio / 0.5 s pad), ONE cover behind him, up to 3 markers on the most dangerous runners
  //    (defenders mark fully, midfielders partly, forwards never - gfootball), the rest stay in their zones and keep
  //    6 m apart (Buckland's separation)
  //  * the presser JOCKEYS: 2 m goal-side of the dribbler, mirrors him, and only commits when he's in front of him
  //    (gfootball GetDefendPosition / FIFA 12 "contain")
  //  * roles are re-thought every 0.4 s (gfootball), not every frame; tiny moves inside a dead zone are skipped (helios)
  aiFrame(team, x) { return (team.side > 0 ? x : PITCH_L - x) - 52.5; }          // metres from the centre line, + = towards the goal it attacks
  aiWorld(team, X) { return team.side > 0 ? X + 52.5 : PITCH_L - (X + 52.5); }
  aiTime(p, pt) { return len(pt.x - p.x, pt.y - p.y) / p.top(true, false); }
  aiFree(p) { return !p.keeper && !p.sentOff && p.stun <= 0 && (!p.busy() || p.state === 'tackle'); }
  aiRoles(team) {
    const b = this.ball, owner = b.owner, gx = team.ownGoalX, they = owner && owner.team !== team;
    const human = team === this.home && !this.demo ? this.human : null;
    const cand = team.players.filter(p => this.aiFree(p));
    const spot = p => owner ? owner : this.intercept(p, p.top(true, false));
    team.cover = null; team.marks = new Map();
    const loose = !owner && !(b.target && !b.target.sentOff);                    // nobody's: BOTH sides send one man for it
    if (team.inPoss && !loose) { team.presser = null; return; }
    // goal-side players only, when they have it (YSoccer: never press from behind)
    const ballG = len(b.x - gx, b.y - 34);
    let pool = cand; if (they) {                                                 // (the man already on him keeps it while he's level or goal-side)
      const gs = cand.filter(p => len(p.x - gx, p.y - 34) < (p === team.presser ? 1.03 : AI.GOALSIDE) * ballG); if (gs.length) pool = gs; }
    const T = new Map(pool.map(p => [p, this.aiTime(p, spot(p))])); pool = pool.slice().sort((u, v) => T.get(u) - T.get(v));
    let best = pool[0] || null; const cur = team.presser;
    if (cur && best && cur !== best && pool.includes(cur) && ((team.presserHeld || 0) < AI.HOLD || T.get(best) + AI.PAD >= AI.RATIO * (T.get(cur) + AI.PAD))) best = cur;
    if (best !== cur) team.presserHeld = 0;
    // you're the one going to the ball: the computer doesn't double up on you
    if (human && best && !human.sentOff && this.aiTime(human, spot(human)) <= T.get(best) + 0.6) { team.cover = best; team.presser = human; }
    else { team.presser = best; if (they) team.cover = pool.find(p => p !== best && p !== human && len(p.x - b.x, p.y - b.y) < AI.COVER_R) || null; }
    if (!they) team.cover = null;
    if (team.inPoss) return;                                                     // a loose ball we had: one man goes for it, the rest keep shape
    // markers: the most dangerous runners (closest to a point between our goal and the ball), goal-side of each
    const aim = { x: 0.8 * gx + 0.2 * b.x, y: 0.8 * 34 + 0.2 * b.y };
    const threats = team.opp.players.filter(o => !o.keeper && !o.sentOff && o !== owner && len(o.x - gx, o.y - 34) < 40)
      .sort((u, v) => len(u.x - aim.x, u.y - aim.y) - len(v.x - aim.x, v.y - aim.y)).slice(0, AI.MARKERS);
    const free = team.players.filter(p => this.aiFree(p) && p.i <= 8 && p !== team.presser && p !== team.cover && p !== human);
    for (const o of threats) {
      let pick = null, bq = 1e9;
      for (const p of free) { if (team.marks.has(p)) continue; const d = len(p.x - o.x, p.y - o.y); if (d > 18) continue;
        const q = d - (len(p.x - gx, p.y - 34) < len(o.x - gx, o.y - 34) ? 4 : 0) - (p.i <= 4 ? 3 : 0); if (q < bq) { bq = q; pick = p; } }
      if (pick) team.marks.set(pick, o);
    }
  }
  aiZone(p, team) {                                                              // SBSP: formation spot + a share of the (smoothed) ball, per line
    const L = AI.LINES[p.i <= 4 ? 0 : p.i <= 8 ? 1 : 2], fx = team.fx, fy = team.fy;
    const hy = AI.HOME_Y_DEF[p.i] + (AI.HOME_Y_ATT[p.i] - AI.HOME_Y_DEF[p.i]) * team.poss;
    let X = L.def + (L.att - L.def) * team.poss + L.ax * fx, Y = hy + L.ay * fy * (1 - 0.4 * team.poss);
    if (L.behind) X = Math.min(X, fx - 1.5);
    X = clamp(X, L.min, L.max);
    if (p.i >= 9 && team.offX != null) X = Math.min(X, Math.max(team.offX, fx) - 0.6);   // strikers stay onside
    return { x: clamp(this.aiWorld(team, X), 2, PITCH_L - 2), y: clamp(34 + Y, 3, PITCH_W - 3) };
  }
  aiPress(p, team, carrier, dt) {                                                // close him down, then jockey
    const gx = team.ownGoalX, ux = gx - carrier.x, uy = 34 - carrier.y, ul = len(ux, uy) || 1, d = len(carrier.x - p.x, carrier.y - p.y);
    let tx, ty, v;
    if (d > AI.MIRROR) { tx = carrier.x + ux / ul * Math.min(4, d * 0.25) + carrier.vx * 0.3; ty = carrier.y + uy / ul * Math.min(4, d * 0.25) + carrier.vy * 0.3;
      p.sprinting = d > 10 && p.stamina > 0.35; v = p.top(p.sprinting, false); }
    else {
      // v0.8.2 not goal-side yet (arriving from the side / behind): a recovery run ROUND him onto the goal side, not through him
      const gs = ((p.x - carrier.x) * ux + (p.y - carrier.y) * uy) / ul; let ox = 0, oy = 0;
      if (gs < 1) { const px = -uy / ul, py = ux / ul, sd = Math.sign((p.x - carrier.x) * px + (p.y - carrier.y) * py) || 1, k = clamp((1 - gs) / 2, 0, 1) * 1.6; ox = px * sd * k; oy = py * sd * k; }
      // v0.8.2: he slows down -> step in; he stops / shields it -> go to the BALL (just goal-side of it), round him if need be
      // (it stood off 2 m forever: a dribbler standing still, or shielding it with his back to you, was never tackled)
      const bl = this.ball, slow = carrier.speed < 1.5, cont = AI.CONTAIN * clamp(carrier.speed / 4, 0.45, 1);
      tx = carrier.x + ux / ul * cont + carrier.vx * 0.15 + ox; ty = carrier.y + uy / ul * cont + carrier.vy * 0.15 + oy;
      if (slow) {                                                               // v0.8.3: the ball's OPEN side (beyond it from him) -
        const bx = bl.x - carrier.x, by = bl.y - carrier.y, bd = len(bx, by) || 1, ubx = bx / bd, uby = by / bd;   // shielding it with his
        if ((p.x - carrier.x) * ubx + (p.y - carrier.y) * uby < 0.3) {          // back to you parked you on his flank for good
          const px = -uby, py = ubx, sd = Math.sign((p.x - carrier.x) * px + (p.y - carrier.y) * py) || 1;
          tx = carrier.x + px * sd * 1.3 + ubx * 0.5; ty = carrier.y + py * sd * 1.3 + uby * 0.5;   // round him first
        } else { tx = bl.x + ubx * 0.6; ty = bl.y + uby * 0.6; }
      }
      v = Math.min(p.top(false, false) * 1.05, len(carrier.vx, carrier.vy) + 1.2 + d * 0.5); p.look(carrier.x - p.x, carrier.y - p.y); }
    p.moveTo(tx, ty, v * this.dk(team).press, dt);                             // (v0.9.2: how hard he closes down, by level)
    p.watch = d < AI.MIRROR ? carrier : null;                                    // close: jockey him, facing him
    if (d < AI.MIRROR && p.speed < 2.5) p.look(carrier.x - p.x, carrier.y - p.y);
    // commit only from in front (or on a heavy touch), not every time he's near
    const b = this.ball, cv = carrier.speed > 0.6 ? { x: carrier.vx / carrier.speed, y: carrier.vy / carrier.speed } : dirVec(carrier.face);
    const front = (cv.x * (p.x - carrier.x) + cv.y * (p.y - carrier.y)) / (d || 1), loose = len(b.x - carrier.x, b.y - carrier.y) > 1.1;
    const vsHuman = carrier === this.human && !this.demo;
    p.standoff = carrier.speed < 1.5 && len(b.x - p.x, b.y - p.y) < 2.5 ? (p.standoff || 0) + dt : 0;   // (a stand-off that drags on: he pokes at it anyway)
    if (p.cool <= 0 && len(b.x - p.x, b.y - p.y) < AI.REACH && (front > 0.25 || loose || (carrier.speed < 1.5 && front > -0.3) || p.standoff > 3) && Math.random() < dt * (vsHuman ? AI.COMMIT_VS_YOU * this.dkY(team).cmt : AI.COMMIT) * this.dk(team).commit) { p.standoff = 0; this.challenge(p, carrier); return; }
    // v0.8.2 BEATEN (he's got past): a recovery slide from the side, or a lunge from behind when he's through - so the
    // computer gives fouls away too (it never did: no foul scenes or foul replays for its tackles)
    const beaten = front < -0.2, toOwn = len(carrier.x - gx, carrier.y - 34), db = len(b.x - p.x, b.y - p.y);
    if (p.cool <= 0 && beaten && !p.busy() && db > 1.4 && db < 3.6 && toOwn < 45 && carrier.speed > 3 && Math.random() < dt * (vsHuman ? this.dkY(team).sl : 0.6)) { this.slideTackle(p, null); return; }
    if (p.cool <= 0 && beaten && db < AI.REACH && toOwn < 30 && carrier.speed > 2.5 && Math.random() < dt * 0.28) this.challenge(p, carrier);   // (only when he's getting away)
  }
  // v0.7.6 team AI, kept as CLASSIC (start screen: AI button) so Luca can compare
  aiClassic(dt) {
    const b = this.ball;
    const owner = b.owner;
    for (const team of [this.home, this.away]) {
      const has = owner && owner.team === team;
      const chaser = (!has) ? team.players.filter(p => !p.keeper && p !== this.human && !p.sentOff)
        .sort((a, c) => len(a.x - b.x, a.y - b.y) - len(c.x - b.x, c.y - b.y))[0] : null;
      // a ball in the air to one of THEIR players: the nearest defender goes with the receiver to contest it
      const rcv = (!owner && b.target && b.target.team !== team && (b.z > 0.4 || b.vz > 1)) ? b.target : null;
      const marker = rcv ? team.players.filter(p => !p.keeper && p !== this.human && p !== chaser && !p.busy() && !p.sentOff)
        .sort((a, c) => len(a.x - rcv.x, a.y - rcv.y) - len(c.x - rcv.x, c.y - rcv.y))[0] : null;
      for (const p of team.players) {
        if (p === this.human && team === this.home && !this.demo) continue;
        if (p.state === 'kick' || p.state === 'catch' || p.state === 'dive' || p.state === 'slide' || p.state === 'dheader' || p.state === 'chance' || p.state === 'celebrate' || p.state === 'tackle' || p.state === 'dejected' || p.state === 'roar' || p.state === 'beaten' || p.state === 'protest' || p.state === 'hurt' || p.state === 'blasted' || p.stun > 0) continue;
        if (p.keeper) { this.keeperAI(p, dt); continue; }
        if (owner === p) { this.carrierAI(p, dt); continue; }
        if (p === marker && len(p.x - rcv.x, p.y - rcv.y) < 12) {                // stay touch-tight, goal side
          const pt = this.intercept(rcv, rcv.top(true, false)), gs = Math.sign(team.ownGoalX - pt.x) || 1;
          p.sprinting = true; p.moveTo(pt.x + gs * 0.6, pt.y, p.top(true, false), dt); continue;
        }
        // the intended receiver of a pass runs onto it
        if (!owner && b.target === p && b.last === team) {
          const far = len(b.x - p.x, b.y - p.y) > 8 && p.stamina > 0.3; p.sprinting = far;
          const v = p.top(far, false), pt = this.intercept(p, v); p.moveTo(pt.x, pt.y, v, dt); continue;
        }
        if (owner && owner.keeper && owner.hands && owner.team !== team && len(p.x - owner.x, p.y - owner.y) < 14) {   // their keeper has it: back off
          const dx = p.x - owner.x, dy = p.y - owner.y, d = len(dx, dy) || 1;
          p.moveTo(owner.x + dx / d * 15, clamp(owner.y + dy / d * 15, 3, 65), JOG, dt); continue;
        }
        const chase = chaser === p && !(team === this.home && len(this.human.x - b.x, this.human.y - b.y) < len(p.x - b.x, p.y - b.y) + 4) && !(owner && owner.keeper && owner.hands);
        if (chase) {
          const d = len(b.x - p.x, b.y - p.y), go = d > 4 && p.stamina > 0.35; p.sprinting = go;
          const v = p.top(go, false), pt = owner ? { x: b.x + b.vx * 0.3, y: b.y + b.vy * 0.3 } : this.intercept(p, v);
          p.moveTo(pt.x, pt.y, v, dt);
          if (owner && len(b.x - p.x, b.y - p.y) < 1.3 && Math.random() < dt * 1.4) this.tackle(p, owner, Math.random() < 0.12);
          continue;
        }
        // shape: the block follows the ball; with the ball the lines step up (forwards get in behind), without it they drop
        const role = p.i <= 4 ? 0 : p.i <= 8 ? 1 : 2;                            // 0 defence, 1 midfield, 2 attack
        const push = (has ? [4, 10, 18][role] : [-4, -3, 0][role]) * team.side;
        const tx = clamp(p.home.x + (b.x - 52.5) * 0.75 + push, 4, 101);
        const ty = clamp(p.home.y + (b.y - 34) * 0.32, 3, 65);
        const behind = len(tx - p.x, ty - p.y) > 12 && p.stamina > 0.5;          // far out of position: hurry back
        p.moveTo(tx, ty, behind ? RUN : JOG, dt);
      }
    }
  }
  ai(dt) {
    for (const p of this.all) p.watch = null;                                   // (re-set by aiPress for the man containing the dribbler)
    if (AI_MODE === 'classic') return this.aiClassic(dt);
    const b = this.ball, owner = b.owner;
    for (const team of [this.home, this.away]) {
      team.drain = this.dkY(team).st;                                              // v0.9.3 stamina by level (base 1)
      // possession: who has it, or whose pass is travelling; a loose ball keeps the last call (no flip-flopping)
      if (owner) team.inPoss = owner.team === team; else if (b.target && !b.target.sentOff) team.inPoss = b.target.team === team;
      team.poss = clamp((team.poss ?? (team.inPoss ? 1 : 0)) + (team.inPoss ? 1 : -1) * AI.POSS_RATE * dt, 0, 1);
      // the point the shape follows: where the ball is going, smoothed (~0.4 s)
      const fk = 1 - Math.exp(-dt / 0.4), lx = this.aiFrame(team, b.x + b.vx * 0.3), ly = clamp(b.y + b.vy * 0.3, 0, PITCH_W) - 34;
      team.fx = team.fx == null ? lx : team.fx + (lx - team.fx) * fk; team.fy = team.fy == null ? ly : team.fy + (ly - team.fy) * fk;
      { const xs = team.opp.players.filter(o => !o.sentOff).map(o => this.aiFrame(team, o.x)).sort((u, v) => v - u); team.offX = xs.length > 1 ? xs[1] : null; }   // their 2nd-last man
      team.roleT = (team.roleT ?? (team === this.home ? 0 : AI.ROLE_DT / 2)) - dt; team.presserHeld = (team.presserHeld || 0) + dt;
      if (team.roleT <= 0 || (team.presser && !this.aiFree(team.presser) && team.presser !== this.human)) { team.roleT = AI.ROLE_DT * this.dk(team).role; this.aiRoles(team); }   // (v0.9.2: how quickly the team re-reads the play)
      if (owner && owner.team === team && !owner.keeper) { team.supT = (team.supT ?? 0) - dt; if (team.supT <= 0 || (team.support && !this.aiFree(team.support))) { team.supT = AI.ROLE_DT; this.aiSupport(team, owner); } }
      else { team.support = null; team.supportPt = null; team.supT = 0; }
      const rcv = (!owner && b.target && b.target.team !== team && (b.z > 0.4 || b.vz > 1)) ? b.target : null;   // a ball in the air to one of THEIR players
      const aerial = rcv ? team.players.filter(p => this.aiFree(p) && p !== this.human && p !== team.presser)
        .sort((u, v) => len(u.x - rcv.x, u.y - rcv.y) - len(v.x - rcv.x, v.y - rcv.y))[0] : null;
      // everyone's target first (zones, cover, markers), then team-mates' zones are pushed apart
      const tgt = new Map(), fixed = [];
      for (const p of team.players) {
        if (p.keeper || p.sentOff || p === owner || p === team.presser) { if (!p.sentOff && !p.keeper) fixed.push(p); continue; }
        let t = this.aiZone(p, team);
        if (p === team.cover && owner && owner.team !== team) {                  // cover: between the ball and our goal, ~7 m behind the presser
          const gx = team.ownGoalX, ux = gx - owner.x, uy = 34 - owner.y, ul = len(ux, uy) || 1, back = Math.min(owner === this.human && !this.demo ? this.dkY(team).cov : 7, ul * 0.5);   // (v0.9.3: tighter on you at the top levels)
          t = { x: owner.x + ux / ul * back + (34 - owner.y) * 0.0, y: owner.y + uy / ul * back + (34 - owner.y) * 0.12 };
        } else if (team.marks && team.marks.get(p)) {                            // marker: goal-side of his man (defenders fully, midfield 60%)
          const o = team.marks.get(p), gx = team.ownGoalX, ux = gx - o.x, uy = 34 - o.y, ul = len(ux, uy) || 1, bx = b.x - o.x, by = b.y - o.y, bl = len(bx, by) || 1;
          const G = AI.MARK_GAP * this.dk(team).mark, m = { x: o.x + ux / ul * G + bx / bl * 0.5, y: o.y + uy / ul * G + by / bl * 0.5 }, w = p.i <= 4 ? 1 : 0.6;   // (v0.9.2: marking tightness by level)
          t = { x: t.x + (m.x - t.x) * w, y: t.y + (m.y - t.y) * w };
        } else if (p === team.support && team.supportPt) {                       // v0.8.2 support: the best open spot near the ball
          t = { x: team.supportPt.x, y: team.supportPt.y };
        } else if (team.inPoss && owner && owner.team === team && p.i >= 9) {     // with the ball: a forward offers a run in behind
          const runT = (team.runT = (team.runT ?? 0) - dt / 2);
          if (runT <= 0) { team.runT = 1.5; team.runner = team.players.filter(q => q.i >= 9 && !q.sentOff).sort((u, v) => len(u.x - owner.x, u.y - owner.y) - len(v.x - owner.x, v.y - owner.y))[0]; }
          if (team.runner === p) { const ahead = this.aiFrame(team, owner.x) + 18; t = { x: this.aiWorld(team, Math.min(ahead, (team.offX ?? 99) - 0.6)), y: clamp(owner.y + (34 - owner.y) * 0.5, 6, 62) }; }
        }
        if (team.marks && team.marks.get(p) || p === team.cover || (p === team.support && team.supportPt)) fixed.push({ x: t.x, y: t.y, fixedT: true });
        tgt.set(p, t);
      }
      const zones = [...tgt.entries()].filter(([p]) => !(team.marks && team.marks.get(p)) && p !== team.cover && !(p === team.support && team.supportPt));
      if (owner && owner.team !== team && team.presser) for (const [, t] of zones) {   // v0.8.2: one man presses - the rest screen the
        const dx = t.x - b.x, dy = t.y - b.y, d = len(dx, dy), R = 6.5;          // space, they don't stand on the ball (no clutter)
        if (d < R) { const ux = d > 0.01 ? dx / d : -team.side, uy = d > 0.01 ? dy / d : 0; t.x = b.x + ux * R; t.y = clamp(b.y + uy * R, 3, PITCH_W - 3); }
      }
      for (const [, t] of zones) for (const o of team.opp.players) {              // with the ball: get open (gfootball's repulsion);
        if (o.sentOff) continue; const R = team.inPoss ? AI.OPEN : AI.APART;         // without it: just don't stand on top of anyone
        const dx = t.x - o.x, dy = t.y - o.y, d = len(dx, dy); if (d >= R || d < 0.01) continue;
        t.y = clamp(t.y + (dy === 0 ? 1 : Math.sign(dy)) * (R - d) * 0.9, 3, PITCH_W - 3);
      }
      for (let pass = 0; pass < 2; pass++) {
        for (let i = 0; i < zones.length; i++) {
          const ti = zones[i][1];
          for (let j = i + 1; j < zones.length; j++) { const tj = zones[j][1], dx = tj.x - ti.x, dy = tj.y - ti.y, d = len(dx, dy);
            if (d > 0.01 && d < AI.SEP) { const k = (AI.SEP - d) / 2 / d; ti.x -= dx * k; ti.y -= dy * k; tj.x += dx * k; tj.y += dy * k; } }
          for (const f of fixed) { const dx = ti.x - f.x, dy = ti.y - f.y, d = len(dx, dy); if (d > 0.01 && d < AI.SEP) { const k = (AI.SEP - d) / d; ti.x += dx * k; ti.y += dy * k; } }
        }
      }
      for (const p of team.players) {
        if (p === this.human && team === this.home && !this.demo) continue;
        if (p.state === 'kick' || p.state === 'catch' || p.state === 'dive' || p.state === 'slide' || p.state === 'dheader' || p.state === 'chance' || p.state === 'celebrate' || p.state === 'tackle' || p.state === 'dejected' || p.state === 'roar' || p.state === 'beaten' || p.state === 'protest' || p.state === 'hurt' || p.state === 'blasted' || p.stun > 0) continue;
        if (p.keeper) { this.keeperAI(p, dt); continue; }
        if (owner === p) { this.carrierAI2(p, dt); continue; }
        if (p === aerial && len(p.x - rcv.x, p.y - rcv.y) < 12) {                // stay touch-tight, goal side, to contest it
          const pt = this.intercept(rcv, rcv.top(true, false)), gs = Math.sign(team.ownGoalX - pt.x) || 1;
          p.sprinting = true; p.moveTo(pt.x + gs * 0.6, pt.y, p.top(true, false), dt); continue;
        }
        if (!owner && b.target === p && b.last === team) {                       // the receiver of a pass runs onto it
          const far = len(b.x - p.x, b.y - p.y) > 8 && p.stamina > 0.3; p.sprinting = far;
          const v = p.top(far, false), pt = this.intercept(p, v); p.moveTo(pt.x, pt.y, v, dt); continue;
        }
        if (owner && owner.keeper && owner.hands && owner.team !== team && len(p.x - owner.x, p.y - owner.y) < 14) {   // their keeper has it: back off
          const dx = p.x - owner.x, dy = p.y - owner.y, d = len(dx, dy) || 1;
          p.moveTo(owner.x + dx / d * 15, clamp(owner.y + dy / d * 15, 3, 65), JOG, dt); continue;
        }
        if (p === team.presser && !(owner && owner.keeper && owner.hands)) {
          if (owner && owner.team !== team) { this.aiPress(p, team, owner, dt); continue; }
          if (!owner) { const d = len(b.x - p.x, b.y - p.y), go = d > 4 && p.stamina > 0.35; p.sprinting = go;   // a loose ball: go and get it
            const v = p.top(go, false), pt = this.intercept(p, v); p.moveTo(pt.x, pt.y, v, dt); continue; }
        }
        if (p === team.cover && owner && owner === this.human && !this.demo && p.cool <= 0) {   // v0.9.3 DOUBLE TEAM (HARD / RISE WARRIOR): the cover man
          const Y = this.dkY(team);                                                // steps in too when you're on top of him
          if (Y.dbl > 0 && len(b.x - p.x, b.y - p.y) < AI.REACH && Math.random() < dt * Y.dbl) { this.challenge(p, owner); continue; } }
        const t = tgt.get(p); if (!t) { p.steer(0, 0, dt); continue; }
        const d = len(t.x - p.x, t.y - p.y), dead = Math.max(0.8, 0.06 * len(b.x - p.x, b.y - p.y));
        const settled = (p.settledAt ?? -1e9) > this.time.now - 60;                // v0.8.7: settled men only move again once the spot is well away
        if (d < (settled ? dead * 1.8 : dead)) { p.settledAt = this.time.now; p.steer(0, 0, dt); if (p.speed < 0.4) p.look(b.x - p.x, b.y - p.y); continue; }   // in position: stand and watch the ball (BUG WATCH: no more step-stop-step fidgeting at the edge)
        const back = this.aiFrame(team, t.x) < this.aiFrame(team, p.x) - 4, hurry = back && d > 10;
        p.sprinting = hurry && d > 18 && p.stamina > 0.5;
        const cap = p.sprinting ? p.top(true, false) : hurry ? RUN : d > 14 ? RUN * 0.9 : JOG;
        p.moveTo(t.x, t.y, Math.min(cap, AI.ARRIVE * d + 0.4), dt);
      }
    }
  }
  carrierAI(p, dt) {
    const team = p.team, gx = team.goalX;
    p.think = (p.think || 0) - dt;
    const toGoal = len(gx - p.x, 34 - p.y);
    const dir = { x: team.side, y: clamp((34 - p.y) / 30, -0.6, 0.6) }; const dl = len(dir.x, dir.y);
    let near = 99; for (const o of team.opp.players) near = Math.min(near, len(o.x - p.x, o.y - p.y));
    const go = near > 7 && p.stamina > 0.55;                                     // open grass ahead: knock it on and sprint
    p.sprinting = go; const v = p.top(go, true) * 0.95;
    p.wantDir = { x: dir.x / dl, y: dir.y / dl };
    this.carrySteer(p, dir.x / dl, dir.y / dl, v, dt);
    if (p.think > 0) return;
    p.think = rnd(0.25, 0.45);
    // shooting: always from close in, often from the edge of the box, sometimes from range
    const central = Math.abs(p.y - 34) < 16 + Math.max(0, 18 - toGoal) * 0.3;
    if (central && toGoal < 24 && this.meterOf(team).level() >= (this.meterOf(team).level() === 3 ? 1 : 2) && Math.random() < 0.5 && this.special(p)) return;   // v0.7: the AI fires its specials too
    if (central && (toGoal < 18 || (toGoal < 24 && Math.random() < 0.7) || (toGoal < 28 && Math.random() < 0.25))) { this.doShot(p, rnd(0.45, 0.92), rnd(-1, 1)); return; }
    let pressure = 0; for (const o of team.opp.players) { const dx = (o.x - p.x) * team.side, d = len(o.x - p.x, o.y - p.y); if (d < 4 && dx > -1) pressure++; }
    const best = this.bestOption(p);
    if (best && ((pressure > 0 && Math.random() < 0.75) || (best.score > 1.2 && Math.random() < 0.35))) this.doPass(p, best.dir, best.mode);
  }
  // v0.8.2 ATTACK for the NEW team AI (Buckland's Simple Soccer + gfootball): SHOOT when there's a lane - how much of the
  // goal he can see, bodies in the way, where the keeper stands; PASS when he's pressed and someone's open, or a team-mate
  // has a better shot; otherwise DRIVE at goal - and a defender square in front gets TAKEN ON: a cut away from him + a burst.
  carrierAI2(p, dt) {
    const team = p.team, gx = team.goalX, side = team.side;
    p.think = (p.think || 0) - dt; p.takeT = (p.takeT || 0) - dt;
    const toGoal = len(gx - p.x, 34 - p.y);
    let front = null, fd = 99, near = 99;                                       // the man in his way (a cone ahead of him)
    for (const o of team.opp.players) { if (o.sentOff || o.keeper) continue;
      const ox = (o.x - p.x) * side, oy = o.y - p.y, d = len(ox, oy); near = Math.min(near, d);
      if (ox > -0.5 && d < 7 && Math.abs(oy) < ox * 1.2 + 1.5 && d < fd) { fd = d; front = o; } }
    let dx = side, dy = clamp((34 - p.y) / 30, -0.6, 0.6);
    if (front && fd < 6 && toGoal > 9) {                                         // take him on: cut away from him, not into the line
      if (p.takeT <= 0) { const lat = front.y - p.y, edge = p.y < 9 ? 1 : p.y > PITCH_W - 9 ? -1 : 0;
        p.takeSide = edge || (Math.abs(lat) > 0.5 ? -Math.sign(lat) : (Math.sign(34 - p.y) || 1)); p.takeT = rnd(0.9, 1.5); }
      const a = clamp((6 - fd) / 6, 0, 1) * 0.85; dx = side * Math.cos(a); dy = p.takeSide * Math.sin(a) + dy * 0.25;
      const KB = this.dk(team); if (fd < 3.2 && p.stamina > 0.35 && (p.burstCd || 0) <= this.time.now && Math.random() < dt * 2.5 * KB.burst) { p.burst = 0.5; p.burstCd = this.time.now + 1800 * KB.burstCd; }   // (v0.9.3: by level)
    }
    const go = (near > 7 || p.burst > 0) && p.stamina > 0.3;                    // open grass / beating his man: knock it on and sprint
    p.sprinting = go; const v = p.top(go, true) * 0.95, dl = len(dx, dy) || 1;
    p.wantDir = { x: dx / dl, y: dy / dl };
    this.carrySteer(p, dx / dl, dy / dl, v, dt, p.burst > 0 ? ACC * 1.35 : ACC);
    if (p.think > 0) return;
    const K = this.dk(team); p.think = rnd(0.2, 0.35) * K.think;                // v0.9.2 difficulty: how quickly he decides
    const central = Math.abs(p.y - 34) < 16 + Math.max(0, 18 - toGoal) * 0.3;
    if (central && toGoal < 24 && this.meterOf(team).level() >= (this.meterOf(team).level() === 3 ? 1 : 2) && Math.random() < 0.5 * K.sp && this.special(p)) return;   // v0.7: specials
    { const gko = team.opp.players[0];                                           // v0.9.2: a keeper rushing out at him - chip him (a smart side does it more)
      if (gko && !gko.sentOff && toGoal < 19) { const gH = (gko.x - team.opp.ownGoalX) * team.opp.side, gap = len(gko.x - p.x, gko.y - p.y);
        if (gH > K.chipOff && gap > 3 && gap < 12 && this.chipCan(p, { x: gx - p.x, y: 34 - p.y }) && Math.random() < (gap < 7 || gH > 7 ? 0.55 : 0.3) * K.chip) { this.chipShot(p, clamp((gap - 3) / 8, 0, 1) * 0.6, 0); return; } } }   // (Easy chips too early and rarely; Rise only when he's well off his line)
    const sh = toGoal < 32 ? this.shotLook(team, p.x, p.y) : { q: 0, aim: 0 }, Q = K.shotQ;   // (v0.9.2: a weaker side needs a better look before it shoots, and shoots less)
    const want = (sh.q > 0.85 + Q ? 0.9 : sh.q > 0.6 + Q ? (toGoal < 20 ? 0.6 : 0.3) : sh.q > 0.42 + Q ? (toGoal < 26 ? 0.12 : 0.04) : 0) * K.shotWant;
    if (want && Math.random() < want) {
      const pw = toGoal < 14 ? rnd(0.5, 0.72) : toGoal < 22 ? rnd(0.62, 0.84) : rnd(0.76, 0.9);
      this.doShot(p, pw, clamp(sh.aim + rnd(-0.15, 0.15), -1, 1)); return;
    }
    const pressed = front && fd < 3.2, best = this.passLook(p);                // (only a pass a defender can't get to - Buckland)
    if (best && best.risk < (pressed ? Math.max(K.risk, 0.6) : K.risk) && ((pressed && best.score > -0.4 && Math.random() < 0.8) || (best.shot > sh.q + 0.25 && best.score > 0.6 && Math.random() < 0.6) || (best.score > 1.4 && Math.random() < 0.3))) this.doPass(p, best.dir, best.mode, best.q);
  }
  // ======================================================================= v0.9.2 CHIP SHOT (Luca 23 Oct 15:39: "Lob in the box with the POV of
  // the attacker looking at the goal becomes a chip, if the attacker points POV away from the goal it becomes a normal
  // lob. Chips should be faster with a more aggressive curve, not just the lob mechanic into a goal"). In their box,
  // facing within ~60 degrees of the goal: LOB = CHIP. Tap = a quick dink just over the keeper; hold = more height (for a
  // keeper further out). The ball flies fast and low-arced, then dips hard after its peak (CHIP_DIP) to come down under
  // the bar - the solver picks the FASTEST flight that clears his reach. EA FC: "a chip works best when the keeper has
  // left his line or is rushing out" - against a keeper on his line it's an easy catch.
  chipCan(p, dir) {
    if (!CHIP_ON && !window.__lab) return false;                                // (waiting for the PixelLab chip animation)
    const gx = p.team.goalX; if (!(Math.abs(p.x - gx) < 16.5 && Math.abs(p.y - 34) < 20.16)) return false;   // in their penalty area
    const gxv = gx - p.x, gyv = 34 - p.y, gl = len(gxv, gyv) || 1, dl = len(dir.x, dir.y) || 1;
    return (dir.x * gxv + dir.y * gyv) / (dl * gl) > 0.5;                        // looking at the goal (within ~60 degrees)
  }
  chipShot(p, c, aimY) {
    const gx = p.team.goalX, s = p.team.side, gk = p.team.opp.players[0];
    const ay = Math.abs(aimY) > 0.2 ? aimY : gk && !gk.sentOff ? (gk.y > 34 ? -0.55 : 0.55) : 0;   // no aim: away from the keeper
    const err = rnd(-1, 1) * (0.25 + (p.sprinting ? 0.5 : 0) + (p.tired ? 0.4 : 0)) * (p === this.human && !this.demo ? 1 : this.dk(p.team).shotErr);
    const ty = clamp(34 + ay * 2.3 + err, GOAL_Y0 + 0.3, GOAL_Y1 - 0.3);
    this.kick(p, gx + s * 1.5, ty, 0, 0, 0.12, { shot: true, chip: true, chipC: clamp(c, 0, 1), power: 0.45, chipErr: err });
    if (p.kickAnim !== 'chip') p.kickAnim = MAN.kits[p.kit].anims[`pass-${DIRS[p.face]}`] ? 'pass' : 'kick';   // (a kit without the PixelLab chip: the pass frames)
    this.ramiSay('skill', { text: ['A CHIP!\nCHEEKY!', 'OH, THE DINK!\nOVER THE TOP!', 'HE TRIES TO\nCHIP HIM!'][Math.floor(Math.random() * 3)], expr: 'laugh' }, 2);
  }
  // the chip's flight: from the ball to (tx, ty) on the goal line - fast as it can be while clearing the keeper's reach
  // (2.7 m + more with a longer hold) where he stands, then dropping to ~1.3-1.7 m as it crosses the line
  chipSolve(b, tx, ty, team, c) {
    const gk = team.opp.players[0], dx = tx - b.x, dy = ty - b.y, d = len(dx, dy) || 1, ux = dx / d, uy = dy / d, h = 1 / 120;
    const off = gk && !gk.sentOff ? (gk.x - team.opp.ownGoalX) * team.opp.side : 0;   // (a keeper on his line can't be chipped - the ball has nowhere to drop)
    const along = off > 3.5 ? (gk.x - b.x) * ux + (gk.y - b.y) * uy : -1, reachZ = 2.8 + c * 0.8, minPeak = 2.4 + c * 0.9, zg = clamp(1.3 + c * 0.4 + (Math.random() - 0.5) * 0.3, 0.9, 2.1);
    const fly = (v, vz) => { const q = { x: 0, y: 0, z: Math.max(b.z, 0.05), vx: v, vy: 0, vz, skid: true, rollV: 0, chip: true }; let atK = null;
      for (let t = 0; t < 3; t += h) { const ox = q.x; ballStep(q, h, false); if (atK == null && along > 0 && q.x >= along) atK = q.z; if (q.x >= d - 1.5) return { z: q.z, atK, peak: q.peak }; if (q.z <= 0 && t > 0.05) return { z: -1, atK }; q.peak = Math.max(q.peak || 0, q.z); }
      return { z: -1, atK }; };
    let best = null;
    for (let T = 0.42; T <= 1.6 && !best; T += 0.06) {
      const v = (d - 1.5) / T * 1.06; let lo = 0.5, hi = 22, r = null;
      for (let i = 0; i < 18; i++) { const mid = (lo + hi) / 2, f = fly(v, mid); if (f.z < 0 || f.z < zg) lo = mid; else { hi = mid; r = { vz: mid, f }; } }
      if (r && (r.f.peak || 0) >= minPeak && (along < 1.5 || r.f.atK == null || r.f.atK >= reachZ)) best = { speed: v, vz: r.vz };   // (a chip always goes up - even if he's on his line, when it's simply an easy catch)
    }
    return best || { speed: (d - 1.5) / 1.6 * 1.06, vz: 9 };                       // (keeper right on top of him: a high one and hope)
  }
  // how good a shot is from (x, y): the goal angle he can see x a clear lane x the gap to the keeper; best aim -1..1
  shotLook(team, x, y) {
    const gx = team.goalX, k = team.opp.players[0], dxg = Math.abs(gx - x) || 0.1;
    const ang = Math.abs(Math.atan2(34 + 3.66 - y, dxg) - Math.atan2(34 - 3.66 - y, dxg));
    let best = { q: 0, aim: 0 };
    for (const aim of [-0.9, -0.45, 0, 0.45, 0.9]) {
      const lx = gx - x, ly = 34 + aim * 2.8 - y, ll2 = lx * lx + ly * ly, ll = Math.sqrt(ll2); let block = 0;
      for (const o of team.opp.players) { if (o.sentOff || o.keeper) continue;
        const t = ((o.x - x) * lx + (o.y - y) * ly) / ll2; if (t < 0.03 || t > 0.97) continue;
        const lat = Math.abs((o.x - x) * ly - (o.y - y) * lx) / ll; if (lat < 1.1) block += 1 - lat / 1.1; }
      let gk = 3; if (k && !k.sentOff) { const t = clamp((k.x - x) / (lx || 1e-6), 0, 1); gk = Math.abs(y + ly * t - k.y); }
      const q = Math.min(1.4, ang * 2.2) * Math.max(0, 1 - block) * (0.55 + 0.45 * Math.min(1, gk / 2.4));
      if (q > best.q) best = { q, aim };
    }
    return best;
  }
  // every team-mate as a pass, each way it can be played (to feet / through into space / lobbed), and the safest one:
  // risk = defenders who can reach the line before the ball (Buckland's isPassSafeFromAllOpponents) + defenders who win
  // the race to where it arrives. score = forward progress + his own shot from there - risk - distance
  passLook(p) {
    const team = p.team, side = team.side, opp = team.opp.players.filter(o => !o.sentOff); let best = null;
    const race = (pt, Tb) => { let r = 0; for (const o of opp) { const to = 0.3 + Math.max(0, len(o.x - pt.x, o.y - pt.y) - 1.0) / 6.5; if (to < Tb + 0.2) r += clamp((Tb + 0.2 - to) / 0.5, 0, 1); } return r; };
    const lane = (pt, d, T) => { let r = 0; const dx = pt.x - p.x, dy = pt.y - p.y;
      for (const o of opp) { const t = ((o.x - p.x) * dx + (o.y - p.y) * dy) / (d * d); if (t < 0.02 || t > 1.0) continue;
        const lat = Math.abs((o.x - p.x) * dy - (o.y - p.y) * dx) / d, tb = 0.15 + t * (T - 0.15), to = 0.25 + Math.max(0, lat - 0.9) / 5.5;
        if (to < tb) r += clamp((tb - to) / 0.3, 0, 1); } return r; };
    for (const q of team.players) {
      if (q === p || q.keeper || q.sentOff || q.stun > 0) continue;
      const d0 = len(q.x - p.x, q.y - p.y); if (d0 < 5 || d0 > 40) continue;
      const lt = d0 / 14 * 0.6, feet = { x: q.x + q.vx * lt, y: q.y + q.vy * lt }, opts = [];   // (doPass leads him a little)
      { const d = len(feet.x - p.x, feet.y - p.y), T = passTime(d) + 0.15; opts.push({ mode: 'ground', pt: feet, d, risk: lane(feet, d, T) + race(feet, T) * 0.5 }); }
      if (q.speed > 2 && q.vx * side > 1) {                                       // through: into the space in front of a runner
        const pt = { x: clamp(q.x + side * 8, 2, PITCH_L - 2), y: clamp(q.y + (34 - q.y) * 0.12 + q.vy * 0.6, 2, PITCH_W - 2) }, d = len(pt.x - p.x, pt.y - p.y);
        const T = passTime(d) * 1.3 + 0.15, tq = len(pt.x - q.x, pt.y - q.y) / Math.max(5, q.top(true, false));
        opts.push({ mode: 'through', pt, d, risk: lane(pt, d, T) + race(pt, Math.max(T, tq)) * 0.8 });
      }
      if (d0 > 14) { const T = clamp(0.7 + d0 / 25, 0.9, 1.9) + 0.2; opts.push({ mode: 'lob', pt: feet, d: d0, risk: race(feet, T) + 0.25 }); }   // over a blocked lane
      const o = opts.sort((u, v) => u.risk - v.risk)[0];
      let open = 8; for (const e of opp) open = Math.min(open, len(e.x - o.pt.x, e.y - o.pt.y));
      const progress = (o.pt.x - p.x) * side, sh = len(team.goalX - o.pt.x, 34 - o.pt.y) < 30 ? this.shotLook(team, o.pt.x, o.pt.y).q : 0;
      const score = progress / 14 + Math.min(open, 7) / 6 + sh * 1.2 - o.risk * 1.6 - o.d / 45;
      if (!best || score > best.score) best = { q, score, mode: o.mode, shot: sh, risk: o.risk, dir: { x: (q.x - p.x) / d0, y: (q.y - p.y) / d0 } };
    }
    return best;
  }
  // Buckland's SUPPORT SPOT: one team-mate goes to the best spot near the ball - open, a safe pass away, and a shot from there
  aiSupport(team, owner) {
    const cand = team.players.filter(q => q.i >= 5 && q !== owner && q !== team.runner && this.aiFree(q) && q !== (team === this.home && !this.demo ? this.human : null));
    const sup = cand.sort((u, v) => len(u.x - owner.x, u.y - owner.y) - len(v.x - owner.x, v.y - owner.y))[0];
    team.support = sup || null; team.supportPt = null; if (!sup) return;
    let best = null; const side = team.side, lim = team.offX != null ? this.aiWorld(team, Math.max(team.offX, this.aiFrame(team, owner.x)) - 0.6) : null;
    for (const r of [10, 14, 19]) for (let a = -100; a <= 100; a += 25) {
      const ra = a * Math.PI / 180, x = owner.x + side * Math.cos(ra) * r, y = owner.y + Math.sin(ra) * r;
      if (x < 3 || x > PITCH_L - 3 || y < 3 || y > PITCH_W - 3 || (lim != null && (x - lim) * side > 0)) continue;
      let open = 8, safe = 1;
      for (const o of team.opp.players) { if (o.sentOff) continue; open = Math.min(open, len(o.x - x, o.y - y));
        const t = ((o.x - owner.x) * (x - owner.x) + (o.y - owner.y) * (y - owner.y)) / (r * r);
        if (t > 0.05 && t < 1) { const lat = Math.abs((o.x - owner.x) * (y - owner.y) - (o.y - owner.y) * (x - owner.x)) / r; if (lat < 1.5 + t * 2) safe = 0; } }
      const sh = len(team.goalX - x, 34 - y) < 28 ? this.shotLook(team, x, y).q : 0;
      const sc = Math.min(open, 7) / 2.5 + safe * 2 + sh * 2 + (x - owner.x) * side * 0.04 - len(x - sup.x, y - sup.y) * 0.03;
      if (!best || sc > best.sc) best = { x, y, sc };
    }
    if (best) team.supportPt = { x: best.x, y: best.y };
  }
  // the AI looks at every team-mate: forward progress + how open he is - opponents in the lane - distance
  bestOption(p) {
    const team = p.team; let best = null;
    for (const q of team.players) {
      if (q === p || q.keeper) continue;
      const dx = q.x - p.x, dy = q.y - p.y, d = len(dx, dy); if (d < 5 || d > 45) continue;
      let open = 8, lane = 0;
      for (const o of team.opp.players) {
        open = Math.min(open, len(o.x - q.x, o.y - q.y));
        const t = ((o.x - p.x) * dx + (o.y - p.y) * dy) / (d * d);
        if (t > 0.08 && t < 0.95) { const lat = Math.abs((o.x - p.x) * dy - (o.y - p.y) * dx) / d; if (lat < 2.2) lane += (2.2 - lat); }
      }
      const progress = (q.x - p.x) * team.side;
      const mode = lane > 1.5 && d > 15 ? 'lob' : (open > 6 && progress > 5 && q.speed > 2 ? 'through' : 'ground');
      const score = progress / 15 + open / 4 - lane * (mode === 'lob' ? 0.15 : 0.8) - d / 40;
      if (!best || score > best.score) best = { q, score, mode, dir: { x: dx / d, y: dy / d } };
    }
    return best;
  }
  keeperOutlet(k) {                                                               // the freest team-mate for a throw / roll-out
    let best = null;
    for (const q of k.team.players.slice(1)) {
      if (q.sentOff) continue;
      const d = len(q.x - k.x, q.y - k.y); if (d < 6 || d > 45) continue;
      const free = Math.min(...k.team.opp.players.filter(o => !o.sentOff).map(o => len(o.x - q.x, o.y - q.y)));
      const sc = Math.min(free, 10) - d / 12 + rnd(0, 1.5);
      if (!best || sc > best.sc) best = { q, d, sc };
    }
    if (!best) return { dir: { x: k.team.side, y: 0 }, mode: 'lob' };
    const dx = best.q.x - k.x, dy = best.q.y - k.y, l = len(dx, dy);
    return { dir: { x: dx / l, y: dy / l }, mode: best.d > 22 ? 'lob' : 'ground' };
  }
  // ======================================================================= v0.9.1 KEEPER AI (Luca 23 Oct 14:56: "move gk ai dev to
  // top priority we need to test it + include walking up etc when needed"). Built on goalkeeping coaching:
  //  - ANGLE: on the line that halves the angle between the ball and the two posts (the bisector), deeper as the ball
  //    comes closer (6 m away ~2 m off his line, 25-30 m away ~5 m) - keeperstop.com "how far off the line".
  //  - SWEEPER: with the ball far away he walks up to the top of his box and beyond, ~18 m behind his last defender -
  //    FIFA's World Cup 2022 analysis: keepers averaged 13 m off their line and 20 m behind the defensive line, higher
  //    when their team has the ball in the final third.
  //  - SWEEP: a ball played into the space behind his defence that he reaches first: he comes for it (feet outside the box).
  //  - 1v1 (RUSH): an attacker through on goal with nobody goal-side: he comes out on the ball line, then within ~3.5 m
  //    he stops and sets low to block; a heavy touch he can reach first, he smothers - FIFA session "defending the goal
  //    or the space" (within ~3 m drop low and smother; a good touch = hold your position).
  //  - SET: a shot is coming (an attacker on the ball within ~25 m): small steps, then still in his ready stance.
  //  - BACK: a lob / ball over his head while he's up: he runs back to his line.
  // He walks when nothing is on, jogs to get back into place, runs only when it's urgent. k.gkMode / k.gkTgt = what he is
  // doing (the Lab draws it).
  keeperAI(k, dt) {
    const b = this.ball, side = k.team.side, gx = k.team.ownGoalX, lineX = gx + side * 1.3;
    k.gkSet = false;
    if (b.owner === k) {
      k.gkMode = 'BALL'; k.gkTgt = null;
      if (!k.hands) {                                                          // ball at his feet: pass it out quickly - or clear it under pressure
        k.steer(0, 0, dt); k.hold = (k.hold || 0) + dt;
        if (k.hold > 0.6) { k.hold = 0;
          const press = k.team.opp.players.some(o => !o.sentOff && len(o.x - k.x, o.y - k.y) < 7);
          if (press) this.doPass(k, { x: side, y: clamp((k.y - 34) / 20, -0.7, 0.7) }, 'lob');
          else { const o = this.keeperOutlet(k); this.doPass(k, o.dir, o.mode === 'lob' && o.dir ? 'lob' : 'ground'); } }
        return;
      }
      k.hold = (k.hold || 0) + dt; k.steer(0, 0, dt);
      if (k.hold > 1.1) { k.hold = 0; const o = this.keeperOutlet(k); this.doPass(k, o.dir, o.mode); }
      return;
    }
    const sv = !b.owner && b.save && b.save.gk === k && len(b.vx, b.vy) > 3.5 && b.vx * -side > 0 ? b.save : null;   // (v0.9.1: a shot that's died or been knocked away isn't one any more - he goes for the loose ball)
    if (sv) {                                                                   // a shot at him: set, step across or dive
      k.gkMode = 'SHOT'; k.gkTgt = { x: k.x, y: sv.y };
      const age = sv.t0 + 0.6 - sv.t, left = sv.t0 - age, dy = sv.y - k.y;
      if (age < sv.react) { k.steer(0, 0, dt); return; }                       // he plants his feet while he reads it
      if (!sv.act) {
        if (sv.off && Math.abs(dy) > 0.8) sv.act = 'leave';
        else if (Math.abs(dy) < 0.45) sv.act = 'set';
        else if (Math.abs(dy) < 1.3 && left > 0.4) sv.act = 'step';
        else {
          sv.act = 'dive';
          // fly so the ball meets his hands (0.4 m past his centre) as it arrives; the air slows him a little
          const fly = clamp(left, 0.2, 0.5), v = Math.min(GK_DIVE_V, Math.max(0, Math.abs(dy) - 0.4) / (fly * (1 - 0.2 * fly)));
          k.setState('dive', 0.85); k.diveLen = 0.85; k.diveFly = fly + 0.08; k.diveDir = Math.sign(dy); k.diveZ = clamp(sv.z, 0.2, 2.1);
          k.vx = 0; k.vy = k.diveDir * v; k.diveAnim = diveAnimFor(k, dy > 0);
          return;
        }
      }
      if (sv.act === 'leave') { k.steer(0, 0, dt); return; }
      k.moveTo(k.x, sv.y, 6.5, dt); return;
    }
    if (!b.owner && this.path && (b.z > 0.6 || b.vz > 2) && !(b.save && b.save.gk === k)) {     // a cross into his area: come and claim it
      // he reads the flight first (no instant rush), and outside his six-yard box he only comes if he clearly beats the attackers
      if ((b.airT || 0) > 0.22 || k.claiming) {
        const pt = this.path.find(q => q.z < 2.5 && q.z > 0.3 && Math.abs(q.x - gx) < 7.5 && Math.abs(q.y - 34) < 10);
        const mine = pt && 0.15 + len(pt.x - k.x, pt.y - k.y) / 6.5 <= pt.t + 0.25;
        const six = pt && pt.z > 1.0 && Math.abs(pt.x - gx) < 5.5 && Math.abs(pt.y - 34) < 9.2;      // in the air in his six-yard box: his ball
        const beaten = pt && !six && k.team.opp.players.some(o => !o.keeper && !o.sentOff && 0.12 + len(pt.x - o.x, pt.y - o.y) / 7 < 0.15 + len(pt.x - k.x, pt.y - k.y) / 6.5 + 0.1);
        if (mine && (six || !beaten || k.claiming)) { k.claiming = true; k.gkMode = 'CLAIM'; k.gkTgt = { x: pt.x, y: pt.y }; k.moveTo(pt.x, pt.y, 6.5, dt); return; }
      }
    }
    const toward = (b.vx * -side) > 4;
    if (!b.owner && toward && !b.save && Math.abs(k.x - lineX) < 2.5) {        // a pass or loose ball across his goal mouth: where does it cross his line?
      const t = (lineX - b.x) / b.vx;
      if (t > 0 && t < 1.4) {
        const cy = clamp(b.y + b.vy * t, GOAL_Y0 - 0.5, GOAL_Y1 + 0.5);
        if (Math.abs(cy - k.y) > 1.6 && t < 0.6 && k.state !== 'dive') {
          k.setState('dive', 0.7); const down = cy > k.y; k.vx = 0; k.vy = (cy - k.y) / 0.45;
          k.diveAnim = diveAnimFor(k, down); k.gkMode = 'DIVE';
          return;
        }
        if (t < 1.0 && Math.abs(b.y - 34) < 12) { k.gkMode = 'CUT'; k.gkTgt = { x: lineX, y: cy }; k.moveTo(lineX, cy, 6, dt); return; }
      }
    }
    // everything else: where he should stand, and how fast to get there
    const T = this.gkPlan(k, dt); k.gkMode = T.mode;
    const urgent = T.mode === 'SWEEP' || T.mode === 'SMOTHER' || T.mode === 'RUSH' || T.mode === 'BACK';
    if (urgent || !k.gkS) k.gkS = { x: T.x, y: T.y };                            // positioning targets ease, so he doesn't twitch with every touch
    else { const a = 1 - Math.exp(-dt * 4); k.gkS.x += (T.x - k.gkS.x) * a; k.gkS.y += (T.y - k.gkS.y) * a; }
    k.gkTgt = { x: k.gkS.x, y: k.gkS.y, set: T.set };
    const D = len(k.gkS.x - k.x, k.gkS.y - k.y);
    if (T.v <= 0 || (!urgent && D < (k.speed > 0.4 ? 0.2 : 0.45))) { k.steer(0, 0, dt); }   // (a dead band: no shuffling on the spot)
    else k.moveTo(k.gkS.x, k.gkS.y, T.v, dt);
    k.gkSet = !!T.set && k.speed < 0.7;
  }
  // v0.9.2 the AI knobs for a side: the computer's side plays at your difficulty, yours at NORMAL (the self-play trainer
  // sets window.__diffTeams to play any two trait sets against each other)
  dk(team) {
    const o = window.__diffTeams, s = team === this.home ? 'home' : 'away';
    if (o && o[s]) return o[s].K || (o[s].K = diffKnobs(o[s]));
    return diffK(!this.demo && team !== this.home ? DIFF_LEVEL : 'base');            // (v0.9.3: your side plays at the old NORMAL = base)
  }
  // v0.9.3 the level's edges v YOU (DIFF_YOU) for a side: the computer's side at your level, yours / the demo at base
  dkY(team) {
    const o = window.__diffTeams, s = team === this.home ? 'home' : 'away';
    if (o && o[s]) return DIFF_YOU[o[s].lvl] || DIFF_YOU.base;
    return DIFF_YOU[!this.demo && team !== this.home ? DIFF_LEVEL : 'base'] || DIFF_YOU.base;
  }
  // the keeper's plan: { mode, x, y, v (top speed for getting there), set (in his ready stance) }
  gkPlan(k, dt) {
    const b = this.ball, side = k.team.side, gx = k.team.ownGoalX, own = k.team, opp = own.opp;
    const H = x => (x - gx) * side;                                                // height: metres out from his goal line
    const bh = H(b.x), bd = len(b.x - gx, b.y - 34);
    const defs = own.players.filter(p => !p.keeper && !p.sentOff), atk = opp.players.filter(p => !p.keeper && !p.sentOff);
    const lastH = defs.length ? Math.min(...defs.map(p => H(p.x))) : 30;          // his defensive line (the deepest outfield man)
    const carrier = b.owner && b.owner.team === opp ? b.owner : null, ours = b.owner && b.owner.team === own;
    const KD = this.dk(own), kv = 6.6 * KD.gkSpd, react = 0.15 + KD.gkReact;
    // BACK: a high ball dropping behind him while he's off his line
    if (!b.owner && H(k.x) > 5 && b.z > 1.6 && b.vx * -side > 3 && this.path) {
      const land = this.path.find(q => q.z < 2.2 && H(q.x) < H(k.x));
      if (land && H(land.x) > -1 && Math.abs(land.y - 34) < 9) { const g = this.gkBisector(land.x, land.y, gx, side, 1.2); return { mode: 'BACK', x: g.x, y: g.y, v: kv }; }
    }
    // SWEEP / SMOTHER: a loose ball he gets to first (behind his defence, or a heavy touch in a 1v1)
    if (!b.owner && this.path && !(b.z > 1.2 && bh < 7)) {
      const toGoal = b.vx * -side > -1 || len(b.vx, b.vy) < 2;                       // (not a ball running away from his goal)
      for (const pt of this.path) {
        if (pt.z > 1.0 || !toGoal) continue;
        const ph = H(pt.x); if (ph < -0.5 || ph > 26 || Math.abs(pt.y - 34) > 22) continue;
        const me = react + len(pt.x - k.x, pt.y - k.y) / kv;
        if (me > pt.t + 0.05) continue;                                            // he can't be there in time for this point
        const them = Math.min(9, ...atk.map(o => 0.12 + len(pt.x - o.x, pt.y - o.y) / SPRINT));
        const mates = Math.min(9, ...defs.map(o => 0.12 + len(pt.x - o.x, pt.y - o.y) / SPRINT));
        if (me < them - 0.12 && (mates > me + 0.3 || ph < 5.5)) { const out = ph > 16.5 || Math.abs(pt.y - 34) > 20.2;
          return { mode: k.gkMode === 'SWEEP' || k.gkMode === 'SMOTHER' ? k.gkMode : out ? 'SWEEP' : 'SMOTHER', x: pt.x, y: pt.y, v: kv }; }   // (the label sticks while he goes for it)
        break;                                                                     // (the first point he reaches decides it)
      }
    }
    // 1v1: an attacker on the ball with nobody between him and the goal
    if (!carrier) k.rushT = 0;
    if (carrier) {
      const ch = H(carrier.x), cd = len(carrier.x - gx, carrier.y - 34);
      const cover = defs.some(p => H(p.x) < ch - 0.3 && len(p.x - carrier.x, p.y - carrier.y) < 9 && Math.abs((p.y - 34) - (carrier.y - 34) * H(p.x) / Math.max(ch, 1)) < 3.5);
      const coming = ((gx - carrier.x) * carrier.vx + (34 - carrier.y) * carrier.vy) / (cd || 1) > 1.5;   // running at goal (a striker standing on the ball: he sets instead)
      if (!cover && ch > 2 && cd < 30 && Math.abs(carrier.y - 34) < 20 && (coming || (k.rushT > 0 && cd < 14))) {   // (once out, he doesn't turn back when the dribbler slows)
        const ux = (carrier.x - gx) / (cd || 1), uy = (carrier.y - 34) / (cd || 1), gap = len(carrier.x - k.x, carrier.y - k.y);
        const out = clamp(cd - 4.5, 2.0, 14);                                      // meet him ~4-5 m in front of him on the ball line
        const tx = gx + ux * out, ty = 34 + uy * out;
        if (gap < 5.2) return { mode: 'BLOCK', x: k.x + (tx - k.x) * 0.3, y: k.y + (ty - k.y) * 0.3, v: gap > 3.2 ? 1.6 : 0, set: true };   // close: small steps, then still, low and big
        k.rushT = (k.rushT || 0) + dt;
        return { mode: 'RUSH', x: tx, y: ty, v: gap > 10 ? kv : 3.2, set: false };
      }
      k.rushT = 0;
    }
    // ANGLE + SWEEPER: stand on the angle's bisector at a depth set by how close the ball is; with the ball far away,
    // walk up behind the defence (top of the box and beyond)
    const depth = clamp(1.2 + bd * 0.14, 1.2, 5.2);
    const g = bh > 0.8 ? this.gkBisector(b.x, b.y, gx, side, depth) : { x: gx + side * 1.0, y: b.y < 34 ? GOAL_Y0 + 0.6 : GOAL_Y1 - 0.6 };   // (ball by the byline: his near post)
    let sh = clamp(lastH - 18, 8, 17) + (ours && bh > 60 ? 3 : 0);                // how far up he walks with the ball far away
    sh = Math.min(sh, Math.max(6, lastH - 6), 21);                                 // (always behind his last man)
    const w = clamp((bh - 30) / 22, 0, 1), sy = 34 + (b.y - 34) * 0.18;
    if (KD.gkPos > 0 && (!k.gkN || this.time.now > k.gkN.t)) k.gkN = { x: rnd(-1, 1) * KD.gkPos, y: rnd(-1, 1) * KD.gkPos * 0.7, t: this.time.now + rnd(1500, 3000) };   // v0.9.2: a weaker keeper stands a bit off
    const nx = KD.gkPos > 0 && k.gkN ? k.gkN.x : 0, ny = KD.gkPos > 0 && k.gkN ? k.gkN.y : 0;
    const tx = g.x + (gx + side * sh - g.x) * w + nx * side * 0.5, ty = g.y + (sy - g.y) * w + ny;
    const threat = carrier && len(carrier.x - gx, carrier.y - 34) < 32;
    const cdC = carrier ? len(carrier.x - gx, carrier.y - 34) : 99, breaking = carrier && cdC < 55 && ((gx - carrier.x) * carrier.vx + (34 - carrier.y) * carrier.vy) / (cdC || 1) > 2.5;   // they're running at his goal
    const shot = carrier && len(carrier.x - gx, carrier.y - 34) < 25 && Math.abs(carrier.y - 34) < 18;   // a shot could come any moment
    const D = len(tx - k.x, ty - k.y);
    const v = threat || breaking ? (D > 2.5 ? 5.4 : 2.6) : (D > 6 ? JOG : 1.9);    // walk when nothing is on; jog back into place; run when they break
    return { mode: w > 0.5 ? (ours ? 'UP' : 'SWEEPER') : shot ? 'SET' : 'ANGLE', x: tx, y: ty, v, set: !!shot && D < 0.8 };
  }
  // a point on the bisector of the angle between the ball and his two posts, `depth` m out from his goal line
  gkBisector(bx, by, gx, side, depth) {
    const p1 = { x: gx, y: GOAL_Y0 }, p2 = { x: gx, y: GOAL_Y1 };
    const l1 = len(p1.x - bx, p1.y - by) || 1, l2 = len(p2.x - bx, p2.y - by) || 1;
    let ux = (p1.x - bx) / l1 + (p2.x - bx) / l2, uy = (p1.y - by) / l1 + (p2.y - by) / l2; const ul = len(ux, uy) || 1; ux /= ul; uy /= ul;
    const bh = (bx - gx) * side, k = ux * side < -0.05 ? (bh - depth) / (-ux * side) : 0;   // from the ball, along the bisector, to that depth
    return { x: gx + side * Math.max(0.6, Math.min(depth, bh)), y: clamp(by + uy * k, GOAL_Y0 - 0.4, GOAL_Y1 + 0.4) };
  }

  ballPhysics(dt) {
    const b = this.ball; if (b.owner && b.owner.hands) return;
    const owned = !!b.owner, sub = 3, h = dt / sub;
    for (let i = 0; i < sub; i++) {
      const ox = b.x;
      ballStep(b, h, owned);
      if (!owned) this.posts(b, ox);
      if (this.dead) {                                                          // out of play: the boards stop it
        if (b.x < -4 || b.x > PITCH_L + 4) { b.x = clamp(b.x, -4, PITCH_L + 4); b.vx *= -0.25; }
        if (b.y < -3 || b.y > PITCH_W + 3) { b.y = clamp(b.y, -3, PITCH_W + 3); b.vy *= -0.25; }
      }
      if (b.inNet) { const right = b.netRight ?? (b.netRight = b.x > 52.5); const lo = right ? PITCH_L + 0.2 : -1.4, hi = right ? PITCH_L + 1.4 : -0.2;
        if (b.x < lo || b.x > hi) { b.x = clamp(b.x, lo, hi); b.vx *= -0.12; b.vy *= 0.7; b.vz *= 0.5; }       // back net: it gives and drops
        if (b.y < GOAL_Y0 + 0.2 || b.y > GOAL_Y1 - 0.2) { b.y = clamp(b.y, GOAL_Y0 + 0.2, GOAL_Y1 - 0.2); b.vy *= -0.2; }
        if (b.z > 2.2) { b.z = 2.2; b.vz = -Math.abs(b.vz) * 0.2; } b.vy *= 0.97; }
    }
    b.roll += len(b.vx, b.vy) * dt * (b.skid ? 0.6 : 1);                       // a skidding ball turns less
  }
  posts(b, ox) {
    for (const gx of [0, PITCH_L]) {
      if ((ox - gx) * (b.x - gx) > 0 || b.inNet) continue;          // didn't cross this goal line
      for (const py of [GOAL_Y0, GOAL_Y1]) {
        if (Math.abs(b.y - py) < 0.18 && b.z < BAR_Z + 0.1) { b.vx = -b.vx * 0.6; b.x = ox; this.say('', 'OFF THE POST!', 0.9); this.flagReplay('OFF THE POST!'); SFX.post(); SFX.ooh(); return; }
      }
      if (b.y > GOAL_Y0 && b.y < GOAL_Y1 && Math.abs(b.z - BAR_Z) < 0.15) { b.vz = -Math.abs(b.vz) * 0.6; b.vx *= -0.4; b.x = ox; this.say('', 'OFF THE BAR!', 0.9); this.flagReplay('OFF THE BAR!'); SFX.post(); SFX.ooh(); }
    }
  }
  // dribbling: the ball is NOT glued to the foot. The carrier touches it ahead, it rolls (and slows), he catches
  // up and touches it again. Faster running = bigger touches = easier to nick. Standing still = ball at the feet.
  dribble(p, dt) {
    const b = this.ball;
    if (p.hands && p.state === 'dive') { b.x = p.x; b.y = p.y + (p.diveDir || 0) * 0.6; b.z = Math.max(0.15, (p.diveZ ?? 0.6) * clamp(p.stateT / 0.45, 0, 1)); b.vx = b.vy = b.vz = 0; return; }
    if (p.hands) { b.x = p.x + dirVec(p.face).x * 0.25; b.y = p.y; b.z = 1.1; b.vx = b.vy = b.vz = 0; return; }
    // v0.8.1 DRIBBLE (Luca: "when you have the ball you don't move so smoothly"): like FIFA / PES the ball rides just
    // in front of his boot and he knocks it on in rhythm with his stride - short quick touches when he's slow, longer
    // ones at a sprint (that's when it can be nicked). The ball eases after him, it never snaps; he turns in arcs.
    const rx = b.x - p.x, ry = b.y - p.y, dist = len(rx, ry);
    if (dist > 2.6) { b.owner = null; b.target = null; return; }                // too heavy a touch: it's a loose ball now
    if (p.state === 'kick') return;                                              // let it roll into the swing
    const sp = p.speed, want = p.wantDir;
    const dir = sp > 0.6 ? { x: p.vx / sp, y: p.vy / sp } : (want || dirVec(p.face));
    p.touchT -= dt;
    if (sp > 0.6 && p.touchT <= 0) { p.touchT = clamp(0.5 - sp * 0.035, 0.24, 0.45); p.touchPush = (p.sprinting ? 0.6 : 0.2) + sp * 0.02; }
    p.touchPush = (p.touchPush || 0) * Math.exp(-dt * 5);
    const lead = (sp < 0.6 ? 0.5 : clamp(0.42 + sp * 0.04, 0.45, 0.75)) + p.touchPush;
    const tx = p.x + dir.x * lead, ty = p.y + dir.y * lead * 0.84;               // (in front of the boot, like at kick-off)
    const k = sp < 0.6 ? 9 : 7;
    b.vx = p.vx + (tx - b.x) * k; b.vy = p.vy + (ty - b.y) * k; b.skid = false; if (b.z <= 0) b.vz = 0;
  }
  // the carrier runs where you point, turning in an arc (tighter when he's slower); only an about-turn stops him first.
  // If the ball got away from him (a knock, a deflection) he goes and gets it.
  carrySteer(p, dx, dy, v, dt, acc = ACC) {
    const b = this.ball, rx = b.x - p.x, ry = b.y - p.y, d = len(rx, ry);
    if (b.owner === p && !p.hands && d >= 1.7) { p.steer(rx / d * v, ry / d * v, dt, acc); return; }
    const sp = p.speed, dl = len(dx, dy) || 1;
    if (sp < 1.0) { p.steer(dx / dl * v, dy / dl * v, dt, acc); return; }
    const cur = Math.atan2(p.vy, p.vx); let da = Math.atan2(dy, dx) - cur;
    while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
    if (Math.abs(da) > 2.4) { p.steer(dx / dl * v, dy / dl * v, dt, acc); return; }   // drag-back: plant and go the other way
    const rate = (sp < 3 ? 9 : sp < 5.6 ? 6 : 4.2) * dt, na = cur + clamp(da, -rate, rate);
    const tv = v * (1 - 0.22 * Math.min(1, Math.abs(da) / 2.4)), ns = sp + clamp(tv - sp, -DEC * 0.45 * dt, acc * dt);
    p.vx = Math.cos(na) * ns; p.vy = Math.sin(na) * ns;
  }
  pickups(pbx = this.ball.x) {
    const b = this.ball; if (b.inNet || this.dead) return;                      // nobody plays a dead ball
    const sp = len(b.vx, b.vy);
    if (b.owner) {                                                               // a loose touch can be nicked
      const o = b.owner; if (o.hands) return;
      const od = len(o.x - b.x, o.y - b.y); if (od < 0.85) return;
      for (const p of o.team.opp.players) {
        if (p.cool > 0 || p.stun > 0 || p.state === 'slide') continue;
        const d = len(p.x - b.x, p.y - b.y); if (d < 0.7 && b.z < 0.8 && d < od) { this.gain(p, sp); return; }
      }
      return;
    }
    let best = null, bd = 1e9, hit = null, viaChest = false;
    for (const p of this.all) {
      if (p.sentOff) continue;
      const d = len(p.x - b.x, p.y - b.y);
      if (b.special && !p.keeper && b.spTeam && p.team !== b.spTeam && d < 0.9 && b.z < 1.9 && p.pierced !== b.spT && p.state !== 'slide') {   // v0.8.6 a special meets a defender (even one stood watching it)
        const sv = len(b.vx, b.vy) || 1, lat = Math.abs(((p.x - b.x) * b.vy - (p.y - b.y) * b.vx) / sv);   // how far off the ball's line he stands
        if (lat < 0.8) { p.pierced = b.spT;
          if (b.pierce > 0) { this.pierce(p); continue; }
          if (lat < 0.55) { b.special = 0; b.spP = 0; hit = p; continue; }     // square in front: blocked, deflected off him
        }
      }
      if (p.cool > 0 || p.stun > 0 || p.state === 'slide') { if (!(p.keeper && p.spSave && (b.special || b.saveable))) continue; }
      const box = p.keeper && Math.abs(p.x - p.team.ownGoalX) < 16.5 && Math.abs(p.y - 34) < 20.2;
      const reach = box ? 1.3 : (b.target === p && b.last === p.team ? 1.25 : 0.8), zmax = box ? 2.6 : 0.9;   // v0.7: the man you passed to reaches for it
      if (p.keeper && p.spSave && ((b.special && b.spTeam && p.team !== b.spTeam) || (!b.special && b.saveable && b.saveable !== p.team))) {   // v0.8.6 SPECIAL SAVE v SPECIAL SHOT, on his line (v0.9.0: or v a normal shot)
        if (!((pbx - p.x) * (b.x - p.x) <= 0 || Math.abs(b.x - p.x) < 0.3)) continue;
        if (Math.abs(b.y - 34) > 4.3 || b.z > 3.2) { p.spSave = 0; continue; }   // off target: nothing to save
        const K = SAVE_POWER[p.spSave - 1], ok = this.clash(p);
        if (!ok) { this.guardBreak(p); continue; }
        p.y = clamp(b.y, 30.6, 37.4); p.vx = p.vy = 0;
        if ((b.spP || 0) < K * 0.8) { b.special = 0; best = p; bd = 0; viaChest = false; break; }   // held
        const rel = b.y - 34 || rnd(-1, 1);                                        // fisted away
        b.vx = -b.vx * 0.2 + p.team.side * rnd(3, 5); b.vy = Math.sign(rel) * rnd(5, 9); b.vz = rnd(3, 5); b.z = Math.max(b.z, 0.4);
        b.skid = true; b.rollV = 0; b.last = p.team; b.save = null; b.target = null; b.special = 0; b.spP = 0; p.cool = 0.5;
        if (MAN.kits[p.kit].anims['punch-S']) p.setState('punch', 0.45);
        this.flagReplay('WHAT A SAVE!', p); this.shotSaved(p); return;
      }
      if (b.save && b.save.gk === p) {                                           // a shot at this keeper: his body and gloves decide
        const hit = this.keeperTouch(p, pbx);
        if (!hit) continue;                                                       // not at him yet - or it beat him
        // v0.8 KEEPER GUARD: power shots (held K) and specials wear him down; one that hits harder than what he has left goes through
        const dmg = b.special ? (GUARD_SP[b.special] || 0.5) * clamp((b.spP || SP_POWER[b.special - 1]) / SP_POWER[b.special - 1], 0.3, 1) : (b.power > 0.72 ? GUARD_POWER : 0);   // v0.8.6: a weakened special hits him less
        if (dmg) {
          const g = p.guard ?? 1;
          if (dmg > g + 1e-6) { this.guardBreak(p); continue; }
          p.guard = g - dmg; p.guardT = 0; if (p.guard < GUARD_POWER) this.say('', 'THE KEEPER IS RATTLED!', 0.9);
        }
        if (hit === 'catch') { if ((p.state === 'dive' && len(b.vx, b.vy) > 20) || len(b.vx, b.vy) > 28) this.flagReplay('WHAT A SAVE!', p); best = p; bd = 0; viaChest = false; break; }
        const rel = b.y - p.y || rnd(-1, 1), spd = len(b.vx, b.vy);               // parried: pushed wide, off the line
        b.vx = -b.vx * 0.22 + p.team.side * rnd(2, 4); b.vy = Math.sign(rel) * rnd(4, 8) + b.vy * 0.15; b.vz = rnd(1.5, 4) + (b.z > 1.6 ? 2 : 0);
        b.z = Math.max(b.z, 0.3); b.skid = true; b.rollV = 0; b.last = p.team; b.save = null; b.target = null; p.cool = 0.5;
        if (b.z > 1.5 && p.state !== 'dive' && MAN.kits[p.kit].anims['punch-S']) p.setState('punch', 0.45);   // fists it away
        if (b.special >= 2) {                                                     // v0.7: a big special knocks him flat (PixelLab 'blasted back')
          if (MAN.kits[p.kit].anims['blasted-E']) { p.setState('blasted', 1.3); p.stun = 1.3; p.face = p.team.side > 0 ? 0 : 4; p.vx = p.team.side * -2.5; p.vy = 0; }
          else if (p.state !== 'dive') { p.setState('fall', 0.7); p.vx = -b.vx * 0.05; } }
        b.special = 0;
        this.say(spd > 24 ? 'WHAT A SAVE!' : '', 'PARRIED!', 0.8); if ((p.state === 'dive' && spd > 20) || spd > 28) this.flagReplay('WHAT A SAVE!', p); this.shotSaved(p); return;
      }
      const smax = box ? 40 : (b.target === p ? 26 : 17);                       // the intended receiver can take a firm ball
      // chest / thigh control of a dropping ball (headers come with the v0.2 animations)
      const chest = !box && b.z >= zmax && b.z < 1.7 && d < 0.8 && (b.target === p ? sp < 16 : sp < 9);
      if (chest && d < bd) { bd = d; best = p; viaChest = true; continue; }
      if (d < reach && b.z < zmax) { if (sp < smax) { if (d < bd) { bd = d; best = p; } } else if (d < 0.55 && !hit) hit = p; }
      else if (d < 0.5 && b.z < 1.9 && !hit) hit = p;                            // the ball hits his body / head
    }
    if (best && viaChest && b.z > 0.9 && best.team.opp.players.some(o => !o.keeper && o.stun <= 0 && len(o.x - best.x, o.y - best.y) < 1.0) && Math.random() < 0.5) {
      hit = best; best = null; hit.stun = 0.25;                                  // challenged in the air: it runs loose
    }
    if (best) { const ivx = b.vx, ivy = b.vy; this.gain(best, sp); if (viaChest && !best.hands) { best.setState('trap', 0.32); best.face = dirIndex(-ivx || best.team.side, -ivy); } }
    else if (hit) {                                                              // deflection: no more balls passing through people
      const d = len(b.x - hit.x, b.y - hit.y) || 0.01, nx = (b.x - hit.x) / d, ny = (b.y - hit.y) / d, vn = b.vx * nx + b.vy * ny;
      if (vn < 0) { b.vx -= 1.4 * vn * nx; b.vy -= 1.4 * vn * ny; }
      b.vx *= 0.6; b.vy *= 0.6; b.vz = Math.abs(b.vz) * 0.3 + 0.6; b.z = Math.max(b.z, 0.05);
      b.skid = true; b.rollV = 0; hit.cool = 0.25; b.last = hit.team; b.target = null;
    }
  }
  // does the shot meet the keeper? Standing: his body plus arms. Diving: his stretched body in the direction he flew,
  // at the height he went for. Returns 'catch', 'parry' or null (not level with him yet, or past his hands).
  keeperTouch(p, pbx) {
    const b = this.ball;
    if (!((pbx - p.x) * (b.x - p.x) <= 0 || Math.abs(b.x - p.x) < 0.4)) return null;
    const rel = b.y - p.y, spd = len(b.vx, b.vy, b.vz), diving = p.state === 'dive';
    let touch;
    if (diving) {
      const along = rel * (p.diveDir || 1), zc = p.diveZ ?? 0.8, out = GK_REACH - Math.max(0, b.z - 1.7) * 0.6;
      touch = along > -0.35 && along < out && b.z < Math.max(zc + 0.9, 1.1) && b.z > zc - 1.0 && b.z < 2.75;
    } else touch = Math.abs(rel) < (b.z > 0.7 && b.z < 2.3 ? 0.85 : 0.55) && b.z < 2.6;           // arms up and a little hop
    if (!touch) return null;
    const clean = diving ? (spd < 17 && Math.abs(rel) < 0.8 && b.z < 1.9) : (spd < 24 && b.z < 2.1);
    return clean ? 'catch' : 'parry';
  }
  // v0.8.6 a special BLOWS THROUGH a defender: he's thrown down, the ball goes on (a bit weaker, a bit slower)
  pierce(p) {
    const b = this.ball, lv = b.special, sp = len(b.vx, b.vy) || 1;
    b.pierce--; b.spP *= 1 - SP_PIERCE_LOSS[lv - 1];
    const k = 1 - SP_PIERCE_LOSS[lv - 1] * 0.5; b.vx *= k; b.vy *= k;
    const KA = MAN.kits[p.kit].anims;
    if (KA['blasted-E']) { p.setState('blasted', 1.1); p.face = b.vx > 0 ? 4 : 0; } else p.setState('fall', 0.9);
    p.stun = 1.1; p.cool = 1.1; p.vx = b.vx / sp * 3.2; p.vy = b.vy / sp * 3.2;
    this.hitStop = Math.max(this.hitStop || 0, 0.06); this.cameras.main.shake(140, 0.008); SFX.boom(0.7);
    this.say('', `THROUGH HIM! · ${Math.round(b.spP)} POWER LEFT`, 0.9);
  }
  // v0.8.6 SPECIAL SAVE: a special is on its way - the defending side can spend its bars on the keeper.
  // You: a SAVE! prompt for a moment, press SPECIAL. The computer: uses its bars if it has them (most of the time).
  saveCall(def) {
    const mt = this.meterOf(def), gk = def.players[0]; if (!gk || gk.sentOff) return;
    gk.spSave = 0;
    if (mt.level() < 1) return;
    if (def === this.home && !this.demo) { this.saveAsk = { team: def, t: 0.75 }; this.say('', `SPECIAL SAVE! PRESS ${keyset().special}`, 0.75); return; }
    if (Math.random() < 0.8) { gk.spSave = mt.spend(); this.saveFx(gk); }
  }
  saveFx(gk) {
    const lv = gk.spSave; if (!lv) return;
    this.say(SAVE_NAMES[lv - 1] + '!', `${gk.team.name} KEEPER · LV${lv} SAVE`, 1.1); SFX.special(lv);
    this.ramiSay('save', { text: [`THE KEEPER ANSWERS!\n${SAVE_NAMES[0]}!`, `${SAVE_NAMES[1]}!\nHE IS READY FOR IT!`, `THE ${SAVE_NAMES[2]}!!\nPOWER AGAINST POWER!`][lv - 1], expr: 'shock' }, 3);
    if (!window.HC2_TEST_FAST && !this.replay) this.cutInQ = { kind: 'save', who: gk, lv };   // v0.8.9 the special-save cut scene (after the shot's hit-stop)
  }
  // ---------- v0.8.9 SPECIAL SAVE CUT SCENE (rough): everything stops for ~1.5 s - the screen darkens, a band in the level's
  // colour sweeps in with speed lines, the keeper (a PixelLab frame, 2.6x) slides in with flames behind him, the save's
  // name slams in, then it all sweeps out and play goes on. ENTER skips it. Screen-fixed, whatever the camera zoom.
  cutInBuild(q) {
    const lv = clamp(q.lv, 1, 3), gk = q.who, col = RIG_COL[lv - 1], F = '"Press Start 2P"', D = 9.7e6, K = MAN.kits[gk.kit], o = [];
    const add = x => { o.push(x); x.setScrollFactor(0); return x; };
    const veil = add(this.add.rectangle(0, 0, VIEW_W * 3, VIEW_H * 3, 0x0c0a0e, 1).setOrigin(0.5).setAlpha(0).setDepth(D));
    const band = add(this.add.graphics().setDepth(D + 1)), lines = add(this.add.graphics().setDepth(D + 2));
    const fr = (K.anims['kroar-S'] && K.anims['kroar-S'][3]) || (K.anims['kset-S'] && K.anims['kset-S'][4]) || K.anims['idle-S'][0];
    const fl = this.textures.exists('fx') ? [0, 1, 2].map(i => add(this.add.image(0, 0, 'fx', ['flame', 'flameBlue', 'flamePurple'][lv - 1]).setDepth(D + 3).setAlpha(0))) : [];
    const por = add(this.add.image(0, 0, gk.kit, fr).setOrigin(0.5, K.feetY / (K.frameH || 160)).setDepth(D + 4));
    const name = add(this.add.text(0, 0, SAVE_NAMES[lv - 1] + '!', { fontFamily: F, fontSize: '34px', color: '#ffde1e', stroke: '#0c0a0e', strokeThickness: 8 }).setOrigin(0.5).setDepth(D + 5).setAlpha(0));
    const sub = add(this.add.text(0, 0, `${gk.team.name} KEEPER · LV${lv} SPECIAL SAVE`, { fontFamily: F, fontSize: '12px', color: '#ffffff', stroke: '#0c0a0e', strokeThickness: 5 }).setOrigin(0.5).setDepth(D + 5).setAlpha(0));
    SFX.special(lv); this.cameras.main.shake(160, 0.004);
    const hush = SAVE_NAMES.some(n => (this.msg.text || '').includes(n)); if (hush) { this.msg.setText(''); this.sub.setText(''); }   // (the banner says it: no second caption)
    return { ...q, lv, col, t: 0, dur: 1.5, o, veil, band, lines, por, fl, name, sub, seed: Math.random() * 1000 };
  }
  cutInTick(dt) {
    const c = this.cutIn; c.t += dt; const t = c.t, W = VIEW_W, H = VIEW_H, z = this.cameras.main.zoom || 1, cx = W / 2, cy = H / 2;
    const at = (obj, x, y, sc = 1) => obj.setPosition(cx + (x - cx) / z, cy + (y - cy) / z).setScale(sc / z);   // screen point -> what this zoom needs
    const io = clamp(t / 0.2, 0, 1), ein = 1 - Math.pow(1 - io, 3), ko = clamp((t - (c.dur - 0.3)) / 0.3, 0, 1), eout = ko * ko;
    c.veil.setPosition(cx, cy).setScale(1 / z).setAlpha(0.62 * io * (1 - ko));
    const bx = (1 - ein) * W * 1.1 - eout * W * 1.2;                               // the band: in from the right, out to the left
    c.band.clear().setPosition(cx * (1 - 1 / z), cy * (1 - 1 / z)).setScale(1 / z);
    c.band.fillStyle(c.col, 1).fillPoints([{ x: bx, y: H * 0.31 }, { x: bx + W, y: H * 0.23 }, { x: bx + W, y: H * 0.73 }, { x: bx, y: H * 0.81 }], true);
    c.band.fillStyle(0xffde1e, 1).fillPoints([{ x: bx, y: H * 0.29 }, { x: bx + W, y: H * 0.21 }, { x: bx + W, y: H * 0.23 }, { x: bx, y: H * 0.31 }], true)
      .fillPoints([{ x: bx, y: H * 0.81 }, { x: bx + W, y: H * 0.73 }, { x: bx + W, y: H * 0.75 }, { x: bx, y: H * 0.83 }], true);
    c.lines.clear().setPosition(cx * (1 - 1 / z), cy * (1 - 1 / z)).setScale(1 / z).lineStyle(2, 0xffffff, 0.55 * io * (1 - ko));
    for (let i = 0; i < 16; i++) { const yy = H * (0.27 + ((i * 0.618 + c.seed) % 1) * 0.5), len = 80 + ((i * 97) % 200), xx = W + 150 - ((t * 2200 + i * 173 + c.seed) % (W + 400));
      c.lines.lineBetween(xx, yy, xx + len, yy - len * 0.08); }
    const shake = t > 0.2 && t < c.dur - 0.3 ? Math.sin(t * 70) * 2 : 0;
    const px = -160 + (W * 0.3 + 160) * ein - eout * W * 0.7 + shake, py = H * 0.86;
    at(c.por, px, py, 2.6);
    c.fl.forEach((f, i) => { at(f, px + (i - 1) * 70, py - 150 - (i === 1 ? 40 : 0), (3.2 + Math.sin(t * 18 + i * 2) * 0.3) * (i === 1 ? 1.35 : 1)); f.setAlpha(0.85 * io * (1 - ko)).setFlipX(i === 2); });   // flames behind him
    const ti = clamp((t - 0.15) / 0.12, 0, 1);
    at(c.name, W * 0.66 - eout * W * 0.8, H * 0.46, 1 + (1 - ti) * 1.4); c.name.setAlpha(ti * (1 - ko));
    at(c.sub, W * 0.66 - eout * W * 0.8, H * 0.6, 1); c.sub.setAlpha(clamp((t - 0.3) / 0.15, 0, 1) * (1 - ko));
    if (t >= c.dur || (t > 0.35 && Input.pressed('start'))) this.cutInEnd();
  }
  cutInEnd() { const c = this.cutIn; if (!c) return; for (const x of c.o) x.destroy(); this.cutIn = null; this.anims.globalTimeScale = 1; }
  // v0.9.0 (Luca: "Teams should be able to use their Iron Wall-like special abilities to also block normal shots (K). Only
  // goalkeepers, no defenders can use defensive special abilities, yet.") A normal shot on target: the defending side
  // can spend its bars on a keeper special save - a sure stop. You: the SAVE prompt (only with a bar in the bank). The
  // computer: only on a shot its keeper wouldn't reach, about half the time. Defenders never get one (keepers only).
  shotSaveCall(def, shooters, pen) {
    const b = this.ball, s = b.save, mt = this.meterOf(def), gk = def.players[0];
    if (!gk || gk.sentOff || pen || b.special || !s || s.gk !== gk || s.off || gk.spSave || mt.level() < 1) return;
    b.saveable = shooters;
    if (def === this.home && !this.demo) { this.saveAsk = { team: def, t: 0.75, normal: true }; this.say('', `SPECIAL SAVE? PRESS ${keyset().special}`, 0.75); return; }
    if (s.dy > s.cover * 0.95 && Math.random() < 0.55 * this.dk(def).gkSave) { gk.spSave = mt.spend(); this.saveFx(gk); }   // he'd be beaten: answer it
  }
  // the clash at the keeper: true = saved
  clash(gk) {
    const b = this.ball, lv = gk.spSave || 0; gk.spSave = 0; if (!lv || !(b.special || b.saveable)) return null;
    const norm = !b.special; b.saveable = null;                                   // v0.9.0: a special save always stops a normal shot
    const K = SAVE_POWER[lv - 1], P = norm ? 0 : b.spP || SP_POWER[b.special - 1], ok = norm || Math.random() < saveChance(K, P);
    this.cameras.main.flash(140, 255, 240, 160); this.hitStop = Math.max(this.hitStop || 0, 0.12); SFX.boom(1);
    if (ok && RIGS['save' + lv]) { gk.face = gk.team.side > 0 ? 0 : 4; gk.rig = { n: 'save' + lv, t: 0, d: gk.team.side > 0 ? 'E' : 'W' }; }   // v0.8.9 rough save rig
    if (ok) this.say('SAVED!', norm ? `${SAVE_NAMES[lv - 1]} STOPS THE SHOT` : `${SAVE_NAMES[lv - 1]} ${K} v ${Math.round(P)} ${SP_NAMES[b.special - 1]}`, 1.4);
    else this.say('IT BREAKS THROUGH!', `${SP_NAMES[b.special - 1]} ${Math.round(P)} v ${K} ${SAVE_NAMES[lv - 1]}`, 1.4);
    return ok;
  }
  // a shot that missed or got saved: the shooter can't believe it (batch 7 'big chance missed', facing the camera)
  missedChance(team, how = 'wide') {
    const s = this.ball.shotBy; this.ball.shotBy = null;
    if (s && s.team === team && how === 'wide') this.ramiSay('miss');
    if (!s || s.team !== team || s.busy() || s.sentOff || !MAN.kits[s.kit].anims['chance-S']) return;
    this.time.delayedCall(250, () => { if (!s.busy()) { s.setState('chance', 1.5); s.vx = s.vy = 0; } });
  }
  // ---------- HAGUE CUP (v0.7.2): all six teams, two groups of three, the group winners meet in the final.
  // Your matches are played; the other matches are simulated. A level final goes to penalties (you vs the computer).
  cupStart(you) {
    if (this.replay) { this.replay.after = null; this.endReplay(); } this.goalQ = null;   // v0.8.3: the demo's replay ate the first ENTER
    const o = Object.keys(TEAMS).filter(t => t !== you).sort(() => Math.random() - 0.5);
    const A = [you, o[0], o[1]], B = [o[2], o[3], o[4]];
    const tbl = {}; for (const t of [...A, ...B]) tbl[t] = { p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 };
    this.cup = { you, groups: [A, B], table: tbl, results: [], stage: 'group', champion: null,
      fixtures: [[A[0], A[1]], [B[0], B[1]], [B[1], B[2]], [A[0], A[2]], [B[2], B[0]], [A[1], A[2]]], idx: 0, final: null };
    this.cupNext();
  }
  cupSim(h, a) { const pois = l => { let L = Math.exp(-l), k = 0, p = 1; do { k++; p *= Math.random(); } while (p > L); return k - 1; }; return [pois(1.35), pois(1.25)]; }
  cupRecord(h, a, gh, ga, pens) {
    const c = this.cup; c.results.push({ h, a, gh, ga, pens, stage: c.stage });
    if (c.stage === 'group') {
      const T = c.table, H = T[h], A = T[a]; H.p++; A.p++; H.gf += gh; H.ga += ga; A.gf += ga; A.ga += gh;
      if (gh > ga) { H.w++; A.l++; H.pts += 3; } else if (gh < ga) { A.w++; H.l++; A.pts += 3; } else { H.d++; A.d++; H.pts++; A.pts++; }
    } else c.champion = pens ? (pens === 1 ? h : a) : (gh > ga ? h : a);
  }
  cupOrder(g) { const T = this.cup.table; return [...g].sort((x, y) => (T[y].pts - T[x].pts) || ((T[y].gf - T[y].ga) - (T[x].gf - T[x].ga)) || (T[y].gf - T[x].gf) || (Math.random() - 0.5)); }
  cupNext() {
    const c = this.cup;
    while (c.stage === 'group' && c.idx < c.fixtures.length && !c.fixtures[c.idx].includes(c.you)) { const [h, a] = c.fixtures[c.idx++]; const [gh, ga] = this.cupSim(h, a); this.cupRecord(h, a, gh, ga); }
    if (c.stage === 'group' && c.idx >= c.fixtures.length) { c.stage = 'final'; c.final = [this.cupOrder(c.groups[0])[0], this.cupOrder(c.groups[1])[0]]; }
    if (c.stage === 'final' && !c.champion && !c.final.includes(c.you)) {          // you didn't make it: the final is simulated
      const [h, a] = c.final; let [gh, ga] = this.cupSim(h, a); this.cupRecord(h, a, gh, ga, gh === ga ? (Math.random() < 0.5 ? 1 : 2) : 0);
    }
    this.cupShow();
  }
  cupShow() {
    const c = this.cup; this.cupScreen = true; this.cupLive = false; this.paused = true;
    let el = document.getElementById('cup'); if (!el) { el = document.createElement('div'); el.id = 'cup'; document.body.appendChild(el); }
    const row = t => { const r = c.table[t]; return `<tr class="${t === c.you ? 'you' : ''}"><td>${t}</td><td>${r.p}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td><td>${r.gf - r.ga > 0 ? '+' : ''}${r.gf - r.ga}</td><td><b>${r.pts}</b></td></tr>`; };
    const grp = (g, n) => `<table><caption>GROUP ${n}</caption><tr><th></th><th>P</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>PTS</th></tr>${this.cupOrder(g).map(row).join('')}</table>`;
    const res = c.results.map(r => `<li class="${r.h === c.you || r.a === c.you ? 'you' : ''}">${r.stage === 'final' ? 'FINAL: ' : ''}${r.h} ${r.gh}-${r.ga} ${r.a}${r.pens ? ` (${r.pens === 1 ? r.h : r.a} ON PENS)` : ''}</li>`).join('');
    const nxt = c.stage === 'group' ? c.fixtures[c.idx] : c.final;
    let head, btn;
    if (c.champion) { head = c.champion === c.you ? `CHAMPIONS! ${c.you} WIN THE HAGUE CUP` : `${c.champion} WIN THE HAGUE CUP`; btn = 'NEW CUP &#9654;';
      if (!c.toldRami) { c.toldRami = true; this.ramiSay('full_time', { text: c.champion === c.you ? `${c.you} ARE THE CHAMPIONS!\nTHE HAGUE CUP IS THEIRS!` : `${c.champion} LIFT THE CUP!\nNEXT YEAR, ${c.you}!`, expr: 'laugh' }, 3); SFX.roar(5, 1); } }
    else { head = c.stage === 'final' ? `THE FINAL: ${nxt[0]} vs ${nxt[1]}` : `GROUP STAGE · NEXT: ${nxt[0]} vs ${nxt[1]}`; btn = `PLAY ${c.stage === 'final' ? 'THE FINAL' : 'MATCH'} &#9654;`; }
    el.innerHTML = `<style>#cup{position:fixed;inset:0;z-index:6;display:flex;flex-direction:column;align-items:center;justify-content:safe center;gap:12px;overflow-y:auto;padding:16px;
      background:rgba(12,10,14,.78);color:#f4f0e4;font:10px/1.8 "Press Start 2P",monospace;text-align:center}
      #cup h2{margin:0;font-size:14px;background:#ffde1e;color:#0c0a0e;padding:10px 14px;border:3px solid #0c0a0e;box-shadow:4px 4px 0 #0c0a0e}
      #cup .g{display:flex;flex-wrap:wrap;gap:14px;justify-content:center} #cup table{border-collapse:collapse;background:#1d1a22;border:3px solid #0c0a0e;box-shadow:4px 4px 0 #0c0a0e}
      #cup caption{color:#28c8e6;padding:4px} #cup td,#cup th{padding:3px 7px;text-align:right} #cup td:first-child{text-align:left} #cup tr.you td{color:#ffde1e}
      #cup ul{list-style:none;margin:0;padding:0;max-width:560px} #cup li.you{color:#ffde1e}
      #cup button{font:13px "Press Start 2P",monospace;background:#ff2878;color:#fff;padding:12px 16px;border:3px solid #0c0a0e;box-shadow:4px 4px 0 #0c0a0e;cursor:pointer}
      #cup small{font-size:8px;opacity:.8}
      #cup .tro{position:relative;width:300px;max-width:100%;height:150px;display:flex;justify-content:center;align-items:flex-end}
      #cup .tro img{image-rendering:pixelated}
      #cup .tro .cup{width:132px;filter:drop-shadow(4px 4px 0 #0c0a0e);animation:tro 1.2s ease-in-out infinite alternate}
      #cup .tro .fw{position:absolute;width:96px;opacity:0;animation:fw 1.6s ease-out infinite}
      #cup .tro .a{left:0;top:0} #cup .tro .b{right:0;top:10px;animation-delay:.55s} #cup .tro .c{left:100px;top:-20px;animation-delay:1.1s}
      @keyframes tro{from{transform:translateY(0) rotate(-3deg)}to{transform:translateY(-8px) rotate(3deg)}}
      @keyframes fw{0%{opacity:0;transform:scale(.3)}25%{opacity:1}100%{opacity:0;transform:scale(1.25)}}
      @media (prefers-reduced-motion:reduce){#cup .tro .cup,#cup .tro .fw{animation:none;opacity:1}}</style>
      ${c.champion && MAN.fx && MAN.fx.includes('trophy') ? `<div class="tro">${c.champion === c.you ? '<img class="fw a" src="assets/hud/fwGold.png" alt=""><img class="fw b" src="assets/hud/fwPink.png" alt=""><img class="fw c" src="assets/hud/confetti.png" alt="">' : ''}<img class="cup" src="assets/hud/trophy.png" alt="The Hague Cup trophy"></div>` : ''}
      <h2>${head}</h2><div class="g">${grp(c.groups[0], 'A')}${grp(c.groups[1], 'B')}</div>
      ${res ? `<ul>${res}</ul>` : '<small>TWO GROUPS OF THREE · WIN YOUR GROUP TO REACH THE FINAL · A LEVEL FINAL GOES TO PENALTIES</small>'}
      <button type="button" id="cup-go">${btn}</button><small>ENTER = ${btn.replace(' &#9654;', '')}</small>`;
    el.hidden = false; el.style.display = 'flex';
    document.getElementById('cup-go').onclick = () => this.cupPlay();
  }
  cupPlay() {
    if (!this.cupScreen) return;
    const c = this.cup, el = document.getElementById('cup');
    if (c.champion) { if (el) el.remove(); this.cupScreen = false; this.cupStart(c.you); return; }   // NEW CUP
    const [h, a] = c.stage === 'group' ? c.fixtures[c.idx] : c.final, you = h === c.you ? h : a, opp = h === c.you ? a : h;
    if (el) el.style.display = 'none'; this.cupScreen = false;
    this.setTeams(you, opp, () => { this.paused = false; this.cupLive = true; this.cupPens = false; this.so = null; this.freeze = Math.max(this.freeze, 0.8);
      this.say(c.stage === 'final' ? 'THE FINAL' : 'HAGUE CUP', `${you} vs ${opp}`, 2); this.preMatch(); });
  }
  cupResult() {
    const c = this.cup; if (!c) return;
    const gh = this.home.score, ga = this.away.score, so = this.so && this.so.done ? this.so : null;
    const pens = so ? (so.winner === 0 ? 1 : 2) : 0;
    const [h, a] = c.stage === 'group' ? c.fixtures[c.idx] : c.final;
    const homeIsYou = h === c.you, rh = homeIsYou ? gh : ga, ra = homeIsYou ? ga : gh;
    const rp = pens ? ((pens === 1) === homeIsYou ? 1 : 2) : 0;
    this.cupRecord(h, a, rh, ra, rp); if (c.stage === 'group') c.idx++;
    this.cupLive = false; this.so = null; this.over = false; this.msg.setText(''); this.sub.setText(''); this.scene.stop('penalty'); this.penaltyMode = false;
    if (c.champion && (c.champion === this.home.name || c.champion === this.away.name)) { this.cupCeremony(c.champion); return; }   // v0.7.4: the trophy is lifted on the pitch first
    this.cupNext();
  }
  // v0.7.4 TROPHY CEREMONY: the winning captain lifts the PixelLab trophy at the centre spot, his team-mates go wild behind
  // him, the beaten finalists slump, fireworks + confetti (PixelLab) go off over the stadium. ENTER -> the cup table.
  cupCeremony(champ) {
    const win = this.home.name === champ ? this.home : this.away, lose = win === this.home ? this.away : this.home, b = this.ball;
    this.ceremony = { t: 0, fw: 0, win }; this.over = true; this.paused = false; this.freeze = 0; this.setPiece = null; this.pending = null;
    const outs = win.players.filter(p => !p.sentOff), cap = outs.find(p => p.num === 10 && !p.keeper) || outs.find(p => !p.keeper), rest = outs.filter(p => p !== cap);
    const KA = MAN.kits[cap.kit].anims, party = ['celeb4', 'celebrate', 'applaud', 'jump'].filter(a => KA[`${a}-S`]);
    for (const p of this.all) { p.vx = p.vy = 0; p.speed = 0; p.hands = false; p.stun = 0; p.state = 'idle'; p.anim = ''; }
    cap.x = 52.5; cap.y = 38.6; cap.face = 6; cap.state = 'trophy'; cap.stateT = 999;
    rest.forEach((p, i) => { const k = i - (rest.length - 1) / 2; p.x = 52.5 + k * 2.5 + rnd(-0.3, 0.3); p.y = 36 - Math.abs(k) * 0.2 + (i % 2) * 0.8; p.face = 6;
      p.state = 'party'; p.stateT = 999; p.partyAnim = party[i % party.length]; p.partyFps = 8 + (i % 3); });
    lose.players.forEach((p, i) => { if (p.sentOff) return; p.x = i < 6 ? 40.5 - i * 1.9 : 64.5 + (i - 6) * 1.9; p.y = 40.5 + (i % 3) * 1.1; p.face = 6;
      if (MAN.kits[p.kit].anims['dejected-S']) { p.state = 'dejected'; p.stateT = 999; } });
    if (this.ref) { this.ref.x = 61; this.ref.y = 43; this.ref.vx = this.ref.vy = 0; this.ref.state = 'idle'; this.ref.t = 0; this.ref.face = 6; }
    b.owner = null; b.x = 52.5; b.y = 34.5; b.z = 0; b.vx = b.vy = b.vz = 0; b.inNet = false; this.camX = this.camY = undefined;
    { const X0 = wx(52.5, 34.5), Y0 = wy(34.5);                                 // the floodlights dim so the fireworks pop
      this.cerDim = this.add.rectangle(X0, Y0, VIEW_W * 4, VIEW_H * 4, 0x0c0a0e, 1).setAlpha(0).setDepth(-2e5);
      this.tweens.add({ targets: this.cerDim, alpha: 0.5, duration: 1400, delay: 600 }); }
    this.say('CHAMPIONS!', `${champ} WIN THE HAGUE CUP`, 99999);
    this.ramiSay('full_time', { text: `${champ} LIFT THE HAGUE CUP!\nWHAT A NIGHT AT KLEINE LOO!`, expr: 'laugh' }, 3);
    if (this.cup) this.cup.toldRami = true;
    SFX.roar(6, 1); SFX.whistle(3, true);
  }
  ceremonyTick(dt) {
    const c = this.ceremony; c.t += dt; c.fw -= dt;
    this.ballSpr.setVisible(false); this.ballSh.setVisible(false); this.cursor.setAlpha(0); this.power.clear(); this.ring.clear();
    if (c.t > 2.5 && !c.hint) { c.hint = true; this.sub.setText(`${c.win.name} WIN THE HAGUE CUP · ENTER`); }
    if (c.fw <= 0 && this.textures.exists('fx')) {                               // PixelLab fireworks, confetti, streamers over the stands
      c.fw = rnd(0.16, 0.34);
      const T = this.textures.get('fx'), pick = ['fwGold', 'fwPink', 'confetti', 'sparkle', 'streamers', 'fwGold'].filter(n => T.has(n));
      if (pick.length) {
        const V = this.cameras.main.worldView, nm = pick[Math.floor(Math.random() * pick.length)];
        const im = this.add.image(V.x + rnd(60, V.width - 60), V.y + rnd(70, nm === 'confetti' || nm === 'streamers' ? 320 : 230), 'fx', nm).setDepth(9e6).setScale(0.5).setAlpha(1);
        this.tweens.add({ targets: im, scale: rnd(2.0, 3.0), alpha: 0, y: im.y + (nm === 'confetti' || nm === 'streamers' ? 60 : 10), duration: rnd(800, 1300), ease: 'Cubic.easeOut', onComplete: () => im.destroy() });
        if (nm.startsWith('fw') && Math.random() < 0.5) SFX.kick && SFX.kick(0.2);
      }
    }
  }
  endCeremony() {
    this.ceremony = null; this.over = false; this.msg.setText(''); this.sub.setText(''); this.cursor.setAlpha(1); if (this.cerDim) { this.cerDim.destroy(); this.cerDim = null; } this.cameras.main.setZoom(this.baseZoom()); this.fixUi(this.baseZoom());
    for (const p of this.all) if (!p.sentOff) { p.state = 'idle'; p.stateT = 0; }
    this.cupNext();
  }
  // RISE UP: the third bar is full. BASIC: the words blink in. WILD: they slam in huge and tilted, flicker through
  // fire colours, PixelLab flames burn under the letters and the flaming arrow-exclamation bobs beside them.
  riseUp(team) {
    const wild = SP_STYLE === 'wild', F = '"Press Start 2P"', fx = this.textures.exists('fx');
    if (this.rise) this.rise.c.destroy();
    const c = this.add.container(VIEW_W / 2, 176); this.hud.add(c);
    const fl = [];
    if (fx && wild) for (let i = 0; i < 12; i++) fl.push(this.add.image(-154 + i * 28, 24, 'fx', ['flame', 'flame2', 'flameTwin'][i % 3]).setOrigin(0.5, 1).setAlpha(0.95));
    const st = { fontFamily: F, fontSize: '40px' };
    const back = this.add.text(5, 6, 'RISE UP', { ...st, color: '#5a0f14' }).setOrigin(0.5);
    const mid = this.add.text(0, 0, 'RISE UP', { ...st, color: '#ff6a1e', stroke: '#0c0a0e', strokeThickness: 8 }).setOrigin(0.5);
    const top = this.add.text(0, 0, 'RISE UP', { ...st, color: '#ffde1e', stroke: '#0c0a0e', strokeThickness: 8 }).setOrigin(0.5);
    top.setCrop(0, 0, top.width, top.height * 0.52);                              // two-tone fire letters: yellow over orange
    const who = this.add.text(0, -42, `${team.name} · ENERGY FULL · LV3`, { fontFamily: F, fontSize: '10px', color: '#f4f0e4', stroke: '#0c0a0e', strokeThickness: 5 }).setOrigin(0.5);
    const arrow = fx ? this.add.image(mid.width / 2 + 40, -2, 'fx', 'arrowbang').setScale(wild ? 1.6 : 1.2)
      : this.add.text(mid.width / 2 + 30, 0, '!', { ...st, color: '#ffde1e', stroke: '#0c0a0e', strokeThickness: 8 }).setOrigin(0.5);
    c.add([...fl, back, mid, top, who, arrow]);
    this.rise = { c, t: 0, wild, fl, top, mid, arrow, who };
    SFX.rise();
    this.ramiSay('skill', { text: `LISTEN TO THIS CROWD!\n${team.name}, RISE UP!!`, expr: 'laugh' }, 1);
    if (wild) { c.setScale(3).setAngle(-14).setAlpha(0); this.tweens.add({ targets: c, scale: 1, angle: -4, alpha: 1, duration: 280, ease: 'Back.easeOut' });
      this.cameras.main.flash(140, 255, 190, 60); this.cameras.main.shake(260, 0.004); }
  }
  tickRise(dt) {
    const R = this.rise; if (!R) return; R.t += dt; const T = 2.3;
    if (R.wild) {
      const fire = ['#ffffff', '#ffde1e', '#ffb02e', '#ffde1e'];
      R.top.setColor(fire[Math.floor(R.t * 18) % 4]);
      R.c.setPosition(VIEW_W / 2 + Math.round(rnd(-1.6, 1.6)), 176 + Math.round(rnd(-1.2, 1.2)) - (R.t > T - 0.4 ? (R.t - T + 0.4) * 160 : 0));
      R.fl.forEach((f, i) => f.setScale(0.85 + 0.25 * Math.sin(R.t * 15 + i * 1.7), 1.0 + 0.35 * Math.sin(R.t * 11 + i * 2.3)));
      R.arrow.setY(-4 + Math.sin(R.t * 9) * 5).setAngle(Math.sin(R.t * 7) * 6);
    } else R.c.setVisible(R.t > 1.0 || Math.floor(R.t * 6) % 2 === 0);
    if (R.t > T - 0.4) R.c.setAlpha(Math.max(0, (T - R.t) / 0.4));
    if (R.t > T) { R.c.destroy(); this.rise = null; }
  }
  // SPECIAL (U / B / pad LB) on the ball: spends every full bar. Fixed, hard and on target; the level decides how it looks.
  special(p) {
    const mt = this.meterOf(p.team), b = this.ball;
    if (mt.level() < 1 || p.keeper || b.owner !== p || p.busy() || this.pending) return false;
    const lv = mt.spend(), held = p === this.human && Math.abs(Input.axis.y) > 0.2, aim = held ? Input.axis.y : (Math.random() < 0.5 ? -1 : 1) * rnd(0.55, 1);   // no aim held: it picks a corner
    this.doShot(p, 0.8, aim);
    const k = this.pending; if (!k || k.p !== p) return false;
    k.ty = clamp(34 + aim * 2.9 + rnd(-0.25, 0.25), GOAL_Y0 + 0.5, GOAL_Y1 - 0.5); k.tx = p.team.goalX + p.team.side * 2;
    const f = spRange(lv, p);                                                    // v0.8.6 range
    k.speed = [31, 35, 39][lv - 1] * (0.7 + 0.3 * f); k.vz = [1.3, 0.7, 2.2][lv - 1]; k.info.special = lv; k.info.power = 1; k.info.spP = SP_POWER[lv - 1] * f; k.info.spF = f;
    if (f < 0.999) this.time.delayedCall(700, () => this.say('', f > 0.8 ? 'A LONG WAY OUT...' : 'TOO FAR - IT LOSES ITS POWER', 1));
    const SA = ['sp1', 'sp2', 'super'][lv - 1];                                   // PixelLab special-move demos: LV1 spin strike, LV2 thunder strike, LV3 leap
    if (MAN.kits[p.kit].anims[`${SA}-E`]) {
      p.face = p.team.side > 0 ? 0 : 4; p.kickAnim = SA; p.setState('kick', 12 / kickRate(SA) + 0.05);
      k.t = (KICK_HIT[SA] + 0.6) / kickRate(SA);
      for (const o of p.team.opp.players) o.stun = Math.max(o.stun, k.t + 0.2);  // everyone stops to watch
    }
    this.say(SP_NAMES[lv - 1] + '!', `${p.team.name} · LV${lv} SPECIAL`, 1.3);
    this.ramiSay('skill', { text: [`A ${SP_NAMES[0]}!\nTHE BALL IS ON FIRE!`, `${SP_NAMES[1]}!\nYOU CAN HEAR IT CRACKLE!`, `THE ${SP_NAMES[2]}!!\nI HAVE NEVER SEEN THAT!`][lv - 1], expr: 'laugh' }, 2);
    SFX.special(lv); this.flagReplay(SP_NAMES[lv - 1] + '!');
    return true;
  }
  // v0.8 a hard shot the keeper had to deal with: the attacking side earns energy (more for a power shot)
  shotSaved(gk) {
    const b = this.ball, by = b.shotBy || b.lastP; if (!by || by.team === gk.team) return;
    if (this.savedFor === b.shotT) return; this.savedFor = b.shotT;              // once per shot
    // v0.8.1 (Luca): SP comes from time only - nothing here any more
  }
  // v0.8 GUARD BROKEN: the keeper gets the ball but it's too much - he's knocked back and it carries on into the net
  guardBreak(gk) {
    const b = this.ball; gk.guard = 0.55; gk.guardT = 0; gk.cool = 1.2; gk.stun = 1.2; b.save = null;
    if (MAN.kits[gk.kit].anims['blasted-E']) { gk.setState('blasted', 1.2); gk.face = gk.team.side > 0 ? 0 : 4; gk.vx = gk.team.side * -2.5; gk.vy = 0; }
    else gk.setState('fall', 0.7);
    b.vx *= 0.85; b.vy *= 0.85; this.hitStop = Math.max(this.hitStop || 0, 0.09); this.cameras.main.shake(220, 0.012); this.cameras.main.flash(120, 255, 240, 200);
    this.say('GUARD BROKEN!', 'IT GOES THROUGH HIM!', 1.2); this.flagReplay('THROUGH THE KEEPER!', gk);
  }
  meterOf(team) { return (this.meters && team && this.meters[team === this.home ? 0 : 1]) || { add() {}, level: () => 0, spend: () => 0 }; }
  gain(p, incoming) {
    const b = this.ball, prev = b.owner;
    // v0.8.1 (Luca): no SP for passes - the AI just passed it back and forth to farm it. SP fills with time only.
    b.special = 0; b.saveable = null; b.chip = false;
    for (const t of [this.home, this.away]) { const k = t.players[0]; if (k && k !== p && k.spSave) k.spSave = 0; }   // v0.9.0: someone has it: no save to make
    if (b.shotBy && b.shotBy.team !== p.team && p.keeper) this.missedChance(b.shotBy.team, 'held'); else b.shotBy = null;
    const back = p.keeper && b.last === p.team && b.lastP && b.lastP !== p && b.how && b.how.kind === 'pass';   // v0.9.1 (IFAB Law 12): a team-mate's pass / throw-in back to him - feet only
    const box = p.keeper && !back && Math.abs(p.x - p.team.ownGoalX) < 16.5 && Math.abs(p.y - 34) < 20.2;
    b.owner = p; b.last = p.team; b.target = null; b.save = null;
    if (prev) { prev.cool = 0.4; }
    if (box) {
      if (len(b.vx, b.vy) > 2 && p.state !== 'dive') p.face = dirIndex(-b.vx, -b.vy);
      SFX.catch(); p.hands = true; p.hold = 0; p.claimHigh = b.z > 1.45 && p.state !== 'dive'; b.vz = 0; if (p.state !== 'dive') p.setState('catch', p.claimHigh ? 0.6 : 0.5);    // a diving catch keeps the dive; a high ball = the jumping claim
      if (incoming > 15) this.say('', 'SAVED!', 0.8); return;
    }
    // first touch: a hard ball pops off the foot a little
    if (incoming > 6) p.touchAnimT = 0.28;
    const pop = Math.min(0.18, 0.04 + incoming * 0.008);
    b.vx = p.vx + b.vx * pop; b.vy = p.vy + b.vy * pop; b.vz = 0; b.z = 0; p.touchT = 0.2;
  }
  // the net gives: a quick ripple outwards that settles (the net images shift a few pixels and spring back)
  netRipple(side, speed) {
    const n = this.nets && this.nets[side]; if (!n) return;
    const amp = clamp(Math.round(speed / 6), 2, 5) * (side === 'L' ? -1 : 1);
    this.tweens.killTweensOf(n.imgs); for (const im of n.imgs) im.x = n.x;
    this.tweens.add({ targets: n.imgs, x: n.x + amp, duration: 80, ease: 'Sine.easeOut', yoyo: true, repeat: 1,
      onComplete: () => { this.tweens.add({ targets: n.imgs, x: n.x + Math.sign(amp), duration: 90, yoyo: true, onComplete: () => { for (const im of n.imgs) im.x = n.x; } }); } });
  }
  rules() {
    const b = this.ball;
    if ((b.special || b.saveable) && (b.inNet || b.x < -0.5 || b.x > PITCH_L + 0.5 || b.y < -0.5 || b.y > PITCH_W + 0.5)) { b.special = 0; b.saveable = null; }   // v0.8.7: out / in the net = an ordinary ball again
    if (b.inNet || (b.owner && b.owner.hands) || this.dead) return;
    if (b.owner && (b.x < 0 || b.x > PITCH_L || b.y < 0 || b.y > PITCH_W)) { b.last = b.owner.team; b.owner = null; }   // dribbled out
    if (b.owner) return;
    if (!b.inNet && (b.x < 0 || b.x > PITCH_L)) {
      const left = b.x < 0, defending = left ? (this.home.side > 0 ? this.home : this.away) : (this.home.side > 0 ? this.away : this.home);
      if (b.y > GOAL_Y0 && b.y < GOAL_Y1 && b.z < BAR_Z) {
        b.inNet = true; const scorer = defending.opp; scorer.score++;
        this.netRipple(left ? 'L' : 'R', len(b.vx, b.vy, b.vz)); b.vx *= 0.5; b.vz *= 0.4;      // the net takes the pace off
        const hero = b.lastP && b.lastP.team === scorer && !b.lastP.keeper ? b.lastP : null;
        if (hero) { hero.setState('celebrate', 2.6); hero.face = 6; hero.vx = hero.vy = 0;
          const KA = MAN.kits[hero.kit].anims, opts = ['celebrate', 'celeb2', 'celeb3', 'celeb4'].filter(c => KA[`${c}-S`]);   // batch 7-8: knee slide, aeroplane
          hero.celeAnim = opts[Math.floor(Math.random() * opts.length)] || 'celebrate';
          if (KA[`${hero.celeAnim}-E`] && Math.random() < 0.5) hero.face = scorer.side > 0 ? 4 : 0; }          // half the time towards the side, not the camera
        for (const p of defending.players) {                                       // the beaten side: keeper on his knees, heads drop
          if (p.sentOff || (p.busy() && !p.keeper)) continue;
          const KA = MAN.kits[p.kit].anims;
          if (p.keeper) { if (KA['pkdefeat-S']) { const g = p; this.time.delayedCall(800, () => { if (!g.busy() && !g.hands) { g.setState('beaten', 2.2); g.face = 6; g.vx = g.vy = 0; } }); } }
          else if (KA['dejected-S'] && len(p.x - b.x, p.y - b.y) < 35 && Math.random() < 0.7) { const q = p; this.time.delayedCall(200 + Math.random() * 500, () => { if (!q.busy()) { q.setState('dejected', 2.2); q.face = 6; q.vx = q.vy = 0; } }); }
        }
        this.stadium.cheer(4.5); this.say('GOAL!!', `${scorer.name} SCORES`, 2.8); SFX.net(); SFX.roar(5, 1);
        if (this.ref) this.ref.act('whistle', 2.2);
        if (window.__lab && !window.__labCut) { this.time.delayedCall(2600, () => this.kickoff(defending)); this.freeze = 2.7; return; }   // (v0.8.7: the Lab's GOAL cut scene gets the real celebration + replay)
        this.goalAt = this.recN || 0; this.evReplay = null; this.lastScorer = { team: scorer, min: Math.min(HALF_END[this.half - 1] || 90, Math.floor(this.clock / 60) + 1), num: hero && hero.num,
          own: !!(b.lastP && b.lastP.team === defending && !b.lastP.keeper), late: this.half >= 2 && this.clock > ((HALF_END[this.half - 1] || 90) - 3) * 60,
          bike: !!(this.lastBike && this.lastBike.p === b.lastP && this.time.now - this.lastBike.t < 2500),
          how: b.how && b.how.kind, far: b.how ? len(b.how.x - (left ? 0 : PITCH_L), b.how.y - 34) : 0 };
        this.ramiSay('goal', {}, 3); this.loseTime(45);                         // v0.8.4: celebrations cost time
        { const ep = this.epoch;                                                 // celebrate, then the replay
          this.time.delayedCall(1450, () => { if (ep !== this.epoch || this.over && !this.cupPens) return;
            // v0.8.2: the frames are taken NOW (a pause-menu replay can't empty them later); if you've paused or another
            // replay is on, it waits its turn - and so does the kick-off after it
            const rec = this.rec || [], frames = rec.slice(-330), gi = this.recIndex(this.goalAt || 0) - (rec.length - frames.length); if (frames[gi]) frames[gi].goal = true;
            this.goalQ = { ep, frames, after: () => this.afterGoal(defending) }; this.goalQTick(); }); }   // v0.8.4: a goal in the last seconds - then the whistle
        this.freeze = 99; return;
      }
      if (b.last === defending) this.dead = { kind: 'CORNER', team: defending.opp, x: left ? 0.4 : PITCH_L - 0.4, y: b.y < 34 ? 0.4 : PITCH_W - 0.4, t: 0.8 };
      else {
        const close = b.shotBy && b.shotBy.team === defending.opp && Math.min(Math.abs(b.y - GOAL_Y0), Math.abs(b.y - GOAL_Y1)) < 1.3 && b.z < BAR_Z + 0.8;
        if (close) { this.flagReplay('SO CLOSE!'); SFX.ooh(); }                                   // inches wide: worth a second look
        this.dead = { kind: 'GOAL KICK', team: defending, x: left ? 5.5 : PITCH_L - 5.5, y: 34, t: 0.8 }; this.missedChance(defending.opp);
      }
      return;
    }
    if (b.y < 0 || b.y > PITCH_W) { const t = b.last === this.home ? this.away : this.home; this.dead = { kind: 'THROW-IN', team: t, x: clamp(b.x, 1, PITCH_L - 1), y: b.y < 0 ? 0.2 : PITCH_W - 0.2, t: 0.6 }; }
  }

  // ---------- drawing
  render(dt) {
    const b = this.ball, cam = this.cameras.main;
    for (const p of this.all) p.draw();
    if (this.ref) this.ref.draw();
    const X = wx(b.x, b.y), Y = wy(b.y);
    const horiz = Math.abs(b.vx * PX_X) >= Math.abs(b.vy * PX_Y);
    // spin: never step more than ~1 frame per screen refresh, or a fast ball looks frozen / spinning backwards
    const dfr = Math.max(0, (b.roll - (this.lastRoll ?? b.roll)) / 0.09); this.lastRoll = b.roll;
    this.ballFrame = (this.ballFrame + Math.min(dfr, 0.85)) % 8;
    const fr = Math.floor(this.ballFrame);
    this.ballSpr.setFrame(`ball-${horiz ? 'x' : 'y'}${(fr + 8) % 8}`).setPosition(Math.round(X), Math.round(Y - 12 - (ballS() - 1) * 13 - b.z * PX_H)).setDepth(Y + 0.5).setScale(ballS())
      .setVisible(!(b.owner && b.owner.carrying) && !this.toss);                // the sprite is drawing the ball itself (v0.8.5: none during the coin toss)
    if (this.flashT > 0) { this.flashT -= dt; this.ballSpr.setTintFill(0xffffff); } else if (this.ballSpr.isTinted) this.ballSpr.clearTint();
    this.drawTrail(dt);
    this.ballSh.setPosition(Math.round(X), Math.round(Y - 7)).setDepth(Y - 40).setAlpha(clamp(1 - b.z / 6, 0.35, 1)).setScale(ballPx() * ballS() / 24);
    // camera: follow the ball, a little ahead of it
    let tx = X + b.vx * 14, ty = wy(b.y, b.z * 0.3) - 40 - clamp(1 - b.y / 20, 0, 1) * 170;
    const fs = this.foulScene;
    if (fs) { const q = fs.card ? fs.by : fs.victim; tx = wx(q.x, q.y); ty = wy(q.y) - 70 - clamp(1 - q.y / 20, 0, 1) * 120; }   // v0.8: the camera stays on the incident
    const spc = this.setPiece;
    if (spc && !spc.kicked && spc.team === this.home && this.aimPt) {          // your set piece: frame the ball AND the aim cursor
      const ax = wx(this.aimPt.x, this.aimPt.y), ay = wy(this.aimPt.y);       // show where the ball is going (the line points back to the taker)
      tx = X + (ax - X) * 0.8; ty = wy(b.y) + (ay - wy(b.y)) * 0.8 - 40;
      if (spc.kind === 'FREE KICK' || spc.kind === 'GOAL KICK') tx = clamp(tx, X - (VIEW_W / 2 - 150), X + (VIEW_W / 2 - 150));   // v0.8: the taker stays in shot (corners: the box matters more)
    }
    if (this.camTarget) { tx = this.camTarget.x; ty = this.camTarget.y; }      // v0.8.4 walk-out / half time
    if (!window.__lab) {                                                        // camera-pov: hold the picked distance (a pause-menu change lands here)
      const z = camZoom(), ch = Math.abs(cam.zoom - z) > 1e-3; if (ch) cam.setZoom(z);
      if (ch || z !== 1) { this.uiFix = this.uiItems(); this.fixUi(z); }        // re-listed each frame: weather and a restarted scene make new screen items
    }
    const k = 1 - Math.exp(-dt * (this.camFast ? 10 : this.camTarget ? 2.6 : 4.5));
    this.camX = (this.camX ?? tx) + (tx - (this.camX ?? tx)) * k; this.camY = (this.camY ?? ty) + (ty - (this.camY ?? ty)) * k;
    cam.centerOn(Math.round(this.camX), Math.round(this.camY));
    // cursor over the human player
    const hp = this.human;
    this.cursor.setPosition(Math.round(wx(hp.x, hp.y)), Math.round(wy(hp.y) - 112 + Math.sin(this.time.now / 140) * 2)).setAlpha(this.demo ? 0 : 1);
    this.drawFeedback();
    // HUD
    this.scoreTxt.setText(`${this.home.name} ${this.home.score}-${this.away.score} ${this.away.name}`);
    const m = Math.floor(this.clock / 60), s = Math.floor(this.clock % 60);
    this.clockTxt.setText(`${this.halfLabel()} ${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    if (this.msgT > 0) { this.msgT -= dt; if (this.msgT <= 0) { this.msg.setText(''); this.sub.setText(''); } }
    this.drawRadar();
    this.weatherTick(dt);                                                        // v0.8.5 rain / snow
    if (Input.pressed('meter')) { setSpStyle(SP_STYLE === 'wild' ? 'basic' : 'wild'); this.say('', `METER: ${SP_STYLE.toUpperCase()} (T)`, 1); }
    for (const mt of this.meters || []) mt.draw(dt);
    if (this.riseQ && !this.msg.text && !this.sub.text && !this.replay && !this.paused) { const t = this.riseQ; this.riseQ = null; this.riseUp(t); }
    this.tickRise(dt);
  }
  // power-shot trail: the PixelLab ball itself, repeated behind its flight in fading hot colours
  drawTrail(dt) {
    const tr = this.trail || (this.trail = Array.from({ length: 7 }, () => this.add.image(0, 0, 'props', 'ball-x0').setVisible(false)));
    const hist = this.trailHist || (this.trailHist = []);
    if (this.trailT > 0 && !this.ball.owner && !this.replay) {
      this.trailT -= dt; hist.unshift([this.ballSpr.x, this.ballSpr.y, this.ballSpr.frame.name, this.ballSpr.depth]); hist.length = Math.min(hist.length, 14);
    } else hist.length = 0;
    const SPC = [null, [0xffffff, 0xffe14a, 0xff9a1e, 0xff4a1e, 0xd81e3c, 0x8a1e1e], [0xffffff, 0xc8f4ff, 0x8ce6ff, 0x3ec8ff, 0x1e8cff, 0x1e3cc8], [0xffffff, 0xfff4b0, 0xffd84a, 0xd88cff, 0x9a28ff, 0x5a1e9a]];
    const cols = this.trailSp ? SPC[this.trailSp] : this.trailHot > 0.92 ? [0xffffff, 0xffe14a, 0xff9a1e, 0xff4a1e, 0xd81e3c, 0x8a1e5a] : [0xfff4b0, 0xffd84a, 0xffb02e, 0xff7a1e, 0xe8461e, 0xb4282c];
    if (this.textures.exists('fx')) {                                             // special: the ball burns (PixelLab flame, tinted per level)
      const bf = this.ballFlame || (this.ballFlame = this.add.image(0, 0, 'fx', 'flame').setOrigin(0.5, 0.92).setVisible(false));
      const on = this.trailSp && this.trailT > 0 && !this.ball.owner && !this.replay;
      bf.setVisible(!!on); if (on) { const c = cols; const ang = Math.atan2(this.ball.vy * PX_Y, this.ball.vx * PX_X);
        bf.setFrame(['flame', 'flameBlue', 'flamePurple'][this.trailSp - 1]).setPosition(this.ballSpr.x, this.ballSpr.y).setDepth(this.ballSpr.depth - 0.05).setRotation(ang - Math.PI / 2).setScale(0.8 + this.trailSp * 0.22 + rnd(-0.06, 0.06), 1.0 + this.trailSp * 0.28 + rnd(-0.1, 0.1)); }
    }
    tr.forEach((im, i) => { const h = hist[i + 1]; if (!h || i >= cols.length) { im.setVisible(false); return; }
      im.setVisible(true).setPosition(h[0], h[1]).setFrame(h[2]).setDepth(h[3] - 0.1).setScale(this.ballSpr.scaleX * (1 - i * 0.1)).setAlpha(0.8 - i * 0.12).setTintFill(cols[i]); });
  }
  // plain code-drawn placeholders (no art): energy bar, pass ring, shot aim arrow + power bar.
  // If you want pixel-art versions, they get made in Aseprite and swapped in.
  drawFeedback() {
    const g = this.power, hp = this.human, b = this.ball, INK = 0x0c0a0e;
    g.clear(); this.ring.clear();
    // v0.8 keeper guard (stand-in look until the final art): a small bar over a keeper who has been rattled by power shots
    if (!this.replay) for (const t of [this.home, this.away]) {
      const gk = t.players[0], gv = gk.guard ?? 1; if (gv > 0.995 || gk.sentOff) continue;
      const kx = Math.round(wx(gk.x, gk.y)), ky = Math.round(wy(gk.y)) - 170, shake = gv < 0.35 ? Math.round(Math.sin(this.time.now / 30)) : 0;
      g.fillStyle(INK, 0.85).fillRect(kx - 22 + shake, ky - 4, 44, 8);
      g.fillStyle(gv < 0.35 ? 0xff2878 : gv < 0.67 ? 0xffde1e : 0xf4f0e4, 1).fillRect(kx - 20 + shake, ky - 2, Math.max(1, Math.round(40 * gv)), 4);
    }
    const X = Math.round(wx(hp.x, hp.y)), Y = Math.round(wy(hp.y));
    // energy bar under the controlled player
    const st = hp.stamina, low = st < 0.3 || hp.tired, blink = hp.tired && Math.floor(this.time.now / 160) % 2;
    g.fillStyle(INK).fillRect(X - 18, Y + 3, 36, 7);
    if (!blink) g.fillStyle(low ? 0xff2878 : 0x28c8e6).fillRect(X - 16, Y + 5, Math.round(32 * st), 3);
    // v0.7.4 pass preview: a thin pulsing ring under the mate a pass would find right now (you see who before you press)
    const pa = this.passAim;
    if (pa && b.owner === hp && this.charge < 0 && !this.setPiece && !(this.passRing && this.passRing.t > 0 && this.passRing.p)) {
      const k = 0.5 + 0.25 * Math.sin(this.time.now / 110), cx = Math.round(wx(pa.x, pa.y)), cy = Math.round(wy(pa.y)) - 2;
      this.ring.lineStyle(2, 0x28c8e6, k).strokeEllipse(cx, cy, 38, 14);
      this.ring.fillStyle(0x28c8e6, k).fillTriangle(cx - 7, cy - 172, cx + 7, cy - 172, cx, cy - 162);
      const cam = this.cameras.main, V = cam.worldView, ty = cy - 70;
      if (!V.contains(cx, ty)) {                                                 // off screen: an arrow on the edge points at him
        const mg = 34 / cam.zoom, ex = clamp(cx, V.x + mg, V.right - mg), ey = clamp(ty, V.y + 168 / cam.zoom, V.bottom - 95 / cam.zoom);   // clear of the score box, meters, Rami + radar
        const an = Math.atan2(ty - ey, cx - ex), s = 13 / cam.zoom, c = Math.cos(an), sn = Math.sin(an);
        const tri = (r, col, al) => g.fillStyle(col, al).fillTriangle(ex + c * r * 1.7, ey + sn * r * 1.7, ex - c * r * 0.8 - sn * r * 0.75, ey - sn * r * 0.8 + c * r * 0.75, ex - c * r * 0.8 + sn * r * 0.75, ey - sn * r * 0.8 - c * r * 0.75);
        tri(s + 4 / cam.zoom, INK, 0.9); tri(s, 0x28c8e6, 0.6 + 0.4 * k);
      }
    }
    // ring under the player the pass is going to
    if (this.passRing && this.passRing.p) {
      const q = this.passRing.p, a = clamp(this.passRing.t, 0, 1);
      this.ring.lineStyle(3, 0x28c8e6, a).strokeEllipse(Math.round(wx(q.x, q.y)), Math.round(wy(q.y)) - 2, 46, 18);
    }
    // set piece (yours): aim cursor on the pitch + a line from the ball
    const sp = this.setPiece;
    if (sp && !sp.kicked && sp.team === this.home && this.aimPt) {
      const A = this.aimPt, ax = Math.round(wx(A.x, A.y)), ay = Math.round(wy(A.y)), bx = wx(b.x, b.y), by = wy(b.y) - 6;
      g.lineStyle(5, INK, 0.9).lineBetween(bx, by, ax, ay).lineStyle(2, 0xffde1e, 1).lineBetween(bx, by, ax, ay);
      g.lineStyle(5, INK).strokeEllipse(ax, ay, 40, 16).lineStyle(3, 0xffde1e).strokeEllipse(ax, ay, 40, 16);
      g.fillStyle(0xffde1e).fillRect(ax - 1, ay - 1, 3, 3);
      // v0.8 (Luca: see who you can pass to at free kicks / corners): a faint marker over every team-mate,
      // the ring + arrow on the one the ball would find (nearest the cursor)
      const tgt = this.spTarget(), k = 0.5 + 0.25 * Math.sin(this.time.now / 110);
      for (const q of sp.team.players) {
        if (q === sp.taker || q.sentOff || q.keeper) continue;
        const qx = Math.round(wx(q.x, q.y)), qy = Math.round(wy(q.y)) - 2;
        if (q === tgt) { const bob = Math.round(3 * Math.sin(this.time.now / 140)); this.ring.lineStyle(3, 0x28c8e6, 0.5 + k).strokeEllipse(qx, qy, 44, 17);
          g.fillStyle(INK, 0.9).fillTriangle(qx - 11, qy - 176 + bob, qx + 11, qy - 176 + bob, qx, qy - 157 + bob).fillStyle(0x28c8e6, 1).fillTriangle(qx - 8, qy - 174 + bob, qx + 8, qy - 174 + bob, qx, qy - 160 + bob); }
        else g.fillStyle(INK, 0.55).fillTriangle(qx - 7, qy - 172, qx + 7, qy - 172, qx, qy - 162).fillStyle(0x28c8e6, 0.6).fillTriangle(qx - 5, qy - 171, qx + 5, qy - 171, qx, qy - 164);
      }
      if (this.charge >= 0) { const px = X - 30, py = Y + 13; g.fillStyle(INK).fillRect(px - 2, py - 2, 64, 12).fillStyle(0xffde1e).fillRect(px, py, Math.round(60 * this.charge), 8); }
      return;
    }
    // v0.8.6 SPECIAL pop-up (aerial special ready): the I is the RISE arrow
    if (this.airSp && this.textures.exists('coin')) {
      if (!this.airUi) { const F = '"Press Start 2P"', st = { fontFamily: F, fontSize: '13px', color: '#ffde1e', stroke: '#0c0a0e', strokeThickness: 5 };
        this.airUi = { a: this.add.text(0, 0, 'SPEC', st).setOrigin(1, 0.5).setDepth(8.5e6), i: this.add.image(0, 0, 'coin', 'rise-arrow').setOrigin(0.5).setDepth(8.5e6), b: this.add.text(0, 0, 'AL', st).setOrigin(0, 0.5).setDepth(8.5e6),
          k: this.add.text(0, 0, '', { fontFamily: F, fontSize: '8px', color: '#0c0a0e', backgroundColor: '#ffde1e', padding: { x: 4, y: 3 } }).setOrigin(0.5, 0).setDepth(8.5e6) }; }
      const U = this.airUi, s2 = 1 + 0.12 * Math.sin(this.time.now / 70), ux = Math.round(wx(hp.x, hp.y)), uy = Math.round(wy(hp.y)) - 150;
      U.i.setPosition(ux, uy).setScale(0.55 * s2).setVisible(true); U.a.setPosition(ux - 7, uy).setScale(s2).setVisible(true); U.b.setPosition(ux + 7, uy).setScale(s2).setVisible(true);
      U.k.setText(`PRESS ${keyset().special}`).setPosition(ux, uy + 16).setVisible(true);
    } else if (this.airUi) for (const k in this.airUi) this.airUi[k].setVisible(false);
    // v0.8.5 power lob: where it will land (a ring that walks out as you hold) + a cyan power bar
    if (this.lobCharge >= 0 && b.owner === hp) {
      const L = this.lobSpot(hp), lx = Math.round(wx(L.x, L.y)), ly = Math.round(wy(L.y)) - 2, bx = wx(b.x, b.y), by = wy(b.y) - 6;
      g.lineStyle(4, INK, 0.7); g.beginPath(); for (let i = 0; i <= 12; i++) { const u = i / 12, h = Math.sin(u * Math.PI) * (40 + this.lobCharge * 90); const x = bx + (lx - bx) * u, y = by + (ly - by) * u - h; if (i) g.lineTo(x, y); else g.moveTo(x, y); } g.strokePath();
      g.lineStyle(2, 0x28c8e6, 0.95); g.beginPath(); for (let i = 0; i <= 12; i++) { const u = i / 12, h = Math.sin(u * Math.PI) * (40 + this.lobCharge * 90); const x = bx + (lx - bx) * u, y = by + (ly - by) * u - h; if (i) g.lineTo(x, y); else g.moveTo(x, y); } g.strokePath();
      g.lineStyle(5, INK).strokeEllipse(lx, ly, 44, 17).lineStyle(3, L.chip ? 0xff2878 : 0x28c8e6).strokeEllipse(lx, ly, 44, 17);   // (pink ring: it's a CHIP)
      const px = X - 30, py = Y + 13; g.fillStyle(INK).fillRect(px - 2, py - 2, 64, 12).fillStyle(0x28c8e6).fillRect(px, py, Math.round(60 * this.lobCharge), 8);
    }
    // shooting: aim arrow from the ball towards the chosen spot in the goal + power bar with zones
    if (this.charge >= 0 && b.owner === hp) {
      const c = this.charge, gx = hp.team.goalX, ty = 34 + this.aimY * 2.8;
      const bx = wx(b.x, b.y), by = wy(b.y) - 12, tx = wx(gx, ty), tyS = wy(ty, 1.0);
      let dx = tx - bx, dy = tyS - by; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
      const L = 34 + 96 * c, ex = bx + dx * L, ey = by + dy * L, col = c > 0.9 ? 0xff2878 : 0xffde1e;
      const head = (s, colr) => g.fillStyle(colr).fillTriangle(ex + dx * s * 1.6, ey + dy * s * 1.6, ex - dy * s, ey + dx * s, ex + dy * s, ey - dx * s);
      g.lineStyle(7, INK).lineBetween(bx, by, ex, ey); head(10, INK);
      g.lineStyle(3, col).lineBetween(bx, by, ex, ey); head(7, col);
      const px = X - 30, py = Y + 13;
      g.fillStyle(INK).fillRect(px - 2, py - 2, 64, 12);
      g.fillStyle(0x3e0c0a).fillRect(px + 54, py, 6, 8);                             // over-hit zone
      g.fillStyle(col).fillRect(px, py, Math.round(60 * c), 8);
      g.fillStyle(0xf4f0e4).fillRect(px + 33, py - 2, 1, 12).fillRect(px + 51, py - 2, 1, 12);   // sweet spot 0.55-0.85
    }
  }
  drawRadar() {
    const g = this.radar, W = 168, H = 108, x0 = VIEW_W - W - 16, y0 = window.HC2_TOUCH ? 62 : VIEW_H - H - 16;   // touch: top right, under the away SP meter (the buttons sit bottom right)
    g.clear().fillStyle(0x0c0a0e, 0.72).fillRect(x0 - 4, y0 - 4, W + 8, H + 8).lineStyle(1, 0xf4f0e4, 0.8).strokeRect(x0, y0, W, H)
      .lineBetween(x0 + W / 2, y0, x0 + W / 2, y0 + H).strokeCircle(x0 + W / 2, y0 + H / 2, 14);
    const sx = x => x0 + x / PITCH_L * W, sy = y => y0 + y / PITCH_W * H;
    for (const p of this.all) {
      if (p.sentOff) continue;
      g.fillStyle(TEAM_COL[p.team.name]).fillRect(Math.round(sx(p.x)) - 2, Math.round(sy(p.y)) - 2, 4, 4);
    }
    const hp = this.human; g.lineStyle(1, 0x28c8e6).strokeRect(Math.round(sx(hp.x)) - 4, Math.round(sy(hp.y)) - 4, 8, 8);
    { const bx = sx(this.ball.x), by = sy(this.ball.y), pulse = 5 + 2 * Math.abs(Math.sin(this.time.now / 260));   // v0.8.5: a ball that stands out from every kit
      g.fillStyle(0x0c0a0e).fillCircle(bx, by, 4.5).fillStyle(0xffffff).fillCircle(bx, by, 3).lineStyle(2, 0xff2878, 0.9).strokeCircle(bx, by, pulse); }
  }
}

// ------------------------------------------------------------------ touch controls (phones / tablets)
function setupTouch() {
  const ui = document.getElementById('touch'); if (!ui) return;
  const coarse = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  if (!coarse) return;
  ui.hidden = false; window.HC2_TOUCH = true;
  const stick = document.getElementById('stick'), knob = document.getElementById('knob');
  let sid = null, ox = 0, oy = 0;
  const R = 56;
  const zone = document.getElementById('stickzone');
  zone.addEventListener('pointerdown', e => {
    sid = e.pointerId; zone.setPointerCapture(sid); ox = e.clientX; oy = e.clientY;
    stick.style.left = (ox - 70) + 'px'; stick.style.top = (oy - 70) + 'px'; stick.classList.add('on');
  });
  zone.addEventListener('pointermove', e => {
    if (e.pointerId !== sid) return;
    let dx = e.clientX - ox, dy = e.clientY - oy; const l = Math.hypot(dx, dy);
    if (l > R) { dx = dx / l * R; dy = dy / l * R; }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    Input.touch.x = dx / R; Input.touch.y = dy / R;
  });
  const end = e => { if (e.pointerId !== sid) return; sid = null; Input.touch.x = Input.touch.y = 0; knob.style.transform = ''; stick.classList.remove('on'); };
  zone.addEventListener('pointerup', end); zone.addEventListener('pointercancel', end);
  document.querySelectorAll('#touch [data-act]').forEach(btn => {
    const a = btn.dataset.act;
    btn.addEventListener('pointerdown', e => { e.preventDefault(); btn.setPointerCapture(e.pointerId); Input.touch.btn[a] = true; btn.classList.add('down'); });
    const up = () => { Input.touch.btn[a] = false; btn.classList.remove('down'); };
    btn.addEventListener('pointerup', up); btn.addEventListener('pointercancel', up);
  });
}

// ------------------------------------------------------------------ PENALTY: the camera goes behind the taker
// A cut-in scene over the match. PixelLab drew the goal from behind the spot (assets/pen), the keeper facing you on his
// line and the taker from behind. A simple pinhole camera is fitted to the drawn goal and spot, so the ball shrinks as it
// flies and the keeper's reach is in metres: a save is the ball actually meeting his body or gloves.
//   x = metres across the goal (+ = right on screen), y = metres up, z = metres from the camera
// Three styles (start screen):
//   BASE      both sides secretly pick a zone (left / middle / right, low / high), then it plays out
//   WILD      the taker charges a power shot (hold, let go); the keeper can STRETCH at the last moment (press as the
//             ball reaches him); slow motion, camera punch, flashes, bigger reactions
//   TECHNICAL the taker aims anywhere + stops a sweet-spot meter (or chips it); the keeper picks side + height and can
//             read the computer's run-up
// Who plays each side: 'human' (either key set), 'p1' (WASD + K), 'p2' (arrows + .), 'cpu'. Two humans = a 1v1: both
// lock in during the countdown and nothing of either pick is shown, then the shot plays out with reactions.
const PEN_STYLES = { base: 'BASE', wild: 'WILD', tech: 'TECHNICAL' };
const PEN_KEYS = {
  p1: { l: ['KeyA'], r: ['KeyD'], u: ['KeyW'], d: ['KeyS'], ok: ['KeyK', 'Space'], alt: ['KeyL'], hint: 'WASD + K' },
  p2: { l: ['ArrowLeft'], r: ['ArrowRight'], u: ['ArrowUp'], d: ['ArrowDown'], ok: ['Period', 'ShiftRight', 'Numpad0'], alt: ['Comma', 'Numpad1'], hint: 'ARROWS + .' },
};
// ---------- RAMI ON THE MIC: the picked 64 px ZINE sticker (Aseprite, E10) talks in a box bottom-left with the E11
// call-out lines - talk loop while the line types out, then the line's expression (goal / shock / laugh ...).
// Used by the match and the penalty camera.
const RAMI_ALT = {                                   // a few extra takes so the same moment doesn't always get the same line
  goal_followup: [['WHAT A STRIKE FROM', '{TEAM}!'], ['{TEAM} SCORE!', 'THE FANS GO WILD!']],
  save: [['SAVED! WHAT HANDS!'], ['HE GETS A GLOVE', 'TO IT!']],
  miss: [['OFF TARGET!', 'HE WANTS THAT BACK!']],
  post: [['RATTLES THE POST!']],
  banter: [['WHAT A CROWD', 'AT KLEINE LOO!'], ['SIX TEAMS, ONE CUP,', 'ONE GOOD CAUSE!']],
};
// ------------------------------------------------------------------ REFEREE (v0.7.1, PixelLab)
// Keeps 12-16 m from the ball on the far side of play (a simple diagonal system), runs with the PixelLab run, and stops
// to show the yellow / red card (red = the same PixelLab move, card repainted) or to blow and point (fouls, goals).
// He's scenery for the ball: it never hits him.
class Referee {
  constructor(m) {
    this.m = m; this.x = 52.5; this.y = 18; this.vx = 0; this.vy = 0; this.face = 6; this.state = 'idle'; this.t = 0; this.anim = '';
    const K = MAN.kits.REF; this.spr = m.add.sprite(0, 0, 'REF', K.anims[Object.keys(K.anims)[0]][0]).setOrigin(0.5, K.feetY / (K.frameH || 160));
  }
  play(name, rate, once) {
    const key = `REF:${name}`;
    if (!this.m.anims.exists(key)) { const fr = MAN.kits.REF.anims[name]; if (!fr) return false;
      this.m.anims.create({ key, frames: fr.map(f => ({ key: 'REF', frame: f })), frameRate: rate, repeat: once ? 0 : -1 }); }
    if (this.anim !== key) { this.spr.play(key); this.anim = key; }
    return true;
  }
  act(kind, sec, at) { this.state = kind; this.t = sec; this.vx = this.vy = 0; this.face = 6; this.anim = ''; }
  spot(b) { return { x: clamp(b.x + (b.x < 52.5 ? 10 : -10), 8, 97), y: clamp(b.y < 34 ? b.y + 14 : b.y - 14, 3, 65) }; }
  place(b) { const s = this.spot(b); this.x = s.x; this.y = s.y; this.vx = this.vy = 0; this.face = dirIndex(b.x - s.x, b.y - s.y); }   // after a cut
  step(dt) {
    const b = this.m.ball;
    if (this.t > 0) { this.t -= dt; if (this.t <= 0) this.state = 'idle'; return; }
    if (this.goTo) {                                                              // v0.8 foul scene: he runs over to the fouler
      const dx = this.goTo.x - this.x, dy = this.goTo.y - this.y, d = len(dx, dy), v = d > 0.3 ? Math.min(8.5, 1.2 + d * 1.3) : 0;
      const k = Math.min(1, dt * 7); this.vx += ((d ? dx / d : 0) * v - this.vx) * k; this.vy += ((d ? dy / d : 0) * v - this.vy) * k;
      this.x += this.vx * dt; this.y += this.vy * dt;
      const sp = len(this.vx, this.vy); this.state = sp > 0.6 ? 'run' : 'idle'; this.face = sp > 0.6 ? dirIndex(this.vx, this.vy) : 6;
      return;
    }
    const { x: tx, y: ty } = this.spot(b);
    const dx = tx - this.x, dy = ty - this.y, d = len(dx, dy), v = d > 1.5 ? Math.min(6.4, 0.6 + d * 0.32) : 0;   // v0.7.4: walks when play is close, runs to catch up
    const k = Math.min(1, dt * 3.5); this.vx += ((d ? dx / d : 0) * v - this.vx) * k; this.vy += ((d ? dy / d : 0) * v - this.vy) * k;
    this.x += this.vx * dt; this.y += this.vy * dt;
    const sp = len(this.vx, this.vy); this.state = sp > 0.6 ? 'run' : 'idle';
    this.face = sp > 0.6 ? dirIndex(this.vx, this.vy) : dirIndex(b.x - this.x, b.y - this.y);
  }
  draw() {
    const X = wx(this.x, this.y), Y = wy(this.y), d = DIRS[this.face], A = MAN.kits.REF.anims;
    this.spr.setPosition(Math.round(X), Math.round(Y)).setDepth(Y).setVisible(this.hidden ? false : (!this.m.replay || this.spr.visible));
    if (this.state === 'card' || this.state === 'cardR' || this.state === 'whistle') { if (!this.play(`${this.state}-S`, 9, true)) this.play('idle-S', 6); this.spr.anims.timeScale = 1; return; }
    const v = len(this.vx, this.vy); this.walkLook = this.state === 'run' && A[`walk-${d}`] && v < WALK_V * (this.walkLook ? 1.12 : 0.9);
    if (this.walkLook) { this.play(`walk-${d}`, 8); this.spr.anims.timeScale = clamp(v / 1.5, 0.45, 1.6); }                    // v0.7.4 PixelLab walk
    else if (this.state === 'run' && A[`run-${d}`]) { this.play(`run-${d}`, 12); this.spr.anims.timeScale = clamp(v / 5.5, 0.5, 1.4); }
    else { this.play(A[`idle-${d}`] ? `idle-${d}` : 'idle-S', 6); this.spr.anims.timeScale = 1; }
  }
}

// ------------------------------------------------------------------ SPECIAL-MOVE ENERGY (v0.7)
// Each side charges a 3-level meter by playing: passes that arrive, time on the ball, shots, winning it back, saves -
// and most of all by conceding (comeback fuel). Every full bar is a level (LV1..LV3); the third one sets off RISE UP.
// Two looks, T switches: BASIC = a clean segmented arcade gauge (fighting-game super meter, 3 stocks, MAX blinks);
// WILD = slanted and striped, it shakes when a bar is nearly full, each level has its own power colour
// (LV1 fire, LV2 electric, LV3 aura) and PixelLab flames climb the bar as it fills.
// SPECIAL (U / B / pad LB) on the ball spends every full bar: LV1 BLAZE SHOT, LV2 THUNDER SHOT, LV3 RISING PHOENIX.
const GUARD_POWER = 0.34, GUARD_SP = [0, 0.5, 0.7, 0.95], GUARD_REGEN = 0.035;   // v0.8 keeper guard: hits, refill per second (after 2.5 s)
const SP_COL = [0x28c8e6, 0xffde1e, 0xff2878];                                         // basic: one colour per level
const SP_HOT = [[0xff7a1e, 0xffde1e, 0xffffff], [0x1e8cff, 0x8ce6ff, 0xffffff], [0x9a28ff, 0xffd84a, 0xfff4b0]];   // wild: fire, electric, aura
const SP_NAMES = ['BLAZE SHOT', 'THUNDER SHOT', 'RISING PHOENIX'];
// v0.8.6 THE POWER SYSTEM (Luca 04:09). Power: a normal hard shot ~60, LV1 100, LV2 140, LV3 200 (keeper special saves the same).
// A special can't be blocked first time: it BLOWS THROUGH defenders (LV1 one, LV2 two, LV3 five), losing power each time
// (LV1 35%, LV2 18%, LV3 none); after that the next man square in front of it can block it. RANGE: LV1 has no long-range
// power (fades past 22 m like any shot), LV2 keeps most of it from their half, LV3 from anywhere (behind halfway it loses
// up to 35%, the further back the more). KEEPER SPECIAL SAVE (same bars): same level = saved; lower level = a chance,
// (save / shot)^3 - LV2 v a full LV3 = 34%, LV1 v LV3 = 13%, LV1 v LV2 = 36%; a weakened shot is easier to stop.
const SP_POWER = [100, 140, 200], SP_PIERCE = [1, 2, 5], SP_PIERCE_LOSS = [0.35, 0.18, 0], SAVE_POWER = [100, 140, 200];
const SAVE_NAMES = ['IRON WALL', 'THUNDER GLOVE', 'RISING SHIELD'];
// ======================================================================= v0.8.9 ROUGH RIGS (Luca 23 Oct 13:35: "rig 3 cruder new
// animations for 3 new aerial special shots so the game has working moves, same for the saves, make cut scenes for the
// special saves too"). PLACEHOLDERS until the real ones are made in PixelLab: each move is put together from PixelLab
// frames we already have - a frame per key (anim a, frame f) moved / turned / squashed by code (lift = px up, rot = degrees
// as if he faced E, sx / sy = squash) - plus the PixelLab effects (ev), and after-images in the level's colour (ghost).
// hit: the key where the boot (foot) / glove (fist) meets the ball - a point on that frame (x, y of the 128 x 160 E frame).
const RIG_COL = [0xff8c28, 0x50b4ff, 0xbe5aff];
const RIG_BREAK = /^(fall|hit|blasted|slide|dive|dheader|tackle)$/;               // knocked over / a new move: the rig stops
const RIGS = {
  air1: { name: 'BLAZING SCISSOR', dur: 0.85, cy: 0.56, col: RIG_COL[0], ghost: [0.05, 0.42], keys: [
    { t: 0, a: 'jump', f: 0, sx: 1.08, sy: 0.9 }, { t: 0.08, a: 'jump', f: 1, lift: 16 }, { t: 0.18, a: 'header', f: 1, lift: 30, rot: -22 },
    { t: 0.32, a: 'volley', f: 1, lift: 30, rot: -28, hit: true, foot: [124, 53] }, { t: 0.46, a: 'volley', f: 2, lift: 22, rot: -12 },
    { t: 0.62, a: 'volley', f: 3, lift: 6, rot: -3 }, { t: 0.74, a: 'volley', f: 4, sx: 1.08, sy: 0.92 }, { t: 0.85, a: 'volley', f: 4 }],
    ev: [{ t: 0, fx: 'dust', at: 'feet', s: [0.4, 1], ms: 320 }, { t: 0.02, fx: 'flame', at: 'feet', s: [0.7, 1.7], ms: 420, dy: -24 },
      { t: 0.32, fx: 'flame', at: 'foot', s: [0.9, 2.3], ms: 380 }, { t: 0.32, fx: 'sparks', at: 'foot', s: [0.7, 2], ms: 360 }, { t: 0.74, fx: 'dust', at: 'feet', s: [0.4, 1], ms: 300 }] },
  air2: { name: 'THUNDER OVERHEAD', dur: 1.15, cy: 0.55, back: true, bike: true, col: RIG_COL[1], ghost: [0.08, 0.6], keys: [
    { t: 0, a: 'jump', f: 0, sx: 1.08, sy: 0.9 }, { t: 0.08, a: 'bicycle', f: 2, lift: 14 }, { t: 0.24, a: 'bicycle', f: 3, lift: 36, rot: -25 },
    { t: 0.44, a: 'bicycle', f: 4, lift: 46, rot: -15, hit: true, foot: [113, 40] }, { t: 0.6, a: 'bicycle', f: 5, lift: 30, rot: -8 },
    { t: 0.78, a: 'bicycle', f: 6, lift: 8 }, { t: 0.92, a: 'bicycle', f: 7 }, { t: 1.15, a: 'bicycle', f: 7 }],
    ev: [{ t: 0, fx: 'dust', at: 'feet', s: [0.4, 1], ms: 320 }, { t: 0.1, fx: 'bolt', at: 'body', s: [0.8, 1.4], ms: 240, n: 2, sp: 26 },
      { t: 0.28, fx: 'bolt', at: 'body', s: [0.9, 1.5], ms: 240, n: 2, sp: 30 }, { t: 0.44, fx: 'bolt', at: 'foot', s: [1.2, 2.1], ms: 300, n: 3, sp: 18 },
      { t: 0.44, fx: 'impactBig', at: 'foot', s: [0.8, 2], ms: 260 }, { t: 0.92, fx: 'dust', at: 'feet', s: [0.5, 1.2], ms: 340, shake: [160, 0.006] }] },
  air3: { name: 'PHOENIX DIVE', dur: 1.2, cy: 0.56, col: RIG_COL[2], ghost: [0.1, 0.72], keys: [
    { t: 0, a: 'super', f: 2, sx: 1.1, sy: 0.88 }, { t: 0.12, a: 'super', f: 4, lift: 30 }, { t: 0.3, a: 'super', f: 5, lift: 64, rot: -8 },
    { t: 0.46, a: 'super', f: 5, lift: 70, rot: -14 }, { t: 0.54, a: 'dheader', f: 2, lift: 54, rot: 22 },
    { t: 0.62, a: 'volley', f: 1, lift: 34, rot: 12, hit: true, foot: [124, 53] }, { t: 0.78, a: 'volley', f: 2, lift: 22, rot: 5 },
    { t: 0.95, a: 'super', f: 9, sx: 1.1, sy: 0.9 }, { t: 1.2, a: 'super', f: 11 }],
    ev: [{ t: 0, fx: 'flamePurple', at: 'feet', s: [0.9, 2.4], ky: 1.6, ms: 520, dy: -40 }, { t: 0.04, fx: 'whoosh', at: 'body', s: [0.8, 1.6], ms: 300 },
      { t: 0.4, fx: 'orb', at: 'body', s: [0.6, 2.2], ms: 480, a: 0.8 }, { t: 0.62, fx: 'impactBig', at: 'foot', s: [1, 2.6], ms: 300 },
      { t: 0.62, fx: 'ring', at: 'foot', s: [0.8, 3.4], ms: 420 }, { t: 0.62, fx: 'flamePurple', at: 'foot', s: [1, 2.4], ms: 380 },
      { t: 0.95, fx: 'dust', at: 'feet', s: [0.6, 1.4], ms: 360, shake: [200, 0.008] }] },
  save1: { name: 'IRON WALL', dur: 0.8, cy: 0.55, col: RIG_COL[0], keys: [
    { t: 0, a: 'punch', f: 4, sx: 1.18, sy: 1.06, hit: true, fist: [91, 70] }, { t: 0.25, a: 'punch', f: 4, sx: 1.1, sy: 1.02 },
    { t: 0.45, a: 'punch', f: 5 }, { t: 0.62, a: 'kset', f: 5 }, { t: 0.8, a: 'kset', f: 6 }],
    ev: [{ t: 0, fx: 'ring', at: 'body', dx: 30, s: [0.5, 1.1], kx: 0.32, ky: 2.2, ms: 750, tint: 0xffc070 },
      { t: 0.04, fx: 'ring', at: 'body', dx: 38, s: [0.4, 1], kx: 0.3, ky: 2.4, ms: 700, tint: 0xff8c28 },
      { t: 0, fx: 'impactBig', at: 'fist', s: [0.8, 1.8], ms: 260 }, { t: 0, fx: 'sparks', at: 'fist', s: [0.8, 2.2], ms: 380, shake: [180, 0.007] }] },
  save2: { name: 'THUNDER GLOVE', dur: 0.85, cy: 0.55, col: RIG_COL[1], ghost: [0, 0.3], keys: [
    { t: 0, a: 'punch', f: 3, lift: 14, rot: -8, sx: 1.12, sy: 1.04, hit: true, fist: [92, 76] }, { t: 0.15, a: 'punch', f: 4, lift: 18, rot: -4 },
    { t: 0.35, a: 'punch', f: 5, lift: 10 }, { t: 0.55, a: 'punch', f: 6 }, { t: 0.7, a: 'punch', f: 7 }, { t: 0.85, a: 'punch', f: 7 }],
    ev: [{ t: 0, fx: 'impactBig', at: 'fist', s: [1, 2.4], ms: 280 }, { t: 0, fx: 'bolt', at: 'fist', s: [1.1, 1.9], ms: 300, n: 3, sp: 22 },
      { t: 0.12, fx: 'bolt', at: 'fist', s: [0.9, 1.5], ms: 240, n: 2, sp: 30, shake: [200, 0.008] }] },
  save3: { name: 'RISING SHIELD', dur: 1.0, cy: 0.5, col: RIG_COL[2], ghost: [0, 0.5], keys: [
    { t: 0, a: 'diveUp', f: 5, lift: 30, hit: true, fist: [69, 3] }, { t: 0.3, a: 'diveUp', f: 5, lift: 38 },
    { t: 0.5, a: 'punch', f: 3, lift: 26 }, { t: 0.75, a: 'punch', f: 6, lift: 4 }, { t: 1.0, a: 'kset', f: 6 }],
    ev: [{ t: 0, fx: 'orb', at: 'body', s: [1, 3.4], ms: 760, a: 0.75, tint: 0xd090ff }, { t: 0, fx: 'ring', at: 'body', s: [0.8, 3.2], ms: 520 },
      { t: 0.15, fx: 'ring', at: 'body', s: [0.6, 2.6], ms: 480 }, { t: 0.05, fx: 'sparkle', at: 'fist', s: [0.8, 1.8], ms: 420, n: 3, sp: 24, shake: [220, 0.009] }] },
};
function spRange(lv, p) {                                   // how much of its power a special keeps from where it was struck
  const half = (p.x - 52.5) * p.team.side, dGoal = len(p.team.goalX - p.x, 34 - p.y);
  if (lv === 1) return dGoal <= 22 ? 1 : clamp(1 - (dGoal - 22) / 30, 0.25, 1);
  if (lv === 2) return half >= 0 ? (dGoal <= 26 ? 1 : clamp(1 - (dGoal - 26) / 70, 0.7, 1)) : clamp(0.62 + half / 52.5 * 0.42, 0.2, 0.62);
  return half >= 0 ? 1 : 1 - clamp(-half / 52.5, 0, 1) * 0.35;
}
function saveChance(K, P) { return P <= K ? 1 : clamp(Math.pow(K / P, 3), 0.04, 1); }
// v0.8 (Luca): goals give nothing (that would be OP). It refills by itself, passing moves pay (from the 3rd pass in a row each
// pass gives more), winning it back pays a little, and a hard shot the keeper has to save pays the ATTACKER (go and shoot).
// Scaling idea from fighting-game super meters / Captain Tsubasa: steady trickle + bigger chunks for doing the right things.
const SP_GAIN = { regen: 0.015 };   // v0.8.1 (Luca): time only, the same for both sides - one bar about every 67 s of play
let SP_STYLE = (() => { try { return localStorage.getItem('hc2-meter') || 'wild'; } catch (e) { return 'wild'; } })();
function setSpStyle(v) { SP_STYLE = v; try { localStorage.setItem('hc2-meter', v); } catch (e) {} }

class SpMeter {
  constructor(m, idx) {
    this.m = m; this.idx = idx; this.right = idx === 1; this.e = 0; this.shown = 0; this.flash = 0; this.pop = 0; this.t = 0; this.risen = false;
    const F = '"Press Start 2P"';
    this.W = 168; this.H = 12;
    this.x = this.right ? VIEW_W - 26 - this.W : 26; this.y = this.right ? 26 : 106;
    this.g = m.add.graphics();
    this.lab = m.add.text(0, 0, '', { fontFamily: F, fontSize: '8px', color: '#f4f0e4', stroke: '#0c0a0e', strokeThickness: 3 }).setOrigin(this.right ? 1 : 0, 1);
    this.lv = m.add.text(0, 0, '', { fontFamily: F, fontSize: '9px', color: '#ffde1e', stroke: '#0c0a0e', strokeThickness: 4 }).setOrigin(this.right ? 1 : 0, 0.5);
    this.frame = m.textures.exists('meter-wild') ? m.add.image(0, 0, 'meter-wild').setOrigin(0.5) : null;
    this.fl = [];                                                                        // PixelLab flames riding the bar (WILD)
    if (m.textures.exists('fx')) for (let i = 0; i < 9; i++) this.fl.push(m.add.image(0, 0, 'fx', 'flame').setOrigin(0.5, 1).setVisible(false));
    m.hud.add([this.g, ...(this.frame ? [this.frame] : []), ...this.fl, this.lab, this.lv]);
  }
  get team() { return this.idx ? this.m.away : this.m.home; }
  level() { return Math.floor(this.e + 1e-6); }
  reset() { this.e = this.shown = 0; this.risen = false; }
  add(v, src) {
    const m = this.m; if (m.over || m.replay || window.__lab || !(window.HC2_STARTED || m.demo)) return;
    const before = this.level(); this.e = clamp(this.e + v, 0, 3); const after = this.level();
    if (after > before) { this.flash = 0.45; this.pop = 0.9; SFX.level(after); if (after === 3 && !this.risen) { this.risen = true; m.riseQ = this.team; }
      if (SP_STYLE === 'wild') { const u = after / 3, X = this.right ? this.x + this.W - u * this.W : this.x + u * this.W;
        this.burst('sparks', X, this.y + this.H / 2, 0.6, 1.8, 420); if (after >= 2) this.burst('bolt', X, this.y - 6, 0.7, 1.1, 300); } }
  }
  spend() { const n = this.level(); if (n < 1) return 0; this.e -= n; this.risen = false; this.flash = 0.3; return n; }
  burst(name, x, y, s0, s1, ms, tint) {                                            // one PixelLab effect sprite that pops and fades
    const m = this.m; if (!m.textures.exists('fx')) return;
    const im = m.add.image(x, y, 'fx', name).setScale(s0); if (tint) im.setTint(tint); m.hud.add(im);
    m.tweens.add({ targets: im, scale: s1, alpha: 0, duration: ms, ease: 'Cubic.easeOut', onComplete: () => im.destroy() });
  }
  // WILD with the PixelLab gauge (UI Creator): its three slots are cut out, the fills are drawn behind it
  drawFramed(x, y, n, dt) {
    const g = this.g, r = this.right, S = MAN.meterSlots, sc = this.W / S.w * 1.1, fw = S.w * sc, fh = S.h * sc;
    const fx = r ? x + this.W - fw : x, fy = y - fh / 2 + this.H / 2;                   // frame's top-left on screen
    const X = sx => r ? fx + (S.w - sx) * sc : fx + sx * sc, Y0 = fy + S.y0 * sc, Y1 = fy + S.y1 * sc;
    for (let i = 0; i < 3; i++) {
      const [a, b] = S.segs[i], xa = Math.min(X(a), X(b)), xb = Math.max(X(a), X(b)), w = xb - xa, f = clamp(this.shown - i, 0, 1), c = SP_HOT[i];
      g.fillStyle(0x27141c, 1).fillRect(xa, Y0, w, Y1 - Y0);
      if (f <= 0) continue;
      const fwid = w * f, f0 = r ? xb - fwid : xa;
      g.fillStyle(c[0], 1).fillRect(f0, Y0, fwid, Y1 - Y0);
      g.fillStyle(c[1], 1).fillRect(f0, Y0, fwid, (Y1 - Y0) * 0.42);
      const step = 7, off = (this.t * (26 + i * 14)) % step;                                // stripes slide along the fill
      for (let s = off; s < fwid - 2; s += step) g.fillStyle(c[2], f >= 1 ? 0.3 : 0.18).fillRect(r ? f0 + fwid - s - 2 : f0 + s, Y0, 2, Y1 - Y0);
      if (f >= 1 && n === 3) g.fillStyle(0xffffff, 0.25 + 0.25 * Math.sin(this.t * 16 + i)).fillRect(xa, Y0, w, Y1 - Y0);
    }
    if (this.flash > 0) g.fillStyle(0xffffff, this.flash * 1.8).fillRect(fx, fy, fw, fh);
    this.frame.setPosition(fx + fw / 2, fy + fh / 2).setScale(sc).setFlipX(r).setVisible(true);
    if (this.fl.length && this.shown > 0.05) {                                                // extra PixelLab flames ride the bar as it fills
      const count = n === 3 ? 9 : n === 2 ? 6 : n === 1 ? 3 : 1, filled = Math.min(1, this.shown / 3);
      for (let i = 0; i < count; i++) {
        const f = this.fl[i], u = (i + 0.5) / count * filled, lvl = Math.min(2, Math.floor(u * 3)), wob = Math.sin(this.t * 13 + i * 2.1);
        f.setVisible(true).setFrame(['flame', 'flameBlue', 'flamePurple'][lvl]).setPosition(Math.round(r ? fx + fw - (0.05 + u * 0.9) * fw : fx + (0.05 + u * 0.9) * fw), Math.round(fy + 5))
          .setScale((0.34 + 0.08 * n + 0.05 * wob) * (n === 3 ? 1.2 : 1), 0.38 + 0.12 * n + 0.09 * wob).setAlpha(0.95);
      }
    }
    if (n === 3 && this.fl.length && Math.random() < dt * 3) this.burst('sparks', fx + rnd(0.1, 0.9) * fw, fy + fh * rnd(0.3, 0.8), 0.4, 0.9, 300);
    if (n >= 2 && this.fl.length && Math.random() < dt * 0.8) this.burst('bolt', fx + rnd(0.1, 0.9) * fw, fy, 0.5, 0.8, 220);
    const name = this.team ? this.team.name : '';
    this.lab.setText(`${name} SP`).setPosition(r ? fx + fw - 4 : fx + 6, fy + fh + 9).setAngle(-3).setScale(1);
    const lvTxt = n === 3 ? 'MAX!' : n ? `LV${n}` : '';
    this.lv.setText(lvTxt).setColor(n ? '#' + SP_HOT[n - 1][1].toString(16).padStart(6, '0') : '#ffde1e')
      .setPosition(r ? fx - 6 : fx + fw + 6, fy + fh / 2 + 2).setScale(1.1 + this.pop * 0.9 + (n === 3 ? 0.12 * Math.sin(this.t * 20) : 0)).setAngle(-6);
  }
  // corner points of a slanted bar from fraction a to fraction b (0..1 of the whole bar)
  quad(a, b, x, y, W, H, sl) {
    const r = this.right, X = f => r ? x + W - f * W : x + f * W, k = r ? -1 : 1;
    return [{ x: X(a) + sl * k, y }, { x: X(b) + sl * k, y }, { x: X(b), y: y + H }, { x: X(a), y: y + H }];
  }
  draw(dt) {
    this.t += dt; this.shown += (this.e - this.shown) * (1 - Math.exp(-dt * 7));
    this.flash = Math.max(0, this.flash - dt); this.pop = Math.max(0, this.pop - dt);
    const g = this.g, n = this.level(), INK = 0x0c0a0e, PAPER = 0xf4f0e4, wild = SP_STYLE === 'wild', r = this.right;
    const hidden = this.m.replay || !(window.HC2_STARTED || this.m.demo);
    g.clear(); this.lab.setVisible(!hidden); this.lv.setVisible(!hidden); if (this.frame) this.frame.setVisible(!hidden && wild);
    this.fl.forEach(f => f.setVisible(false));
    if (hidden) return;
    let { x, y, W, H } = this;
    const name = this.team ? this.team.name : '';
    const blink = Math.floor(this.t * 6) % 2 === 0;
    if (!wild) {                                                                      // ---- BASIC
      g.fillStyle(INK, 1).fillRect(x - 3, y - 3, W + 6, H + 6).lineStyle(2, PAPER, 1).strokeRect(x - 3, y - 3, W + 6, H + 6);
      const cw = (W - 4) / 3;
      for (let i = 0; i < 3; i++) {
        const cx = r ? x + W - (i + 1) * cw - i * 2 : x + i * (cw + 2), f = clamp(this.shown - i, 0, 1);
        g.fillStyle(0x2a2630, 1).fillRect(cx, y, cw, H);
        if (f > 0) { const fw = Math.round(cw * f); g.fillStyle(n === 3 && blink ? PAPER : SP_COL[i], f >= 1 ? 1 : 0.65).fillRect(r ? cx + cw - fw : cx, y, fw, H);
          g.fillStyle(0xffffff, 0.35).fillRect(r ? cx + cw - fw : cx, y, fw, 2); }
      }
      if (this.flash > 0) g.fillStyle(0xffffff, this.flash * 1.6).fillRect(x - 3, y - 3, W + 6, H + 6);
      this.lab.setText(`${name} SP`).setPosition(r ? x + W + 3 : x - 3, y - 6).setScale(1).setAngle(0);
      this.lv.setText(n === 3 ? (blink ? 'MAX' : '') : n ? `LV${n}` : '').setColor('#ffde1e').setPosition(r ? x - 10 : x + W + 10, y + H / 2).setScale(1 + this.pop * 0.6);
      return;
    }
    // ---- WILD: slanted gauge, colour per level, moving stripes, shakes near a level, flames from PixelLab
    const frac = this.e - n, amp = n === 3 ? 1.6 : frac > 0.8 ? 1.2 : 0;
    if (amp) { x += Math.round(rnd(-amp, amp)); y += Math.round(rnd(-amp, amp)); }
    if (this.frame && MAN.meterSlots) { this.drawFramed(x, y, n, dt); return; }
    const sl = 8, body = this.quad(0, 1, x, y, W, H, sl);
    g.fillStyle(INK, 1).fillPoints(this.quad(-0.03, 1.03, x, y - 3, W, H + 6, sl), true);
    g.fillStyle(0x1d1a22, 1).fillPoints(body, true);
    const cur = Math.min(n, 2), hot = SP_HOT[cur];
    for (let i = 0; i < 3; i++) {                                                     // each level keeps its own power colour
      const f = clamp(this.shown - i, 0, 1); if (f <= 0) continue;
      const a = i / 3, b = (i + f) / 3, c = SP_HOT[i];
      g.fillStyle(c[0], 1).fillPoints(this.quad(a, b, x, y, W, H, sl), true);
      g.fillStyle(c[1], 1).fillPoints(this.quad(a, b, x, y, W, H * 0.45, sl * 0.45), true);
      // stripes sliding along the filled part
      const step = 0.045, off = (this.t * (0.35 + i * 0.2)) % step;
      for (let s = a + off; s < b - 0.012; s += step) g.fillStyle(c[2], 0.28).fillPoints(this.quad(s, Math.min(b, s + 0.012), x, y, W, H, sl), true);
    }
    for (const t of [1 / 3, 2 / 3]) g.fillStyle(INK, 1).fillPoints(this.quad(t - 0.004, t + 0.004, x, y, W, H, sl), true);   // level notches
    const glow = n === 3 ? 0.6 + 0.4 * Math.sin(this.t * 18) : 0.5 + 0.5 * Math.sin(this.t * 4);
    g.lineStyle(2, n ? SP_HOT[n - 1][1] : PAPER, n ? glow : 1).strokePoints(this.quad(-0.03, 1.03, x, y - 3, W, H + 6, sl), true);
    if (this.flash > 0) g.fillStyle(0xffffff, this.flash * 1.8).fillPoints(this.quad(-0.03, 1.03, x, y - 3, W, H + 6, sl), true);
    if (this.frame) this.frame.setPosition(x + W / 2, y + H / 2).setFlipX(r);
    // PixelLab flames: more and taller every level, tinted with that level's power
    if (this.fl.length && this.shown > 0.05) {
      const count = n === 3 ? 9 : n === 2 ? 5 : n === 1 ? 3 : 1, filled = Math.min(1, this.shown / 3);
      for (let i = 0; i < count; i++) {
        const f = this.fl[i], u = (i + 0.5) / count * filled, X = r ? x + W - u * W : x + u * W;
        const lvl = Math.min(2, Math.floor(u * 3)), wob = Math.sin(this.t * 13 + i * 2.1);
        f.setVisible(true).setFrame(['flame', 'flameBlue', 'flamePurple'][lvl])                    // each level burns in its own PixelLab colour
          .setPosition(Math.round(X + sl * 0.5 * (r ? -1 : 1)), y + 3).setScale((0.36 + 0.1 * n + 0.05 * wob) * (n === 3 ? 1.2 : 1), 0.4 + 0.13 * n + 0.09 * wob).setAlpha(0.95);
      }
    }
    if (n === 3 && this.fl.length && Math.random() < dt * 3) this.burst('sparks', (r ? x + W - rnd(0, 1) * W : x + rnd(0, 1) * W), y + rnd(0, H), 0.4, 0.9, 300);
    if (n >= 2 && this.fl.length && Math.random() < dt * 0.8) this.burst('bolt', (r ? x + W - rnd(0.34, 1) * W * (n / 3) : x + rnd(0.34, 1) * W * (n / 3)), y - 4, 0.5, 0.8, 220);
    this.lab.setText(`${name} SP`).setPosition(r ? x + W + 3 : x - 3 + sl, y - 7).setAngle(-4).setScale(1);
    const lvTxt = n === 3 ? 'MAX!' : n ? `LV${n}` : '';
    this.lv.setText(lvTxt).setColor(n ? '#' + SP_HOT[n - 1][1].toString(16).padStart(6, '0') : '#ffde1e')
      .setPosition(r ? x - 14 : x + W + 16, y + H / 2).setScale(1.1 + this.pop * 0.9 + (n === 3 ? 0.12 * Math.sin(this.t * 20) : 0)).setAngle(-6);
  }
}

class RamiBox {
  static make(scene) { return MAN.rami && scene.textures.exists('rami') ? new RamiBox(scene) : null; }
  constructor(scene) {
    const F = '"Press Start 2P"'; this.s = scene;
    this.c = scene.add.container(0, 0).setScrollFactor(0).setDepth(9.7e6).setVisible(false);
    this.panel = scene.add.graphics();
    this.pic = scene.add.image(0, 0, 'rami', 'rami-0').setOrigin(0, 1).setScale(1.5);   // E11 was drawn for 640 x 360: x1.5 here
    this.tab = scene.add.text(0, 0, 'RAMI', { fontFamily: F, fontSize: '9px', color: '#0c0a0e', backgroundColor: '#ffde1e', padding: { x: 6, y: 4 } }).setOrigin(0, 1);
    this.txt = scene.add.text(0, 0, '', { fontFamily: F, fontSize: '11px', color: '#f4f0e4', lineSpacing: 8 }).setOrigin(0, 0);
    this.c.add([this.panel, this.pic, this.tab, this.txt]);
    this.line = null; this.t = 0; this.prio = 0; this.cool = {}; this.quiet = 0;
  }
  say(key, v = {}, prio = 1) {
    const L = MAN.rami.lines[key]; if (!L || (window.__lab && !window.__labCut)) return;
    if (this.line && this.prio > prio && this.t < this.dur) return;                // a bigger moment is still on
    const now = this.s.time.now; if (prio < 3 && this.cool[key] && now - this.cool[key] < 9000) return; this.cool[key] = now;
    const alts = RAMI_ALT[key], src = alts && Math.random() < 0.5 ? alts[Math.floor(Math.random() * alts.length)] : L.text;
    const text = v.text || src.map(x => x.replace('{TEAM}', v.TEAM || '').replace('{NUM}', v.NUM == null ? '' : v.NUM).replace('{WINNER}', v.WINNER || '')).join('\n');
    this.txt.setText(text); const tw = this.txt.width, th = this.txt.height; this.txt.setText('');
    this.line = { text, expr: v.expr || L.expr, tw, th }; this.t = 0; this.prio = prio; this.dur = 0.6 + text.length / 40 + 2.2; this.quiet = 0;
  }
  tick(dt, lift = 0) {
    this.quiet += dt;
    if (!this.line) { this.c.setVisible(false); return; }
    this.t += dt; const L = this.line, tg = MAN.rami.tags;
    if (this.t > this.dur) { this.line = null; this.c.setVisible(false); return; }
    const n = Math.min(L.text.length, Math.floor(this.t * 40)), typing = n < L.text.length;
    this.txt.setText(L.text.slice(0, n));
    let f = 0;
    if (typing) f = tg.talk[0] + Math.floor(this.t / 0.12) % 4;
    else if (L.expr !== 'talk' && tg[L.expr]) f = tg[L.expr][0];
    else f = Math.floor(this.t * 2) % 7 === 3 ? tg.blink[0] : 0;
    this.pic.setFrame('rami-' + f);
    // layout: sticker bottom-left, the line in an INK panel beside it, name tab on the panel's top-left
    const by = VIEW_H - 10 - lift;
    const pop = Math.min(1, this.t / 0.12), shake = !typing && (L.expr === 'goal' || L.expr === 'shock') && this.t - L.text.length / 40 < 0.35 ? Math.round(Math.sin(this.t * 70) * 2) : 0;
    const px = 10 + Math.round(MAN.rami.w * 1.5) + 4, pw = L.tw + 26, ph = L.th + 22, py = by - 14 - ph;
    this.pic.setPosition(10 + shake, by + (1 - pop) * 30);
    this.panel.clear().fillStyle(0x0c0a0e, 0.94).fillRect(px, py, pw, ph).lineStyle(2, 0xf4f0e4).strokeRect(px, py, pw, ph);
    this.tab.setPosition(px + 8, py + 2); this.txt.setPosition(px + 13, py + 12);
    this.c.setVisible(true);
  }
}

class PenCtl {                                       // one side's controls, read every frame
  constructor(kind) { this.kind = kind; this.cur = {}; this.prev = {}; }
  get cpu() { return this.kind === 'cpu'; }
  poll() {
    this.prev = this.cur; const c = { x: 0, y: 0, ok: false, alt: false };
    if (this.kind === 'human') { c.x = Input.axis.x; c.y = Input.axis.y; c.ok = Input.held('shoot'); c.alt = Input.held('lob'); }
    else if (PEN_KEYS[this.kind]) {
      const K = PEN_KEYS[this.kind], h = a => a.some(k => Input.keys.has(k) || Input.taps.has(k));
      c.x = (h(K.r) ? 1 : 0) - (h(K.l) ? 1 : 0); c.y = (h(K.d) ? 1 : 0) - (h(K.u) ? 1 : 0); c.ok = h(K.ok); c.alt = h(K.alt);
    }
    this.cur = c;
  }
  pressed(b) { return !!this.cur[b] && !this.prev[b]; }
  released(b) { return !this.cur[b] && !!this.prev[b]; }
  zone() { return { side: this.cur.x < -0.3 ? -1 : this.cur.x > 0.3 ? 1 : 0, high: this.cur.y < -0.3 }; }
}
const zoneAim = z => ({ x: z.side * 2.75, y: z.high ? 1.9 : 0.4 });

class PenaltyScene extends Phaser.Scene {
  constructor() { super('penalty'); }
  init(d) { this.d = d; }
  preload() { const P = MAN.penalty; if (P && !this.textures.exists('pen-bg')) this.load.image('pen-bg', P.bg); }
  create() {
    this.cameras.main.setZoom(VIEW_W / PEN_W).centerOn(PEN_W / 2, PEN_H / 2);   // v0.8.5: same picture on the bigger screen
    const d = this.d, P = MAN.penalty, S = P.scale;
    this.style = d.force ? 'base' : (d.style || window.HC2_PEN || 'base'); if (!PEN_STYLES[this.style]) this.style = 'base';
    const ctl = d.ctl || { take: d.human === 'take' ? 'human' : 'cpu', keep: d.human === 'keep' ? 'human' : 'cpu' };
    this.ct = { take: new PenCtl(ctl.take), keep: new PenCtl(ctl.keep) };
    this.secret = !this.ct.take.cpu && !this.ct.keep.cpu;                         // a 1v1: picks stay hidden
    this.add.rectangle(0, 0, PEN_W, PEN_H, 0x0c0a0e).setOrigin(0);
    this.add.image(-P.crop[0] * S, -P.crop[1] * S, 'pen-bg').setOrigin(0).setScale(S);
    const X = v => (v - P.crop[0]) * S, Y = v => (v - P.crop[1]) * S;
    const gl = X(P.goal.l), gr = X(P.goal.r), bar = Y(P.goal.bar), line = Y(P.goal.line), spotY = Y(P.spot[1]);
    const Dc = P.camBack, zg = Dc + 11, fx = (gr - gl) / 2 * zg / 3.66, fy = (line - bar) * zg / 2.44, cx = (gl + gr) / 2;
    const Hc = (spotY - line) / (fy * (1 / Dc - 1 / zg)), yh = line - fy * Hc / zg;
    this.C = { Dc, zg, fx, fy, cx, Hc, yh, spotX: X(P.spot[0]) };
    this.proj = (x, y, z) => ({ x: cx + fx * x / z, y: yh + fy * (Hc - y) / z, s: fy / z });
    // sprites: the keeper (team colours) on his line facing you, the taker big at the bottom seen from behind
    const gk = d.gk, gK = MAN.kits[gk.kit], tk = d.taker, tK = MAN.kits[tk.kit];
    const anim = (kit, K, name, fps, rep) => { const key = `${kit}:pen:${name}`; const fr = K.anims[name]; if (!fr) return null;
      if (!this.anims.exists(key)) this.anims.create({ key, frames: fr.map(f => ({ key: kit, frame: f })), frameRate: fps, repeat: rep ? -1 : 0 }); return key; };
    this.A = {
      ready: anim(gk.kit, gK, 'pready-S', 8, true) || anim(gk.kit, gK, 'idle-S', 5, true),
      diveL: anim(gk.kit, gK, 'pdive-SL', 12, false), diveR: anim(gk.kit, gK, 'pdive-SR', 12, false),
      catchS: anim(gk.kit, gK, 'catch-S', 14, false), kIdle: anim(gk.kit, gK, 'idle-S', 5, true),
      kCele: anim(gk.kit, gK, 'pkcele-S', 10, false), kDefeat: anim(gk.kit, gK, 'pkdefeat-S', 9, false),   // batch 6 (PixelLab)
      distract: anim(gk.kit, gK, 'pdistract-S', 10, true), highL: anim(gk.kit, gK, 'pdiveH-SL', 12, false), highR: anim(gk.kit, gK, 'pdiveH-SR', 12, false),   // batch 7
      tWait: anim(tk.kit, tK, 'pwait-N', 7, true), place: anim(tk.kit, tK, 'pplace-N', 9, false),   // batch 8: puts the ball on the spot
      run: anim(tk.kit, tK, 'penalty-N', 11, false) || anim(tk.kit, tK, 'kick-N', 11, false),
      power: anim(tk.kit, tK, 'ppower-N', 12, false), chip: anim(tk.kit, tK, 'pchip-N', 9, false),
      tIdle: anim(tk.kit, tK, 'idle-N', 5, true),
      cele: anim(tk.kit, tK, 'pcele-N', 10, false) || anim(tk.kit, tK, 'celebrate-S', 10, false), miss: anim(tk.kit, tK, 'pmiss-N', 9, false),
    };
    const kb = this.proj(0, 0, zg - 0.3);
    this.gkSpr = this.add.sprite(Math.round(kb.x), Math.round(kb.y), gk.kit).setOrigin(0.5, gK.feetY / gK.frameH).setScale(P.keeperScale).setDepth(10);
    this.gkSpr.play(this.A.ready);
    const st = P.takerStart || [-70, 66];
    this.tk0 = { x: this.C.spotX + st[0], y: spotY + st[1] }; this.tk1 = { x: this.C.spotX + P.taker[0], y: spotY + P.taker[1] };
    this.tkSpr = this.add.sprite(Math.round(this.tk0.x), Math.round(this.tk0.y), tk.kit).setOrigin(0.5, tK.feetY / tK.frameH).setScale(P.takerScale).setDepth(30);
    this.tkSpr.play(this.A.tWait || this.A.tIdle);
    this.ballSpr = this.add.image(0, 0, 'props', 'ball-x0').setDepth(20);
    this.rami = RamiBox.make(this);                                              // Rami calls the penalty too
    if (this.rami) { const z = VIEW_W / PEN_W, cx = VIEW_W / 2, cy = VIEW_H / 2; this.rami.c.setScale(1 / z).setPosition(cx - cx / z, cy - cy / z); }   // v0.8.5: his box laid out for the full screen, not zoomed
    if (this.rami && !d.force) this.time.delayedCall(400, () => { if (this.state === 'pick') this.rami.say('banter', { text: Math.random() < 0.5 ? 'HE STEPS UP...\nTHE KEEPER WAITS.' : 'THE WHOLE OF KLEINE\nLOO HOLDS ITS BREATH', expr: 'talk' }, 1); });
    this.shadow = this.add.image(0, 0, 'props', 'ball-shadow').setDepth(5);
    this.g = this.add.graphics().setDepth(40);
    const F = '"Press Start 2P"', T = (x, y, sz, col, o = {}) => this.add.text(x, y, '', { fontFamily: F, fontSize: sz, color: col, stroke: '#0c0a0e', strokeThickness: 6, align: 'center', ...o }).setDepth(50);
    this.title = T(PEN_W / 2, 26, '22px', '#ffde1e').setOrigin(0.5, 0);
    this.hint = this.add.text(PEN_W / 2, PEN_H - 22, '', { fontFamily: F, fontSize: '9px', color: '#0c0a0e', backgroundColor: '#f4f0e4', padding: { x: 8, y: 6 }, align: 'center', lineSpacing: 6 }).setOrigin(0.5, 1).setDepth(50);
    this.big = T(PEN_W / 2, PEN_H * 0.36, '40px', '#ffde1e', { strokeThickness: 9 }).setOrigin(0.5);
    this.sub = T(PEN_W / 2, PEN_H * 0.36 + 44, '12px', '#f4f0e4').setOrigin(0.5);
    this.cnt = T(PEN_W / 2, PEN_H * 0.52, '34px', '#f4f0e4', { strokeThickness: 8 }).setOrigin(0.5);
    this.tagT = T(110, PEN_H - 92, '11px', '#f4f0e4').setOrigin(0.5);
    this.tagK = T(PEN_W - 110, PEN_H - 92, '11px', '#f4f0e4').setOrigin(0.5);
    // state
    this.ball = { x: 0, y: 0.11, z: Dc, vx: 0, vy: 0, vz: 0 };
    this.t = 0; this.state = 'pick'; this.result = null; this.kx = 0; this.ky = 0; this.dive = 0; this.lift = 0; this.diveT = -1; this.closed = false;
    this.pick = { take: null, keep: null }; this.aim = { x: 0, y: 1.0 }; this.charge = -1; this.meter = -1; this.stretch = false; this.stretchTry = false;
    this.pickT = (this.style === 'tech' ? 8 : this.style === 'wild' ? 6 : 5) + (this.secret ? 0 : 5);
    this.title.setText(`PENALTY · ${PEN_STYLES[this.style]}`);
    if (d.force) {                                                               // lab tests: a set shot against a set dive
      const f = d.force; this.pick.take = { x: f.x, y: f.y, power: f.power, err: 0.25 + f.power * 0.3 };
      this.pick.keep = { side: f.dive || 0, high: false }; this.startRun(); return;
    }
    if (this.A.place) {                                                           // he puts the ball down, then walks back to his mark
      this.placing = true; this.pickT += 1.6; this.tkSpr.setPosition(Math.round(this.tk1.x), Math.round(this.tk1.y)).play(this.A.place);
      this.tkSpr.once('animationcomplete', () => {
        this.placing = false; if (this.state !== 'pick') return;
        this.tkSpr.play(this.A.tWait || this.A.tIdle);
        this.tweens.add({ targets: this.tkSpr, x: Math.round(this.tk0.x), y: Math.round(this.tk0.y), duration: 650, ease: 'Sine.easeOut' });
      });
    }
    if (this.ct.keep.cpu && this.A.distract && (this.style === 'wild' || Math.random() < 0.4)) { this.distracting = true; this.gkSpr.play(this.A.distract); }
    if (this.ct.take.cpu) this.pick.take = this.cpuTake();
    if (this.ct.keep.cpu) this.pick.keep = this.cpuKeep();
    this.tell = this.ct.take.cpu && this.style === 'tech' ? (Math.random() < 0.65 ? Math.sign(this.pick.take.x) : (Math.random() < 0.5 ? -1 : 1)) : 0;
    if (this.tell) this.tk0.x += this.tell > 0 ? -24 : 22;                      // the run-up angle gives it away (mostly)
    this.tkSpr.setPosition(Math.round(this.tk0.x), Math.round(this.tk0.y));
    this.hintText();
  }
  // ---- the computer's choices
  cpuTake() {
    const r = Math.random(), side = Math.random() < 0.5 ? -1 : 1, s = this.style;
    if (s === 'tech' && Math.random() < 0.07) return { x: rnd(-0.4, 0.4), y: 1.5, power: 0.3, chip: true, err: 0.15 };
    const aim = r < 0.16 ? { x: rnd(-0.7, 0.7), y: rnd(0.3, 1.5) } : { x: side * rnd(2.2, 3.25), y: Math.random() < 0.62 ? rnd(0.15, 0.7) : rnd(1.3, 2.2) };
    const power = s === 'wild' ? rnd(0.55, 0.99) : rnd(0.5, 0.85);
    return { ...aim, power, err: s === 'tech' ? rnd(0.12, 0.4) : 0.25 + power * 0.3 };
  }
  cpuKeep() { const r = Math.random(); return { side: r < 0.42 ? -1 : r < 0.84 ? 1 : 0, high: Math.random() < 0.3 }; }
  hintText() {
    const tk = this.ct.take, kp = this.ct.keep, s = this.style, L = [];
    const who = c => c.kind === 'p1' ? 'P1' : c.kind === 'p2' ? 'P2' : 'YOU';
    const mv = c => c.kind === 'p1' ? 'WASD' : c.kind === 'p2' ? 'ARROWS' : keyset().move, ok = c => c.kind === 'p1' ? 'K' : c.kind === 'p2' ? '.' : keyset().shoot;
    const alt = c => c.kind === 'p1' ? 'L' : c.kind === 'p2' ? ',' : keyset().lob;
    if (!tk.cpu && !this.pick.take) L.push(`${who(tk)} SHOOT (${mv(tk)} + ${ok(tk)}): ` + (s === 'base' ? `HOLD A DIRECTION (UP = HIGH), PRESS ${ok(tk)}`
      : s === 'wild' ? `HOLD A DIRECTION, HOLD ${ok(tk)} FOR POWER, LET GO` : `${this.secret ? 'HOLD A DIRECTION' : 'AIM'}, ${ok(tk)}, STOP THE METER IN THE GREEN · ${alt(tk)} = CHIP`));
    if (!kp.cpu && !this.pick.keep) L.push(`${who(kp)} KEEP (${mv(kp)} + ${ok(kp)}): HOLD WHERE YOU DIVE (UP = HIGH), PRESS ${ok(kp)}` + (s === 'wild' ? ' · AGAIN = STRETCH' : '') + (s !== 'base' && this.A.distract ? ` · HOLD ${alt(kp)} = MIND GAMES` : ''));
    this.hint.setText(L.join('\n')).setVisible(L.length > 0);
  }
  update(time, deltaMs) {
    let dt = Math.min(deltaMs / 1000, 1 / 30); Input.poll(); this.ct.take.poll(); this.ct.keep.poll();
    if (this.rami) this.rami.tick(dt, this.hint.visible ? 70 : 0);
    const d = this.d, P = MAN.penalty, b = this.ball, C = this.C;
    // WILD: the moment of truth in slow motion
    this.slow = this.style === 'wild' && this.state === 'flight' && !this.result && b.z > C.zg - 6 ? 0.3 : 1;
    dt *= this.slow; this.t += dt;
    if (this.state === 'pick') this.pickTick(dt);
    else if (this.state === 'runup') {
      const sT = this.strikeT, commitT = sT - 0.15, u = clamp(this.t / sT, 0, 1);
      this.tkSpr.setPosition(Math.round(this.tk0.x + (this.tk1.x - this.tk0.x) * u), Math.round(this.tk0.y + (this.tk1.y - this.tk0.y) * u));
      if (this.diveT < 0 && this.t >= commitT) this.commitKeeper();
      if (this.t >= sT) this.strike();
    } else if (this.state === 'flight') { this.stretchTick(); this.fly(dt); }
    else if (this.state === 'done') {
      const wait = this.style === 'wild' ? 3.4 : 3.0;
      if (this.t > (d.force ? 1.8 : wait) && !this.closed) { this.closed = true; d.done && d.done(this.result); }
    }
    this.keeperTick(dt);
    this.draw();
  }
  // ---- both sides choose; humans lock in, nothing of a pick is shown in a 1v1
  pickTick(dt) {
    const s = this.style, tk = this.ct.take, kp = this.ct.keep, left = this.pickT - this.t;
    if (!tk.cpu && !this.pick.take) {
      if (s === 'tech') {
        if (this.meter < 0) {
          if (this.secret) this.aim = zoneAim(tk.zone());                           // 1v1: aim by direction (a cursor would give it away)
          else { this.aim.x = clamp(this.aim.x + tk.cur.x * dt * 3.4, -4.0, 4.0); this.aim.y = clamp(this.aim.y - tk.cur.y * dt * 1.8, 0.1, 2.9); }
          if (tk.pressed('alt')) this.pick.take = { x: this.aim.x * 0.35, y: clamp(this.aim.y, 1.1, 1.8), power: 0.3, chip: true, err: 0.12 };
          else if (tk.pressed('ok')) this.meter = 0;
        } else {
          this.meter += dt;
          if (tk.pressed('ok') || this.meter > 3) { const v = this.meterVal(); this.pick.take = { ...this.aim, power: 0.45 + v * 0.5, err: 0.08 + Math.abs(v - 0.75) * 1.4 }; }
        }
      } else if (s === 'wild') {
        if (this.charge < 0) { if (tk.pressed('ok')) { this.charge = 0; this.lockZone = tk.zone(); } }
        else { this.charge = Math.min(1, this.charge + dt / 0.85); if (tk.released('ok') || this.charge >= 1) this.pick.take = { ...zoneAim(this.lockZone), power: this.charge, err: 0.2 + this.charge * 0.3 }; }
      } else if (tk.pressed('ok')) this.pick.take = { ...zoneAim(tk.zone()), power: 0.7, err: 0.3 };
      if (this.pick.take) this.hintText();
    }
    if (!kp.cpu && !this.pick.keep && kp.pressed('ok')) { this.pick.keep = kp.zone(); this.hintText(); }
    if (!kp.cpu && this.A.distract && kp.cur.alt !== !!this.distracting) {        // MIND GAMES: hold the chip key to wave your arms
      this.distracting = !!kp.cur.alt; this.gkSpr.play(this.distracting ? this.A.distract : this.A.ready);
    }
    if (this.pick.take && !this.shaken && this.distracting && s !== 'base') { this.shaken = true; this.pick.take.err += 0.12; this.sub.setText('MIND GAMES!'); this.time.delayedCall(900, () => { if (!this.result) this.sub.setText(''); }); }
    if (left <= 0) {                                                             // time's up: what they hold is what they get
      const idle = z => !z.side && !z.high, rz = () => ({ side: [-1, 1, -1, 1, 0][Math.floor(Math.random() * 5)], high: Math.random() < 0.35 });   // v0.8.3
      if (!this.pick.take) this.pick.take = s === 'tech' ? { ...this.aim, power: 0.6, err: 0.45 } : { ...zoneAim(this.lockZone || (idle(tk.zone()) ? rz() : tk.zone())), power: Math.max(0.5, this.charge), err: 0.35 };
      if (!this.pick.keep) this.pick.keep = kp.cpu || idle(kp.zone()) ? this.cpuKeep() : kp.zone();   // (nobody touched it: a random pick, not centre forever)
    }
    this.cnt.setText(left <= 3.2 && left > 0 && !(this.pick.take && this.pick.keep) ? String(Math.ceil(left)) : '');
    const tag = (c, done) => c.cpu ? '' : `${c.kind === 'p1' ? 'P1' : c.kind === 'p2' ? 'P2' : 'YOU'} ${done ? 'READY ✓' : '...'}`;
    this.tagT.setText(tag(tk, !!this.pick.take)); this.tagK.setText(tag(kp, !!this.pick.keep));
    if (this.pick.take && this.pick.keep) this.startRun();
  }
  meterVal() { const u = (this.meter / 0.9) % 2; return u < 1 ? u : 2 - u; }        // 0 -> 1 -> 0, green near 0.75
  startRun() {
    const t = this.pick.take, s = this.style;
    this.placing = false; this.tweens.killTweensOf(this.tkSpr); SFX.whistle(1);
    this.state = 'runup'; this.t = 0; this.cnt.setText(''); this.hint.setVisible(false); this.title.setText('');
    this.strikeT = MAN.penalty.strikeT * (t.chip ? 1.5 : s === 'wild' && t.power > 0.85 ? 1.15 : 1);
    const a = t.chip ? this.A.chip : s === 'wild' && t.power > 0.8 ? this.A.power : null;
    this.tkSpr.play(a || this.A.run); if (t.chip && !this.A.chip) this.tkSpr.anims.timeScale = 0.7;
    this.tagT.setText(''); this.tagK.setText('');
    if (this.distracting) { this.distracting = false; this.gkSpr.play(this.A.ready); }
    if (s === 'wild' && t.power > 0.88) { this.sub.setText('SUPER SHOT!'); this.time.delayedCall(700, () => { if (!this.result) this.sub.setText(''); }); }
  }
  // the keeper goes just before the strike: the side and height he picked
  commitKeeper() {
    const k = this.pick.keep; this.dive = k.side || 0; this.diveT = 0;
    this.lift = this.dive ? (k.high ? 1.15 : 0.15) : (k.high ? 0.55 : 0);
    const hi = k.high && this.A.highL && this.A.highR;                             // batch 7: the high tip-over dive
    if (this.dive < 0) this.gkSpr.play(hi ? this.A.highL : this.A.diveL || this.A.ready); else if (this.dive > 0) this.gkSpr.play(hi ? this.A.highR : this.A.diveR || this.A.ready);
  }
  keeperTick(dt) {
    if (this.diveT < 0 || this.standing) return; this.diveT += dt;
    const P = MAN.penalty, reach = P.diveReach * (this.stretch ? 1.15 : 1), k = clamp(this.diveT / P.diveTime, 0, 1);
    this.kx = this.dive * reach * Math.sin(k * Math.PI / 2);                      // fast off the line, slowing at full stretch
    this.ky = (this.lift || 0) * Math.sin(Math.min(1, this.diveT / (P.diveTime * 1.6)) * Math.PI);   // up and back down
    const kb = this.proj(this.kx - this.dive * P.diveDrift * Math.sin(k * Math.PI / 2), this.ky, this.C.zg - 0.3);
    this.gkSpr.setPosition(Math.round(kb.x), Math.round(kb.y));
  }
  // WILD: press as the ball reaches you = a last-moment stretch (a ring closes on the ball)
  stretchTick() {
    if (this.style !== 'wild' || this.stretchTry || this.result) return;
    const b = this.ball, C = this.C, tLeft = (C.zg - 0.3 - b.z) / Math.max(1, b.vz), kp = this.ct.keep;
    if (kp.cpu) { if (tLeft < 0.12) { this.stretchTry = true; this.stretch = Math.random() < 0.45; } }
    else if (kp.pressed('ok')) { this.stretchTry = true; this.stretch = tLeft < 0.22 && tLeft > -0.02; }
    if (this.stretchTry && this.stretch) { this.sub.setText('STRETCH!'); this.cameras.main.shake(90, 0.004); }
  }
  strike() {
    const C = this.C, b = this.ball, t = this.pick.take, p = t.power, s = this.style;
    SFX.kick(t.chip ? 0.3 : p);
    let tx, ty, speed;
    if (t.chip) { tx = t.x + rnd(-t.err, t.err); ty = t.y + rnd(-0.15, 0.15); speed = 12.5; }
    else {
      const miss = p > 0.93 ? (p - 0.93) * (s === 'wild' ? 18 : 14) : 0;          // too much power: it can fly
      tx = t.x + rnd(-t.err, t.err); ty = Math.max(0.05, t.y + rnd(-t.err, t.err) * 0.6 + rnd(0, miss));
      speed = 15 + p * (s === 'wild' ? 19 : 15);                                 // 54 - 108 km/h (wild: up to 122)
    }
    const T = 11 / speed;
    b.x = 0; b.y = 0.11; b.z = C.Dc; b.vx = tx / T; b.vz = speed; b.vy = (ty - 0.11 + 0.5 * G * T * T) / T;
    this.state = 'flight'; this.t = 0; this.shot = { tx, ty, speed: +speed.toFixed(1), power: +p.toFixed(2), chip: !!t.chip, style: s };
    this.cameras.main.shake(s === 'wild' ? 220 : 120, (s === 'wild' ? 0.009 : 0.004) * (0.5 + p));
    if (s === 'wild') { this.cameras.main.zoomTo(1.1, 160); if (p > 0.88) this.cameras.main.flash(120, 255, 222, 30); }
  }
  fly(dt) {
    const C = this.C, b = this.ball, P = MAN.penalty, n = 4;
    for (let i = 0; i < n; i++) {
      const h = dt / n, oz = b.z;
      b.vy -= G * h; b.x += b.vx * h; b.y += b.vy * h; b.z += b.vz * h;
      if (b.y < 0.11 && b.vy < 0) { b.y = 0.11; b.vy = -b.vy * 0.45; b.vx *= 0.85; b.vz *= 0.85; }
      if (this.result) { if (this.result.kind === 'goal' && b.z > C.zg + 1.2) { b.vz = 0; b.vx *= 0.5; b.z = C.zg + 1.2; } continue; }
      const kz = C.zg - 0.3;
      if (oz < kz && b.z >= kz) {                                                 // the ball reaches the keeper's plane
        const k = this.diveT < 0 ? 0 : clamp(this.diveT / P.diveTime, 0, 1), st = this.stretch ? 1 : 0;
        const ky = this.ky || 0, w = (this.dive ? 0.5 + 0.45 * k : 0.75) + st * 0.45, top = (this.dive ? 1.4 + 0.5 * k : 2.25) + ky + st * 0.35;
        const bot = this.dive ? Math.max(0, ky - 0.5) : 0, gap = Math.abs(b.x - this.kx);
        if (gap < w && b.y < top && b.y > bot) {
          const caught = b.vz < (this.dive ? 21 : 26) && gap < (this.dive ? 0.35 : 0.5) && b.y < 1.7 + ky;
          this.end(caught ? 'saved' : 'parried', { gap: +gap.toFixed(2) });
          if (caught) { b.vx = b.vy = b.vz = 0; b.x = this.kx; b.y = 1.0; b.held = true; if (!this.dive && this.A.catchS) this.gkSpr.play(this.A.catchS); }
          else { b.vz = -b.vz * 0.25; b.vx = (b.x >= this.kx ? 1 : -1) * rnd(3, 6); b.vy = rnd(2, 5); }
          continue;
        }
      }
      if (oz < C.zg && b.z >= C.zg) {                                             // the goal line
        const inX = Math.abs(b.x) < 3.66 - 0.11, inY = b.y < 2.44 - 0.11;
        const post = !inX && Math.abs(Math.abs(b.x) - 3.66) < 0.22 && b.y < 2.55, barHit = inX && Math.abs(b.y - 2.44) < 0.2;
        if (inX && inY) this.end('goal');
        else if (post || barHit) { this.end('post'); b.vz = -b.vz * 0.4; b.vx = -b.vx * 0.3 + rnd(-2, 2); }
        else this.end('miss');
      }
    }
    if (this.result && this.result.kind !== 'goal' && b.z > C.zg + 6) { b.vx = b.vy = b.vz = 0; }
  }
  // ---- the outcome, with reactions on both sides
  end(kind, extra = {}) {
    const s = this.style, cam = this.cameras.main, wild = s === 'wild';
    const text = { goal: 'GOAL!!', saved: 'SAVED!', parried: 'SAVED!', miss: 'MISSED!', post: 'OFF THE POST!' }[kind];
    this.result = { kind, dive: this.dive, high: !!(this.pick.keep && this.pick.keep.high), stretch: this.stretch, ...this.shot, ...extra };
    this.big.setText(text); this.hint.setVisible(false); this.state = 'done'; this.t = 0;
    if (kind === 'goal') { SFX.net(); SFX.roar(4, 1); } else if (kind === 'post') { SFX.post(); SFX.ooh(); } else if (kind === 'miss') SFX.ooh(); else { SFX.catch(); SFX.roar(2.5, 0.6); }
    if (this.rami) {
      if (kind === 'goal') this.rami.say('goal', this.shot && this.shot.chip ? { text: 'A PANENKA!!\nCHEEKY!', expr: 'laugh' } : {}, 3);
      else if (kind === 'post') this.rami.say('post', {}, 3);
      else if (kind === 'miss') this.rami.say('miss', { text: 'OHHH! HE HAS\nPUT IT WIDE!' }, 3);
      else this.rami.say('save', {}, 3);
    }
    if (!this.stretch || kind === 'goal') this.sub.setText(this.shot.chip && kind === 'goal' ? 'CHIPPED IT!' : '');
    const later = (ms, fn) => this.time.delayedCall(ms, fn);
    const stand = a => { if (!a) return; this.standing = true; const kb = this.proj(this.kx, 0, this.C.zg - 0.3); this.gkSpr.setPosition(Math.round(kb.x), Math.round(kb.y)); this.gkSpr.play(a); };
    if (wild) later(250, () => cam.zoomTo(1, 400));
    if (kind === 'goal') {
      if (wild) cam.flash(220, 255, 255, 255);
      later(350, () => this.A.cele && this.tkSpr.play(this.A.cele));
      later(650, () => stand(this.A.kDefeat));
      if (this.d.m && this.d.m.stadium) this.d.m.stadium.cheer(4);
    } else if (kind === 'saved' || kind === 'parried') {
      if (wild) { cam.flash(180, 40, 200, 230); cam.shake(200, 0.006); }
      later(450, () => this.A.miss && this.tkSpr.play(this.A.miss));
      later(kind === 'saved' ? 900 : 700, () => stand(this.A.kCele));
    } else {
      later(400, () => this.A.miss && this.tkSpr.play(this.A.miss));
      later(800, () => stand(this.A.kCele || this.A.kIdle));
    }
  }
  draw() {
    const g = this.g, b = this.ball, C = this.C, s = this.style; g.clear();
    if (b.held) { const kb = this.proj(this.kx, (this.dive ? 0.45 : 1.0) + (this.ky || 0), C.zg - 0.35); this.ballSpr.setPosition(kb.x, kb.y).setScale(kb.s * 0.22 / ballPx() * PEN_BALL_S).setDepth(12); this.shadow.setVisible(false);
      if (this.standing) this.ballSpr.setVisible(false); }
    else {
      const p = this.proj(b.x, b.y + 0.11 * (PEN_BALL_S - 1), b.z), sh = this.proj(b.x, 0, b.z), sc = p.s * 0.22 / ballPx() * PEN_BALL_S;   // drawn big, still sits on the grass
      this.ballSpr.setPosition(Math.round(p.x), Math.round(p.y - (13 - ballPx() / 2) * sc)).setScale(sc).setDepth(b.z > C.zg - 0.3 ? 8 : 20)
        .setFrame(`ball-y${Math.floor((this.t * 30 * (this.state === 'flight' ? 1 : 0)) % 8)}`);
      this.shadow.setVisible(true).setPosition(Math.round(sh.x), Math.round(sh.y - 7.5 * sc)).setScale(sc).setAlpha(clamp(1 - b.y / 4, 0.3, 0.9)).setDepth(b.z > C.zg - 0.3 ? 7 : 19);
      this.ballSpr.setVisible(!this.placing);                                    // his hands hold the ball while he places it
    }
    if (this.state === 'pick') {
      const tk = this.ct.take, kp = this.ct.keep;
      const box = (z, col) => {                                                  // a zone of the goal: a third wide, half high
        const x0 = z.side * 2.44 - 1.22, y0 = z.high ? 1.22 : 0, a = this.proj(x0, y0 + 1.22, C.zg), c = this.proj(x0 + 2.44, y0, C.zg);
        g.lineStyle(3, 0x0c0a0e).strokeRect(a.x, a.y, c.x - a.x, c.y - a.y).lineStyle(2, col).strokeRect(a.x + 1, a.y + 1, c.x - a.x - 2, c.y - a.y - 2);
      };
      if (!this.secret) {
        if (!tk.cpu && !this.pick.take) {
          if (s === 'tech') {
            const a = this.proj(this.aim.x, this.aim.y, C.zg), r = 9;
            g.lineStyle(3, 0x0c0a0e).strokeCircle(a.x, a.y, r + 1).lineStyle(2, 0xffde1e).strokeCircle(a.x, a.y, r)
              .lineBetween(a.x - r - 5, a.y, a.x - r + 3, a.y).lineBetween(a.x + r - 3, a.y, a.x + r + 5, a.y)
              .lineBetween(a.x, a.y - r - 5, a.x, a.y - r + 3).lineBetween(a.x, a.y + r - 3, a.x, a.y + r + 5);
          } else box(this.charge >= 0 ? this.lockZone : tk.zone(), 0xffde1e);
        }
        if (!kp.cpu && !this.pick.keep) box(kp.zone(), 0x28c8e6);
      }
      const W = 220, x0 = PEN_W / 2 - W / 2, y0 = PEN_H - 100;
      if (s === 'wild' && this.charge >= 0 && !this.pick.take) {                  // power: past the white line it can fly
        g.fillStyle(0x0c0a0e).fillRect(x0 - 3, y0 - 3, W + 6, 16).fillStyle(this.charge > 0.93 ? 0xff2878 : 0xffde1e).fillRect(x0, y0, Math.round(W * this.charge), 10)
          .fillStyle(0xf4f0e4).fillRect(x0 + Math.round(W * 0.93), y0 - 3, 2, 16);
      }
      if (s === 'tech' && this.meter >= 0 && !this.pick.take) {                   // stop it in the green
        const v = this.meterVal();
        g.fillStyle(0x0c0a0e).fillRect(x0 - 3, y0 - 3, W + 6, 16).fillStyle(0x3a3542).fillRect(x0, y0, W, 10)
          .fillStyle(0x7cff9a).fillRect(x0 + Math.round(W * 0.68), y0, Math.round(W * 0.14), 10)
          .fillStyle(0xffde1e).fillRect(x0 + Math.round(W * v) - 2, y0 - 4, 4, 18);
      }
    }
    if (s === 'wild' && this.state === 'flight' && !this.result && !this.ct.keep.cpu && !this.stretchTry) {   // the stretch ring closes on the ball
      const tLeft = (C.zg - 0.3 - b.z) / Math.max(1, b.vz), p = this.proj(b.x, b.y, b.z), r = 10 + Math.max(0, tLeft) * 90;
      if (tLeft < 0.6) g.lineStyle(3, tLeft < 0.22 ? 0x7cff9a : 0xf4f0e4, 0.9).strokeCircle(p.x, p.y, r);
    }
    const so = this.d.shootout;                                                  // 1v1 shoot-out: the score so far
    if (so) {
      const F = (i, y) => {
        const marks = so.marks[i], xs = PEN_W / 2 - 40;
        g.fillStyle(0x0c0a0e, 0.7).fillRect(xs - 150, y - 10, 330, 22);
        for (let k = 0; k < Math.max(5, marks.length + (so.shooter === i ? 1 : 0)); k++) {
          const cx = xs + 24 + k * 20, m = marks[k];
          if (m === true) g.fillStyle(0x7cff9a).fillCircle(cx, y + 1, 7); else if (m === false) g.fillStyle(0xff2878).fillCircle(cx, y + 1, 7);
          else g.lineStyle(2, so.shooter === i && k === marks.length ? 0xffde1e : 0xf4f0e4).strokeCircle(cx, y + 1, 6);
        }
      };
      F(0, 64); F(1, 90);
      if (!this.soT) { this.soT = [0, 1].map(i => this.add.text(PEN_W / 2 - 186, [64, 90][i] + 1, so.names[i], { fontFamily: '"Press Start 2P"', fontSize: '10px', color: '#f4f0e4' }).setOrigin(0, 0.5).setDepth(51)); }
    }
  }
}

// ------------------------------------------------------------------ boot the game with crisp pixel scaling
function bestZoom() {
  const el = document.getElementById('game'), W = (el && el.clientWidth) || innerWidth, H = (el && el.clientHeight) || innerHeight;   // v0.8.5: the space the page gives the game (the Test Lab has a side panel)
  const fit = Math.min(W / VIEW_W, H / VIEW_H);
  return fit >= 1 && fit - Math.floor(fit) < 0.15 ? Math.floor(fit) : fit;   // whole-number zoom when it's close, otherwise fill the space
}
window.addEventListener('load', async () => {
  try { await document.fonts.load('16px "Press Start 2P"'); } catch (e) {}
  const game = new Phaser.Game({
    // v0.7.6 SAFE MODE (phones): plain canvas, no WebGL
    type: window.HC2_SAFE ? Phaser.CANVAS : Phaser.AUTO, parent: 'game', width: VIEW_W, height: VIEW_H, backgroundColor: '#0c0a0e',
    pixelArt: true, roundPixels: true, scene: [Boot, Load, Match, PenaltyScene],
    scale: { mode: Phaser.Scale.NONE, zoom: bestZoom() },
    input: { gamepad: false }, render: { antialias: false, powerPreference: 'high-performance' },
  });
  addEventListener('resize', () => game.scale.setZoom(bestZoom()));
  setupTouch();
  window.__game = game;
});
