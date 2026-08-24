'use client';

import { useState, useRef } from 'react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

function getToken(): string | undefined {
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith('admin_access_token='))
    ?.split('=')[1];
}

export function UploadWordsCsv() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCsv = (text: string) => {
    const lines = text.split('\n').filter((line) => line.trim());
    if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row');

    // Skip header row
    const dataLines = lines.slice(1);
    const words = dataLines.map((line, i) => {
      const [cyrillic, latin, translation, exampleCyrillic, exampleTranslation, audioUrl] =
        line.split(',').map((c) => c.trim());
      if (!cyrillic || !latin || !translation) {
        throw new Error(`Row ${i + 2}: cyrillic, latin, and translation are required`);
      }
      return {
        cyrillic,
        latin,
        translation,
        exampleCyrillic: exampleCyrillic || undefined,
        exampleTranslation: exampleTranslation || undefined,
        audioUrl: audioUrl || undefined,
      };
    });

    return words;
  };

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setResult('Error: please select a .csv file');
      return;
    }

    setLoading(true);
    setResult('');

    try {
      const text = await file.text();
      const words = parseCsv(text);

      const token = getToken();
      const res = await fetch(`${BACKEND_URL}/admin/words/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ words }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Upload failed');
      }

      const data = await res.json();
      setResult(`Successfully uploaded ${data.created} words`);
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
