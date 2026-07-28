'use client';

/**
 * Chart 3 — Citizenship × Office heatmap (docs/ui-spec.md §6).
 *
 * A matrix whose rows are citizenships and columns are processing offices; each
 * cell is the screening count for that citizenship at that office. The chart
 * answers the second bias axis — whether particular offices refer particular
 * nationalities more than others — rather than the nationality-only story of the
 * bar charts. Because it plots raw office-tier counts, it does not depend on the
 * serious-type severity mapping and therefore renders for TRV as well as PR.
 *
 * Rendering is a plain CSS grid of <div>s (crisp at any zoom, no DOM
 * measurement, so no mounted-flag gate is needed). The one-pixel grid gap is the
 * card border colour showing through, which gives every cell a 1px separator.
 * Empty cells (no screenings for that citizenship × office) are painted with the
 * surface colour rather than the lightest ramp step so that "no data" never
 * reads as "low count".
 */
import { useMemo, useState } from 'react';
import { useViz } from '@/lib/store';
import { applyThreshold, computeOfficeMatrix } from '@/lib/selectors';
import { sequentialColor } from '@/lib/palette';
import { fmtInt, fmtPct, withFlag } from '@/lib/format';
import { ChartCard } from '@/components/viz/ChartCard';
import { TooltipBox, type TipRow } from '@/components/viz/TooltipBox';
import type { Column } from '@/components/viz/TableView';

const ROW_HEAD_W = 150;
const COL_W = 46;
const HEAD_H = 132;
const CELL_H = 26;

type TopN = 10 | 20 | 40;

interface Tip {
  title: string;
  rows: TipRow[];
  x: number;
  y: number;
}

