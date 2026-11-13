import type { Lang } from '@/content';
import type { Dict } from '@/content/ru';
import { WaitlistForm } from './WaitlistForm';

export function Waitlist({ lang, t }: { lang: Lang; t: Dict }) {
  return (
    <section id="waitlist" aria-labelledby="waitlist-title" className="container-page scroll-mt-6 py-16 md:py-28">
      <h2 id="waitlist-title">{t.waitlist.title}</h2>
      <p className="mt-4 max-w-prose text-ink-soft">{t.waitlist.lead}</p>
      <div className="mt-10">
        <WaitlistForm lang={lang} t={t.waitlist} />
      </div>
    </section>
  );
}
