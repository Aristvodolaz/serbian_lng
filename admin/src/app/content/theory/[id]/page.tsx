import { fetchAdmin } from '@/lib/api';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { EditTheoryForm } from '@/components/forms/theory-form';
import { DeleteButton, ContentPublishButton, StatusBadge } from '@/components/forms/admin-forms';

interface TheoryTopic {
  id: string;
  sectionId: string;
  sectionTitleCyrillic: string;
  titleCyrillic: string;
  titleLatin: string;
  titleTranslationRu: string;
  titleTranslationEn: string;
  payload: unknown;
  status: string;
  order: number;
}

interface SectionOption {
  id: string;
  titleCyrillic: string;
}

export default async function TheoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [topic, sectionsRes] = await Promise.all([
    fetchAdmin<TheoryTopic>(`/admin/theory/${id}`, { redirectOnError: false }),
    fetchAdmin<{ data: SectionOption[] }>('/admin/sections?limit=100'),
  ]).catch(() => {
    notFound();
  });
  if (!topic) notFound();

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/content/theory" className="text-indigo-600 hover:underline text-sm">
          ← Back to Theory
        </Link>
        <h1 className="text-2xl font-bold">
          {topic.titleCyrillic} / {topic.titleLatin}
        </h1>
        <StatusBadge status={topic.status} />
        <ContentPublishButton resourceUrl={`/admin/theory/${topic.id}`} status={topic.status} />
        <DeleteButton url={`/admin/theory/${topic.id}`} confirmMessage="Delete this theory topic permanently?" />
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <EditTheoryForm theory={topic} sections={sectionsRes.data} />
      </div>
    </div>
  );
}
