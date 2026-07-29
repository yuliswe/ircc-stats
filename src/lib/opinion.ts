/**
 * Pure computation for the IRCC opinion column (China vs India). No DOM, no
 * React. This is the TypeScript port of the design's `opinion-charts.js`; every
 * function returns presentation-ready values (formatted strings, CSS
 * percentages, animation delays) so the chart components only interpolate them.
 *
 * The column ships in both English and Chinese, so every selector takes a
 * `locale` and resolves nationality names, series labels and table headers
 * through it. The number formatting deliberately mirrors the design's own house
 * style (2 significant figures for small rates) rather than the app's
 * `@/lib/format`, so the figures match the published design to the digit.
 */
import type { VizData } from '@/lib/viz-types';
import { flagOf } from '@/lib/format';
import { localeName, type Locale } from '@/lib/i18n';

type Pair = { en: string; zh: string };
const L = (locale: Locale, p: Pair): string => p[locale];

// ── formatting (design house style) ─────────────────────────────────────────
export const fmtInt = (n: number): string =>
  Math.round(n).toLocaleString('en-US');

export function fmtCompact(v: number): string {
  if (v >= 1e6) return (v / 1e6).toFixed(2).replace(/\.?0+$/, '') + 'M';
  if (v >= 1e3) return Math.round(v / 1e3) + 'k';
  return fmtInt(v);
}

/** 2 significant digits, the report's house style for rates. */
export function fmtPct(x: number): string {
  const p = x * 100;
  if (p === 0) return '0%';
  if (p >= 10) return Math.round(p) + '%';
  if (p >= 1) return p.toFixed(1) + '%';
  if (p >= 0.1) return p.toFixed(2) + '%';
  return p.toFixed(3) + '%';
}

export const fmtPct1 = (x: number): string => (x * 100).toFixed(1) + '%';
export const fmtMult = (x: number): string => x.toFixed(1) + '×';
export const fmtX = (x: number): string =>
  (x >= 10 ? Math.round(x) : x.toFixed(1)) + '×';

/** Flag + localized name for a nationality, matching the design's `label`. */
export function label(
  iso3: string | null,
  cit: string,
  flags: boolean,
  locale: Locale
): { flag: string; zh: string } {
  return { flag: flags ? flagOf(iso3) : '', zh: localeName(cit, iso3, locale) };
}

// ── domain constants ────────────────────────────────────────────────────────
/** The three IRPA inadmissibility grounds behind every activity name in the file. */
const GROUND_OF: Record<string, string> = {
  'VIT 34': 's34',
  'Security Screening': 's34',
  'VIT 35': 's35',
  'HIRV Screening': 's35',
  'VIT 37': 's37',
  'Org Crime Screening': 's37',
};

const GROUND_DEFS = [
  {
    key: 's34',
    label: { en: 'Security (IRPA s.34)', zh: '安全（IRPA 第 34 条）' },
    color: 'var(--series-6)',
  },
  {
    key: 's35',
    label: { en: 'Human-rights violations (s.35)', zh: '侵犯人权（第 35 条）' },
    color: 'var(--series-3)',
  },
  {
    key: 's37',
    label: { en: 'Organized crime (s.37)', zh: '有组织犯罪（第 37 条）' },
    color: 'var(--series-4)',
  },
] as const;

const APPTYPE_DEFS = [
  {
    key: 'TRV',
    label: { en: 'Visitor visa', zh: '访客签证' },
    color: 'var(--series-1)',
  },
  {
    key: 'SP',
    label: { en: 'Study permit', zh: '学习许可' },
    color: 'var(--series-2)',
  },
  {
    key: 'WP',
    label: { en: 'Work permit', zh: '工作许可' },
    color: 'var(--series-5)',
  },
  {
    key: 'VR-EXT',
    label: { en: 'In-Canada extension', zh: '境内延期' },
    color: 'var(--ink-muted)',
  },
] as const;

const APPTYPE_OF: Record<string, string> = {
  TRV: 'TRV',
  SP: 'SP',
  'SP-EXT': 'SP',
  WP: 'WP',
  'WP-EXT': 'WP',
  'VR-EXT': 'VR-EXT',
};

