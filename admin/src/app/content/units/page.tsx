import { fetchAdmin } from '@/lib/api';
import Link from 'next/link';
import { CreateUnitForm } from '@/components/forms/create-unit-form';
import { UploadUnitsCsv } from '@/components/forms/upload-units-csv';

interface Unit {
  id: string;
  titleCyrillic: string;
  titleLatin: string;
  titleTranslationRu: string;
  titleTranslationEn: string;
  order: number;
}

interface PaginatedUnits {
  data: Unit[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default async function UnitsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const sp = await searchParams;
  const page = parseInt(sp.page || '1');
  const units: PaginatedUnits = await fetchAdmin(`/admin/units?page=${page}&limit=20`);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Units</h1>
        <div className="flex items-center gap-4">
          <UploadUnitsCsv />
          <CreateUnitForm />
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
              <th className="text-left px-4 py-3 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {units.data.map((unit) => (
              <tr key={unit.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3">{unit.order}</td>
                <td className="px-4 py-3 font-medium">{unit.titleCyrillic}</td>
                <td className="px-4 py-3 text-gray-600">{unit.titleLatin}</td>
                <td className="px-4 py-3 text-gray-600">{unit.titleTranslationRu}</td>
                <td className="px-4 py-3 text-gray-600">{unit.titleTranslationEn}</td>
                <td className="px-4 py-3">
                  <Link href={`/content/units/${unit.id}`} className="text-indigo-600 hover:underline">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-2 mt-4">
        {units.page > 1 && (
          <Link href={`/content/units?page=${units.page - 1}`} className="px-3 py-1 bg-white border rounded-lg hover:bg-gray-50 text-sm">
            Previous
          </Link>
        )}
        {units.page < units.totalPages && (
          <Link href={`/content/units?page=${units.page + 1}`} className="px-3 py-1 bg-white border rounded-lg hover:bg-gray-50 text-sm">
            Next
          </Link>
        )}
      </div>
    </div>
  );
}
