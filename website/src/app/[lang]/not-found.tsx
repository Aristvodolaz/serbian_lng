'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getDict } from '@/content';

// not-found gets no params, so the language comes from the path.
export default function NotFound() {
  const lang = usePathname().startsWith('/en') ? 'en' : 'ru';
  const t = getDict(lang).notFound;

  return (
    <div className="container-page py-16 md:py-28">
      <h1>{t.title}</h1>
      <p className="mt-4 max-w-prose text-ink-soft">{t.text}</p>
      <Link href={`/${lang}`} className="btn-primary mt-8">
        {t.home}
      </Link>
    </div>
  );
}
