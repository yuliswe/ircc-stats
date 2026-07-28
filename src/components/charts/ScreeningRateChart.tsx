'use client';

/**
 * Chart 1 — Screening referral rate over applications (the headline).
 *
 * This is the one bias metric the rest of the app cannot compute: the share of a
 * nationality's 2025 immigration applications that were referred to *any* security
 * screening. Every other chart normalizes over screenings (a rate among the
 * already-screened); here the denominator is the application volume itself, so the
 * bar length is the raw chance that an applicant of a given citizenship is referred.
 *
 * Horizontal bars, sorted by rate, colored diverging about the national average
 * (warm = referred more often than the average applicant, cool = less). A dashed
 * vertical line marks that national average. Tiny-denominator nationalities are
 * hidden behind a minimum-applications control because a country with a dozen
 * applications can post a 60% rate on noise alone.
 *
 * Hand-rolled SVG (like the enrichment chart): the reference line, the per-row rate
 * labels, and the left name gutter place more precisely this way, and a fixed
 * `viewBox` keeps the render deterministic with no SSR/hydration hazard.
 */
import { useId, useMemo, useState } from 'react';
import { useViz } from '@/lib/store';
import { divergingColor } from '@/lib/palette';
import { fmtInt, fmtPct, log2, withFlag } from '@/lib/format';
import { ChartCard } from '@/components/viz/ChartCard';
import { Legend } from '@/components/viz/Legend';
import { TooltipBox } from '@/components/viz/TooltipBox';
import type { Column } from '@/components/viz/TableView';
import type { ScreeningAppRow } from '@/lib/viz-types';

const TOP_N = 25;

// Minimum-applications presets; the default hides the small-denominator noise
// (a handful of applications posting an extreme rate) without cutting real cases.
const MIN_APPS = [250, 1000, 5000] as const;
const DEFAULT_MIN = 1000;

// Logical viewBox coordinates; the svg scales to the card width (width:100%).
const W = 1000;
// Rendered-pixel floor so the 1000-unit viewBox never scales its text below
// readability on a phone; the card scrolls the SVG horizontally instead.
const MIN_SVG_PX = 760;
const NAME_COL = 222; // right-aligned country-name gutter
const PLOT_X0 = NAME_COL;
const PLOT_X1 = W - 130; // reserve room at the bar tip for the "4.5% (3.2×)" label
const PLOT_W = PLOT_X1 - PLOT_X0;
const ROW_H = 26;
const BAR_THICK = 14;
const TOP_PAD = 42;
const BOTTOM_PAD = 18;

const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n));

