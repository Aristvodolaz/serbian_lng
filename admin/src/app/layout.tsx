import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/sidebar';
import { AttributeLangProvider } from '@/lib/attribute-lang';

export const metadata: Metadata = {
  title: 'REČ Admin',
  description: 'Admin panel for REČ Serbian language learning app',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <AttributeLangProvider>
          <div className="flex">
            <Sidebar />
            <main className="ml-64 flex-1 p-8">{children}</main>
          </div>
        </AttributeLangProvider>
      </body>
    </html>
  );
}
