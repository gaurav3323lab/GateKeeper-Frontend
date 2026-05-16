import React, { useState, useEffect } from 'react';
import { entryAPI } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { Clock, Car, Package, User } from 'lucide-react';

const ResidentLogs = () => {
  const { isDark } = useTheme();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const res = await entryAPI.getResidentLogs();
      setLogs(res.data);
    } catch (err) {
      console.error('Failed to fetch resident logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const card = isDark ? 'bg-slate-800/70 border-slate-700' : 'bg-white border-gray-200';
  const subtext = isDark ? 'text-slate-400' : 'text-gray-500';

  if (loading) return <div className="flex justify-center py-10"><div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <h2 className="font-extrabold text-lg flex items-center gap-2">
        <Clock size={20} className="text-indigo-500" /> Recent Activity
      </h2>
      <p className={`text-xs ${subtext}`}>Entry and exit logs for your flat</p>

      <div className={`border rounded-2xl p-4 ${card}`}>
        {logs.length === 0 ? (
          <p className={`text-center py-6 text-sm ${subtext}`}>Koi recent activity nahi hai</p>
        ) : (
          <div className="space-y-3">
            {logs.map(log => (
              <div key={`${log.type}-${log.id}`} className={`p-3 rounded-xl border flex items-center justify-between ${isDark ? 'bg-slate-700/30 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0
                    ${log.type === 'Vehicle' ? 'bg-blue-500/20 text-blue-500' : 
                      log.type === 'Delivery' ? 'bg-orange-500/20 text-orange-500' : 
                      'bg-emerald-500/20 text-emerald-500'}`}>
                    {log.type === 'Vehicle' ? <Car size={16} /> : 
                     log.type === 'Delivery' ? <Package size={16} /> : 
                     <User size={16} />}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{log.name}</p>
                    <p className={`text-xs ${subtext}`}>{log.purpose || log.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  {log.exit_time ? (
                    <span className="text-[10px] font-bold text-orange-500 bg-orange-500/10 px-2 py-1 rounded-full">EXIT</span>
                  ) : log.entry_time ? (
                    <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">ENTRY</span>
                  ) : (
                    <span className="text-[10px] font-bold text-indigo-500 bg-indigo-500/10 px-2 py-1 rounded-full">ADDED</span>
                  )}
                  <p className={`text-[10px] mt-1 ${subtext}`}>
                    {new Date(log.exit_time || log.entry_time || log.created_at).toLocaleString('en-IN', {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResidentLogs;
