# Tesla static landing page

Responsive implementation of Figma frame `503:654` (“Home • Desktop”). The base layout remains static; the magnetic-button enhancement is isolated in the `motion/` directory.

## Files

- `index.html` — semantic structure and original visible Figma copy
- `styles.css` — design tokens, layout, components, and responsive breakpoints
- `assets/` — local image and SVG exports from the supplied Figma file
- `motion/magnetic-button.css` — selector-scoped transform layer
- `motion/magnetic-button.js` — dependency-free pointer tracking and spring return

Open `index.html` directly or serve this directory with any static file server.

## Motion-ready structure

Sections expose `data-motion-section`; related children use `data-motion-group` and `data-motion-item`. These hooks are inert. Future motion code can target them without changing layout classes or the content hierarchy. Keep future animation in a separate stylesheet or script so this static baseline remains intact.

Magnetic buttons are explicitly opted in with `data-motion-target="magnetic-button"`. The effect runs only for fine pointers when reduced motion is not requested. Remove the two `motion/magnetic-button.*` references from `index.html` to restore the original static rendering; the remaining label spans and data attributes are visually inert.

Desktop preserves the 1280px content width, 64px gutters, 112px section spacing, and partially visible carousel cards. Tablet and mobile breakpoints reduce gutters and stack dense layouts while retaining every section and visible text.
