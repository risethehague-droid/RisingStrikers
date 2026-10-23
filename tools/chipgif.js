// v0.9.4 preview: the PixelLab chip in the Lab (CH1 = you chip a keeper off his line; CH3 = 1v1, he rushes out)
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const br = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await br.newPage({ viewport: { width: 1440, height: 810 } });
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto('http://localhost:8765/labtest.html');
  await page.waitForFunction(() => window.__lab && window.__lab.active, null, { timeout: 120000 });
  await page.evaluate(() => { window.__hc2.game.loop.sleep(); window.__T = 5e6; const L = window.__lab; L.boxes = false; L.zoom = 1.9; });
  const box = await page.evaluate(() => { const r = document.querySelector('#game canvas').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  for (const id of (process.env.ONLY || 'CH1,CH3').split(',')) {
    const dir = `gif094/${id}`; fs.mkdirSync(dir, { recursive: true });
    await page.evaluate(id => { const L = window.__lab; L.g = L.groups.findIndex(x => x.id === 'CH'); L.i = L.groups[L.g].tests.findIndex(t => t.id === id); L.api.start(false); L.run.marks = []; }, id);
    const k0 = await page.evaluate(() => { const m = window.__hc2, g = m.game; for (let k = 0; k < 60 * 10; k++) { window.__T += 1000 / 60; g.step(window.__T, 1000 / 60); window.__lab.run.marks = [];
      if (m.all.some(p => p.state === 'kick' && p.kickAnim === 'chip')) return k; } return -1; });
    const anim = await page.evaluate(() => { const p = window.__hc2.all.find(p => p.kickAnim === 'chip'); return p ? p.spr.anims.currentAnim && p.spr.anims.currentAnim.key : null; });
    console.log(id, 'chip starts at frame', k0, 'anim', anim);
    for (let f = 0; f < 36; f++) {
      await page.screenshot({ path: `${dir}/${String(f).padStart(3, '0')}.png`, clip: { x: box.x + box.w / 2 - 300, y: box.y + box.h / 2 - 230, width: 600, height: 420 }, timeout: 120000 });
      await page.evaluate(() => { const g = window.__hc2.game; for (let k = 0; k < 2; k++) { window.__T += 1000 / 60; g.step(window.__T, 1000 / 60); } window.__lab.run.marks = []; });
    }
  }
  console.log('errors', JSON.stringify(errs.slice(0, 3))); await br.close();
})();
