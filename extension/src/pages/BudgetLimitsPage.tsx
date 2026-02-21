import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import MonthSelector from '../components/common/MonthSelector';
import Modal from '../components/common/Modal';
import { formatCurrency } from '../utils/format';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../types';
import type { ExpenseCategory } from '../types';
import api from '../services/api';

interface BudgetLimit {
  id: string;
  categoryId: ExpenseCategory;
  amount: number;
  spent: number;
  remaining: number;
  percentUsed: number;
}

export default function BudgetLimitsPage() {
  const { currentMonth, currentYear } = useData();
  const [limits, setLimits] = useState<BudgetLimit[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingLimit, setEditingLimit] = useState<BudgetLimit | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory>('family_life');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadLimits = async () => {
    try {
      const data = await api.getBudgetLimits(currentMonth, currentYear);
      setLimits(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadLimits();
  }, [currentMonth, currentYear]);

  const openCreateForm = () => {
    setEditingLimit(null);
    setSelectedCategory(availableCategories[0] || 'family_life');
    setAmount('');
    setShowForm(true);
  };

  const openEditForm = (limit: BudgetLimit) => {
    setEditingLimit(limit);
    setSelectedCategory(limit.categoryId);
    setAmount(String(limit.amount));
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingLimit(null);
    setAmount('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    setIsSubmitting(true);
    try {
      if (editingLimit) {
        await api.updateBudgetLimit(editingLimit.id, {
          amount: parseFloat(amount),
        });
      } else {
        await api.createBudgetLimit({
          categoryId: selectedCategory,
          amount: parseFloat(amount),
          month: currentMonth,
          year: currentYear,
        });
      }
      closeForm();
      loadLimits();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Opravdu chcete smazat tento rozpočtový limit?')) {
      try {
        await api.deleteBudgetLimit(id);
        loadLimits();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const getBarColor = (pct: number) => {
    if (pct < 60) return 'bg-secondary-500';
    if (pct < 85) return 'bg-yellow-500';
    return 'bg-warning-500';
  };

  // Categories not yet having a limit
  const usedCategories = new Set(limits.map((l) => l.categoryId));
  const availableCategories = Object.keys(CATEGORY_LABELS).filter(
    (k) => !usedCategories.has(k as ExpenseCategory)
  ) as ExpenseCategory[];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Rozpočtové limity
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Nastavte měsíční limity pro jednotlivé kategorie
          </p>
        </div>
        <div className="flex items-center gap-3">
          <MonthSelector />
          {availableCategories.length > 0 && (
            <button onClick={openCreateForm} className="btn-primary">
              + Nový limit
            </button>
          )}
        </div>
      </div>

      {limits.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400 dark:text-gray-500 text-lg">Žádné rozpočtové limity</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
            Nastavte limity pro lepší kontrolu výdajů
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {limits.map((limit) => (
            <div key={limit.id} className="card group">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-8 rounded-full"
                    style={{ backgroundColor: CATEGORY_COLORS[limit.categoryId] }}
                  />
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                      {CATEGORY_LABELS[limit.categoryId]}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Limit: {formatCurrency(limit.amount)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button
                    onClick={() => openEditForm(limit)}
                    className="text-gray-400 hover:text-primary-500 w-7 h-7 rounded-lg flex items-center justify-center hover:bg-primary-50 dark:hover:bg-primary-900/30"
                    title="Upravit"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(limit.id)}
                    className="text-gray-400 hover:text-warning-500 w-7 h-7 rounded-lg flex items-center justify-center hover:bg-warning-50 dark:hover:bg-warning-900/30"
                    title="Smazat"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="progress-bar">
                <div
                  className={`progress-bar-fill ${getBarColor(limit.percentUsed)}`}
                  style={{ width: `${Math.min(limit.percentUsed, 100)}%` }}
                />
              </div>

              <div className="flex justify-between mt-2 text-sm">
                <span className="text-gray-600 dark:text-gray-300">
                  Utraceno: {formatCurrency(limit.spent)}
                </span>
                <span className={`font-semibold ${
                  limit.remaining >= 0
                    ? 'text-secondary-600 dark:text-secondary-400'
                    : 'text-warning-500'
                }`}>
                  {limit.remaining >= 0
                    ? `Zbývá: ${formatCurrency(limit.remaining)}`
                    : `Přečerpáno: ${formatCurrency(Math.abs(limit.remaining))}`}
                </span>
              </div>

              <div className="text-right mt-1">
                <span className={`text-xs font-medium ${
                  limit.percentUsed > 100 ? 'text-warning-500' :
                  limit.percentUsed > 85 ? 'text-yellow-600' : 'text-gray-400'
                }`}>
                  {limit.percentUsed} %
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showForm} onClose={closeForm} title={editingLimit ? 'Upravit limit' : 'Nový rozpočtový limit'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Kategorie</label>
            {editingLimit ? (
              <p className="input-field bg-gray-50 dark:bg-gray-800 cursor-not-allowed">
                {CATEGORY_LABELS[editingLimit.categoryId]}
              </p>
            ) : (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as ExpenseCategory)}
                className="input-field"
              >
                {availableCategories.map((key) => (
                  <option key={key} value={key}>{CATEGORY_LABELS[key]}</option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="label">Měsíční limit (Kč)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input-field"
              min="0"
              placeholder="Např. 15000"
              required
            />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={closeForm} className="btn-outline">
              Zrušit
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? 'Ukládání...' : editingLimit ? 'Uložit změny' : 'Nastavit limit'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
