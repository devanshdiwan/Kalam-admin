import { AdminUser, AdminRole } from '../types/models';
import { logAdminActivity } from './auditService';
import { db } from './firebase';
import { doc, setDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';

export interface StoredAdminAccount extends AdminUser {
  password?: string;
}

const STORAGE_KEY = 'kalam_admin_accounts_registry';
const SESSION_KEY = 'kalam_active_admin_session';

export const DEFAULT_SUPER_ADMIN: StoredAdminAccount = {
  uid: 'super_admin_root',
  name: 'SUPER ADMIN',
  email: 'superadmin@gmail.com',
  password: 'ADMIN123',
  role: 'SUPER_ADMIN',
  status: 'ACTIVE',
  createdAt: '2026-10-05T00:00:00.000Z',
  lastLogin: ''
};

export function getAdminAccounts(): StoredAdminAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = [DEFAULT_SUPER_ADMIN];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([DEFAULT_SUPER_ADMIN]));
      return [DEFAULT_SUPER_ADMIN];
    }
    // Ensure default super admin exists
    const hasSuper = parsed.some(a => a.email.toLowerCase() === DEFAULT_SUPER_ADMIN.email.toLowerCase());
    if (!hasSuper) {
      parsed.unshift(DEFAULT_SUPER_ADMIN);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    return parsed;
  } catch {
    return [DEFAULT_SUPER_ADMIN];
  }
}

export function saveAdminAccounts(accounts: StoredAdminAccount[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  } catch (e) {
    console.warn('Could not persist admin registry:', e);
  }
}

export function getActiveSession(): StoredAdminAccount | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setActiveSession(admin: StoredAdminAccount | null): void {
  try {
    if (admin) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(admin));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  } catch (e) {
    console.warn('Could not set session:', e);
  }
}

export function validateAdminLogin(emailInput: string, passwordInput: string): StoredAdminAccount {
  const accounts = getAdminAccounts();
  const cleanEmail = emailInput.trim().toLowerCase();
  const cleanPass = passwordInput.trim();

  const found = accounts.find(a => 
    a.email.trim().toLowerCase() === cleanEmail && 
    (a.password || 'ADMIN123') === cleanPass
  );

  if (!found) {
    throw new Error('Invalid email or password. Please verify your credentials.');
  }

  if (found.status === 'INACTIVE' || found.status === 'SUSPENDED') {
    throw new Error('Your administrative account has been deactivated. Please contact Super Admin.');
  }

  // Update last login
  found.lastLogin = new Date().toISOString();
  saveAdminAccounts(accounts);
  setActiveSession(found);

  // Sync to Firestore quietly in background if possible
  try {
    setDoc(doc(db, 'admins', found.uid), {
      uid: found.uid,
      name: found.name,
      email: found.email,
      role: found.role,
      status: found.status,
      lastLogin: found.lastLogin,
      createdAt: found.createdAt
    }, { merge: true }).catch(() => {});
  } catch {}

  return found;
}

export function createNewAdminAccount(
  data: { name: string; email: string; password?: string; role: AdminRole },
  actorAdmin: { uid: string; name: string; role: string }
): StoredAdminAccount {
  const accounts = getAdminAccounts();
  const cleanEmail = data.email.trim().toLowerCase();

  if (accounts.some(a => a.email.toLowerCase() === cleanEmail)) {
    throw new Error(`An administrator with email "${data.email}" already exists.`);
  }

  const newAdmin: StoredAdminAccount = {
    uid: `adm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: data.name.trim(),
    email: cleanEmail,
    password: data.password?.trim() || 'ADMIN123',
    role: data.role,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    lastLogin: ''
  };

  accounts.push(newAdmin);
  saveAdminAccounts(accounts);

  // Sync to Firestore
  try {
    setDoc(doc(db, 'admins', newAdmin.uid), {
      uid: newAdmin.uid,
      name: newAdmin.name,
      email: newAdmin.email,
      role: newAdmin.role,
      status: newAdmin.status,
      createdAt: newAdmin.createdAt
    }).catch(() => {});
  } catch {}

  logAdminActivity({
    adminUid: actorAdmin.uid,
    adminName: actorAdmin.name,
    adminRole: actorAdmin.role,
    action: 'Admin Account Created',
    targetType: 'ADMIN_USER',
    targetId: newAdmin.uid,
    details: `Created admin "${newAdmin.name}" (${newAdmin.email}) with role ${newAdmin.role}`
  }).catch(() => {});

  return newAdmin;
}

export function updateAdminAccountDetails(
  adminUid: string,
  updates: { name?: string; email?: string; password?: string; role?: AdminRole; status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' },
  actorAdmin: { uid: string; name: string; role: string }
): StoredAdminAccount {
  const accounts = getAdminAccounts();
  const index = accounts.findIndex(a => a.uid === adminUid);

  if (index === -1) {
    throw new Error('Admin account not found.');
  }

  const current = accounts[index];
  const updated: StoredAdminAccount = {
    ...current,
    name: updates.name !== undefined ? updates.name.trim() : current.name,
    email: updates.email !== undefined ? updates.email.trim().toLowerCase() : current.email,
    password: updates.password !== undefined && updates.password.trim() !== '' ? updates.password.trim() : current.password,
    role: updates.role !== undefined ? updates.role : current.role,
    status: updates.status !== undefined ? updates.status : current.status
  };

  accounts[index] = updated;
  saveAdminAccounts(accounts);

  // If the currently active session is updated, refresh it
  const activeSession = getActiveSession();
  if (activeSession && activeSession.uid === adminUid) {
    setActiveSession(updated);
  }

  // Sync to Firestore
  try {
    setDoc(doc(db, 'admins', adminUid), {
      uid: updated.uid,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      status: updated.status,
      updatedAt: new Date().toISOString()
    }, { merge: true }).catch(() => {});
  } catch {}

  logAdminActivity({
    adminUid: actorAdmin.uid,
    adminName: actorAdmin.name,
    adminRole: actorAdmin.role,
    action: 'Admin Details Updated',
    targetType: 'ADMIN_USER',
    targetId: adminUid,
    details: `Updated admin details for "${updated.name}" (${updated.email})`
  }).catch(() => {});

  return updated;
}

export function deleteAdminAccount(
  adminUid: string,
  actorAdmin: { uid: string; name: string; role: string }
): void {
  const accounts = getAdminAccounts();
  const target = accounts.find(a => a.uid === adminUid);
  if (!target) return;

  if (target.email.toLowerCase() === DEFAULT_SUPER_ADMIN.email.toLowerCase()) {
    throw new Error('Primary root Super Admin account cannot be deleted.');
  }

  const filtered = accounts.filter(a => a.uid !== adminUid);
  saveAdminAccounts(filtered);

  try {
    deleteDoc(doc(db, 'admins', adminUid)).catch(() => {});
  } catch {}

  logAdminActivity({
    adminUid: actorAdmin.uid,
    adminName: actorAdmin.name,
    adminRole: actorAdmin.role,
    action: 'Admin Account Deleted',
    targetType: 'ADMIN_USER',
    targetId: adminUid,
    details: `Deleted admin account for "${target.name}" (${target.email})`
  }).catch(() => {});
}
