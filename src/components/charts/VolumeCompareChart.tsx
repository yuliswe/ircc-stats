'use client';

/**
 * Chart 2 — Applications vs. referrals to comprehensive security screening.
 *
 * For each nationality this shows two absolute counts side by side: the volume of
 * 2025 immigration applications, and the number of those applicants referred to
 * comprehensive security screening. The two quantities differ by up to ~100×
 * within a country (India: 1.38M applications, 4.3k referrals), so plotting both
 * against one shared axis would crush the smaller series onto the origin.
 * Splitting them into two panels, each with its own linear scale, fixes it: the
 * left panel is a bar of applications drawn true to scale, so India reads as
 * roughly 3× China, and the right panel is a bar of referrals on its own scale,
 * so the countries referred out of proportion to their application volume stand
 * out — China is referred far more often than India despite filing a third as
 * many applications. Each country is one row, read straight across: a volume bar
 * on the left and a referral bar on the right, each against its own axis.
 *
 * Hand-rolled SVG (like the enrichment and referral-rate charts): the two panel
 * axes, the paired bars, and the left name gutter place precisely this way, and a
 * fixed `viewBox` keeps the render deterministic with no SSR/hydration hazard.
 */
import { useMemo, useState } from 'react';
import { useViz } from '@/lib/store';
import { CATEGORICAL } from '@/lib/palette';
import { fmtInt, fmtPct, withFlag } from '@/lib/format';
import { ChartCard } from '@/components/viz/ChartCard';
import { Legend } from '@/components/viz/Legend';
import { TooltipBox } from '@/components/viz/TooltipBox';
import type { Column } from '@/components/viz/TableView';
import type { ScreeningAppRow } from '@/lib/viz-types';

const TOP_N = 25;

// Palette slots: applications reads as neutral volume (blue), referrals as the
// escalation series (warm), matching the app's categorical order.
const APPS_SLOT = 0;
const REF_SLOT = 7;

// Logical viewBox coordinates; the svg scales to the card width (width:100%).
const W = 1000;
// Rendered-pixel floor so the 1000-unit viewBox never scales its text below
// readability on a phone; the card scrolls the SVG horizontally instead.
const MIN_SVG_PX = 820;

const NAME_COL = 196; // right-aligned country-name gutter
const PANEL_GAP = 34; // gutter between the applications panel and the referral panel
const RIGHT_PAD = 6;
// Each panel holds a bar track plus a right-aligned numeric value column.
const PANEL_W = (W - NAME_COL - PANEL_GAP - RIGHT_PAD) / 2;
const VAL_W = 62; // numeric label column at each panel's right edge
const BAR_W = PANEL_W - VAL_W; // usable bar length within a panel

const APPS_X0 = NAME_COL; // applications bars grow rightward from here
const APPS_VAL_X = NAME_COL + PANEL_W; // right edge for the applications value label
const REF_X0 = NAME_COL + PANEL_W + PANEL_GAP; // referral bars grow from here
const REF_VAL_X = REF_X0 + PANEL_W; // right edge for the referral value label

const ROW_H = 26;
const BAR_H = 12;
const TOP_PAD = 64; // room for the two-line panel headers + axis tick labels
const BOTTOM_PAD = 14;

const log10 = (x: number) => Math.log(x) / Math.LN10;

/**
 * Evenly spaced "nice" ticks from 0 up to (and including a tick at or past) max,
 * with the step rounded to a 1/2/5 × power-of-ten so labels stay round on a
 * linear axis.
 */
function linearTicks(max: number, target = 8): number[] {
  if (max <= 0) return [0];
  const rawStep = max / target;
  const mag = Math.pow(10, Math.floor(log10(rawStep)));
  const norm = rawStep / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;
  const ticks: number[] = [];
  for (let v = 0; v <= max + step * 1e-6; v += step) ticks.push(v);
  return ticks;
}

function truncate(s: string, max = 28): string {
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

interface HoverState {
  row: ScreeningAppRow;
  x: number;
  y: number;
}

/** Compact absolute-count tick label: 1, 10, 1k, 100k, 1M. */
function tickLabel(v: number): string {
  if (v >= 1_000_000) return `${v / 1_000_000}M`;
  if (v >= 1_000) return `${v / 1_000}k`;
  return String(v);
}

/** Compact per-row count label for the large application counts, e.g. 1.38M, 463k. */
function compactInt(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 10_000) return `${Math.round(v / 1_000)}k`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
  return String(Math.round(v));
}

