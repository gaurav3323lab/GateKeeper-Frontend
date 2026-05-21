import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import ISTClock from './ISTClock';
import MyFlat from './MyFlat';
import ResidentGarage from './ResidentGarage';
import ServiceRequest from './ServiceRequest';
import PreApprove from './PreApprove';
import UserProfile from './UserProfile';
import ResidentLogs from './ResidentLogs';
import AdBanner from './AdBanner';
import QuickActionsFAB from './QuickActionsFAB';
import { entryAPI, announcementAPI, serviceAPI } from '../services/api';
import {
  Home, Car, Wrench, CheckCircle, LogOut, AlertTriangle,
  Megaphone, List, HeartHandshake, Phone, Calendar,
  Check, X, Share2, Search, MessageSquare, Bell, UserPlus,
  ChevronRight, Send, MoreVertical, ThumbsUp, ShieldCheck,
} from 'lucide-react';

const NAV_ITEMS = [
  { key: 'community', label: 'Community', icon: HeartHandshake },
  { key: 'flat', label: 'My Flat', icon: Home },
  { key: 'garage', label: 'Garage', icon: Car },
  { key: 'service', label: 'Service', icon: Wrench },
  { key: 'preapprove', label: 'Pre-Approve', icon: CheckCircle },
  { key: 'logs', label: 'Logs', icon: List },
];

