'use strict';
// HC2 Football · lan.js: PLAY ON LAN - two PCs on one Wi-Fi, one match (t-044, LAN step 2 part 2: docs/lan-step2.md)
//
// The co-designer, 30 Oct: "Players should only have to press Host or Join". Step 1 (t-041) found that claude.ai
// pages have no WebRTC, but a copy of the game served on one laptop in the room connects PC to PC (avg 34 ms, 121 ms
// spikes). So tools/lan/serve.py serves game/ to the Wi-Fi and swaps the two connection codes behind the scenes (the
// matchmaker: /lan/host, /lan/rooms, /lan/answer/<room>); the match traffic itself goes straight PC to PC.
//
// How it plays, as FIFA / eFootball online and Sensible Soccer's 2-machine link do it: the HOST's PC runs the only match
// (it is authoritative). The guest's PC sends its buttons every frame (io.js netPad turns them into the away human's
// source, as part 1's two humans read them) and draws what the host sends back 30 times a second: every sprite as the
// host drew it (frame, place, depth), the camera, the score bug, the messages, the meters, the menus' text, the sounds
// and Rami's lines. It draws them ~100 ms behind, sliding between two snapshots, so a 120 ms spike costs a brief hold,
// never two screens that disagree. The guest never simulates anything.
//
// Edges (Laws of the Game spirit: one match, both see the same): either player pauses both screens and only the one who
// paused can resume; QUIT takes both back to the menu; a lost connection shows CONNECTION LOST on both and after 10 s
// both go back to the menu - no computer takes over anybody's side.

const LAN_DELAY = 100;                     // ms the guest draws behind the host (step 1's spikes reach 121 ms: one hold at most)
const LAN_SNAP_MS = 33;                    // host -> guest snapshots: ~30 a second
const LAN_LOST_MS = 3000, LAN_BACK_MS = 10000;   // silence before CONNECTION LOST, then back to the menu

