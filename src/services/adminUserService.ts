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
import { db, handleFirestoreError, OperationType } from './firebase';
import { AdminUser, AdminRole } from '../types/models';
import { logAdminActivity } from './auditService';

const COLLECTION_NAME = 'admins';

export function subscribeToAdminUsers(callback: (admins: AdminUser[]) => void, onError?: (err: any) => void) {
  const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(d => d.data() as AdminUser);
    callback(list);
  }, (err) => {
    if (onError) onError(err);
    handleFirestoreError(err, OperationType.LIST, COLLECTION_NAME);
  });
}

export async function bootstrapInitialAdmin(user: { uid: string; email: string; displayName?: string | null }): Promise<AdminUser> {
  const docRef = doc(db, COLLECTION_NAME, user.uid);
  const snap = await getDoc(docRef);

  if (snap.exists()) {
    const existing = snap.data() as AdminUser;
    // update lastLogin
    await updateDoc(docRef, { lastLogin: new Date().toISOString() }).catch(() => {});
    return existing;
  }

  // Check if any admin exists in collection
  const allAdmins = await getDocs(collection(db, COLLECTION_NAME));
  const isFirst = allAdmins.empty;
  const isOwner = user.email.toLowerCase() === 'devanshdiwan97@gmail.com';

  const newAdmin: AdminUser = {
    uid: user.uid,
    name: user.displayName || user.email.split('@')[0] || 'Administrator',
    email: user.email,
    role: (isFirst || isOwner) ? 'SUPER_ADMIN' : 'STAFF',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString()
  };

  await setDoc(docRef, newAdmin);
  return newAdmin;
}

export async function createAdminUser(
  data: { uid?: string; name: string; email: string; role: AdminRole },
  currentAdmin: { uid: string; name: string; role: string }
): Promise<AdminUser> {
  try {
    const targetUid = data.uid || `adm_${Date.now()}`;
    const newAdmin: AdminUser = {
      uid: targetUid,
      name: data.name,
      email: data.email.toLowerCase(),
      role: data.role,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      lastLogin: ''
    };

    await setDoc(doc(db, COLLECTION_NAME, targetUid), newAdmin);

    await logAdminActivity({
      adminUid: currentAdmin.uid,
      adminName: currentAdmin.name,
      adminRole: currentAdmin.role,
      action: 'Admin User Created',
      targetType: 'ADMIN_USER',
      targetId: targetUid,
      details: `Created admin user ${data.name} with role ${data.role}`
    });

    return newAdmin;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, COLLECTION_NAME);
    throw err;
  }
}

export async function updateAdminRole(
  adminUid: string,
  newRole: AdminRole,
  currentAdmin: { uid: string; name: string; role: string }
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, adminUid);
    await updateDoc(docRef, { role: newRole });

    await logAdminActivity({
      adminUid: currentAdmin.uid,
      adminName: currentAdmin.name,
      adminRole: currentAdmin.role,
      action: 'Admin Role Updated',
      targetType: 'ADMIN_USER',
      targetId: adminUid,
      details: `Changed role to ${newRole}`
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${COLLECTION_NAME}/${adminUid}`);
  }
}

export async function toggleAdminStatus(
  adminUid: string,
  newStatus: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
  currentAdmin: { uid: string; name: string; role: string }
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, adminUid);
    await updateDoc(docRef, { status: newStatus });

    await logAdminActivity({
      adminUid: currentAdmin.uid,
      adminName: currentAdmin.name,
      adminRole: currentAdmin.role,
      action: 'Admin Status Changed',
      targetType: 'ADMIN_USER',
      targetId: adminUid,
      details: `Changed status to ${newStatus}`
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${COLLECTION_NAME}/${adminUid}`);
  }
}
