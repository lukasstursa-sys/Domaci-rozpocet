import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import Modal from '../components/common/Modal';
import api from '../services/api';

const PET_TYPE_LABELS = { dog: 'Pes', cat: 'Kočka', guinea_pig: 'Morče', hen: 'Slepice', other: 'Ostatní' };
const PET_TYPE_ICONS = { dog: '🐕', cat: '🐱', guinea_pig: '🐹', hen: '🐔', other: '🐾' };

export default function PetsPage() {
  const { pets, expenses, refreshData } = useData();
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<string>('dog');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setIsSubmitting(true);
    try {
      await api.createPet({ type, name });
      await refreshData();
      setShowForm(false);
      setName('');
    } catch (err) { console.error(err); }
    finally { setIsSubmitting(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Zvířata</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Správa mazlíčků a jejich nákladů</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">+ Přidat mazlíčka</button>
      </div>

      {pets.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400 text-lg">Žádní mazlíčci</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pets.map((p) => {
            const petExpenses = expenses.filter((e) => e.linkedPetId === p.id);
            const totalCost = petExpenses.reduce((sum, e) => sum + e.amountTotal, 0);

            return (
              <div key={p.id} className="card">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">
                    {PET_TYPE_ICONS[p.type as keyof typeof PET_TYPE_ICONS] || '🐾'}
                  </span>
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100">{p.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {PET_TYPE_LABELS[p.type as keyof typeof PET_TYPE_LABELS] || p.type}
                    </p>
                  </div>
                </div>

                {petExpenses.length > 0 && (
                  <div className="space-y-1.5 border-t border-gray-100 dark:border-dark-border pt-3">
                    {petExpenses.map((exp) => (
                      <div key={exp.id} className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-300">{exp.title}</span>
                        <span className="font-medium">{exp.amountTotal} Kč</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm font-bold pt-1.5 border-t border-gray-100 dark:border-dark-border">
                      <span>Celkem</span>
                      <span className="text-warning-500">{totalCost} Kč/měs</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Nový mazlíček">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Typ</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="input-field">
              {Object.entries(PET_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Jméno *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field" required />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="btn-outline">Zrušit</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? 'Ukládání...' : 'Přidat'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
