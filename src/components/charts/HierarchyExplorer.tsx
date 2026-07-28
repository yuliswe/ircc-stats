'use client';

/**
 * Chart 6 — Hierarchy explorer (treemap). Free exploration of the raw nested
 * structure category → activity_type → citizenship, sized by the active value
 * field (docs/ui-spec.md §6). Office depth is deliberately omitted from
 * `computeHierarchy` to keep the payload small, so the treemap bottoms out at
 * citizenship. Cells are colored by their top-dimension ancestor (the depth-1
 * category); depth is read from the nesting and rectangle size, not from new
 * hues. Clicking an internal rectangle zooms into that subtree and the
 * breadcrumb walks back out; clicking a citizenship leaf cross-filters (§7).
 *
 * This chart has no serious-mapping dependency, so it renders for both PR and
 * TRV without the VIT-severity note the composition/enrichment charts need.
 */
import { useEffect, useMemo, useState } from 'react';
import {
  hierarchy,
  treemap,
  type HierarchyRectangularNode,
} from 'd3-hierarchy';
import { useViz } from '@/lib/store';
import { computeHierarchy, type HierNode } from '@/lib/selectors';
import { sliceColor, INK } from '@/lib/palette';
import { fmtInt, fmtPct, withFlag } from '@/lib/format';
import { ChartCard } from '@/components/viz/ChartCard';
import { Legend } from '@/components/viz/Legend';
import { TooltipBox } from '@/components/viz/TooltipBox';
import type { Column } from '@/components/viz/TableView';

const W = 960;
const H = 520;
const CHAR_PX = 6; // rough advance width at the 11px label size, for truncation
const LINE = 11;

type RNode = HierarchyRectangularNode<HierNode>;

/** Truncate a label to the pixels available in a rectangle. */
function fit(label: string, widthPx: number): string {
  const max = Math.floor((widthPx - 6) / CHAR_PX);
  if (max <= 0) return '';
  return label.length <= max
    ? label
    : label.slice(0, Math.max(1, max - 1)) + '…';
}

