import React, { useState, useEffect, useRef } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import LoginPage from './components/LoginPage';
import ResidentDashboard from './components/ResidentDashboard';
import GuardScanning from './components/GuardScanning';
import TechnicianView from './components/TechnicianView';
import ManagerDashboard from './components/ManagerDashboard';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import NotificationManager from './components/NotificationManager';
import api from './services/api';
import { AlertTriangle } from 'lucide-react';

// ─── Role → Component Map ────────────────────────────────────────────────────
const ROLE_VIEWS = {
  super_admin: SuperAdminDashboard,
  manager: ManagerDashboard,
  guard: GuardScanning,
  technician: TechnicianView,
  resident_primary: ResidentDashboard,
  resident_family: ResidentDashboard,
};

// ─── For DEV TESTING ─────────────────────────────────────────────────────────
const DEV_TEST_USERS = [
  { id: 1, name: 'Super Admin', role: 'super_admin', flat_number: null, phone: '9999999999', password: '1234' },
  { id: 2, name: 'Vikram Manager', role: 'manager', flat_number: null, phone: '8888888888', password: '1234' },
  { id: 3, name: 'Suresh Guard', role: 'guard', flat_number: null, phone: '7777777777', password: '1234' },
  { id: 4, name: 'Mahesh Technician', role: 'technician', flat_number: null, phone: '6666666666', password: '1234' },
  { id: 5, name: 'Rahul Sharma', role: 'resident_primary', flat_number: 'A-402', phone: '9876543210', password: '1234' },
];

function DevRoleSwitcher({ onSwitch }) {
  const { isDark } = useTheme();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDevLogin = async (u) => {
    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', { phone: u.phone, password: u.password });
      onSwitch(res.data.user, res.data.token);
      setOpen(false);
    } catch (err) {
      alert('Dev Login Failed: Make sure your local backend is running and dummy data is inserted.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <button onClick={() => setOpen(!open)} disabled={loading}
        className="bg-purple-700 text-white text-xs px-3 py-2 rounded-xl font-bold shadow-xl border border-purple-500 flex items-center gap-2">
        {loading ? <div className="w-3 h-3 border-2 border-white border-t-transparent animate-spin rounded-full" /> : '🧪 Dev Login'}
      </button>
      {open && (
        <div className={`absolute bottom-10 left-0 border rounded-2xl p-3 shadow-2xl w-52 space-y-1
          ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <p className="text-xs font-bold text-purple-400 mb-2">Role Select Karein:</p>
          {DEV_TEST_USERS.map(u => (
            <button key={u.id} onClick={() => handleDevLogin(u)}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all
                ${isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-gray-100 text-gray-700'}`}>
              {u.role === 'super_admin' ? '🌐' : u.role === 'manager' ? '📋' : u.role === 'guard' ? '🛡️' : u.role === 'technician' ? '🔧' : '🏠'}{' '}
              {u.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main App Content ────────────────────────────────────────────────────────
function AppContent() {
  const [user, setUser] = useState(null);
  const [globalSOS, setGlobalSOS] = useState(null);
  // ✅ Fixed: Single shared socketRef passed down to components
  const sharedSocketRef = useRef(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { localStorage.clear(); }
    }
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem('user', JSON.stringify(userData));
    if (token) localStorage.setItem('token', token);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
  };

  if (!user) {
    return (
      <>
        <LoginPage onLoginSuccess={handleLogin} />
        <DevRoleSwitcher onSwitch={handleLogin} />
      </>
    );
  }

  const ViewComponent = ROLE_VIEWS[user.role];

  if (!ViewComponent) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center justify-center p-8 text-center">
        <p className="text-slate-400">Unknown role: <span className="text-white font-bold">{user.role}</span></p>
        <button onClick={handleLogout} className="mt-4 px-6 py-2 bg-red-500/20 border border-red-500/40 text-red-400 rounded-xl font-semibold">
          Logout
        </button>
      </div>
    );
  }

  return (
    <>
      {/* ✅ Fixed: Single NotificationManager with shared socket ref */}
      <NotificationManager user={user} onSOS={(data) => setGlobalSOS(data)} socketRef={sharedSocketRef} />

      {/* Global SOS Alert Modal — shows for Manager & Guard */}
      {globalSOS && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-red-600/20 backdrop-blur-md p-4">
          <div className="w-full max-w-sm bg-slate-900 border-4 border-red-500 rounded-3xl p-6 shadow-[0_0_50px_rgba(239,68,68,0.5)] animate-pulse">
            <div className="text-center">
              <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={40} className="text-white" />
              </div>
              <h2 className="text-2xl font-black text-red-400 mb-2 uppercase tracking-tighter">🚨 EMERGENCY SOS 🚨</h2>
              <div className="py-4 border-y border-red-900/50 mb-4">
                <p className="text-lg font-bold text-white">Flat: <span className="text-3xl text-red-400">{globalSOS.flat_number}</span></p>
                <p className="text-sm font-semibold text-slate-300 mt-1">{globalSOS.user_name}</p>
                <p className="text-xs text-slate-400 mt-1">{globalSOS.message}</p>
              </div>
              <button onClick={() => setGlobalSOS(null)}
                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-lg shadow-lg active:scale-95 transition-all">
                I AM ON IT! ✅
              </button>
            </div>
          </div>
        </div>
      )}

      <ViewComponent user={user} onLogout={handleLogout} sharedSocket={sharedSocketRef.current} />
      <DevRoleSwitcher onSwitch={handleLogin} />
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
