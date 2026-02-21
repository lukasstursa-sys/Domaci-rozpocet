import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import MonthSelector from '../components/common/MonthSelector';
import Modal from '../components/common/Modal';
import ExpenseForm from '../components/expenses/ExpenseForm';
import { formatCurrency } from '../utils/format';
import { CATEGORY_LABELS, SUBCATEGORY_LABELS, CATEGORY_COLORS } from '../types';
import type { ExpenseCategory } from '../types';

export default function ExpensesPage() {
  const { expenses, overview, deleteExpense } = useData();
  const [showForm, setShowForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState<ExpenseCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = expenses.filter((e) => {
    if (filterCategory !== 'all' && e.categoryId !== filterCategory) return false;
    if (searchQuery && !e.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Group by category
  const grouped = filtered.reduce((acc, exp) => {
    const cat = exp.categoryId;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(exp);
    return acc;
  }, {} as Record<string, typeof expenses>);

  const handleDelete = async (id: string) => {
    if (confirm('Opravdu chcete smazat tento výdaj?')) {
      await deleteExpense(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Výdaje
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Kompletní evidence výdajů s rozdělením WellMall
          </p>
        </div>
        <div className="flex items-center gap-3">
          <MonthSelector />
          <button onClick={() => setShowForm(true)} className="btn-primary">
            + Nový výdaj
          </button>
        </div>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">Celkem výdaje</p>
          <p className="text-xl font-bold text-gray-800 dark:text-gray-100">
            {formatCurrency(overview.totalExpenses)}
          </p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">Rodina</p>
          <p className="text-xl font-bold text-warning-500">
            {formatCurrency(overview.familyTotal)}
          </p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">WellMall</p>
          <p className="text-xl font-bold text-primary-500">
            {formatCurrency(overview.wellmallTotal)}
          </p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">Položek</p>
          <p className="text-xl font-bold text-gray-800 dark:text-gray-100">
            {expenses.length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Hledat výdaje..."
          className="input-field max-w-xs"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value as ExpenseCategory | 'all')}
          className="input-field max-w-xs"
        >
          <option value="all">Všechny kategorie</option>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Expenses grouped by category */}
      {Object.keys(grouped).length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400 dark:text-gray-500 text-lg">Žádné výdaje</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
            Přidejte svůj první výdaj kliknutím na tlačítko výše
          </p>
        </div>
      ) : (
        Object.entries(grouped).map(([category, items]) => {
          const catTotal = items.reduce((sum, e) => sum + e.amountTotal, 0);
          const catWellmall = items.reduce((sum, e) => sum + e.amountWellmall, 0);

          return (
            <div key={category} className="card">
              {/* Category Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-8 rounded-full"
                    style={{ backgroundColor: CATEGORY_COLORS[category as ExpenseCategory] }}
                  />
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                      {CATEGORY_LABELS[category as ExpenseCategory]}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {items.length} položek
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-800 dark:text-gray-100">
                    {formatCurrency(catTotal)}
                  </p>
                  {catWellmall > 0 && (
                    <p className="text-xs text-primary-500">
                      WellMall: {formatCurrency(catWellmall)}
                    </p>
                  )}
                </div>
              </div>

              {/* Items */}
              <div className="space-y-2">
                {items.map((exp) => (
                  <div
                    key={exp.id}
                    className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                          {exp.title}
                        </span>
                        {exp.isRecurring && (
                          <span className="badge-info text-[10px]">
                            {exp.frequency === 'monthly' ? 'měsíčně' : 'ročně'}
                          </span>
                        )}
                        {exp.contractEndDate && (
                          <span className="badge-warning text-[10px]">
                            fixace
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {exp.providerName && (
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {exp.providerName}
                          </span>
                        )}
                        {exp.subcategoryId && (
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {SUBCATEGORY_LABELS[exp.subcategoryId]}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* WellMall split indicator */}
                      {exp.amountWellmall > 0 && (
                        <div className="hidden sm:flex items-center gap-1">
                          <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 w-20 overflow-hidden">
                            <div
                              className="h-full bg-primary-500 rounded-full"
                              style={{ width: `${exp.wellmallPercentage}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-primary-500 min-w-[32px]">
                            {exp.wellmallPercentage}%
                          </span>
                        </div>
                      )}

                      <div className="text-right min-w-[90px]">
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                          {formatCurrency(exp.amountTotal)}
                        </p>
                        {exp.amountWellmall > 0 && (
                          <p className="text-[10px] text-gray-400">
                            R: {formatCurrency(exp.amountFamily)} | WM: {formatCurrency(exp.amountWellmall)}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => handleDelete(exp.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-warning-500 transition-all w-7 h-7 rounded-lg flex items-center justify-center hover:bg-warning-50 dark:hover:bg-warning-900/30"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}

      {/* Add Expense Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Nový výdaj" size="lg">
        <ExpenseForm onClose={() => setShowForm(false)} />
      </Modal>
    </div>
  );
}
