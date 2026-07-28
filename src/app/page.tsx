import vizData from '@/data/generated/viz.json';
import type { VizData } from '@/lib/viz-types';
import { VizProvider } from '@/lib/store';
import { Shell } from '@/components/viz/Shell';
import { Hero, Findings, Stat, Part, Section } from '@/components/report/parts';
import { fmtInt, fmtPct } from '@/lib/format';
import { ScreeningRateChart } from '@/components/charts/ScreeningRateChart';
import { VolumeCompareChart } from '@/components/charts/VolumeCompareChart';
import { ScreeningScatter } from '@/components/charts/ScreeningScatter';
import { ReferralCompositionPie } from '@/components/charts/ReferralCompositionPie';
import { ChoroplethChart } from '@/components/charts/ChoroplethChart';
import { TrApprovalChart } from '@/components/charts/TrApprovalChart';
import { ApprovalVsScreeningScatter } from '@/components/charts/ApprovalVsScreeningScatter';
// Charts 8 onward are hidden for now. The imports and render are kept commented
// so the sections can be restored without rebuilding them.
// import { EnrichmentChart } from '@/components/charts/EnrichmentChart';
// import { CompositionChart } from '@/components/charts/CompositionChart';
// import { OfficeHeatmap } from '@/components/charts/OfficeHeatmap';
// import { ReferralScatter } from '@/components/charts/ReferralScatter';
// import { HierarchyExplorer } from '@/components/charts/HierarchyExplorer';

const data = vizData as unknown as VizData;

/**
 * Headline figures for the masthead, derived from the same rows the charts read
 * so the numbers in the lede foot to the numbers in the plots. The referral rate
 * is pooled 2025 referrals over pooled 2025 applications, matching the national
 * average line in the first chart; the approval rate is IRCC's all-countries
 * total.
 */
