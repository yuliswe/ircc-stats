/**
 * Build step for the Bias Explorer (docs/ui-spec.md §3).
 *
 * Reads the single reconciled ATIP screening CSV (`1A-2025-08687.csv`, one row
 * per office-level leaf, with the TRV and PR streams distinguished by the
 * `source` column), derives each stream's citizenship-tier rollups by summing
 * its office leaves, resolves each citizenship to an ISO-3166 alpha-3 code
 * (tolerating the OCR noise in country names), and emits tidy JSON to
 * `src/data/generated/viz.json`. No CSV parsing ever happens in the browser.
 *
 * Run via `npm run build:data` (and automatically before `dev`/`build`).
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import Papa from 'papaparse';
import worldCountries from 'world-countries';
import type {
  CityCell,
  CoprRow,
  OfficeCell,
  ScreeningAppRow,
  ScreeningOutcomeRow,
  ScreeningOutcomeTotal,
  StreamData,
  StreamId,
  TrApprovalRow,
  TrApprovalTotal,
  VizData,
} from '../src/lib/viz-types.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const parsedDir = join(repoRoot, 'data', 'parsed', '1A-2025-08687');
const screeningsFile = join(parsedDir, '1A-2025-08687.csv');
const screeningAppsFile = join(
  repoRoot,
  'data',
  'derived',
  'screening_vs_applications_2025.csv'
);
const trApprovalFile = join(
  repoRoot,
  'data',
  'derived',
  'tr_approval_vs_applications_2025.csv'
);
const coprFile = join(
  repoRoot,
  'data',
  'derived',
  'pr_estimate_approval_vs_applications_2025.csv'
);
const outcomesFile = join(
  repoRoot,
  'data',
  'parsed',
  'OPP-DART-2025-34337',
  'unfavourable_by_nationality.csv'
);
const outFile = join(repoRoot, 'src', 'data', 'generated', 'viz.json');

interface StreamConfig {
  id: StreamId;
  /** `source` column value selecting this stream's rows from the combined CSV. */
  source: 'pr' | 'trv';
  topDimension: string;
  topDimensionLabel: string;
  routineType: string;
  seriousTypes: string[];
  seriousMappingKnown: boolean;
}

const STREAMS: StreamConfig[] = [
  {
    id: 'PR',
    source: 'pr',
    topDimension: 'immigration_category',
    topDimensionLabel: 'Immigration category',
    routineType: 'Security Screening',
    // §2: Org Crime + HIRV are the "serious" escalation types for PR.
    seriousTypes: ['Org Crime Screening', 'HIRV Screening'],
    seriousMappingKnown: true,
  },
  {
    id: 'TRV',
    source: 'trv',
    topDimension: 'application_type',
    topDimensionLabel: 'Application type',
    routineType: 'VIT 34',
    // §2: the VIT severity mapping is not knowable from the data. Left empty
    // until an analyst fills it in; charts show a "type mapping required" note.
    seriousTypes: [],
    seriousMappingKnown: false,
  },
];

// ── raw CSV row (1A-2025-08687.csv — office-level leaves, both streams) ───────────
interface RawRow {
  source: string; // 'pr' | 'trv'
  page: string;
  category: string; // immigration category (PR) or application type (TRV)
  activity_type: string;
  citizenship: string;
  office: string;
  level: string; // always 'office' in this table
  total_2025: string;
  total_2019_to_2025: string;
  fix_status: string; // 'MISSING_DATA_PLACEHOLDER' on synthetic reconciliation rows
  fix_note: string;
}

function num(v: string | undefined): number {
  if (v === undefined) return 0;
  const t = v.trim();
  if (t === '') return 0;
  const n = Number(t);
  return Number.isFinite(n) ? n : 0;
}

// ── citizenship → ISO3 resolution ───────────────────────────────────────────────
/** Levenshtein distance, capped early once it exceeds `max`. */
function editDistance(a: string, b: string, max: number): number {
  const al = a.length;
  const bl = b.length;
  if (Math.abs(al - bl) > max) return max + 1;
  let prev = Array.from({ length: bl + 1 }, (_, i) => i);
  for (let i = 1; i <= al; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= bl; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      cur[j] = v;
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[bl];
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z]+/g, ' ')
    .trim();

