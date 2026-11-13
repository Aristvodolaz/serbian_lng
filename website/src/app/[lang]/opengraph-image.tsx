import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ImageResponse } from 'next/og';
import { getDict, isLang } from '@/content';

// Social preview: the street-plate idea from the site, in Bold Sofia Sans Condensed.
// Two subsets are loaded: Latin for "REČ" and Cyrillic for "РЕЧ" and the text.
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'РЕЧ · REČ';

export default async function Image({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const valid = isLang(lang) ? lang : 'ru';
  const t = getDict(valid);

  const fontDir = path.join(process.cwd(), 'public', 'fonts');
  const [cyr, lat] = await Promise.all([
    readFile(path.join(fontDir, 'sofia-sans-condensed-cyrillic-700-normal.woff')),
    readFile(path.join(fontDir, 'sofia-sans-condensed-latin-700-normal.woff')),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          background: '#E8ECFB',
          padding: 72,
          fontFamily: 'Sofia',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            background: '#1B3FA0',
            borderRadius: 24,
            padding: 12,
            width: '100%',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              border: '6px solid #FFFFFF',
              borderRadius: 10,
              padding: '48px 56px',
              color: '#FFFFFF',
            }}
          >
            <div style={{ fontSize: 120, lineHeight: 1 }}>Добро јутро</div>
            <div style={{ fontSize: 120, lineHeight: 1, marginTop: 12 }}>Dobro jutro</div>
          </div>
        </div>
        <div style={{ display: 'flex', marginTop: 40, fontSize: 40, color: '#0E1B3D' }}>{t.meta.title.split(' — ')[0]}</div>
        <div style={{ display: 'flex', marginTop: 8, fontSize: 30, color: '#33415F' }}>РЕЧ · REČ</div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Sofia', data: cyr, weight: 700, style: 'normal' },
        { name: 'Sofia', data: lat, weight: 700, style: 'normal' },
      ],
    },
  );
}
