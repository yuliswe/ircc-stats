'use client';

/**
 * Chart 7 — Approval rate vs. security-screening rate, scatter.
 *
 * This chart puts the two per-nationality rates from charts 1 and 6 on the same
 * plane so the relationship between them reads directly. Each country is one dot
 * at x = its 2025 security-screening rate (referrals over applications) and
 * y = its 2025 temporary-residence approval rate (approved over processed). The
 * screening rate spans three orders of magnitude and is heavily bunched at the
 * low end, so x is drawn on a log axis while the approval rate, which is a plain
 * share between zero and one, stays linear.
 *
 * The dot area scales linearly with the country's total applications, so the
 * largest source countries read as much bigger marks. The dot color encodes the
 * ratio y/x, that is approval rate divided by screening rate, diverging about the
 * national ratio: a country approved far more often than it is screened reads
 * cool (blue) and one screened nearly as often as it is approved reads warm
 * (red). Because the same two rates already appear in charts 1 and 6, this view
 * is where a reader can see whether being screened more often coincides with
 * being approved less often.
 *
 * Recharts (like the applications-vs-screenings scatter) so the axes, gridlines,
 * size channel (ZAxis), and hover cursor come for free; the render is gated on
 * `mounted` to avoid an SSR/hydration mismatch from ResponsiveContainer measuring
 * width.
 */
