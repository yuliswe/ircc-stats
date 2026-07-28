/**
 * Presentational scaffolding for the report layout. These are the editorial
 * furniture — masthead, headline figures, part dividers, numbered sections, and
 * the closing note — that turn the stack of charts into a guided argument. They
 * carry no state and read nothing from the store, so they stay server components
 * and the interactive charts remain the only client parts of the page.
 */
import type { ReactNode } from 'react';

export function Hero({
  eyebrow,
  title,
  dek,
  byline,
  children,
}: {
  eyebrow: ReactNode;
  title: ReactNode;
  dek: ReactNode;
  /** meta line / byline, shown alongside the standfirst */
  byline?: ReactNode;
  /** headline figures */
  children?: ReactNode;
}) {
  // Grid masthead: the headline holds the left column and the standfirst the
  // right; the byline then runs full width on its own rule below the grid, and
  // the headline figures span the full width beneath that. Collapses to a
  // single column on narrow screens.
  return (
    <header className='report-hero'>
      <span className='eyebrow'>{eyebrow}</span>
      <div className='hero-grid'>
        <h1 className='hero-title'>{title}</h1>
        <div className='hero-aside'>
          <p className='dek prose'>{dek}</p>
        </div>
      </div>
      {byline ? <p className='byline'>{byline}</p> : null}
      {children}
    </header>
  );
}

export function Stat({
  label,
  value,
  note,
}: {
  label: string;
  value: ReactNode;
  note: ReactNode;
}) {
  return (
    <div className='stat'>
      <dt>{label}</dt>
      <dd>
        {value}
        <span className='stat-note'>{note}</span>
      </dd>
    </div>
  );
}

export function Findings({ children }: { children: ReactNode }) {
  return <dl className='findings'>{children}</dl>;
}

export function Part({
  kicker,
  title,
  lede,
  variant = 'accent',
}: {
  kicker: string;
  title: ReactNode;
  lede: ReactNode;
  /** band tone — the accent band opens Part I, the dark band opens Part II */
  variant?: 'accent' | 'ink';
}) {
  // Full-width band with the kicker + title in one column and the lede in the
  // next, mirroring the mockup's part dividers. The band collapses to a single
  // column on narrow screens.
  return (
    <div className={`report-part report-part--${variant}`}>
      <div className='part-head'>
        <span className='part-kicker'>{kicker}</span>
        <h2 className='part-title'>{title}</h2>
      </div>
      <p className='part-lede prose'>{lede}</p>
    </div>
  );
}

export function Section({
  n,
  title,
  intro,
  children,
}: {
  n: number;
  title: ReactNode;
  /** framing commentary shown above the chart */
  intro: ReactNode;
  /** the chart, rendered untouched as the section's figure */
  children: ReactNode;
}) {
  const num = String(n).padStart(2, '0');
  // Two-column head sitting on a top rule: the numbered title leads the left
  // column and the framing commentary fills the right, then the chart figure
  // runs full width beneath. Collapses to a single column on narrow screens.
  return (
    <section className='report-section'>
      <div className='section-grid'>
        <div className='section-head'>
          <span className='section-num' aria-hidden>
            {num}
          </span>
          <h2>{title}</h2>
        </div>
        <div className='commentary prose'>{intro}</div>
      </div>
      <div className='figure'>{children}</div>
    </section>
  );
}
