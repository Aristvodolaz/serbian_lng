import { fetchAdmin } from '@/lib/api';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { EditWordForm } from '@/components/forms/admin-forms';

interface Word {
  id: string;
  cyrillic: string;
  latin: string;
  translationRu: string;
  translationEn: string;
  exampleCyrillic: string | null;
  exampleTranslationRu: string | null;
  exampleTranslationEn: string | null;
  audioUrl: string | null;
  partOfSpeech: string | null;
  gender: string | null;
  number: string | null;
  declension: string | null;
  conjugation: string | null;
  imageUrl: string | null;
  status: string;
}

export default async function WordDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let word: Word;
  try {
    word = await fetchAdmin<Word>(`/admin/words/${id}`, { redirectOnError: false });
  } catch {
    notFound();
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/content/words" className="text-indigo-600 hover:underline text-sm">
          ← Back to Words
        </Link>
        <h1 className="text-2xl font-bold">{word.cyrillic} / {word.latin}</h1>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 max-w-2xl">
        <EditWordForm word={word} />
      </div>
    </div>
  );
}
