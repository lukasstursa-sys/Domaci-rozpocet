import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Přehled', icon: '📊' },
  { id: 'expenses', label: 'Výdaje', icon: '💰' },
  { id: 'incomes', label: 'Příjmy', icon: '📈' },
  { id: 'recurring', label: 'Opakující se', icon: '🔄' },
  { id: 'templates', label: 'Šablony', icon: '📋' },
  { id: 'budget-limits', label: 'Limity', icon: '🎯' },
  { id: 'accounts', label: 'Účty', icon: '🏦' },
  { id: 'debts', label: 'Dluhy', icon: '📊' },
  { id: 'calendar', label: 'Kalendář', icon: '📅' },
  { id: 'ai-chat', label: 'AI Poradce', icon: '🤖' },
  { id: 'family', label: 'Rodina', icon: '👨‍👩‍👧‍👦' },
  { id: 'vehicles', label: 'Vozidla', icon: '🚗' },
  { id: 'pets', label: 'Zvířata', icon: '🐾' },
  { id: 'settings', label: 'Nastavení', icon: '⚙️' },
];

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const { user, logout } = useAuth();
  const { isDark, toggle } = useTheme();

  return (
    <aside className="w-64 h-screen bg-white dark:bg-dark-card border-r border-gray-100 dark:border-dark-border flex flex-col fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100 dark:border-dark-border">
        <h1 className="text-xl font-bold text-primary-500 dark:text-primary-300">
          Domácí Rozpočet
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Správce rodinných financí
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`sidebar-link w-full text-left ${
              currentPage === item.id ? 'active' : ''
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}

        {/* Admin link */}
        {user?.isSuperAdmin && (
          <>
            <div className="border-t border-gray-100 dark:border-dark-border my-3" />
            <button
              onClick={() => onNavigate('admin')}
              className={`sidebar-link w-full text-left ${
                currentPage === 'admin' ? 'active' : ''
              }`}
            >
              <span className="text-lg">⚙️</span>
              <span>Administrace</span>
            </button>
          </>
        )}
      </nav>

      {/* Bottom section */}
      <div className="p-4 border-t border-gray-100 dark:border-dark-border space-y-3">
        {/* Dark mode toggle */}
        <button
          onClick={toggle}
          className="flex items-center gap-3 w-full px-4 py-2 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <span>{isDark ? '☀️' : '🌙'}</span>
          <span>{isDark ? 'Světlý režim' : 'Tmavý režim'}</span>
        </button>

        {/* User info */}
        <div className="flex items-center gap-3 px-4 py-2">
          <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-800 flex items-center justify-center text-sm font-semibold text-primary-600 dark:text-primary-300">
            {user?.familyName?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate dark:text-gray-200">
              {user?.familyName || 'Uživatel'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user?.email}
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full px-4 py-2 text-sm text-warning-500 hover:bg-warning-50 dark:hover:bg-warning-900/30 rounded-xl transition-colors"
        >
          Odhlásit se
        </button>
      </div>
    </aside>
  );
}
