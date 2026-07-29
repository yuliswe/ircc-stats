'use client';

/**
 * Opinion §1 — comprehensive-screening rate by application stream, comparing
 * China, India and the national mean across all three streams on one shared
 * scale. A grouped horizontal-bar chart rendered as HTML flow (not SVG), matching
 * the design template; the numbers come straight from `streamCompare`.
 */
import { useViz } from '@/lib/store';
import { pick } from '@/lib/i18n';
import { ChartCard } from '@/components/viz/ChartCard';
import { Legend } from '@/components/viz/Legend';
import { profile, totals, streamCompare } from '@/lib/opinion';
import { OPINION_CHARTS } from '@/content/opinion';

const UPPER: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '.12em',
  textTransform: 'uppercase',
  color: 'var(--ink-muted)',
  textAlign: 'right',
};

export function StreamCompareChart() {
  const { data, locale } = useViz();
  const T = OPINION_CHARTS.streamCompare;
  const c = streamCompare(
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
      legend={
        <Legend
          items={T.legend.map(l => ({
            label: pick(locale, l.label),
            color: l.color,
          }))}
        />
      }
      tableColumns={c.table.columns}
      tableRows={c.table.rows}
    >
      <div style={{ overflowX: 'auto' }}>
        <div style={{ minWidth: 460 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '150px 1fr',
              gap: '0 14px',
              alignItems: 'end',
            }}
          >
            <span style={UPPER}>申请通道</span>
            <div style={{ paddingRight: 170 }}>
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

          {c.groups.map(g => (
            <div
              key={g.key}
              style={{
                marginTop: 20,
                paddingTop: 14,
                borderTop: '1px solid var(--rule-soft)',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '150px 1fr',
                  gap: '0 14px',
                  alignItems: 'baseline',
                  marginBottom: 10,
                }}
              >
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: 'var(--ink)',
                    textAlign: 'right',
                    lineHeight: 1.2,
                  }}
                >
                  {g.zh}
                </span>
                <span style={{ fontSize: 11.5, color: 'var(--ink-muted)' }}>
                  {g.note}
                </span>
              </div>
              {g.bars.map(b => (
                <div
                  key={b.key}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '150px 1fr',
                    gap: '0 14px',
                    alignItems: 'center',
                    height: 28,
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
                    {b.zh}
                  </span>
                  <div style={{ paddingRight: 170 }}>
                    <div style={{ position: 'relative', height: 17 }}>
                      <div
                        className='viz-grow-x'
                        style={{
                          height: 17,
                          width: b.w,
                          background: b.color,
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
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12.5,
                            fontWeight: 700,
                            color: 'var(--ink)',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {b.value}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            color: 'var(--ink-muted)',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {b.ratio}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </ChartCard>
  );
}
