import React from 'react';
import { useData } from '../../contexts/DataContext';
import { formatCurrency } from '../../utils/format';

export default function CashFlowSummary() {
  const { overview, expenses, incomes } = useData();
  const totalIncome = overview.activeIncome + overview.passiveIncome;
  const savingsRate = totalIncome > 0
    ? Math.round(((totalIncome - overview.totalExpenses) / totalIncome) * 100)
    : 0;

  // Group expenses by recurring vs one-time
  const recurringTotal = expenses
    .filter(e => e.isRecurring)
    .reduce((sum, e) => sum + e.amountTotal, 0);
  const oneTimeTotal = overview.totalExpenses - recurringTotal;

  // Income breakdown
  const activeTotal = overview.activeIncome;
  const passiveTotal = overview.passiveIncome;

  const flowItems = [
    {
      label: 'Aktivní příjmy',
      amount: activeTotal,
      color: 'bg-secondary-500',
      percentage: totalIncome > 0 ? Math.round((activeTotal / totalIncome) * 100) : 0,
    },
    {
      label: 'Pasivní příjmy',
      amount: passiveTotal,
      color: 'bg-emerald-400',
      percentage: totalIncome > 0 ? Math.round((passiveTotal / totalIncome) * 100) : 0,
    },
    {
      label: 'Pravidelné výdaje',
      amount: -recurringTotal,
      color: 'bg-warning-500',
      percentage: overview.totalExpenses > 0 ? Math.round((recurringTotal / overview.totalExpenses) * 100) : 0,
    },
    {
      label: 'Jednorázové výdaje',
      amount: -oneTimeTotal,
      color: 'bg-orange-400',
      percentage: overview.totalExpenses > 0 ? Math.round((oneTimeTotal / overview.totalExpenses) * 100) : 0,
    },
  ];

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
        Cash Flow
      </h3>

      {/* Net bar */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">Příjmy vs Výdaje</span>
          <span className={`text-sm font-bold ${overview.remainingBudget >= 0 ? 'text-secondary-500' : 'text-warning-500'}`}>
            {overview.remainingBudget >= 0 ? '+' : ''}{formatCurrency(overview.remainingBudget)}
          </span>
        </div>
        <div className="flex h-4 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
          {totalIncome > 0 && (
            <div
              className="bg-secondary-500 transition-all duration-500"
              style={{ width: `${Math.min((totalIncome / (totalIncome + overview.totalExpenses)) * 100, 100)}%` }}
            />
          )}
          {overview.totalExpenses > 0 && (
            <div
              className="bg-warning-500 transition-all duration-500"
              style={{ width: `${Math.min((overview.totalExpenses / (totalIncome + overview.totalExpenses)) * 100, 100)}%` }}
            />
          )}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-secondary-500">{formatCurrency(totalIncome)}</span>
          <span className="text-xs text-warning-500">{formatCurrency(overview.totalExpenses)}</span>
        </div>
      </div>

      {/* Flow items */}
      <div className="space-y-3">
        {flowItems.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${item.color} flex-shrink-0`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600 dark:text-gray-300">{item.label}</span>
                <span className={`text-xs font-semibold ${item.amount >= 0 ? 'text-secondary-600 dark:text-secondary-400' : 'text-gray-700 dark:text-gray-200'}`}>
                  {formatCurrency(Math.abs(item.amount))}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 mt-1">
                <div
                  className={`h-full rounded-full ${item.color} transition-all duration-500`}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Savings rate */}
      <div className="mt-5 pt-4 border-t border-gray-100 dark:border-dark-border">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-300">Míra úspor</span>
          <span className={`text-lg font-bold ${savingsRate > 20 ? 'text-secondary-500' : savingsRate > 0 ? 'text-yellow-500' : 'text-warning-500'}`}>
            {savingsRate}%
          </span>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {savingsRate > 30
            ? 'Výborně! Skvělá míra úspor.'
            : savingsRate > 10
            ? 'Dobrá práce, zkuste se dostat nad 20%.'
            : savingsRate > 0
            ? 'Snažte se ušetřit alespoň 10% příjmů.'
            : 'Výdaje převyšují příjmy. Zhodnoťte svůj rozpočet.'}
        </p>
      </div>
    </div>
  );
}
