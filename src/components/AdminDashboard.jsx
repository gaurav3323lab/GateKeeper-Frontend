import React, { useState, useEffect } from 'react';
import ISTClock from './ISTClock';
import { useTheme } from '../context/ThemeContext';
import {
  Building2, Users, ShieldCheck, Wrench, LogOut, Plus, Trash2,
  BarChart3, Activity, User, CheckCircle, XCircle, Clock,
  Loader2, UserPlus, PenLine, Bell, ChevronDown, Home, Key,
  Shield, Settings, Moon, Sun, ArrowDown, ArrowUp, Zap, HelpCircle, AlertTriangle
} from 'lucide-react';
import { adminAPI } from '../services/api';
import UserProfile from './UserProfile';
import AnnouncementBoard from './AnnouncementBoard';

const AdminDashboard = ({ user, onLogout }) => {
  const { isDark, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('overview');
  const [dashData, setDashData] = useState({ society: {}, stats: {} });
  const [managers, setManagers] = useState([]);
  const [staff, setStaff] = useState({ systemStaff: [], externalStaff: [] });
  const [residents, setResidents] = useState([]);
  const [pending, setPending] = useState([]);
  const [entryLogs, setEntryLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddManager, setShowAddManager] = useState(false);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [newManager, setNewManager] = useState({ name: '', phone: '', password: '' });
  const [newStaff, setNewStaff] = useState({ name: '', phone: '', role: 'guard', password: '' });
  const [actionLoading, setActionLoading] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // MOCK UTILITY STATES FOR CLOUD 4 THINGS DASHBOARD
  const [electricityRecharges, setElectricityRecharges] = useState(1545225);
  const [openRechargePopup, setOpenRechargePopup] = useState(false);
  const [rechargeAmt, setRechargeAmt] = useState('');

  const bg = isDark ? 'bg-[#0a0f1e] text-white' : 'bg-slate-50 text-gray-900';
  const card = isDark ? 'bg-slate-800/60 border-slate-700/60 backdrop-blur-sm shadow-md' : 'bg-white border-gray-200 shadow-sm';
  const inp = isDark ? 'bg-slate-700/80 border-slate-600 text-white placeholder-slate-400' : 'bg-gray-150 border-gray-300 text-gray-800';
  const sub = isDark ? 'text-slate-400' : 'text-gray-500';
  const hdr = isDark ? 'bg-[#0c1328] border-slate-800 text-white' : 'bg-white border-gray-200 text-gray-800';

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [dash, mgr, st, res, pend, logs] = await Promise.allSettled([
        adminAPI.getDashboard(),
        adminAPI.getManagers(),
        adminAPI.getStaff(),
        adminAPI.getResidents(),
        adminAPI.getPendingResidents(),
        adminAPI.getEntryLogs(),
      ]);
      if (dash.status === 'fulfilled') setDashData(dash.value.data);
      if (mgr.status === 'fulfilled') setManagers(mgr.value.data);
      if (st.status === 'fulfilled') setStaff(st.value.data);
      if (res.status === 'fulfilled') setResidents(res.value.data);
      if (pend.status === 'fulfilled') setPending(pend.value.data);
      if (logs.status === 'fulfilled') setEntryLogs(logs.value.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleApprove = async (id, status) => {
    setActionLoading(true);
    try { await adminAPI.approveResident(id, { status }); await fetchAll(); }
    catch { alert('Action failed'); } finally { setActionLoading(false); }
  };

  const handleAddManager = async () => {
    if (!newManager.name || !newManager.phone) return alert('Name & phone required');
    setActionLoading(true);
    try {
      await adminAPI.createManager(newManager);
      setNewManager({ name: '', phone: '', password: '' });
      setShowAddManager(false);
      await fetchAll();
    } catch (e) { alert(e.response?.data?.message || 'Failed'); }
    finally { setActionLoading(false); }
  };

  const handleDeleteManager = async (id) => {
    if (!window.confirm('Delete this manager?')) return;
    try { await adminAPI.deleteManager(id); await fetchAll(); }
    catch { alert('Delete failed'); }
  };

  const handleAddStaff = async () => {
    if (!newStaff.name || !newStaff.phone) return alert('Name & phone required');
    setActionLoading(true);
    try {
      await adminAPI.createStaff(newStaff);
      setNewStaff({ name: '', phone: '', role: 'guard', password: '' });
      setShowAddStaff(false);
      await fetchAll();
    } catch (e) { alert(e.response?.data?.message || 'Failed'); }
    finally { setActionLoading(false); }
  };

  const handleElectricityRechargeSubmit = (e) => {
    e.preventDefault();
    const amt = Number(rechargeAmt);
    if (!amt || amt <= 0) return alert('Enter valid amount');
    setElectricityRecharges(prev => prev + amt);
    setRechargeAmt('');
    setOpenRechargePopup(false);
    alert(`₹${amt.toLocaleString('en-IN')} successfully recharged to prepaid electricity grid!`);
  };

  const tabs = [
    { key: 'overview', label: 'Overview', icon: BarChart3 },
    { key: 'approvals', label: 'Approvals', icon: Clock, badge: pending.length },
    { key: 'managers', label: 'Managers', icon: ShieldCheck },
    { key: 'staff', label: 'Staff', icon: Wrench },
    { key: 'residents', label: 'Residents', icon: Users },
    { key: 'logs', label: 'Entry Log', icon: Activity },
    { key: 'notices', label: 'Notices', icon: Bell },
  ];

  const { society, stats } = dashData;

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0f1e] text-white">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center mb-4 animate-pulse">
        <Building2 size={28} className="text-white" />
      </div>
      <Loader2 className="animate-spin text-violet-400 mb-2" size={32} />
      <p className="text-slate-400 text-sm font-semibold">Loading 'Cloud 4 Things' Dashboard...</p>
    </div>
  );

  return (
    <div className={`min-h-screen pb-12 transition-colors duration-300 ${bg}`}>
      
      {/* ADMIN DASHBOARD - FULL WIDTH LAYOUT */}
      <div className="max-w-6xl mx-auto px-0 md:px-4">
        <div className={`overflow-hidden flex flex-col ${bg}`}>

          {/* LAPTOP TOP DASHBOARD NAVBAR (Image 4 Top Bar) */}
          <header className={`px-4 py-3 border-b flex flex-wrap items-center justify-between gap-4 backdrop-blur-md sticky top-0 z-40 ${hdr}`}>
            <div className="flex items-center gap-3">
              {/* Cloud 4 Things Logo */}
              <div className="flex items-center gap-1">
                <span className="text-xs font-black tracking-tighter text-blue-500 dark:text-blue-400 font-sans uppercase">Cloud<span className="text-red-500 font-black italic">4</span></span>
                <span className="text-xs font-black tracking-tighter text-slate-800 dark:text-slate-200 uppercase">Things</span>
              </div>

              {/* Project selector dropdown (Pavilion Heights) */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-xl px-2.5 py-1 text-xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mr-1">Select Project:</span>
                <span className="font-extrabold text-indigo-500 dark:text-indigo-400">{society?.name || 'Pavilion Heights'}</span>
                <ChevronDown size={12} className="text-slate-400" />
              </div>
            </div>

            {/* Laptop Navbar links */}
            <div className="flex items-center gap-5 text-xs font-black text-slate-500 tracking-wide">
              <button onClick={() => setActiveTab('overview')} className={`hover:text-indigo-500 ${activeTab === 'overview' ? 'text-indigo-500 dark:text-indigo-400 underline decoration-2 underline-offset-4' : ''}`}>Dashboard</button>
              <button onClick={() => setActiveTab('logs')} className={`hover:text-indigo-500 ${activeTab === 'logs' ? 'text-indigo-500 dark:text-indigo-400 underline decoration-2 underline-offset-4' : ''}`}>Activities</button>
              <button onClick={() => setActiveTab('overview')} className="hover:text-indigo-500">Analytics</button>
              <button onClick={() => setShowProfile(true)} className="hover:text-indigo-500">Setup</button>
            </div>

            {/* Laptop Header utilities */}
            <div className="flex items-center gap-3">
              <button onClick={toggleTheme} className={`p-1.5 rounded-xl border border-slate-200 dark:border-slate-850 ${isDark ? 'text-amber-400' : 'text-slate-500'}`}>
                {isDark ? <Sun size={14} /> : <Moon size={14} />}
              </button>
              {pending.length > 0 && (
                <button onClick={() => setActiveTab('approvals')} className="relative p-1.5 rounded-xl border border-slate-200 dark:border-slate-850 hover:text-indigo-500">
                  <Bell size={14} className="text-amber-400 animate-pulse" />
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center font-black">{pending.length}</span>
                </button>
              )}
              <div className="flex items-center gap-1.5 border-l border-slate-200 dark:border-slate-800 pl-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">{user?.name || 'Admin'}</span>
                <button onClick={onLogout} className="text-red-400 hover:text-red-300 p-1.5"><LogOut size={14} /></button>
              </div>
            </div>
          </header>

          {/* TABLET TABS NAVIGATION */}
          <div className={`flex overflow-x-auto gap-1 px-4 py-2 border-b bg-slate-900/10 ${hdr}`}>
            {tabs.map(({ key, label, icon: Icon, badge }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wide whitespace-nowrap transition-all relative
                  ${activeTab === key ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}>
                <Icon size={12} strokeWidth={2.5} /> {label}
                {badge > 0 && <span className="ml-1 bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-black">{badge}</span>}
              </button>
            ))}
          </div>

          {/* MAIN PAGE VIEWPORT */}
          <div className="p-4 md:p-6 space-y-5">

            {/* OVERVIEW PANEL (CLOUD 4 THINGS REDESIGN) */}
            {activeTab === 'overview' && (
              <>
                {/* Subheader and Prepaid Badge (Image 4 Subheader) */}
                <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <h2 className="text-xs font-black tracking-wider text-slate-800 dark:text-slate-200 uppercase">
                      Site Name : <span className="text-indigo-500 dark:text-indigo-400 font-extrabold">{society?.name || 'Pavilion Heights'}</span>
                    </h2>
                    <p className={`text-[10px] font-bold mt-0.5 ${sub}`}>{society?.city} &bull; PIN: {society?.society_code}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-red-500 text-white font-extrabold text-[9px] tracking-wider rounded-md shadow-md animate-pulse">
                      PREPAID
                    </span>
                    <button 
                      onClick={() => setOpenRechargePopup(true)} 
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[9px] tracking-wider rounded-md shadow-md"
                    >
                      GRID RECHARGE
                    </button>
                  </div>
                </div>

                {/* TWO-COLUMN GRID: LEFT DG STATUS & RIGHT CURRENTS STATS */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  
                  {/* LEFT DG STATUS BOX (Image 4 Blue-Purple Box) */}
                  <div className="lg:col-span-1 rounded-3xl p-5 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-700 text-white shadow-xl flex flex-col justify-between min-h-[300px]">
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-blue-200 border-b border-white/20 pb-2 flex items-center gap-1.5">
                        <Zap size={14} className="text-amber-300" /> DG Status
                      </h3>
                      <div className="mt-4 space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-blue-100 font-bold uppercase tracking-wider">Total DGs</span>
                          <span className="text-xs bg-white/20 font-black px-2.5 py-0.5 rounded-full">1</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-blue-100 font-bold uppercase tracking-wider">Total DG ON</span>
                          <span className="text-xs bg-emerald-500 text-white font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" /> 1
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-blue-100 font-bold uppercase tracking-wider">Total DG OFF</span>
                          <span className="text-xs bg-white/10 font-black px-2.5 py-0.5 rounded-full">0</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-white/20 pt-4 mt-4 space-y-3">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-blue-100 font-bold uppercase tracking-wider">Total Meters DG ON</span>
                        <span className="font-extrabold text-yellow-300">1570</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-blue-100 font-bold uppercase tracking-wider">Total Meters DG OFF</span>
                        <span className="font-extrabold">0</span>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT 3x4 METRICS SUMMARY GRID (Image 4 Current Month Summary) */}
                  <div className="lg:col-span-3 space-y-2">
                    <p className={`text-[10px] font-black uppercase tracking-wider ${sub}`}>Current Month Summary</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: 'Opening Balance', value: '₹2,18,225', icon: '🪙', color: 'border-l-indigo-500' },
                        { label: 'Recharge', value: `₹${electricityRecharges.toLocaleString('en-IN')}`, icon: '📱', color: 'border-l-emerald-500', isDynamic: true },
                        { label: 'Consumption', value: '₹2,18,225', icon: '⚙️', color: 'border-l-amber-500' },
                        { label: 'Current Balance', value: '₹12,18,225', icon: '🧮', color: 'border-l-rose-500' },
                        
                        { label: 'Gateways', value: '57', sub: '3 Down', trend: 'down', icon: '📡', color: 'border-l-sky-500' },
                        { label: 'Meters', value: '1570', sub: '62 Up / 3 Down', trend: 'both', icon: '📟', color: 'border-l-violet-500' },
                        { label: 'Cut Meters', value: '20', icon: '✂️', color: 'border-l-red-500' },
                        { label: 'Cut Warning', value: '16', icon: '⚠️', color: 'border-l-amber-400' },
                        
                        { label: 'Overload Meters', value: '1', icon: '🔥', color: 'border-l-orange-500' },
                        { label: 'Grid Load Tampered', value: '1', icon: '🔌', color: 'border-l-indigo-400' },
                        { label: 'DG Load Tampered', value: '1', icon: '⚡', color: 'border-l-purple-500' },
                        { label: 'Tampered Consumption', value: '0', icon: '📉', color: 'border-l-slate-400' },
                      ].map((item, i) => (
                        <div key={i} className={`border rounded-2xl p-3 flex flex-col justify-between border-l-4 ${card} ${item.color} hover:shadow-lg transition-shadow`}>
                          <div className="flex justify-between items-start">
                            <span className={`text-[8px] font-black uppercase tracking-wider leading-none shrink-0 ${sub}`}>{item.label}</span>
                            <span className="text-sm shrink-0">{item.icon}</span>
                          </div>
                          
                          <div className="mt-2 flex items-baseline justify-between">
                            <span className="text-sm font-black text-slate-800 dark:text-slate-100">{item.value}</span>
                            
                            {/* Trend indications matching the arrows in Image 4 */}
                            {item.trend === 'down' && (
                              <span className="text-[8px] text-red-500 font-extrabold flex items-center gap-0.5">
                                <ArrowDown size={8} strokeWidth={3} /> {item.sub}
                              </span>
                            )}
                            {item.trend === 'both' && (
                              <span className="text-[8px] text-emerald-500 dark:text-emerald-400 font-extrabold flex items-center gap-0.5">
                                <ArrowUp size={8} strokeWidth={3} /> {item.sub}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* BOTTOM Health of Device SECTION (Image 4 Donut Charts) */}
                <div className={`p-5 rounded-3xl border ${card}`}>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700/60 pb-3">
                    Health of Device
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center mt-4">
                    
                    {/* Donut Chart 1: IoT Gateways */}
                    <div className="flex flex-col items-center">
                      <span className={`text-[10px] font-black uppercase tracking-wider mb-2 ${sub}`}>IoT Gateways</span>
                      <div className="relative w-24 h-24 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="15.915" fill="none" stroke="#e11d48" strokeWidth="4" />
                          <circle cx="18" cy="18" r="15.915" fill="none" stroke="#3b82f6" strokeWidth="4" strokeDasharray="75 100" strokeDashoffset="-10" />
                          <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f97316" strokeWidth="4" strokeDasharray="15 100" strokeDashoffset="-85" />
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center">
                          <span className="text-base font-black text-slate-800 dark:text-slate-100">133</span>
                          <span className={`text-[7px] font-bold ${sub}`}>TOTAL</span>
                        </div>
                      </div>
                    </div>

                    {/* Donut Chart 2: Motors */}
                    <div className="flex flex-col items-center">
                      <span className={`text-[10px] font-black uppercase tracking-wider mb-2 ${sub}`}>Motors</span>
                      <div className="relative w-24 h-24 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="15.915" fill="none" stroke="#e11d48" strokeWidth="4" />
                          <circle cx="18" cy="18" r="15.915" fill="none" stroke="#3b82f6" strokeWidth="4" strokeDasharray="80 100" strokeDashoffset="-5" />
                          <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f97316" strokeWidth="4" strokeDasharray="15 100" strokeDashoffset="-85" />
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center">
                          <span className="text-base font-black text-slate-800 dark:text-slate-100">787</span>
                          <span className={`text-[7px] font-bold ${sub}`}>TOTAL</span>
                        </div>
                      </div>
                    </div>

                    {/* Donut Chart 3: Discovered Motors */}
                    <div className="flex flex-col items-center">
                      <span className={`text-[10px] font-black uppercase tracking-wider mb-2 ${sub}`}>Discovered Motors</span>
                      <div className="relative w-24 h-24 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="15.915" fill="none" stroke="#e11d48" strokeWidth="4" />
                          <circle cx="18" cy="18" r="15.915" fill="none" stroke="#3b82f6" strokeWidth="4" strokeDasharray="60 100" strokeDashoffset="-20" />
                          <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f97316" strokeWidth="4" strokeDasharray="20 100" strokeDashoffset="-80" />
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center">
                          <span className="text-base font-black text-slate-800 dark:text-slate-100">15</span>
                          <span className={`text-[7px] font-bold ${sub}`}>TOTAL</span>
                        </div>
                      </div>
                    </div>

                    {/* Donut Legends Sidebar List (Image 4 right side list) */}
                    <div className="md:col-span-1 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 pl-0 md:pl-6 py-2 space-y-3">
                      {[
                        { label: 'Unhealthy', count: 33, color: 'bg-rose-500' },
                        { label: 'Healthy', count: 735, color: 'bg-blue-500' },
                        { label: 'Unstate', count: 167, color: 'bg-orange-500' },
                      ].map((leg, i) => (
                        <div key={i} className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-2">
                            <span className={`w-3 h-3 rounded-full ${leg.color}`} />
                            <span className="font-bold text-slate-700 dark:text-slate-350">{leg.label}</span>
                          </div>
                          <span className="font-extrabold text-slate-900 dark:text-slate-100">{leg.count}</span>
                        </div>
                      ))}
                    </div>

                  </div>
                </div>

                {/* Basic Dynamic Admin Overview Stats Row for verification */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 border-t border-slate-200 dark:border-slate-800 pt-4">
                  {[
                    { label: 'Active Residents', value: stats?.residents || 0, icon: Users },
                    { label: 'Society Managers', value: stats?.managers || 0, icon: ShieldCheck },
                    { label: 'Active Guards', value: stats?.guards || 0, icon: ShieldCheck },
                    { label: 'Today Gate Entries', value: stats?.today_entries || 0, icon: Activity },
                  ].map(s => (
                    <div key={s.label} className={`p-4 border rounded-2xl flex items-center gap-3 ${card}`}>
                      <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                        <s.icon size={16} />
                      </div>
                      <div>
                        <p className="text-base font-black leading-none">{s.value}</p>
                        <p className={`text-[9px] font-bold uppercase tracking-wide mt-1 ${sub}`}>{s.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* APPROVALS */}
            {activeTab === 'approvals' && (
              <div className="space-y-3 max-w-2xl mx-auto">
                <h2 className="font-bold text-base flex items-center gap-2">Pending Resident Approvals ({pending.length})</h2>
                {pending.length === 0 ? (
                  <div className={`border rounded-2xl p-10 text-center ${card}`}>
                    <CheckCircle size={40} className="mx-auto text-emerald-400 mb-3" />
                    <p className="font-bold">All clear!</p>
                    <p className={`text-sm ${sub}`}>No pending approvals.</p>
                  </div>
                ) : pending.map(r => (
                  <div key={r.id} className={`border rounded-2xl p-4 ${card}`}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-600 flex items-center justify-center text-white font-bold">{r.name.charAt(0)}</div>
                      <div>
                        <p className="font-bold text-sm">{r.name}</p>
                        <p className={`text-xs ${sub}`}>{r.phone} &bull; Flat {r.flat_number}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleApprove(r.id, 'active')} disabled={actionLoading} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-sm">✅ Approve</button>
                      <button onClick={() => handleApprove(r.id, 'rejected')} disabled={actionLoading} className="flex-1 py-2 bg-red-500/15 text-red-500 border border-red-500/25 rounded-xl text-sm font-bold shadow-sm">❌ Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* MANAGERS */}
            {activeTab === 'managers' && (
              <div className="space-y-3 max-w-2xl mx-auto">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-base">Society Managers ({managers.length})</h2>
                  <button onClick={() => setShowAddManager(!showAddManager)} className="bg-indigo-600 hover:bg-indigo-750 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md">
                    {showAddManager ? <XCircle size={15}/> : <Plus size={15}/>} {showAddManager ? 'Cancel' : 'Add Manager'}
                  </button>
                </div>
                {showAddManager && (
                  <div className={`border rounded-2xl p-5 space-y-3 ${isDark ? 'bg-indigo-950/20 border-indigo-700/30' : 'bg-indigo-50 border-indigo-200'}`}>
                    <h4 className="font-bold text-sm text-indigo-400 flex items-center gap-2"><UserPlus size={15}/> New Manager Onboarding</h4>
                    <input placeholder="Full Name" value={newManager.name} onChange={e => setNewManager({...newManager, name: e.target.value})} className={`w-full border rounded-xl px-3 py-2.5 text-xs outline-none ${inp}`} />
                    <input placeholder="Phone Number" type="tel" value={newManager.phone} onChange={e => setNewManager({...newManager, phone: e.target.value})} className={`w-full border rounded-xl px-3 py-2.5 text-xs outline-none ${inp}`} />
                    <input placeholder="Password (default: 123456)" type="password" value={newManager.password} onChange={e => setNewManager({...newManager, password: e.target.value})} className={`w-full border rounded-xl px-3 py-2.5 text-xs outline-none ${inp}`} />
                    <button onClick={handleAddManager} disabled={actionLoading} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md">
                      {actionLoading ? <Loader2 className="animate-spin" size={16}/> : 'Create Manager Account'}
                    </button>
                  </div>
                )}
                <div className="space-y-2">
                  {managers.map(m => (
                    <div key={m.id} className={`border rounded-2xl p-4 flex items-center justify-between ${card}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-505 to-fuchsia-600 flex items-center justify-center text-white font-bold">{m.name.charAt(0)}</div>
                        <div>
                          <p className="font-bold text-sm">{m.name}</p>
                          <p className={`text-xs ${sub}`}>{m.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${m.account_status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>{m.account_status}</span>
                        <button onClick={() => handleDeleteManager(m.id)} className="text-red-400 hover:text-red-300 p-1.5"><Trash2 size={14}/></button>
                      </div>
                    </div>
                  ))}
                  {managers.length === 0 && <div className={`border rounded-2xl p-8 text-center ${card}`}><p className={`text-xs ${sub}`}>No managers assigned yet.</p></div>}
                </div>
              </div>
            )}

            {/* STAFF */}
            {activeTab === 'staff' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-base">Society Staff</h2>
                  <button onClick={() => setShowAddStaff(!showAddStaff)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md">
                    {showAddStaff ? <XCircle size={15}/> : <Plus size={15}/>} {showAddStaff ? 'Cancel' : 'Add Staff'}
                  </button>
                </div>
                {showAddStaff && (
                  <div className={`border rounded-2xl p-5 space-y-3 ${isDark ? 'bg-indigo-950/20 border-indigo-700/30' : 'bg-indigo-50 border-indigo-200'}`}>
                    <h4 className="font-bold text-sm text-indigo-400">Register New Guard / Staff</h4>
                    <input placeholder="Full Name" value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} className={`w-full border rounded-xl px-3 py-2.5 text-xs outline-none ${inp}`} />
                    <input placeholder="Phone" value={newStaff.phone} onChange={e => setNewStaff({...newStaff, phone: e.target.value})} className={`w-full border rounded-xl px-3 py-2.5 text-xs outline-none ${inp}`} />
                    <select value={newStaff.role} onChange={e => setNewStaff({...newStaff, role: e.target.value})} className={`w-full border rounded-xl px-3 py-2.5 text-xs outline-none ${inp}`}>
                      <option value="guard">Security Guard</option>
                      <option value="technician">Technician</option>
                      <option value="maid">Maid / Helper</option>
                      <option value="cook">Cook</option>
                    </select>
                    {['guard','technician'].includes(newStaff.role) && (
                      <input placeholder="Password (default: 123456)" type="password" value={newStaff.password} onChange={e => setNewStaff({...newStaff, password: e.target.value})} className={`w-full border rounded-xl px-3 py-2.5 text-xs outline-none ${inp}`} />
                    )}
                    <button onClick={handleAddStaff} disabled={actionLoading} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md">
                      {actionLoading ? <Loader2 className="animate-spin" size={16}/> : 'Register Staff'}
                    </button>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`border rounded-2xl p-4 ${card}`}>
                    <h3 className="font-bold text-sm mb-3 flex items-center gap-2 border-b pb-2"><ShieldCheck size={15} className="text-emerald-500"/> System Guards</h3>
                    {staff.systemStaff?.map(s => (
                      <div key={s.id} className={`flex items-center justify-between p-3 mb-2 rounded-2xl border ${isDark ? 'bg-slate-750/30 border-slate-700/40' : 'bg-gray-50 border-gray-200/40'}`}>
                        <div>
                          <p className="font-bold text-xs">{s.name}</p>
                          <p className={`text-[10px] capitalize ${sub}`}>{s.role} &bull; {s.phone}</p>
                        </div>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${s.role === 'guard' ? 'bg-blue-500/10 text-blue-500' : 'bg-orange-500/10 text-orange-500'}`}>{s.role}</span>
                      </div>
                    ))}
                    {!staff.systemStaff?.length && <p className={`text-xs ${sub} py-4 text-center`}>No active system staff.</p>}
                  </div>
                  
                  <div className={`border rounded-2xl p-4 ${card}`}>
                    <h3 className="font-bold text-sm mb-3 flex items-center gap-2 border-b pb-2"><Users size={15} className="text-indigo-400"/> Helpers Directory</h3>
                    {staff.externalStaff?.map(s => (
                      <div key={s.id} className={`flex items-center justify-between p-3 mb-2 rounded-2xl border ${isDark ? 'bg-slate-750/30 border-slate-700/40' : 'bg-gray-50 border-gray-200/40'}`}>
                        <div>
                          <p className="font-bold text-xs">{s.name}</p>
                          <p className={`text-[10px] capitalize ${sub}`}>{s.role} &bull; {s.phone}</p>
                        </div>
                        <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-purple-500/10 text-purple-500 uppercase">{s.role}</span>
                      </div>
                    ))}
                    {!staff.externalStaff?.length && <p className={`text-xs ${sub} py-4 text-center`}>No daily helpers listed.</p>}
                  </div>
                </div>
              </div>
            )}

            {/* RESIDENTS */}
            {activeTab === 'residents' && (
              <div className="space-y-3 max-w-2xl mx-auto">
                <h2 className="font-bold text-base">Active Residents ({residents.length})</h2>
                {residents.map(r => (
                  <div key={r.id} className={`border rounded-2xl p-4 flex items-center gap-3 ${card}`}>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold">{r.name.charAt(0)}</div>
                    <div className="flex-1">
                      <p className="font-bold text-sm">{r.name}</p>
                      <p className={`text-xs ${sub}`}>Flat <span className="text-indigo-500 dark:text-indigo-400 font-bold">{r.flat_number || 'N/A'}</span> &bull; {r.phone}</p>
                      <p className={`text-[9px] font-bold uppercase tracking-wider ${sub} mt-0.5`}>{r.role.replace('_', ' ')}</p>
                    </div>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold">Active</span>
                  </div>
                ))}
                {!residents.length && <div className={`border rounded-2xl p-10 text-center ${card}`}><Users size={36} className="mx-auto opacity-30 mb-2"/><p className={`text-sm ${sub}`}>No active residents.</p></div>}
              </div>
            )}

            {/* ENTRY LOGS */}
            {activeTab === 'logs' && (
              <div className="space-y-3 max-w-2xl mx-auto">
                <h2 className="font-bold text-base flex items-center gap-2"><Activity size={16} className="text-indigo-500"/> Security Gate Logs</h2>
                {entryLogs.length === 0 ? (
                  <div className={`border rounded-2xl p-10 text-center ${card}`}><Activity size={36} className="mx-auto opacity-30 mb-2"/><p className={`text-sm ${sub}`}>No gate movements registered.</p></div>
                ) : entryLogs.map(log => (
                  <div key={log.id} className={`border rounded-2xl p-4 ${card}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm ${log.entity_type === 'vehicle' ? 'bg-blue-500/10' : log.entity_type === 'guest' ? 'bg-emerald-500/10' : 'bg-purple-500/10'}`}>
                          {log.entity_type === 'vehicle' ? '🚗' : log.entity_type === 'guest' ? '🧑' : '👷'}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{log.entity_name || 'Unknown'}</p>
                          <p className={`text-xs ${sub} capitalize`}>{log.entity_type} &bull; {log.gate_number || 'Gate 1'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold">{new Date(log.entry_time).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                        {log.exit_time ? (
                          <span className="text-[10px] text-red-500 font-extrabold uppercase">Exited</span>
                        ) : (
                          <span className="text-[10px] text-emerald-500 font-extrabold uppercase">Inside Gate 🟢</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* NOTICES */}
            {activeTab === 'notices' && (
              <div className="max-w-2xl mx-auto">
                <AnnouncementBoard user={user} />
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ADMIN UTILITY MODALS */}

      {/* 1. MOCK PREPAID GRID RECHARGE POPUP */}
      {openRechargePopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-sm rounded-[24px] p-6 border shadow-2xl ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-sm flex items-center gap-1.5">🔌 Prepaid Grid Recharge</h3>
              <button onClick={() => setOpenRechargePopup(false)} className="text-slate-400 hover:text-slate-600"><XCircle size={18} /></button>
            </div>
            
            <form onSubmit={handleElectricityRechargeSubmit} className="space-y-4">
              <p className={`text-xs leading-relaxed ${sub}`}>Add simulated balance to the community's prepaid power grids (Pavilion Heights). This simulates recharges received from maintenance counters.</p>
              
              <div>
                <label className={`text-[10px] font-bold uppercase tracking-wider mb-1 block ${sub}`}>Recharge Amount (₹)</label>
                <input 
                  type="number" 
                  placeholder="e.g. 50000" 
                  value={rechargeAmt}
                  onChange={e => setRechargeAmt(e.target.value)}
                  required
                  className={`w-full rounded-xl border px-3 py-2 text-xs outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                />
              </div>

              <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all">
                Submit Grid Recharge
              </button>
            </form>
          </div>
        </div>
      )}

      {/* USER PROFILE MODAL */}
      <UserProfile isOpen={showProfile} onClose={() => setShowProfile(false)} />

    </div>
  );
};

export default AdminDashboard;
