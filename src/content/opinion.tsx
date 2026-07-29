/**
 * Bilingual copy for the opinion column (China vs India). The column runs in
 * English at `/opinions/china` and Chinese at `/opinions/china/zh`; every string
 * below carries both languages and the components pick at render time from the
 * route's locale. Chart-card copy lives in `OPINION_CHARTS`; the editorial prose
 * (hero, part dividers, section framing, the closing argument and the footer)
 * comes from `getOpinionContent`, which returns everything already resolved for
 * one locale so the body component only lays it out.
 */
import type { ReactNode } from 'react';
import Link from 'next/link';
import { pick, type Locale } from '@/lib/i18n';

type Pair<T = string> = { en: T; zh: T };
export type LegendPair = { label: Pair; color: string };

const ATIP_DATA_HREF =
  'https://github.com/yuliswe/ircc-stats/tree/release/data/original-atip-requests';
const OGL_HREF = 'https://open.canada.ca/en/open-government-licence-canada';

// ── chart-card copy ─────────────────────────────────────────────────────────
export const OPINION_CHARTS = {
  streamCompare: {
    title: {
      en: 'Referral to comprehensive security screening — by application stream',
      zh: '被送去全面安全审查的比例 — 按申请通道',
    },
    subtitle: {
      en: "One bar each for China, India and the national average within every stream; the length is the share of that stream's applications referred to comprehensive security screening. The bar tip shows the rate and how many times the national average it is. All three streams share one scale, so the bars compare directly across streams.",
      zh: '每一条通道下，中国、印度和全国平均各一根条形，长度是该国这条通道里被送去接受全面安全审查的申请占比。条形右侧标出比例本身，以及它相当于全国平均的多少倍。三条通道用同一把刻度，所以彼此之间可以直接比长短。',
    },
    footnote: {
      en: 'Applicants referred to CBSA/CSIS for comprehensive security screening, counted across all screening types (Security / Org Crime / HIRV on the PR stream; VIT 34/35/37 on the TR stream). Denominators: permanent-residence applications received in 2025 for PR, temporary-residence visa applications received in 2025 for TR, and "All applications" is the two plus finalized study permits — matching the main report. Study-permit applicants are already contained within the temporary-residence visas, so they are not shown as a separate stream.',
      zh: '被送往 CBSA/CSIS 接受全面安全审查的申请人，按所有审查类型统计（永久居民通道为 Security / Org Crime / HIRV；临时居民通道为 VIT 34/35/37）。分母：永久居民为 2025 年收到的永久居民申请，临时居民为 2025 年收到的临时居民签证申请，「全部申请」为二者与已办结学习许可之和——与主报告一致。学习许可申请人已包含在临时居民签证申请之中，因此不单独作为一条通道呈现。',
    },
    legend: [
      { label: { en: 'China', zh: '中国' }, color: 'var(--div-warm)' },
      { label: { en: 'India', zh: '印度' }, color: 'var(--series-1)' },
      {
        label: { en: 'National average', zh: '全国平均' },
        color: 'var(--ink-muted)',
      },
    ] as LegendPair[],
  },
  waffle: {
    title: {
      en: 'Out of every 100 permanent-residence applicants, how many are sent for comprehensive screening',
      zh: '每 100 位永久居民申请人中，被送去全面安全审查的人数',
    },
    subtitle: {
      en: 'Each grid holds 100 cells; one cell is one person who filed a permanent-residence application in 2025. The filled cells are the share referred to CBSA/CSIS for comprehensive screening, rounded to the nearest whole cell; the exact rate sits above each grid and the raw counts below.',
      zh: '每个方阵 100 格，一格代表一位 2025 年提交永久居民申请的人。填色格子是被转介给 CBSA/CSIS 做全面安全审查的比例，四舍五入到整格；准确比例标在方阵上方，原始人数标在下方。',
    },
    footnote: {
      en: 'The numerator is the number of comprehensive security screenings opened on the PR stream in 2025 (Security / Org Crime / HIRV combined); the denominator is the permanent-residence applications received in 2025. An applicant opened to more than one screening type is counted more than once, so the figure is "screenings per 100 applications", slightly above the share of applicants screened.',
      zh: '分子为 2025 年永久居民通道下发起的全面安全审查次数（Security / Org Crime / HIRV 三类合计），分母为 2025 年收到的永久居民申请数。同一位申请人若被开启多种类型的审查会被重复计入，因此比例是「每 100 份申请对应的审查次数」，略高于「被审查的人数占比」。',
    },
  },
  grounds: {
    title: {
      en: 'Which legal ground each screening was opened under, and which application type it fell on',
      zh: '审查开在哪条法律依据下，又落在哪一类申请上',
    },
    subtitle: {
      en: "The upper bar splits the country's entire 2025 screening total by legal ground; the lower bar looks only at the temporary-residence stream, split by application type. Each bar fills its full width by share, so a very small segment is barely visible — read the exact counts in the breakdown beneath.",
      zh: '上一组条形按法律依据拆分该国 2025 年的全部安全审查；下一组只看临时居民通道，按申请类型拆分。条形按占比铺满整条，占比过小的段落在图上几乎看不见，具体次数请看条形下方的明细。',
    },
    footnote: {
      en: "The mapping to legal grounds comes from the file's own categories: Security Screening (PR) and VIT 34 (TR) both fall under s.34, HIRV Screening and VIT 35 under s.35, and Org Crime Screening and VIT 37 under s.37. Application type applies only to the temporary-residence stream, where “study permit” and “work permit” merge new applications with extensions.",
      zh: '法律依据的对应关系取自档案自身的分类：永久居民通道的 Security Screening 与临时居民通道的 VIT 34 同属第 34 条，HIRV Screening 与 VIT 35 同属第 35 条，Org Crime Screening 与 VIT 37 同属第 37 条。申请类型仅适用于临时居民通道，其中「学习许可」「工作许可」已把新申请与延期合并。',
    },
  },
  cumulative: {
    title: (shown: number): Pair => ({
      en: `Cumulative comprehensive screenings 2019–2025 — top ${shown} countries`,
      zh: `2019–2025 年全面安全审查累计次数 — 前 ${shown} 个国家/地区`,
    }),
    subtitle: {
      en: 'The bar length is the total comprehensive security screenings opened against that country between January 2019 and December 2025; the tip shows the count and its share of the global cumulative total. China is marked warm.',
      zh: '条形长度是这个国家在 2019 年 1 月至 2025 年 12 月之间被发起的全面安全审查累计次数，右侧标出次数与占全球累计的比例。中国以暖色标出。',
    },
    footnote: (total: string, countries: number): Pair => ({
      en: `The cumulative counts come from the file's "total" column (screenings opened between 1 January 2019 and 31 December 2025), combining the PR and TR streams and all screening types — ${total} screenings in all, across ${countries} countries. An applicant opened to more than one screening type is counted more than once. Switch to the table view for the full list.`,
      zh: `累计次数取自档案的「总计」列（覆盖 2019 年 1 月 1 日至 2025 年 12 月 31 日期间发起的审查），把永久居民与临时居民两条通道、以及全部审查类型合并计算，共 ${total} 次，来自 ${countries} 个国家/地区。同一位申请人若被开启多种类型的审查会被重复计入。完整名单请切换到表格视图。`,
    }),
  },
  outcome: {
    title: {
      en: 'How often a security screening actually fails — by nationality',
      zh: '安全审查真正查出问题的比例 — 按国籍',
    },
    axisLabel: { en: 'Country', zh: '国家/地区' },
    subtitle: (minLabel: string, shown: number): Pair => ({
      en: `Each bar is one country, filled to its lag-1 failure rate — failed (non-favourable) results in 2020–2025 over referrals in 2019–2024, offset by a year because a screening concludes about a year after referral. The whisker extends to the same-window rate, so its length shows how much the lag assumption moves the figure. The dashed line is the national mean. Only countries with at least ${minLabel} screenings appear (${shown} in all), sorted so the nationalities screening genuinely catches sit on top.`,
      zh: `每个国家一根条形，长度是「滞后一年」口径下的审查失败率——用 2020–2025 年出现的失败（非通过）结果，除以 2019–2024 年被送审的人数（因为一次审查通常在送审约一年后才出结论，所以两端各错开一年）。须状线延伸到「同窗」口径，其长度显示这个滞后假设会把数字挪动多少。虚线是全国均值。仅显示审查数不少于 ${minLabel} 的国家（共 ${shown} 个），按失败率从高到低排列，真正被审查查出问题最多的国家排在最上面。`,
    }),
    footnote: (natLag: string): Pair => ({
      en: `Failed results come from ATIP release OPP-DART-2025-34337 (non-favourable screening results by nationality and year, January 2019 – July 2025). The referral counts come from 1A-2025-08687. A suppressed cell (printed “--”, meaning a count of 1–4) is counted as zero, so every rate is a lower bound. The most recent referral cohorts have not finished concluding, so heavy recent screeners read slightly low. The national mean is ${natLag}. Switch to the table view for every country on both bases.`,
      zh: `失败结果来自 ATIP 公开档案 OPP-DART-2025-34337（按国籍与年度统计的非通过审查结果，2019 年 1 月至 2025 年 7 月）；被送审人数来自 1A-2025-08687。被隐去的单元格（印作「--」，表示 1–4 之间）按零计入，因此每个比率都是下限。最近几年的送审队列尚未全部出结论，所以近年送审量大的国家读数略偏低。全国均值 ${natLag}。切换到表格视图可查看每个国家在两种口径下的数值。`,
    }),
  },
  outliers: {
    title: {
      en: 'Screening rate against temporary-residence approval rate — large source countries',
      zh: '安全审查率与临时居民获批率 — 大型来源国',
    },
    subtitle: (minLabel: string, shown: number): Pair => ({
      en: `One dot per country. The x-axis is the 2025 security-screening rate (log scale), the y-axis the 2025 temporary-residence approval rate, and the dot size tracks application volume. The two dashed lines are the national average screening rate and the national average approval rate, splitting the frame into quadrants: bottom-right is "heavily screened, low approval", top-right "heavily screened, high approval". China and India are marked warm and labelled. Only countries with at least ${minLabel} finalized temporary-residence applications are shown (${shown} in all), to avoid small-denominator artefacts.`,
      zh: `每个圆点一个国家。横轴是 2025 年的安全审查率（对数刻度），纵轴是 2025 年的临时居民获批率，圆点大小对应申请量。两条虚线分别是全国平均审查率与全国平均获批率，把图分成四象限：右下角是「审查重、获批低」，右上角是「审查重、获批也高」。中国与印度以暖色和文字标出。仅显示已办结临时居民申请达 ${minLabel} 以上的国家（共 ${shown} 个），以避免小分母造成的假象。`,
    }),
    footnote: {
      en: "The screening rate is that country's 2025 screenings of all types divided by its 2025 applications; the approval rate is IRCC's published 2025 temporary-residence approvals divided by finalized applications. Countries with zero screenings cannot be placed on the log x-axis and are omitted. The two rates are not measured on exactly the same base: the screening-rate denominator includes permanent-residence applications while the approval rate covers temporary residence only, so read the chart as a trend rather than a precise causal chain.",
      zh: '安全审查率等于 2025 年该国全部类型的审查次数除以 2025 年申请数；获批率为 IRCC 公布的 2025 年临时居民获批数除以已办结数。审查次数为零的国家在对数横轴上无法定位，已略去。要注意两个比率的口径并不完全重合：审查率的分母含永久居民申请，获批率只针对临时居民，因此这张图应读作趋势关系，而不是精确的因果链。',
    },
    legend: [
      {
        label: { en: 'China / India', zh: '中国 / 印度' },
        color: 'var(--div-warm)',
      },
      {
        label: { en: 'Other large source countries', zh: '其他大型来源国' },
        color: 'var(--ink-muted)',
      },
    ] as LegendPair[],
    meanXLabel: { en: 'National avg screening rate', zh: '全国平均审查率' },
    meanYLabel: { en: 'National avg approval rate', zh: '全国平均获批率' },
  },
} as const;

