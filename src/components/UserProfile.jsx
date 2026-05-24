import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { 
  X, User, Lock, Save, Loader2, Phone, Shield, Mail, Bell, 
  AlertTriangle, Settings, Eye, EyeOff, Globe, VolumeX, 
  Moon, Sun, Check, ShieldAlert, KeyRound, Grid, Palette 
} from 'lucide-react';
import { authAPI } from '../services/api';

const AVATAR_GRADIENTS = [
  { id: 'indigo', name: 'Indigo Dream', css: 'from-indigo-500 to-purple-600' },
  { id: 'sunset', name: 'Sunset Glow', css: 'from-rose-500 to-orange-500' },
  { id: 'emerald', name: 'Teal Forest', css: 'from-emerald-400 to-teal-600' },
  { id: 'ocean', name: 'Ocean Breeze', css: 'from-cyan-500 to-blue-600' },
  { id: 'blossom', name: 'Sweet Blossom', css: 'from-pink-500 to-rose-600' },
];

const TABS = [
  { id: 'details', label: 'Personal Details', mobileLabel: 'Details', icon: User, desc: 'Name, phone & email' },
  { id: 'notifications', label: 'Notifications', mobileLabel: 'Alerts', icon: Bell, desc: 'Alert preferences' },
  { id: 'emergency', label: 'Emergency SOS', mobileLabel: 'SOS', icon: AlertTriangle, desc: 'Contacts & relations' },
  { id: 'password', label: 'Security & Access', mobileLabel: 'Security', icon: Lock, desc: 'Change account password' },
  { id: 'preferences', label: 'App Preferences', mobileLabel: 'Preferences', icon: Settings, desc: 'Themes & regional settings' },
];

