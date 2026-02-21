import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import Modal from '../components/common/Modal';
import api from '../services/api';

const VEHICLE_TYPE_LABELS = { car: 'Auto', moto: 'Motorka', atv: 'Čtyřkolka' };
const VEHICLE_TYPE_ICONS = { car: '🚗', moto: '🏍️', atv: '🏎️' };

export default function VehiclesPage() {
  const { vehicles, expenses, refreshData } = useData();
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<'car' | 'moto' | 'atv'>('car');
  const [spz, setSpz] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spz || !brand) return;
    setIsSubmitting(true);
    try {
      await api.createVehicle({ type, spz, brand, model: model || undefined });
      await refreshData();
      setShowForm(false);
      setSpz(''); setBrand(''); setModel('');
    } catch (err) { console.error(err); }
    finally { setIsSubmitting(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Vozidla</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Správa vozidel a souvisejících výdajů</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">+ Přidat vozidlo</button>
      </div>

      {vehicles.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400 text-lg">Žádná vozidla</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {vehicles.map((v) => {
            const vehicleExpenses = expenses.filter((e) => e.linkedVehicleId === v.id);
            const totalCost = vehicleExpenses.reduce((sum, e) => sum + e.amountTotal, 0);

            return (
              <div key={v.id} className="card">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-2xl">
                    {VEHICLE_TYPE_ICONS[v.type as keyof typeof VEHICLE_TYPE_ICONS]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                      {v.brand} {v.model}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      SPZ: {v.spz} | {VEHICLE_TYPE_LABELS[v.type as keyof typeof VEHICLE_TYPE_LABELS]}
                    </p>
                  </div>
                </div>

                {vehicleExpenses.length > 0 && (
                  <div className="space-y-2 border-t border-gray-100 dark:border-dark-border pt-3">
                    {vehicleExpenses.map((exp) => (
                      <div key={exp.id} className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-300">{exp.title}</span>
                        <span className="font-medium text-gray-700 dark:text-gray-200">{exp.amountTotal} Kč</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm font-bold pt-2 border-t border-gray-100 dark:border-dark-border">
                      <span className="text-gray-700 dark:text-gray-200">Celkem měsíčně</span>
                      <span className="text-warning-500">{totalCost} Kč</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Nové vozidlo">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Typ vozidla</label>
            <select value={type} onChange={(e) => setType(e.target.value as 'car' | 'moto' | 'atv')} className="input-field">
              <option value="car">Auto</option>
              <option value="moto">Motorka</option>
              <option value="atv">Čtyřkolka</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Značka *</label>
              <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)} className="input-field" required />
            </div>
            <div>
              <label className="label">Model</label>
              <input type="text" value={model} onChange={(e) => setModel(e.target.value)} className="input-field" />
            </div>
          </div>
          <div>
            <label className="label">SPZ *</label>
            <input type="text" value={spz} onChange={(e) => setSpz(e.target.value)} className="input-field" placeholder="1AB 2345" required />
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
