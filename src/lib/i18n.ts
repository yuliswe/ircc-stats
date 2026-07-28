/**
 * Bilingual (English / Simplified Chinese) support for the report. The site is a
 * single static page with a client-side language toggle (§ store.locale), so the
 * text for both languages ships in the bundle and every user-facing component
 * picks its language at render time from `useViz().locale`.
 *
 * Two kinds of strings live here:
 *   1. `localeName` / `flagName` — country and aggregate labels that come from the
 *      data as English, translated by ISO3 code (COUNTRY_ZH) with a fallback to the
 *      English name so an unmapped country still reads.
 *   2. `dataLabel` — the fixed data enums (immigration categories, application
 *      types) that appear in the global controls and legends.
 *
 * Editorial prose lives in `@/content/report`, and each chart keeps its own short
 * label dictionary colocated with the chart. The shared helper `pick` selects a
 * value for the active locale everywhere else.
 */
import { flagOf } from './format';
import { COUNTRY_ZH } from './country-zh';

export type Locale = 'en' | 'zh';
export const LOCALES: readonly Locale[] = ['en', 'zh'] as const;
export const DEFAULT_LOCALE: Locale = 'en';

/** Pick the value for the active locale from an `{ en, zh }` pair. */
export function pick<T>(locale: Locale, pair: { en: T; zh: T }): T {
  return pair[locale];
}

// Aggregate / non-country citizenship labels that carry no ISO3 in the data.
const AGGREGATE_ZH: Record<string, string> = {
  Other: '其他',
  Stateless: '无国籍',
  'Missing data': '数据缺失',
  Unspecified: '未指明',
  'Solomons, The': '所罗门群岛',
};

// Fixed data enums used by the global controls and some legends. Keyed by the
// exact English string that ships in viz.json.
const DATA_LABEL_ZH: Record<string, string> = {
  // stream top-dimension labels
  'Immigration category': '移民类别',
  'Application type': '申请类型',
  // PR immigration categories
  Economic: '经济类',
  'Family Class': '家庭类',
  'Humanitarian & Compassionate / Public Policy': '人道主义与同情 / 公共政策',
  'Permit Holders Class': '许可证持有人类',
  'Protected Persons': '受保护人士',
  // TRV application types
  SP: '学习许可',
  'SP-EXT': '学习许可（延期）',
  TRV: '临时居民签证',
  'VR-EXT': '访客记录（延期）',
  WP: '工作许可',
  'WP-EXT': '工作许可（延期）',
};

/**
 * A data enum value in the active locale, falling back to the English string when
 * no translation is on file. Safe to call with any string that ships from the
 * data.
 */
export function dataLabel(locale: Locale, en: string): string {
  if (locale === 'en') return en;
  return DATA_LABEL_ZH[en] ?? en;
}

/**
 * A country (or aggregate) name in the active locale. English names come straight
 * from the data; Chinese names resolve by ISO3 through COUNTRY_ZH, then by the
 * aggregate-label table, and finally fall back to the English name so nothing ever
 * renders blank.
 */
export function localeName(
  cit: string,
  iso3: string | null | undefined,
  locale: Locale
): string {
  if (locale === 'en') return cit;
  if (iso3 && COUNTRY_ZH[iso3]) return COUNTRY_ZH[iso3];
  return AGGREGATE_ZH[cit] ?? cit;
}

/**
 * A localized nation label prefixed with its flag emoji, e.g. "🇨🇳 中国". The
 * bilingual analogue of `withFlag` from `@/lib/format`; charts call this instead of
 * `withFlag` so their labels follow the active locale.
 */
export function flagName(
  locale: Locale,
  cit: string,
  iso3: string | null | undefined
): string {
  const flag = flagOf(iso3);
  const name = localeName(cit, iso3, locale);
  return flag ? `${flag} ${name}` : name;
}
