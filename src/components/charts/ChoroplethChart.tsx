'use client';

/**
 * Chart 5 — "Nationals preferred by Canada" world map (docs/ui-spec.md §6).
 *
 * This map reads the nationality-bias story through the volume of permanent-
 * residence admissions, in which each country is colored by the number of
 * Confirmation-of-Permanent-Residence documents issued to its nationals in 2025,
 * so that a country from which Canada admitted many permanent residents reads as
 * strongly preferred and a country from which it admitted few reads as barely
 * preferred. Because the CoPRs-issued figure is a fixed per-country table, this
 * map ignores the global Metric and stream toggles that drive the other charts.
 * Counts are heavily right-skewed — one country can admit a hundred times more
 * than another — so the value is placed on the ramp with a log transform against
 * the largest count on the map, which keeps the low end legible while the darkest
 * step still marks the single most-admitted nationality. Geometry is the static
 * world-atlas topology, so the projection and per-feature path strings are
 * computed once at module load and only the fills, which depend on data and
 * theme, are recomputed on render. Countries with no CoPR figure read as neutral
 * surface, never as a low ramp step, so that "no data" is never confused with
 * "few admissions".
 */
import { useMemo, useState, useEffect } from 'react';
import { geoNaturalEarth1, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import topo from 'world-atlas/countries-110m.json';
import { useViz } from '../../lib/store';
import type { CoprRow } from '../../lib/viz-types';
import { sequentialColor, type ThemeMode } from '../../lib/palette';
import { fmtInt } from '../../lib/format';
import { flagName, pick } from '@/lib/i18n';
import { CHARTS, chartText } from '@/content/strings';
import { ChartCard } from '../viz/ChartCard';
import { TooltipBox, type TipRow } from '../viz/TooltipBox';
import type { Column } from '../viz/TableView';

// All user-facing copy for this chart lives in `@/content/strings`
// (`CHARTS.choropleth` for static labels, `chartText.choropleth` for
// interpolated prose); this alias keeps the call sites terse.
const T = CHARTS.choropleth;
const TX = chartText.choropleth;

const W = 960;
const H = 500;

// Static geometry: build the FeatureCollection and pre-render each path string
// once, since neither the topology nor the fixed-size projection ever changes.
const topoAny = topo as unknown as {
  objects: { countries: unknown };
};
const geo = feature(
  topoAny as never,
  topoAny.objects.countries as never
) as unknown as {
  features: Array<{ id?: string | number }>;
};
const projection = geoNaturalEarth1().fitSize([W, H], geo as never);
const pathGen = geoPath(projection);
const FEATURE_PATHS: { id: string; d: string }[] = geo.features.map(f => ({
  id: String(f.id ?? ''),
  d: pathGen(f as never) ?? '',
}));

const NO_DATA_FILL = 'var(--surface-3)';
const NO_DATA_STROKE = 'var(--border)';

interface HoverState {
  iso3: string;
  x: number;
  y: number;
}

export function ChoroplethChart() {
  const { data, selection, select, theme, locale } = useViz();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [hover, setHover] = useState<HoverState | null>(null);

  const { ccn3ToIso3, iso3ToName } = data.meta;

  // Map join: keep the CoPR rows that resolved to an ISO3. On the rare collision
  // where two country labels resolve to the same ISO3, keep the larger-count row
  // so the map cell is representative, and note the max count for normalization.
  const { byIso, maxCopr, unmatched } = useMemo(() => {
    const byIso = new Map<string, CoprRow>();
    const unmatched: string[] = [];
    for (const c of data.coprByCountry) {
      if (!c.iso3) {
        if (c.coprIssued > 0) unmatched.push(c.cit);
        continue;
      }
      const prev = byIso.get(c.iso3);
      if (!prev || c.coprIssued > prev.coprIssued) byIso.set(c.iso3, c);
    }
    let maxCopr = 0;
    for (const c of byIso.values())
      if (c.coprIssued > maxCopr) maxCopr = c.coprIssued;
    unmatched.sort();
    return { byIso, maxCopr, unmatched };
  }, [data.coprByCountry]);

  // Place a CoPRs-issued count on the ramp with a log transform against the map's
  // largest count, so the darkest step marks the single most-admitted nationality
  // and the heavily right-skewed low end stays distinguishable rather than
  // collapsing to one shade. A country that admitted nobody reads as the lightest
  // step, still visibly "has data".
  const rampT = (copr: number): number => {
    if (maxCopr <= 0) return 0;
    return Math.log1p(Math.max(0, copr)) / Math.log1p(maxCopr);
  };

  const fillFor = (m: CoprRow, t: ThemeMode): string =>
    sequentialColor(rampT(m.coprIssued), t);

  // ── table equivalent (always available — accessibility) ─────────────────────
  const tableColumns: Column[] = [
    { key: 'cit', label: pick(locale, T.colCountry) },
    { key: 'iso3', label: pick(locale, T.colIso3) },
    { key: 'copr', label: pick(locale, T.colCopr), num: true },
    { key: 'intake', label: pick(locale, T.colIntake), num: true },
  ];
  const tableRows = useMemo(() => {
    const rows = [...byIso.values()];
    // Most-admitted first, so the countries Canada took the most permanent
    // residents from sit at the top.
    rows.sort((a, b) => b.coprIssued - a.coprIssued);
    return rows.map(c => ({
      cit: flagName(locale, c.cit, c.iso3),
      iso3: c.iso3 ?? '—',
      copr: fmtInt(c.coprIssued),
      intake: fmtInt(c.prIntake),
    }));
  }, [byIso, locale]);

  const subtitle = TX.subtitle(locale);

  const footnote =
    unmatched.length > 0
      ? TX.footnoteUnmatched(locale, { names: unmatched })
      : null;

  // The ramp runs light-to-dark as the CoPRs-issued count rises, so the left end
  // marks the fewest admissions and the right end the most. The tick labels report
  // the underlying count at each end.
  const legend = (
    <GradientLegend
      stops={[0, 0.25, 0.5, 0.75, 1].map(t => sequentialColor(t, theme))}
      leftLabel={pick(locale, T.legendLeft)}
      midLabel={pick(locale, T.legendMid)}
      rightLabel={TX.legendMax(locale, { maxCopr })}
      caption={pick(locale, T.legendCaption)}
    />
  );

  const tooltipMetric = hover ? byIso.get(hover.iso3) : undefined;
  const tooltipRows: TipRow[] = [];
  let tooltipTitle = '';
  if (hover) {
    if (tooltipMetric) {
      tooltipTitle = flagName(locale, tooltipMetric.cit, tooltipMetric.iso3);
      tooltipRows.push({
        label: pick(locale, T.tipCopr),
        value: fmtInt(tooltipMetric.coprIssued),
      });
      tooltipRows.push({
        label: pick(locale, T.tipIntake),
        value: fmtInt(tooltipMetric.prIntake),
      });
    } else {
      tooltipTitle = flagName(
        locale,
        iso3ToName[hover.iso3] ?? hover.iso3,
        hover.iso3
      );
      tooltipRows.push({
        label: pick(locale, T.tipCoprData),
        value: pick(locale, T.tipNone),
      });
    }
  }

  const onClickCountry = (iso3: string | undefined) => {
    if (!iso3) return;
    const m = byIso.get(iso3);
    if (!m) return; // only countries with data are selectable
    if (selection?.iso3 === iso3) select(null);
    else select({ cit: m.cit, iso3 });
  };

  const body = !mounted ? (
    <div style={{ height: 500 }} />
  ) : (
    <div style={{ width: '100%', position: 'relative' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
        role='img'
        aria-label={pick(locale, T.svgAria)}
      >
        {FEATURE_PATHS.map((fp, i) => {
          if (!fp.d) return null;
          const iso3 = ccn3ToIso3[fp.id];
          const m = iso3 ? byIso.get(iso3) : undefined;
          const fill = m ? fillFor(m, theme) : NO_DATA_FILL;
          const isSelected = !!selection && !!iso3 && selection.iso3 === iso3;
          const dimmed = !!selection && !isSelected;
          return (
            <path
              key={i}
              d={fp.d}
              fill={fill}
              stroke={
                isSelected
                  ? 'var(--ink)'
                  : m
                    ? 'var(--surface)'
                    : NO_DATA_STROKE
              }
              strokeWidth={isSelected ? 1.6 : 0.5}
              opacity={dimmed ? 0.25 : 1}
              className='viz-pop'
              style={{
                cursor: m ? 'pointer' : 'default',
                animationDelay: `${Math.min(i * 12, 600)}ms`,
              }}
              onMouseMove={e =>
                iso3 && setHover({ iso3, x: e.clientX, y: e.clientY })
              }
              onMouseLeave={() => setHover(null)}
              onClick={() => onClickCountry(iso3)}
            />
          );
        })}
      </svg>
      {hover && tooltipRows.length > 0 && (
        <TooltipBox
          title={tooltipTitle}
          rows={tooltipRows}
          x={hover.x}
          y={hover.y}
        />
      )}
    </div>
  );

  return (
    <ChartCard
      title={pick(locale, T.title)}
      subtitle={subtitle}
      legend={legend}
      footnote={footnote}
      tableColumns={tableColumns}
      tableRows={tableRows}
    >
      {body}
    </ChartCard>
  );
}

/** Horizontal gradient strip with min / mid / max tick labels for a numeric color scale. */
function GradientLegend({
  stops,
  leftLabel,
  midLabel,
  rightLabel,
  caption,
}: {
  stops: string[];
  leftLabel: string;
  midLabel: string;
  rightLabel: string;
  caption: string;
}) {
  return (
    <div
      className='legend'
      style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.25rem' }}
    >
      <span style={{ fontSize: '0.75rem', color: 'var(--ink-2)' }}>
        {caption}
      </span>
      <div
        style={{
          height: 12,
          borderRadius: 4,
          border: '1px solid var(--border)',
          background: `linear-gradient(90deg, ${stops.join(', ')})`,
        }}
        aria-hidden
      />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.72rem',
          color: 'var(--ink-muted)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        <span>{leftLabel}</span>
        <span>{midLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );
}
