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
            titleTranslationRu: formData.get('titleTranslationRu'),
            titleTranslationEn: formData.get('titleTranslationEn'),
          }),
        });
        window.location.reload();
      }}
      className="flex gap-2 flex-wrap"
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
        name="titleTranslationRu"
        placeholder="Translation RU"
        required
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
      />
      <input
        name="titleTranslationEn"
        placeholder="Translation EN"
        required
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
      />
      <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
        Add Unit
      </button>
    </form>
  );
}
