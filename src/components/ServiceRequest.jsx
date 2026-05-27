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

  const card = isDark ? 'glass-panel text-white' : 'glass-card-light text-slate-800';
  const input = isDark ? 'bg-slate-950/65 border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all duration-300' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all duration-300 shadow-sm';
  const subtext = isDark ? 'text-slate-400' : 'text-slate-500';

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
    <div className="space-y-6 animate-slide-up">
      {/* Header Card */}
      <div className={`p-6 transition-all duration-300 hover:shadow-lg ${card}`}>
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="font-extrabold text-base flex items-center gap-2 font-heading">
            <Wrench size={20} className="text-indigo-400" /> Service Helpdesk
          </h3>
          <button
            onClick={() => {
              setShowForm(!showForm);
              if (showForm) {
                setEditingRequest(null);
                setForm({ category: 'Plumber', description: '', photo: null });
              }
            }}
            className="flex items-center gap-1 text-xs bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-600/25 active:scale-95 text-white px-3.5 py-2.5 rounded-xl font-black uppercase tracking-wider transition-all"
          >
            {showForm ? <X size={13} /> : <Plus size={13} />}
            <span>{showForm ? 'Cancel' : 'New Ticket'}</span>
          </button>
        </div>
        <p className={`text-xs ${subtext}`}>Raise complaints & house maintenance issues</p>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          {['Open', 'In-progress', 'Resolved'].map(s => {
            const cfg = STATUS_CONFIG[s];
            const count = requests.filter(r => r.status === s).length;
            return (
              <div key={s} className={`p-3 rounded-[22px] border text-center transition-all duration-300 hover:scale-[1.02] ${cfg.bg} ${isDark ? 'border-slate-800/80' : 'border-slate-100 shadow-sm'}`}>
                <p className={`text-2xl font-black leading-none ${cfg.color}`}>{count}</p>
                <p className={`text-[10px] font-extrabold uppercase tracking-wider mt-1 ${subtext}`}>{s}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* New/Edit Request Form */}
      {showForm && (
        <div className={`p-6 rounded-[28px] border space-y-4.5 animate-scale-up ${isDark ? 'bg-indigo-950/15 border-indigo-500/20' : 'bg-indigo-50/50 border-indigo-200'}`}>
          <h4 className="font-extrabold text-sm text-indigo-550 dark:text-indigo-400 flex items-center gap-2">
            <span>🔧</span>
            <span>{editingRequest ? 'Edit Service Request' : 'Register a New Ticket'}</span>
          </h4>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className={`text-[10px] font-bold uppercase tracking-wider block ${subtext}`}>Category</label>
              <div className={`relative flex items-center border rounded-xl px-4 py-3 ${input}`}>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  className="bg-transparent w-full outline-none text-xs font-bold appearance-none cursor-pointer"
                >
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
                <ChevronDown size={14} className={`absolute right-3 ${subtext}`} />
              </div>
            </div>

            <div className="space-y-1">
              <label className={`text-[10px] font-bold uppercase tracking-wider block ${subtext}`}>Problem Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="e.g. Kitchen water sink tap is dripping/leaking since morning..."
                rows={3}
                className={`w-full border rounded-xl px-4 py-3 text-xs outline-none resize-none ${input}`}
              />
            </div>

            {/* Photo Upload */}
            <div className="space-y-1">
              <label className={`text-[10px] font-bold uppercase tracking-wider block ${subtext}`}>Photo Attachment (Optional)</label>
              <label className={`flex items-center justify-center gap-2 border-2 border-dashed rounded-xl p-4.5 cursor-pointer transition-all duration-300
                ${isDark ? 'border-slate-800 hover:border-indigo-500 text-slate-400 bg-slate-950/40' : 'border-slate-200 hover:border-indigo-400 text-slate-500 bg-slate-50'}`}>
                <Camera size={18} />
                <span className="text-xs font-bold">{form.photo ? form.photo.name : 'Take a photo or upload file'}</span>
                <input type="file" accept="image/*" capture="environment" onChange={handlePhotoChange} className="hidden" />
              </label>
              {preview && (
                <div className="relative mt-2 rounded-2xl overflow-hidden border border-indigo-500/20 max-w-[200px] shadow-sm">
                  <img src={preview} alt="Preview" className="w-full h-24 object-cover" />
                  <button onClick={() => setPreview(null)} className="absolute right-1 top-1 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-650 transition-all"><X size={10} /></button>
                </div>
              )}
            </div>

            <div className="flex gap-2.5 pt-2">
              <button onClick={handleSubmit} disabled={actionLoading} className="flex-1 bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-600/25 text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-300">
                {actionLoading ? <Loader2 className="animate-spin" size={16} /> : (editingRequest ? 'Update Ticket' : 'Submit Ticket')}
              </button>
              <button onClick={() => { setShowForm(false); setPreview(null); setEditingRequest(null); }}
                className={`flex-1 py-3.5 rounded-xl text-xs font-bold border transition-all duration-300 ${isDark ? 'border-slate-850 text-slate-400 hover:bg-slate-900/50' : 'border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
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
      ) : requests.length === 0 ? (
        <div className="text-center py-10">
          <Wrench size={44} className="mx-auto mb-3 opacity-20 text-slate-400" />
          <p className="font-bold text-sm">No complaints raised</p>
          <p className={`text-[10px] mt-0.5 ${subtext}`}>Need assistance? Raise a helpdesk ticket above</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(r => {
            const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.Open;
            const Icon = cfg.icon;
            return (
              <div key={r.id} className={`p-5 transition-all duration-300 hover:scale-[1.01] hover:shadow-md ${card}`}>
                <div className="flex items-start justify-between border-b border-slate-500/10 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-indigo-500/10 border border-indigo-500/15 text-indigo-400 shadow-sm shrink-0">
                      <Wrench size={18} />
                    </div>
                    <div>
                      <p className="font-extrabold text-xs text-slate-850 dark:text-slate-100 leading-snug">{r.category}</p>
                      <p className={`text-[9px] font-bold ${subtext} mt-0.5`}>Raised: {new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <span className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border shadow-sm ${cfg.bg} ${cfg.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${r.status === 'In-progress' ? 'bg-yellow-400 animate-pulse' : r.status === 'Open' ? 'bg-red-400 animate-pulse' : 'bg-emerald-400'}`} />
                    <span>{r.status}</span>
                  </span>
                </div>
                
                <p className={`mt-3 text-xs leading-relaxed text-slate-650 dark:text-slate-300 font-medium`}>{r.description}</p>
                
                <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-500/10">
                  <span className={`text-[8px] font-black uppercase tracking-widest text-slate-400`}>Ticket ID: #{r.id}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleEdit(r)} className="text-indigo-400 hover:text-indigo-300 p-1.5 hover:bg-indigo-500/10 rounded-lg transition-all">
                      <PenLine size={14} />
                    </button>
                    <button onClick={() => handleDelete(r.id)} className="text-red-400 hover:text-red-300 p-1.5 hover:bg-red-500/10 rounded-lg transition-all">
                      <Trash2 size={14} />
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