const LAN = {
  on: false, role: null, seq: 0, pc: null, ctl: null, fast: null, urls: [], st: null, lastMsg: 0, lost: 0, closed: false,
  ready: { host: false, guest: false }, guest: { team: null, keys: 'arrows' }, teams: null, room: null,
  // ---- the start screen: PLAY ON LAN shows only when the page comes from serve.py (claude.ai's sandbox has no WebRTC)
  async probe() {
    const row = document.getElementById('play'); if (!row || window.__lab || typeof RTCPeerConnection !== 'function') return;
    try { const r = await fetch('lan/ping', { cache: 'no-store' }); if (!r.ok) return; const j = await r.json(); if (!j || !j.hc2lan) return; this.urls = j.urls || []; }
    catch (e) { return; }
    const b = document.createElement('button'); b.type = 'button'; b.id = 'lanbtn'; b.innerHTML = 'PLAY ON LAN &#9654;';
    b.style.cssText = 'font:12px "Press Start 2P",monospace;background:#ffde1e;color:#0c0a0e;padding:12px 14px;border:3px solid #0c0a0e;box-shadow:4px 4px 0 #0c0a0e;cursor:pointer';
    b.onclick = () => this.box(); row.parentNode.insertBefore(b, row);
  },
  pick(side) { const b = document.querySelector(`#pick-${side} button[aria-pressed="true"]`); return b ? b.textContent.trim() : side === 'home' ? 'IS' : 'IRO'; },
  // the LAN panel over the start screen: HOST / JOIN, then who's connected and READY
  box() {
    let el = document.getElementById('lanbox');
    if (!el) {
      el = document.createElement('div'); el.id = 'lanbox';
      el.style.cssText = 'position:fixed;inset:0;z-index:20;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:16px;' +
        'background:rgba(12,10,14,.9);color:#f4f0e4;font:10px/1.9 "Press Start 2P",monospace;text-align:center';
      const st = document.createElement('style');
      st.textContent = '#lanbox button{font:12px "Press Start 2P",monospace;background:#f4f0e4;color:#0c0a0e;padding:12px 16px;border:3px solid #0c0a0e;box-shadow:4px 4px 0 #0c0a0e;cursor:pointer;margin:4px}' +
        '#lanbox button.go{background:#ffde1e} #lanbox h2{margin:0;font-size:14px;background:#ffde1e;color:#0c0a0e;padding:10px 14px;border:3px solid #0c0a0e;box-shadow:4px 4px 0 #0c0a0e}' +
        '#lanbox details{max-width:640px;font-size:8px;color:#bdb6c8;text-align:left} #lanbox b{color:#ffde1e}';
      el.appendChild(st); document.body.appendChild(el);
    }
    el.style.display = 'flex';
    const addr = this.urls.length ? this.urls.map(u => `<b>${u}</b>`).join(' or ') : '<b>this laptop\'s address</b>';
    el.innerHTML = el.firstChild.outerHTML + `<h2>PLAY ON LAN</h2><div id="lanst">ONE PC HOSTS, THE OTHER JOINS. SAME WI-FI.</div>
      <div id="lanbtns"><button type="button" class="go" id="lanhost">HOST</button><button type="button" class="go" id="lanjoin">JOIN</button><button type="button" id="lanback">BACK</button></div>
      <div id="lanrooms"></div>
      <details><summary>TROUBLE CONNECTING?</summary>
      THE OTHER PC OPENS ${addr} IN ITS BROWSER (BOOKMARK IT), THEN PLAY ON LAN, JOIN.<br>
      IT WON'T OPEN THERE? THE LAPTOP'S FIREWALL IS BLOCKING PYTHON. MAC: SYSTEM SETTINGS, NETWORK, FIREWALL, OPTIONS: ALLOW PYTHON (OR "PYTHON3") INCOMING CONNECTIONS.
      WINDOWS: WHEN THE "WINDOWS SECURITY" BOX ASKS ABOUT PYTHON, TICK PRIVATE NETWORKS, ALLOW ACCESS (MISSED IT: WINDOWS SECURITY, FIREWALL, ALLOW AN APP, PYTHON, PRIVATE).
      BOTH PCS ON THE SAME WI-FI, NOT A GUEST NETWORK. CHROME OR EDGE WORK BEST.</details>`;
    document.getElementById('lanhost').onclick = () => this.host();
    document.getElementById('lanjoin').onclick = () => this.join();
    document.getElementById('lanback').onclick = () => { if (!this.role) el.style.display = 'none'; else location.reload(); };
  },
  say(html) { const e = document.getElementById('lanst'); if (e) e.innerHTML = html; this.st = html; },
  btns(html) { const e = document.getElementById('lanbtns'); if (e) e.innerHTML = html; },

  // ---- WebRTC: step 1's connection (tools/lan/lantest.html), the codes now carried by serve.py instead of by hand.
  // Two channels: 'ctl' reliable + ordered (lobby, pause, sounds, menus) and 'fast' unordered with no resends (inputs,
  // snapshots: a late one is worth nothing, the next one is already on its way)
  makePC() {
    const pc = this.pc = new RTCPeerConnection({ iceServers: [] });               // (same Wi-Fi: the host / mDNS candidates are enough)
    pc.onconnectionstatechange = () => { if (pc.connectionState === 'failed' || pc.connectionState === 'closed') this.drop(); };
    return pc;
  },
  gathered() {
    const pc = this.pc;
    return new Promise(res => { if (pc.iceGatheringState === 'complete') return res(); const t = setTimeout(res, 6000);
      pc.addEventListener('icegatheringstatechange', () => { if (pc.iceGatheringState === 'complete') { clearTimeout(t); res(); } }); });
  },
  wire(ch) {
    if (ch.label === 'fast') this.fast = ch; else this.ctl = ch;
    ch.onmessage = e => { this.lastMsg = performance.now(); let k; try { k = JSON.parse(e.data); } catch (er) { return; } this.recv(k); };
    ch.onclose = () => this.drop();
    if (ch.label === 'ctl') ch.onopen = () => this.opened();
  },
  send(k, fast) { const c = fast ? this.fast : this.ctl; if (c && c.readyState === 'open') { if (fast && this.spikeQ) { this.spikeQ.push(k); return; } try { c.send(JSON.stringify(k)); } catch (e) {} } },
  async api(path, body) {
    const r = await fetch('lan/' + path, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : { cache: 'no-store' });
    return { status: r.status, j: r.status === 200 ? await r.json() : null };
  },

  // ---- HOST: one press. Posts the offer, waits for a player, then the lobby
  async host() {
    this.role = 'host'; this.btns('<button type="button" id="lanback2">CANCEL</button>'); document.getElementById('lanback2').onclick = () => location.reload();
    const pc = this.makePC();
    this.wire(pc.createDataChannel('ctl')); this.wire(pc.createDataChannel('fast', { ordered: false, maxRetransmits: 0 }));
    this.say('GETTING READY...');
    await pc.setLocalDescription(await pc.createOffer()); await this.gathered();
    const addr = this.urls[0] || 'this laptop\'s address', t0 = performance.now();
    while (!this.ctl || this.ctl.readyState !== 'open') {
      if (!this.room) { const r = await this.api('host', { name: this.pick('home'), offer: pc.localDescription.toJSON() }); if (r.status !== 200) { this.say('THE LAN SERVER SAID NO (' + r.status + '). IS SERVE.PY STILL RUNNING?'); return; } this.room = r.j.room; }
      const late = performance.now() - t0 > 30000;
      this.say(`WAITING FOR A PLAYER...<br>PC 2: OPEN <b>${addr}</b>, PRESS PLAY ON LAN, THEN JOIN` +
        (late ? '<br><br>NOTHING YET? IF PC 2 CAN\'T OPEN THAT ADDRESS, ALLOW PYTHON IN THIS LAPTOP\'S FIREWALL (TROUBLE CONNECTING? BELOW)' : ''));
      let r; try { r = await this.api('answer/' + this.room); } catch (e) { r = { status: 0 }; }
      if (r.status === 200 && r.j.answer) { await pc.setRemoteDescription(r.j.answer); this.say('CONNECTING...'); break; }
      if (r.status === 404) this.room = null;                                     // (the room ran out after 2 minutes: open a new one with the same offer)
      if (r.status === 0) await new Promise(res => setTimeout(res, 1000));
    }
  },
  // ---- JOIN: one press. One game open: straight in; several: pick the host
  async join() {
    this.role = 'guest'; this.btns('<button type="button" id="lanback2">CANCEL</button>'); document.getElementById('lanback2').onclick = () => location.reload();
    for (;;) {
      let r; try { r = await this.api('rooms'); } catch (e) { r = { status: 0 }; }
      const rooms = (r.j && r.j.rooms) || [];
      if (rooms.length === 1) return this.joinRoom(rooms[0]);
      const box = document.getElementById('lanrooms');
      if (rooms.length > 1) {
        this.say('MORE THAN ONE GAME ON THIS WI-FI. PICK ONE:');
        box.innerHTML = rooms.map((o, i) => `<button type="button" data-i="${i}">${String(o.name).replace(/[^A-Z0-9 .:-]/gi, '')} &middot; ${o.from}</button>`).join('');
        return new Promise(res => box.querySelectorAll('button').forEach(b => b.onclick = () => { box.innerHTML = ''; res(this.joinRoom(rooms[+b.dataset.i])); }));
      }
      this.say('NOBODY IS HOSTING YET. WAITING...<br>(THE OTHER PC PRESSES PLAY ON LAN, THEN HOST)');
      await new Promise(res => setTimeout(res, 1500));
    }
  },
  async joinRoom(o) {
    this.say('CONNECTING TO ' + String(o.name).replace(/[^A-Z0-9 ]/gi, '') + '...');
    const pc = this.makePC(); pc.ondatachannel = e => this.wire(e.channel);
    await pc.setRemoteDescription(o.offer); await pc.setLocalDescription(await pc.createAnswer()); await this.gathered();
    const r = await this.api('answer/' + o.room, { answer: pc.localDescription.toJSON() });
    if (r.status !== 200) { this.pc.close(); this.pc = null; this.closed = false; this.say('THAT GAME WAS TAKEN. LOOKING AGAIN...'); return this.join(); }
  },

  // ---- the lobby (like FIFA's friendly lobby): each picks his own team on the start screen (host = home), both READY
  opened() {
    this.on = true; this.lastMsg = performance.now();
    if (!this.dog) this.dog = setInterval(() => this.watch(), 250);
    if (this.role === 'guest') this.send({ t: 'hello', team: this.pick('home'), keys: window.HC2_KEYS || 'arrows' });
    this.say('CONNECTED');
  },
  lobby() {
    const T = this.teams; if (!T) return; const me = this.role === 'host' ? 'host' : 'guest', R = this.ready;
    this.say(`CONNECTED &middot; <b>${T.h}</b> (HOST, HOME) v <b>${T.a}</b> (PC 2, AWAY)<br>HOST: ${R.host ? 'READY' : '...'} &middot; PC 2: ${R.guest ? 'READY' : '...'}` +
      (this.role === 'guest' ? '<br>THE HOST PICKS THE SETTINGS (ARENA, WEATHER, PACE, LEVEL) NEXT' : ''));
    if (!R[me]) { this.btns('<button type="button" class="go" id="lanready">READY</button><button type="button" id="lanback2">LEAVE</button>');
      document.getElementById('lanready').onclick = () => { R[me] = true; this.send({ t: 'ready' }); if (this.role === 'host') this.hostLobby(); else this.lobby(); };
      document.getElementById('lanback2').onclick = () => { this.send({ t: 'quit' }); location.reload(); }; }
    else this.btns('');
  },
  hostLobby() {                                                                  // the host decides the line-up and tells PC 2
    const h = this.pick('home'), ts = ['IS', 'IRO', 'USCS', 'LUC', 'THUAS', 'AUC'];
    let a = this.guest.team; if (!a || a === h) a = this.pick('away'); if (a === h) a = ts.find(t => t !== h);
    this.teams = { h, a }; this.send({ t: 'lobby', h, a, ready: this.ready }); this.lobby();
    if (this.ready.host && this.ready.guest) this.go();
  },
  // ---- kick-off: the host plays it through its normal flow (settings, team sheet, walk-out); PC 2 watches it come
  go() {
    const m = window.__hc2; if (!m || this.started) return; this.started = true;
    this.pad = netPad(this.guest.keys); m.twoHumans(this.pad);
    this.hostHooks(m);
    m.setTeams(this.teams.h, this.teams.a, () => { this.toGame(); window.HC2_STARTED = true; m.freeze = Math.max(m.freeze, 0.6); m.preMatch(); });
  },
  toGame() { for (const id of ['start', 'lanbox']) { const e = document.getElementById(id); if (e) e.remove(); } window.focus(); },

  recv(k) {
    const m = window.__hc2;
    if (k.t === 'i') { if (this.pad) this.pad.feed(k); return; }                // (host) the guest's buttons
    if (k.t === 's') { if (m && m.lanGuest) m.lanSnap(k); return; }             // (guest) a snapshot
    if (k.t === 'ping') return;
    if (k.t === 'hello' && this.role === 'host') { this.guest = { team: k.team, keys: k.keys }; this.hostLobby(); return; }
    if (k.t === 'lobby' && this.role === 'guest') { this.teams = { h: k.h, a: k.a }; this.ready.host = k.ready.host; this.lobby(); return; }
    if (k.t === 'ready') { this.ready[this.role === 'host' ? 'guest' : 'host'] = true; if (this.role === 'host') this.hostLobby(); else this.lobby(); return; }
    if (k.t === 'quit') { this.closed = true; location.reload(); return; }
    if (this.role === 'guest') {
      if (k.t === 'teams' && m) { this.started = true; m.setTeams(k.h, k.a, () => { this.toGame(); m.lanGuestStart(); }); }
      else if (k.t === 'rules' && m) { m.mset = k.R; m.applyRules(); }
      else if (k.t === 'ev') setTimeout(() => { for (const e of k.e) this.play(m, e); }, LAN_DELAY);   // (in step with the pictures, drawn LAN_DELAY behind)
      else if (k.t === 'flow') this.flow(k);
      return;
    }
    if (k.t === 'pause' && m && !m.paused && !m.over) { m.paused = true; m.lanHold = 'guest'; m.say('PAUSED', 'PC 2 PAUSED THE MATCH · ONLY PC 2 CAN RESUME', 9999); }
    else if (k.t === 'resume' && m && m.lanHold === 'guest') { m.lanHold = null; m.paused = false; m.say('', '', 0.01); }
  },
  play(m, e) {                                                                   // (guest) a sound or a line of Rami's, as the host had it
    try { if (e[0] === 'rami') { if (m) m.ramiSay(e[1], e[2], e[3]); } else if (typeof SFX[e[0]] === 'function') SFX[e[0]](...e[1]); } catch (er) {}
  },
  flow(k) {                                                                      // (guest) the host's menus / half-time card, to read (the host drives them)
    const m = window.__hc2; if (!m) return;
    if (k.show) { m.flowEl('lan').innerHTML = String(k.html || '').replace(/<script[\s\S]*?<\/script>/gi, '').replace(/\son\w+\s*=/gi, ' data-x='); }
    const root = document.getElementById('flow'); if (root) { root.style.pointerEvents = 'none'; root.style.display = k.show ? 'flex' : 'none'; }
  },

  // ---- the host's side of the match: send what the screen shows, collect the sounds and Rami's lines on the way
  hostHooks(m) {
    let depth = 0; const q = this.evQ = [];
    for (const k of Object.keys(SFX)) {
      const f = SFX[k]; if (typeof f !== 'function' || ['init', 'resume', 'ok', 'toggle'].includes(k)) continue;
      SFX[k] = function (...a) { if (depth === 0) q.push([k, a.map(v => (typeof v === 'number' || typeof v === 'boolean' || typeof v === 'string' ? v : null))]);   // (only the outer call: kick() plays its own tones)
        depth++; try { return f.apply(this, a); } finally { depth--; } };
    }
    const rs = m.ramiSay.bind(m);
    m.ramiSay = (key, v, prio) => { let c = {}; try { c = JSON.parse(JSON.stringify(v || {}, (kk, x) => (x && typeof x === 'object' && (x.m || x.scene) ? undefined : x))); } catch (e) {} q.push(['rami', key, c, prio]); return rs(key, v, prio); };
    m.events.on('postupdate', () => this.hostFrame(m));
  },
  hostFrame(m) {
    const now = performance.now();
    if (this.evQ.length) { this.send({ t: 'ev', e: this.evQ.splice(0) }); }
    const R = JSON.stringify(m.mset || null); if (R !== this.rulesWas) { this.rulesWas = R; this.send({ t: 'rules', R: m.mset || {} }); }
    const fe = document.getElementById('flow'), fb = fe && fe.querySelector('.box'), fh = fb ? fb.innerHTML : '', fs = !!fe && fe.style.display !== 'none';
    if (fh !== this.flowWas || fs !== this.flowShow) { this.flowWas = fh; this.flowShow = fs; this.send({ t: 'flow', html: fh, show: fs }); }
    if (now - (this.snapAt || 0) < LAN_SNAP_MS) return; this.snapAt = now;
    this.send(lanSnapOf(m, ++this.seq), true);
  },
  // ---- both sides: a silent line = CONNECTION LOST, 10 s later the menu. The line coming back before then carries on.
  watch() {
    const now = performance.now(), m = window.__hc2;
    if (this.on && !this.closed) this.send({ t: 'ping' });
    if (!this.on) return;
    const quiet = this.closed || now - this.lastMsg > LAN_LOST_MS;
    if (quiet && !this.lost) {
      this.lost = now;
      if (m && this.role === 'host' && this.started) { m.lanHoldWas = m.paused; m.paused = true; m.lanHold = 'lost'; m.say('CONNECTION LOST', 'BACK TO THE MENU IN 10 S', 9999); }
      this.over('CONNECTION LOST', 'BACK TO THE MENU IN 10 S');
    } else if (!quiet && this.lost) {
      this.lost = 0; this.over(null);
      if (m && m.lanHold === 'lost') { m.lanHold = null; m.paused = !!m.lanHoldWas; m.say('', '', 0.01); }
    }
    if (this.lost && now - this.lost > LAN_BACK_MS) { this.on = false; location.reload(); }
  },
  drop() { this.closed = true; },
  // a plain screen-wide note over the game (CONNECTION LOST, PAUSED, waiting for the host)
  over(big, small) {
    let el = document.getElementById('lanover');
    if (!big) { if (el) el.style.display = 'none'; return; }
    if (!el) { el = document.createElement('div'); el.id = 'lanover'; el.style.cssText = 'position:fixed;left:0;right:0;top:9%;z-index:30;text-align:center;pointer-events:none;' +
      'font:28px/1.6 "Press Start 2P",monospace;color:#ffde1e;text-shadow:3px 3px 0 #0c0a0e,-3px -3px 0 #0c0a0e,3px -3px 0 #0c0a0e,-3px 3px 0 #0c0a0e'; document.body.appendChild(el); }
    el.innerHTML = `${big}<div style="font-size:11px;color:#f4f0e4">${small || ''}</div>`; el.style.display = '';
  },
  // tools/lanmatch.js: hold the host's snapshots for ms (a Wi-Fi spike like step 1's 121 ms), then send them all
  spike(ms) { this.spikeQ = []; setTimeout(() => { const q = this.spikeQ; this.spikeQ = null; for (const k of q) this.send(k, true); }, ms); },
};

