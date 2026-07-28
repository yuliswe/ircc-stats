'use client';

/**
 * Chart 4 — Composition of total security-screening referrals by nationality.
 *
 * A donut of the 2025 `referred` totals from the screening-vs-applications table
 * (the same field the referral-rate chart divides by applications). This is the
 * *composition* of the referred population — what share of everyone sent to
 * security screening carried a given citizenship — not a per-nationality rate, so
 * it says nothing on its own about disproportionality (a large slice can just mean
 * a large applicant base). The rate chart is where that comparison lives.
 *
 * The referred counts are extremely concentrated (a handful of nationalities carry
 * most of the mass, with a long tail of 140-plus countries), so the palette's
 * eight categorical slots hold the eight largest nationalities in fixed order and
 * every remaining country folds into a single neutral "Other" slice. Slices are
 * never assigned a generated hue, and "Other" never borrows a categorical slot.
 *
 * Identity sits *around* the ring: every slice has an external callout (name +
 * share) joined to its arc by a leader line in the slice colour, laid out with a
 * per-side collision-avoidance pass so the small left-hand slices don't overlap.
 * Because country names are long, the svg uses a wide viewBox and scrolls
 * horizontally inside its own container on a narrow phone rather than shrinking
 * the text (the house mobile-first rule).
 */
import { useMemo, useState, type ReactNode } from 'react';
import { useViz } from '@/lib/store';
import { CATEGORICAL, INK } from '@/lib/palette';
import { fmtInt, fmtPct } from '@/lib/format';
import { flagName, pick } from '@/lib/i18n';
import { CHARTS, chartText } from '@/content/strings';
import { ChartCard } from '@/components/viz/ChartCard';
import { TooltipBox } from '@/components/viz/TooltipBox';
import type { Column } from '@/components/viz/TableView';

// All user-facing copy for this chart lives in `@/content/strings`
// (`CHARTS.referralComposition` for static labels, `chartText.referralComposition`
// for interpolated prose); this alias keeps the call sites terse.
const T = CHARTS.referralComposition;
const TX = chartText.referralComposition;

// The categorical palette has eight slots; the eight largest nationalities take
// them in fixed order and the remainder collapses into "Other". A ninth hue would
// have to be cycled or generated, which the palette rules forbid.
const TOP_N = 8;

// Logical viewBox; the svg scales to the card width (width:100%) and scrolls
// horizontally below MIN_SVG_PX so the callout text never shrinks illegibly.
const VBW = 840;
const VBH = 344;
const MIN_SVG_PX = 520;
const CX = VBW / 2;
const CY = VBH / 2;
const R_OUTER = 108;
const R_INNER = 64;
const ELBOW = 16; // radial stub before the leader line bends toward its column

// Callout columns and the vertical spacing the collision pass enforces. The wide
// viewBox leaves each column ~240px so full country names show without clipping.
const LABEL_COL = 150; // x-offset of the leader-line end from centre
const LABEL_PAD = 6; // gap between the leader-line end and the text
const ROW_GAP = 17;
const TOP_BOUND = 14;
const BOT_BOUND = VBH - 14;

interface Slice {
  cit: string;
  iso3: string | null;
  /** true for the aggregated tail slice, which cannot be cross-filtered. */
  isOther: boolean;
  referred: number;
  fraction: number;
  color: string;
  start: number; // degrees, clockwise from 12 o'clock
  end: number;
}

interface Label extends Slice {
  side: 'left' | 'right';
  ax: number; // anchor on the outer arc
  ay: number;
  ex: number; // radial elbow
  ey: number;
  lineEndX: number;
  textX: number;
  y: number; // resolved (de-collided) label y
}

interface Hover {
  slice: Slice;
  x: number;
  y: number;
}

/** Point on a circle of radius `r`, `deg` measured clockwise from 12 o'clock. */
function polar(r: number, deg: number): [number, number] {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [CX + r * Math.cos(rad), CY + r * Math.sin(rad)];
}

/** Donut-segment path between two radii and two angles. */
function arc(start: number, end: number): string {
  const [ox0, oy0] = polar(R_OUTER, start);
  const [ox1, oy1] = polar(R_OUTER, end);
  const [ix1, iy1] = polar(R_INNER, end);
  const [ix0, iy0] = polar(R_INNER, start);
  const large = end - start > 180 ? 1 : 0;
  return (
    `M${ox0},${oy0} A${R_OUTER},${R_OUTER} 0 ${large} 1 ${ox1},${oy1} ` +
    `L${ix1},${iy1} A${R_INNER},${R_INNER} 0 ${large} 0 ${ix0},${iy0} Z`
  );
}

