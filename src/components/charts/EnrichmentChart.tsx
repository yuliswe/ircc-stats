'use client';

/**
 * Chart 1 — Enrichment (disproportionality), the headline chart (docs/ui-spec.md §6).
 *
 * A horizontal diverging bar per citizenship, centred on enrichment = 1. Because
 * the axis is a log scale about 1, each bar's length is driven by `logEnrichment`
 * (log2 of the ratio, 0 = neutral centre), so 2× over- and 2× under-referral are
 * symmetric about the centre line. Bars right of centre (warm) are over-referred
 * to serious screening, bars left (cool) are under-referred.
 *
 * Hand-rolled SVG rather than Recharts: the diverging centre baseline, the direct
 * per-row labels, and the symmetric log ticks are easier to place exactly this way.
 * A `viewBox` (no DOM measurement) keeps the render deterministic, so there is no
 * SSR/hydration hazard and no mounted-flag placeholder is needed (house rule 8).
 */
import { useMemo, useState } from 'react';
import { useViz } from '@/lib/store';
import { applyThreshold, type CountryMetric } from '@/lib/selectors';
import { divergingColor } from '@/lib/palette';
import { fmtInt, fmtPct, fmtRatio, withFlag } from '@/lib/format';
import { ChartCard } from '@/components/viz/ChartCard';
import { Legend } from '@/components/viz/Legend';
import { TooltipBox } from '@/components/viz/TooltipBox';
import type { Column } from '@/components/viz/TableView';

const TOP_N = 20;
const BOTTOM_N = 10;

// Logical viewBox coordinates; the svg scales to the card width (width:100%).
const W = 1000;
const NAME_COL = 214; // right-aligned country-name gutter
const PLOT_X0 = NAME_COL;
const PLOT_X1 = W - 16;
const PLOT_W = PLOT_X1 - PLOT_X0;
const CX = (PLOT_X0 + PLOT_X1) / 2;
const RATIO_PAD = 56; // reserve room at the bar tips for the "3.1×" label
const BAR_HALF = PLOT_W / 2 - RATIO_PAD;
const ROW_H = 26;
const BAR_THICK = 14;
const TOP_PAD = 40;
const BOTTOM_PAD = 16;

const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n));

