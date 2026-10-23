HELP OUT HAGUE CUP II - environment (VUC, Het Kleine Loo)

THREE STADIUM VERSIONS (21 Oct) - one is active, the others stay in their folders:
  stadium-EPIC\   VUC re-imagined: a huge packed two-tier bowl. Lower + upper tier, glass box level, commentary
                  gantry with Rami, LED ribbons (GOAL!! on goals), roof with floodlights + two video screens,
                  stands behind both goals, flares + coloured smoke + ticker tape on goals.
  stadium-VUC\    the real ground, bigger and better: the green-bench main stand (white columns, brown fascia,
                  VUC gables, orange banners, green booth on top with Rami), brick wall + white/yellow boards,
                  open terraces with crash barriers out to the corners, scaffold bleachers behind both goals,
                  autumn trees + floodlight masts.
  stadium-OG\     THE FINAL ONE - Het Kleine Loo as it really is (built from photos): the wooden main stand with
                  green benches, terracotta roof, VUC gables, glass end screens, brick wall + white/yellow boards,
                  ERELEDEN + BESTUUR, green press box with Rami; fans standing 2-3 deep at the white railing all
                  round, fan banners + flags with the team crests, photographers by the goals, kantine + plaza +
                  penguin sign, pitch 2, trees, flats, windmill, gulls; telescopic players' tunnel. ACTIVE.
  All: packed crowd in team colours (IS / IRO / USCS / LUC / THUAS / AUC sections + Den Haag), fans shrink row by
  row for depth, scarves, flags, hand-made signs, everybody jumps with arms up on goals.
  ACTIVE NOW: see ACTIVE-STADIUM.txt (the files in this folder + the line-up / menus use the active one).
  Side-by-side: HC2-E2-stadium-EPIC-VUC-OG.png

ASEPRITE FILES (edit these):
  HC2-E1-pitch.aseprite        6429x2850  grass / lines / ground outside the pitch / end stands + end boards
                               (animated) / near boards (draw OVER players)
  HC2-E2-far-side.aseprite     6429x900   sits directly ON TOP of the pitch image (its bottom row touches pitch row 0)
                               layers: backdrop + stand / corner surround / crowd (animated) / commentary booth
                               (animated) / front wall + tunnel / pitch-side boards / end stands - far corners
                               (players walking out of the tunnel go BETWEEN 'front wall' and 'pitch-side boards';
                                the boards have an open gate in front of the tunnel)
                               tags: crowd-idle (frames 1-4, 180ms)  crowd-cheer (frames 5-8, 140ms, play on goals)
  HC2-E4-goal-L / -R.aseprite  goals split for depth sorting (anchors in props/HC2-E4-goal-anchors.json)
  HC2-E4-corner-flag.aseprite  yellow VUC flag, tag "wave" (mirror it for the right-hand corners)
  HC2-E4-ball.aseprite         26x26, tags roll-left-right / roll-up-down, shadow layer
  HC2-E6-hud.aseprite          640x360 layout: score bug, clock, radar, commentary box, name tag, cursor
  HC2-E7-lineup-IS-IRO.aseprite 640x360 line-up scene (tags walk-out / pan / match-card); layout in lineup\*.json
  HC2-E6-title-logo.aseprite   title screen logo - DRAFT, PARKED

DRAW ORDER IN GAME (back to front):
  far side: backdrop -> crowd -> booth -> front wall -> boards  ->  pitch grass + lines + ground
  -> end stands (+ the far-corner part of them) -> goal shadow + net back
  -> players / ball / goal frame / flags sorted by feet y -> near boards -> HUD

mockups/ has 640x360 test screens (+2x). Made with scripts, assembled as Aseprite docs: paint over anything by hand.
