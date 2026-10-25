// HC2 TEST LAB - every situation on its own, replayed at a key press, so we can judge it and fix it one by one.
// It runs the real game (game/src): this file only sets each situation up, measures what happens, draws the hit
// boxes and saves your rating. Same dice on every replay (R), new dice with F.
'use strict';
(function () {
  const STEP = 1 / 60;                      // fixed simulation step: replays are identical
  const GX = PITCH_L, LINE_X = PITCH_L - 1.3;
  const LAB = { groups: [], g: 0, i: 0, run: null, slow: 1, boxes: true, rated: {}, log: [], db: null, reasons: null,
    menu: false, acc: 0, rand: Math.random, active: false, zoom: (() => { try { return clamp(+localStorage.getItem('hc2-lab-zoom') || 1, 0.5, 2); } catch (e) { return 1; } })(),
    fp: { tap: true, sp: false, max: false, stam: false, nogk: false, inj: false, gkv: true, wx: 'clear', save: 0, cpu: 'normal', loop: false, anim: '' }, tune: null, base: null };
  let m = null;
  const $ = id => document.getElementById(id);

  // ---------- dice: seeded per run, only inside the simulation (the crowd keeps its own)
  const rng = seed => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const hash = s => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };

  // ---------- aiming maths (same ball physics as the game)
  // height of a ball struck at `speed` (upward `vz`) after `d` metres; -1 if it touched the grass first
  function heightAt(speed, vz, d) {
    const c = { x: 0, y: 0, z: 0.05, vx: speed, vy: 0, vz, skid: true, rollV: 0.72 * speed }, h = 1 / 240;
    for (let t = 0; t < 5; t += h) { ballStep(c, h, false); if (c.x >= d) return c.z; if (c.z <= 0 && t > 0.02) return -1; if (c.vx < 0.3) return -1; }
    return -1;
  }
  function vzFor(d, tz, speed) { let lo = 0.3, hi = 14; for (let k = 0; k < 32; k++) { const mid = (lo + hi) / 2; if (heightAt(speed, mid, d) < tz) lo = mid; else hi = mid; } return (lo + hi) / 2; }
  // a ball in the air that comes down through height `tz` at (tx, ty) after about T seconds
  function aimAir(fx, fy, tx, ty, tz, T) {
    const d = len(tx - fx, ty - fy); T = Math.max(T, d / 24);                    // nobody crosses faster than ~86 km/h
    let v = d / T; const vz = (tz - 0.05 + 0.5 * G * T * T) / T;
    for (let it = 0; it < 8; it++) {
      const c = { x: 0, y: 0, z: 0.05, vx: v, vy: 0, vz, skid: true, rollV: 0 }, h = 1 / 240; let at = null, pz = c.z;
      for (let t = 0; t < 6; t += h) { ballStep(c, h, false); if (c.vz < 0 && pz >= tz && c.z < tz) { at = c.x; break; } if (c.z <= 0 && t > 0.05) { at = c.x; break; } pz = c.z; }
      if (!at) break; v *= d / at;
    }
    return { speed: v, vz };
  }
  const kmh = v => Math.round(v * 3.6);
  const faceTo = (p, x, y) => { p.face = dirIndex(x - p.x, y - p.y); };

  // ---------- who is on the pitch
  function cast(list) {
    for (const p of m.all) {
      const on = list.includes(p);
      Object.assign(p, { sentOff: !on, state: 'idle', stateT: 0, vx: 0, vy: 0, speed: 0, hands: false, cool: on ? 0 : 1e9, stun: on ? 0 : 1e9,
        anim: '', kickAnim: null, yellows: 0, fouls: 0, injury: null, spSave: 0, pierced: null, rig: null, bike: false, stamina: 1, tired: false, sprinting: false, wantDir: null, hold: 0, touchT: 0, think: 0 });
      if (!on) { p.x = -60; p.y = -60; }
    }
  }
  const put = (p, x, y, face) => { p.x = x; p.y = y; if (face != null) p.face = face; p.vx = p.vy = 0; };
  function ballAt(x, y, z = 0, owner = null) {
    Object.assign(m.ball, { x, y, z, vx: 0, vy: 0, vz: 0, owner, last: owner ? owner.team : m.away, lastP: owner, inNet: false, netRight: undefined,
      target: null, skid: false, save: null, tried: null, roll: 0, special: 0, spP: 0, spF: 1, pierce: 0, spTeam: null, power: 0, cv: 0 });   // (t-011: nor a curving pass)   // (v0.8.8: a fresh ball is never still a special)
  }
  // the ball in front of a standing player, the way the game keeps it at his feet
  function atFeet(p) { const d = dirVec(p.face); ballAt(p.x + d.x * 0.5, p.y + d.y * 0.42, 0, p); }

  // ---------- bots (the lab's stand-ins for the match AI)
  const dribbleTo = (tx, ty, v) => (p, dt) => {
    const b = m.ball; if (b.owner !== p || p.busy()) { p.steer(0, 0, dt); return; }
    const dx = tx - p.x, dy = ty - p.y, d = len(dx, dy) || 1; p.wantDir = { x: dx / d, y: dy / d }; m.carrySteer(p, dx / d, dy / d, v, dt);
  };
  // an attacker attacking a cross: gets under the ball at head height if he can, otherwise meets it low
  const attackBall = (p, dt) => {
    const b = m.ball; if (b.owner) { p.steer(0, 0, dt); return; }
    const P = m.path; if (!P) { p.steer(0, 0, dt); return; }
    const pt = P.find(q => q.z > 0.9 && q.z < 2.3 && 0.1 + len(q.x - p.x, q.y - p.y) / RUN <= q.t) || P.find(q => q.z < 0.9 && 0.1 + len(q.x - p.x, q.y - p.y) / RUN <= q.t);
    if (pt) p.moveTo(pt.x, pt.y, RUN, dt); else p.steer(0, 0, dt);
  };
  const receive = (p, dt) => { const b = m.ball; if (b.owner || b.target !== p) { p.steer(0, 0, dt); return; } const pt = m.intercept(p, RUN); p.moveTo(pt.x, pt.y, RUN, dt); };

  // ---------- the tests
  const SPOTS = [
    { n: 'penalty spot (11 m)', x: 94, y: 34 }, { n: 'edge of the box (17 m)', x: 88, y: 34 },
    { n: 'angle, top side', x: 93, y: 24 }, { n: 'angle, bottom side', x: 93, y: 44 },
    { n: 'close range (6 m)', x: 99, y: 30.5 }, { n: 'long range (25 m)', x: 80, y: 36 },
  ];
  const TGT = [
    { n: 'low, TOP post', y: GOAL_Y0 + 0.7, low: true }, { n: 'low, BOTTOM post', y: GOAL_Y1 - 0.7, low: true },
    { n: 'high, TOP corner', y: GOAL_Y0 + 0.8, z: 2.0 }, { n: 'high, BOTTOM corner', y: GOAL_Y1 - 0.8, z: 2.0 },
    { n: 'straight at him, chest high', y: null, z: 1.1 },
  ];
  // striker (home 10) + keeper (away 1, right-hand goal)
  function shotSetup(r, spot, you) {
    const s = m.home.players[9], gk = m.away.players[0]; cast([s, gk]);
    const f = dirIndex(GX - spot.x, 34 - spot.y), dv = dirVec(f);
    put(s, spot.x - dv.x * 0.5, spot.y - dv.y * 0.42, f); ballAt(spot.x, spot.y, 0, s);
    put(gk, LINE_X, 34 + (spot.y - 34) * 0.3, 4);
    Object.assign(r, { human: s, shooter: s, gk, you });
  }
  function fireShot(r, tgt, speed, power) {
    const b = m.ball, gk = r.gk, ty = tgt.y == null ? gk.y : tgt.y, d = len(GX - b.x, ty - b.y);
    const vz = tgt.low ? 0.35 : vzFor(d, tgt.z, speed);
    const tx = GX + 2, aty = b.y + (ty - b.y) * (tx - b.x) / (GX - b.x);       // so the straight line crosses the goal line at ty
    m.kick(r.shooter, tx, aty, speed, vz, 0.13, { shot: true, power });
    r.aim = { y: ty, z: tgt.low ? 0 : tgt.z };
  }
  function shotTest(id, group, spot, tgt, speed, power, label) {
    return { id, group, name: `${spot.n} → ${tgt.n}`, sub: label || `${kmh(speed)} km/h`, kind: 'shot',
      setup(r) { shotSetup(r, spot, false); const ty = tgt.y == null ? r.gk.y : tgt.y; r.marks = [{ x: GX, y: ty, r: 0.3 }];
        r.action = { at: 0.7, fire: () => fireShot(r, tgt, speed, power) }; },
      check: shotCheck };
  }
  function shotCheck(r) {
    const b = m.ball;
    if (r.shotT == null && b.owner === r.gk) return { o: 'KEEPER TOOK THE BALL OFF YOUR FEET' };
    if (r.shotT == null) { if (!b.owner && b.lastP === r.shooter && r.fired) r.shotT = r.t; else return null; }
    if (b.inNet) return { o: 'GOAL', hold: 1.4 };
    if (b.owner === r.gk) return { o: 'SAVED · caught' };
    if (r.ev('PARRIED')) return { o: 'SAVED · parried', hold: 1.2 };
    if (r.ev('BLOCKED')) return { o: 'BLOCKED' };
    if (r.out) return { o: r.out === 'CORNER' ? 'OUT · corner (off the keeper)' : 'OUT · wide or over' };
    if (r.t - r.shotT > 4) return { o: 'NOTHING · ball still loose' };
    return null;
  }

  const CROSS_FROM = [{ n: 'top byline', x: 100, y: 5, near: 31.5, far: 36.5 }, { n: 'bottom byline', x: 100, y: 63, near: 36.5, far: 31.5 }];
  function crossTest(id, from, to, type) {
    const tgt = to === 'near' ? { x: 101.5, y: from.near, n: 'near post' } : to === 'far' ? { x: 101.5, y: from.far, n: 'far post' } : { x: 94, y: 34, n: 'penalty spot' };
    const hi = type === 'high', tz = hi ? 1.9 : 1.0, dd = len(tgt.x - from.x, tgt.y - from.y), T = hi ? dd / 15 : dd / 22;
    return { id, group: 'C', name: `${hi ? 'high, hanging' : 'low, driven'} cross from the ${from.n} → ${tgt.n}`, sub: 'an attacker attacks it, the keeper decides', kind: 'cross',
      setup(r) {
        const c = m.home.players[7], a = m.home.players[9], gk = m.away.players[0]; cast([c, a, gk]);
        put(c, from.x, from.y + (from.y < 34 ? -0.5 : 0.5)); faceTo(c, tgt.x, tgt.y); atFeet(c);
        put(a, tgt.x - 4, tgt.y + (tgt.y - 34) * 0.2, 0); put(gk, LINE_X, 34 + (from.y - 34) * 0.12, 4);
        Object.assign(r, { human: c, shooter: c, gk, att: a, marks: [{ x: tgt.x, y: tgt.y, r: 0.5 }] });
        r.bots.set(a, attackBall);
        r.action = { at: 0.7, fire: () => { const b = m.ball, s = aimAir(b.x, b.y, tgt.x, tgt.y, tz, T); m.kick(c, tgt.x, tgt.y, s.speed, s.vz, 0.13, {}); } };
      },
      check(r) {
        const b = m.ball; if (r.att.state === 'header' || r.att.state === 'dheader') r.headed = true;
        if (r.shotT == null) { if (!b.owner && r.fired && b.lastP === r.shooter) r.shotT = r.t; else return null; }
        const pre = r.headed ? 'HEADER → ' : '';
        if (b.inNet) return { o: pre + 'GOAL', hold: 1.4 };
        if (b.owner === r.gk) return { o: pre + 'KEEPER CLAIMS IT' };
        if (b.owner === r.att) return { o: 'ATTACKER CONTROLS IT' };
        if (r.ev('PARRIED')) return { o: pre + 'KEEPER PARRIES', hold: 1.2 };
        if (r.out) return { o: pre + 'OUT · ' + r.out.toLowerCase() };
        if (r.t - r.shotT > 5) return { o: pre + 'NOBODY GETS IT' };
        return null;
      } };
  }

  function physTest(id, name, sub, opts) {
    return { id, group: opts.group || 'P', name, sub, kind: 'phys', wx: opts.wx,
      setup(r) {
        const p = m.home.players[6], q = m.home.players[9]; cast(opts.rcv ? [p, q] : [p]);
        const sx = opts.from || 40;
        put(p, sx - 0.5, 34, 0); atFeet(p); Object.assign(r, { human: p, shooter: p, marks: opts.marks || [] });
        if (opts.rcv) { put(q, sx + opts.rcv, 34, 4); r.rcv = q; r.bots.set(q, receive); }
        if (opts.drop) { cast([p]); put(p, sx - 6, 30, 0); ballAt(sx, 34, opts.drop); r.fired = true; r.shotT = 0; r.start = { x: sx, y: 34 }; r.human = p; return; }
        r.action = { at: 0.5, fire: () => { const b = m.ball; const t = opts.to;
          if (opts.mode) m.kick(p, b.x + t, 34, 0, 0, 0.12, { mode: opts.mode, target: r.rcv || null });
          else m.kick(p, b.x + t, 34, opts.speed, opts.vz, 0.12, {}); } };
      },
      check: physCheck };
  }
  function physCheck(r) {
    const b = m.ball;
    if (r.shotT == null) { if (!b.owner && r.fired && !m.pending) { r.shotT = r.t; r.start = { x: b.x, y: b.y }; } else return null; }
    const dist = len(b.x - r.start.x, b.y - r.start.y), tt = (r.t - r.shotT).toFixed(2), wx = r.sc.wx && r.sc.wx !== 'clear' ? ` · ${WX_NAME[r.sc.wx]}` : '';
    if (r.rcv && b.owner === r.rcv) return { o: `CONTROLLED by the team-mate after ${tt} s${wx}` };
    if (b.inNet) return { o: `reached the goal after ${tt} s (${dist.toFixed(1)} m)${wx}` };
    if (r.out) return { o: `went out after ${dist.toFixed(1)} m${wx}` };
    if (r.t - r.shotT > 0.4 && len(b.vx, b.vy) < 0.05 && b.z <= 0 && Math.abs(b.vz) < 0.01) return { o: `STOPPED ${dist.toFixed(1)} m away, after ${tt} s · top ${r.maxZ.toFixed(1)} m up${wx}`, hold: 0.3 };
    if (r.t - r.shotT > 12) return { o: 'still rolling after 12 s' };
    return null;
  }

  function moveTest(id, group, name, withBall, rings, extra) {
    return { id, group, name, sub: withBall ? 'you have the ball' : 'no ball', kind: 'move', you: true,
      setup(r) {
        const p = m.home.players[9], list = [p]; if (extra) list.push(m.away.players[4]); cast(list);
        put(p, 40, 34, 0); r.human = p; r.marks = rings.map(([x, y]) => ({ x, y, r: 0.9 })); r.cam = () => ({ x: p.x + 6, y: p.y });
        if (extra) { const d = m.away.players[4]; put(d, 52, 34, 4); }
        if (withBall) atFeet(p); else ballAt(30, 64);
        r.fired = true;
      },
      check() { return null; } };
  }

  function tackleTest(id, name, how, slide, from, to, me, v) {
    return { id, group: 'T', name, sub: how, kind: 'tackle', you: true,
      setup(r) {
        const you = m.home.players[4], d = m.away.players[9]; cast([you, d]);
        put(you, me[0], me[1]); faceTo(you, from[0], from[1]); put(d, from[0], from[1]); faceTo(d, to[0], to[1]); atFeet(d);
        Object.assign(r, { human: you, drib: d, cam: () => ({ x: (you.x + d.x) / 2, y: (you.y + d.y) / 2 }) });
        r.bots.set(d, dribbleTo(to[0], to[1], v)); r.fired = true; r.slide = slide;
      },
      check(r) {
        const b = m.ball;
        if (b.owner === r.human) return { o: 'YOU WON THE BALL' };
        if (r.out) return { o: (r.out === 'FREE KICK' || r.out === 'PENALTY') ? `FOUL · ${r.out.toLowerCase()}${r.outNote ? ' · ' + r.outNote.toLowerCase() : ''}` : 'OUT' };
        if (r.drib.x < 37) return { o: 'HE GOT PAST YOU' };
        if (!b.owner) { r.looseT = (r.looseT || 0) + STEP; if (r.looseT > 2.0) return { o: 'BALL KNOCKED LOOSE' }; }
        if (r.t > 9) return { o: 'TIME UP' };
        return null;
      } };
  }

  function airTest(id, name, how, tgt, tz, T, targeted) {
    return { id, group: 'A', name, sub: how, kind: 'air', you: true,
      setup(r) {
        const you = m.home.players[9], c = m.home.players[7], gk = m.away.players[0]; cast([you, c, gk]);
        put(you, 94, 33, 0); put(c, 100, 5.5); faceTo(c, tgt[0], tgt[1]); atFeet(c); put(gk, LINE_X, 33, 4);
        Object.assign(r, { human: you, shooter: c, gk, marks: [{ x: tgt[0], y: tgt[1], r: 0.5 }] });
        r.action = { at: 0.8, fire: () => { const b = m.ball, s = aimAir(b.x, b.y, tgt[0], tgt[1], tz, T); m.kick(c, tgt[0], tgt[1], s.speed, s.vz, 0.13, { target: targeted ? you : null }); } };
      },
      check(r) {
        const b = m.ball, you = r.human;
        if (r.shotT == null) { if (!b.owner && r.fired && b.lastP === r.shooter) r.shotT = r.t; else return null; }
        if (b.inNet) return { o: 'GOAL', hold: 1.4 };
        if (b.owner === you) return { o: you.state === 'trap' ? 'CONTROLLED · chest trap' : 'CONTROLLED' };
        if (b.owner === r.gk) return { o: b.lastP === you ? 'YOUR SHOT · SAVED' : 'KEEPER CLAIMS THE CROSS' };
        if (r.ev('PARRIED')) return { o: 'YOUR SHOT · PARRIED', hold: 1.2 };
        if (r.out) return { o: 'OUT · ' + r.out.toLowerCase() };
        if (r.t - r.shotT > 5) return { o: 'NOTHING HAPPENED' };
        return null;
      } };
  }

  // penalties: the penalty camera (PenaltyScene); you take it, you keep, or the computer v the computer with a set
  // target and a set dive, to judge the keeper's dives and the contact
  function penTest(id, name, sub, human, force) {
    return { id, group: 'PK', name, sub, kind: 'pen', you: !!human,
      setup(r) {
        const takeHome = human !== 'keep', team = takeHome ? m.home : m.away, s = team.players[9], gk = team.opp.players[0];
        cast([s, gk]); put(s, 94, 34, 0); put(gk, LINE_X, 34, 4); ballAt(94.5, 34);
        Object.assign(r, { human: s, fired: true });
        window.HC2_PEN_NO_RESUME = true;
        m.startPenalty(team, null, { human: human || null, force, taker: s, done: res => { r.pen = res; } });
      },
      check(r) {
        if (!r.pen) return null; const p = r.pen;
        const o = { goal: 'GOAL', saved: 'SAVED · caught', parried: 'SAVED · parried', miss: 'MISSED', post: 'OFF THE POST' }[p.kind] || p.kind;
        return { o: `${o} · keeper went ${p.dive < 0 ? 'left' : p.dive > 0 ? 'right' : 'nowhere'}`, hold: 0.1 };
      } };
  }

  // ---------- v0.8 FREE PLAY (Luca): you, the ball and a keeper. Toggles (full SP, max shot, endless sprint, no keeper),
  // buttons that make your player do each move, any animation on its own, and tuning sliders (lab only) to copy back.
  function freePlay() {
    return { id: 'FP1', group: 'FP', name: 'you, the ball and a keeper', sub: 'free', kind: 'free', you: true,
      setup(r) {
        const s = m.home.players[9], gk = m.away.players[0]; cast([s, gk]);
        put(s, 86, 34, 0); atFeet(s); put(gk, LINE_X, 34, 4); gk.guard = 1;
        Object.assign(r, { human: s, shooter: s, gk, fired: true, stats: { kicks: 0, shots: 0, goals: 0, held: 0 }, nogk: false });
        r.cam = () => { const b = m.ball, q = gk.state === 'labanim' ? gk : b.owner === s || !b.owner && len(b.x - s.x, b.y - s.y) < 4 ? s : b; return { x: q.x + (q === b ? clamp(b.vx * 0.35, -10, 10) : 0), y: q.y, sx: fpShift() }; };
      },
      check(r) { fpTick(r); return null; } };
  }
  function fpTick(r) {
    const p = r.human, b = m.ball, gk = r.gk, F = LAB.fp, mt = m.meters && m.meters[0];
    if (F.sp && mt) mt.e = 3;
    if (F.stam) { p.stamina = 1; p.tired = false; }
    if (!!p.injury !== F.inj) p.injury = F.inj ? { k: 0.75 } : null;              // v0.8.8 INJURED: he limps (75% speed)
    if (r.air) airTick(r, p, b, mt);
    if (F.nogk !== r.nogk) { r.nogk = F.nogk; if (F.nogk) { gk.sentOff = true; put(gk, -60, -60); } else { Object.assign(gk, { sentOff: false, cool: 0, stun: 0, hands: false, state: 'idle' }); put(gk, LINE_X, 34, 4); } }
    if (r.prevOwner === p && b.owner !== p) {                                    // it left your foot: measure this one
      Object.assign(r, { shotT: r.t, v0: null, maxZ: 0, line: null, plan: null, prevBX: null, peaks: null }); r.stats.kicks++;
    }
    r.prevOwner = b.owner;
    if (b.shotT && b.shotT !== r.lastShot) { r.lastShot = b.shotT; r.stats.shots++; }
    if (!r.resetAt) {
      let why = null;
      if (b.inNet) why = 'goal';
      else if (r.out) why = 'out';
      else if (b.owner === gk && gk.hands) { r.held = (r.held || 0) + STEP; if (r.held > 0.9) why = 'held'; }
      else if (!b.owner && len(b.x - p.x, b.y - p.y) > 28 && len(b.vx, b.vy) < 1 && b.z < 0.1) why = 'far';
      if (b.owner !== gk) r.held = 0;
      if (why) { r.resetAt = r.t + (why === 'goal' ? 1.6 : 1.0); r.why = why; if (why === 'goal') r.stats.goals++; if (why === 'held') r.stats.held++; }
    } else if (r.t >= r.resetAt) fpReset(r);
    const ap = F.anim && animWho(F.anim);
    if (F.loop && ap && ap.state !== 'labanim' && !ap.busy() && !m.pending) playAnim(F.anim);
  }
  // v0.8.8 (Luca: "add the aerial moves ... to test lab in buttons"): a ball is thrown in and your player does the move
  // himself the moment it's in reach - the same game code your keys would run (header, volley, diving header, overhead
  // kick, chest, the aerial specials). 3 s and nothing: the ball is gone past him.
  const AIR = {
    head: { name: 'HEADER', tz: 1.9, ok: (d, z) => d < 1.2 && z > 1.1 && z < 2.7, go: p => m.header(p, 'goal') },
    volley: { name: 'VOLLEY', tz: 0.7, ok: (d, z) => d < 2.2 && z > 0.3 && z < 1.3, go: p => { m.ball.owner = p; m.doShot(p, 0.65, rnd(-0.8, 0.8)); p.kickAnim = 'volley'; } },
    dive: { name: 'DIVING HEADER', tz: 0.8, ahead: 2.8, ok: (d, z, b, p) => d < 3.2 && z > 0.4 && z < 1.3 && (b.x - p.x) * b.vx + (b.y - p.y) * b.vy < 0, go: p => m.divingHeader(p) },
    bike: { name: 'OVERHEAD KICK', tz: 1.8, back: true, ok: (d, z) => d < 1.5 && z > 1.35 && z < 2.4, go: p => m.bicycle(p) },
    chest: { name: 'CHEST TRAP', tz: 1.25, chest: true },
    sp1: { name: 'AIR BLAZE', tz: 1.0, lv: 1, ok: (d, z) => d < 1.6 && z > 0.55 && z < 2.6 },
    sp2: { name: 'SKY THUNDER', tz: 1.6, lv: 2, back: true, ok: (d, z) => d < 1.6 && z > 0.55 && z < 2.6 },
    sp3: { name: 'PHOENIX FROM THE SKY', tz: 1.5, lv: 3, ok: (d, z) => d < 1.6 && z > 0.55 && z < 2.6 },
  };
  function airMove(r, p, key) {
    const A = AIR[key]; if (!A) return;
    if (A.back) p.face = dirIndex(-p.team.side, 0);                              // overhead: his back to the goal, the ball comes from upfield
    toss(p, A.tz, A.ahead);
    if (A.chest) m.ball.target = p;                                              // a ball played to him: he takes it on the chest
    r.air = { key, t0: r.t }; r.last = A.name + ' …';
  }
  function airTick(r, p, b, mt) {
    const A = AIR[r.air.key], d = len(b.x - p.x, b.y - p.y);
    if (A.chest) { if (b.owner === p) { r.last = p.state === 'trap' ? 'CHEST TRAP ✓' : 'CONTROLLED ✓'; r.air = null; } else if (r.t - r.air.t0 > 3) { r.last = 'CHEST TRAP · missed'; r.air = null; } return; }
    if (b.owner || r.resetAt || r.t - r.air.t0 > 3) { if (!b.owner || b.owner !== p) r.last = A.name + ' · ball never came'; r.air = null; return; }
    if (!A.ok(d, b.z, b, p) || p.busy()) return;
    if (A.lv) { if (mt) mt.e = A.lv; m.airSpecial(p); } else A.go(p);
    r.last = A.name + '!'; r.air = null;
  }
  function fpReset(r) {                                                          // the ball comes back to you where you are (E)
    r = r || LAB.run; if (!r || r.sc.kind !== 'free') return;
    const p = r.human, gk = r.gk, b = m.ball;
    Object.assign(m, { setPiece: null, pending: null, diving: null, freeze: 0, hitStop: 0, path: null, passRing: null, nextHuman: null, charge: -1, penaltyKick: false, dead: null });
    m.msg.setText(''); m.sub.setText('');
    if (p.busy()) p.setState('idle', 0); p.stun = 0; p.cool = 0;
    if (p.x > 101 || p.x < 2 || p.y < 1 || p.y > 67) put(p, 86, 34, 0);
    if (!r.nogk) { Object.assign(gk, { hands: false, stun: 0, cool: 0 }); if (gk.busy()) gk.setState('idle', 0); put(gk, LINE_X, 34, 4); }
    b.inNet = false; atFeet(p); r.out = null; r.resetAt = 0; r.held = 0; r.why = null; r.air = null;
  }
  function fpMini() { const on = $('fp').classList.toggle('mini'); $('fp-mini').innerHTML = on ? 'SHOW PANEL<kbd>Q</kbd>' : 'HIDE<kbd>Q</kbd>'; LAB.cx = null; }
  // batch 16: 'gk:<move>' plays a keeper move (the keeper kits' own frames: kleap, kblock, kdivecatch, ktip ...) on the
  // keeper in front of you, so new keeper art can be looked at before it's wired into the saves
  // (FP1's camera swings to the keeper while his move plays, then back to you)
  function animWho(name) { const r = LAB.run; return r && name.startsWith('gk:') ? (r.nogk ? null : r.gk) : r && r.human; }
  function playAnim(name) {
    const r = LAB.run; if (!r || r.sc.kind !== 'free') return;
    const p = animWho(name); if (!p) return; name = name.replace(/^gk:/, '');
    const A = MAN.kits[p.kit].anims, d = DIRS[p.face];
    const k = [d, dirVec(p.face).x >= 0 ? 'E' : 'W', 'S'].find(q => A[`${name}-${q}`]); if (!k) return;
    const fps = (typeof KICK_RATE !== 'undefined' && KICK_RATE[name]) || 12, dur = A[`${name}-${k}`].length / fps + 0.15;
    p.labAnim = name; p.labFps = fps; p.setState('labanim', dur); p.stun = dur; p.vx = p.vy = 0;
  }
  // the camera keeps you just right of the panel, so you see the pitch (and the goal) in front of you
  function fpShift() { return (VIEW_W / 2 - 300) / (LAB.zoom || 1); }   // v0.8.5: the panel is beside the pitch now - you a little left of centre, the goal ahead
  // where a ball thrown / rolled to you comes from: D m out the way you face - unless that's off the pitch or on top of
  // their keeper (he'd just catch it), then from the side (v0.8.8)
  function inFrom(p, D) {
    const gk = LAB.run && !LAB.run.nogk ? LAB.run.gk : null;
    for (const turn of [0, 2, -2, 1, -1, 3, -3, 4]) {
      const dv = dirVec((p.face + turn + 8) % 8), fx = p.x + dv.x * D, fy = p.y + dv.y * D * 0.86;
      if (fx < 2 || fx > PITCH_L - 2 || fy < 2 || fy > PITCH_W - 2) continue;
      if (gk && len(fx - gk.x, fy - gk.y) < 7) continue;
      return { fx, fy, ux: dv.x, uy: dv.y * 0.86 };
    }
    const dv = dirVec(p.face); return { fx: clamp(p.x + dv.x * D, 2, PITCH_L - 2), fy: clamp(p.y + dv.y * D, 2, PITCH_W - 2), ux: dv.x, uy: dv.y };
  }
  function toss(p, tz, ahead = 0.3) {                                            // a ball dropped onto you from 14 m out (ahead: lands that far in front of him)
    const o = inFrom(p, 14), tx = p.x + o.ux * ahead, ty = p.y + o.uy * ahead;
    const s = aimAir(o.fx, o.fy, tx, ty, tz, 1.3), d = len(tx - o.fx, ty - o.fy) || 1;
    ballAt(o.fx, o.fy, 0.05); Object.assign(m.ball, { vx: (tx - o.fx) / d * s.speed, vy: (ty - o.fy) / d * s.speed, vz: s.vz, skid: true, rollV: 0, last: m.home, lastP: null });
  }
  function fpMove(kind) {
    const r = LAB.run; if (!r || r.sc.kind !== 'free') return;
    const p = r.human, b = m.ball, dv = dirVec(p.face);
    if (m.pending || p.state === 'kick' || p.state === 'slide' || p.state === 'dheader') return;
    if (p.busy()) { p.setState('idle', 0); p.stun = 0; }                        // a reaction or a lab animation: cut it short
    if (r.resetAt || (r.gk && r.gk.hands) || m.ball.inNet) fpReset(r);              // (the keeper still has it / it's in the net: the ball comes back first)
    r.air = null;
    if (kind.startsWith('air-')) { airMove(r, p, kind.slice(4)); return; }
    if (/^(pass|through|lob|plob\d+|shot|power|tap|sp\d|chip)$/.test(kind) && b.owner !== p) atFeet(p);
    r.last = { pass: 'PASS', through: 'THROUGH BALL', lob: 'LOB', shot: 'SHOT', tap: 'TAP KICK', power: 'POWER SHOT', chip: 'CHIP', sp1: 'LV1 BLAZE', sp2: 'LV2 THUNDER', sp3: 'LV3 PHOENIX', slide: 'SLIDE',
      head: 'BALL TO YOUR HEAD · your turn', waist: 'BALL TO YOUR WAIST · your turn', feet: 'BALL TO YOUR FEET' }[kind] || (kind.startsWith('plob') ? `POWER LOB ${kind.slice(4)}%` : kind.toUpperCase());
    if (kind === 'pass' || kind === 'through' || kind === 'lob') m.doPass(p, dv, kind === 'pass' ? 'ground' : kind);
    else if (kind.startsWith('plob')) m.powerLob(p, dv, +kind.slice(4) / 100);
    else if (kind === 'chip') { const gx = p.team.goalX; p.face = dirIndex(gx - p.x, 34 - p.y); atFeet(p); m.chipShot(p, 0.25, 0); }   // v0.9.2 (anywhere, for testing: in a match it's LOB in their box facing goal)
    else if (kind === 'tap') m.tapKick(p, dv);                                  // t-010 (the button works with TAP KICK off too: to see the move)
    else if (kind === 'shot') m.doShot(p, 0.6, 0);
    else if (kind === 'power') m.doShot(p, 0.88, 0);
    else if (kind[0] === 's' && kind[1] === 'p') { const mt = m.meters && m.meters[0]; if (mt) mt.e = +kind[2]; m.special(p); }
    else if (kind === 'slide') { ballAt(p.x + dv.x * 3, p.y + dv.y * 2.5); m.tackle(p, null, true); }
    else if (kind === 'head') toss(p, 1.9);
    else if (kind === 'waist') toss(p, 0.75);
    else if (kind === 'feet') {                                                  // a firm pass rolled in from 16 m: your first touch
      const { fx, fy } = inFrom(p, 16), d = len(p.x - fx, p.y - fy) || 1;
      ballAt(fx, fy, 0); Object.assign(b, { vx: (p.x - fx) / d * 13, vy: (p.y - fy) / d * 13, last: m.home, target: p });
    }
  }
  // tuning (lab only - the real game keeps its values until we copy yours over)
  // v0.9.9 (Luca 02:50: "add the sliders from the training ground to the classic version"): the knobs of the Test Lab v3
  // prototype's training ground, in 5 tabs, each in plain words: what it does, what the number means on the pitch, Less /
  // Normal / More and a reset. Normal = the game's own value, read at start-up. They only change FREE PLAY.
  const TUNE_TABS = [['player', 'PLAYER'], ['ball', 'BALL'], ['lob', 'LOBS & CHIPS'], ['shot', 'SHOTS'], ['keeper', 'KEEPER']];
  const TUNE = [
    { k: 'run', tab: 'player', name: 'Run speed', what: 'How fast he runs without Shift.', min: 4, max: 6.6, step: 0.1, c: 'RUN',
      fmt: v => `${v.toFixed(1)} m/s`, line: v => `30 metres takes about ${(30 / v).toFixed(1)} seconds.` },
    { k: 'sprint', tab: 'player', name: 'Sprint speed', what: 'How fast he goes with Shift held.', min: 6.5, max: 9.5, step: 0.1, c: 'SPRINT',
      fmt: v => `${v.toFixed(1)} m/s`, line: v => `30 metres takes about ${(30 / v).toFixed(1)} seconds.` },
    { k: 'drain', tab: 'player', name: 'Energy', what: 'How fast sprinting tires him out.', min: 0.08, max: 0.5, step: 0.01, c: 'SPRINT_DRAIN', lo: 'lasts longer', hi: 'tires faster',
      fmt: v => `${v.toFixed(2)} a second`, line: v => `Full to empty in about ${(1 / v).toFixed(1)} seconds of sprinting.` },
    { k: 'recover', tab: 'player', name: 'Getting energy back', what: 'How fast his energy comes back when he slows down.', min: 0.05, max: 0.4, step: 0.01, c: 'REST_GAIN', lo: 'slower', hi: 'faster',
      fmt: v => `${v.toFixed(2)} a second`, line: v => `Empty to full in about ${Math.round(1 / v)} seconds of walking.` },
    { k: 'mag', tab: 'ball', name: 'Magnetism', what: 'How close the ball stays to his feet when he dribbles.', min: 0.5, max: 2, step: 0.05, c: 'BALL_MAG', lo: 'looser', hi: 'stickier',
      fmt: v => `×${v.toFixed(2)}`, line: v => v > 1.02 ? 'Closer to his boots: harder to lose, harder to nick off him.' : v < 0.98 ? 'Further ahead of him: easier to lose, easier to nick.' : 'As in the game.' },
    { k: 'grip', tab: 'ball', name: 'Grass grip', what: 'How fast the ball slows down on the grass.', min: 0.5, max: 1.6, step: 0.05, c: 'SKID_DEC / ROLL_DEC', phys: true, lo: 'rolls on', hi: 'stops sooner',
      fmt: v => `×${v.toFixed(2)}`, line: v => `A ball rolling at 20 km/h stops after about ${(5.56 * 5.56 / (2 * LAB.base.roll * v)).toFixed(1)} m.` },
    { k: 'bounce', tab: 'ball', name: 'Bounce', what: 'How much of its height a bounce keeps.', min: 0.4, max: 0.85, step: 0.01, c: 'BOUNCE_Z', phys: true, lo: 'dead', hi: 'lively',
      fmt: v => v.toFixed(2), line: v => `Dropped from 2 m, it bounces back up to about ${(2 * v * v).toFixed(1)} m.` },
    { k: 'lobh', tab: 'lob', name: 'Lob height', what: 'How high a lob (and a held power lob) climbs.', min: 0.6, max: 1.6, step: 0.05, c: 'LOB_H', lo: 'flatter', hi: 'higher',
      fmt: v => `×${v.toFixed(2)}`, line: v => `A 25 m lob aims for about ${(lobApex(25, null) / LOB_H * v).toFixed(1)} m at its highest.` },
    { k: 'lobd', tab: 'lob', name: 'Power lob distance', what: 'How far a fully held power lob goes.', min: 30, max: 70, step: 1, c: 'LOB_MAX', lo: 'shorter', hi: 'longer',
      fmt: v => `${v.toFixed(0)} m`, line: v => `A tap goes 12 m; held all the way it lands about ${v.toFixed(0)} m away.` },
    { k: 'chip', tab: 'lob', name: 'Chip dip', what: 'How hard a chip drops after its highest point.', min: 0, max: 4, step: 0.1, c: 'CHIP_DIP', lo: 'floats', hi: 'drops hard',
      fmt: v => v.toFixed(1), line: v => v < 0.05 ? 'No extra dip: it falls like any ball.' : `It falls about ${(1 + v).toFixed(1)}× as fast as a normal ball once it starts coming down.` },
    { k: 'shot', tab: 'shot', name: 'Shot power', what: 'Every shot, harder or softer.', min: 0.8, max: 1.3, step: 0.05, c: 'SHOT_K', lo: 'softer', hi: 'harder',
      fmt: v => `×${v.toFixed(2)}`, line: v => `A normal shot leaves the boot at about ${Math.round((16 + 0.6 * 16) * v * 3.6)} km/h.` },
    { k: 'curve', tab: 'shot', name: 'Curve', what: 'Bend on a shot. Not in the game yet: shots fly straight. Ask for it as a card if you want it.', off: true },
    { k: 'react', tab: 'keeper', name: 'Reaction time', what: 'How long their keeper takes to react, on top of his level.', min: -0.1, max: 0.15, step: 0.01, c: 'gkReact (difficulty.js)', lo: 'quicker', hi: 'slower',
      fmt: v => `${v >= 0 ? '+' : ''}${v.toFixed(2)} s`, line: v => Math.abs(v) < 0.005 ? 'As his level plays him.' : `${Math.abs(v).toFixed(2)} s ${v < 0 ? 'quicker' : 'slower'} than his level.` },
    { k: 'reach', tab: 'keeper', name: 'Reach', what: 'How far past his body a keeper gets a glove to the ball.', min: 0.6, max: 1.6, step: 0.05, c: 'GK_REACH', lo: 'short', hi: 'long',
      fmt: v => `${v.toFixed(2)} m`, line: v => `He gets a glove to balls up to about ${v.toFixed(2)} m from his body.` },
    { k: 'dive', tab: 'keeper', name: 'Dive speed', what: 'How fast a keeper flies sideways in a dive.', min: 3.5, max: 7, step: 0.1, c: 'GK_DIVE_V', lo: 'slower', hi: 'faster',
      fmt: v => `${v.toFixed(1)} m/s`, line: v => `In half a second of diving he covers about ${(v * 0.5).toFixed(1)} m.` },
  ];
  const LEVELS = [['easy', 'EASY'], ['normal', 'NORMAL'], ['hard', 'HARD'], ['rise', 'RISE WARRIOR']];
  function applyTune(t, phys = true) {                                           // phys: the grass / bounce knobs (the weather sets those itself)
    const B = LAB.base; if (!B) return;
    if (phys) { SKID_DEC = B.skid * t.grip; ROLL_DEC = B.roll * t.grip; BOUNCE_Z = t.bounce; }
    SPRINT = t.sprint; SHOT_K = t.shot; RUN = t.run; SPRINT_DRAIN = t.drain; REST_GAIN = t.recover;
    RUN_GAIN = t.recover === B.recover ? B.runGain : B.runGain * t.recover / B.recover;   // (the jogging regain moves with it)
    BALL_MAG = t.mag; LOB_H = t.lobh; LOB_MAX = t.lobd; CHIP_DIP = t.chip; GK_REACH = t.reach; GK_DIVE_V = t.dive; LAB.react = t.react;
  }
  const tuneChanged = () => TUNE.filter(k => !k.off && Math.abs(LAB.tune[k.k] - LAB.def[k.k]) > 1e-9);
  function tuneText() { const t = LAB.tune;
    return JSON.stringify({ game: GAME_VER, from: 'Test Lab classic · FREE PLAY knobs', note: ($('fp-tnote') && $('fp-tnote').value.trim()) || '',
      changed: tuneChanged().map(k => ({ knob: k.name, value: +(+t[k.k]).toFixed(3), normal: +(+LAB.def[k.k]).toFixed(3), means: k.line(t[k.k]), constant: k.c })),
      all: Object.fromEntries(TUNE.filter(k => !k.off).map(k => [k.k, +(+t[k.k]).toFixed(3)])), keeperLevel: LAB.fp.cpu, weather: LAB.fp.wx,
      means: { SKID_DEC: +(LAB.base.skid * t.grip).toFixed(2), ROLL_DEC: +(LAB.base.roll * t.grip).toFixed(2), BOUNCE_Z: t.bounce, SPRINT: t.sprint, SHOT_K: t.shot, RUN: t.run,
        SPRINT_DRAIN: t.drain, REST_GAIN: t.recover, BALL_MAG: t.mag, LOB_H: t.lobh, LOB_MAX: t.lobd, CHIP_DIP: t.chip, GK_REACH: t.reach, GK_DIVE_V: t.dive, gkReactExtra: t.react } }); }
  function tuneUI() {                                                            // the knob tab that's open, the changed strip
    const tab = LAB.tuneTab || 'player', box = $('fp-tune');
    $('fp-ttabs').innerHTML = TUNE_TABS.map(([id, n]) => `<button type="button" role="tab" data-tt="${id}" aria-selected="${id === tab}" aria-pressed="${id === tab}">${n}</button>`).join('');
    for (const b of document.querySelectorAll('#fp-ttabs button')) b.addEventListener('click', () => { LAB.tuneTab = b.dataset.tt; try { localStorage.setItem('hc2-lab-ttab', LAB.tuneTab); } catch (e) {} tuneUI(); b.blur(); });
    const pct = k => 100 * (LAB.def[k.k] - k.min) / (k.max - k.min);
    box.innerHTML = (tab === 'keeper' ? `<div class="fp-knob"><div class="fp-kh"><b>Keeper level</b></div><div class="fp-kd">Their keeper plays at this difficulty (the same switch as CPU LEVEL).</div>
        <div class="fp-row" role="group" aria-label="Keeper level">${LEVELS.map(([v, n]) => `<button type="button" data-lvl="${v}" aria-pressed="${LAB.fp.cpu === v}">${n}</button>`).join('')}</div></div>` : '') +
      TUNE.filter(k => k.tab === tab).map(k => k.off ? `<div class="fp-knob off"><div class="fp-kh"><b>${k.name}</b><output>—</output></div><div class="fp-kd">${k.what}</div></div>` :
        `<div class="fp-knob" data-kn="${k.k}"><div class="fp-kh"><b>${k.name}</b><output id="o-${k.k}"></output><button type="button" data-kr="${k.k}" title="Back to normal" aria-label="${k.name}: back to normal">↺</button></div>
        <div class="fp-kd">${k.what}</div>
        <input type="range" id="t-${k.k}" min="${k.min}" max="${k.max}" step="${k.step}" aria-label="${k.name}">
        <div class="fp-ks" aria-hidden="true"><span class="l">${k.lo || 'less'}</span><span class="n" style="left:${pct(k).toFixed(1)}%">▲ normal</span><span class="r">${k.hi || 'more'}</span></div>
        <div class="fp-kl" id="l-${k.k}"></div></div>`).join('');
    for (const b of box.querySelectorAll('[data-lvl]')) b.addEventListener('click', () => { LAB.fp.cpu = b.dataset.lvl; syncCyc(); tuneUI(); b.blur(); });
    for (const k of TUNE.filter(k => k.tab === tab && !k.off)) {
      const el = $(`t-${k.k}`); el.value = LAB.tune[k.k];
      el.addEventListener('input', () => setKnob(k, +el.value));
      el.addEventListener('keydown', e => e.stopPropagation());                 // (the arrows move the slider, not your player)
      el.addEventListener('change', () => el.blur()); el.addEventListener('pointerup', () => el.blur());
    }
    for (const b of box.querySelectorAll('[data-kr]')) b.addEventListener('click', () => { const k = TUNE.find(x => x.k === b.dataset.kr); setKnob(k, LAB.def[k.k]); $(`t-${k.k}`).value = LAB.def[k.k]; b.blur(); });
    tuneShow();
  }
  function setKnob(k, v) {
    LAB.tune[k.k] = v; try { localStorage.setItem('hc2-lab-tune', JSON.stringify(LAB.tune)); } catch (x) {}
    if (LAB.run && LAB.run.sc.kind === 'free') applyTune(LAB.tune, LAB.fp.wx === 'clear');
    tuneShow();
  }
  function tuneShow() {
    for (const k of TUNE.filter(k => k.tab === (LAB.tuneTab || 'player') && !k.off)) {
      const v = +LAB.tune[k.k], chg = Math.abs(v - LAB.def[k.k]) > 1e-9, row = document.querySelector(`[data-kn="${k.k}"]`); if (!row) continue;
      $(`o-${k.k}`).textContent = k.fmt(v) + (chg ? '' : ' · normal'); $(`l-${k.k}`).textContent = k.line(v);
      row.classList.toggle('chg', chg); row.querySelector('[data-kr]').hidden = !chg;
    }
    const c = tuneChanged();
    $('fp-tchg').innerHTML = c.length ? `<b>CHANGED ${c.length}:</b> ${c.map(k => k.name).join(', ')}${c.some(k => k.phys) && LAB.fp.wx !== 'clear' ? ' (grip and bounce wait for DRY weather)' : ''}` : 'Nothing changed: everything plays as in the game.';
    $('fp-tnote').placeholder = c.length ? `You changed ${c[c.length - 1].name.toLowerCase()}. How does it feel now?` : 'How does it feel? e.g. sprinting feels floaty';
  }
  let syncCyc = () => {};                                                        // (set by fpUI: redraws the CPU LEVEL switch)
  function fpUI() {
    LAB.base = { skid: SKID_DEC, roll: ROLL_DEC, bounce: BOUNCE_Z, sprint: SPRINT, shot: SHOT_K, recover: REST_GAIN, runGain: RUN_GAIN };
    LAB.def = { grip: 1, bounce: BOUNCE_Z, sprint: SPRINT, shot: 1, run: RUN, drain: SPRINT_DRAIN, recover: REST_GAIN, mag: BALL_MAG, lobh: LOB_H, lobd: LOB_MAX,
      chip: CHIP_DIP, react: 0, reach: GK_REACH, dive: GK_DIVE_V };                // (the game's own values: Normal)
    try { LAB.tune = Object.assign({}, LAB.def, JSON.parse(localStorage.getItem('hc2-lab-tune') || '{}')); } catch (e) { LAB.tune = Object.assign({}, LAB.def); }
    for (const k of TUNE) if (!k.off && !(Number.isFinite(+LAB.tune[k.k]) && LAB.tune[k.k] >= k.min && LAB.tune[k.k] <= k.max)) LAB.tune[k.k] = LAB.def[k.k];   // (an old or broken saved value: back to normal)
    try { LAB.tuneTab = localStorage.getItem('hc2-lab-ttab') || 'player'; } catch (e) { LAB.tuneTab = 'player'; }
    tuneUI();
    $('fp-tdef').addEventListener('click', () => { LAB.tune = Object.assign({}, LAB.def); try { localStorage.removeItem('hc2-lab-tune'); } catch (x) {} applyTune(LAB.tune); tuneUI(); flash('all back to normal'); });
    $('fp-tcopy').addEventListener('click', () => { const text = tuneText();
      try { navigator.clipboard.writeText(text).then(() => flash('copied'), () => { $('dump').hidden = false; $('dump').value = text; $('dump').select(); }); }
      catch (e) { $('dump').hidden = false; $('dump').value = text; $('dump').select(); } });
    $('fp-tsave').addEventListener('click', async () => {
      const doc = Object.assign(JSON.parse(tuneText()), { at: new Date().toISOString() });
      if (!doc.changed.length && !doc.note) { flash('change a knob first'); return; }
      if (LAB.db) { try { await LAB.db.collection('tuning').add(doc); flash('sent to Claude'); status('suggestion saved: Claude reads it, nothing in the game changes until you OK a card'); $('fp-tnote').value = ''; return; } catch (e) {} }
      flash('use COPY'); status('no lab database here: COPY and paste it to Claude');
    });
    for (const b of document.querySelectorAll('#fp [data-tog]')) b.addEventListener('click', () => { const k = b.dataset.tog; LAB.fp[k] = !LAB.fp[k]; b.setAttribute('aria-pressed', LAB.fp[k]); b.blur(); });
    for (const b of document.querySelectorAll('#fp [data-mv]')) b.addEventListener('click', () => { fpMove(b.dataset.mv); b.blur(); });
    // v0.8.8 cycling switches: WEATHER (dry / rain / snow - the ball physics and the look) and KEEPER SAVE (off / LV1-3)
    const CYC = { wx: { vals: ['clear', 'rain', 'snow'], label: v => `WEATHER: ${{ clear: 'DRY', rain: 'RAIN', snow: 'SNOW' }[v]}`,
                        set: v => { setWx(v); if (LAB.tune) applyTune(LAB.tune, v === 'clear'); } },
                  tap: { vals: [false, true], label: v => `TAP KICK: ${v ? 'ON' : 'OFF'}`, set: v => { TAP_KICK = v; } },   // t-010
                  save: { vals: [0, 1, 2, 3], label: v => `KEEPER SAVE: ${v ? 'LV' + v : 'OFF'}`, set: () => {} },
                  cpu: { vals: ['normal', 'hard', 'rise', 'easy'], label: v => `CPU LEVEL: ${{ easy: 'EASY', normal: 'NORMAL', hard: 'HARD', rise: 'RISE WARRIOR' }[v]}`, set: () => {} } };   // v0.9.2 their keeper at each difficulty
    const cycShow = [];
    for (const b of document.querySelectorAll('#fp [data-cyc]')) {
      const C = CYC[b.dataset.cyc], show = () => { const v = LAB.fp[b.dataset.cyc]; b.textContent = C.label(v); b.setAttribute('aria-pressed', v !== C.vals[0]); };
      show(); cycShow.push(show); b.addEventListener('click', () => { const k = b.dataset.cyc, v = C.vals[(C.vals.indexOf(LAB.fp[k]) + 1) % C.vals.length]; LAB.fp[k] = v;
        if (LAB.run && LAB.run.sc.kind === 'free') C.set(v); show(); if (k === 'cpu' || k === 'wx') tuneUI(); b.blur(); });
    }
    syncCyc = () => cycShow.forEach(f => f());
    // the folding sections (tuning, animation) remember whether you left them open
    for (const d of document.querySelectorAll('#fp details[data-k]')) {
      try { const v = localStorage.getItem('hc2-lab-' + d.dataset.k); if (v != null) d.open = v === '1'; } catch (e) {}
      d.addEventListener('toggle', () => { try { localStorage.setItem('hc2-lab-' + d.dataset.k, d.open ? '1' : '0'); } catch (e) {} });
    }
    const moves = kit => [...new Set(Object.keys(MAN.kits[kit].anims).map(k => k.replace(/-[A-Z]+$/, '')))].sort();
    const sel = $('fp-anim'), names = moves(m.home.players[9].kit), gkNames = moves(m.away.players[0].kit);
    sel.innerHTML = names.map(n => `<option>${n}</option>`).join('') + `<optgroup label="KEEPER">${gkNames.map(n => `<option value="gk:${n}">GK ${n}</option>`).join('')}</optgroup>`; LAB.fp.anim = names.includes('celebrate') ? 'celebrate' : names[0]; sel.value = LAB.fp.anim;
    sel.addEventListener('change', () => { LAB.fp.anim = sel.value; playAnim(sel.value); sel.blur(); });
    $('fp-play').addEventListener('click', () => { playAnim(LAB.fp.anim); $('fp-play').blur(); });
    $('fp-loop').addEventListener('click', () => { LAB.fp.loop = !LAB.fp.loop; $('fp-loop').setAttribute('aria-pressed', LAB.fp.loop); $('fp-loop').blur(); });
    $('fp-reset').addEventListener('click', () => { fpReset(); $('fp-reset').blur(); });
    $('fp-tapadd').addEventListener('click', () => { const i = $('fp-tapinfo'), on = i.hidden; i.hidden = !on; $('fp-tapadd').setAttribute('aria-expanded', on); $('fp-tapadd').blur(); });   // t-010: explains only
    $('fp-mini').addEventListener('click', () => { fpMini(); $('fp-mini').blur(); });
  }

  // ======================================================================= v0.8.7 (Luca: "add everything to the test lab too", "add a
  // lab for viewing cut scenes too", BUG WATCH) - tests for the v0.8.5 / v0.8.6 features, every cut scene on demand, and
  // the clips the watchdog kept, to watch and mark here.
  const WX_NAME = { clear: 'dry', rain: 'RAIN', snow: 'SNOW' };
  function setWx(w) {                                                            // the weather's ball physics (and its look)
    const cur = (m.mset && m.mset.weather) || 'clear'; if (cur === w) return;
    m.mset = Object.assign({}, m.mset || {}, { weather: w }); m.applyRules();
  }
  // ---- v0.8.5: hold-L power lob - how far and how high for how long you hold it
  function lobTest(id, c) {
    return { id, group: 'N5', name: `power lob · held ${Math.round(c * 100)}% of the way`, sub: `aims ${Math.round(12 + c * 38)} m ahead (12 m tap → 50 m full hold)`, kind: 'phys',
      setup(r) { const p = m.home.players[6]; cast([p]); put(p, 24.5, 34, 0); atFeet(p); Object.assign(r, { human: p, shooter: p, marks: [{ x: 25 + 12 + c * 38, y: 34, r: 0.8 }] });
        r.action = { at: 0.5, fire: () => m.powerLob(p, { x: 1, y: 0 }, c) }; },
      check: physCheck };
  }
  // ---- v0.8.6 POWER SPECIALS: blockers in the ball's path (placed on the line to where the special is going)
  function pwTest(id, name, sub, o) {
    return { id, group: 'PW', name, sub, kind: 'pw',
      setup(r) {
        const s = m.home.players[9], gk = m.away.players[0], B = (o.block || []).map((_, i) => m.away.players[1 + i]);
        cast([s, gk, ...B]);
        const [x, y] = o.from, f = dirIndex(GX - x, 34 - y), dv = dirVec(f);
        put(s, x - dv.x * 0.5, y - dv.y * 0.42, f); ballAt(x, y, 0, s); put(gk, LINE_X, 34, 4);
        B.forEach((p, i) => put(p, x + 3 + i * 2, y, 4));
        for (const mt of m.meters || []) mt.e = 0;
        Object.assign(r, { human: s, shooter: s, gk, blockers: B, marks: [], o });
        r.action = { at: 0.7, fire: () => {
          m.meters[0].e = o.lv; m.special(s); const k = m.pending; if (!k) return;
          const L = len(k.tx - x, k.ty - y), ux = (k.tx - x) / L, uy = (k.ty - y) / L;   // blockers straight in its path
          B.forEach((p, i) => { const d = o.block[i]; put(p, x + ux * d + (o.side ? uy * o.side : 0), y + uy * d - (o.side ? ux * o.side : 0), 4); });
          r.marks = [{ x: k.tx - ux * 2, y: k.ty - uy * 2, r: 0.4 }];
        } };
      },
      check(r) {
        const b = m.ball, o = r.o;
        if (r.shotT == null) { if (!b.owner && r.fired && b.lastP === r.shooter && !m.pending) { r.shotT = r.t; r.lv = b.special; r.p0 = b.spP;
          if (o.save) { r.gk.spSave = o.save; m.saveFx(r.gk); } } else return null; }
        if (b.special) r.pLeft = b.spP;
        else if (!r.spEnd) { r.spEnd = true;                                    // the moment it stopped being a special: who was there?
          const near = [...r.blockers, r.gk].map(p => ({ p, d: len(p.x - b.x, p.y - b.y) })).sort((u, v) => u.d - v.d)[0];
          if (near && near.d < 1.6) r.stopper = near.p; }
        const thr = r.events.filter(e => e.includes('THROUGH HIM')).length, head = `LV${r.lv || o.lv} · ${Math.round(r.p0 || 0)} POWER${thr ? ` · THROUGH ${thr}` : ''} · `;
        if (b.inNet) return { o: head + `GOAL (${Math.round(r.pLeft || 0)} left)`, hold: 1.4 };
        if (r.ev('SAVED!')) return { o: head + 'KEEPER\'S SPECIAL SAVE WINS', hold: 1.2 };
        if (r.stopper && r.stopper !== r.gk) return { o: head + `BLOCKED by blocker ${r.blockers.indexOf(r.stopper) + 1} (#${r.stopper.num})`, hold: 1 };
        if (b.owner === r.gk) return { o: head + 'SAVED · caught' };
        if (r.stopper === r.gk || b.lastP === r.gk) return { o: head + 'KEEPER GOT TO IT', hold: 1.2 };
        if (r.out) return { o: head + 'OUT · ' + r.out.toLowerCase() };
        if (r.t - r.shotT > 4) return { o: head + 'BALL STILL LOOSE' };
        return null;
      } };
  }
  // ---- t-013 GOAL PHYSICS (Luca 24 Oct: "a net through which the ball can interact with slight give ... more dynamic
  // feedback when the ball hits the post ... the keeper ... breaks his guard, a lot should go more up"). GP1-6 have no
  // keeper (the frame and the net on their own); every line says what the ball did. GP7-8 force the pop-up (its dice
  // decide in a match), so you always see it.
  function gpShot(id, name, sub, from, tgt, speed, o = {}) {
    return { id, group: 'GP', name, sub, kind: 'shot', forcePop: o.pop, forceParry: o.parry,
      setup(r) {
        const s = m.home.players[9], gk = m.away.players[0], a = m.home.players[8], f = dirIndex(GX - from[0], tgt.y - from[1]), dv = dirVec(f);
        cast(o.gk ? (o.att ? [s, gk, a] : [s, gk]) : [s]);
        put(s, from[0] - dv.x * 0.5, from[1] - dv.y * 0.42, f); ballAt(from[0], from[1], 0, s);
        Object.assign(r, { human: s, shooter: s, gk: o.gk ? gk : null, att: o.att ? a : null, marks: [{ x: GX, y: tgt.y, r: 0.3 }] });
        if (o.gk) put(gk, LINE_X, o.gk, 4);
        if (o.att) { put(a, o.att[0], o.att[1], 0); r.bots.set(a, (p, dt) => { if (m.gpLastPop && m.gpLastPop.t >= r.gp0) attackBall(p, dt); else p.moveTo(GX - 7, 34 + (o.att[1] - 34) * 0.5, RUN, dt); }); }
        m.gpLast = null; m.gpLastPop = null; r.gp0 = (m.gpT || 0) + 0.01;
        r.action = { at: 0.7, fire: () => fireShot(r, tgt, speed, o.power ?? 0.6) };
      },
      check: gpCheck };
  }
  // what the ball did: off the woodwork / the keeper, where it came back, the net's give
  function gpCheck(r) {
    const b = m.ball, W = m.gpLast && m.gpLast.t >= r.gp0 ? m.gpLast : null, P = m.gpLastPop && m.gpLastPop.t >= r.gp0 ? m.gpLastPop : null;
    if (r.shotT == null) { if (!b.owner && r.fired && !m.pending && b.lastP === r.shooter) r.shotT = r.t; else return null; }
    if (r.att && (r.att.state === 'header' || r.att.state === 'dheader' || r.att.kickAnim === 'volley' || r.att.state === 'bike')) r.met = r.met || r.att.state;
    if (W && r.bn == null) r.bn = b.bounced || 0;
    if (W && !r.land && (b.bounced || 0) > r.bn) r.land = { d: (GX - b.x), y: b.y };                                     // its first bounce after the woodwork
    const land = r.land ? `, lands ${Math.abs(r.land.d).toFixed(1)} m ${r.land.d >= 0 ? 'out' : 'in'}` : '';
    const pre = (W ? `OFF THE ${W.what.toUpperCase()} (${W.sq > 0.7 ? 'square' : W.sq > 0.35 ? 'half on' : 'glancing'} ${Math.round(W.sq * 100)}%, ${kmh(W.vin)} → ${kmh(W.vout)} km/h${land}) → ` : '') +
      (P ? `${P.kind === 'parry' ? 'PARRIED' : 'GUARD BROKEN'}, IT LOOPS UP (${P.vz.toFixed(1)} m/s up) → ` : '') + (r.met ? `${r.met === 'header' || r.met === 'dheader' ? 'HEADER' : 'VOLLEY'} → ` : '');
    const toLine = Math.abs(GX - b.x);
    if ((W || P) && !r.back && !b.inNet && toLine > 5.5 && r.wasIn) r.back = { z: b.z, t: r.t };                       // back out over the six-yard line
    if (toLine < 5.5) r.wasIn = true;
    if (b.inNet) {
      if (r.goalT == null) r.goalT = r.t;
      const L = (m.netS && m.netS.R) || [], pk = L.reduce((x, q) => Math.max(x, q.peak), r.netPk || 0); r.netPk = pk;
      if (r.t - r.goalT < 1.6) return null;                                                                        // let the net catch it
      const keys = [...new Set(L.map(q => q.key))].join(' + ');
      return { o: pre + `GOAL · the net gave ${Math.round(pk * 100)} cm${keys ? ` (${keys})` : ''}, the ball ${b.z < 0.15 ? 'dropped to the grass' : `is ${b.z.toFixed(1)} m up`}`, hold: 0.4 };
    }
    const back = r.back ? ` · back over the six-yard line at ${r.back.z.toFixed(1)} m up${r.back.z > 1.1 && r.back.z < 2.7 ? ' (head height)' : r.back.z <= 1.1 && r.back.z > 0.3 ? ' (volley height)' : ''}` : '';
    if (r.gk && b.owner === r.gk) return { o: pre + 'THE KEEPER GATHERS IT' + back };
    if (r.att && b.owner === r.att) return { o: pre + 'THE ATTACKER PICKS IT UP' + back };
    if (r.out) return { o: pre + 'OUT · ' + r.out.toLowerCase() + back };
    if (r.t - r.shotT > 4.5) return { o: pre + `LOOSE, ${toLine.toFixed(1)} m out` + back };
    return null;
  }
  function gpTests(smSave) {
    const gp8 = smSave('GP8', 1, 3, [84, 34], 'lose');
    Object.assign(gp8, { group: 'GP', forcePop: true, name: 'a LV3 special breaks his guard: the ball loops UP', sub: 'his LV1 save loses; the pop-up is forced here (in a match: about 45%)',
      check(r) { const b = m.ball; if (r.shotT == null && !b.owner && r.fired && b.lastP === r.shooter && !m.pending && r.o.save) { r.gk.spSave = r.o.save; m.saveFx(r.gk); }   // (as SM7: his save, made to lose)
        return gpCheck(r); } });
    { const s0 = gp8.setup; gp8.setup = r => { s0(r); m.gpLast = null; m.gpLastPop = null; r.gp0 = (m.gpT || 0) + 0.01; }; }
    return [
      gpShot('GP1', 'a hard shot into the roof of the net', '112 km/h, rising under the bar: the net bulges, holds it, it drops', [88, 34.6], { y: 34.8, z: 2.12 }, 31),
      gpShot('GP2', 'a low shot into the side netting', 'across goal, inside the near post: the side net bulges', [95, 28.5], { y: GOAL_Y1 - 0.45, low: true }, 24),
      gpShot('GP3', 'off the inside of the post, in', 'from the angle at the far post, a third of the ball on the post', [93, 44], { y: GOAL_Y0 + 0.13, low: true }, 26),
      gpShot('GP4', 'a square hit on the post with power', '104 km/h square on the post: back out towards the six-yard line, at a height to meet', [91, GOAL_Y0], { y: GOAL_Y0, z: 0.55 }, 29),
      gpShot('GP5', 'off the underside of the bar', 'it comes down onto the line: in or out off the bounce (backspin)', [94, 34.5], { y: 34.5, z: BAR_Z - 0.1 }, 27),
      gpShot('GP6', 'a glancing touch on the bar', 'just clips the top of the bar: over for a goal kick', [88, 33], { y: 33, z: BAR_Z + 0.15 }, 26),
      gpShot('GP7', 'a parried hard shot pops UP for an attacker following in', 'at him, too hard to hold: parried (made a plain parry here) and the pop-up is forced (in a match: up to ~40% of plain parries)', [89, 34], { y: 34.7, z: 1.3 }, 33, { gk: 34, att: [90, 37.5], pop: true, parry: true }),
      gp8,
    ];
  }
  // ---- v0.9.0 (Luca: "use their Iron Wall-like special abilities to also block normal shots (K). Only goalkeepers")
  // their keeper, with bars, against your normal shot into the corner he can't reach (made to use it here)
  function normSave(id, lv) {
    return { id, group: 'SM', name: `NORMAL SHOT v their keeper's LV${lv} ${SAVE_NAMES[lv - 1]}`, sub: 'a hard shot into the far corner; with bars in the bank he answers it', kind: 'pw', forceUse: true,
      setup(r) {
        const s = m.home.players[9], gk = m.away.players[0]; cast([s, gk]); put(s, 87.5, 34, 0); atFeet(s); put(gk, LINE_X, 37, 4);
        for (const mt of m.meters || []) mt.e = 0; m.meters[1].e = lv;
        Object.assign(r, { human: s, shooter: s, gk, blockers: [], marks: [], o: { lv: 0 } });
        r.action = { at: 0.7, fire: () => m.doShot(s, 0.82, -1) };
      },
      check(r) {
        const b = m.ball; if (r.shotT == null) { if (!b.owner && r.fired && b.lastP === r.shooter && !m.pending) r.shotT = r.t; else return null; }
        const used = r.events.some(e => /IRON WALL|THUNDER GLOVE|RISING SHIELD/.test(e)), head = used ? 'HE USED IT · ' : 'NO SPECIAL SAVE · ';
        if (r.ev('STOPS THE SHOT')) return { o: head + 'STOPPED IT', hold: 1.2 };
        if (b.inNet) return { o: head + 'GOAL', hold: 1.2 };
        if (b.owner === r.gk) return { o: head + 'caught' };
        if (r.out) return { o: head + 'out' };
        if (r.t - r.shotT > 4) return { o: head + 'ball loose' };
        return null;
      } };
  }
  // the computer shoots a normal shot at YOUR keeper, you have a bar: the SAVE? prompt (press = the Lab presses SPECIAL)
  function normSaveYou(id, press) {
    return { id, group: 'SM', name: `NORMAL SHOT at YOUR keeper${press ? ' · the Lab presses SPECIAL' : ''}`, sub: press ? 'the SAVE? prompt, then IRON WALL stops it' : 'press SPECIAL while SAVE? is up', kind: 'pw', you: !press,
      setup(r) {
        const s = m.away.players[9], gk = m.home.players[0], me = m.home.players[5]; cast([s, gk, me]);
        put(s, 17.5, 34, 4); atFeet(s); put(gk, PITCH_L - LINE_X, 31, 0); put(me, 40, 20, 4);
        for (const mt of m.meters || []) mt.e = 0; m.meters[0].e = 1;                // one bar: IRON WALL
        Object.assign(r, { human: me, shooter: s, gk, blockers: [], marks: [], o: { lv: 0, you: true }, press });
        r.action = { at: 1.0, fire: () => m.doShot(s, 0.82, 1) };
      },
      check(r) {
        const b = m.ball; if (m.saveAsk) r.prompt = true;
        if (r.press && m.saveAsk && !r.pressed) { r.pressed = true; Input.downs.add('KeyU'); }
        if (r.shotT == null) { if (!b.owner && r.fired && b.lastP === r.shooter && !m.pending) r.shotT = r.t; else return null; }
        const head = `${r.prompt ? 'PROMPT SHOWN' : 'NO PROMPT'} · ${r.events.some(e => /IRON WALL/.test(e)) ? 'YOU USED IT · ' : ''}`;
        if (r.ev('STOPS THE SHOT')) return { o: head + 'STOPPED IT', hold: 1.2 };
        if (b.inNet) return { o: head + 'GOAL', hold: 1.2 };
        if (b.owner === r.gk) return { o: head + 'caught' };
        if (r.out) return { o: head + 'out' };
        if (r.t - r.shotT > 4) return { o: head + 'ball loose' };
        return null;
      } };
  }
  // ======================================================================= v0.9.1 KEEPER AI tests (Luca: "move gk ai dev to top
  // priority we need to test it + include walking up etc when needed"). Their keeper (right-hand goal) with the real AI;
  // everyone else is a Lab bot. What he did is logged: his modes in order, how far off his line, how long he walked.
  const GH = x => PITCH_L - x;                                                    // height: metres out from the right-hand goal line
  const sit = () => (p, dt) => p.steer(0, 0, dt);
  const runTo = (x, y, v) => (p, dt) => { if (len(x - p.x, y - p.y) < 0.4) p.steer(0, 0, dt); else p.moveTo(x, y, v, dt); };
  const chaseBall = (tx, ty, v) => (p, dt) => { const b = m.ball; if (b.owner === p) return dribbleTo(tx, ty, v)(p, dt); if (b.owner) { p.steer(0, 0, dt); return; } const pt = m.intercept(p, 6.0); p.moveTo(pt.x, pt.y, 6.0, dt); };
  const goalSide = (who, gap, v) => (p, dt) => { const d = len(PITCH_L - who.x, 34 - who.y) || 1; p.moveTo(who.x + (PITCH_L - who.x) / d * gap, who.y + (34 - who.y) / d * gap, v, dt); };
  function gkTest(id, name, sub, o) {
    return { id, group: 'GK', name, sub, kind: 'gk',
      setup(r) {
        const gk = m.away.players[0]; const P = o.cast(); cast([gk, ...P.map(q => q[0])]);
        put(gk, o.gk ? o.gk[0] : LINE_X, o.gk ? o.gk[1] : 34, 4); gk.guard = 1; gk.gkS = null; gk.gkMode = ''; gk.rushT = 0;
        for (const [p, x, y, f, bot] of P) { put(p, x, y, f); if (bot) r.bots.set(p, bot(p)); }
        for (const mt of m.meters || []) mt.e = 0;
        const hp = P.find(q => q[0].team === m.home);
        Object.assign(r, { gk, human: hp ? hp[0] : gk, marks: [], modes: [], maxH: GH(gk.x), walkT: 0, setT: 0, topV: 0, evs: (o.evs || []).slice(), fired: true, P });
        o.ball(r);
        r.cam = () => { const b = m.ball, g = r.gk, mx = (g.x + b.x) / 2, my = (g.y + b.y) / 2; return { x: clamp(mx, g.x - 14, g.x + 14), y: clamp(my, g.y - 10, g.y + 10), sx: 0 }; };   // (the keeper always in view)
      },
      check(r) {
        const gk = r.gk, b = m.ball, H = GH(gk.x);
        if (gk.gkMode && gk.gkMode !== r.lastMode) { r.modes.push(gk.gkMode); r.lastMode = gk.gkMode; }
        r.maxH = Math.max(r.maxH, H); r.topV = Math.max(r.topV, gk.speed);
        if (gk.speed > 0.3 && gk.speed <= WALK_V) r.walkT += STEP; if (gk.gkSet) r.setT += STEP;
        while (r.evs.length && r.t >= r.evs[0].at) r.evs.shift().fire(r);       // the scenario's timed events (passes, shots, touches)
        if (o.trig && !r.trigd && o.trig(r)) { r.trigd = true; o.fire(r); r.shotAt = r.t; r.setAtShot = gk.gkSet || gk.speed < 0.6; }
        const sum = () => `${r.modes.filter((x, j, a) => x !== a[j - 1]).slice(0, 7).join(' → ')} · ${H.toFixed(1)} m out (max ${r.maxH.toFixed(1)}) · walked ${r.walkT.toFixed(1)} s, top ${r.topV.toFixed(1)} m/s`;
        const end = o.end ? o.end(r, sum) : null; if (end) return end;
        if (b.inNet) return { o: 'GOAL · ' + sum(), hold: 1.4 };
        if (r.t > (o.secs || 10)) return { o: sum() };
        return null;
      } };
  }
  const shotEnd = (r, sum) => { const b = m.ball;
    if (r.shotAt == null) return null;
    const pre = r.setAtShot ? 'SET for the shot · ' : 'MOVING at the shot · ';
    if (b.owner === r.gk) return { o: pre + 'HELD · ' + sum(), hold: 1 };
    if (b.inNet) return { o: pre + 'GOAL · ' + sum(), hold: 1.4 };
    if (r.ev('PARRIED') || r.ev('SAVED')) return { o: pre + 'SAVED · ' + sum(), hold: 1 };
    if (r.out) return { o: pre + 'OUT · ' + sum() };
    if (r.t - r.shotAt > 3) return { o: pre + 'loose · ' + sum() };
    return null; };
  function gkTests() {
    const H = () => m.home.players, A = () => m.away.players;
    return [
      gkTest('GK1', 'ball at the far end, his team attacking', 'he should WALK UP to the top of his box and beyond (~18-20 m), behind his defenders', {
        cast: () => [[A()[9], 25, 34, 4, () => dribbleTo(10, 30, 2.2)], [A()[2], 60, 24, 4, sit], [A()[3], 60, 44, 4, sit], [H()[9], 66, 34, 0, sit], [H()[2], 20, 40, 0, sit]],
        ball: () => atFeet(A()[9]), secs: 13 }),
      gkTest('GK2', 'ball at halfway, their attack building', 'up at ~9-12 m while it is far, then back onto the angle as the ball comes - walking / jogging', {
        cast: () => [[H()[7], 48, 34, 0, () => dribbleTo(72, 33, 2.2)], [A()[2], 78, 22, 4, sit], [A()[3], 78, 30, 4, sit], [A()[4], 78, 38, 4, sit], [A()[5], 78, 46, 4, sit]],
        ball: () => atFeet(H()[7]), secs: 12 }),
      gkTest('GK3', 'counter-attack: he is up, they break', 'from 20 m out he gets back quickly (runs), a defender stays goal-side', { gk: [85, 34],
        cast: () => { const s = H()[9]; return [[s, 58, 30, 0, () => dribbleTo(88, 33, 6.2)], [A()[3], 70, 32, 0, () => goalSide(s, 3, 6.4)]]; },
        ball: () => atFeet(H()[9]), secs: 7 }),
      gkTest('GK4', 'dribble in centrally from 30 m, shot at 17 m', 'angle + depth (~5 m → 4 m), then SET and still as the shot comes', {
        cast: () => { const s = H()[9]; return [[s, 74, 34, 0, () => dribbleTo(92, 33, 3.2)], [A()[3], 82, 35, 4, () => goalSide(s, 2.8, 3.6)]]; },
        ball: () => atFeet(H()[9]), trig: () => H()[9].x > 87.5, fire: () => m.doShot(H()[9], 0.72, 0.85), end: shotEnd, secs: 12 }),
      gkTest('GK5', 'wide on the right, 18 m out', 'he takes the near-post side of the angle (on the bisector), not the middle of the goal', {
        cast: () => [[H()[9], 88, 52, 0, () => dribbleTo(91, 50, 1.2)], [A()[4], 92, 47, 4, sit]],
        ball: () => atFeet(H()[9]), secs: 6, end: (r, sum) => r.t > 5.5 ? { o: `${sum()} · stands at y ${r.gk.y.toFixed(1)} (goal ${GOAL_Y0.toFixed(1)}-${GOAL_Y1.toFixed(1)})` } : null }),
      gkTest('GK6', '1v1 breakaway from 30 m, nobody goal-side', 'he comes out to meet him, stops ~3.5 m away and gets big (BLOCK); then the shot', {
        cast: () => [[H()[9], 74, 35, 0, () => dribbleTo(103, 34, 5.0)]],
        ball: () => atFeet(H()[9]), trig: r => len(H()[9].x - r.gk.x, H()[9].y - r.gk.y) < 5.2 || H()[9].x > 97, fire: () => m.doShot(H()[9], 0.6, 0.9), end: shotEnd, secs: 10 }),
      gkTest('GK7', '1v1: a heavy touch', 'the striker knocks it too far ahead - the keeper gets there first and SMOTHERS it', {
        cast: () => [[H()[9], 78, 36, 0, () => chaseBall(103, 34, 4.4)]],
        ball: () => atFeet(H()[9]), evs: [{ at: 1.1, fire: () => { const b = m.ball; b.owner = null; b.vx = 12.5; b.vy = -0.4; b.vz = 0; H()[9].cool = 0.25; } }],
        end: (r, sum) => m.ball.owner === r.gk ? { o: 'SMOTHERED · ' + sum(), hold: 1 } : m.ball.owner === H()[9] && r.t > 2 ? { o: 'the striker got it back · ' + sum() } : null, secs: 7 }),
      gkTest('GK8', 'through ball behind the defence (he is first)', 'he SWEEPS it outside his box and clears it with his feet', { gk: [96, 34],
        cast: () => [[H()[6], 62, 30, 0, sit], [H()[9], 66, 42, 0, () => chaseBall(100, 34, 5)], [A()[2], 76, 30, 4, sit], [A()[3], 76, 40, 4, sit]],
        ball: () => atFeet(H()[6]), evs: [{ at: 0.5, fire: () => { const p = H()[6]; m.kick(p, 91, 35, 0, 0, 0.12, { mode: 'through' }); } }],
        end: (r, sum) => { const b = m.ball; if (b.lastP === r.gk && !b.owner && r.t > 1) return { o: `SWEPT + ${r.gk.hands ? 'HANDLED' : 'CLEARED'} · ` + sum(), hold: 1 };
          if (b.owner === H()[9]) return { o: 'the striker got there first · ' + sum() }; return null; }, secs: 6 }),
      gkTest('GK9', 'through ball, the striker is first', 'he should NOT come - hold, set, then deal with the 1v1', { gk: [96, 34],
        cast: () => [[H()[6], 62, 30, 0, sit], [H()[9], 80, 37, 0, () => chaseBall(100, 34, 5)], [A()[2], 79, 30, 4, sit]],
        ball: () => atFeet(H()[6]), evs: [{ at: 0.5, fire: () => { const p = H()[6]; m.kick(p, 89, 35, 0, 0, 0.12, { mode: 'through' }); } }],
        end: (r, sum) => m.ball.owner === H()[9] && r.t > 1.2 ? { o: `${r.modes.includes('SWEEP') ? 'CAME FOR IT (wrong)' : 'HELD BACK'} · ` + sum() } : null, secs: 6 }),
      gkTest('GK10', 'back pass from his defender', 'law: no hands from a team-mate\'s pass - he plays it with his feet and moves it on', {
        cast: () => [[A()[3], 90, 28, 0, sit], [H()[9], 80, 30, 0, sit]],
        ball: () => atFeet(A()[3]), evs: [{ at: 0.5, fire: () => { const p = A()[3], g = m.away.players[0], d = len(g.x - p.x, g.y - p.y); m.doPass(p, { x: (g.x - p.x) / d, y: (g.y - p.y) / d }, 'ground'); } }],
        end: (r, sum) => { const b = m.ball; if (b.owner === r.gk) r.got = r.gk.hands ? 'PICKED IT UP (wrong)' : 'FEET ONLY'; if (r.got && b.lastP === r.gk && !b.owner) return { o: `${r.got} → moved it on · ` + sum(), hold: 1 }; return null; }, secs: 6 }),
      gkTest('GK11', 'a lob over him while he is up', 'he is 15 m out; a chip from 40 m: he turns and runs BACK', { gk: [90, 34],
        cast: () => [[H()[7], 62, 34, 0, sit]],
        ball: () => atFeet(H()[7]), evs: [{ at: 0.6, fire: () => { const p = H()[7]; m.kick(p, 101, 33, 0, 0, 0.12, { mode: 'lob', lobPow: 0.85 }); } }],
        end: (r, sum) => { const b = m.ball; if (b.owner === r.gk) return { o: 'GOT BACK + CAUGHT IT · ' + sum(), hold: 1 }; if (b.inNet) return { o: 'LOBBED · ' + sum(), hold: 1.2 };
          if (r.t > 4 && !b.owner && b.z < 0.2 && len(b.vx, b.vy) < 1) return { o: 'ball loose · ' + sum() }; return null; }, secs: 7 }),
    ];
  }
  // ======================================================================= t-017 KEEPER 1v1 + TRACKING (Luca 25 Oct 02:58, urgent:
  // "very broken gk logic ... it does not track naturally anymore, many time you could just walk around it and score").
  // Their keeper (right-hand goal) with the real AI against one striker who tries to walk round him: straight at him,
  // then past his side, then a tap into the empty net. Each line says who won: GOAL (he was walked round), or he won it
  // (blocked / smothered / took it off his feet), plus how he moved: how close he got, how long he stood still while the
  // striker was within 4 m, and the modes he went through.
  const kpRound = o => () => {                                                   // the striker: in, round him, finish
    const st = { phase: 'in', t: 0 };
    return (p, dt) => {
      const b = m.ball, gk = m.away.players[0]; st.t += dt;
      if (st.phase === 'shot') { p.steer(0, 0, dt); return; }
      if (b.owner !== p) {                                                       // a heavy touch / a knock: go and get it back
        if (!b.owner && !b.inNet && !p.busy()) { const pt = m.intercept(p, 6.2); p.moveTo(pt.x, pt.y, 6.2, dt); } else p.steer(0, 0, dt); return; }
      if (p.busy()) { p.steer(0, 0, dt); return; }
      const d = len(gk.x - p.x, gk.y - p.y);
      let tx = gk.x, ty = gk.y, v = o.v;
      if (st.phase === 'in' && d < o.cut) { st.phase = o.feint ? 'feint' : 'round'; st.side = o.side || (p.y >= gk.y ? 1 : -1); st.t = 0; }
      if (st.phase === 'feint') { tx = gk.x; ty = gk.y - st.side * 3.2; if (st.t > 0.35) { st.phase = 'round'; st.t = 0; } }
      if (st.phase === 'round') { tx = gk.x + 0.6; ty = gk.y + st.side * 3.4; v = Math.max(o.v, 4.2); if (p.x > gk.x - 0.3) st.phase = 'finish'; }
      if (st.phase === 'finish') {                                               // past him: walk it in, tap it into the far side
        tx = GX + 1; ty = gk.y > 34 ? 31.2 : 36.8;
        if (GX - p.x < 7.5 || len(gk.x - p.x, gk.y - p.y) > 2.2 && GX - p.x < 11) { st.phase = 'shot'; m.kick(p, GX + 1.5, ty, 14, 0.3, 0.12, { shot: true, power: 0.3 }); return; }
      }
      const dx = tx - p.x, dy = ty - p.y, dl = len(dx, dy) || 1; p.wantDir = { x: dx / dl, y: dy / dl }; m.carrySteer(p, dx / dl, dy / dl, v, dt);
    };
  };
  function kpTest(id, name, sub, o) {
    return gkTest(id, name, sub, {
      gk: o.gk, secs: o.secs || 9,
      cast: () => [[m.home.players[9], o.from[0], o.from[1], 0, o.bot || kpRound(o)]],
      ball: r => { atFeet(m.home.players[9]); r.kp = { minD: 99, stillT: 0, maxOff: 0, offN: 0, offS: 0 }; },
      end: (r, sum) => {
        const gk = r.gk, b = m.ball, s = m.home.players[9], K = r.kp, dS = len(gk.x - s.x, gk.y - s.y);
        K.minD = Math.min(K.minD, len(gk.x - b.x, gk.y - b.y));
        if (dS < 4 && gk.speed < 0.3 && gk.state !== 'dive') K.stillT += STEP;
        if (o.track && b.owner === s) { const g = m.gkBisector(b.x, b.y, GX, -1, 3), ux = g.x - b.x, uy = g.y - b.y, ul = len(ux, uy) || 1; const off = Math.abs(((gk.x - b.x) * uy - (gk.y - b.y) * ux) / ul);   // (how far he is off the line that halves the angle, wherever he stands on it)
          K.maxOff = Math.max(K.maxOff, off); K.offS += off; K.offN++; }
        const tail = () => `${o.track ? `off the angle: avg ${(K.offS / Math.max(1, K.offN)).toFixed(2)} m, max ${K.maxOff.toFixed(2)} m · ` : ''}closest to the ball ${K.minD.toFixed(1)} m · stood still near him ${K.stillT.toFixed(1)} s · ${sum()}`;
        if (b.owner === gk) return { o: 'KEEPER WON IT · ' + tail(), hold: 1 };
        if (!b.owner && b.lastP === gk && r.t > 0.3) return { o: 'KEEPER GOT TO IT · ' + tail(), hold: 1 };
        if (b.inNet) return { o: 'GOAL (walked round him) · ' + tail(), hold: 1.4 };
        if (o.track && r.t > (o.secs || 9) - 0.05) return { o: 'TRACKED · ' + tail() };
        if (r.out) return { o: 'OUT · ' + tail() };
        if (r.t > (o.secs || 9) - 0.05) return { o: 'no result · ' + tail() };
        return null;
      },
    });
  }
  function kpTests() {
    const across = () => () => { let dir = 1; return (p, dt) => { const b = m.ball; if (b.owner !== p) { p.steer(0, 0, dt); return; }
      if (p.y > 47) dir = -1; if (p.y < 21) dir = 1; const ty = p.y + dir * 5; const dx = 88 - p.x, dy = ty - p.y, dl = len(dx, dy) || 1; p.wantDir = { x: dx / dl, y: dy / dl }; m.carrySteer(p, dx / dl, dy / dl, 3.4, dt); }; };
    return [
      kpTest('KP1', 'walk at him, round his side', 'the striker dribbles at 3 m/s from 22 m and goes round him at 2.5 m: he must not just stand there', { from: [83, 34], v: 3.0, cut: 2.5, side: 1 }),
      kpTest('KP2', 'run at him, round him early', 'at 5.5 m/s, cutting round him from 3.5 m away', { from: [78, 35], v: 5.5, cut: 3.5, side: -1 }),
      kpTest('KP3', 'slow walk, round him late', 'at 2 m/s, straight at him, cutting round at 1.8 m', { from: [86, 33], v: 2.0, cut: 1.8, side: 1 }),
      kpTest('KP4', 'from the angle, round the near side', 'coming in from the right of the box (y 46) at 3.5 m/s, going round him on the near-post side', { from: [86, 47], v: 3.5, cut: 2.8, side: 1 }),
      kpTest('KP5', 'feint one way, go the other', 'shows him the left at 3 m, then goes round his right', { from: [82, 34], v: 3.6, cut: 3.0, side: 1, feint: true }),
      kpTest('KP6', 'dribbling across the edge of the box', 'the striker walks the ball side to side along the D (17 m): he must stay on the angle (the line that halves it), smoothly', { from: [88, 22], bot: across(), track: true, secs: 9 }),
    ];
  }
  // ======================================================================= t-007 KEEPER SAVES (Luca 24 Oct 05:57: "the gk ai needs major
  // improvements should be able to jump and understand the x y z more, diving left right lower higher ... the gk should try
  // catch more if the kick is weaker ... there are virtually no corners happening"). Their keeper (right-hand goal) with
  // the real AI. Each line says the save he picked (from where the ball crosses him: side and height) and what came of it.
  function gkxOut(r) {
    const b = m.ball, gk = r.gk;
    if (gk.state === 'dive' && gk.saveKind) r.kind = gk.saveKind;
    else if (!r.kind && b.save && b.save.gk === gk && b.save.act && b.save.act !== 'step') r.kind = b.save.act === 'set' ? 'stand' : b.save.act;
    else if (!r.kind && b.owner === gk) r.kind = gk.claimHigh ? 'claim' : 'stand';
    const touch = ['TIPPED OVER', 'ROUND THE POST', 'PARRIED', 'PUNCHED', 'A HAND TO IT'].find(e => r.ev(e));
    if (touch && !r.touch) { r.touch = touch; r.touchT = r.t; }
    const head = `${(r.kind || 'no save').toUpperCase()}${r.info ? ' (' + r.info + ')' : ''} · `;
    if (r.out) return { o: head + (r.touch ? r.touch.toLowerCase() + ' · ' : '') + `OUT · ${r.out.toLowerCase()}`, hold: 0.6 };   // (first: the Lab leaves a dead ball where it went out)
    if (b.inNet) return { o: head + (r.touch ? r.touch.toLowerCase() + ' · ' : '') + 'GOAL', hold: 1.4 };
    if (b.owner === gk) return { o: head + 'HELD', hold: 1 };
    if (r.touch && b.owner) return { o: head + r.touch.toLowerCase() + ` · in play (#${b.owner.num} ${b.owner.team === gk.team ? 'his side' : 'theirs'})` };
    if (r.touch && r.t - r.touchT > 3) return { o: head + r.touch.toLowerCase() + ' · in play (loose)' };
    return null;
  }
  function gkxShot(id, name, sub, spot, tgt, speed, power) {
    return { id, group: 'GKX', name, sub, kind: 'shot',
      setup(r) { shotSetup(r, spot, false); Object.assign(r.gk, { guard: 1, gkS: null, gkMode: '', claiming: false, saveKind: '', leap: 0, gkN: null, rushT: 0 }); const ty = tgt.y == null ? r.gk.y : tgt.y; r.marks = [{ x: GX, y: ty, r: 0.3 }];
        r.info = `${kmh(speed)} km/h, ${tgt.low ? 'low' : tgt.z.toFixed(1) + ' m'}`;
        r.action = { at: 0.7, fire: () => fireShot(r, tgt, speed, power) }; },
      check(r) { const b = m.ball;
        if (r.shotT == null) { if (!b.owner && b.lastP === r.shooter && r.fired) r.shotT = r.t; else return null; }
        return gkxOut(r) || (r.t - r.shotT > 5 ? { o: (r.kind || 'no save').toUpperCase() + ' · nothing' } : null); } };
  }
  // a lob from a team-mate's distance, their keeper a few metres off his line; extra = the men around the drop
  function gkxLob(id, name, sub, o) {
    return { id, group: 'GKX', name, sub, kind: 'shot', o,
      setup(r) { const o = r.sc.o;
        const s = m.home.players[7], gk = m.away.players[0], extra = o.extra ? o.extra() : []; cast([s, gk, ...extra.map(q => q[0])]);
        put(s, o.from[0], o.from[1], dirIndex(o.to[0] - o.from[0], o.to[1] - o.from[1])); atFeet(s); put(gk, o.gk[0], o.gk[1], 4); Object.assign(gk, { guard: 1, gkS: null, gkMode: '', claiming: false, saveKind: '', leap: 0, gkN: null, rushT: 0 });
        for (const [q, x, y, f, bot] of extra) { put(q, x, y, f); if (bot) r.bots.set(q, bot(q)); }
        Object.assign(r, { human: s, shooter: s, gk, marks: [{ x: o.to[0], y: o.to[1], r: 0.5 }], info: o.info });
        r.action = { at: 0.6, fire: () => m.kick(s, o.to[0], o.to[1], 0, 0, 0.12, { mode: 'lob', lobPow: o.pow }) };
      },
      check(r) { const b = m.ball;
        if (r.shotT == null) { if (!b.owner && b.lastP === r.shooter && r.fired) r.shotT = r.t; else return null; }
        if (r.gk.gkMode === 'BACK' || r.gk.gkMode === 'CLAIM') r.went = r.gk.gkMode;
        const o = gkxOut(r); if (o) return o;
        if (b.owner && b.owner !== r.gk) return { o: `${(r.kind || 'no save').toUpperCase()} · #${b.owner.num} (${b.owner.team === r.gk.team ? 'his side' : 'theirs'}) got it` };
        return r.t - r.shotT > 6 ? { o: (r.kind || 'no save').toUpperCase() + ' · nothing' } : null; } };
  }
  function gkxTests() {
    const H = () => m.home.players, A = () => m.away.players;
    const sp8 = Object.assign(pwTest('GKX8', 'a LV2 special against his LV1 save', 'stronger than his save: a hand to it, over or wide → corner (made to happen here)', { lv: 2, from: [86, 31], block: [], save: 1 }), { group: 'GKX', force: 'hand' });
    const pwCheck = sp8.check; sp8.check = r => { pwCheck(r); if (r.shotT == null) return null; r.kind = r.ev('A HAND TO IT') ? 'a hand to it' : r.kind; const o = gkxOut(r); return o || (r.t - r.shotT > 5 ? { o: 'nothing' } : null); };
    return [
      gkxShot('GKX1', 'a weak shot straight at him', 'soft and at his body: he holds it', SPOTS[1], { y: null, low: true }, 14, 0.3),
      gkxShot('GKX2', 'a hard shot at his chest', 'catch or parry (the harder, the less he holds)', SPOTS[1], { y: null, z: 1.2 }, 27, 0.8),
      gkxShot('GKX3', 'a low hard shot to the corner', 'low dive, pushed wide (round the post or out to the side)', { n: '14 m', x: 91, y: 35 }, { y: GOAL_Y0 + 0.9, low: true }, 26, 0.8),
      gkxShot('GKX4', 'a high shot to the corner', 'high dive, round the post → corner', { n: '16 m', x: 89, y: 33 }, { y: GOAL_Y1 - 1.3, z: 1.8 }, 24, 0.8),
      gkxShot('GKX5', 'a hard shot under the bar', 'he jumps and tips it over → corner', { n: '18 m', x: 87, y: 34 }, { y: null, z: 2.3 }, 25, 0.8),
      gkxLob('GKX6', 'a lob over him he can reach', 'he reads it, goes up and catches it', { from: [72, 30], to: [105.5, 34], pow: 0.5, gk: [99, 34], info: 'lob from 30 m, he is 6 m out' }),
      gkxLob('GKX7', 'a lob into a crowd', 'two of theirs at the drop: he punches it clear', { from: [80, 24], to: [102.4, 34], pow: 0.6, gk: [103.6, 34], info: 'lob into the six-yard box',
        extra: () => [[H()[9], 98.2, 31.6, 0, sit], [H()[8], 98.8, 33.0, 0, sit], [H()[6], 99.8, 32.4, 0, sit]] }),
      sp8,
    ];
  }
  // ======================================================================= v0.9.2 CHIP SHOT tests (Luca: "Lob in the box with the POV of the
  // attacker looking at the goal becomes a chip ... faster with a more aggressive curve")
  function chipTest(id, name, sub, o) {
    return { id, group: 'CH', name, sub, kind: 'shot', you: !!o.you,
      setup(r) {
        const s = m.home.players[9], gk = m.away.players[0], extra = o.extra ? o.extra() : []; cast([s, gk, ...extra.map(q => q[0])]);
        put(s, o.from[0], o.from[1], o.face != null ? o.face : dirIndex(GX - o.from[0], 34 - o.from[1])); atFeet(s); put(gk, o.gk[0], o.gk[1], 4); gk.guard = 1; gk.gkS = null;
        for (const [q, x, y, f, bot] of extra) { put(q, x, y, f); if (bot) r.bots.set(q, bot(q)); }
        if (o.bot) r.bots.set(s, o.bot(s));
        Object.assign(r, { human: s, shooter: s, gk, marks: [], peak: 0, overK: null, o });
        if (o.at != null) r.action = { at: o.at, fire: () => o.fire(s) }; else r.fired = true;
      },
      check(r) {
        const b = m.ball, s = r.shooter;
        if (o.trig && !r.trigd && o.trig(r)) { r.trigd = true; o.fire(s); }
        if (r.shotT == null) { if (!b.owner && b.lastP === s && !m.pending && (r.fired || r.trigd)) { r.shotT = r.t; r.chip = !!b.chip; r.v0 = len(b.vx, b.vy); r.vz0 = b.vz; } else return r.t > 9 ? { o: 'no shot' } : null; }
        r.peak = Math.max(r.peak, b.z); const gk = r.gk; if (r.overK == null && Math.abs(b.x - gk.x) < 0.3) r.overK = b.z;
        const head = `${r.chip ? 'CHIP' : 'LOB / NOT A CHIP'} · ${kmh(r.v0)} km/h, peak ${r.peak.toFixed(1)} m${r.overK != null ? `, ${r.overK.toFixed(1)} m over the keeper` : ''} · `;
        if (b.inNet) return { o: head + `GOAL (${(r.t - r.shotT).toFixed(2)} s)`, hold: 1.4 };
        if (b.owner === gk) return { o: head + 'keeper caught it', hold: 1 };
        if (r.ev('PARRIED') || r.ev('SAVED')) return { o: head + 'keeper saved it', hold: 1 };
        if (r.out) return { o: head + 'OUT · ' + r.out.toLowerCase() };
        if (b.owner && b.owner !== gk && r.t - r.shotT > 0.3) return { o: head + `${b.owner.team === s.team ? 'a team-mate' : 'a defender'} has it` };
        if (r.t - r.shotT > 4) return { o: head + 'ball loose' };
        return null;
      } };
  }
  function chipTests() {
    const press = () => { const m2 = m; m2.lobCharge = -1; };
    return [
      chipTest('CH1', 'chip a keeper who is off his line', '14 m out, keeper 7 m off his line: tap LOB facing goal = CHIP', { from: [91, 33], gk: [98, 34], at: 0.6, fire: s => m.chipShot(s, 0.15, 0) }),
      chipTest('CH2', 'chip a keeper who is ON his line', '12 m out, keeper on his line: he should deal with it', { from: [93, 34], gk: [LINE_X, 34], at: 0.6, fire: s => m.chipShot(s, 0.1, 0) }),
      chipTest('CH3', '1v1: the keeper rushes out - chip him', 'the striker runs at goal; when the keeper comes within 7 m he chips', { from: [82, 35], gk: [LINE_X, 34],
        bot: () => dribbleTo(103, 34, 4.6), trig: r => len(r.shooter.x - r.gk.x, r.shooter.y - r.gk.y) < 7 && r.shooter.x > 88.6, fire: s => m.chipShot(s, 0.2, 0) }),
      chipTest('CH4', 'long hold from the edge of the box', '16 m out, keeper 10 m out: a higher chip', { from: [89, 36], gk: [95, 35], at: 0.6, fire: s => m.chipShot(s, 0.8, 0) }),
      chipTest('CH5', 'in the box but facing AWAY from goal', 'LOB with his back to goal = a normal lob, not a chip', { from: [94, 30], gk: [LINE_X, 34], face: 4, at: 0.6,
        fire: s => { const dir = dirVec(s.face); if (m.chipCan(s, dir)) m.chipShot(s, 0.1, 0); else m.doPass(s, dir, 'lob'); } }),
      chipTest('CH6', 'the computer chips a keeper who has come out', 'an AI striker 1v1 in the box, the keeper 7 m off his line: does it decide to chip?', { from: [90, 35], gk: [98, 34],
        bot: () => (p, dt) => { const b = m.ball; if (b.owner !== p) { p.steer(0, 0, dt); return; } m.carrierAI2(p, dt); }, trig: () => false, fire: () => {} }),
    ];
  }
  // ======================================================================= t-005 LOB + CHIP, step 1 (Luca picked direction B, in steps:
  // "A's fixes plus readability first"). From docs/lob-chip.md's test spec: LC1 tap lobs and LC2 power lobs really peak
  // at their design height (lobApex), LC7 their keeper reads a lob over him (a delay by level), LC8 the landing ring
  // and the shadow. Measured with the game's own ballStep; each line says what it got against what it should be.
  const LVL_NAME = { easy: 'EASY', normal: 'NORMAL', hard: 'HARD', rise: 'RISE' };
  function lcTest(id, name, sub, o) {
    return { id, group: 'LC', name, sub, kind: 'lc', lvl: o.lvl,
      setup(r) {
        const p = m.home.players[6], q = o.rcv ? m.home.players[9] : null, gk = o.gk ? m.away.players[0] : null; cast([p, q, gk].filter(Boolean));
        put(p, o.from[0] - 0.5, o.from[1], 0); atFeet(p);
        if (q) { put(q, o.from[0] + o.rcv, o.from[1], 4); r.bots.set(q, receive); }
        if (gk) { put(gk, o.gk[0], o.gk[1], 4); Object.assign(gk, { guard: 1, gkS: null, gkMode: '', rushT: 0, claiming: false }); }
        Object.assign(r, { human: p, shooter: p, rcv: q, gk, o, marks: [], above: 0, rings: [], modes: [] });
        r.action = { at: 0.5, fire: () => { o.fire(p, q); const k = m.pending; if (k) r.tgt = { x: k.tx, y: k.ty }; } };
      },
      check: lcCheck };
  }
  function lcCheck(r) {
    const b = m.ball, o = r.o, gk = r.gk, f2 = v => v.toFixed(2);
    if (gk && gk.gkMode !== r.lastMode) { r.lastMode = gk.gkMode;                // his modes, timed from the kick
      r.modes.push(gk.gkMode + (r.shotT != null ? ` ${f2(r.air0 ?? 0)}s` : ''));
      if (r.shotT != null && r.backT == null && /^(BACK|CLAIM|SWEEP|SMOTHER)$/.test(gk.gkMode)) { r.backT = r.air0 ?? 0; r.backMode = gk.gkMode; } }   // (any move for the ball, timed
    if (gk) r.air0 = m.ball.owner ? 0 : m.ball.airT || 0;                          //  in flight time as he saw it - the kick's hit-stop isn't flight)
    if (r.shotT == null) { if (!b.owner && r.fired && !m.pending) { r.shotT = r.t; r.start = { x: b.x, y: b.y }; r.n0 = b.bounced || 0;
      r.design = lobApex(r.tgt ? len(r.tgt.x - b.x, r.tgt.y - b.y) : 25, o.pow ?? null); } else return null; }
    const ft = r.t - r.shotT, base = ballPx() * ballS() / 24, sk = m.ballSh.scaleX / base;   // (the shadow as last drawn: for the ball where it was a step ago)
    if (!r.land) {
      if (b.z > 2.7) r.above += STEP;
      if (r.prevZ != null && r.prevZ >= (r.shPk ? r.shPk.z : 0)) r.shPk = { z: r.prevZ, k: sk };
      if (r.prevZ != null && r.prevZ >= SHADOW_Z && !r.sh6) r.sh6 = { z: r.prevZ, k: sk };
      const R = m.ringSpot(); if (R) { r.rings.push(R); r.ringNow = R; } else r.noRing = (r.noRing || 0) + 1;
      if ((b.bounced || 0) > r.n0) r.land = { x: b.x, y: b.y, t: ft };
    } else if (r.ringAfter == null && ft - r.land.t > 0.5 && !b.owner) r.ringAfter = !!m.ringSpot();
    r.prevZ = b.z;
    const peak = `peak ${f2(r.maxZ)} m (design ${f2(r.design)}, ${Math.abs(r.maxZ - r.design) <= (o.tol || 0.3) ? 'ok' : 'OFF'})`;
    if (o.kind === 'tap') {                                                       // LC1: the team-mate meets it (often on his chest, before it lands)
      const L = r.land || r.ringNow, lt = `${f2(r.land ? r.land.t : ft)} s ${r.land ? 'to land' : 'in the air'}, ${f2(r.above)} s over 2.7 m`
        + (L ? ` · comes down ${len(L.x - r.o.from[0] - r.o.rcv, L.y - r.o.from[1]).toFixed(1)} m from where he stood (${len(L.x - r.o.from[0] - r.o.rcv, L.y - r.o.from[1]) <= 2.5 ? 'ok' : 'OFF'})` : '');
      if (b.lastP === r.rcv && !b.owner && !r.how) r.how = 'header';
      if (b.owner === r.rcv) return { o: `${peak} · ${lt} · CONTROLLED (${r.how || (r.prevZ2 > 0.9 ? 'chest' : 'feet')})` };
      r.prevZ2 = b.z;
      if (r.out) return { o: `${peak} · ${lt} · OUT` };
      if (ft > 6) return { o: `${peak} · ${lt} · NOT CONTROLLED` };
      return null;
    }
    if (o.kind === 'pow') {                                                       // LC2: how far, how high
      if (!r.land) return ft > 6 ? { o: `${peak} · never came down` } : null;
      const aim = 12 + (LOB_MAX - 12) * o.pow, dist = len(r.land.x - r.start.x, r.land.y - r.start.y);
      return { o: `lands ${dist.toFixed(1)} m out (12 + ${LOB_MAX - 12} × ${o.pow} = ${aim.toFixed(0)} ± 3, ${Math.abs(dist - aim) <= 3 ? 'ok' : 'OFF'}) · ${peak} · ${f2(r.land.t)} s in the air`, hold: 0.6 };
    }
    if (o.kind === 'gk') {                                                        // LC7: when does he turn for it, does he get there
      const rd = m.gkRead(gk);
      const head = `${LVL_NAME[r.sc.lvl] || 'BASE'}: ${r.backT != null ? `goes for it after ${f2(r.backT)} s (${r.backMode}; his read ${f2(rd)} s, ${r.backT >= 0.15 - 1e-6 && r.backT <= 0.35 + STEP ? 'ok' : 'OFF'})` : 'never went for it'} · `;
      const tail = ` · ${r.modes.slice(0, 6).join(' → ')}`;
      if (b.owner === gk) return { o: head + 'GOT BACK + CAUGHT IT' + tail, hold: 1 };
      if (b.inNet) return { o: head + 'LOBBED (goal)' + tail, hold: 1.2 };
      if (r.ev('PARRIED') || r.ev('SAVED')) return { o: head + 'SAVED' + tail, hold: 1 };
      if (r.out) return { o: head + 'OUT · ' + r.out.toLowerCase() + tail };
      if (ft > 5) return { o: head + 'ball loose' + tail };
      return null;
    }
    // LC8: the ring against the real first bounce, for the whole flight; the shadow as drawn
    if (!r.land || r.ringAfter == null) return ft > 7 ? { o: `${peak} · never came down` } : null;
    const err = r.rings.length ? Math.max(...r.rings.map(R => len(R.x - r.land.x, R.y - r.land.y))) : null;
    const ring = err == null ? 'NO RING' : `ring within ${f2(err)} m of the first bounce for the whole flight (${r.rings.length} frames${r.noRing ? `, missing ${r.noRing}` : ''}; ${err <= 1 && !r.noRing ? 'ok' : 'OFF'}) · ${r.ringAfter ? 'still there' : 'GONE'} 0.5 s after it landed`;
    const sh = `shadow ${Math.round(r.shPk.k * 100)}% at the peak (${r.shPk.z.toFixed(1)} m)` + (r.sh6 ? `, ${Math.round(r.sh6.k * 100)}% at ${r.sh6.z.toFixed(1)} m (${r.sh6.k >= 0.6 && r.sh6.k <= 0.7 ? 'ok' : 'OFF'})` : `; from ${SHADOW_Z} m up: ${Math.round(shadowK(SHADOW_Z) * 100)}%`);
    return { o: `${ring} · ${sh} · ${peak}`, hold: 0.6 };
  }
  function lcTests() {
    const tap = (id, d) => lcTest(id, `tap LOB to a team-mate ${d} m away`, `nobody in between: does it peak at its design height (${lobApex(d, null).toFixed(2)} m), does he control it?`,
      { kind: 'tap', from: [30, 34], rcv: d, fire: (p, q) => m.doPass(p, { x: 1, y: 0 }, 'lob', q) });
    const pow = (id, c) => lcTest(id, `power lob · held ${Math.round(c * 100)}%`, `lands 12 + ${LOB_MAX - 12} × hold m out (± 3), peaks at its design height (± 0.4 m)`,
      { kind: 'pow', pow: c, tol: 0.4, from: [25, 34], fire: p => m.powerLob(p, { x: 1, y: 0 }, c) });
    const gk = (id, lvl) => lcTest(id, `a lob over their keeper · ${LVL_NAME[lvl]}`, `he is 8 m off his line; a 38 m lob drops behind him: he turns after a read of 0.15-0.35 s by level, not at once`,
      { kind: 'gk', lvl, from: [64.5, 34], gk: [PITCH_L - 8, 34], fire: p => m.kick(p, PITCH_L - 2, 34, 0, 0, 0.12, { mode: 'lob', loft: true }) });
    const rs = (id, name, sub, fire, pow) => lcTest(id, name, sub, { kind: 'ring', from: [30, 34], fire, pow, tol: pow != null ? 0.4 : 0.3 });
    return [
      tap('LC1', 25), tap('LC1-12', 12), tap('LC1-40', 40),
      pow('LC2', 1), pow('LC2-25', 0.25), pow('LC2-50', 0.5),
      gk('LC7', 'normal'), gk('LC7-E', 'easy'), gk('LC7-H', 'hard'), gk('LC7-R', 'rise'),
      rs('LC8', 'the landing ring + the shadow · 25 m lob', 'the ring sits on the real first bounce the whole flight and stays; the shadow shrinks as it climbs',
        p => m.kick(p, 55, 34, 0, 0, 0.12, { mode: 'lob', loft: true })),
      rs('LC8-8M', 'the landing ring + the shadow · full power lob', 'an 8 m high ball: the shadow at 6 m up should be 60-70% of its size on the grass',
        p => m.powerLob(p, { x: 1, y: 0 }, 1), 1),
    ];
  }
  // ======================================================================= t-008 LOB REMAKE (Luca 24 Oct 05:57: "make the lob a hold until its
  // the right spot then release is the actual lob kick [...] a smooth aerial battle where you have to mash kick against
  // the computer"). The Lab plays YOU here through the touch controls (Input.touch: the same path as the phone's
  // buttons), so it's the game's own input code: LB1-LB3 hold LOB, walk the ring out to ~12 / 25 / 40 m, let go - does it
  // land on the ring? LB4 a quick tap (the instant lob, as before). LB5 the ring settles on a team-mate, he walks to it,
  // then times his run and goes for goal. LB6 / LB7 an AERIAL BATTLE you win (the Lab mashes) / lose (no mash). LB8 the
  // computer's lob into a contest with your defender. (AERIAL.chance is 1 in LB6-LB8, so the battle always happens.)
  const lbBot = (q, dt) => { if (m.lobAimMate(q, dt) || m.lobRun(q, dt)) return; const b = m.ball;   // a team-mate: the game's own receiving run
    if (!b.owner && b.target === q) { const pt = m.intercept(q, q.top(true, false), 0.12, 1.9); q.moveTo(pt.x, pt.y, q.top(true, false), dt); } else q.steer(0, 0, dt); };
  const lbMark = (man, side) => (d, dt) => { const b = m.ball;                    // a defender on him: goal side, a beat after he moves (as the game's marker)
    if (b.lob && !b.owner && (b.airT || 0) > LOB2.markDelay) d.moveTo(man.x + side * 0.6, man.y + 0.3, d.top(true, false), dt); else d.steer(0, 0, dt); };
  const lbWho = p => `${p.team === m.home ? 'your' : 'their'} #${p.num}`;
  function lbTest(id, name, sub, o) {
    return { id, group: 'LB', name, sub, kind: 'lb', you: true, lvl: o.lvl,
      setup(r) {
        Object.assign(Input.touch, { x: 0, y: 0, btn: {} });
        const H = m.home.players, A = m.away.players, list = [];
        const K = o.cpu ? A[6] : H[6]; list.push(K);
        const mates = (o.mates || []).map(([i, x, y]) => { const q = (o.cpu ? A : H)[i]; list.push(q); return [q, x, y]; });
        const opps = (o.opps || []).map(([i, x, y]) => { const q = (o.cpu ? H : A)[i]; list.push(q); return [q, x, y]; });
        const gk = o.gk ? (o.cpu ? H[0] : A[0]) : null; if (gk) list.push(gk);
        cast(list);
        put(K, o.from[0], o.from[1], o.cpu ? 4 : 0); atFeet(K);
        for (const [q, x, y] of mates) { put(q, x, y, o.cpu ? 4 : 0); r.bots.set(q, lbBot); }
        for (const [q, x, y] of opps) { put(q, x, y, o.cpu ? 0 : 4); }
        if (o.mark) { const [di, mi] = o.mark; r.bots.set(opps[di][0], lbMark(mates[mi][0], o.cpu ? -1 : 1)); }
        if (gk) { put(gk, o.cpu ? PITCH_L - LINE_X : LINE_X, 34, o.cpu ? 0 : 4); Object.assign(gk, { guard: 1, gkS: null, gkMode: '', rushT: 0, claiming: false }); }
        Object.assign(m, { aerial: null, lobAim: null, lobAimLast: null, aerialAt: -1e9, slowMo: 0, camTarget: null, lobCharge: -1 });
        if (o.battle) { LAB.aerialChance = LAB.aerialChance ?? AERIAL.chance; AERIAL.chance = 1; }
        const you = o.cpu ? opps[0][0] : K;
        Object.assign(r, { human: you, shooter: K, kicker: K, gk, o, marks: [], rcv: mates[0] ? mates[0][0] : null, n0: 0 });
        if (o.cpu) r.action = { at: 0.5, fire: () => m.doPass(K, { x: -1, y: 0 }, 'lob', r.rcv) };   // the computer's own lob (to its man)
      },
      check: lbCheck };
  }
  function lbCheck(r) {
    const b = m.ball, o = r.o, K = r.kicker, T = Input.touch, f1 = v => v.toFixed(1), f2 = v => v.toFixed(2);
    const done = res => { Object.assign(T, { x: 0, y: 0, btn: {} }); return res; };
    // ---- you: LOB held, the stick walks the ring to o.aimD along o.ax (o.drag: a push first), then let go - or a tap
    if (!o.cpu) {
      if (r.ph == null && r.t >= 0.5) { r.ph = 'hold'; T.btn.lob = true; r.pressT = r.t; }
      else if (r.ph === 'hold') {
        const A = m.lobAim, ht = r.t - r.pressT;
        if (o.tap) { if (ht >= 0.08) { T.btn.lob = false; r.ph = 'gone'; r.tapT = ht; } }
        else if (A) {
          const d = len(A.x - K.x, A.y - K.y); r.ring0 = r.ring0 || { x: A.x, y: A.y, q: A.q };
          if (A.q) { r.mag = A.q; r.magFrom = r.magFrom || { x: A.q.x, y: A.q.y }; }
          if (o.drag && ht < o.drag[2]) { T.x = o.drag[0]; T.y = o.drag[1]; }
          else if (o.aimD != null && Math.abs(d - o.aimD) > 0.35 && ht < 4) { const sg = d < o.aimD ? 1 : -1; T.x = o.ax[0] * sg; T.y = o.ax[1] * sg; }
          else { T.x = T.y = 0; if (ht >= (o.holdT || 0.3)) { r.ringD = d; T.btn.lob = false; r.ph = 'gone'; r.holdT = ht; } }
        } else if (ht > 0.2) { T.btn.lob = false; r.ph = 'gone'; }
      }
    }
    // ---- the battle: you are the man in it; the Lab mashes SHOOT every o.mash-th step (0: not at all)
    const AB = m.aerial;
    if (AB) { if (!r.bat) r.bat = { at: { x: AB.D.x, y: AB.D.y }, steps: 0 }; const me = AB.att.p.team === m.home ? AB.att.p : AB.def.p; r.human = me;
      r.bat.steps++; T.btn.shoot = !!o.mash && AB.phase === 'mash' && r.bat.steps % (o.mash * 2) < o.mash; }
    else if (r.bat && !r.bat.over) { r.bat.over = true; T.btn.shoot = false; r.bL = m.aerialLast; }
    // ---- the kick and its flight
    if (r.kickT == null) { if (!b.owner && !m.pending && b.lastP === K && (r.ph === 'gone' || o.cpu)) { r.kickT = r.t; r.n0 = b.bounced || 0; r.start = { x: b.x, y: b.y }; r.aimed = m.lobAimLast && m.lobAimLast.by === K ? m.lobAimLast : null; r.tgt = b.target; r.lob = !!b.lob; }
      else return r.t > 7 ? done({ o: 'NO KICK' }) : null; }
    const ft = r.t - r.kickT; if (!r.land) r.maxZ = Math.max(r.maxZ, b.z);
    if (!r.land && !r.touch && (b.bounced || 0) > r.n0) r.land = { x: b.x, y: b.y, t: ft };
    if (!r.touch && b.lastP && b.lastP !== K) r.touch = { p: b.lastP, how: b.how ? b.how.kind : 'touch', z: b.z, own: b.owner === b.lastP, at: { x: b.x, y: b.y } };
    const shot = r.touch && (r.touch.how === 'header' || r.touch.how === 'volley' || r.touch.how === 'shot' || r.ev('AERIAL SPECIAL'));
    const end = (head) => { if (b.inNet) return done({ o: head + 'GOAL', hold: 1.4 }); if (r.gk && b.owner === r.gk) return done({ o: head + 'keeper has it' });
      if (r.ev('PARRIED') || r.ev('SAVED')) return done({ o: head + 'SAVED', hold: 1 }); if (r.out) return done({ o: head + 'OUT · ' + r.out.toLowerCase() });
      return null; };
    // LB1-LB3: on the ring?
    if (o.kind === 'aim') {
      if (!r.land) return ft > 6 ? done({ o: `${f1(r.maxZ)} m up · never came down` }) : null;
      const L = r.aimed, err = L ? len(r.land.x - L.x, r.land.y - L.y) : null, d = L ? len(L.x - r.start.x, L.y - r.start.y) : 0;
      const why = !L ? '' : L.apex > lobApex(d, null) + 0.05 ? 'higher: over the man in its path' : L.apex < lobApex(d, null) - 0.05 ? 'driven: a clear lane, short' : 'the open-play lob for the distance';
      return done({ o: L ? `ring ${f1(d)} m out (held ${f2(r.holdT)} s) · peak ${f2(r.maxZ)} m (${why}) · ${f2(r.land.t)} s in the air · lands ${f2(err)} m from the ring (${err <= 1 ? 'ok' : 'OFF'})` : 'NOT AN AIMED LOB', hold: 0.6 });
    }
    if (o.kind === 'tap') {
      const head = `TAP (${f2(r.tapT || 0)} s): ${r.aimed ? 'an AIMED lob (OFF: a tap should be the instant lob)' : 'the instant lob'} to ${r.tgt ? lbWho(r.tgt) : 'nobody'} · peak ${f2(r.maxZ)} m · `;
      if (b.owner === r.rcv) return done({ o: head + `he CONTROLLED it (${r.touch && r.touch.how === 'header' ? 'header' : r.touch && r.touch.z > 0.9 ? 'chest' : 'feet'})` });
      if (b.owner && b.owner.team !== K.team) return done({ o: head + 'they won it' });
      return ft > 6 ? done({ o: head + 'NOT CONTROLLED' }) : null;
    }
    if (o.kind === 'magnet') {
      const mg = r.mag ? `ring settled on ${lbWho(r.mag)} (magnet), he walked ${f1(len(r.mag.x - r.magFrom.x, r.mag.y - r.magFrom.y))} m to it while you aimed` : 'NO MAGNET';
      const head = `${mg} · ${(() => { const P = r.land || (r.touch && r.touch.at); return r.aimed && P ? `${r.land ? 'lands' : 'met'} ${f2(len(P.x - r.aimed.x, P.y - r.aimed.y))} m from the ring` : 'in the air'; })()} · ${r.touch ? `${lbWho(r.touch.p)} met it at ${f1(r.touch.z)} m: ${r.touch.how.toUpperCase()}` : ''} → `;
      if (r.touch && !shot && r.touch.own) return done({ o: head + 'controlled (no shot)' });
      const e = end(head); if (e) return e;
      return ft > 7 ? done({ o: head + 'nothing' }) : null;
    }
    // LB6-LB8: the AERIAL BATTLE
    if (!r.bat) { if (r.touch || r.land || ft > 6) return done({ o: `NO BATTLE · ${r.touch ? `${lbWho(r.touch.p)} ${r.touch.how}` : 'it came down'}` }); return null; }
    if (!r.bat.over) return null;
    const L = r.bL; if (!L) return done({ o: 'BATTLE CALLED OFF' });
    const youAtt = L.att.team === m.home, yn = youAtt ? L.n[0] : L.n[1], cn = youAtt ? L.n[1] : L.n[0], yh = youAtt ? L.hs[0] : L.hs[1], ch = youAtt ? L.hs[1] : L.hs[0];
    let head = `AERIAL BATTLE (${lbWho(L.att)} v ${lbWho(L.def)}) · you ${yn} presses + ${f1(yh)} head start v the computer ${cn} + ${f1(ch)} · ${L.res === 'att' ? 'ATTACKER' : 'DEFENDER'} WON (${L.by.team === m.home ? 'you' : 'the computer'}) → `;
    if (L.res === 'def') { const a = Math.round(Math.atan2(L.dir.y, L.dir.x * L.by.team.side) * 180 / Math.PI);
      head += `CLEARED ${Math.abs(a) < 20 ? 'up the pitch' : (L.dir.y < 0 ? 'to the top touchline' : 'to the bottom touchline')} (${a > 0 ? '+' : ''}${a}° off straight up, he was ${L.at.y < 34 ? 'top' : 'bottom'} side)`;
      return r.t - r.kickT > 2.5 || b.owner || r.out ? done({ o: head + (r.out ? ` · out (${r.out.toLowerCase()})` : b.owner ? ` · ${lbWho(b.owner)} has it` : ''), hold: 0.8 }) : null; }
    head += `${b.how && b.how.kind === 'header' ? 'HEADER' : r.ev('AERIAL SPECIAL') ? 'AERIAL SPECIAL' : b.how ? b.how.kind.toUpperCase() : '?'} at goal · `;
    const e = end(head); if (e) return e;
    return r.t - r.kickT > 6 ? done({ o: head + 'ball loose' }) : null;
  }
  function lbTests() {
    const aim = (id, d, opps, why) => lbTest(id, `hold LOB, ring to ~${d} m, let go`, `does it land on the ring (within 1 m)? ${why}`, { kind: 'aim', from: [30, 34], aimD: d, ax: [1, 0], opps });
    return [
      aim('LB1', 12, [], 'clear lane: a flatter, driven ball'),
      aim('LB2', 25, [[3, 36, 34.4]], 'a defender in the path, close to you: it climbs over him'),
      aim('LB3', 40, [], 'a long one'),
      lbTest('LB4', 'a quick TAP of LOB to a team-mate', 'under 0.18 s: the instant lob, as before (no ring to aim)', { kind: 'tap', tap: true, from: [30, 34], mates: [[9, 52, 34]] }),
      lbTest('LB5', 'the ring settles on a team-mate, he goes for goal', 'aim near your striker: the ring settles on the spot he\'ll reach, he walks there, then times his run and heads / volleys at goal',
        { kind: 'magnet', from: [62, 40], mates: [[9, 89, 29]], drag: [0, -1, 0.25], holdT: 0.6, gk: true }),
      lbTest('LB6', 'AERIAL BATTLE: you win it (the Lab mashes fast)', 'your lob drops between your striker and his marker: MASH! - mash SHOOT, win it, head it at goal',
        { kind: 'battle', battle: true, mash: 1, from: [62, 40], mates: [[9, 89, 30]], opps: [[3, 90.2, 30.4]], mark: [0, 0], drag: [0, -1, 0.15], holdT: 1.1, gk: true }),
      lbTest('LB7', 'AERIAL BATTLE: you lose it (no mash)', 'the same drop; you don\'t press: their man wins and clears it - which way?',
        { kind: 'battle', battle: true, mash: 0, from: [62, 40], mates: [[9, 89, 30]], opps: [[3, 90.2, 30.4]], mark: [0, 0], drag: [0, -1, 0.15], holdT: 0.5, gk: true }),
      lbTest('LB8', 'AERIAL BATTLE the other way: their lob, your defender', 'the computer lobs to its striker, your defender is on him: PRESS! (the Lab mashes every other step)',
        { kind: 'battle', battle: true, cpu: true, mash: 2, from: [45, 30], mates: [[9, 17, 35]], opps: [[3, 20.2, 34.6]], gk: true, lvl: 'normal' }),
    ];
  }
  // ======================================================================= t-011 CURVING SPECIAL PASS (Luca 24 Oct 05:57: "add a special lvl 1
  // pass that curves impressively and dynamically, make it look cool [...] only test lab"). The Lab plays YOU through the
  // touch buttons (the game's own input): SPECIAL held, then PASS / THROUGH / LOB, with one bar in the bank. Each line
  // says the curve's biggest sideways bend off the straight line (m), how close it went to the man in the way, who got it.
  // CP1 a curler round a marker to feet, CP2 an outside-curl through ball into a run, CP3 a banana lob over a defender
  // into the path, CP4 a defender off the line reads the curve (the game's own predicted path) and cuts it out, CP5 the
  // same chord with no bar: the normal pass, unchanged.
  const cpRun = (vx, vy) => (q, dt) => { const b = m.ball;                       // a team-mate: makes his run until it's played, then meets it
    if (!b.owner && b.target === q && b.lob && b.z > 2.2 && (vx || vy)) q.steer(vx, vy, dt);   // (a lob: he keeps his run going while it's up there)
    else if (!b.owner && b.target === q) { if (m.lobRun(q, dt)) return; const pt = m.intercept(q, q.top(true, false), 0.12, b.lob ? 1.9 : 1.0); q.moveTo(pt.x, pt.y, q.top(true, false), dt); }
    else if (b.owner && b.owner.team === q.team && b.owner !== q) q.steer(vx, vy, dt); else q.steer(0, 0, dt); };
  const cpRead = (d, dt) => { const b = m.ball;                                  // a defender who reads it: goes where the game's predicted path says he can meet it
    if (!b.owner && b.last !== d.team && m.pending == null) { const pt = m.intercept(d, d.top(true, false), 0.2, 1.0); d.moveTo(pt.x, pt.y, d.top(true, false), dt); } else d.steer(0, 0, dt); };
  function cpTest(id, name, sub, o) {
    return { id, group: 'CP', name, sub, kind: 'cp', you: true,
      setup(r) {
        Object.assign(Input.touch, { x: 0, y: 0, btn: {} });
        const H = m.home.players, A = m.away.players, K = H[6], list = [K];
        const mates = o.mates.map(([i, x, y, vx, vy]) => { const q = H[i]; list.push(q); return [q, x, y, vx || 0, vy || 0]; });
        const opps = o.opps.map(([i, x, y, read]) => { const q = A[i]; list.push(q); return [q, x, y, read]; });
        cast(list);
        put(K, o.from[0], o.from[1], 0); atFeet(K);
        for (const [q, x, y, vx, vy] of mates) { put(q, x, y, 0); r.bots.set(q, cpRun(vx, vy)); }
        for (const [q, x, y, read] of opps) { put(q, x, y, 4); if (read) r.bots.set(q, cpRead); }
        Object.assign(m, { lobAim: null, lobAimLast: null, curveLast: null, cvFx: null, camTarget: null, lobCharge: -1, spHeld: 0 });
        m.meters[0].e = o.sp ?? 1;
        Object.assign(r, { human: K, kicker: K, o, rcv: mates[0][0], opps: opps.map(x => x[0]), sp0: m.meters[0].e, bend: 0, minD: 1e9 });
      },
      check: cpCheck };
  }
  function cpCheck(r) {
    const b = m.ball, o = r.o, K = r.kicker, T = Input.touch, f1 = v => v.toFixed(1), who = p => `${p.team === m.home ? 'your' : 'their'} #${p.num}`;
    const done = res => { Object.assign(T, { x: 0, y: 0, btn: {} }); return res; };
    if (r.t >= 0.4 && r.t < 0.7) { T.btn.special = true; if (r.t >= 0.5) T.btn[o.btn] = true; } else if (r.t >= 0.7) T.btn = {};
    if (r.kickT == null) { if (!b.owner && !m.pending && b.lastP === K && r.t > 0.5) { r.kickT = r.t; r.start = { x: b.x, y: b.y }; r.C = m.curveLast; r.anim = K.kickAnim; r.tgt = b.target;
        r.aimAt = r.C ? { x: r.C.tx, y: r.C.ty } : null; r.sp1 = m.meters[0].e; }
      else return r.t > 4 ? done({ o: `NO KICK (anim ${K.kickAnim || '-'}, ${r.events.join(' / ') || 'no banner'})` }) : null; }
    // the ball's sideways distance from the straight line start -> target, and how close it came to the man in the way
    const ft = r.t - r.kickT, A = r.aimAt || { x: r.start.x + (b.x - r.start.x) * 2, y: r.start.y + (b.y - r.start.y) * 2 };
    if (!r.touch) { const dx = A.x - r.start.x, dy = A.y - r.start.y, d = len(dx, dy) || 1, lat = ((b.x - r.start.x) * dy - (b.y - r.start.y) * dx) / d;
      if (Math.abs(lat) > Math.abs(r.bend)) r.bend = lat; r.maxZ = Math.max(r.maxZ, b.z);
      if (r.opps[0]) r.minD = Math.min(r.minD, len(b.x - r.opps[0].x, b.y - r.opps[0].y)); }
    const tp = b.owner && b.owner !== K ? b.owner : b.lastP && b.lastP !== K ? b.lastP : null;   // (gain() names the owner; a deflection the last man)
    if (!r.touch && tp) r.touch = { p: tp, own: b.owner === tp, t: ft, z: b.z };
    const C = r.C, head = C ? `${C.mode === 'ground' ? 'CURLER' : C.mode === 'through' ? 'OUTSIDE CURL' : 'BANANA LOB'} (${r.anim}) · set off ${Math.round(C.th * 180 / Math.PI)}° ${C.s > 0 ? 'right' : 'left'} of the line, bent back ${f1(Math.abs(r.bend))} m at most`
        + `${C.block ? ` · passed ${f1(r.minD)} m from ${who(r.opps[0])}${C.clear ? '' : ' (no angle cleared him)'}` : ''}${C.mode === 'lob' ? ` · peak ${f1(r.maxZ)} m` : ''} · SP ${r.sp0} -> ${r.sp1} · `
      : `STRAIGHT ${r.anim === 'pass' ? 'pass' : r.anim} (no curve) · bend ${f1(Math.abs(r.bend))} m · SP ${r.sp0} -> ${r.sp1} · `;
    if (r.touch) { const p = r.touch.p;
      const how = r.touch.own ? (p === r.rcv ? `${who(p)} RECEIVED it${r.touch.z > 0.9 ? ' (chest / head)' : ' at his feet'} after ${f1(r.touch.t)} s` : `${who(p)} CUT IT OUT after ${f1(r.touch.t)} s`) : `${who(p)} ${p === r.rcv ? 'MET it' : 'got a touch on it'} (${b.how ? b.how.kind : 'touch'}, ${f1(r.touch.z)} m up) after ${f1(r.touch.t)} s`;
      return done({ o: head + how, hold: 0.8 }); }
    return ft > 5 ? done({ o: head + 'nobody got it' }) : null;
  }
  function cpTests() {
    return [
      cpTest('CP1', 'CURLER: round a marker to feet', 'SPECIAL + PASS: their man stands on the straight line - the pass sets off wide and bends back in to your striker at his feet',
        { btn: 'pass', from: [40, 34], mates: [[9, 58, 34]], opps: [[3, 49, 33.6]] }),
      cpTest('CP2', 'OUTSIDE CURL: a through ball into the run', 'SPECIAL + THROUGH: your striker runs in behind, their man is in the lane - outside of the boot, it curls the other way into his path',
        { btn: 'through', from: [50, 26], mates: [[9, 66, 38, 6, 0]], opps: [[3, 61, 30.6]] }),
      cpTest('CP3', 'BANANA LOB: over a defender into the path', 'SPECIAL + LOB: a defender on the line, your man jogs on - the scoop lob goes up over him and bends down into his path',
        { btn: 'lob', from: [45, 34], mates: [[9, 70, 29, 3, 0]], opps: [[3, 55, 32]] }),
      cpTest('CP4', 'it can be READ: a defender cuts it out', 'CP1 again plus a second defender off to the side: he reads the curve (the game\'s own predicted path) and steps into it',
        { btn: 'pass', from: [40, 34], mates: [[9, 58, 34]], opps: [[3, 49, 33.6], [4, 51, 37.6, true]] }),
      cpTest('CP5', 'NO SP in the bank: the normal pass', 'the same SPECIAL + PASS with an empty meter: the ordinary pass, straight, no banner, nothing spent',
        { btn: 'pass', sp: 0, from: [40, 34], mates: [[9, 58, 34]], opps: [[3, 49, 33.6]] }),
    ];
  }
  // ======================================================================= t-012 WING PLAY (Luca 24 Oct: "make the attacking ai look for
  // more wing plays where they play lobs and try to get arial shot"). The REAL team AI on both sides here, not the Lab's
  // bots: WG1 the computer's winger goes down the flank and crosses, its runners attack it (WG1-SP: with 2 bars banked,
  // the aerial special); WG2 YOU are the winger (scripted: you carry it to the byline and tap LOB at the near post) and
  // your computer team-mates make the runs. Each line: the cross, the runs it found, who met it and how, what came of it.
  function wgTest(id, name, sub, o) {
    return { id, group: 'WG', name, sub, kind: 'wing', realAi: true, demo: !o.you,
      setup(r) {
        const H = m.home.players, A = m.away.players, w = H[8];
        cast([w, H[9], H[10], H[5], H[6], H[7], H[4], A[0], A[1], A[2], A[3], A[4], A[6], A[7]]);
        put(w, 68, 59, 0); atFeet(w); put(H[9], 80, 37, 0); put(H[10], 78, 29, 0); put(H[5], 70, 17, 0); put(H[6], 64, 33, 0); put(H[7], 63, 43, 0); put(H[4], 58, 62, 0);
        put(A[0], LINE_X, 36, 4); put(A[4], 88, 49, 4); put(A[3], 88, 41, 4); put(A[2], 88, 30, 4); put(A[1], 85, 17, 4); put(A[7], 78, 45, 4); put(A[6], 77, 32, 4);
        Object.assign(A[0], { guard: 1, gkS: null, gkMode: '', rushT: 0, claiming: false });
        for (const t of [m.home, m.away]) Object.assign(t, { wing: null, wingBy: null, wingT: 0, presser: null, cover: null, marks: new Map(), support: null, supportPt: null, supT: 0,
          runner: null, runT: 0, roleT: 0, presserHeld: 0, fx: null, fy: null, poss: t === m.home ? 1 : 0, inPoss: t === m.home, airSpAt: null });
        if (o.sp) m.meters[0].e = o.sp; m.ball.crossBy = null;
        LAB.demo0 = LAB.demo0 ?? m.demo; m.demo = !o.you;
        Object.assign(r, { human: w, shooter: w, gk: A[0], marks: [], o, touches: [] });
        if (o.you) r.bots.set(w, (p, dt) => {                                    // you: down the line, then a tap of LOB at the near post
          const b = m.ball; if (b.owner !== p || p.busy() || r.crossT != null) { p.steer(0, 0, dt); return; }
          if (p.x > 95 || r.t > 4.5) { r.crossT = r.t; m.doPass(p, { x: (99 - p.x) / len(99 - p.x, 37 - p.y), y: (37 - p.y) / len(99 - p.x, 37 - p.y) }, 'lob'); return; }
          const dx = 97 - p.x, dy = 56 - p.y, d = len(dx, dy) || 1; p.sprinting = true; p.wantDir = { x: dx / d, y: dy / d }; m.carrySteer(p, dx / d, dy / d, p.top(true, true) * 0.95, dt); });
      },
      check: wgCheck };
  }
  function wgCheck(r) {
    const b = m.ball, H = m.home, who = p => `${p.team === H ? '' : 'their '}#${p.num}`;
    if (r.crossAt == null) {                                                       // waiting for the cross (any home man from out wide, into the box)
      const by = b.lastP;
      if (!b.owner && !m.pending && by && by.team === H && (r.o.you ? r.crossT != null && by === r.shooter : b.crossBy === by)) {
        r.crossAt = r.t; r.by = by; r.kind = r.o.you ? 'your LOB' : b.lob ? 'floated' : 'whipped';
        r.from = len(H.goalX - b.x, 34 - b.y); const W = H.wing; r.runs = W ? [...W.entries()].map(([q, w]) => `${w.run} ${who(q)}`).join(', ') : 'none';
        r.inBox = H.players.filter(q => !q.sentOff && !q.keeper && q !== by && Math.abs(q.x - H.goalX) < 16.5 && Math.abs(q.y - 34) < 20.2).length;
      } else {
        if (b.owner && b.owner.team !== H) return { o: `NO CROSS · they won it off ${who(b.lastP || r.shooter)}` };
        if (r.out) return { o: `NO CROSS · out (${r.out.toLowerCase()})` };
        if (b.inNet) return { o: 'NO CROSS · a goal some other way', hold: 1.2 };
        return r.t > 9 ? { o: `NO CROSS in 9 s · the ball is with ${b.owner ? who(b.owner) : 'nobody'}` } : null;
      }
    }
    if (!r.met && b.lastP && b.lastP !== r.by) {                                   // the first touch after it
      const p = b.lastP, how = r.ev('AERIAL SPECIAL') ? 'AERIAL SPECIAL' : b.how && b.how.kind === 'header' ? 'HEADER' : b.how && b.how.kind === 'dheader' ? 'DIVING HEADER'
        : b.how && b.how.kind === 'volley' ? 'VOLLEY' : b.how && b.how.kind === 'bicycle' ? 'OVERHEAD' : p.keeper ? 'keeper' : b.owner === p ? 'controlled' : 'touch';
      r.met = `${who(p)} ${how}${p.team === H && how !== 'controlled' && how !== 'touch' ? ` at ${b.z.toFixed(1)} m` : ''}`;
    }
    if (!r.met && m.pending && m.pending.p.team === H && m.pending.p !== r.by && m.pending.info.special) r.met = `${who(m.pending.p)} AERIAL SPECIAL`;
    const head = `${r.kind.toUpperCase()} CROSS from ${r.from.toFixed(0)} m by ${who(r.by)} at ${r.crossAt.toFixed(1)} s · runs: ${r.runs} (${r.inBox} in the box) · `;
    const met = r.met ? `met by ${r.met} → ` : '';
    if (b.inNet) return { o: head + met + 'GOAL', hold: 1.4 };
    if (b.owner === r.gk) return { o: head + met + 'keeper has it' };
    if (r.ev('PARRIED') || r.ev('SAVED')) return { o: head + met + 'SAVED', hold: 1 };
    if (r.out) return { o: head + met + 'OUT · ' + r.out.toLowerCase() };
    if (b.owner && b.owner.team !== H) return { o: head + met + `their ${b.owner.keeper ? 'keeper' : 'defender'} has it` };
    if (r.t - r.crossAt > 5) return { o: head + met + (b.owner ? `${who(b.owner)} has it` : 'ball loose') };
    return null;
  }
  function wgTests() {
    return [
      wgTest('WG1', 'the computer\'s winger crosses, a runner attacks it', 'their wide man down the flank: near post / far post / spot / edge runs; does the man who meets it go for goal?', {}),
      wgTest('WG1-SP', 'the same, with 2 bars of SP banked', 'the man who meets it near goal may spend them on an AERIAL SPECIAL (AIR BLAZE / SKY THUNDER / PHOENIX)', { sp: 2 }),
      wgTest('WG2', 'YOUR winger crosses, your team-mates make the runs', 'you (scripted) go down the line and tap LOB at the near post: who is in the box, who attacks it?', { you: true }),
    ];
  }
  // the SAVE! prompt: the computer shoots a special at YOUR keeper - press SPECIAL while SAVE! is up
  function pwSaveYou(id) {
    return { id, group: 'PW', name: 'YOUR KEEPER: special save', sub: 'press SPECIAL when SAVE! flashes', kind: 'pw', you: true,
      setup(r) {
        const s = m.away.players[9], gk = m.home.players[0], me = m.home.players[5]; cast([s, gk, me]);
        put(s, 18.5, 34, 4); ballAt(18, 34, 0, s); put(gk, PITCH_L - LINE_X, 34, 0); put(me, 40, 20, 4);
        for (const mt of m.meters || []) mt.e = 0;
        m.meters[0].e = 2;                                                       // your 2 bars: THUNDER GLOVE
        Object.assign(r, { human: me, shooter: s, gk, blockers: [], marks: [], o: { lv: 2, you: true } });
        r.action = { at: 1.0, fire: () => { m.meters[1].e = 2; m.special(s); } };
      },
      check(r) {
        const b = m.ball;
        if (r.shotT == null) { if (!b.owner && r.fired && b.lastP === r.shooter && !m.pending) { r.shotT = r.t; r.lv = b.special; r.p0 = b.spP; } else return null; }
        const used = r.events.some(e => /THUNDER GLOVE|IRON WALL|RISING SHIELD/.test(e)), head = used ? 'YOU USED THE SAVE · ' : 'NO SAVE PRESSED · ';
        if (b.inNet) return { o: head + 'GOAL', hold: 1.4 };
        if (r.ev('SAVED!')) return { o: head + 'SAVED IT!', hold: 1.2 };
        if (b.owner === r.gk) return { o: head + 'caught' };
        if (r.ev('PARRIED')) return { o: head + 'parried', hold: 1.2 };
        if (r.out) return { o: head + 'out' };
        if (r.t - r.shotT > 4) return { o: head + 'ball loose' };
        return null;
      } };
  }
  // AERIAL SPECIAL: a team-mate lobs it in, the SPECIAL popup shows as it drops - you press it (or the Lab does)
  function airSpTest(id, lv, auto) {
    return { id, group: 'PW', name: `aerial special · LV${lv}${auto ? ' (the Lab presses it)' : ''}`, sub: auto ? 'watch: the popup, then the strike' : 'press SPECIAL when the SPECIAL popup shows', kind: 'air', you: true,
      setup(r) {
        const you = m.home.players[9], c = m.home.players[7], gk = m.away.players[0]; cast([you, c, gk]);
        put(you, 92, 31, 0); put(c, 99, 6); faceTo(c, 93, 31); atFeet(c); put(gk, LINE_X, 33, 4);
        for (const mt of m.meters || []) mt.e = 0;
        Object.assign(r, { human: you, shooter: c, gk, marks: [{ x: 93, y: 31, r: 0.5 }], auto });
        r.action = { at: 0.8, fire: () => { m.meters[0].e = lv; const b = m.ball, s = aimAir(b.x, b.y, 93, 31, 1.5, 1.35); m.kick(c, 93, 31, s.speed, s.vz, 0.13, {}); } };
      },
      check(r) {
        const b = m.ball, you = r.human;
        if (m.airSp) r.popup = true;
        if (r.auto && m.airSp && !r.pressed) { r.pressed = true; m.airSpecial(you); }
        if (r.shotT == null) { if (!b.owner && r.fired && b.lastP === r.shooter) r.shotT = r.t; else return null; }
        if (m.pending && m.pending.p === you) return null;                       // his strike is on its way
        const head = `${r.popup ? 'POPUP SHOWN' : 'NO POPUP'} · ${b.special || r.spLv ? `LV${b.special || r.spLv} SPECIAL · ` : ''}`; if (b.special) r.spLv = b.special;
        if (b.inNet) return { o: head + 'GOAL', hold: 1.4 };
        if (b.owner === r.gk) return { o: head + 'SAVED' };
        if (b.owner === you) return { o: head + 'you controlled it' };
        if (r.ev('PARRIED') || r.ev('SAVED!')) return { o: head + 'SAVED', hold: 1.2 };
        if (r.out) return { o: head + 'OUT' };
        if (r.t - r.shotT > 5) return { o: head + 'nothing happened' };
        return null;
      } };
  }

  // ======================================================================= t-014 AERIAL SPECIALS BY THE ARC (AS) and KEEPER SPECIAL SAVES BY
  // THE SHOT (KS). AS: a team-mate puts the ball in with a set arc, the Lab presses SPECIAL as it reaches you (the popup
  // is up); the line: the move the arc picked, the frame on screen as the ball leaves his boot (the contact frame),
  // what came of it. KS: a shot at their keeper, who has a special save ready; the line: the move the shot picked,
  // whether it started early (its contact frame on the ball), held / parried / a hand to it.
  function asTest(id, name, sub, o) {
    return { id, group: 'AS', name, sub, kind: 'air', you: true,
      setup(r) {
        const you = m.home.players[9], c = m.home.players[7], gk = m.away.players[0]; cast([you, c, gk]);
        put(you, 92, 31, 0); put(c, o.from[0], o.from[1]); faceTo(c, 93, 31); atFeet(c); put(gk, LINE_X, 33, 4);
        for (const mt of m.meters || []) mt.e = 0; m.airLast = null;
        Object.assign(r, { human: you, shooter: c, gk, marks: [{ x: 93, y: 31, r: 0.5 }] });
        r.action = { at: 0.8, fire: () => { m.meters[0].e = o.lv; const b = m.ball, s = aimAir(b.x, b.y, 93, 31, o.z, o.T); m.kick(c, 93, 31, s.speed, s.vz, 0.13, {}); } };
      },
      check(r) {
        const b = m.ball, you = r.human;
        if (m.airSp) r.popup = true;
        // the Lab presses as the ball reaches him: inside 1.3 m of him or under the height it was put in at
        if (m.airSp && !r.pressed && (len(b.x - you.x, b.y - you.y) < 1.3 || (b.vz < 0 && b.z < o.z + 0.15))) { r.pressed = true; m.airSpecial(you); }
        if (r.shotT == null) { if (!b.owner && r.fired && b.lastP === r.shooter) r.shotT = r.t; else return null; }
        if (m.pending && m.pending.p === you) return null;                       // his strike is on its way
        if (r.pressed && r.hitFr == null && b.lastP === you) r.hitFr = you.rig ? m.rigAt(you, you.rig.n, you.rig.t, you.rig.d, you.rig).fr : you.spr.frame ? you.spr.frame.name : '?';   // the frame up as the ball leaves his boot
        const A = m.airLast, head = !r.pressed ? 'NO SPECIAL · ' : `${A ? A.name + ' (' + A.n + ')' : '?'} · contact frame ${r.hitFr || '?'}${A && A.f >= 0 && r.hitFr && r.hitFr.endsWith('-' + A.f) ? ' ✓' : ''} · `;
        if (b.inNet) return { o: head + 'GOAL', hold: 1.2 };
        if (b.owner === r.gk) return { o: head + 'SAVED' };
        if (r.ev('PARRIED') || r.ev('SAVED!') || r.ev('TIPPED')) return { o: head + 'SAVED', hold: 1 };
        if (r.out) return { o: head + 'OUT' };
        if (r.t - r.shotT > 5) return { o: head + (r.popup ? 'nothing happened' : 'no popup') };
        return null;
      } };
  }
  function ksOut(r) {
    const b = m.ball, gk = r.gk, g = gk.rig;
    if (g && RIGS[g.n] && RIGS[g.n].gk && g.e0 == null) r.pre = g.n;           // started before the ball got there
    const S = m.gkSpLast; if (!S) return b.inNet ? { o: 'NO SPECIAL SAVE · GOAL', hold: 1 } : (r.t - (r.shotT || 0) > 5 ? { o: 'NO SPECIAL SAVE' } : null);
    if (r.hitT == null) r.hitT = r.t;
    const R = RIGS[S.n], how = S.res === 'hand' ? 'a hand to it' : 'saved';
    const head = `${S.n} (${R.name}, contact frame ${R.keys.find(q => q.hit).f}) · ${r.pre === S.n ? 'started early, contact frame on the ball' : r.pre ? `started early as ${r.pre}, switched at the contact` : 'shown from the contact'} · `;
    if (b.owner === gk) return { o: head + 'HELD', hold: 1 };
    if (r.out) return { o: head + `${how === 'saved' ? 'parried' : how} · OUT · ${r.out.toLowerCase()}`, hold: 0.6 };
    if (b.inNet) return { o: head + 'GOAL', hold: 1 };
    if (r.t - r.hitT > 3) return { o: head + (how === 'saved' ? 'parried' : how) + ' · in play' };
    return null;
  }
  function ksShot(id, name, sub, spot, tgt, speed, power, lv) {
    return { id, group: 'KS', name, sub, kind: 'shot',
      setup(r) { shotSetup(r, spot, false); Object.assign(r.gk, { guard: 1, gkS: null, gkMode: '', claiming: false, saveKind: '', leap: 0, gkN: null, rushT: 0, spSave: 0, rig: null }); m.gkSpLast = null;
        const ty = tgt.y == null ? r.gk.y : tgt.y; r.marks = [{ x: GX, y: ty, r: 0.3 }];
        r.action = { at: 0.7, fire: () => fireShot(r, tgt, speed, power) }; },
      check(r) { const b = m.ball;
        if (r.shotT == null) { if (!b.owner && b.lastP === r.shooter && r.fired) { r.shotT = r.t; b.saveable = m.home; r.gk.spSave = lv; m.saveFx(r.gk); } else return null; }   // (off his boot: his LV special save on a normal shot, v0.9.0: a sure stop)
        return ksOut(r); } };
  }
  function ksTests() {
    const ks4 = Object.assign(pwTest('KS4', 'too strong to hold → ktip → corner', 'a LV2 special at his LV1 save: a hand to it (made to happen here), fingertips over or round', { lv: 2, from: [86, 33], block: [], save: 1 }), { group: 'KS', force: 'hand' });
    const pc = ks4.check, ks4set = ks4.setup; ks4.setup = r => { ks4set(r); m.gkSpLast = null; r.gk.rig = null; };
    ks4.check = r => { pc(r); if (r.shotT == null) return null; return ksOut(r); };
    return [
      ksShot('KS1', 'a lob dropping under the bar → kleap', 'leap & snatch: he goes up and takes it', SPOTS[1], { y: null, z: 1.7 }, 15, 0.3, 1),
      ksShot('KS2', 'a straight shot at him → kblock', 'iron block: knee up, palms out, pushed back, holds', SPOTS[1], { y: null, z: 1.0 }, 24, 0.6, 1),
      ksShot('KS3', 'a shot far to the side → kdivecatch', 'flying dive catch across his goal', SPOTS[1], { y: GOAL_Y1 - 0.7, z: 1.0 }, 22, 0.6, 2),
      ks4,
    ];
  }

  // ---- CUT SCENES: the real thing, on demand (the Lab normally skips them) - window.__labCut lets the game play them in full
  function csTest(id, name, sub, setup, done) {
    return { id, group: 'CS', name, sub, kind: 'cut',
      setup(r) { window.__labCut = true; cast(m.all.filter(p => !p.benched)); m.all.forEach(p => { put(p, p.home.x, p.home.y, p.team.side > 0 ? 0 : 4); });
        ballAt(52.5, 34); Object.assign(r, { human: m.home.players[9], fired: true, marks: [] }); setup(r); },
      check(r) { const d = done(r); return d ? { o: d, hold: 0.1 } : (r.t > 60 ? { o: 'still going after 60 s' } : null); } };
  }
  function buildCuts() {
    const H = () => m.home, A = () => m.away;
    return [
      csTest('CS1', 'WALK-OUT from the tunnel', 'crowd, line-up, then the coin toss', () => { m.startIntro(); }, r => (!m.intro && !m.toss && r.t > 1 ? 'WALK-OUT + COIN TOSS DONE' : null)),
      csTest('CS2', 'COIN TOSS', 'call it with left / right, ENTER flips (K skips)', () => { m.startToss(); }, r => (!m.toss && r.t > 0.5 ? `COIN TOSS DONE · ${(m.firstKick || H()).name} KICK OFF` : null)),
      csTest('CS3', 'EXTRA-TIME COIN TOSS (quick)', 'no call: the referee just flips it', () => { m.startToss({ quick: true, after: t => { m.say('EXTRA TIME', `${t.name} TO START`, 1.8); } }); }, r => (!m.toss && r.t > 0.5 ? 'QUICK TOSS DONE' : null)),
      csTest('CS4', 'HALF TIME', 'walk off, the stats card, ENTER for the second half', () => { H().score = 1; A().score = 1; m.halfTime(); }, r => (!m.ht && r.t > 1 ? 'SECOND HALF UNDER WAY' : null)),
      csTest('CS5', 'GOAL: celebration + replay', 'a striker scores; the real celebration and the TV replay', r => {
        const s = H().players[9], gk = A().players[0]; put(s, 93.5, 34, 0); atFeet(s); put(gk, LINE_X, 30.5, 4); gk.stun = 1.5;
        r.action = { at: 0.6, fire: () => m.kick(s, GX + 2, 36.2, 24, 0.35, 0.12, { shot: true, power: 0.6 }) }; r.fired = false;
        m.rec = []; m.recN = 0; m.lastReplayEnd = -1e9; m.lastReplay = null; },
      r => (r.scored = r.scored || m.ball.inNet, r.scored && m.lastReplay && !m.replay && !m.goalQ ? 'GOAL + CELEBRATION + REPLAY DONE' : null)),
      csTest('CS6', 'FOUL + YELLOW CARD', 'the ref runs in, the card, the replay of the foul', r => {
        const by = A().players[4], v = H().players[9]; put(v, 60, 34, 0); put(by, 58.8, 34.2, 0); by.fouls = 2; m.rec = []; m.recN = 0;
        r.action = { at: 1.6, fire: () => m.foul(by, v, true) }; r.fired = false; },
      r => (r.fouled = r.fouled || !!m.foulScene, r.fouled && !m.foulScene && !m.replay ? `FOUL SCENE DONE${r.out ? ' · ' + r.out.toLowerCase() : ''}` : null)),
      csTest('CS7', 'SECOND YELLOW = RED CARD', 'he is sent off and walks', r => {
        const by = A().players[4], v = H().players[9]; put(v, 60, 34, 0); put(by, 58.8, 34.2, 0); by.yellows = 1; by.fouls = 2; m.rec = []; m.recN = 0;
        r.action = { at: 1.6, fire: () => m.foul(by, v, true) }; r.fired = false; r.by = by; },
      r => (r.fouled = r.fouled || !!m.foulScene, r.fouled && !m.foulScene && !m.replay ? `RED CARD SCENE DONE · #${r.by.num} ${r.by.sentOff ? 'SENT OFF' : 'STILL ON?'}` : null)),
      csTest('CS8', 'INJURY after a foul', 'the fouled player stays down, then limps', r => {
        const by = A().players[4], v = H().players[9]; put(v, 60, 34, 0); put(by, 58.8, 34.2, 0); m.rec = []; m.recN = 0; r.v = v;
        r.action = { at: 1.6, fire: () => { const R = Math.random; Math.random = () => 0.01; try { m.foul(by, v, false); } finally { Math.random = R; }
          if (m.foulScene && !m.foulScene.injured) { v.injury = { k: 0.75 }; Object.assign(m.foulScene, { injured: true, end: 3.4 }); } } }; r.fired = false; },
      r => (r.fouled = r.fouled || !!m.foulScene, r.fouled && !m.foulScene && !m.replay ? `INJURY SCENE DONE · #${r.v.num} ${r.v.injury ? `limping (top speed ×${r.v.injury.k.toFixed(2)})` : 'fine'}` : null)),
      csTest('CS9', 'FULL TIME', 'the whistle, everyone applauds', () => { H().score = 2; A().score = 1; m.matchPens = true; m.fullTime(); finish({ o: 'FULL TIME · THEY APPLAUD · R TO SEE IT AGAIN', hold: 999 }); }, () => null),
      csTest('CS10', 'GOLDEN GOAL', 'extra time ends on the next goal', () => { H().score = 2; A().score = 1; m.half = 3; m.matchPens = true; m.fullTime('GOLDEN GOAL!'); finish({ o: 'GOLDEN GOAL · R TO SEE IT AGAIN', hold: 999 }); }, () => null),
      csTest('CS11', 'RISE UP (3 full bars)', 'the banner when a side fills its meter', () => { m.riseUp(H()); }, r => (r.t > 3.2 ? 'RISE UP DONE' : null)),
      csTest('CS12', 'TROPHY CEREMONY', 'the captain lifts the HAGUE CUP, fireworks', () => { H().score = 2; A().score = 1; m.cupCeremony(H().name); finish({ o: 'TROPHY CEREMONY · ENTER ENDS IT · R AGAIN', hold: 999 }); }, () => null),
      ...[1, 2, 3].map(lv => csTest('CS' + (12 + lv), `SPECIAL SAVE · LV${lv} ${SAVE_NAMES[lv - 1]}`, 'the keeper\'s cut scene on its own (ENTER skips it)',
        () => { m.cutInQ = { kind: 'save', who: A().players[0], lv }; }, r => (!m.cutIn && !m.cutInQ && r.t > 0.3 ? `LV${lv} CUT SCENE DONE` : null))),
    ];
  }
  function csClean() {                                                           // leave a cut scene the way the Lab needs the match
    const was = window.__labCut; window.__labCut = false;
    if (m.replay) { m.replay.after = null; m.replay.exit = null; m.endReplay(); }
    if (m.toss) { m.toss = null; try { m.tossUi(false); } catch (e) {} }
    if (m.ceremony) { m.ceremony = null; if (m.cerDim) { m.cerDim.destroy(); m.cerDim = null; } m.cursor.setAlpha(1); }
    if (!was && !m.intro && !m.ht && !m.foulScene && !m.over) return;
    m.intro = null; m.ht = null; m.foulScene = null; m.goalQ = null; m.evReplay = null; m.over = false; m.matchPens = false; m.camTarget = null; m.camFast = false;
    m.half = 1; m.closeFlowEl(); m.time.removeAllEvents(); if (m.rise) { m.rise.c.destroy(); m.rise = null; }
    for (const p of m.all) { p.hide = false; p.lineSpot = null; p.walkAt = null; if (p.state === 'applaud' || p.state === 'party' || p.state === 'trophy' || p.state === 'dejected') { p.state = 'idle'; p.stateT = 0; } p.injury = null; }
    if (m.ref) { m.ref.hidden = false; m.ref.goTo = null; m.ref.state = 'idle'; }
    if (m.rami) { m.rami.line = null; m.rami.c.setVisible(false); }
    m.msg.setVisible(true); m.sub.setVisible(true); m.ballSpr.setVisible(true); m.ballSh.setVisible(true);
    m.cameras.main.setZoom(LAB.zoom); m.fixUi(LAB.zoom);
  }

  // ---- BUG WATCH clips (the game's watchdog + Claude's overnight runs): watch each one here, rate it, ask Claude
  function clipTest(d, j) {
    return { id: `BW${j + 1}`, group: 'BW', name: `${d.min}' ${d.title}`, sub: `${d.home} v ${d.away} · ${d.msg}`, kind: 'clip', doc: d,
      setup(r) { cast([]); Object.assign(r, { fired: true, marks: [], human: m.home.players[9], snaps: [] }); playClip(r, d); },
      check() { return null; } };
  }
  function playClip(r, d) {
    let u; try { u = bwUnpack(d.clip); } catch (e) { u = null; }
    if (!u || u.frames.length < 30) { finish({ o: 'NO FOOTAGE KEPT FOR THIS ONE' }); return; }
    m.bwLoadKits(d.kits, () => {
      if (LAB.run !== r) return;
      const mk = clamp(u.mark, 0, u.frames.length - 1); u.frames[mk].goal = true; r.mark = mk;
      m.startReplay('BUG CLIP', () => { if (m.radar) m.radar.setVisible(false); if (LAB.run === r && !r.result) finish({ o: 'CLIP OVER · R TO WATCH AGAIN · 1 OR 2 TO RATE' }); }, u.frames,
        { caption: `${d.min}' ${d.title}`, kits: d.kits, focus: d.who, noZoom: true, mark: mk, slowPre: 1.2, slow: 1.8, exit: () => {} });
    });
  }
  // grab three frames of the clip (before / at / after the moment) for ASK CLAUDE
  function clipSnapTick() {
    const r = LAB.run, rp = m.replay; if (!r || !rp || rp.label !== 'BUG CLIP' || r.sc.kind !== 'clip') return;
    const at = [r.mark - 45, r.mark, r.mark + 30]; r.snapAt = r.snapAt || {};
    for (const t of at) if (t >= 0 && rp.i >= t && !r.snapAt[t]) { r.snapAt[t] = 1;
      m.game.renderer.snapshot(img => { const c = document.createElement('canvas'); c.width = Math.min(800, img.width); c.height = Math.round(c.width * img.height / img.width);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); c.toBlob(bl => { if (bl && LAB.run === r) r.snaps.push(bl); }, 'image/jpeg', 0.82); }); }
  }
  async function askClaude() {
    const r = LAB.run; if (!r || r.sc.kind !== 'clip') return;
    const d = r.sc.doc, out = $('bw-ans'); out.textContent = 'asking Claude…';
    try {
      const sample = window.claude && window.claude.use ? await window.claude.use('sample') : null;
      if (!sample) { out.textContent = 'Claude isn\'t reachable from this page here - open the Lab on claude.ai.'; return; }
      const lim = await sample.limits().catch(() => null), imgs = lim && lim.images ? r.snaps.slice(0, lim.images.maxCount || 3) : [];
      const prompt = `You are checking a clip from a 16-bit pixel football game (top-down 3/4 view, PixelLab sprites) that its automatic bug watch flagged.
Check that tripped: ${d.code} - "${d.title}": ${d.why}.
What it measured: ${d.msg}
Match: ${d.home} v ${d.away}, ${d.min}' (half ${d.half}), score ${d.score}, weather ${d.weather || 'clear'}, mode ${d.mode}.
Game state at that moment (JSON: ball [x,y,z,vx,vy,vz] in metres on a 105 x 68 pitch; players [index, team, number, x, y, state, speed, facing, sentOff, hands]):
${typeof d.state === 'string' ? d.state : JSON.stringify(d.state)}
Last 6 s, every 0.1 s ([clock s, ball x, y, z, vx, vy, owner index, flags: 1 live, 2 set piece, 4 freeze, 8 dead ball, 16 foul scene, 32 kick pending, 64 in net]):
${typeof d.trace === 'string' ? d.trace : JSON.stringify(d.trace)}
${imgs.length ? `The ${imgs.length} images are frames of the clip: about 0.75 s before the moment, the moment (circled), and 0.5 s after.` : 'No images this time.'}
${d.claude ? `Claude's overnight triage said: ${d.claude}` : ''}
In 4 short lines for the game's designer (who has ADHD - plain words, no jargon): 1) is this a real bug, a feel issue, or fine? 2) what probably happened, 3) what to change, 4) how sure you are.`;
      const res = await sample(prompt, { images: imgs.length ? imgs : undefined, modelTier: 'default', onText: ({ text }) => { out.textContent = text; } });
      out.textContent = res.text; r.claudeSays = res.text;
    } catch (e) { out.textContent = e && e.code === 'not_granted' ? 'Not allowed on this page (you said no to Claude). That\'s fine - rate it yourself.' : `Couldn't ask Claude (${(e && e.code) || 'error'}).`; }
  }
  async function loadClips() {
    const G = LAB.groups.find(g => g.id === 'BW'); if (!G || !LAB.db) return;
    try {
      const snap = await LAB.db.collection('bugwatch').get(), docs = [];
      for (const s of snap.docs) { const v = s.data(); if (v && v.clip && v.code) docs.push(Object.assign({ _id: s.id }, v)); }
      docs.sort((a, b) => (a.review ? 1 : 0) - (b.review ? 1 : 0) || (a.order ?? 999) - (b.order ?? 999) || String(a.at).localeCompare(String(b.at)));
      G.tests = docs.length ? docs.map(clipTest) : G.tests;
      G.blurb = docs.length ? `${docs.length} clips the bug watch kept (${docs.filter(d => !d.review).length} not rated yet). 1 = the game was right · 2 = it's a bug · ASK CLAUDE for a second opinion.` : G.blurb;
      if (LAB.active) render();
    } catch (e) {}
  }
  async function saveClipReview(verdict, reasons) {
    const r = LAB.run, d = r && r.sc.doc; if (!d || !LAB.db || !d._id) return;
    const review = { verdict: verdict === 'right' ? 'fine' : 'bug', note: $('note').value.trim(), reasons: [...(reasons || [])].map(x => REASONS[x]), claude: r.claudeSays || '', at: new Date().toISOString(), lab: true };
    try { await LAB.db.collection('bugwatch').doc(d._id).update({ review }); d.review = review; } catch (e) {}
  }

  // ======================================================================= t-010 TAP KICK (Luca 24 Oct 05:57: "give me a test lab of the
  // new simple tap kick"). TAP_KICK is on for these. TK1-TK5: you - the Lab presses SHOOT through the real controls (a
  // quick tap, or a hold for TK5) with the stick where the test says; TK6: the computer on the ball. Each line says how
  // long SHOOT was down, what came off the boot (tap / power shot, km/h, the move it played) and what happened.
  function tkTest(id, name, sub, o) {
    return { id, group: 'TK', name, sub, kind: 'tk', you: !o.cpu, tap: true, o,
      setup(r) {
        Object.assign(Input.touch, { x: 0, y: 0, btn: {} });
        const H = m.home.players, s = H[9], gk = m.away.players[0], mate = o.mate ? H[7] : null; cast([s, gk, ...(mate ? [mate] : [])]);
        put(s, o.from[0], o.from[1], o.face != null ? o.face : 0); if (!mate) atFeet(s);
        put(gk, o.gk[0], o.gk[1], 4); Object.assign(gk, { guard: 1, gkS: null, gkMode: '', claiming: false, saveKind: '', leap: 0, gkN: null, rushT: 0 });
        if (mate) { put(mate, o.mate[0], o.mate[1], dirIndex(s.x - o.mate[0], s.y - o.mate[1])); atFeet(mate);
          r.action = { at: 0.4, fire: () => m.doPass(mate, { x: s.x - mate.x, y: s.y - mate.y }, 'ground', s) }; }   // the cut-back along the grass
        else r.fired = true;
        if (o.cpu) { LAB.demo0 = LAB.demo0 ?? m.demo; m.demo = true; }          // (the computer on the ball: its own decision, as in a match)
        if (o.cpu) r.bots.set(s, (p, dt) => { if (m.ball.owner === p) m.carrierAI2(p, dt); else p.steer(0, 0, dt); });
        Object.assign(r, { human: s, shooter: s, gk, marks: o.marks || [], o });
      },
      check: tkCheck };
  }
  function tkCheck(r) {
    const b = m.ball, o = r.o, s = r.shooter, gk = r.gk, T = Input.touch, f1 = v => v.toFixed(1);
    const done = res => { Object.assign(T, { x: 0, y: 0, btn: {} }); return res; };
    // ---- you: SHOOT down once he has the ball (and is free), the stick where the test points, up after o.hold s
    if (!o.cpu && r.kickT == null) {
      if (r.downT == null && b.owner === s && !s.busy() && r.t >= (o.at || 0.4)) { r.downT = r.t; T.btn.shoot = true; if (o.stick) { T.x = o.stick[0]; T.y = o.stick[1]; } }
      else if (r.downT != null && T.btn.shoot && r.t - r.downT >= (o.hold || 0.06)) { T.btn.shoot = false; r.held = r.t - r.downT; r.charge = m.charge; }
    }
    if (m.pending && m.pending.p === s && !r.anim) { r.anim = s.kickAnim; r.info = m.pending.info; }
    if (r.kickT == null) {
      if (!b.owner && !m.pending && b.lastP === s && r.anim) { r.kickT = r.t; r.v0 = len(b.vx, b.vy); r.dir = Math.atan2(b.vy, b.vx); r.start = { x: b.x, y: b.y }; r.tapB = !!b.tap; T.x = T.y = 0; }
      else return r.t > 6 ? done({ o: 'NO KICK' }) : null;
    }
    const what = r.info && r.info.tap ? 'TAP KICK' : r.info && r.info.shot ? `POWER SHOT (charge ${(r.info.power || 0).toFixed(2)})` : 'a kick';
    let head = `${o.cpu ? 'the computer' : `SHOOT down ${(r.held || 0).toFixed(2)} s`} → ${what} · ${kmh(r.v0)} km/h · move: ${r.anim}${r.tapB ? '' : r.info && r.info.tap ? ' (NO DROP-OFF)' : ''}`;
    if (!r.slow && !b.owner && len(b.vx, b.vy) < 1.5 && b.z < 0.05) r.slow = { d: len(b.x - r.start.x, b.y - r.start.y), line: Math.abs(GX - b.x) };   // where it died
    if (o.arrow) { const want = Math.atan2(o.stick[1], o.stick[0]), err = Math.abs(((r.dir - want + 3 * Math.PI) % (2 * Math.PI)) - Math.PI) * 180 / Math.PI;
      return done({ o: `${head} · went ${Math.round(r.dir * -180 / Math.PI)}° (the arrow: ${Math.round(want * -180 / Math.PI)}°), ${err.toFixed(1)}° off (${err <= 4 ? 'ok' : 'OFF'})`, hold: 1 }); }
    const P = r.plan; head += P ? ` · his read: ${P.kind}${P.kind === 'leave it' ? '' : ` (${f1(P.dy)} m across, he can cover ${f1(P.reach)} m)`} · ` : ' · ';
    if (b.inNet) return done({ o: head + `GOAL (${(r.t - r.kickT).toFixed(2)} s)`, hold: 1.4 });
    if (b.owner === gk && r.slow) return done({ o: head + `it DIED after ${f1(r.slow.d)} m, ${f1(r.slow.line)} m out from the goal line (the keeper walked out and picked it up)`, hold: 1 });
    if (b.owner === gk && gk.hands) return done({ o: head + 'keeper HELD it', hold: 1 });
    if (r.ev('PARRIED') || r.ev('SAVED') || r.ev('A HAND TO IT') || r.ev('ROUND THE POST')) return done({ o: head + 'keeper saved it (parried)', hold: 1 });
    if (r.out) return done({ o: head + 'OUT · ' + r.out.toLowerCase() });
    if (!b.owner && len(b.vx, b.vy) < 0.2 && b.z < 0.05) return done({ o: head + `it DIED after ${f1(len(b.x - r.start.x, b.y - r.start.y))} m, ${f1(Math.abs(GX - b.x))} m out from the goal line`, hold: 1 });
    if (b.owner === gk) return done({ o: head + `it died before him: the keeper took it at his feet (${f1(len(b.x - r.start.x, b.y - r.start.y))} m from the kick)`, hold: 1 });
    return r.t - r.kickT > 4 ? done({ o: head + 'ball loose' }) : null;
  }
  function tkTests() {
    return [
      tkTest('TK1', 'tap from 6 m straight at a set keeper', 'SHOOT tapped, stick idle, facing goal: in his reach - he should hold it', { from: [98.5, 34], gk: [LINE_X, 34] }),
      tkTest('TK2', 'a cut-back, the keeper on the far post: tap into the near corner', 'a team-mate pulls it back from the byline; SHOOT tapped with the stick at the bottom corner: out of his reach - goal', { from: [97, 37.5], gk: [LINE_X, 31], mate: [103.2, 22], stick: [0.93, 0.37], at: 0.3 }),
      tkTest('TK3', 'tap from 20 m', 'SHOOT tapped from 20 m straight at goal: it should die on the grass before the keeper', { from: [85, 34], gk: [LINE_X, 34] }),
      tkTest('TK4', 'tap while pushing up-left', 'stick up-left, SHOOT tapped in midfield: the ball goes the way of the arrow, within a few degrees', { from: [52, 34], gk: [LINE_X, 34], stick: [-0.707, -0.707], arrow: true }),
      tkTest('TK5', 'hold SHOOT', 'SHOOT held 0.5 s from 17 m: the power shot, exactly as before', { from: [88, 34], gk: [LINE_X, 34], hold: 0.5 }),
      tkTest('TK6', 'the computer, an open goal from 5 m', 'the computer\'s striker on the ball 5 m out, their keeper stranded 14 m out: it taps it in', { from: [100, 31], gk: [91, 40], face: 0, cpu: true }),
    ];
  }
  function buildTests() {
    const G = [];
    const add = (id, name, blurb, tests) => G.push({ id, name, blurb, tests });
    add('FP', 'FREE PLAY', 'Play however you like. The panel on the left: toggles, every move on a button, any animation, tuning sliders.', [freePlay()]);
    const k = [];
    SPOTS.forEach((s, i) => TGT.forEach((t, j) => k.push(shotTest(`K${String(i * 5 + j + 1).padStart(2, '0')}`, 'K', s, t, 25.6, 0.6))));
    add('K', 'KEEPER · SHOTS', 'A striker shoots from 6 spots to 5 places at 92 km/h. Is the keeper believable?', k);
    const kh = [];
    SPOTS.forEach((s, i) => kh.push(shotTest(`KH${i + 1}`, 'KH', s, TGT[i % 2], 30, 0.9, 'hard: 108 km/h')));
    kh.push(shotTest('KH7', 'KH', SPOTS[0], TGT[4], 12, 0.2, 'soft roller: 43 km/h'));
    kh.push(shotTest('KH8', 'KH', SPOTS[1], TGT[0], 15, 0.3, 'soft, placed: 54 km/h'));
    kh.push(shotTest('KH9', 'KH', SPOTS[4], { n: 'chip over him', y: 34, z: 2.1 }, 10, 0.2, 'chip: 36 km/h'));
    kh.push(shotTest('KH10', 'KH', SPOTS[5], { n: 'dipping, under the bar', y: 33, z: 2.2 }, 19, 0.4, 'lob: 68 km/h'));
    add('KH', 'KEEPER · HARD + SOFT', 'Hard low shots from every spot, then soft rollers, a chip and a lob.', kh);
    add('YS', 'YOU SHOOT', 'You have the ball, the keeper is live. Shoot however you like; R puts you back.',
      SPOTS.map((s, i) => ({ id: `YS${i + 1}`, group: 'YS', name: `you shoot from the ${s.n}`, sub: 'SHOOT', kind: 'shot', you: true,
        setup(r) { shotSetup(r, s, true); r.fired = true; }, check: shotCheck })));
    const c = [];
    CROSS_FROM.forEach(f => ['low', 'high'].forEach(type => ['near', 'spot', 'far'].forEach(to => c.push(crossTest(`C${c.length + 1}`, f, to, type)))));
    add('C', 'KEEPER · CROSSES', 'Crosses from both bylines, low and high, to the near post, the spot and the far post.', c);
    add('P', 'BALL PHYSICS', 'Passes, lobs and bounces on an empty pitch. Watch how far, how fast and how high.', [
      physTest('P1', 'ground pass, 10 m', 'side-foot pass to the ring', { mode: 'ground', to: 10, marks: [{ x: 50, y: 34, r: 0.6 }] }),
      physTest('P2', 'ground pass, 20 m', 'side-foot pass to the ring', { mode: 'ground', to: 20, marks: [{ x: 60, y: 34, r: 0.6 }] }),
      physTest('P3', 'ground pass, 35 m', 'side-foot pass to the ring', { mode: 'ground', to: 35, marks: [{ x: 75, y: 34, r: 0.6 }] }),
      physTest('P4', 'through ball, 25 m', 'into space, slows for a runner', { mode: 'through', to: 25, marks: [{ x: 65, y: 34, r: 0.6 }] }),
      physTest('P5', 'lob, 25 m', 'lofted pass to the ring', { mode: 'lob', to: 25, marks: [{ x: 65, y: 34, r: 0.6 }] }),
      physTest('P6', 'long lob, 45 m', 'lofted pass to the ring', { mode: 'lob', to: 45, marks: [{ x: 85, y: 34, r: 0.6 }] }),
      physTest('P7', 'hard shot along the grass', '108 km/h, how far does it roll?', { speed: 30, vz: 0.3, to: 60, from: 15, marks: [{ x: 45, y: 34, r: 0.6 }, { x: 75, y: 34, r: 0.6 }] }),
      physTest('P8', 'ball dropped from 8 m', 'how does it bounce?', { drop: 8 }),
      physTest('P9', 'pass to a team-mate, 20 m', 'he runs to it and controls it', { mode: 'ground', to: 20, rcv: 20 }),
    ]);
    add('M', 'MOVEMENT · NO BALL', 'Your player only. Judge the start, the top speed, the turns and the stop.', [
      moveTest('M1', 'M', 'RUN to the ring and STOP on it', false, [[55, 34]]),
      moveTest('M2', 'M', 'SPRINT (hold Shift) to the ring and STOP on it', false, [[62, 34]]),
      moveTest('M3', 'M', 'RUN to the ring, then TURN BACK to the start', false, [[55, 34], [40, 34]]),
      moveTest('M4', 'M', 'ZIG-ZAG through the rings', false, [[46, 30], [52, 38], [58, 30], [64, 38]]),
    ]);
    add('D', 'MOVEMENT · WITH BALL', 'Dribbling. Watch how far the ball runs from your feet and how you stop and turn.', [
      moveTest('D1', 'D', 'DRIBBLE to the ring and STOP', true, [[55, 34]]),
      moveTest('D2', 'D', 'SPRINT-DRIBBLE to the ring and STOP', true, [[62, 34]]),
      moveTest('D3', 'D', 'DRIBBLE to the ring, then CUT 90° down', true, [[52, 34], [52, 44]]),
      moveTest('D4', 'D', 'DRIBBLE to the ring, then TURN BACK', true, [[55, 34], [40, 34]]),
      moveTest('D5', 'D', 'DRIBBLE PAST the defender (he only stands there)', true, [[62, 34]], true),
    ]);
    add('T', 'TACKLES', 'A dribbler comes past you. Try the tackle the test names. Does winning / missing / fouling feel fair?', [
      tackleTest('T1', 'he runs straight at you', 'STANDING TACKLE', false, [60, 34], [30, 34], [50, 34], 4.6),
      tackleTest('T2', 'he runs straight at you', 'SLIDE TACKLE', true, [60, 34], [30, 34], [50, 34], 4.6),
      tackleTest('T3', 'he cuts across in front of you', 'STANDING TACKLE', false, [56, 27], [36, 45], [50, 35], 4.6),
      tackleTest('T4', 'he cuts across in front of you', 'SLIDE TACKLE', true, [56, 27], [36, 45], [50, 35], 4.6),
      tackleTest('T5', 'chase him from behind', 'STANDING TACKLE', false, [52, 34], [30, 34], [56, 34.6], 4.2),
      tackleTest('T6', 'chase him from behind', 'SLIDE TACKLE (expect a foul)', true, [52, 34], [30, 34], [56, 34.6], 4.2),
    ]);
    add('A', 'AIR BALLS', 'Crosses to you. Use the key the test names, or nothing for the chest trap.', [
      airTest('A1', 'cross to your head', 'HEADER: shoot key as it arrives', [94, 33], 1.9, 1.3, false),
      airTest('A2', 'ball drops at your waist', 'VOLLEY: shoot key before it reaches you', [94.3, 33], 0.75, 1.35, false),
      airTest('A3', 'low cross 2.5 m in front of you', 'DIVING HEADER: shoot key', [96.5, 33], 0.9, 1.25, false),
      airTest('A4', 'a looping ball drops on you', 'CHEST TRAP: do nothing, let it come', [94, 33], 1.3, 1.45, true),
      airTest('A5', 'a high ball drops in front of goal', 'OVERHEAD KICK: hold SHIFT + shoot key as it arrives', [95, 33], 1.9, 1.35, false),
    ]);
    add('PK', 'PENALTIES', 'The new penalty camera. Take one, save one, then watch set shots against set dives.', [
      penTest('PK1', 'you take the penalty', 'aim, hold the shoot key for power, let go', 'take'),
      penTest('PK2', 'you are the keeper', 'hold left or right as he shoots, nothing = stay', 'keep'),
      penTest('PK3', 'low into the left corner, keeper dives left', 'should be a save', null, { x: -2.9, y: 0.3, power: 0.6, dive: -1 }),
      penTest('PK4', 'low into the left corner, keeper dives right', 'should be a goal', null, { x: -2.9, y: 0.3, power: 0.6, dive: 1 }),
      penTest('PK5', 'high into the right corner, keeper dives right', 'fingertips or a goal', null, { x: 3.0, y: 2.1, power: 0.7, dive: 1 }),
      penTest('PK6', 'down the middle, keeper stays', 'should be a catch', null, { x: 0.1, y: 1.0, power: 0.5, dive: 0 }),
      penTest('PK7', 'down the middle, keeper dives left', 'should be a goal', null, { x: 0.1, y: 1.0, power: 0.5, dive: -1 }),
      penTest('PK8', 'hard and low to the right, keeper dives right', 'close call', null, { x: 3.2, y: 0.25, power: 0.9, dive: 1 }),
    ]);
    const hurt = moveTest('N5-10', 'N5', 'INJURED: run to the ring and back (he limps)', false, [[55, 34], [40, 34]]), hs = hurt.setup;
    hurt.setup = r => { hs(r); r.human.injury = { k: 0.75 }; }; hurt.sub = 'injured: top speed x0.75 until he is subbed';
    const yl = moveTest('N5-4', 'N5', 'YOU: hold the LOB key - tap = short, hold = high and far', true, [[55, 34], [70, 34]]);
    add('N5', 'v0.8.5 · LOB, WEATHER, INJURY', 'Hold-L power lob at 3 lengths (and yours), the same pass / shot / bounce on wet grass and in snow, running hurt.', [
      lobTest('N5-1', 0.15), lobTest('N5-2', 0.55), lobTest('N5-3', 1), yl,
      physTest('N5-5', 'ground pass, 20 m · RAIN', 'wet grass: it skids on further', { group: 'N5', wx: 'rain', mode: 'ground', to: 20, marks: [{ x: 60, y: 34, r: 0.6 }] }),
      physTest('N5-6', 'ground pass, 20 m · SNOW', 'snow: it dies early', { group: 'N5', wx: 'snow', mode: 'ground', to: 20, marks: [{ x: 60, y: 34, r: 0.6 }] }),
      physTest('N5-7', 'hard shot along the grass · RAIN', '108 km/h, how far in the wet?', { group: 'N5', wx: 'rain', speed: 30, vz: 0.3, to: 60, from: 15, marks: [{ x: 45, y: 34, r: 0.6 }, { x: 75, y: 34, r: 0.6 }] }),
      physTest('N5-8', 'hard shot along the grass · SNOW', '108 km/h, how far in snow?', { group: 'N5', wx: 'snow', speed: 30, vz: 0.3, to: 60, from: 15, marks: [{ x: 45, y: 34, r: 0.6 }, { x: 75, y: 34, r: 0.6 }] }),
      physTest('N5-9', 'ball dropped from 8 m · SNOW', 'a dead bounce', { group: 'N5', wx: 'snow', drop: 8 }),
      physTest('N5-11', 'ball dropped from 8 m · RAIN', 'a skiddy bounce', { group: 'N5', wx: 'rain', drop: 8 }),
      hurt,
    ]);
    add('PW', 'v0.8.6 · POWER SPECIALS', 'Specials go through blockers (LV1 one, LV2 two, LV3 five) and fade with distance; keeper special saves; your SAVE! prompt; aerial specials.', [
      pwTest('PW1', 'LV1 through 1 man - the 2nd blocks it', '2 blockers right in its path', { lv: 1, from: [85, 34], block: [3.5, 6.5] }),
      pwTest('PW2', 'LV2 through 2 men - the 3rd blocks it', '3 blockers right in its path', { lv: 2, from: [83, 34], block: [3.5, 6, 8.5] }),
      pwTest('PW3', 'LV3 through 5 men, from their half', '5 blockers, 41 m out', { lv: 3, from: [64, 34], block: [5, 9, 13, 17, 21] }),
      pwTest('PW4', 'LV3 from your own half', 'loses some power the further out', { lv: 3, from: [40, 34], block: [] }),
      pwTest('PW5', 'LV1 from 35 m', 'LV1 is close range only: weak from here', { lv: 1, from: [70, 34], block: [] }),
      pwTest('PW6', 'LV2 against the keeper\'s LV2 save', 'same level: the save should hold', { lv: 2, from: [86, 30], block: [], save: 2 }),
      pwTest('PW7', 'LV3 against the keeper\'s LV1 save', 'lower save: a small chance (about 1 in 8)', { lv: 3, from: [86, 38], block: [], save: 1 }),
      pwTest('PW8', 'LV1 against the keeper\'s LV3 save', 'higher save: always holds', { lv: 1, from: [88, 34], block: [], save: 3 }),
      pwSaveYou('PW9'),
      airSpTest('PW10', 2, true), airSpTest('PW11', 3, true), airSpTest('PW12', 2, false),
    ]);
    // v0.8.9 (Luca: "rig 3 cruder new animations for 3 new aerial special shots ... same for the saves, make cut scenes for
    // the special saves too") - the rough rigs on their own; the saves are made to win (or lose) so you see each one
    const smAir = (id, lv) => Object.assign(airSpTest(id, lv, true), { group: 'SM', name: `AIR LV${lv} · ${RIGS['air' + lv].name}`, sub: 'a cross comes in, the Lab presses SPECIAL: take-off, strike, landing' });
    const smSave = (id, lv, shot, from, force) => Object.assign(pwTest(id, `KEEPER LV${lv} · ${RIGS['save' + lv].name}${force === 'lose' ? ' · and it BREAKS' : ''}`,
      force === 'lose' ? `a LV${shot} special beats his LV${lv} save: the cut scene, then he's blasted` : `a LV${shot} special at him: the cut scene, then his save (made to win here)`, { lv: shot, from, block: [], save: lv }), { group: 'SM', force });
    add('CH', 'v0.9.2 · CHIP SHOT', 'LOB in their box while facing the goal = a CHIP: fast, low arc, a hard dip under the bar. Facing away = a normal lob. Watch it go over a keeper off his line.', chipTests());
    add('WG', 't-012 · WING PLAY', 'The real team AI on both sides: a winger goes down the flank and crosses, team-mates run near post / far post / the spot / the edge, the man who meets it heads it, volleys it or (SP banked) goes for an aerial special.', wgTests());
    add('CP', 't-011 · CURVING SPECIAL PASS', 'Hold SPECIAL and press PASS / THROUGH / LOB with a bar in the bank: the pass bends round the man on the straight line (CURLER, OUTSIDE CURL, BANANA LOB) and spends one bar. Test Lab only for now.', cpTests());
    add('LB', 't-008 · LOB REMAKE + AERIAL BATTLE', 'Hold LOB: a landing ring you walk with the stick, let go = the kick, landing on the ring. A tap is still the instant lob. The ring settles on a team-mate, who times his run. A clear contest at the drop = the AERIAL BATTLE: MASH! SHOOT against the computer.', lbTests());
    add('LC', 't-005 · LOB + CHIP, STEP 1', 'Lobs that really reach their height, a shadow that shrinks as the ball climbs, a landing ring that stays until someone touches the ball, and their keeper reading a lob over him (a delay by level).', lcTests());
    add('GKX', 't-007 · KEEPER SAVES', 'Their keeper reads where the shot crosses him (side and height) and how hard it is: holds the soft ones, dives low or high, jumps, tips over the bar, pushes it round the post, punches a crowded lob. A touch out of play is a corner.', gkxTests());
    add('TK', 't-010 · TAP KICK', 'SHOOT tapped (let go within 0.15 s) = a snappy, low stab along your arrow that dies on the grass: a close-range finish. Held = the power shot as before. In the keeper\'s reach he holds most; out of it, it goes in. (On in the Test Lab only.)', tkTests());
    add('KP', 't-017 · KEEPER 1v1 + TRACKING', 'Their keeper against a striker who tries to walk round him (straight at him, past his side, a tap into the empty net) and one walking the ball across the edge of the box. GOAL = he was walked round; he should block, smother or take it off his feet, and stay on the angle smoothly.', kpTests());
    add('GK', 'v0.9.1 · KEEPER AI', 'Their keeper with the real AI in 11 situations: walking up with the ball far away, the angle, 1v1s, sweeping, back passes, lobs. The yellow diamond is where he wants to be; the label says what he is doing.', gkTests());
    add('SM', 'v0.8.9 · SPECIAL MOVES (ROUGH RIGS)', 'Placeholders made from our PixelLab frames + effects until the real ones come from PixelLab: 3 aerial specials, 3 keeper special saves with their cut scene. v0.9.0: the keeper saves stop normal shots too (SM8-11).', [
      smAir('SM1', 1), smAir('SM2', 2), smAir('SM3', 3),
      smSave('SM4', 1, 1, [84, 34], 'win'), smSave('SM5', 2, 2, [85, 31], 'win'), smSave('SM6', 3, 3, [84, 37], 'win'), smSave('SM7', 1, 3, [84, 34], 'lose'),
      normSave('SM8', 1), normSave('SM9', 2), normSaveYou('SM10', true), normSaveYou('SM11', false),
    ]);
    add('GP', 't-013 · GOAL PHYSICS', 'The goal comes alive (GOAL_PHYS: on in the Lab, off in matches): a net with give - it bulges, slows the ball, holds it a beat, drops it - round posts and bar with real rebounds (glancing carries on, square comes back), and a parry or a broken guard that loops the ball UP for a man following in.', gpTests(smSave));
    add('AS', 't-014 · AERIAL SPECIALS BY THE ARC', 'Two per level, picked by how the ball arrives: LV1 AIR BLAZE (chest-high drop) / TIDE CUTTER (low driven cross), LV2 SKY THUNDER (over his head) / CYCLONE HEEL (behind the shoulder), LV3 PHOENIX (very high) / METEOR DRIVE (sky-high loop). The Lab presses SPECIAL as it reaches you.', [
      asTest('AS1', 'LV1 · a chest-high drop → AIR BLAZE', 'comet volley', { lv: 1, from: [99, 6], z: 1.3, T: 1.35 }),
      asTest('AS2', 'LV1 · a low driven cross → TIDE CUTTER', 'knee-slide side volley (the low popup window)', { lv: 1, from: [100, 14], z: 0.6, T: 0.75 }),
      asTest('AS3', 'LV2 · dropping over his head → SKY THUNDER', 'overhead kick', { lv: 2, from: [99, 6], z: 2.2, T: 1.5 }),
      asTest('AS4', 'LV2 · behind the shoulder → CYCLONE HEEL', 'spinning heel kick: the ball comes from behind him', { lv: 2, from: [80, 22], z: 1.4, T: 1.0 }),
      asTest('AS5', 'LV3 · a very high ball → PHOENIX', 'the leap and dive', { lv: 3, from: [99, 6], z: 1.8, T: 1.5 }),
      asTest('AS6', 'LV3 · a sky-high loop → METEOR DRIVE', 'somersault axe kick', { lv: 3, from: [96, 8], z: 1.8, T: 2.4 }),
    ]);
    add('KS', 't-014 · KEEPER SPECIAL SAVES BY THE SHOT', 'Their keeper has a special save ready; the shot picks the move: a lob → kleap, straight → kblock, wide → kdivecatch, too strong to hold → ktip (a corner). Who wins stays as before.', ksTests());
    add('CS', 'CUT SCENES', 'Every cut scene in full (the Lab normally skips them). R plays it again. Rate how it looks; ENTER moves the menus on.', buildCuts());
    add('BW', 'BUG WATCH · CLIPS', 'Clips the bug watch kept (they load from the Lab\'s database on claude.ai). 1 = the game was right · 2 = it\'s a bug.', [{ id: 'BW0', group: 'BW', name: 'no clips here yet', sub: 'the bug watch hasn\'t sent any clips to the Lab yet', kind: 'clip', doc: null,
      setup(r) { cast([]); r.fired = true; }, check() { return { o: 'NOTHING TO WATCH YET' }; } }]);
    return G;
  }

  // ---------- running a test
  function current() { return LAB.groups[LAB.g].tests[LAB.i]; }
  function start(fresh) {
    const sc = current(), prev = LAB.run;
    const replays = prev && prev.sc === sc ? prev.replays + 1 : 0;
    const seed = fresh ? (Math.random() * 4294967296) >>> 0 : (prev && prev.sc === sc ? prev.seed : hash(sc.id));   // R = the same dice again
    const r = LAB.run = { sc, t: 0, events: [], result: null, endT: 0, frozen: false, you: !!sc.you, bots: new Map(), seed, fresh: !!fresh, replays,
      fired: false, marks: [], maxZ: 0, ev: s => r.events.some(e => e.includes(s)) };
    LAB.rand = rng(seed); LAB.acc = 0; LAB.reasons = null; LAB.cx = null;
    csClean(); if (m.cutIn) m.cutInEnd(); m.cutInQ = null; if ($('bw-ans')) $('bw-ans').textContent = ''; if (m.radar) m.radar.setVisible(false);   // v0.8.7: out of any cut scene / clip (a replay shows the radar again)
    m.dead = null;
    if (m.penaltyMode || m.scene.isActive('penalty')) { m.scene.stop('penalty'); m.penaltyMode = false; }
    Object.assign(m, { setPiece: null, pending: null, diving: null, freeze: 0, hitStop: 0, path: null, passRing: null, nextHuman: null,
      charge: -1, headBuf: 0, penaltyKick: false, over: false, paused: false, msgT: 0, aimPt: null });
    m.msg.setText(''); m.sub.setText(''); m.home.score = m.away.score = 0; m.clock = 600; m.half = 1;
    const wx = (sc.kind === 'free' ? LAB.fp.wx : sc.wx) || 'clear'; setWx(wx);                                   // v0.8.7 weather tests
    if (LAB.tune) applyTune(sc.kind === 'free' ? LAB.tune : LAB.def, wx === 'clear');   // (v0.9.9: every other test plays the game's own values)
    for (const mt of m.meters || []) mt.e = 0;
    if (LAB.demo0 != null) { m.demo = LAB.demo0; LAB.demo0 = null; }           // (t-012: a WG test plays the computer on both sides)
    TAP_KICK = sc.kind === 'free' ? !!LAB.fp.tap : !!sc.tap;                    // t-010: FREE PLAY (its switch) and the TK tests; every other test plays as a match does
    if (LAB.aerialChance != null) { AERIAL.chance = LAB.aerialChance; LAB.aerialChance = null; }   // (t-008: LB6-LB8 force the battle; every other test plays the game's chance)
    if (m.aerial && m.camTarget === m.aerial.cam) m.camTarget = null; Object.assign(m, { aerial: null, lobAim: null, slowMo: 0 }); Object.assign(Input.touch, { x: 0, y: 0, btn: {} });
    sc.setup(r);
    m.human = r.human; m.camX = m.camY = undefined;
    render();
  }
  function finish(res) { const r = LAB.run; r.result = res; r.endT = r.t + (res.hold ?? 0.9); render(); }
  function sample() {
    const r = LAB.run, b = m.ball;
    if (r.action && !r.fired && r.t >= r.action.at) { r.fired = true; r.action.fire(r); }
    if (r.shotT != null && !r.result) {
      r.maxZ = Math.max(r.maxZ, b.z);
      if (r.v0 == null && !b.owner) r.v0 = len(b.vx, b.vy, b.vz);
      const gk = r.gk;
      if (gk && !r.line && r.prevBX != null && (r.prevBX - LINE_X) * (b.x - LINE_X) <= 0 && r.prevBX !== b.x)
        r.line = { by: b.y, bz: b.z, gy: gk.y, gap: len(b.x - gk.x, b.y - gk.y), state: gk.state };
      r.prevBX = b.x;
      // bounces (drop test): every peak height
      if (r.prevVz > 0 && b.vz <= 0) (r.peaks = r.peaks || []).push(+b.z.toFixed(2));
      r.prevVz = b.vz;
      for (const mk of r.marks) if (!mk.hit && r.start && len(b.x - r.start.x, b.y - r.start.y) >= len(mk.x - r.start.x, mk.y - r.start.y)) {
        mk.hit = { t: r.t - r.shotT, v: len(b.vx, b.vy), z: b.z };
      }
    }
    if (r.you) {                                                   // movement measurements
      const p = r.human, sp = p.speed, moving = len(Input.axis.x, Input.axis.y) > 0.1;
      r.top = Math.max(r.top || 0, sp);
      if (r.wasMoving && !moving && sp > 1) r.stop = { x: p.x, y: p.y, t: r.t, v: sp };
      if (r.stop && sp < 0.15) { r.lastStop = { d: len(p.x - r.stop.x, p.y - r.stop.y), t: r.t - r.stop.t, v: r.stop.v }; r.stop = null; }
      if (moving && r.stop) r.stop = null;
      r.wasMoving = moving;
      if (b.owner === p) {
        const d = len(b.x - p.x, b.y - p.y), bs = len(b.vx, b.vy);
        r.ballD = d; r.ballMax = Math.max(r.ballMax || 0, d);
        if (r.prevBS != null && bs - r.prevBS > 1.0) r.touches = (r.touches || 0) + 1;
        r.prevBS = bs;
      } else r.prevBS = null;
    }
    if (!r.result) { const res = r.sc.check(r); if (res) finish(res); }
    else if (!r.frozen && r.t >= r.endT) r.frozen = true;
  }

  // ---------- the keeper's read of a shot (no dice any more: he reacts, misreads a little, moves; contact decides)
  function planInfo(s) {
    return { kind: s.off ? 'leave it' : s.dy <= s.cover ? 'in reach' : 'out of reach', t: s.t0, dy: s.dy, reach: s.cover,
      react: s.react, misread: Math.abs(s.y - s.gk.y - (s.dy * Math.sign(s.y - s.gk.y || 1))), off: s.off, save: s };
  }

  // ---------- hooks into the game
  function hook() {
    const sim = m.sim.bind(m), control = m.controlHuman.bind(m), restart = m.restart.bind(m), kickoff = m.kickoff.bind(m),
      say = m.say.bind(m), plan = m.planSave.bind(m), rnd = m.render.bind(m);
    m.sim = function (dt) {
      const r = LAB.run; if (!r || r.frozen) return;
      LAB.acc += dt * LAB.slow;
      while (LAB.acc >= STEP) {
        LAB.acc -= STEP;
        const real = Math.random; Math.random = LAB.rand;
        try { sim(STEP); } finally { Math.random = real; }
        m.clock = 600; r.t += STEP; sample();
        if (r.frozen) { LAB.acc = 0; break; }
      }
    };
    m.controlHuman = function (dt) {
      const r = LAB.run; if (!r || !r.you) return;
      const o = m.ball.owner; if (o && o !== r.human && o.team === r.human.team) return;      // a team-mate is about to cross: hands off
      m.human = r.human; m.nextHuman = null; control(dt); m.human = r.human;
    };
    const realAi = m.ai.bind(m);                                               // t-012: the WG tests play the real team AI
    m.ai = function (dt) {
      const r = LAB.run; if (!r) return;
      if (r.sc.realAi) { realAi(dt); for (const [p, bot] of r.bots) if (!p.sentOff && p.stun <= 0) bot(p, dt); return; }
      for (const p of m.all) {
        if (p.sentOff || (r.you && p === r.human)) continue;
        if (p.state === 'kick' || p.state === 'catch' || p.state === 'dive' || p.state === 'slide' || p.state === 'dheader' || p.state === 'chance' || p.state === 'celebrate' || p.state === 'tackle' || p.state === 'dejected' || p.state === 'roar' || p.state === 'beaten' || p.state === 'protest' || p.state === 'hurt' || p.stun > 0) continue;
        if (p.keeper) { m.keeperAI(p, dt); continue; }
        const bot = r.bots.get(p); if (bot) bot(p, dt); else p.steer(0, 0, dt);
      }
    };
    m.restart = function (kind, team, x, y, note) {
      const r = LAB.run; if (r && !r.out) { r.out = kind; r.outNote = note || ''; }
      const b = m.ball; b.vx = b.vy = b.vz = 0; if (b.owner && !b.owner.hands) b.owner = null;
      if ((kind === 'CORNER' || kind === 'GOAL KICK') && (b.x < 0 || b.x > PITCH_L)) m.dead = { kind, team, x, y, t: 1e9 };   // (t-007: the ball stays dead behind the goal - not a "goal" as it drops under the bar)
    };
    m.kickoff = function () {};
    m.openPause = function () {};                                              // (ENTER moves the cut scenes on in the Lab - no pause menu here)
    m.endCeremony = function () { csClean(); const r = LAB.run; if (r && !r.result) finish({ o: 'CEREMONY OVER' }); };   // (no cup to go back to in the Lab)
    m.say = function (a, b, t) { const r = LAB.run; if (r) r.events.push(`${a || ''} ${b || ''}`.trim()); say(a, b, t); };
    m.planSave = function (gk) { plan(gk); const r = LAB.run, s = m.ball.save; if (r && s) r.plan = planInfo(s); };
    const shot = m.doShot.bind(m);
    m.doShot = function (p, power, aimY) { const r = LAB.run; return shot(p, r && r.sc.kind === 'free' && LAB.fp.max && p === r.human ? Math.max(power, 0.88) : power, aimY); };   // MAX SHOT: the hardest that stays on target
    m.dk = function (team) { const r = LAB.run, free = r && r.sc.kind === 'free' && team === m.away, lvl = r && r.sc.lvl && team === m.away ? r.sc.lvl : null;   // (t-005: a test can name their level - LC7)
      const K = diffK(free ? LAB.fp.cpu : lvl || 'base');                        // v0.9.2: the Lab plays the base AI (FREE PLAY: the CPU LEVEL switch)
      if (!free || !LAB.react) return K;                                         // v0.9.9 the REACTION TIME knob, on top of his level
      const c = LAB.reactK; if (c && c.src === K && c.d === LAB.react) return c.K;
      LAB.reactK = { src: K, d: LAB.react, K: Object.assign({}, K, { gkReact: K.gkReact + LAB.react }) }; return LAB.reactK.K; };
    m.dkY = function (team) { const r = LAB.run; return DIFF_YOU[r && r.sc.kind === 'free' && team === m.away ? LAB.fp.cpu : 'base']; };   // v0.9.3: its edges v you, same switch
    const gpPop = m.gpPop.bind(m);                                             // t-013 GP7-8: the pop-up made to happen, so it can be seen
    m.gpPop = function (gk, kind, spd) { const r = LAB.run; if (!(r && r.sc.forcePop)) return gpPop(gk, kind, spd); const R = Math.random; let first = true;
      Math.random = () => (first ? (first = false, 0) : R()); try { return gpPop(gk, kind, spd); } finally { Math.random = R; } };
    const kTouch = m.keeperTouch.bind(m);                                      // t-013 GP7: his touch made a plain parry (t-007's keeper may hold it or turn it round the post)
    m.keeperTouch = function (p, pbx) { const r = LAB.run, h = kTouch(p, pbx); return h && r && r.sc.forceParry ? 'parry' : h; };
    const clash = m.clash.bind(m);                                             // v0.8.9 SM tests: the save made to win / lose, so each one can be seen
    m.clash = function (gk) { const r = LAB.run, f = r && r.sc.force; if (!f) return clash(gk); const R = Math.random; let n = 0; Math.random = () => (f === 'win' ? 0 : f === 'hand' && n++ ? 0 : 0.9999); /* (t-007 'hand': beaten, then a hand to it) */ try { return clash(gk); } finally { Math.random = R; } };
    const saveCall = m.saveCall.bind(m);                                       // v0.8.8 free play KEEPER SAVE: off, or always that level
    m.saveCall = function (def) { const r = LAB.run; if (!(r && r.sc.kind === 'free' && def === m.away)) return saveCall(def);
      const gk = def.players[0]; if (!gk || gk.sentOff) return; gk.spSave = LAB.fp.save || 0; if (gk.spSave) m.saveFx(gk); };
    const shotSave = m.shotSaveCall.bind(m);                                   // v0.9.0 free play: KEEPER SAVE also answers your normal shots
    m.shotSaveCall = function (def, shooters, pen) { const r = LAB.run;
      if (r && r.sc.forceUse) { const R = Math.random; Math.random = () => 0; try { return shotSave(def, shooters, pen); } finally { Math.random = R; } }   // (SM8-9: he uses it)
      if (!(r && r.sc.kind === 'free' && def === m.away)) return shotSave(def, shooters, pen);
      const gk = def.players[0], b = m.ball, sv = b.save; if (!gk || gk.sentOff || pen || !LAB.fp.save || !sv || sv.off || gk.spSave) return;
      b.saveable = shooters; gk.spSave = LAB.fp.save; m.saveFx(gk); };
    m.render = function (dt) {
      rnd(dt);
      const r = LAB.run;
      if (r && r.cam) {                                            // follow the player in the movement tests
        const c = r.cam(), tx = wx(c.x, c.y) + (c.sx || 0), ty = wy(c.y) - 70;
        LAB.cx = LAB.cx == null ? tx : LAB.cx + (tx - LAB.cx) * 0.12; LAB.cy = LAB.cy == null ? ty : LAB.cy + (ty - LAB.cy) * 0.12;
        m.cameras.main.centerOn(Math.round(LAB.cx), Math.round(LAB.cy));
      }
      m.help.setVisible(false);
      const cam = m.cameras.main; if (cam.zoom !== LAB.zoom) { if (!m.uiFix) m.uiFix = [m.hud, m.rami && m.rami.c].filter(Boolean).map(g => ({ g, x: g.x, y: g.y, s: g.scaleX })); cam.setZoom(LAB.zoom); m.fixUi(LAB.zoom); }   // (the SP meters + captions stay put)   // v0.8.5 camera zoom slider
      draw();
    };
    for (const o of m.hud.list) if (o !== m.msg && o !== m.sub) o.setVisible(false);   // no scoreboard, clock or radar in the lab
    m.drawRadar = function () {};
    LAB.gfx = m.add.graphics().setDepth(9e6);
    LAB.planTxt = m.add.text(0, 0, '', { fontFamily: '"Press Start 2P"', fontSize: '8px', color: '#0c0a0e', backgroundColor: '#28c8e6', padding: { x: 4, y: 3 } })
      .setOrigin(0.5, 1).setDepth(9e6 + 1);
    LAB.gkTxt = [0, 1].map(() => m.add.text(0, 0, '', { fontFamily: '"Press Start 2P"', fontSize: '7px', color: '#0c0a0e', backgroundColor: '#ffde1e', padding: { x: 3, y: 2 } })
      .setOrigin(0.5, 1).setDepth(9e6 + 2).setVisible(false));                // v0.9.1 GK VIEW: what each keeper is doing
  }
  // v0.9.1 GK VIEW: the lines from the ball to his posts, where he wants to be (the diamond), what he's doing and how far out
  function gkDraw(g) {
    [m.home.players[0], m.away.players[0]].forEach((k, i) => {
      const T = LAB.gkTxt[i]; T.setVisible(false);
      if (!k || k.sentOff || !k.gkMode || k.hide) return;
      const gx = k.team.ownGoalX, b = m.ball, H = (k.x - gx) * k.team.side;
      if (len(b.x - gx, b.y - 34) < 45 && !(b.owner === k)) { g.lineStyle(1, 0x28c8e6, 0.3); for (const py of [GOAL_Y0, GOAL_Y1]) g.lineBetween(wx(b.x, b.y), wy(b.y), wx(gx, py), wy(py)); }
      const t = k.gkTgt; if (t && k.gkMode !== 'BALL') { const X = wx(t.x, t.y), Y = wy(t.y); g.lineStyle(1, 0xffde1e, 0.55).lineBetween(wx(k.x, k.y), wy(k.y), X, Y);
        g.fillStyle(0xffde1e, 0.9).fillPoints([{ x: X, y: Y - 5 }, { x: X + 6, y: Y }, { x: X, y: Y + 5 }, { x: X - 6, y: Y }], true); }
      T.setVisible(true).setPosition(Math.round(wx(k.x, k.y)), Math.round(wy(k.y) - 118)).setText(`${k.gkMode}${k.gkSet && k.gkMode !== 'SET' ? ' · SET' : ''} · ${H.toFixed(1)} M`);
    });
  }

  // ---------- hit boxes on the pitch
  function ring(x, y, r, col, w, a = 1) { LAB.gfx.lineStyle(w, col, a).strokeEllipse(wx(x, y), wy(y), r * 2 * PX_X * scaleAt(y), r * 2 * PX_Y); }
  function draw() {
    const g = LAB.gfx, r = LAB.run; g.clear(); LAB.planTxt.setVisible(false); if (LAB.gkTxt) for (const t of LAB.gkTxt) t.setVisible(false); if (!r) return;
    for (const mk of r.marks) ring(mk.x, mk.y, mk.r, 0xffde1e, 3, 0.95);
    if ((r.sc.kind === 'gk' || (r.sc.kind === 'free' && LAB.fp.gkv)) && LAB.gkTxt) gkDraw(g);
    if (!LAB.boxes || r.sc.kind === 'cut' || r.sc.kind === 'clip') return;          // (cut scenes and clips: just the picture)
    for (const p of m.all) {
      if (p.sentOff) continue;
      const box = p.keeper && Math.abs(p.x - p.team.ownGoalX) < 16.5 && Math.abs(p.y - 34) < 20.2;
      ring(p.x, p.y, 0.5, 0xf4f0e4, 1, 0.35);                                  // body: a ball this close hits him   (v0.8.8: lighter, Luca "clean the overlay")
      ring(p.x, p.y, box ? 1.3 : 0.8, box ? 0x28c8e6 : 0x7cff9a, 1.5, 0.7);    // reach: he can take the ball
      if (p.state === 'slide') { const dv = dirVec(p.face); ring(p.x + dv.x * 0.7, p.y + dv.y * 0.7, 0.9, 0xff2878, 2); }
      if (r.you && p === r.human && r.sc.kind === 'tackle' && !r.slide) ring(p.x, p.y, 1.4, 0xffde1e, 1, 0.6);   // standing-tackle reach
    }
    const b = m.ball, X = wx(b.x, b.y), Y = wy(b.y);
    if (b.z > 0.05) g.lineStyle(2, 0xffde1e, 0.9).lineBetween(X, Y - 7, X, Y - 12 - b.z * PX_H);
    if (m.path && !b.owner) { g.fillStyle(0xffde1e, 0.55); m.path.forEach((pt, j) => { if (j % 2 === 0) g.fillRect(Math.round(wx(pt.x, pt.y)) - 1, Math.round(wy(pt.y) - 12 - pt.z * PX_H) - 1, 2, 2); }); }
    if (r.plan && r.gk && !r.result && (r.sc.kind !== 'free' || (r.shotT != null && r.t - r.shotT < 1.6))) {   // (free play: the keeper's read for a moment, not for ever)
      const gk = r.gk; LAB.planTxt.setVisible(true).setPosition(Math.round(wx(gk.x, gk.y)), Math.round(wy(gk.y) - 128))
        .setText(`${(r.plan.save.act || 'reading').toUpperCase()} · ${r.plan.dy.toFixed(1)} / ${r.plan.reach.toFixed(1)} M`);
    }
  }

  // ---------- the panel
  const REASONS = { 3: 'keeper', 4: 'ball physics', 5: 'movement / feel', 6: 'contact / hit box', 7: 'animation / looks' };
  function render() {
    const grp = LAB.groups[LAB.g], sc = current(), r = LAB.run, k = keyset();
    $('grp').textContent = grp.name; $('count').textContent = `${LAB.i + 1} / ${grp.tests.length}`;
    $('name').textContent = sc.name;
    let how = sc.sub || '';
    if (sc.you) {
      const keys = { SHOOT: `shoot with ${k.shoot} (hold for power, ${k.ud} picks the corner)`, 'STANDING TACKLE': `challenge: ${k.pass} (win it = the ball is at your feet)`,
        'SLIDE TACKLE': `slide: ${k.shoot} (push the way you want to go)`, 'SLIDE TACKLE (expect a foul)': `slide: ${k.shoot} (expect a foul)` };
      how = keys[sc.sub] || sc.sub;
      if (sc.kind === 'move') how = `move with ${k.move}, sprint with Shift${sc.sub.includes('ball') ? '' : ''}`;
      if (sc.kind === 'air') how = sc.sub.replace('shoot key', k.shoot);
      if (sc.kind === 'pen') how = sc.sub.replace('the shoot key', k.shoot).replace('left or right', `${k.move === 'WASD' ? 'A or D' : 'LEFT or RIGHT'}`);
      if (sc.kind === 'free') how = `${k.shoot} shoot · ${k.pass} pass · ${k.special} special`;
      if (sc.group === 'PW' || sc.group === 'N5') how = sc.sub.replace('SPECIAL', k.special).replace('LOB key', `LOB key (${k.lob})`);
      how = 'YOU: ' + how;
    }
    $('how').textContent = how; $('how').classList.toggle('you', !!sc.you);
    $('blurb').textContent = grp.blurb;
    const dots = $('dots'); dots.innerHTML = '';
    grp.tests.forEach((t, j) => { const s = document.createElement('i'); const v = LAB.rated[t.id]; if (v) s.className = v; if (j === LAB.i) s.classList.add('cur'); s.title = t.id; dots.appendChild(s); });
    const res = $('result');
    res.textContent = r && r.result ? r.result.o : (sc.kind === 'free' ? 'free play · E resets the ball' : sc.you ? 'your turn' : 'watch…'); res.className = r && r.result ? (r.result.o.startsWith('GOAL') || r.result.o.includes('→ GOAL') ? 'goal' : 'done') : '';
    $('reasons').hidden = !LAB.reasons;
    for (const el of document.querySelectorAll('#reasons [data-r]')) el.classList.toggle('on', !!(LAB.reasons && LAB.reasons.has(el.dataset.r)));
    $('slow').textContent = LAB.slow === 1 ? 'normal speed' : `slow motion ×${LAB.slow}`;
    $('boxes').textContent = LAB.boxes ? 'hit boxes on' : 'hit boxes off';
    $('flags').hidden = LAB.slow === 1 && LAB.boxes;                            // v0.8.8: only when something is switched away from normal
    $('id').textContent = sc.id;
    $('fp').hidden = sc.kind !== 'free'; document.body.classList.toggle('free', sc.kind === 'free');
    const clip = sc.kind === 'clip'; $('bwc').hidden = !clip || !sc.doc;                                  // v0.8.7 BUG WATCH clip card
    $('r1').textContent = clip ? 'game was right' : 'looks right'; $('r2').textContent = clip ? "it's a bug" : 'looks wrong';
    $('rate-h').textContent = clip ? 'RATE THIS CLIP' : 'RATE THIS TEST';
    if (clip && sc.doc) { const d = sc.doc, esc = t => String(t || '').replace(/[<>&]/g, '');
      $('bw-why').innerHTML = `<b>${esc(d.sev === 'bug' ? 'LOOKS LIKE A BUG' : d.sev === 'perf' ? 'SPEED' : 'LOOKS ODD')}</b> ${esc(d.why)}<br><span>${esc(d.home)} ${esc(d.score)} ${esc(d.away)} · ${esc(d.mode)} · ${esc(d.weather || 'clear')} · ${esc(d.game)}</span>${d.claude ? `<br><i>CLAUDE${d.status === 'fixed' ? ' (FIXED IN v0.8.7)' : ''}: ${esc(d.claude)}</i>` : ''}${d.review ? `<br><em>RATED: ${esc(d.review.verdict)}${d.review.note ? ' · ' + esc(d.review.note) : ''}</em>` : ''}`; }
  }
  function readouts() {
    const r = LAB.run; if (!r) return;
    const b = m.ball, L = [];
    if (r.sc.kind === 'free') {                                                  // free play: a short list, it shares the screen with the goal
      const S = r.stats, gk = r.gk, mt = m.meters && m.meters[0];
      $('result').textContent = { goal: 'GOAL!', held: 'KEEPER HOLDS IT', out: 'OUT', far: 'BALL GONE' }[r.why] || r.last || 'READY · E = BALL BACK';
      $('result').className = r.why === 'goal' ? 'goal' : r.why ? 'done' : '';
      L.push(['ball', `${kmh(len(b.vx, b.vy, b.vz))} km/h · ${b.z.toFixed(1)} m up`]);
      if (r.v0 != null) L.push(['struck at', `${kmh(r.v0)} km/h · top ${r.maxZ.toFixed(1)} m`]);
      if (gk && !r.nogk) L.push(['keeper', `${gk.hands ? 'holding it' : gk.state} · guard ${Math.round((gk.guard ?? 1) * 100)}%${LAB.fp.save ? ` · LV${LAB.fp.save} save ready` : ''}`]);
      L.push(['you', `${r.human.speed.toFixed(1)} m/s · energy ${Math.round(r.human.stamina * 100)}%`]);
      if (mt) L.push(['your SP', `${mt.e.toFixed(2)} bars${LAB.fp.sp ? ' (kept full)' : ''}`]);
      L.push(['session', `${S.shots} shots · ${S.goals} goals · ${S.held} held`]);
      $('live').innerHTML = L.map(([a, v]) => `<dt>${a}</dt><dd>${v}</dd>`).join('');
      return;
    }
    const bv = len(b.vx, b.vy, b.vz);
    L.push(['ball', `${kmh(bv)} km/h · ${b.z.toFixed(1)} m up`]);
    if (r.gk) {
      const gk = r.gk; L.push(['keeper', `${gk.hands ? 'holding it' : gk.state}${gk.speed > 0.3 ? ` · moving ${gk.speed.toFixed(1)} m/s` : ''}`]);
      if (r.plan) L.push(['his read', r.plan.off ? 'off target: lets it go' : `${r.plan.save.act || 'reading'} · reacts after ${r.plan.react.toFixed(2)} s · reaches him in ${r.plan.t.toFixed(2)} s · ${r.plan.dy.toFixed(1)} m from him, he can cover ${r.plan.reach.toFixed(1)} m (${r.plan.kind})`]);
      if (r.line) L.push(['at his line', `ball ${r.line.gap.toFixed(1)} m from him, ${r.line.bz.toFixed(1)} m up · he was ${r.line.state}`]);
    }
    if (r.v0 != null && r.sc.kind !== 'move') L.push(['struck at', `${kmh(r.v0)} km/h · top height ${r.maxZ.toFixed(1)} m`]);
    for (const mk of r.marks) if (mk.hit) L.push(['at the ring', `${mk.hit.t.toFixed(2)} s · ${kmh(mk.hit.v)} km/h · ${mk.hit.z.toFixed(1)} m up`]);
    if (r.peaks) L.push(['bounces', r.peaks.slice(0, 6).map(z => z + ' m').join(' → ')]);
    if (r.you) {
      const p = r.human; L.push(['you', `${p.speed.toFixed(1)} m/s (top ${(r.top || 0).toFixed(1)}) · energy ${Math.round(p.stamina * 100)}%`]);
      if (r.lastStop) L.push(['last stop', `${r.lastStop.d.toFixed(2)} m and ${r.lastStop.t.toFixed(2)} s after you let go (from ${r.lastStop.v.toFixed(1)} m/s)`]);
      if (r.ballD != null && r.sc.kind === 'move') L.push(['ball from feet', `${r.ballD.toFixed(1)} m now · ${(r.ballMax || 0).toFixed(1)} m at most · ${r.touches || 0} touches`]);
    }
    const ev = r.events.filter(e => !/KICK-OFF/.test(e)); if (ev.length) L.push(['called', ev.slice(-3).join(' · ')]);
    $('live').innerHTML = L.map(([a, v]) => `<dt>${a}</dt><dd>${v}</dd>`).join('');
  }
  function summary(r) {
    const s = { outcome: r.result ? r.result.o : 'not finished', t: +r.t.toFixed(2) };
    if (r.plan) s.plan = { kind: r.plan.kind, act: r.plan.save.act || null, react: +r.plan.react.toFixed(2), reachesIn: +r.plan.t.toFixed(2), fromHim: +r.plan.dy.toFixed(2), canCover: +r.plan.reach.toFixed(2) };
    if (r.line) s.atLine = { gap: +r.line.gap.toFixed(2), height: +r.line.bz.toFixed(2), keeper: r.line.state };
    if (r.v0 != null) { s.kmh = kmh(r.v0); s.topHeight = +r.maxZ.toFixed(2); }
    const hits = r.marks.filter(mk => mk.hit).map(mk => ({ t: +mk.hit.t.toFixed(2), kmh: kmh(mk.hit.v), z: +mk.hit.z.toFixed(2) })); if (hits.length) s.atRings = hits;
    if (r.peaks) s.bounces = r.peaks.slice(0, 6);
    if (r.you) { s.topSpeed = +(r.top || 0).toFixed(2); if (r.lastStop) s.lastStop = { m: +r.lastStop.d.toFixed(2), s: +r.lastStop.t.toFixed(2), from: +r.lastStop.v.toFixed(1) };
      if (r.ballMax != null) s.ballFromFeetMax = +r.ballMax.toFixed(2); if (r.touches) s.touches = r.touches; }
    s.events = r.events.filter(e => !/KICK-OFF/.test(e)).slice(-5);
    return s;
  }

  // ---------- ratings (saved to the lab's database when it's available; this browser keeps a copy either way)
  function persistLocal() { try { localStorage.setItem('hc2-lab-rated', JSON.stringify(LAB.rated)); localStorage.setItem('hc2-lab-log', JSON.stringify(LAB.log.slice(-400))); } catch (e) {} }
  function loadLocal() { try { LAB.rated = JSON.parse(localStorage.getItem('hc2-lab-rated') || '{}') || {}; LAB.log = JSON.parse(localStorage.getItem('hc2-lab-log') || '[]') || []; } catch (e) { LAB.rated = {}; LAB.log = []; } }
  function status(t) { $('status').textContent = t; }
  async function save(verdict, reasons) {
    const r = LAB.run, sc = r.sc, note = $('note').value.trim();
    const doc = { test: sc.id, group: sc.group, name: sc.name, verdict, reasons: [...(reasons || [])].map(x => REASONS[x]), note,
      result: summary(r), replays: r.replays, seed: r.seed, slow: LAB.slow, game: 'v0.9.0', lab: 1, at: new Date().toISOString() };
    if (sc.kind === 'free' && LAB.tune) { doc.tuning = JSON.parse(tuneText()); doc.toggles = { ...LAB.fp }; }
    if (sc.kind === 'clip') { doc.clip = sc.doc ? { id: sc.doc._id, code: sc.doc.code, msg: sc.doc.msg } : null; doc.claude = r.claudeSays || ''; saveClipReview(verdict, reasons); }
    LAB.log.push(doc); LAB.rated[sc.id] = verdict === 'right' ? 'good' : 'bad'; persistLocal(); $('note').value = '';
    const n = LAB.log.length;
    if (LAB.db) {
      try { await LAB.db.collection('ratings').add(doc); status(`${n} rated · saved, Claude can read them`); }
      catch (e) { status(`${n} rated · only in this browser (${e && e.code || 'error'}), use COPY RATINGS`); }
    } else status(`${n} rated · kept in this browser, use COPY RATINGS to send them`);
  }
  function next(d = 1) { const grp = LAB.groups[LAB.g]; LAB.i += d;
    if (LAB.i >= grp.tests.length) { LAB.g = (LAB.g + 1) % LAB.groups.length; LAB.i = 0; }
    if (LAB.i < 0) { LAB.g = (LAB.g - 1 + LAB.groups.length) % LAB.groups.length; LAB.i = LAB.groups[LAB.g].tests.length - 1; }
    try { localStorage.setItem('hc2-lab-at2', JSON.stringify([LAB.g, LAB.i])); } catch (e) {}
    start(false); }
  function rateRight() { save('right', null); flash('✓ saved'); setTimeout(() => next(1), 250); }
  function flash(t) { const f = $('flash'); f.textContent = t; f.classList.remove('go'); void f.offsetWidth; f.classList.add('go'); }
  function menu(open) {
    LAB.menu = open; $('menu').hidden = !open; if (!open) return;
    $('menu-list').innerHTML = LAB.groups.map((g, j) => { const done = g.tests.filter(t => LAB.rated[t.id]).length;
      return `<li${j === LAB.g ? ' class="cur"' : ''}><button type="button" data-g="${j}"><b>${(j + 1) % 10}</b> ${g.name}<span>${done} / ${g.tests.length} rated</span></button></li>`; }).join('');
    for (const b of document.querySelectorAll('#menu-list button')) b.addEventListener('click', () => jump(+b.dataset.g));
  }
  function setZoom(z, fromSlider) {
    LAB.zoom = Math.round(clamp(z, 0.5, 2) * 100) / 100; LAB.cx = null;
    if (!fromSlider && $('zoom')) $('zoom').value = LAB.zoom; if ($('zoomv')) $('zoomv').textContent = LAB.zoom.toFixed(2) + '×';
    try { localStorage.setItem('hc2-lab-zoom', String(LAB.zoom)); } catch (e) {}
  }
  function jump(j) { if (j < 0 || j >= LAB.groups.length) return; LAB.g = j; LAB.i = 0; menu(false); start(false); }
  // (Luca + the co-designer, 24 Oct: "Try it in the Test Lab" on every Needs OK card) a link ending in a test's id opens
  // that test and starts it: …#CH1, also #lab-CH1 (from a PR preview page), or a whole group: #CH. Ids ignore case.
  function fromHash() {
    const id = decodeURIComponent((location.hash || '').slice(1)).replace(/^lab-?/i, '').toLowerCase(); if (!id) return false;
    for (let g = 0; g < LAB.groups.length; g++) { const i = LAB.groups[g].tests.findIndex(t => t.id.toLowerCase() === id); if (i >= 0) { LAB.g = g; LAB.i = i; return true; } }
    const g = LAB.groups.findIndex(x => x.id.toLowerCase() === id); if (g >= 0) { LAB.g = g; LAB.i = 0; return true; }
    return false;
  }

  function keys() {
    addEventListener('keydown', e => {
      if (!LAB.active || e.repeat) return;
      const t = e.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      const k = e.key.toLowerCase();
      const free = LAB.run && LAB.run.sc.kind === 'free';
      if (free && e.isTrusted && (k === 'b' || k === 'u')) return;                  // B / U = SPECIAL in the game (the BACK button still works)
      if (free && k === 'e' && !LAB.menu) { fpReset(); return; }
      if (free && k === 'q' && !LAB.menu) { fpMini(); return; }
      if (LAB.menu) { if (/^[0-9]$/.test(k)) jump(k === '0' ? 9 : +k - 1); else if (k === 'g' || k === 'm') menu(false); return; }
      if (k === '-' || k === '_') return setZoom(LAB.zoom - 0.1);
      if (k === '=' || k === '+') return setZoom(LAB.zoom + 0.1);
      if (k === '\\') return setZoom(1);
      if (k === 'r') start(false);
      else if (k === 'f') start(true);
      else if (k === 'n') { if (LAB.reasons) { save('wrong', LAB.reasons); flash('✗ saved'); } next(1); }
      else if (k === 'b') next(-1);
      else if (k === '1') rateRight();
      else if (k === '2') { LAB.reasons = new Set(); render(); }
      else if (LAB.reasons && REASONS[k]) { LAB.reasons.has(k) ? LAB.reasons.delete(k) : LAB.reasons.add(k); render(); }
      else if (k === 'h') { LAB.boxes = !LAB.boxes; render(); }
      else if (k === 't') { LAB.slow = LAB.slow === 1 ? 0.5 : LAB.slow === 0.5 ? 0.25 : 1; m.anims.globalTimeScale = LAB.slow; render(); }
      else if (k === 'g' || k === 'm') menu(true);
    });
    for (const b of document.querySelectorAll('[data-key]')) b.addEventListener('click', () => {
      const ev = new KeyboardEvent('keydown', { key: b.dataset.key }); dispatchEvent(ev);
    });
    $('note').addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') e.target.blur(); });
    // v0.8.5 camera zoom: slider + buttons (the slider lets go of the keys again, so the arrows move your player)
    const zs = $('zoom'); if (zs) {
    zs.addEventListener('input', () => setZoom(+zs.value, true));
    zs.addEventListener('change', () => zs.blur()); zs.addEventListener('pointerup', () => zs.blur());
    zs.addEventListener('keydown', e => e.stopPropagation());
    $('zout').addEventListener('click', e => { setZoom(LAB.zoom - 0.1); e.currentTarget.blur(); });
    $('zin').addEventListener('click', e => { setZoom(LAB.zoom + 0.1); e.currentTarget.blur(); });
    $('zreset').addEventListener('click', e => { setZoom(1); e.currentTarget.blur(); });
    setZoom(LAB.zoom); }
    $('copy').addEventListener('click', () => {
      const text = JSON.stringify(LAB.log, null, 1);
      const done = () => flash('copied');
      try { navigator.clipboard.writeText(text).then(done, () => { $('dump').hidden = false; $('dump').value = text; $('dump').select(); }); }
      catch (e) { $('dump').hidden = false; $('dump').value = text; $('dump').select(); }
    });
  }

  // ---------- boot
  function boot() {
    m = window.__hc2;
    if (!m || !m.home || typeof MAN === 'undefined' || !MAN) return setTimeout(boot, 200);
    loadLocal();
    m.setTeams('IS', 'IRO', () => {
      window.HC2_STARTED = true; CURVE_PASS = true; hook();   // (t-011: the curving special pass is Test Lab only for now - Luca)
      LAB.groups = buildTests(); LAB.active = true;
      try { const at = JSON.parse(localStorage.getItem('hc2-lab-at2') || 'null'); if (at && LAB.groups[at[0]] && LAB.groups[at[0]].tests[at[1]]) { LAB.g = at[0]; LAB.i = at[1]; } } catch (e) {}
      fromHash();                                                                  // a test named in the link wins over where you left off
      addEventListener('hashchange', () => { if (fromHash()) { menu(false); start(false); } });
      $('loading').hidden = true; keys(); fpUI(); start(false);
      $('bw-ask').addEventListener('click', e => { askClaude(); e.currentTarget.blur(); });
      $('bw-again').addEventListener('click', e => { start(false); e.currentTarget.blur(); });
      loadClips();
      (function tick() { try { readouts(); clipSnapTick(); } catch (e) {} requestAnimationFrame(tick); })();
    });
  }
  window.__lab = LAB;                                   // for automated checks
  LAB.api = { start, next, jump, current, summary, buildTests, clipTest };
  (async () => {
    try { LAB.db = (window.claude && window.claude.use) ? await window.claude.use('db') : null; } catch (e) { LAB.db = null; }
    if (LAB.db) {
      status('ratings save to the lab, Claude can read them');
      try { const snap = await LAB.db.collection('ratings').get(); const seen = {};
        for (const d of snap.docs) { const v = d.data(); if (!v || !v.test) continue; if (!seen[v.test] || seen[v.test] < v.at) { seen[v.test] = v.at; LAB.rated[v.test] = v.verdict === 'right' ? 'good' : 'bad'; } }
        if (LAB.active) render(); } catch (e) {}
      if (LAB.active) loadClips();
    } else status('ratings stay in this browser, use COPY RATINGS to send them');
  })();
  if (document.readyState === 'complete') boot(); else addEventListener('load', boot);
})();
