package com.gatekeeper.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    createNotificationChannels();
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