const ResidentDashboard = ({ user, onLogout, sharedSocket }) => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('community');
  const [sosActive, setSosActive] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const noticesRef = useRef(null); // Notices section scroll ref

  // MOCK INTERACTION STATES
  // 1. Poll State
  const [pollVotes, setPollVotes] = useState({ owners: 52, tenants: 52, others: 52 });
  const [votedOption, setVotedOption] = useState(null);
  const [totalVotes, setTotalVotes] = useState(24);

  // 2. Comments State
  const [comments, setComments] = useState([
    { author: 'Adarsh Shah', text: 'I have 3 passes left, let me know if you want them!', time: '1 hr ago' }
  ]);
  const [newCommentText, setNewCommentText] = useState('');
  const [showComments, setShowComments] = useState(true);

  // 3. Like State
  const [feedLiked, setFeedLiked] = useState(false);

  // 4. Modal Triggers
  const [showDirectoryModal, setShowDirectoryModal] = useState(false);
  const [showPlannerModal, setShowPlannerModal] = useState(false);
  const [showPreapproveModal, setShowPreapproveModal] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);

  // 5. Real data from backend
  const [realNotices, setRealNotices] = useState([]);
  const [realContacts, setRealContacts] = useState([]);
  const [openServiceCount, setOpenServiceCount] = useState(0);
  const [dataLoading, setDataLoading] = useState(true);
  const [unreadNoticeCount, setUnreadNoticeCount] = useState(0); // Bell badge
  const [postText, setPostText] = useState(''); // Create Post modal
  const [postLoading, setPostLoading] = useState(false);
  const [sosLoading, setSosLoading] = useState(false);
  
  // Pre-approve pass state (real API)
  const [guestPass, setGuestPass] = useState(null);
  const [passLoading, setPassLoading] = useState(false);
  const [preapproveForm, setPreapproveForm] = useState({ name: '', category: 'Guest', phone: '', time: 'Immediate', vehicle_number: '' });

  // Daily helpers from backend (inside visitors for this flat)
  const [dailyHelpers, setDailyHelpers] = useState([]);

  // Home Planner tasks
  const [tasks, setTasks] = useState([
    { id: 1, text: 'Collect Amazon package from gate', done: false },
    { id: 2, text: 'Maid arrival check', done: true },
    { id: 3, text: 'Water plants', done: false },
    { id: 4, text: 'Pay maintenance dues', done: false }
  ]);

  // Handle Poll Vote
  const handleVote = (option) => {
    if (votedOption) return; // Prevent double voting
    setVotedOption(option);
    setTotalVotes(prev => prev + 1);
    setPollVotes(prev => {
      const updated = { ...prev };
      updated[option] = updated[option] + 1;
      return updated;
    });
  };

  // Handle Comment Submission
  const handleAddComment = (e) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    setComments(prev => [...prev, { author: user?.name || 'You', text: newCommentText, time: 'Just now' }]);
    setNewCommentText('');
  };

  // Generate REAL pre-approved pass using backend API
  const handleGeneratePass = async (e) => {
    e.preventDefault();
    if (!preapproveForm.name) return alert('Name fill kijiye');
    setPassLoading(true);
    try {
      const isDelivery = preapproveForm.category === 'Delivery';

      // 📅 Calculate real expiration timestamp based on dropdown selection
      const now = new Date();
      if (preapproveForm.time === 'Immediate' || preapproveForm.time === '2 Hours') {
        now.setHours(now.getHours() + 2);
      } else if (preapproveForm.time === '4 Hours') {
        now.setHours(now.getHours() + 4);
      } else if (preapproveForm.time === 'Today') {
        now.setHours(23, 59, 59, 999);
      } else if (preapproveForm.time === 'Tomorrow') {
        now.setDate(now.getDate() + 1);
        now.setHours(23, 59, 59, 999);
      } else {
        // Fallback: 24 hours
        now.setHours(now.getHours() + 24);
      }
      const validDateStr = now.toISOString().slice(0, 19).replace('T', ' ');

      // 🚗 Append vehicle number if provided
      let finalPurpose = preapproveForm.category || 'Guest';
      if (preapproveForm.vehicle_number) {
        finalPurpose = `${finalPurpose} (${preapproveForm.vehicle_number})`;
      }

      const payload = {
        type: isDelivery ? 'delivery' : 'guest',
        company: isDelivery ? (preapproveForm.vehicle_number ? `${preapproveForm.name} (${preapproveForm.vehicle_number})` : preapproveForm.name) : undefined,
        name: isDelivery ? undefined : preapproveForm.name,
        phone: preapproveForm.phone || '',
        purpose: finalPurpose,
        valid_date: validDateStr
      };

      const res = await entryAPI.addPreApproval(payload);
      // Fetch the newly created guest or delivery to get the real PIN
      const allRes = await entryAPI.getPreApprovals();
      const targetType = isDelivery ? 'delivery' : 'guest';
      const newEntry = (allRes.data || []).find(a => a.id === res.data.id && a.type === targetType);
      setGuestPass({
        code: isDelivery ? 'PRE-APPROVED' : (newEntry?.qr_code || res.data.id),
        name: preapproveForm.name,
        category: preapproveForm.category,
        time: preapproveForm.time || 'Immediate Entry'
      });
    } catch (err) {
      console.error('Pre-approve failed:', err);
      alert('Pre-approval save nahi ho saka. Please Pre-Approve tab use karein.');
    } finally {
      setPassLoading(false);
    }
  };


  // Toggle Home Planner tasks
  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  // Fetch real community data on mount
  useEffect(() => {
    const fetchCommunityData = async () => {
      setDataLoading(true);
      try {
        const [noticesRes, contactsRes, serviceRes, logsRes] = await Promise.allSettled([
          announcementAPI.getAll(),
          entryAPI.getSocietyContacts(),
          serviceAPI.getResidentRequests(),
          entryAPI.getResidentLogs(),
        ]);
        if (noticesRes.status === 'fulfilled') {
          const notices = noticesRes.value.data || [];
          setRealNotices(notices);
          // Count unread: notices newer than last-seen timestamp
          const lastSeen = parseInt(localStorage.getItem('notices_last_seen') || '0', 10);
          const unread = notices.filter(n => new Date(n.created_at).getTime() > lastSeen).length;
          setUnreadNoticeCount(unread);
        }
        if (contactsRes.status === 'fulfilled') {
          const data = contactsRes.value.data || {};
          const guards = data.guards || [];
          const helplines = data.helplines || [];
          const list = [
            ...guards.map(g => ({
              name: g.name,
              designation: 'Society Security Guard 🛡️',
              phone: g.phone
            })),
            ...helplines.map(h => ({
              name: h.name,
              designation: h.category || 'Emergency Helpline',
              phone: h.phone
            }))
          ];
          setRealContacts(list);
        }
        if (serviceRes.status === 'fulfilled') {
          const open = (serviceRes.value.data || []).filter(r => r.status === 'Open').length;
          setOpenServiceCount(open);
        }
        // Build daily helpers from real resident logs (guests currently inside)
        if (logsRes.status === 'fulfilled') {
          const logs = logsRes.value.data || [];
          const roleEmoji = { Guest: '🧑', Vehicle: '🚗', Delivery: '📦' };
          const insideGuests = logs
            .filter(l => l.type === 'Guest' && l.entry_time && !l.exit_time)
            .slice(0, 3)
            .map(l => ({
              name: l.name || 'Guest',
              role: l.purpose || 'Guest',
              status: 'Inside',
              time: new Date(l.entry_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
              avatar: roleEmoji[l.type] || '🧑'
            }));
          setDailyHelpers(insideGuests);
        }
      } catch (e) {
        console.error('Community data fetch error:', e);
      } finally {
        setDataLoading(false);
      }
    };
    fetchCommunityData();
  }, []);

  // NOTE: visitor_notification is handled by NotificationManager (ringtone + call modal)
  // No duplicate listener here.

  const handleSOS = async () => {
    if (sosActive) return;
    setSosActive(true);

    try {
      await entryAPI.sos({
        user_id: user.id,
        flat_number: user.flat_number,
        user_name: user.name
      });

      if (sharedSocket) {
        sharedSocket.emit('trigger_sos', {
          user_id: user.id,
          user_name: user.name,
          flat_number: user.flat_number
        });
      }

      alert(`🚨 SOS Alert sent! Guard aur Manager ko turant notification gayi — Flat ${user.flat_number}`);
    } catch (err) {
      console.error('SOS failed:', err);
      if (sharedSocket) {
        sharedSocket.emit('trigger_sos', {
          user_id: user.id,
          user_name: user.name,
          flat_number: user.flat_number
        });
      }
      alert('SOS bheja gaya! Guard ko notification mil gayi.');
    } finally {
      setTimeout(() => setSosActive(false), 5000);
    }
  };


  const bg = isDark ? 'bg-[#0f172a] text-white' : 'bg-slate-50 text-gray-800';
  const bottomNav = isDark ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-gray-200';
  const subtext = isDark ? 'text-slate-400' : 'text-gray-500';
  const cardBg = isDark ? 'bg-slate-800/80 border-slate-700/50' : 'bg-white border-gray-200';

  const renderContent = () => {
    switch (activeTab) {
      case 'community':
        return (
          <div className="space-y-4">
            {/* Society Banner Hero */}
            <div className="relative rounded-3xl overflow-hidden h-36 shadow-lg">
              <img
                src="/society_banner.png"
                alt="Society"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-4">
                <p className="text-white font-black text-sm leading-tight drop-shadow">Green Valley Apartments</p>
                <p className="text-white/70 text-[10px] font-semibold">📍 Mumbai &bull; Block H &bull; Flat {user?.flat_number || '102'}</p>
              </div>
              <div className="absolute top-3 right-3">
                <span className="bg-emerald-500 text-white text-[8px] font-black px-2 py-1 rounded-full shadow">🟢 LIVE</span>
              </div>
            </div>
            {/* Quick Helper Horizontal Contacts (Image 3 Top Scroller) */}
            <div>
              <p className={`text-[10px] font-bold tracking-wider uppercase mb-2 ${subtext}`}>Daily Help & Pre-approvals</p>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                <button onClick={() => setShowPreapproveModal(true)} className="flex flex-col items-center gap-1 shrink-0">
                  <div className="w-12 h-12 rounded-full border border-dashed border-indigo-500/40 bg-indigo-500/5 flex items-center justify-center text-indigo-400">
                    <UserPlus size={20} />
                  </div>
                  <span className="text-[10px] font-medium">Pre-approve</span>
                </button>
                {dailyHelpers.map((h, i) => (
                  <div key={i} className="flex flex-col items-center gap-1 shrink-0 relative">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-lg relative">
                      {h.avatar}
                      <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center ${h.status === 'Inside' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    </div>
                    <span className="text-[10px] font-bold">{h.name.split(' ')[0]}</span>
                    <span className={`text-[8px] ${subtext}`}>{h.role}</span>
                  </div>
                ))}
                <button onClick={() => setShowDirectoryModal(true)} className="flex flex-col items-center gap-1 shrink-0">
                  <div className="w-12 h-12 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <ChevronRight size={20} />
                  </div>
                  <span className="text-[10px] font-medium text-indigo-400">View All</span>
                </button>
              </div>
            </div>

            {/* Category Shortcuts Grid */}
            <div className={`p-4 rounded-3xl border shadow-sm grid grid-cols-4 gap-3 ${cardBg}`}>
              {[
                { label: 'Home Planner', icon: Calendar, color: 'text-rose-500 bg-rose-500/10', action: () => setShowPlannerModal(true) },
                { label: openServiceCount > 0 ? `Helpdesk (${openServiceCount})` : 'Helpdesk', icon: Wrench, color: 'text-amber-500 bg-amber-500/10', action: () => setActiveTab('service') },
                { label: 'My Garage', icon: Car, color: 'text-sky-500 bg-sky-500/10', action: () => setActiveTab('garage') },
                { label: 'Pre-Approve', icon: ShieldCheck, color: 'text-violet-500 bg-violet-500/10', action: () => setShowPreapproveModal(true) },
                { label: 'Directory', icon: Search, color: 'text-indigo-500 bg-indigo-500/10', action: () => setShowDirectoryModal(true) },
                { label: 'Notices', icon: Megaphone, color: 'text-pink-500 bg-pink-500/10', action: () => {
                    // Scroll to notices section within community tab
                    setActiveTab('community');
                    setTimeout(() => noticesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
                  } },
                { label: 'SOS Alert', icon: AlertTriangle, color: 'text-red-500 bg-red-500/10', action: handleSOS },
                { label: 'My Flat', icon: Home, color: 'text-emerald-500 bg-emerald-500/10', action: () => setActiveTab('flat') },
              ].map((item, idx) => (
                <button key={idx} onClick={item.action} className="flex flex-col items-center gap-1.5 p-1 hover:scale-105 active:scale-95 transition-all">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${item.color} shadow-sm`}>
                    <item.icon size={18} strokeWidth={2.2} />
                  </div>
                  <span className="text-[9px] font-bold text-center leading-tight tracking-tight text-slate-700 dark:text-slate-300">{item.label}</span>
                </button>
              ))}
            </div>

            {/* Create Post Capsule Panel */}
            <div className={`p-4 rounded-3xl border shadow-sm ${cardBg}`}>
              <p className={`text-[10px] font-black uppercase tracking-wider mb-2.5 ${subtext}`}>Create community update</p>
              <div className="flex gap-2.5">
                <button
                  onClick={() => setShowPostModal(true)}
                  className="flex-1 px-4 py-2.5 rounded-full flex items-center justify-center gap-1.5 text-[10px] font-black tracking-wide active:scale-95 transition-all bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                >
                  <Megaphone size={12} strokeWidth={2.5} />
                  Create Post
                </button>
                <button
                  onClick={() => alert('Poll feature coming soon!')}
                  className="flex-1 px-4 py-2.5 rounded-full flex items-center justify-center gap-1.5 text-[10px] font-black tracking-wide active:scale-95 transition-all bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                >
                  <CheckCircle size={12} strokeWidth={2.5} />
                  Start Poll
                </button>
              </div>
            </div>

            {/* LIVE FEEDS */}

            {/* 1. Interactive Poll Card (Image 1 Social Feed) */}
            <div className={`rounded-3xl border shadow-sm overflow-hidden ${cardBg}`}>
              {/* Card Header */}
              <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-700/40">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-violet-600 text-white font-bold flex items-center justify-center text-xs">LD</div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Lokesh D</p>
                      <span className="text-[8px] bg-sky-500/10 text-sky-500 font-bold px-1.5 py-0.5 rounded-full">Admin</span>
                    </div>
                    <p className={`text-[9px] ${subtext}`}>H 102 &bull; 1 hr ago &bull; 👥 Public</p>
                  </div>
                </div>
                <button className="text-slate-400 hover:text-slate-600"><MoreVertical size={14} /></button>
              </div>

              {/* Poll Body */}
              <div className="p-4 space-y-3 bg-[#e0eff8]/50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-700/40">
                <h3 className="text-xs font-bold leading-relaxed text-slate-900 dark:text-slate-100">
                  Who should be allowed to vote for social issues in society? 🗳️
                </h3>

                {/* Poll Options */}
                <div className="space-y-2">
                  {[
                    { key: 'owners', label: 'Owners', pct: pollVotes.owners },
                    { key: 'tenants', label: 'Tenants', pct: pollVotes.tenants },
                    { key: 'others', label: 'Other members who can vote', pct: pollVotes.others },
                  ].map((opt) => {
                    const isSelected = votedOption === opt.key;
                    return (
                      <button 
                        key={opt.key} 
                        onClick={() => handleVote(opt.key)}
                        className={`w-full relative rounded-2xl p-3 flex items-center justify-between overflow-hidden border text-left transition-all ${
                          votedOption 
                            ? isSelected ? 'border-indigo-500/60 bg-indigo-500/5' : 'border-slate-200 dark:border-slate-700' 
                            : 'border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
                        }`}
                      >
                        {/* Progress Bar background */}
                        {votedOption && (
                          <div 
                            className="absolute left-0 top-0 bottom-0 bg-indigo-500/15 transition-all duration-1000 ease-out"
                            style={{ width: `${opt.pct}%` }}
                          />
                        )}
                        <span className="text-xs font-bold z-10 text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          {opt.label}
                          {isSelected && <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full inline-block animate-ping" />}
                        </span>
                        <div className="flex items-center gap-1.5 z-10 text-xs font-black text-slate-700 dark:text-slate-300">
                          {isSelected && <Check size={12} className="text-indigo-500 font-bold" />}
                          <span>{opt.pct}%</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className={`flex items-center justify-between text-[8px] pt-1.5 font-bold ${subtext}`}>
                  <span className="flex items-center gap-1">🗳️ {totalVotes} Votes &bull; 6 days left</span>
                  <span>1 Vote per flat &bull; Multiple allowed</span>
                </div>
              </div>

              {/* Feed Card Footer Actions */}
              <div className="px-4 py-2 flex items-center justify-between text-xs">
                <button 
                  onClick={() => setFeedLiked(!feedLiked)}
                  className={`flex items-center gap-1.5 py-1 ${feedLiked ? 'text-indigo-400 font-black' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <ThumbsUp size={12} strokeWidth={feedLiked ? 2.5 : 1.5} />
                  <span>{feedLiked ? 'Liked' : 'Like'}</span>
                </button>
                <button 
                  onClick={() => setShowComments(!showComments)}
                  className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600"
                >
                  <MessageSquare size={12} />
                  <span>{comments.length} Comments</span>
                </button>
                <button className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600">
                  <Share2 size={12} />
                  <span>Share</span>
                </button>
              </div>

              {/* Poll Comment Threads */}
              {showComments && (
                <div className="px-4 pb-4 pt-1.5 border-t border-slate-100 dark:border-slate-700/40 bg-slate-50/50 dark:bg-slate-900/10">
                  <div className="space-y-2 mb-3">
                    {comments.map((c, i) => (
                      <div key={i} className="flex gap-2 items-start text-[11px] leading-relaxed">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold flex items-center justify-center text-[8px]">{c.author.charAt(0)}</div>
                        <div className="flex-1 bg-slate-100/80 dark:bg-slate-800/80 p-2 rounded-2xl border border-slate-200/40 dark:border-slate-700/40">
                          <p className="font-bold text-slate-800 dark:text-slate-200">{c.author} <span className={`text-[8px] font-normal font-sans ${subtext}`}>{c.time}</span></p>
                          <p className="text-slate-600 dark:text-slate-300">{c.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={handleAddComment} className="flex gap-1.5">
                    <input 
                      type="text" 
                      placeholder="Add your thoughts..." 
                      value={newCommentText} 
                      onChange={e => setNewCommentText(e.target.value)}
                      className={`flex-1 border rounded-full px-3 py-2 text-[10px] outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-gray-800'}`}
                    />
                    <button type="submit" className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
                      <Send size={12} />
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* 2. REAL NOTICES from AnnouncementBoard API */}
            <div ref={noticesRef} className="space-y-3" onClick={() => {
                // Mark all as read when user opens notices section
                localStorage.setItem('notices_last_seen', String(Date.now()));
                setUnreadNoticeCount(0);
              }}>
              <p className={`text-[10px] font-black uppercase tracking-wider ${subtext}`}>📢 Society Notices</p>
              {dataLoading ? (
                <div className={`p-6 rounded-3xl border text-center ${cardBg}`}>
                  <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : realNotices.length === 0 ? (
                <div className={`p-6 rounded-3xl border text-center ${cardBg}`}>
                  <Megaphone size={28} className="mx-auto opacity-20 mb-2" />
                  <p className={`text-xs ${subtext}`}>Abhi koi notice nahi hai</p>
                </div>
              ) : (
                realNotices.slice(0, 3).map((notice) => {
                  const categoryColors = {
                    General: 'border-blue-500/30 bg-blue-500/5',
                    Maintenance: 'border-orange-500/30 bg-orange-500/5',
                    Emergency: 'border-red-500/30 bg-red-500/5',
                    Event: 'border-purple-500/30 bg-purple-500/5',
                    Notice: 'border-yellow-500/30 bg-yellow-500/5',
                  };
                  const categoryEmoji = { General: '📢', Maintenance: '🔧', Emergency: '🚨', Event: '🎉', Notice: '📌' };
                  const borderBg = categoryColors[notice.category] || categoryColors.General;
                  return (
                    <div key={notice.id} className={`rounded-3xl border overflow-hidden shadow-sm ${borderBg}`}>
                      {/* Event image only on Event category */}
                      {notice.category === 'Event' && (
                        <div className="h-24 overflow-hidden">
                          <img src="/event_banner.png" alt="Event" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{categoryEmoji[notice.category] || '📢'}</span>
                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">{notice.category}</span>
                            {notice.is_pinned === 1 && (
                              <span className="text-[8px] bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 font-bold px-1.5 py-0.5 rounded-full">PINNED</span>
                            )}
                          </div>
                          <span className={`text-[9px] ${subtext}`}>
                            {new Date(notice.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                        <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 leading-snug mb-1">{notice.title}</h4>
                        <p className={`text-[11px] leading-relaxed ${subtext}`}>{notice.body}</p>
                        <div className={`flex items-center gap-2 mt-2.5 pt-2.5 border-t ${isDark ? 'border-slate-700/50' : 'border-slate-100'}`}>
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-[8px] font-bold">
                            {(notice.author_name || 'M')[0]}
                          </div>
                          <span className={`text-[9px] font-semibold ${subtext}`}>{notice.author_name || 'Management'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              {realNotices.length > 3 && (
                <button
                  onClick={() => setActiveTab('logs')}
                  className={`w-full py-2.5 rounded-2xl border text-[10px] font-bold ${isDark ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-500'} flex items-center justify-center gap-1.5`}
                >
                  View all {realNotices.length} notices <ChevronRight size={12} />
                </button>
              )}
            </div>
            
            <AdBanner />
          </div>
        );
      case 'flat': return <MyFlat user={user} />;
      case 'garage': return <ResidentGarage />;
      case 'service': return <ServiceRequest user={user} />;
      case 'preapprove': return <PreApprove user={user} />;
      case 'logs': return <ResidentLogs user={user} sharedSocket={sharedSocket} />;
      default: return null;
    }
  };

  return (
    <div className={`min-h-screen transition-all duration-300 ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-100 text-gray-900'}`}>
      
      {/* CLEAN MOBILE-WIDTH CENTERED LAYOUT */}
      <div className="min-h-screen flex justify-center">
        <div className={`w-full max-w-md flex flex-col relative ${bg}`}>

          {/* INNER VIEWPORT */}
          <div className={`flex-1 overflow-y-auto pb-24 relative ${bg} scrollbar-none`}>
            



            {/* Sticky Mobile Header (Image 1 top screen header) */}
            <header className={`sticky top-0 z-40 px-4 py-3 border-b flex items-center justify-between backdrop-blur-md
              ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-100'}`}>
              <div className="flex items-center gap-1">
                <button onClick={() => setShowProfile(true)} className="flex items-center gap-1 font-extrabold text-sm text-indigo-400 font-sans tracking-wide">
                  <span>H {user?.flat_number || '102'}</span>
                  <span className="text-xs text-slate-400 font-normal">v</span>
                </button>
              </div>

              {/* Header icons: Search, bell, chat, profile, logout */}
              <div className="flex items-center gap-3 text-slate-400">
                <button className="hover:text-slate-600"><Search size={16} /></button>
                <button className="hover:text-slate-600 relative" onClick={() => {
                    setActiveTab('community');
                    setTimeout(() => noticesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
                  }}>
                  <Bell size={16} />
                  {unreadNoticeCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] rounded-full bg-red-500 text-white text-[8px] font-black flex items-center justify-center px-0.5">{unreadNoticeCount}</span>
                  )}
                </button>
                <button onClick={() => alert('Community Chat feature is coming soon!')} className="hover:text-slate-600 relative">
                  <MessageSquare size={16} />
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[8px] px-1 rounded-full font-bold">1</span>
                </button>
                <button onClick={() => setShowProfile(true)} className="w-6 h-6 rounded-full overflow-hidden bg-slate-200 border border-indigo-400">
                  <div className="w-full h-full bg-indigo-500 text-white font-bold flex items-center justify-center text-[10px]">
                    {user?.name?.charAt(0) || 'R'}
                  </div>
                </button>
                <button
                  onClick={onLogout}
                  title="Logout"
                  className="w-6 h-6 flex items-center justify-center text-red-400 hover:text-red-500 transition-colors"
                >
                  <LogOut size={15} strokeWidth={2.5} />
                </button>
              </div>
            </header>

            {/* App main contents */}
            <main className="p-4 space-y-4">
              {renderContent()}
            </main>

            {/* Quick Actions floating FAB */}
            <QuickActionsFAB 
              onSOS={handleSOS} 
              onPreApprove={() => setShowPreapproveModal(true)} 
              onService={() => setActiveTab('service')} 
            />

            {/* Bottom Tab Navigation */}
            <nav className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40 border-t backdrop-blur-md ${bottomNav}`}>
              <div className="flex">
                {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
                  const active = activeTab === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setActiveTab(key)}
                      className={`flex-1 py-3.5 flex flex-col items-center gap-0.5 transition-all ${
                        active
                          ? 'text-indigo-500'
                          : isDark ? 'text-slate-500 hover:text-slate-300' : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      <Icon size={18} strokeWidth={active ? 2.5 : 1.5} />
                      <span className="text-[8px] font-black tracking-wide leading-none">{label}</span>
                      {active && <div className="w-5 h-0.5 bg-indigo-500 rounded-full mt-1" />}
                    </button>
                  );
                })}
              </div>
            </nav>

          </div>
        </div>
      </div>

      {/* USER PROFILE MODAL */}
      <UserProfile isOpen={showProfile} onClose={() => setShowProfile(false)} />

      {/* MYGATE UTILITY MOCKUP MODALS */}

      {/* 1. PRE-APPROVED PASS GENERATOR MODAL */}
      {showPreapproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-sm rounded-[30px] p-6 border shadow-2xl ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-sm flex items-center gap-1.5"><ShieldCheck size={18} className="text-indigo-500" /> Pre-approve Guest Pass</h3>
              <button onClick={() => { setShowPreapproveModal(false); setGuestPass(null); }} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>

            {guestPass ? (
              <div className="text-center py-4 space-y-4">
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto text-3xl">
                  🔑
                </div>
                <div>
                  <p className={`text-xs ${subtext}`}>Share this Gate Passcode with {guestPass.name}</p>
                  <h1 className="text-3xl font-black tracking-widest text-indigo-500 mt-2">{guestPass.code}</h1>
                </div>
                <div className={`p-3 rounded-2xl text-[10px] ${isDark ? 'bg-slate-800' : 'bg-slate-50'} text-left`}>
                  <p><strong>Visitor:</strong> {guestPass.name} ({guestPass.category})</p>
                  <p><strong>Valid Time:</strong> {guestPass.time}</p>
                  <p><strong>Gate Action:</strong> Guard will enter this code at gate scanner to verify entry instantly.</p>
                </div>
                <button 
                  onClick={() => { alert('Mock WhatsApp shared successfully!'); setPreapproveForm({ name: '', category: 'Guest', phone: '', time: '' }); setGuestPass(null); setShowPreapproveModal(false); }}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-2xl shadow-lg flex items-center justify-center gap-1.5 transition-all"
                >
                  <Share2 size={14} /> Share Pass (WhatsApp)
                </button>
              </div>
            ) : (
              <form onSubmit={handleGeneratePass} className="space-y-3">
                <div>
                  <label className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 block ${subtext}`}>Visitor Type</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {['Guest', 'Cab', 'Delivery', 'Helper'].map((cat) => (
                      <button 
                        key={cat}
                        type="button"
                        onClick={() => setPreapproveForm({...preapproveForm, category: cat})}
                        className={`py-2 rounded-xl text-[9px] font-black border transition-all ${
                          preapproveForm.category === cat 
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={`text-[10px] font-bold uppercase tracking-wider mb-1 block ${subtext}`}>Visitor Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Swiggy Agent, Rahul Mehta" 
                    value={preapproveForm.name}
                    onChange={e => setPreapproveForm({...preapproveForm, name: e.target.value})}
                    required
                    className={`w-full rounded-xl border px-3 py-2 text-xs outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                  />
                </div>

                <div>
                  <label className={`text-[10px] font-bold uppercase tracking-wider mb-1 block ${subtext}`}>Mobile Number (Optional)</label>
                  <input 
                    type="tel" 
                    placeholder="e.g. +91 99999 88888" 
                    value={preapproveForm.phone}
                    onChange={e => setPreapproveForm({...preapproveForm, phone: e.target.value})}
                    className={`w-full rounded-xl border px-3 py-2 text-xs outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                  />
                </div>

                <div>
                  <label className={`text-[10px] font-bold uppercase tracking-wider mb-1 block ${subtext}`}>Vehicle Number (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. MH 12 AB 1234" 
                    value={preapproveForm.vehicle_number || ''}
                    onChange={e => setPreapproveForm({...preapproveForm, vehicle_number: e.target.value.toUpperCase()})}
                    className={`w-full rounded-xl border px-3 py-2 text-xs outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                  />
                </div>

                <div>
                  <label className={`text-[10px] font-bold uppercase tracking-wider mb-1 block ${subtext}`}>Arrival Time Slot</label>
                  <select 
                    value={preapproveForm.time || 'Immediate'}
                    onChange={e => setPreapproveForm({...preapproveForm, time: e.target.value})}
                    className={`w-full rounded-xl border px-3 py-2 text-xs outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                  >
                    <option value="Immediate">Immediate (Valid for 2 Hours)</option>
                    <option value="2 Hours">Next 2 Hours</option>
                    <option value="4 Hours">Next 4 Hours</option>
                    <option value="Today">Today (Full Day)</option>
                    <option value="Tomorrow">Tomorrow (Full Day)</option>
                  </select>
                </div>

                <button 
                  type="submit"
                  disabled={passLoading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-extrabold text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  {passLoading ? (
                    <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" /> Saving...</>
                  ) : 'Create Pre-approval Pass ✅'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}



      {/* 3. HOME PLANNER TASK LIST MODAL */}
      {showPlannerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-sm rounded-[30px] p-6 border shadow-2xl ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-sm flex items-center gap-1.5"><Calendar size={18} className="text-rose-500" /> Home Chores Planner</h3>
              <button onClick={() => setShowPlannerModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>

            <div className="space-y-3">
              <p className={`text-[10px] ${subtext} leading-relaxed`}>Track daily chores, deliveries, and helper notifications inside your flat.</p>
              
              <div className="space-y-2">
                {tasks.map((task) => (
                  <button 
                    key={task.id}
                    onClick={() => toggleTask(task.id)}
                    className={`w-full p-3 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                      task.done 
                        ? 'bg-emerald-500/5 border-emerald-500/25 text-slate-400 line-through' 
                        : isDark ? 'bg-slate-850 border-slate-700 text-white hover:border-slate-600' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${task.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300'}`}>
                      {task.done && <Check size={10} strokeWidth={3} />}
                    </div>
                    <span className="text-xs font-bold">{task.text}</span>
                  </button>
                ))}
              </div>

              <div className="pt-2 flex gap-1.5">
                <input 
                  type="text" 
                  placeholder="Create custom task..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.target.value.trim()) {
                      setTasks([...tasks, { id: Date.now(), text: e.target.value, done: false }]);
                      e.target.value = '';
                    }
                  }}
                  className={`flex-1 border rounded-xl px-3 py-2.5 text-xs outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. SOCIETY INTERCOM & CONTACTS DIRECTORY MODAL */}
      {showDirectoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-sm rounded-[30px] p-6 border shadow-2xl ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-extrabold text-sm flex items-center gap-1.5"><Search size={18} className="text-indigo-500" /> Intercom & Staff Directory</h3>
              <button onClick={() => setShowDirectoryModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search flat number, helper role, or name..." 
                  className={`w-full rounded-xl border pl-9 pr-3 py-2 text-xs outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                />
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {(realContacts.length > 0 ? realContacts : [
                  { name: 'Gate Security Cabin', designation: 'Main Gatehouse Intercom', phone: '1000' },
                ]).map((c, i) => (
                  <div key={i} className={`p-3 rounded-2xl border flex items-center justify-between ${isDark ? 'bg-slate-850 border-slate-700/50' : 'bg-slate-50 border-slate-200'}`}>
                    <div>
                      <p className="text-xs font-black">{c.name}</p>
                      <p className={`text-[9px] font-medium ${subtext}`}>{c.designation || c.role} &bull; {c.phone}</p>
                    </div>
                    <a href={`tel:${c.phone}`} className="w-8 h-8 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white flex items-center justify-center shadow-md shrink-0 transition-all">
                      <Phone size={14} />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. CREATE COMMUNITY POST MODAL */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-sm rounded-[30px] p-6 border shadow-2xl ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-sm flex items-center gap-1.5"><Megaphone size={16} className="text-pink-500" /> Post Society Notice</h3>
              <button onClick={() => { setShowPostModal(false); setPostText(''); }} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>

            <div className="space-y-3">
              <p className={`text-[10px] ${subtext} leading-relaxed`}>Aapki notice society members ko dikhegi. Manager se approval ke baad publish hogi.</p>
              <textarea 
                placeholder="Kya share karna chahte hain? e.g. Water cut on Thursday 10AM–2PM..."
                rows={4}
                value={postText}
                onChange={e => setPostText(e.target.value)}
                className={`w-full border rounded-2xl p-3 text-xs outline-none resize-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
              />
              <div className="flex gap-2 justify-end">
                <button onClick={() => { setShowPostModal(false); setPostText(''); }} className={`px-4 py-2 border rounded-xl text-xs font-bold ${isDark ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                  Cancel
                </button>
                <button 
                  disabled={postLoading || !postText.trim()}
                  onClick={async () => {
                    if (!postText.trim()) return;
                    setPostLoading(true);
                    try {
                      await announcementAPI.create({ title: postText.trim().slice(0, 80), body: postText.trim(), category: 'General' });
                      setPostText('');
                      setShowPostModal(false);
                      alert('✅ Notice submit ho gayi! Manager approve karega.');
                    } catch (err) {
                      alert('Post submit nahi hui. Please try again.');
                    } finally {
                      setPostLoading(false);
                    }
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5"
                >
                  {postLoading ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" /> : null}
                  Submit Notice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ResidentDashboard;
