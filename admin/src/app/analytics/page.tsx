import { fetchAdmin } from '@/lib/api';
import { UserGrowthChart } from '@/components/charts/user-growth-chart';
import { ActivityHeatmap } from '@/components/charts/activity-heatmap';
import { LessonCompletionChart } from '@/components/charts/completion-rates-chart';

export default async function AnalyticsPage() {
  const [userGrowth, heatmap, lessonCompletion] = await Promise.all([
    fetchAdmin<any[]>('/admin/analytics/user-growth?days=30'),
    fetchAdmin<any[]>('/admin/analytics/activity-heatmap?days=90'),
    fetchAdmin<any[]>('/admin/analytics/lesson-completion'),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Analytics</h1>

      <div className="space-y-8">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h2 className="font-semibold mb-4">User Growth (30 days)</h2>
          <UserGrowthChart data={userGrowth} />
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h2 className="font-semibold mb-4">Activity Heatmap (90 days)</h2>
          <ActivityHeatmap data={heatmap} />
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h2 className="font-semibold mb-4">Lesson Completion Rates</h2>
          <LessonCompletionChart data={lessonCompletion} />
        </div>
      </div>
    </div>
  );
}
