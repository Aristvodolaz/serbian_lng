'use client';

import { useState, useRef } from 'react';
import Papa from 'papaparse';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

// Exercise type registry (backend/src/content/exercise-types.ts). The CSV type
// column may also carry the legacy spellings from the pre-payload schema.
const TYPE_ALIASES: Record<string, string> = {
  translate_choice: 'translation_choice',
  translation_choice: 'translation_choice',
  fill_blank: 'fill_word',
  fill_word: 'fill_word',
};

function makeId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `ans-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

interface Word {
  id: string;
  cyrillic: string;
  latin: string;
  translationRu: string;
  translationEn: string;
  audioUrl?: string | null;
  imageUrl?: string | null;
}

// Deterministic distractors: the 3 words that follow the correct word in the
// sorted word list (cyclically), so the same CSV always produces the same set.
function pickDistractors(pool: Word[], correctId: string, count: number): Word[] {
  if (pool.length <= 1) return [];
  const index = pool.findIndex((w) => w.id === correctId);
  const start = index < 0 ? 0 : index + 1;
  const picked: Word[] = [];
  for (let step = 0; step < pool.length && picked.length < count; step++) {
    const candidate = pool[(start + step) % pool.length];
    if (candidate.id !== correctId && !picked.some((p) => p.id === candidate.id)) {
      picked.push(candidate);
    }
  }
  return picked;
}

export function UploadExercisesCsv({
  lessonId,
  lessonTitle,
  unitId,
}: {
  lessonId: string;
  lessonTitle: string;
  unitId: string;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setResult('Error: please select a .csv file');
      return;
    }

    setLoading(true);
    setResult('');

    try {
      const token = getToken();
      const text = await file.text();
      const { data, errors } = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        beforeFirstChunk: (chunk: string) => chunk.replace(/^﻿/, ''),
      });

      if (errors.length > 0) {
        throw new Error('CSV parse error: ' + errors[0].message);
      }

      // Resolve the current lesson's unit cyrillic title so rows from another
      // unit with the same lesson title (e.g. "Бројеви" in both Бројеви and
      // Време) are not imported.
      const unitRes = await fetch(`${BACKEND_URL}/admin/units/${unitId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!unitRes.ok) throw new Error(`Failed to load unit (${unitRes.status})`);
      const unit = (await unitRes.json()) as { titleCyrillic?: string };
      const unitTitleCyr = unit?.titleCyrillic;

      // All words → cyrillic→word map (for wordId/audio/image) and a sorted
      // array (for deterministic distractors).
      const words = await fetchAllWords(token);
      const byCyr = new Map(words.map((w) => [w.cyrillic, w]));
      const sorted = [...words].sort((a, b) => a.cyrillic.localeCompare(b.cyrillic));

      const exercises: Array<{ lessonId: string; type: string; payload: unknown }> = [];
      const warnings: string[] = [];
      let skippedOtherLesson = 0;

      for (let i = 0; i < data.length; i++) {
        const row = data[i] as Record<string, string>;
        const cyrillic = row.cyrillic?.trim();
        if (!cyrillic) continue;

        if (lessonTitle && row.lessonTitle?.trim() && row.lessonTitle.trim() !== lessonTitle) {
          skippedOtherLesson++;
          continue;
        }
        if (
          unitTitleCyr &&
          row.unitTitle?.trim() &&
          row.unitTitle.trim() !== unitTitleCyr
        ) {
          skippedOtherLesson++;
          continue;
        }

        const type = TYPE_ALIASES[row.type?.trim() || 'translation_choice'];
        if (!type) {
          warnings.push(`Row ${i + 2}: unknown type "${row.type}", skipped`);
          continue;
        }

        const word = byCyr.get(cyrillic);
        if (!word) {
          warnings.push(`Row ${i + 2}: word "${cyrillic}" not found in dictionary — no wordId/audio/image linked`);
        }

        const latin = row.latin?.trim() || '';
        const rowRu = row.translationRu?.trim();
        const rowEn = row.translationEn?.trim();
        const audioUrl = row.audioUrl?.trim() || word?.audioUrl || null;
        const imageUrl = row.imageUrl?.trim() || word?.imageUrl || null;

        const distractors = pickDistractors(sorted, word?.id ?? '', 3);
        if (distractors.length < 3) {
          warnings.push(`Row ${i + 2}: not enough words for distractors, skipped`);
          continue;
        }

        const correctAnswerId = makeId();
        const answers =
          type === 'fill_word'
            ? [
                {
                  id: correctAnswerId,
                  wordId: word?.id ?? null,
                  srCyr: cyrillic,
                  srLat: latin,
                  ru: word?.translationRu || rowRu || null,
                  en: word?.translationEn || rowEn || null,
                  audioUrl,
                },
                ...distractors.map((d) => ({
                  id: makeId(),
                  wordId: d.id,
                  srCyr: d.cyrillic,
                  srLat: d.latin,
                  ru: d.translationRu || null,
                  en: d.translationEn || null,
                  audioUrl: d.audioUrl || null,
                })),
              ]
            : [
                {
                  id: correctAnswerId,
                  wordId: word?.id ?? null,
                  en: word?.translationEn || rowEn || null,
                  ru: word?.translationRu || rowRu || null,
                },
                ...distractors.map((d) => ({
                  id: makeId(),
                  wordId: d.id,
                  en: d.translationEn || null,
                  ru: d.translationRu || null,
                })),
              ];

        const payload =
          type === 'fill_word'
            ? {
                sentence: {
                  srCyr: row.sentenceCyrillic?.trim() || null,
                  srLat: row.sentenceLatin?.trim() || null,
                  ru: row.sentenceTranslationRu?.trim() || null,
                  en: row.sentenceTranslationEn?.trim() || null,
                },
                answers,
                correctAnswerId,
                settings: { shuffleOptions: true, showSentenceTranslation: true, playAudio: true },
              }
            : {
                question: {
                  wordId: word?.id ?? null,
                  srCyr: cyrillic,
                  srLat: latin,
                  ru: rowRu || null,
                  en: rowEn || null,
                  audioUrl,
                  imageUrl,
                },
                answers,
                correctAnswerId,
                settings: { shuffleOptions: true, showImage: true, playAudio: true },
              };

        exercises.push({ lessonId, type, payload });
      }

      if (exercises.length === 0) {
        throw new Error('No valid data rows found in CSV for this lesson');
      }

      const res = await fetch(`${BACKEND_URL}/admin/exercises/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ exercises }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Upload failed');
      }

      const response = await res.json();
      let msg = `Uploaded ${exercises.length} exercises: ${response.created} created, ${response.updated} updated`;
      if (skippedOtherLesson > 0) msg += ` | ${skippedOtherLesson} rows skipped (other lesson)`;
      if (warnings.length > 0) msg += ` | Warnings: ${warnings.join('; ')}`;
      setResult(msg);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setResult(`Error: ${err instanceof Error ? err.message : 'Failed to parse CSV'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <label>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          className="hidden"
        />
        <span className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium cursor-pointer inline-block">
          Upload CSV
        </span>
      </label>
      {loading && <span className="text-sm text-gray-500 ml-2">Uploading...</span>}
      {result && (
        <p className={`text-sm mt-2 ${result.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>
          {result}
        </p>
      )}
    </div>
  );
}

async function fetchAllWords(token: string | undefined): Promise<Word[]> {
  const words: Word[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const res = await fetch(`${BACKEND_URL}/admin/words?page=${page}&limit=100`, {
      headers: { Authorization: token ? `Bearer ${token}` : '' },
    });
    if (!res.ok) throw new Error(`Failed to load words (${res.status})`);
    const body = await res.json();
    words.push(...((body.data ?? []) as Word[]));
    totalPages = body.totalPages ?? 1;
    page += 1;
  } while (page <= totalPages);
  return words;
}

function getToken(): string | undefined {
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith('admin_access_token='))
    ?.split('=')[1];
}
