import { AdminActivityLog } from '../types/models';
import { repoActivityLogs } from './dataRepository';

export async function logAdminActivity(entry: Omit<AdminActivityLog, 'logId' | 'timestamp'>): Promise<void> {
  try {
    const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const timestamp = new Date().toISOString();
    
    await repoActivityLogs.set({
      ...entry,
      logId,
      timestamp
    });
  } catch (err) {
    console.warn('Activity log write error:', err);
  }
}

export async function getRecentActivityLogs(maxItems: number = 25): Promise<AdminActivityLog[]> {
  const all = repoActivityLogs.getAll();
  return all.slice(0, maxItems);
}
