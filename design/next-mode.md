# Pitch: the next new mode

**Proposal:** build **Matchday Mode** next: two people play each other on one PC, short matches, winner stays on,
with a queue and a day's leaderboard, ready for the Help Out Hague Cup II event itself.
Two other directions below; the co-designer picks, then Luca decides.

Status: draft by the co-designer (Design & Vision). Not a card yet.

## What the game has today

Friendly matches, the HAGUE CUP tournament, a 1V1 penalty battle against the computer, four difficulty levels,
three arenas (Het Kleine Loo is the real one; EPIC STADIUM and VUC GROUND are placeholders), weather, time of day,
camera Close / Medium / Wide. Every mode is one person against the computer.

## A. Matchday Mode (favourite)

- **Setting and tone:** the event day at Het Kleine Loo. Loud, quick, social. Rami hypes the next challenger.
- **What's new to play:**
  - two players on one PC: one per half of the keyboard, or one each on a gamepad
  - 3-minute matches, golden goal if level
  - winner stays on; a queue of names typed at the start screen
  - the day's table: wins, goals, best streak, shown between matches
  - an attract screen when nobody plays (the demo already does most of this)
- **What it needs:**
  - code: a second set of controls and a second human player (Gameplay & AI, medium); gamepad input is off today
    (`input: { gamepad: false }`), so turning it on and mapping it; the queue and table screens (Design & Vision, small)
  - art: little. The red cursor for player 2 already exists. Maybe a "NEXT UP" card [PixelLab, about 5 generations]
  - rough size: 2 to 3 pull requests
- **Risk:** two people on one keyboard can press keys the keyboard can't register together (key ghosting). Fix by
  testing on the event laptop early, or by making gamepads the main way to play on the day.

## B. Scheveningen Beach 5s

- **Setting and tone:** 5-a-side on the beach at Scheveningen, the pier behind, sunset light. Summer, scrappy, fun.
- **What's new to play:**
  - 5 v 5 on a small pitch, no offside, throw-ins replaced by kick-ins
  - sand: the ball slows faster and barely bounces; sliding tackles throw up sand
  - a new arena in the setup screen, replacing one of the placeholders
- **What it needs:**
  - art: a whole new ground built to the stadium projection: sand pitch, pier backdrop, beach crowd, boards
    [PixelLab, roughly 60 to 120 generations, ask on the board first; Aseprite layout]
  - code: team shape and AI for 5 players (Gameplay & AI, large); sand ball physics (small); kick-ins (small)
  - rough size: 4 to 6 pull requests across two lanes
- **Risk:** the team AI is tuned for 11 a side. Five players may stand in odd places until it's retuned.

## C. Skill School

- **Setting and tone:** a training session before the cup. Short, replayable, a bit of a puzzle.
- **What's new to play:**
  - bite-size challenges: bend a free kick over the wall, beat the keeper 1 v 1, chip him, defend a 2 v 1,
    score a header from a corner
  - 1 to 3 stars each, a best score saved on the browser
  - stars unlock things: the other kits, the WIDE camera, the night setting
- **What it needs:**
  - code: mostly re-using the Test Lab's set-ups, which already place players and the ball exactly (small to medium);
    the challenge menu and star screens (Design & Vision, small)
  - art: a few icons and a star badge [PixelLab, about 10 generations]
  - rough size: 2 pull requests
- **Risk:** the Test Lab set-ups were built to test the AI, not to be fun. Each one needs tuning so it feels fair.

## Why A first

The game exists for one day of football in The Hague. Matchday Mode turns it from a one-person game into something
the crowd plays together on that day, it needs almost no new art, and it reuses the demo, Rami and the cup screens.
B is the best-looking one and fits the Stadiums lane, so it is a strong second. C is the cheapest.

## Decisions for Luca

1. Which direction (A, B or C)?
2. For A: keyboard pairs, gamepads, or both? Which laptop runs it on the event day?
3. For B: OK to spend about 60 to 120 PixelLab generations on the beach ground?
