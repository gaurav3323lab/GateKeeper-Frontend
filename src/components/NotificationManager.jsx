import React, { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import {
  AlertTriangle, Bell, X, Check, Megaphone, BellOff, BellRing,
  Phone, PhoneOff, UserCheck, ShieldAlert, LogIn, LogOut, Volume2
} from 'lucide-react';
import {
  registerServiceWorker,
  subscribeToPush,
  unsubscribeFromPush,
  getNotificationPermission,
} from '../services/pushService';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

const API_URL = import.meta.env.VITE_API_URL || 'https://yellowgreen-goldfish-813322.hostingersite.com';

// ─────────────────────────────────────────────────────────────────
// All sounds are synthesized with Web Audio API.
// No external URLs needed — zero buffering, always smooth.
// ─────────────────────────────────────────────────────────────────

/**
 * Smooth synthesized phone ringtone.
 * Classic dual-tone ring: 0.8s ring ON → 4s silence, loops until stopped.
 * Returns { stop } handle.
 */
function startSmoothRing() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    const ctx = new AudioContextClass();

    let stopped = false;
    let timeoutId = null;

    // One ring cycle: smooth fade-in, dual tone, smooth fade-out
    function ringOnce(startTime) {
      if (stopped || ctx.state === 'closed') return;

      const gain = ctx.createGain();
      gain.connect(ctx.destination);

      // Dual-tone: 400Hz + 450Hz (classic BSNL/telecom feel)
      [400, 450].forEach((freq) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        osc.connect(gain);
        osc.start(startTime);
        osc.stop(startTime + 0.8);
      });

      // Smooth envelope: quick fade-in over 0.04s, hold, gentle fade-out over 0.18s
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.28, startTime + 0.04);
      gain.gain.setValueAtTime(0.28, startTime + 0.60);
      gain.gain.linearRampToValueAtTime(0, startTime + 0.80);
    }

    // Schedule repeating ring: ring 0.8s, silence 4s, repeat
    const RING_DURATION = 0.8;
    const SILENCE_DURATION = 4.0;
    const CYCLE = RING_DURATION + SILENCE_DURATION;

    let cycleStart = ctx.currentTime;

    function scheduleCycles() {
      if (stopped) return;
      // Schedule ahead 3 cycles to keep audio graph smooth
      for (let i = 0; i < 3; i++) {
        ringOnce(cycleStart + i * CYCLE);
      }
      cycleStart += 3 * CYCLE;
      // Reschedule before next batch starts
      timeoutId = setTimeout(scheduleCycles, (3 * CYCLE - 1) * 1000);
    }

    scheduleCycles();

    return {
      stop: () => {
        stopped = true;
        if (timeoutId) clearTimeout(timeoutId);
        try {
          // Quick fade out before close to avoid click
          const g = ctx.createGain();
          g.connect(ctx.destination);
          g.gain.setValueAtTime(0, ctx.currentTime);
          setTimeout(() => { try { ctx.close(); } catch (e) {} }, 80);
        } catch (e) {
          try { ctx.close(); } catch (e2) {}
        }
      }
    };
  } catch (e) {
    console.error('[Ring] Failed to start ringtone:', e);
    return null;
  }
}

/**
 * Smooth single-chime message ping.
 * Soft sine at 880Hz with gentle fade — like a modern notification beep.
 */
function playMessagePing() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const gain = ctx.createGain();
    gain.connect(ctx.destination);

    // Primary chime
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(740, ctx.currentTime + 0.15);
    osc.connect(gain);

    // Envelope: fast attack, smooth decay
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.6);

    setTimeout(() => { try { ctx.close(); } catch (e) {} }, 700);
  } catch (e) {
    console.warn('[Ping] Message ping failed:', e);
  }
}

