'use client';

import { adminFetch } from '@/lib/client-api';
import { CsvUploadButton } from './admin-forms';

export function CreateSectionForm() {
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const body: Record<string, unknown> = {
          titleCyrillic: formData.get('titleCyrillic'),
        };
        const latin = formData.get('titleLatin');
        if (latin) body.titleLatin = latin;
        const ru = formData.get('titleTranslationRu');
        if (ru) body.titleTranslationRu = ru;
        const en = formData.get('titleTranslationEn');
        if (en) body.titleTranslationEn = en;
        const level = formData.get('level');
        if (level) body.level = level;
        const res = await adminFetch('/admin/sections', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => null);
          alert(err?.message || 'Failed to create section');
          return;
        }
        window.location.reload();
      }}
      className="flex gap-2 flex-wrap"
    >
      <input
        name="titleCyrillic"
        placeholder="Cyrillic"
        required
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
      />
      <input
        name="titleLatin"
        placeholder="Latin"
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
      />
      <input
        name="titleTranslationRu"
        placeholder="Translation RU"
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
      />
      <input
        name="titleTranslationEn"
        placeholder="Translation EN"
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
      />
      <input
        name="level"
        placeholder="CEFR (A1)"
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-28"
      />
      <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
        Add Section
      </button>
    </form>
  );
}

export function EditSectionForm({
  section,
}: {
  section: {
    id: string;
    titleCyrillic: string;
    titleLatin: string;
    titleTranslationRu: string;
    titleTranslationEn: string;
    level: string;
  };
}) {
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const res = await adminFetch(`/admin/sections/${section.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            titleCyrillic: formData.get('titleCyrillic'),
            titleLatin: formData.get('titleLatin'),
            titleTranslationRu: formData.get('titleTranslationRu'),
            titleTranslationEn: formData.get('titleTranslationEn'),
            level: formData.get('level'),
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => null);
          alert(err?.message || 'Failed to save section');
          return;
        }
        window.location.reload();
      }}
      className="flex gap-2 flex-wrap"
    >
      <input name="titleCyrillic" defaultValue={section.titleCyrillic} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
      <input name="titleLatin" defaultValue={section.titleLatin} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
      <input name="titleTranslationRu" defaultValue={section.titleTranslationRu} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
      <input name="titleTranslationEn" defaultValue={section.titleTranslationEn} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
      <input name="level" defaultValue={section.level} className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-20" />
      <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
        Save
      </button>
    </form>
  );
}

export function UploadSectionsCsv() {
  return (
    <CsvUploadButton
      endpoint="/admin/sections/bulk"
      bodyKey="sections"
      mapRows={(data) => {
        const rows = data
          .filter((row) => row.titleCyrillic?.trim())
          .map((row) => {
            const section: Record<string, unknown> = { titleCyrillic: row.titleCyrillic.trim() };
            const latin = row.titleLatin?.trim();
            const ru = row.titleTranslationRu?.trim();
            const en = row.titleTranslationEn?.trim();
            const level = row.level?.trim();
            if (latin) section.titleLatin = latin;
            if (ru) section.titleTranslationRu = ru;
            if (en) section.titleTranslationEn = en;
            if (level) section.level = level;
            return section;
          });
        return {
          rows,
          format: (response) =>
            `Uploaded ${rows.length} sections: ${response.created} created, ${response.updated} updated`,
        };
      }}
    />
  );
}
