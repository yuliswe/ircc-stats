import vizData from '@/data/generated/viz.json';
import type { VizData } from '@/lib/viz-types';
import { VizProvider } from '@/lib/store';
import { Shell } from '@/components/viz/Shell';
import { OpinionBody } from '@/components/opinion/OpinionBody';
import type { Locale } from '@/lib/i18n';

const data = vizData as unknown as VizData;

/**
 * The opinion column, parameterized by language like the report: `/opinions/china`
 * renders English and `/opinions/china/zh` renders Chinese, each a separately
 * prerendered static page. It shares the report's store and shell — so the theme
 * toggle, the language switch and the Facts/Opinion nav behave identically — and
 * passes the locale straight into the store as a constant for the page's lifetime.
 */
export function OpinionRoot({ locale }: { locale: Locale }) {
  return (
    <VizProvider data={data} locale={locale}>
      <Shell page='opinion'>
        <OpinionBody />
      </Shell>
    </VizProvider>
  );
}
