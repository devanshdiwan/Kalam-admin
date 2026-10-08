import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardPage } from './pages/DashboardPage';
import { StudentsPage } from './pages/StudentsPage';
import { JoinRequestsPage } from './pages/JoinRequestsPage';
import { SeatGrid } from './components/library/SeatGrid';
import { LibraryBooksPage } from './pages/LibraryBooksPage';
import { LibraryIssuesPage } from './pages/LibraryIssuesPage';
import { LibraryAttendancePage } from './pages/LibraryAttendancePage';
import { GatePassesPage } from './pages/GatePassesPage';
import { CoachingClassesPage } from './pages/CoachingClassesPage';
import { StudyMaterialPage } from './pages/StudyMaterialPage';
import { HomeworkAssignmentsPage } from './pages/HomeworkAssignmentsPage';
import { FeesBillingPage } from './pages/FeesBillingPage';
import { NoticesPage } from './pages/NoticesPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ReportsPage } from './pages/ReportsPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { SettingsPage } from './pages/SettingsPage';

// Modals
import { StudentFormModal } from './components/students/StudentFormModal';
import { StudentDetailDrawer } from './components/students/StudentDetailDrawer';
import { EditStudentModal } from './components/students/EditStudentModal';
import { SeatAssignModal } from './components/students/SeatAssignModal';
import { GatePassValidatorModal } from './components/gatepass/GatePassValidatorModal';
import { BookModal } from './components/library/BookModal';
import { IssueBookModal } from './components/library/IssueBookModal';
import { BulkAttendanceModal } from './components/library/BulkAttendanceModal';
import { FeeModal } from './components/fees/FeeModal';
import { ReceiptViewModal } from './components/fees/ReceiptViewModal';
import { NoticeModal } from './components/notices/NoticeModal';
import { NotificationComposerModal } from './components/notifications/NotificationComposerModal';

// Services
import { subscribeToStudents, syncAllStudentsToServer } from './services/studentService';
import { subscribeToSeats, initializeDefaultSeats } from './services/seatService';
import { subscribeToBooks, subscribeToIssues } from './services/bookService';
import { subscribeToDateAttendance } from './services/attendanceService';
import { subscribeToGatePasses } from './services/gatePassService';
import { subscribeToFees } from './services/feeService';
import { subscribeToNotices } from './services/noticeService';
import { subscribeToNotifications } from './services/notificationService';
import { subscribeToJoinRequests } from './services/joinRequestService';
import { 
  subscribeToClasses, 
  subscribeToBatches, 
  subscribeToStudyMaterials, 
  subscribeToHomework, 
  subscribeToTests, 
  subscribeToResults 
} from './services/coachingService';
import { subscribeToAdminUsers } from './services/adminUserService';
import { getRecentActivityLogs } from './services/auditService';
import { subscribeToQuotaStatus, retryCloudConnection } from './services/firebase';

// Types
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
  AdminUser, 
  AdminActivityLog 
} from './types/models';

