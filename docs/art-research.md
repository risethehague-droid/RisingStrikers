# HC2 Football: posing and impact notes

Researched 2026-10-24. Other games' move names appear here as reference only. Keep them out of PixelLab prompts, and never feed their images to PixelLab. "[synth]" marks my own synthesis, not something a source states.

## 0. The short version

- Every strong move has four beats: **coil** (move opposite to the action), **spring**, **one signature peak pose**, **held landing or recoil**.
- Spend frames unevenly: wind-up and recoil are held longer, the strike is the shortest phase.
- Put contact at roughly 40-55% of the clip [synth]. Fighting games land it earlier (about 30%, section 3).
- Judge each move by silhouette: one long diagonal, or one big X, Y or T.
- The game draws the ball, so poses must "point" at where it is: eyes, arms, foot line.

## 1. Inazuma Eleven special moves

**Keeper moves share one skeleton**
- *Set*, then *reverse*: lean back, cross the arms into an X and uncross them, or crouch and pull a fist back. The body goes away from the ball first.
- *Charge*: energy gathers in a hand or fist. For a sprite game that is a tense held pose [synth].
- *Spring and thrust*: stand tall or spring at the ball and thrust one arm or both forward.
- *Catch*: one hand takes the ball, the other grips that wrist.
- Barrier saves are a hold: the keeper slaps the air, leans back, swings forward, then stays planted with arms out while the ball pushes against the pose. Give HC2 keepers 2-3 held frames at full reach, then a recoil.
- The signature silhouette is an oversized arm or hand thrust at the ball.
- The wiki notes the Strikers games play part of the success animation before a failure. Failed saves deserve equal polish: a one-frame "almost", then a collapse.

**Shoot moves**
- Volley-based shots: sudden stop, crouch, lean forward, jump and spin in the air, strike at the top.
- Others use backflips or a whirlwind spin before the volley, or throw teammates high so they flip down onto a high ball.
- Pattern: the run stops dead, the body goes small, then it explodes into a big airborne shape.

**Light versus big (level-3 style) moves**
- Light and fast (a rapid fist flurry, a quick strike): 1 anticipation frame, short crouch, small arc, 1-2 strike frames, quick recovery [synth].
- Big moves: longer charge, summoned figure or aura, ground reaction (a tear opening under the keeper), longer hold.
- Without effect sprites, "bigger" becomes body terms [synth]: 1-2 extra anticipation frames, deeper crouch, wider arm arc, 2-3 held peak frames, bigger landing recoil.

## 2. Real goalkeeping as pose vocabulary

**Set position**
- Feet shoulder-width, weight on the balls of the feet, nose over toes, hands waist-high in front, elbows slightly bent, head up.
- Silhouette: compact forward-leaning "A" with hands out.

**Collapse (low) dive**
1. Set.
2. Power step with the near foot.
3. Chest drops toward the knee, head and hands in front of the knee.
4. Fall sideways: hip, then side, then shoulder.
5. Near hand behind the ball, far hand on top, ball pinned to the ground. Rock back up on the swinging leg.
- Silhouette: a body folding to one side, close to the ground.

**Extension dive (high, far post)**
1. Set.
2. A few shuffle steps, then a long step.
3. Arms swing, body launches, arms out in front.
4. Fully stretched, head, hands and feet moving together.
5. Land on the side, not the stomach.
- Silhouette: one long diagonal from planted foot through hips to fingertips.
- Top versus bottom hand (one study, 8 semi-pro keepers): the bottom hand gave more sideways reach, the top hand more vertical reach. Reaching high with the upper hand reads "high"; the lower hand leading reads "far" [synth].

**Tip over the bar**
- Fingertips guide the ball, deflecting with the pace of the hand. Preferred: the hand nearest the goal, closed. Alternative: the far hand, open, for extra reach and a natural wrist rotation.
- Beats [synth]: side-on lean, step, reach, flick, drop away with the head turned up.

