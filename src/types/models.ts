export type AdminRole = 
  | 'SUPER_ADMIN' 
  | 'ADMIN' 
  | 'LIBRARIAN' 
  | 'TEACHER' 
  | 'ACCOUNTANT' 
  | 'STAFF';

export type MembershipStatus = 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'INACTIVE';

export type SeatStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE';

export type BookIssueStatus = 'ISSUED' | 'RETURNED' | 'OVERDUE' | 'RESERVED';

export type GatePassStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'INACTIVE';

export type FeeStatus = 'PAID' | 'PENDING' | 'OVERDUE' | 'CANCELLED';

export type JoinRequestStatus = 'NEW' | 'CONTACTED' | 'INTERESTED' | 'APPROVED' | 'REJECTED' | 'COMPLETED';

export type NoticeCategory = 
  | 'GENERAL' 
  | 'IMPORTANT' 
  | 'LIBRARY' 
  | 'MEMBERSHIP' 
  | 'ATTENDANCE' 
  | 'FEE' 
  | 'HOLIDAY' 
  | 'EVENT' 
  | 'SYSTEM';

export type NoticeTarget = 'ALL' | 'ACTIVE_MEMBERS' | 'LIBRARY_MEMBERS' | 'SPECIFIC_USER' | 'CLASS_BATCH';

export interface UserProfile {
  uid: string;
  userId: string; // e.g. KL-1024
  password?: string;
  name: string;
  profileImageUrl?: string;
  phone: string;
  email: string;
  dateOfBirth?: string;
  gender?: 'Male' | 'Female' | 'Other';
  address?: string;
  fatherName?: string;
  motherName?: string;
  guardianName?: string;
  guardianPhone?: string;
  aadhaarMasked?: string; // e.g. XXXX XXXX 1234
  className?: string;
  batchId?: string;
  membershipStatus?: MembershipStatus;
  membershipType?: string;
  membershipStartDate?: string;
  membershipEndDate?: string;
  assignedSeatId?: string;
  assignedSeatNumber?: string;
  active: boolean;
  role?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUser {
  uid: string;
  name: string;
  email: string;
  role: AdminRole;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: string;
  lastLogin?: string;
}

export interface JoinRequest {
  requestId: string;
  fullName: string;
  phone: string;
  email?: string;
  interest?: string;
  message?: string;
  status: JoinRequestStatus;
  assignedTo?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LibraryMembership {
  membershipId: string;
  uid: string;
  studentId: string; // userId e.g. KL-1024
  studentName: string;
  membershipType: string;
  status: MembershipStatus;
  startDate: string;
  endDate: string;
  assignedSeatId?: string;
  assignedSeatNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LibrarySeat {
  seatId: string;
  seatNumber: string; // e.g. "G-01", "F-12"
  floor: string; // "Ground Floor", "1st Floor"
  section: string; // "Section A (Quiet Zone)", "Section B", "Cabin"
  status: SeatStatus;
  assignedUid?: string;
  assignedStudentName?: string;
  assignedStudentUserId?: string;
  notes?: string;
  updatedAt?: string;
}

export interface LibraryBook {
  bookId: string;
  title: string;
  author: string;
  isbn?: string;
  category: string;
  coverImageUrl?: string;
  description?: string;
  totalCopies: number;
  availableCopies: number;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LibraryIssue {
  issueId: string;
  uid: string;
  studentId: string;
  studentName: string;
  bookId: string;
  bookTitle: string;
  issuedAt: string;
  dueDate: string;
  returnedAt?: string;
  status: BookIssueStatus;
  renewalCount: number;
  issuedBy?: string;
  returnedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LibraryAttendance {
  attendanceId: string;
  uid: string;
  studentId: string;
  studentName: string;
  date: string; // YYYY-MM-DD
  status: 'PRESENT' | 'ABSENT';
  checkIn?: string; // HH:mm:ss
  checkOut?: string;
  shift?: string;
  markedBy?: string;
  createdAt: string;
}

export interface GatePass {
  passId: string;
  uid: string;
  studentId: string;
  studentName: string;
  membershipId?: string;
  validFrom: string;
  validUntil: string;
  status: GatePassStatus;
  secureToken: string;
  seatNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeeRecord {
  feeId: string;
  uid: string;
  studentId: string;
  studentName: string;
  title: string;
  amount: number;
  status: FeeStatus;
  dueDate: string;
  paidDate?: string;
  receiptNumber?: string;
  invoiceUrl?: string;
  paymentMode?: string;
  recordedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NoticeItem {
  noticeId: string;
  title: string;
  body: string;
  category: NoticeCategory;
  imageUrl?: string;
  attachmentUrl?: string;
  targetType: NoticeTarget;
  targetId?: string;
  createdAt: string;
  expiresAt?: string;
  isActive: boolean;
  createdBy?: string;
}

export interface NotificationItem {
  notificationId: string;
  title: string;
  message: string;
  imageUrl?: string;
  category?: string;
  targetType: NoticeTarget;
  targetId?: string;
  targetScreen?: string;
  status: 'SENT' | 'SCHEDULED' | 'FAILED';
  recipientCount?: number;
  createdAt: string;
  sentBy?: string;
}

export interface CoachingClass {
  classId: string;
  name: string;
  section?: string;
  stream?: string;
  academicYear?: string;
  createdAt: string;
}

export interface CoachingBatch {
  batchId: string;
  name: string;
  classId: string;
  className?: string;
  timing?: string;
  instructor?: string;
  createdAt: string;
}

export interface StudyMaterial {
  materialId: string;
  title: string;
  description?: string;
  subjectId: string;
  subjectName?: string;
  classId?: string;
  batchId?: string;
  fileUrl: string;
  fileType: 'PDF' | 'Notes' | 'Worksheet' | 'Question Paper' | 'Image' | 'Video';
  thumbnailUrl?: string;
  uploadedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HomeworkAssignment {
  id: string;
  type: 'HOMEWORK' | 'ASSIGNMENT';
  title: string;
  description: string;
  subjectName: string;
  className?: string;
  batchName?: string;
  assignedDate: string;
  dueDate: string;
  attachmentUrl?: string;
  status: 'ACTIVE' | 'CLOSED';
  createdBy?: string;
  createdAt: string;
}

export interface TestRecord {
  testId: string;
  title: string;
  subjectName: string;
  className?: string;
  batchName?: string;
  date: string;
  time: string;
  duration: string;
  syllabus?: string;
  instructions?: string;
  totalMarks: number;
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
}

export interface ResultRecord {
  resultId: string;
  testId: string;
  testTitle: string;
  studentId: string;
  studentName: string;
  subjectName: string;
  marksObtained: number;
  maximumMarks: number;
  percentage: number;
  grade: string;
  remarks?: string;
  createdAt: string;
}

export interface AdminActivityLog {
  logId: string;
  adminUid: string;
  adminName: string;
  adminRole: string;
  action: string;
  targetType: string;
  targetId: string;
  details?: string;
  timestamp: string;
}