/** Space `items` (already assigned an ideal `y`) apart by ≥ ROW_GAP within the bounds. */
function declutter(items: Label[]): void {
  if (!items.length) return;
  items.sort((a, b) => a.y - b.y);
  // push overlaps downward
  for (let i = 1; i < items.length; i++) {
    if (items[i].y - items[i - 1].y < ROW_GAP)
      items[i].y = items[i - 1].y + ROW_GAP;
  }
  // if the block overflows the bottom, shift it all up
  const overflow = items[items.length - 1].y - BOT_BOUND;
  if (overflow > 0) for (const it of items) it.y -= overflow;
  // if it now overflows the top, shift down and re-push (rare, small blocks)
  if (items[0].y < TOP_BOUND) {
    const d = TOP_BOUND - items[0].y;
    for (const it of items) it.y += d;
    for (let i = 1; i < items.length; i++) {
      if (items[i].y - items[i - 1].y < ROW_GAP)
        items[i].y = items[i - 1].y + ROW_GAP;
    }
  }
}

function truncate(s: string, max = 26): string {
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

export function ReferralCompositionPie() {
  const { data, theme, selection, select, locale } = useViz();
  const [hover, setHover] = useState<Hover | null>(null);

  const rows = data.screeningApplications;
  const cat = CATEGORICAL[theme];
  const ink = INK[theme];

  const { slices, labels, grand, otherCount, natCount } = useMemo(() => {
    const sorted = [...rows]
      .filter(r => r.referred > 0)
      .sort((a, b) => b.referred - a.referred);
    const total = sorted.reduce((s, r) => s + r.referred, 0);

    const head = sorted.slice(0, TOP_N);
    const tail = sorted.slice(TOP_N);
    const tailSum = tail.reduce((s, r) => s + r.referred, 0);

    const parts: Omit<Slice, 'fraction' | 'start' | 'end'>[] = head.map(
      (r, i) => ({
        cit: r.cit,
        iso3: r.iso3,
        isOther: false,
        referred: r.referred,
        color: cat[i],
      })
    );
    if (tailSum > 0)
      parts.push({
        cit: 'Other',
        iso3: null,
        isOther: true,
        referred: tailSum,
        color: ink.muted,
      });

    let angle = 0;
    const out: Slice[] = parts.map(p => {
      const fraction = total > 0 ? p.referred / total : 0;
      const start = angle;
      const end = angle + fraction * 360;
      angle = end;
      return { ...p, fraction, start, end };
    });

    // Build callouts and de-collide them within each side independently.
    const built: Label[] = out.map(s => {
      const mid = (s.start + s.end) / 2;
      const [ax, ay] = polar(R_OUTER, mid);
      const [ex, ey] = polar(R_OUTER + ELBOW, mid);
      const side: 'left' | 'right' = ex >= CX ? 'right' : 'left';
      const lineEndX = side === 'right' ? CX + LABEL_COL : CX - LABEL_COL;
      const textX =
        side === 'right' ? lineEndX + LABEL_PAD : lineEndX - LABEL_PAD;
      return { ...s, side, ax, ay, ex, ey, lineEndX, textX, y: ey };
    });
    declutter(built.filter(l => l.side === 'left'));
    declutter(built.filter(l => l.side === 'right'));

    return {
      slices: out,
      labels: built,
      grand: total,
      otherCount: tail.length,
      natCount: sorted.length,
    };
  }, [rows, cat, ink.muted]);

  const selectedCit = selection?.cit ?? null;
  const opacityFor = (s: Slice) =>
    selectedCit && s.cit !== selectedCit ? 0.25 : 1;

  const toggle = (s: Slice) => {
    if (s.isOther) return; // the aggregate has no single citizenship to filter on
    select(selectedCit === s.cit ? null : { cit: s.cit, iso3: s.iso3 });
  };
  const showTip = (slice: Slice, x: number, y: number) =>
    setHover({ slice, x, y });

  const interaction = (s: Slice) => ({
    role: s.isOther ? ('img' as const) : ('button' as const),
    tabIndex: s.isOther ? undefined : 0,
    'aria-label': TX.sliceAria(locale, {
      isOther: s.isOther,
      name: flagName(locale, s.cit, s.iso3),
      otherCount,
      referred: s.referred,
      fraction: s.fraction,
    }),
    style: {
      cursor: s.isOther ? 'default' : 'pointer',
      opacity: opacityFor(s),
      transition: 'opacity 120ms',
    } as const,
    onClick: () => toggle(s),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (!s.isOther && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        toggle(s);
      }
    },
    onMouseEnter: (e: React.MouseEvent) => showTip(s, e.clientX, e.clientY),
    onMouseMove: (e: React.MouseEvent) => showTip(s, e.clientX, e.clientY),
    onMouseLeave: () => setHover(null),
    onFocus: (e: React.FocusEvent<SVGGElement>) => {
      const box = e.currentTarget.getBoundingClientRect();
      showTip(s, box.left + box.width / 2, box.top);
    },
    onBlur: () => setHover(null),
  });

  const tableColumns: Column[] = [
    { key: 'cit', label: pick(locale, T.colCountry) },
    { key: 'referred', label: pick(locale, T.colReferred), num: true },
    { key: 'pct', label: pick(locale, T.colPct), num: true },
  ];
  const tableRows: Record<string, ReactNode>[] = [...rows]
    .filter(r => r.referred > 0)
    .sort((a, b) => b.referred - a.referred)
    .map(r => ({
      cit: flagName(locale, r.cit, r.iso3),
      referred: fmtInt(r.referred),
      pct: grand > 0 ? fmtPct(r.referred / grand) : '—',
    }));

  const subtitle = TX.subtitle(locale);

  const footnote = TX.footnote(locale, { grand, natCount, otherCount });

  if (grand === 0) {
    return (
      <ChartCard
        title={pick(locale, T.title)}
        subtitle={subtitle}
        tableColumns={tableColumns}
        tableRows={tableRows}
      >
        <div className='chart-empty'>{pick(locale, T.empty)}</div>
      </ChartCard>
    );
  }

  return (
    <ChartCard
      title={pick(locale, T.title)}
      subtitle={subtitle}
      footnote={footnote}
      tableColumns={tableColumns}
      tableRows={tableRows}
    >
      <div
        style={{
          width: '100%',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <svg
          viewBox={`0 0 ${VBW} ${VBH}`}
          width='100%'
          height='auto'
          // Cap the width at the viewBox width so the callout text renders at
          // roughly its font-unit size (no up-scaling on wide full-width cards).
          style={{
            display: 'block',
            width: '100%',
            minWidth: MIN_SVG_PX,
            maxWidth: VBW,
            margin: '0 auto',
          }}
          role='img'
          aria-label={pick(locale, T.svgAria)}
        >
          {/* arcs */}
          {slices.map((s, i) => (
            <g key={s.cit} {...interaction(s)}>
              {/* 2px surface stroke reveals the card between adjacent fills */}
              <path
                className='viz-pop'
                style={{ animationDelay: `${i * 18}ms` }}
                d={arc(s.start, s.end)}
                fill={s.color}
                stroke='var(--surface)'
                strokeWidth={2}
              />
            </g>
          ))}

          {/* leader lines + callouts */}
          {labels.map(l => (
            <g key={`lbl-${l.cit}`} {...interaction(l)}>
              {/* transparent hit strip so the whole callout row is a comfortable target */}
              <rect
                x={l.side === 'right' ? l.lineEndX : 0}
                y={l.y - 9}
                width={l.side === 'right' ? VBW - l.lineEndX : l.lineEndX}
                height={18}
                fill='transparent'
              />
              <polyline
                points={`${l.ax},${l.ay} ${l.ex},${l.ey} ${l.lineEndX},${l.y}`}
                fill='none'
                stroke={l.color}
                strokeWidth={1.4}
                strokeLinejoin='round'
                strokeLinecap='round'
                opacity={l.isOther ? 0.9 : 1}
              />
              <circle cx={l.lineEndX} cy={l.y} r={2.6} fill={l.color} />
              <text
                x={l.textX}
                y={l.y}
                textAnchor={l.side === 'right' ? 'start' : 'end'}
                dominantBaseline='central'
                fontSize={13}
              >
                <tspan
                  fill='var(--ink)'
                  fontWeight={selectedCit === l.cit ? 650 : 400}
                >
                  {l.isOther
                    ? TX.otherLabel(locale, { otherCount })
                    : flagName(locale, truncate(l.cit), l.iso3)}
                </tspan>
                <tspan fill='var(--ink-muted)' dx={6} className='tnum'>
                  {fmtPct(l.fraction, l.fraction < 0.1 ? 1 : 0)}
                </tspan>
              </text>
            </g>
          ))}

          {/* centre: grand total of referrals */}
          <text
            x={CX}
            y={CY - 7}
            textAnchor='middle'
            dominantBaseline='central'
            fontSize={18}
            fontWeight={700}
            fill='var(--ink)'
            className='tnum'
          >
            {fmtInt(grand)}
          </text>
          <text
            x={CX}
            y={CY + 11}
            textAnchor='middle'
            dominantBaseline='central'
            fontSize={9.5}
            fill='var(--ink-muted)'
          >
            {pick(locale, T.centreTotal)}
          </text>
        </svg>
      </div>

      {hover ? (
        <TooltipBox
          title={
            hover.slice.isOther
              ? TX.otherTipTitle(locale, { otherCount })
              : flagName(locale, hover.slice.cit, hover.slice.iso3)
          }
          x={hover.x}
          y={hover.y}
          rows={[
            {
              label: pick(locale, T.tipReferrals),
              value: fmtInt(hover.slice.referred),
            },
            {
              label: pick(locale, T.tipPct),
              value: fmtPct(hover.slice.fraction),
            },
          ]}
        />
      ) : null}
    </ChartCard>
  );
}
