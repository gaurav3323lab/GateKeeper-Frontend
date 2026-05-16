import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from './ThemeToggle';
import ISTClock from './ISTClock';
import MyFlat from './MyFlat';
import ResidentGarage from './ResidentGarage';
import ServiceRequest from './ServiceRequest';
import PreApprove from './PreApprove';
import UserProfile from './UserProfile';
import AnnouncementBoard from './AnnouncementBoard';
import { entryAPI } from '../services/api';
import { Home, Car, Wrench, CheckCircle, LogOut, Shield, AlertTriangle, User, Megaphone } from 'lucide-react';

const NAV_ITEMS = [
  { key: 'flat', label: 'My Flat', icon: Home },
  { key: 'garage', label: 'Garage', icon: Car },
  { key: 'service', label: 'Service', icon: Wrench },
  { key: 'preapprove', label: 'Pre-Approve', icon: CheckCircle },
  { key: 'notices', label: 'Notices', icon: Megaphone },
];

const ResidentDashboard = ({ user, onLogout, sharedSocket }) => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('flat');
  const [sosActive, setSosActive] = useState(false);
  const [visitorAlert, setVisitorAlert] = useState(null);
  const [showProfile, setShowProfile] = useState(false);

  // ✅ Fixed: use the shared socket from NotificationManager instead of creating a new one
  useEffect(() => {
    if (!sharedSocket) return;

    sharedSocket.on('visitor_notification', (data) => {
      setVisitorAlert(data);
    });

    return () => {
      sharedSocket.off('visitor_notification');
    };
  }, [sharedSocket]);

  const handleSOS = async () => {
    if (sosActive) return;
    setSosActive(true);

    try {
      // 1. Log to DB + emit socket via backend
      await entryAPI.sos({
        user_id: user.id,
        flat_number: user.flat_number,
        user_name: user.name
      });

      // 2. Also emit directly from client for instant delivery
      if (sharedSocket) {
        sharedSocket.emit('trigger_sos', {
          user_id: user.id,
          user_name: user.name,
          flat_number: user.flat_number
        });
      }

      alert(`🚨 SOS Alert sent! Guard aur Manager ko turant notification gayi — Flat ${user.flat_number}`);
    } catch (err) {
      console.error('SOS failed:', err);
      // Even if DB fails, try socket emit so guard gets notified
      if (sharedSocket) {
        sharedSocket.emit('trigger_sos', {
          user_id: user.id,
          user_name: user.name,
          flat_number: user.flat_number
        });
      }
      alert('SOS bheja gaya! Guard ko notification mil gayi.');
    } finally {
      setTimeout(() => setSosActive(false), 5000);
    }
  };

  const handleVisitorApprove = () => {
    if (sharedSocket) {
      sharedSocket.emit('visitor_decision', {
        approved: true,
        flat_number: user.flat_number,
        visitor_name: visitorAlert?.name
      });
    }
    setVisitorAlert(null);
  };

  const handleVisitorDeny = () => {
    if (sharedSocket) {
      sharedSocket.emit('visitor_decision', {
        approved: false,
        flat_number: user.flat_number,
        visitor_name: visitorAlert?.name
      });
    }
    setVisitorAlert(null);
  };

  const bg = isDark ? 'bg-[#0f172a] text-white' : 'bg-gray-50 text-gray-800';
  const bottomNav = isDark ? 'bg-slate-900/90 border-slate-700' : 'bg-white border-gray-200';
  const subtext = isDark ? 'text-slate-400' : 'text-gray-500';

  const renderContent = () => {
    switch (activeTab) {
      case 'flat': return <MyFlat user={user} />;
      case 'garage': return <ResidentGarage />;
      case 'service': return <ServiceRequest user={user} />;
      case 'preapprove': return <PreApprove user={user} />;
      case 'notices': return <AnnouncementBoard user={user} />;
      default: return null;
    }
  };

  return (
    <div className={`min-h-screen pb-24 transition-colors duration-300 ${bg}`}>
      {/* Incoming Visitor Alert Popup */}
      {visitorAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className={`w-full max-w-sm rounded-3xl p-6 border shadow-2xl ${isDark ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-200'}`}>
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertTriangle size={30} className="text-orange-400" />
              </div>
              <h2 className="text-lg font-extrabold">Visitor Aaya Hai!</h2>
              <p className={`text-sm mt-1 ${subtext}`}>Gate par {visitorAlert.guard || 'Guard'} ne entry darj ki hai</p>
            </div>
            <div className={`p-4 rounded-2xl mb-4 ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}>
              <p className="font-bold">{visitorAlert.name}</p>
              <p className={`text-sm ${subtext}`}>Purpose: {visitorAlert.purpose}</p>
              {visitorAlert.phone && <p className={`text-xs ${subtext}`}>📞 {visitorAlert.phone}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={handleVisitorDeny}
                className="py-3 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-400 font-bold text-sm">
                ❌ Deny
              </button>
              <button onClick={handleVisitorApprove}
                className="py-3 rounded-2xl bg-emerald-600 text-white font-bold text-sm">
                ✅ Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Header */}
      <header className={`sticky top-0 z-40 px-4 py-3 border-b flex items-center justify-between backdrop-blur-md
        ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-gray-200'}`}>
        <div>
          <p className={`text-xs ${subtext}`}>Namaste 👋</p>
          <h1 className="font-extrabold text-base leading-tight">{user?.name || 'Resident'}</h1>
          <p className={`text-xs ${subtext}`}>Flat <span className="text-indigo-400 font-bold">{user?.flat_number || 'A-101'}</span></p>
          <ISTClock className={subtext} />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowProfile(true)} className={`p-2 rounded-xl border ${isDark ? 'border-slate-700 text-slate-400 hover:text-indigo-400' : 'border-gray-200 text-gray-400 hover:text-indigo-500'}`}>
            <User size={16} />
          </button>
          <ThemeToggle />
          <button onClick={onLogout}
            className={`p-2 rounded-xl border ${isDark ? 'border-slate-700 text-slate-400 hover:text-red-400' : 'border-gray-200 text-gray-400 hover:text-red-400'}`}>
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4">
        {renderContent()}
      </main>

      {/* SOS Emergency Button */}
      <div className="fixed bottom-24 right-4 z-40">
        <button
          onClick={handleSOS}
          disabled={sosActive}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl font-bold text-white transition-all
            ${sosActive
              ? 'bg-red-600 animate-pulse scale-110 cursor-not-allowed'
              : 'bg-red-500 hover:bg-red-600 active:scale-95'
            }`}
          title="Emergency SOS — Click for help"
        >
          <Shield size={22} />
        </button>
        <p className="text-center text-xs text-red-400 mt-1 font-bold">SOS</p>
      </div>

      {/* Bottom Navigation */}
      <nav className={`fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-md ${bottomNav}`}>
        <div className="flex max-w-md mx-auto">
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
            const active = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex-1 py-3 flex flex-col items-center gap-0.5 transition-all ${
                  active
                    ? 'text-indigo-400'
                    : isDark ? 'text-slate-500 hover:text-slate-300' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
                <span className="text-[10px] font-semibold">{label}</span>
                {active && <div className="w-4 h-0.5 bg-indigo-400 rounded-full" />}
              </button>
            );
          })}
        </div>
      </nav>

      <UserProfile isOpen={showProfile} onClose={() => setShowProfile(false)} />
    </div>
  );
};

export default ResidentDashboard;
