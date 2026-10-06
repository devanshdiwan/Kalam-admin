import { UserProfile } from '../types/models';
import { logAdminActivity } from './auditService';
import { repoStudents, repoSeats } from './dataRepository';
import { db } from './firebase';
import { doc, setDoc } from 'firebase/firestore';

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
  const norm = userId.trim().toUpperCase();
  const existing = repoStudents.getAll().some(s => 
    s.userId.trim().toUpperCase() === norm && (!excludeUid || s.uid !== excludeUid)
  );
  return !existing;
}

export async function generateNextUserId(): Promise<string> {
  const all = repoStudents.getAll();
  if (all.length === 0) return 'KL-1001';

  let maxNum = 1000;
  all.forEach(s => {
    const match = s.userId.match(/KL-(\d+)/i);
    if (match && match[1]) {
      const n = parseInt(match[1], 10);
      if (n > maxNum) maxNum = n;
    }
  });

  return `KL-${maxNum + 1}`;
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
  const unique = await isUserIdUnique(payload.userId);
  if (!unique) {
    throw new Error(`User ID "${payload.userId}" is already registered. Please choose or generate another ID.`);
  }

  let uid = `std_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const nowIso = new Date().toISOString();

  // Try server route to sync file storage
  try {
    const response = await fetch('/api/admin/create-student', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (response.ok) {
      const data = await response.json();
      if (data.uid) uid = data.uid;
    }
  } catch {}

  const newStudent: UserProfile = {
    uid,
    userId: payload.userId.trim().toUpperCase(),
    password: payload.password?.trim() || '123456',
    name: payload.name.trim(),
    email: payload.email.trim().toLowerCase(),
    phone: payload.phone.trim(),
    dateOfBirth: payload.dateOfBirth || '',
    gender: payload.gender || 'Male',
    address: payload.address || '',
    fatherName: payload.fatherName || '',
    motherName: payload.motherName || '',
    guardianName: payload.guardianName || '',
    guardianPhone: payload.guardianPhone || '',
    aadhaarMasked: payload.aadhaarMasked ? (payload.aadhaarMasked.startsWith('XXXX') ? payload.aadhaarMasked : `XXXX XXXX ${payload.aadhaarMasked.slice(-4)}`) : '',
    className: payload.className || '',
    batchId: payload.batchId || '',
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

  // Sync to Firestore under both UID and UserID so student app lookups find it instantly
  try {
    await setDoc(doc(db, 'users', newStudent.uid), newStudent, { merge: true }).catch(() => {});
    await setDoc(doc(db, 'users', newStudent.userId), newStudent, { merge: true }).catch(() => {});
    await setDoc(doc(db, 'userIdentifiers', newStudent.userId), {
      userId: newStudent.userId,
      uid: newStudent.uid,
      name: newStudent.name,
      email: newStudent.email,
      phone: newStudent.phone,
      active: true,
      updatedAt: nowIso
    }, { merge: true }).catch(() => {});
  } catch {}

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

  // Sync to Firestore
  if (updated) {
    try {
      await setDoc(doc(db, 'users', uid), updated, { merge: true }).catch(() => {});
      if (updated.userId) {
        await setDoc(doc(db, 'users', updated.userId.toUpperCase()), updated, { merge: true }).catch(() => {});
        await setDoc(doc(db, 'userIdentifiers', updated.userId.toUpperCase()), {
          userId: updated.userId.toUpperCase(),
          uid: updated.uid,
          name: updated.name,
          email: updated.email,
          phone: updated.phone,
          active: updated.active !== false,
          updatedAt: new Date().toISOString()
        }, { merge: true }).catch(() => {});
      }
    } catch {}
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
