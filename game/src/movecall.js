'use strict';
// HC2 Football · movecall.js: the MOVE CALL - every special move's name pops up big near the top of the screen, in
// lettering, colours and motion that match its element (fire, thunder, shadow, rainbow, tornado ...).
// (load order and lanes: src/README.md; loaded after ui.js, it wraps Match.say and Match.render's caller)
//
// Luca, 31 Oct 2026 12:49: "FOR ALL special moves PASSES SHOTS DRIBBLEs etc, generate cool text (names) that matches
// the vibe / element / theme that shows up above the screen kinda".
// How real football and other games do it (words only): football has no on-screen names, but the TV graphics that
// flash a player's name are big, short and quick. The reference games are the specials games: Inazuma Eleven shouts
// every hissatsu's name in its own coloured, animated lettering (fire names burn, ice names frost over); Captain
// Tsubasa's drive shots get a title card; Mario Strikers flashes the Mega Strike's name; fighting games (Street
// Fighter's SUPER, Tekken's RAGE) slam a word in, hold it about a second and clear it so play stays readable.
// So: one name at a time, in for ~0.25 s, held ~1.1 s, out in ~0.35 s, top-centre (above the action, under nothing
// important), and it waits while a full-screen cut-in is on (the cut-in says the name itself) so it never stacks.
//
// HOW IT HOOKS IN (no change to the moves' own code, so moves on open branches work the day they merge):
// every special already calls this.say('<NAME>!', '<team · level>') for its banner. When the big text (without the
// '!') is a name in MOVE_THEME below, the plain yellow banner is skipped and the MOVE CALL plays instead, with the small
// line as its caption. A save written as say('', 'IRON WALL! · ...') (PR #77) and a keeper flair line say('', 'SKY
// SNATCH!') (PR #76) are matched too. A new move = one line in MOVE_THEME (its name and an element). A move can also
// call this.moveCall(name, caption, theme) itself.
// The lettering is the game's own font (Press Start 2P); the only images are PixelLab effects already in the fx
// atlas (flames, bolts, sparkles, dust, whoosh ...), tinted. Off: MOVE_CALL.on = false brings the old banner back.

const MOVE_CALL = { on: true, y: 0.135, size: 42, hold: 1.1, wait: 1.8 };

