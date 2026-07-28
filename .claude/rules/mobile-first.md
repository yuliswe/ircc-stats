---
description: The UI must be mobile friendly
globs:
  - '**/*.tsx'
alwaysApply: false
---

# Mobile-first UI

Every `.tsx` component must render a mobile-friendly UI. Design for small
screens first and progressively enhance for larger viewports.

- Assume a narrow viewport (roughly 320–390px wide) as the baseline, and add
  wider layouts through responsive breakpoints rather than the other way around.
- Never let content overflow horizontally. Wide elements such as tables,
  charts, code blocks, and diagrams must scroll inside their own
  `overflow-x: auto` container so that the page body itself never scrolls
  sideways.
- Use fluid, relative units and layout primitives (flexbox or grid, percentage
  or `min()`/`max()`/`clamp()` widths, `max-width: 100%` on media) instead of
  fixed pixel widths that break on small screens.
- Ensure interactive targets are large enough to tap comfortably, with a
  minimum touch target of about 44×44px and adequate spacing between them.
- Keep text legible without zooming, and avoid fixed heights that clip content
  when it wraps onto more lines on a narrow screen.
- Verify that navigation, modals, and menus are usable with touch and collapse
  gracefully on small screens.
