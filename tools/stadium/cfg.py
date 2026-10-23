# Shared world geometry for Help Out Hague Cup II environment art.
# Base game resolution 640x360. Players ~110px tall -> PX_H ~60 px per metre of height.
# Classic ISS-style fixed perspective: the camera only scrolls left/right, the pitch art is
# pre-projected as if seen from the main (bottom) stand: lines across the pitch lean in
# towards the centre the further away they are (matches the approved master style frame).
PX_X = 48          # px per metre along the pitch at mid-depth
PX_Y = 38          # px per metre across the pitch (foreshortened)
PX_H = 60          # px per metre of height (posts, flags, people) - constant

PITCH_L = 105.0    # metres (change these two for a smaller tournament pitch)
PITCH_W = 68.0
S_FAR = 0.87       # horizontal scale at the far touchline
S_NEAR = 1.13      # horizontal scale at the near touchline

RUNOFF_X = 6.0     # grass behind each goal line (room for nets / boards)
RUNOFF_Y = 3.5     # grass beside each touchline

PW = int(PITCH_W * PX_Y)
RY = int(RUNOFF_Y * PX_Y)
GRASS_H = PW + 2 * RY
Y0 = RY
_half_bottom = (PITCH_L / 2 + RUNOFF_X) * PX_X * (S_NEAR + (S_NEAR - S_FAR) * RUNOFF_Y / PITCH_W)
GRASS_W = int(2 * _half_bottom) + 8
CX = GRASS_W // 2

LINE_V = 4    # thickness (px, horizontal) of lines running into the screen
LINE_H = 3    # thickness (px, vertical) of lines running left-right

BAND = 56     # mowing band height px (matches approved master style frame)

G_DARK = (34, 189, 69)
G_LIGHT = (25, 212, 61)
G_DEEP = (22, 160, 58)
G_HI = (70, 226, 92)
WORN1 = (104, 196, 76)
WORN2 = (140, 186, 88)
WHITE = (252, 254, 252)
SHADOW = (32, 63, 53)
BLACK = (0, 0, 0)

def scale_at(ym):
    return S_FAR + (S_NEAR - S_FAR) * (ym / PITCH_W)

def P(xm, ym):
    """world metres (x from left goal line, y from far touchline) -> grass image px (float)"""
    s = scale_at(ym)
    return CX + (xm - PITCH_L / 2) * PX_X * s, Y0 + ym * PX_Y
