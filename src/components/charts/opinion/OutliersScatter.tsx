'use client';

/**
 * Opinion §6 — screening rate (log x) against temporary-residence approval rate,
 * bubble-sized by application volume, for the large source countries. Two dashed
 * mean lines split the frame into quadrants; China and India are warm-highlighted
 * and labelled. Hand-rolled SVG with an HTML tick/label overlay and a hover
 * tooltip, mirroring the report's scatter charts.
 */
import { useState } from 'react';
import { useViz } from '@/lib/store';
import { pick } from '@/lib/i18n';
import { ChartCard } from '@/components/viz/ChartCard';
import { Legend } from '@/components/viz/Legend';
import { TooltipBox } from '@/components/viz/TooltipBox';
import { outliers } from '@/lib/opinion';
import { OPINION_CHARTS } from '@/content/opinion';

type Point = ReturnType<typeof outliers>['points'][number];
type Hover = { p: Point; x: number; y: number };

export function OutliersScatter() {
  const { data, locale } = useViz();
  const T = OPINION_CHARTS.outliers;
  const o = outliers(data, locale, {});
  const [hover, setHover] = useState<Hover | null>(null);

  return (
    <ChartCard
      title={pick(locale, T.title)}
      subtitle={pick(locale, T.subtitle(o.minLabel, o.shown))}
      footnote={pick(locale, T.footnote)}
      legend={
        <Legend
          items={T.legend.map(l => ({
            label: pick(locale, l.label),
            color: l.color,
          }))}
        />
      }
      tableColumns={o.table.columns}
      tableRows={o.table.rows}
    >
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ position: 'relative', minWidth: 600 }}>
          <svg
            viewBox='0 0 900 520'
            style={{ width: '100%', height: 'auto', display: 'block' }}
            role='img'
            aria-label={pick(locale, T.title)}
            onMouseLeave={() => setHover(null)}
          >
            {o.yTicks.map(t => (
              <line
                key={t.key}
                x1={66}
                x2={876}
                y1={t.y}
                y2={t.y}
                stroke='var(--grid)'
                strokeWidth={1}
              />
            ))}
            <line
              x1={o.meanX}
              y1={22}
              x2={o.meanX}
              y2={468}
              stroke='var(--ink-muted)'
              strokeWidth={1.5}
              strokeDasharray='7 5'
            />
            <line
              x1={66}
              y1={o.meanY}
              x2={876}
              y2={o.meanY}
              stroke='var(--ink-muted)'
              strokeWidth={1.5}
              strokeDasharray='7 5'
            />
            {o.points.map(p => (
              <circle
                key={p.key}
                className='viz-pop'
                cx={p.cx}
                cy={p.cy}
                r={p.r}
                fill={p.fill}
                fillOpacity={p.opacity}
                stroke={p.stroke}
                strokeWidth={1.5}
                style={{ animationDelay: p.delay, cursor: 'crosshair' }}
                onMouseEnter={e => setHover({ p, x: e.clientX, y: e.clientY })}
                onMouseMove={e => setHover({ p, x: e.clientX, y: e.clientY })}
              />
            ))}
            <text
              x={471}
              y={512}
              textAnchor='middle'
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '.1em',
                fill: 'var(--ink-muted)',
              }}
            >
              SCREENING RATE (LOG)
            </text>
            <text
              x={16}
              y={250}
              textAnchor='middle'
              transform='rotate(-90 16 250)'
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '.1em',
                fill: 'var(--ink-muted)',
              }}
            >
              TR APPROVAL RATE
            </text>
          </svg>

          {o.yTicks.map(t => (
            <span
              key={t.key}
              style={{
                position: 'absolute',
                left: '2.6%',
                width: '4.1%',
                textAlign: 'right',
                top: t.yp,
                transform: 'translateY(-50%)',
                fontSize: 11,
                color: 'var(--ink-muted)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {t.label}
            </span>
          ))}
          {o.xTicks.map(t => (
            <span
              key={t.key}
              style={{
                position: 'absolute',
                left: t.xp,
                top: '90.5%',
                transform: 'translateX(-50%)',
                fontSize: 11,
                color: 'var(--ink-muted)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {t.label}
            </span>
          ))}
          {o.labels.map(l => (
            <span
              key={l.key}
              style={{
                position: 'absolute',
                left: l.xp,
                top: l.yp,
                transform: 'translate(10px,-160%)',
                fontSize: 12,
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                color: l.color,
                fontWeight: Number(l.weight),
              }}
            >
              {l.zh}
            </span>
          ))}
          <span
            style={{
              position: 'absolute',
              left: o.meanXp,
              top: '4%',
              transform: 'translateX(6px)',
              fontSize: 10.5,
              color: 'var(--ink-muted)',
              whiteSpace: 'nowrap',
            }}
          >
            {pick(locale, T.meanXLabel)}
          </span>
          <span
            style={{
              position: 'absolute',
              left: '8%',
              top: o.meanYp,
              transform: 'translateY(-140%)',
              fontSize: 10.5,
              color: 'var(--ink-muted)',
              whiteSpace: 'nowrap',
            }}
          >
            {pick(locale, T.meanYLabel)}
          </span>
        </div>
      </div>

      {hover ? (
        <TooltipBox
          title={hover.p.name}
          rows={hover.p.rows}
          x={hover.x}
          y={hover.y}
        />
      ) : null}
    </ChartCard>
  );
}
