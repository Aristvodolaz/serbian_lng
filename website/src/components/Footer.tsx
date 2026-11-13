import Link from 'next/link';
import type { Lang } from '@/content';
import type { Dict } from '@/content/ru';

export function Footer({ lang, t }: { lang: Lang; t: Dict }) {
  const links = [
    [`/${lang}#how`, t.nav.how],
    [`/${lang}#faq`, t.nav.faq],
    [`/${lang}/support`, t.footer.support],
    [`/${lang}/privacy`, t.footer.privacy],
    [`/${lang}/terms`, t.footer.terms],
    [`/${lang}/consent`, t.footer.consent],
    [`/${lang}/cookies`, t.footer.cookies],
  ];

  return (
    <footer className="mt-16 border-t border-line md:mt-28">
      <div className="container-page py-8 md:py-12">
        <nav aria-label={t.footer.label}>
          <ul className="flex flex-col md:flex-row md:flex-wrap md:gap-x-8">
            {links.map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="link text-ink">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <p className="mt-6 text-[15px] text-ink-soft">{t.footer.note}</p>
      </div>
    </footer>
  );
}
