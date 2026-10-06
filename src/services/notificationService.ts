import { NotificationItem, NoticeTarget } from '../types/models';
import { logAdminActivity } from './auditService';
import { repoNotifications } from './dataRepository';

export function subscribeToNotifications(callback: (notifications: NotificationItem[]) => void, onError?: (err: any) => void) {
  // Load and sync any notifications saved on server
  fetch('/api/admin/notifications')
    .then(r => r.json())
    .then(data => {
      if (data.notifications && Array.isArray(data.notifications)) {
        data.notifications.forEach((item: NotificationItem) => {
          repoNotifications.set(item);
        });
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

  // Call secure server-side FCM dispatcher
  let dispatchedCount = 1;
  const resp = await fetch('/api/admin/send-notification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...payload,
      sentBy: currentAdmin.name
    })
  });

  if (!resp.ok) {
    const errData = await resp.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to dispatch push notification.');
  }

  const data = await resp.json();
  if (data.dispatchedCount) dispatchedCount = data.dispatchedCount;

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
  const resp = await fetch('/api/admin/test-push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return await resp.json();
}
