import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, isQuotaExceeded, handleQuotaExceeded } from './firebase';
import { AdminUser, AdminRole } from '../types/models';
import { logAdminActivity } from './auditService';
import { getAdminAccounts, saveAdminAccounts, StoredAdminAccount } from './adminStore';

const COLLECTION_NAME = 'admins';

export function subscribeToAdminUsers(callback: (admins: AdminUser[]) => void, onError?: (err: any) => void) {
  // 1. Immediately emit locally available accounts so the table is never blank
  const localAccounts = getAdminAccounts();
  callback(localAccounts);

  if (isQuotaExceeded()) {
    return () => {};
  }

  let unsub: (() => void) | undefined;
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    unsub = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const list = snapshot.docs.map(d => d.data() as AdminUser);
        // Merge with local accounts
        const map = new Map<string, AdminUser>();
        localAccounts.forEach(a => map.set(a.uid || a.email, a));
        list.forEach(a => map.set(a.uid || a.email, a));
        callback(Array.from(map.values()));
      }
    }, (err) => {
      const isQuota = (err as any)?.code === 'resource-exhausted' ||
        String(err?.message || '').toLowerCase().includes('quota') ||
        String(err?.message || '').toLowerCase().includes('resource-exhausted');
      
      if (unsub) {
        try { unsub(); } catch {}
        unsub = undefined;
      }

      if (isQuota) {
        handleQuotaExceeded(err?.message).catch(() => {});
      } else {
        if (onError) onError(err);
        handleFirestoreError(err, OperationType.LIST, COLLECTION_NAME);
      }
    });
  } catch {
    // Graceful fallback
  }

  return () => {
    if (unsub) {
      try { unsub(); } catch {}
    }
  };
}

export async function bootstrapInitialAdmin(user: { uid: string; email: string; displayName?: string | null }): Promise<AdminUser> {
  const localAccounts = getAdminAccounts();
  const userEmail = (user.email || '').toLowerCase();
  const existingLocal = localAccounts.find(a => (a.email || '').toLowerCase() === userEmail);
  if (existingLocal) return existingLocal;

  const isOwner = userEmail === 'devanshdiwan97@gmail.com';
  const newAdmin: StoredAdminAccount = {
    uid: user.uid,
    name: user.displayName || user.email?.split('@')[0] || 'Administrator',
    email: user.email || `${user.uid}@kalamlibrary.internal`,
    role: (localAccounts.length === 0 || isOwner) ? 'SUPER_ADMIN' : 'STAFF',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString()
  };

  localAccounts.push(newAdmin);
  saveAdminAccounts(localAccounts);

  if (!isQuotaExceeded()) {
    try {
      const docRef = doc(db, COLLECTION_NAME, user.uid);
      await setDoc(docRef, newAdmin).catch((err: any) => {
        if (err?.code === 'resource-exhausted' || String(err?.message || '').toLowerCase().includes('quota')) {
          handleQuotaExceeded(err?.message).catch(() => {});
        }
      });
    } catch {}
  }

  return newAdmin;
}

export async function createAdminUser(
  data: { uid?: string; name: string; email: string; role: AdminRole },
  currentAdmin: { uid: string; name: string; role: string }
): Promise<AdminUser> {
  const targetUid = data.uid || `adm_${Date.now()}`;
  const newAdmin: StoredAdminAccount = {
    uid: targetUid,
    name: data.name,
    email: (data.email || '').toLowerCase(),
    role: data.role,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    lastLogin: ''
  };

  // Always persist locally
  const accounts = getAdminAccounts();
  if (accounts.some(a => (a.email || '').toLowerCase() === (newAdmin.email || '').toLowerCase())) {
    throw new Error(`An administrator with email "${data.email}" already exists.`);
  }
  accounts.push(newAdmin);
  saveAdminAccounts(accounts);

  if (!isQuotaExceeded()) {
    try {
      await setDoc(doc(db, COLLECTION_NAME, targetUid), newAdmin).catch((err: any) => {
        if (err?.code === 'resource-exhausted' || String(err?.message || '').toLowerCase().includes('quota')) {
          handleQuotaExceeded(err?.message).catch(() => {});
        }
      });
    } catch {}
  }

  await logAdminActivity({
    adminUid: currentAdmin.uid,
    adminName: currentAdmin.name,
    adminRole: currentAdmin.role,
    action: 'Admin User Created',
    targetType: 'ADMIN_USER',
    targetId: targetUid,
    details: `Created admin user ${data.name} with role ${data.role}`
  }).catch(() => {});

  return newAdmin;
}

export async function updateAdminRole(
  adminUid: string,
  newRole: AdminRole,
  currentAdmin: { uid: string; name: string; role: string }
): Promise<void> {
  const accounts = getAdminAccounts();
  const index = accounts.findIndex(a => a.uid === adminUid);
  if (index >= 0) {
    accounts[index].role = newRole;
    saveAdminAccounts(accounts);
  }

  if (!isQuotaExceeded()) {
    try {
      const docRef = doc(db, COLLECTION_NAME, adminUid);
      await updateDoc(docRef, { role: newRole }).catch((err: any) => {
        if (err?.code === 'resource-exhausted' || String(err?.message || '').toLowerCase().includes('quota')) {
          handleQuotaExceeded(err?.message).catch(() => {});
        }
      });
    } catch {}
  }

  await logAdminActivity({
    adminUid: currentAdmin.uid,
    adminName: currentAdmin.name,
    adminRole: currentAdmin.role,
    action: 'Admin Role Updated',
    targetType: 'ADMIN_USER',
    targetId: adminUid,
    details: `Changed role to ${newRole}`
  }).catch(() => {});
}

export async function toggleAdminStatus(
  adminUid: string,
  newStatus: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
  currentAdmin: { uid: string; name: string; role: string }
): Promise<void> {
  const accounts = getAdminAccounts();
  const index = accounts.findIndex(a => a.uid === adminUid);
  if (index >= 0) {
    accounts[index].status = newStatus;
    saveAdminAccounts(accounts);
  }

  if (!isQuotaExceeded()) {
    try {
      const docRef = doc(db, COLLECTION_NAME, adminUid);
      await updateDoc(docRef, { status: newStatus }).catch((err: any) => {
        if (err?.code === 'resource-exhausted' || String(err?.message || '').toLowerCase().includes('quota')) {
          handleQuotaExceeded(err?.message).catch(() => {});
        }
      });
    } catch {}
  }

  await logAdminActivity({
    adminUid: currentAdmin.uid,
    adminName: currentAdmin.name,
    adminRole: currentAdmin.role,
    action: 'Admin Status Changed',
    targetType: 'ADMIN_USER',
    targetId: adminUid,
    details: `Changed status to ${newStatus}`
  }).catch(() => {});
}
