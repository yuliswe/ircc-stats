'use client';

/**
 * Opinion §5 — how often a security screening actually fails, by nationality. A
 * horizontal bar per country filled to the lag-1 failure rate (the causally
 * aligned headline), with a whisker to the same-window rate so the model
 * uncertainty is visible in the mark itself, sorted so the countries screening
 * genuinely catches sit on top and China lands low. A dashed line marks the
 * national mean. Rendered as HTML flow like the other opinion bar charts.
 */
import { useViz } from '@/lib/store';
import { pick } from '@/lib/i18n';
import { ChartCard } from '@/components/viz/ChartCard';
import { screeningOutcome } from '@/lib/opinion';
import { OPINION_CHARTS } from '@/content/opinion';

const NAME_COL = 150;
const LABEL_PAD = 150; // room at the bar tip for the rate + range label

export function ScreeningOutcomeChart() {
  const { data, locale } = useViz();
  const T = OPINION_CHARTS.outcome;
  const o = screeningOutcome(data, locale, {});

  return (
    <ChartCard
      title={pick(locale, T.title)}
      subtitle={pick(locale, T.subtitle(o.minLabel, o.shown))}
      footnote={pick(locale, T.footnote(o.natLagLabel))}
      tableColumns={o.table.columns}
      tableRows={o.table.rows}
    >
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ minWidth: 460 }}>
          {/* axis header: country gutter + tick scale, with the mean label */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `${NAME_COL}px 1fr`,
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
              {pick(locale, T.axisLabel)}
            </span>
            <div style={{ paddingRight: LABEL_PAD }}>
              <div style={{ position: 'relative' }}>
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
                  {o.ticks.map((t, i) => (
                    <span key={i}>{t}</span>
                  ))}
                </div>
                {/* national-mean label riding above its dashed line */}
                <span
                  style={{
                    position: 'absolute',
                    left: o.meanLeft,
                    bottom: '100%',
                    transform: 'translateX(-50%)',
                    marginBottom: 2,
                    fontSize: 10.5,
                    color: 'var(--ink-muted)',
                    whiteSpace: 'nowrap',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {o.meanLabel}
                </span>
              </div>
            </div>
          </div>

          {o.bars.map(b => (
            <div
              key={b.key}
              style={{
                display: 'grid',
                gridTemplateColumns: `${NAME_COL}px 1fr`,
                gap: '0 14px',
                alignItems: 'center',
                height: 30,
              }}
            >
              <span
                style={{
                  fontSize: 12.5,
                  color: 'var(--ink-2)',
                  fontWeight: b.strong ? 700 : 400,
                  textAlign: 'right',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {b.flag} {b.zh}
              </span>
              <div style={{ paddingRight: LABEL_PAD }}>
                <div style={{ position: 'relative', height: 18 }}>
                  {/* national-mean dashed line, continuous down the column */}
                  <div
                    style={{
                      position: 'absolute',
                      left: o.meanLeft,
                      top: -6,
                      bottom: -6,
                      borderLeft: '1px dashed var(--ink-muted)',
                      opacity: 0.6,
                    }}
                  />
                  {/* filled bar to the lag-1 (headline) rate */}
                  <div
                    className='viz-grow-x'
                    style={{
                      position: 'absolute',
                      top: 3,
                      height: 12,
                      width: b.wLag,
                      background: b.fill,
                      opacity: 0.9,
                      animationDelay: b.delay,
                    }}
                  />
                  {/* whisker: range between the lag-1 and same-window rates */}
                  <div
                    style={{
                      position: 'absolute',
                      left: b.wLo,
                      width: b.wSpan,
                      top: 9,
                      height: 8,
                      transform: 'translateY(-50%)',
                      borderLeft: '1px solid var(--ink)',
                      borderRight: '1px solid var(--ink)',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: 0,
                        right: 0,
                        height: 1,
                        background: 'var(--ink)',
                      }}
                    />
                  </div>
                  {/* rate + same-window range label */}
                  <span
                    style={{
                      position: 'absolute',
                      left: b.wHi,
                      top: 0,
                      marginLeft: 10,
                      display: 'flex',
                      gap: 8,
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
                      {b.naiveNote}
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
