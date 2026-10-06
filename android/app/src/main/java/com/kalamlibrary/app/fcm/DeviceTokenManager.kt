package com.kalamlibrary.app.fcm

import android.content.Context
import android.content.SharedPreferences
import android.os.Build
import android.util.Log
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.SetOptions
import com.google.firebase.messaging.FirebaseMessaging
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.UUID

/**
 * Robust Device Token Manager for Kalam Library Android App.
 * Matches Sections 8, 9, 10, 11, 12, 28 & 29 of the FCM Specification.
 */
object DeviceTokenManager {

    private const val TAG = "KalamDeviceTokenManager"
    private const val PREFS_NAME = "kalam_fcm_prefs"
    private const val KEY_DEVICE_ID = "kalam_stable_device_id"
    private const val KEY_LAST_TOKEN = "kalam_last_fcm_token"
    private const val KEY_ASSOCIATED_UID = "kalam_associated_uid"

    private fun getPrefs(context: Context): SharedPreferences {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }

    /**
     * Retrieves or generates a stable, privacy-compliant hardware-independent Device ID.
     * Complies with Section 10: Never uses phone number, stable across restarts.
     */
    fun getOrCreateDeviceId(context: Context): String {
        val prefs = getPrefs(context)
        var deviceId = prefs.getString(KEY_DEVICE_ID, null)
        if (deviceId.isNullOrBlank()) {
            deviceId = "and_${UUID.randomUUID().toString().replace("-", "").take(16)}"
            prefs.edit().putString(KEY_DEVICE_ID, deviceId).apply()
        }
        return deviceId
    }

    /**
     * Syncs the current FCM token with Firebase Firestore under:
     * users/{uid}/devices/{deviceId}
     * Also posts to backend REST API fallback.
     */
    fun registerToken(context: Context, fcmToken: String? = null) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val token = fcmToken ?: FirebaseMessaging.getInstance().token.await()
                if (token.isNullOrBlank()) {
                    Log.w(TAG, "FCM token is blank, skipping registration.")
                    return@launch
                }

                val auth = FirebaseAuth.getInstance()
                val currentUser = auth.currentUser
                val uid = currentUser?.uid

                // Cache token locally
                val prefs = getPrefs(context)
                prefs.edit().putString(KEY_LAST_TOKEN, token).apply()

                if (uid.isNullOrBlank()) {
                    Log.i(TAG, "No authenticated user currently logged in. Token cached until student login.")
                    return@launch
                }

                val deviceId = getOrCreateDeviceId(context)
                val isoDate = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).format(Date())

                val packageInfo = try {
                    context.packageManager.getPackageInfo(context.packageName, 0)
                } catch (e: Exception) {
                    null
                }
                val appVersion = packageInfo?.versionName ?: "1.0.0"

                // 1. Structure specified in Section 8: users/{uid}/devices/{deviceId}
                val deviceDoc = hashMapOf(
                    "deviceId" to deviceId,
                    "fcmToken" to token,
                    "platform" to "android",
                    "appVersion" to appVersion,
                    "active" to true,
                    "deviceModel" to "${Build.MANUFACTURER} ${Build.MODEL}",
                    "osVersion" to Build.VERSION.RELEASE,
                    "updatedAt" to isoDate
                )

                val firestore = FirebaseFirestore.getInstance()
                val deviceRef = firestore.collection("users")
                    .document(uid)
                    .collection("devices")
                    .document(deviceId)

                // Check if device document exists to maintain createdAt
                deviceRef.set(deviceDoc, SetOptions.merge()).await()
                prefs.edit().putString(KEY_ASSOCIATED_UID, uid).apply()

                Log.d(TAG, "FCM token successfully associated with user $uid at users/$uid/devices/$deviceId")

                // 2. Also notify Backend REST Gateway for unified multi-channel delivery
                syncWithBackendServer(
                    uid = uid,
                    deviceId = deviceId,
                    fcmToken = token,
                    appVersion = appVersion
                )

            } catch (e: Exception) {
                Log.e(TAG, "Error registering FCM token: ${e.message}", e)
            }
        }
    }

    /**
     * Unregisters the token upon user logout.
     * Complies with Section 11: A previous user's notifications must not be delivered to a new user.
     */
    fun onUserLogout(context: Context) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val prefs = getPrefs(context)
                val lastUid = prefs.getString(KEY_ASSOCIATED_UID, null)
                val deviceId = getOrCreateDeviceId(context)
                val token = prefs.getString(KEY_LAST_TOKEN, null)

                if (!lastUid.isNullOrBlank()) {
                    val firestore = FirebaseFirestore.getInstance()
                    firestore.collection("users")
                        .document(lastUid)
                        .collection("devices")
                        .document(deviceId)
                        .update("active", false)
                        .await()
                }

                // Notify backend server
                if (!token.isNullOrBlank()) {
                    notifyBackendUnregister(deviceId, token)
                }

                prefs.edit().remove(KEY_ASSOCIATED_UID).apply()
                Log.d(TAG, "Device token unlinked from user on logout.")

            } catch (e: Exception) {
                Log.e(TAG, "Error on logout token cleanup: ${e.message}", e)
            }
        }
    }

    private fun syncWithBackendServer(uid: String, deviceId: String, fcmToken: String, appVersion: String) {
        try {
            val url = URL("https://ais-dev-gkkrfw4iwtj2f6sib2g4xv-740676649372.asia-southeast1.run.app/api/student/register-device")
            val conn = url.openConnection() as HttpURLConnection
            conn.requestMethod = "POST"
            conn.setRequestProperty("Content-Type", "application/json")
            conn.doOutput = true
            conn.connectTimeout = 5000
            conn.readTimeout = 5000

            val json = """
                {
                    "uid": "$uid",
                    "deviceId": "$deviceId",
                    "fcmToken": "$fcmToken",
                    "platform": "android",
                    "appVersion": "$appVersion"
                }
            """.trimIndent()

            OutputStreamWriter(conn.outputStream).use { it.write(json) }
            val responseCode = conn.responseCode
            Log.d(TAG, "Backend token sync response code: $responseCode")
        } catch (e: Exception) {
            // Non-fatal fallback
            Log.w(TAG, "Optional backend token sync notice: ${e.message}")
        }
    }

    private fun notifyBackendUnregister(deviceId: String, fcmToken: String) {
        try {
            val url = URL("https://ais-dev-gkkrfw4iwtj2f6sib2g4xv-740676649372.asia-southeast1.run.app/api/student/unregister-device")
            val conn = url.openConnection() as HttpURLConnection
            conn.requestMethod = "POST"
            conn.setRequestProperty("Content-Type", "application/json")
            conn.doOutput = true
            val json = """{"deviceId": "$deviceId", "fcmToken": "$fcmToken"}"""
            OutputStreamWriter(conn.outputStream).use { it.write(json) }
            conn.responseCode
        } catch (e: Exception) {
            // Ignore
        }
    }
}
