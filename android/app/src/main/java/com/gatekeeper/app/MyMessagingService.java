package com.gatekeeper.app;

import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;
import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import com.google.firebase.messaging.RemoteMessage;
import java.util.Map;

public class MyMessagingService extends com.capacitorjs.plugins.pushnotifications.MessagingService {

    private static final int VISITOR_NOTIFICATION_ID = 9999;

    @Override
    public void onMessageReceived(@NonNull RemoteMessage remoteMessage) {
        Map<String, String> data = remoteMessage.getData();
        
        // Check if this is a visitor call
        if (data != null && "true".equals(data.get("is_visitor_call"))) {
            showFullScreenNotification(remoteMessage);
        }
        
        // Also call super so that Capacitor plugins receive it when the app is in the foreground
        super.onMessageReceived(remoteMessage);
    }
    
    private void showFullScreenNotification(RemoteMessage remoteMessage) {
        Map<String, String> data = remoteMessage.getData();
        String title = data.get("title");
        String body = data.get("body");
        String guestId = data.get("guest_id");
        String visitorName = data.get("visitor_name");
        String flatNumber = data.get("flat_number");
        
        if (title == null) title = "Incoming Visitor";
        if (body == null) body = "A visitor is requesting entry.";
        
        Context context = getApplicationContext();
        
        // Intent to launch MainActivity when notification is clicked
        Intent intent = new Intent(context, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        intent.putExtra("pending_visitor", guestId);
        intent.putExtra("visitor_name", visitorName);
        intent.putExtra("flat_number", flatNumber);
        intent.putExtra("is_visitor_call", "true");
        
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        
        PendingIntent pendingIntent = PendingIntent.getActivity(
            context,
            (int) System.currentTimeMillis(),
            intent,
            flags
        );
        
        PendingIntent fullScreenPendingIntent = PendingIntent.getActivity(
            context,
            (int) System.currentTimeMillis() + 1,
            intent,
            flags
        );
        
        Uri ringtoneUri = android.provider.Settings.System.DEFAULT_RINGTONE_URI;
        
        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, "visitor_calls")
            .setSmallIcon(android.R.drawable.ic_menu_call)
            .setContentTitle(title)
            .setContentText(body)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setFullScreenIntent(fullScreenPendingIntent, true)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setAutoCancel(true)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setSound(ringtoneUri)
            .setVibrate(new long[]{0, 500, 250, 500, 250, 500});
            
        // Allow Action Button
        Intent allowIntent = new Intent(context, MainActivity.class);
        allowIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        allowIntent.putExtra("pending_visitor", guestId);
        allowIntent.putExtra("notification_action", "approve");
        PendingIntent allowPendingIntent = PendingIntent.getActivity(
            context,
            (int) System.currentTimeMillis() + 2,
            allowIntent,
            flags
        );
        builder.addAction(android.R.drawable.ic_menu_add, "Allow", allowPendingIntent);
        
        // Deny Action Button
        Intent denyIntent = new Intent(context, MainActivity.class);
        denyIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        denyIntent.putExtra("pending_visitor", guestId);
        denyIntent.putExtra("notification_action", "deny");
        PendingIntent denyPendingIntent = PendingIntent.getActivity(
            context,
            (int) System.currentTimeMillis() + 3,
            denyIntent,
            flags
        );
        builder.addAction(android.R.drawable.ic_menu_close, "Deny", denyPendingIntent);
        
        NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (notificationManager != null) {
            notificationManager.notify(VISITOR_NOTIFICATION_ID, builder.build());
        }
    }
}
