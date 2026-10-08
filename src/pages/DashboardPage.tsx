import React from 'react';
import { 
  Users, 
  Armchair, 
  CalendarCheck, 
  BookOpen, 
  ArrowLeftRight, 
  ReceiptIndianRupee, 
  UserPlus, 
  AlertCircle,
  Plus, 
  QrCode, 
  Bell, 
  FileText, 
  CheckCircle2, 
  TrendingUp,
  Clock,
  Sparkles
} from 'lucide-react';
import { 
  UserProfile, 
  LibrarySeat, 
  LibraryBook, 
  LibraryIssue, 
  JoinRequest, 
  FeeRecord, 
  LibraryAttendance,
  AdminActivityLog 
} from '../types/models';
import { NavTab } from '../components/layout/Sidebar';
import { Badge } from '../components/common/Badge';

interface DashboardPageProps {
  students: UserProfile[];
  seats: LibrarySeat[];
  books: LibraryBook[];
  issues: LibraryIssue[];
  joinRequests: JoinRequest[];
  fees: FeeRecord[];
  todayAttendance: LibraryAttendance[];
  activityLogs: AdminActivityLog[];
  onNavigate: (tab: NavTab) => void;
  onOpenCreateStudent: () => void;
  onOpenScanGatePass: () => void;
  onOpenAttendance: () => void;
  onOpenAddBook: () => void;
  onOpenRecordFee: () => void;
  onOpenNoticeModal: () => void;
  onOpenNotificationModal: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  students = [],
  seats = [],
  books = [],
  issues = [],
  joinRequests = [],
  fees = [],
  todayAttendance = [],
  activityLogs = [],
  onNavigate,
  onOpenCreateStudent,
  onOpenScanGatePass,
  onOpenAttendance,
  onOpenAddBook,
  onOpenRecordFee,
  onOpenNoticeModal,
  onOpenNotificationModal
}) => {
  const safeStudents = Array.isArray(students) ? students.filter(Boolean) : [];
  const safeSeats = Array.isArray(seats) ? seats.filter(Boolean) : [];
  const safeBooks = Array.isArray(books) ? books.filter(Boolean) : [];
  const safeIssues = Array.isArray(issues) ? issues.filter(Boolean) : [];
  const safeJoinRequests = Array.isArray(joinRequests) ? joinRequests.filter(Boolean) : [];
  const safeFees = Array.isArray(fees) ? fees.filter(Boolean) : [];
  const safeTodayAttendance = Array.isArray(todayAttendance) ? todayAttendance.filter(Boolean) : [];
  const safeActivityLogs = Array.isArray(activityLogs) ? activityLogs.filter(Boolean) : [];

  // Real statistical computations from Firebase data
  const totalStudents = safeStudents.length;
  const activeMembers = safeStudents.filter(s => s && s.active && s.membershipStatus === 'ACTIVE').length;
  
  const todayPresent = safeTodayAttendance.filter(a => a && a.status === 'PRESENT').length;

  const totalSeats = safeSeats.length;
  const occupiedSeats = safeSeats.filter(s => s && s.status === 'OCCUPIED').length;
  const availableSeats = safeSeats.filter(s => s && s.status === 'AVAILABLE').length;

  const todayIso = new Date().toISOString().split('T')[0];
  const overdueBooks = safeIssues.filter(i => i && i.status === 'ISSUED' && i.dueDate && i.dueDate < todayIso).length;

  const pendingFeesTotal = safeFees
    .filter(f => f && (f.status === 'PENDING' || f.status === 'OVERDUE'))
    .reduce((sum, f) => sum + (f.amount || 0), 0);

  const newJoinRequests = safeJoinRequests.filter(r => r && r.status === 'NEW').length;

  const kpis = [
    {
      title: 'Total Students',
      value: totalStudents,
      sub: `${activeMembers} active members`,
      icon: Users,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
      tab: 'students' as NavTab
    },
    {
      title: "Today's Attendance",
      value: todayPresent,
      sub: `${todayAttendance.length} students logged`,
      icon: CalendarCheck,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      tab: 'library-attendance' as NavTab
    },
    {
      title: 'Occupied Seats',
      value: `${occupiedSeats} / ${totalSeats}`,
      sub: `${availableSeats} seats vacant`,
      icon: Armchair,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10 border-cyan-500/20',
      tab: 'library-seats' as NavTab
    },
    {
      title: 'Pending Fees',
      value: `₹${pendingFeesTotal.toLocaleString('en-IN')}`,
      sub: `${fees.filter(f => f.status === 'PENDING').length} invoices due`,
      icon: ReceiptIndianRupee,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10 border-yellow-500/20',
      tab: 'fees-billing' as NavTab
    },
    {
      title: 'Overdue Books',
      value: overdueBooks,
      sub: `${issues.filter(i => i.status === 'ISSUED').length} total issued`,
      icon: ArrowLeftRight,
      color: overdueBooks > 0 ? 'text-rose-400' : 'text-slate-300',
      bg: overdueBooks > 0 ? 'bg-rose-500/10 border-rose-500/30' : 'bg-slate-800/40 border-slate-700/40',
      tab: 'library-issues' as NavTab
    },
    {
      title: 'New Join Requests',
      value: newJoinRequests,
      sub: `${joinRequests.length} total applications`,
      icon: UserPlus,
      color: newJoinRequests > 0 ? 'text-amber-300' : 'text-slate-400',
      bg: newJoinRequests > 0 ? 'bg-amber-500/15 border-amber-500/30' : 'bg-slate-800/40 border-slate-700/40',
      tab: 'join-requests' as NavTab
    },
  ];

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-2xl shadow-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-100 tracking-tight">
              Administrative Control Center
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
              LIVE FIRESTORE
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-xl">
            Realtime management for Kalam Library Gursarai. Changes directly synchronize to student Android devices.
          </p>
        </div>

        {/* Quick action buttons row */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenCreateStudent}
            className="px-3.5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-all transform active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <UserPlus size={15} />
            <span>Add Student</span>
          </button>
          <button
            onClick={onOpenScanGatePass}
            className="px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <QrCode size={15} className="text-amber-400" />
            <span>Scan Pass</span>
          </button>
          <button
            onClick={onOpenAttendance}
            className="px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <CalendarCheck size={15} className="text-emerald-400" />
            <span>Mark Attendance</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              onClick={() => onNavigate(kpi.tab)}
              className={`p-4 rounded-xl border transition-all duration-150 cursor-pointer hover:scale-[1.02] shadow-xs flex flex-col justify-between ${kpi.bg}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400 truncate">{kpi.title}</span>
                <Icon size={16} className={kpi.color} />
              </div>
              <div className="my-1">
                <span className={`text-xl lg:text-2xl font-extrabold font-mono ${kpi.color}`}>
                  {kpi.value}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 truncate mt-1">
                {kpi.sub}
              </span>
            </div>
          );
        })}
      </div>

      {/* Quick Action Dock (Section 10 of prompt) */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
          <Sparkles size={14} className="text-amber-400" />
          <span>Rapid Action Modules</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 text-xs">
          
          <button
            onClick={onOpenCreateStudent}
            className="p-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-750 hover:border-amber-500/40 rounded-lg flex flex-col items-center text-center gap-2 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <UserPlus size={16} />
            </div>
            <span className="font-bold text-slate-200">Add Student</span>
          </button>

          <button
            onClick={() => onNavigate('join-requests')}
            className="p-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-750 hover:border-amber-500/40 rounded-lg flex flex-col items-center text-center gap-2 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
              <Users size={16} />
            </div>
            <span className="font-bold text-slate-200">Join Requests</span>
          </button>

          <button
            onClick={onOpenAttendance}
            className="p-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-750 hover:border-amber-500/40 rounded-lg flex flex-col items-center text-center gap-2 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <CalendarCheck size={16} />
            </div>
            <span className="font-bold text-slate-200">Attendance</span>
          </button>

          <button
            onClick={onOpenAddBook}
            className="p-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-750 hover:border-amber-500/40 rounded-lg flex flex-col items-center text-center gap-2 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
              <BookOpen size={16} />
            </div>
            <span className="font-bold text-slate-200">Add Book</span>
          </button>

          <button
            onClick={() => onNavigate('library-seats')}
            className="p-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-750 hover:border-amber-500/40 rounded-lg flex flex-col items-center text-center gap-2 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center">
              <Armchair size={16} />
            </div>
            <span className="font-bold text-slate-200">Assign Seat</span>
          </button>

          <button
            onClick={onOpenNoticeModal}
            className="p-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-750 hover:border-amber-500/40 rounded-lg flex flex-col items-center text-center gap-2 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-300 flex items-center justify-center">
              <FileText size={16} />
            </div>
            <span className="font-bold text-slate-200">Create Notice</span>
          </button>

          <button
            onClick={onOpenNotificationModal}
            className="p-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-750 hover:border-amber-500/40 rounded-lg flex flex-col items-center text-center gap-2 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center">
              <Bell size={16} />
            </div>
            <span className="font-bold text-slate-200">Push Alert</span>
          </button>

          <button
            onClick={onOpenRecordFee}
            className="p-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-750 hover:border-amber-500/40 rounded-lg flex flex-col items-center text-center gap-2 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <ReceiptIndianRupee size={16} />
            </div>
            <span className="font-bold text-slate-200">Record Fee</span>
          </button>

        </div>
      </div>

      {/* Lower Dashboard: Recent Activity Log & Live Study Hall Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Activity Log (Section 9 & 45 of prompt) */}
        <div className="lg:col-span-2 p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Clock size={16} className="text-amber-400" />
              <span>Realtime Administrative Activity Audit</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              adminActivityLogs/
            </span>
          </div>

          <div className="divide-y divide-slate-800 max-h-[360px] overflow-y-auto custom-scrollbar">
            {activityLogs.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                No recent admin activity recorded yet. Actions will populate here in real-time.
              </div>
            ) : (
              activityLogs.map((log) => (
                <div key={log.logId} className="py-3 flex items-start justify-between gap-4 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200">{log.action}</span>
                      <Badge variant="neutral" size="sm">{log.targetType}</Badge>
                    </div>
                    <p className="text-slate-400 text-[11px]">{log.details}</p>
                    <span className="text-[10px] text-slate-500">
                      By: <strong className="text-slate-400">{log.adminName}</strong> ({log.adminRole})
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live Study Hall Desk Glance */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Armchair size={16} className="text-amber-400" />
                <span>Study Hall Occupancy</span>
              </h3>
              <button
                onClick={() => onNavigate('library-seats')}
                className="text-xs text-amber-400 hover:underline font-semibold cursor-pointer"
              >
                View Full Map &rarr;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 bg-slate-800/40 rounded-lg">
                <span className="text-slate-400">Ground Floor (Silent Hall)</span>
                <span className="font-mono font-bold text-slate-100">
                  {safeSeats.filter(s => s && s.floor === 'Ground Floor' && s.status === 'OCCUPIED').length} / {safeSeats.filter(s => s && s.floor === 'Ground Floor').length || 30}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-800/40 rounded-lg">
                <span className="text-slate-400">1st Floor (Cubicles & Cabin)</span>
                <span className="font-mono font-bold text-slate-100">
                  {safeSeats.filter(s => s && s.floor === '1st Floor' && s.status === 'OCCUPIED').length} / {safeSeats.filter(s => s && s.floor === '1st Floor').length || 30}
                </span>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-200 text-xs">
                <strong>Instant Conflict Prevention:</strong> Two students cannot be assigned to the same desk. All seat assignments are locked in database transactions.
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('library-seats')}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            Manage Desks & Allocations
          </button>
        </div>

      </div>

    </div>
  );
};
