'use client';

/**
 * The self-contained card every chart lives in (§4): title, metric/caveat
 * subtitle, optional per-chart controls and legend, the plot, a "view as table"
 * toggle (an accessibility requirement — every chart has one), and the OCR
 * exclusion footnote. The table view is the relief for the sub-3:1 palette slots
 * and the CVD floor, so it is always available.
 */
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { TableView, type Column } from './TableView';
import { RevealContext } from '@/lib/reveal';
import { useViz } from '@/lib/store';
import { pick } from '@/lib/i18n';
import { CHART_CARD } from '@/content/strings';

type RevealState = 'armed' | 'in' | null;

interface ChartCardProps {
  title: string;
  subtitle: ReactNode;
  /** per-chart controls (sort, normalize, log/linear…) rendered in the head */
  controls?: ReactNode;
  legend?: ReactNode;
  footnote?: ReactNode;
  /** table-view equivalent of the plot */
  tableColumns: Column[];
  tableRows: Record<string, ReactNode>[];
  className?: string;
  children: ReactNode;
}

export function ChartCard({
  title,
  subtitle,
  controls,
  legend,
  footnote,
  tableColumns,
  tableRows,
  className,
  children,
}: ChartCardProps) {
  const { locale } = useViz();
  const [table, setTable] = useState(false);
  const headingId = useId();

  // `reveal` starts null so the server render and the first client render carry
  // no `data-reveal` attribute (marks render at rest, matching the SSR HTML and
  // keeping the charts visible without JS). After mount the observer arms the
  // card and flips it to `in` the first time it scrolls into view; a
  // reduced-motion reader is revealed immediately with no held start frame.
  const cardRef = useRef<HTMLElement>(null);
  const [reveal, setReveal] = useState<RevealState>(null);
  // Tracked so the reveal signal passed to Recharts charts (whose points the
  // library animates, not our CSS) stays false under reduced motion; the SVG
  // charts are handled by the prefers-reduced-motion block in globals.css.
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setReduce(true);
      setReveal('in');
      return;
    }

    setReveal('armed');
    const io = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setReveal('in');
            io.disconnect();
            break;
          }
        }
      },
      // Trigger a touch before the card is fully on screen so the entrance is
      // already underway as it settles into view.
      { rootMargin: '0px 0px -8% 0px', threshold: 0.01 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={cardRef}
      className={`card${className ? ' ' + className : ''}`}
      data-reveal={reveal ?? undefined}
      aria-labelledby={headingId}
    >
      <div className='card-head'>
        <h2 id={headingId}>{title}</h2>
        <span className='spacer' />
        {!table && controls}
        <button
          className='card-toggle'
          aria-pressed={table}
          onClick={() => setTable(v => !v)}
        >
          {table
            ? pick(locale, CHART_CARD.viewChart)
            : pick(locale, CHART_CARD.viewTable)}
        </button>
      </div>
      <p className='card-sub'>{subtitle}</p>
      {!table && legend}
      {table ? (
        <TableView columns={tableColumns} rows={tableRows} />
      ) : (
        <RevealContext.Provider value={reveal === 'in' && !reduce}>
          {children}
        </RevealContext.Provider>
      )}
      {footnote ? <div className='card-footnote'>{footnote}</div> : null}
    </section>
  );
}