export function VolumeCompareChart() {
  const { data, theme, selection, select } = useViz();
  const [expanded, setExpanded] = useState(false);
  const [hover, setHover] = useState<HoverState | null>(null);

  const appsColor = CATEGORICAL[theme][APPS_SLOT];
  const refColor = CATEGORICAL[theme][REF_SLOT];

  const sorted = useMemo(
    () =>
      [...data.screeningApplications].sort(
        (a, b) => b.applications - a.applications
      ),
    [data.screeningApplications]
  );

  const total = sorted.length;
  const canCollapse = total > TOP_N;
  const shown = useMemo(
    () => (!canCollapse || expanded ? sorted : sorted.slice(0, TOP_N)),
    [sorted, canCollapse, expanded]
  );

  // Left panel: a linear count of applications from 0 to the largest count
  // (India), drawn true to scale so volume ratios between countries stay honest.
  // Right panel: a linear count of referrals to comprehensive security screening
  // from 0 to the largest referral count. Both maxima are taken over the full
  // sorted set so the scales stay stable across collapse/expand.
  const appsMax = useMemo(
    () => sorted.reduce((m, r) => Math.max(m, r.applications), 10),
    [sorted]
  );
  const refMax = useMemo(
    () => sorted.reduce((m, r) => Math.max(m, r.referred), 10),
    [sorted]
  );

  const appsTicks = useMemo(() => linearTicks(appsMax, 4), [appsMax]);
  const refTicks = useMemo(() => linearTicks(refMax, 4), [refMax]);

  const wAppsBar = (v: number) => (Math.max(0, v) / appsMax) * BAR_W;
  const wRefBar = (v: number) => (Math.max(0, v) / refMax) * BAR_W;

  const tableColumns: Column[] = [
    { key: 'cit', label: 'Country' },
    { key: 'applications', label: 'Applications', num: true },
    { key: 'referred', label: 'Referred', num: true },
    { key: 'pct', label: '% referred', num: true },
    { key: 'prIntake', label: 'PR intake', num: true },
    { key: 'spProcessed', label: 'Study permits', num: true },
    { key: 'trvIntake', label: 'TRV intake', num: true },
  ];
  const tableRows = sorted.map(r => ({
    cit: withFlag(r.cit, r.iso3),
    applications: fmtInt(r.applications),
    referred: fmtInt(r.referred),
    pct: r.applications > 0 ? fmtPct(r.referred / r.applications, 2) : '—',
    prIntake: fmtInt(r.prIntake),
    spProcessed: fmtInt(r.spProcessed),
    trvIntake: fmtInt(r.trvIntake),
  }));

  const subtitle = (
    <>
      Two counts per nationality, side by side and sorted by application volume.
      The left panel is a bar of 2025 immigration <b>applications</b> on a true
      linear scale, so volume ratios stay honest and India reads as roughly 3×
      China. The right panel is a bar of the number of applicants{' '}
      <b>referred to comprehensive security screening</b>, on its own linear
      scale, so a country referred out of proportion to its application volume
      stands out — China is referred far more often than India despite filing a
      third as many applications. Each row is read straight across; the exact
      counts sit at the end of each bar.
    </>
  );

  const footnote =
    'Referrals count all comprehensive security screening activity types (VIT 34/35/37, HIRV, Org ' +
    'Crime, Security); applications count PR intake and TRV intake. Study permits processed are ' +
    'shown for reference only and are not added into the application total, because TRV intake ' +
    'already includes study permit applicants. The two panels use independent linear scales, so a ' +
    'bar length in one panel is not comparable to a bar length in the other.';

  const controls = canCollapse ? (
    <button
      className='card-toggle'
      aria-pressed={expanded}
      onClick={() => setExpanded(v => !v)}
    >
      {expanded ? `Show top ${TOP_N}` : `Show all (${total})`}
    </button>
  ) : undefined;

  const legend = (
    <Legend
      items={[
        { label: 'Applications', color: appsColor },
        { label: 'Referred to security screening', color: refColor },
      ]}
    />
  );

  if (total === 0) {
    return (
      <ChartCard
        title='Applications vs. referrals to security screening'
        subtitle={subtitle}
        tableColumns={tableColumns}
        tableRows={[]}
      >
        <div className='chart-empty'>
          No nationalities with a 2025 application count.
        </div>
      </ChartCard>
    );
  }

  const rowsBottom = TOP_PAD + shown.length * ROW_H;
  const height = rowsBottom + BOTTOM_PAD;
  const tickY = TOP_PAD - 8; // baseline for the axis tick labels
  const gridTop = TOP_PAD - 2;

  const showTip = (row: ScreeningAppRow, clientX: number, clientY: number) =>
    setHover({ row, x: clientX, y: clientY });

  return (
    <ChartCard
      title='Applications vs. referrals to security screening'
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
          aria-label='Grouped bar chart by citizenship: a left panel of applications and a right panel of applicants referred to comprehensive security screening, each an absolute count on its own linear scale'
        >
          {/* Panel headers */}
          <text
            x={APPS_X0}
            y={16}
            textAnchor='start'
            fontSize={12}
            fontWeight={650}
            fill={appsColor}
          >
            Applications
          </text>
          <text
            x={REF_X0}
            y={16}
            textAnchor='start'
            fontSize={12}
            fontWeight={650}
            fill={refColor}
          >
            Referred to comprehensive
          </text>
          <text
            x={REF_X0}
            y={31}
            textAnchor='start'
            fontSize={12}
            fontWeight={650}
            fill={refColor}
          >
            security screening (quantity)
          </text>

          {/* Left panel axis — applications, gridlines + count ticks */}
          {appsTicks.map(t => {
            const x = APPS_X0 + wAppsBar(t);
            return (
              <g key={`apps-${t}`}>
                <line
                  x1={x}
                  x2={x}
                  y1={gridTop}
                  y2={rowsBottom}
                  stroke='var(--grid)'
                  strokeWidth={1}
                  opacity={t === 0 ? 0.9 : 0.4}
                />
                <text
                  x={x}
                  y={tickY}
                  textAnchor='middle'
                  fontSize={11}
                  fill='var(--ink-muted)'
                  className='tnum'
                >
                  {tickLabel(t)}
                </text>
              </g>
            );
          })}

          {/* Right panel axis — referrals, gridlines + count ticks */}
          {refTicks.map(t => {
            const x = REF_X0 + wRefBar(t);
            return (
              <g key={`ref-${t}`}>
                <line
                  x1={x}
                  x2={x}
                  y1={gridTop}
                  y2={rowsBottom}
                  stroke='var(--grid)'
                  strokeWidth={1}
                  opacity={t === 0 ? 0.9 : 0.4}
                />
                <text
                  x={x}
                  y={tickY}
                  textAnchor='middle'
                  fontSize={11}
                  fill='var(--ink-muted)'
                  className='tnum'
                >
                  {tickLabel(t)}
                </text>
              </g>
            );
          })}

          {shown.map((r, i) => {
            const rowTop = TOP_PAD + i * ROW_H;
            const cy = rowTop + ROW_H / 2;
            const barY = cy - BAR_H / 2;

            const isSelected = selection?.cit === r.cit;
            const dimmed = selection != null && !isSelected;

            const onClick = () =>
              select(isSelected ? null : { cit: r.cit, iso3: r.iso3 });

            return (
              <g
                key={r.cit}
                role='button'
                tabIndex={0}
                aria-label={`${withFlag(r.cit, r.iso3)}: ${fmtInt(r.applications)} applications, ${fmtInt(r.referred)} referred to comprehensive security screening`}
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
                {/* full-row transparent hit area keeps the whole row hoverable/clickable */}
                <rect
                  x={NAME_COL}
                  y={rowTop}
                  width={REF_VAL_X - NAME_COL}
                  height={ROW_H}
                  fill='transparent'
                />

                <text
                  x={NAME_COL - 12}
                  y={cy}
                  textAnchor='end'
                  dominantBaseline='central'
                  fontSize={12.5}
                  fontWeight={isSelected ? 650 : 400}
                  fill='var(--ink)'
                >
                  {withFlag(truncate(r.cit), r.iso3)}
                </text>

                {/* left panel: applications bar (true linear scale) + value */}
                <rect
                  x={APPS_X0}
                  y={barY}
                  width={wAppsBar(r.applications)}
                  height={BAR_H}
                  rx={2}
                  fill={appsColor}
                />
                <text
                  x={APPS_VAL_X}
                  y={cy}
                  textAnchor='end'
                  dominantBaseline='central'
                  fontSize={11.5}
                  fill='var(--ink-2)'
                  className='tnum'
                >
                  {compactInt(r.applications)}
                </text>

                {/* right panel: referrals bar (own scale) + value */}
                <rect
                  x={REF_X0}
                  y={barY}
                  width={wRefBar(r.referred)}
                  height={BAR_H}
                  rx={2}
                  fill={refColor}
                />
                <text
                  x={REF_VAL_X}
                  y={cy}
                  textAnchor='end'
                  dominantBaseline='central'
                  fontSize={11.5}
                  fill='var(--ink-2)'
                  className='tnum'
                >
                  {fmtInt(r.referred)}
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
            { label: 'Applications', value: fmtInt(hover.row.applications) },
            {
              label: 'Referred to screening',
              value: fmtInt(hover.row.referred),
            },
            {
              label: '% referred',
              value:
                hover.row.applications > 0
                  ? fmtPct(hover.row.referred / hover.row.applications, 2)
                  : '—',
            },
          ]}
        />
      ) : null}
    </ChartCard>
  );
}
