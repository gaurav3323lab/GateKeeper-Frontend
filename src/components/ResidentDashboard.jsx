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
import NotificationsTab from './NotificationsTab';
import { entryAPI, announcementAPI, serviceAPI, communityAPI, authAPI } from '../services/api';
import {
  Home, Car, Wrench, CheckCircle, LogOut, AlertTriangle,
  Megaphone, List, HeartHandshake, Phone, Calendar,
  Check, X, Share2, Search, MessageSquare, Bell, UserPlus,
  ChevronRight, Send, MoreVertical, ThumbsUp, ShieldCheck,
  ArrowLeft, Pin, Users, History, KeyRound, BookOpen, BarChart2, PenLine
} from 'lucide-react';

const NAV_ITEMS = [
  { key: 'community', label: 'Community', icon: Users },
  { key: 'flat', label: 'My Flat', icon: Home },
  { key: 'garage', label: 'Garage', icon: Car },
  { key: 'service', label: 'Service', icon: Wrench },
  { key: 'access', label: 'Access', icon: KeyRound },
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
  const [directoryTab, setDirectoryTab] = useState('intercom'); // 'intercom' | 'residents'
  const [showPlannerModal, setShowPlannerModal] = useState(false);
  const [showPreapproveModal, setShowPreapproveModal] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [accessSubTab, setAccessSubTab] = useState('preapprove'); // 'preapprove' | 'logs'

  // 3. Unified Post & Poll Creator State
  const [creatorTab, setCreatorTab] = useState('feed_post'); // 'feed_post', 'poll', 'notice'
  const [feedPostTitle, setFeedPostTitle] = useState('');
  const [feedPostBody, setFeedPostBody] = useState('');
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOpts, setPollOpts] = useState(['', '', '']); // up to 3 options

  // ─── Browser History Navigation & Modal Close on Mobile Back ───
  const activeModal = showDirectoryModal ? 'directory' :
                      showPlannerModal ? 'planner' :
                      showPreapproveModal ? 'preapprove' :
                      showPostModal ? 'post' :
                      showProfile ? 'profile' : null;

  useEffect(() => {
    // Initialize history state on mount
    window.history.replaceState({ tab: 'community', modal: null }, '');

    const handlePopState = (event) => {
      if (event.state) {
        const { tab, modal } = event.state;
        if (tab) setActiveTab(tab);
        setShowDirectoryModal(modal === 'directory');
        setShowPlannerModal(modal === 'planner');
        setShowPreapproveModal(modal === 'preapprove');
        setShowPostModal(modal === 'post');
        setShowProfile(modal === 'profile');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const currentState = window.history.state;
    if (currentState) {
      const matchTab = currentState.tab === activeTab;
      const matchModal = currentState.modal === activeModal;
      
      if (!matchTab || !matchModal) {
        // If a modal was closed manually (currentState has modal, but activeModal is null)
        if (currentState.modal && !activeModal) {
          window.history.back();
        } else {
          window.history.pushState({ tab: activeTab, modal: activeModal }, '');
        }
      }
    }
  }, [activeTab, activeModal]);

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
  const [noticeSearch, setNoticeSearch] = useState('');
  const [noticeFilter, setNoticeFilter] = useState('All');
  const [expandedNotices, setExpandedNotices] = useState({});
  const [postSearch, setPostSearch] = useState('');
  const [postFilter, setPostFilter] = useState('All');

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
        tower: user.tower,
        user_name: user.name
      });

      if (sharedSocket) {
        sharedSocket.emit('trigger_sos', {
          user_id: user.id,
          user_name: user.name,
          flat_number: user.flat_number,
          tower: user.tower
        });
      }

      alert(`🚨 SOS Alert sent! Guard aur Manager ko turant notification gayi — ${user.tower ? 'Tower ' + user.tower + ' - ' : ''}Flat ${user.flat_number}`);
    } catch (err) {
      console.error('SOS failed:', err);
      if (sharedSocket) {
        sharedSocket.emit('trigger_sos', {
          user_id: user.id,
          user_name: user.name,
          flat_number: user.flat_number,
          tower: user.tower
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

  const renderNoticeCard = (notice) => {
    const isPinned = notice.is_pinned === 1 || !!notice.is_pinned;
    const isExpanded = expandedNotices[notice.id];

    const categoryConfigs = {
      Emergency: {
        icon: AlertTriangle,
        gradient: 'from-rose-500 to-red-650',
        badge: isDark 
          ? 'bg-rose-950/25 border-rose-900/30 text-rose-300' 
          : 'bg-rose-50/60 border-rose-100 text-rose-700',
        iconClass: 'text-rose-500',
        glow: 'shadow-[0_8px_30px_rgba(239,68,68,0.03)] hover:shadow-[0_12px_40px_rgba(239,68,68,0.08)]'
      },
      Maintenance: {
        icon: Wrench,
        gradient: 'from-amber-400 to-amber-600',
        badge: isDark 
          ? 'bg-amber-950/25 border-amber-900/30 text-amber-300' 
          : 'bg-amber-50/60 border-amber-100 text-amber-700',
        iconClass: 'text-amber-500',
        glow: 'shadow-[0_8px_30px_rgba(245,158,11,0.03)] hover:shadow-[0_12px_40px_rgba(245,158,11,0.08)]'
      },
      Event: {
        icon: Calendar,
        gradient: 'from-fuchsia-500 to-purple-650',
        badge: isDark 
          ? 'bg-fuchsia-950/25 border-fuchsia-900/30 text-fuchsia-300' 
          : 'bg-fuchsia-50/60 border-fuchsia-100 text-fuchsia-700',
        iconClass: 'text-fuchsia-500',
        glow: 'shadow-[0_8px_30px_rgba(217,70,239,0.03)] hover:shadow-[0_12px_40px_rgba(217,70,239,0.08)]'
      },
      General: {
        icon: Megaphone,
        gradient: 'from-blue-500 to-indigo-650',
        badge: isDark 
          ? 'bg-blue-950/25 border-blue-900/30 text-blue-300' 
          : 'bg-blue-50/60 border-blue-100 text-blue-700',
        iconClass: 'text-blue-500',
        glow: 'shadow-[0_8px_30px_rgba(59,130,246,0.03)] hover:shadow-[0_12px_40px_rgba(59,130,246,0.08)]'
      },
      Notice: {
        icon: BookOpen,
        gradient: 'from-cyan-500 to-teal-650',
        badge: isDark 
          ? 'bg-cyan-950/25 border-cyan-900/30 text-cyan-300' 
          : 'bg-cyan-50/60 border-cyan-100 text-cyan-700',
        iconClass: 'text-cyan-500',
        glow: 'shadow-[0_8px_30px_rgba(6,182,212,0.03)] hover:shadow-[0_12px_40px_rgba(6,182,212,0.08)]'
      }
    };

    const config = categoryConfigs[notice.category] || categoryConfigs.General;
    const IconComponent = config.icon;
    const isEvent = notice.category === 'Event';

    // Body content truncating logic
    const shouldTruncate = notice.body && notice.body.length > 160;
    const bodyToShow = shouldTruncate && !isExpanded 
      ? `${notice.body.slice(0, 160)}...` 
      : notice.body;

    const toggleExpand = (e) => {
      e.stopPropagation();
      setExpandedNotices(prev => ({
        ...prev,
        [notice.id]: !prev[notice.id]
      }));
    };

    return (
      <div 
        key={notice.id} 
        className={`relative rounded-[28px] border overflow-hidden transition-all duration-300 hover:-translate-y-1 group ${
          isDark 
            ? 'bg-slate-900/70 border-slate-800/80 shadow-[0_4px_24px_rgba(0,0,0,0.25)]' 
            : 'bg-white border-slate-100 shadow-[0_6px_20px_rgba(0,0,0,0.025)] hover:shadow-[0_16px_36px_rgba(0,0,0,0.055)] hover:border-slate-200/80'
        } ${config.glow} ${
          isPinned 
            ? isDark 
              ? 'ring-1 ring-amber-500/35 border-amber-500/40' 
              : 'ring-1 ring-amber-400/30 border-amber-400/45 shadow-[0_8px_30px_rgba(245,158,11,0.04)]'
            : ''
        }`}
      >
        {/* Glow effect on hover */}
        <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ${
          isDark ? 'bg-indigo-500/5' : 'bg-indigo-500/3'
        }`} />

        {isEvent && (
          <div className="h-28 overflow-hidden relative">
            <img src="/event_banner.png" alt="Event" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-slate-950/10 to-transparent" />
          </div>
        )}

        <div className="p-5 pl-6">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <span className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${config.badge}`}>
                <IconComponent size={10} strokeWidth={2.5} className="animate-pulse" />
                <span>{notice.category}</span>
              </span>
              {isPinned && (
                <span className="flex items-center gap-1 text-[8px] bg-amber-50/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider animate-pulse">
                  <Pin size={8} className="fill-current rotate-45" /> PINNED
                </span>
              )}
            </div>
            <span className={`text-[10px] font-semibold flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <Calendar size={10} />
              {new Date(notice.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>

          <h4 className={`text-sm font-extrabold leading-snug mb-2 transition-colors duration-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 ${
            isDark ? 'text-slate-100' : 'text-slate-800'
          }`}>
            {notice.title}
          </h4>
          <p className={`text-xs leading-relaxed font-normal whitespace-pre-line ${
            isDark ? 'text-slate-350' : 'text-slate-650'
          }`}>
            {bodyToShow}
          </p>

          {shouldTruncate && (
            <button 
              onClick={toggleExpand}
              className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 mt-2 flex items-center gap-0.5 focus:outline-none transition-colors"
            >
              {isExpanded ? 'Show Less ↑' : 'Read More ↓'}
            </button>
          )}

          <div className={`flex items-center justify-between mt-4 pt-3.5 border-t border-dashed ${isDark ? 'border-slate-800/80' : 'border-slate-100'}`}>
            <div className="flex items-center gap-2.5">
              <div className={`w-7 h-7 rounded-full bg-gradient-to-tr ${config.gradient} flex items-center justify-center text-white text-[10px] font-black shadow-sm`}>
                {(notice.author_name || 'M')[0].toUpperCase()}
              </div>
              <div>
                <p className={`text-[10px] font-black leading-none ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                  {notice.author_name || 'Management'}
                </p>
                <p className={`text-[8px] font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'} mt-0.5`}>
                  Society Board
                </p>
              </div>
            </div>
            
            <div className={`flex items-center gap-1 text-[8px] font-extrabold px-2 py-0.5 rounded-lg uppercase tracking-wider ${
              isDark ? 'bg-slate-800/50 text-slate-400' : 'bg-slate-50 text-slate-500'
            }`}>
              <ShieldCheck size={9} className="text-emerald-500" />
              <span>Official</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAllNoticesView = () => {
    const q = noticeSearch.toLowerCase();
    const filteredNotices = realNotices.filter(notice => {
      const matchesCategory = noticeFilter === 'All' || notice.category === noticeFilter;
      const matchesSearch = notice.title?.toLowerCase().includes(q) || 
                            notice.body?.toLowerCase().includes(q) || 
                            notice.author_name?.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });

    const categories = ['All', 'Emergency', 'Maintenance', 'Event', 'General', 'Notice'];
    const categoryIcons = {
      All: List,
      Emergency: AlertTriangle,
      Maintenance: Wrench,
      Event: Calendar,
      General: Megaphone,
      Notice: BookOpen
    };

    return (
      <div className="space-y-5 animate-slide-up pb-10">
        {/* Header with Glassmorphism Back Navigation */}
        <div className="flex items-center gap-3.5 mb-2">
          <button 
            onClick={() => setActiveTab('community')}
            className={`w-9.5 h-9.5 rounded-full flex items-center justify-center border transition-all hover:scale-105 active:scale-95 ${
              isDark 
                ? 'border-slate-800 bg-slate-900/60 text-indigo-400 hover:text-indigo-300 hover:border-slate-700 shadow-lg' 
                : 'border-slate-100 bg-white text-slate-800 hover:border-slate-200 hover:text-slate-900 shadow-[0_3px_12px_rgba(0,0,0,0.025)]'
            }`}
          >
            <ArrowLeft size={16} strokeWidth={2.5} />
          </button>
          <div>
            <h2 className={`font-black text-base flex items-center gap-1.5 ${isDark ? 'text-slate-100' : 'text-slate-850'}`}>
              <Megaphone size={16} className="text-indigo-500 animate-pulse" />
              <span>Society Bulletin</span>
            </h2>
            <p className={`text-[10px] ${subtext} font-semibold mt-0.5`}>
              Official updates & board announcements
            </p>
          </div>
        </div>

        {/* Premium search bar with interactive focus ring */}
        <div className="relative rounded-[20px] overflow-hidden">
          <Search size={14} className="absolute left-3.5 top-[15px] text-slate-400" />
          <input 
            type="text" 
            placeholder="Search notices, updates or titles..."
            value={noticeSearch}
            onChange={e => setNoticeSearch(e.target.value)}
            className={`w-full rounded-[20px] border pl-10 pr-10 py-3.5 text-xs outline-none transition-all focus:ring-2 focus:ring-indigo-500/10 ${
              isDark 
                ? 'bg-slate-900 border-slate-800 text-white focus:border-indigo-500/50' 
                : 'bg-white border-slate-150 text-slate-800 focus:border-indigo-300 shadow-sm shadow-slate-100/50'
            }`}
          />
          {noticeSearch && (
            <button 
              onClick={() => setNoticeSearch('')}
              className="absolute right-3 top-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X size={12} strokeWidth={2.5} />
            </button>
          )}
        </div>

        {/* Categories Horizontal Scroll Bar */}
        <div className="flex gap-2 overflow-x-auto pb-2.5 scrollbar-none">
          {categories.map(c => {
            const active = noticeFilter === c;
            const count = c === 'All' ? realNotices.length : realNotices.filter(n => n.category === c).length;
            const CategoryIcon = categoryIcons[c] || Megaphone;
            return (
              <button 
                key={c} 
                onClick={() => setNoticeFilter(c)}
                className={`px-3.5 py-2.5 rounded-2xl text-[10px] font-black whitespace-nowrap transition-all border flex items-center gap-2 active:scale-95 ${
                  active
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/15'
                    : isDark 
                      ? 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-200 hover:border-slate-700' 
                      : 'border-slate-150 bg-white text-slate-600 hover:text-slate-800 hover:border-slate-250 shadow-sm'
                }`}
              >
                <CategoryIcon size={11} strokeWidth={active ? 3 : 2} className={active ? 'animate-pulse' : ''} />
                <span>{c}</span>
                <span className={`text-[8.5px] font-extrabold px-1.5 py-0.2 rounded-full ${
                  active ? 'bg-indigo-800/60 text-indigo-100' : isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Notices list container */}
        <div className="space-y-4">
          {filteredNotices.length === 0 ? (
            <div className={`border rounded-[32px] p-12 text-center shadow-sm ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-150'
            }`}>
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${
                isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-50 text-slate-400'
              }`}>
                <Megaphone size={24} className="opacity-30" />
              </div>
              <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">No Notices Found</h4>
              <p className={`text-[10.5px] mt-1.5 max-w-xs mx-auto leading-relaxed ${subtext}`}>
                Aapki search query ya category <b>"{noticeFilter}"</b> ke liye koi bulletin notices nahi mile. Try searching with different keywords.
              </p>
              {(noticeSearch || noticeFilter !== 'All') && (
                <button
                  onClick={() => { setNoticeSearch(''); setNoticeFilter('All'); }}
                  className="mt-5 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-750 hover:from-indigo-700 hover:to-indigo-800 text-white text-[10px] font-black uppercase tracking-wider shadow-md shadow-indigo-500/10 transition-all active:scale-95"
                >
                  Clear Filters 🔄
                </button>
              )}
            </div>
          ) : (
            filteredNotices.map(notice => renderNoticeCard(notice))
          )}
        </div>
      </div>
    );
  };

  const renderFeedPostCard = (post) => {
    const isPoll = post.type === 'poll';
    const liked = post.likedByMe;
    const likes = post.likesCount;
    const hasComments = visibleComments[post.id];
    const commentText = newCommentTexts[post.id] || '';

    return (
      <div key={post.id} className={`rounded-[24px] border overflow-hidden animate-fade-in transition-all ${
        isDark ? 'bg-slate-900/70 border-slate-800/60 shadow-[0_4px_24px_rgba(0,0,0,0.3)]' : 'bg-white border-slate-100 shadow-[0_2px_16px_rgba(0,0,0,0.06)]'
      }`}>


        {/* ── Header ── */}
        <div className="px-4 pt-4 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar with gradient + type indicator */}
            <div className="relative">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-lg ${
                isPoll
                  ? 'bg-gradient-to-br from-indigo-500 to-violet-600 shadow-indigo-500/25'
                  : 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/25'
              }`}>
                {(post.author_name || 'U').substring(0, 2).toUpperCase()}
              </div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center text-[7px] ${
                isDark ? 'border-slate-900' : 'border-white'
              } ${isPoll ? 'bg-indigo-500' : 'bg-emerald-500'}`}>
                {isPoll ? '📊' : '📝'}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className={`text-[13px] font-black leading-none ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                  {post.author_name}
                </p>
                <span className={`text-[7.5px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                  post.author_role === 'admin' || post.author_role === 'manager'
                    ? 'bg-sky-500/15 border-sky-500/25 text-sky-500'
                    : 'bg-emerald-500/12 border-emerald-500/20 text-emerald-500'
                }`}>
                  {post.author_role}
                </span>
              </div>
              <p className={`text-[10px] mt-0.5 flex items-center gap-1.5 ${subtext}`}>
                {post.author_flat && (
                  <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[8px] font-black ${
                    isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
                  }`}>
                    🏠 {post.author_tower ? `${post.author_tower}-` : ''}{post.author_flat}
                  </span>
                )}
                <span>{post.timeAgo}</span>
                <span className={`w-1 h-1 rounded-full inline-block ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`} />
                <span className={`inline-flex items-center gap-0.5 text-[8px] font-bold ${isDark ? 'text-indigo-400' : 'text-indigo-500'}`}>
                  👥 Public
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-[8px] font-black px-2.5 py-1 rounded-full border uppercase tracking-wider ${
              isPoll
                ? isDark ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-indigo-50 border-indigo-100 text-indigo-600'
                : isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-100 text-emerald-600'
            }`}>
              {isPoll ? 'Poll' : 'Post'}
            </span>
            <button className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
              isDark ? 'text-slate-600 hover:text-slate-400 hover:bg-slate-800' : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'
            }`}><MoreVertical size={14} /></button>
          </div>
        </div>

        {/* ── Divider ── */}
        <div className={`mx-4 h-px ${isDark ? 'bg-slate-800/60' : 'bg-slate-100'}`} />

        {/* ── Body ── */}
        <div className="px-4 pt-3.5 pb-3 space-y-3">
          <h3 className={`text-[13px] font-black leading-snug ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
            {post.title}
          </h3>
          {post.body && (
            <p className={`text-[11px] leading-relaxed ${subtext}`}>
              {post.body}
            </p>
          )}

          {/* ── Premium Poll Options ── */}
          {isPoll && post.pollData && (
            <div className="space-y-2 pt-1">
              {post.pollData.options.map((opt, optIdx) => {
                const isSelected = post.pollData.votedOption === opt;
                const pct = post.pollData.percentages[opt] || 0;
                const hasVoted = post.pollData.votedOption !== null;
                const barColors = ['bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500'];
                const barColor = barColors[optIdx % barColors.length];

                return (
                  <button
                    key={opt}
                    onClick={() => handleVote(post.id, opt)}
                    disabled={hasVoted}
                    className={`w-full relative rounded-2xl overflow-hidden text-left transition-all duration-200 ${
                      hasVoted
                        ? isSelected
                          ? isDark ? 'border border-indigo-500/40 bg-indigo-500/8' : 'border border-indigo-200 bg-indigo-50'
                          : isDark ? 'border border-slate-800/60 bg-slate-800/30' : 'border border-slate-100 bg-slate-50'
                        : isDark
                          ? 'border border-slate-800 bg-slate-800/40 hover:border-indigo-500/40 hover:bg-indigo-500/5 active:scale-[0.98]'
                          : 'border border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/40 active:scale-[0.98]'
                    }`}
                  >
                    {hasVoted && (
                      <div
                        className={`absolute left-0 top-0 bottom-0 opacity-[0.12] transition-all duration-1000 ease-out ${barColor}`}
                        style={{ width: `${pct}%` }}
                      />
                    )}
                    <div className="relative flex items-center justify-between px-3.5 py-2.5">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <div className={`w-5 h-5 rounded-lg flex items-center justify-center text-[9px] font-black shrink-0 ${
                          isSelected ? `${barColor} text-white` : isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {isSelected ? <Check size={10} strokeWidth={3} /> : optIdx + 1}
                        </div>
                        <span className={`text-[12px] font-bold truncate ${
                          isSelected
                            ? isDark ? 'text-indigo-300' : 'text-indigo-700'
                            : isDark ? 'text-slate-200' : 'text-slate-700'
                        }`}>{opt}</span>
                      </div>
                      {hasVoted && (
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />}
                          <span className={`text-[11px] font-black tabular-nums ${
                            isSelected ? isDark ? 'text-indigo-400' : 'text-indigo-600' : isDark ? 'text-slate-400' : 'text-slate-500'
                          }`}>{pct}%</span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}

              <div className={`flex items-center justify-between text-[9px] pt-0.5 font-bold ${subtext}`}>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[8px] ${
                  isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
                }`}>🗳️ {post.pollData.totalVotes || 0} votes</span>
                <span className={`text-[8px] uppercase tracking-wider ${isDark ? 'text-indigo-500/60' : 'text-indigo-400'}`}>1 vote / flat</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Action Row ── */}
        <div className={`mx-4 h-px ${isDark ? 'bg-slate-800/60' : 'bg-slate-100'}`} />
        <div className="px-4 py-2.5 flex items-center gap-1">
          <button
            onClick={() => handleLike(post.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black transition-all ${
              liked
                ? isDark ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                : isDark ? 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/60' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ThumbsUp size={13} strokeWidth={liked ? 2.5 : 1.8} />
            <span>{likes || 0}</span>
          </button>

          <button
            onClick={() => toggleCommentsVisibility(post.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black transition-all ${
              hasComments
                ? isDark ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                : isDark ? 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/60' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
            }`}
          >
            <MessageSquare size={13} strokeWidth={1.8} />
            <span>{(post.comments || []).length}</span>
          </button>

          <button
            onClick={() => copyToClipboard(post.title)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black transition-all ml-auto ${
              isDark ? 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/60' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Share2 size={13} strokeWidth={1.8} />
          </button>
        </div>

        {/* ── Comment Thread ── */}
        {hasComments && (
          <div className={`border-t px-4 pb-4 pt-3 ${isDark ? 'border-slate-800/60 bg-slate-950/40' : 'border-slate-100 bg-slate-50/70'}`}>
            <div className="space-y-2.5 mb-3 max-h-52 overflow-y-auto scrollbar-none">
              {(post.comments || []).map((c, i) => (
                <div key={i} className="flex gap-2.5 items-start animate-fade-in">
                  <div className="w-6 h-6 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white font-black flex items-center justify-center text-[8px] shrink-0 mt-0.5 shadow-md shadow-indigo-500/20">
                    {(c.author || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className={`flex-1 px-3 py-2 rounded-2xl rounded-tl-md text-[11px] border ${
                    isDark ? 'bg-slate-800/60 border-slate-700/40' : 'bg-white border-slate-200/80'
                  }`}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={`font-extrabold text-[10px] ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{c.author}</span>
                      <span className={`text-[8px] ${subtext}`}>{c.time}</span>
                    </div>
                    <p className={`leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{c.text}</p>
                  </div>
                </div>
              ))}
              {(post.comments || []).length === 0 && (
                <div className={`text-center py-3 text-[10px] ${subtext}`}>No comments yet — be first! 💬</div>
              )}
            </div>

            <form onSubmit={(e) => handleAddComment(e, post.id)} className="flex gap-2">
              <input
                type="text"
                placeholder="Write a comment..."
                value={commentText}
                onChange={e => handleCommentChange(post.id, e.target.value)}
                className={`flex-1 border rounded-2xl px-4 py-2.5 text-xs outline-none transition-all focus:ring-2 ${
                  isDark
                    ? 'bg-slate-800 border-slate-700/60 text-white placeholder-slate-500 focus:border-indigo-500/40 focus:ring-indigo-500/10'
                    : 'bg-white border-slate-200 text-gray-800 placeholder-slate-400 focus:border-indigo-300 focus:ring-indigo-100'
                }`}
              />
              <button
                type="submit"
                className="w-9 h-9 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-90 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20 transition-all"
              >
                <Send size={13} />
              </button>
            </form>
          </div>
        )}
      </div>
    );
  };

  const renderAllPostsView = () => {
    const q = postSearch.toLowerCase();
    const filteredPosts = posts.filter(post => {
      const matchesType = postFilter === 'All' || post.type === postFilter;
      const matchesSearch = post.title?.toLowerCase().includes(q) || 
                            post.body?.toLowerCase().includes(q) || 
                            post.author_name?.toLowerCase().includes(q);
      return matchesType && matchesSearch;
    });

    return (
      <div className="space-y-5 animate-slide-up pb-10">
        {/* Header with Back Navigation */}
        <div className="flex items-center gap-3 mb-2">
          <button 
            onClick={() => setActiveTab('community')}
            className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all active:scale-90 ${
              isDark 
                ? 'border-slate-800 bg-slate-900/50 text-indigo-400 hover:text-indigo-300 hover:border-slate-700' 
                : 'border-slate-200 bg-white text-indigo-600 hover:text-indigo-700 hover:border-slate-300'
            }`}
          >
            <ArrowLeft size={16} strokeWidth={2.5} />
          </button>
          <div>
            <h2 className="font-extrabold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
              💬 Community Hub
            </h2>
            <p className={`text-[10px] ${subtext} font-semibold`}>
              Society discussions, posts & dynamic polls
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-3.5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search discussions, polls or residents..."
            value={postSearch}
            onChange={e => setPostSearch(e.target.value)}
            className={`w-full rounded-2xl border pl-10 pr-4 py-3 text-xs outline-none transition-all focus:ring-1 focus:ring-indigo-500/50 ${
              isDark 
                ? 'bg-slate-900 border-slate-800 text-white focus:border-indigo-500/50' 
                : 'bg-white border-slate-200 text-slate-800 focus:border-indigo-100 shadow-sm'
            }`}
          />
          {postSearch && (
            <button 
              onClick={() => setPostSearch('')}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-250 p-0.5 rounded-full"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Type Filter Buttons */}
        <div className="flex gap-2">
          {[
            { key: 'All', label: '🗂️ All Feed', count: posts.length },
            { key: 'post', label: '📝 Posts Only', count: posts.filter(p => p.type === 'post').length },
            { key: 'poll', label: '📊 Polls Only', count: posts.filter(p => p.type === 'poll').length }
          ].map(f => {
            const active = postFilter === f.key;
            return (
              <button 
                key={f.key} 
                onClick={() => setPostFilter(f.key)}
                className={`px-4 py-2 rounded-2xl text-[10px] font-black whitespace-nowrap transition-all border flex items-center gap-1.5 active:scale-95 ${
                  active
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/10'
                    : isDark 
                      ? 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-200' 
                      : 'border-slate-200 bg-white text-slate-600 hover:text-slate-800 shadow-sm'
                }`}
              >
                <span>{f.label}</span>
                <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded-full ${
                  active ? 'bg-indigo-700 text-indigo-100' : isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-500'
                }`}>
                  {f.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Posts List */}
        <div className="space-y-4">
          {filteredPosts.length === 0 ? (
            <div className={`border rounded-[32px] p-12 text-center backdrop-blur-xl ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <MessageSquare size={36} className="mx-auto opacity-20 mb-3 text-slate-400" />
              <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">No Posts Found</h4>
              <p className={`text-[10px] mt-1 max-w-xs mx-auto ${subtext}`}>
                Aapki search query ya selected filter ke liye koi discussions ya polls nahi mile.
              </p>
              {(postSearch || postFilter !== 'All') && (
                <button
                  onClick={() => { setPostSearch(''); setPostFilter('All'); }}
                  className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold shadow-sm transition-all"
                >
                  Clear Filters 🔄
                </button>
              )}
            </div>
          ) : (
            filteredPosts.map(post => renderFeedPostCard(post))
          )}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'notifications':
        return <NotificationsTab user={user} />;
      case 'all-notices':
        return renderAllNoticesView();
      case 'all-posts':
        return renderAllPostsView();
      case 'community':
        return (
          <div className="space-y-5 animate-slide-up">
            
            {/* ── Premium Society Hero Banner ── */}
            <div className="relative rounded-[28px] overflow-hidden shadow-2xl group" style={{background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.95) 0%, rgba(49, 46, 129, 0.95) 50%, rgba(99, 102, 241, 0.5) 100%)'}}>
              {/* Decorative animated orbs */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-violet-500/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl animate-pulse" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl animate-pulse" />
              <img
                src="/society_banner.png"
                alt="Society"
                className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-30 group-hover:opacity-40 group-hover:scale-105 transition-all duration-700 ease-out"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <div className="relative p-5 pb-4">
                {/* Top row */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                      <span className="text-emerald-300 text-[9px] font-black uppercase tracking-widest">Secure Society</span>
                    </div>
                    <h2 className="text-white font-black text-base leading-tight font-heading tracking-wide">
                      {societyDetails.name || user?.society_name || 'My Society'}
                    </h2>
                    <p className="text-indigo-200/70 text-[10px] font-bold mt-1 flex items-center gap-1">
                      <span>📍</span> {user?.tower ? `Tower ${user.tower} · ` : ''}{societyDetails.city || user?.society_city || 'India'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="inline-flex items-center bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-3.5 py-1.5 shadow-lg shadow-indigo-950/20 hover:bg-white/15 transition-all">
                      <span className="text-white font-black text-xs tracking-wider">{user?.tower ? `${user.tower}-` : ''}{user?.flat_number || '101'}</span>
                    </div>
                    <p className="text-indigo-200/60 text-[9px] font-bold mt-1 mr-1">Your Flat</p>
                  </div>
                </div>
                {/* Stats row */}
                <div className="flex gap-2.5">
                  <div className="flex-1 bg-white/5 backdrop-blur-md rounded-2xl px-3 py-2.5 border border-white/10 flex flex-col justify-between hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.03] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                    <p className="text-white font-black text-base leading-none">{recentFlatVisitors.filter(v => v.entry_time && !v.exit_time).length}</p>
                    <p className="text-indigo-200/70 text-[9px] font-bold mt-1">Inside Now</p>
                  </div>
                  <div className="flex-1 bg-white/5 backdrop-blur-md rounded-2xl px-3 py-2.5 border border-white/10 flex flex-col justify-between hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.03] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                    <p className="text-white font-black text-base leading-none">{recentFlatVisitors.length}</p>
                    <p className="text-indigo-200/70 text-[9px] font-bold mt-1">Total Visits</p>
                  </div>
                  <div className="flex-1 bg-white/5 backdrop-blur-md rounded-2xl px-3 py-2.5 border border-white/10 flex flex-col justify-between hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.03] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                    <p className={`font-black text-base leading-none ${openServiceCount > 0 ? 'text-amber-300' : 'text-white'}`}>{openServiceCount}</p>
                    <p className="text-indigo-200/70 text-[9px] font-bold mt-1">Open Tickets</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Recent Flat Visitors ── */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-0.5">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isDark ? 'bg-indigo-500/15' : 'bg-indigo-50'}`}>
                    <UserPlus size={11} className="text-indigo-500" />
                  </div>
                  <p className={`text-[11px] font-black tracking-widest uppercase ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Recent Visitors</p>
                </div>
                <button onClick={() => { setAccessSubTab('logs'); setActiveTab('access'); }} className="text-[9px] font-extrabold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-0.5">See All <ChevronRight size={10} /></button>
              </div>

              {recentFlatVisitors.length === 0 && !dataLoading ? (
                <div className={`rounded-2xl border p-4 flex items-center gap-3 ${cardBg}`}>
                  <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-lg">🏠</div>
                  <div>
                    <p className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>No recent visitors</p>
                    <p className={`text-[10px] ${subtext}`}>Pre-approve a guest to get started</p>
                  </div>
                  <button onClick={() => setShowPreapproveModal(true)} className="ml-auto shrink-0 px-3 py-1.5 bg-indigo-600 text-white text-[9px] font-black rounded-xl shadow-sm hover:bg-indigo-700 transition-colors">
                    + Add
                  </button>
                </div>
              ) : (
                <div className="flex gap-2.5 overflow-x-auto pb-1.5 scrollbar-none">
                  {/* Add Guest button */}
                  <button
                    onClick={() => setShowPreapproveModal(true)}
                    className={`shrink-0 w-[90px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 py-3.5 transition-all hover:scale-105 active:scale-95 ${
                      isDark ? 'border-indigo-500/30 hover:border-indigo-400/50 hover:bg-indigo-500/10 bg-indigo-500/5' : 'border-indigo-200 hover:border-indigo-300 hover:bg-indigo-50/60 bg-indigo-50/20'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-inner">
                      <UserPlus size={15} className="text-indigo-400" />
                    </div>
                    <span className="text-[9px] font-black text-indigo-400 text-center leading-tight">Pre-<br/>Approve</span>
                  </button>

                  {/* Visitor cards */}
                  {recentFlatVisitors.slice(0, 4).map((v, i) => {
                    const isInside = v.type === 'Delivery' ? v.purpose === 'arrived' : (v.entry_time && !v.exit_time);
                    const avatar = v.type === 'Guest' ? '🧑' : (v.type === 'Delivery' ? '📦' : '🚗');
                    const dispName = v.name ? v.name.split(' ')[0] : v.type;
                    const timeAgo = v.entry_time ? (() => {
                      const diff = Date.now() - new Date(v.entry_time).getTime();
                      if (diff < 3600000) return `${Math.floor(diff/60000)}m ago`;
                      if (diff < 86400000) return `${Math.floor(diff/3600000)}h ago`;
                      return `${Math.floor(diff/86400000)}d ago`;
                    })() : 'Pending';

                    return (
                      <div
                        key={`${v.type}-${v.id}-${i}`}
                        className={`shrink-0 w-[90px] rounded-2xl border flex flex-col items-center gap-1.5 py-3 px-1.5 transition-all hover:scale-105 ${
                          isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm shadow-slate-100/50'
                        }`}
                      >
                        <div className="relative">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg border ${
                            v.type === 'Guest' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' :
                            v.type === 'Delivery' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                            'bg-violet-500/10 border-violet-500/20 text-violet-400'
                          }`}>
                            {avatar}
                          </div>
                          <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 ${isDark ? 'border-slate-900' : 'border-white'} ${
                            isInside ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'
                          }`} />
                        </div>
                        <p className={`text-[10px] font-black text-center truncate w-full px-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{dispName}</p>
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider border transition-all ${
                          isInside 
                            ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.15)] animate-pulse' 
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800'
                        }`}>{isInside ? '● Active' : timeAgo}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Redesigned Quick Actions — 2 rows of 4 ── */}
            <div className={`rounded-[24px] border p-4 ${isDark ? 'bg-slate-900/50 border-slate-800/60' : 'bg-white border-slate-100 shadow-sm shadow-slate-100/80'}`}>
              <div className="flex items-center gap-2 mb-4">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isDark ? 'bg-violet-500/15' : 'bg-violet-50'}`}>
                  <CheckCircle size={11} className="text-violet-500" />
                </div>
                <p className={`text-[11px] font-black tracking-widest uppercase ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Quick Actions</p>
              </div>
              <div className="grid grid-cols-4 gap-y-4 gap-x-2">
                {[
                  { 
                    label: 'Planner', 
                    icon: Calendar, 
                    color: 'rose',
                    action: () => setShowPlannerModal(true) 
                  },
                  { 
                    label: 'Helpdesk', 
                    icon: Wrench, 
                    color: 'amber',
                    badge: openServiceCount > 0 ? openServiceCount : null,
                    action: () => setActiveTab('service') 
                  },
                  { 
                    label: 'Garage', 
                    icon: Car, 
                    color: 'sky',
                    action: () => setActiveTab('garage') 
                  },
                  { 
                    label: 'Pre-Approve', 
                    icon: ShieldCheck, 
                    color: 'violet',
                    action: () => { setAccessSubTab('preapprove'); setActiveTab('access'); }
                  },
                  { 
                    label: 'Directory', 
                    icon: Search, 
                    color: 'indigo',
                    action: () => setShowDirectoryModal(true) 
                  },
                  { 
                    label: 'Notices', 
                    icon: Megaphone, 
                    color: 'fuchsia',
                    badge: unreadNoticeCount > 0 ? unreadNoticeCount : null,
                    action: () => {
                      setActiveTab('all-notices');
                      localStorage.setItem('notices_last_seen', String(Date.now()));
                      setUnreadNoticeCount(0);
                    } 
                  },
                  { 
                    label: 'Community', 
                    icon: Users, 
                    color: 'emerald',
                    action: () => setActiveTab('community') 
                  },
                  { 
                    label: 'My Flat', 
                    icon: Home, 
                    color: 'purple',
                    action: () => setActiveTab('flat') 
                  },
                ].map((item, idx) => {
                  const colorMap = {
                    rose: { bg: isDark ? 'bg-rose-500/15' : 'bg-rose-50', icon: 'text-rose-500', border: isDark ? 'border-rose-500/20' : 'border-rose-100', glow: 'group-hover:shadow-[0_4px_14px_rgba(244,63,94,0.35)]' },
                    amber: { bg: isDark ? 'bg-amber-500/15' : 'bg-amber-50', icon: 'text-amber-500', border: isDark ? 'border-amber-500/20' : 'border-amber-100', glow: 'group-hover:shadow-[0_4px_14px_rgba(245,158,11,0.35)]' },
                    sky: { bg: isDark ? 'bg-sky-500/15' : 'bg-sky-50', icon: 'text-sky-500', border: isDark ? 'border-sky-500/20' : 'border-sky-100', glow: 'group-hover:shadow-[0_4px_14px_rgba(14,165,233,0.35)]' },
                    violet: { bg: isDark ? 'bg-violet-500/15' : 'bg-violet-50', icon: 'text-violet-500', border: isDark ? 'border-violet-500/20' : 'border-violet-100', glow: 'group-hover:shadow-[0_4px_14px_rgba(139,92,246,0.35)]' },
                    indigo: { bg: isDark ? 'bg-indigo-500/15' : 'bg-indigo-50', icon: 'text-indigo-500', border: isDark ? 'border-indigo-500/20' : 'border-indigo-100', glow: 'group-hover:shadow-[0_4px_14px_rgba(99,102,241,0.35)]' },
                    fuchsia: { bg: isDark ? 'bg-fuchsia-500/15' : 'bg-fuchsia-50', icon: 'text-fuchsia-500', border: isDark ? 'border-fuchsia-500/20' : 'border-fuchsia-100', glow: 'group-hover:shadow-[0_4px_14px_rgba(217,70,239,0.35)]' },
                    emerald: { bg: isDark ? 'bg-emerald-500/15' : 'bg-emerald-50', icon: 'text-emerald-500', border: isDark ? 'border-emerald-500/20' : 'border-emerald-100', glow: 'group-hover:shadow-[0_4px_14px_rgba(16,185,129,0.35)]' },
                    purple: { bg: isDark ? 'bg-purple-500/15' : 'bg-purple-50', icon: 'text-purple-500', border: isDark ? 'border-purple-500/20' : 'border-purple-100', glow: 'group-hover:shadow-[0_4px_14px_rgba(168,85,247,0.35)]' },
                  };
                  const c = colorMap[item.color];
                  return (
                    <button
                      key={idx}
                      onClick={item.action}
                      className="flex flex-col items-center gap-2 group relative active:scale-90 transition-all duration-200"
                    >
                      <div className={`relative w-14 h-14 rounded-[18px] border flex items-center justify-center transition-all duration-300 ${c.bg} ${c.border} ${c.glow} group-hover:scale-105`}>
                        <item.icon size={20} strokeWidth={2} className={`${c.icon} transition-transform duration-300 group-hover:scale-110`} />
                        {item.badge && (
                          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-rose-500 text-white text-[8px] font-black flex items-center justify-center px-1 border-2 border-white dark:border-slate-900 shadow-sm z-20">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <span className={`text-[9.5px] font-extrabold tracking-tight text-center leading-tight transition-colors duration-200 ${
                        isDark ? 'text-slate-400 group-hover:text-slate-200' : 'text-slate-500 group-hover:text-slate-800'
                      }`}>
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Create Community Update ── */}
            <div className={`rounded-[22px] border overflow-hidden ${isDark ? 'bg-slate-900/50 border-slate-800/60' : 'bg-white border-slate-100 shadow-sm'}`}>
              <div className={`px-4 pt-3.5 pb-2 flex items-center gap-2 border-b ${isDark ? 'border-slate-800/50' : 'border-slate-50'}`}>
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isDark ? 'bg-emerald-500/15' : 'bg-emerald-50'}`}>
                  <Megaphone size={11} className="text-emerald-500" />
                </div>
                <p className={`text-[11px] font-black tracking-widest uppercase ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Share with Society</p>
              </div>
              <div className="p-3 flex gap-2.5">
                <button
                  onClick={() => { setCreatorTab('feed_post'); setShowPostModal(true); }}
                  className={`flex-1 px-3 py-3 rounded-xl flex flex-col items-center justify-center gap-1.5 text-center transition-all active:scale-95 group border ${
                    isDark 
                      ? 'bg-emerald-500/8 hover:bg-emerald-500/15 border-emerald-500/15 hover:border-emerald-500/25' 
                      : 'bg-emerald-50/80 hover:bg-emerald-50 border-emerald-100 hover:border-emerald-200'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-0.5 transition-transform group-hover:scale-110 ${isDark ? 'bg-emerald-500/15' : 'bg-emerald-100/80'}`}>
                    <Megaphone size={14} className="text-emerald-500" strokeWidth={2.2} />
                  </div>
                  <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 tracking-tight">Create Post</span>
                  <span className={`text-[8px] font-semibold ${subtext}`}>Share updates</span>
                </button>
                <button
                  onClick={() => { setCreatorTab('poll'); setShowPostModal(true); }}
                  className={`flex-1 px-3 py-3 rounded-xl flex flex-col items-center justify-center gap-1.5 text-center transition-all active:scale-95 group border ${
                    isDark 
                      ? 'bg-indigo-500/8 hover:bg-indigo-500/15 border-indigo-500/15 hover:border-indigo-500/25' 
                      : 'bg-indigo-50/80 hover:bg-indigo-50 border-indigo-100 hover:border-indigo-200'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-0.5 transition-transform group-hover:scale-110 ${isDark ? 'bg-indigo-500/15' : 'bg-indigo-100/80'}`}>
                    <CheckCircle size={14} className="text-indigo-500" strokeWidth={2.2} />
                  </div>
                  <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 tracking-tight">Start Poll</span>
                  <span className={`text-[8px] font-semibold ${subtext}`}>Get opinions</span>
                </button>
                <button
                  onClick={() => setShowPlannerModal(true)}
                  className={`flex-1 px-3 py-3 rounded-xl flex flex-col items-center justify-center gap-1.5 text-center transition-all active:scale-95 group border ${
                    isDark 
                      ? 'bg-rose-500/8 hover:bg-rose-500/15 border-rose-500/15 hover:border-rose-500/25' 
                      : 'bg-rose-50/80 hover:bg-rose-50 border-rose-100 hover:border-rose-200'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-0.5 transition-transform group-hover:scale-110 ${isDark ? 'bg-rose-500/15' : 'bg-rose-100/80'}`}>
                    <List size={14} className="text-rose-500" strokeWidth={2.2} />
                  </div>
                  <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 tracking-tight">My Chores</span>
                  <span className={`text-[8px] font-semibold ${subtext}`}>Task planner</span>
                </button>
              </div>
            </div>

            {/* ── Community Feed Posts & Polls ── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-0.5">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isDark ? 'bg-emerald-500/15' : 'bg-emerald-50'}`}>
                    <MessageSquare size={11} className="text-emerald-500" />
                  </div>
                  <p className={`text-[11px] font-black tracking-widest uppercase ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Community Feed</p>
                </div>
                {posts.length > 0 && (
                  <button onClick={() => setActiveTab('all-posts')} className="text-[9px] font-extrabold text-emerald-500 hover:text-emerald-400 transition-colors flex items-center gap-0.5">
                    See All <ChevronRight size={10} />
                  </button>
                )}
              </div>

              {dataLoading ? (
                <div className={`p-8 rounded-[26px] border text-center ${cardBg}`}>
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className={`text-xs ${subtext}`}>Loading community feed...</p>
                </div>
              ) : posts.length === 0 ? (
                <div className={`p-8 rounded-[26px] border text-center ${cardBg}`}>
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 ${isDark ? 'bg-indigo-500/10' : 'bg-indigo-50'}`}>
                    <HeartHandshake size={24} className="text-indigo-400 opacity-60" />
                  </div>
                  <p className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>No posts yet</p>
                  <p className={`text-[10px] mt-1 ${subtext}`}>Start the conversation!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.slice(0, 2).map((post) => renderFeedPostCard(post))}
                  
                  {posts.length > 0 && (
                    <button
                      onClick={() => setActiveTab('all-posts')}
                      className={`w-full py-3.5 rounded-2xl border text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                        isDark 
                          ? 'border-emerald-500/20 bg-emerald-50/5 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.03)]' 
                          : 'border-emerald-100 bg-emerald-50/50 text-emerald-650 hover:bg-emerald-50 hover:border-emerald-300 shadow-sm shadow-emerald-500/5'
                      }`}
                    >
                      <span>View All {posts.length} Posts & Polls</span>
                      <ChevronRight size={14} className="animate-pulse" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ── Society Notices Board ── */}
            <div ref={noticesRef} className="space-y-4" onClick={() => {
                localStorage.setItem('notices_last_seen', String(Date.now()));
                setUnreadNoticeCount(0);
              }}>
              <div className="flex items-center justify-between px-0.5">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all ${
                    isDark 
                      ? 'bg-fuchsia-950/20 text-fuchsia-400 border-fuchsia-900/30' 
                      : 'bg-gradient-to-tr from-fuchsia-50 to-pink-50 text-fuchsia-600 border border-fuchsia-100/40 shadow-sm'
                  } relative`}>
                    <Megaphone size={13} className="text-fuchsia-500 animate-pulse" />
                    {unreadNoticeCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-white dark:border-slate-900" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className={`text-xs font-black tracking-wider uppercase ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Society Notices</p>
                      {unreadNoticeCount > 0 && (
                        <span className="text-[8px] font-black bg-rose-500 text-white px-2 py-0.5 rounded-full shadow-sm shadow-rose-500/20 animate-pulse">{unreadNoticeCount} new</span>
                      )}
                    </div>
                  </div>
                </div>
                {realNotices.length > 0 && (
                  <button 
                    onClick={() => setActiveTab('all-notices')} 
                    className={`text-[10px] font-black text-fuchsia-600 dark:text-fuchsia-400 hover:text-fuchsia-700 dark:hover:text-fuchsia-350 transition-all flex items-center gap-0.5 px-3 py-1 rounded-xl border ${
                      isDark 
                        ? 'bg-fuchsia-950/15 border-fuchsia-900/20' 
                        : 'bg-fuchsia-50/50 border-fuchsia-100/30'
                    }`}
                  >
                    See All <ChevronRight size={11} strokeWidth={2.5} />
                  </button>
                )}
              </div>

              {dataLoading ? (
                <div className={`p-8 rounded-[28px] border text-center ${
                  isDark ? 'bg-slate-900/60 border-slate-800/80' : 'bg-white border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.015)]'
                }`}>
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">Notices load ho rahe hain...</p>
                </div>
              ) : realNotices.length === 0 ? (
                <div className={`p-8 rounded-[28px] border text-center ${
                  isDark ? 'bg-slate-900/60 border-slate-800/80 shadow-md' : 'bg-white border-slate-100 shadow-sm'
                }`}>
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner ${
                    isDark ? 'bg-fuchsia-500/10' : 'bg-fuchsia-50'
                  }`}>
                    <Megaphone size={24} className="text-fuchsia-500 opacity-60 animate-bounce" />
                  </div>
                  <h4 className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Bulletins are Clear</h4>
                  <p className={`text-[10px] mt-1 max-w-[200px] mx-auto leading-relaxed ${subtext}`}>Koi naya notice nahi hai. Check back later for updates.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {realNotices.slice(0, 3).map((notice) => renderNoticeCard(notice))}
                  {realNotices.length > 0 && (
                    <button
                      onClick={() => setActiveTab('all-notices')}
                      className={`w-full py-3.5 rounded-2xl border text-[10.5px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                        isDark 
                          ? 'border-indigo-900/40 bg-gradient-to-r from-indigo-950/20 to-violet-950/20 text-indigo-400 hover:from-indigo-950/45 hover:to-violet-950/45 shadow-[0_4px_20px_rgba(99,102,241,0.15)]' 
                          : 'border-indigo-100 bg-gradient-to-r from-indigo-50/70 to-violet-50/70 text-indigo-700 hover:from-indigo-100 hover:to-violet-100 shadow-[0_4px_16px_rgba(99,102,241,0.05)]'
                      }`}
                    >
                      <span>View All {realNotices.length} Notices</span>
                      <ChevronRight size={14} className="animate-pulse" />
                    </button>
                  )}
                </div>
              )}
            </div>
            
            <AdBanner />
          </div>
        );
      case 'flat': return <MyFlat user={user} sharedSocket={sharedSocket} />;
      case 'garage': return <ResidentGarage />;
      case 'service': return <ServiceRequest user={user} />;
      case 'preapprove': // fallthrough
      case 'logs':      // fallthrough  
      case 'access': return (
        <div className="space-y-0 animate-slide-up">
          {/* Section Switcher Header */}
          <div className={`rounded-[24px] border overflow-hidden mb-4 ${isDark ? 'bg-slate-900/60 border-slate-800/60' : 'bg-white border-slate-100 shadow-sm'}`}>
            <div className={`px-4 pt-4 pb-3 border-b ${isDark ? 'border-slate-800/50' : 'border-slate-50'}`}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isDark ? 'bg-indigo-500/15' : 'bg-indigo-50'}`}>
                  <KeyRound size={15} className="text-indigo-500" />
                </div>
                <div>
                  <p className={`text-[13px] font-black tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>Gate Access</p>
                  <p className={`text-[9px] font-semibold ${subtext}`}>Pre-approvals & visitor history</p>
                </div>
              </div>
              {/* Internal tab switcher */}
              <div className={`flex gap-1.5 p-1 rounded-2xl ${isDark ? 'bg-slate-800/60' : 'bg-slate-100'}`}>
                <button
                  onClick={() => setAccessSubTab('preapprove')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-black transition-all ${
                    accessSubTab === 'preapprove'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                      : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <ShieldCheck size={12} />
                  <span>Pre-Approve</span>
                </button>
                <button
                  onClick={() => setAccessSubTab('logs')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-black transition-all ${
                    accessSubTab === 'logs'
                      ? 'bg-slate-700 text-white shadow-md'
                      : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <History size={12} />
                  <span>Visitor Logs</span>
                </button>
              </div>
            </div>
          </div>

          {/* Content based on sub-tab */}
          {accessSubTab === 'preapprove'
            ? <PreApprove user={user} />
            : <ResidentLogs user={user} sharedSocket={sharedSocket} />
          }
        </div>
      );
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
            
            {/* ── Top Premium Backdrop Image ── */}
            <div className="absolute top-0 left-0 right-0 h-[240px] overflow-hidden pointer-events-none z-0">
              <img 
                src="/society_banner.png" 
                alt="Top Background" 
                className="w-full h-full object-cover opacity-[0.06] dark:opacity-[0.12] blur-[3px] scale-105" 
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <div 
                className="absolute inset-0" 
                style={{
                  background: isDark 
                    ? 'linear-gradient(to bottom, rgba(15, 23, 42, 0.1) 0%, rgba(15, 23, 42, 0.6) 65%, #0f172a 100%)' 
                    : 'linear-gradient(to bottom, rgba(241, 245, 249, 0.1) 0%, rgba(241, 245, 249, 0.6) 65%, #f1f5f9 100%)'
                }} 
              />
            </div>

            {/* ── Premium Sticky Header ── */}
            <header className={`sticky top-0 z-40 px-4 py-3 border-b flex items-center justify-between backdrop-blur-xl
              ${isDark ? 'bg-slate-950/90 border-slate-800/60' : 'bg-white/95 border-slate-100/80 shadow-sm'}`}>

              {/* Left: Avatar + Flat number like NoBrokerHood */}
              <button onClick={() => setShowProfile(true)} className="flex items-center gap-2.5 group">
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-indigo-500/30 group-hover:scale-105 transition-transform">
                    {user?.name?.charAt(0)?.toUpperCase() || 'R'}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white dark:border-slate-950 shadow-sm" />
                </div>
                <div className="leading-tight">
                  {/* Flat number prominently shown like NoBrokerHood A-102 */}
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border font-black text-xs tracking-wider ${
                    isDark ? 'bg-indigo-500/10 border-indigo-500/25 text-indigo-300' : 'bg-indigo-50 border-indigo-200/80 text-indigo-700'
                  }`}>
                    <span className="text-[10px]">🏠</span>
                    <span>{user?.tower ? `${user.tower}-` : ''}{user?.flat_number || '101'}</span>
                  </div>
                  <p className={`text-[9px] font-semibold mt-0.5 ml-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    {user?.name?.split(' ')[0] || 'Resident'}
                  </p>
                </div>
              </button>

              {/* Right: Action icons */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    setActiveTab('all-notices');
                    localStorage.setItem('notices_last_seen', String(Date.now()));
                    setUnreadNoticeCount(0);
                  }}
                  className={`w-9 h-9 rounded-full relative flex items-center justify-center transition-all ${
                    isDark ? 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'
                  }`}
                >
                  <Bell size={16} />
                  {unreadNoticeCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-rose-500 text-white text-[8px] font-black flex items-center justify-center px-1 shadow-sm border border-white dark:border-slate-950 animate-bounce">{unreadNoticeCount}</span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all relative ${
                    isDark ? 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'
                  }`}
                >
                  <MessageSquare size={16} />
                </button>

                <button
                  onClick={onLogout}
                  className="w-9 h-9 rounded-full flex items-center justify-center bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-500 transition-all border border-red-500/15"
                >
                  <LogOut size={14} strokeWidth={2.5} />
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

            {/* ── Premium Bottom Tab Navigation ── */}
            <nav className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40 backdrop-blur-xl border-t ${
              isDark ? 'bg-slate-950/90 border-slate-800/70' : 'bg-white/95 border-slate-100 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]'
            }`}>
              <div className="flex items-center px-2 py-1.5">
                {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
                  const active = activeTab === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setActiveTab(key)}
                      className={`flex-1 flex flex-col items-center gap-1 py-1.5 rounded-2xl transition-all duration-200 ${
                        active
                          ? isDark ? 'text-indigo-400' : 'text-indigo-600'
                          : isDark ? 'text-slate-500 hover:text-slate-300' : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      <div className={`relative flex items-center justify-center w-9 h-9 rounded-[14px] transition-all duration-300 ${
                        active
                          ? 'bg-gradient-to-br from-indigo-500/20 to-purple-500/10 dark:from-indigo-500/25 dark:to-purple-500/15 scale-110 border border-indigo-500/20 shadow-[0_0_12px_rgba(99,102,241,0.25)]'
                          : 'scale-100 border border-transparent'
                      }`}>
                        <Icon size={17} strokeWidth={active ? 2.5 : 1.8} className={active ? "drop-shadow-[0_0_6px_rgba(99,102,241,0.85)]" : ""} />
                        {active && <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-3.5 h-0.5 bg-indigo-500 rounded-full" />}
                      </div>
                      <span className={`text-[8px] font-black tracking-wide leading-none ${
                        active ? (isDark ? 'text-indigo-400' : 'text-indigo-600') : ''
                      }`}>{label}</span>
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
          <div className={`w-full max-w-sm p-6 border animate-scale-up ${isDark ? 'glass-panel border-slate-800/80 shadow-[0_20px_50px_rgba(0,0,0,0.5)]' : 'glass-card-light border-white/60 shadow-[0_20px_50px_rgba(31,38,135,0.08)]'}`}>
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
          <div className={`w-full max-w-sm p-6 border animate-scale-up ${isDark ? 'glass-panel border-slate-800/80 shadow-[0_20px_50px_rgba(0,0,0,0.5)]' : 'glass-card-light border-white/60 shadow-[0_20px_50px_rgba(31,38,135,0.08)]'}`}>
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
          <div className={`w-full max-w-sm p-6 border animate-scale-up ${isDark ? 'glass-panel border-slate-800/80 shadow-[0_20px_50px_rgba(0,0,0,0.5)]' : 'glass-card-light border-white/60 shadow-[0_20px_50px_rgba(31,38,135,0.08)]'}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-extrabold text-sm flex items-center gap-1.5"><Search size={18} className="text-indigo-500" /> Society Intercom & Directory</h3>
              <button 
                onClick={() => { setShowDirectoryModal(false); setDirectorySearch(''); }} 
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            {/* Premium glassmorphism tab layout to switch intercom vs residents directory */}
            <div className="flex p-1 gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-[10px] font-bold mb-3 border dark:border-slate-700/50">
              <button
                type="button"
                onClick={() => { setDirectoryTab('intercom'); setDirectorySearch(''); }}
                className={`flex-1 py-2 rounded-lg text-center transition-all flex items-center justify-center gap-1.5 ${
                  directoryTab === 'intercom'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <Phone size={12} />
                <span>Intercom & Staff</span>
              </button>
              <button
                type="button"
                onClick={() => { setDirectoryTab('residents'); setDirectorySearch(''); }}
                className={`flex-1 py-2 rounded-lg text-center transition-all flex items-center justify-center gap-1.5 ${
                  directoryTab === 'residents'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <Search size={12} />
                <span>Residents Directory</span>
              </button>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                <input 
                  type="text" 
                  placeholder={directoryTab === 'intercom' ? "Search guard, manager, helper, or helpline..." : "Search resident name, flat number, or tower..."}
                  value={directorySearch}
                  onChange={e => setDirectorySearch(e.target.value)}
                  className={`w-full rounded-xl border pl-9 pr-3 py-2 text-xs outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                />
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                {(() => {
                  const q = directorySearch.toLowerCase();
                  const filtered = realContacts.filter(c => {
                    // First, filter by tab
                    if (directoryTab === 'intercom' && c.category === 'Residents') return false;
                    if (directoryTab === 'residents' && c.category !== 'Residents') return false;

                    // Next, filter by search query
                    return (
                      c.name?.toLowerCase().includes(q) ||
                      c.flat_number?.toLowerCase().includes(q) ||
                      c.tower?.toLowerCase().includes(q) ||
                      c.role?.toLowerCase().includes(q) ||
                      c.category?.toLowerCase().includes(q)
                    );
                  });

                  // If empty, show fallback
                  const displayList = filtered.length > 0 ? filtered : (
                    directoryTab === 'intercom' ? [
                      { name: 'Gate Security Cabin', role: 'Main Gatehouse Intercom', flat_number: 'Gate 1', phone: '1000', category: 'Security' },
                      { name: 'Society Helpdesk', role: 'Helpline Desk', flat_number: 'Office', phone: '1002', category: 'Security' }
                    ] : [
                      { name: 'No active members found', role: 'Resident', flat_number: '--', phone: '', category: 'Residents' }
                    ]
                  );

                  return displayList.map((c, i) => (
                    <div key={i} className={`p-3 rounded-2xl border flex items-center justify-between animate-fade-in ${isDark ? 'bg-slate-850 border-slate-700/50' : 'bg-slate-50 border-slate-200'}`}>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-xs font-black">{c.name}</p>
                          <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded-full border ${
                            c.category === 'Residents' 
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                              : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                          }`}>
                            {c.role}
                          </span>
                        </div>
                        <p className={`text-[9px] font-medium mt-1 ${subtext}`}>
                          {c.tower ? `${c.tower} - ` : ''}Flat {c.flat_number} {c.phone ? `• ${c.phone}` : ''}
                        </p>
                      </div>
                      {c.phone && (
                        <a href={`tel:${c.phone}`} className="w-8 h-8 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white flex items-center justify-center shadow-md shrink-0 transition-all">
                          <Phone size={14} />
                        </a>
                      )}
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. CREATE COMMUNITY POST MODAL — Premium Redesign */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className={`w-full sm:max-w-sm rounded-t-[32px] sm:rounded-[28px] overflow-hidden animate-slide-up sm:animate-scale-up ${
            isDark ? 'bg-slate-900 border border-slate-800/80 shadow-[0_-20px_60px_rgba(0,0,0,0.6)]' : 'bg-white border border-slate-100 shadow-[0_-10px_60px_rgba(0,0,0,0.12)]'
          }`}>
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className={`w-10 h-1 rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
            </div>

            {/* Header */}
            <div className={`px-5 pt-3 pb-4 border-b ${isDark ? 'border-slate-800/60' : 'border-slate-100'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Animated icon */}
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                    creatorTab === 'feed_post' ? (isDark ? 'bg-emerald-500/15' : 'bg-emerald-50') :
                    creatorTab === 'poll' ? (isDark ? 'bg-indigo-500/15' : 'bg-indigo-50') :
                    (isDark ? 'bg-pink-500/15' : 'bg-pink-50')
                  }`}>
                    {creatorTab === 'feed_post' && <PenLine size={18} className="text-emerald-500" />}
                    {creatorTab === 'poll' && <BarChart2 size={18} className="text-indigo-500" />}
                    {creatorTab === 'notice' && <Megaphone size={18} className="text-pink-500" />}
                  </div>
                  <div>
                    <h3 className={`font-black text-sm tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                      {creatorTab === 'feed_post' && 'Community Post'}
                      {creatorTab === 'poll' && 'Society Poll'}
                      {creatorTab === 'notice' && 'Official Notice'}
                    </h3>
                    <p className={`text-[9px] font-semibold mt-0.5 ${subtext}`}>
                      {creatorTab === 'feed_post' && 'Share with your society'}
                      {creatorTab === 'poll' && '1 vote per flat'}
                      {creatorTab === 'notice' && 'Management board only'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => { 
                    setShowPostModal(false); 
                    setFeedPostTitle(''); 
                    setFeedPostBody(''); 
                    setPollQuestion(''); 
                    setPollOpts(['', '', '']);
                    setPostText(''); 
                  }} 
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    isDark ? 'bg-slate-800 text-slate-400 hover:text-slate-200' : 'bg-slate-100 text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <X size={15} />
                </button>
              </div>

              {/* Premium Tab Row */}
              <div className={`flex gap-1.5 mt-4 p-1 rounded-2xl ${isDark ? 'bg-slate-800/60' : 'bg-slate-100'}`}>
                {[
                  { key: 'feed_post', label: 'Post', icon: PenLine, color: 'emerald' },
                  { key: 'poll', label: 'Poll', icon: BarChart2, color: 'indigo' },
                  { key: 'notice', label: 'Notice', icon: Megaphone, color: 'pink' },
                ].map(t => {
                  const active = creatorTab === t.key;
                  const colorActive = t.color === 'emerald' ? 'bg-emerald-600' : t.color === 'indigo' ? 'bg-indigo-600' : 'bg-pink-600';
                  return (
                    <button
                      key={t.key}
                      onClick={() => setCreatorTab(t.key)}
                      className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-[10px] font-black transition-all ${
                        active
                          ? `${colorActive} text-white shadow-md`
                          : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <t.icon size={11} />
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content Area */}
            <div className="px-5 py-4 space-y-3 max-h-[65vh] overflow-y-auto scrollbar-none">
              {/* Tab 1: Feed Post Form */}
              {creatorTab === 'feed_post' && (
                <div className="space-y-3">
                  <div className={`flex items-start gap-2.5 p-3 rounded-2xl border ${
                    isDark ? 'bg-emerald-500/5 border-emerald-500/15' : 'bg-emerald-50/60 border-emerald-100'
                  }`}>
                    <div className="w-7 h-7 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0 mt-0.5">
                      <PenLine size={12} className="text-emerald-500" />
                    </div>
                    <p className={`text-[10px] leading-relaxed ${subtext}`}>Share a thought, announcement, or discuss anything with the society feed instantly!</p>
                  </div>
                  <div>
                    <label className={`text-[9px] font-black uppercase tracking-wider mb-1.5 block ${subtext}`}>Post Title *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Lost keys in block H garden..." 
                      value={feedPostTitle}
                      onChange={e => setFeedPostTitle(e.target.value)}
                      className={`w-full rounded-2xl border px-4 py-3 text-xs outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500/40' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-300'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`text-[9px] font-black uppercase tracking-wider mb-1.5 block ${subtext}`}>Details (Optional)</label>
                    <textarea 
                      placeholder="Add more context, details, or contact info..."
                      rows={3}
                      value={feedPostBody}
                      onChange={e => setFeedPostBody(e.target.value)}
                      className={`w-full border rounded-2xl p-3 text-xs outline-none resize-none focus:ring-2 focus:ring-emerald-500/20 transition-all ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500/40' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-300'
                      }`}
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button 
                      onClick={() => setShowPostModal(false)} 
                      className={`flex-1 py-3 border rounded-2xl text-xs font-bold transition-all ${
                        isDark ? 'border-slate-700 text-slate-400 hover:bg-slate-800' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      Cancel
                    </button>
                    <button 
                      disabled={postLoading || !feedPostTitle.trim()}
                      onClick={async () => {
                        if (!feedPostTitle.trim()) return;
                        setPostLoading(true);
                        try {
                          await communityAPI.createPost({ type: 'post', title: feedPostTitle.trim(), body: feedPostBody.trim() });
                          setFeedPostTitle(''); setFeedPostBody('');
                          setShowPostModal(false);
                          await fetchPosts();
                          alert('✅ Post created successfully!');
                        } catch (err) { alert('Post submit nahi hui. Please try again.'); }
                        finally { setPostLoading(false); }
                      }}
                      className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-2xl text-xs font-black shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
                    >
                      {postLoading ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <PenLine size={13} />}
                      Publish Post
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 2: Start Poll Form */}
              {creatorTab === 'poll' && (
                <div className="space-y-3">
                  <div className={`flex items-start gap-2.5 p-3 rounded-2xl border ${
                    isDark ? 'bg-indigo-500/5 border-indigo-500/15' : 'bg-indigo-50/60 border-indigo-100'
                  }`}>
                    <div className="w-7 h-7 rounded-xl bg-indigo-500/15 flex items-center justify-center shrink-0 mt-0.5">
                      <BarChart2 size={12} className="text-indigo-500" />
                    </div>
                    <p className={`text-[10px] leading-relaxed ${subtext}`}>1 vote per flat — get instant community opinions!</p>
                  </div>
                  <div>
                    <label className={`text-[9px] font-black uppercase tracking-wider mb-1.5 block ${subtext}`}>Poll Question *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Paint color choice for clubhouse?" 
                      value={pollQuestion}
                      onChange={e => setPollQuestion(e.target.value)}
                      className={`w-full rounded-2xl border px-4 py-3 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-indigo-500/40' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-300'
                      }`}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className={`text-[9px] font-black uppercase tracking-wider block ${subtext}`}>Options (min 2)</label>
                    {pollOpts.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 text-[9px] font-black ${
                          isDark ? 'bg-indigo-500/15 text-indigo-400' : 'bg-indigo-100 text-indigo-600'
                        }`}>{i + 1}</div>
                        <input 
                          type="text" 
                          placeholder={`Option ${i + 1}`}
                          value={opt}
                          onChange={e => { const u = [...pollOpts]; u[i] = e.target.value; setPollOpts(u); }}
                          className={`flex-1 rounded-2xl border px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                            isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-indigo-500/40' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-300'
                          }`}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button 
                      onClick={() => setShowPostModal(false)} 
                      className={`flex-1 py-3 border rounded-2xl text-xs font-bold transition-all ${
                        isDark ? 'border-slate-700 text-slate-400 hover:bg-slate-800' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
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
                          await communityAPI.createPost({ type: 'poll', title: pollQuestion.trim(), poll_options: filteredOpts });
                          setPollQuestion(''); setPollOpts(['', '', '']);
                          setShowPostModal(false);
                          await fetchPosts();
                          alert('✅ Poll started successfully!');
                        } catch (err) { alert('Poll submit nahi hui. Please try again.'); }
                        finally { setPostLoading(false); }
                      }}
                      className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl text-xs font-black shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all"
                    >
                      {postLoading ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <BarChart2 size={13} />}
                      Launch Poll
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 3: Notice Form */}
              {creatorTab === 'notice' && (
                (user?.role === 'manager' || user?.role === 'admin' || user?.role === 'super_admin') ? (
                  <div className="space-y-3 animate-slide-up">
                    <div className={`flex items-start gap-2.5 p-3 rounded-2xl border ${
                      isDark ? 'bg-pink-500/5 border-pink-500/15' : 'bg-pink-50/60 border-pink-100'
                    }`}>
                      <div className="w-7 h-7 rounded-xl bg-pink-500/15 flex items-center justify-center shrink-0 mt-0.5">
                        <Megaphone size={12} className="text-pink-500" />
                      </div>
                      <p className={`text-[10px] leading-relaxed ${subtext}`}>Society notice — manager ke approval ke baad publish hogi.</p>
                    </div>
                    <textarea 
                      placeholder="e.g. Water cut on Thursday 10AM–2PM..."
                      rows={4}
                      value={postText}
                      onChange={e => setPostText(e.target.value)}
                      className={`w-full border rounded-2xl p-3 text-xs outline-none resize-none focus:ring-2 focus:ring-pink-500/20 transition-all ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-pink-500/40' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-pink-300'
                      }`}
                    />
                    <div className="flex gap-2 pt-1">
                      <button 
                        onClick={() => { setShowPostModal(false); setPostText(''); }} 
                        className={`flex-1 py-3 border rounded-2xl text-xs font-bold ${
                          isDark ? 'border-slate-700 text-slate-400 hover:bg-slate-800' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
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
                            setPostText(''); setShowPostModal(false);
                            alert('✅ Notice submit ho gayi!');
                          } catch (err) { alert('Post submit nahi hui. Please try again.'); }
                          finally { setPostLoading(false); }
                        }}
                        className="flex-1 py-3 bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white rounded-2xl text-xs font-black shadow-lg shadow-pink-500/20 flex items-center justify-center gap-2 transition-all"
                      >
                        {postLoading ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Megaphone size={13} />}
                        Submit Notice
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 text-center py-6 px-2 animate-slide-up">
                    <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto border ${
                      isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-100'
                    }`}>
                      <span className="text-2xl">🔒</span>
                    </div>
                    <div>
                      <h4 className={`text-xs font-black uppercase tracking-wide mb-1 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>Management Only</h4>
                      <p className={`text-[10px] leading-relaxed max-w-[220px] mx-auto ${subtext}`}>
                        Official notices are posted by Management Board & Administrators only.
                      </p>
                    </div>
                    <div className={`p-3 rounded-2xl border text-left ${isDark ? 'bg-slate-800/50 border-slate-700/40' : 'bg-slate-50 border-slate-200'}`}>
                      <p className="text-[10px] font-bold text-indigo-500 flex items-center gap-1 mb-1">💡 Instead, try:</p>
                      <p className={`text-[9px] leading-relaxed ${subtext}`}>Use Feed Post or Start Poll to share updates with the society instantly!</p>
                    </div>
                    <button 
                      onClick={() => setCreatorTab('feed_post')}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black shadow-lg transition-all active:scale-95"
                    >
                      Write Feed Post ✍️
                    </button>
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
