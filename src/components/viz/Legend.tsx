'use client';

export type LegendItem = {
  label: string;
  color: string;
};

/** A legend is present for every chart with ≥2 series (§8). */
export function Legend({ items }: { items: LegendItem[] }) {
  return (
    <div className='legend' role='list'>
      {items.map(it => (
        <span className='legend-item' role='listitem' key={it.label}>
          <span
            className='legend-swatch'
            style={{ background: it.color }}
            aria-hidden
          />
          {it.label}
        </span>
      ))}
    </div>
  );
}
