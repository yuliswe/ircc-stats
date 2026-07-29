import type { Metadata } from 'next';
import { OpinionRoot } from '@/components/opinion/OpinionRoot';

export const metadata: Metadata = {
  title: 'Opinion — China vs India | IRCC data commentary',
  description:
    'An opinion column built on IRCC ATIP release 1A-2025-08687: placing China and India side by side to ask whether extra security screening is the norm for Chinese applicants, whether its basis holds up, and what it buys.',
};

export default function OpinionPage() {
  return <OpinionRoot locale='en' />;
}
