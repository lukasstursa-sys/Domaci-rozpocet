import React from 'react';
import { useData } from '../../contexts/DataContext';
import { formatMonth } from '../../utils/format';

export default function MonthSelector() {
  const { currentMonth, currentYear, setMonth } = useData();

  const goBack = () => {
    if (currentMonth === 1) {
      setMonth(12, currentYear - 1);
    } else {
      setMonth(currentMonth - 1, currentYear);
    }
  };

  const goForward = () => {
    if (currentMonth === 12) {
      setMonth(1, currentYear + 1);
    } else {
      setMonth(currentMonth + 1, currentYear);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={goBack}
        className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
      >
        ‹
      </button>
      <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 min-w-[140px] text-center capitalize">
        {formatMonth(currentMonth, currentYear)}
      </span>
      <button
        onClick={goForward}
        className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
      >
        ›
      </button>
    </div>
  );
}
