'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

export type AttributeLang = 'ru' | 'en';

const STORAGE_KEY = 'attribute-lang';

const AttributeLangContext = createContext<{
  lang: AttributeLang;
  setLang: (lang: AttributeLang) => void;
}>({ lang: 'ru', setLang: () => {} });

export function AttributeLangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<AttributeLang>('ru');

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'ru' || stored === 'en') setLangState(stored);
  }, []);

  const setLang = useCallback((next: AttributeLang) => {
    setLangState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  return (
    <AttributeLangContext.Provider value={{ lang, setLang }}>
      {children}
    </AttributeLangContext.Provider>
  );
}

export function useAttributeLang() {
  return useContext(AttributeLangContext);
}

export function AttributeLangToggle() {
  const { lang, setLang } = useAttributeLang();
  const base = 'px-3 py-1 text-sm font-medium rounded-lg border transition-colors';
  const active = 'bg-indigo-600 text-white border-indigo-600';
  const idle = 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50';
  return (
    <div className="flex items-center gap-1">
      {(['ru', 'en'] as AttributeLang[]).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`${base} ${lang === l ? active : idle}`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
