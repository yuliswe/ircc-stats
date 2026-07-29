'use client';

/**
 * Opinion §5 — share of national screening effort beside share of national
 * temporary-residence refusals, for the top screening nationalities, with the
 * screening ÷ refusal ratio in the last column. Two independently scaled bar
 * columns; a warm ratio flags over-screening, a cool one under-screening.
 */
import { useViz } from '@/lib/store';
import { pick } from '@/lib/i18n';
import { ChartCard } from '@/components/viz/ChartCard';
import { Legend } from '@/components/viz/Legend';
import { mismatch } from '@/lib/opinion';
import { OPINION_CHARTS } from '@/content/opinion';

const GRID_COLS = '130px 1fr 1fr 96px';

const UPPER: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '.12em',
  textTransform: 'uppercase',
  color: 'var(--ink-muted)',
  textAlign: 'right',
};

function TickRow({ ticks }: { ticks: string[] }) {
  return (
    <div style={{ paddingRight: 58 }}>
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
        {ticks.map((t, i) => (
          <span key={i}>{t}</span>
        ))}
      </div>
    </div>
  );
}

function Bar({
  w,
  value,
  color,
  delay,
}: {
  w: string;
  value: string;
  color: string;
  delay: string;
}) {
  return (
    <div style={{ paddingRight: 58 }}>
      <div style={{ position: 'relative', height: 15 }}>
        <div
          className='viz-grow-x'
          style={{
            height: 15,
            width: w,
            background: color,
            opacity: 0.85,
            animationDelay: delay,
          }}
        />
        <span
          style={{
            position: 'absolute',
            left: w,
            top: -1,
            marginLeft: 8,
            fontSize: 11.5,
            color: 'var(--ink-2)',
            fontVariantNumeric: 'tabular-nums',
            whiteSpace: 'nowrap',
          }}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

export function MismatchChart() {
  const { data, locale } = useViz();
  const T = OPINION_CHARTS.mismatch;
  const m = mismatch(data, locale, {});

  return (
    <ChartCard
      title={pick(locale, T.title(m.shown))}
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
      tableColumns={m.table.columns}
      tableRows={m.table.rows}
    >
      <div style={{ overflowX: 'auto' }}>
        <div style={{ minWidth: 520 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: GRID_COLS,
              gap: '0 18px',
              alignItems: 'end',
              marginBottom: 2,
            }}
          >
            <span style={UPPER}>国家/地区</span>
            <TickRow ticks={m.ticksS} />
            <TickRow ticks={m.ticksR} />
            <span style={{ ...UPPER, lineHeight: 1.3 }}>审查÷拒签</span>
          </div>

          {m.rows.map(r => (
            <div
              key={r.key}
              style={{
                display: 'grid',
                gridTemplateColumns: GRID_COLS,
                gap: '0 18px',
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
                {r.flag} {r.zh}
              </span>
              <Bar
                w={r.ws}
                value={r.vs}
                color='var(--series-6)'
                delay={r.delay}
              />
              <Bar
                w={r.wr}
                value={r.vr}
                color='var(--series-1)'
                delay={r.delay}
              />
              <span
                style={{
                  fontSize: 12.5,
                  textAlign: 'right',
                  fontVariantNumeric: 'tabular-nums',
                  whiteSpace: 'nowrap',
                  color: r.mColor,
                  fontWeight: Number(r.mWeight),
                }}
              >
                {r.m}
              </span>
            </div>
          ))}
        </div>
      </div>
    </ChartCard>
  );
}
