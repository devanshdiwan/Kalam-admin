import { 
  UserProfile, 
  LibrarySeat, 
  LibraryBook, 
  LibraryIssue, 
  LibraryAttendance, 
  GatePass, 
  FeeRecord, 
  NoticeItem, 
  NotificationItem, 
  JoinRequest, 
  CoachingClass, 
  CoachingBatch, 
  StudyMaterial, 
  HomeworkAssignment, 
  TestRecord, 
  ResultRecord, 
  AdminActivityLog 
} from '../types/models';
import { db, isQuotaExceeded, handleQuotaExceeded } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';

// Initial 60 Study Hall Desks for Kalam Library Gursarai
function generateInitialSeats(): LibrarySeat[] {
  const seats: LibrarySeat[] = [];
  const now = new Date().toISOString();

  // Ground Floor: G-01 to G-30
  for (let i = 1; i <= 30; i++) {
    const num = `G-${String(i).padStart(2, '0')}`;
    const section = i <= 15 ? 'Section A (Silent Hall)' : 'Section B (Self-Study)';
    seats.push({
      seatId: num,
      seatNumber: num,
      floor: 'Ground Floor',
      section,
      status: 'AVAILABLE',
      updatedAt: now
    });
  }

  // 1st Floor: F-01 to F-30
  for (let i = 1; i <= 30; i++) {
    const num = `F-${String(i).padStart(2, '0')}`;
    const section = i <= 15 ? 'Section C (Discussion/Cabin)' : 'Section D (Private Cubicle)';
    seats.push({
      seatId: num,
      seatNumber: num,
      floor: '1st Floor',
      section,
      status: 'AVAILABLE',
      updatedAt: now
    });
  }

  return seats;
}

// Local Storage Helper & Resilient Repository
class ReactiveCollection<T extends { [key: string]: any }> {
  private key: string;
  private idKey: string;
  private firestorePath?: string;
  private items: T[] = [];
  private listeners: Set<(items: T[]) => void> = new Set();
  private isListeningFirestore: boolean = false;
  private firestoreUnsubscribe?: () => void;

  constructor(key: string, idKey: string, initialData?: T[], firestorePath?: string) {
    this.key = `kalam_${key}`;
    this.idKey = idKey;
    this.firestorePath = firestorePath;
    this.load(initialData);
    this.initFirestoreSync();
  }

  private load(fallback?: T[]) {
    try {
      const raw = localStorage.getItem(this.key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.items = parsed.filter(Boolean);
        } else {
          this.items = fallback ? [...fallback] : [];
          this.save();
        }
      } else if (fallback) {
        this.items = [...fallback];
        this.save();
      } else {
        this.items = [];
      }
    } catch {
      this.items = fallback ? [...fallback] : [];
    }
    if (!Array.isArray(this.items)) {
      this.items = [];
    }
  }

  private save() {
    try {
      localStorage.setItem(this.key, JSON.stringify(this.items));
    } catch {}
    this.notify();
  }

  private notify() {
    const copy = [...this.items];
    this.listeners.forEach(cb => {
      try { cb(copy); } catch {}
    });
  }

  public replaceItems(newItems: T[]): void {
    if (!Array.isArray(newItems)) return;
    this.items = [...newItems];
    this.save();
  }

  private initFirestoreSync() {
    if (!this.firestorePath || this.isListeningFirestore || isQuotaExceeded()) return;
    this.isListeningFirestore = true;

    try {
      const colRef = collection(db, this.firestorePath);
      this.firestoreUnsubscribe = onSnapshot(colRef, (snapshot) => {
        if (!snapshot.empty) {
          const remoteList = snapshot.docs.map(d => {
            const data = d.data() as any;
            const itemId = data[this.idKey] || d.id;
            return { ...data, [this.idKey]: itemId } as T;
          }).filter(item => item && (item as any)[this.idKey]);

          // Merge remote items gracefully without overwriting local items with empty keys
          const mergedMap = new Map<string, T>();
          this.items.forEach(item => {
            if (item && item[this.idKey]) mergedMap.set(String(item[this.idKey]), item);
          });
          remoteList.forEach(item => {
            if (item && (item as any)[this.idKey]) {
              const k = String((item as any)[this.idKey]);
              const existing = mergedMap.get(k);
              mergedMap.set(k, existing ? { ...existing, ...item } : item);
            }
          });
          this.items = Array.from(mergedMap.values());
          this.save();
        }
      }, (error: any) => {
        const isQuota = error?.code === 'resource-exhausted' ||
          String(error?.message || '').toLowerCase().includes('quota') ||
          String(error?.message || '').toLowerCase().includes('resource-exhausted');
        
        // Immediately detach listener to prevent exponential backoff spam
        if (this.firestoreUnsubscribe) {
          try { this.firestoreUnsubscribe(); } catch {}
          this.firestoreUnsubscribe = undefined;
        }
        this.isListeningFirestore = false;

        if (isQuota) {
          handleQuotaExceeded(error?.message).catch(() => {});
        }
      });
    } catch {
      this.isListeningFirestore = false;
    }
  }

  public getAll(): T[] {
    return [...this.items];
  }

  public getById(id: string): T | undefined {
    return this.items.find(item => item[this.idKey] === id);
  }

  public subscribe(cb: (items: T[]) => void): () => void {
    this.listeners.add(cb);
    // Immediate callback with current state
    cb([...this.items]);

    return () => {
      this.listeners.delete(cb);
    };
  }

  public async set(item: T): Promise<T> {
    const id = item[this.idKey];
    const index = this.items.findIndex(x => x[this.idKey] === id);
    if (index >= 0) {
      this.items[index] = item;
    } else {
      this.items.unshift(item);
    }
    this.save();

    // Sync to Firestore only if quota allows, without blocking UI
    if (this.firestorePath && id && !isQuotaExceeded()) {
      setDoc(doc(db, this.firestorePath, String(id)), item as any, { merge: true }).catch((err: any) => {
        if (err?.code === 'resource-exhausted' || String(err?.message || '').toLowerCase().includes('quota')) {
          handleQuotaExceeded(err?.message).catch(() => {});
        }
      });
    }

    return item;
  }

  public async update(id: string, partial: Partial<T>): Promise<T | null> {
    const index = this.items.findIndex(x => x[this.idKey] === id);
    if (index === -1) return null;

    const updated = {
      ...this.items[index],
      ...partial,
      updatedAt: new Date().toISOString()
    };
    this.items[index] = updated;
    this.save();

    // Sync to Firestore only if quota allows, without blocking UI
    if (this.firestorePath && id && !isQuotaExceeded()) {
      updateDoc(doc(db, this.firestorePath, String(id)), partial as any).catch((err: any) => {
        if (err?.code === 'resource-exhausted' || String(err?.message || '').toLowerCase().includes('quota')) {
          handleQuotaExceeded(err?.message).catch(() => {});
        }
      });
    }

    return updated;
  }

  public async remove(id: string): Promise<void> {
    this.items = this.items.filter(x => x[this.idKey] !== id);
    this.save();

    // Sync to Firestore only if quota allows, without blocking UI
    if (this.firestorePath && id && !isQuotaExceeded()) {
      deleteDoc(doc(db, this.firestorePath, String(id))).catch((err: any) => {
        if (err?.code === 'resource-exhausted' || String(err?.message || '').toLowerCase().includes('quota')) {
          handleQuotaExceeded(err?.message).catch(() => {});
        }
      });
    }
  }
}

