import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Users, Plus, Trash2, User, Phone, Shield, Loader2, PenLine } from 'lucide-react';
import { familyAPI, entryAPI } from '../services/api';

const MyFlat = ({ user, sharedSocket }) => {
  const { isDark } = useTheme();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', relation: '', password: '' });
  const [actionLoading, setActionLoading] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  // Society contacts state
  const [contacts, setContacts] = useState({ guards: [], helplines: [] });
  const [contactsLoading, setContactsLoading] = useState(true);

  const card = isDark ? 'glass-panel text-white' : 'glass-card-light text-slate-800';
  const input = isDark ? 'bg-slate-950/65 border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all duration-300' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all duration-300 shadow-sm';
  const subtext = isDark ? 'text-slate-400' : 'text-slate-500';

  useEffect(() => {
    fetchMembers();
    fetchContacts();

    if (sharedSocket) {
      sharedSocket.on('guards_status_update', fetchContacts);
    }
    return () => {
      if (sharedSocket) {
        sharedSocket.off('guards_status_update', fetchContacts);
      }
    };
  }, [sharedSocket]);

  const fetchContacts = async () => {
    try {
      const res = await entryAPI.getSocietyContacts();
      setContacts(res.data);
    } catch (err) {
      console.error('Failed to fetch society contacts:', err);
    } finally {
      setContactsLoading(false);
    }
  };

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
    if (!form.name || !form.phone || (!editingMember && !form.password)) return alert('Name, phone aur password zaroori hain');
    setActionLoading(true);
    try {
      if (editingMember) {
        await familyAPI.updateMember(editingMember, form);
      } else {
        await familyAPI.addMember(form);
      }
      await fetchMembers();
      setForm({ name: '', phone: '', relation: '', password: '' });
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
    setForm({ name: member.name, phone: member.phone, relation: member.relation || '', password: '' });
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
    <div className="space-y-6 animate-slide-up">
      {/* Flat Info Card */}
      <div className={`p-6 transition-all duration-300 hover:shadow-lg ${card}`}>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Shield size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black font-heading leading-tight">{user?.name || 'Resident'}</h2>
            <p className={`text-xs font-semibold ${subtext} mt-0.5`}>
              Flat: <span className="font-extrabold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20">{user?.tower ? `${user.tower}-${user.flat_number}` : (user?.flat_number || 'A-101')}</span> &bull; Primary Resident
            </p>
          </div>
        </div>
        <div className={`flex gap-4 text-xs font-bold pt-2 border-t ${isDark ? 'border-slate-800/80' : 'border-slate-100'} ${subtext}`}>
          <span className="flex items-center gap-1">👨‍👩‍👦 {members.length + 1} Registered Members</span>
          <span className="text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">● Active Profile</span>
        </div>
      </div>

      {/* Family Members */}
      <div className={`p-6 transition-all duration-300 hover:shadow-lg ${card}`}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-extrabold text-base flex items-center gap-2 font-heading">
            <Users size={20} className="text-indigo-400" /> Family Members
          </h3>
          <button
            onClick={() => { 
              setShowForm(!showForm); 
              if (showForm) {
                setEditingMember(null);
                setForm({ name: '', phone: '', relation: '', password: '' });
              }
            }}
            className="flex items-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-600/25 active:scale-95 text-white px-3.5 py-2.5 rounded-xl font-black tracking-wide uppercase transition-all"
          >
            {showForm ? <X size={13} /> : <Plus size={13} />}
            <span>{showForm ? 'Close Form' : 'Add Member'}</span>
          </button>
        </div>

        {/* Add/Edit Member Form */}
        {showForm && (
          <div className={`mb-5 p-5 rounded-[22px] border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50/80 border-slate-200'} space-y-4.5 animate-scale-up`}>
            <p className={`text-[10px] font-bold uppercase tracking-wider ${subtext}`}>
              {editingMember ? '📝 Edit family member details' : '✨ Add a new family member'}
            </p>
            <div className="space-y-3.5">
              <div className="space-y-1">
                <label className={`text-[10px] font-bold uppercase tracking-wider block ${subtext}`}>Full Name</label>
                <input name="name" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  placeholder="e.g. Priyan Mehta" className={`w-full border rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 ${input}`} />
              </div>
              <div className="space-y-1">
                <label className={`text-[10px] font-bold uppercase tracking-wider block ${subtext}`}>Mobile Number</label>
                <input name="phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                  placeholder="e.g. +91 99999 88888" type="tel" className={`w-full border rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 ${input}`} />
              </div>
              <div className="space-y-1">
                <label className={`text-[10px] font-bold uppercase tracking-wider block ${subtext}`}>Relation</label>
                <input name="relation" value={form.relation} onChange={e => setForm({...form, relation: e.target.value})}
                  placeholder="Relation (e.g. Wife, Son, Mother)" className={`w-full border rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 ${input}`} />
              </div>
              {!editingMember && (
                <div className="space-y-1">
                  <label className={`text-[10px] font-bold uppercase tracking-wider block ${subtext}`}>Login Password</label>
                  <input name="password" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                    placeholder="Create dashboard password" className={`w-full border rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 ${input}`} />
                </div>
              )}
              <div className="flex gap-2.5 pt-2">
                <button onClick={handleAddOrEdit} disabled={actionLoading} className="flex-1 bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-600/20 text-white py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-300">
                  {actionLoading ? <Loader2 size={14} className="animate-spin" /> : (editingMember ? 'Update Member' : 'Save Member')}
                </button>
                <button onClick={() => { setShowForm(false); setEditingMember(null); }} className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-all duration-300 ${isDark ? 'border-slate-800 text-slate-400 hover:bg-slate-900/50' : 'border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Members List */}
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="animate-spin text-indigo-500" />
          </div>
        ) : (
          <div className="space-y-3.5">
            {/* Primary Resident (You) */}
            <div className={`flex items-center justify-between p-4 rounded-[22px] border ${
              isDark 
                ? 'bg-indigo-950/20 border-indigo-500/25 shadow-[0_4px_24px_rgba(99,102,241,0.04)]' 
                : 'bg-indigo-50/50 border-indigo-200/70 shadow-sm'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white font-extrabold flex items-center justify-center text-sm shadow-md">
                  {user?.name?.charAt(0)?.toUpperCase() || 'R'}
                </div>
                <div>
                  <p className="font-extrabold text-xs text-slate-850 dark:text-indigo-200 leading-snug">{user?.name || 'You'}</p>
                  <p className={`text-[10px] font-semibold ${subtext} mt-0.5`}>Primary Resident &bull; {user?.phone || '—'}</p>
                </div>
              </div>
              <span className="text-[9px] font-black uppercase tracking-wider bg-indigo-500/10 border border-indigo-500/20 text-indigo-650 dark:text-indigo-400 px-2.5 py-1 rounded-full">Owner</span>
            </div>

            {members.map(m => (
              <div key={m.id} className={`flex items-center justify-between p-4 rounded-[22px] border transition-all duration-300 hover:scale-[1.01] ${
                isDark ? 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700' : 'bg-slate-50/50 border-slate-200 shadow-sm'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-emerald-600 text-white font-extrabold flex items-center justify-center text-sm shadow-md">
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-extrabold text-xs text-slate-800 dark:text-slate-200 leading-snug">{m.name}</p>
                    <p className={`text-[10px] font-semibold ${subtext} mt-0.5`}>{m.relation || 'Family Member'} &bull; {m.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleEdit(m)} className="text-indigo-400 hover:text-indigo-300 p-1.5 hover:bg-indigo-500/10 rounded-lg transition-colors">
                    <PenLine size={14} />
                  </button>
                  <button onClick={() => handleRemove(m.id)} className="text-red-400 hover:text-red-300 p-1.5 hover:bg-red-500/10 rounded-lg transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 📞 Emergency & Security Contacts Card */}
      <div className={`p-6 transition-all duration-300 hover:shadow-lg ${card}`}>
        <h3 className="font-extrabold text-base flex items-center gap-2 mb-5 font-heading">
          <Phone size={20} className="text-emerald-400" /> Emergency & Security Helplines
        </h3>

        {contactsLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="animate-spin text-emerald-500" />
          </div>
        ) : (
          <div className="space-y-5">
            {/* Security Guards Section */}
            {contacts.guards.length > 0 ? (
              <div className="space-y-3">
                <p className={`text-[9px] font-extrabold uppercase tracking-widest ${subtext}`}>Active Security Guards 🛡️</p>
                {(() => {
                  const sortedGuards = [...contacts.guards].sort((a, b) => {
                    const onlineA = !!a.is_online;
                    const onlineB = !!b.is_online;
                    if (onlineA && !onlineB) return -1;
                    if (!onlineA && onlineB) return 1;
                    return a.name.localeCompare(b.name);
                  });

                  return sortedGuards.map((guard, idx) => {
                    const isOnline = !!guard.is_online;
                    return (
                      <div key={idx} className={`flex items-center justify-between p-4 rounded-[22px] border transition-all duration-300 hover:scale-[1.01] ${
                        isDark 
                          ? isOnline 
                            ? 'bg-emerald-950/20 border-emerald-500/25 shadow-[0_4px_24px_rgba(16,185,129,0.04)] hover:border-emerald-500/40'
                            : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-800'
                          : isOnline
                            ? 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-300 shadow-sm'
                            : 'bg-slate-50/50 border-slate-200'
                      }`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-base shrink-0 shadow-md border ${
                            isOnline 
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 animate-pulse' 
                              : 'bg-slate-900/60 border-slate-800/80 text-slate-500'
                          }`}>
                            🛡️
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-extrabold text-xs text-slate-800 dark:text-slate-100 leading-snug">{guard.name}</p>
                              
                              {isOnline ? (
                                <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400 text-[8px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                  ON DUTY
                                </span>
                              ) : (
                                <span className="bg-slate-550/10 border border-slate-600/30 text-slate-400 text-[8px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                                  OFFLINE
                                </span>
                              )}
                            </div>
                            <p className={`text-[10px] ${subtext} mt-1 flex items-center gap-1`}>
                              <span>Mobile:</span>
                              <a href={`tel:${guard.phone}`} className="font-mono hover:text-indigo-400 transition-colors font-bold">
                                {guard.phone}
                              </a>
                            </p>
                          </div>
                        </div>
                        <a href={`tel:${guard.phone}`} className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-md transition-all active:scale-90 ${
                          isOnline
                            ? 'bg-gradient-to-tr from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-emerald-500/20'
                            : 'bg-slate-600 hover:bg-slate-700 text-slate-200'
                        }`}>
                          <Phone size={14} />
                        </a>
                      </div>
                    );
                  });
                })()}
              </div>
            ) : (
              <div className="space-y-2">
                <p className={`text-[9px] font-extrabold uppercase tracking-widest ${subtext}`}>Active Security Guards 🛡️</p>
                <div className={`p-4 rounded-2xl border text-xs text-center ${subtext} ${isDark ? 'bg-slate-900/40 border-slate-800/80' : 'bg-slate-50 border-slate-200'}`}>
                  No active guards currently logged in. Contact the main office helpline below.
                </div>
              </div>
            )}

            {/* General Helplines Section */}
            <div className="space-y-3">
              <p className={`text-[9px] font-extrabold uppercase tracking-widest ${subtext}`}>Society & Public Emergency Contacts 🚨</p>
              <div className="space-y-2.5">
                {contacts.helplines.map((hl, idx) => (
                  <div key={idx} className={`flex items-center justify-between p-4 rounded-[22px] border transition-all duration-300 hover:scale-[1.01] ${
                    isDark ? 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700' : 'bg-slate-50/50 border-slate-200 shadow-sm'
                  }`}>
                    <div>
                      <p className="font-extrabold text-xs leading-snug">{hl.name}</p>
                      <p className={`text-[10px] ${subtext} mt-0.5`}>Emergency Support &bull; {hl.phone}</p>
                    </div>
                    <a href={`tel:${hl.phone}`} className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-550 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white flex items-center justify-center shadow-md active:scale-95 transition-all shadow-emerald-500/10">
                      <Phone size={14} />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyFlat;

