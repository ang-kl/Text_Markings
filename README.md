# Text Markings

Hand-drawn Precept-style key-word marking of Bible text.

- `engine/` — the marking engine (`markings.js`), a worked demo, and docs.
- `symbols/` — the 41 marks as transparent SVG stamps, plus `gen_symbols.py` (the deterministic generator) and `assets/manifest.json`.

Tag a word with `data-m="<id>"` (ids match `symbols/assets/manifest.json`), load `engine/markings.js`, and call `TextMarkings.apply('#passage')`. See `engine/README.md`.

Live demo (GitHub Pages): `/engine/demo.html`.
