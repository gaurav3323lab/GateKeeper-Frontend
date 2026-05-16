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

  const card = isDark ? 'bg-slate-800/70 border-slate-700' : 'bg-white border-gray-200';
  const input = isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-gray-100 border-gray-300 text-gray-800';
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
        <Loader2 className="animate-spin text-indigo-500 mb-2" size={32} />
        <p className={subtext}>Loading your garage...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-indigo-400">
            My Garage
          </h2>
          <p className={`text-xs mt-0.5 ${subtext}`}>Manage your registered vehicles</p>
        </div>
        <button onClick={() => { 
            setShowForm(!showForm); 
            if (showForm) {
              setEditingVehicle(null);
              setForm({ number: '', type: 'Car / SUV (4-Wheeler)', brand: 'Select Brand' });
            }
            setError(''); 
          }}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg">
          {showForm ? <X size={15} /> : <Plus size={15} />}
          {showForm ? 'Cancel' : 'Add Vehicle'}
        </button>
      </div>

      {/* Add/Edit Vehicle Form */}
      {showForm && (
        <div className={`border rounded-2xl p-5 space-y-4 ${isDark ? 'bg-emerald-900/20 border-emerald-700/40' : 'bg-emerald-50 border-emerald-200'}`}>
          <h3 className="font-bold text-sm text-emerald-400">🚗 {editingVehicle ? 'Edit Vehicle' : 'Register a New Vehicle'}</h3>
          <div>
            <label className={`text-xs font-semibold mb-1.5 block ${subtext}`}>Number Plate *</label>
            <input
              name="number" value={form.number}
              onChange={e => { setForm({ ...form, number: e.target.value }); setError(''); }}
              placeholder="e.g. MH 12 AB 1234"
              className={`w-full border rounded-xl px-4 py-3 text-sm font-mono font-bold uppercase tracking-widest outline-none focus:border-emerald-500 ${input}`}
            />
          </div>
          <div>
            <label className={`text-xs font-semibold mb-1.5 block ${subtext}`}>Vehicle Brand *</label>
            <div className={`relative flex items-center border rounded-xl px-4 py-3 ${input}`}>
              <select name="brand" value={form.brand}
                onChange={e => { setForm({ ...form, brand: e.target.value }); setError(''); }}
                className="bg-transparent w-full outline-none text-sm appearance-none cursor-pointer">
                {CAR_BRANDS.map(b => <option key={b} disabled={b === 'Select Brand'}>{b}</option>)}
              </select>
              <ChevronDown size={14} className={`absolute right-3 pointer-events-none ${subtext}`} />
            </div>
          </div>
          <div>
            <label className={`text-xs font-semibold mb-1.5 block ${subtext}`}>Vehicle Type *</label>
            <div className={`relative flex items-center border rounded-xl px-4 py-3 ${input}`}>
              <select name="type" value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}
                className="bg-transparent w-full outline-none text-sm appearance-none cursor-pointer">
                {VEHICLE_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
              <ChevronDown size={14} className={`absolute right-3 pointer-events-none ${subtext}`} />
            </div>
          </div>
          {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">⚠️ {error}</div>}
          <button onClick={handleAddOrEdit} disabled={actionLoading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2">
            {actionLoading ? <Loader2 className="animate-spin" size={18} /> : (editingVehicle ? '✅ Update Vehicle' : '✅ Register Vehicle')}
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total', value: vehicles.length, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
          { label: 'Inside', value: vehicles.filter(v => v.status === 'Inside').length, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Outside', value: vehicles.filter(v => v.status === 'Outside').length, color: 'text-red-400', bg: 'bg-red-500/10' },
        ].map(s => (
          <div key={s.label} className={`border rounded-2xl p-3 text-center ${s.bg} ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className={`text-xs ${subtext}`}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Vehicle List */}
      <div className={`border rounded-2xl p-5 ${card}`}>
        <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
          <Car size={16} className="text-indigo-400" /> Registered Vehicles
        </h3>
        {vehicles.length === 0 ? (
          <div className={`text-center py-10 ${subtext}`}>
            <Car size={40} className="mx-auto mb-3 opacity-20" />
            <p className="font-semibold">No vehicles registered</p>
          </div>
        ) : (
          <div className="space-y-3">
            {vehicles.map(v => (
              <div key={v.id} className={`flex items-center justify-between p-4 rounded-xl border ${isDark ? 'bg-slate-700/40 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-500/20">
                    <Car size={18} className="text-indigo-400" />
                  </div>
                  <div>
                    <p className="font-bold text-sm tracking-widest font-mono">{v.vehicle_number}</p>
                    <p className={`text-xs font-semibold ${subtext}`}>{v.brand} &bull; {v.type}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${v.status === 'Inside' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-red-500/15 text-red-400 border-red-500/30'}`}>
                    {v.status === 'Inside' ? '✅ Inside' : '🔴 Outside'}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <button onClick={() => handleEdit(v)} className="text-indigo-400 hover:text-indigo-300 p-1">
                      <PenLine size={14} />
                    </button>
                    <button onClick={() => handleRemove(v.id)} className="text-red-400 hover:text-red-300 p-1">
                      <Trash2 size={14} />
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
