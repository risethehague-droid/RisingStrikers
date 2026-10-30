'use strict';
// HC2 Football · boot.js: starts the game on page load (canvas size, scenes)
// (split out of game.js in v0.9.5 - load order and lanes: src/README.md)

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
    // QA 30 Oct (Bug Watch CRASH again on v0.14.0, IS v IRO 2', after PR #51): Phaser opened a second, unused sound
    // system of its own. Each time the tab comes back into view it restarts that one's audio with a promise nobody
    // catches, so "Failed to start the audio device" (speakers/headset not ready) still counted as a crash. All the game's
    // sound is SFX in io.js, so Phaser's is switched off.
    audio: { noAudio: true },
  });
  addEventListener('resize', () => game.scale.setZoom(bestZoom()));
  setupTouch();
  window.__game = game;
});
