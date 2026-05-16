import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { AlertTriangle, Bell, X, Megaphone } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const SOUNDS = {
  ring: 'https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3',
  tone: 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3',
  sos:  'https://assets.mixkit.co/active_storage/sfx/951/951-preview.mp3',
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

  const addToast = (type, title, message) => {
    const id = Date.now();
    setToasts(prev => [...prev.slice(-4), { id, type, title, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 6000);
  };

  const dismissToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const playSound = (type) => {
    try {
      audioRef.current.src = SOUNDS[type];
      audioRef.current.play().catch(e => console.warn('Audio play failed:', e));
    } catch (err) {
      console.error('Sound error:', err);
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
      playSound('tone');
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
      playSound('tone');
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
    </>
  );
};

export default NotificationManager;