// ── editorial prose ─────────────────────────────────────────────────────────
export type OpinionStats = {
  cnRate: string;
  cnVsIn: string;
  cnVsNat: string;
  cnScreenShare: string;
  cnAppShare: string;
  cnApproval: string;
  natApproval: string;
  /** China's lag-1 screening failure rate (failed results ÷ referrals). */
  cnFailRate: string;
  /** National lag-1 screening failure rate. */
  natFailRate: string;
  /** India's lag-1 screening failure rate, the peer comparison. */
  inFailRate: string;
};

const MONTHLY_FILES = [
  'Source Countries - Applications Received for Permanent Residency by Month',
  'Source Countries - Applications Received for Temporary Residents by Month',
  'Source Countries - Applications Finalized for New Study Permit Applications by Month',
  'Source Countries - New Applications and Extensions Approved for Temporary Residents by Month',
  'Source Countries - Applications Finalized for Temporary Residents by Month',
];

function byline(locale: Locale): ReactNode {
  const atipLink = (
    <a href={ATIP_DATA_HREF} target='_blank' rel='noopener noreferrer'>
      1A-2025-08687
    </a>
  );
  return locale === 'en' ? (
    <>
      This is an opinion piece, not a government document. Every figure in it
      comes from IRCC&rsquo;s Access to Information release {atipLink} and
      IRCC&rsquo;s own published 2025 operational data, and every chart can be
      switched to its underlying data table for checking; but the
      interpretation, selection and judgement of those figures are the
      author&rsquo;s responsibility. To be explicit: a high screening rate
      reflects how IRCC&rsquo;s process allocates attention, not wrongdoing by
      any applicant; the file records only how many times a screening was
      opened, never the reason behind any individual decision.
    </>
  ) : (
    <>
      这是一篇评论文章，不是政府文件。文中的每一个数字都来自 IRCC
      依《信息获取法》公开的档案 {atipLink} 以及 IRCC 自行发布的 2025
      年运营数据，图表可逐张切换到原始数据表核对；但对这些数字的解读、取舍与判断，责任在作者。需要特别说明：安全审查率高，反映的是
      IRCC
      的流程如何分配注意力，不代表任何一位申请人有任何不当行为；档案只记录审查被发起了多少次，从不说明每一个具体决定背后的理由。
    </>
  );
}

