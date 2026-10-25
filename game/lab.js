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
  // ---- t-023 THE NET COMES ALIVE (NET_FX - Luca: "make a preview of this before you implement"; in every match since
  // t-025). Into an empty goal so nothing gets in the way: NT1 a soft shot, NT2 a power shot, NT3-5 a special at
  // LV1 / LV2 / LV3 (the Lab presses SPECIAL with the bars in the bank, at a fixed spot so every run looks the same).
  // Every line: how deep the net went, how long the ball rolled in it, ripped yes / no.
  function ntTest(id, name, sub, o) {
    return { id, group: 'NT', name, sub, kind: 'shot',
      setup(r) {
        const s = m.home.players[9], from = o.from, f = dirIndex(GX - from[0], o.y - from[1]), dv = dirVec(f);
        cast([s]); put(s, from[0] - dv.x * 0.5, from[1] - dv.y * 0.42, f); ballAt(from[0], from[1], 0, s);
        for (const mt of m.meters || []) mt.e = 0;
        m.nfxLast = null; m.netRip = null; m.netSaid = null; m.say('', `${id} · ${name.replace(/^an? /, '').toUpperCase()}`, 1.1);   // (names the clip in the preview GIF)
        Object.assign(r, { human: s, shooter: s, gk: null, o, marks: [{ x: GX, y: o.y, r: 0.3 }], cam: () => ({ x: GX + 2.5, y: 36 }) });   // (the camera stays on the goal: it's the net we're watching)
        r.action = { at: 0.7, fire: () => {
          if (!o.lv) { fireShot(r, { y: o.y, z: o.z }, o.speed, o.power); return; }
          m.meters[0].e = o.lv; m.special(s); const k = m.pending; if (k) { k.ty = o.y; k.vz = o.vz; }   // (its corner and lift pinned: the same shot every run)
        } };
      },
      check(r) {
        const b = m.ball, X = m.nfxLast;
        if (r.shotT == null) { if (!b.owner && r.fired && b.lastP === r.shooter && !m.pending) r.shotT = r.t; else return null; }
        if (!b.inNet) { if (r.out) return { o: 'MISSED · ' + r.out.toLowerCase() }; return r.t - r.shotT > 4 ? { o: 'NO GOAL · the ball is still loose' } : null; }
        if (r.goalT == null) r.goalT = r.t;
        const still = b.z < 0.15 && len(b.vx, b.vy) < 0.8, since = r.t - r.goalT;
        if (!X || since < 0.5 || (b.nfxRoll || (!still && since < 4.5))) return null;          // let the net play out: the roll, the drop, the flight behind
        const how = X.lv ? `LV${X.lv} SPECIAL` : r.o.speed > 25 ? 'POWER SHOT' : 'SOFT SHOT', behind = (b.x - GX).toFixed(1);
        return { o: `${how} ${kmh(X.v)} km/h · the net stretched ${Math.round(X.peak * 100)} cm (x${X.S.toFixed(1)}) · the ball rolled in it ${X.roll.toFixed(1)} s · ripped: ${X.rip ? `YES - it flew on, stopped ${behind} m behind the line` : 'no'}${m.netSaid ? ` · Rami: the ${m.netSaid} line` : ''}`, hold: 0.6 };
      } };
  }
  function ntTests() {
    return [
      ntTest('NT1', 'a SOFT shot into the net', '54 km/h side-foot: a small bulge, a short roll, it drops', { from: [96, 31], y: 34.6, z: 0.9, speed: 15, power: 0.3 }),
      ntTest('NT2', 'a POWER shot into the net', '112 km/h: a big bulge, the ball swirls in the netting ~1.5 s', { from: [88, 33], y: 35.2, z: 1.3, speed: 31, power: 0.95 }),
      ntTest('NT3', 'an LV1 special into the net', 'the net stretches far back (x2), the ball rolls round in it', { from: [86, 32], y: 35.4, vz: 3.2, lv: 1 }),
      ntTest('NT4', 'an LV2 special into the net', 'drastic: the net nearly reaches the boards, a long roll', { from: [86, 32], y: 35.4, vz: 2.8, lv: 2 }),
      ntTest('NT5', 'an LV3 special RIPS THROUGH the net', 'the mesh tears, the ball flies on to the boards; whole again at the restart', { from: [86, 32], y: 35.4, vz: 1.4, lv: 3 }),
      ntMatch(),
    ];
  }
  // t-025 NT6 (the net in every match): a goal in the real match flow - as CS5, __labCut plays the celebration and the TV
  // replay - from NT5's LV3 special, so the replay has to show the net stretching AND the hole. Then the real kick-off
  // (the Lab's own does nothing): the net must be whole again. Says: the goal counted once, the replay's frames that carry
  // the net / the hole (and that the replay drew it torn), the hole closed at the kick-off.
  function ntMatch() {
    return { id: 'NT6', group: 'NT', name: 'a MATCH goal and its REPLAY (LV3: the hole too)', sub: 'the real celebration + TV replay: the net moves in the replay and the hole is there; whole again at the kick-off', kind: 'cut',
      setup(r) {
        window.__labCut = true; cast(m.all.filter(p => !p.benched)); m.all.forEach(p => { put(p, p.home.x, p.home.y, p.team.side > 0 ? 0 : 4); });
        const s = m.home.players[9], gk = m.away.players[0], from = [86, 32], f = dirIndex(GX - from[0], 35.4 - from[1]), dv = dirVec(f);
        put(s, from[0] - dv.x * 0.5, from[1] - dv.y * 0.42, f); ballAt(from[0], from[1], 0, s); put(gk, LINE_X, 30.5, 4); gk.stun = 3;   // (the keeper beaten: it's the net we're watching)
        for (const mt of m.meters || []) mt.e = 0;
        m.nfxLast = null; m.netRip = null; m.netSaid = null; m.rec = []; m.recN = 0; m.lastReplayEnd = -1e9; m.lastReplay = null;
        Object.assign(r, { human: s, shooter: s, fired: false, marks: [], rp: { n: 0, net: 0, torn: 0 } });
        r.action = { at: 0.7, fire: () => { m.meters[0].e = 3; m.special(s); const k = m.pending; if (k) { k.ty = 35.4; k.vz = 1.4; } } };
        if (!LAB.netReplay0) { LAB.netReplay0 = m.netReplay; m.netReplay = function (nt) {                // (the replay doesn't step the Lab: count what it draws here)
          LAB.netReplay0.call(m, nt); const q = LAB.run; if (!q || !q.rp) return;
          q.rp.n++; if (nt) q.rp.net++; if (Object.values(m.nets || {}).some(n => (n.meshes || []).some(o => o.torn && o.mesh.visible))) q.rp.torn++; }; }
      },
      check(r) {
        const b = m.ball, X = m.nfxLast, goals = () => m.home.score + m.away.score;
        if (r.g == null) { if (b.inNet) r.g = goals(); else return r.t > 6 ? { o: 'NO GOAL' + (r.out ? ' · ' + r.out.toLowerCase() : '') } : null; }
        if (m.replay || m.goalQ || !m.lastReplay) return r.t > 60 ? { o: 'no goal replay after 60 s' } : null;
        if (!r.ko) { r.ko = true; r.g2 = goals(); r.hole = !!m.netRip; LAB.kickoff0(m.away); return null; }   // the replay is over: the real kick-off
        const F = m.lastReplay, nNet = F.filter(f => f.nt).length, nHole = F.filter(f => f.nt && f.nt.some((v, i) => i % 9 === 0 && v >= 2)).length;
        const whole = !m.netRip && !Object.values(m.nets || {}).some(n => (n.meshes || []).some(o => o.torn));
        return { o: `GOAL counted ${r.g2 === 1 ? 'once' : r.g2 + ' times'} · LV${X ? X.lv : '?'} ${X ? kmh(X.v) : '?'} km/h, stretched ${X ? Math.round(X.peak * 100) : '?'} cm, ripped: ${X && X.rip ? 'YES' : 'no'} · the replay: ${F.length} frames, the net moving in ${nNet}, the hole in ${nHole} (drawn torn in ${r.rp.torn} of ${r.rp.n} replay frames) · hole open until the kick-off: ${r.hole ? 'yes' : 'NO'}, whole after it: ${whole ? 'yes' : 'NO'}${m.netSaid ? ` · Rami: the ${m.netSaid} line` : ''}`, hold: 0.3 };
      } };
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
        K.out = Math.max(K.out || 0, GX - gk.x);                                 // t-027: how far off his line he came,
        if (K.eng == null && /^(CLOSE|BLOCK|SMOTHER)$/.test(gk.gkMode || '')) K.eng = len(GX - s.x, 34 - s.y);   // where the striker was when he started coming,
        if (K.met == null && len(gk.x - b.x, gk.y - b.y) < 2.5) K.met = GX - b.x;  // and where they met (m from his line)
        if (dS < 4 && gk.speed < 0.3 && gk.state !== 'dive') K.stillT += STEP;
        if (o.track && b.owner === s) { const g = m.gkBisector(b.x, b.y, GX, -1, 3), ux = g.x - b.x, uy = g.y - b.y, ul = len(ux, uy) || 1; const off = Math.abs(((gk.x - b.x) * uy - (gk.y - b.y) * ux) / ul);   // (how far he is off the line that halves the angle, wherever he stands on it)
          K.maxOff = Math.max(K.maxOff, off); K.offS += off; K.offN++; }
        const tail = () => `${o.track ? `off the angle: avg ${(K.offS / Math.max(1, K.offN)).toFixed(2)} m, max ${K.maxOff.toFixed(2)} m · ` : ''}${K.eng != null ? `came for him at ${K.eng.toFixed(0)} m · ` : ''}${K.met != null ? `met him ${K.met.toFixed(1)} m out · ` : ''}furthest out ${(K.out || 0).toFixed(1)} m · closest to the ball ${K.minD.toFixed(1)} m · stood still near him ${K.stillT.toFixed(1)} s · ${sum()}`;
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
      kpTest('KP7', 'a breakaway from 30 m at a sprint', 't-027: through on goal from the halfway side of the D at 6 m/s, round him at 3.5 m: he should come out and meet him near the edge of his box', { from: [75, 34], v: 6.0, cut: 3.5, side: 1, secs: 10 }),
      kpTest('KP8', 'a jog from 28 m, round him wide and early', 't-027: at 4.6 m/s, swinging round him from 5.5 m away: the run a player makes to beat a keeper who stays deep', { from: [77, 30], v: 4.6, cut: 5.5, side: -1, secs: 10 }),
      kpTest('KP6', 'dribbling across the edge of the box', 'the striker walks the ball side to side along the D (17 m): he must stay on the angle (the line that halves it), smoothly', { from: [88, 22], bot: across(), track: true, secs: 9 }),
    ];
  }
  // ======================================================================= t-016 KEEPER FACING + BLOCKED PATHS (Luca's Bug Watch marks,
  // 24 Oct: "if ball is close enough, the keeper should not give his back to the ball" and "If player path is blocked they
  // should find alternative paths to the ball or to be useful"). KF1-3: their keeper with the real AI; the line says the
  // biggest angle between the way he faces and the ball while it was within 6 m (loose or at an attacker's feet).
  // KF4-5: the real team AI; a lob drops ahead of our #6 with a man holding his spot in the straight line to it.
  const faceDev = (p, x, y) => { const f = dirVec(p.face), dx = x - p.x, dy = y - p.y, d = len(dx, dy) || 1; return Math.acos(clamp((f.x * dx + f.y * dy) / d, -1, 1)) * 180 / Math.PI; };
  function kfKeeper(id, name, sub, o) {
    const t = gkTest(id, name, sub, Object.assign({ secs: 6 }, o, { end: (r, sum) => {
      const gk = r.gk, b = m.ball, d = len(b.x - gk.x, b.y - gk.y), live = !b.owner || b.owner.team !== gk.team;
      if (live && !gk.busy() && d < 6 && d > 0.6 && b.owner !== gk)   // (0.6 m: at his feet a facing angle means nothing)
        { const a = faceDev(gk, b.x, b.y); r.kfMax = Math.max(r.kfMax || 0, a); r.kfNear = (r.kfNear || 0) + STEP; if (a > 100) r.kfBack = (r.kfBack || 0) + STEP; }
      r.kfTop = Math.max(r.kfTop || 0, gk.speed); if (d >= 6 && gk.speed > 3) r.kfFarAway = Math.max(r.kfFarAway || 0, faceDev(gk, b.x, b.y));
      const line = () => o.far ? `ball far: top ${r.kfTop.toFixed(1)} m/s, faced up to ${Math.round(r.kfFarAway || 0)}° off the ball as he ran · ${sum()}`
        : `faced the ball within ${Math.round(r.kfMax || 0)}° (${(r.kfNear || 0).toFixed(1)} s with it 0.6-6 m away; back to it ${(r.kfBack || 0).toFixed(1)} s) · ${sum()}`;
      if (b.owner === gk) return { o: 'GOT IT · ' + line(), hold: 1 };
      if (b.inNet) return { o: 'GOAL · ' + line(), hold: 1.2 };
      if (r.t > (o.secs || 6)) return { o: line() };
      return null; } }));
    t.group = 'KF'; return t;
  }
  function kfPath(id, name, sub, mate) {
    return { id, group: 'KF', name, sub, kind: 'path', realAi: true, demo: true,
      setup(r) {
        const H = m.home.players, A = m.away.players, man = H[6], from = H[9], blk = mate ? H[5] : A[6];
        cast([man, from, blk]);
        put(man, 48, 34, 0); put(from, 74, 34, 4); atFeet(from); put(blk, 49.8, 34, mate ? 0 : 4);
        r.bots.set(from, sit); r.bots.set(blk, runTo(49.8, 34, RUN));            // he holds his spot: the straight line is shut
        for (const t of [m.home, m.away]) Object.assign(t, { wing: null, wingBy: null, wingT: 0, presser: null, cover: null, marks: new Map(), support: null, supportPt: null, supT: 0,
          runner: null, runT: 0, roleT: 0, presserHeld: 0, fx: null, fy: null, poss: t === m.home ? 1 : 0, inPoss: t === m.home, airSpAt: null });
        LAB.demo0 = LAB.demo0 ?? m.demo; m.demo = true;
        Object.assign(r, { human: man, shooter: from, man, blk, marks: [{ x: 56, y: 34, r: 0.5 }], still: 0, off: 0, px: man.x, py: man.y });
        r.action = { at: 0.4, fire: () => m.kick(from, 56, 34, 0, 0, 0.12, { mode: 'lob', target: man, loft: true }) };
      },
      check(r) {
        const b = m.ball, p = r.man, mv = len(p.x - r.px, p.y - r.py) / STEP; r.px = p.x; r.py = p.y;
        if (!r.left) { if (r.fired && !b.owner) r.left = true; else return null; }   // (from the lob on)
        if (r.fired && !b.owner && b.target === p && len(b.x - p.x, b.y - p.y) > 1.5 && mv < 0.5 && !p.busy()) r.still += STEP;   // (a target in front of him, and he's not moving)
        if (p.x > 48.6 && p.x < 51.4) r.off = Math.max(r.off, Math.abs(p.y - 34));
        const line = got => `${got} · stood still ${r.still.toFixed(1)} s · stepped ${r.off.toFixed(1)} m to the side of the ${mate ? 'team-mate' : 'opponent'}`;
        if (b.owner === p || b.lastP === p) return { o: line(`#${p.num} GOT TO IT`), hold: 1 };
        if (b.owner && b.owner !== p) return { o: line(`#${b.owner.num} (${b.owner.team === p.team ? 'his side' : 'theirs'}) got it`), hold: 1 };
        if (r.t > 6) return { o: line('NEVER GOT THERE') };
        return null; } };
  }
  function kfTests() {
    const H = () => m.home.players, A = () => m.away.players;
    return [
      kfKeeper('KF1', 'a loose ball 4 m from him, he is 12 m out', 'their man is first to it, so he backs off to his spot - facing the ball the whole time, never his back to it', { gk: [93, 34],
        cast: () => [[H()[9], 88.6, 37.6, 0, () => chaseBall(103, 34, 3.4)]], ball: () => ballAt(90, 37, 0, null) }),   // (their man is first to it: he backs off)
      kfKeeper('KF2', 'an attacker dribbles at him from 6 m', 'he faces the ball as he backs off / sets / blocks', { gk: [96, 34],
        cast: () => [[H()[9], 90, 35, 0, () => dribbleTo(103, 34, 3.6)]], ball: () => atFeet(H()[9]), secs: 4 }),
      kfKeeper('KF3', 'ball far away (30 m), he is 17 m out', 'as before: he turns and runs back to his spot (facing where he runs is fine here)', { gk: [88, 34], far: true,
        cast: () => [[H()[7], 58, 34, 0, () => dribbleTo(66, 34, 2.0)], [A()[3], 75, 34, 4, sit]], ball: () => atFeet(H()[7]), secs: 5 }),
      kfPath('KF4', 'a team-mate stands in his straight line to the ball', 'a lob drops ahead of #6; #5 holds his spot right in the way: #6 steps round him (no standing still)', true),
      kfPath('KF5', 'an opponent stands in his straight line to the ball', 'the same with one of theirs in the way', false),
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
  // ======================================================================= t-031 KEEPER HANDS (Luca 25 Oct 15:41: "new physics for the
  // hands and animation to be able to dive with the hands to grab the ball, also be able to hold it in his hands while he
  // moves - keep it simple and smooth tho"). Each line says the moves he played, how far the drawn ball ever was from his
  // gloves' point on the frame shown (px; the first 0.1 s is the soft-hands ease, given apart) and the biggest jump of the
  // ball against his body from one frame to the next (a snap shows here). The catch is made to happen (u = 0).
  function ghTrack(r) {
    const gk = r.gk, b = m.ball, S = m.ballSpr;
    if (b.owner === gk && gk.hands) {
      if (r.heldT == null) { r.heldT = r.t; r.contact = gk.spr.frame && gk.spr.frame.name; }
      const nm = gk.carrying ? '(ball in the frame)' : (gk.spr.frame && gk.spr.frame.name || '').replace(/-\d+$/, '');
      if (!r.moves.includes(nm.replace(/-(E|W|N|S|NE|NW|SE|SW)$/, ''))) r.moves.push(nm.replace(/-(E|W|N|S|NE|NW|SE|SW)$/, ''));
      if (!gk.carrying && S.visible) {
        const G = gk.handPoint(); if (G) { const gap = len(S.x - G.x, S.y - G.y); if (gk.handEasing) r.easeMax = Math.max(r.easeMax || 0, gap); else r.gapMax = Math.max(r.gapMax || 0, gap); }
      }
      if (S.visible || gk.carrying) { const rel = gk.carrying ? null : { x: S.x - gk.spr.x, y: S.y - gk.spr.y };
        if (rel && r.prevRel) r.jumpMax = Math.max(r.jumpMax || 0, len(rel.x - r.prevRel.x, rel.y - r.prevRel.y));
        r.prevRel = rel; }
      else r.unseen = (r.unseen || 0) + 1;
    }
  }
  // (measured as he's drawn: the frame his sprite shows and where the ball is drawn, after render - the sprite's frame
  // moves on before the step, so a check in the step would compare this frame's gloves with the last frame's ball)
  function ghHook(r) { const R0 = m.render; m.render = function (dt) { R0.call(m, dt); if (LAB.run === r && !r.result) ghTrack(r); }; (LAB.undo = LAB.undo || []).push(() => { m.render = R0; }); }
  const ghLine = r => `${r.moves.join(' → ')} · from ${r.contact || '-'} · ball to gloves max ${(r.gapMax || 0).toFixed(1)} px (${(r.easeMax || 0).toFixed(1)} px easing in) · biggest step ${(r.jumpMax || 0).toFixed(1)} px/frame (ball against his body)${r.unseen ? ` · NOT DRAWN ${r.unseen} frames` : ''}`;
  function ghShot(id, name, sub, o) {
    return { id, group: 'GH', name, sub, kind: 'shot', o,
      setup(r) { shotSetup(r, o.spot, false); if (o.gkY != null) r.gk.y = o.gkY;
        Object.assign(r.gk, { guard: 1, gkS: null, gkMode: '', claiming: false, saveKind: '', leap: 0, gkN: null, rushT: 0 });
        const ty = o.tgt.y == null ? r.gk.y : r.gk.y + o.tgt.y; r.marks = [{ x: GX, y: ty, r: 0.3 }]; r.moves = [];
        if (o.mates) { const A = m.away.players; for (const [i, x, y] of o.mates) { const q = A[i]; q.sentOff = false; q.cool = 0; q.stun = 0; put(q, x, y, 4); } }
        r.action = { at: 0.6, fire: () => fireShot(r, { ...o.tgt, y: ty }, o.speed, o.power || 0.5) }; ghHook(r); },
      check(r) { const b = m.ball, gk = r.gk;
        if (r.shotT == null) { if (!b.owner && b.lastP === r.shooter && r.fired) r.shotT = r.t; else return null; }
        if (b.save && b.save.gk === gk && r.u0 == null) { r.u0 = b.save.u; b.save.u = o.u ?? 0; }   // (the dice: held here; GH6 not)
        return o.end(r); } };
  }
  // t-033: a GH shot the other way, at YOUR keeper (the left-hand goal, facing E): the computer's #9 shoots from 14 m out
  function ghOther(id, name, sub, o) {
    const T = ghShot(id, name, sub, o);
    T.setup = r => { const s = m.away.players[9], gk = m.home.players[0], me = m.home.players[5]; cast([s, gk, me]);
      const sx = 14, sy = 35, f = dirIndex(0 - sx, 34 - sy), dv = dirVec(f);
      put(s, sx - dv.x * 0.5, sy - dv.y * 0.42, f); ballAt(sx, sy, 0, s); put(gk, PITCH_L - LINE_X, 34 + (sy - 34) * 0.3, 0); put(me, 40, 20, 0);
      Object.assign(gk, { guard: 1, gkS: null, gkMode: '', claiming: false, saveKind: '', leap: 0, gkN: null, rushT: 0 });
      const ty = gk.y + o.tgt; Object.assign(r, { human: me, shooter: s, gk, you: false, marks: [{ x: 0, y: ty, r: 0.3 }], moves: [] });
      r.action = { at: 0.6, fire: () => { const b = m.ball, tx = -2, aty = b.y + (ty - b.y) * (tx - b.x) / (0 - b.x);
        m.kick(s, tx, aty, o.speed, 0.35, 0.13, { shot: true, power: 0.5 }); r.aim = { y: ty, z: 0 }; } };
      r.cam = () => ({ x: gk.x + 3, y: gk.y }); ghHook(r); };
    return T;
  }
  function ghTests() {
    const up = r => r.heldT != null && r.gk.state === 'idle' && r.t - r.heldT > 0.3;     // on his feet again, holding it
    const heldEnd = r => { if (up(r) && (r.upT = r.upT ?? r.t) && r.t - r.upT > 0.4) return { o: `HELD · ${ghLine(r)} · up ${(r.upT - r.heldT).toFixed(2)} s after the catch`, hold: 0.8 };
      if (m.ball.inNet) return { o: 'GOAL · ' + ghLine(r), hold: 1 }; if (r.heldT == null && r.t - r.shotT > 3) return { o: 'NOT HELD · ' + ghLine(r) }; return r.t - r.shotT > 6 ? { o: 'not up yet · ' + ghLine(r) } : null; };
    return [
      ghShot('GH1', 'a dive catch, low to his left', 'a low shot 2.4 m to his left: he dives, grabs it on the contact frame, lands and gets up with it at his chest', { spot: { n: '14 m', x: 91, y: 35 }, tgt: { y: 2.4, low: true }, speed: 19, end: heldEnd }),
      ghShot('GH2', 'a high leap and grab', 'a ball dropping just under the bar, straight at him: he goes up and snatches it, lands holding it', { spot: { n: '16 m', x: 89, y: 34 }, tgt: { y: 0.3, z: 2.15 }, speed: 20, end: heldEnd }),
      { id: 'GH3', group: 'GH', name: 'a smother he gathers', sub: 'a heavy touch in a 1v1: he goes down at the striker\'s feet, gathers it, gets up holding it (the gather made to happen)', kind: 'gk',
        setup(r) { const s = m.home.players[9], gk = m.away.players[0]; cast([s, gk]); put(gk, LINE_X - 4, 34, 4); put(s, 90, 35, 0); atFeet(s);
          Object.assign(gk, { guard: 1, gkS: null, gkMode: '', rushT: 0, smAt: 0 }); Object.assign(r, { gk, human: s, shooter: s, moves: [], fired: true });
          r.bots.set(s, (p, dt) => { const b = m.ball; if (b.owner === p && p.x > 93.5 && !r.knock) { r.knock = true; b.owner = null; b.vx = 7.5; b.vy = -0.4; p.cool = 0.4; } if (b.owner === p) dribbleTo(104, 34, 5)(p, dt); else if (!b.owner) p.moveTo(b.x, b.y, 4.6, dt); else p.steer(0, 0, dt); });
          r.cam = () => ({ x: gk.x - 3, y: gk.y }); ghHook(r); },
        check(r) { const gk = r.gk; if (gk.state === 'dive' && gk.saveKind === 'smother' && !r.forced) { r.forced = true; gk.smU = 0; }
          r.shotT = r.shotT ?? 0; const e = heldEnd(r); return e || (r.t > 7 ? { o: 'nothing · ' + ghLine(r) } : null); } },
      ghShot('GH4', 'the computer\'s keeper walks it out', 'a soft shot from 17 m, nobody near him: he holds it, walks it a few steps towards the edge of his box on his outlet\'s side, then plays it', { spot: SPOTS[1], tgt: { y: 0.3, low: true }, speed: 17, mates: [[2, 84, 18], [3, 86, 50], [6, 72, 30]],
        end: r => { const gk = r.gk, b = m.ball;
          if (r.heldT != null && r.from == null && !gk.busy()) { r.from = { x: gk.x, y: gk.y, t: r.t }; }
          if (r.from && gk.gkMode === 'WALK OUT') { r.walkT = (r.walkT || 0) + STEP; r.maxH = Math.max(r.maxH || 0, GX - gk.x); }
          if (r.heldT != null && !gk.hands && !r.rel) r.rel = { x: gk.x, y: gk.y, t: r.t, how: gk.kickAnim };
          if (r.rel && r.t - r.rel.t > 0.6) { const d = r.from ? len(r.rel.x - r.from.x, r.rel.y - r.from.y) : 0;
            return { o: `HELD · walked it out ${d.toFixed(1)} m in ${(r.walkT || 0).toFixed(1)} s (to ${(GX - r.rel.x).toFixed(1)} m off his line) · released ${(r.rel.t - r.heldT).toFixed(1)} s after the catch: ${(r.rel.how || '?').toUpperCase()} · ${r.moves.join(' → ')}` }; }
          if (r.heldT == null && r.t - r.shotT > 3) return { o: 'NOT HELD' };
          return r.t - r.shotT > 11 ? { o: `still holding it after ${(r.t - r.heldT).toFixed(1)} s` } : null; } }),
      { id: 'GH5', group: 'GH', name: 'you carry it to the edge of your box', sub: 'your keeper, the ball in his hands, the stick pushed upfield the whole time: he carries it, stops at the edge of the box and lets it go at 6 s', kind: 'move', you: true,
        setup(r) { const gk = m.home.players[0], d = m.away.players[9]; cast([gk, d]); put(gk, 4, 30, 0); put(d, 60, 34, 4);
          ballAt(gk.x + 0.25, gk.y, 1.1, gk); gk.hands = true; gk.hold = 0; gk.handFrom = null; Object.assign(r, { gk, human: gk, moves: [] });
          r.cam = () => ({ x: gk.x + 4, y: gk.y }); ghHook(r); },
        check(r) { const gk = r.gk, b = m.ball, T = Input.touch; T.x = 1; T.y = 0.15;
          if (gk.hands) r.maxH = Math.max(r.maxH || 0, gk.x);
          if (!gk.hands && !r.rel) { r.rel = { t: r.t, x: gk.x, how: gk.kickAnim }; }
          if (r.rel && r.t - r.rel.t > 0.6) { T.x = T.y = 0; return { o: `carried it ${(r.maxH - 4).toFixed(1)} m, furthest ${r.maxH.toFixed(1)} m off his line (box 16.5) · let go at ${r.rel.t.toFixed(1)} s: ${(r.rel.how || '?').toUpperCase()} · ${r.moves.join(' → ')} · biggest step ${(r.jumpMax || 0).toFixed(1)} px/frame` }; }
          return r.t > 9 ? (T.x = T.y = 0, { o: `still holding it at ${r.t.toFixed(1)} s` }) : null; } },
      ghShot('GH6', 'a parry', 'a hard low shot to his side he can\'t hold (made so): the ball leaves his gloves on the contact - no catch, no hold', { spot: SPOTS[1], tgt: { y: -2.3, low: true }, speed: 24, power: 0.8, u: 0.999,
        end: r => { const gk = r.gk, b = m.ball;
          if (!r.touchAt) { const e = ['PARRIED', 'ROUND THE POST', 'TIPPED OVER'].find(x => r.ev(x)); if (e) { r.touchAt = { t: r.t, e, fr: gk.spr.frame && gk.spr.frame.name, G: gk.handPoint(), S: { x: m.ballSpr.x, y: m.ballSpr.y } }; } }
          if (r.heldT != null) return { o: 'HELD (should not be) · ' + ghLine(r) };
          if (r.touchAt && r.t - r.touchAt.t > 0.25) { const A = r.touchAt, g = A.G ? len(A.S.x - A.G.x, A.S.y - A.G.y) : null;
            return { o: `${A.e} on ${A.fr} · the ball ${g != null ? g.toFixed(0) + ' px from his gloves' : '-'} at the touch, ${len(b.x - gk.x, b.y - gk.y).toFixed(1)} m away 0.25 s later at ${kmh(len(b.vx, b.vy))} km/h` }; }
          if (b.inNet) return { o: 'GOAL' }; return r.t - r.shotT > 3 ? { o: 'no touch' } : null; } }),
      // t-033 (Luca 25 Oct 17:52, GH1's dive "angled the wrong way"): the other keeper and the other side, so every way the
      // turned dive frames are drawn is seen once - GH1 their keeper (facing W) going down the screen, GH7 yours (facing E)
      // going down the screen (to his right), GH8 theirs going up it, high (to his right)
      ghOther('GH7', 'your keeper: a dive catch, low to his right', 'the computer shoots low 2.4 m to your keeper\'s right (towards the camera): he dives across, grabs it, lands and gets up with it - the other keeper, the mirrored frames', { tgt: 2.4, speed: 19, end: heldEnd }),
      ghShot('GH8', 'a high dive catch to his right', 'a shot at head height 2.4 m to his right (away from the camera): a sideways spring, body near-flat, grabs it and lands holding it', { spot: { n: '14 m', x: 91, y: 33 }, tgt: { y: -2.4, z: 1.4 }, speed: 17, end: heldEnd }),
    ];
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
  // (t-034: the battle only comes in the defending box now - LB6-LB8's drops moved ~4 m in so they stay battles.)
  const lbBot = (q, dt) => { if (m.lobAimMate(q, dt) || m.lobRun(q, dt)) return; const b = m.ball;   // a team-mate: the game's own receiving run
    if (!b.owner && b.target === q) { const pt = m.intercept(q, q.top(true, false), 0.12, 1.9); q.moveTo(pt.x, pt.y, q.top(true, false), dt); } else q.steer(0, 0, dt); };
  const lbMark = (man, side) => (d, dt) => { const b = m.ball;                    // a defender on him: goal side, a beat after he moves (as the game's marker)
    if (b.lob && !b.owner && (b.airT || 0) > LOB2.markDelay) d.moveTo(man.x + side * 0.6, man.y + 0.3, d.top(true, false), dt); else d.steer(0, 0, dt); };
  const lbWho = p => `${p.team === m.home ? 'your' : 'their'} #${p.num}`;
  // (t-019 LV6: a team-mate on a run - he keeps going until it's played, then the game's own receiving run)
  const lvRun = (vx, vy) => (q, dt) => { const b = m.ball; if (m.lobAimMate(q, dt) || m.lobRun(q, dt)) return;
    if (b.owner && b.owner.team === q.team && b.owner !== q) q.steer(vx, vy, dt); else lbBot(q, dt); };
  function lbTest(id, name, sub, o) {
    return { id, group: o.group || 'LB', name, sub, kind: 'lb', you: true, lvl: o.lvl,
      setup(r) {
        Object.assign(Input.touch, { x: 0, y: 0, btn: {} });
        LOB_AIM_MODE = o.lobAim || 'ring'; LOB_AIM.camOld = !!o.camOld; LOB_AIM.ringOld = !!o.ringOld;   // t-019: LB is the ring's group (its -A tests: AUTO); LV names its own
        const H = m.home.players, A = m.away.players, list = [];
        const K = o.cpu ? A[6] : H[6]; list.push(K);
        const mates = (o.mates || []).map(([i, x, y]) => { const q = (o.cpu ? A : H)[i]; list.push(q); return [q, x, y]; });
        const opps = (o.opps || []).map(([i, x, y]) => { const q = (o.cpu ? H : A)[i]; list.push(q); return [q, x, y]; });
        const gk = o.gk ? (o.cpu ? H[0] : A[0]) : null; if (gk) list.push(gk);
        cast(list);
        put(K, o.from[0], o.from[1], o.cpu ? 4 : 0); atFeet(K);
        for (const [q, x, y] of mates) { put(q, x, y, o.cpu ? 4 : 0); r.bots.set(q, o.run ? lvRun(o.run[0], o.run[1]) : lbBot); }
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
        if (o.tap) { if (o.drag) { T.x = o.drag[0]; T.y = o.drag[1]; } if (ht >= 0.08) { T.btn.lob = false; r.ph = 'gone'; r.tapT = ht; } }   // (t-019 LV3: a tap with the arrow held)
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
    // ---- t-019 LV5: the camera, every frame from the press: its biggest move in one frame, and the biggest change in that
    // move from one frame to the next (a jolt: the lead jumping at the kick, the ride up, the snap back from the aim)
    if (o.kind === 'cam' && r.ph && m.camX != null) { const c = { x: m.camX, y: m.camY };
      if (r.cam0) { const v = { x: c.x - r.cam0.x, y: c.y - r.cam0.y }, s = len(v.x, v.y); r.camMax = Math.max(r.camMax || 0, s);
        if (r.camV) r.camJolt = Math.max(r.camJolt || 0, len(v.x - r.camV.x, v.y - r.camV.y)); r.camV = v; }
      r.cam0 = c; }
    // ---- the kick and its flight
    if (r.kickT == null) { if (!b.owner && !m.pending && b.lastP === K && (r.ph === 'gone' || o.cpu)) { r.kickT = r.t; r.n0 = b.bounced || 0; r.start = { x: b.x, y: b.y }; r.aimed = m.lobAimLast && m.lobAimLast.by === K ? m.lobAimLast : null; r.tgt = b.target; r.lob = !!b.lob; }
      else return r.t > 7 ? done({ o: 'NO KICK' }) : null; }
    const ft = r.t - r.kickT; if (!r.land) r.maxZ = Math.max(r.maxZ, b.z);
    if (!r.land && !r.touch && (b.bounced || 0) > r.n0) r.land = { x: b.x, y: b.y, t: ft };
    if (!r.touch && b.lastP && b.lastP !== K) r.touch = { p: b.lastP, how: b.how ? b.how.kind : 'touch', z: b.z, own: b.owner === b.lastP, at: { x: b.x, y: b.y }, v: len(b.lastP.vx, b.lastP.vy), t: ft };
    if (!r.drop && r.tgt && !r.touch && b.vz < 0 && b.z < 2.6) r.drop = { d: len(r.tgt.x - b.x, r.tgt.y - b.y), x: b.x, y: b.y };   // (t-019: how far he was from it as it came down through head height)
    if (o.kind === 'pick' || o.kind === 'space' || o.kind === 'stride' || o.kind === 'cam') { const e = lvCheck(r, ft, done); if (e !== undefined) return e; }
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
      const head = `TAP (${f2(r.tapT || 0)} s): ${o.lobAim === 'auto' ? (r.aimed && r.aimed.auto ? 'AUTO: the quick lob' : 'OFF: not the AUTO lob') : r.aimed ? 'an AIMED lob (OFF: a tap should be the instant lob)' : 'the instant lob'} to ${r.tgt ? lbWho(r.tgt) : 'nobody'} · peak ${f2(r.maxZ)} m · `;
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
        { kind: 'battle', battle: true, mash: 1, from: [62, 40], mates: [[9, 93, 30]], opps: [[3, 94.2, 30.4]], mark: [0, 0], drag: [0, -1, 0.15], holdT: 1.1, gk: true }),
      lbTest('LB7', 'AERIAL BATTLE: you lose it (no mash)', 'the same drop; you don\'t press: their man wins and clears it - which way?',
        { kind: 'battle', battle: true, mash: 0, from: [62, 40], mates: [[9, 93, 30]], opps: [[3, 94.2, 30.4]], mark: [0, 0], drag: [0, -1, 0.15], holdT: 0.5, gk: true }),
      lbTest('LB8', 'AERIAL BATTLE the other way: their lob, your defender', 'the computer lobs to its striker, your defender is on him: PRESS! (the Lab mashes every other step)',
        { kind: 'battle', battle: true, cpu: true, mash: 2, from: [45, 30], mates: [[9, 12, 35]], opps: [[3, 15.2, 34.6]], gk: true, lvl: 'normal' }),
      // t-019: the same in AUTO (the arrow held at the man: no ring to walk)
      lbTest('LB4-A', 'AUTO · a quick TAP of LOB to a team-mate', 'the quick AUTO lob to the man ahead, landing a step ahead of him', { kind: 'tap', tap: true, from: [30, 34], mates: [[9, 52, 34]], lobAim: 'auto' }),
      lbTest('LB6-A', 'AUTO · AERIAL BATTLE: you win it', 'arrow at your striker, hold, let go: it drops on him and his marker - MASH!',
        { kind: 'battle', battle: true, mash: 1, from: [62, 40], mates: [[9, 89, 30]], opps: [[3, 90.2, 30.4]], mark: [0, 0], drag: [0.94, -0.35, 0.35], holdT: 0.4, gk: true, lobAim: 'auto' }),
      lbTest('LB7-A', 'AUTO · AERIAL BATTLE: you lose it (no mash)', 'the same, no presses: their man wins and clears it',
        { kind: 'battle', battle: true, mash: 0, from: [62, 40], mates: [[9, 89, 30]], opps: [[3, 90.2, 30.4]], mark: [0, 0], drag: [0.94, -0.35, 0.35], holdT: 0.4, gk: true, lobAim: 'auto' }),
    ];
  }
  // ======================================================================= t-019 LOB AIM: TWO VERSIONS (Luca 25 Oct 06:56: "make 2
  // versions - 1 [...] a lob target is determined by the direction of where the arrow is pointing [...] second version is
  // still the circle on the ground but no arc [...] make it so the camera doesnt follow - try make it smooth"). LV1-LV3
  // AUTO's pick (the right man, the free man, into space by the hold), LV4 the RING's movement against t-008's, LV5 the
  // camera through a 40 m lob before / after in both versions, LV6 the receiver taking it in stride in both.
  function lvCheck(r, ft, done) {
    const b = m.ball, o = r.o, f1 = v => v.toFixed(1), f2 = v => v.toFixed(2), H = m.home.players;
    if (r.kickT == null) return undefined;
    const came = r.touch || (r.land && ft > r.land.t + 0.4);
    if (o.kind === 'pick') {
      if (!came && ft < 6) return null;
      const want = H[o.want], got = r.tgt, P = r.touch ? r.touch.at : r.land;
      return done({ o: `arrow at ${lbWho(want)}: went to ${got ? lbWho(got) : 'nobody'} (${got === want ? 'ok' : 'OFF'}) · ${r.aimed ? `aimed ${f1(len(r.aimed.x - r.start.x, r.aimed.y - r.start.y))} m, peak ${f2(r.maxZ)} m` : 'NOT AN AUTO LOB'} · he was ${r.drop ? f2(r.drop.d) : '?'} m from it as it came down to head height${r.touch ? ` · ${lbWho(r.touch.p)}: ${r.touch.how === 'header' ? 'HEADER' : r.touch.how === 'volley' ? 'VOLLEY' : r.touch.own ? (r.touch.z > 0.9 ? 'CHEST' : 'FEET') : r.touch.how.toUpperCase()} at ${f1(r.touch.z)} m` : P ? ' · nobody met it' : ''}`, hold: 0.6 });
    }
    if (o.kind === 'space') {
      if (!r.land && ft < 6) return null;
      const L = r.aimed, d = r.land ? len(r.land.x - r.start.x, r.land.y - r.start.y) : 0, k = clamp(((r.tapT ?? r.holdT ?? 0) - LOB2.tapT) / LOB_AIM.holdT, 0, 1), want = LOB_AIM.spaceMin + (LOB_AIM.spaceMax - LOB_AIM.spaceMin) * k;
      return done({ o: `nobody in the cone · held ${f2(r.tapT ?? r.holdT ?? 0)} s → into space ${f1(d)} m along the arrow (want ~${f1(want)} m: ${Math.abs(d - want) < 2.5 ? 'ok' : 'OFF'}) · peak ${f2(r.maxZ)} m${L && L.q ? ` · for ${lbWho(L.q)} to chase` : ''}`, hold: 0.6 });
    }
    if (o.kind === 'stride') {
      if (!r.touch && ft < 6) return null;
      const T = r.touch; if (!T) return done({ o: `${r.tgt ? lbWho(r.tgt) : 'nobody'} never got to it · he was ${r.drop ? f2(r.drop.d) : '?'} m from it at head height` });
      const how = T.how === 'header' ? 'HEADER' : T.how === 'volley' ? 'VOLLEY' : T.own ? (T.z > 0.9 ? 'CHEST' : 'FEET') : T.how.toUpperCase();
      return done({ o: `to ${r.tgt ? lbWho(r.tgt) : 'nobody'} · ${lbWho(T.p)} met it at ${f1(T.z)} m: ${how}, moving at ${f1(T.v)} m/s (${T.v > 1.5 ? 'in stride' : 'standing still'}) · ${f2(r.drop ? r.drop.d : 0)} m from it at head height`, hold: 0.8 });
    }
    if (o.kind === 'cam') {
      if (!(came && (r.touch ? ft > 1.2 + (r.touch.t ?? 0) : ft > r.land.t + 1.2)) && ft < 6) return null;
      return done({ o: `${LOB_AIM.camOld ? 'BEFORE (the old camera' + (LOB_AIM.ringOld ? ' + t-008 ring' : '') + ')' : 'AFTER'} · ${f1(len(r.aimed ? r.aimed.x - r.start.x : 0, r.aimed ? r.aimed.y - r.start.y : 0))} m lob · camera's biggest move in one frame ${f1(r.camMax || 0)} px · biggest jolt (change in that move, frame to frame) ${f1(r.camJolt || 0)} px`, hold: 0.4 });
    }
    return undefined;
  }
  // LV4: the RING walked 10 m left then 5 m up by the stick; let go 0.15 s after it gets there (a human's reaction):
  // how far past it ends (overshoot), its top speed and the biggest change in its speed in one frame (the jumpiness)
  function lvWalk(r) {
    const T = Input.touch, A = m.lobAim, f2 = v => v.toFixed(2);
    const done = res => { Object.assign(T, { x: 0, y: 0, btn: {} }); return res; };
    if (r.ph == null) { if (r.t >= 0.5) { r.ph = 'hold'; T.btn.lob = true; r.legs = [{ ax: [-1, 0], d: 10 }, { ax: [0, -1], d: 5 }]; r.leg = 0; r.top = 0; r.jerk = 0; } return null; }
    if (!A) return done({ o: 'NO RING' });
    const pos = { x: A.x, y: A.y }; if (r.prev) { const v = { x: (pos.x - r.prev.x) * 60, y: (pos.y - r.prev.y) * 60 }; r.top = Math.max(r.top, len(v.x, v.y)); if (r.pv) r.jerk = Math.max(r.jerk, len(v.x - r.pv.x, v.y - r.pv.y)); r.pv = v; } r.prev = pos;
    const L = r.legs[r.leg]; if (!L.from) L.from = { ...pos };
    const along = (pos.x - L.from.x) * L.ax[0] + (pos.y - L.from.y) * L.ax[1];
    if (L.at == null) { if (along >= L.d) L.at = r.t; T.x = L.ax[0]; T.y = L.ax[1]; }
    else if (r.t < L.at + 0.15) { T.x = L.ax[0]; T.y = L.ax[1]; }
    else { T.x = T.y = 0; if (r.t > L.at + 0.75) { L.over = along - L.d; r.leg++; if (r.leg >= r.legs.length) {
      const [a, c] = r.legs; return done({ o: `${LOB_AIM.ringOld ? 't-008 ring' : 'RING now'} · overshoot ${f2(a.over)} m (10 m left), ${f2(c.over)} m (5 m up) · top speed ${r.top.toFixed(1)} m/s · biggest change of speed in one frame ${r.jerk.toFixed(1)} m/s` }); } } }
    return r.t > 9 ? done({ o: 'NOT FINISHED' }) : null;
  }
  function lvTests() {
    const A = (id, name, sub, o) => lbTest(id, name, sub, Object.assign({ group: 'LV', lobAim: 'auto' }, o));
    const n = (x, y) => { const l = Math.hypot(x, y); return [x / l, y / l]; };
    const three = [[9, 70, 34], [7, 62, 14], [10, 62, 54]];
    return [
      A('LV1', 'AUTO · arrow at the top one of three', 'three team-mates 0° and ±42° from you: point at one, hold, let go - he gets it', { kind: 'pick', from: [40, 34], mates: three, want: 7, drag: [...n(22, -20), 0.39], holdT: 0.4 }),
      A('LV1-S', 'AUTO · arrow straight at the middle one', 'the same three: the one ahead', { kind: 'pick', from: [40, 34], mates: three, want: 9, drag: [1, 0, 0.39], holdT: 0.4 }),
      A('LV1-B', 'AUTO · arrow at the bottom one', 'the same three: the bottom one', { kind: 'pick', from: [40, 34], mates: three, want: 10, drag: [...n(22, 20), 0.39], holdT: 0.4 }),
      A('LV2', 'AUTO · two in the cone, the nearer one marked', 'a defender on the nearer man: the free one further on gets it', { kind: 'pick', from: [40, 34], mates: [[9, 60, 34], [10, 72, 37]], opps: [[3, 61, 34.6]], want: 10, drag: [1, 0, 0.39], holdT: 0.4 }),
      A('LV2-F', 'AUTO · two in the cone, both free', 'nobody marked: the nearer one', { kind: 'pick', from: [40, 34], mates: [[9, 60, 34], [10, 72, 37]], want: 9, drag: [1, 0, 0.39], holdT: 0.4 }),
      A('LV3-T', 'AUTO · nobody in the cone, a tap', 'into space along the arrow: the short one', { kind: 'space', tap: true, from: [40, 16], mates: [[9, 70, 34]], drag: [0, 1, 0.08] }),
      A('LV3', 'AUTO · nobody in the cone, held half way', 'into space: further', { kind: 'space', from: [40, 16], mates: [[9, 70, 34]], drag: [0, 1, 0.52], holdT: 0.53 }),
      A('LV3-F', 'AUTO · nobody in the cone, held all the way', 'into space: the longest', { kind: 'space', from: [40, 16], mates: [[9, 70, 34]], drag: [0, 1, 1.0], holdT: 1.0 }),
      Object.assign(lbTest('LV4', 'RING · walk it 10 m left, then 5 m up', 'how steady: let go 0.15 s after it gets there - how far past?', { group: 'LV', from: [50, 34], lobAim: 'ring' }), { check: lvWalk }),
      Object.assign(lbTest('LV4-T8', 'RING · the same with t-008\'s ring (before)', 'the old speed, ease and magnet, for comparison', { group: 'LV', from: [50, 34], lobAim: 'ring', ringOld: true }), { check: lvWalk }),
      A('LV5-A0', 'AUTO · camera through a 40 m lob: BEFORE', 'the old camera: it rode up with the lob', { kind: 'cam', from: [30, 34], mates: [[9, 70, 34]], drag: [1, 0, 0.39], holdT: 0.4, camOld: true }),
      A('LV5-A', 'AUTO · camera through a 40 m lob: AFTER', 'no ride up, the lead eases', { kind: 'cam', from: [30, 34], mates: [[9, 70, 34]], drag: [1, 0, 0.39], holdT: 0.4 }),
      A('LV5-R0', 'RING · camera through a 40 m lob: BEFORE', 't-008: the aim framing snaps back, then it rides up', { kind: 'cam', from: [30, 34], aimD: 40, ax: [1, 0], lobAim: 'ring', camOld: true, ringOld: true }),
      A('LV5-R', 'RING · camera through a 40 m lob: AFTER', 'the aim framing hands over, no ride up', { kind: 'cam', from: [30, 34], aimD: 40, ax: [1, 0], lobAim: 'ring' }),
      A('LV6', 'AUTO · to a man on the run', 'he\'s running in behind: it lands ahead of him, he takes it in stride', { kind: 'stride', from: [55, 40], mates: [[9, 66, 30]], run: [4.5, 0], drag: [...n(14, -10), 0.29], holdT: 0.3, gk: true }),
      A('LV6-R', 'RING · the ring on a man on the run', 'the ring settles on him (light magnet), he takes it in stride', { kind: 'stride', from: [55, 40], mates: [[9, 66, 30]], run: [4.5, 0], holdT: 0.6, gk: true, lobAim: 'ring' }),
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
  // ======================================================================= t-020 ARCADE GETS INTENSE (Luca 25 Oct: "more rebounds that
  // lead into aerials, more energy sp, make the game feel incredibly intense"). Every AR test plays ARCADE (pace: 'arcade').
  // AR1-2 a loose ball driven at a line: what comes back (speed, height, where); AR3 the real team AI attacking a rebound
  // in the air; AR4 the SP meter's fill per minute, CLASSIC v ARCADE; AR5 a goal -> the kick-off, ARCADE v CLASSIC.
  function arBall(x, y, z, vx, vy, vz, by) {                                     // a loose ball on its way, last touched by `by`
    ballAt(x, y, z); Object.assign(m.ball, { vx, vy, vz, skid: true, rollV: 0.8 * len(vx, vy), last: by.team, lastP: by, reb: null, lob: false, ring: null, how: { kind: 'pass', x, y } });
  }
  function arLine(id, name, sub, o) {
    return { id, group: 'AR', name, sub, kind: 'phys', pace: o.pace || 'arcade',
      setup(r) {
        const k = m.home.players[6], gk = m.away.players[0]; cast(o.noGk ? [k] : [k, gk]); put(k, o.from[0] - 3, o.from[1], 0); put(gk, LINE_X, 34, 4);
        arBall(o.from[0], o.from[1], o.z || 0, o.v[0], o.v[1], o.v[2] || 0, k);
        Object.assign(r, { human: k, gk, marks: [], o, maxZ: 0, prev: null });
      },
      check(r) {
        const b = m.ball, f1 = v => v.toFixed(1);
        if (!r.hit) {
          if (b.inNet) return { o: 'GOAL · the goal mouth is open (no board there)', hold: 1 };
          if (r.out) return { o: `OUT · ${r.out.toLowerCase()}${o.pace === 'classic' ? ' (CLASSIC: the ball goes out)' : ' (ARCADE too since t-026: no touchline boards)'}` };
          if (b.reb && b.reb.t != null) { const p = r.prev || { vx: b.vx, vy: b.vy, vz: b.vz }, into = b.reb.hit === 'T' ? Math.abs(p.vy) : Math.abs(p.vx);
            r.hit = { side: b.reb.hit, t: r.t, x: b.x, y: b.y, vin: len(p.vx, p.vy), into, vout: len(b.vx, b.vy), vz: b.vz, apex: b.reb.apex, aimed: b.reb.q }; r.maxZ = b.z; }
          r.prev = { vx: b.vx, vy: b.vy, vz: b.vz };
          return r.t > 4 ? { o: 'it never reached the line' } : null;
        }
        r.maxZ = Math.max(r.maxZ, b.z);
        const H = r.hit, dt = r.t - H.t;
        if (dt < 1.5 && !(b.owner)) return null;
        const into = H.side === 'T' ? Math.min(b.y, PITCH_W - b.y) : Math.min(b.x, PITCH_L - b.x);
        return { o: `${H.side === 'T' ? 'TOUCHLINE' : 'BYLINE'} BOARD · in at ${kmh(H.vin)} km/h (${kmh(H.into)} into it) → back at ${kmh(H.vout)} km/h, `
          + `popped ${f1(r.maxZ)} m up (${f1(H.vz)} m/s) · ${f1(into)} m back into the pitch 1.5 s later${H.aimed ? ` · a high ball: aimed at #${H.aimed.num}, landing ring on` : ''}`, hold: 0.8 };
      } };
  }
  // AR3: the REAL team AI on both sides (as WG): a loose ball runs at a line near their box, pops up off the board, and
  // the men there go for it in the air. The line says who met it, how (header / volley / duel / AERIAL BATTLE / chest)
  // and at what height.
  function arAir(id, name, sub, o) {
    return { id, group: 'AR', name, sub, kind: 'wing', realAi: true, demo: true, pace: 'arcade',
      setup(r) {
        const H = m.home.players, A = m.away.players, k = H[7];
        const men = [k, H[9], H[10], H[8], A[0], A[2], A[3], A[4], A[7]]; cast(men);
        put(k, o.from[0] - 2, o.from[1], 0); for (const [p, x, y] of [[H[9], ...o.h9], [H[10], ...o.h10], [H[8], ...o.h8], [A[3], ...o.a3], [A[4], ...o.a4], [A[2], ...o.a2], [A[7], ...o.a7]]) put(p, x, y, 4);
        put(A[0], LINE_X, 34, 4); Object.assign(A[0], { guard: 1, gkS: null, gkMode: '', rushT: 0, claiming: false });
        for (const t of [m.home, m.away]) Object.assign(t, { wing: null, wingBy: null, wingT: 0, presser: null, cover: null, marks: new Map(), support: null, supportPt: null, supT: 0,
          runner: null, runT: 0, roleT: 0, presserHeld: 0, fx: null, fy: null, poss: t === m.home ? 1 : 0, inPoss: t === m.home, airSpAt: null, rebFor: null, rebMan: null });
        if (o.sp) m.meters[0].e = o.sp;
        LAB.demo0 = LAB.demo0 ?? m.demo; m.demo = true; m.aerialAt = -1e9; m.duelAt = -1e9;
        arBall(o.from[0], o.from[1], 0.1, o.v[0], o.v[1], o.v[2] || 0.5, k);
        Object.assign(r, { human: H[9], gk: A[0], k, marks: [], o });
      },
      check(r) {
        const b = m.ball, Hm = m.home, who = p => `${p.team === Hm ? 'our' : 'their'} #${p.num}`;
        if (!r.hit) {
          if (b.reb && b.reb.t != null) { r.hit = { t: r.t, side: b.reb.hit, apex: b.reb.apex, q: b.reb.q, men: [] }; r.how0 = b.how; }
          else return r.out ? { o: `OUT · ${r.out.toLowerCase()}` } : r.t > 4 ? { o: 'it never reached the line' } : null;
        }
        const H = r.hit;
        for (const t of [Hm, Hm.opp]) if (t.rebFor === b.reb && t.rebMan && !H.men.includes(t.rebMan)) H.men.push(t.rebMan);   // (each side's man for it, picked by the AI)
        if (!r.met) {
          if (m.aerial && !r.battle) r.battle = m.aerial.kind === 'ground' ? 'MASH DUEL' : 'AERIAL BATTLE';
          if (m.pending && m.pending.info.special && m.pending.p !== b.lastP) r.met = { p: m.pending.p, how: 'AERIAL SPECIAL', z: b.z };
          else if (b.how !== r.how0 && b.lastP) { const k = b.how.kind; r.met = { p: b.lastP, how: k === 'header' ? 'HEADER' : k === 'dheader' ? 'DIVING HEADER' : k === 'volley' ? 'VOLLEY' : k === 'bicycle' ? 'OVERHEAD' : k.toUpperCase(), z: b.z }; }
          else if (b.owner && b.owner !== r.k) r.met = { p: b.owner, how: b.owner.keeper ? 'keeper takes it' : b.z > 0.6 ? 'CHEST / THIGH, his ball' : 'controlled', z: b.z };
          if (r.met) r.metT = r.t;
        }
        const head = `${H.side === 'T' ? 'TOUCHLINE' : 'BYLINE'} REBOUND up to ${H.apex.toFixed(1)} m${H.q ? ` (aimed at ${who(H.q)})` : ''} · going for it: ${[H.q, ...H.men].filter(Boolean).map(who).join(', ') || 'nobody'} · `;
        const met = r.met ? `${r.battle ? r.battle + ' → ' : ''}${who(r.met.p)} ${r.met.how} at ${r.met.z.toFixed(1)} m after ${(r.metT - H.t).toFixed(1)} s` : '';
        if (b.inNet) return { o: head + met + ' → GOAL', hold: 1.4 };
        if (r.ev('SAVED') || r.ev('PARRIED')) return { o: head + met + ' → SAVED', hold: 1 };
        if (r.met && r.t - r.metT > 1.2) return { o: head + met + (b.owner ? ` → ${who(b.owner)} has it` : ' → loose'), hold: 0.6 };
        if (r.t - H.t > 5) return { o: head + (met || 'nobody got to it in the air') };
        return null;
      } };
  }
  // AR4: the meter's own add(), one minute of play each way (the Lab normally keeps the meters still: the gate is lifted
  // for this one calculation), then the ARCADE extras for the big moments
  function arSp() {
    return { id: 'AR4', group: 'AR', name: 'SP meter: fill per minute, CLASSIC → ARCADE', sub: 'the meter\'s own fill over 60 s of play each way, then the ARCADE extras for an aerial won / a rebound volley / a special save', kind: 'phys', pace: 'arcade',
      setup(r) { cast([m.home.players[9]]); Object.assign(r, { human: m.home.players[9], marks: [] }); ballAt(52.5, 34); },
      check(r) {
        if (r.t < 0.2) return null;
        const mt = m.meters[0], L = window.__lab, PM = PACE_MODE, D = m.demo, out = {};
        try {
          window.__lab = null; m.demo = true;
          for (const pace of ['classic', 'arcade']) { PACE_MODE = pace; mt.e = 0; for (let i = 0; i < 3600; i++) mt.add(SP_GAIN.regen * STEP, 'regen'); out[pace] = mt.e; }
          PACE_MODE = 'arcade'; for (const k of ['aerial', 'rebound', 'save']) { mt.e = 0; m.spBonus(m.home, k); out[k] = mt.e; }
        } finally { window.__lab = L; PACE_MODE = PM; m.demo = D; mt.e = 0; }
        const f2 = v => v.toFixed(2), every = v => Math.round(60 / v);
        return { o: `CLASSIC ${f2(out.classic)} bars a minute (a bar every ${every(out.classic)} s) → ARCADE ${f2(out.arcade)} (every ${every(out.arcade)} s, x${(out.arcade / out.classic).toFixed(2)}) · ARCADE extras: aerial battle won +${f2(out.aerial)}, header / volley off a rebound +${f2(out.rebound)}, special save +${f2(out.save)}`, hold: 1 };
      } };
  }
  // AR5: a goal with the real celebration + replay (as CS5), timed from the ball crossing the line to the kick-off being
  // taken (the replay counted in full, nobody skips it; then the kick-off freeze)
  function arGoal(id, pace) {
    return { id, group: 'AR', name: `a goal → the kick-off · ${pace.toUpperCase()}`, sub: 'celebration, the goal replay (watched in full), the kick-off freeze: how long until play is on again', kind: 'cut', pace,
      setup(r) {
        window.__labCut = true; cast(m.all.filter(p => !p.benched)); m.all.forEach(p => { put(p, p.home.x, p.home.y, p.team.side > 0 ? 0 : 4); });
        const s = m.home.players[9], gk = m.away.players[0]; put(s, 93.5, 34, 0); atFeet(s); put(gk, LINE_X, 30.5, 4); gk.stun = 1.5;
        Object.assign(r, { human: s, fired: false, marks: [] });
        r.action = { at: 0.4, fire: () => m.kick(s, GX + 2, 36.2, 24, 0.35, 0.12, { shot: true, power: 0.6 }) };
        m.rec = []; m.recN = 0; m.lastReplayEnd = -1e9; m.lastReplay = null;
        if (!LAB.afterGoal0) { LAB.afterGoal0 = m.afterGoal; m.afterGoal = function (c) { const q = LAB.run; if (q) q.koAt = m.time.now; return LAB.afterGoal0.call(m, c); }; }   // (the Lab's kickoff does nothing: this is when the game would take it)
      },
      check(r) {
        const b = m.ball;
        if (r.goalAt == null) { if (b.inNet) { r.goalAt = m.time.now; r.replayAt = null; } return r.t > 4 ? { o: 'NO GOAL' } : null; }
        if (r.replayAt == null && m.replay) r.replayAt = m.time.now;
        if (r.koAt == null) return (m.time.now - r.goalAt) > 30000 ? { o: 'no kick-off after 30 s' } : null;
        const P = PACE[r.sc.pace], s = v => (v / 1000).toFixed(1), tot = (r.koAt - r.goalAt) / 1000 + P.koFreeze;
        return { o: `${r.sc.pace.toUpperCase()} · play on again ${tot.toFixed(1)} s after the goal: celebration ${s(P.goalWaitMs)} s, replay ${s(r.koAt - r.goalAt - P.goalWaitMs)} s (skippable ${P.skipAfter < 0 ? 'at once' : `after ${P.skipAfter} s`}), kick-off freeze ${P.koFreeze} s`, hold: 0.3 };
      } };
  }
  function arTests() {
    return [
      arLine('AR1', 'a hard drive at the TOUCHLINE', 'a loose ball at 72 km/h, 60° into the line: a throw-in, on ARCADE too since t-026 (Luca 25 Oct: no touchline boards)', { from: [56, 61], v: [10, 17.3] }),
      arLine('AR1-S', 'a firm pass rolling at the touchline', 'a ground pass at 36 km/h, square on: a throw-in (t-026: no touchline boards)', { from: [40, 63], v: [2, 10] }),
      arLine('AR1-C', 'the same drive, CLASSIC', 'CLASSIC is untouched: the ball goes out for a throw-in', { from: [56, 61], v: [10, 17.3], pace: 'classic' }),
      arLine('AR2', 'at the BYLINE beside the goal', 'a ball at 65 km/h runs past the post (outside the goal mouth): back off the board in front of goal (CLASSIC: goal kick / corner)', { from: [95, 22], v: [17, 3.5] }),
      arLine('AR2-G', 'into the goal mouth: still a goal', 'the board stops at the posts: a shot inside them goes in', { from: [88, 33], v: [24, 0.3], z: 0.3, noGk: true }),
      arAir('AR3', 'a rebound attacked in the air (touchline, by their box)', 'the real team AI: a ball driven at the touchline beside their box - since t-026 a throw-in (AR3-B / AR3-SP have the byline rebounds)',
        { from: [88, 61], v: [11, 19, 1.2], h9: [93, 57], h10: [90, 45], h8: [86, 52], a3: [97, 52], a4: [95, 59], a2: [99, 40], a7: [89, 55] }),
      arAir('AR3-B', 'a rebound off the BYLINE beside the goal', 'driven past the post: it comes back off the board into the six-yard area', { from: [93, 21], v: [18, 3, 0.8], h9: [99, 32], h10: [96, 38], h8: [97, 27], a3: [102, 33], a4: [98, 36], a2: [101, 30], a7: [93, 34] }),
      arAir('AR3-SP', 'the AR3-B rebound with 2 bars banked', 'near goal the man who wins it may spend them on an aerial special', Object.assign({ sp: 2 }, { from: [93, 21], v: [18, 3, 0.8], h9: [99, 32], h10: [96, 38], h8: [97, 27], a3: [102, 33], a4: [98, 36], a2: [101, 30], a7: [93, 34] })),
      arSp(),
      arGoal('AR5', 'arcade'), arGoal('AR5-C', 'classic'),
    ];
  }
  // ======================================================================= t-024 OFFSIDE (Luca 25 Oct 07:14: "OFF SIDE rule MANDATORY
  // just make it smooth"). You attack the right-hand goal; their back line stands on x = 85 unless a test says otherwise.
  // OF1-OF5 and OF7: Lab bots (the passer plays it at 0.6 s, the receiver runs onto it). OF6: the real team AI on both sides.
  // Each line says who was in an offside position as it was played, and what the assistant did.
  const ofWho = p => `#${p.num}`;
  function ofTest(id, name, sub, o) {
    return { id, group: 'OF', name, sub, kind: 'offside',
      setup(r) {
        const H = m.home.players, A = m.away.players, pa = H[o.passer || 6], st = H[9], mate = H[7], gk = A[0], d1 = A[2], d2 = A[3];
        cast([pa, st, gk, d1, d2, ...(o.mate ? [mate] : [])]);
        put(pa, ...o.from, 0); put(st, ...o.st, 0); if (o.mate) put(mate, ...o.mate, 0);
        put(d1, o.line ?? 85, o.d1y ?? 30, 4); put(d2, o.line ?? 85, o.d2y ?? 40, 4); put(gk, LINE_X, 34, 4);
        Object.assign(gk, { guard: 1, gkS: null, gkMode: '', rushT: 0, claiming: false });
        const to = o.to === 'mate' ? mate : st; faceTo(pa, to.x, to.y); atFeet(pa);
        if (o.set) { m.setPiece = { kind: o.set, team: m.home, taker: pa, t: 5, kicked: true }; m.ball.last = m.home; }
        Object.assign(r, { human: pa, passer: pa, gk, st, to, marks: [{ x: o.line ?? 85, y: 34, r: 0.4 }], o });
        r.bots.set(st, receive); if (o.mate) r.bots.set(mate, receive);
        r.action = { at: 0.6, fire: () => { const b = m.ball, dx = to.x - pa.x, dy = to.y - pa.y, d = len(dx, dy) || 1;
          if (o.set === 'THROW-IN') m.kick(pa, to.x, to.y, 0, 0, 0.18, { mode: 'lob', target: to });
          else m.doPass(pa, { x: dx / d, y: dy / d }, o.mode || 'through', to); } };
      },
      check(r) {
        const b = m.ball, L = m.offLast;
        if (!r.kicked) { if (r.fired && !m.pending && !b.owner && b.lastP === r.passer) { r.kicked = true; const S = m.offSide;
            r.snap = S ? [...S.men.keys()].map(q => `${ofWho(q)} ${(m.aiFrame(m.home, S.men.get(q).x) - S.line).toFixed(1)} m past`).join(', ') : 'nobody'; }
          else return r.t > 4 ? { o: 'NO PASS' } : null; }
        if (L) return { o: `OFFSIDE! called on ${ofWho(L.p)} (${L.past.toFixed(1)} m past the line as it was played) · free kick ${L.team.opp.name} at ${L.x.toFixed(1)}, ${L.y.toFixed(1)}${r.out === 'FREE KICK' ? '' : ' (no free kick?)'}`, hold: 1.4 };
        const tail = ` · offside as it was played: ${r.snap}`;
        if (b.owner && b.owner.team === m.home && b.owner !== r.passer) return { o: `PLAY ON · ${ofWho(b.owner)} has it${tail}`, hold: 0.6 };
        if (b.owner && b.owner.team !== m.home) return { o: `PLAY ON · their ${b.owner.keeper ? 'keeper' : 'defender'} has it${tail}` };
        if (r.out) return { o: `OUT · ${r.out.toLowerCase()}${tail}` };
        return r.t > 7 ? { o: `NOTHING · ball loose${tail}` } : null;
      } };
  }
  // OF6: the real team AI. Your striker (#9) starts 3 m past their line; he should step back onside, wait on the shoulder of
  // the last defender and go when the pass is played. Every pass the line logs where both strikers stood against the line
  function ofRunTest(id) {
    return { id, group: 'OF', name: 'the computer\'s striker times his run', sub: 'the real team AI: your #9 starts 3 m off - back onside, on the last man\'s shoulder, then he goes as it is played', kind: 'offside', realAi: true, demo: true,
      setup(r) {
        const H = m.home.players, A = m.away.players;
        cast([H[6], H[9], H[10], H[5], H[7], A[0], A[1], A[2], A[3], A[4], A[6], A[7]]);
        put(H[6], 64, 34, 0); atFeet(H[6]); put(H[9], 88, 31, 0); put(H[10], 80, 41, 0); put(H[5], 60, 18, 0); put(H[7], 61, 50, 0);
        put(A[0], LINE_X, 34, 4); put(A[1], 85, 14, 4); put(A[2], 85, 28, 4); put(A[3], 85, 40, 4); put(A[4], 85, 54, 4); put(A[6], 75, 30, 4); put(A[7], 75, 42, 4);
        Object.assign(A[0], { guard: 1, gkS: null, gkMode: '', rushT: 0, claiming: false });
        for (const t of [m.home, m.away]) Object.assign(t, { wing: null, wingBy: null, wingT: 0, presser: null, cover: null, marks: new Map(), support: null, supportPt: null, supT: 0,
          runner: null, runT: 0, roleT: 0, presserHeld: 0, fx: null, fy: null, poss: t === m.home ? 1 : 0, inPoss: t === m.home, airSpAt: null });
        m.ball.crossBy = null; LAB.demo0 = LAB.demo0 ?? m.demo; m.demo = true;
        Object.assign(r, { human: H[6], shooter: H[6], gk: A[0], marks: [], st: [H[9], H[10]], passes: [], lastK: H[6] });
        r.start = (m.aiFrame(m.home, H[9].x) - m.offLine(m.home)).toFixed(1);
      },
      check(r) {
        const b = m.ball, H = m.home, L = m.offLast, line = m.offLine(H);
        if (b.owner) r.lastK = b.owner.team === H ? b.owner : null;
        else if (r.lastK && !m.pending && b.lastP === r.lastK) {                   // the man who had it has just played it: a pass (or a shot)
          r.passes.push(`${ofWho(r.lastK)}${b.target ? '→' + ofWho(b.target) : ''} [${r.st.map(q => `${ofWho(q)} ${(m.aiFrame(H, q.x) - line).toFixed(1)}`).join(' ')}]`); r.lastK = null; }
        const log = ` · #9 started ${r.start} m past · passes [m past the line, - = onside]: ${r.passes.join(' · ') || 'none'}`;
        if (L) return { o: `OFFSIDE called on ${ofWho(L.p)} (${L.past.toFixed(1)} m past)${log}`, hold: 1.2 };
        if (b.inNet) return { o: `GOAL${log}`, hold: 1.4 };
        if (b.owner && r.st.includes(b.owner) && r.passes.length) return { o: `ONSIDE · ${ofWho(b.owner)} got it${log}`, hold: 0.8 };
        if (b.owner && b.owner.team !== H) return { o: `NO OFFSIDE · their ${b.owner.keeper ? 'keeper' : 'defender'} has it${log}` };
        if (r.out) return { o: `NO OFFSIDE · out (${r.out.toLowerCase()})${log}` };
        return r.t > 9 ? { o: `NO OFFSIDE in 9 s${log}` } : null;
      } };
  }
  // OF7: your pass preview (the ring + marker under the man a pass would find) goes red while he is offside: #9 stands
  // 3 m off, then walks back onside at 1.6 s - it turns blue
  function ofHintTest(id) {
    return { id, group: 'OF', name: 'your pass-aim marker on an offside man', sub: 'red while #9 is offside, back to blue once he steps onside (nothing is played)', kind: 'offside',
      setup(r) {
        const H = m.home.players, A = m.away.players, pa = H[6], st = H[9];
        cast([pa, st, A[0], A[2], A[3]]);
        put(pa, 70, 34, 0); atFeet(pa); put(st, 88, 34.5, 0); put(A[2], 85, 30, 4); put(A[3], 85, 40, 4); put(A[0], LINE_X, 34, 4);
        Object.assign(r, { human: pa, passer: pa, st, marks: [{ x: 85, y: 34, r: 0.4 }], fired: true });
        r.bots.set(pa, (p, dt) => { p.steer(0, 0, dt); if (m.ball.owner === p) m.passAim = m.passTarget(p, { x: 1, y: 0 }, 'ground', m.passAim); });
        r.bots.set(st, (p, dt) => { if (r.t < 1.6) p.steer(0, 0, dt); else if (p.moveTo(83.5, 34.5, JOG, dt) < 0.2) p.steer(0, 0, dt); });
      },
      check(r) {
        const pa = m.passAim, red = !!(pa && offsideOn() && m.offPos(pa));
        if (r.t > 0.4 && r.t < 1.5 && pa === r.st) r.red = r.red ?? red;
        if (r.t > 3.4) { r.blue = !red;
          return { o: `HINT · ${r.red ? 'RED' : 'not red (!)'} while #9 was 3 m off · ${r.blue ? 'BLUE' : 'still red (!)'} once he stepped onside${pa === r.st ? '' : ' (the preview left him)'}` }; }
        return null;
      } };
  }
  // ======================================================================= t-029 SET-PIECE SETUP (Luca 25 Oct 14:59: "they resume without
  // people reorganizing ... the corners transition too quick, fix the pacing for set pieces"). Both full teams, the game's
  // own restart (realRestart: the Lab normally stops at the call) and the real team AI after the kick. Each line: the setup
  // time, how far the men jogged, who was moved under the wipe and whether anyone jumped in view without one (must be 0),
  // when the ball was placed and when control came back (your aim / the computer's kick). You attack the right-hand goal.
  function rsTest(id, name, sub, o) {
    return { id, group: 'RS', name, sub, kind: 'rs', realAi: true, demo: !o.you, realRestart: true, maxT: 16, pace: o.pace,
      setup(r) {
        cast(m.all.slice());
        const att = o.att ?? 22;                                                   // (a moment of play: both teams shifted towards one end)
        for (const p of m.all) { put(p, clamp(p.home.x + att, 2, PITCH_L - 2), p.home.y, p.team === m.home ? 0 : 4); }
        Object.assign(m.away.players[0], { guard: 1, gkS: null, gkMode: '', rushT: 0, claiming: false }); Object.assign(m.home.players[0], { guard: 1, gkS: null, gkMode: '', rushT: 0, claiming: false });
        for (const t of [m.home, m.away]) Object.assign(t, { wing: null, wingBy: null, wingT: 0, presser: null, cover: null, marks: new Map(), support: null, supportPt: null, supT: 0,
          runner: null, runT: 0, roleT: 0, presserHeld: 0, fx: null, fy: null, poss: t === m.home ? 1 : 0, inPoss: t === m.home, airSpAt: null });
        LAB.demo0 = LAB.demo0 ?? m.demo; m.demo = !o.you; m.ball.crossBy = null;
        Object.assign(r, { human: m.home.players[9], gk: m.away.players[0], marks: [], o, pos: null, path: new Map(), jumps: { wipe: 0, view: 0, off: 0 }, t0: null });
        o.go(r);
        r.t0 = 0;
      },
      check(r) {
        const b = m.ball, sp = m.setPiece, cam = m.cameras.main, V = cam.worldView;
        const inView = (x, y) => V.contains(wx(x, y), wy(y) - 40);
        const covering = !!(m.wipeG && m.wipeG.visible && m.tweens.isTweening(m.wipeG)) || !!(m.boG && m.boG.visible && m.boG.alpha >= 0.999);   // (t-032: a corner's blackout covers only while fully black)
        if (r.pos) m.all.forEach((p, i) => { if (p.sentOff) return; const q = r.pos[i], d = len(p.x - q[0], p.y - q[1]);
          if (d > 0.6) { if (covering) r.jumps.wipe++; else if (inView(q[0], q[1]) || inView(p.x, p.y)) { r.jumps.view++; r.jumpWho = `#${p.num} ${d.toFixed(1)} m`; } else r.jumps.off++; }
          else if (!r.kickT) r.path.set(p, (r.path.get(p) || 0) + d); });
        r.pos = m.all.map(p => [p.x, p.y]);
        if (sp && sp.setup && r.readyT == null) { r.readyT = r.t; r.st = sp.setup; r.kind = sp.kind; }
        if (sp && sp.setup && o.you && r.readyT != null && r.t - r.readyT > 0.4 && !r.pressed) { r.pressed = true; Input.downs.add(o.press || 'KeyC'); }   // (the Lab takes your corner: a cross)
        if (o.skipAt != null && !r.skipped && r.t >= o.skipAt) { r.skipped = true; Input.downs.add('KeyZ'); }   // RS7: PASS pressed during the setup
        const gkS = m.gkSetup && r.gkT == null && m.gkSetup.t0 >= (r.gk0 ?? 0) ? m.gkSetup : null; if (gkS && o.gk) { r.gkT = r.t; r.readyT = r.t + gkS.T; r.kind = 'GOAL KICK'; }
        if (r.readyT != null && r.kickT == null && ((sp && sp.kicked) || (o.gk && r.gkT != null && b.owner !== m.away.players[0] && r.t > r.gkT))) r.kickT = r.t;
        if (r.kickT == null) return r.t > 15 ? { o: `NOT TAKEN · ${sp ? (sp.su ? `still setting up (shape ${Math.round((sp.su.frac || 0) * 100)}%)` : 'aiming') : 'no set piece'}` } : null;
        if (r.t < r.kickT + 0.8) return null;
        const ds = [...r.path.values()].filter(d => d > 0.5), avg = ds.length ? ds.reduce((a, c) => a + c, 0) / ds.length : 0, mx = ds.length ? Math.max(...ds) : 0;
        const st = r.st || {}, f1 = v => (v ?? 0).toFixed(1), t0 = o.gk ? r.gkT : r.readyT - st.t;   // (times from the restart: the call's own dead-ball wait comes before it)
        const bo = st.bo, f2 = v => (v ?? 0).toFixed(2);                          // t-032: the corner's blackout, out / black / in (setup seconds)
        const cutTxt = bo ? `blackout: out ${f2(bo.black)} s, black ${f2(bo.up - bo.black)} s, in ${f2(bo.clear - bo.up)} s${bo.clear == null ? ' (NOT CLEARED!)' : ''}, ${r.jumps.wipe} moved while black`
          : st.wiped || o.gk ? `wipe: ${r.jumps.wipe} moved under it` : 'no wipe';
        return { o: `${r.kind}${o.pace ? ' · ' + o.pace.toUpperCase() : ''} · setup ${f1(r.readyT - t0)} s${st.skip ? ' (SKIPPED by a press)' : ''} · jogged in: ${ds.length} men, avg ${avg.toFixed(1)} m, max ${mx.toFixed(1)} m · ${cutTxt} · jumped in view without a wipe: ${r.jumps.view}${r.jumpWho ? ' (' + r.jumpWho + ')' : ''} · ball placed ${o.gk ? 'in his hands' : f1(st.placed) + ' s in'} · shape in ${Math.round((st.frac ?? 1) * 100)}% · control back ${f1(r.readyT - t0)} s, kicked ${f1(r.kickT - t0)} s after the restart`, hold: 0.4 };
      } };
  }
  function rsTests() {
    const H = () => m.home.players, A = () => m.away.players;
    return [
      rsTest('RS1', 'OFFSIDE: their free kick after your #9 is flagged', 'the flag + whistle, your side trots back onside, theirs pushes up, a defender (or the keeper, if he can get there) places it and plays it',
        { att: 24, go(r) { const st = H()[9]; put(st, 89, 36, 0); atFeet(st); m.offCall(st, { team: m.home, men: new Map([[st, { x: st.x, y: st.y }]]), line: m.offLine(m.home), by: H()[6] }); } }),
      rsTest('RS2', 'CORNER (yours): the setup, then the cross', 'the TV cut to the taker, he walks to the flag and places it, bodies drift into the box, markers goal-side, the keeper sets - then the Lab crosses (LOB)',
        { you: true, att: 26, go(r) { ballAt(106.2, 58, 0.2); Object.assign(m.ball, { last: m.away, lastP: A()[3], vx: 2, vy: 1 }); m.dead = { kind: 'CORNER', team: m.home, x: PITCH_L - 0.4, y: PITCH_W - 0.4, t: 0.8 }; } }),
      rsTest('RS3', 'FREE KICK near goal (theirs): the wall', '23 m out: your wall forms on 9.15 m, their men on your last line with a marker each, then the computer takes it',
        { att: -22, go(r) { put(A()[9], 23.6, 37.4, 4); ballAt(23, 37, 0); m.restart('FREE KICK', m.away, 23, 37); } }),
      rsTest('RS4', 'FREE KICK far out (theirs)', 'in midfield: everyone 9.15 m off, both sides in shape, the nearest man places it',
        { att: 0, go(r) { put(A()[7], 48.6, 24.5, 4); ballAt(48, 24, 0); m.restart('FREE KICK', m.away, 48, 24); } }),
      rsTest('RS5', 'THROW-IN (theirs)', 'the ball goes out; the taker walks to the line and picks it up, a short and a long option show, markers on them, 2 m off',
        { att: 4, go(r) { put(A()[8], 46, 63, 4); put(H()[4], 41, 62, 0); ballAt(44, 68.4, 0.1); Object.assign(m.ball, { last: m.home, lastP: H()[7], vy: 1.5 }); m.dead = { kind: 'THROW-IN', team: m.away, x: 44, y: PITCH_W - 0.2, t: 0.6 }; } }),
      rsTest('RS6', 'GOAL KICK (theirs): v0.10.4 + the jog-in', 'over their goal line off your #9: the wipe, the keeper with it in his hands, both teams land a step short and jog into the goal-kick shape',
        { att: 24, gk: true, go(r) { r.gk0 = m.time.now; ballAt(106.0, 25, 0.3); Object.assign(m.ball, { last: m.home, lastP: H()[9], vx: 3 }); m.dead = { kind: 'GOAL KICK', team: m.away, x: PITCH_L - 5.5, y: 34, t: 0.8 }; } }),
      rsTest('RS7', 'RS2 skipped by a press', 'your corner again; the Lab presses PASS 1.2 s in: aiming as soon as the shape is mostly in',
        { you: true, att: 26, skipAt: 1.2, go(r) { ballAt(106.2, 58, 0.2); Object.assign(m.ball, { last: m.away, lastP: A()[3], vx: 2, vy: 1 }); m.dead = { kind: 'CORNER', team: m.home, x: PITCH_L - 0.4, y: PITCH_W - 0.4, t: 0.8 }; } }),
      rsTest('RS1-A', 'RS1 on ARCADE', 'the same offside free kick, ARCADE\'s quicker setup', { pace: 'arcade', att: 24, go(r) { const st = H()[9]; put(st, 89, 36, 0); atFeet(st); m.offCall(st, { team: m.home, men: new Map([[st, { x: st.x, y: st.y }]]), line: m.offLine(m.home), by: H()[6] }); } }),
      rsTest('RS2-A', 'RS2 on ARCADE', 'your corner with ARCADE\'s quicker setup (ARCADE plays off the boards today: corners come with PR #31\'s rule change or a Lab call)',
        { pace: 'arcade', you: true, att: 26, go(r) { ballAt(106.2, 58, 0.2); Object.assign(m.ball, { last: m.away, lastP: A()[3], vx: 2, vy: 1 }); m.dead = { kind: 'CORNER', team: m.home, x: PITCH_L - 0.4, y: PITCH_W - 0.4, t: 0.8 }; } }),
      // t-032: the same corner from the other flag (the far touchline at the top of the screen): the blackout, the cut and
      // the taker's walk mirrored - nobody seen jumping, the camera on the right flag
      rsTest('RS8', 'CORNER (yours) from the other flag', 'out off their #3 over the byline near the far touchline: the blackout, then the taker walking to the top flag, the box filling - then the Lab crosses (LOB)',
        { you: true, att: 26, go(r) { ballAt(106.2, 10, 0.2); Object.assign(m.ball, { last: m.away, lastP: A()[3], vx: 2, vy: -1 }); m.dead = { kind: 'CORNER', team: m.home, x: PITCH_L - 0.4, y: 0.4, t: 0.8 }; } }),
    ];
  }
  function ofTests() {
    return [
      ofTest('OF1', 'a through ball to a man a step offside', 'called: OFFSIDE!, his marker, a free kick to them where he played it', { from: [68, 34], st: [87, 36] }),
      ofTest('OF2', 'level with the last defender', 'level is onside: play on', { from: [68, 34], st: [85, 36] }),
      ofTest('OF3', 'from his own half, past their high line', 'in his own half as it was played: never offside, play on', { from: [38, 34], st: [51.5, 36], line: 50 }),
      ofTest('OF4', 'offside, but the ball goes to someone else', 'he stands there and stays out of it: not penalised, play on', { from: [68, 34], st: [88, 36], mate: [78, 20], to: 'mate', mode: 'ground' }),
      ofTest('OF5', 'from a throw-in', 'no offside from a throw-in (nor a corner or a goal kick): play on', { passer: 4, from: [80, 67.6], st: [91, 50], d1y: 46, d2y: 56, set: 'THROW-IN' }),
      ofRunTest('OF6'),
      ofHintTest('OF7'),
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
  // ======================================================================= t-028 THE KEEPER CLASH (KC). With a special save on he gets to
  // anything on target (KC1: a normal shot under the bar in the top corner, his move started from the real ball); a
  // special against it is held on his gloves for a beat, then power decides (core.js CLASH). The dice are put in the
  // middle here (force 'mid'), so each test shows its powers' own band. The line: the two powers (and their ratio), how
  // long the ball was held on his gloves, the outcome, then what came of it.
  const KC_OUT = { held: 'HELD - he catches it', bounce: 'BOUNCES OFF - parried back into play', tip: 'BOUNCES OFF - a hand to it, tipped', hands: 'HANDS BLOWN AWAY', body: 'THE BODY - blasted into the net with it' };
  function kcTest(id, name, sub, o) {
    const t = pwTest(id, name, sub, { lv: o.lv, from: o.from || [86, 33], block: [], save: o.save });
    const pc = t.check, s0 = t.setup;
    t.setup = r => { s0(r); m.clashLast = null; r.gk.rig = null; m.gkSpLast = null;
      const f0 = r.action.fire; r.action.fire = () => { f0(); if (m.pending && m.pending.p === r.shooter) m.pending.ty = o.ty ?? 34.6; };   // (aimed just off his middle: his iron block meets it, easy to see)
    };
    t.check = r => { pc(r); if (r.shotT == null) return null;
      const b = m.ball, L = m.clashLast;
      if (!L) return r.t - r.shotT > 5 ? { o: 'NO CLASH' + (b.inNet ? ' · GOAL' : '') } : null;
      if (r.clT == null) r.clT = r.t;
      const head = `${L.sn} ${L.P} v ${L.K} ${L.sv} (shot/save ${L.r}) · held on his gloves ${L.held.toFixed(2)} s · ${KC_OUT[L.out] || L.out} · `;
      if (b.inNet) return { o: head + 'GOAL', hold: 1.4 };
      if (b.owner === r.gk) return { o: head + 'his ball', hold: 1 };
      if (r.out) return { o: head + 'OUT · ' + r.out.toLowerCase(), hold: 0.6 };
      if (b.owner) return { o: head + `${b.owner.team === r.gk.team ? 'his side' : 'the attackers'} pick it up` };
      if (r.t - r.clT > 2.5) return { o: head + 'loose, in play' };
      return null; };
    return Object.assign(t, { group: 'KC', force: o.force || 'mid', noPop: true });
  }
  function kcTests() {
    const kc1 = ksShot('KC1', 'a normal shot into the top corner v his LV1 save', 'he stands in the middle; with IRON WALL on he dashes across and meets it under the bar: saved', { n: '16 m', x: 89, y: 33 }, { y: GOAL_Y1 - 0.35, z: 2.15 }, 25, 0.6, 1);
    kc1.group = 'KC'; { const s0 = kc1.setup; kc1.setup = r => { s0(r); put(r.gk, LINE_X, 34, 4); }; }
    return [kc1,
      kcTest('KC2', 'LV1 shot v his LV3 save → HELD', 'BLAZE SHOT 100 v 200 RISING SHIELD: the save is far stronger - he catches it', { lv: 1, save: 3 }),
      kcTest('KC3', 'LV2 shot v his LV2 save → BOUNCES OFF', 'THUNDER SHOT 140 v 140 THUNDER GLOVE: close - parried back out, a live ball', { lv: 2, save: 2 }),
      kcTest('KC4', 'LV2 shot v his LV1 save → HANDS BLOWN AWAY', 'THUNDER SHOT 140 v 100 IRON WALL: the shot a bit stronger - through his hands, goal', { lv: 2, save: 1 }),
      kcTest('KC5', 'LV3 shot v his LV1 save → THE BODY', 'RISING PHOENIX 200 v 100 IRON WALL: much stronger - he is blasted into the net with it', { lv: 3, save: 1 }),
      kcTest('KC6', 'LV2 shot v his LV2 save → tipped for a corner', 'the other half of BOUNCES OFF (made to happen here): a hand to it, over or round the post', { lv: 2, save: 2, force: 'tip' }),
    ];
  }
  // ======================================================================= t-022 CHARGED HEADERS AND VOLLEYS (HV). The Lab plays YOU through
  // the touch buttons (the game's own input): a team-mate crosses to you, SHOOT goes down o.press s before the ball gets
  // to you (by the game's predicted path) and is let go o.rel s before it (o.rel null: still held at the contact = late;
  // o.tap: let go after 0.06 s = today's header). The line: held / let go, the charge (the hold's power -> what the
  // timing kept), the speed off the head / boot, on target as it left him, then what came of it. HV5 is the computer's
  // striker (its dice by level, AIR_CHARGE.cpu*), HV6 a charged header straight at their keeper.
  function hvContactIn(p, vol) {                                                // s until the ball reaches him at header (or volley) height
    const P = m.path; if (!P) return null;
    for (const q of P) { const d = len(q.x - p.x, q.y - p.y); if (vol ? q.z > 0.25 && q.z < 1.0 && d < 1.6 : q.z > 1.1 && q.z < 2.7 && d < 1.2) return q.t; }
    return null;
  }
  function hvOnTarget(gx) {                                                     // where the struck ball crosses the goal line (no keeper)
    const b = m.ball, c = { x: b.x, y: b.y, z: b.z, vx: b.vx, vy: b.vy, vz: b.vz, skid: true, rollV: b.rollV }, h = 1 / 120;
    for (let t = 0; t < 3; t += h) { ballStep(c, h, false); if ((c.x - gx) * Math.sign(b.vx || 1) >= 0) return c.z >= BAR_Z ? `OVER (${c.z.toFixed(1)} m)` : c.y > GOAL_Y0 && c.y < GOAL_Y1 ? 'ON TARGET' : `WIDE (${Math.abs(c.y - 34).toFixed(1)} m off centre)`; }
    return 'SHORT';
  }
  const hvRate = l => Math.round(100 * Math.min(1, AIR_CHARGE.sweet / (AIR_CHARGE.cpuJit * Math.max(diffK(l).shotErr, AIR_CHARGE.cpuFloor))));
  function hvTest(id, name, sub, o) {
    return { id, group: 'HV', name, sub, kind: 'hv', you: !o.cpu, lvl: o.lvl,
      setup(r) {
        Object.assign(Input.touch, { x: 0, y: 0, btn: {} });
        const S = o.cpu ? m.away.players : m.home.players, you = S[9], c = S[7], gk = (o.cpu ? m.home : m.away).players[0];
        const X = x => o.cpu ? PITCH_L - x : x, Y = y => o.cpu ? 68 - y : y;    // (the computer attacks the other goal)
        cast([you, c, gk]); put(you, X(92), Y(31), o.cpu ? 4 : 0); put(c, X(o.from[0]), Y(o.from[1])); faceTo(c, X(92), Y(31)); atFeet(c);
        put(gk, X(LINE_X), Y(o.gkY || 33), o.cpu ? 0 : 4); Object.assign(gk, { guard: 1, gkS: null, gkMode: '', claiming: false, saveKind: '', leap: 0, gkN: null, rushT: 0 });
        for (const mt of m.meters || []) mt.e = 0; m.acLast = null; m.airCh = null;
        Object.assign(r, { human: o.cpu ? gk : you, striker: you, shooter: you, gk, gx: o.cpu ? 0 : PITCH_L, marks: [{ x: X(92), y: Y(31), r: 0.5 }] });
        r.action = { at: 0.6, fire: () => { const b = m.ball, a = aimAir(b.x, b.y, X(92), Y(31), o.z, o.T); m.kick(c, X(92), Y(31), a.speed, a.vz, 0.13, {}); } };
      },
      check(r) {
        const b = m.ball, T = Input.touch, you = r.striker, f2 = v => v.toFixed(2), pc = v => Math.round(v * 100) + '%';
        const done = res => { Object.assign(T, { x: 0, y: 0, btn: {} }); return res; };
        if (!o.cpu && r.fired && !r.hit) {                                        // ---- you: SHOOT down, held, let go
          const tc = b.owner || m.pending ? null : hvContactIn(you, o.vol);
          if (r.downT == null) { if (tc != null && tc <= o.press) { T.btn.shoot = true; r.downT = r.t; } }
          else if (r.upT == null && (o.tap ? r.t - r.downT >= 0.06 : o.rel != null && tc != null && tc <= o.rel)) { T.btn.shoot = false; r.upT = r.t; if (o.stick) { T.x = o.stick[0]; T.y = o.stick[1]; } }
        }
        const L = m.acLast;
        if (!r.hit) { if (L && L.by === you) { r.hit = { ...L, at: r.t }; T.btn.shoot = false; } else return r.t > 7 ? done({ o: 'NO HEADER / VOLLEY' + (b.lastP && b.lastP !== r.shooter ? ` · ${b.lastP.team === m.home ? 'your' : 'their'} #${b.lastP.num} got it` : '') }) : null; }
        if (!r.go) { if (m.pending || b.owner || b.lastP !== you) return null; r.go = { v: Math.round(len(b.vx, b.vy, b.vz) * 3.6), tgt: hvOnTarget(r.gx), t: r.t }; r.shotT = r.t; }
        const H = r.hit, who = o.cpu ? `${LVL_NAME[r.sc.lvl] || 'BASE'} (timed right ~${hvRate(r.sc.lvl || 'normal')}% of its charged ones; E ${hvRate('easy')} · N ${hvRate('normal')} · H ${hvRate('hard')} · R ${hvRate('rise')}): ` : '';
        const hold = o.cpu ? '' : `held ${f2((r.upT ?? H.at) - r.downT)} s, ${r.upT != null ? `let go ${f2(H.at - r.upT)} s before the contact` : 'still held at the contact (late)'} · `;
        const ch = H.tap ? 'TAP: today\'s ' + H.kind : `CHARGED ${H.kind}: ${pc(H.raw)} power → ${pc(H.pw)} kept, timing ${H.sweet ? 'RIGHT (sweet)' : (H.late ? 'LATE' : 'off by ' + f2(H.off) + ' s') + ' q ' + f2(H.q)}`;
        const head = `${who}${hold}${ch} · ${r.go.v} km/h · ${r.go.tgt} · `;
        const res = gkxOut(r); if (res) return done({ ...res, o: head + res.o.replace(/^NO SAVE · /, '') });
        return r.t - r.go.t > 4 ? done({ o: head + (b.owner ? `${b.owner.team === you.team ? 'your side' : 'their side'} has it` : 'loose') }) : null;
      } };
  }
  function hvTests() {
    const hdr = { from: [99, 6], z: 1.8, T: 1.35 };
    return [
      hvTest('HV1', 'a header released in the sweet window', 'hold SHOOT as the cross comes, let go just before it reaches you: full power, on target', { ...hdr, press: 0.75, rel: 0.05 }),
      hvTest('HV2', 'a header released EARLY', 'let go 0.45 s before it arrives: weaker and wider', { ...hdr, press: 0.9, rel: 0.45 }),
      hvTest('HV3', 'a charged volley (low driven cross)', 'hold as it comes in at knee height, let go just before: a power volley', { from: [100, 14], z: 0.6, T: 0.75, vol: true, press: 0.75, rel: 0.05 }),
      hvTest('HV4', 'a TAP header', 'SHOOT tapped (0.06 s) as the cross comes: today\'s header (~45-54 km/h)', { ...hdr, press: 0.5, tap: true }),
      hvTest('HV5', 'the computer\'s header by level (NORMAL)', 'their striker meets a cross: it charges about 3 in 10, its timing a dice by level', { ...hdr, cpu: true, lvl: 'normal' }),
      hvTest('HV6', 'a charged header straight at their keeper', 'timed right, aimed at him: does the pace beat his hold (held / parried)?', { ...hdr, press: 0.75, rel: 0.05, gkY: 33.1, stick: [0, -0.4] }),
      hvTest('HV7', 'a header held through the contact (LATE)', 'still holding SHOOT as it reaches you: struck late - weaker and wilder', { ...hdr, press: 0.75, rel: null }),
    ];
  }
  // ======================================================================= t-034 AERIAL BATTLES (AB). Luca 25 Oct 19:14: "aerial battles only
  // within gk box ... header on header or volley on volley ... if you win as attack ball goes like a shot towards the
  // goal and defender thrown to ground ... if defender wins it gets cleared out ... use space bar ... when you press is
  // not consistent with click output". A team-mate crosses to your striker (you), their centre-back on him goal side,
  // their keeper on his line. The Lab presses REAL KEYS (keydown / keyup on the page, SPACE) by the battle's own clock:
  // o.mash 'fast' a tap every 0.085 s, 'none' nothing, 'script' AB5's list - single taps, two taps inside one frame, a
  // held key with the OS key repeat (repeat: true) - so the line can say the bar moved exactly as many steps as presses.
  // Each line: in their box or not, header / volley, presses each side, the bar's start and end, who won and how fast,
  // the shot (km/h, where it crossed the line) and what came of it, the beaten man on the ground for how long.
  const abKey = (type, repeat) => window.dispatchEvent(new KeyboardEvent(type, { code: 'Space', key: ' ', repeat: !!repeat }));
  const abTap = () => { abKey('keydown'); abKey('keyup'); };
  const AB_SCRIPT = [[0.05, 'tap'], [0.15, 'tap'], [0.25, 'tap'], [0.35, 'tap2'], [0.5, 'down'], [0.55, 'rep'], [0.6, 'rep'], [0.65, 'rep'], [0.7, 'rep'], [0.75, 'up'], [0.85, 'tap'], [0.95, 'tap']];
  const AB_SCRIPT_N = 8;                                                         // 3 taps + 2 in one frame + 1 held (4 repeats) + 2 taps
  function abTest(id, name, sub, o) {
    return { id, group: 'AB', name, sub, kind: 'ab', you: true, lvl: o.lvl || 'normal', pace: o.pace, maxT: 16,
      setup(r) {
        Object.assign(Input.touch, { x: 0, y: 0, btn: {} }); abKey('keyup'); Input.mashTake();
        const H = m.home.players, Aw = m.away.players, you = H[9], c = H[7], d = Aw[3], gk = Aw[0], at = o.at || [92, 31];
        cast([you, c, d, gk]); put(you, at[0], at[1], 0); put(d, at[0] + 0.7, at[1] + 0.6, 4); put(c, o.from[0], o.from[1]); faceTo(c, at[0], at[1]); atFeet(c);
        put(gk, LINE_X, 33, 4); Object.assign(gk, { guard: 1, gkS: null, gkMode: '', claiming: false, saveKind: '', leap: 0, gkN: null, rushT: 0 });
        for (const mt of m.meters || []) mt.e = 0;
        Object.assign(m, { aerial: null, aerialLast: null, aerialAt: -1e9, aerialKick: null, aerFx: null, slowMo: 0, camTarget: null });
        LAB.aerialChance = LAB.aerialChance ?? AERIAL.chance; AERIAL.chance = 1;   // (the battle always happens when it can; start() puts the chance back)
        Object.assign(r, { human: you, striker: you, shooter: you, gk, gx: PITCH_L, marks: [{ x: at[0], y: at[1], r: 0.5 }], fired: false });
        if (o.lob) { r.human = c; r.bots.set(you, lbBot); r.bots.set(d, lbMark(you, 1)); }   // (AB4: you lob it; your striker times his run, his marker goes with him - LB's bots)
        r.action = { at: 0.6, fire: () => { const b = m.ball;
          if (o.lob) m.kick(c, at[0], at[1], 0, 0, 0.12, { mode: 'lob', target: you, loft: true });
          else { const a = aimAir(b.x, b.y, at[0], at[1], o.z, o.T); m.kick(c, at[0], at[1], a.speed, a.vz, 0.13, { target: you, cross: 'lab' }); } } };
      },
      check(r) {
        const b = m.ball, A = m.aerial, f1 = v => v.toFixed(1), sg = v => (v > 0 ? '+' : '') + v;
        if (A && A.kind !== 'ground') {                                          // ---- the battle: the Lab's presses on its clock
          if (!r.bat) r.bat = { t0: r.t, done: new Set() };
          if (o.mash === 'fast') { const k = Math.floor(A.t / 0.085); if (k > (r.bat.k ?? -1) && A.res == null) { r.bat.k = k; abTap(); } }
          if (o.mash === 'script') AB_SCRIPT.forEach(([t, a], i) => { if (A.t >= t && !r.bat.done.has(i)) { r.bat.done.add(i);
            if (a === 'tap') abTap(); else if (a === 'tap2') { abTap(); abTap(); } else if (a === 'down') abKey('keydown'); else if (a === 'rep') abKey('keydown', true); else abKey('keyup'); } });
          return null;
        }
        if (r.bat && !r.bat.over) { r.bat.over = true; abKey('keyup'); r.L = m.aerialLast; r.endT0 = r.t; r.loser = r.L && r.L.loser; }
        if (!r.bat) {                                                            // ---- no battle (AB4: outside the box)
          if (!r.fired) return null;
          if (!r.touch && b.lastP && b.lastP !== r.striker.team.players[7] && b.lastP.team) r.touch = { p: b.lastP, how: b.how ? b.how.kind : (b.owner ? 'control' : 'touch'), at: { x: b.x, y: b.y }, z: b.z };
          if (r.touch || r.t > 8) { const t = r.touch, box = t && Math.abs(t.at.x - PITCH_L) < AERIAL.boxX && Math.abs(t.at.y - 34) < AERIAL.boxY;
            return { o: `NO BATTLE · met ${t ? `at ${f1(t.at.x)}, ${f1(t.at.y)} (${box ? 'IN' : 'outside'} their box), ${f1(t.z)} m up: ${t.p.team === m.home ? 'your' : 'their'} #${t.p.num} ${String(t.how).toUpperCase()} (the quick duel: lobDuel)` : 'nobody'}`, hold: 0.8 }; }
          return null;
        }
        const L = r.L; if (!L) return { o: 'BATTLE CALLED OFF' };
        if (r.loser && r.floorT == null && r.loser.state !== 'fall' && r.loser.state !== 'getup' && r.loser.state !== 'hit') r.floorT = r.t - r.endT0;
        if (r.shot == null && L.how === 'shot') r.shot = hvOnTarget(PITCH_L);
        const box = Math.abs(L.at.x - PITCH_L) < AERIAL.boxX && Math.abs(L.at.y - 34) < AERIAL.boxY, mv = L.move === 'volley' ? 'VOLLEY v VOLLEY' : 'HEADER v HEADER';
        const yn = L.n[0], cn = L.n[1], moved = L.pos - L.pos0, honest = L.ko ? Math.abs(L.pos) === L.R && moved === yn - cn : moved === yn - cn;
        let head = `in box ${box ? 'Y' : 'N'} · ${mv} at ${f1(L.move === 'volley' ? AERIAL.holdZv : AERIAL.holdZ)} m · you ${yn} v CPU ${cn} presses${o.mash === 'script' ? ` (script: ${AB_SCRIPT_N} real presses, ${yn === AB_SCRIPT_N ? 'all counted, no repeats' : 'COUNT OFF'})` : ''} · bar ${sg(L.pos0)} → ${sg(L.pos)} of ±${L.R} (${honest ? `moved ${sg(moved)} = ${yn} − ${cn}: 1 step a press` : 'NOT 1:1'})${L.ko ? ' · WON OUTRIGHT' : ''} in ${f1(L.T)} s · ${L.res === 'att' ? 'ATTACKER (you)' : 'DEFENDER (CPU)'} WON → `;
        if (L.res === 'def') { const a = L.dir ? Math.round(Math.atan2(L.dir.y, L.dir.x * -1) * 180 / Math.PI) : 0;
          head += `CLEARED ${L.spd} km/h, ${Math.abs(a) < 25 ? 'up the pitch' : L.dir.y < 0 ? 'to the top touchline' : 'to the bottom touchline'}`;
          if (!r.clr && (b.z <= 0.05 || b.owner || r.out)) r.clr = { x: b.x, y: b.y };
          if (r.clr && r.floorT != null) return { o: head + ` · came down ${f1(Math.abs(PITCH_L - r.clr.x))} m from the goal line (${Math.abs(PITCH_L - r.clr.x) > AERIAL.boxX ? 'out of the box' : 'STILL IN THE BOX'}) · you stumbled ${f1(r.floorT)} s`, hold: 0.6 };
          return r.t - r.endT0 > 5 ? { o: head + ' · ?' } : null; }
        head += L.how === 'special' ? 'AERIAL SPECIAL' : `${L.move === 'volley' ? 'VOLLEY' : 'HEADER'} AT GOAL ${L.spd} km/h (${r.shot}) · their #${r.loser ? r.loser.num : '?'} on the ground ${r.floorT != null ? f1(r.floorT) + ' s' : '…'} → `;
        const res = r.floorT != null ? gkxOut(r) : null; if (res) return { ...res, o: head + res.o };
        return r.t - r.endT0 > 6 ? { o: head + (b.owner ? `${b.owner.team === m.home ? 'your side' : 'their side'} has it` : 'loose') } : null;
      } };
  }
  function abTests() {
    const hdr = { from: [99, 6], z: 1.9, T: 1.3 };
    return [
      abTest('AB1', 'a cross in the box at head height, you win it', 'HEADER v HEADER: MASH SPACE! (the Lab taps ~12 a second) - you win: a header at goal at a shot\'s pace, their man floored', { ...hdr, mash: 'fast' }),
      abTest('AB2', 'the same, the defender wins it', 'no presses: the computer\'s centre-back wins and clears it high and long, out of the box; you stumble', { ...hdr, mash: 'none' }),
      abTest('AB3', 'a waist-high ball in the box', 'a driven cross met at the waist: VOLLEY v VOLLEY, same mash - you win: a volley at goal', { from: [100, 14], z: 1.0, T: 0.8, mash: 'fast' }),
      abTest('AB4', 'a contested lob OUTSIDE the box', 'a lob to your man and his marker at 24 m out: NO battle - the quick duel (lobDuel) as before', { from: [62, 40], at: [80, 31], lob: true, mash: 'fast' }),
      abTest('AB5', 'the mash script: real key presses', '3 taps, 2 taps inside one frame, SPACE held with 4 OS key repeats (one press), 2 taps = 8 presses: the bar moves 8 steps your way, the computer\'s presses 1 each back', { ...hdr, mash: 'script' }),
      abTest('AB6', 'ARCADE: the same cross, a shorter mash', 'AB1 on ARCADE: the window ~1.0 s (CLASSIC 1.2 s)', { ...hdr, mash: 'fast', pace: 'arcade' }),
    ];
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
    return { id: `CL${j + 1}`, group: 'CL', name: `${d.min}' ${d.title}`,   // (t-021: group CL - BW is now the checks' own tests) sub: `${d.home} v ${d.away} · ${d.msg}`, kind: 'clip', doc: d,
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
    const G = LAB.groups.find(g => g.id === 'CL'); if (!G || !LAB.db) return;
    try {
      const snap = await LAB.db.collection('bugwatch').get(), docs = [];
      // t-021: old flicker / jitter / stutter clips stay hidden (those checks are counted only now), and real bugs lead:
      // errors first, then broken mechanics, then flags, marks and the 'looks odd' ones (to rate before rated)
      for (const s of snap.docs) { const v = s.data(); if (v && v.clip && v.code && !bwLook(v)) docs.push(Object.assign({ _id: s.id }, v)); }
      docs.sort((a, b) => (a.review ? 1 : 0) - (b.review ? 1 : 0) || bwRank(a) - bwRank(b) || (a.order ?? 999) - (b.order ?? 999) || String(b.at).localeCompare(String(a.at)));
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

  // ======================================================================= t-021 BUG WATCH CHECKS (Luca 25 Oct 06:44: "it should flag
  // mechanics issues, actual game bugs, when game code breaks"). One case per new check: the Lab breaks the game on
  // purpose (LAB.undo puts it back at the next test) and the check must trip; BW9 is normal play with the real AI on
  // both sides, where none of them may. Bug Watch watches only here (window.__labWatch) and keeps nothing (__bwNoStore).
  const BW_NEW = ['CLOCK_FROZEN', 'BALL_TOO_FAST', 'BALL_UNDER', 'THROUGH_KEEPER', 'IN_THE_NET', 'GOAL_TWICE', 'TEAM_FROZEN', 'CONTROL_DEAD'];
  const undo = f => { (LAB.undo = LAB.undo || []).push(f); };
  const swap = (o, k, v) => { const own = Object.prototype.hasOwnProperty.call(o, k), was = o[k]; o[k] = v; undo(() => { if (own) o[k] = was; else delete o[k]; }); };
  function bwTest(id, code, name, sub, setup, inject, T = 7, extra = {}) {
    return Object.assign({ id, group: 'BW', name, sub, kind: 'bw', you: code === 'CONTROL_DEAD',
      setup(r) {
        window.__labWatch = true; window.__bwNoStore = true; window.__labClock = code === 'CLOCK_FROZEN';
        m.bw.reset(); m.bw.list = m.bw.list.filter(x => x.mode !== 'lab'); r.fired = true;
        const H = m.home.players, A = m.away.players; setup(r, H, A);
      },
      check(r) {
        if (inject) inject(r, m.ball);
        const S = m.bw.stats, hit = (code ? [code] : BW_NEW).filter(c => S[c]);
        if (code) {
          if (hit.length) { const x = m.bw.list.filter(q => q.code === code && q.mode === 'lab').pop(); return { o: `TRIPPED ${code} after ${r.t.toFixed(1)} s · ${x ? x.msg : ''}`, hold: 0.6 }; }
          return r.t > T ? { o: `NOT TRIPPED: ${code} stayed quiet for ${T} s` } : null;
        }
        if (hit.length) return { o: `TRIPPED IN NORMAL PLAY: ${hit.map(c => `${c} ${S[c]}`).join(', ')}` };
        return r.t > T ? { o: `NONE OF THE ${BW_NEW.length} NEW CHECKS TRIPPED in ${T} s of normal play` } : null;
      } }, extra);
  }
  function bwTests() {
    return [
      bwTest('BW1', 'CLOCK_FROZEN', 'a frozen match clock', 'live play, the Lab holds the clock: after 4 s it trips', (r, H, A) => {
        cast([H[9], A[5]]); put(H[9], 50, 34, 0); put(A[5], 58, 30, 4); atFeet(H[9]); r.human = H[9]; }),
      bwTest('BW2', 'BALL_TOO_FAST', 'the physics blows up: a 55 m/s ball', 'a loose ball suddenly at 55 m/s, no special', (r, H) => {
        cast([H[9]]); put(H[9], 40, 20, 0); ballAt(45, 34, 0.3); r.human = H[9]; },
        (r, b) => { if (r.t > 0.3 && !r.inj) { r.inj = 1; b.vx = 54; b.vy = 8; b.vz = 3; b.special = 0; } }),
      bwTest('BW3', 'BALL_UNDER', 'the ball under the grass', 'the ball dropped 0.4 m into the ground', (r, H) => {
        cast([H[9]]); put(H[9], 40, 20, 0); ballAt(50, 34, 0); r.human = H[9]; },
        (r, b) => { if (r.t > 0.3 && !r.inj) { r.inj = 1; b.z = -0.4; } }),
      bwTest('BW4', 'THROUGH_KEEPER', 'a shot straight through the keeper', 'their keeper square on his line; the Lab switches off every touch (the ball\'s pick-ups) so it goes through him', (r, H, A) => {
        cast([H[9], A[0]]); put(A[0], LINE_X, 34, 4); Object.assign(A[0], { guard: 1, gkS: null, gkMode: '', rushT: 0, claiming: false }); put(H[9], 86, 30, 0);
        ballAt(92, 34, 0.6); Object.assign(m.ball, { vx: 26, vy: 0, vz: 1.2, last: m.home, lastP: H[9] });
        swap(m, 'pickups', function () {}); r.human = H[9]; }),
      bwTest('BW5', 'IN_THE_NET', 'a man standing in the net', 'one of yours parked inside their goal, play going on', (r, H, A) => {
        cast([H[9], A[5]]); put(H[9], 106.2, 34.5, 4); put(A[5], 60, 30, 4); ballAt(55, 40, 0); r.human = H[9]; }),
      bwTest('BW6', 'GOAL_TWICE', 'one goal counted twice', 'the score goes up, then up again a second later', (r, H) => {
        cast([H[9]]); put(H[9], 50, 34, 0); atFeet(H[9]); r.human = H[9]; },
        (r) => { if (r.t > 0.5 && !r.g1) { r.g1 = 1; m.home.score++; } if (r.t > 1.5 && !r.g2) { r.g2 = 1; m.home.score++; } }),
      bwTest('BW7', 'TEAM_FROZEN', 'their whole team frozen', 'six of theirs stand still while you have the ball', (r, H, A) => {
        cast([H[9], A[0], A[1], A[2], A[3], A[4], A[6], A[7]]); put(H[9], 50, 34, 0); atFeet(H[9]); [A[1], A[2], A[3], A[4], A[6], A[7]].forEach((p, k) => put(p, 62 + (k % 3) * 8, 18 + k * 6, 4));
        put(A[0], LINE_X, 34, 4); r.human = H[9]; }),
      bwTest('BW8', 'CONTROL_DEAD', 'your man won\'t move', 'you hold RIGHT, the Lab freezes his legs (his step does nothing)', (r, H) => {
        cast([H[9]]); put(H[9], 50, 34, 0); ballAt(70, 50, 0); r.human = H[9]; Input.touch.x = 1; swap(H[9], 'step', function () {}); }),
      bwTest('BW9', null, 'normal play: none of the new checks trip', 'the real AI on both sides, 11 v 11, for 10 s', (r, H, A) => {
        cast(m.all.filter(p => !p.benched)); m.all.forEach(p => { put(p, p.home.x, p.home.y, p.team.side > 0 ? 0 : 4); });
        Object.assign(A[0], { guard: 1, gkS: null, gkMode: '', rushT: 0, claiming: false }); Object.assign(H[0], { guard: 1, gkS: null, gkMode: '', rushT: 0, claiming: false });
        for (const t of [m.home, m.away]) Object.assign(t, { wing: null, wingBy: null, wingT: 0, presser: null, cover: null, marks: new Map(), support: null, supportPt: null, supT: 0,
          runner: null, runT: 0, roleT: 0, presserHeld: 0, fx: null, fy: null, poss: t === m.home ? 1 : 0, inPoss: t === m.home, airSpAt: null });
        put(H[9], 52, 34, 0); atFeet(H[9]); LAB.demo0 = LAB.demo0 ?? m.demo; m.demo = true; r.human = H[9]; }, null, 10, { realAi: true, demo: true }),
    ];
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
  // t-018 TACKLE REWORK (Luca 25 Oct 06:56: "you can spam it too easy, it should have more draw back if you miss so
  // slower reset time ... making the slide actually slide more, but not too far either and gets up after"). The Lab
  // presses the real buttons (Input.touch) and times what the player can do. TT1 a slide that misses, TT2 one that wins
  // it, TT3 SHOOT mashed 10 times in 5 s, TT4 a standing challenge made to miss + PASS mashed after it, TT5 the computer
  // defending against you for 20 s. A foul in TT3 / TT5 is counted and play goes on (no free kick in the Lab).
  const ttFree = p => !p.busy() && p.stun <= 0;                                  // he's up and can play again (a tackle: p.cool too)
  const ttFoul = (r, back) => { if (!m.foulScene && !r.out) return false; r.fouls = (r.fouls || 0) + 1;
    m.foulScene = null; m.setPiece = null; m.pending = null; r.out = null; for (const p of m.all) if (p.state === 'fall') { p.state = 'idle'; p.stun = 0; } if (back) atFeet(back); return true; };
  const ttShuttle = (a, b, v) => { let to = b; return (p, dt) => { if (m.ball.owner !== p || p.busy()) { p.steer(0, 0, dt); return; }
    if (len(to[0] - p.x, to[1] - p.y) < 0.8) to = to === b ? a : b; const dx = to[0] - p.x, dy = to[1] - p.y, d = len(dx, dy) || 1;
    p.wantDir = { x: dx / d, y: dy / d }; m.carrySteer(p, dx / d, dy / d, v, dt); }; };
  function ttTest(id, name, sub, o) {
    return { id, group: 'TT', name, sub, kind: 'tt', you: true, o, maxT: o.maxT,
      setup(r) {
        Object.assign(Input.touch, { x: 0, y: 0, btn: {} });
        const you = m.home.players[4], d = m.away.players[9], d2 = o.cpu ? m.away.players[5] : null; cast([you, d, ...(d2 ? [d2] : [])]);
        Object.assign(r, { human: you, drib: d, o, presses: 0, slides: 0, ignored: 0, fouls: 0, wins: 0, cools: [] });
        if (o.cpu) {                                                             // TT5: you on the ball, two computer defenders press you
          put(you, 76, 34, 0); atFeet(you); put(d, 90, 34, 4); put(d2, 82, 22, 6); r.wp = [[86, 27], [86, 41], [72, 41], [72, 27]]; r.wi = 0;
          const press = (p, dt) => { const c = m.ball.owner; if (c && c.team !== p.team) m.aiPress(p, m.away, c, dt); else p.steer(0, 0, dt); };
          r.bots.set(d, press); r.bots.set(d2, press); r.cam = () => ({ x: you.x, y: you.y }); r.fired = true; return;
        }
        put(you, o.me[0], o.me[1]); put(d, o.from[0], o.from[1]); faceTo(d, o.to[0], o.to[1]); faceTo(you, d.x, d.y); atFeet(d);
        r.bots.set(d, o.shuttle ? ttShuttle(o.from, o.to, o.v) : dribbleTo(o.to[0], o.to[1], o.v));
        r.cam = o.kind === 'miss' ? () => ({ x: you.x, y: you.y }) : () => ({ x: (you.x + d.x) / 2, y: (you.y + d.y) / 2 }); r.fired = true;   // (TT1: on him, the slide and the get-up)
      },
      check: ttCheck };
  }
  function ttCheck(r) {
    const b = m.ball, o = r.o, p = r.human, T = Input.touch, f1 = v => v.toFixed(1), f2 = v => v.toFixed(2);
    const done = res => { Object.assign(T, { x: 0, y: 0, btn: {} }); if (r.rand0) { LAB.rand = r.rand0; r.rand0 = null; } return res; };
    if (r.rand0) { LAB.rand = r.rand0; r.rand0 = null; }                         // (TT4: the forced miss lasts one step)
    const btn = o.btn || 'shoot', was = T.btn[btn]; T.btn[btn] = false;          // a press is one step down
    if (p.state === 'slide' && r.prevState !== 'slide') { r.slides++; if (r.t0 == null) { r.t0 = r.t; r.x0 = p.x; r.y0 = p.y; } }
    else if (was && btn === 'shoot') r.ignored++;                                // pressed last step and no slide came of it
    const chal = p.cool > (r.prevCool ?? 0) + 0.05 && p.state !== 'slide'; if (chal) r.cools.push(r.t);   // a challenge went in
    r.prevState = p.state; r.prevCool = p.cool;
    const press = () => { T.btn[btn] = true; r.presses++; r.pressT = r.t; };
    if (o.kind === 'miss' || o.kind === 'win') {
      if (r.pressT == null) { if (o.kind === 'miss' ? r.t >= 0.3 : len(b.x - p.x, b.y - p.y) < o.at) { press(); if (o.stick) { T.x = o.stick[0]; T.y = o.stick[1]; } } return r.t > 5 ? done({ o: 'NO PRESS' }) : null; }
      if (r.t - r.pressT > 0.05) { T.x = T.y = 0; }
      if (r.t0 == null) return r.t - r.pressT > 0.5 ? done({ o: 'NO SLIDE' }) : null;
      if (p.slideWon && r.winT == null) r.winT = r.t;
      if (p.state === 'getup' && r.upT == null) { r.upT = r.t; r.xUp = p.x; r.yUp = p.y; }
      if (r.actT == null && r.upT != null && ttFree(p)) r.actT = r.t;
      if (r.tackT == null && r.actT != null && p.cool <= 0) r.tackT = r.t;
      if (r.actT == null || r.tackT == null) return r.t > 8 ? done({ o: 'STILL DOWN after 8 s' }) : null;
      const slid = len(r.xUp - r.x0, r.yUp - r.y0), ground = r.upT - r.t0, up = r.actT - r.upT;
      if (o.kind === 'miss') return done({ o: `${r.winT != null ? 'IT WON THE BALL (meant to miss) · ' : 'MISSED · '}slid ${f1(slid)} m in ${f2(ground)} s, get-up ${f2(up)} s → can act again ${f2(r.actT - r.t0)} s after the press, slide / challenge again after ${f2(r.tackT - r.t0)} s`, hold: 0.6 });
      if (r.winT == null) return done({ o: `MISSED (meant to win) · slid ${f1(slid)} m, can act again ${f2(r.actT - r.t0)} s after the press` });
      const mine = b.owner === p ? 'the ball is YOURS (block tackle)' : b.owner ? `${b.owner.team === p.team ? 'you' : 'he'} picked it up` : `knocked loose (${f1(len(b.vx, b.vy))} m/s)`;
      return done({ o: `WON IT ${f2(r.winT - r.t0)} s into the slide · up and free ${f2(r.actT - r.winT)} s after the contact (${f2(r.actT - r.t0)} s after the press) · ${mine}`, hold: 0.6 });
    }
    if (o.kind === 'mash') {                                                      // TT3: 10 presses, one every 0.5 s; the ball goes back to him
      ttFoul(r, r.drib);
      if (b.owner !== r.drib && r.t - (r.pressT ?? 0) > 0.1) { if (p.slideWon || p.state === 'getup') r.wins += b.owner === p ? 1 : 0; atFeet(r.drib); }
      if (r.presses < 10 && r.t >= 0.2 + r.presses * 0.5) { press(); T.x = 0; T.y = r.presses % 2 ? -1 : 1; }   // (the stick up / down in turn: every slide misses and he stays by him)
      else if (r.t - r.pressT > 0.05) T.x = T.y = 0;
      if (r.t < 5.6) return null;
      return done({ o: `SHOOT pressed ${r.presses} times in 5 s → ${r.slides} slides${r.wins ? ` (${r.wins} won it)` : ''}, ${r.ignored} presses did nothing (on the grass / getting up / cooling down)${r.fouls ? ` · ${r.fouls} foul${r.fouls > 1 ? 's' : ''}` : ''}`, hold: 0.6 });
    }
    if (o.kind === 'chal') {                                                      // TT4: the challenge made to miss, then PASS mashed every 0.1 s
      if (r.pressT == null) { if (len(b.x - p.x, b.y - p.y) < 1.3) { press(); r.rand0 = LAB.rand; LAB.rand = () => 0.999; } return r.t > 5 ? done({ o: 'NO PRESS' }) : null; }
      if (r.c1 == null) { if (r.cools.length) { r.c1 = r.cools[0]; r.stun0 = p.stun; r.won1 = b.owner === p; } return null; }
      if (r.stunT == null && p.stun <= 0) r.stunT = r.t;
      if (r.cools.length < 2) { if (Math.round((r.t - r.c1) / STEP) % 6 === 0) press(); return r.t - r.c1 > 4 ? done({ o: `no second challenge in 4 s` }) : null; }
      const c2 = r.cools[1], res2 = b.owner === p ? 'WON IT' : len(b.x - p.x, b.y - p.y) > 1.6 ? 'lunged at nothing (he was gone)' : 'missed';
      return done({ o: `${r.won1 ? 'WON (meant to miss)' : 'MISSED'} · off balance ${f2((r.stunT ?? r.t) - r.c1)} s · PASS mashed: ${r.presses - 2} presses did nothing · next challenge ${f2(c2 - r.c1)} s after the first → ${res2}`, hold: 0.6 });
    }
    // TT5: you dribble round a square; count the computer's slides and challenges in 20 s
    const D = [r.drib, m.away.players[5]];
    for (const q of D) { if (q.state === 'slide' && q._ttS !== 'slide') r.slides++; q._ttS = q.state; if (q.cool > (q._ttC ?? 0) + 0.05 && q.state !== 'slide') r.chal = (r.chal || 0) + 1; q._ttC = q.cool; }
    if (ttFoul(r, null)) r.backT = r.t + 0.6;
    if (b.owner && b.owner.team !== p.team && r.backT == null) { r.wins++; r.backT = r.t + 0.6; }   // it won it: back to you shortly
    if (!b.owner && r.backT == null) r.looseT = (r.looseT || 0) + STEP; else r.looseT = 0;
    if ((r.backT != null && r.t >= r.backT) || r.looseT > 1) { r.backT = null; r.looseT = 0; if (!p.busy()) { p.stun = 0; atFeet(p); } else r.backT = r.t + 0.2; }
    const w = r.wp[r.wi]; if (len(w[0] - p.x, w[1] - p.y) < 1.5) r.wi = (r.wi + 1) % r.wp.length;
    const w2 = r.wp[r.wi], dx = w2[0] - p.x, dy = w2[1] - p.y, dl = len(dx, dy) || 1; T.x = dx / dl; T.y = dy / dl;
    if (r.t < 20) return null;
    return done({ o: `the computer in 20 s: ${r.slides} slides, ${r.chal || 0} standing challenges · won the ball ${r.wins} times · ${r.fouls} foul${r.fouls === 1 ? '' : 's'}`, hold: 0.4 });
  }
  function ttTests() {
    return [
      ttTest('TT1', 'a slide that misses', 'SHOOT with the stick pushed away from him: he slides along the grass, gets up, and only then can he play again', { kind: 'miss', me: [50, 34], from: [58, 40], to: [72, 40], v: 3, stick: [0, -1] }),
      ttTest('TT2', 'a slide that wins the ball', 'he runs straight at you; SHOOT at 3.2 m, stick idle: the slide wins it - how soon is he up and away?', { kind: 'win', me: [50, 34], from: [60, 34], to: [30, 34], v: 4.6, at: 3.2 }),
      ttTest('TT3', 'SHOOT mashed 10 times in 5 s', 'a dribbler shuttles just in front of you; the Lab presses SHOOT every 0.5 s with the stick up / down in turn (slides that miss): how many slides come out?', { kind: 'mash', me: [50, 34], from: [53, 34], to: [57, 34], v: 2.5 }),
      ttTest('TT4', 'a standing challenge that misses', 'he walks past 1.2 m away; PASS as he comes (the Lab makes it miss), then PASS mashed every 0.1 s: the stumble and the reset', { kind: 'chal', btn: 'pass', me: [50, 34], from: [57, 32.8], to: [40, 32.8], v: 2.5 }),
      ttTest('TT5', 'the computer tackling you (20 s)', 'you dribble round a square at running pace; two computer defenders press you with the match AI: how often do they slide?', { cpu: true, maxT: 21 }),
    ];
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
    add('AR', 't-020 · ARCADE GETS INTENSE', 'ARCADE only (these tests play it; CLASSIC is untouched): the ball comes back off invisible boards along the bylines instead of going out for a goal kick / corner (t-026: the touchlines are throw-ins again) - lively, popping up - and the team AI attacks those rebounds in the air; the SP meter fills faster plus a little for the big moments; quick restarts after a goal.', arTests());
    add('OF', 't-024 · OFFSIDE', 'IFAB Law 11, simplified, in every match: offside when a team-mate plays it - in their half, past the ball and their second-last man (level is onside) - and only if he then plays it. None from a throw-in, a corner or a goal kick. The call: OFFSIDE!, the man marked, their quick free kick where he played it. The computer waits on the last man\'s shoulder; your pass marker goes red on an offside man.', ofTests());
    add('RS', 't-029 · SET-PIECE SETUP', 'Every restart gets a short setup, as on TV: the whistle / flag and a caption, the players JOG into the restart\'s shape (anyone too far is moved under a quick TV wipe, never in plain sight), the taker walks up and places the ball, then you aim / the computer takes it. One time per kind, CLASSIC and ARCADE (quicker); your own set piece: PASS / SHOOT / LOB skips to aiming once the shape is mostly in.', rsTests());
    add('CP', 't-011 · CURVING SPECIAL PASS', 'Hold SPECIAL and press PASS / THROUGH / LOB with a bar in the bank: the pass bends round the man on the straight line (CURLER, OUTSIDE CURL, BANANA LOB) and spends one bar. Test Lab only for now.', cpTests());
    add('LB', 't-008 · LOB REMAKE + AERIAL BATTLE', 'Hold LOB: a landing ring you walk with the stick, let go = the kick, landing on the ring. A tap is still the instant lob. The ring settles on a team-mate, who times his run. A clear contest at the drop = the AERIAL BATTLE: MASH! SHOOT against the computer.', lbTests());
    add('LV', 't-019 · LOB AIM: AUTO / RING', 'Two versions to compare (Pause > Options > LOB AIM). AUTO: LOB goes to the team-mate your arrow points at (the nearest free one in a ~38° cone), landing a step ahead on his run; hold = a little longer, tap = the quick one, nobody there = into space. RING: the ring without the arc, slower and steadier. Both: the camera no longer rides up with a lob.', lvTests());
    add('LC', 't-005 · LOB + CHIP, STEP 1', 'Lobs that really reach their height, a shadow that shrinks as the ball climbs, a landing ring that stays until someone touches the ball, and their keeper reading a lob over him (a delay by level).', lcTests());
    add('KF', 't-016 · KEEPER FACING + BLOCKED PATHS', 'Luca\'s Bug Watch marks: a keeper never shows his back to a ball within 6 m (KF1-3: the biggest angle between his facing and the ball), and a man with someone in his straight line steps round him instead of standing still (KF4-5).', kfTests());
    add('GH', 't-031 · KEEPER HANDS', 'The dive grabs it: from the contact frame the ball is drawn in his gloves through the dive, the landing and the get-up (no snap); a parry leaves them on contact. With it in his hands he carries it: you inside your box (6 s), the computer\'s keeper walks it out a few steps after a calm catch. kcarry / kcarryrun (PixelLab batch 21) when they\'re in the kits, the hold pose with a walk bob until then.', ghTests());
    add('GKX', 't-007 · KEEPER SAVES', 'Their keeper reads where the shot crosses him (side and height) and how hard it is: holds the soft ones, dives low or high, jumps, tips over the bar, pushes it round the post, punches a crowded lob. A touch out of play is a corner.', gkxTests());
    add('TT', 't-018 · TACKLE REWORK', 'The slide really slides (~3.6 m) and he gets up after: a miss costs ~1.4 s, a won one is up in 0.3 s. A missed standing challenge leaves him off balance 0.6 s and he can\'t go again for 1 s. No presses kept from the grass. The computer plays by the same rules.', ttTests());
    add('TK', 't-010 · TAP KICK', 'SHOOT tapped (let go within 0.15 s) = a snappy, low stab along your arrow that dies on the grass: a close-range finish. Held = the power shot as before. In the keeper\'s reach he holds most; out of it, it goes in. (On in the Test Lab only.)', tkTests());
    add('KP', 't-017 · KEEPER 1v1 + TRACKING', 'Their keeper against a striker who tries to walk round him (straight at him, past his side, a tap into the empty net) and one walking the ball across the edge of the box. GOAL = he was walked round; he should block, smother or take it off his feet, and stay on the angle smoothly.', kpTests());
    add('GK', 'v0.9.1 · KEEPER AI', 'Their keeper with the real AI in 11 situations: walking up with the ball far away, the angle, 1v1s, sweeping, back passes, lobs. The yellow diamond is where he wants to be; the label says what he is doing.', gkTests());
    add('SM', 'v0.8.9 · SPECIAL MOVES (ROUGH RIGS)', 'Placeholders made from our PixelLab frames + effects until the real ones come from PixelLab: 3 aerial specials, 3 keeper special saves with their cut scene. v0.9.0: the keeper saves stop normal shots too (SM8-11).', [
      smAir('SM1', 1), smAir('SM2', 2), smAir('SM3', 3),
      smSave('SM4', 1, 1, [84, 34], 'win'), smSave('SM5', 2, 2, [85, 31], 'win'), smSave('SM6', 3, 3, [84, 37], 'win'), smSave('SM7', 1, 3, [84, 34], 'lose'),
      normSave('SM8', 1), normSave('SM9', 2), normSaveYou('SM10', true), normSaveYou('SM11', false),
    ]);
    add('GP', 't-013 · GOAL PHYSICS', 'The goal comes alive (GOAL_PHYS: on in the Lab, off in matches): a net with give - it bulges, slows the ball, holds it a beat, drops it - round posts and bar with real rebounds (glancing carries on, square comes back), and a parry or a broken guard that loops the ball UP for a man following in.', gpTests(smSave));
    add('NT', 't-023 / t-025 · THE LIVING NET', 'NET_FX - in every match since t-025: the PixelLab net on a mesh that stretches and wobbles, harder = deeper (a special: drastic, more each level), the ball rolls round in the netting for a second or two before it drops, an LV3 rips through it. Rami has a line for the rip and for a big stretch. NT6: a match goal with its celebration and TV replay - the net (and an LV3\'s hole) in the replay.', ntTests());
    add('AS', 't-014 · AERIAL SPECIALS BY THE ARC', 'Two per level, picked by how the ball arrives: LV1 AIR BLAZE (chest-high drop) / TIDE CUTTER (low driven cross), LV2 SKY THUNDER (over his head) / CYCLONE HEEL (behind the shoulder), LV3 PHOENIX (very high) / METEOR DRIVE (sky-high loop). The Lab presses SPECIAL as it reaches you.', [
      asTest('AS1', 'LV1 · a chest-high drop → AIR BLAZE', 'comet volley', { lv: 1, from: [99, 6], z: 1.3, T: 1.35 }),
      asTest('AS2', 'LV1 · a low driven cross → TIDE CUTTER', 'knee-slide side volley (the low popup window)', { lv: 1, from: [100, 14], z: 0.6, T: 0.75 }),
      asTest('AS3', 'LV2 · dropping over his head → SKY THUNDER', 'overhead kick', { lv: 2, from: [99, 6], z: 2.2, T: 1.5 }),
      asTest('AS4', 'LV2 · behind the shoulder → CYCLONE HEEL', 'spinning heel kick: the ball comes from behind him', { lv: 2, from: [80, 22], z: 1.4, T: 1.0 }),
      asTest('AS5', 'LV3 · a very high ball → PHOENIX', 'the leap and dive', { lv: 3, from: [99, 6], z: 1.8, T: 1.5 }),
      asTest('AS6', 'LV3 · a sky-high loop → METEOR DRIVE', 'somersault axe kick', { lv: 3, from: [96, 8], z: 1.8, T: 2.4 }),
    ]);
    add('AB', 't-034 · AERIAL BATTLES', 'Only in their box (outside: the quick duel). The height it is met at picks it: HEADER v HEADER at head height, VOLLEY v VOLLEY at the waist. MASH SPACE! (or your SHOOT key): every press is one step of the bar your way, every one of the computer\'s one step back, from where the head start puts it; the end of the bar wins outright. Attacker wins: a header / volley at goal at a shot\'s pace, the defender floored ~1.3 s. Defender wins: cleared high and long.', abTests());
    add('HV', 't-022 · CHARGED HEADERS + VOLLEYS', 'Hold SHOOT as the ball comes in, let go as it reaches you: the hold is the power (like a ground shot), the timing keeps it - just before the contact = full power and on target, early or late = weaker and wilder, too much = over the bar. A tap is today\'s header / volley. A well-timed one: a white flash, a few sparks, a tiny hit-stop.', hvTests());
    add('KS', 't-014 · KEEPER SPECIAL SAVES BY THE SHOT', 'Their keeper has a special save ready; the shot picks the move: a lob → kleap, straight → kblock, wide → kdivecatch, too strong to hold → ktip (a corner). Who wins stays as before.', ksTests());
    add('KC', 't-028 · THE KEEPER CLASH', 'With a special save on, the keeper gets to anything on target (a dash across his goal). A special shot against it is held on his gloves for a beat - sparks, slow-mo, POWER AGAINST POWER (ENTER skips) - then power decides: HELD, BOUNCES OFF (parried or tipped), HANDS BLOWN AWAY (goal), or THE BODY (blasted into the net with it).', kcTests());
    add('CS', 'CUT SCENES', 'Every cut scene in full (the Lab normally skips them). R plays it again. Rate how it looks; ENTER moves the menus on.', buildCuts());
    add('BW', 't-021 · BUG WATCH CHECKS', 'Each new Bug Watch check tripped on purpose (the Lab breaks the game for it: a frozen clock, a ball shot through a keeper who can\'t touch it, a man who won\'t move...). BW9: normal play, where none of them may trip. Nothing here is saved as a clip.', bwTests());
    add('CL', 'BUG WATCH · CLIPS', 'Clips the bug watch kept (they load from the Lab\'s database on claude.ai), real bugs first. 1 = the game was right · 2 = it\'s a bug.', [{ id: 'CL0', group: 'CL', name: 'no clips here yet', sub: 'the bug watch hasn\'t sent any clips to the Lab yet', kind: 'clip', doc: null,
      setup(r) { cast([]); r.fired = true; r.human = m.home.players[9]; }, check() { return { o: 'NOTHING TO WATCH YET' }; } }]);   // (t-021: a human to draw the cursor on - with none the Lab threw in drawCursor, on main too)
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
    if (LAB.lobAim0 == null) LAB.lobAim0 = LOB_AIM_MODE;                        // t-019: LB / LV set LOB AIM per test; every other test plays the picked one
    LOB_AIM_MODE = LAB.lobAim0; LOB_AIM.camOld = LOB_AIM.ringOld = false; Object.assign(m, { lobCamBlend: null, camLead: undefined, camLeadOn: false });
    window.__labPace = sc.pace || null;                                         // t-020: the AR tests play ARCADE (core.js paceK); every other test CLASSIC
    if (m.aerial && m.camTarget === m.aerial.cam) m.camTarget = null; Object.assign(m, { aerial: null, lobAim: null, slowMo: 0 }); Object.assign(Input.touch, { x: 0, y: 0, btn: {} });
    if (LAB.undo) { for (const f of LAB.undo) f(); LAB.undo = null; }            // t-021: the BW cases break the game on purpose - put it back
    window.__labWatch = window.__bwNoStore = window.__labClock = false;         // (Bug Watch watches only in the BW cases)
    window.HC2_NO_OFFSIDE = !(sc.group === 'OF' || sc.realAi);                 // t-024: offside in the OF group and the real-AI tests (the rest are half-team moments)
    Object.assign(m, { offSide: null, offFlag: null, offLast: null, offGK: null, passAim: null });
    sc.setup(r);
    m.human = r.human; m.camX = m.camY = undefined;
    render();
  }
  function finish(res) { const r = LAB.run; r.result = res; r.endT = r.t + (res.hold ?? 0.9);
    if (/^(GH|GKX|KP|KC)$/.test(r.sc.group) && res.o) res.o += r.tilt ? ` · body at contact (${r.tilt.mv}): ${r.tilt.deg == null ? 'as PixelLab drew it' : r.tilt.deg + '° from flat'}` : ' · body upright, as PixelLab drew it (no side dive)';   // t-033 (90° = upright: the old handstand)
    render(); }
  // t-033: how his body is drawn on the frame his gloves meet the ball (GK_HAND_HIT) - the first dive / special save of the test
  function tiltTrack(r) {
    if (r.tilt) return;
    for (const k of [m.home.players[0], m.away.players[0]]) {
      if (k.state !== 'dive' && !k._rigged) continue;
      const nm = (k.spr.frame && k.spr.frame.name) || '', mv = nm.replace(/-\d+$/, ''), c = GK_HAND_HIT[mv.replace(/-\w+$/, '')], i = frameNo(k.spr);
      if (c != null && i != null && i >= c) { r.tilt = { mv, deg: k.bodyTilt() }; return; }
    }
  }
  function sample() {
    const r = LAB.run, b = m.ball;
    if (/^(GH|GKX|KP|KC)$/.test(r.sc.group)) tiltTrack(r);
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
    LAB.kickoff0 = kickoff;                                                    // (t-025 NT6: the real kick-off, once, after its goal replay)
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
    m.restart = function (kind, team, x, y, note, ...rest) {
      const r = LAB.run; if (r && !r.out) { r.out = kind; r.outNote = note || ''; }
      if (r && r.sc.realRestart) return restart(kind, team, x, y, note, ...rest);   // t-029 RS: the game's own restart, setup and all
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
    m.gpPop = function (gk, kind, spd) { const r = LAB.run; if (r && r.sc.noPop) return false;   // (t-028 KC: the clash's own outcome, no GOAL_PHYS pop-up on top)
      if (!(r && r.sc.forcePop)) return gpPop(gk, kind, spd); const R = Math.random; let first = true;
      Math.random = () => (first ? (first = false, 0) : R()); try { return gpPop(gk, kind, spd); } finally { Math.random = R; } };
    const kTouch = m.keeperTouch.bind(m);                                      // t-013 GP7: his touch made a plain parry (t-007's keeper may hold it or turn it round the post)
    m.keeperTouch = function (p, pbx) { const r = LAB.run, h = kTouch(p, pbx); return h && r && r.sc.forceParry ? 'parry' : h; };
    const clash = m.clash.bind(m);                                             // v0.8.9 SM tests: the save made to win / lose, so each one can be seen
    // (t-028: a special v his special save is a clash now - the old forces name its outcome: win = HELD, lose = THE BODY,
    // hand = a hand to it (tipped for a corner); 'mid' = the dice in the middle, so the band is the powers' own: the KC tests)
    m.clash = function (gk) { const r = LAB.run, f = r && r.sc.force; if (!f) return clash(gk); const R = Math.random; let n = 0;
      m.clashForce = f === 'lose' && r.sc.forcePop ? 'hands' : { win: 'held', lose: 'body', hand: 'tip', tip: 'tip' }[f] || null;   // (GP8: the guard broken, the ball loops up - a pop-up is the hands' outcome, never the body's)
      Math.random = () => (f === 'mid' || f === 'tip' ? 0.5 : f === 'win' ? 0 : f === 'hand' && n++ ? 0 : 0.9999); /* (t-007 'hand': beaten, then a hand to it) */ try { return clash(gk); } finally { Math.random = R; m.clashForce = null; } };
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
      $('bw-why').innerHTML = `<b>${esc(BW_ERR.has(d.code) ? 'CODE ERROR' : d.sev === 'bug' ? 'LOOKS LIKE A BUG' : d.sev === 'flag' ? 'YOUR FLAG' : d.sev === 'perf' ? 'SPEED' : 'LOOKS ODD')}</b> ${esc(d.why)}<br>${BW_ERR.has(d.code) && d.stack ? `<code style="display:block;white-space:pre-wrap;word-break:break-all;max-height:9em;overflow:auto">${esc(String(d.stack).slice(0, 900))}</code>` : ''}<span>${esc(d.home)} ${esc(d.score)} ${esc(d.away)} · ${esc(d.mode)} · ${esc(d.weather || 'clear')} · ${esc(d.game)}</span>${d.claude ? `<br><i>CLAUDE${d.status === 'fixed' ? ' (FIXED IN v0.8.7)' : ''}: ${esc(d.claude)}</i>` : ''}${d.review ? `<br><em>RATED: ${esc(d.review.verdict)}${d.review.note ? ' · ' + esc(d.review.note) : ''}</em>` : ''}`; }
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
