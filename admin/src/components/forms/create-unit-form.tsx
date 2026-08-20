'use client';

export function CreateUnitForm() {
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const token = document.cookie
          .split('; ')
          .find((row) => row.startsWith('admin_access_token='))
          ?.split('=')[1];

        const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
        await fetch(`${BACKEND_URL}/admin/units`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            titleCyrillic: formData.get('titleCyrillic'),
            titleLatin: formData.get('titleLatin'),
            titleTranslation: formData.get('titleTranslation'),
          }),
        });
        window.location.reload();
      }}
      className="flex gap-2"
    >
      <input
        name="titleCyrillic"
        placeholder="Cyrillic"
        required
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
      />
      <input
        name="titleLatin"
        placeholder="Latin"
        required
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
      />
      <input
        name="titleTranslation"
        placeholder="Translation"
        required
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
      />
      <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
        Add Unit
      </button>
    </form>
  );
}
