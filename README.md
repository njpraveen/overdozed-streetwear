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
- `assets/img/`: 900px web copies of the Instagram photos (full-size originals are in `../images`)

## Not wired to a backend

- Email signup only stores addresses in the visitor's browser. Connect it to your email provider.
- Checkout copies the order and opens an Instagram DM to @overdozed__tees.
