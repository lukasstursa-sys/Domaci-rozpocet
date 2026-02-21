import React from 'react';
import { useData } from '../../contexts/DataContext';
import { formatCurrency } from '../../utils/format';

export default function CategoryChart() {
  const { categoryBreakdown, overview } = useData();

  if (categoryBreakdown.length === 0) {
    return (
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
          Rozpad výdajů
        </h3>
        <p className="text-gray-400 dark:text-gray-500 text-center py-8">
          Zatím žádné výdaje
        </p>
      </div>
    );
  }

  // Simple donut chart using SVG
  const size = 180;
  const center = size / 2;
  const radius = 70;
  const innerRadius = 45;

  let startAngle = 0;
  const slices = categoryBreakdown.map((item) => {
    const angle = (item.percentage / 100) * 360;
    const slice = {
      ...item,
      startAngle,
      endAngle: startAngle + angle,
    };
    startAngle += angle;
    return slice;
  });

  function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function describeArc(cx: number, cy: number, r: number, start: number, end: number) {
    const s = polarToCartesian(cx, cy, r, end);
    const e = polarToCartesian(cx, cy, r, start);
    const largeArc = end - start > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 0 ${e.x} ${e.y}`;
  }

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
        Rozpad výdajů
      </h3>

      <div className="flex flex-col lg:flex-row items-center gap-6">
        {/* Donut Chart */}
        <div className="relative">
          <svg width={size} height={size}>
            {slices.map((slice, i) => (
              <path
                key={i}
                d={describeArc(center, center, radius, slice.startAngle, slice.endAngle - 0.5)}
                fill="none"
                stroke={slice.color}
                strokeWidth={radius - innerRadius}
                strokeLinecap="butt"
              />
            ))}
            <circle cx={center} cy={center} r={innerRadius - 2} className="fill-white dark:fill-dark-card" />
            <text
              x={center}
              y={center - 8}
              textAnchor="middle"
              className="fill-gray-700 dark:fill-gray-200 text-xs font-semibold"
            >
              Celkem
            </text>
            <text
              x={center}
              y={center + 10}
              textAnchor="middle"
              className="fill-gray-500 dark:fill-gray-400"
              fontSize="11"
            >
              {formatCurrency(overview.totalExpenses)}
            </text>
          </svg>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2 w-full">
          {categoryBreakdown.map((item) => (
            <div key={item.category} className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-gray-600 dark:text-gray-300 flex-1 truncate">
                {item.label}
              </span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200 whitespace-nowrap">
                {formatCurrency(item.amount)}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500 w-10 text-right">
                {item.percentage} %
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
