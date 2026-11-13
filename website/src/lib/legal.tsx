import { readFileSync } from 'node:fs';
import path from 'node:path';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getDict, isLang, langs, type Lang } from '@/content';
import { Markdown } from './markdown';

export type LegalDoc = 'privacy' | 'terms' | 'cookies' | 'consent' | 'support';

export function legalMetadata(lang: string, doc: LegalDoc): Metadata {
  if (!isLang(lang)) return {};
  const t = getDict(lang);
  return {
    title: t.legal.titles[doc],
    description: t.legal.descriptions[doc],
    alternates: {
      canonical: `/${lang}/${doc}`,
      languages: Object.fromEntries(langs.map((l) => [l, `/${l}/${doc}`])),
    },
  };
}

export function LegalPage({ lang, doc }: { lang: string; doc: LegalDoc }) {
  if (!isLang(lang)) notFound();
  const t = getDict(lang as Lang);
  const source = readFileSync(path.join(process.cwd(), 'src', 'content', 'legal', lang, `${doc}.md`), 'utf8');
  return (
    <article className="container-page py-16 md:py-24">
      {lang === 'en' && (
        <p role="note" className="mb-10 max-w-prose rounded-control bg-paper px-4 py-3 text-[15px] text-ink-soft">
          {t.legal.notice}
        </p>
      )}
      <Markdown source={source} />
    </article>
  );
}
