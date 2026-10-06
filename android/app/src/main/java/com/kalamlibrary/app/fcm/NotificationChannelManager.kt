package com.kalamlibrary.app.fcm

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.os.Build

/**
 * Centralized Notification Channel Manager for Kalam Library Android App.
 * Matches Sections 6 & 7 of the FCM Engineering Specification.
 */
object NotificationChannelManager {

    // Centralized Exact Channel IDs (Must match Admin Panel & Backend)
    const val CHANNEL_GENERAL = "GENERAL"
    const val CHANNEL_IMPORTANT = "IMPORTANT"
    const val CHANNEL_LIBRARY = "LIBRARY"
    const val CHANNEL_MEMBERSHIP = "MEMBERSHIP"
    const val CHANNEL_ATTENDANCE = "ATTENDANCE"
    const val CHANNEL_FEE = "FEE"
    const val CHANNEL_SYSTEM = "SYSTEM"

    /**
     * Creates all required Android Notification Channels on app launch (Android 8.0+).
     * Must be called in Application.onCreate() or before displaying notifications.
     */
    fun createNotificationChannels(context: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return

        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
            ?: return

        val defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
        val audioAttributes = AudioAttributes.Builder()
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .setUsage(AudioAttributes.USAGE_NOTIFICATION)
            .build()

        val channels = listOf(
            // 1. GENERAL (Announcements, daily library timings, holiday updates)
            NotificationChannel(
                CHANNEL_GENERAL,
                "General Notices & Timings",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "General library updates, daily schedule notices, and holiday announcements."
                enableLights(true)
                lightColor = 0xFFF59E0B.toInt() // Amber
                enableVibration(true)
            },

            // 2. IMPORTANT (Urgent alerts, seat allocation changes, security)
            NotificationChannel(
                CHANNEL_IMPORTANT,
                "Urgent & Important Alerts",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "High-priority notices requiring immediate student attention."
                enableLights(true)
                lightColor = 0xFFEF4444.toInt() // Red
                enableVibration(true)
                setSound(defaultSoundUri, audioAttributes)
            },

            // 3. LIBRARY (Book issues, return reminders, new book arrivals)
            NotificationChannel(
                CHANNEL_LIBRARY,
                "Library & Books",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Issued book due dates, return confirmations, and new catalog arrivals."
                enableLights(true)
                enableVibration(true)
            },

            // 4. MEMBERSHIP (Renewal reminders, seat assignment confirmations)
            NotificationChannel(
                CHANNEL_MEMBERSHIP,
                "Membership & Desks",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Library membership expiry warnings, renewals, and study hall seat changes."
                enableLights(true)
                enableVibration(true)
            },

            // 5. ATTENDANCE (Daily check-in / check-out and coaching attendance)
            NotificationChannel(
                CHANNEL_ATTENDANCE,
                "Attendance & Gate Check",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Entry gate pass logs, study hall attendance, and check-in verifications."
                enableLights(true)
                enableVibration(false)
            },

            // 6. FEE (Monthly tuition, seat invoice receipts, due reminders)
            NotificationChannel(
                CHANNEL_FEE,
                "Fees & Billing Receipts",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Fee payment receipts, monthly desk dues, and billing notifications."
                enableLights(true)
                enableVibration(true)
            },

            // 7. SYSTEM (Account security, password updates, device logins)
            NotificationChannel(
                CHANNEL_SYSTEM,
                "System & Security",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Login alerts, password changes, and account security notifications."
                enableLights(true)
                enableVibration(true)
            }
        )

        notificationManager.createNotificationChannels(channels)
    }

    /**
     * Resolves incoming category or type string to a valid channel ID.
     */
    fun mapTypeToChannelId(type: String?): String {
        return when (type?.uppercase()) {
            "IMPORTANT", "URGENT", "EMERGENCY" -> CHANNEL_IMPORTANT
            "LIBRARY", "BOOK", "BOOK_ISSUE", "BOOK_RETURN" -> CHANNEL_LIBRARY
            "MEMBERSHIP", "SEAT", "DESK" -> CHANNEL_MEMBERSHIP
            "ATTENDANCE", "GATE_PASS" -> CHANNEL_ATTENDANCE
            "FEE", "BILLING", "PAYMENT" -> CHANNEL_FEE
            "SYSTEM", "SECURITY", "ACCOUNT" -> CHANNEL_SYSTEM
            else -> CHANNEL_GENERAL
        }
    }
}
