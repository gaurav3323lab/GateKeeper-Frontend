/**
 * GateKeeper — Push Notification Service
 * 
 * Service Worker register karna, permission maangna,
 * aur VAPID subscription banake backend mein save karna.
 */

const API_URL = import.meta.env.VITE_API_URL || 'https://yellowgreen-goldfish-813322.hostingersite.com';

/** VAPID public key ko Uint8Array mein convert karta hai */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

/** Service Worker register karo */
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('[Push] Service Workers not supported in this browser');
    return null;
  }
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    console.log('[Push] Service Worker registered:', reg.scope);
    return reg;
  } catch (err) {
    console.error('[Push] Service Worker registration failed:', err);
    return null;
  }
}

/** Browser se notification permission maango */
export async function requestPermission() {
  if (!('Notification' in window)) {
    console.warn('[Push] Notifications not supported');
    return false;
  }
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;

  const result = await Notification.requestPermission();
  return result === 'granted';
}

/** Push subscription banao aur backend mein save karo */
export async function subscribeToPush(token) {
  try {
    // 1. Permission check
    const granted = await requestPermission();
    if (!granted) {
      console.warn('[Push] Notification permission denied');
      return false;
    }

    // 2. Service Worker ready hone ka wait karo
    const registration = await navigator.serviceWorker.ready;

    // 3. Backend se VAPID public key fetch karo
    const keyRes = await fetch(`${API_URL}/api/push/vapid-key`);
    const { publicKey } = await keyRes.json();

    // 4. Push subscription banao
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    // 5. Subscription backend mein save karo
    const subJson = subscription.toJSON();
    const saveRes = await fetch(`${API_URL}/api/push/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        endpoint: subJson.endpoint,
        keys: { p256dh: subJson.keys.p256dh, auth: subJson.keys.auth },
      }),
    });

    if (saveRes.ok) {
      localStorage.setItem('push_subscribed', 'true');
      console.log('[Push] Successfully subscribed!');
      return true;
    } else {
      console.error('[Push] Failed to save subscription to backend');
      return false;
    }
  } catch (err) {
    console.error('[Push] subscribeToPush error:', err);
    return false;
  }
}

/** Push subscription hatao */
export async function unsubscribeFromPush(token) {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();
      await fetch(`${API_URL}/api/push/unsubscribe`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ endpoint }),
      });
    }
    localStorage.removeItem('push_subscribed');
    console.log('[Push] Unsubscribed successfully');
  } catch (err) {
    console.error('[Push] Unsubscribe error:', err);
  }
}

/** Check karo ki notifications ka permission kya hai */
export function getNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission; // 'default' | 'granted' | 'denied'
}
