import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import api from './services/api';
import { CATEGORY_LABELS } from './types';
import type { ExpenseCategory } from './types';
import './styles/globals.css';

function PopupContent() {
  const { isDark } = useTheme();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [quickMode, setQuickMode] = useState<'overview' | 'add'>('overview');

  // Quick add form state
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('family_life');
  const [wellmallPct, setWellmallPct] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  // Overview data
  const [overview, setOverview] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('dr_token');
    if (token) {
      api.setToken(token);
      setIsLoggedIn(true);
      loadOverview();
    }
  }, []);

  const loadOverview = async () => {
    try {
      const now = new Date();
      const data = await api.getDashboard(now.getMonth() + 1, now.getFullYear());
      setOverview(data);
    } catch {
      // Silently fail
    }
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return;
    setIsSubmitting(true);
    setMessage('');

    const total = parseFloat(amount);
    const wm = Math.round(total * (wellmallPct / 100));

    try {
      const now = new Date();
      await api.createExpense({
        title,
        amountTotal: total,
        amountFamily: total - wm,
        amountWellmall: wm,
        wellmallPercentage: wellmallPct,
        categoryId: category,
        isRecurring: false,
        frequency: 'monthly',
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      });
      setMessage('Výdaj přidán!');
      setTitle('');
      setAmount('');
      setWellmallPct(0);
      loadOverview();
    } catch {
      setMessage('Chyba při ukládání');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(n);

  if (!isLoggedIn) {
    return (
      <div className="p-6 text-center">
        <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center mx-auto mb-3">
          <span className="text-white font-bold text-lg">DR</span>
        </div>
        <h2 className="font-bold text-gray-800 dark:text-gray-100">Domácí Rozpočet</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-4">
          Přihlaste se v hlavní aplikaci
        </p>
        <button
          onClick={() => chrome.tabs?.create({ url: 'newtab.html' })}
          className="btn-primary text-sm"
        >
          Otevřít aplikaci
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-primary-500 dark:text-primary-300 text-sm">
          Domácí Rozpočet
        </h2>
        <div className="flex gap-1">
          <button
            onClick={() => setQuickMode('overview')}
            className={`px-2 py-1 text-xs rounded-lg ${
              quickMode === 'overview'
                ? 'bg-primary-500 text-white'
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            Přehled
          </button>
          <button
            onClick={() => setQuickMode('add')}
            className={`px-2 py-1 text-xs rounded-lg ${
              quickMode === 'add'
                ? 'bg-primary-500 text-white'
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            + Přidat
          </button>
        </div>
      </div>

      {quickMode === 'overview' && overview && (
        <div className="space-y-3">
          {/* Rat Race */}
          <div className="text-center py-3">
            <div className="text-3xl font-extrabold" style={{
              color: overview.ratRace.percentage < 25 ? '#e85d4a' :
                     overview.ratRace.percentage < 50 ? '#f59e0b' : '#2d8f5e'
            }}>
              {overview.ratRace.percentage} %
            </div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">Rat Race Metr</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-secondary-50 dark:bg-secondary-900/20 rounded-xl p-2.5 text-center">
              <p className="text-[10px] text-gray-500 dark:text-gray-400">Příjmy</p>
              <p className="text-sm font-bold text-secondary-600 dark:text-secondary-400">
                {formatCurrency(overview.overview.activeIncome + overview.overview.passiveIncome)}
              </p>
            </div>
            <div className="bg-warning-50 dark:bg-warning-900/20 rounded-xl p-2.5 text-center">
              <p className="text-[10px] text-gray-500 dark:text-gray-400">Výdaje</p>
              <p className="text-sm font-bold text-warning-600 dark:text-warning-400">
                {formatCurrency(overview.overview.totalExpenses)}
              </p>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-2.5 text-center">
            <p className="text-[10px] text-gray-500 dark:text-gray-400">Zbývá</p>
            <p className={`text-lg font-bold ${
              overview.overview.remainingBudget >= 0 ? 'text-secondary-500' : 'text-warning-500'
            }`}>
              {formatCurrency(overview.overview.remainingBudget)}
            </p>
          </div>

          <button
            onClick={() => chrome.tabs?.create({ url: 'newtab.html' })}
            className="btn-outline w-full text-xs"
          >
            Otevřít plný dashboard
          </button>
        </div>
      )}

      {quickMode === 'add' && (
        <form onSubmit={handleQuickAdd} className="space-y-3">
          {message && (
            <div className={`text-xs px-3 py-2 rounded-lg ${
              message.includes('Chyba')
                ? 'bg-warning-50 text-warning-600'
                : 'bg-secondary-50 text-secondary-600'
            }`}>
              {message}
            </div>
          )}

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Název výdaje"
            className="input-field text-sm"
            required
          />

          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Částka (Kč)"
            className="input-field text-sm"
            min="0"
            required
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
            className="input-field text-sm"
          >
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          <div>
            <div className="flex justify-between text-[10px] text-gray-500 mb-1">
              <span>Rodina: {100 - wellmallPct}%</span>
              <span>WellMall: {wellmallPct}%</span>
            </div>
            <input
              type="range"
              min="0" max="100" step="5"
              value={wellmallPct}
              onChange={(e) => setWellmallPct(parseInt(e.target.value))}
              className="w-full accent-primary-500"
            />
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full text-sm">
            {isSubmitting ? 'Ukládání...' : 'Rychle přidat výdaj'}
          </button>
        </form>
      )}
    </div>
  );
}

function PopupApp() {
  return (
    <ThemeProvider>
      <PopupContent />
    </ThemeProvider>
  );
}

const container = document.getElementById('popup-root');
if (container) {
  const root = createRoot(container);
  root.render(<PopupApp />);
}