**Punching**
- Two fists: fingers together, thumbs on top, V across the knuckles, elbows locked at contact, drive up and out. The powerful default.
- One fist: when the ball is just out of reach. Flat of the fist through the lower half of the ball, short punch, rigid wrist, the other arm guards.
- Beats: knee up, arms back, fists forward at the peak, retreat side-on.

**Leap to claim a high ball (knee up)**
1. Front foot steps under the ball's path.
2. That knee drives up, the back foot pushes off.
3. Elbows stay parallel to the body.
4. Hands rise together and meet the ball at its highest point with open palms (a "W").
5. Firm grip.
- Silhouette: one knee high, tall stable torso, hands above the head.

**Starfish block (1v1)**
- Within about 7 m. Body as large as possible: front leg out, back foot behind the body, arms up and out, one hand high and one low, chest leading, no flinch.
- Beats: sprint, short steps, throw the body wide, hold the star 2-3 frames [synth].

**Smother**
- Early step with the near foot, hands lead in a "W", elbows tucked, impact on the side and shoulder.

## 3. Impact in very short sprite animations

- **Anticipation**: at least one frame in the opposite direction. Keep wind-ups short, because too long reads as input lag. Heavy moves can earn a longer one.
- **Hold frames**: hold the follow-through longer for weight; a hold on the anticipation peak sells the strike. One source's split: wind-up 150 ms, peak hold 200 ms, strike 50 ms, recovery 120 ms. Varied timing beats extra frames. With uniform timing, duplicate the frame to hold it.
- **Fighting-game timing**: startup, active, recovery. Two cited moves: 5 startup, 4 active, 7 recovery; and 13 startup, then a multi-hit window, 15 recovery. Contact lands about 30% in, recovery is long. For 8-12 frames, aim contact at frame 5 or 6 of 10 and keep the strike pose for two frames [synth].
- **Smear**: one blurred in-between at the fastest point is often enough.
- **Squash and stretch**: 1-3 pixel changes at small sizes. For a 14 px sprite: squash to 12-13 px tall, stretch to 15-16 px, for a frame or two. Scale up proportionally for 256 px [synth].
- **Exaggeration**: push the pose about 30% past "looks right", because subtle motion vanishes at small sizes.
- **Hit-stop**: a brief freeze on impact reads as weight. Ballpark tiers: weak 0-0.03 s, strong 0.05-0.08 s, critical 0.1-0.15 s. That is a game-side choice; in the clip, a duplicated contact frame does the same job.
- **Follow-through and overlap**: the limb overshoots its stop point; faster motion overshoots more. Body parts should peak on slightly different frames.
- **Silhouette**: squint or blur. If the action is unclear, extend the arm, lower the crouch, raise the jump.
- **Low top-down staging**: lower on screen reads as nearer. Anchor feet, shadow and face centre unless the move leaves the ground. [synth] The camera squashes vertical motion, so favour horizontal reach, show jumps by lifting the sprite off its shadow, and pose limbs across the body, not straight at or away from the camera.

## 4. Kicks

**Toe-poke or side-foot jab**
- Little to no backlift, hits with the tip of the boot, no tell for the keeper. Often off balance or in tight space. The side-foot place uses the inside of the foot: accuracy over power.
- Beats: plant, foot barely lifts, shin snaps out, contact, stops. Upright, short stab, almost no follow-through.

**Full shot** [synth]
- High backlift, plant foot beside, head over, locked ankle, then a full follow-through (2-3 frames).

**Curl, outside of the boot**
- Approach from the side. Plant foot farther from the ball than usual. Ankle locked. Strike the ball off-centre with the outer foot, then carry the leg through and up. Another source: rotate the ankle away from the body after contact.
- Silhouette: wide stance, leg sweeping low to high across the body diagonal.

**Curl, inside or instep**
- The foot wraps around the outside of the ball and the follow-through makes the spin.
- Silhouette: leg swings across the body, torso leans away from the curve.

