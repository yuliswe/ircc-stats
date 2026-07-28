import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
  title: 'IRCC Report 2025',
  description:
    'Whether applicants of certain nationalities are disproportionately referred to security screening, from IRCC ATIP request 1A-2025-08687.',
};

// GA4 Measurement ID (e.g. G-XXXXXXXXXX) for the irccreport.ca data stream.
// Inlined at build time from the environment; when unset, no analytics script
// is emitted so local dev and previews stay untracked.
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en'>
      <body>
        {children}
        {GA_MEASUREMENT_ID ? (
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