// ─────────────────────────────────────────────────────────────────
// NotificationBar Toast — slides from top, auto-dismiss in 5s
// Used for: entry/exit, notices, announcements, community, approval result
// ─────────────────────────────────────────────────────────────────
const NotifBarToast = ({ toasts, onDismiss }) => (
  <div
    className="fixed top-0 left-0 right-0 flex flex-col items-stretch pointer-events-none"
    style={{ zIndex: 9998 }}
  >
    {toasts.map((t) => (
      <div
        key={t.id}
        className="pointer-events-auto mx-3 mt-2 first:mt-3"
        style={{ animation: 'slideDownIn 0.3s ease-out' }}
      >
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border backdrop-blur-md
            ${t.type === 'sos'          ? 'bg-red-950/95 border-red-500 text-white' :
              t.type === 'approval'     ? 'bg-indigo-950/95 border-indigo-400 text-white' :
              t.type === 'announcement' ? 'bg-amber-950/95 border-amber-400 text-white' :
              t.type === 'entry'        ? 'bg-emerald-950/95 border-emerald-500 text-white' :
              t.type === 'exit'         ? 'bg-slate-900/95 border-slate-500 text-white' :
              'bg-slate-900/95 border-slate-600 text-white'}`}
        >
          {/* Icon */}
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base
            ${t.type === 'sos'          ? 'bg-red-500' :
              t.type === 'approval'     ? 'bg-indigo-500' :
              t.type === 'announcement' ? 'bg-amber-500' :
              t.type === 'entry'        ? 'bg-emerald-500' :
              t.type === 'exit'         ? 'bg-slate-500' :
              'bg-slate-600'}`}
          >
            {t.type === 'sos'          ? <AlertTriangle size={16} className="text-white" /> :
             t.type === 'announcement' ? <Megaphone size={16} className="text-white" /> :
             t.type === 'entry'        ? <LogIn size={16} className="text-white" /> :
             t.type === 'exit'         ? <LogOut size={16} className="text-white" /> :
             t.type === 'approval'     ? <UserCheck size={16} className="text-white" /> :
             <Bell size={16} className="text-white" />}
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="font-black text-xs leading-snug truncate">{t.title}</p>
            <p className="text-[11px] opacity-75 mt-0.5 line-clamp-1">{t.message}</p>
          </div>

          {/* Dismiss */}
          <button
            onClick={() => onDismiss(t.id)}
            className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all"
          >
            <X size={12} className="text-white/80" />
          </button>
        </div>

        {/* Thin auto-dismiss progress bar */}
        <div className="mx-1 h-0.5 bg-white/10 rounded-full overflow-hidden -mt-0.5">
          <div
            className="h-full bg-white/30 rounded-full"
            style={{ animation: 'shrinkBar 5s linear forwards' }}
          />
        </div>
      </div>
    ))}
  </div>
);

