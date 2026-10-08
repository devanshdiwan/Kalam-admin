import { NotificationItem, NoticeTarget } from '../types/models';
import { logAdminActivity } from './auditService';
import { repoNotifications } from './dataRepository';

export function subscribeToNotifications(callback: (notifications: NotificationItem[]) => void, onError?: (err: any) => void) {
  // Load and sync any notifications saved on server in a single batch
  fetch('/api/admin/notifications')
    .then(r => r.json())
    .then(data => {
      if (data.notifications && Array.isArray(data.notifications) && data.notifications.length > 0) {
        const current = repoNotifications.getAll();
        const map = new Map<string, NotificationItem>();
        current.forEach(item => {
          if (item?.notificationId) map.set(item.notificationId, item);
        });
        data.notifications.forEach((item: NotificationItem) => {
          if (item?.notificationId) map.set(item.notificationId, item);
        });
        repoNotifications.replaceItems(Array.from(map.values()));
      }
    })
    .catch(() => {});

  return repoNotifications.subscribe(callback);
}

export async function sendPushNotification(
  payload: {
    title: string;
    message: string;
    targetType: NoticeTarget;
    targetId?: string;
    targetScreen?: string;
    channelId?: string;
    category?: string;
    imageUrl?: string;
  },
  currentAdmin: { uid: string; name: string; role: string }
): Promise<NotificationItem> {
  const notificationId = `notif_${Date.now()}`;
  const nowIso = new Date().toISOString();

  // Call secure server-side FCM dispatcher with timeout to prevent stuck transmitting UI
  let dispatchedCount = 1;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  let resp: Response;
  try {
    resp = await fetch('/api/admin/send-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        sentBy: currentAdmin.name
      }),
      signal: controller.signal
    });
  } catch (netErr: any) {
    clearTimeout(timeoutId);
    if (netErr.name === 'AbortError') {
      throw new Error('FCM push transmission timed out after 15 seconds. Please check device connectivity.');
    }
    throw new Error(`Push notification network error: ${netErr.message || 'Server unreachable'}`);
  }
  clearTimeout(timeoutId);

  let data: any = {};
  if (resp.ok) {
    data = await resp.json().catch(() => ({}));
    if (data.dispatchedCount) dispatchedCount = data.dispatchedCount;
  } else {
    const errData = await resp.json().catch(() => ({}));
    throw new Error(errData.error || `Push transmission failed (HTTP ${resp.status}).`);
  }

  const item: NotificationItem = {
    notificationId,
    title: payload.title,
    message: payload.message,
    targetType: payload.targetType,
    targetId: payload.targetId || '',
    targetScreen: payload.targetScreen || 'Home',
    category: payload.category || (payload.channelId || 'General'),
    imageUrl: payload.imageUrl || '',
    status: 'SENT',
    recipientCount: dispatchedCount,
    createdAt: nowIso,
    sentBy: currentAdmin.name
  };

  await repoNotifications.set(item);

  await logAdminActivity({
    adminUid: currentAdmin.uid,
    adminName: currentAdmin.name,
    adminRole: currentAdmin.role,
    action: 'Notification Sent',
    targetType: 'NOTIFICATION',
    targetId: notificationId,
    details: `Dispatched push notification "${payload.title}" to channel [${payload.channelId || 'GENERAL'}]`
  });

  return item;
}

export async function testPushSingleDevice(
  payload: {
    fcmToken: string;
    title?: string;
    message?: string;
    channelId?: string;
    targetScreen?: string;
  }
): Promise<any> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const resp = await fetch('/api/admin/test-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok && !data.error) {
      data.error = `HTTP ${resp.status}: Could not dispatch test push`;
    }
    return data;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      return { success: false, error: 'Test push request timed out after 12 seconds.' };
    }
    return { success: false, error: err.message || 'Network error reaching test push API' };
  }
}
