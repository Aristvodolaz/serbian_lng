'use client';

import { useState } from 'react';
import { adminFetch } from '@/lib/client-api';
import {
  ExercisePayload,
  createEmptyPayload,
  getEditorConfig,
  normalizePayload,
} from '@/lib/exercise-templates';
import { ExercisePayloadEditor } from './exercise-payload-editor';
import { WordAttributes } from '@/lib/word-attributes';
import { AttributeLangToggle, useAttributeLang } from '@/lib/attribute-lang';

export interface ExerciseTemplateSummary {
  type: string;
  label: string;
  description: string;
}

// ── Status helpers ───────────────────────────────────────────

export function StatusBadge({ status }: { status: string }) {
  const published = status === 'published';
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
        published ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'
      }`}
    >
      {published ? 'Published' : 'Draft'}
    </span>
  );
}

// Publish/unpublish for units, lessons and exercises (POST /:id/publish|unpublish).
export function ContentPublishButton({ resourceUrl, status }: { resourceUrl: string; status: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const published = status === 'published';

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError('');
          try {
            const res = await adminFetch(`${resourceUrl}/${published ? 'unpublish' : 'publish'}`, {
              method: 'POST',
              body: '{}',
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) throw new Error(data?.message || 'Failed');
            window.location.reload();
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed');
          } finally {
            setBusy(false);
          }
        }}
        className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
          published
            ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
            : 'bg-emerald-600 text-white hover:bg-emerald-700'
        }`}
      >
        {busy ? '…' : published ? 'Unpublish' : 'Publish'}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </span>
  );
}

// Words have no dedicated publish endpoint — toggle via PATCH status.
export function WordStatusButton({ wordId, status }: { wordId: string; status: string }) {
  const [busy, setBusy] = useState(false);
  const published = status === 'published';

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await adminFetch(`/admin/words/${wordId}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: published ? 'draft' : 'published' }),
        });
        window.location.reload();
      }}
      className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
        published
          ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
          : 'bg-emerald-600 text-white hover:bg-emerald-700'
      }`}
    >
      {busy ? '…' : published ? 'Unpublish' : 'Publish'}
    </button>
  );
}

// ── Delete Button ────────────────────────────────────────────

export function DeleteButton({ url, label = 'Delete' }: { url: string; label?: string }) {
  return (
    <button
      onClick={async () => {
        if (!confirm('Are you sure?')) return;
        await adminFetch(url, { method: 'DELETE' });
        window.location.reload();
      }}
      className="text-red-600 hover:text-red-800 text-sm"
    >
      {label}
    </button>
  );
}

// ── Delete Badge Button ──────────────────────────────────────

export function DeleteBadgeButton({ badgeId }: { badgeId: string }) {
  return (
    <button
      onClick={async () => {
        if (!confirm('Delete this badge?')) return;
        await adminFetch(`/admin/badges/${badgeId}`, { method: 'DELETE' });
        window.location.reload();
      }}
      className="text-red-600 hover:text-red-800 text-sm"
    >
      Delete
    </button>
  );
}

// ── Edit Badge Form ──────────────────────────────────────────

export function EditBadgeForm({ badge }: { badge: { id: string; titleCyrillic: string; titleLatin: string } }) {
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        await adminFetch(`/admin/badges/${badge.id}`, {
          method: 'PATCH',
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

// ── Edit Unit Form ───────────────────────────────────────────

export function EditUnitForm({ unit }: { unit: { id: string; titleCyrillic: string; titleLatin: string; titleTranslationRu: string; titleTranslationEn: string } }) {
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        await adminFetch(`/admin/units/${unit.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            titleCyrillic: formData.get('titleCyrillic'),
            titleLatin: formData.get('titleLatin'),
            titleTranslationRu: formData.get('titleTranslationRu'),
            titleTranslationEn: formData.get('titleTranslationEn'),
          }),
        });
        window.location.reload();
      }}
      className="flex gap-2 flex-wrap"
    >
      <input name="titleCyrillic" defaultValue={unit.titleCyrillic} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
      <input name="titleLatin" defaultValue={unit.titleLatin} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
      <input name="titleTranslationRu" defaultValue={unit.titleTranslationRu} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
      <input name="titleTranslationEn" defaultValue={unit.titleTranslationEn} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
      <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
        Save
      </button>
    </form>
  );
}

// ── Create Lesson Form ───────────────────────────────────────

export function CreateLessonForm({ unitId }: { unitId: string }) {
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        await adminFetch('/admin/lessons', {
          method: 'POST',
          body: JSON.stringify({
            unitId,
            title: formData.get('title'),
            titleLatin: formData.get('titleLatin'),
            titleTranslationRu: formData.get('titleTranslationRu'),
            titleTranslationEn: formData.get('titleTranslationEn'),
          }),
        });
        window.location.reload();
      }}
      className="flex gap-2 flex-wrap"
    >
      <input name="title" placeholder="Cyrillic" required className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
      <input name="titleLatin" placeholder="Latin" required className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
      <input name="titleTranslationRu" placeholder="Translation RU" required className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
      <input name="titleTranslationEn" placeholder="Translation EN" required className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
      <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
        Add Lesson
      </button>
    </form>
  );
}

// ── Edit Lesson Form ─────────────────────────────────────────

export function EditLessonForm({ lesson }: { lesson: { id: string; title: string; titleLatin: string; titleTranslationRu: string; titleTranslationEn: string; xpReward: number } }) {
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        await adminFetch(`/admin/lessons/${lesson.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            title: formData.get('title'),
            titleLatin: formData.get('titleLatin'),
            titleTranslationRu: formData.get('titleTranslationRu'),
            titleTranslationEn: formData.get('titleTranslationEn'),
            xpReward: parseInt(formData.get('xpReward') as string),
          }),
        });
        window.location.reload();
      }}
      className="flex gap-2 flex-wrap"
    >
      <input name="title" defaultValue={lesson.title} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
      <input name="titleLatin" defaultValue={lesson.titleLatin} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
      <input name="titleTranslationRu" defaultValue={lesson.titleTranslationRu} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
      <input name="titleTranslationEn" defaultValue={lesson.titleTranslationEn} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
      <input name="xpReward" type="number" defaultValue={lesson.xpReward} className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-20" />
      <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
        Save
      </button>
    </form>
  );
}

