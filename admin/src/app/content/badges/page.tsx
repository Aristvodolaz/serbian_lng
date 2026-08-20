import { fetchAdmin } from '@/lib/api';

interface Badge {
  id: string;
  code: string;
  titleCyrillic: string;
  titleLatin: string;
  description: string;
}

export default async function BadgesPage() {
  const badges: Badge[] = await fetchAdmin('/admin/badges');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Badges</h1>
        <CreateBadgeForm />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {badges.map((badge) => (
          <div key={badge.id} className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold">{badge.titleCyrillic} / {badge.titleLatin}</h3>
                <p className="text-xs text-gray-500 font-mono">{badge.code}</p>
              </div>
              <div className="flex gap-2">
                <EditBadgeForm badge={badge} />
                <button
                  onClick={async () => {
                    if (!confirm('Delete this badge?')) return;
                    const token = document.cookie
                      .split('; ')
                      .find((row) => row.startsWith('admin_access_token='))
                      ?.split('=')[1];
                    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
                    await fetch(`${BACKEND_URL}/admin/badges/${badge.id}`, {
                      method: 'DELETE',
                      headers: { Authorization: `Bearer ${token}` },
                    });
                    window.location.reload();
                  }}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600">{badge.description}</p>
            <a
              href={`/admin/api/badges/${badge.id}/earners`}
              className="text-indigo-600 hover:underline text-sm mt-2 inline-block"
            >
              View earners
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

function CreateBadgeForm() {
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
        await fetch(`${BACKEND_URL}/admin/badges`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            code: formData.get('code'),
            titleCyrillic: formData.get('titleCyrillic'),
            titleLatin: formData.get('titleLatin'),
            description: formData.get('description'),
          }),
        });
        window.location.reload();
      }}
      className="flex gap-2"
    >
      <input name="code" placeholder="Code" required className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
      <input name="titleCyrillic" placeholder="Cyrillic" required className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
      <input name="titleLatin" placeholder="Latin" required className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
      <input name="description" placeholder="Description" required className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
      <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
        Add Badge
      </button>
    </form>
  );
}

function EditBadgeForm({ badge }: { badge: Badge }) {
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
        await fetch(`${BACKEND_URL}/admin/badges/${badge.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            titleCyrillic: formData.get('titleCyrillic'),
            titleLatin: formData.get('titleLatin'),
            description: formData.get('description'),
          }),
        });
        window.location.reload();
      }}
      className="flex gap-1"
    >
      <input name="titleCyrillic" defaultValue={badge.titleCyrillic} className="px-2 py-1 border border-gray-200 rounded text-xs w-20" />
      <input name="titleLatin" defaultValue={badge.titleLatin} className="px-2 py-1 border border-gray-200 rounded text-xs w-20" />
      <button type="submit" className="px-2 py-1 bg-gray-600 text-white rounded text-xs">
        Save
      </button>
    </form>
  );
}
