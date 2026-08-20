import { fetchAdmin } from '@/lib/api';
import { notFound } from 'next/navigation';
import Link from 'next/link';

interface Lesson {
  id: string;
  unitId: string;
  title: string;
  titleLatin: string;
  titleTranslation: string;
  order: number;
  xpReward: number;
  exercises?: Exercise[];
}

interface Exercise {
  id: string;
  type: string;
  promptCyrillic: string;
  promptLatin: string;
  order: number;
  choices: Array<{ id: string; text: string; isCorrect: boolean; order: number }>;
}

export default async function LessonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let lesson: Lesson;
  try {
    lesson = await fetchAdmin(`/admin/lessons/${id}`, { redirectOnError: false });
  } catch {
    notFound();
  }

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
            <dt className="text-gray-500">Translation</dt>
            <dd className="font-medium">{lesson.titleTranslation}</dd>
          </div>
          <div>
            <dt className="text-gray-500">XP Reward</dt>
            <dd className="font-medium">{lesson.xpReward}</dd>
          </div>
        </dl>
        <EditLessonForm lesson={lesson} />
      </div>

      {/* Exercises */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Exercises ({lesson.exercises?.length || 0})</h2>
        <CreateExerciseForm lessonId={lesson.id} />
      </div>

      <div className="space-y-4">
        {lesson.exercises?.map((exercise) => (
          <div key={exercise.id} className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-medium">{exercise.promptCyrillic} / {exercise.promptLatin}</p>
                <p className="text-xs text-gray-500">Type: {exercise.type} • Order: {exercise.order}</p>
              </div>
              <DeleteButton url={`/admin/exercises/${exercise.id}`} label="Delete" />
            </div>
            <div className="space-y-2">
              {exercise.choices.map((choice) => (
                <div
                  key={choice.id}
                  className={`px-3 py-2 rounded-lg text-sm ${
                    choice.isCorrect
                      ? 'bg-green-50 text-green-800 border border-green-200'
                      : 'bg-gray-50 text-gray-700 border border-gray-200'
                  }`}
                >
                  {choice.text} {choice.isCorrect && '✓'}
                </div>
              ))}
            </div>
            <EditExerciseForm exercise={exercise} />
          </div>
        ))}
        {!lesson.exercises?.length && (
          <p className="text-center text-gray-500 py-8">No exercises yet</p>
        )}
      </div>
    </div>
  );
}

function EditLessonForm({ lesson }: { lesson: Lesson }) {
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const token = document.cookie.split('; ').find((row) => row.startsWith('admin_access_token='))?.split('=')[1];
        const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
        await fetch(`${BACKEND_URL}/admin/lessons/${lesson.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            title: formData.get('title'),
            titleLatin: formData.get('titleLatin'),
            titleTranslation: formData.get('titleTranslation'),
            xpReward: parseInt(formData.get('xpReward') as string),
          }),
        });
        window.location.reload();
      }}
      className="flex gap-2"
    >
      <input name="title" defaultValue={lesson.title} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
      <input name="titleLatin" defaultValue={lesson.titleLatin} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
      <input name="titleTranslation" defaultValue={lesson.titleTranslation} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
      <input name="xpReward" type="number" defaultValue={lesson.xpReward} className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-20" />
      <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
        Save
      </button>
    </form>
  );
}

function CreateExerciseForm({ lessonId }: { lessonId: string }) {
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const token = document.cookie.split('; ').find((row) => row.startsWith('admin_access_token='))?.split('=')[1];
        const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

        const choicesStr = formData.get('choices') as string;
        const choices = choicesStr.split('\n').filter(Boolean).map((line, i) => {
          const [isCorrect, ...textParts] = line.trim().split(' ');
          return {
            text: textParts.join(' '),
            isCorrect: isCorrect === '✓',
            order: i + 1,
          };
        });

        await fetch(`${BACKEND_URL}/admin/lessons/${lessonId}/exercises`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            promptCyrillic: formData.get('promptCyrillic'),
            promptLatin: formData.get('promptLatin'),
            choices,
          }),
        });
        window.location.reload();
      }}
      className="flex gap-2 flex-wrap"
    >
      <input name="promptCyrillic" placeholder="Cyrillic" required className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
      <input name="promptLatin" placeholder="Latin" required className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
      <textarea name="choices" placeholder="✓ correct answer&#10;wrong answer 1&#10;wrong answer 2" required className="px-3 py-2 border border-gray-300 rounded-lg text-sm h-20" />
      <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
        Add Exercise
      </button>
    </form>
  );
}

function EditExerciseForm({ exercise }: { exercise: Exercise }) {
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const token = document.cookie.split('; ').find((row) => row.startsWith('admin_access_token='))?.split('=')[1];
        const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
        await fetch(`${BACKEND_URL}/admin/exercises/${exercise.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            promptCyrillic: formData.get('promptCyrillic'),
            promptLatin: formData.get('promptLatin'),
          }),
        });
        window.location.reload();
      }}
      className="flex gap-2 mt-3"
    >
      <input name="promptCyrillic" defaultValue={exercise.promptCyrillic} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
      <input name="promptLatin" defaultValue={exercise.promptLatin} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
      <button type="submit" className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium">
        Save
      </button>
    </form>
  );
}

function DeleteButton({ url, label }: { url: string; label: string }) {
  return (
    <button
      onClick={async () => {
        if (!confirm('Are you sure?')) return;
        const token = document.cookie.split('; ').find((row) => row.startsWith('admin_access_token='))?.split('=')[1];
        const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
        await fetch(`${BACKEND_URL}${url}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        window.location.reload();
      }}
      className="text-red-600 hover:text-red-800 text-sm"
    >
      {label}
    </button>
  );
}
