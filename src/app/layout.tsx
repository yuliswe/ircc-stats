import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
  title: 'IRCC Report 2025',
  description:
    'Whether applicants of certain nationalities are disproportionately referred to CBSA/CSIS for comprehensive security screening, from IRCC ATIP request 1A-2025-08687.',
};

// GA4 Measurement ID for the irccreport.ca data stream. Defaults to the
// production stream but can be overridden at build time via NEXT_PUBLIC_GA_ID
// (e.g. to point a fork at a different property). `||` rather than `??` so an
// empty env value from an unset CI variable still falls back to the default.
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-E4Z9V2NCBX';

// Only emit the analytics script in production builds so local `next dev`
// sessions do not pollute the analytics data.
const ANALYTICS_ENABLED = process.env.NODE_ENV === 'production';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en'>
      <body>
        {children}
        {ANALYTICS_ENABLED ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy='afterInteractive'
            />
            <Script id='google-analytics' strategy='afterInteractive'>
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}');
              `}
            </Script>
          </>
        ) : null}
      </body>
    </html>
  );
}
