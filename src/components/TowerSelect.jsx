import React, { useEffect, useState } from 'react';
import { Home, ChevronDown } from 'lucide-react';
import { societyAPI } from '../services/api';

const TowerSelect = ({ 
  societyId, 
  value, 
  onChange, 
  name = 'tower', 
  placeholder = 'e.g. Tower A', 
  isDark = true, 
  inputContainer = '', 
  required = false 
}) => {
  const [towers, setTowers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!societyId) {
      setTowers([]);
      return;
    }
    setLoading(true);
    societyAPI.getTowers(societyId)
      .then(res => {
        setTowers(res.data || []);
      })
      .catch(err => {
        console.error('Error fetching towers:', err);
        setTowers([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [societyId]);

  if (loading) {
    return (
      <div className={`flex items-center gap-2 border rounded-2xl px-3.5 py-3.5 transition-all duration-300 ${inputContainer}`}>
        <Home size={14} className="text-slate-400 animate-pulse" />
        <span className="text-xs text-slate-400 font-semibold animate-pulse">Loading towers...</span>
      </div>
    );
  }

  const displayTowers = towers.length > 0 ? towers : [
    { id: 't-a', tower_name: 'Tower A' },
    { id: 't-b', tower_name: 'Tower B' },
    { id: 't-c', tower_name: 'Tower C' },
    { id: 't-d', tower_name: 'Tower D' },
    { id: 'w-a', tower_name: 'Wing A' },
    { id: 'w-b', tower_name: 'Wing B' },
    { id: 'w-c', tower_name: 'Wing C' }
  ];

  return (
    <div className={`flex items-center gap-2 border rounded-2xl px-3.5 py-3.5 pr-4 transition-all duration-300 relative ${inputContainer}`}>
      <Home size={14} className="text-slate-400 shrink-0" />
      <select
        name={name}
        value={value || ''}
        onChange={onChange}
        required={required}
        className="bg-transparent flex-1 outline-none text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-white cursor-pointer appearance-none pr-6"
      >
        <option value="" disabled className={isDark ? 'bg-slate-900 text-slate-400' : 'bg-white text-slate-500'}>
          Select Tower
        </option>
        {displayTowers.map(t => (
          <option key={t.id} value={t.tower_name} className={isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-800'}>
            {t.tower_name}
          </option>
        ))}
      </select>
      <ChevronDown size={14} className="text-slate-400 pointer-events-none absolute right-4" />
    </div>
  );
};

export default TowerSelect;
