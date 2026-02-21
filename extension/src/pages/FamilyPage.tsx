import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import Modal from '../components/common/Modal';
import api from '../services/api';
import type { FamilyMember } from '../types';

export default function FamilyPage() {
  const { familyMembers, refreshData } = useData();
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState<'parent' | 'child'>('parent');
  const [birthdate, setBirthdate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openCreateForm = () => {
    setEditingMember(null);
    setName('');
    setRole('parent');
    setBirthdate('');
    setShowForm(true);
  };

  const openEditForm = (member: FamilyMember) => {
    setEditingMember(member);
    setName(member.name);
    setRole(member.role);
    setBirthdate(member.birthdate ? member.birthdate.split('T')[0] : '');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingMember(null);
    setName('');
    setBirthdate('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setIsSubmitting(true);
    try {
      const data = { name, role, birthdate: birthdate || undefined };
      if (editingMember) {
        await api.updateFamilyMember(editingMember.id, data);
      } else {
        await api.createFamilyMember(data);
      }
      await refreshData();
      closeForm();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (member: FamilyMember) => {
    if (!confirm(`Opravdu chcete smazat člena "${member.name}"?`)) return;
    try {
      await api.deleteFamilyMember(member.id);
      await refreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const parents = familyMembers.filter((m) => m.role === 'parent');
  const children = familyMembers.filter((m) => m.role === 'child');

  const renderMemberCard = (m: FamilyMember, colorScheme: 'primary' | 'secondary') => (
    <div key={m.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 group">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-full bg-${colorScheme}-100 dark:bg-${colorScheme}-800 flex items-center justify-center text-xl font-bold text-${colorScheme}-600 dark:text-${colorScheme}-300`}>
          {m.name.charAt(0)}
        </div>
        <div>
          <p className="font-medium text-gray-700 dark:text-gray-200">{m.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {m.birthdate ? `Nar. ${new Date(m.birthdate).toLocaleDateString('cs-CZ')}` : m.role === 'parent' ? 'Rodič' : 'Dítě'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => openEditForm(m)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-primary-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Upravit"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={() => handleDelete(m)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          title="Smazat"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Rodina</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Správa členů rodiny</p>
        </div>
        <button onClick={openCreateForm} className="btn-primary">
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
            {parents.map((m) => renderMemberCard(m, 'primary'))}
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
            {children.map((m) => renderMemberCard(m, 'secondary'))}
          </div>
        )}
      </div>

      <Modal isOpen={showForm} onClose={closeForm} title={editingMember ? 'Upravit člena rodiny' : 'Nový člen rodiny'}>
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
            <button type="button" onClick={closeForm} className="btn-outline">Zrušit</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? 'Ukládání...' : editingMember ? 'Uložit změny' : 'Přidat'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