/** Legend entries for the grounds chart, localized. */
export const groundLegend = (locale: Locale) =>
  [...GROUND_DEFS, ...APPTYPE_DEFS].map(d => ({
    label: L(locale, d.label),
    color: d.color,
  }));

// ── small helpers ───────────────────────────────────────────────────────────
const pctOf = (v: number, max: number): string =>
  (Math.max(0, v) / max) * 100 + '%';
const sum = <T>(a: readonly T[], f: (x: T) => number): number =>
  a.reduce((t, x) => t + f(x), 0);

/**
 * The subset of rate/count fields shared by a nationality profile and the
 * national totals, so the per-stream comparison can treat both uniformly.
 */
export type StreamRates = {
  rate: number;
  trvRate: number;
  prRate: number;
  referred: number;
  trvReferred: number;
  prReferred: number;
  applications: number;
  trvIntake: number;
  prIntake: number;
};

export type Totals = ReturnType<typeof totals>;
export type Profile = ReturnType<typeof profile>;

/** National denominators, computed from the file rather than hard-coded. */
export function totals(d: VizData) {
  const s = d.screeningApplications;
  const referred = sum(s, r => r.referred);
  const applications = sum(s, r => r.applications);
  const trvReferred = sum(s, r => r.trvReferred);
  const trvIntake = sum(s, r => r.trvIntake);
  const prReferred = sum(s, r => r.prReferred);
  const prIntake = sum(s, r => r.prIntake);
  return {
    referred,
    applications,
    rate: referred / applications,
    trvReferred,
    trvIntake,
    trvRate: trvReferred / trvIntake,
    prReferred,
    prIntake,
    prRate: prReferred / prIntake,
    approved: d.trApprovalTotal.approved,
    processed: d.trApprovalTotal.processed,
    approvalRate: d.trApprovalTotal.rate,
    nonApproval: d.trApprovalTotal.processed - d.trApprovalTotal.approved,
  };
}

/** A stream cell flattened out of both streams, tagged with its stream id. */
type TaggedCell = VizData['streams']['PR']['cityCells'][number] & {
  stream: 'PR' | 'TRV';
};

/** Flatten both streams' cityCells into one list tagged with its stream. */
export function streamCells(d: VizData): TaggedCell[] {
  const out: TaggedCell[] = [];
  for (const id of Object.keys(d.streams) as Array<'PR' | 'TRV'>) {
    for (const c of d.streams[id].cityCells) out.push({ ...c, stream: id });
  }
  return out;
}

/** Everything the column asserts about one nationality, in one object. */
export function profile(
  d: VizData,
  iso3: string,
  locale: Locale,
  cit?: string
) {
  const s = d.screeningApplications.find(
    r => r.iso3 === iso3 && (!cit || r.cit === cit)
  );
  const a = d.trApprovals.find(r => r.iso3 === iso3 && (!cit || r.cit === cit));
  const c = d.coprByCountry.find(r => r.iso3 === iso3);
  if (!s || !a) throw new Error(`opinion.profile: no data for ${iso3}`);
  const t = totals(d);
  const cells = streamCells(d).filter(x => x.iso3 === iso3);
  const byGround: Record<string, number> = {};
  const byType: Record<string, number> = {};
  const byCat: Record<string, number> = {};
  for (const x of cells) {
    const g = GROUND_OF[x.act];
    if (g) byGround[g] = (byGround[g] || 0) + x.t;
    if (x.stream === 'TRV') {
      const k = APPTYPE_OF[x.cat] || x.cat;
      byType[k] = (byType[k] || 0) + x.t;
    }
    if (x.stream === 'PR') byCat[x.cat] = (byCat[x.cat] || 0) + x.t;
  }
  return {
    iso3,
    ...label(iso3, s.cit, true, locale),
    referred: s.referred,
    applications: s.applications,
    rate: s.referred / s.applications,
    trvRate: s.trvReferred / s.trvIntake,
    prRate: s.prReferred / s.prIntake,
    trvReferred: s.trvReferred,
    prReferred: s.prReferred,
    prIntake: s.prIntake,
    trvIntake: s.trvIntake,
    approvalRate: a.rate,
    approved: a.approved,
    processed: a.processed,
    nonApproval: a.nonApproval,
    coprIssued: c ? c.coprIssued : null,
    screenShare: s.referred / t.referred,
    refusalShare: a.nonApproval / t.nonApproval,
    mismatch: s.referred / t.referred / (a.nonApproval / t.nonApproval),
    vsNational: s.referred / s.applications / t.rate,
    approvalsPerScreening: a.approved / s.referred,
    cumulative: sum(cells, x => x.g),
    byGround,
    byType,
    byCat,
  };
}

