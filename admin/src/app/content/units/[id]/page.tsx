import { fetchAdmin } from '@/lib/api';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { EditUnitForm, CreateLessonForm } from '@/components/forms/admin-forms';

interface Unit {
  id: string;
  titleCyrillic: string;
  titleLatin: string;
  titleTranslation: string;
  order: number;
  lessons?: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  titleLatin: string;
  titleTranslation: string;
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
            <dt className="text-gray-500">Translation</dt>
            <dd className="font-medium">{unit.titleTranslation}</dd>
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
        <CreateLessonForm unitId={unit.id} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Order</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Cyrillic</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Latin</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Translation</th>
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
                <td className="px-4 py-3 text-gray-600">{lesson.titleTranslation}</td>
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
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
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
