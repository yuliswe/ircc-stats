'use client';

/**
 * App shell (§4): sticky header with the theme toggle and a link to the source
 * repository, the global control row, the charts, and a dismissible
 * selected-country chip. Everything here reads the shared store.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { GitHub, Moon, Sun } from 'react-feather';
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

export function Shell({
  children,
  page = 'report',
}: {
  children: ReactNode;
  /** Which section is active, so the Facts/Opinion nav marks the current page. */
  page?: 'report' | 'opinion';
}) {
  const { data, theme, toggleTheme, locale } = useViz();
  const { hidden: headerHidden, progress } = useHeaderScroll();

  // The language switch is a route change, not a client toggle. On the report it
  // swaps `/` ↔ `/zh` and carries the query string across so the reader's filters
  // and selection survive; it is read after mount to avoid an SSR/hydration
  // mismatch, so the first paint links to the bare counterpart route. The opinion
  // column is Chinese-only, so its language button leads to the English report
  // instead of an English opinion that does not exist.
  const [search, setSearch] = useState('');
  useEffect(() => setSearch(window.location.search), []);

  // Report and opinion each have an English and a Chinese route; the section nav
  // and language switch stay within their own section and follow the reader's
  // current language.
  const factsHref = locale === 'zh' ? '/zh' : '/';
  const opinionHref =
    locale === 'zh' ? '/opinions/china/zh' : '/opinions/china';
  const otherLocaleHref =
    page === 'opinion'
      ? locale === 'zh'
        ? '/opinions/china'
        : '/opinions/china/zh'
      : (locale === 'zh' ? '/' : '/zh') + search;

  return (
    <>
      <header className={`app-header${headerHidden ? ' is-hidden' : ''}`}>
        <div className='header-inner'>
          <div className='brand'>
            <span className='brand-square' aria-hidden />
            <span className='mark'>{pick(locale, SHELL.wordmark)}</span>
            <span className='atip'>ATIP {data.meta.atip}</span>
          </div>
          <nav className='app-nav' aria-label={pick(locale, SHELL.navAria)}>
            <Link
              href={factsHref}
              aria-current={page === 'report' ? 'page' : undefined}
            >
              {pick(locale, SHELL.navFacts)}
            </Link>
            <Link
              href={opinionHref}
              aria-current={page === 'opinion' ? 'page' : undefined}
            >
              {pick(locale, SHELL.navOpinion)}
            </Link>
          </nav>
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
            <span className='btn-icon' aria-hidden>
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </span>
            <span className='btn-label'>
              {theme === 'dark'
                ? pick(locale, SHELL.light)
                : pick(locale, SHELL.dark)}
            </span>
          </button>
          <a
            className='btn'
            href={REPO_URL}
            target='_blank'
            rel='noopener noreferrer'
            aria-label={pick(locale, SHELL.viewSourceAria)}
          >
            <span className='btn-icon' aria-hidden>
              <GitHub size={16} />
            </span>
            <span className='btn-label'>GitHub</span>
          </a>
        </div>
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
