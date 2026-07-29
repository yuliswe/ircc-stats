'use client';

/**
 * Opinion §2 — a 100-cell waffle per nationality showing how many of every 100
 * permanent-residence applicants are pulled for comprehensive screening. China,
 * India and the national mean sit side by side; filled cells are rounded to the
 * nearest whole cell, with the exact rate above and the raw counts below.
 */
import { useViz } from '@/lib/store';
import { pick } from '@/lib/i18n';
import { ChartCard } from '@/components/viz/ChartCard';
import { profile, totals, waffle } from '@/lib/opinion';
import { OPINION_CHARTS } from '@/content/opinion';

export function WaffleChart() {
  const { data, locale } = useViz();
  const T = OPINION_CHARTS.waffle;
  const w = waffle(
    profile(data, 'CHN', locale),
    profile(data, 'IND', locale),
    totals(data),
    locale
  );

  return (
    <ChartCard
      title={pick(locale, T.title)}
      subtitle={pick(locale, T.subtitle)}
      footnote={pick(locale, T.footnote)}
      tableColumns={w.table.columns}
      tableRows={w.table.rows}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))',
          gap: 'clamp(20px,2.6vw,38px)',
        }}
      >
        {w.panels.map(p => (
          <div key={p.key}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                gap: 10,
                marginBottom: 12,
                paddingBottom: 8,
                borderBottom: '2px solid var(--rule)',
              }}
            >
              <span
                style={{
                  fontSize: 14.5,
                  fontWeight: 700,
                  color: 'var(--ink)',
                  whiteSpace: 'nowrap',
                }}
              >
                {p.zh}
              </span>
              <span
                style={{
                  fontSize: 'clamp(20px,2.1vw,26px)',
                  fontWeight: 800,
                  letterSpacing: '-.03em',
                  color: 'var(--ink)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {p.value}
              </span>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(10,1fr)',
                gap: 3,
              }}
            >
              {p.cells.map(cell => (
                <span
                  key={cell.key}
                  className='viz-fade'
                  style={{
                    display: 'block',
                    aspectRatio: '1',
                    background: cell.bg,
                    animationDelay: cell.delay,
                  }}
                />
              ))}
            </div>
            <div
              style={{
                marginTop: 12,
                fontSize: 11.5,
                lineHeight: 1.5,
                color: 'var(--ink-muted)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {p.oneIn}
              <br />
              {p.detail}
            </div>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}
