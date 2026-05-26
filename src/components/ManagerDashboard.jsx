import React, { useState, useEffect, useCallback } from 'react';
import ISTClock from './ISTClock';
import { useTheme } from '../context/ThemeContext';
import {
  LayoutDashboard, Users, ShieldCheck, Wrench, ClipboardList, Car,
  LogOut, CheckCircle, XCircle, Plus, ChevronRight, ChevronLeft, Calendar,
  AlertCircle, Clock, Bell, UserPlus, Loader2, User, PenLine, Trash2, Megaphone, Activity, BarChart2,
  Phone, PhoneCall, AlertTriangle, Edit3, ArrowRight, Search, Shield, Building, Filter, RefreshCw,
  Settings, ToggleLeft, ToggleRight, SlidersHorizontal
} from 'lucide-react';
import { managerAPI, serviceAPI, entryAPI, announcementAPI, adsAPI, emergencyAPI, authAPI, societyAPI, adminAPI } from '../services/api';
import UserProfile from './UserProfile';
import AnnouncementBoard from './AnnouncementBoard';
import NotificationsTab from './NotificationsTab';
import { AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

const ManagerDashboard = ({ user, onLogout, sharedSocket }) => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [managerSociety, setManagerSociety] = useState(user?.society_name || '');
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
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [showAddEmergency, setShowAddEmergency] = useState(false);
  const [editingEmergency, setEditingEmergency] = useState(null);
  const [newEmergency, setNewEmergency] = useState({ name: '', phone: '', category: 'Police', priority: 5 });
  
  // History log filters state
  const [logSearch, setLogSearch] = useState('');
  const [logType, setLogType] = useState('all');
  const [logStatus, setLogStatus] = useState('all');
  const [logDateFilter, setLogDateFilter] = useState('all');
  const [logCustomStartDate, setLogCustomStartDate] = useState('');
  const [logCustomEndDate, setLogCustomEndDate] = useState('');
  const [logViewMode, setLogViewMode] = useState('list'); // 'list' or 'calendar'
  const [calendarSelectedDate, setCalendarSelectedDate] = useState(null);
  const [calendarCurrentMonth, setCalendarCurrentMonth] = useState(new Date());
  
  // Vehicles tab filters state
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState('all');
  const [vehicleCountFilter, setVehicleCountFilter] = useState('all');
  
  // Residents tab filters state
  const [residentSearch, setResidentSearch] = useState('');
  const [residentTowerFilter, setResidentTowerFilter] = useState('all');
  
  // Ads State
  const [ads, setAds] = useState([]);
  const [showAddAd, setShowAddAd] = useState(false);
  const [newAd, setNewAd] = useState({ title: '', description: '', image_url: '', link: '' });

  // Guard Feature Settings (stored in MySQL database per society)
  const guardSettingsKey = `guard_settings_${user?.society_id || user?.id || 'default'}`;
  const defaultGuardSettings = {
    anpr: true,
    preapproved: true,
    manual: true,
    vehicles: true,
    checkout: true,
    sos: true,
    vehicle_mandatory: false,
  };
  const [guardSettings, setGuardSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(`guard_settings_${user?.society_id || user?.id || 'default'}`);
      return stored ? { ...defaultGuardSettings, ...JSON.parse(stored) } : defaultGuardSettings;
    } catch { return defaultGuardSettings; }
  });

  useEffect(() => {
    const fetchGuardSettings = async () => {
      try {
        const societyId = user?.society_id;
        if (societyId) {
          const res = await societyAPI.getSettings(societyId);
          setGuardSettings(res.data);
          localStorage.setItem(guardSettingsKey, JSON.stringify(res.data));
        }
      } catch (err) {
        console.error('Failed to fetch guard settings:', err);
      }
    };
    fetchGuardSettings();
  }, [user?.society_id, guardSettingsKey]);

  const handleGuardSettingToggle = (key) => {
    setGuardSettings(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      const societyId = user?.society_id;
      if (societyId) {
        societyAPI.updateSettings(societyId, updated).catch(err => {
          console.error('Failed to save settings to MySQL:', err);
        });
        localStorage.setItem(guardSettingsKey, JSON.stringify(updated));
      }
      return updated;
    });
  };

  // ── Towers Management State & Functions ─────────────────────────
  const [towers, setTowers] = useState([]);
  const [newTowerName, setNewTowerName] = useState('');
  const [towersLoading, setTowersLoading] = useState(false);
  const [towerActionLoading, setTowerActionLoading] = useState(false);

  const fetchTowers = useCallback(async () => {
    const societyId = user?.society_id;
    if (!societyId) return;
    setTowersLoading(true);
    try {
      const res = await societyAPI.getTowers(societyId);
      setTowers(res.data || []);
    } catch (err) {
      console.error('Failed to fetch society towers:', err);
    } finally {
      setTowersLoading(false);
    }
  }, [user?.society_id]);

  const handleAddTower = async () => {
    const societyId = user?.society_id;
    if (!societyId) {
      return alert('Error: Society ID not found. Please log out and log in again.');
    }
    if (!newTowerName || !newTowerName.trim()) {
      return alert('Tower name is required.');
    }
    setTowerActionLoading(true);
    try {
      await societyAPI.addTower(societyId, newTowerName.trim());
      setNewTowerName('');
      await fetchTowers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add tower.');
    } finally {
      setTowerActionLoading(false);
    }
  };

  const handleDeleteTower = async (towerId) => {
    const societyId = user?.society_id;
    if (!societyId) {
      return alert('Error: Society ID not found. Please log out and log in again.');
    }
    if (!window.confirm('Are you sure you want to delete this tower? Registered residents of this tower will not be deleted, but this tower option will be removed from selections.')) {
      return;
    }
    setTowerActionLoading(true);
    try {
      await societyAPI.deleteTower(societyId, towerId);
      await fetchTowers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete tower.');
    } finally {
      setTowerActionLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'guard_settings' || activeTab === 'towers') {
      fetchTowers();
    }
  }, [activeTab, fetchTowers]);


  // Premium design styling variables
  const mainBg = isDark ? 'bg-mesh-dark text-white' : 'bg-mesh-light text-slate-800';
  const cardStyle = isDark 
    ? 'bg-slate-900/65 backdrop-blur-xl border border-slate-800/80 rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.25)]' 
    : 'bg-white/75 backdrop-blur-xl border border-white/60 rounded-3xl shadow-[0_12px_40px_rgba(31,38,135,0.04)]';
  const subtext = isDark ? 'text-slate-400' : 'text-slate-500';
  const textLabel = isDark ? 'text-slate-400' : 'text-slate-600';
  const inputStyle = isDark
    ? 'bg-slate-950/40 border-slate-800/80 text-white placeholder-slate-500 focus:border-indigo-500/80 focus:shadow-[0_0_15px_rgba(99,102,241,0.15)] outline-none transition-all duration-300'
    : 'bg-white/60 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-indigo-600/80 focus:shadow-[0_0_15px_rgba(99,102,241,0.08)] outline-none transition-all duration-300';
  const headerStyle = isDark ? 'bg-slate-900/60 border-slate-800/80' : 'bg-white/70 border-slate-200/50';

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    if (sharedSocket) {
      sharedSocket.on('guards_status_update', fetchStaffData);
    }
    return () => {
      if (sharedSocket) {
        sharedSocket.off('guards_status_update', fetchStaffData);
      }
    };
  }, [sharedSocket]);

  const fetchStaffData = async () => {
    try {
      const res = await managerAPI.getStaff();
      setStaff(res.data);
    } catch (err) {
      console.error('Failed to fetch staff data:', err);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Sync manager profile on mount to get correct society details
      authAPI.getProfile().then(res => {
        if (res.data && res.data.society_name) {
          setManagerSociety(res.data.society_name);
          // Sync back to local storage
          const stored = localStorage.getItem('user');
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              const updated = { ...parsed, ...res.data };
              localStorage.setItem('user', JSON.stringify(updated));
            } catch (e) {
              console.error('Failed to sync stored user from manager profile:', e);
            }
          }
        }
      }).catch(err => {
        console.error('Error fetching manager profile:', err);
      });

      const [pendingRes, ticketsRes, staffRes, logsRes, residentsRes, adsRes, emergencyRes] = await Promise.all([
        managerAPI.getPendingResidents(),
        serviceAPI.getAllRequests(),
        managerAPI.getStaff(),
        entryAPI.getLogs().catch(() => ({ data: [] })),
        managerAPI.getResidents().catch(() => ({ data: [] })),
        adsAPI.getAll().catch(() => ({ data: [] })),
        emergencyAPI.getAll().catch(() => ({ data: [] }))
      ]);
      setPendingResidents(pendingRes.data);
      setTickets(ticketsRes.data);
      setStaff(staffRes.data);
      setEntryLogs(logsRes.data);
      setResidents(residentsRes.data);
      setAds(adsRes.data);
      setEmergencyContacts(emergencyRes.data);
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
      await fetchAllData();
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
      await fetchAllData();
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

  const tabGroups = [
    {
      group: 'Overview',
      items: [
        { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { key: 'analytics', label: 'Analytics', icon: BarChart2 },
        { key: 'notifications', label: 'Alerts', icon: Bell },
      ]
    },
    {
      group: 'People & Operations',
      items: [
        { key: 'approvals', label: 'Approvals', icon: ClipboardList },
        { key: 'residents', label: 'Residents', icon: ShieldCheck },
        { key: 'staff', label: 'Staff', icon: Users },
        { key: 'tickets', label: 'Tickets', icon: Wrench },
      ]
    },
    {
      group: 'Gate & Logs',
      items: [
        { key: 'logs', label: 'Entry Log', icon: Activity },
        { key: 'vehicles', label: 'Vehicles', icon: Car },
      ]
    },
    {
      group: 'Settings & More',
      items: [
        { key: 'emergency', label: 'Emergency', icon: AlertCircle },
        { key: 'notices', label: 'Notices', icon: Bell },
        { key: 'ads', label: 'Promotions', icon: Megaphone },
        { key: 'towers', label: 'Towers / Wings', icon: Building },
        { key: 'guard_settings', label: 'Guard Settings', icon: SlidersHorizontal },
      ]
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f172a] text-white">
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
        </div>
        <p className="text-slate-400 font-heading font-semibold animate-pulse">Loading Manager Dashboard...</p>
      </div>
    );
  }

  return (
    <div className={`flex h-screen overflow-hidden transition-all duration-500 ${mainBg}`}>
      {/* Background Graphic Elements */}
      <div className="absolute top-0 left-[20%] w-[40%] h-[30%] rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[10%] w-[35%] h-[35%] rounded-full bg-emerald-500/80 dark:bg-emerald-500/5 blur-[140px] opacity-10 pointer-events-none" />

      {/* Beautiful Sidebar Navigation */}
      <aside className={`w-64 md:w-72 border-r backdrop-blur-xl flex flex-col z-50 shadow-[4px_0_24px_rgba(0,0,0,0.05)] ${headerStyle}`}>
        <div className="p-6 border-b border-slate-200/50 dark:border-slate-800/80 flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-emerald-500 p-[1.5px] shadow-[0_8px_20px_rgba(99,102,241,0.2)]">
            <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center">
              <ShieldCheck size={20} className="text-indigo-400" />
            </div>
          </div>
          <div>
            <h1 className="font-extrabold text-sm sm:text-base leading-tight tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300">
              Manager Panel
            </h1>
            <ISTClock showDate className={`text-[10px] font-bold ${subtext}`} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-indigo-500/20 hover:scrollbar-thumb-indigo-500/40">
          {tabGroups.map((group, idx) => (
            <div key={idx} className="space-y-1.5">
              <h3 className={`px-3 text-[10px] font-black uppercase tracking-widest ${subtext}`}>{group.group}</h3>
              <div className="space-y-1">
                {group.items.map(({ key, label, icon: Icon }) => {
                  const isActive = activeTab === key;
                  return (
                    <button 
                      key={key} 
                      onClick={() => setActiveTab(key)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 group
                        ${isActive 
                          ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-[0_4px_15px_rgba(99,102,241,0.25)]' 
                          : isDark 
                            ? 'text-slate-400 hover:text-white hover:bg-slate-900/40' 
                            : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/50'
                        }`}
                    >
                      <Icon size={18} className={isActive ? 'text-white' : 'text-indigo-400 group-hover:scale-110 transition-transform duration-300'} />
                      <span>{label}</span>
                      {key === 'approvals' && pendingResidents.length > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black shadow-md border border-red-400/50">
                          {pendingResidents.length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-4 border-t border-slate-200/50 dark:border-slate-800/80 shrink-0">
          <div className={`rounded-2xl p-3 border ${cardStyle} flex flex-col gap-2`}>
            <button 
              onClick={() => setShowProfile(true)} 
              className={`w-full py-2 px-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all hover:scale-[1.02] ${
                isDark ? 'bg-slate-950/40 text-slate-300 hover:text-indigo-400 hover:bg-slate-900' : 'bg-slate-100 text-slate-700 hover:text-indigo-600 hover:bg-slate-200'
              }`}
            >
              <User size={14} /> My Profile
            </button>
            <button 
              onClick={onLogout} 
              className={`w-full py-2 px-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all hover:scale-[1.02] ${
                isDark ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-red-50 text-red-600 hover:bg-red-100'
              }`}
            >
              <LogOut size={14} /> Log Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto relative z-10 scrollbar-thin scrollbar-thumb-indigo-500/20">
        <header className={`sticky top-0 z-40 px-8 py-4 backdrop-blur-xl flex items-center justify-between border-b ${headerStyle}`}>
           <div>
             <h2 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 capitalize">
               {activeTab.replace('_', ' ')}
             </h2>
           </div>
           <div className="flex items-center gap-3.5">
              {pendingResidents.length > 0 && (
                <div className="relative cursor-pointer group" onClick={() => setActiveTab('approvals')}>
                  <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500 group-hover:scale-105 transition-all shadow-sm">
                    <Bell size={18} className="animate-sos-pulse" />
                  </div>
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-black shadow-md border-2 border-slate-950">
                    {pendingResidents.length}
                  </span>
                </div>
              )}
           </div>
        </header>

        <div className="p-6 md:p-8 max-w-6xl mx-auto w-full space-y-6 pb-24">

        {activeTab === 'notifications' && (
          <div className="animate-slide-up">
            <NotificationsTab user={user} />
          </div>
        )}

        {/* ─── TAB: DASHBOARD ────────────────────────────────────────── */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-slide-up">
            
            {/* Quick Hero Banner */}
            <div className="relative rounded-[32px] overflow-hidden h-36 bg-mesh-dark border border-slate-800/80 flex items-center px-8 shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/40 to-slate-900/10" />
              <div className="relative z-10 space-y-1 max-w-md">
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  🛡️ GATEKEEPER COMMAND
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white leading-tight drop-shadow-md font-heading mt-2">
                  Welcome Back, {user?.name || 'Manager'}
                </h2>
                <p className="text-xs text-white/70 font-semibold drop-shadow flex items-center gap-1.5 mt-1">
                  🏢 Society: <span className="text-indigo-300 font-extrabold">{managerSociety || user?.society_name || 'Loading Society...'}</span> &bull; Status: Real-time active monitoring
                </p>
              </div>
              <div className="absolute right-8 bottom-0 top-0 items-center justify-center hidden md:flex opacity-10">
                <ShieldCheck size={120} className="text-white" />
              </div>
            </div>

            {/* Premium Stat Widget Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { 
                  label: 'Pending Approvals', 
                  value: pendingResidents.length, 
                  color: 'text-yellow-400', 
                  bg: 'bg-yellow-500/10 border-yellow-500/15', 
                  icon: Clock,
                  desc: 'Residents awaiting verification',
                  glow: 'shadow-[0_8px_25px_rgba(234,179,8,0.15)]',
                  onClick: () => setActiveTab('approvals')
                },
                { 
                  label: 'Active Tickets', 
                  value: tickets.filter(t => t.status !== 'Resolved').length, 
                  color: 'text-rose-400', 
                  bg: 'bg-rose-500/10 border-rose-500/15', 
                  icon: AlertCircle,
                  desc: 'In-progress & open issues',
                  glow: 'shadow-[0_8px_25px_rgba(244,63,94,0.15)]',
                  onClick: () => setActiveTab('tickets')
                },
                { 
                  label: 'Resolved Tickets', 
                  value: tickets.filter(t => t.status === 'Resolved').length, 
                  color: 'text-emerald-400', 
                  bg: 'bg-emerald-500/10 border-emerald-500/15', 
                  icon: CheckCircle,
                  desc: 'Helpdesk requests closed',
                  glow: 'shadow-[0_8px_25px_rgba(16,185,129,0.15)]',
                  onClick: () => setActiveTab('tickets')
                },
                { 
                  label: 'Access Staff', 
                  value: staff.systemStaff.length + staff.externalStaff.length, 
                  color: 'text-indigo-400', 
                  bg: 'bg-indigo-500/10 border-indigo-500/15', 
                  icon: Users,
                  desc: 'Guards, techs & helper staff',
                  glow: 'shadow-[0_8px_25px_rgba(99,102,241,0.15)]',
                  onClick: () => setActiveTab('staff')
                },
              ].map(s => (
                <div 
                  key={s.label} 
                  onClick={s.onClick}
                  className={`border rounded-[28px] p-5 cursor-pointer relative group transition-all duration-300 hover:scale-[1.03] ${cardStyle} ${s.glow}`}
                >
                  <div className={`w-10 h-10 rounded-2xl ${s.bg} flex items-center justify-center border mb-3.5 group-hover:scale-110 transition-transform duration-300`}>
                    <s.icon size={18} className={s.color} />
                  </div>
                  <p className={`text-3xl font-black ${s.color} font-heading leading-none`}>{s.value}</p>
                  <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-2">{s.label}</p>
                  <p className={`text-[9px] font-semibold mt-0.5 ${subtext}`}>{s.desc}</p>
                  
                  {/* Hover indicator arrow */}
                  <div className="absolute top-5 right-5 text-indigo-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">
                    <ArrowRight size={14} />
                  </div>
                </div>
              ))}
            </div>

            {/* Dynamic Pending Approvals VIP section inside Dashboard */}
            {pendingResidents.length > 0 && (
              <div className={`rounded-[32px] border p-6 animate-scale-up ${
                isDark ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-yellow-50/40 border-yellow-200'
              }`}>
                <div className="flex items-center justify-between mb-4.5">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                    </span>
                    <h3 className="font-heading font-black text-sm text-yellow-500 uppercase tracking-wider">
                      Critical Approvals Action Requested
                    </h3>
                  </div>
                  <button 
                    onClick={() => setActiveTab('approvals')}
                    className="text-[10px] font-black uppercase text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    View All Approvals <ChevronRight size={12} />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {pendingResidents.slice(0, 3).map(r => (
                    <div 
                      key={r.id} 
                      className={`rounded-2xl border p-4.5 transition-all duration-300 hover:scale-[1.01] ${
                        isDark ? 'bg-slate-900/60 border-slate-800/80 shadow-md' : 'bg-white shadow-sm border-slate-200/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-500 to-indigo-500 flex items-center justify-center text-white font-extrabold text-xs shadow-md">
                          {(r.name || 'U').substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-black text-xs text-slate-800 dark:text-slate-200 leading-snug truncate">{r.name}</p>
                           <p className={`text-[10px] font-bold mt-0.5 text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full inline-block`}>
                             {r.tower ? 'Tower ' + r.tower + ' - ' : ''}Flat {r.flat_number || 'N/A'}
                           </p>
                          <p className={`text-[9px] mt-1 ${subtext} truncate font-mono`}>{r.phone}</p>
                        </div>
                      </div>
                      <div className="flex gap-2.5 mt-4">
                        <button 
                          onClick={() => handleApprove(r.id)} 
                          disabled={actionLoading}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <CheckCircle size={11} /> Approve
                        </button>
                        <button 
                          onClick={() => handleReject(r.id)} 
                          disabled={actionLoading}
                          className="px-3 py-2 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/15 rounded-xl transition-all flex items-center justify-center active:scale-95"
                        >
                          <XCircle size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Live activity logs quick look */}
            <div className={`rounded-[32px] p-6 border ${cardStyle}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-black text-sm uppercase tracking-wider flex items-center gap-2">
                  <Activity size={15} className="text-indigo-400" /> Live Security Monitoring
                </h3>
                <button 
                  onClick={() => setActiveTab('logs')}
                  className="text-[10px] font-black uppercase text-indigo-400 hover:underline flex items-center gap-1"
                >
                  Full Gate Records <ChevronRight size={12} />
                </button>
              </div>

              {entryLogs.length === 0 ? (
                <p className={`text-xs text-center py-6 ${subtext}`}>No recent gate entries logged.</p>
              ) : (
                <div className="space-y-3.5">
                  {entryLogs.slice(0, 3).map(log => {
                    const isInside = !log.exit_time;
                    return (
                      <div 
                        key={log.id} 
                        className={`rounded-2xl border p-4 flex items-center justify-between transition-all duration-300 hover:scale-[1.01] ${
                          isDark ? 'bg-slate-950/20 border-slate-900' : 'bg-slate-50 border-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-900/80 to-slate-800/80 flex items-center justify-center text-lg shadow-sm border border-slate-800">
                            {log.entity_type === 'vehicle' ? '🚗' : log.entity_type === 'guest' ? '🧑' : '👷'}
                          </div>
                          <div>
                            <p className="font-black text-xs text-slate-800 dark:text-slate-200">{log.entity_name || 'Visitor'}</p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/10">
                                {log.entity_type}
                              </span>
                              {log.flat_number && (
                                <span className={`text-[9px] font-extrabold ${subtext}`}>
                                  {log.tower ? log.tower + '-' : ''}Flat {log.flat_number}
                                </span>
                              )}
                              {log.vehicle_number && (
                                <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border flex items-center gap-0.5
                                  ${isDark 
                                    ? 'bg-amber-950/40 text-amber-300 border-amber-500/20' 
                                    : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                                  <span>{log.vehicle_number === 'Walk-in' ? '🚶' : '🚗'}</span>
                                  <span>{log.vehicle_number}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider ${
                            isInside 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 animate-pulse' 
                              : 'bg-slate-500/10 text-slate-400 border border-slate-500/25'
                          }`}>
                            {isInside ? '🟢 INSIDE' : '🔴 EXITED'}
                          </span>
                          <p className={`text-[8px] font-mono mt-1 ${subtext}`}>
                            {new Date(log.entry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
          </div>
        )}

        {/* ─── TAB: APPROVALS ────────────────────────────────────────── */}
        {activeTab === 'approvals' && (
          <div className="space-y-4 animate-slide-up">
            <div className="flex items-center gap-2">
              <ClipboardList size={18} className="text-indigo-400" />
              <h2 className="font-heading font-black text-base uppercase tracking-wider">Resident Registration Requests</h2>
            </div>
            
            {pendingResidents.length === 0 ? (
              <div className={`rounded-[32px] p-12 text-center border ${cardStyle}`}>
                <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 animate-sos-pulse">
                  <CheckCircle size={26} />
                </div>
                <p className="font-black text-slate-800 dark:text-white">All clear!</p>
                <p className={`text-xs mt-1.5 ${subtext}`}>No pending resident registrations require approval at this time.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingResidents.map(r => (
                  <div key={r.id} className={`rounded-[30px] border p-5.5 relative overflow-hidden transition-all duration-300 hover:scale-[1.01] ${cardStyle}`}>
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-500/5 to-transparent pointer-events-none" />
                    
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-[18px] bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white font-black flex items-center justify-center text-sm shadow-lg">
                        {(r.name || 'U').substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-black text-sm text-slate-800 dark:text-slate-100 leading-snug">{r.name}</p>
                        <p className={`text-[10px] font-black text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full inline-block mt-1`}>
                          {r.tower ? 'Tower ' + r.tower + ' - ' : ''}Flat {r.flat_number || 'N/A'}
                        </p>
                        <div className="space-y-1 mt-3">
                          <p className={`text-[10px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5`}>
                            📞 Phone: <span className="font-mono font-black">{r.phone}</span>
                          </p>
                          <p className={`text-[10px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5`}>
                            📅 Requested: <span className="font-bold">{new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-3.5 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/40">
                      <button 
                        onClick={() => handleApprove(r.id)} 
                        disabled={actionLoading}
                        className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-md shadow-emerald-600/10"
                      >
                        {actionLoading ? <Loader2 className="animate-spin" size={14}/> : <><CheckCircle size={13} /> Approve</>}
                      </button>
                      <button 
                        onClick={() => handleReject(r.id)} 
                        disabled={actionLoading}
                        className="flex-1 py-3 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/15 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-[0.98]"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB: TICKETS ────────────────────────────────────────── */}
        {activeTab === 'tickets' && (
          <div className="space-y-4 animate-slide-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench size={18} className="text-indigo-400" />
                <h2 className="font-heading font-black text-base uppercase tracking-wider">Service Requests Desk</h2>
              </div>
              <p className={`text-xs ${subtext}`}>Total: <span className="text-indigo-400 font-bold">{tickets.length} tickets</span> logged</p>
            </div>
            
            {tickets.length === 0 ? (
              <div className={`rounded-[32px] p-12 text-center border ${cardStyle}`}>
                <Wrench size={36} className="mx-auto opacity-30 mb-3 text-indigo-500" />
                <p className="font-black text-slate-800 dark:text-white">No tickets active</p>
                <p className={`text-xs mt-1 ${subtext}`}>No service requests have been reported by residents yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {tickets.map(t => (
                  <div key={t.id} className={`rounded-[30px] border p-5.5 transition-all duration-300 hover:scale-[1.01] ${cardStyle}`}>
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                            t.status === 'Open' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 animate-pulse' :
                            t.status === 'In-progress' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' :
                            'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          }`}>
                            {t.status}
                          </span>
                          <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full">
                            {t.tower ? 'Tower ' + t.tower + ' - ' : ''}Flat {t.flat_number || 'N/A'}
                          </span>
                          <span className={`text-[10px] font-bold ${subtext}`}>
                            📂 {t.category}
                          </span>
                        </div>
                        <p className="font-black text-sm text-slate-800 dark:text-slate-100 mt-2.5 leading-snug">{t.description}</p>
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/40">
                          <div className="w-5 h-5 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center text-[9px]">
                            {(t.resident_name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <span className={`text-[9px] font-semibold ${subtext}`}>
                            By: {t.resident_name} &bull; {new Date(t.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      
                      {t.status === 'Open' && (
                        <div className="bg-slate-950/20 dark:bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4.5 sm:max-w-xs w-full shrink-0">
                          <p className="text-[9px] font-black mb-2 text-indigo-400 uppercase tracking-widest">
                            Assign Technician
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {staff.systemStaff.filter(s => s.role === 'technician').map(tech => (
                              <button 
                                key={tech.id} 
                                onClick={() => handleAssignTicket(t.id, tech.id)}
                                className="text-[9px] bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-xl font-black uppercase tracking-wider transition-all active:scale-95 shadow-sm"
                              >
                                {tech.name.split(' ')[0]}
                              </button>
                            ))}
                            {staff.systemStaff.filter(s => s.role === 'technician').length === 0 && (
                              <p className="text-[9px] text-red-400 font-bold border border-red-500/20 bg-red-500/10 px-2.5 py-1.5 rounded-xl">
                                No technicians available.
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB: STAFF ────────────────────────────────────────── */}
        {activeTab === 'staff' && (
          <div className="space-y-5 animate-slide-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-indigo-400" />
                <h2 className="font-heading font-black text-base uppercase tracking-wider">Society Staff Directory</h2>
              </div>
              <button 
                onClick={() => { setShowAddStaff(!showAddStaff); setEditingStaff(null); setNewStaff({ name: '', phone: '', role: 'guard', password: '' }); }} 
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-md shadow-indigo-600/10"
              >
                {showAddStaff ? <XCircle size={14} /> : <Plus size={14} />}
                <span>{showAddStaff ? 'Cancel Form' : 'Register Staff'}</span>
              </button>
            </div>

            {showAddStaff && (
              <div className={`rounded-[30px] border p-6 space-y-4 animate-scale-up ${
                isDark ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-indigo-50/40 border-indigo-200'
              }`}>
                <h3 className="font-heading font-black text-xs text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                  <UserPlus size={14} /> {editingStaff ? 'Update Staff Member Profile' : 'New Staff Registration Form'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className={`text-[9px] font-black uppercase tracking-widest mb-1.5 block ${textLabel}`}>Full Name</label>
                    <input 
                      placeholder="e.g. Laxman Rawat" 
                      value={newStaff.name} 
                      onChange={e => setNewStaff({...newStaff, name: e.target.value})} 
                      className={`w-full px-4 py-3 rounded-2xl border text-xs ${inputStyle}`} 
                    />
                  </div>
                  <div>
                    <label className={`text-[9px] font-black uppercase tracking-widest mb-1.5 block ${textLabel}`}>Phone Number</label>
                    <input 
                      placeholder="e.g. 9876543210" 
                      value={newStaff.phone} 
                      onChange={e => setNewStaff({...newStaff, phone: e.target.value})} 
                      className={`w-full px-4 py-3 rounded-2xl border text-xs ${inputStyle}`} 
                    />
                  </div>
                  <div>
                    <label className={`text-[9px] font-black uppercase tracking-widest mb-1.5 block ${textLabel}`}>Role</label>
                    <div className="relative flex items-center">
                      <select 
                        value={newStaff.role} 
                        onChange={e => setNewStaff({...newStaff, role: e.target.value})} 
                        className={`w-full px-4 py-3 rounded-2xl border text-xs appearance-none cursor-pointer outline-none ${inputStyle}`}
                      >
                        <option value="guard">🛡️ Security Guard</option>
                        <option value="technician">🔧 Technician</option>
                        <option value="maid">🧹 Maid / Helper</option>
                        <option value="cook">🍳 Cook</option>
                      </select>
                      <ChevronRight size={14} className={`absolute right-4 pointer-events-none rotate-90 ${subtext}`} />
                    </div>
                  </div>
                  {['guard', 'technician'].includes(newStaff.role) && (
                    <div className="sm:col-span-3">
                      <label className={`text-[9px] font-black uppercase tracking-widest mb-1.5 block ${textLabel}`}>
                        {editingStaff ? "New Password (Leave blank to keep current)" : "Login Password (Min 6 chars)"}
                      </label>
                      <input 
                        placeholder="Create strong password" 
                        type="password" 
                        value={newStaff.password || ''} 
                        onChange={e => setNewStaff({...newStaff, password: e.target.value})} 
                        className={`w-full px-4 py-3 rounded-2xl border text-xs ${inputStyle}`} 
                      />
                    </div>
                  )}
                </div>
                <button 
                  onClick={handleAddOrEditStaff} 
                  disabled={actionLoading} 
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-indigo-600/10"
                >
                  {actionLoading ? <Loader2 className="animate-spin" size={15} /> : (editingStaff ? 'Update Staff Member' : 'Register Staff')}
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              
              {/* System Access Staff */}
              <div className={`rounded-[32px] border p-5 ${cardStyle}`}>
                <h3 className="font-heading font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-400" /> System Access Staff (Guards/Techs)
                </h3>
                {staff.systemStaff.length === 0 && <p className={`text-xs ${subtext} text-center py-6`}>No system access staff found.</p>}
                
                <div className="space-y-3">
                  {staff.systemStaff.map(s => {
                    const isGuard = s.role === 'guard';
                    const isOnline = isGuard && !!s.is_online;
                    return (
                      <div key={s.id} className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                        isDark 
                          ? isOnline
                            ? 'bg-emerald-950/20 border-emerald-500/20 shadow-[0_4px_20px_rgba(16,185,129,0.04)]'
                            : 'bg-slate-950/20 border-slate-900 hover:border-slate-800'
                          : isOnline
                            ? 'bg-emerald-50/50 border-emerald-200'
                            : 'bg-slate-50 border-slate-100 hover:border-slate-200'
                      }`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black border ${
                            isOnline
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold'
                              : 'bg-gradient-to-tr from-slate-900 to-slate-850 border border-slate-800'
                          }`}>
                            {s.role === 'guard' ? '🛡️' : '🔧'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-black text-xs text-slate-800 dark:text-slate-100">{s.name}</p>
                              {isGuard && (
                                isOnline ? (
                                  <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5 animate-pulse">
                                    <span className="w-1 h-1 rounded-full bg-emerald-400"></span>
                                    ACTIVE
                                  </span>
                                ) : (
                                  <span className="bg-slate-500/10 border border-slate-600/30 text-slate-400 text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                    <span className="w-1 h-1 rounded-full bg-slate-500"></span>
                                    OFFLINE
                                  </span>
                                )
                              )}
                            </div>
                            <p className={`text-[10px] capitalize font-semibold mt-0.5 ${subtext}`}>
                              {s.role} &bull; <span className="font-mono">{s.phone}</span>
                            </p>
                          </div>
                        </div>
                      <div className="flex items-center gap-1.5">
                        <button 
                          onClick={() => handleEditStaff(s, 'system')} 
                          className={`p-2 rounded-xl transition-all text-indigo-400 hover:bg-indigo-500/10`}
                        >
                          <PenLine size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeleteStaff(s.id, 'system')} 
                          className={`p-2 rounded-xl transition-all text-rose-400 hover:bg-rose-500/10`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>

              {/* Daily Helpers */}
              <div className={`rounded-[32px] border p-5 ${cardStyle}`}>
                <h3 className="font-heading font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Users size={16} className="text-indigo-400" /> Daily Helpers (Maids/Drivers)
                </h3>
                {staff.externalStaff.length === 0 && <p className={`text-xs ${subtext} text-center py-6`}>No daily helpers found.</p>}
                
                <div className="space-y-3">
                  {staff.externalStaff.map(s => (
                    <div key={s.id} className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                      isDark ? 'bg-slate-950/20 border-slate-900 hover:border-slate-800' : 'bg-slate-50 border-slate-100 hover:border-slate-200'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-900 to-slate-850 border border-slate-800 flex items-center justify-center text-xs font-black">
                          {s.role === 'maid' ? '🧹' : s.role === 'cook' ? '🍳' : '🚗'}
                        </div>
                        <div>
                          <p className="font-black text-xs text-slate-800 dark:text-slate-100">{s.name}</p>
                          <p className={`text-[10px] capitalize font-semibold mt-0.5 ${subtext}`}>
                            {s.role} &bull; <span className="font-mono">{s.phone}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button 
                          onClick={() => handleEditStaff(s, 'external')} 
                          className="p-2 rounded-xl transition-all text-indigo-400 hover:bg-indigo-500/10"
                        >
                          <PenLine size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeleteStaff(s.id, 'external')} 
                          className="p-2 rounded-xl transition-all text-rose-400 hover:bg-rose-500/10"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ─── TAB: RESIDENTS ────────────────────────────────────────── */}
        {activeTab === 'residents' && (() => {
          // Filtered list of active verified residents
          const filteredResidents = residents.filter(r => {
            // 1. Tower filter
            if (residentTowerFilter !== 'all') {
              const rTower = r.tower || 'Other';
              if (residentTowerFilter === 'other' && r.tower) return false;
              if (residentTowerFilter !== 'other' && rTower.toLowerCase().trim() !== residentTowerFilter.toLowerCase().trim()) return false;
            }
            
            // 2. Search query
            if (residentSearch) {
              const q = residentSearch.toLowerCase().trim();
              const nameMatch = String(r.name || '').toLowerCase().includes(q);
              const flatMatch = String(r.flat_number || '').toLowerCase().includes(q) || String(r.tower || '').toLowerCase().includes(q);
              const phoneMatch = String(r.phone || '').toLowerCase().includes(q);
              const roleMatch = String(r.role || '').toLowerCase().includes(q);
              
              if (!nameMatch && !flatMatch && !phoneMatch && !roleMatch) return false;
            }
            return true;
          });

          // Group the filtered residents by Tower
          const groupedResidents = {};
          filteredResidents.forEach(r => {
            const towerName = r.tower ? `Tower ${r.tower.toUpperCase()}` : 'Other / Unassigned';
            if (!groupedResidents[towerName]) {
              groupedResidents[towerName] = [];
            }
            groupedResidents[towerName].push(r);
          });

          // Get unique list of towers for filter dropdown (from raw residents)
          const allTowers = Array.from(new Set(residents.map(r => r.tower).filter(Boolean))).sort();

          return (
            <div className="space-y-6 animate-slide-up">
              {/* Header and Controls */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-indigo-400" />
                  <h2 className="font-heading font-black text-base uppercase tracking-wider">Active Verified Residents ({filteredResidents.length})</h2>
                </div>

                {/* Search & Tower Filter Controls */}
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  {/* Search input */}
                  <div className="relative flex items-center flex-1 sm:w-64">
                    <Search className="absolute left-3.5 text-slate-500" size={14} />
                    <input
                      placeholder="Search name, flat, phone..."
                      value={residentSearch}
                      onChange={e => setResidentSearch(e.target.value)}
                      className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs border ${inputStyle}`}
                    />
                  </div>

                  {/* Tower selection filter */}
                  <div className="relative flex items-center sm:w-48">
                    <select
                      value={residentTowerFilter}
                      onChange={e => setResidentTowerFilter(e.target.value)}
                      className={`w-full pl-4 pr-10 py-2 rounded-xl text-xs cursor-pointer appearance-none border outline-none ${inputStyle}`}
                    >
                      <option value="all">All Towers 🏢</option>
                      {allTowers.map((tower, idx) => (
                        <option key={idx} value={tower.toLowerCase()}>Tower {tower.toUpperCase()}</option>
                      ))}
                      <option value="other">Other / Unassigned</option>
                    </select>
                    <Filter className="absolute right-4 text-slate-500 pointer-events-none" size={12} />
                  </div>
                </div>
              </div>

              {filteredResidents.length === 0 ? (
                <div className={`rounded-[32px] p-12 text-center border ${cardStyle}`}>
                  <Users size={36} className="mx-auto opacity-30 mb-3" />
                  <p className="font-black text-slate-800 dark:text-white">No active residents found</p>
                  <p className={`text-xs mt-1 ${subtext}`}>Search filter ke matching residents nahi mile.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Map through grouped tower keys */}
                  {Object.keys(groupedResidents).sort().map(towerKey => {
                    const towerResidents = groupedResidents[towerKey];
                    return (
                      <div key={towerKey} className="space-y-3">
                        {/* Sticky Tower Header bar */}
                        <div className={`flex items-center justify-between px-5 py-2.5 rounded-2xl border ${isDark ? 'bg-slate-900/40 border-slate-800/60' : 'bg-slate-50 border-slate-200'} sticky top-0 backdrop-blur-md z-10`}>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black uppercase text-indigo-400 tracking-wider">{towerKey}</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                            <span className={`text-[10px] ${subtext} font-bold`}>{towerResidents.length} {towerResidents.length === 1 ? 'Resident' : 'Residents'}</span>
                          </div>
                        </div>

                        {/* Grid list of residents inside this tower */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {towerResidents.map(r => (
                            <div key={r.id} className={`rounded-[30px] border p-5 flex items-center gap-4 transition-all duration-300 hover:scale-[1.01] ${cardStyle}`}>
                              <div className="w-11 h-11 rounded-[16px] bg-gradient-to-tr from-indigo-500 via-indigo-600 to-emerald-500 p-[1px] shadow-md">
                                <div className="w-full h-full rounded-[15px] bg-slate-900 flex items-center justify-center text-white font-extrabold text-xs">
                                  {(r.name || 'U').substring(0, 2).toUpperCase()}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-black text-xs sm:text-sm text-slate-800 dark:text-slate-100 truncate">{r.name}</p>
                                <p className={`text-[10px] ${subtext} mt-0.5 flex items-center gap-1.5`}>
                                  {r.tower ? `Tower ${r.tower.toUpperCase()} - ` : ''}Flat <span className="text-indigo-400 font-extrabold">{r.flat_number || 'N/A'}</span> &bull; 📞 <span className="font-mono">{r.phone}</span>
                                </p>
                                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                  <span className={`text-[8px] font-black uppercase tracking-wider bg-slate-500/10 px-2 py-0.5 rounded-full border border-slate-500/10 inline-block ${subtext}`}>
                                    {r.role.replace('_', ' ')}
                                  </span>
                                  {r.vehicles && r.vehicles.length > 0 && r.vehicles.map((v, idx) => (
                                    <span 
                                      key={idx}
                                      className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border flex items-center gap-1
                                        ${isDark 
                                          ? 'bg-indigo-950/40 text-indigo-300 border-indigo-500/20' 
                                          : 'bg-indigo-50 text-indigo-600 border-indigo-200'}`}
                                    >
                                      <span>{v.type?.toLowerCase()?.includes('bike') || v.type?.toLowerCase()?.includes('2') || v.type?.toLowerCase()?.includes('scooty') ? '🏍️' : '🚗'}</span>
                                      <span>{v.vehicle_number}</span>
                                      {v.brand && <span className="opacity-75">({v.brand})</span>}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1 animate-pulse">
                                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block" />
                                ACTIVE
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* ─── TAB: VEHICLES ────────────────────────────────────────── */}
        {activeTab === 'vehicles' && (() => {
          // Filtered list of residents based on search & filters
          const filteredResidents = residents.filter(r => {
            const hasVehicles = r.vehicles && r.vehicles.length > 0;
            
            // 1. Vehicle Count filter
            if (vehicleCountFilter === 'multi' && (!r.vehicles || r.vehicles.length <= 1)) return false;
            if (vehicleCountFilter === 'single' && (!r.vehicles || r.vehicles.length !== 1)) return false;
            if (vehicleCountFilter === 'none' && hasVehicles) return false;
            
            // 2. Vehicle Type filter
            if (vehicleTypeFilter !== 'all') {
              if (!hasVehicles) return false;
              const hasMatchingType = r.vehicles.some(v => {
                const isBike = v.type?.toLowerCase()?.includes('bike') || v.type?.toLowerCase()?.includes('2') || v.type?.toLowerCase()?.includes('scooty');
                if (vehicleTypeFilter === 'bike') return isBike;
                if (vehicleTypeFilter === 'car') return !isBike;
                return true;
              });
              if (!hasMatchingType) return false;
            }
            
            // 3. Search query
            if (vehicleSearch) {
              const q = vehicleSearch.toLowerCase().trim();
              const nameMatch = String(r.name || '').toLowerCase().includes(q);
              const flatMatch = String(r.flat_number || '').toLowerCase().includes(q) || String(r.tower || '').toLowerCase().includes(q);
              const phoneMatch = String(r.phone || '').toLowerCase().includes(q);
              
              // Also search by vehicle brand/number
              const vehicleMatch = hasVehicles && r.vehicles.some(v => 
                String(v.vehicle_number || '').toLowerCase().includes(q) || 
                String(v.brand || '').toLowerCase().includes(q) ||
                String(v.type || '').toLowerCase().includes(q)
              );
              
              if (!nameMatch && !flatMatch && !phoneMatch && !vehicleMatch) return false;
            }
            
            return true;
          });

          // Calculate some stats for the visual dashboard cards
          const totalVehiclesCount = residents.reduce((acc, r) => acc + (r.vehicles ? r.vehicles.length : 0), 0);
          const totalCars = residents.reduce((acc, r) => {
            if (!r.vehicles) return acc;
            return acc + r.vehicles.filter(v => !(v.type?.toLowerCase()?.includes('bike') || v.type?.toLowerCase()?.includes('2') || v.type?.toLowerCase()?.includes('scooty'))).length;
          }, 0);
          const totalBikes = totalVehiclesCount - totalCars;
          const multiVehicleOwners = residents.filter(r => r.vehicles && r.vehicles.length > 1).length;

          return (
            <div className="space-y-6 animate-slide-up">
              {/* Header section */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                    <Car size={20} className="text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="font-heading font-black text-base uppercase tracking-wider">Registered Vehicles List</h2>
                    <p className={`text-xs ${subtext}`}>Resident-wise vehicle registrations and details</p>
                  </div>
                </div>
              </div>

              {/* Stats overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`p-4 rounded-3xl border ${cardStyle} flex items-center gap-3`}>
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0 border border-indigo-500/20">
                    <Car size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Total Vehicles</p>
                    <p className="text-lg font-black text-slate-800 dark:text-white mt-0.5">{totalVehiclesCount}</p>
                  </div>
                </div>
                
                <div className={`p-4 rounded-3xl border ${cardStyle} flex items-center gap-3`}>
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0 border border-emerald-500/20">
                    <span className="text-sm">🚗</span>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Cars 4-Wheeler</p>
                    <p className="text-lg font-black text-slate-800 dark:text-white mt-0.5">{totalCars}</p>
                  </div>
                </div>
                
                <div className={`p-4 rounded-3xl border ${cardStyle} flex items-center gap-3`}>
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0 border border-amber-500/20">
                    <span className="text-sm">🏍️</span>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Bikes 2-Wheeler</p>
                    <p className="text-lg font-black text-slate-800 dark:text-white mt-0.5">{totalBikes}</p>
                  </div>
                </div>

                <div className={`p-4 rounded-3xl border ${cardStyle} flex items-center gap-3`}>
                  <div className="w-10 h-10 rounded-2xl bg-fuchsia-500/10 flex items-center justify-center text-fuchsia-400 shrink-0 border border-fuchsia-500/20">
                    <Users size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Multi-Vehicle Owners</p>
                    <p className="text-lg font-black text-slate-800 dark:text-white mt-0.5">{multiVehicleOwners}</p>
                  </div>
                </div>
              </div>

              {/* Advanced Filter and Search Bar */}
              <div className={`p-4 rounded-[30px] border ${cardStyle} grid grid-cols-1 md:grid-cols-3 gap-3 items-center`}>
                {/* Search */}
                <div className="relative flex items-center">
                  <Search className="absolute left-3.5 text-slate-500" size={15} />
                  <input
                    placeholder="Search owner, plate, flat..."
                    value={vehicleSearch}
                    onChange={e => setVehicleSearch(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs border ${inputStyle}`}
                  />
                </div>

                {/* Filter by Vehicle Type */}
                <div className="relative flex items-center">
                  <select
                    value={vehicleTypeFilter}
                    onChange={e => setVehicleTypeFilter(e.target.value)}
                    className={`w-full pl-4 pr-10 py-2.5 rounded-2xl text-xs cursor-pointer appearance-none border outline-none ${inputStyle}`}
                  >
                    <option value="all">All Vehicle Types 🏎️</option>
                    <option value="car">4-Wheelers Only (Cars) 🚗</option>
                    <option value="bike">2-Wheelers Only (Bikes/Scooty) 🏍️</option>
                  </select>
                  <Filter className="absolute right-4 text-slate-500 pointer-events-none" size={13} />
                </div>

                {/* Filter by Ownership Quantity */}
                <div className="relative flex items-center">
                  <select
                    value={vehicleCountFilter}
                    onChange={e => setVehicleCountFilter(e.target.value)}
                    className={`w-full pl-4 pr-10 py-2.5 rounded-2xl text-xs cursor-pointer appearance-none border outline-none ${inputStyle}`}
                  >
                    <option value="all">All Ownerships 🏘️</option>
                    <option value="multi">Multiple Vehicles Owner (&gt;1)</option>
                    <option value="single">Single Vehicle Owner (1)</option>
                    <option value="none">No Vehicles Registered (0)</option>
                  </select>
                  <Filter className="absolute right-4 text-slate-500 pointer-events-none" size={13} />
                </div>
              </div>
              {/* Residents & Vehicles Grid */}
              {filteredResidents.length === 0 ? (
                <div className={`rounded-[32px] p-12 text-center border ${cardStyle}`}>
                  <Car size={36} className="mx-auto opacity-30 mb-3 text-slate-500" />
                  <p className="font-black text-slate-800 dark:text-white">No matching records</p>
                  <p className={`text-xs mt-1 ${subtext}`}>Vehicles listing me search criteria ke hisab se records nahi mile.</p>
                </div>
              ) : (() => {
                // Group the filtered residents by Tower
                const groupedResidents = {};
                filteredResidents.forEach(r => {
                  const towerName = r.tower ? `Tower ${r.tower.toUpperCase()}` : 'Other / Unassigned';
                  if (!groupedResidents[towerName]) {
                    groupedResidents[towerName] = [];
                  }
                  groupedResidents[towerName].push(r);
                });

                return (
                  <div className="space-y-6">
                    {Object.keys(groupedResidents).sort().map(towerKey => {
                      const towerResidents = groupedResidents[towerKey];
                      // Count vehicles in this specific tower
                      const towerVehiclesCount = towerResidents.reduce((acc, r) => acc + (r.vehicles ? r.vehicles.length : 0), 0);
                      return (
                        <div key={towerKey} className="space-y-3">
                          {/* Sticky Tower Header bar */}
                          <div className={`flex items-center justify-between px-5 py-2.5 rounded-2xl border ${isDark ? 'bg-slate-900/40 border-slate-800/60' : 'bg-slate-50 border-slate-200'} sticky top-0 backdrop-blur-md z-10`}>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black uppercase text-indigo-400 tracking-wider">{towerKey}</span>
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                              <span className={`text-[10px] ${subtext} font-bold`}>
                                {towerResidents.length} {towerResidents.length === 1 ? 'Resident' : 'Residents'} &bull; {towerVehiclesCount} {towerVehiclesCount === 1 ? 'Vehicle' : 'Vehicles'}
                              </span>
                            </div>
                          </div>

                          {/* Grid list of residents & their vehicles inside this tower */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {towerResidents.map(r => {
                              const rVehicles = r.vehicles || [];
                              return (
                                <div key={r.id} className={`rounded-[30px] border p-5 flex flex-col gap-4 transition-all duration-300 hover:scale-[1.01] ${cardStyle}`}>
                                  {/* Resident Header inside card */}
                                  <div className="flex items-center gap-3 border-b border-slate-800/10 dark:border-slate-800/40 pb-3">
                                    <div className="w-10 h-10 rounded-[14px] bg-gradient-to-tr from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-extrabold text-xs shadow-sm">
                                      {(r.name || 'U').substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-black text-xs sm:text-sm text-slate-800 dark:text-slate-100 truncate">{r.name}</p>
                                      <p className={`text-[10px] ${subtext} mt-0.5 flex items-center gap-1`}>
                                        {r.tower ? `Tower ${r.tower.toUpperCase()} - ` : ''}Flat <span className="text-indigo-400 font-extrabold">{r.flat_number || 'N/A'}</span> &bull; 📞 <span className="font-mono">{r.phone}</span>
                                      </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border
                                        ${rVehicles.length > 0 
                                          ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' 
                                          : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}
                                      >
                                        {rVehicles.length} {rVehicles.length === 1 ? 'Vehicle' : 'Vehicles'}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Registered Vehicles List */}
                                  {rVehicles.length === 0 ? (
                                    <div className="py-4 text-center border border-dashed border-slate-850/30 dark:border-slate-800/60 rounded-2xl bg-slate-900/10">
                                      <p className={`text-[10px] ${subtext} italic`}>No vehicles registered under this resident.</p>
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      {rVehicles.map((v, idx) => {
                                        const isBike = v.type?.toLowerCase()?.includes('bike') || v.type?.toLowerCase()?.includes('2') || v.type?.toLowerCase()?.includes('scooty');
                                        return (
                                          <div 
                                            key={idx}
                                            className={`flex items-center justify-between p-3 rounded-2xl border transition-all duration-300
                                              ${isDark 
                                                ? 'bg-slate-950/40 border-slate-800 hover:border-slate-700' 
                                                : 'bg-slate-50/50 border-slate-200 hover:border-slate-300'}`}
                                          >
                                            <div className="flex items-center gap-2.5">
                                              <div className="w-8 h-8 rounded-xl bg-slate-900/60 flex items-center justify-center text-sm border border-slate-850 shrink-0">
                                                {isBike ? '🏍️' : '🚗'}
                                              </div>
                                              <div>
                                                <p className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 tracking-wide">{v.vehicle_number}</p>
                                                <p className={`text-[9px] ${subtext} capitalize mt-0.5`}>
                                                  {v.brand || 'Unknown Brand'} &bull; {v.type || (isBike ? '2-Wheeler' : '4-Wheeler')}
                                                </p>
                                              </div>
                                            </div>
                                            <div>
                                              <span className={`text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full border
                                                ${isBike 
                                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                                                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}
                                              >
                                                {isBike ? '2-Wheeler' : '4-Wheeler'}
                                              </span>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          );
        })()}

        {/* ─── TAB: ENTRY LOG ────────────────────────────────────────── */}
        {activeTab === 'logs' && (() => {
          const filteredLogs = entryLogs.filter(log => {
            if (logSearch) {
              const q = logSearch.toLowerCase().trim();
              const nameMatch = String(log.entity_name || '').toLowerCase().includes(q);
              const flatMatch = String(log.flat_number || '').toLowerCase().includes(q) || String(log.tower || '').toLowerCase().includes(q);
              const guardMatch = String(log.guard_name || '').toLowerCase().includes(q);
              const gateMatch = String(log.gate_number || '').toLowerCase().includes(q);
              if (!nameMatch && !flatMatch && !guardMatch && !gateMatch) return false;
            }
            if (logType !== 'all' && log.entity_type !== logType) return false;
            if (logStatus !== 'all') {
              if (logStatus === 'inside' && log.exit_time !== null) return false;
              if (logStatus === 'exited' && log.exit_time === null) return false;
            }
            if (logDateFilter !== 'all') {
              const entryDate = new Date(log.entry_time);
              const now = new Date();
              if (logDateFilter === 'today') {
                if (entryDate.toDateString() !== now.toDateString()) return false;
              } else if (logDateFilter === 'yesterday') {
                const yesterday = new Date(now);
                yesterday.setDate(now.getDate() - 1);
                if (entryDate.toDateString() !== yesterday.toDateString()) return false;
              } else if (logDateFilter === 'week') {
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(now.getDate() - 7);
                if (entryDate < oneWeekAgo) return false;
              } else if (logDateFilter === 'custom') {
                if (logCustomStartDate) {
                  const start = new Date(logCustomStartDate);
                  start.setHours(0, 0, 0, 0);
                  if (entryDate < start) return false;
                }
                if (logCustomEndDate) {
                  const end = new Date(logCustomEndDate);
                  end.setHours(23, 59, 59, 999);
                  if (entryDate > end) return false;
                }
              }
            }
            if (logViewMode === 'calendar' && calendarSelectedDate) {
              const entryDate = new Date(log.entry_time);
              const selDate = new Date(calendarSelectedDate);
              if (entryDate.toDateString() !== selDate.toDateString()) return false;
            }
            return true;
          });

          return (
            <div className="space-y-4 animate-slide-up">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Activity size={18} className="text-indigo-400" />
                    <h2 className="font-heading font-black text-base uppercase tracking-wider">Gate Activity History</h2>
                  </div>
                  
                  {/* Segmented View Switcher */}
                  <div className={`flex items-center p-0.5 rounded-xl border ${isDark ? 'bg-slate-950/80 border-white/5' : 'bg-slate-100 border-slate-200'}`}>
                    <button
                      type="button"
                      onClick={() => setLogViewMode('list')}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5
                        ${logViewMode === 'list'
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/10'
                          : 'text-slate-500 hover:text-indigo-400'}`}
                    >
                      <Activity size={11} /> List View
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLogViewMode('calendar');
                        if (!calendarSelectedDate) {
                          setCalendarSelectedDate(new Date());
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5
                        ${logViewMode === 'calendar'
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/10'
                          : 'text-slate-500 hover:text-indigo-400'}`}
                    >
                      <Calendar size={11} /> Calendar View
                    </button>
                  </div>
                </div>

                <p className={`text-xs ${subtext}`}>Total: <span className="text-indigo-400 font-bold">{filteredLogs.length} matching entries</span></p>
              </div>

              {/* Glass Filters Panel */}
              <div className={`rounded-3xl border p-4.5 space-y-3.5 ${cardStyle}`}>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="relative flex items-center">
                    <Search className={`absolute left-3.5 text-slate-500`} size={13} />
                    <input
                      type="text"
                      placeholder="Search Name, Flat..."
                      value={logSearch}
                      onChange={e => setLogSearch(e.target.value)}
                      className={`w-full pl-9 pr-4 py-2.5 rounded-xl text-xs ${inputStyle}`}
                    />
                  </div>

                  <div className="relative flex items-center">
                    <select
                      value={logType}
                      onChange={e => setLogType(e.target.value)}
                      className={`w-full px-3 py-2.5 rounded-xl text-xs cursor-pointer appearance-none ${inputStyle}`}
                    >
                      <option value="all">All Types</option>
                      <option value="guest">Guests Only 🧑</option>
                      <option value="vehicle">Vehicles Only 🚗</option>
                      <option value="staff">Staff Only 👷</option>
                    </select>
                    <Filter className={`absolute right-3.5 text-slate-500 pointer-events-none`} size={11} />
                  </div>

                  <div className="relative flex items-center">
                    <select
                      value={logStatus}
                      onChange={e => setLogStatus(e.target.value)}
                      className={`w-full px-3 py-2.5 rounded-xl text-xs cursor-pointer appearance-none ${inputStyle}`}
                    >
                      <option value="all">All Status</option>
                      <option value="inside">Inside Society 🟢</option>
                      <option value="exited">Checked Out 🔴</option>
                    </select>
                    <Filter className={`absolute right-3.5 text-slate-500 pointer-events-none`} size={11} />
                  </div>

                  <div className="relative flex items-center">
                    <select
                      value={logDateFilter}
                      onChange={e => setLogDateFilter(e.target.value)}
                      className={`w-full px-3 py-2.5 rounded-xl text-xs cursor-pointer appearance-none ${inputStyle}`}
                    >
                      <option value="all">All Dates</option>
                      <option value="today">Today</option>
                      <option value="yesterday">Yesterday</option>
                      <option value="week">Past 7 Days</option>
                      <option value="custom">Custom Date range 📅</option>
                    </select>
                    <Filter className={`absolute right-3.5 text-slate-500 pointer-events-none`} size={11} />
                  </div>
                </div>

                {logDateFilter === 'custom' && (
                  <div className="grid grid-cols-2 gap-3 mt-3 animate-slide-down">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 pl-1">Start Date</label>
                      <input
                        type="date"
                        value={logCustomStartDate}
                        onChange={e => setLogCustomStartDate(e.target.value)}
                        className={`w-full px-3.5 py-2.5 rounded-xl text-xs ${inputStyle}`}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 pl-1">End Date</label>
                      <input
                        type="date"
                        value={logCustomEndDate}
                        onChange={e => setLogCustomEndDate(e.target.value)}
                        className={`w-full px-3.5 py-2.5 rounded-xl text-xs ${inputStyle}`}
                      />
                    </div>
                  </div>
                )}

                {(logSearch || logType !== 'all' || logStatus !== 'all' || logDateFilter !== 'all' || logCustomStartDate || logCustomEndDate) && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        setLogSearch('');
                        setLogType('all');
                        setLogStatus('all');
                        setLogDateFilter('all');
                        setLogCustomStartDate('');
                        setLogCustomEndDate('');
                      }}
                      className="text-[10px] text-rose-400 hover:text-rose-300 font-black uppercase tracking-wider flex items-center gap-1 transition-all"
                    >
                      <RefreshCw size={11} /> Reset Filters
                    </button>
                  </div>
                )}
              </div>

              {logViewMode === 'calendar' && (() => {
                const year = calendarCurrentMonth.getFullYear();
                const month = calendarCurrentMonth.getMonth();

                const firstDayIndex = new Date(year, month, 1).getDay();
                const totalDays = new Date(year, month + 1, 0).getDate();

                const days = [];
                for (let i = 0; i < firstDayIndex; i++) {
                  days.push(null);
                }
                for (let d = 1; d <= totalDays; d++) {
                  days.push(new Date(year, month, d));
                }

                const monthNames = [
                  'January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'
                ];

                const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

                const getEntriesForDate = (date) => {
                  if (!date) return [];
                  return entryLogs.filter(log => {
                    const entryDate = new Date(log.entry_time);
                    return entryDate.toDateString() === date.toDateString();
                  });
                };

                const nextMonth = () => {
                  setCalendarCurrentMonth(new Date(year, month + 1, 1));
                };

                const prevMonth = () => {
                  setCalendarCurrentMonth(new Date(year, month - 1, 1));
                };

                return (
                  <div className={`rounded-3xl border p-5 space-y-4 animate-slide-down ${cardStyle}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-indigo-400" />
                        <h3 className="font-bold text-sm tracking-wide">
                          {monthNames[month]} {year}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={prevMonth}
                          className={`p-1.5 rounded-lg border transition-all hover:scale-105 active:scale-95
                            ${isDark ? 'border-white/5 bg-slate-900/60 hover:bg-slate-800 text-slate-400' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600'}`}
                        >
                          <ChevronLeft size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCalendarCurrentMonth(new Date());
                            setCalendarSelectedDate(new Date());
                          }}
                          className={`px-2 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-wider transition-all active:scale-95
                            ${isDark ? 'border-white/5 bg-slate-900/60 hover:bg-slate-800 text-slate-400' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600'}`}
                        >
                          Today
                        </button>
                        <button
                          type="button"
                          onClick={nextMonth}
                          className={`p-1.5 rounded-lg border transition-all hover:scale-105 active:scale-95
                            ${isDark ? 'border-white/5 bg-slate-900/60 hover:bg-slate-800 text-slate-400' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600'}`}
                        >
                          <ChevronRight size={13} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center">
                      {weekdays.map((day, idx) => (
                        <span key={idx} className="text-[10px] uppercase font-black tracking-widest text-slate-500 py-1">
                          {day}
                        </span>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {days.map((dateObj, idx) => {
                        if (!dateObj) {
                          return <div key={`empty-${idx}`} className="aspect-square" />;
                        }

                        const dayLogs = getEntriesForDate(dateObj);
                        const isSelected = calendarSelectedDate && dateObj.toDateString() === new Date(calendarSelectedDate).toDateString();
                        const isToday = dateObj.toDateString() === new Date().toDateString();

                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setCalendarSelectedDate(null);
                              } else {
                                setCalendarSelectedDate(dateObj);
                              }
                            }}
                            className={`aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all duration-200 border group hover:scale-105
                              ${isSelected
                                ? 'bg-gradient-to-br from-indigo-500 to-purple-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/25 font-black scale-105'
                                : isToday
                                  ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-400 font-bold'
                                  : isDark
                                    ? 'bg-slate-950/40 border-white/5 text-slate-300 hover:border-slate-700/80 hover:bg-slate-900'
                                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'}`}
                          >
                            <span className="text-[11px]">{dateObj.getDate()}</span>
                            {dayLogs.length > 0 && (
                              <span
                                className={`absolute bottom-1 w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-black border transition-colors
                                  ${isSelected
                                    ? 'bg-white text-indigo-600 border-white shadow'
                                    : isDark
                                      ? 'bg-indigo-900/80 text-indigo-300 border-indigo-500/30'
                                      : 'bg-indigo-100 text-indigo-700 border-indigo-300'}`}
                              >
                                {dayLogs.length}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {calendarSelectedDate && (
                      <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs
                        ${isDark ? 'bg-indigo-500/5 border-indigo-500/20 text-slate-300' : 'bg-indigo-50/50 border-indigo-100 text-slate-700'}`}>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">📅</span>
                          <span>
                            Selected Date: <strong className="text-indigo-400">{new Date(calendarSelectedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCalendarSelectedDate(null)}
                          className="text-[9px] font-black uppercase tracking-wider text-rose-400 hover:text-rose-300 transition-colors"
                        >
                          Clear Selection
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Logs List */}
              {filteredLogs.length === 0 ? (
                <div className={`rounded-[32px] p-12 text-center border ${cardStyle}`}>
                  <Activity size={36} className="mx-auto opacity-30 mb-3 text-indigo-500" />
                  <p className="font-black text-slate-800 dark:text-white">No logs found</p>
                  <p className={`text-xs mt-1 ${subtext}`}>Adjust your filters or query search term.</p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {filteredLogs.map(log => {
                    const isInside = !log.exit_time;
                    return (
                      <div key={log.id} className={`rounded-[28px] border p-4.5 transition-all duration-300 hover:scale-[1.01] ${cardStyle}`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3.5">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-sm border ${
                              log.entity_type === 'vehicle' ? 'bg-blue-500/10 border-blue-500/20' :
                              log.entity_type === 'guest' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-purple-500/10 border-purple-500/20'
                            }`}>
                              {log.entity_type === 'vehicle' ? '🚗' : log.entity_type === 'guest' ? '🧑' : '👷'}
                            </div>
                            <div>
                              <p className="font-black text-sm text-slate-800 dark:text-slate-100">{log.entity_name || 'Visitor'}</p>
                              <div className="flex items-center gap-2.5 flex-wrap mt-1">
                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${
                                  log.entity_type === 'vehicle' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/15' :
                                  log.entity_type === 'guest' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15' :
                                  'bg-purple-500/10 text-purple-400 border border-purple-500/15'
                                }`}>
                                  {log.entity_type}
                                </span>
                                {log.flat_number && log.flat_number !== 'N/A' && (
                                  <span className="text-[8px] font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md">
                                    {log.tower ? log.tower + '-' : ''}Flat {log.flat_number}
                                  </span>
                                )}
                                <span className={`text-[9px] font-semibold ${subtext}`}>
                                  Gate: {log.gate_number || 'Gate 1'}
                                </span>
                                {log.vehicle_number && (
                                  <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md border flex items-center gap-1
                                    ${isDark 
                                      ? 'bg-amber-950/40 text-amber-300 border-amber-500/20' 
                                      : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                                    <span>{log.vehicle_number === 'Walk-in' ? '🚶' : '🚗'}</span>
                                    <span>{log.vehicle_number}</span>
                                  </span>
                                )}
                              </div>
                              <p className={`text-[8px] mt-1.5 ${subtext}`}>Logged by: <span className="font-black text-indigo-400">{log.guard_name || 'System'}</span></p>
                            </div>
                          </div>
                          <div className="text-left sm:text-right space-y-1">
                            <div className="flex items-center sm:justify-end gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              <p className="text-xs font-black text-slate-800 dark:text-slate-200">
                                In: {new Date(log.entry_time).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            {log.exit_time ? (
                              <div className="flex items-center sm:justify-end gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                <p className="text-xs text-rose-400 font-black">
                                  Out: {new Date(log.exit_time).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            ) : (
                              <span className="inline-block text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-2.5 py-0.5 rounded-full font-black uppercase tracking-widest mt-1 animate-pulse">
                                Inside Society 🟢
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* ─── TAB: ANALYTICS ────────────────────────────────────────── */}
        {activeTab === 'analytics' && (
          <div className="space-y-5 animate-slide-up">
            <div className="flex items-center gap-2">
              <BarChart2 size={18} className="text-indigo-400" />
              <h2 className="font-heading font-black text-base uppercase tracking-wider">Gate & Support Analytics</h2>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className={`rounded-[32px] border p-6 ${cardStyle}`}>
                <h3 className="text-xs font-black uppercase tracking-wider mb-4.5 text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <span>📈</span> Daily Society Footfall (Past Week)
                </h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[
                      { name: 'Mon', entries: 12 }, { name: 'Tue', entries: 19 }, { name: 'Wed', entries: 15 },
                      { name: 'Thu', entries: 22 }, { name: 'Fri', entries: 30 }, { name: 'Sat', entries: 45 }, { name: 'Sun', entries: 38 }
                    ]}>
                      <defs>
                        <linearGradient id="colorEntries" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0.01}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} vertical={false} opacity={0.3} />
                      <XAxis dataKey="name" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} axisLine={false} />
                      <RechartsTooltip 
                        contentStyle={{ 
                          backgroundColor: isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.85)', 
                          borderRadius: '20px', 
                          border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)', 
                          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.15)',
                          backdropFilter: 'blur(10px)',
                          fontSize: '11px',
                          fontWeight: 'bold'
                        }} 
                      />
                      <Area type="monotone" dataKey="entries" name="Daily Entries" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorEntries)" dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: isDark ? '#0f172a' : '#fff' }} activeDot={{ r: 6 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className={`rounded-[32px] border p-6 ${cardStyle}`}>
                <h3 className="text-xs font-black uppercase tracking-wider mb-4.5 text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <span>🔧</span> Service Requests Breakdown
                </h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: 'Plumbing', count: 8 }, { name: 'Electric', count: 12 }, { name: 'Cleaning', count: 5 }, { name: 'Other', count: 3 }
                    ]}>
                      <defs>
                        <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.2}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} vertical={false} opacity={0.3} />
                      <XAxis dataKey="name" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} axisLine={false} />
                      <RechartsTooltip 
                        cursor={{ fill: isDark ? 'rgba(51, 65, 85, 0.2)' : 'rgba(241, 245, 249, 0.4)' }} 
                        contentStyle={{ 
                          backgroundColor: isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.85)', 
                          borderRadius: '20px', 
                          border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)', 
                          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.15)',
                          backdropFilter: 'blur(10px)',
                          fontSize: '11px',
                          fontWeight: 'bold'
                        }} 
                      />
                      <Bar dataKey="count" name="Total Tickets" fill="url(#colorRequests)" radius={[10, 10, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB: EMERGENCY CONTACTS ────────────────────────────────── */}
        {activeTab === 'emergency' && (() => {
          const CATEGORIES = ['Police', 'Fire Brigade', 'Ambulance', 'Electrician', 'Plumber', 'Security', 'Committee', 'Other'];
          const catColors = {
            'Police': 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/15',
            'Fire Brigade': 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/15',
            'Ambulance': 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/15',
            'Electrician': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/15',
            'Plumber': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/15',
            'Security': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/15',
            'Committee': 'bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/15',
            'Other': 'bg-slate-500/10 text-slate-400 border-slate-500/20 hover:bg-slate-500/15',
          };
          return (
            <div className="space-y-4 animate-slide-up">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle size={18} className="text-red-400" />
                  <h2 className="font-heading font-black text-base uppercase tracking-wider">Emergency Response Contacts</h2>
                </div>
                <button 
                  onClick={() => { setShowAddEmergency(!showAddEmergency); setEditingEmergency(null); setNewEmergency({ name: '', phone: '', category: 'Police', priority: 5 }); }}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-md shadow-red-600/10"
                >
                  {showAddEmergency ? <XCircle size={14}/> : <Plus size={14}/>} 
                  <span>{showAddEmergency ? 'Close Form' : 'Add Contact'}</span>
                </button>
              </div>

              {showAddEmergency && (
                <div className={`rounded-[30px] border p-6 space-y-4.5 animate-scale-up bg-red-500/5 border-red-500/20`}>
                  <h4 className="font-heading font-black text-xs text-red-400 uppercase tracking-widest flex items-center gap-2">
                    <PhoneCall size={13}/> {editingEmergency ? 'Update Emergency Contact Info' : 'New Emergency Contact Registration'}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className={`text-[9px] font-black uppercase tracking-widest mb-1.5 block ${textLabel}`}>Contact Name</label>
                      <input 
                        placeholder="e.g. Sector-23 Police Chowki" 
                        value={newEmergency.name}
                        onChange={e => setNewEmergency({...newEmergency, name: e.target.value})}
                        className={`w-full px-4 py-3 rounded-2xl border text-xs outline-none ${inputStyle}`} 
                      />
                    </div>
                    <div>
                      <label className={`text-[9px] font-black uppercase tracking-widest mb-1.5 block ${textLabel}`}>Phone Number</label>
                      <input 
                        placeholder="e.g. 911 / 9876543210" 
                        type="tel" 
                        value={newEmergency.phone}
                        onChange={e => setNewEmergency({...newEmergency, phone: e.target.value})}
                        className={`w-full px-4 py-3 rounded-2xl border text-xs outline-none ${inputStyle}`} 
                      />
                    </div>
                    <div>
                      <label className={`text-[9px] font-black uppercase tracking-widest mb-1.5 block ${textLabel}`}>Category</label>
                      <div className="relative flex items-center">
                        <select 
                          value={newEmergency.category} 
                          onChange={e => setNewEmergency({...newEmergency, category: e.target.value})}
                          className={`w-full px-4 py-3 rounded-2xl border text-xs appearance-none cursor-pointer outline-none ${inputStyle}`}
                        >
                          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <ChevronRight size={14} className={`absolute right-4 pointer-events-none rotate-90 ${subtext}`} />
                      </div>
                    </div>
                    <div>
                      <label className={`text-[9px] font-black uppercase tracking-widest mb-1.5 block ${textLabel}`}>Priority Rank (1=Highest, 10=Lowest)</label>
                      <input 
                        type="number" 
                        min={1} 
                        max={10} 
                        value={newEmergency.priority}
                        onChange={e => setNewEmergency({...newEmergency, priority: Number(e.target.value)})}
                        className={`w-full px-4 py-3 rounded-2xl border text-xs outline-none ${inputStyle}`} 
                      />
                    </div>
                  </div>
                  <button 
                    onClick={async () => {
                      if (!newEmergency.name || !newEmergency.phone) return alert('Name and phone required');
                      setActionLoading(true);
                      try {
                        if (editingEmergency) {
                          await emergencyAPI.update(editingEmergency.id, newEmergency);
                        } else {
                          await emergencyAPI.create(newEmergency);
                        }
                        setNewEmergency({ name: '', phone: '', category: 'Police', priority: 5 });
                        setShowAddEmergency(false);
                        setEditingEmergency(null);
                        await fetchAllData();
                      } catch(e) { 
                        alert('Failed to save contact'); 
                      } finally { 
                        setActionLoading(false); 
                      }
                    }} 
                    disabled={actionLoading}
                    className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-red-600/10 active:scale-95"
                  >
                    {actionLoading ? <Loader2 className="animate-spin" size={15}/> : <><PhoneCall size={13}/> {editingEmergency ? 'Update Emergency Contact' : 'Publish Emergency Contact'}</>}
                  </button>
                </div>
              )}

              {/* VIP Quick Dialer Dial Strip */}
              {emergencyContacts.filter(c => c.priority <= 3).length > 0 && (
                <div className={`rounded-[30px] border p-5 bg-red-500/5 border-red-500/15 shadow-md shadow-red-500/5`}>
                  <p className="text-[10px] font-black text-red-500 mb-3.5 uppercase tracking-widest flex items-center gap-1.5">
                    🚨 SOS HOTLINE (Priority 1-3)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {emergencyContacts.filter(c => c.priority <= 3).map(c => (
                      <a 
                        key={c.id} 
                        href={`tel:${c.phone}`}
                        className={`flex items-center justify-between p-4 rounded-2xl border font-bold transition-all duration-300 hover:scale-[1.02] active:scale-95 ${
                          catColors[c.category] || catColors['Other']
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center text-red-400">
                            <PhoneCall size={16}/>
                          </div>
                          <div>
                            <p className="font-black text-xs">{c.name}</p>
                            <p className="font-mono text-xs opacity-80 mt-0.5">{c.phone}</p>
                          </div>
                        </div>
                        <span className="text-[8px] bg-red-500 text-white font-black px-2 py-0.5 rounded-full">VIP</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* All Emergency Contacts by Category */}
              <div className="space-y-5">
                {CATEGORIES.map(cat => {
                  const catContacts = emergencyContacts.filter(c => c.category === cat);
                  if (!catContacts.length) return null;
                  return (
                    <div key={cat} className="space-y-2">
                      <p className={`text-[10px] font-black uppercase tracking-widest px-1 ${subtext}`}>{cat}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {catContacts.map(c => (
                          <div 
                            key={c.id} 
                            className={`rounded-[28px] border p-4.5 flex items-center justify-between transition-all duration-300 hover:scale-[1.01] ${cardStyle}`}
                          >
                            <div className="flex items-center gap-3.5">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center border text-sm font-black ${
                                catColors[c.category] || catColors['Other']
                              }`}>
                                {cat === 'Police' ? '🚓' : cat === 'Fire Brigade' ? '🔥' : cat === 'Ambulance' ? '🚑' : cat === 'Electrician' ? '⚡' : cat === 'Plumber' ? '🔧' : '📞'}
                              </div>
                              <div>
                                <p className="font-black text-xs text-slate-800 dark:text-slate-100">{c.name}</p>
                                <a 
                                  href={`tel:${c.phone}`} 
                                  className="text-xs text-indigo-400 font-mono font-black hover:underline mt-0.5 block"
                                >
                                  {c.phone}
                                </a>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button 
                                onClick={() => {
                                  setEditingEmergency(c);
                                  setNewEmergency({ name: c.name, phone: c.phone, category: c.category, priority: c.priority });
                                  setShowAddEmergency(true);
                                }} 
                                className="p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-xl transition-all"
                              >
                                <PenLine size={13}/>
                              </button>
                              <button 
                                onClick={async () => {
                                  if (!window.confirm('Delete this contact?')) return;
                                  try { 
                                    await emergencyAPI.delete(c.id); 
                                    await fetchAllData(); 
                                  } catch { 
                                    alert('Delete failed'); 
                                  }
                                }} 
                                className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                              >
                                <Trash2 size={13}/>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                
                {emergencyContacts.length === 0 && (
                  <div className={`rounded-[32px] p-12 text-center border ${cardStyle}`}>
                    <PhoneCall size={36} className="mx-auto opacity-30 mb-3 text-indigo-500" />
                    <p className="font-black text-slate-800 dark:text-white">No emergency contacts configured</p>
                    <p className={`text-xs mt-1 ${subtext}`}>Click the button at the top to publish emergency numbers for residents.</p>
                  </div>
                )}
              </div>

            </div>
          );
        })()}

        {/* ─── TAB: NOTICES ────────────────────────────────────────── */}
        {activeTab === 'notices' && (
          <div className="animate-slide-up">
            <AnnouncementBoard user={user} />
          </div>
        )}

        {/* ─── TAB: PROMOTIONS / ADS ────────────────────────────────── */}
        {activeTab === 'ads' && (
          <div className="space-y-4 animate-slide-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Megaphone size={18} className="text-indigo-400" />
                <h2 className="font-heading font-black text-base uppercase tracking-wider">Manage Society Ads & Promos</h2>
              </div>
              <button 
                onClick={() => setShowAddAd(!showAddAd)} 
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-md shadow-indigo-600/10"
              >
                {showAddAd ? <XCircle size={14} /> : <Plus size={14} />}
                <span>{showAddAd ? 'Cancel Form' : 'Create New Ad'}</span>
              </button>
            </div>

            {showAddAd && (
              <div className={`rounded-[30px] border p-6 space-y-4 animate-scale-up bg-indigo-500/5 border-indigo-500/20`}>
                <h3 className="font-heading font-black text-xs text-indigo-400 uppercase tracking-widest">Create New Society Promotion</h3>
                <div className="space-y-3.5">
                  <div>
                    <label className={`text-[9px] font-black uppercase tracking-widest mb-1.5 block ${textLabel}`}>Ad Title</label>
                    <input 
                      placeholder="e.g. 20% Discount on Home Cleaning Services" 
                      value={newAd.title} 
                      onChange={e => setNewAd({...newAd, title: e.target.value})} 
                      className={`w-full px-4 py-3 rounded-2xl border text-xs outline-none ${inputStyle}`} 
                    />
                  </div>
                  <div>
                    <label className={`text-[9px] font-black uppercase tracking-widest mb-1.5 block ${textLabel}`}>Ad Description</label>
                    <textarea 
                      placeholder="Provide full coupon details or helper description..." 
                      rows={2.5} 
                      value={newAd.description} 
                      onChange={e => setNewAd({...newAd, description: e.target.value})} 
                      className={`w-full px-4 py-3 rounded-2xl border text-xs outline-none resize-none ${inputStyle}`} 
                    />
                  </div>
                  <div>
                    <label className={`text-[9px] font-black uppercase tracking-widest mb-1.5 block ${textLabel}`}>Promo Banner Image URL</label>
                    <input 
                      placeholder="e.g. https://imgur.com/yourimage.jpg" 
                      value={newAd.image_url} 
                      onChange={e => setNewAd({...newAd, image_url: e.target.value})} 
                      className={`w-full px-4 py-3 rounded-2xl border text-xs outline-none ${inputStyle}`} 
                    />
                  </div>
                  <div>
                    <label className={`text-[9px] font-black uppercase tracking-widest mb-1.5 block ${textLabel}`}>Target Action Click URL (Optional)</label>
                    <input 
                      placeholder="e.g. https://wa.me/919999999999" 
                      value={newAd.link} 
                      onChange={e => setNewAd({...newAd, link: e.target.value})} 
                      className={`w-full px-4 py-3 rounded-2xl border text-xs outline-none ${inputStyle}`} 
                    />
                  </div>
                </div>
                <button 
                  onClick={handleAddAd} 
                  disabled={actionLoading} 
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-indigo-600/10"
                >
                  {actionLoading ? <Loader2 className="animate-spin" size={15} /> : 'Publish Ad'}
                </button>
              </div>
            )}

            {ads.length === 0 ? (
              <div className={`rounded-[32px] p-12 text-center border ${cardStyle}`}>
                <Megaphone size={36} className="mx-auto opacity-30 mb-3 text-indigo-500" />
                <p className="font-black text-slate-800 dark:text-white">No active promotions</p>
                <p className={`text-xs mt-1 ${subtext}`}>Residents currently see default organic ads. Create one to broadcast customized promos.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3.5">
                {ads.map(ad => (
                  <div key={ad.id} className={`flex flex-col sm:flex-row items-center gap-4 border rounded-[30px] p-5 transition-all duration-300 hover:scale-[1.01] ${cardStyle}`}>
                    <div className="w-full sm:w-24 h-24 rounded-2xl overflow-hidden bg-slate-850 border border-slate-800/80 shrink-0 flex items-center justify-center">
                      {ad.image_url ? (
                        <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-500 font-black text-[9px] text-center p-2 uppercase tracking-wider">
                          Promo Banner
                        </div>
                      )}
                    </div>
                    <div className="flex-1 text-center sm:text-left min-w-0">
                      <p className="font-black text-sm text-slate-800 dark:text-slate-100">{ad.title}</p>
                      <p className={`text-xs ${subtext} mt-1 leading-snug`}>{ad.description}</p>
                      <div className="flex items-center justify-center sm:justify-start gap-3 mt-3">
                        {ad.link && ad.link !== '#' && (
                          <a 
                            href={ad.link} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-[10px] text-indigo-400 font-black uppercase tracking-wider hover:underline"
                          >
                            🔗 Visit Promo Link
                          </a>
                        )}
                        <p className={`text-[9px] font-bold ${subtext}`}>
                          Posted: {new Date(ad.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDeleteAd(ad.id)} 
                      className="p-3 rounded-2xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all duration-300 shrink-0 active:scale-95"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB: TOWERS / WINGS ─────────────────────────────────────────── */}
        {activeTab === 'towers' && (
          <div className="space-y-6 animate-slide-up max-w-2xl mx-auto">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                isDark ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-indigo-50 border border-indigo-200'
              }`}>
                <Building size={18} className="text-indigo-400" />
              </div>
              <div>
                <h2 className="font-heading font-black text-base uppercase tracking-wider">Society Towers / Wings</h2>
                <p className={`text-xs ${subtext} mt-0.5`}>Apni society ke towers/wings yahan configure karein</p>
              </div>
            </div>

            {/* Info Banner */}
            <div className={`rounded-2xl border p-4 flex items-start gap-3 ${
              isDark ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-indigo-50 border-indigo-200'
            }`}>
              <Building size={16} className="text-indigo-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-black text-indigo-400">Towers configure karne ke fayde</p>
                <p className={`text-[10px] mt-0.5 ${subtext} leading-relaxed`}>
                  Towers add karne se residents registration mein dropdown milega, guards ko flat search mein tower filter milega, aur entry logs mein tower dikh sakegi.
                </p>
              </div>
            </div>

            {/* Society ID Missing Error */}
            {!user?.society_id && (
              <div className={`rounded-2xl border p-4 flex items-center gap-3 ${
                isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200'
              }`}>
                <AlertCircle size={16} className="text-red-400 shrink-0" />
                <div>
                  <p className="text-xs font-black text-red-400">Society ID nahi mila</p>
                  <p className={`text-[10px] mt-0.5 text-red-400/80`}>Please log out karke dobara login karein. Agar problem bani rahe toh admin se contact karein.</p>
                </div>
              </div>
            )}

            {/* Add Tower Card */}
            <div className={`rounded-3xl border p-6 space-y-4 ${cardStyle}`}>
              <p className={`text-[9px] font-black uppercase tracking-widest ${subtext}`}>Naya Tower / Wing Add Karein</p>
              <div className="flex gap-2">
                <input
                  placeholder="e.g. Tower A, Wing B, Block-1, Phase-2"
                  value={newTowerName}
                  onChange={e => setNewTowerName(e.target.value)}
                  className={`flex-1 px-4 py-3 rounded-2xl border text-sm outline-none ${inputStyle}`}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddTower(); }}
                  disabled={towerActionLoading || !user?.society_id}
                />
                <button
                  type="button"
                  onClick={handleAddTower}
                  disabled={towerActionLoading || !newTowerName.trim() || !user?.society_id}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-md shadow-indigo-600/10 active:scale-95 shrink-0"
                >
                  {towerActionLoading ? <Loader2 className="animate-spin" size={14} /> : <><Plus size={14} /> Add</>}
                </button>
              </div>
            </div>

            {/* Towers List Card */}
            <div className={`rounded-3xl border p-6 space-y-4 ${cardStyle}`}>
              <div className="flex items-center justify-between">
                <p className={`text-[9px] font-black uppercase tracking-widest ${subtext}`}>
                  Configured Towers ({towers.length})
                </p>
                <button
                  onClick={fetchTowers}
                  disabled={towersLoading}
                  className={`text-[10px] font-bold flex items-center gap-1 transition-all ${
                    isDark ? 'text-slate-500 hover:text-indigo-400' : 'text-slate-400 hover:text-indigo-600'
                  }`}
                >
                  <RefreshCw size={11} className={towersLoading ? 'animate-spin' : ''} /> Refresh
                </button>
              </div>

              {towersLoading ? (
                <div className="flex items-center justify-center py-8 gap-2">
                  <Loader2 className="animate-spin text-indigo-500" size={18} />
                  <span className="text-xs font-bold text-slate-500">Loading towers...</span>
                </div>
              ) : towers.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl">
                  <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto mb-3">
                    <Building size={22} className="text-indigo-400" />
                  </div>
                  <p className={`text-sm font-black ${subtext}`}>Koi tower configure nahi hua</p>
                  <p className={`text-[10px] mt-1 ${subtext}`}>Upar form mein naam type karke Add button dabayein</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {towers.map(t => (
                    <div
                      key={t.id}
                      className={`flex items-center justify-between px-4 py-3 rounded-2xl border transition-all hover:scale-[1.02] ${
                        isDark
                          ? 'bg-slate-950/50 border-slate-800 text-slate-200'
                          : 'bg-slate-50 border-slate-200 text-slate-700 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">🏢</span>
                        <span className="text-sm font-extrabold">{t.tower_name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteTower(t.id)}
                        disabled={towerActionLoading}
                        title="Delete Tower"
                        className="w-7 h-7 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all duration-200 disabled:opacity-50"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB: GUARD SETTINGS ────────────────────────────────────────── */}
        {activeTab === 'guard_settings' && (
          <div className="space-y-6 animate-slide-up max-w-2xl mx-auto">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                isDark ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-indigo-50 border border-indigo-200'
              }`}>
                <SlidersHorizontal size={18} className="text-indigo-400" />
              </div>
              <div>
                <h2 className="font-heading font-black text-base uppercase tracking-wider">Guard Panel Features</h2>
                <p className={`text-xs ${subtext} mt-0.5`}>Guard ke dashboard pe jo options dikhne chahiye wo yahan se on/off karein</p>
              </div>
            </div>

            {/* Info Banner */}
            <div className={`rounded-2xl border p-4 flex items-start gap-3 ${
              isDark ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-indigo-50 border-indigo-200'
            }`}>
              <Shield size={16} className="text-indigo-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-black text-indigo-400">PIN Verify hamesha ON rehta hai</p>
                <p className={`text-[10px] mt-0.5 ${subtext} leading-relaxed`}>
                  Neeche diye options ko off karne se wo option guard ke main screen se chhup jayega. Yeh settings society-specific hain aur turant apply ho jaate hain.
                </p>
              </div>
            </div>

            {/* Toggle Cards */}
            <div className="space-y-3">
              {[
                {
                  key: 'anpr',
                  emoji: '📸',
                  title: 'ANPR Camera Scan',
                  desc: 'Gaadi ka number plate camera se scan karne ka option',
                  color: 'blue',
                },
                {
                  key: 'preapproved',
                  emoji: '📋',
                  title: 'Pre-Approved List',
                  desc: 'Residents dwara pre-approved guests ki list dekhne ka option',
                  color: 'emerald',
                },
                {
                  key: 'manual',
                  emoji: '✍️',
                  title: 'Manual Entry',
                  desc: 'Guard khud visitor ka naam/details type karke entry log kar sake',
                  color: 'amber',
                },
                {
                  key: 'vehicles',
                  emoji: '🚘',
                  title: 'Registered Vehicles',
                  desc: 'Society ke registered vehicles dekh aur track kar sake',
                  color: 'violet',
                },
                {
                  key: 'checkout',
                  emoji: '🚪',
                  title: 'Checkout / Exit',
                  desc: 'Andar gaye visitors ko manually checkout/exit karne ka option',
                  color: 'sky',
                },
                {
                  key: 'sos',
                  emoji: '🚨',
                  title: 'SOS Emergency Alerts',
                  desc: 'Active SOS alerts board — emergency situations ke liye',
                  color: 'red',
                },
                {
                  key: 'vehicle_mandatory',
                  emoji: '🔢',
                  title: 'Mandatory Vehicle Number',
                  desc: 'Scanner ke baad gaadi ka number plate daalna compulsory karein (warna optional)',
                  color: 'fuchsia',
                },
              ].map(({ key, emoji, title, desc, color }) => {
                const isOn = guardSettings[key];
                const colorMap = {
                  blue: { on: 'bg-blue-500/10 border-blue-500/20', dot: 'bg-blue-500', badge: 'text-blue-400 bg-blue-500/10 border-blue-500/20', toggle: 'bg-blue-600' },
                  emerald: { on: 'bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-500', badge: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', toggle: 'bg-emerald-600' },
                  amber: { on: 'bg-amber-500/10 border-amber-500/20', dot: 'bg-amber-500', badge: 'text-amber-400 bg-amber-500/10 border-amber-500/20', toggle: 'bg-amber-500' },
                  violet: { on: 'bg-violet-500/10 border-violet-500/20', dot: 'bg-violet-500', badge: 'text-violet-400 bg-violet-500/10 border-violet-500/20', toggle: 'bg-violet-600' },
                  sky: { on: 'bg-sky-500/10 border-sky-500/20', dot: 'bg-sky-500', badge: 'text-sky-400 bg-sky-500/10 border-sky-500/20', toggle: 'bg-sky-600' },
                  red: { on: 'bg-red-500/10 border-red-500/20', dot: 'bg-red-500', badge: 'text-red-400 bg-red-500/10 border-red-500/20', toggle: 'bg-red-600' },
                  fuchsia: { on: 'bg-fuchsia-500/10 border-fuchsia-500/20', dot: 'bg-fuchsia-500', badge: 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20', toggle: 'bg-fuchsia-600' },
                };
                const c = colorMap[color];
                return (
                  <div
                    key={key}
                    onClick={() => handleGuardSettingToggle(key)}
                    className={`flex items-center justify-between p-4 rounded-[28px] border cursor-pointer transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] ${
                      isOn
                        ? `${c.on} ${isDark ? '' : 'bg-opacity-50'}` 
                        : isDark ? 'bg-slate-900/40 border-slate-800/60' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl transition-all duration-300 ${
                        isOn ? c.on : isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'
                      } border`}>
                        {emoji}
                      </div>
                      <div>
                        <p className={`font-black text-sm ${
                          isOn ? 'text-slate-800 dark:text-slate-100' : subtext
                        }`}>{title}</p>
                        <p className={`text-[10px] mt-0.5 leading-snug ${subtext}`}>{desc}</p>
                      </div>
                    </div>

                    {/* Toggle Switch */}
                    <div className={`relative w-12 h-6 rounded-full transition-all duration-300 shrink-0 ${
                      isOn ? c.toggle : isDark ? 'bg-slate-700' : 'bg-slate-300'
                    }`}>
                      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${
                        isOn ? 'left-6' : 'left-0.5'
                      }`} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Status Summary */}
            <div className={`rounded-2xl border p-4 ${cardStyle}`}>
              <p className={`text-[9px] font-black uppercase tracking-widest ${subtext} mb-3`}>Current Status</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(guardSettings).map(([key, val]) => {
                  const labels = { anpr: 'ANPR', preapproved: 'Pre-Approved', manual: 'Manual', vehicles: 'Vehicles', checkout: 'Checkout', sos: 'SOS', vehicle_mandatory: 'Mandatory Vehicle' };
                  return (
                    <span key={key} className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${
                      val
                        ? isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                        : isDark ? 'bg-slate-800 text-slate-500 border-slate-700' : 'bg-slate-100 text-slate-400 border-slate-200'
                    }`}>
                      {val ? '✅' : '⛔'} {labels[key] || key}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* 🏢 Society Towers Management */}
            <div className={`rounded-3xl border p-6 space-y-4 ${cardStyle}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                  isDark ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-indigo-50 border border-indigo-200'
                }`}>
                  <span className="text-lg">🏢</span>
                </div>
                <div>
                  <h3 className="font-heading font-black text-sm uppercase tracking-wider">Configure Society Towers / Wings</h3>
                  <p className={`text-[10px] ${subtext} mt-0.5`}>Add society wings/blocks so residents and guards don't have to type them manually.</p>
                </div>
              </div>

              {!user?.society_id && (
                <div className={`rounded-2xl border p-3 flex items-center gap-2 ${
                  isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200'
                }`}>
                  <AlertCircle size={14} className="text-red-400 shrink-0" />
                  <p className="text-[10px] font-bold text-red-400">Society ID nahi mila. Please log out karke dobara login karein.</p>
                </div>
              )}

              {/* Add Tower Form */}
              <div className="flex gap-2">
                <input
                  placeholder="e.g. Tower A, Wing B, Phase-1"
                  value={newTowerName}
                  onChange={e => setNewTowerName(e.target.value)}
                  className={`flex-1 px-4 py-3 rounded-2xl border text-xs outline-none ${inputStyle}`}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddTower(); }}
                  disabled={towerActionLoading || !user?.society_id}
                />
                <button
                  type="button"
                  onClick={handleAddTower}
                  disabled={towerActionLoading || !newTowerName.trim() || !user?.society_id}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/10 active:scale-95 shrink-0"
                >
                  {towerActionLoading ? <Loader2 className="animate-spin" size={13} /> : '＋ Add'}
                </button>
              </div>

              {/* Towers List */}
              {towersLoading ? (
                <div className="flex items-center justify-center py-4 gap-2">
                  <Loader2 className="animate-spin text-indigo-500" size={16} />
                  <span className="text-[10px] font-bold text-slate-500">Loading towers...</span>
                </div>
              ) : towers.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-slate-350 dark:border-slate-800 rounded-2xl">
                  <p className={`text-xs font-bold ${subtext}`}>No society towers configured yet</p>
                  <p className={`text-[10px] mt-0.5 ${subtext}`}>Upar form mein tower ka naam type karke Add karein.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className={`text-[9px] font-black uppercase tracking-widest ${subtext}`}>Active Towers / Wings ({towers.length})</p>
                  <div className="flex flex-wrap gap-2.5">
                    {towers.map(t => (
                      <span
                        key={t.id}
                        className={`text-xs font-extrabold px-3.5 py-1.5 rounded-2xl border flex items-center gap-2 transition-all hover:scale-105 duration-200
                          ${isDark 
                            ? 'bg-slate-950/60 border-slate-800 text-slate-200' 
                            : 'bg-slate-50 border-slate-200 text-slate-700 shadow-sm'}`}
                      >
                        <span>🏢 {t.tower_name}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteTower(t.id)}
                          className="hover:text-rose-500 text-slate-400 dark:text-slate-500 transition-colors cursor-pointer"
                          disabled={towerActionLoading}
                          title="Delete Tower"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        </div>
      </div>

      <UserProfile isOpen={showProfile} onClose={() => setShowProfile(false)} />
    </div>
  );

};

export default ManagerDashboard;
