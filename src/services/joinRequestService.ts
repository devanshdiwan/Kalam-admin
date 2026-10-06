import { JoinRequest, JoinRequestStatus } from '../types/models';
import { logAdminActivity } from './auditService';
import { repoJoinRequests } from './dataRepository';

export function subscribeToJoinRequests(callback: (requests: JoinRequest[]) => void, onError?: (err: any) => void) {
  return repoJoinRequests.subscribe(callback);
}

export async function createJoinRequest(
  data: {
    fullName: string;
    phone: string;
    email?: string;
    interest?: string;
    message?: string;
  }
): Promise<JoinRequest> {
  const requestId = `req_${Date.now()}`;
  const nowIso = new Date().toISOString();

  const request: JoinRequest = {
    requestId,
    fullName: data.fullName,
    phone: data.phone,
    email: data.email || '',
    interest: data.interest || 'Library Membership',
    message: data.message || '',
    status: 'NEW',
    createdAt: nowIso,
    updatedAt: nowIso
  };

  await repoJoinRequests.set(request);
  return request;
}

export async function updateJoinRequestStatus(
  requestId: string,
  status: JoinRequestStatus,
  notes?: string,
  currentAdmin?: { uid: string; name: string; role: string }
): Promise<void> {
  const updateData: any = {
    status,
    updatedAt: new Date().toISOString()
  };
  if (notes !== undefined) updateData.notes = notes;
  if (currentAdmin) updateData.assignedTo = currentAdmin.name;

  await repoJoinRequests.update(requestId, updateData);

  if (currentAdmin) {
    await logAdminActivity({
      adminUid: currentAdmin.uid,
      adminName: currentAdmin.name,
      adminRole: currentAdmin.role,
      action: 'Join Request Updated',
      targetType: 'JOIN_REQUEST',
      targetId: requestId,
      details: `Updated request status to ${status}`
    });
  }
}
