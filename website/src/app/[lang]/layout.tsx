import type { Metadata } from 'next';
import { Golos_Text, Sofia_Sans_Condensed } from 'next/font/google';
import { notFound } from 'next/navigation';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { getDict, isLang, langs } from '@/content';
import { siteUrl } from '@/lib/site';
import '../globals.css';

const display = Sofia_Sans_Condensed({
  subsets: ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext'],
  weight: ['600', '700'],
  variable: '--font-display',
  display: 'swap',
});

const text = Golos_Text({
  subsets: ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext'],
  weight: ['400', '500', '600'],
  variable: '--font-text',
  display: 'swap',
});

type Props = { children: React.ReactNode; params: Promise<{ lang: string }> };

export const generateStaticParams = () => langs.map((lang) => ({ lang }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  // Language-neutral defaults: the 404 page inherits these, and each real page sets its own title and description.
  return {
    metadataBase: new URL(siteUrl),
    title: { default: 'РЕЧ · REČ', template: '%s — РЕЧ · REČ' },
    icons: { icon: '/icon.svg' },
    openGraph: { siteName: 'РЕЧ · REČ', locale: lang === 'ru' ? 'ru_RU' : 'en_US', type: 'website' },
  };
}

export default async function RootLayout({ children, params }: Props) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = getDict(lang);

  return (
    <html lang={lang} className={`${display.variable} ${text.variable}`}>
      <body>
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-control focus:bg-paper focus:px-4 focus:py-3"
        >
          {t.skipToContent}
        </a>
        <Header lang={lang} t={t} />
        <main id="content">{children}</main>
        <Footer lang={lang} t={t} />
      </body>
    </html>
  );
}
