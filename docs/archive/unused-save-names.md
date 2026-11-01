# Unused save names (archived 1 Nov 2026)

**Made by Claude, never asked for or approved by Luca. Not used anywhere in the game.**

Luca, 1 Nov 2026 22:17: "The special names should only exist for the special saves which require the B or the charge
up and a use of a bar or use of energy. So yeah, please remove all of those. Remove them from the database for now, or
put them in a file for maybe use later, but I don't want you to get confused between what I've made and what you've
made and I haven't told you to make."

So normal saves show **no name** on screen and play no name sound. Only the keeper **special saves** (SPECIAL key, a bar
spent) have names: IRON WALL (LV1), THUNDER GLOVE (LV2), RISING SHIELD (LV3). They pop up in `game/src/gkcounter.js`.

Kept here only in case Luca wants them one day. Don't bring any of them back without his OK.

## Plain-save name pop-ups (were in `game/src/movecall.js` SAVE_CALL, PR #85, 31 Oct)

| Name | Shown when | Element look | Sound |
| --- | --- | --- | --- |
| SAFE HANDS | a catch | glove | glove |
| FALCON CATCH | a diving catch | wind | wind |
| SKY CLAIM | a high ball claimed | holy | holy |
| FINGERTIPS | tipped over the bar | holy | holy |
| ARC PARRY | parried round the post | water | water |
| STEEL PALM | parried | iron | iron |
| HAMMER FIST | punched clear | earth | earth |
| BLACK HOLE | smothered | shadow | shadow |
| STARFISH WALL | blocked | iron | (glove) |
| BARE HANDS | a special stopped with no bars (PR #71) | sun | bigSave |

## Flair-save names (were shown on screen in `game/src/gkstyle.js`, PR #76, and as pop-ups via movecall.js)

SKY SNATCH (lob, one-handed leap catch), FLYING STRETCH (full-length dive), TOP-CORNER STRETCH, LOW SCRAMBLE,
STARFISH WALL. The save **animations** themselves stay in the game (Luca asked for situational saves, 31 Oct). The names
are still the internal labels of those animations in `GS_NAMES` and on the Test Lab's FREE PLAY buttons, never on
screen in a match.