// one snapshot: each sprite as the host drew it this frame (the picture, not the rules behind it - so walk-outs,
// replays, dives, rigs and celebrations all come across without the guest knowing how they work)
const lanR = (v, d = 10) => Math.round(v * d) / d;
function lanSpr(s) {
  if (!s || !s.frame || !s.texture) return null;
  return [s.texture.key, s.frame.name, lanR(s.x), lanR(s.y), lanR(s.depth), lanR(s.originX, 1000), lanR(s.originY, 1000), lanR(s.rotation, 1000),
    lanR(s.scaleX, 1000), lanR(s.scaleY, 1000), s.flipX ? 1 : 0, s.visible ? 1 : 0, lanR(s.alpha, 100)];
}
function lanSnapOf(m, n) {
  const b = m.ball, cam = m.cameras.main, O = m.hOther;
  return { t: 's', n, at: performance.now(),
    P: m.all.map(p => [lanSpr(p.spr), lanR(p.x, 100), lanR(p.y, 100), p.sentOff ? 1 : 0]),
    B: [lanSpr(m.ballSpr), lanR(b.x, 100), lanR(b.y, 100), lanR(b.z, 100)], S: lanSpr(m.ballSh), R: m.ref ? lanSpr(m.ref.spr) : null,
    C: [lanR(cam.scrollX), lanR(cam.scrollY), lanR(cam.zoom, 1000)],
    H: [m.scoreTxt.text, m.clockTxt.text, m.msg.text, m.sub.text, m.msg.visible ? 1 : 0, m.sub.visible ? 1 : 0],
    E: (m.meters || []).map(mt => lanR(mt.e, 1000)), g: O && O.human ? O.human.i : 9, cv: m.cursor.visible && !m.replay ? 1 : 0,
    pz: m.lanHold || (m.paused ? 'host' : null), pre: m.pre || m.setup ? 1 : 0, ov: m.over ? 1 : 0 };
}

