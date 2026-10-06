import { NoticeItem, NoticeCategory, NoticeTarget } from '../types/models';
import { logAdminActivity } from './auditService';
import { repoNotices } from './dataRepository';

export function subscribeToNotices(callback: (notices: NoticeItem[]) => void, onError?: (err: any) => void) {
  // Load and sync any notices saved on server
  fetch('/api/admin/notices')
    .then(r => r.json())
    .then(data => {
      if (data.notices && Array.isArray(data.notices)) {
        data.notices.forEach((n: NoticeItem) => {
          repoNotices.set(n);
        });
      }
    })
    .catch(() => {});

  return repoNotices.subscribe(callback);
}

export async function createNotice(
  data: {
    title: string;
    body: string;
    category: NoticeCategory;
    targetType: NoticeTarget;
    targetId?: string;
    imageUrl?: string;
    expiresAt?: string;
    sendPush?: boolean;
  },
  currentAdmin: { uid: string; name: string; role: string }
): Promise<NoticeItem> {
  const noticeId = `notc_${Date.now()}`;
  const nowIso = new Date().toISOString();

  const notice: NoticeItem = {
    noticeId,
    title: data.title,
    body: data.body,
    category: data.category,
    targetType: data.targetType,
    targetId: data.targetId || '',
    imageUrl: data.imageUrl || '',
    createdAt: nowIso,
    expiresAt: data.expiresAt || '',
    isActive: true,
    createdBy: currentAdmin.name
  };

  // Save in local reactive repository immediately
  await repoNotices.set(notice);

  // Sync to server API and trigger FCM push dispatcher
  try {
    await fetch('/api/admin/notices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...notice,
        sendPush: data.sendPush !== false
      })
    });
  } catch (err) {
    console.warn('Notice server sync note:', err);
  }

  await logAdminActivity({
    adminUid: currentAdmin.uid,
    adminName: currentAdmin.name,
    adminRole: currentAdmin.role,
    action: 'Notice Published',
    targetType: 'NOTICE',
    targetId: noticeId,
    details: `Published notice: "${notice.title}" [${notice.category}]`
  });

  return notice;
}

export async function deleteNotice(
  noticeId: string,
  currentAdmin: { uid: string; name: string; role: string }
): Promise<void> {
  await repoNotices.remove(noticeId);

  try {
    await fetch(`/api/admin/notices/${encodeURIComponent(noticeId)}`, {
      method: 'DELETE'
    });
  } catch {}

  await logAdminActivity({
    adminUid: currentAdmin.uid,
    adminName: currentAdmin.name,
    adminRole: currentAdmin.role,
    action: 'Notice Deleted',
    targetType: 'NOTICE',
    targetId: noticeId,
    details: `Removed notice ID ${noticeId}`
  });
}
