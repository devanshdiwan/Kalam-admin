import { UserProfile } from '../types/models';
import { logAdminActivity } from './auditService';
import { repoStudents, repoSeats } from './dataRepository';
import { db, storage, isQuotaExceeded, handleQuotaExceeded } from './firebase';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export async function uploadProfilePhoto(userId: string, file: File): Promise<string> {
  try {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const cleanId = (userId || 'student').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    const storageRef = ref(storage, `profile_photos/${cleanId}_${Date.now()}.${fileExt}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (err: any) {
    console.error('Storage upload error:', err);
    throw new Error(`Profile image upload failed: ${err.message || 'Storage write failed'}`);
  }
}

export interface CreateStudentPayload {
  userId: string;
  password: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  gender?: 'Male' | 'Female' | 'Other';
  address?: string;
  fatherName?: string;
  motherName?: string;
  guardianName?: string;
  guardianPhone?: string;
  aadhaarMasked?: string;
  className?: string;
  batchId?: string;
  membershipType?: string;
  membershipStatus?: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'INACTIVE';
  membershipStartDate?: string;
  membershipEndDate?: string;
  assignedSeatId?: string;
  assignedSeatNumber?: string;
  profileImageUrl?: string;
}

export async function isUserIdUnique(userId: string, excludeUid?: string): Promise<boolean> {
  if (!userId || typeof userId !== 'string' || !userId.trim()) return false;
  const norm = userId.trim().toUpperCase();
  const existing = repoStudents.getAll().some(s => {
    if (!s || !s.userId) return false;
    const sNorm = String(s.userId).trim().toUpperCase();
    return sNorm === norm && (!excludeUid || s.uid !== excludeUid);
  });
  return !existing;
}

export async function generateNextUserId(): Promise<string> {
  const all = repoStudents.getAll();
  let maxNum = 1000;
  all.forEach(s => {
    if (!s || !s.userId) return;
    const match = String(s.userId).match(/KL-(\d+)/i);
    if (match && match[1]) {
      const n = parseInt(match[1], 10);
      if (!isNaN(n) && n > maxNum && n < 90000) maxNum = n;
    }
  });

  let nextId = `KL-${maxNum + 1}`;
  let attempt = 1;
  while (!(await isUserIdUnique(nextId)) && attempt < 100) {
    maxNum += 1;
    nextId = `KL-${maxNum + 1}`;
    attempt++;
  }

  return nextId;
}

export async function syncAllStudentsToServer(students: UserProfile[]): Promise<void> {
  if (!students || students.length === 0) return;
  try {
    await fetch('/api/admin/sync-students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ students })
    });
  } catch {}
}

export async function createStudentAccount(
  payload: CreateStudentPayload, 
  currentAdmin: { uid: string; name: string; role: string }
): Promise<UserProfile> {
  const normUserId = (payload.userId || '').trim().toUpperCase();
  if (!normUserId) {
    throw new Error('User ID is required.');
  }

  const unique = await isUserIdUnique(normUserId);
  if (!unique) {
    throw new Error(`User ID "${normUserId}" is already registered. Please choose or generate another ID.`);
  }

  let uid = `std_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const nowIso = new Date().toISOString();

  // Call server route to create Firebase Auth account and persist
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch('/api/admin/create-student', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        userId: normUserId
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create student account on backend.');
    }
    if (data.uid) uid = data.uid;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Student account creation request timed out. Please try again.');
    }
    throw err;
  }

  const newStudent: UserProfile = {
    uid,
    userId: normUserId,
    password: (payload.password || '123456').trim(),
    name: (payload.name || '').trim(),
    email: (payload.email || '').trim().toLowerCase(),
    phone: (payload.phone || '').trim(),
    dateOfBirth: payload.dateOfBirth || '',
    gender: payload.gender || 'Male',
    address: (payload.address || '').trim(),
    fatherName: (payload.fatherName || '').trim(),
    motherName: (payload.motherName || '').trim(),
    guardianName: (payload.guardianName || '').trim(),
    guardianPhone: (payload.guardianPhone || '').trim(),
    aadhaarMasked: payload.aadhaarMasked ? (payload.aadhaarMasked.startsWith('XXXX') ? payload.aadhaarMasked : `XXXX XXXX ${(payload.aadhaarMasked || '').slice(-4)}`) : '',
    className: (payload.className || '').trim(),
    batchId: (payload.batchId || '').trim(),
    membershipType: payload.membershipType || 'Full-Day (12 Hours)',
    membershipStatus: payload.membershipStatus || 'ACTIVE',
    membershipStartDate: payload.membershipStartDate || nowIso.split('T')[0],
    membershipEndDate: payload.membershipEndDate || '',
    assignedSeatId: payload.assignedSeatId || '',
    assignedSeatNumber: payload.assignedSeatNumber || '',
    profileImageUrl: payload.profileImageUrl || '',
    active: true,
    role: 'STUDENT',
    createdAt: nowIso,
    updatedAt: nowIso
  };

  await repoStudents.set(newStudent);

  // Sync to Firestore under both UID and UserID in background (non-blocking, only when quota allows)
  if (!isQuotaExceeded()) {
    setDoc(doc(db, 'users', newStudent.uid), newStudent, { merge: true }).catch((err: any) => {
      if (err?.code === 'resource-exhausted' || String(err?.message || '').toLowerCase().includes('quota')) {
        handleQuotaExceeded(err?.message).catch(() => {});
      }
    });
    setDoc(doc(db, 'users', newStudent.userId), newStudent, { merge: true }).catch((err: any) => {
      if (err?.code === 'resource-exhausted' || String(err?.message || '').toLowerCase().includes('quota')) {
        handleQuotaExceeded(err?.message).catch(() => {});
      }
    });
    setDoc(doc(db, 'userIdentifiers', newStudent.userId), {
      userId: newStudent.userId,
      uid: newStudent.uid,
      name: newStudent.name,
      email: newStudent.email,
      phone: newStudent.phone,
      active: true,
      updatedAt: nowIso
    }, { merge: true }).catch(() => {});
  }

  // If a seat was assigned, update seat allocation
  if (payload.assignedSeatId) {
    await repoSeats.update(payload.assignedSeatId, {
      status: 'OCCUPIED',
      assignedUid: uid,
      assignedStudentName: newStudent.name,
      assignedStudentUserId: newStudent.userId,
      updatedAt: nowIso
    });
  }

  await logAdminActivity({
    adminUid: currentAdmin.uid,
    adminName: currentAdmin.name,
    adminRole: currentAdmin.role,
    action: 'Student Created',
    targetType: 'STUDENT',
    targetId: newStudent.userId,
    details: `Created student account ${newStudent.name} (${newStudent.userId}) with password`
  });

  return newStudent;
}

