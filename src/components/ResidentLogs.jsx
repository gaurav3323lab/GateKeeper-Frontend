import React, { useState, useEffect } from 'react';
import { entryAPI } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { Clock, Car, Package, User } from 'lucide-react';

const ResidentLogs = ({ sharedSocket }) => {
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

    if (sharedSocket) {
      sharedSocket.on('entry_log_created', () => {
        fetchLogs();
      });
    }

    return () => {
      if (sharedSocket) {
        sharedSocket.off('entry_log_created');
      }
    };
  }, [sharedSocket]);

  const card = isDark ? 'glass-panel text-white' : 'glass-card-light text-slate-800';
  const subtext = isDark ? 'text-slate-400' : 'text-slate-500';

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-5 animate-slide-up">
      <div>
        <h2 className="font-black text-xl font-heading flex items-center gap-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-400">
          <Clock size={22} /> Activity Logs
        </h2>
        <p className={`text-xs mt-0.5 ${subtext}`}>Entry & exit logs for your flat</p>
      </div>

      <div className={`p-6 transition-all duration-300 hover:shadow-lg ${card}`}>
        {logs.length === 0 ? (
          <div className="text-center py-10">
            <Clock size={40} className="mx-auto mb-3 opacity-20 text-slate-450" />
            <p className="font-bold text-sm">No activity recorded</p>
            <p className={`text-[10px] mt-0.5 ${subtext}`}>Visitor logs will automatically populate here</p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {logs.map((log, idx) => (
              <div key={`${log.type}-${log.id}-${idx}`} className={`p-4 rounded-[22px] border transition-all duration-300 hover:scale-[1.01] flex items-center justify-between ${
                isDark ? 'bg-slate-900/40 border-slate-800 hover:border-slate-700' : 'bg-slate-50/50 border-slate-200/80 hover:border-slate-300 shadow-sm'
              }`}>
                <div className="flex items-center gap-3.5">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border shadow-sm
                    ${log.type === 'Vehicle' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 
                      log.type === 'Delivery' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 
                      'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                    {log.type === 'Vehicle' ? <Car size={18} /> : 
                     log.type === 'Delivery' ? <Package size={18} /> : 
                     <User size={18} />}
                  </div>
                  <div>
                    <p className="font-extrabold text-xs text-slate-850 dark:text-slate-100 leading-snug">{log.name}</p>
                    <p className={`text-[10px] font-bold ${subtext} mt-0.5`}>{log.purpose || log.type}</p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1.5">
                  {log.exit_time ? (
                    <span className="text-[9px] font-black text-rose-500 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">EXIT</span>
                  ) : log.entry_time ? (
                    <span className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                      <span className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse" />
                      <span>ENTRY</span>
                    </span>
                  ) : (
                    <span className="text-[9px] font-black text-indigo-500 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">ADDED</span>
                  )}
                  <p className={`text-[9px] font-semibold ${subtext}`}>
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
