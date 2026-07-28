'use client';

/**
 * Chart 2 — Screening-type composition (docs/ui-spec.md §6).
 *
 * A 100% stacked horizontal bar per country, segments in activity-type reading
 * order (routine first), coloured by `activityColor`. This is the composition of
 * a country's *own* screenings, not a referral rate (§1 caveat). For TRV the
 * serious/routine framing is unavailable until the VIT severity mapping is
 * supplied, so the same bars render with a neutral, code-only legend.
 *
 * The plot is hand-rolled flex rows rather than Recharts: each row is a flex
 * container whose segments grow proportionally to their count, and a 2px gap
 * reveals the card surface between fills. This gives exact control over the gap
 * and 100% normalization, and it renders deterministically under static export
 * (no client-only lib, no DOM measurement, so no mounted-flag gate is needed).
 */
import { useState, type ReactNode } from 'react';
import { useViz } from '../../lib/store';
import { applyThreshold, type CountryMetric } from '../../lib/selectors';
import { activityColor } from '../../lib/palette';
import { fmtInt, fmtPct, withFlag } from '../../lib/format';
import { ChartCard } from '../viz/ChartCard';
import { Legend } from '../viz/Legend';
import { TooltipBox } from '../viz/TooltipBox';
import type { Column } from '../viz/TableView';

const COLLAPSED = 25;

/** Shorten an activity label for a compact control, e.g. "HIRV Screening" → "HIRV". */
const short = (act: string) => act.replace(/\s*Screening$/i, '');

const share = (c: CountryMetric, act: string) =>
  c.total > 0 ? (c.byActivity[act] ?? 0) / c.total : 0;

interface SortOpt {
  key: string;
  label: string;
  val: (c: CountryMetric) => number;
}

interface Tip {
  cit: string;
  iso3: string | null;
  act: string;
  count: number;
  pct: number;
  x: number;
  y: number;
}

