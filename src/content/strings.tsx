/**
 * The single source of every user-facing string in the report, in English and
 * Simplified Chinese. Language lives in the route (`/` renders English, `/zh`
 * renders Chinese); components read their copy from here and never inline text,
 * so a translator can work in one file and both languages stay in lockstep.
 *
 * Three shapes appear here:
 *   1. `{ en, zh }` label pairs for static UI, selected at the call site with
 *      `pick(locale, …)` from `@/lib/i18n`.
 *   2. Prose *functions* `(locale, args) => ReactNode | string` for copy that
 *      interpolates runtime figures (rates, counts) or whose sentence structure
 *      differs between the two languages.
 *   3. `getReportContent`, the editorial prose for the page body (hero, part
 *      dividers, section intros, and footer).
 *
 * Country and data-enum labels are not here — those are keyed by code in
 * `@/lib/i18n` (`localeName`/`flagName`/`dataLabel`) because they come from the
 * data rather than being authored copy.
 */
import type { ReactNode } from 'react';
import { fmtInt, fmtPct, fmtRatio } from '@/lib/format';
import { flagName, pick, type Locale } from '@/lib/i18n';

type Pair<T = string> = { en: T; zh: T };

// ─────────────────────────────────────────────────────────────────────────────
// Shared chrome
// ─────────────────────────────────────────────────────────────────────────────

export const SHELL = {
  // Umbrella site wordmark in the masthead, above the Facts/Opinion nav. `brand`
  // stays the report's own page name, used in the report footer bar.
  wordmark: { en: 'IRCC data commentary', zh: 'IRCC 数据评论' },
  brand: { en: 'IRCC Report 2025', zh: 'IRCC 报告 2025' },
  // Section nav in the utility bar: the data report vs. the opinion column.
  navFacts: { en: 'Facts', zh: '事实' },
  navOpinion: { en: 'Opinion', zh: '观点' },
  navAria: { en: 'Sections', zh: '栏目导航' },
  toggleThemeAria: { en: 'Toggle color theme', zh: '切换配色主题' },
  // Word only; the glyph is rendered as a separate icon span so the word can
  // collapse on mobile while the icon remains.
  light: { en: 'Light', zh: '浅色' },
  dark: { en: 'Dark', zh: '深色' },
  toggleLangAria: { en: 'Switch language', zh: '切换语言' },
  // The label names the language you switch *to*: shown on the English page it
  // reads 中文, on the Chinese page it reads EN.
  langSwitchTo: { en: '中文', zh: 'EN' },
  focused: { en: 'Focused:', zh: '已聚焦：' },
  clearSelection: { en: 'Clear selection', zh: '清除选择' },
  viewSourceAria: { en: 'View source on GitHub', zh: '在 GitHub 查看源代码' },
} satisfies Record<string, Pair>;

export const CONTROLS = {
  regionAria: { en: 'Global filters', zh: '全局筛选' },
  stream: { en: 'Stream', zh: '类别' },
  pr: { en: 'Permanent residence', zh: '永久居民' },
  trv: { en: 'Temporary residence', zh: '临时居民' },
  timeBasis: { en: 'Time basis', zh: '时间口径' },
  grandTotal: { en: 'Grand total', zh: '累计总量' },
  only2025: { en: '2025 only', zh: '仅 2025 年' },
  minScreenings: { en: 'Min. security screenings', zh: '最少安全审查数' },
  minScreeningsAria: {
    en: 'Minimum security screenings threshold',
    zh: '最少安全审查数阈值',
  },
  metric: { en: 'Metric', zh: '指标' },
  seriousShare: { en: 'Serious-share', zh: '严重占比' },
  enrichment: { en: 'Enrichment', zh: '富集度' },
  referralRate: {
    en: 'Comprehensive security screening rate',
    zh: '全面安全审查率',
  },
  seriousUnknown: {
    en: 'Requires the VIT severity mapping (not yet supplied)',
    zh: '需要 VIT 严重程度映射（尚未提供）',
  },
  all: { en: 'All', zh: '全部' },
} satisfies Record<string, Pair>;

/** "N of M" selection summary for the top-dimension combo. */
export function controlsOfCount(
  locale: Locale,
  sel: number,
  total: number
): string {
  return locale === 'zh' ? `${total} 中选 ${sel}` : `${sel} of ${total}`;
}

export const CHART_CARD = {
  viewChart: { en: 'View chart', zh: '查看图表' },
  viewTable: { en: 'View as table', zh: '查看数据表' },
} satisfies Record<string, Pair>;

export const TABLE = {
  empty: {
    en: 'No rows for the current filters.',
    zh: '当前筛选条件下没有数据。',
  },
} satisfies Record<string, Pair>;

// ─────────────────────────────────────────────────────────────────────────────
// Charts — static labels
// ─────────────────────────────────────────────────────────────────────────────

