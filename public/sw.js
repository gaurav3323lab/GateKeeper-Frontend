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
    self.registration.showNotification(title, options)
  );
});

// ── Notification Click: Notification par tap karo ─────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Agar app already open hai to focus karo
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Nahi to new tab mein kholo
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// ── Install & Activate (basic lifecycle) ─────────────────────
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
