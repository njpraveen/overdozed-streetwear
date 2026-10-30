"""Cut the tee out of each flat-lay mockup (beige manga backdrop) -> transparent WebP.

usage: python cutout.py <img_dir> <out_dir> <preview.jpg> id=file:color ...
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi

SIZE = 900  # output canvas (square)


def disk(r):
    y, x = np.ogrid[-r:r + 1, -r:r + 1]
    return x * x + y * y <= r * r


def largest(m):
    lab, n = ndi.label(m)
    if n == 0:
        return m
    sizes = ndi.sum(m, lab, range(1, n + 1))
    return lab == (1 + int(np.argmax(sizes)))


def by_fabric(lum, chroma, color):
    """Grow from pixels that look like the shirt fabric."""
    seed = (lum > 205) & (chroma < 28) if color == 'White' else (lum < 48) & (chroma < 40)
    m = largest(ndi.binary_opening(seed, structure=disk(7)))  # drop ink lines / text
    m = ndi.binary_fill_holes(m)                               # the printed design
    m = ndi.binary_closing(m, structure=disk(9))
    return ndi.binary_fill_holes(m)


def by_backdrop(a, lum, chroma):
    """Flood the beige manga backdrop in from the borders; the shirt is what's left."""
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    beige = (lum > 95) & (lum < 238) & (r > b + 14) & (chroma > 14) & (chroma < 90)
    # Swallow the ink lines inside panels. Pad first: closing treats off-image as empty,
    # which would erode the backdrop away from the borders we flood from.
    P = 7
    bg = ndi.binary_closing(np.pad(beige, P, mode='edge'), structure=disk(5))[P:-P, P:-P]
    lab, _ = ndi.label(bg)
    edge = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    bg = np.isin(lab, edge[edge > 0])
    m = largest(ndi.binary_opening(~bg, structure=disk(6)))
    return ndi.binary_fill_holes(m)


def cut(path, color):
    im = Image.open(path).convert('RGB')
    a = np.asarray(im).astype(np.float32)
    lum = a @ np.array([0.299, 0.587, 0.114], np.float32)
    chroma = a.max(2) - a.min(2)

    # Fabric finds clean edges; the backdrop flood keeps prints that touch the edge.
    # Union them, then close small gaps so a print framed by fabric gets filled.
    m = by_fabric(lum, chroma, color) | by_backdrop(a, lum, chroma)
    m = ndi.binary_fill_holes(ndi.binary_closing(m, structure=disk(6)))
    if color == 'White':
        # Dark manga ink stuck to a white tee's outline isn't fabric: trim it from the outer band.
        band = m & ~ndi.binary_erosion(m, structure=disk(14))
        m = largest(m & ~(band & (lum < 110)))
        m = ndi.binary_fill_holes(m)
    m = ndi.binary_opening(m, structure=disk(4))      # smooth ragged edges

    alpha = Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.1))
    rgba = im.copy()
    rgba.putalpha(alpha)

    # Crop to the garment and drop it onto a square canvas: centred, collar near the top.
    ys, xs = np.where(m)
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    g = rgba.crop((x0, y0, x1 + 1, y1 + 1))
    scale = min((SIZE * 0.98) / g.width, (SIZE * 0.96) / g.height)
    g = g.resize((round(g.width * scale), round(g.height * scale)), Image.LANCZOS)
    canvas = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    canvas.paste(g, ((SIZE - g.width) // 2, round(SIZE * 0.02)), g)
    return canvas, m.mean()


def main():
    src, out, preview = Path(sys.argv[1]), Path(sys.argv[2]), sys.argv[3]
    out.mkdir(parents=True, exist_ok=True)
    tiles = []
    for spec in sys.argv[4:]:
        pid, rest = spec.split('=', 1)
        fname, color = rest.split(':')
        img, cover = cut(src / f'{fname}.jpg', color)
        img.save(out / f'{pid}.webp', 'WEBP', quality=84, method=6)
        kb = (out / f'{pid}.webp').stat().st_size // 1024
        print(f'{pid:18s} {color:5s} cover={cover:.2f} {kb}KB')
        t = Image.new('RGB', img.size, (190, 30, 30))
        t.paste(img, (0, 0), img)
        tiles.append(t.resize((240, 240)))
    sheet = Image.new('RGB', (240 * 5, 240 * ((len(tiles) + 4) // 5)), (0, 0, 0))
    for i, t in enumerate(tiles):
        sheet.paste(t, ((i % 5) * 240, (i // 5) * 240))
    sheet.save(preview, quality=85)


if __name__ == '__main__':
    main()
