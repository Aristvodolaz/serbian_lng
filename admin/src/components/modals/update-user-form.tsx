'use client';

import { useState } from 'react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

export function UpdateUserForm({
  userId,
  role,
  banned,
}: {
  userId: string;
  role: string;
  banned: boolean;
}) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const newRole = formData.get('role') as string;
    const newBanned = formData.get('banned') === 'on';

    try {
      const token = document.cookie
        .split('; ')
        .find((row) => row.startsWith('admin_access_token='))
        ?.split('=')[1];

      await fetch(`${BACKEND_URL}/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole, banned: newBanned }),
      });
      window.location.reload();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Role</label>
        <select
          name="role"
          defaultValue={role}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" name="banned" defaultChecked={banned} id="banned" />
        <label htmlFor="banned" className="text-sm text-gray-700">Banned</label>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
      >
        {loading ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
}
