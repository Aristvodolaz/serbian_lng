import { fetchAdmin } from '@/lib/api';
import Link from 'next/link';
import { CreateSectionForm, UploadSectionsCsv } from '@/components/forms/section-form';
import { DeleteButton, ContentPublishButton, StatusBadge, PublishAllSectionsButton } from '@/components/forms/admin-forms';

interface Section {
  id: string;
  titleCyrillic: string;
  titleLatin: string;
  titleTranslationRu: string;
  titleTranslationEn: string;
  level: string;
  status: string;
  order: number;
}

interface PaginatedSections {
  data: Section[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default async function SectionsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const sp = await searchParams;
  const page = parseInt(sp.page || '1');
  const sections: PaginatedSections = await fetchAdmin(`/admin/sections?page=${page}&limit=20`);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Sections</h1>
        <div className="flex items-center gap-4">
          <PublishAllSectionsButton />
          <UploadSectionsCsv />
          <CreateSectionForm />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Order</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Cyrillic</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Latin</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Translation RU</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Translation EN</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Level</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sections.data.map((section) => (
              <tr key={section.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3">{section.order}</td>
                <td className="px-4 py-3 font-medium">{section.titleCyrillic}</td>
                <td className="px-4 py-3 text-gray-600">{section.titleLatin}</td>
                <td className="px-4 py-3 text-gray-600">{section.titleTranslationRu}</td>
                <td className="px-4 py-3 text-gray-600">{section.titleTranslationEn}</td>
                <td className="px-4 py-3 text-gray-600">{section.level}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={section.status} />
                    <ContentPublishButton resourceUrl={`/admin/sections/${section.id}`} status={section.status} />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Link href={`/content/sections/${section.id}`} className="text-indigo-600 hover:underline">
                      View
                    </Link>
                    <DeleteButton
                      url={`/admin/sections/${section.id}`}
                      confirmMessage="Delete this section? Its checkpoint lesson, its exercises and all user answers to them will be deleted permanently. Units will be detached, not deleted."
                    />
                  </div>
                </td>
              </tr>
            ))}
            {!sections.data.length && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  No sections yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex gap-2 mt-4">
        {sections.page > 1 && (
          <Link href={`/content/sections?page=${sections.page - 1}`} className="px-3 py-1 bg-white border rounded-lg hover:bg-gray-50 text-sm">
            Previous
          </Link>
        )}
        {sections.page < sections.totalPages && (
          <Link href={`/content/sections?page=${sections.page + 1}`} className="px-3 py-1 bg-white border rounded-lg hover:bg-gray-50 text-sm">
            Next
          </Link>
        )}
      </div>
    </div>
  );
}
