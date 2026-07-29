'use client';

/**
 * Foot-of-page teaser that links across to the sister page — the report links to
 * the opinion column and the column links back to the report. The banner wears the
 * accent colour of the page it links TO: `to-report` is the report's red (used on
 * the opinion column) and `to-opinion` is the column's blue (used on the report),
 * so each banner previews its destination. All its text stays one light colour in
 * every state. A slow sheen sweeps the band and the arrow nudges, both stilled
 * under prefers-reduced-motion by the rules in globals.css.
 *
 * It scrolls the window to the top on click: these banners sit at the foot of a
 * long page, and the App Router preserves the scroll position across this client
 * navigation, so without this the reader would land halfway down the destination.
 */
import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'react-feather';

export function CrossLinkBanner({
  href,
  tone,
  eyebrow,
  title,
  dek,
  cta,
}: {
  href: string;
  /** Which page the banner links to; sets the band to that page's accent colour. */
  tone: 'to-report' | 'to-opinion';
  eyebrow: ReactNode;
  title: ReactNode;
  dek: ReactNode;
  cta: ReactNode;
}) {
  return (
    <Link
      className={`crosslink crosslink--${tone}`}
      href={href}
      onClick={() => window.scrollTo(0, 0)}
    >
      <span className='crosslink-sheen' aria-hidden />
      <div className='crosslink-body'>
        <span className='crosslink-eyebrow'>{eyebrow}</span>
        <span className='crosslink-title'>{title}</span>
        <span className='crosslink-dek'>{dek}</span>
      </div>
      <span className='crosslink-cta'>
        {cta}
        <ArrowRight className='rn-arrow' size={16} aria-hidden />
      </span>
    </Link>
  );
}
