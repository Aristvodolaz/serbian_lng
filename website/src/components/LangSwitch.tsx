'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Lang } from '@/content';

// Links to the same page in the other language.
export function LangSwitch({ lang, label }: { lang: Lang; label: string }) {
  const other: Lang = lang === 'ru' ? 'en' : 'ru';
  const href = usePathname().replace(/^\/(ru|en)/, `/${other}`);

  return (
    <Link href={href} hrefLang={other} lang={other} aria-label={`${other.toUpperCase()}, ${label}`} className="btn-secondary px-3">
      {other.toUpperCase()}
    </Link>
  );
}