// Global Repositories for All Kalam Library Collections
export const repoStudents = new ReactiveCollection<UserProfile>('students', 'uid', [], 'users');
export const repoSeats = new ReactiveCollection<LibrarySeat>('seats', 'seatId', generateInitialSeats(), 'librarySeats');
export const repoBooks = new ReactiveCollection<LibraryBook>('books', 'bookId', [], 'libraryBooks');
export const repoIssues = new ReactiveCollection<LibraryIssue>('issues', 'issueId', [], 'libraryIssues');
export const repoAttendance = new ReactiveCollection<LibraryAttendance>('attendance', 'attendanceId', [], 'libraryAttendance');
export const repoGatePasses = new ReactiveCollection<GatePass>('gatePasses', 'passId', [], 'gatePasses');
export const repoFees = new ReactiveCollection<FeeRecord>('fees', 'feeId', [], 'fees');
export const repoNotices = new ReactiveCollection<NoticeItem>('notices', 'noticeId', [], 'notices');
export const repoNotifications = new ReactiveCollection<NotificationItem>('notifications', 'notificationId', [], 'notifications');
export const repoJoinRequests = new ReactiveCollection<JoinRequest>('joinRequests', 'requestId', [], 'joinRequests');
export const repoClasses = new ReactiveCollection<CoachingClass>('classes', 'classId', [], 'coachingClasses');
export const repoBatches = new ReactiveCollection<CoachingBatch>('batches', 'batchId', [], 'coachingBatches');
export const repoStudyMaterials = new ReactiveCollection<StudyMaterial>('materials', 'materialId', [], 'studyMaterials');
export const repoHomework = new ReactiveCollection<HomeworkAssignment>('homework', 'id', [], 'homework');
export const repoTests = new ReactiveCollection<TestRecord>('tests', 'testId', [], 'tests');
export const repoResults = new ReactiveCollection<ResultRecord>('results', 'resultId', [], 'results');
export const repoActivityLogs = new ReactiveCollection<AdminActivityLog>('activityLogs', 'logId', [], 'adminActivityLogs');

// Server Database Hydration to ensure complete sync across sessions even when Cloud quota is reached
export async function hydrateInitialDataFromServer(): Promise<void> {
  try {
    const res = await fetch('/api/admin/students');
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.students) && data.students.length > 0) {
        const current = repoStudents.getAll();
        const map = new Map<string, UserProfile>();
        current.forEach(s => {
          const k = s.uid || s.userId;
          if (k) map.set(k, s);
        });
        data.students.forEach((s: UserProfile) => {
          const k = s.uid || s.userId;
          if (k) {
            const existing = map.get(k);
            map.set(k, existing ? { ...existing, ...s } : s);
          }
        });
        repoStudents.replaceItems(Array.from(map.values()));
      }
    }
  } catch {}

  try {
    const res = await fetch('/api/admin/notices');
    if (res.ok) {
      const data = await res.json();
      if (data.notices && Array.isArray(data.notices) && data.notices.length > 0) {
        const current = repoNotices.getAll();
        const map = new Map<string, NoticeItem>();
        current.forEach(n => {
          if (n.noticeId) map.set(n.noticeId, n);
        });
        data.notices.forEach((n: NoticeItem) => {
          if (n.noticeId) {
            const existing = map.get(n.noticeId);
            map.set(n.noticeId, existing ? { ...existing, ...n } : n);
          }
        });
        repoNotices.replaceItems(Array.from(map.values()));
      }
    }
  } catch {}
}

// Trigger initial hydration in background safely
if (typeof window !== 'undefined') {
  setTimeout(() => {
    hydrateInitialDataFromServer().catch(() => {});
  }, 100);
}

