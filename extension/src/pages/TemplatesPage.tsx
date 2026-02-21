import React, { useState, useEffect, useCallback } from 'react';
import Modal from '../components/common/Modal';
import {
  CATEGORY_LABELS,
  SUBCATEGORY_LABELS,
  ExpenseCategory,
  ExpenseSubcategory,
} from '../types';

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
// Subcategories mapping (mirrors ExpenseForm)
// ---------------------------------------------------------------------------

const SUBCATEGORIES_BY_CATEGORY: Record<ExpenseCategory, ExpenseSubcategory[]> = {
  housing_energy: ['electricity', 'gas', 'solid_fuel', 'water', 'waste'],
  loans: ['rent', 'mortgage', 'consumer_loan'],
  subscriptions: ['netflix', 'hbo', 'youtube_premium', 'ai_tools'],
  telecom: ['mobile_plan', 'internet', 'tv_radio', 'satellite'],
  auto_moto: ['leasing', 'fuel', 'liability_insurance', 'accident_insurance'],
  insurance: ['life_insurance', 'household_insurance', 'property_insurance'],
  pets: ['pet_fee', 'pet_food_vet'],
  family_life: [
    'school_activities',
    'clothing',
    'groceries',
    'restaurants',
    'drugstore',
    'pocket_money',
    'birthdays_holidays',
  ],
  savings_investments: [
    'vacation_mountain',
    'vacation_autumn',
    'emergency_fund',
    'investment_portfolio',
  ],
  extraordinary: ['renovation', 'misc'],
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Template {
  id: string;
  name: string;
  icon: string;
  type: 'expense' | 'income';
  title: string;
  amount: number;
  categoryId: ExpenseCategory;
  subcategoryId?: ExpenseSubcategory;
  wellmallPercentage: number;
  providerName?: string;
  notes?: string;
  usageCount: number;
  createdAt: string;
}

type TemplateFormData = Omit<Template, 'id' | 'usageCount' | 'createdAt'>;

const EMPTY_FORM: TemplateFormData = {
  name: '',
  icon: '',
  type: 'expense',
  title: '',
  amount: 0,
  categoryId: 'family_life',
  subcategoryId: undefined,
  wellmallPercentage: 0,
  providerName: '',
  notes: '',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatCZK = (amount: number) =>
  new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK' }).format(amount);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create / edit modal
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TemplateFormData>({ ...EMPTY_FORM });
  const [submitting, setSubmitting] = useState(false);

  // Use-template dialog
  const [useDialogOpen, setUseDialogOpen] = useState(false);
  const [usingTemplate, setUsingTemplate] = useState<Template | null>(null);
  const [useMonth, setUseMonth] = useState(new Date().getMonth() + 1);
  const [useYear, setUseYear] = useState(new Date().getFullYear());
  const [useAmountOverride, setUseAmountOverride] = useState('');
  const [usingSubmitting, setUsingSubmitting] = useState(false);

  // ---------- Fetch templates ----------

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/templates`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Nepodařilo se načíst šablony');
      const data = await res.json();
      setTemplates(Array.isArray(data) ? data : data.templates ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Neznámá chyba');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // ---------- Create / Update ----------

  const openCreateForm = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setFormOpen(true);
  };

  const openEditForm = (t: Template) => {
    setEditingId(t.id);
    setForm({
      name: t.name,
      icon: t.icon,
      type: t.type,
      title: t.title,
      amount: t.amount,
      categoryId: t.categoryId,
      subcategoryId: t.subcategoryId,
      wellmallPercentage: t.wellmallPercentage,
      providerName: t.providerName ?? '',
      notes: t.notes ?? '',
    });
    setFormOpen(true);
  };

  const handleFormChange = <K extends keyof TemplateFormData>(
    key: K,
    value: TemplateFormData[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.title || form.amount <= 0) return;

    setSubmitting(true);
    try {
      const url = editingId
        ? `${API_BASE}/templates/${editingId}`
        : `${API_BASE}/templates`;
      const method = editingId ? 'PUT' : 'POST';

      const body: Record<string, unknown> = { ...form };
      if (!body.subcategoryId) delete body.subcategoryId;
      if (!body.providerName) delete body.providerName;
      if (!body.notes) delete body.notes;

      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Nepodařilo se uložit šablonu');

      setFormOpen(false);
      fetchTemplates();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Chyba při ukládání');
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- Delete ----------

  const handleDelete = async (id: string) => {
    if (!window.confirm('Opravdu chcete smazat tuto šablonu?')) return;
    try {
      const res = await fetch(`${API_BASE}/templates/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error('Nepodařilo se smazat šablonu');
      fetchTemplates();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Chyba při mazání');
    }
  };

  // ---------- Use template ----------

  const openUseDialog = (t: Template) => {
    setUsingTemplate(t);
    setUseMonth(new Date().getMonth() + 1);
    setUseYear(new Date().getFullYear());
    setUseAmountOverride('');
    setUseDialogOpen(true);
  };

  const handleUseTemplate = async () => {
    if (!usingTemplate) return;
    setUsingSubmitting(true);
    try {
      const body: Record<string, unknown> = { month: useMonth, year: useYear };
      const override = parseFloat(useAmountOverride);
      if (!isNaN(override) && override > 0) {
        body.amount = override;
      }

      const res = await fetch(`${API_BASE}/templates/${usingTemplate.id}/use`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Nepodařilo se vytvořit transakci ze šablony');

      setUseDialogOpen(false);
      setUsingTemplate(null);
      fetchTemplates(); // refresh usage count
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Chyba při použití šablony');
    } finally {
      setUsingSubmitting(false);
    }
  };

  // ---------- Input class shortcut ----------

  const inputCls =
    'w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-400';

  // ---------- Render ----------

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Šablony transakcí
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Rychlé zadávání častých výdajů
          </p>
        </div>
        <button
          onClick={openCreateForm}
          className="bg-primary-500 hover:bg-primary-600 text-white rounded-xl px-4 py-2 font-medium transition-colors flex items-center gap-2"
        >
          <span className="text-lg leading-none">+</span> Přidat šablonu
        </button>
      </div>

      {/* Loading / Error */}
      {loading && (
        <p className="text-center text-gray-500 dark:text-gray-400 py-12">
          Načítání šablon...
        </p>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl p-4 text-sm">
          {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && templates.length === 0 && (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">
          <p className="text-4xl mb-3">📋</p>
          <p className="font-medium text-gray-600 dark:text-gray-300">
            Zatím nemáte žádné šablony
          </p>
          <p className="text-sm mt-1">
            Vytvořte si šablonu pro rychlé zadávání opakujících se transakcí.
          </p>
        </div>
      )}

      {/* Template cards grid */}
      {!loading && templates.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t) => (
            <div
              key={t.id}
              className="bg-white dark:bg-dark-card rounded-2xl shadow-neu-light dark:shadow-neu-dark p-5 flex flex-col justify-between"
            >
              {/* Top row: icon + name + actions */}
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{t.icon || '📄'}</span>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base">
                      {t.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditForm(t)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      title="Upravit"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      title="Smazat"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Amount */}
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">
                  {formatCZK(t.amount)}
                </p>

                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    {CATEGORY_LABELS[t.categoryId] ?? t.categoryId}
                  </span>
                  <span
                    className={`inline-block text-xs font-medium px-2.5 py-1 rounded-lg ${
                      t.type === 'expense'
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                        : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    }`}
                  >
                    {t.type === 'expense' ? 'Výdaj' : 'Příjem'}
                  </span>
                </div>

                {/* Usage count */}
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                  Použito {t.usageCount}x
                </p>
              </div>

              {/* Use button */}
              <button
                onClick={() => openUseDialog(t)}
                className="bg-secondary-500 hover:bg-secondary-600 text-white rounded-xl px-4 py-2 font-medium transition-colors w-full"
              >
                Použít
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ================================================================= */}
      {/* Create / Edit Modal                                               */}
      {/* ================================================================= */}
      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingId ? 'Upravit šablonu' : 'Nová šablona'}
        size="lg"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {/* Name + Icon */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Název šablony
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                placeholder="Např. Měsíční nájemné"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ikona (emoji)
              </label>
              <input
                type="text"
                value={form.icon}
                onChange={(e) => handleFormChange('icon', e.target.value)}
                placeholder="🏠"
                className={inputCls}
              />
            </div>
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Typ transakce
            </label>
            <select
              value={form.type}
              onChange={(e) =>
                handleFormChange('type', e.target.value as 'expense' | 'income')
              }
              className={inputCls}
            >
              <option value="expense">Výdaj</option>
              <option value="income">Příjem</option>
            </select>
          </div>

          {/* Title + Amount */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Název položky
              </label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => handleFormChange('title', e.target.value)}
                placeholder="Nájemné"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Výchozí částka (Kč)
              </label>
              <input
                type="number"
                required
                min={0}
                step="0.01"
                value={form.amount || ''}
                onChange={(e) =>
                  handleFormChange('amount', parseFloat(e.target.value) || 0)
                }
                placeholder="0"
                className={inputCls}
              />
            </div>
          </div>

          {/* Category + Subcategory */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Kategorie
              </label>
              <select
                value={form.categoryId}
                onChange={(e) => {
                  const cat = e.target.value as ExpenseCategory;
                  handleFormChange('categoryId', cat);
                  handleFormChange('subcategoryId', undefined);
                }}
                className={inputCls}
              >
                {(Object.entries(CATEGORY_LABELS) as [ExpenseCategory, string][]).map(
                  ([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ),
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Podkategorie
              </label>
              <select
                value={form.subcategoryId ?? ''}
                onChange={(e) =>
                  handleFormChange(
                    'subcategoryId',
                    (e.target.value as ExpenseSubcategory) || undefined,
                  )
                }
                className={inputCls}
              >
                <option value="">-- Žádná --</option>
                {(SUBCATEGORIES_BY_CATEGORY[form.categoryId] || []).map((sub) => (
                  <option key={sub} value={sub}>
                    {SUBCATEGORY_LABELS[sub]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* WellMall slider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              WellMall podíl: {form.wellmallPercentage} %
            </label>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={form.wellmallPercentage}
              onChange={(e) =>
                handleFormChange('wellmallPercentage', parseInt(e.target.value))
              }
              className="w-full accent-primary-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0 %</span>
              <span>100 %</span>
            </div>
          </div>

          {/* Provider + Notes */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Poskytovatel
              </label>
              <input
                type="text"
                value={form.providerName ?? ''}
                onChange={(e) => handleFormChange('providerName', e.target.value)}
                placeholder="Název firmy"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Poznámky
              </label>
              <input
                type="text"
                value={form.notes ?? ''}
                onChange={(e) => handleFormChange('notes', e.target.value)}
                placeholder="Volitelná poznámka"
                className={inputCls}
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="px-4 py-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Zrušit
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-primary-500 hover:bg-primary-600 text-white rounded-xl px-4 py-2 font-medium transition-colors disabled:opacity-50"
            >
              {submitting
                ? 'Ukládání...'
                : editingId
                  ? 'Uložit změny'
                  : 'Vytvořit šablonu'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ================================================================= */}
      {/* Use Template Dialog                                               */}
      {/* ================================================================= */}
      <Modal
        isOpen={useDialogOpen}
        onClose={() => setUseDialogOpen(false)}
        title="Použít šablonu"
        size="sm"
      >
        {usingTemplate && (
          <div className="space-y-4">
            {/* Preview */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">{usingTemplate.icon || '📄'}</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {usingTemplate.name}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {usingTemplate.title}
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {formatCZK(usingTemplate.amount)}
              </p>
              <div className="flex gap-2">
                <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                  {CATEGORY_LABELS[usingTemplate.categoryId] ?? usingTemplate.categoryId}
                </span>
                <span
                  className={`inline-block text-xs font-medium px-2 py-0.5 rounded-md ${
                    usingTemplate.type === 'expense'
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                      : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  }`}
                >
                  {usingTemplate.type === 'expense' ? 'Výdaj' : 'Příjem'}
                </span>
              </div>
            </div>

            {/* Month / Year */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Měsíc
                </label>
                <select
                  value={useMonth}
                  onChange={(e) => setUseMonth(parseInt(e.target.value))}
                  className={inputCls}
                >
                  {[
                    'Leden',
                    'Únor',
                    'Březen',
                    'Duben',
                    'Květen',
                    'Červen',
                    'Červenec',
                    'Srpen',
                    'Září',
                    'Říjen',
                    'Listopad',
                    'Prosinec',
                  ].map((name, i) => (
                    <option key={i} value={i + 1}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Rok
                </label>
                <input
                  type="number"
                  value={useYear}
                  onChange={(e) => setUseYear(parseInt(e.target.value))}
                  min={2020}
                  max={2040}
                  className={inputCls}
                />
              </div>
            </div>

            {/* Optional amount override */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Přepsat částku (volitelné)
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={useAmountOverride}
                onChange={(e) => setUseAmountOverride(e.target.value)}
                placeholder={String(usingTemplate.amount)}
                className={inputCls}
              />
              <p className="text-xs text-gray-400 mt-1">
                Ponechte prázdné pro výchozí částku {formatCZK(usingTemplate.amount)}
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setUseDialogOpen(false)}
                className="px-4 py-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Zrušit
              </button>
              <button
                type="button"
                disabled={usingSubmitting}
                onClick={handleUseTemplate}
                className="bg-secondary-500 hover:bg-secondary-600 text-white rounded-xl px-4 py-2 font-medium transition-colors disabled:opacity-50"
              >
                {usingSubmitting ? 'Vytvářím...' : 'Vytvořit transakci'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
