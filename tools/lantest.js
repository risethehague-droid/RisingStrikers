// t-041 LAN step 1: the headless check for tools/lan/lantest.html. Two Chromium pages on this machine, one HOST and
// one JOIN, the codes passed between them as Luca would paste them; they must connect, chat both ways and get 20/20
// pings back. A third page has RTCPeerConnection deleted before load and must show a readable error, not a blank page.
// Loopback only proves the page works; whether claude.ai's sandbox allows WebRTC is Luca's 5-minute test (README).
//
//   node tools/lantest.js            serves tools/lan/ itself on LANPORT (default 8766)
//   STUN=1 node tools/lantest.js     the same with the STUN box ticked (needs the internet)
const { chromium } = require('playwright');
const { spawn } = require('child_process'), path = require('path');
const port = process.env.LANPORT || 8766, url = `http://localhost:${port}/lantest.html`;
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: path.join(__dirname, 'lan'), stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 800));
  // (Chromium hides local IPs behind .local mDNS names; a container has no mDNS responder, so the loopback test
  //  uses plain host candidates. A real PC on Wi-Fi resolves the .local names itself.)
  const br = await chromium.launch({ args: ['--disable-features=WebRtcHideLocalIpsWithMdns'] });
  const errs = [], ok = [], bad = [];
  const check = (cond, what) => (cond ? ok : bad).push(what);
  try {
    const ctx = await br.newContext({ viewport: { width: 1000, height: 1100 } });
    const host = await ctx.newPage(), guest = await ctx.newPage();
    for (const p of [host, guest]) { p.on('pageerror', e => errs.push(e.message)); await p.goto(url); }
    if (process.env.STUN) for (const p of [host, guest]) await p.check('#stun');
    await host.click('#host'); await host.waitForFunction(() => __lan.state === 'offer' || __lan.error, null, { timeout: 15000 });
    const offer = await host.inputValue('#offer'); check(offer.length > 50, `join code made (${offer.length} chars)`);
    await guest.click('#join'); await guest.fill('#offerin', offer); await guest.click('#mkanswer');
    await guest.waitForFunction(() => __lan.state === 'answer' || __lan.error, null, { timeout: 15000 });
    const answer = await guest.inputValue('#answer'); check(answer.length > 50, `answer code made (${answer.length} chars)`);
    await host.fill('#answerin', answer); await host.click('#connect');
    for (const p of [host, guest]) await p.waitForFunction(() => __lan.state === 'connected' || __lan.state === 'failed', null, { timeout: 15000 });
    const st = await Promise.all([host, guest].map(p => p.evaluate(() => `${__lan.state}/${__lan.ice}`)));
    check(st.every(s => s.startsWith('connected')), `both connected (host ${st[0]}, guest ${st[1]})`);
    await host.fill('#msg', 'hello from PC 1'); await host.click('#send');
    await guest.fill('#msg', 'hi back from PC 2'); await guest.press('#msg', 'Enter');
    await guest.waitForFunction(() => __lan.chats.length > 0, null, { timeout: 5000 }); await host.waitForFunction(() => __lan.chats.length > 0, null, { timeout: 5000 });
    check((await guest.evaluate(() => __lan.chats[0])) === 'hello from PC 1', 'chat host -> guest');
    check((await host.evaluate(() => __lan.chats[0])) === 'hi back from PC 2', 'chat guest -> host');
    await host.click('#ping'); await host.waitForFunction(() => __lan.rtts.length === 20, null, { timeout: 8000 }).catch(() => {});
    const rtts = await host.evaluate(() => __lan.rtts);
    check(rtts.length === 20, `pings ${rtts.length}/20`);
    if (rtts.length) console.log(`RTT ms: min ${Math.min(...rtts).toFixed(2)} avg ${(rtts.reduce((a, b) => a + b, 0) / rtts.length).toFixed(2)} max ${Math.max(...rtts).toFixed(2)}`);
    console.log('screen:', await host.textContent('#rtt'));
    if (process.env.SHOT) { await host.screenshot({ path: process.env.SHOT, fullPage: true }); }
    // No WebRTC at all (what a locked-down sandbox would look like): the page must say so in words.
    const nortc = await ctx.newPage(); nortc.on('pageerror', e => errs.push(e.message));
    await nortc.addInitScript(() => { delete window.RTCPeerConnection; delete window.webkitRTCPeerConnection; });
    await nortc.goto(url);
    const msg = await nortc.textContent('#err');
    check(/RTCPeerConnection is blocked here/.test(msg) && await nortc.isDisabled('#host'), 'no-RTC page shows the error and disables HOST');
    console.log('no-RTC screen:', msg.slice(0, 80) + '...');
  } catch (e) { bad.push('threw: ' + e.message); }
  finally { await br.close(); srv.kill(); }
  for (const s of ok) console.log('ok  ', s); for (const s of bad) console.log('FAIL', s);
  console.log(bad.length ? 'LAN TEST FAILED' : 'LAN TEST OK', 'errors', JSON.stringify(errs.slice(0, 4)));
  process.exit(bad.length || errs.length ? 1 : 0);
})();
