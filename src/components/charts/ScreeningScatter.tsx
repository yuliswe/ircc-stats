'use client';

/**
 * Chart 3 — Applications vs. security screenings, scatter.
 *
 * The same 2025 per-nationality data as the connected-dot volume chart, laid out
 * as a scatter so the applications→screenings relationship reads as a cloud of
 * countries rather than one row each. Each country is one dot at
 * x = total applications and y = total security screenings, both on true linear
 * axes. The dot area scales linearly with total applications, so the largest
 * source country (India at 1.38M) reads as a much bigger mark while smaller
 * countries shrink toward a point. Dot color mirrors chart 1, diverging about
 * the national screening rate (warm = referred more often than the national
 * average, cool = less), which lines up with the national-average diagonal.
 *
 * Recharts (like the referral-rate scatter) so the axes, gridlines, size channel
 * (ZAxis), and hover cursor come for free; the render is gated on `mounted` to
 * avoid an SSR/hydration mismatch from ResponsiveContainer measuring width.
 */
import { useMemo, useState, useEffect, type ReactNode } from 'react';
import { useRevealed } from '@/lib/reveal';
import {
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import { useViz } from '@/lib/store';
import { INK, divergingColor } from '@/lib/palette';
import { fmtInt, fmtPct } from '@/lib/format';
import { flagName, pick, type Locale } from '@/lib/i18n';
import { CHARTS, chartText } from '@/content/strings';
import { ChartCard } from '@/components/viz/ChartCard';
import { Legend } from '@/components/viz/Legend';
import type { Column } from '@/components/viz/TableView';

// All user-facing copy for this chart lives in `@/content/strings`
// (`CHARTS.screeningScatter` for static labels, `chartText.screeningScatter` for
// interpolated prose); this alias keeps the call sites terse.
const T = CHARTS.screeningScatter;
const TX = chartText.screeningScatter;

// Log-axis floor so a country with zero screenings still plots near the bottom
// (log(0) is undefined); the real count is preserved in the tooltip and table.
const SCREEN_FLOOR = 0.5;

const log10 = (x: number) => Math.log(x) / Math.LN10;
const log2 = (x: number) => Math.log(x) / Math.LN2;
const floorPow = (v: number) => Math.pow(10, Math.floor(log10(v)));
const ceilPow = (v: number) => Math.pow(10, Math.ceil(log10(v)));

/** Compact axis-tick label: 0, 1k, 100k, 1.4M. */
function tickLabel(v: number): string {
  if (v >= 1_000_000) return `${+(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${+(v / 1_000).toFixed(0)}k`;
  return String(v);
}

type Point = {
  cit: string;
  iso3: string | null;
  x: number; // total applications
  y: number; // total security screenings
  z: number; // size channel: total applications (linear)
  applications: number;
  referred: number;
  pct: number;
};

export function ScreeningScatter() {
  const { data, theme, selection, select, locale } = useViz();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  // Points animate in only once the card scrolls into view; the key remounts the
  // series when that flips so Recharts replays its enter animation on reveal.
  const revealed = useRevealed();

  const ink = INK[theme];

  // Dot color mirrors chart 1: diverging about the national screening rate, so a
  // country referred more often than the national average reads warm and one
  // referred less reads cool. logVsAvg = log2(country rate ÷ national rate);
  // a country with zero screenings has no defined ratio and stays neutral.
  const colorFor = (p: Point): string =>
    divergingColor(
      p.pct > 0 && nationalRate > 0 ? log2(p.pct / nationalRate) : 0,
      theme
    );

  const points = useMemo<Point[]>(
    () =>
      data.screeningApplications
        .filter(r => r.applications > 0)
        .map(r => ({
          cit: r.cit,
          iso3: r.iso3,
          x: r.applications,
          y: r.referred > 0 ? r.referred : SCREEN_FLOOR,
          z: r.applications,
          applications: r.applications,
          referred: r.referred,
          pct: r.referred / r.applications,
        }))
        .sort((a, b) => b.applications - a.applications),
    [data.screeningApplications]
  );

  // Explicit power-of-ten domains that bracket the data. On a Recharts log axis,
  // domain={['auto','auto']} does not compute bounds that contain the points, so
  // with allowDataOverflow the dots render outside the plotting area.
  const [xDomain, yDomain] = useMemo<
    [[number, number], [number, number]]
  >(() => {
    if (!points.length)
      return [
        [1, 10],
        [1, 10],
      ];
    let xlo = Infinity;
    let xhi = -Infinity;
    let ylo = Infinity;
    let yhi = -Infinity;
    for (const p of points) {
      if (p.x < xlo) xlo = p.x;
      if (p.x > xhi) xhi = p.x;
      if (p.y < ylo) ylo = p.y;
      if (p.y > yhi) yhi = p.y;
    }
    return [
      [floorPow(xlo), ceilPow(xhi)],
      [floorPow(ylo), ceilPow(yhi)],
    ];
  }, [points]);

  // National average = aggregate screenings ÷ aggregate applications across every
  // nationality (the pooled rate, not the mean of per-country rates). On log-log
  // axes y = nationalRate · x is a straight diagonal; a country plotted above it
  // is screened more often than the national average predicts for its volume.
  const nationalRate = useMemo(() => {
    let apps = 0;
    let scr = 0;
    for (const r of data.screeningApplications) {
      if (r.applications <= 0) continue;
      apps += r.applications;
      scr += r.referred;
    }
    return apps > 0 ? scr / apps : 0;
  }, [data.screeningApplications]);

  // Endpoints of the national-average line, both lying exactly on y = rate·x and
  // clipped to the visible domain, so the segment keeps its true slope-1 geometry
  // instead of being bent by a floored endpoint. (On log-log axes a proportional
  // line is straight; the two ends are where it crosses the left/bottom edge and
  // the right/top edge of the plot.)
  const avgSegment = useMemo<
    readonly [{ x: number; y: number }, { x: number; y: number }] | null
  >(() => {
    if (nationalRate <= 0) return null;
    const [x0, x1] = xDomain;
    const [y0, y1] = yDomain;
    const xStart = Math.max(x0, y0 / nationalRate);
    const xEnd = Math.min(x1, y1 / nationalRate);
    if (!(xEnd > xStart)) return null;
    return [
      { x: xStart, y: nationalRate * xStart },
      { x: xEnd, y: nationalRate * xEnd },
    ];
  }, [nationalRate, xDomain, yDomain]);

  const selectedCit = selection?.cit ?? null;
  const opacityFor = (p: Point): number => {
    if (!selectedCit) return 0.82;
    return p.cit === selectedCit ? 1 : 0.2;
  };

  const tableColumns: Column[] = [
    { key: 'cit', label: pick(locale, T.colCountry) },
    {
      key: 'applications',
      label: pick(locale, T.colApplications),
      num: true,
    },
    { key: 'referred', label: pick(locale, T.colScreenings), num: true },
    { key: 'pct', label: pick(locale, T.colPctScreened), num: true },
  ];
  const tableRows: Record<string, ReactNode>[] = points.map(p => ({
    cit: flagName(locale, p.cit, p.iso3),
    applications: fmtInt(p.applications),
    referred: fmtInt(p.referred),
    pct: fmtPct(p.pct, 2),
  }));

  const subtitle = TX.subtitle(locale);

  const footnote = pick(locale, T.footnote);

  const legend = (
    <Legend
      items={[
        {
          label: pick(locale, T.legendBelow),
          color: divergingColor(-2, theme),
        },
        {
          label: TX.legendAvg(locale, { screened: nationalRate }),
          color: ink.ink2,
        },
        {
          label: pick(locale, T.legendAbove),
          color: divergingColor(2, theme),
        },
      ]}
    />
  );

  let body: ReactNode;
  if (!points.length) {
    body = <div className='chart-empty'>{pick(locale, T.empty)}</div>;
  } else if (!mounted) {
    body = <div style={{ height: 360 }} />;
  } else {
    body = (
      <div style={{ width: '100%', height: 360 }}>
        <ResponsiveContainer width='100%' height='100%'>
          <ScatterChart margin={{ top: 10, right: 24, bottom: 40, left: 12 }}>
            <CartesianGrid stroke={ink.grid} strokeDasharray='3 3' />
            <XAxis
              type='number'
              dataKey='x'
              name={pick(locale, T.xName)}
              scale='log'
              domain={xDomain}
              allowDataOverflow
              tickFormatter={tickLabel}
              tick={{ fill: ink.muted, fontSize: 11 }}
              stroke={ink.grid}
              label={{
                value: pick(locale, T.xAxisLabel),
                position: 'insideBottom',
                offset: -18,
                fill: ink.ink2,
                fontSize: 12,
              }}
            />
            <YAxis
              type='number'
              dataKey='y'
              name={pick(locale, T.yName)}
              scale='log'
              domain={yDomain}
              allowDataOverflow
              tickFormatter={tickLabel}
              tick={{ fill: ink.muted, fontSize: 11 }}
              stroke={ink.grid}
              label={{
                value: pick(locale, T.yAxisLabel),
                angle: -90,
                position: 'insideLeft',
                offset: -2,
                fill: ink.ink2,
                fontSize: 12,
              }}
            />
            <ZAxis
              type='number'
              dataKey='z'
              range={[30, 520]}
              name={pick(locale, T.zName)}
            />
            {avgSegment ? (
              <ReferenceLine
                stroke={ink.ink2}
                strokeDasharray='5 4'
                ifOverflow='hidden'
                segment={avgSegment}
              />
            ) : null}
            <Tooltip
              isAnimationActive={false}
              cursor={{ stroke: ink.muted, strokeDasharray: '3 3' }}
              content={<ScatterTip locale={locale} />}
            />
            <Scatter
              key={revealed ? 'shown' : 'hidden'}
              data={points}
              isAnimationActive={revealed}
              animationBegin={0}
              animationDuration={720}
              animationEasing='ease-out'
              onClick={(pt: unknown) => {
                const p = pt as {
                  cit?: string;
                  iso3?: string | null;
                  payload?: Point;
                };
                const cit = p?.cit ?? p?.payload?.cit;
                const iso3 = p?.iso3 ?? p?.payload?.iso3 ?? null;
                if (!cit) return;
                select(selectedCit === cit ? null : { cit, iso3 });
              }}
            >
              {points.map(p => {
                const emphasized = selectedCit != null && p.cit === selectedCit;
                return (
                  <Cell
                    key={p.cit}
                    fill={colorFor(p)}
                    fillOpacity={opacityFor(p)}
                    stroke={emphasized ? ink.ink : ink.surface}
                    strokeWidth={emphasized ? 2 : 0.5}
                    style={{ cursor: 'pointer' }}
                  />
                );
              })}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <ChartCard
      title={pick(locale, T.title)}
      subtitle={subtitle}
      legend={points.length ? legend : undefined}
      footnote={footnote}
      tableColumns={tableColumns}
      tableRows={tableRows}
    >
      {body}
    </ChartCard>
  );
}

/** Recharts Tooltip content styled to match the app's tooltip box. */
function ScatterTip({
  active,
  payload,
  locale = 'en',
}: {
  active?: boolean;
  payload?: { payload: Point }[];
  locale?: Locale;
}) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0].payload;
  const rows: [string, string][] = [
    [pick(locale, T.tipApplications), fmtInt(p.applications)],
    [pick(locale, T.tipScreenings), fmtInt(p.referred)],
    [pick(locale, T.tipPctScreened), fmtPct(p.pct, 2)],
  ];
  return (
    <div className='viz-tooltip' role='tooltip'>
      <div className='t-title'>{flagName(locale, p.cit, p.iso3)}</div>
      {rows.map(([label, value]) => (
        <div className='t-row' key={label}>
          <span>{label}</span>
          <b>{value}</b>
        </div>
      ))}
    </div>
  );
}