export async function updateStudentProfile(
  uid: string, 
  data: Partial<UserProfile>,
  currentAdmin: { uid: string; name: string; role: string }
): Promise<void> {
  // Update in local repository
  const updated = await repoStudents.update(uid, data);

  // Sync to server API so password and all fields update on server immediately
  try {
    await fetch(`/api/admin/update-student/${uid}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, uid })
    });
  } catch {}

  // Sync to Firestore in background without blocking
  if (updated) {
    setDoc(doc(db, 'users', uid), updated, { merge: true }).catch(() => {});
    if (updated.userId) {
      setDoc(doc(db, 'users', updated.userId.toUpperCase()), updated, { merge: true }).catch(() => {});
      setDoc(doc(db, 'userIdentifiers', updated.userId.toUpperCase()), {
        userId: updated.userId.toUpperCase(),
        uid: updated.uid,
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        active: updated.active !== false,
        updatedAt: new Date().toISOString()
      }, { merge: true }).catch(() => {});
    }
  }

  await logAdminActivity({
    adminUid: currentAdmin.uid,
    adminName: currentAdmin.name,
    adminRole: currentAdmin.role,
    action: 'Student Updated',
    targetType: 'STUDENT',
    targetId: data.userId || uid,
    details: `Updated details for ${data.name || uid} (Password/Profile updated)`
  });
}

export async function toggleStudentActive(
  uid: string, 
  active: boolean,
  currentAdmin: { uid: string; name: string; role: string }
): Promise<void> {
  const updated = await repoStudents.update(uid, {
    active,
    membershipStatus: active ? 'ACTIVE' : 'INACTIVE',
    updatedAt: new Date().toISOString()
  });

  try {
    await fetch(`/api/admin/update-student/${uid}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active, membershipStatus: active ? 'ACTIVE' : 'INACTIVE', uid })
    });
  } catch {}

  if (updated && updated.userId) {
    try {
      await setDoc(doc(db, 'users', uid), { active, membershipStatus: active ? 'ACTIVE' : 'INACTIVE' }, { merge: true }).catch(() => {});
      await setDoc(doc(db, 'users', updated.userId.toUpperCase()), { active, membershipStatus: active ? 'ACTIVE' : 'INACTIVE' }, { merge: true }).catch(() => {});
    } catch {}
  }

  await logAdminActivity({
    adminUid: currentAdmin.uid,
    adminName: currentAdmin.name,
    adminRole: currentAdmin.role,
    action: active ? 'Student Activated' : 'Student Deactivated',
    targetType: 'STUDENT',
    targetId: uid,
    details: `${active ? 'Activated' : 'Deactivated'} account status`
  });
}

export async function getStudentById(uid: string): Promise<UserProfile | null> {
  const student = repoStudents.getById(uid);
  return student || null;
}

export function subscribeToStudents(callback: (students: UserProfile[]) => void, onError?: (err: any) => void) {
  return repoStudents.subscribe(callback);
}
