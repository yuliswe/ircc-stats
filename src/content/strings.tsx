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
import { pick, type Locale } from '@/lib/i18n';

type Pair<T = string> = { en: T; zh: T };

// ─────────────────────────────────────────────────────────────────────────────
// Shared chrome
// ─────────────────────────────────────────────────────────────────────────────

export const SHELL = {
  brand: { en: 'IRCC Report 2025', zh: 'IRCC 报告 2025' },
  toggleThemeAria: { en: 'Toggle color theme', zh: '切换配色主题' },
  light: { en: '☀︎ Light', zh: '☀︎ 浅色' },
  dark: { en: '☾ Dark', zh: '☾ 深色' },
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
  minScreenings: { en: 'Min. screenings', zh: '最少筛查数' },
  minScreeningsAria: {
    en: 'Minimum screenings threshold',
    zh: '最少筛查数阈值',
  },
  metric: { en: 'Metric', zh: '指标' },
  seriousShare: { en: 'Serious-share', zh: '严重占比' },
  enrichment: { en: 'Enrichment', zh: '富集度' },
  referralRate: { en: 'Referral rate', zh: '转介率' },
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
      en: 'Screening referral rate — share of applications referred',
      zh: '安全筛查转介率 — 被转介的申请占比',
    },
    colCountry: { en: 'Country', zh: '国家/地区' },
    colReferred: { en: 'Referred', zh: '转介数' },
    colApplications: { en: 'Applications', zh: '申请数' },
    colRate: { en: 'Referral rate', zh: '转介率' },
    colVsAvg: { en: 'vs. average', zh: '相对平均值' },
    legendBelow: { en: 'Below average', zh: '低于平均' },
    legendAvg: { en: 'National average', zh: '全国平均' },
    legendAbove: { en: 'Above average', zh: '高于平均' },
    minApps: { en: 'Min. applications', zh: '最少申请数' },
    avg: { en: 'avg', zh: '均值' },
    tipReferred: { en: 'Referred to screening', zh: '转介至筛查' },
    tipApplications: { en: 'Total applications', zh: '申请总数' },
    tipRate: { en: 'Referral rate', zh: '转介率' },
    tipVsAvg: { en: 'vs. national average', zh: '相对全国平均' },
    svgAria: {
      en: 'Bar chart of security-screening referral rate over applications by citizenship',
      zh: '按国籍显示的安全筛查转介率（相对申请量）条形图',
    },
    footnote: {
      en:
        'Referrals count applicants sent to any screening type (VIT 34/35/37, HIRV, Org Crime, or ' +
        'Security); applications count PR intake, study permits processed, and TRV intake for 2025.',
      zh:
        '转介统计的是被送往任何筛查类型（VIT 34/35/37、HIRV、有组织犯罪或安全）的申请人；' +
        '申请统计的是 2025 年的永久居民收案、已处理学习许可以及临时居民签证收案。',
    },
  },
  referralComposition: {
    title: {
      en: 'Referral composition by nationality',
      zh: '各国籍的转介构成',
    },
    colCountry: { en: 'Country', zh: '国家/地区' },
    colReferred: { en: 'Referrals', zh: '转介数' },
    colPct: { en: '% of total', zh: '占总数百分比' },
    tipReferrals: { en: 'Referrals', zh: '转介数' },
    tipPct: { en: '% of total', zh: '占总数百分比' },
    centreTotal: { en: 'total referrals', zh: '转介总数' },
    empty: { en: 'No referral data available.', zh: '暂无转介数据。' },
    svgAria: {
      en: 'Donut chart of the composition of total 2025 security-screening referrals by nationality, with labelled callouts',
      zh: '按国籍显示的 2025 年安全筛查转介总量构成的环形图，带标注引线',
    },
  },
  volumeCompare: {
    title: {
      en: 'Applications vs. referrals to security screening',
      zh: '申请量与转介至安全筛查的对比',
    },
    colCountry: { en: 'Country', zh: '国家/地区' },
    colApplications: { en: 'Applications', zh: '申请数' },
    colReferred: { en: 'Referred', zh: '转介数' },
    colPctReferred: { en: '% referred', zh: '转介占比' },
    colPrIntake: { en: 'PR intake', zh: '永久居民收案' },
    colStudyPermits: { en: 'Study permits', zh: '学习许可' },
    colTrvIntake: { en: 'TRV intake', zh: '临时居民签证收案' },
    legendApplications: { en: 'Applications', zh: '申请数' },
    legendReferred: {
      en: 'Referred to security screening',
      zh: '转介至安全筛查',
    },
    panelApplications: { en: 'Applications', zh: '申请数' },
    panelReferredLine1: { en: 'Referred to comprehensive', zh: '转介至综合' },
    panelReferredLine2: {
      en: 'security screening (quantity)',
      zh: '安全筛查（数量）',
    },
    tipApplications: { en: 'Applications', zh: '申请数' },
    tipReferred: { en: 'Referred to screening', zh: '转介至筛查' },
    tipPctReferred: { en: '% referred', zh: '转介占比' },
    svgAria: {
      en:
        'Grouped bar chart by citizenship: a left panel of applications and a right ' +
        'panel of applicants referred to comprehensive security screening, each an ' +
        'absolute count on its own linear scale',
      zh:
        '按国籍分组的条形图：左侧面板为申请量，右侧面板为被转介至综合安全筛查的申请人，' +
        '两者各自采用独立的线性刻度显示绝对数量',
    },
    footnote: {
      en:
        'Referrals count all comprehensive security screening activity types (VIT 34/35/37, HIRV, Org ' +
        'Crime, Security); applications count PR intake and TRV intake. Study permits processed are ' +
        'shown for reference only and are not added into the application total, because TRV intake ' +
        'already includes study permit applicants. The two panels use independent linear scales, so a ' +
        'bar length in one panel is not comparable to a bar length in the other.',
      zh:
        '转介统计的是所有综合安全筛查活动类型（VIT 34/35/37、HIRV、有组织犯罪、安全）；申请统计的是永久居民收案' +
        '与临时居民签证收案。已处理的学习许可仅供参考，并未计入申请总数，因为临时居民签证收案已包含学习许可申请人。' +
        '两个面板采用独立的线性刻度，因此一个面板中的条形长度无法与另一个面板中的条形长度直接比较。',
    },
  },
  screeningScatter: {
    title: {
      en: 'Applications vs. security screenings — scatter',
      zh: '申请量与安全筛查 — 散点图',
    },
    colCountry: { en: 'Country', zh: '国家/地区' },
    colApplications: { en: 'Applications', zh: '申请数' },
    colScreenings: { en: 'Screenings', zh: '筛查数' },
    colPctScreened: { en: '% screened', zh: '筛查占比' },
    legendBelow: { en: 'Below average', zh: '低于平均' },
    legendAbove: { en: 'Above average', zh: '高于平均' },
    empty: {
      en: 'No nationalities with a 2025 application count.',
      zh: '没有具备 2025 年申请量的国籍。',
    },
    xName: { en: 'Applications', zh: '申请数' },
    xAxisLabel: { en: 'Total applications (log)', zh: '申请总数（对数）' },
    yName: { en: 'Security screenings', zh: '安全筛查数' },
    yAxisLabel: {
      en: 'Total security screenings (log)',
      zh: '安全筛查总数（对数）',
    },
    zName: { en: 'Applications', zh: '申请数' },
    tipApplications: { en: 'Applications', zh: '申请数' },
    tipScreenings: { en: 'Security screenings', zh: '安全筛查数' },
    tipPctScreened: { en: '% screened', zh: '筛查占比' },
    footnote: {
      en:
        'Screenings count all activity types (VIT 34/35/37, HIRV, Org Crime, Security); applications ' +
        'count PR intake, study permits processed, and TRV intake. Countries with zero applications ' +
        'are omitted (no dot to place); a country with zero screenings is drawn at the axis floor ' +
        'because a log scale cannot plot zero.',
      zh:
        '筛查统计的是所有活动类型（VIT 34/35/37、HIRV、有组织犯罪、安全）；申请统计的是永久居民收案、' +
        '已处理学习许可以及临时居民签证收案。申请量为零的国家/地区已略去（无点可绘）；筛查数为零的' +
        '国家/地区绘制在坐标轴底部，因为对数刻度无法绘制零值。',
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
      en: 'CoPRs issued in 2025 (log scale)',
      zh: '2025 年签发的永久居民确认（对数刻度）',
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
        '获批数与已处理数为 IRCC 自行公布的 2025 年年度总计（各自四舍五入至最接近的 5）；获批率为获批数 ÷ 已处理数。' +
        '凡 IRCC 为保护隐私而隐去获批数或已处理数的行均无获批率并被略去，同样被略去的还有 “Other*” 残余类别，' +
        '以及无 ISO 匹配的国籍（所罗门群岛、无国籍）。',
    },
  },
  approvalVsScreening: {
    title: {
      en: 'Approval rate vs. security-screening rate — scatter',
      zh: '获批率与安全筛查率对比 — 散点图',
    },
    colCountry: { en: 'Country', zh: '国家/地区' },
    colApplications: { en: 'Applications', zh: '申请数' },
    colScrRate: { en: 'Screening rate', zh: '筛查率' },
    colApprRate: { en: 'Approval rate', zh: '获批率' },
    colRatio: { en: 'Approval ÷ screening', zh: '获批率 ÷ 筛查率' },
    minApps: { en: 'Min. applications', zh: '最少申请数' },
    legendLow: {
      en: 'Screened nearly as often as approved (low ratio)',
      zh: '被筛查的频率几乎与获批相当（低比值）',
    },
    legendHigh: {
      en: 'Approved far more often than screened (high ratio)',
      zh: '获批频率远高于被筛查（高比值）',
    },
    axisScreeningName: { en: 'Screening rate', zh: '筛查率' },
    axisApprovalName: { en: 'Approval rate', zh: '获批率' },
    axisScreeningTitle: {
      en: 'Security-screening rate (log)',
      zh: '安全筛查率（对数）',
    },
    axisApprovalTitle: { en: 'TR approval rate', zh: '临时居民获批率' },
    zAxisName: { en: 'Applications', zh: '申请数' },
    tipApplications: { en: 'Applications', zh: '申请数' },
    tipScrRate: { en: 'Screening rate', zh: '筛查率' },
    tipApprRate: { en: 'Approval rate', zh: '获批率' },
    tipRatio: { en: 'Approval ÷ screening', zh: '获批率 ÷ 筛查率' },
    tipVsNational: { en: 'vs. national ratio', zh: '相对全国比值' },
    footnote: {
      en:
        'The screening rate is 2025 referrals (all activity types) over 2025 applications (PR intake, ' +
        'study permits processed, and TRV intake); the approval rate is IRCC’s own 2025 approved over ' +
        'processed temporary-residence total. A country appears only when it carries both rates, so ' +
        'nationalities with zero screening referrals (no defined rate to plot on a log axis) or with a ' +
        'suppressed approval count are omitted.',
      zh:
        '筛查率为 2025 年的转介数（全部活动类型）除以 2025 年的申请数（永久居民收案、已处理学习许可以及临时居民签证收案）；' +
        '获批率采用 IRCC 自身 2025 年临时居民已获批除以已处理的合计值。只有同时具备这两项比率的国家/地区才会出现，' +
        '因此筛查转介数为零（在对数轴上无可绘制的比率）或获批数被隐去的国籍将被略去。',
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
          某一国籍 2025 年的移民申请中被转介至<b>任何</b>安全筛查的占比，以
          <b>申请量</b>（而非筛查量）为分母。虚线为全国平均值{' '}
          <b>{fmtPct(a.globalRate, 2)}</b>
          ；暖色条形被转介的频率高于平均申请人，冷色条形则更低。申请数少于{' '}
          {fmtInt(a.minApps)} 的国籍已隐藏
          {a.hidden > 0 ? `（已排除 ${fmtInt(a.hidden)} 个）` : ''}
          ，因为分母过小会使比率不稳定。
        </>
      ) : (
        <>
          Share of a nationality&rsquo;s 2025 immigration applications that were
          referred to <b>any</b> security screening, relative to{' '}
          <b>applications</b> (not screenings). The dashed line is the national
          average of <b>{fmtPct(a.globalRate, 2)}</b>; warm bars are referred
          more often than the average applicant, cool bars less. Nationalities
          with fewer than {fmtInt(a.minApps)} applications are hidden{' '}
          {a.hidden > 0 ? `(${fmtInt(a.hidden)} excluded)` : ''} because a tiny
          denominator makes the rate unstable.
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
        ? `${a.name}：转介率 ${fmtPct(a.rate, 2)}，${fmtInt(a.referred)} / ${fmtInt(a.applications)} 份申请`
        : `${a.name}: ${fmtPct(a.rate, 2)} referral rate, ${fmtInt(a.referred)} of ${fmtInt(a.applications)} applications`,
  },
  referralComposition: {
    subtitle: (locale: Locale): ReactNode =>
      locale === 'zh' ? (
        <>
          每个扇区代表某一国籍在 2025 年<b>全部</b>
          安全筛查转介中的占比。这是被转介人群的<b>构成</b>
          &mdash;&mdash;即转介对象是谁，而非某一国籍被转介的频率&mdash;&mdash;因此较大的扇区可能只是反映了较大的申请人基数。若想了解每位申请人被转介的可能性，请参见转介率图表。
        </>
      ) : (
        <>
          Each slice is one nationality&rsquo;s share of <b>all</b> 2025
          security-screening referrals. This is the composition of the referred
          population &mdash; who the referrals were, not how often a nationality
          is referred &mdash; so a large slice can simply reflect a large
          applicant base. For the per-applicant chance of referral, see the
          referral-rate chart.
        </>
      ),
    footnote: (
      locale: Locale,
      a: { grand: number; natCount: number; otherCount: number }
    ): ReactNode =>
      locale === 'zh' ? (
        <>
          转介统计的是 2025
          年被送往任何筛查类型（VIT&nbsp;34/35/37、HIRV、有组织犯罪或安全）的申请人，共计{' '}
          {fmtInt(a.grand)} 例，涵盖 {fmtInt(a.natCount)}{' '}
          个国籍。最大的八个国籍单独标注；其余 {fmtInt(a.otherCount)}{' '}
          个合并为&ldquo;其他&rdquo;。完整的各国明细请使用表格视图。
        </>
      ) : (
        <>
          Referrals count applicants sent to any screening type
          (VIT&nbsp;34/35/37, HIRV, Org&nbsp;Crime, or Security) in 2025,
          totalling {fmtInt(a.grand)} across {fmtInt(a.natCount)} nationalities.
          The eight largest are labelled individually; the remaining{' '}
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
        ? `${a.isOther ? `其他，${fmtInt(a.otherCount)} 个国籍` : a.name}：${fmtInt(a.referred)} 转介，占 ${fmtPct(a.fraction)}`
        : `${a.isOther ? `Other, ${fmtInt(a.otherCount)} nationalities` : a.name}: ${fmtInt(a.referred)} referrals, ${fmtPct(a.fraction)}`,
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
          每个国籍两个数量，并排显示并按申请量排序。左侧面板是 2025 年移民
          <b>申请量</b>
          的条形，采用真实线性刻度，因此各国之间的量级比例保持真实，印度约为中国的
          3 倍。右侧面板是<b>被转介至综合安全筛查</b>
          的申请人数量条形，采用其自身的线性刻度，因此转介比例与其申请量不成比例的国家会凸显出来——尽管中国提交的申请量只有印度的三分之一，其被转介的频率却远高于印度。每一行从左向右阅读；精确数值位于每个条形的末端。
        </>
      ) : (
        <>
          Two counts per nationality, side by side and sorted by application
          volume. The left panel is a bar of 2025 immigration{' '}
          <b>applications</b> on a true linear scale, so volume ratios stay
          honest and India reads as roughly 3× China. The right panel is a bar
          of the number of applicants{' '}
          <b>referred to comprehensive security screening</b>, on its own linear
          scale, so a country referred out of proportion to its application
          volume stands out — China is referred far more often than India
          despite filing a third as many applications. Each row is read straight
          across; the exact counts sit at the end of each bar.
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
        ? `${a.name}：${fmtInt(a.applications)} 份申请，${fmtInt(a.referred)} 份转介至综合安全筛查`
        : `${a.name}: ${fmtInt(a.applications)} applications, ${fmtInt(a.referred)} referred to comprehensive security screening`,
  },
  screeningScatter: {
    subtitle: (locale: Locale): ReactNode =>
      locale === 'zh' ? (
        <>
          每个国籍对应一个点：<b>x</b> 为 2025 年移民<b>申请</b>总量，<b>y</b>{' '}
          为其产生的<b>安全筛查</b>总数，两条坐标轴均为<b>对数</b>
          刻度，因此跨越三个数量级的国家/地区都清晰可辨。<b>点的大小</b>
          与申请总量成线性比例，因此最大的来源国显示为大得多的标记。虚线对角线为
          <b>全国平均</b>
          筛查率（合计筛查数除以合计申请量）；位于线上方的国家/地区，其筛查频率高于该平均值对其数量的预测，其
          <b>颜色</b>沿用图 1 的划分——高于平均为暖色，低于为冷色。
        </>
      ) : (
        <>
          One dot per nationality: <b>x</b> is total 2025 immigration{' '}
          <b>applications</b> and <b>y</b> is the total{' '}
          <b>security screenings</b> they produced, both on <b>log</b> axes so
          countries spanning three orders of magnitude are all legible. The{' '}
          <b>dot size</b> scales linearly with total applications, so the
          biggest source countries read as much larger marks. The dashed
          diagonal is the <b>national average</b> screening rate (pooled
          screenings over pooled applications); a country above the line is
          screened more often than that average predicts for its volume, and its{' '}
          <b>color</b> follows the same split as chart 1 — warm above the
          average, cool below.
        </>
      ),
    legendAvg: (locale: Locale, a: { screened: number }): string =>
      locale === 'zh'
        ? `全国平均值（筛查率 ${fmtPct(a.screened, 2)}）`
        : `National average (${fmtPct(a.screened, 2)} screened)`,
  },
  choropleth: {
    subtitle: (locale: Locale): ReactNode =>
      locale === 'zh' ? (
        <>
          各国家/地区按 2025
          年发给其国民的永久居民确认（CoPR）文件数量着色，因此颜色最深的国家是加拿大接纳永久居民最多的来源地。由于接纳数量跨越数个数量级，着色采用对数刻度。
        </>
      ) : (
        <>
          Countries are shaded by the number of
          Confirmation-of-Permanent-Residence documents issued to their
          nationals in 2025, so that the darkest countries are those Canada
          admitted the most permanent residents from. Because admission counts
          span several orders of magnitude, the shading is on a logarithmic
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
          某一国籍 2025 年<b>已处理</b>的临时居民申请中<b>获批</b>的占比，采用
          IRCC 公布的年度总计。虚线为全国平均值 <b>{fmtPct(a.avgRate, 1)}</b>
          ；蓝色条形获批的频率高于平均申请人，红色条形则更低。已处理申请数少于{' '}
          {fmtInt(a.minProcessed)} 的国籍已隐藏
          {a.hidden > 0 ? `（已排除 ${fmtInt(a.hidden)} 个）` : ''}
          ，因为分母过小会使比率不稳定。
        </>
      ) : (
        <>
          Share of a nationality&rsquo;s 2025 <b>processed</b>{' '}
          temporary-residence applications that were <b>approved</b>, using
          IRCC&rsquo;s published annual totals. The dashed line is the national
          average of <b>{fmtPct(a.avgRate, 1)}</b>; blue bars are approved more
          often than the average applicant, red bars less. Nationalities with
          fewer than {fmtInt(a.minProcessed)} processed applications are hidden{' '}
          {a.hidden > 0 ? `(${fmtInt(a.hidden)} excluded)` : ''} because a tiny
          denominator makes the rate unstable.
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
          每个国籍一个圆点，横轴为其 2025 年的<b>安全筛查率</b>
          （转介数除以申请数，采用
          <b>对数</b>刻度，因为各国比率跨越三个数量级），纵轴为其 2025 年的
          <b>临时居民获批率</b>（获批数除以已处理数）。<b>圆点大小</b>
          随申请总数变化，因此最大的来源国显示为大得多的标记。<b>颜色</b>
          编码两项比率之比，即获批率除以筛查率，围绕全国比值{' '}
          <b>{a.nationalRatio > 0 ? fmtRatio(a.nationalRatio) : '—'}</b>{' '}
          发散：获批频率远高于被筛查的国家显示为冷色，被筛查的频率几乎与获批相当的国家显示为暖色。申请数少于{' '}
          {fmtInt(a.minApplications)} 的国籍已隐藏
          {a.hidden > 0 ? `（已排除 ${fmtInt(a.hidden)} 个）` : ''}
          ，因为分母过小会使筛查率不稳定。
        </>
      ) : (
        <>
          One dot per nationality, placed at its 2025{' '}
          <b>security-screening rate</b> on the x-axis (referrals over
          applications, on a <b>log</b> scale because the rates span three
          orders of magnitude) and its 2025{' '}
          <b>temporary-residence approval rate</b> on the y-axis (approved over
          processed). The <b>dot size</b> scales with total applications, so the
          biggest source countries read as much larger marks. The <b>color</b>{' '}
          encodes the ratio of the two rates, approval divided by screening,
          diverging about the national ratio of{' '}
          <b>{a.nationalRatio > 0 ? fmtRatio(a.nationalRatio) : '—'}</b>: a
          country approved far more often than it is screened reads cool, and
          one screened nearly as often as it is approved reads warm.
          Nationalities with fewer than {fmtInt(a.minApplications)} applications
          are hidden
          {a.hidden > 0 ? ` (${fmtInt(a.hidden)} excluded)` : ''} because a tiny
          denominator makes the screening rate unstable.
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

export interface Headline {
  referralRate: number;
  nationalities: number;
  approvalRate: number;
}

interface StatText {
  label: string;
  note: ReactNode;
}

interface SectionText {
  title: string;
  intro: ReactNode;
}

interface PartText {
  kicker: string;
  title: string;
  lede: ReactNode;
}

export interface ReportContent {
  heroEyebrow: (atip: string) => string;
  heroTitle: string;
  heroDek: ReactNode;
  byline: ReactNode;
  stats: { referral: StatText; approval: StatText; nationalities: StatText };
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
  };
}

const OGL_HREF = 'https://open.canada.ca/en/open-government-licence-canada';

function reportEn(h: Headline, atip: string): ReportContent {
  return {
    heroEyebrow: a => `ATIP release ${a} · Access to Information Act`,
    heroTitle: 'Who Canada screens, and who it lets in',
    heroDek: (
      <>
        Almost everyone who applies to enter Canada can be referred for security
        screening before a decision is reached. Drawing on a records release
        obtained under the Access to Information Act, this report asks whether
        that referral falls evenly across nationalities, how the pattern looks
        on a map, and how it lines up with who is ultimately approved.
      </>
    ),
    byline: (
      <>
        Built from IRCC ATIP release {atip}, covering security screenings
        initiated between 2019 and 2025, alongside 2025 application and approval
        totals from IRCC&rsquo;s published operational figures. Every count is
        OCR output from the released PDF, corrected and reconciled against the
        printed tables. A disproportion in referral rates is an observed pattern
        in the records, not evidence of intent by any office or of wrongdoing by
        any applicant. Definitions and caveats sit behind the <b>Methodology</b>{' '}
        button in the header, and every chart can be read as a data table
        through its own <b>View as table</b> toggle.
      </>
    ),
    stats: {
      referral: {
        label: 'National referral rate',
        note: 'of 2025 applicants sent to some security screening',
      },
      approval: {
        label: 'TR approval rate',
        note: 'of processed temporary-residence applications, 2025',
      },
      nationalities: {
        label: 'Nationalities',
        note: 'with a 2025 referral rate on record',
      },
    },
    part1: {
      kicker: 'Part I',
      title: 'Who gets referred to screening',
      lede: (
        <>
          Screening referrals are counted here across every activity type in the
          release, from routine checks to the serious categories. The five views
          below move from a single per-nationality rate outward to the whole
          world, each one guarding against the easy mistake of reading a large
          count as a high rate.
        </>
      ),
    },
    part2: {
      kicker: 'Part II',
      title: 'Who gets approved',
      lede: (
        <>
          Screening is a step on the way to a decision, not the decision itself.
          The release pairs naturally with IRCC&rsquo;s published approval
          figures, which let us ask a second question: once the sheer volume of
          applications is set aside, which nationalities are actually approved,
          and does heavy screening travel with refusal?
        </>
      ),
    },
    sections: {
      1: {
        title: 'How often is each nationality referred?',
        intro: (
          <p>
            The fairest way to ask whether one nationality is screened more than
            another is to divide each nationality&rsquo;s referrals by its own
            volume of applications. That share, measured against the national
            average of <b>{fmtPct(h.referralRate, 2)}</b>, is the report&rsquo;s
            headline. A bar past the line marks a nationality whose applicants
            were referred more often than the average applicant to Canada, and a
            bar short of it, less often. Because the measure is a rate rather
            than a count, a small source country and a large one are compared on
            the same footing.
          </p>
        ),
      },
      2: {
        title: 'Who are the referrals, though?',
        intro: (
          <p>
            A rate answers how often, but not how many. This view turns to the
            referred population itself and asks which nationalities the
            referrals actually belonged to. A nationality can dominate the
            composition simply by sending a large number of applicants, so a
            wide slice here is not evidence of a high referral rate. Read the
            two charts together: the first says who is referred
            disproportionately, and the second says who the bulk of referrals
            are.
          </p>
        ),
      },
      3: {
        title: 'Volume against scrutiny, side by side',
        intro: (
          <p>
            Placing applications and referrals next to each other makes the gap
            between volume and scrutiny concrete. India files far more
            applications than China, yet China is referred to comprehensive
            security screening far more often, which is exactly the
            disproportion the rate in the first chart captures. Each row is read
            straight across, and the two panels use independent scales, so a bar
            in one panel is not comparable in length to a bar in the other.
          </p>
        ),
      },
      4: {
        title: 'Every nationality at once',
        intro: (
          <p>
            Widening from a handful of countries to all of them, this scatter
            plots each nationality by its total applications against the
            screenings those applications produced. The diagonal is the
            national-average screening rate, so a country above it is screened
            more than its volume alone would predict and one below it less. Both
            axes are logarithmic, which keeps countries spanning three orders of
            magnitude of volume legible on the same plot.
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
            logarithmic scale.
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
        title: 'Does screening travel with refusal?',
        intro: (
          <p>
            The final view sets the two questions against each other, plotting
            each nationality&rsquo;s screening rate on one axis and its approval
            rate on the other. If the nationalities screened most heavily were
            also refused most often, the dots would trend together; the color
            encodes the ratio of the two rates so that the exceptions stand out,
            whether a nationality is approved far more often than it is screened
            or screened nearly as often as it is approved. This is where the
            screening story and the approval story either reinforce each other
            or come apart.
          </p>
        ),
      },
    },
    footer: {
      aboutTitle: 'About this report',
      aboutP1: (
        <>
          The figures come from IRCC ATIP release {atip}, a 76-page scanned
          records release of security-screening counts initiated between 2019
          and 2025, broken down by stream, screening activity type, citizenship,
          and processing office. The 2025 application and approval totals are
          IRCC&rsquo;s own published operational figures. Counts were
          OCR-extracted and then reconciled against the printed tables so that
          every roll-up foots; where a cell was withheld under the Act or a
          printed group did not foot, a reconciliation-placeholder row carries
          the gap and each chart footnotes how many it includes.
        </>
      ),
      aboutP2: (
        <>
          A referral rate is a share of applications, not a judgement of any
          application. The patterns here describe how referrals and approvals
          were distributed across nationalities in the records, and nothing in
          the release speaks to the reasons behind an individual decision. Full
          definitions, the serious-type mapping, and the residual limitations
          are in the Methodology panel, reachable from the header.
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
      screeningSrcName: a => `IRCC ATIP release ${a} — Security screenings`,
      screeningSrcDesc: (
        <>
          Counts of security screenings initiated between
          January&nbsp;1,&nbsp;2019 and December&nbsp;31,&nbsp;2025, broken down
          by application stream, screening activity type, citizenship, and
          processing office. Obtained under the Access to Information Act as a
          76-page image-only scan, then OCR-extracted and reconciled against the
          printed tables. Feeds the screening charts in Part&nbsp;I.
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
          behind the referral rates and the temporary-residence approval figures
          in Part&nbsp;II. Five workbooks are used:
        </>
      ),
      monthlyFiles: [
        <>PR Intake &mdash; permanent-residence applications received</>,
        <>TRV Intake &mdash; temporary-resident-visa applications received</>,
        <>SP Processed &mdash; study-permit applications finalized</>,
        <>TR Approved &mdash; temporary-residence applications approved</>,
        <>TR Processed &mdash; temporary-residence applications finalized</>,
      ],
    },
  };
}

function reportZh(h: Headline, atip: string): ReportContent {
  return {
    heroEyebrow: a => `ATIP 公开档案 ${a} · 依《信息获取法》取得`,
    heroTitle: '加拿大筛查了谁，又放行了谁',
    heroDek: (
      <>
        几乎每一个申请进入加拿大的人，都可能在决定作出之前被转介接受安全筛查。本报告依据一份根据《信息获取法》取得的档案，追问这种转介是否在各国籍之间均匀分布、在地图上呈现出怎样的格局，又与最终获批者的分布如何吻合。
      </>
    ),
    byline: (
      <>
        本报告基于 IRCC ATIP 公开档案 {atip}，涵盖 2019 至 2025
        年间发起的安全筛查，并结合 IRCC 已公布的运营数据中 2025
        年的申请与获批总量。每一项计数都来自公开 PDF 的 OCR
        识别结果，并已对照印刷表格加以校正与核对。转介率上的失衡是档案中观察到的一种格局，并不构成任何办公室存有意图或任何申请人存在不当行为的证据。定义与注意事项见页首的
        <b>方法说明</b>按钮，每一张图表都可通过各自的<b>查看数据表</b>
        切换按钮以数据表形式阅读。
      </>
    ),
    stats: {
      referral: {
        label: '全国转介率',
        note: '2025 年被转介至某类安全筛查的申请人占比',
      },
      approval: {
        label: '临时居民获批率',
        note: '2025 年已处理的临时居民申请中获批的占比',
      },
      nationalities: {
        label: '国籍数量',
        note: '有 2025 年转介率记录在案的国籍',
      },
    },
    part1: {
      kicker: '第一部分',
      title: '谁被转介去筛查',
      lede: (
        <>
          此处的筛查转介，统计了档案中每一种活动类型，从例行核查到严重类别皆包括在内。下面的五个视图，从单一国籍的转介率逐步扩展到全世界，每一个都在防范一个常见错误：把很大的计数误读为很高的比率。
        </>
      ),
    },
    part2: {
      kicker: '第二部分',
      title: '谁获得批准',
      lede: (
        <>
          筛查是通往决定途中的一步，而非决定本身。这份档案与 IRCC
          已公布的获批数据天然契合，让我们得以追问第二个问题：一旦把申请的绝对数量放在一边，究竟哪些国籍真正获得批准，而繁重的筛查是否与拒签相伴而行？
        </>
      ),
    },
    sections: {
      1: {
        title: '每个国籍被转介的频率有多高？',
        intro: (
          <p>
            要公平地追问某一国籍是否比另一国籍更常被筛查，最恰当的做法是用每个国籍自身的转介数除以其自身的申请量。这一占比，对照全国平均值
            <b>{fmtPct(h.referralRate, 2)}</b>
            来衡量，正是本报告的头条。越过基准线的条形，标示出其申请人被转介的频率高于赴加拿大的平均申请人，未及基准线的则更低。由于该度量是比率而非计数，一个小的来源国与一个大的来源国得以在同一基准上比较。
          </p>
        ),
      },
      2: {
        title: '不过，这些被转介的人究竟是谁？',
        intro: (
          <p>
            比率回答了频率有多高，却没有回答数量有多少。此视图转向被转介人群本身，追问这些转介实际上属于哪些国籍。一个国籍可能仅仅因为送出大量申请人就在构成中占据主导，因此这里较宽的一块并不构成高转介率的证据。请将两张图对照阅读：第一张说明谁被不成比例地转介，第二张说明转介的主体是谁。
          </p>
        ),
      },
      3: {
        title: '数量与审查，并排对照',
        intro: (
          <p>
            把申请量与转介量并排放置，能让数量与审查之间的落差变得具体。印度提交的申请远多于中国，然而中国被转介去接受全面安全筛查的频率却高得多，而这正是第一张图中的比率所刻画的失衡。每一行都横向对读，两个面板使用各自独立的刻度，因此一个面板中的条形长度不能与另一个面板中的条形相比较。
          </p>
        ),
      },
      4: {
        title: '所有国籍一览',
        intro: (
          <p>
            从少数几个国家扩展到全部国家，这张散点图按每个国籍的申请总量与这些申请所产生的筛查数分别定位。对角线是全国平均筛查率，因此位于其上方的国家，被筛查的程度高于仅凭其数量所能预测的水平，位于其下方的则更低。两条坐标轴均为对数刻度，从而让数量跨越三个数量级的国家在同一张图上仍然清晰可辨。
          </p>
        ),
      },
      5: {
        title: '获准入境者来自何处',
        intro: (
          <p>
            以地理方式呈现，入境数量勾勒出的格局比一份排名清单更易读。各国按
            2025
            年发给其国民的「永久居民确认」文件数量着色，因此颜色最深的国家，就是加拿大接纳永久居民最多的来源国。由于这些计数跨越若干数量级，着色采用对数刻度。
          </p>
        ),
      },
      6: {
        title: '每个国籍获批的频率有多高？',
        intro: (
          <p>
            获批是对申请人最为重要的结果。这张图显示 2025 年 IRCC
            在每个国籍已处理的临时居民申请中批准的占比，并对照全国平均值
            <b>{fmtPct(h.approvalRate, 1)}</b>
            来衡量。高于基准线的条形，越过它的频率高于平均申请人，低于基准线的则更低。
          </p>
        ),
      },
      7: {
        title: '筛查是否与拒签相伴？',
        intro: (
          <p>
            最后一个视图把两个问题相互对照，将每个国籍的筛查率放在一条轴上、获批率放在另一条轴上。倘若被筛查最密集的国籍同时也最常被拒签，这些点就会呈现出共同的趋势；颜色编码的是两个比率之比，从而让例外者凸显出来——无论是某国籍获批的频率远高于其被筛查的频率，还是其被筛查的频率几乎与获批的频率相当。正是在这里，筛查的故事与获批的故事，要么彼此印证，要么彼此分道。
          </p>
        ),
      },
    },
    footer: {
      aboutTitle: '关于本报告',
      aboutP1: (
        <>
          相关数据来自 IRCC ATIP 公开档案 {atip}，这是一份 76
          页的扫描档案，记录了 2019 至 2025
          年间发起的安全筛查计数，并按类别、筛查活动类型、国籍及处理办公室加以细分。2025
          年的申请与获批总量为 IRCC 自行公布的运营数据。计数经 OCR
          提取后，再对照印刷表格加以核对，使每一层汇总都能对平；凡有单元格依《信息获取法》被扣留，或印刷分组未能对平之处，均以一行核对占位数据承载其差额，且每张图表都以脚注说明其纳入了多少。
        </>
      ),
      aboutP2: (
        <>
          转介率是申请中的一个占比，而非对任何一份申请的评判。这里的格局描述的是档案中转介与获批如何在各国籍之间分布，档案中并无任何内容说明某一个别决定背后的缘由。完整的定义、严重类型的映射以及尚存的局限，均见可从页首进入的方法说明面板。
        </>
      ),
      sourcesTitle: '数据来源与署名',
      sourcesIntro: (
        <>
          本页每一项数据都来自加拿大移民、难民及公民部（IRCC）公布的公开档案，下方列出了底层数据集，以便每张图表都能追溯到其来源。加拿大政府的材料依{' '}
          <a href={OGL_HREF} target='_blank' rel='noopener noreferrer'>
            开放政府许可 &ndash; 加拿大
          </a>
          使用，本报告与 IRCC 或加拿大政府并无关联，亦未获其认可。
        </>
      ),
      screeningSrcName: a => `IRCC ATIP 公开档案 ${a} — 安全筛查`,
      screeningSrcDesc: (
        <>
          2019&nbsp;年&nbsp;1&nbsp;月&nbsp;1&nbsp;日至
          2025&nbsp;年&nbsp;12&nbsp;月&nbsp;31&nbsp;日间发起的安全筛查计数，按申请类别、筛查活动类型、国籍及处理办公室加以细分。依《信息获取法》取得，为一份
          76&nbsp;页的纯图像扫描件，经 OCR
          提取后对照印刷表格加以核对。用于第一部分的筛查图表。
        </>
      ),
      monthlySrcName: 'IRCC 月度运营更新 — 申请量与获批量',
      monthlySrcDesc: (
        <>
          按来源国划分的月度运营计数，以开放数据工作簿形式发布于{' '}
          <a
            href='https://open.canada.ca/data/en/dataset/9b34e712-513f-44e9-babf-9df4f7256550'
            target='_blank'
            rel='noopener noreferrer'
          >
            运营处理 &ndash; IRCC 月度更新
          </a>{' '}
          数据集中。其 2025
          年的年度总量，为第二部分中转介率背后的申请分母以及临时居民获批数据提供了依据。共使用五个工作簿：
        </>
      ),
      monthlyFiles: [
        <>PR Intake &mdash; 收到的永久居民申请</>,
        <>TRV Intake &mdash; 收到的临时居民签证申请</>,
        <>SP Processed &mdash; 已办结的学习许可申请</>,
        <>TR Approved &mdash; 已批准的临时居民申请</>,
        <>TR Processed &mdash; 已办结的临时居民申请</>,
      ],
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
