import React, { useState, useEffect, useCallback } from 'react';
import Modal from '../components/common/Modal';
import { formatCurrency, formatDate } from '../utils/format';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../types';
import type { ExpenseCategory } from '../types';

// ============================================================
// Recurring Transactions Page - Opakující se platby
// ============================================================

const API_BASE = 'http://localhost:3001/api';

function getHeaders(): Record<string, string> {
  const token = localStorage.getItem('dr_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly';
type TransactionType = 'expense' | 'income';

const FREQUENCY_LABELS: Record<Frequency, string> = {
  daily: 'Denn\u011b',
  weekly: 'T\u00fddn\u011b',
  monthly: 'M\u011bs\u00ed\u010dn\u011b',
  yearly: 'Ro\u010dn\u011b',
};

interface RecurringTransaction {
  id: string;
  userId: string;
  type: TransactionType;
  title: string;
  amount: number;
  categoryId: ExpenseCategory;
  frequency: Frequency;
  interval: number;
  startDate: string;
  endDate?: string;
  nextDueDate: string;
  isActive: boolean;
  autoConfirm: boolean;
  isSubscription: boolean;
  providerName?: string;
  wellmallPercentage: number;
  notes?: string;
  createdAt: string;
}

interface RecurringFormData {
  type: TransactionType;
  title: string;
  amount: string;
  categoryId: ExpenseCategory;
  frequency: Frequency;
  interval: string;
  startDate: string;
  endDate: string;
  autoConfirm: boolean;
  isSubscription: boolean;
  providerName: string;
  wellmallPercentage: number;
  notes: string;
}

const defaultFormData: RecurringFormData = {
  type: 'expense',
  title: '',
  amount: '',
  categoryId: 'family_life',
  frequency: 'monthly',
  interval: '1',
  startDate: new Date().toISOString().split('T')[0],
  endDate: '',
  autoConfirm: false,
  isSubscription: false,
  providerName: '',
  wellmallPercentage: 0,
  notes: '',
};

export default function RecurringPage() {
  const [items, setItems] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<RecurringTransaction | null>(null);
  const [formData, setFormData] = useState<RecurringFormData>(defaultFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showOnlySubscriptions, setShowOnlySubscriptions] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

  // --- API calls ---
  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/recurring`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Nepoda\u0159ilo se na\u010d\u00edst opakuj\u00edc\u00ed se platby');
      const data = await res.json();
      setItems(data);
    } catch (err: any) {
      setError(err.message || 'Chyba p\u0159i na\u010d\u00edt\u00e1n\u00ed dat');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleCreate = async (payload: Record<string, any>) => {
    const res = await fetch(`${API_BASE}/recurring`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Nepoda\u0159ilo se vytvo\u0159it platbu');
    return res.json();
  };

  const handleUpdate = async (id: string, payload: Record<string, any>) => {
    const res = await fetch(`${API_BASE}/recurring/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Nepoda\u0159ilo se aktualizovat platbu');
    return res.json();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Opravdu chcete smazat tuto opakuj\u00edc\u00ed se platbu?')) return;
    try {
      const res = await fetch(`${API_BASE}/recurring/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error('Nepoda\u0159ilo se smazat platbu');
      fetchItems();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleTogglePause = async (item: RecurringTransaction) => {
    try {
      await handleUpdate(item.id, { isActive: !item.isActive });
      fetchItems();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleProcess = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch(`${API_BASE}/recurring/process`, {
        method: 'POST',
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error('Zpracov\u00e1n\u00ed selhalo');
      const result = await res.json();
      alert(`Zpracov\u00e1no: ${result.processed ?? 0} plateb`);
      fetchItems();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- Form handling ---
  const openCreateForm = () => {
    setEditingItem(null);
    setFormData(defaultFormData);
    setShowForm(true);
  };

  const openEditForm = (item: RecurringTransaction) => {
    setEditingItem(item);
    setFormData({
      type: item.type,
      title: item.title,
      amount: String(item.amount),
      categoryId: item.categoryId,
      frequency: item.frequency,
      interval: String(item.interval),
      startDate: item.startDate?.split('T')[0] || '',
      endDate: item.endDate?.split('T')[0] || '',
      autoConfirm: item.autoConfirm,
      isSubscription: item.isSubscription,
      providerName: item.providerName || '',
      wellmallPercentage: item.wellmallPercentage || 0,
      notes: item.notes || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.amount) return;
    setIsSubmitting(true);

    const payload = {
      type: formData.type,
      title: formData.title,
      amount: parseFloat(formData.amount),
      categoryId: formData.categoryId,
      frequency: formData.frequency,
      interval: parseInt(formData.interval, 10) || 1,
      startDate: formData.startDate,
      endDate: formData.endDate || undefined,
      autoConfirm: formData.autoConfirm,
      isSubscription: formData.isSubscription,
      providerName: formData.providerName || undefined,
      wellmallPercentage: formData.wellmallPercentage,
      notes: formData.notes || undefined,
    };

    try {
      if (editingItem) {
        await handleUpdate(editingItem.id, payload);
      } else {
        await handleCreate(payload);
      }
      setShowForm(false);
      setEditingItem(null);
      setFormData(defaultFormData);
      fetchItems();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Grouping ---
  const displayed = showOnlySubscriptions
    ? items.filter((i) => i.isSubscription)
    : items;

  const activeSubscriptions = displayed.filter((i) => i.isActive && i.isSubscription);
  const activeOther = displayed.filter((i) => i.isActive && !i.isSubscription);
  const inactive = displayed.filter((i) => !i.isActive);

  // --- Helpers ---
  const formatFrequency = (freq: Frequency, interval: number) => {
    if (interval === 1) return FREQUENCY_LABELS[freq];
    const unitMap: Record<Frequency, string> = {
      daily: 'dn\u00ed',
      weekly: 't\u00fddn\u016f',
      monthly: 'm\u011bs\u00edc\u016f',
      yearly: 'let',
    };
    return `Ka\u017ed\u00fdch ${interval} ${unitMap[freq]}`;
  };

  const daysUntilDue = (dateStr: string) => {
    const target = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  // --- Render item card ---
  const renderCard = (item: RecurringTransaction) => {
    const days = daysUntilDue(item.nextDueDate);
    const isOverdue = days < 0;
    const isDueSoon = days >= 0 && days <= 3;

    return (
      <div
        key={item.id}
        className="bg-white dark:bg-dark-card rounded-2xl shadow-neu-light dark:shadow-neu-dark p-5 transition-all hover:shadow-lg"
      >
        <div className="flex items-start justify-between gap-3">
          {/* Left side: info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
                {item.title}
              </h3>
              {/* Status badge */}
              {item.isActive ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                  Aktivn\u00ed
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                  Neaktivn\u00ed
                </span>
              )}
              {item.isSubscription && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                  P\u0159edplatn\u00e9
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              {/* Amount */}
              <span
                className={`text-lg font-bold ${
                  item.type === 'income'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-gray-900 dark:text-gray-100'
                }`}
              >
                {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
              </span>
              {/* Frequency */}
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {formatFrequency(item.frequency, item.interval)}
              </span>
            </div>

            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {/* Category badge */}
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium text-white"
                style={{ backgroundColor: CATEGORY_COLORS[item.categoryId] || '#6b7280' }}
              >
                {CATEGORY_LABELS[item.categoryId] || item.categoryId}
              </span>

              {/* Provider */}
              {item.providerName && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {item.providerName}
                </span>
              )}
            </div>

            {/* Next due date */}
            {item.isActive && (
              <div className="mt-2">
                <span
                  className={`text-xs font-medium ${
                    isOverdue
                      ? 'text-red-500'
                      : isDueSoon
                        ? 'text-amber-500'
                        : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  Dal\u0161\u00ed splatnost:{' '}
                  {formatDate(item.nextDueDate)}
                  {isOverdue && ` (po splatnosti ${Math.abs(days)} dn\u00ed)`}
                  {isDueSoon && !isOverdue && days === 0 && ' (dnes)'}
                  {isDueSoon && !isOverdue && days === 1 && ' (z\u00edtra)'}
                  {isDueSoon && !isOverdue && days > 1 && ` (za ${days} dn\u00ed)`}
                </span>
              </div>
            )}

            {/* Notes */}
            {item.notes && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">
                {item.notes}
              </p>
            )}
          </div>

          {/* Right side: actions */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => openEditForm(item)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              title="Upravit"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => handleTogglePause(item)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                item.isActive
                  ? 'text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                  : 'text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'
              }`}
              title={item.isActive ? 'Pozastavit' : 'Aktivovat'}
            >
              {item.isActive ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </button>
            <button
              onClick={() => handleDelete(item.id)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title="Smazat"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // --- Render group ---
  const renderGroup = (
    title: string,
    groupItems: RecurringTransaction[],
    icon: React.ReactNode,
    collapsible = false
  ) => {
    if (groupItems.length === 0) return null;

    const totalMonthly = groupItems.reduce((sum, item) => {
      let monthly = item.amount;
      if (item.frequency === 'daily') monthly = item.amount * 30;
      else if (item.frequency === 'weekly') monthly = item.amount * 4.33;
      else if (item.frequency === 'yearly') monthly = item.amount / 12;
      if (item.interval > 1) monthly = monthly / item.interval;
      return sum + monthly;
    }, 0);

    if (collapsible) {
      return (
        <div>
          <button
            onClick={() => setShowInactive(!showInactive)}
            className="flex items-center gap-3 w-full text-left mb-4 group"
          >
            <div className="flex items-center gap-2">
              {icon}
              <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                {title}
              </h2>
              <span className="text-sm text-gray-400 dark:text-gray-500">
                ({groupItems.length})
              </span>
            </div>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${showInactive ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showInactive && (
            <div className="space-y-3">
              {groupItems.map(renderCard)}
            </div>
          )}
        </div>
      );
    }

    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {icon}
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
              {title}
            </h2>
            <span className="text-sm text-gray-400 dark:text-gray-500">
              ({groupItems.length})
            </span>
          </div>
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
            ~{formatCurrency(Math.round(totalMonthly))}/m\u011bs\u00edc
          </span>
        </div>
        <div className="space-y-3">
          {groupItems.map(renderCard)}
        </div>
      </div>
    );
  };

  // --- Main render ---
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Opakuj\u00edc\u00ed se platby
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Spr\u00e1va pravideln\u00fdch plateb a p\u0159edplatn\u00fdch
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Subscriptions toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Jen p\u0159edplatn\u00e9
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={showOnlySubscriptions}
              onClick={() => setShowOnlySubscriptions(!showOnlySubscriptions)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                showOnlySubscriptions
                  ? 'bg-primary-500'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  showOnlySubscriptions ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </label>

          <button
            onClick={handleProcess}
            disabled={isProcessing}
            className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl px-4 py-2 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {isProcessing ? 'Zpracov\u00e1v\u00e1m...' : 'Zpracovat splatn\u00e9'}
          </button>

          <button
            onClick={openCreateForm}
            className="bg-primary-500 hover:bg-primary-600 text-white rounded-xl px-4 py-2 text-sm font-medium transition-colors"
          >
            + Nov\u00e1 platba
          </button>
        </div>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-dark-card rounded-2xl shadow-neu-light dark:shadow-neu-dark p-5 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">Celkem aktivn\u00edch</p>
          <p className="text-xl font-bold text-gray-800 dark:text-gray-100">
            {items.filter((i) => i.isActive).length}
          </p>
        </div>
        <div className="bg-white dark:bg-dark-card rounded-2xl shadow-neu-light dark:shadow-neu-dark p-5 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">P\u0159edplatn\u00e9</p>
          <p className="text-xl font-bold text-blue-500">
            {items.filter((i) => i.isSubscription && i.isActive).length}
          </p>
        </div>
        <div className="bg-white dark:bg-dark-card rounded-2xl shadow-neu-light dark:shadow-neu-dark p-5 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">M\u011bs\u00ed\u010dn\u011b v\u00fddaje</p>
          <p className="text-xl font-bold text-gray-800 dark:text-gray-100">
            {formatCurrency(
              Math.round(
                items
                  .filter((i) => i.isActive && i.type === 'expense')
                  .reduce((sum, item) => {
                    let monthly = item.amount;
                    if (item.frequency === 'daily') monthly = item.amount * 30;
                    else if (item.frequency === 'weekly') monthly = item.amount * 4.33;
                    else if (item.frequency === 'yearly') monthly = item.amount / 12;
                    if (item.interval > 1) monthly = monthly / item.interval;
                    return sum + monthly;
                  }, 0)
              )
            )}
          </p>
        </div>
        <div className="bg-white dark:bg-dark-card rounded-2xl shadow-neu-light dark:shadow-neu-dark p-5 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">M\u011bs\u00ed\u010dn\u011b p\u0159\u00edjmy</p>
          <p className="text-xl font-bold text-green-500">
            {formatCurrency(
              Math.round(
                items
                  .filter((i) => i.isActive && i.type === 'income')
                  .reduce((sum, item) => {
                    let monthly = item.amount;
                    if (item.frequency === 'daily') monthly = item.amount * 30;
                    else if (item.frequency === 'weekly') monthly = item.amount * 4.33;
                    else if (item.frequency === 'yearly') monthly = item.amount / 12;
                    if (item.interval > 1) monthly = monthly / item.interval;
                    return sum + monthly;
                  }, 0)
              )
            )}
          </p>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white dark:bg-dark-card rounded-2xl shadow-neu-light dark:shadow-neu-dark p-5 text-center py-12">
          <p className="text-gray-400 dark:text-gray-500 text-lg">Na\u010d\u00edt\u00e1n\u00ed...</p>
        </div>
      ) : error ? (
        <div className="bg-white dark:bg-dark-card rounded-2xl shadow-neu-light dark:shadow-neu-dark p-5 text-center py-12">
          <p className="text-red-500 text-lg">{error}</p>
          <button
            onClick={fetchItems}
            className="mt-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl px-4 py-2 text-sm font-medium transition-colors"
          >
            Zkusit znovu
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white dark:bg-dark-card rounded-2xl shadow-neu-light dark:shadow-neu-dark p-5 text-center py-12">
          <p className="text-gray-400 dark:text-gray-500 text-lg">\u017d\u00e1dn\u00e9 opakuj\u00edc\u00ed se platby</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
            P\u0159idejte svou prvn\u00ed opakuj\u00edc\u00ed se platbu kliknut\u00edm na tla\u010d\u00edtko v\u00fd\u0161e
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Active subscriptions */}
          {renderGroup(
            'Aktivn\u00ed p\u0159edplatn\u00e9',
            activeSubscriptions,
            <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
          )}

          {/* Other active items */}
          {renderGroup(
            'Ostatn\u00ed aktivn\u00ed platby',
            activeOther,
            <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}

          {/* Inactive items (collapsed) */}
          {renderGroup(
            'Neaktivn\u00ed / dokon\u010den\u00e9',
            inactive,
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>,
            true
          )}

          {displayed.length === 0 && showOnlySubscriptions && (
            <div className="bg-white dark:bg-dark-card rounded-2xl shadow-neu-light dark:shadow-neu-dark p-5 text-center py-12">
              <p className="text-gray-400 dark:text-gray-500 text-lg">\u017d\u00e1dn\u00e1 p\u0159edplatn\u00e9 nenalezena</p>
            </div>
          )}
        </div>
      )}

      {/* Modal form */}
      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingItem(null);
          setFormData(defaultFormData);
        }}
        title={editingItem ? 'Upravit opakuj\u00edc\u00ed se platbu' : 'Nov\u00e1 opakuj\u00edc\u00ed se platba'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type: expense / income */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Typ
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="expense"
                  checked={formData.type === 'expense'}
                  onChange={() => setFormData({ ...formData, type: 'expense' })}
                  className="w-4 h-4 text-primary-500 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">V\u00fddaj</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="income"
                  checked={formData.type === 'income'}
                  onChange={() => setFormData({ ...formData, type: 'income' })}
                  className="w-4 h-4 text-primary-500 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">P\u0159\u00edjem</span>
              </label>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              N\u00e1zev
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Nap\u0159. Netflix, N\u00e1jem, Plat"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-gray-100"
              required
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              \u010c\u00e1stka (K\u010d)
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0"
              min="0"
              step="0.01"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-gray-100"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Kategorie
            </label>
            <select
              value={formData.categoryId}
              onChange={(e) =>
                setFormData({ ...formData, categoryId: e.target.value as ExpenseCategory })
              }
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-gray-100"
            >
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Frequency + Interval */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Frekvence
              </label>
              <select
                value={formData.frequency}
                onChange={(e) =>
                  setFormData({ ...formData, frequency: e.target.value as Frequency })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-gray-100"
              >
                {Object.entries(FREQUENCY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Interval
              </label>
              <input
                type="number"
                value={formData.interval}
                onChange={(e) => setFormData({ ...formData, interval: e.target.value })}
                min="1"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Start date + End date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Datum zah\u00e1jen\u00ed
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-gray-100"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Datum ukon\u010den\u00ed
                <span className="text-gray-400 ml-1">(voliteln\u00e9)</span>
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Checkboxes: autoConfirm + isSubscription */}
          <div className="flex flex-col sm:flex-row gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.autoConfirm}
                onChange={(e) => setFormData({ ...formData, autoConfirm: e.target.checked })}
                className="w-4 h-4 rounded text-primary-500 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Automaticky potvrzovat
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isSubscription}
                onChange={(e) =>
                  setFormData({ ...formData, isSubscription: e.target.checked })
                }
                className="w-4 h-4 rounded text-primary-500 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Jde o p\u0159edplatn\u00e9
              </span>
            </label>
          </div>

          {/* Provider name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              N\u00e1zev poskytovatele
              <span className="text-gray-400 ml-1">(voliteln\u00e9)</span>
            </label>
            <input
              type="text"
              value={formData.providerName}
              onChange={(e) => setFormData({ ...formData, providerName: e.target.value })}
              placeholder="Nap\u0159. Netflix, Vodafone, \u010cEZ"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-gray-100"
            />
          </div>

          {/* WellMall percentage slider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              WellMall pod\u00edl: {formData.wellmallPercentage} %
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={formData.wellmallPercentage}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  wellmallPercentage: parseInt(e.target.value, 10),
                })
              }
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0 %</span>
              <span>50 %</span>
              <span>100 %</span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Pozn\u00e1mky
              <span className="text-gray-400 ml-1">(voliteln\u00e9)</span>
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Dopl\u0148uj\u00edc\u00ed informace..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-gray-100 resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingItem(null);
                setFormData(defaultFormData);
              }}
              className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl px-4 py-2 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Zru\u0161it
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary-500 hover:bg-primary-600 text-white rounded-xl px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
            >
              {isSubmitting
                ? 'Ukl\u00e1d\u00e1n\u00ed...'
                : editingItem
                  ? 'Ulo\u017eit zm\u011bny'
                  : 'Vytvo\u0159it platbu'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
