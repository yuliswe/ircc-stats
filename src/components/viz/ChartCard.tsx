'use client';

/**
 * The self-contained card every chart lives in (§4): title, metric/caveat
 * subtitle, optional per-chart controls and legend, the plot, a "view as table"
 * toggle (an accessibility requirement — every chart has one), and the OCR
 * exclusion footnote. The table view is the relief for the sub-3:1 palette slots
 * and the CVD floor, so it is always available.
 */
import { useId, useState, type ReactNode } from 'react';
import { TableView, type Column } from './TableView';

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
  const [table, setTable] = useState(false);
  const headingId = useId();

  return (
    <section
      className={`card${className ? ' ' + className : ''}`}
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
          {table ? 'View chart' : 'View as table'}
        </button>
      </div>
      <p className='card-sub'>{subtitle}</p>
      {!table && legend}
      {table ? <TableView columns={tableColumns} rows={tableRows} /> : children}
      {footnote ? <div className='card-footnote'>{footnote}</div> : null}
    </section>
  );
}
