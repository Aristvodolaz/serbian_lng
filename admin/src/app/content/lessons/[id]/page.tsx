import { fetchAdmin } from '@/lib/api';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  EditLessonForm,
  CreateExerciseForm,
  EditExerciseForm,
  DeleteButton,
  ContentPublishButton,
  StatusBadge,
  ExerciseTemplateSummary,
} from '@/components/forms/admin-forms';
import { UploadExercisesCsv } from '@/components/forms/upload-exercises-csv';
import { ExercisePayload, getEditorConfig, payloadPreview } from '@/lib/exercise-templates';

interface Lesson {
  id: string;
  unitId: string;
  title: string;
  titleLatin: string;
  titleTranslationRu: string;
  titleTranslationEn: string;
  descriptionRu?: string;
  descriptionEn?: string;
  minExercises?: number;
  status: string;
  order: number;
  xpReward: number;
  exercises?: Exercise[];
}

interface ValidationIssue {
  field: string;
  message: string;
}

interface Exercise {
  id: string;
  type: string;
  status: string;
  order: number;
  payload: ExercisePayload;
  validationIssues: ValidationIssue[];
}

export default async function LessonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let lesson: Lesson;
  try {
    lesson = await fetchAdmin(`/admin/lessons/${id}`, { redirectOnError: false });
  } catch {
    notFound();
  }
  const templates: ExerciseTemplateSummary[] = await fetchAdmin('/admin/exercise-templates', {
    redirectOnError: false,
  });

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/content/units/${lesson.unitId}`} className="text-indigo-600 hover:underline text-sm">
          ← Back to Unit
        </Link>
        <h1 className="text-2xl font-bold">
          {lesson.title} / {lesson.titleLatin}
        </h1>
        <StatusBadge status={lesson.status} />
        <ContentPublishButton resourceUrl={`/admin/lessons/${lesson.id}`} status={lesson.status} />
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 mb-6">
        <dl className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <dt className="text-gray-500">Translation RU</dt>
            <dd className="font-medium">{lesson.titleTranslationRu}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Translation EN</dt>
            <dd className="font-medium">{lesson.titleTranslationEn}</dd>
          </div>
          <div>
            <dt className="text-gray-500">XP Reward</dt>
            <dd className="font-medium">{lesson.xpReward}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Min published exercises</dt>
            <dd className="font-medium">{lesson.minExercises ?? 0}</dd>
          </div>
        </dl>
        <EditLessonForm lesson={lesson} />
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Exercises ({lesson.exercises?.length || 0})</h2>
        <UploadExercisesCsv lessonId={lesson.id} lessonTitle={lesson.title} unitId={lesson.unitId} />
      </div>

      <div className="mb-6">
        <CreateExerciseForm lessonId={lesson.id} templates={templates} />
      </div>

      <div className="space-y-4">
        {lesson.exercises?.map((exercise) => {
          const config = getEditorConfig(exercise.type);
          const preview = payloadPreview(exercise.payload, exercise.type);
          return (
            <div key={exercise.id} className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">
                      {config?.label ?? exercise.type}
                    </span>
                    <StatusBadge status={exercise.status} />
                  </div>
                  <p className="font-medium">{preview.title}</p>
                  <p className="text-xs text-gray-500">{preview.subtitle}</p>
                  <p className="text-xs text-gray-400">Order: {exercise.order}</p>
                </div>
                <div className="flex items-center gap-3">
                  <ContentPublishButton
                    resourceUrl={`/admin/exercises/${exercise.id}`}
                    status={exercise.status}
                  />
                  <DeleteButton url={`/admin/exercises/${exercise.id}`} label="Delete" />
                </div>
              </div>

              {exercise.validationIssues?.length > 0 && (
                <div className="mb-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
                  {exercise.validationIssues.map((issue, i) => (
                    <p key={i} className="text-xs text-amber-700">
                      ⚠ {issue.message}
                    </p>
                  ))}
                </div>
              )}

              <EditExerciseForm exercise={exercise} />
            </div>
          );
        })}
        {!lesson.exercises?.length && (
          <p className="text-center text-gray-500 py-8">No exercises yet</p>
        )}
      </div>
    </div>
  );
}
