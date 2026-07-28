'use client';

/**
 * Chart 6 — Temporary-residence approval rate by nationality.
 *
 * Where Chart 1 asks how often an applicant is referred to screening, this chart
 * asks the plainer question underneath it: how often does a temporary-residence
 * application actually get approved? The bar length is IRCC's own 2025
 * approved-over-processed share for a nationality, so it reads as the raw chance
 * that an applicant of a given citizenship is approved rather than refused.
 *
 * Horizontal bars, sorted by rate, colored diverging about the national average
 * (warm = approved more often than the average applicant, cool = less), with a
 * dashed vertical line at that average. Nationalities with few processed
 * applications are hidden behind a minimum-processed control because a country
 * with a dozen finalized applications can post a 100% rate on noise alone.
 *
 * Hand-rolled SVG mirroring Chart 1: the reference line, per-row rate labels, and
 * the left name gutter place more precisely this way, and a fixed `viewBox` keeps
 * the render deterministic with no SSR/hydration hazard.
 */
import { useId, useMemo, useState } from 'react';
import { useViz } from '@/lib/store';
import { divergingColor } from '@/lib/palette';
import { fmtInt, fmtPct, log2, withFlag } from '@/lib/format';
import { ChartCard } from '@/components/viz/ChartCard';
import { Legend } from '@/components/viz/Legend';
import { TooltipBox } from '@/components/viz/TooltipBox';
import type { Column } from '@/components/viz/TableView';
import type { TrApprovalRow } from '@/lib/viz-types';

const TOP_N = 25;

// Minimum-processed presets; the default hides the small-denominator noise (a
// handful of finalized applications posting an extreme rate) without cutting real
// source countries.
const MIN_PROCESSED = [1000, 5000, 25000] as const;
const DEFAULT_MIN = 25000;

// Logical viewBox coordinates; the svg scales to the card width (width:100%).
const W = 1000;
// Rendered-pixel floor so the 1000-unit viewBox never scales its text below
// readability on a phone; the card scrolls the SVG horizontally instead.
const MIN_SVG_PX = 760;
const NAME_COL = 222; // right-aligned country-name gutter
const PLOT_X0 = NAME_COL;
const PLOT_X1 = W - 130; // reserve room at the bar tip for the "82% (1.4×)" label
const PLOT_W = PLOT_X1 - PLOT_X0;
const ROW_H = 26;
const BAR_THICK = 14;
const TOP_PAD = 42;
const BOTTOM_PAD = 18;

// Diverging-ramp half-range, in log2 steps. Unlike the screening rate in Chart 1
// (whose log2(rate/avg) spreads across roughly ±5), approval rates are bounded
// and bunch tightly around the high national average, so the observed spread of
// log2(rate/avg) runs only about -1.5 to +0.6. The palette's default span of 2
// therefore leaves every bar hugging the pale midpoint; a span of 0.7 lets the
// ramp reach saturation across the spread that actually occurs.
const COLOR_SPAN = 0.7;

const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n));

