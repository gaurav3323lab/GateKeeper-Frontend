package com.gatekeeper.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Intent;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    registerActivityPlugin(SystemAlertWindowPermissionPlugin.class);
    super.onCreate(savedInstanceState);
    createNotificationChannels();
    handleIncomingIntent(getIntent());
  }

  @Override
  protected void onNewIntent(Intent intent) {
    super.onNewIntent(intent);
    setIntent(intent);
    handleIncomingIntent(intent);
  }

  private void handleIncomingIntent(Intent intent) {
    if (intent != null && intent.hasExtra("pending_visitor")) {
      // 1. Show over lock screen if phone is locked
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
        setShowWhenLocked(true);
        setTurnScreenOn(true);
      } else {
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                             WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON |
                             WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON |
                             WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD);
      }

      // 2. Dismiss the full-screen incoming call notification since we are opening the app
      NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
      if (nm != null) {
        nm.cancel(9999); // VISITOR_NOTIFICATION_ID
      }

      // 3. Extract visitor details
      final String guestId = intent.getStringExtra("pending_visitor");
      final String action = intent.getStringExtra("notification_action");

      // 4. Send to WebView
      if (getBridge() != null && getBridge().getWebView() != null) {
        getBridge().getWebView().post(new Runnable() {
          @Override
          public void run() {
            String js = "if (window.handleAndroidIncomingCall) { " +
                        "  window.handleAndroidIncomingCall('" + guestId + "', '" + (action != null ? action : "") + "'); " +
                        "} else { " +
                        "  window.AndroidPendingCall = { guestId: '" + guestId + "', action: '" + (action != null ? action : "") + "' }; " +
                        "}";
            getBridge().getWebView().evaluateJavascript(js, null);
          }
        });
      }
    }
  }

  // ── INLINE CAPACITOR PLUGIN: Draw Over Other Apps / System Overlay Permission ──
  // This enables Chinese ROMs (MIUI, Vivo, Oppo) to directly jump to settings toggle
  // inside the App rather than asking users to dig through Settings manually!
  @com.getcapacitor.annotation.CapacitorPlugin(name = "SystemAlertWindowPermission")
  public static class SystemAlertWindowPermissionPlugin extends com.getcapacitor.Plugin {
      
      @com.getcapacitor.PluginMethod
      public void checkOverlayPermission(com.getcapacitor.PluginCall call) {
          com.getcapacitor.JSObject ret = new com.getcapacitor.JSObject();
          if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
              boolean granted = android.provider.Settings.canDrawOverlays(getContext());
              ret.put("granted", granted);
          } else {
              ret.put("granted", true);
          }
          call.resolve(ret);
      }

      @com.getcapacitor.PluginMethod
      public void requestOverlayPermission(com.getcapacitor.PluginCall call) {
          com.getcapacitor.JSObject ret = new com.getcapacitor.JSObject();
          if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
              if (!android.provider.Settings.canDrawOverlays(getContext())) {
                  android.content.Intent intent = new android.content.Intent(
                      android.provider.Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                      android.net.Uri.parse("package:" + getContext().getPackageName())
                  );
                  intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK);
                  getContext().startActivity(intent);
                  ret.put("opened", true);
              } else {
                  ret.put("opened", false);
              }
          } else {
              ret.put("opened", false);
          }
          call.resolve(ret);
      }
  }

  /**
   * 🔥 JUGAAD — NoBrokerHood jaisi call notification ke liye
   * Android 8+ mein notification channels zaroori hain.
   * visitor_calls channel: IMPORTANCE_HIGH = Heads-up notification (screen ke upar popup)
   * use_full_screen_intent ke saath: Lock screen pe bhi full-screen call dikhata hai!
   */
  private void createNotificationChannels() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      NotificationManager nm = getSystemService(NotificationManager.class);
      if (nm == null) return;

      // ── Visitor Calls Channel (PRIORITY_MAX — like incoming call) ──
      NotificationChannel visitorChannel = new NotificationChannel(
        "visitor_calls",              // channel ID — FCM mein bhi yahi use kiya
        "Visitor Call Alerts",        // User ko dikhne wala naam
        NotificationManager.IMPORTANCE_HIGH  // IMPORTANCE_HIGH = heads-up popup
      );
      visitorChannel.setDescription("Guard jab visitor allow karna chahe tab aata hai");
      visitorChannel.enableVibration(true);
      visitorChannel.setVibrationPattern(new long[]{0, 400, 200, 400, 200, 400});
      visitorChannel.setShowBadge(true);
      // Sound: default ringtone use karo
      AudioAttributes audioAttr = new AudioAttributes.Builder()
        .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
        .build();
      visitorChannel.setSound(
        android.provider.Settings.System.DEFAULT_RINGTONE_URI,
        audioAttr
      );
      nm.createNotificationChannel(visitorChannel);

      // ── SOS / Alerts Channel ──
      NotificationChannel sosChannel = new NotificationChannel(
        "sos_alerts",
        "SOS Emergency Alerts",
        NotificationManager.IMPORTANCE_HIGH
      );
      sosChannel.setDescription("Emergency SOS alerts");
      sosChannel.enableVibration(true);
      sosChannel.setVibrationPattern(new long[]{0, 300, 100, 300, 100, 300});
      nm.createNotificationChannel(sosChannel);

      // ── Default Channel ──
      NotificationChannel defaultChannel = new NotificationChannel(
        "default",
        "General Notifications",
        NotificationManager.IMPORTANCE_DEFAULT
      );
      defaultChannel.setDescription("General app notifications");
      nm.createNotificationChannel(defaultChannel);
    }
  }
}
