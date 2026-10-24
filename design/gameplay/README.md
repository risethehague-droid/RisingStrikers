# Gameplay & mechanics

**What this is:** every mechanic the co-designer is shaping for HC2 Football, from idea to live, in one list.
One note per mechanic lives next to this file (or is linked where it already exists). The co-designer keeps a
working copy of this list in his sidebar ("HC2 Gameplay"); this file is the shared one for Luca and the agents.

Owner: the co-designer (Design & Vision). Last updated: 25 Oct 2026, v0.11.0.

**Statuses:** Idea · Planned · Worker on it · In preview · Sent to Luca · Live

## Pace & arcade
| Status | Mechanic | Notes |
| --- | --- | --- |
| Live | Arcade pace part 1: faster movement, snappier turns, less waiting | v0.10.3, PR #7 (worker-f) |
| Planned | Arcade pace part 2: football-anime energy, more specials both ways, MASH duels, more than human. **Not easier**; cut-scenes stay | worker-f after t-016, preview first. [design note](../arcade-pace.md) |

## Lobs, chip & aerials
| Status | Mechanic | Notes |
| --- | --- | --- |
| Live | Lob arc + a fair aerial duel at the drop | PR #2: your lobs kept 45% -> 75% |
| Live | Lob step A: real height, shrinking shadow, landing ring, the keeper's read | v0.10.3, PR #8 (worker-l) |
| Live | Lob remake: steer the landing ring, timed runs, the AERIAL BATTLE (MASH!) | v0.11.0, PR #15 |
| Planned | Lob B: spin, three lofted kicks (floated / driven / chip) | waiting on Luca's picks; prototype behind `#lobB`. [study](../../docs/lob-chip.md) |
| Planned | Chip: **arcade** feel (fast, hard dip), on **LOB + SHOOT** | the co-designer's picks; part of B |
| Planned | Driven lob on SPRINT + LOB, as a trial behind a switch | part of B |
| Idea | Aftertouch lobs (the stick bends the ball after the kick) | direction C, later, on top of B |
| Idea | Chest traps and volleys are still rare after a lob | receivers are marked tight, so they head it |

## Team AI
| Status | Mechanic | Notes |
| --- | --- | --- |
| Planned | Smarter team AI, both sides: running, positioning, passing, less clunky. **Not harder** | stage 1 measure + plan, after Arcade 2. Baseline: CPU lobs reach their man 12% |
| Worker on it | Blocked players find another way to the ball | worker-f, t-016 (Luca's Bug Watch mark) |
| Live | Wing play: wide runs, overlaps, crosses to runners | v0.11.0, PR #13 |

## Keepers
| Status | Mechanic | Notes |
| --- | --- | --- |
| Live | Keeper AI rebuild: dives by height, tips, punches, more held shots | v0.11.0, PR #14; corners ~0 -> ~5 a match |
| Worker on it | The keeper never turns his back on a close ball | worker-f, t-016 |
| Planned | Keeper backpedal + tip-over-the-bar animations | PixelLab, about 8-16 generations, with lob B |

## Duels & specials
| Status | Mechanic | Notes |
| --- | --- | --- |
| Planned | MASH duels on 50-50 loose balls and tackles | part of Arcade 2 |
| In preview | Curving special passes (CURLER / OUTSIDE CURL / BANANA LOB) | Test Lab only until Luca switches it on |
| In preview | Goal physics: a net with give, round posts, rebounds | Test Lab only |
| In preview | Tap kick | Test Lab only |

## Controls & camera
| Status | Mechanic | Notes |
| --- | --- | --- |
| Live | Camera: Close / Medium / Wide | v0.9.6, PR #1 |
| Live | INSTA FLAG (F) + a replay player you can pause and scrub | v0.11.0 |

## Modes
| Status | Mechanic | Notes |
| --- | --- | --- |
| Idea | STREET 5s: beach court, walls, 5 v 5, the Day Dream Deli backdrop | parked (t-003 dropped); Luca OK'd the mode and the name |
| Idea | Next-mode pitch: Matchday / Beach 5s / Skill School | draft on `friend/pitch-next-mode`, not sent |

## How to add a mechanic
A row in the right table, and for anything bigger than a line, a note `design/gameplay/<topic>.md` that leads with
the proposal in two lines (as `docs/lanes/design.md` asks).
