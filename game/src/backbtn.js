// THE BACK BUTTON (Luca, 3 Nov: "code in a back button because escape just makes me exit the game", "on all game
// versions"). The game runs inside a page frame (claude.ai, the browser's full screen), and there ESC belongs to the
// browser first: it throws you out of full screen / the game view before the game can use it as BACK. So:
//  - BACKSPACE does everything ESC does in the game (pause, back one menu page, close a pop-up, the Lab's list, the
//    tutorial's menu), and it never makes the browser go back a page. Typing in a text box keeps its normal BACKSPACE.
//  - an on-screen button, top left, for the mouse (and a thumb): ◀ BACK whenever there's a menu or pop-up to go back
//    from, II PAUSE during your match (on a phone the touch controls have their own PAUSE, so it's only there in menus).
// Both just play an ESC keypress into the game, so every screen that already knows ESC goes back the way it always did
// and a new screen that handles ESC gets BACKSPACE and the button for free. Loaded right after io.js on all three pages.
(function () {
  const typing = t => !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
  const fire = (type, target) => {
    const ev = new KeyboardEvent(type, { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true, cancelable: true });
    (target && target.isConnected ? target : document.body).dispatchEvent(ev);
  };
  // BACKSPACE = ESC (caught first, before the game or the Lab sees it)
  addEventListener('keydown', e => {
    if (e.code !== 'Backspace' || typing(e.target)) return;
    e.preventDefault(); e.stopImmediatePropagation();
    if (!e.repeat) fire('keydown', e.target);
  }, true);
  addEventListener('keyup', e => {
    if (e.code !== 'Backspace' || typing(e.target)) return;
    e.preventDefault(); e.stopImmediatePropagation(); fire('keyup', e.target);
  }, true);

  const touch = () => matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  const $ = id => document.getElementById(id);
  const shown = el => !!el && !el.hidden && el.getClientRects().length > 0;
  // what BACK means right now: { l: the label, at: where the ESC goes } or null (nothing to go back from: no button)
  function now() {
    const s = $('start');
    if (s && s.isConnected) {                                                     // the start screen: only its pop-ups go back
      const p = [...s.querySelectorAll('.pop')].find(x => !x.hidden);
      return p ? { l: '\u25c0 BACK', at: p.contains(document.activeElement) ? document.activeElement : p } : null;
    }
    if (window.__lab) {                                                           // the Test Lab page
      const mn = $('menu');
      if (shown(mn)) { const a = document.activeElement; return { l: '\u25c0 BACK', at: mn.contains(a) ? a : $('menu-body') }; }
      if (shown($('tut')) && $('tut').innerHTML) return { l: '\u25c0 BACK', at: document.body };
      return null;                                                                // (a test: the Lab's own ◀ BACK / NEXT bar is there)
    }
    const m = window.__hc2; if (!m || !window.HC2_STARTED || !m.home) return null;
    if (m.flagUI) return m.flagUI.phase === 'edit' ? { l: '\u25c0 CANCEL', at: $('flagnote') || document.body } : null;
    if (m.bwUI) return { l: '\u25c0 BACK', at: document.body };
    if (m.replay || m.cupScreen || m.ceremony || m.penaltyMode || m.pre || m.cutIn || m.ht || m.intro || m.toss || m.over) return null;   // (there ESC means "go on")
    if (m.paused && m.pm) return { l: '\u25c0 BACK', at: document.body };
    if (m.demo && !m.watch) return null;
    return touch() ? null : { l: 'II PAUSE', at: document.body };
  }

  let btn = null, cur = null;
  function make() {
    const st = document.createElement('style'); st.id = 'backbtn-css';
    st.textContent = `#backbtn{position:fixed;left:10px;top:10px;z-index:50;font:10px/1 "Press Start 2P",monospace;padding:9px 10px;
      background:#ffde1e;color:#0c0a0e;border:3px solid #0c0a0e;box-shadow:3px 3px 0 #0c0a0e;cursor:pointer;display:flex;align-items:center;gap:8px}
      #backbtn[hidden]{display:none}
      #backbtn kbd{font:7px "Press Start 2P",monospace;opacity:.7;border:2px solid #0c0a0e;padding:2px 3px;background:#f4f0e4}
      #backbtn:hover{transform:translate(-1px,-1px);box-shadow:4px 4px 0 #0c0a0e}
      #backbtn:active{transform:translate(2px,2px);box-shadow:1px 1px 0 #0c0a0e}
      #backbtn:focus-visible{outline:3px solid #28c8e6;outline-offset:2px}
      @media (pointer:coarse){#backbtn kbd{display:none}#backbtn{padding:11px 12px}}`;
    document.head.appendChild(st);
    btn = document.createElement('button'); btn.type = 'button'; btn.id = 'backbtn'; btn.hidden = true;
    btn.setAttribute('aria-label', 'Back');
    // (the press must not take the keyboard away from the menu or the game: the ESC goes where the focus already is)
    btn.addEventListener('pointerdown', e => e.preventDefault());
    btn.addEventListener('mousedown', e => e.preventDefault());
    btn.addEventListener('click', e => {
      e.preventDefault(); e.stopPropagation(); const n = now(); if (!n) return;
      try { if (window.SFX) SFX.resume(); } catch (er) {}
      fire('keydown', n.at); setTimeout(() => fire('keyup', n.at), 60);
      btn.blur();
    });
    document.body.appendChild(btn);
  }
  function tick() {
    try {
      if (!btn) make();
      const n = now(), lab = n ? n.l : '';
      if (lab !== cur) { cur = lab; btn.hidden = !n; if (n) btn.innerHTML = `${n.l}<kbd>BKSP</kbd>`; btn.title = n ? n.l.replace(/^\W+/, '') + ' (BACKSPACE)' : ''; }
    } catch (e) {}
  }
  const go = () => { tick(); setInterval(tick, 120); };
  if (document.body) go(); else addEventListener('DOMContentLoaded', go);
})();
