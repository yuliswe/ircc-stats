'use client';

/**
 * Opinion §3 — for China and India, the legal ground each screening was opened
 * under (IRPA s.34 / s.35 / s.37), and, within the temporary-residence stream,
 * the application type it landed on. Two stacked proportion bars per nationality
 * with a per-segment breakdown beneath each.
 */
import { useViz } from '@/lib/store';
import { pick } from '@/lib/i18n';
import { ChartCard } from '@/components/viz/ChartCard';
import { Legend } from '@/components/viz/Legend';
import { profile, grounds, groundLegend } from '@/lib/opinion';
import { OPINION_CHARTS } from '@/content/opinion';

type Seg = {
  key: string;
  zh: string;
  color: string;
  w: string;
  pct: string;
  v: string;
};

const CAPTION: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '.12em',
  textTransform: 'uppercase',
  color: 'var(--ink-muted)',
};

function SegBar({ segs }: { segs: Seg[] }) {
  return (
    <div style={{ display: 'flex', height: 30, overflow: 'hidden' }}>
      {segs.map(s => (
        <div
          key={s.key}
          className='viz-grow-x'
          style={{
            height: 30,
            width: s.w,
            background: s.color,
            minWidth: 1,
          }}
        />
      ))}
    </div>
  );
}

function SegDetails({ segs, minCol }: { segs: Seg[]; minCol: number }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fit,minmax(${minCol}px,1fr))`,
        gap: 12,
        marginTop: 12,
      }}
    >
      {segs.map(s => (
        <div
          key={s.key}
          style={{ paddingTop: 8, borderTop: `3px solid ${s.color}` }}
        >
          <div
            style={{
              fontSize: 12,
              color: 'var(--ink-2)',
              lineHeight: 1.35,
              marginBottom: 4,
            }}
          >
            {s.zh}
          </div>
          <div
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'baseline',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <span
              style={{
                fontSize: 16,
                fontWeight: 800,
                letterSpacing: '-.02em',
                color: 'var(--ink)',
              }}
            >
              {s.pct}
            </span>
            <span style={{ fontSize: 11.5, color: 'var(--ink-muted)' }}>
              {s.v} 次
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function GroundsChart() {
  const { data, locale } = useViz();
  const T = OPINION_CHARTS.grounds;
  const g = grounds(
    profile(data, 'CHN', locale),
    profile(data, 'IND', locale),
    locale
  );

  return (
    <ChartCard
      title={pick(locale, T.title)}
      subtitle={pick(locale, T.subtitle)}
      footnote={pick(locale, T.footnote)}
      legend={<Legend items={groundLegend(locale)} />}
      tableColumns={g.table.columns}
      tableRows={g.table.rows}
    >
      {g.rows.map(r => (
        <div
          key={r.key}
          style={{
            marginBottom: 28,
            paddingBottom: 24,
            borderBottom: '1px solid var(--rule-soft)',
          }}
        >
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: 'var(--ink)',
              marginBottom: 14,
            }}
          >
            {r.zh}
          </div>
          <div style={{ ...CAPTION, marginBottom: 6 }}>按法律依据</div>
          <SegBar segs={r.ground.segs} />
          <SegDetails segs={r.ground.segs} minCol={170} />
          <div style={{ ...CAPTION, margin: '20px 0 6px' }}>
            临时居民审查落在哪类申请上
          </div>
          <SegBar segs={r.type.segs} />
          <SegDetails segs={r.type.segs} minCol={150} />
        </div>
      ))}
    </ChartCard>
  );
}