// ── shared table shapes ─────────────────────────────────────────────────────
export type TableColumn = { key: string; label: string; num?: boolean };
export type TableRow = Record<string, string>;
export type ChartTable = { columns: TableColumn[]; rows: TableRow[] };

// nationality flag+name pairs used in series/legends across charts
const CHINA: Pair = { en: '🇨🇳 China', zh: '🇨🇳 中国' };
const INDIA: Pair = { en: '🇮🇳 India', zh: '🇮🇳 印度' };
const NATIONAL: Pair = { en: 'National average', zh: '全国平均' };

// ── 01 — screening rate by stream: China, India, national mean ──────────────
export function streamCompare(
  a: Profile,
  b: Profile,
  t: Totals,
  locale: Locale
) {
  const groups: Array<{
    label: Pair;
    note: Pair;
    pick: (p: StreamRates) => number;
    num: (p: StreamRates) => number;
    den: (p: StreamRates) => number;
  }> = [
    {
      label: { en: 'All applications', zh: '全部申请' },
      note: {
        en: 'PR + study permits + temporary-residence visas',
        zh: '永久居民 + 学习许可 + 临时居民签证',
      },
      pick: p => p.rate,
      num: p => p.referred,
      den: p => p.applications,
    },
    {
      label: { en: 'Temporary-residence visas', zh: '临时居民签证' },
      note: { en: 'Visitor, study, work', zh: '访客、学习、工作签证' },
      pick: p => p.trvRate,
      num: p => p.trvReferred,
      den: p => p.trvIntake,
    },
    {
      label: { en: 'Permanent-residence applications', zh: '永久居民申请' },
      note: { en: 'Immigration applications', zh: '移民申请' },
      pick: p => p.prRate,
      num: p => p.prReferred,
      den: p => p.prIntake,
    },
  ];
  const series: Array<{ label: Pair; p: StreamRates; color: string }> = [
    { label: CHINA, p: a, color: 'var(--div-warm)' },
    { label: INDIA, p: b, color: 'var(--series-1)' },
    { label: NATIONAL, p: t, color: 'var(--ink-muted)' },
  ];
  const vsNat: Pair = { en: ' vs national', zh: '（对比全国）' };
  const max = Math.max(
    ...groups.map(g => Math.max(...series.map(s => g.pick(s.p))))
  );
  const axisMax = Math.ceil(max * 100) / 100;
  return {
    axisMax: fmtPct1(axisMax),
    ticks: [0, 1, 2, 3, 4].map(i => fmtPct1((axisMax / 4) * i)),
    groups: groups.map((g, gi) => ({
      key: g.label.en,
      zh: L(locale, g.label),
      note: L(locale, g.note),
      bars: series.map((s, i) => {
        const v = g.pick(s.p);
        return {
          key: g.label.en + s.label.en,
          zh: L(locale, s.label),
          color: s.color,
          w: pctOf(v, axisMax),
          delay: (gi * 3 + i) * 70 + 'ms',
          value: fmtPct(v),
          detail: fmtInt(g.num(s.p)) + ' / ' + fmtInt(g.den(s.p)),
          ratio: s.p === t ? '' : fmtX(v / g.pick(t)) + L(locale, vsNat),
        };
      }),
    })),
    table: {
      columns: [
        { key: 'g', label: L(locale, { en: 'Stream', zh: '申请类别' }) },
        { key: 's', label: L(locale, { en: 'Nationality', zh: '国籍' }) },
        {
          key: 'n',
          label: L(locale, { en: 'Referred', zh: '被送审' }),
          num: true,
        },
        {
          key: 'd',
          label: L(locale, { en: 'Applications', zh: '申请数' }),
          num: true,
        },
        {
          key: 'r',
          label: L(locale, { en: 'Screening rate', zh: '审查率' }),
          num: true,
        },
      ],
      rows: groups.flatMap(g =>
        series.map(s => ({
          g: L(locale, g.label),
          s: L(locale, s.label).replace(/^\S+\s/, ''),
          n: fmtInt(g.num(s.p)),
          d: fmtInt(g.den(s.p)),
          r: fmtPct(g.pick(s.p)),
        }))
      ),
    } satisfies ChartTable,
  };
}

