import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { AlertTriangle, Bell, X, Megaphone } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://yellowgreen-goldfish-813322.hostingersite.com';

const SOUNDS = {
  ring: 'https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3',      // manager registration chime
  message: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',   // Notice SMS ping
  sos:  'https://assets.mixkit.co/active_storage/sfx/951/951-preview.mp3',         // SOS Emergency Siren
  calling: 'https://assets.mixkit.co/active_storage/sfx/2042/2042-preview.mp3',  // Telephone ringtone
};

// Toast notification component
const Toast = ({ toasts, onDismiss }) => (
  <div className="fixed top-4 right-4 z-[200] space-y-2 max-w-xs w-full pointer-events-none">
    {toasts.map((t) => (
      <div key={t.id}
        className={`flex items-start gap-3 p-3 rounded-2xl border shadow-2xl pointer-events-auto animate-slide-in
          ${t.type === 'sos' ? 'bg-red-900 border-red-500 text-white' :
            t.type === 'approval' ? 'bg-indigo-900 border-indigo-500 text-white' :
            t.type === 'announcement' ? 'bg-slate-800 border-yellow-500 text-white' :
            'bg-slate-800 border-emerald-500 text-white'}`}>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0
          ${t.type === 'sos' ? 'bg-red-500' : t.type === 'approval' ? 'bg-indigo-500' : t.type === 'announcement' ? 'bg-yellow-500' : 'bg-emerald-500'}`}>
          {t.type === 'sos' ? <AlertTriangle size={16} className="text-white" /> :
           t.type === 'announcement' ? <Megaphone size={16} className="text-white" /> :
           <Bell size={16} className="text-white" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-xs">{t.title}</p>
          <p className="text-xs opacity-80 mt-0.5 line-clamp-2">{t.message}</p>
        </div>
        <button onClick={() => onDismiss(t.id)} className="text-white/60 hover:text-white shrink-0">
          <X size={14} />
        </button>
      </div>
    ))}
  </div>
);

const NotificationManager = ({ user, onSOS, socketRef: externalSocketRef }) => {
  const internalSocketRef = useRef(null);
  const audioRef = useRef(new Audio());
  const [toasts, setToasts] = useState([]);
  const [activeCall, setActiveCall] = useState(null);

  const addToast = (type, title, message) => {
    const id = Date.now();
    setToasts(prev => [...prev.slice(-4), { id, type, title, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 6000);
  };

  const dismissToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const playSound = (type, loop = false) => {
    try {
      audioRef.current.src = SOUNDS[type];
      audioRef.current.loop = loop;
      audioRef.current.play().catch(e => console.warn('Audio play failed:', e));
    } catch (err) {
      console.error('Sound error:', err);
    }
  };

  const stopSound = () => {
    try {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    } catch (err) {
      console.error('Sound stop error:', err);
    }
  };

  useEffect(() => {
    if (!user) return;

    const socket = io(API_URL, { transports: ['polling', 'websocket'] });
    internalSocketRef.current = socket;

    // If parent wants access to this socket
    if (externalSocketRef) externalSocketRef.current = socket;

    // ── Join rooms based on role ──
    if (user.role === 'manager' || user.role === 'super_admin') {
      socket.emit('join_room', { room: 'manager_room' });
    }
    if (user.role === 'guard') {
      socket.emit('join_room', { room: 'guard_room' });
    }
    if (user.flat_number) {
      socket.emit('join_room', { room: `flat_${user.flat_number}` });
    }

    // ── Event Listeners ──

    // 1. New Resident Registration (Manager/Admin)
    socket.on('new_approval_request', (data) => {
      playSound('ring');
      addToast('approval', '🔔 Naya Registration!', `${data.name} — Flat ${data.flat_number} — Approval pending`);
    });

    // 2. SOS Alert (Guard + Manager)
    socket.on('sos_alert', (data) => {
      playSound('sos');
      addToast('sos', '🚨 EMERGENCY SOS!', data.message);
      if (onSOS) onSOS(data);
    });

    // 3. Visitor Arrival (Resident)
    socket.on('visitor_notification', (data) => {
      // Trigger full screen gate calling modal and ringtone
      setActiveCall(data);
      playSound('calling', true);
      addToast('visitor', '🚪 Visitor Aaya!', `${data.name} — ${data.purpose}`);
    });

    // 4. Account Status Update (Resident)
    socket.on('account_status_update', (data) => {
      addToast(data.status === 'active' ? 'success' : 'sos',
        data.status === 'active' ? '✅ Account Approved!' : '❌ Registration Rejected',
        data.message
      );
    });

    // 5. New Announcement (All users)
    socket.on('new_announcement', (data) => {
      playSound('message');
      addToast('announcement', `📢 ${data.category || 'Notice'}`, data.title);
    });

    // 6. Visitor decision result (Guard)
    socket.on('visitor_decision_result', (data) => {
      addToast(data.approved ? 'success' : 'sos',
        data.approved ? '✅ Entry Approved' : '❌ Entry Denied',
        `Flat ${data.flat_number} — ${data.visitor_name}`
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  return (
    <>
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* 📞 INCOMING VISITOR GATE CALL MODAL */}
      {activeCall && (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl shadow-indigo-500/20 animate-in zoom-in duration-300">
            {/* Phone Pulse Icon */}
            <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-indigo-500/10 animate-ping" />
              <div className="absolute inset-2 rounded-full bg-indigo-500/20 animate-pulse" />
              <div className="w-14 h-14 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-lg">
                <Bell size={28} className="animate-bounce" />
              </div>
            </div>

            <h2 className="text-xl font-extrabold text-white mb-1">Incoming Gate Call</h2>
            <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest mb-4">Guard Verification Request</p>

            <div className="bg-slate-800/80 border border-slate-700/50 rounded-2xl p-4 mb-6 space-y-2 text-left">
              <p className="text-xs flex justify-between"><span className="text-slate-400">Visitor:</span> <strong className="font-bold text-slate-100">{activeCall.name}</strong></p>
              <p className="text-xs flex justify-between"><span className="text-slate-400">Phone:</span> <strong className="font-bold text-slate-100">{activeCall.phone || 'Not provided'}</strong></p>
              <p className="text-xs flex justify-between"><span className="text-slate-400">Purpose:</span> <strong className="font-bold text-slate-100">{activeCall.purpose}</strong></p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  stopSound();
                  const socket = internalSocketRef.current;
                  if (socket) {
                    socket.emit('visitor_decision', { approved: false, flat_number: user.flat_number, visitor_name: activeCall.name });
                  }
                  setActiveCall(null);
                }}
                className="py-3 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-extrabold text-sm rounded-xl transition-all shadow-lg shadow-red-950/20 animate-in fade-in"
              >
                Deny Entry ❌
              </button>
              <button
                onClick={() => {
                  stopSound();
                  const socket = internalSocketRef.current;
                  if (socket) {
                    socket.emit('visitor_decision', { approved: true, flat_number: user.flat_number, visitor_name: activeCall.name });
                  }
                  setActiveCall(null);
                }}
                className="py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-sm rounded-xl transition-all shadow-lg shadow-emerald-950/20 animate-in fade-in"
              >
                Approve Entry ✅
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NotificationManager;
