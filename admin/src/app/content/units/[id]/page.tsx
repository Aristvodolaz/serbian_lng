import { fetchAdmin } from '@/lib/api';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { EditUnitForm, CreateLessonForm } from '@/components/forms/admin-forms';
import { UploadLessonsCsv } from '@/components/forms/upload-lessons-csv';

interface Unit {
  id: string;
  titleCyrillic: string;
  titleLatin: string;
  titleTranslationRu: string;
  titleTranslationEn: string;
  order: number;
  lessons?: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  titleLatin: string;
  titleTranslationRu: string;
  titleTranslationEn: string;
  order: number;
  xpReward: number;
}

export default async function UnitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let unit: Unit;
  try {
    unit = await fetchAdmin(`/admin/units/${id}`, { redirectOnError: false });
  } catch {
    notFound();
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/content/units" className="text-indigo-600 hover:underline text-sm">
          ← Back to Units
        </Link>
        <h1 className="text-2xl font-bold">
          {unit.titleCyrillic} / {unit.titleLatin}
        </h1>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 mb-6">
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-gray-500">Translation RU</dt>
            <dd className="font-medium">{unit.titleTranslationRu}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Translation EN</dt>
            <dd className="font-medium">{unit.titleTranslationEn}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Order</dt>
            <dd className="font-medium">{unit.order}</dd>
          </div>
        </dl>
        <div className="mt-4">
          <EditUnitForm unit={unit} />
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Lessons</h2>
        <div className="flex items-center gap-4">
          <UploadLessonsCsv unitId={unit.id} />
          <CreateLessonForm unitId={unit.id} />
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
              <th className="text-left px-4 py-3 font-medium text-gray-500">XP</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {unit.lessons?.map((lesson) => (
              <tr key={lesson.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3">{lesson.order}</td>
                <td className="px-4 py-3 font-medium">{lesson.title}</td>
                <td className="px-4 py-3 text-gray-600">{lesson.titleLatin}</td>
                <td className="px-4 py-3 text-gray-600">{lesson.titleTranslationRu}</td>
                <td className="px-4 py-3 text-gray-600">{lesson.titleTranslationEn}</td>
                <td className="px-4 py-3">{lesson.xpReward}</td>
                <td className="px-4 py-3">
                  <Link href={`/content/lessons/${lesson.id}`} className="text-indigo-600 hover:underline">
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {!unit.lessons?.length && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  No lessons yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