/**
 * Manual corrections for OCR manglings, renamed states, and non-standard names
 * the fuzzy matcher would otherwise miss or mis-hit. Keys are normalized
 * citizenship strings (see `norm`); the OCR here frequently reads "g" as "a"
 * or "q" (e.g. "Oatar", "Monaolia", "Honda Kong").
 */
const MANUAL_ISO3: Record<string, string> = {
  // common short / colloquial forms
  'south korea': 'KOR',
  korea: 'KOR',
  'north korea': 'PRK',
  russia: 'RUS',
  syria: 'SYR',
  iran: 'IRN',
  'united states': 'USA',
  usa: 'USA',
  uk: 'GBR',
  turkey: 'TUR',
  vietnam: 'VNM',
  'viet nam': 'VNM',
  laos: 'LAO',
  bolivia: 'BOL',
  venezuela: 'VEN',
  tanzania: 'TZA',
  moldova: 'MDA',
  'czech republic': 'CZE',
  'slovak republic': 'SVK',
  brunei: 'BRN',
  'cape verde': 'CPV',
  'cape verde islands': 'CPV',
  'ivory coast': 'CIV',
  'republic of ivory coast': 'CIV',
  swaziland: 'SWZ',
  'east timor': 'TLS',
  'east timor democratic republic of': 'TLS',
  palestinian: 'PSE',
  palestine: 'PSE',
  'palestinian authority': 'PSE',
  kosovo: 'UNK',
  'kosovo republic of': 'UNK',
  taiwan: 'TWN',
  macau: 'MAC',
  macao: 'MAC',
  'macao sar': 'MAC',
  'hong kong': 'HKG',
  'hong kong sar': 'HKG',
  'myanmar burma': 'MMR',
  burma: 'MMR',
  'saint kitts nevis': 'KNA',
  'st kitts nevis': 'KNA',
  'st lucia': 'LCA',
  'st vincent and the grenadines': 'VCT',
  'bahama islands the': 'BHS',
  'democratic republic of sudan': 'SDN',
  'south sudan republic of': 'SSD',
  // Congo: distinguish the two states by keyword before qualifier-stripping.
  'congo democratic republic of the': 'COD',
  'congo peoples republic of the': 'COG',
  congo: 'COG',
  // OCR "g"→"a"/"q" and similar breakages
  oatar: 'QAT',
  monaolia: 'MNG',
  'monaolia peoples republic of': 'MNG',
  montenearo: 'MNE',
  monteneqro: 'MNE',
  'trinidad and tobaao': 'TTO',
  'honda kong': 'HKG',
  'honda kong sar': 'HKG',
  todo: 'TGO',
  'united kinadom': 'GBR',
  'united kinadom and overseas territories': 'GBR',
  'united kingdom and overseas territories': 'GBR',
  'condo democratic republic of the': 'COD',
  'condo peoples republic of the': 'COG',
  // norm() turns the apostrophe in "People's" into a space, so the key must be
  // "people s" (not "peoples") to match; otherwise the bare "korea" head falls
  // through to KOR and North Korea collapses onto South Korea.
  'korea people s democratic republic of': 'PRK',
};

/**
 * Generate normalized candidate spellings for a raw citizenship, most specific
 * first, by taking the pre-comma/paren head and stripping "Republic of"-style
 * qualifiers and trailing "SAR"/"Islands" noise so word-order variants resolve.
 */
