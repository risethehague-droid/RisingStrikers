# V1 hOZzbQBjKPc - Tutorial: animate, rotate, inpaint (Pixelorama plugin; same tools as Aseprite plugin)
- Create: "create M-XL image" (bigger model); hover any setting for a hint; tick remove background.
- Reduce colours after generating: auto, a fixed count, or YOUR palette -> kills stray colours.
- Rotate tool: set FROM direction + TO direction + "from image". Then either hand-fix, or use the rotated result as INIT IMAGE and regenerate in the right view.
- Shortcuts (Pixelorama): P pencil, M move, E erase, O colour pick, G edit skeleton.
- Animate with skeleton:
  1. Make a skeleton template using the character as reference; nudge points (G). Better points = better frames.
  2. Turn the template to face the same direction as the character.
  3. Force the head points (fixed head) -> face stays the same.
  4. Freeze 1 -> generate 2. CLEAN those frames before going on: bad frames poison the next ones.
  5. Stand on the last good frame, freeze 2 -> generate 1 (two frames act as reference).
- Fix a wrong limb: draw black on the INPAINTING layer where it may change + switch ON init image (else model can't see underneath). Copy-paste good parts between frames.
- Tag the frames, set frame duration in properties, play to check.
- Inpainting also adds equipment. Retry: a second try is often better.
- Help: their Discord, post an image of the problem.
