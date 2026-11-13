import type { Dict } from '@/content/ru';

// Native <details>: works without JavaScript and is keyboard-accessible.
export function Faq({ t }: { t: Dict }) {
  return (
    <section id="faq" aria-labelledby="faq-title" className="container-page scroll-mt-6 py-16 md:py-28">
      <h2 id="faq-title">{t.faq.title}</h2>
      <div className="mt-10 max-w-prose border-t border-line">
        {t.faq.items.map((item) => (
          <details key={item.q} className="group border-b border-line">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-6 py-4 text-[20px] font-semibold text-ink hover:text-enamel [&::-webkit-details-marker]:hidden">
              {item.q}
              <span aria-hidden="true" className="text-[24px] font-normal leading-none text-enamel group-open:hidden">
                +
              </span>
              <span aria-hidden="true" className="hidden text-[24px] font-normal leading-none text-enamel group-open:inline">
                −
              </span>
            </summary>
            <p className="pb-5 text-ink-soft">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