const UserProfile = ({ isOpen, onClose }) => {
  const { isDark, toggleTheme } = useTheme();
  
  const [activeTab, setActiveTab] = useState('details');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Core user details (from backend)
  const [profile, setProfile] = useState({ name: '', phone: '', role: '', tower: '', flat_number: '' });
  
  // Custom advanced settings (saved in LocalStorage)
  const [settings, setSettings] = useState({
    email: '',
    altPhone: '',
    avatarGradient: 'indigo',
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: true,
    quietMode: false,
    emergencyName: '',
    emergencyRelation: 'Spouse',
    emergencyPhone: '',
    language: 'English',
    pinQuickActions: true,
  });

  // Password state
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });

  // Stylings
  const bg = isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-gray-800';
  const cardBg = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm';
  const inputStyle = isDark 
    ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500' 
    : 'bg-white border-gray-200 text-gray-800 placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500';
  const subtext = isDark ? 'text-slate-400' : 'text-gray-500';
  const borderCol = isDark ? 'border-slate-900' : 'border-slate-200/60';

  useEffect(() => {
    if (isOpen) {
      fetchProfile();
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setError('');
      setSuccess('');
      setActiveTab('details');
    }
  }, [isOpen]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await authAPI.getProfile();
      setProfile(res.data);

      // Load advanced profile settings from LocalStorage
      const localKey = `gatekeeper_user_settings_${res.data.id}`;
      const savedSettings = localStorage.getItem(localKey);
      if (savedSettings) {
        setSettings(prev => ({ ...prev, ...JSON.parse(savedSettings) }));
      }
    } catch (err) {
      setError('Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (tabToSave) => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      // 1. If modifying core details, update backend
      if (tabToSave === 'details') {
        if (!profile.name || !profile.phone) {
          setError('Name and Phone are required.');
          setSaving(false);
          return;
        }
        await authAPI.updateProfile({ name: profile.name, phone: profile.phone });

        // Update main user object in LocalStorage
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (storedUser) {
          localStorage.setItem('user', JSON.stringify({ ...storedUser, name: profile.name }));
        }
      }

      // 2. Save advanced preferences to LocalStorage
      const localKey = `gatekeeper_user_settings_${profile.id}`;
      localStorage.setItem(localKey, JSON.stringify(settings));

      setSuccess('Settings updated successfully!');
      
      // Auto-clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!passwords.currentPassword || !passwords.newPassword) {
      return setError('Please fill all password fields.');
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      return setError('New passwords do not match.');
    }
    if (passwords.newPassword.length < 6) {
      return setError('New password must be at least 6 characters.');
    }

    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await authAPI.updateProfile({ 
        currentPassword: passwords.currentPassword, 
        newPassword: passwords.newPassword 
      });
      setSuccess('Password updated successfully! Active on next login.');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Password update failed.');
    } finally {
      setSaving(false);
    }
  };

  const getSelectedGradient = () => {
    const selected = AVATAR_GRADIENTS.find(g => g.id === settings.avatarGradient);
    return selected ? selected.css : 'from-indigo-500 to-purple-600';
  };

  // Custom Toggle Switch Component
  const ToggleSwitch = ({ checked, onChange, label, description, icon: Icon }) => (
    <div className={`flex items-start justify-between p-4 rounded-2xl border ${cardBg} hover:shadow-md hover:shadow-indigo-500/5 transition-all duration-300`}>
      <div className="flex gap-3">
        {Icon && (
          <div className={`p-2 rounded-xl ${isDark ? 'bg-indigo-950/40 text-indigo-400' : 'bg-indigo-50 text-indigo-600'} shrink-0`}>
            <Icon size={18} />
          </div>
        )}
        <div className="flex flex-col">
          <span className="text-sm font-bold tracking-tight">{label}</span>
          {description && <span className={`text-[11px] mt-0.5 leading-relaxed ${subtext}`}>{description}</span>}
        </div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        type="button"
        className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 cursor-pointer shrink-0 ${
          checked ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-800'
        }`}
      >
        <div
          className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 ease-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-slate-950/80 backdrop-blur-md transition-all animate-fade-in">
      <div className={`w-full md:max-w-4xl h-[94vh] md:h-auto rounded-t-[2rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden border ${borderCol} ${bg} flex flex-col md:flex-row transition-all duration-300`}>
        
        {/* ── Left Sidebar (Desktop Only) ────────────────────────────────── */}
        <div className={`hidden md:flex w-80 p-8 flex-col justify-between border-r ${borderCol} ${isDark ? 'bg-slate-900/40' : 'bg-slate-100/40'}`}>
          <div className="space-y-6">
            {/* Profile Card Header */}
            <div className="flex items-center gap-4 relative">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getSelectedGradient()} flex items-center justify-center text-white text-2xl font-black shadow-lg relative overflow-hidden`}>
                {profile.name ? profile.name.charAt(0).toUpperCase() : <User />}
              </div>
              <div>
                <h3 className="font-extrabold text-base tracking-tight leading-tight line-clamp-1">
                  {loading ? 'Syncing...' : profile.name}
                </h3>
                <p className={`text-[10px] font-bold tracking-wider uppercase mt-1 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 inline-block`}>
                  {profile.role ? profile.role.replace('_', ' ') : ''}
                </p>
                {(profile.tower || profile.flat_number) && (
                  <p className={`text-xs font-semibold mt-1 ${subtext}`}>
                    {profile.tower ? `${profile.tower} - ` : ''}Flat {profile.flat_number || ''}
                  </p>
                )}
              </div>
            </div>

            {/* Settings Nav Menu */}
            <nav className="space-y-1">
              {TABS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id); setError(''); setSuccess(''); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-left group ${
                      isActive 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' 
                        : `hover:bg-slate-200/50 dark:hover:bg-slate-800/40 ${subtext} hover:text-indigo-400`
                    }`}
                  >
                    <Icon size={18} className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'} transition-colors shrink-0`} />
                    <div className="flex flex-col">
                      <span className="text-sm font-extrabold tracking-tight leading-tight">{item.label}</span>
                      <span className={`text-[10px] ${isActive ? 'text-indigo-200' : 'text-slate-500'} font-medium`}>{item.desc}</span>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="pt-6">
            <p className="text-[9px] text-slate-500 font-semibold tracking-widest uppercase">Gatekeeper Smart OS</p>
            <p className="text-[9px] text-slate-600 mt-0.5">v2.4.0 • Enterprise Edition</p>
          </div>
        </div>

        {/* ── Mobile Header & Mobile Horizontal Tabs (Mobile Only) ────────── */}
        <div className="flex md:hidden flex-col shrink-0">
          <div className={`flex items-center justify-between p-4 border-b ${borderCol} ${isDark ? 'bg-slate-900/60' : 'bg-slate-100/50'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getSelectedGradient()} flex items-center justify-center text-white text-lg font-black shadow-md`}>
                {profile.name ? profile.name.charAt(0).toUpperCase() : <User size={16} />}
              </div>
              <div>
                <h3 className="font-extrabold text-sm tracking-tight leading-tight line-clamp-1">{profile.name}</h3>
                <p className="text-[10px] text-indigo-500 dark:text-indigo-400 font-bold uppercase mt-0.5">
                  {profile.role ? profile.role.replace('_', ' ') : ''} 
                  {profile.flat_number ? ` • ${profile.tower ? profile.tower + ' - ' : ''}Flat ${profile.flat_number}` : ''}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className={`p-2 rounded-full border ${borderCol} ${isDark ? 'bg-slate-900 text-slate-400' : 'bg-white text-gray-500 shadow-sm'}`}
            >
              <X size={16} />
            </button>
          </div>

          {/* Scrollable Horizontal Pill Tabs */}
          <div className={`flex overflow-x-auto py-2.5 px-4 gap-2 border-b ${borderCol} scrollbar-none ${isDark ? 'bg-slate-950' : 'bg-slate-100/30'}`}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setError(''); setSuccess(''); }}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                  activeTab === tab.id 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : `bg-slate-200/70 dark:bg-slate-900 border ${borderCol} ${subtext} hover:text-indigo-400`
                }`}
              >
                <tab.icon size={13} />
                <span>{tab.mobileLabel}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Main Content Panel ────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col justify-between overflow-hidden">
          
          {/* Upper Toolbar (Desktop Only) */}
          <div className={`hidden md:flex p-6 border-b ${borderCol} justify-between items-center bg-slate-900/5 dark:bg-slate-950/20`}>
            <h2 className="text-lg font-black tracking-tight uppercase">
              {TABS.find(t => t.id === activeTab)?.label}
            </h2>
            <button 
              onClick={onClose} 
              className={`p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-900 transition-colors border ${borderCol} ${subtext}`}
            >
              <X size={16} />
            </button>
          </div>

          {/* Main Content Area (Scrolls beautifully on both desktop & mobile) */}
          <div className="flex-1 p-5 md:p-8 overflow-y-auto space-y-5">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="animate-spin text-indigo-500" size={32} />
                <span className="text-xs font-bold text-slate-500">Syncing settings with cloud...</span>
              </div>
            ) : (
              <>
                {error && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-bold flex items-center gap-2 animate-shake">
                    <ShieldAlert size={15} /> {error}
                  </div>
                )}
                {success && (
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-bold flex items-center gap-2 animate-fade-in">
                    <Check size={14} className="bg-emerald-500 text-white rounded-full p-0.5" /> {success}
                  </div>
                )}

                {/* ── TAB: PERSONAL DETAILS ── */}
                {activeTab === 'details' && (
                  <div className="space-y-5 animate-fade-in">
                    {/* Avatar Palette Selector */}
                    <div className="space-y-2">
                      <label className={`text-[10px] font-bold uppercase tracking-wider ${subtext}`}>Choose Color Palette</label>
                      <div className="grid grid-cols-5 gap-2">
                        {AVATAR_GRADIENTS.map((grad) => (
                          <button
                            key={grad.id}
                            onClick={() => setSettings({ ...settings, avatarGradient: grad.id })}
                            className={`h-10 rounded-xl bg-gradient-to-br ${grad.css} border-2 flex items-center justify-center text-white transition-all ${
                              settings.avatarGradient === grad.id ? 'border-indigo-600 scale-105 shadow-md shadow-indigo-500/10' : 'border-transparent opacity-65 hover:opacity-90'
                            }`}
                            title={grad.name}
                          >
                            {settings.avatarGradient === grad.id && <Check size={14} className="bg-black/20 rounded-full p-0.5" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Inputs Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold mb-1.5 block">Full Name</label>
                        <div className="relative">
                          <User size={15} className={`absolute left-3.5 top-3 ${subtext}`} />
                          <input 
                            type="text"
                            value={profile.name} 
                            onChange={e => setProfile({...profile, name: e.target.value})}
                            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-semibold outline-none transition-all ${inputStyle}`} 
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold mb-1.5 block">Primary Mobile</label>
                        <div className="relative">
                          <Phone size={15} className={`absolute left-3.5 top-3 ${subtext}`} />
                          <input 
                            type="tel"
                            value={profile.phone} 
                            onChange={e => setProfile({...profile, phone: e.target.value})}
                            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-semibold outline-none transition-all ${inputStyle}`} 
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold mb-1.5 block">Email Address</label>
                        <div className="relative">
                          <Mail size={15} className={`absolute left-3.5 top-3 ${subtext}`} />
                          <input 
                            type="email"
                            placeholder="Enter your email"
                            value={settings.email} 
                            onChange={e => setSettings({...settings, email: e.target.value})}
                            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-semibold outline-none transition-all ${inputStyle}`} 
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold mb-1.5 block">Alternate Contact (Optional)</label>
                        <div className="relative">
                          <Phone size={15} className={`absolute left-3.5 top-3 ${subtext}`} />
                          <input 
                            type="tel"
                            placeholder="Backup phone number"
                            value={settings.altPhone} 
                            onChange={e => setSettings({...settings, altPhone: e.target.value})}
                            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-semibold outline-none transition-all ${inputStyle}`} 
                          />
                        </div>
                      </div>
                    </div>

                    {/* Read Only Society Block */}
                    <div className={`p-4 rounded-2xl border ${cardBg} space-y-3`}>
                      <div className="flex items-center gap-2 text-indigo-500 font-bold text-xs uppercase tracking-wider">
                        <Shield size={14} /> Society Account Info
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 text-xs font-semibold">
                        <div>
                          <span className={subtext}>Resident Association</span>
                          <p className="text-sm font-extrabold mt-0.5 leading-tight">{profile.society_name || 'N/A'}</p>
                        </div>
                        <div>
                          <span className={subtext}>Tower / Block</span>
                          <p className="text-sm font-extrabold mt-0.5">{profile.tower || 'N/A'}</p>
                        </div>
                        <div>
                          <span className={subtext}>Flat Unit</span>
                          <p className="text-sm font-extrabold mt-0.5">{profile.flat_number || 'N/A'}</p>
                        </div>
                        <div className="col-span-2 md:col-span-3 border-t pt-2.5 dark:border-slate-800/80 border-slate-100">
                          <span className={subtext}>Registered Address</span>
                          <p className="text-[11px] leading-tight text-slate-500 dark:text-slate-400 mt-0.5">
                            {profile.society_address || 'Sector 23'}, {profile.society_city || 'Mumbai'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleSaveSettings('details')} 
                      disabled={saving}
                      className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all cursor-pointer"
                    >
                      {saving ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> Save Details</>}
                    </button>
                  </div>
                )}

                {/* ── TAB: NOTIFICATIONS ── */}
                {activeTab === 'notifications' && (
                  <div className="space-y-3.5 animate-fade-in">
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${subtext}`}>Choose channels for alert routing</p>
                    
                    <ToggleSwitch 
                      checked={settings.emailNotifications}
                      onChange={(val) => setSettings({...settings, emailNotifications: val})}
                      label="Email Circulars & Notices"
                      description="Receive announcements, billing receipts, and society audits."
                      icon={Mail}
                    />

                    <ToggleSwitch 
                      checked={settings.pushNotifications}
                      onChange={(val) => setSettings({...settings, pushNotifications: val})}
                      label="Mobile Push Alerts"
                      description="Banners for courier arrivals, guests, and SOS triggers."
                      icon={Bell}
                    />

                    <ToggleSwitch 
                      checked={settings.smsNotifications}
                      onChange={(val) => setSettings({...settings, smsNotifications: val})}
                      label="Critical Safety SMS Alerts"
                      description="Direct carrier SMS texts for emergency alarms."
                      icon={Phone}
                    />

                    <ToggleSwitch 
                      checked={settings.quietMode}
                      onChange={(val) => setSettings({...settings, quietMode: val})}
                      label="Quiet Hours (Do Not Disturb)"
                      description="Mutes alerts between 10:00 PM and 7:00 AM (Except SOS)."
                      icon={VolumeX}
                    />

                    <button 
                      onClick={() => handleSaveSettings('notifications')} 
                      disabled={saving}
                      className="w-full mt-2 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all cursor-pointer"
                    >
                      {saving ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> Apply Settings</>}
                    </button>
                  </div>
                )}

                {/* ── TAB: EMERGENCY SOS ── */}
                {activeTab === 'emergency' && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs leading-relaxed font-semibold flex gap-2">
                      <AlertTriangle size={24} className="shrink-0 mt-0.5 text-amber-500" />
                      <div>
                        <strong className="block text-sm mb-0.5">Automated SOS Protocol</strong>
                        If you trigger the SOS alarm, this contact will be notified immediately via SMS/Push along with the main Security Desk.
                      </div>
                    </div>

                    <div className="space-y-3.5">
                      <div>
                        <label className="text-xs font-bold mb-1.5 block">Contact Full Name</label>
                        <div className="relative">
                          <User className={`absolute left-3.5 top-3 ${subtext}`} size={15} />
                          <input 
                            type="text"
                            placeholder="e.g. Priyanshu Sharma"
                            value={settings.emergencyName}
                            onChange={e => setSettings({...settings, emergencyName: e.target.value})}
                            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-semibold outline-none transition-all ${inputStyle}`} 
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold mb-1.5 block">Relationship</label>
                          <select
                            value={settings.emergencyRelation}
                            onChange={e => setSettings({...settings, emergencyRelation: e.target.value})}
                            className={`w-full px-3 py-2.5 rounded-xl border text-sm font-semibold outline-none transition-all ${inputStyle}`}
                          >
                            {['Spouse', 'Parent', 'Child', 'Sibling', 'Relative', 'Friend', 'Neighbor'].map((rel) => (
                              <option key={rel} value={rel}>{rel}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-xs font-bold mb-1.5 block">Emergency Mobile</label>
                          <div className="relative">
                            <Phone className={`absolute left-3.5 top-3 ${subtext}`} size={15} />
                            <input 
                              type="tel"
                              placeholder="e.g. +91 98765 43210"
                              value={settings.emergencyPhone}
                              onChange={e => setSettings({...settings, emergencyPhone: e.target.value})}
                              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-semibold outline-none transition-all ${inputStyle}`} 
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleSaveSettings('emergency')} 
                      disabled={saving}
                      className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all cursor-pointer"
                    >
                      {saving ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> Register SOS Contact</>}
                    </button>
                  </div>
                )}

                {/* ── TAB: SECURITY & PASSWORD ── */}
                {activeTab === 'password' && (
                  <div className="space-y-4 animate-fade-in">
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${subtext}`}>Update password for secure access</p>
                    
                    <div className="space-y-3.5">
                      <div>
                        <label className="text-xs font-bold mb-1.5 block">Current Password</label>
                        <div className="relative">
                          <KeyRound size={15} className={`absolute left-3.5 top-3 ${subtext}`} />
                          <input 
                            type={showPassword.current ? 'text' : 'password'}
                            placeholder="Enter current password"
                            value={passwords.currentPassword}
                            onChange={e => setPasswords({...passwords, currentPassword: e.target.value})}
                            className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm outline-none transition-all ${inputStyle}`} 
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword({ ...showPassword, current: !showPassword.current })}
                            className={`absolute right-3.5 top-3 ${subtext} hover:text-indigo-500`}
                          >
                            {showPassword.current ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold mb-1.5 block">New Password</label>
                        <div className="relative">
                          <Lock size={15} className={`absolute left-3.5 top-3 ${subtext}`} />
                          <input 
                            type={showPassword.new ? 'text' : 'password'}
                            placeholder="Create new password"
                            value={passwords.newPassword}
                            onChange={e => setPasswords({...passwords, newPassword: e.target.value})}
                            className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm outline-none transition-all ${inputStyle}`} 
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
                            className={`absolute right-3.5 top-3 ${subtext} hover:text-indigo-500`}
                          >
                            {showPassword.new ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold mb-1.5 block">Confirm Password</label>
                        <div className="relative">
                          <Lock size={15} className={`absolute left-3.5 top-3 ${subtext}`} />
                          <input 
                            type={showPassword.confirm ? 'text' : 'password'}
                            placeholder="Confirm new password"
                            value={passwords.confirmPassword}
                            onChange={e => setPasswords({...passwords, confirmPassword: e.target.value})}
                            className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm outline-none transition-all ${inputStyle}`} 
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                            className={`absolute right-3.5 top-3 ${subtext} hover:text-indigo-500`}
                          >
                            {showPassword.confirm ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={handleUpdatePassword} 
                      disabled={saving}
                      className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all cursor-pointer"
                    >
                      {saving ? <Loader2 size={16} className="animate-spin" /> : <><Lock size={16} /> Update Password</>}
                    </button>
                  </div>
                )}

                {/* ── TAB: PREFERENCES ── */}
                {activeTab === 'preferences' && (
                  <div className="space-y-4 animate-fade-in">
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${subtext}`}>App Interface Customization</p>

                    <div className="grid grid-cols-2 gap-3.5">
                      <button
                        type="button"
                        onClick={() => { if (!isDark) toggleTheme(); }}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-center ${
                          isDark 
                            ? 'border-indigo-600 bg-slate-900 text-white shadow-sm shadow-indigo-600/10' 
                            : 'border-slate-200 dark:border-slate-800 bg-slate-100 text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <Moon size={18} className="text-indigo-400" />
                        <span className="text-[11px] font-bold">Dark Mode</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { if (isDark) toggleTheme(); }}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-center ${
                          !isDark 
                            ? 'border-indigo-600 bg-white text-slate-800 shadow-sm shadow-indigo-600/10' 
                            : 'border-slate-850 bg-slate-900/30 text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        <Sun size={18} className="text-amber-500" />
                        <span className="text-[11px] font-bold">Light Mode</span>
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold block">App Language</label>
                      <div className="relative">
                        <Globe size={15} className={`absolute left-3.5 top-3 ${subtext}`} />
                        <select
                          value={settings.language}
                          onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                          className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-bold outline-none transition-all ${inputStyle}`}
                        >
                          {['English', 'Hindi (हिन्दी)', 'Marathi (मराठी)', 'Gujarati (ગુજરાતી)', 'Tamil (தமிழ்)'].map((lang) => (
                            <option key={lang} value={lang.split(' ')[0]}>{lang}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <ToggleSwitch 
                      checked={settings.pinQuickActions}
                      onChange={(val) => setSettings({...settings, pinQuickActions: val})}
                      label="Enable Floating Action Hub (FAB)"
                      description="Shows circular quick shortcut buttons on dashboard."
                      icon={Grid}
                    />

                    <button 
                      onClick={() => handleSaveSettings('preferences')} 
                      disabled={saving}
                      className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all cursor-pointer"
                    >
                      {saving ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> Save Preferences</>}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Bottom mini status bar */}
          <div className={`p-3.5 border-t ${borderCol} flex justify-between items-center text-[9px] ${subtext} font-semibold bg-slate-900/5 dark:bg-slate-950/20 shrink-0`}>
            <span>Status: Synchronized</span>
            <span>Encrypted Session • TLS 1.3</span>
          </div>

        </div>

      </div>
    </div>
  );
};

export default UserProfile;