export function HierarchyExplorer() {
  const { stream, valueField, topDim, theme, selection, select } = useViz();

  // House rule 8: gate anything client-only behind a mounted flag and reserve
  // the plot height so static-export hydration does not shift layout.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [collapsed, setCollapsed] = useState(false);
  // Focus is stored as the list of names below the root; resolving it against a
  // freshly built tree each render means a filter change that removes a branch
  // simply falls back to the deepest branch that still exists (or the root).
  const [focusNames, setFocusNames] = useState<string[]>([]);

  const ink = INK[theme];

  const rootData: HierNode = useMemo(
    () => computeHierarchy(stream, valueField, topDim),
    [stream, valueField, topDim]
  );

  const root = useMemo(
    () =>
      hierarchy<HierNode>(rootData, d => d.children)
        .sum(d => d.value ?? 0)
        .sort((a, b) => (b.value ?? 0) - (a.value ?? 0)),
    [rootData]
  );

  // Category → fixed categorical slot. Follows `topDimensionValues` order so the
  // hue tracks the entity, never its filtered rank (dataviz non-negotiable).
  const catIndex = useMemo(() => {
    const m = new Map<string, number>();
    stream.topDimensionValues.forEach((v, i) => m.set(v, i));
    let next = stream.topDimensionValues.length;
    for (const c of root.children ?? [])
      if (!m.has(c.data.name)) m.set(c.data.name, next++);
    return m;
  }, [root, stream.topDimensionValues]);

  const iso3ByCit = useMemo(() => {
    const m = new Map<string, string | null>();
    for (const c of stream.cityCells) if (!m.has(c.cit)) m.set(c.cit, c.iso3);
    return m;
  }, [stream.cityCells]);

  const colorFor = (n: RNode): string => {
    const cat = n.ancestors().find(a => a.depth === 1);
    return sliceColor(cat ? (catIndex.get(cat.data.name) ?? 0) : 0, theme);
  };

  const pathOf = (n: RNode): string =>
    n
      .ancestors()
      .reverse()
      .slice(1) // drop the root ("Immigration category" / "Application type")
      // leaf segments are citizenships, so prefix each with its flag
      .map(a =>
        a.children
          ? a.data.name
          : withFlag(a.data.name, iso3ByCit.get(a.data.name) ?? null)
      )
      .join(' › ');

  // Resolve focus, then lay out the treemap for that subtree only.
  const { focus, cells } = useMemo(() => {
    let node: RNode = root as RNode;
    for (const name of focusNames) {
      const next = node.children?.find(c => c.data.name === name) as
        | RNode
        | undefined;
      if (!next || !next.children) break;
      node = next;
    }
    if (!node.children) return { focus: node, cells: [] as RNode[] };
    treemap<HierNode>()
      .size([W, H])
      .paddingInner(2)
      .paddingOuter(3)
      .paddingTop(16)
      .round(true)(node);
    return {
      focus: node,
      cells: node.descendants().filter(d => d !== node) as RNode[],
    };
  }, [root, focusNames]);

  const [tip, setTip] = useState<{ node: RNode; x: number; y: number } | null>(
    null
  );

  // Table view (house rule 1): every leaf flattened, capped to keep it readable.
  const CAP = 200;
  const allLeaves = useMemo(
    () =>
      (root.leaves() as RNode[])
        .filter(l => (l.value ?? 0) > 0)
        .sort((a, b) => (b.value ?? 0) - (a.value ?? 0)),
    [root]
  );
  const capped = allLeaves.length > CAP;
  const tableColumns: Column[] = [
    { key: 'cat', label: 'Category' },
    { key: 'act', label: 'Activity' },
    { key: 'cit', label: 'Citizenship' },
    { key: 'val', label: 'Value', num: true },
  ];
  const tableRows = allLeaves.slice(0, CAP).map(l => {
    const anc = l.ancestors().reverse();
    return {
      cat: anc[1]?.data.name ?? '',
      act: anc[2]?.data.name ?? '',
      cit: withFlag(l.data.name, iso3ByCit.get(l.data.name) ?? null),
      val: fmtInt(l.value ?? 0),
    };
  });

  const legendItems = (root.children ?? []).map(c => ({
    label: c.data.name,
    color: sliceColor(catIndex.get(c.data.name) ?? 0, theme),
  }));

  const hasChildren = (root.children?.length ?? 0) > 0;
  const crumbs = focus.ancestors().reverse() as RNode[];

  const controls = (
    <button
      className='card-toggle'
      aria-pressed={!collapsed}
      onClick={() => setCollapsed(v => !v)}
    >
      {collapsed ? 'Expand plot' : 'Collapse plot'}
    </button>
  );

  const footnote = (
    <>
      Sized by {valueField === 'grand' ? 'grand total' : '2025'} screenings.
      Office depth is omitted to keep the payload small, so the tree bottoms out
      at citizenship.
      {capped
        ? ` Table shows the top ${CAP} of ${fmtInt(allLeaves.length)} leaves by value.`
        : ''}
    </>
  );

  let body: React.ReactNode;
  if (collapsed) {
    body = (
      <div className='chart-empty'>
        Plot collapsed — use the toggle to expand it.
      </div>
    );
  } else if (!mounted) {
    body = <div style={{ height: H }} />;
  } else if (!hasChildren) {
    body = (
      <div className='chart-empty'>No hierarchy for the current filters.</div>
    );
  } else {
    body = (
      <div style={{ minWidth: 0 }}>
        <nav
          aria-label='Breadcrumb'
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.25rem',
            alignItems: 'center',
            marginBottom: '0.5rem',
            fontSize: '0.78rem',
          }}
        >
          {crumbs.map((c, i) => {
            const isLast = i === crumbs.length - 1;
            const names = c
              .ancestors()
              .reverse()
              .slice(1)
              .map(a => a.data.name);
            return (
              <span
                key={i}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                {i > 0 && (
                  <span style={{ color: ink.muted }} aria-hidden>
                    ›
                  </span>
                )}
                <button
                  onClick={() => setFocusNames(names)}
                  disabled={isLast}
                  style={{
                    appearance: 'none',
                    border: 0,
                    background: 'none',
                    padding: 0,
                    cursor: isLast ? 'default' : 'pointer',
                    color: isLast ? ink.ink : ink.ink2,
                    fontWeight: isLast ? 650 : 400,
                    textDecoration: isLast ? 'none' : 'underline',
                    fontSize: '0.78rem',
                  }}
                >
                  {c.data.name}
                </button>
              </span>
            );
          })}
        </nav>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: '100%', height: 'auto', display: 'block' }}
          role='img'
          aria-label='Treemap of screening counts nested by category, activity type, and citizenship'
          onMouseLeave={() => setTip(null)}
        >
          {cells.map((n, i) => {
            const w = n.x1 - n.x0;
            const h = n.y1 - n.y0;
            if (w <= 0 || h <= 0) return null;
            const color = colorFor(n);
            const isLeaf = !n.children;
            const selected = isLeaf && selection?.cit === n.data.name;

            const onEnterMove = (e: React.MouseEvent) =>
              setTip({ node: n, x: e.clientX, y: e.clientY });
            const onClick = () => {
              if (isLeaf) {
                // leaves can't zoom; a citizenship click cross-filters (toggle)
                const cit = n.data.name;
                if (selection?.cit === cit) select(null);
                else select({ cit, iso3: iso3ByCit.get(cit) ?? null });
              } else {
                setFocusNames(
                  n
                    .ancestors()
                    .reverse()
                    .slice(1)
                    .map(a => a.data.name)
                );
                setTip(null);
              }
            };

            return (
              <g key={i}>
                <rect
                  className='viz-pop'
                  x={n.x0}
                  y={n.y0}
                  width={w}
                  height={h}
                  fill={isLeaf ? color : 'none'}
                  fillOpacity={isLeaf ? 0.92 : 1}
                  stroke={selected ? ink.ink : isLeaf ? ink.surface : color}
                  strokeOpacity={selected ? 1 : isLeaf ? 0.9 : 0.55}
                  strokeWidth={selected ? 2.5 : 1}
                  style={{ cursor: 'pointer', animationDelay: `${Math.min(i * 12, 600)}ms` }}
                  onMouseEnter={onEnterMove}
                  onMouseMove={onEnterMove}
                  onClick={onClick}
                  aria-label={`${pathOf(n)}: ${fmtInt(n.value ?? 0)}`}
                />
                {/* Internal nodes label their top strip; leaves label their body. */}
                {!isLeaf && w > 44 && (
                  <text
                    x={n.x0 + 4}
                    y={n.y0 + 12}
                    fontSize={LINE}
                    fontWeight={600}
                    fill={ink.ink2}
                    style={{ pointerEvents: 'none' }}
                  >
                    {fit(n.data.name, w)}
                  </text>
                )}
                {isLeaf && w > 42 && h > 16 && (
                  <text
                    x={n.x0 + 4}
                    y={n.y0 + 13}
                    fontSize={LINE}
                    fill={ink.ink}
                    style={{ pointerEvents: 'none' }}
                  >
                    {withFlag(
                      fit(n.data.name, w),
                      iso3ByCit.get(n.data.name) ?? null
                    )}
                    {h > 30 && (
                      <tspan x={n.x0 + 4} dy={LINE + 2} fill={ink.ink2}>
                        {fit(fmtInt(n.value ?? 0), w)}
                      </tspan>
                    )}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        {tip && (
          <TooltipBox
            title={pathOf(tip.node) || tip.node.data.name}
            rows={[
              { label: 'Value', value: fmtInt(tip.node.value ?? 0) },
              {
                label: '% of parent',
                value:
                  tip.node.parent && (tip.node.parent.value ?? 0) > 0
                    ? fmtPct(
                        (tip.node.value ?? 0) /
                          (tip.node.parent.value as number)
                      )
                    : '—',
              },
            ]}
            x={tip.x}
            y={tip.y}
          />
        )}
      </div>
    );
  }

  return (
    <ChartCard
      title='Hierarchy explorer'
      subtitle='Free exploration of the nested structure category → activity type → citizenship, sized by screening count. Click a group to zoom in, a citizenship to cross-filter; use the breadcrumb to zoom back out.'
      controls={controls}
      legend={
        !collapsed && hasChildren ? <Legend items={legendItems} /> : undefined
      }
      footnote={footnote}
      tableColumns={tableColumns}
      tableRows={tableRows}
    >
      {body}
    </ChartCard>
  );
}
