'use client';

import { adminFetch } from '@/lib/client-api';

export interface SectionOption {
  id: string;
  titleCyrillic: string;
}

const inputClass = 'px-3 py-2 border border-gray-300 rounded-lg text-sm w-full';
const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

function parsePayloadForm(payloadText: string) {
  try {
    return { payload: JSON.parse(payloadText) };
  } catch {
    alert('Payload is not valid JSON');
    return null;
  }
}

export function CreateTheoryForm({ sections }: { sections: SectionOption[] }) {
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const parsed = parsePayloadForm(String(formData.get('payload') ?? ''));
        if (!parsed) return;
        const sectionId = String(formData.get('sectionId') ?? '');
        if (!sectionId) {
          alert('Select a section');
          return;
        }
        const res = await adminFetch('/admin/theory', {
          method: 'POST',
          body: JSON.stringify({
            sectionId,
            titleCyrillic: formData.get('titleCyrillic'),
            titleLatin: formData.get('titleLatin'),
            titleTranslationRu: formData.get('titleTranslationRu'),
            titleTranslationEn: formData.get('titleTranslationEn'),
            payload: parsed.payload,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => null);
          alert(err?.message || 'Failed to create theory topic');
          return;
        }
        window.location.reload();
      }}
      className="flex gap-2 flex-wrap items-center"
    >
      <select name="sectionId" required className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
        <option value="">Section…</option>
        {sections.map((s) => (
          <option key={s.id} value={s.id}>
            {s.titleCyrillic}
          </option>
        ))}
      </select>
      <input name="titleCyrillic" placeholder="Cyrillic" required className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
      <input name="titleLatin" placeholder="Latin" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
      <input name="titleTranslationRu" placeholder="Translation RU" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
      <input name="titleTranslationEn" placeholder="Translation EN" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
      <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
        Add Topic
      </button>
      <textarea
        name="payload"
        defaultValue={JSON.stringify(
          { version: 1, blocks: [{ type: 'heading', textCyrillic: '', textLatin: '' }] },
          null,
          2,
        )}
        rows={6}
        className={`${inputClass} font-mono text-xs`}
      />
    </form>
  );
}

export function EditTheoryForm({
  theory,
  sections,
}: {
  theory: {
    id: string;
    sectionId: string;
    titleCyrillic: string;
    titleLatin: string;
    titleTranslationRu: string;
    titleTranslationEn: string;
    payload: unknown;
  };
  sections: SectionOption[];
}) {
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const parsed = parsePayloadForm(String(formData.get('payload') ?? ''));
        if (!parsed) return;
        const res = await adminFetch(`/admin/theory/${theory.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            sectionId: formData.get('sectionId'),
            titleCyrillic: formData.get('titleCyrillic'),
            titleLatin: formData.get('titleLatin'),
            titleTranslationRu: formData.get('titleTranslationRu'),
            titleTranslationEn: formData.get('titleTranslationEn'),
            payload: parsed.payload,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => null);
          alert(err?.message || 'Failed to save theory topic');
          return;
        }
        window.location.reload();
      }}
      className="grid gap-4"
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Section</label>
          <select name="sectionId" defaultValue={theory.sectionId} className={inputClass}>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.titleCyrillic}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Title Cyrillic</label>
          <input name="titleCyrillic" defaultValue={theory.titleCyrillic} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Title Latin</label>
          <input name="titleLatin" defaultValue={theory.titleLatin} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Translation RU</label>
          <input name="titleTranslationRu" defaultValue={theory.titleTranslationRu} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Translation EN</label>
          <input name="titleTranslationEn" defaultValue={theory.titleTranslationEn} className={inputClass} />
        </div>
      </div>
      <div>
        <label className={labelClass}>Payload JSON (blocks: heading / paragraph / table / example)</label>
        <textarea
          name="payload"
          defaultValue={JSON.stringify(theory.payload, null, 2)}
          rows={24}
          className={`${inputClass} font-mono text-xs`}
        />
      </div>
      <div>
        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
          Save
        </button>
      </div>
    </form>
  );
}
