// A simplified app screen drawn in markup. Decorative: the text next to it carries the meaning.
export function PhoneMock({ children }: { children: React.ReactNode }) {
  return (
    <div
      aria-hidden="true"
      lang="sr"
      className="flex h-[400px] w-full max-w-[260px] flex-col gap-3 rounded-phone border-2 border-ink bg-ground p-4 pt-8 text-[15px] leading-snug"
    >
      {children}
    </div>
  );
}

export function Pair({ cyr, lat }: { cyr: string; lat: string }) {
  return (
    <>
      <span className="block font-semibold text-ink">{cyr}</span>
      <span className="block text-ink-soft">{lat}</span>
    </>
  );
}