function truncate(s: string, max = 30): string {
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

interface RateRow extends ScreeningAppRow {
  rate: number;
  logVsAvg: number | null;
}

interface HoverState {
  row: RateRow;
  x: number;
  y: number;
}

/** Round up to a "nice" axis maximum (0.05, 0.10, …) above the largest rate. */
function niceCeil(x: number): number {
  if (x <= 0) return 0.01;
  const step = 0.05;
  return Math.ceil(x / step) * step;
}

export function ScreeningRateChart() {
  const { data, theme, selection, select } = useViz();
  const [minApps, setMinApps] = useState<number>(DEFAULT_MIN);
  const minAppsLabelId = useId();
  const [expanded, setExpanded] = useState(false);
  const [hover, setHover] = useState<HoverState | null>(null);

  const rows = data.screeningApplications;

  // National average = total referred ÷ total applications across every
  // nationality (not the threshold-filtered subset), so the baseline is stable
  // as the minimum-applications control moves.
  const globalRate = useMemo(() => {
    let ref = 0;
    let apps = 0;
    for (const r of rows) {
      ref += r.referred;
      apps += r.applications;
    }
    return apps > 0 ? ref / apps : 0;
  }, [rows]);

  const { sorted, hiddenBelowThreshold } = useMemo(() => {
    const eligible: RateRow[] = rows
      .filter(r => r.applications >= minApps)
      .map(r => {
        const rate = r.referred / r.applications;
        return {
          ...r,
          rate,
          logVsAvg: globalRate > 0 && rate > 0 ? log2(rate / globalRate) : null,
        };
      })
      .sort((a, b) => b.rate - a.rate);
    return {
      sorted: eligible,
      hiddenBelowThreshold: rows.length - eligible.length,
    };
  }, [rows, minApps, globalRate]);

  const total = sorted.length;
  const canCollapse = total > TOP_N;
  const shown = useMemo(
    () => (!canCollapse || expanded ? sorted : sorted.slice(0, TOP_N)),
    [sorted, canCollapse, expanded]
  );

  const axisMax = useMemo(() => {
    const maxRate = shown.reduce((m, r) => Math.max(m, r.rate), globalRate);
    return niceCeil(maxRate);
  }, [shown, globalRate]);

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
    { key: 'referred', label: 'Referred', num: true },
    { key: 'applications', label: 'Applications', num: true },
    { key: 'rate', label: 'Referral rate', num: true },
    { key: 'vsAvg', label: 'vs. average', num: true },
  ];
  const tableRows = sorted.map(r => ({
    cit: withFlag(r.cit, r.iso3),
    referred: fmtInt(r.referred),
    applications: fmtInt(r.applications),
    rate: fmtPct(r.rate, 2),
    vsAvg: globalRate > 0 ? `${(r.rate / globalRate).toFixed(1)}×` : '—',
  }));

  const subtitle = (
    <>
      Share of a nationality&rsquo;s 2025 immigration applications that were
      referred to <b>any</b> security screening, relative to <b>applications</b>{' '}
      (not screenings). The dashed line is the national average of{' '}
      <b>{fmtPct(globalRate, 2)}</b>; warm bars are referred more often than the
      average applicant, cool bars less. Nationalities with fewer than{' '}
      {fmtInt(minApps)} applications are hidden{' '}
      {hiddenBelowThreshold > 0
        ? `(${fmtInt(hiddenBelowThreshold)} excluded)`
        : ''}{' '}
      because a tiny denominator makes the rate unstable.
    </>
  );

  const footnote =
    'Referrals count applicants sent to any screening type (VIT 34/35/37, HIRV, Org Crime, or ' +
    'Security); applications count PR intake, study permits processed, and TRV intake for 2025.';

  const controls = (
    <>
      <div className='seg-field'>
        <span className='seg-label' id={minAppsLabelId}>
          Min. applications
        </span>
        <div
          className='segmented'
          role='group'
          aria-labelledby={minAppsLabelId}
        >
          {MIN_APPS.map(m => (
            <button
              key={m}
              aria-pressed={minApps === m}
              onClick={() => setMinApps(m)}
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
        { label: 'Below average', color: divergingColor(-2, theme) },
        { label: 'National average', color: 'var(--grid)' },
        { label: 'Above average', color: divergingColor(2, theme) },
      ]}
    />
  );

  if (total === 0) {
    return (
      <ChartCard
        title='Screening referral rate — share of applications referred'
        subtitle={subtitle}
        controls={controls}
        tableColumns={tableColumns}
        tableRows={[]}
      >
        <div className='chart-empty'>
          No nationalities meet the {fmtInt(minApps)}-application minimum.
        </div>
      </ChartCard>
    );
  }

  const height = TOP_PAD + shown.length * ROW_H + BOTTOM_PAD;
  const refX = xOf(globalRate);

  const showTip = (row: RateRow, clientX: number, clientY: number) =>
    setHover({ row, x: clientX, y: clientY });

  return (
    <ChartCard
      title='Screening referral rate — share of applications referred'
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
          aria-label='Bar chart of security-screening referral rate over applications by citizenship'
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
                  {fmtPct(t, t < 0.1 ? 1 : 0)}
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
            avg {fmtPct(globalRate, 1)}
          </text>

          {shown.map((r, i) => {
            const rowTop = TOP_PAD + i * ROW_H;
            const barY = rowTop + (ROW_H - BAR_THICK) / 2;
            const tip = xOf(r.rate);
            const barW = Math.max(1.5, tip - PLOT_X0);

            const isSelected = selection?.cit === r.cit;
            const dimmed = selection != null && !isSelected;
            const fill = divergingColor(r.logVsAvg ?? 0, theme);

            const onClick = () =>
              select(isSelected ? null : { cit: r.cit, iso3: r.iso3 });

            return (
              <g
                key={r.cit}
                role='button'
                tabIndex={0}
                aria-label={`${withFlag(r.cit, r.iso3)}: ${fmtPct(r.rate, 2)} referral rate, ${fmtInt(r.referred)} of ${fmtInt(r.applications)} applications`}
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
                  {fmtPct(r.rate, r.rate < 0.1 ? 1 : 0)}
                  {globalRate > 0 ? (
                    <tspan fill='var(--ink-muted)'>
                      {' '}
                      ({(r.rate / globalRate).toFixed(1)}×)
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
            {
              label: 'Referred to screening',
              value: fmtInt(hover.row.referred),
            },
            {
              label: 'Total applications',
              value: fmtInt(hover.row.applications),
            },
            { label: 'Referral rate', value: fmtPct(hover.row.rate, 2) },
            {
              label: 'vs. national average',
              value:
                globalRate > 0
                  ? `${(hover.row.rate / globalRate).toFixed(1)}×`
                  : '—',
            },
          ]}
        />
      ) : null}
    </ChartCard>
  );
}