// The elements. grad = the letters' fill, top to bottom; stroke / glow = the outline and the soft light around it;
// enter / idle / exit = how the letters come in, live and leave (moveCallTick); fx = PixelLab effect frames around the
// word, tint = their colour; tall = letters stretched up (thin, sharp names), slant = degrees the word leans.
const MC_THEMES = {
  fire:    { grad: ['#fffbd0', '#ffd23c', '#ff7a1e', '#e0281e'], stroke: '#3a0606', glow: '#ff5a14', enter: 'slam', idle: 'flicker', exit: 'burn', fx: ['flame', 'flame2'], slant: -5 },
  thunder: { grad: ['#ffffff', '#c8f4ff', '#50b4ff', '#1e3cc8'], stroke: '#06123a', glow: '#64c8ff', enter: 'strike', idle: 'zap', exit: 'shatter', fx: ['bolt'], tint: 0xc8f0ff, slant: -3 },
  phoenix: { grad: ['#fff8c8', '#ffd84a', '#ff6ab4', '#9a28ff'], stroke: '#2a0638', glow: '#ffb43c', enter: 'rise', idle: 'pulse', exit: 'up', fx: ['flamePurple', 'fwGold'], size: 1.08 },
  sun:     { grad: ['#ffffff', '#fff08c', '#ffb41e', '#e0641e'], stroke: '#3a1a06', glow: '#ffe678', enter: 'slam', idle: 'pulse', exit: 'up', fx: ['fwGold', 'ring'], tint: 0xffe678 },
  water:   { grad: ['#ffffff', '#b4f4ff', '#3ed8f0', '#1e64b4'], stroke: '#061e3a', glow: '#3ed8f0', enter: 'zip', idle: 'wave', exit: 'zip', fx: ['whoosh'], tint: 0x8ce6ff, slant: -6 },
  wind:    { grad: ['#ffffff', '#d2ffe6', '#78e6b4', '#1e9a78'], stroke: '#06281e', glow: '#a0ffd2', enter: 'spin', idle: 'swirl', exit: 'zip', fx: ['whoosh'], tint: 0xc8ffe6 },
  cosmic:  { grad: ['#ffffff', '#ffe6b4', '#ff8c50', '#7828c8'], stroke: '#14062a', glow: '#ffb478', enter: 'meteor', idle: 'pulse', exit: 'shatter', fx: ['impactBig', 'sparks'], tint: 0xffd2a0, slant: -8 },
  iron:    { grad: ['#ffffff', '#d2d8e0', '#8c96a8', '#4a5264'], stroke: '#0c0a0e', glow: '#b4c8dc', enter: 'slam', idle: 'shine', exit: 'drop', fx: ['impact'], tint: 0xe0e8f0, size: 1.1, heavy: true },
  shadow:  { grad: ['#e6c8ff', '#9a5adc', '#46148c', '#14061e'], stroke: '#000000', glow: '#a03cff', enter: 'phase', idle: 'glitch', exit: 'vanish', fx: ['flamePurple'], tint: 0x6e28c8, tall: 1.35 },
  rainbow: { grad: ['#ffffff', '#ffffff', '#f4f0e4', '#d2c8b4'], stroke: '#0c0a0e', glow: '#ffffff', enter: 'arc', idle: 'rainbow', exit: 'up', fx: ['sparkle'], rainbow: true },
  earth:   { grad: ['#ffe6b4', '#d2a064', '#965a28', '#4a2a10'], stroke: '#1a0c04', glow: '#c8783c', enter: 'erupt', idle: 'rumble', exit: 'sink', fx: ['dust'], tint: 0xd2aa78, size: 1.05, heavy: true },
  holy:    { grad: ['#ffffff', '#fffae6', '#ffe8a0', '#e6c864'], stroke: '#5a4a1e', glow: '#fff4c8', enter: 'float', idle: 'bob', exit: 'up', fx: ['sparkle', 'ring'], tint: 0xfff4c8 },
  sakura:  { grad: ['#ffffff', '#ffe0f0', '#ff96c8', '#d2468c'], stroke: '#3a0620', glow: '#ffb4dc', enter: 'float', idle: 'wave', exit: 'zip', fx: ['confetti', 'sparkle'], tint: 0xffc8e6 },
  leaf:    { grad: ['#f0ffd2', '#b4f08c', '#50c850', '#1e6428'], stroke: '#06200a', glow: '#8cde78', enter: 'spin', idle: 'swirl', exit: 'zip', fx: ['whoosh', 'sparkle'], tint: 0xb4f08c },
  crimson: { grad: ['#ffe6e6', '#ff6e6e', '#d21e2e', '#6e0614'], stroke: '#1e0206', glow: '#ff2846', enter: 'zip', idle: 'flicker', exit: 'shatter', fx: ['flame2', 'impact'], tint: 0xff5050, slant: -10, tall: 1.15 },
  curl:    { grad: ['#ffffff', '#c8fbff', '#3ed8f0', '#1e50a0'], stroke: '#06143a', glow: '#8cf0ff', enter: 'zip', idle: 'wave', exit: 'zip', fx: ['whoosh'], tint: 0x8cf0ff, slant: -6 },
  curlGold:{ grad: ['#ffffff', '#fff08c', '#ffc81e', '#b46e1e'], stroke: '#2a1806', glow: '#ffde1e', enter: 'zip', idle: 'wave', exit: 'zip', fx: ['whoosh'], tint: 0xffe65a, slant: -6 },
  banana:  { grad: ['#ffffff', '#fff08c', '#ffde1e', '#ff6e3e'], stroke: '#2a1206', glow: '#ffbe8c', enter: 'arc', idle: 'wave', exit: 'zip', fx: ['whoosh', 'sparkle'], tint: 0xffbe8c },
  glove:   { grad: ['#ffffff', '#e6f4ff', '#a0d2ff', '#507ab4'], stroke: '#0c1428', glow: '#c8e6ff', enter: 'zip', idle: 'none', exit: 'fade', fx: ['sparkle'], tint: 0xe6f4ff, size: 0.62 },
  power:   { grad: ['#ffffff', '#fff08c', '#ffde1e', '#e6961e'], stroke: '#0c0a0e', glow: '#ffde1e', enter: 'slam', idle: 'pulse', exit: 'up', fx: ['sparks'], tint: 0xffde1e },
};

