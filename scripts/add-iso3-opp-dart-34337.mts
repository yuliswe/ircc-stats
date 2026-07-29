/**
 * One-off: add an `iso3` (ISO 3166-1 alpha-3) column to the three parsed CSVs
 * for OPP-DART-2025-34337, reusing the same name→ISO3 resolver the viz build
 * uses so codes stay consistent with the rest of the repo. Resolution runs off
 * the normalized `country` column (not the source-clipped `country_raw`). The
 * `iso3` column is inserted immediately after `country`. Rows that are not a
 * country (section totals, "Stateless", and the unresolved clipped name) get an
 * empty `iso3`.
 *
 * Run: npx tsx scripts/add-iso3-opp-dart-34337.mts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Papa from 'papaparse';
import { buildIsoIndex, resolveIso3 } from './build-viz-data.mts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(repoRoot, 'data', 'parsed', 'OPP-DART-2025-34337');

const idx = buildIsoIndex();

// Labels that are deliberately not countries and must never get a code.
const NON_COUNTRY = new Set(['Stateless']);

function isoFor(country: string): string {
  if (!country || NON_COUNTRY.has(country)) return '';
  if (country.endsWith('(all nationalities)')) return ''; // section-total rows
  const hit = resolveIso3(country, idx);
  return hit ?? '';
}

function patch(file: string, nameCol: string): void {
  const path = join(dir, file);
  const parsed = Papa.parse<Record<string, string>>(
    readFileSync(path, 'utf8'),
    {
      header: true,
      skipEmptyLines: true,
    }
  );
  const fields = parsed.meta.fields!;
  if (fields.includes('iso3')) {
    console.log(`${file}: already has iso3, skipping`);
    return;
  }
  // Insert iso3 right after the `country` column.
  const ci = fields.indexOf('country');
  const outFields = [
    ...fields.slice(0, ci + 1),
    'iso3',
    ...fields.slice(ci + 1),
  ];

  const unresolved = new Set<string>();
  const rows = parsed.data.map(r => {
    const iso3 = isoFor(r[nameCol]);
    if (
      !iso3 &&
      r[nameCol] &&
      !NON_COUNTRY.has(r[nameCol]) &&
      !r[nameCol].endsWith('(all nationalities)')
    ) {
      unresolved.add(r[nameCol]);
    }
    return { ...r, iso3 };
  });

  const csv = Papa.unparse(rows, { columns: outFields });
  writeFileSync(path, csv + '\n');
  const coded = rows.filter(r => r.iso3).length;
  console.log(
    `${file}: ${rows.length} rows, ${coded} coded, ` +
      `unresolved → ${unresolved.size ? [...unresolved].join('; ') : 'none'}`
  );
}

patch('unfavourable_pr.csv', 'country');
patch('unfavourable_tr.csv', 'country');
patch('unfavourable_by_nationality.csv', 'country');
