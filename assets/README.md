# Site assets

## founder-portrait.jpg

Renders in the `#founder` section on the homepage.

- **Aspect ratio: 4:5 portrait.** The slot is `aspect-ratio: 4/5`; anything
  else gets centre-cropped to fit.
- **Supply 920 × 1160 px minimum** — the slot renders ~462 × 578 CSS px at
  desktop, and this is the 2× retina size. 1240 × 1550 is better if you have it.
- **JPEG, ~80% quality**, or WebP. Keep it under ~250 KB.
- The section background is `--surface-2` (a warm paper tone), not white. A
  pure-white studio background reads as a white rectangle inside the rounded
  frame — which looks deliberate and is fine. A transparent PNG cutout would
  instead blend into the paper ground; either works, they just look different.

If the file is absent the homepage falls back to the hatched "Founder portrait"
placeholder — the `<img>` removes itself on error, so a missing file never
shows a broken image.