// ─────────────────────────────────────────────────────────────────
// VISITOR GATE CALL MODAL — Full screen incoming call style
// Triggered when: guard sends visitor_notification to resident's flat
// ─────────────────────────────────────────────────────────────────
const VisitorCallModal = ({ call, onApprove, onDeny, onLeaveAtGate }) => (
  <div
    className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4"
    style={{ zIndex: 10001 }}
  >
    {/* Ripple rings */}
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="w-64 h-64 rounded-full border border-white/5 animate-ping" style={{ animationDuration: '2s' }} />
      <div className="absolute w-48 h-48 rounded-full border border-white/8 animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.3s' }} />
    </div>

    <div className="w-full max-w-xs bg-slate-950 border border-slate-700/60 rounded-[32px] overflow-hidden shadow-2xl relative">
      {/* Top banner */}
      <div className="h-28 w-full relative overflow-hidden">
        <img src="/gate_banner.png" alt="Gate" className="w-full h-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-950" />
        {/* Caller avatar */}
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-indigo-600 border-4 border-slate-950 flex items-center justify-center font-black text-white text-xl shadow-xl">
          {(call.name || 'V')[0].toUpperCase()}
        </div>
      </div>

      {/* Info section */}
      <div className="px-6 pt-10 pb-6 text-center">
        <p className="text-[10px] font-semibold text-indigo-400 tracking-widest uppercase mb-1">Gate Pe Visitor</p>
        <h2 className="text-xl font-black text-white mb-0.5">{call.name || 'Visitor'}</h2>
        {call.phone && (
          <a href={`tel:${call.phone}`} className="text-[11px] text-emerald-400 font-semibold">
            📞 {call.phone}
          </a>
        )}
        <div className="mt-2 flex items-center justify-center gap-2">
          <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-bold px-2 py-0.5 rounded-full border border-indigo-500/30">
            {call.purpose || 'Guest'}
          </span>
          <span className="text-[10px] text-slate-500">• Gate 1</span>
        </div>

        {/* Pulsing indicator */}
        <div className="mt-3 flex items-center justify-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-[10px] text-slate-400">Aapka jawab chahiye...</span>
        </div>
      </div>

      {/* 3 action buttons */}
      <div className="px-5 pb-7 flex justify-between items-center">
        {/* Deny */}
        <button onClick={onDeny} className="flex flex-col items-center gap-1.5 group">
          <div className="w-14 h-14 rounded-full bg-red-500/15 border-2 border-red-500/50 flex items-center justify-center group-hover:bg-red-500 group-hover:border-red-500 active:scale-95 transition-all">
            <PhoneOff size={20} className="text-red-400 group-hover:text-white" />
          </div>
          <span className="text-[10px] font-bold text-red-400">Deny</span>
        </button>

        {/* Leave at Gate */}
        <button onClick={onLeaveAtGate} className="flex flex-col items-center gap-1.5 group -mt-4">
          <div className="w-12 h-12 rounded-full bg-slate-700/60 border border-slate-600 flex items-center justify-center group-hover:bg-slate-600 active:scale-95 transition-all text-lg">
            🏠
          </div>
          <span className="text-[9px] font-semibold text-slate-400 text-center leading-tight">Leave<br/>at Gate</span>
        </button>

        {/* Approve */}
        <button onClick={onApprove} className="flex flex-col items-center gap-1.5 group">
          <div className="w-14 h-14 rounded-full bg-emerald-500 border-2 border-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/40 group-hover:bg-emerald-400 active:scale-95 transition-all">
            <Phone size={20} className="text-white" />
          </div>
          <span className="text-[10px] font-bold text-emerald-400">Allow</span>
        </button>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────
// SOS EMERGENCY FULL-SCREEN MODAL
// Triggered when: resident presses SOS → shown to guards & managers
// ─────────────────────────────────────────────────────────────────
const SOSModal = ({ data, onResolve }) => (
  <div
    className="fixed inset-0 bg-red-950/90 backdrop-blur-sm flex items-center justify-center p-4"
    style={{ zIndex: 10001 }}
  >
    {/* Pulsing red border */}
    <div className="absolute inset-0 border-4 border-red-500 animate-pulse rounded-none pointer-events-none" />

    <div className="w-full max-w-xs bg-slate-950 border-2 border-red-500 rounded-3xl p-6 shadow-2xl text-center relative">
      {/* Siren icon */}
      <div className="mb-4 flex justify-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-40" />
          <div className="w-20 h-20 rounded-full bg-red-600 flex items-center justify-center shadow-2xl shadow-red-500/50 relative">
            <ShieldAlert size={36} className="text-white" />
          </div>
        </div>
      </div>

      <p className="text-[11px] font-bold tracking-widest text-red-400 uppercase mb-1">Emergency SOS Alert</p>
      <h2 className="text-2xl font-black text-white mb-2">🚨 SOS!</h2>

      {data?.message && (
        <p className="text-sm text-red-200 mb-1 font-semibold">{data.message}</p>
      )}
      {(data?.tower || data?.flat_number) && (
        <p className="text-xs text-slate-400 mb-4">
          Flat: <span className="text-white font-bold">{data.tower ? data.tower + '-' : ''}{data.flat_number}</span>
          {data?.user_name && <span> — {data.user_name}</span>}
        </p>
      )}

      {/* Call action */}
      {data?.phone && (
        <a
          href={`tel:${data.phone}`}
          className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-600 rounded-2xl text-white font-bold text-sm mb-3 hover:bg-emerald-500 active:scale-95 transition-all"
        >
          <Phone size={16} /> Call Now
        </a>
      )}

      <button
        onClick={onResolve}
        className="w-full py-3 bg-slate-700 border border-slate-600 rounded-2xl text-slate-300 font-semibold text-sm hover:bg-slate-600 active:scale-95 transition-all"
      >
        Mark Resolved ✓
      </button>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────
// NEW APPROVAL REQUEST FULL-SCREEN MODAL (Manager sees this)
// Triggered when: new resident registers → manager/admin gets call
// ─────────────────────────────────────────────────────────────────
const ApprovalCallModal = ({ data, onViewDashboard, onDismiss }) => (
  <div
    className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4"
    style={{ zIndex: 10001 }}
  >
    {/* Ripple */}
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="w-64 h-64 rounded-full border border-indigo-500/10 animate-ping" style={{ animationDuration: '1.8s' }} />
      <div className="absolute w-48 h-48 rounded-full border border-indigo-500/15 animate-ping" style={{ animationDuration: '1.3s', animationDelay: '0.25s' }} />
    </div>

    <div className="w-full max-w-xs bg-slate-950 border border-indigo-500/40 rounded-[32px] p-6 shadow-2xl text-center relative">
      {/* Icon */}
      <div className="mb-4 flex justify-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-indigo-500 animate-ping opacity-30" />
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-500/40 relative">
            <UserCheck size={34} className="text-white" />
          </div>
        </div>
      </div>

      <p className="text-[10px] font-bold tracking-widest text-indigo-400 uppercase mb-1">New Registration</p>
      <h2 className="text-xl font-black text-white mb-1">Approval Pending!</h2>
      <p className="text-sm text-slate-300 mb-1 font-semibold">{data?.name || 'New Resident'}</p>
      <p className="text-xs text-slate-500 mb-5">
        Flat: <span className="text-slate-300">{data?.tower ? data.tower + '-' : ''}{data?.flat_number}</span>
        {data?.phone && <span> — {data.phone}</span>}
      </p>

      {/* Pulsing waiting text */}
      <div className="flex items-center justify-center gap-2 mb-5">
        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
        <span className="text-[11px] text-slate-400">Approval awaiting...</span>
      </div>

      <button
        onClick={onViewDashboard}
        className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl text-white font-black text-sm shadow-lg shadow-indigo-500/30 hover:opacity-90 active:scale-95 transition-all mb-3"
      >
        Review & Approve →
      </button>
      <button
        onClick={onDismiss}
        className="w-full py-3 bg-slate-800 border border-slate-700 rounded-2xl text-slate-400 font-semibold text-sm hover:bg-slate-700 active:scale-95 transition-all"
      >
        Dismiss
      </button>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────
// PUSH PERMISSION MODAL
// ─────────────────────────────────────────────────────────────────
const PushPermissionModal = ({ onAllow, onLater }) => (
  <div className="fixed inset-0 z-[10000] flex items-end justify-center p-4 bg-black/60 backdrop-blur-sm">
    <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
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
        🚨 SOS alerts, 🚪 visitor arrivals, 🚗 vehicle entry/exit aur 📢 society notices —{' '}
        <span className="text-white font-semibold">tab bhi milenge jab app band ho।</span>
      </p>

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

// ─────────────────────────────────────────────────────────────────
// MAIN NotificationManager Component
// ─────────────────────────────────────────────────────────────────
const NotificationManager = ({ user, onSOS, setSocket, globalSOS }) => {
  const internalSocketRef = useRef(null);
  const sirenRef          = useRef(null);  // SOS siren handle
  const ringRef           = useRef(null);  // Smooth call ringtone handle

  const [toasts, setToasts]           = useState([]);      // notification bar toasts
  const [visitorCall, setVisitorCall] = useState(null);    // full-screen visitor call
  const [sosModal, setSosModal]       = useState(null);    // full-screen SOS
  const [approvalCall, setApprovalCall] = useState(null);  // full-screen approval request
  const [showPushModal, setShowPushModal] = useState(false);

  // Stop siren when SOS is resolved globally
  useEffect(() => {
    if (!globalSOS) stopSound();
  }, [globalSOS]);

  // ── Notification Bar Toast helpers ────────────────────────────
  const addToast = useCallback((type, title, message) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev.slice(-3), { id, type, title, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // ── Synthesized Emergency Siren ───────────────────────────────
  const startEmergencySiren = () => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return null;
      const audioCtx = new AudioContextClass();
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      osc1.type = 'sawtooth';
      osc2.type = 'sine';
      gainNode.gain.setValueAtTime(0.35, audioCtx.currentTime);
      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc1.frequency.setValueAtTime(520, audioCtx.currentTime);
      osc2.frequency.setValueAtTime(570, audioCtx.currentTime);
      osc1.start();
      osc2.start();
      let toggle = false;
      const interval = setInterval(() => {
        if (audioCtx.state === 'closed') { clearInterval(interval); return; }
        const now = audioCtx.currentTime;
        if (toggle) {
          osc1.frequency.exponentialRampToValueAtTime(880, now + 0.45);
          osc2.frequency.exponentialRampToValueAtTime(930, now + 0.45);
        } else {
          osc1.frequency.exponentialRampToValueAtTime(440, now + 0.45);
          osc2.frequency.exponentialRampToValueAtTime(490, now + 0.45);
        }
        toggle = !toggle;
      }, 500);
      // Auto-stop after 20s
      setTimeout(() => {
        clearInterval(interval);
        try { osc1.stop(); osc2.stop(); audioCtx.close(); } catch (e) {}
      }, 20000);
      return {
        stop: () => {
          clearInterval(interval);
          try { osc1.stop(); osc2.stop(); audioCtx.close(); } catch (e) {}
        }
      };
    } catch (e) {
      console.error('Siren failed:', e);
      return null;
    }
  };

  // ── Sound Player ──────────────────────────────────────────────
  // type: 'sos' | 'calling' | 'message'
  // calling = smooth looping phone ringtone (visitor gate call / approval)
  // message = short smooth single chime ping (entry/exit/notice)
  // sos     = synthesized emergency siren
  const playSound = useCallback((type) => {
    try {
      if (type === 'sos') {
        // Stop any ring that might be playing
        if (ringRef.current) { ringRef.current.stop(); ringRef.current = null; }
        if (sirenRef.current) { sirenRef.current.stop(); sirenRef.current = null; }
        sirenRef.current = startEmergencySiren();
        return;
      }
      if (type === 'calling') {
        // Stop SOS/siren if any, then start smooth ring
        if (sirenRef.current) { sirenRef.current.stop(); sirenRef.current = null; }
        if (ringRef.current) { ringRef.current.stop(); ringRef.current = null; }
        ringRef.current = startSmoothRing();
        return;
      }
      if (type === 'message') {
        // Stop ring/siren if any was playing
        if (ringRef.current) { ringRef.current.stop(); ringRef.current = null; }
        playMessagePing();
        return;
      }
    } catch (err) { console.error('Sound error:', err); }
  }, []);

  const stopSound = useCallback(() => {
    try {
      if (sirenRef.current) { sirenRef.current.stop(); sirenRef.current = null; }
      if (ringRef.current) { ringRef.current.stop(); ringRef.current = null; }
    } catch (err) { console.error('Sound stop error:', err); }
  }, []);

  // ── Native Push (Capacitor) ───────────────────────────────────
  const registerNativePush = async () => {
    try {
      let permStatus = await PushNotifications.checkPermissions();
      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }
      if (permStatus.receive !== 'granted') { console.warn('[Push] Native permission denied'); return; }
      await PushNotifications.register();

      await PushNotifications.addListener('registration', async (token) => {
        console.log('[Push] Native token:', token.value);
        const authToken = localStorage.getItem('token');
        if (!authToken) return;
        try {
          const res = await fetch(`${API_URL}/api/push/subscribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
            body: JSON.stringify({ fcm_token: token.value, platform: Capacitor.getPlatform() || 'android' })
          });
          if (res.ok) {
            console.log('[Push] FCM token saved ✅');
            localStorage.setItem('push_subscribed', 'true');
          }
        } catch (err) { console.error('[Push] FCM save failed:', err.message); }
      });

      await PushNotifications.addListener('registrationError', (err) => {
        console.error('[Push] Registration error:', err.error);
      });

      // Foreground notification received on native — play message tone + toast
      await PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('[Push] Foreground notification:', notification);
        const type = notification.data?.type;
        if (type === 'visitor' || type === 'approval') {
          playSound('calling', true);
        } else if (type === 'sos') {
          playSound('sos');
        } else {
          playSound('message');
        }
        addToast(type || 'general', notification.title || 'Notification', notification.body || '');
      });

      await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        console.log('[Push] Push action:', action);
      });
    } catch (e) { console.error('[Push] Capacitor error:', e.message); }
  };

  // ── PWA Web Push Setup ────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    if (Capacitor.isNativePlatform()) { registerNativePush(); return; }

    registerServiceWorker();
    const permission = getNotificationPermission();

    if (permission === 'granted') {
      const alreadySubscribed = localStorage.getItem('push_subscribed') === 'true';
      if (!alreadySubscribed) {
        const token = localStorage.getItem('token');
        if (token) subscribeToPush(token);
      }
      return;
    }
    if (permission === 'denied' || permission === 'unsupported') return;

    const alreadySubscribed = localStorage.getItem('push_subscribed') === 'true';
    if (alreadySubscribed) return;

    const dismissedAt = localStorage.getItem('push_dismissed_at');
    const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;
    if (dismissedAt) {
      const elapsed = Date.now() - parseInt(dismissedAt, 10);
      if (elapsed < FIVE_DAYS_MS) return;
      localStorage.removeItem('push_dismissed_at');
    }

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
    localStorage.setItem('push_dismissed_at', String(Date.now()));
  };
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

  // ── Socket.io Setup ───────────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    const isHostinger = API_URL.includes('hostingersite.com');
    const socket = io(API_URL, {
      transports: isHostinger ? ['polling'] : ['polling', 'websocket']
    });
    internalSocketRef.current = socket;
    if (setSocket) setSocket(socket);

    // Join role-based rooms — pass userId so server can also join personal user_{id} room
    if (user.role === 'manager' || user.role === 'super_admin' || user.role === 'admin') {
      socket.emit('join_room', { room: 'manager_room', userId: user.id });
    }
    if (user.role === 'guard') socket.emit('join_room', { room: 'guard_room', userId: user.id });
    if (user.flat_number) {
      const roomName = `flat_${user.tower ? user.tower + '-' : ''}${user.flat_number}`;
      socket.emit('join_room', { room: roomName, userId: user.id });
    }
    // Always join personal user room (for vehicle notifs, account notifs)
    socket.emit('join_room', { room: `user_${user.id}`, userId: user.id });

    // ─────────────────────────────────────────────────────────────
    // 1. New Resident Approval Request → Manager / Admin
    //    SOUND: 📞 Call tone (looping)
    //    DISPLAY: Full-screen approval modal
    // ─────────────────────────────────────────────────────────────
    socket.on('new_approval_request', (data) => {
      playSound('calling', true);  // looping call tone
      setApprovalCall(data);       // full-screen approval modal
    });

    // ─────────────────────────────────────────────────────────────
    // 2. SOS Alert → Guard + Manager
    //    SOUND: 🚨 Emergency siren (synthesized)
    //    DISPLAY: Full-screen SOS modal
    // ─────────────────────────────────────────────────────────────
    socket.on('sos_alert', (data) => {
      playSound('sos');     // emergency siren
      setSosModal(data);    // full-screen SOS modal
      if (onSOS) onSOS(data);
    });

    // ─────────────────────────────────────────────────────────────
    // 3. Visitor at Gate → Resident's flat
    //    SOUND: 📞 Call tone (looping)
    //    DISPLAY: Full-screen incoming call modal
    // ─────────────────────────────────────────────────────────────
    socket.on('visitor_notification', (data) => {
      playSound('calling', true);  // looping call tone
      setVisitorCall(data);        // full-screen visitor call modal
    });

    // ─────────────────────────────────────────────────────────────
    // 4. Visitor Checked In → Resident
    //    SOUND: 📩 Message tone (single)
    //    DISPLAY: Notification bar toast
    // ─────────────────────────────────────────────────────────────
    socket.on('visitor_checked_in', (data) => {
      playSound('message');
      addToast('entry', '🚪 Entry Ho Gayi ✅', `${data.visitor_name} society mein enter kar gaye.`);
    });

    // ─────────────────────────────────────────────────────────────
    // 5. Visitor Checked Out → Resident
    //    SOUND: 📩 Message tone (single)
    //    DISPLAY: Notification bar toast
    // ─────────────────────────────────────────────────────────────
    socket.on('visitor_checked_out', (data) => {
      playSound('message');
      addToast('exit', '🚗 Exit Ho Gaya', `${data.visitor_name} society se nikal gaye.`);
    });

    // ─────────────────────────────────────────────────────────────
    // 6. Account Approved / Rejected → Resident
    //    SOUND: 📩 Message tone (single)
    //    DISPLAY: Notification bar toast
    // ─────────────────────────────────────────────────────────────
    socket.on('account_status_update', (data) => {
      playSound('message');
      const isApproved = data.status === 'active';
      addToast(
        isApproved ? 'approval' : 'sos',
        isApproved ? '✅ Account Approved!' : '❌ Registration Rejected',
        data.message || (isApproved ? `${data.name || 'Aapka'} account approve ho gaya. App use kar sakte hain!` : `${data.name || 'Aapka'} account reject ho gaya.`)
      );
    });

    // ─────────────────────────────────────────────────────────────
    // 7. New Announcement / Notice → All residents
    //    SOUND: 📩 Message tone (single)
    //    DISPLAY: Notification bar toast
    // ─────────────────────────────────────────────────────────────
    socket.on('new_announcement', (data) => {
      playSound('message');
      addToast('announcement', `📢 ${data.category || 'Notice'}`, data.title);
    });

    // ─────────────────────────────────────────────────────────────
    // 8. Visitor Decision Result → Guard (after resident approves/denies)
    //    SOUND: 📩 Message tone (single)
    //    DISPLAY: Notification bar toast
    // ─────────────────────────────────────────────────────────────
    socket.on('visitor_decision_result', (data) => {
      playSound('message');
      addToast(
        data.approved ? 'entry' : 'exit',
        data.approved ? '✅ Entry Approved' : '❌ Entry Denied',
        `Flat ${data.tower ? data.tower + '-' : ''}${data.flat_number} — ${data.visitor_name}`
      );
    });

    // ─────────────────────────────────────────────────────────────
    // 9. Generic notification refresh event (for tab badge update)
    //    SOUND: based on type
    //    DISPLAY: notification bar toast only
    // ─────────────────────────────────────────────────────────────
    socket.on('new_notification', (data) => {
      if (data.type === 'sos') {
        playSound('sos');
      } else if (data.type === 'visitor' || data.type === 'approval') {
        playSound('calling', false); // single play for generic
      } else {
        playSound('message');
      }
      window.dispatchEvent(new CustomEvent('refresh_notifications'));
    });

    // ─────────────────────────────────────────────────────────────
    // 10. New Pre-approval (Guard gets notified of new pre-approval)
    //    SOUND: 📩 Message tone
    //    DISPLAY: Notification bar toast
    // ─────────────────────────────────────────────────────────────
    socket.on('new_pre_approval', (data) => {
      playSound('message');
      addToast('approval', '📋 New Pre-Approval', data.message || 'Nayi pre-approval request aayi hai.');
    });

    return () => {
      socket.disconnect();
      if (setSocket) setSocket(null);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ── Visitor call action handlers ──────────────────────────────
  const handleVisitorApprove = useCallback(() => {
    stopSound();
    internalSocketRef.current?.emit('visitor_decision', {
      approved: true,
      tower: user.tower,
      flat_number: user.flat_number,
      visitor_name: visitorCall?.name
    });
    setVisitorCall(null);
  }, [stopSound, visitorCall, user]);

  const handleVisitorDeny = useCallback(() => {
    stopSound();
    internalSocketRef.current?.emit('visitor_decision', {
      approved: false,
      tower: user.tower,
      flat_number: user.flat_number,
      visitor_name: visitorCall?.name
    });
    setVisitorCall(null);
  }, [stopSound, visitorCall, user]);

  const handleVisitorLeaveAtGate = useCallback(() => {
    stopSound();
    internalSocketRef.current?.emit('visitor_decision', {
      approved: true,
      leave_at_gate: true,
      tower: user.tower,
      flat_number: user.flat_number,
      visitor_name: visitorCall?.name
    });
    setVisitorCall(null);
  }, [stopSound, visitorCall, user]);

  const handleSOSResolve = useCallback(() => {
    stopSound();
    setSosModal(null);
  }, [stopSound]);

  const handleApprovalViewDashboard = useCallback(() => {
    stopSound();
    setApprovalCall(null);
    // Navigate to manager dashboard approval tab
    window.dispatchEvent(new CustomEvent('open_approvals_tab'));
  }, [stopSound]);

  const handleApprovalDismiss = useCallback(() => {
    stopSound();
    setApprovalCall(null);
  }, [stopSound]);

  // ── Permission chip ───────────────────────────────────────────
  const notifPermission = getNotificationPermission();
  const isSkipped = notifPermission === 'default' &&
    !showPushModal &&
    localStorage.getItem('push_subscribed') !== 'true';

  return (
    <>
      {/* Push permission modal */}
      {showPushModal && <PushPermissionModal onAllow={handleAllowPush} onLater={handleLaterPush} />}

      {/* Notification bar toasts */}
      <NotifBarToast toasts={toasts} onDismiss={dismissToast} />

      {/* Floating "Enable Notifications" chip */}
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

      {/* Full-screen SOS modal — highest priority */}
      {sosModal && (
        <SOSModal data={sosModal} onResolve={handleSOSResolve} />
      )}

      {/* Full-screen visitor gate call modal */}
      {!sosModal && visitorCall && (
        <VisitorCallModal
          call={visitorCall}
          onApprove={handleVisitorApprove}
          onDeny={handleVisitorDeny}
          onLeaveAtGate={handleVisitorLeaveAtGate}
        />
      )}

      {/* Full-screen approval call modal */}
      {!sosModal && !visitorCall && approvalCall && (
        <ApprovalCallModal
          data={approvalCall}
          onViewDashboard={handleApprovalViewDashboard}
          onDismiss={handleApprovalDismiss}
        />
      )}
    </>
  );
};

export default NotificationManager;