// Every special's name -> its element. The names are the moves' own (specials.js, arcadesp.js, and the open PRs #70,
// #75, #76, #77 so they light up the day they merge); nothing is renamed.
const MOVE_THEME = {
  // special shots (specials.js SP_NAMES) and the aerial specials (RIGS air1..meteor)
  'BLAZE SHOT': 'fire', 'THUNDER SHOT': 'thunder', 'RISING PHOENIX': 'phoenix',
  'AIR BLAZE': 'fire', 'TIDE CUTTER': 'water', 'SKY THUNDER': 'thunder', 'CYCLONE HEEL': 'wind', 'PHOENIX': 'phoenix', 'METEOR DRIVE': 'cosmic',
  // keeper special saves (SAVE_NAMES)
  'IRON WALL': 'iron', 'THUNDER GLOVE': 'thunder', 'RISING SHIELD': 'phoenix',
  // the curving special passes (t-011 CURVE_NAMES) and PR #70's LV1 special passes
  'CURLER': 'curl', 'OUTSIDE CURL': 'curlGold', 'BANANA LOB': 'banana',
  'TORNADO DRILL': 'wind', 'BURROW BLAST': 'earth', 'ANGEL GLIDE': 'holy',
  // PR #75's skill dribbles
  'RAINBOW FLICK': 'rainbow', 'SHADOW STEP': 'shadow',
  // ARCADE: each team's signature shot, combo and special dribble (arcadesp.js TEAM_SP) + the fallbacks
  'WHITE COMET': 'cosmic', 'TWIN COMET': 'cosmic', 'MIRAGE STEP': 'shadow',
  'CRIMSON FANG': 'crimson', 'TWIN FANG': 'crimson', 'EMBER DANCE': 'fire',
  'SOLAR FLARE': 'sun', 'DOUBLE SUN': 'sun', 'SUNSPIN': 'sun',
  'SAKURA STORM': 'sakura', 'PETAL CYCLONE': 'sakura', 'BLOSSOM FEINT': 'sakura',
  'EMERALD GALE': 'leaf', 'TWIN GALE': 'leaf', 'LEAF SHADOW': 'leaf',
  'SCARLET LANCE': 'crimson', 'CROSSED LANCES': 'crimson', 'PHANTOM CUT': 'shadow',
  'TWIN STRIKE': 'power', 'SPECIAL DRIBBLE': 'power',
  // PR #76's keeper flair saves (shown on the hardest levels; smaller, they're saves, not specials)
  'SKY SNATCH': 'glove', 'FLYING STRETCH': 'glove', 'TOP-CORNER STRETCH': 'glove', 'LOW SCRAMBLE': 'glove', 'STARFISH WALL': 'glove',
};
const mcKey = s => String(s || '').trim().replace(/!+$/, '').trim();

