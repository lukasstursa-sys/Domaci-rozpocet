import React from 'react';
import { useData } from '../../contexts/DataContext';
import { formatPercentage } from '../../utils/format';

export default function RatRaceMeter() {
  const { ratRace } = useData();
  const { percentage } = ratRace;

  // Calculate SVG arc
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Color based on percentage
  const getColor = (pct: number) => {
    if (pct < 25) return '#e85d4a';
    if (pct < 50) return '#f59e0b';
    if (pct < 75) return '#3b82f6';
    return '#2d8f5e';
  };

  const color = getColor(percentage);

  const getMessage = (pct: number) => {
    if (pct === 0) return 'Začněte budovat pasivní příjmy';
    if (pct < 10) return 'Počátek cesty k finanční svobodě';
    if (pct < 25) return 'Děláte pokroky, pokračujte!';
    if (pct < 50) return 'Jste na dobré cestě!';
    if (pct < 75) return 'Skvělý pokrok k finanční nezávislosti!';
    if (pct < 100) return 'Už skoro v cíli!';
    return 'Finanční svoboda dosažena!';
  };

  return (
    <div className="card text-center">
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
        Rat Race Metr
      </h3>

      <div className="relative inline-flex items-center justify-center">
        <svg width="220" height="220" className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="110"
            cy="110"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            className="text-gray-200 dark:text-gray-700"
          />
          {/* Progress circle */}
          <circle
            cx="110"
            cy="110"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-extrabold" style={{ color }}>
            {formatPercentage(percentage)}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Pasivní / Výdaje
          </span>
        </div>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-300 mt-4 font-medium">
        {getMessage(percentage)}
      </p>

      <div className="flex items-center justify-center gap-6 mt-4 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-secondary-500" />
          <span>Cíl: 100 %</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
          <span>Aktuálně: {formatPercentage(percentage)}</span>
        </div>
      </div>
    </div>
  );
}
