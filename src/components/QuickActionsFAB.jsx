import React, { useState } from 'react';
import { Plus, Shield, CheckCircle, Wrench } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function QuickActionsFAB({ onSOS, onPreApprove, onService }) {
  const [isOpen, setIsOpen] = useState(false);
  const { isDark } = useTheme();

  return (
    <div className="fixed bottom-24 right-4 z-40 flex flex-col items-end gap-3">
      {/* Expanded Actions */}
      <div className={`flex flex-col gap-3 transition-all duration-300 origin-bottom ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}>
        <button 
          onClick={() => { setIsOpen(false); onSOS(); }}
          className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white p-3 rounded-full shadow-lg shadow-red-500/30 transition-transform hover:scale-110"
        >
          <span className="bg-slate-900/80 text-white text-xs px-2 py-1 rounded-md font-bold absolute right-16">SOS Emergency</span>
          <Shield size={20} />
        </button>
        
        <button 
          onClick={() => { setIsOpen(false); onPreApprove(); }}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white p-3 rounded-full shadow-lg shadow-emerald-500/30 transition-transform hover:scale-110"
        >
          <span className="bg-slate-900/80 text-white text-xs px-2 py-1 rounded-md font-bold absolute right-16">Pre-Approve Guest</span>
          <CheckCircle size={20} />
        </button>

        <button 
          onClick={() => { setIsOpen(false); onService(); }}
          className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white p-3 rounded-full shadow-lg shadow-indigo-500/30 transition-transform hover:scale-110"
        >
          <span className="bg-slate-900/80 text-white text-xs px-2 py-1 rounded-md font-bold absolute right-16">Service Request</span>
          <Wrench size={20} />
        </button>
      </div>

      {/* Main Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl font-bold text-white transition-all duration-300 
          ${isOpen ? 'bg-slate-700 rotate-45' : 'bg-indigo-600 hover:bg-indigo-500 active:scale-95'}`}
      >
        <Plus size={28} />
      </button>
    </div>
  );
}