// ── 02 — waffle: how many of every 100 PR applicants are pulled ─────────────
export function waffle(a: Profile, b: Profile, t: Totals, locale: Locale) {
  const items: Array<{ label: Pair; p: StreamRates; color: string }> = [
    { label: CHINA, p: a, color: 'var(--div-warm)' },
    { label: INDIA, p: b, color: 'var(--series-1)' },
    { label: NATIONAL, p: t, color: 'var(--ink-2)' },
  ];
  return {
    panels: items.map(it => {
      const pct = it.p.prRate * 100;
      const on = Math.max(1, Math.round(pct));
      return {
        key: it.label.en,
        zh: L(locale, it.label),
        value: fmtPct(it.p.prRate),
        oneIn: L(locale, {
          en: '≈ 1 in ' + Math.round(1 / it.p.prRate),
          zh: '约 1 / ' + Math.round(1 / it.p.prRate),
        }),
        cells: Array.from({ length: 100 }, (_, i) => ({
          key: it.label.en + i,
          bg: i < on ? it.color : 'var(--surface-3)',
          delay: (i % 20) * 14 + 'ms',
        })),
        detail: fmtInt(it.p.prReferred) + ' / ' + fmtInt(it.p.prIntake),
      };
    }),
    table: {
      columns: [
        { key: 'c', label: L(locale, { en: 'Nationality', zh: '国籍' }) },
        {
          key: 'r',
          label: L(locale, {
            en: 'PR applicants referred',
            zh: '被送审的永久居民申请人',
          }),
          num: true,
        },
        {
          key: 'i',
          label: L(locale, { en: 'PR applications', zh: '永久居民申请数' }),
          num: true,
        },
        {
          key: 'p',
          label: L(locale, { en: 'Referred per 100', zh: '每 100 人中被送审' }),
          num: true,
        },
      ],
      rows: items.map(it => ({
        c: L(locale, it.label).replace(/^\S+\s/, ''),
        r: fmtInt(it.p.prReferred),
        i: fmtInt(it.p.prIntake),
        p: (it.p.prRate * 100).toFixed(1) + L(locale, { en: '', zh: ' 人' }),
      })),
    } satisfies ChartTable,
  };
}

// ── 03 — which ground, and which application type ───────────────────────────
type GroundDef = { key: string; label: Pair; color: string };

function stack(
  obj: Record<string, number>,
  defs: readonly GroundDef[],
  locale: Locale
) {
  const tot = defs.reduce((s, d) => s + (obj[d.key] || 0), 0) || 1;
  let acc = 0;
  return {
    total: tot,
    segs: defs
      .filter(d => (obj[d.key] || 0) > 0)
      .map(d => {
        const v = obj[d.key] || 0;
        const seg = {
          key: d.key,
          zh: L(locale, d.label),
          color: d.color,
          w: pctOf(v, tot),
          left: pctOf(acc, tot),
          v: fmtInt(v),
          pct: fmtPct(v / tot),
          wide: v / tot > 0.14,
        };
        acc += v;
        return seg;
      }),
  };
}

