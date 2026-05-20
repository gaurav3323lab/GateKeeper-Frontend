import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { announcementAPI } from '../services/api';
import { Megaphone, Pin, Plus, Trash2, Edit2, X, Loader2, AlertTriangle, Calendar, Wrench, PartyPopper, Bell } from 'lucide-react';

const CATEGORY_CONFIG = {
  General:     { color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/30',    icon: Bell,         emoji: '📢' },
  Maintenance: { color: 'text-orange-400',  bg: 'bg-orange-500/10 border-orange-500/30', icon: Wrench,       emoji: '🔧' },
  Emergency:   { color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/30',       icon: AlertTriangle, emoji: '🚨' },
  Event:       { color: 'text-purple-400',  bg: 'bg-purple-500/10 border-purple-500/30', icon: PartyPopper,  emoji: '🎉' },
  Notice:      { color: 'text-yellow-400',  bg: 'bg-yellow-500/10 border-yellow-500/30', icon: Pin,          emoji: '📌' },
};

const AnnouncementBoard = ({ user }) => {
  const { isDark } = useTheme();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', category: 'General', is_pinned: false });
  const [filter, setFilter] = useState('All');

  const isManager = user?.role === 'manager' || user?.role === 'super_admin';

  const card = isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-gray-200';
  const input = isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-gray-100 border-gray-300 text-gray-800';
  const subtext = isDark ? 'text-slate-400' : 'text-gray-500';

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const res = await announcementAPI.getAll();
      setAnnouncements(res.data);
    } catch (err) {
      console.error('Failed to fetch announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.title || !form.body) return alert('Title aur body required hai');
    setSaving(true);
    try {
      if (editingId) {
        await announcementAPI.update(editingId, form);
        setAnnouncements(announcements.map(a => a.id === editingId ? { ...a, ...form } : a));
      } else {
        await announcementAPI.create(form);
        await fetchAnnouncements();
      }
      setForm({ title: '', body: '', category: 'General', is_pinned: false });
      setShowForm(false);
      setEditingId(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Save nahi ho saka');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await announcementAPI.delete(id);
      setAnnouncements(announcements.filter(a => a.id !== id));
    } catch (err) {
      alert('Delete nahi ho saka');
    }
  };

  const startEdit = (a) => {
    setEditingId(a.id);
    setForm({ title: a.title, body: a.body, category: a.category, is_pinned: !!a.is_pinned });
    setShowForm(true);
  };

  const categories = ['All', 'General', 'Maintenance', 'Emergency', 'Event', 'Notice'];
  const filtered = filter === 'All' ? announcements : announcements.filter(a => a.category === filter);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-base flex items-center gap-2">
            <Megaphone size={18} className="text-yellow-400" /> Society Notices
          </h2>
          <p className={`text-xs mt-0.5 ${subtext}`}>Society aur management ki updates</p>
        </div>
        {isManager && (
          <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ title: '', body: '', category: 'General', is_pinned: false }); }}
            className="flex items-center gap-1 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-xl text-xs font-bold">
            {showForm ? <X size={14} /> : <Plus size={14} />}
            {showForm ? 'Cancel' : 'New Notice'}
          </button>
        )}
      </div>

      {/* Add / Edit Form (Manager only) */}
      {isManager && showForm && (
        <div className={`border rounded-2xl p-4 space-y-3 ${card}`}>
          <h3 className="font-bold text-sm text-yellow-400">{editingId ? 'Notice Edit Karein' : 'Nayi Notice Post Karein'}</h3>
          <input
            placeholder="Title — e.g. Water Supply Cut on 18 May"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none ${input}`}
          />
          <textarea
            placeholder="Detail mein likhen..."
            rows={3}
            value={form.body}
            onChange={e => setForm({ ...form, body: e.target.value })}
            className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none resize-none ${input}`}
          />
          <div className="flex gap-2">
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
              className={`flex-1 border rounded-xl px-3 py-2.5 text-sm outline-none ${input}`}>
              <option>General</option>
              <option>Maintenance</option>
              <option>Emergency</option>
              <option>Event</option>
              <option>Notice</option>
            </select>
            <label className={`flex items-center gap-2 px-3 py-2.5 border rounded-xl text-sm cursor-pointer select-none ${input}`}>
              <input type="checkbox" checked={form.is_pinned} onChange={e => setForm({ ...form, is_pinned: e.target.checked })} className="accent-yellow-400" />
              <Pin size={14} /> Pin
            </label>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="w-full py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2">
            {saving ? <Loader2 className="animate-spin" size={16} /> : (editingId ? '✅ Update Karein' : '📢 Post Karein')}
          </button>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {categories.map(c => (
          <button key={c} onClick={() => setFilter(c)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border
              ${filter === c
                ? 'bg-yellow-500 text-white border-yellow-500'
                : isDark ? 'border-slate-600 text-slate-400 hover:text-white' : 'border-gray-200 text-gray-500'}`}>
            {c === 'All' ? '🗂️ All' : (CATEGORY_CONFIG[c]?.emoji + ' ' + c)}
          </button>
        ))}
      </div>

      {/* Announcements List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-yellow-400" size={32} />
        </div>
      ) : filtered.length === 0 ? (
        <div className={`border rounded-2xl p-10 text-center ${card}`}>
          <Megaphone size={36} className="mx-auto opacity-30 mb-3" />
          <p className={`text-sm ${subtext}`}>Abhi koi notice nahi hai</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(a => {
            const cfg = CATEGORY_CONFIG[a.category] || CATEGORY_CONFIG.General;
            return (
              <div key={a.id} className={`border rounded-2xl p-4 ${card} ${a.is_pinned ? 'border-yellow-500/50 ring-1 ring-yellow-500/20' : ''}`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {a.is_pinned && <Pin size={14} className="text-yellow-400 shrink-0" />}
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-bold ${cfg.bg} ${cfg.color}`}>
                      {cfg.emoji} {a.category}
                    </span>
                  </div>
                  {isManager && (
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => startEdit(a)} className="text-blue-400 hover:text-blue-300 p-1"><Edit2 size={14} /></button>
                      <button onClick={() => handleDelete(a.id)} className="text-red-400 hover:text-red-300 p-1"><Trash2 size={14} /></button>
                    </div>
                  )}
                </div>
                <h4 className="font-bold text-sm mb-1">{a.title}</h4>
                <p className={`text-sm leading-relaxed ${subtext}`}>{a.body}</p>
                <div className={`flex items-center gap-3 mt-3 pt-3 border-t ${isDark ? 'border-slate-700' : 'border-gray-100'}`}>
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                    {(a.author_name || 'M')[0]}
                  </div>
                  <div>
                    <p className={`text-xs font-semibold ${subtext}`}>{a.author_name || 'Management'}</p>
                    <p className={`text-xs ${subtext}`}>{new Date(a.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AnnouncementBoard;
