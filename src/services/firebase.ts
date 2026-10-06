import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  getDocFromServer 
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

export const firebaseConfig = {
  apiKey: "AIzaSyABkjUmatBMizTBM9ZYt5ublozQKLSd_Gs",
  authDomain: "kalam-liberary.firebaseapp.com",
  databaseURL: "https://kalam-liberary-default-rtdb.firebaseio.com",
  projectId: "kalam-liberary",
  storageBucket: "kalam-liberary.firebasestorage.app",
  messagingSenderId: "234194842691",
  appId: "1:234194842691:web:863835cb1f0bcea90510f6",
  measurementId: "G-XXTX8T3L7P"
};

// Initialize Firebase once
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): void {
  const current = auth.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: current?.uid,
      email: current?.email,
      emailVerified: current?.emailVerified,
      isAnonymous: current?.isAnonymous,
      tenantId: current?.tenantId,
      providerInfo: current?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  // Log non-fatal warning rather than crashing the client
  console.warn(`[Kalam Firebase sync note - ${operationType} on ${path}]:`, errInfo.error);
}

// Validation connection test on application startup as recommended
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'system_health', 'connection'));
    return true;
  } catch (error) {
    // Graceful catch - don't crash
    return false;
  }
}

// Suppress unhandled startup noise
try {
  testConnection().catch(() => {});
} catch {}
