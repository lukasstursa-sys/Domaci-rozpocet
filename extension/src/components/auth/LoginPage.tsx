import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginPage() {
  const { login, register, error, clearError, isLoading } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [familyName, setFamilyName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      if (isRegister) {
        await register(email, password, familyName);
      } else {
        await login(email, password);
      }
    } catch {
      // Error is handled in context
    }
  };

  return (
    <div className="min-h-screen bg-surface-light dark:bg-dark-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-soft">
            <span className="text-2xl text-white font-bold">DR</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Domácí Rozpočet
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Cesta z krysího závodu k finanční svobodě
          </p>
        </div>

        {/* Form */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-6">
            {isRegister ? 'Registrace rodiny' : 'Přihlášení'}
          </h2>

          {error && (
            <div className="bg-warning-50 dark:bg-warning-900/30 border border-warning-200 dark:border-warning-800 text-warning-700 dark:text-warning-300 px-4 py-3 rounded-xl text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="label">Název rodiny</label>
                <input
                  type="text"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  className="input-field"
                  placeholder="Např. Novákovi"
                  required={isRegister}
                />
              </div>
            )}

            <div>
              <label className="label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="rodina@email.cz"
                required
              />
            </div>

            <div>
              <label className="label">Heslo</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="Zadejte heslo"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full disabled:opacity-50"
            >
              {isLoading
                ? 'Načítání...'
                : isRegister
                ? 'Zaregistrovat rodinu'
                : 'Přihlásit se'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setIsRegister(!isRegister); clearError(); }}
              className="text-sm text-primary-500 hover:text-primary-600 dark:text-primary-300"
            >
              {isRegister
                ? 'Už máte účet? Přihlaste se'
                : 'Nemáte účet? Zaregistrujte se'}
            </button>
          </div>

          {/* Test credentials hint */}
          <div className="mt-6 border-t border-gray-100 dark:border-dark-border pt-4">
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
              Testovací přihlášení:
            </p>
            <div className="flex justify-center gap-4 mt-2">
              <button
                type="button"
                onClick={() => { setEmail('rodina@test.cz'); setPassword('Heslo123'); setIsRegister(false); }}
                className="text-xs text-primary-500 hover:underline"
              >
                Uživatel
              </button>
              <button
                type="button"
                onClick={() => { setEmail('admin@wellmall.cz'); setPassword('AdminStart2026'); setIsRegister(false); }}
                className="text-xs text-primary-500 hover:underline"
              >
                Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
