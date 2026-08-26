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

export function UploadLessonsCsv({ unitId }: { unitId: string }) {
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

      const lessons = data
        .filter((row: any) => row.title?.trim())
        .map((row: any) => {
          const lesson: any = {
            unitId,
            title: row.title.trim(),
          };
          const latin = row.titleLatin?.trim();
          const ru = row.titleTranslationRu?.trim();
          const en = row.titleTranslationEn?.trim();
          if (latin) lesson.titleLatin = latin;
          if (ru) lesson.titleTranslationRu = ru;
          if (en) lesson.titleTranslationEn = en;
          lesson.xpReward = row.xpReward ? parseInt(row.xpReward) || 10 : 10;
          return lesson;
        });

      if (lessons.length === 0) {
        throw new Error('No valid data rows found in CSV');
      }

      const token = getToken();
      const res = await fetch(`${BACKEND_URL}/admin/lessons/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ lessons }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Upload failed');
      }

      const response = await res.json();
      setResult(
        `Uploaded ${lessons.length} lessons: ${response.created} created, ${response.updated} updated`,
      );
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
