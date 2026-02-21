import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import MonthSelector from '../components/common/MonthSelector';
import Modal from '../components/common/Modal';
import { formatCurrency } from '../utils/format';
import type { Income, IncomeType } from '../types';

const INCOME_TYPE_LABELS: Record<IncomeType, string> = {
  active_salary: 'Aktivní příjem (plat)',
  passive_rent: 'Pasivní - Pronájem',
  passive_dividend: 'Pasivní - Dividendy/ETF',
  passive_other: 'Pasivní - Ostatní',
};

const INCOME_TYPE_ICONS: Record<IncomeType, string> = {
  active_salary: '💼',
  passive_rent: '🏠',
  passive_dividend: '📈',
  passive_other: '💎',
};

export default function IncomesPage() {
  const { incomes, overview, addIncome, updateIncome, deleteIncome, familyMembers, currentMonth, currentYear } = useData();
  const [showForm, setShowForm] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<IncomeType>('active_salary');
  const [linkedMemberId, setLinkedMemberId] = useState('');
  const [isRecurring, setIsRecurring] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeIncomes = incomes.filter((i) => i.type === 'active_salary');
  const passiveIncomes = incomes.filter((i) => i.type !== 'active_salary');

  const openCreateForm = () => {
    setEditingIncome(null);
    setTitle('');
    setAmount('');
    setType('active_salary');
    setLinkedMemberId('');
    setIsRecurring(true);
    setShowForm(true);
  };

  const openEditForm = (income: Income) => {
    setEditingIncome(income);
    setTitle(income.title);
    setAmount(String(income.amount));
    setType(income.type);
    setLinkedMemberId(income.linkedMemberId || '');
    setIsRecurring(income.isRecurring ?? true);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingIncome(null);
    setTitle('');
    setAmount('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return;
    setIsSubmitting(true);
    try {
      const data = {
        title,
        amount: parseFloat(amount),
        type,
        linkedMemberId: linkedMemberId || undefined,
        isRecurring,
        frequency: 'monthly' as const,
        month: currentMonth,
        year: currentYear,
      };
      if (editingIncome) {
        await updateIncome(editingIncome.id, data);
      } else {
        await addIncome(data);
      }
      closeForm();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Opravdu chcete smazat tento příjem?')) {
      await deleteIncome(id);
    }
  };

  const renderIncomeRow = (inc: Income) => (
    <div key={inc.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 group">
      <div className="flex items-center gap-3">
        <span>{INCOME_TYPE_ICONS[inc.type]}</span>
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{inc.title}</p>
          <span className="text-xs text-gray-400">{INCOME_TYPE_LABELS[inc.type]}</span>
          {inc.isRecurring && <span className="badge-info text-[10px] ml-2">měsíčně</span>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={`text-sm font-bold ${inc.type === 'active_salary' ? 'text-gray-700 dark:text-gray-200' : 'text-secondary-600 dark:text-secondary-400'}`}>
          {formatCurrency(inc.amount)}
        </span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
          <button
            onClick={() => openEditForm(inc)}
            className="text-gray-400 hover:text-primary-500 w-7 h-7 rounded-lg flex items-center justify-center hover:bg-primary-50 dark:hover:bg-primary-900/30"
            title="Upravit"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button onClick={() => handleDelete(inc.id)} className="text-gray-400 hover:text-warning-500 w-7 h-7 rounded-lg flex items-center justify-center hover:bg-warning-50 dark:hover:bg-warning-900/30">
            ✕
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Příjmy</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Aktivní a pasivní příjmy rodiny
          </p>
        </div>
        <div className="flex items-center gap-3">
          <MonthSelector />
          <button onClick={openCreateForm} className="btn-secondary">
            + Nový příjem
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-secondary-50 dark:bg-secondary-900/20 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">Celkové příjmy</p>
          <p className="text-2xl font-bold text-secondary-600 dark:text-secondary-400">
            {formatCurrency(overview.activeIncome + overview.passiveIncome)}
          </p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">Aktivní příjmy</p>
          <p className="text-2xl font-bold text-gray-700 dark:text-gray-200">
            {formatCurrency(overview.activeIncome)}
          </p>
        </div>
        <div className="card bg-primary-50 dark:bg-primary-900/20 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">Pasivní příjmy</p>
          <p className="text-2xl font-bold text-primary-600 dark:text-primary-300">
            {formatCurrency(overview.passiveIncome)}
          </p>
          <div className="progress-bar mt-2">
            <div
              className="progress-bar-fill bg-primary-500"
              style={{
                width: `${overview.totalExpenses > 0
                  ? Math.min((overview.passiveIncome / overview.totalExpenses) * 100, 100)
                  : 0}%`
              }}
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-1">
            Pokrytí výdajů pasivními příjmy
          </p>
        </div>
      </div>

      {/* Active Incomes */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
          💼 Aktivní příjmy
        </h3>
        {activeIncomes.length === 0 ? (
          <p className="text-gray-400 text-center py-4">Žádné aktivní příjmy</p>
        ) : (
          <div className="space-y-2">
            {activeIncomes.map(renderIncomeRow)}
          </div>
        )}
      </div>

      {/* Passive Incomes */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
          📈 Pasivní příjmy
        </h3>
        {passiveIncomes.length === 0 ? (
          <p className="text-gray-400 text-center py-4">
            Žádné pasivní příjmy - čas začít budovat!
          </p>
        ) : (
          <div className="space-y-2">
            {passiveIncomes.map(renderIncomeRow)}
          </div>
        )}
      </div>

      {/* Add/Edit Income Modal */}
      <Modal isOpen={showForm} onClose={closeForm} title={editingIncome ? 'Upravit příjem' : 'Nový příjem'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Název příjmu *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" placeholder="Např. Plat, Dividendy ETF..." required />
          </div>
          <div>
            <label className="label">Částka (Kč) *</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="input-field" min="0" required />
          </div>
          <div>
            <label className="label">Typ příjmu</label>
            <select value={type} onChange={(e) => setType(e.target.value as IncomeType)} className="input-field">
              {Object.entries(INCOME_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Člen rodiny</label>
            <select value={linkedMemberId} onChange={(e) => setLinkedMemberId(e.target.value)} className="input-field">
              <option value="">-- Vyberte --</option>
              {familyMembers.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} className="w-4 h-4 accent-primary-500" />
            <span className="text-sm text-gray-600 dark:text-gray-300">Opakující se měsíčně</span>
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={closeForm} className="btn-outline">Zrušit</button>
            <button type="submit" disabled={isSubmitting} className="btn-secondary">
              {isSubmitting ? 'Ukládání...' : editingIncome ? 'Uložit změny' : 'Uložit příjem'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
