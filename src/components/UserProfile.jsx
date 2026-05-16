import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { X, User, Lock, Save, Loader2, Phone, Shield } from 'lucide-react';
import { authAPI } from '../services/api';

const UserProfile = ({ isOpen, onClose }) => {
  const { isDark } = useTheme();
  
  const [activeTab, setActiveTab] = useState('details'); // 'details' or 'password'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [profile, setProfile] = useState({ name: '', phone: '', role: '', flat_number: '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const bg = isDark ? 'bg-slate-900 text-white' : 'bg-white text-gray-800';
  const input = isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-indigo-500' : 'bg-gray-50 border-gray-300 text-gray-800 focus:border-indigo-500';
  const subtext = isDark ? 'text-slate-400' : 'text-gray-500';

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
    } catch (err) {
      setError('Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDetails = async () => {
    if (!profile.name || !profile.phone) return setError('Name and Phone are required.');
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await authAPI.updateProfile({ name: profile.name, phone: profile.phone });
      setSuccess('Profile updated successfully!');
      // Update local storage user name if needed
      const storedUser = JSON.parse(localStorage.getItem('user'));
      if (storedUser) {
        localStorage.setItem('user', JSON.stringify({ ...storedUser, name: profile.name }));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
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
      setSuccess('Password changed successfully! You can use it on your next login.');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Password update failed');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className={`w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border ${isDark ? 'border-slate-700' : 'border-gray-200'} ${bg}`}>
        
        {/* Header */}
        <div className="relative p-6 pb-4 border-b border-opacity-20 border-gray-500">
          <button onClick={onClose} className={`absolute top-4 right-4 p-2 rounded-full hover:bg-black/10 transition-colors ${subtext}`}>
            <X size={20} />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {profile.name ? profile.name.charAt(0) : <User />}
            </div>
            <div>
              <h2 className="text-xl font-extrabold">{loading ? 'Loading...' : profile.name}</h2>
              <p className={`text-sm font-medium flex items-center gap-1.5 capitalize ${subtext}`}>
                <Shield size={14} className="text-indigo-400"/> {profile.role ? profile.role.replace('_', ' ') : ''} 
                {profile.flat_number && ` • Flat ${profile.flat_number}`}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex px-6 pt-4 gap-6 border-b border-opacity-20 border-gray-500">
          <button onClick={() => { setActiveTab('details'); setError(''); setSuccess(''); }} 
            className={`pb-3 text-sm font-bold transition-colors relative ${activeTab === 'details' ? 'text-indigo-500' : subtext}`}>
            Personal Details
            {activeTab === 'details' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-t-full" />}
          </button>
          <button onClick={() => { setActiveTab('password'); setError(''); setSuccess(''); }} 
            className={`pb-3 text-sm font-bold transition-colors relative ${activeTab === 'password' ? 'text-indigo-500' : subtext}`}>
            Change Password
            {activeTab === 'password' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-t-full" />}
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>
          ) : (
            <>
              {error && <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm font-semibold">{error}</div>}
              {success && <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-sm font-semibold">{success}</div>}

              {activeTab === 'details' ? (
                <div className="space-y-4">
                  <div>
                    <label className={`text-xs font-bold mb-1.5 block ${subtext}`}>Full Name</label>
                    <div className="relative">
                      <User size={16} className={`absolute left-3.5 top-3.5 ${subtext}`} />
                      <input value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})}
                        className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm font-semibold outline-none transition-all ${input}`} />
                    </div>
                  </div>
                  <div>
                    <label className={`text-xs font-bold mb-1.5 block ${subtext}`}>Phone Number</label>
                    <div className="relative">
                      <Phone size={16} className={`absolute left-3.5 top-3.5 ${subtext}`} />
                      <input value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})}
                        className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm font-semibold outline-none transition-all ${input}`} />
                    </div>
                  </div>
                  <button onClick={handleUpdateDetails} disabled={saving}
                    className="w-full mt-2 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Save Changes</>}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className={`text-xs font-bold mb-1.5 block ${subtext}`}>Current Password</label>
                    <div className="relative">
                      <Lock size={16} className={`absolute left-3.5 top-3.5 ${subtext}`} />
                      <input type="password" placeholder="Enter current password" value={passwords.currentPassword} onChange={e => setPasswords({...passwords, currentPassword: e.target.value})}
                        className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none transition-all ${input}`} />
                    </div>
                  </div>
                  <div className="pt-2">
                    <label className={`text-xs font-bold mb-1.5 block ${subtext}`}>New Password</label>
                    <div className="relative mb-3">
                      <Lock size={16} className={`absolute left-3.5 top-3.5 ${subtext}`} />
                      <input type="password" placeholder="Enter new password" value={passwords.newPassword} onChange={e => setPasswords({...passwords, newPassword: e.target.value})}
                        className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none transition-all ${input}`} />
                    </div>
                    <div className="relative">
                      <Lock size={16} className={`absolute left-3.5 top-3.5 ${subtext}`} />
                      <input type="password" placeholder="Confirm new password" value={passwords.confirmPassword} onChange={e => setPasswords({...passwords, confirmPassword: e.target.value})}
                        className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none transition-all ${input}`} />
                    </div>
                  </div>
                  <button onClick={handleUpdatePassword} disabled={saving}
                    className="w-full mt-2 py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <><Lock size={18} /> Update Password</>}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
