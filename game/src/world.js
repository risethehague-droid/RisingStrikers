'use strict';
// HC2 Football · world.js: the stadium and pitch drawing, goals, sky and weather, the per-frame render, ball trail
// (split out of game.js in v0.9.5 - load order and lanes: src/README.md)

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

// ---------------------------------------------------------------- Match methods: world
hc2Mix(Match, {

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
      if (netPlain()) continue;                                                 // (t-025: touch screens draw the images whole - netDraw)
      if (nfxOn() && this.renderer.type === Phaser.WEBGL) this.netMesh(this.nets[side]);   // t-023 NET_FX: the art on a mesh (canvas: t-013's cells)
      else if (netOn()) this.netCells(this.nets[side]);                         // t-013: cut now, not on the first goal (~30 ms once)
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
  },
  // t-013 THE NET WITH GIVE (Luca: "slight give on a net so it can dramatically hit the net"): the existing net art
  // (props atlas goal-*-net_back / net_near) is cut into small cells that move with the bulges the ball makes (ball.js
  // gpNet), so the mesh itself bends and ripples - no new art. At rest the plain images show and the cells sleep.
  netDraw() {
    // t-025: touch screens (the paused phone version) keep v0.12.0's look - the net images ripple whole (ball.js
    // netRipple; core.js netPlain says why). The net still catches the ball as on a computer.
    if (netPlain()) return;
    const fx = nfxOn();
    for (const side of ['L', 'R']) {
      const n = this.nets && this.nets[side], L = this.netS[side]; if (!n) continue;
      if (fx && !n.meshes && this.renderer.type === Phaser.WEBGL) this.netMesh(n);   // t-023 NET_FX (switched on after the goals were built)
      if (fx && n.meshes) { this.netWarp(n, side, L); continue; }
      if (n.meshOn) { for (const o of n.meshes) { o.mesh.setVisible(false); } for (const im of n.imgs) im.setVisible(true); n.meshOn = false; }   // (switched off: t-013's cells again)
      if (!L.length) { if (n.cellsOn) { for (const c of n.cells) c.img.setVisible(false); for (const im of n.imgs) im.setVisible(true); n.cellsOn = false; } continue; }
      if (!n.cells) this.netCells(n);
      if (!n.cellsOn) { for (const c of n.cells) c.img.setVisible(true); for (const im of n.imgs) im.setVisible(false); n.cellsOn = true; }
      const B = this.netBulges(L), M = fx ? NFX.drawMax : GP.drawMax;          // (t-023 canvas fallback: the bigger stretch too)
      for (const c of n.cells) {
        let dx = 0, dy = 0;
        for (const q of B) {
          const rx = c.x - q.X, ry = c.y - q.Y, r2 = rx * rx + ry * ry, a = q.d * Math.exp(-r2 / q.s2);   // the bulge: deepest where the ball is
          dx += a * q.sx; dy += a * q.sy;
          if (q.rip > 0.05) { const r = Math.sqrt(r2); if (r < q.front) { const w = q.rip * Math.sin(2 * Math.PI * (r - q.front) / GP.ripL) * Math.exp((r - q.front) / (2 * GP.ripL)); dx += w * q.ux; dy += w * q.uy; } }   // and a ripple running out
        }
        const m = Math.hypot(dx, dy); if (m > M) { dx *= M / m; dy *= M / m; }
        c.img.setPosition(c.x0 + Math.round(dx), c.y0 + Math.round(dy));
      }
    }
  },
  // the bulges on one goal's net, in screen px: where (X, Y), how deep (d m, s* px per m), the ripple running out
  netBulges(L) {
    const k = nfxOn() ? NFX.sigK : 0.6;                                          // (t-023: a deeper stretch pulls a wider patch of mesh with it)
    return L.map(q => { const u = Math.hypot(q.sx, q.sy) || 1;
      return { X: wx(q.hx, q.hy), Y: wy(q.hy, q.hz) - 9, d: q.d, sx: q.sx, sy: q.sy, ux: q.sx / u, uy: q.sy / u, s2: 2 * ((GP.netSig + k * Math.abs(q.d)) * PX_X) ** 2,
        front: GP.ripV * q.age, rip: GP.ripPx * Math.min(1, q.peak / 0.25) * Math.exp(-q.age / GP.ripTau) }; });
  },
  // t-023 NET_FX (Luca: "add more polygons or whatever to the net so it makes it more flowy"): the same PixelLab net art
  // (goal-*-net_back / net_near), now on a WebGL mesh of NFX.seg-px triangles that share their corners, so the art
  // stretches smoothly instead of cells sliding apart: a deep bulge pulls the threads long, nothing is redrawn. Empty
  // cells get no triangles. At rest the plain images show and the meshes sleep. Each vertex: rest (x0, y0) in the image,
  // its world point (X, Y).
  netMesh(n) {
    const Sg = NFX.seg, M = Phaser.Geom.Mesh; n.meshes = [];
    for (const im of n.imgs) {
      const f = im.frame, ss = f.data && f.data.trim ? f.data.spriteSourceSize : { x: 0, y: 0 }, w = f.cutWidth, h = f.cutHeight, TW = f.source.width, TH = f.source.height;
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d');
      g.drawImage(f.source.image, f.cutX, f.cutY, w, h, 0, 0, w, h); const A = g.getImageData(0, 0, w, h).data;
      const mesh = this.add.mesh(im.x, im.y, im.texture.key).setDepth(im.depth).setVisible(false);
      mesh.setOrtho(mesh.width, mesh.height); mesh.hideCCW = false;             // (orthographic: a vertex's x, -y are its pixel offsets from the mesh;
      mesh.depthSort = () => mesh;                                              // netWarp sets them straight onto vx / vy each frame, so Phaser's own
                                                                                // per-frame projection and depth sort of ~5000 flat triangles are skipped)
      const cols = Math.ceil(w / Sg), rows = Math.ceil(h / Sg), V = [];
      for (let j = 0; j <= rows; j++) for (let i = 0; i <= cols; i++) {
        const px = Math.min(i * Sg, w), py = Math.min(j * Sg, h), x0 = ss.x + px, y0 = ss.y + py;
        const v = new M.Vertex(x0, -y0, 0, (f.cutX + px) / TW, (f.cutY + py) / TH); v.x0 = x0; v.y0 = y0; v.X = im.x + x0; v.Y = im.y + y0; V.push(v);
      }
      const faces = [];
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        let any = false; for (let y = j * Sg; y < Math.min(h, (j + 1) * Sg) && !any; y++) for (let x = i * Sg; x < Math.min(w, (i + 1) * Sg); x++) if (A[(y * w + x) * 4 + 3]) { any = true; break; }
        if (!any) continue;
        const a = V[j * (cols + 1) + i], b = V[j * (cols + 1) + i + 1], c = V[(j + 1) * (cols + 1) + i], d = V[(j + 1) * (cols + 1) + i + 1];
        for (const F of [new M.Face(a, c, b), new M.Face(b, c, d)]) { F.cx = (a.X + d.X) / 2; F.cy = (a.Y + d.Y) / 2; faces.push(F); }
      }
      mesh.faces = faces.slice(); mesh.vertices = V; mesh.dirtyCache[9] = -1;
      n.meshes.push({ mesh, im, faces, V, torn: false });
    }
  },
  // move every vertex with the bulges (as t-013's cells: deepest where the ball is, a ripple running out), and an LV3
  // tear: the triangles over the hole go (it opens in NFX.holeT s, as wide as the ball punched it), the torn edges
  // peel back around it and flutter, the mesh round it stays stretched; at the restart netStep drops netRip and the
  // net is whole again
  netWarp(n, side, L) {
    const T = this.netRip && this.netRip.side === side ? this.netRip : null;
    if (!L.length && !T) {
      if (n.meshOn) { for (const o of n.meshes) { o.mesh.setVisible(false); if (o.torn) { o.mesh.faces = o.faces.slice(); o.mesh.dirtyCache[9] = -1; o.torn = false; } } for (const im of n.imgs) im.setVisible(true); n.meshOn = false; }
      return;
    }
    if (!n.meshOn) { for (const o of n.meshes) o.mesh.setVisible(true); for (const im of n.imgs) im.setVisible(false); n.meshOn = true; }
    const B = this.netBulges(L), Mx = NFX.drawMax;
    let H = null;
    if (T) { const age = Math.max(0, (this.gpT || 0) - T.t), sc = PX_X * scaleAt(T.hy);
      H = { X: wx(T.hx, T.hy), Y: wy(T.hy, T.hz) - 9, R: NFX.holeR * sc * Math.min(1, age / NFX.holeT), R0: NFX.holeR * sc, sx: T.sx, sy: T.sy, d: T.d,
        s2: 2 * ((GP.netSig + NFX.sigK * T.d) * PX_X) ** 2, fl: Math.sin(age * 2 * Math.PI * NFX.flapHz) * Math.exp(-age / 0.8) }; }
    for (const o of n.meshes) {
      for (const v of o.V) {
        let dx = 0, dy = 0;
        for (const q of B) {
          const rx = v.X - q.X, ry = v.Y - q.Y, r2 = rx * rx + ry * ry, a = q.d * Math.exp(-r2 / q.s2);
          dx += a * q.sx; dy += a * q.sy;
          if (q.rip > 0.05) { const r = Math.sqrt(r2); if (r < q.front) { const w = q.rip * Math.sin(2 * Math.PI * (r - q.front) / GP.ripL) * Math.exp((r - q.front) / (2 * GP.ripL)); dx += w * q.ux; dy += w * q.uy; } }
        }
        if (H) {
          const rx = v.X - H.X, ry = v.Y - H.Y, r2 = rx * rx + ry * ry, r = Math.sqrt(r2) || 1, a = H.d * 0.6 * Math.exp(-r2 / H.s2);   // the mesh round the hole stays stretched back
          dx += a * H.sx; dy += a * H.sy;
          if (r < H.R0 * 2.2 && H.R > 0) { const e = (NFX.flap * (H.R / H.R0) + 3 * H.fl) * Math.max(0, 1 - r / (H.R0 * 2.2)); dx += rx / r * e; dy += ry / r * e; }   // the torn edges peel open
        }
        const m = Math.hypot(dx, dy); if (m > Mx) { dx *= Mx / m; dy *= Mx / m; }
        v.x = v.x0 + Math.round(dx); v.y = -(v.y0 + Math.round(dy)); v.vx = v.x; v.vy = -v.y;
      }
      const tear = !!(H && H.R > 1);
      if (tear) { o.mesh.faces = o.faces.filter(F => (F.cx - H.X) ** 2 + (F.cy - H.Y) ** 2 > H.R * H.R); o.torn = true; }
      else if (o.torn) { o.mesh.faces = o.faces.slice(); o.torn = false; }
    }
  },
  // cut the two net images of one goal into GP.cell-pixel cells (empty ones skipped; each overlaps the next by a pixel so
  // no seams open as they move apart), hidden until the net moves
  netCells(n) {
    const C = GP.cell, src = this.textures.get('props').getSourceImage(); n.cells = [];
    for (const im of n.imgs) {
      const f = im.frame, ss = f.data && f.data.trim ? f.data.spriteSourceSize : { x: 0, y: 0 }, w = f.cutWidth, h = f.cutHeight;
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d');
      g.drawImage(src, f.cutX, f.cutY, w, h, 0, 0, w, h); const A = g.getImageData(0, 0, w, h).data;
      for (let y = 0; y < h; y += C) for (let x = 0; x < w; x += C) {
        let any = false; for (let j = y; j < Math.min(h, y + C) && !any; j++) for (let i = x; i < Math.min(w, x + C); i++) if (A[(j * w + i) * 4 + 3]) { any = true; break; }
        if (!any) continue;
        const img = this.add.image(im.x, im.y, im.texture.key, f.name).setOrigin(0, 0).setDepth(im.depth).setCrop(ss.x + x, ss.y + y, C + 1, C + 1).setVisible(false);
        n.cells.push({ img, x0: im.x, y0: im.y, x: im.x + ss.x + x + C / 2, y: im.y + ss.y + y + C / 2 });
      }
    }
  },
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
  },
  weatherTick(dt) {
    const F = this.flakes, g = this.wxG; if (!g) return; g.clear(); if (!F) return;
    const rain = this.wxKind === 'rain';
    g.fillStyle(0xffffff, rain ? 0.42 : 0.85); g.lineStyle(1, 0xdde6f4, 0.5);
    for (const f of F) {
      if (rain) { f.x -= 160 * dt * f.s; f.y += 760 * dt * f.s; g.lineBetween(f.x, f.y, f.x - 3, f.y + 12 * f.s); }
      else { f.p += dt * 1.6; f.x += Math.sin(f.p) * 22 * dt; f.y += 46 * dt * f.s; const z = f.s > 1.1 ? 3 : 2; g.fillRect(Math.round(f.x), Math.round(f.y), z, z); }
      if (f.y > VIEW_H + 10) { f.y = -12; f.x = Math.random() * (VIEW_W + 120); } if (f.x < -10) f.x += VIEW_W + 20; else if (f.x > VIEW_W + 10) f.x -= VIEW_W + 20;
    }
  },
  arenaName() { const a = RULE_OPTS.arena.find(o => o[0] === (this.mset && this.mset.arena)); return a ? a[1] : 'HET KLEINE LOO'; },

  // ---------- drawing
  render(dt) {
    const b = this.ball, cam = this.cameras.main;
    for (const p of this.all) p.draw();
    if (this.ref) this.ref.draw();
    if (this.netS) this.netDraw();                                              // t-013: the net's give (t-025: NET_FX, every match)
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
    this.ballSh.setPosition(Math.round(X), Math.round(Y - 7)).setDepth(Y - 40).setAlpha(clamp(1 - b.z / 12, 0.65, 1)).setScale(ballPx() * ballS() / 24 * shadowK(b.z));   // t-005: it shrinks as the ball climbs (ball.js shadowK); v0.10.3 (PR #8's call 4): fades less, so a high ball's shadow stays easy to see
    // camera: follow the ball, a little ahead of it
    // t-007 (Luca: "going over the goal after getting a hand to a lob or shot ... make the camera follow that lob"): a ball
    // a keeper sent up and out (ball.js gkDeflect sets b.camUp), or an open-play lob, high in the air: the camera rides up
    // with it (its height counts 85%, not 30%) with less lead, until it comes down, someone has it, or it's out and back
    if (b.camUp && (b.owner || (b.z < 0.3 && b.vz <= 0))) b.camUp = false;
    // t-019 (Luca 25 Oct: "the camera is janky [...] make it so the camera doesnt follow - try make it smooth"): an
    // open-play lob no longer rides up - the camera stays on the play, its normal follow. Only t-007's ball a keeper sent
    // up and out still does. And while a lob is on, the follow's lead (14 px per m/s of the ball) eases at LOB_AIM.camLead
    // instead of jumping with the ball's speed at the kick and at the drop; once the lob is over it eases back to the
    // normal, instant lead before handing over. (LOB_AIM.camOld = the old camera: the Lab's LV5 'before'.)
    const old = LOB_AIM.camOld, rideUp = !b.owner && (b.camUp || (old && b.lob)) && b.z > 0.5;
    const rawL = b.vx * (rideUp ? 9 : 14), lobOn = !old && ((b.lob && !b.owner) || (this.camLeadOn && Math.abs((this.camLead ?? rawL) - rawL) > 4));
    if (lobOn) this.camLead = (this.camLead ?? rawL) + (rawL - (this.camLead ?? rawL)) * (1 - Math.exp(-dt * LOB_AIM.camLead)); else this.camLead = rawL;
    this.camLeadOn = lobOn;
    let tx = X + this.camLead, ty = wy(b.y, b.z * (rideUp ? 0.85 : 0.3)) - 40 - clamp(1 - b.y / 20, 0, 1) * 170;
    const LB = this.lobCamBlend;                                                // t-019 RING: the aim's framing hands over to the follow
    if (LB) { if (old) this.lobCamBlend = null; else { LB.t += dt; const s = clamp(LB.t / LOB_AIM.camBlend, 0, 1), e = s * s * (3 - 2 * s);
      tx = LB.x + (tx - LB.x) * e; ty = LB.y + (ty - LB.y) * e; if (s >= 1) this.lobCamBlend = null; } }
    const fs = this.foulScene;
    if (fs) { const q = fs.card ? fs.by : fs.victim; tx = wx(q.x, q.y); ty = wy(q.y) - 70 - clamp(1 - q.y / 20, 0, 1) * 120; }   // v0.8: the camera stays on the incident
    const spc = this.setPiece;
    if (spc && !spc.kicked && this.hasHuman(spc.team) && this.aimPt) {          // your set piece: frame the ball AND the aim cursor
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
    this.drawCursor();                                                           // t-009: bigger, ink outline, pop, kit colour (ui.js)
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
  },
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
  },
});