// ── JSON fallback editor (for registry types without a config yet) ──

function JsonPayloadEditor({
  value,
  onChange,
}: {
  value: ExercisePayload;
  onChange: (payload: ExercisePayload) => void;
}) {
  const [text, setText] = useState(() => JSON.stringify(value, null, 2));
  const [error, setError] = useState('');
  return (
    <div>
      <p className="text-xs text-amber-600 mb-1">
        No visual editor for this type yet — edit the raw JSON payload.
      </p>
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          try {
            onChange(JSON.parse(e.target.value));
            setError('');
          } catch {
            setError('Invalid JSON');
          }
        }}
        rows={10}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

// ── Create Exercise Form ─────────────────────────────────────

export function CreateExerciseForm({
  lessonId,
  templates,
}: {
  lessonId: string;
  templates: ExerciseTemplateSummary[];
}) {
  const [type, setType] = useState<string>(templates[0]?.type ?? '');
  const [payload, setPayload] = useState<ExercisePayload>(() =>
    createEmptyPayload(templates[0]?.type ?? ''),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const config = getEditorConfig(type);

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 min-w-[520px]">
      <div className="flex items-center gap-3 mb-3">
        <select
          value={type}
          onChange={(e) => {
            const t = e.target.value;
            setType(t);
            setPayload(createEmptyPayload(t));
          }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          {templates.map((t) => (
            <option key={t.type} value={t.type}>
              {t.label}
            </option>
          ))}
        </select>
        <span className="text-xs text-gray-400">
          {config?.description ?? 'No editor for this type — edit JSON directly'}
        </span>
      </div>

      {config ? (
        <ExercisePayloadEditor config={config} payload={payload} onChange={setPayload} />
      ) : (
        <JsonPayloadEditor key={type} value={payload} onChange={setPayload} />
      )}

      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      <button
        type="button"
        disabled={saving}
        onClick={async () => {
          setSaving(true);
          setError('');
          try {
            const res = await adminFetch(`/admin/lessons/${lessonId}/exercises`, {
              method: 'POST',
              body: JSON.stringify({ type, payload }),
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) throw new Error(data?.message || 'Failed to create exercise');
            window.location.reload();
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed');
          } finally {
            setSaving(false);
          }
        }}
        className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
      >
        {saving ? 'Saving…' : 'Add Exercise'}
      </button>
    </div>
  );
}

// ── Edit Exercise Form ───────────────────────────────────────

export function EditExerciseForm({
  exercise,
}: {
  exercise: { id: string; type: string; payload: Record<string, unknown> };
}) {
  const [open, setOpen] = useState(false);
  const [payload, setPayload] = useState<ExercisePayload>(() =>
    normalizePayload(exercise.type, exercise.payload),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const config = getEditorConfig(exercise.type);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-indigo-600 hover:underline"
      >
        Edit payload
      </button>
    );
  }

  return (
    <div className="mt-3 border-t border-gray-200 pt-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-700">Edit {exercise.type} payload</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          Close
        </button>
      </div>

      {config ? (
        <ExercisePayloadEditor config={config} payload={payload} onChange={setPayload} />
      ) : (
        <JsonPayloadEditor key={exercise.type} value={payload} onChange={setPayload} />
      )}

      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      <button
        type="button"
        disabled={saving}
        onClick={async () => {
          setSaving(true);
          setError('');
          try {
            const res = await adminFetch(`/admin/exercises/${exercise.id}`, {
              method: 'PATCH',
              body: JSON.stringify({ payload }),
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) throw new Error(data?.message || 'Failed to save exercise');
            window.location.reload();
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed');
          } finally {
            setSaving(false);
          }
        }}
        className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium"
      >
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  );
}

// ── Edit Word Form ───────────────────────────────────────────

export function EditWordForm({
  word,
  attributes,
}: {
  word: {
    id: string;
    cyrillic: string;
    latin: string;
    translationRu: string;
    translationEn: string;
    exampleCyrillic: string | null;
    exampleTranslationRu: string | null;
    exampleTranslationEn: string | null;
    audioUrl: string | null;
    partOfSpeech?: string | null;
    gender?: string | null;
    number?: string | null;
    declension?: string | null;
    conjugation?: string | null;
    imageUrl?: string | null;
    status?: string;
  };
  attributes: WordAttributes;
}) {
  const { lang } = useAttributeLang();
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        await adminFetch(`/admin/words/${word.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            cyrillic: formData.get('cyrillic'),
            latin: formData.get('latin'),
            translationRu: formData.get('translationRu'),
            translationEn: formData.get('translationEn'),
            exampleCyrillic: formData.get('exampleCyrillic') || null,
            exampleTranslationRu: formData.get('exampleTranslationRu') || null,
            exampleTranslationEn: formData.get('exampleTranslationEn') || null,
            audioUrl: formData.get('audioUrl') || null,
            partOfSpeech: formData.get('partOfSpeech') || null,
            gender: formData.get('gender') || null,
            number: formData.get('number') || null,
            declension: formData.get('declension') || null,
            conjugation: formData.get('conjugation') || null,
            imageUrl: formData.get('imageUrl') || null,
            status: formData.get('status'),
          }),
        });
        window.location.reload();
      }}
      className="space-y-4"
    >
      <div className="flex items-center gap-3">
        <label className="block text-sm font-medium text-gray-700">Status</label>
        <select
          name="status"
          defaultValue={word.status || 'draft'}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
        <div className="ml-auto">
          <AttributeLangToggle />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Cyrillic</label>
        <input name="cyrillic" defaultValue={word.cyrillic} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Latin</label>
        <input name="latin" defaultValue={word.latin} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Translation RU</label>
        <input name="translationRu" defaultValue={word.translationRu} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Translation EN</label>
        <input name="translationEn" defaultValue={word.translationEn} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Example (Cyrillic)</label>
        <input name="exampleCyrillic" defaultValue={word.exampleCyrillic || ''} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Example Translation RU</label>
        <input name="exampleTranslationRu" defaultValue={word.exampleTranslationRu || ''} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Example Translation EN</label>
        <input name="exampleTranslationEn" defaultValue={word.exampleTranslationEn || ''} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Part of speech</label>
          <select
            name="partOfSpeech"
            defaultValue={word.partOfSpeech || ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">—</option>
            {attributes.partOfSpeech.map((o) => (
              <option key={o.value} value={o.value}>{lang === 'ru' ? o.ru : o.en}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
          <select name="gender" defaultValue={word.gender || ''} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
            <option value="">—</option>
            {attributes.gender.map((o) => (
              <option key={o.value} value={o.value}>{lang === 'ru' ? o.ru : o.en}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Number</label>
          <select name="number" defaultValue={word.number || ''} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
            <option value="">—</option>
            {attributes.number.map((o) => (
              <option key={o.value} value={o.value}>{lang === 'ru' ? o.ru : o.en}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Declension</label>
          <select name="declension" defaultValue={word.declension || ''} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
            <option value="">—</option>
            {attributes.declension.map((o) => (
              <option key={o.value} value={o.value}>{lang === 'ru' ? o.ru : o.en}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Conjugation</label>
          <select name="conjugation" defaultValue={word.conjugation || ''} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
            <option value="">—</option>
            {attributes.conjugation.map((o) => (
              <option key={o.value} value={o.value}>{lang === 'ru' ? o.ru : o.en}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Audio URL</label>
        <input name="audioUrl" defaultValue={word.audioUrl || ''} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
        <input name="imageUrl" defaultValue={word.imageUrl || ''} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
      </div>
      <div className="flex gap-2">
        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
          Save
        </button>
        <button
          type="button"
          onClick={async () => {
            if (!confirm('Delete this word?')) return;
            await adminFetch(`/admin/words/${word.id}`, { method: 'DELETE' });
            window.location.href = '/content/words';
          }}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
        >
          Delete
        </button>
      </div>
    </form>
  );
}
