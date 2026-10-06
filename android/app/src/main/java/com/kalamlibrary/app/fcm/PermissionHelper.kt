package com.kalamlibrary.app.fcm

import android.Manifest
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.appcompat.app.AlertDialog
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

/**
 * Handles Android 13+ (API 33+) POST_NOTIFICATIONS runtime permission.
 * Complies with Sections 4 & 5 of the FCM Engineering Specification.
 */
object PermissionHelper {

    const val NOTIFICATION_PERMISSION_REQUEST_CODE = 1001

    fun isNotificationPermissionGranted(context: Context): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
        } else {
            true // Automatically granted on Android 12 and below
        }
    }

    /**
     * Requests notification permission at appropriate lifecycle moment.
     */
    fun requestNotificationPermission(activity: Activity) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) return

        if (isNotificationPermissionGranted(activity)) {
            // Already granted, ensure token is registered
            DeviceTokenManager.registerToken(activity)
            return
        }

        if (ActivityCompat.shouldShowRequestPermissionRationale(activity, Manifest.permission.POST_NOTIFICATIONS)) {
            // Show educational rationale dialog explaining why notifications are critical
            AlertDialog.Builder(activity)
                .setTitle("Enable Library Notifications")
                .setMessage("Kalam Library needs notification permission to alert you about study hall desk assignments, book return deadlines, and emergency notices.")
                .setPositiveButton("Allow") { _, _ ->
                    ActivityCompat.requestPermissions(
                        activity,
                        arrayOf(Manifest.permission.POST_NOTIFICATIONS),
                        NOTIFICATION_PERMISSION_REQUEST_CODE
                    )
                }
                .setNegativeButton("Not Now", null)
                .show()
        } else {
            ActivityCompat.requestPermissions(
                activity,
                arrayOf(Manifest.permission.POST_NOTIFICATIONS),
                NOTIFICATION_PERMISSION_REQUEST_CODE
            )
        }
    }

    /**
     * Opens system app notification settings if student permanently disabled alerts.
     */
    fun openAppNotificationSettings(context: Context) {
        val intent = Intent().apply {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                action = Settings.ACTION_APP_NOTIFICATION_SETTINGS
                putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)
            } else {
                action = Settings.ACTION_APPLICATION_DETAILS_SETTINGS
                data = Uri.fromParts("package", context.packageName, null)
            }
        }
        context.startActivity(intent)
    }
}
