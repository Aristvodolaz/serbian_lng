import { fetchAdmin } from '@/lib/api';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { EditLessonForm, CreateExerciseForm, EditExerciseForm, DeleteButton, EditChoiceForm, AddChoiceForm } from '@/components/forms/admin-forms';
import { UploadExercisesCsv } from '@/components/forms/upload-exercises-csv';
import { getTemplate, ExerciseTemplate } from '@/lib/exercise-templates';

interface Lesson {
  id: string;
  unitId: string;
  title: string;
  titleLatin: string;
  titleTranslationRu: string;
  titleTranslationEn: string;
  order: number;
  xpReward: number;
  exercises?: Exercise[];
}

interface Exercise {
  id: string;
  type: string;
  promptCyrillic: string;
  promptLatin: string;
  promptTranslationRu: string;
  promptTranslationEn: string;
  order: number;
  choices: Array<{ id: string; text: string; textRu: string; isCorrect: boolean; order: number }>;
}

export default async function LessonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let lesson: Lesson;
  try {
    lesson = await fetchAdmin(`/admin/lessons/${id}`, { redirectOnError: false });
  } catch {
    notFound();
  }
  const templates: ExerciseTemplate[] = await fetchAdmin('/admin/exercise-templates', {
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
        </dl>
        <EditLessonForm lesson={lesson} />
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Exercises ({lesson.exercises?.length || 0})</h2>
        <div className="flex items-center gap-4">
          <UploadExercisesCsv lessonId={lesson.id} templates={templates} />
          <CreateExerciseForm lessonId={lesson.id} templates={templates} />
        </div>
      </div>

      <div className="space-y-4">
        {lesson.exercises?.map((exercise) => {
          const template = getTemplate(templates, exercise.type);
          return (
          <div key={exercise.id} className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-medium">{exercise.promptCyrillic} / {exercise.promptLatin}</p>
                <p className="text-xs text-gray-500">
                  RU: {exercise.promptTranslationRu} • EN: {exercise.promptTranslationEn}
                </p>
                <p className="text-xs text-gray-400">Type: {exercise.type} • Order: {exercise.order}</p>
              </div>
              <DeleteButton url={`/admin/exercises/${exercise.id}`} label="Delete" />
            </div>
            <div className="space-y-1 mb-2">
              {exercise.choices
                .sort((a, b) => a.order - b.order)
                .map((choice) => (
                  <EditChoiceForm
                    key={choice.id}
                    choice={choice}
                    exerciseId={exercise.id}
                    totalChoices={exercise.choices.length}
                    template={template}
                  />
                ))}
            </div>
            <AddChoiceForm exerciseId={exercise.id} nextOrder={exercise.choices.length + 1} template={template} />
            <EditExerciseForm exercise={exercise} template={template} />
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
