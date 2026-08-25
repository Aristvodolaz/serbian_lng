import { fetchAdmin } from '@/lib/api';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { UpdateUserForm } from '@/components/modals/update-user-form';

interface UserDetail {
  id: string;
  email: string;
  displayName: string;
  role: string;
  banned: boolean;
  xp: number;
  streakDays: number;
  languagePreference: string;
  lessonsCompleted: number;
  wordsLearned: number;
  badgesEarned: number;
  recentLessons: Array<{
    lessonId: string;
    title: string;
    correctCount: number;
    totalCount: number;
    completedAt: string;
  }>;
}

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let user: UserDetail;
  try {
    user = await fetchAdmin(`/admin/users/${id}`, { redirectOnError: false });
  } catch {
    notFound();
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/users" className="text-indigo-600 hover:underline text-sm">
          ← Back to Users
        </Link>
        <h1 className="text-2xl font-bold">{user.displayName}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h2 className="font-semibold mb-4">Profile</h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-gray-500">Email</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Role</dt>
              <dd>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {user.role}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Status</dt>
              <dd>
                {user.banned ? (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Banned</span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Active</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Language</dt>
              <dd>
                {user.languagePreference === 'ru' ? 'Русский' : user.languagePreference === 'en' ? 'English' : user.languagePreference}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">XP</dt>
              <dd>{user.xp}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Streak</dt>
              <dd>{user.streakDays} days</dd>
            </div>
          </dl>

          <div className="mt-6">
            <UpdateUserForm userId={user.id} role={user.role} banned={user.banned} />
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h2 className="font-semibold mb-4">Progress</h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-gray-500">Lessons Completed</dt>
              <dd className="text-xl font-bold">{user.lessonsCompleted}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Words Learned</dt>
              <dd className="text-xl font-bold">{user.wordsLearned}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Badges Earned</dt>
              <dd className="text-xl font-bold">{user.badgesEarned}</dd>
            </div>
          </dl>
        </div>

        {/* Recent Lessons */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 lg:col-span-2">
          <h2 className="font-semibold mb-4">Recent Lessons</h2>
          {user.recentLessons.length === 0 ? (
            <p className="text-sm text-gray-500">No lessons completed yet</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-gray-500">Lesson</th>
                  <th className="text-left py-2 text-gray-500">Score</th>
                  <th className="text-left py-2 text-gray-500">Completed</th>
                </tr>
              </thead>
              <tbody>
                {user.recentLessons.map((lesson) => (
                  <tr key={lesson.lessonId} className="border-b border-gray-100">
                    <td className="py-2">{lesson.title}</td>
                    <td className="py-2">
                      {lesson.correctCount}/{lesson.totalCount}
                    </td>
                    <td className="py-2 text-gray-500">
                      {new Date(lesson.completedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
