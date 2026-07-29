'use client';

/**
 * Chart 5 — Referral rate vs. screening volume (docs/ui-spec.md §6).
 *
 * The rigorous, in-data bias test. Each country is plotted at
 * x = its total screenings (the denominator that already lives in the data) and
 * y = its serious screenings (Org Crime + HIRV), both on log scales. A reference
 * line at the global serious rate (y = globalSeriousShare · x) is the "expected"
 * escalation for a country of that volume, so the vertical residual above the
 * line is the disproportionality signal. Point size encodes total screenings and
 * point color encodes enrichment (diverging cool↔warm). Because this uses only
 * counts already present, it renders immediately and is never gated on an
 * external application-volume table; that table is offered only as a toggle.
 */
import { useEffect, useMemo, useState, type ReactNode } from 'react';
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
import { applyThreshold } from '@/lib/selectors';
import { divergingColor, DIVERGING, INK } from '@/lib/palette';
import { fmtInt, fmtPct, withFlag } from '@/lib/format';
import { ChartCard } from '@/components/viz/ChartCard';
import { Legend } from '@/components/viz/Legend';
import type { Column } from '@/components/viz/TableView';

/** Log-scale floor so a country with zero serious screenings still plots near the bottom. */
const SERIOUS_FLOOR = 0.5;

type Point = {
  cit: string;
  iso3: string | null;
  x: number; // total screenings (denominator)
  y: number; // serious, floored for the log axis
  z: number; // size channel (total)
  serious: number; // real serious count (0 shown as such in the tooltip)
  total: number;
  seriousShare: number;
  expected: number;
  residual: number;
  logEnr: number;
  below: boolean; // under the min-screenings threshold → dimmed
};