function truncate(s: string, max = 30): string {
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

interface HoverState {
  row: CountryMetric;
  x: number;
  y: number;
}

export function EnrichmentChart() {
  const {
    metrics,
    stream,
    valueField,
    minScreenings,
    selection,
    select,
    theme,
  } = useViz();
  const [expanded, setExpanded] = useState(false);
  const [hover, setHover] = useState<HoverState | null>(null);

  const gss = metrics.globalSeriousShare;

  // All countries with a defined enrichment, past the min-screenings threshold,
  // sorted by enrichment descending. Threshold hides small-sample countries so a
  // country with a handful of screenings cannot dominate the headline (§3.2).
  const { sorted, hiddenBelowThreshold } = useMemo(() => {
    const eligible = metrics.countries.filter(c => c.enrichment != null);
    const { shown, hiddenCount } = applyThreshold(eligible, minScreenings);
    const s = [...shown].sort(
      (a, b) => (b.enrichment ?? 0) - (a.enrichment ?? 0)
    );
    return { sorted: s, hiddenBelowThreshold: hiddenCount };
  }, [metrics.countries, minScreenings]);

  const total = sorted.length;
  const canCollapse = total > TOP_N + BOTTOM_N;
  const rows = useMemo(() => {
    if (!canCollapse || expanded) return sorted;
    return [...sorted.slice(0, TOP_N), ...sorted.slice(total - BOTTOM_N)];
  }, [sorted, canCollapse, expanded, total]);
  const hiddenMiddle = canCollapse && !expanded ? total - TOP_N - BOTTOM_N : 0;

  const placeholderCount =
    valueField === 'grand'
      ? stream.placeholders.grand
      : stream.placeholders.total2025;

  // Symmetric log-domain half-range, clamped so a zero-serious floor value cannot
  // squash the rest; bars beyond the domain saturate against the plot edge.
  const half = useMemo(() => {
    const maxAbs = rows.reduce(
      (m, r) => Math.max(m, Math.abs(r.logEnrichment ?? 0)),
      0
    );
    return clamp(Math.ceil(maxAbs), 2, 4);
  }, [rows]);

  const xOf = (logEnr: number) =>
    clamp(CX + (logEnr / half) * BAR_HALF, PLOT_X0, PLOT_X1);

  const ticks = useMemo(() => {
    const t: number[] = [];
    for (let i = -half; i <= half; i++) t.push(i);
    return t;
  }, [half]);

  // ── shared table equivalent (accessibility, house rule 1) ────────────────────
  const tableColumns: Column[] = [
    { key: 'cit', label: 'Country' },
    { key: 'serious', label: 'Serious', num: true },
    { key: 'total', label: 'Total', num: true },
    { key: 'share', label: 'Serious share', num: true },
    { key: 'global', label: 'Global share', num: true },
    { key: 'enrichment', label: 'Enrichment', num: true },
  ];
  const tableRows = sorted.map(c => ({
    cit: withFlag(c.cit, c.iso3),
    serious: fmtInt(c.serious),
    total: fmtInt(c.total),
    share: c.seriousShare != null ? fmtPct(c.seriousShare) : '—',
    global: gss != null ? fmtPct(gss) : '—',
    enrichment: c.enrichment != null ? fmtRatio(c.enrichment) : '—',
  }));

  const subtitle = (
    <>
      Ratio of a country&rsquo;s serious-screening share to the global serious
      share, relative to <b>screenings</b> (not applications). Above 1× is
      over-referred, below 1× under-referred.{' '}
      {hiddenBelowThreshold > 0
        ? `${hiddenBelowThreshold} countr${hiddenBelowThreshold === 1 ? 'y' : 'ies'} below the ${minScreenings}-screening minimum are excluded.`
        : `No countries fall below the ${minScreenings}-screening minimum.`}
      {hiddenMiddle > 0
        ? ` Showing the top ${TOP_N} and bottom ${BOTTOM_N}; ${hiddenMiddle} in the middle are hidden.`
        : ''}
    </>
  );

  const footnote = `${fmtInt(placeholderCount)} reconciliation-placeholder row${placeholderCount === 1 ? '' : 's'} for ATIP-withheld or non-footing cells ${placeholderCount === 1 ? 'is' : 'are'} included (${valueField === 'grand' ? 'all years' : '2025'} basis).`;

  const controls = canCollapse ? (
    <button
      className='card-toggle'
      aria-pressed={expanded}
      onClick={() => setExpanded(v => !v)}
    >
      {expanded
        ? `Show top ${TOP_N} + bottom ${BOTTOM_N}`
        : `Show all (${total})`}
    </button>
  ) : undefined;

  const legend = (
    <Legend
      items={[
        { label: 'Under-referred (< 1×)', color: divergingColor(-1, theme) },
        { label: 'Neutral (1×)', color: 'var(--grid)' },
        { label: 'Over-referred (> 1×)', color: divergingColor(1, theme) },
      ]}
    />
  );

  // ── empty / disabled states (house rule 6) ────────────────────────────────────
  if (!metrics.seriousMappingKnown) {
    return (
      <ChartCard
        title='Enrichment — disproportionality'
        subtitle={subtitle}
        tableColumns={tableColumns}
        tableRows={[]}
      >
        <div className='chart-empty'>
          Requires the VIT severity mapping (not yet supplied for temporary
          residence).
        </div>
      </ChartCard>
    );
  }
  if (total === 0) {
    return (
      <ChartCard
        title='Enrichment — disproportionality'
        subtitle={subtitle}
        tableColumns={tableColumns}
        tableRows={[]}
      >
        <div className='chart-empty'>
          No countries meet the {minScreenings}-screening minimum for the
          current filters.
        </div>
      </ChartCard>
    );
  }

  const height = TOP_PAD + rows.length * ROW_H + BOTTOM_PAD;

  const showTip = (row: CountryMetric, clientX: number, clientY: number) =>
    setHover({ row, x: clientX, y: clientY });

  return (
    <ChartCard
      title='Enrichment — disproportionality'
      subtitle={subtitle}
      controls={controls}
      legend={legend}
      footnote={footnote}
      tableColumns={tableColumns}
      tableRows={tableRows}
    >
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg
          viewBox={`0 0 ${W} ${height}`}
          width='100%'
          height='auto'
          style={{ display: 'block', maxWidth: '100%' }}
          role='img'
          aria-label='Diverging bar chart of serious-screening enrichment by citizenship'
        >
          {/* axis ticks + gridlines */}
          {ticks.map(t => {
            const x = xOf(t);
            const isCenter = t === 0;
            return (
              <g key={t}>
                <line
                  x1={x}
                  x2={x}
                  y1={TOP_PAD - 8}
                  y2={height - BOTTOM_PAD}
                  stroke='var(--grid)'
                  strokeWidth={isCenter ? 1.6 : 1}
                  opacity={isCenter ? 1 : 0.55}
                />
                <text
                  x={x}
                  y={TOP_PAD - 14}
                  textAnchor='middle'
                  fontSize={11}
                  fill='var(--ink-muted)'
                  className='tnum'
                >
                  {fmtRatio(Math.pow(2, t))}
                </text>
              </g>
            );
          })}

          {rows.map((c, i) => {
            const logEnr = c.logEnrichment ?? 0;
            const enr = c.enrichment ?? 1;
            const rowTop = TOP_PAD + i * ROW_H;
            const barY = rowTop + (ROW_H - BAR_THICK) / 2;
            const tip = xOf(logEnr);
            const barX = Math.min(CX, tip);
            const barW = Math.max(1.5, Math.abs(tip - CX));
            const positive = logEnr >= 0;

            const isSelected = selection?.cit === c.cit;
            const dimmed = selection != null && !isSelected;
            const fill = divergingColor(logEnr, theme);

            const onClick = () =>
              select(isSelected ? null : { cit: c.cit, iso3: c.iso3 });

            return (
              <g
                key={c.cit}
                role='button'
                tabIndex={0}
                aria-label={`${withFlag(c.cit, c.iso3)}: enrichment ${fmtRatio(enr)}, ${fmtInt(c.serious)} serious of ${fmtInt(c.total)} screenings`}
                style={{
                  cursor: 'pointer',
                  opacity: dimmed ? 0.25 : 1,
                  transition: 'opacity 120ms',
                }}
                onClick={onClick}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick();
                  }
                }}
                onMouseEnter={e => showTip(c, e.clientX, e.clientY)}
                onMouseMove={e => showTip(c, e.clientX, e.clientY)}
                onMouseLeave={() => setHover(null)}
                onFocus={e => {
                  const r = (
                    e.currentTarget as SVGGElement
                  ).getBoundingClientRect();
                  showTip(c, r.left + r.width / 2, r.top);
                }}
                onBlur={() => setHover(null)}
              >
                {/* full-row transparent hit area so tiny bars stay hoverable/clickable */}
                <rect
                  x={PLOT_X0}
                  y={rowTop}
                  width={PLOT_W}
                  height={ROW_H}
                  fill='transparent'
                />

                {/* country name in the left gutter */}
                <text
                  x={NAME_COL - 12}
                  y={rowTop + ROW_H / 2}
                  textAnchor='end'
                  dominantBaseline='central'
                  fontSize={12.5}
                  fontWeight={isSelected ? 650 : 400}
                  fill='var(--ink)'
                >
                  {withFlag(truncate(c.cit), c.iso3)}
                </text>

                <rect
                  x={barX}
                  y={barY}
                  width={barW}
                  height={BAR_THICK}
                  rx={2}
                  fill={fill}
                />

                {/* ratio label at the bar tip, reading outward */}
                <text
                  x={positive ? tip + 6 : tip - 6}
                  y={rowTop + ROW_H / 2}
                  textAnchor={positive ? 'start' : 'end'}
                  dominantBaseline='central'
                  fontSize={12}
                  fill='var(--ink-2)'
                  className='tnum'
                >
                  {fmtRatio(enr)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {hover ? (
        <TooltipBox
          title={withFlag(hover.row.cit, hover.row.iso3)}
          x={hover.x}
          y={hover.y}
          rows={[
            { label: 'Serious screenings', value: fmtInt(hover.row.serious) },
            { label: 'Total screenings', value: fmtInt(hover.row.total) },
            {
              label: 'Serious share',
              value:
                hover.row.seriousShare != null
                  ? fmtPct(hover.row.seriousShare)
                  : '—',
            },
            { label: 'Global share', value: gss != null ? fmtPct(gss) : '—' },
            { label: 'Enrichment', value: fmtRatio(hover.row.enrichment ?? 1) },
          ]}
        />
      ) : null}
    </ChartCard>
  );
}
