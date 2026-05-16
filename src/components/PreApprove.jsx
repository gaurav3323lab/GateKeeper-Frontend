import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Package, Plus, CheckCircle, Clock, Truck, X, User } from 'lucide-react';

const PreApprove = ({ user }) => {
  const { isDark } = useTheme();
  const [approvals, setApprovals] = useState([
    { id: 1, type: 'delivery', company: 'Amazon', valid_date: '2026-05-10', status: 'active' },
    { id: 2, type: 'guest', name: 'Rakesh Bhai', purpose: 'Birthday Party', valid_date: '2026-05-12', status: 'active' },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'delivery', company: '', name: '', purpose: '', valid_date: '' });

  const card = isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-gray-200';
  const input = isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-gray-100 border-gray-300 text-gray-800';
  const subtext = isDark ? 'text-slate-400' : 'text-gray-500';

  const handleAdd = () => {
    if (form.type === 'delivery' && !form.company) return;
    if (form.type === 'guest' && !form.name) return;
    setApprovals([...approvals, { id: Date.now(), ...form, status: 'active' }]);
    setForm({ type: 'delivery', company: '', name: '', purpose: '', valid_date: '' });
    setShowForm(false);
  };

  const handleRemove = (id) => setApprovals(approvals.filter(a => a.id !== id));

  const deliveryIcons = { Amazon: '📦', Swiggy: '🛵', Zomato: '🍕', Flipkart: '🛍️', Other: '📫' };

  return (
    <div className="space-y-6">
      <div className={`border rounded-2xl p-5 ${card}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              <CheckCircle size={18} className="text-emerald-400" /> Pre-Approvals
            </h3>
            <p className={`text-xs mt-1 ${subtext}`}>Gate par bina phone ke entry den</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl font-semibold"
          >
            <Plus size={14} /> Add
          </button>
        </div>

        {/* Add Form */}
        {showForm && (
          <div className={`mb-4 p-4 rounded-xl border ${isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
            <div className="space-y-3">
              <div className="flex gap-2">
                <button onClick={() => setForm({...form, type: 'delivery'})}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${form.type === 'delivery' ? 'bg-indigo-600 text-white' : isDark ? 'bg-slate-600 text-slate-300' : 'bg-gray-200 text-gray-600'}`}>
                  <Truck size={14} className="inline mr-1" /> Delivery
                </button>
                <button onClick={() => setForm({...form, type: 'guest'})}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${form.type === 'guest' ? 'bg-indigo-600 text-white' : isDark ? 'bg-slate-600 text-slate-300' : 'bg-gray-200 text-gray-600'}`}>
                  <User size={14} className="inline mr-1" /> Guest
                </button>
              </div>

              {form.type === 'delivery' ? (
                <select value={form.company} onChange={e => setForm({...form, company: e.target.value})}
                  className={`w-full border rounded-xl px-3 py-2 text-sm outline-none ${input}`}>
                  <option value="">Company Select Karein</option>
                  <option>Amazon</option>
                  <option>Swiggy</option>
                  <option>Zomato</option>
                  <option>Flipkart</option>
                  <option>Other</option>
                </select>
              ) : (
                <>
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                    placeholder="Guest ka Naam" className={`w-full border rounded-xl px-3 py-2 text-sm outline-none ${input}`} />
                  <input value={form.purpose} onChange={e => setForm({...form, purpose: e.target.value})}
                    placeholder="Aane ka Maqsad" className={`w-full border rounded-xl px-3 py-2 text-sm outline-none ${input}`} />
                </>
              )}

              <input type="date" value={form.valid_date} onChange={e => setForm({...form, valid_date: e.target.value})}
                className={`w-full border rounded-xl px-3 py-2 text-sm outline-none ${input}`} />

              <div className="flex gap-2">
                <button onClick={handleAdd} className="flex-1 bg-emerald-600 text-white py-2 rounded-xl text-sm font-semibold">
                  Allow Karein ✅
                </button>
                <button onClick={() => setShowForm(false)} className={`flex-1 py-2 rounded-xl text-sm border ${isDark ? 'border-slate-600 text-slate-400' : 'border-gray-300 text-gray-500'}`}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Active Approvals List */}
        {approvals.length === 0 ? (
          <div className={`text-center py-8 ${subtext}`}>
            <Package size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Koi pre-approval nahi hai abhi</p>
          </div>
        ) : (
          <div className="space-y-3">
            {approvals.map(a => (
              <div key={a.id} className={`flex items-center justify-between p-3 rounded-xl border ${isDark ? 'bg-slate-700/40 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{a.type === 'delivery' ? (deliveryIcons[a.company] || '📦') : '🧑'}</div>
                  <div>
                    <p className="font-semibold text-sm">{a.type === 'delivery' ? a.company : a.name}</p>
                    <p className={`text-xs ${subtext}`}>
                      {a.type === 'delivery' ? 'Delivery' : a.purpose || 'Guest'}
                      {a.valid_date && ` • Valid: ${a.valid_date}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded-full">
                    ✅ Active
                  </span>
                  <button onClick={() => handleRemove(a.id)} className="text-red-400 hover:text-red-300 p-1">
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PreApprove;
