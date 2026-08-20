'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Award,
  BarChart3,
  LogOut,
} from 'lucide-react';

const links = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/users', label: 'Users', icon: Users },
  { href: '/content/units', label: 'Units', icon: BookOpen },
  { href: '/content/words', label: 'Words', icon: BookOpen },
  { href: '/content/badges', label: 'Badges', icon: Award },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();

  const handleLogout = () => {
    document.cookie = 'admin_access_token=; Path=/; Max-Age=0';
    document.cookie = 'admin_refresh_token=; Path=/; Max-Age=0';
    window.location.href = '/login';
  };

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 p-6">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-indigo-700">REČ Admin</h1>
      </div>
      <nav className="space-y-1">
        {links.map((link) => {
          const active = pathname === link.href || pathname.startsWith(link.href + '/');
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                active
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="absolute bottom-6 left-6">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 w-full"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
