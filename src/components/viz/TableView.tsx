'use client';

export interface Column {
  key: string;
  label: string;
  /** right-align + tabular-nums for numeric columns */
  num?: boolean;
}

export function TableView({
  columns,
  rows,
}: {
  columns: Column[];
  rows: Record<string, React.ReactNode>[];
}) {
  if (!rows.length) {
    return <div className='chart-empty'>No rows for the current filters.</div>;
  }
  return (
    <div className='data-table-wrap'>
      <table className='data-table'>
        <thead>
          <tr>
            {columns.map(c => (
              <th key={c.key} className={c.num ? 'num' : undefined} scope='col'>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {columns.map(c => (
                <td key={c.key} className={c.num ? 'num' : undefined}>
                  {r[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