(() => {
  const say0 = Match.prototype.say;
  hc2Mix(Match, {
    // Match.say (ui.js) with the MOVE CALL in front: a special's name goes to the pop-up, everything else as before
    say(big, small, sec) {
      if (MOVE_CALL.on && !this.penaltyMode) {
        const kb = mcKey(big);
        if (kb && MOVE_THEME[kb]) { this.moveCall(kb, small || ''); return say0.call(this, '', '', 0.01); }
        if (!big && small) {
          const m = /^([A-Z][A-Z' &-]+?)!? · (.*)$/.exec(small), ks = mcKey(small);
          if (m && MOVE_THEME[m[1]]) { this.moveCall(m[1], m[2]); return say0.call(this, '', '', 0.01); }
          if (MOVE_THEME[ks]) { this.moveCall(ks, ''); return say0.call(this, '', '', 0.01); }
        }
      }
      return say0.call(this, big, small, sec);
    },
    // the pop-up: name, caption, element (MC_THEMES key; default from MOVE_THEME)
    moveCall(name, caption = '', theme) {
      const T = MC_THEMES[theme || MOVE_THEME[mcKey(name)]] || MC_THEMES.power;
      if (!this.mcHooked) { this.mcHooked = true; this.events.on('postupdate', (t, d) => this.moveCallTick(Math.min(d / 1000, 1 / 30))); }
      this.moveCallEnd();
      const F = '"Press Start 2P"', fs = Math.round(MOVE_CALL.size * (T.size || 1)), word = mcKey(name) + '!';
      const c = this.add.container(VIEW_W / 2, Math.round(VIEW_H * MOVE_CALL.y)).setScrollFactor(0).setVisible(false);
      if (this.hud) this.hud.add(c);
      const pad = 18, mk = ch => {
        const t = this.add.text(0, 0, ch, { fontFamily: F, fontSize: fs + 'px', color: '#ffffff', stroke: T.stroke, strokeThickness: Math.max(5, Math.round(fs * (T.heavy ? 0.26 : 0.2))), padding: { x: pad, y: pad } }).setOrigin(0.5);
        const gr = t.context.createLinearGradient(0, pad, 0, t.height - pad);
        T.grad.forEach((col, i) => gr.addColorStop(i / (T.grad.length - 1), col));
        t.setFill(gr); t.setShadow(0, 0, T.glow, 14, true, true);
        return t;
      };
      // the letters, one object each (so each can move on its own), spaced by the font's advance
      const adv = fs * 0.98, n = word.length, L = [];
      for (let i = 0; i < n; i++) { if (word[i] === ' ') { L.push(null); continue; } const t = mk(word[i]); t.bx = (i - (n - 1) / 2) * adv; t.i = i; L.push(t); }
      const letters = L.filter(Boolean);
      const wide = n * adv, fit = Math.min(1, (VIEW_W * 0.8) / wide);
      // a slanted ink band behind the word, edged in the element's glow colour (fighting-game title strip)
      const glowN = Phaser.Display.Color.HexStringToColor(T.glow).color;
      const band = this.add.graphics();
      const bw = wide * fit + 120, bh = fs * 1.15 * (T.tall || 1);
      band.fillStyle(0x0c0a0e, 0.78).fillPoints([{ x: -bw / 2 + 24, y: -bh / 2 }, { x: bw / 2 + 24, y: -bh / 2 }, { x: bw / 2 - 24, y: bh / 2 }, { x: -bw / 2 - 24, y: bh / 2 }], true);
      band.fillStyle(glowN, 0.9).fillRect(-bw / 2 - 6, bh / 2 - 2, bw, 4).fillRect(-bw / 2 + 30, -bh / 2 - 2, bw, 3);
      c.add(band);
      // ghosts behind the word for the glitchy elements (shadow): two offset copies in purple and cyan
      const ghosts = [];
      if (T.idle === 'glitch') for (const col of [0xa03cff, 0x28e6ff]) { const g = this.add.text(0, 0, word, { fontFamily: F, fontSize: fs + 'px', color: '#ffffff', padding: { x: pad, y: pad } }).setOrigin(0.5).setTint(col).setAlpha(0); ghosts.push(g); c.add(g); }
      letters.forEach(t => c.add(t));
      // the PixelLab effects either side of the word (and the ones that strike single letters: bolts)
      const fx = [];
      const hasFx = this.textures.exists('fx');
      if (hasFx) (T.fx || []).forEach((fr, k) => { if (!this.textures.get('fx').has(fr)) return;
        for (const side of [-1, 1]) { const im = this.add.image(side * (wide * fit / 2 + 34 + k * 26), 0, 'fx', fr).setAlpha(0).setFlipX(side > 0); if (T.tint) im.setTint(T.tint); im.side = side; im.k = k; fx.push(im); c.add(im); } });
      const cap = caption ? this.add.text(0, bh / 2 + 16, caption, { fontFamily: F, fontSize: '11px', color: '#f4f0e4', stroke: '#0c0a0e', strokeThickness: 5 }).setOrigin(0.5).setAlpha(0) : null;
      if (cap) c.add(cap);
      this.mc = { name: word, T, c, band, letters, ghosts, fx, cap, fit, fs, t: 0, wait: 0, shown: false, seed: Math.random() * 100, dur: 0.25 + MOVE_CALL.hold + 0.4 };
      return this.mc;
    },
    moveCallEnd() { const M = this.mc; if (!M) return; this.mc = null; if (M.c && M.c.scene) M.c.destroy(true); },
    moveCallTick(dt) {
      const M = this.mc; if (!M) return;
      if (!M.c.scene) { this.mc = null; return; }
      if (this.replay || this.penaltyMode || this.over) { this.moveCallEnd(); return; }
      // a full-screen cut-in says the name itself: the pop-up waits for it (and gives up if it never ends in time);
      // one that comes after it has started showing (a clash on the save) takes the screen: the pop-up goes
      if (this.cutIn || this.cutInQ) { if (M.shown) { this.moveCallEnd(); return; } M.wait += dt; if (M.wait > MOVE_CALL.wait) this.moveCallEnd(); else M.c.setVisible(false); return; }
      if (this.paused) { M.c.setVisible(false); return; }
      M.shown = true; M.c.setVisible(true); M.t += dt;
      const t = M.t, T = M.T, n = M.letters.length, outAt = M.dur - 0.4;
      if (t > M.dur) { this.moveCallEnd(); return; }
      const ease = x => 1 - Math.pow(1 - clamp(x, 0, 1), 3), back = x => { x = clamp(x, 0, 1); const s = 1.9; return 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2); };
      const fit = M.fit, tall = T.tall || 1, sl = (T.slant || 0) * Math.PI / 180;
      let shakeX = 0, shakeY = 0;
      M.letters.forEach((L, j) => {
        const i = L.i, u = j / Math.max(1, n - 1);
        let x = L.bx * fit, y = 0, sx = fit, sy = fit * tall, rot = sl, a = 1, tint = null;
        // ---- in
        const st = { slam: 0.012, strike: 0.03, rise: 0.035, zip: 0.022, spin: 0.03, meteor: 0.02, phase: 0.03, arc: 0.035, erupt: 0.03, float: 0.045 }[T.enter] || 0.02;
        const p = clamp((t - j * st) / 0.26, 0, 1), e = ease(p), b = back(p);
        switch (T.enter) {
          case 'slam': sx *= 1 + (1 - b) * 2.2; sy *= 1 + (1 - b) * 2.2; a = Math.min(1, p * 3); break;
          case 'strike': a = p > 0 ? 1 : 0; tint = p < 0.6 ? 0xffffff : null; y += (p < 1 ? (Math.sin(i * 7 + t * 90) * 4) : 0); break;
          case 'rise': y += (1 - b) * 60; a = e; sy *= 0.6 + 0.4 * b; break;
          case 'zip': x += (1 - e) * 420; sx *= 1 + (1 - e) * 1.6; a = e; break;
          case 'spin': rot += (1 - e) * Math.PI * 2; sx *= b; sy *= b; a = e; break;
          case 'meteor': x += (1 - e) * 260; y -= (1 - e) * 160; a = e; break;
          case 'phase': a = p >= 1 ? 1 : (Math.floor(t * 30 + i) % 3 === 0 ? 0.9 : 0.15) * p; sy *= 1 + (1 - e) * 0.9; break;
          case 'arc': { const ang = (1 - e) * Math.PI; x = x * (0.4 + 0.6 * e) - Math.cos(ang) * 0 + (1 - e) * (-180); y -= Math.sin(ang) * 90; a = e; break; }
          case 'erupt': y += (1 - b) * 70; a = p > 0 ? 1 : 0; rot += (1 - e) * (i % 2 ? 0.4 : -0.4); break;
          case 'float': y -= (1 - e) * 40; a = e; break;
          default: a = e;
        }
        // ---- live
        const lt = t * 1 + M.seed;
        switch (T.idle) {
          case 'flicker': y -= Math.abs(Math.sin(lt * 17 + i * 1.7)) * 2.5; sy *= 1 + 0.07 * Math.sin(lt * 23 + i * 2.3); break;
          case 'zap': if (Math.floor(lt * 20 + i * 3) % 9 === 0) { x += Math.sin(lt * 300 + i) * 3; y += Math.cos(lt * 270 + i) * 3; tint = 0xffffff; } break;
          case 'pulse': { const k = 1 + 0.045 * Math.sin(t * 7 - i * 0.25); sx *= k; sy *= k; break; }
          case 'wave': y += Math.sin(t * 8 - i * 0.7) * 4; break;
          case 'swirl': x += Math.cos(t * 9 + i * 0.9) * 2.5; y += Math.sin(t * 9 + i * 0.9) * 3; rot += Math.sin(t * 9 + i) * 0.08; break;
          case 'shine': { const sw = ((t * 1.3) % 1.4) - 0.2; if (Math.abs(u - sw) < 0.09) tint = 0xffffff; break; }
          case 'glitch': if (Math.floor(lt * 14 + i * 5) % 11 === 0) x += (Math.sin(lt * 99 + i) > 0 ? 6 : -6); break;
          case 'rumble': x += Math.sin(lt * 70 + i * 3) * 1.2; y += Math.cos(lt * 63 + i * 2) * 1.2; break;
          case 'bob': y += Math.sin(t * 3.2 + i * 0.45) * 3.5; break;
          case 'rainbow': y += Math.sin(t * 7 - i * 0.6) * 4; tint = Phaser.Display.Color.HSVToRGB(((t * 0.55 + u * 0.85) % 1), 0.72, 1).color; break;
        }
        // ---- out
        if (t > outAt) {
          const q = clamp((t - outAt - j * 0.012) / 0.32, 0, 1), qe = q * q;
          switch (T.exit) {
            case 'burn': y -= qe * 40; sy *= 1 + qe * 0.8; a *= 1 - q; tint = q > 0.3 ? 0xff5a14 : tint; break;
            case 'shatter': x += Math.sin(i * 12.9898) * 120 * qe; y += Math.cos(i * 78.233) * 90 * qe; rot += (i % 2 ? 1 : -1) * qe * 2; a *= 1 - q; break;
            case 'up': y -= qe * 50; a *= 1 - q; break;
            case 'zip': x -= qe * 480; sx *= 1 + qe; a *= 1 - q; break;
            case 'drop': y += qe * 60; a *= 1 - q; break;
            case 'sink': y += qe * 50; sy *= 1 - qe * 0.7; a *= 1 - q; break;
            case 'vanish': sx *= 1 - qe; a *= (Math.floor(t * 40 + i) % 2 ? 1 : 0.2) * (1 - q); break;
            default: a *= 1 - q;
          }
        }
        L.setPosition(Math.round(x), Math.round(y)).setScale(sx, sy).setRotation(rot).setAlpha(a);
        if (tint != null) L.setTint(tint); else L.clearTint();
      });
      // the heavy ones (iron, earth) and the slam land with a jolt
      const land = t - 0.18;
      if ((T.heavy || T.enter === 'slam' || T.enter === 'erupt') && land > 0 && land < 0.22) { const k = (1 - land / 0.22) * (T.heavy ? 7 : 4); shakeX = Math.sin(t * 95) * k; shakeY = Math.cos(t * 80) * k * 0.6; }
      M.c.setPosition(Math.round(VIEW_W / 2 + shakeX), Math.round(VIEW_H * MOVE_CALL.y + shakeY));
      const inA = clamp(t / 0.2, 0, 1), outA = t > outAt ? 1 - clamp((t - outAt) / 0.35, 0, 1) : 1;
      M.band.setAlpha(inA * outA).setScale(0.2 + 0.8 * ease(t / 0.22), 1);
      if (M.cap) M.cap.setAlpha(clamp((t - 0.22) / 0.15, 0, 1) * outA);
      M.ghosts.forEach((g, k) => { const on = Math.floor((t + M.seed) * 12 + k * 3) % 4 === 0; g.setPosition((k ? 1 : -1) * (on ? 7 : 3), (k ? -1 : 1) * 2).setScale(M.fit, M.fit * tall).setRotation(sl).setAlpha((on ? 0.55 : 0.25) * inA * outA); });
      M.fx.forEach(im => {
        const fl = 0.85 + 0.15 * Math.sin(t * 18 + im.k * 2 + im.side), pop = back(t / 0.3);
        let s = 1.25 * pop * fl, a = inA * outA;
        if (T.fx[0] === 'bolt') a *= (Math.floor(t * 16 + im.side + im.k) % 3 === 0) ? 1 : 0.15;
        im.setScale(s).setAlpha(a).setPosition(im.side * (M.letters.length ? Math.abs(M.letters[0].bx) * M.fit + M.fs * 1.1 + im.k * 40 : 80), T.idle === 'flicker' ? -6 : 0);
      });
    },
  });
})();
