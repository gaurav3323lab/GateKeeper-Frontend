/* =============================================================
   GateKeeper — Service Worker (sw.js)
   Browser ke background mein run hota hai — tab band hone ke
   baad bhi OS notification dikhata hai.
   ============================================================= */

const CACHE_NAME = 'gatekeeper-v1';
const APP_ICON = '/icon-192.png';

// ── Push Event: Backend se notification aayi ─────────────────
self.addEventListener('push', (event) => {
  let payload = { title: 'GateKeeper', body: 'Nayi notification aayi!', data: {} };

  if (event.data) {
    try {
      payload = event.data.json();
    } catch (e) {
      payload.body = event.data.text();
    }
  }

  const { title, body, data = {} } = payload;

  // Notification type ke hisaab se icon aur badge change hoga
  const typeConfig = {
    sos:          { icon: APP_ICON, badge: APP_ICON, vibrate: [300, 100, 300, 100, 300], requireInteraction: true, tag: 'sos' },
    visitor:      { icon: APP_ICON, badge: APP_ICON, vibrate: [200, 100, 200], requireInteraction: true, tag: 'visitor' },
    checkin:      { icon: APP_ICON, badge: APP_ICON, vibrate: [100, 50, 100], tag: 'checkin' },
    checkout:     { icon: APP_ICON, badge: APP_ICON, vibrate: [100], tag: 'checkout' },
    vehicle_entry:{ icon: APP_ICON, badge: APP_ICON, vibrate: [150, 50, 150], tag: 'vehicle_entry' },
    vehicle_exit: { icon: APP_ICON, badge: APP_ICON, vibrate: [150], tag: 'vehicle_exit' },
    announcement: { icon: APP_ICON, badge: APP_ICON, vibrate: [100], tag: 'announcement' },
    approval:     { icon: APP_ICON, badge: APP_ICON, vibrate: [200, 100, 200], requireInteraction: true, tag: 'approval' },
    default:      { icon: APP_ICON, badge: APP_ICON, vibrate: [100], tag: 'general' },
  };

  const cfg = typeConfig[data.type] || typeConfig.default;

  const options = {
    body,
    icon: cfg.icon,
    badge: cfg.badge,
    vibrate: cfg.vibrate,
    tag: cfg.tag,
    requireInteraction: cfg.requireInteraction || false,
    data: { url: data.url || '/', type: data.type },
    actions: data.type === 'visitor' ? [
      { action: 'approve', title: '✅ Allow Entry' },
      { action: 'deny',    title: '❌ Deny Entry' },
    ] : [],
  };

  event.waitUntil(
    self.registration.showNotification(title, options).then(() => {
      // Minimized app ko bhi notify karo — postMessage bhejo
      // App background mein modal ready kar lega, foreground aate hi dikhega
      if (data.type === 'visitor' || data.type === 'sos' || data.type === 'approval') {
        return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
          clientList.forEach((client) => {
            client.postMessage({
              type: 'push_received',
              notifType: data.type,
              title,
              body,
              guest_id: data.guest_id || null,
              flat_number: data.flat_number || null,
              name: data.visitor_name || null,
            });
          });
        });
      }
    })
  );
});

// ── Notification Click: Notification par tap karo ─────────────
self.addEventListener('notificationclick', (event) => {
  const notifData = event.notification.data || {};
  const notifType = notifData.type;
  const action = event.action; // 'approve' or 'deny' (inline action buttons)

  event.notification.close();

  // Inline action buttons (approve/deny) — handled by postMessage to app
  // These only work if app is already open; otherwise falls through to open app
  if (action === 'approve' || action === 'deny') {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'postMessage' in client) {
            client.postMessage({ type: 'visitor_action', action, guest_id: notifData.guest_id });
            return client.focus();
          }
        }
        // App not open — open it with pending_visitor param so modal auto-shows
        const guestId = notifData.guest_id;
        const openUrl = guestId
          ? `/?pending_visitor=${guestId}&action=${action}`
          : '/?check_visitor=1';
        if (clients.openWindow) return clients.openWindow(openUrl);
      })
    );
    return;
  }

  // Regular notification tap (no action button)
  // For visitor type: open app with ?pending_visitor param so call modal auto-shows
  let openUrl = notifData.url || '/';
  if (notifType === 'visitor' && notifData.guest_id) {
    openUrl = `/?pending_visitor=${notifData.guest_id}`;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Agar app already open hai to focus karo aur URL update karo
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.postMessage({ type: 'check_pending_visitor', guest_id: notifData.guest_id });
          return client.focus();
        }
      }
      // Nahi to new tab mein kholo
      if (clients.openWindow) {
        return clients.openWindow(openUrl);
      }
    })
  );
});


// ── Install & Activate (basic lifecycle) ─────────────────────
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