export const AppContent: React.FC = () => {
  const { currentUser, loading: authLoading } = useAuth();

  // Navigation State
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [globalSearch, setGlobalSearch] = useState<string>('');

  // Primary Data Collections
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [seats, setSeats] = useState<LibrarySeat[]>([]);
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [issues, setIssues] = useState<LibraryIssue[]>([]);
  const [attendance, setAttendance] = useState<LibraryAttendance[]>([]);
  const [gatePasses, setGatePasses] = useState<GatePass[]>([]);
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [coachingClasses, setCoachingClasses] = useState<CoachingClass[]>([]);
  const [coachingBatches, setCoachingBatches] = useState<CoachingBatch[]>([]);
  const [studyMaterials, setStudyMaterials] = useState<StudyMaterial[]>([]);
  const [homework, setHomework] = useState<HomeworkAssignment[]>([]);
  const [tests, setTests] = useState<TestRecord[]>([]);
  const [results, setResults] = useState<ResultRecord[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [activityLogs, setActivityLogs] = useState<AdminActivityLog[]>([]);

  // Selected date for attendance
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Modals visibility state
  const [showCreateStudentModal, setShowCreateStudentModal] = useState<boolean>(false);
  const [prefilledJoinRequest, setPrefilledJoinRequest] = useState<any>(null);
  const [selectedStudentForDrawer, setSelectedStudentForDrawer] = useState<UserProfile | null>(null);
  const [selectedStudentForEdit, setSelectedStudentForEdit] = useState<UserProfile | null>(null);
  const [showEditStudentModal, setShowEditStudentModal] = useState<boolean>(false);
  const [selectedStudentForSeat, setSelectedStudentForSeat] = useState<UserProfile | null>(null);
  const [showSeatAssignModal, setShowSeatAssignModal] = useState<boolean>(false);
  const [showGatePassValidatorModal, setShowGatePassValidatorModal] = useState<boolean>(false);
  const [showBookModal, setShowBookModal] = useState<boolean>(false);
  const [showIssueModal, setShowIssueModal] = useState<boolean>(false);
  const [preselectedBookForIssue, setPreselectedBookForIssue] = useState<LibraryBook | undefined>(undefined);
  const [showBulkAttendanceModal, setShowBulkAttendanceModal] = useState<boolean>(false);
  const [showFeeModal, setShowFeeModal] = useState<boolean>(false);
  const [preselectedStudentForFee, setPreselectedStudentForFee] = useState<UserProfile | null>(null);
  const [selectedFeeForReceipt, setSelectedFeeForReceipt] = useState<FeeRecord | null>(null);
  const [showNoticeModal, setShowNoticeModal] = useState<boolean>(false);
  const [showNotificationModal, setShowNotificationModal] = useState<boolean>(false);

  // Cloud & Resilient Mode State
  const [quotaExceeded, setQuotaExceeded] = useState<boolean>(false);
  const [isRetryingCloud, setIsRetryingCloud] = useState<boolean>(false);
  const [cloudStatusMsg, setCloudStatusMsg] = useState<string>('');

  useEffect(() => {
    return subscribeToQuotaStatus((exceeded) => {
      setQuotaExceeded(exceeded);
    });
  }, []);

  // Setup Realtime Listeners when authenticated
  useEffect(() => {
    if (!currentUser) return;

    const unsubs: Array<() => void> = [];

    unsubs.push(subscribeToStudents((data) => {
      setStudents(data);
    }));
    unsubs.push(subscribeToSeats((data) => {
      setSeats(data);
    }));
    unsubs.push(subscribeToBooks(setBooks));
    unsubs.push(subscribeToIssues(setIssues));
    unsubs.push(subscribeToDateAttendance(attendanceDate, setAttendance));
    unsubs.push(subscribeToGatePasses(setGatePasses));
    unsubs.push(subscribeToFees(setFees));
    unsubs.push(subscribeToNotices(setNotices));
    unsubs.push(subscribeToNotifications(setNotifications));
    unsubs.push(subscribeToJoinRequests(setJoinRequests));
    unsubs.push(subscribeToClasses(setCoachingClasses));
    unsubs.push(subscribeToBatches(setCoachingBatches));
    unsubs.push(subscribeToStudyMaterials(setStudyMaterials));
    unsubs.push(subscribeToHomework(setHomework));
    unsubs.push(subscribeToTests(setTests));
    unsubs.push(subscribeToResults(setResults));
    unsubs.push(subscribeToAdminUsers(setAdminUsers));

    // Fetch initial activity logs
    refreshActivityLogs();

    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, [currentUser?.uid, attendanceDate]);

  const refreshActivityLogs = async () => {
    const logs = await getRecentActivityLogs(30).catch(() => []);
    if (logs) setActivityLogs(logs);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <div className="w-12 h-12 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-semibold tracking-wider uppercase text-amber-400">
          Connecting to Kalam Library System...
        </p>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage />;
  }

  // Handlers for cross-module interactions
  const handleConvertToStudent = (req: JoinRequest) => {
    setPrefilledJoinRequest({
      name: req.fullName,
      phone: req.phone,
      email: req.email || `${req.phone.replace(/\D/g, '')}@student.kalamlibrary.com`,
      interest: req.interest
    });
    setShowCreateStudentModal(true);
  };

  const handleOpenAssignSeat = (student: UserProfile) => {
    setSelectedStudentForSeat(student);
    setShowSeatAssignModal(true);
  };

  const handleOpenEditStudent = (student: UserProfile) => {
    setSelectedStudentForEdit(student);
    setShowEditStudentModal(true);
  };

  const handleOpenCreateGatePass = (student: UserProfile) => {
    setCurrentTab('gate-passes');
  };

  const handleOpenRecordFeeForStudent = (student: UserProfile) => {
    setPreselectedStudentForFee(student);
    setShowFeeModal(true);
  };

  const handleOpenIssueBook = (book?: LibraryBook) => {
    setPreselectedBookForIssue(book);
    setShowIssueModal(true);
  };

  const pendingRequestsCount = joinRequests.filter(r => r.status === 'NEW').length;
  const todayIso = new Date().toISOString().split('T')[0];
  const overdueCount = issues.filter(i => i.status === 'ISSUED' && i.dueDate && i.dueDate < todayIso).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        pendingJoinRequestsCount={pendingRequestsCount}
        overdueBooksCount={overdueCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          onOpenCreateStudent={() => {
            setPrefilledJoinRequest(null);
            setShowCreateStudentModal(true);
          }}
          onOpenScanGatePass={() => setShowGatePassValidatorModal(true)}
          onOpenAttendance={() => setShowBulkAttendanceModal(true)}
          onOpenGlobalSearch={() => setCurrentTab('students')}
          onOpenAddBook={() => setShowBookModal(true)}
          searchQuery={globalSearch}
          onSearchChange={(q) => {
            setGlobalSearch(q);
            if (currentTab !== 'students') setCurrentTab('students');
          }}
        />

        {/* Resilient Mode Status Banner */}
        {quotaExceeded && (
          <div className="bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/70 border-b border-amber-500/30 px-4 py-2.5 text-xs text-amber-200 flex flex-wrap items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-2.5">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
              <span className="font-semibold text-amber-300">Resilient Mode Active:</span>
              <span className="text-slate-300">
                Cloud sync paused (daily quota limit reached). All features (Students, Seats, Attendance, Fees, Notices) are working seamlessly using local & server storage.
              </span>
            </div>
            <div className="flex items-center gap-3">
              {cloudStatusMsg && (
                <span className="text-amber-300/80 italic text-[11px]">{cloudStatusMsg}</span>
              )}
              <button
                onClick={async () => {
                  setIsRetryingCloud(true);
                  setCloudStatusMsg('Testing connection...');
                  const res = await retryCloudConnection();
                  setIsRetryingCloud(false);
                  setCloudStatusMsg(res.message);
                  setTimeout(() => setCloudStatusMsg(''), 4000);
                }}
                disabled={isRetryingCloud}
                className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded text-[11px] font-medium transition cursor-pointer disabled:opacity-50"
              >
                {isRetryingCloud ? 'Testing...' : 'Check Cloud Connection'}
              </button>
            </div>
          </div>
        )}

        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <DashboardPage
              students={students}
              seats={seats}
              books={books}
              issues={issues}
              joinRequests={joinRequests}
              fees={fees}
              todayAttendance={attendance}
              activityLogs={activityLogs}
              onNavigate={(tab) => setCurrentTab(tab)}
              onOpenCreateStudent={() => {
                setPrefilledJoinRequest(null);
                setShowCreateStudentModal(true);
              }}
              onOpenScanGatePass={() => setShowGatePassValidatorModal(true)}
              onOpenAttendance={() => setShowBulkAttendanceModal(true)}
              onOpenAddBook={() => setShowBookModal(true)}
              onOpenRecordFee={() => {
                setPreselectedStudentForFee(null);
                setShowFeeModal(true);
              }}
              onOpenNoticeModal={() => setShowNoticeModal(true)}
              onOpenNotificationModal={() => setShowNotificationModal(true)}
            />
          )}

          {currentTab === 'students' && (
            <StudentsPage
              students={students}
              seats={seats}
              onOpenCreateStudent={() => {
                setPrefilledJoinRequest(null);
                setShowCreateStudentModal(true);
              }}
              onSelectStudent={(s) => setSelectedStudentForDrawer(s)}
              onOpenEditStudent={handleOpenEditStudent}
              onOpenAssignSeat={handleOpenAssignSeat}
              onOpenCreateGatePass={handleOpenCreateGatePass}
              onOpenRecordFee={handleOpenRecordFeeForStudent}
              onRefresh={refreshActivityLogs}
            />
          )}

          {currentTab === 'join-requests' && (
            <JoinRequestsPage
              joinRequests={joinRequests}
              onConvertToStudent={handleConvertToStudent}
              onRefresh={refreshActivityLogs}
            />
          )}

          {currentTab === 'library-seats' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
                  <span>Study Hall Desk Management</span>
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Interactive layout of Ground Floor and First Floor study hall desks with live occupancy.
                </p>
              </div>
              <SeatGrid
                seats={seats}
                onRefresh={refreshActivityLogs}
              />
            </div>
          )}

          {currentTab === 'library-books' && (
            <LibraryBooksPage
              books={books}
              onOpenAddBook={() => setShowBookModal(true)}
              onOpenIssueModal={handleOpenIssueBook}
            />
          )}

          {currentTab === 'library-issues' && (
            <LibraryIssuesPage
              issues={issues}
              books={books}
              students={students}
              onOpenIssueModal={() => handleOpenIssueBook()}
              onRefresh={refreshActivityLogs}
            />
          )}

          {currentTab === 'library-attendance' && (
            <LibraryAttendancePage
              attendanceRecords={attendance}
              students={students}
              selectedDate={attendanceDate}
              onDateChange={setAttendanceDate}
              onOpenBulkModal={() => setShowBulkAttendanceModal(true)}
              onRefresh={refreshActivityLogs}
            />
          )}

          {currentTab === 'gate-passes' && (
            <GatePassesPage
              gatePasses={gatePasses}
              students={students}
              onOpenValidatorModal={() => setShowGatePassValidatorModal(true)}
              onRefresh={refreshActivityLogs}
            />
          )}

          {currentTab === 'coaching-classes' && (
            <CoachingClassesPage
              classes={coachingClasses}
              batches={coachingBatches}
              onRefresh={refreshActivityLogs}
            />
          )}

          {currentTab === 'study-material' && (
            <StudyMaterialPage
              materials={studyMaterials}
              onRefresh={refreshActivityLogs}
            />
          )}

          {currentTab === 'homework-assignments' && (
            <HomeworkAssignmentsPage
              homework={homework}
              tests={tests}
              results={results}
              students={students}
              onRefresh={refreshActivityLogs}
            />
          )}

          {currentTab === 'fees-billing' && (
            <FeesBillingPage
              fees={fees}
              students={students}
              onOpenCreateFee={() => {
                setPreselectedStudentForFee(null);
                setShowFeeModal(true);
              }}
              onViewReceipt={(fee) => setSelectedFeeForReceipt(fee)}
              onRefresh={refreshActivityLogs}
            />
          )}

          {currentTab === 'notices' && (
            <NoticesPage
              notices={notices}
              onOpenCreateNotice={() => setShowNoticeModal(true)}
              onRefresh={refreshActivityLogs}
            />
          )}

          {currentTab === 'notifications' && (
            <NotificationsPage
              notifications={notifications}
              onOpenComposeModal={() => setShowNotificationModal(true)}
            />
          )}

          {currentTab === 'reports' && (
            <ReportsPage
              students={students}
              seats={seats}
              books={books}
              issues={issues}
              fees={fees}
              attendance={attendance}
            />
          )}

          {currentTab === 'admin-users' && (
            <AdminUsersPage
              adminUsers={adminUsers}
              onRefresh={refreshActivityLogs}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsPage
              seatsCount={seats.length}
              onRefresh={refreshActivityLogs}
            />
          )}
        </main>
      </div>

      {/* Global Modals */}
      <StudentFormModal
        isOpen={showCreateStudentModal}
        onClose={() => setShowCreateStudentModal(false)}
        availableSeats={seats}
        initialData={prefilledJoinRequest}
        onSuccess={(student) => {
          refreshActivityLogs();
          if (student) {
            setStudents(prev => [student, ...prev.filter(s => s.uid !== student.uid && s.userId !== student.userId)]);
            setSelectedStudentForDrawer(student);
          }
        }}
      />

      <StudentDetailDrawer
        student={selectedStudentForDrawer}
        isOpen={selectedStudentForDrawer !== null}
        onClose={() => setSelectedStudentForDrawer(null)}
        onRefresh={() => {
          refreshActivityLogs();
          if (selectedStudentForDrawer) {
            const updated = students.find(s => s.uid === selectedStudentForDrawer.uid);
            if (updated) setSelectedStudentForDrawer(updated);
          }
        }}
        onOpenEditStudent={handleOpenEditStudent}
        onOpenAssignSeat={handleOpenAssignSeat}
        onOpenCreateGatePass={handleOpenCreateGatePass}
        onOpenRecordFee={handleOpenRecordFeeForStudent}
      />

      <EditStudentModal
        isOpen={showEditStudentModal}
        onClose={() => {
          setShowEditStudentModal(false);
          setSelectedStudentForEdit(null);
        }}
        student={selectedStudentForEdit}
        seats={seats}
        onSuccess={() => {
          refreshActivityLogs();
          if (selectedStudentForDrawer && selectedStudentForEdit && selectedStudentForDrawer.uid === selectedStudentForEdit.uid) {
            const updated = students.find(s => s.uid === selectedStudentForEdit.uid);
            if (updated) setSelectedStudentForDrawer(updated);
          }
        }}
      />

      <SeatAssignModal
        isOpen={showSeatAssignModal}
        onClose={() => setShowSeatAssignModal(false)}
        student={selectedStudentForSeat}
        seats={seats}
        onSuccess={refreshActivityLogs}
      />

      <GatePassValidatorModal
        isOpen={showGatePassValidatorModal}
        onClose={() => setShowGatePassValidatorModal(false)}
      />

      <BookModal
        isOpen={showBookModal}
        onClose={() => setShowBookModal(false)}
        onSuccess={refreshActivityLogs}
      />

      <IssueBookModal
        isOpen={showIssueModal}
        onClose={() => setShowIssueModal(false)}
        books={preselectedBookForIssue ? [preselectedBookForIssue, ...books.filter(b => b.bookId !== preselectedBookForIssue.bookId)] : books}
        students={students}
        onSuccess={refreshActivityLogs}
      />

      <BulkAttendanceModal
        isOpen={showBulkAttendanceModal}
        onClose={() => setShowBulkAttendanceModal(false)}
        students={students}
        onSuccess={refreshActivityLogs}
      />

      <FeeModal
        isOpen={showFeeModal}
        onClose={() => setShowFeeModal(false)}
        students={students}
        preselectedStudent={preselectedStudentForFee}
        onSuccess={refreshActivityLogs}
      />

      <ReceiptViewModal
        isOpen={selectedFeeForReceipt !== null}
        onClose={() => setSelectedFeeForReceipt(null)}
        fee={selectedFeeForReceipt}
      />

      <NoticeModal
        isOpen={showNoticeModal}
        onClose={() => setShowNoticeModal(false)}
        onSuccess={(newNotice) => {
          refreshActivityLogs();
          if (newNotice) {
            setNotices(prev => [newNotice, ...prev.filter(n => n.noticeId !== newNotice.noticeId)]);
          }
        }}
      />

      <NotificationComposerModal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        onSuccess={(newNotif) => {
          refreshActivityLogs();
          if (newNotif) {
            setNotifications(prev => [newNotif, ...prev.filter(n => n.notificationId !== newNotif.notificationId)]);
          }
        }}
      />

    </div>
  );
};

export default function App() {
  return (
    <AppContent />
  );
}
