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

export function UploadWordsCsv({ unitId }: { unitId?: string }) {
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

      const words = data
        .filter((row: any) => row.cyrillic?.trim() && row.latin?.trim() && row.translationRu?.trim() && row.translationEn?.trim())
        .map((row: any) => {
          const word: any = {
            unitId: unitId || row.unitId?.trim() || null,
            cyrillic: row.cyrillic.trim(),
            latin: row.latin.trim(),
            translationRu: row.translationRu.trim(),
            translationEn: row.translationEn.trim(),
          };
          const exampleCy = row.exampleCyrillic?.trim();
          const exampleRu = row.exampleTranslationRu?.trim();
          const exampleEn = row.exampleTranslationEn?.trim();
          const audio = row.audioUrl?.trim();
          const partOfSpeech = row.partOfSpeech?.trim();
          const gender = row.gender?.trim();
          const number = row.number?.trim();
          const declension = row.declension?.trim();
          const conjugation = row.conjugation?.trim();
          if (exampleCy) word.exampleCyrillic = exampleCy;
          if (exampleRu) word.exampleTranslationRu = exampleRu;
          if (exampleEn) word.exampleTranslationEn = exampleEn;
          if (audio) word.audioUrl = audio;
          if (partOfSpeech) word.partOfSpeech = partOfSpeech;
          if (gender) word.gender = gender;
          if (number) word.number = number;
          if (declension) word.declension = declension;
          if (conjugation) word.conjugation = conjugation;
          return word;
        });

      if (words.length === 0) {
        throw new Error('No valid data rows found in CSV');
      }

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

      const response = await res.json();
      setResult(
        `Uploaded ${words.length} words: ${response.created} created, ${response.updated} updated`,
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
