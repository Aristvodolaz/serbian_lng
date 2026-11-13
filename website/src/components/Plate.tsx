'use client';

import { useState } from 'react';
import type { Lang } from '@/content';
import { words } from '@/content/words';

// The Belgrade street plate: Cyrillic on top, Latin below, same size.
export function Plate({ lang, nextLabel }: { lang: Lang; nextLabel: string }) {
  const [index, setIndex] = useState(0);
  const word = words[index];

  return (
    <div>
      {/* Container query: the word scales with the plate, not the viewport, so it never overflows. */}
      <div className="rounded-plate bg-enamel p-2" style={{ containerType: 'inline-size' }}>
        <div
          aria-live="polite"
          className="rounded-rule border-[3px] border-paper px-4 py-8 text-center text-paper md:px-8 md:py-12"
        >
          {/* key restarts the fade when the word changes */}
          <p
            key={index}
            lang="sr"
            className="whitespace-nowrap font-display leading-none motion-safe:animate-fade"
            style={{ fontSize: 'clamp(2.5rem, 17cqw, 7rem)' }}
          >
            <span className="block font-bold">{word.cyr}</span>
            <span className="mt-2 block font-semibold">{word.lat}</span>
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <p className="text-ink-soft">{word[lang]}</p>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setIndex((index + 1) % words.length)}
        >
          {nextLabel}
        </button>
      </div>
    </div>
  );
}
