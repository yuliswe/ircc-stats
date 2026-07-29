'use client';

/**
 * Opinion §4 — cumulative comprehensive screenings 2019–2025 by nationality, top
 * N, with China warm-highlighted. Horizontal bars on one shared scale; the label
 * gutter carries the flag + name and the bar tip the count and global share.
 */
import { useViz } from '@/lib/store';
import { pick } from '@/lib/i18n';
import { ChartCard } from '@/components/viz/ChartCard';
import { cumulative } from '@/lib/opinion';
import { OPINION_CHARTS } from '@/content/opinion';

export function CumulativeChart() {
  const { data, locale } = useViz();
  const T = OPINION_CHARTS.cumulative;
  const c = cumulative(data, locale, {});

  return (
    <ChartCard
      title={pick(locale, T.title(c.shown))}
      subtitle={pick(locale, T.subtitle)}
      footnote={pick(locale, T.footnote(c.total, c.countries))}
      tableColumns={c.table.columns}
      tableRows={c.table.rows}
    >
      <div style={{ overflowX: 'auto' }}>
        <div style={{ minWidth: 440 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '150px 1fr',
              gap: '0 14px',
              alignItems: 'end',
              marginBottom: 6,
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '.12em',
                textTransform: 'uppercase',
                color: 'var(--ink-muted)',
                textAlign: 'right',
              }}
            >
              国家/地区
            </span>
            <div style={{ paddingRight: 150 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 11,
                  color: 'var(--ink-muted)',
                  fontVariantNumeric: 'tabular-nums',
                  borderBottom: '1px solid var(--grid)',
                  paddingBottom: 4,
                }}
              >
                {c.ticks.map((t, i) => (
                  <span key={i}>{t}</span>
                ))}
              </div>
            </div>
          </div>

          {c.bars.map(b => (
            <div
              key={b.key}
              style={{
                display: 'grid',
                gridTemplateColumns: '150px 1fr',
                gap: '0 14px',
                alignItems: 'center',
                height: 30,
              }}
            >
              <span
                style={{
                  fontSize: 12.5,
                  color: 'var(--ink-2)',
                  textAlign: 'right',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {b.flag} {b.zh}
              </span>
              <div style={{ paddingRight: 150 }}>
                <div style={{ position: 'relative', height: 18 }}>
                  <div
                    className='viz-grow-x'
                    style={{
                      height: 18,
                      width: b.w,
                      background: b.fill,
                      opacity: Number(b.opacity),
                      animationDelay: b.delay,
                    }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      left: b.w,
                      top: 0,
                      marginLeft: 10,
                      display: 'flex',
                      gap: 10,
                      alignItems: 'baseline',
                      whiteSpace: 'nowrap',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12.5,
                        fontWeight: 700,
                        color: 'var(--ink)',
                      }}
                    >
                      {b.value}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--ink-muted)' }}>
                      {b.pct}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ChartCard>
  );
}
