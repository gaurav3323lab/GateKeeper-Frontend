import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import ISTClock from './ISTClock';
import { Car, Plus, Trash2, ChevronDown, X, Loader2, PenLine } from 'lucide-react';
import { vehicleAPI } from '../services/api';

const VEHICLE_TYPES = ['Car / SUV (4-Wheeler)', 'Bike / Scooter (2-Wheeler)', 'Auto Rickshaw', 'Other'];

const CAR_BRANDS = [
  'Select Brand', 'Maruti Suzuki', 'Hyundai', 'Tata', 'Honda', 'Toyota',
  'Kia', 'MG', 'Mahindra', 'Volkswagen', 'Skoda', 'Renault',
  'Royal Enfield', 'Bajaj', 'Hero', 'TVS', 'Honda (Bike)', 'Yamaha', 'Suzuki (Bike)', 'Other'
];

const ResidentGarage = () => {
  const { isDark } = useTheme();

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ number: '', type: 'Car / SUV (4-Wheeler)', brand: 'Select Brand' });
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);

  const card = isDark ? 'glass-panel text-white' : 'glass-card-light text-slate-800';
  const input = isDark ? 'bg-slate-950/65 border-slate-800 text-white placeholder-slate-500 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all duration-300' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all duration-300 shadow-sm';
  const subtext = isDark ? 'text-slate-400' : 'text-gray-500';

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const res = await vehicleAPI.getVehicles();
      setVehicles(res.data);
    } catch (err) {
      console.error('Failed to fetch vehicles:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddOrEdit = async () => {
    const plate = form.number.trim().toUpperCase();
    if (!plate) return setError('Number plate cannot be empty.');
    if (plate.length < 4) return setError('Please enter a valid number plate.');
    if (form.brand === 'Select Brand') return setError('Please select a vehicle brand.');

    setActionLoading(true);
    try {
      if (editingVehicle) {
        await vehicleAPI.updateVehicle(editingVehicle, {
          vehicle_number: plate,
          type: form.type,
          brand: form.brand
        });
      } else {
        await vehicleAPI.addVehicle({
          vehicle_number: plate,
          type: form.type,
          brand: form.brand
        });
      }
      await fetchVehicles();
      setForm({ number: '', type: 'Car / SUV (4-Wheeler)', brand: 'Select Brand' });
      setShowForm(false);
      setEditingVehicle(null);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save vehicle');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle.id);
    setForm({ number: vehicle.vehicle_number, type: vehicle.type, brand: vehicle.brand });
    setShowForm(true);
    setError('');
  };

  const handleRemove = async (id) => {
    if (!window.confirm('Are you sure you want to remove this vehicle?')) return;
    try {
      await vehicleAPI.removeVehicle(id);
      setVehicles(vehicles.filter(v => v.id !== id));
    } catch (err) {
      alert('Failed to remove vehicle');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="animate-spin text-emerald-500 mb-2" size={32} />
        <p className={subtext}>Loading your garage...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black font-heading bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-indigo-400">
            My Garage
          </h2>
          <p className={`text-xs mt-0.5 ${subtext}`}>Manage flat-registered vehicles</p>
        </div>
        <button onClick={() => { 
            setShowForm(!showForm); 
            if (showForm) {
              setEditingVehicle(null);
              setForm({ number: '', type: 'Car / SUV (4-Wheeler)', brand: 'Select Brand' });
            }
            setError(''); 
          }}
          className="flex items-center gap-1.5 bg-gradient-to-tr from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 hover:shadow-lg hover:shadow-emerald-500/25 active:scale-95 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md">
          {showForm ? <X size={14} /> : <Plus size={14} />}
          <span>{showForm ? 'Cancel' : 'Add Vehicle'}</span>
        </button>
      </div>

      {/* Add/Edit Vehicle Form */}
      {showForm && (
        <div className={`p-6 rounded-[28px] border space-y-4.5 animate-scale-up ${isDark ? 'bg-emerald-950/15 border-emerald-500/20' : 'bg-emerald-50/50 border-emerald-200'}`}>
          <h3 className="font-extrabold text-sm text-emerald-500 flex items-center gap-2">
            <span>🚗</span>
            <span>{editingVehicle ? 'Edit Registered Vehicle' : 'Register a New Vehicle'}</span>
          </h3>
          <div className="space-y-1">
            <label className={`text-[10px] font-bold uppercase tracking-wider block ${subtext}`}>Number Plate *</label>
            <input
              name="number" value={form.number}
              onChange={e => { setForm({ ...form, number: e.target.value }); setError(''); }}
              placeholder="e.g. MH 12 AB 1234"
              className={`w-full border rounded-xl px-4 py-3 text-sm font-mono font-bold uppercase tracking-widest outline-none ${input}`}
            />
          </div>
          <div className="space-y-1">
            <label className={`text-[10px] font-bold uppercase tracking-wider block ${subtext}`}>Vehicle Brand *</label>
            <div className={`relative flex items-center border rounded-xl px-4 py-3 ${input}`}>
              <select name="brand" value={form.brand}
                onChange={e => { setForm({ ...form, brand: e.target.value }); setError(''); }}
                className="bg-transparent w-full outline-none text-xs appearance-none cursor-pointer font-bold">
                {CAR_BRANDS.map(b => <option key={b} disabled={b === 'Select Brand'}>{b}</option>)}
              </select>
              <ChevronDown size={14} className={`absolute right-3 pointer-events-none ${subtext}`} />
            </div>
          </div>
          <div className="space-y-1">
            <label className={`text-[10px] font-bold uppercase tracking-wider block ${subtext}`}>Vehicle Type *</label>
            <div className={`relative flex items-center border rounded-xl px-4 py-3 ${input}`}>
              <select name="type" value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}
                className="bg-transparent w-full outline-none text-xs appearance-none cursor-pointer font-bold">
                {VEHICLE_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
              <ChevronDown size={14} className={`absolute right-3 pointer-events-none ${subtext}`} />
            </div>
          </div>
          {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold">⚠️ {error}</div>}
          <button onClick={handleAddOrEdit} disabled={actionLoading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-600/20 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2">
            {actionLoading ? <Loader2 className="animate-spin" size={16} /> : (editingVehicle ? 'Update Vehicle' : 'Register Vehicle')}
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total', value: vehicles.length, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/15' },
          { label: 'Inside', value: vehicles.filter(v => v.status === 'Inside').length, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/15' },
          { label: 'Outside', value: vehicles.filter(v => v.status === 'Outside').length, color: 'text-rose-450 dark:text-rose-400', bg: 'bg-rose-500/10 border-rose-500/15' },
        ].map(s => (
          <div key={s.label} className={`border rounded-[22px] p-3 text-center transition-all duration-300 hover:scale-[1.02] ${s.bg} ${isDark ? 'border-slate-800' : 'border-slate-100 shadow-sm'}`}>
            <p className={`text-2xl font-black leading-none ${s.color}`}>{s.value}</p>
            <p className={`text-[10px] font-extrabold uppercase tracking-wider mt-1 ${subtext}`}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Vehicle List */}
      <div className={`p-6 transition-all duration-300 hover:shadow-lg ${card}`}>
        <h3 className="font-extrabold text-base mb-5 flex items-center gap-2 font-heading">
          <Car size={20} className="text-indigo-400" /> Registered Vehicles
        </h3>
        {vehicles.length === 0 ? (
          <div className={`text-center py-10 ${subtext}`}>
            <Car size={44} className="mx-auto mb-3 opacity-20 text-slate-400" />
            <p className="font-bold text-sm">No vehicles registered yet</p>
            <p className="text-[10px] mt-0.5">Register flat cars/bikes for secure RFID scan gate access</p>
          </div>
        ) : (
          <div className="space-y-4">
            {vehicles.map(v => (
              <div key={v.id} className={`flex items-center justify-between p-4 rounded-[24px] border transition-all duration-300 hover:scale-[1.01] ${
                isDark 
                  ? 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700' 
                  : 'bg-slate-50/65 border-slate-200/80 shadow-sm hover:border-slate-300'
              }`}>
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-indigo-500/10 border border-indigo-500/15 shadow-sm text-indigo-400 shrink-0">
                    <Car size={22} />
                  </div>
                  <div>
                    <p className="font-mono text-sm font-black tracking-widest text-slate-800 dark:text-slate-100 leading-snug">{v.vehicle_number}</p>
                    <p className={`text-[10px] font-bold ${subtext} mt-0.5`}>{v.brand} &bull; {v.type}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2.5">
                  <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border shadow-sm flex items-center gap-1.5 ${
                    v.status === 'Inside' 
                      ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20' 
                      : 'bg-rose-500/10 text-rose-500 dark:text-rose-450 border-rose-500/20'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${v.status === 'Inside' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                    <span>{v.status === 'Inside' ? 'Inside' : 'Outside'}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleEdit(v)} className="text-indigo-400 hover:text-indigo-300 p-1.5 hover:bg-indigo-500/10 rounded-lg transition-colors">
                      <PenLine size={13} />
                    </button>
                    <button onClick={() => handleRemove(v.id)} className="text-red-400 hover:text-red-300 p-1.5 hover:bg-red-500/10 rounded-lg transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResidentGarage;
