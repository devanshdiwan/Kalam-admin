package com.kalamlibrary.app.fcm

import android.content.Context
import android.os.Bundle
import android.widget.Button
import android.widget.CheckBox
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity

/**
 * In-App Notification Preferences Screen.
 * Complies with Section 36 of the FCM Engineering Specification.
 */
class NotificationSettingsActivity : AppCompatActivity() {

    private val prefsKey = "kalam_notification_category_prefs"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val prefs = getSharedPreferences(prefsKey, Context.MODE_PRIVATE)

        val layout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(48, 48, 48, 48)
            setBackgroundColor(0xFF0F172A.toInt()) // Slate 900
        }

        val title = TextView(this).apply {
            text = "Notification Category Preferences"
            setTextColor(0xFFFFFFFF.toInt())
            textSize = 18f
            setPadding(0, 0, 0, 32)
        }
        layout.addView(title)

        val categories = listOf(
            "General Announcements & Timings" to "pref_general",
            "Urgent & Important Alerts" to "pref_important",
            "Library & Book Issue Notices" to "pref_library",
            "Membership & Seat Allocation" to "pref_membership",
            "Daily Attendance & Gate Pass" to "pref_attendance",
            "Fee Receipts & Billing" to "pref_fees"
        )

        categories.forEach { (label, key) ->
            val cb = CheckBox(this).apply {
                text = label
                setTextColor(0xFFCBD5E1.toInt())
                isChecked = prefs.getBoolean(key, true)
                setOnCheckedChangeListener { _, isChecked ->
                    prefs.edit().putBoolean(key, isChecked).apply()
                }
                setPadding(16, 24, 16, 24)
            }
            layout.addView(cb)
        }

        val btnSystemSettings = Button(this).apply {
            text = "Open Android System Notification Settings"
            setBackgroundColor(0xFF334155.toInt())
            setTextColor(0xFFF8FAFC.toInt())
            setOnClickListener {
                PermissionHelper.openAppNotificationSettings(this@NotificationSettingsActivity)
            }
        }
        layout.addView(btnSystemSettings)

        setContentView(layout)
    }
}
