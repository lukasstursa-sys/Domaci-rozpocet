import React from 'react';
import MonthSelector from '../components/common/MonthSelector';
import RatRaceMeter from '../components/dashboard/RatRaceMeter';
import OverviewCards from '../components/dashboard/OverviewCards';
import CategoryChart from '../components/dashboard/CategoryChart';
import CashFlowSummary from '../components/dashboard/CashFlowSummary';
import AIWidget from '../components/dashboard/AIWidget';
import { useData } from '../contexts/DataContext';
import { formatCurrency, formatDate } from '../utils/format';

export default function DashboardPage() {
  const { notifications, expenses } = useData();
  const unreadNotifs = notifications.filter((n) => !n.isRead);

  // Recent expenses (last 5)
  const recentExpenses = [...expenses]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Přehled
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Váš finanční dashboard
          </p>
        </div>
        <MonthSelector />
      </div>

      {/* Notifications bar */}
      {unreadNotifs.length > 0 && (
        <div className="space-y-2">
          {unreadNotifs.slice(0, 2).map((notif) => (
            <div
              key={notif.id}
              className={`px-4 py-3 rounded-xl text-sm flex items-start gap-3 ${
                notif.type === 'critical'
                  ? 'bg-warning-50 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300 border border-warning-200 dark:border-warning-800'
                  : notif.type === 'warning'
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800'
                  : 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800'
              }`}
            >
              <span className="flex-shrink-0 mt-0.5">
                {notif.type === 'critical' ? '🚨' : notif.type === 'warning' ? '⚠️' : '💡'}
              </span>
              <div>
                <p className="font-medium">{notif.title}</p>
                <p className="opacity-80 text-xs mt-0.5">{notif.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rat Race Meter + AI Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RatRaceMeter />
        </div>
        <div>
          <AIWidget />
        </div>
      </div>

      {/* Overview Cards */}
      <OverviewCards />

      {/* Cash Flow Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CashFlowSummary />
        <CategoryChart />
      </div>

      {/* Recent Expenses */}
      <div className="grid grid-cols-1 gap-6">
        {/* Recent Expenses */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
            Poslední výdaje
          </h3>
          {recentExpenses.length === 0 ? (
            <p className="text-gray-400 dark:text-gray-500 text-center py-8">
              Zatím žádné výdaje
            </p>
          ) : (
            <div className="space-y-3">
              {recentExpenses.map((exp) => (
                <div
                  key={exp.id}
                  className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-dark-border last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                      {exp.title}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {exp.providerName || exp.categoryId}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                      {formatCurrency(exp.amountTotal)}
                    </p>
                    {exp.amountWellmall > 0 && (
                      <p className="text-xs text-secondary-500">
                        WM: {formatCurrency(exp.amountWellmall)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
