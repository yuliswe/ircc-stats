'use client';

/**
 * Shared client store for the Bias Explorer. Holds the global controls (§5) and
 * the single selected-country cross-filter state (§7), keeps them in the URL so
 * a view is shareable by link, resolves + applies the theme, and exposes the
 * derived metrics for the active stream. Charts read everything from `useViz()`
 * and never take data as props, which keeps them self-contained.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { StreamId, ValueField, VizData } from '@/lib/viz-types';
import {
  computeMetrics,
  type StreamMetrics,
  type TopDimFilter,
} from '@/lib/selectors';
import type { ThemeMode } from '@/lib/palette';
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n';

export type Metric = 'seriousShare' | 'enrichment' | 'referralRate';

export type Selection = {
  cit: string;
  iso3: string | null;
};

type VizState = {
  data: VizData;
  streamId: StreamId;
  valueField: ValueField;
  topDim: TopDimFilter;
  minScreenings: number;
  metric: Metric;
  selection: Selection | null;
  theme: ThemeMode;
  userTheme: ThemeMode | null;
  locale: Locale;

  stream: VizData['streams'][StreamId];
  metrics: StreamMetrics;

  setStreamId: (s: StreamId) => void;
  setValueField: (v: ValueField) => void;
  setTopDim: (t: TopDimFilter) => void;
  setMinScreenings: (n: number) => void;
  setMetric: (m: Metric) => void;
  select: (s: Selection | null) => void;
  toggleTheme: () => void;
};

const Ctx = createContext<VizState | null>(null);

const METRICS: Metric[] = ['seriousShare', 'enrichment', 'referralRate'];

function readInitial(search: string) {
  const p = new URLSearchParams(search);
  const stream = p.get('stream') === 'TRV' ? 'TRV' : 'PR';
  const valueField: ValueField =
    p.get('basis') === 'total2025' ? 'total2025' : 'grand';
  const catsRaw = p.get('cats');
  const topDim: TopDimFilter = catsRaw
    ? catsRaw.split('~').filter(Boolean)
    : null;
  const minRaw = p.get('min');
  const min = minRaw === null ? NaN : Number(minRaw);
  const metric = (
    METRICS.includes(p.get('metric') as Metric) ? p.get('metric') : 'enrichment'
  ) as Metric;
  const selCit = p.get('sel');
  return {
    streamId: stream as StreamId,
    valueField,
    topDim,
    minScreenings: Number.isFinite(min) && min >= 0 ? min : 30,
    metric,
    selCit,
  };
}

export function VizProvider({
  data,
  locale = DEFAULT_LOCALE,
  children,
}: {
  data: VizData;
  /**
   * The active language, fixed by the route: `/` renders English and `/zh`
   * renders Chinese. Each locale is a separately prerendered static page, so the
   * value is a constant for the lifetime of the provider rather than toggled
   * client-side; switching language is a navigation between the two routes.
   */
  locale?: Locale;
  children: ReactNode;
}) {
  // SSR renders defaults; the first client effect hydrates from the URL.
  const [streamId, setStreamId] = useState<StreamId>('PR');
  const [valueField, setValueField] = useState<ValueField>('grand');
  const [topDim, setTopDim] = useState<TopDimFilter>(null);
  const [minScreenings, setMinScreenings] = useState(30);
  const [metric, setMetric] = useState<Metric>('enrichment');
  const [selection, setSelection] = useState<Selection | null>(null);
  const [userTheme, setUserTheme] = useState<ThemeMode | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // hydrate controls + selection from the URL, once
  useEffect(() => {
    const init = readInitial(window.location.search);
    setStreamId(init.streamId);
    setValueField(init.valueField);
    setTopDim(init.topDim);
    setMinScreenings(init.minScreenings);
    setMetric(init.metric);
    if (init.selCit) {
      const c = data.streams[init.streamId].cityCells.find(
        x => x.cit === init.selCit
      );
      setSelection({ cit: init.selCit, iso3: c?.iso3 ?? null });
    }
    setHydrated(true);
  }, [data]);

  // theme: light by default; the reader's persisted toggle is the only override.
  // The OS dark preference is deliberately not followed, so the report always
  // opens light unless the reader has explicitly switched to dark before.
  useEffect(() => {
    const stored = window.localStorage.getItem('viz-theme');
    if (stored === 'light' || stored === 'dark') setUserTheme(stored);
  }, []);

  const theme: ThemeMode = userTheme ?? 'light';

  useEffect(() => {
    const root = document.documentElement;
    if (userTheme) root.setAttribute('data-theme', userTheme);
    else root.removeAttribute('data-theme');
  }, [userTheme]);

  // Keep the document language in sync with the route so screen readers and the
  // browser announce the right language. The static export prerenders the shared
  // root layout with `lang='en'`, so this corrects `/zh` after hydration.
  useEffect(() => {
    document.documentElement.lang = locale === 'zh' ? 'zh-Hans' : 'en';
  }, [locale]);

  // write controls back to the URL (replaceState — no history spam)
  useEffect(() => {
    if (!hydrated) return;
    const p = new URLSearchParams();
    if (streamId !== 'PR') p.set('stream', streamId);
    if (valueField !== 'grand') p.set('basis', valueField);
    if (topDim && topDim.length) p.set('cats', topDim.join('~'));
    if (minScreenings !== 30) p.set('min', String(minScreenings));
    if (metric !== 'enrichment') p.set('metric', metric);
    if (selection) p.set('sel', selection.cit);
    const qs = p.toString();
    window.history.replaceState(
      null,
      '',
      qs ? `?${qs}` : window.location.pathname
    );
  }, [
    hydrated,
    streamId,
    valueField,
    topDim,
    minScreenings,
    metric,
    selection,
  ]);

  const stream = data.streams[streamId];

  const metrics = useMemo(
    () => computeMetrics(stream, valueField, topDim),
    [stream, valueField, topDim]
  );

  // switching stream invalidates the top-dim filter and any selection
  const changeStream = useCallback((s: StreamId) => {
    setStreamId(s);
    setTopDim(null);
    setSelection(null);
  }, []);

  const toggleTheme = useCallback(() => {
    setUserTheme(prev => {
      // No prior override means the reader is on the light default, so the
      // first toggle goes to dark.
      const next: ThemeMode = (prev ?? 'light') === 'dark' ? 'light' : 'dark';
      window.localStorage.setItem('viz-theme', next);
      return next;
    });
  }, []);

  const value: VizState = {
    data,
    streamId,
    valueField,
    topDim,
    minScreenings,
    metric,
    selection,
    theme,
    userTheme,
    locale,
    stream,
    metrics,
    setStreamId: changeStream,
    setValueField,
    setTopDim,
    setMinScreenings,
    setMetric,
    select: setSelection,
    toggleTheme,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useViz(): VizState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useViz must be used within VizProvider');
  return v;
}
