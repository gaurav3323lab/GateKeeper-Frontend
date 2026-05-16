import React, { useState } from 'react';
import ISTClock from './ISTClock';
import { useTheme } from '../context/ThemeContext';
import { Globe, Users, Building2, ShieldCheck, TrendingUp, LogOut, Plus, Eye, Trash2, BarChart3, Activity, User, Edit2 } from 'lucide-react';
import UserProfile from './UserProfile';
import ThemeToggle from './ThemeToggle';

import { societyAPI, managerAPI, announcementAPI } from '../services/api';
import AnnouncementBoard from './AnnouncementBoard';

const MOCK_MANAGERS = [
  { id: 1, name: 'Vikram Nair', society: 'Green Valley Apartments', phone: '9810001111', status: 'active' },
  { id: 2, name: 'Anjali Mehta', society: 'Sunrise Heights', phone: '9820002222', status: 'active' },
  { id: 3, name: 'Suresh Kumar', society: 'Royal Enclave', phone: '9830003333', status: 'active' },
];

const SuperAdminDashboard = ({ user, onLogout }) => {
  const { isDark } = useTheme();
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

  const bg = isDark ? 'bg-[#0f172a] text-white' : 'bg-gray-50 text-gray-800';
  const card = isDark ? 'bg-slate-800/70 border-slate-700' : 'bg-white border-gray-200';
  const input = isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-gray-100 border-gray-300 text-gray-800';
  const subtext = isDark ? 'text-slate-400' : 'text-gray-500';
  const header = isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white/90 border-gray-200';

  const totalResidents = societies.reduce((s, x) => s + x.residents, 0);
  const totalFlats = societies.reduce((s, x) => s + (x.flats || 0), 0);

  React.useEffect(() => {
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
    fetchSocieties();
    fetchManagers();
  }, []);

  const tabs = [
    { key: 'overview', label: 'Overview', icon: BarChart3 },
    { key: 'societies', label: 'Societies', icon: Building2 },
    { key: 'managers', label: 'Managers', icon: Users },
    { key: 'notices', label: 'Notices', icon: Activity },
    { key: 'logs', label: 'Data Logs', icon: Activity },
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${bg}`}>
      {/* Header */}
      <header className={`sticky top-0 z-40 px-4 py-3 border-b backdrop-blur-md flex items-center justify-between ${header}`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
            <Globe size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm leading-tight">Super Admin — {user?.name || 'Admin'}</h1>
            <ISTClock showDate className={subtext} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowProfile(true)} className={`p-2 rounded-xl border flex items-center justify-center ${isDark ? 'border-slate-700 text-slate-400 hover:text-purple-400' : 'border-gray-200 text-gray-400 hover:text-purple-500'}`}>
            <User size={15} />
          </button>
          <ThemeToggle />
          <button onClick={onLogout} className={`p-2 rounded-xl border ${isDark ? 'border-slate-700 text-slate-400 hover:text-red-400' : 'border-gray-200 text-gray-400 hover:text-red-400'}`}>
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Tab Nav */}
      <div className={`flex overflow-x-auto gap-1 px-4 py-2 border-b sticky top-[57px] z-30 backdrop-blur-md ${header}`}>
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all
              ${activeTab === key ? 'bg-purple-600 text-white' : isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}>
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      <div className="p-4 max-w-4xl mx-auto space-y-4">

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Total Societies', value: societies.length, color: 'from-purple-500 to-indigo-500', icon: Building2 },
                { label: 'Total Residents', value: totalResidents, color: 'from-emerald-500 to-teal-500', icon: Users },
                { label: 'Total Flats', value: totalFlats, color: 'from-blue-500 to-cyan-500', icon: Globe },
                { label: 'Managers', value: managers.length, color: 'from-orange-500 to-red-500', icon: ShieldCheck },
              ].map(s => (
                <div key={s.label} className={`border rounded-2xl p-4 ${card}`}>
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3`}>
                    <s.icon size={18} className="text-white" />
                  </div>
                  <p className="text-2xl font-extrabold">{s.value}</p>
                  <p className={`text-xs mt-0.5 ${subtext}`}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Society Status Overview */}
            <div className={`border rounded-2xl p-5 ${card}`}>
              <h3 className="font-bold mb-4 flex items-center gap-2"><TrendingUp size={16} className="text-purple-400" /> Society Health Overview</h3>
              <div className="space-y-3">
                {societies.map(s => (
                  <div key={s.id} className={`flex items-center justify-between p-3 rounded-xl ${isDark ? 'bg-slate-700/40' : 'bg-gray-50'}`}>
                    <div>
                      <p className="font-semibold text-sm">{s.name}</p>
                      <p className={`text-xs ${subtext}`}>{s.city} • {s.residents}/{s.flats} flats occupied • {s.guards} guards</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${s.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                      {s.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 90-Day Policy Info */}
            <div className={`border rounded-2xl p-5 ${isDark ? 'bg-indigo-900/20 border-indigo-700/40' : 'bg-indigo-50 border-indigo-200'}`}>
              <h3 className="font-bold mb-1 text-indigo-400 flex items-center gap-2"><Activity size={16} /> 90-Day Data Retention Policy</h3>
              <p className={`text-xs leading-relaxed ${subtext}`}>
                Cron job daily midnight par chalti hai. Entry logs, deliveries aur resolved complaints jo 90 din se purani hain, automatically delete ho jaati hain. Aaj tak <span className="text-indigo-400 font-bold">0 records</span> cleaned up.
              </p>
            </div>
          </>
        )}

        {/* SOCIETIES TAB */}
        {activeTab === 'societies' && (
          <>
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-base">Registered Societies ({societies.length})</h2>
              <button onClick={() => {
                setShowAddSociety(!showAddSociety);
                setEditingSociety(null);
                setNewSociety({ name: '', city: '', flats: '', society_code: '' });
              }}
                className="flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-xl text-xs font-bold">
                <Plus size={13} /> Add Society
              </button>
            </div>

            {showAddSociety && (
              <div className={`border rounded-2xl p-5 space-y-3 ${card}`}>
                <h4 className="font-semibold text-sm text-purple-400">{editingSociety ? 'Society Update Karein' : 'Nayi Society Register Karein'}</h4>
                <input placeholder="Society Name" value={newSociety.name} onChange={e => setNewSociety({...newSociety, name: e.target.value})}
                  className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none ${input}`} />
                <input placeholder="City" value={newSociety.city} onChange={e => setNewSociety({...newSociety, city: e.target.value})}
                  className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none ${input}`} />
                <input placeholder="Total Flats" type="number" value={newSociety.flats} onChange={e => setNewSociety({...newSociety, flats: e.target.value})}
                  className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none ${input}`} />
                <input placeholder="Custom PIN (Optional) e.g. GVA123" value={newSociety.society_code} onChange={e => setNewSociety({...newSociety, society_code: e.target.value.toUpperCase()})}
                  className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none uppercase ${input}`} />
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
                  }} className="flex-1 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-bold">{editingSociety ? 'Update Karein' : 'Register Karein'}</button>
                  <button onClick={() => {
                    setShowAddSociety(false);
                    setEditingSociety(null);
                    setNewSociety({ name: '', city: '', flats: '', society_code: '' });
                  }} className={`flex-1 py-2.5 rounded-xl text-sm border ${isDark ? 'border-slate-600 text-slate-400' : 'border-gray-300 text-gray-500'}`}>Cancel</button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {societies.map(s => (
                <div key={s.id} className={`border rounded-2xl p-4 ${card}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                        <Building2 size={18} className="text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{s.name}</p>
                        <p className={`text-xs ${subtext}`}>{s.city} • <span className="font-bold text-indigo-400">PIN: {s.society_code}</span></p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${s.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>{s.status || 'active'}</span>
                      <button onClick={() => {
                        setEditingSociety(s);
                        setNewSociety({ name: s.name, city: s.city, flats: s.flats || '', society_code: s.society_code || '' });
                        setShowAddSociety(true);
                      }} className="text-blue-400 hover:text-blue-300"><Edit2 size={15} /></button>
                      <button onClick={async () => {
                        if (window.confirm('Delete this society?')) {
                          try {
                            await societyAPI.delete(s.id);
                            setSocieties(societies.filter(x => x.id !== s.id));
                          } catch (err) {
                            console.error('Failed to delete:', err);
                          }
                        }
                      }} className="text-red-400 hover:text-red-300"><Trash2 size={15} /></button>
                    </div>
                  </div>
                  <div className={`mt-3 grid grid-cols-3 gap-2 text-center text-xs ${subtext}`}>
                    <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}><p className="font-bold text-white text-sm">{s.residents || 0}</p>Residents</div>
                    <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}><p className="font-bold text-white text-sm">{s.guards || 0}</p>Guards</div>
                    <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}><p className="font-bold text-emerald-400 text-sm">Active</p>Status</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* MANAGERS TAB */}
        {activeTab === 'managers' && (
          <>
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-base">Society Managers ({managers.length})</h2>
              <button onClick={() => setShowAddManager(!showAddManager)}
                className="flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-xl text-xs font-bold">
                <Plus size={13} /> Add Manager
              </button>
            </div>

            {showAddManager && (
              <div className={`border rounded-2xl p-5 space-y-3 ${card}`}>
                <h4 className="font-semibold text-sm text-purple-400">Naya Manager Onboard Karein</h4>
                <input placeholder="Manager ka Naam" value={newManager.name} onChange={e => setNewManager({...newManager, name: e.target.value})}
                  className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none ${input}`} />
                <input placeholder="Phone Number" type="tel" value={newManager.phone} onChange={e => setNewManager({...newManager, phone: e.target.value})}
                  className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none ${input}`} />
                <select value={newManager.society} onChange={e => setNewManager({...newManager, society: e.target.value})}
                  className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none ${input}`}>
                  <option value="">Society Assign Karein</option>
                  {societies.map(s => <option key={s.id}>{s.name}</option>)}
                </select>
                <input placeholder="Login Password" type="password" value={newManager.password} onChange={e => setNewManager({...newManager, password: e.target.value})}
                  className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none ${input}`} />
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
                  }} className="flex-1 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-bold">Add Karein</button>
                  <button onClick={() => setShowAddManager(false)} className={`flex-1 py-2.5 rounded-xl text-sm border ${isDark ? 'border-slate-600 text-slate-400' : 'border-gray-300 text-gray-500'}`}>Cancel</button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {managers.map(m => (
                <div key={m.id} className={`border rounded-2xl p-4 flex items-center justify-between ${card}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                      {m.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{m.name}</p>
                      <p className={`text-xs ${subtext}`}>{m.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${m.account_status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{m.account_status || 'active'}</span>
                    <p className={`text-xs ${subtext}`}>{m.society_name || 'No Society'}</p>
                    <button onClick={async () => {
                      if (!window.confirm('Delete this manager?')) return;
                      try {
                        await managerAPI.deleteManager(m.id);
                        setManagers(managers.filter(x => x.id !== m.id));
                      } catch(err) { alert('Delete nahi hua'); }
                    }} className="text-red-400 hover:text-red-300"><Trash2 size={15} /></button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* DATA LOGS TAB */}
        {activeTab === 'logs' && (
          <div className={`border rounded-2xl p-5 ${card}`}>
            <h3 className="font-bold mb-4 text-sm flex items-center gap-2"><Activity size={16} className="text-purple-400" /> Global System Logs</h3>
            <div className="space-y-3">
              {[
                { time: '4:10 PM', event: 'Car MH12AB1234 entered', society: 'Green Valley', type: 'entry' },
                { time: '3:55 PM', event: 'SOS Alert triggered — Flat A-302', society: 'Sunrise Heights', type: 'sos' },
                { time: '3:40 PM', event: 'Resident Ramesh Kumar approved', society: 'Royal Enclave', type: 'approval' },
                { time: '2:15 PM', event: 'Service Request #45 — Resolved', society: 'Green Valley', type: 'service' },
                { time: '1:00 PM', event: 'Amazon delivery logged at gate', society: 'Blue Horizon', type: 'delivery' },
              ].map((log, i) => (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-xl ${isDark ? 'bg-slate-700/40' : 'bg-gray-50'}`}>
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    log.type === 'sos' ? 'bg-red-400' :
                    log.type === 'entry' ? 'bg-emerald-400' :
                    log.type === 'approval' ? 'bg-indigo-400' : 'bg-yellow-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{log.event}</p>
                    <p className={`text-xs ${subtext}`}>{log.society} • {log.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NOTICES TAB */}
        {activeTab === 'notices' && (
          <AnnouncementBoard user={user} />
        )}
      </div>

      <UserProfile isOpen={showProfile} onClose={() => setShowProfile(false)} />
    </div>
  );
};

export default SuperAdminDashboard;
