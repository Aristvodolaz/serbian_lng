'use client';

import { CsvUploadButton } from './admin-forms';

export function UploadLessonsCsv({
  unitId,
  unitTitle,
}: {
  unitId: string;
  unitTitle: string;
}) {
  return (
    <CsvUploadButton
      endpoint="/admin/lessons/bulk"
      bodyKey="lessons"
      mapRows={(data) => {
        const rows = data
          .filter((row) => {
            if (!row.title?.trim()) return false;
            if (row.kind?.trim() === 'checkpoint') return true;
            return !unitTitle || !row.unitTitle?.trim() || row.unitTitle.trim() === unitTitle;
          })
          .map((row) => {
            const isCheckpoint = row.kind?.trim() === 'checkpoint';
            const lesson: Record<string, unknown> = isCheckpoint
              ? { kind: 'checkpoint', title: row.title.trim() }
              : { unitId, title: row.title.trim() };
            const latin = row.titleLatin?.trim();
            const ru = row.titleTranslationRu?.trim();
            const en = row.titleTranslationEn?.trim();
            if (latin) lesson.titleLatin = latin;
            if (ru) lesson.titleTranslationRu = ru;
            if (en) lesson.titleTranslationEn = en;
            const xp = parseInt(row.xpReward);
            lesson.xpReward = Number.isNaN(xp) ? 10 : xp;
            if (isCheckpoint) {
              const sectionTitle = row.sectionTitle?.trim();
              if (sectionTitle) lesson.sectionTitle = sectionTitle;
            }
            return lesson;
          });
        return {
          rows,
          format: (response) => {
            const totalWithTitle = data.filter((row) => row.title?.trim()).length;
            const skipped = totalWithTitle - rows.length;
            let msg = `Uploaded ${rows.length} lessons: ${response.created} created, ${response.updated} updated`;
            if (skipped > 0) msg += ` | ${skipped} rows skipped (other unit)`;
            return msg;
          },
        };
      }}
    />
  );
}
