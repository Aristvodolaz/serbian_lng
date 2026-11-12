// Structured theory content blocks, stored as one jsonb payload.
// Grammar text is Serbian (cyrillic + latin); every block carries RU/EN
// translations (paragraph text or table caption/headers; word-form cells stay Serbian).

export interface Bilingual {
  cyrillic: string;
  latin: string;
}

export type TheoryBlock =
  | {
      type: 'heading';
      textCyrillic: string;
      textLatin: string;
      translationRu: string;
      translationEn: string;
    }
  | {
      type: 'paragraph';
      textCyrillic: string;
      textLatin: string;
      translationRu: string;
      translationEn: string;
    }
  | {
      type: 'table';
      captionCyrillic: string;
      captionLatin: string;
      captionTranslationRu: string;
      captionTranslationEn: string;
      headers: Bilingual[];
      headersTranslationRu: string[];
      headersTranslationEn: string[];
      rows: Bilingual[][];
    }
  | {
      type: 'example';
      cyrillic: string;
      latin: string;
      translationRu: string;
      translationEn: string;
    };

export interface TheoryPayload {
  version: 1;
  blocks: TheoryBlock[];
}

const BLOCK_TYPES = new Set(['heading', 'paragraph', 'table', 'example']);

const isBilingual = (value: unknown): boolean =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as Bilingual).cyrillic === 'string' &&
  typeof (value as Bilingual).latin === 'string';

// Returns the first validation error, or null when the payload is valid.
export function validateTheoryPayload(payload: unknown): string | null {
  if (typeof payload !== 'object' || payload === null) {
    return 'payload must be an object';
  }
  const { version, blocks } = payload as Record<string, unknown>;
  if (version !== 1) {
    return 'payload.version must be 1';
  }
  if (!Array.isArray(blocks)) {
    return 'payload.blocks must be an array';
  }
  if (blocks.length === 0) {
    return 'payload.blocks must not be empty';
  }
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (typeof block !== 'object' || block === null) {
      return `blocks[${i}] must be an object`;
    }
    const b = block as Record<string, unknown>;
    if (typeof b.type !== 'string' || !BLOCK_TYPES.has(b.type)) {
      return `blocks[${i}].type must be one of: heading, paragraph, table, example`;
    }
    switch (b.type) {
      case 'heading':
      case 'paragraph':
        if (typeof b.textCyrillic !== 'string' || typeof b.textLatin !== 'string') {
          return `blocks[${i}] (${b.type}) requires textCyrillic and textLatin strings`;
        }
        if (typeof b.translationRu !== 'string' || typeof b.translationEn !== 'string') {
          return `blocks[${i}] (${b.type}) requires translationRu and translationEn strings`;
        }
        break;
      case 'table': {
        if (
          typeof b.captionCyrillic !== 'string' ||
          typeof b.captionLatin !== 'string' ||
          typeof b.captionTranslationRu !== 'string' ||
          typeof b.captionTranslationEn !== 'string'
        ) {
          return `blocks[${i}] (table) requires captionCyrillic, captionLatin, captionTranslationRu and captionTranslationEn strings`;
        }
        if (!Array.isArray(b.headers) || b.headers.length === 0 || !b.headers.every(isBilingual)) {
          return `blocks[${i}] (table) requires a non-empty headers array of {cyrillic, latin}`;
        }
        if (
          !Array.isArray(b.headersTranslationRu) ||
          !Array.isArray(b.headersTranslationEn) ||
          b.headersTranslationRu.length !== b.headers.length ||
          b.headersTranslationEn.length !== b.headers.length ||
          !b.headersTranslationRu.every((x: unknown) => typeof x === 'string') ||
          !b.headersTranslationEn.every((x: unknown) => typeof x === 'string')
        ) {
          return `blocks[${i}] (table) requires headersTranslationRu/En string arrays the same length as headers`;
        }
        if (!Array.isArray(b.rows) || !b.rows.every((row) => Array.isArray(row))) {
          return `blocks[${i}] (table) requires a rows array of arrays`;
        }
        const width = b.headers.length;
        const rows = b.rows as unknown[];
        for (let r = 0; r < rows.length; r++) {
          const row = rows[r] as unknown[];
          if (row.length !== width || !row.every(isBilingual)) {
            return `blocks[${i}] (table) row ${r} must have ${width} {cyrillic, latin} cells`;
          }
        }
        break;
      }
      case 'example':
        if (
          typeof b.cyrillic !== 'string' ||
          typeof b.latin !== 'string' ||
          typeof b.translationRu !== 'string' ||
          typeof b.translationEn !== 'string'
        ) {
          return `blocks[${i}] (example) requires cyrillic, latin, translationRu and translationEn strings`;
        }
        break;
    }
  }
  return null;
}
