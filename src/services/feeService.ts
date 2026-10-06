import { FeeRecord } from '../types/models';
import { logAdminActivity } from './auditService';
import { repoFees } from './dataRepository';

export function subscribeToFees(callback: (fees: FeeRecord[]) => void, onError?: (err: any) => void) {
  return repoFees.subscribe(callback);
}

export async function createFee(
  student: { uid: string; userId: string; name: string },
  title: string,
  amount: number,
  dueDate: string,
  currentAdmin: { uid: string; name: string; role: string }
): Promise<FeeRecord> {
  const feeId = `fee_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const nowIso = new Date().toISOString();

  const record: FeeRecord = {
    feeId,
    uid: student.uid,
    studentId: student.userId,
    studentName: student.name,
    title,
    amount: Number(amount),
    status: 'PENDING',
    dueDate,
    recordedBy: currentAdmin.name,
    createdAt: nowIso,
    updatedAt: nowIso
  };

  await repoFees.set(record);

  await logAdminActivity({
    adminUid: currentAdmin.uid,
    adminName: currentAdmin.name,
    adminRole: currentAdmin.role,
    action: 'Fee Recorded',
    targetType: 'FEE',
    targetId: feeId,
    details: `Created fee invoice of ₹${amount} for ${student.name} (${student.userId}) - ${title}`
  });

  return record;
}

export async function recordPayment(
  feeId: string,
  paymentMode: string,
  currentAdmin: { uid: string; name: string; role: string }
): Promise<string> {
  const nowIso = new Date().toISOString();
  const receiptNumber = `RCPT-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

  await repoFees.update(feeId, {
    status: 'PAID',
    paidDate: nowIso,
    paymentMode,
    receiptNumber,
    updatedAt: nowIso
  });

  await logAdminActivity({
    adminUid: currentAdmin.uid,
    adminName: currentAdmin.name,
    adminRole: currentAdmin.role,
    action: 'Payment Recorded',
    targetType: 'FEE',
    targetId: feeId,
    details: `Recorded payment with Receipt #${receiptNumber} via ${paymentMode}`
  });

  return receiptNumber;
}
