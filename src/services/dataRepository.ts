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
import { db } from './firebase';
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

// Local Storage Helper
class ReactiveCollection<T extends { [key: string]: any }> {
  private key: string;
  private idKey: string;
  private firestorePath?: string;
  private items: T[] = [];
  private listeners: Set<(items: T[]) => void> = new Set();
  private isListeningFirestore: boolean = false;

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
        this.items = JSON.parse(raw);
      } else if (fallback) {
        this.items = fallback;
        this.save();
      } else {
        this.items = [];
      }
    } catch {
      this.items = fallback || [];
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

  private initFirestoreSync() {
    if (!this.firestorePath || this.isListeningFirestore) return;
    this.isListeningFirestore = true;

    try {
      const colRef = collection(db, this.firestorePath);
      onSnapshot(colRef, (snapshot) => {
        if (!snapshot.empty) {
          const remoteList = snapshot.docs.map(d => d.data() as T);
          // Merge remote items gracefully
          const mergedMap = new Map<string, T>();
          this.items.forEach(item => mergedMap.set(item[this.idKey], item));
          remoteList.forEach(item => mergedMap.set(item[this.idKey], item));
          this.items = Array.from(mergedMap.values());
          this.save();
        }
      }, (err) => {
        // Silently handle invalid API key or connection error without throwing unhandled exceptions
        // The local repository continues serving flawlessly
      });
    } catch {
      // Ignore background sync errors
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

    // Sync to Firestore in background
    if (this.firestorePath && id) {
      try {
        await setDoc(doc(db, this.firestorePath, String(id)), item as any, { merge: true }).catch(() => {});
      } catch {}
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

    // Sync to Firestore in background
    if (this.firestorePath) {
      try {
        await updateDoc(doc(db, this.firestorePath, String(id)), partial as any).catch(() => {});
      } catch {}
    }

    return updated;
  }

  public async remove(id: string): Promise<void> {
    this.items = this.items.filter(x => x[this.idKey] !== id);
    this.save();

    // Sync to Firestore in background
    if (this.firestorePath) {
      try {
        await deleteDoc(doc(db, this.firestorePath, String(id))).catch(() => {});
      } catch {}
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
