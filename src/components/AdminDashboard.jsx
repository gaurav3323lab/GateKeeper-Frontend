import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  Building2, Users, ShieldCheck, Wrench, LogOut, Plus, Trash2,
  BarChart3, Activity, User, CheckCircle, XCircle, Clock,
  Loader2, UserPlus, Bell, Sun, Moon, Car, Search,
  RefreshCw, Wifi, WifiOff, ChevronDown, Key, AlertTriangle,
  Settings, Shield, TrendingUp, Home
} from 'lucide-react';
import { adminAPI, managerAPI } from '../services/api';
import UserProfile from './UserProfile';
import AnnouncementBoard from './AnnouncementBoard';

const AdminDashboard = ({ user, onLogout }) => {
  const { isDark, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState({
    society: {}, stats: {}, managers: [], guards: [],
    pendingResidents: [], residents: [], recentLogs: []
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Add manager form
  const [showAddManager, setShowAddManager] = useState(false);
  const [newManager, setNewManager] = useState({ name: '', phone: '', password: '' });

  // Add guard/staff form
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', phone: '', role: 'guard', password: '' });

  // Search/filter
  const [residentSearch, setResidentSearch] = useState('');
  const [staffSearch, setStaffSearch] = useState('');

  const bg = isDark ? 'bg-[#0a0f1e] text-white' : 'bg-slate-50 text-gray-900';
  const card = isDark ? 'bg-slate-800/60 border-slate-700/60 backdrop-blur-sm shadow-md' : 'bg-white border-gray-200 shadow-sm';
  const inp = isDark ? 'bg-slate-700/80 border-slate-600 text-white placeholder-slate-400' : 'bg-gray-50 border-gray-300 text-gray-800';
  const sub = isDark ? 'text-slate-400' : 'text-gray-500';
  const hdr = isDark ? 'bg-[#0c1328] border-slate-800 text-white' : 'bg-white border-gray-200 text-gray-800';

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getAdminDashboard();
      setData(res.data);
    } catch (err) {
      console.error('AdminDashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id, status) => {
    setActionLoading(true);
    try {
      await adminAPI.approveResident(id, { status });
      await fetchAll();
    } catch {
      alert('Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddManager = async () => {
    if (!newManager.name || !newManager.phone) return alert('Name & phone required');
    setActionLoading(true);
    try {
      await adminAPI.createManager(newManager);
      setNewManager({ name: '', phone: '', password: '' });
      setShowAddManager(false);
      await fetchAll();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to create manager');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteManager = async (id) => {
    if (!window.confirm('Delete this manager?')) return;
    try {
      await adminAPI.deleteManager(id);
      await fetchAll();
    } catch {
      alert('Delete failed');
    }
  };

  const handleAddStaff = async () => {
    if (!newStaff.name || !newStaff.phone) return alert('Name & phone required');
    setActionLoading(true);
    try {
      await adminAPI.createStaff(newStaff);
      setNewStaff({ name: '', phone: '', role: 'guard', password: '' });
      setShowAddStaff(false);
      await fetchAll();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to create staff');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredResidents = useMemo(() =>
    (data.residents || []).filter(r =>
      !residentSearch ||
      r.name?.toLowerCase().includes(residentSearch.toLowerCase()) ||
      r.flat_number?.toLowerCase().includes(residentSearch.toLowerCase()) ||
      r.phone?.includes(residentSearch) ||
      r.vehicles?.toLowerCase().includes(residentSearch.toLowerCase())
    ), [data.residents, residentSearch]);

  const filteredStaff = useMemo(() =>
    (data.guards || []).filter(s =>
      !staffSearch ||
      s.name?.toLowerCase().includes(staffSearch.toLowerCase()) ||
      s.phone?.includes(staffSearch)
    ), [data.guards, staffSearch]);

  const { society, stats } = data;
  const pendingCount = (data.pendingResidents || []).length;

  const tabs = [
    { key: 'overview', label: 'Overview', icon: BarChart3 },
    { key: 'approvals', label: 'Approvals', icon: Clock, badge: pendingCount },
    { key: 'managers', label: 'Managers', icon: User },
    { key: 'staff', label: 'Guards & Staff', icon: ShieldCheck },
    { key: 'residents', label: 'Residents', icon: Users },
    { key: 'logs', label: 'Gate Logs', icon: Activity },
    { key: 'notices', label: 'Notices', icon: Bell },
  ];

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0f1e] text-white">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center mb-4 animate-pulse">
        <Building2 size={28} className="text-white" />
      </div>
      <Loader2 className="animate-spin text-violet-400 mb-2" size={32} />
      <p className="text-slate-400 text-sm font-semibold">Loading Society Admin Console...</p>
    </div>
  );

  return (
    <div className={`min-h-screen pb-12 transition-colors duration-300 ${bg}`}>
      <div className="max-w-6xl mx-auto px-0 md:px-4">
        <div className={`overflow-hidden flex flex-col ${bg}`}>

          {/* ── NAVBAR ─────────────────────────────────────────── */}
          <header className={`px-4 py-3 border-b flex flex-wrap items-center justify-between gap-4 backdrop-blur-md sticky top-0 z-40 ${hdr}`}>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <span className="text-xs font-black tracking-tighter text-blue-500 dark:text-blue-400 uppercase">Cloud<span className="text-red-500 italic">4</span></span>
                <span className="text-xs font-black tracking-tighter text-slate-800 dark:text-slate-200 uppercase">Things</span>
                <span className="text-[8px] bg-violet-500/10 text-violet-500 font-black px-1.5 py-0.5 rounded-md ml-1.5">ADMIN</span>
              </div>
              {/* Society selector chip */}
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
                <Building2 size={11} className="text-violet-400" />
                <span className="font-extrabold text-violet-500 dark:text-violet-400 text-[11px]">{society?.name || 'My Society'}</span>
                <span className={`text-[9px] font-bold ${sub}`}>{society?.city}</span>
              </div>
            </div>

            <div className="flex items-center gap-5 text-xs font-black text-slate-500 tracking-wide">
              <button onClick={() => setActiveTab('overview')} className={`hover:text-violet-500 ${activeTab === 'overview' ? 'text-violet-500 underline decoration-2 underline-offset-4' : ''}`}>Dashboard</button>
              <button onClick={() => setActiveTab('managers')} className={`hover:text-violet-500 ${activeTab === 'managers' ? 'text-violet-500 underline decoration-2 underline-offset-4' : ''}`}>Managers</button>
              <button onClick={() => setActiveTab('residents')} className={`hover:text-violet-500 ${activeTab === 'residents' ? 'text-violet-500 underline decoration-2 underline-offset-4' : ''}`}>Residents</button>
              <button onClick={() => setActiveTab('logs')} className={`hover:text-violet-500 ${activeTab === 'logs' ? 'text-violet-500 underline decoration-2 underline-offset-4' : ''}`}>Gate Logs</button>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={toggleTheme} className={`p-1.5 rounded-xl border ${isDark ? 'border-slate-700 text-amber-400' : 'border-gray-200 text-slate-500'}`}>
                {isDark ? <Sun size={14} /> : <Moon size={14} />}
              </button>
              {pendingCount > 0 && (
                <button onClick={() => setActiveTab('approvals')} className="relative p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <Bell size={14} className="text-amber-400 animate-pulse" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center font-black">{pendingCount}</span>
                </button>
              )}
              <button onClick={fetchAll} className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-violet-400">
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </button>
              <div className="flex items-center gap-1.5 border-l border-slate-200 dark:border-slate-800 pl-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400">{user?.name || 'Admin'}</span>
                <button onClick={onLogout} className="text-red-400 hover:text-red-300 p-1.5"><LogOut size={14} /></button>
              </div>
            </div>
          </header>

          {/* ── TABS BAR ──────────────────────────────────────── */}
          <div className={`flex overflow-x-auto gap-1 px-4 py-2 border-b bg-slate-900/10 ${hdr}`}>
            {tabs.map(({ key, label, icon: Icon, badge }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wide whitespace-nowrap transition-all relative
                  ${activeTab === key ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20' : isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}>
                <Icon size={12} strokeWidth={2.5} /> {label}
                {badge > 0 && <span className="ml-1 bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-black animate-pulse">{badge}</span>}
              </button>
            ))}
          </div>

          {/* ── MAIN CONTENT ─────────────────────────────────── */}
          <div className="p-4 md:p-6 space-y-5">

            {/* ════ OVERVIEW TAB ════ */}
            {activeTab === 'overview' && (
              <div className="space-y-5 animate-slide-up">

                {/* Society Header */}
                <div className={`p-5 rounded-3xl border ${card} relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-purple-500/5 pointer-events-none" />
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-white">
                          <Building2 size={16} />
                        </div>
                        <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">{society?.name}</h2>
                        <span className="text-[9px] font-black px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full uppercase">Active</span>
                      </div>
                      <p className={`text-xs ${sub} font-medium`}>
                        📍 {society?.city} {society?.address ? `• ${society.address}` : ''} {society?.society_code ? `• PIN: ${society.society_code}` : ''}
                      </p>
                    </div>
                    <div className={`flex items-center gap-2 text-[10px] font-black px-3 py-1.5 rounded-xl border ${isDark ? 'bg-violet-500/10 border-violet-500/20 text-violet-400' : 'bg-violet-50 border-violet-200 text-violet-600'}`}>
                      <Shield size={12} /> Society Admin Console
                    </div>
                  </div>
                </div>

                {/* KPI Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {[
                    { label: 'Residents', value: stats?.residents || 0, color: 'from-indigo-500 to-blue-500', icon: Users },
                    { label: 'Guards', value: stats?.guards || 0, color: 'from-orange-500 to-red-500', icon: ShieldCheck },
                    { label: 'Managers', value: stats?.managers || 0, color: 'from-violet-500 to-purple-600', icon: User },
                    { label: 'Technicians', value: stats?.technicians || 0, color: 'from-teal-500 to-emerald-500', icon: Wrench },
                    { label: 'Pending', value: stats?.pending_approvals || 0, color: 'from-amber-500 to-yellow-500', icon: Clock, clickable: true },
                    { label: "Today's Entries", value: stats?.today_entries || 0, color: 'from-rose-500 to-pink-500', icon: Activity },
                  ].map(s => (
                    <div
                      key={s.label}
                      onClick={s.clickable ? () => setActiveTab('approvals') : undefined}
                      className={`border rounded-2xl p-4 flex flex-col gap-2 transition-all hover:scale-[1.02] ${card} ${s.clickable ? 'cursor-pointer' : ''}`}
                    >
                      <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white`}>
                        <s.icon size={15} />
                      </div>
                      <div>
                        <p className="text-xl font-black text-slate-800 dark:text-slate-100 leading-none">{s.value}</p>
                        <p className={`text-[9px] font-bold uppercase tracking-wide mt-1 ${sub}`}>{s.label}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 2-col: Managers + Pending Approvals */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                  {/* Managers snapshot */}
                  <div className={`p-5 rounded-3xl border ${card}`}>
                    <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/40 pb-3 mb-4">
                      <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                        <User size={14} className="text-violet-400" /> Society Managers ({(data.managers || []).length})
                      </h3>
                      <button onClick={() => setActiveTab('managers')} className="text-[9px] font-black text-violet-400 hover:text-violet-300 flex items-center gap-1">
                        Manage all →
                      </button>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {(data.managers || []).slice(0, 5).map(m => (
                        <div key={m.id} className={`flex items-center gap-3 p-2.5 rounded-xl ${isDark ? 'bg-slate-700/30' : 'bg-slate-50'}`}>
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-white font-bold text-xs shrink-0">
                            {m.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-extrabold text-xs truncate">{m.name}</p>
                            <p className={`text-[9px] ${sub}`}>{m.phone}</p>
                          </div>
                          <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${m.account_status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                            {m.account_status}
                          </span>
                        </div>
                      ))}
                      {(data.managers || []).length === 0 && (
                        <p className={`text-xs text-center py-4 ${sub}`}>No managers assigned yet.</p>
                      )}
                    </div>
                  </div>

                  {/* Pending approvals snapshot */}
                  <div className={`p-5 rounded-3xl border ${card}`}>
                    <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/40 pb-3 mb-4">
                      <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                        <Clock size={14} className="text-amber-400" /> Pending Approvals
                        {pendingCount > 0 && <span className="bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-black animate-pulse">{pendingCount}</span>}
                      </h3>
                      <button onClick={() => setActiveTab('approvals')} className="text-[9px] font-black text-amber-400 hover:text-amber-300">
                        Approve all →
                      </button>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {(data.pendingResidents || []).slice(0, 4).map(r => (
                        <div key={r.id} className={`flex items-center gap-3 p-2.5 rounded-xl border ${isDark ? 'bg-amber-500/5 border-amber-500/15' : 'bg-amber-50 border-amber-200'}`}>
                          <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-xs shrink-0">
                            {r.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-extrabold text-xs truncate">{r.name}</p>
                            <p className={`text-[9px] ${sub}`}>{r.tower ? `Tower ${r.tower} - ` : ''}Flat {r.flat_number}</p>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => handleApprove(r.id, 'active')} disabled={actionLoading} className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[9px] font-black">✅</button>
                            <button onClick={() => handleApprove(r.id, 'rejected')} disabled={actionLoading} className="px-2 py-1 bg-red-500/20 text-red-400 rounded-lg text-[9px] font-black">❌</button>
                          </div>
                        </div>
                      ))}
                      {pendingCount === 0 && (
                        <div className="text-center py-4">
                          <CheckCircle size={28} className="mx-auto text-emerald-400 mb-1" />
                          <p className={`text-xs ${sub}`}>All clear! No pending approvals.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Guards online status */}
                <div className={`p-5 rounded-3xl border ${card}`}>
                  <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/40 pb-3 mb-4">
                    <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-orange-400" /> Guards & Security Staff ({(data.guards || []).length})
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        {(data.guards || []).filter(g => g.is_online).length} Online
                      </span>
                      <button onClick={() => setActiveTab('staff')} className="text-[9px] font-black text-orange-400 hover:text-orange-300">
                        Manage →
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {(data.guards || []).slice(0, 6).map(g => (
                      <div key={g.id} className={`flex items-center gap-2.5 p-2.5 rounded-xl ${isDark ? 'bg-slate-700/30' : 'bg-slate-50'}`}>
                        <div className="relative shrink-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${g.role === 'guard' ? 'bg-gradient-to-br from-orange-500 to-red-600' : 'bg-gradient-to-br from-teal-500 to-emerald-600'}`}>
                            {g.name?.charAt(0)?.toUpperCase()}
                          </div>
                          {g.is_online && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-extrabold text-[10px] truncate">{g.name}</p>
                          <div className="flex items-center gap-1">
                            <span className={`text-[8px] font-black capitalize ${g.role === 'guard' ? 'text-orange-400' : 'text-teal-400'}`}>{g.role}</span>
                            <span className={`text-[8px] font-black ${g.is_online ? 'text-emerald-400' : sub}`}>• {g.is_online ? 'Online' : 'Offline'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {(data.guards || []).length === 0 && <p className={`text-xs col-span-3 text-center py-4 ${sub}`}>No guards registered yet.</p>}
                  </div>
                </div>

              </div>
            )}

            {/* ════ APPROVALS TAB ════ */}
            {activeTab === 'approvals' && (
              <div className="space-y-3 max-w-2xl mx-auto">
                <h2 className="font-bold text-base flex items-center gap-2">
                  <Clock size={18} className="text-amber-400" /> Pending Resident Approvals ({pendingCount})
                </h2>
                {(data.pendingResidents || []).length === 0 ? (
                  <div className={`border rounded-2xl p-12 text-center ${card}`}>
                    <CheckCircle size={44} className="mx-auto text-emerald-400 mb-3 opacity-80" />
                    <p className="font-bold text-sm">All Clear!</p>
                    <p className={`text-xs mt-1 ${sub}`}>No pending resident approvals.</p>
                  </div>
                ) : (data.pendingResidents || []).map(r => (
                  <div key={r.id} className={`border rounded-2xl p-4 ${card}`}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold">
                        {r.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{r.name}</p>
                        <p className={`text-xs ${sub}`}>{r.phone} • {r.tower ? `Tower ${r.tower} - ` : ''}Flat {r.flat_number}</p>
                        <p className={`text-[9px] ${sub} mt-0.5`}>Registered: {new Date(r.created_at).toLocaleDateString('en-IN')}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleApprove(r.id, 'active')} disabled={actionLoading}
                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm">
                        {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />} Approve
                      </button>
                      <button onClick={() => handleApprove(r.id, 'rejected')} disabled={actionLoading}
                        className="flex-1 py-2.5 bg-red-500/15 text-red-500 border border-red-500/25 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ════ MANAGERS TAB ════ */}
            {activeTab === 'managers' && (
              <div className="space-y-4 max-w-2xl mx-auto">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-base">Society Managers ({(data.managers || []).length})</h2>
                    <p className={`text-xs ${sub} mt-0.5`}>Managers handle day-to-day operations under you</p>
                  </div>
                  <button onClick={() => setShowAddManager(!showAddManager)}
                    className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md">
                    {showAddManager ? <XCircle size={13} /> : <Plus size={13} />} {showAddManager ? 'Cancel' : 'Add Manager'}
                  </button>
                </div>

                {showAddManager && (
                  <div className={`border rounded-2xl p-5 space-y-3 ${isDark ? 'bg-violet-950/20 border-violet-700/30' : 'bg-violet-50 border-violet-200'}`}>
                    <h4 className="font-bold text-sm text-violet-400 flex items-center gap-2"><UserPlus size={15} /> New Manager Onboarding</h4>
                    <input placeholder="Full Name" value={newManager.name} onChange={e => setNewManager({...newManager, name: e.target.value})}
                      className={`w-full border rounded-xl px-3 py-2.5 text-xs outline-none ${inp}`} />
                    <input placeholder="Phone Number" type="tel" value={newManager.phone} onChange={e => setNewManager({...newManager, phone: e.target.value})}
                      className={`w-full border rounded-xl px-3 py-2.5 text-xs outline-none ${inp}`} />
                    <input placeholder="Password (default: 123456)" type="password" value={newManager.password} onChange={e => setNewManager({...newManager, password: e.target.value})}
                      className={`w-full border rounded-xl px-3 py-2.5 text-xs outline-none ${inp}`} />
                    <button onClick={handleAddManager} disabled={actionLoading}
                      className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md">
                      {actionLoading ? <Loader2 className="animate-spin" size={14} /> : 'Create Manager Account'}
                    </button>
                  </div>
                )}

                <div className="space-y-2">
                  {(data.managers || []).map(m => (
                    <div key={m.id} className={`border rounded-2xl p-4 flex items-center justify-between ${card}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-white font-bold text-sm">
                          {m.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{m.name}</p>
                          <p className={`text-xs ${sub}`}>{m.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase border ${m.account_status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                          {m.account_status}
                        </span>
                        <button onClick={() => handleDeleteManager(m.id)} className="text-red-400 hover:text-red-300 p-1.5"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                  {(data.managers || []).length === 0 && (
                    <div className={`border rounded-2xl p-10 text-center ${card}`}>
                      <User size={32} className="mx-auto opacity-30 mb-2" />
                      <p className={`text-xs ${sub}`}>No managers assigned yet. Add one above.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ════ STAFF & GUARDS TAB ════ */}
            {activeTab === 'staff' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-base">Guards & Staff ({(data.guards || []).length})</h2>
                    <p className={`text-xs ${sub} mt-0.5`}>Security guards and technicians</p>
                  </div>
                  <button onClick={() => setShowAddStaff(!showAddStaff)}
                    className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md">
                    {showAddStaff ? <XCircle size={13} /> : <Plus size={13} />} {showAddStaff ? 'Cancel' : 'Add Guard'}
                  </button>
                </div>

                {showAddStaff && (
                  <div className={`border rounded-2xl p-5 space-y-3 ${isDark ? 'bg-orange-950/20 border-orange-700/30' : 'bg-orange-50 border-orange-200'}`}>
                    <h4 className="font-bold text-sm text-orange-400">Register Guard / Technician</h4>
                    <input placeholder="Full Name" value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})}
                      className={`w-full border rounded-xl px-3 py-2.5 text-xs outline-none ${inp}`} />
                    <input placeholder="Phone" value={newStaff.phone} onChange={e => setNewStaff({...newStaff, phone: e.target.value})}
                      className={`w-full border rounded-xl px-3 py-2.5 text-xs outline-none ${inp}`} />
                    <select value={newStaff.role} onChange={e => setNewStaff({...newStaff, role: e.target.value})}
                      className={`w-full border rounded-xl px-3 py-2.5 text-xs outline-none ${inp}`}>
                      <option value="guard">Security Guard</option>
                      <option value="technician">Technician</option>
                    </select>
                    <input placeholder="Password (default: 123456)" type="password" value={newStaff.password} onChange={e => setNewStaff({...newStaff, password: e.target.value})}
                      className={`w-full border rounded-xl px-3 py-2.5 text-xs outline-none ${inp}`} />
                    <button onClick={handleAddStaff} disabled={actionLoading}
                      className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md">
                      {actionLoading ? <Loader2 className="animate-spin" size={14} /> : 'Register Staff'}
                    </button>
                  </div>
                )}

                {/* Online / Offline pills */}
                <div className="flex gap-2 flex-wrap">
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full border ${isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                    🟢 {(data.guards || []).filter(g => g.is_online).length} Online
                  </span>
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full border ${isDark ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                    ⚫ {(data.guards || []).filter(g => !g.is_online).length} Offline
                  </span>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                  <input placeholder="Search guards..." value={staffSearch} onChange={e => setStaffSearch(e.target.value)}
                    className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs outline-none ${inp}`} />
                </div>

                <div className="space-y-2">
                  {filteredStaff.map(g => (
                    <div key={g.id} className={`border rounded-2xl p-4 flex items-center justify-between ${card}`}>
                      <div className="flex items-center gap-3">
                        <div className={`relative w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${g.role === 'guard' ? 'bg-gradient-to-br from-orange-500 to-red-600' : 'bg-gradient-to-br from-teal-500 to-emerald-600'}`}>
                          {g.name?.charAt(0)?.toUpperCase()}
                          {g.is_online && <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full" />}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{g.name}</p>
                          <p className={`text-xs ${sub} capitalize`}>{g.role} • {g.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {g.is_online
                          ? <span className="flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><Wifi size={8} /> Online</span>
                          : <span className="flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20"><WifiOff size={8} /> Offline</span>
                        }
                      </div>
                    </div>
                  ))}
                  {filteredStaff.length === 0 && (
                    <div className={`border rounded-2xl p-10 text-center ${card}`}>
                      <ShieldCheck size={32} className="mx-auto opacity-30 mb-2" />
                      <p className={`text-xs ${sub}`}>No guards found.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ════ RESIDENTS TAB ════ */}
            {activeTab === 'residents' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="font-bold text-base">Residents ({filteredResidents.length}/{(data.residents || []).length})</h2>
                    <p className={`text-xs ${sub} mt-0.5`}>All active residents in {society?.name}</p>
                  </div>
                </div>

                {/* Stats pills */}
                <div className="flex flex-wrap gap-2">
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full border ${isDark ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-indigo-50 text-indigo-600 border-indigo-200'}`}>
                    👥 {(data.residents || []).length} Residents
                  </span>
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full border ${isDark ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                    🚗 {(data.residents || []).reduce((a, r) => a + (r.vehicles ? r.vehicles.split(',').filter(Boolean).length : 0), 0)} Vehicles
                  </span>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                  <input placeholder="Search by name, flat, phone, vehicle..." value={residentSearch} onChange={e => setResidentSearch(e.target.value)}
                    className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs outline-none ${inp}`} />
                </div>

                <div className="space-y-2">
                  {filteredResidents.map(r => (
                    <div key={r.id} className={`border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between ${card}`}>
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${r.role === 'resident_primary' ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-gradient-to-br from-slate-500 to-slate-600'}`}>
                          {r.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-extrabold text-sm truncate">{r.name}</p>
                            {r.role === 'resident_primary' && (
                              <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase shrink-0">Primary</span>
                            )}
                          </div>
                          <p className={`text-[10px] ${sub} font-medium`}>
                            {r.phone} {r.tower ? `• Tower ${r.tower}` : ''} {r.flat_number ? `• Flat ${r.flat_number}` : ''}
                          </p>
                        </div>
                      </div>
                      {/* Vehicles */}
                      <div className="flex flex-wrap gap-1">
                        {r.vehicles ? r.vehicles.split(',').filter(Boolean).map((v, i) => (
                          <span key={i} className={`flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full ${isDark ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-blue-50 text-blue-600 border border-blue-200'}`}>
                            <Car size={9} /> {v.trim()}
                          </span>
                        )) : (
                          <span className={`text-[9px] font-semibold italic ${sub}`}>No vehicle</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {filteredResidents.length === 0 && (
                    <div className={`border rounded-2xl p-10 text-center ${card}`}>
                      <Users size={32} className="mx-auto opacity-30 mb-2" />
                      <p className={`text-xs ${sub}`}>No residents found.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ════ GATE LOGS TAB ════ */}
            {activeTab === 'logs' && (
              <div className="space-y-3 max-w-2xl mx-auto">
                <h2 className="font-bold text-base flex items-center gap-2">
                  <Activity size={16} className="text-violet-400" /> Gate Entry Logs
                </h2>
                {(data.recentLogs || []).length === 0 ? (
                  <div className={`border rounded-2xl p-10 text-center ${card}`}>
                    <Activity size={36} className="mx-auto opacity-30 mb-2" />
                    <p className={`text-sm ${sub}`}>No gate movements recorded yet.</p>
                  </div>
                ) : (data.recentLogs || []).map(log => (
                  <div key={log.id} className={`border rounded-2xl p-4 ${card}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm ${log.entity_type === 'vehicle' ? 'bg-blue-500/10' : 'bg-emerald-500/10'}`}>
                          {log.entity_type === 'vehicle' ? '🚗' : '🧑'}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{log.entity_name || 'Unknown'}</p>
                          <p className={`text-xs ${sub} capitalize`}>{log.entity_type} • {log.gate_number || 'Gate 1'} • Guard: {log.guard_name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold">{new Date(log.entry_time).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                        {log.exit_time
                          ? <span className="text-[9px] text-red-400 font-black uppercase">Exited</span>
                          : <span className="text-[9px] text-emerald-400 font-black uppercase">Inside 🟢</span>
                        }
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ════ NOTICES TAB ════ */}
            {activeTab === 'notices' && (
              <div className="max-w-2xl mx-auto">
                <AnnouncementBoard user={user} />
              </div>
            )}

          </div>
        </div>
      </div>

      <UserProfile isOpen={showProfile} onClose={() => setShowProfile(false)} />
    </div>
  );
};

export default AdminDashboard;
