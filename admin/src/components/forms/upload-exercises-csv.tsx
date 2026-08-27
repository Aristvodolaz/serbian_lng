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

interface Choice {
  text: string;
  textRu?: string;
}

export function UploadExercisesCsv({ lessonId }: { lessonId: string }) {
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
      const text = await file.text();
      const { data, errors } = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        beforeFirstChunk: (chunk: string) => chunk.replace(/^﻿/, ''),
      });

      if (errors.length > 0) {
        throw new Error('CSV parse error: ' + errors[0].message);
      }

      const exercises: Array<{ lessonId: string; type: string; payload: unknown }> = [];
      const warnings: string[] = [];

      for (let i = 0; i < data.length; i++) {
        const row = data[i] as Record<string, string>;
        const promptCyrillic = row.promptCyrillic?.trim();
        if (!promptCyrillic) continue;

        const type = TYPE_ALIASES[row.type?.trim() || 'translation_choice'];
        if (!type) {
          warnings.push(`Row ${i + 2}: unknown type "${row.type}", skipped`);
          continue;
        }

        const choices: Choice[] = [];
        for (let c = 1; c <= 4; c++) {
          const choiceText = row[`choice${c}Text`]?.trim();
          if (!choiceText) continue;
          const choice: Choice = { text: choiceText };
          const textRu = row[`choice${c}TextRu`]?.trim();
          if (textRu) choice.textRu = textRu;
          choices.push(choice);
        }

        if (choices.length === 0) {
          warnings.push(`Row ${i + 2}: no choices found, skipped`);
          continue;
        }
        let correctIndex = -1;
        for (let c = 1; c <= 4; c++) {
          if (row[`choice${c}Correct`] === '1' || row[`choice${c}Correct`] === 'true') {
            correctIndex = c - 1;
            break;
          }
        }
        if (correctIndex < 0) {
          warnings.push(`Row ${i + 2}: no correct answer marked, defaulting to first`);
          correctIndex = 0;
        }

        const answers = choices.map((choice) => {
          const answer: Record<string, string> = { id: makeId() };
          if (type === 'fill_word') {
            answer.srCyr = choice.text;
          } else {
            answer.en = choice.text;
            if (choice.textRu) answer.ru = choice.textRu;
          }
          return answer;
        });

        const base = {
          srCyr: promptCyrillic,
          srLat: row.promptLatin?.trim() || undefined,
          ru: row.promptTranslationRu?.trim() || undefined,
          en: row.promptTranslationEn?.trim() || undefined,
        };

        const payload =
          type === 'fill_word'
            ? {
                sentence: { srCyr: base.srCyr, srLat: base.srLat, ru: base.ru, en: base.en },
                answers,
                correctAnswerId: answers[correctIndex].id,
                settings: { shuffleOptions: true, showSentenceTranslation: true, playAudio: false },
              }
            : {
                question: { srCyr: base.srCyr, srLat: base.srLat, ru: base.ru, en: base.en },
                answers,
                correctAnswerId: answers[correctIndex].id,
                settings: { shuffleOptions: true, showImage: false, playAudio: true },
              };

        exercises.push({ lessonId, type, payload });
      }

      if (exercises.length === 0) {
        throw new Error('No valid data rows found in CSV');
      }

      const token = getToken();
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

function getToken(): string | undefined {
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith('admin_access_token='))
    ?.split('=')[1];
}
