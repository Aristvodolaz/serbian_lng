'use client';

import { useState } from 'react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

function getToken(): string | undefined {
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith('admin_access_token='))
    ?.split('=')[1];
}

function getRefreshToken(): string | undefined {
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith('admin_refresh_token='))
    ?.split('=')[1];
}

function setCookies(access_token: string, refresh_token: string) {
  document.cookie = `admin_access_token=${access_token}; Path=/; Max-Age=900; SameSite=Lax`;
  document.cookie = `admin_refresh_token=${refresh_token}; Path=/; Max-Age=2592000; SameSite=Lax`;
}

async function refreshSession(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${BACKEND_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    setCookies(data.accessToken, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

export async function adminFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const response = await fetch(`${BACKEND_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  // On 401, try to refresh token and retry once
  if (response.status === 401) {
    const refreshed = await refreshSession();
    if (refreshed) {
      const newToken = getToken();
      return fetch(`${BACKEND_URL}${url}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${newToken}`,
          ...options.headers,
        },
      });
    }
    // Refresh failed — log out
    document.cookie = 'admin_access_token=; Path=/; Max-Age=0';
    document.cookie = 'admin_refresh_token=; Path=/; Max-Age=0';
    window.location.href = '/login';
  }

  return response;
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

export function EditUnitForm({ unit }: { unit: { id: string; titleCyrillic: string; titleLatin: string; titleTranslation: string } }) {
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
            titleTranslation: formData.get('titleTranslation'),
          }),
        });
        window.location.reload();
      }}
      className="flex gap-2"
    >
      <input name="titleCyrillic" defaultValue={unit.titleCyrillic} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
      <input name="titleLatin" defaultValue={unit.titleLatin} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
      <input name="titleTranslation" defaultValue={unit.titleTranslation} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
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
            titleTranslation: formData.get('titleTranslation'),
          }),
        });
        window.location.reload();
      }}
      className="flex gap-2"
    >
      <input name="title" placeholder="Cyrillic" required className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
      <input name="titleLatin" placeholder="Latin" required className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
      <input name="titleTranslation" placeholder="Translation" required className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
      <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
        Add Lesson
      </button>
    </form>
  );
}

// ── Edit Lesson Form ─────────────────────────────────────────

export function EditLessonForm({ lesson }: { lesson: { id: string; title: string; titleLatin: string; titleTranslation: string; xpReward: number } }) {
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
            titleTranslation: formData.get('titleTranslation'),
            xpReward: parseInt(formData.get('xpReward') as string),
          }),
        });
        window.location.reload();
      }}
      className="flex gap-2"
    >
      <input name="title" defaultValue={lesson.title} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
      <input name="titleLatin" defaultValue={lesson.titleLatin} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
      <input name="titleTranslation" defaultValue={lesson.titleTranslation} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
      <input name="xpReward" type="number" defaultValue={lesson.xpReward} className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-20" />
      <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
        Save
      </button>
    </form>
  );
}

// ── Create Exercise Form ─────────────────────────────────────

export function CreateExerciseForm({ lessonId }: { lessonId: string }) {
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const choicesStr = formData.get('choices') as string;
        const choices = choicesStr.split('\n').filter(Boolean).map((line, i) => {
          const [isCorrect, ...textParts] = line.trim().split(' ');
          return {
            text: textParts.join(' '),
            isCorrect: isCorrect === '✓',
            order: i + 1,
          };
        });
        await adminFetch(`/admin/lessons/${lessonId}/exercises`, {
          method: 'POST',
          body: JSON.stringify({
            promptCyrillic: formData.get('promptCyrillic'),
            promptLatin: formData.get('promptLatin'),
            choices,
          }),
        });
        window.location.reload();
      }}
      className="flex gap-2 flex-wrap"
    >
      <input name="promptCyrillic" placeholder="Cyrillic" required className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
      <input name="promptLatin" placeholder="Latin" required className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
      <textarea name="choices" placeholder="✓ correct answer&#10;wrong answer 1&#10;wrong answer 2" required className="px-3 py-2 border border-gray-300 rounded-lg text-sm h-20" />
      <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
        Add Exercise
      </button>
    </form>
  );
}

// ── Edit Exercise Form ───────────────────────────────────────

export function EditExerciseForm({ exercise }: { exercise: { id: string; promptCyrillic: string; promptLatin: string } }) {
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        await adminFetch(`/admin/exercises/${exercise.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            promptCyrillic: formData.get('promptCyrillic'),
            promptLatin: formData.get('promptLatin'),
          }),
        });
        window.location.reload();
      }}
      className="flex gap-2 mt-3"
    >
      <input name="promptCyrillic" defaultValue={exercise.promptCyrillic} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
      <input name="promptLatin" defaultValue={exercise.promptLatin} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
      <button type="submit" className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium">
        Save
      </button>
    </form>
  );
}

