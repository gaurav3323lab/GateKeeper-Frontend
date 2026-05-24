import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Phone, User, Home, LogIn, UserPlus, CheckCircle, Clock, Loader2, Key, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { authAPI, societyAPI } from '../services/api';

const LoginPage = ({ onLoginSuccess }) => {
  const { isDark } = useTheme();
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'pending'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', password: '', tower: '', flat_number: '', society_pin: '', society_id: null, society_name: '' });
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
    if (!form.name || !form.phone || !form.password || !form.tower || !form.flat_number || !form.society_id) {
      return setError('All fields, including Tower, Flat Number, and valid Society PIN, are required.');
    }
    setLoading(true);
    try {
      await authAPI.register({
        name: form.name,
        phone: form.phone,
        password: form.password,
        tower: form.tower,
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

  // Redesign Variables
  const mainBg = isDark ? 'bg-mesh-dark text-white' : 'bg-mesh-light text-slate-800';
  const cardStyle = isDark 
    ? 'bg-slate-900/65 backdrop-blur-2xl border border-slate-800/80 shadow-[0_20px_50px_rgba(0,0,0,0.3)]' 
    : 'bg-white/75 backdrop-blur-2xl border border-white/60 shadow-[0_20px_50px_rgba(31,38,135,0.06)]';

  const inputContainer = isDark
    ? 'bg-slate-950/40 border-slate-800/80 focus-within:border-indigo-500/80 focus-within:shadow-[0_0_15px_rgba(99,102,241,0.15)]'
    : 'bg-white/60 border-slate-200 focus-within:border-indigo-600/80 focus-within:shadow-[0_0_15px_rgba(99,102,241,0.08)]';
  
  const textLabel = isDark ? 'text-slate-400' : 'text-slate-500';
  
  const tabActive = 'bg-indigo-600 text-white shadow-[0_4px_12px_rgba(79,70,229,0.35)] scale-[1.02]';
  const tabInactive = isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800/30' : 'text-slate-500 hover:text-slate-800 hover:bg-white/40';

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden transition-all duration-500 ${mainBg}`}>
      
      {/* Dynamic Background Visual Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none animate-bounce-slow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/80 blur-[140px] opacity-10 dark:opacity-[0.06] pointer-events-none" style={{ animation: 'bounce-slow 4s ease-in-out infinite' }} />

      {/* Brand Header */}
      <div className="mb-8 text-center z-10 animate-scale-up">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-[28px] bg-gradient-to-tr from-indigo-500 via-indigo-600 to-emerald-500 p-[2px] mb-4 shadow-[0_12px_30px_rgba(99,102,241,0.25)] hover:scale-105 transition-transform duration-300">
          <div className="w-full h-full rounded-[26px] bg-slate-950 flex items-center justify-center">
            <Home size={34} className="text-indigo-400" />
          </div>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-teal-400 to-emerald-400 drop-shadow-sm">
          GateKeeper
        </h1>
        <p className={`text-xs uppercase tracking-widest font-semibold mt-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          Smart Community Security Hub
        </p>
      </div>

      {/* Glassmorphism Credentials Container */}
      <div className={`w-full max-w-sm rounded-[32px] p-8 backdrop-blur-2xl transition-all duration-300 transform hover:shadow-[0_25px_60px_rgba(0,0,0,0.15)] z-10 ${cardStyle} animate-slide-up`}>
        
        {mode === 'pending' ? (
          <div className="text-center py-6 animate-scale-up">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full bg-amber-500/10 animate-ping" />
              <div className="relative w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                <Clock size={28} />
              </div>
            </div>
            <h2 className="text-xl font-bold tracking-tight mb-2">Verification Pending</h2>
            <p className={`text-xs leading-relaxed px-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Your registration request has been successfully submitted to your Society Manager. You will be able to log in once your flat profile is verified.
            </p>
            <button 
              onClick={() => setMode('login')} 
              className="mt-6 w-full py-3 border border-indigo-500/20 hover:border-indigo-500/40 text-indigo-400 dark:bg-slate-900/40 bg-slate-50 rounded-2xl text-xs font-bold transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              Back to Login
            </button>
          </div>
        ) : (
          <>
            {/* Mode Selector Tabs */}
            <div className={`flex rounded-2xl p-1 mb-6 border transition-all ${isDark ? 'bg-slate-950/80 border-slate-800/80' : 'bg-slate-100/80 border-slate-200'}`}>
              <button 
                onClick={() => { setMode('login'); setError(''); }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-300 ${mode === 'login' ? tabActive : tabInactive}`}
              >
                <LogIn size={13} strokeWidth={2.5} /> Login
              </button>
              <button 
                onClick={() => { setMode('register'); setError(''); }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-300 ${mode === 'register' ? tabActive : tabInactive}`}
              >
                <UserPlus size={13} strokeWidth={2.5} /> Register
              </button>
            </div>

            {/* Inputs Container */}
            <div className="space-y-4">
              
              {/* Registration Only Fields */}
              {mode === 'register' && (
                <div className="animate-scale-up space-y-4">
                  <div>
                    <label className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 block ${textLabel}`}>Society PIN</label>
                    <div className={`flex items-center gap-2.5 border rounded-2xl px-4 py-3.5 transition-all duration-300 ${inputContainer} ${form.society_id ? 'border-emerald-500/60 dark:bg-emerald-500/5' : ''}`}>
                      <Key size={15} className={form.society_id ? 'text-emerald-400' : isDark ? 'text-slate-400' : 'text-slate-400'} />
                      <input 
                        name="society_pin" 
                        value={form.society_pin} 
                        onChange={handlePinChange} 
                        placeholder="E.G. GVA123"
                        maxLength={10} 
                        className="bg-transparent flex-1 outline-none text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-white" 
                      />
                      {verifyingPin && <Loader2 size={13} className="animate-spin text-indigo-400" />}
                    </div>
                    {form.society_name && (
                      <p className="text-[10px] text-emerald-500 dark:text-emerald-400 font-bold mt-1.5 flex items-center gap-1">
                        <CheckCircle size={10} /> Verified: {form.society_name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 block ${textLabel}`}>Full Name</label>
                    <div className={`flex items-center gap-2.5 border rounded-2xl px-4 py-3.5 transition-all duration-300 ${inputContainer}`}>
                      <User size={15} className={isDark ? 'text-slate-400' : 'text-slate-400'} />
                      <input 
                        name="name" 
                        value={form.name} 
                        onChange={handleChange} 
                        placeholder="Rahul Sharma"
                        className="bg-transparent flex-1 outline-none text-xs font-semibold text-slate-800 dark:text-white" 
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Universal Phone Input */}
              <div>
                <label className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 block ${textLabel}`}>Mobile Number</label>
                <div className={`flex items-center gap-2.5 border rounded-2xl px-4 py-3.5 transition-all duration-300 ${inputContainer}`}>
                  <Phone size={15} className={isDark ? 'text-slate-400' : 'text-slate-400'} />
                  <input 
                    name="phone" 
                    value={form.phone} 
                    onChange={handleChange} 
                    placeholder="9876543210" 
                    type="tel"
                    className="bg-transparent flex-1 outline-none text-xs font-semibold text-slate-800 dark:text-white" 
                  />
                </div>
              </div>

              {/* Registration Tower & Flat Field */}
              {mode === 'register' && (
                <div className="grid grid-cols-2 gap-3.5 animate-scale-up">
                  <div>
                    <label className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 block ${textLabel}`}>Tower / Block</label>
                    <div className={`flex items-center gap-2 border rounded-2xl px-3.5 py-3.5 transition-all duration-300 ${inputContainer}`}>
                      <Home size={14} className="text-slate-400" />
                      <input 
                        name="tower" 
                        value={form.tower} 
                        onChange={handleChange} 
                        placeholder="e.g. Tower A"
                        className="bg-transparent flex-1 outline-none text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-white" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 block ${textLabel}`}>Flat Number</label>
                    <div className={`flex items-center gap-2 border rounded-2xl px-3.5 py-3.5 transition-all duration-300 ${inputContainer}`}>
                      <Home size={14} className="text-slate-400" />
                      <input 
                        name="flat_number" 
                        value={form.flat_number} 
                        onChange={handleChange} 
                        placeholder="e.g. 102"
                        className="bg-transparent flex-1 outline-none text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-white" 
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Universal Password Input */}
              <div>
                <label className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 block ${textLabel}`}>
                  {mode === 'login' ? 'Password / OTP' : 'Create Password'}
                </label>
                <div className={`flex items-center gap-2.5 border rounded-2xl px-4 py-3.5 transition-all duration-300 ${inputContainer}`}>
                  <CheckCircle size={15} className={isDark ? 'text-slate-400' : 'text-slate-400'} />
                  <input 
                    name="password" 
                    value={form.password} 
                    onChange={handleChange} 
                    placeholder={mode === 'login' ? 'OTP or Password' : 'Min. 6 characters'}
                    type={showPassword ? 'text' : 'password'} 
                    className="bg-transparent flex-1 outline-none text-xs font-semibold text-slate-800 dark:text-white" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className={`p-1 hover:bg-slate-500/10 rounded-lg transition-colors ${isDark ? 'text-slate-400' : 'text-slate-400'}`}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Error Message Box */}
            {error && (
              <div className="mt-4 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/35 text-red-400 text-xs font-medium flex items-start gap-2.5 animate-scale-up">
                <ShieldAlert size={14} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={mode === 'login' ? handleLogin : handleRegister}
              disabled={loading}
              className="w-full mt-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider text-white bg-gradient-to-r from-indigo-500 via-indigo-600 to-emerald-500 hover:opacity-[0.95] active:scale-[0.98] transition-all shadow-[0_8px_25px_rgba(99,102,241,0.25)] hover:shadow-[0_12px_30px_rgba(99,102,241,0.35)] disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  {mode === 'login' ? <LogIn size={14} strokeWidth={2.5} /> : <UserPlus size={14} strokeWidth={2.5} />}
                  <span>{mode === 'login' ? 'Login Securely' : 'Request Access'}</span>
                </>
              )}
            </button>
          </>
        )}
      </div>

      {/* Footer Branding */}
      <p className={`mt-8 text-[10px] uppercase font-bold tracking-widest z-10 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
        GateKeeper Shield Security &bull; v2.0
      </p>
    </div>
  );
};

export default LoginPage;
