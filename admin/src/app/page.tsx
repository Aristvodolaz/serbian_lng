import { fetchAdmin } from '@/lib/api';
import { StatCard } from '@/components/stats-card';

interface DashboardStats {
  totalUsers: number;
  activeUsersToday: number;
  activeUsersThisWeek: number;
  newUsersThisWeek: number;
  totalLessonsCompleted: number;
  lessonsCompletedToday: number;
  totalWords: number;
  totalUnits: number;
  totalLessons: number;
  bannedUsers: number;
}

export default async function DashboardPage() {
  const stats: DashboardStats = await fetchAdmin('/admin/dashboard');

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Users" value={stats.totalUsers} />
        <StatCard title="Active Today" value={stats.activeUsersToday} />
        <StatCard title="Active This Week" value={stats.activeUsersThisWeek} />
        <StatCard title="New This Week" value={stats.newUsersThisWeek} />
        <StatCard title="Lessons Completed" value={stats.totalLessonsCompleted} />
        <StatCard title="Completed Today" value={stats.lessonsCompletedToday} />
        <StatCard title="Total Words" value={stats.totalWords} />
        <StatCard title="Units" value={stats.totalUnits} />
        <StatCard title="Lessons" value={stats.totalLessons} />
        <StatCard title="Banned Users" value={stats.bannedUsers} />
      </div>
    </div>
  );
}
