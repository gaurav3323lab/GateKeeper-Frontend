import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Wrench, Camera, Plus, Clock, CheckCircle, AlertCircle, ChevronDown, Loader2, PenLine, Trash2 } from 'lucide-react';
import { serviceAPI } from '../services/api';

const CATEGORIES = ['Plumber', 'Electrician', 'Carpenter', 'Cleaning', 'Pest Control', 'Other'];

const STATUS_CONFIG = {
  Open: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', icon: AlertCircle },
  'In-progress': { color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30', icon: Clock },
  Resolved: { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', icon: CheckCircle },
};

const ServiceRequest = ({ user }) => {
  const { isDark } = useTheme();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: 'Plumber', description: '', photo: null });
  const [preview, setPreview] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);

  const card = isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-gray-200';
  const input = isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-gray-100 border-gray-300 text-gray-800';
  const subtext = isDark ? 'text-slate-400' : 'text-gray-500';

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await serviceAPI.getResidentRequests();
      setRequests(res.data);
    } catch (err) {
      console.error('Failed to fetch requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm({ ...form, photo: file });
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!form.description.trim()) return;
    setActionLoading(true);
    try {
      const payload = {
        category: form.category,
        description: form.description,
        photo_url: null // Placeholder for real image upload
      };

      if (editingRequest) {
        await serviceAPI.updateRequest(editingRequest, payload);
      } else {
        await serviceAPI.createRequest(payload);
      }
      
      await fetchRequests();
      setForm({ category: 'Plumber', description: '', photo: null });
      setPreview(null);
      setShowForm(false);
      setEditingRequest(null);
    } catch (err) {
      alert('Failed to save request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = (req) => {
    setEditingRequest(req.id);
    setForm({ category: req.category, description: req.description, photo: null });
    setPreview(null);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this service request?')) return;
    try {
      await serviceAPI.deleteRequest(id);
      setRequests(requests.filter(r => r.id !== id));
    } catch (err) {
      alert('Failed to delete request');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className={`border rounded-2xl p-5 ${card}`}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-base flex items-center gap-2">
            <Wrench size={18} className="text-indigo-400" /> Service Requests
          </h3>
          <button
            onClick={() => {
              setShowForm(!showForm);
              if (showForm) {
                setEditingRequest(null);
                setForm({ category: 'Plumber', description: '', photo: null });
              }
            }}
            className="flex items-center gap-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-xl font-semibold"
          >
            <Plus size={14} /> New Request
          </button>
        </div>
        <p className={`text-xs ${subtext}`}>Report any maintenance issues in your home</p>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          {['Open', 'In-progress', 'Resolved'].map(s => {
            const cfg = STATUS_CONFIG[s];
            const count = requests.filter(r => r.status === s).length;
            return (
              <div key={s} className={`p-3 rounded-xl border text-center ${cfg.bg}`}>
                <p className={`text-xl font-bold ${cfg.color}`}>{count}</p>
                <p className={`text-xs ${subtext}`}>{s}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* New/Edit Request Form */}
      {showForm && (
        <div className={`border rounded-2xl p-5 ${card}`}>
          <h4 className="font-semibold mb-4">{editingRequest ? 'Edit Service Request' : 'Register a New Complaint'}</h4>
          <div className="space-y-3">
            <div>
              <label className={`text-xs font-semibold mb-1 block ${subtext}`}>Category</label>
              <div className={`relative flex items-center border rounded-xl px-3 py-2.5 ${input}`}>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  className="bg-transparent w-full outline-none text-sm appearance-none"
                >
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
                <ChevronDown size={14} className={`absolute right-3 ${subtext}`} />
              </div>
            </div>

            <div>
              <label className={`text-xs font-semibold mb-1 block ${subtext}`}>Problem Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="e.g. Kitchen pipe is leaking since morning..."
                rows={3}
                className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none resize-none ${input}`}
              />
            </div>

            {/* Photo Upload */}
            <div>
              <label className={`text-xs font-semibold mb-1 block ${subtext}`}>Photo (Optional)</label>
              <label className={`flex items-center justify-center gap-2 border-2 border-dashed rounded-xl p-4 cursor-pointer transition-all
                ${isDark ? 'border-slate-600 hover:border-indigo-500 text-slate-400' : 'border-gray-300 hover:border-indigo-400 text-gray-400'}`}>
                <Camera size={20} />
                <span className="text-sm">{form.photo ? form.photo.name : 'Take or upload a photo'}</span>
                <input type="file" accept="image/*" capture="environment" onChange={handlePhotoChange} className="hidden" />
              </label>
              {preview && (
                <img src={preview} alt="Preview" className="mt-2 w-full h-32 object-cover rounded-xl" />
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={handleSubmit} disabled={actionLoading} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                {actionLoading ? <Loader2 className="animate-spin" size={18} /> : (editingRequest ? 'Update Request 🔧' : 'Submit Request 🔧')}
              </button>
              <button onClick={() => { setShowForm(false); setPreview(null); }}
                className={`flex-1 py-2.5 rounded-xl text-sm border font-semibold ${isDark ? 'border-slate-600 text-slate-400' : 'border-gray-300 text-gray-500'}`}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Requests List */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-indigo-500" size={32} />
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(r => {
            const cfg = STATUS_CONFIG[r.status];
            const Icon = cfg.icon;
            return (
              <div key={r.id} className={`border rounded-2xl p-4 ${card}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}>
                      <Wrench size={18} className="text-indigo-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{r.category}</p>
                      <p className={`text-xs ${subtext}`}>{new Date(r.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.color}`}>
                    <Icon size={11} /> {r.status}
                  </span>
                </div>
                <p className={`mt-3 text-sm leading-relaxed ${subtext}`}>{r.description}</p>
                <div className="flex justify-end mt-2 pt-2 border-t border-gray-500/20">
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleEdit(r)} className="text-indigo-400 hover:text-indigo-300 p-1 rounded-lg">
                      <PenLine size={16} />
                    </button>
                    <button onClick={() => handleDelete(r.id)} className="text-red-400 hover:text-red-300 p-1 rounded-lg">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ServiceRequest;