export function grounds(a: Profile, b: Profile, locale: Locale) {
  const mk = (p: Profile) => ({
    key: p.iso3,
    zh: p.flag + ' ' + p.zh,
    ground: stack(p.byGround, GROUND_DEFS, locale),
    type: stack(p.byType, APPTYPE_DEFS, locale),
    lead: fmtPct((p.byGround.s34 || 0) / (p.referred || 1)),
  });
  const rows = [mk(a), mk(b)];
  return {
    rows,
    table: {
      columns: [
        { key: 'c', label: L(locale, { en: 'Nationality', zh: '国籍' }) },
        { key: 'g', label: L(locale, { en: 'Ground', zh: '审查依据' }) },
        {
          key: 'n',
          label: L(locale, { en: '2025 screenings', zh: '2025 年审查次数' }),
          num: true,
        },
        {
          key: 'p',
          label: L(locale, {
            en: "Share of country's screenings",
            zh: '占该国审查的比例',
          }),
          num: true,
        },
      ],
      rows: [a, b].flatMap(p =>
        GROUND_DEFS.map(g => ({
          c: p.zh,
          g: L(locale, g.label),
          n: fmtInt(p.byGround[g.key] || 0),
          p: fmtPct((p.byGround[g.key] || 0) / (p.referred || 1)),
        }))
      ),
    } satisfies ChartTable,
  };
}

// ── 04 — screening outcomes: how often a screening actually fails ────────────
/**
 * The per-country failure rate, joining the failed-results release to the
 * referral counts. A screening concludes ~a year after referral, so the honest
 * rate offsets the windows: the headline is the lag-1 rate (failures 2020–2025
 * over referrals 2019–2024), and each mark carries a whisker to the same-window
 * (naive) rate so the reader sees the range. Suppressed failure cells are floored
 * to zero, so every rate is a lower bound. Sorted by the lag-1 rate, China and
 * India highlighted, with the national mean marked.
 */
export function screeningOutcome(
  d: VizData,
  locale: Locale,
  opts: { minReferrals?: number; flags?: boolean; highlight?: string[] }
) {
  const {
    minReferrals = 3000,
    flags = true,
    highlight = ['CHN', 'IND'],
  } = opts;
  const naive = (r: { failuresAll: number; referralsCum: number }) =>
    r.referralsCum > 0 ? r.failuresAll / r.referralsCum : 0;
  const lag1 = (r: {
    failures2020to2025: number;
    referrals2019to2024: number;
  }) =>
    r.referrals2019to2024 > 0
      ? r.failures2020to2025 / r.referrals2019to2024
      : 0;

  const t = d.screeningOutcomeTotal;
  const natLag = lag1(t);

  const kept = d.screeningOutcomes
    .filter(r => r.referralsCum >= minReferrals)
    .map(r => ({ r, n: naive(r), l: lag1(r) }))
    .sort((a, b) => b.l - a.l);

  const maxHi = Math.max(...kept.map(k => Math.max(k.n, k.l)), natLag);
  // Whole-percent axis so the ticks read 0%, 1%, 2%… against the linear scale.
  const axisMax = Math.max(0.01, Math.ceil(maxHi * 100) / 100);
  const tickCount = Math.round(axisMax * 100);
  const naiveWord = L(locale, { en: 'same-window', zh: '同窗' });

  return {
    shown: kept.length,
    minLabel: fmtInt(minReferrals),
    natLag,
    natLagLabel: fmtPct(natLag),
    meanLeft: pctOf(natLag, axisMax),
    meanLabel:
      L(locale, { en: 'national avg ', zh: '全国均值 ' }) + fmtPct(natLag),
    ticks: Array.from({ length: tickCount + 1 }, (_, i) => `${i}%`),
    bars: kept.map((k, i) => {
      const lo = Math.min(k.n, k.l);
      const hi = Math.max(k.n, k.l);
      const isHi = highlight.includes(k.r.iso3);
      return {
        key: `${k.r.iso3}${i}`,
        ...label(k.r.iso3, k.r.cit, flags, locale),
        wLag: pctOf(k.l, axisMax),
        wLo: pctOf(lo, axisMax),
        wHi: pctOf(hi, axisMax),
        wSpan: pctOf(hi - lo, axisMax),
        value: fmtPct(k.l),
        naiveNote: naiveWord + ' ' + fmtPct(k.n),
        fill:
          k.r.iso3 === 'CHN'
            ? 'var(--div-warm)'
            : k.r.iso3 === 'IND'
              ? 'var(--series-1)'
              : 'var(--ink-muted)',
        delay: i * 22 + 'ms',
        strong: isHi,
        above: k.l >= natLag,
      };
    }),
    table: {
      columns: [
        { key: 'c', label: L(locale, { en: 'Country', zh: '国家/地区' }) },
        {
          key: 'ref',
          label: L(locale, {
            en: 'Screenings (2019–25)',
            zh: '审查数(2019–25)',
          }),
          num: true,
        },
        {
          key: 'f',
          label: L(locale, { en: 'Failed results', zh: '审查失败数' }),
          num: true,
        },
        {
          key: 'n',
          label: L(locale, { en: 'Rate (same-window)', zh: '失败率(同窗)' }),
          num: true,
        },
        {
          key: 'l',
          label: L(locale, { en: 'Rate (lag-1)', zh: '失败率(滞后一年)' }),
          num: true,
        },
      ],
      rows: [...d.screeningOutcomes]
        .sort((a, b) => b.referralsCum - a.referralsCum)
        .map(r => ({
          c: label(r.iso3, r.cit, false, locale).zh,
          ref: fmtInt(r.referralsCum),
          f: fmtInt(r.failuresAll),
          n: fmtPct(naive(r)),
          l: fmtPct(lag1(r)),
        })),
    } satisfies ChartTable,
  };
}

