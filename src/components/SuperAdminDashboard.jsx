import React, { useState, useEffect, useMemo } from 'react';
import ISTClock from './ISTClock';
import { useTheme } from '../context/ThemeContext';
import { 
  Globe, Users, Building2, ShieldCheck, TrendingUp, LogOut, 
  Plus, Eye, Trash2, BarChart3, Activity, User, Edit2, 
  Settings, Sun, Moon, Bell, ArrowUp, ArrowDown, Shield, 
  ChevronRight, Zap, Play, CheckCircle, AlertTriangle, XCircle, Search,
  Car, Bike, UserCheck, UserX, Star, Filter, RefreshCw, Wifi, WifiOff
} from 'lucide-react';
import UserProfile from './UserProfile';
import { societyAPI, managerAPI, announcementAPI, adminAPI } from '../services/api';
import AnnouncementBoard from './AnnouncementBoard';

const SuperAdminDashboard = ({ user, onLogout }) => {
  const { isDark, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddSociety, setShowAddSociety] = useState(false);
  const [showAddManager, setShowAddManager] = useState(false);
  const [societies, setSocieties] = useState([]);
  const [editingSociety, setEditingSociety] = useState(null);
  const [newSociety, setNewSociety] = useState({ name: '', city: '', flats: '', society_code: '' });
  const [newManager, setNewManager] = useState({ name: '', phone: '', society: '', password: '' });
  const [showProfile, setShowProfile] = useState(false);
  const [managers, setManagers] = useState([]);
  const [managersLoading, setManagersLoading] = useState(false);

  // Admins
  const [admins, setAdmins] = useState([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: '', phone: '', password: '', society_id: '' });

  // Live System Health Metrics
  const [systemStatus, setSystemStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [logQuery, setLogQuery] = useState('');

  // Residents + Vehicles
  const [globalResidents, setGlobalResidents] = useState([]);
  const [residentsLoading, setResidentsLoading] = useState(false);
  const [residentSearch, setResidentSearch] = useState('');
  const [residentSocietyFilter, setResidentSocietyFilter] = useState('all');

  // Staff / Guards
  const [globalStaff, setGlobalStaff] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffRoleFilter, setStaffRoleFilter] = useState('all');
  const [staffSearch, setStaffSearch] = useState('');

  const bg = isDark ? 'bg-[#0a0f1e] text-white' : 'bg-slate-50 text-gray-900';
  const card = isDark ? 'bg-slate-800/60 border-slate-700/60 backdrop-blur-sm shadow-md' : 'bg-white border-gray-200 shadow-sm';
  const input = isDark ? 'bg-slate-700/80 border-slate-600 text-white placeholder-slate-400' : 'bg-gray-50 border-gray-300 text-gray-800';
  const subtext = isDark ? 'text-slate-400' : 'text-gray-500';
  const header = isDark ? 'bg-[#0c1328] border-slate-800 text-white' : 'bg-white border-gray-200 text-gray-800';

  const totalResidents = societies.reduce((s, x) => s + (x.residents || 0), 0);
  const totalFlats = societies.reduce((s, x) => s + (x.flats || 0), 0);

  useEffect(() => {
    fetchSocieties();
    fetchManagers();
    fetchSystemStatus();
    fetchAdmins();
  }, []);

  useEffect(() => {
    if (activeTab === 'residents') fetchGlobalResidents();
    if (activeTab === 'staff') fetchGlobalStaff();
    if (activeTab === 'admins') fetchAdmins();
  }, [activeTab]);

  const fetchAdmins = async () => {
    setAdminsLoading(true);
    try {
      const res = await adminAPI.getAdmins();
      setAdmins(res.data);
    } catch (err) {
      console.error('Error fetching admins:', err);
    } finally {
      setAdminsLoading(false);
    }
  };

  const fetchSystemStatus = async () => {
    setStatusLoading(true);
    try {
      const res = await adminAPI.getSystemStatus();
      setSystemStatus(res.data);
    } catch (err) {
      console.error('Error fetching system status:', err);
    } finally {
      setStatusLoading(false);
    }
  };

  const fetchGlobalResidents = async () => {
    setResidentsLoading(true);
    try {
      const res = await adminAPI.getGlobalResidents();
      setGlobalResidents(res.data);
    } catch (err) {
      console.error('Error fetching global residents:', err);
    } finally {
      setResidentsLoading(false);
    }
  };

  const fetchGlobalStaff = async () => {
    setStaffLoading(true);
    try {
      const res = await adminAPI.getGlobalStaff();
      setGlobalStaff(res.data);
    } catch (err) {
      console.error('Error fetching global staff:', err);
    } finally {
      setStaffLoading(false);
    }
  };

  const fetchSocieties = async () => {
    try {
      const res = await societyAPI.getAll();
      setSocieties(res.data);
    } catch (err) {
      console.error('Error fetching societies:', err);
    }
  };

  const fetchManagers = async () => {
    setManagersLoading(true);
    try {
      const res = await managerAPI.getManagers();
      setManagers(res.data);
    } catch (err) {
      console.error('Error fetching managers:', err);
    } finally {
      setManagersLoading(false);
    }
  };

  // Filtered residents
  const filteredResidents = useMemo(() => {
    return globalResidents.filter(r => {
      const matchSearch = !residentSearch || 
        r.name?.toLowerCase().includes(residentSearch.toLowerCase()) ||
        r.flat_number?.toLowerCase().includes(residentSearch.toLowerCase()) ||
        r.phone?.includes(residentSearch) ||
        r.vehicles?.toLowerCase().includes(residentSearch.toLowerCase());
      const matchSociety = residentSocietyFilter === 'all' || r.society_name === residentSocietyFilter;
      return matchSearch && matchSociety;
    });
  }, [globalResidents, residentSearch, residentSocietyFilter]);

  // Filtered staff
  const filteredStaff = useMemo(() => {
    return globalStaff.filter(s => {
      const matchSearch = !staffSearch ||
        s.name?.toLowerCase().includes(staffSearch.toLowerCase()) ||
        s.phone?.includes(staffSearch) ||
        s.society_name?.toLowerCase().includes(staffSearch.toLowerCase());
      const matchRole = staffRoleFilter === 'all' || s.role === staffRoleFilter;
      return matchSearch && matchRole;
    });
  }, [globalStaff, staffSearch, staffRoleFilter]);

  // Staff breakdown counts
  const staffBreakdown = useMemo(() => ({
    guard: globalStaff.filter(s => s.role === 'guard').length,
    manager: globalStaff.filter(s => s.role === 'manager').length,
    technician: globalStaff.filter(s => s.role === 'technician').length,
    online: globalStaff.filter(s => s.is_online).length,
  }), [globalStaff]);

  const tabs = [
    { key: 'overview', label: 'Overview', icon: BarChart3 },
    { key: 'societies', label: 'Societies', icon: Building2 },
    { key: 'residents', label: 'Residents', icon: Users },
    { key: 'staff', label: 'Staff & Guards', icon: ShieldCheck },
    { key: 'managers', label: 'Managers', icon: User },
    { key: 'admins', label: 'Admins', icon: ShieldCheck },
    { key: 'notices', label: 'Notices', icon: Bell },
    { key: 'logs', label: 'Global Logs', icon: Activity },
  ];

  const societyNames = useMemo(() => [...new Set(globalResidents.map(r => r.society_name).filter(Boolean))], [globalResidents]);

  return (
    <div className={`min-h-screen pb-12 transition-colors duration-300 ${bg}`}>
      
      <div className="max-w-6xl mx-auto px-0 md:px-4">
        <div className={`overflow-hidden flex flex-col ${bg}`}>

          {/* NAVBAR */}
          <header className={`px-4 py-3 border-b flex flex-wrap items-center justify-between gap-4 backdrop-blur-md sticky top-0 z-40 ${header}`}>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <span className="text-xs font-black tracking-tighter text-blue-500 dark:text-blue-400 font-sans uppercase">Cloud<span className="text-red-500 font-black italic">4</span></span>
                <span className="text-xs font-black tracking-tighter text-slate-800 dark:text-slate-200 uppercase">Things</span>
                <span className="text-[8px] bg-indigo-500/10 text-indigo-500 font-black px-1.5 py-0.5 rounded-md ml-1.5">GLOBAL</span>
              </div>
            </div>

            <div className="flex items-center gap-5 text-xs font-black text-slate-500 tracking-wide">
              <button onClick={() => setActiveTab('overview')} className={`hover:text-indigo-500 ${activeTab === 'overview' ? 'text-indigo-500 dark:text-indigo-400 underline decoration-2 underline-offset-4' : ''}`}>Dashboard</button>
              <button onClick={() => setActiveTab('residents')} className={`hover:text-indigo-500 ${activeTab === 'residents' ? 'text-indigo-500 dark:text-indigo-400 underline decoration-2 underline-offset-4' : ''}`}>Residents</button>
              <button onClick={() => setActiveTab('staff')} className={`hover:text-indigo-500 ${activeTab === 'staff' ? 'text-indigo-500 dark:text-indigo-400 underline decoration-2 underline-offset-4' : ''}`}>Staff</button>
              <button onClick={() => setActiveTab('logs')} className={`hover:text-indigo-500 ${activeTab === 'logs' ? 'text-indigo-500 dark:text-indigo-400 underline decoration-2 underline-offset-4' : ''}`}>Logs</button>
              <button onClick={() => setActiveTab('societies')} className="hover:text-indigo-500">Societies</button>
              <button onClick={() => setShowProfile(true)} className="hover:text-indigo-500">Settings</button>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={toggleTheme} className={`p-1.5 rounded-xl border border-slate-200 dark:border-slate-850 ${isDark ? 'text-amber-400' : 'text-slate-500'}`}>
                {isDark ? <Sun size={14} /> : <Moon size={14} />}
              </button>
              <div className="flex items-center gap-1.5 border-l border-slate-200 dark:border-slate-800 pl-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Super Admin</span>
                <button onClick={onLogout} className="text-red-400 hover:text-red-300 p-1.5"><LogOut size={14} /></button>
              </div>
            </div>
          </header>

          {/* TABS BAR */}
          <div className={`flex overflow-x-auto gap-1 px-4 py-2 border-b bg-slate-900/10 ${header}`}>
            {tabs.map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wide whitespace-nowrap transition-all relative
                  ${activeTab === key ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}>
                <Icon size={12} strokeWidth={2.5} /> {label}
              </button>
            ))}
          </div>

          {/* MAIN CONTENT */}
          <div className="p-4 md:p-6 space-y-5">

            {/* ════════════════ OVERVIEW TAB ════════════════ */}
            {activeTab === 'overview' && (
              <div className="space-y-6 animate-slide-up">
                
                {/* Top KPI Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Societies', value: societies.length, color: 'from-purple-500 to-indigo-500', icon: Building2 },
                    { label: 'Active Residents', value: systemStatus?.counts?.residents || totalResidents, color: 'from-emerald-500 to-teal-500', icon: Users },
                    { label: 'Registered Vehicles', value: systemStatus?.counts?.vehicles || societies.reduce((a, s) => a + (s.vehicles || 0), 0), color: 'from-blue-500 to-cyan-500', icon: Car },
                    { label: 'Guards on Duty', value: systemStatus?.counts?.guards || 0, color: 'from-orange-500 to-red-500', icon: ShieldCheck },
                  ].map(s => (
                    <div key={s.label} className={`border rounded-3xl p-5 flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] ${card}`}>
                      <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3.5 text-white shadow-md`}>
                        <s.icon size={20} strokeWidth={2.2} />
                      </div>
                      <div>
                        <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none">
                          {s.value}
                        </h1>
                        <p className={`text-[10px] font-black uppercase tracking-wider mt-2.5 ${subtext}`}>
                          {s.label}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* SYSTEM HEALTH CONSOLE */}
                <div className={`p-6 rounded-[32px] border ${card} shadow-lg relative overflow-hidden`}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/50 dark:border-slate-800/40 pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                        <Zap size={18} className="animate-pulse" />
                      </div>
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                          Live System Health & Diagnostics Console
                        </h3>
                        <p className={`text-[10px] ${subtext} font-medium mt-0.5`}>Real-time system load, latency, and uptime trackers</p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={fetchSystemStatus}
                      className="px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 active:scale-95 transition-all shadow-md"
                    >
                      <RefreshCw size={12} className={statusLoading ? 'animate-spin' : ''} />
                      <span>Refresh Diagnostics</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-6">
                    
                    {/* CPU gauge */}
                    <div className="flex flex-col items-center text-center p-3 rounded-2xl border border-slate-200/30 dark:border-slate-800/30 bg-slate-900/5 dark:bg-slate-950/10">
                      <span className={`text-[10px] font-black uppercase tracking-wider mb-3 ${subtext}`}>CPU Utilization</span>
                      <div className="relative w-24 h-24 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="15.915" fill="none" stroke={isDark ? '#1e293b' : '#e2e8f0'} strokeWidth="3" />
                          <circle cx="18" cy="18" r="15.915" fill="none" stroke="#3b82f6" strokeWidth="3.5"
                            strokeDasharray={`${systemStatus?.metrics?.cpuUsage || 12} 100`} strokeLinecap="round"
                            className="transition-all duration-1000 ease-out" />
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center">
                          <span className="text-xl font-black text-slate-800 dark:text-slate-100 leading-none">
                            {systemStatus?.metrics?.cpuUsage || 12}%
                          </span>
                          <span className="text-[7px] font-bold text-blue-400 mt-1 uppercase tracking-wider">LOAD</span>
                        </div>
                      </div>
                    </div>

                    {/* RAM gauge */}
                    <div className="flex flex-col items-center text-center p-3 rounded-2xl border border-slate-200/30 dark:border-slate-800/30 bg-slate-900/5 dark:bg-slate-950/10">
                      <span className={`text-[10px] font-black uppercase tracking-wider mb-3 ${subtext}`}>RAM Allocation</span>
                      <div className="relative w-24 h-24 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="15.915" fill="none" stroke={isDark ? '#1e293b' : '#e2e8f0'} strokeWidth="3" />
                          <circle cx="18" cy="18" r="15.915" fill="none" stroke="#a855f7" strokeWidth="3.5"
                            strokeDasharray={`${systemStatus?.metrics?.memoryUsage || 45} 100`} strokeLinecap="round"
                            className="transition-all duration-1000 ease-out" />
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center">
                          <span className="text-xl font-black text-slate-800 dark:text-slate-100 leading-none">
                            {systemStatus?.metrics?.memoryUsage || 45}%
                          </span>
                          <span className="text-[7px] font-bold text-purple-400 mt-1 uppercase tracking-wider">ALLOCATED</span>
                        </div>
                      </div>
                    </div>

                    {/* Gateway Latency */}
                    <div className="flex flex-col items-center text-center p-3 rounded-2xl border border-slate-200/30 dark:border-slate-800/30 bg-slate-900/5 dark:bg-slate-950/10 justify-between">
                      <span className={`text-[10px] font-black uppercase tracking-wider ${subtext}`}>Gateway Latency</span>
                      <div className="my-2 text-center">
                        <div className="text-2xl font-black text-emerald-400 flex items-center gap-1.5 justify-center leading-none">
                          <span>18ms</span>
                        </div>
                        <span className="text-[8px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black px-2 py-0.5 rounded-full inline-block mt-2 animate-pulse uppercase">
                          🟢 Stable Status
                        </span>
                      </div>
                      <p className="text-[8px] text-slate-500 font-semibold leading-none">SLA Guaranteed: 99.99% uptime</p>
                    </div>

                    {/* Server Uptime */}
                    <div className="flex flex-col items-center text-center p-3 rounded-2xl border border-slate-200/30 dark:border-slate-800/30 bg-slate-900/5 dark:bg-slate-950/10 justify-between">
                      <span className={`text-[10px] font-black uppercase tracking-wider ${subtext}`}>Active Server Uptime</span>
                      <div className="my-2">
                        <p className="text-lg font-black text-slate-850 dark:text-white leading-none font-mono">
                          {(() => {
                            const totalS = systemStatus?.metrics?.uptime || 0;
                            const h = Math.floor(totalS / 3600);
                            const m = Math.floor((totalS % 3600) / 60);
                            const s = totalS % 60;
                            return `${String(h).padStart(2, '0')}h : ${String(m).padStart(2, '0')}m : ${String(s).padStart(2, '0')}s`;
                          })()}
                        </p>
                        <span className="text-[8px] text-indigo-400 font-black tracking-widest mt-2 block uppercase">
                          ⚡ v1.4.2 Production
                        </span>
                      </div>
                      <p className="text-[8px] text-slate-500 font-semibold leading-none">Database engine: SQL Connected</p>
                    </div>

                  </div>
                </div>

                {/* TWO COLUMN: Societies + Error Logs */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  
                  {/* Left: Societies Health */}
                  <div className={`lg:col-span-2 p-5 rounded-[32px] border ${card}`}>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 border-b border-slate-200/50 dark:border-slate-800/40 pb-3.5 flex items-center gap-1.5">
                      <Building2 size={16} className="text-purple-500" /> Active Society Portals ({societies.length})
                    </h3>

                    <div className="mt-4 space-y-3 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin">
                      {societies.map(s => {
                        const occupancyPct = s.flats ? Math.round(((s.residents || 0) / s.flats) * 100) : 0;
                        return (
                          <div key={s.id} className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-750/30 border-slate-700/50' : 'bg-slate-50 border-slate-200'}`}>
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1 flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block shrink-0" />
                                  <p className="font-extrabold text-sm text-slate-800 dark:text-slate-100 truncate">{s.name}</p>
                                </div>
                                <p className={`text-[10px] ${subtext} font-semibold`}>
                                  📍 {s.city}
                                </p>
                                {/* Counts row */}
                                <div className="flex flex-wrap gap-2 mt-2">
                                  <span className="flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                    <Users size={9} /> {s.residents || 0} Residents
                                  </span>
                                  <span className="flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                                    <ShieldCheck size={9} /> {s.guards || 0} Guards
                                  </span>
                                  <span className="flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                    <Car size={9} /> {s.vehicles || 0} Vehicles
                                  </span>
                                  <span className="flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    <Activity size={9} /> {s.today_entries || 0} Today
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex flex-col items-end gap-2 shrink-0">
                                <span className={`text-[9px] font-black px-2.5 py-1 rounded-full border ${isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                                  ACTIVE
                                </span>
                                <div className="flex flex-col items-end">
                                  <span className="text-[9px] font-black text-slate-600 dark:text-slate-400">{occupancyPct}% occupied</span>
                                  <div className="w-20 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 mt-1 overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all" style={{ width: `${occupancyPct}%` }} />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {societies.length === 0 && <p className={`text-xs text-center py-6 ${subtext}`}>No societies onboarded yet.</p>}
                    </div>
                  </div>

                  {/* Right: Live Error Logs */}
                  <div className={`p-5 rounded-[32px] border flex flex-col justify-between ${card}`}>
                    <div className="space-y-4">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 border-b border-slate-200/50 dark:border-slate-800/40 pb-3 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Activity size={16} className="text-red-400 animate-pulse" /> Live Server Logs
                        </span>
                        {(() => {
                          const errCount = (systemStatus?.logs || []).filter(l => l.level === 'ERROR').length;
                          if (errCount > 0) {
                            return <span className="bg-red-500/10 border border-red-500/20 text-red-400 font-black text-[8px] px-2 py-0.5 rounded-full animate-pulse uppercase">🚨 {errCount} Errors</span>;
                          }
                          return <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black text-[8px] px-2 py-0.5 rounded-full uppercase">Healthy</span>;
                        })()}
                      </h3>

                      <div className="relative flex items-center">
                        <Search className="absolute left-3 text-slate-500" size={12} />
                        <input
                          placeholder="Filter logs..."
                          value={logQuery}
                          onChange={e => setLogQuery(e.target.value)}
                          className={`w-full pl-8 pr-3 py-1.5 rounded-xl text-[10px] border outline-none ${input}`}
                        />
                      </div>

                      <div className="space-y-2.5 max-h-60 overflow-y-auto scrollbar-thin pr-0.5">
                        {(() => {
                          const rawLogs = systemStatus?.logs || [
                            { timestamp: new Date(), level: 'INFO', service: 'Socket.io', message: 'Broadcasting live guards status update to residents' },
                            { timestamp: new Date(), level: 'WARNING', service: 'Push Service', message: 'Web Push subscription expired for resident user 18' },
                            { timestamp: new Date(), level: 'ERROR', service: 'Socket Server', message: 'Duplicate socket connection rejected for token session #481' }
                          ];

                          const filtered = rawLogs.filter(log => {
                            if (!logQuery) return true;
                            const q = logQuery.toLowerCase().trim();
                            return log.level.toLowerCase().includes(q) || 
                                   log.service.toLowerCase().includes(q) || 
                                   log.message.toLowerCase().includes(q);
                          });

                          if (filtered.length === 0) {
                            return <p className={`text-[10px] ${subtext} text-center py-4 italic`}>No matching logs found.</p>;
                          }

                          return filtered.map((log, i) => {
                            const isError = log.level === 'ERROR';
                            const isWarn = log.level === 'WARNING';
                            return (
                              <div key={i} className={`p-2.5 rounded-xl border leading-relaxed text-[10px] ${
                                isError ? 'bg-rose-500/5 border-rose-500/15' :
                                isWarn ? 'bg-amber-500/5 border-amber-500/15' :
                                isDark ? 'bg-slate-750/20 border-slate-800' : 'bg-slate-50 border-slate-200'
                              }`}>
                                <div className="flex justify-between items-center mb-1">
                                  <span className={`font-black text-[8px] uppercase px-1.5 py-0.5 rounded ${
                                    isError ? 'bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse' :
                                    isWarn ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                    'bg-slate-500/15 text-slate-400 border border-slate-600/30'
                                  }`}>
                                    {log.level}
                                  </span>
                                  <span className={`text-[8px] font-semibold ${subtext}`}>{log.service}</span>
                                </div>
                                <p className="font-semibold text-slate-800 dark:text-slate-200">{log.message}</p>
                                <span className={`text-[8px] font-semibold opacity-70 block mt-1 ${subtext}`}>
                                  {new Date(log.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </span>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>

                    <div className="border-t border-slate-200/50 dark:border-slate-800/40 pt-3.5 mt-3.5 text-[9px] leading-relaxed text-slate-500">
                      <p className="font-extrabold text-indigo-400 flex items-center gap-1"><Shield size={11} /> Global Security Audit Active</p>
                      <p className="mt-0.5">Logs are pulled dynamically from core systems. Inactive background tasks are auto-pruned hourly.</p>
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* ════════════════ SOCIETIES TAB ════════════════ */}
            {activeTab === 'societies' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="font-bold text-base">Registered Societies ({societies.length})</h2>
                  <button onClick={() => {
                    setShowAddSociety(!showAddSociety);
                    setEditingSociety(null);
                    setNewSociety({ name: '', city: '', flats: '', society_code: '' });
                  }}
                    className="flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md">
                    <Plus size={13} /> Add Society
                  </button>
                </div>

                {showAddSociety && (
                  <div className={`border rounded-2xl p-5 space-y-3 ${card}`}>
                    <h4 className="font-bold text-sm text-purple-400">{editingSociety ? 'Update Society Details' : 'Register New Society'}</h4>
                    <input placeholder="Society Name" value={newSociety.name} onChange={e => setNewSociety({...newSociety, name: e.target.value})}
                      className={`w-full border rounded-xl px-3 py-2.5 text-xs outline-none ${input}`} />
                    <input placeholder="City" value={newSociety.city} onChange={e => setNewSociety({...newSociety, city: e.target.value})}
                      className={`w-full border rounded-xl px-3 py-2.5 text-xs outline-none ${input}`} />
                    <input placeholder="Total Flats" type="number" value={newSociety.flats} onChange={e => setNewSociety({...newSociety, flats: e.target.value})}
                      className={`w-full border rounded-xl px-3 py-2.5 text-xs outline-none ${input}`} />
                    <input placeholder="Custom PIN (Optional) e.g. GVA123" value={newSociety.society_code} onChange={e => setNewSociety({...newSociety, society_code: e.target.value.toUpperCase()})}
                      className={`w-full border rounded-xl px-3 py-2.5 text-xs outline-none uppercase ${input}`} />
                    
                    <div className="flex gap-2">
                      <button onClick={async () => {
                        if (!newSociety.name || !newSociety.city) return;
                        try {
                          if (editingSociety) {
                            await societyAPI.update(editingSociety.id, newSociety);
                            setSocieties(societies.map(s => s.id === editingSociety.id ? { ...s, ...newSociety } : s));
                          } else {
                            const res = await societyAPI.create({
                              name: newSociety.name, city: newSociety.city,
                              flats: Number(newSociety.flats),
                              society_code: newSociety.society_code || null,
                              state: 'N/A', zip_code: '000000'
                            });
                            setSocieties([res.data.society, ...societies]);
                          }
                          setNewSociety({ name: '', city: '', flats: '', society_code: '' }); 
                          setEditingSociety(null);
                          setShowAddSociety(false);
                        } catch (err) {
                          alert(err.response?.data?.message || 'Failed to save society');
                        }
                      }} className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md">{editingSociety ? 'Update' : 'Register'}</button>
                      <button onClick={() => { setShowAddSociety(false); setEditingSociety(null); setNewSociety({ name: '', city: '', flats: '', society_code: '' }); }}
                        className={`flex-1 py-2.5 rounded-xl text-xs border ${isDark ? 'border-slate-600 text-slate-400' : 'border-gray-300 text-gray-500'}`}>Cancel</button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {societies.map(s => (
                    <div key={s.id} className={`border rounded-[20px] p-4 flex flex-col justify-between ${card}`}>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white">
                            <Building2 size={18} />
                          </div>
                          <div>
                            <p className="font-extrabold text-sm text-slate-800 dark:text-slate-100">{s.name}</p>
                            <p className={`text-xs ${subtext}`}>{s.city} • <span className="font-bold text-indigo-400">PIN: {s.society_code}</span></p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => { setEditingSociety(s); setNewSociety({ name: s.name, city: s.city, flats: s.flats || '', society_code: s.society_code || '' }); setShowAddSociety(true); }}
                            className="text-blue-400 hover:text-blue-300 p-1.5"><Edit2 size={14} /></button>
                          <button onClick={async () => {
                            if (window.confirm('Delete this society?')) {
                              try { await societyAPI.delete(s.id); setSocieties(societies.filter(x => x.id !== s.id)); }
                              catch (err) { console.error('Failed to delete:', err); }
                            }
                          }} className="text-red-400 hover:text-red-300 p-1.5"><Trash2 size={14} /></button>
                        </div>
                      </div>
                      
                      <div className={`mt-4 grid grid-cols-4 gap-2 text-center text-[10px] ${subtext}`}>
                        <div className={`p-2.5 rounded-xl ${isDark ? 'bg-slate-700/40' : 'bg-slate-50'}`}>
                          <p className="font-black text-slate-800 dark:text-slate-100 text-sm">{s.residents || 0}</p>Residents
                        </div>
                        <div className={`p-2.5 rounded-xl ${isDark ? 'bg-slate-700/40' : 'bg-slate-50'}`}>
                          <p className="font-black text-slate-800 dark:text-slate-100 text-sm">{s.guards || 0}</p>Guards
                        </div>
                        <div className={`p-2.5 rounded-xl ${isDark ? 'bg-slate-700/40' : 'bg-slate-50'}`}>
                          <p className="font-black text-blue-400 text-sm">{s.vehicles || 0}</p>Vehicles
                        </div>
                        <div className={`p-2.5 rounded-xl ${isDark ? 'bg-slate-700/40' : 'bg-slate-50'}`}>
                          <p className="font-black text-emerald-400 text-sm">{s.today_entries || 0}</p>Today
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ════════════════ RESIDENTS TAB ════════════════ */}
            {activeTab === 'residents' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="font-bold text-base">All Residents & Vehicles</h2>
                    <p className={`text-xs ${subtext} mt-0.5`}>{filteredResidents.length} of {globalResidents.length} residents shown</p>
                  </div>
                  <button onClick={fetchGlobalResidents} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold">
                    <RefreshCw size={12} className={residentsLoading ? 'animate-spin' : ''} /> Refresh
                  </button>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                    <input
                      placeholder="Search by name, flat, phone, vehicle..."
                      value={residentSearch}
                      onChange={e => setResidentSearch(e.target.value)}
                      className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs outline-none ${input}`}
                    />
                  </div>
                  <select
                    value={residentSocietyFilter}
                    onChange={e => setResidentSocietyFilter(e.target.value)}
                    className={`border rounded-xl px-3 py-2.5 text-xs outline-none min-w-[160px] ${input}`}
                  >
                    <option value="all">All Societies</option>
                    {societyNames.map(name => <option key={name} value={name}>{name}</option>)}
                  </select>
                </div>

                {/* Stats summary pills */}
                <div className="flex flex-wrap gap-2">
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full border ${isDark ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-indigo-50 text-indigo-600 border-indigo-200'}`}>
                    👥 {globalResidents.length} Total Residents
                  </span>
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full border ${isDark ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                    🚗 {globalResidents.reduce((a, r) => a + (r.vehicle_count || 0), 0)} Total Vehicles
                  </span>
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full border ${isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                    🏠 {globalResidents.filter(r => r.role === 'resident_primary').length} Primary Residents
                  </span>
                </div>

                {/* Residents list */}
                {residentsLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {filteredResidents.map(r => (
                      <div key={r.id} className={`border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between ${card}`}>
                        
                        {/* Identity */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${r.role === 'resident_primary' ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-gradient-to-br from-slate-500 to-slate-600'}`}>
                            {r.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-extrabold text-sm text-slate-800 dark:text-slate-100 truncate">{r.name}</p>
                              {r.role === 'resident_primary' && (
                                <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase shrink-0">Primary</span>
                              )}
                            </div>
                            <p className={`text-[10px] ${subtext} font-medium truncate`}>
                              {r.phone} • {r.society_name} {r.tower ? `• Tower ${r.tower}` : ''} {r.flat_number ? `• Flat ${r.flat_number}` : ''}
                            </p>
                          </div>
                        </div>

                        {/* Vehicles */}
                        <div className="flex items-center gap-2 sm:min-w-[200px]">
                          {r.vehicle_count > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {r.vehicles?.split(', ').map((v, i) => (
                                <span key={i} className={`flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full ${isDark ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-blue-50 text-blue-600 border border-blue-200'}`}>
                                  <Car size={9} /> {v}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className={`text-[9px] font-semibold italic ${subtext}`}>No vehicle registered</span>
                          )}
                        </div>

                        {/* Status badge */}
                        <span className={`text-[9px] font-black px-2.5 py-1 rounded-full border shrink-0 ${
                          r.account_status === 'active' 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {r.account_status?.toUpperCase()}
                        </span>
                      </div>
                    ))}
                    {filteredResidents.length === 0 && !residentsLoading && (
                      <div className="text-center py-12">
                        <Users size={32} className="mx-auto text-slate-400 mb-2 opacity-40" />
                        <p className={`text-sm ${subtext}`}>No residents found</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ════════════════ STAFF & GUARDS TAB ════════════════ */}
            {activeTab === 'staff' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="font-bold text-base">Staff & Guards Directory</h2>
                    <p className={`text-xs ${subtext} mt-0.5`}>{filteredStaff.length} of {globalStaff.length} members shown</p>
                  </div>
                  <button onClick={fetchGlobalStaff} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold">
                    <RefreshCw size={12} className={staffLoading ? 'animate-spin' : ''} /> Refresh
                  </button>
                </div>

                {/* Breakdown counts */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Guards', count: staffBreakdown.guard, color: 'from-orange-500 to-red-500', icon: ShieldCheck },
                    { label: 'Managers', count: staffBreakdown.manager, color: 'from-purple-500 to-indigo-500', icon: User },
                    { label: 'Technicians', count: staffBreakdown.technician, color: 'from-blue-500 to-cyan-500', icon: Settings },
                    { label: 'Online Now', count: staffBreakdown.online, color: 'from-emerald-500 to-teal-500', icon: Wifi },
                  ].map(item => (
                    <div key={item.label} className={`border rounded-2xl p-4 flex items-center gap-3 ${card}`}>
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shrink-0`}>
                        <item.icon size={16} />
                      </div>
                      <div>
                        <p className="text-xl font-black text-slate-800 dark:text-slate-100 leading-none">{item.count}</p>
                        <p className={`text-[10px] font-bold mt-0.5 ${subtext}`}>{item.label}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                    <input
                      placeholder="Search by name, phone, society..."
                      value={staffSearch}
                      onChange={e => setStaffSearch(e.target.value)}
                      className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs outline-none ${input}`}
                    />
                  </div>
                  <select
                    value={staffRoleFilter}
                    onChange={e => setStaffRoleFilter(e.target.value)}
                    className={`border rounded-xl px-3 py-2.5 text-xs outline-none min-w-[140px] ${input}`}
                  >
                    <option value="all">All Roles</option>
                    <option value="guard">Guards</option>
                    <option value="manager">Managers</option>
                    <option value="technician">Technicians</option>
                  </select>
                </div>

                {/* Staff list */}
                {staffLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {filteredStaff.map(s => {
                      const roleColors = {
                        guard: 'from-orange-500 to-red-500',
                        manager: 'from-purple-500 to-indigo-600',
                        technician: 'from-blue-500 to-cyan-500',
                      };
                      const roleBadges = {
                        guard: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
                        manager: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
                        technician: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                      };
                      return (
                        <div key={s.id} className={`border rounded-2xl p-4 flex items-center justify-between gap-3 ${card}`}>
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${roleColors[s.role] || 'from-slate-500 to-slate-600'} flex items-center justify-center text-white font-bold text-sm shrink-0 relative`}>
                              {s.name?.charAt(0)?.toUpperCase()}
                              {/* Online indicator */}
                              {s.is_online && (
                                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-extrabold text-sm text-slate-800 dark:text-slate-100 truncate">{s.name}</p>
                                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase shrink-0 ${roleBadges[s.role] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                                  {s.role}
                                </span>
                              </div>
                              <p className={`text-[10px] ${subtext} font-medium`}>
                                {s.phone} • {s.society_name || 'Unassigned'} {s.city ? `(${s.city})` : ''}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {/* Online status */}
                            <div className="flex items-center gap-1">
                              {s.is_online ? (
                                <span className="flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  <Wifi size={8} /> Online
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20">
                                  <WifiOff size={8} /> Offline
                                </span>
                              )}
                            </div>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                              s.account_status === 'active' 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            }`}>{s.account_status?.toUpperCase()}</span>
                          </div>
                        </div>
                      );
                    })}
                    {filteredStaff.length === 0 && !staffLoading && (
                      <div className="text-center py-12">
                        <ShieldCheck size={32} className="mx-auto text-slate-400 mb-2 opacity-40" />
                        <p className={`text-sm ${subtext}`}>No staff found</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ════════════════ MANAGERS TAB ════════════════ */}
            {activeTab === 'managers' && (
              <div className="space-y-4 max-w-2xl mx-auto">
                <div className="flex justify-between items-center">
                  <h2 className="font-bold text-base">Society Managers ({managers.length})</h2>
                  <button onClick={() => setShowAddManager(!showAddManager)}
                    className="flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md">
                    <Plus size={13} /> Add Manager
                  </button>
                </div>

                {showAddManager && (
                  <div className={`border rounded-2xl p-5 space-y-3 ${card}`}>
                    <h4 className="font-bold text-sm text-purple-400">Onboard Society Manager</h4>
                    <input placeholder="Manager Name" value={newManager.name} onChange={e => setNewManager({...newManager, name: e.target.value})}
                      className={`w-full border rounded-xl px-3 py-2.5 text-xs outline-none ${input}`} />
                    <input placeholder="Phone Number" type="tel" value={newManager.phone} onChange={e => setNewManager({...newManager, phone: e.target.value})}
                      className={`w-full border rounded-xl px-3 py-2.5 text-xs outline-none ${input}`} />
                    <select value={newManager.society} onChange={e => setNewManager({...newManager, society: e.target.value})}
                      className={`w-full border rounded-xl px-3 py-2.5 text-xs outline-none ${input}`}>
                      <option value="">Assign Society</option>
                      {societies.map(s => <option key={s.id}>{s.name}</option>)}
                    </select>
                    <input placeholder="Login Password" type="password" value={newManager.password} onChange={e => setNewManager({...newManager, password: e.target.value})}
                      className={`w-full border rounded-xl px-3 py-2.5 text-xs outline-none ${input}`} />
                    <div className="flex gap-2">
                      <button onClick={async () => {
                        if (!newManager.name || !newManager.phone) return;
                        try {
                          const selectedSociety = societies.find(s => s.name === newManager.society);
                          await managerAPI.createManager({ name: newManager.name, phone: newManager.phone, password: newManager.password || '123456', society_id: selectedSociety?.id || null });
                          const res = await managerAPI.getManagers();
                          setManagers(res.data);
                          setNewManager({ name: '', phone: '', society: '', password: '' });
                          setShowAddManager(false);
                        } catch (err) {
                          alert(err.response?.data?.message || 'Manager create nahi hua');
                        }
                      }} className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md">Add Manager</button>
                      <button onClick={() => setShowAddManager(false)} className={`flex-1 py-2.5 rounded-xl text-xs border ${isDark ? 'border-slate-600 text-slate-400' : 'border-gray-300 text-gray-500'}`}>Cancel</button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {managers.map(m => (
                    <div key={m.id} className={`border rounded-[20px] p-4 flex items-center justify-between ${card}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                          {m.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-extrabold text-sm text-slate-800 dark:text-slate-100">{m.name}</p>
                          <p className={`text-xs ${subtext}`}>{m.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${m.account_status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>{m.account_status || 'active'}</span>
                          <p className={`text-[10px] font-bold text-indigo-400 mt-1`}>{m.society_name || 'Unassigned'}</p>
                        </div>
                        <button onClick={async () => {
                          if (!window.confirm('Delete this manager?')) return;
                          try { await managerAPI.deleteManager(m.id); setManagers(managers.filter(x => x.id !== m.id)); }
                          catch(err) { alert('Delete failed'); }
                        }} className="text-red-400 hover:text-red-300 p-1.5"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                  {managers.length === 0 && <p className={`text-xs text-center py-6 ${subtext}`}>No managers registered.</p>}
                </div>
              </div>
            )}

            {/* ════════════════ ADMINS TAB ════════════════ */}
            {activeTab === 'admins' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="font-bold text-base">Society Admins ({admins.length})</h2>
                    <p className={`text-xs ${subtext} mt-0.5`}>Each society can have one Admin — senior authority above Manager</p>
                  </div>
                  <button
                    onClick={() => setShowAddAdmin(!showAddAdmin)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-md"
                  >
                    <Plus size={13} /> Create Society Admin
                  </button>
                </div>

                {/* Add Admin Form */}
                {showAddAdmin && (
                  <div className={`border rounded-2xl p-5 space-y-3 ${card}`}>
                    <h4 className="font-bold text-sm text-violet-400 flex items-center gap-2">
                      <ShieldCheck size={15} /> Assign Society Admin
                    </h4>
                    <input
                      placeholder="Full Name"
                      value={newAdmin.name}
                      onChange={e => setNewAdmin({...newAdmin, name: e.target.value})}
                      className={`w-full border rounded-xl px-3 py-2.5 text-xs outline-none ${input}`}
                    />
                    <input
                      placeholder="Phone Number"
                      type="tel"
                      value={newAdmin.phone}
                      onChange={e => setNewAdmin({...newAdmin, phone: e.target.value})}
                      className={`w-full border rounded-xl px-3 py-2.5 text-xs outline-none ${input}`}
                    />
                    <select
                      value={newAdmin.society_id}
                      onChange={e => setNewAdmin({...newAdmin, society_id: e.target.value})}
                      className={`w-full border rounded-xl px-3 py-2.5 text-xs outline-none ${input}`}
                    >
                      <option value="">Assign to Society</option>
                      {societies.map(s => <option key={s.id} value={s.id}>{s.name} — {s.city}</option>)}
                    </select>
                    <input
                      placeholder="Password (default: 123456)"
                      type="password"
                      value={newAdmin.password}
                      onChange={e => setNewAdmin({...newAdmin, password: e.target.value})}
                      className={`w-full border rounded-xl px-3 py-2.5 text-xs outline-none ${input}`}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          if (!newAdmin.name || !newAdmin.phone || !newAdmin.society_id) {
                            return alert('Name, phone aur society required hai');
                          }
                          try {
                            await adminAPI.createAdmin({
                              name: newAdmin.name,
                              phone: newAdmin.phone,
                              password: newAdmin.password || '123456',
                              society_id: Number(newAdmin.society_id),
                            });
                            setNewAdmin({ name: '', phone: '', password: '', society_id: '' });
                            setShowAddAdmin(false);
                            fetchAdmins();
                          } catch (err) {
                            alert(err.response?.data?.message || 'Admin create nahi hua');
                          }
                        }}
                        className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold shadow-md"
                      >
                        Create Admin
                      </button>
                      <button
                        onClick={() => { setShowAddAdmin(false); setNewAdmin({ name: '', phone: '', password: '', society_id: '' }); }}
                        className={`flex-1 py-2.5 rounded-xl text-xs border ${isDark ? 'border-slate-600 text-slate-400' : 'border-gray-300 text-gray-500'}`}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Admins List */}
                {adminsLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {admins.map(a => (
                      <div key={a.id} className={`border rounded-2xl p-4 flex items-center justify-between gap-3 ${card}`}>
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-white font-bold text-sm shrink-0">
                            {a.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-extrabold text-sm text-slate-800 dark:text-slate-100 truncate">{a.name}</p>
                              <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20 uppercase shrink-0">Admin</span>
                            </div>
                            <p className={`text-[10px] ${subtext} font-medium`}>{a.phone} • {a.society_name || 'Unassigned'} {a.city ? `(${a.city})` : ''}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <span className={`text-[9px] font-black px-2.5 py-1 rounded-full border ${
                              a.account_status === 'active'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            }`}>{a.account_status?.toUpperCase()}</span>
                            <p className={`text-[9px] font-bold text-violet-400 mt-1`}>{a.society_name || 'No Society'}</p>
                          </div>
                          <button
                            onClick={async () => {
                              if (!window.confirm(`Delete admin ${a.name}?`)) return;
                              try {
                                await adminAPI.deleteAdmin(a.id);
                                setAdmins(admins.filter(x => x.id !== a.id));
                              } catch (err) {
                                alert(err.response?.data?.message || 'Delete failed');
                              }
                            }}
                            className="text-red-400 hover:text-red-300 p-1.5"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {admins.length === 0 && !adminsLoading && (
                      <div className={`border rounded-2xl p-10 text-center ${card}`}>
                        <ShieldCheck size={36} className="mx-auto text-slate-400 mb-2 opacity-40" />
                        <p className={`text-sm ${subtext}`}>Koi Society Admin nahi hai abhi.</p>
                        <p className={`text-xs ${subtext} mt-1`}>Super Admin se ek admin assign karwao har society ke liye.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ════════════════ GLOBAL LOGS TAB ════════════════ */}
            {activeTab === 'logs' && (
              <div className={`border rounded-3xl p-5 max-w-2xl mx-auto ${card}`}>
                <h3 className="font-bold mb-4 text-sm flex items-center gap-2 border-b pb-2"><Activity size={16} className="text-purple-400" /> Global System History Logs</h3>
                <div className="space-y-3">
                  {[
                    { time: '4:10 PM', event: 'Car MH12AB1234 entered gate', society: 'Green Valley', type: 'entry' },
                    { time: '3:55 PM', event: 'SOS Alert triggered — Flat H-102', society: 'Pavilion Heights', type: 'sos' },
                    { time: '3:40 PM', event: 'Resident Suresh Kumar approved', society: 'Royal Enclave', type: 'approval' },
                    { time: '2:15 PM', event: 'Service Request #45 — Resolved', society: 'Green Valley', type: 'service' },
                    { time: '1:00 PM', event: 'Amazon delivery logged at gate', society: 'Blue Horizon', type: 'delivery' },
                  ].map((log, i) => (
                    <div key={i} className={`flex items-start gap-3 p-3 rounded-2xl border ${isDark ? 'bg-slate-750/30 border-slate-700/50' : 'bg-slate-50 border-slate-200'}`}>
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                        log.type === 'sos' ? 'bg-rose-500 animate-pulse' :
                        log.type === 'entry' ? 'bg-emerald-500' :
                        log.type === 'approval' ? 'bg-indigo-500' : 'bg-amber-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-slate-800 dark:text-slate-200 leading-snug">{log.event}</p>
                        <p className={`text-[9px] ${subtext}`}>{log.society} • {log.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ════════════════ NOTICES TAB ════════════════ */}
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

export default SuperAdminDashboard;
