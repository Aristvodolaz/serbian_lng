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

interface LessonRow {
  unitId: string;
  title: string;
  titleLatin: string;
  titleTranslationRu: string;
  titleTranslationEn: string;
  xpReward?: number;
}

export function UploadLessonsCsv({ unitId }: { unitId: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCsv = (text: string): { lessons: LessonRow[]; errors: string[] } => {
    if (text.charCodeAt(0) === 0xfeff) {
      text = text.slice(1);
    }

    const lessons: LessonRow[] = [];
    const errors: string[] = [];

    const results = Papa.parse<Record<string, string>>(text.trim(), {
      header: true,
      skipEmptyLines: true,
    });

    for (const err of results.errors) {
      const parseErr = err as { row?: number; message?: string };
      errors.push(`Row ${parseErr.row ?? '?'}: ${parseErr.message ?? 'parse error'}`);
    }

    for (let i = 0; i < results.data.length; i++) {
      const row = results.data[i];
      const rowNum = i + 2;

      const title = (row.title || '').trim();
      const titleLatin = (row.titleLatin || '').trim();
      const titleTranslationRu = (row.titleTranslationRu || '').trim();
      const titleTranslationEn = (row.titleTranslationEn || '').trim();

      if (!title || !titleLatin || !titleTranslationRu || !titleTranslationEn) {
        errors.push(
          `Row ${rowNum}: title, titleLatin, titleTranslationRu, and titleTranslationEn are required`,
        );
        continue;
      }

      const xpReward = row.xpReward ? parseInt(row.xpReward.trim(), 10) : undefined;

      lessons.push({
        unitId,
        title,
        titleLatin,
        titleTranslationRu,
        titleTranslationEn,
        xpReward: xpReward || undefined,
      });
    }

    return { lessons, errors };
  };

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setResult('Error: please select a .csv file');
      setWarnings([]);
      return;
    }

    setLoading(true);
    setResult('');
    setWarnings([]);

    try {
      const text = await file.text();
      const { lessons, errors } = parseCsv(text);

      if (errors.length) setWarnings(errors);

      if (!lessons.length) {
        setResult('Error: no valid rows found in CSV');
        return;
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

      const data = await res.json();
      const parts: string[] = [];
      if (data.created > 0) parts.push(`${data.created} created`);
      if (data.updated > 0) parts.push(`${data.updated} updated`);
      setResult(`Successfully uploaded: ${parts.join(', ')}`);
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
      {warnings.length > 0 && (
        <div className="text-sm mt-1 text-amber-600">
          {warnings.map((w, i) => (
            <div key={i}>{w}</div>
          ))}
        </div>
      )}
    </div>
  );
}
