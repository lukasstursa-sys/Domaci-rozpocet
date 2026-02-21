import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';
import api from '../services/api';
import { formatMonth } from '../utils/format';

export default function SettingsPage() {
  const { user } = useAuth();
  const { currentMonth, currentYear } = useData();
  const { isDark, toggle } = useTheme();
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [message, setMessage] = useState('');

  const handleExportCSV = async (type: 'expenses' | 'incomes') => {
    setIsExporting(true);
    try {
      const blob = await api.exportCSV(type, currentMonth, currentYear);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type === 'expenses' ? 'vydaje' : 'prijmy'}-${currentYear}-${String(currentMonth).padStart(2, '0')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage(`CSV ${type === 'expenses' ? 'výdajů' : 'příjmů'} stažen`);
    } catch (err) {
      setMessage('Chyba při exportu');
    } finally {
      setIsExporting(false);
    }
  };

  const handleBackup = async () => {
    setIsExporting(true);
    try {
      const blob = await api.exportBackup();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rozpocet-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage('Záloha úspěšně stažena');
    } catch (err) {
      setMessage('Chyba při záloze');
    } finally {
      setIsExporting(false);
    }
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsRestoring(true);
    try {
      const text = await file.text();
      const backup = JSON.parse(text);
      const result = await api.restoreBackup(backup.data);
      setMessage(`Obnoveno ${result.count} záznamů`);
    } catch (err) {
      setMessage('Chyba při obnově - neplatný soubor');
    } finally {
      setIsRestoring(false);
      e.target.value = '';
    }
  };

  const handleWellmallReport = async () => {
    setIsExporting(true);
    try {
      const blob = await api.generateWellmallReport(currentMonth, currentYear);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wellmall-report-${currentYear}-${String(currentMonth).padStart(2, '0')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage('WellMall PDF report stažen');
    } catch (err) {
      setMessage('Chyba při generování reportu');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Nastavení</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Export dat, zálohy a konfigurace
        </p>
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-xl text-sm ${
          message.includes('Chyba')
            ? 'bg-warning-50 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300'
            : 'bg-secondary-50 dark:bg-secondary-900/30 text-secondary-700 dark:text-secondary-300'
        }`}>
          {message}
        </div>
      )}

      {/* User info */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
          Profil
        </h3>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-800 flex items-center justify-center text-2xl font-bold text-primary-600 dark:text-primary-300">
            {user?.familyName?.charAt(0) || 'U'}
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {user?.familyName}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
            {user?.isSuperAdmin && (
              <span className="badge-info mt-1">Administrátor</span>
            )}
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
          Vzhled
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Tmavý režim</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Přepnout světlý/tmavý motiv</p>
          </div>
          <button
            onClick={toggle}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              isDark ? 'bg-primary-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                isDark ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Export */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
          Export dat ({formatMonth(currentMonth, currentYear)})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => handleExportCSV('expenses')}
            disabled={isExporting}
            className="btn-outline text-sm"
          >
            Exportovat výdaje (CSV)
          </button>
          <button
            onClick={() => handleExportCSV('incomes')}
            disabled={isExporting}
            className="btn-outline text-sm"
          >
            Exportovat příjmy (CSV)
          </button>
          <button
            onClick={handleWellmallReport}
            disabled={isExporting}
            className="btn-primary text-sm"
          >
            WellMall report (PDF)
          </button>
        </div>
      </div>

      {/* Backup & Restore */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
          Záloha a obnova
        </h3>
        <div className="space-y-3">
          <button
            onClick={handleBackup}
            disabled={isExporting}
            className="btn-secondary text-sm w-full sm:w-auto"
          >
            Stáhnout zálohu (JSON)
          </button>

          <div>
            <label className="label">Obnovit ze zálohy</label>
            <input
              type="file"
              accept=".json"
              onChange={handleRestore}
              disabled={isRestoring}
              className="input-field text-sm"
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Nahrajte soubor .json vytvořený funkcí zálohy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
