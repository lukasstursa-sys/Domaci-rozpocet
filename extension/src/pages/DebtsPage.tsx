import React, { useState, useEffect, useCallback } from 'react';
import Modal from '../components/common/Modal';

const API_BASE = 'http://localhost:3001/api';
function getHeaders() {
  const token = localStorage.getItem('dr_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

const formatCZK = (amount: number) =>
  new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK' }).format(amount);

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('cs-CZ');

type DebtType = 'debt' | 'credit';
type DebtStatus = 'active' | 'paid_off' | 'overdue';
type TabFilter = 'all' | 'debt' | 'credit' | 'paid_off';

interface Debt {
  id: string;
  type: DebtType;
  counterparty: string;
  description: string;
  originalAmount: number;
  remainingAmount: number;
  interestRate?: number;
  startDate: string;
  dueDate?: string;
  status: DebtStatus;
  notes?: string;
  payments?: Payment[];
}

interface Payment {
  id: string;
  amount: number;
  note?: string;
  date: string;
}

interface DebtSummary {
  totalDebt: number;
  totalCredit: number;
  netPosition: number;
  overdueCount: number;
}

interface DebtFormData {
  type: DebtType;
  counterparty: string;
  description: string;
  originalAmount: string;
  interestRate: string;
  startDate: string;
  dueDate: string;
  notes: string;
}

const emptyFormData: DebtFormData = {
  type: 'debt',
  counterparty: '',
  description: '',
  originalAmount: '',
  interestRate: '',
  startDate: new Date().toISOString().slice(0, 10),
  dueDate: '',
  notes: '',
};

export default function DebtsPage() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [summary, setSummary] = useState<DebtSummary>({
    totalDebt: 0,
    totalCredit: 0,
    netPosition: 0,
    overdueCount: 0,
  });
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [loading, setLoading] = useState(true);

  // Create / Edit modal
  const [showForm, setShowForm] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [formData, setFormData] = useState<DebtFormData>(emptyFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Payment modal
  const [showPayment, setShowPayment] = useState(false);
  const [payingDebt, setPayingDebt] = useState<Debt | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [isPayingSubmitting, setIsPayingSubmitting] = useState(false);

  const loadDebts = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (activeTab === 'debt' || activeTab === 'credit') {
        params.set('type', activeTab);
      }
      if (activeTab === 'paid_off') {
        params.set('status', 'paid_off');
      }
      const query = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`${API_BASE}/debts${query}`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Chyba při načítání dluhů');
      const data = await res.json();
      setDebts(data);
    } catch (err) {
      console.error(err);
    }
  }, [activeTab]);

  const loadSummary = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/debts/summary`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Chyba při načítání souhrnu');
      const data = await res.json();
      setSummary(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadDebts(), loadSummary()]).finally(() => setLoading(false));
  }, [loadDebts, loadSummary]);

  // --- Form helpers ---

  const openCreateForm = () => {
    setEditingDebt(null);
    setFormData(emptyFormData);
    setShowForm(true);
  };

  const openEditForm = (debt: Debt) => {
    setEditingDebt(debt);
    setFormData({
      type: debt.type,
      counterparty: debt.counterparty,
      description: debt.description,
      originalAmount: String(debt.originalAmount),
      interestRate: debt.interestRate != null ? String(debt.interestRate) : '',
      startDate: debt.startDate.slice(0, 10),
      dueDate: debt.dueDate ? debt.dueDate.slice(0, 10) : '',
      notes: debt.notes ?? '',
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingDebt(null);
    setFormData(emptyFormData);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.counterparty || !formData.originalAmount) return;
    setIsSubmitting(true);

    const body: Record<string, unknown> = {
      type: formData.type,
      counterparty: formData.counterparty,
      description: formData.description,
      originalAmount: parseFloat(formData.originalAmount),
      startDate: formData.startDate,
      notes: formData.notes || undefined,
    };
    if (formData.interestRate) body.interestRate = parseFloat(formData.interestRate);
    if (formData.dueDate) body.dueDate = formData.dueDate;

    try {
      const url = editingDebt
        ? `${API_BASE}/debts/${editingDebt.id}`
        : `${API_BASE}/debts`;
      const method = editingDebt ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Chyba při ukládání');
      closeForm();
      await Promise.all([loadDebts(), loadSummary()]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Delete ---

  const handleDelete = async (debt: Debt) => {
    if (!confirm(`Opravdu chcete smazat ${debt.type === 'debt' ? 'dluh' : 'pohledávku'} u ${debt.counterparty}?`)) return;
    try {
      const res = await fetch(`${API_BASE}/debts/${debt.id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error('Chyba při mazání');
      await Promise.all([loadDebts(), loadSummary()]);
    } catch (err) {
      console.error(err);
    }
  };

  // --- Payment ---

  const openPayment = (debt: Debt) => {
    setPayingDebt(debt);
    setPaymentAmount('');
    setPaymentNote('');
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setShowPayment(true);
  };

  const closePayment = () => {
    setShowPayment(false);
    setPayingDebt(null);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingDebt || !paymentAmount) return;
    setIsPayingSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/debts/${payingDebt.id}/payment`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          amount: parseFloat(paymentAmount),
          note: paymentNote || undefined,
          date: paymentDate,
        }),
      });
      if (!res.ok) throw new Error('Chyba při zápisu platby');
      closePayment();
      await Promise.all([loadDebts(), loadSummary()]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsPayingSubmitting(false);
    }
  };

  const paymentRemaining =
    payingDebt && paymentAmount
      ? Math.max(payingDebt.remainingAmount - parseFloat(paymentAmount || '0'), 0)
      : payingDebt?.remainingAmount ?? 0;

  // --- Helpers ---

  const isOverdue = (debt: Debt) => {
    if (!debt.dueDate || debt.status === 'paid_off') return false;
    return new Date(debt.dueDate) < new Date();
  };

  const getStatusBadge = (debt: Debt) => {
    if (debt.status === 'paid_off') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          Splaceno
        </span>
      );
    }
    if (debt.status === 'overdue' || isOverdue(debt)) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
          Po splatnosti
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
        Aktivní
      </span>
    );
  };

  const progressPct = (debt: Debt) => {
    if (debt.originalAmount === 0) return 100;
    const paid = debt.originalAmount - debt.remainingAmount;
    return Math.min(Math.round((paid / debt.originalAmount) * 100), 100);
  };

  // --- Tabs ---

  const tabs: { key: TabFilter; label: string }[] = [
    { key: 'all', label: 'Vše' },
    { key: 'debt', label: 'Dluhy' },
    { key: 'credit', label: 'Pohledávky' },
    { key: 'paid_off', label: 'Splacené' },
  ];

  // --- Render ---

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Dluhy a pohledávky
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Přehled a správa dluhů a pohledávek
          </p>
        </div>
        <button onClick={openCreateForm} className="btn-primary">
          + Nový záznam
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Celkový dluh */}
        <div className="bg-white dark:bg-dark-card rounded-2xl shadow-neu-light dark:shadow-neu-dark p-5 border-l-4 border-red-500">
          <p className="text-xs text-gray-500 dark:text-gray-400">Celkový dluh</p>
          <p className="text-xl font-bold text-red-600 dark:text-red-400 mt-1">
            {formatCZK(summary.totalDebt)}
          </p>
        </div>

        {/* Celkové pohledávky */}
        <div className="bg-white dark:bg-dark-card rounded-2xl shadow-neu-light dark:shadow-neu-dark p-5 border-l-4 border-green-500">
          <p className="text-xs text-gray-500 dark:text-gray-400">Celkové pohledávky</p>
          <p className="text-xl font-bold text-green-600 dark:text-green-400 mt-1">
            {formatCZK(summary.totalCredit)}
          </p>
        </div>

        {/* Čistá pozice */}
        <div className="bg-white dark:bg-dark-card rounded-2xl shadow-neu-light dark:shadow-neu-dark p-5 border-l-4 border-blue-500">
          <p className="text-xs text-gray-500 dark:text-gray-400">Čistá pozice</p>
          <p
            className={`text-xl font-bold mt-1 ${
              summary.netPosition >= 0
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {formatCZK(summary.netPosition)}
          </p>
        </div>

        {/* Po splatnosti */}
        <div
          className={`bg-white dark:bg-dark-card rounded-2xl shadow-neu-light dark:shadow-neu-dark p-5 border-l-4 ${
            summary.overdueCount > 0 ? 'border-orange-500' : 'border-gray-300 dark:border-gray-600'
          }`}
        >
          <p className="text-xs text-gray-500 dark:text-gray-400">Po splatnosti</p>
          <p
            className={`text-xl font-bold mt-1 ${
              summary.overdueCount > 0
                ? 'text-orange-600 dark:text-orange-400'
                : 'text-gray-900 dark:text-gray-100'
            }`}
          >
            {summary.overdueCount}
          </p>
        </div>
      </div>

      {/* Tab filter */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === tab.key
                ? 'bg-white dark:bg-dark-card text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Debt list */}
      {loading ? (
        <div className="bg-white dark:bg-dark-card rounded-2xl shadow-neu-light dark:shadow-neu-dark p-5 text-center py-12">
          <p className="text-gray-400 dark:text-gray-500 text-lg">Načítání...</p>
        </div>
      ) : debts.length === 0 ? (
        <div className="bg-white dark:bg-dark-card rounded-2xl shadow-neu-light dark:shadow-neu-dark p-5 text-center py-12">
          <p className="text-gray-400 dark:text-gray-500 text-lg">Žádné záznamy</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
            Přidejte svůj první dluh nebo pohledávku
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {debts.map((debt) => {
            const pct = progressPct(debt);
            const overdue = isOverdue(debt);

            return (
              <div
                key={debt.id}
                className="bg-white dark:bg-dark-card rounded-2xl shadow-neu-light dark:shadow-neu-dark p-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  {/* Type icon */}
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      debt.type === 'debt'
                        ? 'bg-red-100 dark:bg-red-900/30'
                        : 'bg-green-100 dark:bg-green-900/30'
                    }`}
                  >
                    {debt.type === 'debt' ? (
                      <svg
                        className="w-5 h-5 text-red-600 dark:text-red-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 14l-7 7m0 0l-7-7m7 7V3"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5 text-green-600 dark:text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 10l7-7m0 0l7 7m-7-7v18"
                        />
                      </svg>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          {debt.counterparty}
                        </h3>
                        {debt.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            {debt.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {getStatusBadge(debt)}
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <span>Splaceno {pct}%</span>
                        <span>
                          {formatCZK(debt.remainingAmount)} / {formatCZK(debt.originalAmount)}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            overdue ? 'bg-warning-500' : 'bg-secondary-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    {/* Meta info */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-gray-500 dark:text-gray-400">
                      {debt.interestRate != null && debt.interestRate > 0 && (
                        <span>
                          Úrok: {debt.interestRate}%
                        </span>
                      )}
                      {debt.dueDate && (
                        <span className={overdue ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
                          Splatnost: {formatDate(debt.dueDate)}
                          {overdue && ' (po splatnosti!)'}
                        </span>
                      )}
                      <span>Začátek: {formatDate(debt.startDate)}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-4">
                      {debt.status !== 'paid_off' && (
                        <button
                          onClick={() => openPayment(debt)}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-secondary-500 text-white hover:bg-secondary-600 transition-colors"
                        >
                          Zaplatit
                        </button>
                      )}
                      <button
                        onClick={() => openEditForm(debt)}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        Upravit
                      </button>
                      <button
                        onClick={() => handleDelete(debt)}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                      >
                        Smazat
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit modal */}
      <Modal
        isOpen={showForm}
        onClose={closeForm}
        title={editingDebt ? 'Upravit záznam' : 'Nový dluh / pohledávka'}
        size="lg"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {/* Type radio */}
          <div>
            <label className="label">Typ</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="debtType"
                  value="debt"
                  checked={formData.type === 'debt'}
                  onChange={() => setFormData({ ...formData, type: 'debt' })}
                  className="w-4 h-4 text-red-500 focus:ring-red-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Dluh (já dlužím)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="debtType"
                  value="credit"
                  checked={formData.type === 'credit'}
                  onChange={() => setFormData({ ...formData, type: 'credit' })}
                  className="w-4 h-4 text-green-500 focus:ring-green-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Pohledávka (dlužní mi)</span>
              </label>
            </div>
          </div>

          {/* Counterparty */}
          <div>
            <label className="label">Protistrana *</label>
            <input
              type="text"
              value={formData.counterparty}
              onChange={(e) => setFormData({ ...formData, counterparty: e.target.value })}
              className="input-field"
              placeholder="Jméno osoby nebo firmy"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="label">Popis</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field"
              placeholder="Za co je dluh / pohledávka"
            />
          </div>

          {/* Amount + Interest */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Částka (Kč) *</label>
              <input
                type="number"
                value={formData.originalAmount}
                onChange={(e) => setFormData({ ...formData, originalAmount: e.target.value })}
                className="input-field"
                min="0"
                step="0.01"
                placeholder="Např. 10000"
                required
              />
            </div>
            <div>
              <label className="label">Úroková sazba (%)</label>
              <input
                type="number"
                value={formData.interestRate}
                onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                className="input-field"
                min="0"
                step="0.1"
                placeholder="Nepovinné"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Datum vzniku *</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="label">Datum splatnosti</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="label">Poznámky</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input-field"
              rows={3}
              placeholder="Další informace..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={closeForm} className="btn-outline">
              Zrušit
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? 'Ukládání...' : editingDebt ? 'Uložit změny' : 'Vytvořit'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Payment modal */}
      <Modal
        isOpen={showPayment}
        onClose={closePayment}
        title={`Zaplatit - ${payingDebt?.counterparty ?? ''}`}
      >
        <form onSubmit={handlePaymentSubmit} className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Celková částka:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {payingDebt ? formatCZK(payingDebt.originalAmount) : '-'}
              </span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-gray-500 dark:text-gray-400">Zbývá splatit:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {payingDebt ? formatCZK(payingDebt.remainingAmount) : '-'}
              </span>
            </div>
          </div>

          <div>
            <label className="label">Částka platby (Kč) *</label>
            <input
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              className="input-field"
              min="0.01"
              step="0.01"
              max={payingDebt?.remainingAmount}
              placeholder="Kolik chcete zaplatit"
              required
            />
          </div>

          <div>
            <label className="label">Poznámka</label>
            <input
              type="text"
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
              className="input-field"
              placeholder="Volitelná poznámka k platbě"
            />
          </div>

          <div>
            <label className="label">Datum platby *</label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="input-field"
              required
            />
          </div>

          {paymentAmount && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-700 dark:text-blue-300">Zbyde po platbě:</span>
                <span className="font-bold text-blue-700 dark:text-blue-300">
                  {formatCZK(paymentRemaining)}
                </span>
              </div>
              {paymentRemaining === 0 && (
                <p className="text-green-600 dark:text-green-400 font-medium mt-1">
                  Tato platba zcela splatí zůstatek.
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={closePayment} className="btn-outline">
              Zrušit
            </button>
            <button type="submit" disabled={isPayingSubmitting} className="btn-primary">
              {isPayingSubmitting ? 'Ukládání...' : 'Zaznamenat platbu'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
