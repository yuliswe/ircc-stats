import vizData from '@/data/generated/viz.json';
import type { VizData } from '@/lib/viz-types';
import { VizProvider } from '@/lib/store';
import { Shell } from '@/components/viz/Shell';
import { ReportBody } from '@/components/report/ReportBody';
import type { Locale } from '@/lib/i18n';

const data = vizData as unknown as VizData;

/**
 * The whole report, parameterized by language. Language lives in the route: `/`
 * renders this with English and `/zh` with Chinese, each as a separately
 * prerendered static page. The locale is passed straight into the store, which
 * treats it as a constant for the page's lifetime.
 */
export function ReportRoot({ locale }: { locale: Locale }) {
  return (
    <VizProvider data={data} locale={locale}>
      <Shell>
        <ReportBody />
      </Shell>
    </VizProvider>
  );
}
