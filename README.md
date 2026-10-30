# OVERDOZED — site

Static site, no build step. Libraries load from CDNs (GSAP 3.12.5 + ScrollTrigger, Lenis 1.1.13, Three.js 0.160.0).

## Run locally

```bash
python -m http.server 5173 --directory .
```

Then open http://localhost:5173. (Opening `index.html` directly from disk won't load the 3D module.)

## Files

- `index.html`: all sections and the dialog/cart markup
- `css/style.css`: tokens, layout, effects, reduced-motion rules
- `js/products.js`: catalogue, sizes, next-drop date, Instagram handle. **Edit prices here.**
- `js/main.js`: intro, Lenis, GSAP reveals, cursor, magnetic buttons, marquee, rail, filters, product dialog, cart, lookbook, manifesto, countdown, signup, theme
- `js/tee3d.js`: procedural Three.js t-shirt
- `js/rail.js`: the clothing rail (tees hanging on a curved bar) and its close-up dialog. The tees on the rail are listed in `IDS` at the top.
- `assets/img/`: 900px web copies of the Instagram photos (full-size originals are in `../images`)
- `assets/cutout/`: transparent cut-outs used by the rail
- `tools/cutout.py`: makes those cut-outs from the flat-lay mockups (needs `numpy pillow scipy`)

## Adding a tee to the rail

```bash
python tools/cutout.py assets/img assets/cutout preview.jpg my-id=09-mahadev:Black
```

Then add `my-id` to `IDS` in `js/rail.js`. Check `preview.jpg`: the script works best on the beige manga-backdrop mockups.

## Not wired to a backend

- Email signup only stores addresses in the visitor's browser. Connect it to your email provider.
- Checkout copies the order and opens an Instagram DM to @overdozed__tees.
