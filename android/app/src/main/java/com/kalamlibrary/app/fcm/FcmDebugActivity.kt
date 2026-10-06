package com.kalamlibrary.app.fcm

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.google.firebase.FirebaseApp
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.messaging.FirebaseMessaging

/**
 * Developer Diagnostics & FCM Token Debug Screen.
 * Complies with Section 27 of the FCM Engineering Specification.
 */
class FcmDebugActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Only allowed in debug environments
        // In release builds, finish immediately
        // if (!BuildConfig.DEBUG) { finish(); return; }

        val layout = android.widget.LinearLayout(this).apply {
            orientation = android.widget.LinearLayout.VERTICAL
            setPadding(48, 48, 48, 48)
            setBackgroundColor(0xFF0F172A.toInt()) // Slate 900
        }

        val tvInfo = TextView(this).apply {
            setTextColor(0xFFE2E8F0.toInt())
            textSize = 14f
            setLineSpacing(12f, 1f)
        }

        val btnCopyToken = Button(this).apply {
            text = "Copy FCM Token to Clipboard"
            setBackgroundColor(0xFFF59E0B.toInt())
            setTextColor(0xFF0F172A.toInt())
        }

        val btnRefreshToken = Button(this).apply {
            text = "Force Re-Register Device Token"
        }

        layout.addView(tvInfo)
        layout.addView(btnCopyToken)
        layout.addView(btnRefreshToken)
        setContentView(layout)

        val projectId = FirebaseApp.getInstance().options.projectId
        val currentUid = FirebaseAuth.getInstance().currentUser?.uid ?: "Not Authenticated"
        val deviceId = DeviceTokenManager.getOrCreateDeviceId(this)
        val permGranted = PermissionHelper.isNotificationPermissionGranted(this)

        var currentToken = "Fetching..."

        FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
            if (task.isSuccessful) {
                currentToken = task.result
                tvInfo.text = """
                    === KALAM LIBRARY FCM DIAGNOSTICS ===
                    
                    Firebase Project ID: $projectId
                    Current User UID: $currentUid
                    Stable Device ID: $deviceId
                    Notification Permission Granted: $permGranted
                    
                    Configured Channels:
                    - GENERAL
                    - IMPORTANT
                    - LIBRARY
                    - MEMBERSHIP
                    - ATTENDANCE
                    - FEE
                    - SYSTEM
                    
                    Active FCM Token:
                    $currentToken
                """.trimIndent()
            } else {
                tvInfo.text = "Failed to fetch FCM Token: ${task.exception?.message}"
            }
        }

        btnCopyToken.setOnClickListener {
            val clipboard = getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
            val clip = ClipData.newPlainText("FCM Token", currentToken)
            clipboard.setPrimaryClip(clip)
            Toast.makeText(this, "FCM Token copied! Paste into Admin Panel to test single device.", Toast.LENGTH_LONG).show()
        }

        btnRefreshToken.setOnClickListener {
            DeviceTokenManager.registerToken(this)
            Toast.makeText(this, "Re-registration triggered to Firestore & Backend.", Toast.LENGTH_SHORT).show()
        }
    }
}
