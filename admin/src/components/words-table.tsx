'use client';

import Link from 'next/link';
import { WordStatusButton, StatusBadge } from '@/components/forms/admin-forms';
import { attributeLabel, WordAttributeField, WordAttributes } from '@/lib/word-attributes';
import { useAttributeLang } from '@/lib/attribute-lang';

export interface WordsTableRow {
  id: string;
  cyrillic: string;
  latin: string;
  translationRu: string;
  translationEn: string;
  exampleTranslationRu: string | null;
  exampleTranslationEn: string | null;
  status: string;
  partOfSpeech?: string | null;
  gender?: string | null;
  number?: string | null;
  declension?: string | null;
  conjugation?: string | null;
}

const ATTRIBUTE_COLUMNS: { key: WordAttributeField; label: string }[] = [
  { key: 'partOfSpeech', label: 'Part of speech' },
  { key: 'gender', label: 'Gender' },
  { key: 'number', label: 'Number' },
  { key: 'declension', label: 'Declension' },
  { key: 'conjugation', label: 'Conjugation' },
];

export function WordsTable({
  words,
  attributes,
}: {
  words: WordsTableRow[];
  attributes: WordAttributes;
}) {
  const { lang } = useAttributeLang();

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-gray-500">Cyrillic</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500">Latin</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500">Translation RU</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500">Translation EN</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500">Example Translation RU</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500">Example Translation EN</th>
            {ATTRIBUTE_COLUMNS.map((c) => (
              <th key={c.key} className="text-left px-4 py-3 font-medium text-gray-500">
                {c.label}
              </th>
            ))}
            <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500">Actions</th>
          </tr>
        </thead>
        <tbody>
          {words.map((word) => (
            <tr key={word.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="px-4 py-3 font-medium">{word.cyrillic}</td>
              <td className="px-4 py-3 text-gray-600">{word.latin}</td>
              <td className="px-4 py-3 text-gray-600">{word.translationRu}</td>
              <td className="px-4 py-3 text-gray-600">{word.translationEn}</td>
              <td className="px-4 py-3 text-gray-600">{word.exampleTranslationRu ?? ''}</td>
              <td className="px-4 py-3 text-gray-600">{word.exampleTranslationEn ?? ''}</td>
              {ATTRIBUTE_COLUMNS.map((c) => (
                <td
                  key={c.key}
                  className="px-4 py-3 text-gray-600"
                  title={word[c.key] ?? undefined}
                >
                  {attributeLabel(c.key, word[c.key], lang, attributes) ?? '—'}
                </td>
              ))}
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <StatusBadge status={word.status} />
                  <WordStatusButton wordId={word.id} status={word.status} />
                </div>
              </td>
              <td className="px-4 py-3">
                <Link href={`/content/words/${word.id}`} className="text-indigo-600 hover:underline">
                  Edit
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
