import React, { useState, useEffect } from 'react';
import { Bell, Check, Loader } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://yellowgreen-goldfish-813322.hostingersite.com';

const NotificationsTab = ({ user }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const handleRefresh = () => {
      fetchNotifications();
    };

    window.addEventListener('refresh_notifications', handleRefresh);
    return () => window.removeEventListener('refresh_notifications', handleRefresh);
  }, []);

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    } catch (err) {
      console.error('Error marking as read', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/api/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    } catch (err) {
      console.error('Error marking all as read', err);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 bg-slate-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Bell className="text-indigo-500" size={28} />
          Notifications
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold ml-2">
              {unreadCount}
            </span>
          )}
        </h2>
        {unreadCount > 0 && (
          <button 
            onClick={markAllAsRead}
            className="flex items-center gap-2 text-sm text-indigo-600 bg-indigo-100 px-3 py-1.5 rounded-lg hover:bg-indigo-200 transition-colors font-medium"
          >
            <Check size={16} /> Mark all read
          </button>
        )}
      </div>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="text-center text-slate-500 py-12 bg-white rounded-2xl border border-slate-200">
            <Bell className="mx-auto mb-3 opacity-20" size={48} />
            <p>No notifications yet</p>
          </div>
        ) : (
          notifications.map(notif => (
            <div 
              key={notif.id} 
              onClick={() => !notif.is_read && markAsRead(notif.id)}
              className={`p-4 rounded-2xl border shadow-sm cursor-pointer transition-all ${
                notif.is_read ? 'bg-white border-slate-100 opacity-75 hover:opacity-100' : 'bg-indigo-50/50 border-indigo-200 hover:bg-indigo-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${
                    notif.type === 'sos' ? 'bg-red-100 text-red-500' :
                    notif.type === 'approval' ? 'bg-indigo-100 text-indigo-500' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {notif.type === 'sos' ? '🚨' : notif.type === 'approval' ? '🔔' : '📢'}
                  </div>
                  <div>
                    <h4 className={`text-base font-semibold ${!notif.is_read ? 'text-slate-900' : 'text-slate-700'}`}>
                      {notif.title}
                    </h4>
                    <p className={`text-sm mt-1 ${!notif.is_read ? 'text-slate-800' : 'text-slate-600'}`}>
                      {notif.message}
                    </p>
                    <p className="text-xs text-slate-400 mt-2 font-medium">
                      {formatDate(notif.created_at)}
                    </p>
                  </div>
                </div>
                {!notif.is_read && (
                  <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full mt-2 shrink-0"></div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsTab;
