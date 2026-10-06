import { LibrarySeat } from '../types/models';
import { logAdminActivity } from './auditService';
import { repoSeats, repoStudents } from './dataRepository';

export function subscribeToSeats(callback: (seats: LibrarySeat[]) => void, onError?: (err: any) => void) {
  return repoSeats.subscribe(callback);
}

export async function getAllSeats(): Promise<LibrarySeat[]> {
  return repoSeats.getAll();
}

export async function assignSeat(
  seatId: string, 
  student: { uid: string; name: string; userId: string },
  currentAdmin: { uid: string; name: string; role: string }
): Promise<void> {
  const nowIso = new Date().toISOString();

  await repoSeats.update(seatId, {
    status: 'OCCUPIED',
    assignedUid: student.uid,
    assignedStudentName: student.name,
    assignedStudentUserId: student.userId,
    updatedAt: nowIso
  });

  await repoStudents.update(student.uid, {
    assignedSeatId: seatId,
    assignedSeatNumber: seatId,
    updatedAt: nowIso
  });

  await logAdminActivity({
    adminUid: currentAdmin.uid,
    adminName: currentAdmin.name,
    adminRole: currentAdmin.role,
    action: 'Seat Assigned',
    targetType: 'SEAT',
    targetId: seatId,
    details: `Assigned desk ${seatId} to ${student.name} (${student.userId})`
  });
}

export async function unassignSeat(
  seatId: string, 
  assignedUid?: string,
  currentAdmin?: { uid: string; name: string; role: string }
): Promise<void> {
  const nowIso = new Date().toISOString();

  await repoSeats.update(seatId, {
    status: 'AVAILABLE',
    assignedUid: undefined,
    assignedStudentName: undefined,
    assignedStudentUserId: undefined,
    updatedAt: nowIso
  });

  if (assignedUid) {
    await repoStudents.update(assignedUid, {
      assignedSeatId: '',
      assignedSeatNumber: '',
      updatedAt: nowIso
    });
  }

  if (currentAdmin) {
    await logAdminActivity({
      adminUid: currentAdmin.uid,
      adminName: currentAdmin.name,
      adminRole: currentAdmin.role,
      action: 'Seat Unassigned',
      targetType: 'SEAT',
      targetId: seatId,
      details: `Released desk ${seatId}`
    });
  }
}

export async function updateSeatStatus(
  seatId: string, 
  status: 'AVAILABLE' | 'RESERVED' | 'MAINTENANCE',
  notes?: string
): Promise<void> {
  await repoSeats.update(seatId, {
    status,
    notes: notes || '',
    updatedAt: new Date().toISOString()
  });
}

export async function initializeDefaultSeats(): Promise<number> {
  return repoSeats.getAll().length;
}
