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
import { entryAPI, announcementAPI, serviceAPI, communityAPI, authAPI } from '../services/api';
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

  // 1. Unified Community Feed Posts state
  const [posts, setPosts] = useState([]);
  const [visibleComments, setVisibleComments] = useState({});
  const [newCommentTexts, setNewCommentTexts] = useState({});

  // 2. Modal & Tab Triggers
  const [showDirectoryModal, setShowDirectoryModal] = useState(false);
  const [showPlannerModal, setShowPlannerModal] = useState(false);
  const [showPreapproveModal, setShowPreapproveModal] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);

  // 3. Unified Post & Poll Creator State
  const [creatorTab, setCreatorTab] = useState('feed_post'); // 'feed_post', 'poll', 'notice'
  const [feedPostTitle, setFeedPostTitle] = useState('');
  const [feedPostBody, setFeedPostBody] = useState('');
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOpts, setPollOpts] = useState(['', '', '']); // up to 3 options

  // 4. Real data from backend
  const [realNotices, setRealNotices] = useState([]);
  const [realContacts, setRealContacts] = useState([]);
  const [openServiceCount, setOpenServiceCount] = useState(0);
  const [dataLoading, setDataLoading] = useState(true);
  const [unreadNoticeCount, setUnreadNoticeCount] = useState(0); // Bell badge
  const [postText, setPostText] = useState(''); // Notice text (notice tab)
  const [postLoading, setPostLoading] = useState(false);
  const [sosLoading, setSosLoading] = useState(false);
  
  // Pre-approve pass state (real API)
  const [guestPass, setGuestPass] = useState(null);
  const [passLoading, setPassLoading] = useState(false);
  const [preapproveForm, setPreapproveForm] = useState({ name: '', category: 'Guest', phone: '', time: 'Immediate', vehicle_number: '' });

  // Real flat visitor logs and custom flat tasks
  const [recentFlatVisitors, setRecentFlatVisitors] = useState([]);
  const [societyDetails, setSocietyDetails] = useState({ name: '', address: '', city: '' });
  const [dailyHelpers, setDailyHelpers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [directorySearch, setDirectorySearch] = useState('');

  // Fetch helpers & feed functions
  const [fetchingPosts, setFetchingPosts] = useState(false);

  const copyToClipboard = (text) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => {
          alert('Copied to clipboard!');
        })
        .catch(() => {
          fallbackCopyToClipboard(text);
        });
    } else {
      fallbackCopyToClipboard(text);
    }
  };

  const fallbackCopyToClipboard = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.width = "2em";
    textArea.style.height = "2em";
    textArea.style.padding = "0";
    textArea.style.border = "none";
    textArea.style.outline = "none";
    textArea.style.boxShadow = "none";
    textArea.style.background = "transparent";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        alert('Copied to clipboard!');
      } else {
        alert(`Content: ${text}`);
      }
    } catch (err) {
      console.error('Fallback copy failed:', err);
      alert(`Content: ${text}`);
    }
    document.body.removeChild(textArea);
  };

  const fetchPosts = async () => {
    try {
      const res = await communityAPI.getPosts();
      setPosts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching posts:', err);
    }
  };

  const fetchChores = async () => {
    try {
      const res = await communityAPI.getChores();
      setTasks(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching chores:', err);
    }
  };

  const fetchDailyHelpers = async () => {
    try {
      const res = await communityAPI.getDailyHelpers();
      setDailyHelpers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching daily helpers:', err);
    }
  };

  const fetchFlatVisitors = async () => {
    try {
      const res = await entryAPI.getResidentLogs();
      setRecentFlatVisitors(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching flat visitors:', err);
    }
  };

  const fetchSocietyDetails = async () => {
    try {
      const res = await authAPI.getProfile();
      if (res.data) {
        setSocietyDetails({
          name: res.data.society_name,
          address: res.data.society_address,
          city: res.data.society_city
        });
      }
    } catch (err) {
      console.error('Error fetching society details:', err);
    }
  };

  // Handle Poll Vote
  const handleVote = async (postId, option) => {
    try {
      await communityAPI.votePoll(postId, option);
      await fetchPosts();
    } catch (err) {
      console.error('Vote failed:', err);
      alert(err.response?.data?.message || 'Vote register nahi ho saka.');
    }
  };

  // Handle Post Like
  const handleLike = async (postId) => {
    try {
      const res = await communityAPI.toggleLike(postId);
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            likedByMe: res.data.liked,
            likesCount: res.data.liked ? parseInt(p.likesCount) + 1 : parseInt(p.likesCount) - 1
          };
        }
        return p;
      }));
    } catch (err) {
      console.error('Like failed:', err);
    }
  };

  // Handle Comment Submission
  const handleAddComment = async (e, postId) => {
    e.preventDefault();
    const commentText = newCommentTexts[postId] || '';
    if (!commentText.trim()) return;
    try {
      await communityAPI.addComment(postId, commentText.trim());
      setNewCommentTexts(prev => ({ ...prev, [postId]: '' }));
      await fetchPosts();
    } catch (err) {
      console.error('Comment failed:', err);
    }
  };

  const handleCommentChange = (postId, value) => {
    setNewCommentTexts(prev => ({ ...prev, [postId]: value }));
  };

  const toggleCommentsVisibility = (postId) => {
    setVisibleComments(prev => ({ ...prev, [postId]: !prev[postId] }));
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
  const toggleTask = async (id) => {
    try {
      const res = await communityAPI.toggleChore(id);
      setTasks(prev => prev.map(t => t.id === id ? { ...t, done: res.data.done } : t));
    } catch (err) {
      console.error('Toggle chore failed:', err);
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      await communityAPI.deleteChore(id);
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error('Delete chore failed:', err);
    }
  };

  // Fetch real community data on mount
  useEffect(() => {
    const fetchCommunityData = async () => {
      setDataLoading(true);
      try {
        const [noticesRes, contactsRes, serviceRes] = await Promise.allSettled([
          announcementAPI.getAll(),
          communityAPI.getDirectory(),
          serviceAPI.getResidentRequests(),
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
          setRealContacts(Array.isArray(contactsRes.value.data) ? contactsRes.value.data : []);
        }
        if (serviceRes.status === 'fulfilled') {
          const open = (serviceRes.value.data || []).filter(r => r.status === 'Open').length;
          setOpenServiceCount(open);
        }
        // Fetch community posts, chores, helpers, flat visitors, and society details in parallel
        await Promise.allSettled([
          fetchPosts(),
          fetchChores(),
          fetchDailyHelpers(),
          fetchFlatVisitors(),
          fetchSocietyDetails()
        ]);
      } catch (e) {
        console.error('Community data fetch error:', e);
      } finally {
        setDataLoading(false);
      }
    };
    fetchCommunityData();
  }, []);

  // Real-time visitor log updates via socket
  useEffect(() => {
    if (!sharedSocket) return;
    const handleVisitorCheckIn = () => {
      fetchFlatVisitors();
    };
    sharedSocket.on('entry_log_created', handleVisitorCheckIn);
    sharedSocket.on('visitor_checked_in', handleVisitorCheckIn);
    return () => {
      sharedSocket.off('entry_log_created', handleVisitorCheckIn);
      sharedSocket.off('visitor_checked_in', handleVisitorCheckIn);
    };
  }, [sharedSocket]);

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
  const cardBg = isDark ? 'bg-slate-800/80 border-slate-700/50' : 'bg-white border-slate-200';
  const renderContent = () => {
    switch (activeTab) {
      case 'community':
        return (
          <div className="space-y-5 animate-slide-up">
            
            {/* Redesigned Society Banner Hero with Glassmorphism Overlay */}
            <div className="relative rounded-[32px] overflow-hidden h-40 shadow-2xl border border-slate-700/30 group">
              <img
                src="/society_banner.png"
                alt="Society"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                onError={(e) => {
                  // Fallback beautiful mesh background in case image is missing
                  e.target.style.display = 'none';
                  e.target.parentNode.classList.add('bg-mesh-dark');
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-slate-900/10" />
              
              <div className="absolute bottom-4 left-5 right-5 flex justify-between items-end">
                <div>
                  <p className="text-white font-extrabold text-lg leading-tight tracking-tight drop-shadow-md font-heading">
                    {societyDetails.name || user?.society_name || 'Loading Society...'}
                  </p>
                  <p className="text-white/75 text-[10px] font-bold uppercase tracking-wider mt-1 drop-shadow flex items-center gap-1.5">
                    📍 {societyDetails.address || user?.society_address || ''}{((societyDetails.address || user?.society_address) && (societyDetails.city || user?.society_city)) ? ', ' : ''}{societyDetails.city || user?.society_city || ''} &bull; Flat {user?.flat_number || '102'}
                  </p>
                </div>
                <div className="bg-emerald-500/15 border border-emerald-500/30 backdrop-blur-md text-emerald-400 text-[8px] font-black px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1.5 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  🟢 SECURE SOCIETY
                </div>
              </div>
            </div>

            {/* Quick Helper Horizontal Contacts (Aesthetic Scroll Bar) */}
            <div className="space-y-2">
              <p className={`text-[10px] font-bold tracking-wider uppercase px-1 ${subtext}`}>Recent Flat Visitors & Pre-approvals</p>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none px-1">
                
                {/* Preapprove Button */}
                <button 
                  onClick={() => setShowPreapproveModal(true)} 
                  className="flex flex-col items-center gap-1.5 shrink-0 group"
                >
                  <div className="w-13 h-13 rounded-full border border-dashed border-indigo-500/40 bg-indigo-500/5 flex items-center justify-center text-indigo-400 group-hover:scale-105 group-hover:border-indigo-400 group-hover:bg-indigo-500/10 transition-all duration-300">
                    <UserPlus size={20} />
                  </div>
                  <span className="text-[10px] font-bold tracking-tight">Pre-approve</span>
                </button>

                {/* Flat Visitors List with premium glowing border rings */}
                {recentFlatVisitors.slice(0, 4).map((v, i) => {
                  const isInside = v.type === 'Delivery' 
                    ? v.purpose === 'arrived' 
                    : (v.entry_time && !v.exit_time);
                  
                  const avatar = v.type === 'Guest' ? '🧑' : (v.type === 'Delivery' ? '📦' : '🚗');
                  const dispName = v.type === 'Guest' ? (v.name ? v.name.split(' ')[0] : 'Guest') : v.name;
                  const dispRole = v.type === 'Guest' ? 'Guest' : (v.type === 'Delivery' ? 'Delivery' : 'Vehicle');

                  return (
                    <div key={v.id || i} className="flex flex-col items-center gap-1.5 shrink-0 relative group">
                      <div className="w-13 h-13 rounded-full bg-slate-900/60 border border-slate-700/60 flex items-center justify-center text-xl relative group-hover:scale-105 transition-all duration-300 shadow-md">
                        {avatar}
                        {/* Glowing green indicator ring for inside visitors, muted gray for checked-out */}
                        <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-slate-950 flex items-center justify-center ${
                          isInside ? 'bg-emerald-500 animate-sos-pulse' : 'bg-slate-500'
                        }`} />
                      </div>
                      <div className="text-center">
                        <span className="text-[10px] font-bold block max-w-[65px] truncate">{dispName}</span>
                        <span className={`text-[8px] font-medium block truncate max-w-[65px] ${subtext}`}>{dispRole}</span>
                      </div>
                    </div>
                  );
                })}

                {/* Directory Button */}
                <button 
                  onClick={() => setShowDirectoryModal(true)} 
                  className="flex flex-col items-center gap-1.5 shrink-0 group"
                >
                  <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-all duration-300">
                    <ChevronRight size={20} />
                  </div>
                  <span className="text-[10px] font-bold text-indigo-400">View All</span>
                </button>

              </div>
            </div>

            {/* Redesigned Category Shortcuts Grid */}
            <div className={`p-5 rounded-[32px] border shadow-sm grid grid-cols-4 gap-4 backdrop-blur-xl ${cardBg}`}>
              {[
                { label: 'Home Planner', icon: Calendar, color: 'text-rose-400 bg-rose-500/10 border-rose-500/10', action: () => setShowPlannerModal(true) },
                { label: openServiceCount > 0 ? `Helpdesk (${openServiceCount})` : 'Helpdesk', icon: Wrench, color: 'text-amber-400 bg-amber-500/10 border-amber-500/10', action: () => setActiveTab('service') },
                { label: 'My Garage', icon: Car, color: 'text-sky-400 bg-sky-500/10 border-sky-500/10', action: () => setActiveTab('garage') },
                { label: 'Pre-Approve', icon: ShieldCheck, color: 'text-violet-400 bg-violet-500/10 border-violet-500/10', action: () => setShowPreapproveModal(true) },
                { label: 'Directory', icon: Search, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/10', action: () => setShowDirectoryModal(true) },
                { label: 'Notices', icon: Megaphone, color: 'text-pink-400 bg-pink-500/10 border-pink-500/10', action: () => {
                    setActiveTab('community');
                    setTimeout(() => noticesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
                  } },
                { label: 'SOS Alert', icon: AlertTriangle, color: 'text-red-400 bg-red-500/10 border-red-500/15', action: handleSOS },
                { label: 'My Flat', icon: Home, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/10', action: () => setActiveTab('flat') },
              ].map((item, idx) => (
                <button 
                  key={idx} 
                  onClick={item.action} 
                  className="flex flex-col items-center gap-2 p-1 hover:scale-105 active:scale-95 transition-all duration-300"
                >
                  <div className={`w-11 h-11 rounded-[18px] flex items-center justify-center border ${item.color} shadow-sm transition-colors`}>
                    <item.icon size={20} strokeWidth={2.2} />
                  </div>
                  <span className="text-[9px] font-extrabold text-center leading-tight tracking-tight text-slate-700 dark:text-slate-300">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Create Post capsule Panel (Frosted Look) */}
            <div className={`p-4 rounded-[26px] border backdrop-blur-xl shadow-sm ${cardBg}`}>
              <p className={`text-[10px] font-bold uppercase tracking-wider mb-3 px-1 ${subtext}`}>Create community updates</p>
              <div className="flex gap-3">
                <button
                  onClick={() => { setCreatorTab('feed_post'); setShowPostModal(true); }}
                  className="flex-1 px-4 py-3 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black tracking-wider uppercase active:scale-98 transition-all bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15"
                >
                  <Megaphone size={12} strokeWidth={2.5} />
                  Create Post
                </button>
                <button
                  onClick={() => { setCreatorTab('poll'); setShowPostModal(true); }}
                  className="flex-1 px-4 py-3 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black tracking-wider uppercase active:scale-98 transition-all bg-indigo-500/10 hover:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/15"
                >
                  <CheckCircle size={12} strokeWidth={2.5} />
                  Start Poll
                </button>
              </div>
            </div>

            {/* Community Feed Posts & Polls */}
            {dataLoading ? (
              <div className={`p-8 rounded-[30px] border text-center ${cardBg}`}>
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className={`text-xs ${subtext}`}>Loading community feed...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className={`p-8 rounded-[30px] border text-center ${cardBg}`}>
                <HeartHandshake size={32} className="mx-auto opacity-20 mb-3 text-indigo-500" />
                <p className={`text-xs ${subtext}`}>No community posts or polls yet. Start the conversation!</p>
              </div>
            ) : (
              posts.map((post) => {
                const isPoll = post.type === 'poll';
                const liked = post.likedByMe;
                const likes = post.likesCount;
                const hasComments = visibleComments[post.id];
                const commentText = newCommentTexts[post.id] || '';

                return (
                  <div key={post.id} className={`rounded-[30px] border shadow-md overflow-hidden backdrop-blur-xl animate-fade-in ${cardBg}`}>
                    {/* Header */}
                    <div className="p-4.5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/40">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-extrabold flex items-center justify-center text-xs shadow-md">
                          {(post.author_name || 'U').substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-black text-slate-800 dark:text-slate-200 leading-none">{post.author_name}</p>
                            <span className={`text-[8px] border font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              post.author_role === 'admin' || post.author_role === 'manager'
                                ? 'bg-sky-500/15 border-sky-500/20 text-sky-400'
                                : 'bg-emerald-500/15 border-emerald-500/20 text-emerald-400'
                            }`}>
                              {post.author_role}
                            </span>
                          </div>
                          <p className={`text-[9px] font-semibold mt-1 ${subtext}`}>
                            {post.author_flat ? `Flat ${post.author_flat} ` : ''}&bull; {post.timeAgo} &bull; 👥 Public
                          </p>
                        </div>
                      </div>
                      <button className="text-slate-400 hover:text-slate-200"><MoreVertical size={16} /></button>
                    </div>

                    {/* Body */}
                    <div className="p-4.5 space-y-3 bg-slate-100/10 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-800/40">
                      <h3 className="text-xs font-bold leading-relaxed text-slate-900 dark:text-slate-100">
                        {post.title}
                      </h3>
                      {post.body && (
                        <p className={`text-[11px] leading-relaxed ${subtext}`}>
                          {post.body}
                        </p>
                      )}

                      {/* If it's a poll, render options list */}
                      {isPoll && post.pollData && (
                        <div className="space-y-2.5">
                          {post.pollData.options.map((opt) => {
                            const isSelected = post.pollData.votedOption === opt;
                            const pct = post.pollData.percentages[opt] || 0;
                            const hasVoted = post.pollData.votedOption !== null;

                            return (
                              <button 
                                key={opt}
                                onClick={() => handleVote(post.id, opt)}
                                disabled={hasVoted}
                                className={`w-full relative rounded-2xl p-3 flex items-center justify-between overflow-hidden border text-left transition-all ${
                                  hasVoted 
                                    ? isSelected ? 'border-indigo-500/60 bg-indigo-500/5' : 'border-slate-200 dark:border-slate-800/60' 
                                    : 'border-slate-200 dark:border-slate-800/60 hover:border-indigo-400 dark:hover:border-slate-700 bg-white/40 dark:bg-slate-800/40'
                                }`}
                              >
                                {hasVoted && (
                                  <div 
                                    className="absolute left-0 top-0 bottom-0 bg-indigo-500/10 transition-all duration-1000 ease-out"
                                    style={{ width: `${pct}%` }}
                                  />
                                )}
                                <span className="text-xs font-bold z-10 text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                  {opt}
                                  {isSelected && <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full inline-block animate-ping" />}
                                </span>
                                <div className="flex items-center gap-1.5 z-10 text-xs font-black text-slate-700 dark:text-indigo-400">
                                  {isSelected && <Check size={12} className="text-indigo-500 font-bold" />}
                                  <span>{pct}%</span>
                                </div>
                              </button>
                            );
                          })}

                          <div className={`flex items-center justify-between text-[8px] pt-1 font-bold uppercase tracking-wider ${subtext}`}>
                            <span className="flex items-center gap-1">🗳️ {post.pollData.totalVotes || 0} Votes</span>
                            <span>1 Vote per flat</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Feed Card Footer Actions */}
                    <div className="px-4 py-2.5 flex items-center justify-between text-xs border-b border-slate-100 dark:border-slate-800/40">
                      <button 
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center gap-1.5 py-1 ${liked ? 'text-indigo-400 font-black' : 'text-slate-400 hover:text-slate-300'}`}
                      >
                        <ThumbsUp size={13} strokeWidth={liked ? 2.5 : 1.5} />
                        <span>{likes} Likes</span>
                      </button>
                      <button 
                        onClick={() => toggleCommentsVisibility(post.id)}
                        className="flex items-center gap-1.5 text-slate-400 hover:text-slate-300"
                      >
                        <MessageSquare size={13} />
                        <span>{(post.comments || []).length} Comments</span>
                      </button>
                      <button 
                        onClick={() => {
                          copyToClipboard(post.title);
                        }}
                        className="flex items-center gap-1.5 text-slate-400 hover:text-slate-300"
                      >
                        <Share2 size={13} />
                        <span>Share</span>
                      </button>
                    </div>

                    {/* Poll Comment Threads */}
                    {hasComments && (
                      <div className="px-4 pb-4 pt-3 border-t border-slate-100 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-900/10">
                        <div className="space-y-3 mb-3.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                          {(post.comments || []).map((c, i) => (
                            <div key={i} className="flex gap-2.5 items-start text-[11px] leading-relaxed animate-fade-in">
                              <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold flex items-center justify-center text-[8px] uppercase">
                                {(c.author || 'U').charAt(0)}
                              </div>
                              <div className="flex-1 bg-slate-100/60 dark:bg-slate-850/80 p-2.5 rounded-2xl border border-slate-200/30 dark:border-slate-800/40">
                                <p className="font-extrabold text-slate-800 dark:text-slate-200 flex justify-between items-center">
                                  <span>{c.author}</span>
                                  <span className={`text-[8px] font-normal ${subtext}`}>{c.time}</span>
                                </p>
                                <p className="text-slate-600 dark:text-slate-300 mt-0.5">{c.text}</p>
                              </div>
                            </div>
                          ))}
                          {(post.comments || []).length === 0 && (
                            <p className={`text-[9px] text-center ${subtext} py-2`}>No comments yet. Start the conversation!</p>
                          )}
                        </div>
                        <form onSubmit={(e) => handleAddComment(e, post.id)} className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="Add community thoughts..." 
                            value={commentText} 
                            onChange={e => handleCommentChange(post.id, e.target.value)}
                            className={`flex-1 border rounded-xl px-4 py-2.5 text-xs outline-none focus:border-indigo-500/60 ${
                              isDark ? 'bg-slate-800 border-slate-700/60 text-white' : 'bg-white border-slate-200 text-gray-800'
                            }`}
                          />
                          <button type="submit" className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shrink-0 shadow-md transition-all">
                            <Send size={13} />
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* 2. REAL NOTICES Board Redesign */}
            <div ref={noticesRef} className="space-y-3" onClick={() => {
                localStorage.setItem('notices_last_seen', String(Date.now()));
                setUnreadNoticeCount(0);
              }}>
              <p className={`text-[10px] font-bold uppercase tracking-wider px-1 ${subtext}`}>📢 Society Notices</p>
              {dataLoading ? (
                <div className={`p-6 rounded-[28px] border text-center ${cardBg}`}>
                  <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : realNotices.length === 0 ? (
                <div className={`p-6 rounded-[28px] border text-center ${cardBg}`}>
                  <Megaphone size={28} className="mx-auto opacity-20 mb-2" />
                  <p className={`text-xs ${subtext}`}>Abhi koi notice nahi hai</p>
                </div>
              ) : (
                realNotices.slice(0, 3).map((notice) => {
                  const categoryColors = {
                    General: 'border-blue-500/20 bg-blue-500/5',
                    Maintenance: 'border-orange-500/20 bg-orange-500/5',
                    Emergency: 'border-red-500/30 bg-red-500/5 shadow-[0_0_15px_rgba(239,68,68,0.06)] animate-sos-pulse',
                    Event: 'border-purple-500/25 bg-purple-500/5',
                    Notice: 'border-yellow-500/25 bg-yellow-500/5',
                  };
                  const categoryEmoji = { General: '📢', Maintenance: '🔧', Emergency: '🚨', Event: '🎉', Notice: '📌' };
                  const borderBg = categoryColors[notice.category] || categoryColors.General;
                  return (
                    <div key={notice.id} className={`rounded-[30px] border overflow-hidden shadow-sm ${borderBg} transition-all`}>
                      {notice.category === 'Event' && (
                        <div className="h-24 overflow-hidden">
                          <img src="/event_banner.png" alt="Event" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="p-5">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{categoryEmoji[notice.category] || '📢'}</span>
                            <span className="text-[8px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">{notice.category}</span>
                            {notice.is_pinned === 1 && (
                              <span className="text-[8px] bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">PINNED</span>
                            )}
                          </div>
                          <span className={`text-[9px] font-bold ${subtext}`}>
                            {new Date(notice.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                        <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 leading-snug mb-1.5">{notice.title}</h4>
                        <p className={`text-[11px] leading-relaxed ${subtext}`}>{notice.body}</p>
                        <div className={`flex items-center gap-2.5 mt-3 pt-3 border-t ${isDark ? 'border-slate-800/80' : 'border-slate-100'}`}>
                          <div className="w-5.5 h-5.5 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-[9px] font-bold">
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
                  className={`w-full py-3 rounded-2xl border text-[10px] font-bold ${isDark ? 'border-slate-800 text-slate-400 hover:bg-slate-900/30' : 'border-slate-200 text-slate-500 hover:bg-slate-50'} flex items-center justify-center gap-1.5 transition-all`}
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
              user={user}
              sharedSocket={sharedSocket}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-sm rounded-[30px] p-6 border shadow-2xl ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-sm flex items-center gap-1.5"><Calendar size={18} className="text-rose-500" /> Home Chores Planner</h3>
              <button onClick={() => { setShowPlannerModal(false); setNewTaskText(''); }} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>

            <div className="space-y-3">
              <p className={`text-[10px] ${subtext} leading-relaxed`}>Track daily chores, deliveries, and helper notifications inside your flat.</p>
              
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-2 group/task animate-slide-up">
                    <button 
                      onClick={() => toggleTask(task.id)}
                      className={`flex-1 p-3 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                        task.done 
                          ? 'bg-emerald-500/5 border-emerald-500/25 text-slate-400 line-through border-emerald-500/10' 
                          : isDark ? 'bg-slate-850 border-slate-700 text-white hover:border-slate-600' : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-105'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                        task.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-350 dark:border-slate-600'
                      }`}>
                        {task.done && <Check size={10} strokeWidth={3} />}
                      </div>
                      <span className="text-xs font-bold">{task.text}</span>
                    </button>
                    <button 
                      onClick={() => handleDeleteTask(task.id)}
                      className="w-10 h-10 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 active:scale-95 flex items-center justify-center shrink-0 transition-all"
                      title="Delete task"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                {tasks.length === 0 && (
                  <p className={`text-[10px] text-center ${subtext} py-4`}>No tasks created. Add one below!</p>
                )}
              </div>

              <div className="pt-2 flex gap-1.5">
                <input 
                  type="text" 
                  placeholder="Create custom task..."
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter' && newTaskText.trim()) {
                      try {
                        const textVal = newTaskText.trim();
                        setNewTaskText('');
                        const res = await communityAPI.createChore(textVal);
                        setTasks(prev => [...prev, { id: res.data.id, text: textVal, done: false }]);
                      } catch (err) {
                        console.error('Failed to create chore:', err);
                      }
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-sm rounded-[30px] p-6 border shadow-2xl ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-extrabold text-sm flex items-center gap-1.5"><Search size={18} className="text-indigo-500" /> Intercom & Staff Directory</h3>
              <button 
                onClick={() => { setShowDirectoryModal(false); setDirectorySearch(''); }} 
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search flat number, helper role, or name..." 
                  value={directorySearch}
                  onChange={e => setDirectorySearch(e.target.value)}
                  className={`w-full rounded-xl border pl-9 pr-3 py-2 text-xs outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                />
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                {(realContacts.filter(c => {
                  const q = directorySearch.toLowerCase();
                  return (
                    c.name?.toLowerCase().includes(q) ||
                    c.flat_number?.toLowerCase().includes(q) ||
                    c.role?.toLowerCase().includes(q) ||
                    c.category?.toLowerCase().includes(q)
                  );
                }).length > 0 ? realContacts.filter(c => {
                  const q = directorySearch.toLowerCase();
                  return (
                    c.name?.toLowerCase().includes(q) ||
                    c.flat_number?.toLowerCase().includes(q) ||
                    c.role?.toLowerCase().includes(q) ||
                    c.category?.toLowerCase().includes(q)
                  );
                }) : [
                  { name: 'Gate Security Cabin', role: 'Main Gatehouse Intercom', flat_number: 'Gate 1', phone: '1000' },
                ]).map((c, i) => (
                  <div key={i} className={`p-3 rounded-2xl border flex items-center justify-between animate-fade-in ${isDark ? 'bg-slate-850 border-slate-700/50' : 'bg-slate-50 border-slate-200'}`}>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-xs font-black">{c.name}</p>
                        <span className="text-[7px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-black uppercase px-1.5 py-0.5 rounded-full">
                          {c.role}
                        </span>
                      </div>
                      <p className={`text-[9px] font-medium mt-1 ${subtext}`}>
                        {c.flat_number} &bull; {c.phone}
                      </p>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-sm rounded-[30px] p-6 border shadow-2xl ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-sm flex items-center gap-1.5">
                {creatorTab === 'notice' && <Megaphone size={16} className="text-pink-500" />}
                {creatorTab === 'feed_post' && <Megaphone size={16} className="text-emerald-500" />}
                {creatorTab === 'poll' && <CheckCircle size={16} className="text-indigo-500" />}
                <span>
                  {creatorTab === 'notice' && 'Post Society Notice'}
                  {creatorTab === 'feed_post' && 'Create Community Post'}
                  {creatorTab === 'poll' && 'Start Society Poll'}
                </span>
              </h3>
              <button 
                onClick={() => { 
                  setShowPostModal(false); 
                  setFeedPostTitle(''); 
                  setFeedPostBody(''); 
                  setPollQuestion(''); 
                  setPollOpts(['', '', '']);
                  setPostText(''); 
                }} 
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            {/* Frosted Tabs */}
            <div className="flex border-b border-slate-100 dark:border-slate-800/40 mb-4 text-[10px] font-black uppercase tracking-wider">
              <button
                onClick={() => setCreatorTab('feed_post')}
                className={`flex-1 pb-2 border-b-2 text-center transition-all ${
                  creatorTab === 'feed_post' 
                    ? 'border-emerald-500 text-emerald-500 dark:text-emerald-400' 
                    : 'border-transparent text-slate-400 hover:text-slate-355 dark:hover:text-slate-300'
                }`}
              >
                Feed Post
              </button>
              <button
                onClick={() => setCreatorTab('poll')}
                className={`flex-1 pb-2 border-b-2 text-center transition-all ${
                  creatorTab === 'poll' 
                    ? 'border-indigo-500 text-indigo-500 dark:text-indigo-400' 
                    : 'border-transparent text-slate-400 hover:text-slate-355 dark:hover:text-slate-300'
                }`}
              >
                Start Poll
              </button>
              <button
                onClick={() => setCreatorTab('notice')}
                className={`flex-1 pb-2 border-b-2 text-center transition-all ${
                  creatorTab === 'notice' 
                    ? 'border-pink-500 text-pink-500 dark:text-pink-400' 
                    : 'border-transparent text-slate-400 hover:text-slate-355 dark:hover:text-slate-300'
                }`}
              >
                Official Notice
              </button>
            </div>

            <div className="space-y-4">
              {/* Tab 1: Feed Post Form */}
              {creatorTab === 'feed_post' && (
                <div className="space-y-3">
                  <p className={`text-[10px] ${subtext} leading-relaxed`}>Share a thought, announcement, or discuss anything with the society feed instantly!</p>
                  <div>
                    <label className={`text-[9px] font-black uppercase tracking-wider mb-1 block ${subtext}`}>Post Topic / Title</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Lost keys in block H garden..." 
                      value={feedPostTitle}
                      onChange={e => setFeedPostTitle(e.target.value)}
                      className={`w-full rounded-xl border px-3 py-2 text-xs outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                    />
                  </div>
                  <div>
                    <label className={`text-[9px] font-black uppercase tracking-wider mb-1 block ${subtext}`}>Description (Optional)</label>
                    <textarea 
                      placeholder="Add more context, details, or contact information..."
                      rows={3}
                      value={feedPostBody}
                      onChange={e => setFeedPostBody(e.target.value)}
                      className={`w-full border rounded-2xl p-3 text-xs outline-none resize-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                    />
                  </div>
                  <div className="flex gap-2 justify-end pt-2">
                    <button 
                      onClick={() => setShowPostModal(false)} 
                      className={`px-4 py-2 border rounded-xl text-xs font-bold ${isDark ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-500'}`}
                    >
                      Cancel
                    </button>
                    <button 
                      disabled={postLoading || !feedPostTitle.trim()}
                      onClick={async () => {
                        if (!feedPostTitle.trim()) return;
                        setPostLoading(true);
                        try {
                          await communityAPI.createPost({
                            type: 'post',
                            title: feedPostTitle.trim(),
                            body: feedPostBody.trim()
                          });
                          setFeedPostTitle('');
                          setFeedPostBody('');
                          setShowPostModal(false);
                          await fetchPosts();
                          alert('✅ Post created successfully!');
                        } catch (err) {
                          alert('Post submit nahi hui. Please try again.');
                        } finally {
                          setPostLoading(false);
                        }
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition-all"
                    >
                      {postLoading ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" /> : null}
                      Post Update
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 2: Start Poll Form */}
              {creatorTab === 'poll' && (
                <div className="space-y-3">
                  <p className={`text-[10px] ${subtext} leading-relaxed`}>Start a dynamic 1-vote-per-flat society poll. Get community opinions instantly!</p>
                  <div>
                    <label className={`text-[9px] font-black uppercase tracking-wider mb-1 block ${subtext}`}>Poll Question</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Paint color choice for clubhouse?" 
                      value={pollQuestion}
                      onChange={e => setPollQuestion(e.target.value)}
                      className={`w-full rounded-xl border px-3 py-2 text-xs outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className={`text-[9px] font-black uppercase tracking-wider block ${subtext}`}>Poll Options</label>
                    {pollOpts.map((opt, i) => (
                      <input 
                        key={i}
                        type="text" 
                        placeholder={`Option ${i + 1}`}
                        value={opt}
                        onChange={e => {
                          const updated = [...pollOpts];
                          updated[i] = e.target.value;
                          setPollOpts(updated);
                        }}
                        className={`w-full rounded-xl border px-3 py-2 text-xs outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                      />
                    ))}
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <button 
                      onClick={() => setShowPostModal(false)} 
                      className={`px-4 py-2 border rounded-xl text-xs font-bold ${isDark ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-500'}`}
                    >
                      Cancel
                    </button>
                    <button 
                      disabled={postLoading || !pollQuestion.trim() || pollOpts.filter(o => o.trim()).length < 2}
                      onClick={async () => {
                        if (!pollQuestion.trim()) return;
                        const filteredOpts = pollOpts.filter(o => o.trim());
                        if (filteredOpts.length < 2) return alert('Minimum 2 options are required!');
                        setPostLoading(true);
                        try {
                          await communityAPI.createPost({
                            type: 'poll',
                            title: pollQuestion.trim(),
                            poll_options: filteredOpts
                          });
                          setPollQuestion('');
                          setPollOpts(['', '', '']);
                          setShowPostModal(false);
                          await fetchPosts();
                          alert('✅ Poll started successfully!');
                        } catch (err) {
                          alert('Poll submit nahi hui. Please try again.');
                        } finally {
                          setPostLoading(false);
                        }
                      }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition-all"
                    >
                      {postLoading ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" /> : null}
                      Launch Poll
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 3: Notice Form (Manager Approved or Restricted to Management) */}
              {creatorTab === 'notice' && (
                (user?.role === 'manager' || user?.role === 'admin' || user?.role === 'super_admin') ? (
                  <div className="space-y-3 animate-slide-up">
                    <p className={`text-[10px] ${subtext} leading-relaxed`}>Aapki notice society members ko dikhegi. Manager se approval ke baad publish hogi.</p>
                    <textarea 
                      placeholder="Kya share karna chahte hain? e.g. Water cut on Thursday 10AM–2PM..."
                      rows={4}
                      value={postText}
                      onChange={e => setPostText(e.target.value)}
                      className={`w-full border rounded-2xl p-3 text-xs outline-none resize-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                    />
                    <div className="flex gap-2 justify-end">
                      <button 
                        onClick={() => { setShowPostModal(false); setPostText(''); }} 
                        className={`px-4 py-2 border rounded-xl text-xs font-bold ${isDark ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-500'}`}
                      >
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
                        className="px-4 py-2 bg-pink-600 hover:bg-pink-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition-all"
                      >
                        {postLoading ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" /> : null}
                        Submit Notice
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 text-center py-4 px-1 animate-slide-up">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto text-xl border border-amber-500/25 shadow-sm animate-glow-pulse">
                      🔒
                    </div>
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide">Management Only</h4>
                      <p className={`text-[10px] leading-relaxed max-w-xs mx-auto ${subtext}`}>
                        Official Society Notices can only be created by the Management Board & Administrators to maintain clean, verified updates.
                      </p>
                    </div>
                    <div className={`p-3.5 rounded-2xl border text-left ${isDark ? 'bg-slate-800/60 border-slate-700/40' : 'bg-slate-50 border-slate-200'}`}>
                      <p className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 flex items-center gap-1">💡 Pro-Tip for Residents</p>
                      <p className={`text-[9px] font-medium leading-relaxed mt-1 ${subtext}`}>
                        Apne updates, notices ya discussion topics ko pure society ke sath share karne ke liye **Feed Post** ya **Start Poll** tabs ka use karein! Wo bina validation ke direct community feed par publish ho jate hain.
                      </p>
                    </div>
                    <div className="flex gap-2 justify-center pt-2">
                      <button 
                        onClick={() => setCreatorTab('feed_post')}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
                      >
                        Write Feed Post ✍️
                      </button>
                      <button 
                        onClick={() => setShowPostModal(false)}
                        className={`px-4 py-2.5 border rounded-xl text-xs font-bold transition-all active:scale-95 ${isDark ? 'border-slate-700 text-slate-400 hover:bg-slate-850' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ResidentDashboard;
