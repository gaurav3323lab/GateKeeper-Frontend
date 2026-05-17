import React, { useState, useEffect } from 'react';
import ISTClock from './ISTClock';
import { useTheme } from '../context/ThemeContext';
import {
  LayoutDashboard, Users, ShieldCheck, Wrench, ClipboardList,
  LogOut, CheckCircle, XCircle, Plus, ChevronRight,
  AlertCircle, Clock, Bell, UserPlus, Loader2, User, PenLine, Trash2, Megaphone, Activity
} from 'lucide-react';
import { managerAPI, serviceAPI, entryAPI, announcementAPI, adsAPI } from '../services/api';
import UserProfile from './UserProfile';
import AnnouncementBoard from './AnnouncementBoard';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';

const ManagerDashboard = ({ user, onLogout }) => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [pendingResidents, setPendingResidents] = useState([]);
  const [staff, setStaff] = useState({ systemStaff: [], externalStaff: [] });
  const [tickets, setTickets] = useState([]);
  const [entryLogs, setEntryLogs] = useState([]);
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', phone: '', role: 'guard', password: '' });
  const [showProfile, setShowProfile] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  
  // Ads State
  const [ads, setAds] = useState([]);
  const [showAddAd, setShowAddAd] = useState(false);
  const [newAd, setNewAd] = useState({ title: '', description: '', image_url: '', link: '' });

  const bg = isDark ? 'bg-[#0f172a] text-white' : 'bg-gray-50 text-gray-800';
  const card = isDark ? 'bg-slate-800/70 border-slate-700' : 'bg-white border-gray-200';
  const input = isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-gray-100 border-gray-300 text-gray-800';
  const subtext = isDark ? 'text-slate-400' : 'text-gray-500';
  const header = isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white/90 border-gray-200';

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [pendingRes, ticketsRes, staffRes, logsRes, residentsRes, adsRes] = await Promise.all([
        managerAPI.getPendingResidents(),
        serviceAPI.getAllRequests(),
        managerAPI.getStaff(),
        entryAPI.getLogs().catch(() => ({ data: [] })),
        managerAPI.getResidents().catch(() => ({ data: [] })),
        adsAPI.getAll().catch(() => ({ data: [] }))
      ]);
      setPendingResidents(pendingRes.data);
      setTickets(ticketsRes.data);
      setStaff(staffRes.data);
      setEntryLogs(logsRes.data);
      setResidents(residentsRes.data);
      setAds(adsRes.data);
    } catch (err) {
      console.error('Failed to fetch manager data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAd = async () => {
    if (!newAd.title || !newAd.description) return alert('Title and description required');
    setActionLoading(true);
    try {
      await adsAPI.create(newAd);
      setNewAd({ title: '', description: '', image_url: '', link: '' });
      setShowAddAd(false);
      await fetchAllData();
    } catch (err) {
      alert('Failed to save ad');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAd = async (id) => {
    if (!window.confirm('Delete this promotion?')) return;
    try {
      await adsAPI.delete(id);
      setAds(ads.filter(a => a.id !== id));
    } catch (err) {
      alert('Failed to delete ad');
    }
  };

  const handleApprove = async (id) => {
    setActionLoading(true);
    try {
      await managerAPI.approveResident(id, { status: 'active' });
      setPendingResidents(pendingResidents.filter(r => r.id !== id));
    } catch (err) {
      alert('Approval failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Are you sure you want to reject this registration?')) return;
    setActionLoading(true);
    try {
      await managerAPI.approveResident(id, { status: 'rejected' });
      setPendingResidents(pendingResidents.filter(r => r.id !== id));
    } catch (err) {
      alert('Rejection failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignTicket = async (ticketId, technicianId) => {
    try {
      await serviceAPI.updateStatus(ticketId, {
        status: 'In-progress',
        technician_id: technicianId
      });
      await fetchAllData();
    } catch (err) {
      alert('Assignment failed');
    }
  };

  const handleAddOrEditStaff = async () => {
    if (!newStaff.name || !newStaff.phone) return alert('Name and phone required');
    setActionLoading(true);
    try {
      if (editingStaff) {
        await managerAPI.updateStaff(editingStaff.type, editingStaff.id, newStaff);
      } else {
        await managerAPI.createStaff(newStaff);
      }
      setNewStaff({ name: '', phone: '', role: 'guard', password: '' });
      setShowAddStaff(false);
      setEditingStaff(null);
      await fetchAllData();
    } catch (err) {
      alert('Failed to save staff');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditStaff = (staffMember, type) => {
    setEditingStaff({ id: staffMember.id, type });
    setNewStaff({ name: staffMember.name, phone: staffMember.phone, role: staffMember.role, password: '' });
    setShowAddStaff(true);
  };

  const handleDeleteStaff = async (id, type) => {
    if (!window.confirm('Are you sure you want to remove this staff member?')) return;
    try {
      await managerAPI.deleteStaff(type, id);
      await fetchAllData();
    } catch (err) {
      alert('Failed to delete staff member');
    }
  };

  const tabs = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'approvals', label: 'Approvals', icon: ClipboardList },
    { key: 'staff', label: 'Staff', icon: Users },
    { key: 'tickets', label: 'Tickets', icon: Wrench },
    { key: 'residents', label: 'Residents', icon: ShieldCheck },
    { key: 'logs', label: 'Entry Log', icon: Activity },
    { key: 'analytics', label: 'Analytics', icon: Activity },
    { key: 'notices', label: 'Notices', icon: Megaphone },
    { key: 'ads', label: 'Promotions', icon: Megaphone },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f172a] text-white">
        <Loader2 className="animate-spin text-indigo-500 mb-2" size={40} />
        <p className="text-slate-400">Loading Manager Dashboard...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-4 transition-colors duration-300 ${bg}`}>
      {/* Header */}
      <header className={`sticky top-0 z-40 px-4 py-3 border-b backdrop-blur-md flex items-center justify-between ${header}`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center">
            <ShieldCheck size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm leading-tight">Manager Dashboard</h1>
            <ISTClock showDate className={subtext} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {pendingResidents.length > 0 && (
            <div className="relative">
              <Bell size={20} className="text-yellow-400" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                {pendingResidents.length}
              </span>
            </div>
          )}
          <button onClick={() => setShowProfile(true)} className={`p-2 rounded-xl border flex items-center justify-center ${isDark ? 'border-slate-700 text-slate-400 hover:text-indigo-400' : 'border-gray-200 text-gray-400 hover:text-indigo-500'}`}>
            <User size={15} />
          </button>
          <button onClick={onLogout} className={`p-2 rounded-xl border ${isDark ? 'border-slate-700 text-slate-400 hover:text-red-400' : 'border-gray-200 text-gray-400 hover:text-red-400'}`}>
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className={`flex overflow-x-auto gap-1 px-4 py-2 border-b sticky top-[57px] z-30 backdrop-blur-md ${header}`}>
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all relative
              ${activeTab === key ? 'bg-indigo-600 text-white' : isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}>
            <Icon size={13} /> {label}
            {key === 'approvals' && pendingResidents.length > 0 && (
              <span className="ml-1 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">{pendingResidents.length}</span>
            )}
          </button>
        ))}
      </div>

      <div className="p-4 max-w-4xl mx-auto space-y-4">

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Pending Approvals', value: pendingResidents.length, color: 'text-yellow-400', bg: 'bg-yellow-500/10', icon: Clock },
                { label: 'Active Tickets', value: tickets.filter(t => t.status !== 'Resolved').length, color: 'text-red-400', bg: 'bg-red-500/10', icon: AlertCircle },
                { label: 'Resolved Tickets', value: tickets.filter(t => t.status === 'Resolved').length, color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: CheckCircle },
                { label: 'Total Staff', value: staff.systemStaff.length + staff.externalStaff.length, color: 'text-indigo-400', bg: 'bg-indigo-500/10', icon: Users },
              ].map(s => (
                <div key={s.label} className={`border rounded-2xl p-4 ${card}`}>
                  <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-2`}>
                    <s.icon size={16} className={s.color} />
                  </div>
                  <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
                  <p className={`text-xs mt-0.5 ${subtext}`}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Approvals Preview */}
            {pendingResidents.length > 0 && (
              <div className={`border rounded-2xl p-5 ${isDark ? 'bg-yellow-900/20 border-yellow-700/30' : 'bg-yellow-50 border-yellow-200'}`}>
                <h3 className="font-bold text-yellow-400 mb-3 flex items-center gap-2"><Clock size={15} /> Pending Resident Approvals</h3>
                {pendingResidents.slice(0, 3).map(r => (
                  <div key={r.id} className={`flex items-center justify-between p-3 mb-2 rounded-xl ${isDark ? 'bg-slate-700/40' : 'bg-white shadow-sm'}`}>
                    <div>
                      <p className="font-semibold text-sm">{r.name} — Flat {r.flat_number}</p>
                      <p className={`text-xs ${subtext}`}>{r.phone}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleApprove(r.id)} disabled={actionLoading} className="bg-emerald-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold">Approve</button>
                      <button onClick={() => handleReject(r.id)} disabled={actionLoading} className="text-red-500 hover:text-red-600 p-2"><XCircle size={18}/></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* APPROVALS TAB */}
        {activeTab === 'approvals' && (
          <div className="space-y-3">
            <h2 className="font-bold text-base">Resident Approval Requests</h2>
            {pendingResidents.length === 0 ? (
              <div className={`border rounded-2xl p-10 text-center ${card}`}>
                <CheckCircle size={40} className="mx-auto text-emerald-400 mb-3" />
                <p className="font-bold">All clear!</p>
                <p className={`text-sm ${subtext}`}>No pending resident registrations.</p>
              </div>
            ) : (
              pendingResidents.map(r => (
                <div key={r.id} className={`border rounded-2xl p-4 ${card}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                      {r.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{r.name}</p>
                      <p className={`text-xs ${subtext}`}>{r.phone} &bull; Flat {r.flat_number} &bull; Joined: {new Date(r.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => handleApprove(r.id)} disabled={actionLoading} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                      {actionLoading ? <Loader2 className="animate-spin" size={16}/> : 'Approve Resident'}
                    </button>
                    <button onClick={() => handleReject(r.id)} disabled={actionLoading} className="flex-1 py-2.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl text-sm font-bold">
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TICKETS TAB */}
        {activeTab === 'tickets' && (
          <div className="space-y-4">
            <h2 className="font-bold text-base">Service Requests</h2>
            {tickets.map(t => (
              <div key={t.id} className={`border rounded-2xl p-4 ${card}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-bold text-sm">{t.category} — Flat {t.flat_number}</p>
                    <p className={`text-xs mt-0.5 ${subtext}`}>{t.description}</p>
                    <p className={`text-[10px] mt-1 ${subtext}`}>Requested by: {t.resident_name} &bull; {new Date(t.created_at).toLocaleString()}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                    t.status === 'Open' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                    t.status === 'In-progress' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' :
                    'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  }`}>{t.status}</span>
                </div>
                {t.status === 'Open' && (
                  <div className="mt-4 pt-4 border-t border-glassBorder">
                    <p className="text-[10px] font-bold mb-2 text-indigo-400 uppercase tracking-wider">Assign Technician</p>
                    <div className="flex flex-wrap gap-2">
                      {staff.systemStaff.filter(s => s.role === 'technician').map(tech => (
                        <button key={tech.id} onClick={() => handleAssignTicket(t.id, tech.id)}
                          className="text-[10px] bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-700 transition-colors">
                          {tech.name}
                        </button>
                      ))}
                      {staff.systemStaff.filter(s => s.role === 'technician').length === 0 && (
                        <p className="text-[10px] text-red-400 font-bold border border-red-500/20 bg-red-500/10 px-2 py-1 rounded-md">No technicians available. Add in Staff tab.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* STAFF TAB */}
        {activeTab === 'staff' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-base">Society Staff</h2>
              <button onClick={() => setShowAddStaff(!showAddStaff)} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                {showAddStaff ? <XCircle size={16} /> : <Plus size={16} />}
                {showAddStaff ? 'Cancel' : 'Add Staff'}
              </button>
            </div>

            {showAddStaff && (
              <div className={`border rounded-2xl p-5 ${isDark ? 'bg-indigo-900/20 border-indigo-700/30' : 'bg-indigo-50 border-indigo-200'}`}>
                <h3 className="font-bold text-indigo-400 mb-3 flex items-center gap-2"><UserPlus size={15} /> New Staff Member</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  <input placeholder="Full Name" value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} className={`px-4 py-2.5 rounded-xl border text-sm outline-none ${input}`} />
                  <input placeholder="Phone Number" value={newStaff.phone} onChange={e => setNewStaff({...newStaff, phone: e.target.value})} className={`px-4 py-2.5 rounded-xl border text-sm outline-none ${input}`} />
                  <div className={`relative flex items-center border rounded-xl px-4 py-2.5 ${input}`}>
                    <select value={newStaff.role} onChange={e => setNewStaff({...newStaff, role: e.target.value})} className="bg-transparent w-full outline-none text-sm appearance-none cursor-pointer">
                      <option value="guard">Security Guard</option>
                      <option value="technician">Technician</option>
                      <option value="maid">Maid / Helper</option>
                      <option value="cook">Cook</option>
                    </select>
                    <ChevronRight size={14} className={`absolute right-3 pointer-events-none rotate-90 ${subtext}`} />
                  </div>
                  {['guard', 'technician'].includes(newStaff.role) && (
                    <input placeholder={editingStaff ? "New Password (Leave blank to keep current)" : "Login Password (Min 6 chars)"} type="password" value={newStaff.password || ''} onChange={e => setNewStaff({...newStaff, password: e.target.value})} className={`px-4 py-2.5 rounded-xl border text-sm outline-none md:col-span-3 ${input}`} />
                  )}
                </div>
                <button onClick={handleAddOrEditStaff} disabled={actionLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all">
                  {actionLoading ? <Loader2 className="animate-spin" size={18} /> : (editingStaff ? 'Update Staff Member' : 'Register Staff')}
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`border rounded-2xl p-4 ${card}`}>
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><ShieldCheck size={16} className="text-emerald-400" /> System Access Staff</h3>
                {staff.systemStaff.length === 0 && <p className={`text-xs ${subtext}`}>No system staff found.</p>}
                {staff.systemStaff.map(s => (
                  <div key={s.id} className={`flex items-center justify-between p-3 mb-2 rounded-xl border ${isDark ? 'bg-slate-700/40 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
                    <div>
                      <p className="font-bold text-sm">{s.name}</p>
                      <p className={`text-xs capitalize ${subtext}`}>{s.role} &bull; {s.phone}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEditStaff(s, 'system')} className="text-indigo-400 hover:text-indigo-300 p-1">
                        <PenLine size={16} />
                      </button>
                      <button onClick={() => handleDeleteStaff(s.id, 'system')} className="text-red-400 hover:text-red-300 p-1">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className={`border rounded-2xl p-4 ${card}`}>
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><Users size={16} className="text-indigo-400" /> Daily Helpers (QR Access)</h3>
                {staff.externalStaff.length === 0 && <p className={`text-xs ${subtext}`}>No daily helpers found.</p>}
                {staff.externalStaff.map(s => (
                  <div key={s.id} className={`flex items-center justify-between p-3 mb-2 rounded-xl border ${isDark ? 'bg-slate-700/40 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
                    <div>
                      <p className="font-bold text-sm">{s.name}</p>
                      <p className={`text-xs capitalize ${subtext}`}>{s.role} &bull; {s.phone}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEditStaff(s, 'external')} className="text-indigo-400 hover:text-indigo-300 p-1">
                        <PenLine size={16} />
                      </button>
                      <button onClick={() => handleDeleteStaff(s.id, 'external')} className="text-red-400 hover:text-red-300 p-1">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* RESIDENTS TAB */}
        {activeTab === 'residents' && (
          <div className="space-y-3">
            <h2 className="font-bold text-base">Active Residents ({residents.length})</h2>
            {residents.length === 0 ? (
              <div className={`border rounded-2xl p-10 text-center ${card}`}>
                <Users size={40} className="mx-auto opacity-30 mb-3" />
                <p className={`text-sm ${subtext}`}>No active residents found</p>
              </div>
            ) : (
              residents.map(r => (
                <div key={r.id} className={`border rounded-2xl p-4 flex items-center gap-3 ${card}`}>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center text-white font-bold text-sm">
                    {r.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm">{r.name}</p>
                    <p className={`text-xs ${subtext}`}>Flat <span className="text-indigo-400 font-bold">{r.flat_number || 'N/A'}</span> • {r.phone}</p>
                    <p className={`text-xs ${subtext} capitalize`}>{r.role.replace('_', ' ')}</p>
                  </div>
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded-full">Active</span>
                </div>
              ))
            )}
          </div>
        )}

        {/* ENTRY LOG TAB */}
        {activeTab === 'logs' && (
          <div className="space-y-3">
            <h2 className="font-bold text-base flex items-center gap-2">
              <Activity size={16} className="text-indigo-400" /> Recent Entry Logs
            </h2>
            {entryLogs.length === 0 ? (
              <div className={`border rounded-2xl p-10 text-center ${card}`}>
                <Activity size={40} className="mx-auto opacity-30 mb-3" />
                <p className={`text-sm ${subtext}`}>No entry logs found</p>
              </div>
            ) : (
              entryLogs.map(log => (
                <div key={log.id} className={`border rounded-2xl p-4 ${card}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${
                        log.entity_type === 'vehicle' ? 'bg-blue-500/20' :
                        log.entity_type === 'guest' ? 'bg-emerald-500/20' : 'bg-purple-500/20'
                      }`}>
                        {log.entity_type === 'vehicle' ? '🚗' : log.entity_type === 'guest' ? '🧑' : '👷'}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{log.entity_name || 'Unknown'}</p>
                        <p className={`text-xs ${subtext} capitalize`}>{log.entity_type} • Gate: {log.gate_number}</p>
                        <p className={`text-xs ${subtext}`}>By: {log.guard_name || 'Guard'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs ${subtext}`}>In: {new Date(log.entry_time).toLocaleTimeString('en-IN')}</p>
                      {log.exit_time && <p className={`text-xs text-emerald-400`}>Out: {new Date(log.exit_time).toLocaleTimeString('en-IN')}</p>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <div className="space-y-4">
            <h2 className="font-bold text-base flex items-center gap-2">
              <Activity size={16} className="text-indigo-400" /> Visitor & Service Analytics
            </h2>
            <div className={`border rounded-2xl p-4 ${card}`}>
              <h3 className="text-sm font-bold mb-4">Daily Entries (Past 7 Days)</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[
                    { name: 'Mon', entries: 12 }, { name: 'Tue', entries: 19 }, { name: 'Wed', entries: 15 },
                    { name: 'Thu', entries: 22 }, { name: 'Fri', entries: 30 }, { name: 'Sat', entries: 45 }, { name: 'Sun', entries: 38 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} vertical={false} />
                    <XAxis dataKey="name" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={12} tickLine={false} axisLine={false} />
                    <RechartsTooltip contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Line type="monotone" dataKey="entries" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: isDark ? '#1e293b' : '#fff' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className={`border rounded-2xl p-4 ${card}`}>
              <h3 className="text-sm font-bold mb-4">Service Requests by Category</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Plumbing', count: 8 }, { name: 'Electrical', count: 12 }, { name: 'Cleaning', count: 5 }, { name: 'Other', count: 3 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} vertical={false} />
                    <XAxis dataKey="name" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={12} tickLine={false} axisLine={false} />
                    <RechartsTooltip cursor={{ fill: isDark ? '#334155' : '#f1f5f9' }} contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* NOTICES TAB */}
        {activeTab === 'notices' && (
          <AnnouncementBoard user={user} />
        )}

        {/* ADS TAB */}
        {activeTab === 'ads' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-base flex items-center gap-2">
                <Megaphone size={16} className="text-indigo-400" /> Manage Promotions & Ads
              </h2>
              <button onClick={() => setShowAddAd(!showAddAd)} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                {showAddAd ? <XCircle size={16} /> : <Plus size={16} />}
                {showAddAd ? 'Cancel' : 'New Ad'}
              </button>
            </div>

            {showAddAd && (
              <div className={`border rounded-2xl p-5 ${isDark ? 'bg-indigo-900/20 border-indigo-700/30' : 'bg-indigo-50 border-indigo-200'}`}>
                <h3 className="font-bold text-indigo-400 mb-3">Create New Promotion</h3>
                <div className="space-y-3 mb-4">
                  <input placeholder="Ad Title (e.g. 50% Off Plumbing)" value={newAd.title} onChange={e => setNewAd({...newAd, title: e.target.value})} className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none ${input}`} />
                  <textarea placeholder="Description" rows={2} value={newAd.description} onChange={e => setNewAd({...newAd, description: e.target.value})} className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none resize-none ${input}`} />
                  <input placeholder="Image URL (e.g. https://imgur.com/...)" value={newAd.image_url} onChange={e => setNewAd({...newAd, image_url: e.target.value})} className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none ${input}`} />
                  <input placeholder="Click Link URL (Optional)" value={newAd.link} onChange={e => setNewAd({...newAd, link: e.target.value})} className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none ${input}`} />
                </div>
                <button onClick={handleAddAd} disabled={actionLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all">
                  {actionLoading ? <Loader2 className="animate-spin" size={18} /> : 'Publish Ad'}
                </button>
              </div>
            )}

            {ads.length === 0 ? (
              <div className={`border rounded-2xl p-10 text-center ${card}`}>
                <Megaphone size={40} className="mx-auto opacity-30 mb-3" />
                <p className={`text-sm ${subtext}`}>No active promotions. Residents see generic ads.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {ads.map(ad => (
                  <div key={ad.id} className={`flex flex-col sm:flex-row items-center gap-4 border rounded-2xl p-4 ${card}`}>
                    <div className="w-full sm:w-24 h-24 rounded-xl overflow-hidden bg-slate-800 shrink-0">
                      {ad.image_url ? (
                        <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold text-xs text-center p-2">No Image</div>
                      )}
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <p className="font-bold text-sm mb-1">{ad.title}</p>
                      <p className={`text-xs ${subtext} mb-2`}>{ad.description}</p>
                      <div className="flex items-center justify-center sm:justify-start gap-3">
                        {ad.link && ad.link !== '#' && <a href={ad.link} target="_blank" rel="noreferrer" className="text-xs text-indigo-400 font-bold hover:underline">Test Link</a>}
                        <p className={`text-[10px] ${subtext}`}>Posted: {new Date(ad.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteAd(ad.id)} className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 shrink-0">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      <UserProfile isOpen={showProfile} onClose={() => setShowProfile(false)} />
    </div>
  );

};

export default ManagerDashboard;
