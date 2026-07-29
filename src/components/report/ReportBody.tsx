'use client';

/**
 * The report body, rendered inside the shared store so it re-renders when the
 * reader flips the language toggle. It reads `data` and `locale` from the store,
 * derives the headline figures, and pulls all prose from the bilingual content
 * module. The presentational Hero/Part/Section furniture stays language-agnostic;
 * only the strings passed into it change with the locale.
 */
import { useViz } from '@/lib/store';
import {
  getReportContent,
  type Headline,
  SHELL,
  REPO_ISSUES_HREF,
} from '@/content/strings';
import { Hero, Findings, Stat, Part, Section } from '@/components/report/parts';
import { pick } from '@/lib/i18n';
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
 * total. The two leaders are the single nationalities that top the approval and
 * screening rows, each carrying its own winning count for the masthead tiles.
 * The approval leader is ranked by total admissions — temporary-residence
 * approvals plus permanent residents actually admitted (CoPRs issued) — joined
 * to the TR rows by ISO3, so a country with no matching CoPR row contributes
 * only its TR approvals.
 */
function headline(d: VizData): Headline {
  const rows = d.screeningApplications;
  let referred = 0;
  let applications = 0;
  for (const r of rows) {
    referred += r.referred;
    applications += r.applications;
  }
  const coprByIso3 = new Map(
    d.coprByCountry.filter(r => r.iso3).map(r => [r.iso3, r.coprIssued])
  );
  const admissions = (r: (typeof d.trApprovals)[number]) =>
    r.approved + (r.iso3 ? (coprByIso3.get(r.iso3) ?? 0) : 0);
  const topApproval = d.trApprovals.reduce((best, r) =>
    admissions(r) > admissions(best) ? r : best
  );
  const topScreening = rows.reduce((best, r) =>
    r.referred > best.referred ? r : best
  );
  return {
    referralRate: applications > 0 ? referred / applications : 0,
    approvalRate: d.trApprovalTotal.rate,
    topApproval: {
      cit: topApproval.cit,
      iso3: topApproval.iso3,
      count: admissions(topApproval),
    },
    topScreening: {
      cit: topScreening.cit,
      iso3: topScreening.iso3,
      count: topScreening.referred,
    },
  };
}

export function ReportBody() {
  const { data, locale } = useViz();
  const h = headline(data);
  const atip = data.meta.atip;
  const c = getReportContent(locale, h, atip);

  return (
    <>
      <Hero
        eyebrow={c.heroEyebrow(atip)}
        title={c.heroTitle}
        dek={c.heroDek}
        byline={c.byline}
      >
        <Findings>
          <Stat
            label={c.stats.referral.label}
            value={fmtPct(h.referralRate, 2)}
            note={c.stats.referral.note}
          />
          <Stat
            label={c.stats.approval.label}
            value={fmtInt(h.topApproval.count)}
            note={c.stats.approval.note}
          />
          <Stat
            label={c.stats.screening.label}
            value={fmtInt(h.topScreening.count)}
            note={c.stats.screening.note}
          />
        </Findings>
      </Hero>

      <Part
        kicker={c.part1.kicker}
        title={c.part1.title}
        lede={c.part1.lede}
        variant='accent'
      />

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

      <Part
        kicker={c.part2.kicker}
        title={c.part2.title}
        lede={c.part2.lede}
        variant='ink'
      />

      <Section n={5} title={c.sections[5].title} intro={c.sections[5].intro}>
        <ChoroplethChart />
      </Section>

      <Section n={6} title={c.sections[6].title} intro={c.sections[6].intro}>
        <TrApprovalChart />
      </Section>

      <Section n={7} title={c.sections[7].title} intro={c.sections[7].intro}>
        <ApprovalVsScreeningScatter />
      </Section>

      <footer className='report-footer' id='about'>
        <div className='footer-grid'>
          <div className='footer-col'>
            <h2>{c.footer.aboutTitle}</h2>
            <p>{c.footer.aboutP1}</p>
            <p>{c.footer.aboutP2}</p>
          </div>
          <div className='footer-col'>
            <h2>{c.footer.sourcesTitle}</h2>
            <p>{c.footer.sourcesIntro}</p>
            <ul className='data-sources'>
              <li>
                <span className='src-name'>
                  {c.footer.screeningSrcName(atip)}
                </span>
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
          </div>
        </div>
        <div className='footer-report'>
          <p className='footer-report-prompt'>{c.footer.reportPrompt}</p>
          <a
            className='footer-report-issue'
            href={REPO_ISSUES_HREF}
            target='_blank'
            rel='noopener noreferrer'
          >
            {c.footer.reportIssue}
          </a>
        </div>
        <div className='footer-bar'>
          <span>{pick(locale, SHELL.brand)}</span>
          <span>ATIP {atip}</span>
        </div>
      </footer>
    </>
  );
}
