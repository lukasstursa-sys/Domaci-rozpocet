import React from 'react';
import { useData } from '../../contexts/DataContext';
import { formatCurrency } from '../../utils/format';

export default function OverviewCards() {
  const { overview } = useData();

  const cards = [
    {
      title: 'Příjmy',
      subtitle: 'Aktivní + Pasivní',
      value: overview.activeIncome + overview.passiveIncome,
      detail: `Aktivní: ${formatCurrency(overview.activeIncome)} | Pasivní: ${formatCurrency(overview.passiveIncome)}`,
      color: 'bg-secondary-500',
      bgColor: 'bg-secondary-50 dark:bg-secondary-900/30',
      textColor: 'text-secondary-700 dark:text-secondary-300',
    },
    {
      title: 'Výdaje',
      subtitle: 'Celkové měsíční',
      value: overview.totalExpenses,
      detail: `Rodina: ${formatCurrency(overview.familyTotal)} | WellMall: ${formatCurrency(overview.wellmallTotal)}`,
      color: 'bg-warning-500',
      bgColor: 'bg-warning-50 dark:bg-warning-900/30',
      textColor: 'text-warning-700 dark:text-warning-300',
    },
    {
      title: 'Zbývá',
      subtitle: 'Do konce měsíce',
      value: overview.remainingBudget,
      detail: overview.remainingBudget >= 0 ? 'V rozpočtu' : 'Přečerpáno!',
      color: overview.remainingBudget >= 0 ? 'bg-primary-500' : 'bg-warning-500',
      bgColor: overview.remainingBudget >= 0
        ? 'bg-primary-50 dark:bg-primary-900/30'
        : 'bg-warning-50 dark:bg-warning-900/30',
      textColor: overview.remainingBudget >= 0
        ? 'text-primary-700 dark:text-primary-300'
        : 'text-warning-700 dark:text-warning-300',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((card) => (
        <div key={card.title} className={`card ${card.bgColor}`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-2 h-8 rounded-full ${card.color}`} />
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                {card.title}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {card.subtitle}
              </p>
            </div>
          </div>
          <p className={`text-2xl font-bold ${card.textColor}`}>
            {formatCurrency(card.value)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {card.detail}
          </p>
        </div>
      ))}
    </div>
  );
}