function truncate(s: string, max = 30): string {
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

interface RateRow extends TrApprovalRow {
  logVsAvg: number | null;
}

interface HoverState {
  row: RateRow;
  x: number;
  y: number;
}

/** Round up to a "nice" axis maximum (0.05, 0.10, …) above the largest rate. */
function niceCeil(x: number): number {
  if (x <= 0) return 0.05;
  const step = 0.05;
  return Math.ceil(x / step) * step;
}

export function TrApprovalChart() {
  const { data, theme, selection, select } = useViz();
  const [minProcessed, setMinProcessed] = useState<number>(DEFAULT_MIN);
  const minProcessedLabelId = useId();
  const [expanded, setExpanded] = useState(false);
  const [hover, setHover] = useState<HoverState | null>(null);

  const rows = data.trApprovals;
  // National average is IRCC's own all-countries approved-over-processed share,
  // so the baseline is fixed and does not move as the minimum-processed control
  // trims the visible set.
  const avgRate = data.trApprovalTotal.rate;

  const { sorted, hiddenBelowThreshold } = useMemo(() => {
    const eligible: RateRow[] = rows
      .filter(r => r.processed >= minProcessed)
      .map(r => ({
        ...r,
        logVsAvg: avgRate > 0 && r.rate > 0 ? log2(r.rate / avgRate) : null,
      }))
      .sort((a, b) => b.rate - a.rate);
    return {
      sorted: eligible,
      hiddenBelowThreshold: rows.length - eligible.length,
    };
  }, [rows, minProcessed, avgRate]);

  const total = sorted.length;
  const canCollapse = total > TOP_N;
  const shown = useMemo(
    () => (!canCollapse || expanded ? sorted : sorted.slice(0, TOP_N)),
    [sorted, canCollapse, expanded]
  );

  const axisMax = useMemo(() => {
    const maxRate = shown.reduce((m, r) => Math.max(m, r.rate), avgRate);
    return niceCeil(maxRate);
  }, [shown, avgRate]);

  const xOf = (rate: number) => PLOT_X0 + clamp(rate / axisMax, 0, 1) * PLOT_W;

  const ticks = useMemo(() => {
    const t: number[] = [];
    const step = axisMax / 4;
    for (let i = 0; i <= 4; i++) t.push(i * step);
    return t;
  }, [axisMax]);

  // ── shared table equivalent (accessibility, house rule 1) ────────────────────
  const tableColumns: Column[] = [
    { key: 'cit', label: 'Country' },
    { key: 'approved', label: 'Approved', num: true },
    { key: 'processed', label: 'Processed', num: true },
    { key: 'rate', label: 'Approval rate', num: true },
    { key: 'vsAvg', label: 'vs. average', num: true },
  ];
  const tableRows = sorted.map(r => ({
    cit: withFlag(r.cit, r.iso3),
    approved: fmtInt(r.approved),
    processed: fmtInt(r.processed),
    rate: fmtPct(r.rate, 1),
    vsAvg: avgRate > 0 ? `${(r.rate / avgRate).toFixed(1)}×` : '—',
  }));

  const subtitle = (
    <>
      Share of a nationality&rsquo;s 2025 <b>processed</b> temporary-residence
      applications that were <b>approved</b>, using IRCC&rsquo;s published
      annual totals. The dashed line is the national average of{' '}
      <b>{fmtPct(avgRate, 1)}</b>; blue bars are approved more often than the
      average applicant, red bars less. Nationalities with fewer than{' '}
      {fmtInt(minProcessed)} processed applications are hidden{' '}
      {hiddenBelowThreshold > 0
        ? `(${fmtInt(hiddenBelowThreshold)} excluded)`
        : ''}{' '}
      because a tiny denominator makes the rate unstable.
    </>
  );

  const footnote =
    'Approved and processed are IRCC’s own published 2025 annual totals (each rounded to the ' +
    'nearest 5); the rate is approved ÷ processed. Rows whose approved or processed count IRCC ' +
    'suppressed to protect privacy carry no rate and are omitted, as are the "Other*" residual ' +
    'bucket and any nationality with no ISO match (Solomon Islands, Stateless).';

  const controls = (
    <>
      <div className='seg-field'>
        <span className='seg-label' id={minProcessedLabelId}>
          Min. processed applications
        </span>
        <div
          className='segmented'
          role='group'
          aria-labelledby={minProcessedLabelId}
        >
          {MIN_PROCESSED.map(m => (
            <button
              key={m}
              aria-pressed={minProcessed === m}
              onClick={() => setMinProcessed(m)}
            >
              ≥ {fmtInt(m)}
            </button>
          ))}
        </div>
      </div>
      {canCollapse ? (
        <button
          className='card-toggle'
          aria-pressed={expanded}
          onClick={() => setExpanded(v => !v)}
        >
          {expanded ? `Show top ${TOP_N}` : `Show all (${total})`}
        </button>
      ) : null}
    </>
  );

  const legend = (
    <Legend
      items={[
        {
          label: 'Below average',
          color: divergingColor(COLOR_SPAN, theme, COLOR_SPAN),
        },
        { label: 'National average', color: 'var(--grid)' },
        {
          label: 'Above average',
          color: divergingColor(-COLOR_SPAN, theme, COLOR_SPAN),
        },
      ]}
    />
  );

  if (total === 0) {
    return (
      <ChartCard
        title='Temporary-residence approval rate by nationality'
        subtitle={subtitle}
        controls={controls}
        tableColumns={tableColumns}
        tableRows={[]}
      >
        <div className='chart-empty'>
          No nationalities meet the {fmtInt(minProcessed)}-processed minimum.
        </div>
      </ChartCard>
    );
  }

  const height = TOP_PAD + shown.length * ROW_H + BOTTOM_PAD;
  const refX = xOf(avgRate);

  const showTip = (row: RateRow, clientX: number, clientY: number) =>
    setHover({ row, x: clientX, y: clientY });

  return (
    <ChartCard
      title='Temporary-residence approval rate by nationality'
      subtitle={subtitle}
      controls={controls}
      legend={legend}
      footnote={footnote}
      tableColumns={tableColumns}
      tableRows={tableRows}
    >
      <div
        style={{
          width: '100%',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <svg
          viewBox={`0 0 ${W} ${height}`}
          width='100%'
          height='auto'
          // Keep a legible floor width on phones: below this the wrapper scrolls
          // horizontally rather than shrinking the SVG text into illegibility.
          style={{ display: 'block', width: '100%', minWidth: MIN_SVG_PX }}
          role='img'
          aria-label='Bar chart of temporary-residence approval rate by citizenship'
        >
          {/* axis ticks + gridlines */}
          {ticks.map(t => {
            const x = xOf(t);
            return (
              <g key={t}>
                <line
                  x1={x}
                  x2={x}
                  y1={TOP_PAD - 8}
                  y2={height - BOTTOM_PAD}
                  stroke='var(--grid)'
                  strokeWidth={1}
                  opacity={0.55}
                />
                <text
                  x={x}
                  y={TOP_PAD - 14}
                  textAnchor='middle'
                  fontSize={11}
                  fill='var(--ink-muted)'
                  className='tnum'
                >
                  {fmtPct(t, 0)}
                </text>
              </g>
            );
          })}

          {/* national-average reference line */}
          <line
            x1={refX}
            x2={refX}
            y1={TOP_PAD - 8}
            y2={height - BOTTOM_PAD}
            stroke='var(--ink-2)'
            strokeWidth={1.4}
            strokeDasharray='5 4'
          />
          <text
            x={refX}
            y={height - BOTTOM_PAD + 13}
            textAnchor='middle'
            fontSize={10.5}
            fill='var(--ink-2)'
            className='tnum'
          >
            avg {fmtPct(avgRate, 1)}
          </text>

          {shown.map((r, i) => {
            const rowTop = TOP_PAD + i * ROW_H;
            const barY = rowTop + (ROW_H - BAR_THICK) / 2;
            const tip = xOf(r.rate);
            const barW = Math.max(1.5, tip - PLOT_X0);

            const isSelected = selection?.cit === r.cit;
            const dimmed = selection != null && !isSelected;
            // Higher approval reads cool (blue), lower reads warm (red), so the
            // log-ratio is negated before it drives the diverging ramp (whose
            // positive end is warm).
            const fill = divergingColor(-(r.logVsAvg ?? 0), theme, COLOR_SPAN);

            const onClick = () =>
              select(isSelected ? null : { cit: r.cit, iso3: r.iso3 });

            return (
              <g
                key={r.cit}
                role='button'
                tabIndex={0}
                aria-label={`${withFlag(r.cit, r.iso3)}: ${fmtPct(r.rate, 1)} approval rate, ${fmtInt(r.approved)} of ${fmtInt(r.processed)} processed`}
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
                onMouseEnter={e => showTip(r, e.clientX, e.clientY)}
                onMouseMove={e => showTip(r, e.clientX, e.clientY)}
                onMouseLeave={() => setHover(null)}
                onFocus={e => {
                  const box = (
                    e.currentTarget as SVGGElement
                  ).getBoundingClientRect();
                  showTip(r, box.left + box.width / 2, box.top);
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

                <text
                  x={NAME_COL - 12}
                  y={rowTop + ROW_H / 2}
                  textAnchor='end'
                  dominantBaseline='central'
                  fontSize={12.5}
                  fontWeight={isSelected ? 650 : 400}
                  fill='var(--ink)'
                >
                  {withFlag(truncate(r.cit), r.iso3)}
                </text>

                <rect
                  x={PLOT_X0}
                  y={barY}
                  width={barW}
                  height={BAR_THICK}
                  rx={2}
                  fill={fill}
                />

                <text
                  x={tip + 6}
                  y={rowTop + ROW_H / 2}
                  textAnchor='start'
                  dominantBaseline='central'
                  fontSize={12}
                  fill='var(--ink-2)'
                  className='tnum'
                >
                  {fmtPct(r.rate, 0)}
                  {avgRate > 0 ? (
                    <tspan fill='var(--ink-muted)'>
                      {' '}
                      ({(r.rate / avgRate).toFixed(1)}×)
                    </tspan>
                  ) : null}
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
            { label: 'Approved', value: fmtInt(hover.row.approved) },
            { label: 'Processed', value: fmtInt(hover.row.processed) },
            { label: 'Not approved', value: fmtInt(hover.row.nonApproval) },
            { label: 'Approval rate', value: fmtPct(hover.row.rate, 1) },
            {
              label: 'vs. national average',
              value:
                avgRate > 0 ? `${(hover.row.rate / avgRate).toFixed(1)}×` : '—',
            },
          ]}
        />
      ) : null}
    </ChartCard>
  );
}