// ── 05 — screening rate against approval rate, log x ────────────────────────
const W = 900;
const H = 520;
const pctPos = (v: number, span: number): string =>
  ((v / span) * 100).toFixed(3) + '%';

function logScale(
  d0: number,
  d1: number,
  p0: number,
  p1: number
): (v: number) => number {
  const l0 = Math.log10(d0);
  const l1 = Math.log10(d1);
  return v => p0 + ((Math.log10(Math.max(v, d0)) - l0) / (l1 - l0)) * (p1 - p0);
}

export function outliers(
  d: VizData,
  locale: Locale,
  opts: { minProcessed?: number; flags?: boolean; highlight?: string[] }
) {
  const {
    minProcessed = 25000,
    flags = true,
    highlight = ['CHN', 'IND'],
  } = opts;
  const t = totals(d);
  const byIso = new Map(
    d.trApprovals.filter(r => r.processed >= minProcessed).map(r => [r.iso3, r])
  );
  const L0 = 66;
  const R = 24;
  const T = 22;
  const B = 52;
  const kept = d.screeningApplications.filter(
    r => r.referred > 0 && r.iso3 !== null && byIso.has(r.iso3)
  );
  const maxA = Math.max(...kept.map(r => r.applications), 1);
  const x = logScale(1e-4, 0.1, L0, W - R);
  const y = (v: number) => H - B - v * (H - T - B);
  const tipLabels = {
    screening: L(locale, { en: 'Screening rate', zh: '安全审查率' }),
    approval: L(locale, { en: 'TR approval rate', zh: '临时居民获批率' }),
    apps: L(locale, { en: 'Applications', zh: '申请数' }),
  };
  const pts = kept.map((r, i) => {
    const rate = r.referred / r.applications;
    const ap = byIso.get(r.iso3)!;
    const hi = r.iso3 !== null && highlight.includes(r.iso3);
    const lb = label(r.iso3, r.cit, flags, locale);
    return {
      key: `${r.iso3}${i}`,
      iso3: r.iso3,
      hi,
      cx: x(rate).toFixed(1),
      cy: y(ap.rate).toFixed(1),
      xp: pctPos(x(rate), W),
      yp: pctPos(y(ap.rate), H),
      r: (4 + 15 * Math.sqrt(r.applications / maxA)).toFixed(1),
      fill: hi ? 'var(--div-warm)' : 'var(--ink-muted)',
      stroke: hi ? 'var(--ink)' : 'none',
      opacity: hi ? '0.9' : '0.34',
      delay: (i % 30) * 16 + 'ms',
      name: (lb.flag ? lb.flag + ' ' : '') + lb.zh,
      zh: lb.zh,
      apps: r.applications,
      rows: [
        { label: tipLabels.screening, value: fmtPct(rate) },
        { label: tipLabels.approval, value: fmtPct1(ap.rate) },
        { label: tipLabels.apps, value: fmtInt(r.applications) },
      ],
    };
  });
  const labels = pts
    .filter(p => p.hi || p.apps >= 120000)
    .sort((a, b) => b.apps - a.apps)
    .slice(0, 10)
    .map(p => ({
      key: 'l' + p.key,
      zh: p.zh,
      xp: p.xp,
      yp: p.yp,
      weight: p.hi ? '700' : '500',
      color: p.hi ? 'var(--ink)' : 'var(--ink-muted)',
    }));
  return {
    points: pts,
    labels,
    shown: pts.length,
    minLabel: fmtInt(minProcessed),
    meanX: x(t.rate).toFixed(1),
    meanXp: pctPos(x(t.rate), W),
    meanY: y(t.approvalRate).toFixed(1),
    meanYp: pctPos(y(t.approvalRate), H),
    xTicks: [1e-4, 1e-3, 1e-2, 0.1].map(v => ({
      key: String(v),
      xp: pctPos(x(v), W),
      label: fmtPct(v),
    })),
    yTicks: [0, 0.25, 0.5, 0.75, 1].map(v => ({
      key: String(v),
      y: y(v).toFixed(1),
      yp: pctPos(y(v), H),
      label: Math.round(v * 100) + '%',
    })),
    table: {
      columns: [
        { key: 'c', label: L(locale, { en: 'Country', zh: '国家/地区' }) },
        {
          key: 's',
          label: L(locale, { en: 'Screening rate', zh: '安全审查率' }),
          num: true,
        },
        {
          key: 'a',
          label: L(locale, { en: 'Approval rate', zh: '获批率' }),
          num: true,
        },
        {
          key: 'n',
          label: L(locale, { en: 'Applications', zh: '申请数' }),
          num: true,
        },
      ],
      rows: [...pts]
        .sort((a, b) => b.apps - a.apps)
        .map(p => ({
          c: p.zh,
          s: p.rows[0].value,
          a: p.rows[1].value,
          n: p.rows[2].value,
        })),
    } satisfies ChartTable,
  };
}

