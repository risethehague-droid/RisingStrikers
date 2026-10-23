import numpy as np
from scipy import ndimage
def trophy_mask(a):
    """pixels of the PixelLab trophy (keep its own colours: not snapped to the rig palette, not kit-painted)"""
    rgb = a[:, :, :3].astype(int); r_, g_, b_ = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]; op = a[:, :, 3] > 0
    gold = op & (r_ > 110) & (g_ > 70) & (b_ < 0.5 * g_) & (r_ >= g_)
    lab, n = ndimage.label(gold, structure=np.ones((3, 3))); seed = np.zeros_like(gold)
    for k in range(1, n + 1):
        if (lab == k).sum() >= 120: seed |= lab == k                                 # the cup (sleeve stripes are small)
    if not seed.any(): return seed
    ys, xs = np.nonzero(seed); h = ys.max() - ys.min() + 1
    box = np.zeros_like(seed); box[max(0, ys.min() - 4):min(a.shape[0], ys.max() + int(0.5 * h)), max(0, xs.min() - 14):xs.max() + 15] = True
    warm = op & (r_ >= g_) & (g_ >= 1.8 * b_ + 5) & (r_ > 50)                       # golds + bronze; skin is g/b 1.3-1.6
    return (box & warm) | (ndimage.binary_dilation(seed, iterations=3) & op)
