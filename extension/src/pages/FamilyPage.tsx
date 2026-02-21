import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import Modal from '../components/common/Modal';
import api from '../services/api';

export default function FamilyPage() {
  const { familyMembers, refreshData } = useData();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState<'parent' | 'child'>('parent');
  const [birthdate, setBirthdate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setIsSubmitting(true);
    try {
      await api.createFamilyMember({ name, role, birthdate: birthdate || undefined });
      await refreshData();
      setShowForm(false);
      setName('');
      setBirthdate('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const parents = familyMembers.filter((m) => m.role === 'parent');
  const children = familyMembers.filter((m) => m.role === 'child');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Rodina</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Správa členů rodiny</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          + Přidat člena
        </button>
      </div>

      {/* Parents */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
          Rodiče
        </h3>
        {parents.length === 0 ? (
          <p className="text-gray-400 text-center py-4">Žádní rodiče</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {parents.map((m) => (
              <div key={m.id} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-800 flex items-center justify-center text-xl font-bold text-primary-600 dark:text-primary-300">
                  {m.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-200">{m.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {m.birthdate ? new Date(m.birthdate).toLocaleDateString('cs-CZ') : 'Rodič'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Children */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
          Děti
        </h3>
        {children.length === 0 ? (
          <p className="text-gray-400 text-center py-4">Žádné děti</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {children.map((m) => (
              <div key={m.id} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                <div className="w-12 h-12 rounded-full bg-secondary-100 dark:bg-secondary-800 flex items-center justify-center text-xl font-bold text-secondary-600 dark:text-secondary-300">
                  {m.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-200">{m.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {m.birthdate ? `Nar. ${new Date(m.birthdate).toLocaleDateString('cs-CZ')}` : 'Dítě'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Nový člen rodiny">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Jméno *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field" required />
          </div>
          <div>
            <label className="label">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value as 'parent' | 'child')} className="input-field">
              <option value="parent">Rodič</option>
              <option value="child">Dítě</option>
            </select>
          </div>
          <div>
            <label className="label">Datum narození</label>
            <input type="date" value={birthdate} onChange={(e) => setBirthdate(e.target.value)} className="input-field" />
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
