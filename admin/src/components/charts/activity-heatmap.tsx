'use client';

interface HeatmapData {
  date: string;
  hour: number;
  count: number;
}

export function ActivityHeatmap({ data }: { data: HeatmapData[] }) {
  const grid: Array<{ date: string; hour: number; count: number }> = [];
  const dates = [...new Set(data.map((d) => d.date))].sort();
  const hours = Array.from({ length: 24 }, (_, h) => h);

  const lookup = new Map<string, number>();
  data.forEach((d) => lookup.set(`${d.date}-${d.hour}`, d.count));

  dates.forEach((date) => {
    hours.forEach((hour) => {
      grid.push({ date, hour, count: lookup.get(`${date}-${hour}`) || 0 });
    });
  });

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="overflow-x-auto">
      <div style={{ display: 'grid', gridTemplateColumns: `40px repeat(${dates.length}, 1fr)`, gap: '2px', fontSize: '10px' }}>
        <div />
        {dates.map((date) => (
          <div key={date} className="text-gray-500 text-center" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', height: '60px' }}>
            {date.slice(5)}
          </div>
        ))}
        {hours.map((hour) => (
          <>
            <div className="text-gray-500 flex items-center justify-end pr-1">{hour}h</div>
            {dates.map((date) => {
              const cell = grid.find((g) => g.date === date && g.hour === hour);
              const intensity = cell ? cell.count / maxCount : 0;
              return (
                <div
                  key={`${date}-${hour}`}
                  title={`${date} ${hour}:00 — ${cell?.count || 0} actions`}
                  style={{
                    width: '100%',
                    aspectRatio: '1',
                    backgroundColor: `rgba(79, 70, 229, ${intensity * 0.8 + 0.05})`,
                    borderRadius: '2px',
                  }}
                />
              );
            })}
          </>
        ))}
      </div>
    </div>
  );
}
