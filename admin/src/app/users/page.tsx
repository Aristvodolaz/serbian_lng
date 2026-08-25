import { fetchAdmin } from '@/lib/api';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  displayName: string;
  role: string;
  banned: boolean;
  xp: number;
  streakDays: number;
  languagePreference: string;
  createdAt: string;
}

interface PaginatedUsers {
  data: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const sp = await searchParams;
  const page = parseInt(sp.page || '1');
  const users: PaginatedUsers = await fetchAdmin(`/admin/users?page=${page}&limit=20`);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Users</h1>
        <span className="text-sm text-gray-500">
          {users.total} total, page {users.page}/{users.totalPages}
        </span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Email</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Language</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Role</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">XP</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Streak</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Created</th>
            </tr>
          </thead>
          <tbody>
            {users.data.map((user) => (
              <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link href={`/users/${user.id}`} className="text-indigo-600 hover:underline">
                    {user.displayName}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600">{user.email}</td>
                <td className="px-4 py-3 text-gray-600">{user.languagePreference}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3">{user.xp}</td>
                <td className="px-4 py-3">{user.streakDays}</td>
                <td className="px-4 py-3">
                  {user.banned ? (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                      Banned
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      Active
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex gap-2 mt-4">
        {users.page > 1 && (
          <Link href={`/users?page=${users.page - 1}`} className="px-3 py-1 bg-white border rounded-lg hover:bg-gray-50 text-sm">
            Previous
          </Link>
        )}
        {users.page < users.totalPages && (
          <Link href={`/users?page=${users.page + 1}`} className="px-3 py-1 bg-white border rounded-lg hover:bg-gray-50 text-sm">
            Next
          </Link>
        )}
      </div>
    </div>
  );
}