// ── Edit Word Form ───────────────────────────────────────────

export function EditWordForm({ word }: { word: { id: string; cyrillic: string; latin: string; translation: string; exampleCyrillic: string | null; exampleTranslation: string | null; audioUrl: string | null } }) {
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
            translation: formData.get('translation'),
            exampleCyrillic: formData.get('exampleCyrillic') || null,
            exampleTranslation: formData.get('exampleTranslation') || null,
            audioUrl: formData.get('audioUrl') || null,
          }),
        });
        window.location.reload();
      }}
      className="space-y-4"
    >
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Cyrillic</label>
        <input name="cyrillic" defaultValue={word.cyrillic} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Latin</label>
        <input name="latin" defaultValue={word.latin} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Translation</label>
        <input name="translation" defaultValue={word.translation} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Example (Cyrillic)</label>
        <input name="exampleCyrillic" defaultValue={word.exampleCyrillic || ''} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Example (Translation)</label>
        <input name="exampleTranslation" defaultValue={word.exampleTranslation || ''} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Audio URL</label>
        <input name="audioUrl" defaultValue={word.audioUrl || ''} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
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

// ── Edit Choice Form ──────────────────────────────────────────

export function EditChoiceForm({
  choice,
  exerciseId,
  totalChoices,
}: {
  choice: { id: string; text: string; isCorrect: boolean; order: number };
  exerciseId: string;
  totalChoices: number;
}) {
  const [editing, setEditing] = useState(false);

  const updateChoice = async (data: { text?: string; isCorrect?: boolean; order?: number }) => {
    await adminFetch(`/admin/exercise-choices/${choice.id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    window.location.reload();
  };

  const toggleCorrect = async () => {
    await updateChoice({ isCorrect: !choice.isCorrect });
  };

  const moveChoice = async (direction: 'up' | 'down') => {
    const newOrder = direction === 'up' ? choice.order - 1 : choice.order + 1;
    await updateChoice({ order: newOrder });
  };

  const deleteChoice = async () => {
    if (!confirm('Delete this answer?')) return;
    await adminFetch(`/admin/exercise-choices/${choice.id}`, { method: 'DELETE' });
    window.location.reload();
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            await updateChoice({ text: formData.get('text') as string });
            setEditing(false);
          }}
          className="flex items-center gap-2 flex-1"
        >
          <input
            name="text"
            defaultValue={choice.text}
            className="px-2 py-1 border border-gray-300 rounded text-sm flex-1"
            autoFocus
          />
          <button type="submit" className="px-2 py-1 bg-green-600 text-white rounded text-xs">
            Save
          </button>
          <button type="button" onClick={() => setEditing(false)} className="px-2 py-1 bg-gray-400 text-white rounded text-xs">
            Cancel
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        value={choice.text}
        onClick={() => setEditing(true)}
        readOnly
        className={`px-3 py-2 rounded-lg text-sm flex-1 cursor-pointer border ${
          choice.isCorrect
            ? 'bg-green-50 text-green-800 border-green-200'
            : 'bg-gray-50 text-gray-700 border-gray-200'
        }`}
        title="Click to edit"
      />
      <label className="flex items-center gap-1 text-xs cursor-pointer">
        <input
          type="checkbox"
          checked={choice.isCorrect}
          onChange={toggleCorrect}
          className="rounded"
        />
        Correct
      </label>
      <button
        onClick={() => moveChoice('up')}
        disabled={choice.order === 1}
        className="px-1 py-1 text-gray-500 hover:text-gray-800 disabled:opacity-30 text-sm"
        title="Move up"
      >
        ↑
      </button>
      <button
        onClick={() => moveChoice('down')}
        disabled={choice.order === totalChoices}
        className="px-1 py-1 text-gray-500 hover:text-gray-800 disabled:opacity-30 text-sm"
        title="Move down"
      >
        ↓
      </button>
      <button
        onClick={deleteChoice}
        className="text-red-500 hover:text-red-700 text-xs"
        title="Delete"
      >
        ✕
      </button>
    </div>
  );
}

// ── Add Choice Form ───────────────────────────────────────────

export function AddChoiceForm({ exerciseId, nextOrder }: { exerciseId: string; nextOrder: number }) {
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        await adminFetch(`/admin/exercises/${exerciseId}/choices`, {
          method: 'POST',
          body: JSON.stringify({
            text: formData.get('text'),
            isCorrect: false,
            order: nextOrder,
          }),
        });
        window.location.reload();
      }}
      className="flex gap-2 mt-2"
    >
      <input
        name="text"
        placeholder="New answer..."
        required
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm flex-1"
      />
      <button type="submit" className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-xs font-medium">
        Add
      </button>
    </form>
  );
}
