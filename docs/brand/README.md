# StellarPOS brand mark

**Scan Star**: a four-point star inside the corner brackets of a QR scanner.
It stands for "scan to pay with Stellar", the product's core move.

| File | Use |
|---|---|
| `stellarpos-logo.svg` / `.png` | Default mark: ink brackets and an indigo star on a transparent background |
| `stellarpos-logo-icon.svg` / `.png` | App icon and favicon: light brackets and a brighter star on a dark rounded tile |

Colors: ink `#1D1B16`, paper `#F5F0E6`, Stellar indigo `#3B3FB6` (`#6E72F0` on dark).

In the app, `src/components/layout/BrandMark.tsx` draws the mark inline. Its
brackets use `currentColor`, so the mark follows light and night themes.
Keep clear space around it of at least one bracket width, and do not recolor
the star outside the indigo family.
