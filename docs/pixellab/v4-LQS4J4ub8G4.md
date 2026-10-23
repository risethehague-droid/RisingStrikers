# V4 LQS4J4ub8G4 - How to quickly create punching animations
- Generate character tool + style settings: OUTLINE, SHADING and DETAIL change the look (more detail = more realistic). Try several combos to find the style.
- Generate the rotation, hand-fix (e.g. move a glove), then use the fixed image as INIT IMAGE -> tells the model where things go.
- "Estimate skeleton" first, then edit it to fit the character: the inserted template is based on YOUR skeleton, so a bad neck/shoulder point ruins every frame.
- Delete bad frames and regenerate them using the good frames as guidance.
- Fix a pose by moving the skeleton point instead of the pixels, then go back to frame 1 and generate.
- Last point you touch with the edit tool is drawn closest to the camera (decides which arm is in front).
- A lost prop (glove) is quickest to copy-paste back; a painted blob/copied part also works as init image.
- A 64x64 character can be used as init image to keep size and look.
- Small details: just fix by hand, it takes a second.
