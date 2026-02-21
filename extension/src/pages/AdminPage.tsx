import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { formatCurrency } from '../utils/format';

interface AdminStats {
  totalFamilies: number;
  totalContracts: number;
  totalWellmallSaved: number;
  activeUsers: number;
}

interface Family {
  id: string;
  familyName: string;
  email: string;
  createdAt: string;
  membersCount: number;
  expensesCount: number;
}

interface GlobalCategory {
  id: string;
  name: string;
  icon: string;
  isActive: boolean;
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [families, setFamilies] = useState<Family[]>([]);
  const [categories, setCategories] = useState<GlobalCategory[]>([]);
  const [aiPrompt, setAiPrompt] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'families' | 'categories' | 'ai'>('overview');
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, familiesData, catsData, promptData] = await Promise.all([
        api.getAdminStats(),
        api.getAdminFamilies(),
        api.getGlobalCategories(),
        api.getAIPrompt(),
      ]);
      setStats(statsData);
      setFamilies(familiesData);
      setCategories(catsData);
      setAiPrompt(promptData.prompt);
    } catch (err) {
      console.error('Admin data load error:', err);
    }
  };

  const handleSavePrompt = async () => {
    setIsSaving(true);
    try {
      await api.updateAIPrompt(aiPrompt);
      alert('AI prompt uložen');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCatName) return;
    try {
      const cat = await api.createGlobalCategory({ name: newCatName, icon: newCatIcon || '📁' });
      setCategories([...categories, cat]);
      setNewCatName('');
      setNewCatIcon('');
    } catch (err) {
      console.error(err);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Přehled', icon: '📊' },
    { id: 'families', label: 'Rodiny', icon: '👨‍👩‍👧‍👦' },
    { id: 'categories', label: 'Kategorie', icon: '📁' },
    { id: 'ai', label: 'AI Prompt', icon: '🤖' },
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Administrace</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Správa systému Domácí Rozpočet
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-dark-border pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-t-xl text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-primary-500 text-white'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card text-center">
            <p className="text-3xl font-bold text-primary-500">{stats.totalFamilies}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Registrovaných rodin</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold text-secondary-500">{stats.activeUsers}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Aktivních uživatelů</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold text-gray-700 dark:text-gray-200">{stats.totalContracts}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Nahraných smluv</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold text-primary-500">{formatCurrency(stats.totalWellmallSaved)}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">WellMall objem</p>
          </div>
        </div>
      )}

      {/* Families */}
      {activeTab === 'families' && (
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
            Registrované rodiny
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-dark-border">
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Rodina</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Email</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Členů</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Výdajů</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Registrace</th>
                </tr>
              </thead>
              <tbody>
                {families.map((f) => (
                  <tr key={f.id} className="border-b border-gray-50 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-3 px-4 font-medium text-gray-700 dark:text-gray-200">{f.familyName}</td>
                    <td className="py-3 px-4 text-gray-500 dark:text-gray-400">{f.email}</td>
                    <td className="py-3 px-4 text-center">{f.membersCount}</td>
                    <td className="py-3 px-4 text-center">{f.expensesCount}</td>
                    <td className="py-3 px-4 text-gray-500 dark:text-gray-400">
                      {new Date(f.createdAt).toLocaleDateString('cs-CZ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {families.length === 0 && (
            <p className="text-center text-gray-400 py-8">Žádné registrované rodiny</p>
          )}
        </div>
      )}

      {/* Categories */}
      {activeTab === 'categories' && (
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
            Globální kategorie
          </h3>
          <div className="space-y-2 mb-6">
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{cat.icon}</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{cat.name}</span>
                </div>
                <span className={`badge ${cat.isActive ? 'badge-success' : 'badge-warning'}`}>
                  {cat.isActive ? 'Aktivní' : 'Neaktivní'}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 dark:border-dark-border pt-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">Přidat kategorii</h4>
            <div className="flex gap-3">
              <input
                type="text"
                value={newCatIcon}
                onChange={(e) => setNewCatIcon(e.target.value)}
                placeholder="Ikona"
                className="input-field w-20"
              />
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Název kategorie"
                className="input-field flex-1"
              />
              <button onClick={handleAddCategory} className="btn-primary">
                Přidat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Prompt */}
      {activeTab === 'ai' && (
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
            AI Prompt Management
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Upravte chování AI Poradce pro všechny uživatele. Změny se projeví okamžitě.
          </p>
          <textarea
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            className="input-field font-mono text-sm"
            rows={10}
          />
          <div className="flex justify-end mt-4">
            <button
              onClick={handleSavePrompt}
              disabled={isSaving}
              className="btn-primary"
            >
              {isSaving ? 'Ukládání...' : 'Uložit prompt'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
