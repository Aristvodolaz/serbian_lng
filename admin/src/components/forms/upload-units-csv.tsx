'use client';

import { CsvUploadButton } from './admin-forms';

export function UploadUnitsCsv() {
  return (
    <CsvUploadButton
      endpoint="/admin/units/bulk"
      bodyKey="units"
      mapRows={(data) => {
        const rows = data
          .filter((row) => row.titleCyrillic?.trim())
          .map((row) => {
            const unit: Record<string, unknown> = { titleCyrillic: row.titleCyrillic.trim() };
            const latin = row.titleLatin?.trim();
            const ru = row.titleTranslationRu?.trim();
            const en = row.titleTranslationEn?.trim();
            if (latin) unit.titleLatin = latin;
            if (ru) unit.titleTranslationRu = ru;
            if (en) unit.titleTranslationEn = en;
            const sectionTitle = row.sectionTitle?.trim();
            if (sectionTitle) unit.sectionTitle = sectionTitle;
            return unit;
          });
        return {
          rows,
          format: (response) =>
            `Uploaded ${rows.length} units: ${response.created} created, ${response.updated} updated`,
        };
      }}
    />
  );
}
