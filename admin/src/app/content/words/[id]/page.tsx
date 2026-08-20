import { fetchAdmin } from '@/lib/api';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { EditWordForm } from '@/components/forms/admin-forms';

interface Word {
  id: string;
  cyrillic: string;
  latin: string;
  translation: string;
  exampleCyrillic: string | null;
  exampleTranslation: string | null;
  audioUrl: string | null;
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
