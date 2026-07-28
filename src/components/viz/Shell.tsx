'use client';

/**
 * App shell (§4): sticky header with the theme toggle and a link to the source
 * repository, the global control row, the charts, and a dismissible
 * selected-country chip. Everything here reads the shared store.
 */
import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useViz } from '@/lib/store';
import { flagName, pick } from '@/lib/i18n';
import { SHELL } from '@/content/strings';

const REPO_URL = 'https://github.com/yuliswe/ircc-stats';

// Auto-hide the utility bar so it stays out of the way while reading but returns
// the moment the reader scrolls back up. THRESHOLD keeps it pinned near the top
// of the page; DELTA ignores sub-pixel jitter and trackpad noise so the bar does
// not flicker.
const HIDE_THRESHOLD = 120;
const SCROLL_DELTA = 8;

// Auto-hide the header on scroll-down and report how far the reader has moved
// through the page, as a 0–1 fraction, so the header can show a progress strip.
// Both derive from the same scroll listener to avoid a second handler.
function useHeaderScroll(): { hidden: boolean; progress: number } {
  const [hidden, setHidden] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;
    const update = () => {
      const doc = document.documentElement;
      const y = window.scrollY;
      const max = doc.scrollHeight - doc.clientHeight;
      setProgress(max > 0 ? Math.min(1, Math.max(0, y / max)) : 0);
      if (Math.abs(y - lastY) > SCROLL_DELTA) {
        setHidden(y > lastY && y > HIDE_THRESHOLD);
        lastY = y;
      }
      ticking = false;
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return { hidden, progress };
}

function SelectionChip() {
  const { selection, select, locale } = useViz();
  if (!selection) return null;
  return (
    <div style={{ marginBottom: '1rem' }}>
      <span className='sel-chip'>
        {pick(locale, SHELL.focused)}{' '}
        {flagName(locale, selection.cit, selection.iso3)}
        <button
          onClick={() => select(null)}
          aria-label={pick(locale, SHELL.clearSelection)}
        >
          ✕
        </button>
      </span>
    </div>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const { data, theme, toggleTheme, locale } = useViz();
  const { hidden: headerHidden, progress } = useHeaderScroll();

  // The language switch is a route change (`/` ↔ `/zh`), not a client toggle.
  // Carry the current query string across so the reader's filters and selection
  // survive the switch; it is read after mount to avoid an SSR/hydration
  // mismatch, so the first paint links to the bare counterpart route.
  const [search, setSearch] = useState('');
  useEffect(() => setSearch(window.location.search), []);
  const otherLocaleHref = (locale === 'zh' ? '/' : '/zh') + search;

  return (
    <>
      <header className={`app-header${headerHidden ? ' is-hidden' : ''}`}>
        <div className='brand'>
          <span className='brand-square' aria-hidden />
          <span className='mark'>{pick(locale, SHELL.brand)}</span>
          <span className='atip'>ATIP {data.meta.atip}</span>
        </div>
        <span className='spacer' />
        <Link
          className='btn'
          href={otherLocaleHref}
          hrefLang={locale === 'zh' ? 'en' : 'zh-Hans'}
          aria-label={pick(locale, SHELL.toggleLangAria)}
        >
          {pick(locale, SHELL.langSwitchTo)}
        </Link>
        <button
          className='btn'
          onClick={toggleTheme}
          aria-label={pick(locale, SHELL.toggleThemeAria)}
        >
          {theme === 'dark'
            ? pick(locale, SHELL.light)
            : pick(locale, SHELL.dark)}
        </button>
        <a
          className='btn'
          href={REPO_URL}
          target='_blank'
          rel='noopener noreferrer'
          aria-label={pick(locale, SHELL.viewSourceAria)}
        >
          <svg
            width='16'
            height='16'
            viewBox='0 0 16 16'
            fill='currentColor'
            aria-hidden='true'
          >
            <path d='M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z' />
          </svg>
          GitHub
        </a>
        <div className='app-progress' aria-hidden>
          <div
            className='app-progress-fill'
            style={{ transform: `scaleX(${progress})` }}
          />
        </div>
      </header>

      <main>
        <SelectionChip />
        {children}
      </main>
    </>
  );
}