// ── 06 — 2019–2025 cumulative screenings by nationality ─────────────────────
export function cumulative(
  d: VizData,
  locale: Locale,
  opts: { top?: number; flags?: boolean; highlight?: string[] }
) {
  const { top = 12, flags = true, highlight = ['CHN'] } = opts;
  const cells = streamCells(d);
  const agg = new Map<string, { g: number; t: number; cit: string }>();
  for (const c of cells) {
    if (!c.iso3) continue;
    const cur = agg.get(c.iso3) || { g: 0, t: 0, cit: c.cit };
    cur.g += c.g;
    cur.t += c.t;
    agg.set(c.iso3, cur);
  }
  const all = [...agg.entries()]
    .map(([iso3, v]) => ({ iso3, ...v }))
    .sort((a, b) => b.g - a.g);
  const kept = all.slice(0, top);
  const total = sum(all, r => r.g);
  const max = kept[0].g;
  return {
    total: fmtInt(total),
    shown: kept.length,
    countries: all.length,
    ticks: [0, 1, 2, 3].map(i => (i === 0 ? '0' : fmtCompact((max / 3) * i))),
    bars: kept.map((r, i) => ({
      key: r.iso3 + i,
      ...label(r.iso3, r.cit, flags, locale),
      w: pctOf(r.g, max),
      delay: i * 24 + 'ms',
      fill: highlight.includes(r.iso3) ? 'var(--div-warm)' : 'var(--series-1)',
      opacity: highlight.includes(r.iso3) ? '0.95' : '0.55',
      value: fmtInt(r.g),
      pct: fmtPct(r.g / total),
    })),
    table: {
      columns: [
        { key: 'c', label: L(locale, { en: 'Country', zh: '国家/地区' }) },
        {
          key: 'g',
          label: L(locale, {
            en: '2019–2025 screenings',
            zh: '2019–2025 审查次数',
          }),
          num: true,
        },
        {
          key: 't',
          label: L(locale, { en: 'of which 2025', zh: '其中 2025 年' }),
          num: true,
        },
        {
          key: 'p',
          label: L(locale, { en: 'Global share', zh: '占全球比例' }),
          num: true,
        },
      ],
      rows: all.map(r => ({
        c: label(r.iso3, r.cit, false, locale).zh,
        g: fmtInt(r.g),
        t: fmtInt(r.t),
        p: fmtPct(r.g / total),
      })),
    } satisfies ChartTable,
  };
}
