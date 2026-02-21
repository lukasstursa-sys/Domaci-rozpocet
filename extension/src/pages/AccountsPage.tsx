import React, { useState, useEffect, useCallback } from 'react';
import Modal from '../components/common/Modal';

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------
const API_BASE = 'http://localhost:3001/api';

function getHeaders() {
  const token = localStorage.getItem('dr_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type AccountType = 'cash' | 'bank' | 'savings' | 'credit_card' | 'investment';

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  cash: 'Hotovost',
  bank: 'Bankovní účet',
  savings: 'Spořicí účet',
  credit_card: 'Kreditní karta',
  investment: 'Investice',
};

interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  initialBalance: number;
  currency: string;
  icon: string;
  color: string;
  isDefault: boolean;
  isHidden: boolean;
  includeInTotal: boolean;
  notes: string;
}

interface AccountFormData {
  name: string;
  type: AccountType;
  initialBalance: string;
  currency: string;
  icon: string;
  color: string;
  isDefault: boolean;
  isHidden: boolean;
  includeInTotal: boolean;
  notes: string;
}

const EMPTY_FORM: AccountFormData = {
  name: '',
  type: 'bank',
  initialBalance: '0',
  currency: 'CZK',
  icon: '💰',
  color: '#3b82f6',
  isDefault: false,
  isHidden: false,
  includeInTotal: true,
  notes: '',
};

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------
function formatCZK(amount: number): string {
  return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK' }).format(amount);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [form, setForm] = useState<AccountFormData>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Transfer state
  const [transferFrom, setTransferFrom] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNote, setTransferNote] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------
  const loadAccounts = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/accounts`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Chyba při načítání účtů');
      const data = await res.json();
      setAccounts(Array.isArray(data) ? data : data.accounts ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  // ---------------------------------------------------------------------------
  // CRUD handlers
  // ---------------------------------------------------------------------------
  const openCreate = () => {
    setEditingAccount(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (account: Account) => {
    setEditingAccount(account);
    setForm({
      name: account.name,
      type: account.type,
      initialBalance: String(account.initialBalance ?? account.balance ?? 0),
      currency: account.currency || 'CZK',
      icon: account.icon || '💰',
      color: account.color || '#3b82f6',
      isDefault: account.isDefault ?? false,
      isHidden: account.isHidden ?? false,
      includeInTotal: account.includeInTotal ?? true,
      notes: account.notes || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setIsSubmitting(true);

    const payload = {
      name: form.name.trim(),
      type: form.type,
      initialBalance: parseFloat(form.initialBalance) || 0,
      currency: form.currency || 'CZK',
      icon: form.icon,
      color: form.color,
      isDefault: form.isDefault,
      isHidden: form.isHidden,
      includeInTotal: form.includeInTotal,
      notes: form.notes,
    };

    try {
      if (editingAccount) {
        const res = await fetch(`${API_BASE}/accounts/${editingAccount.id}`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Chyba při aktualizaci účtu');
      } else {
        const res = await fetch(`${API_BASE}/accounts`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Chyba při vytváření účtu');
      }
      setShowModal(false);
      setEditingAccount(null);
      setForm(EMPTY_FORM);
      await loadAccounts();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (account: Account) => {
    if (!confirm(`Opravdu chcete smazat účet "${account.name}"?`)) return;
    try {
      const res = await fetch(`${API_BASE}/accounts/${account.id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error('Chyba při mazání účtu');
      await loadAccounts();
    } catch (err) {
      console.error(err);
    }
  };

  // ---------------------------------------------------------------------------
  // Transfer handler
  // ---------------------------------------------------------------------------
  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferFrom || !transferTo || !transferAmount) return;
    if (transferFrom === transferTo) return;
    setIsTransferring(true);
    try {
      const res = await fetch(`${API_BASE}/accounts/transfer`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          fromAccountId: transferFrom,
          toAccountId: transferTo,
          amount: parseFloat(transferAmount),
          note: transferNote,
        }),
      });
      if (!res.ok) throw new Error('Chyba při převodu');
      setTransferFrom('');
      setTransferTo('');
      setTransferAmount('');
      setTransferNote('');
      await loadAccounts();
    } catch (err) {
      console.error(err);
    } finally {
      setIsTransferring(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------
  const totalBalance = accounts
    .filter((a) => !a.isHidden)
    .reduce((sum, a) => sum + (a.balance ?? 0), 0);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-400 dark:text-gray-500">Načítání účtů...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Účty</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Správa účtů a peněženek
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          + Přidat účet
        </button>
      </div>

      {/* Total balance */}
      <div className="bg-white dark:bg-dark-card rounded-2xl shadow-neu-light dark:shadow-neu-dark p-5">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Celkový zůstatek</p>
        <p
          className={`text-3xl font-bold ${
            totalBalance >= 0
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          }`}
        >
          {formatCZK(totalBalance)}
        </p>
      </div>

      {/* Account cards grid */}
      {accounts.length === 0 ? (
        <div className="bg-white dark:bg-dark-card rounded-2xl shadow-neu-light dark:shadow-neu-dark p-5 text-center py-12">
          <p className="text-gray-400 dark:text-gray-500 text-lg">Žádné účty</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
            Přidejte svůj první účet pro sledování financí
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="bg-white dark:bg-dark-card rounded-2xl shadow-neu-light dark:shadow-neu-dark p-5 group"
              style={{ borderLeft: `4px solid ${account.color || '#3b82f6'}` }}
            >
              {/* Top row: icon + name + badges */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{account.icon || '💰'}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      {account.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {ACCOUNT_TYPE_LABELS[account.type] ?? account.type}
                    </p>
                  </div>
                </div>

                {/* Edit / Delete */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(account)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-primary-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="Upravit"
                  >
                    &#9998;
                  </button>
                  <button
                    onClick={() => handleDelete(account)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="Smazat"
                  >
                    &#10005;
                  </button>
                </div>
              </div>

              {/* Balance */}
              <p
                className={`text-2xl font-bold mb-2 ${
                  account.balance >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {formatCZK(account.balance)}
              </p>

              {/* Badges + currency */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                  {account.currency || 'CZK'}
                </span>
                {account.isDefault && (
                  <span className="text-xs font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-2 py-0.5 rounded-full">
                    Výchozí
                  </span>
                )}
                {account.isHidden && (
                  <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 px-2 py-0.5 rounded-full">
                    Skrytý
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Transfer section */}
      {accounts.length >= 2 && (
        <div className="bg-white dark:bg-dark-card rounded-2xl shadow-neu-light dark:shadow-neu-dark p-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Převod mezi účty
          </h2>
          <form onSubmit={handleTransfer} className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="flex-1">
              <label className="label">Z účtu</label>
              <select
                value={transferFrom}
                onChange={(e) => setTransferFrom(e.target.value)}
                className="input-field"
                required
              >
                <option value="">Vyberte účet</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.icon} {a.name} ({formatCZK(a.balance)})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="label">Na účet</label>
              <select
                value={transferTo}
                onChange={(e) => setTransferTo(e.target.value)}
                className="input-field"
                required
              >
                <option value="">Vyberte účet</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.icon} {a.name} ({formatCZK(a.balance)})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="label">Částka</label>
              <input
                type="number"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                className="input-field"
                min="0.01"
                step="0.01"
                placeholder="0,00"
                required
              />
            </div>

            <div className="flex-1">
              <label className="label">Poznámka</label>
              <input
                type="text"
                value={transferNote}
                onChange={(e) => setTransferNote(e.target.value)}
                className="input-field"
                placeholder="Volitelná poznámka"
              />
            </div>

            <button
              type="submit"
              disabled={isTransferring || transferFrom === transferTo}
              className="btn-primary whitespace-nowrap"
            >
              {isTransferring ? 'Převádění...' : 'Převést'}
            </button>
          </form>
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingAccount(null);
          setForm(EMPTY_FORM);
        }}
        title={editingAccount ? 'Upravit účet' : 'Nový účet'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="label">Název *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input-field"
              placeholder="Např. Hlavní účet"
              required
            />
          </div>

          {/* Type + Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Typ účtu</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as AccountType })}
                className="input-field"
              >
                {(Object.keys(ACCOUNT_TYPE_LABELS) as AccountType[]).map((key) => (
                  <option key={key} value={key}>
                    {ACCOUNT_TYPE_LABELS[key]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Měna</label>
              <input
                type="text"
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="input-field"
                placeholder="CZK"
              />
            </div>
          </div>

          {/* Initial balance */}
          <div>
            <label className="label">Počáteční zůstatek</label>
            <input
              type="number"
              value={form.initialBalance}
              onChange={(e) => setForm({ ...form, initialBalance: e.target.value })}
              className="input-field"
              step="0.01"
              placeholder="0"
            />
          </div>

          {/* Icon + Color */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Ikona (emoji)</label>
              <input
                type="text"
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                className="input-field"
                placeholder="💰"
              />
            </div>
            <div>
              <label className="label">Barva</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="input-field flex-1"
                  placeholder="#3b82f6"
                />
              </div>
            </div>
          </div>

          {/* Checkboxes */}
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-900 dark:text-gray-100">Výchozí účet</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isHidden}
                onChange={(e) => setForm({ ...form, isHidden: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-900 dark:text-gray-100">Skrytý</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.includeInTotal}
                onChange={(e) => setForm({ ...form, includeInTotal: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-900 dark:text-gray-100">Zahrnout do celkového zůstatku</span>
            </label>
          </div>

          {/* Notes */}
          <div>
            <label className="label">Poznámky</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="input-field"
              rows={3}
              placeholder="Volitelné poznámky k účtu"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                setEditingAccount(null);
                setForm(EMPTY_FORM);
              }}
              className="btn-outline"
            >
              Zrušit
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting
                ? 'Ukládání...'
                : editingAccount
                  ? 'Uložit změny'
                  : 'Vytvořit účet'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
