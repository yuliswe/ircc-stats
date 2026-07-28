'use client';

/**
 * Reveal signal shared from a ChartCard down to its plot. ChartCard runs one
 * IntersectionObserver per card and flips this to `true` the first time the card
 * scrolls into view, so a chart's entrance animation plays when the reader
 * actually reaches it rather than on mount (which, for the charts below the fold,
 * would finish long before they are seen). The custom SVG/HTML charts read the
 * reveal state through the `data-reveal` attribute ChartCard sets on the card
 * element and their CSS animation classes; the Recharts charts, whose points are
 * animated by the library rather than by our CSS, read this boolean instead and
 * mount their series only once revealed. The default is `true` so a chart used
 * without a ChartCard wrapper still renders its marks.
 */
import { createContext, useContext } from 'react';

export const RevealContext = createContext(true);

export const useRevealed = () => useContext(RevealContext);
