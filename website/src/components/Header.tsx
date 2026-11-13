import Link from 'next/link';
import type { Lang } from '@/content';
import type { Dict } from '@/content/ru';
import { LangSwitch } from './LangSwitch';

export function Header({ lang, t }: { lang: Lang; t: Dict }) {
  return (
    <header className="border-b border-line">
      <nav aria-label={t.nav.label} className="container-page flex min-h-[72px] items-center gap-2 md:gap-6">
        <Link
          href={`/${lang}`}
          className="mr-auto inline-flex min-h-11 items-center font-display text-[22px] font-bold leading-none text-ink no-underline"
        >
          <span lang="sr">РЕЧ · REČ</span>
        </Link>
        {/* On phones these two anchors live in the footer instead of a burger menu. */}
        <Link href={`/${lang}#how`} className="link hidden text-ink no-underline hover:underline md:inline-flex">
          {t.nav.how}
        </Link>
        <Link href={`/${lang}#faq`} className="link hidden text-ink no-underline hover:underline md:inline-flex">
          {t.nav.faq}
        </Link>
        <LangSwitch lang={lang} label={t.nav.otherLang} />
        <Link href={`/${lang}#waitlist`} className="btn-primary px-4 md:px-6">
          {t.nav.cta}
        </Link>
      </nav>
    </header>
  );
}
