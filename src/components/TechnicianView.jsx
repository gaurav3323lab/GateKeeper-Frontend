import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Briefcase, CheckCircle, Clock, AlertCircle, ChevronRight, LogOut, Loader2, User } from 'lucide-react';
import { serviceAPI } from '../services/api';
import UserProfile from './UserProfile';

const STATUS_CONFIG = {
  Open: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', icon: AlertCircle, label: 'Naya Kaam' },
  'In-progress': { color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30', icon: Clock, label: 'Chal Raha Hai' },
  Resolved: { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', icon: CheckCircle, label: 'Poora Hua' },
};

const TechnicianView = ({ user, onLogout }) => {
  const { isDark } = useTheme();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const bg = isDark ? 'bg-[#0f172a] text-white' : 'bg-gray-50 text-gray-800';
  const card = isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-gray-200';
  const subtext = isDark ? 'text-slate-400' : 'text-gray-500';
  const header = isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white/90 border-gray-200';

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await serviceAPI.getAllRequests();
      setJobs(res.data);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    setActionLoading(true);
    try {
      await serviceAPI.updateStatus(id, {
        status: newStatus,
        technician_id: user.id
      });
      await fetchJobs();
      setSelected(null);
    } catch (err) {
      alert('Status update karne mein dikkat aayi');
    } finally {
      setActionLoading(false);
    }
  };

  const openJobs = jobs.filter(j => j.status === 'Open');
  const inProgressJobs = jobs.filter(j => j.status === 'In-progress');
  const resolvedJobs = jobs.filter(j => j.status === 'Resolved');

  const renderJobCard = (job) => {
    const cfg = STATUS_CONFIG[job.status];
    const Icon = cfg.icon;
    return (
      <div key={job.id} onClick={() => setSelected(job)}
        className={`border rounded-2xl p-4 cursor-pointer hover:border-indigo-500 transition-all ${card}`}>
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-sm">{job.category}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
            </div>
            <p className={`text-xs ${subtext}`}>Flat {job.flat_number} &bull; {job.resident_name}</p>
            <p className={`text-sm mt-1 line-clamp-1 ${subtext}`}>{job.description}</p>
            <p className={`text-xs mt-1 flex items-center gap-1 ${subtext}`}>
              🕐 {new Date(job.created_at).toLocaleString('en-IN')}
            </p>
          </div>
          <ChevronRight size={18} className={`ml-2 shrink-0 ${subtext}`} />
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${bg}`}>
      {/* Job Detail Bottom Sheet Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className={`w-full max-w-md border rounded-t-3xl p-6 ${card}`} onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 bg-slate-600 rounded-full mx-auto mb-4" />
            <p className="font-bold text-sm">{selected.category} — Kaam ki Jankari</p>
            <p className={`text-sm mb-1 ${subtext}`}>Flat: <span className="font-semibold text-indigo-400">{selected.flat_number}</span></p>
            <p className={`text-sm mb-1 leading-relaxed ${subtext}`}>{selected.description}</p>
            <p className={`text-xs mb-4 ${subtext}`}>🕐 {new Date(selected.created_at).toLocaleString('en-IN')}</p>
            <div className="space-y-2">
              {selected.status !== 'In-progress' && selected.status !== 'Resolved' && (
                <button onClick={() => updateStatus(selected.id, 'In-progress')} disabled={actionLoading}
                  className="w-full py-3 rounded-xl bg-yellow-500 hover:bg-yellow-600 text-white font-bold text-sm flex items-center justify-center gap-2">
                  {actionLoading ? <Loader2 className="animate-spin" size={18} /> : '🔧 Kaam Shuru Karein'}
                </button>
              )}
              {selected.status !== 'Resolved' && (
                <button onClick={() => updateStatus(selected.id, 'Resolved')} disabled={actionLoading}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2">
                  {actionLoading ? <Loader2 className="animate-spin" size={18} /> : '✅ Kaam Poora Ho Gaya'}
                </button>
              )}
              <button onClick={() => setSelected(null)}
                className={`w-full py-3 rounded-xl font-bold text-sm border ${isDark ? 'border-slate-600 text-slate-400' : 'border-gray-300 text-gray-500'}`}>
                Wapas Jayein
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className={`sticky top-0 z-40 px-4 py-3 border-b backdrop-blur-md flex items-center justify-between ${header}`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
            <Briefcase size={17} className="text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm leading-tight">Mera Kaam — {user?.name || 'Technician'}</h1>
            <ISTClock showDate className={subtext} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowProfile(true)} className={`p-2 rounded-xl border flex items-center justify-center ${isDark ? 'border-slate-700 text-slate-400 hover:text-indigo-400' : 'border-gray-200 text-gray-400 hover:text-indigo-500'}`}>
            <User size={15} />
          </button>
          <button onClick={onLogout}
            className={`p-2 rounded-xl border flex items-center gap-1 text-xs font-semibold
              ${isDark ? 'border-slate-700 text-slate-400 hover:text-red-400' : 'border-gray-200 text-gray-400 hover:text-red-500'}`}>
            <LogOut size={15} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      <div className="p-4 max-w-md mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="animate-spin text-indigo-500 mb-2" size={32} />
            <p className={subtext}>Kaam load ho raha hai...</p>
          </div>
        ) : (
          <>
            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { label: 'Naye Kaam', count: openJobs.length, color: 'text-red-400', bg: 'bg-red-500/10' },
                { label: 'Chal Raha', count: inProgressJobs.length, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
                { label: 'Poora Hua', count: resolvedJobs.length, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
              ].map(s => (
                <div key={s.label} className={`rounded-2xl p-3 text-center border ${isDark ? 'border-slate-700' : 'border-gray-200'} ${s.bg}`}>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
                  <p className={`text-xs ${subtext}`}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Sections */}
            {openJobs.length > 0 && (
              <div className="mb-5">
                <h2 className="text-xs font-bold text-red-400 mb-2 flex items-center gap-1">
                  <AlertCircle size={13} /> Naye Kaam ({openJobs.length})
                </h2>
                <div className="space-y-3">{openJobs.map(renderJobCard)}</div>
              </div>
            )}

            {inProgressJobs.length > 0 && (
              <div className="mb-5">
                <h2 className="text-xs font-bold text-yellow-400 mb-2 flex items-center gap-1">
                  <Clock size={13} /> Chal Raha Hai ({inProgressJobs.length})
                </h2>
                <div className="space-y-3">{inProgressJobs.map(renderJobCard)}</div>
              </div>
            )}

            {resolvedJobs.length > 0 && (
              <div className="mb-5">
                <h2 className="text-xs font-bold text-emerald-400 mb-2 flex items-center gap-1">
                  <CheckCircle size={13} /> Poora Hua ({resolvedJobs.length})
                </h2>
                <div className="space-y-3">{resolvedJobs.map(renderJobCard)}</div>
              </div>
            )}

            {jobs.length === 0 && (
              <div className="text-center py-20 opacity-50">
                <Briefcase size={40} className="mx-auto mb-3" />
                <p className="font-bold">Abhi koi kaam nahi hai</p>
              </div>
            )}
          </>
        )}
      </div>

      <UserProfile isOpen={showProfile} onClose={() => setShowProfile(false)} />
    </div>
  );
};

export default TechnicianView;
