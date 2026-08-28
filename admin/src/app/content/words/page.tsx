import { fetchAdmin } from '@/lib/api';
import Link from 'next/link';
import { CreateWordForm } from '@/components/forms/create-word-form';
import { UploadWordsCsv } from '@/components/forms/upload-words-csv';
import { WordsTable } from '@/components/words-table';
import { AttributeLangToggle } from '@/lib/attribute-lang';
import { WordAttributes } from '@/lib/word-attributes';

interface Word {
  id: string;
  cyrillic: string;
  latin: string;
  translationRu: string;
  translationEn: string;
  exampleTranslationRu: string | null;
  exampleTranslationEn: string | null;
  status: string;
  partOfSpeech: string | null;
  gender: string | null;
  number: string | null;
  declension: string | null;
  conjugation: string | null;
}

interface PaginatedWords {
  data: Word[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default async function WordsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; unitId?: string }>;
}) {
  const sp = await searchParams;
  const page = parseInt(sp.page || '1');
  const urlParams = new URLSearchParams();
  urlParams.set('page', String(page));
  urlParams.set('limit', '20');
  if (sp.unitId) urlParams.set('unitId', sp.unitId);

  const words: PaginatedWords = await fetchAdmin(
    `/admin/words?${urlParams.toString()}`,
  );
  const attributes: WordAttributes = await fetchAdmin('/admin/word-attributes', {
    redirectOnError: false,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Words</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            {words.total} total, page {words.page}/{words.totalPages}
          </span>
          <AttributeLangToggle />
          <UploadWordsCsv unitId={sp.unitId} />
          <CreateWordForm />
        </div>
      </div>

      <WordsTable words={words.data} attributes={attributes} />

      <div className="flex gap-2 mt-4">
        {words.page > 1 && (
          <Link
            href={`/content/words?page=${words.page - 1}${sp.unitId ? `&unitId=${sp.unitId}` : ''}`}
            className="px-3 py-1 bg-white border rounded-lg hover:bg-gray-50 text-sm"
          >
            Previous
          </Link>
        )}
        {words.page < words.totalPages && (
          <Link
            href={`/content/words?page=${words.page + 1}${sp.unitId ? `&unitId=${sp.unitId}` : ''}`}
            className="px-3 py-1 bg-white border rounded-lg hover:bg-gray-50 text-sm"
          >
            Next
          </Link>
        )}
      </div>
    </div>
  );
}