import { useId, useMemo, useState, useEffect, type ReactNode } from 'react';
import { useRevealed } from '@/lib/reveal';
import {
  CartesianGrid,
  Cell,
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
import { fmtInt, fmtPct, fmtRatio, log2, withFlag } from '@/lib/format';
import { ChartCard } from '@/components/viz/ChartCard';
import { Legend } from '@/components/viz/Legend';
import type { Column } from '@/components/viz/TableView';

// Minimum-applications presets; a country with only a few applications posts an
// unstable screening rate, so the default trims that small-denominator noise
// without cutting real source countries.
const MIN_APPLICATIONS = [1000, 5000, 25000] as const;
const DEFAULT_MIN = 5000;

// The diverging color saturates once a country's y/x is this many log2 steps
// away from the national ratio. The bulk of the countries sit within about ±3.5
// of the national ratio (with a handful of extremes beyond), so a span of 4 left
// the middle marks hugging the pale midpoint; 2.5 pushes those middle marks to a
// readable saturation while only clipping the genuine outliers to flat endpoints.
const COLOR_SPAN = 2.5;

const log10 = (x: number) => Math.log(x) / Math.LN10;
const floorPow = (v: number) => Math.pow(10, Math.floor(log10(v)));
const ceilPow = (v: number) => Math.pow(10, Math.ceil(log10(v)));

/** Compact percent tick that keeps enough digits for the sub-1% screening rates. */
function pctTick(v: number): string {
  if (v >= 0.1) return `${Math.round(v * 100)}%`;
  if (v >= 0.01) return `${+(v * 100).toFixed(0)}%`;
  if (v >= 0.001) return `${+(v * 100).toFixed(1)}%`;
  return `${+(v * 100).toFixed(2)}%`;
}

interface Point {
  cit: string;
  iso3: string | null;
  x: number; // security-screening rate (referred ÷ applications)
  y: number; // TR approval rate (approved ÷ processed)
  z: number; // size channel: total applications (linear)
  applications: number;
  referred: number;
  approved: number;
  processed: number;
  ratio: number; // y ÷ x
}

export function ApprovalVsScreeningScatter() {
  const { data, theme, selection, select } = useViz();
  const [minApplications, setMinApplications] = useState<number>(DEFAULT_MIN);
  const minApplicationsLabelId = useId();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  // Points animate in only once the card scrolls into view; the key remounts the
  // series when that flips so Recharts replays its enter animation on reveal.
  const revealed = useRevealed();

  const ink = INK[theme];

  // National ratio is the pooled approval rate over the pooled screening rate,
  // the fixed baseline the color diverges about. The pooled screening rate is
  // aggregate referrals over aggregate applications across every nationality (the
  // same pooled rate charts 1 and 3 use), and the pooled approval rate is IRCC's
  // own all-countries approved-over-processed total.
  const nationalRatio = useMemo(() => {
    let apps = 0;
    let scr = 0;
    for (const r of data.screeningApplications) {
      if (r.applications <= 0) continue;
      apps += r.applications;
      scr += r.referred;
    }
    const nationalScreeningRate = apps > 0 ? scr / apps : 0;
    const nationalApprovalRate = data.trApprovalTotal.rate;
    return nationalScreeningRate > 0
      ? nationalApprovalRate / nationalScreeningRate
      : 0;
  }, [data.screeningApplications, data.trApprovalTotal.rate]);

  // Join the screening table to the approval table on ISO3 (falling back to the
  // printed citizenship when a row has no ISO match), keeping only countries that
  // carry both a positive screening rate and an approval rate. A zero-referral
  // country has an undefined ratio and cannot sit on a log axis, so it is dropped.
  const allPoints = useMemo<Point[]>(() => {
    const keyOf = (iso3: string | null, cit: string) => iso3 ?? `name:${cit}`;
    const screenByKey = new Map(
      data.screeningApplications.map(r => [keyOf(r.iso3, r.cit), r])
    );
    const out: Point[] = [];
    for (const t of data.trApprovals) {
      const s = screenByKey.get(keyOf(t.iso3, t.cit));
      if (!s || s.applications <= 0 || s.referred <= 0) continue;
      const x = s.referred / s.applications;
      const y = t.rate;
      out.push({
        cit: t.cit,
        iso3: t.iso3,
        x,
        y,
        z: s.applications,
        applications: s.applications,
        referred: s.referred,
        approved: t.approved,
        processed: t.processed,
        ratio: x > 0 ? y / x : 0,
      });
    }
    return out.sort((a, b) => b.applications - a.applications);
  }, [data.screeningApplications, data.trApprovals]);

  const { points, hiddenBelowThreshold } = useMemo(() => {
    const kept = allPoints.filter(p => p.applications >= minApplications);
    return {
      points: kept,
      hiddenBelowThreshold: allPoints.length - kept.length,
    };
  }, [allPoints, minApplications]);

  // Higher y/x reads cool (blue) and lower reads warm (red), which is the reverse
  // of divergingColor's warm-for-positive convention, so the log ratio is negated
  // before it is passed in.
  const colorFor = (p: Point): string =>
    divergingColor(
      nationalRatio > 0 ? -log2(p.ratio / nationalRatio) : 0,
      theme,
      COLOR_SPAN
    );

  // Explicit power-of-ten x domain that brackets the data. On a Recharts log axis
  // domain={['auto','auto']} does not compute bounds that contain the points, so
  // with allowDataOverflow the dots would render outside the plotting area.
  const xDomain = useMemo<[number, number]>(() => {
    if (!points.length) return [0.0001, 1];
    let lo = Infinity;
    let hi = -Infinity;
    for (const p of points) {
      if (p.x < lo) lo = p.x;
      if (p.x > hi) hi = p.x;
    }
    return [floorPow(lo), ceilPow(hi)];
  }, [points]);

  const xTicks = useMemo(() => {
    const [lo, hi] = xDomain;
    const t: number[] = [];
    for (let v = lo; v <= hi * 1.0000001; v *= 10) t.push(v);
    return t;
  }, [xDomain]);

  const selectedCit = selection?.cit ?? null;
  const opacityFor = (p: Point): number => {
    if (!selectedCit) return 0.9;
    return p.cit === selectedCit ? 1 : 0.2;
  };

  const tableColumns: Column[] = [
    { key: 'cit', label: 'Country' },
    { key: 'applications', label: 'Applications', num: true },
    { key: 'scrRate', label: 'Screening rate', num: true },
    { key: 'apprRate', label: 'Approval rate', num: true },
    { key: 'ratio', label: 'Approval ÷ screening', num: true },
  ];
  const tableRows: Record<string, ReactNode>[] = points.map(p => ({
    cit: withFlag(p.cit, p.iso3),
    applications: fmtInt(p.applications),
    scrRate: fmtPct(p.x, 2),
    apprRate: fmtPct(p.y, 1),
    ratio: fmtRatio(p.ratio),
  }));

  const subtitle = (
    <>
      One dot per nationality, placed at its 2025 <b>security-screening rate</b>{' '}
      on the x-axis (referrals over applications, on a <b>log</b> scale because
      the rates span three orders of magnitude) and its 2025{' '}
      <b>temporary-residence approval rate</b> on the y-axis (approved over
      processed). The <b>dot size</b> scales with total applications, so the
      biggest source countries read as much larger marks. The <b>color</b>{' '}
      encodes the ratio of the two rates, approval divided by screening,
      diverging about the national ratio of{' '}
      <b>{nationalRatio > 0 ? fmtRatio(nationalRatio) : '—'}</b>: a country
      approved far more often than it is screened reads cool, and one screened
      nearly as often as it is approved reads warm. Nationalities with fewer
      than {fmtInt(minApplications)} applications are hidden
      {hiddenBelowThreshold > 0
        ? ` (${fmtInt(hiddenBelowThreshold)} excluded)`
        : ''}{' '}
      because a tiny denominator makes the screening rate unstable.
    </>
  );

  const footnote =
    'The screening rate is 2025 referrals (all activity types) over 2025 applications (PR intake, ' +
    'study permits processed, and TRV intake); the approval rate is IRCC’s own 2025 approved over ' +
    'processed temporary-residence total. A country appears only when it carries both rates, so ' +
    'nationalities with zero screening referrals (no defined rate to plot on a log axis) or with a ' +
    'suppressed approval count are omitted.';

  const legend = (
    <Legend
      items={[
        {
          label: 'Screened nearly as often as approved (low ratio)',
          color: divergingColor(COLOR_SPAN, theme, COLOR_SPAN),
        },
        {
          label: `National ratio (${nationalRatio > 0 ? fmtRatio(nationalRatio) : '—'})`,
          color: ink.ink2,
        },
        {
          label: 'Approved far more often than screened (high ratio)',
          color: divergingColor(-COLOR_SPAN, theme, COLOR_SPAN),
        },
      ]}
    />
  );

  const controls = (
    <div className='seg-field'>
      <span className='seg-label' id={minApplicationsLabelId}>
        Min. applications
      </span>
      <div
        className='segmented'
        role='group'
        aria-labelledby={minApplicationsLabelId}
      >
        {MIN_APPLICATIONS.map(m => (
          <button
            key={m}
            aria-pressed={minApplications === m}
            onClick={() => setMinApplications(m)}
          >
            ≥ {fmtInt(m)}
          </button>
        ))}
      </div>
    </div>
  );

  let body: ReactNode;
  if (!points.length) {
    body = (
      <div className='chart-empty'>
        No nationalities meet the {fmtInt(minApplications)}-application minimum.
      </div>
    );
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
              name='Screening rate'
              scale='log'
              domain={xDomain}
              ticks={xTicks}
              allowDataOverflow
              tickFormatter={pctTick}
              tick={{ fill: ink.muted, fontSize: 11 }}
              stroke={ink.grid}
              label={{
                value: 'Security-screening rate (log)',
                position: 'insideBottom',
                offset: -18,
                fill: ink.ink2,
                fontSize: 12,
              }}
            />
            <YAxis
              type='number'
              dataKey='y'
              name='Approval rate'
              domain={[0, 1]}
              ticks={[0, 0.25, 0.5, 0.75, 1]}
              tickFormatter={(v: number) => `${Math.round(v * 100)}%`}
              tick={{ fill: ink.muted, fontSize: 11 }}
              stroke={ink.grid}
              label={{
                value: 'TR approval rate',
                angle: -90,
                position: 'insideLeft',
                offset: 6,
                fill: ink.ink2,
                fontSize: 12,
              }}
            />
            <ZAxis
              type='number'
              dataKey='z'
              range={[36, 560]}
              name='Applications'
            />
            <Tooltip
              isAnimationActive={false}
              cursor={{ stroke: ink.muted, strokeDasharray: '3 3' }}
              content={<ScatterTip nationalRatio={nationalRatio} />}
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
      title='Approval rate vs. security-screening rate — scatter'
      subtitle={subtitle}
      controls={controls}
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
  nationalRatio,
}: {
  active?: boolean;
  payload?: { payload: Point }[];
  nationalRatio: number;
}) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0].payload;
  const rows: [string, string][] = [
    ['Applications', fmtInt(p.applications)],
    ['Screening rate', fmtPct(p.x, 2)],
    ['Approval rate', fmtPct(p.y, 1)],
    ['Approval ÷ screening', fmtRatio(p.ratio)],
    [
      'vs. national ratio',
      nationalRatio > 0 ? fmtRatio(p.ratio / nationalRatio) : '—',
    ],
  ];
  return (
    <div className='viz-tooltip' role='tooltip'>
      <div className='t-title'>{withFlag(p.cit, p.iso3)}</div>
      {rows.map(([label, value]) => (
        <div className='t-row' key={label}>
          <span>{label}</span>
          <b>{value}</b>
        </div>
      ))}
    </div>
  );
}
