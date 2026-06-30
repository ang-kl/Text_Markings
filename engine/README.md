# Text Markings — engine

`markings.js` draws hand-sketched Precept-style key-word symbols over live HTML text. It is dependency-free; the hand-drawn wobble is generated procedurally, so nothing is fetched from the web and it prints to PDF cleanly.

## Use

1. Tag any word or phrase with a `data-m` attribute whose value is a symbol id:

```html
<div id="passage">
  For <span data-m="god">God</span> so <span data-m="love">loved</span> the world,
  that he gave his one and only <span data-m="jesus">Son</span> ...
</div>
```

2. Load the engine and apply it to the container:

```html
<script src="./markings.js"></script>
<script>TextMarkings.apply('#passage');</script>
```

The engine adds an absolutely-positioned SVG overlay to the container, measures each tagged word, and draws its symbol sized to that word. It redraws on resize and before printing. The container is set to `position: relative` automatically.

## API

- `TextMarkings.apply(rootSelectorOrElement, opts)` → `{ redraw, svg }`. `opts.z` sets overlay z-index (default 5); `opts.opacity` sets overlay opacity.
- `TextMarkings.draw(svg, type, box)` → low-level: draw one mark into an SVG at `{x, y, w, h}`.
- Toggle marks: `inst.svg.style.display = 'none'` / `''`.

## Symbol ids

Match `symbols/assets/manifest.json`. Enclosure marks wrap the word and scale to it; pictographs sit just above the word.

`god`, `jesus`, `spirit`, `holy`, `unholy`, `covenant`, `bless`, `curse`, `circumcised`, `die`, `israel`, `sin`, `remnant`, `eternal_life`, `devil`, `land`, `sign`, `law`, `tabernacle`, `nations`, `blood`, `righteous`, `unrighteous`, `atonement`, `wrath`, `redeem`, `coming`, `cry`, `pray`, `listen`, `love`, `gods_love`, `grace`, `suffer`, `repent`, `kingdom`, `believe`, `gospel`, `day_of_the_lord`, `time`, `geography`

Aliases accepted: `christ`→`jesus`, `death`→`die`, `eternal`→`eternal_life`, `tent`→`tabernacle`.

## Files

- `markings.js` — the engine
- `demo.html` — worked example on public-domain passages
- `../symbols/assets/*.svg` — the same marks exported as standalone transparent stamps
- `../symbols/gen_symbols.py` — deterministic generator for the stamps

## Notes

The marks simulate freehand and re-wobble on each render. Cloud-family marks read slightly geometric; raise the `lobe` amplitude in `cloudpts` to puff them out.
