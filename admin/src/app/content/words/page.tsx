import { fetchAdmin } from '@/lib/api';
import Link from 'next/link';

interface Word {
  id: string;
  unitId: string | null;
  cyrillic: string;
  latin: string;
  translation: string;
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
          <CreateWordForm />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Cyrillic</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Latin</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Translation</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {words.data.map((word) => (
              <tr key={word.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{word.cyrillic}</td>
                <td className="px-4 py-3 text-gray-600">{word.latin}</td>
                <td className="px-4 py-3 text-gray-600">{word.translation}</td>
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

function CreateWordForm() {
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const token = document.cookie
          .split('; ')
          .find((row) => row.startsWith('admin_access_token='))
          ?.split('=')[1];
        const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
        await fetch(`${BACKEND_URL}/admin/words`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            cyrillic: formData.get('cyrillic'),
            latin: formData.get('latin'),
            translation: formData.get('translation'),
          }),
        });
        window.location.reload();
      }}
      className="flex gap-2"
    >
      <input name="cyrillic" placeholder="Cyrillic" required className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
      <input name="latin" placeholder="Latin" required className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
      <input name="translation" placeholder="Translation" required className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
      <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
        Add Word
      </button>
    </form>
  );
}