function prose(locale: Locale): ReactNode {
  return locale === 'en' ? (
    <>
      <p className='op-prose'>
        Put the three parts&rsquo; answers together and one thread is clear.{' '}
        <strong>First</strong>, for a Chinese applicant, being sent for
        comprehensive security screening is no longer the exception: overall it
        is more than ten times the rate for Indian applicants, and on the
        immigration stream it is close to one in every eight.{' '}
        <strong>Second</strong>, almost all of these screenings are opened under
        the same legal ground — 15,576 of 15,584 invoke s.34 (security) — and
        nearly three quarters of them (11,585) land on the most ordinary
        visitor-visa applications, not students, not workers. A screening regime
        genuinely opened on case-by-case risk could hardly reach so uniform a
        conclusion across a population of hundreds of thousands.{' '}
        <strong>Third</strong>, we no longer have to infer the payoff. IRCC has
        since released the screening results, and they are meagre: only 0.62% of
        the screenings of Chinese applicants end in a non-favourable finding,
        below both the national average of 0.80% and India&rsquo;s 1.35%, while
        the nationalities screening genuinely catches — Afghanistan, Ukraine,
        Russia — fail at four to five times China&rsquo;s rate.
      </p>
      <div className='op-pull'>
        When the most-screened group is also the one its own screening clears
        most reliably, what the screening sorts for is not risk but nationality.
      </div>
      <p className='op-prose'>
        The most plausible explanation is not conspiracy but inertia: once a
        nationality criterion is written into the referral rules, it triggers at
        near-zero marginal cost, over and over, unchanged for six years. The
        cost does not show up on a budget line — it falls on individual
        applicants who wait an extra 8 months, 18 months, sometimes longer, on
        admission letters that expire in the waiting, on weddings and funerals
        missed. It also falls on the limited analytical capacity of CBSA and
        CSIS: hours spent on 15,584 files that will be approved eight times out
        of ten are hours not spent elsewhere.
      </p>
      <p className='op-prose'>
        Testing whether a security-screening regime works does not require
        seeing anything classified. It takes one question:{' '}
        <strong>
          if the extra screening tied to a given nationality were removed, would
          more people be stopped, or the same number?
        </strong>{' '}
        For the year this piece first asked it, the answer had to be inferred.
        It no longer does: IRCC has published screening conclusions by
        nationality, and for Chinese applicants the answer is close to
        &ldquo;the same number&rdquo; — more than 99 screenings in 100 conclude
        favourably. Once the extra scrutiny changes almost nothing about who is
        found inadmissible, the label &ldquo;security screening&rdquo; becomes
        hard to tell apart from &ldquo;sorting by passport&rdquo;.
      </p>
      <h3 className='op-h3'>Three objections to this piece, and my replies</h3>
      <p className='op-prose'>
        <strong>
          &ldquo;Screening deters on its own; genuinely high-risk people simply
          never apply.&rdquo;
        </strong>{' '}
        This cannot be falsified or confirmed with the file. But deterrence only
        works if applicants know in advance that they will be screened — and
        IRCC&rsquo;s referral rules are never published, so most applicants only
        discover mid-wait that they were screened at all. A mechanism you learn
        about only after the fact can hardly deter beforehand.
      </p>
      <p className='op-prose'>
        <strong>
          &ldquo;Section 34 covers state actors, and China&rsquo;s circumstances
          make its scope genuinely wider.&rdquo;
        </strong>{' '}
        This is the objection the piece takes most seriously. But if that were
        the basis, the screening should concentrate on applicants connected to
        state institutions, not on 11,585 ordinary visitor-visa applications.
        The right move is to write the criterion down and publish it, not to use
        an entire nationality as a proxy.
      </p>
      <p className='op-prose'>
        <strong>
          &ldquo;A high approval rate is exactly what proves the screening works
          — it clears the innocent.&rdquo;
        </strong>{' '}
        If so, the number that settles it is the screening&rsquo;s marginal
        effect: of the people screened, how many were found inadmissible. That
        number has now been released, and it is small — a 0.62% non-favourable
        rate on Chinese applicants, below the national average. An 80.1%
        approval rate paired with a 0.62% screening-failure rate reads less like
        a filter that clears the innocent than like a checkpoint that, for the
        great majority, only delays.
      </p>
      <h3 className='op-h3'>Method and limits</h3>
      <p className='op-prose op-prose--fine'>
        The referral file counts the times screening was <em>opened</em>, not
        the number of people screened — an applicant opened to more than one
        screening type is counted more than once, so a rate over
        &ldquo;applications&rdquo; should be read as &ldquo;screenings per
        application&rdquo;. The failure rates draw on a second release
        (OPP-DART-2025-34337) that reports non-favourable results by nationality
        and year. Because a screening concludes about a year after referral, the
        headline failure rate offsets the windows by a year — failed results in
        2020&ndash;2025 over referrals in 2019&ndash;2024 — and each bar&rsquo;s
        whisker shows the same-window figure, keeping the lag assumption
        visible. Suppressed result counts (a printed &ldquo;--&rdquo;, meaning
        1&ndash;4) are floored to zero, so every failure rate is a lower bound,
        and the most recent referral cohorts have not finished concluding, so
        heavy recent screeners read slightly low. Both make China&rsquo;s low
        rate conservative rather than flattering. The original files are scanned
        images, so the figures were read by OCR and checked against the source
        one by one. Every chart can be switched to its underlying data table.
      </p>
    </>
  ) : (
    <>
      <p className='op-prose'>
        把三个部分的答案连起来看，一条线索很清楚。<strong>第一</strong>
        ，对中国申请人来说，被送去做全面安全审查已经不是例外：整体上是印度申请人的十倍以上，移民通道上接近每八个人就有一个。
        <strong>第二</strong>，这些审查几乎全部开在同一条法律依据下——15,584
        次里有 15,576 次援引第 34 条（安全），而这些审查里近四分之三（11,585
        次）落在最普通的访客签证申请上，不是学生，不是工人。一套真正按个案风险开启的审查，很难在一个几十万人的群体里得出这么单一的结论。
        <strong>第三</strong>
        ，这套投入换回了什么，如今不必再猜。IRCC
        已经公开了审查的结论，而结论很单薄：中国申请人被审查后，只有 0.62%
        得出「非通过」结果，低于全国均值 0.80%，也低于印度的
        1.35%；而真正被审查查出问题的国家——阿富汗、乌克兰、俄罗斯——失败率是中国的四到五倍。
      </p>
      <div className='op-pull'>
        当被审查得最多的群体，同时也是被这套审查放行得最干净的群体，它筛出来的就不是风险，而是国籍。
      </div>
      <p className='op-prose'>
        最合理的解释不是阴谋，而是惯性：某一条国籍指标一旦被写进转介规则，它就会以极低的边际成本被无限次触发，六年不变。代价并不在预算表上——它落在一个个多等
        8 个月、18
        个月、有时更久的申请人身上，落在因为等待而失效的录取通知、错过的婚期与葬礼上。也落在
        CBSA 与 CSIS 有限的分析人力上：这些人力用来处理 15,584
        份最后有八成会被批准的卷宗，就没有用在别处。
      </p>
      <p className='op-prose'>
        要检验一套安全审查是否有效，其实不需要看到机密内容。只需要问一个问题：
        <strong>
          如果把某个国籍的加码审查取消，被挡下的人会变多还是不变？
        </strong>
        本文最初发问的那一年，答案只能靠推断。如今不必了：IRCC
        已经公开了按国籍统计的审查结论，而对中国申请人来说，答案接近「不变」——每
        100 次审查里有 99
        次以上以通过收场。当这些加码的审查几乎不改变「谁被判定不可受理」时，「安全审查」这个名义，就很难再与「按护照分流」区分开来。
      </p>
      <h3 className='op-h3'>对本文的三点反驳，以及我的回应</h3>
      <p className='op-prose'>
        <strong>「审查本身就有威慑作用，高风险的人根本不会来申请。」</strong>
        这个说法无法用这份档案证伪，也无法证实。但威慑要成立，前提是申请人事先知道自己会被审查——而
        IRCC
        的转介规则从不公开，绝大多数申请人是在等待中才发现自己被审查了。事后才知道的机制，很难产生事前的威慑。
      </p>
      <p className='op-prose'>
        <strong>
          「第 34 条涵盖国家行为体，中国的国情决定了它的适用面更宽。」
        </strong>
        这是本文最认真对待的反驳。但如果依据是这个，那审查就该集中在与国家机构有关联的申请人身上，而不是集中在
        11,585
        份普通访客签证上。合理的做法是把标准写清楚并公开，而不是把整个国籍当作代理指标。
      </p>
      <p className='op-prose'>
        <strong>「获批率高恰恰说明审查有效——它放行了清白的人。」</strong>
        如果是这样，那能一锤定音的就是审查的边际效果：在被审查的人里，有多少人被判定不可受理。这个数字如今已经公开，而且很小——中国申请人的「非通过」率只有
        0.62%，低于全国均值。80.1% 的获批率配上 0.62%
        的审查失败率，与其说是一道放行清白者的筛子，不如说是一道对绝大多数人只造成延迟的关卡。
      </p>
      <h3 className='op-h3'>方法与局限</h3>
      <p className='op-prose op-prose--fine'>
        送审档案统计的是审查被<em>发起</em>
        的次数，不是被审查的人数——同一位申请人若被开启多种类型的审查会被重复计入，因此以「申请数」为分母算出的比例应读作「每份申请对应的审查次数」。失败率取自另一份档案（OPP-DART-2025-34337），它按国籍与年度列出非通过结果。由于一次审查通常在送审约一年后才出结论，本文的失败率把两端各错开一年——用
        2020–2025 年出现的失败结果，除以 2019–2024
        年的送审人数——每根条形的须状线则显示同窗口径，好让这个滞后假设一目了然。被隐去的结果计数（印作「--」，表示
        1–4）按零计入，因此每个失败率都是下限；最近几年的送审队列尚未全部出结论，近年送审量大的国家读数略偏低——这两点都让中国的低失败率偏保守，而非偏高。原始档案均为扫描图片，数字经文字识别读出后逐一对照核对。所有图表均可切换到原始数据表核验。
      </p>
    </>
  );
}

