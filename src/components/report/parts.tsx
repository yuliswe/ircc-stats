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
  children,
}: {
  eyebrow: ReactNode;
  title: ReactNode;
  dek: ReactNode;
  /** headline figures + byline */
  children?: ReactNode;
}) {
  return (
    <header className='report-hero'>
      <span className='eyebrow'>{eyebrow}</span>
      <h1 className='hero-title'>{title}</h1>
      <p className='dek prose'>{dek}</p>
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
}: {
  kicker: string;
  title: ReactNode;
  lede: ReactNode;
}) {
  return (
    <div className='report-part'>
      <span className='part-kicker'>{kicker}</span>
      <h2 className='part-title'>{title}</h2>
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
  return (
    <section className='report-section'>
      <div className='section-head'>
        <span className='section-num' aria-hidden>
          {num}
        </span>
        <h2>{title}</h2>
      </div>
      <div className='commentary prose'>{intro}</div>
      <div className='figure'>{children}</div>
    </section>
  );
}
