import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Phone, User, Home, LogIn, UserPlus, CheckCircle, Clock, Loader2, Key, Eye, EyeOff } from 'lucide-react';
import { authAPI, societyAPI } from '../services/api';

const LoginPage = ({ onLoginSuccess }) => {
  const { isDark } = useTheme();
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'pending'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', password: '', flat_number: '', society_pin: '', society_id: null, society_name: '' });
  const [verifyingPin, setVerifyingPin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const verifySocietyPin = async (pin) => {
    if (pin.length < 6) {
      setForm(prev => ({ ...prev, society_id: null, society_name: '' }));
      return;
    }
    setVerifyingPin(true);
    try {
      const res = await societyAPI.verifyCode(pin);
      setForm(prev => ({ ...prev, society_id: res.data.id, society_name: res.data.name }));
      setError('');
    } catch (err) {
      setForm(prev => ({ ...prev, society_id: null, society_name: '' }));
      setError('Invalid Society PIN. Please check with your Manager.');
    } finally {
      setVerifyingPin(false);
    }
  };

  const handlePinChange = (e) => {
    const val = e.target.value.toUpperCase();
    setForm(prev => ({ ...prev, society_pin: val }));
    setError('');
    if (val.length >= 6) {
      verifySocietyPin(val);
    } else {
      setForm(prev => ({ ...prev, society_id: null, society_name: '' }));
    }
  };

  const handleLogin = async () => {
    if (!form.phone || !form.password) return setError('Phone and Password are required.');
    setLoading(true);
    try {
      const res = await authAPI.login({ phone: form.phone, password: form.password });
      const data = res.data;
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      onLoginSuccess(data.user);
    } catch (err) {
      if (err.response?.data?.message?.includes('pending')) {
        setMode('pending');
      } else {
        setError(err.response?.data?.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!form.name || !form.phone || !form.password || !form.flat_number || !form.society_id) {
      return setError('All fields, including a valid Society PIN, are required.');
    }
    setLoading(true);
    try {
      await authAPI.register({
        name: form.name,
        phone: form.phone,
        password: form.password,
        flat_number: form.flat_number,
        society_id: form.society_id
      });
      setMode('pending');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const bg = isDark ? 'bg-[#0f172a] text-white' : 'bg-gray-50 text-gray-800';
  const card = isDark ? 'bg-slate-800/70 border-slate-700' : 'bg-white border-gray-200 shadow-xl';
  const input = isDark ? 'bg-slate-700/60 border-slate-600 text-white placeholder-slate-400' : 'bg-gray-100 border-gray-300 text-gray-800 placeholder-gray-400';
  const tab = (active) => active
    ? 'bg-indigo-600 text-white shadow-lg'
    : isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-800';

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-300 ${bg}`}>

      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-emerald-500 mb-4 shadow-2xl">
          <Home size={36} className="text-white" />
        </div>
        <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-emerald-400">
          GateKeeper
        </h1>
        <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
          Smart Resident Management System
        </p>
      </div>

      <div className={`w-full max-w-sm border rounded-3xl p-6 shadow-2xl backdrop-blur-md ${card}`}>
        {mode === 'pending' ? (
          <div className="text-center py-8">
            <Clock size={56} className="mx-auto text-yellow-400 mb-4" />
            <h2 className="text-xl font-bold mb-2">Request Sent!</h2>
            <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              Your registration is pending manager approval. You will be able to login once your account is activated.
            </p>
            <button onClick={() => setMode('login')} className="mt-6 text-indigo-400 underline text-sm font-semibold">
              Back to Login
            </button>
          </div>
        ) : (
          <>
            <div className={`flex rounded-2xl p-1 mb-6 ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}>
              <button onClick={() => { setMode('login'); setError(''); }}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${tab(mode === 'login')}`}>
                <LogIn size={14} className="inline mr-1" /> Login
              </button>
              <button onClick={() => { setMode('register'); setError(''); }}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${tab(mode === 'register')}`}>
                <UserPlus size={14} className="inline mr-1" /> Register
              </button>
            </div>

            {mode === 'register' && (
              <>
                <div className="mb-4">
                  <label className={`text-xs font-semibold mb-1 block ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Society PIN</label>
                  <div className={`flex items-center gap-2 border rounded-xl px-3 py-2.5 ${input} ${form.society_id ? 'border-emerald-500' : ''}`}>
                    <Key size={16} className={form.society_id ? 'text-emerald-400' : isDark ? 'text-slate-400' : 'text-gray-400'} />
                    <input name="society_pin" value={form.society_pin} onChange={handlePinChange} placeholder="e.g. GVA123"
                      maxLength={10} className="bg-transparent flex-1 outline-none text-sm uppercase" />
                    {verifyingPin && <Loader2 size={14} className="animate-spin text-indigo-400" />}
                  </div>
                  {form.society_name && (
                    <p className="text-xs text-emerald-500 font-medium mt-1">✓ {form.society_name}</p>
                  )}
                </div>

                <div className="mb-4">
                  <label className={`text-xs font-semibold mb-1 block ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Full Name</label>
                  <div className={`flex items-center gap-2 border rounded-xl px-3 py-2.5 ${input}`}>
                    <User size={16} className={isDark ? 'text-slate-400' : 'text-gray-400'} />
                    <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Rahul Sharma"
                      className="bg-transparent flex-1 outline-none text-sm" />
                  </div>
                </div>
              </>
            )}

            <div className="mb-4">
              <label className={`text-xs font-semibold mb-1 block ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Mobile Number</label>
              <div className={`flex items-center gap-2 border rounded-xl px-3 py-2.5 ${input}`}>
                <Phone size={16} className={isDark ? 'text-slate-400' : 'text-gray-400'} />
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="9876543210" type="tel"
                  className="bg-transparent flex-1 outline-none text-sm" />
              </div>
            </div>

            {mode === 'register' && (
              <div className="mb-4">
                <label className={`text-xs font-semibold mb-1 block ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Flat Number</label>
                <div className={`flex items-center gap-2 border rounded-xl px-3 py-2.5 ${input}`}>
                  <Home size={16} className={isDark ? 'text-slate-400' : 'text-gray-400'} />
                  <input name="flat_number" value={form.flat_number} onChange={handleChange} placeholder="e.g. A-402"
                    className="bg-transparent flex-1 outline-none text-sm" />
                </div>
              </div>
            )}

            <div className="mb-6">
              <label className={`text-xs font-semibold mb-1 block ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                {mode === 'login' ? 'Password / OTP' : 'Create Password'}
              </label>
              <div className={`flex items-center gap-2 border rounded-xl px-3 py-2.5 ${input}`}>
                <CheckCircle size={16} className={isDark ? 'text-slate-400' : 'text-gray-400'} />
                <input name="password" value={form.password} onChange={handleChange} placeholder={mode === 'login' ? 'OTP or Password' : 'Min. 6 chars'}
                  type={showPassword ? 'text' : 'password'} className="bg-transparent flex-1 outline-none text-sm" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className={`p-1 hover:bg-slate-500/10 rounded-lg transition-colors ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 text-sm font-medium">
                {error}
              </div>
            )}

            <button
              onClick={mode === 'login' ? handleLogin : handleRegister}
              disabled={loading}
              className="w-full py-3 rounded-2xl font-bold text-white bg-gradient-to-r from-indigo-500 to-emerald-500 hover:opacity-90 transition-all active:scale-95 shadow-lg disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : mode === 'login' ? 'Login' : 'Register'}
            </button>
          </>
        )}
      </div>
      <p className={`mt-6 text-xs font-medium ${isDark ? 'text-slate-600' : 'text-gray-400'}`}>
        GateKeeper v1.0 &bull; Secure Society Management
      </p>
    </div>
  );
};

export default LoginPage;
