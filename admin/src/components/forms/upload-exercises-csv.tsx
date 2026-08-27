'use client';

import { useState, useRef } from 'react';
import Papa from 'papaparse';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

function getToken(): string | undefined {
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith('admin_access_token='))
    ?.split('=')[1];
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

      const exercises: any[] = [];
      const warnings: string[] = [];

      for (let i = 0; i < data.length; i++) {
        const row = data[i] as any;
        if (!row.promptCyrillic?.trim()) continue;

        const choices: Array<{ text: string; textRu: string; isCorrect: boolean }> = [];
        for (let c = 1; c <= 4; c++) {
          const choiceText = row[`choice${c}Text`]?.trim();
          if (!choiceText) continue;
          choices.push({
            text: choiceText,
            textRu: row[`choice${c}TextRu`]?.trim() || '',
            isCorrect: row[`choice${c}Correct`] === '1' || row[`choice${c}Correct`] === 'true',
          });
        }

        if (choices.length === 0) {
          warnings.push(`Row ${i + 2}: no choices found, skipped`);
          continue;
        }
        if (!choices.some((c) => c.isCorrect)) {
          warnings.push(`Row ${i + 2}: no correct answer marked, defaulting to first`);
          choices[0].isCorrect = true;
        }

        const exercise: any = {
          lessonId,
          promptCyrillic: row.promptCyrillic.trim(),
        };
        const type = row.type?.trim();
        if (type) exercise.type = type;
        const latin = row.promptLatin?.trim();
        const ru = row.promptTranslationRu?.trim();
        const en = row.promptTranslationEn?.trim();
        if (latin) exercise.promptLatin = latin;
        if (ru) exercise.promptTranslationRu = ru;
        if (en) exercise.promptTranslationEn = en;
        exercise.choices = choices;

        exercises.push(exercise);
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
