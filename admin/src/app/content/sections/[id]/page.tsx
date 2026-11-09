import { fetchAdmin } from '@/lib/api';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { EditSectionForm } from '@/components/forms/section-form';
import { DeleteButton, ContentPublishButton, StatusBadge } from '@/components/forms/admin-forms';

interface Lesson {
  id: string;
  title: string;
  kind: string;
  status: string;
}

interface Unit {
  id: string;
  titleCyrillic: string;
  titleLatin: string;
  status: string;
  order: number;
  lessons?: Lesson[];
}

interface Section {
  id: string;
  titleCyrillic: string;
  titleLatin: string;
  titleTranslationRu: string;
  titleTranslationEn: string;
  level: string;
  status: string;
  order: number;
  units?: Unit[];
}

export default async function SectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let section: Section;
  try {
    section = await fetchAdmin(`/admin/sections/${id}`, { redirectOnError: false });
  } catch {
    notFound();
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/content/sections" className="text-indigo-600 hover:underline text-sm">
          ← Back to Sections
        </Link>
        <h1 className="text-2xl font-bold">
          {section.titleCyrillic} / {section.titleLatin}
        </h1>
        <StatusBadge status={section.status} />
        <ContentPublishButton resourceUrl={`/admin/sections/${section.id}`} status={section.status} />
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 mb-6">
        <dl className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <dt className="text-gray-500">Translation RU</dt>
            <dd className="font-medium">{section.titleTranslationRu}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Translation EN</dt>
            <dd className="font-medium">{section.titleTranslationEn}</dd>
          </div>
          <div>
            <dt className="text-gray-500">CEFR Level</dt>
            <dd className="font-medium">{section.level}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Order</dt>
            <dd className="font-medium">{section.order}</dd>
          </div>
        </dl>
        <EditSectionForm section={section} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Order</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Unit</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Latin</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Lessons</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {section.units?.map((unit) => (
              <tr key={unit.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3">{unit.order}</td>
                <td className="px-4 py-3 font-medium">{unit.titleCyrillic}</td>
                <td className="px-4 py-3 text-gray-600">{unit.titleLatin}</td>
                <td className="px-4 py-3 text-gray-600">{unit.lessons?.length ?? 0}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={unit.status} />
                    <ContentPublishButton resourceUrl={`/admin/units/${unit.id}`} status={unit.status} />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Link href={`/content/units/${unit.id}`} className="text-indigo-600 hover:underline">
                      View
                    </Link>
                    <DeleteButton url={`/admin/units/${unit.id}`} />
                  </div>
                </td>
              </tr>
            ))}
            {!section.units?.length && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No units in this section yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
