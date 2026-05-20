import React, { useState, useEffect } from 'react';
import ISTClock from './ISTClock';
import { useTheme } from '../context/ThemeContext';
import { 
  Globe, Users, Building2, ShieldCheck, TrendingUp, LogOut, 
  Plus, Eye, Trash2, BarChart3, Activity, User, Edit2, 
  Settings, Sun, Moon, Bell, ArrowUp, ArrowDown, Shield, 
  ChevronRight, Zap, Play, CheckCircle, AlertTriangle, XCircle, Search
} from 'lucide-react';
import UserProfile from './UserProfile';
import { societyAPI, managerAPI, announcementAPI } from '../services/api';
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

  const bg = isDark ? 'bg-[#0a0f1e] text-white' : 'bg-slate-50 text-gray-900';
  const card = isDark ? 'bg-slate-800/60 border-slate-700/60 backdrop-blur-sm shadow-md' : 'bg-white border-gray-200 shadow-sm';
  const input = isDark ? 'bg-slate-700/80 border-slate-600 text-white placeholder-slate-400' : 'bg-gray-150 border-gray-300 text-gray-800';
  const subtext = isDark ? 'text-slate-400' : 'text-gray-500';
  const header = isDark ? 'bg-[#0c1328] border-slate-800 text-white' : 'bg-white border-gray-200 text-gray-800';

  const totalResidents = societies.reduce((s, x) => s + (x.residents || 0), 0);
  const totalFlats = societies.reduce((s, x) => s + (x.flats || 0), 0);

  useEffect(() => {
    fetchSocieties();
    fetchManagers();
  }, []);

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

  const tabs = [
    { key: 'overview', label: 'Overview', icon: BarChart3 },
    { key: 'societies', label: 'Societies', icon: Building2 },
    { key: 'managers', label: 'Managers', icon: Users },
    { key: 'notices', label: 'Notices', icon: Bell },
    { key: 'logs', label: 'Global Logs', icon: Activity },
  ];

  return (
    <div className={`min-h-screen pb-12 transition-colors duration-300 ${bg}`}>
      
      {/* SUPER ADMIN DASHBOARD - FULL WIDTH LAYOUT */}
      <div className="max-w-6xl mx-auto px-0 md:px-4">
        <div className={`overflow-hidden flex flex-col ${bg}`}>

          {/* LAPTOP TOP DASHBOARD NAVBAR */}
          <header className={`px-4 py-3 border-b flex flex-wrap items-center justify-between gap-4 backdrop-blur-md sticky top-0 z-40 ${header}`}>
            <div className="flex items-center gap-3">
              {/* Cloud 4 Things Logo */}
              <div className="flex items-center gap-1">
                <span className="text-xs font-black tracking-tighter text-blue-500 dark:text-blue-400 font-sans uppercase">Cloud<span className="text-red-500 font-black italic">4</span></span>
                <span className="text-xs font-black tracking-tighter text-slate-800 dark:text-slate-200 uppercase">Things</span>
                <span className="text-[8px] bg-indigo-500/10 text-indigo-500 font-black px-1.5 py-0.5 rounded-md ml-1.5">GLOBAL</span>
              </div>
            </div>

            {/* Laptop Navbar links */}
            <div className="flex items-center gap-5 text-xs font-black text-slate-500 tracking-wide">
              <button onClick={() => setActiveTab('overview')} className={`hover:text-indigo-500 ${activeTab === 'overview' ? 'text-indigo-500 dark:text-indigo-400 underline decoration-2 underline-offset-4' : ''}`}>Dashboard</button>
              <button onClick={() => setActiveTab('logs')} className={`hover:text-indigo-500 ${activeTab === 'logs' ? 'text-indigo-500 dark:text-indigo-400 underline decoration-2 underline-offset-4' : ''}`}>Global Logs</button>
              <button onClick={() => setActiveTab('societies')} className="hover:text-indigo-500">Societies</button>
              <button onClick={() => setShowProfile(true)} className="hover:text-indigo-500">Settings</button>
            </div>

            {/* Laptop Header utilities */}
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

          {/* TABLET TABS NAVIGATION */}
          <div className={`flex overflow-x-auto gap-1 px-4 py-2 border-b bg-slate-900/10 ${header}`}>
            {tabs.map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wide whitespace-nowrap transition-all relative
                  ${activeTab === key ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}>
                <Icon size={12} strokeWidth={2.5} /> {label}
              </button>
            ))}
          </div>

          {/* MAIN PAGE VIEWPORT */}
          <div className="p-4 md:p-6 space-y-5">

            {/* OVERVIEW TAB (Aggregated Global Console) */}
            {activeTab === 'overview' && (
              <>
                {/* Aggregated Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Societies', value: societies.length, color: 'from-purple-500 to-indigo-500', icon: Building2 },
                    { label: 'Active Residents', value: totalResidents, color: 'from-emerald-500 to-teal-500', icon: Users },
                    { label: 'Total Flats', value: totalFlats, color: 'from-blue-500 to-cyan-500', icon: Globe },
                    { label: 'Active Managers', value: managers.length, color: 'from-orange-500 to-red-500', icon: ShieldCheck },
                  ].map(s => (
                    <div key={s.label} className={`border rounded-2xl p-4 flex flex-col justify-between ${card}`}>
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3 text-white shadow-md`}>
                        <s.icon size={18} strokeWidth={2.2} />
                      </div>
                      <div>
                        <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">{s.value}</h1>
                        <p className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${subtext}`}>{s.label}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* TWO COLUMN GRID: LEFT HEALTH & OCCUPANCY, RIGHT GLOBAL LOGS */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  
                  {/* Left Column: Global Society Health */}
                  <div className={`lg:col-span-2 p-5 rounded-3xl border ${card}`}>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 border-b pb-3 flex items-center gap-1.5">
                      <TrendingUp size={15} className="text-purple-500" /> Global Societies Status Dashboard
                    </h3>

                    <div className="mt-4 space-y-3">
                      {societies.map(s => {
                        const occupancyPct = s.flats ? Math.round(((s.residents || 0) / s.flats) * 100) : 0;
                        return (
                          <div key={s.id} className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${isDark ? 'bg-slate-750/30 border-slate-700/50' : 'bg-slate-50 border-slate-200'}`}>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                                <p className="font-extrabold text-sm text-slate-800 dark:text-slate-100">{s.name}</p>
                              </div>
                              <p className={`text-[10px] ${subtext}`}>{s.city} &bull; Occupancy: {s.residents || 0} residents in {s.flats} flats &bull; Guards: {s.guards || 0}</p>
                            </div>
                            
                            {/* Health meters progress indicators */}
                            <div className="flex items-center gap-4 shrink-0">
                              <div className="flex flex-col items-end">
                                <span className="text-[10px] font-black">{occupancyPct}% occupied</span>
                                <div className="w-24 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 mt-1 overflow-hidden">
                                  <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500" style={{ width: `${occupancyPct}%` }} />
                                </div>
                              </div>
                              
                              <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase ${s.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                                {s.status || 'active'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                      {societies.length === 0 && <p className={`text-xs text-center py-6 ${subtext}`}>No societies onboarded yet.</p>}
                    </div>
                  </div>

                  {/* Right Column: Global Logs alerts */}
                  <div className={`p-5 rounded-3xl border flex flex-col justify-between ${card}`}>
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 border-b pb-3 flex items-center gap-1.5">
                        <Activity size={15} className="text-indigo-500" /> Global Security Logs
                      </h3>

                      <div className="mt-4 space-y-3">
                        {[
                          { time: '4:10 PM', event: 'Car MH12AB1234 entered gate', society: 'Green Valley', type: 'entry' },
                          { time: '3:55 PM', event: 'SOS Alert triggered — Flat H-102', society: 'Pavilion Heights', type: 'sos' },
                          { time: '3:40 PM', event: 'Resident Suresh Kumar approved', society: 'Royal Enclave', type: 'approval' },
                          { time: '2:15 PM', event: 'Service Request #45 — Resolved', society: 'Green Valley', type: 'service' },
                        ].map((log, i) => (
                          <div key={i} className={`flex items-start gap-2.5 p-3 rounded-xl border ${isDark ? 'bg-slate-750/30 border-slate-700/50' : 'bg-slate-50 border-slate-200'}`}>
                            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                              log.type === 'sos' ? 'bg-rose-500 animate-pulse' :
                              log.type === 'entry' ? 'bg-emerald-500' :
                              log.type === 'approval' ? 'bg-blue-500' : 'bg-amber-500'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200 leading-snug">{log.event}</p>
                              <p className={`text-[9px] ${subtext}`}>{log.society} &bull; {log.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Data Retention Info */}
                    <div className="border-t border-slate-200 dark:border-slate-800 pt-4 mt-4 text-[10px] leading-relaxed text-slate-500">
                      <p className="font-extrabold text-indigo-400 flex items-center gap-1"><Shield size={12} /> 90-Day Global Retention Active</p>
                      <p className="mt-1">All gates records, visitor recharges, and resolved tickets logs are cleared daily at midnight to preserve disk allocations.</p>
                    </div>
                  </div>

                </div>

                {/* SVG DONUT ANALYTICS BREAKDOWNS */}
                <div className={`p-5 rounded-3xl border ${card}`}>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 border-b pb-3">
                    Aggregated Global Devices Health
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center mt-4">
                    
                    {/* Donut Chart 1: Camera Devices Health */}
                    <div className="flex flex-col items-center">
                      <span className={`text-[10px] font-black uppercase tracking-wider mb-2 ${subtext}`}>Security Cameras</span>
                      <div className="relative w-24 h-24 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="15.915" fill="none" stroke="#e11d48" strokeWidth="4" />
                          <circle cx="18" cy="18" r="15.915" fill="none" stroke="#3b82f6" strokeWidth="4" strokeDasharray="85 100" strokeDashoffset="-5" />
                          <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f97316" strokeWidth="4" strokeDasharray="10 100" strokeDashoffset="-90" />
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center">
                          <span className="text-base font-black text-slate-800 dark:text-slate-100">95%</span>
                          <span className={`text-[7px] font-bold ${subtext}`}>ONLINE</span>
                        </div>
                      </div>
                    </div>

                    {/* Donut Chart 2: Flat Occupancy Rate */}
                    <div className="flex flex-col items-center">
                      <span className={`text-[10px] font-black uppercase tracking-wider mb-2 ${subtext}`}>Global Occupancy</span>
                      <div className="relative w-24 h-24 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="15.915" fill="none" stroke="#e11d48" strokeWidth="4" />
                          <circle cx="18" cy="18" r="15.915" fill="none" stroke="#3b82f6" strokeWidth="4" strokeDasharray="65 100" strokeDashoffset="-15" />
                          <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f97316" strokeWidth="4" strokeDasharray="20 100" strokeDashoffset="-80" />
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center">
                          <span className="text-base font-black text-slate-800 dark:text-slate-100">65%</span>
                          <span className={`text-[7px] font-bold ${subtext}`}>OCCUPIED</span>
                        </div>
                      </div>
                    </div>

                    {/* Donut Chart 3: Active Gates Gateways */}
                    <div className="flex flex-col items-center">
                      <span className={`text-[10px] font-black uppercase tracking-wider mb-2 ${subtext}`}>Active Gateways</span>
                      <div className="relative w-24 h-24 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="15.915" fill="none" stroke="#e11d48" strokeWidth="4" strokeDasharray="5 100" strokeDashoffset="0" />
                          <circle cx="18" cy="18" r="15.915" fill="none" stroke="#3b82f6" strokeWidth="4" strokeDasharray="95 100" strokeDashoffset="-5" />
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center">
                          <span className="text-base font-black text-slate-800 dark:text-slate-100">95%</span>
                          <span className={`text-[7px] font-bold ${subtext}`}>HEALTHY</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </>
            )}

            {/* SOCIETIES TAB */}
            {activeTab === 'societies' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="font-bold text-base">Registered Societies ({societies.length})</h2>
                  <button onClick={() => {
                    setShowAddSociety(!showAddSociety);
                    setEditingSociety(null);
                    setNewSociety({ name: '', city: '', flats: '', society_code: '' });
                  }}
                    className="flex items-center gap-1 bg-purple-600 hover:bg-purple-750 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md">
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
                              name: newSociety.name,
                              city: newSociety.city,
                              flats: Number(newSociety.flats),
                              society_code: newSociety.society_code || null,
                              state: 'N/A',
                              zip_code: '000000'
                            });
                            setSocieties([res.data.society, ...societies]);
                          }
                          setNewSociety({ name: '', city: '', flats: '', society_code: '' }); 
                          setEditingSociety(null);
                          setShowAddSociety(false);
                        } catch (err) {
                          console.error('Failed to save society:', err);
                          alert(err.response?.data?.message || 'Failed to save society');
                        }
                      }} className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md">{editingSociety ? 'Update' : 'Register'}</button>
                      <button onClick={() => {
                        setShowAddSociety(false);
                        setEditingSociety(null);
                        setNewSociety({ name: '', city: '', flats: '', society_code: '' });
                      }} className={`flex-1 py-2.5 rounded-xl text-xs border ${isDark ? 'border-slate-600 text-slate-400' : 'border-gray-300 text-gray-500'}`}>Cancel</button>
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
                            <p className={`text-xs ${subtext}`}>{s.city} &bull; <span className="font-bold text-indigo-400">PIN: {s.society_code}</span></p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => {
                            setEditingSociety(s);
                            setNewSociety({ name: s.name, city: s.city, flats: s.flats || '', society_code: s.society_code || '' });
                            setShowAddSociety(true);
                          }} className="text-blue-400 hover:text-blue-300 p-1.5"><Edit2 size={14} /></button>
                          <button onClick={async () => {
                            if (window.confirm('Delete this society?')) {
                              try {
                                await societyAPI.delete(s.id);
                                setSocieties(societies.filter(x => x.id !== s.id));
                              } catch (err) {
                                console.error('Failed to delete:', err);
                              }
                            }
                          }} className="text-red-400 hover:text-red-300 p-1.5"><Trash2 size={14} /></button>
                        </div>
                      </div>
                      
                      <div className={`mt-4 grid grid-cols-3 gap-2 text-center text-[10px] ${subtext}`}>
                        <div className={`p-2.5 rounded-xl ${isDark ? 'bg-slate-700/40' : 'bg-slate-50'}`}><p className="font-black text-slate-800 dark:text-slate-100 text-sm">{s.residents || 0}</p>Residents</div>
                        <div className={`p-2.5 rounded-xl ${isDark ? 'bg-slate-700/40' : 'bg-slate-50'}`}><p className="font-black text-slate-800 dark:text-slate-100 text-sm">{s.guards || 0}</p>Guards</div>
                        <div className={`p-2.5 rounded-xl ${isDark ? 'bg-slate-700/40' : 'bg-slate-50'}`}><p className="font-black text-emerald-400 text-sm">Active</p>Status</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MANAGERS TAB */}
            {activeTab === 'managers' && (
              <div className="space-y-4 max-w-2xl mx-auto">
                <div className="flex justify-between items-center">
                  <h2 className="font-bold text-base">Society Managers ({managers.length})</h2>
                  <button onClick={() => setShowAddManager(!showAddManager)}
                    className="flex items-center gap-1 bg-purple-600 hover:bg-purple-750 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md">
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
                          await managerAPI.createManager({
                            name: newManager.name,
                            phone: newManager.phone,
                            password: newManager.password || '123456',
                            society_id: selectedSociety?.id || null
                          });
                          const res = await managerAPI.getManagers();
                          setManagers(res.data);
                          setNewManager({ name: '', phone: '', society: '', password: '' });
                          setShowAddManager(false);
                        } catch (err) {
                          alert(err.response?.data?.message || 'Manager create nahi hua');
                        }
                      }} className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-750 text-white rounded-xl text-xs font-bold shadow-md">Add Manager</button>
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
                          try {
                            await managerAPI.deleteManager(m.id);
                            setManagers(managers.filter(x => x.id !== m.id));
                          } catch(err) { alert('Delete failed'); }
                        }} className="text-red-400 hover:text-red-300 p-1.5"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                  {managers.length === 0 && <p className={`text-xs text-center py-6 ${subtext}`}>No managers assign registered.</p>}
                </div>
              </div>
            )}

            {/* GLOBAL LOGS TAB */}
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
                        <p className={`text-[9px] ${subtext}`}>{log.society} &bull; {log.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* NOTICES TAB */}
            {activeTab === 'notices' && (
              <div className="max-w-2xl mx-auto">
                <AnnouncementBoard user={user} />
              </div>
            )}

          </div>

        </div>
      </div>

      {/* USER PROFILE MODAL */}
      <UserProfile isOpen={showProfile} onClose={() => setShowProfile(false)} />

    </div>
  );
};

export default SuperAdminDashboard;