export function CompositionChart() {
  const {
    streamId,
    stream,
    valueField,
    minScreenings,
    metrics,
    theme,
    selection,
    select,
  } = useViz();
  const { activityTypes, seriousTypes, routineType, seriousMappingKnown } =
    metrics;

  const [sortKey, setSortKey] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [tip, setTip] = useState<Tip | null>(null);

  // Sort options depend on whether the serious mapping is known. For TRV only
  // volume and per-VIT-share framings make sense (no serious/routine axis).
  const sortOpts: SortOpt[] = seriousMappingKnown
    ? [
        {
          key: 'serious',
          label: 'By % serious',
          val: c => c.seriousShare ?? 0,
        },
        ...(seriousTypes.length
          ? [
              {
                key: `share:${seriousTypes[seriousTypes.length - 1]}`,
                label: `By % ${short(seriousTypes[seriousTypes.length - 1])}`,
                val: (c: CountryMetric) =>
                  share(c, seriousTypes[seriousTypes.length - 1]),
              },
            ]
          : []),
        { key: 'volume', label: 'By total volume', val: c => c.total },
      ]
    : [
        { key: 'volume', label: 'By total volume', val: c => c.total },
        ...activityTypes
          .filter(a => a !== routineType)
          .map(a => ({
            key: `share:${a}`,
            label: `By % ${short(a)}`,
            val: (c: CountryMetric) => share(c, a),
          })),
      ];

  // The stored key may be stale after a stream switch (options differ); fall
  // back to the first option so the control is always valid.
  const activeOpt = sortOpts.find(o => o.key === sortKey) ?? sortOpts[0];

  const thr = applyThreshold(metrics.countries, minScreenings);

  const fullSorted = [...thr.shown].sort(
    (a, b) =>
      activeOpt.val(b) - activeOpt.val(a) ||
      b.total - a.total ||
      a.cit.localeCompare(b.cit)
  );

  // Collapsed view keeps the 25 largest by volume (so we never drop a big
  // country just because it ranks low on the current sort), then displays them
  // in the active sort order.
  const canToggle = thr.shown.length > COLLAPSED;
  const collapseHidden = Math.max(0, thr.shown.length - COLLAPSED);
  let visible = fullSorted;
  if (!showAll && canToggle) {
    const keep = new Set(
      [...thr.shown]
        .sort((a, b) => b.total - a.total)
        .slice(0, COLLAPSED)
        .map(c => c.cit)
    );
    visible = fullSorted.filter(c => keep.has(c.cit));
  }

  const legendItems = activityTypes.map(a => ({
    label: a,
    color: activityColor(streamId, a, theme),
  }));

  const controls = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <label className='sr-only' htmlFor='composition-sort'>
        Sort countries
      </label>
      <select
        id='composition-sort'
        className='card-toggle'
        style={{ cursor: 'pointer' }}
        value={activeOpt.key}
        onChange={e => setSortKey(e.target.value)}
      >
        {sortOpts.map(o => (
          <option key={o.key} value={o.key}>
            {o.label}
          </option>
        ))}
      </select>
      {canToggle ? (
        <button
          className='card-toggle'
          aria-pressed={showAll}
          onClick={() => setShowAll(v => !v)}
        >
          {showAll ? `Show top ${COLLAPSED}` : `Show all (${thr.shown.length})`}
        </button>
      ) : null}
    </div>
  );

  const placeholderCount =
    valueField === 'grand'
      ? stream.placeholders.grand
      : stream.placeholders.total2025;
  const basisLabel = valueField === 'grand' ? 'grand total' : '2025 only';

  const footnote: ReactNode = (
    <>
      {thr.hiddenCount > 0 ? (
        <>
          {fmtInt(thr.hiddenCount)} countr{thr.hiddenCount === 1 ? 'y' : 'ies'}{' '}
          below the {fmtInt(minScreenings)}
          -screening minimum are hidden.{' '}
        </>
      ) : null}
      {!showAll && collapseHidden > 0 ? (
        <>
          Showing the {COLLAPSED} largest by volume; {fmtInt(collapseHidden)}{' '}
          more collapsed — use “Show all”.{' '}
        </>
      ) : null}
      {fmtInt(placeholderCount)} reconciliation-placeholder rows for
      ATIP-withheld or non-footing cells are included ({basisLabel}).
    </>
  );

  // Table equivalent: one "% <activity>" column per type, plus the total.
  const tableColumns: Column[] = [
    { key: 'cit', label: 'Country' },
    ...activityTypes.map(a => ({
      key: `pct:${a}`,
      label: `% ${short(a)}`,
      num: true,
    })),
    { key: 'total', label: 'Total', num: true },
  ];
  const tableRows: Record<string, ReactNode>[] = visible.map(c => {
    const row: Record<string, ReactNode> = {
      cit: withFlag(c.cit, c.iso3),
      total: fmtInt(c.total),
    };
    for (const a of activityTypes) row[`pct:${a}`] = fmtPct(share(c, a));
    return row;
  });

  const subtitle: ReactNode = seriousMappingKnown ? (
    <>
      Each bar is one country’s screenings normalized to 100%, split by
      screening type. This is the composition of a country’s own screenings, not
      a referral rate.
    </>
  ) : (
    <>
      Each bar is one country’s screenings normalized to 100%, split by VIT
      code. The serious-versus-routine framing is unavailable until the VIT
      severity mapping is supplied, so the bars carry a neutral legend.
    </>
  );

  return (
    <ChartCard
      title='Screening-type composition'
      subtitle={subtitle}
      controls={controls}
      legend={<Legend items={legendItems} />}
      footnote={footnote}
      tableColumns={tableColumns}
      tableRows={tableRows}
    >
      {visible.length === 0 ? (
        <div className='chart-empty'>
          No countries meet the current minimum of {fmtInt(minScreenings)}{' '}
          screenings. Lower the Min. screenings control to show more.
        </div>
      ) : (
        <>
          {!seriousMappingKnown ? (
            <p
              style={{
                fontSize: '0.72rem',
                color: 'var(--ink-muted)',
                margin: '0 0 0.5rem',
              }}
            >
              Note: the VIT severity mapping has not been supplied, so no VIT
              code is labelled routine or serious here.
            </p>
          ) : null}
          <div style={{ maxHeight: 520, overflowY: 'auto', paddingRight: 2 }}>
            {visible.map((c, i) => {
              const dimmed = selection != null && selection.cit !== c.cit;
              const isSel = selection?.cit === c.cit;
              const segs = activityTypes
                .map(act => ({ act, count: c.byActivity[act] ?? 0 }))
                .filter(s => s.count > 0);
              const toggle = () =>
                select(isSel ? null : { cit: c.cit, iso3: c.iso3 });
              return (
                <div
                  key={c.cit}
                  role='button'
                  tabIndex={0}
                  aria-pressed={isSel}
                  aria-label={`${withFlag(c.cit, c.iso3)}: ${fmtInt(c.total)} screenings`}
                  onClick={toggle}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggle();
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '3px 0',
                    cursor: 'pointer',
                    opacity: dimmed ? 0.25 : 1,
                    transition: 'opacity 120ms ease',
                  }}
                >
                  <div
                    title={withFlag(c.cit, c.iso3)}
                    style={{
                      width: 132,
                      flex: 'none',
                      textAlign: 'right',
                      fontSize: '0.76rem',
                      color: 'var(--ink-2)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {withFlag(c.cit, c.iso3)}
                  </div>
                  <div
                    className='viz-grow-x'
                    style={{
                      flex: 1,
                      display: 'flex',
                      height: 20,
                      gap: 2,
                      borderRadius: 4,
                      overflow: 'hidden',
                      background: 'var(--surface)',
                      outline: isSel ? '2px solid var(--focus)' : 'none',
                      outlineOffset: 1,
                      animationDelay: `${i * 18}ms`,
                    }}
                  >
                    {segs.map(s => {
                      const pct = c.total > 0 ? s.count / c.total : 0;
                      const move = (e: React.MouseEvent) =>
                        setTip({
                          cit: c.cit,
                          iso3: c.iso3,
                          act: s.act,
                          count: s.count,
                          pct,
                          x: e.clientX,
                          y: e.clientY,
                        });
                      return (
                        <div
                          key={s.act}
                          onMouseEnter={move}
                          onMouseMove={move}
                          onMouseLeave={() => setTip(null)}
                          style={{
                            flexGrow: s.count,
                            flexBasis: 0,
                            minWidth: 0,
                            background: activityColor(streamId, s.act, theme),
                          }}
                        />
                      );
                    })}
                  </div>
                  <div
                    style={{
                      width: 60,
                      flex: 'none',
                      textAlign: 'right',
                      fontSize: '0.72rem',
                      color: 'var(--ink-muted)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {fmtInt(c.total)}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
      {tip ? (
        <TooltipBox
          title={withFlag(tip.cit, tip.iso3)}
          rows={[
            { label: 'Type', value: tip.act },
            { label: 'Count', value: fmtInt(tip.count) },
            { label: '% of total', value: fmtPct(tip.pct) },
          ]}
          x={tip.x}
          y={tip.y}
        />
      ) : null}
    </ChartCard>
  );
}
