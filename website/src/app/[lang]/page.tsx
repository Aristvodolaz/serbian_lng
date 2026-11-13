import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Faq } from '@/components/Faq';
import { Hero } from '@/components/Hero';
import { HowItWorks } from '@/components/HowItWorks';
import { JsonLd } from '@/components/JsonLd';
import { Waitlist } from '@/components/Waitlist';
import { getDict, isLang, langs } from '@/content';
import { siteUrl } from '@/lib/site';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const t = getDict(lang).meta;
  // Language alternates only on the home page, where both versions exist.
  return {
    title: { absolute: t.title },
    description: t.description,
    openGraph: { title: t.title, description: t.description },
    alternates: {
      canonical: `/${lang}`,
      languages: Object.fromEntries([...langs.map((l) => [l, `/${l}`]), ['x-default', '/ru']]),
    },
  };
}

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = getDict(lang);

  // Only content that is visible on the page: the FAQ answers below are the same text.
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: t.faq.items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'РЕЧ · REČ',
    url: `${siteUrl}/${lang}`,
    inLanguage: lang,
  };

  return (
    <>
      <JsonLd data={websiteSchema} />
      <JsonLd data={faqSchema} />
      <Hero lang={lang} t={t} />
      <HowItWorks t={t} />
      <Faq t={t} />
      <Waitlist lang={lang} t={t} />
    </>
  );
}
