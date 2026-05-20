import React, { useState, useEffect, useRef } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import LoginPage from './components/LoginPage';
import ResidentDashboard from './components/ResidentDashboard';
import GuardScanning from './components/GuardScanning';
import TechnicianView from './components/TechnicianView';
import ManagerDashboard from './components/ManagerDashboard';
import AdminDashboard from './components/AdminDashboard';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import NotificationManager from './components/NotificationManager';
import api from './services/api';
import { AlertTriangle } from 'lucide-react';
import ThemeToggle from './components/ThemeToggle';

// ─── Role → Component Map ────────────────────────────────────────────────────
const ROLE_VIEWS = {
  super_admin: SuperAdminDashboard,
  admin: AdminDashboard,
  manager: ManagerDashboard,
  guard: GuardScanning,
  technician: TechnicianView,
  resident_primary: ResidentDashboard,
  resident_family: ResidentDashboard,
};

// ─── Main App Content ────────────────────────────────────────────────────────
function AppContent() {
  const [user, setUser] = useState(null);
  const [globalSOS, setGlobalSOS] = useState(null);
  // ✅ Fixed: Single shared socket state to trigger re-renders on connection
  const [sharedSocket, setSharedSocket] = useState(null);

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
      <LoginPage onLoginSuccess={handleLogin} />
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
      {/* ✅ Fixed: Single NotificationManager with shared socket state */}
      <NotificationManager user={user} onSOS={(data) => setGlobalSOS(data)} setSocket={setSharedSocket} />

      {/* Global SOS Alert Modal — shows for Manager & Guard */}
      {globalSOS && (
        <div className="fixed inset-0 flex items-center justify-center bg-red-600/20 backdrop-blur-md p-4" style={{ zIndex: 9999 }}>
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

      <ViewComponent user={user} onLogout={handleLogout} sharedSocket={sharedSocket} />
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
      <ThemeToggle />
    </ThemeProvider>
  );
}

export default App;
