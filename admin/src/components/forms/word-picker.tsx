'use client';

import { useEffect, useRef, useState } from 'react';
import { adminFetch } from '@/lib/client-api';

export interface WordOption {
  id: string;
  cyrillic?: string;
  latin?: string;
  translationRu?: string | null;
  translationEn?: string | null;
}

// Links an exercise answer to a dictionary Word via wordId. The Word is the
// source of truth for that answer; inline payload fields remain as fallback.
export function WordPicker({
  value,
  onChange,
}: {
  value: WordOption | null;
  onChange: (word: WordOption | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<WordOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resolved, setResolved] = useState<WordOption | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // When only an id is known (e.g. loading an existing exercise), resolve the
  // word so the chip can show cyrillic/latin instead of a bare id.
  useEffect(() => {
    if (!value) {
      setResolved(null);
      return;
    }
    if (value.cyrillic) {
      setResolved(value);
      return;
    }
    let cancelled = false;
    adminFetch(`/admin/words/${value.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((w) => {
        if (!cancelled && w) setResolved(w);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [value?.id]);

  useEffect(() => {
    if (!open || !query.trim()) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await adminFetch(
          `/admin/words?search=${encodeURIComponent(query.trim())}&limit=8`,
        );
        if (!res.ok) throw new Error('search failed');
        const data = await res.json();
        setResults(data.data ?? []);
        setError('');
      } catch {
        setError('Word search failed');
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query, open]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (value) {
    const w = resolved ?? value;
    return (
      <div className="flex items-center gap-2">
        <span className="px-2 py-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs whitespace-nowrap">
          {w.cyrillic || w.latin || w.id}
        </span>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-xs text-gray-400 hover:text-gray-600"
          title="Unlink word"
        >
          ✕ unlink
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative min-w-[180px]">
      <input
        type="text"
        placeholder="Link a Word…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
      />
      {open && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-auto">
          {loading && <div className="px-3 py-2 text-xs text-gray-400">Searching…</div>}
          {!loading && error && <div className="px-3 py-2 text-xs text-red-500">{error}</div>}
          {!loading && !error && !query.trim() && (
            <div className="px-3 py-2 text-xs text-gray-400">Type to search words</div>
          )}
          {!loading && !error && query.trim() && results.length === 0 && (
            <div className="px-3 py-2 text-xs text-gray-400">No words found</div>
          )}
          {results.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => {
                onChange(w);
                setOpen(false);
                setQuery('');
              }}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 text-xs"
            >
              <span className="font-medium">{w.cyrillic}</span>
              <span className="text-gray-400"> / {w.latin}</span>
              {w.translationEn && <span className="text-gray-500"> — {w.translationEn}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
