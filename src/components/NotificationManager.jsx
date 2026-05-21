import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { AlertTriangle, Bell, X, Check, Megaphone, BellOff, BellRing } from 'lucide-react';
import {
  registerServiceWorker,
  subscribeToPush,
  unsubscribeFromPush,
  getNotificationPermission,
} from '../services/pushService';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

const API_URL = import.meta.env.VITE_API_URL || 'https://yellowgreen-goldfish-813322.hostingersite.com';

const SOUNDS = {
  ring:    'https://assets.mixkit.co/active_storage/sfx/2867/2867-preview.mp3', // soft notification chime
  message: 'https://assets.mixkit.co/active_storage/sfx/2356/2356-preview.mp3', // light pop
  sos:     'https://assets.mixkit.co/active_storage/sfx/1128/1128-preview.mp3',  // urgent alert
  calling: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3', // pleasant doorbell
};

// ── Toast Component ──────────────────────────────────────────
const Toast = ({ toasts, onDismiss }) => (
  <div className="fixed top-4 right-4 space-y-2 max-w-xs w-full pointer-events-none" style={{ zIndex: 9999 }}>
    {toasts.map((t) => (
      <div key={t.id}
        className={`flex items-start gap-3 p-3 rounded-2xl border shadow-2xl pointer-events-auto animate-slide-in
          ${t.type === 'sos'          ? 'bg-red-900 border-red-500 text-white' :
            t.type === 'approval'    ? 'bg-indigo-900 border-indigo-500 text-white' :
            t.type === 'announcement'? 'bg-slate-800 border-yellow-500 text-white' :
            'bg-slate-800 border-emerald-500 text-white'}`}>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0
          ${t.type === 'sos' ? 'bg-red-500' : t.type === 'approval' ? 'bg-indigo-500' : t.type === 'announcement' ? 'bg-yellow-500' : 'bg-emerald-500'}`}>
          {t.type === 'sos'          ? <AlertTriangle size={16} className="text-white" /> :
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

// ── Push Permission Modal ────────────────────────────────────
const PushPermissionModal = ({ onAllow, onLater }) => (
  <div className="fixed inset-0 z-[10000] flex items-end justify-center p-4 bg-black/60 backdrop-blur-sm">
    <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
      {/* Icon */}
      <div className="flex justify-center mb-4">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping" />
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <BellRing size={28} className="text-white" />
          </div>
        </div>
      </div>

      <h2 className="text-center text-lg font-extrabold text-white mb-2">
        Notifications Enable Karein
      </h2>
      <p className="text-center text-sm text-slate-400 leading-relaxed mb-6">
        🚨 SOS alerts, 🚪 visitor arrivals, 🚗 vehicle entry/exit aur 📢 society notices — 
        <span className="text-white font-semibold"> tab bhi milenge jab app band ho।</span>
      </p>

      {/* Features list */}
      <div className="space-y-2 mb-6">
        {[
          { emoji: '🚨', text: 'Emergency SOS alerts (Guard + Manager)' },
          { emoji: '🚪', text: 'Visitor gate par aaya (Resident)' },
          { emoji: '🚗', text: 'Gaadi ki entry/exit (Vehicle owner)' },
          { emoji: '📢', text: 'Society announcements aur notices' },
          { emoji: '✅', text: 'Account approval/rejection status' },
        ].map(({ emoji, text }) => (
          <div key={text} className="flex items-center gap-3 text-sm text-slate-300">
            <span className="text-base">{emoji}</span>
            <span>{text}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onLater}
          className="py-3 rounded-2xl border border-slate-600 text-slate-400 font-semibold text-sm hover:bg-slate-800 transition-all"
        >
          <BellOff size={14} className="inline mr-1.5" />
          Baad Mein
        </button>
        <button
          onClick={onAllow}
          className="py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-sm shadow-lg shadow-indigo-500/30 hover:opacity-90 active:scale-95 transition-all"
        >
          <Bell size={14} className="inline mr-1.5" />
          Allow Karein ✓
        </button>
      </div>
    </div>
  </div>
);

// ── Main NotificationManager Component ──────────────────────
const NotificationManager = ({ user, onSOS, setSocket }) => {
  const internalSocketRef = useRef(null);
  const audioRef          = useRef(new Audio());
  const [toasts, setToasts]           = useState([]);
  const [activeCall, setActiveCall]   = useState(null);
  const [showPushModal, setShowPushModal] = useState(false);

  // ── Toast helpers ─────────────────────────────────────────
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
    } catch (err) { console.error('Sound error:', err); }
  };
  const stopSound = () => {
    try {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    } catch (err) { console.error('Sound stop error:', err); }
  };

  const registerNativePush = async () => {
    try {
      let permStatus = await PushNotifications.checkPermissions();
      
      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }
      
      if (permStatus.receive !== 'granted') {
        console.warn('[Push] Native permission denied');
        return;
      }
      
      await PushNotifications.register();
      
      // Register listeners
      await PushNotifications.addListener('registration', async (token) => {
        console.log('[Push] Native registration success, token:', token.value);
        
        // Save fcm_token in the database
        const authToken = localStorage.getItem('token');
        if (!authToken) return;
        
        try {
          const res = await fetch(`${API_URL}/api/push/subscribe`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
              fcm_token: token.value,
              platform: Capacitor.getPlatform() || 'android'
            })
          });
          if (res.ok) {
            console.log('[Push] Native FCM token saved to database successfully');
            localStorage.setItem('push_subscribed', 'true');
          }
        } catch (err) {
          console.error('[Push] FCM save failed:', err.message);
        }
      });
      
      await PushNotifications.addListener('registrationError', (err) => {
        console.error('[Push] Native registration error:', err.error);
      });
      
      await PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('[Push] Foreground notification received:', notification);
        playSound('message');
        addToast('success', notification.title || 'Notification', notification.body || '');
      });
      
      await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        console.log('[Push] Push action performed:', action);
      });
      
    } catch (e) {
      console.error('[Push] Capacitor registration error:', e.message);
    }
  };

  // ── Push Notification Setup ───────────────────────────────
  useEffect(() => {
    if (!user) return;

    // Capacitor Native Mobile Client
    if (Capacitor.isNativePlatform()) {
      registerNativePush();
      return;
    }

    // Standard Web PWA Client
    registerServiceWorker();

    const permission = getNotificationPermission();

    // Already granted — silently re-subscribe if needed, no modal
    if (permission === 'granted') {
      const alreadySubscribed = localStorage.getItem('push_subscribed') === 'true';
      if (!alreadySubscribed) {
        const token = localStorage.getItem('token');
        if (token) subscribeToPush(token);
      }
      return;
    }

    // Denied / unsupported — modal kabhi nahi
    if (permission === 'denied' || permission === 'unsupported') return;

    // permission === 'default' — 5-din cooldown check
    const alreadySubscribed = localStorage.getItem('push_subscribed') === 'true';
    if (alreadySubscribed) return;

    const dismissedAt = localStorage.getItem('push_dismissed_at');
    const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;

    if (dismissedAt) {
      const elapsed = Date.now() - parseInt(dismissedAt, 10);
      if (elapsed < FIVE_DAYS_MS) return; // 5 din nahi bita — mat dikhao
      // 5 din ho gaye — purana dismiss hata do, phir dikhao
      localStorage.removeItem('push_dismissed_at');
    }

    // Modal dikhao 3s delay ke baad
    const timer = setTimeout(() => setShowPushModal(true), 3000);
    return () => clearTimeout(timer);
  }, [user]);

  const handleAllowPush = async () => {
    setShowPushModal(false);
    const token = localStorage.getItem('token');
    await subscribeToPush(token);
  };

  const handleLaterPush = () => {
    setShowPushModal(false);
    // 5-din timestamp save karo
    localStorage.setItem('push_dismissed_at', String(Date.now()));
  };

  // Manual trigger — user khud enable kare settings/header se
  const handleManualEnablePush = async () => {
    const permission = getNotificationPermission();
    if (permission === 'denied') {
      alert('Notifications browser settings mein blocked hain.\n\nBrowser address bar ke paas lock icon click karke "Notifications" allow karein, phir page reload karein.');
      return;
    }
    localStorage.removeItem('push_dismissed_at');
    localStorage.removeItem('push_subscribed');
    setShowPushModal(true);
  };


  // ── Socket.io Setup ───────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    const socket = io(API_URL, { transports: ['polling', 'websocket'] });
    internalSocketRef.current = socket;
    if (setSocket) setSocket(socket);

    // Join role-based rooms
    if (user.role === 'manager' || user.role === 'super_admin') {
      socket.emit('join_room', { room: 'manager_room' });
    }
    if (user.role === 'guard') {
      socket.emit('join_room', { room: 'guard_room' });
    }
    if (user.flat_number) {
      socket.emit('join_room', { room: `flat_${user.flat_number}` });
    }

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

    // 3. Visitor Arrival (Resident) — full screen call modal
    socket.on('visitor_notification', (data) => {
      setActiveCall(data);
      playSound('calling', true);
      addToast('visitor', '🚪 Visitor Aaya!', `${data.name} — ${data.purpose}`);
    });

    // 3b. Visitor Checked In
    socket.on('visitor_checked_in', (data) => {
      playSound('message');
      addToast('success', '🚪 Checked In! ✅', `${data.visitor_name} ne society me ENTRY le li hai.`);
    });

    // 3c. Visitor Checked Out
    socket.on('visitor_checked_out', (data) => {
      playSound('message');
      addToast('sos', '🚗 Checked Out! ❌', `${data.visitor_name} ne society se EXIT kar liya hai.`);
    });

    // 4. Account Status Update (Resident)
    socket.on('account_status_update', (data) => {
      addToast(data.status === 'active' ? 'success' : 'sos',
        data.status === 'active' ? '✅ Account Approved!' : '❌ Registration Rejected',
        data.message
      );
    });

    // 5. New Announcement
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

    // 7. Entry log refresh trigger
    socket.on('entry_log_created', () => {
      // Other components listen to sharedSocket for this — no toast needed here
    });

    return () => {
      socket.disconnect();
      if (setSocket) setSocket(null);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Check if notifications are in skipped state (not granted, not denied)
  const notifPermission = getNotificationPermission();
  const isSkipped = notifPermission === 'default' &&
    !showPushModal &&
    localStorage.getItem('push_subscribed') !== 'true';

  return (
    <>
      {/* Push Permission Modal */}
      {showPushModal && (
        <PushPermissionModal
          onAllow={handleAllowPush}
          onLater={handleLaterPush}
        />
      )}

      {/* In-App Toast Notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* 🔔 Floating "Enable Notifications" chip — skipped state mein dikhta hai */}
      {isSkipped && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[9990] animate-bounce-slow">
          <button
            onClick={handleManualEnablePush}
            className="flex items-center gap-2 bg-slate-800/90 border border-indigo-500/40 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-xl shadow-black/30 backdrop-blur-md hover:bg-indigo-600/80 transition-all active:scale-95"
          >
            <BellOff size={13} className="text-slate-400" />
            <span className="text-slate-300">Notifications off</span>
            <span className="text-indigo-400 font-black">· Enable karein →</span>
          </button>
        </div>
      )}

      {/* 📞 INCOMING VISITOR GATE CALL MODAL — Beautiful Design */}
      {activeCall && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          <div className="w-full max-w-xs bg-white text-gray-900 rounded-[30px] p-6 shadow-2xl relative flex flex-col items-center">

            {/* Bouncing scooter at top */}
            <div className="w-16 h-16 rounded-full bg-amber-400 flex items-center justify-center text-white text-3xl shadow-lg border-4 border-white absolute -top-8 animate-bounce">
              🛵
            </div>

            {/* Gate image */}
            <div className="rounded-2xl overflow-hidden h-20 w-full mb-3 mt-6">
              <img src="/gate_banner.png" alt="Gate" className="w-full h-full object-cover" />
            </div>

            {/* Title */}
            <div className="text-center mb-3">
              <h3 className="text-sm font-black text-slate-800 leading-snug">Visitor is waiting at the gate</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Guard verification request</p>
            </div>

            {/* Visitor info card */}
            <div className="w-full flex items-center gap-3 bg-slate-50 border border-slate-100 p-3 rounded-2xl mb-5">
              <div className="w-10 h-10 rounded-full bg-indigo-100 shrink-0 flex items-center justify-center font-black text-indigo-600 text-sm">
                {(activeCall.name || 'V')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-black text-slate-800 truncate">{activeCall.name || 'Visitor'}</p>
                  {activeCall.phone && (
                    <a href={`tel:${activeCall.phone}`} className="text-emerald-500 hover:text-emerald-600 shrink-0">📞</a>
                  )}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[8px] bg-indigo-500/10 text-indigo-600 font-bold px-1.5 py-0.5 rounded-md">{activeCall.purpose || 'Guest'}</span>
                  <span className="text-[8px] text-slate-400">Gate 1</span>
                </div>
              </div>
            </div>

            {/* 3 action buttons */}
            <div className="flex justify-between w-full px-2">
              <button
                onClick={() => {
                  stopSound();
                  internalSocketRef.current?.emit('visitor_decision', { approved: false, flat_number: user.flat_number, visitor_name: activeCall.name });
                  setActiveCall(null);
                }}
                className="flex flex-col items-center gap-1 hover:scale-105 active:scale-95 transition-all"
              >
                <div className="w-14 h-14 rounded-full border-2 border-red-200 bg-red-50 flex items-center justify-center text-red-500 shadow-md">
                  <X size={20} strokeWidth={2.5} />
                </div>
                <span className="text-[9px] font-bold text-red-500">Deny</span>
              </button>

              <button
                onClick={() => {
                  stopSound();
                  internalSocketRef.current?.emit('visitor_decision', { approved: true, flat_number: user.flat_number, visitor_name: activeCall.name, leave_at_gate: true });
                  setActiveCall(null);
                }}
                className="flex flex-col items-center gap-1 hover:scale-105 active:scale-95 transition-all"
              >
                <div className="w-14 h-14 rounded-full border-2 border-slate-200 bg-slate-50 flex items-center justify-center text-slate-600 shadow-md">
                  <span className="text-xl">🏠</span>
                </div>
                <span className="text-[9px] font-bold text-slate-600">Leave at Gate</span>
              </button>

              <button
                onClick={() => {
                  stopSound();
                  internalSocketRef.current?.emit('visitor_decision', { approved: true, flat_number: user.flat_number, visitor_name: activeCall.name });
                  setActiveCall(null);
                }}
                className="flex flex-col items-center gap-1 hover:scale-105 active:scale-95 transition-all"
              >
                <div className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                  <Check size={20} strokeWidth={2.5} />
                </div>
                <span className="text-[9px] font-black text-emerald-500">Approve</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default NotificationManager;
