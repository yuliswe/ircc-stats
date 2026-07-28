'use client';

/**
 * The single global control row (§5), sticky above the charts. Every control
 * writes into the shared store, so all charts react together. Color follows the
 * entity, not the filtered rank, so changing these never repaints survivors.
 */
import { useEffect, useRef, useState } from 'react';
import { useViz, type Metric } from '@/lib/store';
import type { StreamId, ValueField } from '@/lib/viz-types';

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  disabledOption,
}: {
  label: string;
  value: T;
  options: { value: T; label: string; disabled?: boolean }[];
  onChange: (v: T) => void;
  disabledOption?: (v: T) => string | undefined;
}) {
  return (
    <div className='control'>
      <label>{label}</label>
      <div className='segmented' role='group' aria-label={label}>
        {options.map(o => {
          const reason = o.disabled ? disabledOption?.(o.value) : undefined;
          return (
            <button
              key={o.value}
              aria-pressed={value === o.value}
              disabled={o.disabled}
              title={reason}
              onClick={() => onChange(o.value)}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TopDimCombo() {
  const { stream, topDim, setTopDim } = useViz();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const values = stream.topDimensionValues;
  const selected = topDim ?? [];
  const allOn = selected.length === 0;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const toggle = (v: string) => {
    const set = new Set(selected.length ? selected : values);
    if (set.has(v)) set.delete(v);
    else set.add(v);
    const next = [...set];
    setTopDim(next.length === 0 || next.length === values.length ? null : next);
  };

  const summary = allOn ? 'All' : `${selected.length} of ${values.length}`;

  return (
    <div className='control'>
      <label>{stream.topDimensionLabel}</label>
      <div className='combo' ref={ref}>
        <button
          className='btn combo-toggle'
          aria-haspopup='listbox'
          aria-expanded={open}
          onClick={() => setOpen(v => !v)}
        >
          <span>{summary}</span>
          <span aria-hidden>▾</span>
        </button>
        {open && (
          <div className='combo-menu' role='listbox' aria-multiselectable>
            <label>
              <input
                type='checkbox'
                checked={allOn}
                onChange={() => setTopDim(null)}
              />
              All
            </label>
            {values.map(v => (
              <label key={v}>
                <input
                  type='checkbox'
                  checked={allOn || selected.includes(v)}
                  onChange={() => toggle(v)}
                />
                {v}
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function ControlRow() {
  const {
    streamId,
    setStreamId,
    valueField,
    setValueField,
    minScreenings,
    setMinScreenings,
    metric,
    setMetric,
    stream,
  } = useViz();

  const seriousUnknown = !stream.seriousMappingKnown;

  return (
    <div
      className='controls'
      id='global-filters'
      role='region'
      aria-label='Global filters'
    >
      <Segmented<StreamId>
        label='Stream'
        value={streamId}
        onChange={setStreamId}
        options={[
          { value: 'PR', label: 'Permanent residence' },
          { value: 'TRV', label: 'Temporary residence' },
        ]}
      />
      <Segmented<ValueField>
        label='Time basis'
        value={valueField}
        onChange={setValueField}
        options={[
          { value: 'grand', label: 'Grand total' },
          { value: 'total2025', label: '2025 only' },
        ]}
      />
      <TopDimCombo />
      <div className='control'>
        <label>Min. screenings</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <input
            type='range'
            min={0}
            max={500}
            step={5}
            value={minScreenings}
            onChange={e => setMinScreenings(Number(e.target.value))}
            aria-label='Minimum screenings threshold'
          />
          <span className='slider-val'>{minScreenings}</span>
        </div>
      </div>
      <Segmented<Metric>
        label='Metric'
        value={metric}
        onChange={setMetric}
        options={[
          { value: 'seriousShare', label: 'Serious-share' },
          { value: 'enrichment', label: 'Enrichment' },
          { value: 'referralRate', label: 'Referral rate' },
        ].map(o => ({
          ...(o as { value: Metric; label: string }),
          disabled: seriousUnknown,
        }))}
        disabledOption={() =>
          seriousUnknown
            ? 'Requires the VIT severity mapping (not yet supplied)'
            : undefined
        }
      />
    </div>
  );
}
