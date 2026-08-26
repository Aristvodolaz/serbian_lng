import { fetchAdmin } from '@/lib/api';
import Link from 'next/link';
import { CreateWordForm } from '@/components/forms/create-word-form';
import { UploadWordsCsv } from '@/components/forms/upload-words-csv';

interface Word {
  id: string;
  cyrillic: string;
  latin: string;
  translationRu: string;
  translationEn: string;
  exampleTranslationRu: string | null;
  exampleTranslationEn: string | null;
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Words</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            {words.total} total, page {words.page}/{words.totalPages}
          </span>
          <UploadWordsCsv unitId={sp.unitId} />
          <CreateWordForm />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Cyrillic</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Latin</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Translation RU</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Translation EN</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Example Translation RU</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Example Translation EN</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {words.data.map((word) => (
              <tr key={word.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{word.cyrillic}</td>
                <td className="px-4 py-3 text-gray-600">{word.latin}</td>
                <td className="px-4 py-3 text-gray-600">{word.translationRu}</td>
                <td className="px-4 py-3 text-gray-600">{word.translationEn}</td>
                <td className="px-4 py-3 text-gray-600">{word.exampleTranslationRu ?? ''}</td>
                <td className="px-4 py-3 text-gray-600">{word.exampleTranslationEn ?? ''}</td>
                <td className="px-4 py-3">
                  <Link href={`/content/words/${word.id}`} className="text-indigo-600 hover:underline">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
