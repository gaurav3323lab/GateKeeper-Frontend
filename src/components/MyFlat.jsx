import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Users, Plus, Trash2, User, Phone, Shield, Loader2, PenLine } from 'lucide-react';
import { familyAPI } from '../services/api';

const MyFlat = ({ user }) => {
  const { isDark } = useTheme();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', relation: '' });
  const [actionLoading, setActionLoading] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  const card = isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-gray-200';
  const input = isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-gray-100 border-gray-300 text-gray-800';
  const subtext = isDark ? 'text-slate-400' : 'text-gray-500';

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const res = await familyAPI.getMembers();
      setMembers(res.data);
    } catch (err) {
      console.error('Failed to fetch members:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddOrEdit = async () => {
    if (!form.name || !form.phone) return;
    setActionLoading(true);
    try {
      if (editingMember) {
        await familyAPI.updateMember(editingMember, form);
      } else {
        await familyAPI.addMember(form);
      }
      await fetchMembers();
      setForm({ name: '', phone: '', relation: '' });
      setShowForm(false);
      setEditingMember(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save member');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = (member) => {
    setEditingMember(member.id);
    setForm({ name: member.name, phone: member.phone, relation: member.relation || '' });
    setShowForm(true);
  };

  const handleRemove = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await familyAPI.removeMember(id);
      setMembers(members.filter(m => m.id !== id));
    } catch (err) {
      alert('Failed to remove member');
    }
  };

  return (
    <div className="space-y-6">
      {/* Flat Info Card */}
      <div className={`border rounded-2xl p-5 ${card}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center">
            <Shield size={22} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold">{user?.name || 'Resident'}</h2>
            <p className={`text-sm ${subtext}`}>Flat: <span className="font-semibold text-indigo-400">{user?.flat_number || 'A-101'}</span> &bull; Primary Resident</p>
          </div>
        </div>
        <div className={`flex gap-4 text-sm ${subtext}`}>
          <span>👨‍👩‍👦 {members.length + 1} Members</span>
          <span>✅ Active</span>
        </div>
      </div>

      {/* Family Members */}
      <div className={`border rounded-2xl p-5 ${card}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base flex items-center gap-2">
            <Users size={18} className="text-indigo-400" /> Family Members
          </h3>
          <button
            onClick={() => { 
              setShowForm(!showForm); 
              if (showForm) {
                setEditingMember(null);
                setForm({ name: '', phone: '', relation: '' });
              }
            }}
            className="flex items-center gap-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-xl font-semibold transition-all"
          >
            <Plus size={14} /> Add Member
          </button>
        </div>

        {/* Add/Edit Member Form */}
        {showForm && (
          <div className={`mb-4 p-4 rounded-xl border ${isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
            <p className={`text-xs font-semibold mb-3 ${subtext}`}>{editingMember ? 'Edit family member details' : 'Add a new family member'}</p>
            <div className="space-y-2">
              <input name="name" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                placeholder="Name" className={`w-full border rounded-xl px-3 py-2 text-sm outline-none ${input}`} />
              <input name="phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                placeholder="Mobile Number" type="tel" className={`w-full border rounded-xl px-3 py-2 text-sm outline-none ${input}`} />
              <input name="relation" value={form.relation} onChange={e => setForm({...form, relation: e.target.value})}
                placeholder="Relation (Wife, Son, etc.)" className={`w-full border rounded-xl px-3 py-2 text-sm outline-none ${input}`} />
              <div className="flex gap-2 mt-2">
                <button onClick={handleAddOrEdit} disabled={actionLoading} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
                  {actionLoading ? <Loader2 size={16} className="animate-spin" /> : (editingMember ? 'Update Member' : 'Add Member')}
                </button>
                <button onClick={() => setShowForm(false)} className={`flex-1 py-2 rounded-xl text-sm font-semibold border ${isDark ? 'border-slate-600 text-slate-400' : 'border-gray-300 text-gray-500'}`}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Members List */}
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="animate-spin text-indigo-500" />
          </div>
        ) : (
          <div className="space-y-3">
            {/* Primary Resident (You) */}
            <div className={`flex items-center justify-between p-3 rounded-xl ${isDark ? 'bg-indigo-900/30 border border-indigo-700/50' : 'bg-indigo-50 border border-indigo-200'}`}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                  {user?.name?.charAt(0) || 'R'}
                </div>
                <div>
                  <p className="font-semibold text-sm">{user?.name || 'You (Primary)'}</p>
                  <p className={`text-xs ${subtext}`}>Primary Resident &bull; {user?.phone || '—'}</p>
                </div>
              </div>
              <span className="text-xs bg-indigo-600 text-white px-2 py-1 rounded-full font-bold">Owner</span>
            </div>

            {members.map(m => (
              <div key={m.id} className={`flex items-center justify-between p-3 rounded-xl border ${isDark ? 'bg-slate-700/40 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                    {m.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{m.name}</p>
                    <p className={`text-xs ${subtext}`}>{m.relation} &bull; {m.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleEdit(m)} className="text-indigo-400 hover:text-indigo-300 p-1 rounded-lg">
                    <PenLine size={16} />
                  </button>
                  <button onClick={() => handleRemove(m.id)} className="text-red-400 hover:text-red-300 p-1 rounded-lg">
                    <Trash2 size={16} />
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

export default MyFlat;
