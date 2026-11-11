// Structured theory content blocks, stored as one jsonb payload.
// Grammar text is Serbian (cyrillic + latin); RU/EN translations exist only
// on example sentences, matching the app-wide content convention.

export interface Bilingual {
  cyrillic: string;
  latin: string;
}

export type TheoryBlock =
  | { type: 'heading'; textCyrillic: string; textLatin: string }
  | { type: 'paragraph'; textCyrillic: string; textLatin: string }
  | {
      type: 'table';
      captionCyrillic: string;
      captionLatin: string;
      headers: Bilingual[];
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
        break;
      case 'table': {
        if (
          typeof b.captionCyrillic !== 'string' ||
          typeof b.captionLatin !== 'string'
        ) {
          return `blocks[${i}] (table) requires captionCyrillic and captionLatin strings`;
        }
        if (!Array.isArray(b.headers) || b.headers.length === 0 || !b.headers.every(isBilingual)) {
          return `blocks[${i}] (table) requires a non-empty headers array of {cyrillic, latin}`;
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
