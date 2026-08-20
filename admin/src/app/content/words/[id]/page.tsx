import { fetchAdmin } from '@/lib/api';
import { notFound } from 'next/navigation';
import Link from 'next/link';

interface Word {
  id: string;
  unitId: string | null;
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
    word = await fetchAdmin(`/admin/words/${id}`, { redirectOnError: false });
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
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const token = document.cookie
              .split('; ')
              .find((row) => row.startsWith('admin_access_token='))
              ?.split('=')[1];
            const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
            await fetch(`${BACKEND_URL}/admin/words/${word.id}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                cyrillic: formData.get('cyrillic'),
                latin: formData.get('latin'),
                translation: formData.get('translation'),
                exampleCyrillic: formData.get('exampleCyrillic') || null,
                exampleTranslation: formData.get('exampleTranslation') || null,
                audioUrl: formData.get('audioUrl') || null,
              }),
            });
            window.location.reload();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cyrillic</label>
            <input name="cyrillic" defaultValue={word.cyrillic} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Latin</label>
            <input name="latin" defaultValue={word.latin} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Translation</label>
            <input name="translation" defaultValue={word.translation} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Example (Cyrillic)</label>
            <input name="exampleCyrillic" defaultValue={word.exampleCyrillic || ''} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Example (Translation)</label>
            <input name="exampleTranslation" defaultValue={word.exampleTranslation || ''} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Audio URL</label>
            <input name="audioUrl" defaultValue={word.audioUrl || ''} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
              Save
            </button>
            <button
              type="button"
              onClick={async () => {
                if (!confirm('Delete this word?')) return;
                const token = document.cookie
                  .split('; ')
                  .find((row) => row.startsWith('admin_access_token='))
                  ?.split('=')[1];
                const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
                await fetch(`${BACKEND_URL}/admin/words/${word.id}`, {
                  method: 'DELETE',
                  headers: { Authorization: `Bearer ${token}` },
                });
                window.location.href = '/content/words';
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
            >
              Delete
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