export function OfficeHeatmap() {
  const {
    stream,
    valueField,
    topDim,
    minScreenings,
    metrics,
    selection,
    select,
    theme,
  } = useViz();

  const [rowNorm, setRowNorm] = useState(false);
  const [logScale, setLogScale] = useState(true);
  const [topN, setTopN] = useState<TopN>(20);
  // Which office column the rows are sorted by; null sorts by each row's total.
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [tip, setTip] = useState<Tip | null>(null);

  const matrix = useMemo(
    () => computeOfficeMatrix(stream, valueField, topDim),
    [stream, valueField, topDim]
  );

  // Resolve a citizenship to its ISO3 for the cross-filter payload (§7).
  const iso3For = (cit: string): string | null => {
    const m = metrics.countries.find(c => c.cit === cit);
    if (m) return m.iso3;
    return stream.cityCells.find(c => c.cit === cit)?.iso3 ?? null;
  };

  const view = useMemo(() => {
    // Apply the global min-screenings threshold to countries by their row total,
    // then keep the top-N by row total; columns keep the top-N offices by column
    // total. The set of shown rows is fixed by row total so column-sorting only
    // reorders the same rows rather than swapping which countries appear.
    const countryObjs = matrix.countries.map(cit => ({
      cit,
      total: matrix.rowTotal.get(cit) ?? 0,
    }));
    const { shown: passing, hiddenCount: thresholdHidden } = applyThreshold(
      countryObjs,
      minScreenings
    );

    const byRowTotal = [...passing].sort((a, b) => b.total - a.total);
    const shownCountries = byRowTotal.slice(0, topN).map(c => c.cit);
    const moreCountries = byRowTotal.length - shownCountries.length;

    const officesRanked = [...matrix.offices].sort(
      (a, b) => (matrix.colTotal.get(b) ?? 0) - (matrix.colTotal.get(a) ?? 0)
    );
    const shownOffices = officesRanked.slice(0, topN);
    const moreOffices = officesRanked.length - shownOffices.length;

    return {
      shownCountries,
      shownOffices,
      moreCountries,
      moreOffices,
      thresholdHidden,
    };
  }, [matrix, minScreenings, topN]);

  const {
    shownCountries,
    shownOffices,
    moreCountries,
    moreOffices,
    thresholdHidden,
  } = view;

  // The magnitude a cell is coloured by, respecting the row-normalise toggle.
  const magOf = (cit: string, off: string): number | null => {
    const v = matrix.value.get(cit)?.get(off);
    if (v === undefined) return null;
    if (rowNorm) {
      const rt = matrix.rowTotal.get(cit) ?? 0;
      return rt > 0 ? v / rt : 0;
    }
    return v;
  };

  // Colour domain over the shown cells only. Log mode anchors at the smallest
  // positive magnitude so the skewed distribution spreads across the ramp.
  const domain = useMemo(() => {
    let max = 0;
    let minPos = Infinity;
    for (const cit of shownCountries) {
      for (const off of shownOffices) {
        const m = magOf(cit, off);
        if (m === null || m <= 0) continue;
        if (m > max) max = m;
        if (m < minPos) minPos = m;
      }
    }
    if (!Number.isFinite(minPos)) minPos = max;
    return { max, minPos };
  }, [shownCountries, shownOffices, rowNorm]);

  const t01 = (mag: number): number => {
    const { max, minPos } = domain;
    if (max <= 0) return 0;
    if (logScale) {
      if (max === minPos) return 1;
      const t =
        (Math.log(mag) - Math.log(minPos)) / (Math.log(max) - Math.log(minPos));
      return Math.max(0, Math.min(1, t));
    }
    return Math.max(0, Math.min(1, mag / max));
  };

  // Sort the (fixed) shown rows by the active column, or by row total.
  const orderedCountries = useMemo(() => {
    const key = (cit: string) =>
      sortCol === null
        ? (matrix.rowTotal.get(cit) ?? 0)
        : (matrix.value.get(cit)?.get(sortCol) ?? 0);
    return [...shownCountries].sort((a, b) => key(b) - key(a));
  }, [shownCountries, sortCol, matrix]);

  const surface = 'var(--surface)';
  const border = 'var(--border)';

  const isEmpty = shownCountries.length === 0 || shownOffices.length === 0;

  // ── table equivalent: Country + one column per shown office + Total ──────────
  const tableColumns: Column[] = [
    { key: '__cit', label: 'Country' },
    ...shownOffices.map(off => ({ key: off, label: off, num: true })),
    { key: '__total', label: 'Total', num: true },
  ];
  const tableRows: Record<string, React.ReactNode>[] = orderedCountries.map(
    cit => {
      const row: Record<string, React.ReactNode> = {
        __cit: withFlag(cit, iso3For(cit)),
      };
      for (const off of shownOffices) {
        const v = matrix.value.get(cit)?.get(off);
        row[off] = v === undefined ? '—' : fmtInt(v);
      }
      row.__total = fmtInt(matrix.rowTotal.get(cit) ?? 0);
      return row;
    }
  );

  const placeholders = stream.placeholders[valueField];
  const footnote = (
    <>
      {fmtInt(placeholders)} reconciliation-placeholder row
      {placeholders === 1 ? '' : 's'} for ATIP-withheld or non-footing cells{' '}
      {placeholders === 1 ? 'is' : 'are'} included on the{' '}
      {valueField === 'grand' ? 'grand-total' : '2025'} value field. Cells show
      screening counts, not applications.
    </>
  );

  const subtitle = rowNorm
    ? "Each cell is the share of a country's own screenings handled by that office (rows sum to 100%). Not a referral rate."
    : 'Each cell is the raw screening count for that citizenship at that office. Counts reflect volume, not bias — read alongside the enrichment chart.';

  // Continuous legend sampling the sequential ramp, plus the "no data" swatch.
  const legend = (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.9rem',
        flexWrap: 'wrap',
      }}
    >
      <span
        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
      >
        <span style={{ fontSize: '0.72rem', color: 'var(--ink-muted)' }}>
          {rowNorm ? '0%' : 'low'}
        </span>
        <span
          aria-hidden
          style={{
            width: 120,
            height: 12,
            borderRadius: 3,
            border: `1px solid ${border}`,
            background: `linear-gradient(to right, ${sequentialColor(0, theme)}, ${sequentialColor(
              0.25,
              theme
            )}, ${sequentialColor(0.5, theme)}, ${sequentialColor(0.75, theme)}, ${sequentialColor(
              1,
              theme
            )})`,
          }}
        />
        <span style={{ fontSize: '0.72rem', color: 'var(--ink-muted)' }}>
          {rowNorm ? fmtPct(domain.max) : `high (${fmtInt(domain.max)})`}
        </span>
      </span>
      <span
        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
      >
        <span
          aria-hidden
          style={{
            width: 12,
            height: 12,
            borderRadius: 3,
            background: surface,
            border: `1px solid ${border}`,
          }}
        />
        <span style={{ fontSize: '0.72rem', color: 'var(--ink-2)' }}>
          no data
        </span>
      </span>
      <span style={{ fontSize: '0.72rem', color: 'var(--ink-muted)' }}>
        {logScale ? 'log' : 'linear'} colour scale
      </span>
    </div>
  );

  const controls = (
    <>
      <div className='control'>
        <label>Cell value</label>
        <div className='segmented' role='group' aria-label='Cell value'>
          <button aria-pressed={!rowNorm} onClick={() => setRowNorm(false)}>
            Counts
          </button>
          <button aria-pressed={rowNorm} onClick={() => setRowNorm(true)}>
            Row share
          </button>
        </div>
      </div>
      <div className='control'>
        <label>Colour scale</label>
        <div className='segmented' role='group' aria-label='Colour scale'>
          <button aria-pressed={logScale} onClick={() => setLogScale(true)}>
            Log
          </button>
          <button aria-pressed={!logScale} onClick={() => setLogScale(false)}>
            Linear
          </button>
        </div>
      </div>
      <div className='control'>
        <label>Show top</label>
        <div className='segmented' role='group' aria-label='Top-N limiter'>
          {([10, 20, 40] as TopN[]).map(n => (
            <button
              key={n}
              aria-pressed={topN === n}
              onClick={() => setTopN(n)}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
    </>
  );

  const clearTip = () => setTip(null);

  const showTip = (cit: string, off: string, e: React.MouseEvent) => {
    const v = matrix.value.get(cit)?.get(off);
    if (v === undefined) {
      clearTip();
      return;
    }
    const rt = matrix.rowTotal.get(cit) ?? 0;
    const ct = matrix.colTotal.get(off) ?? 0;
    setTip({
      title: `${withFlag(cit, iso3For(cit))} · ${off}`,
      rows: [
        { label: 'Screenings', value: fmtInt(v) },
        { label: 'Share of country', value: rt > 0 ? fmtPct(v / rt) : '—' },
        { label: 'Share of office', value: ct > 0 ? fmtPct(v / ct) : '—' },
      ],
      x: e.clientX,
      y: e.clientY,
    });
  };

  const gridCols = `${ROW_HEAD_W}px repeat(${shownOffices.length}, ${COL_W}px)`;

  return (
    <ChartCard
      title='Citizenship × office heatmap'
      subtitle={subtitle}
      controls={controls}
      legend={!isEmpty ? legend : undefined}
      footnote={footnote}
      tableColumns={tableColumns}
      tableRows={tableRows}
    >
      {isEmpty ? (
        <div className='chart-empty'>
          No office-level screenings for the current stream, top-dimension
          filter, and minimum-screenings threshold.
        </div>
      ) : (
        <>
          <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
            <div
              role='grid'
              aria-label='Citizenship by office screening counts'
              style={{
                display: 'grid',
                gridTemplateColumns: gridCols,
                gap: 1,
                background: border,
                width: 'max-content',
                minWidth: '100%',
                fontSize: '0.72rem',
              }}
            >
              {/* corner cell — row-sort affordance (sort rows by total) */}
              <button
                onClick={() => setSortCol(null)}
                title='Sort rows by total screenings'
                aria-pressed={sortCol === null}
                style={{
                  height: HEAD_H,
                  border: 0,
                  cursor: 'pointer',
                  background:
                    sortCol === null ? 'var(--surface-3)' : 'var(--surface-2)',
                  color: 'var(--ink-2)',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'flex-start',
                  padding: '6px 8px',
                  textAlign: 'left',
                }}
              >
                Country {sortCol === null ? '↓' : ''}
              </button>

              {/* office column headers — click to sort rows by that office */}
              {shownOffices.map(off => {
                const active = sortCol === off;
                return (
                  <button
                    key={off}
                    onClick={() =>
                      setSortCol(cur => (cur === off ? null : off))
                    }
                    title={`${off} — click to sort rows by this office`}
                    aria-pressed={active}
                    style={{
                      height: HEAD_H,
                      border: 0,
                      cursor: 'pointer',
                      background: active
                        ? 'var(--surface-3)'
                        : 'var(--surface-2)',
                      color: 'var(--ink-2)',
                      display: 'flex',
                      alignItems: 'flex-end',
                      justifyContent: 'center',
                      padding: '6px 2px',
                    }}
                  >
                    <span
                      style={{
                        writingMode: 'vertical-rl',
                        transform: 'rotate(180deg)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxHeight: HEAD_H - 14,
                        fontWeight: active ? 700 : 400,
                      }}
                    >
                      {off}
                    </span>
                  </button>
                );
              })}

              {/* body: row header + cells */}
              {orderedCountries.map((cit, rowIdx) => {
                const selected = selection?.cit === cit;
                const dim = selection && !selected ? 0.25 : 1;
                return (
                  <div key={cit} style={{ display: 'contents' }}>
                    <button
                      onClick={() =>
                        selected
                          ? select(null)
                          : select({ cit, iso3: iso3For(cit) })
                      }
                      title={`${withFlag(cit, iso3For(cit))} — click to cross-filter the other charts`}
                      style={{
                        height: CELL_H,
                        border: 0,
                        cursor: 'pointer',
                        opacity: dim,
                        background: selected
                          ? 'var(--series-1)'
                          : 'var(--surface-2)',
                        color: selected ? '#fff' : 'var(--ink)',
                        fontWeight: selected ? 700 : 400,
                        textAlign: 'left',
                        padding: '0 8px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {withFlag(cit, iso3For(cit))}
                    </button>
                    {shownOffices.map((off, colIdx) => {
                      const mag = magOf(cit, off);
                      const bg =
                        mag === null
                          ? surface
                          : sequentialColor(t01(mag), theme);
                      return (
                        <div
                          key={off}
                          role='gridcell'
                          className='viz-pop'
                          title={
                            mag === null
                              ? `${withFlag(cit, iso3For(cit))} · ${off}: no data`
                              : `${withFlag(cit, iso3For(cit))} · ${off}: ${fmtInt(matrix.value.get(cit)!.get(off)!)}`
                          }
                          onMouseEnter={e => showTip(cit, off, e)}
                          onMouseMove={e => showTip(cit, off, e)}
                          onMouseLeave={clearTip}
                          style={{
                            height: CELL_H,
                            background: bg,
                            opacity: dim,
                            animationDelay: `${Math.min((rowIdx + colIdx) * 12, 500)}ms`,
                          }}
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          <div
            style={{
              marginTop: '0.6rem',
              fontSize: '0.72rem',
              color: 'var(--ink-muted)',
            }}
          >
            Showing top {shownCountries.length} countries ×{' '}
            {shownOffices.length} offices
            {(moreCountries > 0 || moreOffices > 0) && (
              <>
                {' '}
                (+{moreCountries} more countr{moreCountries === 1 ? 'y' : 'ies'}
                , +{moreOffices} more office{moreOffices === 1 ? '' : 's'}{' '}
                hidden)
              </>
            )}
            .
            {thresholdHidden > 0 && (
              <>
                {' '}
                {thresholdHidden} countr{thresholdHidden === 1 ? 'y' : 'ies'}{' '}
                below the {minScreenings}-screening threshold excluded.
              </>
            )}{' '}
            Click a country to cross-filter; click an office header to sort rows
            by it.
          </div>
        </>
      )}
      {tip && (
        <TooltipBox title={tip.title} rows={tip.rows} x={tip.x} y={tip.y} />
      )}
    </ChartCard>
  );
}
