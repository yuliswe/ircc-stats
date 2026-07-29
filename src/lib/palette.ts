/**
 * TypeScript mirror of the validated palette in theme.css (§8). Charts that
 * drive a d3/JS color scale need concrete hex values per theme (CSS variables
 * are not resolvable during SSR), so both themes are kept here in lockstep with
 * the CSS. If you change a value, change it in both files and re-run
 * scripts/validate_palette.js.
 */
import type { StreamId } from '@/lib/viz-types';

export type ThemeMode = 'light' | 'dark';

export const CATEGORICAL: Record<ThemeMode, string[]> = {
  light: [
    '#2a78d6',
    '#1baf7a',
    '#eda100',
    '#008300',
    '#4a3aa7',
    '#e34948',
    '#e87ba4',
    '#eb6834',
  ],
  dark: [
    '#3987e5',
    '#199e70',
    '#c98500',
    '#008300',
    '#9085e9',
    '#e66767',
    '#d55181',
    '#d95926',
  ],
};

/** Sequential blue ramp, light→dark index order (near-zero → high). */
export const SEQUENTIAL: Record<ThemeMode, string[]> = {
  light: ['#7db3ef', '#5a9ae8', '#2a78d6', '#17508f', '#0d366b'],
  dark: ['#1c5aa0', '#2a78d6', '#5a9ae8', '#8fbcf1', '#b8d4f7'],
};

export const DIVERGING: Record<
  ThemeMode,
  { cool: string; mid: string; warm: string }
> = {
  light: { cool: '#2a78d6', mid: '#f0efec', warm: '#e34948' },
  dark: { cool: '#3987e5', mid: '#383835', warm: '#e66767' },
};

export const INK: Record<
  ThemeMode,
  {
    ink: string;
    ink2: string;
    muted: string;
    grid: string;
    surface: string;
    border: string;
  }
> = {
  light: {
    ink: '#0b0b0b',
    ink2: '#52514e',
    muted: '#898781',
    grid: '#e1e0d9',
    surface: '#fcfcfb',
    border: '#e1e0d9',
  },
  dark: {
    ink: '#ffffff',
    ink2: '#c3c2b7',
    muted: '#898781',
    grid: '#2c2c2a',
    surface: '#1a1a19',
    border: '#2c2c2a',
  },
};

/**
 * Activity-type → categorical slot, per §6 Chart 2. Cool routine reads first,
 * warm serious reads last. TRV codes use slots 1/3/8 with a neutral legend
 * until the severity mapping is supplied.
 */
const ACTIVITY_SLOT: Record<StreamId, Record<string, number>> = {
  PR: {
    'Security Screening': 0,
    'Org Crime Screening': 7,
    'HIRV Screening': 5,
  },
  TRV: { 'VIT 34': 0, 'VIT 35': 2, 'VIT 37': 7 },
};

export function activityColor(
  stream: StreamId,
  activity: string,
  theme: ThemeMode
): string {
  const slot = ACTIVITY_SLOT[stream]?.[activity];
  const idx = slot ?? 4; // fall back to a stable non-routine slot
  return CATEGORICAL[theme][idx];
}

/** Fixed-order categorical color for the i-th top-dimension slice. */
export function sliceColor(i: number, theme: ThemeMode): string {
  return CATEGORICAL[theme][i % CATEGORICAL[theme].length];
}

/** Linear interpolate between two #rrggbb hex colors, t in [0,1]. */
export function lerpHex(a: string, b: string, t: number): string {
  const pa = [1, 3, 5].map(i => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map(i => parseInt(b.slice(i, i + 2), 16));
  const c = pa.map((v, i) =>
    Math.round(v + (pb[i] - v) * Math.max(0, Math.min(1, t)))
  );
  return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
}

/**
 * Diverging color for an enrichment ratio. `value` is the log-enrichment
 * (log2 of the ratio): 0 = neutral midpoint, positive = over-referred (warm),
 * negative = under-referred (cool). `span` is the half-range that saturates.
 */
export function divergingColor(
  logValue: number,
  theme: ThemeMode,
  span = 2
): string {
  const { cool, mid, warm } = DIVERGING[theme];
  const t = Math.max(-1, Math.min(1, logValue / span));
  return t >= 0 ? lerpHex(mid, warm, t) : lerpHex(mid, cool, -t);
}

/** Sequential color for a normalized magnitude t in [0,1]. */
export function sequentialColor(t: number, theme: ThemeMode): string {
  const ramp = SEQUENTIAL[theme];
  const x = Math.max(0, Math.min(1, t)) * (ramp.length - 1);
  const i = Math.floor(x);
  if (i >= ramp.length - 1) return ramp[ramp.length - 1];
  return lerpHex(ramp[i], ramp[i + 1], x - i);
}

/**
 * Sequential red→blue color for a normalized magnitude t in [0,1], with red at
 * the low end and blue at the high end. It reuses the diverging anchors so the
 * two ends match the rest of the palette, and the pale midpoint marks
 * mid-range values.
 */
export function redBlueColor(t: number, theme: ThemeMode): string {
  const { cool, mid, warm } = DIVERGING[theme];
  const x = Math.max(0, Math.min(1, t));
  return x < 0.5
    ? lerpHex(warm, mid, x * 2)
    : lerpHex(mid, cool, (x - 0.5) * 2);
}

/**
 * Low-end anchor for {@link grayRedBlueColor}: the `--surface-3` neutral from
 * theme.css, so the ramp's zero end matches the map's empty / no-data surface.
 */
const RAMP_GRAY: Record<ThemeMode, string> = {
  light: '#eceae3',
  dark: '#2f2f2d',
};

/**
 * High-end anchor for {@link grayRedBlueColor}: a deeper blue than the diverging
 * `cool`, so the most-admitted nationalities read as a strong, saturated blue.
 * Kept local to the ramp rather than shared with {@link DIVERGING} so darkening
 * it here does not shift the diverging charts.
 */
const RAMP_BLUE: Record<ThemeMode, string> = {
  light: '#134a91',
  dark: '#2f74cc',
};

/**
 * Position of the red peak on the gray→red→blue ramp: gray→red fills [0, this]
 * and red→blue fills [this, 1]. Keeping it well below 0.5 lets blue dominate the
 * upper range, so mid-volume quantities already read blue rather than red.
 */
const RAMP_RED_AT = 0.2;

/**
 * Sequential gray→red→blue color for a normalized magnitude t in [0,1]. Unlike
 * {@link redBlueColor}, this is a true low-to-high ramp rather than a diverging
 * one: the low end reads as neutral gray (matching the empty surface, so zero
 * and near-zero barely register), red peaks at {@link RAMP_RED_AT} for medium
 * quantities, and the high end resolves to blue for the largest quantities. Red
 * reuses the diverging warm anchor, while blue uses the deeper {@link RAMP_BLUE}
 * so the high end reads darker than the diverging charts.
 */
export function grayRedBlueColor(t: number, theme: ThemeMode): string {
  const { warm } = DIVERGING[theme];
  const gray = RAMP_GRAY[theme];
  const blue = RAMP_BLUE[theme];
  const x = Math.max(0, Math.min(1, t));
  return x <= RAMP_RED_AT
    ? lerpHex(gray, warm, x / RAMP_RED_AT)
    : lerpHex(warm, blue, (x - RAMP_RED_AT) / (1 - RAMP_RED_AT));
}