export function ReferralScatter() {
  const {
    metrics,
    minScreenings,
    theme,
    selection,
    select,
    stream,
    valueField,
  } = useViz();
  const [mounted, setMounted] = useState(false);
  const [xField, setXField] = useState<'screenings' | 'applications'>(
    'screenings'
  );
  useEffect(() => setMounted(true), []);
  // Points animate in only once the card scrolls into view; the key remounts the
  // series when that flips so Recharts replays its enter animation on reveal.
  const revealed = useRevealed();

  const ink = INK[theme];
  const div = DIVERGING[theme];
  const share = metrics.globalSeriousShare ?? 0;

  // Which countries fall below the threshold (dimmed, not removed).
  const belowSet = useMemo(() => {
    const { shown } = applyThreshold(metrics.countries, minScreenings);
    const keep = new Set(shown.map(c => c.cit));
    return { isBelow: (cit: string) => !keep.has(cit) };
  }, [metrics.countries, minScreenings]);

  const points = useMemo<Point[]>(() => {
    if (!metrics.seriousMappingKnown) return [];
    return metrics.countries
      .filter(c => c.serious != null && c.total > 0)
      .map(c => {
        const { serious } = c;
        const expected = share * c.total;
        const seriousShare = c.seriousShare ?? serious / c.total;
        return {
          cit: c.cit,
          iso3: c.iso3,
          x: c.total,
          y: serious > 0 ? serious : SERIOUS_FLOOR,
          z: c.total,
          serious,
          total: c.total,
          seriousShare,
          expected,
          residual: serious - expected,
          logEnr: c.logEnrichment ?? 0,
          below: belowSet.isBelow(c.cit),
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [metrics.countries, metrics.seriousMappingKnown, share, belowSet]);

  const [xMin, xMax] = useMemo(() => {
    if (!points.length) return [1, 10];
    let lo = Infinity;
    let hi = -Infinity;
    for (const p of points) {
      if (p.x < lo) lo = p.x;
      if (p.x > hi) hi = p.x;
    }
    return [lo, hi];
  }, [points]);

  const selectedCit = selection?.cit ?? null;

  const opacityFor = (p: Point): number => {
    if (selectedCit) return p.cit === selectedCit ? 1 : 0.25;
    return p.below ? 0.3 : 1;
  };

  const placeholders = stream.placeholders[valueField];

  const tableColumns: Column[] = [
    { key: 'cit', label: 'Country' },
    { key: 'total', label: 'Total', num: true },
    { key: 'serious', label: 'Serious', num: true },
    { key: 'rate', label: 'Rate', num: true },
    { key: 'expected', label: 'Expected serious', num: true },
    { key: 'residual', label: 'Residual', num: true },
  ];

  const tableRows: Record<string, ReactNode>[] = points.map(p => ({
    cit: withFlag(p.cit, p.iso3),
    total: fmtInt(p.total),
    serious: fmtInt(p.serious),
    rate: fmtPct(p.seriousShare),
    expected: fmtInt(p.expected),
    residual: (p.residual >= 0 ? '+' : '') + fmtInt(p.residual),
  }));

  const subtitle =
    'Serious screenings vs. total screenings, both log. The diagonal is the global serious ' +
    'rate; a country plotted above it is escalated to serious screening more often than its ' +
    'volume predicts. This is a rate over the country’s own screenings, not over applications.';

  const controls = (
    <div className='segmented' role='group' aria-label='x-axis denominator'>
      <button
        aria-pressed={xField === 'screenings'}
        onClick={() => setXField('screenings')}
      >
        x: Screenings
      </button>
      <button
        aria-pressed={xField === 'applications'}
        onClick={() => setXField('applications')}
      >
        x: Applications
      </button>
    </div>
  );

  const legend = (
    <Legend
      items={[
        { label: 'Under-referred', color: div.cool },
        { label: 'Expected (×1)', color: div.mid },
        { label: 'Over-referred', color: div.warm },
      ]}
    />
  );

  const footnote = (
    <>
      {fmtInt(placeholders)} reconciliation-placeholder row
      {placeholders === 1 ? '' : 's'} for ATIP-withheld or non-footing cells{' '}
      {placeholders === 1 ? 'is' : 'are'} included in this time basis. The rate
      is relative to each country&rsquo;s screenings, not its applications, so
      it measures escalation among the screened rather than the raw chance of
      being screened.
    </>
  );

  let body: ReactNode;
  if (!metrics.seriousMappingKnown) {
    body = (
      <div className='chart-empty'>
        Requires the VIT severity mapping (not yet supplied for temporary
        residence).
      </div>
    );
  } else if (xField === 'applications') {
    body = (
      <div className='chart-empty'>
        Application-volume denominator not supplied &mdash; showing the in-data
        screening rate.
      </div>
    );
  } else if (!mounted) {
    body = <div style={{ height: 360 }} />;
  } else if (!points.length) {
    body = (
      <div className='chart-empty'>
        No countries with screening data for the current filters.
      </div>
    );
  } else {
    body = (
      <div style={{ width: '100%', height: 360 }}>
        <ResponsiveContainer width='100%' height='100%'>
          <ScatterChart margin={{ top: 10, right: 24, bottom: 40, left: 8 }}>
            <CartesianGrid stroke={ink.grid} strokeDasharray='3 3' />
            <XAxis
              type='number'
              dataKey='x'
              name='Total screenings'
              scale='log'
              domain={['auto', 'auto']}
              allowDataOverflow
              tickFormatter={(v: number) => fmtInt(v)}
              tick={{ fill: ink.muted, fontSize: 11 }}
              stroke={ink.grid}
              label={{
                value: 'Total screenings (log)',
                position: 'insideBottom',
                offset: -18,
                fill: ink.ink2,
                fontSize: 12,
              }}
            />
            <YAxis
              type='number'
              dataKey='y'
              name='Serious screenings'
              scale='log'
              domain={['auto', 'auto']}
              allowDataOverflow
              tickFormatter={(v: number) => fmtInt(v)}
              tick={{ fill: ink.muted, fontSize: 11 }}
              stroke={ink.grid}
              label={{
                value: 'Serious (log)',
                angle: -90,
                position: 'insideLeft',
                fill: ink.ink2,
                fontSize: 12,
              }}
            />
            <ZAxis type='number' dataKey='z' range={[36, 620]} name='Total' />
            {share > 0 ? (
              <ReferenceLine
                stroke={ink.ink2}
                strokeDasharray='5 4'
                ifOverflow='extendDomain'
                segment={[
                  { x: xMin, y: Math.max(SERIOUS_FLOOR, share * xMin) },
                  { x: xMax, y: Math.max(SERIOUS_FLOOR, share * xMax) },
                ]}
              />
            ) : null}
            <Tooltip
              isAnimationActive={false}
              cursor={{ stroke: ink.muted, strokeDasharray: '3 3' }}
              content={<ScatterTip />}
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
                    fill={divergingColor(p.logEnr, theme)}
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
      title='Chart 5 — Referral rate vs. screening volume'
      subtitle={subtitle}
      controls={controls}
      legend={
        metrics.seriousMappingKnown && xField === 'screenings'
          ? legend
          : undefined
      }
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
}: {
  active?: boolean;
  payload?: { payload: Point }[];
}) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0].payload;
  const rows: [string, string][] = [
    ['Total screenings', fmtInt(p.total)],
    ['Serious screenings', fmtInt(p.serious)],
    ['Serious rate', fmtPct(p.seriousShare)],
    ['Expected serious', fmtInt(p.expected)],
    ['Residual', (p.residual >= 0 ? '+' : '') + fmtInt(p.residual)],
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