function candidatesFor(raw: string): string[] {
  const base = norm(raw);
  const set = new Set<string>();
  const add = (s: string) => {
    const v = s.replace(/\s+/g, ' ').trim();
    if (v.length >= 3) set.add(v);
  };
  add(base);
  // Split the RAW string on comma/paren (norm turns them into spaces), so the
  // country head of "Botswana, Republic of" survives as its own candidate.
  add(norm(raw.split(/[,(]/)[0]));
  if (base.startsWith('st ')) add('saint ' + base.slice(3));
  for (const c of [...set]) {
    let s = c
      .replace(
        /^(the )?(peoples? )?(federal )?(democratic )?republic of (the )?/,
        ''
      )
      .replace(/^(the )?(peoples? )?(federal )?(democratic )?republic of /, '');
    s = s
      .replace(/( democratic| peoples?| federal)? republic$/, '')
      .replace(/ sar$/, '')
      .replace(/ islands$/, '')
      .replace(/ and overseas territories$/, '')
      .replace(/ the$/, '');
    add(s);
  }
  return [...set].sort((a, b) => b.length - a.length);
}

interface IsoIndex {
  /** normalized name/alt → ISO3 */
  byName: Map<string, string>;
  /** ISO3 → display name */
  iso3ToName: Map<string, string>;
  /** ccn3 (numeric string) → ISO3 */
  ccn3ToIso3: Map<string, string>;
  /** candidate normalized names for fuzzy matching, paired with ISO3 */
  candidates: { name: string; iso3: string }[];
}

export function buildIsoIndex(): IsoIndex {
  const byName = new Map<string, string>();
  const iso3ToName = new Map<string, string>();
  const ccn3ToIso3 = new Map<string, string>();
  const candidates: { name: string; iso3: string }[] = [];

  for (const c of worldCountries as Array<{
    cca3: string;
    ccn3: string;
    name: { common: string; official: string };
    altSpellings: string[];
  }>) {
    const iso3 = c.cca3;
    iso3ToName.set(iso3, c.name.common);
    if (c.ccn3) ccn3ToIso3.set(String(Number(c.ccn3)), iso3);
    const names = new Set<string>([
      c.name.common,
      c.name.official,
      ...(c.altSpellings ?? []),
    ]);
    for (const n of names) {
      const k = norm(n);
      if (k.length < 2) continue;
      if (!byName.has(k)) byName.set(k, iso3);
      candidates.push({ name: k, iso3 });
    }
  }
  for (const [k, iso3] of Object.entries(MANUAL_ISO3)) byName.set(k, iso3);
  return { byName, iso3ToName, ccn3ToIso3, candidates };
}

export function resolveIso3(raw: string, idx: IsoIndex): string | null {
  const cands = candidatesFor(raw);
  if (!cands.length) return null;

  // 1. Exact match on any candidate spelling (manual map included).
  for (const c of cands) {
    const hit = idx.byName.get(c);
    if (hit) return hit;
  }

  // 2. Fuzzy: tolerate a couple of OCR substitutions, but require the first
  // letter to agree so short names do not collide (e.g. "Mali" vs "Mala…").
  let best: { iso3: string; d: number } | null = null;
  for (const c of cands) {
    const max = c.length >= 7 ? 2 : 1;
    for (const cand of idx.candidates) {
      if (cand.name[0] !== c[0]) continue;
      const d = editDistance(c, cand.name, max);
      if (d <= max && (best === null || d < best.d))
        best = { iso3: cand.iso3, d };
      if (best && best.d === 0) return best.iso3;
    }
  }
  return best ? best.iso3 : null;
}

// ── per-stream build ─────────────────────────────────────────────────────────────
function buildStream(
  cfg: StreamConfig,
  rows: RawRow[],
  idx: IsoIndex
): StreamData {
  const officeCells: OfficeCell[] = [];
  // The office table carries only leaf rows, so the citizenship tier is derived
  // by summing each (category, activity, citizenship) group's offices. The
  // release's reconciliation invariant (citizenship = Σ its offices) makes this
  // identical to the pre-computed rollups in aggregation.csv.
  const cityAgg = new Map<string, CityCell>();
  // Synthetic rows the release inserts for ATIP-withheld or non-footing cells.
  // They stay in the totals so each stream still foots to the published grand
  // total, but are counted per value field so the charts can footnote them.
  const placeholders = { grand: 0, total2025: 0 };
  const topDimValues = new Set<string>();
  const activitySet = new Set<string>();
  const offices = new Set<string>();
  const unmatched = new Set<string>();
  const isoCache = new Map<string, string | null>();

  const resolve = (cit: string): string | null => {
    if (!isoCache.has(cit)) isoCache.set(cit, resolveIso3(cit, idx));
    return isoCache.get(cit) ?? null;
  };

  for (const row of rows) {
    if (!row || row.source !== cfg.source || row.level !== 'office') continue;
    const cat = (row.category ?? '').trim();
    const cit = (row.citizenship ?? '').trim();
    const act = (row.activity_type ?? '').trim();
    const off = (row.office ?? '').trim();
    // A leaf missing any dimension is an unclassifiable residual; drop it rather
    // than carry a blank bucket into the composition, legend, or heatmap.
    if (!cat || !cit || !act || !off) continue;

    const g = num(row.total_2019_to_2025);
    const t = num(row.total_2025);
    if (g === 0 && t === 0) continue;

    if (row.fix_status === 'MISSING_DATA_PLACEHOLDER') {
      if (g !== 0) placeholders.grand++;
      if (t !== 0) placeholders.total2025++;
    }

    topDimValues.add(cat);
    activitySet.add(act);
    offices.add(off);
    officeCells.push({ cat, act, cit, off, g, t });

    const key = [cat, act, cit].join('\u0000');
    const agg = cityAgg.get(key);
    if (agg) {
      agg.g += g;
      agg.t += t;
    } else {
      const iso3 = resolve(cit);
      if (!iso3) unmatched.add(cit);
      cityAgg.set(key, { cat, act, cit, iso3, g, t });
    }
  }

  const cityCells = [...cityAgg.values()];

  // Order activity types with the routine type first, then serious, then rest.
  const rest = [...activitySet].filter(
    a => a !== cfg.routineType && !cfg.seriousTypes.includes(a)
  );
  const activityTypes = [
    ...(activitySet.has(cfg.routineType) ? [cfg.routineType] : []),
    ...cfg.seriousTypes.filter(a => activitySet.has(a)),
    ...rest.sort(),
  ];

  return {
    id: cfg.id,
    topDimension: cfg.topDimension,
    topDimensionLabel: cfg.topDimensionLabel,
    topDimensionValues: [...topDimValues].sort(),
    activityTypes,
    routineType: cfg.routineType,
    seriousTypes: cfg.seriousTypes,
    seriousMappingKnown: cfg.seriousMappingKnown,
    cityCells,
    officeCells,
    offices: [...offices].sort(),
    placeholders,
    unmatchedCitizenships: [...unmatched].sort(),
  };
}

// ── screening-vs-applications table (2025 referral-over-applications rate) ─────────
interface RawAppRow {
  citizenship: string;
  trv_subtotal: string;
  pr_subtotal: string;
  referred_any_type_2025_fullyear: string;
  pr_intake_2025_fullyear: string;
  sp_processed_2025_fullyear: string;
  trv_intake_2025_fullyear: string;
  total_applications_2025_fullyear: string;
}

// Non-country aggregate labels in the citizenship column; a rate over these is
// meaningless, so they never enter the chart.
const APP_AGGREGATE_LABELS = new Set([
  'Missing data',
  'Other',
  'Unspecified',
  'Stateless',
]);

export function buildScreeningApps(idx: IsoIndex): ScreeningAppRow[] {
  const text = readFileSync(screeningAppsFile, 'utf8');
  const { data } = Papa.parse<RawAppRow>(text, {
    header: true,
    skipEmptyLines: true,
  });

  const rows: ScreeningAppRow[] = [];
  for (const row of data) {
    const cit = (row.citizenship ?? '').trim();
    if (!cit || APP_AGGREGATE_LABELS.has(cit)) continue;
    const applications = num(row.total_applications_2025_fullyear);
    // The referral rate needs a denominator; drop rows with no 2025 applications.
    if (applications <= 0) continue;
    rows.push({
      cit,
      iso3: resolveIso3(cit, idx),
      referred: num(row.referred_any_type_2025_fullyear),
      applications,
      trvReferred: num(row.trv_subtotal),
      prReferred: num(row.pr_subtotal),
      prIntake: num(row.pr_intake_2025_fullyear),
      spProcessed: num(row.sp_processed_2025_fullyear),
      trvIntake: num(row.trv_intake_2025_fullyear),
    });
  }
  rows.sort(
    (a, b) => b.referred / b.applications - a.referred / a.applications
  );
  return rows;
}

// ── temporary-residence approval table (2025 approved-over-processed rate) ─────────
interface RawApprovalRow {
  country: string;
  tr_approved: string;
  tr_processed: string;
  tr_non_approval: string;
  tr_approval_rate: string;
  tr_non_approval_rate: string;
}

// A suppressed IRCC cell (a privacy hold on counts of 1–4) is published as an
// empty string, which must be told apart from a true 0; `num` collapses both to
// 0, so approved/processed are read through this null-preserving parse instead.
function numOrNull(v: string | undefined): number | null {
  if (v === undefined) return null;
  const t = v.trim();
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export function buildTrApprovals(idx: IsoIndex): {
  rows: TrApprovalRow[];
  total: TrApprovalTotal;
} {
  const text = readFileSync(trApprovalFile, 'utf8');
  const { data } = Papa.parse<RawApprovalRow>(text, {
    header: true,
    skipEmptyLines: true,
  });

  const rows: TrApprovalRow[] = [];
  let total: TrApprovalTotal | null = null;
  for (const row of data) {
    const cit = (row.country ?? '').trim();
    if (!cit) continue;
    const approved = numOrNull(row.tr_approved);
    const processed = numOrNull(row.tr_processed);
    // No computable rate when either count is suppressed or nothing was processed.
    if (approved === null || processed === null || processed <= 0) continue;
    const rate = approved / processed;

    if (cit === 'Total') {
      total = { approved, processed, rate };
      continue;
    }
    // "Other*" is IRCC's residual bucket with no country identity; drop it.
    if (cit === 'Other*') continue;

    rows.push({
      cit,
      iso3: resolveIso3(cit, idx),
      approved,
      processed,
      nonApproval: processed - approved,
      rate,
    });
  }
  if (!total) throw new Error(`No 'Total' aggregate row in ${trApprovalFile}`);
  rows.sort((a, b) => b.rate - a.rate);
  return { rows, total };
}

// ── permanent-residence CoPRs-issued table (2025 admissions per country) ───────────
interface RawCoprRow {
  country: string;
  pr_intake: string;
  copr_issued: string;
  copr_over_intake: string;
}

// Aggregate / non-country labels the choropleth cannot place on the map.
const COPR_AGGREGATE_LABELS = new Set(['Other*', 'Stateless']);

export function buildCoprByCountry(idx: IsoIndex): CoprRow[] {
  const text = readFileSync(coprFile, 'utf8');
  const { data } = Papa.parse<RawCoprRow>(text, {
    header: true,
    skipEmptyLines: true,
  });

  const rows: CoprRow[] = [];
  for (const row of data) {
    const cit = (row.country ?? '').trim();
    if (!cit || COPR_AGGREGATE_LABELS.has(cit)) continue;
    rows.push({
      cit,
      iso3: resolveIso3(cit, idx),
      prIntake: num(row.pr_intake),
      coprIssued: num(row.copr_issued),
    });
  }
  rows.sort((a, b) => b.coprIssued - a.coprIssued);
  return rows;
}

interface RawOutcomeRow {
  application_type: string;
  country: string;
  iso3: string;
  '2019': string;
  '2020': string;
  '2021': string;
  '2022': string;
  '2023': string;
  '2024': string;
  '2025_jan_jul': string;
}

const OUTCOME_YEARS = [
  '2019',
  '2020',
  '2021',
  '2022',
  '2023',
  '2024',
  '2025_jan_jul',
] as const;

// A suppressed failure cell is printed `--` (the underlying count is 1–4). We
// floor it to 0, so every failure figure is a lower bound; the article footnotes
// this. Empty strings are treated the same.
function outcomeCount(v: string | undefined): number {
  const s = (v ?? '').trim();
  return s === '--' || s === '' ? 0 : Number(s);
}

/**
 * Join the failed-results release (OPP-DART-2025-34337) to the referral counts in
 * the stream cells. A non-favourable result is stamped when the screening
 * concludes, roughly a year after referral, so we carry both a same-window (naive)
 * basis and a one-year lag-aligned basis (failures 2020–2025 over referrals
 * 2019–2024) and let the chart show the range. Referrals come from the cumulative
 * (`g`) and 2025 (`t`) cell counts, summed across both streams by ISO3.
 */
export function buildScreeningOutcomes(streams: Record<StreamId, StreamData>): {
  rows: ScreeningOutcomeRow[];
  total: ScreeningOutcomeTotal;
} {
  const refCum = new Map<string, number>();
  const ref2025 = new Map<string, number>();
  for (const s of Object.values(streams)) {
    for (const c of s.cityCells) {
      if (!c.iso3) continue;
      refCum.set(c.iso3, (refCum.get(c.iso3) ?? 0) + c.g);
      ref2025.set(c.iso3, (ref2025.get(c.iso3) ?? 0) + c.t);
    }
  }

  const { data } = Papa.parse<RawOutcomeRow>(
    readFileSync(outcomesFile, 'utf8'),
    {
      header: true,
      skipEmptyLines: true,
    }
  );

  // Sum PR + TR failures per ISO3, keeping the 2019 column apart so the
  // lag-aligned numerator (2020–2025) can drop it.
  const failAll = new Map<string, number>();
  const fail2019 = new Map<string, number>();
  const citOf = new Map<string, string>();
  for (const row of data) {
    const iso3 = (row.iso3 ?? '').trim();
    if (!iso3) continue; // section-total rows and Stateless carry no code
    const all = OUTCOME_YEARS.reduce((t, y) => t + outcomeCount(row[y]), 0);
    failAll.set(iso3, (failAll.get(iso3) ?? 0) + all);
    fail2019.set(iso3, (fail2019.get(iso3) ?? 0) + outcomeCount(row['2019']));
    if (!citOf.has(iso3)) citOf.set(iso3, (row.country ?? '').trim());
  }

  const rows: ScreeningOutcomeRow[] = [];
  for (const [iso3, all] of failAll) {
    const cum = refCum.get(iso3) ?? 0;
    if (cum <= 0) continue; // no denominator — cannot form a rate
    rows.push({
      cit: citOf.get(iso3) ?? iso3,
      iso3,
      referralsCum: cum,
      referrals2019to2024: cum - (ref2025.get(iso3) ?? 0),
      failuresAll: all,
      failures2020to2025: all - (fail2019.get(iso3) ?? 0),
    });
  }
  rows.sort((a, b) => b.referralsCum - a.referralsCum);

  // National baseline: referrals summed over every coded nationality, failures
  // over every coded failed-results row, so the mean matches the article's quoted
  // figures rather than only the intersection shown as bars.
  let cumT = 0;
  let r2025T = 0;
  for (const v of refCum.values()) cumT += v;
  for (const v of ref2025.values()) r2025T += v;
  let failAllT = 0;
  let fail2019T = 0;
  for (const v of failAll.values()) failAllT += v;
  for (const v of fail2019.values()) fail2019T += v;
  const total: ScreeningOutcomeTotal = {
    referralsCum: cumT,
    referrals2019to2024: cumT - r2025T,
    failuresAll: failAllT,
    failures2020to2025: failAllT - fail2019T,
  };
  return { rows, total };
}

// ── main ─────────────────────────────────────────────────────────────────────────
function main() {
  if (!existsSync(screeningsFile))
    throw new Error(`No screening CSV at ${screeningsFile}`);
  if (!existsSync(screeningAppsFile))
    throw new Error(`No screening/apps CSV at ${screeningAppsFile}`);
  if (!existsSync(trApprovalFile))
    throw new Error(`No TR-approval CSV at ${trApprovalFile}`);
  if (!existsSync(coprFile)) throw new Error(`No PR CoPR CSV at ${coprFile}`);
  if (!existsSync(outcomesFile))
    throw new Error(`No screening-outcomes CSV at ${outcomesFile}`);
  const idx = buildIsoIndex();
  const screeningApplications = buildScreeningApps(idx);
  const { rows: trApprovals, total: trApprovalTotal } = buildTrApprovals(idx);
  const coprByCountry = buildCoprByCountry(idx);

  // One reconciled CSV holds both streams; parse it once and split by `source`.
  const { data: screeningRows } = Papa.parse<RawRow>(
    readFileSync(screeningsFile, 'utf8'),
    {
      header: true,
      skipEmptyLines: true,
    }
  );
  const streams = {} as Record<StreamId, StreamData>;
  for (const cfg of STREAMS)
    streams[cfg.id] = buildStream(cfg, screeningRows, idx);

  // Screening outcomes need the referral counts from the streams above.
  const { rows: screeningOutcomes, total: screeningOutcomeTotal } =
    buildScreeningOutcomes(streams);

  // Emit only the ISO codes that actually appear, plus every code (for empty-state
  // tooltips the map may hover over): keep the full ccn3→iso3 join, but restrict
  // iso3ToName to a compact set of referenced + all codes is small enough to keep whole.
  const data: VizData = {
    meta: {
      atip: '1A-2025-08687',
      generatedFrom: [
        '1A-2025-08687.csv',
        'screening_vs_applications_2025.csv',
        'tr_approval_vs_applications_2025.csv',
        'pr_estimate_approval_vs_applications_2025.csv',
        'OPP-DART-2025-34337/unfavourable_by_nationality.csv',
      ],
      ccn3ToIso3: Object.fromEntries(idx.ccn3ToIso3),
      iso3ToName: Object.fromEntries(idx.iso3ToName),
    },
    streams,
    screeningApplications,
    trApprovals,
    trApprovalTotal,
    coprByCountry,
    screeningOutcomes,
    screeningOutcomeTotal,
  };

  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, JSON.stringify(data) + '\n', 'utf8');

  for (const s of Object.values(streams)) {
    console.log(
      `[${s.id}] ${s.cityCells.length} city cells, ${s.officeCells.length} office cells, ` +
        `${s.topDimensionValues.length} top-dim values, ${s.offices.length} offices, ` +
        `placeholders {grand:${s.placeholders.grand}, 2025:${s.placeholders.total2025}}, ` +
        `${s.unmatchedCitizenships.length} unmatched citizenships`
    );
  }
  console.log(
    `[apps] ${screeningApplications.length} nationalities with a 2025 application denominator, ` +
      `${screeningApplications.filter(r => r.iso3 === null).length} unmatched to ISO3`
  );
  console.log(
    `[approvals] ${trApprovals.length} nationalities with a 2025 TR approval rate ` +
      `(national avg ${(trApprovalTotal.rate * 100).toFixed(1)}%), ` +
      `${trApprovals.filter(r => r.iso3 === null).length} unmatched to ISO3`
  );
  console.log(
    `[copr] ${coprByCountry.length} countries with a 2025 CoPRs-issued figure, ` +
      `${coprByCountry.filter(r => r.iso3 === null).length} unmatched to ISO3`
  );
  const so = screeningOutcomeTotal;
  console.log(
    `[outcomes] ${screeningOutcomes.length} countries with a failure rate ` +
      `(national lag-1 ${((100 * so.failures2020to2025) / so.referrals2019to2024).toFixed(2)}%, ` +
      `naive ${((100 * so.failuresAll) / so.referralsCum).toFixed(2)}%, ` +
      `${so.failuresAll} failures / ${so.referralsCum} referrals)`
  );
  console.log(`Wrote ${outFile.replace(repoRoot + '/', '')}`);
}

// Run the full build only when invoked directly (`tsx build-viz-data.mts`); when
// imported, only the exported helpers above are used — see scripts that patch a
// single section into an existing viz.json without the per-stream source CSVs.
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main();