function sourcesIntro(locale: Locale): ReactNode {
  const reportHref = locale === 'zh' ? '/zh' : '/';
  return locale === 'en' ? (
    <>
      This piece shares its dataset with the companion{' '}
      <Link href={reportHref}>data report</Link>; the primary sources are listed
      below so each chart can be traced to its origin. Government of Canada
      material is used under the{' '}
      <a href={OGL_HREF}>Open Government Licence – Canada</a>.
    </>
  ) : (
    <>
      本文与同一系列的<Link href={reportHref}>数据报告</Link>
      共用一套数据集，下方列出原始出处，方便把每一张图追溯到源头。加拿大政府材料依{' '}
      <a href={OGL_HREF}>开放政府许可 – 加拿大</a> 使用。
    </>
  );
}

export function getOpinionContent(locale: Locale) {
  const t = (en: string, zh: string) => pick(locale, { en, zh });
  return {
    heroEyebrow: (atip: string) =>
      t(
        `OPINION · Written from ATIP ${atip} data`,
        `观点 · OPINION · 依 ATIP ${atip} 数据撰写`
      ),
    heroTitle: t(
      'Canada’s most-suspected applicants are also the ones it approves most',
      '加拿大最怀疑的申请人，也是它批得最多的人'
    ),
    heroDek: t(
      'In IRCC’s security screening, Chinese nationals account for more than a third of all screening volume — more than the next four countries (Iran, India, Ukraine, Pakistan) combined. A Chinese applicant’s chance of being sent for comprehensive security screening is more than ten times an Indian applicant’s. Yet set that screening against outcomes and the answer is awkward: China has the highest approval rate of any large source country Canada sees, 80.1%, well above the national average of 59.6% and above India’s 63.6%. Using the same ATIP file, this piece places China and India side by side and asks three things: whether extra screening is the exception or the norm for a Chinese applicant; whether the basis for that screening holds up; and what the resources it consumes actually buy.',
      '在加拿大移民局的安全审查里，中国国民占了所有审查量的三分之一以上——比排在后面的伊朗、印度、乌克兰、巴基斯坦加起来还多。一个中国申请人被送去接受全面安全审查的概率，是印度申请人的十倍以上。但把这套审查放到结果上去看，答案很尴尬：中国是加拿大所有大型来源国里获批率最高的一个，80.1%，远高于全国平均的 59.6%，也高过印度的 63.6%。本文用同一份 ATIP 档案，把中国和印度并排放在一起，追问三件事：对一个中国申请人来说，被额外审查是例外还是常态；这套审查的依据是否站得住；以及它花掉的资源，究竟换回了什么。'
    ),
    heroByline: byline(locale),
    stats: {
      rate: {
        label: t('Chinese applicants’ screening rate', '中国申请人的被审查率'),
        note: (s: OpinionStats) =>
          t(
            `${s.cnVsIn} the Indian rate, ${s.cnVsNat} the national average`,
            `是印度申请人的 ${s.cnVsIn}，是全国平均的 ${s.cnVsNat}`
          ),
      },
      share: {
        label: t('China’s share of national screening', '中国占全国审查量'),
        note: (s: OpinionStats) =>
          t(
            `while China is only ${s.cnAppShare} of all applications`,
            `而中国只占全部申请量的 ${s.cnAppShare}`
          ),
      },
      approval: {
        label: t('China’s TR approval rate', '中国临时居民获批率'),
        note: (s: OpinionStats) =>
          t(
            `highest of any large source country; national average ${s.natApproval}`,
            `所有大型来源国中最高；全国平均 ${s.natApproval}`
          ),
      },
      outcome: {
        label: t('China’s screening failure rate', '中国安全审查失败率'),
        note: (s: OpinionStats) =>
          t(
            `below the national ${s.natFailRate} and India’s ${s.inFailRate}`,
            `低于全国的 ${s.natFailRate} 与印度的 ${s.inFailRate}`
          ),
      },
    },
    part1: {
      kicker: t('Part one', '第一部分'),
      title: t(
        'Extra screening is the norm for Chinese applicants',
        '被额外审查，对中国申请人是常态'
      ),
      lede: t(
        'Before arguing about fairness, one basic fact has to be settled: how common is it, really, for a Chinese applicant to be singled out for comprehensive security screening. China and India are Canada’s two largest immigration source countries, and setting them side by side is far more telling than comparing China against any small country — both run to hundreds of thousands of applications, so the proportions are not distorted by a tiny denominator. The two charts below give the answer: for Indian applicants, hitting a security screening is basically the exception; for Chinese applicants, it has become close to routine.',
        '讨论公平之前，先要弄清一件基本事实：被挑出来做全面安全审查，对一个中国申请人来说到底有多常见。中国和印度是加拿大最大的两个移民来源国，把它们并排比较，比拿中国去和任何小国比都更有说服力——两国的申请量都在几十万以上，比例不会因为分母太小而失真。下面两张图给出的答案是：印度申请人碰上安全审查基本是例外，中国申请人碰上安全审查已经接近常规流程。'
      ),
    },
    part2: {
      kicker: t('Part two', '第二部分'),
      title: t(
        'Does the basis for the screening hold up?',
        '审查的依据经得起追问吗'
      ),
      lede: t(
        'A high screening rate is not in itself unfair — if it is high where there is genuine cause, that is exactly what security screening is for. So the real question is: in whose name are these screenings opened, on whom do they fall, and is it a fluke of one year. The file’s own categories happen to answer all three, and the answers point the same way: screening of Chinese nationals is concentrated on a single legal ground, falls overwhelmingly on the most ordinary visitors, and has held for six years running.',
        '审查率高本身不构成不公平——如果高在有根据的地方，那正是安全审查该做的事。所以真正的问题是：这些审查是以什么名义开启的，落在什么人身上，以及它是不是某一年的偶然。档案里的分类恰好能回答这三问，而答案指向同一个方向：针对中国国民的审查高度集中在唯一一条法律依据上，绝大多数落在最普通的访客身上，并且已经连续六年如此。'
      ),
    },
    part3: {
      kicker: t('Part three', '第三部分'),
      title: t('What do these resources buy?', '这些资源换回了什么'),
      lede: t(
        'Security screening is not free. Every comprehensive screening consumes CBSA and CSIS analytical labour and adds months, sometimes years, to an applicant’s wait. So the last question matters most: what does this investment buy? When this piece was first drafted the honest measure could only be indirect, because IRCC had not released the results of the screening. It since has — a second Access-to-Information release reports how many screenings ended in a non-favourable (failed) result, by nationality and by year — so we no longer have to guess. The two charts below read that outcome data directly, then set it against who ends up approved.',
        '安全审查不是免费的。每一次全面审查都要占用 CBSA 与 CSIS 的分析人力，也让申请人多等几个月甚至几年。所以最后一个问题最要紧：这套投入换回了什么？本文最初起草时，只能用间接办法来衡量，因为 IRCC 还没有公开审查的结论。如今它公开了——另一份《信息获取法》档案按国籍、按年度列出有多少次审查以「非通过」（失败）结果收场——所以我们不必再猜。下面两张图先直接读这份结论数据，再把它放到「谁最终获批」旁边看。'
      ),
    },
    sections: {
      1: {
        title: t('Three streams, one direction', '三条通道，同一个方向'),
        intro: t(
          'Canadian applications run through three main streams: immigration (permanent residence), temporary-residence visas, and study permits. This chart lays out the screening rate for China, India and the national average on each stream. All three streams point the same way, and the widest gap is on the immigration stream — the one that leads to permanent status, is screened hardest, and waits longest.',
          '加拿大的申请分三条主要通道：移民（永久居民）、临时居民签证、以及学习许可。这张图把中国、印度和全国平均的被审查比例，在每一条通道上分别摆出来。三条通道的结论完全一致，而且落差最大的是移民通道——那条通往永久身份、审查最严、等待最久的通道。'
        ),
      },
      2: {
        title: t(
          'For every 100 Chinese who apply to immigrate, 12 are sent for security screening',
          '每 100 个申请移民的中国人，有 12 个被送去安全审查'
        ),
        intro: t(
          'Turning the rate into heads makes it more concrete. This chart is the immigration (permanent-residence) stream: each cell is one applicant, and the filled cells are the ones sent for comprehensive security screening. China’s grid has 12 cells filled, India only 1, the national average 3. To be clear, this is not "12% are refused" but "12% are, before any decision, pulled aside for an extra security investigation" — a step that usually means waiting several more months to several more years.',
          '比例换成人头会更直观。这张图画的是移民（永久居民）通道：每一格代表一位申请人，被填色的格子就是被送去接受全面安全审查的那些人。中国这一格阵里有 12 格被填上，印度只有 1 格，全国平均是 3 格。要强调的是，这不是「12% 的人被拒」，而是「12% 的人在获得结果之前，先被单独拎出来做一次额外的安全调查」——这一步通常意味着多等几个月到几年。'
        ),
      },
      3: {
        title: t(
          'One clause of law carries 99.9% of the screening',
          '一条法律条款，撑起了 99.9% 的审查'
        ),
        intro: t(
          'Canada’s Immigration and Refugee Protection Act has three main grounds that can trigger comprehensive security screening: s.34 (security, covering espionage, subversion and terrorism), s.35 (human-rights violations, covering war crimes and sanctioned officials), and s.37 (organized crime). The file assigns every screening to one of them. China’s distribution is barely a distribution at all: of 15,584 screenings, 15,576 are opened under s.34. India’s makeup is clearly different, with more than a quarter under s.35. The second set of bars below also shows who these screenings fall on: of China’s screened temporary-residence applications, nearly nine in ten are ordinary visitor visas — not students, not workers.',
          '加拿大《移民及难民保护法》里，可以触发全面安全审查的主要有三条：第 34 条（安全，涵盖间谍、颠覆、恐怖主义）、第 35 条（侵犯人权，涵盖战争罪与受制裁官员）、第 37 条（有组织犯罪）。档案把每一次审查归到其中一类。中国的分布几乎没有分布可言：15,584 次审查里，15,576 次都开在第 34 条名下。印度的构成则明显不同，超过四分之一落在第 35 条。下面第二组条形还告诉你这些审查落在谁身上：中国被审查的临时居民申请里，近九成是普通访客签证，不是学生也不是工人。'
        ),
      },
      4: {
        title: t('This is not one anomalous year', '这不是某一年的异常'),
        intro: t(
          'Look only at 2025 and you could still call it a one-year blip. But the file covers 2019 to 2025. Add up six-plus years of screenings and China still stands alone: of 310,876 screenings, 96,574 are of Chinese nationals — 31.1%, nearly double second-place Iran and nearly four times India. In other words this is not a policy spasm but a default setting that has run steadily for six years.',
          '如果只看 2025 年，还可以说是某一年的偶发波动。但档案覆盖了 2019 到 2025 年。把六年多的审查累计起来，中国依然一家独大：310,876 次审查里有 96,574 次针对中国国民，占比 31.1%，是排第二的伊朗的近两倍，是印度的近四倍。也就是说，这不是一次政策抽风，而是一套稳定运行了六年的默认设定。'
        ),
      },
      5: {
        title: t(
          'The extra screening of Chinese applicants finds almost nothing',
          '对中国申请人的加码审查，几乎什么也没查出'
        ),
        intro: t(
          'Across every nationality a security screening almost never ends in a failure: the national rate is 0.80%. China’s is lower still at 0.62%, below both the national average and India’s 1.35%. The countries where screening genuinely catches something are Afghanistan, Ukraine and Russia, all around 3%, four to five times China’s rate. Iran, one of the two most-screened countries of all, fails at just 0.20%. One caveat runs the other way: China is first in the raw count of failed screenings, 845 of them — but only because it is screened so much. Its share of failures, 28.5%, is roughly its share of screening, 31.1%. The disproportion is in the rate, not the share — a Chinese applicant is screened at some ten times an Indian applicant’s rate, and each of those screenings fails at a lower rate.',
          '对所有国籍来说，一次安全审查几乎不会以失败收场——全国失败率是 0.80%。中国更低，只有 0.62%，低于全国均值，也低于印度的 1.35%；真正被审查查出问题的是阿富汗、乌克兰和俄罗斯，都在 3% 上下，是中国的四到五倍。被审查最多的两个国家之一伊朗，失败率只有 0.20%。有一点必须朝相反方向说清楚：论失败的绝对数量，中国排第一，845 次——但这只因为它被审查得太多。它占全部失败的 28.5%，与它占全部审查的 31.1% 大体相当。失衡不在份额，而在比率——一个中国申请人被审查的比例大约是印度申请人的十倍，而这些审查每一次查出问题的比率反而更低。'
        ),
      },
      6: {
        title: t(
          'The most heavily screened large country is also the most approved',
          '被审查得最狠的大国，获批率也最高'
        ),
        intro: t(
          'Finally, put both facts on one chart: the x-axis is the screening rate, the y-axis the eventual approval rate, and the dot size is application volume. If screening were effectively identifying risk, the most-screened countries should sit in the bottom-right — heavily screened, low approval. China is not there. It is in the top-right: a screening rate four times the national average, yet the highest approval rate of any large source country at 80.1%. This single point all but refutes the claim that screening by nationality is filtering for risk: the population this process suspects again and again is precisely the population it ends up approving most.',
          '最后把两件事画在同一张图上：横轴是被审查的比例，纵轴是最终获批的比例，圆点大小是申请量。如果审查在有效识别风险，被审查最多的国家应该出现在图的右下角——审查重、获批低。中国不在那里。它在右上角：审查率是全国平均的四倍，获批率却是所有大型来源国里最高的 80.1%。这一个点，几乎否掉了「按国籍加码审查是在筛风险」的说法：真正被这套流程反复怀疑的人群，正是最后被批准得最多的人群。'
        ),
      },
      7: {
        title: t(
          'Opinion: writing suspicion into the process is not the same as controlling risk',
          '观点：把怀疑写进流程，不等于管住了风险'
        ),
        intro: t(
          'This file cannot prove any applicant innocent or suspect, nor pinpoint where IRCC’s judgement went wrong on any single case. But it can tell us where this machine’s attention goes, and what that attention ultimately produces.',
          '这份档案不能证明任何一位申请人清白或有嫌疑，也不能证明 IRCC 的判断错在哪一份卷宗上。但它能告诉我们这台机器的注意力放在哪里，以及这些注意力最后落到了什么结果上。'
        ),
      },
    } as Record<number, { title: string; intro: string }>,
    prose: prose(locale),
    footer: {
      aboutTitle: t('About this commentary', '关于这篇评论'),
      aboutP1: t(
        'This is an opinion piece built on public data, unaffiliated with and unendorsed by IRCC or the Government of Canada. All data comes from two IRCC Access to Information releases — 1A-2025-08687 (a 76-page scanned document recording the number of security screenings opened between January 2019 and December 2025, categorized by application class, screening type, nationality and processing office) and OPP-DART-2025-34337 (how many of those screenings ended in a non-favourable result, by nationality and year) — together with IRCC’s own published 2025 operational data. The numbers can be checked chart by chart against the underlying data tables; the opinions and inferences are the author’s.',
        '本文是一篇基于公开数据的评论文章，与 IRCC 及加拿大政府没有任何关联，也未获得它们的认可。所有数据来自 IRCC 依《信息获取法》公开的两份档案——1A-2025-08687（一份 76 页的扫描文件，记录 2019 年 1 月至 2025 年 12 月期间发起的安全审查次数，按申请类别、审查类型、国籍与处理办公室分类）与 OPP-DART-2025-34337（其中有多少次审查以非通过结果收场，按国籍与年度统计）——以及 IRCC 自行公布的 2025 年运营数据。数字部分可逐张图表切换到原始数据表核对；观点与推论由作者负责。'
      ),
      aboutP2: t(
        'This piece is about how the process allocates attention; it makes no judgement about any individual applicant. A high screening rate does not imply wrongdoing by any applicant, and the file itself never states the reason behind any individual decision. If IRCC or CBSA believes the interpretation here is mistaken, they are welcome to publish screening conclusions by nationality — the only material that could truly answer the questions this piece raises.',
        '本文讨论的是流程如何分配注意力，不涉及对任何具体申请人的评价。安全审查率高，不代表任何申请人有不当行为；档案本身也从不说明任何一个具体决定背后的理由。若 IRCC 或 CBSA 认为文中的解读有误，欢迎公布按国籍统计的审查结论数据——那是唯一能真正回答本文问题的材料。'
      ),
      sourcesTitle: t('Data sources', '数据来源'),
      sourcesIntro: sourcesIntro(locale),
      srcName: t(
        'IRCC ATIP release 1A-2025-08687 — comprehensive security screening',
        'IRCC ATIP 公开档案 1A-2025-08687 — 全面安全审查'
      ),
      srcDesc: t(
        'The number of security screenings opened between 1 January 2019 and 31 December 2025, categorized by application class, screening type, nationality and processing office. Used for the screening-rate, legal-ground composition and six-year cumulative charts, and as the referral denominator for the failure-rate chart, across Parts One through Three.',
        '2019 年 1 月 1 日至 2025 年 12 月 31 日期间发起的安全审查次数，按申请类别、审查类型、国籍与处理办公室分类。用于第一至第三部分的审查率、法律依据构成与六年累计各图，并为失败率一图提供送审人数分母。'
      ),
      outcomeSrcName: t(
        'IRCC ATIP release OPP-DART-2025-34337 — non-favourable screening results',
        'IRCC ATIP 公开档案 OPP-DART-2025-34337 — 非通过审查结果'
      ),
      outcomeSrcDesc: t(
        'The number of screenings that ended in a non-favourable (failed) result, by nationality and calendar year, January 2019 – July 2025, for the permanent- and temporary-residence streams. It is joined to the referral counts above to give the failure rate in Part Three. Counts are rounded to a multiple of 5, and small counts (1–4) are suppressed and treated as zero, so the rates are lower bounds.',
        '以「非通过」（失败）结果收场的审查次数，按国籍与年度统计，覆盖 2019 年 1 月至 2025 年 7 月，含永久居民与临时居民两条通道。与上面的送审人数相除，得出第三部分的审查失败率。数字四舍五入到 5 的倍数，1–4 之间的小数被隐去；本文将其按零处理，因此各失败率均为下限。'
      ),
      monthlyName: t(
        'IRCC monthly operational update — applications and approvals',
        'IRCC 月度运营更新 — 申请量与获批量'
      ),
      monthlyDesc: t(
        'Monthly operational data by source country; the 2025 full-year totals provide the denominator for the screening rate and the temporary-residence approval and finalized figures.',
        '按来源国统计的月度运营数据，2025 年全年合计为审查率提供分母，并提供临时居民获批与已办结数据。'
      ),
      monthlyFiles: MONTHLY_FILES,
      reportPrompt: t(
        'Spotted a wrong number, an unreadable chart, or disagree with a reading here? Send us the location on the page and what you saw — every correction is logged at the end of the piece.',
        '发现数字有误、图表读不出来，或对文中的解读有异议？请把页面位置和你看到的问题一并告诉我们——每一处更正都会记录在文末。'
      ),
      reportIssue: t('Report an issue on this page', '报告本页问题'),
      footerBrand: t('Opinion · IRCC data commentary', '观点 · IRCC 数据评论'),
    },
  };
}