export const CHARTS = {
  screeningRate: {
    title: {
      en: 'Comprehensive security screening rate — screenings ÷ applications, by nationality',
      zh: '全面安全审查率 — 审查次数/申请数量 按国籍分类',
    },
    colCountry: { en: 'Country', zh: '国家/地区' },
    colReferred: { en: 'Security screening', zh: '安全审查' },
    colApplications: { en: 'Applications', zh: '申请数' },
    colRate: { en: 'Screening rate', zh: '审查率' },
    colVsAvg: { en: 'vs. average', zh: '相对平均值' },
    legendBelow: { en: 'Below average', zh: '低于平均' },
    legendAvg: { en: 'National average', zh: '全国平均' },
    legendAbove: { en: 'Above average', zh: '高于平均' },
    minApps: { en: 'Min. applications', zh: '最少申请数' },
    avg: { en: 'avg', zh: '均值' },
    tipReferred: {
      en: 'Referred to comprehensive screening',
      zh: '转介接受全面安全审查',
    },
    tipApplications: { en: 'Total applications', zh: '申请总数' },
    tipRate: { en: 'Screening rate', zh: '审查率' },
    tipVsAvg: { en: 'vs. national average', zh: '相对全国平均' },
    svgAria: {
      en: 'Bar chart of comprehensive security screening rate over applications by citizenship',
      zh: '按国籍显示的全面安全审查率（相对申请量）条形图',
    },
    footnote: {
      en:
        'Applicants referred to CBSA/CSIS for comprehensive security screening are counted across every ' +
        'screening activity type (VIT 34/35/37, HIRV, Org Crime, or Security); applications count PR ' +
        'intake, study permits processed, and TRV intake for 2025.',
      zh:
        '被送往 CBSA/CSIS 接受全面安全审查的申请人，按每一种审查类型（VIT 34/35/37、HIRV、有组织犯罪或安全）分别统计；' +
        '“申请”指的是 2025 年收到的永久居民申请、已办结的学习许可，以及收到的临时居民签证申请。',
    },
  },
  referralComposition: {
    title: {
      en: 'Each nationality’s share of 2025 security screenings',
      zh: '2025 年各国籍占安全审查比重',
    },
    colCountry: { en: 'Country', zh: '国家/地区' },
    colReferred: { en: 'Security screening', zh: '安全审查' },
    colPct: { en: '% of total', zh: '占总数百分比' },
    tipReferrals: { en: 'Security screening', zh: '安全审查' },
    tipPct: { en: '% of total', zh: '占总数百分比' },
    centreTotal: { en: 'total screenings', zh: '审查总数' },
    empty: {
      en: 'No comprehensive security screening data available.',
      zh: '暂无全面安全审查数据。',
    },
    svgAria: {
      en: 'Donut chart of the composition of total 2025 comprehensive security screening referrals by nationality, with labelled callouts',
      zh: '按国籍显示的 2025 年全面安全审查转介总量构成的环形图，带标注引线',
    },
  },
  volumeCompare: {
    title: {
      en: 'Applications vs. referrals to comprehensive security screening',
      zh: '申请量与转介至全面安全审查的对比',
    },
    colCountry: { en: 'Country', zh: '国家/地区' },
    colApplications: { en: 'Applications', zh: '申请数' },
    colReferred: { en: 'Security screening', zh: '安全审查' },
    colPctReferred: { en: '% to screening', zh: '审查占比' },
    colPrIntake: { en: 'PR intake', zh: '永久居民收案' },
    colStudyPermits: { en: 'Study permits', zh: '学习许可' },
    colTrvIntake: { en: 'TRV intake', zh: '临时居民签证收案' },
    legendApplications: { en: 'Applications', zh: '申请数' },
    legendReferred: {
      en: 'Referred to comprehensive security screening',
      zh: '转介至全面安全审查',
    },
    panelApplications: { en: 'Applications', zh: '申请数' },
    panelReferredLine1: { en: 'Comprehensive security', zh: '全面安全审查' },
    panelReferredLine2: {
      en: 'screening count',
      zh: '数量',
    },
    tipApplications: { en: 'Applications', zh: '申请数' },
    tipReferred: {
      en: 'Referred to comprehensive screening',
      zh: '转介接受全面安全审查',
    },
    tipPctReferred: { en: '% to screening', zh: '审查占比' },
    svgAria: {
      en:
        'Grouped bar chart by citizenship: a left panel of applications and a right ' +
        'panel of applicants referred to comprehensive security screening, each an ' +
        'absolute count on its own linear scale',
      zh:
        '按国籍分组的条形图：左侧面板为申请量，右侧面板为被转介至全面安全审查的申请人，' +
        '两者各自采用独立的线性刻度显示绝对数量',
    },
    footnote: {
      en:
        'Applicants referred to CBSA/CSIS for comprehensive security screening are counted across all ' +
        'screening activity types (VIT 34/35/37, HIRV, Org Crime, Security); applications count PR ' +
        'intake and TRV intake. Study permits processed are ' +
        'shown for reference only and are not added into the application total, because TRV intake ' +
        'already includes study permit applicants. The two panels use independent linear scales, so a ' +
        'bar length in one panel is not comparable to a bar length in the other.',
      zh:
        '被送往 CBSA/CSIS 接受全面安全审查的申请人，按所有审查类型（VIT 34/35/37、HIRV、有组织犯罪、安全）统计；“申请”包括收到的永久居民申请' +
        '和临时居民签证申请。已办结的学习许可仅供参考，没有计入申请总数，因为临时居民签证申请里已经包含了留学申请人。' +
        '左右两个面板各用各的刻度，所以一个面板里条形的长度，不能直接拿去和另一个面板比长短。',
    },
  },
  screeningScatter: {
    title: {
      en: 'Applications vs. comprehensive security screenings — scatter',
      zh: '申请量与全面安全审查 — 散点图',
    },
    colCountry: { en: 'Country', zh: '国家/地区' },
    colApplications: { en: 'Applications', zh: '申请数' },
    colScreenings: { en: 'Security screenings', zh: '安全审查数' },
    colPctScreened: { en: '% to screening', zh: '审查占比' },
    legendBelow: { en: 'Below average', zh: '低于平均' },
    legendAbove: { en: 'Above average', zh: '高于平均' },
    empty: {
      en: 'No nationalities with a 2025 application count.',
      zh: '没有具备 2025 年申请量的国籍。',
    },
    xName: { en: 'Applications', zh: '申请数' },
    xAxisLabel: { en: 'Total applications (log)', zh: '申请总数（对数）' },
    yName: { en: 'Security screenings', zh: '安全审查数' },
    yAxisLabel: {
      en: 'Total comprehensive security screenings (log)',
      zh: '全面安全审查总数（对数）',
    },
    zName: { en: 'Applications', zh: '申请数' },
    tipApplications: { en: 'Applications', zh: '申请数' },
    tipScreenings: { en: 'Security screenings', zh: '安全审查数' },
    tipPctScreened: { en: '% to screening', zh: '审查占比' },
    footnote: {
      en:
        'Comprehensive security screenings count all screening activity types (VIT 34/35/37, HIRV, Org ' +
        'Crime, Security); applications count PR intake, study permits processed, and TRV intake. ' +
        'Countries with zero applications are omitted (no dot to place); a country with zero ' +
        'screenings is drawn at the axis floor because a log scale cannot plot zero.',
      zh:
        '全面安全审查统计所有审查类型（VIT 34/35/37、HIRV、有组织犯罪、安全）；“申请”包括收到的永久居民申请、' +
        '已办结的学习许可，以及收到的临时居民签证申请。没有任何申请的国家/地区已略去（没有点可画）；审查数为零的' +
        '国家/地区画在坐标轴最底部，因为对数刻度无法表示零。',
    },
  },
  choropleth: {
    title: { en: 'Nationals preferred by Canada', zh: '加拿大偏好的国民' },
    colCountry: { en: 'Country', zh: '国家/地区' },
    colIso3: { en: 'ISO3', zh: 'ISO3' },
    colCopr: { en: 'CoPRs issued', zh: '签发的永久居民确认文件' },
    colIntake: { en: 'PR intake', zh: '永久居民收案' },
    legendLeft: { en: '0 admitted', zh: '接纳 0 人' },
    legendMid: {
      en: 'fewer ← CoPRs issued → more',
      zh: '较少 ← 签发的永久居民确认 → 较多',
    },
    legendCaption: {
      en: 'CoPRs issued in 2025 (square-root scale)',
      zh: '2025 年签发的永久居民确认（平方根刻度）',
    },
    tipCopr: { en: 'CoPRs issued', zh: '签发的永久居民确认文件' },
    tipIntake: { en: 'PR intake', zh: '永久居民收案' },
    tipCoprData: { en: 'CoPR data', zh: '永久居民确认数据' },
    tipNone: { en: 'none', zh: '无' },
    svgAria: {
      en: 'World choropleth of the number of Confirmation-of-Permanent-Residence documents issued by country of origin in 2025',
      zh: '按来源国家/地区显示的 2025 年签发永久居民确认文件数量的世界分级统计地图',
    },
  },
  trApproval: {
    title: {
      en: 'Temporary-residence approval rate by nationality',
      zh: '按国籍划分的临时居民获批率',
    },
    colCountry: { en: 'Country', zh: '国家/地区' },
    colApproved: { en: 'Approved', zh: '获批数' },
    colProcessed: { en: 'Processed', zh: '已处理数' },
    colRate: { en: 'Approval rate', zh: '获批率' },
    colVsAvg: { en: 'vs. average', zh: '相对平均值' },
    legendBelow: { en: 'Below average', zh: '低于平均' },
    legendAvg: { en: 'National average', zh: '全国平均' },
    legendAbove: { en: 'Above average', zh: '高于平均' },
    minProcessed: { en: 'Min. processed applications', zh: '最少已处理申请数' },
    avg: { en: 'avg', zh: '均值' },
    tipApproved: { en: 'Approved', zh: '获批数' },
    tipProcessed: { en: 'Processed', zh: '已处理数' },
    tipNotApproved: { en: 'Not approved', zh: '未获批' },
    tipRate: { en: 'Approval rate', zh: '获批率' },
    tipVsAvg: { en: 'vs. national average', zh: '相对全国平均' },
    svgAria: {
      en: 'Bar chart of temporary-residence approval rate by citizenship',
      zh: '按国籍显示的临时居民获批率条形图',
    },
    footnote: {
      en:
        'Approved and processed are IRCC’s own published 2025 annual totals (each rounded to the ' +
        'nearest 5); the rate is approved ÷ processed. Rows whose approved or processed count IRCC ' +
        'suppressed to protect privacy carry no rate and are omitted, as are the "Other*" residual ' +
        'bucket and any nationality with no ISO match (Solomon Islands, Stateless).',
      zh:
        '获批数与已处理数，都是 IRCC 自行公布的 2025 年全年合计（各自四舍五入到最接近的 5）；获批率等于获批数 ÷ 已处理数。' +
        '凡是 IRCC 为保护隐私而隐去了获批数或已处理数的行，因无法计算比率而被略去；同样被略去的还有 “Other*” 这个归并的剩余类别，' +
        '以及找不到 ISO 国家代码的国籍（所罗门群岛、无国籍）。',
    },
  },
  approvalVsScreening: {
    title: {
      en: 'Approval rate vs. comprehensive security screening rate — scatter',
      zh: '获批率与全面安全审查率对比 — 散点图',
    },
    colCountry: { en: 'Country', zh: '国家/地区' },
    colApplications: { en: 'Applications', zh: '申请数' },
    colScrRate: { en: 'Screening rate', zh: '审查率' },
    colApprRate: { en: 'Approval rate', zh: '获批率' },
    colRatio: { en: 'Approval ÷ screening', zh: '获批率 ÷ 审查率' },
    minApps: { en: 'Min. applications', zh: '最少申请数' },
    legendLow: {
      en: 'Screened nearly as often as approved (low ratio)',
      zh: '被审查的频率几乎与获批相当（低比值）',
    },
    legendHigh: {
      en: 'Approved far more often than screened (high ratio)',
      zh: '获批频率远高于被审查（高比值）',
    },
    axisScreeningName: { en: 'Screening rate', zh: '审查率' },
    axisApprovalName: { en: 'Approval rate', zh: '获批率' },
    axisScreeningTitle: {
      en: 'Comprehensive security screening rate (log)',
      zh: '全面安全审查率（对数）',
    },
    axisApprovalTitle: { en: 'TR approval rate', zh: '临时居民获批率' },
    zAxisName: { en: 'Applications', zh: '申请数' },
    tipApplications: { en: 'Applications', zh: '申请数' },
    tipScrRate: { en: 'Screening rate', zh: '审查率' },
    tipApprRate: { en: 'Approval rate', zh: '获批率' },
    tipRatio: { en: 'Approval ÷ screening', zh: '获批率 ÷ 审查率' },
    tipVsNational: { en: 'vs. national ratio', zh: '相对全国比值' },
    footnote: {
      en:
        'The comprehensive security screening rate is 2025 comprehensive security screening referrals ' +
        '(all screening activity types) over 2025 applications (PR intake, study permits processed, ' +
        'and TRV intake); the approval rate is IRCC’s own 2025 approved over processed ' +
        'temporary-residence total. A country appears only when it carries both rates, so ' +
        'nationalities with zero comprehensive security screening referrals (no defined rate to plot ' +
        'on a log axis) or with a suppressed approval count are omitted.',
      zh:
        '安全审查率等于 2025 年的安全审查次数（全部审查类型）除以 2025 年的申请数（收到的永久居民申请、已办结的学习许可、收到的临时居民签证申请）；' +
        '获批率用的是 IRCC 自己公布的 2025 年临时居民获批数除以已处理数。只有同时具备这两项比率的国家/地区才会出现，' +
        '因此安全审查次数为零（在对数轴上无法定位）或获批数被隐去的国籍会被略去。',
    },
  },
} satisfies Record<string, Record<string, Pair>>;

