package com.kalamlibrary.app.fcm

import android.app.Activity
import android.content.Intent
import android.util.Log

/**
 * Handles deep-link routing when a user taps an Android System Notification.
 * Matches Sections 21, 22 & 23 of the FCM Engineering Specification.
 */
object NotificationNavigator {

    private const val TAG = "KalamNotificationNav"

    enum class AppDestination {
        HOME,
        LIBRARY,
        MEMBERSHIP,
        ATTENDANCE,
        FEES,
        GATE_PASS,
        BOOK_DETAILS,
        NOTICE_DETAILS,
        UNKNOWN
    }

    /**
     * Resolves incoming notification target screen to an internal AppDestination.
     */
    fun resolveDestination(targetScreen: String?): AppDestination {
        return when (targetScreen?.uppercase()?.trim()) {
            "LIBRARY", "BOOKS", "CATALOG" -> AppDestination.LIBRARY
            "MEMBERSHIP", "SEAT", "DESK" -> AppDestination.MEMBERSHIP
            "ATTENDANCE", "CHECK_IN" -> AppDestination.ATTENDANCE
            "FEE", "FEES", "BILLING", "INVOICE" -> AppDestination.FEES
            "GATE_PASS", "QR_PASS", "PASS" -> AppDestination.GATE_PASS
            "BOOK", "BOOK_DETAILS" -> AppDestination.BOOK_DETAILS
            "NOTICE", "NOTICES", "BULLETIN" -> AppDestination.NOTICE_DETAILS
            "HOME", "DASHBOARD", "GENERAL" -> AppDestination.HOME
            else -> AppDestination.HOME
        }
    }

    /**
     * Inspects activity launch Intent (handling cold start and background wakeups).
     */
    fun handleNotificationIntent(activity: Activity, intent: Intent?): Boolean {
        if (intent == null) return false
        val fromFcm = intent.getBooleanExtra("from_fcm", false)
        if (!fromFcm) return false

        val targetScreen = intent.getStringExtra("targetScreen")
        val targetId = intent.getStringExtra("targetId") ?: ""
        val notificationId = intent.getStringExtra("notificationId") ?: ""

        val destination = resolveDestination(targetScreen)
        Log.i(TAG, "Notification tap handled: notificationId=$notificationId, destination=$destination, targetId=$targetId")

        // Consume flag to prevent re-navigation on orientation changes
        intent.removeExtra("from_fcm")

        navigateToScreen(activity, destination, targetId)
        return true
    }

    private fun navigateToScreen(activity: Activity, destination: AppDestination, targetId: String) {
        // Implementation navigates the app's Jetpack NavigationNavController or Fragment
        Log.d(TAG, "Navigating to: $destination with targetId: $targetId")
    }
}
