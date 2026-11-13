import Link from 'next/link';
import type { Lang } from '@/content';
import type { Dict } from '@/content/ru';
import { Plate } from './Plate';

export function Hero({ lang, t }: { lang: Lang; t: Dict }) {
  return (
    <section className="container-page grid items-center gap-10 py-10 md:py-20 lg:grid-cols-[7fr_5fr] lg:gap-16">
      <Plate lang={lang} nextLabel={t.hero.next} />
      <div>
        <h1>{t.hero.title}</h1>
        <p className="mt-5 max-w-prose text-ink-soft" style={{ fontSize: 'clamp(1.125rem, 1.06rem + 0.28vw, 1.3125rem)', lineHeight: 1.5 }}>
          {t.hero.lead}
        </p>
        <Link href={`/${lang}#waitlist`} className="btn-primary mt-8 w-full sm:w-auto">
          {t.hero.cta}
        </Link>
      </div>
    </section>
  );
}