// ─────────────────────────────────────────────────────────────────────────────
// Charts — interpolated prose (runtime figures / language-specific structure)
// ─────────────────────────────────────────────────────────────────────────────

export const chartText = {
  screeningRate: {
    subtitle: (
      locale: Locale,
      a: { globalRate: number; minApps: number; hidden: number }
    ): ReactNode =>
      locale === 'zh' ? (
        <>
          一个国家 2025 年的移民申请中，有多大比例被送去接受<b>任何一种</b>
          全面安全审查。虚线是全国平均值 <b>{fmtPct(a.globalRate, 2)}</b>
          ；暖色条形表示这个国家的申请人比平均水平更常被审查，冷色则更少。申请数不足{' '}
          {fmtInt(a.minApps)} 的国家已隐去
          {a.hidden > 0 ? `（共 ${fmtInt(a.hidden)} 个）` : ''}。
        </>
      ) : (
        <>
          Share of a nationality&rsquo;s 2025 immigration applications that were
          referred to CBSA/CSIS for <b>any</b> comprehensive security screening.
          The dashed line is the national average of{' '}
          <b>{fmtPct(a.globalRate, 2)}</b>; warm bars are referred for
          comprehensive screening more often than the average applicant, cool
          bars less. Nationalities with fewer than {fmtInt(a.minApps)}{' '}
          applications are hidden{' '}
          {a.hidden > 0 ? `(${fmtInt(a.hidden)} excluded)` : ''}.
        </>
      ),
    empty: (locale: Locale, a: { minApps: number }): string =>
      locale === 'zh'
        ? `没有国籍达到 ${fmtInt(a.minApps)} 份申请的下限。`
        : `No nationalities meet the ${fmtInt(a.minApps)}-application minimum.`,
    collapse: (
      locale: Locale,
      a: { expanded: boolean; topN: number; total: number }
    ): string =>
      a.expanded
        ? pick(locale, {
            en: `Show top ${a.topN}`,
            zh: `显示前 ${a.topN} 名`,
          })
        : pick(locale, {
            en: `Show all (${a.total})`,
            zh: `显示全部（${a.total}）`,
          }),
    rowAria: (
      locale: Locale,
      a: {
        name: string;
        rate: number;
        referred: number;
        applications: number;
      }
    ): string =>
      locale === 'zh'
        ? `${a.name}：全面安全审查率 ${fmtPct(a.rate, 2)}，${fmtInt(a.referred)} / ${fmtInt(a.applications)} 份申请`
        : `${a.name}: ${fmtPct(a.rate, 2)} comprehensive security screening rate, ${fmtInt(a.referred)} of ${fmtInt(a.applications)} applications`,
  },
  referralComposition: {
    subtitle: (locale: Locale): ReactNode =>
      locale === 'zh' ? (
        <>
          每一块扇形，代表一个国家占 2025 年<b>全部</b>
          安全审查的多大比例。它展示的是被审查人群的<b>构成</b>
          &mdash;&mdash;也就是被审查的都是些什么人，而不是某个国家的申请人有多容易被审查&mdash;&mdash;所以一块扇形大，可能只是因为这个国家申请人本来就多。想知道每位申请人被审查的可能性有多大，请看上面的安全审查率那张图。
        </>
      ) : (
        <>
          Each slice is one nationality&rsquo;s share of <b>all</b> 2025
          comprehensive security screening referrals. This is the composition of
          the comprehensively screened population &mdash; who was referred for
          comprehensive security screening, not how often a nationality is
          referred for it &mdash; so a large slice can simply reflect a large
          applicant base. For the per-applicant chance of a comprehensive
          security screening referral, see the comprehensive security screening
          rate chart.
        </>
      ),
    footnote: (
      locale: Locale,
      a: { grand: number; natCount: number; otherCount: number }
    ): ReactNode =>
      locale === 'zh' ? (
        <>
          安全审查次数，统计的是 2025
          年被送去接受任何一种审查（VIT&nbsp;34/35/37、HIRV、有组织犯罪或安全）的申请人，合计{' '}
          {fmtInt(a.grand)} 例，来自 {fmtInt(a.natCount)}{' '}
          个国家/地区。其中最多的八个单独标出；其余 {fmtInt(a.otherCount)}{' '}
          个合并为&ldquo;其他&rdquo;。想看每个国家的完整明细，请切换到表格视图。
        </>
      ) : (
        <>
          Applicants referred to CBSA/CSIS for comprehensive security screening
          are counted across any screening activity type (VIT&nbsp;34/35/37,
          HIRV, Org&nbsp;Crime, or Security) in 2025, totalling{' '}
          {fmtInt(a.grand)} across {fmtInt(a.natCount)} nationalities. The eight
          largest are labelled individually; the remaining{' '}
          {fmtInt(a.otherCount)} are pooled into &ldquo;Other&rdquo;. Use the
          table view for the full per-country breakdown.
        </>
      ),
    sliceAria: (
      locale: Locale,
      a: {
        isOther: boolean;
        name: string;
        otherCount: number;
        referred: number;
        fraction: number;
      }
    ): string =>
      locale === 'zh'
        ? `${a.isOther ? `其他，${fmtInt(a.otherCount)} 个国籍` : a.name}：${fmtInt(a.referred)} 例全面安全审查转介，占 ${fmtPct(a.fraction)}`
        : `${a.isOther ? `Other, ${fmtInt(a.otherCount)} nationalities` : a.name}: ${fmtInt(a.referred)} comprehensive security screening referrals, ${fmtPct(a.fraction)}`,
    otherLabel: (locale: Locale, a: { otherCount: number }): string =>
      locale === 'zh'
        ? `其他（${fmtInt(a.otherCount)}）`
        : `Other (${fmtInt(a.otherCount)})`,
    otherTipTitle: (locale: Locale, a: { otherCount: number }): string =>
      locale === 'zh'
        ? `其他（${fmtInt(a.otherCount)} 个国籍）`
        : `Other (${fmtInt(a.otherCount)} nationalities)`,
  },
  volumeCompare: {
    subtitle: (locale: Locale): ReactNode =>
      locale === 'zh' ? (
        <>
          每个国家显示两个数字，左右并排，并按申请量排序。左边这根条形是 2025
          年的移民<b>申请量</b>
          ，用的是真实的等比刻度，所以各国之间的倍数关系是准确的——印度大约是中国的
          3 倍。右边这根是<b>被送去接受安全审查</b>
          的人数，用它自己的刻度显示，这样一来，审查人数和申请量明显不成比例的国家就会格外醒目：中国提交的申请只有印度的三分之一，被送去审查的人却远比印度多。
        </>
      ) : (
        <>
          Two counts per nationality, side by side and sorted by application
          volume. The left panel is a bar of 2025 immigration{' '}
          <b>applications</b> on a true linear scale, so volume ratios stay
          honest and India reads as roughly 3× China. The right panel is a bar
          of the number of applicants{' '}
          <b>referred to CBSA/CSIS for comprehensive security screening</b>, on
          its own linear scale, so a country referred for comprehensive
          screening out of proportion to its application volume stands out —
          China is referred far more often than India despite filing a third as
          many applications.
        </>
      ),
    empty: (locale: Locale): string =>
      locale === 'zh'
        ? '没有具备 2025 年申请量的国籍。'
        : 'No nationalities with a 2025 application count.',
    collapse: (
      locale: Locale,
      a: { expanded: boolean; topN: number; total: number }
    ): string =>
      a.expanded
        ? pick(locale, { en: `Show top ${a.topN}`, zh: `显示前 ${a.topN} 名` })
        : pick(locale, {
            en: `Show all (${a.total})`,
            zh: `显示全部（${a.total}）`,
          }),
    rowAria: (
      locale: Locale,
      a: { name: string; applications: number; referred: number }
    ): string =>
      locale === 'zh'
        ? `${a.name}：${fmtInt(a.applications)} 份申请，${fmtInt(a.referred)} 份转介至全面安全审查`
        : `${a.name}: ${fmtInt(a.applications)} applications, ${fmtInt(a.referred)} referred to comprehensive security screening`,
  },
  screeningScatter: {
    subtitle: (locale: Locale): ReactNode =>
      locale === 'zh' ? (
        <>
          每个国家对应一个点：<b>横轴</b>是 2025 年的移民<b>申请</b>总数，
          <b>纵轴</b>是这些申请引发的<b>安全审查</b>总次数。两条轴都用
          <b>对数</b>刻度。
          <b>点越大</b>
          ，代表这个国家申请总量越多，所以最大的来源国会显示成明显更大的圆点。斜着的虚线是
          <b>全国平均</b>
          审查比例（总审查数除以总申请数）；落在线上方的国家，被审查的频率超过了它的申请量所能预期的水平。
        </>
      ) : (
        <>
          One dot per nationality: <b>x</b> is total 2025 immigration{' '}
          <b>applications</b> and <b>y</b> is the total{' '}
          <b>comprehensive security screenings</b> they produced, both on{' '}
          <b>log</b> axes. The <b>dot size</b> scales linearly with total
          applications, so the biggest source countries read as much larger
          marks. The dashed diagonal is the <b>national average</b>{' '}
          comprehensive security screening rate (pooled screenings over pooled
          applications); a country above the line is screened more often than
          that average predicts for its volume.
        </>
      ),
    legendAvg: (locale: Locale, a: { screened: number }): string =>
      locale === 'zh'
        ? `全国平均值（审查率 ${fmtPct(a.screened, 2)}）`
        : `National average (${fmtPct(a.screened, 2)} screened)`,
  },
  choropleth: {
    subtitle: (locale: Locale): ReactNode =>
      locale === 'zh' ? (
        <>
          每个国家的颜色深浅，取决于 2025
          年有多少国民拿到了「永久居民确认」（CoPR）文件，因此颜色最深的国家，就是加拿大接纳移民最多的来源地。由于各国人数相差极大，颜色采用平方根刻度。
        </>
      ) : (
        <>
          Countries are shaded by the number of
          Confirmation-of-Permanent-Residence documents issued to their
          nationals in 2025, so that the darkest countries are those Canada
          admitted the most permanent residents from. Because admission counts
          span several orders of magnitude, the shading is on a square-root
          scale.
        </>
      ),
    legendMax: (locale: Locale, a: { maxCopr: number }): string =>
      locale === 'zh'
        ? `接纳 ${fmtInt(a.maxCopr)} 人`
        : `${fmtInt(a.maxCopr)} admitted`,
    footnoteUnmatched: (locale: Locale, a: { names: string[] }): ReactNode =>
      locale === 'zh' ? (
        <div>未在地图上显示（无 ISO 匹配）：{a.names.join('、')}。</div>
      ) : (
        <div>Not shown on map (no ISO match): {a.names.join(', ')}.</div>
      ),
  },
  trApproval: {
    subtitle: (
      locale: Locale,
      a: { avgRate: number; minProcessed: number; hidden: number }
    ): ReactNode =>
      locale === 'zh' ? (
        <>
          一个国家 2025 年<b>已处理</b>的临时居民申请中，有多大比例
          <b>获得批准</b>
          ，数据用的是 IRCC 公布的全年合计。虚线是全国平均值{' '}
          <b>{fmtPct(a.avgRate, 1)}</b>
          ；蓝色条形表示这个国家的申请人比平均水平更常获批，红色则更少。已处理申请不足{' '}
          {fmtInt(a.minProcessed)} 的国家已隐去
          {a.hidden > 0 ? `（共 ${fmtInt(a.hidden)} 个）` : ''}。
        </>
      ) : (
        <>
          Share of a nationality&rsquo;s 2025 <b>processed</b>{' '}
          temporary-residence applications that were <b>approved</b>, using
          IRCC&rsquo;s published annual totals. The dashed line is the national
          average of <b>{fmtPct(a.avgRate, 1)}</b>; blue bars are approved more
          often than the average applicant, red bars less. Nationalities with
          fewer than {fmtInt(a.minProcessed)} processed applications are hidden{' '}
          {a.hidden > 0 ? `(${fmtInt(a.hidden)} excluded)` : ''}.
        </>
      ),
    empty: (locale: Locale, a: { minProcessed: number }): string =>
      locale === 'zh'
        ? `没有国籍达到 ${fmtInt(a.minProcessed)} 份已处理申请的下限。`
        : `No nationalities meet the ${fmtInt(a.minProcessed)}-processed minimum.`,
    collapse: (
      locale: Locale,
      a: { expanded: boolean; topN: number; total: number }
    ): string =>
      a.expanded
        ? pick(locale, { en: `Show top ${a.topN}`, zh: `显示前 ${a.topN} 名` })
        : pick(locale, {
            en: `Show all (${a.total})`,
            zh: `显示全部（${a.total}）`,
          }),
    rowAria: (
      locale: Locale,
      a: { name: string; rate: number; approved: number; processed: number }
    ): string =>
      locale === 'zh'
        ? `${a.name}：获批率 ${fmtPct(a.rate, 1)}，${fmtInt(a.approved)} / ${fmtInt(a.processed)} 已处理`
        : `${a.name}: ${fmtPct(a.rate, 1)} approval rate, ${fmtInt(a.approved)} of ${fmtInt(a.processed)} processed`,
  },
  approvalVsScreening: {
    subtitle: (
      locale: Locale,
      a: { nationalRatio: number; minApplications: number; hidden: number }
    ): ReactNode =>
      locale === 'zh' ? (
        <>
          每个国家一个圆点。横轴是它 2025 年的<b>安全审查率</b>
          （被审查人数除以申请人数，用
          <b>对数</b>刻度，因为各国比率相差上千倍），纵轴是它 2025 年的
          <b>临时居民获批率</b>（获批数除以已处理数）。<b>圆点越大</b>
          ，代表申请总量越多，所以最大的来源国显示成明显更大的点。<b>颜色</b>
          代表这两个比率的对比——获批率除以审查率——并以全国比值{' '}
          <b>{a.nationalRatio > 0 ? fmtRatio(a.nationalRatio) : '—'}</b>{' '}
          为中心分成两侧：获批远比被审查频繁的国家显示为冷色，被审查得几乎和获批一样频繁的国家显示为暖色。申请数不足{' '}
          {fmtInt(a.minApplications)} 的国家已隐去
          {a.hidden > 0 ? `（共 ${fmtInt(a.hidden)} 个）` : ''}
          ，因为申请太少时，审查率会很不稳定。
        </>
      ) : (
        <>
          One dot per nationality, placed at its 2025{' '}
          <b>comprehensive security screening rate</b> on the x-axis
          (comprehensive security screening referrals over applications, on a{' '}
          <b>log</b> scale because the rates span three orders of magnitude) and
          its 2025 <b>temporary-residence approval rate</b> on the y-axis
          (approved over processed). The <b>dot size</b> scales with total
          applications, so the biggest source countries read as much larger
          marks. The <b>color</b> encodes the ratio of the two rates, approval
          divided by screening, diverging about the national ratio of{' '}
          <b>{a.nationalRatio > 0 ? fmtRatio(a.nationalRatio) : '—'}</b>: a
          country approved far more often than it is screened reads cool, and
          one screened nearly as often as it is approved reads warm.
          Nationalities with fewer than {fmtInt(a.minApplications)} applications
          are hidden
          {a.hidden > 0 ? ` (${fmtInt(a.hidden)} excluded)` : ''} because a tiny
          denominator makes the comprehensive security screening rate unstable.
        </>
      ),
    legendNational: (locale: Locale, a: { nationalRatio: number }): string =>
      locale === 'zh'
        ? `全国比值（${a.nationalRatio > 0 ? fmtRatio(a.nationalRatio) : '—'}）`
        : `National ratio (${a.nationalRatio > 0 ? fmtRatio(a.nationalRatio) : '—'})`,
    empty: (locale: Locale, a: { minApplications: number }): string =>
      locale === 'zh'
        ? `没有国籍达到 ${fmtInt(a.minApplications)} 份申请的下限。`
        : `No nationalities meet the ${fmtInt(a.minApplications)}-application minimum.`,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Report editorial prose
// ─────────────────────────────────────────────────────────────────────────────

/** A nationality that tops one of the masthead rankings, with its winning count. */
export type HeadlineLeader = {
  cit: string;
  iso3: string | null;
  count: number;
};

export type Headline = {
  referralRate: number;
  approvalRate: number;
  /** Nationality with the most approved temporary-residence applications in 2025. */
  topApproval: HeadlineLeader;
  /** Nationality with the most comprehensive security screenings in 2025. */
  topScreening: HeadlineLeader;
};

type StatText = {
  label: string;
  note: ReactNode;
};

type SectionText = {
  title: string;
  intro: ReactNode;
};

type PartText = {
  kicker: string;
  title: string;
  lede: ReactNode;
};

export type ReportContent = {
  heroEyebrow: (atip: string) => string;
  heroTitle: string;
  heroDek: ReactNode;
  byline: ReactNode;
  stats: { referral: StatText; approval: StatText; screening: StatText };
  part1: PartText;
  part2: PartText;
  sections: Record<number, SectionText>;
  footer: {
    aboutTitle: string;
    aboutP1: ReactNode;
    aboutP2: ReactNode;
    sourcesTitle: string;
    sourcesIntro: ReactNode;
    screeningSrcName: (atip: string) => string;
    screeningSrcDesc: ReactNode;
    monthlySrcName: string;
    monthlySrcDesc: ReactNode;
    monthlyFiles: ReactNode[];
    reportPrompt: ReactNode;
    reportIssue: string;
  };
};

/** The report's issue tracker, linked from the footer bar. */
export const REPO_ISSUES_HREF = 'https://github.com/yuliswe/ircc-stats/issues';

const OGL_HREF = 'https://open.canada.ca/en/open-government-licence-canada';

/** The released ATIP source files, linked from every prose mention of the number. */
const ATIP_PDF_HREF =
  'https://github.com/yuliswe/ircc-stats/tree/release/data/original-atip-requests';

function reportEn(h: Headline, atip: string): ReportContent {
  return {
    heroEyebrow: a => `ATIP release ${a} · Access to Information Act`,
    heroTitle: 'Who Canada screens, and who it lets in',
    heroDek: (
      <>
        Almost everyone who applies to enter Canada &mdash; whether to
        immigrate, study, visit, or work &mdash; can be singled out by
        Immigration, Refugees and Citizenship Canada (IRCC) and referred to the
        Canada Border Services Agency (CBSA) and the Canadian Security
        Intelligence Service (CSIS) for an additional, more thorough
        comprehensive security screening before a decision is reached. Drawing
        on a records release obtained under the Access to Information Act, this
        report asks whether that comprehensive screening falls evenly across
        nationalities, how the pattern looks on a map, and how it lines up with
        who is ultimately approved.
      </>
    ),
    byline: (
      <>
        Built from IRCC ATIP release{' '}
        <a href={ATIP_PDF_HREF} target='_blank' rel='noopener noreferrer'>
          {atip}
        </a>
        , covering comprehensive security screenings initiated between 2019 and
        2025, alongside 2025 application and approval totals from IRCC&rsquo;s
        published operational figures. A disproportion in comprehensive security
        screening rates is an observed pattern in the records, not evidence of
        wrongdoing by any applicant. Every chart can be read as a data table
        through its own <b>View as table</b> toggle.
      </>
    ),
    stats: {
      referral: {
        label: 'National comprehensive security screening rate',
        note: 'of 2025 applicants sent for comprehensive security screening',
      },
      approval: {
        label: 'Most approvals',
        note: `${flagName('en', h.topApproval.cit, h.topApproval.iso3)} — more temporary-residence approvals plus permanent residents admitted than any other nationality in 2025`,
      },
      screening: {
        label: 'Most comprehensive security screenings',
        note: `${flagName('en', h.topScreening.cit, h.topScreening.iso3)} — more applicants sent for comprehensive security screening than any other nationality in 2025`,
      },
    },
    part1: {
      kicker: 'Part I',
      title: 'Who gets referred for comprehensive security screening',
      lede: (
        <>
          Comprehensive security screening referrals are counted here across
          every screening activity type in the release, from routine checks to
          the serious categories. The four views below move from a single
          per-nationality rate outward to every nationality at once, each one
          guarding against the easy mistake of reading a large count as a high
          rate: a populous country naturally files many applications and so has
          many applicants screened, but that does not mean its applicants are
          any more likely to be picked out for screening.
        </>
      ),
    },
    part2: {
      kicker: 'Part II',
      title: 'Who gets approved',
      lede: (
        <>
          Comprehensive security screening is a step on the way to a decision,
          not the decision itself. The release pairs naturally with IRCC&rsquo;s
          published approval figures, which let us ask a second question: once
          the sheer volume of applications is set aside, which nationalities are
          actually approved, and does heavy comprehensive screening travel with
          refusal?
        </>
      ),
    },
    sections: {
      1: {
        title: 'How often is each nationality security screened?',
        intro: (
          <p>
            The fairest way to ask whether one nationality is screened more than
            another is to divide each nationality&rsquo;s comprehensive security
            screening referrals by its own volume of applications. That share,
            measured against the national average of{' '}
            <b>{fmtPct(h.referralRate, 2)}</b>, is the report&rsquo;s headline.
            A bar past the line marks a nationality whose applicants were
            referred for comprehensive security screening more often than the
            average applicant to Canada, and a bar short of it, less often.
            Because the measure is a rate rather than a count, a small source
            country and a large one are compared on the same footing.
          </p>
        ),
      },
      2: {
        title: 'Who gets security screened, though?',
        intro: (
          <p>
            A rate answers how often, but not how many. This view turns to the
            comprehensively screened population itself and asks which
            nationalities the comprehensive security screening referrals
            actually belonged to. A nationality can dominate the composition
            simply by sending a large number of applicants, so a wide slice here
            is not evidence of a high comprehensive security screening rate. But
            it does show which nationalities IRCC&rsquo;s screening resources
            are skewed toward.
          </p>
        ),
      },
      3: {
        title: 'Volume against scrutiny, side by side',
        intro: (
          <>
            <p>
              Placing applications beside comprehensive security screening
              referrals makes the gap between volume and scrutiny concrete.
              India files far more applications than China but is screened far
              less; Iran is starker still &mdash; far fewer applications than
              either, yet the second-most screenings of any country (behind only
              China) at a rate (about 4.7%) higher even than China&rsquo;s.
            </p>
          </>
        ),
      },
      4: {
        title: 'Every nationality at once',
        intro: (
          <p>
            Widening from a handful of countries to all of them, this scatter
            plots each nationality by its total applications against the
            comprehensive security screenings those applications produced. The
            diagonal is the national-average comprehensive security screening
            rate, so a country above it is screened more than its volume alone
            would predict and one below it less. Both axes are logarithmic,
            which keeps countries spanning three orders of magnitude of volume
            legible on the same plot.
          </p>
        ),
      },
      5: {
        title: 'Where the admissions come from',
        intro: (
          <p>
            Mapped geographically, the volume of admissions traces a pattern
            that is easier to read than a ranked list. Countries are shaded by
            the number of Confirmation-of-Permanent-Residence documents issued
            to their nationals in 2025, so the darkest countries are those
            Canada admitted the most permanent residents from. Because those
            counts span several orders of magnitude, the shading is on a
            square-root scale.
          </p>
        ),
      },
      6: {
        title: 'How often is each nationality approved?',
        intro: (
          <p>
            Approval is the outcome that matters most to an applicant. This
            chart shows the share of each nationality&rsquo;s processed
            temporary-residence applications that IRCC approved in 2025,
            measured against the national average of{' '}
            <b>{fmtPct(h.approvalRate, 1)}</b>. Bars above the line clear it
            more often than the average applicant, and bars below it less often.
          </p>
        ),
      },
      7: {
        title: 'Are the most-screened nationalities also the most refused?',
        intro: (
          <p>
            The final view sets the two questions against each other, plotting
            each nationality&rsquo;s comprehensive security screening rate on
            one axis and its approval rate on the other. If the nationalities
            screened most heavily were also refused most often, the dots would
            trend together; the color encodes the ratio of the two rates so that
            the exceptions stand out, whether a nationality is approved far more
            often than it is screened or screened nearly as often as it is
            approved. This is where the comprehensive security screening story
            and the approval story either reinforce each other or come apart.
          </p>
        ),
      },
    },
    footer: {
      aboutTitle: 'About this report',
      aboutP1: (
        <>
          The figures come from IRCC ATIP release{' '}
          <a href={ATIP_PDF_HREF} target='_blank' rel='noopener noreferrer'>
            {atip}
          </a>
          , a 76-page scanned records release of comprehensive security
          screening counts initiated between 2019 and 2025, broken down by
          stream, screening activity type, citizenship, and processing office.
          The 2025 application and approval totals are IRCC&rsquo;s own
          published operational figures. Counts were OCR-extracted and then
          reconciled against the printed tables so that every roll-up foots;
          where a cell was withheld under the Act or a printed group did not
          foot, a reconciliation-placeholder row carries the gap and each chart
          footnotes how many it includes.
        </>
      ),
      aboutP2: (
        <>
          A comprehensive security screening rate is a share of applications,
          not a judgement of any application. The patterns here describe how
          comprehensive security screening referrals and approvals were
          distributed across nationalities in the records, and nothing in the
          release speaks to the reasons behind an individual decision.
        </>
      ),
      sourcesTitle: 'Data sources & attribution',
      sourcesIntro: (
        <>
          Every figure on this page comes from public records published by
          Immigration, Refugees and Citizenship Canada, and the underlying
          datasets are listed below so that each chart can be traced back to its
          origin. The Government of Canada material is used under the{' '}
          <a href={OGL_HREF} target='_blank' rel='noopener noreferrer'>
            Open Government Licence &ndash; Canada
          </a>
          , and this report is not affiliated with or endorsed by IRCC or the
          Government of Canada.
        </>
      ),
      screeningSrcName: a =>
        `IRCC ATIP release ${a} — Comprehensive security screenings`,
      screeningSrcDesc: (
        <>
          Counts of comprehensive security screenings initiated between
          January&nbsp;1,&nbsp;2019 and December&nbsp;31,&nbsp;2025, broken down
          by application stream, screening activity type, citizenship, and
          processing office. Obtained under the Access to Information Act as a
          76-page image-only scan, then OCR-extracted and reconciled against the
          printed tables. Feeds the comprehensive security screening charts in
          Part&nbsp;I.
        </>
      ),
      monthlySrcName:
        'IRCC monthly operational updates — application volumes & approvals',
      monthlySrcDesc: (
        <>
          Monthly operational counts by source country, published as open-data
          workbooks in the{' '}
          <a
            href='https://open.canada.ca/data/en/dataset/9b34e712-513f-44e9-babf-9df4f7256550'
            target='_blank'
            rel='noopener noreferrer'
          >
            Operational Processing &ndash; Monthly IRCC Updates
          </a>{' '}
          dataset. The 2025 per-year totals supply the application denominators
          behind the comprehensive security screening rates and the
          temporary-residence approval figures in Part&nbsp;II. Five workbooks
          are used:
        </>
      ),
      monthlyFiles: [
        <>
          Source Countries - Applications Received for Permanent Residency by
          Month &mdash; permanent-residence applications received
        </>,
        <>
          Source Countries - Applications Received for Temporary Residents by
          Month &mdash; temporary-resident-visa applications received
        </>,
        <>
          Source Countries - Applications Finalized for New Study Permit
          Applications by Month &mdash; study-permit applications finalized
        </>,
        <>
          Source Countries - New Applications and Extensions Approved for
          Temporary Residents by Month &mdash; temporary-residence applications
          approved
        </>,
        <>
          Source Countries - Applications Finalized for Temporary Residents by
          Month &mdash; temporary-residence applications finalized
        </>,
      ],
      reportPrompt: (
        <>
          Spot a wrong number, a chart that won&rsquo;t read, or a reading of
          the text you disagree with? Tell us where on the page it is and what
          you saw, and every correction will be logged at the end of the report.
        </>
      ),
      reportIssue: 'Report an issue on this page',
    },
  };
}

function reportZh(h: Headline, atip: string): ReportContent {
  return {
    heroEyebrow: a => `ATIP 公开档案 ${a} · 依《信息获取法》取得`,
    heroTitle: '加拿大审查了谁，又放行了谁',
    heroDek: (
      <>
        几乎每一个申请进入加拿大的人——无论是想移民、留学，还是来旅游或工作——在拿到批准之前，都可能被加拿大移民局（IRCC）单独挑出来，接受一次额外的、更深入的“安全审查”，由加拿大边境服务局（CBSA）和加拿大安全情报局（CSIS）负责。本报告依据一份依《信息获取法》取得的政府档案，想弄清三件事：这种额外审查是否公平地落在来自各个国家的申请人身上？把它画到世界地图上是什么样子？它又和“最终谁能获批”之间有没有关系？
      </>
    ),
    byline: (
      <>
        本报告的数据来自
        IRCC（加拿大移民、难民及公民部）依《信息获取法》公开的档案{' '}
        <a href={ATIP_PDF_HREF} target='_blank' rel='noopener noreferrer'>
          {atip}
        </a>
        ，记录了 2019 到 2025 年间发起的全面安全审查；申请量与获批量则取自 IRCC
        已公开的 2025
        年运营数据。需要说明的是：某些国家的申请人被审查的比例偏高，只是这份档案里呈现出来的一种现象，不代表任何申请人有不当行为。每一张图表也都能通过各自的
        <b>查看数据表</b>
        按钮，切换成原始数据表格阅读。
      </>
    ),
    stats: {
      referral: {
        label: '全国平均安全审查率',
        note: '2025 年被送去接受全面安全审查的申请人占比',
      },
      approval: {
        label: '获批人数最多',
        note: `${flagName('zh', h.topApproval.cit, h.topApproval.iso3)}——2025 年临时居民获批数与获准入境的永久居民数之和居各国/地区之首`,
      },
      screening: {
        label: '全面安全审查最多',
        note: `${flagName('zh', h.topScreening.cit, h.topScreening.iso3)}——2025 年被送去接受全面安全审查的人数居各国/地区之首`,
      },
    },
    part1: {
      kicker: '第一部分',
      title: '谁会被送去接受安全审查',
      lede: (
        <>
          这里说的“安全审查”，把档案里各种类型的审查都算在内，从常规核查到涉及严重问题的类别都包括进来。下面四张图，从单个国家的审查比例开始，一步步扩展到所有国家。它们要帮你避开一个很常见的误解：数量多，不等于比例高——一个人口大国申请人本来就多，被审查的人数自然也多，但这并不意味着它的申请人更容易被挑中审查。
        </>
      ),
    },
    part2: {
      kicker: '第二部分',
      title: '谁能获得批准',
      lede: (
        <>
          安全审查只是审批过程中的一个环节，它本身并不等于最终结果。把这份档案和
          IRCC
          公开的获批数据放到一起，就能追问第二个问题：撇开申请数量的多少不谈，究竟哪些国家的申请人真正拿到了批准？被严格审查，是否就意味着更容易被拒？
        </>
      ),
    },
    sections: {
      1: {
        title: '每个国家的申请人，被送去审查的频率有多高？',
        intro: (
          <p>
            要公平地比较“哪个国家的申请人更常被审查”，最合理的办法不是看人数，而是看比例：用一个国家被送去审查的人数，除以这个国家申请的总人数。把这个比例和全国平均值{' '}
            <b>{fmtPct(h.referralRate, 2)}</b>
            相比，就是本报告最核心的一张图。条形超过基准线，说明这个国家的申请人比“平均水平”更容易被挑去审查；没到基准线，则说明更少。
          </p>
        ),
      },
      2: {
        title: '那么，被审查的这些人，到底来自哪些国家？',
        intro: (
          <p>
            上一张图回答的是“频率有多高”，这一张回答的是“人数有多少”。它把所有被送去审查的人合在一起，看这些人分别来自哪些国家。要注意：一个国家只要申请人足够多，哪怕每个人被审查的概率并不高，它在这里也可能占很大一块。所以这里占比大，并不代表这个国家的申请人更容易被审查。但这张图可以告诉你
            IRCC 的审查资源在哪些国家倾斜。
          </p>
        ),
      },
      3: {
        title: '申请数量与审查力度，并排对比',
        intro: (
          <>
            <p>
              把“申请人数”和“被送去审查的人数”并排放在一起，数量和审查之间的落差就一目了然。印度申请人远比中国多，被送审的人却少得多；伊朗更明显——申请量比印度、中国都少得多，被送审人数却居全球第二（仅次于中国），审查比例（约
              4.7%）甚至高过中国。
            </p>
          </>
        ),
      },
      4: {
        title: '一张图看尽所有国家',
        intro: (
          <p>
            这张图不再只看少数几个国家，而是把所有国家一次性画出来：每个点代表一个国家，横向位置是它的申请总人数，纵向位置是这些申请引发的安全审查总次数。斜着的那条线代表全国平均审查比例，落在线上方的国家，被审查的程度超过了仅凭申请人数所能预期的水平，落在下方的则相反。两条坐标轴都用对数刻度，这样即使申请量相差上千倍的国家，也能挤在同一张图里看清楚。
          </p>
        ),
      },
      5: {
        title: '获准移民的人，主要来自哪里',
        intro: (
          <p>
            换成地图来看，移民的来源分布比一份排名表更直观。每个国家的颜色深浅，代表
            2025
            年有多少人拿到了「永久居民确认」文件、正式成为加拿大移民——颜色越深，说明加拿大从这个国家接纳的移民越多。由于各国人数相差极大，颜色同样采用平方根刻度。
          </p>
        ),
      },
      6: {
        title: '每个国家的申请人，获批的比例有多高？',
        intro: (
          <p>
            对申请人来说，最重要的结果就是能不能获批。这张图显示 2025 年 IRCC
            在每个国家已处理的临时居民申请中，批准了多大比例，并和全国平均值{' '}
            <b>{fmtPct(h.approvalRate, 1)}</b>
            对比。高于基准线，说明这个国家的申请人比平均水平更容易获批；低于基准线，则更难。
          </p>
        ),
      },
      7: {
        title: '被严格审查的人，是不是也更容易被拒？',
        intro: (
          <p>
            最后一张图把前面两个问题放到一起：横轴是每个国家被审查的比例，纵轴是它的获批比例。如果真的是“被审查得越多的国家、被拒得也越多”，这些点就会顺着一个方向排成一条线。颜色代表这两个比例的对比关系，好让特殊的国家凸显出来——有的国家获批比例远高于被审查比例，有的则被审查得几乎和获批一样频繁。正是在这张图上，“谁被审查”和“谁被批准”这两条线索，要么互相印证，要么彼此背离。
          </p>
        ),
      },
    },
    footer: {
      aboutTitle: '关于本报告',
      aboutP1: (
        <>
          数据来自 IRCC 依《信息获取法》公开的档案{' '}
          <a href={ATIP_PDF_HREF} target='_blank' rel='noopener noreferrer'>
            {atip}
          </a>
          ——一份 76 页的扫描文件，记录了 2019 到 2025
          年间发起的安全审查次数，并按申请类别、审查类型、国籍和处理办公室分类。2025
          年的申请量和获批量则取自 IRCC
          自行公开的运营数据。由于原件是扫描图片，所有数字都先用文字识别（OCR）读出，再逐一对照原表核对，确保每一层的小计都能加得上。凡是有数字依《信息获取法》被政府隐去、或原表本身加不平的地方，都用一行“核对占位”数据补上差额，每张图也都会在脚注里注明其中包含了多少这样的数据。
        </>
      ),
      aboutP2: (
        <>
          “安全审查率”指的是被审查的申请占全部申请的比例，它并不是对任何一份申请好坏的评判。本报告呈现的，只是档案中安全审查和获批结果在各国之间的分布情况；档案本身并不会告诉我们，任何一个具体决定背后的原因是什么。
        </>
      ),
      sourcesTitle: '数据来源与署名',
      sourcesIntro: (
        <>
          本页的每一项数据，都来自加拿大移民、难民及公民部（IRCC）公开的档案；下方列出了这些原始数据集，方便你把每张图追溯到它的出处。加拿大政府的材料依{' '}
          <a href={OGL_HREF} target='_blank' rel='noopener noreferrer'>
            开放政府许可 &ndash; 加拿大
          </a>
          使用。本报告与 IRCC 及加拿大政府没有任何关联，也未获得它们的认可。
        </>
      ),
      screeningSrcName: a => `IRCC ATIP 公开档案 ${a} — 全面安全审查`,
      screeningSrcDesc: (
        <>
          记录了 2019&nbsp;年&nbsp;1&nbsp;月&nbsp;1&nbsp;日到
          2025&nbsp;年&nbsp;12&nbsp;月&nbsp;31&nbsp;日之间发起的安全审查次数，按申请类别、审查类型、国籍和处理办公室分类。依《信息获取法》取得，原件是一份
          76&nbsp;页的纯图片扫描件，经文字识别（OCR）读出后再对照原表核对。用于第一部分的各张安全审查图表。
        </>
      ),
      monthlySrcName: 'IRCC 月度运营更新 — 申请量与获批量',
      monthlySrcDesc: (
        <>
          按来源国统计的月度运营数据，以开放数据表格的形式发布在{' '}
          <a
            href='https://open.canada.ca/data/en/dataset/9b34e712-513f-44e9-babf-9df4f7256550'
            target='_blank'
            rel='noopener noreferrer'
          >
            运营处理 &ndash; IRCC 月度更新
          </a>{' '}
          数据集里。其中 2025
          年的全年合计，为第二部分安全审查率的申请分母、以及临时居民获批数据提供了来源。共用到五个表格：
        </>
      ),
      monthlyFiles: [
        <>
          Source Countries - Applications Received for Permanent Residency by
          Month &mdash; 收到的永久居民（移民）申请
        </>,
        <>
          Source Countries - Applications Received for Temporary Residents by
          Month &mdash; 收到的临时居民签证申请
        </>,
        <>
          Source Countries - Applications Finalized for New Study Permit
          Applications by Month &mdash; 已办结的学习许可（留学签证）申请
        </>,
        <>
          Source Countries - New Applications and Extensions Approved for
          Temporary Residents by Month &mdash; 已批准的临时居民申请
        </>,
        <>
          Source Countries - Applications Finalized for Temporary Residents by
          Month &mdash; 已办结的临时居民申请
        </>,
      ],
      reportPrompt: (
        <>
          发现数字有误、图表读不出来，或对文中的解读有异议？请把页面位置和你看到的问题一并告诉我们——每一处更正都会记录在文末。
        </>
      ),
      reportIssue: '报告本页问题',
    },
  };
}

export function getReportContent(
  locale: Locale,
  h: Headline,
  atip: string
): ReportContent {
  return locale === 'zh' ? reportZh(h, atip) : reportEn(h, atip);
}
