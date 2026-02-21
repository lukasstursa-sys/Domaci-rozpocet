import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import type { ExpenseCategory, ExpenseSubcategory } from '../../types';
import { CATEGORY_LABELS, SUBCATEGORY_LABELS } from '../../types';

interface ExpenseFormProps {
  onClose: () => void;
  initialCategory?: ExpenseCategory;
}

const SUBCATEGORIES_BY_CATEGORY: Record<ExpenseCategory, ExpenseSubcategory[]> = {
  housing_energy: ['electricity', 'gas', 'solid_fuel', 'water', 'waste'],
  loans: ['rent', 'mortgage', 'consumer_loan'],
  subscriptions: ['netflix', 'hbo', 'youtube_premium', 'ai_tools'],
  telecom: ['mobile_plan', 'internet', 'tv_radio', 'satellite'],
  auto_moto: ['leasing', 'fuel', 'liability_insurance', 'accident_insurance'],
  insurance: ['life_insurance', 'household_insurance', 'property_insurance'],
  pets: ['pet_fee', 'pet_food_vet'],
  family_life: ['school_activities', 'clothing', 'groceries', 'restaurants', 'drugstore', 'pocket_money', 'birthdays_holidays'],
  savings_investments: ['vacation_mountain', 'vacation_autumn', 'emergency_fund', 'investment_portfolio'],
  extraordinary: ['renovation', 'misc'],
};

export default function ExpenseForm({ onClose, initialCategory }: ExpenseFormProps) {
  const { addExpense, familyMembers, vehicles, pets, currentMonth, currentYear } = useData();

  const [title, setTitle] = useState('');
  const [amountTotal, setAmountTotal] = useState('');
  const [categoryId, setCategoryId] = useState<ExpenseCategory>(initialCategory || 'family_life');
  const [subcategoryId, setSubcategoryId] = useState<ExpenseSubcategory | ''>('');
  const [wellmallPercentage, setWellmallPercentage] = useState(0);
  const [isRecurring, setIsRecurring] = useState(true);
  const [frequency, setFrequency] = useState<'monthly' | 'yearly'>('monthly');
  const [providerName, setProviderName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [contractEndDate, setContractEndDate] = useState('');
  const [linkedMemberId, setLinkedMemberId] = useState('');
  const [linkedVehicleId, setLinkedVehicleId] = useState('');
  const [linkedPetId, setLinkedPetId] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const total = parseFloat(amountTotal) || 0;
  const amountWellmall = Math.round(total * (wellmallPercentage / 100));
  const amountFamily = total - amountWellmall;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amountTotal) return;

    setIsSubmitting(true);
    try {
      await addExpense({
        categoryId,
        subcategoryId: subcategoryId || undefined,
        title,
        amountTotal: total,
        amountFamily,
        amountWellmall,
        wellmallPercentage,
        isRecurring,
        frequency,
        dueDate: dueDate || undefined,
        contractEndDate: contractEndDate || undefined,
        linkedMemberId: linkedMemberId || undefined,
        linkedVehicleId: linkedVehicleId || undefined,
        linkedPetId: linkedPetId || undefined,
        providerName: providerName || undefined,
        notes: notes || undefined,
        month: currentMonth,
        year: currentYear,
      });
      onClose();
    } catch (err) {
      console.error('Chyba při ukládání:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title & Amount */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Název výdaje *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-field"
            placeholder="Např. Netflix, Elektřina..."
            required
          />
        </div>
        <div>
          <label className="label">Celková částka (Kč) *</label>
          <input
            type="number"
            value={amountTotal}
            onChange={(e) => setAmountTotal(e.target.value)}
            className="input-field"
            placeholder="0"
            min="0"
            step="1"
            required
          />
        </div>
      </div>

      {/* Category & Subcategory */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Kategorie</label>
          <select
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value as ExpenseCategory);
              setSubcategoryId('');
            }}
            className="input-field"
          >
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Podkategorie</label>
          <select
            value={subcategoryId}
            onChange={(e) => setSubcategoryId(e.target.value as ExpenseSubcategory)}
            className="input-field"
          >
            <option value="">-- Vyberte --</option>
            {(SUBCATEGORIES_BY_CATEGORY[categoryId] || []).map((sub) => (
              <option key={sub} value={sub}>{SUBCATEGORY_LABELS[sub]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* WellMall Split */}
      <div className="card bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800">
        <label className="label text-primary-700 dark:text-primary-300 flex items-center gap-2">
          Rozdělení platby: Rodina / WellMall
        </label>
        <div className="flex items-center gap-4 mt-2">
          <span className="text-sm text-gray-600 dark:text-gray-300 min-w-[80px]">
            Rodina: {100 - wellmallPercentage} %
          </span>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={wellmallPercentage}
            onChange={(e) => setWellmallPercentage(parseInt(e.target.value))}
            className="flex-1 accent-primary-500"
          />
          <span className="text-sm text-primary-600 dark:text-primary-300 min-w-[80px] text-right">
            WellMall: {wellmallPercentage} %
          </span>
        </div>
        {total > 0 && (
          <div className="flex justify-between mt-2 text-xs">
            <span className="text-gray-500">Rodina: {amountFamily} Kč</span>
            <span className="text-primary-600 dark:text-primary-300 font-medium">
              WellMall: {amountWellmall} Kč
            </span>
          </div>
        )}
      </div>

      {/* Provider & Recurring */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Poskytovatel</label>
          <input
            type="text"
            value={providerName}
            onChange={(e) => setProviderName(e.target.value)}
            className="input-field"
            placeholder="Např. ČEZ, T-Mobile..."
          />
        </div>
        <div>
          <label className="label">Typ</label>
          <div className="flex items-center gap-4 mt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 rounded accent-primary-500"
              />
              <span className="text-sm text-gray-600 dark:text-gray-300">Opakující se</span>
            </label>
            {isRecurring && (
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as 'monthly' | 'yearly')}
                className="input-field w-auto"
              >
                <option value="monthly">Měsíčně</option>
                <option value="yearly">Ročně</option>
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Datum splatnosti</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="input-field"
          />
        </div>
        <div>
          <label className="label">Konec smlouvy/fixace</label>
          <input
            type="date"
            value={contractEndDate}
            onChange={(e) => setContractEndDate(e.target.value)}
            className="input-field"
          />
        </div>
      </div>

      {/* Linked entities */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="label">Člen rodiny</label>
          <select
            value={linkedMemberId}
            onChange={(e) => setLinkedMemberId(e.target.value)}
            className="input-field"
          >
            <option value="">-- Vyberte --</option>
            {familyMembers.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Vozidlo</label>
          <select
            value={linkedVehicleId}
            onChange={(e) => setLinkedVehicleId(e.target.value)}
            className="input-field"
          >
            <option value="">-- Vyberte --</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.brand} {v.model} ({v.spz})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Mazlíček</label>
          <select
            value={linkedPetId}
            onChange={(e) => setLinkedPetId(e.target.value)}
            className="input-field"
          >
            <option value="">-- Vyberte --</option>
            {pets.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="label">Poznámky</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="input-field"
          rows={2}
          placeholder="Volitelné poznámky..."
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-outline">
          Zrušit
        </button>
        <button type="submit" disabled={isSubmitting} className="btn-primary">
          {isSubmitting ? 'Ukládání...' : 'Uložit výdaj'}
        </button>
      </div>
    </form>
  );
}
