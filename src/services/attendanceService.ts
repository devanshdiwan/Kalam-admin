import { LibraryAttendance } from '../types/models';
import { logAdminActivity } from './auditService';
import { repoAttendance } from './dataRepository';

export function subscribeToDateAttendance(
  date: string, 
  callback: (records: LibraryAttendance[]) => void, 
  onError?: (err: any) => void
) {
  return repoAttendance.subscribe((all) => {
    const forDate = all.filter(a => a.date === date);
    callback(forDate);
  });
}

export async function markSingleAttendance(
  student: { uid: string; userId: string; name: string },
  date: string,
  status: 'PRESENT' | 'ABSENT',
  shift: string,
  currentAdmin: { uid: string; name: string; role: string }
): Promise<void> {
  const attendanceId = `att_${student.uid}_${date}`;
  const nowIso = new Date().toISOString();
  const timeNow = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const record: LibraryAttendance = {
    attendanceId,
    uid: student.uid,
    studentId: student.userId,
    studentName: student.name,
    date,
    status,
    checkIn: status === 'PRESENT' ? timeNow : undefined,
    shift,
    markedBy: currentAdmin.name,
    createdAt: nowIso
  };

  await repoAttendance.set(record);

  await logAdminActivity({
    adminUid: currentAdmin.uid,
    adminName: currentAdmin.name,
    adminRole: currentAdmin.role,
    action: 'Attendance Marked',
    targetType: 'ATTENDANCE',
    targetId: attendanceId,
    details: `Marked ${student.name} as ${status} for ${date} (${shift})`
  });
}

export async function bulkMarkAttendance(
  records: Array<{
    student: { uid: string; userId: string; name: string };
    status: 'PRESENT' | 'ABSENT';
  }>,
  date: string,
  shift: string,
  currentAdmin: { uid: string; name: string; role: string }
): Promise<number> {
  const nowIso = new Date().toISOString();
  const timeNow = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  for (const item of records) {
    const attendanceId = `att_${item.student.uid}_${date}`;
    const record: LibraryAttendance = {
      attendanceId,
      uid: item.student.uid,
      studentId: item.student.userId,
      studentName: item.student.name,
      date,
      status: item.status,
      checkIn: item.status === 'PRESENT' ? timeNow : undefined,
      shift,
      markedBy: currentAdmin.name,
      createdAt: nowIso
    };
    await repoAttendance.set(record);
  }

  await logAdminActivity({
    adminUid: currentAdmin.uid,
    adminName: currentAdmin.name,
    adminRole: currentAdmin.role,
    action: 'Bulk Attendance Marked',
    targetType: 'ATTENDANCE',
    targetId: date,
    details: `Marked attendance for ${records.length} students on ${date} (${shift})`
  });

  return records.length;
}
