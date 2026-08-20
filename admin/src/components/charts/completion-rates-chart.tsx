'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface CompletionData {
  lessonId: string;
  lessonTitle: string;
  completionRate: number;
  totalAttempts: number;
}

export function LessonCompletionChart({ data }: { data: CompletionData[] }) {
  const chartData = data.map((d) => ({
    name: d.lessonTitle.length > 15 ? d.lessonTitle.slice(0, 15) + '...' : d.lessonTitle,
    rate: Math.round(d.completionRate * 100),
    attempts: d.totalAttempts,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
        <YAxis label={{ value: '%', angle: -90, position: 'insideLeft' }} />
        <Tooltip />
        <Bar dataKey="rate" fill="#4f46e5" />
      </BarChart>
    </ResponsiveContainer>
  );
}
