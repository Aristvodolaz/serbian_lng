import { fetchAdmin } from '@/lib/api';
import { CreateBadgeForm } from '@/components/forms/create-badge-form';
import { EditBadgeForm, DeleteBadgeButton } from '@/components/forms/admin-forms';

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
                <DeleteBadgeButton badgeId={badge.id} />
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
