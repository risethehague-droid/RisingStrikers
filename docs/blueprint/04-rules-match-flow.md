# 04 · Rules, set pieces and match flow

Legend: see [README](README.md). Luca's rule for all of it (25 Oct 14:59): build the whole flow, "what happens before,
during and after" (HOUSE-01). Laws refer to IFAB.

## A. Laws

| ID | Rule | Whose | Pri | Status |
| --- | --- | --- | --- | --- |
| RU-01 | **Offside** (Law 11, simplified): positions as the pass is struck, level = onside, never from a throw-in / corner / goal kick, only when he plays it. Instant call: OFFSIDE!, man marked, Rami, quick free kick. Your pass marker goes red on an offside man. Option ON / OFF | L list 25 Oct, C✓ | P0 | ✅ |
| RU-02 | **Fouls**: slides that miss the ball / from behind = foul; in the box = PENALTY | C✓ | P0 | ✅ |
| RU-03 | **Cards**: yellow for from-behind / repeat; second yellow = RED, sent off, team plays with ten | C✓ | P0 | ✅ |
| RU-04 | **Injuries**: a bad foul can leave a man limping (25-30% slower), likelier on a card / from behind; the computer subs him, you're told | C✓ | P1 | ✅ |
| RU-05 | **Back-pass** (Law 12) → GK-12 | C✓ | P1 | ✅ |
| RU-06 | **Added time** (Law 7): +N board at 45 / 90 from time lost; first half +1-5, second +2-8 | C✓ | P1 | ✅ |
| RU-07 | **The ref doesn't blow mid-attack**: an attack in the final third plays out, a corner / free kick near goal is taken, a penalty always completed; patience ~14 s | C✓ (FIFA games + referees) | P1 | ✅ |
| RU-08 | **Subs**: 3 a match, fresh legs, no coming back; from the pause menu or half time | C✓ | P1 | ✅ |
| RU-09 | Throw-ins taken overhead | C✓ | P1 | ✅ |

## B. Set pieces and restarts

| ID | Rule | Whose | Pri | Status |
| --- | --- | --- | --- | --- |
| RU-20 | **Set pieces with a RHYTHM**: nearby players jog into the restart's shape, anyone far away moves under the TV wipe (**never a teleport in view**), the taker walks up and places it, then you aim. One timing table (`SETUP`): throw-in 1.5 s, offside / far FK 2.5 s, corner / FK with wall 4 s; ARCADE 0.8 / 1.5 / 2.5. A press skips once the shape is mostly in | L ("they resume without people reorganizing", "corners transition too quick") | P0 | ✅ |
| RU-21 | **Corner BLACKOUT cut**: ball out → whistle → eased fade to black 0.35 s → everyone placed → fade in on the taker walking to the flag; ARCADE half as long; a press runs it 3x faster | L ("add a black out cut that smoothly transitions to corner kick") | P0 | ✅ |
| RU-22 | **Goal kick cut**: TV wipe → keeper at the edge of his six-yard box holding the ball, CBs split, FBs high and wide, midfield spread, strikers near halfway, the other team outside his box; he plays it from his hands | L ("of immediate importance") | P0 | ✅ |
| RU-23 | **Foul scene**: whistle, he goes down, ref runs over, card to the fouler, fouler protests, victim stays down; TV wipe to the free kick with a 9.15 m wall and marked attackers | C✓ | P1 | ✅ |
| RU-24 | **Free kicks bend round the wall** when aimed at a corner; the wall holds its line | C✓ (#106) | P1 | ✅ |
| RU-25 | **Curled corners**: in-swinger, out-swinger, driven, short; the ball still lands where you aimed | L ask, keys "bind it to the proper wasd buttons" | P1 | 🔁 PR #105 (re-map to the new layout, Q-CTL-4) |
| RU-26 | Set-piece aim: faint marker over every team-mate + the ring / arrow on the one your ball finds | C✓ | P1 | ✅ |
| RU-27 | Offside free kick: attackers trot back onside, defence pushes up, a defender / keeper places it | L | P1 | ✅ |
| RU-28 | Penalty: Rami sets the scene, taker places the ball, camera behind the taker → MO-20 | C✓ | P0 | ✅ |
| RU-29 | Kick-off: the ref whistles; the side that conceded kicks off; second half the other side | C✓ | P0 | ✅ |

## C. ARCADE rules (the co-designer's pace mode)

| ID | Rule | Whose | Pri | Status |
| --- | --- | --- | --- | --- |
| RU-40 | ARCADE pace: run 6.0 / sprint 8.8 m/s, snappier turns, longer sprints, quick restarts, short goal replay, 8 s half-time card | F (t-004), L OK | P1 | ✅ |
| RU-41 | **Byline boards**: the ball comes back off the board (no goal kicks), team AI attacks the rebounds | F (t-020) | P1 | ✅ |
| RU-42 | **Throw-ins back** on ARCADE (no touchline boards): "scrap the board for throws" | L | P1 | ✅ |
| RU-43 | **Corners back on ARCADE**: a defender's ball over his own byline = corner (whipped in at head height); an attacker's miss bounces off the board | L ("ADD CORNERS INTO ARCADE BACK"), F built it (#69) | P1 | ✅ |
| RU-44 | Should an attacker's miss on ARCADE become a goal kick too? | — | P? | ❓ Q-RU-1 |
| RU-45 | A smaller ARCADE pitch (plan only) | F / L to decide | P2 | ❓ Q-RU-2 |

## D. Match flow (start to end)

| ID | Moment | What happens | Whose | Pri | Status |
| --- | --- | --- | --- | --- | --- |
| RU-60 | Match settings | ARENA (Het Kleine Loo / Epic Stadium / VUC ground), TIME OF DAY, WEATHER (clear / rain / snow, real ball physics), LEVEL AT 90 (draw / ET / golden goal + pens / ET + pens / pens). Arenas + light are placeholders until the art | L (24 Oct 04:09 notes) | P1 | ✅ (art 📝) |
| RU-61 | Team sheet | your 11 in the formation + 5 on the bench (12 = spare keeper); tap two to swap; kept for next match | L (02:55 notes) | P1 | ✅ |
| RU-62 | Walk-out | camera sweeps the main stand, ref + teams out of the tunnel, line up; any key skips | L | P1 | ✅ |
| RU-63 | Coin toss | ref + captains at the centre spot, you call RISE or the RISE ARROW, coin flips, winner picks; skippable | L | P1 | ✅ |
| RU-64 | Half time | two whistles, players walk off, camera to the stand, HALF TIME card with stats, subs; auto-continue after 25 s; energy back | L | P1 | ✅ |
| RU-65 | Extra time | 2 × 15, new coin toss, no break at 105'; golden goal option | L | P1 | ✅ |
| RU-66 | Penalties after a draw (shoot-out) | → MO-20 | L | P1 | ✅ |
| RU-67 | Full time | everyone applauds the fans; beaten side heads down; stats | C✓ | P2 | ✅ |
| RU-68 | Celebrations | knee slide, aeroplane, points to the sky, facing left / right / camera; keeper roars; hands on head after a near miss | C✓ (PixelLab batches) | P2 | ✅ |
