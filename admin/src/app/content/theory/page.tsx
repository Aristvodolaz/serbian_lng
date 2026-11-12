import { fetchAdmin } from '@/lib/api';
import Link from 'next/link';
import { CreateTheoryForm } from '@/components/forms/theory-form';
import {
  DeleteButton,
  ContentPublishButton,
  StatusBadge,
  PublishAllTheoryButton,
} from '@/components/forms/admin-forms';

interface TheoryTopic {
  id: string;
  sectionTitleCyrillic: string;
  titleCyrillic: string;
  titleLatin: string;
  titleTranslationRu: string;
  titleTranslationEn: string;
  status: string;
  order: number;
}

interface PaginatedTheory {
  data: TheoryTopic[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface SectionOption {
  id: string;
  titleCyrillic: string;
}

export default async function TheoryPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const sp = await searchParams;
  const page = Number.parseInt(sp.page || '1', 10) || 1;
  const [theory, sectionsRes] = await Promise.all([
    fetchAdmin<PaginatedTheory>(`/admin/theory?page=${page}&limit=20`),
    fetchAdmin<{ data: SectionOption[] }>('/admin/sections?limit=100'),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Theory</h1>
          <PublishAllTheoryButton />
        </div>
        <span className="text-sm text-gray-500">{theory.total} topics</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Order</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Section</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Cyrillic</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Latin</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {theory.data.map((t) => (
              <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3">{t.order}</td>
                <td className="px-4 py-3 text-gray-600">{t.sectionTitleCyrillic}</td>
                <td className="px-4 py-3 font-medium">{t.titleCyrillic}</td>
                <td className="px-4 py-3 text-gray-600">{t.titleLatin}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={t.status} />
                    <ContentPublishButton resourceUrl={`/admin/theory/${t.id}`} status={t.status} />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Link href={`/content/theory/${t.id}`} className="text-indigo-600 hover:underline">
                      Edit
                    </Link>
                    <DeleteButton
                      url={`/admin/theory/${t.id}`}
                      confirmMessage="Delete this theory topic permanently?"
                    />
                  </div>
                </td>
              </tr>
            ))}
            {!theory.data.length && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No theory topics yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex gap-2 mt-4">
        {theory.page > 1 && (
          <Link href={`/content/theory?page=${theory.page - 1}`} className="px-3 py-1 bg-white border rounded-lg hover:bg-gray-50 text-sm">
            Previous
          </Link>
        )}
        {theory.page < theory.totalPages && (
          <Link href={`/content/theory?page=${theory.page + 1}`} className="px-3 py-1 bg-white border rounded-lg hover:bg-gray-50 text-sm">
            Next
          </Link>
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-3">Add theory topic</h2>
        <CreateTheoryForm sections={sectionsRes.data} />
      </div>
    </div>
  );
}