function headline(d: VizData) {
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

export default function Page() {
  const h = headline(data);

  return (
    <VizProvider data={data}>
      <Shell>
        <Hero
          atip={data.meta.atip}
          title='Who Canada screens, and who it lets in'
          dek={
            <>
              Almost everyone who applies to enter Canada can be referred for
              security screening before a decision is reached. Drawing on a
              records release obtained under the Access to Information Act, this
              report asks whether that referral falls evenly across
              nationalities, how the pattern looks on a map, and how it lines up
              with who is ultimately approved.
            </>
          }
        >
          <Findings>
            <Stat
              label='National referral rate'
              value={fmtPct(h.referralRate, 2)}
              note='of 2025 applicants sent to some security screening'
            />
            <Stat
              label='TR approval rate'
              value={fmtPct(h.approvalRate, 1)}
              note='of processed temporary-residence applications, 2025'
            />
            <Stat
              label='Nationalities'
              value={fmtInt(h.nationalities)}
              note='with a 2025 referral rate on record'
            />
          </Findings>
          <p className='byline'>
            Built from IRCC ATIP release {data.meta.atip}, covering security
            screenings initiated between 2019 and 2025, alongside 2025
            application and approval totals from IRCC&rsquo;s published
            operational figures. Every count is OCR output from the released
            PDF, corrected and reconciled against the printed tables. A
            disproportion in referral rates is an observed pattern in the
            records, not evidence of intent by any office or of wrongdoing by
            any applicant. Definitions and caveats sit behind the{' '}
            <b>Methodology</b> button in the header, and every chart can be read
            as a data table through its own <b>View as table</b> toggle.
          </p>
        </Hero>

        <Part
          kicker='Part I'
          title='Who gets referred to screening'
          lede={
            <>
              Screening referrals are counted here across every activity type in
              the release, from routine checks to the serious categories. The
              five views below move from a single per-nationality rate outward
              to the whole world, each one guarding against the easy mistake of
              reading a large count as a high rate.
            </>
          }
        />

        <Section
          n={1}
          title='How often is each nationality referred?'
          intro={
            <p>
              The fairest way to ask whether one nationality is screened more
              than another is to divide each nationality&rsquo;s referrals by
              its own volume of applications. That share, measured against the
              national average of <b>{fmtPct(h.referralRate, 2)}</b>, is the
              report&rsquo;s headline. A bar past the line marks a nationality
              whose applicants were referred more often than the average
              applicant to Canada, and a bar short of it, less often. Because
              the measure is a rate rather than a count, a small source country
              and a large one are compared on the same footing.
            </p>
          }
        >
          <ScreeningRateChart />
        </Section>

        <Section
          n={2}
          title='Who are the referrals, though?'
          intro={
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
          }
        >
          <ReferralCompositionPie />
        </Section>

        <Section
          n={3}
          title='Volume against scrutiny, side by side'
          intro={
            <p>
              Placing applications and referrals next to each other makes the
              gap between volume and scrutiny concrete. India files far more
              applications than China, yet China is referred to comprehensive
              security screening far more often, which is exactly the
              disproportion the rate in the first chart captures. Each row is
              read straight across, and the two panels use independent scales,
              so a bar in one panel is not comparable in length to a bar in the
              other.
            </p>
          }
        >
          <VolumeCompareChart />
        </Section>

        <Section
          n={4}
          title='Every nationality at once'
          intro={
            <p>
              Widening from a handful of countries to all of them, this scatter
              plots each nationality by its total applications against the
              screenings those applications produced. The diagonal is the
              national-average screening rate, so a country above it is screened
              more than its volume alone would predict and one below it less.
              Both axes are logarithmic, which keeps countries spanning three
              orders of magnitude of volume legible on the same plot.
            </p>
          }
        >
          <ScreeningScatter />
        </Section>

        <Section
          n={5}
          title='Where the admissions come from'
          intro={
            <p>
              Mapped geographically, the volume of admissions traces a pattern
              that is easier to read than a ranked list. Countries are shaded by
              the number of Confirmation-of-Permanent- Residence documents
              issued to their nationals in 2025, so the darkest countries are
              those Canada admitted the most permanent residents from. Because
              those counts span several orders of magnitude, the shading is on a
              logarithmic scale.
            </p>
          }
        >
          <ChoroplethChart />
        </Section>

        <Part
          kicker='Part II'
          title='Who gets approved'
          lede={
            <>
              Screening is a step on the way to a decision, not the decision
              itself. The release pairs naturally with IRCC&rsquo;s published
              approval figures, which let us ask a second question: once the
              sheer volume of applications is set aside, which nationalities are
              actually approved, and does heavy screening travel with refusal?
            </>
          }
        />

        <Section
          n={6}
          title='How often is each nationality approved?'
          intro={
            <p>
              Approval is the outcome that matters most to an applicant. This
              chart shows the share of each nationality&rsquo;s processed
              temporary-residence applications that IRCC approved in 2025,
              measured against the national average of{' '}
              <b>{fmtPct(h.approvalRate, 1)}</b>. Bars above the line clear it
              more often than the average applicant, and bars below it less
              often.
            </p>
          }
        >
          <TrApprovalChart />
        </Section>

        <Section
          n={7}
          title='Does screening travel with refusal?'
          intro={
            <p>
              The final view sets the two questions against each other, plotting
              each nationality&rsquo;s screening rate on one axis and its
              approval rate on the other. If the nationalities screened most
              heavily were also refused most often, the dots would trend
              together; the color encodes the ratio of the two rates so that the
              exceptions stand out, whether a nationality is approved far more
              often than it is screened or screened nearly as often as it is
              approved. This is where the screening story and the approval story
              either reinforce each other or come apart.
            </p>
          }
        >
          <ApprovalVsScreeningScatter />
        </Section>

        {/* Hidden from the 8th chart onward:
        <EnrichmentChart />
        <div className="grid-2">
          <CompositionChart />
          <OfficeHeatmap />
        </div>
        <ReferralScatter />
        <HierarchyExplorer />
        */}

        <footer className='report-footer'>
          <h2>About this report</h2>
          <p>
            The figures come from IRCC ATIP release {data.meta.atip}, a 76-page
            scanned records release of security-screening counts initiated
            between 2019 and 2025, broken down by stream, screening activity
            type, citizenship, and processing office. The 2025 application and
            approval totals are IRCC&rsquo;s own published operational figures.
            Counts were OCR-extracted and then reconciled against the printed
            tables so that every roll-up foots; where a cell was withheld under
            the Act or a printed group did not foot, a
            reconciliation-placeholder row carries the gap and each chart
            footnotes how many it includes.
          </p>
          <p>
            A referral rate is a share of applications, not a judgement of any
            application. The patterns here describe how referrals and approvals
            were distributed across nationalities in the records, and nothing in
            the release speaks to the reasons behind an individual decision.
            Full definitions, the serious-type mapping, and the residual
            limitations are in the Methodology panel, reachable from the header.
          </p>

          <h2>Data sources &amp; attribution</h2>
          <p>
            Every figure on this page comes from public records published by
            Immigration, Refugees and Citizenship Canada, and the underlying
            datasets are listed below so that each chart can be traced back to
            its origin. The Government of Canada material is used under the{' '}
            <a
              href='https://open.canada.ca/en/open-government-licence-canada'
              target='_blank'
              rel='noopener noreferrer'
            >
              Open Government Licence &ndash; Canada
            </a>
            , and this report is not affiliated with or endorsed by IRCC or the
            Government of Canada.
          </p>
          <ul className='data-sources'>
            <li>
              <span className='src-name'>
                IRCC ATIP release {data.meta.atip} &mdash; Security screenings
              </span>
              <span className='src-desc'>
                Counts of security screenings initiated between
                January&nbsp;1,&nbsp;2019 and December&nbsp;31,&nbsp;2025,
                broken down by application stream, screening activity type,
                citizenship, and processing office. Obtained under the Access to
                Information Act as a 76-page image-only scan, then OCR-extracted
                and reconciled against the printed tables. Feeds the screening
                charts in Part&nbsp;I.
              </span>
              <a
                href='https://open.canada.ca/en/search/ati?search_api_fulltext=1A-2025-08687'
                target='_blank'
                rel='noopener noreferrer'
              >
                open.canada.ca &rarr; ATIP request 1A-2025-08687
              </a>
            </li>
            <li>
              <span className='src-name'>
                IRCC monthly operational updates &mdash; application volumes
                &amp; approvals
              </span>
              <span className='src-desc'>
                Monthly operational counts by source country, published as
                open-data workbooks in the{' '}
                <a
                  href='https://open.canada.ca/data/en/dataset/9b34e712-513f-44e9-babf-9df4f7256550'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  Operational Processing &ndash; Monthly IRCC Updates
                </a>{' '}
                dataset. The 2025 per-year totals supply the application
                denominators behind the referral rates and the
                temporary-residence approval figures in Part&nbsp;II. Five
                workbooks are used:
              </span>
              <ul className='src-files'>
                <li>
                  PR Intake &mdash; permanent-residence applications received
                </li>
                <li>
                  TRV Intake &mdash; temporary-resident-visa applications
                  received
                </li>
                <li>
                  SP Processed &mdash; study-permit applications finalized
                </li>
                <li>
                  TR Approved &mdash; temporary-residence applications approved
                </li>
                <li>
                  TR Processed &mdash; temporary-residence applications
                  finalized
                </li>
              </ul>
            </li>
          </ul>
        </footer>
      </Shell>
    </VizProvider>
  );
}
