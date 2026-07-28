'use client';

/**
 * The report body, rendered inside the shared store so it re-renders when the
 * reader flips the language toggle. It reads `data` and `locale` from the store,
 * derives the headline figures, and pulls all prose from the bilingual content
 * module. The presentational Hero/Part/Section furniture stays language-agnostic;
 * only the strings passed into it change with the locale.
 */
import { useViz } from '@/lib/store';
import { getReportContent, type Headline } from '@/content/strings';
import { Hero, Findings, Stat, Part, Section } from '@/components/report/parts';
import { fmtInt, fmtPct } from '@/lib/format';
import type { VizData } from '@/lib/viz-types';
import { ScreeningRateChart } from '@/components/charts/ScreeningRateChart';
import { VolumeCompareChart } from '@/components/charts/VolumeCompareChart';
import { ScreeningScatter } from '@/components/charts/ScreeningScatter';
import { ReferralCompositionPie } from '@/components/charts/ReferralCompositionPie';
import { ChoroplethChart } from '@/components/charts/ChoroplethChart';
import { TrApprovalChart } from '@/components/charts/TrApprovalChart';
import { ApprovalVsScreeningScatter } from '@/components/charts/ApprovalVsScreeningScatter';

/**
 * Headline figures for the masthead, derived from the same rows the charts read
 * so the numbers in the lede foot to the numbers in the plots. The referral rate
 * is pooled 2025 referrals over pooled 2025 applications, matching the national
 * average line in the first chart; the approval rate is IRCC's all-countries
 * total.
 */
function headline(d: VizData): Headline {
  const rows = d.screeningApplications;
  let referred = 0;
  let applications = 0;
  for (const r of rows) {
    referred += r.referred;
    applications += r.applications;
  }
  return {
    referralRate: applications > 0 ? referred / applications : 0,
    nationalities: rows.filter(r => r.referred > 0).length,
    approvalRate: d.trApprovalTotal.rate,
  };
}

export function ReportBody() {
  const { data, locale } = useViz();
  const h = headline(data);
  const atip = data.meta.atip;
  const c = getReportContent(locale, h, atip);

  return (
    <>
      <Hero eyebrow={c.heroEyebrow(atip)} title={c.heroTitle} dek={c.heroDek}>
        <Findings>
          <Stat
            label={c.stats.referral.label}
            value={fmtPct(h.referralRate, 2)}
            note={c.stats.referral.note}
          />
          <Stat
            label={c.stats.approval.label}
            value={fmtPct(h.approvalRate, 1)}
            note={c.stats.approval.note}
          />
          <Stat
            label={c.stats.nationalities.label}
            value={fmtInt(h.nationalities)}
            note={c.stats.nationalities.note}
          />
        </Findings>
        <p className='byline'>{c.byline}</p>
      </Hero>

      <Part kicker={c.part1.kicker} title={c.part1.title} lede={c.part1.lede} />

      <Section n={1} title={c.sections[1].title} intro={c.sections[1].intro}>
        <ScreeningRateChart />
      </Section>

      <Section n={2} title={c.sections[2].title} intro={c.sections[2].intro}>
        <ReferralCompositionPie />
      </Section>

      <Section n={3} title={c.sections[3].title} intro={c.sections[3].intro}>
        <VolumeCompareChart />
      </Section>

      <Section n={4} title={c.sections[4].title} intro={c.sections[4].intro}>
        <ScreeningScatter />
      </Section>

      <Section n={5} title={c.sections[5].title} intro={c.sections[5].intro}>
        <ChoroplethChart />
      </Section>

      <Part kicker={c.part2.kicker} title={c.part2.title} lede={c.part2.lede} />

      <Section n={6} title={c.sections[6].title} intro={c.sections[6].intro}>
        <TrApprovalChart />
      </Section>

      <Section n={7} title={c.sections[7].title} intro={c.sections[7].intro}>
        <ApprovalVsScreeningScatter />
      </Section>

      <footer className='report-footer'>
        <h2>{c.footer.aboutTitle}</h2>
        <p>{c.footer.aboutP1}</p>
        <p>{c.footer.aboutP2}</p>

        <h2>{c.footer.sourcesTitle}</h2>
        <p>{c.footer.sourcesIntro}</p>
        <ul className='data-sources'>
          <li>
            <span className='src-name'>{c.footer.screeningSrcName(atip)}</span>
            <span className='src-desc'>{c.footer.screeningSrcDesc}</span>
            <a
              href='https://open.canada.ca/en/search/ati?search_api_fulltext=1A-2025-08687'
              target='_blank'
              rel='noopener noreferrer'
            >
              open.canada.ca &rarr; ATIP request 1A-2025-08687
            </a>
          </li>
          <li>
            <span className='src-name'>{c.footer.monthlySrcName}</span>
            <span className='src-desc'>{c.footer.monthlySrcDesc}</span>
            <ul className='src-files'>
              {c.footer.monthlyFiles.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </li>
        </ul>
      </footer>
    </>
  );
}
