# LAN step 1: the 5-minute connection test (t-041)

One question before any LAN match work: **can two PCs connect straight to each other from a claude.ai page?**
`lantest.html` answers it. No server: each PC makes a code, you copy it across by hand (WhatsApp / Discord).

## How to run it (two PCs, same Wi-Fi, about 5 minutes)

1. Open the test page on **both** PCs (the taskmaster gives you the link once it's published). Same browser on both
   if you can (Chrome or Edge).
2. PC 1 presses **HOST**. A **join code** appears. Press COPY and send it to PC 2.
3. PC 2 presses **JOIN**, pastes the join code, presses **MAKE ANSWER**. Copy the **answer code** and send it back.
4. PC 1 pastes the answer code and presses **CONNECT**.
5. The green **CONNECTED** bar should appear on both. Press **PING x20** and type a message each way.
6. Send the taskmaster a screenshot of the page (the top box and the round-trip line are what matter).

## What the result means

| You see | It means | Next |
| --- | --- | --- |
| CONNECTED, ping 20/20 | claude.ai lets two PCs talk directly. LAN Play can run from the published game. | step 2 (LAN match) as planned |
| Round trip under ~30 ms | fast enough for a football match on Wi-Fi | |
| Round trip way over 50 ms | it works but the Wi-Fi is slow; a cable or closer to the router helps | still fine for a test |
| `RTCPeerConnection: NO` / "blocked here" | the claude.ai page sandbox blocks WebRTC | plan B: small server on the laptop |
| "No connection candidates were gathered" | the page may not use the network for WebRTC | plan B |
| FAILED (ICE failed) | the PCs couldn't reach each other. Retry with **use a public STUN server** ticked on both PCs. | still failing: plan B |
| Works opened as a file / local server, fails on claude.ai | it's the sandbox, not the Wi-Fi | plan B |

## For developers

- `node tools/lantest.js` (from the repo root) runs the same thing headless with two Chromium pages on one machine,
  plus a page with WebRTC removed to check the error. It serves this folder itself on `LANPORT` (default 8766).
- Codes are the full SDP after ICE gathering (no trickle), deflated with `CompressionStream` when available, base64,
  `Z` (deflated) or `B` (plain) in front. About 570 characters.
