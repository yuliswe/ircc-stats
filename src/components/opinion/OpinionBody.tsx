'use client';

/**
 * The opinion column body (China vs India), rendered inside the shared store so
 * it reads `data` and `locale` from the provider. It reuses the report's
 * editorial furniture (Hero / Part / Section / Findings) and its own six opinion
 * charts, pulls all prose from the bilingual opinion content module, and derives
 * the masthead figures from the same `profile` / `totals` selectors the charts
 * read, so the numbers in the lede foot to the numbers in the plots.
 */
import { useViz } from '@/lib/store';
import { Hero, Findings, Stat, Part, Section } from '@/components/report/parts';
import { REPO_ISSUES_HREF } from '@/content/strings';
import { getOpinionContent } from '@/content/opinion';
import { profile, totals, fmtPct, fmtPct1, fmtX } from '@/lib/opinion';
import { StreamCompareChart } from '@/components/charts/opinion/StreamCompareChart';
import { WaffleChart } from '@/components/charts/opinion/WaffleChart';
import { GroundsChart } from '@/components/charts/opinion/GroundsChart';
import { CumulativeChart } from '@/components/charts/opinion/CumulativeChart';
import { ScreeningOutcomeChart } from '@/components/charts/opinion/ScreeningOutcomeChart';
import { OutliersScatter } from '@/components/charts/opinion/OutliersScatter';

const ATIP_SEARCH_HREF =
  'https://open.canada.ca/en/search/ati?search_api_fulltext=1A-2025-08687';
const OUTCOME_SEARCH_HREF =
  'https://open.canada.ca/en/search/ati?search_api_fulltext=OPP-DART-2025-34337';

/** Lag-1 failure rate = failures 2020–2025 ÷ referrals 2019–2024. */
const failRate = (r: {
  failures2020to2025: number;
  referrals2019to2024: number;
}): number =>
  r.referrals2019to2024 > 0 ? r.failures2020to2025 / r.referrals2019to2024 : 0;

export function OpinionBody() {
  const { data, locale } = useViz();
  const { atip } = data.meta;
  const c = getOpinionContent(locale);

  const cn = profile(data, 'CHN', locale);
  const inn = profile(data, 'IND', locale);
  const t = totals(data);
  const outCn = data.screeningOutcomes.find(r => r.iso3 === 'CHN');
  const outIn = data.screeningOutcomes.find(r => r.iso3 === 'IND');
  const s = {
    cnRate: fmtPct(cn.rate),
    cnVsIn: fmtX(cn.rate / inn.rate),
    cnVsNat: fmtX(cn.vsNational),
    cnScreenShare: fmtPct(cn.screenShare),
    cnAppShare: fmtPct(cn.applications / t.applications),
    cnApproval: fmtPct1(cn.approvalRate),
    natApproval: fmtPct1(t.approvalRate),
    cnFailRate: outCn ? fmtPct(failRate(outCn)) : '—',
    inFailRate: outIn ? fmtPct(failRate(outIn)) : '—',
    natFailRate: fmtPct(failRate(data.screeningOutcomeTotal)),
  };

  return (
    <>
      <Hero
        eyebrow={c.heroEyebrow(atip)}
        title={c.heroTitle}
        dek={c.heroDek}
        byline={c.heroByline}
      >
        <Findings>
          <Stat
            label={c.stats.rate.label}
            value={s.cnRate}
            note={c.stats.rate.note(s)}
          />
          <Stat
            label={c.stats.share.label}
            value={s.cnScreenShare}
            note={c.stats.share.note(s)}
          />
          <Stat
            label={c.stats.approval.label}
            value={s.cnApproval}
            note={c.stats.approval.note(s)}
          />
          <Stat
            label={c.stats.outcome.label}
            value={s.cnFailRate}
            note={c.stats.outcome.note(s)}
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
        <StreamCompareChart />
      </Section>

      <Section n={2} title={c.sections[2].title} intro={c.sections[2].intro}>
        <WaffleChart />
      </Section>

      <Part
        kicker={c.part2.kicker}
        title={c.part2.title}
        lede={c.part2.lede}
        variant='ink'
      />

      <Section n={3} title={c.sections[3].title} intro={c.sections[3].intro}>
        <GroundsChart />
      </Section>

      <Section n={4} title={c.sections[4].title} intro={c.sections[4].intro}>
        <CumulativeChart />
      </Section>

      <Part
        kicker={c.part3.kicker}
        title={c.part3.title}
        lede={c.part3.lede}
        variant='accent'
      />

      <Section n={5} title={c.sections[5].title} intro={c.sections[5].intro}>
        <ScreeningOutcomeChart />
      </Section>

      <Section n={6} title={c.sections[6].title} intro={c.sections[6].intro}>
        <OutliersScatter />
      </Section>

      <Section n={7} title={c.sections[7].title} intro={c.sections[7].intro}>
        {c.prose}
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
                <span className='src-name'>{c.footer.srcName}</span>
                <span className='src-desc'>{c.footer.srcDesc}</span>
                <a
                  href={ATIP_SEARCH_HREF}
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  open.canada.ca &rarr; ATIP request 1A-2025-08687
                </a>
              </li>
              <li>
                <span className='src-name'>{c.footer.outcomeSrcName}</span>
                <span className='src-desc'>{c.footer.outcomeSrcDesc}</span>
                <a
                  href={OUTCOME_SEARCH_HREF}
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  open.canada.ca &rarr; ATIP request OPP-DART-2025-34337
                </a>
              </li>
              <li>
                <span className='src-name'>{c.footer.monthlyName}</span>
                <span className='src-desc'>{c.footer.monthlyDesc}</span>
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
          <span>{c.footer.footerBrand}</span>
          <span>ATIP {atip}</span>
        </div>
      </footer>
    </>
  );
}
