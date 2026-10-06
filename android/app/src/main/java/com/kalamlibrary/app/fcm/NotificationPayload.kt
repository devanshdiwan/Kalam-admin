package com.kalamlibrary.app.fcm

import com.google.firebase.messaging.RemoteMessage
import org.json.JSONObject

/**
 * Standardized Notification Data Contract between Admin Panel, Backend, and Android App.
 * Matches Sections 16 & 17 of FCM Requirements.
 */
data class NotificationPayload(
    val notificationId: String,
    val type: String,
    val title: String,
    val body: String,
    val targetScreen: String,
    val targetId: String = "",
    val channelId: String = NotificationChannelManager.CHANNEL_GENERAL,
    val imageUrl: String = "",
    val deepLink: String = "",
    val createdAt: String = ""
) {
    companion object {
        private const val DEFAULT_TITLE = "Kalam Library"
        private const val DEFAULT_BODY = "You have a new update from Kalam Library Gursarai."

        /**
         * Safely parses an incoming RemoteMessage into our standardized NotificationPayload contract.
         * Handles both data-only payloads and notification+data payloads safely with fallbacks.
         */
        fun fromRemoteMessage(message: RemoteMessage): NotificationPayload {
            val data = message.data

            // Safe fallback title & body as required by Section 20
            val resolvedTitle = data["title"]
                ?: message.notification?.title
                ?: DEFAULT_TITLE

            val resolvedBody = data["body"]
                ?: message.notification?.body
                ?: DEFAULT_BODY

            val resolvedNotificationId = data["notificationId"]
                ?: message.messageId
                ?: "notif_${System.currentTimeMillis()}"

            val resolvedType = data["type"] ?: "GENERAL"

            val resolvedChannelId = data["channelId"]
                ?: message.notification?.channelId
                ?: NotificationChannelManager.mapTypeToChannelId(resolvedType)

            val resolvedTargetScreen = data["targetScreen"]
                ?: "Home"

            val resolvedTargetId = data["targetId"] ?: ""

            val resolvedImageUrl = data["imageUrl"]
                ?: message.notification?.imageUrl?.toString()
                ?: ""

            val resolvedDeepLink = data["deepLink"] ?: ""

            return NotificationPayload(
                notificationId = resolvedNotificationId,
                type = resolvedType,
                title = resolvedTitle.ifBlank { DEFAULT_TITLE },
                body = resolvedBody.ifBlank { DEFAULT_BODY },
                targetScreen = resolvedTargetScreen,
                targetId = resolvedTargetId,
                channelId = resolvedChannelId,
                imageUrl = resolvedImageUrl,
                deepLink = resolvedDeepLink,
                createdAt = data["createdAt"] ?: System.currentTimeMillis().toString()
            )
        }
    }
}
