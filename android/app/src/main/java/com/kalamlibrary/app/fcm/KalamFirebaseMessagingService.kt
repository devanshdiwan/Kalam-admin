package com.kalamlibrary.app.fcm

import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.media.RingtoneManager
import android.util.Log
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.kalamlibrary.app.MainActivity
import com.kalamlibrary.app.R
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.ConcurrentHashMap

/**
 * Production-ready Firebase Messaging Service for Kalam Library Android App.
 * Handles Sections 13, 14, 15, 18, 19, 20, 32 & 33.
 */
class KalamFirebaseMessagingService : FirebaseMessagingService() {

    companion object {
        private const val TAG = "KalamFCMService"

        // Cache recently displayed notification IDs to prevent duplicates (Section 18 & 32)
        private val recentNotificationIds = ConcurrentHashMap<String, Long>()
        private const val DEDUPLICATION_WINDOW_MS = 60_000L // 1 minute
    }

    /**
     * Triggered whenever FCM generates or rotates an authentication registration token.
     * Complies with Section 9: Token Refresh.
     */
    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.d(TAG, "onNewToken received from FCM: $token")
        DeviceTokenManager.registerToken(applicationContext, token)
    }

    /**
     * Triggered when a message is received in FOREGROUND or BACKGROUND data payload.
     * Complies with Section 14 (Foreground system notifications) and Section 15 (Background handling).
     */
    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)
        Log.d(TAG, "onMessageReceived from: ${remoteMessage.from}, data: ${remoteMessage.data}")

        // 1. Ensure notification channels are initialized
        NotificationChannelManager.createNotificationChannels(applicationContext)

        // 2. Parse standardized contract
        val payload = NotificationPayload.fromRemoteMessage(remoteMessage)

        // 3. De-duplication check (Section 18 & 32)
        val now = System.currentTimeMillis()
        cleanOldNotificationIds(now)
        if (recentNotificationIds.containsKey(payload.notificationId)) {
            Log.w(TAG, "Duplicate notification received: ${payload.notificationId}, suppressing duplicate tray item.")
            return
        }
        recentNotificationIds[payload.notificationId] = now

        // 4. Build and display System Notification
        CoroutineScope(Dispatchers.Default).launch {
            displaySystemNotification(payload)
        }
    }

    private suspend fun displaySystemNotification(payload: NotificationPayload) {
        val context = applicationContext
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        // Create Deep-Link Target Intent (Section 21, 22, 23)
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("notificationId", payload.notificationId)
            putExtra("targetScreen", payload.targetScreen)
            putExtra("targetId", payload.targetId)
            putExtra("type", payload.type)
            putExtra("deepLink", payload.deepLink)
            putExtra("from_fcm", true)
        }

        val requestCode = payload.notificationId.hashCode()
        val pendingIntent = PendingIntent.getActivity(
            context,
            requestCode,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)

        // Download image if present (Section 33: BigPictureStyle with timeout protection)
        val bigBitmap: Bitmap? = if (payload.imageUrl.isNotBlank()) {
            downloadImageSafely(payload.imageUrl)
        } else null

        val notificationBuilder = NotificationCompat.Builder(context, payload.channelId)
            // Valid monochrome white icon (Section 19)
            .setSmallIcon(R.drawable.ic_notification)
            .setColor(0xFFF59E0B.toInt()) // Amber brand color
            .setContentTitle(payload.title)
            .setContentText(payload.body)
            .setAutoCancel(true)
            .setSound(soundUri)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)

        // Attach BigPictureStyle or BigTextStyle
        if (bigBitmap != null) {
            notificationBuilder.setStyle(
                NotificationCompat.BigPictureStyle()
                    .bigPicture(bigBitmap)
                    .setSummaryText(payload.body)
            )
        } else {
            notificationBuilder.setStyle(
                NotificationCompat.BigTextStyle().bigText(payload.body)
            )
        }

        // Post to Android System Notification Tray
        val systemNotificationId = payload.notificationId.hashCode()
        notificationManager.notify(systemNotificationId, notificationBuilder.build())
        Log.i(TAG, "Android system notification posted to channel [${payload.channelId}] with ID: $systemNotificationId")
    }

    private suspend fun downloadImageSafely(imageUrl: String): Bitmap? = withContext(Dispatchers.IO) {
        try {
            val url = URL(imageUrl)
            val connection = url.openConnection() as HttpURLConnection
            connection.doInput = true
            connection.connectTimeout = 4000
            connection.readTimeout = 4000
            connection.connect()
            BitmapFactory.decodeStream(connection.inputStream)
        } catch (e: Exception) {
            Log.w(TAG, "Image download failed for notification, falling back to standard text layout: ${e.message}")
            null
        }
    }

    private fun cleanOldNotificationIds(currentTime: Long) {
        val iterator = recentNotificationIds.entries.iterator()
        while (iterator.hasNext()) {
            val entry = iterator.next()
            if (currentTime - entry.value > DEDUPLICATION_WINDOW_MS) {
                iterator.remove()
            }
        }
    }
}
