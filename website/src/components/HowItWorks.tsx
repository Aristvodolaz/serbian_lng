import type { Dict } from '@/content/ru';
import { Pair, PhoneMock } from './PhoneMock';

const card = 'rounded-plate bg-paper px-4 py-3';

function LessonMock() {
  const options = [
    ['јутро', 'jutro', true],
    ['хвала', 'hvala', false],
    ['молим', 'molim', false],
  ] as const;
  return (
    <PhoneMock>
      <div className="h-2 rounded-full bg-line">
        <div className="h-2 w-3/5 rounded-full bg-enamel" />
      </div>
      <div className={`${card} mt-2 text-[20px]`}>
        <Pair cyr="Добро ___!" lat="Dobro ___!" />
      </div>
      {options.map(([cyr, lat, picked]) => (
        <div
          key={lat}
          className={picked ? 'rounded-plate bg-enamel px-4 py-3 text-paper' : card}
        >
          {picked ? (
            <>
              <span className="block font-semibold">{cyr}</span>
              <span className="block">{lat}</span>
            </>
          ) : (
            <Pair cyr={cyr} lat={lat} />
          )}
        </div>
      ))}
    </PhoneMock>
  );
}

function DictionaryMock() {
  const rows = [
    ['кафа', 'kafa', 'именица, ж. р.'],
    ['хлеб', 'hleb', 'именица, м. р.'],
    ['читати', 'čitati', 'глагол'],
  ];
  return (
    <PhoneMock>
      <div className="rounded-control border-[1.5px] border-field bg-paper px-4 py-3 text-ink-soft">
        Претрага · Pretraga
      </div>
      {rows.map(([cyr, lat, kind]) => (
        <div key={lat} className={card}>
          <Pair cyr={cyr} lat={lat} />
          <span className="mt-1 block text-enamel">{kind}</span>
        </div>
      ))}
    </PhoneMock>
  );
}

function FlashcardMock() {
  return (
    <PhoneMock>
      <div className={`${card} flex flex-1 flex-col items-center justify-center text-center font-display text-[40px] leading-none`}>
        <span className="font-bold text-ink">љубав</span>
        <span className="mt-2 font-semibold text-ink-soft">ljubav</span>
      </div>
      <div className="grid grid-cols-2 gap-3 text-center font-medium">
        <div className="rounded-control border-[1.5px] border-field px-2 py-3 text-ink">Још учим</div>
        <div className="rounded-control bg-enamel px-2 py-3 text-paper">Знам</div>
      </div>
    </PhoneMock>
  );
}

const mocks = [LessonMock, DictionaryMock, FlashcardMock];

export function HowItWorks({ t }: { t: Dict }) {
  return (
    <section id="how" aria-labelledby="how-title" className="container-page scroll-mt-6 py-16 md:py-28">
      <h2 id="how-title">{t.how.title}</h2>
      <p className="mt-4 max-w-prose text-ink-soft">{t.how.lead}</p>
      <ul className="mt-10 grid gap-12 md:mt-16 lg:grid-cols-3 lg:gap-10">
        {t.how.items.map((item, i) => {
          const Mock = mocks[i];
          return (
            <li key={item.title}>
              <Mock />
              <h3 className="mt-6">{item.title}</h3>
              <p className="mt-2 max-w-prose text-ink-soft">{item.text}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