**Scooped lob pass**
- Plant foot beside or slightly behind, toes pointed down and tucked under, short backswing, quick snap from the knee, slight lean back (more lean, more arc), very short follow-through.
- Silhouette: leaning back, the foot cut short under the body.

**Slice, and what makes a curl read** [synth, from the curl coaching]
- Slice: the foot travels across the ball, not through it, and the finish points across the body.
- A curl reads from the leg sweeping across the body, the torso leaning away, and a finish that wraps opposite to the travel direction. The ball's own trail finishes the sell.

## 5. Aerial strikes matched to ball height

**Chest-high dropping ball: volley**
- Kicking leg gets behind the ball's path, knee over the ball, toes down, ankle locked.
- Short sharp strike just above the ball's centre. Head over, eyes on the ball, arms spread for balance, no overswing.
- Silhouette: one-legged T with the knee high, then the leg snapping out.

**Ball dropping over the head: overhead or bicycle**
1. Back to goal, tracking the ball.
2. Lean back, jump off one leg.
3. Body goes nearly horizontal.
4. Scissor: the kicking leg snaps up as the other comes down; contact on the laces.
5. Land on the side opposite the kicking foot, arms out to cushion.
- Silhouette: horizontal body, scissor V of legs, arms below.

**Very high ball: leap and strike at the top** [synth]
- Deep crouch, explosive spring, one knee driving high. Add a hang frame at the peak so the strike reads as "at the top". Spins and backflips make strong peak silhouettes. Land in a crouch.
- Silhouette: stretched vertical body, one leg whipped over the top.

## 6. Prompt fragments

Add "with no ball anywhere in the picture" to every prompt. The wording is mine, built from the poses above.

1. coils low on bent knees, then springs up off both feet, one knee driving high
2. leans back with arms crossed in an X, then uncoils and thrusts both arms forward
3. pulls one fist back beside the hip, then punches forward in a sharp line
4. plants the front foot, drives the near knee up, reaches both open hands high above the head
5. drops into a deep crouch, then explodes upward into a stretched vertical leap
6. flings the body sideways in a long diagonal stretch, arms out in front, one hand leading
7. folds to one side in a low dive, hip then shoulder meeting the ground, hands pinned flat
8. one arm stretched high overhead, fingertips flicking up, body leaning away
9. fists thrown upward and outward, one knee raised, driving all the way through the punch
10. spreads arms and legs wide in a star shape, chest forward, eyes fixed ahead
11. short stabbing swing from a planted foot, shin snapping out, leg stopping dead
12. wide stance, leg sweeping low to high across the body, ankle locked, torso leaning away
13. leans back with the foot tucked underneath, a quick short flick and an abrupt stop
14. kicking knee high and out in front, arms spread for balance, lower leg whipping out
15. leans far back, body flat in the air, one leg scissoring up while the other drops
16. hangs at the top of a high leap, then whips one leg over the top in a hard strike
17. holds the strike pose for two beats, arms locked, chest forward, then relaxes
18. body slightly squashed at the moment of impact, then stretched taller as it springs back
19. big wind-up: deep crouch, arm swung far back, held for a beat, then a lunging thrust
20. light and fast: tiny crouch, tight arc, instant recovery

## Source notes

- The Inazuma wiki describes moves step by step but gives no animation theory; the principles are my reading.
- Thin spots (marked [synth]): slice, very high ball strikes, tipping (one academy page); the top/bottom hand study is small.
- Retailer-hosted "biomechanical breakdown" articles looked like SEO filler and were skipped.

## Sources

