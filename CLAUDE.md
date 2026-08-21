# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Single-page Croatia travel landing page. Plain HTML, CSS, and vanilla JavaScript — **no framework, no build step, no bundler, no dependencies**. Everything runs directly from the source files.

## Commands

```bash
npm start   # or: npm run dev — runs `npx serve .`, hosts at http://localhost:3000
```

There is no build, lint, or test setup. The page can also be opened directly (`index.html` in a browser) since it works fully offline with no build step.

## Architecture

Three files carry the entire site, each with a single responsibility:

- **`index.html`** — all markup, in document order: header/nav → hero → destinations carousel → experience cards → FAQ accordion → plan form → footer. Interactive regions are wired to `script.js` via `data-*` attributes (`data-carousel`, `data-carousel-track`, `data-accordion`, `data-form`, etc.), not IDs/classes — when adding a new interactive block, follow this convention rather than querying by class.
- **`styles.css`** — mobile-first, single stylesheet organized into clearly commented sections (design tokens under `:root`, then layout/buttons/header/hero/carousel/cards/accordion/form/footer, then responsive breakpoints at the bottom: `860px`, `640px`, `1200px`, plus a `prefers-reduced-motion` block). Design tokens (colors, spacing, font stacks) are CSS custom properties in `:root` — change values there, not at each call site.
- **`script.js`** — one `DOMContentLoaded` listener that calls five independent init functions, each self-contained and each a no-op if its root element isn't found on the page (`if (!root) return;`): `initMobileNav`, `initCarousel`, `initAccordion`, `initForm`, `initExperienceCards`. There is no shared state or module system — if adding a new component, follow the same pattern (one `initX()` function, called from `DOMContentLoaded`, guarded by an early return).

Notable behaviors to preserve when touching these components:
- Carousel autoplay (5s) pauses on hover/focus, stops entirely under `prefers-reduced-motion`, and pauses when the tab is hidden (`visibilitychange`).
- Accordion is single-open: opening one panel closes all others; panel height is animated via inline `style.height` (not CSS `height: auto`) and recalculated on window resize.
- The contact form has no backend — submission is simulated client-side (validates, shows a success message, resets). Validation covers required fields, email format via regex, and a min/max travelers range; errors are wired to inputs via `aria-describedby` and toggled live as the user corrects them.
- Experience cards pre-fill the form's `interests` field via `data-interest` and rely on the existing `href="#plan"` anchor for scrolling — no JS-driven scrolling logic.

### Performance conventions

- The hero image is a CSS background (not an `<img>`), so it's explicitly `<link rel="preload" as="image" fetchpriority="high">`'d in `<head>` since the browser can't discover it until `styles.css` loads.
- Carousel images: only the first slide is `loading="eager"`; the rest are `loading="lazy"`. All images declare explicit `width`/`height` to avoid layout shift.
- Google Fonts are loaded non-blocking via the preload+`onload` rel-swap trick, with a `<noscript>` fallback.

Keep these patterns in mind for any new images/fonts added to the page.