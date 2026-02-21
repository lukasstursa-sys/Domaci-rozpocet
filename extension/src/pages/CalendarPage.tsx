import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import MonthSelector from '../components/common/MonthSelector';
import Modal from '../components/common/Modal';
import { formatCurrency, getMonthName } from '../utils/format';
import type { CalendarEvent } from '../types';
import api from '../services/api';

export default function CalendarPage() {
  const { calendarEvents, expenses, currentMonth, currentYear, refreshData } = useData();
  const [view, setView] = useState<'month' | 'list'>('month');
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formType, setFormType] = useState<string>('custom');
  const [formIsAlert, setFormIsAlert] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Build calendar grid
  const firstDay = new Date(currentYear, currentMonth - 1, 1);
  const lastDay = new Date(currentYear, currentMonth, 0);
  const daysInMonth = lastDay.getDate();
  const startDow = (firstDay.getDay() + 6) % 7; // Monday = 0

  const days: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const getEventsForDay = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return calendarEvents.filter((e) => e.date === dateStr);
  };

  // Upcoming expirations from expenses
  const now = new Date();
  const ninetyDays = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  const expiringContracts = expenses
    .filter((e) => e.contractEndDate && new Date(e.contractEndDate) <= ninetyDays && new Date(e.contractEndDate) >= now)
    .sort((a, b) => new Date(a.contractEndDate!).getTime() - new Date(b.contractEndDate!).getTime());

  const today = new Date();
  const isToday = (day: number) =>
    day === today.getDate() &&
    currentMonth === today.getMonth() + 1 &&
    currentYear === today.getFullYear();

  const openCreateForm = (day?: number) => {
    setEditingEvent(null);
    setFormTitle('');
    setFormDescription('');
    setFormDate(day
      ? `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      : `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`
    );
    setFormType('custom');
    setFormIsAlert(false);
    setShowForm(true);
  };

  const openEditForm = (event: CalendarEvent) => {
    setEditingEvent(event);
    setFormTitle(event.title);
    setFormDescription(event.description || '');
    setFormDate(event.date);
    setFormType(event.type || 'custom');
    setFormIsAlert(event.isAlert || false);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingEvent(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formDate) return;
    setIsSubmitting(true);
    try {
      const data = {
        title: formTitle,
        description: formDescription || undefined,
        date: formDate,
        type: formType,
        isAlert: formIsAlert,
      };
      if (editingEvent) {
        await api.updateCalendarEvent(editingEvent.id, data);
      } else {
        await api.createCalendarEvent(data);
      }
      closeForm();
      await refreshData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (event: CalendarEvent) => {
    if (!confirm(`Opravdu chcete smazat událost "${event.title}"?`)) return;
    try {
      await api.deleteCalendarEvent(event.id);
      await refreshData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Kalendář</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Timeline splatností a expirací
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-dark-border">
            <button
              onClick={() => setView('month')}
              className={`px-3 py-1.5 text-sm ${view === 'month' ? 'bg-primary-500 text-white' : 'bg-white dark:bg-dark-card text-gray-600 dark:text-gray-300'}`}
            >
              Měsíc
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-3 py-1.5 text-sm ${view === 'list' ? 'bg-primary-500 text-white' : 'bg-white dark:bg-dark-card text-gray-600 dark:text-gray-300'}`}
            >
              Seznam
            </button>
          </div>
          <MonthSelector />
          <button onClick={() => openCreateForm()} className="btn-primary">
            + Událost
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 card">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 capitalize">
            {getMonthName(currentMonth)} {currentYear}
          </h3>

          {view === 'month' ? (
            <>
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'].map((d) => (
                  <div key={d} className="text-center text-xs font-medium text-gray-400 dark:text-gray-500 py-2">
                    {d}
                  </div>
                ))}
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-1">
                {days.map((day, idx) => {
                  if (day === null) {
                    return <div key={`empty-${idx}`} className="h-20" />;
                  }

                  const dayEvents = getEventsForDay(day);
                  const hasDue = dayEvents.some((e) => e.type === 'due_date');
                  const hasExpiration = dayEvents.some((e) => e.type === 'expiration');
                  const hasCustom = dayEvents.some((e) => e.type === 'custom');

                  return (
                    <div
                      key={day}
                      onClick={() => openCreateForm(day)}
                      className={`h-20 rounded-lg p-1.5 border transition-colors cursor-pointer ${
                        isToday(day)
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-100 dark:border-dark-border hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <span className={`text-xs font-medium ${
                        isToday(day) ? 'text-primary-600 dark:text-primary-300' : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {day}
                      </span>
                      <div className="mt-1 space-y-0.5">
                        {hasDue && (
                          <div className="text-[9px] bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 rounded px-1 truncate">
                            Splatnost
                          </div>
                        )}
                        {hasExpiration && (
                          <div className="text-[9px] bg-warning-100 dark:bg-warning-900/40 text-warning-700 dark:text-warning-300 rounded px-1 truncate">
                            Expirace
                          </div>
                        )}
                        {hasCustom && (
                          <div className="text-[9px] bg-secondary-100 dark:bg-secondary-900/40 text-secondary-700 dark:text-secondary-300 rounded px-1 truncate">
                            Událost
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            /* List view */
            <div className="space-y-2">
              {calendarEvents.length === 0 ? (
                <p className="text-gray-400 text-center py-8">Žádné události tento měsíc</p>
              ) : (
                calendarEvents
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map((event) => (
                    <div key={event.id} className={`flex items-center gap-3 p-3 rounded-xl group ${
                      event.isAlert
                        ? 'bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800'
                        : 'bg-gray-50 dark:bg-gray-800/50'
                    }`}>
                      <span className="text-lg">
                        {event.type === 'due_date' ? '💳' : event.type === 'expiration' ? '⚠️' : '📌'}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{event.title}</p>
                        {event.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">{event.description}</p>
                        )}
                      </div>
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {new Date(event.date).toLocaleDateString('cs-CZ')}
                      </span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          onClick={() => openEditForm(event)}
                          className="text-gray-400 hover:text-primary-500 w-7 h-7 rounded-lg flex items-center justify-center hover:bg-primary-50 dark:hover:bg-primary-900/30"
                          title="Upravit"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(event)}
                          className="text-gray-400 hover:text-warning-500 w-7 h-7 rounded-lg flex items-center justify-center hover:bg-warning-50 dark:hover:bg-warning-900/30"
                          title="Smazat"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          )}
        </div>

        {/* Upcoming Expirations */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
            Blížící se expirace
          </h3>
          {expiringContracts.length === 0 ? (
            <p className="text-gray-400 dark:text-gray-500 text-center py-8 text-sm">
              Žádné blížící se expirace
            </p>
          ) : (
            <div className="space-y-3">
              {expiringContracts.map((exp) => {
                const endDate = new Date(exp.contractEndDate!);
                const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                return (
                  <div
                    key={exp.id}
                    className={`p-3 rounded-xl border ${
                      daysLeft <= 30
                        ? 'bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800'
                        : 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800'
                    }`}
                  >
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      {exp.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {exp.providerName}
                    </p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs font-medium text-warning-600 dark:text-warning-400">
                        za {daysLeft} dní
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {endDate.toLocaleDateString('cs-CZ')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Event Modal */}
      <Modal isOpen={showForm} onClose={closeForm} title={editingEvent ? 'Upravit událost' : 'Nová událost'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Název *</label>
            <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} className="input-field" placeholder="Název události" required />
          </div>
          <div>
            <label className="label">Popis</label>
            <textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} className="input-field" rows={2} placeholder="Volitelný popis..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Datum *</label>
              <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} className="input-field" required />
            </div>
            <div>
              <label className="label">Typ</label>
              <select value={formType} onChange={(e) => setFormType(e.target.value)} className="input-field">
                <option value="custom">Vlastní</option>
                <option value="due_date">Splatnost</option>
                <option value="expiration">Expirace</option>
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={formIsAlert} onChange={(e) => setFormIsAlert(e.target.checked)} className="w-4 h-4 accent-primary-500" />
            <span className="text-sm text-gray-600 dark:text-gray-300">Upozornění</span>
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={closeForm} className="btn-outline">Zrušit</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? 'Ukládání...' : editingEvent ? 'Uložit změny' : 'Vytvořit'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