Inazuma Eleven wiki:
- https://inazuma-eleven.fandom.com/wiki/Omega_The_Hand
- https://inazuma-eleven.fandom.com/wiki/Tamashii_The_Hand
- https://inazuma-eleven.fandom.com/wiki/God_Catch
- https://inazuma-eleven.fandom.com/wiki/Diamond_Hand
- https://inazuma-eleven.fandom.com/wiki/Million_Hands
- https://inazuma-eleven.fandom.com/wiki/Needle_Hammer
- https://inazuma-eleven.fandom.com/wiki/Machine_Gun_Beat
- https://inazuma-eleven.fandom.com/wiki/Eagle_Buster
- https://inazuma-eleven.fandom.com/wiki/The_Galaxy
- https://inazuma-eleven.fandom.com/wiki/Majin_The_Wave
- https://inazumaelevenweb.fandom.com/wiki/Majin_The_Hand
- https://inazuma-eleven.fandom.com/wiki/The_Asura
- https://inazuma-eleven.fandom.com/wiki/Fire_Tornado_DD
- https://inazuma-eleven.fandom.com/wiki/Grand_Fire
- https://inazuma-eleven.fandom.com/wiki/Spinning_Shoot

Animation and game feel:
- https://slynyrd.com/blog/2018/9/8/pixelblog-9-melee-attacks
- https://www.slynyrd.com/blog/2025/3/24/pixelblog-55-top-down-character-animation
- https://www.slynyrd.com/blog/2019/10/21/pixelblog-22-top-down-character-sprites
- https://www.sprite-ai.art/blog/sprite-animation-frames
- https://www.sprite-ai.art/guides/animation-principles
- https://wigglypaint.com/blog/pixel-art-animation-guide/
- https://www.wayline.io/learn/sprite-animation/3
- https://sourcegaming.info/2015/11/11/thoughts-on-hitstop-sakurais-famitsu-column-vol-490-1/
- https://uhiyama-lab.com/en/notes/unity/unity-game-feel-hit-feedback/
- https://gamer-ai-nexgen.duckdns.org/blog/anatomy-of-a-good-game-punch
- https://dustloop.com/w/Using_Frame_Data

Goalkeeping:
- https://www.keeperstop.com/blogs/goalkeeper_drills-diving_extensions_reaction_saves/goalkeeper_drills-diving_extensions_reaction_saves-goalkeeper_collapse_dive_progression
- https://williemcdonald.substack.com/p/diving-techniques-types-of-dives
- https://www.sportsessionplanner.com/s/zxZX/GK-Clinic-Week-3---Collapse-Diving.html
- https://carlisleunited.co.uk/news/2014/june/academy-keeper-training-part-two
- https://www.carlisleunited.co.uk/news/2014/june/academy-keeper-training-part-three
- https://www.carlisleunited.co.uk/news/2014/june/academy-keeper-training-part-four
- https://lida.sport-iat.de/dfb/Record/4024171?lng=en
- https://www.fifatrainingcentre.com/en/environment/fifa-goalkeeper-training/goalkeeping-fundamentals/learning-to-deal-with-high-balls.php
- https://www.fifatrainingcentre.com/en/environment/fifa-goalkeeper-training/goalkeeping-fundamentals/learning-to-x-block-in-a-1-on-1.php
- https://footballgpt.co/goalkeeper/gk-punching
- https://www.skool.com/goalkeeper/one-vs-one-blocks

Kicks and aerial strikes:
- https://www.planetfootball.com/in-depth/the-glory-of-the-toe-poke-finish-an-ode-to-footballs-most-underrated-skill
- https://learn.englandfootball.com/articles/resources/2022/Different-finishing-techniques-in-football
- https://sportsessionplanner.com/s/v6Z6h/Curving-the-Ball.html
- https://sportsessionplanner.com/s/9t1nb/Curling-the-ball.html
- https://www.sportsessionplanner.com/s/Wzpg
- https://jobsinfootball.com/blog/skills/trivela-soccer/
- https://www.soccercoachweekly.net/coaching-advice/how-to-chip-the-ball
- https://mojo.sport/coachs-corner/how-to-chip-the-soccer-ball
- https://mojo.sport/coachs-corner/how-to-volley-the-ball/
- https://fourfourtwo.com/performance/skills/volley-van-der-vaart
- https://en.wikipedia.org/wiki/Volley_(association_football)
- https://ussoccerplayers.com/2009/10/how-to-take-a-bicycle-kick.html
- https://www.cupello.com/blog/bicycle-kick
