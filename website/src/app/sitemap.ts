import type { MetadataRoute } from 'next';
import { langs } from '@/content';
import { siteUrl } from '@/lib/site';

const paths = ['', '/privacy', '/terms', '/cookies', '/consent', '/support'];

export default function sitemap(): MetadataRoute.Sitemap {
  return langs.flatMap((lang) =>
    paths.map((path) => ({
      url: `${siteUrl}/${lang}${path}`,
      lastModified: new Date('2026-11-13'),
      alternates: {
        languages: Object.fromEntries(langs.map((l) => [l, `${siteUrl}/${l}${path}`])),
      },
    })),
  );
}
