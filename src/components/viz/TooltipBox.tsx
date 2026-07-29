'use client';

/**
 * Presentational hover tooltip shared by the custom SVG charts (heatmap, map,
 * scatter, treemap). The chart positions it; this just renders the box. Values
 * wear ink tokens, never a series color (§8).
 */
export type TipRow = {
  label: string;
  value: string;
};

export function TooltipBox({
  title,
  rows,
  x,
  y,
}: {
  title: string;
  rows: TipRow[];
  x: number;
  y: number;
}) {
  // Clamp within the viewport so a hover near the right/bottom edge (common on a
  // phone) can't push the tooltip off-screen or trigger page horizontal scroll.
  // `.viz-tooltip` is max-width 260px; mirror that here.
  const TIP_W = 260;
  const PAD = 8;
  const vw = typeof window !== 'undefined' ? window.innerWidth : TIP_W + x + 40;
  const vh = typeof window !== 'undefined' ? window.innerHeight : y + 200;
  const left = Math.max(PAD, Math.min(x + 14, vw - TIP_W - PAD));
  // Flip above the cursor when there isn't room below.
  const top = y + 14 > vh - 120 ? Math.max(PAD, y - 140) : y + 14;

  return (
    <div
      className='viz-tooltip'
      style={{
        position: 'fixed',
        left,
        top,
        zIndex: 70,
      }}
      role='tooltip'
    >
      <div className='t-title'>{title}</div>
      {rows.map(r => (
        <div className='t-row' key={r.label}>
          <span>{r.label}</span>
          <b>{r.value}</b>
        </div>
      ))}
    </div>
  );
}
