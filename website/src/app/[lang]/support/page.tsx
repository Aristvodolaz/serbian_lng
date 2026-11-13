import type { Metadata } from 'next';
import { LegalPage, legalMetadata } from '@/lib/legal';

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  return legalMetadata(lang, 'support');
}

export default async function Page({ params }: Props) {
  const { lang } = await params;
  return <LegalPage lang={lang} doc="support" />;
}
