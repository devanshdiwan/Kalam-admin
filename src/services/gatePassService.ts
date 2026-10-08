import { GatePass, UserProfile } from '../types/models';
import { logAdminActivity } from './auditService';
import { repoGatePasses, repoStudents } from './dataRepository';

export function subscribeToGatePasses(callback: (passes: GatePass[]) => void, onError?: (err: any) => void) {
  return repoGatePasses.subscribe(callback);
}

export async function createGatePass(
  student: { uid: string; userId: string; name: string; assignedSeatNumber?: string },
  validFrom: string,
  validUntil: string,
  currentAdmin: { uid: string; name: string; role: string }
): Promise<GatePass> {
  const passId = `GP-${Math.floor(100000 + Math.random() * 900000)}`;
  const secureToken = `KL-GP-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const nowIso = new Date().toISOString();

  const pass: GatePass = {
    passId,
    uid: student.uid,
    studentId: student.userId,
    studentName: student.name,
    validFrom,
    validUntil,
    status: 'ACTIVE',
    secureToken,
    seatNumber: student.assignedSeatNumber || 'Unassigned',
    createdAt: nowIso,
    updatedAt: nowIso
  };

  await repoGatePasses.set(pass);

  await logAdminActivity({
    adminUid: currentAdmin.uid,
    adminName: currentAdmin.name,
    adminRole: currentAdmin.role,
    action: 'Gate Pass Created',
    targetType: 'GATE_PASS',
    targetId: passId,
    details: `Generated active gate pass for ${student.name} (${student.userId}) valid till ${validUntil}`
  });

  return pass;
}

export async function revokeGatePass(
  passId: string,
  currentAdmin: { uid: string; name: string; role: string }
): Promise<void> {
  await repoGatePasses.update(passId, {
    status: 'REVOKED',
    updatedAt: new Date().toISOString()
  });

  await logAdminActivity({
    adminUid: currentAdmin.uid,
    adminName: currentAdmin.name,
    adminRole: currentAdmin.role,
    action: 'Gate Pass Revoked',
    targetType: 'GATE_PASS',
    targetId: passId,
    details: `Revoked gate pass ${passId}`
  });
}

export interface GatePassVerificationResult {
  valid: boolean;
  code: 'VALID' | 'USER_NOT_FOUND' | 'ACCOUNT_INACTIVE' | 'MEMBERSHIP_INACTIVE' | 'PASS_EXPIRED' | 'PASS_REVOKED' | 'INVALID_TOKEN';
  message: string;
  pass?: GatePass;
  student?: UserProfile;
}

export async function verifyGatePassTokenOrId(identifier: string): Promise<GatePassVerificationResult> {
  const clean = identifier.trim().toUpperCase();
  const allPasses = repoGatePasses.getAll();

  const pass = allPasses.find(p => 
    p.passId.toUpperCase() === clean ||
    p.secureToken.toUpperCase() === clean ||
    p.studentId.toUpperCase() === clean
  );

  if (!pass) {
    return {
      valid: false,
      code: 'INVALID_TOKEN',
      message: 'No matching Gate Pass found for this identifier or token.'
    };
  }

  const student = repoStudents.getById(pass.uid) || repoStudents.getAll().find(s => 
    s && s.userId && (s.userId || '').toString().toUpperCase() === (pass.studentId || '').toString().toUpperCase()
  );
  if (!student) {
    return {
      valid: false,
      code: 'USER_NOT_FOUND',
      message: 'Student account linked to this gate pass not found.',
      pass
    };
  }

  if (!student.active) {
    return {
      valid: false,
      code: 'ACCOUNT_INACTIVE',
      message: 'Student account has been deactivated by administration.',
      pass,
      student
    };
  }

  if (pass.status === 'REVOKED') {
    return {
      valid: false,
      code: 'PASS_REVOKED',
      message: 'This Gate Pass was explicitly REVOKED by administration.',
      pass,
      student
    };
  }

  const todayIso = new Date().toISOString().split('T')[0];
  if (pass.validUntil && pass.validUntil < todayIso) {
    return {
      valid: false,
      code: 'PASS_EXPIRED',
      message: `This Gate Pass expired on ${pass.validUntil}.`,
      pass,
      student
    };
  }

  return {
    valid: true,
    code: 'VALID',
    message: 'Gate Pass verified and valid for study hall entry.',
    pass,
    student
  };
}