// ---------------------------------------------------------------- Match methods: the LAN guest + the hooks
hc2Mix(Match, {
  lanEv(kind) {                                                                  // (ui.js / match.js call these; nothing happens off LAN)
    if (!LAN.on || LAN.role !== 'host') return;
    if (kind === 'pause' && !this.lanHold) LAN.send({ t: 'pause' });
    else if (kind === 'resume') LAN.send({ t: 'resume' });
    else if (kind === 'quit') LAN.send({ t: 'quit' });
    else if (kind === 'teams') LAN.send({ t: 'teams', h: this.home.name, a: this.away.name });
  },
  lanGuestStart() {
    this.lanGuest = true; this.demo = false; this.human = this.away.players[9]; this.lanBuf = []; this.lanCnt = {}; this.lanN = 0;
    for (const p of this.all) { p.spr.anims.stop(); }
    this.ballSpr.anims && this.ballSpr.anims.stop && this.ballSpr.anims.stop();
    if (this.ref) this.ref.spr.anims.stop();
    this.help.setText(`YOU: ${this.away.name} (AWAY) · ` + this.helpText()).setVisible(true); this.helpUntil = this.time.now + 10000;
    LAN.over('THE HOST IS SETTING UP', 'ARENA · WEATHER · PACE · LEVEL · TEAM SHEET');
  },
  lanSnap(k) {
    const B = this.lanBuf; k.r = performance.now();
    if (B.length && k.n <= B[B.length - 1].n) { if (!B.some(s => s.n === k.n)) { B.push(k); B.sort((u, v) => u.n - v.n); } }   // (unordered: a late one slots in)
    else B.push(k);
    if (B.length > 90) B.splice(0, B.length - 90);
  },
  // the guest's frame: send the buttons, then draw the host's picture from ~100 ms ago
  lanGuestTick(dt) {
    Input.poll();
    const acts = Object.keys(Input.map).filter(a => a !== 'start' && a !== 'flag' && a !== 'meter'), b = {}, C = this.lanCnt;
    for (const a of acts) { b[a] = Input.held(a); if (Input.pressed(a)) C[a] = (C[a] || 0) + 1; else C[a] = C[a] || 0; }
    LAN.send({ t: 'i', n: ++this.lanN, x: lanR(Input.axis.x, 100), y: lanR(Input.axis.y, 100), b, c: C }, true);
    const B = this.lanBuf; if (!B.length) { this.stadium.update(dt); return; }
    const last = B[B.length - 1];
    if (Input.pressed('start')) { if (!last.pz) LAN.send({ t: 'pause' }); else if (last.pz === 'guest') LAN.send({ t: 'resume' }); }
    if (last.pz === 'guest' && Input.taps.has('KeyQ')) { LAN.send({ t: 'quit' }); setTimeout(() => location.reload(), 150); }
    // where in the host's time to draw: the newest offset between the two clocks (the smallest = the least delayed packet)
    let off = Infinity; for (const s of B) off = Math.min(off, s.r - s.at);
    const T = performance.now() - off - LAN_DELAY;
    let i = B.length - 1; while (i > 0 && B[i].at > T) i--;
    const A = B[i], Z = B[Math.min(i + 1, B.length - 1)], u = Z.at > A.at ? clamp((T - A.at) / (Z.at - A.at), 0, 1) : 0;
    this.lanDraw(A, Z, u);
    if (!LAN.lost) {
      if (last.pz === 'guest') LAN.over('PAUSED', 'ENTER: RESUME · Q: QUIT TO THE MENU');
      else if (last.pz === 'host') LAN.over('PAUSED BY THE HOST', 'ONLY THE HOST CAN RESUME');
      else if (last.pre && !((fl => fl && fl.style.display !== 'none')(document.getElementById('flow')))) LAN.over('THE HOST IS SETTING UP', 'ARENA · WEATHER · PACE · LEVEL · TEAM SHEET');
      else LAN.over(null);
    }
    this.stadium.update(dt); this.ramiTick(dt);
    { const w = window.HC2_STARTED; window.HC2_STARTED = true;                // (the meters draw in a started match; PC 2 never "starts" one - it
      for (const mt of this.meters || []) mt.draw(dt); window.HC2_STARTED = w; }   // keeps HC2_STARTED off so its FLAG button and menus stay out of it)
    this.drawCursor(); this.drawRadar();
    if (this.time.now > this.helpUntil && this.help.visible) this.help.setVisible(false);
  },
  lanDraw(A, Z, u) {
    const put = (o, a, z) => {
      if (!o || !a) return; if (!this.textures.exists(a[0])) { o.setVisible(false); return; }
      if (o.texture.key !== a[0] || o.frame.name !== a[1]) o.setTexture(a[0], a[1]);
      let x = a[2], y = a[3];                                                    // (slide between the two snapshots, unless it jumped: a replay starting, a restart)
      if (z && z[0] === a[0] && Math.abs(z[2] - x) + Math.abs(z[3] - y) < 160) { x += (z[2] - x) * u; y += (z[3] - y) * u; }
      o.setPosition(x, y).setDepth(a[4]).setOrigin(a[5], a[6]).setRotation(a[7]).setScale(a[8], a[9]).setFlipX(!!a[10]).setVisible(!!a[11]).setAlpha(a[12]);
    };
    A.P.forEach((q, j) => { const p = this.all[j]; if (!p) return; put(p.spr, q[0], Z.P[j] && Z.P[j][0]); p.x = q[1]; p.y = q[2]; p.sentOff = !!q[3]; });
    put(this.ballSpr, A.B[0], Z.B[0]); put(this.ballSh, A.S, Z.S); if (this.ref) put(this.ref.spr, A.R, Z.R);
    const b = this.ball; b.x = A.B[1]; b.y = A.B[2]; b.z = A.B[3];
    const cam = this.cameras.main, c = A.C, d = Z.C, jump = Math.abs(d[0] - c[0]) + Math.abs(d[1] - c[1]) > 400;
    if (Math.abs(cam.zoom - c[2]) > 1e-3) { cam.setZoom(c[2]); this.uiFix = this.uiItems(); this.fixUi(c[2]); }   // (as world.js render does: the HUD stays its size)
    cam.setScroll(jump ? c[0] : c[0] + (d[0] - c[0]) * u, jump ? c[1] : c[1] + (d[1] - c[1]) * u);
    const H = A.H, tx = (o, s) => { if (o.text !== s) o.setText(s); };
    tx(this.scoreTxt, H[0]); tx(this.clockTxt, H[1]); tx(this.msg, H[2]); tx(this.sub, H[3]); this.msg.setVisible(!!H[4]); this.sub.setVisible(!!H[5]);
    (this.meters || []).forEach((mt, j) => { if (A.E[j] != null) mt.e = A.E[j]; });
    const me = this.away.players[A.g]; if (me) this.human = me;
    this.cursor.setVisible(!!A.cv);
  },
});

if (typeof document !== 'undefined' && document.getElementById('start')) LAN.probe();
