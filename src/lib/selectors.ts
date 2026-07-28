/**
 * Pure derivation of bias metrics from the tidy cells (docs/ui-spec.md §3.2).
 *
 * Everything a chart needs is computed here from the emitted `CityCell` /
 * `OfficeCell` arrays, reactive to the Time-basis and Top-dimension-filter
 * controls. The min-screenings control is a *display* threshold applied by each
 * chart (helper `applyThreshold`), not a change to the global denominators, so
 * filtering small countries out never repaints the shares of the rest.
 */
import type { StreamData, ValueField } from './viz-types';
import { log2 } from './format';

export interface CountryMetric {
  cit: string;
  iso3: string | null;
  /** value per activity type, for the active value field + top-dim filter */
  byActivity: Record<string, number>;
  routine: number;
  serious: number;
  /** all activity types summed — the country's screening total */
  total: number;
  /** serious / total; null when the serious mapping is unknown (TRV) */
  seriousShare: number | null;
  /** seriousShare / globalSeriousShare; null when unknown or total is 0 */
  enrichment: number | null;
  /** log2(enrichment) for the diverging log axis; null when enrichment is null */
  logEnrichment: number | null;
}

export interface StreamMetrics {
  countries: CountryMetric[];
  globalSerious: number;
  globalTotal: number;
  globalSeriousShare: number | null;
  activityTypes: string[];
  seriousTypes: string[];
  routineType: string;
  seriousMappingKnown: boolean;
}

const pick = (g: number, t: number, field: ValueField) =>
  field === 'grand' ? g : t;

/** Set of allowed top-dimension values, or null for "all". */
export type TopDimFilter = string[] | null;

function catAllowed(filter: TopDimFilter): (cat: string) => boolean {
  if (!filter || filter.length === 0) return () => true;
  const set = new Set(filter);
  return cat => set.has(cat);
}

export function computeMetrics(
  stream: StreamData,
  field: ValueField,
  topDim: TopDimFilter
): StreamMetrics {
  const allow = catAllowed(topDim);
  const seriousSet = new Set(stream.seriousTypes);
  const known = stream.seriousMappingKnown;

  const byCit = new Map<string, CountryMetric>();
  let globalSerious = 0;
  let globalTotal = 0;

  for (const c of stream.cityCells) {
    if (!allow(c.cat)) continue;
    const v = pick(c.g, c.t, field);
    if (v === 0) continue;
    let m = byCit.get(c.cit);
    if (!m) {
      m = {
        cit: c.cit,
        iso3: c.iso3,
        byActivity: {},
        routine: 0,
        serious: 0,
        total: 0,
        seriousShare: null,
        enrichment: null,
        logEnrichment: null,
      };
      byCit.set(c.cit, m);
    }
    m.byActivity[c.act] = (m.byActivity[c.act] ?? 0) + v;
    m.total += v;
    if (c.act === stream.routineType) m.routine += v;
    if (seriousSet.has(c.act)) m.serious += v;
    globalTotal += v;
    if (seriousSet.has(c.act)) globalSerious += v;
  }

  const globalSeriousShare =
    known && globalTotal > 0 ? globalSerious / globalTotal : null;

  for (const m of byCit.values()) {
    if (known && m.total > 0) {
      m.seriousShare = m.serious / m.total;
      if (globalSeriousShare && globalSeriousShare > 0) {
        // Enrichment as ratio of shares; guard the zero-serious case so the log
        // axis stays finite (floor at a small share rather than -Infinity).
        const share = m.seriousShare > 0 ? m.seriousShare : 0.5 / m.total;
        m.enrichment = share / globalSeriousShare;
        m.logEnrichment = log2(m.enrichment);
      }
    }
  }

  return {
    countries: [...byCit.values()],
    globalSerious,
    globalTotal,
    globalSeriousShare,
    activityTypes: stream.activityTypes,
    seriousTypes: stream.seriousTypes,
    routineType: stream.routineType,
    seriousMappingKnown: known,
  };
}

/** Split a country list into those meeting the min-screenings threshold and a hidden count. */
export function applyThreshold<T extends { total: number }>(
  countries: T[],
  min: number
): { shown: T[]; hiddenCount: number } {
  if (min <= 0) return { shown: countries, hiddenCount: 0 };
  const shown = countries.filter(c => c.total >= min);
  return { shown, hiddenCount: countries.length - shown.length };
}

// ── office matrix (Chart 3) ──────────────────────────────────────────────────────
export interface OfficeMatrix {
  countries: string[];
  offices: string[];
  /** value[cit][office] */
  value: Map<string, Map<string, number>>;
  rowTotal: Map<string, number>;
  colTotal: Map<string, number>;
}

export function computeOfficeMatrix(
  stream: StreamData,
  field: ValueField,
  topDim: TopDimFilter
): OfficeMatrix {
  const allow = catAllowed(topDim);
  const value = new Map<string, Map<string, number>>();
  const rowTotal = new Map<string, number>();
  const colTotal = new Map<string, number>();

  for (const c of stream.officeCells) {
    if (!allow(c.cat)) continue;
    const v = pick(c.g, c.t, field);
    if (v === 0) continue;
    let row = value.get(c.cit);
    if (!row) {
      row = new Map();
      value.set(c.cit, row);
    }
    row.set(c.off, (row.get(c.off) ?? 0) + v);
    rowTotal.set(c.cit, (rowTotal.get(c.cit) ?? 0) + v);
    colTotal.set(c.off, (colTotal.get(c.off) ?? 0) + v);
  }

  return {
    countries: [...value.keys()],
    offices: [...colTotal.keys()],
    value,
    rowTotal,
    colTotal,
  };
}

// ── hierarchy (Chart 6) ────────────────────────────────────────────────────────
export interface HierNode {
  name: string;
  value?: number;
  children?: HierNode[];
}

/** Build a category → activity → citizenship tree sized by the active value field. */
export function computeHierarchy(
  stream: StreamData,
  field: ValueField,
  topDim: TopDimFilter
): HierNode {
  const allow = catAllowed(topDim);
  const cats = new Map<string, Map<string, Map<string, number>>>();
  for (const c of stream.cityCells) {
    if (!allow(c.cat)) continue;
    const v = pick(c.g, c.t, field);
    if (v === 0) continue;
    let acts = cats.get(c.cat);
    if (!acts) {
      acts = new Map();
      cats.set(c.cat, acts);
    }
    let cits = acts.get(c.act);
    if (!cits) {
      cits = new Map();
      acts.set(c.act, cits);
    }
    cits.set(c.cit, (cits.get(c.cit) ?? 0) + v);
  }
  return {
    name: stream.topDimensionLabel,
    children: [...cats.entries()].map(([cat, acts]) => ({
      name: cat,
      children: [...acts.entries()].map(([act, cits]) => ({
        name: act,
        children: [...cits.entries()].map(([cit, v]) => ({
          name: cit,
          value: v,
        })),
      })),
    })),
  };
}
